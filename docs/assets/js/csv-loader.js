/**
 * CSV Loader para GitHub Pages
 * Carrega dados CSV diretamente dos arquivos estáticos
 */

class CSVLoader {
    constructor() {
        this.baseUrl = CONFIG.GITHUB_PAGES.BASE_URL || '';
        this.dataPath = '/data/';
        
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
        
        console.log('📋 CSV Loader inicializado');
    }

    /**
     * Carrega dados de um arquivo CSV
     * @param {string} filename - Nome do arquivo CSV
     * @returns {Promise<Array>} Array de objetos com os dados
     */
    async loadCSV(filename) {
        const cacheKey = filename.replace('.csv', '').toLowerCase();
        
        // Verificar cache
        if (this.isCacheValid(cacheKey)) {
            console.log(`📋 Dados de ${filename} carregados do cache`);
            return this.cache[cacheKey];
        }

        const url = `${this.baseUrl}${this.dataPath}${filename}`;
        
        try {
            this.isLoading = true;
            if (this.onLoadStart) this.onLoadStart(filename);
            
            console.log(`🔄 Carregando ${filename}...`);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const csvText = await response.text();
            const parsedData = this.parseCSV(csvText);
            
            // Atualizar cache
            this.cache[cacheKey] = parsedData;
            this.cache.lastUpdate = Date.now();
            
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