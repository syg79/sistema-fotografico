# Script para corrigir Solicitacao.csv usando dados reais da API Tadabase
# Fonte de verdade: Solicitacao_ALL_FIELDS.csv (obtido diretamente da API o6WQb5NnBZ)

Write-Host "=== CORRECAO DO SOLICITACAO.CSV ==="
Write-Host "Usando dados reais da API Tadabase como fonte de verdade"
Write-Host ""

# Arquivos
$sourceFile = "D:\Projetos\Excel\csv_output\Solicitacao_ALL_FIELDS.csv"  # Fonte de verdade da API
$targetFile = "D:\Projetos\Excel\csv_output\Solicitacao.csv"              # Arquivo a ser corrigido
$outputFile = "D:\Projetos\Excel\csv_output\Solicitacao_CORRIGIDO.csv"     # Arquivo corrigido

# Verificar se arquivos existem
if (-not (Test-Path $sourceFile)) {
    Write-Host "ERRO: Arquivo fonte nao encontrado: $sourceFile"
    exit 1
}

if (-not (Test-Path $targetFile)) {
    Write-Host "ERRO: Arquivo alvo nao encontrado: $targetFile"
    exit 1
}

# Carregar dados da fonte de verdade (API)
Write-Host "Carregando dados da API (fonte de verdade)..."
$apiData = Import-Csv $sourceFile -Delimiter ';'
Write-Host "Registros da API: $($apiData.Count)"
Write-Host "Colunas da API: $($apiData[0].PSObject.Properties.Name.Count)"

# Carregar dados do arquivo a ser corrigido
Write-Host "Carregando arquivo a ser corrigido..."
$targetData = Import-Csv $targetFile -Delimiter ';'
Write-Host "Registros do arquivo: $($targetData.Count)"
Write-Host "Colunas do arquivo: $($targetData[0].PSObject.Properties.Name.Count)"
Write-Host ""

# Obter estrutura exata da API
$apiColumns = $apiData[0].PSObject.Properties.Name
Write-Host "Estrutura da API (primeiras 10 colunas):"
for($i = 0; $i -lt [Math]::Min(10, $apiColumns.Count); $i++) {
    Write-Host "  $($i+1): $($apiColumns[$i])"
}
Write-Host "  ... (total: $($apiColumns.Count) colunas)"
Write-Host ""

# Criar indice de registros da API por record_id
Write-Host "Criando indice de registros da API..."
$apiIndex = @{}
foreach($record in $apiData) {
    if($record.record_id) {
        $apiIndex[$record.record_id] = $record
    }
}
Write-Host "Registros indexados: $($apiIndex.Count)"
Write-Host ""

# Processar correcoes
Write-Host "Processando correcoes..."
$correctedData = @()
$foundCount = 0
$notFoundCount = 0

foreach($targetRecord in $targetData) {
    $recordId = $targetRecord.record_id
    
    if($apiIndex.ContainsKey($recordId)) {
        # Usar dados da API (fonte de verdade)
        $correctedData += $apiIndex[$recordId]
        $foundCount++
    } else {
        # Manter registro original se nao encontrado na API
        Write-Host "AVISO: Record ID nao encontrado na API: $recordId"
        $correctedData += $targetRecord
        $notFoundCount++
    }
}

Write-Host "Registros encontrados na API: $foundCount"
Write-Host "Registros nao encontrados: $notFoundCount"
Write-Host ""

# Salvar arquivo corrigido
Write-Host "Salvando arquivo corrigido..."
$correctedData | Export-Csv $outputFile -Delimiter ';' -NoTypeInformation -Encoding UTF8

Write-Host "=== CONCLUIDO ==="
Write-Host "Arquivo corrigido salvo: $outputFile"
Write-Host "Total de registros: $($correctedData.Count)"
Write-Host "Estrutura: $($apiColumns.Count) colunas (identica a API)"
Write-Host ""
Write-Host "O arquivo Solicitacao_CORRIGIDO.csv agora tem a estrutura EXATA da API Tadabase o6WQb5NnBZ"