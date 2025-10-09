/**
 * CSV Loader para GitHub Pages
 * Carrega dados CSV diretamente dos arquivos estáticos
 */

class CSVLoader {
    constructor() {
        // Verificar se CONFIG está disponível
        if (typeof CONFIG === 'undefined') {
            console.error('❌ CONFIG não está disponível. Verifique se config.js foi carregado.');
            throw new Error('CONFIG não está disponível');
        }
        
        // Usar caminho relativo em localhost, URL completa no GitHub Pages
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.baseUrl = isLocalhost ? '' : (CONFIG.GITHUB_PAGES.BASE_URL || '');
        this.dataPath = isLocalhost ? 'data/' : '/data/';
        
        // Cache para melhorar performance
        this.cache = {
            solicitacoes: null,
            fotografos: null,
            clientes: null,
            redes: null,
            lastUpdate: null
        };
        
        this.cacheTimeout = CONFIG.CACHE.TIMEOUT || 5 * 60 * 1000; // 5 minutos
        this.isLoading = false;
        
        // Callbacks para eventos
        this.onLoadStart = null;
        this.onLoadComplete = null;
        this.onError = null;
        
        console.log('📋 CSV Loader inicializado', { baseUrl: this.baseUrl, dataPath: this.dataPath });
    }

    /**
     * Carrega dados de um arquivo CSV
     * @param {string} filename - Nome do arquivo CSV
     * @param {Object} options - Opções de carregamento
     * @returns {Promise<Array>} Array de objetos com os dados
     */
    async loadCSV(filename, options = {}) {
        const cacheKey = filename.replace('.csv', '').toLowerCase();
        const { 
            pageSize = 100, 
            loadAll = false,
            startRow = 0 
        } = options;
        
        // Verificar cache
        if (this.isCacheValid(cacheKey) && loadAll) {
            console.log(`📋 Dados de ${filename} carregados do cache`);
            return this.cache[cacheKey];
        }

        const url = `${this.baseUrl}${this.dataPath}${filename}`;
        
        try {
            this.isLoading = true;
            if (this.onLoadStart) this.onLoadStart(filename);
            
            console.log(`🔄 Carregando ${filename} de: ${url}`);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Verificar tamanho do arquivo
            const contentLength = response.headers.get('content-length');
            const isLargeFile = contentLength && parseInt(contentLength) > 1024 * 1024; // > 1MB
            
            let parsedData;
            if (isLargeFile && !loadAll) {
                console.log(`📊 Arquivo grande detectado (${Math.round(contentLength/1024/1024)}MB), carregando primeiras ${pageSize} linhas...`);
                parsedData = await this.loadCSVPaginated(response, pageSize, startRow);
            } else if (isLargeFile) {
                console.log(`📊 Arquivo grande detectado (${Math.round(contentLength/1024/1024)}MB), usando carregamento otimizado...`);
                parsedData = await this.loadLargeCSV(response);
            } else {
                const csvText = await response.text();
                parsedData = this.parseCSV(csvText);
            }
            
            // Atualizar cache apenas se carregou tudo
            if (loadAll) {
                this.cache[cacheKey] = parsedData;
                this.cache.lastUpdate = Date.now();
            }
            
            console.log(`✅ ${filename} carregado: ${parsedData.length} registros`);
            
            if (this.onLoadComplete) this.onLoadComplete(filename, parsedData);
            
            return parsedData;
            
        } catch (error) {
            console.error(`❌ Erro ao carregar ${filename}:`, error);
            
            if (this.onError) this.onError(filename, error);
            
            // Retornar dados do cache se disponível, mesmo expirado
            if (this.cache[cacheKey]) {
                console.warn(`⚠️ Usando dados em cache (possivelmente desatualizados) para ${filename}`);
                return this.cache[cacheKey];
            }
            
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Carrega CSV de forma paginada para arquivos grandes
     */
    async loadCSVPaginated(response, pageSize = 100, startRow = 0) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let csvText = '';
        let receivedLength = 0;
        const contentLength = parseInt(response.headers.get('content-length') || '0');

        // Carregar o arquivo completo primeiro (necessário para paginação)
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            receivedLength += value.length;
            csvText += decoder.decode(value, { stream: true });
            
            // Mostrar progresso
            if (contentLength > 0) {
                const progress = Math.round((receivedLength / contentLength) * 100);
                if (progress % 25 === 0) {
                    console.log(`📊 Download: ${progress}%`);
                }
            }
        }

        // Processar apenas a página solicitada
        return await this.parseCSVPaginated(csvText, pageSize, startRow);
    }

    /**
     * Parse CSV paginado para mostrar dados rapidamente
     * Agora com ordenação cronológica - dados mais recentes primeiro
     */
    async parseCSVPaginated(csvText, pageSize, startRow) {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log(`🔄 Processando página ${Math.floor(startRow/pageSize) + 1}...`);
                
                const lines = csvText.split('\n');
                const headers = lines[0].split(';');
                
                // Encontrar índice da coluna de data
                const dateColumnIndex = headers.findIndex(header => 
                    header.toLowerCase().includes('created at') || 
                    header.toLowerCase().includes('data') ||
                    header.toLowerCase().includes('inclusao')
                );
                
                console.log(`📅 Coluna de data encontrada no índice: ${dateColumnIndex} (${headers[dateColumnIndex]})`);
                
                // Processar todas as linhas de dados (exceto cabeçalho)
                const dataLines = lines.slice(1).filter(line => line.trim());
                
                // Ordenar por data (mais recentes primeiro)
                if (dateColumnIndex !== -1) {
                    dataLines.sort((a, b) => {
                        const dateA = this.parseDate(a.split(';')[dateColumnIndex]);
                        const dateB = this.parseDate(b.split(';')[dateColumnIndex]);
                        return dateB - dateA; // Ordem decrescente (mais recente primeiro)
                    });
                    console.log(`📊 Dados ordenados cronologicamente (${dataLines.length} registros)`);
                }
                
                // Aplicar paginação após ordenação
                const startIndex = startRow;
                const endIndex = startIndex + pageSize;
                const pageLines = dataLines.slice(startIndex, endIndex);
                
                // Converter para objetos
                const result = pageLines.map(line => {
                    const values = this.parseCSVLine(line);
                    const obj = {};
                    headers.forEach((header, index) => {
                        obj[header.trim()] = values[index] || '';
                    });
                    return obj;
                });
                
                console.log(`✅ Página processada: ${result.length} registros (${startIndex + 1}-${startIndex + result.length} de ${dataLines.length})`);
                
                // Adicionar metadados sobre paginação
                result._pagination = {
                    currentPage: Math.floor(startRow/pageSize) + 1,
                    pageSize: pageSize,
                    totalRecords: dataLines.length,
                    hasMore: endIndex < dataLines.length,
                    isChronological: dateColumnIndex !== -1
                };
                
                resolve(result);
            }, 0);
        });
    }

    /**
     * Converte string de data para objeto Date para ordenação
     */
    parseDate(dateString) {
        if (!dateString || dateString.trim() === '') {
            return new Date(0); // Data muito antiga para registros sem data
        }
        
        // Tentar diferentes formatos de data
        const formats = [
            // ISO format: 2024-07-31 09:42:49
            /(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/,
            // Brazilian format: 31/07/2024
            /(\d{2})\/(\d{2})\/(\d{4})/,
            // Other formats
            /(\d{4})\/(\d{2})\/(\d{2})/
        ];
        
        for (const format of formats) {
            const match = dateString.match(format);
            if (match) {
                if (format === formats[0]) { // ISO format
                    return new Date(dateString);
                } else if (format === formats[1]) { // Brazilian format
                    return new Date(`${match[3]}-${match[2]}-${match[1]}`);
                } else if (format === formats[2]) { // YYYY/MM/DD
                    return new Date(dateString.replace(/\//g, '-'));
                }
            }
        }
        
        // Fallback: tentar parse direto
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? new Date(0) : date;
    }

    /**
     * Carrega arquivos CSV grandes usando streaming
     */
    async loadLargeCSV(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let csvText = '';
        let receivedLength = 0;
        const contentLength = parseInt(response.headers.get('content-length') || '0');

        while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            receivedLength += value.length;
            csvText += decoder.decode(value, { stream: true });
            
            // Mostrar progresso para arquivos grandes
            if (contentLength > 0) {
                const progress = Math.round((receivedLength / contentLength) * 100);
                if (progress % 20 === 0) { // Log a cada 20%
                    console.log(`📊 Progresso: ${progress}%`);
                }
            }
        }

        // Processar em chunks para não travar o browser
        return await this.parseCSVAsync(csvText);
    }

    /**
     * Parse CSV de forma assíncrona para não bloquear a UI
     */
    async parseCSVAsync(csvText) {
        return new Promise((resolve) => {
            // Usar setTimeout para não bloquear a UI
            setTimeout(() => {
                console.log('🔄 Processando dados CSV...');
                const data = this.parseCSV(csvText);
                console.log('✅ Processamento concluído');
                resolve(data);
            }, 10);
        });
    }

    /**
     * Parse CSV text para array de objetos
     * @param {string} csvText - Texto CSV
     * @returns {Array} Array de objetos
     */
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return [];
        
        const headers = this.parseCSVLine(lines[0]);
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                data.push(row);
            }
        }
        
        return data;
    }

    /**
     * Parse uma linha CSV considerando aspas e vírgulas
     * @param {string} line - Linha CSV
     * @returns {Array} Array de valores
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    /**
     * Verifica se o cache é válido
     * @param {string} key - Chave do cache
     * @returns {boolean}
     */
    isCacheValid(key) {
        if (!CONFIG.CACHE.ENABLED) return false;
        
        const data = this.cache[key];
        const lastUpdate = this.cache.lastUpdate;
        
        return data && lastUpdate && (Date.now() - lastUpdate) < this.cacheTimeout;
    }

    /**
     * Limpa o cache
     */
    clearCache() {
        this.cache = {
            solicitacoes: null,
            fotografos: null,
            clientes: null,
            redes: null,
            lastUpdate: null
        };
        console.log('🗑️ Cache limpo');
    }

    // ========================================
    // MÉTODOS DE COMPATIBILIDADE
    // ========================================

    /**
     * Carrega dados de solicitações
     * @returns {Promise<Array>}
     */
    async loadSolicitacoes() {
        return await this.loadCSV('Solicitacao.csv');
    }

    /**
     * Carrega dados de fotógrafos
     * @returns {Promise<Array>}
     */
    async loadFotografos() {
        return await this.loadCSV('Fotografos.csv');
    }

    /**
     * Carrega dados de clientes
     * @returns {Promise<Array>}
     */
    async loadClientes() {
        return await this.loadCSV('Clientes.csv');
    }

    /**
     * Carrega dados de redes
     * @returns {Promise<Array>}
     */
    async loadRedes() {
        return await this.loadCSV('Rede.csv');
    }

    /**
     * Carrega todos os dados necessários
     * @returns {Promise<Object>}
     */
    async loadAllData() {
        try {
            const [solicitacoes, fotografos, clientes, redes] = await Promise.all([
                this.loadSolicitacoes(),
                this.loadFotografos(),
                this.loadClientes(),
                this.loadRedes()
            ]);

            return {
                solicitacoes,
                fotografos,
                clientes,
                redes
            };
        } catch (error) {
            console.error('❌ Erro ao carregar todos os dados:', error);
            throw error;
        }
    }

    /**
     * Filtra solicitações por status
     * @param {Array} solicitacoes - Array de solicitações
     * @param {string|Array} status - Status para filtrar
     * @returns {Array}
     */
    filterByStatus(solicitacoes, status) {
        if (!Array.isArray(status)) {
            status = [status];
        }
        
        return solicitacoes.filter(item => 
            status.includes(item.Status) || status.includes(item['Status da Solicitacao'])
        );
    }

    /**
     * Filtra solicitações por fotógrafo
     * @param {Array} solicitacoes - Array de solicitações
     * @param {string} fotografo - Nome do fotógrafo
     * @returns {Array}
     */
    filterByFotografo(solicitacoes, fotografo) {
        return solicitacoes.filter(item => 
            item.Fotografo === fotografo || item['Nome do Fotografo'] === fotografo
        );
    }

    /**
     * Filtra solicitações por data
     * @param {Array} solicitacoes - Array de solicitações
     * @param {Date} dataInicio - Data de início
     * @param {Date} dataFim - Data de fim
     * @returns {Array}
     */
    filterByDate(solicitacoes, dataInicio, dataFim) {
        return solicitacoes.filter(item => {
            const dataAgendamento = new Date(item['Data do agendamento'] || item['Data Agendamento']);
            return dataAgendamento >= dataInicio && dataAgendamento <= dataFim;
        });
    }
}

// Inicialização automática quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    if (typeof CONFIG !== 'undefined') {
        window.csvLoader = new CSVLoader();
        console.log('🚀 CSV Loader pronto para uso');
    } else {
        console.error('❌ CONFIG não encontrado. Certifique-se de carregar config.js primeiro');
    }
});

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CSVLoader;
}