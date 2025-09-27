param(
  [string]$CsvDir = "csv_output"
)

$ErrorActionPreference = 'Stop'

function Get-Encoding([string]$path){
  $fs = [System.IO.File]::OpenRead($path)
  try {
    $buf = New-Object byte[] 4
    $n = $fs.Read($buf,0,4)
    if($n -ge 2 -and $buf[0] -eq 0xFF -and $buf[1] -eq 0xFE){ return [Text.Encoding]::Unicode }
    if($n -ge 2 -and $buf[0] -eq 0xFE -and $buf[1] -eq 0xFF){ return [Text.Encoding]::BigEndianUnicode }
    if($n -ge 3 -and $buf[0] -eq 0xEF -and $buf[1] -eq 0xBB -and $buf[2] -eq 0xBF){ return [Text.Encoding]::UTF8 }
    return [Text.Encoding]::UTF8
  } finally { $fs.Close() }
}

function ReadCsvMap([string]$path,[string[]]$idPatterns,[string[]]$titlePatterns){
  if(-not (Test-Path $path)){ return @{} }
  Add-Type -AssemblyName Microsoft.VisualBasic | Out-Null
  $enc = Get-Encoding $path
  $p = New-Object Microsoft.VisualBasic.FileIO.TextFieldParser($path,$enc)
  $p.TextFieldType=[Microsoft.VisualBasic.FileIO.FieldType]::Delimited
  $p.Delimiters=@(';',',')
  $p.HasFieldsEnclosedInQuotes=$true
  $hdr = $p.ReadFields()
  for($i=0;$i -lt $hdr.Length;$i++){ $hdr[$i] = ($hdr[$i] -replace '^[\uFEFF]','').Trim() }
  # localizar colunas
  $idCol = $null; $titleCol = $null
  foreach($rx in $idPatterns){ $idCol = ($hdr | Where-Object { $_ -match $rx } | Select-Object -First 1); if($idCol){ break } }
  foreach($rx in $titlePatterns){ $titleCol = ($hdr | Where-Object { $_ -match $rx } | Select-Object -First 1); if($titleCol){ break } }
  if(-not $idCol -or -not $titleCol){ $p.Close(); return @{} }
  $map=@{}
  while(-not $p.EndOfData){
    $f=$p.ReadFields(); $row=@{}
    for($i=0;$i -lt $hdr.Length;$i++){ $row[$hdr[$i]] = if($i -lt $f.Length){ ($f[$i] -replace '^[\uFEFF]','') } else { '' } }
    $id = [string]$row[$idCol]; $title = [string]$row[$titleCol]
    if($id){ $map[$id] = $title }
  }
  $p.Close(); return $map
}

function ReadCsvTable([string]$path){
  Add-Type -AssemblyName Microsoft.VisualBasic | Out-Null
  $p = New-Object Microsoft.VisualBasic.FileIO.TextFieldParser($path,[Text.Encoding]::UTF8)
  $p.TextFieldType=[Microsoft.VisualBasic.FileIO.FieldType]::Delimited
  $p.Delimiters=@(';')
  $p.HasFieldsEnclosedInQuotes=$true
  $hdr = $p.ReadFields()
  $rows = @()
  while(-not $p.EndOfData){ $rows += ,@($p.ReadFields()) }
  $p.Close(); return @($hdr,$rows)
}

function WriteCsv([string]$path,[string[]]$hdr,[object[]]$rows){
  $enc = New-Object System.Text.UTF8Encoding($true)
  $sw = New-Object System.IO.StreamWriter($path,$false,$enc)
  try {
    $sw.WriteLine( ($hdr | ForEach-Object { '"' + ($_ -replace '"','""') + '"' }) -join ';' )
    foreach($r in $rows){
      $vals=@(); foreach($v in $r){ $vals += ('"' + (([string]$v) -replace '"','""') + '"') }
      $sw.WriteLine(($vals -join ';'))
    }
  } finally { $sw.Flush(); $sw.Dispose() }
}

$fixedPath = Join-Path $CsvDir 'Solicitacao_columns_fixed.csv'
if(-not (Test-Path $fixedPath)){ throw "Arquivo não encontrado: $fixedPath" }

# Mapas para nome_cliente e codigo_vitrine_automatico
$clientesCsv = Get-ChildItem -File $CsvDir | Where-Object { $_.Name -match '^Clientes.*\.csv$' } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$mapClientes = if($clientesCsv){ ReadCsvMap $clientesCsv.FullName @('(?i)^(record\s*id|id)$') @('(?i)^(nome\s*empresa|nome)$') } else { @{} }

$codVitCsv = Get-ChildItem -File $CsvDir | Where-Object { $_.Name -match '^Codigo\s*Vitrine.*\.csv$' } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$mapCodVit = if($codVitCsv){ ReadCsvMap $codVitCsv.FullName @('(?i)^(record\s*id|id)$') @('(?i)c[oó]digo\s*vitrine.*automatic|(?i)codigo\s*vitrine|(?i)name|(?i)titulo') } else { @{} }

$table = ReadCsvTable $fixedPath
$hdr = $table[0]; $rows=$table[1]
$idxRid = [Array]::IndexOf($hdr,'record_id')
$idxCli = [Array]::IndexOf($hdr,'nome_cliente')
$idxCod = [Array]::IndexOf($hdr,'codigo_vitrine_automatico')

for($i=0;$i -lt $rows.Count;$i++){
  $r = $rows[$i]
  if($idxCli -ge 0 -and $idxCli -lt $r.Length){
    $v=[string]$r[$idxCli]
    if($v -match '[A-Za-z0-9]{10}'){
      $parts = $v -split ';\s*'
      $mapped = $parts | ForEach-Object { if($_ -match '^[A-Za-z0-9]{10}$' -and $mapClientes.ContainsKey($_)){ $mapClientes[$_] } else { $_ } }
      $r[$idxCli] = ($mapped -join '; ')
    }
  }
  if($idxCod -ge 0 -and $idxCod -lt $r.Length){
    $v=[string]$r[$idxCod]
    if($v -match '[A-Za-z0-9]{10}' -and $mapCodVit.Count -gt 0){
      $parts = $v -split ';\s*'
      $mapped = $parts | ForEach-Object { if($_ -match '^[A-Za-z0-9]{10}$' -and $mapCodVit.ContainsKey($_)){ $mapCodVit[$_] } else { $_ } }
      $r[$idxCod] = ($mapped -join '; ')
    }
  }
  $rows[$i] = $r
}

WriteCsv $fixedPath $hdr $rows
Write-Host "OK: Atualizado Solicitacao_columns_fixed.csv usando Clientes-*.csv e Codigo Vitrine-*.csv."

