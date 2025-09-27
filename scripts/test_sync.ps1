# Script de teste para verificar o processamento
$ErrorActionPreference = "Stop"

# Carregar variáveis do .env
$envPath = "D:\Projetos\Excel\config\.env"
$apiUrl = ""
$tableId = ""
$appId = ""
$appKey = ""
$appSecret = ""

if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^TADABASE_API_URL=(.*)$') {
            $apiUrl = $matches[1]
        }
        elseif ($_ -match '^SOLICITACAO_TABLE_ID=(.*)$') {
            $tableId = $matches[1]
        }
        elseif ($_ -match '^TADABASE_APP_ID=(.*)$') {
            $appId = $matches[1]
        }
        elseif ($_ -match '^TADABASE_APP_KEY=(.*)$') {
            $appKey = $matches[1]
        }
        elseif ($_ -match '^TADABASE_APP_SECRET=(.*)$') {
            $appSecret = $matches[1]
        }
    }
}

Write-Host "API URL: $apiUrl"
Write-Host "Table ID: $tableId"

Write-Host "Testando busca de apenas 1 página..." -ForegroundColor Yellow

# Headers para autenticação
$headers = @{
    "X-Tadabase-App-id" = $appId
    "X-Tadabase-App-Key" = $appKey
    "X-Tadabase-App-Secret" = $appSecret
    "Content-Type" = "application/json"
}

# Buscar apenas a primeira página
try {
    $url = "$apiUrl/data-tables/$tableId/records?page=1&limit=5"
    Write-Host "URL: $url"
    
    $response = Invoke-RestMethod -Uri $url -Headers $headers -Method GET
    
    Write-Host "Registros obtidos: $($response.items.Count)" -ForegroundColor Green
    
    if ($response.items.Count -gt 0) {
        $firstRecord = $response.items[0]
        Write-Host "Campos do primeiro registro:" -ForegroundColor Cyan
        $firstRecord.PSObject.Properties | ForEach-Object {
            Write-Host "  $($_.Name): $($_.Value)"
        }
    }
    
} catch {
    Write-Host "Erro na busca: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Detalhes: $($_.Exception)" -ForegroundColor Red
}

Write-Host "Teste concluído!" -ForegroundColor Green