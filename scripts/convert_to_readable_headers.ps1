# Script para converter cabeçalhos field_XXX para nomes descritivos
# Baseado na estrutura definida em Estrutura_Solicitacao_CSV.csv

# Carregar o mapeamento de campos
$estruturaPath = "D:\Projetos\Excel\Estrutura_Solicitacao_CSV.csv"
$solicitacaoPath = "D:\Projetos\Excel\csv_output\Solicitacao.csv"
$outputPath = "D:\Projetos\Excel\csv_output\Solicitacao_READABLE.csv"

Write-Host "Carregando estrutura de campos..." -ForegroundColor Green

# Ler o arquivo de estrutura
$estrutura = Import-Csv $estruturaPath -Delimiter ';' -Encoding UTF8

# Criar hashtable para mapeamento field_ID -> Field Name
$fieldMapping = @{}
$fieldMapping['record_id'] = 'Record ID'  # Mapeamento especial
$fieldMapping['id'] = 'ID'  # Mapeamento especial
$fieldMapping['created_at'] = 'Created At'  # Mapeamento especial

foreach ($row in $estrutura) {
    $fieldSlug = $row.'Field Slug'.Trim('"')
    $fieldName = $row.'Field Name'.Trim('"')
    
    if ($fieldSlug -and $fieldName) {
        $fieldMapping[$fieldSlug] = $fieldName
        Write-Host "Mapeamento: $fieldSlug -> $fieldName" -ForegroundColor Cyan
    }
}

Write-Host "Total de mapeamentos criados: $($fieldMapping.Count)" -ForegroundColor Yellow

# Ler o arquivo Solicitacao.csv
Write-Host "Lendo arquivo Solicitacao.csv..." -ForegroundColor Green
$content = Get-Content $solicitacaoPath -Encoding UTF8

if ($content.Count -eq 0) {
    Write-Error "Arquivo Solicitacao.csv está vazio ou não foi encontrado!"
    exit 1
}

# Processar cabeçalho
$headerLine = $content[0]
$headers = $headerLine -split ';' | ForEach-Object { $_.Trim('"') }

Write-Host "Cabeçalhos originais encontrados: $($headers.Count)" -ForegroundColor Yellow

# Converter cabeçalhos
$newHeaders = @()
foreach ($header in $headers) {
    if ($fieldMapping.ContainsKey($header)) {
        $newHeaders += $fieldMapping[$header]
        Write-Host "Convertido: $header -> $($fieldMapping[$header])" -ForegroundColor Green
    } else {
        $newHeaders += $header
        Write-Host "Mantido: $header (não encontrado no mapeamento)" -ForegroundColor Red
    }
}

# Criar nova linha de cabeçalho
$newHeaderLine = '"' + ($newHeaders -join '";"') + '"'

# Criar arquivo de saída
Write-Host "Criando arquivo com cabeçalhos legíveis..." -ForegroundColor Green

$outputContent = @()
$outputContent += $newHeaderLine

# Adicionar todas as linhas de dados (sem modificar)
for ($i = 1; $i -lt $content.Count; $i++) {
    $outputContent += $content[$i]
}

# Salvar arquivo
$outputContent | Out-File -FilePath $outputPath -Encoding UTF8

Write-Host "Arquivo salvo em: $outputPath" -ForegroundColor Green
Write-Host "Total de linhas processadas: $($content.Count)" -ForegroundColor Yellow
Write-Host "Conversão concluída com sucesso!" -ForegroundColor Green

# Mostrar primeiras linhas do resultado
Write-Host "`nPrimeiras 3 linhas do arquivo convertido:" -ForegroundColor Magenta
$result = Get-Content $outputPath -Encoding UTF8 | Select-Object -First 3
$result | ForEach-Object { Write-Host $_ -ForegroundColor White }