/**
 * Sistema de Autenticação
 * Gerencia login, roles e permissões para o sistema fotográfico
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        this.isAuthenticated = false;
        this.sessionKey = 'sistema_foto_session';
        
        // Carregar sessão existente
        this.loadSession();
        
        console.log('🔐 AuthManager inicializado');
    }

    /**
     * Realiza login do usuário
     * @param {string} email - Email do usuário
     * @param {string} password - Senha do usuário
     * @returns {Promise<Object|null>} Dados do usuário ou null se falhou
     */
    async login(email, password) {
        try {
            console.log('🔑 Tentando fazer login:', email);
            
            const user = await this.validateUser(email, password);
            
            if (user) {
                this.currentUser = user;
                this.userRole = user.role;
                this.isAuthenticated = true;
                
                // Salvar sessão
                this.saveSession(user);
                
                console.log('✅ Login realizado com sucesso:', user.nome, `(${user.role})`);
                
                // Redirecionar para interface apropriada
                if (CONFIG.AUTH.REDIRECT_AFTER_LOGIN) {
                    this.redirectToUserInterface();
                }
                
                return user;
            } else {
                console.warn('❌ Credenciais inválidas');
                return null;
            }
        } catch (error) {
            console.error('❌ Erro no login:', error);
            throw error;
        }
    }

    /**
     * Valida credenciais do usuário
     * @param {string} email - Email do usuário
     * @param {string} password - Senha do usuário
     * @returns {Promise<Object|null>}
     */
    async validateUser(email, password) {
        // Em desenvolvimento, permitir bypass da autenticação
        if (CONFIG.DEV.BYPASS_AUTH) {
            console.log('🔧 Bypass de autenticação ativado (desenvolvimento)');
            return {
                id: 'dev_user',
                nome: 'Usuário de Desenvolvimento',
                email: email,
                role: 'admin'
            };
        }

        try {
            // Carregar usuários autorizados do Google Sheets
            const authorizedUsers = await this.loadAuthorizedUsers();
            
            // Buscar usuário por email e senha
            const user = authorizedUsers.find(u => 
                u.email.toLowerCase() === email.toLowerCase() && 
                u.senha === password
            );
            
            return user || null;
        } catch (error) {
            console.error('❌ Erro ao validar usuário:', error);
            
            // Fallback: lista de usuários hardcoded para emergência
            return this.validateUserFallback(email, password);
        }
    }

    /**
     * Carrega usuários autorizados do Google Sheets
     * @returns {Promise<Array>}
     */
    async loadAuthorizedUsers() {
        try {
            // Tentar carregar da aba "Configuracao" ou "Usuarios"
            const configData = await window.googleSheetsAPI.loadSheetData('Configuracao');
            
            // Filtrar apenas registros de usuários
            const users = configData.filter(item => item.tipo === 'usuario' || item.Tipo === 'usuario');
            
            return users.map(user => ({
                id: user.id || user.ID,
                nome: user.nome || user.Nome,
                email: user.email || user.Email,
                senha: user.senha || user.Senha,
                role: user.role || user.Role || 'fotografo'
            }));
        } catch (error) {
            console.warn('⚠️ Não foi possível carregar usuários do Google Sheets:', error);
            throw error;
        }
    }

    /**
     * Validação de usuário com lista hardcoded (fallback)
     * @param {string} email 
     * @param {string} password 
     * @returns {Object|null}
     */
    validateUserFallback(email, password) {
        console.log('🔧 Usando validação de fallback');
        
        // Lista de usuários de emergência
        const fallbackUsers = [
            {
                id: 'admin',
                nome: 'Administrador',
                email: 'admin@sistema.com',
                senha: 'admin123',
                role: 'admin'
            },
            {
                id: 'gestor',
                nome: 'Gestor',
                email: 'gestor@sistema.com',
                senha: 'gestor123',
                role: 'gestor'
            },
            {
                id: 'fotografo1',
                nome: 'Fotógrafo Teste',
                email: 'fotografo@sistema.com',
                senha: 'foto123',
                role: 'fotografo'
            },
            {
                id: 'editor1',
                nome: 'Editor Teste',
                email: 'editor@sistema.com',
                senha: 'edit123',
                role: 'editor'
            }
        ];

        return fallbackUsers.find(u => 
            u.email.toLowerCase() === email.toLowerCase() && 
            u.senha === password
        ) || null;
    }

    /**
     * Realiza logout do usuário
     */
    logout() {
        this.currentUser = null;
        this.userRole = null;
        this.isAuthenticated = false;
        
        // Limpar sessão
        localStorage.removeItem(this.sessionKey);
        sessionStorage.removeItem(this.sessionKey);
        
        console.log('👋 Logout realizado');
        
        // Redirecionar para página de login
        window.location.href = 'login.html';
    }

    /**
     * Verifica se o usuário tem permissão para acessar um recurso
     * @param {string} requiredRole - Role mínimo necessário
     * @returns {boolean}
     */
    checkPermission(requiredRole) {
        if (!CONFIG.AUTH.ENABLED) {
            return true; // Autenticação desabilitada
        }

        if (!this.isAuthenticated) {
            console.warn('❌ Usuário não autenticado');
            this.redirectToLogin();
            return false;
        }

        const userLevel = CONFIG.AUTH.ROLE_HIERARCHY[this.userRole] || 0;
        const requiredLevel = CONFIG.AUTH.ROLE_HIERARCHY[requiredRole] || 0;

        const hasPermission = userLevel >= requiredLevel;
        
        if (!hasPermission) {
            console.warn(`❌ Permissão negada. Usuário: ${this.userRole} (${userLevel}), Necessário: ${requiredRole} (${requiredLevel})`);
        }

        return hasPermission;
    }

    /**
     * Redireciona para a interface apropriada do usuário
     */
    redirectToUserInterface() {
        if (!this.isAuthenticated) {
            this.redirectToLogin();
            return;
        }

        let targetUrl = 'index.html'; // Padrão

        switch (this.userRole) {
            case CONFIG.AUTH.ROLES.FOTOGRAFO:
                targetUrl = 'fotografos/agenda.html';
                break;
            case CONFIG.AUTH.ROLES.EDITOR:
                targetUrl = 'editores/trabalhos.html';
                break;
            case CONFIG.AUTH.ROLES.GESTOR:
            case CONFIG.AUTH.ROLES.ADMIN:
                targetUrl = 'conferencia/dashboard.html';
                break;
        }

        console.log(`🔄 Redirecionando para: ${targetUrl}`);
        window.location.href = targetUrl;
    }

    /**
     * Redireciona para página de login
     */
    redirectToLogin() {
        if (window.location.pathname !== '/login.html' && !window.location.pathname.endsWith('login.html')) {
            console.log('🔄 Redirecionando para login');
            window.location.href = 'login.html';
        }
    }

    /**
     * Salva sessão do usuário
     * @param {Object} user - Dados do usuário
     */
    saveSession(user) {
        const sessionData = {
            user: user,
            timestamp: Date.now(),
            expires: Date.now() + CONFIG.AUTH.SESSION_TIMEOUT
        };

        try {
            localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
            console.log('💾 Sessão salva');
        } catch (error) {
            console.warn('⚠️ Erro ao salvar sessão:', error);
        }
    }

    /**
     * Carrega sessão existente
     */
    loadSession() {
        try {
            const sessionData = localStorage.getItem(this.sessionKey);
            
            if (!sessionData) {
                return false;
            }

            const session = JSON.parse(sessionData);
            
            // Verificar se a sessão não expirou
            if (Date.now() > session.expires) {
                console.log('⏰ Sessão expirada');
                localStorage.removeItem(this.sessionKey);
                return false;
            }

            // Restaurar usuário
            this.currentUser = session.user;
            this.userRole = session.user.role;
            this.isAuthenticated = true;

            console.log('✅ Sessão restaurada:', session.user.nome);
            return true;
        } catch (error) {
            console.warn('⚠️ Erro ao carregar sessão:', error);
            localStorage.removeItem(this.sessionKey);
            return false;
        }
    }

    /**
     * Verifica se a sessão ainda é válida
     * @returns {boolean}
     */
    isSessionValid() {
        if (!this.isAuthenticated) {
            return false;
        }

        try {
            const sessionData = localStorage.getItem(this.sessionKey);
            if (!sessionData) {
                return false;
            }

            const session = JSON.parse(sessionData);
            return Date.now() < session.expires;
        } catch (error) {
            return false;
        }
    }

    /**
     * Renova a sessão atual
     */
    renewSession() {
        if (this.isAuthenticated && this.currentUser) {
            this.saveSession(this.currentUser);
            console.log('🔄 Sessão renovada');
        }
    }

    /**
     * Obtém informações do usuário atual
     * @returns {Object|null}
     */
    getCurrentUser() {
        return this.isAuthenticated ? this.currentUser : null;
    }

    /**
     * Obtém role do usuário atual
     * @returns {string|null}
     */
    getCurrentRole() {
        return this.isAuthenticated ? this.userRole : null;
    }

    /**
     * Verifica se o usuário é admin
     * @returns {boolean}
     */
    isAdmin() {
        return this.userRole === CONFIG.AUTH.ROLES.ADMIN;
    }

    /**
     * Verifica se o usuário é gestor ou superior
     * @returns {boolean}
     */
    isManager() {
        return this.checkPermission(CONFIG.AUTH.ROLES.GESTOR);
    }
}

// Middleware para proteger páginas
function requireAuth(requiredRole = 'fotografo') {
    if (!window.authManager) {
        window.authManager = new AuthManager();
    }

    if (!window.authManager.checkPermission(requiredRole)) {
        return false;
    }

    // Renovar sessão se necessário
    window.authManager.renewSession();
    return true;
}

// Inicialização automática
document.addEventListener('DOMContentLoaded', () => {
    if (!window.authManager) {
        window.authManager = new AuthManager();
        console.log('🚀 AuthManager pronto para uso');
    }
});

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthManager, requireAuth };
}