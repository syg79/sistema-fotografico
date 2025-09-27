// Sistema de Agendamentos
class SistemaAgendamentos {
    constructor() {
        this.agendamentos = [];
        this.fotografos = [];
        this.pedidosPendentes = [];
        this.mesAtual = new Date();
        this.visualizacaoAtual = 'calendario';
        this.filtros = {
            dataInicio: '',
            dataFim: '',
            fotografo: '',
            status: '',
            busca: ''
        };
        
        this.init();
    }

    init() {
        this.carregarDados();
        this.configurarEventos();
        this.atualizarEstatisticas();
        this.renderizarCalendario();
    }

    configurarEventos() {
        // Filtros
        document.getElementById('filtroDataInicio').addEventListener('change', () => this.aplicarFiltros());
        document.getElementById('filtroDataFim').addEventListener('change', () => this.aplicarFiltros());
        document.getElementById('filtroFotografo').addEventListener('change', () => this.aplicarFiltros());
        document.getElementById('filtroStatus').addEventListener('change', () => this.aplicarFiltros());
        document.getElementById('btnBuscar').addEventListener('click', () => this.aplicarFiltros());
        document.getElementById('buscaGeral').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.aplicarFiltros();
        });

        // Ações
        document.getElementById('btnLimparFiltros').addEventListener('click', () => this.limparFiltros());
        document.getElementById('btnNovoAgendamento').addEventListener('click', () => this.abrirModalNovoAgendamento());
        document.getElementById('btnExportar').addEventListener('click', () => this.exportarAgendamentos());

        // Visualização
        document.getElementById('btnVisualizacaoCalendario').addEventListener('click', () => this.alterarVisualizacao('calendario'));
        document.getElementById('btnVisualizacaoLista').addEventListener('click', () => this.alterarVisualizacao('lista'));

        // Navegação do calendário
        document.getElementById('btnMesAnterior').addEventListener('click', () => this.navegarMes(-1));
        document.getElementById('btnProximoMes').addEventListener('click', () => this.navegarMes(1));

        // Modal novo agendamento
        document.getElementById('btnSalvarAgendamento').addEventListener('click', () => this.salvarAgendamento());
        document.getElementById('pedidoAgendamento').addEventListener('change', () => this.carregarDadosPedido());

        // Ações do modal de detalhes
        document.getElementById('btnReagendarModal').addEventListener('click', () => this.reagendarAgendamento());
        document.getElementById('btnCancelarModal').addEventListener('click', () => this.cancelarAgendamento());
    }

    carregarDados() {
        // Simular dados de fotógrafos
        this.fotografos = [
            { id: 1, nome: 'João Silva', telefone: '(11) 99999-1111', especialidade: 'Residencial' },
            { id: 2, nome: 'Maria Santos', telefone: '(11) 99999-2222', especialidade: 'Comercial' },
            { id: 3, nome: 'Pedro Costa', telefone: '(11) 99999-3333', especialidade: 'Drone' },
            { id: 4, nome: 'Ana Oliveira', telefone: '(11) 99999-4444', especialidade: 'Vídeo' }
        ];

        // Simular pedidos pendentes
        this.pedidosPendentes = [
            { id: 1, cliente: 'Cliente A', endereco: 'Rua A, 123', tipo_servico: 'Fotos' },
            { id: 2, cliente: 'Cliente B', endereco: 'Rua B, 456', tipo_servico: 'Fotos + Vídeo' },
            { id: 3, cliente: 'Cliente C', endereco: 'Rua C, 789', tipo_servico: 'Drone' }
        ];

        // Simular agendamentos
        this.agendamentos = this.gerarAgendamentosSimulados();

        this.popularSelects();
    }

    gerarAgendamentosSimulados() {
        const agendamentos = [];
        const hoje = new Date();
        
        for (let i = 0; i < 50; i++) {
            const data = new Date(hoje);
            data.setDate(hoje.getDate() + Math.floor(Math.random() * 60) - 30);
            
            const fotografo = this.fotografos[Math.floor(Math.random() * this.fotografos.length)];
            const pedido = this.pedidosPendentes[Math.floor(Math.random() * this.pedidosPendentes.length)];
            
            const status = ['Agendado', 'Confirmado', 'Em Andamento', 'Reagendar', 'Cancelado'][Math.floor(Math.random() * 5)];
            
            agendamentos.push({
                id: i + 1,
                pedido_id: pedido.id,
                cliente: pedido.cliente,
                endereco: pedido.endereco,
                tipo_servico: pedido.tipo_servico,
                fotografo_id: fotografo.id,
                fotografo_nome: fotografo.nome,
                data_agendamento: data.toISOString().split('T')[0],
                hora_agendamento: `${8 + Math.floor(Math.random() * 10)}:${Math.random() > 0.5 ? '00' : '30'}`,
                status: status,
                observacoes: `Observações do agendamento ${i + 1}`,
                data_criacao: new Date().toISOString()
            });
        }
        
        return agendamentos;
    }

    popularSelects() {
        // Popular select de fotógrafos
        const selectFotografo = document.getElementById('filtroFotografo');
        const selectFotografoModal = document.getElementById('fotografoAgendamento');
        
        this.fotografos.forEach(fotografo => {
            const option1 = new Option(fotografo.nome, fotografo.id);
            const option2 = new Option(fotografo.nome, fotografo.id);
            selectFotografo.add(option1);
            selectFotografoModal.add(option2);
        });

        // Popular select de pedidos
        const selectPedido = document.getElementById('pedidoAgendamento');
        this.pedidosPendentes.forEach(pedido => {
            const option = new Option(`${pedido.cliente} - ${pedido.endereco}`, pedido.id);
            selectPedido.add(option);
        });
    }

    aplicarFiltros() {
        this.filtros = {
            dataInicio: document.getElementById('filtroDataInicio').value,
            dataFim: document.getElementById('filtroDataFim').value,
            fotografo: document.getElementById('filtroFotografo').value,
            status: document.getElementById('filtroStatus').value,
            busca: document.getElementById('buscaGeral').value.toLowerCase()
        };

        if (this.visualizacaoAtual === 'lista') {
            this.renderizarLista();
        } else {
            this.renderizarCalendario();
        }
        this.atualizarEstatisticas();
    }

    limparFiltros() {
        document.getElementById('filtroDataInicio').value = '';
        document.getElementById('filtroDataFim').value = '';
        document.getElementById('filtroFotografo').value = '';
        document.getElementById('filtroStatus').value = '';
        document.getElementById('buscaGeral').value = '';
        
        this.filtros = {
            dataInicio: '',
            dataFim: '',
            fotografo: '',
            status: '',
            busca: ''
        };

        this.aplicarFiltros();
    }

    filtrarAgendamentos() {
        return this.agendamentos.filter(agendamento => {
            // Filtro por data
            if (this.filtros.dataInicio && agendamento.data_agendamento < this.filtros.dataInicio) return false;
            if (this.filtros.dataFim && agendamento.data_agendamento > this.filtros.dataFim) return false;
            
            // Filtro por fotógrafo
            if (this.filtros.fotografo && agendamento.fotografo_id != this.filtros.fotografo) return false;
            
            // Filtro por status
            if (this.filtros.status && agendamento.status !== this.filtros.status) return false;
            
            // Busca geral
            if (this.filtros.busca) {
                const busca = this.filtros.busca;
                return agendamento.cliente.toLowerCase().includes(busca) ||
                       agendamento.endereco.toLowerCase().includes(busca) ||
                       agendamento.fotografo_nome.toLowerCase().includes(busca) ||
                       agendamento.tipo_servico.toLowerCase().includes(busca);
            }
            
            return true;
        });
    }

    alterarVisualizacao(tipo) {
        this.visualizacaoAtual = tipo;
        
        // Atualizar botões
        document.getElementById('btnVisualizacaoCalendario').classList.toggle('active', tipo === 'calendario');
        document.getElementById('btnVisualizacaoLista').classList.toggle('active', tipo === 'lista');
        
        // Mostrar/ocultar views
        document.getElementById('calendarioView').style.display = tipo === 'calendario' ? 'block' : 'none';
        document.getElementById('listaView').style.display = tipo === 'lista' ? 'block' : 'none';
        document.getElementById('paginacaoContainer').style.display = tipo === 'lista' ? 'block' : 'none';
        
        if (tipo === 'lista') {
            this.renderizarLista();
        } else {
            this.renderizarCalendario();
        }
    }

    navegarMes(direcao) {
        this.mesAtual.setMonth(this.mesAtual.getMonth() + direcao);
        this.renderizarCalendario();
    }

    renderizarCalendario() {
        const mesAno = this.mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        document.getElementById('mesAnoAtual').textContent = mesAno.charAt(0).toUpperCase() + mesAno.slice(1);
        
        const grid = document.getElementById('calendarioGrid');
        grid.innerHTML = '';
        
        // Cabeçalho dos dias da semana
        const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        diasSemana.forEach(dia => {
            const header = document.createElement('div');
            header.className = 'calendario-header';
            header.textContent = dia;
            grid.appendChild(header);
        });
        
        // Calcular primeiro dia do mês e quantidade de dias
        const primeiroDia = new Date(this.mesAtual.getFullYear(), this.mesAtual.getMonth(), 1);
        const ultimoDia = new Date(this.mesAtual.getFullYear(), this.mesAtual.getMonth() + 1, 0);
        const diasNoMes = ultimoDia.getDate();
        const diaSemanaInicio = primeiroDia.getDay();
        
        // Dias vazios no início
        for (let i = 0; i < diaSemanaInicio; i++) {
            const diaVazio = document.createElement('div');
            diaVazio.className = 'calendario-dia vazio';
            grid.appendChild(diaVazio);
        }
        
        // Dias do mês
        for (let dia = 1; dia <= diasNoMes; dia++) {
            const dataAtual = new Date(this.mesAtual.getFullYear(), this.mesAtual.getMonth(), dia);
            const dataStr = dataAtual.toISOString().split('T')[0];
            
            const agendamentosDoDia = this.filtrarAgendamentos().filter(a => a.data_agendamento === dataStr);
            
            const diaElement = document.createElement('div');
            diaElement.className = 'calendario-dia';
            
            if (dataAtual.toDateString() === new Date().toDateString()) {
                diaElement.classList.add('hoje');
            }
            
            diaElement.innerHTML = `
                <div class="dia-numero">${dia}</div>
                <div class="agendamentos-count">
                    ${agendamentosDoDia.length > 0 ? `${agendamentosDoDia.length} agendamento${agendamentosDoDia.length > 1 ? 's' : ''}` : ''}
                </div>
            `;
            
            if (agendamentosDoDia.length > 0) {
                diaElement.classList.add('com-agendamentos');
                diaElement.addEventListener('click', () => this.mostrarAgendamentosDoDia(dataStr, agendamentosDoDia));
            }
            
            grid.appendChild(diaElement);
        }
    }

    renderizarLista() {
        const tbody = document.querySelector('#tabelaAgendamentos tbody');
        const agendamentosFiltrados = this.filtrarAgendamentos();
        
        tbody.innerHTML = '';
        
        if (agendamentosFiltrados.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                        <p class="text-muted">Nenhum agendamento encontrado</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        agendamentosFiltrados.forEach(agendamento => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="fw-bold">${formatarData(agendamento.data_agendamento)}</div>
                    <small class="text-muted">${agendamento.hora_agendamento}</small>
                </td>
                <td>${agendamento.cliente}</td>
                <td>
                    <small>${agendamento.endereco}</small>
                </td>
                <td>${agendamento.fotografo_nome}</td>
                <td>
                    <span class="badge bg-info">${agendamento.tipo_servico}</span>
                </td>
                <td>
                    <span class="badge ${this.getStatusClass(agendamento.status)}">${agendamento.status}</span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="sistemaAgendamentos.verDetalhes(${agendamento.id})" title="Ver Detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning" onclick="sistemaAgendamentos.reagendar(${agendamento.id})" title="Reagendar">
                            <i class="fas fa-calendar-alt"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="sistemaAgendamentos.cancelar(${agendamento.id})" title="Cancelar">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        // Atualizar informações de paginação
        document.getElementById('infoPaginacao').textContent = 
            `Mostrando ${agendamentosFiltrados.length} de ${this.agendamentos.length} agendamentos`;
    }

    getStatusClass(status) {
        const classes = {
            'Agendado': 'bg-primary',
            'Confirmado': 'bg-success',
            'Em Andamento': 'bg-warning',
            'Reagendar': 'bg-info',
            'Cancelado': 'bg-danger'
        };
        return classes[status] || 'bg-secondary';
    }

    mostrarAgendamentosDoDia(data, agendamentos) {
        const modal = new bootstrap.Modal(document.getElementById('modalDetalhesAgendamento'));
        const content = document.getElementById('detalhesAgendamentoContent');
        
        content.innerHTML = `
            <h6>Agendamentos para ${formatarData(data)}</h6>
            <div class="list-group">
                ${agendamentos.map(agendamento => `
                    <div class="list-group-item">
                        <div class="d-flex w-100 justify-content-between">
                            <h6 class="mb-1">${agendamento.cliente}</h6>
                            <small>${agendamento.hora_agendamento}</small>
                        </div>
                        <p class="mb-1">${agendamento.endereco}</p>
                        <small>Fotógrafo: ${agendamento.fotografo_nome} | Status: ${agendamento.status}</small>
                    </div>
                `).join('')}
            </div>
        `;
        
        modal.show();
    }

    atualizarEstatisticas() {
        const agendamentos = this.filtrarAgendamentos();
        const hoje = new Date().toISOString().split('T')[0];
        const inicioSemana = new Date();
        inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(inicioSemana.getDate() + 6);
        
        const proximoMes = new Date();
        proximoMes.setMonth(proximoMes.getMonth() + 1);
        const inicioProximoMes = new Date(proximoMes.getFullYear(), proximoMes.getMonth(), 1).toISOString().split('T')[0];
        const fimProximoMes = new Date(proximoMes.getFullYear(), proximoMes.getMonth() + 1, 0).toISOString().split('T')[0];
        
        document.getElementById('totalAgendados').textContent = agendamentos.length;
        document.getElementById('agendadosHoje').textContent = 
            agendamentos.filter(a => a.data_agendamento === hoje).length;
        document.getElementById('agendadosSemana').textContent = 
            agendamentos.filter(a => a.data_agendamento >= inicioSemana.toISOString().split('T')[0] && 
                                   a.data_agendamento <= fimSemana.toISOString().split('T')[0]).length;
        document.getElementById('agendadosProximoMes').textContent = 
            agendamentos.filter(a => a.data_agendamento >= inicioProximoMes && 
                                   a.data_agendamento <= fimProximoMes).length;
    }

    abrirModalNovoAgendamento() {
        const modal = new bootstrap.Modal(document.getElementById('modalNovoAgendamento'));
        document.getElementById('formNovoAgendamento').reset();
        modal.show();
    }

    carregarDadosPedido() {
        const pedidoId = document.getElementById('pedidoAgendamento').value;
        if (pedidoId) {
            const pedido = this.pedidosPendentes.find(p => p.id == pedidoId);
            if (pedido) {
                // Aqui você pode pré-preencher outros campos baseados no pedido
                console.log('Pedido selecionado:', pedido);
            }
        }
    }

    salvarAgendamento() {
        const form = document.getElementById('formNovoAgendamento');
        const formData = new FormData(form);
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const novoAgendamento = {
            id: this.agendamentos.length + 1,
            pedido_id: formData.get('pedido_id'),
            fotografo_id: formData.get('fotografo_id'),
            data_agendamento: formData.get('data_agendamento'),
            hora_agendamento: formData.get('hora_agendamento'),
            observacoes: formData.get('observacoes'),
            status: 'Agendado',
            data_criacao: new Date().toISOString()
        };
        
        // Buscar dados do pedido e fotógrafo
        const pedido = this.pedidosPendentes.find(p => p.id == novoAgendamento.pedido_id);
        const fotografo = this.fotografos.find(f => f.id == novoAgendamento.fotografo_id);
        
        if (pedido && fotografo) {
            novoAgendamento.cliente = pedido.cliente;
            novoAgendamento.endereco = pedido.endereco;
            novoAgendamento.tipo_servico = pedido.tipo_servico;
            novoAgendamento.fotografo_nome = fotografo.nome;
            
            this.agendamentos.push(novoAgendamento);
            
            mostrarMensagem('Agendamento criado com sucesso!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('modalNovoAgendamento')).hide();
            
            this.atualizarEstatisticas();
            if (this.visualizacaoAtual === 'lista') {
                this.renderizarLista();
            } else {
                this.renderizarCalendario();
            }
        }
    }

    verDetalhes(id) {
        const agendamento = this.agendamentos.find(a => a.id === id);
        if (agendamento) {
            const modal = new bootstrap.Modal(document.getElementById('modalDetalhesAgendamento'));
            const content = document.getElementById('detalhesAgendamentoContent');
            
            content.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <h6>Informações do Cliente</h6>
                        <p><strong>Cliente:</strong> ${agendamento.cliente}</p>
                        <p><strong>Endereço:</strong> ${agendamento.endereco}</p>
                        <p><strong>Tipo de Serviço:</strong> ${agendamento.tipo_servico}</p>
                    </div>
                    <div class="col-md-6">
                        <h6>Informações do Agendamento</h6>
                        <p><strong>Data:</strong> ${formatarData(agendamento.data_agendamento)}</p>
                        <p><strong>Horário:</strong> ${agendamento.hora_agendamento}</p>
                        <p><strong>Fotógrafo:</strong> ${agendamento.fotografo_nome}</p>
                        <p><strong>Status:</strong> <span class="badge ${this.getStatusClass(agendamento.status)}">${agendamento.status}</span></p>
                    </div>
                </div>
                ${agendamento.observacoes ? `
                    <div class="row mt-3">
                        <div class="col-12">
                            <h6>Observações</h6>
                            <p>${agendamento.observacoes}</p>
                        </div>
                    </div>
                ` : ''}
            `;
            
            modal.show();
        }
    }

    reagendar(id) {
        const agendamento = this.agendamentos.find(a => a.id === id);
        if (agendamento) {
            // Implementar lógica de reagendamento
            mostrarMensagem('Funcionalidade de reagendamento em desenvolvimento', 'info');
        }
    }

    cancelar(id) {
        if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
            const agendamento = this.agendamentos.find(a => a.id === id);
            if (agendamento) {
                agendamento.status = 'Cancelado';
                mostrarMensagem('Agendamento cancelado com sucesso!', 'success');
                
                this.atualizarEstatisticas();
                if (this.visualizacaoAtual === 'lista') {
                    this.renderizarLista();
                } else {
                    this.renderizarCalendario();
                }
            }
        }
    }

    reagendarAgendamento() {
        mostrarMensagem('Funcionalidade de reagendamento em desenvolvimento', 'info');
    }

    cancelarAgendamento() {
        mostrarMensagem('Funcionalidade de cancelamento em desenvolvimento', 'info');
    }

    exportarAgendamentos() {
        const agendamentos = this.filtrarAgendamentos();
        const dados = agendamentos.map(a => ({
            'Data': formatarData(a.data_agendamento),
            'Horário': a.hora_agendamento,
            'Cliente': a.cliente,
            'Endereço': a.endereco,
            'Fotógrafo': a.fotografo_nome,
            'Tipo de Serviço': a.tipo_servico,
            'Status': a.status,
            'Observações': a.observacoes || ''
        }));
        
        exportarCSV(dados, 'agendamentos');
        mostrarMensagem('Agendamentos exportados com sucesso!', 'success');
    }
}

// Inicializar sistema quando a página carregar
let sistemaAgendamentos;
document.addEventListener('DOMContentLoaded', function() {
    sistemaAgendamentos = new SistemaAgendamentos();
});