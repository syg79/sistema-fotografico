// JavaScript específico para página de Pedidos Pendentes
class PedidosPendentes {
    constructor() {
        this.pedidos = [];
        this.pedidosFiltrados = [];
        this.paginaAtual = 1;
        this.itensPorPagina = 25;
        this.pedidosSelecionados = new Set();
        
        this.init();
    }

    init() {
        this.configurarEventos();
        this.carregarDados();
        this.atualizarEstatisticas();
    }

    configurarEventos() {
        // Filtros
        document.getElementById('formFiltros').addEventListener('submit', (e) => {
            e.preventDefault();
            this.aplicarFiltros();
        });

        document.getElementById('btnLimparFiltros').addEventListener('click', () => this.limparFiltros());
        document.getElementById('btnLimparBusca').addEventListener('click', () => this.limparBusca());

        // Período personalizado
        document.getElementById('filtroPeriodo').addEventListener('change', (e) => {
            const periodoPersonalizado = document.getElementById('periodoPersonalizado');
            periodoPersonalizado.style.display = e.target.value === 'personalizado' ? 'block' : 'none';
        });

        // Busca em tempo real
        document.getElementById('busca').addEventListener('input', (e) => {
            clearTimeout(this.buscaTimeout);
            this.buscaTimeout = setTimeout(() => {
                this.aplicarFiltros();
            }, 500);
        });

        // Paginação
        document.getElementById('itensPorPagina').addEventListener('change', (e) => {
            this.itensPorPagina = parseInt(e.target.value);
            this.paginaAtual = 1;
            this.renderizarTabela();
        });

        // Seleção
        document.getElementById('selecionarTodos').addEventListener('change', (e) => {
            this.selecionarTodos(e.target.checked);
        });

        // Botões de ação
        document.getElementById('btnAtualizarLista').addEventListener('click', () => this.carregarDados());
        document.getElementById('btnExportarPendentes').addEventListener('click', () => this.exportarPendentes());

        // Ações em lote
        document.getElementById('btnAgendar').addEventListener('click', () => this.agendarSelecionados());
        document.getElementById('btnAlterarStatus').addEventListener('click', () => this.alterarStatusSelecionados());
        document.getElementById('btnExportarSelecionados').addEventListener('click', () => this.exportarSelecionados());
        document.getElementById('btnCancelarSelecionados').addEventListener('click', () => this.cancelarSelecionados());

        // Modal de detalhes
        document.getElementById('btnEditarPedido').addEventListener('click', () => this.editarPedido());
        document.getElementById('btnAgendarPedido').addEventListener('click', () => this.agendarPedido());
    }

    async carregarDados() {
        this.mostrarLoading(true);
        
        try {
            // Simular carregamento de dados - depois integrar com API real
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.pedidos = this.gerarDadosSimulados();
            this.pedidosFiltrados = [...this.pedidos];
            
            await this.carregarClientes();
            this.renderizarTabela();
            this.atualizarEstatisticas();
            
        } catch (error) {
            console.error('Erro ao carregar pedidos:', error);
            window.sistema.mostrarErro('Erro ao carregar pedidos pendentes');
        } finally {
            this.mostrarLoading(false);
        }
    }

    gerarDadosSimulados() {
        const redes = ['Apolar', 'Bee', 'Nexus', 'Rede Imoveis', 'Vitrine'];
        const clientes = ['Cliente A', 'Cliente B', 'Cliente C', 'Cliente D'];
        const corretores = ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa'];
        const tiposServico = ['Fotos', 'Vídeo', 'Drone', 'Planta'];
        const enderecos = [
            'Rua das Flores, 123 - Copacabana',
            'Av. Atlântica, 456 - Ipanema',
            'Rua Barata Ribeiro, 789 - Copacabana',
            'Av. Vieira Souto, 321 - Ipanema',
            'Rua Visconde de Pirajá, 654 - Ipanema'
        ];

        const pedidos = [];
        for (let i = 1; i <= 50; i++) {
            const dataBase = new Date();
            dataBase.setDate(dataBase.getDate() - Math.floor(Math.random() * 30));
            
            pedidos.push({
                id: i,
                data_solicitacao: dataBase.toISOString().split('T')[0],
                rede: redes[Math.floor(Math.random() * redes.length)],
                cliente: clientes[Math.floor(Math.random() * clientes.length)],
                corretor: corretores[Math.floor(Math.random() * corretores.length)],
                endereco: enderecos[Math.floor(Math.random() * enderecos.length)],
                tipo_servico: tiposServico[Math.floor(Math.random() * tiposServico.length)],
                contato: `(21) 9${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 10000)}`,
                status: 'Pendente',
                referencia: `REF${String(i).padStart(4, '0')}`,
                observacoes: `Observações do pedido ${i}`,
                dias_pendente: Math.floor(Math.random() * 15)
            });
        }
        
        return pedidos;
    }

    async carregarClientes() {
        try {
            // Extrair clientes únicos dos pedidos
            const clientesUnicos = [...new Set(this.pedidos.map(p => p.cliente))];
            
            const selectCliente = document.getElementById('filtroCliente');
            selectCliente.innerHTML = '<option value="">Todos os clientes</option>';
            
            clientesUnicos.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente;
                option.textContent = cliente;
                selectCliente.appendChild(option);
            });
            
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        }
    }

    aplicarFiltros() {
        const filtros = {
            rede: document.getElementById('filtroRede').value,
            cliente: document.getElementById('filtroCliente').value,
            tipo_servico: document.getElementById('filtroTipoServico').value,
            periodo: document.getElementById('filtroPeriodo').value,
            data_inicio: document.getElementById('dataInicio').value,
            data_fim: document.getElementById('dataFim').value,
            busca: document.getElementById('busca').value.toLowerCase()
        };

        this.pedidosFiltrados = this.pedidos.filter(pedido => {
            // Filtro por rede
            if (filtros.rede && pedido.rede !== filtros.rede) return false;
            
            // Filtro por cliente
            if (filtros.cliente && pedido.cliente !== filtros.cliente) return false;
            
            // Filtro por tipo de serviço
            if (filtros.tipo_servico && pedido.tipo_servico !== filtros.tipo_servico) return false;
            
            // Filtro por período
            if (filtros.periodo) {
                const dataPedido = new Date(pedido.data_solicitacao);
                const hoje = new Date();
                
                switch (filtros.periodo) {
                    case 'hoje':
                        if (dataPedido.toDateString() !== hoje.toDateString()) return false;
                        break;
                    case 'ontem':
                        const ontem = new Date(hoje);
                        ontem.setDate(ontem.getDate() - 1);
                        if (dataPedido.toDateString() !== ontem.toDateString()) return false;
                        break;
                    case 'ultimos_7_dias':
                        const seteDiasAtras = new Date(hoje);
                        seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
                        if (dataPedido < seteDiasAtras) return false;
                        break;
                    case 'ultimos_30_dias':
                        const trintaDiasAtras = new Date(hoje);
                        trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
                        if (dataPedido < trintaDiasAtras) return false;
                        break;
                    case 'personalizado':
                        if (filtros.data_inicio && dataPedido < new Date(filtros.data_inicio)) return false;
                        if (filtros.data_fim && dataPedido > new Date(filtros.data_fim)) return false;
                        break;
                }
            }
            
            // Busca geral
            if (filtros.busca) {
                const textosBusca = [
                    pedido.endereco,
                    pedido.referencia,
                    pedido.corretor,
                    pedido.cliente,
                    pedido.rede
                ].join(' ').toLowerCase();
                
                if (!textosBusca.includes(filtros.busca)) return false;
            }
            
            return true;
        });

        this.paginaAtual = 1;
        this.renderizarTabela();
        this.atualizarEstatisticas();
    }

    limparFiltros() {
        document.getElementById('formFiltros').reset();
        document.getElementById('periodoPersonalizado').style.display = 'none';
        this.pedidosFiltrados = [...this.pedidos];
        this.paginaAtual = 1;
        this.renderizarTabela();
        this.atualizarEstatisticas();
    }

    limparBusca() {
        document.getElementById('busca').value = '';
        this.aplicarFiltros();
    }

    renderizarTabela() {
        const tbody = document.getElementById('corpoTabelaPendentes');
        const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
        const fim = inicio + this.itensPorPagina;
        const pedidosPagina = this.pedidosFiltrados.slice(inicio, fim);

        if (pedidosPagina.length === 0) {
            this.mostrarSemDados(true);
            return;
        }

        this.mostrarSemDados(false);

        tbody.innerHTML = pedidosPagina.map(pedido => `
            <tr data-pedido-id="${pedido.id}" ${pedido.dias_pendente > 7 ? 'class="table-warning"' : ''}>
                <td>
                    <input type="checkbox" class="form-check-input pedido-checkbox" 
                           value="${pedido.id}" ${this.pedidosSelecionados.has(pedido.id) ? 'checked' : ''}>
                </td>
                <td>
                    <div class="d-flex flex-column">
                        <span>${SistemaUtils.formatarData(pedido.data_solicitacao)}</span>
                        <small class="text-muted">${pedido.dias_pendente} dias</small>
                    </div>
                </td>
                <td><span class="badge bg-primary">${pedido.rede}</span></td>
                <td>${pedido.cliente}</td>
                <td>${pedido.corretor}</td>
                <td>
                    <div class="text-truncate" style="max-width: 200px;" title="${pedido.endereco}">
                        ${pedido.endereco}
                    </div>
                </td>
                <td><span class="badge bg-info">${pedido.tipo_servico}</span></td>
                <td>
                    <a href="tel:${pedido.contato}" class="text-decoration-none">
                        <i class="fas fa-phone me-1"></i>${pedido.contato}
                    </a>
                </td>
                <td>
                    <span class="badge ${this.getStatusClass(pedido.status, pedido.dias_pendente)}">
                        ${pedido.status}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="pedidosPendentes.verDetalhes(${pedido.id})" 
                                title="Ver detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-success" onclick="pedidosPendentes.agendar(${pedido.id})" 
                                title="Agendar">
                            <i class="fas fa-calendar-plus"></i>
                        </button>
                        <button class="btn btn-outline-warning" onclick="pedidosPendentes.editar(${pedido.id})" 
                                title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="pedidosPendentes.cancelar(${pedido.id})" 
                                title="Cancelar">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Configurar eventos dos checkboxes
        tbody.querySelectorAll('.pedido-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const pedidoId = parseInt(e.target.value);
                if (e.target.checked) {
                    this.pedidosSelecionados.add(pedidoId);
                } else {
                    this.pedidosSelecionados.delete(pedidoId);
                }
                this.atualizarSelecao();
            });
        });

        this.renderizarPaginacao();
        this.atualizarInfoPaginacao();
    }

    getStatusClass(status, diasPendente) {
        if (diasPendente > 7) return 'bg-danger';
        if (diasPendente > 3) return 'bg-warning';
        return 'bg-secondary';
    }

    renderizarPaginacao() {
        const totalPaginas = Math.ceil(this.pedidosFiltrados.length / this.itensPorPagina);
        const paginacao = document.getElementById('paginacao');

        if (totalPaginas <= 1) {
            paginacao.innerHTML = '';
            return;
        }

        let html = '';

        // Botão anterior
        html += `
            <li class="page-item ${this.paginaAtual === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="pedidosPendentes.irParaPagina(${this.paginaAtual - 1})">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;

        // Páginas
        const inicio = Math.max(1, this.paginaAtual - 2);
        const fim = Math.min(totalPaginas, this.paginaAtual + 2);

        if (inicio > 1) {
            html += `<li class="page-item"><a class="page-link" href="#" onclick="pedidosPendentes.irParaPagina(1)">1</a></li>`;
            if (inicio > 2) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        for (let i = inicio; i <= fim; i++) {
            html += `
                <li class="page-item ${i === this.paginaAtual ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="pedidosPendentes.irParaPagina(${i})">${i}</a>
                </li>
            `;
        }

        if (fim < totalPaginas) {
            if (fim < totalPaginas - 1) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            html += `<li class="page-item"><a class="page-link" href="#" onclick="pedidosPendentes.irParaPagina(${totalPaginas})">${totalPaginas}</a></li>`;
        }

        // Botão próximo
        html += `
            <li class="page-item ${this.paginaAtual === totalPaginas ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="pedidosPendentes.irParaPagina(${this.paginaAtual + 1})">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;

        paginacao.innerHTML = html;
    }

    irParaPagina(pagina) {
        const totalPaginas = Math.ceil(this.pedidosFiltrados.length / this.itensPorPagina);
        if (pagina >= 1 && pagina <= totalPaginas) {
            this.paginaAtual = pagina;
            this.renderizarTabela();
        }
    }

    atualizarInfoPaginacao() {
        const inicio = (this.paginaAtual - 1) * this.itensPorPagina + 1;
        const fim = Math.min(this.paginaAtual * this.itensPorPagina, this.pedidosFiltrados.length);
        const total = this.pedidosFiltrados.length;

        document.getElementById('infoInicio').textContent = total > 0 ? inicio : 0;
        document.getElementById('infoFim').textContent = fim;
        document.getElementById('infoTotal').textContent = total;
    }

    atualizarEstatisticas() {
        const hoje = new Date().toDateString();
        
        const totalPendentes = this.pedidos.length;
        const pendentesHoje = this.pedidos.filter(p => new Date(p.data_solicitacao).toDateString() === hoje).length;
        const pendentesAtrasados = this.pedidos.filter(p => p.dias_pendente > 7).length;
        const agendadosHoje = 0; // Implementar quando tiver dados de agendamentos

        document.getElementById('totalPendentes').textContent = totalPendentes;
        document.getElementById('pendentesHoje').textContent = pendentesHoje;
        document.getElementById('pendentesAtrasados').textContent = pendentesAtrasados;
        document.getElementById('agendadosHoje').textContent = agendadosHoje;
    }

    selecionarTodos(selecionado) {
        const checkboxes = document.querySelectorAll('.pedido-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = selecionado;
            const pedidoId = parseInt(checkbox.value);
            if (selecionado) {
                this.pedidosSelecionados.add(pedidoId);
            } else {
                this.pedidosSelecionados.delete(pedidoId);
            }
        });
        this.atualizarSelecao();
    }

    atualizarSelecao() {
        const qtdSelecionados = this.pedidosSelecionados.size;
        document.getElementById('qtdSelecionados').textContent = qtdSelecionados;

        // Atualizar checkbox "selecionar todos"
        const checkboxTodos = document.getElementById('selecionarTodos');
        const checkboxesVisiveis = document.querySelectorAll('.pedido-checkbox');
        const todosVisivelSelecionados = Array.from(checkboxesVisiveis).every(cb => cb.checked);
        checkboxTodos.checked = checkboxesVisiveis.length > 0 && todosVisivelSelecionados;

        // Mostrar/ocultar botões de ação em lote
        if (qtdSelecionados > 0) {
            // Implementar exibição de botões de ação em lote
        }
    }

    mostrarLoading(mostrar) {
        document.getElementById('loadingPendentes').style.display = mostrar ? 'block' : 'none';
        document.querySelector('#tabelaPendentes tbody').style.display = mostrar ? 'none' : '';
    }

    mostrarSemDados(mostrar) {
        document.getElementById('semDadosPendentes').style.display = mostrar ? 'block' : 'none';
        document.querySelector('#tabelaPendentes tbody').style.display = mostrar ? 'none' : '';
    }

    // Métodos de ação
    verDetalhes(pedidoId) {
        const pedido = this.pedidos.find(p => p.id === pedidoId);
        if (!pedido) return;

        const conteudo = document.getElementById('conteudoDetalhesPedido');
        conteudo.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Informações Básicas</h6>
                    <p><strong>Data Solicitação:</strong> ${SistemaUtils.formatarData(pedido.data_solicitacao)}</p>
                    <p><strong>Referência:</strong> ${pedido.referencia}</p>
                    <p><strong>Rede:</strong> ${pedido.rede}</p>
                    <p><strong>Cliente:</strong> ${pedido.cliente}</p>
                    <p><strong>Corretor:</strong> ${pedido.corretor}</p>
                </div>
                <div class="col-md-6">
                    <h6>Detalhes do Serviço</h6>
                    <p><strong>Endereço:</strong> ${pedido.endereco}</p>
                    <p><strong>Tipo de Serviço:</strong> ${pedido.tipo_servico}</p>
                    <p><strong>Contato:</strong> ${pedido.contato}</p>
                    <p><strong>Status:</strong> <span class="badge ${this.getStatusClass(pedido.status, pedido.dias_pendente)}">${pedido.status}</span></p>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-12">
                    <h6>Observações</h6>
                    <p>${pedido.observacoes || 'Nenhuma observação'}</p>
                </div>
            </div>
        `;

        const modal = new bootstrap.Modal(document.getElementById('modalDetalhesPedido'));
        modal.show();
    }

    agendar(pedidoId) {
        // Redirecionar para página de agendamentos com o pedido selecionado
        window.location.href = `agendamentos.html?pedido=${pedidoId}`;
    }

    editar(pedidoId) {
        // Redirecionar para página de edição
        window.location.href = `novos-pedidos.html?editar=${pedidoId}`;
    }

    cancelar(pedidoId) {
        if (confirm('Tem certeza que deseja cancelar este pedido?')) {
            // Implementar cancelamento
            window.sistema.mostrarSucesso('Pedido cancelado com sucesso!');
            this.carregarDados();
        }
    }

    exportarPendentes() {
        const dados = this.pedidosFiltrados.map(pedido => ({
            'Data Solicitação': SistemaUtils.formatarData(pedido.data_solicitacao),
            'Rede': pedido.rede,
            'Cliente': pedido.cliente,
            'Corretor': pedido.corretor,
            'Endereço': pedido.endereco,
            'Tipo Serviço': pedido.tipo_servico,
            'Contato': pedido.contato,
            'Status': pedido.status,
            'Referência': pedido.referencia,
            'Dias Pendente': pedido.dias_pendente
        }));

        SistemaUtils.exportarCSV(dados, 'pedidos_pendentes');
        window.sistema.mostrarSucesso('Dados exportados com sucesso!');
    }

    // Ações em lote
    agendarSelecionados() {
        if (this.pedidosSelecionados.size === 0) {
            window.sistema.mostrarInfo('Selecione pelo menos um pedido');
            return;
        }

        // Implementar agendamento em lote
        window.sistema.mostrarSucesso(`${this.pedidosSelecionados.size} pedido(s) agendado(s) com sucesso!`);
        this.pedidosSelecionados.clear();
        this.atualizarSelecao();
        this.carregarDados();
    }

    alterarStatusSelecionados() {
        if (this.pedidosSelecionados.size === 0) {
            window.sistema.mostrarInfo('Selecione pelo menos um pedido');
            return;
        }

        // Implementar alteração de status em lote
        window.sistema.mostrarSucesso(`Status de ${this.pedidosSelecionados.size} pedido(s) alterado com sucesso!`);
    }

    exportarSelecionados() {
        if (this.pedidosSelecionados.size === 0) {
            window.sistema.mostrarInfo('Selecione pelo menos um pedido');
            return;
        }

        const pedidosSelecionados = this.pedidos.filter(p => this.pedidosSelecionados.has(p.id));
        const dados = pedidosSelecionados.map(pedido => ({
            'Data Solicitação': SistemaUtils.formatarData(pedido.data_solicitacao),
            'Rede': pedido.rede,
            'Cliente': pedido.cliente,
            'Corretor': pedido.corretor,
            'Endereço': pedido.endereco,
            'Tipo Serviço': pedido.tipo_servico,
            'Contato': pedido.contato,
            'Status': pedido.status,
            'Referência': pedido.referencia
        }));

        SistemaUtils.exportarCSV(dados, 'pedidos_selecionados');
        window.sistema.mostrarSucesso('Pedidos selecionados exportados com sucesso!');
    }

    cancelarSelecionados() {
        if (this.pedidosSelecionados.size === 0) {
            window.sistema.mostrarInfo('Selecione pelo menos um pedido');
            return;
        }

        if (confirm(`Tem certeza que deseja cancelar ${this.pedidosSelecionados.size} pedido(s)?`)) {
            // Implementar cancelamento em lote
            window.sistema.mostrarSucesso(`${this.pedidosSelecionados.size} pedido(s) cancelado(s) com sucesso!`);
            this.pedidosSelecionados.clear();
            this.atualizarSelecao();
            this.carregarDados();
        }
    }
}

// Inicializar quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.pedidosPendentes = new PedidosPendentes();
});