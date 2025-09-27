# Teste simples da API Tadabase
param(
    [switch]$TestConnection = $false
)

$ErrorActionPreference = "Stop"

# Carregar configurações
$envFile = "D:\Projetos\Excel\config\.env"

if (-not (Test-Path $envFile)) {
    throw "Arquivo .env nao encontrado: $envFile"
}

$envVars = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $envVars[$matches[1]] = $matches[2]
    }
}

$apiUrl = $envVars['TADABASE_API_URL']
$appId = $envVars['TADABASE_APP_ID']
$appKey = $envVars['TADABASE_APP_KEY']
$appSecret = $envVars['TADABASE_APP_SECRET']
$tableId = $envVars['SOLICITACAO_TABLE_ID']

Write-Host "=== CONFIGURAÇÕES ==="
Write-Host "API URL: $apiUrl"
Write-Host "App ID: $appId"
Write-Host "App Key: $appKey"
Write-Host "App Secret: $appSecret"
Write-Host "Table ID: $tableId"

$headers = @{
    'X-Tadabase-App-id' = $appId
    'X-Tadabase-App-Key' = $appKey
    'X-Tadabase-App-Secret' = $appSecret
    'Content-Type' = 'application/json'
}

# Teste 1: Buscar registros da tabela (formato correto)
$endpoint1 = "$apiUrl/data-tables/$tableId/records?page=1&limit=1"
Write-Host "Testando endpoint: $endpoint1" -ForegroundColor Yellow
try {
    $response1 = Invoke-RestMethod -Uri $endpoint1 -Headers $headers -Method GET
    Write-Host "Sucesso! Resposta:" -ForegroundColor Green
    $response1 | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

# Teste 2: Buscar mais registros
$endpoint2 = "$apiUrl/data-tables/$tableId/records?page=1&limit=5"
Write-Host "`nTestando endpoint: $endpoint2" -ForegroundColor Yellow
try {
    $response2 = Invoke-RestMethod -Uri $endpoint2 -Headers $headers -Method GET
    Write-Host "Sucesso! Resposta:" -ForegroundColor Green
    $response2 | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

# Teste 3: Verificar estrutura da resposta
$endpoint3 = "$apiUrl/data-tables/$tableId/records?page=1&limit=1"
Write-Host "`nTestando estrutura da resposta: $endpoint3" -ForegroundColor Yellow
try {
    $response3 = Invoke-RestMethod -Uri $endpoint3 -Headers $headers -Method GET
    Write-Host "Sucesso! Estrutura da resposta:" -ForegroundColor Green
    Write-Host "Tipo de objeto: $($response3.GetType().Name)" -ForegroundColor Cyan
    Write-Host "Propriedades disponíveis:" -ForegroundColor Cyan
    $response3.PSObject.Properties.Name | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
} catch {
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}