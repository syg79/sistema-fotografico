/**
 * Sistema de Integração Excel - Sistema Fotográfico
 * Conecta o sistema fotográfico com os arquivos CSV/Excel existentes
 * Substitui a integração com Tadabase
 */

class ExcelIntegration {
    constructor() {
        this.basePath = '../data/';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
        this.lastUpdate = new Map();
        
        // Mapeamento dos arquivos CSV
        this.files = {
            solicitacoes: 'Solicitacao.csv',
            fotografos: 'Fotografos.csv',
            clientes: 'Clientes.csv',
            corretores: 'Corretores.csv',
            rede: 'Rede.csv',
            regioes: 'Regioes.csv'
        };

        // Status mapping para compatibilidade
        this.statusMapping = {
            'Agendado': 'agendado',
            'Realizado': 'realizado',
            'Cancelado': 'cancelado',
            'Pendente': 'pendente',
            'Em andamento': 'em_andamento',
            'Conferido': 'conferido',
            'Faturado': 'faturado'
        };

        this.init();
    }

    async init() {
        console.log('🔄 Inicializando integração Excel...');
        try {
            await this.loadAllData();
            console.log('✅ Integração Excel inicializada com sucesso');
        } catch (error) {
            console.error('❌ Erro ao inicializar integração Excel:', error);
        }
    }

    /**
     * Carrega todos os dados dos arquivos CSV
     */
    async loadAllData() {
        const promises = Object.entries(this.files).map(async ([key, filename]) => {
            try {
                const data = await this.loadCSV(filename);
                this.cache.set(key, data);
                this.lastUpdate.set(key, Date.now());
                console.log(`📊 ${key}: ${data.length} registros carregados`);
            } catch (error) {
                console.error(`❌ Erro ao carregar ${filename}:`, error);
                this.cache.set(key, []);
            }
        });

        await Promise.all(promises);
    }

    /**
     * Carrega um arquivo CSV específico
     */
    async loadCSV(filename) {
        try {
            const response = await fetch(`${this.basePath}${filename}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const text = await response.text();
            return this.parseCSV(text);
        } catch (error) {
            console.error(`Erro ao carregar ${filename}:`, error);
            throw error;
        }
    }

    /**
     * Parser CSV personalizado para lidar com separadores e encoding
     */
    parseCSV(text) {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length === 0) return [];

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
     * Parser para linha CSV considerando aspas e separadores
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        let i = 0;

        while (i < line.length) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i += 2;
                    continue;
                }
                inQuotes = !inQuotes;
            } else if (char === ';' && !inQuotes) {
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
     * Verifica se o cache precisa ser atualizado
     */
    needsRefresh(key) {
        const lastUpdate = this.lastUpdate.get(key) || 0;
        return (Date.now() - lastUpdate) > this.cacheTimeout;
    }

    /**
     * Obtém dados com cache automático
     */
    async getData(key, forceRefresh = false) {
        if (forceRefresh || this.needsRefresh(key)) {
            try {
                const data = await this.loadCSV(this.files[key]);
                this.cache.set(key, data);
                this.lastUpdate.set(key, Date.now());
            } catch (error) {
                console.error(`Erro ao atualizar ${key}:`, error);
            }
        }

        return this.cache.get(key) || [];
    }

    // ==================== MÉTODOS ESPECÍFICOS ====================

    /**
     * Obtém todas as solicitações
     */
    async getSolicitacoes(filters = {}) {
        const data = await this.getData('solicitacoes');
        let filtered = [...data];

        // Aplicar filtros
        if (filters.status) {
            filtered = filtered.filter(item => 
                this.normalizeStatus(item.Status) === filters.status
            );
        }

        if (filters.fotografo) {
            filtered = filtered.filter(item => 
                item.Fotografo && item.Fotografo.toLowerCase().includes(filters.fotografo.toLowerCase())
            );
        }

        if (filters.dataInicio && filters.dataFim) {
            filtered = filtered.filter(item => {
                const dataAgendamento = new Date(item['Data do agendamento']);
                const inicio = new Date(filters.dataInicio);
                const fim = new Date(filters.dataFim);
                return dataAgendamento >= inicio && dataAgendamento <= fim;
            });
        }

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(item => 
                Object.values(item).some(value => 
                    value && value.toString().toLowerCase().includes(searchTerm)
                )
            );
        }

        return filtered.map(item => this.formatSolicitacao(item));
    }

    /**
     * Obtém uma solicitação específica por ID
     */
    async getSolicitacao(id) {
        const data = await this.getData('solicitacoes');
        const item = data.find(s => s['ID Solicitacao'] === id.toString());
        return item ? this.formatSolicitacao(item) : null;
    }

    /**
     * Obtém todos os fotógrafos
     */
    async getFotografos() {
        const data = await this.getData('fotografos');
        return data.map(item => this.formatFotografo(item));
    }

    /**
     * Obtém um fotógrafo específico
     */
    async getFotografo(nome) {
        const data = await this.getData('fotografos');
        const item = data.find(f => 
            f.nome_do_fotografo && f.nome_do_fotografo.toLowerCase() === nome.toLowerCase()
        );
        return item ? this.formatFotografo(item) : null;
    }

    /**
     * Obtém estatísticas do sistema
     */
    async getEstatisticas() {
        const solicitacoes = await this.getData('solicitacoes');
        const hoje = new Date().toISOString().split('T')[0];
        const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const stats = {
            total: solicitacoes.length,
            agendados: solicitacoes.filter(s => this.normalizeStatus(s.Status) === 'agendado').length,
            realizados: solicitacoes.filter(s => this.normalizeStatus(s.Status) === 'realizado').length,
            pendentes: solicitacoes.filter(s => this.normalizeStatus(s.Status) === 'pendente').length,
            hoje: solicitacoes.filter(s => s['Data do agendamento'] === hoje).length,
            amanha: solicitacoes.filter(s => s['Data do agendamento'] === amanha).length,
            semana: this.getCountByDateRange(solicitacoes, 7),
            mes: this.getCountByDateRange(solicitacoes, 30)
        };

        return stats;
    }

    // ==================== MÉTODOS DE FORMATAÇÃO ====================

    /**
     * Formata uma solicitação para o padrão do sistema
     */
    formatSolicitacao(item) {
        return {
            id: item['ID Solicitacao'],
            recordId: item['Record ID'],
            status: this.normalizeStatus(item.Status),
            rede: item.Rede,
            cliente: item['Nome Cliente'],
            endereco: item['Endereco do Imovel'],
            complemento: item.Complemento,
            bairro: item['Bairro/Localidade'],
            tipoImovel: item['Tipo do Imovel'],
            dataAgendamento: item['Data do agendamento'],
            horarioSessao: item['Horario da Sessao'],
            fotografo: item.Fotografo,
            corretor: item['Corretor Responsavel'],
            contato1: item['Contato para agendar 01'],
            contato2: item['Contato para agendar 02'],
            observacoes: item['Observacao para o Agendamento'],
            observacoesFotografo: item['Observacao para o Fotografo'],
            tipoServico: item['Tipo do Servico'],
            fazerAreaComum: item['Fazer Area Comum'],
            dataRealizada: item['Data Realizada'],
            feedback: item['Feedback da Sessao (fotografo, gestor e/ou editor)'],
            codigoVitrine: item['Codigo Vitrine'],
            quilometragem: item.Quilometragem,
            tour360: item['Tour 360'],
            quantidadeFotos: item['Quantidade de sess�es FOTO'],
            quantidadeVideo: item['Quantidade video'],
            quantidadeDrone: item['Quantidade Drone (video)'],
            dataEntregue: item['Data Entregue'],
            horaPartiu: item['Hora PARTIU'],
            horaChegou: item['Hora CHEGOU'],
            horaFinalizou: item['Hora FINALIZOU'],
            linkGoogleMaps: item['Link - Google Maps'],
            createdAt: item['Created At'],
            updatedAt: item['Data/Hora inclusao']
        };
    }

    /**
     * Formata um fotógrafo para o padrão do sistema
     */
    formatFotografo(item) {
        return {
            id: item.record_id,
            nome: item.nome_do_fotografo,
            email: item.email_do_fotografo,
            celular1: item.celular_fotografo_01,
            celular2: item.celular_fotografo_02,
            endereco: item.endereco_casa_do_fotografo,
            observacoes: item.observacoes_fotografo,
            dataInicio: item.data_de_inicio_das_atividades_fotografo,
            servicosRealizados: item.total_de_serivcos_realizados_no_mes_corrente_fotografo,
            servicosAgendados: item.servicos_agendados_fotografo,
            regiao: item.bairro_regiao_fotografo
        };
    }

    // ==================== MÉTODOS UTILITÁRIOS ====================

    /**
     * Normaliza status para padrão do sistema
     */
    normalizeStatus(status) {
        if (!status) return 'pendente';
        
        const normalized = status.toLowerCase().trim();
        
        // Mapeamentos específicos
        const mappings = {
            'agendado': 'agendado',
            'realizado': 'realizado',
            'cancelado': 'cancelado',
            'pendente': 'pendente',
            'em andamento': 'em_andamento',
            'conferido': 'conferido',
            'faturado': 'realizado' // Faturado = Realizado para o sistema
        };

        return mappings[normalized] || 'pendente';
    }

    /**
     * Conta registros por intervalo de dias
     */
    getCountByDateRange(data, days) {
        const hoje = new Date();
        const dataLimite = new Date(hoje.getTime() + (days * 24 * 60 * 60 * 1000));
        
        return data.filter(item => {
            const dataAgendamento = new Date(item['Data do agendamento']);
            return dataAgendamento >= hoje && dataAgendamento <= dataLimite;
        }).length;
    }

    /**
     * Formata data para exibição
     */
    formatDate(dateString) {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR');
        } catch (error) {
            return dateString;
        }
    }

    /**
     * Formata horário para exibição
     */
    formatTime(timeString) {
        if (!timeString) return '';
        
        try {
            // Se já está no formato HH:MM, retorna como está
            if (timeString.match(/^\d{2}:\d{2}$/)) {
                return timeString;
            }
            
            // Se está no formato HH:MM:SS, remove os segundos
            if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
                return timeString.substring(0, 5);
            }
            
            return timeString;
        } catch (error) {
            return timeString;
        }
    }

    /**
     * Força atualização de todos os dados
     */
    async forceRefresh() {
        console.log('🔄 Forçando atualização de todos os dados...');
        await this.loadAllData();
        console.log('✅ Dados atualizados com sucesso');
    }

    /**
     * Obtém informações de status da integração
     */
    getStatus() {
        const status = {
            initialized: this.cache.size > 0,
            lastUpdate: {},
            cacheSize: this.cache.size,
            files: {}
        };

        this.lastUpdate.forEach((timestamp, key) => {
            status.lastUpdate[key] = new Date(timestamp).toLocaleString('pt-BR');
            status.files[key] = this.cache.get(key)?.length || 0;
        });

        return status;
    }
}

// Instância global da integração
window.excelIntegration = new ExcelIntegration();

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExcelIntegration;
}