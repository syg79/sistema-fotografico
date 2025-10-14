/**
 * Pendentes - Integração com Google Sheets
 * Carrega solicitações com status "Pendente" e aplica filtros básicos.
 */

class PedidosPendentes {
    constructor(api) {
        this.api = api;
        this.pedidos = [];
        this.pedidosFiltrados = [];
        this.paginaAtual = 1;
        this.itensPorPagina = 25;
        this.pedidosSelecionados = new Set();
        this.buscaTimeout = null;
    }

    async init() {
        this.configurarEventos();
        await this.carregarDados();
        this.atualizarEstatisticas();
    }

    configurarEventos() {
        const formFiltros = document.getElementById('formFiltros');
        if (formFiltros) {
            formFiltros.addEventListener('submit', (e) => {
                e.preventDefault();
                this.aplicarFiltros();
            });
        }

        const btnLimparFiltros = document.getElementById('btnLimparFiltros');
        if (btnLimparFiltros) {
            btnLimparFiltros.addEventListener('click', () => this.limparFiltros());
        }

        const btnLimparBusca = document.getElementById('btnLimparBusca');
        if (btnLimparBusca) {
            btnLimparBusca.addEventListener('click', () => this.limparBusca());
        }

        const filtroPeriodo = document.getElementById('filtroPeriodo');
        if (filtroPeriodo) {
            filtroPeriodo.addEventListener('change', (e) => {
                const periodoPersonalizado = document.getElementById('periodoPersonalizado');
                if (periodoPersonalizado) {
                    periodoPersonalizado.style.display = e.target.value === 'personalizado' ? 'block' : 'none';
                }
            });
        }

        const buscaInput = document.getElementById('busca');
        if (buscaInput) {
            buscaInput.addEventListener('input', (e) => {
                clearTimeout(this.buscaTimeout);
                this.buscaTimeout = setTimeout(() => {
                    this.aplicarFiltros();
                }, 400);
            });
        }

        const itensPorPaginaSelect = document.getElementById('itensPorPagina');
        if (itensPorPaginaSelect) {
            itensPorPaginaSelect.addEventListener('change', (e) => {
                this.itensPorPagina = parseInt(e.target.value, 10) || 25;
                this.paginaAtual = 1;
                this.renderizarTabela();
            });
        }

        const selecionarTodos = document.getElementById('selecionarTodos');
        if (selecionarTodos) {
            selecionarTodos.addEventListener('change', (e) => {
                this.selecionarTodos(e.target.checked);
            });
        }

        const btnAtualizar = document.getElementById('btnAtualizarLista');
        if (btnAtualizar) {
            btnAtualizar.addEventListener('click', () => this.carregarDados());
        }

        const btnExportar = document.getElementById('btnExportarPendentes');
        if (btnExportar) {
            btnExportar.addEventListener('click', () => this.exportarCSV(this.pedidosFiltrados, 'pedidos_pendentes'));
        }

        // Ações em desenvolvimento – exibem alerta temporário
        ['btnAgendar', 'btnAlterarStatus', 'btnExportarSelecionados', 'btnCancelarSelecionados',
            'btnEditarPedido', 'btnAgendarPedido'].forEach(id => {
                const btn = document.getElementById(id);
                if (btn) {
                    btn.addEventListener('click', () => alert('Função em desenvolvimento para integração completa.'));
                }
            });
    }

    async carregarDados() {
        this.mostrarLoading(true);
        try {
            await this.aguardarAPI();
            const registros = await this.api.getSolicitacoes();
            const pendentes = registros
                .map(this.transformarRegistro)
                .filter(item => item.status.toLowerCase() === 'pendente');

            this.pedidos = pendentes;
            this.pedidos.sort((a, b) => (b.data_solicitacao || '').localeCompare(a.data_solicitacao || ''));
            this.pedidosFiltrados = [...this.pedidos];

            this.popularFiltrosDinamicos();
            this.renderizarTabela();
            this.atualizarEstatisticas();
        } catch (error) {
            console.error('Erro ao carregar pedidos pendentes:', error);
            alert('Erro ao carregar pedidos pendentes. Detalhe: ' + (error.message || error));
        } finally {
            this.mostrarLoading(false);
        }
    }

    transformarRegistro(registro) {
        const parseDate = (value) => {
            if (!value) return '';
            const parsed = new Date(value);
            if (!Number.isNaN(parsed.valueOf())) return parsed.toISOString().split('T')[0];
            // Datas vindas como dd/mm/aaaa
            const [dia, mes, ano] = value.split(/[\/\-]/);
            if (dia && mes && ano) {
                return `${ano.padStart(4, '0')}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
            }
            return '';
        };

        const dataSolic = parseDate(registro['Data da Solicitacao (email)'] || registro['Data Solicitação'] || '');
        const diasPendente = dataSolic
            ? Math.floor((Date.now() - new Date(dataSolic).getTime()) / (1000 * 60 * 60 * 24))
            : 0;

        return {
            id: registro['Record ID'] || registro['ID Solicitacao'] || registro['ID'] || '',
            data_solicitacao: dataSolic,
            rede: (registro['Rede'] || '').trim(),
            cliente: (registro['Nome Cliente'] || registro['Cliente'] || '').trim(),
            corretor: (registro['Corretor Responsavel'] || registro['Corretor'] || '').trim(),
            endereco: (registro['Endereco do Imovel'] || registro['Endereço'] || '').trim(),
            tipo_servico: (registro['Tipo do Servico'] || registro['Tipo de Serviço'] || '').trim(),
            contato: (registro['Contato para agendar 01'] || registro['Contato'] || '').trim(),
            status: (registro['Status'] || '').trim(),
            referencia: (registro['Referencia do Cliente'] || registro['Referência'] || '').trim(),
            complemento: (registro['Compl.'] || registro['Complemento'] || '').trim(),
            observacoes: (registro['Observacao para o Agendamento'] || registro['Observações'] || '').trim(),
            dias_pendente: diasPendente > 0 ? diasPendente : 0
        };
    }

    aplicarFiltros() {
        const filtros = {
            rede: document.getElementById('filtroRede')?.value || '',
            cliente: document.getElementById('filtroCliente')?.value || '',
            tipo_servico: document.getElementById('filtroTipoServico')?.value || '',
            periodo: document.getElementById('filtroPeriodo')?.value || '',
            data_inicio: document.getElementById('dataInicio')?.value || '',
            data_fim: document.getElementById('dataFim')?.value || '',
            busca: document.getElementById('busca')?.value.toLowerCase() || ''
        };

        this.pedidosFiltrados = this.pedidos.filter(pedido => this.compararFiltros(pedido, filtros));
        this.paginaAtual = 1;
        this.renderizarTabela();
        this.atualizarEstatisticas();
    }

    compararFiltros(pedido, filtros) {
        if (filtros.rede && pedido.rede !== filtros.rede) return false;
        if (filtros.cliente && pedido.cliente !== filtros.cliente) return false;
        if (filtros.tipo_servico && pedido.tipo_servico !== filtros.tipo_servico) return false;

        if (filtros.periodo) {
            const dataPedido = pedido.data_solicitacao ? new Date(pedido.data_solicitacao) : null;
            if (dataPedido) {
                const hoje = new Date();
                switch (filtros.periodo) {
                    case 'hoje':
                        if (dataPedido.toDateString() !== hoje.toDateString()) return false;
                        break;
                    case 'ontem':
                        const ontem = new Date(hoje);
                        ontem.setDate(hoje.getDate() - 1);
                        if (dataPedido.toDateString() !== ontem.toDateString()) return false;
                        break;
                    case 'ultimos_7_dias':
                        const seteDias = new Date(hoje);
                        seteDias.setDate(hoje.getDate() - 7);
                        if (dataPedido < seteDias) return false;
                        break;
                    case 'ultimos_30_dias':
                        const trintaDias = new Date(hoje);
                        trintaDias.setDate(hoje.getDate() - 30);
                        if (dataPedido < trintaDias) return false;
                        break;
                    case 'personalizado':
                        if (filtros.data_inicio && dataPedido < new Date(filtros.data_inicio)) return false;
                        if (filtros.data_fim && dataPedido > new Date(filtros.data_fim)) return false;
                        break;
                }
            }
        }

        if (filtros.busca) {
            const alvo = [
                pedido.referencia,
                pedido.endereco,
                pedido.cliente,
                pedido.corretor,
                pedido.rede
            ].join(' ').toLowerCase();

            if (!alvo.includes(filtros.busca)) return false;
        }

        return true;
    }

    renderizarTabela() {
        const tbody = document.getElementById('corpoTabelaPendentes');
        if (!tbody) return;

        if (this.pedidosFiltrados.length === 0) {
            this.mostrarSemDados(true);
            return;
        }
        this.mostrarSemDados(false);

        const start = (this.paginaAtual - 1) * this.itensPorPagina;
        const end = start + this.itensPorPagina;
        const pagina = this.pedidosFiltrados.slice(start, end);

        tbody.innerHTML = pagina.map(pedido => `
            <tr>
                <td>
                    <span class="badge ${this.getStatusClass(pedido.status, pedido.dias_pendente)}">${pedido.status}</span>
                </td>
                <td>${pedido.cliente || '-'}</td>
                <td>${pedido.referencia || '-'}</td>
                <td>${pedido.endereco || '-'}</td>
                <td>${pedido.complemento || '-'}</td>
                <td>${pedido.tipo_servico || '-'}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" data-action="detalhes" data-id="${pedido.id}" title="Detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-secondary" data-action="editar" data-id="${pedido.id}" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-success" data-action="agendar" data-id="${pedido.id}" title="Agendar">
                            <i class="fas fa-calendar-plus"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        tbody.querySelectorAll('.pedido-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const pedidoId = e.target.getAttribute('data-id');
                if (e.target.checked) {
                    this.pedidosSelecionados.add(pedidoId);
                } else {
                    this.pedidosSelecionados.delete(pedidoId);
                }
                this.atualizarSelecao();
            });
        });

        tbody.querySelectorAll('button[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                const id = e.currentTarget.getAttribute('data-id');
                this.tratarAcao(action, id);
            });
        });

        this.renderizarPaginacao();
        this.atualizarInformacoesPagina(start + 1, Math.min(end, this.pedidosFiltrados.length), this.pedidosFiltrados.length);
    }

    renderizarPaginacao() {
        const paginacao = document.getElementById('paginacao');
        if (!paginacao) return;

        const totalPaginas = Math.ceil(this.pedidosFiltrados.length / this.itensPorPagina) || 1;
        let html = '';

        const createItem = (pagina, label = pagina, ativo = false, desabilitado = false) => `
            <li class="page-item ${ativo ? 'active' : ''} ${desabilitado ? 'disabled' : ''}">
                <button class="page-link" data-page="${pagina}" ${desabilitado ? 'tabindex="-1"' : ''}>${label}</button>
            </li>
        `;

        html += createItem(this.paginaAtual - 1, '&laquo;', this.paginaAtual === 1, this.paginaAtual === 1);

        for (let i = 1; i <= totalPaginas; i++) {
            if (i === 1 || i === totalPaginas || Math.abs(i - this.paginaAtual) <= 1) {
                html += createItem(i, i, i === this.paginaAtual);
            } else if (Math.abs(i - this.paginaAtual) === 2) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        html += createItem(this.paginaAtual + 1, '&raquo;', this.paginaAtual === totalPaginas, this.paginaAtual === totalPaginas);

        paginacao.innerHTML = html;
        paginacao.querySelectorAll('button[data-page]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = parseInt(e.currentTarget.getAttribute('data-page'), 10);
                if (!Number.isNaN(page) && page >= 1 && page <= totalPaginas) {
                    this.paginaAtual = page;
                    this.renderizarTabela();
                }
            });
        });
    }

    atualizarInformacoesPagina(inicio, fim, total) {
        document.getElementById('infoInicio').textContent = total > 0 ? inicio : 0;
        document.getElementById('infoFim').textContent = total > 0 ? fim : 0;
        document.getElementById('infoTotal').textContent = total;
    }

    atualizarEstatisticas() {
        const hojeTexto = new Date().toDateString();

        const total = this.pedidos.length;
        const hoje = this.pedidos.filter(p => new Date(p.data_solicitacao || '').toDateString() === hojeTexto).length;
        const atrasados = this.pedidos.filter(p => p.dias_pendente > 7).length;

        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        setText('totalPendentes', total);
        setText('pendentesHoje', hoje);
        setText('pendentesAtrasados', atrasados);
        setText('agendadosHoje', '—');
    }

    selecionarTodos(selecionado) {
        document.querySelectorAll('.pedido-checkbox').forEach(checkbox => {
            checkbox.checked = selecionado;
            const id = checkbox.getAttribute('data-id');
            if (selecionado) {
                this.pedidosSelecionados.add(id);
            } else {
                this.pedidosSelecionados.delete(id);
            }
        });
        this.atualizarSelecao();
    }

    atualizarSelecao() {
        const qtdSelecionados = this.pedidosSelecionados.size;
        const qtdElement = document.getElementById('qtdSelecionados');
        if (qtdElement) qtdElement.textContent = qtdSelecionados;
    }

    mostrarLoading(mostrar) {
        const loading = document.getElementById('loadingPendentes');
        const tabela = document.querySelector('#tabelaPendentes tbody');
        if (loading) loading.style.display = mostrar ? 'block' : 'none';
        if (tabela) tabela.style.display = mostrar ? 'none' : '';
    }

    mostrarSemDados(mostrar) {
        const semDados = document.getElementById('semDadosPendentes');
        const tabela = document.querySelector('#tabelaPendentes tbody');
        if (semDados) semDados.style.display = mostrar ? 'block' : 'none';
        if (tabela) tabela.style.display = mostrar ? 'none' : '';
    }

    tratarAcao(acao, pedidoId) {
        const pedido = this.pedidos.find(p => p.id === pedidoId);
        if (!pedido) return;

        switch (acao) {
            case 'detalhes':
                this.verDetalhes(pedido);
                break;
            case 'agendar':
            case 'editar':
                alert('Recurso em desenvolvimento para integração completa.');
                break;
            default:
                break;
        }
    }

    verDetalhes(pedido) {
        const conteudo = document.getElementById('conteudoDetalhesPedido');
        if (!conteudo) return;

        conteudo.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Informações Básicas</h6>
                    <p><strong>Data Solicitação:</strong> ${this.formatarData(pedido.data_solicitacao)}</p>
                    <p><strong>Referência:</strong> ${pedido.referencia || '-'}</p>
                    <p><strong>Rede:</strong> ${pedido.rede || '-'}</p>
                    <p><strong>Cliente:</strong> ${pedido.cliente || '-'}</p>
                    <p><strong>Corretor:</strong> ${pedido.corretor || '-'}</p>
                </div>
                <div class="col-md-6">
                    <h6>Detalhes do Serviço</h6>
                    <p><strong>Endereço:</strong> ${pedido.endereco || '-'}</p>
                    <p><strong>Tipo de Serviço:</strong> ${pedido.tipo_servico || '-'}</p>
                    <p><strong>Contato:</strong> ${pedido.contato || '-'}</p>
                    <p><strong>Status:</strong> <span class="badge ${this.getStatusClass(pedido.status, pedido.dias_pendente)}">${pedido.status}</span></p>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-12">
                    <h6>Observações</h6>
                    <p>${pedido.observacoes || 'Nenhuma observação registrada.'}</p>
                </div>
            </div>
        `;

        const modalEl = document.getElementById('modalDetalhesPedido');
        if (modalEl) {
            const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
            modal.show();
        }
    }

    limparFiltros() {
        ['filtroRede', 'filtroCliente', 'filtroTipoServico', 'filtroPeriodo', 'dataInicio', 'dataFim'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        this.aplicarFiltros();
    }

    limparBusca() {
        const busca = document.getElementById('busca');
        if (busca) {
            busca.value = '';
            this.aplicarFiltros();
        }
    }

    popularFiltrosDinamicos() {
        this.popularSelect('filtroRede', [...new Set(this.pedidos.map(p => p.rede).filter(Boolean))]);
        this.popularSelect('filtroCliente', [...new Set(this.pedidos.map(p => p.cliente).filter(Boolean))]);
        this.popularSelect('filtroTipoServico', [...new Set(this.pedidos.map(p => p.tipo_servico).filter(Boolean))]);
    }

    popularSelect(id, valores) {
        const select = document.getElementById(id);
        if (!select) return;

        const valorAtual = select.value;
        select.innerHTML = '<option value="">Todos</option>';
        valores.sort().forEach(valor => {
            const option = document.createElement('option');
            option.value = valor;
            option.textContent = valor;
            select.appendChild(option);
        });
        if (valorAtual) {
            select.value = valorAtual;
        }
    }

    getStatusClass(status, diasPendente) {
        const base = 'badge';
        const statusLower = status.toLowerCase();
        if (statusLower === 'pendente' && diasPendente > 7) {
            return `${base} bg-danger`;
        }
        if (statusLower === 'pendente') {
            return `${base} bg-warning text-dark`;
        }
        return `${base} bg-secondary`;
    }

    formatarData(valor) {
        if (!valor) return '-';
        const data = new Date(valor);
        if (Number.isNaN(data.valueOf())) return valor;
        return data.toLocaleDateString('pt-BR');
    }

    exportarCSV(pedidos, nomeArquivo) {
        if (!pedidos || pedidos.length === 0) {
            alert('Nenhum dado disponível para exportação.');
            return;
        }

        const colunas = [
            'Data Solicitação',
            'Rede',
            'Cliente',
            'Corretor',
            'Endereço',
            'Tipo Serviço',
            'Contato',
            'Status',
            'Referência'
        ];

        const linhas = pedidos.map(pedido => [
            this.formatarData(pedido.data_solicitacao),
            pedido.rede,
            pedido.cliente,
            pedido.corretor,
            pedido.endereco,
            pedido.tipo_servico,
            pedido.contato,
            pedido.status,
            pedido.referencia
        ]);

        const csv = [colunas.join(';'), ...linhas.map(linha => linha.map(valor => `"${(valor || '').toString().replace(/"/g, '""')}"`).join(';'))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${nomeArquivo}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

document.addEventListener('DOMContentLoaded', async () => {
    await new Promise(resolve => setTimeout(resolve, 100)); // garante carregamento dos scripts
    const api = window.googleSheetsAPI || new GoogleSheetsAPI();
    const pendentes = new PedidosPendentes(api);
    pendentes.init();
});
