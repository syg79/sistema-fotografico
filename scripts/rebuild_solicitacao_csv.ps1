param(
  [string]$CsvDir = "csv_output",
  [int]$PerPage = 200,
  [int]$MaxPages = 0 # 0 = todas
)

$ErrorActionPreference = 'Stop'

function Read-Env($path){
  if(-not (Test-Path $path)){ throw "Arquivo .env não encontrado: $path" }
  $kv=@{}; (Get-Content -Raw -Encoding UTF8 $path) -split "`r?`n" | % { if($_ -match '^(?<k>[^=]+)=(?<v>.*)$'){ $kv[$Matches.k]=$Matches.v } }
  return $kv
}

function Read-Headers-FromCsv([string]$path){
  Add-Type -AssemblyName Microsoft.VisualBasic | Out-Null
  $p = New-Object Microsoft.VisualBasic.FileIO.TextFieldParser($path,[Text.Encoding]::UTF8)
  $p.TextFieldType=[Microsoft.VisualBasic.FileIO.FieldType]::Delimited; $p.Delimiters=@(';'); $p.HasFieldsEnclosedInQuotes=$true
  $hdr = $p.ReadFields(); $p.Close()
  $headers=@(); foreach($h in $hdr){ $headers += ($h -replace '^[\uFEFF]', '') }
  return $headers
}

function Load-Dicionario([string]$vitrinePath){
  $excel=$null;$wb=$null;$ws=$null;$map=@{}
  try{
    $excel=New-Object -ComObject Excel.Application; $excel.Visible=$false
    $wb=$excel.Workbooks.Open((Resolve-Path $vitrinePath))
    $ws=$wb.Worksheets.Item('dicionario')
    $last=$ws.Cells.Find('*',[Type]::Missing,[Type]::Missing,[Type]::Missing,[Microsoft.Office.Interop.Excel.XlSearchOrder]::xlByRows,[Microsoft.Office.Interop.Excel.XlSearchDirection]::xlPrevious,$false)
    $lastRow=if($last){$last.Row}else{1}
    for($r=2;$r -le $lastRow;$r++){
      $tab=[string]$ws.Cells.Item($r,1).Value2; if($tab -ne 'solicitacoes' -and $tab -ne 'Solicitacao'){ continue }
      $dest=[string]$ws.Cells.Item($r,5).Value2; $slug=[string]$ws.Cells.Item($r,4).Value2; $tipo=[string]$ws.Cells.Item($r,6).Value2
      if($dest -and $slug){ $map[$dest]=@{ slug=$slug; tipo=$tipo } }
    }
  } finally { if($wb){$wb.Close($false)}; if($excel){$excel.Quit()} }
  return $map
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

function Fetch-Records([string]$base,$headersAuth,[string]$tableId,[int]$per,[int]$max){
  $page=1
  while($true){
    if($max -gt 0 -and $page -gt $max){ break }
    $url = "$base/data-tables/$tableId/records?per_page=$per&page=$page"
    try{ $resp=Invoke-RestMethod -Method GET -Uri $url -Headers $headersAuth -TimeoutSec 120 } catch { break }
    $items = if($resp.data){ $resp.data } elseif($resp.items){ $resp.items } else { $resp }
    if(-not $items -or $items.Count -eq 0){ break }
    foreach($it in $items){ $it }
    $page++
  }
}

function Build-MapFromCsv([string]$path,[string]$idCol,[string]$titleCol){
  if(-not (Test-Path $path)){ return @{} }
  Add-Type -AssemblyName Microsoft.VisualBasic | Out-Null
  $p=New-Object Microsoft.VisualBasic.FileIO.TextFieldParser($path,[Text.Encoding]::UTF8)
  $p.TextFieldType=[Microsoft.VisualBasic.FileIO.FieldType]::Delimited; $p.Delimiters=@(';',','); $p.HasFieldsEnclosedInQuotes=$true
  $hdr=$p.ReadFields(); $rows=@{}; while(-not $p.EndOfData){ $f=$p.ReadFields(); $dict=@{}; for($i=0;$i -lt $hdr.Length;$i++){ $col=($hdr[$i] -replace '^[\uFEFF]', ''); $dict[$col]= if($i -lt $f.Length){ $f[$i] } else { '' } }; $id=[string]$dict[$idCol]; $title=[string]$dict[$titleCol]; if($id){ $rows[$id]=$title } }; $p.Close(); return $rows
}

function Write-CsvBom([string]$path,[string[]]$headers,[object[]]$rows){
  $enc = New-Object System.Text.UTF8Encoding($true)
  $sw = New-Object System.IO.StreamWriter($path,$false,$enc)
  try{ $sw.WriteLine( ($headers | % { '"'+($_ -replace '"','""')+'"' }) -join ';' ); foreach($r in $rows){ $vals=@(); foreach($h in $headers){ $s=[string]$r.$h; $vals += ('"'+($s -replace '"','""')+'"') }; $sw.WriteLine(($vals -join ';')) } } finally { $sw.Flush(); $sw.Dispose() }
}

# Main
$env = Read-Env 'config/.env'
$base = ($env['TADABASE_API_URL']).TrimEnd('/')
$auth = @{ 'X-Tadabase-App-Id'=$env['TADABASE_APP_ID']; 'X-Tadabase-App-Key'=$env['TADABASE_APP_KEY']; 'X-Tadabase-App-Secret'=$env['TADABASE_APP_SECRET'] }
$tableId = $env['SOLICITACAO_TABLE_ID']
if(-not $tableId){ throw 'SOLICITACAO_TABLE_ID ausente no .env' }

$targetPath = Join-Path $CsvDir 'Solicitacao.csv'
$headers = if(Test-Path $targetPath){ Read-Headers-FromCsv $targetPath } else { throw 'Solicitacao.csv não encontrado para obter cabeçalhos.' }
$dict = Load-Dicionario 'Vitrine.xlsx'

# Prepare local maps for connections (IDs -> títulos)
$mapRede       = Build-MapFromCsv (Join-Path $CsvDir 'Rede.csv')       'record_id' 'rede_imobiliaria_name'
$mapCliente    = Build-MapFromCsv (Join-Path $CsvDir 'Clientes.csv')   'record_id' 'nome_empresa'
$mapFotografo  = Build-MapFromCsv (Join-Path $CsvDir 'Fotografos.csv') 'record_id' 'nome_do_fotografo'
$regFile = Get-ChildItem -File -Recurse | Where-Object { $_.Name -match 'Regi(ões|oes).*\.csv$' } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$mapBairro = if($regFile){ Build-MapFromCsv $regFile.FullName 'record_id' 'bairro_name' } else { @{} }
# padrões adicionais
$mapCodVit = @{}
# gestor
$mapGestor=@{}
$gestFile = Get-ChildItem -File -Recurse | Where-Object { $_.Name -match 'Gestores?.*Vitrine.*\.csv$' } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if($gestFile){
  # tentar detectar coluna de nome
  Add-Type -AssemblyName Microsoft.VisualBasic | Out-Null
  $p=New-Object Microsoft.VisualBasic.FileIO.TextFieldParser($gestFile.FullName,[Text.Encoding]::UTF8)
  $p.TextFieldType=[Microsoft.VisualBasic.FileIO.FieldType]::Delimited; $p.Delimiters=@(';',','); $p.HasFieldsEnclosedInQuotes=$true
  $hdr=$p.ReadFields(); $headersG=@(); foreach($h in $hdr){ $headersG += ($h -replace '^[\uFEFF]', '') }
  $idCol = ($headersG | Where-Object { $_ -match '^(?i)(record[_ ]?id|id)$' } | Select-Object -First 1)
  $nameCol = ($headersG | Where-Object { $_ -match '(?i)(gestor|nome|name)' } | Select-Object -First 1)
  $rows=@{}; while(-not $p.EndOfData){ $f=$p.ReadFields(); $dictL=@{}; for($i=0;$i -lt $headersG.Length;$i++){ $dictL[$headersG[$i]] = if($i -lt $f.Length){ $f[$i] } else { '' } }; $id=[string]$dictL[$idCol]; $nm=[string]$dictL[$nameCol]; if($id){ $rows[$id]=$nm } }; $p.Close(); $mapGestor=$rows
}

# fetch
$records = Fetch-Records $base $auth $tableId $PerPage $MaxPages
$outRows = New-Object System.Collections.Generic.List[object]
foreach($rec in $records){
  $obj=[ordered]@{}
  foreach($h in $headers){
    $v=''
    if($h -eq 'record_id'){
      $v = ''+$rec.id
    }
    elseif($dict.ContainsKey($h)){
      $slug=$dict[$h].slug; $v0=$null
      if($rec.PSObject.Properties.Name -contains $slug){ $v0 = $rec.$slug }
      $v = Flatten-Value $v0
      if($h -match '^(rede)$' -and $v -match '[A-Za-z0-9]{10}'){
        $parts=$v -split ';\s*'; $v = (($parts | % { if($mapRede.ContainsKey($_)){ $mapRede[$_] } else { $_ } }) -join '; ')
      }
      elseif($h -eq 'nome_cliente' -and $v -match '[A-Za-z0-9]{10}'){
        $parts=$v -split ';\s*'; $v = (($parts | % { if($mapCliente.ContainsKey($_)){ $mapCliente[$_] } else { $_ } }) -join '; ')
      }
      elseif($h -eq 'fotografo' -and $v -match '[A-Za-z0-9]{10}'){
        $parts=$v -split ';\s*'; $v = (($parts | % { if($mapFotografo.ContainsKey($_)){ $mapFotografo[$_] } else { $_ } }) -join '; ')
      }
      elseif($h -eq 'bairro_localidade' -and $v -match '[A-Za-z0-9]{10}'){
        $parts=$v -split ';\s*'; $v = (($parts | % { if($mapBairro.ContainsKey($_)){ $mapBairro[$_] } else { $_ } }) -join '; ')
      }
      elseif($h -eq 'gestor' -and $v -match '[A-Za-z0-9]{10}' -and $mapGestor.Count -gt 0){
        $parts=$v -split ';\s*'; $v = (($parts | % { if($mapGestor.ContainsKey($_)){ $mapGestor[$_] } else { $_ } }) -join '; ')
      }
      elseif($h -eq 'nao_possui_complemento' -and $v -ne ''){
        if($v -match '^(True|true|1)$'){ $v='Sim' } elseif($v -match '^(False|false|0)$'){ $v='Não' }
      }
    }
    $obj[$h]=$v
  }
  $outRows.Add([pscustomobject]$obj)
}

Write-CsvBom -path $targetPath -headers $headers -rows $outRows
Write-Host "OK: Solicitacao.csv reconstruído da API com títulos nas conexões."
