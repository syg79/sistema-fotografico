/**
 * Indicador de carregamento para melhorar UX durante carregamento de dados
 */

class LoadingIndicator {
    constructor() {
        this.overlay = null;
        this.progressBar = null;
        this.statusText = null;
        this.isVisible = false;
        this.createElements();
    }

    createElements() {
        // Criar overlay
        this.overlay = document.createElement('div');
        this.overlay.id = 'loading-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            font-family: Arial, sans-serif;
        `;

        // Criar container do loading
        const container = document.createElement('div');
        container.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            min-width: 300px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        `;

        // Criar spinner
        const spinner = document.createElement('div');
        spinner.style.cssText = `
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        `;

        // Adicionar animação CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);

        // Criar texto de status
        this.statusText = document.createElement('div');
        this.statusText.style.cssText = `
            font-size: 16px;
            color: #333;
            margin-bottom: 15px;
        `;
        this.statusText.textContent = 'Carregando dados...';

        // Criar barra de progresso
        const progressContainer = document.createElement('div');
        progressContainer.style.cssText = `
            width: 100%;
            height: 8px;
            background: #f0f0f0;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 10px;
        `;

        this.progressBar = document.createElement('div');
        this.progressBar.style.cssText = `
            height: 100%;
            background: #3498db;
            width: 0%;
            transition: width 0.3s ease;
        `;

        progressContainer.appendChild(this.progressBar);

        // Montar estrutura
        container.appendChild(spinner);
        container.appendChild(this.statusText);
        container.appendChild(progressContainer);
        this.overlay.appendChild(container);

        // Adicionar ao DOM
        document.body.appendChild(this.overlay);
    }

    show(message = 'Carregando dados...') {
        if (!this.isVisible) {
            this.statusText.textContent = message;
            this.progressBar.style.width = '0%';
            this.overlay.style.display = 'flex';
            this.isVisible = true;
        }
    }

    updateProgress(percentage, message) {
        if (this.isVisible) {
            this.progressBar.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
            if (message) {
                this.statusText.textContent = message;
            }
        }
    }

    updateStatus(message) {
        if (this.isVisible) {
            this.statusText.textContent = message;
        }
    }

    hide() {
        if (this.isVisible) {
            this.overlay.style.display = 'none';
            this.isVisible = false;
        }
    }

    destroy() {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        this.isVisible = false;
    }
}

// Instância global
window.loadingIndicator = new LoadingIndicator();

// Integração com CSV Loader
document.addEventListener('DOMContentLoaded', () => {
    if (window.csvLoader) {
        // Configurar callbacks do CSV Loader
        csvLoader.onLoadStart = (filename) => {
            loadingIndicator.show(`Carregando ${filename}...`);
        };

        csvLoader.onLoadComplete = (filename, data) => {
            loadingIndicator.hide();
        };

        csvLoader.onError = (filename, error) => {
            loadingIndicator.hide();
            console.error('Erro no carregamento:', error);
        };
    }
});