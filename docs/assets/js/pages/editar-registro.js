/**
 * Classe para gerenciar a edição de registros
 * Responsável por carregar, editar e salvar registros de solicitações
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

    /**
     * Inicializa a classe e configura todos os componentes necessários
     * @returns {Promise<void>}
     */
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
            
            // Carregar dados de clientes primeiro
            await this.carregarClientes();
            
            // Carregar dados do registro
            await this.loadRecordData();
            
        } catch (error) {
            console.error('Erro ao inicializar página de edição:', error);
            this.showError('Erro ao inicializar a página');
        }
    }

    /**
     * Carrega dados de clientes do Google Sheets com sistema de fallback
     * Utiliza a estrutura: Coluna E (nome cliente) e Coluna F (rede)
     * @returns {Promise<void>}
     */
    async carregarClientes() {
        try {
            console.log('🔄 Iniciando carregamento de clientes...');
            
            // Aguardar a API estar disponível
            let tentativas = 0;
            while (!window.googleSheetsAPI && tentativas < 10) {
                await new Promise(resolve => setTimeout(resolve, 200));
                tentativas++;
            }
            
            if (!window.googleSheetsAPI) {
                throw new Error('A API do Google Sheets não foi inicializada.');
            }

            console.log('✅ API do Google Sheets disponível');
            const api = window.googleSheetsAPI;
            const clientesData = await api.loadSheetData('clientes');
            
            console.log('📊 Dados de clientes carregados:', clientesData ? clientesData.length : 0, 'registros');
            
            if (clientesData && clientesData.length > 0) {
                // Log detalhado da estrutura dos dados
                console.log('🔍 ESTRUTURA DOS DADOS DO GOOGLE SHEETS:');
                console.log('Primeiro cliente completo:', clientesData[0]);
                console.log('Chaves disponíveis:', Object.keys(clientesData[0]));
                
                // Verificar especificamente campos relacionados à rede
                const primeiroCliente = clientesData[0];
                console.log('🏢 CAMPOS RELACIONADOS À REDE:');
                Object.keys(primeiroCliente).forEach(key => {
                    if (key.toLowerCase().includes('rede') || 
                        key.toLowerCase().includes('empresa') || 
                        key.toLowerCase().includes('nome')) {
                        console.log(`- ${key}: "${primeiroCliente[key]}"`);
                    }
                });
                
                // Armazenar todos os clientes para filtrar posteriormente
                this.todosClientes = clientesData;
                console.log('💾 Clientes armazenados em this.todosClientes:', this.todosClientes.length);
                this.preencherSelectClientes(clientesData);
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar clientes:', error);
        }
    }

    /**
     * Preenche o select de clientes com dados filtrados por rede
     * Utiliza sistema de fallback para compatibilidade com diferentes estruturas de dados
     * @param {Array} clientes - Array de objetos com dados dos clientes
     * @param {string|null} redeFiltro - Nome da rede para filtrar (opcional)
     */
    preencherSelectClientes(clientes, redeFiltro = null) {
        const selectCliente = document.getElementById('nomeCliente');
        
        // Limpar opções existentes (exceto a primeira)
        while (selectCliente.children.length > 1) {
            selectCliente.removeChild(selectCliente.lastChild);
        }
        
        console.log('🔍 Filtro de rede aplicado:', redeFiltro);
        console.log('📊 Total de clientes recebidos:', clientes.length);
        
        // Filtrar clientes por rede se especificado
        let clientesFiltrados = clientes;
        if (redeFiltro && redeFiltro !== '') {
            console.log('🎯 Iniciando filtro por rede:', redeFiltro);
            clientesFiltrados = clientes.filter(cliente => {
                // Usar os campos corretos do Google Sheets:
                // Coluna E = nome cliente, Coluna F = nome da rede
                const redeCliente = cliente['Coluna F'] || cliente['F'] || cliente['Rede'] || '';
                const nomeCliente = cliente['Coluna E'] || cliente['E'] || cliente['Nome Empresa'] || '';
                
                // Normalizar o texto removendo quebras de linha e espaços extras
                const dadosNormalizados = redeCliente.replace(/\n/g, ' ').replace(/\s+/g, ' ').toLowerCase().trim();
                const filtroNormalizado = redeFiltro.toLowerCase().trim();
                
                console.log('👤 Cliente:', nomeCliente);
                console.log('🏢 Rede do cliente (Coluna F):', redeCliente);
                console.log('🔧 Dados normalizados:', dadosNormalizados);
                console.log('🎯 Filtro normalizado:', filtroNormalizado);
                
                const match = dadosNormalizados.includes(filtroNormalizado);
                console.log('✅ Match resultado:', match);
                console.log('---');
                return match;
            });
            console.log('🎉 Total de clientes após filtro:', clientesFiltrados.length);
        }
        
        // Adicionar opção "(sem rede)" para clientes sem informação de rede
        if (!redeFiltro || redeFiltro === '') {
            const clientesSemRede = clientes.filter(cliente => {
                const redeCliente = cliente['Coluna F'] || cliente['F'] || cliente['Rede'] || '';
                return redeCliente.trim() === '';
            });
            
            if (clientesSemRede.length > 0) {
                const optionSemRede = document.createElement('option');
                optionSemRede.value = '(sem rede)';
                optionSemRede.textContent = `(sem rede) - ${clientesSemRede.length} cliente(s)`;
                selectCliente.appendChild(optionSemRede);
            }
        }
        
        // Ordenar clientes por nome (Coluna E)
        const clientesOrdenados = clientesFiltrados
            .filter(cliente => cliente['Coluna E'] || cliente['E'] || cliente['Nome Empresa'])
            .sort((a, b) => {
                const nomeA = (a['Coluna E'] || a['E'] || a['Nome Empresa'] || '').toLowerCase();
                const nomeB = (b['Coluna E'] || b['E'] || b['Nome Empresa'] || '').toLowerCase();
                return nomeA.localeCompare(nomeB);
            });
        
        // Adicionar opções
        clientesOrdenados.forEach(cliente => {
            const nomeCliente = cliente['Coluna E'] || cliente['E'] || cliente['Nome Empresa'];
            if (nomeCliente) {
                const option = document.createElement('option');
                option.value = cliente['Record ID'] || cliente['ID'] || cliente['A'];
                option.textContent = nomeCliente;
                selectCliente.appendChild(option);
            }
        });
    }

    /**
     * Filtra clientes por rede selecionada
     * Reseta o campo Nome Cliente e recarrega a lista filtrada
     * @param {string} redeSelecionada - Nome da rede para filtrar
     */
    filtrarClientesPorRede(redeSelecionada) {
        if (this.todosClientes && this.todosClientes.length > 0) {
            // Resetar o campo Nome Cliente para a opção padrão
            const selectCliente = document.getElementById('nomeCliente');
            selectCliente.value = '';
            
            // Recarregar clientes com filtro por rede
            this.preencherSelectClientes(this.todosClientes, redeSelecionada);
        }
    }

    /**
     * Extrai o Record ID da URL atual
     * @returns {string|null} Record ID ou null se não encontrado
     */
    getRecordIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    /**
     * Configura todos os event listeners da página
     * Inclui botões, formulários, checkboxes e filtros
     */
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

        // Event listener para filtrar clientes por rede
        document.getElementById('rede').addEventListener('change', (e) => {
            console.log('🔄 Event listener do campo rede ativado!');
            console.log('📋 Valor selecionado:', e.target.value);
            console.log('🏢 Total de clientes disponíveis:', this.todosClientes ? this.todosClientes.length : 0);
            this.filtrarClientesPorRede(e.target.value);
        });
    }

    /**
     * Carrega dados do registro específico do Google Sheets
     * Busca pelo Record ID e preenche o formulário
     * @returns {Promise<void>}
     */
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

    /**
     * Preenche o formulário com dados do registro
     * Mapeia campos do Google Sheets para campos do formulário
     * @param {Object} record - Objeto com dados do registro
     */
    populateForm(record) {
        // DEBUG: Log específico para o registro xPjXEq7rKG
        if (this.recordId === 'xPjXEq7rKG') {
            console.log('=== DEBUG REGISTRO xPjXEq7rKG ===');
            console.log('Record completo:', record);
            console.log('Chaves disponíveis:', Object.keys(record));
            console.log('Quantidade de sessões FOTO:', record['Quantidade de sessões FOTO']);
            console.log('Quantidade video:', record['Quantidade video']);
            console.log('Quantidade Drone (video):', record['Quantidade Drone (video)']);
            console.log('Tour 360:', record['Tour 360']);
            console.log('Tipo do Serviço:', record['Tipo do Serviço']);
            console.log('================================');
        }
        
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
        // Se as quantidades estão vazias, inferir baseado no tipo de serviço
        const tipoServico = record['Tipo do Servico'] || record['Tipo do Serviço'] || '';
        
        let quantidadeFoto = record['Quantidade de sessões FOTO'] || '';
        let quantidadeVideo = record['Quantidade video'] || '';
        let quantidadeDroneVideo = record['Quantidade Drone (video)'] || '';
        let quantidadeTour360 = record['Tour 360'] || '';
        
        // Lógica para inferir quantidades baseado no tipo de serviço quando estão vazias
        if (tipoServico) {
            if (tipoServico.includes('Fotos') && !quantidadeFoto) {
                quantidadeFoto = '1';
            }
            if (tipoServico.includes('Video em Solo (formato Reels)') && !quantidadeVideo) {
                quantidadeVideo = '1';
            }
            if (tipoServico.includes('Drone video') && !quantidadeDroneVideo) {
                quantidadeDroneVideo = '1';
            }
            if (tipoServico.includes('Tour 360') && !quantidadeTour360) {
                quantidadeTour360 = '1';
            }
        }
        
        this.setFieldValue('quantidadeFoto', quantidadeFoto || 0);
        this.setFieldValue('quantidadeInclusoes', record['Quantidade de inclusões'] || 0);
        this.setFieldValue('quantidadeDroneVideo', quantidadeDroneVideo || 0);
        this.setFieldValue('quantidadeVideo', quantidadeVideo || 0);
        this.setFieldValue('quantidadeTour360', quantidadeTour360 || 0);
        
        // Campos adicionais
        this.setRadioValue('cobranca', record['Cobranca'] || 'A faturar'); // Cobrança
        
        // Publicar Agenda - tratamento especial para o toggle switch
        const publicarAgendaValue = record['Publicar Agenda'] || '';
        const publicarAgendaToggle = document.getElementById('publicarAgenda');
        const publicarAgendaLabel = document.getElementById('publicarAgendaLabel');
        
        if (publicarAgendaToggle && publicarAgendaLabel) {
            publicarAgendaToggle.checked = publicarAgendaValue === 'Sim' || publicarAgendaValue === 'SIM';
            publicarAgendaLabel.textContent = publicarAgendaToggle.checked ? 'SIM' : 'NÃO';
        }

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

    /**
     * Define o valor de um campo do formulário
     * @param {string} fieldId - ID do campo HTML
     * @param {string|boolean|number} value - Valor a ser definido
     * @description Função utilitária que define valores em campos do formulário,
     * tratando checkboxes de forma especial (converte para boolean)
     */
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

    /**
     * Define o valor de um grupo de radio buttons
     * @param {string} name - Nome do grupo de radio buttons
     * @param {string} value - Valor a ser selecionado
     * @description Seleciona o radio button correspondente ao valor fornecido
     */
    setRadioValue(name, value) {
        if (value) {
            const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
            if (radio) {
                radio.checked = true;
            }
        }
    }

    /**
     * Define os tipos de serviço baseado nos dados do registro
     * @param {Object} record - Dados do registro carregado
     * @description Marca os checkboxes de tipo de serviço baseado na coluna
     * "Tipo do Servico" e nas quantidades específicas de cada serviço
     */
    setServiceTypes(record) {
        // Resetar todos os checkboxes
        document.querySelectorAll('input[name="tipoServico"]').forEach(cb => cb.checked = false);

        // Ler o tipo de serviço da coluna "Tipo do Servico"
        const tipoServico = record['Tipo do Servico'] || '';
        console.log('Tipo de serviço encontrado:', tipoServico);

        // Marcar os serviços baseado no tipo de serviço e nas quantidades
        if (tipoServico.toLowerCase().includes('foto') || (record['Quantidade de sessões FOTO'] && parseInt(record['Quantidade de sessões FOTO']) > 0)) {
            const fotoCheckbox = document.getElementById('servicoFoto');
            if (fotoCheckbox) {
                fotoCheckbox.checked = true;
                console.log('Checkbox FOTO marcado');
            }
        }
        
        if (tipoServico.toLowerCase().includes('video') && tipoServico.toLowerCase().includes('youtube') || (record['Quantidade video'] && parseInt(record['Quantidade video']) > 0)) {
            const videoYoutubeCheckbox = document.getElementById('servicoVideoYoutube');
            if (videoYoutubeCheckbox) {
                videoYoutubeCheckbox.checked = true;
                console.log('Checkbox Video YouTube marcado');
            }
        }
        
        if (tipoServico.toLowerCase().includes('video') && tipoServico.toLowerCase().includes('reel')) {
            const videoReelsCheckbox = document.getElementById('servicoVideoReels');
            if (videoReelsCheckbox) {
                videoReelsCheckbox.checked = true;
                console.log('Checkbox Video Reels marcado');
            }
        }
        
        if (tipoServico.toLowerCase().includes('drone') && tipoServico.toLowerCase().includes('video') || (record['Quantidade Drone (video)'] && parseInt(record['Quantidade Drone (video)']) > 0)) {
            const droneVideoCheckbox = document.getElementById('servicoDroneVideo');
            if (droneVideoCheckbox) {
                droneVideoCheckbox.checked = true;
                console.log('Checkbox Drone Video marcado');
            }
        }
        
        if (tipoServico.toLowerCase().includes('drone') && tipoServico.toLowerCase().includes('foto')) {
            const droneFotoCheckbox = document.getElementById('servicoDroneFoto');
            if (droneFotoCheckbox) {
                droneFotoCheckbox.checked = true;
                console.log('Checkbox Drone Foto marcado');
            }
        }
        
        if (tipoServico.toLowerCase().includes('tour') || tipoServico.toLowerCase().includes('360') || (record['Tour 360'] && parseInt(record['Tour 360']) > 0)) {
            const tour360Checkbox = document.getElementById('servicoTour360');
            if (tour360Checkbox) {
                tour360Checkbox.checked = true;
                console.log('Checkbox Tour 360 marcado');
            }
        }
        
        if (tipoServico.toLowerCase().includes('edicao') || tipoServico.toLowerCase().includes('edição')) {
            const edicaoCheckbox = document.getElementById('servicoEdicao');
            if (edicaoCheckbox) {
                edicaoCheckbox.checked = true;
                console.log('Checkbox Edição marcado');
            }
        }
    }

    toggleObsEditor(show) {
        // Esta função pode ser expandida para mostrar/ocultar campos específicos
        // relacionados às observações para o editor
        console.log('Toggle observações para editor:', show);
    }

    updateQuantidadeFields() {
        // Atualizar campos de quantidade baseado nos checkboxes selecionados
        const fotoCheckbox = document.getElementById('servicoFoto');
        const videoYoutubeCheckbox = document.getElementById('servicoVideoYoutube');
        const videoReelsCheckbox = document.getElementById('servicoVideoReels');
        const droneVideoCheckbox = document.getElementById('servicoDroneVideo');
        const droneFotosCheckbox = document.getElementById('servicoDroneFotos');
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

        // Lógica para vídeo (Youtube ou Reels)
        if ((videoYoutubeCheckbox && videoYoutubeCheckbox.checked) || (videoReelsCheckbox && videoReelsCheckbox.checked)) {
            const videoField = document.getElementById('quantidadeVideo');
            if (videoField && (videoField.value == 0 || videoField.value == '')) {
                videoField.value = 1;
            }
        } else if ((!videoYoutubeCheckbox || !videoYoutubeCheckbox.checked) && (!videoReelsCheckbox || !videoReelsCheckbox.checked)) {
            const videoField = document.getElementById('quantidadeVideo');
            if (videoField) videoField.value = 0;
        }

        // Lógica para drone vídeo
        if (droneVideoCheckbox && droneVideoCheckbox.checked) {
            const droneVideoField = document.getElementById('quantidadeDroneVideo');
            if (droneVideoField && (droneVideoField.value == 0 || droneVideoField.value == '')) {
                droneVideoField.value = 1;
            }
        } else if (droneVideoCheckbox && !droneVideoCheckbox.checked) {
            const droneVideoField = document.getElementById('quantidadeDroneVideo');
            if (droneVideoField) droneVideoField.value = 0;
        }

        // Lógica para Tour 360
        if (tour360Checkbox && tour360Checkbox.checked) {
            const tour360Field = document.getElementById('quantidadeTour360');
            if (tour360Field && (tour360Field.value == 0 || tour360Field.value == '')) {
                tour360Field.value = 1;
            }
        } else if (tour360Checkbox && !tour360Checkbox.checked) {
            const tour360Field = document.getElementById('quantidadeTour360');
            if (tour360Field) tour360Field.value = 0;
        }
    }

    /**
     * Atualiza as informações do registro exibidas na interface
     * @param {Object} record - Dados do registro carregado
     * @description Exibe informações básicas do registro (ID, cliente, endereço) na parte superior da página
     */
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

    /**
     * Salva as alterações do registro no Google Sheets
     * @async
     * @returns {Promise<void>}
     * @description Valida o formulário, coleta os dados, atualiza o registro via API e redireciona para a página de pendentes
     * @throws {Error} Quando há erro na validação ou na API de escrita
     */
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

    /**
     * Valida os campos obrigatórios do formulário
     * @returns {boolean} True se todos os campos obrigatórios estão preenchidos, false caso contrário
     * @description Verifica se os campos Rede, Nome Cliente e Endereço do Imóvel estão preenchidos
     */
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

    /**
     * Coleta todos os dados do formulário para envio
     * @returns {Object} Objeto com todos os dados do formulário formatados para o Google Sheets
     * @description Extrai valores de todos os campos do formulário e os formata adequadamente
     */
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

        // Quantidades - usando os nomes corretos das colunas
        formData['AL'] = this.getFieldValue('quantidadeFoto') || 0; // Quantidade de fotos
        formData['AM'] = this.getFieldValue('quantidadeInclusoes') || 0; // Quantidade de inclusões
        formData['AN'] = this.getFieldValue('quantidadeDroneVideo') || 0; // Quantidade Drone (video)
        formData['AO'] = this.getFieldValue('quantidadeVideo') || 0; // Quantidade video
        formData['AK'] = this.getFieldValue('quantidadeTour360') || 0; // Tour 360
        
        // Campos adicionais
        formData['AQ'] = this.getRadioValue('cobranca') || 'A faturar'; // Cobrança
        
        // Publicar Agenda - tratamento especial para o toggle switch
        const publicarAgendaToggle = document.getElementById('publicarAgenda');
        const publicarAgendaValue = publicarAgendaToggle && publicarAgendaToggle.checked ? 'Sim' : 'Não';
        formData['AT'] = publicarAgendaValue; // Publicar Agenda
        
        // Se Publicar Agenda for 'Sim', alterar o status para um valor específico (se necessário)
        if (publicarAgendaValue === 'Sim') {
            // Implementar lógica de mudança de status se necessário
            // Por exemplo: formData['Status'] = 'Publicado na Agenda';
            console.log('Publicar Agenda ativado - Status pode ser alterado se necessário');
        }

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

    /**
     * Obtém o valor de um campo do formulário pelo ID
     * @param {string} fieldId - ID do campo a ser consultado
     * @returns {string} Valor do campo ou string vazia se não encontrado
     * @description Função utilitária para extrair valores de campos de input
     */
    getFieldValue(fieldId) {
        const field = document.getElementById(fieldId);
        return field ? field.value : '';
    }

    /**
     * Obtém o valor selecionado de um grupo de radio buttons
     * @param {string} name - Nome do grupo de radio buttons
     * @returns {string} Valor do radio button selecionado ou string vazia
     * @description Função utilitária para extrair valores de radio buttons selecionados
     */
    getRadioValue(name) {
        const radio = document.querySelector(`input[name="${name}"]:checked`);
        return radio ? radio.value : '';
    }

    /**
     * Formata uma data do formato DD/MM/YYYY para YYYY-MM-DD (formato de input date)
     * @param {string} dateString - Data no formato DD/MM/YYYY
     * @returns {string} Data formatada para input ou string vazia em caso de erro
     * @description Converte datas do Google Sheets para o formato aceito pelos inputs HTML
     */
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

    /**
     * Formata uma data do formato YYYY-MM-DD para DD/MM/YYYY (formato para salvar)
     * @param {string} dateString - Data no formato YYYY-MM-DD
     * @returns {string} Data formatada para salvar ou string original em caso de erro
     * @description Converte datas dos inputs HTML para o formato usado no Google Sheets
     */
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

    /**
     * Cancela a edição do registro e retorna à página anterior
     * @description Verifica se há alterações não salvas e solicita confirmação antes de cancelar
     */
    cancelEdit() {
        if (this.hasChanges()) {
            if (confirm('Você tem alterações não salvas. Deseja realmente cancelar?')) {
                window.location.href = 'pendentes.html';
            }
        } else {
            window.location.href = 'pendentes.html';
        }
    }

    /**
     * Verifica se o formulário possui alterações não salvas
     * @returns {boolean} True se há alterações, false caso contrário
     * @description Compara os dados originais com os dados atuais do formulário
     */
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

    /**
     * Exibe o overlay de carregamento com mensagem personalizada
     * @param {string} message - Mensagem a ser exibida (padrão: 'Carregando...')
     * @description Mostra indicador visual de carregamento para operações assíncronas
     */
    showLoading(message = 'Carregando...') {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            const messageEl = overlay.querySelector('div div:last-child');
            if (messageEl) messageEl.textContent = message;
            overlay.style.display = 'flex';
        }
    }

    /**
     * Oculta o overlay de carregamento
     * @description Remove o indicador visual de carregamento
     */
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    /**
     * Exibe mensagem de erro para o usuário
     * @param {string} message - Mensagem de erro a ser exibida
     * @description Mostra alerta com mensagem de erro formatada
     */
    showError(message) {
        alert(`Erro: ${message}`);
    }

    /**
     * Exibe mensagem de sucesso para o usuário
     * @param {string} message - Mensagem de sucesso a ser exibida
     * @description Mostra alerta com mensagem de sucesso formatada
     */
    showSuccess(message) {
        alert(`Sucesso: ${message}`);
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new EditarRegistro();
});
