param(
  [string]$CsvDir = "csv_output"
)

$ErrorActionPreference = 'Stop'

function ReadCsvTable([string]$path){
  Add-Type -AssemblyName Microsoft.VisualBasic | Out-Null
  $p = New-Object Microsoft.VisualBasic.FileIO.TextFieldParser($path,[Text.Encoding]::UTF8)
  $p.TextFieldType=[Microsoft.VisualBasic.FileIO.FieldType]::Delimited
  $p.Delimiters=@(';')
  $p.HasFieldsEnclosedInQuotes=$true
  $hdr=$p.ReadFields(); $rows=@()
  while(-not $p.EndOfData){ $rows += ,@($p.ReadFields()) }
  $p.Close(); return @($hdr,$rows)
}

function WriteCsv([string]$path,[string[]]$hdr,[object[]]$rows){
  $enc = New-Object System.Text.UTF8Encoding($true)
  $sw = New-Object System.IO.StreamWriter($path,$false,$enc)
  try{
    $sw.WriteLine( ($hdr | % { '"'+($_ -replace '"','""')+'"' }) -join ';' )
    foreach($r in $rows){ $vals=@(); foreach($v in $r){ $vals += ('"'+(([string]$v) -replace '"','""')+'"') }; $sw.WriteLine(($vals -join ';')) }
  } finally { $sw.Flush(); $sw.Dispose() }
}

$targetPath = Join-Path $CsvDir 'Solicitacao.csv'
$fixedPath  = Join-Path $CsvDir 'Solicitacao_columns_fixed.csv'
if(-not (Test-Path $targetPath)){ throw "Arquivo não encontrado: $targetPath" }
if(-not (Test-Path $fixedPath)){ throw "Arquivo não encontrado: $fixedPath" }

$t = ReadCsvTable $targetPath
$f = ReadCsvTable $fixedPath

$tHdr = $t[0]; $tRows=$t[1]
$fHdr = $f[0]; $fRows=$f[1]

$idxT=@{}
for($i=0;$i -lt $tHdr.Length;$i++){ $idxT[$tHdr[$i]]=$i }
$idxF=@{}
for($i=0;$i -lt $fHdr.Length;$i++){ $idxF[$fHdr[$i]]=$i }

if(-not $idxT.ContainsKey('record_id')){ throw 'record_id não encontrado em Solicitacao.csv' }
if(-not $idxF.ContainsKey('record_id')){ throw 'record_id não encontrado em Solicitacao_columns_fixed.csv' }

# construir dict do arquivo fixo
$fixedMap=@{}
foreach($r in $fRows){ $rid=[string]$r[$idxF['record_id']]; if($rid){ $fixedMap[$rid]=$r } }

$columns = @('rede','nome_cliente','fotografo','bairro_localidade','tipo_do_servico','codigo_vitrine_automatico','nao_possui_complemento','gestor','corretor_responsavel')
$applyCols = $columns | Where-Object { $idxT.ContainsKey($_) -and $idxF.ContainsKey($_) }

for($ri=0;$ri -lt $tRows.Count;$ri++){
  $row = $tRows[$ri]
  $rid = [string]$row[$idxT['record_id']]
  if(-not $rid -or -not $fixedMap.ContainsKey($rid)){ continue }
  $fx = $fixedMap[$rid]
  foreach($c in $applyCols){
    $ti=$idxT[$c]; $fi=$idxF[$c]
    $val=[string]$fx[$fi]
    if($val -ne ''){ $row[$ti] = $val }
  }
  $tRows[$ri]=$row
}

WriteCsv $targetPath $tHdr $tRows
Write-Host "OK: Solicitacao.csv atualizado com colunas do arquivo auxiliar (" + ($applyCols -join ', ') + ")."

