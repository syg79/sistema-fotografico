document.addEventListener('DOMContentLoaded', async () => {
    const loadingEl = document.getElementById('loading');
    const conteudoEl = document.getElementById('conteudoPagina');
    const form = document.getElementById('formEditarRegistro');
    const recordIdEl = document.getElementById('recordId');

    // Campos do formulário
    const statusSelect = document.getElementById('status');
    const dataSolicitacaoInput = document.getElementById('dataSolicitacao');
    const redeInput = document.getElementById('rede');
    const clienteInput = document.getElementById('cliente');
    const referenciaInput = document.getElementById('referencia');
    const enderecoInput = document.getElementById('endereco');
    const complementoInput = document.getElementById('complemento');
    const tipoServicoInput = document.getElementById('tipoServico');

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
            showError('ID do registro não fornecido. Volte para a página de registros e tente novamente.');
            return;
        }

        recordIdEl.textContent = recordId;

        try {
            // Aguardar a API
            let tentativas = 0;
            while (!window.googleSheetsAPI && tentativas < 10) {
                await new Promise(resolve => setTimeout(resolve, 200));
                tentativas++;
            }
            if (!window.googleSheetsAPI) {
                throw new Error('A API do Google Sheets não foi inicializada.');
            }

            const api = window.googleSheetsAPI;
            const solicitacoes = await api.getSolicitacoes();
            const pedido = solicitacoes.find(s => (s['ID Solicitacao'] || s['Record ID']) === recordId);

            if (!pedido) {
                showError(`Registro com ID ${recordId} não encontrado.`);
                return;
            }

            // Popular campos
            dataSolicitacaoInput.value = (pedido['Data da Solicitacao (email)'] || '').split(' ')[0];
            redeInput.value = pedido['Rede'] || '';
            clienteInput.value = pedido['Nome Cliente'] || '';
            referenciaInput.value = pedido['Referencia do Cliente'] || '';
            enderecoInput.value = pedido['Endereco do Imovel'] || '';
            complementoInput.value = pedido['Complemento'] || '';
            tipoServicoInput.value = pedido['Tipo do Servico'] || '';

            // Popular e selecionar status
            const statusOptions = ['Pendente', 'Agendado', 'Realizado', 'Editado', 'Conferido', 'Faturado', 'Cancelado'];
            statusSelect.innerHTML = statusOptions.map(opt => `<option value="${opt}">${opt}</option>`).join('');
            statusSelect.value = pedido['Status'] || 'Pendente';

            // Esconder loading e mostrar conteúdo
            loadingEl.classList.add('d-none');
            conteudoEl.classList.remove('d-none');

        } catch (error) {
            console.error('Erro ao carregar dados para edição:', error);
            showError('Falha ao carregar os dados. Verifique o console para mais detalhes.');
        }
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Coletar dados do formulário (apenas para demonstração)
        const formData = {
            status: statusSelect.value,
            dataSolicitacao: dataSolicitacaoInput.value,
            rede: redeInput.value,
            cliente: clienteInput.value,
            // ... e assim por diante para todos os campos
        };

        // Alerta sobre a limitação da funcionalidade de salvar
        alert('Interface de edição pronta!\n\nAVISO: A funcionalidade de SALVAR ainda não está implementada. Isso requer a criação de um script no Google (Google Apps Script) para permitir a alteração de dados na planilha.');

        console.log('Dados que seriam salvos:', formData);
    });

    loadData();
});
