# Script para validar se os nomes dos clientes estão corretos

# IDs e nomes esperados baseados no CSV gerado
$expectedMappings = @{
    'L5MjK9wN0k' = 'B Vista'
    '230' = 'J Social'
    '217' = 'Boqueirao'
    '232' = 'Kennedy'
    '222' = 'Centro'
    '227' = 'Hauer'
    '210' = 'A Tamandare'
}

# Carregar o CSV de saída
$csvPath = "D:\Projetos\Excel\csv_output\Solicitacao.csv"
$data = Import-Csv $csvPath -Delimiter ';'

Write-Host "Validando nomes de clientes no arquivo gerado..." -ForegroundColor Green
Write-Host "Total de registros: $($data.Count)" -ForegroundColor Cyan

$validationResults = @()

foreach ($expectedId in $expectedMappings.Keys) {
    $expectedName = $expectedMappings[$expectedId]
    $records = $data | Where-Object { $_.'Nome Cliente' -eq $expectedName }
    
    if ($records.Count -gt 0) {
        Write-Host "✓ ID '$expectedId' -> '$expectedName' - Encontrados $($records.Count) registros" -ForegroundColor Green
        $validationResults += @{
            ID = $expectedId
            ExpectedName = $expectedName
            Found = $true
            Count = $records.Count
        }
    } else {
        Write-Host "✗ ID '$expectedId' -> '$expectedName' - NÃO ENCONTRADO" -ForegroundColor Red
        $validationResults += @{
            ID = $expectedId
            ExpectedName = $expectedName
            Found = $false
            Count = 0
        }
    }
}

# Resumo
Write-Host "`nResumo da validacao:" -ForegroundColor Yellow
$successful = ($validationResults | Where-Object { $_.Found }).Count
$total = $validationResults.Count
Write-Host "Sucessos: $successful/$total" -ForegroundColor $(if ($successful -eq $total) { 'Green' } else { 'Yellow' })

if ($successful -eq $total) {
    Write-Host "`nTODOS OS NOMES DE CLIENTES ESTAO CORRETOS!" -ForegroundColor Green
} else {
    Write-Host "`nAlguns nomes nao foram encontrados corretamente." -ForegroundColor Yellow
}

Write-Host "`nValidacao concluida." -ForegroundColor Cyan