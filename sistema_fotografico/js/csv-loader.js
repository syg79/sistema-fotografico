/**
 * CSV Loader - Módulo para carregar e gerenciar todos os CSVs do sistema
 * Integra: Solicitacao, Clientes, Fotografos, Rede, Corretores, CodigoVitrine, Regioes
 */

class CSVLoader {
    constructor() {
        this.csvData = {
            solicitacao: [],
            clientes: [],
            fotografos: [],
            rede: [],
            corretores: [],
            codigoVitrine: [],
            regioes: []
        };
        
        this.csvFiles = {
            solicitacao: 'csv_output/Solicitacao.csv',
            clientes: 'csv_output/Clientes.csv',
            fotografos: 'csv_output/Fotografos.csv',
            rede: 'csv_output/Rede.csv',
            corretores: 'csv_output/Corretores.csv',
            codigoVitrine: 'csv_output/CodigoVitrine.csv',
            regioes: 'csv_output/Regioes.csv'
        };
        
        this.isLoaded = false;
        this.loadingPromise = null;
    }

    /**
     * Carrega todos os CSVs necessários
     */
    async loadAllCSVs() {
        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = this._loadCSVs();
        return this.loadingPromise;
    }

    async _loadCSVs() {
        try {
            console.log('🔄 Carregando todos os CSVs...');
            
            const loadPromises = Object.entries(this.csvFiles).map(async ([key, file]) => {
                try {
                    const data = await this.loadCSV(file);
                    this.csvData[key] = data;
                    console.log(`✅ ${key}: ${data.length} registros carregados`);
                    return { key, success: true, count: data.length };
                } catch (error) {
                    console.error(`❌ Erro ao carregar ${key}:`, error);
                    this.csvData[key] = [];
                    return { key, success: false, error: error.message };
                }
            });

            const results = await Promise.all(loadPromises);
            this.isLoaded = true;
            
            const summary = results.reduce((acc, result) => {
                if (result.success) {
                    acc.loaded++;
                    acc.totalRecords += result.count;
                } else {
                    acc.failed++;
                }
                return acc;
            }, { loaded: 0, failed: 0, totalRecords: 0 });

            console.log(`📊 Resumo do carregamento: ${summary.loaded} CSVs carregados, ${summary.failed} falharam, ${summary.totalRecords} registros totais`);
            
            return {
                success: true,
                summary,
                data: this.csvData
            };

        } catch (error) {
            console.error('❌ Erro geral no carregamento dos CSVs:', error);
            throw error;
        }
    }

    /**
     * Carrega um arquivo CSV específico
     */
    async loadCSV(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const csvText = await response.text();
            return this.parseCSV(csvText);
        } catch (error) {
            console.error(`Erro ao carregar CSV ${filePath}:`, error);
            throw error;
        }
    }

    /**
     * Parse do CSV com tratamento de encoding e separadores
     */
    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length === 0) return [];

        const headers = this.parseCSVLine(lines[0]);
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header.trim()] = values[index] ? values[index].trim() : '';
                });
                data.push(row);
            }
        }

        return data;
    }

    /**
     * Parse de uma linha CSV considerando aspas e separadores
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ';' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }

    // ==================== MÉTODOS DE ACESSO AOS DADOS ====================

    /**
     * Obtém dados de solicitações com filtros
     */
    getSolicitacoes(filters = {}) {
        let data = this.csvData.solicitacao;
        
        if (filters.status) {
            data = data.filter(item => item.Status === filters.status);
        }
        
        if (filters.rede) {
            data = data.filter(item => item.Rede === filters.rede);
        }
        
        if (filters.fotografo) {
            data = data.filter(item => item.Fotografo === filters.fotografo);
        }
        
        if (filters.dataInicio && filters.dataFim) {
            data = data.filter(item => {
                const dataItem = new Date(item['Data/Hora inclusao']);
                return dataItem >= new Date(filters.dataInicio) && dataItem <= new Date(filters.dataFim);
            });
        }
        
        return data;
    }

    /**
     * Obtém lista de clientes
     */
    getClientes() {
        return this.csvData.clientes;
    }

    /**
     * Obtém lista de fotógrafos
     */
    getFotografos() {
        return this.csvData.fotografos;
    }

    /**
     * Obtém lista de redes
     */
    getRedes() {
        return this.csvData.rede;
    }

    /**
     * Obtém lista de corretores
     */
    getCorretores() {
        return this.csvData.corretores;
    }

    /**
     * Obtém códigos vitrine
     */
    getCodigosVitrine() {
        return this.csvData.codigoVitrine;
    }

    /**
     * Obtém regiões
     */
    getRegioes() {
        return this.csvData.regioes;
    }

    // ==================== MÉTODOS DE ESTATÍSTICAS ====================

    /**
     * Calcula estatísticas gerais do sistema
     */
    getStatistics() {
        const solicitacoes = this.csvData.solicitacao;
        
        const stats = {
            totalSolicitacoes: solicitacoes.length,
            pendentes: solicitacoes.filter(s => s.Status === 'Pendente').length,
            agendados: solicitacoes.filter(s => s.Status === 'Agendado').length,
            realizados: solicitacoes.filter(s => s.Status === 'Realizado').length,
            totalClientes: this.csvData.clientes.length,
            totalFotografos: this.csvData.fotografos.length,
            totalRedes: this.csvData.rede.length
        };

        // Estatísticas por rede
        stats.porRede = {};
        this.csvData.rede.forEach(rede => {
            const nomeRede = rede.Nome || rede.Rede;
            stats.porRede[nomeRede] = solicitacoes.filter(s => s.Rede === nomeRede).length;
        });

        // Estatísticas por fotógrafo
        stats.porFotografo = {};
        this.csvData.fotografos.forEach(fotografo => {
            const nomeFotografo = fotografo.Nome || fotografo.Fotografo;
            stats.porFotografo[nomeFotografo] = solicitacoes.filter(s => s.Fotografo === nomeFotografo).length;
        });

        return stats;
    }

    /**
     * Obtém dados recentes para o dashboard
     */
    getRecentData(limit = 10) {
        const solicitacoes = this.csvData.solicitacao
            .sort((a, b) => new Date(b['Data/Hora inclusao']) - new Date(a['Data/Hora inclusao']))
            .slice(0, limit);

        return {
            recentSolicitacoes: solicitacoes,
            recentAgendamentos: solicitacoes.filter(s => s.Status === 'Agendado'),
            recentRealizados: solicitacoes.filter(s => s.Status === 'Realizado')
        };
    }

    // ==================== MÉTODOS UTILITÁRIOS ====================

    /**
     * Verifica se os dados estão carregados
     */
    isDataLoaded() {
        return this.isLoaded;
    }

    /**
     * Força recarregamento dos dados
     */
    async reload() {
        this.isLoaded = false;
        this.loadingPromise = null;
        this.csvData = {
            solicitacao: [],
            clientes: [],
            fotografos: [],
            rede: [],
            corretores: [],
            codigoVitrine: [],
            regioes: []
        };
        
        return await this.loadAllCSVs();
    }

    /**
     * Obtém informações sobre o carregamento
     */
    getLoadInfo() {
        return {
            isLoaded: this.isLoaded,
            recordCounts: Object.entries(this.csvData).reduce((acc, [key, data]) => {
                acc[key] = data.length;
                return acc;
            }, {})
        };
    }
}

// Instância global do CSV Loader
window.csvLoader = new CSVLoader();

// Auto-carregamento quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.csvLoader.loadAllCSVs();
        console.log('✅ Todos os CSVs carregados com sucesso!');
        
        // Dispara evento personalizado para notificar outros módulos
        window.dispatchEvent(new CustomEvent('csvDataLoaded', {
            detail: window.csvLoader.getLoadInfo()
        }));
        
    } catch (error) {
        console.error('❌ Erro ao carregar CSVs:', error);
        
        // Dispara evento de erro
        window.dispatchEvent(new CustomEvent('csvDataError', {
            detail: { error: error.message }
        }));
    }
});

// Exporta para uso em outros módulos
window.CSVLoader = CSVLoader;