# Teste específico para field_94 (Endereco do Imovel)
# Tipo: Address
# Field ID: o6WQba5NnB

# Carregar credenciais
$envFile = "D:\Projetos\Excel\config\.env"
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

# Headers para API
$headers = @{
    'X-Tadabase-App-id' = $appId
    'X-Tadabase-App-Key' = $appKey
    'X-Tadabase-App-Secret' = $appSecret
    'Content-Type' = 'application/json'
}

# Função Process-FieldValue atualizada
function Process-FieldValue {
    param(
        [object]$Value,
        [string]$FieldType,
        [string]$FieldName
    )
    
    Write-Host "DEBUG: Processando campo '$FieldName' (Tipo: $FieldType)" -ForegroundColor Cyan
    if ($null -ne $Value) {
        Write-Host "DEBUG: Valor tipo: $($Value.GetType().Name)" -ForegroundColor Yellow
    } else {
        Write-Host "DEBUG: Valor tipo: NULL" -ForegroundColor Red
    }
    Write-Host "DEBUG: Valor bruto: $Value" -ForegroundColor Gray
    
    if ($null -eq $Value -or $Value -eq "") {
        Write-Host "DEBUG: Valor vazio ou nulo" -ForegroundColor Red
        return ""
    }
    
    # Tratar PSCustomObject com propriedade específica para Address
    if ($Value -is [PSCustomObject]) {
        Write-Host "DEBUG: É PSCustomObject" -ForegroundColor Magenta
        $props = $Value.PSObject.Properties.Name
        Write-Host "DEBUG: Propriedades: $($props -join ', ')" -ForegroundColor Magenta
        
        # Para campos Address, verificar propriedades típicas
        if ($props -contains 'address' -or $props -contains 'city' -or $props -contains 'state') {
            Write-Host "DEBUG: Processando como Address" -ForegroundColor Green
            $addressParts = @()
            if ($Value.address) { $addressParts += $Value.address }
            if ($Value.address2) { $addressParts += $Value.address2 }
            if ($Value.city) { $addressParts += $Value.city }
            if ($Value.state) { $addressParts += $Value.state }
            if ($Value.zip) { $addressParts += $Value.zip }
            $result = ($addressParts | Where-Object { $_ -and $_.Trim() -ne "" }) -join ", "
            Write-Host "DEBUG: Endereço processado: $result" -ForegroundColor Green
            return $result
        }
        
        # Para outros PSCustomObject, tentar converter para string
        $result = $Value | ConvertTo-Json -Compress
        Write-Host "DEBUG: Convertido para JSON: $result" -ForegroundColor Yellow
        return $result
    }
    
    # Para strings que começam com @{ (formato serializado)
    if ($Value -is [string] -and $Value.StartsWith("@{")) {
        Write-Host "DEBUG: String serializada detectada" -ForegroundColor Cyan
        # Tentar extrair informações de endereço
        if ($Value -match 'address=([^;]+)') {
            $address = $matches[1]
            Write-Host "DEBUG: Endereço extraído: $address" -ForegroundColor Green
            return $address
        }
        return $Value
    }
    
    Write-Host "DEBUG: Retornando valor original" -ForegroundColor Gray
    return $Value
}

# Buscar dados de teste
Write-Host "Buscando dados de teste da API..." -ForegroundColor Yellow
$url = "$apiUrl/data-tables/$tableId/records?page=1&limit=10"

try {
    $response = Invoke-RestMethod -Uri $url -Headers $headers -Method Get
    $records = $response.items
    
    Write-Host "Encontrados $($records.Count) registros para teste" -ForegroundColor Green
    
    foreach ($record in $records) {
        $recordId = $record.id
        $field94Value = $record."o6WQba5NnB"  # Field ID do field_94
        
        Write-Host "`n=== REGISTRO $recordId ===" -ForegroundColor White
        Write-Host "field_94 (bruto): $field94Value" -ForegroundColor Gray
        
        $processedValue = Process-FieldValue -Value $field94Value -FieldType "Address" -FieldName "Endereco do Imovel"
        
        Write-Host "field_94 (processado): $processedValue" -ForegroundColor Green
        Write-Host "" # linha em branco
    }
    
} catch {
    Write-Host "Erro na requisição: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "URL: $url" -ForegroundColor Yellow
}

Write-Host "Teste do field_94 concluído!" -ForegroundColor Green