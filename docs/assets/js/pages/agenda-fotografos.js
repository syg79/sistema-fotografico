document.addEventListener('DOMContentLoaded', async () => {
    const listaAgendamentos = document.getElementById('listaAgendamentos');
    const semAgendamentos = document.getElementById('semAgendamentos');
    const totalAgendamentosEl = document.getElementById('totalAgendamentos');
    const nomeUsuarioEl = document.getElementById('nomeUsuario');

    const getFotografoFromURL = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('fotografo');
    };

    const aguardarAPI = async () => {
        let tentativas = 0;
        while (!window.googleSheetsAPI && tentativas < 10) {
            await new Promise(resolve => setTimeout(resolve, 200));
            tentativas++;
        }
        if (!window.googleSheetsAPI) {
            throw new Error('Google Sheets API não inicializada.');
        }
    };

    const carregarAgendamentos = async () => {
        const fotografo = getFotografoFromURL();

        if (nomeUsuarioEl) {
            nomeUsuarioEl.textContent = fotografo || 'Visitante';
        }
        
        if (!fotografo) {
            listaAgendamentos.innerHTML = '';
            semAgendamentos.style.display = 'block';
            semAgendamentos.innerHTML = `
                <i class="fas fa-user-times fa-4x text-muted mb-3"></i>
                <h5 class="text-muted">Fotógrafo não especificado.</h5>
                <p class="text-muted">Por favor, acesse a URL fornecida com seu nome.</p>
            `;
            return;
        }

        try {
            await aguardarAPI();
            const api = window.googleSheetsAPI;
            const todosRegistros = await api.getSolicitacoes();
            
            const agendamentos = todosRegistros.map(reg => ({
                id: reg['Record ID'] || reg['ID Solicitacao'] || '',
                cliente: (reg['Nome Cliente'] || '').trim(),
                endereco: (reg['Endereco do Imovel'] || '').trim(),
                dataAgendamento: (reg['Data do agendamento'] || reg['Data Agendamento'] || '').trim(),
                horaAgendamento: (reg['Horario da Sessao'] || '').trim(),
                fotografo: (reg['Fotografo'] || '').trim(),
                status: (reg['Status'] || '').trim().toLowerCase(),
                publicar: (reg['Publicar Agenda'] || '').toString().toLowerCase() === 'sim'
            })).filter(a => {
                const fotografoMatch = a.fotografo.toLowerCase() === fotografo.toLowerCase();
                const statusMatch = a.status === 'agendado' || a.status === 'publicado';
                return fotografoMatch && statusMatch;
            });

            agendamentos.sort((a, b) => {
                const strA = `${a.dataAgendamento || ''} ${a.horaAgendamento || ''}`;
                const strB = `${b.dataAgendamento || ''} ${b.horaAgendamento || ''}`;
                return strA.localeCompare(strB);
            });

            renderizar(agendamentos);

        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
            semAgendamentos.style.display = 'block';
            semAgendamentos.innerHTML = `
                <i class="fas fa-server fa-4x text-danger mb-3"></i>
                <h5 class="text-danger">Erro ao carregar os dados.</h5>
                <p class="text-muted">Não foi possível conectar à fonte de dados. Tente novamente mais tarde.</p>
            `;
        }
    };

    const formatarData = (valor) => {
        if (!valor) return '-';
        try {
            const [ano, mes, dia] = valor.split('-');
            if(ano && mes && dia) {
                return `${dia}/${mes}/${ano}`;
            }
            return new Date(valor).toLocaleDateString('pt-BR');
        } catch(e) {
            return valor;
        }
    };

    const renderizar = (agendamentos) => {
        if (totalAgendamentosEl) {
            totalAgendamentosEl.textContent = `${agendamentos.length} agendamentos`;
        }

        if (agendamentos.length === 0) {
            listaAgendamentos.innerHTML = '';
            semAgendamentos.style.display = 'block';
            return;
        }

        semAgendamentos.style.display = 'none';
        listaAgendamentos.innerHTML = agendamentos.map(a => `
            <div class="card agendamento-card mb-3">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4">
                            <h5 class="card-title">${a.cliente}</h5>
                            <p class="card-text text-muted">${a.endereco}</p>
                        </div>
                        <div class="col-md-3">
                            <strong><i class="fas fa-calendar-alt me-2"></i>Data:</strong> ${formatarData(a.dataAgendamento)}<br>
                            <strong><i class="fas fa-clock me-2"></i>Hora:</strong> ${a.horaAgendamento}
                        </div>
                        <div class="col-md-3">
                            <strong><i class="fas fa-info-circle me-2"></i>Status:</strong> 
                            <span class="badge bg-success">${a.status}</span>
                        </div>
                        <div class="col-md-2 text-end">
                            <button class="btn btn-primary btn-sm" data-id="${a.id}">Detalhes</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    };

    carregarAgendamentos();
});
