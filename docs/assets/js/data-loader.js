/**
 * Data Loader Híbrido
 * Carrega dados de CSV local ou Google Sheets baseado na configuração
 */

class DataLoader {
    constructor() {
        this.dataSource = CONFIG.DATA_SOURCE || 'csv';
        this.csvLoader = null;
        this.googleSheetsAPI = null;
        
        console.log(`🔄 Data Loader inicializado com fonte: ${this.dataSource}`);
        
        // Inicializar o loader apropriado
        this.initializeLoader();
    }
    
    async initializeLoader() {
        if (this.dataSource === 'csv') {
            // Usar CSV Loader
            if (typeof window.csvLoader !== 'undefined') {
                this.csvLoader = window.csvLoader;
            } else {
                console.warn('⚠️ CSV Loader não encontrado, tentando carregar...');
            }
        } else if (this.dataSource === 'google-sheets') {
            // Usar Google Sheets API
            if (typeof window.googleSheetsAPI !== 'undefined') {
                this.googleSheetsAPI = window.googleSheetsAPI;
            } else {
                console.warn('⚠️ Google Sheets API não encontrada, tentando carregar...');
            }
        }
    }
    
    /**
     * Carrega solicitações da fonte configurada
     * @param {Object} filters - Filtros opcionais
     * @returns {Promise<Array>} Array de solicitações
     */
    async loadSolicitacoes(filters = {}) {
        try {
            if (this.dataSource === 'csv') {
                if (!this.csvLoader) {
                    throw new Error('CSV Loader não disponível');
                }
                return await this.csvLoader.loadSolicitacoes();
            } else if (this.dataSource === 'google-sheets') {
                if (!this.googleSheetsAPI) {
                    throw new Error('Google Sheets API não disponível');
                }
                return await this.googleSheetsAPI.getSolicitacoes(filters);
            }
            
            throw new Error(`Fonte de dados não suportada: ${this.dataSource}`);
        } catch (error) {
            console.error('❌ Erro ao carregar solicitações:', error);
            throw error;
        }
    }
    
    /**
     * Carrega fotógrafos da fonte configurada
     * @returns {Promise<Array>} Array de fotógrafos
     */
    async loadFotografos() {
        try {
            if (this.dataSource === 'csv') {
                if (!this.csvLoader) {
                    throw new Error('CSV Loader não disponível');
                }
                return await this.csvLoader.loadFotografos();
            } else if (this.dataSource === 'google-sheets') {
                if (!this.googleSheetsAPI) {
                    throw new Error('Google Sheets API não disponível');
                }
                return await this.googleSheetsAPI.getFotografos();
            }
            
            throw new Error(`Fonte de dados não suportada: ${this.dataSource}`);
        } catch (error) {
            console.error('❌ Erro ao carregar fotógrafos:', error);
            throw error;
        }
    }
    
    /**
     * Carrega solicitações da fonte configurada com paginação
     * @param {Object} filters - Filtros a aplicar
     * @param {Object} options - Opções de paginação
     * @returns {Promise<Array>} Array de solicitações
     */
    async loadSolicitacoesPaginated(filters = {}, options = {}) {
        try {
            if (this.dataSource === 'csv') {
                if (!this.csvLoader) {
                    throw new Error('CSV Loader não disponível');
                }
                return await this.csvLoader.loadCSV('Solicitacao.csv', options);
            } else if (this.dataSource === 'google-sheets') {
                if (!this.googleSheetsAPI) {
                    throw new Error('Google Sheets API não disponível');
                }
                // Google Sheets não suporta paginação nativa, carregar tudo
                return await this.googleSheetsAPI.getSolicitacoes();
            }
            
            throw new Error(`Fonte de dados não suportada: ${this.dataSource}`);
        } catch (error) {
            console.error('❌ Erro ao carregar solicitações paginadas:', error);
            throw error;
        }
    }

    /**
     * Carrega clientes da fonte configurada
     * @returns {Promise<Array>} Array de clientes
     */
    async loadClientes() {
        try {
            if (this.dataSource === 'csv') {
                if (!this.csvLoader) {
                    throw new Error('CSV Loader não disponível');
                }
                return await this.csvLoader.loadClientes();
            } else if (this.dataSource === 'google-sheets') {
                if (!this.googleSheetsAPI) {
                    throw new Error('Google Sheets API não disponível');
                }
                return await this.googleSheetsAPI.getClientes();
            }
            
            throw new Error(`Fonte de dados não suportada: ${this.dataSource}`);
        } catch (error) {
            console.error('❌ Erro ao carregar clientes:', error);
            throw error;
        }
    }
    
    /**
     * Carrega redes da fonte configurada
     * @returns {Promise<Array>} Array de redes
     */
    async loadRedes() {
        try {
            if (this.dataSource === 'csv') {
                if (!this.csvLoader) {
                    throw new Error('CSV Loader não disponível');
                }
                return await this.csvLoader.loadRedes();
            } else if (this.dataSource === 'google-sheets') {
                if (!this.googleSheetsAPI) {
                    throw new Error('Google Sheets API não disponível');
                }
                return await this.googleSheetsAPI.getRedes();
            }
            
            throw new Error(`Fonte de dados não suportada: ${this.dataSource}`);
        } catch (error) {
            console.error('❌ Erro ao carregar redes:', error);
            throw error;
        }
    }
    
    /**
     * Atualiza um registro (apenas para Google Sheets)
     * @param {string} recordId - ID do registro
     * @param {Object} data - Dados para atualizar
     * @returns {Promise<Object>} Resultado da atualização
     */
    async updateRecord(recordId, data) {
        if (this.dataSource === 'csv') {
            console.warn('⚠️ Atualização de registros não suportada para CSV local');
            return { success: false, message: 'Atualização não suportada para CSV local' };
        } else if (this.dataSource === 'google-sheets') {
            if (!this.googleSheetsAPI) {
                throw new Error('Google Sheets API não disponível');
            }
            return await this.googleSheetsAPI.updateRecord(recordId, data);
        }
        
        throw new Error(`Fonte de dados não suportada: ${this.dataSource}`);
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
            available: this.dataSource === 'csv' ? !!this.csvLoader : !!this.googleSheetsAPI,
            config: this.dataSource === 'csv' ? CONFIG.CSV_FILES : CONFIG.GOOGLE_SHEETS
        };
    }
}

// Inicializar o Data Loader global
window.dataLoader = new DataLoader();
console.log('🚀 Data Loader híbrido pronto para uso');

// Compatibilidade com módulos Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataLoader;
}