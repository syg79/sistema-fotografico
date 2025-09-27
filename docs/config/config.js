// Configuração do Sistema Fotográfico - GitHub Pages
const CONFIG = {
    // Google Sheets API Configuration
    GOOGLE_SHEETS: {
        SPREADSHEET_ID: '1ABC123DEF456GHI789JKL', // ⚠️ SUBSTITUIR pelo ID real da planilha
        API_KEY: 'AIzaSyB_EXAMPLE_API_KEY_HERE', // ⚠️ SUBSTITUIR pela chave real da API
        SCOPES: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        
        // Nomes das abas na planilha
        SHEETS: {
            SOLICITACOES: 'Solicitacoes',
            FOTOGRAFOS: 'Fotografos', 
            CLIENTES: 'Clientes',
            REDES: 'Redes',
            CONFIGURACAO: 'Configuracao'
        }
    },
    
    // GitHub Pages Configuration
    GITHUB_PAGES: {
        BASE_URL: 'https://usuario.github.io/sistema-fotografico', // ⚠️ SUBSTITUIR pela URL real
        REPO: 'usuario/sistema-fotografico' // ⚠️ SUBSTITUIR pelo repositório real
    },
    
    // Cache Configuration
    CACHE: {
        TIMEOUT: 5 * 60 * 1000, // 5 minutos em millisegundos
        ENABLED: true,
        PREFIX: 'sistema_foto_'
    },
    
    // Authentication Configuration
    AUTH: {
        ENABLED: true,
        PROVIDER: 'simple', // 'simple' ou 'google-oauth'
        REDIRECT_AFTER_LOGIN: true,
        SESSION_TIMEOUT: 8 * 60 * 60 * 1000, // 8 horas
        
        // Roles e permissões
        ROLES: {
            FOTOGRAFO: 'fotografo',
            EDITOR: 'editor', 
            GESTOR: 'gestor',
            ADMIN: 'admin'
        },
        
        // Hierarquia de permissões (números maiores = mais permissões)
        ROLE_HIERARCHY: {
            'fotografo': 1,
            'editor': 2,
            'gestor': 3,
            'admin': 4
        }
    },
    
    // Interface Configuration
    UI: {
        ITEMS_PER_PAGE: 20,
        AUTO_REFRESH_INTERVAL: 30000, // 30 segundos
        SHOW_DEBUG_INFO: false,
        
        // Cores por status
        STATUS_COLORS: {
            'Agendado': '#007bff',
            'Confirmado': '#28a745',
            'Realizado': '#ffc107',
            'Editado': '#17a2b8',
            'Entregue': '#6f42c1',
            'Cancelado': '#dc3545'
        }
    },
    
    // Filtros padrão por interface
    DEFAULT_FILTERS: {
        FOTOGRAFOS: {
            status: ['Agendado', 'Confirmado'],
            dataInicio: 'today'
        },
        EDITORES: {
            status: 'Realizado',
            editado: ['', 'Não', null]
        },
        GESTORES: {
            // Sem filtros padrão - ver tudo
        }
    },
    
    // Configurações de desenvolvimento
    DEV: {
        MOCK_DATA: false, // true para usar dados de teste
        LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
        BYPASS_AUTH: false // true para pular autenticação em desenvolvimento
    }
};

// Verificar se estamos em ambiente de desenvolvimento
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    CONFIG.DEV.LOG_LEVEL = 'debug';
    CONFIG.UI.SHOW_DEBUG_INFO = true;
    console.log('🔧 Modo de desenvolvimento ativado');
}

// Exportar configuração
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}

// Log da configuração carregada
console.log('⚙️ Configuração carregada:', {
    spreadsheetId: CONFIG.GOOGLE_SHEETS.SPREADSHEET_ID.substring(0, 10) + '...',
    baseUrl: CONFIG.GITHUB_PAGES.BASE_URL,
    cacheEnabled: CONFIG.CACHE.ENABLED,
    authEnabled: CONFIG.AUTH.ENABLED
});