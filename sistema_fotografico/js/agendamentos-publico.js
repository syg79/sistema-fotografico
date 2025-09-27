/**
 * Sistema de Agendamentos Público - Acesso para Fotógrafos
 * Versão: 1.0
 */

class SistemaAgendamentosPublico {
    constructor() {
        this.fotografoLogado = null;
        this.agendamentos = [];
        this.intervaloAtualizacao = null;
        this.enderecoSelecionado = '';
        
        this.init();
    }

    init() {
        this.verificarLogin();
        this.configurarEventos();
        this.iniciarAtualizacaoAutomatica();
    }

    verificarLogin() {
        const fotografoSalvo = localStorage.getItem('fotografo_logado');
        if (fotografoSalvo) {
            this.fotografoLogado = JSON.parse(fotografoSalvo);
            this.mostrarAreaPrincipal();
            this.carregarDados();
        }
    }

    configurarEventos() {
        // Login
        document.getElementById('formLogin').addEventListener('submit', (e) => {
            e.preventDefault();
            this.realizarLogin();
        });

        // Filtros
        document.getElementById('filtroData').addEventListener('change', () => {
            this.aplicarFiltros();
        });

        document.getElementById('filtroStatus').addEventListener('change', () => {
            this.aplicarFiltros();
        });

        document.getElementById('buscaRapida').addEventListener('input', () => {
            this.aplicarFiltros();
        });

        // Confirmação de agendamento
        document.getElementById('btnConfirmarAgendamento').addEventListener('click', () => {
            this.confirmarAgendamento();
        });
    }

    async realizarLogin() {
        const codigo = document.getElementById('codigoFotografo').value;
        const senha = document.getElementById('senhaFotografo').value;

        if (!codigo || !senha) {
            this.mostrarMensagem('Por favor, preencha todos os campos.', 'warning');
            return;
        }

        this.mostrarLoading('Verificando credenciais...');

        try {
            // Simulação de login - em produção, fazer chamada para API
            const fotografo = await this.validarCredenciais(codigo, senha);
            
            if (fotografo) {
                this.fotografoLogado = fotografo;
                localStorage.setItem('fotografo_logado', JSON.stringify(fotografo));
                
                this.mostrarAreaPrincipal();
                this.carregarDados();
                this.mostrarMensagem(`Bem-vindo, ${fotografo.nome}!`, 'success');
            } else {
                this.mostrarMensagem('Credenciais inválidas. Tente novamente.', 'error');
            }
        } catch (error) {
            console.error('Erro no login:', error);
            this.mostrarMensagem('Erro ao fazer login. Tente novamente.', 'error');
        } finally {
            this.esconderLoading();
        }
    }

    async validarCredenciais(codigo, senha) {
        // Simulação - em produção, fazer chamada para API Tadabase
        return new Promise((resolve) => {
            setTimeout(() => {
                // Dados simulados de fotógrafos
                const fotografos = [
                    { id: 1, codigo: 'FOTO001', senha: '123456', nome: 'João Silva', email: 'joao@foto.com' },
                    { id: 2, codigo: 'FOTO002', senha: '123456', nome: 'Maria Santos', email: 'maria@foto.com' },
                    { id: 3, codigo: 'FOTO003', senha: '123456', nome: 'Pedro Costa', email: 'pedro@foto.com' }
                ];

                const fotografo = fotografos.find(f => f.codigo === codigo && f.senha === senha);
                resolve(fotografo || null);
            }, 1000);
        });
    }

    mostrarAreaPrincipal() {
        document.getElementById('telaLogin').style.display = 'none';
        document.getElementById('areaPrincipal').style.display = 'block';
        document.getElementById('usuarioLogado').style.display = 'block';
        document.getElementById('nomeUsuario').textContent = this.fotografoLogado.nome;
    }

    logout() {
        localStorage.removeItem('fotografo_logado');
        this.fotografoLogado = null;
        this.pararAtualizacaoAutomatica();
        
        document.getElementById('telaLogin').style.display = 'block';
        document.getElementById('areaPrincipal').style.display = 'none';
        document.getElementById('usuarioLogado').style.display = 'none';
        
        // Limpar formulário
        document.getElementById('formLogin').reset();
        
        this.mostrarMensagem('Logout realizado com sucesso.', 'info');
    }

    async carregarDados() {
        if (!this.fotografoLogado) return;

        try {
            this.mostrarRefreshIndicator();
            
            // Carregar agendamentos do fotógrafo
            this.agendamentos = await this.buscarAgendamentosFotografo(this.fotografoLogado.id);
            
            this.atualizarEstatisticas();
            this.aplicarFiltros();
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.mostrarMensagem('Erro ao carregar agendamentos.', 'error');
        } finally {
            this.esconderRefreshIndicator();
        }
    }

    async buscarAgendamentosFotografo(fotografoId) {
        // Simulação - em produção, fazer chamada para API Tadabase
        return new Promise((resolve) => {
            setTimeout(() => {
                const hoje = new Date();
                const agendamentos = [
                    {
                        id: 1,
                        cliente: 'João Silva',
                        endereco: 'Rua das Flores, 123 - Centro',
                        data: new Date(hoje.getTime() + 0 * 24 * 60 * 60 * 1000), // Hoje
                        horario: '09:00',
                        status: 'Agendado',
                        tipo: 'Residencial',
                        servicos: ['Fotos', 'Vídeo'],
                        contato: '(11) 99999-1111',
                        observacoes: 'Cliente prefere manhã. Portão azul.',
                        fotografoId: fotografoId
                    },
                    {
                        id: 2,
                        cliente: 'Maria Santos',
                        endereco: 'Av. Principal, 456 - Jardins',
                        data: new Date(hoje.getTime() + 0 * 24 * 60 * 60 * 1000), // Hoje
                        horario: '14:00',
                        status: 'Confirmado',
                        tipo: 'Apartamento',
                        servicos: ['Fotos', 'Drone'],
                        contato: '(11) 99999-2222',
                        observacoes: 'Apartamento no 15º andar. Interfone 1502.',
                        fotografoId: fotografoId
                    },
                    {
                        id: 3,
                        cliente: 'Pedro Costa',
                        endereco: 'Rua do Comércio, 789 - Vila Nova',
                        data: new Date(hoje.getTime() + 1 * 24 * 60 * 60 * 1000), // Amanhã
                        horario: '10:30',
                        status: 'Agendado',
                        tipo: 'Comercial',
                        servicos: ['Fotos'],
                        contato: '(11) 99999-3333',
                        observacoes: 'Loja fechada. Chegar 15min antes.',
                        fotografoId: fotografoId
                    },
                    {
                        id: 4,
                        cliente: 'Ana Oliveira',
                        endereco: 'Rua das Palmeiras, 321 - Bela Vista',
                        data: new Date(hoje.getTime() + 2 * 24 * 60 * 60 * 1000), // Depois de amanhã
                        horario: '16:00',
                        status: 'Agendado',
                        tipo: 'Casa',
                        servicos: ['Fotos', 'Vídeo', 'Drone'],
                        contato: '(11) 99999-4444',
                        observacoes: 'Casa com piscina. Trazer equipamento para drone.',
                        fotografoId: fotografoId
                    }
                ];

                resolve(agendamentos);
            }, 500);
        });
    }

    atualizarEstatisticas() {
        const hoje = new Date();
        const amanha = new Date(hoje.getTime() + 24 * 60 * 60 * 1000);
        const fimSemana = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);

        const agendamentosHoje = this.agendamentos.filter(a => 
            this.isSameDay(a.data, hoje)
        ).length;

        const agendamentosAmanha = this.agendamentos.filter(a => 
            this.isSameDay(a.data, amanha)
        ).length;

        const agendamentosSemana = this.agendamentos.filter(a => 
            a.data >= hoje && a.data <= fimSemana
        ).length;

        // Próximo agendamento
        const proximosAgendamentos = this.agendamentos
            .filter(a => a.data >= hoje)
            .sort((a, b) => a.data - b.data);

        const proximoHorario = proximosAgendamentos.length > 0 
            ? proximosAgendamentos[0].horario 
            : '--:--';

        document.getElementById('agendamentosHoje').textContent = agendamentosHoje;
        document.getElementById('agendamentosAmanha').textContent = agendamentosAmanha;
        document.getElementById('agendamentosSemana').textContent = agendamentosSemana;
        document.getElementById('proximoAgendamento').textContent = proximoHorario;
    }

    aplicarFiltros() {
        const filtroData = document.getElementById('filtroData').value;
        const filtroStatus = document.getElementById('filtroStatus').value;
        const buscaRapida = document.getElementById('buscaRapida').value.toLowerCase();

        let agendamentosFiltrados = [...this.agendamentos];

        // Filtro por data
        const hoje = new Date();
        switch (filtroData) {
            case 'hoje':
                agendamentosFiltrados = agendamentosFiltrados.filter(a => 
                    this.isSameDay(a.data, hoje)
                );
                break;
            case 'amanha':
                const amanha = new Date(hoje.getTime() + 24 * 60 * 60 * 1000);
                agendamentosFiltrados = agendamentosFiltrados.filter(a => 
                    this.isSameDay(a.data, amanha)
                );
                break;
            case 'semana':
                const fimSemana = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);
                agendamentosFiltrados = agendamentosFiltrados.filter(a => 
                    a.data >= hoje && a.data <= fimSemana
                );
                break;
        }

        // Filtro por status
        if (filtroStatus) {
            agendamentosFiltrados = agendamentosFiltrados.filter(a => 
                a.status === filtroStatus
            );
        }

        // Busca rápida
        if (buscaRapida) {
            agendamentosFiltrados = agendamentosFiltrados.filter(a => 
                a.cliente.toLowerCase().includes(buscaRapida) ||
                a.endereco.toLowerCase().includes(buscaRapida) ||
                a.tipo.toLowerCase().includes(buscaRapida)
            );
        }

        this.renderizarAgendamentos(agendamentosFiltrados);
    }

    renderizarAgendamentos(agendamentos) {
        const container = document.getElementById('listaAgendamentos');
        const semAgendamentos = document.getElementById('semAgendamentos');

        if (agendamentos.length === 0) {
            container.innerHTML = '';
            semAgendamentos.style.display = 'block';
            document.getElementById('totalAgendamentos').textContent = '0 agendamentos';
            return;
        }

        semAgendamentos.style.display = 'none';
        document.getElementById('totalAgendamentos').textContent = `${agendamentos.length} agendamento${agendamentos.length !== 1 ? 's' : ''}`;

        // Ordenar por data e horário
        agendamentos.sort((a, b) => {
            if (a.data.getTime() !== b.data.getTime()) {
                return a.data - b.data;
            }
            return a.horario.localeCompare(b.horario);
        });

        const hoje = new Date();
        
        container.innerHTML = agendamentos.map(agendamento => {
            const isHoje = this.isSameDay(agendamento.data, hoje);
            const isUrgente = agendamento.data < hoje;
            
            let cardClass = 'agendamento-card';
            if (isUrgente) cardClass += ' agendamento-urgente';
            else if (isHoje) cardClass += ' agendamento-hoje';

            const statusColor = this.getStatusColor(agendamento.status);
            
            return `
                <div class="card mb-3 ${cardClass}">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-8">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <h6 class="card-title mb-0">
                                        <i class="fas fa-user me-2"></i>${agendamento.cliente}
                                    </h6>
                                    <span class="badge ${statusColor} status-badge">${agendamento.status}</span>
                                </div>
                                
                                <div class="info-item">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <span>${agendamento.endereco}</span>
                                </div>
                                
                                <div class="info-item">
                                    <i class="fas fa-calendar"></i>
                                    <span>${this.formatarData(agendamento.data)} às ${agendamento.horario}</span>
                                </div>
                                
                                <div class="info-item">
                                    <i class="fas fa-home"></i>
                                    <span>${agendamento.tipo}</span>
                                </div>
                                
                                <div class="info-item">
                                    <i class="fas fa-camera"></i>
                                    <span>${agendamento.servicos.join(', ')}</span>
                                </div>
                                
                                <div class="info-item">
                                    <i class="fas fa-phone"></i>
                                    <span>${agendamento.contato}</span>
                                </div>
                            </div>
                            
                            <div class="col-md-4 text-end">
                                <div class="btn-group-vertical w-100" role="group">
                                    <button class="btn btn-outline-primary btn-sm mb-1" 
                                            onclick="sistemaPublico.verDetalhes(${agendamento.id})">
                                        <i class="fas fa-info-circle me-1"></i>Detalhes
                                    </button>
                                    
                                    <button class="btn btn-outline-success btn-sm mb-1" 
                                            onclick="sistemaPublico.abrirNavegacao('${agendamento.endereco}')">
                                        <i class="fas fa-route me-1"></i>Navegar
                                    </button>
                                    
                                    <button class="btn btn-outline-warning btn-sm mb-1" 
                                            onclick="sistemaPublico.ligarCliente('${agendamento.contato}')">
                                        <i class="fas fa-phone me-1"></i>Ligar
                                    </button>
                                    
                                    ${agendamento.status === 'Agendado' ? `
                                        <button class="btn btn-success btn-sm" 
                                                onclick="sistemaPublico.confirmarPresenca(${agendamento.id})">
                                            <i class="fas fa-check me-1"></i>Confirmar
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                        
                        ${agendamento.observacoes ? `
                            <div class="mt-2 p-2 bg-light rounded">
                                <small><strong>Observações:</strong> ${agendamento.observacoes}</small>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    verDetalhes(agendamentoId) {
        const agendamento = this.agendamentos.find(a => a.id === agendamentoId);
        if (!agendamento) return;

        const detalhesContent = document.getElementById('detalhesContent');
        detalhesContent.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6><i class="fas fa-user me-2"></i>Cliente</h6>
                    <p>${agendamento.cliente}</p>
                    
                    <h6><i class="fas fa-phone me-2"></i>Contato</h6>
                    <p>${agendamento.contato}</p>
                    
                    <h6><i class="fas fa-home me-2"></i>Tipo do Imóvel</h6>
                    <p>${agendamento.tipo}</p>
                </div>
                
                <div class="col-md-6">
                    <h6><i class="fas fa-calendar me-2"></i>Data e Horário</h6>
                    <p>${this.formatarData(agendamento.data)} às ${agendamento.horario}</p>
                    
                    <h6><i class="fas fa-camera me-2"></i>Serviços</h6>
                    <p>${agendamento.servicos.join(', ')}</p>
                    
                    <h6><i class="fas fa-info-circle me-2"></i>Status</h6>
                    <p><span class="badge ${this.getStatusColor(agendamento.status)}">${agendamento.status}</span></p>
                </div>
            </div>
            
            <div class="row mt-3">
                <div class="col-12">
                    <h6><i class="fas fa-map-marker-alt me-2"></i>Endereço</h6>
                    <p>${agendamento.endereco}</p>
                    
                    ${agendamento.observacoes ? `
                        <h6><i class="fas fa-sticky-note me-2"></i>Observações</h6>
                        <div class="alert alert-info">
                            ${agendamento.observacoes}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Configurar botão de confirmação
        const btnConfirmar = document.getElementById('btnConfirmarAgendamento');
        if (agendamento.status === 'Agendado') {
            btnConfirmar.style.display = 'block';
            btnConfirmar.onclick = () => this.confirmarAgendamento(agendamentoId);
        } else {
            btnConfirmar.style.display = 'none';
        }

        new bootstrap.Modal(document.getElementById('modalDetalhes')).show();
    }

    confirmarPresenca(agendamentoId) {
        const agendamento = this.agendamentos.find(a => a.id === agendamentoId);
        if (!agendamento) return;

        if (confirm(`Confirmar presença para o agendamento com ${agendamento.cliente}?`)) {
            this.confirmarAgendamento(agendamentoId);
        }
    }

    async confirmarAgendamento(agendamentoId) {
        try {
            this.mostrarLoading('Confirmando agendamento...');

            // Simular chamada para API
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Atualizar status local
            const agendamento = this.agendamentos.find(a => a.id === agendamentoId);
            if (agendamento) {
                agendamento.status = 'Confirmado';
            }

            this.aplicarFiltros();
            this.atualizarEstatisticas();

            // Fechar modal se estiver aberto
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalDetalhes'));
            if (modal) modal.hide();

            this.mostrarMensagem('Agendamento confirmado com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao confirmar agendamento:', error);
            this.mostrarMensagem('Erro ao confirmar agendamento.', 'error');
        } finally {
            this.esconderLoading();
        }
    }

    abrirNavegacao(endereco) {
        this.enderecoSelecionado = endereco;
        new bootstrap.Modal(document.getElementById('modalNavegacao')).show();
    }

    abrirGoogleMaps() {
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.enderecoSelecionado)}`;
        window.open(url, '_blank');
        bootstrap.Modal.getInstance(document.getElementById('modalNavegacao')).hide();
    }

    abrirWaze() {
        const url = `https://waze.com/ul?q=${encodeURIComponent(this.enderecoSelecionado)}`;
        window.open(url, '_blank');
        bootstrap.Modal.getInstance(document.getElementById('modalNavegacao')).hide();
    }

    ligarCliente(telefone) {
        // Remover formatação do telefone
        const numeroLimpo = telefone.replace(/\D/g, '');
        window.open(`tel:${numeroLimpo}`);
    }

    iniciarAtualizacaoAutomatica() {
        // Atualizar a cada 5 minutos
        this.intervaloAtualizacao = setInterval(() => {
            if (this.fotografoLogado) {
                this.carregarDados();
            }
        }, 5 * 60 * 1000);
    }

    pararAtualizacaoAutomatica() {
        if (this.intervaloAtualizacao) {
            clearInterval(this.intervaloAtualizacao);
            this.intervaloAtualizacao = null;
        }
    }

    mostrarRefreshIndicator() {
        document.getElementById('refreshAlert').style.display = 'block';
    }

    esconderRefreshIndicator() {
        setTimeout(() => {
            document.getElementById('refreshAlert').style.display = 'none';
        }, 1000);
    }

    // Métodos utilitários
    isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }

    formatarData(data) {
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    getStatusColor(status) {
        const cores = {
            'Agendado': 'bg-warning text-dark',
            'Confirmado': 'bg-success',
            'Em Andamento': 'bg-info',
            'Realizado': 'bg-primary',
            'Cancelado': 'bg-danger'
        };
        return cores[status] || 'bg-secondary';
    }

    mostrarMensagem(mensagem, tipo) {
        // Usar a função global do main.js
        if (window.mostrarMensagem) {
            window.mostrarMensagem(mensagem, tipo);
        } else {
            alert(mensagem);
        }
    }

    mostrarLoading(mensagem) {
        if (window.mostrarLoading) {
            window.mostrarLoading(mensagem);
        }
    }

    esconderLoading() {
        if (window.esconderLoading) {
            window.esconderLoading();
        }
    }
}

// Funções globais para acesso via HTML
function atualizarDados() {
    if (sistemaPublico) {
        sistemaPublico.carregarDados();
    }
}

function logout() {
    if (sistemaPublico) {
        sistemaPublico.logout();
    }
}

function abrirGoogleMaps() {
    if (sistemaPublico) {
        sistemaPublico.abrirGoogleMaps();
    }
}

function abrirWaze() {
    if (sistemaPublico) {
        sistemaPublico.abrirWaze();
    }
}

// Inicializar sistema quando a página carregar
let sistemaPublico;
document.addEventListener('DOMContentLoaded', function() {
    sistemaPublico = new SistemaAgendamentosPublico();
});