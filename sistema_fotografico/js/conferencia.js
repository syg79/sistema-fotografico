/**
 * Sistema de Conferência e Ajustes
 * Versão: 1.0
 */

class SistemaConferencia {
    constructor() {
        this.servicos = [];
        this.fotografos = [];
        this.servicoAtual = null;
        this.paginaAtual = 1;
        this.itensPorPagina = 10;
        this.avaliacoes = {
            geral: 0,
            composicao: 0,
            iluminacao: 0,
            nitidez: 0
        };
        
        this.init();
    }

    init() {
        this.configurarEventos();
        this.carregarDados();
        this.configurarAvaliacoes();
    }

    configurarEventos() {
        // Filtros
        document.getElementById('filtroStatus').addEventListener('change', () => {
            this.aplicarFiltros();
        });

        document.getElementById('filtroFotografo').addEventListener('change', () => {
            this.aplicarFiltros();
        });

        document.getElementById('filtroQualidade').addEventListener('change', () => {
            this.aplicarFiltros();
        });

        document.getElementById('filtroPeriodo').addEventListener('change', () => {
            this.aplicarFiltros();
        });

        document.getElementById('buscaRapida').addEventListener('input', () => {
            this.aplicarFiltros();
        });

        // Status da revisão
        document.getElementById('statusRevisao').addEventListener('change', (e) => {
            this.toggleCamposRejeicao(e.target.value === 'Rejeitado');
        });

        // Relatório
        document.getElementById('periodoRelatorio').addEventListener('change', () => {
            this.gerarRelatorio();
        });

        document.getElementById('fotografoRelatorio').addEventListener('change', () => {
            this.gerarRelatorio();
        });
    }

    configurarAvaliacoes() {
        // Configurar estrelas de avaliação
        document.querySelectorAll('.rating-stars').forEach(container => {
            const stars = container.querySelectorAll('.fa-star');
            
            stars.forEach((star, index) => {
                star.addEventListener('click', () => {
                    const rating = index + 1;
                    const criterio = container.dataset.criterio || 'geral';
                    
                    this.definirAvaliacao(container, rating);
                    this.avaliacoes[criterio] = rating;
                    
                    if (criterio === 'geral') {
                        this.atualizarQualidadeGeral(rating);
                    }
                });

                star.addEventListener('mouseenter', () => {
                    this.highlightStars(container, index + 1);
                });
            });

            container.addEventListener('mouseleave', () => {
                const criterio = container.dataset.criterio || 'geral';
                const rating = this.avaliacoes[criterio];
                this.definirAvaliacao(container, rating);
            });
        });
    }

    definirAvaliacao(container, rating) {
        const stars = container.querySelectorAll('.fa-star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.remove('far');
                star.classList.add('fas');
            } else {
                star.classList.remove('fas');
                star.classList.add('far');
            }
        });
    }

    highlightStars(container, rating) {
        const stars = container.querySelectorAll('.fa-star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.style.color = '#ffc107';
            } else {
                star.style.color = '#dee2e6';
            }
        });
    }

    atualizarQualidadeGeral(rating) {
        const select = document.getElementById('qualidadeGeral');
        const qualidades = ['', 'Ruim', 'Regular', 'Regular', 'Boa', 'Excelente'];
        select.value = qualidades[rating] || '';
    }

    async carregarDados() {
        try {
            this.mostrarLoading('Carregando serviços...');
            
            // Carregar serviços e fotógrafos
            [this.servicos, this.fotografos] = await Promise.all([
                this.buscarServicosConferencia(),
                this.buscarFotografos()
            ]);
            
            this.popularSelects();
            this.atualizarEstatisticas();
            this.aplicarFiltros();
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.mostrarMensagem('Erro ao carregar dados.', 'error');
        } finally {
            this.esconderLoading();
        }
    }

    async buscarServicosConferencia() {
        // Simulação - em produção, fazer chamada para API Tadabase
        return new Promise((resolve) => {
            setTimeout(() => {
                const hoje = new Date();
                const servicos = [
                    {
                        id: 1,
                        cliente: 'João Silva',
                        endereco: 'Rua das Flores, 123 - Centro',
                        dataRealizacao: new Date(hoje.getTime() - 1 * 24 * 60 * 60 * 1000),
                        fotografo: 'Maria Santos',
                        fotografoId: 1,
                        status: 'Pendente',
                        tipo: 'Residencial',
                        servicos: ['Fotos', 'Vídeo'],
                        qualidade: null,
                        avaliacao: null,
                        observacoes: '',
                        imagens: [
                            { id: 1, url: 'https://via.placeholder.com/300x200/007bff/ffffff?text=Foto+1', nome: 'sala_01.jpg' },
                            { id: 2, url: 'https://via.placeholder.com/300x200/28a745/ffffff?text=Foto+2', nome: 'cozinha_01.jpg' },
                            { id: 3, url: 'https://via.placeholder.com/300x200/ffc107/ffffff?text=Foto+3', nome: 'quarto_01.jpg' },
                            { id: 4, url: 'https://via.placeholder.com/300x200/dc3545/ffffff?text=Foto+4', nome: 'banheiro_01.jpg' }
                        ],
                        tempoExecucao: '02:30:00',
                        historico: [
                            { data: new Date(hoje.getTime() - 2 * 24 * 60 * 60 * 1000), acao: 'Serviço agendado', usuario: 'Sistema' },
                            { data: new Date(hoje.getTime() - 1 * 24 * 60 * 60 * 1000), acao: 'Serviço realizado', usuario: 'Maria Santos' },
                            { data: hoje, acao: 'Enviado para conferência', usuario: 'Sistema' }
                        ]
                    },
                    {
                        id: 2,
                        cliente: 'Ana Oliveira',
                        endereco: 'Av. Principal, 456 - Jardins',
                        dataRealizacao: hoje,
                        fotografo: 'Pedro Costa',
                        fotografoId: 2,
                        status: 'Em Revisão',
                        tipo: 'Apartamento',
                        servicos: ['Fotos', 'Drone'],
                        qualidade: 'Boa',
                        avaliacao: 4,
                        observacoes: 'Boa qualidade geral, algumas fotos poderiam ter melhor iluminação.',
                        imagens: [
                            { id: 5, url: 'https://via.placeholder.com/300x200/17a2b8/ffffff?text=Foto+5', nome: 'fachada_01.jpg' },
                            { id: 6, url: 'https://via.placeholder.com/300x200/6f42c1/ffffff?text=Foto+6', nome: 'varanda_01.jpg' },
                            { id: 7, url: 'https://via.placeholder.com/300x200/e83e8c/ffffff?text=Foto+7', nome: 'vista_aerea_01.jpg' }
                        ],
                        tempoExecucao: '01:45:00',
                        historico: [
                            { data: new Date(hoje.getTime() - 1 * 24 * 60 * 60 * 1000), acao: 'Serviço agendado', usuario: 'Sistema' },
                            { data: hoje, acao: 'Serviço realizado', usuario: 'Pedro Costa' },
                            { data: hoje, acao: 'Em revisão', usuario: 'Admin' }
                        ]
                    },
                    {
                        id: 3,
                        cliente: 'Carlos Mendes',
                        endereco: 'Rua do Comércio, 789 - Vila Nova',
                        dataRealizacao: new Date(hoje.getTime() - 2 * 24 * 60 * 60 * 1000),
                        fotografo: 'João Silva',
                        fotografoId: 3,
                        status: 'Aprovado',
                        tipo: 'Comercial',
                        servicos: ['Fotos'],
                        qualidade: 'Excelente',
                        avaliacao: 5,
                        observacoes: 'Excelente trabalho! Composição perfeita e iluminação profissional.',
                        imagens: [
                            { id: 8, url: 'https://via.placeholder.com/300x200/20c997/ffffff?text=Foto+8', nome: 'loja_externa_01.jpg' },
                            { id: 9, url: 'https://via.placeholder.com/300x200/fd7e14/ffffff?text=Foto+9', nome: 'loja_interna_01.jpg' }
                        ],
                        tempoExecucao: '01:15:00',
                        historico: [
                            { data: new Date(hoje.getTime() - 3 * 24 * 60 * 60 * 1000), acao: 'Serviço agendado', usuario: 'Sistema' },
                            { data: new Date(hoje.getTime() - 2 * 24 * 60 * 60 * 1000), acao: 'Serviço realizado', usuario: 'João Silva' },
                            { data: new Date(hoje.getTime() - 1 * 24 * 60 * 60 * 1000), acao: 'Aprovado', usuario: 'Admin' }
                        ]
                    },
                    {
                        id: 4,
                        cliente: 'Lucia Santos',
                        endereco: 'Rua das Palmeiras, 321 - Bela Vista',
                        dataRealizacao: new Date(hoje.getTime() - 3 * 24 * 60 * 60 * 1000),
                        fotografo: 'Maria Santos',
                        fotografoId: 1,
                        status: 'Rejeitado',
                        tipo: 'Casa',
                        servicos: ['Fotos', 'Vídeo'],
                        qualidade: 'Regular',
                        avaliacao: 2,
                        observacoes: 'Qualidade técnica insatisfatória. Várias fotos com problemas de foco.',
                        motivosRejeicao: ['Qualidade técnica insatisfatória', 'Problemas de composição'],
                        acoesNecessarias: 'Refazer as fotos dos quartos e sala com melhor iluminação e foco.',
                        imagens: [
                            { id: 10, url: 'https://via.placeholder.com/300x200/6c757d/ffffff?text=Foto+10', nome: 'casa_fachada_01.jpg' }
                        ],
                        tempoExecucao: '03:00:00',
                        historico: [
                            { data: new Date(hoje.getTime() - 4 * 24 * 60 * 60 * 1000), acao: 'Serviço agendado', usuario: 'Sistema' },
                            { data: new Date(hoje.getTime() - 3 * 24 * 60 * 60 * 1000), acao: 'Serviço realizado', usuario: 'Maria Santos' },
                            { data: new Date(hoje.getTime() - 2 * 24 * 60 * 60 * 1000), acao: 'Rejeitado', usuario: 'Admin' }
                        ]
                    }
                ];

                resolve(servicos);
            }, 500);
        });
    }

    async buscarFotografos() {
        // Simulação - em produção, fazer chamada para API Tadabase
        return new Promise((resolve) => {
            setTimeout(() => {
                const fotografos = [
                    { id: 1, nome: 'Maria Santos', email: 'maria@foto.com' },
                    { id: 2, nome: 'Pedro Costa', email: 'pedro@foto.com' },
                    { id: 3, nome: 'João Silva', email: 'joao@foto.com' }
                ];
                resolve(fotografos);
            }, 200);
        });
    }

    popularSelects() {
        // Popular select de fotógrafos
        const selectFotografo = document.getElementById('filtroFotografo');
        const selectFotografoRelatorio = document.getElementById('fotografoRelatorio');
        
        [selectFotografo, selectFotografoRelatorio].forEach(select => {
            // Limpar opções existentes (exceto a primeira)
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }
            
            this.fotografos.forEach(fotografo => {
                const option = document.createElement('option');
                option.value = fotografo.nome;
                option.textContent = fotografo.nome;
                select.appendChild(option);
            });
        });
    }

    atualizarEstatisticas() {
        const total = this.servicos.length;
        const pendentes = this.servicos.filter(s => s.status === 'Pendente').length;
        const emRevisao = this.servicos.filter(s => s.status === 'Em Revisão').length;
        const aprovados = this.servicos.filter(s => s.status === 'Aprovado').length;

        document.getElementById('totalConferencia').textContent = total;
        document.getElementById('pendentesConferencia').textContent = pendentes;
        document.getElementById('emRevisao').textContent = emRevisao;
        document.getElementById('aprovados').textContent = aprovados;
    }

    aplicarFiltros() {
        const filtroStatus = document.getElementById('filtroStatus').value;
        const filtroFotografo = document.getElementById('filtroFotografo').value;
        const filtroQualidade = document.getElementById('filtroQualidade').value;
        const filtroPeriodo = document.getElementById('filtroPeriodo').value;
        const buscaRapida = document.getElementById('buscaRapida').value.toLowerCase();

        let servicosFiltrados = [...this.servicos];

        // Filtro por status
        if (filtroStatus) {
            servicosFiltrados = servicosFiltrados.filter(s => s.status === filtroStatus);
        }

        // Filtro por fotógrafo
        if (filtroFotografo) {
            servicosFiltrados = servicosFiltrados.filter(s => s.fotografo === filtroFotografo);
        }

        // Filtro por qualidade
        if (filtroQualidade) {
            servicosFiltrados = servicosFiltrados.filter(s => s.qualidade === filtroQualidade);
        }

        // Filtro por período
        const hoje = new Date();
        switch (filtroPeriodo) {
            case 'hoje':
                servicosFiltrados = servicosFiltrados.filter(s => 
                    this.isSameDay(s.dataRealizacao, hoje)
                );
                break;
            case 'semana':
                const inicioSemana = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
                servicosFiltrados = servicosFiltrados.filter(s => 
                    s.dataRealizacao >= inicioSemana && s.dataRealizacao <= hoje
                );
                break;
            case 'mes':
                const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                servicosFiltrados = servicosFiltrados.filter(s => 
                    s.dataRealizacao >= inicioMes && s.dataRealizacao <= hoje
                );
                break;
        }

        // Busca rápida
        if (buscaRapida) {
            servicosFiltrados = servicosFiltrados.filter(s => 
                s.cliente.toLowerCase().includes(buscaRapida) ||
                s.endereco.toLowerCase().includes(buscaRapida) ||
                s.fotografo.toLowerCase().includes(buscaRapida) ||
                s.tipo.toLowerCase().includes(buscaRapida)
            );
        }

        this.renderizarServicos(servicosFiltrados);
    }

    renderizarServicos(servicos) {
        const container = document.getElementById('listaConferencia');
        const semServicos = document.getElementById('semServicos');

        if (servicos.length === 0) {
            container.innerHTML = '';
            semServicos.style.display = 'block';
            document.getElementById('totalFiltrados').textContent = '0 serviços';
            return;
        }

        semServicos.style.display = 'none';
        document.getElementById('totalFiltrados').textContent = `${servicos.length} serviço${servicos.length !== 1 ? 's' : ''}`;

        // Ordenar por data de realização (mais recentes primeiro)
        servicos.sort((a, b) => b.dataRealizacao - a.dataRealizacao);

        // Paginação
        const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
        const fim = inicio + this.itensPorPagina;
        const servicosPaginados = servicos.slice(inicio, fim);

        container.innerHTML = servicosPaginados.map(servico => {
            const statusClass = this.getStatusClass(servico.status);
            const statusColor = this.getStatusColor(servico.status);
            const qualidadeClass = this.getQualidadeClass(servico.qualidade);
            
            return `
                <div class="card conferencia-card ${statusClass} mb-3">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-8">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <h6 class="card-title mb-0">
                                        <i class="fas fa-user me-2"></i>${servico.cliente}
                                    </h6>
                                    <div class="d-flex gap-2">
                                        <span class="badge ${statusColor}">${servico.status}</span>
                                        ${servico.qualidade ? `
                                            <span class="quality-indicator ${qualidadeClass}">
                                                <i class="fas fa-star me-1"></i>${servico.qualidade}
                                            </span>
                                        ` : ''}
                                    </div>
                                </div>
                                
                                <div class="info-item">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <span>${servico.endereco}</span>
                                </div>
                                
                                <div class="info-item">
                                    <i class="fas fa-calendar"></i>
                                    <span>Realizado em ${this.formatarData(servico.dataRealizacao)}</span>
                                </div>
                                
                                <div class="info-item">
                                    <i class="fas fa-camera"></i>
                                    <span>Fotógrafo: ${servico.fotografo}</span>
                                </div>
                                
                                <div class="info-item">
                                    <i class="fas fa-home"></i>
                                    <span>${servico.tipo} - ${servico.servicos.join(', ')}</span>
                                </div>
                                
                                <div class="info-item">
                                    <i class="fas fa-images"></i>
                                    <span>${servico.imagens.length} imagem${servico.imagens.length !== 1 ? 's' : ''}</span>
                                </div>
                                
                                ${servico.avaliacao ? `
                                    <div class="info-item">
                                        <i class="fas fa-star"></i>
                                        <span>Avaliação: ${this.gerarEstrelas(servico.avaliacao)}</span>
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div class="col-md-4">
                                <!-- Preview das imagens -->
                                <div class="preview-gallery mb-3" style="max-height: 120px;">
                                    ${servico.imagens.slice(0, 4).map(img => `
                                        <div class="preview-item" onclick="visualizarImagem('${img.url}', '${img.nome}')">
                                            <img src="${img.url}" alt="${img.nome}">
                                            <div class="overlay">
                                                <i class="fas fa-search-plus text-white"></i>
                                            </div>
                                        </div>
                                    `).join('')}
                                    ${servico.imagens.length > 4 ? `
                                        <div class="preview-item d-flex align-items-center justify-content-center bg-light">
                                            <span class="text-muted">+${servico.imagens.length - 4}</span>
                                        </div>
                                    ` : ''}
                                </div>
                                
                                <!-- Botões de ação -->
                                <div class="d-flex gap-2 flex-wrap">
                                    <button class="btn btn-primary btn-sm" onclick="iniciarRevisao(${servico.id})">
                                        <i class="fas fa-search me-1"></i>Revisar
                                    </button>
                                    ${servico.status === 'Rejeitado' ? `
                                        <button class="btn btn-warning btn-sm" onclick="reagendarServico(${servico.id})">
                                            <i class="fas fa-redo me-1"></i>Reagendar
                                        </button>
                                    ` : ''}
                                    <button class="btn btn-outline-info btn-sm" onclick="baixarImagens(${servico.id})">
                                        <i class="fas fa-download me-1"></i>Baixar
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        ${servico.observacoes ? `
                            <div class="mt-3 p-2 bg-light rounded">
                                <small><strong>Observações:</strong> ${servico.observacoes}</small>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // Atualizar paginação
        this.atualizarPaginacao(servicos.length);
    }

    iniciarRevisao(servicoId) {
        const servico = this.servicos.find(s => s.id === servicoId);
        if (!servico) return;

        this.servicoAtual = servico;
        this.preencherModalRevisao(servico);
        
        new bootstrap.Modal(document.getElementById('modalRevisao')).show();
    }

    preencherModalRevisao(servico) {
        // Informações do serviço
        document.getElementById('servicoRevisaoId').value = servico.id;
        
        const infoServico = document.getElementById('infoServico');
        infoServico.innerHTML = `
            <div class="mb-3">
                <h6><i class="fas fa-user me-2"></i>Cliente</h6>
                <p class="mb-1">${servico.cliente}</p>
            </div>
            
            <div class="mb-3">
                <h6><i class="fas fa-map-marker-alt me-2"></i>Endereço</h6>
                <p class="mb-1">${servico.endereco}</p>
            </div>
            
            <div class="mb-3">
                <h6><i class="fas fa-camera me-2"></i>Fotógrafo</h6>
                <p class="mb-1">${servico.fotografo}</p>
            </div>
            
            <div class="mb-3">
                <h6><i class="fas fa-calendar me-2"></i>Data de Realização</h6>
                <p class="mb-1">${this.formatarData(servico.dataRealizacao)}</p>
            </div>
            
            <div class="mb-3">
                <h6><i class="fas fa-home me-2"></i>Tipo</h6>
                <p class="mb-1">${servico.tipo}</p>
            </div>
            
            <div class="mb-3">
                <h6><i class="fas fa-list me-2"></i>Serviços</h6>
                <p class="mb-1">${servico.servicos.join(', ')}</p>
            </div>
            
            <div class="mb-3">
                <h6><i class="fas fa-stopwatch me-2"></i>Tempo de Execução</h6>
                <p class="mb-1">${servico.tempoExecucao}</p>
            </div>
        `;

        // Timeline
        const timeline = document.getElementById('timelineServico');
        timeline.innerHTML = servico.historico.map(item => `
            <div class="timeline-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <strong>${item.acao}</strong>
                        <br>
                        <small class="text-muted">por ${item.usuario}</small>
                    </div>
                    <small class="text-muted">${this.formatarDataHora(item.data)}</small>
                </div>
            </div>
        `).join('');

        // Galeria
        const galeria = document.getElementById('galeriaRevisao');
        galeria.innerHTML = servico.imagens.map(img => `
            <div class="preview-item" onclick="visualizarImagem('${img.url}', '${img.nome}')">
                <img src="${img.url}" alt="${img.nome}">
                <div class="overlay">
                    <i class="fas fa-search-plus text-white"></i>
                </div>
            </div>
        `).join('');

        // Resetar formulário
        document.getElementById('formRevisao').reset();
        this.resetarAvaliacoes();
        this.toggleCamposRejeicao(false);

        // Preencher dados existentes se houver
        if (servico.qualidade) {
            document.getElementById('qualidadeGeral').value = servico.qualidade;
        }
        
        if (servico.observacoes) {
            document.getElementById('observacoesRevisao').value = servico.observacoes;
        }
        
        document.getElementById('statusRevisao').value = servico.status;
        
        if (servico.status === 'Rejeitado') {
            this.toggleCamposRejeicao(true);
            
            if (servico.motivosRejeicao) {
                servico.motivosRejeicao.forEach(motivo => {
                    const checkbox = document.querySelector(`input[type="checkbox"][id*="${motivo.toLowerCase().replace(/\s+/g, '')}"]`);
                    if (checkbox) checkbox.checked = true;
                });
            }
            
            if (servico.acoesNecessarias) {
                document.getElementById('acoesNecessarias').value = servico.acoesNecessarias;
            }
        }
    }

    resetarAvaliacoes() {
        this.avaliacoes = {
            geral: 0,
            composicao: 0,
            iluminacao: 0,
            nitidez: 0
        };

        document.querySelectorAll('.rating-stars').forEach(container => {
            this.definirAvaliacao(container, 0);
        });
    }

    toggleCamposRejeicao(mostrar) {
        const campos = document.getElementById('camposRejeicao');
        campos.style.display = mostrar ? 'block' : 'none';
    }

    async salvarRevisao() {
        const form = document.getElementById('formRevisao');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const dados = {
            servicoId: document.getElementById('servicoRevisaoId').value,
            qualidade: document.getElementById('qualidadeGeral').value,
            status: document.getElementById('statusRevisao').value,
            observacoes: document.getElementById('observacoesRevisao').value,
            avaliacoes: this.avaliacoes
        };

        // Dados específicos para rejeição
        if (dados.status === 'Rejeitado') {
            dados.motivosRejeicao = [];
            document.querySelectorAll('#camposRejeicao input[type="checkbox"]:checked').forEach(checkbox => {
                dados.motivosRejeicao.push(checkbox.nextElementSibling.textContent.trim());
            });
            dados.acoesNecessarias = document.getElementById('acoesNecessarias').value;
        }

        try {
            this.mostrarLoading('Salvando revisão...');

            // Simular salvamento
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Atualizar serviço local
            const servico = this.servicos.find(s => s.id == dados.servicoId);
            if (servico) {
                servico.qualidade = dados.qualidade;
                servico.status = dados.status;
                servico.observacoes = dados.observacoes;
                servico.avaliacao = dados.avaliacoes.geral;
                
                if (dados.status === 'Rejeitado') {
                    servico.motivosRejeicao = dados.motivosRejeicao;
                    servico.acoesNecessarias = dados.acoesNecessarias;
                }

                // Adicionar ao histórico
                servico.historico.push({
                    data: new Date(),
                    acao: `Status alterado para: ${dados.status}`,
                    usuario: 'Admin'
                });
            }

            // Fechar modal
            bootstrap.Modal.getInstance(document.getElementById('modalRevisao')).hide();

            // Atualizar interface
            this.atualizarEstatisticas();
            this.aplicarFiltros();

            this.mostrarMensagem('Revisão salva com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao salvar revisão:', error);
            this.mostrarMensagem('Erro ao salvar revisão.', 'error');
        } finally {
            this.esconderLoading();
        }
    }

    visualizarImagem(url, nome) {
        document.getElementById('tituloImagem').textContent = nome;
        document.getElementById('imagemVisualizacao').src = url;
        
        new bootstrap.Modal(document.getElementById('modalImagem')).show();
    }

    baixarImagem() {
        const img = document.getElementById('imagemVisualizacao');
        const link = document.createElement('a');
        link.href = img.src;
        link.download = document.getElementById('tituloImagem').textContent;
        link.click();
    }

    baixarImagens(servicoId) {
        const servico = this.servicos.find(s => s.id === servicoId);
        if (!servico) return;

        // Simular download de todas as imagens
        this.mostrarMensagem(`Iniciando download de ${servico.imagens.length} imagens...`, 'info');
        
        // Em produção, implementar download real
        setTimeout(() => {
            this.mostrarMensagem('Download concluído!', 'success');
        }, 2000);
    }

    gerarRelatorio() {
        const periodo = document.getElementById('periodoRelatorio').value;
        const fotografo = document.getElementById('fotografoRelatorio').value;
        
        // Filtrar dados para o relatório
        let dadosRelatorio = [...this.servicos];
        
        if (fotografo) {
            dadosRelatorio = dadosRelatorio.filter(s => s.fotografo === fotografo);
        }

        // Filtrar por período
        const hoje = new Date();
        let dataInicio;
        
        switch (periodo) {
            case 'semana':
                dataInicio = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'mes':
                dataInicio = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'trimestre':
                dataInicio = new Date(hoje.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
        }
        
        dadosRelatorio = dadosRelatorio.filter(s => s.dataRealizacao >= dataInicio);

        // Gerar estatísticas
        const stats = {
            total: dadosRelatorio.length,
            aprovados: dadosRelatorio.filter(s => s.status === 'Aprovado').length,
            rejeitados: dadosRelatorio.filter(s => s.status === 'Rejeitado').length,
            pendentes: dadosRelatorio.filter(s => s.status === 'Pendente').length,
            qualidades: {
                excelente: dadosRelatorio.filter(s => s.qualidade === 'Excelente').length,
                boa: dadosRelatorio.filter(s => s.qualidade === 'Boa').length,
                regular: dadosRelatorio.filter(s => s.qualidade === 'Regular').length,
                ruim: dadosRelatorio.filter(s => s.qualidade === 'Ruim').length
            }
        };

        // Renderizar relatório
        const conteudo = document.getElementById('conteudoRelatorio');
        conteudo.innerHTML = `
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h4 class="text-primary">${stats.total}</h4>
                            <small>Total de Serviços</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h4 class="text-success">${stats.aprovados}</h4>
                            <small>Aprovados</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h4 class="text-danger">${stats.rejeitados}</h4>
                            <small>Rejeitados</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h4 class="text-warning">${stats.pendentes}</h4>
                            <small>Pendentes</small>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <h6>Distribuição por Qualidade</h6>
                    <div class="progress mb-2">
                        <div class="progress-bar bg-success" style="width: ${(stats.qualidades.excelente / stats.total * 100) || 0}%"></div>
                        <div class="progress-bar bg-info" style="width: ${(stats.qualidades.boa / stats.total * 100) || 0}%"></div>
                        <div class="progress-bar bg-warning" style="width: ${(stats.qualidades.regular / stats.total * 100) || 0}%"></div>
                        <div class="progress-bar bg-danger" style="width: ${(stats.qualidades.ruim / stats.total * 100) || 0}%"></div>
                    </div>
                    <div class="d-flex justify-content-between">
                        <small>Excelente: ${stats.qualidades.excelente}</small>
                        <small>Boa: ${stats.qualidades.boa}</small>
                        <small>Regular: ${stats.qualidades.regular}</small>
                        <small>Ruim: ${stats.qualidades.ruim}</small>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <h6>Taxa de Aprovação</h6>
                    <div class="progress mb-2">
                        <div class="progress-bar bg-success" style="width: ${(stats.aprovados / stats.total * 100) || 0}%"></div>
                    </div>
                    <p class="text-center">${Math.round((stats.aprovados / stats.total * 100) || 0)}% de aprovação</p>
                </div>
            </div>
        `;
    }

    exportarRelatorio() {
        this.mostrarMensagem('Gerando relatório PDF...', 'info');
        
        // Em produção, implementar geração de PDF
        setTimeout(() => {
            this.mostrarMensagem('Relatório exportado com sucesso!', 'success');
        }, 2000);
    }

    limparFiltros() {
        document.getElementById('filtroStatus').value = '';
        document.getElementById('filtroFotografo').value = '';
        document.getElementById('filtroQualidade').value = '';
        document.getElementById('filtroPeriodo').value = '';
        document.getElementById('buscaRapida').value = '';
        
        this.aplicarFiltros();
    }

    atualizarPaginacao(totalItens) {
        const totalPaginas = Math.ceil(totalItens / this.itensPorPagina);
        const paginacao = document.getElementById('paginacao');
        
        if (totalPaginas <= 1) {
            paginacao.innerHTML = '';
            document.getElementById('infoPaginacao').textContent = `Mostrando ${totalItens} de ${totalItens} serviços`;
            return;
        }

        let html = '';
        
        // Botão anterior
        html += `
            <li class="page-item ${this.paginaAtual === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="sistemaConferencia.irParaPagina(${this.paginaAtual - 1})">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;

        // Páginas
        for (let i = 1; i <= totalPaginas; i++) {
            if (i === 1 || i === totalPaginas || (i >= this.paginaAtual - 2 && i <= this.paginaAtual + 2)) {
                html += `
                    <li class="page-item ${i === this.paginaAtual ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="sistemaConferencia.irParaPagina(${i})">${i}</a>
                    </li>
                `;
            } else if (i === this.paginaAtual - 3 || i === this.paginaAtual + 3) {
                html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }

        // Botão próximo
        html += `
            <li class="page-item ${this.paginaAtual === totalPaginas ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="sistemaConferencia.irParaPagina(${this.paginaAtual + 1})">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;

        paginacao.innerHTML = html;

        // Atualizar informações
        const inicio = (this.paginaAtual - 1) * this.itensPorPagina + 1;
        const fim = Math.min(this.paginaAtual * this.itensPorPagina, totalItens);
        document.getElementById('infoPaginacao').textContent = `Mostrando ${inicio} a ${fim} de ${totalItens} serviços`;
    }

    irParaPagina(pagina) {
        this.paginaAtual = pagina;
        this.aplicarFiltros();
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

    formatarDataHora(data) {
        return data.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getStatusClass(status) {
        const classes = {
            'Pendente': 'status-pendente',
            'Em Revisão': 'status-em-revisao',
            'Aprovado': 'status-aprovado',
            'Rejeitado': 'status-rejeitado'
        };
        return classes[status] || '';
    }

    getStatusColor(status) {
        const cores = {
            'Pendente': 'bg-warning text-dark',
            'Em Revisão': 'bg-info',
            'Aprovado': 'bg-success',
            'Rejeitado': 'bg-danger'
        };
        return cores[status] || 'bg-secondary';
    }

    getQualidadeClass(qualidade) {
        const classes = {
            'Excelente': 'quality-excelente',
            'Boa': 'quality-boa',
            'Regular': 'quality-regular',
            'Ruim': 'quality-ruim'
        };
        return classes[qualidade] || '';
    }

    gerarEstrelas(rating) {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                html += '<i class="fas fa-star text-warning"></i>';
            } else {
                html += '<i class="far fa-star text-muted"></i>';
            }
        }
        return html;
    }

    mostrarMensagem(mensagem, tipo) {
        if (window.mostrarMensagem) {
            window.mostrarMensagem(mensagem, tipo);
        } else {
            alert(mensagem);
        }
    }

    mostrarLoading(mensagem) {
        if (window.mostrarLoading) {
            window.mostrarLoading(mensagem);
        } else {
            document.getElementById('loadingConferencia').style.display = 'block';
        }
    }

    esconderLoading() {
        if (window.esconderLoading) {
            window.esconderLoading();
        } else {
            document.getElementById('loadingConferencia').style.display = 'none';
        }
    }
}

// Funções globais
function atualizarDados() {
    if (sistemaConferencia) {
        sistemaConferencia.carregarDados();
    }
}

function iniciarRevisao(servicoId) {
    if (sistemaConferencia) {
        sistemaConferencia.iniciarRevisao(servicoId);
    }
}

function salvarRevisao() {
    if (sistemaConferencia) {
        sistemaConferencia.salvarRevisao();
    }
}

function visualizarImagem(url, nome) {
    if (sistemaConferencia) {
        sistemaConferencia.visualizarImagem(url, nome);
    }
}

function baixarImagem() {
    if (sistemaConferencia) {
        sistemaConferencia.baixarImagem();
    }
}

function baixarImagens(servicoId) {
    if (sistemaConferencia) {
        sistemaConferencia.baixarImagens(servicoId);
    }
}

function limparFiltros() {
    if (sistemaConferencia) {
        sistemaConferencia.limparFiltros();
    }
}

function exportarRelatorio() {
    if (sistemaConferencia) {
        sistemaConferencia.exportarRelatorio();
    }
}

// Inicializar sistema
let sistemaConferencia;
document.addEventListener('DOMContentLoaded', function() {
    sistemaConferencia = new SistemaConferencia();
    
    // Gerar relatório inicial
    setTimeout(() => {
        sistemaConferencia.gerarRelatorio();
    }, 1000);
});