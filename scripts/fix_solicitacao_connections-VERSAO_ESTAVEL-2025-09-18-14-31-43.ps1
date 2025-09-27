param(
  [string]$CsvDir = "csv_output",
  [int]$PageSize = 200,
  [int]$MaxPages = 0 # 0 = todas
)

$ErrorActionPreference = 'Stop'

function Read-Env($path){
  if(-not (Test-Path $path)){ throw "Arquivo .env não encontrado: $path" }
  $kv=@{}; (Get-Content -Raw -Encoding UTF8 $path) -split "`r?`n" | % { if($_ -match '^(?<k>[^=]+)=(?<v>.*)$'){ $kv[$Matches.k]=$Matches.v } }
  return $kv
}

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
  }
  return ''+$val
}

function Fetch-Map(){
  $env = Read-Env "config/.env"
  $base = ($env['TADABASE_API_URL']).TrimEnd('/')
  $headers = @{ 'X-Tadabase-App-Id'=$env['TADABASE_APP_ID']; 'X-Tadabase-App-Key'=$env['TADABASE_APP_KEY']; 'X-Tadabase-App-Secret'=$env['TADABASE_APP_SECRET'] }
  $tableId = $env['SOLICITACAO_TABLE_ID']
  if(-not $tableId){ throw 'SOLICITACAO_TABLE_ID ausente no .env' }
  $page=1; $map=@{}
  while($true){
    if($MaxPages -gt 0 -and $page -gt $MaxPages){ break }
    $url = "$base/data-tables/$tableId/records?per_page=$PageSize&page=$page"
    try { $resp = Invoke-RestMethod -Method GET -Uri $url -Headers $headers -TimeoutSec 120 } catch { break }
    $items = if($resp.data){ $resp.data } elseif($resp.items){ $resp.items } else { $resp }
    if(-not $items -or $items.Count -eq 0){ break }
    foreach($it in $items){
      $rid = ''+$it.id
      if(-not $rid){ continue }
      $map[$rid] = [pscustomobject]@{
        rede                 = Flatten-Value $it.field_175
        nome_cliente         = Flatten-Value $it.field_86
        fotografo            = Flatten-Value $it.field_111
        bairro_localidade    = Flatten-Value $it.field_142
        tipo_do_servico      = Flatten-Value $it.field_92
        codigo_vitrine_automatico = Flatten-Value $it.field_390
        nao_possui_complemento    = Flatten-Value $it.field_212
        gestor               = Flatten-Value $it.field_431
      }
    }
    $page++
  }
  return $map
}

function Read-CsvUtf8([string]$path){
  Add-Type -AssemblyName Microsoft.VisualBasic | Out-Null
  $p = New-Object Microsoft.VisualBasic.FileIO.TextFieldParser($path,[Text.Encoding]::UTF8)
  $p.TextFieldType=[Microsoft.VisualBasic.FileIO.FieldType]::Delimited
  $p.Delimiters=@(';')
  $p.HasFieldsEnclosedInQuotes=$true
  $headers=$p.ReadFields()
  $rows=@()
  while(-not $p.EndOfData){ $f=$p.ReadFields(); $obj=[ordered]@{}; for($i=0;$i -lt $headers.Length;$i++){ $obj[$headers[$i]] = if($i -lt $f.Length){ $f[$i] } else { '' } }; $rows += [pscustomobject]$obj }
  $p.Close(); return @($headers,$rows)
}

function Write-CsvBom([string]$path,[string[]]$headers,[object[]]$rows){
  $enc = New-Object System.Text.UTF8Encoding($true)
  $sw = New-Object System.IO.StreamWriter($path,$false,$enc)
  try{ $sw.WriteLine( ($headers | % { '"' + ($_ -replace '"','""') + '"' }) -join ';' ); foreach($r in $rows){ $vals=@(); foreach($h in $headers){ $s=[string]$r.$h; $vals += ('"'+($s -replace '"','""')+'"') }; $sw.WriteLine(($vals -join ';')) } } finally { $sw.Flush(); $sw.Dispose() }
}

# Lê CSV local e cria mapa id->title
function Build-MapFromCsv([string]$path,[string]$idCol,[string]$titleCol){
  if(-not (Test-Path $path)){ return @{} }
  $csv = Read-CsvUtf8 $path
  $hdr = $csv[0]; $rows = $csv[1]
  if(-not ($hdr -contains $idCol) -or -not ($hdr -contains $titleCol)){ return @{} }
  $m=@{}; foreach($r in $rows){ $id=[string]$r.$idCol; $title=[string]$r.$titleCol; if($id){ $m[$id]=$title } }
  return $m
}

# Execução
$targetPath = Join-Path $CsvDir 'Solicitacao.csv'
if(-not (Test-Path $targetPath)){ throw "Arquivo não encontrado: $targetPath" }
$csv = Read-CsvUtf8 $targetPath
$hdr = $csv[0]; $rows = $csv[1]
$idxByName = @{}; for($i=0;$i -lt $hdr.Length;$i++){ $idxByName[$hdr[$i]] = $i }

$apiMap = Fetch-Map
if($apiMap.Count -eq 0){ throw 'Não obtive dados da API para Solicitacao' }

$cols = @('rede','nome_cliente','bairro_localidade','fotografo','tipo_do_servico','codigo_vitrine_automatico','nao_possui_complemento','gestor')

# Mapas locais id->title para conexões conhecidas
$mapRede       = Build-MapFromCsv (Join-Path $CsvDir 'Rede.csv')        'record_id' 'rede_imobiliaria_name'
$mapCliente    = Build-MapFromCsv (Join-Path $CsvDir 'Clientes.csv')    'record_id' 'nome_empresa'
$mapFotografo  = Build-MapFromCsv (Join-Path $CsvDir 'Fotografos.csv')  'record_id' 'nome_do_fotografo'
# Regiões: se existir arquivo baixado de Regiões (ou mapa local gerado)
$regLocal = Get-ChildItem -File -Recurse | Where-Object { $_.Name -match 'Regi(ões|oes).*\.csv$' } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$mapBairro = @{}
if($regLocal){
  # tentar colunas padrão
  $m1 = Build-MapFromCsv $regLocal.FullName 'record_id' 'bairro_name'
  if($m1.Count -gt 0){ $mapBairro = $m1 }
}

# Detectar e mapear fontes extras por padrão de nome de arquivo (para codigo_vitrine_automatico e gestor)
function Build-MapFromPattern([string]$fileRegex, [string[]]$titleRegexes){
  $file = Get-ChildItem -File -Recurse | Where-Object { $_.Name -match $fileRegex } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if(-not $file){ return @{} }
  # ler cabeçalho
  Add-Type -AssemblyName Microsoft.VisualBasic | Out-Null
  $p = New-Object Microsoft.VisualBasic.FileIO.TextFieldParser($file.FullName,[Text.Encoding]::UTF8)
  $p.TextFieldType=[Microsoft.VisualBasic.FileIO.FieldType]::Delimited; $p.Delimiters=@(';',','); $p.HasFieldsEnclosedInQuotes=$true
  $hdr=$p.ReadFields(); $headers=@(); foreach($h in $hdr){ $headers += ($h -replace '^[\uFEFF]', '') }
  $idCol = ($headers | Where-Object { $_ -match '^(?i)(record[_ ]?id|id)$' } | Select-Object -First 1)
  if(-not $idCol){ $p.Close(); return @{} }
  $titleCol = $null
  foreach($rx in $titleRegexes){ $titleCol = ($headers | Where-Object { $_ -match $rx } | Select-Object -First 1); if($titleCol){ break } }
  if(-not $titleCol){
    # fallback: primeira coluna não-sistêmica
    $titleCol = ($headers | Where-Object { $_ -notmatch '^(?i)(auto_increment|record[_ ]?id|created_at)$' } | Select-Object -First 1)
  }
  $rows=@{}; while(-not $p.EndOfData){ $f=$p.ReadFields(); $dict=@{}; for($i=0;$i -lt $headers.Length;$i++){ $dict[$headers[$i]] = if($i -lt $f.Length){ $f[$i] } else { '' } }; $id = [string]$dict[$idCol]; $title=[string]$dict[$titleCol]; if($id){ $rows[$id]=$title } }
  $p.Close(); return $rows
}

$mapCodVitrine = Build-MapFromPattern 'Codigo\s*Vitrine.*\.csv$' @('(?i)codigo\s*vitrine','(?i)titulo','(?i)name')
$mapGestor     = Build-MapFromPattern 'Gestores?.*Vitrine.*\.csv$' @('(?i)gestor','(?i)nome','(?i)name')
foreach($r in $rows){
  $rid = [string]$r.record_id
  if(-not $rid -or -not $apiMap.ContainsKey($rid)){ continue }
  $src = $apiMap[$rid]
  foreach($c in $cols){
    if(-not $idxByName.ContainsKey($c)){ continue }
    $val = [string]$r.$c
    # Substituir quando vier vazio/System.Object[]… ou quando o valor atual for um ID de 10 chars
    if($val -eq 'System.Object[]' -or [string]::IsNullOrWhiteSpace($val) -or ($val -eq $c) -or $val -match '(^|;\s*)[A-Za-z0-9]{10}(;|$)'){
      $candidate = $val
      if([string]::IsNullOrWhiteSpace($candidate) -or $candidate -eq 'System.Object[]'){
        $candidate = [string]$src.$c
      }
      # Mapear IDs -> títulos usando mapas locais
      if($candidate -and $candidate -match '[A-Za-z0-9]{10}'){
        $parts = $candidate -split ';\s*'
        $mapped = $parts | ForEach-Object {
          switch ($c) {
            'rede'             { if($mapRede.ContainsKey($_)){ $mapRede[$_] } else { $_ } }
            'nome_cliente'     { if($mapCliente.ContainsKey($_)){ $mapCliente[$_] } else { $_ } }
            'fotografo'        { if($mapFotografo.ContainsKey($_)){ $mapFotografo[$_] } else { $_ } }
            'bairro_localidade'{ if($mapBairro.ContainsKey($_)){ $mapBairro[$_] } else { $_ } }
            'codigo_vitrine_automatico' { if($mapCodVitrine.ContainsKey($_)){ $mapCodVitrine[$_] } else { $_ } }
            'gestor'           { if($mapGestor.ContainsKey($_)){ $mapGestor[$_] } else { $_ } }
            default            { $_ }
          }
        }
        $candidate = ($mapped -join '; ')
      }
      if($candidate){ $r.$c = $candidate }
    }
  }
}

Write-CsvBom -path $targetPath -headers $hdr -rows $rows
Write-Host "OK: Corrigidas colunas de conexões/multi em Solicitacao.csv usando valores da API."
