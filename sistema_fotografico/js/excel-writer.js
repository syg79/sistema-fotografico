/**
 * Sistema de Escrita para Arquivos Excel/CSV
 * Gerencia a criação e atualização de dados nos arquivos CSV
 */

class ExcelWriter {
    constructor() {
        this.basePath = 'd:/Projetos/Excel/csv_output/';
        this.backupPath = 'd:/Projetos/Excel/csv_output/backups/';
        this.tempPath = 'd:/Projetos/Excel/csv_output/temp/';
        
        this.init();
    }

    init() {
        console.log('📝 Inicializando Excel Writer...');
        this.setupDirectories();
    }

    setupDirectories() {
        // Criar diretórios necessários se não existirem
        // Nota: Em ambiente real, isso seria feito pelo backend
        console.log('📁 Configurando diretórios de trabalho...');
    }

    // ==================== MÉTODOS DE ESCRITA ====================

    async salvarSolicitacao(dados) {
        try {
            console.log('💾 Salvando nova solicitação:', dados);
            
            // Gerar ID único para a solicitação
            const id = this.gerarId();
            
            // Preparar dados no formato CSV
            const dadosFormatados = this.formatarDadosSolicitacao({
                ...dados,
                id: id,
                dataCreated: new Date().toISOString(),
                status: 'pendente'
            });

            // Simular salvamento (em produção, seria uma chamada para API/backend)
            await this.simularEscritaCSV('Solicitacao.csv', dadosFormatados);
            
            // Atualizar cache se disponível
            if (window.excelIntegration) {
                await window.excelIntegration.forceRefresh();
            }

            return { success: true, id: id };
            
        } catch (error) {
            console.error('❌ Erro ao salvar solicitação:', error);
            throw new Error('Falha ao salvar solicitação');
        }
    }

    async atualizarSolicitacao(id, dados) {
        try {
            console.log('🔄 Atualizando solicitação:', id, dados);
            
            // Preparar dados atualizados
            const dadosFormatados = this.formatarDadosSolicitacao({
                ...dados,
                id: id,
                dataUpdated: new Date().toISOString()
            });

            // Simular atualização
            await this.simularAtualizacaoCSV('Solicitacao.csv', id, dadosFormatados);
            
            // Atualizar cache
            if (window.excelIntegration) {
                await window.excelIntegration.forceRefresh();
            }

            return { success: true };
            
        } catch (error) {
            console.error('❌ Erro ao atualizar solicitação:', error);
            throw new Error('Falha ao atualizar solicitação');
        }
    }

    async salvarCliente(dados) {
        try {
            console.log('💾 Salvando novo cliente:', dados);
            
            const id = this.gerarId();
            const dadosFormatados = this.formatarDadosCliente({
                ...dados,
                id: id,
                dataCreated: new Date().toISOString()
            });

            await this.simularEscritaCSV('Clientes.csv', dadosFormatados);
            
            if (window.excelIntegration) {
                await window.excelIntegration.forceRefresh();
            }

            return { success: true, id: id };
            
        } catch (error) {
            console.error('❌ Erro ao salvar cliente:', error);
            throw new Error('Falha ao salvar cliente');
        }
    }

    async salvarCorretor(dados) {
        try {
            console.log('💾 Salvando novo corretor:', dados);
            
            const id = this.gerarId();
            const dadosFormatados = this.formatarDadosCorretor({
                ...dados,
                id: id,
                dataCreated: new Date().toISOString()
            });

            await this.simularEscritaCSV('Corretores.csv', dadosFormatados);
            
            if (window.excelIntegration) {
                await window.excelIntegration.forceRefresh();
            }

            return { success: true, id: id };
            
        } catch (error) {
            console.error('❌ Erro ao salvar corretor:', error);
            throw new Error('Falha ao salvar corretor');
        }
    }

    async atualizarStatusSolicitacao(id, novoStatus, observacoes = '') {
        try {
            console.log('🔄 Atualizando status da solicitação:', id, novoStatus);
            
            const dados = {
                status: novoStatus,
                observacoes: observacoes,
                dataStatusUpdate: new Date().toISOString()
            };

            await this.atualizarSolicitacao(id, dados);
            
            return { success: true };
            
        } catch (error) {
            console.error('❌ Erro ao atualizar status:', error);
            throw new Error('Falha ao atualizar status');
        }
    }

    // ==================== MÉTODOS DE FORMATAÇÃO ====================

    formatarDadosSolicitacao(dados) {
        return {
            'ID Solicitacao': dados.id || '',
            'Status': dados.status || 'pendente',
            'Data da Solicitacao (email)': dados.dataSolicitacao || '',
            'Nome Cliente': dados.cliente || '',
            'Endereco do Imovel': dados.endereco || '',
            'Data do agendamento': dados.dataAgendamento || '',
            'Fotografo': dados.fotografo || '',
            'Tipo do Servico': dados.tipoServico || '',
            'Data Realizada': dados.dataRealizada || '',
            'Corretor': dados.corretor || '',
            'Email do Corretor': dados.emailCorretor || '',
            'Celular do Corretor': dados.celularCorretor || '',
            'Bairro': dados.bairro || '',
            'CEP': dados.cep || '',
            'Observacoes': dados.observacoes || '',
            'Quantidade de Fotos': dados.qtdFotos || 0,
            'Quantidade de Video': dados.qtdVideo || 0,
            'Quantidade de Drone': dados.qtdDrone || 0,
            'Horario da Sessao': dados.horarioSessao || '',
            'Link Street View': dados.linkStreetView || '',
            'Valor do Imovel': dados.valorImovel || '',
            'Situacao': dados.situacao || '',
            'Dormitorios': dados.dormitorios || '',
            'Vagas Garagem': dados.vagasGaragem || '',
            'Data Created': dados.dataCreated || new Date().toISOString(),
            'Data Updated': dados.dataUpdated || ''
        };
    }

    formatarDadosCliente(dados) {
        return {
            'ID': dados.id || '',
            'Nome': dados.nome || '',
            'Email': dados.email || '',
            'Telefone': dados.telefone || '',
            'Rede': dados.rede || '',
            'Endereco': dados.endereco || '',
            'Observacoes': dados.observacoes || '',
            'Data Created': dados.dataCreated || new Date().toISOString()
        };
    }

    formatarDadosCorretor(dados) {
        return {
            'ID': dados.id || '',
            'Nome': dados.nome || '',
            'Email': dados.email || '',
            'Telefone': dados.telefone || '',
            'Cliente': dados.cliente || '',
            'CRECI': dados.creci || '',
            'Observacoes': dados.observacoes || '',
            'Data Created': dados.dataCreated || new Date().toISOString()
        };
    }

    // ==================== MÉTODOS DE SIMULAÇÃO ====================

    async simularEscritaCSV(arquivo, dados) {
        return new Promise((resolve) => {
            // Simular delay de escrita
            setTimeout(() => {
                console.log(`📄 Dados escritos em ${arquivo}:`, dados);
                
                // Simular log de auditoria
                this.logAuditoria('CREATE', arquivo, dados);
                
                resolve(true);
            }, 500);
        });
    }

    async simularAtualizacaoCSV(arquivo, id, dados) {
        return new Promise((resolve) => {
            // Simular delay de atualização
            setTimeout(() => {
                console.log(`🔄 Dados atualizados em ${arquivo} (ID: ${id}):`, dados);
                
                // Simular log de auditoria
                this.logAuditoria('UPDATE', arquivo, { id, ...dados });
                
                resolve(true);
            }, 300);
        });
    }

    // ==================== MÉTODOS UTILITÁRIOS ====================

    gerarId() {
        // Gerar ID único baseado em timestamp + random
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `${timestamp}${random}`;
    }

    logAuditoria(operacao, arquivo, dados) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            operacao: operacao,
            arquivo: arquivo,
            usuario: 'sistema', // Em produção, seria o usuário logado
            dados: dados
        };
        
        console.log('📋 Log de Auditoria:', logEntry);
        
        // Em produção, salvar em arquivo de log
        this.salvarLogAuditoria(logEntry);
    }

    async salvarLogAuditoria(logEntry) {
        // Simular salvamento de log
        const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
        logs.push(logEntry);
        
        // Manter apenas os últimos 1000 logs
        if (logs.length > 1000) {
            logs.splice(0, logs.length - 1000);
        }
        
        localStorage.setItem('audit_logs', JSON.stringify(logs));
    }

    // ==================== MÉTODOS DE BACKUP ====================

    async criarBackup(arquivo) {
        try {
            console.log(`💾 Criando backup de ${arquivo}...`);
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupName = `${arquivo}_backup_${timestamp}.csv`;
            
            // Simular criação de backup
            console.log(`✅ Backup criado: ${backupName}`);
            
            return { success: true, backupName };
            
        } catch (error) {
            console.error('❌ Erro ao criar backup:', error);
            throw new Error('Falha ao criar backup');
        }
    }

    // ==================== MÉTODOS DE VALIDAÇÃO ====================

    validarDadosSolicitacao(dados) {
        const camposObrigatorios = ['cliente', 'endereco', 'tipoServico'];
        const erros = [];

        camposObrigatorios.forEach(campo => {
            if (!dados[campo] || dados[campo].trim() === '') {
                erros.push(`Campo obrigatório: ${campo}`);
            }
        });

        // Validações específicas
        if (dados.email && !this.validarEmail(dados.email)) {
            erros.push('Email inválido');
        }

        if (dados.cep && !this.validarCEP(dados.cep)) {
            erros.push('CEP inválido');
        }

        return {
            valido: erros.length === 0,
            erros: erros
        };
    }

    validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    validarCEP(cep) {
        const regex = /^\d{5}-?\d{3}$/;
        return regex.test(cep);
    }

    // ==================== MÉTODOS DE EXPORTAÇÃO ====================

    async exportarDados(formato, filtros = {}) {
        try {
            console.log(`📤 Exportando dados em formato ${formato}...`);
            
            // Simular exportação
            const dados = await this.obterDadosParaExportacao(filtros);
            
            switch (formato.toLowerCase()) {
                case 'csv':
                    return this.exportarCSV(dados);
                case 'excel':
                    return this.exportarExcel(dados);
                case 'pdf':
                    return this.exportarPDF(dados);
                default:
                    throw new Error('Formato não suportado');
            }
            
        } catch (error) {
            console.error('❌ Erro na exportação:', error);
            throw new Error('Falha na exportação');
        }
    }

    async obterDadosParaExportacao(filtros) {
        // Simular obtenção de dados filtrados
        return {
            solicitacoes: [],
            clientes: [],
            fotografos: [],
            timestamp: new Date().toISOString()
        };
    }

    exportarCSV(dados) {
        console.log('📄 Exportando para CSV...');
        return { success: true, formato: 'CSV', arquivo: 'export.csv' };
    }

    exportarExcel(dados) {
        console.log('📊 Exportando para Excel...');
        return { success: true, formato: 'Excel', arquivo: 'export.xlsx' };
    }

    exportarPDF(dados) {
        console.log('📋 Exportando para PDF...');
        return { success: true, formato: 'PDF', arquivo: 'export.pdf' };
    }

    // ==================== STATUS E DIAGNÓSTICO ====================

    getStatus() {
        return {
            ativo: true,
            basePath: this.basePath,
            backupPath: this.backupPath,
            tempPath: this.tempPath,
            ultimaOperacao: new Date().toISOString()
        };
    }

    async testarConexao() {
        try {
            console.log('🔍 Testando conexão com sistema de arquivos...');
            
            // Simular teste de conexão
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('✅ Conexão OK');
            return { success: true, message: 'Conexão estabelecida com sucesso' };
            
        } catch (error) {
            console.error('❌ Erro na conexão:', error);
            return { success: false, message: 'Falha na conexão' };
        }
    }
}

// Inicializar writer quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.excelWriter = new ExcelWriter();
    console.log('✅ Excel Writer inicializado e disponível globalmente');
});

// Exportar classe para uso global
window.ExcelWriter = ExcelWriter;