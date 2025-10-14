document.addEventListener('DOMContentLoaded', async () => {
    const loadingEl = document.getElementById('loading');
    const conteudoEl = document.getElementById('conteudoPagina');
    const form = document.getElementById('formAgendamento');

    const infoCliente = document.getElementById('infoCliente');
    const infoEndereco = document.getElementById('infoEndereco');
    const infoReferencia = document.getElementById('infoReferencia');
    const infoServicos = document.getElementById('infoServicos');
    const infoObservacoes = document.getElementById('infoObservacoes');
    const fotografoSelect = document.getElementById('fotografo');

    const getRecordIdFromURL = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    };

    const showError = (message) => {
        loadingEl.innerHTML = `<div class="alert alert-danger">${message}</div>`;
    };

    const loadData = async () => {
        const recordId = getRecordIdFromURL();
        if (!recordId) {
            showError('ID do pedido não fornecido. Volte para a página de pendentes e tente novamente.');
            return;
        }

        try {
            // Aguardar a API estar pronta
            let tentativas = 0;
            while (!window.googleSheetsAPI && tentativas < 10) {
                await new Promise(resolve => setTimeout(resolve, 200));
                tentativas++;
            }
            if (!window.googleSheetsAPI) {
                throw new Error('A API do Google Sheets não foi inicializada.');
            }

            const api = window.googleSheetsAPI;

            // Carregar dados do pedido e fotógrafos em paralelo
            const [solicitacoes, fotografos] = await Promise.all([
                api.getSolicitacoes(),
                api.getFotografos()
            ]);

            const pedido = solicitacoes.find(s => (s['ID Solicitacao'] || s['Record ID']) === recordId);

            if (!pedido) {
                showError(`Pedido com ID ${recordId} não encontrado.`);
                return;
            }

            // Popular informações do pedido
            infoCliente.textContent = pedido['Nome Cliente'] || 'Não informado';
            infoEndereco.textContent = pedido['Endereco do Imovel'] || 'Não informado';
            infoReferencia.textContent = pedido['Referencia do Cliente'] || 'Não informado';
            infoServicos.textContent = pedido['Tipo do Servico'] || 'Não informado';
            infoObservacoes.textContent = pedido['Observacao para o Agendamento'] || 'Nenhuma';

            // Popular dropdown de fotógrafos
            fotografoSelect.innerHTML = '<option value="">Selecione um fotógrafo</option>';
            fotografos.forEach(f => {
                const nome = f['Nome'] || f['Fotografo'];
                if (nome) {
                    const option = document.createElement('option');
                    option.value = nome;
                    option.textContent = nome;
                    fotografoSelect.appendChild(option);
                }
            });

            // Esconder loading e mostrar conteúdo
            loadingEl.classList.add('d-none');
            conteudoEl.classList.remove('d-none');

        } catch (error) {
            console.error('Erro ao carregar dados para agendamento:', error);
            showError('Falha ao carregar os dados. Verifique o console para mais detalhes.');
        }
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const dataAgendamento = document.getElementById('dataAgendamento').value;
        const horarioSessao = document.getElementById('horarioSessao').value;
        const fotografo = document.getElementById('fotografo').value;

        if (!dataAgendamento || !horarioSessao || !fotografo) {
            alert('Por favor, preencha todos os campos obrigatórios: Data, Horário e Fotógrafo.');
            return;
        }

        // Alerta sobre a limitação da funcionalidade de salvar
        alert('Interface de agendamento pronta!\n\nAVISO: A funcionalidade de SALVAR ainda não está implementada. Isso requer a criação de um script no Google (Google Apps Script) para permitir a alteração de dados na planilha, o que não é suportado no momento.\n\nOs dados do formulário seriam:\n- Data: ' + dataAgendamento + '\n- Horário: ' + horarioSessao + '\n- Fotógrafo: ' + fotografo);

        // Aqui entraria a chamada para a API de escrita, por exemplo:
        // api.updateRecord(recordId, {
        //     'Status': 'Agendado',
        //     'Data do agendamento': dataAgendamento,
        //     'Horario da Sessao': horarioSessao,
        //     'Fotografo': fotografo,
        //     'agenda': 'privado',
        //     'cobrança': 'a faturar',
        //     'editado': 'nao'
        // }).then(() => {
        //     alert('Agendamento salvo com sucesso!');
        //     window.location.href = 'pendentes.html';
        // }).catch(err => {
        //     alert('Erro ao salvar: ' + err.message);
        // });
    });

    loadData();
});
