/**
 * Google Sheets API Loader
 * Substitui o csv-loader.js para integração com Google Sheets
 * Mantém compatibilidade com o código existente
 */

class GoogleSheetsAPI {
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
    async loadSheetData(sheetName, range = 'A:Z') {
        const cacheKey = sheetName.toLowerCase();
        
        // Verificar cache
        if (this.isCacheValid(cacheKey)) {
            console.log(`📋 Dados de ${sheetName} carregados do cache`);
            return this.cache[cacheKey];
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
     * Converte resposta da API em array de objetos
     * @param {Object} response - Resposta da Google Sheets API
     * @returns {Array} Array de objetos
     */
    parseSheetResponse(response) {
        if (!response.values || response.values.length === 0) {
            return [];
        }

        const [headers, ...rows] = response.values;
        
        return rows.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = row[index] || '';
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
     * Carrega lista de clientes
     * @returns {Promise<Array>}
     */
    async getClientes() {
        return await this.loadSheetData(CONFIG.GOOGLE_SHEETS.SHEETS.CLIENTES);
    }

    /**
     * Carrega lista de redes
     * @returns {Promise<Array>}
     */
    async getRedes() {
        return await this.loadSheetData(CONFIG.GOOGLE_SHEETS.SHEETS.REDES);
    }

    /**
     * Aplica filtros aos dados
     * @param {Array} data - Dados para filtrar
     * @param {Object} filters - Filtros a aplicar
     * @returns {Array}
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
     * Filtro específico para datas
     * @param {string} itemDate - Data do item
     * @param {string} filterValue - Valor do filtro
     * @returns {boolean}
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