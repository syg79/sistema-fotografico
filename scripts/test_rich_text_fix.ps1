# Script para testar correção de campos Rich Text
# Simula o processamento de um valor HTML problemático

# Função Process-FieldValue atualizada
function Process-FieldValue {
    param(
        [object]$Value,
        [string]$FieldType,
        [string]$FieldName
    )
    
    if ($null -eq $Value -or $Value -eq "") {
        return ""
    }
    
    switch ($FieldType) {
        "Rich Text" {
            # Tratar campos Rich Text removendo HTML e escapando quebras de linha
            $cleanValue = $Value.ToString()
            # Remover tags HTML básicas
            $cleanValue = $cleanValue -replace '<[^>]+>', ''
            # Escapar quebras de linha para evitar quebra do CSV
            $cleanValue = $cleanValue -replace '\r\n', ' '
            $cleanValue = $cleanValue -replace '\n', ' '
            $cleanValue = $cleanValue -replace '\r', ' '
            # Remover múltiplos espaços
            $cleanValue = $cleanValue -replace '\s+', ' '
            # Trim espaços extras
            return $cleanValue.Trim()
        }
        
        default {
            # Para qualquer outro tipo, verificar se contém quebras de linha
            $stringValue = $Value.ToString()
            # Escapar quebras de linha para evitar quebra do CSV
            $stringValue = $stringValue -replace '\r\n', ' '
            $stringValue = $stringValue -replace '\n', ' '
            $stringValue = $stringValue -replace '\r', ' '
            # Remover múltiplos espaços
            $stringValue = $stringValue -replace '\s+', ' '
            return $stringValue.Trim()
        }
    }
}

# Teste com o valor problemático
$testValue = "<p>Marcelle: Por favor colocar essas fotos nas refs</p>`n<div>212065</div>`n<div>212066</div>"

Write-Host "Valor original:" -ForegroundColor Yellow
Write-Host $testValue
Write-Host "`n" -ForegroundColor Gray

# Testar como Rich Text
$processedRichText = Process-FieldValue -Value $testValue -FieldType "Rich Text" -FieldName "Observacao para o Fotografo"
Write-Host "Processado como Rich Text:" -ForegroundColor Green
Write-Host "'$processedRichText'"
Write-Host "`n" -ForegroundColor Gray

# Testar como default
$processedDefault = Process-FieldValue -Value $testValue -FieldType "Text" -FieldName "Observacao para o Fotografo"
Write-Host "Processado como Default:" -ForegroundColor Cyan
Write-Host "'$processedDefault'"
Write-Host "`n" -ForegroundColor Gray

# Verificar se contém quebras de linha
if ($processedRichText -match "\r|\n") {
    Write-Host "ERRO: Ainda contém quebras de linha!" -ForegroundColor Red
} else {
    Write-Host "SUCESSO: Sem quebras de linha!" -ForegroundColor Green
}

Write-Host "`nTeste concluído!" -ForegroundColor Magenta