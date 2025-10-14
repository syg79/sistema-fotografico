// JavaScript específico para página de Novos Pedidos
class NovosPedidos {
    constructor() {
        this.formPedidoNormal = document.getElementById('formPedidoNormal');
        this.formEdicaoImagens = document.getElementById('formEdicaoImagens');
        this.btnPedidoNormal = document.getElementById('btnPedidoNormal');
        this.btnEdicaoImagens = document.getElementById('btnEdicaoImagens');
        this.integration = null;
        
        this.init();
    }

    async init() {
        // Aguardar integração Excel estar disponível
        await this.waitForIntegration();
        
        this.configurarEventos();
        await this.carregarDados();
        this.configurarFormularios();
        this.configurarValidacoes();
        
        // Mostrar formulário normal por padrão
        this.mostrarFormulario('normal');
    }

    async waitForIntegration() {
        return new Promise((resolve) => {
            const checkIntegration = () => {
                if (window.excelIntegration && window.excelIntegration.cache.size > 0) {
                    this.integration = window.excelIntegration;
                    resolve();
                } else {
                    setTimeout(checkIntegration, 100);
                }
            };
            checkIntegration();
        });
    }

    configurarEventos() {
        // Alternância entre formulários
        this.btnPedidoNormal.addEventListener('click', () => this.mostrarFormulario('normal'));
        this.btnEdicaoImagens.addEventListener('click', () => this.mostrarFormulario('edicao'));

        // Eventos para novos cadastros
        document.getElementById('btnNovoCliente').addEventListener('click', () => this.abrirModalCliente());
        document.getElementById('btnNovoCorretor').addEventListener('click', () => this.abrirModalCorretor());
        document.getElementById('btnSalvarCliente').addEventListener('click', () => this.salvarCliente());
        document.getElementById('btnSalvarCorretor').addEventListener('click', () => this.salvarCorretor());

        // Eventos para rascunhos
        document.getElementById('btnSalvarRascunho').addEventListener('click', () => this.salvarRascunho());
        document.getElementById('btnCarregarRascunho').addEventListener('click', () => this.carregarRascunho());

        // Evento para observação do editor
        document.getElementById('possuiObsEditor').addEventListener('change', (e) => {
            const campoObs = document.getElementById('campoObsEditor');
            campoObs.style.display = e.target.checked ? 'block' : 'none';
        });

        // Eventos para campos dependentes
        document.getElementById('rede').addEventListener('change', (e) => this.filtrarClientesPorRede(e.target.value));
        document.getElementById('cliente').addEventListener('change', (e) => {
            this.filtrarCorretoresPorCliente(e.target.value);
            this.preencherRedeAutomaticamente(e.target.value);
        });

        // Auto-preenchimento de CEP
        document.getElementById('cep').addEventListener('blur', (e) => this.buscarEnderecoPorCEP(e.target.value));

        // Validação em tempo real
        document.querySelectorAll('input[required], select[required]').forEach(campo => {
            campo.addEventListener('blur', () => this.validarCampo(campo));
        });

        // Atualização automática de quantidades baseada nos serviços selecionados
        document.querySelectorAll('input[name="tipo_servico[]"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.atualizarQuantidades());
        });
    }

    mostrarFormulario(tipo) {
        if (tipo === 'normal') {
            this.formPedidoNormal.style.display = 'block';
            this.formEdicaoImagens.style.display = 'none';
            this.btnPedidoNormal.classList.add('active');
            this.btnEdicaoImagens.classList.remove('active');
            document.getElementById('secaoObsEditor').style.display = 'block';
        } else {
            this.formPedidoNormal.style.display = 'none';
            this.formEdicaoImagens.style.display = 'block';
            this.btnPedidoNormal.classList.remove('active');
            this.btnEdicaoImagens.classList.add('active');
        }
    }

    async carregarDados() {
        try {
            console.log('📊 Carregando dados para novos pedidos...');
            
            // Carregar dados usando integração Excel
            await Promise.all([
                this.carregarClientes(),
                this.carregarCorretores(),
                this.carregarFotografos(),
                this.carregarBairros()
            ]);
            
            console.log('✅ Dados carregados com sucesso');
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            this.mostrarErro('Erro ao carregar dados do sistema');
        }
    }

    async carregarClientes() {
        try {
            const clientes = await this.integration.getClientes();
            const selectCliente = document.getElementById('cliente');
            
            if (selectCliente) {
                selectCliente.innerHTML = '<option value="">Selecione um cliente</option>';
                
                clientes.forEach(cliente => {
                    const option = document.createElement('option');
                    option.value = cliente.id;
                    option.textContent = cliente.nome;
                    option.dataset.rede = cliente.rede || '';
                    selectCliente.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        }
    }

    async carregarCorretores() {
        try {
            const corretores = await this.integration.getCorretores();
            const selectCorretor = document.getElementById('corretor');
            
            if (selectCorretor) {
                selectCorretor.innerHTML = '<option value="">Selecione um corretor</option>';
                
                corretores.forEach(corretor => {
                    const option = document.createElement('option');
                    option.value = corretor.id;
                    option.textContent = corretor.nome;
                    option.dataset.cliente = corretor.cliente || '';
                    selectCorretor.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar corretores:', error);
        }
    }

    async carregarFotografos() {
        try {
            const fotografos = await this.integration.getFotografos();
            const selectFotografo = document.getElementById('fotografo');
            
            if (selectFotografo) {
                selectFotografo.innerHTML = '<option value="">Selecione um fotógrafo</option>';
                
                fotografos.forEach(fotografo => {
                    const option = document.createElement('option');
                    option.value = fotografo.id;
                    option.textContent = fotografo.nome;
                    selectFotografo.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar fotógrafos:', error);
        }
    }

    async carregarBairros() {
        try {
            // Carregar bairros únicos das solicitações existentes
            const solicitacoes = await this.integration.getSolicitacoes();
            const bairros = [...new Set(solicitacoes.map(s => s.bairro).filter(b => b))];
            
            const datalistBairros = document.getElementById('bairros');
            if (datalistBairros) {
                datalistBairros.innerHTML = '';
                bairros.forEach(bairro => {
                    const option = document.createElement('option');
                    option.value = bairro;
                    datalistBairros.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar bairros:', error);
        }
    }

    filtrarClientesPorRede(redeId) {
        const selectCliente = document.getElementById('cliente');
        const options = selectCliente.querySelectorAll('option');
        
        options.forEach(option => {
            if (option.value === '') return; // Manter opção vazia
            
            if (!redeId || option.dataset.rede === redeId) {
                option.style.display = 'block';
            } else {
                option.style.display = 'none';
            }
        });

        // Limpar seleção se o cliente atual não pertence à rede selecionada
        const clienteSelecionado = selectCliente.options[selectCliente.selectedIndex];
        if (clienteSelecionado && clienteSelecionado.dataset.rede !== redeId) {
            selectCliente.value = '';
            this.filtrarCorretoresPorCliente('');
        }
    }

    filtrarCorretoresPorCliente(clienteId) {
        const selectCorretor = document.getElementById('corretor');
        const options = selectCorretor.querySelectorAll('option');
        
        options.forEach(option => {
            if (option.value === '') return; // Manter opção vazia
            
            if (!clienteId || option.dataset.clienteId === clienteId) {
                option.style.display = 'block';
            } else {
                option.style.display = 'none';
            }
        });

        // Limpar seleção se o corretor atual não pertence ao cliente selecionado
        const corretorSelecionado = selectCorretor.options[selectCorretor.selectedIndex];
        if (corretorSelecionado && corretorSelecionado.dataset.clienteId !== clienteId) {
            selectCorretor.value = '';
        }
    }

    preencherRedeAutomaticamente(clienteId) {
        if (!clienteId) return;
        
        const selectCliente = document.getElementById('cliente');
        const selectRede = document.getElementById('rede');
        const clienteSelecionado = selectCliente.options[selectCliente.selectedIndex];
        
        if (clienteSelecionado && clienteSelecionado.dataset.rede) {
            const redeId = clienteSelecionado.dataset.rede;
            selectRede.value = redeId;
            
            // Disparar evento change para atualizar outros campos dependentes
            const event = new Event('change', { bubbles: true });
            selectRede.dispatchEvent(event);
            
            console.log(`🔄 Rede preenchida automaticamente: ${redeId}`);
        }
    }

    async buscarEnderecoPorCEP(cep) {
        if (!cep || cep.length < 8) return;

        const cepLimpo = cep.replace(/\D/g, '');
        if (cepLimpo.length !== 8) return;

        try {
            const endereco = await SistemaUtils.buscarCEP(cepLimpo);
            if (endereco) {
                document.getElementById('endereco').value = `${endereco.logradouro}`;
                document.getElementById('bairro').value = endereco.bairro;
                
                window.sistema.mostrarInfo('Endereço preenchido automaticamente');
            }
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
        }
    }

    atualizarQuantidades() {
        const checkboxes = document.querySelectorAll('input[name="tipo_servico[]"]:checked');
        const servicos = Array.from(checkboxes).map(cb => cb.value);

        // Atualizar campos de quantidade baseado nos serviços selecionados
        document.getElementById('qtdFotos').value = servicos.includes('Fotos') ? 1 : 0;
        document.getElementById('qtdVideo').value = servicos.includes('Vídeo') ? 1 : 0;
        document.getElementById('qtdDrone').value = servicos.includes('Drone') ? 1 : 0;
        document.getElementById('qtdDroneFotos').value = servicos.includes('Drone') ? 1 : 0;
    }

    configurarFormularios() {
        // Configurar auto-save
        const campos = document.querySelectorAll('#formNovoPedido input, #formNovoPedido select, #formNovoPedido textarea');
        campos.forEach(campo => {
            campo.classList.add('auto-save');
        });
    }

    configurarValidacoes() {
        // Validações customizadas
        const formNovoPedido = document.getElementById('formNovoPedido');
        formNovoPedido.addEventListener('submit', (e) => {
            if (!this.validarFormulario(formNovoPedido)) {
                e.preventDefault();
                window.sistema.mostrarErro('Por favor, corrija os campos destacados');
            }
        });

        const formEdicao = document.getElementById('formEdicao');
        formEdicao.addEventListener('submit', (e) => {
            if (!this.validarFormulario(formEdicao)) {
                e.preventDefault();
                window.sistema.mostrarErro('Por favor, corrija os campos destacados');
            }
        });
    }

    validarFormulario(form) {
        let valido = true;
        const camposObrigatorios = form.querySelectorAll('[required]');

        camposObrigatorios.forEach(campo => {
            if (!this.validarCampo(campo)) {
                valido = false;
            }
        });

        // Validações específicas
        if (form.id === 'formNovoPedido') {
            // Verificar se pelo menos um tipo de serviço foi selecionado
            const tiposServico = form.querySelectorAll('input[name="tipo_servico[]"]:checked');
            if (tiposServico.length === 0) {
                window.sistema.mostrarErro('Selecione pelo menos um tipo de serviço');
                valido = false;
            }
        }

        return valido;
    }

    validarCampo(campo) {
        let valido = true;

        // Validação básica de campo obrigatório
        if (campo.hasAttribute('required') && !campo.value.trim()) {
            this.marcarCampoInvalido(campo, 'Este campo é obrigatório');
            valido = false;
        } else {
            // Validações específicas por tipo
            switch (campo.type) {
                case 'email':
                    if (campo.value && !SistemaUtils.validarEmail(campo.value)) {
                        this.marcarCampoInvalido(campo, 'Email inválido');
                        valido = false;
                    }
                    break;
                case 'url':
                    if (campo.value && !this.validarURL(campo.value)) {
                        this.marcarCampoInvalido(campo, 'URL inválida');
                        valido = false;
                    }
                    break;
                case 'number':
                    if (campo.value && (isNaN(campo.value) || parseFloat(campo.value) < 0)) {
                        this.marcarCampoInvalido(campo, 'Número inválido');
                        valido = false;
                    }
                    break;
            }
        }

        if (valido) {
            this.marcarCampoValido(campo);
        }

        return valido;
    }

    validarURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    marcarCampoInvalido(campo, mensagem) {
        campo.classList.add('is-invalid');
        campo.classList.remove('is-valid');
        
        // Remover mensagem anterior
        const feedbackAnterior = campo.parentNode.querySelector('.invalid-feedback');
        if (feedbackAnterior) {
            feedbackAnterior.remove();
        }

        // Adicionar nova mensagem
        const feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        feedback.textContent = mensagem;
        campo.parentNode.appendChild(feedback);
    }

    marcarCampoValido(campo) {
        campo.classList.add('is-valid');
        campo.classList.remove('is-invalid');
        
        // Remover mensagem de erro
        const feedback = campo.parentNode.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.remove();
        }
    }

    abrirModalCliente() {
        const modal = new bootstrap.Modal(document.getElementById('modalNovoCliente'));
        modal.show();
    }

    abrirModalCorretor() {
        const modal = new bootstrap.Modal(document.getElementById('modalNovoCorretor'));
        modal.show();
    }

    async salvarCliente() {
        const form = document.getElementById('formNovoCliente');
        if (!this.validarFormulario(form)) return;

        try {
            const formData = new FormData(form);
            const clienteData = {
                nome: formData.get('nomeCliente'),
                email: formData.get('emailCliente'),
                telefone: formData.get('telefoneCliente'),
                rede: formData.get('redeCliente'),
                endereco: formData.get('enderecoCliente'),
                observacoes: formData.get('observacoesCliente')
            };

            // Validar dados
            if (!clienteData.nome || !clienteData.email) {
                throw new Error('Nome e email são obrigatórios');
            }

            console.log('💾 Salvando cliente:', clienteData);
            
            // Aguardar Excel Writer estar disponível
            await this.waitForWriter();
            
            // Salvar usando Excel Writer
            const resultado = await window.excelWriter.salvarCliente(clienteData);
            
            // Fechar modal e recarregar clientes
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalNovoCliente'));
            modal.hide();
            
            await this.carregarClientes();
            this.mostrarSucesso('Cliente cadastrado com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro ao salvar cliente:', error);
            this.mostrarErro('Erro ao cadastrar cliente');
        }
    }

    async salvarCorretor() {
        const form = document.getElementById('formNovoCorretor');
        if (!this.validarFormulario(form)) return;

        try {
            const formData = new FormData(form);
            const corretorData = {
                nome: formData.get('nomeCorretor'),
                email: formData.get('emailCorretor'),
                telefone: formData.get('telefoneCorretor'),
                cliente: formData.get('clienteCorretor'),
                creci: formData.get('creciCorretor'),
                observacoes: formData.get('observacoesCorretor')
            };

            // Validar dados
            if (!corretorData.nome || !corretorData.email) {
                throw new Error('Nome e email são obrigatórios');
            }

            console.log('💾 Salvando corretor:', corretorData);
            
            // Aguardar Excel Writer estar disponível
            await this.waitForWriter();
            
            // Salvar usando Excel Writer
            const resultado = await window.excelWriter.salvarCorretor(corretorData);
            
            // Fechar modal e recarregar corretores
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalNovoCorretor'));
            modal.hide();
            
            await this.carregarCorretores();
            this.mostrarSucesso('Corretor cadastrado com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro ao salvar corretor:', error);
            this.mostrarErro('Erro ao cadastrar corretor');
        }
    }

    salvarRascunho() {
        const form = document.getElementById('formNovoPedido');
        const formData = new FormData(form);
        const dados = Object.fromEntries(formData.entries());
        
        localStorage.setItem('rascunho_novo_pedido', JSON.stringify(dados));
        window.sistema.mostrarSucesso('Rascunho salvo com sucesso!');
    }

    carregarRascunho() {
        const rascunho = localStorage.getItem('rascunho_novo_pedido');
        
        if (!rascunho) {
            window.sistema.mostrarInfo('Nenhum rascunho encontrado');
            return;
        }

        const dados = JSON.parse(rascunho);
        const form = document.getElementById('formNovoPedido');

        Object.entries(dados).forEach(([nome, valor]) => {
            const campo = form.querySelector(`[name="${nome}"]`);
            if (campo) {
                if (campo.type === 'checkbox' || campo.type === 'radio') {
                    campo.checked = campo.value === valor;
                } else {
                    campo.value = valor;
                }
            }
        });

        window.sistema.mostrarSucesso('Rascunho carregado com sucesso!');
    }

    limparRascunho() {
        localStorage.removeItem('rascunho_novo_pedido');
    }

    async waitForWriter() {
        let tentativas = 0;
        const maxTentativas = 50;
        
        while (!window.excelWriter && tentativas < maxTentativas) {
            await new Promise(resolve => setTimeout(resolve, 100));
            tentativas++;
        }
        
        if (!window.excelWriter) {
            throw new Error('Excel Writer não está disponível');
        }
    }

    mostrarSucesso(mensagem) {
        this.mostrarAlerta(mensagem, 'success');
    }

    mostrarErro(mensagem) {
        this.mostrarAlerta(mensagem, 'danger');
    }

    mostrarAlerta(mensagem, tipo) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
        alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alert.innerHTML = `
            ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alert);

        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 5000);
    }
}

// Inicializar quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.novosPedidos = new NovosPedidos();
});