/**
 * Classe para gerenciar a edição de registros
 */
class EditarRegistro {
    constructor() {
        this.recordId = null;
        this.originalData = null;
        this.sheetsAPI = null;
        this.sheetsWriter = null;
        this.loadingIndicator = null;
        
        this.init();
    }

    async init() {
        try {
            // Inicializar APIs
            this.sheetsAPI = new GoogleSheetsAPI();
            this.sheetsWriter = new GoogleSheetsWriter();
            this.loadingIndicator = new LoadingIndicator();

            // Obter Record ID da URL
            this.recordId = this.getRecordIdFromURL();
            
            if (!this.recordId) {
                this.showError('ID do registro não encontrado na URL');
                return;
            }

            // Configurar eventos
            this.setupEventListeners();
            
            // Carregar dados do registro
            await this.loadRecordData();
            
        } catch (error) {
            console.error('Erro ao inicializar página de edição:', error);
            this.showError('Erro ao inicializar a página');
        }
    }

    getRecordIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    setupEventListeners() {
        // Botões de cancelar
        document.getElementById('btnCancelar').addEventListener('click', () => {
            this.cancelEdit();
        });
        
        document.getElementById('btnCancelarForm').addEventListener('click', () => {
            this.cancelEdit();
        });

        // Botão de salvar
        document.getElementById('btnSalvar').addEventListener('click', () => {
            this.saveRecord();
        });

        // Submit do formulário
        document.getElementById('formEditarRegistro').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveRecord();
        });

        // Checkbox de observações para editor
        document.getElementById('possuiObsEditor').addEventListener('change', (e) => {
            this.toggleObsEditor(e.target.checked);
        });

        // Checkboxes de tipo de serviço
        const tipoServicoCheckboxes = document.querySelectorAll('input[name="tipoServico"]');
        tipoServicoCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateQuantidadeFields();
            });
        });
    }

    async loadRecordData() {
        try {
            this.showLoading('Carregando dados do registro...');
            
            // Aguardar a API estar disponível
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
            
            if (!solicitacoes || !solicitacoes.length) {
                throw new Error('Nenhum dado encontrado');
            }

            // Encontrar o registro pelo Record ID
            const record = solicitacoes.find(row => (row['Record ID'] || row['ID Solicitacao']) === this.recordId);
            
            if (!record) {
                throw new Error(`Registro com ID ${this.recordId} não encontrado`);
            }

            this.originalData = { ...record };
            
            // Preencher formulário
            this.populateForm(record);
            
            // Atualizar informações do cabeçalho
            this.updateRecordInfo(record);
            
            this.hideLoading();
            
        } catch (error) {
            console.error('Erro ao carregar dados do registro:', error);
            this.hideLoading();
            this.showError(`Erro ao carregar dados: ${error.message}`);
        }
    }

    populateForm(record) {
        // Dados do Imóvel - usando os nomes corretos das colunas
        this.setFieldValue('rede', record['Rede']);
        this.setFieldValue('nomeCliente', record['Nome Cliente']);
        this.setFieldValue('referenciaCliente', record['Referencia do Cliente'] || record['Referência do Cliente']);
        this.setFieldValue('dataSolicitacao', this.formatDateForInput(record['Data da Solicitacao (email)'] || record['Data Solicitação']));
        this.setFieldValue('linkEmail', record['Link EMAIL (solicitacao)'] || record['Link EMAIL (solicitação)']);
        this.setFieldValue('tipoImovel', record['Tipo do Imovel'] || record['Tipo do Imóvel']);
        this.setFieldValue('enderecoImovel', record['Endereco do Imovel'] || record['Endereço do Imóvel']);
        this.setFieldValue('complemento', record['Complemento']);
        this.setFieldValue('bairroLocalidade', record['Bairro/Localidade']);
        this.setFieldValue('metrosQuadrados', record['m²']);
        this.setFieldValue('nomeCondominio', record['Nome do Condomínio']);
        this.setFieldValue('descricaoImovel', record['Descrição do Imóvel']);

        // Condição de habitação (radio) - usando nome correto
        this.setRadioValue('condicaoHabitacao', record['Condicao de Habitacao'] || record['Condição de Habitação']);

        // Observações para editor
        const possuiObs = record['Possui OBS para o Editor?'] === 'Sim';
        this.setFieldValue('possuiObsEditor', possuiObs);
        this.toggleObsEditor(possuiObs);

        // Tipo de serviço (checkboxes)
        this.setServiceTypes(record);

        // Quantidades - usando os nomes corretos das colunas da planilha
        this.setFieldValue('quantidadeFoto', record['AL'] || 0); // Quantidade de fotos
        this.setFieldValue('quantidadeInclusoes', record['AM'] || 0); // Quantidade de inclusões
        this.setFieldValue('quantidadeDroneVideo', record['AN'] || 0); // Quantidade Drone (video)
        this.setFieldValue('quantidadeVideo', record['AO'] || 0); // Quantidade video
        this.setFieldValue('quantidadeTour360', record['AK'] || 0); // Tour 360
        
        // Campos adicionais
        this.setFieldValue('cobranca', record['AQ'] || ''); // Cobrança
        this.setFieldValue('publicarAgenda', record['AT'] || ''); // Publicar Agenda

        // Dados do Agendamento
        this.setFieldValue('contatoAgendar01', record['Contato para agendar 01']);
        this.setFieldValue('contatoAgendar02', record['Contato para agendar 02']);
        this.setFieldValue('observacaoAgendamento', record['Observação para o Agendamento']);

        // Dados da Sessão
        this.setFieldValue('status', record['Status']);
        this.setFieldValue('dataAgendamento', this.formatDateForInput(record['Data do Agendamento']));
        this.setFieldValue('horarioSessao', record['Horário da Sessão']);
        this.setFieldValue('fotografo', record['Fotógrafo']);
        this.setRadioValue('fazerAreaComum', record['Fazer Área Comum']);
        this.setFieldValue('referenciasCopiadas', record['Referências a serem copiadas']);
        this.setFieldValue('observacaoFotografo', record['Observação para o Fotógrafo']);
    }

    setFieldValue(fieldId, value) {
        const field = document.getElementById(fieldId);
        if (field) {
            if (field.type === 'checkbox') {
                field.checked = value === true || value === 'Sim' || value === 'true';
            } else {
                field.value = value || '';
            }
        }
    }

    setRadioValue(name, value) {
        if (value) {
            const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
            if (radio) {
                radio.checked = true;
            }
        }
    }

    setServiceTypes(record) {
        // Resetar todos os checkboxes
        document.querySelectorAll('input[name="tipoServico"]').forEach(cb => cb.checked = false);

        // Marcar os serviços baseado nas quantidades usando as colunas corretas
        if (record['AL'] && parseInt(record['AL']) > 0) { // Quantidade de fotos
            const fotoCheckbox = document.getElementById('servicoFoto');
            if (fotoCheckbox) fotoCheckbox.checked = true;
        }
        if (record['AO'] && parseInt(record['AO']) > 0) { // Quantidade video
            const videoCheckbox = document.getElementById('servicoVideo');
            if (videoCheckbox) videoCheckbox.checked = true;
        }
        if (record['AN'] && parseInt(record['AN']) > 0) { // Quantidade Drone (video)
            const droneCheckbox = document.getElementById('servicoDroneVideo');
            if (droneCheckbox) droneCheckbox.checked = true;
        }
        if (record['AK'] && parseInt(record['AK']) > 0) { // Tour 360
            const tour360Checkbox = document.getElementById('servicoTour360');
            if (tour360Checkbox) tour360Checkbox.checked = true;
        }
        
        // Verificar outros serviços baseados em dados específicos se disponíveis
        // Drone fotos, Video Reels, Edição podem precisar de lógica adicional
    }

    toggleObsEditor(show) {
        // Esta função pode ser expandida para mostrar/ocultar campos específicos
        // relacionados às observações para o editor
        console.log('Toggle observações para editor:', show);
    }

    updateQuantidadeFields() {
        // Atualizar campos de quantidade baseado nos checkboxes selecionados
        const fotoCheckbox = document.getElementById('servicoFoto');
        const videoCheckbox = document.getElementById('servicoVideo');
        const droneVideoCheckbox = document.getElementById('servicoDroneVideo');
        const tour360Checkbox = document.getElementById('servicoTour360');

        // Implementar lógica: se serviço for foto então quantidade de foto é = 1
        if (fotoCheckbox && fotoCheckbox.checked) {
            const fotoField = document.getElementById('quantidadeFoto');
            if (fotoField && (fotoField.value == 0 || fotoField.value == '')) {
                fotoField.value = 1;
            }
        } else if (fotoCheckbox && !fotoCheckbox.checked) {
            const fotoField = document.getElementById('quantidadeFoto');
            if (fotoField) fotoField.value = 0;
        }

        // Lógica similar para outros serviços
        if (videoCheckbox && !videoCheckbox.checked) {
            const videoField = document.getElementById('quantidadeVideo');
            if (videoField) videoField.value = 0;
        } else if (videoCheckbox && videoCheckbox.checked) {
            const videoField = document.getElementById('quantidadeVideo');
            if (videoField && (videoField.value == 0 || videoField.value == '')) {
                videoField.value = 1;
            }
        }

        if (droneVideoCheckbox && !droneVideoCheckbox.checked) {
            const droneVideoField = document.getElementById('quantidadeDroneVideo');
            if (droneVideoField) droneVideoField.value = 0;
        } else if (droneVideoCheckbox && droneVideoCheckbox.checked) {
            const droneVideoField = document.getElementById('quantidadeDroneVideo');
            if (droneVideoField && (droneVideoField.value == 0 || droneVideoField.value == '')) {
                droneVideoField.value = 1;
            }
        }

        if (tour360Checkbox && !tour360Checkbox.checked) {
            const tour360Field = document.getElementById('quantidadeTour360');
            if (tour360Field) tour360Field.value = 0;
        } else if (tour360Checkbox && tour360Checkbox.checked) {
            const tour360Field = document.getElementById('quantidadeTour360');
            if (tour360Field && (tour360Field.value == 0 || tour360Field.value == '')) {
                tour360Field.value = 1;
            }
        }
    }

    updateRecordInfo(record) {
        const recordInfo = document.getElementById('recordInfo');
        if (recordInfo) {
            recordInfo.innerHTML = `
                <strong>Record ID:</strong> ${this.recordId} | 
                <strong>Cliente:</strong> ${record['Nome Cliente'] || 'N/A'} | 
                <strong>Endereço:</strong> ${record['Endereço do Imóvel'] || 'N/A'}
            `;
        }
    }

    async saveRecord() {
        try {
            this.showLoading('Salvando alterações...');

            // Validar formulário
            if (!this.validateForm()) {
                this.hideLoading();
                return;
            }

            // Coletar dados do formulário
            const formData = this.collectFormData();
            
            // Adicionar Record ID
            formData['Record ID'] = this.recordId;

            // Usar a API existente para salvar
            if (window.googleSheetsWriter) {
                await window.googleSheetsWriter.updateRecord(this.recordId, formData);
            } else {
                throw new Error('API de escrita não disponível');
            }

            this.hideLoading();
            this.showSuccess('Registro atualizado com sucesso!');

            // Aguardar um pouco e redirecionar
            setTimeout(() => {
                window.location.href = 'pendentes.html';
            }, 2000);

        } catch (error) {
            console.error('Erro ao salvar registro:', error);
            this.hideLoading();
            this.showError(`Erro ao salvar: ${error.message}`);
        }
    }

    validateForm() {
        const requiredFields = [
            { id: 'rede', name: 'Rede' },
            { id: 'nomeCliente', name: 'Nome Cliente' },
            { id: 'enderecoImovel', name: 'Endereço do Imóvel' }
        ];

        for (const field of requiredFields) {
            const element = document.getElementById(field.id);
            if (!element || !element.value.trim()) {
                this.showError(`O campo "${field.name}" é obrigatório`);
                element?.focus();
                return false;
            }
        }

        return true;
    }

    collectFormData() {
        const formData = {};

        // Dados do Imóvel
        formData['Rede'] = this.getFieldValue('rede');
        formData['Nome Cliente'] = this.getFieldValue('nomeCliente');
        formData['Referência do Cliente'] = this.getFieldValue('referenciaCliente');
        formData['Data Solicitação'] = this.formatDateForSave(this.getFieldValue('dataSolicitacao'));
        formData['Link EMAIL (solicitação)'] = this.getFieldValue('linkEmail');
        formData['Tipo do Imóvel'] = this.getFieldValue('tipoImovel');
        formData['Endereço do Imóvel'] = this.getFieldValue('enderecoImovel');
        formData['Complemento'] = this.getFieldValue('complemento');
        formData['Bairro/Localidade'] = this.getFieldValue('bairroLocalidade');
        formData['m²'] = this.getFieldValue('metrosQuadrados');
        formData['Nome do Condomínio'] = this.getFieldValue('nomeCondominio');
        formData['Descrição do Imóvel'] = this.getFieldValue('descricaoImovel');

        // Condição de habitação
        formData['Condição de Habitação'] = this.getRadioValue('condicaoHabitacao');

        // Observações para editor
        const obsEditorCheckbox = document.getElementById('possuiObsEditor');
        formData['Possui OBS para o Editor?'] = obsEditorCheckbox && obsEditorCheckbox.checked ? 'Sim' : 'Não';

        // Quantidades
        formData['Quantidade FOTO'] = this.getFieldValue('quantidadeFoto') || 0;
        formData['Quantidade VÍDEO'] = this.getFieldValue('quantidadeVideo') || 0;
        formData['Quantidade DRONE'] = this.getFieldValue('quantidadeDrone') || 0;

        // Dados do Agendamento
        formData['Contato para agendar 01'] = this.getFieldValue('contatoAgendar01');
        formData['Contato para agendar 02'] = this.getFieldValue('contatoAgendar02');
        formData['Observação para o Agendamento'] = this.getFieldValue('observacaoAgendamento');

        // Dados da Sessão
        formData['Status'] = this.getFieldValue('status');
        formData['Data do Agendamento'] = this.formatDateForSave(this.getFieldValue('dataAgendamento'));
        formData['Horário da Sessão'] = this.getFieldValue('horarioSessao');
        formData['Fotógrafo'] = this.getFieldValue('fotografo');
        formData['Fazer Área Comum'] = this.getRadioValue('fazerAreaComum');
        formData['Referências a serem copiadas'] = this.getFieldValue('referenciasCopiadas');
        formData['Observação para o Fotógrafo'] = this.getFieldValue('observacaoFotografo');

        return formData;
    }

    getFieldValue(fieldId) {
        const field = document.getElementById(fieldId);
        return field ? field.value : '';
    }

    getRadioValue(name) {
        const radio = document.querySelector(`input[name="${name}"]:checked`);
        return radio ? radio.value : '';
    }

    formatDateForInput(dateString) {
        if (!dateString) return '';
        
        try {
            // Assumindo formato DD/MM/YYYY
            const parts = dateString.split('/');
            if (parts.length === 3) {
                return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
            return dateString;
        } catch (error) {
            console.error('Erro ao formatar data para input:', error);
            return '';
        }
    }

    formatDateForSave(dateString) {
        if (!dateString) return '';
        
        try {
            // Converter de YYYY-MM-DD para DD/MM/YYYY
            const parts = dateString.split('-');
            if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
            return dateString;
        } catch (error) {
            console.error('Erro ao formatar data para salvar:', error);
            return dateString;
        }
    }

    cancelEdit() {
        if (this.hasChanges()) {
            if (confirm('Você tem alterações não salvas. Deseja realmente cancelar?')) {
                window.location.href = 'pendentes.html';
            }
        } else {
            window.location.href = 'pendentes.html';
        }
    }

    hasChanges() {
        if (!this.originalData) return false;
        
        const currentData = this.collectFormData();
        
        // Comparar dados originais com dados atuais
        for (const key in this.originalData) {
            if (this.originalData[key] !== currentData[key]) {
                return true;
            }
        }
        
        return false;
    }

    showLoading(message = 'Carregando...') {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            const messageEl = overlay.querySelector('div div:last-child');
            if (messageEl) messageEl.textContent = message;
            overlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showError(message) {
        alert(`Erro: ${message}`);
    }

    showSuccess(message) {
        alert(`Sucesso: ${message}`);
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new EditarRegistro();
});
