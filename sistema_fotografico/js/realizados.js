/**
 * Sistema de Consulta de Serviços Realizados
 * Versão: 1.0
 */

class SistemaRealizados {
    constructor() {
        this.servicos = [];
        this.fotografos = [];
        this.servicoAtual = null;
        this.paginaAtual = 1;
        this.itensPorPagina = 10;
        this.atualizacaoInterval = null;
        this.filtrosPeriodo = {
            dataInicial: null,
            dataFinal: null
        };
        
        this.init();
    }

    init() {
        this.configurarEventos();
        this.carregarDados();
        this.configurarAtualizacaoAutomatica();
    }

    configurarEventos() {
        // Filtros
        document.getElementById('filtroPeriodo').addEventListener('change', (e) => {
            this.togglePeriodoPersonalizado(e.target.value === 'personalizado');
            if (e.target.value !== 'personalizado') {
                this.aplicarFiltros();
            }
        });

        document.getElementById('filtroFotografo').addEventListener('change', () => {
            this.aplicarFiltros();
        });

        document.getElementById('filtroTipo').addEventListener('change', () => {
            this.aplicarFiltros();
        });

        document.getElementById('filtroQualidade').addEventListener('change', () => {
            this.aplicarFiltros();
        });

        document.getElementById('buscaRapida').addEventListener('input', () => {
            this.aplicarFiltros();
        });

        // Itens por página
        document.getElementById('itensPorPagina').addEventListener('change', (e) => {
            this.itensPorPagina = parseInt(e.target.value);
            this.paginaAtual = 1;
            this.aplicarFiltros();
        });

        // Atualização automática
        document.getElementById('atualizacaoAutomatica').addEventListener('change', (e) => {
            this.configurarAtualizacaoAutomatica(e.target.checked);
        });
    }

    togglePeriodoPersonalizado(mostrar) {
        const elemento = document.getElementById('periodoPersonalizado');
        elemento.style.display = mostrar ? 'block' : 'none';
        
        if (!mostrar) {
            document.getElementById('dataInicial').value = '';
            document.getElementById('dataFinal').value = '';
            this.filtrosPeriodo = { dataInicial: null, dataFinal: null };
        }
    }

    aplicarPeriodoPersonalizado() {
        const dataInicial = document.getElementById('dataInicial').value;
        const dataFinal = document.getElementById('dataFinal').value;
        
        if (!dataInicial || !dataFinal) {
            this.mostrarMensagem('Por favor, selecione as datas inicial e final.', 'warning');
            return;
        }
        
        if (new Date(dataInicial) > new Date(dataFinal)) {
            this.mostrarMensagem('A data inicial deve ser anterior à data final.', 'warning');
            return;
        }
        
        this.filtrosPeriodo = {
            dataInicial: new Date(dataInicial),
            dataFinal: new Date(dataFinal + 'T23:59:59')
        };
        
        this.aplicarFiltros();
    }

    configurarAtualizacaoAutomatica(ativar = true) {
        if (this.atualizacaoInterval) {
            clearInterval(this.atualizacaoInterval);
            this.atualizacaoInterval = null;
        }
        
        if (ativar) {
            // Atualizar a cada 5 minutos
            this.atualizacaoInterval = setInterval(() => {
                this.carregarDados(true);
            }, 5 * 60 * 1000);
        }
    }

    async carregarDados(silencioso = false) {
        try {
            if (!silencioso) {
                this.mostrarLoading('Carregando serviços realizados...');
            }
            
            // Carregar serviços e fotógrafos
            [this.servicos, this.fotografos] = await Promise.all([
                this.buscarServicosRealizados(),
                this.buscarFotografos()
            ]);
            
            this.popularSelects();
            this.atualizarEstatisticas();
            this.aplicarFiltros();
            
            if (silencioso) {
                this.mostrarMensagem('Dados atualizados automaticamente.', 'info', 2000);
            }
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            if (!silencioso) {
                this.mostrarMensagem('Erro ao carregar dados.', 'error');
            }
        } finally {
            if (!silencioso) {
                this.esconderLoading();
            }
        }
    }

    async buscarServicosRealizados() {
        // Simulação - em produção, fazer chamada para API Tadabase
        return new Promise((resolve) => {
            setTimeout(() => {
                const hoje = new Date();
                const servicos = [];
                
                // Gerar dados de exemplo para os últimos 6 meses
                for (let i = 0; i < 150; i++) {
                    const diasAtras = Math.floor(Math.random() * 180);
                    const dataRealizacao = new Date(hoje.getTime() - diasAtras * 24 * 60 * 60 * 1000);
                    
                    const clientes = [
                        'João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Oliveira', 'Carlos Mendes',
                        'Lucia Santos', 'Roberto Lima', 'Fernanda Souza', 'Ricardo Alves', 'Juliana Pereira',
                        'Marcos Rodrigues', 'Patricia Ferreira', 'Eduardo Martins', 'Camila Barbosa', 'Felipe Nascimento'
                    ];
                    
                    const enderecos = [
                        'Rua das Flores, 123 - Centro',
                        'Av. Principal, 456 - Jardins',
                        'Rua do Comércio, 789 - Vila Nova',
                        'Rua das Palmeiras, 321 - Bela Vista',
                        'Av. Paulista, 1000 - Bela Vista',
                        'Rua Augusta, 500 - Consolação',
                        'Rua Oscar Freire, 200 - Jardins',
                        'Av. Faria Lima, 1500 - Itaim Bibi',
                        'Rua da Consolação, 800 - Centro',
                        'Av. Rebouças, 300 - Pinheiros'
                    ];
                    
                    const tipos = ['Residencial', 'Apartamento', 'Comercial', 'Casa', 'Terreno'];
                    const fotografosNomes = ['Maria Santos', 'Pedro Costa', 'João Silva', 'Ana Rodrigues', 'Carlos Lima'];
                    const qualidades = ['Excelente', 'Boa', 'Regular', 'Ruim'];
                    const servicosTipos = [
                        ['Fotos'],
                        ['Fotos', 'Vídeo'],
                        ['Fotos', 'Drone'],
                        ['Fotos', 'Vídeo', 'Drone'],
                        ['Fotos', 'Planta Baixa'],
                        ['Vídeo', 'Drone']
                    ];
                    
                    const numImagens = Math.floor(Math.random() * 20) + 5;
                    const imagens = [];
                    for (let j = 0; j < numImagens; j++) {
                        imagens.push({
                            id: i * 100 + j,
                            url: `https://via.placeholder.com/300x200/${Math.floor(Math.random() * 16777215).toString(16)}/ffffff?text=Foto+${j + 1}`,
                            nome: `foto_${String(j + 1).padStart(2, '0')}.jpg`
                        });
                    }
                    
                    const qualidade = qualidades[Math.floor(Math.random() * qualidades.length)];
                    const avaliacao = qualidade === 'Excelente' ? 5 : 
                                    qualidade === 'Boa' ? 4 : 
                                    qualidade === 'Regular' ? 3 : 2;
                    
                    const observacoes = [
                        'Excelente trabalho! Composição perfeita e iluminação profissional.',
                        'Boa qualidade geral, algumas fotos poderiam ter melhor iluminação.',
                        'Trabalho satisfatório dentro do prazo estabelecido.',
                        'Cliente muito satisfeito com o resultado final.',
                        'Imóvel com boa iluminação natural facilitou o trabalho.',
                        'Algumas dificuldades com a iluminação, mas resultado final aprovado.',
                        'Excelente colaboração do cliente durante a sessão.',
                        'Imóvel bem preparado para a sessão fotográfica.',
                        ''
                    ];
                    
                    servicos.push({
                        id: i + 1,
                        cliente: clientes[Math.floor(Math.random() * clientes.length)],
                        endereco: enderecos[Math.floor(Math.random() * enderecos.length)],
                        dataRealizacao: dataRealizacao,
                        dataEntrega: new Date(dataRealizacao.getTime() + (Math.floor(Math.random() * 3) + 1) * 24 * 60 * 60 * 1000),
                        fotografo: fotografosNomes[Math.floor(Math.random() * fotografosNomes.length)],
                        fotografoId: Math.floor(Math.random() * 5) + 1,
                        tipo: tipos[Math.floor(Math.random() * tipos.length)],
                        servicos: servicosTipos[Math.floor(Math.random() * servicosTipos.length)],
                        qualidade: qualidade,
                        avaliacao: avaliacao,
                        observacoes: observacoes[Math.floor(Math.random() * observacoes.length)],
                        imagens: imagens,
                        tempoExecucao: `${String(Math.floor(Math.random() * 3) + 1).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
                        valorServico: (Math.random() * 500 + 200).toFixed(2),
                        status: 'Realizado',
                        prioridade: Math.random() > 0.7 ? 'Alta' : Math.random() > 0.4 ? 'Média' : 'Normal',
                        historico: [
                            { 
                                data: new Date(dataRealizacao.getTime() - 2 * 24 * 60 * 60 * 1000), 
                                acao: 'Serviço agendado', 
                                usuario: 'Sistema' 
                            },
                            { 
                                data: dataRealizacao, 
                                acao: 'Serviço realizado', 
                                usuario: fotografosNomes[Math.floor(Math.random() * fotografosNomes.length)]
                            },
                            { 
                                data: new Date(dataRealizacao.getTime() + 1 * 24 * 60 * 60 * 1000), 
                                acao: 'Aprovado na conferência', 
                                usuario: 'Admin' 
                            },
                            { 
                                data: new Date(dataRealizacao.getTime() + (Math.floor(Math.random() * 3) + 1) * 24 * 60 * 60 * 1000), 
                                acao: 'Entregue ao cliente', 
                                usuario: 'Sistema' 
                            }
                        ]
                    });
                }
                
                // Ordenar por data de realização (mais recentes primeiro)
                servicos.sort((a, b) => b.dataRealizacao - a.dataRealizacao);
                
                resolve(servicos);
            }, 800);
        });
    }

    async buscarFotografos() {
        // Simulação - em produção, fazer chamada para API Tadabase
        return new Promise((resolve) => {
            setTimeout(() => {
                const fotografos = [
                    { id: 1, nome: 'Maria Santos', email: 'maria@foto.com' },
                    { id: 2, nome: 'Pedro Costa', email: 'pedro@foto.com' },
                    { id: 3, nome: 'João Silva', email: 'joao@foto.com' },
                    { id: 4, nome: 'Ana Rodrigues', email: 'ana@foto.com' },
                    { id: 5, nome: 'Carlos Lima', email: 'carlos@foto.com' }
                ];
                resolve(fotografos);
            }, 200);
        });
    }

    popularSelects() {
        // Popular select de fotógrafos
        const selectFotografo = document.getElementById('filtroFotografo');
        
        // Limpar opções existentes (exceto a primeira)
        while (selectFotografo.children.length > 1) {
            selectFotografo.removeChild(selectFotografo.lastChild);
        }
        
        this.fotografos.forEach(fotografo => {
            const option = document.createElement('option');
            option.value = fotografo.nome;
            option.textContent = fotografo.nome;
            selectFotografo.appendChild(option);
        });
    }

    atualizarEstatisticas() {
        const hoje = new Date();
        const inicioSemana = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

        const total = this.servicos.length;
        const realizadosHoje = this.servicos.filter(s => this.isSameDay(s.dataRealizacao, hoje)).length;
        const realizadosSemana = this.servicos.filter(s => s.dataRealizacao >= inicioSemana).length;
        const realizadosMes = this.servicos.filter(s => s.dataRealizacao >= inicioMes).length;

        document.getElementById('totalRealizados').textContent = total;
        document.getElementById('realizadosHoje').textContent = realizadosHoje;
        document.getElementById('realizadosSemana').textContent = realizadosSemana;
        document.getElementById('realizadosMes').textContent = realizadosMes;
    }

    aplicarFiltros() {
        const filtroPeriodo = document.getElementById('filtroPeriodo').value;
        const filtroFotografo = document.getElementById('filtroFotografo').value;
        const filtroTipo = document.getElementById('filtroTipo').value;
        const filtroQualidade = document.getElementById('filtroQualidade').value;
        const buscaRapida = document.getElementById('buscaRapida').value.toLowerCase();

        let servicosFiltrados = [...this.servicos];

        // Filtro por período
        if (filtroPeriodo && filtroPeriodo !== 'personalizado') {
            const hoje = new Date();
            let dataInicio;
            
            switch (filtroPeriodo) {
                case 'hoje':
                    servicosFiltrados = servicosFiltrados.filter(s => 
                        this.isSameDay(s.dataRealizacao, hoje)
                    );
                    break;
                case 'semana':
                    dataInicio = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
                    servicosFiltrados = servicosFiltrados.filter(s => 
                        s.dataRealizacao >= dataInicio && s.dataRealizacao <= hoje
                    );
                    break;
                case 'mes':
                    dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                    servicosFiltrados = servicosFiltrados.filter(s => 
                        s.dataRealizacao >= dataInicio && s.dataRealizacao <= hoje
                    );
                    break;
                case 'trimestre':
                    dataInicio = new Date(hoje.getTime() - 90 * 24 * 60 * 60 * 1000);
                    servicosFiltrados = servicosFiltrados.filter(s => 
                        s.dataRealizacao >= dataInicio && s.dataRealizacao <= hoje
                    );
                    break;
                case 'ano':
                    dataInicio = new Date(hoje.getFullYear(), 0, 1);
                    servicosFiltrados = servicosFiltrados.filter(s => 
                        s.dataRealizacao >= dataInicio && s.dataRealizacao <= hoje
                    );
                    break;
            }
        }

        // Filtro por período personalizado
        if (this.filtrosPeriodo.dataInicial && this.filtrosPeriodo.dataFinal) {
            servicosFiltrados = servicosFiltrados.filter(s => 
                s.dataRealizacao >= this.filtrosPeriodo.dataInicial && 
                s.dataRealizacao <= this.filtrosPeriodo.dataFinal
            );
        }

        // Filtro por fotógrafo
        if (filtroFotografo) {
            servicosFiltrados = servicosFiltrados.filter(s => s.fotografo === filtroFotografo);
        }

        // Filtro por tipo
        if (filtroTipo) {
            servicosFiltrados = servicosFiltrados.filter(s => s.tipo === filtroTipo);
        }

        // Filtro por qualidade
        if (filtroQualidade) {
            servicosFiltrados = servicosFiltrados.filter(s => s.qualidade === filtroQualidade);
        }

        // Busca rápida
        if (buscaRapida) {
            servicosFiltrados = servicosFiltrados.filter(s => 
                s.cliente.toLowerCase().includes(buscaRapida) ||
                s.endereco.toLowerCase().includes(buscaRapida) ||
                s.fotografo.toLowerCase().includes(buscaRapida) ||
                s.tipo.toLowerCase().includes(buscaRapida) ||
                s.observacoes.toLowerCase().includes(buscaRapida) ||
                s.servicos.some(servico => servico.toLowerCase().includes(buscaRapida))
            );
        }

        this.atualizarPeriodoAtivo();
        this.renderizarServicos(servicosFiltrados);
    }

    atualizarPeriodoAtivo() {
        const filtroPeriodo = document.getElementById('filtroPeriodo').value;
        const periodoAtivo = document.getElementById('periodoAtivo');
        
        let texto = '';
        
        if (filtroPeriodo) {
            const periodos = {
                'hoje': 'Hoje',
                'semana': 'Esta Semana',
                'mes': 'Este Mês',
                'trimestre': 'Último Trimestre',
                'ano': 'Este Ano',
                'personalizado': 'Período Personalizado'
            };
            texto = periodos[filtroPeriodo] || '';
        }
        
        if (this.filtrosPeriodo.dataInicial && this.filtrosPeriodo.dataFinal) {
            texto = `${this.formatarData(this.filtrosPeriodo.dataInicial)} - ${this.formatarData(this.filtrosPeriodo.dataFinal)}`;
        }
        
        periodoAtivo.textContent = texto;
        periodoAtivo.style.display = texto ? 'inline-block' : 'none';
    }

    renderizarServicos(servicos) {
        const container = document.getElementById('listaRealizados');
        const semServicos = document.getElementById('semRealizados');

        if (servicos.length === 0) {
            container.innerHTML = '';
            semServicos.style.display = 'block';
            document.getElementById('totalFiltrados').textContent = '0 serviços';
            return;
        }

        semServicos.style.display = 'none';
        document.getElementById('totalFiltrados').textContent = `${servicos.length} serviço${servicos.length !== 1 ? 's' : ''}`;

        // Paginação
        const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
        const fim = inicio + this.itensPorPagina;
        const servicosPaginados = servicos.slice(inicio, fim);

        container.innerHTML = servicosPaginados.map(servico => {
            const qualidadeClass = this.getQualidadeClass(servico.qualidade);
            const prioridadeColor = this.getPrioridadeColor(servico.prioridade);
            
            return `
                <div class="card realizados-card mb-3">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-8">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <h6 class="card-title mb-0">
                                        <i class="fas fa-user me-2"></i>${servico.cliente}
                                    </h6>
                                    <div class="d-flex gap-2 align-items-center">
                                        <span class="badge bg-success">Realizado</span>
                                        <span class="quality-indicator ${qualidadeClass}">
                                            <i class="fas fa-star me-1"></i>${servico.qualidade}
                                        </span>
                                        ${servico.prioridade !== 'Normal' ? `
                                            <span class="badge ${prioridadeColor}">${servico.prioridade}</span>
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
                                    <i class="fas fa-truck"></i>
                                    <span>Entregue em ${this.formatarData(servico.dataEntrega)}</span>
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
                                
                                <div class="info-item">
                                    <i class="fas fa-stopwatch"></i>
                                    <span>Tempo: ${servico.tempoExecucao}</span>
                                </div>
                                
                                <div class="info-item">
                                    <i class="fas fa-star"></i>
                                    <span>Avaliação: ${this.gerarEstrelas(servico.avaliacao)}</span>
                                </div>
                                
                                <div class="info-item">
                                    <i class="fas fa-dollar-sign"></i>
                                    <span>Valor: R$ ${servico.valorServico}</span>
                                </div>
                            </div>
                            
                            <div class="col-md-4">
                                <!-- Preview das imagens -->
                                <div class="preview-gallery mb-3" style="max-height: 120px;">
                                    ${servico.imagens.slice(0, 6).map(img => `
                                        <div class="preview-item" onclick="visualizarImagem('${img.url}', '${img.nome}')">
                                            <img src="${img.url}" alt="${img.nome}">
                                            <div class="overlay">
                                                <i class="fas fa-search-plus text-white"></i>
                                            </div>
                                        </div>
                                    `).join('')}
                                    ${servico.imagens.length > 6 ? `
                                        <div class="preview-item d-flex align-items-center justify-content-center bg-light">
                                            <span class="text-muted">+${servico.imagens.length - 6}</span>
                                        </div>
                                    ` : ''}
                                </div>
                                
                                <!-- Botões de ação -->
                                <div class="d-flex gap-2 flex-wrap">
                                    <button class="btn btn-primary btn-sm" onclick="verDetalhes(${servico.id})">
                                        <i class="fas fa-eye me-1"></i>Detalhes
                                    </button>
                                    <button class="btn btn-success btn-sm" onclick="baixarImagens(${servico.id})">
                                        <i class="fas fa-download me-1"></i>Baixar
                                    </button>
                                    <button class="btn btn-outline-info btn-sm" onclick="gerarRelatorio(${servico.id})">
                                        <i class="fas fa-file-pdf me-1"></i>Relatório
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

    verDetalhes(servicoId) {
        const servico = this.servicos.find(s => s.id === servicoId);
        if (!servico) return;

        this.servicoAtual = servico;
        this.preencherModalDetalhes(servico);
        
        new bootstrap.Modal(document.getElementById('modalDetalhes')).show();
    }

    preencherModalDetalhes(servico) {
        // Informações do serviço
        const infoServico = document.getElementById('infoServicoDetalhes');
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
                <h6><i class="fas fa-truck me-2"></i>Data de Entrega</h6>
                <p class="mb-1">${this.formatarData(servico.dataEntrega)}</p>
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
            
            <div class="mb-3">
                <h6><i class="fas fa-star me-2"></i>Qualidade</h6>
                <p class="mb-1">
                    <span class="quality-indicator ${this.getQualidadeClass(servico.qualidade)}">
                        ${servico.qualidade}
                    </span>
                    ${this.gerarEstrelas(servico.avaliacao)}
                </p>
            </div>
            
            <div class="mb-3">
                <h6><i class="fas fa-dollar-sign me-2"></i>Valor do Serviço</h6>
                <p class="mb-1">R$ ${servico.valorServico}</p>
            </div>
            
            ${servico.observacoes ? `
                <div class="mb-3">
                    <h6><i class="fas fa-comment me-2"></i>Observações</h6>
                    <p class="mb-1">${servico.observacoes}</p>
                </div>
            ` : ''}
        `;

        // Timeline
        const timeline = document.getElementById('timelineServicoDetalhes');
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

        // Galeria completa
        const galeria = document.getElementById('galeriaCompleta');
        galeria.innerHTML = servico.imagens.map(img => `
            <div class="preview-item" onclick="visualizarImagem('${img.url}', '${img.nome}')">
                <img src="${img.url}" alt="${img.nome}">
                <div class="overlay">
                    <i class="fas fa-search-plus text-white"></i>
                </div>
            </div>
        `).join('');
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

        this.mostrarMensagem(`Iniciando download de ${servico.imagens.length} imagens...`, 'info');
        
        // Em produção, implementar download real
        setTimeout(() => {
            this.mostrarMensagem('Download concluído!', 'success');
        }, 2000);
    }

    baixarTodasImagens() {
        if (!this.servicoAtual) return;
        this.baixarImagens(this.servicoAtual.id);
    }

    gerarRelatorio(servicoId) {
        const servico = this.servicos.find(s => s.id === servicoId);
        if (!servico) return;

        this.mostrarMensagem('Gerando relatório do serviço...', 'info');
        
        // Em produção, implementar geração de relatório
        setTimeout(() => {
            this.mostrarMensagem('Relatório gerado com sucesso!', 'success');
        }, 2000);
    }

    gerarRelatorioServico() {
        if (!this.servicoAtual) return;
        this.gerarRelatorio(this.servicoAtual.id);
    }

    exportarExcel() {
        this.mostrarMensagem('Gerando arquivo Excel...', 'info');
        
        // Em produção, implementar exportação para Excel
        setTimeout(() => {
            this.mostrarMensagem('Arquivo Excel exportado com sucesso!', 'success');
        }, 2000);
    }

    exportarPDF() {
        this.mostrarMensagem('Gerando arquivo PDF...', 'info');
        
        // Em produção, implementar exportação para PDF
        setTimeout(() => {
            this.mostrarMensagem('Arquivo PDF exportado com sucesso!', 'success');
        }, 2000);
    }

    exportarCSV() {
        this.mostrarMensagem('Gerando arquivo CSV...', 'info');
        
        // Em produção, implementar exportação para CSV
        setTimeout(() => {
            this.mostrarMensagem('Arquivo CSV exportado com sucesso!', 'success');
        }, 2000);
    }

    limparFiltros() {
        document.getElementById('filtroPeriodo').value = '';
        document.getElementById('filtroFotografo').value = '';
        document.getElementById('filtroTipo').value = '';
        document.getElementById('filtroQualidade').value = '';
        document.getElementById('buscaRapida').value = '';
        document.getElementById('dataInicial').value = '';
        document.getElementById('dataFinal').value = '';
        
        this.filtrosPeriodo = { dataInicial: null, dataFinal: null };
        this.togglePeriodoPersonalizado(false);
        this.paginaAtual = 1;
        
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
                <a class="page-link" href="#" onclick="sistemaRealizados.irParaPagina(${this.paginaAtual - 1})">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;

        // Páginas
        for (let i = 1; i <= totalPaginas; i++) {
            if (i === 1 || i === totalPaginas || (i >= this.paginaAtual - 2 && i <= this.paginaAtual + 2)) {
                html += `
                    <li class="page-item ${i === this.paginaAtual ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="sistemaRealizados.irParaPagina(${i})">${i}</a>
                    </li>
                `;
            } else if (i === this.paginaAtual - 3 || i === this.paginaAtual + 3) {
                html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }

        // Botão próximo
        html += `
            <li class="page-item ${this.paginaAtual === totalPaginas ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="sistemaRealizados.irParaPagina(${this.paginaAtual + 1})">
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

    getQualidadeClass(qualidade) {
        const classes = {
            'Excelente': 'quality-excelente',
            'Boa': 'quality-boa',
            'Regular': 'quality-regular',
            'Ruim': 'quality-ruim'
        };
        return classes[qualidade] || '';
    }

    getPrioridadeColor(prioridade) {
        const cores = {
            'Alta': 'bg-danger',
            'Média': 'bg-warning text-dark',
            'Normal': 'bg-secondary'
        };
        return cores[prioridade] || 'bg-secondary';
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

    mostrarMensagem(mensagem, tipo, duracao = 5000) {
        if (window.mostrarMensagem) {
            window.mostrarMensagem(mensagem, tipo, duracao);
        } else {
            alert(mensagem);
        }
    }

    mostrarLoading(mensagem) {
        if (window.mostrarLoading) {
            window.mostrarLoading(mensagem);
        } else {
            document.getElementById('loadingRealizados').style.display = 'block';
        }
    }

    esconderLoading() {
        if (window.esconderLoading) {
            window.esconderLoading();
        } else {
            document.getElementById('loadingRealizados').style.display = 'none';
        }
    }
}

// Funções globais
function atualizarDados() {
    if (sistemaRealizados) {
        sistemaRealizados.carregarDados();
    }
}

function verDetalhes(servicoId) {
    if (sistemaRealizados) {
        sistemaRealizados.verDetalhes(servicoId);
    }
}

function visualizarImagem(url, nome) {
    if (sistemaRealizados) {
        sistemaRealizados.visualizarImagem(url, nome);
    }
}

function baixarImagem() {
    if (sistemaRealizados) {
        sistemaRealizados.baixarImagem();
    }
}

function baixarImagens(servicoId) {
    if (sistemaRealizados) {
        sistemaRealizados.baixarImagens(servicoId);
    }
}

function baixarTodasImagens() {
    if (sistemaRealizados) {
        sistemaRealizados.baixarTodasImagens();
    }
}

function gerarRelatorio(servicoId) {
    if (sistemaRealizados) {
        sistemaRealizados.gerarRelatorio(servicoId);
    }
}

function gerarRelatorioServico() {
    if (sistemaRealizados) {
        sistemaRealizados.gerarRelatorioServico();
    }
}

function exportarExcel() {
    if (sistemaRealizados) {
        sistemaRealizados.exportarExcel();
    }
}

function exportarPDF() {
    if (sistemaRealizados) {
        sistemaRealizados.exportarPDF();
    }
}

function exportarCSV() {
    if (sistemaRealizados) {
        sistemaRealizados.exportarCSV();
    }
}

function limparFiltros() {
    if (sistemaRealizados) {
        sistemaRealizados.limparFiltros();
    }
}

function aplicarPeriodoPersonalizado() {
    if (sistemaRealizados) {
        sistemaRealizados.aplicarPeriodoPersonalizado();
    }
}

// Inicializar sistema
let sistemaRealizados;
document.addEventListener('DOMContentLoaded', function() {
    sistemaRealizados = new SistemaRealizados();
});