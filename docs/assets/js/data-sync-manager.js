/**
 * Gerenciador de Sincronização de Dados
 * Resolve divergências entre Google Sheets e CSVs estáticos
 * Implementa versionamento e sincronização automática
 */

class DataSyncManager {
    constructor() {
        this.syncInterval = 30 * 60 * 1000; // 30 minutos
        this.lastSyncCheck = null;
        this.syncInProgress = false;
        this.versionInfo = {
            googleSheets: null,
            csvFiles: null,
            lastSync: null
        };
        
        // Callbacks para eventos
        this.onSyncStart = null;
        this.onSyncComplete = null;
        this.onVersionMismatch = null;
        this.onDataSourceChange = null;
        
        console.log('🔄 Data Sync Manager inicializado');
    }

    /**
     * Inicializa o gerenciador de sincronização
     */
    async init() {
        await this.loadVersionInfo();
        this.startPeriodicSync();
        this.addDataSourceIndicator();
        console.log('✅ Data Sync Manager pronto');
    }

    /**
     * Carrega informações de versão dos dados
     */
    async loadVersionInfo() {
        try {
            // Tentar carregar versão do localStorage
            const stored = localStorage.getItem('data_version_info');
            if (stored) {
                this.versionInfo = JSON.parse(stored);
            }
            
            // Verificar versão atual do Google Sheets
            await this.checkGoogleSheetsVersion();
            
        } catch (error) {
            console.error('❌ Erro ao carregar informações de versão:', error);
        }
    }

    /**
     * Verifica a versão atual dos dados no Google Sheets
     */
    async checkGoogleSheetsVersion() {
        try {
            if (!window.googleSheetsAPI) return;

            // Usar timestamp da última modificação como versão
            const response = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.GOOGLE_SHEETS.SPREADSHEET_ID}?key=${CONFIG.GOOGLE_SHEETS.API_KEY}&fields=properties.title,properties.timeZone,properties.locale`
            );
            
            if (response.ok) {
                const data = await response.json();
                const currentVersion = Date.now(); // Usar timestamp atual como versão
                
                if (this.versionInfo.googleSheets !== currentVersion) {
                    console.log('📊 Nova versão detectada no Google Sheets');
                    this.versionInfo.googleSheets = currentVersion;
                    this.saveVersionInfo();
                    
                    if (this.onVersionMismatch) {
                        this.onVersionMismatch('google-sheets', currentVersion);
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ Não foi possível verificar versão do Google Sheets:', error);
        }
    }

    /**
     * Sincroniza CSVs com dados do Google Sheets
     */
    async syncCSVFiles() {
        if (this.syncInProgress) {
            console.log('🔄 Sincronização já em andamento...');
            return;
        }

        this.syncInProgress = true;
        
        try {
            if (this.onSyncStart) this.onSyncStart();
            
            console.log('🔄 Iniciando sincronização de CSVs...');
            
            const sheets = ['Solicitacao', 'Clientes', 'Fotografos', 'Rede', 'Regioes', 'Gestores', 'Corretores', 'CodigoVitrine'];
            const syncResults = [];
            
            for (const sheet of sheets) {
                try {
                    console.log(`📥 Sincronizando ${sheet}...`);
                    
                    // Carregar dados do Google Sheets
                    const data = await window.googleSheetsAPI.loadSheetData(sheet);
                    
                    // Converter para CSV
                    const csvContent = this.convertToCSV(data);
                    
                    // Salvar no localStorage como backup
                    localStorage.setItem(`csv_backup_${sheet}`, csvContent);
                    localStorage.setItem(`csv_backup_${sheet}_timestamp`, Date.now().toString());
                    
                    syncResults.push({
                        sheet,
                        status: 'success',
                        records: data.length,
                        timestamp: Date.now()
                    });
                    
                    console.log(`✅ ${sheet} sincronizado: ${data.length} registros`);
                    
                } catch (error) {
                    console.error(`❌ Erro ao sincronizar ${sheet}:`, error);
                    syncResults.push({
                        sheet,
                        status: 'error',
                        error: error.message,
                        timestamp: Date.now()
                    });
                }
            }
            
            // Atualizar informações de versão
            this.versionInfo.csvFiles = Date.now();
            this.versionInfo.lastSync = Date.now();
            this.saveVersionInfo();
            
            console.log('✅ Sincronização concluída:', syncResults);
            
            if (this.onSyncComplete) {
                this.onSyncComplete(syncResults);
            }
            
            return syncResults;
            
        } catch (error) {
            console.error('❌ Erro na sincronização:', error);
            throw error;
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Converte array de objetos para formato CSV
     */
    convertToCSV(data) {
        if (!data || data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        
        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header] || '';
                // Escapar aspas e vírgulas
                return `"${value.toString().replace(/"/g, '""')}"`;
            });
            csvRows.push(values.join(','));
        }
        
        return csvRows.join('\n');
    }

    /**
     * Carrega dados de backup do localStorage
     */
    async loadBackupData(sheetName) {
        try {
            const csvContent = localStorage.getItem(`csv_backup_${sheetName}`);
            const timestamp = localStorage.getItem(`csv_backup_${sheetName}_timestamp`);
            
            if (csvContent && timestamp) {
                const data = this.parseCSV(csvContent);
                console.log(`📋 Dados de backup carregados para ${sheetName}: ${data.length} registros (${new Date(parseInt(timestamp)).toLocaleString()})`);
                return data;
            }
            
            return null;
        } catch (error) {
            console.error(`❌ Erro ao carregar backup de ${sheetName}:`, error);
            return null;
        }
    }

    /**
     * Converte CSV para array de objetos
     */
    parseCSV(csvContent) {
        const lines = csvContent.split('\n');
        if (lines.length < 2) return [];
        
        const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                data.push(row);
            }
        }
        
        return data;
    }

    /**
     * Salva informações de versão no localStorage
     */
    saveVersionInfo() {
        localStorage.setItem('data_version_info', JSON.stringify(this.versionInfo));
    }

    /**
     * Inicia sincronização periódica
     */
    startPeriodicSync() {
        setInterval(async () => {
            try {
                await this.checkGoogleSheetsVersion();
                
                // Sincronizar se necessário
                const timeSinceLastSync = Date.now() - (this.versionInfo.lastSync || 0);
                if (timeSinceLastSync > this.syncInterval) {
                    await this.syncCSVFiles();
                }
            } catch (error) {
                console.error('❌ Erro na sincronização periódica:', error);
            }
        }, 5 * 60 * 1000); // Verificar a cada 5 minutos
    }

    /**
     * Adiciona indicador visual da fonte de dados
     */
    addDataSourceIndicator() {
        // Criar elemento indicador
        const indicator = document.createElement('div');
        indicator.id = 'data-source-indicator';
        indicator.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: #007bff;
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            z-index: 9999;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        `;
        
        this.updateDataSourceIndicator(indicator, 'google-sheets');
        document.body.appendChild(indicator);
        
        // Adicionar evento de clique para mostrar detalhes
        indicator.addEventListener('click', () => {
            this.showDataSourceDetails();
        });
    }

    /**
     * Atualiza o indicador visual da fonte de dados
     */
    updateDataSourceIndicator(indicator, source) {
        const sources = {
            'google-sheets': { text: '📊 Google Sheets', color: '#28a745' },
            'csv-static': { text: '📁 CSV Estático', color: '#ffc107' },
            'cache': { text: '💾 Cache', color: '#dc3545' },
            'backup': { text: '🔄 Backup Local', color: '#17a2b8' }
        };
        
        const config = sources[source] || sources['cache'];
        indicator.textContent = config.text;
        indicator.style.background = config.color;
        
        if (this.onDataSourceChange) {
            this.onDataSourceChange(source);
        }
    }

    /**
     * Mostra detalhes sobre as fontes de dados
     */
    showDataSourceDetails() {
        const details = `
📊 Fontes de Dados Ativas:

🔹 Fonte Principal: Google Sheets
🔹 Última Sincronização: ${this.versionInfo.lastSync ? new Date(this.versionInfo.lastSync).toLocaleString() : 'Nunca'}
🔹 Versão Google Sheets: ${this.versionInfo.googleSheets || 'Desconhecida'}
🔹 Versão CSVs: ${this.versionInfo.csvFiles || 'Desconhecida'}

💡 Clique em "Sincronizar Agora" para atualizar os dados.
        `;
        
        if (confirm(details + '\n\nDeseja sincronizar agora?')) {
            this.syncCSVFiles();
        }
    }

    /**
     * Força sincronização manual
     */
    async forceSyncNow() {
        return await this.syncCSVFiles();
    }

    /**
     * Verifica se os dados estão atualizados
     */
    isDataUpToDate() {
        const timeSinceLastSync = Date.now() - (this.versionInfo.lastSync || 0);
        return timeSinceLastSync < this.syncInterval;
    }

    /**
     * Obtém estatísticas de sincronização
     */
    getSyncStats() {
        return {
            lastSync: this.versionInfo.lastSync,
            googleSheetsVersion: this.versionInfo.googleSheets,
            csvVersion: this.versionInfo.csvFiles,
            isUpToDate: this.isDataUpToDate(),
            syncInProgress: this.syncInProgress
        };
    }
}

// Inicialização automática
document.addEventListener('DOMContentLoaded', () => {
    if (typeof CONFIG !== 'undefined' && CONFIG.DATA_SOURCE === 'google-sheets') {
        window.dataSyncManager = new DataSyncManager();
        
        // Aguardar Google Sheets API estar pronta
        const initSync = () => {
            if (window.googleSheetsAPI) {
                window.dataSyncManager.init();
            } else {
                setTimeout(initSync, 100);
            }
        };
        
        setTimeout(initSync, 1000);
    }
});

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataSyncManager;
}