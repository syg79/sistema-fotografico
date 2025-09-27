# Documentação Técnica - GitHub Pages

## Visão Geral
Documentação completa para implementação das interfaces web usando GitHub Pages, adaptando o código HTML/CSS/JS existente para integrar com Google Sheets API.

## Estrutura Atual do Projeto

### **Arquivos Existentes**:
```
sistema_fotografico/
├── index.html                 # Página principal
├── agendamentos.html         # Agendamentos internos
├── agendamentos-publico.html # Interface para fotógrafos
├── novos-pedidos.html        # Cadastro de pedidos
├── pendentes.html            # Trabalhos pendentes
├── css/
│   └── style.css            # Estilos customizados
├── js/
│   ├── csv-loader.js        # ⚠️ SUBSTITUIR por google-sheets-api.js
│   ├── app.js               # Lógica principal
│   └── components/          # Componentes específicos
└── csv_output/              # ⚠️ REMOVER (dados locais)
```

## Adaptação para GitHub Pages

### **1. Nova Estrutura de Arquivos**

#### **Estrutura Proposta**:
```
docs/                        # Diretório GitHub Pages
├── index.html              # Dashboard principal
├── fotografos/
│   ├── agenda.html         # Agenda do fotógrafo
│   └── marcar-realizado.html # Marcar como realizado
├── editores/
│   ├── trabalhos.html      # Lista de trabalhos
│   └── upload.html         # Upload de arquivos editados
├── conferencia/
│   └── dashboard.html      # Dashboard de conferência
├── assets/
│   ├── css/
│   │   ├── bootstrap.min.css
│   │   └── style.css
│   ├── js/
│   │   ├── google-sheets-api.js  # ⭐ NOVO
│   │   ├── auth.js               # ⭐ NOVO
│   │   ├── app.js               # Adaptado
│   │   └── components/
│   └── img/
└── config/
    └── config.js           # Configurações da API
```

### **2. Substituição do CSV Loader**

#### **Arquivo Atual**: `csv-loader.js` (344 linhas)
#### **Novo Arquivo**: `google-sheets-api.js`

##### **Comparação de Funcionalidades**:

| CSV Loader (Atual) | Google Sheets API (Novo) |
|-------------------|-------------------------|
| `loadCSV(filePath)` | `loadSheetData(sheetName)` |
| `parseCSV(csvText)` | `parseSheetResponse(response)` |
| `getSolicitacoes()` | `getSolicitacoes()` |
| `getFotografos()` | `getFotografos()` |
| Dados locais | Dados em tempo real |

##### **Nova Implementação**:
```javascript
class GoogleSheetsAPI {
    constructor() {
        this.spreadsheetId = CONFIG.GOOGLE_SHEETS.SPREADSHEET_ID;
        this.apiKey = CONFIG.GOOGLE_SHEETS.API_KEY;
        this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
        
        this.cache = {
            solicitacoes: null,
            fotografos: null,
            clientes: null,
            lastUpdate: null
        };
        
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
    }

    async loadSheetData(sheetName, range = 'A:Z') {
        const url = `${this.baseUrl}/${this.spreadsheetId}/values/${sheetName}!${range}?key=${this.apiKey}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            return this.parseSheetResponse(data);
        } catch (error) {
            console.error(`Erro ao carregar ${sheetName}:`, error);
            throw error;
        }
    }

    parseSheetResponse(response) {
        if (!response.values || response.values.length === 0) {
            return [];
        }

        const [headers, ...rows] = response.values;
        return rows.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = row[index] || '';
            });
            return obj;
        });
    }

    // Manter compatibilidade com código existente
    async getSolicitacoes(filters = {}) {
        const data = await this.loadSheetData('Solicitacoes');
        return this.applyFilters(data, filters);
    }

    async getFotografos() {
        return await this.loadSheetData('Fotografos');
    }

    async getClientes() {
        return await this.loadSheetData('Clientes');
    }
}
```

### **3. Sistema de Autenticação**

#### **Arquivo**: `auth.js`
```javascript
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        this.isAuthenticated = false;
    }

    async login(email, password) {
        // Implementar autenticação via Google OAuth 2.0
        // ou sistema simples baseado em lista de usuários
        
        const user = await this.validateUser(email, password);
        if (user) {
            this.currentUser = user;
            this.userRole = user.role;
            this.isAuthenticated = true;
            
            localStorage.setItem('auth_user', JSON.stringify(user));
            this.redirectToUserInterface();
        }
        return user;
    }

    async validateUser(email, password) {
        // Lista de usuários autorizada (pode vir do Google Sheets)
        const authorizedUsers = await this.loadAuthorizedUsers();
        return authorizedUsers.find(u => u.email === email && u.password === password);
    }

    redirectToUserInterface() {
        switch (this.userRole) {
            case 'fotografo':
                window.location.href = 'fotografos/agenda.html';
                break;
            case 'editor':
                window.location.href = 'editores/trabalhos.html';
                break;
            case 'gestor':
                window.location.href = 'conferencia/dashboard.html';
                break;
            default:
                window.location.href = 'index.html';
        }
    }

    checkPermission(requiredRole) {
        if (!this.isAuthenticated) {
            window.location.href = 'login.html';
            return false;
        }

        const roleHierarchy = {
            'fotografo': 1,
            'editor': 2,
            'gestor': 3,
            'admin': 4
        };

        return roleHierarchy[this.userRole] >= roleHierarchy[requiredRole];
    }
}
```

### **4. Interfaces Específicas**

#### **A. Interface para Fotógrafos** (`fotografos/agenda.html`)

##### **Funcionalidades**:
- ✅ Visualizar agendamentos do dia/semana
- ✅ Ver detalhes do imóvel e contato
- ✅ Marcar como "Realizado"
- ✅ Adicionar observações e quilometragem
- ✅ Upload de fotos (opcional)

##### **Código Base**:
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Agenda do Fotógrafo</title>
    <link href="../assets/css/bootstrap.min.css" rel="stylesheet">
    <link href="../assets/css/style.css" rel="stylesheet">
</head>
<body>
    <div class="container mt-4">
        <h2><i class="fas fa-calendar"></i> Minha Agenda</h2>
        
        <div class="row">
            <div class="col-md-8">
                <div id="agendamentos-list" class="list-group">
                    <!-- Carregado via JavaScript -->
                </div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <h5>Estatísticas</h5>
                    </div>
                    <div class="card-body">
                        <p>Agendamentos hoje: <span id="count-hoje">0</span></p>
                        <p>Realizados: <span id="count-realizados">0</span></p>
                        <p>Pendentes: <span id="count-pendentes">0</span></p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="../assets/js/google-sheets-api.js"></script>
    <script src="../assets/js/auth.js"></script>
    <script src="../assets/js/fotografos/agenda.js"></script>
</body>
</html>
```

##### **JavaScript** (`fotografos/agenda.js`):
```javascript
class FotografoAgenda {
    constructor() {
        this.api = new GoogleSheetsAPI();
        this.auth = new AuthManager();
        this.fotografoNome = this.auth.currentUser?.nome;
    }

    async init() {
        if (!this.auth.checkPermission('fotografo')) return;
        
        await this.loadAgendamentos();
        this.setupEventListeners();
    }

    async loadAgendamentos() {
        try {
            const solicitacoes = await this.api.getSolicitacoes({
                fotografo: this.fotografoNome,
                status: ['Agendado', 'Confirmado'],
                dataInicio: new Date().toISOString().split('T')[0]
            });

            this.renderAgendamentos(solicitacoes);
            this.updateStatistics(solicitacoes);
        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
        }
    }

    renderAgendamentos(agendamentos) {
        const container = document.getElementById('agendamentos-list');
        container.innerHTML = '';

        agendamentos.forEach(item => {
            const element = this.createAgendamentoElement(item);
            container.appendChild(element);
        });
    }

    createAgendamentoElement(item) {
        const div = document.createElement('div');
        div.className = 'list-group-item';
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h6>${item['Endereco do Imovel']}</h6>
                    <p class="mb-1">${item['Nome Cliente']} - ${item['Referencia do Cliente']}</p>
                    <small>📅 ${item['Data do agendamento']} às ${item['Horario da Sessao']}</small>
                </div>
                <div>
                    <button class="btn btn-success btn-sm" onclick="marcarRealizado('${item['Record ID']}')">
                        ✅ Realizado
                    </button>
                </div>
            </div>
        `;
        return div;
    }

    async marcarRealizado(recordId) {
        // Implementar atualização via Google Sheets API
        const updateData = {
            'Status': 'Realizado',
            'Data Realizada': new Date().toISOString().split('T')[0],
            'Hora FINALIZOU': new Date().toTimeString().split(' ')[0]
        };

        await this.api.updateRecord('Solicitacoes', recordId, updateData);
        await this.loadAgendamentos(); // Recarregar lista
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    const agenda = new FotografoAgenda();
    agenda.init();
});
```

#### **B. Interface para Editores** (`editores/trabalhos.html`)

##### **Funcionalidades**:
- ✅ Visualizar trabalhos realizados pendentes de edição
- ✅ Marcar como "Editado"
- ✅ Upload de links de arquivos editados
- ✅ Filtros por data, cliente, fotógrafo

##### **Estrutura Similar**:
```javascript
class EditorTrabalhos {
    async loadTrabalhosPendentes() {
        const trabalhos = await this.api.getSolicitacoes({
            status: 'Realizado',
            editado: ['', 'Não', null]
        });
        
        this.renderTrabalhos(trabalhos);
    }

    async marcarEditado(recordId, links) {
        const updateData = {
            'Editado': 'Sim',
            'Data Entregue': new Date().toISOString().split('T')[0],
            'Download da sessao FOTOS': links.fotos,
            'Download da sessao VIDEO': links.video,
            'Download da sessao TOUR 360': links.tour360
        };

        await this.api.updateRecord('Solicitacoes', recordId, updateData);
    }
}
```

### **5. Configuração do GitHub Pages**

#### **Arquivo**: `config/config.js`
```javascript
const CONFIG = {
    GOOGLE_SHEETS: {
        SPREADSHEET_ID: '1ABC123DEF456...', // ID da planilha
        API_KEY: 'AIzaSyB...', // Chave da API (pública)
        SCOPES: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    },
    
    GITHUB_PAGES: {
        BASE_URL: 'https://usuario.github.io/sistema-fotografico',
        REPO: 'usuario/sistema-fotografico'
    },
    
    CACHE: {
        TIMEOUT: 5 * 60 * 1000, // 5 minutos
        ENABLED: true
    },
    
    AUTH: {
        ENABLED: true,
        PROVIDER: 'simple', // 'simple' ou 'google-oauth'
        REDIRECT_AFTER_LOGIN: true
    }
};
```

#### **Setup do Repositório GitHub**:
```bash
# 1. Criar repositório
git init
git remote add origin https://github.com/usuario/sistema-fotografico.git

# 2. Estrutura de branches
git checkout -b main
git checkout -b gh-pages  # Branch para GitHub Pages

# 3. Configurar GitHub Pages
# Settings > Pages > Source: Deploy from branch > gh-pages

# 4. Deploy
git add .
git commit -m "Initial GitHub Pages setup"
git push origin gh-pages
```

### **6. Processo de Deploy**

#### **Automação com GitHub Actions** (`.github/workflows/deploy.yml`):
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
    
    - name: Install dependencies
      run: npm install
    
    - name: Build
      run: npm run build
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./docs
```

### **7. Migração do Código Existente**

#### **Checklist de Adaptação**:

##### **✅ Arquivos HTML**:
- [x] Atualizar caminhos dos assets
- [x] Remover referências a CSV locais
- [x] Adicionar sistema de autenticação
- [x] Adaptar navegação para roles

##### **✅ Arquivos CSS**:
- [x] Manter `style.css` existente
- [x] Adicionar classes para novas interfaces
- [x] Responsividade para mobile

##### **✅ Arquivos JavaScript**:
- [x] Substituir `csv-loader.js` por `google-sheets-api.js`
- [x] Manter compatibilidade de métodos
- [x] Adicionar sistema de cache
- [x] Implementar tratamento de erros

### **8. Testes e Validação**

#### **Checklist de Testes**:
- [ ] ✅ Carregamento de dados do Google Sheets
- [ ] ✅ Autenticação de usuários
- [ ] ✅ Filtros por role (fotógrafo, editor, gestor)
- [ ] ✅ Atualização de status em tempo real
- [ ] ✅ Responsividade mobile
- [ ] ✅ Performance (cache, lazy loading)
- [ ] ✅ Tratamento de erros de rede

#### **URLs de Teste**:
```
https://usuario.github.io/sistema-fotografico/
https://usuario.github.io/sistema-fotografico/fotografos/agenda.html
https://usuario.github.io/sistema-fotografico/editores/trabalhos.html
https://usuario.github.io/sistema-fotografico/conferencia/dashboard.html
```

### **9. Cronograma de Implementação**

#### **Dia 1: Setup e Configuração**
- ✅ Criar repositório GitHub
- ✅ Configurar Google Sheets API
- ✅ Setup inicial do GitHub Pages

#### **Dia 2: Adaptação do Código**
- ✅ Migrar HTML/CSS existente
- ✅ Implementar `google-sheets-api.js`
- ✅ Sistema básico de autenticação

#### **Dia 3: Interfaces Específicas**
- ✅ Interface para fotógrafos
- ✅ Interface para editores
- ✅ Dashboard de conferência

#### **Dia 4: Testes e Deploy**
- ✅ Testes de integração
- ✅ Deploy final
- ✅ Documentação de uso

---

**Status**: Documentação técnica completa ✅  
**Próximo Passo**: Iniciar implementação do GitHub Pages