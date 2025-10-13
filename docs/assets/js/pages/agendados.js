// Agendamentos internos (nao publicados) - integracao Google Sheets
class AgendamentosInternos {
    constructor(api) {
        this.api = api;
        this.agendamentos = [];
        this.mesAtual = new Date();
        this.visualizacaoAtual = "calendario";
        this.paginaAtual = 1;
        this.itensPorPagina = 25;
        this.filtros = {
            dataInicio: "",
            dataFim: "",
            fotografo: "",
            status: "",
            busca: ""
        };
    }

    async init() {
        this.cacheElements();
        this.bindEvents();
        await this.carregarDados();
    }

    cacheElements() {
        this.el = {
            filtroDataInicio: document.getElementById("filtroDataInicio"),
            filtroDataFim: document.getElementById("filtroDataFim"),
            filtroFotografo: document.getElementById("filtroFotografo"),
            filtroStatus: document.getElementById("filtroStatus"),
            buscaGeral: document.getElementById("buscaGeral"),
            btnBuscar: document.getElementById("btnBuscar"),
            btnLimparFiltros: document.getElementById("btnLimparFiltros"),
            btnNovoAgendamento: document.getElementById("btnNovoAgendamento"),
            btnExportar: document.getElementById("btnExportar"),
            btnVisualizacaoCalendario: document.getElementById("btnVisualizacaoCalendario"),
            btnVisualizacaoLista: document.getElementById("btnVisualizacaoLista"),
            btnMesAnterior: document.getElementById("btnMesAnterior"),
            btnProximoMes: document.getElementById("btnProximoMes"),
            calendarioView: document.getElementById("calendarioView"),
            listaView: document.getElementById("listaView"),
            calendarioGrid: document.getElementById("calendarioGrid"),
            mesAnoAtual: document.getElementById("mesAnoAtual"),
            tabelaAgendamentos: document.querySelector("#tabelaAgendamentos tbody"),
            paginacao: document.getElementById("paginacao"),
            paginacaoContainer: document.getElementById("paginacaoContainer"),
            infoPaginacao: document.getElementById("infoPaginacao"),
            stats: {
                total: document.getElementById("totalAgendados"),
                hoje: document.getElementById("agendadosHoje"),
                semana: document.getElementById("agendadosSemana"),
                proximoMes: document.getElementById("agendadosProximoMes")
            },
            modalDetalhes: document.getElementById("modalDetalhesAgendamento"),
            detalhesContent: document.getElementById("detalhesAgendamentoContent")
        };
    }

    bindEvents() {
        this.el.filtroDataInicio?.addEventListener("change", () => this.aplicarFiltros());
        this.el.filtroDataFim?.addEventListener("change", () => this.aplicarFiltros());
        this.el.filtroFotografo?.addEventListener("change", () => this.aplicarFiltros());
        this.el.filtroStatus?.addEventListener("change", () => this.aplicarFiltros());
        this.el.buscaGeral?.addEventListener("keypress", (e) => { if (e.key === "Enter") this.aplicarFiltros(); });
        this.el.btnBuscar?.addEventListener("click", () => this.aplicarFiltros());
        this.el.btnLimparFiltros?.addEventListener("click", () => this.limparFiltros());
        this.el.btnExportar?.addEventListener("click", () => this.exportarLista());

        const alertSoon = () => alert("Funcionalidade sera integrada em breve.");
        this.el.btnNovoAgendamento?.addEventListener("click", alertSoon);
        document.getElementById("btnSalvarAgendamento")?.addEventListener("click", alertSoon);
        document.getElementById("btnReagendarModal")?.addEventListener("click", alertSoon);
        document.getElementById("btnCancelarModal")?.addEventListener("click", alertSoon);

        this.el.btnVisualizacaoCalendario?.addEventListener("click", () => this.alterarVisualizacao("calendario"));
        this.el.btnVisualizacaoLista?.addEventListener("click", () => this.alterarVisualizacao("lista"));
        this.el.btnMesAnterior?.addEventListener("click", () => this.navegarMes(-1));
        this.el.btnProximoMes?.addEventListener("click", () => this.navegarMes(1));
    }

    async carregarDados() {
        await this.aguardarAPI();
        const registros = await this.api.getSolicitacoes();
        this.agendamentos = registros
            .map(AgendamentosInternos.normalizarRegistro)
            .filter(Boolean)
            .filter(item => !item.publicarAgenda)
            .filter(item => ["agendado", "confirmado", "reagendar", "em andamento"].includes(item.status.toLowerCase()));

        this.popularFiltros();
        this.atualizarEstatisticas();
        this.renderizarCalendario();
        this.renderizarLista();
    }

    static normalizarRegistro(registro) {
        const status = (registro["Status"] || "").trim();
        const dataBruta = registro["Data do agendamento"] || registro["Data Agendamento"] || "";
        const dataISO = AgendamentosInternos.parseDate(dataBruta);
        const publicarAgenda = ((registro["Publicar Agenda"] || "").toString().toLowerCase() === "sim");

        return {
            id: registro["Record ID"] || registro["ID Solicitacao"] || "",
            cliente: (registro["Nome Cliente"] || "").trim(),
            endereco: (registro["Endereco do Imovel"] || "").trim(),
            tipoServico: (registro["Tipo do Servico"] || "").trim(),
            fotografo: (registro["Fotografo"] || "").trim(),
            contato: (registro["Contato para agendar 01"] || "").trim(),
            status: status || "Agendado",
            publicarAgenda,
            observacoes: (registro["Observacao para o Fotografo"] || "").trim(),
            dataAgendamento: dataISO,
            horaAgendamento: (registro["Horario da Sessao"] || "").trim(),
            registroBruto: registro
        };
    }

    static parseDate(valor) {
        if (!valor) return "";
        const parsed = new Date(valor);
        if (!Number.isNaN(parsed.valueOf())) return parsed.toISOString().split("T")[0];
        const partes = valor.split(/[\/\-]/);
        if (partes.length === 3) {
            const [dia, mes, ano] = partes;
            return `${ano.padStart(4, "0")}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
        }
        return "";
    }

    popularFiltros() {
        const fotografoSelects = [this.el.filtroFotografo, document.getElementById("fotografoAgendamento")];
        const fotografos = [...new Set(this.agendamentos.map(a => a.fotografo).filter(Boolean))].sort();
        fotografoSelects.forEach(select => {
            if (!select) return;
            const valorAtual = select.value;
            select.innerHTML = '<option value="">Todos os fotografos</option>';
            fotografos.forEach(nome => select.add(new Option(nome, nome)));
            if (valorAtual) select.value = valorAtual;
        });

        if (this.el.filtroStatus) {
            const valorAtual = this.el.filtroStatus.value;
            const status = [...new Set(this.agendamentos.map(a => a.status).filter(Boolean))].sort();
            this.el.filtroStatus.innerHTML = '<option value="">Todos os status</option>';
            status.forEach(st => this.el.filtroStatus.add(new Option(st, st)));
            if (valorAtual) this.el.filtroStatus.value = valorAtual;
        }
    }

    aplicarFiltros() {
        this.filtros = {
            dataInicio: this.el.filtroDataInicio?.value || "",
            dataFim: this.el.filtroDataFim?.value || "",
            fotografo: this.el.filtroFotografo?.value || "",
            status: this.el.filtroStatus?.value || "",
            busca: (this.el.buscaGeral?.value || "").toLowerCase()
        };
        this.paginaAtual = 1;
        this.atualizarEstatisticas();
        if (this.visualizacaoAtual === "calendario") {
            this.renderizarCalendario();
        } else {
            this.renderizarLista();
        }
    }

    limparFiltros() {
        ["filtroDataInicio", "filtroDataFim", "filtroFotografo", "filtroStatus", "buscaGeral"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });
        this.aplicarFiltros();
    }

    filtrarAgendamentos() {
        const dados = this.agendamentos.filter(a => {
            if (this.filtros.dataInicio && a.dataAgendamento && a.dataAgendamento < this.filtros.dataInicio) return false;
            if (this.filtros.dataFim && a.dataAgendamento && a.dataAgendamento > this.filtros.dataFim) return false;
            if (this.filtros.fotografo && a.fotografo !== this.filtros.fotografo) return false;
            if (this.filtros.status && a.status !== this.filtros.status) return false;
            if (this.filtros.busca) {
                const alvo = [a.cliente, a.endereco, a.fotografo, a.tipoServico, a.observacoes].join(' ').toLowerCase();
                if (!alvo.includes(this.filtros.busca)) return false;
            }
            return true;
        });

        return dados.sort((a, b) => {
            const strA = `${a.dataAgendamento || ''} ${a.horaAgendamento || ''}`;
            const strB = `${b.dataAgendamento || ''} ${b.horaAgendamento || ''}`;
            return strA.localeCompare(strB);
        });
    }

    renderizarCalendario() {
        if (!this.el.calendarioGrid) return;
        const eventos = this.filtrarAgendamentos();
        const ano = this.mesAtual.getFullYear();
        const mes = this.mesAtual.getMonth();
        if (this.el.mesAnoAtual) {
            this.el.mesAnoAtual.textContent = this.mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        }

        const primeiroDia = new Date(ano, mes, 1);
        const inicio = new Date(primeiroDia);
        inicio.setDate(inicio.getDate() - inicio.getDay());
        const fim = new Date(ano, mes + 1, 0);
        fim.setDate(fim.getDate() + (6 - fim.getDay()));

        const blocos = [];
        for (let dia = new Date(inicio); dia <= fim; dia.setDate(dia.getDate() + 1)) {
            const dataISO = dia.toISOString().split('T')[0];
            const eventosDoDia = eventos.filter(ev => ev.dataAgendamento === dataISO);
            blocos.push({ data: new Date(dia), eventos: eventosDoDia });
        }

        this.el.calendarioGrid.innerHTML = blocos.map(({ data, eventos }) => {
            const inMonth = data.getMonth() === mes;
            const label = data.toLocaleDateString('pt-BR', { day: 'numeric' });
            const eventosHtml = eventos.slice(0, 3).map(ev => `
                <div class="evento-dia badge bg-primary w-100 mb-1" data-id="${ev.id}">
                    ${ev.horaAgendamento || ''} - ${ev.fotografo || 'Sem fotografo'}
                </div>
            `).join('') + (eventos.length > 3 ? `<small class="text-muted">+${eventos.length - 3} eventos</small>` : '');
            return `
                <div class="calendario-dia ${inMonth ? '' : 'dia-fora-mes'} ${eventos.length ? 'dia-com-evento' : ''}" data-data="${data.toISOString()}">
                    <div class="calendario-dia-header">${label}</div>
                    <div class="calendario-eventos">${eventosHtml || '<span class="text-muted small">Sem eventos</span>'}</div>
                </div>
            `;
        }).join('');

        this.el.calendarioGrid.querySelectorAll('.evento-dia').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const agendamento = this.agendamentos.find(a => a.id === id);
                if (agendamento) this.verDetalhes(agendamento);
            });
        });
    }

    renderizarLista() {
        if (!this.el.tabelaAgendamentos) return;
        const dados = this.filtrarAgendamentos();
        if (!dados.length) {
            this.el.tabelaAgendamentos.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">Nenhum agendamento encontrado.</td></tr>';
            this.el.paginacaoContainer?.classList.add('d-none');
            return;
        }

        this.el.paginacaoContainer?.classList.remove('d-none');
        const totalPaginas = Math.ceil(dados.length / this.itensPorPagina) || 1;
        if (this.paginaAtual > totalPaginas) this.paginaAtual = totalPaginas;
        const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
        const fim = inicio + this.itensPorPagina;
        const pagina = dados.slice(inicio, fim);

        this.el.tabelaAgendamentos.innerHTML = pagina.map(item => `
            <tr>
                <td>
                    <div class="fw-semibold">${this.formatarData(item.dataAgendamento)}</div>
                    <small class="text-muted">${item.horaAgendamento || ''}</small>
                </td>
                <td>${item.cliente || '-'}</td>
                <td>${item.endereco || '-'}</td>
                <td>${item.fotografo || '-'}</td>
                <td>${item.tipoServico || '-'}</td>
                <td><span class="badge bg-primary">${item.status || 'Agendado'}</span></td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" data-action="detalhes" data-id="${item.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning" data-action="reagendar" data-id="${item.id}">
                            <i class="fas fa-calendar-alt"></i>
                        </button>
                        <button class="btn btn-outline-danger" data-action="cancelar" data-id="${item.id}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        this.el.tabelaAgendamentos.querySelectorAll('button[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.getAttribute('data-action');
                const id = btn.getAttribute('data-id');
                const agendamento = this.agendamentos.find(a => a.id === id);
                if (!agendamento) return;
                if (action === 'detalhes') {
                    this.verDetalhes(agendamento);
                } else {
                    alert('Integracao desta acao sera concluida apos definicao do processo interno.');
                }
            });
        });

        this.renderizarPaginacao(totalPaginas, dados.length, inicio, fim);
    }

    renderizarPaginacao(totalPaginas, totalRegistros, inicio, fim) {
        if (!this.el.paginacao) return;
        const createItem = (pagina, label = pagina, ativo = false, desabilitado = false) => `
            <li class="page-item ${ativo ? 'active' : ''} ${desabilitado ? 'disabled' : ''}">
                <button class="page-link" data-page="${pagina}" ${desabilitado ? 'tabindex="-1"' : ''}>${label}</button>
            </li>
        `;
        let html = '';
        html += createItem(this.paginaAtual - 1, '&laquo;', this.paginaAtual === 1, this.paginaAtual === 1);
        for (let i = 1; i <= totalPaginas; i++) {
            if (i === 1 || i === totalPaginas || Math.abs(i - this.paginaAtual) <= 1) {
                html += createItem(i, i, i === this.paginaAtual);
            } else if (Math.abs(i - this.paginaAtual) === 2) {
                html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }
        html += createItem(this.paginaAtual + 1, '&raquo;', this.paginaAtual === totalPaginas, this.paginaAtual === totalPaginas);
        this.el.paginacao.innerHTML = html;
        this.el.paginacao.querySelectorAll('button[data-page]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = parseInt(e.currentTarget.getAttribute('data-page'), 10);
                if (page >= 1 && page <= totalPaginas) {
                    this.paginaAtual = page;
                    this.renderizarLista();
                }
            });
        });
        if (this.el.infoPaginacao) {
            this.el.infoPaginacao.textContent = `Mostrando ${inicio + 1}-${Math.min(fim, totalRegistros)} de ${totalRegistros}`;
        }
    }

    atualizarEstatisticas() {
        const dados = this.filtrarAgendamentos();
        const hojeISO = new Date().toISOString().split('T')[0];
        const inicioSemana = new Date();
        inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(fimSemana.getDate() + 6);
        const inicioProxMes = new Date(this.mesAtual.getFullYear(), this.mesAtual.getMonth() + 1, 1);
        const fimProxMes = new Date(this.mesAtual.getFullYear(), this.mesAtual.getMonth() + 2, 0);

        const total = this.agendamentos.length;
        const hoje = dados.filter(it => it.dataAgendamento === hojeISO).length;
        const semana = dados.filter(it => {
            if (!it.dataAgendamento) return false;
            const dt = new Date(it.dataAgendamento);
            return dt >= inicioSemana && dt <= fimSemana;
        }).length;
        const proxMes = dados.filter(it => {
            if (!it.dataAgendamento) return false;
            const dt = new Date(it.dataAgendamento);
            return dt >= inicioProxMes && dt <= fimProxMes;
        }).length;

        if (this.el.stats.total) this.el.stats.total.textContent = total;
        if (this.el.stats.hoje) this.el.stats.hoje.textContent = hoje;
        if (this.el.stats.semana) this.el.stats.semana.textContent = semana;
        if (this.el.stats.proximoMes) this.el.stats.proximoMes.textContent = proxMes;
    }

    alterarVisualizacao(tipo) {
        this.visualizacaoAtual = tipo;
        this.el.btnVisualizacaoCalendario?.classList.toggle('active', tipo === 'calendario');
        this.el.btnVisualizacaoLista?.classList.toggle('active', tipo === 'lista');
        if (this.el.calendarioView) this.el.calendarioView.style.display = tipo === 'calendario' ? 'block' : 'none';
        if (this.el.listaView) this.el.listaView.style.display = tipo === 'lista' ? 'block' : 'none';
        if (tipo === 'calendario') {
            this.renderizarCalendario();
        } else {
            this.renderizarLista();
        }
    }

    navegarMes(delta) {
        this.mesAtual.setMonth(this.mesAtual.getMonth() + delta);
        this.renderizarCalendario();
    }

    verDetalhes(agendamento) {
        if (!this.el.detalhesContent || !this.el.modalDetalhes) return;
        this.el.detalhesContent.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Informacoes do atendimento</h6>
                    <p><strong>Cliente:</strong> ${agendamento.cliente || '-'}</p>
                    <p><strong>Endereco:</strong> ${agendamento.endereco || '-'}</p>
                    <p><strong>Tipo de servico:</strong> ${agendamento.tipoServico || '-'}</p>
                    <p><strong>Contato:</strong> ${agendamento.contato || '-'}</p>
                </div>
                <div class="col-md-6">
                    <h6>Agendamento</h6>
                    <p><strong>Data:</strong> ${this.formatarData(agendamento.dataAgendamento)}</p>
                    <p><strong>Hora:</strong> ${agendamento.horaAgendamento || '-'}</p>
                    <p><strong>Fotografo:</strong> ${agendamento.fotografo || '-'}</p>
                    <p><strong>Status:</strong> ${agendamento.status || '-'}</p>
                </div>
            </div>
            <div class="mt-3">
                <h6>Observacoes</h6>
                <p>${agendamento.observacoes || 'Nenhuma observacao registrada.'}</p>
            </div>
        `;
        const modal = bootstrap.Modal.getOrCreateInstance(this.el.modalDetalhes);
        modal.show();
    }

    formatarData(valor) {
        if (!valor) return '-';
        const data = new Date(valor);
        if (Number.isNaN(data.valueOf())) return valor;
        return data.toLocaleDateString('pt-BR');
    }

    exportarLista() {
        const dados = this.filtrarAgendamentos();
        if (!dados.length) {
            alert('Nenhum agendamento para exportar.');
            return;
        }
        const cabecalho = ['Data', 'Hora', 'Cliente', 'Endereco', 'Fotografo', 'Tipo de servico', 'Status'];
        const linhas = dados.map(item => [
            this.formatarData(item.dataAgendamento),
            item.horaAgendamento,
            item.cliente,
            item.endereco,
            item.fotografo,
            item.tipoServico,
            item.status
        ]);
        const csv = [cabecalho.join(';'), ...linhas.map(l => l.map(v => `"${(v || '').replace(/"/g, '""')}"`).join(';'))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `agendamentos_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async aguardarAPI() {
        let tentativas = 0;
        while ((!window.googleSheetsAPI) && tentativas < 10) {
            await new Promise(resolve => setTimeout(resolve, 150));
            tentativas += 1;
        }
        if (!window.googleSheetsAPI) {
            throw new Error('Google Sheets API nao inicializada.');
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const api = window.googleSheetsAPI || new GoogleSheetsAPI();
    const agendadosInternos = new AgendamentosInternos(api);
    agendadosInternos.init();
});
