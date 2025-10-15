// JavaScript específico para página de Novos Pedidos
class NovosPedidos {
    constructor() {
        this.formPedidoNormal = document.getElementById('formPedidoNormal');
        this.formEdicaoImagens = document.getElementById('formEdicaoImagens');
        this.btnPedidoNormal = document.getElementById('btnPedidoNormal');
        this.btnEdicaoImagens = document.getElementById('btnEdicaoImagens');
        this.api = null; // Usará googleSheetsAPI
        
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
            const clientes = await this.api.getClientes();
            const selects = [document.getElementById('cliente'), document.getElementById('clienteEdicao')];
            
            selects.forEach(selectCliente => {
                if (selectCliente) {
                    selectCliente.innerHTML = '<option value="">Selecione um cliente</option>';
                    
                    clientes.forEach(cliente => {
                        const nome = cliente['Nome Cliente'] || cliente['Nome'] || '';
                        const id = cliente['Record ID'] || cliente['ID'] || nome;
                        if (nome) {
                            const option = document.createElement('option');
                            option.value = id;
                            option.textContent = nome;
                            option.dataset.rede = cliente['Rede'] || '';
                            selectCliente.appendChild(option);
                        }
                    });
                }
            });
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
}

// Aguardar todas as dependências estarem disponíveis
document.addEventListener('DOMContentLoaded', () => {
    const waitForDependencies = () => {
        if (typeof window.CONFIG !== 'undefined' && 
            window.googleSheetsAPI && 
            window.sistemaFotografico) {
            
            // Inicializar página de novos pedidos
            if (!window.novosPedidos) {
                window.novosPedidos = new NovosPedidos();
                window.novosPedidos.init().catch(error => {
                    console.warn('⚠️ Erro ao inicializar novos pedidos:', error);
                });
            }
        } else {
            setTimeout(waitForDependencies, 100);
        }
    };
    waitForDependencies();
});