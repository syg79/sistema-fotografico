// Configuração do Sistema Fotográfico - Versão incorporada em assets/js
// Este arquivo substitui o antigo config/config.js para evitar erros de carregamento no GitHub Pages.

(function initConfig() {
    if (typeof window.CONFIG !== 'undefined') {
        // Já definido (provavelmente por outro script). Não sobrescrever.
        return;
    }

    const CONFIG = {
        DATA_SOURCE: 'google-sheets',
        GOOGLE_SHEETS: {
            SPREADSHEET_ID: '1f73WWypg6iZ5KZ644f2dZD-HTCgm707wgpEIDVo4cpk',
            API_KEY: 'AIzaSyCXfAKAN5BNNaspkjFembfJYfthYwlrLq0',
            SCOPES: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
            APP_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzfR9pc_kAb5RGZu8fb6cjArVLaX2vtAbeL-K2NQMmnmTpnV6WZw-VzUkW00mlDY0QZ/exec',
            APP_SCRIPT_TOKEN: (typeof window !== 'undefined' ? (window.APP_SCRIPT_TOKEN || (window.localStorage ? window.localStorage.getItem('APP_SCRIPT_TOKEN') : null)) : null) || '',
            SHEETS: {
                SOLICITACOES: 'Solicitacoes',
                FOTOGRAFOS: 'Fotografos',
                CLIENTES: 'Clientes',
                REDES: 'Rede',
                CONFIGURACAO: 'Configuracao'
            },
            // URLs específicas das abas do Google Sheets
            SHEET_URLS: {
                REDE: 'https://docs.google.com/spreadsheets/d/1f73WWypg6iZ5KZ644f2dZD-HTCgm707wgpEIDVo4cpk/edit?gid=1604739870#gid=1604739870',
                CLIENTES: 'https://docs.google.com/spreadsheets/d/1f73WWypg6iZ5KZ644f2dZD-HTCgm707wgpEIDVo4cpk/edit?gid=459587616#gid=459587616',
                SOLICITACOES: 'https://docs.google.com/spreadsheets/d/1f73WWypg6iZ5KZ644f2dZD-HTCgm707wgpEIDVo4cpk/edit?gid=1180385096#gid=1180385096',
                FOTOGRAFOS: 'https://docs.google.com/spreadsheets/d/1f73WWypg6iZ5KZ644f2dZD-HTCgm707wgpEIDVo4cpk/edit?gid=137888653#gid=137888653'
            }
        },
        GOOGLE_MAPS: {
            API_KEY: 'AIzaSyC-k9mzokxh-Vc_8MZVbVlv2LnAXOxlKHE'
        },
        // Compatibilidade: permitir acesso direto via CONFIG.GOOGLE_MAPS_API_KEY
        GOOGLE_MAPS_API_KEY: 'AIzaSyC-k9mzokxh-Vc_8MZVbVlv2LnAXOxlKHE',
        GITHUB_PAGES: {
            BASE_URL: 'https://syg79.github.io/sistema-fotografico',
            REPO: 'syg79/sistema-fotografico'
        },
        CACHE: {
            TIMEOUT: 5 * 60 * 1000,
            ENABLED: true,
            PREFIX: 'sistema_foto_'
        },
        AUTH: {
            ENABLED: true,
            PROVIDER: 'simple',
            REDIRECT_AFTER_LOGIN: true,
            SESSION_TIMEOUT: 8 * 60 * 60 * 1000,
            ROLES: {
                FOTOGRAFO: 'fotografo',
                EDITOR: 'editor',
                GESTOR: 'gestor',
                ADMIN: 'admin'
            },
            ROLE_HIERARCHY: {
                fotografo: 1,
                editor: 2,
                gestor: 3,
                admin: 4
            }
        },
        UI: {
            ITEMS_PER_PAGE: 20,
            AUTO_REFRESH_INTERVAL: 30000,
            SHOW_DEBUG_INFO: false,
            STATUS_COLORS: {
                Agendado: '#007bff',
                Confirmado: '#28a745',
                Realizado: '#ffc107',
                Editado: '#17a2b8',
                Entregue: '#6f42c1',
                Cancelado: '#dc3545'
            }
        },
        DEFAULT_FILTERS: {
            FOTOGRAFOS: {
                status: ['Agendado', 'Confirmado'],
                dataInicio: 'today'
            },
            EDITORES: {
                status: 'Realizado',
                editado: ['', 'Nao', null]
            },
            GESTORES: {}
        },
        DEV: {
            MOCK_DATA: false,
            LOG_LEVEL: 'info',
            BYPASS_AUTH: false
        }
    };

    // Ajustes dinâmicos para localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        CONFIG.DEV.LOG_LEVEL = 'debug';
        CONFIG.UI.SHOW_DEBUG_INFO = true;
        console.log('Modo de desenvolvimento ativado');
    }

    window.CONFIG = CONFIG;
    console.log('Configuração padrão carregada (app-config.js)');
})();

// Suporte a CommonJS (tests/scripts)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.CONFIG;
}
