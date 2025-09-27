# Fluxo de Sincronização Excel → Google Sheets

## Visão Geral
Documentação completa do processo de sincronização entre o sistema offline (Excel) e o sistema online (Google Sheets + GitHub Pages).

## Fluxo Atual (Tadabase → Excel)

### **Processo Existente**:
```
Tadabase API → PowerShell Scripts → CSV Files → Excel (Main_Master.xlsx)
```

### **Scripts Atuais Identificados**:
- `sync_tadabase_to_solicitacao.ps1` - Sincronização principal
- `fix_solicitacao_connections.ps1` - Correção de conexões
- `validate_*.ps1` - Validação de dados
- `import_tadabase_to_vitrine.ps1` - Importação para vitrine

## Novo Fluxo Proposto (Híbrido)

### **Arquitetura Completa**:
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   TADABASE      │───▶│   EXCEL LOCAL    │───▶│  GOOGLE SHEETS  │
│   (Fonte)       │    │   (Secretaria)   │    │   (Ponte)       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   CSV FILES      │    │  GITHUB PAGES   │
                       │   (Backup)       │    │  (Interfaces)   │
                       └──────────────────┘    └─────────────────┘
```

## Implementação da Sincronização Excel → Google Sheets

### **1. Novo Script PowerShell: `sync_excel_to_googlesheets.ps1`**

#### **Funcionalidades**:
- Leitura dos arquivos CSV atuais
- Upload para Google Sheets via API
- Controle de alterações (diff)
- Log de sincronização
- Backup automático

#### **Estrutura do Script**:
```powershell
# Configurações
$configFile = "D:\Projetos\Excel\config\google_sheets_config.json"
$csvPath = "D:\Projetos\Excel\csv_output"
$logPath = "D:\Projetos\Excel\logs\sync_$(Get-Date -Format 'yyyyMMdd').log"

# Arquivos a sincronizar
$filesToSync = @(
    @{csv="Solicitacao.csv"; sheet="Solicitacoes"; range="A:DZ"},
    @{csv="dictionaries\Fotografos.csv"; sheet="Fotografos"; range="A:Z"},
    @{csv="dictionaries\Clientes.csv"; sheet="Clientes"; range="A:Z"},
    @{csv="dictionaries\Rede.csv"; sheet="Redes"; range="A:E"}
)
```

### **2. Configuração Google Sheets API**

#### **Arquivo: `google_sheets_config.json`**
```json
{
    "spreadsheet_id": "1ABC123...",
    "service_account_file": "D:\\Projetos\\Excel\\config\\service-account.json",
    "scopes": ["https://www.googleapis.com/auth/spreadsheets"],
    "sync_interval_minutes": 5,
    "max_retries": 3,
    "backup_enabled": true
}
```

#### **Service Account Setup**:
1. Criar projeto no Google Cloud Console
2. Ativar Google Sheets API
3. Criar Service Account
4. Baixar arquivo JSON de credenciais
5. Compartilhar planilha com email do Service Account

### **3. Detecção de Mudanças**

#### **Estratégia de Diff**:
```powershell
# Calcular hash dos arquivos CSV
$currentHash = Get-FileHash $csvFile -Algorithm SHA256
$lastHash = Get-Content "$csvFile.hash" -ErrorAction SilentlyContinue

if ($currentHash.Hash -ne $lastHash) {
    # Arquivo foi modificado, sincronizar
    Sync-ToGoogleSheets -File $csvFile
    $currentHash.Hash | Out-File "$csvFile.hash"
}
```

#### **Controle de Timestamp**:
- Campo `ultima_sincronizacao` em cada linha
- Comparação de `LastWriteTime` dos arquivos
- Log detalhado de alterações

### **4. Sincronização Bidirecional**

#### **Excel → Google Sheets (Imediato)**:
- Trigger: Alteração nos arquivos CSV
- Método: PowerShell + Google Sheets API
- Frequência: Imediata (FileSystemWatcher)

#### **Google Sheets → Excel (Controlado)**:
- Trigger: Webhook ou polling
- Método: Google Apps Script + PowerShell
- Frequência: A cada 15 minutos

### **5. Implementação do FileSystemWatcher**

#### **Script: `watch_csv_changes.ps1`**
```powershell
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = "D:\Projetos\Excel\csv_output"
$watcher.Filter = "*.csv"
$watcher.EnableRaisingEvents = $true

Register-ObjectEvent -InputObject $watcher -EventName "Changed" -Action {
    $file = $Event.SourceEventArgs.FullPath
    Write-Host "Arquivo alterado: $file"
    
    # Aguardar 2 segundos para garantir que o arquivo foi completamente escrito
    Start-Sleep -Seconds 2
    
    # Executar sincronização
    & "D:\Projetos\Excel\scripts\sync_excel_to_googlesheets.ps1" -File $file
}
```

## Configuração de Permissões

### **Google Sheets Permissions**:

#### **1. Service Account (Automação)**:
- **Email**: `sistema-fotografico@projeto.iam.gserviceaccount.com`
- **Permissão**: Editor
- **Uso**: Sincronização automática

#### **2. Secretaria**:
- **Email**: `secretaria@empresa.com`
- **Permissão**: Editor
- **Uso**: Acesso completo via interface web

#### **3. Fotógrafos**:
- **Emails**: Lista de emails dos fotógrafos
- **Permissão**: Visualizador + Edição limitada
- **Uso**: Atualização de status via GitHub Pages

#### **4. Editores**:
- **Emails**: Lista de emails dos editores
- **Permissão**: Visualizador + Edição de links
- **Uso**: Upload de arquivos editados

## Monitoramento e Logs

### **1. Log de Sincronização**:
```
[2024-01-15 10:30:15] INFO: Iniciando sincronização
[2024-01-15 10:30:16] INFO: Arquivo Solicitacao.csv alterado
[2024-01-15 10:30:17] SUCCESS: 15 linhas atualizadas no Google Sheets
[2024-01-15 10:30:18] INFO: Sincronização concluída em 3.2s
```

### **2. Dashboard de Status**:
- Última sincronização
- Número de registros sincronizados
- Erros e alertas
- Performance (tempo de sync)

### **3. Alertas**:
- Email em caso de falha na sincronização
- Notificação se sincronização demorar mais que 30s
- Alerta se Google Sheets ficar indisponível

## Backup e Recuperação

### **1. Backup Automático**:
```powershell
# Backup diário dos CSVs
$backupPath = "D:\Projetos\Excel\backups\$(Get-Date -Format 'yyyyMMdd')"
Copy-Item "D:\Projetos\Excel\csv_output\*" $backupPath -Recurse
```

### **2. Backup do Google Sheets**:
- Export automático diário para Google Drive
- Versionamento nativo do Google Sheets
- Backup local via API (JSON format)

### **3. Recuperação**:
```powershell
# Restaurar de backup
& "D:\Projetos\Excel\scripts\restore_from_backup.ps1" -Date "2024-01-15"
```

## Cronograma de Implementação

### **Fase 1: Setup Básico (1-2 dias)**
1. ✅ Criar Google Sheets com estrutura definida
2. ✅ Configurar Service Account e permissões
3. ✅ Desenvolver script básico de sincronização

### **Fase 2: Sincronização Automática (1 dia)**
1. ✅ Implementar FileSystemWatcher
2. ✅ Configurar detecção de mudanças
3. ✅ Testes de sincronização

### **Fase 3: Monitoramento (1 dia)**
1. ✅ Sistema de logs
2. ✅ Dashboard de status
3. ✅ Alertas e notificações

### **Fase 4: Integração com GitHub Pages (1 dia)**
1. ✅ APIs para leitura do Google Sheets
2. ✅ Interfaces web para fotógrafos/editores
3. ✅ Testes de integração completa

## Comandos de Execução

### **Sincronização Manual**:
```powershell
# Sincronização completa
.\scripts\sync_excel_to_googlesheets.ps1 -Full

# Sincronização de arquivo específico
.\scripts\sync_excel_to_googlesheets.ps1 -File "Solicitacao.csv"

# Modo de teste (sem alterações)
.\scripts\sync_excel_to_googlesheets.ps1 -TestMode
```

### **Monitoramento Contínuo**:
```powershell
# Iniciar monitoramento automático
.\scripts\watch_csv_changes.ps1

# Parar monitoramento
Stop-Job -Name "CSVWatcher"
```

## Considerações de Segurança

### **1. Credenciais**:
- Service Account JSON em local seguro
- Variáveis de ambiente para configurações sensíveis
- Rotação periódica de chaves

### **2. Acesso**:
- Princípio do menor privilégio
- Auditoria de acessos
- Revogação automática de usuários inativos

### **3. Dados**:
- Criptografia em trânsito (HTTPS)
- Backup criptografado
- Log de todas as alterações

---

**Status**: Documentação completa ✅  
**Próximo Passo**: Implementação dos scripts de sincronização