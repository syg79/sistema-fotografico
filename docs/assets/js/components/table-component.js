/**
 * Componente de tabela reutilizável com paginação, ordenação e filtros
 */

class TableComponent {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container com ID '${containerId}' não encontrado`);
        }
        
        this.options = {
            itemsPerPage: 10,
            showPagination: true,
            showSearch: true,
            sortable: true,
            selectable: false,
            responsive: true,
            emptyMessage: 'Nenhum item encontrado',
            loadingMessage: 'Carregando...',
            ...options
        };
        
        this.data = [];
        this.filteredData = [];
        this.currentPage = 1;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.searchTerm = '';
        this.filters = {};
        this.selectedItems = new Set();
        
        this.init();
    }
    
    init() {
        this.render();
        this.attachEventListeners();
    }
    
    render() {
        this.container.innerHTML = `
            <div class="table-component">
                ${this.options.showSearch ? this.renderSearchBar() : ''}
                <div class="table-wrapper">
                    <div class="table-loading d-none">
                        <div class="text-center p-4">
                            <div class="spinner-border" role="status">
                                <span class="visually-hidden">${this.options.loadingMessage}</span>
                            </div>
                            <p class="mt-2">${this.options.loadingMessage}</p>
                        </div>
                    </div>
                    <div class="table-content">
                        <table class="table table-striped table-hover ${this.options.responsive ? 'table-responsive' : ''}">
                            <thead class="table-dark">
                                ${this.renderTableHeader()}
                            </thead>
                            <tbody>
                                ${this.renderTableBody()}
                            </tbody>
                        </table>
                    </div>
                </div>
                ${this.options.showPagination ? this.renderPagination() : ''}
            </div>
        `;
    }
    
    renderSearchBar() {
        return `
            <div class="table-search mb-3">
                <div class="row">
                    <div class="col-md-6">
                        <div class="input-group">
                            <span class="input-group-text">
                                <i class="fas fa-search"></i>
                            </span>
                            <input type="text" class="form-control" placeholder="Buscar..." id="table-search">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="d-flex justify-content-end">
                            <button class="btn btn-outline-secondary me-2" id="clear-filters">
                                <i class="fas fa-times"></i> Limpar Filtros
                            </button>
                            ${this.options.selectable ? `
                                <button class="btn btn-outline-primary" id="bulk-actions" disabled>
                                    <i class="fas fa-tasks"></i> Ações (<span id="selected-count">0</span>)
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderTableHeader() {
        if (!this.options.columns || this.options.columns.length === 0) {
            return '<tr><th>Nenhuma coluna definida</th></tr>';
        }
        
        let headerHtml = '<tr>';
        
        if (this.options.selectable) {
            headerHtml += `
                <th width="50">
                    <input type="checkbox" class="form-check-input" id="select-all">
                </th>
            `;
        }
        
        this.options.columns.forEach(column => {
            const sortable = this.options.sortable && column.sortable !== false;
            const sortIcon = this.getSortIcon(column.key);
            
            headerHtml += `
                <th ${column.width ? `width="${column.width}"` : ''} 
                    ${sortable ? `class="sortable" data-column="${column.key}"` : ''}>
                    ${column.title}
                    ${sortable ? `<i class="fas ${sortIcon} ms-1"></i>` : ''}
                </th>
            `;
        });
        
        if (this.options.actions && this.options.actions.length > 0) {
            headerHtml += '<th width="120">Ações</th>';
        }
        
        headerHtml += '</tr>';
        return headerHtml;
    }
    
    renderTableBody() {
        if (this.filteredData.length === 0) {
            const colspan = this.getColspan();
            return `
                <tr>
                    <td colspan="${colspan}" class="text-center p-4">
                        <i class="fas fa-inbox fa-2x text-muted mb-2"></i>
                        <p class="text-muted">${this.options.emptyMessage}</p>
                    </td>
                </tr>
            `;
        }
        
        const startIndex = (this.currentPage - 1) * this.options.itemsPerPage;
        const endIndex = startIndex + this.options.itemsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);
        
        return pageData.map(item => this.renderTableRow(item)).join('');
    }
    
    renderTableRow(item) {
        let rowHtml = `<tr data-id="${item.id || Utils.generateId()}">`;
        
        if (this.options.selectable) {
            const isSelected = this.selectedItems.has(item.id);
            rowHtml += `
                <td>
                    <input type="checkbox" class="form-check-input row-select" 
                           value="${item.id}" ${isSelected ? 'checked' : ''}>
                </td>
            `;
        }
        
        this.options.columns.forEach(column => {
            let cellValue = this.getCellValue(item, column);
            rowHtml += `<td>${cellValue}</td>`;
        });
        
        if (this.options.actions && this.options.actions.length > 0) {
            rowHtml += `<td>${this.renderActions(item)}</td>`;
        }
        
        rowHtml += '</tr>';
        return rowHtml;
    }
    
    getCellValue(item, column) {
        let value = item[column.key];
        
        if (column.render && typeof column.render === 'function') {
            return column.render(value, item);
        }
        
        if (column.type) {
            switch (column.type) {
                case 'date':
                    return Utils.formatDate(value, column.format || 'short');
                case 'currency':
                    return Utils.formatCurrency(value);
                case 'status':
                    return Utils.getStatusBadge(value);
                case 'phone':
                    return Utils.formatPhone(value);
                case 'boolean':
                    return value ? '<i class="fas fa-check text-success"></i>' : '<i class="fas fa-times text-danger"></i>';
                default:
                    return Utils.sanitizeHtml(value || '-');
            }
        }
        
        return Utils.sanitizeHtml(value || '-');
    }
    
    renderActions(item) {
        return this.options.actions.map(action => {
            const disabled = action.disabled && action.disabled(item) ? 'disabled' : '';
            const visible = action.visible ? action.visible(item) : true;
            
            if (!visible) return '';
            
            return `
                <button class="btn btn-sm btn-${action.variant || 'outline-primary'} me-1 ${disabled}" 
                        data-action="${action.key}" 
                        data-id="${item.id}"
                        title="${action.title || action.label}">
                    ${action.icon ? `<i class="${action.icon}"></i>` : ''}
                    ${action.label || ''}
                </button>
            `;
        }).join('');
    }
    
    renderPagination() {
        const totalPages = Math.ceil(this.filteredData.length / this.options.itemsPerPage);
        
        if (totalPages <= 1) return '';
        
        let paginationHtml = `
            <nav aria-label="Paginação da tabela">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <p class="text-muted mb-0">
                            Mostrando ${this.getDisplayRange()} de ${this.filteredData.length} itens
                        </p>
                    </div>
                    <div class="col-md-6">
                        <ul class="pagination justify-content-end mb-0">
        `;
        
        // Botão anterior
        paginationHtml += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage - 1}">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;
        
        // Páginas
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);
        
        if (startPage > 1) {
            paginationHtml += `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>`;
            if (startPage > 2) {
                paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            paginationHtml += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a></li>`;
        }
        
        // Botão próximo
        paginationHtml += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage + 1}">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;
        
        paginationHtml += `
                        </ul>
                    </div>
                </div>
            </nav>
        `;
        
        return paginationHtml;
    }
    
    attachEventListeners() {
        // Busca
        const searchInput = this.container.querySelector('#table-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.searchTerm = e.target.value;
                this.applyFilters();
            }, 300));
        }
        
        // Limpar filtros
        const clearFiltersBtn = this.container.querySelector('#clear-filters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }
        
        // Ordenação
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.sortable')) {
                const column = e.target.closest('.sortable').dataset.column;
                this.sort(column);
            }
        });
        
        // Paginação
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.page-link')) {
                e.preventDefault();
                const page = parseInt(e.target.closest('.page-link').dataset.page);
                if (page && page !== this.currentPage) {
                    this.goToPage(page);
                }
            }
        });
        
        // Seleção
        if (this.options.selectable) {
            this.container.addEventListener('change', (e) => {
                if (e.target.id === 'select-all') {
                    this.toggleSelectAll(e.target.checked);
                } else if (e.target.classList.contains('row-select')) {
                    this.toggleSelectRow(e.target.value, e.target.checked);
                }
            });
        }
        
        // Ações
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('[data-action]')) {
                const button = e.target.closest('[data-action]');
                const action = button.dataset.action;
                const id = button.dataset.id;
                const item = this.data.find(item => item.id == id);
                
                if (this.options.onAction && typeof this.options.onAction === 'function') {
                    this.options.onAction(action, item, id);
                }
            }
        });
    }
    
    // Métodos públicos
    setData(data) {
        this.data = Array.isArray(data) ? data : [];
        this.applyFilters();
    }
    
    addRow(item) {
        this.data.push(item);
        this.applyFilters();
    }
    
    updateRow(id, updatedItem) {
        const index = this.data.findIndex(item => item.id == id);
        if (index !== -1) {
            this.data[index] = { ...this.data[index], ...updatedItem };
            this.applyFilters();
        }
    }
    
    removeRow(id) {
        this.data = this.data.filter(item => item.id != id);
        this.applyFilters();
    }
    
    setFilter(key, value) {
        if (value === null || value === undefined || value === '') {
            delete this.filters[key];
        } else {
            this.filters[key] = value;
        }
        this.applyFilters();
    }
    
    clearFilters() {
        this.filters = {};
        this.searchTerm = '';
        const searchInput = this.container.querySelector('#table-search');
        if (searchInput) searchInput.value = '';
        this.applyFilters();
    }
    
    applyFilters() {
        let filtered = [...this.data];
        
        // Aplicar filtros
        if (Object.keys(this.filters).length > 0) {
            filtered = Utils.filterData(filtered, this.filters);
        }
        
        // Aplicar busca
        if (this.searchTerm) {
            const searchLower = this.searchTerm.toLowerCase();
            filtered = filtered.filter(item => {
                return this.options.columns.some(column => {
                    const value = item[column.key];
                    return value && value.toString().toLowerCase().includes(searchLower);
                });
            });
        }
        
        // Aplicar ordenação
        if (this.sortColumn) {
            filtered = Utils.sortData(filtered, this.sortColumn, this.sortDirection);
        }
        
        this.filteredData = filtered;
        this.currentPage = 1;
        this.updateTable();
    }
    
    sort(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        this.applyFilters();
    }
    
    goToPage(page) {
        const totalPages = Math.ceil(this.filteredData.length / this.options.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.updateTable();
        }
    }
    
    showLoading() {
        const loading = this.container.querySelector('.table-loading');
        const content = this.container.querySelector('.table-content');
        if (loading && content) {
            loading.classList.remove('d-none');
            content.classList.add('d-none');
        }
    }
    
    hideLoading() {
        const loading = this.container.querySelector('.table-loading');
        const content = this.container.querySelector('.table-content');
        if (loading && content) {
            loading.classList.add('d-none');
            content.classList.remove('d-none');
        }
    }
    
    getSelectedItems() {
        return Array.from(this.selectedItems);
    }
    
    // Métodos privados
    updateTable() {
        const tbody = this.container.querySelector('tbody');
        const pagination = this.container.querySelector('nav[aria-label="Paginação da tabela"]');
        
        if (tbody) {
            tbody.innerHTML = this.renderTableBody();
        }
        
        if (pagination) {
            pagination.outerHTML = this.renderPagination();
        }
        
        this.updateSortIcons();
        this.updateSelectionCount();
    }
    
    updateSortIcons() {
        this.container.querySelectorAll('.sortable i').forEach(icon => {
            icon.className = 'fas fa-sort ms-1';
        });
        
        if (this.sortColumn) {
            const header = this.container.querySelector(`[data-column="${this.sortColumn}"] i`);
            if (header) {
                header.className = `fas fa-sort-${this.sortDirection === 'asc' ? 'up' : 'down'} ms-1`;
            }
        }
    }
    
    getSortIcon(column) {
        if (this.sortColumn === column) {
            return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
        }
        return 'fa-sort';
    }
    
    getColspan() {
        let colspan = this.options.columns ? this.options.columns.length : 1;
        if (this.options.selectable) colspan++;
        if (this.options.actions && this.options.actions.length > 0) colspan++;
        return colspan;
    }
    
    getDisplayRange() {
        const start = (this.currentPage - 1) * this.options.itemsPerPage + 1;
        const end = Math.min(start + this.options.itemsPerPage - 1, this.filteredData.length);
        return `${start}-${end}`;
    }
    
    toggleSelectAll(checked) {
        const checkboxes = this.container.querySelectorAll('.row-select');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            this.toggleSelectRow(checkbox.value, checked);
        });
    }
    
    toggleSelectRow(id, checked) {
        if (checked) {
            this.selectedItems.add(id);
        } else {
            this.selectedItems.delete(id);
        }
        this.updateSelectionCount();
    }
    
    updateSelectionCount() {
        const countElement = this.container.querySelector('#selected-count');
        const bulkActionsBtn = this.container.querySelector('#bulk-actions');
        
        if (countElement) {
            countElement.textContent = this.selectedItems.size;
        }
        
        if (bulkActionsBtn) {
            bulkActionsBtn.disabled = this.selectedItems.size === 0;
        }
        
        // Atualizar checkbox "select all"
        const selectAllCheckbox = this.container.querySelector('#select-all');
        if (selectAllCheckbox) {
            const visibleRows = this.container.querySelectorAll('.row-select').length;
            selectAllCheckbox.checked = this.selectedItems.size > 0 && this.selectedItems.size === visibleRows;
            selectAllCheckbox.indeterminate = this.selectedItems.size > 0 && this.selectedItems.size < visibleRows;
        }
    }
}

// Disponibilizar globalmente
window.TableComponent = TableComponent;