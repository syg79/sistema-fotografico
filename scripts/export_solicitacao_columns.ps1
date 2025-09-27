param(
  [string]$OutDir = "csv_output",
  [int]$PerPage = 200,
  [int]$MaxPages = 0 # 0 = todas
)

$ErrorActionPreference='Stop'

function Read-Env($path){
  if(-not (Test-Path $path)){ throw "Arquivo .env não encontrado: $path" }
  $kv=@{}; (Get-Content -Raw -Encoding UTF8 $path) -split "`r?`n" | % { if($_ -match '^(?<k>[^=]+)=(?<v>.*)$'){ $kv[$Matches.k]=$Matches.v } }
  return $kv
}

function Flatten($v){
  if($null -eq $v){ return '' }
  if(($v -is [string]) -or ($v -is [ValueType])){ return ''+$v }
  if($v -is [System.Collections.IEnumerable]){ $l = New-Object System.Collections.Generic.List[string]; foreach($i in $v){ $l.Add((Flatten $i)) }; return ($l | ? { $_ -ne '' }) -join '; ' }
  if($v -is [psobject]){ foreach($k in 'title','record_title','name','val','label'){ if($v.PSObject.Properties.Name -contains $k){ return ''+$v.$k } } }
  return ''+$v
}

function Fetch([string]$base,$headers,[string]$tableId,[int]$per,[int]$max){
  $page=1
  while($true){ if($max -gt 0 -and $page -gt $max){ break }; $url="$base/data-tables/$tableId/records?per_page=$per&page=$page"; try { $resp=Invoke-RestMethod -Method GET -Uri $url -Headers $headers -TimeoutSec 60 } catch { break }; $items= if($resp.data){ $resp.data } elseif($resp.items){ $resp.items } else { $resp }; if(-not $items -or $items.Count -eq 0){ break }; foreach($it in $items){ $it } ; $page++ }
}

function ReadCsvMap([string]$path,[string]$idCol,[string]$titleCol){
  if(-not (Test-Path $path)){ return @{} }
  Add-Type -AssemblyName Microsoft.VisualBasic | Out-Null
  $p=New-Object Microsoft.VisualBasic.FileIO.TextFieldParser($path,[Text.Encoding]::UTF8)
  $p.TextFieldType=[Microsoft.VisualBasic.FileIO.FieldType]::Delimited; $p.Delimiters=@(';',','); $p.HasFieldsEnclosedInQuotes=$true
  $hdr = $p.ReadFields(); $rows=@{}
  while(-not $p.EndOfData){ $f=$p.ReadFields(); $d=@{}; for($i=0;$i -lt $hdr.Length;$i++){ $col=($hdr[$i] -replace '^[\uFEFF]',''); $d[$col]= if($i -lt $f.Length){ $f[$i] } else { '' } }; $id=[string]$d[$idCol]; $name=[string]$d[$titleCol]; if($id){ $rows[$id]=$name } }
  $p.Close(); return $rows
}

# 1) Setup
$env = Read-Env 'config/.env'
$base = ($env['TADABASE_API_URL']).TrimEnd('/')
$auth = @{ 'X-Tadabase-App-Id'=$env['TADABASE_APP_ID']; 'X-Tadabase-App-Key'=$env['TADABASE_APP_KEY']; 'X-Tadabase-App-Secret'=$env['TADABASE_APP_SECRET'] }
$tableId = $env['SOLICITACAO_TABLE_ID']

# 2) local maps
$mapRede       = ReadCsvMap (Join-Path $OutDir 'Rede.csv') 'record_id' 'rede_imobiliaria_name'
$mapCliente    = ReadCsvMap (Join-Path $OutDir 'Clientes.csv') 'record_id' 'nome_empresa'
$mapFotografo  = ReadCsvMap (Join-Path $OutDir 'Fotografos.csv') 'record_id' 'nome_do_fotografo'
$mapBairro     = @{}
$reg = Get-ChildItem -File -Recurse | ? { $_.Name -match 'Regi(ões|oes).*\.csv$' } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if($reg){ $mapBairro = ReadCsvMap $reg.FullName 'record_id' 'bairro_name' }
$mapCodVit     = @{}
$cod = Get-ChildItem -File -Recurse | ? { $_.Name -match 'Codigo\s*Vitrine.*\.csv$' } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if($cod){ # tentar heurísticas de coluna de título
  foreach($t in @('codigo_vitrine','titulo','name')){ $tmp=ReadCsvMap $cod.FullName 'record_id' $t; if($tmp.Count -gt 0){ $mapCodVit = $tmp; break } }
}
$mapGestor     = @{}
$gest = Get-ChildItem -File -Recurse | ? { $_.Name -match 'Gestores?.*Vitrine.*\.csv$' } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if($gest){ foreach($t in @('gestor','nome','name')){ $tmp=ReadCsvMap $gest.FullName 'record_id' $t; if($tmp.Count -gt 0){ $mapGestor=$tmp; break } } }

# 3) Fetch from API and build minimal dataset
$rows = New-Object System.Collections.Generic.List[object]
foreach($it in (Fetch $base $auth $tableId $PerPage $MaxPages)){
  $rid = ''+$it.id
  $v_rede      = Flatten $it.field_175
  $v_cliente   = Flatten $it.field_86
  $v_fot       = Flatten $it.field_111
  $v_bairro    = Flatten $it.field_142
  $v_tipo_serv = Flatten $it.field_110
  $v_cod_vit   = Flatten $it.field_390
  $v_nao_comp  = Flatten $it.field_212
  $v_gestor    = Flatten $it.field_431
  # Map IDs -> títulos quando necessário
  if($v_rede -match '[A-Za-z0-9]{10}')      { $v_rede    = (($v_rede  -split ';\s*' | % { if($mapRede.ContainsKey($_)){ $mapRede[$_] } else { $_ } }) -join '; ') }
  if($v_cliente -match '[A-Za-z0-9]{10}')   { $v_cliente = (($v_cliente -split ';\s*' | % { if($mapCliente.ContainsKey($_)){ $mapCliente[$_] } else { $_ } }) -join '; ') }
  if($v_fot -match '[A-Za-z0-9]{10}')       { $v_fot     = (($v_fot   -split ';\s*' | % { if($mapFotografo.ContainsKey($_)){ $mapFotografo[$_] } else { $_ } }) -join '; ') }
  if($v_bairro -match '[A-Za-z0-9]{10}' -and $mapBairro.Count -gt 0){ $v_bairro = (($v_bairro -split ';\s*' | % { if($mapBairro.ContainsKey($_)){ $mapBairro[$_] } else { $_ } }) -join '; ') }
  if($v_cod_vit -match '[A-Za-z0-9]{10}' -and $mapCodVit.Count -gt 0){ $v_cod_vit = (($v_cod_vit -split ';\s*' | % { if($mapCodVit.ContainsKey($_)){ $mapCodVit[$_] } else { $_ } }) -join '; ') }
  if($v_gestor -match '[A-Za-z0-9]{10}' -and $mapGestor.Count -gt 0){ $v_gestor = (($v_gestor -split ';\s*' | % { if($mapGestor.ContainsKey($_)){ $mapGestor[$_] } else { $_ } }) -join '; ') }
  if($v_nao_comp -ne ''){ if($v_nao_comp -match '^(True|true|1)$'){ $v_nao_comp='Sim' } elseif($v_nao_comp -match '^(False|false|0)$'){ $v_nao_comp='Não' } }
  $rows.Add([pscustomobject]@{
    record_id = $rid
    rede = $v_rede
    nome_cliente = $v_cliente
    fotografo = $v_fot
    bairro_localidade = $v_bairro
    tipo_do_servico = $v_tipo_serv
    codigo_vitrine_automatico = $v_cod_vit
    nao_possui_complemento = $v_nao_comp
    gestor = $v_gestor
  })
}

if(-not (Test-Path $OutDir)){ New-Item -ItemType Directory -Force -Path $OutDir | Out-Null }
$outPath = Join-Path $OutDir 'Solicitacao_columns_fixed.csv'
Write-CsvBom -path $outPath -headers @('record_id','rede','nome_cliente','fotografo','bairro_localidade','tipo_do_servico','codigo_vitrine_automatico','nao_possui_complemento','gestor') -rows $rows
Write-Host "OK: Gerado $outPath com colunas corrigidas. Faça VLOOKUP/PowerQuery para mesclar no CSV principal."

