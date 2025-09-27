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
                // Prioriza CSV Loader se disponível, senão usa Excel Integration
                if (window.csvLoader && window.csvLoader.isDataLoaded()) {
                    this.integration = window.csvLoader;
                    console.log('✅ Usando CSV Loader como fonte de dados');
                    resolve();
                } else if (window.excelIntegration && window.excelIntegration.cache.size > 0) {
                    this.integration = window.excelIntegration;
                    console.log('✅ Usando Excel Integration como fonte de dados');
                    resolve();
                } else {
                    setTimeout(checkIntegration, 100);
                }
            };
            checkIntegration();
        });
    }

    setupEventListeners() {
        // Botão de atualização
        const btnAtualizar = document.getElementById('btnAtualizar');
        if (btnAtualizar) {
            btnAtualizar.addEventListener('click', () => this.forceRefresh());
        }

        // Cards de navegação
        document.querySelectorAll('.card[data-page]').forEach(card => {
            card.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.navigateToPage(page);
            });
        });

        // Links de navegação
        document.querySelectorAll('a[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.dataset.page;
                this.navigateToPage(page);
            });
        });
    }

    async loadDashboardData() {
        try {
            this.showLoading(true);
            
            // Verificar se está usando CSV Loader ou Excel Integration
            if (this.integration === window.csvLoader) {
                // Usar métodos do CSV Loader
                const stats = this.integration.getStatistics();
                this.updateStatistics(stats);
                
                const recentData = this.integration.getRecentData(10);
                this.updateRecentActivities(recentData);
            } else {
                // Usar métodos do Excel Integration (fallback)
                const stats = await this.integration.getEstatisticas();
                this.updateStatistics(stats);
                
                const recentData = await this.loadRecentData();
                this.updateRecentActivities(recentData);
            }
            
            this.showLoading(false);
        } catch (error) {
            console.error('Erro ao carregar dados do dashboard:', error);
            this.showError('Erro ao carregar dados do sistema');
            this.showLoading(false);
        }
    }

    async loadRecentData() {
        try {
            // Últimas solicitações
            const solicitacoes = await this.integration.getSolicitacoes();
            const recent = solicitacoes
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 10);

            // Agendamentos de hoje
            const hoje = new Date().toISOString().split('T')[0];
            const agendamentosHoje = solicitacoes.filter(s => 
                s.dataAgendamento === hoje && s.status === 'agendado'
            );

            return {
                recent,
                agendamentosHoje
            };
        } catch (error) {
            console.error('Erro ao carregar dados recentes:', error);
            return { recent: [], agendamentosHoje: [] };
        }
    }

    updateStatistics(stats) {
        // Atualizar cards de estatísticas
        this.updateStatCard('total-pedidos', stats.total);
        this.updateStatCard('agendados-hoje', stats.hoje);
        this.updateStatCard('realizados-mes', stats.realizados);
        this.updateStatCard('pendentes', stats.pendentes);

        // Atualizar gráficos se existirem
        this.updateCharts(stats);
    }

    updateStatCard(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            const numberElement = element.querySelector('.stat-number') || element;
            numberElement.textContent = this.formatNumber(value);
            
            // Animação de contagem
            this.animateNumber(numberElement, value);
        }
    }

    updateRecentActivities(data) {
        const container = document.getElementById('recentActivities');
        if (!container) return;

        let activities = [];
        
        // Adaptar dados baseado na fonte (CSV Loader ou Excel Integration)
        if (this.integration === window.csvLoader) {
            activities = data.recentSolicitacoes || [];
        } else {
            activities = data.recent || [];
        }

        if (activities.length === 0) {
            container.innerHTML = '<p class="text-muted">Nenhuma atividade recente encontrada.</p>';
            return;
        }

        const html = activities.map(item => {
            // Adaptar campos baseado na estrutura dos dados
            const cliente = item['Nome Cliente'] || item.cliente || 'Cliente não informado';
            const status = item.Status || item.status || 'Pendente';
            const data = item['Data/Hora inclusao'] || item.createdAt || new Date().toISOString();
            const tipo = item['Tipo do Servico'] || item.tipo || 'Serviço';
            
            return `
                <div class="activity-item d-flex align-items-center mb-3">
                    <div class="activity-icon me-3">
                        <i class="fas fa-camera text-primary"></i>
                    </div>
                    <div class="activity-content flex-grow-1">
                        <div class="activity-title fw-bold">${cliente}</div>
                        <div class="activity-description text-muted small">
                            ${tipo} - <span class="badge bg-${this.getStatusColor(status)}">${this.getStatusText(status)}</span>
                        </div>
                        <div class="activity-time text-muted small">
                            <i class="fas fa-clock"></i> ${this.formatDateTime(data)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;

        // Atualizar agendamentos de hoje
        const todayList = document.getElementById('today-appointments');
        if (todayList && data.agendamentosHoje) {
            todayList.innerHTML = data.agendamentosHoje.map(item => `
                <div class="appointment-item">
                    <div class="appointment-time">${this.integration.formatTime(item.horarioSessao)}</div>
                    <div class="appointment-details">
                        <div class="appointment-client">${item.cliente}</div>
                        <div class="appointment-address">${item.endereco}</div>
                        <div class="appointment-photographer">
                            <i class="fas fa-user"></i> ${item.fotografo}
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    updateCharts(stats) {
        // Implementar gráficos se necessário
        console.log('Atualizando gráficos com:', stats);
    }

    setupAutoRefresh() {
        // Atualizar dados a cada 5 minutos
        setInterval(async () => {
            try {
                await this.loadDashboardData();
                console.log('📊 Dados atualizados automaticamente');
            } catch (error) {
                console.error('Erro na atualização automática:', error);
            }
        }, 5 * 60 * 1000);
    }

    async forceRefresh() {
        try {
            this.showLoading(true);
            await this.integration.forceRefresh();
            await this.loadDashboardData();
            this.showSuccess('Dados atualizados com sucesso!');
        } catch (error) {
            console.error('Erro ao forçar atualização:', error);
            this.showError('Erro ao atualizar dados');
        } finally {
            this.showLoading(false);
        }
    }

    navigateToPage(page) {
        const pages = {
            'novos-pedidos': 'novos-pedidos.html',
            'pendentes': 'pendentes.html',
            'agendamentos': 'agendamentos.html',
            'agendamentos-publico': 'agendamentos-publico.html',
            'registro': 'registro.html',
            'conferencia': 'conferencia.html',
            'realizados': 'realizados.html'
        };

        if (pages[page]) {
            window.location.href = pages[page];
        }
    }

    // ==================== MÉTODOS UTILITÁRIOS ====================

    animateNumber(element, finalValue) {
        const startValue = 0;
        const duration = 1000;
        const increment = finalValue / (duration / 16);
        let currentValue = startValue;

        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= finalValue) {
                currentValue = finalValue;
                clearInterval(timer);
            }
            element.textContent = Math.floor(currentValue);
        }, 16);
    }

    formatNumber(number) {
        return new Intl.NumberFormat('pt-BR').format(number);
    }

    formatDateTime(dateString) {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleString('pt-BR');
        } catch (error) {
            return dateString;
        }
    }

    getStatusColor(status) {
        const colors = {
            'agendado': 'primary',
            'realizado': 'success',
            'cancelado': 'danger',
            'pendente': 'warning',
            'em_andamento': 'info',
            'conferido': 'success'
        };
        return colors[status] || 'secondary';
    }

    getStatusText(status) {
        const texts = {
            'agendado': 'Agendado',
            'realizado': 'Realizado',
            'cancelado': 'Cancelado',
            'pendente': 'Pendente',
            'em_andamento': 'Em Andamento',
            'conferido': 'Conferido'
        };
        return texts[status] || status;
    }

    showLoading(show) {
        const loader = document.getElementById('loading');
        if (loader) {
            loader.style.display = show ? 'block' : 'none';
        }
    }

    showSuccess(message) {
        this.showAlert(message, 'success');
    }

    showError(message) {
        this.showAlert(message, 'danger');
    }

    showAlert(message, type) {
        // Criar elemento de alerta
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alert);

        // Remover após 5 segundos
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 5000);
    }

    // Método para debug - mostrar status da integração
    showIntegrationStatus() {
        if (this.integration) {
            const status = this.integration.getStatus();
            console.table(status);
            return status;
        }
        return null;
    }
}

// Utilitários globais
window.SistemaUtils = {
    mascaraTelefone(input) {
        let value = input.value.replace(/\D/g, '');
        value = value.replace(/(\d{2})(\d)/, '($1) $2');
        value = value.replace(/(\d{5})(\d)/, '$1-$2');
        input.value = value;
    },

    mascaraCEP(input) {
        let value = input.value.replace(/\D/g, '');
        value = value.replace(/(\d{5})(\d)/, '$1-$2');
        input.value = value;
    },

    validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    async buscarCEP(cep) {
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
            return null;
        }
    }
};

// Inicializar sistema quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um pouco para garantir que a integração Excel foi carregada
    setTimeout(() => {
        window.sistemaFotografico = new SistemaFotografico();
    }, 500);
});

// Exportar classe para uso global
window.SistemaFotografico = SistemaFotografico;