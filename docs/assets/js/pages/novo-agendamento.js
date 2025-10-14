// Novo Agendamento - Sistema Fotográfico
class NovoAgendamento {
    constructor() {
        this.api = null;
        this.pedidoId = null;
        this.pedidoData = null;
        this.fotografos = [];
        this.redes = [];
        this.clientes = [];
        
        this.init();
    }

    async init() {
        try {
            // Inicializar API
            this.api = window.googleSheetsAPI || new GoogleSheetsAPI();
            
            // Aguardar API estar pronta
            await this.aguardarAPI();

            // Obter ID do pedido da URL
            this.pedidoId = this.obterPedidoId();
            
            // Configurar eventos
            this.configurarEventos();
            
            // Configurar localização
            this.configurarLocalizacao();
            
            // Carregar dados
            await this.carregarDados();
            
            // Se há ID do pedido, carregar informações específicas
            if (this.pedidoId) {
                await this.carregarInformacoesPedido();
            }
            
            // Tentar carregar rascunho salvo
            this.carregarRascunho();
            
        } catch (error) {
            console.error('Erro ao inicializar novo agendamento:', error);
            this.mostrarErro('Erro ao carregar a página. Tente novamente.');
        }
    }

    configurarLocalizacao() {
        // Configurar localização para português brasileiro
        const dataInput = document.getElementById('dataAgendamento');
        if (dataInput) {
            // Definir localização para o input de data
            dataInput.setAttribute('lang', 'pt-BR');
            
            // Configurar data mínima como hoje
            const hoje = new Date();
            const dataMinima = hoje.toISOString().split('T')[0];
            dataInput.setAttribute('min', dataMinima);
        }
    }

    obterPedidoId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    configurarEventos() {
        // Formulário principal
        const form = document.getElementById('formAgendamento');
        if (form) {
            form.addEventListener('submit', (e) => this.processarFormulario(e));
        }

        // Horário personalizado
        const horarioSessao = document.getElementById('horarioSessao');
        if (horarioSessao) {
            horarioSessao.addEventListener('change', (e) => {
                const horarioPersonalizado = document.getElementById('horarioPersonalizado');
                if (horarioPersonalizado) {
                    horarioPersonalizado.style.display = e.target.value === 'Outro' ? 'block' : 'none';
                    // Limpar o campo quando esconder
                    if (e.target.value !== 'Outro') {
                        const horarioOutro = document.getElementById('horarioOutro');
                        if (horarioOutro) {
                            horarioOutro.value = '';
                        }
                    }
                }
            });
        }

        // Observações para editor
        const possuiObsEditor = document.getElementById('possuiObsEditor');
        if (possuiObsEditor) {
            possuiObsEditor.addEventListener('change', (e) => {
                const container = document.getElementById('observacoesEditorContainer');
                if (container) {
                    container.style.display = e.target.checked ? 'block' : 'none';
                }
            });
        }

        // Botão salvar rascunho
        const btnSalvarRascunho = document.getElementById('btnSalvarRascunho');
        if (btnSalvarRascunho) {
            btnSalvarRascunho.addEventListener('click', () => this.salvarRascunho());
        }

        // Confirmação final
        const btnConfirmarFinal = document.getElementById('btnConfirmarFinal');
        if (btnConfirmarFinal) {
            btnConfirmarFinal.addEventListener('click', () => this.confirmarAgendamento());
        }
    }

    async carregarDados() {
        try {
            // Carregar fotógrafos, redes e clientes em paralelo
            const [fotografosData, redesData, clientesData] = await Promise.all([
                this.api.loadSheetData('fotografos'),
                this.api.loadSheetData('rede'),
                this.api.loadSheetData('clientes')
            ]);

            this.fotografos = fotografosData || [];
            this.redes = redesData || [];
            this.clientes = clientesData || [];

            // Preencher select de fotógrafos
            this.preencherSelectFotografos();

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.mostrarErro('Erro ao carregar dados necessários.');
        }
    }

    preencherSelectFotografos() {
        const select = document.getElementById('fotografo');
        if (!select || !this.fotografos.length) {
            console.log('❌ Select não encontrado ou lista de fotógrafos vazia:', {
                select: !!select,
                fotografosLength: this.fotografos.length
            });
            return;
        }

        // Limpar opções existentes
        select.innerHTML = '<option value="">Selecione um fotógrafo</option>';

        console.log('📋 Fotógrafos carregados:', this.fotografos);

        // Filtrar fotógrafos ativos (excluir os especificados no arquivo original)
        const fotografosExcluidos = ['Vitor Imoto', 'Fernanda', 'Ronald', 'Dankan', 'Marcio'];
        const fotografosAtivos = this.fotografos.filter(f => {
            // Tentar diferentes campos possíveis para o nome
            const nome = f.nome_do_fotografo || f.Nome || f.nome || f.fotografo_name || '';
            return nome && !fotografosExcluidos.includes(nome);
        });

        console.log('✅ Fotógrafos ativos filtrados:', fotografosAtivos);

        // Adicionar opções
        fotografosAtivos.forEach(fotografo => {
            // Tentar diferentes campos possíveis para o nome
            const nome = fotografo.nome_do_fotografo || fotografo.Nome || fotografo.nome || fotografo.fotografo_name || '';
            if (nome) {
                const option = document.createElement('option');
                option.value = nome;
                option.textContent = nome;
                select.appendChild(option);
            }
        });

        console.log(`✅ ${fotografosAtivos.length} fotógrafos adicionados ao select`);
    }

    async carregarInformacoesPedido() {
        if (!this.pedidoId) return;

        try {
            // Carregar dados da solicitação
            const solicitacoes = await this.api.loadSheetData('solicitacao');
            this.pedidoData = solicitacoes.find(s => s['ID Solicitacao'] == this.pedidoId);

            if (this.pedidoData) {
                this.preencherInformacoesPedido();
                this.preencherPreferenciasImobiliaria();
            } else {
                this.mostrarErro('Pedido não encontrado.');
            }

        } catch (error) {
            console.error('Erro ao carregar informações do pedido:', error);
            this.mostrarErro('Erro ao carregar informações do pedido.');
        }
    }

    preencherInformacoesPedido() {
        const container = document.getElementById('infoPedido');
        if (!container || !this.pedidoData) return;

        const data = this.pedidoData;
        
        container.innerHTML = `
            <div class="pedido-info">
                <h6 class="text-primary mb-3">
                    <i class="fas fa-hashtag me-1"></i>
                    Pedido #${data['ID Solicitacao'] || 'N/A'}
                </h6>
                
                <div class="mb-2">
                    <strong><i class="fas fa-building me-2"></i>Cliente:</strong>
                    <div class="text-muted">${data['Nome Cliente'] || 'Não informado'}</div>
                </div>
                
                <div class="mb-2">
                    <strong><i class="fas fa-network-wired me-2"></i>Rede:</strong>
                    <div class="text-muted">${data['Rede'] || 'Não informado'}</div>
                </div>
                
                <div class="mb-2">
                    <strong><i class="fas fa-map-marker-alt me-2"></i>Endereço:</strong>
                    <div class="text-muted">${data['Endereco do Imovel'] || 'Não informado'}</div>
                </div>
                
                <div class="mb-2">
                    <strong><i class="fas fa-home me-2"></i>Tipo:</strong>
                    <div class="text-muted">${data['Tipo do Imovel'] || 'Não informado'}</div>
                </div>
                
                <div class="mb-2">
                    <strong><i class="fas fa-camera me-2"></i>Serviço:</strong>
                    <div class="text-muted">${data['Tipo do Servico'] || 'Fotos'}</div>
                </div>
                
                <div class="mb-2">
                    <strong><i class="fas fa-user-tie me-2"></i>Corretor:</strong>
                    <div class="text-muted">${data['Corretor Responsavel'] || 'Não informado'}</div>
                </div>
                
                <div class="mb-2">
                    <strong><i class="fas fa-phone me-2"></i>Contato 1:</strong>
                    <div class="text-muted">${data['Contato para agendar 01'] || 'Não informado'}</div>
                </div>
                
                ${data['Contato para agendar 02'] ? `
                <div class="mb-2">
                    <strong><i class="fas fa-phone me-2"></i>Contato 2:</strong>
                    <div class="text-muted">${data['Contato para agendar 02']}</div>
                </div>
                ` : ''}
                
                <div class="mb-2">
                    <strong><i class="fas fa-calendar me-2"></i>Solicitado em:</strong>
                    <div class="text-muted">${this.formatarData(data['Data da Solicitacao (email)'])}</div>
                </div>
                
                <div class="mb-0">
                    <strong><i class="fas fa-info-circle me-2"></i>Status:</strong>
                    <span class="badge bg-warning status-badge">${data['Status'] || 'Pendente'}</span>
                </div>
            </div>
        `;
    }

    preencherPreferenciasImobiliaria() {
        const container = document.getElementById('preferenciasImobiliaria');
        if (!container || !this.pedidoData) return;

        // Buscar preferências da imobiliária baseado na rede
        const rede = this.pedidoData['Rede'];
        const cliente = this.clientes.find(c => c.rede === rede || c.Rede === rede);
        
        let preferencias = '';
        if (cliente) {
            preferencias = cliente['preferencia_da_imobiliaria_para_o_agendamento'] || 
                          cliente['Preferencia da imobiliaria para o agendamento'] || '';
        }

        // Também verificar se há observações específicas no pedido
        const obsAgendamento = this.pedidoData['Observacao para o Agendamento'] || '';

        container.innerHTML = `
            ${preferencias ? `
                <div class="alert alert-info mb-2">
                    <strong><i class="fas fa-building me-2"></i>Preferências da Rede:</strong>
                    <div class="mt-1">${preferencias}</div>
                </div>
            ` : ''}
            
            ${obsAgendamento ? `
                <div class="alert alert-warning mb-2">
                    <strong><i class="fas fa-sticky-note me-2"></i>Observações do Corretor:</strong>
                    <div class="mt-1">${obsAgendamento}</div>
                </div>
            ` : ''}
            
            ${!preferencias && !obsAgendamento ? `
                <div class="text-muted">
                    <i class="fas fa-info-circle me-1"></i>
                    Nenhuma preferência específica registrada
                </div>
            ` : ''}
        `;

        // Pré-preencher observações se existirem
        if (obsAgendamento) {
            const obsField = document.getElementById('observacoesFotografo');
            if (obsField && !obsField.value) {
                obsField.value = obsAgendamento;
            }
        }
    }

    processarFormulario(e) {
        e.preventDefault();
        
        // Validar campos obrigatórios
        if (!this.validarFormulario()) {
            return;
        }

        // Coletar dados do formulário
        const dadosAgendamento = this.coletarDadosFormulario();
        
        // Mostrar modal de confirmação
        this.mostrarModalConfirmacao(dadosAgendamento);
    }

    validarFormulario() {
        const campos = [
            { id: 'dataAgendamento', nome: 'Data do Agendamento' },
            { id: 'horarioSessao', nome: 'Horário da Sessão' },
            { id: 'fotografo', nome: 'Fotógrafo' }
        ];

        for (const campo of campos) {
            const elemento = document.getElementById(campo.id);
            if (!elemento || !elemento.value.trim()) {
                this.mostrarErro(`O campo "${campo.nome}" é obrigatório.`);
                elemento?.focus();
                return false;
            }
        }

        // Validar horário personalizado se selecionado
        const horarioSessao = document.getElementById('horarioSessao');
        if (horarioSessao?.value === 'Outro') {
            const horarioOutro = document.getElementById('horarioOutro');
            if (!horarioOutro?.value) {
                this.mostrarErro('Especifique o horário personalizado.');
                horarioOutro?.focus();
                return false;
            }
        }

        return true;
    }

    coletarDadosFormulario() {
        const horarioSessao = document.getElementById('horarioSessao');
        const horarioFinal = horarioSessao.value === 'Outro' 
            ? document.getElementById('horarioOutro').value 
            : horarioSessao.value;

        return {
            dataAgendamento: document.getElementById('dataAgendamento').value,
            horarioSessao: horarioFinal,
            fotografo: document.getElementById('fotografo').value,
            observacoesFotografo: document.getElementById('observacoesFotografo').value,
            possuiObsEditor: document.getElementById('possuiObsEditor').checked,
            observacoesEditor: document.getElementById('observacoesEditor').value,
            fazerAreaComum: document.getElementById('fazerAreaComum').checked,
            publicarAgenda: document.getElementById('publicarAgenda').checked,
            referenciasCopiadas: document.getElementById('referenciasCopiadas').value
        };
    }

    mostrarModalConfirmacao(dados) {
        const resumo = document.getElementById('resumoAgendamento');
        if (!resumo) return;

        resumo.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Informações do Agendamento</h6>
                    <p><strong>Data:</strong> ${this.formatarData(dados.dataAgendamento)}</p>
                    <p><strong>Horário:</strong> ${dados.horarioSessao}</p>
                    <p><strong>Fotógrafo:</strong> ${dados.fotografo}</p>
                </div>
                <div class="col-md-6">
                    <h6>Configurações</h6>
                    <p><strong>Área Comum:</strong> ${dados.fazerAreaComum ? 'Sim' : 'Não'}</p>
                    <p><strong>Publicar Agenda:</strong> ${dados.publicarAgenda ? 'Sim' : 'Não'}</p>
                    <p><strong>Obs. Editor:</strong> ${dados.possuiObsEditor ? 'Sim' : 'Não'}</p>
                </div>
            </div>
            
            ${dados.observacoesFotografo ? `
                <div class="mt-3">
                    <h6>Observações para o Fotógrafo</h6>
                    <div class="alert alert-info">${dados.observacoesFotografo}</div>
                </div>
            ` : ''}
            
            ${dados.observacoesEditor ? `
                <div class="mt-3">
                    <h6>Observações para o Editor</h6>
                    <div class="alert alert-warning">${dados.observacoesEditor}</div>
                </div>
            ` : ''}
        `;

        // Armazenar dados para confirmação
        this.dadosParaConfirmar = dados;

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('modalConfirmacao'));
        modal.show();
    }

    async confirmarAgendamento() {
        if (!this.dadosParaConfirmar) return;

        try {
            // Mostrar loading
            const btnConfirmar = document.getElementById('btnConfirmarFinal');
            const textoOriginal = btnConfirmar.innerHTML;
            btnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Salvando...';
            btnConfirmar.disabled = true;

            // Simular salvamento (aqui seria a integração real)
            await this.simularSalvamento();

            // Fechar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalConfirmacao'));
            modal.hide();

            // Mostrar sucesso e redirecionar
            this.mostrarSucesso();

        } catch (error) {
            console.error('Erro ao confirmar agendamento:', error);
            this.mostrarErro('Erro ao salvar agendamento. Tente novamente.');
            
            // Restaurar botão
            const btnConfirmar = document.getElementById('btnConfirmarFinal');
            btnConfirmar.innerHTML = '<i class="fas fa-check me-1"></i>Confirmar Agendamento';
            btnConfirmar.disabled = false;
        }
    }

    async simularSalvamento() {
        // Simular delay de salvamento
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('Dados que seriam salvos:', {
            pedidoId: this.pedidoId,
            ...this.dadosParaConfirmar
        });
        
        // Aqui seria implementada a integração real com Google Sheets
        // Requer Google Apps Script para permitir escrita
    }

    salvarRascunho() {
        try {
            // Validar se há dados mínimos para salvar
            const dataAgendamento = document.getElementById('dataAgendamento').value;
            const fotografo = document.getElementById('fotografo').value;
            
            if (!dataAgendamento && !fotografo) {
                this.mostrarErro('Preencha pelo menos a data ou o fotógrafo para salvar o rascunho.');
                return;
            }

            const dados = this.coletarDadosFormulario();
            
            // Adicionar timestamp do salvamento
            dados.timestampSalvamento = new Date().toISOString();
            dados.pedidoId = this.pedidoId;
            
            // Salvar no localStorage
            const chaveRascunho = `agendamento_rascunho_${this.pedidoId || 'novo'}`;
            localStorage.setItem(chaveRascunho, JSON.stringify(dados));
            
            // Salvar também uma lista de rascunhos para facilitar recuperação
            const rascunhosSalvos = JSON.parse(localStorage.getItem('agendamentos_rascunhos') || '[]');
            const rascunhoExistente = rascunhosSalvos.findIndex(r => r.pedidoId === (this.pedidoId || 'novo'));
            
            const infoRascunho = {
                pedidoId: this.pedidoId || 'novo',
                chave: chaveRascunho,
                timestamp: dados.timestampSalvamento,
                dataAgendamento: dados.dataAgendamento,
                fotografo: dados.fotografo,
                cliente: this.pedidoData ? this.pedidoData['Nome Cliente'] : 'Novo agendamento'
            };
            
            if (rascunhoExistente >= 0) {
                rascunhosSalvos[rascunhoExistente] = infoRascunho;
            } else {
                rascunhosSalvos.push(infoRascunho);
            }
            
            localStorage.setItem('agendamentos_rascunhos', JSON.stringify(rascunhosSalvos));
            
            this.mostrarSucesso('Rascunho salvo com sucesso! Você pode recuperá-lo a qualquer momento.', false);
            
        } catch (error) {
            console.error('Erro ao salvar rascunho:', error);
            this.mostrarErro('Erro ao salvar rascunho. Tente novamente.');
        }
    }

    carregarRascunho() {
        try {
            const chaveRascunho = `agendamento_rascunho_${this.pedidoId || 'novo'}`;
            const rascunhoSalvo = localStorage.getItem(chaveRascunho);
            
            if (rascunhoSalvo) {
                const dados = JSON.parse(rascunhoSalvo);
                
                // Preencher campos do formulário
                if (dados.dataAgendamento) {
                    document.getElementById('dataAgendamento').value = dados.dataAgendamento;
                }
                if (dados.horarioSessao) {
                    const horarioSessao = document.getElementById('horarioSessao');
                    if (horarioSessao) {
                        horarioSessao.value = dados.horarioSessao;
                        // Disparar evento change para mostrar campo personalizado se necessário
                        horarioSessao.dispatchEvent(new Event('change'));
                    }
                }
                if (dados.fotografo) {
                    document.getElementById('fotografo').value = dados.fotografo;
                }
                if (dados.observacoesFotografo) {
                    document.getElementById('observacoesFotografo').value = dados.observacoesFotografo;
                }
                if (dados.possuiObsEditor) {
                    const checkbox = document.getElementById('possuiObsEditor');
                    checkbox.checked = dados.possuiObsEditor;
                    checkbox.dispatchEvent(new Event('change'));
                }
                if (dados.observacoesEditor) {
                    document.getElementById('observacoesEditor').value = dados.observacoesEditor;
                }
                if (dados.fazerAreaComum !== undefined) {
                    document.getElementById('fazerAreaComum').checked = dados.fazerAreaComum;
                }
                if (dados.publicarAgenda !== undefined) {
                    document.getElementById('publicarAgenda').checked = dados.publicarAgenda;
                }
                if (dados.referenciasCopiadas) {
                    document.getElementById('referenciasCopiadas').value = dados.referenciasCopiadas;
                }
                
                // Mostrar notificação de rascunho carregado
                this.mostrarSucesso('Rascunho carregado com sucesso!', false);
                
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('Erro ao carregar rascunho:', error);
            return false;
        }
    }

    formatarData(data) {
        if (!data) return 'Não informado';
        
        try {
            const date = new Date(data);
            return date.toLocaleDateString('pt-BR');
        } catch {
            return data;
        }
    }

    mostrarErro(mensagem) {
        // Criar toast de erro
        this.mostrarToast(mensagem, 'danger');
    }

    mostrarSucesso(mensagem = 'Agendamento realizado com sucesso!', redirecionar = true) {
        this.mostrarToast(mensagem, 'success');
        
        if (redirecionar) {
            setTimeout(() => {
                window.location.href = '../agendamentos/agendados.html';
            }, 2000);
        }
    }

    mostrarToast(mensagem, tipo) {
        // Criar elemento toast
        const toastContainer = document.querySelector('.toast-container') || this.criarToastContainer();
        
        const toastId = 'toast_' + Date.now();
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${tipo} border-0`;
        toast.id = toastId;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-${tipo === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
                    ${mensagem}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        // Remover após esconder
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    criarToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '1055';
        document.body.appendChild(container);
        return container;
    }

    async aguardarAPI() {
        let tentativas = 0;
        while ((!window.googleSheetsAPI) && tentativas < 10) {
            await new Promise(resolve => setTimeout(resolve, 200));
            tentativas += 1;
        }
        if (!window.googleSheetsAPI) {
            throw new Error('Google Sheets API não inicializada.');
        }
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', async () => {
    await new Promise(resolve => setTimeout(resolve, 100)); // garante carregamento dos scripts
    new NovoAgendamento();
});