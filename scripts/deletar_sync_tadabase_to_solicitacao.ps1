# ========================================
# SCRIPT DE SINCRONIZACAO TADABASE -> SOLICITACAO.CSV
# ========================================
# Baseado na documentacao: DOCUMENTACAO_SINCRONIZACAO.md
# Data: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

param(
    [switch]$TestMode = $false,  # Modo teste (apenas 10 registros)
    [switch]$Backup = $true      # Fazer backup automatico
)

# Configuracoes
$ErrorActionPreference = "Stop"
$ProgressPreference = "Continue"

# Caminhos dos arquivos
$envFile = "D:\Projetos\Excel\config\.env"
$estruturaFile = "D:\Projetos\Excel\Estrutura_Solicitacao_CSV.csv"
$solicitacaoFile = "D:\Projetos\Excel\csv_output\Solicitacao.csv"
$dictionariesPath = "D:\Projetos\Excel\csv_output\dictionaries"

Write-Host "🚀 INICIANDO SINCRONIZACAO TADABASE -> SOLICITACAO.CSV" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Gray

# ========================================
# 1. CARREGAR CONFIGURACOES
# ========================================
Write-Host "📋 1. Carregando configuracoes..." -ForegroundColor Yellow

# Carregar variaveis do .env
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

Write-Host "   ✅ API URL: $apiUrl" -ForegroundColor Green
Write-Host "   ✅ Table ID: $tableId" -ForegroundColor Green

# ========================================
# 2. CARREGAR ESTRUTURA DE CAMPOS
# ========================================
Write-Host "\n📊 2. Carregando estrutura de campos..." -ForegroundColor Yellow

if (-not (Test-Path $estruturaFile)) {
    throw "Arquivo de estrutura nao encontrado: $estruturaFile"
}

$estrutura = Import-Csv $estruturaFile -Delimiter ';'
$fieldMap = @{}
$slugOrder = @()

foreach ($field in $estrutura) {
    $fieldName = $field.'Field Name'
    $fieldType = $field.'Field Type'
    $fieldSlug = $field.'Field Slug'
    $fieldId = $field.'Field ID'
    
    # Adicionar a ordem das colunas
    $slugOrder += $fieldSlug
    
    # Mapear Field ID -> Informacoes do campo
    if ($fieldId -and $fieldId.Trim() -ne "") {
        $fieldMap[$fieldId] = @{
            Name = $fieldName
            Type = $fieldType
            Slug = $fieldSlug
            Id = $fieldId
        }
    } else {
        # Campos especiais sem Field ID
        $fieldMap[$fieldSlug] = @{
            Name = $fieldName
            Type = $fieldType
            Slug = $fieldSlug
            Id = $null
            IsSpecial = $true
        }
    }
}

Write-Host "   ✅ Total de campos: $($estrutura.Count)" -ForegroundColor Green
Write-Host "   ✅ Campos com Field ID: $($fieldMap.Keys | Where-Object { $fieldMap[$_].Id }).Count" -ForegroundColor Green
Write-Host "   ✅ Campos especiais: $($fieldMap.Keys | Where-Object { $fieldMap[$_].IsSpecial }).Count" -ForegroundColor Green

# ========================================
# 3. CARREGAR DICIONARIOS
# ========================================
Write-Host "\n📚 3. Carregando dicionarios..." -ForegroundColor Yellow

$dictionaries = @{}
$dictionaryFiles = @(
    @{ Name = "Rede"; File = "Rede.csv" }
    @{ Name = "Clientes"; File = "Clientes.csv" }
    @{ Name = "Fotografos"; File = "Fotografos.csv" }
    @{ Name = "Corretores"; File = "Corretores.csv" }
    @{ Name = "Gestores"; File = "Gestores.csv" }
    @{ Name = "Regioes"; File = "Regioes.csv" }
    @{ Name = "CodigoVitrine"; File = "CodigoVitrine.csv" }
)

foreach ($dict in $dictionaryFiles) {
    $dictPath = Join-Path $dictionariesPath $dict.File
    if (Test-Path $dictPath) {
        $dictData = Import-Csv $dictPath -Delimiter ';'
        $dictionaries[$dict.Name] = @{}
        
        foreach ($row in $dictData) {
            $dictionaries[$dict.Name][$row.id] = $row
        }
        
        Write-Host "   ✅ $($dict.Name): $($dictData.Count) registros" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  $($dict.Name): Arquivo nao encontrado" -ForegroundColor Yellow
    }
}

# ========================================
# 4. FUNCAO PARA BUSCAR DADOS DA API
# ========================================
function Get-TadabaseData {
    param(
        [string]$Url,
        [hashtable]$Headers,
        [int]$Page = 1,
        [int]$Limit = 100
    )
    
    $requestUrl = "$Url?page=$Page&limit=$Limit"
    
    try {
        $response = Invoke-RestMethod -Uri $requestUrl -Headers $Headers -Method Get
        return $response
    } catch {
        Write-Error "Erro na requisicao API (Pagina $Page): $($_.Exception.Message)"
        return $null
    }
}

# ========================================
# 5. FUNCAO PARA RESOLVER CONEXOES
# ========================================
function Resolve-Connection {
    param(
        [string]$Value,
        [string]$DictionaryName
    )
    
    if (-not $Value -or $Value.Trim() -eq "") {
        return ""
    }
    
    if ($dictionaries.ContainsKey($DictionaryName) -and $dictionaries[$DictionaryName].ContainsKey($Value)) {
        $record = $dictionaries[$DictionaryName][$Value]
        # Tentar encontrar o campo de nome (geralmente field_XXX com nome)
        foreach ($prop in $record.PSObject.Properties) {
            if ($prop.Name -like "field_*" -and $prop.Value -and $prop.Value.Length -gt 1) {
                return $prop.Value
            }
        }
    }
    
    return $Value  # Retorna o ID original se nao conseguir resolver
}

# ========================================
# 6. FUNCAO PARA PROCESSAR VALOR DO CAMPO
# ========================================
function Process-FieldValue {
    param(
        [object]$Value,
        [string]$FieldType,
        [string]$FieldName
    )
    
    if ($null -eq $Value -or $Value -eq "") {
        return ""
    }
    
    switch ($FieldType) {
        "Connection" {
            # Determinar qual dicionario usar baseado no nome do campo
            $dictName = switch -Regex ($FieldName) {
                "Rede" { "Rede" }
                "Nome Cliente" { "Clientes" }
                "Fotografo" { "Fotografos" }
                "Corretor" { "Corretores" }
                "Gestor" { "Gestores" }
                "Bairro|Localidade" { "Regioes" }
                "Codigo Vitrine" { "CodigoVitrine" }
                default { $null }
            }
            
            if ($dictName) {
                return Resolve-Connection -Value $Value -DictionaryName $dictName
            }
            return $Value
        }
        
        "Address" {
            # Extrair endereco do objeto JSON
            if ($Value -is [string] -and $Value.StartsWith("{")) {
                try {
                    $addressObj = $Value | ConvertFrom-Json
                    return "$($addressObj.address), $($addressObj.city), $($addressObj.state)"
                } catch {
                    return $Value
                }
            }
            return $Value
        }
        
        "Link" {
            # Extrair link do objeto JSON
            if ($Value -is [string] -and $Value.StartsWith("{")) {
                try {
                    $linkObj = $Value | ConvertFrom-Json
                    return $linkObj.link
                } catch {
                    return $Value
                }
            }
            return $Value
        }
        
        default {
            return $Value.ToString()
        }
    }
}

# ========================================
# 7. BACKUP DO ARQUIVO ATUAL
# ========================================
if ($Backup -and (Test-Path $solicitacaoFile)) {
    Write-Host "\n💾 4. Fazendo backup..." -ForegroundColor Yellow
    $backupFile = $solicitacaoFile -replace "\.csv$", "_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').csv"
    Copy-Item $solicitacaoFile $backupFile
    Write-Host "   ✅ Backup salvo: $backupFile" -ForegroundColor Green
}

# ========================================
# 8. BUSCAR DADOS DO TADABASE
# ========================================
Write-Host "\n🔄 5. Buscando dados do Tadabase..." -ForegroundColor Yellow

$headers = @{
    'X-Tadabase-App-id' = $appId
    'X-Tadabase-App-Key' = $appKey
    'X-Tadabase-App-Secret' = $appSecret
    'Content-Type' = 'application/json'
}

$apiEndpoint = "$apiUrl/tables/$tableId/records"
$allRecords = @()
$page = 1
$limit = if ($TestMode) { 10 } else { 100 }

do {
    Write-Host "   📄 Buscando pagina $page..." -ForegroundColor Cyan
    
    $response = Get-TadabaseData -Url $apiEndpoint -Headers $headers -Page $page -Limit $limit
    
    if ($response -and $response.items) {
        $allRecords += $response.items
        Write-Host "   ✅ Pagina $page: $($response.items.Count) registros" -ForegroundColor Green
        
        if ($TestMode -and $allRecords.Count -ge 10) {
            break
        }
        
        $page++
    } else {
        break
    }
    
} while ($response -and $response.items -and $response.items.Count -eq $limit)

Write-Host "\n   🎯 Total de registros obtidos: $($allRecords.Count)" -ForegroundColor Green

# ========================================
# 9. PROCESSAR E SALVAR DADOS
# ========================================
Write-Host "\n📝 6. Processando e salvando dados..." -ForegroundColor Yellow

# Criar cabecalho
$csvContent = @()
$csvContent += $slugOrder -join ';'

# Processar cada registro
$processedCount = 0
foreach ($record in $allRecords) {
    $processedCount++
    Write-Progress -Activity "Processando registros" -Status "$processedCount de $($allRecords.Count)" -PercentComplete (($processedCount / $allRecords.Count) * 100)
    
    $csvRow = @()
    
    foreach ($slug in $slugOrder) {
        $fieldInfo = $fieldMap[$slug]
        if (-not $fieldInfo) {
            # Buscar por Field ID
            $fieldInfo = $fieldMap.Values | Where-Object { $_.Slug -eq $slug } | Select-Object -First 1
        }
        
        if ($fieldInfo) {
            if ($fieldInfo.IsSpecial) {
                # Campos especiais (auto_increment, id, created_at)
                $value = $record.$slug
            } else {
                # Campos customizados (usar Field ID)
                $value = $record.($fieldInfo.Id)
            }
            
            # Processar valor baseado no tipo
            $processedValue = Process-FieldValue -Value $value -FieldType $fieldInfo.Type -FieldName $fieldInfo.Name
            
            # Escapar aspas duplas e envolver em aspas se necessario
            if ($processedValue -and $processedValue.ToString().Contains(';')) {
                $processedValue = '"' + $processedValue.ToString().Replace('"', '""') + '"'
            }
            
            $csvRow += $processedValue
        } else {
            $csvRow += ""
        }
    }
    
    $csvContent += $csvRow -join ';'
}

# Salvar arquivo
$csvContent | Out-File -FilePath $solicitacaoFile -Encoding UTF8

Write-Host "\n✅ SINCRONIZACAO CONCLUIDA!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "📊 Registros processados: $($allRecords.Count)" -ForegroundColor Cyan
Write-Host "📁 Arquivo salvo: $solicitacaoFile" -ForegroundColor Cyan
Write-Host "📋 Colunas: $($slugOrder.Count)" -ForegroundColor Cyan

if ($TestMode) {
    Write-Host "\n⚠️  MODO TESTE ATIVO - Apenas $($allRecords.Count) registros processados" -ForegroundColor Yellow
}

Write-Host "\n🎉 Sincronizacao finalizada com sucesso!" -ForegroundColor Green