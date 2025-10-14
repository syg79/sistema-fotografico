/**
 * Data Loader para Google Sheets
 * Carrega dados exclusivamente do Google Sheets
 */

class DataLoader {
    constructor() {
        this.dataSource = 'google-sheets'; // Forçar apenas Google Sheets
        this.googleSheetsAPI = null;
        
        console.log(`🔄 Data Loader inicializado com fonte: ${this.dataSource}`);
        
        // Inicializar o Google Sheets API
        this.initializeLoader();
    }
    
    async initializeLoader() {
        // Usar apenas Google Sheets API
        if (typeof window.googleSheetsAPI !== 'undefined') {
            this.googleSheetsAPI = window.googleSheetsAPI;
        } else {
            console.warn('⚠️ Google Sheets API não encontrada, tentando carregar...');
        }
    }
    
    /**
     * Carrega solicitações do Google Sheets
     * @param {Object} filters - Filtros opcionais
     * @returns {Promise<Array>} Array de solicitações
     */
    async loadSolicitacoes(filters = {}) {
        try {
            if (!this.googleSheetsAPI) {
                throw new Error('Google Sheets API não disponível');
            }
            return await this.googleSheetsAPI.getSolicitacoes(filters);
        } catch (error) {
            console.error('❌ Erro ao carregar solicitações:', error);
            throw error;
        }
    }
    
    /**
     * Carrega fotógrafos do Google Sheets
     * @returns {Promise<Array>} Array de fotógrafos
     */
    async loadFotografos() {
        try {
            if (!this.googleSheetsAPI) {
                throw new Error('Google Sheets API não disponível');
            }
            return await this.googleSheetsAPI.getFotografos();
        } catch (error) {
            console.error('❌ Erro ao carregar fotógrafos:', error);
            throw error;
        }
    }
    
    /**
     * Carrega solicitações do Google Sheets com paginação
     * @param {Object} filters - Filtros a aplicar
     * @param {Object} options - Opções de paginação
     * @returns {Promise<Array>} Array de solicitações
     */
    async loadSolicitacoesPaginated(filters = {}, options = {}) {
        try {
            if (!this.googleSheetsAPI) {
                throw new Error('Google Sheets API não disponível');
            }
            return await this.googleSheetsAPI.getSolicitacoes(filters, options);
        } catch (error) {
            console.error('❌ Erro ao carregar solicitações paginadas:', error);
            throw error;
        }
    }
    
    /**
     * Carrega clientes do Google Sheets
     * @returns {Promise<Array>} Array de clientes
     */
    async loadClientes() {
        try {
            if (!this.googleSheetsAPI) {
                throw new Error('Google Sheets API não disponível');
            }
            return await this.googleSheetsAPI.getClientes();
        } catch (error) {
            console.error('❌ Erro ao carregar clientes:', error);
            throw error;
        }
    }
    
    /**
     * Carrega redes do Google Sheets
     * @returns {Promise<Array>} Array de redes
     */
    async loadRedes() {
        try {
            if (!this.googleSheetsAPI) {
                throw new Error('Google Sheets API não disponível');
            }
            return await this.googleSheetsAPI.getRedes();
        } catch (error) {
            console.error('❌ Erro ao carregar redes:', error);
            throw error;
        }
    }
    
    /**
     * Atualiza um registro no Google Sheets
     * @param {string} recordId - ID do registro
     * @param {Object} data - Dados para atualizar
     * @returns {Promise<Object>} Resultado da atualização
     */
    async updateRecord(recordId, data) {
        try {
            if (!this.googleSheetsAPI) {
                throw new Error('Google Sheets API não disponível');
            }
            return await this.googleSheetsAPI.updateRecord(recordId, data);
        } catch (error) {
            console.error('❌ Erro ao atualizar registro:', error);
            throw error;
        }
    }
    
    /**
     * Calcula estatísticas dos dados
     * @param {Array} data - Array de dados
     * @returns {Object} Estatísticas calculadas
     */
    calculateStatistics(data) {
        const today = new Date().toISOString().split('T')[0];
        const stats = {
            total: data.length,
            today: 0,
            byStatus: {}
        };

        data.forEach(item => {
            // Contar por status
            const status = item.Status || item['Status da Solicitacao'] || 'Não definido';
            stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

            // Contar agendamentos de hoje
            const dataAgendamento = item['Data do agendamento'] || item['Data Agendamento'];
            if (dataAgendamento && dataAgendamento.includes(today)) {
                stats.today++;
            }
        });

        return stats;
    }
    
    /**
     * Obtém informações sobre a fonte de dados atual
     * @returns {Object} Informações da fonte
     */
    getDataSourceInfo() {
        return {
            source: this.dataSource,
            available: !!this.googleSheetsAPI,
            config: CONFIG.GOOGLE_SHEETS
        };
    }
}

// Inicializar o Data Loader global
window.dataLoader = new DataLoader();
console.log('🚀 Data Loader para Google Sheets pronto para uso');

// Compatibilidade com módulos Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataLoader;
}