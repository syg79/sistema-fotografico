param(
  [string]$OutDir = "csv_output",
  [int]$PerPage = 200,
  [int]$MaxPages = 0 # 0 = todas as páginas
)

$ErrorActionPreference = 'Stop'

function Read-Env([string]$path){
  if(-not (Test-Path $path)){ throw "Arquivo .env não encontrado: $path" }
  $kv=@{}
  (Get-Content -Raw -Encoding UTF8 $path) -split "`r?`n" | ForEach-Object {
    if($_ -match '^(?<k>[^=]+)=(?<v>.*)$'){ $kv[$Matches.k]=$Matches.v }
  }
  return $kv
}

function Flatten($v){
  if($null -eq $v){ return '' }
  if(($v -is [string]) -or ($v -is [ValueType])){ return ''+$v }
  if($v -is [System.Collections.IEnumerable]){ $buf=@(); foreach($i in $v){ $buf += (Flatten $i) }; return ($buf | Where-Object { $_ -ne '' }) -join '; ' }
  if($v -is [psobject]){ foreach($k in 'title','record_title','name','val','label'){ if($v.PSObject.Properties.Name -contains $k){ return ''+$v.$k } } }
  return ''+$v
}

function Fetch-Records([string]$base,$headers,[string]$tableId,[int]$per,[int]$max){
  $page=1
  while($true){
    if($max -gt 0 -and $page -gt $max){ break }
    $url = "$base/data-tables/$tableId/records?per_page=$per&page=$page"
    try{ $resp = Invoke-RestMethod -Method GET -Uri $url -Headers $headers -TimeoutSec 120 } catch { break }
    $items = if($resp.data){ $resp.data } elseif($resp.items){ $resp.items } else { $resp }
    if(-not $items -or $items.Count -eq 0){ break }
    foreach($it in $items){ $it }
    $page++
  }
}

function Get-Encoding([string]$path){
  $fs = [System.IO.File]::OpenRead($path)
  try {
    $buffer = New-Object byte[] 4
    $read = $fs.Read($buffer,0,4)
    if($read -ge 2 -and $buffer[0] -eq 0xFF -and $buffer[1] -eq 0xFE){ return [Text.Encoding]::Unicode }
    if($read -ge 2 -and $buffer[0] -eq 0xFE -and $buffer[1] -eq 0xFF){ return [Text.Encoding]::BigEndianUnicode }
    if($read -ge 3 -and $buffer[0] -eq 0xEF -and $buffer[1] -eq 0xBB -and $buffer[2] -eq 0xBF){ return [Text.Encoding]::UTF8 }
    return [Text.Encoding]::UTF8
  } finally { $fs.Close() }
}

function ReadCsvMap([string]$path,[string]$idCol,[string]$titleCol){
  if(-not (Test-Path $path)){ return @{} }
  Add-Type -AssemblyName Microsoft.VisualBasic | Out-Null
  $enc = Get-Encoding $path
  $p = New-Object Microsoft.VisualBasic.FileIO.TextFieldParser($path,$enc)
  $p.TextFieldType=[Microsoft.VisualBasic.FileIO.FieldType]::Delimited
  $p.Delimiters=@(';',',')
  $p.HasFieldsEnclosedInQuotes=$true
  $hdr=$p.ReadFields()
  # Normalizar cabeçalhos
  for($i=0;$i -lt $hdr.Length;$i++){ $hdr[$i] = ($hdr[$i] -replace '^[\uFEFF]','').Trim() }
  $map=@{}
  while(-not $p.EndOfData){
    $f=$p.ReadFields(); $d=@{}
    for($i=0;$i -lt $hdr.Length;$i++){ $col=$hdr[$i]; $d[$col]= if($i -lt $f.Length){ ($f[$i] -replace '^[\uFEFF]','') } else { '' } }
    $id=[string]$d[$idCol]; $title=[string]$d[$titleCol]
    if($id){ $map[$id]=$title }
  }
  $p.Close(); return $map
}

function WriteCsvBom([string]$path,[string[]]$headers,[object[]]$rows){
  $enc = New-Object System.Text.UTF8Encoding($true)
  $sw = New-Object System.IO.StreamWriter($path,$false,$enc)
  try{
    $sw.WriteLine( ($headers | ForEach-Object { '"' + ($_ -replace '"','""') + '"' }) -join ';' )
    foreach($r in $rows){
      $vals=@()
      foreach($h in $headers){ $vals += ('"' + (([string]$r.$h) -replace '"','""') + '"') }
      $sw.WriteLine(($vals -join ';'))
    }
  } finally { $sw.Flush(); $sw.Dispose() }
}

# 1) Preparar ambiente e mapas
$env = Read-Env 'config/.env'
$base = ($env['TADABASE_API_URL']).TrimEnd('/')
$auth = @{ 'X-Tadabase-App-Id'=$env['TADABASE_APP_ID']; 'X-Tadabase-App-Key'=$env['TADABASE_APP_KEY']; 'X-Tadabase-App-Secret'=$env['TADABASE_APP_SECRET'] }
$tableId = $env['SOLICITACAO_TABLE_ID']
if(-not $tableId){ throw 'SOLICITACAO_TABLE_ID ausente no .env' }

if(-not (Test-Path $OutDir)){ New-Item -ItemType Directory -Force -Path $OutDir | Out-Null }

$mapRede      = ReadCsvMap (Join-Path $OutDir 'Rede.csv') 'record_id' 'rede_imobiliaria_name'
$mapCliente   = ReadCsvMap (Join-Path $OutDir 'Clientes.csv') 'record_id' 'nome_empresa'
$mapFotografo = ReadCsvMap (Join-Path $OutDir 'Fotografos.csv') 'record_id' 'nome_do_fotografo'
$mapBairro    = @{}
$regCsv = Get-ChildItem -File -Recurse | Where-Object { $_.Name -match 'Regi(ões|oes).*\.csv$' } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if($regCsv){ $mapBairro = ReadCsvMap $regCsv.FullName 'record_id' 'bairro_name' }
$mapCodVit    = @{}
$codCsv = Get-ChildItem -File -Recurse | Where-Object { $_.Name -match 'Codigo\s*Vitrine.*\.csv$' } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if($codCsv){ foreach($t in @('Codigo Vitrine - Automatico','codigo_vitrine','Codigo Vitrine','titulo','name')){ $tmp=ReadCsvMap $codCsv.FullName 'Record ID' $t; if($tmp.Count -gt 0){ $mapCodVit=$tmp; break } }; if($mapCodVit.Count -eq 0){ foreach($t in @('codigo_vitrine','titulo','name')){ $tmp=ReadCsvMap $codCsv.FullName 'record_id' $t; if($tmp.Count -gt 0){ $mapCodVit=$tmp; break } } }
}
$mapGestor    = @{}
$gestCsv = Get-ChildItem -File -Recurse | Where-Object { $_.Name -match 'Gestores?.*Vitrine.*\.csv$' } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if($gestCsv){ foreach($t in @('gestor','nome','name')){ $tmp=ReadCsvMap $gestCsv.FullName 'record_id' $t; if($tmp.Count -gt 0){ $mapGestor=$tmp; break } } }
$mapCorretor  = @{}
$corrCsv = Get-ChildItem -File -Recurse | Where-Object { $_.Name -match 'Corretores.*\.csv$' -or $_.Name -match 'Corretor.*\.csv$' } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if($corrCsv){ foreach($t in @('corretor','nome','name')){ $tmp=ReadCsvMap $corrCsv.FullName 'record_id' $t; if($tmp.Count -gt 0){ $mapCorretor=$tmp; break } } }

# 2) Buscar dados
$rows = New-Object System.Collections.Generic.List[object]
foreach($it in (Fetch-Records $base $auth $tableId $PerPage $MaxPages)){
  $rid = ''+$it.id
  $v_rede    = Flatten $it.field_175
  $v_cli     = Flatten $it.field_86
  $v_fot     = Flatten $it.field_111
  $v_bairro  = Flatten $it.field_142
  $v_tipo    = Flatten $it.field_110
  $v_cod     = Flatten $it.field_390
  $v_naocomp = Flatten $it.field_212
  $v_gestor  = Flatten $it.field_431
  $v_corr    = Flatten $it.field_179

  function MapIds([string]$val,[hashtable]$map){ if([string]::IsNullOrWhiteSpace($val)){ return $val }; if($val -match '[A-Za-z0-9]{10}' -and $map.Count -gt 0){ return (($val -split ';\s*' | ForEach-Object { if($map.ContainsKey($_)){ $map[$_] } else { $_ } }) -join '; ') } else { return $val } }
  $v_rede    = MapIds $v_rede $mapRede
  $v_cli     = MapIds $v_cli $mapCliente
  $v_fot     = MapIds $v_fot $mapFotografo
  $v_bairro  = MapIds $v_bairro $mapBairro
  $v_cod     = MapIds $v_cod $mapCodVit
  $v_gestor  = MapIds $v_gestor $mapGestor
  $v_corr    = MapIds $v_corr $mapCorretor

  if($v_naocomp -ne ''){ if($v_naocomp -match '^(True|true|1)$'){ $v_naocomp='Sim' } elseif($v_naocomp -match '^(False|false|0)$'){ $v_naocomp='Não' } }

  $rows.Add([pscustomobject]@{
    record_id = $rid
    rede = $v_rede
    nome_cliente = $v_cli
    fotografo = $v_fot
    bairro_localidade = $v_bairro
    tipo_do_servico = $v_tipo
    codigo_vitrine_automatico = $v_cod
    nao_possui_complemento = $v_naocomp
    gestor = $v_gestor
    corretor_responsavel = $v_corr
  })
}

# 3) Escrever arquivo final com as colunas corrigidas
$outPath = Join-Path $OutDir 'Solicitacao_columns_fixed.csv'
WriteCsvBom $outPath @('record_id','rede','nome_cliente','fotografo','bairro_localidade','tipo_do_servico','codigo_vitrine_automatico','nao_possui_complemento','gestor','corretor_responsavel') $rows
Write-Host "OK: Gerado $outPath com colunas corrigidas."
