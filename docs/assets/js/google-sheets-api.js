/**
 * Google Sheets API Loader
 * Substitui o csv-loader.js para integração com Google Sheets
 * Mantém compatibilidade com o código existente
 */

/**
 * Classe principal para integração com Google Sheets API
 * Fornece funcionalidades de carregamento, cache e fallback para dados de planilhas
 * @class GoogleSheetsAPI
 */
class GoogleSheetsAPI {
    /**
     * Construtor da classe GoogleSheetsAPI
     * Inicializa configurações, cache e callbacks para integração com Google Sheets
     * @constructor
     */
    constructor() {
        this.spreadsheetId = CONFIG.GOOGLE_SHEETS.SPREADSHEET_ID;
        this.apiKey = CONFIG.GOOGLE_SHEETS.API_KEY;
        this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
        
        // Cache para melhorar performance
        this.cache = {
            solicitacoes: null,
            fotografos: null,
            clientes: null,
            redes: null,
            lastUpdate: null
        };
        
        this.cacheTimeout = CONFIG.CACHE.TIMEOUT;
        this.isLoading = false;
        
        // Callbacks para eventos
        this.onLoadStart = null;
        this.onLoadComplete = null;
        this.onError = null;
        
        console.log('🔗 Google Sheets API inicializada');
    }

    /**
     * Carrega dados de uma aba específica do Google Sheets
     * @param {string} sheetName - Nome da aba
     * @param {string} range - Range de células (padrão: A:Z)
     * @returns {Promise<Array>} Array de objetos com os dados
     */
    /**
     * Carrega dados de uma planilha com sistema de fallback híbrido
     * Prioridade: Google Sheets → Backup Local → CSV estático (docs/data/) → Cache expirado
     * @param {string} sheetName - Nome da aba/planilha
     * @param {string} range - Intervalo de células (padrão: A:ZZ)
     * @returns {Promise<Array>} Array de objetos com os dados
     */
    async loadSheetData(sheetName, range = 'A:ZZ') {
        const cacheKey = sheetName.toLowerCase();
        
        // Ler parâmetros de query para controlar fonte e cache
        const params = new URLSearchParams(window.location.search || '');
        const forcedSourceParam = params.get('source');
        const forcedSource = forcedSourceParam ? forcedSourceParam.toLowerCase() : null; // 'csv' | 'backup' | 'google'
        let noCache = params.get('nocache') === '1';
        // Se forçado google, também ignorar cache
        if (forcedSource === 'google') {
            noCache = true;
        }
    
        // Verificar cache válido somente quando NÃO houver força de fonte e NÃO houver nocache
        if (!noCache && !forcedSource && this.isCacheValid(cacheKey)) {
            console.log(`📋 Dados de ${sheetName} carregados do cache`);
            this.updateDataSourceIndicator('cache');
            return this.cache[cacheKey];
        }
    
        // Se fonte forçada para CSV estático
        if (forcedSource === 'csv') {
            try {
                console.log(`🔄 Forçando fonte CSV estático para ${sheetName}.csv via parâmetro ?source=csv`);
                const csvData = await this.loadStaticCSV(sheetName);
                this.cache[cacheKey] = csvData;
                this.cache.lastUpdate = Date.now();
                console.log(`✅ ${sheetName} carregado do CSV estático (forçado): ${csvData.length} registros`);
                this.updateDataSourceIndicator('csv-static');
                if (this.onLoadComplete) this.onLoadComplete(sheetName, csvData);
                return csvData;
            } catch (csvError) {
                console.error(`❌ Erro ao carregar CSV estático (forçado) para ${sheetName}:`, csvError);
                // Tentar fallback para backup local
                if (window.dataSyncManager) {
                    try {
                        console.log(`🔄 Tentando fallback para backup local após falha no CSV estático (forçado): ${sheetName}`);
                        const backupData = await window.dataSyncManager.loadBackupData(sheetName);
                        if (backupData && backupData.length > 0) {
                            this.cache[cacheKey] = backupData;
                            this.cache.lastUpdate = Date.now();
                            console.log(`✅ ${sheetName} carregado do backup local (fallback): ${backupData.length} registros`);
                            this.updateDataSourceIndicator('backup');
                            if (this.onLoadComplete) this.onLoadComplete(sheetName, backupData);
                            return backupData;
                        }
                    } catch (backupError) {
                        console.error(`❌ Erro ao carregar backup local (fallback) para ${sheetName}:`, backupError);
                    }
                }
                // Último recurso: cache expirado
                if (this.cache[cacheKey]) {
                    console.warn(`⚠️ Usando dados em cache expirado para ${sheetName} (após falha CSV forçado)`);
                    this.updateDataSourceIndicator('cache');
                    return this.cache[cacheKey];
                }
                if (this.onError) this.onError(sheetName, csvError);
                throw new Error(`Falha em todas as fontes de dados (forçado CSV) para ${sheetName}: CSV estático, backup local e cache`);
            }
        }
    
        // Se fonte forçada para backup local
        if (forcedSource === 'backup') {
            // Tentar carregar backup local primeiro
            if (window.dataSyncManager) {
                try {
                    console.log(`🔄 Forçando fonte backup local para ${sheetName} via parâmetro ?source=backup`);
                    const backupData = await window.dataSyncManager.loadBackupData(sheetName);
                    if (backupData && backupData.length > 0) {
                        this.cache[cacheKey] = backupData;
                        this.cache.lastUpdate = Date.now();
                        console.log(`✅ ${sheetName} carregado do backup local (forçado): ${backupData.length} registros`);
                        this.updateDataSourceIndicator('backup');
                        if (this.onLoadComplete) this.onLoadComplete(sheetName, backupData);
                        return backupData;
                    }
                } catch (backupError) {
                    console.error(`❌ Erro ao carregar backup local (forçado) para ${sheetName}:`, backupError);
                }
            } else {
                console.warn('⚠️ DataSyncManager não disponível para carregar backup local');
            }
            // Fallback para CSV estático
            try {
                console.log(`🔄 Tentando fallback para CSV estático após falha no backup (forçado): ${sheetName}.csv`);
                const csvData = await this.loadStaticCSV(sheetName);
                this.cache[cacheKey] = csvData;
                this.cache.lastUpdate = Date.now();
                console.log(`✅ ${sheetName} carregado do CSV estático (fallback): ${csvData.length} registros`);
                this.updateDataSourceIndicator('csv-static');
                if (this.onLoadComplete) this.onLoadComplete(sheetName, csvData);
                return csvData;
            } catch (csvError) {
                console.error(`❌ Erro ao carregar CSV estático (fallback) para ${sheetName}:`, csvError);
                // Último recurso: cache expirado
                if (this.cache[cacheKey]) {
                    console.warn(`⚠️ Usando dados em cache expirado para ${sheetName} (após falha backup forçado)`);
                    this.updateDataSourceIndicator('cache');
                    return this.cache[cacheKey];
                }
                if (this.onError) this.onError(sheetName, csvError);
                throw new Error(`Falha em todas as fontes de dados (forçado backup) para ${sheetName}: backup local, CSV estático e cache`);
            }
        }

        const url = `${this.baseUrl}/${this.spreadsheetId}/values/${sheetName}!${range}?key=${this.apiKey}`;
        
        try {
            this.isLoading = true;
            if (this.onLoadStart) this.onLoadStart(sheetName);
            
            console.log(`🔄 Carregando ${sheetName} do Google Sheets...`);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            const parsedData = this.parseSheetResponse(data);
            
            // Atualizar cache
            this.cache[cacheKey] = parsedData;
            this.cache.lastUpdate = Date.now();
            
            console.log(`✅ ${sheetName} carregado do Google Sheets: ${parsedData.length} registros`);
            
            this.updateDataSourceIndicator('google-sheets');
            
            if (this.onLoadComplete) this.onLoadComplete(sheetName, parsedData);
            
            return parsedData;
            
        } catch (error) {
            console.error(`❌ Erro ao carregar ${sheetName} do Google Sheets:`, error);
            
            // FALLBACK 1: Tentar carregar backup local do Data Sync Manager
            if (window.dataSyncManager) {
                try {
                    console.log(`🔄 Tentando fallback para backup local: ${sheetName}`);
                    const backupData = await window.dataSyncManager.loadBackupData(sheetName);
                    
                    if (backupData && backupData.length > 0) {
                        // Atualizar cache com dados do backup
                        this.cache[cacheKey] = backupData;
                        this.cache.lastUpdate = Date.now();
                        
                        console.log(`✅ ${sheetName} carregado do backup local: ${backupData.length} registros`);
                        
                        this.updateDataSourceIndicator('backup');
                        
                        if (this.onLoadComplete) this.onLoadComplete(sheetName, backupData);
                        
                        return backupData;
                    }
                } catch (backupError) {
                    console.error(`❌ Erro ao carregar backup local para ${sheetName}:`, backupError);
                }
            }
            
            // FALLBACK 2: Tentar carregar CSV estático de docs/data/
            try {
                console.log(`🔄 Tentando fallback para CSV estático: ${sheetName}.csv`);
                const csvData = await this.loadStaticCSV(sheetName);
                
                // Atualizar cache com dados do CSV
                this.cache[cacheKey] = csvData;
                this.cache.lastUpdate = Date.now();
                
                console.log(`✅ ${sheetName} carregado do CSV estático: ${csvData.length} registros`);
                
                this.updateDataSourceIndicator('csv-static');
                
                if (this.onLoadComplete) this.onLoadComplete(sheetName, csvData);
                
                return csvData;
                
            } catch (csvError) {
                console.error(`❌ Erro ao carregar CSV estático para ${sheetName}:`, csvError);
                
                // FALLBACK 3: Usar cache expirado se disponível
                if (this.cache[cacheKey]) {
                    console.warn(`⚠️ Usando dados em cache expirado para ${sheetName}`);
                    this.updateDataSourceIndicator('cache');
                    return this.cache[cacheKey];
                }
                
                if (this.onError) this.onError(sheetName, error);
                throw new Error(`Falha em todas as fontes de dados para ${sheetName}: Google Sheets, CSV estático e cache`);
            }
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Atualiza o indicador visual da fonte de dados
     * @param {string} source - Fonte atual ('google-sheets', 'backup', 'csv-static', 'cache')
     */
    updateDataSourceIndicator(source) {
        if (window.dataSyncManager && window.dataSyncManager.updateDataSourceIndicator) {
            const indicator = document.getElementById('data-source-indicator');
            if (indicator) {
                window.dataSyncManager.updateDataSourceIndicator(indicator, source);
            }
        }
    }

    /**
     * Carrega dados de um arquivo CSV estático em docs/data/
     * @param {string} sheetName - Nome da planilha (usado como nome do arquivo)
     * @returns {Promise<Array>} Array de objetos com os dados do CSV
     */
    async loadStaticCSV(sheetName) {
        // Mapear nome da planilha para arquivo CSV correto e resolver caminho absoluto do GH Pages
        const filename = this.getCsvFilenameFromSheetName(sheetName);
        const isLocalhost = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        const basePath = !isLocalhost && (CONFIG.GITHUB_PAGES && CONFIG.GITHUB_PAGES.BASE_URL)
            ? `${CONFIG.GITHUB_PAGES.BASE_URL}/data/`
            : (window.location.pathname.includes('/agendamentos/') ? '../data/' : './data/');
        const csvUrl = `${basePath}${filename}`;
        
        const response = await fetch(csvUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText} para ${csvUrl}`);
        }
        
        const csvText = await response.text();
        return this.parseCSV(csvText);
    }

    /**
     * Converte texto CSV em array de objetos
     * @param {string} csvText - Texto do arquivo CSV
     * @returns {Array} Array de objetos
     */
    parseCSV(csvText) {
        // Parser robusto que suporta separador ';' (Excel) e aspas
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length === 0) return [];
        
        const headers = this.parseCSVLine(lines[0]);
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length >= headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    if (header) row[header] = values[index] || '';
                });
                data.push(row);
            }
        }
        
        return data;
    }

    /**
     * Parser para linha CSV considerando aspas, escape de aspas e separador ';' ou ','
     * @param {string} line
     * @returns {string[]}
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        let i = 0;
        // Detectar separador dinamicamente: padrão ';' (Excel). Caso não haja ';', usar ','
        const sep = line.includes(';') ? ';' : ',';

        while (i < line.length) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Escapar aspas duplas dentro de campo entre aspas
                    current += '"';
                    i += 2;
                    continue;
                }
                inQuotes = !inQuotes;
            } else if (char === sep && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
            i++;
        }
        result.push(current.trim());
        return result;
    }

    /**
     * Converte resposta da API em array de objetos
     * @param {Object} response - Resposta da Google Sheets API
     * @returns {Array} Array de objetos
     */
    parseSheetResponse(response) {
        if (!response.values || response.values.length === 0) {
            return [];
        }

        const [rawHeaders, ...rows] = response.values;
        const headers = rawHeaders.map(h => (h || '').trim());
        
        return rows.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                if (header) { // Apenas adicionar se o cabeçalho não for vazio
                    obj[header] = row[index] || '';
                }
            });
            return obj;
        });
    }

    /**
     * Verifica se o cache é válido
     * @param {string} key - Chave do cache
     * @returns {boolean}
     */
    isCacheValid(key) {
        if (!CONFIG.CACHE.ENABLED) return false;
        if (!this.cache[key] || !this.cache.lastUpdate) return false;
        
        const elapsed = Date.now() - this.cache.lastUpdate;
        return elapsed < this.cacheTimeout;
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
    // MÉTODOS DE COMPATIBILIDADE COM CSV-LOADER
    // ========================================

    /**
     * Carrega solicitações com filtros opcionais
     * @param {Object} filters - Filtros a aplicar
     * @returns {Promise<Array>}
     */
    async getSolicitacoes(filters = {}) {
        const data = await this.loadSheetData(CONFIG.GOOGLE_SHEETS.SHEETS.SOLICITACOES);
        return this.applyFilters(data, filters);
    }

    /**
     * Carrega lista de fotógrafos
     * @returns {Promise<Array>}
     */
    async getFotografos() {
        return await this.loadSheetData(CONFIG.GOOGLE_SHEETS.SHEETS.FOTOGRAFOS);
    }

    /**
     * Carrega lista de clientes usando URL específica
     * Utiliza URL específica se configurada, caso contrário usa a configuração padrão
     * @returns {Promise<Array>} Array de objetos com dados dos clientes
     */
    async getClientes() {
        // Usar URL específica se configurada
        if (CONFIG.GOOGLE_SHEETS.SHEET_URLS && CONFIG.GOOGLE_SHEETS.SHEET_URLS.CLIENTES) {
            return await this.loadSheetDataFromUrl(CONFIG.GOOGLE_SHEETS.SHEET_URLS.CLIENTES, 'CLIENTES');
        }
        return await this.loadSheetData(CONFIG.GOOGLE_SHEETS.SHEETS.CLIENTES);
    }

    /**
     * Carrega lista de redes usando URL específica
     * Utiliza URL específica se configurada, caso contrário usa a configuração padrão
     * @returns {Promise<Array>} Array de objetos com dados das redes
     */
    async getRedes() {
        // Usar URL específica se configurada
        if (CONFIG.GOOGLE_SHEETS.SHEET_URLS && CONFIG.GOOGLE_SHEETS.SHEET_URLS.REDE) {
            return await this.loadSheetDataFromUrl(CONFIG.GOOGLE_SHEETS.SHEET_URLS.REDE, 'REDE');
        }
        return await this.loadSheetData(CONFIG.GOOGLE_SHEETS.SHEETS.REDES);
    }

    /**
     * Carrega dados de uma planilha usando URL específica
     * Extrai o spreadsheet ID da URL e faz a requisição para a aba específica
     * @param {string} sheetUrl - URL da planilha específica
     * @param {string} sheetName - Nome da aba para cache
     * @param {string} range - Range de células (padrão: A:Z)
     * @returns {Promise<Array>} Array de objetos com os dados
     */
    async loadSheetDataFromUrl(sheetUrl, sheetName, range = 'A:Z') {
        const cacheKey = sheetName.toLowerCase();
        
        // Verificar cache
        if (this.isCacheValid(cacheKey)) {
            console.log(`📋 Dados de ${sheetName} carregados do cache`);
            return this.cache[cacheKey];
        }

        // Extrair spreadsheet ID e gid da URL
        const urlMatch = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+).*gid=([0-9]+)/);
        if (!urlMatch) {
            throw new Error(`URL inválida para ${sheetName}: ${sheetUrl}`);
        }

        const [, spreadsheetId, gid] = urlMatch;
        
        // Mapear o nome da aba baseado no sheetName
        let actualSheetName;
        if (sheetName.toLowerCase() === 'rede') {
            actualSheetName = 'Rede';
        } else if (sheetName.toLowerCase() === 'clientes') {
            actualSheetName = 'Clientes';
        } else {
            actualSheetName = sheetName;
        }
        
        // Construir URL da API usando o spreadsheet ID e aba específica
        const url = `${this.baseUrl}/${spreadsheetId}/values/${actualSheetName}!${range}?key=${this.apiKey}`;
        
        try {
            this.isLoading = true;
            if (this.onLoadStart) this.onLoadStart(sheetName);
            
            console.log(`🔄 Carregando ${sheetName} (${actualSheetName}) do Google Sheets (URL específica)...`);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            const parsedData = this.parseSheetResponse(data);
            
            // Atualizar cache
            this.cache[cacheKey] = parsedData;
            this.cache.lastUpdate = Date.now();
            
            console.log(`✅ ${sheetName} carregado: ${parsedData.length} registros`);
            
            if (this.onLoadComplete) this.onLoadComplete(sheetName, parsedData);
            
            return parsedData;
            
        } catch (error) {
            console.error(`❌ Erro ao carregar ${sheetName}:`, error);
            
            if (this.onError) this.onError(sheetName, error);
            
            // Retornar dados do cache se disponível, mesmo expirado
            if (this.cache[cacheKey]) {
                console.warn(`⚠️ Usando dados em cache (possivelmente desatualizados) para ${sheetName}`);
                return this.cache[cacheKey];
            }
            
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Aplica filtros aos dados carregados
     * Suporta filtros por array (OR), data, string (case insensitive) e valores exatos
     * @param {Array} data - Dados para filtrar
     * @param {Object} filters - Filtros a aplicar
     * @returns {Array} Dados filtrados
     */
    applyFilters(data, filters) {
        if (!filters || Object.keys(filters).length === 0) {
            return data;
        }

        return data.filter(item => {
            return Object.entries(filters).every(([key, value]) => {
                if (value === null || value === undefined) return true;
                
                const itemValue = item[key];
                
                // Filtro por array (OR)
                if (Array.isArray(value)) {
                    return value.some(v => {
                        if (v === '' || v === null) {
                            return itemValue === '' || itemValue === null || itemValue === undefined;
                        }
                        return itemValue === v;
                    });
                }
                
                // Filtro por data
                if (key.toLowerCase().includes('data')) {
                    return this.filterByDate(itemValue, value);
                }
                
                // Filtro por string (case insensitive)
                if (typeof value === 'string') {
                    return itemValue.toLowerCase().includes(value.toLowerCase());
                }
                
                // Filtro exato
                return itemValue === value;
            });
        });
    }

    /**
     * Filtro específico para campos de data
     * Suporta filtros predefinidos (today, tomorrow, this_week) e datas específicas
     * @param {string} itemDate - Data do item a ser filtrado
     * @param {string|Date} filterValue - Valor do filtro de data
     * @returns {boolean} True se o item passa no filtro
     */
    filterByDate(itemDate, filterValue) {
        if (!itemDate) return false;
        
        const today = new Date();
        const itemDateObj = new Date(itemDate);
        
        switch (filterValue) {
            case 'today':
                return itemDateObj.toDateString() === today.toDateString();
            case 'tomorrow':
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                return itemDateObj.toDateString() === tomorrow.toDateString();
            case 'this_week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                return itemDateObj >= weekStart && itemDateObj <= weekEnd;
            default:
                // Filtro por data específica
                if (filterValue instanceof Date) {
                    return itemDateObj.toDateString() === filterValue.toDateString();
                }
                // Filtro por string de data
                return itemDate.includes(filterValue);
        }
    }

    // ========================================
    // MÉTODOS PARA ATUALIZAÇÃO DE DADOS
    // ========================================

    /**
     * Atualiza um registro específico (requer Google Apps Script)
     * @param {string} sheetName - Nome da aba
     * @param {string} recordId - ID do registro
     * @param {Object} updateData - Dados para atualizar
     * @returns {Promise<boolean>}
     */
    async updateRecord(sheetName, recordId, updateData) {
        // NOTA: Esta funcionalidade requer um Google Apps Script
        // para fazer a ponte entre a API pública e a escrita na planilha
        
        console.warn('⚠️ updateRecord não implementado - requer Google Apps Script');
        console.log('Dados que seriam atualizados:', { sheetName, recordId, updateData });
        
        // Simular sucesso para desenvolvimento
        if (CONFIG.DEV.MOCK_DATA) {
            console.log('🔧 Simulando atualização bem-sucedida (modo desenvolvimento)');
            return true;
        }
        
        throw new Error('Atualização de dados requer implementação de Google Apps Script');
    }

    // ========================================
    // MÉTODOS UTILITÁRIOS
    // ========================================

    /**
     * Obtém estatísticas dos dados
     * @param {Array} data - Dados para analisar
     * @returns {Object}
     */
    getStatistics(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return { total: 0 };
        }

        const stats = {
            total: data.length,
            byStatus: {},
            byFotografo: {},
            today: 0,
            thisWeek: 0
        };

        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());

        data.forEach(item => {
            // Estatísticas por status
            const status = item['Status'] || 'Sem Status';
            stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

            // Estatísticas por fotógrafo
            const fotografo = item['Fotografo'] || 'Não Definido';
            stats.byFotografo[fotografo] = (stats.byFotografo[fotografo] || 0) + 1;

            // Estatísticas por data
            const dataAgendamento = item['Data do agendamento'];
            if (dataAgendamento) {
                const dataObj = new Date(dataAgendamento);
                if (dataObj.toDateString() === today.toDateString()) {
                    stats.today++;
                }
                if (dataObj >= weekStart) {
                    stats.thisWeek++;
                }
            }
        });

        return stats;
    }

    /**
     * Força recarregamento de todos os dados
     * @returns {Promise<Object>}
     */
    async forceReload() {
        this.clearCache();
        
        const results = {};
        
        try {
            results.solicitacoes = await this.getSolicitacoes();
            results.fotografos = await this.getFotografos();
            results.clientes = await this.getClientes();
            results.redes = await this.getRedes();
            
            console.log('🔄 Recarregamento completo realizado');
            return results;
        } catch (error) {
            console.error('❌ Erro no recarregamento:', error);
            throw error;
        }
    }

    /**
     * Verifica se a API está funcionando
     * @returns {Promise<boolean>}
     */
    async healthCheck() {
        try {
            const testUrl = `${this.baseUrl}/${this.spreadsheetId}?key=${this.apiKey}`;
            const response = await fetch(testUrl);
            
            if (response.ok) {
                console.log('✅ Google Sheets API está funcionando');
                return true;
            } else {
                console.error('❌ Google Sheets API retornou erro:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ Erro na verificação da API:', error);
            return false;
        }
    }

    /**
     * Mapeia nome da planilha para arquivo CSV correspondente
     * @param {string} sheetName
     * @returns {string}
     */
    getCsvFilenameFromSheetName(sheetName) {
        const map = {
            [CONFIG.GOOGLE_SHEETS.SHEETS.SOLICITACOES]: 'Solicitacao.csv',
            [CONFIG.GOOGLE_SHEETS.SHEETS.FOTOGRAFOS]: 'Fotografos.csv',
            [CONFIG.GOOGLE_SHEETS.SHEETS.CLIENTES]: 'Clientes.csv',
            [CONFIG.GOOGLE_SHEETS.SHEETS.REDES]: 'Rede.csv',
            [CONFIG.GOOGLE_SHEETS.SHEETS.CONFIGURACAO]: 'Configuracao.csv'
        };
        return map[sheetName] || `${sheetName}.csv`;
    }
}


// Inicialização automática quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    if (typeof CONFIG !== 'undefined') {
        window.googleSheetsAPI = new GoogleSheetsAPI();
        console.log('🚀 Google Sheets API pronta para uso');
    } else {
        console.error('❌ CONFIG não encontrado. Certifique-se de carregar config.js primeiro');
    }
});

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoogleSheetsAPI;
}