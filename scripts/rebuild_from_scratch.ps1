# REBUILD FROM SCRATCH - Copia exata da estrutura Tadabase o6WQb5NnBZ
# Sem modificações, sem correções, apenas copia direta

Write-Host "=== RECONSTRUCAO COMPLETA DO ZERO ==="
Write-Host "Copiando estrutura EXATA do Tadabase o6WQb5NnBZ"
Write-Host ""

# Arquivos de entrada e saída
$tadabaseFile = "D:\Projetos\Excel\csv_output\Solicitacao_ALL_FIELDS.csv"
$outputFile = "D:\Projetos\Excel\csv_output\Solicitacao_REBUILD.csv"

# Verificar se arquivo Tadabase existe
if (-not (Test-Path $tadabaseFile)) {
    Write-Host "ERRO: Arquivo Tadabase não encontrado: $tadabaseFile"
    exit 1
}

# Ler arquivo Tadabase original
Write-Host "Carregando arquivo Tadabase original..."
$tadabaseData = Import-Csv $tadabaseFile -Delimiter ';'
Write-Host "Registros carregados: $($tadabaseData.Count)"
Write-Host "Colunas: $($tadabaseData[0].PSObject.Properties.Name.Count)"
Write-Host ""

# Obter ordem exata das colunas
$exactColumnOrder = $tadabaseData[0].PSObject.Properties.Name
Write-Host "Ordem das colunas (primeiras 10):"
for($i = 0; $i -lt 10; $i++) {
    Write-Host "  $i : $($exactColumnOrder[$i])"
}
Write-Host "  ... (total: $($exactColumnOrder.Count) colunas)"
Write-Host ""

# Criar novo arquivo com estrutura IDÊNTICA
Write-Host "Criando arquivo com estrutura IDÊNTICA..."

# Copiar dados exatamente como estão
$rebuiltData = @()
foreach($record in $tadabaseData) {
    $newRecord = [PSCustomObject]@{}
    
    # Copiar cada campo na ordem EXATA
    foreach($column in $exactColumnOrder) {
        $newRecord | Add-Member -MemberType NoteProperty -Name $column -Value $record.$column
    }
    
    $rebuiltData += $newRecord
}

Write-Host "Registros processados: $($rebuiltData.Count)"

# Salvar arquivo
Write-Host "Salvando arquivo: $outputFile"
$rebuiltData | Export-Csv -Path $outputFile -Delimiter ';' -NoTypeInformation -Encoding UTF8

Write-Host ""
Write-Host "=== RECONSTRUCAO CONCLUIDA ==="
Write-Host "Arquivo salvo: $outputFile"
Write-Host "Estrutura: COPIA EXATA do Tadabase o6WQb5NnBZ"
Write-Host ""

# Verificação final
Write-Host "=== VERIFICACAO FINAL ==="
$original = Import-Csv $tadabaseFile -Delimiter ';'
$rebuilt = Import-Csv $outputFile -Delimiter ';'

Write-Host "Colunas original: $($original[0].PSObject.Properties.Name.Count)"
Write-Host "Colunas reconstruido: $($rebuilt[0].PSObject.Properties.Name.Count)"

$allMatch = $true
for($i = 0; $i -lt $original[0].PSObject.Properties.Name.Count; $i++) {
    $origCol = $original[0].PSObject.Properties.Name[$i]
    $rebCol = $rebuilt[0].PSObject.Properties.Name[$i]
    if($origCol -ne $rebCol) {
        Write-Host "DIFERENCA na posicao $i : '$origCol' != '$rebCol'"
        $allMatch = $false
    }
}

if($allMatch) {
    Write-Host "SUCESSO: Estrutura PERFEITAMENTE IDENTICA!"
} else {
    Write-Host "ERRO: Ainda ha diferencas na estrutura."
}

Write-Host "Processo concluido."