/**
 * Cliente para escrita via Google Apps Script
 * Permite criar e atualizar registros na planilha
 */

class GoogleSheetsWriter {
    static get appScriptUrl() {
        const url = CONFIG?.GOOGLE_SHEETS?.APP_SCRIPT_URL;
        if (!url) {
            throw new Error('APP_SCRIPT_URL não configurado em CONFIG.GOOGLE_SHEETS');
        }
        return url;
    }

    static get appToken() {
        const token = CONFIG?.GOOGLE_SHEETS?.APP_SCRIPT_TOKEN;
        if (!token) {
            throw new Error('APP_SCRIPT_TOKEN não configurado em CONFIG.GOOGLE_SHEETS');
        }
        return token;
    }

    static async post(action, payload = {}) {
        const body = JSON.stringify({
            token: this.appToken,
            action,
            ...payload
        });

        const response = await fetch(this.appScriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || data.error) {
            const errorMessage = data.error || response.statusText || 'Erro desconhecido no Apps Script';
            throw new Error(errorMessage);
        }

        return data;
    }

    /**
     * Cria uma nova solicitação
     * @param {Object} record Dados completos da solicitação
     */
    static createSolicitacao(record) {
        return this.post('create', { data: record });
    }

    /**
     * Atualiza campos de uma solicitação existente
     * @param {string} recordId Identificador único
     * @param {Object} updates Campos a atualizar
     */
    static updateSolicitacao(recordId, updates) {
        return this.post('update', { id: recordId, data: updates });
    }

    /**
     * Atualiza o status principal da solicitação
     * @param {string} recordId
     * @param {string} status
     * @param {Object} extraFields
     */
    static atualizarStatus(recordId, status, extraFields = {}) {
        return this.updateSolicitacao(recordId, { Status: status, ...extraFields });
    }

    /**
     * Marca a solicitação como publicada
     * @param {string} recordId
     */
    static marcarPublicado(recordId) {
        return this.atualizarStatus(recordId, 'Publicado', { 'Publicar Agenda': 'Sim' });
    }

    /**
     * Gera o próximo código vitrine e atualiza a solicitação
     * @param {string} recordId Identificador da solicitação
     * @param {string} status Novo status (opcional)
     */
    static gerarCodigoVitrine(recordId, status = 'Realizado') {
        return this.post('codigo', { solicitacaoId: recordId, status });
    }

    /**
     * Registra um evento de status manualmente (opcional)
     * @param {string} recordId
     * @param {string} status
     * @param {string} usuario
     */
    static registrarStatus(recordId, status, usuario) {
        return this.post('statusLog', { recordId, status, usuario });
    }

    /**
     * Marca a solicitação como editada
     * @param {string} recordId
     */
    static marcarEditado(recordId) {
        return this.updateSolicitacao(recordId, {
            Status: 'Editado',
            Editado: 'Sim'
        });
    }
}

// Disponibiliza no escopo global
window.googleSheetsWriter = GoogleSheetsWriter;

// Compatibilidade com CommonJS (tests/scripts)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoogleSheetsWriter;
}
