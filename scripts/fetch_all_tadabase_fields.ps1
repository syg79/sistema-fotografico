param(
    [string]$OutDir = "csv_output",
    [int]$PerPage = 200,
    [int]$MaxPages = 0 # 0 = todas as páginas
)

$ErrorActionPreference = 'Stop'

# Função para ler variáveis de ambiente
function Read-Env([string]$path){
    if(-not (Test-Path $path)){ throw "Arquivo .env não encontrado: $path" }
    $kv=@{}
    (Get-Content -Raw -Encoding UTF8 $path) -split "`r?`n" | ForEach-Object {
        if($_ -match '^(?<k>[^=]+)=(?<v>.*)$'){ $kv[$Matches.k]=$Matches.v }
    }
    return $kv
}

# Função para achatar valores complexos
function Flatten-Value($val){
    if($null -eq $val){ return '' }
    if(($val -is [string]) -or ($val -is [ValueType])){ return ''+$val }
    if($val -is [System.Collections.IEnumerable]){
        $out = New-Object System.Collections.Generic.List[string]
        foreach($it in $val){ $out.Add((Flatten-Value $it)) }
        return ($out | Where-Object { $_ -ne '' }) -join '; '
    }
    if($val -is [psobject]){
        foreach($k in 'title','record_title','name','val','label'){
            if($val.PSObject.Properties.Name -contains $k){ return ''+$val.$k }
        }
        return ''+$val
    }
    return ''+$val
}

# Função para buscar registros da API
function Fetch-Records([string]$base, $headers, [string]$tableId, [int]$per, [int]$max){
    $page = 1
    $allRecords = @()
    
    while($true){
        if($max -gt 0 -and $page -gt $max){ break }
        
        $url = "$base/data-tables/$tableId/records?per_page=$per&page=$page"
        Write-Host "Buscando pagina $page da API..."
        
        try{ 
            $resp = Invoke-RestMethod -Method GET -Uri $url -Headers $headers -TimeoutSec 120 
        } catch { 
            Write-Host "Erro na pagina $page ou fim dos dados."
            break 
        }
        
        $items = if($resp.data){ $resp.data } elseif($resp.items){ $resp.items } else { $resp }
        if(-not $items -or $items.Count -eq 0){ 
            Write-Host "Nenhum item encontrado na pagina $page. Finalizando."
            break 
        }
        
        $allRecords += $items
        Write-Host "Pagina $page`: $($items.Count) registros coletados."
        $page++
    }
    
    return $allRecords
}

# Função para escrever CSV com BOM UTF-8
function Write-CsvBom([string]$path, [array]$headers, [array]$rows){
    $utf8Bom = New-Object System.Text.UTF8Encoding($true)
    $sw = New-Object System.IO.StreamWriter($path, $false, $utf8Bom)
    try {
        # Escrever cabeçalhos
        $headerLine = ($headers | ForEach-Object { '"' + ($_ -replace '"', '""') + '"' }) -join ';'
        $sw.WriteLine($headerLine)
        
        # Escrever dados
        foreach($row in $rows){
            $values = @()
            foreach($h in $headers){
                $val = if($row.PSObject.Properties.Name -contains $h){ $row.$h } else { '' }
                $val = '"' + ((''+$val) -replace '"', '""') + '"'
                $values += $val
            }
            $sw.WriteLine(($values -join ';'))
        }
    } finally {
        $sw.Close()
    }
}

# Função para descobrir todos os campos de um registro
function Get-AllFieldNames($record){
    $fieldNames = @()
    foreach($prop in $record.PSObject.Properties){
        if($prop.Name -match '^field_\d+$' -or $prop.Name -eq 'id'){
            $fieldNames += $prop.Name
        }
    }
    return $fieldNames | Sort-Object
}

# === INÍCIO DO SCRIPT PRINCIPAL ===

Write-Host "=== FETCH ALL TADABASE FIELDS ==="
Write-Host "Buscando TODOS os campos da tabela o6WQb5NnBZ..."

# 1. Ler configurações
$envPath = Join-Path (Split-Path $PSScriptRoot) "config\.env"
$env = Read-Env $envPath

$base = $env.TADABASE_API_URL
$appId = $env.TADABASE_APP_ID
$apiKey = $env.TADABASE_APP_KEY
$tableId = "o6WQb5NnBZ"

if(-not $base -or -not $appId -or -not $apiKey){
    throw "Variaveis de ambiente nao configuradas corretamente no .env"
}

$auth = @{
    'X-Tadabase-App-id' = $appId
    'X-Tadabase-App-Key' = $apiKey
    'X-Tadabase-App-Secret' = $env.TADABASE_APP_SECRET
}

Write-Host "Configuração carregada. Base: $base"
Write-Host "App ID: $appId"
Write-Host "Tabela: $tableId"

# 2. Buscar todos os registros
$records = Fetch-Records $base $auth $tableId $PerPage $MaxPages
Write-Host "Total de registros coletados: $($records.Count)"

if($records.Count -eq 0){
    Write-Host "ERRO: Nenhum registro encontrado!"
    exit 1
}

# 3. Descobrir todos os campos únicos
Write-Host "Analisando campos disponíveis..."
$allFields = @()
foreach($record in $records){
    $fields = Get-AllFieldNames $record
    foreach($field in $fields){
        if($allFields -notcontains $field){
            $allFields += $field
        }
    }
}

$allFields = $allFields | Sort-Object
Write-Host "Campos descobertos: $($allFields.Count)"
Write-Host "Campos: $($allFields -join ', ')"

# 4. Processar todos os registros com todos os campos
Write-Host "Processando registros com todos os campos..."
$processedRows = @()

foreach($record in $records){
    $row = [ordered]@{}
    
    foreach($field in $allFields){
        if($field -eq 'id'){
            $row['record_id'] = ''+$record.id
        } else {
            $value = if($record.PSObject.Properties.Name -contains $field){
                Flatten-Value $record.$field
            } else {
                ''
            }
            $row[$field] = $value
        }
    }
    
    $processedRows += [pscustomobject]$row
}

# 5. Preparar cabeçalhos finais
$finalHeaders = @('record_id') + ($allFields | Where-Object { $_ -ne 'id' })

# 6. Salvar arquivo completo
$outputPath = Join-Path $OutDir "Solicitacao_ALL_FIELDS.csv"
Write-CsvBom $outputPath $finalHeaders $processedRows

Write-Host "=== CONCLUÍDO ==="
Write-Host "Arquivo salvo: $outputPath"
Write-Host "Total de registros: $($processedRows.Count)"
Write-Host "Total de campos: $($finalHeaders.Count)"
Write-Host "Todos os campos da tabela o6WQb5NnBZ foram extraídos com sucesso!"