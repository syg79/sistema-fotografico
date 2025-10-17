// JavaScript específico para página de Novos Pedidos
class NovosPedidos {
    constructor() {
        this.formPedidoNormal = document.getElementById('formPedidoNormal');
        this.formEdicaoImagens = document.getElementById('formEdicaoImagens');
        this.btnPedidoNormal = document.getElementById('btnPedidoNormal');
        this.btnEdicaoImagens = document.getElementById('btnEdicaoImagens');
        this.api = null; // Usará googleSheetsAPI
        this.clientesList = [];
        this.clientesById = {};
        this.suppressRedeChange = false;
        
        this.init();
    }

    async init() {
        await this.waitForAPI();
        
        this.configurarEventos();
        await this.carregarDadosIniciais();
        this.configurarFormularios();
    }

    async waitForAPI() {
        return new Promise((resolve) => {
            const checkAPI = () => {
                if (window.googleSheetsAPI) {
                    this.api = window.googleSheetsAPI;
                    console.log('✅ Google Sheets API pronta.');
                    resolve();
                } else {
                    setTimeout(checkAPI, 100);
                }
            };
            checkAPI();
        });
    }

    configurarEventos() {
        // Alternância entre formulários
        this.btnPedidoNormal.addEventListener('click', () => this.mostrarFormulario('normal'));
        this.btnEdicaoImagens.addEventListener('click', () => this.mostrarFormulario('edicao'));

        // Eventos para rascunhos
        document.getElementById('btnSalvarRascunho').addEventListener('click', () => this.salvarRascunho());
        document.getElementById('btnCarregarRascunho').addEventListener('click', () => this.carregarRascunho());

        // Filtro de clientes por Rede
        const redeSelect = document.getElementById('rede');
        if (redeSelect) {
            redeSelect.addEventListener('change', () => {
                if (this.suppressRedeChange) return;
                this.preencherSelectClientes(redeSelect.value);
            });
        }
        // Preenchimento automático ao selecionar cliente
        const selectClienteNormal = document.getElementById('cliente');
        const selectClienteEdicao = document.getElementById('clienteEdicao');
        if (selectClienteNormal) {
            selectClienteNormal.addEventListener('change', () => this.handleClienteChange('cliente'));
        }
        if (selectClienteEdicao) {
            selectClienteEdicao.addEventListener('change', () => this.handleClienteChange('clienteEdicao'));
        }
    }

    mostrarFormulario(tipo) {
        if (tipo === 'normal') {
            this.formPedidoNormal.style.display = 'block';
            this.formEdicaoImagens.style.display = 'none';
            this.btnPedidoNormal.classList.add('active');
            this.btnEdicaoImagens.classList.remove('active');
        } else {
            this.formPedidoNormal.style.display = 'none';
            this.formEdicaoImagens.style.display = 'block';
            this.btnPedidoNormal.classList.remove('active');
            this.btnEdicaoImagens.classList.add('active');
        }
    }

    async carregarDadosIniciais() {
        try {
            console.log('📊 Carregando dados para novos pedidos...');
            this.mostrarLoadingDropdowns(true);
            
            await this.carregarClientes();
            // Outras chamadas de carregamento podem ser adicionadas aqui (corretores, etc.)
            
            console.log('✅ Dados carregados com sucesso');
        } catch (error) {
            console.error('❌ Erro ao carregar dados iniciais:', error);
            this.mostrarAlerta('Erro ao carregar dados do sistema', 'danger');
        } finally {
            this.mostrarLoadingDropdowns(false);
        }
    }

    async carregarClientes() {
        try {
            let clientes;
            try {
                clientes = await this.api.getClientes();
            } catch (errorApi) {
                console.warn('⚠️ Erro ao carregar clientes via API, tentando CSV local...', errorApi);
                try {
                    // Fallback absoluto para CSV estático
                    clientes = await this.api.loadStaticCSV(CONFIG.GOOGLE_SHEETS.SHEETS.CLIENTES);
                     this.mostrarAlerta('Carregado clientes via CSV local devido a erro na API.', 'warning');
                } catch (errorCsv) {
                    throw errorCsv;
                }
            }
            // Armazenar lista e índice
            this.clientesList = clientes || [];
            this.clientesById = {};
            this.clientesList.forEach(cliente => {
                const nome = cliente['Nome Cliente'] || cliente['Nome'] || cliente['Nome Empresa'] || cliente['Empresa'] || cliente['Cliente'] || '';
                const id = cliente['Record ID'] || cliente['ID Cliente'] || cliente['ID'] || nome;
                if (id) this.clientesById[id] = cliente;
            });
            // Popular selects com possível filtro inicial de Rede
            const redeAtual = (document.getElementById('rede')?.value || '').trim();
            this.preencherSelectClientes(redeAtual);
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
            this.mostrarAlerta('Erro ao carregar a lista de clientes.', 'danger');
        }
    }
    
    mostrarLoadingDropdowns(loading) {
        const selects = ['#cliente', '#clienteEdicao', '#corretor'];
        selects.forEach(selector => {
            const el = document.querySelector(selector);
            if (el) {
                if (loading) {
                    el.innerHTML = '<option value="">Carregando...</option>';
                    el.disabled = true;
                } else {
                    el.disabled = false;
                }
            }
        });
    }

    // Popula selects de clientes, aplicando filtro pela Rede dentro da classe
    preencherSelectClientes(redeFiltro = '') {
        const selects = [document.getElementById('cliente'), document.getElementById('clienteEdicao')];
        const normalize = (s) => (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
        const filtro = normalize(redeFiltro);
        selects.forEach(select => {
            if (!select) return;
            const selectedBefore = select.value;
            select.innerHTML = '<option value="">Selecione um cliente</option>';
            let added = 0;
            this.clientesList.forEach(cliente => {
                const nome = cliente['Nome Cliente'] || cliente['Nome'] || cliente['Nome Empresa'] || cliente['Empresa'] || cliente['Cliente'] || '';
                const id = cliente['Record ID'] || cliente['ID Cliente'] || cliente['ID'] || nome;
                const rede = cliente['Rede'] || '';
                const passes = !filtro || normalize(rede) === filtro;
                if (nome && passes) {
                    const option = document.createElement('option');
                    option.value = id;
                    option.textContent = nome;
                    option.dataset.rede = rede;
                    select.appendChild(option);
                    added++;
                }
            });
            if (selectedBefore) {
                select.value = selectedBefore;
            }
            if (added === 0) {
                const msg = filtro ? `Nenhum cliente encontrado para a rede \"${redeFiltro}\".` : 'Nenhum cliente encontrado.';
                console.warn(msg);
            }
            select.disabled = false;
        });
    }

    configurarFormularios() {
        const form = document.getElementById('formNovoPedido');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Funcionalidade de criar pedido ainda não implementada.');
        });
        // Configuração similar para o outro formulário se necessário
    }

    salvarRascunho() {
        const form = document.getElementById('formNovoPedido');
        const formData = new FormData(form);
        const dados = Object.fromEntries(formData.entries());
        
        localStorage.setItem('rascunho_novo_pedido', JSON.stringify(dados));
        this.mostrarAlerta('Rascunho salvo com sucesso!', 'success');
    }

    carregarRascunho() {
        const rascunho = localStorage.getItem('rascunho_novo_pedido');
        
        if (!rascunho) {
            this.mostrarAlerta('Nenhum rascunho encontrado', 'info');
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

        this.mostrarAlerta('Rascunho carregado com sucesso!', 'success');
    }

    mostrarAlerta(mensagem, tipo) {
        const alertContainer = document.body;
        const alert = document.createElement('div');
        alert.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
        alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alert.innerHTML = `
            ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        alertContainer.appendChild(alert);

        setTimeout(() => {
            const alertInstance = bootstrap.Alert.getOrCreateInstance(alert);
            if (alertInstance) {
                alertInstance.close();
            }
        }, 5000);
    }

    // ===== Auto preenchimento baseado no cliente selecionado =====
    handleClienteChange(selectId) {
        try {
            const select = document.getElementById(selectId);
            if (!select) return;
            const selectedId = select.value;
            if (!selectedId) return;
            const cliente = this.clientesById[selectedId];
            if (!cliente) {
                console.warn('Cliente não encontrado pelo ID selecionado:', selectedId);
                return;
            }
            // Preencher Rede no formulário de Pedido Normal e repopular clientes conforme Rede, sem loop
            const redeValue = (cliente['Rede'] || '').trim();
            const redeSelect = document.getElementById('rede');
            if (redeSelect && redeValue) {
                const exists = Array.from(redeSelect.options).some(opt => opt.value === redeValue);
                this.suppressRedeChange = true;
                if (exists) {
                    redeSelect.value = redeValue;
                }
                // Repopular clientes para refletir o filtro de Rede e manter seleção atual
                this.preencherSelectClientes(redeSelect.value);
                // Liberar o supressor após o microtask
                setTimeout(() => { this.suppressRedeChange = false; }, 0);
            }
            // Preencher endereço, CEP e bairro com parsing robusto
            const parsed = this.parseEnderecoCliente(cliente);
            if (selectId === 'cliente') {
                const enderecoEl = document.getElementById('endereco');
                const cepEl = document.getElementById('cep');
                const bairroEl = document.getElementById('bairro');
                if (enderecoEl && parsed.street) enderecoEl.value = parsed.street;
                if (cepEl && parsed.cep) cepEl.value = parsed.cep;
                if (bairroEl && parsed.bairro) bairroEl.value = parsed.bairro;
                // também preencher referência se disponível
                const referenciaClienteEl = document.getElementById('referenciaCliente');
                if (referenciaClienteEl) {
                    referenciaClienteEl.value = cliente['Ref'] || cliente['Referência'] || cliente['Referencia'] || '';
                }
            } else if (selectId === 'clienteEdicao') {
                const enderecoEdicaoEl = document.getElementById('enderecoEdicao');
                const referenciaEl = document.getElementById('referenciaEdicao');
                if (enderecoEdicaoEl && parsed.street) enderecoEdicaoEl.value = parsed.street;
                if (referenciaEl) {
                    referenciaEl.value = cliente['Ref'] || cliente['Referência'] || cliente['Referencia'] || '';
                }
            }
        } catch (error) {
            console.error('Erro ao processar mudança de cliente:', error);
        }
    }

    parseEnderecoCliente(cliente) {
        // Tentar múltiplas fontes de endereço para máxima compatibilidade
        let raw = (
            cliente['Endereço Loja (Cliente)'] ||
            cliente['Endereco Loja (Cliente)'] ||
            cliente['Endereço'] ||
            cliente['Endereco'] ||
            cliente['Dados Empresa'] ||
            cliente['Observação Cliente'] ||
            cliente['Observacao Cliente'] ||
            ''
        ).toString().trim();
        if (!raw) return { street: '', cep: '', bairro: '' };

        // Normalizar espaços e remover rótulos comuns
        raw = raw.replace(/\s+/g, ' ').replace(/CEP\s*:/i, 'CEP ');

        // Extrair CEP nos formatos 00000-000 ou com prefixo CEP
        const cepMatch = raw.match(/\b\d{5}-\d{3}\b/) || raw.match(/\bCEP\s*(\d{5}-\d{3})\b/i);
        const cep = Array.isArray(cepMatch) ? (cepMatch[1] || cepMatch[0]) : (cepMatch || '');

        // Remover CEP do texto para obter o logradouro bruto
        let withoutCep = raw;
        if (cep) {
            withoutCep = withoutCep.replace(cep, '').replace(/CEP\s*/i, '').trim();
        }

        // Heurísticas para extrair bairro
        let bairro = '';
        // Padrão: " - Bairro - Cidade" (ex: fundos - Cabral - Curitiba / PR)
        const bairroDash = withoutCep.match(/-\s*([^\-\n]+?)\s*-\s*[^\-\n]+/);
        if (bairroDash) {
            bairro = bairroDash[1].trim();
        } else {
            // Padrão: partes separadas por vírgula: Rua, complemento, Bairro
            const parts = withoutCep.split(',').map(p => p.trim()).filter(Boolean);
            if (parts.length >= 2) {
                const candidate = parts[1];
                // Evitar números "123" como bairro
                if (!/\d{2,}/.test(candidate)) {
                    bairro = candidate;
                }
            }
        }

        // Extrair logradouro (primeira parte antes de complemento/bairro)
        let street = withoutCep;
        // Se existir vírgula, primeira parte é o logradouro
        if (withoutCep.includes(',')) {
            street = withoutCep.split(',')[0].trim();
        } else if (withoutCep.includes(' - ')) {
            street = withoutCep.split(' - ')[0].trim();
        }

        // Limpeza final de pontuação duplicada
        street = street.replace(/\s*,\s*/g, ', ').replace(/,\s*$/, '').trim();

        return { street, cep: typeof cep === 'string' ? cep : '', bairro };
    }
}

// Inicializar quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.novosPedidos = new NovosPedidos();
});
