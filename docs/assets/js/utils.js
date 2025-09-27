/**
 * Utilitários gerais para o sistema fotográfico
 * Funções auxiliares para formatação, validação e manipulação de dados
 */

class Utils {
    /**
     * Formatar data para exibição
     * @param {string|Date} date - Data para formatar
     * @param {string} format - Formato desejado ('short', 'long', 'datetime')
     * @returns {string} Data formatada
     */
    static formatDate(date, format = 'short') {
        if (!date) return '-';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '-';
        
        const options = {
            short: { day: '2-digit', month: '2-digit', year: 'numeric' },
            long: { day: '2-digit', month: 'long', year: 'numeric' },
            datetime: { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }
        };
        
        return d.toLocaleDateString('pt-BR', options[format] || options.short);
    }
    
    /**
     * Formatar valor monetário
     * @param {number} value - Valor para formatar
     * @returns {string} Valor formatado
     */
    static formatCurrency(value) {
        if (!value || isNaN(value)) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }
    
    /**
     * Obter badge de status com cor apropriada
     * @param {string} status - Status do item
     * @returns {string} HTML do badge
     */
    static getStatusBadge(status) {
        if (!status) return '<span class="badge bg-secondary">-</span>';
        
        const statusMap = {
            'novo': 'primary',
            'pendente': 'warning',
            'agendado': 'info',
            'confirmado': 'success',
            'realizado': 'success',
            'cancelado': 'danger',
            'em_edicao': 'warning',
            'editado': 'success',
            'faturado': 'dark'
        };
        
        const color = statusMap[status.toLowerCase()] || 'secondary';
        const text = status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
        
        return `<span class="badge bg-${color}">${text}</span>`;
    }
    
    /**
     * Obter ícone para tipo de solicitação
     * @param {string} tipo - Tipo da solicitação
     * @returns {string} Classe do ícone
     */
    static getTypeIcon(tipo) {
        const iconMap = {
            'residencial': 'fas fa-home',
            'comercial': 'fas fa-building',
            'terreno': 'fas fa-map',
            'apartamento': 'fas fa-building',
            'casa': 'fas fa-home',
            'loja': 'fas fa-store',
            'sala': 'fas fa-door-open'
        };
        
        return iconMap[tipo?.toLowerCase()] || 'fas fa-camera';
    }
    
    /**
     * Calcular diferença em dias entre duas datas
     * @param {string|Date} date1 - Data inicial
     * @param {string|Date} date2 - Data final (padrão: hoje)
     * @returns {number} Diferença em dias
     */
    static daysDifference(date1, date2 = new Date()) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        
        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
        
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    /**
     * Verificar se uma data está em atraso
     * @param {string|Date} date - Data para verificar
     * @returns {boolean} True se estiver em atraso
     */
    static isOverdue(date) {
        if (!date) return false;
        const d = new Date(date);
        return d < new Date() && d.toDateString() !== new Date().toDateString();
    }
    
    /**
     * Debounce para otimizar chamadas de função
     * @param {Function} func - Função para executar
     * @param {number} wait - Tempo de espera em ms
     * @returns {Function} Função com debounce
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * Sanitizar string para uso em HTML
     * @param {string} str - String para sanitizar
     * @returns {string} String sanitizada
     */
    static sanitizeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    
    /**
     * Gerar ID único
     * @returns {string} ID único
     */
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    /**
     * Validar email
     * @param {string} email - Email para validar
     * @returns {boolean} True se válido
     */
    static isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    /**
     * Validar telefone brasileiro
     * @param {string} phone - Telefone para validar
     * @returns {boolean} True se válido
     */
    static isValidPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10 && cleaned.length <= 11;
    }
    
    /**
     * Formatar telefone brasileiro
     * @param {string} phone - Telefone para formatar
     * @returns {string} Telefone formatado
     */
    static formatPhone(phone) {
        if (!phone) return '';
        const cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.length === 11) {
            return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (cleaned.length === 10) {
            return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        
        return phone;
    }
    
    /**
     * Copiar texto para clipboard
     * @param {string} text - Texto para copiar
     * @returns {Promise<boolean>} True se copiado com sucesso
     */
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback para navegadores mais antigos
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            return success;
        }
    }
    
    /**
     * Mostrar toast de notificação
     * @param {string} message - Mensagem para exibir
     * @param {string} type - Tipo da notificação ('success', 'error', 'warning', 'info')
     * @param {number} duration - Duração em ms (padrão: 3000)
     */
    static showToast(message, type = 'info', duration = 3000) {
        // Criar container de toasts se não existir
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'position-fixed top-0 end-0 p-3';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }
        
        // Criar toast
        const toastId = this.generateId();
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${this.sanitizeHtml(message)}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Inicializar e mostrar toast
        const bsToast = new bootstrap.Toast(toast, { delay: duration });
        bsToast.show();
        
        // Remover toast após ser ocultado
        toast.addEventListener('hidden.bs.toast', () => {
            container.removeChild(toast);
        });
    }
    
    /**
     * Mostrar modal de confirmação
     * @param {string} title - Título do modal
     * @param {string} message - Mensagem do modal
     * @param {string} confirmText - Texto do botão de confirmação
     * @param {string} cancelText - Texto do botão de cancelamento
     * @returns {Promise<boolean>} True se confirmado
     */
    static showConfirmModal(title, message, confirmText = 'Confirmar', cancelText = 'Cancelar') {
        return new Promise((resolve) => {
            const modalId = this.generateId();
            const modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${this.sanitizeHtml(title)}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>${this.sanitizeHtml(message)}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${cancelText}</button>
                            <button type="button" class="btn btn-primary" id="confirm-btn">${confirmText}</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            const bsModal = new bootstrap.Modal(modal);
            
            // Event listeners
            modal.querySelector('#confirm-btn').addEventListener('click', () => {
                bsModal.hide();
                resolve(true);
            });
            
            modal.addEventListener('hidden.bs.modal', () => {
                document.body.removeChild(modal);
                resolve(false);
            });
            
            bsModal.show();
        });
    }
    
    /**
     * Filtrar array de objetos por múltiplos critérios
     * @param {Array} data - Array de dados
     * @param {Object} filters - Objeto com filtros
     * @returns {Array} Dados filtrados
     */
    static filterData(data, filters) {
        if (!data || !Array.isArray(data)) return [];
        
        return data.filter(item => {
            return Object.entries(filters).every(([key, value]) => {
                if (!value || value === '') return true;
                
                const itemValue = item[key];
                if (!itemValue) return false;
                
                // Filtro de texto (busca parcial, case insensitive)
                if (typeof value === 'string') {
                    return itemValue.toString().toLowerCase().includes(value.toLowerCase());
                }
                
                // Filtro de array (item deve estar no array)
                if (Array.isArray(value)) {
                    return value.includes(itemValue);
                }
                
                // Filtro exato
                return itemValue === value;
            });
        });
    }
    
    /**
     * Ordenar array de objetos
     * @param {Array} data - Array de dados
     * @param {string} key - Chave para ordenação
     * @param {string} direction - Direção ('asc' ou 'desc')
     * @returns {Array} Dados ordenados
     */
    static sortData(data, key, direction = 'asc') {
        if (!data || !Array.isArray(data)) return [];
        
        return [...data].sort((a, b) => {
            let aVal = a[key];
            let bVal = b[key];
            
            // Tratar valores nulos/undefined
            if (aVal == null) aVal = '';
            if (bVal == null) bVal = '';
            
            // Ordenação numérica
            if (!isNaN(aVal) && !isNaN(bVal)) {
                aVal = parseFloat(aVal);
                bVal = parseFloat(bVal);
            }
            
            // Ordenação de datas
            if (aVal instanceof Date || bVal instanceof Date || 
                (typeof aVal === 'string' && aVal.match(/^\d{4}-\d{2}-\d{2}/))) {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            }
            
            if (direction === 'desc') {
                return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
            } else {
                return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            }
        });
    }
}

// Disponibilizar globalmente
window.Utils = Utils;