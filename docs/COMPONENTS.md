# Documentação dos Componentes

Este documento descreve os componentes JavaScript desenvolvidos para o Sistema Fotográfico.

## 📋 Índice

- [Utils](#utils)
- [TableComponent](#tablecomponent)
- [ModalComponent](#modalcomponent)
- [Exemplos de Uso](#exemplos-de-uso)

## 🛠️ Utils

Classe utilitária com funções auxiliares para formatação, validação e manipulação de dados.

### Métodos Disponíveis

#### Formatação

```javascript
// Formatação de data
Utils.formatDate(new Date(), 'dd/mm/yyyy'); // "27/09/2025"
Utils.formatDate(new Date(), 'dd/mm/yyyy hh:mm'); // "27/09/2025 14:30"

// Formatação de moeda
Utils.formatCurrency(1234.56); // "R$ 1.234,56"
Utils.formatCurrency(1234.56, 'USD'); // "$1,234.56"

// Formatação de telefone
Utils.formatPhone('11987654321'); // "(11) 98765-4321"

// Formatação de email
Utils.formatEmail('USUARIO@EXEMPLO.COM'); // "usuario@exemplo.com"
```

#### Status e Badges

```javascript
// Badge de status
Utils.getStatusBadge('ativo'); // HTML com badge verde
Utils.getStatusBadge('inativo'); // HTML com badge vermelho

// Ícone por tipo
Utils.getTypeIcon('documento'); // <i class="fas fa-file-alt"></i>
Utils.getTypeIcon('imagem'); // <i class="fas fa-image"></i>
```

#### Cálculos de Data

```javascript
// Diferença em dias
Utils.getDaysDifference('2025-09-27', '2025-09-30'); // 3

// Verificar se está em atraso
Utils.isOverdue('2025-09-25'); // true (se hoje for depois)
```

#### Utilitários

```javascript
// Debounce
const debouncedFunction = Utils.debounce(() => {
    console.log('Executado após 300ms');
}, 300);

// Sanitizar HTML
Utils.sanitizeHtml('<script>alert("xss")</script>'); // String limpa

// Gerar ID único
Utils.generateId(); // "id_1727456789123_abc"

// Validações
Utils.isValidEmail('usuario@exemplo.com'); // true
Utils.isValidPhone('11987654321'); // true

// Copiar para clipboard
Utils.copyToClipboard('Texto copiado');

// Notificações toast
Utils.showToast('Sucesso!', 'success');
Utils.showToast('Erro!', 'error');
Utils.showToast('Aviso!', 'warning');
Utils.showToast('Info!', 'info');
```

#### Manipulação de Dados

```javascript
// Filtrar array
const dados = [{nome: 'João', idade: 30}, {nome: 'Maria', idade: 25}];
Utils.filterData(dados, 'joão'); // Busca case-insensitive

// Ordenar array
Utils.sortData(dados, 'nome', 'asc'); // Ordena por nome crescente
Utils.sortData(dados, 'idade', 'desc'); // Ordena por idade decrescente
```

## 📊 TableComponent

Componente para criar tabelas interativas com paginação, ordenação, busca e filtros.

### Inicialização

```javascript
const table = new TableComponent('#minha-tabela', {
    columns: [
        { 
            key: 'nome', 
            label: 'Nome', 
            sortable: true,
            searchable: true 
        },
        { 
            key: 'email', 
            label: 'E-mail', 
            sortable: true 
        },
        { 
            key: 'status', 
            label: 'Status',
            render: (value) => Utils.getStatusBadge(value)
        },
        {
            key: 'actions',
            label: 'Ações',
            render: (value, row) => `
                <button class="btn btn-sm btn-primary" onclick="editarItem('${row.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="excluirItem('${row.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            `
        }
    ],
    data: dados,
    pagination: true,
    pageSize: 10,
    search: true,
    searchPlaceholder: 'Buscar...',
    selectable: true,
    actions: [
        {
            label: 'Exportar Selecionados',
            icon: 'fas fa-download',
            class: 'btn-success',
            callback: (selectedRows) => {
                console.log('Exportar:', selectedRows);
            }
        }
    ]
});
```

### Configurações

| Opção | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `columns` | Array | `[]` | Definição das colunas |
| `data` | Array | `[]` | Dados da tabela |
| `pagination` | Boolean | `true` | Ativar paginação |
| `pageSize` | Number | `10` | Itens por página |
| `search` | Boolean | `true` | Ativar busca |
| `searchPlaceholder` | String | `'Buscar...'` | Placeholder da busca |
| `selectable` | Boolean | `false` | Permitir seleção de linhas |
| `actions` | Array | `[]` | Ações em lote |

### Métodos

```javascript
// Definir dados
table.setData(novosDados);

// Atualizar dados
table.updateData(dadosAtualizados);

// Aplicar filtros
table.applyFilters({status: 'ativo'});

// Limpar filtros
table.clearFilters();

// Obter linhas selecionadas
const selecionadas = table.getSelectedRows();

// Limpar seleção
table.clearSelection();

// Mostrar loading
table.showLoading();

// Esconder loading
table.hideLoading();

// Destruir componente
table.destroy();
```

### Eventos

```javascript
// Escutar eventos
table.on('rowClick', (row, index) => {
    console.log('Linha clicada:', row);
});

table.on('selectionChange', (selectedRows) => {
    console.log('Seleção alterada:', selectedRows);
});

table.on('sort', (column, direction) => {
    console.log('Ordenação:', column, direction);
});

table.on('search', (query) => {
    console.log('Busca:', query);
});
```

## 🪟 ModalComponent

Componente para criar modais reutilizáveis para formulários, alertas e confirmações.

### Inicialização Básica

```javascript
const modal = new ModalComponent({
    title: 'Meu Modal',
    content: '<p>Conteúdo do modal</p>',
    size: 'lg', // sm, md, lg, xl
    backdrop: true,
    keyboard: true,
    footer: [
        {
            text: 'Cancelar',
            class: 'btn-secondary',
            dismiss: true
        },
        {
            text: 'Salvar',
            class: 'btn-primary',
            callback: () => {
                console.log('Salvar clicado');
                modal.hide();
            }
        }
    ]
});

modal.show();
```

### Métodos Estáticos

#### Alerta

```javascript
ModalComponent.showAlert(
    'Atenção!',
    'Esta é uma mensagem de alerta.',
    'warning' // success, info, warning, error
);
```

#### Confirmação

```javascript
ModalComponent.showConfirm(
    'Confirmar Exclusão',
    'Tem certeza que deseja excluir este item?',
    () => {
        console.log('Confirmado');
        // Lógica de exclusão
    },
    () => {
        console.log('Cancelado');
    }
);
```

#### Formulário

```javascript
const campos = [
    {
        name: 'nome',
        label: 'Nome',
        type: 'text',
        required: true,
        placeholder: 'Digite o nome'
    },
    {
        name: 'email',
        label: 'E-mail',
        type: 'email',
        required: true,
        validation: (value) => {
            return Utils.isValidEmail(value) ? null : 'E-mail inválido';
        }
    },
    {
        name: 'tipo',
        label: 'Tipo',
        type: 'select',
        options: [
            { value: 'admin', text: 'Administrador' },
            { value: 'user', text: 'Usuário' }
        ],
        required: true
    },
    {
        name: 'ativo',
        label: 'Ativo',
        type: 'checkbox',
        checked: true
    },
    {
        name: 'observacoes',
        label: 'Observações',
        type: 'textarea',
        rows: 3
    }
];

ModalComponent.showForm(
    'Novo Usuário',
    campos,
    (dados) => {
        console.log('Dados do formulário:', dados);
        // Processar dados
    },
    dadosIniciais // Opcional: dados para edição
);
```

### Métodos de Instância

```javascript
// Mostrar/esconder
modal.show();
modal.hide();

// Definir conteúdo
modal.setTitle('Novo Título');
modal.setContent('<p>Novo conteúdo</p>');
modal.setFooter([...novosButtons]);

// Loading
modal.showLoading();
modal.hideLoading();

// Destruir
modal.destroy();
```

### Eventos

```javascript
modal.on('show', () => {
    console.log('Modal sendo exibido');
});

modal.on('shown', () => {
    console.log('Modal exibido');
});

modal.on('hide', () => {
    console.log('Modal sendo ocultado');
});

modal.on('hidden', () => {
    console.log('Modal ocultado');
});
```

## 💡 Exemplos de Uso

### Tabela de Usuários

```javascript
const usuarios = [
    { id: 1, nome: 'João Silva', email: 'joao@email.com', status: 'ativo' },
    { id: 2, nome: 'Maria Santos', email: 'maria@email.com', status: 'inativo' }
];

const tabelaUsuarios = new TableComponent('#tabela-usuarios', {
    columns: [
        { key: 'nome', label: 'Nome', sortable: true },
        { key: 'email', label: 'E-mail', sortable: true },
        { 
            key: 'status', 
            label: 'Status',
            render: (value) => Utils.getStatusBadge(value)
        },
        {
            key: 'actions',
            label: 'Ações',
            render: (value, row) => `
                <button class="btn btn-sm btn-primary" onclick="editarUsuario(${row.id})">
                    Editar
                </button>
            `
        }
    ],
    data: usuarios,
    search: true,
    pagination: true
});

function editarUsuario(id) {
    const usuario = usuarios.find(u => u.id === id);
    
    const campos = [
        { name: 'nome', label: 'Nome', type: 'text', required: true },
        { name: 'email', label: 'E-mail', type: 'email', required: true },
        { 
            name: 'status', 
            label: 'Status', 
            type: 'select',
            options: [
                { value: 'ativo', text: 'Ativo' },
                { value: 'inativo', text: 'Inativo' }
            ]
        }
    ];
    
    ModalComponent.showForm(
        'Editar Usuário',
        campos,
        (dados) => {
            // Atualizar usuário
            Object.assign(usuario, dados);
            tabelaUsuarios.updateData(usuarios);
            Utils.showToast('Usuário atualizado!', 'success');
        },
        usuario
    );
}
```

### Dashboard com Filtros

```javascript
const dashboard = {
    init() {
        this.setupFilters();
        this.loadData();
    },
    
    setupFilters() {
        // Filtro de data
        document.getElementById('filtro-data').addEventListener('change', (e) => {
            this.applyFilters();
        });
        
        // Filtro de status
        document.getElementById('filtro-status').addEventListener('change', (e) => {
            this.applyFilters();
        });
    },
    
    applyFilters() {
        const filtros = {
            data: document.getElementById('filtro-data').value,
            status: document.getElementById('filtro-status').value
        };
        
        this.tabela.applyFilters(filtros);
    },
    
    loadData() {
        // Simular carregamento
        this.tabela.showLoading();
        
        setTimeout(() => {
            this.tabela.setData(this.dados);
            this.tabela.hideLoading();
        }, 1000);
    }
};

dashboard.init();
```

### Integração com API

```javascript
class ApiService {
    static async get(url) {
        try {
            const response = await fetch(url);
            return await response.json();
        } catch (error) {
            Utils.showToast('Erro ao carregar dados', 'error');
            throw error;
        }
    }
    
    static async post(url, data) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            Utils.showToast('Erro ao salvar dados', 'error');
            throw error;
        }
    }
}

// Uso com tabela
const tabelaApi = new TableComponent('#tabela-api', {
    columns: [...],
    data: [],
    pagination: true
});

async function carregarDados() {
    tabelaApi.showLoading();
    try {
        const dados = await ApiService.get('/api/usuarios');
        tabelaApi.setData(dados);
    } finally {
        tabelaApi.hideLoading();
    }
}
```

## 🎨 Personalização CSS

### Variáveis CSS Disponíveis

```css
:root {
    /* Cores dos componentes */
    --table-header-bg: #f8f9fa;
    --table-border-color: #dee2e6;
    --modal-backdrop-bg: rgba(0, 0, 0, 0.5);
    
    /* Animações */
    --transition-speed: 0.3s;
    --animation-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### Classes CSS Personalizáveis

```css
/* Tabela */
.table-component { /* Container principal */ }
.table-component__header { /* Cabeçalho */ }
.table-component__search { /* Barra de busca */ }
.table-component__table { /* Tabela */ }
.table-component__pagination { /* Paginação */ }

/* Modal */
.modal-component { /* Container do modal */ }
.modal-component__dialog { /* Diálogo */ }
.modal-component__content { /* Conteúdo */ }
.modal-component__header { /* Cabeçalho */ }
.modal-component__body { /* Corpo */ }
.modal-component__footer { /* Rodapé */ }
```

---

**Componentes desenvolvidos para máxima flexibilidade e reutilização! 🚀**