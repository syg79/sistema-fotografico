# Script de Sincronizacao Tadabase -> Solicitacao.csv
# Data: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

param(
    [switch]$TestMode = $false,
    [switch]$Backup = $true
)

$ErrorActionPreference = "Stop"

# Caminhos dos arquivos
$envFile = "D:\Projetos\Excel\config\.env"
$estruturaFile = "D:\Projetos\Excel\Estrutura_Solicitacao_CSV.csv"
$solicitacaoFile = "D:\Projetos\Excel\csv_output\Solicitacao.csv"
$dictionariesPath = "D:\Projetos\Excel\csv_output\dictionaries"

Write-Host "Iniciando sincronizacao Tadabase -> Solicitacao.csv" -ForegroundColor Green

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

Write-Host "API URL: $apiUrl" -ForegroundColor Green
Write-Host "Table ID: $tableId" -ForegroundColor Green

# ========================================
# MARCO VERSÃO ESTÁVEL - NÃO ALTERAR ORDEM DAS COLUNAS
# Data: 17/09/2024
# Status: 139 colunas funcionando corretamente
# IMPORTANTE: A ordem das colunas está baseada no arquivo Estrutura_Solicitacao_CSV.csv
# NÃO MODIFICAR a sequência de $slugOrder para manter compatibilidade
# ========================================

# Carregar estrutura de campos
if (-not (Test-Path $estruturaFile)) {
    throw "Arquivo de estrutura nao encontrado: $estruturaFile"
}

$estrutura = Import-Csv $estruturaFile -Delimiter ';'
$fieldMap = @{}
$slugOrder = @()  # CRÍTICO: Mantém a ordem exata das colunas - NÃO ALTERAR

foreach ($field in $estrutura) {
    $fieldName = $field.'Field Name'
    $fieldType = $field.'Field Type'
    $fieldSlug = $field.'Field Slug'
    $fieldId = $field.'Field ID'
    
    $slugOrder += $fieldName
    
    if ($fieldId -and $fieldId.Trim() -ne "") {
        $fieldMap[$fieldId] = @{
            Name = $fieldName
            Type = $fieldType
            Slug = $fieldSlug
            Id = $fieldId
        }
    } else {
        $fieldMap[$fieldSlug] = @{
            Name = $fieldName
            Type = $fieldType
            Slug = $fieldSlug
            Id = $null
            IsSpecial = $true
        }
    }
}

Write-Host "Total de campos: $($estrutura.Count)" -ForegroundColor Green

# Carregar dicionarios
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
        Write-Host "Carregando dicionario: $($dict.Name) de $dictPath" -ForegroundColor Yellow
        
        # Detectar delimitador automaticamente
        $firstLine = Get-Content $dictPath -First 1
        $delimiter = if ($firstLine.Contains(',') -and $firstLine.Contains('"')) { ',' } else { ';' }
        Write-Host "   -> Usando delimitador: $delimiter" -ForegroundColor Cyan
        
        $dictData = Import-Csv $dictPath -Delimiter $delimiter
        $dictionaries[$dict.Name] = @{}
        
        foreach ($row in $dictData) {
            # Usar 'Record ID' para o dicionário de Clientes, 'id' para outros
            $idField = if ($dict.Name -eq "Clientes") { $row."Record ID" } else { $row.id }
            if ($idField) {
                $dictionaries[$dict.Name][$idField] = $row
            }
        }
        
        # Debug: mostrar nomes dos campos para CodigoVitrine
        if ($dict.Name -eq "CodigoVitrine" -and $dictData.Count -gt 0) {
            Write-Host "   -> Campos disponíveis no CodigoVitrine: $($dictData[0].PSObject.Properties.Name -join ', ')" -ForegroundColor Magenta
        }
        
        Write-Host "   -> $($dictionaries[$dict.Name].Count) registros carregados" -ForegroundColor Green
    } else {
        Write-Host "   -> Arquivo nao encontrado: $dictPath" -ForegroundColor Red
    }
}

# Funcao para buscar dados da API
function Get-TadabaseData {
    param(
        [string]$Url,
        [hashtable]$Headers,
        [int]$Page = 1,
        [int]$Limit = 100
    )
    
    $ampersand = [char]38
    $requestUrl = $Url + "?page=" + $Page + $ampersand + "limit=" + $Limit
    
    try {
        $response = Invoke-RestMethod -Uri $requestUrl -Headers $Headers -Method Get
        return $response
    } catch {
        Write-Error "Erro na requisicao API (Pagina $Page): $($_.Exception.Message)"
        return $null
    }
}

# Funcao para resolver conexoes
function Resolve-Connection {
    param(
        [string]$Value,
        [string]$DictionaryName
    )
    
    if (-not $Value -or $Value.Trim() -eq "") {
        return ""
    }
    
    if ($dictionaries.ContainsKey($DictionaryName)) {
        if ($dictionaries[$DictionaryName].ContainsKey($Value)) {
            $record = $dictionaries[$DictionaryName][$Value]
            
            # Mapear campos específicos para cada dicionário
            switch ($DictionaryName) {
                "Clientes" { 
                    if ($record."Nome Empresa") { return $record."Nome Empresa" }
                }
                "Fotografos" { 
                    if ($record."Nome do Fotografo") { return $record."Nome do Fotografo" }
                    if ($record."field_290") { return $record."field_290" }
                }
                "Corretores" { 
                    if ($record."Nome do Corretor Responsável") { return $record."Nome do Corretor Responsável" }
                }
                "Gestores" { 
                    if ($record."Nome do gestor") { return $record."Nome do gestor" }
                }
                "Regioes" { 
                    if ($record."regiao_name") { return $record."regiao_name" }
                }
                "CodigoVitrine" { 
                    # VERSÃO DEFINITIVA - field_388 da tabela 4YZjnDNPvl - NÃO ALTERAR
                    # Data: 16/01/2025 - Confirmado que field_388 é o campo correto
                    if ($record."field_388") { return $record."field_388" }
                    if ($record."auto_increment") { return $record."auto_increment" }
                }
            }
            
            # Fallback: procurar por campos field_* (para dados da API)
            foreach ($prop in $record.PSObject.Properties) {
                if ($prop.Name -like "field_*" -and $prop.Value -and $prop.Value.Length -gt 1) {
                    return $prop.Value
                }
            }
        } else {
            # ID não encontrado no dicionário - tratar casos específicos
            if ($DictionaryName -eq "CodigoVitrine") {
                # VERSÃO DEFINITIVA - Usar o próprio ID como field_388 - NÃO ALTERAR
                # Data: 16/01/2025 - Solução para IDs não encontrados no dicionário
                # O campo "Codigo Vitrine" já contém o field_388 correto da tabela 4YZjnDNPvl
                Write-Host "ID CodigoVitrine não encontrado no dicionário, usando valor direto: $Value" -ForegroundColor Yellow
                return $Value  # Retorna o próprio field_388
            }
        }
    }
    
    return $Value
}

# Função para limpar caracteres especiais e entidades HTML
function Clean-SpecialCharacters {
    param([string]$Text)
    
    if ([string]::IsNullOrEmpty($Text)) {
        return ""
    }
    
    $cleanText = $Text
    
    # 1. PRIMEIRO: Decodificar entidades HTML usando System.Web.HttpUtility
    try {
        Add-Type -AssemblyName System.Web
        $cleanText = [System.Web.HttpUtility]::HtmlDecode($cleanText)
    }
    catch {
        # Fallback manual se System.Web não estiver disponível
        $cleanText = $cleanText -replace '&nbsp;', ' '
        $cleanText = $cleanText -replace '&amp;', '&'
        $cleanText = $cleanText -replace '&lt;', '<'
        $cleanText = $cleanText -replace '&gt;', '>'
        $cleanText = $cleanText -replace '&quot;', '"'
        $cleanText = $cleanText -replace '&#39;', "'"
        $cleanText = $cleanText -replace '&aacute;', 'á'
        $cleanText = $cleanText -replace '&eacute;', 'é'
        $cleanText = $cleanText -replace '&iacute;', 'í'
        $cleanText = $cleanText -replace '&oacute;', 'ó'
        $cleanText = $cleanText -replace '&uacute;', 'ú'
        $cleanText = $cleanText -replace '&atilde;', 'ã'
        $cleanText = $cleanText -replace '&otilde;', 'õ'
        $cleanText = $cleanText -replace '&ccedil;', 'ç'
        $cleanText = $cleanText -replace '&ecirc;', 'ê'
        $cleanText = $cleanText -replace '&ocirc;', 'ô'
        $cleanText = $cleanText -replace '&acirc;', 'â'
    }
    
    # 2. SEGUNDO: Corrigir problemas de codificação UTF-8 mal interpretada (apenas se ainda existirem)
    
    # Corrigir problemas de codificação UTF-8 mal interpretada
    $cleanText = $cleanText -replace 'Ã¡', 'á'
    $cleanText = $cleanText -replace 'Ã©', 'é'
    $cleanText = $cleanText -replace 'Ã­', 'í'
    $cleanText = $cleanText -replace 'Ã³', 'ó'
    $cleanText = $cleanText -replace 'Ãº', 'ú'
    $cleanText = $cleanText -replace 'Ã£', 'ã'
    $cleanText = $cleanText -replace 'Ãµ', 'õ'
    $cleanText = $cleanText -replace 'Ãª', 'ê'
    $cleanText = $cleanText -replace 'Ã´', 'ô'
    $cleanText = $cleanText -replace 'Ã¢', 'â'
    $cleanText = $cleanText -replace 'Ã§', 'ç'
    $cleanText = $cleanText -replace 'nÃ£o', 'não'
    $cleanText = $cleanText -replace 'imÃ³vel', 'imóvel'
    $cleanText = $cleanText -replace 'proprietÃ¡ria', 'proprietária'
    $cleanText = $cleanText -replace 'CondomÃ­nio', 'Condomínio'
    $cleanText = $cleanText -replace 'vÃ­deo', 'vídeo'
    $cleanText = $cleanText -replace 'Ã¡rea', 'área'
    $cleanText = $cleanText -replace 'referÃªncia', 'referência'
    $cleanText = $cleanText -replace 'lÃ¡', 'lá'
    
    return $cleanText
}

# Função para processar valores de campos baseado no tipo
# ⚠️ IMPORTANTE: Esta função foi otimizada para tratar campos Rich Text e HTML
# 🚫 NÃO ALTERAR: Função crítica para correção de &nbsp; nos campos concatenados
# Inclui tratamento específico para field_215, field_242, field_243, field_340, field_341, field_342, field_345
# NÃO ALTERAR sem testar completamente - corrige quebras de linha em CSV
# Última atualização: 2025-01-17 - Correção de campos HTML problemáticos
function Process-FieldValue {
    param(
        [object]$Value,
        [string]$FieldType,
        [string]$FieldName
    )
    
    if ($null -eq $Value -or $Value -eq "") {
        return ""
    }
    
    # Campos conhecidos que contêm HTML/Rich Text (baseado nos field IDs problemáticos)
    $richTextFields = @(
        "field_112",  # Observacao para o Fotografo
        "field_115",  # Feedback da Sessao (fotografo, gestor e/ou editor)
        "field_276",  # Observacao para o Agendamento
        "field_189",  # Observacao para o CLIENTE
        "field_385",  # Observacao feedback - sem quebrar
        "field_215",  # Mensagem - campos concatenados com &nbsp;
        "field_242",  # Campo concatenado com &nbsp;
        "field_243",  # Campo concatenado com &nbsp;
        "field_332",  # Formula endereço para mensagem de confirmacao - contém &nbsp;
        "field_340",  # Campo concatenado com &nbsp;
        "field_341",  # Campo concatenado com &nbsp;
        "field_342",  # Campo concatenado com &nbsp;
        "field_345"   # Campo concatenado com &nbsp;
    )
    
    # Se o campo está na lista de Rich Text conhecidos, forçar tratamento como Rich Text
    if ($richTextFields -contains $FieldName) {
        $FieldType = "Rich Text"
    }
    
    switch ($FieldType) {
        "Connection" {
            $dictName = switch -Regex ($FieldName) {
                "Rede" { "Rede" }
                "Nome Cliente|field_86" { "Clientes" }
                "Fotografo|field_111" { "Fotografos" }
                "Corretor|field_179" { "Corretores" }
                "Gestor|field_431" { "Gestores" }
                "Bairro|Localidade|field_142" { "Regioes" }
                "Codigo Vitrine|field_388" { "CodigoVitrine" }
                default { $null }
            }
            
            if ($dictName) {
                return Resolve-Connection -Value $Value -DictionaryName $dictName
            }
            return $Value
        }
        
        "Address" {
            # ===== VERSÃO DEFINITIVA FIELD_94 - NÃO ALTERAR =====
            # Tratar PSCustomObject com propriedades de endereço
            # Esta implementação está funcionando corretamente para endereços
            # Data: 17/09/2025 - Confirmado funcionamento correto
            if ($Value -is [PSCustomObject]) {
                $props = $Value.PSObject.Properties.Name
                if ($props -contains 'address' -or $props -contains 'city' -or $props -contains 'state') {
                    $addressParts = @()
                    if ($Value.address) { $addressParts += $Value.address }
                    if ($Value.address2) { $addressParts += $Value.address2 }
                    if ($Value.city) { $addressParts += $Value.city }
                    if ($Value.state) { $addressParts += $Value.state }
                    if ($Value.zip) { $addressParts += $Value.zip }
                    return ($addressParts | Where-Object { $_ -and $_.Trim() -ne "" }) -join ", "
                }
            }
            # ===== FIM VERSÃO DEFINITIVA FIELD_94 =====
            # Tratar strings JSON
            $openBrace = [char]123
            if ($Value -is [string] -and $Value.StartsWith($openBrace)) {
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
            # Tratar PSCustomObject com propriedade link
            if ($Value -is [PSCustomObject] -and $Value.PSObject.Properties.Name -contains 'link') {
                return $Value.link
            }
            # Tratar objetos @{link=...} que vêm da API como string
            if ($Value -is [string] -and $Value.StartsWith('@{')) {
                # Extrair o link do formato @{link=URL}
                if ($Value -match '@\{link=(.+)\}') {
                    return $matches[1]
                }
                return $Value
            }
            # Tratar JSON válido
            $openBrace = [char]123
            if ($Value -is [string] -and $Value.StartsWith($openBrace)) {
                try {
                    $linkObj = $Value | ConvertFrom-Json
                    return $linkObj.link
                } catch {
                    return $Value
                }
            }
            return $Value
        }
        
        "Rich Text" {
            # Tratar campos Rich Text removendo HTML e escapando quebras de linha
            $cleanValue = $Value.ToString()
            # Remover tags HTML básicas
            $cleanValue = $cleanValue -replace '<[^>]+>', ''
            # Usar função de limpeza de caracteres especiais
            $cleanValue = Clean-SpecialCharacters -Text $cleanValue
            # Escapar quebras de linha para evitar quebra do CSV
            $cleanValue = $cleanValue -replace '\r\n', ' '
            $cleanValue = $cleanValue -replace '\n', ' '
            $cleanValue = $cleanValue -replace '\r', ' '
            # Remover múltiplos espaços
            $cleanValue = $cleanValue -replace '\s+', ' '
            # Trim espaços extras
            return $cleanValue.Trim()
        }
        
        "Text" {
            # Aplicar mesmo tratamento para campos Text que podem conter HTML
            $cleanValue = $Value.ToString()
            # Verificar se contém tags HTML
            if ($cleanValue -match '<[^>]+>') {
                # Remover tags HTML
                $cleanValue = $cleanValue -replace '<[^>]+>', ''
            }
            # Usar função de limpeza de caracteres especiais
            $cleanValue = Clean-SpecialCharacters -Text $cleanValue
            # Escapar quebras de linha para evitar quebra do CSV
            $cleanValue = $cleanValue -replace '\r\n', ' '
            $cleanValue = $cleanValue -replace '\n', ' '
            $cleanValue = $cleanValue -replace '\r', ' '
            # Remover múltiplos espaços
            $cleanValue = $cleanValue -replace '\s+', ' '
            return $cleanValue.Trim()
            $cleanValue = $cleanValue -replace '\r\n', ' '
            $cleanValue = $cleanValue -replace '\n', ' '
            $cleanValue = $cleanValue -replace '\r', ' '
            # Remover múltiplos espaços
            $cleanValue = $cleanValue -replace '\s+', ' '
            return $cleanValue.Trim()
        }
        
        "Checkbox" {
            # Tratar campos checkbox que vêm como arrays
            if ($Value -is [array]) {
                # Juntar valores do array com vírgula
                $checkboxValues = $Value | Where-Object { $_ -and $_.ToString().Trim() -ne "" } | ForEach-Object { $_.ToString().Trim() }
                return ($checkboxValues -join ", ")
            }
            return $Value.ToString()
        }
        
        default {
            # Tratar arrays genéricos (como System.Object[])
            if ($Value -is [array]) {
                $arrayValues = $Value | Where-Object { $_ -and $_.ToString().Trim() -ne "" } | ForEach-Object { $_.ToString().Trim() }
                return ($arrayValues -join ", ")
            }
            
            # Para qualquer outro tipo, verificar se contém quebras de linha
            $stringValue = $Value.ToString()
            # Escapar quebras de linha para evitar quebra do CSV
            $stringValue = $stringValue -replace '\r\n', ' '
            $stringValue = $stringValue -replace '\n', ' '
            $stringValue = $stringValue -replace '\r', ' '
            # Remover múltiplos espaços
            $stringValue = $stringValue -replace '\s+', ' '
            return $stringValue.Trim()
        }
    }
}

# Backup do arquivo atual
if ($Backup -and (Test-Path $solicitacaoFile)) {
    Write-Host "Fazendo backup..." -ForegroundColor Yellow
    $backupFile = $solicitacaoFile -replace "\.csv$", "_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').csv"
    Copy-Item $solicitacaoFile $backupFile
    Write-Host "Backup salvo: $backupFile" -ForegroundColor Green
}

# Buscar dados do Tadabase
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
    Write-Host "Buscando pagina $page..." -ForegroundColor Cyan
    
    $response = Get-TadabaseData -Url $apiEndpoint -Headers $headers -Page $page -Limit $limit
    
    if ($response -and $response.items) {
        $allRecords += $response.items
        Write-Host "Pagina $page - $($response.items.Count) registros" -ForegroundColor Green
        
        if ($TestMode -and $allRecords.Count -ge 10) {
            break
        }
        
        $page++
    } else {
        break
    }
    
} while ($response -and $response.items -and $response.items.Count -eq $limit)

Write-Host "Total de registros obtidos: $($allRecords.Count)" -ForegroundColor Green

# Processar e salvar dados
Write-Host "Processando e salvando dados..." -ForegroundColor Yellow

# ========================================
# CRIAÇÃO DO CABEÇALHO - ORDEM PROTEGIDA
# ========================================
# ATENÇÃO: O cabeçalho é criado baseado em $slugOrder
# Esta ordem DEVE ser mantida para compatibilidade com sistemas existentes
# Qualquer alteração na ordem pode quebrar integrações

# Criar cabecalho
$csvContent = @()
$semicolon = [char]59
$csvContent += $slugOrder -join $semicolon  # NÃO ALTERAR A ORDEM

# Processar cada registro em lotes
$processedCount = 0
$batchSize = 250
$totalRecords = $allRecords.Count

Write-Host "Processando $totalRecords registros em lotes de $batchSize..." -ForegroundColor Yellow

for ($batchStart = 0; $batchStart -lt $totalRecords; $batchStart += $batchSize) {
    $batchEnd = [Math]::Min($batchStart + $batchSize - 1, $totalRecords - 1)
    $currentBatch = $allRecords[$batchStart..$batchEnd]
    
    $batchNumber = [Math]::Floor($batchStart / $batchSize) + 1
    $totalBatches = [Math]::Ceiling($totalRecords / $batchSize)
    
    Write-Host "Processando lote $batchNumber de $totalBatches (registros $($batchStart + 1) a $($batchEnd + 1))..." -ForegroundColor Cyan
    
    foreach ($record in $currentBatch) {
        $processedCount++
    
    # ========================================
    # PROCESSAMENTO DOS CAMPOS - ORDEM CRÍTICA
    # ========================================
    # IMPORTANTE: Os campos são processados na MESMA ORDEM do $slugOrder
    # Esta sequência garante que os dados correspondam aos cabeçalhos
    # NÃO ALTERAR a ordem de processamento
    
    # Processar cada campo na ordem definida
    $csvRow = @()
    
    foreach ($fieldName in $slugOrder) {  # MANTER esta ordem exata
        # Buscar informações do campo pelo nome
        $fieldInfo = $fieldMap.Values | Where-Object { $_.Name -eq $fieldName } | Select-Object -First 1
        if (-not $fieldInfo) {
            $fieldInfo = $fieldMap[$fieldName]
        }
        
        if ($fieldInfo) {
            if ($fieldInfo.IsSpecial) {
                $value = $record.($fieldInfo.Slug)
            } else {
                # Tentar buscar o valor com diferentes formatos
                $fieldId = $fieldInfo.Id
                $value = $null
                
                # Primeiro tentar o ID direto
                if ($record.$fieldId) {
                    $value = $record.$fieldId
                }
                # Se não encontrar, tentar com _val (para connections)
                elseif ($record."$($fieldId)_val") {
                    $connectionData = $record."$($fieldId)_val"
                    if ($connectionData -is [array] -and $connectionData.Count -gt 0) {
                        $value = $connectionData[0].val
                    }
                }
                # Se ainda não encontrar, tentar o slug
                elseif ($record.($fieldInfo.Slug)) {
                    $value = $record.($fieldInfo.Slug)
                }
            }
            
            # ===== CORREÇÃO CRÍTICA PARA CAMPOS CONNECTION - NÃO ALTERAR =====
            # IMPORTANTE: Esta correção resolve o problema de IDs não convertidos
            # Campos do tipo "Connection" DEVEM chamar Resolve-Connection ANTES de Process-FieldValue
            # Isso garante que IDs sejam convertidos para valores legíveis (ex: "PzQ4pZkQJG" -> "149862")
            # Data: 17/09/2025 - Correção implementada e testada com sucesso
            # NÃO REMOVER esta verificação - quebra a conversão de conexões
            if ($fieldInfo.Type -eq "Connection" -and $value) {
                $processedValue = Resolve-Connection -Value $value -DictionaryName $fieldInfo.Name
                # Depois aplicar formatação adicional se necessário
                $processedValue = Process-FieldValue -Value $processedValue -FieldType $fieldInfo.Type -FieldName $fieldInfo.Slug
            } else {
                $processedValue = Process-FieldValue -Value $value -FieldType $fieldInfo.Type -FieldName $fieldInfo.Slug
            }
            
            # Escapar aspas duplas e envolver em aspas se necessario
            if ($processedValue -and $processedValue.ToString().Contains($semicolon)) {
                $quote = '"'
                $processedValue = $quote + $processedValue.ToString().Replace($quote, $quote + $quote) + $quote
            }
            
            $csvRow += $processedValue
        } else {
            $csvRow += ""
        }
    }
    
        $csvContent += $csvRow -join $semicolon
        
        # Mostrar progresso a cada 50 registros dentro do lote
        if ($processedCount % 50 -eq 0) {
            $percentComplete = [Math]::Round(($processedCount / $totalRecords) * 100, 1)
            Write-Host "   Progresso: $processedCount/$totalRecords ($percentComplete%)" -ForegroundColor Yellow
        }
    }
    
    # Pausa entre lotes para evitar sobrecarga de memória
    if ($batchStart + $batchSize -lt $totalRecords) {
        Write-Host "   Lote $batchNumber concluído. Pausando 2 segundos..." -ForegroundColor Green
        Start-Sleep -Seconds 2
    }
}

# Salvar arquivo com codificação UTF-8 com BOM
if ($TestMode) {
    $testFile = "$($env:TEMP)\Solicitacao_test.csv"
    Write-Host "Salvando arquivo de teste com $($csvContent.Count) linhas..." -ForegroundColor Yellow
    $solicitacaoFile = $testFile
} else {
    Write-Host "Salvando arquivo com $($csvContent.Count) linhas..." -ForegroundColor Yellow
}

# Usar StreamWriter com UTF-8 BOM para preservar caracteres especiais
$enc = New-Object System.Text.UTF8Encoding($true)
$sw = New-Object System.IO.StreamWriter($solicitacaoFile, $false, $enc)
try {
    foreach ($line in $csvContent) {
        $sw.WriteLine($line)
    }
} finally {
    $sw.Flush()
    $sw.Dispose()
}

Write-Host "SINCRONIZACAO CONCLUIDA!" -ForegroundColor Green
Write-Host "Registros processados: $($allRecords.Count)" -ForegroundColor Cyan
Write-Host "Arquivo salvo: $solicitacaoFile" -ForegroundColor Cyan
Write-Host "Colunas: $($slugOrder.Count)" -ForegroundColor Cyan

if ($TestMode) {
    Write-Host "MODO TESTE ATIVO - Apenas $($allRecords.Count) registros processados" -ForegroundColor Yellow
}

Write-Host "Sincronizacao finalizada com sucesso!" -ForegroundColor Green