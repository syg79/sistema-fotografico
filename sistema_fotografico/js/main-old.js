/**
 * Sistema Fotográfico - Dashboard Principal
 * Gerencia a navegação e estatísticas gerais do sistema
 * Integrado com arquivos Excel/CSV locais
 */

class SistemaFotografico {
    constructor() {
        this.currentUser = null;
        this.integration = null;
        
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando Sistema Fotográfico...');
        
        // Aguardar integração Excel estar disponível
        await this.waitForIntegration();
        
        // Configurar eventos
        this.setupEventListeners();
        
        // Carregar dados iniciais
        await this.loadDashboardData();
        
        // Configurar atualização automática
        this.setupAutoRefresh();
        
        console.log('✅ Sistema Fotográfico inicializado com sucesso');
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

    // Carregar configurações do ambiente
    async carregarConfiguracoes() {
        try {
            // Em produção, isso viria de um endpoint seguro
            // Por enquanto, usar dados locais ou configuração manual
            console.log('Carregando configurações...');
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        }
    }

    // Carregar estatísticas para o dashboard
    async carregarEstatisticas() {
        try {
            // Simular dados por enquanto - depois integrar com API real
            const stats = {
                pendentes: 15,
                agendados: 8,
                emAndamento: 5,
                realizados: 142
            };

            this.atualizarEstatisticas(stats);
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
            this.mostrarErro('Erro ao carregar estatísticas do sistema');
        }
    }

    // Atualizar elementos de estatísticas na página
    atualizarEstatisticas(stats) {
        const elementos = {
            'stat-pendentes': stats.pendentes,
            'stat-agendados': stats.agendados,
            'stat-em-andamento': stats.emAndamento,
            'stat-realizados': stats.realizados
        };

        Object.entries(elementos).forEach(([id, valor]) => {
            const elemento = document.getElementById(id);
            if (elemento) {
                this.animarNumero(elemento, valor);
            }
        });
    }

    // Animar números nas estatísticas
    animarNumero(elemento, valorFinal) {
        const valorInicial = 0;
        const duracao = 1000;
        const incremento = valorFinal / (duracao / 16);
        let valorAtual = valorInicial;

        const timer = setInterval(() => {
            valorAtual += incremento;
            if (valorAtual >= valorFinal) {
                valorAtual = valorFinal;
                clearInterval(timer);
            }
            elemento.textContent = Math.floor(valorAtual);
        }, 16);
    }

    // Configurar eventos globais
    configurarEventos() {
        // Evento para formulários
        document.addEventListener('submit', (e) => {
            if (e.target.classList.contains('form-sistema')) {
                e.preventDefault();
                this.processarFormulario(e.target);
            }
        });

        // Evento para botões de ação
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-acao')) {
                this.processarAcao(e.target);
            }
        });

        // Auto-save para formulários
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('auto-save')) {
                this.debounce(() => this.salvarRascunho(e.target), 1000)();
            }
        });
    }

    // Aplicar animações de entrada
    aplicarAnimacoes() {
        const elementos = document.querySelectorAll('.hover-card, .stat-card');
        elementos.forEach((elemento, index) => {
            elemento.style.animationDelay = `${index * 0.1}s`;
            elemento.classList.add('fade-in');
        });
    }

    // Processar formulários do sistema
    async processarFormulario(form) {
        const formData = new FormData(form);
        const dados = Object.fromEntries(formData.entries());
        
        this.mostrarLoading(form);
        
        try {
            const resultado = await this.enviarDados(dados, form.dataset.endpoint);
            this.mostrarSucesso('Dados salvos com sucesso!');
            
            // Redirecionar se especificado
            if (form.dataset.redirect) {
                setTimeout(() => {
                    window.location.href = form.dataset.redirect;
                }, 1500);
            }
        } catch (error) {
            console.error('Erro ao processar formulário:', error);
            this.mostrarErro('Erro ao salvar dados. Tente novamente.');
        } finally {
            this.ocultarLoading(form);
        }
    }

    // Enviar dados para API
    async enviarDados(dados, endpoint) {
        const response = await fetch(`${this.apiUrl}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(dados)
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        return await response.json();
    }

    // Buscar dados da API
    async buscarDados(endpoint, filtros = {}) {
        const params = new URLSearchParams(filtros);
        const response = await fetch(`${this.apiUrl}/${endpoint}?${params}`, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            }
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        return await response.json();
    }

    // Salvar rascunho automaticamente
    salvarRascunho(elemento) {
        const form = elemento.closest('form');
        if (!form) return;

        const formData = new FormData(form);
        const dados = Object.fromEntries(formData.entries());
        const chave = `rascunho_${form.id || 'form'}`;
        
        localStorage.setItem(chave, JSON.stringify(dados));
        this.mostrarInfo('Rascunho salvo automaticamente', 2000);
    }

    // Carregar rascunho salvo
    carregarRascunho(formId) {
        const chave = `rascunho_${formId}`;
        const dados = localStorage.getItem(chave);
        
        if (dados) {
            const dadosObj = JSON.parse(dados);
            Object.entries(dadosObj).forEach(([nome, valor]) => {
                const campo = document.querySelector(`[name="${nome}"]`);
                if (campo) {
                    campo.value = valor;
                }
            });
            this.mostrarInfo('Rascunho carregado');
        }
    }

    // Limpar rascunho
    limparRascunho(formId) {
        const chave = `rascunho_${formId}`;
        localStorage.removeItem(chave);
    }

    // Validar formulário
    validarFormulario(form) {
        const camposObrigatorios = form.querySelectorAll('[required]');
        let valido = true;

        camposObrigatorios.forEach(campo => {
            if (!campo.value.trim()) {
                this.marcarCampoInvalido(campo);
                valido = false;
            } else {
                this.marcarCampoValido(campo);
            }
        });

        return valido;
    }

    // Marcar campo como inválido
    marcarCampoInvalido(campo) {
        campo.classList.add('is-invalid');
        campo.classList.remove('is-valid');
    }

    // Marcar campo como válido
    marcarCampoValido(campo) {
        campo.classList.add('is-valid');
        campo.classList.remove('is-invalid');
    }

    // Mostrar loading
    mostrarLoading(elemento) {
        const botao = elemento.querySelector('button[type="submit"]');
        if (botao) {
            botao.disabled = true;
            botao.innerHTML = '<span class="loading-spinner"></span> Salvando...';
        }
    }

    // Ocultar loading
    ocultarLoading(elemento) {
        const botao = elemento.querySelector('button[type="submit"]');
        if (botao) {
            botao.disabled = false;
            botao.innerHTML = botao.dataset.originalText || 'Salvar';
        }
    }

    // Mostrar mensagem de sucesso
    mostrarSucesso(mensagem, duracao = 5000) {
        this.mostrarAlerta(mensagem, 'success', duracao);
    }

    // Mostrar mensagem de erro
    mostrarErro(mensagem, duracao = 5000) {
        this.mostrarAlerta(mensagem, 'danger', duracao);
    }

    // Mostrar mensagem de informação
    mostrarInfo(mensagem, duracao = 3000) {
        this.mostrarAlerta(mensagem, 'info', duracao);
    }

    // Mostrar alerta genérico
    mostrarAlerta(mensagem, tipo, duracao) {
        const alerta = document.createElement('div');
        alerta.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
        alerta.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alerta.innerHTML = `
            ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alerta);

        // Auto-remover após duração especificada
        setTimeout(() => {
            if (alerta.parentNode) {
                alerta.remove();
            }
        }, duracao);
    }

    // Debounce para otimizar eventos
    debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // Formatar data para exibição
    formatarData(data, formato = 'dd/mm/yyyy') {
        if (!data) return '';
        
        const d = new Date(data);
        const dia = String(d.getDate()).padStart(2, '0');
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const ano = d.getFullYear();
        
        switch (formato) {
            case 'dd/mm/yyyy':
                return `${dia}/${mes}/${ano}`;
            case 'yyyy-mm-dd':
                return `${ano}-${mes}-${dia}`;
            default:
                return d.toLocaleDateString('pt-BR');
        }
    }

    // Formatar moeda
    formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    }

    // Gerar ID único
    gerarId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Exportar dados para CSV
    exportarCSV(dados, nomeArquivo) {
        if (!dados.length) {
            this.mostrarErro('Nenhum dado para exportar');
            return;
        }

        const cabecalhos = Object.keys(dados[0]);
        const csv = [
            cabecalhos.join(','),
            ...dados.map(linha => 
                cabecalhos.map(campo => 
                    `"${String(linha[campo] || '').replace(/"/g, '""')}"`
                ).join(',')
            )
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${nomeArquivo}.csv`;
        link.click();
    }

    // Imprimir página
    imprimir() {
        window.print();
    }
}

// Utilitários globais
window.SistemaUtils = {
    // Máscara para telefone
    mascaraTelefone(input) {
        let valor = input.value.replace(/\D/g, '');
        valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2');
        valor = valor.replace(/(\d)(\d{4})$/, '$1-$2');
        input.value = valor;
    },

    // Máscara para CEP
    mascaraCEP(input) {
        let valor = input.value.replace(/\D/g, '');
        valor = valor.replace(/^(\d{5})(\d)/, '$1-$2');
        input.value = valor;
    },

    // Validar email
    validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    // Buscar CEP
    async buscarCEP(cep) {
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const dados = await response.json();
            return dados.erro ? null : dados;
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
            return null;
        }
    }
};

// Inicializar sistema quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.sistema = new SistemaFotografico();
    
    // Configurar máscaras automáticas
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('mask-phone')) {
            SistemaUtils.mascaraTelefone(e.target);
        }
        if (e.target.classList.contains('mask-cep')) {
            SistemaUtils.mascaraCEP(e.target);
        }
    });
});

// Exportar para uso global
window.SistemaFotografico = SistemaFotografico;