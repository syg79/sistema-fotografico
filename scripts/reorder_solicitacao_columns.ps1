# Script para reordenar colunas do Solicitacao.csv conforme Estrutura_Solicitacao_CSV.csv
# Garantindo que fique idêntico com 139 colunas

$estruturaPath = "D:\Projetos\Excel\Estrutura_Solicitacao_CSV.csv"
$solicitacaoPath = "D:\Projetos\Excel\csv_output\Solicitacao.csv"
$outputPath = "D:\Projetos\Excel\csv_output\Solicitacao_REORDERED.csv"

Write-Host "Carregando estrutura de referência..." -ForegroundColor Green

# Ler estrutura de referência
$estrutura = Import-Csv $estruturaPath -Delimiter ';' -Encoding UTF8

# Criar lista ordenada de nomes de campos conforme estrutura
$orderedFieldNames = @()
foreach ($row in $estrutura) {
    $fieldName = $row.'Field Name'.Trim('"')
    if ($fieldName) {
        $orderedFieldNames += $fieldName
        Write-Host "Campo $($orderedFieldNames.Count): $fieldName" -ForegroundColor Cyan
    }
}

Write-Host "Total de campos na estrutura: $($orderedFieldNames.Count)" -ForegroundColor Yellow

# Ler arquivo atual
Write-Host "Lendo arquivo Solicitacao.csv atual..." -ForegroundColor Green
$currentData = Import-Csv $solicitacaoPath -Delimiter ';' -Encoding UTF8

Write-Host "Registros encontrados: $($currentData.Count)" -ForegroundColor Yellow
Write-Host "Colunas atuais: $($currentData[0].PSObject.Properties.Name.Count)" -ForegroundColor Yellow

# Verificar quais campos estão faltando
$currentColumns = $currentData[0].PSObject.Properties.Name
Write-Host "\nVerificando campos faltantes..." -ForegroundColor Magenta

$missingFields = @()
foreach ($fieldName in $orderedFieldNames) {
    if ($fieldName -notin $currentColumns) {
        $missingFields += $fieldName
        Write-Host "FALTANDO: $fieldName" -ForegroundColor Red
    }
}

Write-Host "Campos faltantes: $($missingFields.Count)" -ForegroundColor Red

# Verificar campos extras
$extraFields = @()
foreach ($col in $currentColumns) {
    if ($col -notin $orderedFieldNames) {
        $extraFields += $col
        Write-Host "EXTRA: $col" -ForegroundColor Yellow
    }
}

Write-Host "Campos extras: $($extraFields.Count)" -ForegroundColor Yellow

# Criar dados reordenados
Write-Host "\nReordenando dados..." -ForegroundColor Green

$reorderedData = @()
foreach ($record in $currentData) {
    $newRecord = [ordered]@{}
    
    foreach ($fieldName in $orderedFieldNames) {
        if ($record.PSObject.Properties.Name -contains $fieldName) {
            # Campo existe, copiar valor
            $newRecord[$fieldName] = $record.$fieldName
        } else {
            # Campo não existe, adicionar vazio
            $newRecord[$fieldName] = ""
        }
    }
    
    $reorderedData += [PSCustomObject]$newRecord
}

# Exportar dados reordenados
Write-Host "Salvando arquivo reordenado..." -ForegroundColor Green

$reorderedData | Export-Csv -Path $outputPath -Delimiter ';' -Encoding UTF8 -NoTypeInformation

Write-Host "\nArquivo salvo: $outputPath" -ForegroundColor Green
Write-Host "Total de registros: $($reorderedData.Count)" -ForegroundColor Yellow
Write-Host "Total de colunas: $($orderedFieldNames.Count)" -ForegroundColor Yellow

# Verificar resultado
Write-Host "\nVerificando resultado..." -ForegroundColor Magenta
$result = Import-Csv $outputPath -Delimiter ';' -Encoding UTF8
Write-Host "Colunas no arquivo final: $($result[0].PSObject.Properties.Name.Count)" -ForegroundColor Green

# Mostrar primeiras colunas
Write-Host "\nPrimeiras 10 colunas do arquivo reordenado:" -ForegroundColor Cyan
$result[0].PSObject.Properties.Name | Select-Object -First 10 | ForEach-Object { Write-Host "  $_" -ForegroundColor White }

Write-Host "\nReordenação concluída!" -ForegroundColor Green