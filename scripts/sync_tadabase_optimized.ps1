# Script otimizado para sincronização Tadabase -> Solicitacao.csv
# Versão com processamento em lotes e progresso

param(
    [switch]$TestMode = $false,
    [switch]$Backup = $true
)

# Configurações
$apiUrl = "https://api.tadabase.io/api/v1"
$tableId = "o6WQb5NnBZ"
$appId = "DXQ80qgQYR"
$appKey = "GGnMopK42ONX"
$appSecret = "vqPOTT37VSLfQkBgZGd0ZVajf7Ry4Vkh"

$baseDir = "D:\Projetos\Excel"
$solicitacaoFile = "$baseDir\csv_output\Solicitacao.csv"
$dictionariesDir = "$baseDir\csv_output\dictionaries"

# Função para buscar dados do Tadabase
function Get-TadabaseData {
    param(
        [string]$Url,
        [hashtable]$Headers,
        [int]$Page = 1,
        [int]$Limit = 100
    )
    
    try {
        $params = @{
            page = $Page
            limit = $Limit
        }
        
        $queryString = ($params.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join "&"
        $fullUrl = "$Url?$queryString"
        
        $response = Invoke-RestMethod -Uri $fullUrl -Headers $Headers -Method Get
        return $response
    } catch {
        Write-Host "Erro na requisição: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Carregar dicionários
Write-Host "Carregando dicionários..." -ForegroundColor Yellow
$dictionaries = @{}

$dictionaryFiles = @(
    @{Name="Rede"; File="Rede.csv"; Delimiter=";"},
    @{Name="Clientes"; File="Clientes.csv"; Delimiter=","},
    @{Name="Fotografos"; File="Fotografos.csv"; Delimiter=";"},
    @{Name="Corretores"; File="Corretores.csv"; Delimiter=";"},
    @{Name="Gestores"; File="Gestores.csv"; Delimiter=";"},
    @{Name="Regioes"; File="Regioes.csv"; Delimiter=";"},
    @{Name="CodigoVitrine"; File="CodigoVitrine.csv"; Delimiter=";"}
)

foreach ($dict in $dictionaryFiles) {
    $dictPath = "$dictionariesDir\$($dict.File)"
    if (Test-Path $dictPath) {
        Write-Host "Carregando dicionário: $($dict.Name) de $dictPath" -ForegroundColor Cyan
        Write-Host "   -> Usando delimitador: $($dict.Delimiter)" -ForegroundColor Gray
        
        $data = Import-Csv -Path $dictPath -Delimiter $dict.Delimiter
        $dictionaries[$dict.Name] = @{}
        
        foreach ($row in $data) {
            if ($row.id -and $row.name) {
                $dictionaries[$dict.Name][$row.id] = $row.name
            }
        }
        
        Write-Host "   -> $($dictionaries[$dict.Name].Count) registros carregados" -ForegroundColor Green
    }
}

# Backup
if ($Backup -and (Test-Path $solicitacaoFile)) {
    Write-Host "Fazendo backup..." -ForegroundColor Yellow
    $backupFile = $solicitacaoFile -replace "\.csv$", "_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').csv"
    Copy-Item $solicitacaoFile $backupFile
    Write-Host "Backup salvo: $backupFile" -ForegroundColor Green
}

# Buscar dados
Write-Host "Buscando dados do Tadabase..." -ForegroundColor Yellow

$headers = @{
    'X-Tadabase-App-id' = $appId
    'X-Tadabase-App-Key' = $appKey
    'X-Tadabase-App-Secret' = $appSecret
    'Content-Type' = 'application/json'
}

$apiEndpoint = "$apiUrl/data-tables/$tableId/records"
$allRecords = @()
$page = 1
$limit = if ($TestMode) { 10 } else { 100 }

do {
    Write-Host "Buscando página $page..." -ForegroundColor Cyan
    
    $response = Get-TadabaseData -Url $apiEndpoint -Headers $headers -Page $page -Limit $limit
    
    if ($response -and $response.items) {
        $allRecords += $response.items
        Write-Host "Página $page - $($response.items.Count) registros" -ForegroundColor Green
        
        if ($TestMode -and $allRecords.Count -ge 10) {
            break
        }
        
        $page++
    } else {
        break
    }
    
} while ($response -and $response.items -and $response.items.Count -eq $limit)

Write-Host "Total de registros obtidos: $($allRecords.Count)" -ForegroundColor Green

# Processar dados em lotes
Write-Host "Processando dados em lotes..." -ForegroundColor Yellow

$csvContent = @()
$batchSize = 500
$totalRecords = $allRecords.Count
$processedCount = 0

# Cabeçalho simplificado
$csvContent += "id;Nome Cliente;Data Criacao;Status"

for ($i = 0; $i -lt $totalRecords; $i += $batchSize) {
    $endIndex = [Math]::Min($i + $batchSize - 1, $totalRecords - 1)
    $batch = $allRecords[$i..$endIndex]
    
    Write-Host "Processando lote $([Math]::Floor($i/$batchSize) + 1) - registros $($i+1) a $($endIndex+1)" -ForegroundColor Cyan
    
    foreach ($record in $batch) {
        $processedCount++
        
        # Extrair dados básicos
        $id = if ($record.id) { $record.id } else { "" }
        
        # Resolver nome do cliente
        $clienteNome = ""
        if ($record."field_1_val" -and $record."field_1_val"[0] -and $record."field_1_val"[0].val) {
            $clienteId = $record."field_1_val"[0].val
            if ($dictionaries["Clientes"][$clienteId]) {
                $clienteNome = $dictionaries["Clientes"][$clienteId]
            } else {
                $clienteNome = $clienteId
            }
        }
        
        # Data de criação
        $dataCriacao = if ($record.date_created) { $record.date_created } else { "" }
        
        # Status
        $status = if ($record.status) { $record.status } else { "" }
        
        # Criar linha CSV
        $csvRow = "$id;$clienteNome;$dataCriacao;$status"
        $csvContent += $csvRow
        
        # Mostrar progresso a cada 1000 registros
        if ($processedCount % 1000 -eq 0) {
            $percentComplete = [Math]::Round(($processedCount / $totalRecords) * 100, 1)
            Write-Host "   Progresso: $processedCount/$totalRecords ($percentComplete%)" -ForegroundColor Yellow
        }
    }
}

# Salvar arquivo
Write-Host "Salvando arquivo..." -ForegroundColor Yellow
$csvContent | Out-File -FilePath $solicitacaoFile -Encoding UTF8

Write-Host "SINCRONIZAÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host "Registros processados: $processedCount" -ForegroundColor Cyan
Write-Host "Arquivo salvo: $solicitacaoFile" -ForegroundColor Cyan

# Verificar alguns nomes de clientes
Write-Host "\nVerificando primeiros registros..." -ForegroundColor Yellow
$firstRecords = Import-Csv -Path $solicitacaoFile -Delimiter ";"
for ($i = 0; $i -lt [Math]::Min(5, $firstRecords.Count); $i++) {
    $record = $firstRecords[$i]
    Write-Host "ID: $($record.id) -> Cliente: $($record.'Nome Cliente')" -ForegroundColor Cyan
}

Write-Host "\nSincronização finalizada com sucesso!" -ForegroundColor Green