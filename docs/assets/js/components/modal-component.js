/**
 * Componente de modal reutilizável para formulários e visualizações detalhadas
 */

class ModalComponent {
    constructor(options = {}) {
        this.options = {
            id: Utils.generateId(),
            title: 'Modal',
            size: 'lg', // sm, lg, xl
            backdrop: true,
            keyboard: true,
            focus: true,
            show: false,
            ...options
        };
        
        this.modal = null;
        this.bsModal = null;
        this.isVisible = false;
        
        this.init();
    }
    
    init() {
        this.createModal();
        this.attachEventListeners();
    }
    
    createModal() {
        // Remover modal existente se houver
        const existingModal = document.getElementById(this.options.id);
        if (existingModal) {
            existingModal.remove();
        }
        
        this.modal = document.createElement('div');
        this.modal.id = this.options.id;
        this.modal.className = 'modal fade';
        this.modal.setAttribute('tabindex', '-1');
        this.modal.setAttribute('aria-labelledby', `${this.options.id}-title`);
        this.modal.setAttribute('aria-hidden', 'true');
        
        if (!this.options.backdrop) {
            this.modal.setAttribute('data-bs-backdrop', 'static');
        }
        
        if (!this.options.keyboard) {
            this.modal.setAttribute('data-bs-keyboard', 'false');
        }
        
        this.modal.innerHTML = this.getModalHTML();
        document.body.appendChild(this.modal);
        
        // Inicializar Bootstrap Modal
        this.bsModal = new bootstrap.Modal(this.modal, {
            backdrop: this.options.backdrop,
            keyboard: this.options.keyboard,
            focus: this.options.focus
        });
    }
    
    getModalHTML() {
        return `
            <div class="modal-dialog modal-${this.options.size}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="${this.options.id}-title">${this.options.title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                    </div>
                    <div class="modal-body">
                        <div class="modal-loading d-none">
                            <div class="text-center p-4">
                                <div class="spinner-border" role="status">
                                    <span class="visually-hidden">Carregando...</span>
                                </div>
                                <p class="mt-2">Carregando...</p>
                            </div>
                        </div>
                        <div class="modal-content-body">
                            <!-- Conteúdo será inserido aqui -->
                        </div>
                    </div>
                    <div class="modal-footer">
                        <!-- Botões serão inseridos aqui -->
                    </div>
                </div>
            </div>
        `;
    }
    
    attachEventListeners() {
        this.modal.addEventListener('shown.bs.modal', () => {
            this.isVisible = true;
            if (this.options.onShow && typeof this.options.onShow === 'function') {
                this.options.onShow(this);
            }
        });
        
        this.modal.addEventListener('hidden.bs.modal', () => {
            this.isVisible = false;
            if (this.options.onHide && typeof this.options.onHide === 'function') {
                this.options.onHide(this);
            }
        });
        
        this.modal.addEventListener('hide.bs.modal', (e) => {
            if (this.options.onBeforeHide && typeof this.options.onBeforeHide === 'function') {
                const result = this.options.onBeforeHide(this);
                if (result === false) {
                    e.preventDefault();
                }
            }
        });
    }
    
    // Métodos públicos
    show() {
        if (this.bsModal) {
            this.bsModal.show();
        }
        return this;
    }
    
    hide() {
        if (this.bsModal) {
            this.bsModal.hide();
        }
        return this;
    }
    
    toggle() {
        if (this.bsModal) {
            this.bsModal.toggle();
        }
        return this;
    }
    
    setTitle(title) {
        const titleElement = this.modal.querySelector('.modal-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
        return this;
    }
    
    setContent(content) {
        const contentBody = this.modal.querySelector('.modal-content-body');
        if (contentBody) {
            if (typeof content === 'string') {
                contentBody.innerHTML = content;
            } else if (content instanceof HTMLElement) {
                contentBody.innerHTML = '';
                contentBody.appendChild(content);
            }
        }
        return this;
    }
    
    setFooter(buttons) {
        const footer = this.modal.querySelector('.modal-footer');
        if (footer) {
            footer.innerHTML = '';
            
            if (Array.isArray(buttons)) {
                buttons.forEach(button => {
                    const btn = this.createButton(button);
                    footer.appendChild(btn);
                });
            } else if (typeof buttons === 'string') {
                footer.innerHTML = buttons;
            }
        }
        return this;
    }
    
    createButton(buttonConfig) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `btn btn-${buttonConfig.variant || 'primary'}`;
        button.textContent = buttonConfig.text || 'Button';
        
        if (buttonConfig.id) {
            button.id = buttonConfig.id;
        }
        
        if (buttonConfig.disabled) {
            button.disabled = true;
        }
        
        if (buttonConfig.dismiss) {
            button.setAttribute('data-bs-dismiss', 'modal');
        }
        
        if (buttonConfig.onClick && typeof buttonConfig.onClick === 'function') {
            button.addEventListener('click', (e) => {
                buttonConfig.onClick(e, this);
            });
        }
        
        return button;
    }
    
    showLoading() {
        const loading = this.modal.querySelector('.modal-loading');
        const content = this.modal.querySelector('.modal-content-body');
        
        if (loading && content) {
            loading.classList.remove('d-none');
            content.classList.add('d-none');
        }
        return this;
    }
    
    hideLoading() {
        const loading = this.modal.querySelector('.modal-loading');
        const content = this.modal.querySelector('.modal-content-body');
        
        if (loading && content) {
            loading.classList.add('d-none');
            content.classList.remove('d-none');
        }
        return this;
    }
    
    destroy() {
        if (this.bsModal) {
            this.bsModal.dispose();
        }
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
    }
    
    // Métodos estáticos para modais comuns
    static showAlert(title, message, variant = 'info') {
        const modal = new ModalComponent({
            title: title,
            size: 'sm'
        });
        
        const iconMap = {
            success: 'fas fa-check-circle text-success',
            error: 'fas fa-exclamation-circle text-danger',
            warning: 'fas fa-exclamation-triangle text-warning',
            info: 'fas fa-info-circle text-info'
        };
        
        const icon = iconMap[variant] || iconMap.info;
        
        modal.setContent(`
            <div class="text-center">
                <i class="${icon} fa-3x mb-3"></i>
                <p>${Utils.sanitizeHtml(message)}</p>
            </div>
        `);
        
        modal.setFooter([
            {
                text: 'OK',
                variant: 'primary',
                dismiss: true
            }
        ]);
        
        modal.show();
        return modal;
    }
    
    static showConfirm(title, message, onConfirm, onCancel) {
        const modal = new ModalComponent({
            title: title,
            size: 'sm'
        });
        
        modal.setContent(`
            <div class="text-center">
                <i class="fas fa-question-circle text-warning fa-3x mb-3"></i>
                <p>${Utils.sanitizeHtml(message)}</p>
            </div>
        `);
        
        modal.setFooter([
            {
                text: 'Cancelar',
                variant: 'secondary',
                dismiss: true,
                onClick: () => {
                    if (onCancel && typeof onCancel === 'function') {
                        onCancel();
                    }
                }
            },
            {
                text: 'Confirmar',
                variant: 'primary',
                onClick: () => {
                    if (onConfirm && typeof onConfirm === 'function') {
                        onConfirm();
                    }
                    modal.hide();
                }
            }
        ]);
        
        modal.show();
        return modal;
    }
    
    static showForm(title, fields, onSubmit, data = {}) {
        const modal = new ModalComponent({
            title: title,
            size: 'lg'
        });
        
        const formId = Utils.generateId();
        let formHTML = `<form id="${formId}" novalidate>`;
        
        fields.forEach(field => {
            formHTML += ModalComponent.renderFormField(field, data[field.name] || '');
        });
        
        formHTML += '</form>';
        
        modal.setContent(formHTML);
        
        modal.setFooter([
            {
                text: 'Cancelar',
                variant: 'secondary',
                dismiss: true
            },
            {
                text: 'Salvar',
                variant: 'primary',
                onClick: () => {
                    const form = document.getElementById(formId);
                    if (form && ModalComponent.validateForm(form)) {
                        const formData = ModalComponent.getFormData(form);
                        if (onSubmit && typeof onSubmit === 'function') {
                            const result = onSubmit(formData);
                            if (result !== false) {
                                modal.hide();
                            }
                        }
                    }
                }
            }
        ]);
        
        modal.show();
        return modal;
    }
    
    static renderFormField(field, value = '') {
        const fieldId = Utils.generateId();
        let fieldHTML = `<div class="mb-3">`;
        
        if (field.label) {
            fieldHTML += `<label for="${fieldId}" class="form-label">${field.label}${field.required ? ' *' : ''}</label>`;
        }
        
        switch (field.type) {
            case 'text':
            case 'email':
            case 'tel':
            case 'url':
            case 'password':
                fieldHTML += `
                    <input type="${field.type}" 
                           class="form-control" 
                           id="${fieldId}" 
                           name="${field.name}"
                           value="${Utils.sanitizeHtml(value)}"
                           placeholder="${field.placeholder || ''}"
                           ${field.required ? 'required' : ''}
                           ${field.readonly ? 'readonly' : ''}
                           ${field.disabled ? 'disabled' : ''}>
                `;
                break;
                
            case 'textarea':
                fieldHTML += `
                    <textarea class="form-control" 
                              id="${fieldId}" 
                              name="${field.name}"
                              rows="${field.rows || 3}"
                              placeholder="${field.placeholder || ''}"
                              ${field.required ? 'required' : ''}
                              ${field.readonly ? 'readonly' : ''}
                              ${field.disabled ? 'disabled' : ''}>${Utils.sanitizeHtml(value)}</textarea>
                `;
                break;
                
            case 'select':
                fieldHTML += `<select class="form-select" id="${fieldId}" name="${field.name}" ${field.required ? 'required' : ''}>`;
                if (field.placeholder) {
                    fieldHTML += `<option value="">${field.placeholder}</option>`;
                }
                if (field.options) {
                    field.options.forEach(option => {
                        const optionValue = typeof option === 'object' ? option.value : option;
                        const optionText = typeof option === 'object' ? option.text : option;
                        const selected = optionValue == value ? 'selected' : '';
                        fieldHTML += `<option value="${optionValue}" ${selected}>${optionText}</option>`;
                    });
                }
                fieldHTML += '</select>';
                break;
                
            case 'checkbox':
                fieldHTML += `
                    <div class="form-check">
                        <input class="form-check-input" 
                               type="checkbox" 
                               id="${fieldId}" 
                               name="${field.name}"
                               value="1"
                               ${value ? 'checked' : ''}>
                        <label class="form-check-label" for="${fieldId}">
                            ${field.checkboxLabel || field.label}
                        </label>
                    </div>
                `;
                break;
                
            case 'date':
            case 'datetime-local':
            case 'time':
                fieldHTML += `
                    <input type="${field.type}" 
                           class="form-control" 
                           id="${fieldId}" 
                           name="${field.name}"
                           value="${value}"
                           ${field.required ? 'required' : ''}
                           ${field.readonly ? 'readonly' : ''}
                           ${field.disabled ? 'disabled' : ''}>
                `;
                break;
                
            case 'number':
                fieldHTML += `
                    <input type="number" 
                           class="form-control" 
                           id="${fieldId}" 
                           name="${field.name}"
                           value="${value}"
                           min="${field.min || ''}"
                           max="${field.max || ''}"
                           step="${field.step || ''}"
                           placeholder="${field.placeholder || ''}"
                           ${field.required ? 'required' : ''}
                           ${field.readonly ? 'readonly' : ''}
                           ${field.disabled ? 'disabled' : ''}>
                `;
                break;
        }
        
        if (field.help) {
            fieldHTML += `<div class="form-text">${field.help}</div>`;
        }
        
        fieldHTML += `<div class="invalid-feedback"></div>`;
        fieldHTML += '</div>';
        
        return fieldHTML;
    }
    
    static validateForm(form) {
        let isValid = true;
        const fields = form.querySelectorAll('input, select, textarea');
        
        fields.forEach(field => {
            field.classList.remove('is-invalid');
            const feedback = field.parentNode.querySelector('.invalid-feedback');
            
            // Validação de campo obrigatório
            if (field.hasAttribute('required') && !field.value.trim()) {
                field.classList.add('is-invalid');
                if (feedback) feedback.textContent = 'Este campo é obrigatório.';
                isValid = false;
                return;
            }
            
            // Validação de email
            if (field.type === 'email' && field.value && !Utils.isValidEmail(field.value)) {
                field.classList.add('is-invalid');
                if (feedback) feedback.textContent = 'Digite um email válido.';
                isValid = false;
                return;
            }
            
            // Validação de telefone
            if (field.type === 'tel' && field.value && !Utils.isValidPhone(field.value)) {
                field.classList.add('is-invalid');
                if (feedback) feedback.textContent = 'Digite um telefone válido.';
                isValid = false;
                return;
            }
            
            // Validação de número
            if (field.type === 'number' && field.value) {
                const value = parseFloat(field.value);
                const min = field.getAttribute('min');
                const max = field.getAttribute('max');
                
                if (min && value < parseFloat(min)) {
                    field.classList.add('is-invalid');
                    if (feedback) feedback.textContent = `Valor mínimo: ${min}`;
                    isValid = false;
                    return;
                }
                
                if (max && value > parseFloat(max)) {
                    field.classList.add('is-invalid');
                    if (feedback) feedback.textContent = `Valor máximo: ${max}`;
                    isValid = false;
                    return;
                }
            }
        });
        
        return isValid;
    }
    
    static getFormData(form) {
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        // Tratar checkboxes não marcados
        const checkboxes = form.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            if (!checkbox.checked) {
                data[checkbox.name] = false;
            } else {
                data[checkbox.name] = true;
            }
        });
        
        return data;
    }
}

// Disponibilizar globalmente
window.ModalComponent = ModalComponent;