param(
    [string]$OutDir = "csv_output\dictionaries",
    [int]$PerPage = 200,
    [int]$MaxPages = 200 # Máximo de páginas para buscar (200 páginas = 20000 registros)
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
        Write-Host "Buscando pagina $page da API CodigoVitrine..." -ForegroundColor Cyan
        
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
        Write-Host "Pagina $page - $($items.Count) registros coletados."
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
            $line = $values -join ';'
            $sw.WriteLine($line)
        }
    } finally {
        $sw.Close()
    }
}

# === INÍCIO DO SCRIPT PRINCIPAL ===

Write-Host "=== FETCH CODIGO VITRINE DATA ===" -ForegroundColor Yellow
Write-Host "Buscando dados da tabela CodigoVitrine (4YZjnDNPvl)..." -ForegroundColor Yellow

# 1. Ler configurações
$envPath = Join-Path (Split-Path $PSScriptRoot) "config\.env"
$env = Read-Env $envPath

$base = $env.TADABASE_API_URL
$appId = $env.TADABASE_APP_ID
$apiKey = $env.TADABASE_APP_KEY
$tableId = "4YZjnDNPvl"  # ID da tabela CodigoVitrine

if(-not $base -or -not $appId -or -not $apiKey){
    throw "Variaveis de ambiente nao configuradas corretamente no .env"
}

$auth = @{
    'X-Tadabase-App-id' = $appId
    'X-Tadabase-App-Key' = $apiKey
    'X-Tadabase-App-Secret' = $env.TADABASE_APP_SECRET
}

Write-Host "Configuração carregada. Base: $base" -ForegroundColor Green
Write-Host "App ID: $appId" -ForegroundColor Green
Write-Host "Tabela CodigoVitrine: $tableId" -ForegroundColor Green

# 2. Buscar todos os registros
$records = Fetch-Records $base $auth $tableId $PerPage $MaxPages
Write-Host "Total de registros CodigoVitrine coletados: $($records.Count)" -ForegroundColor Green

if($records.Count -eq 0){
    Write-Host "ERRO: Nenhum registro encontrado na tabela CodigoVitrine!" -ForegroundColor Red
    exit 1
}

# 3. Processar registros para o formato do dicionário
Write-Host "Processando registros CodigoVitrine..." -ForegroundColor Yellow
$processedRows = @()

foreach($record in $records){
    $row = [ordered]@{
        'id' = ''+$record.id
        'auto_increment' = Flatten-Value $record.auto_increment
        'created_at' = Flatten-Value $record.created_at
    }
    
    # Adicionar outros campos field_* se existirem
    foreach($prop in $record.PSObject.Properties){
        if($prop.Name -match '^field_\d+$'){
            $row[$prop.Name] = Flatten-Value $prop.Value
        }
    }
    
    $processedRows += [pscustomobject]$row
}

# 4. Preparar cabeçalhos
$headers = $processedRows[0].PSObject.Properties.Name

# 5. Criar diretório de saída se não existir
$outputDir = Join-Path (Split-Path $PSScriptRoot) $OutDir
if(-not (Test-Path $outputDir)){
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

# 6. Salvar arquivo atualizado
$outputPath = Join-Path $outputDir "CodigoVitrine.csv"
Write-CsvBom $outputPath $headers $processedRows

Write-Host "=== CONCLUÍDO ===" -ForegroundColor Green
Write-Host "Arquivo CodigoVitrine atualizado: $outputPath" -ForegroundColor Green
Write-Host "Total de registros: $($processedRows.Count)" -ForegroundColor Green
Write-Host "Campos: $($headers -join ', ')" -ForegroundColor Green
Write-Host "" 
Write-Host "O dicionário CodigoVitrine foi atualizado com os dados mais recentes da API!" -ForegroundColor Yellow