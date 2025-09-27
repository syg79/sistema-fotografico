# Teste simples da correção de &nbsp;

# Função Clean-SpecialCharacters (copiada do script principal)
function Clean-SpecialCharacters {
    param([string]$Text)
    
    if ([string]::IsNullOrEmpty($Text)) {
        return ""
    }
    
    $cleanText = $Text
    
    # Substituir entidades HTML comuns
    $cleanText = $cleanText -replace '&nbsp;', ' '
    $cleanText = $cleanText -replace '&amp;', '&'
    $cleanText = $cleanText -replace '&lt;', '<'
    $cleanText = $cleanText -replace '&gt;', '>'
    $cleanText = $cleanText -replace '&quot;', '"'
    $cleanText = $cleanText -replace '&#39;', "'"
    
    return $cleanText
}

Write-Host "=== TESTE DE CORREÇÃO DE &nbsp; ===" -ForegroundColor Cyan

# Valor de teste problemático
$testValue = "Olá,&nbsp;conforme&nbsp;contato,&nbsp;a sessão fotográfica&nbsp;do&nbsp;imóvel"

Write-Host "Valor original:" -ForegroundColor Yellow
Write-Host "'$testValue'"

# Aplicar a função de limpeza
$cleanedValue = Clean-SpecialCharacters -Text $testValue

Write-Host "Valor após limpeza:" -ForegroundColor Green
Write-Host "'$cleanedValue'"

# Verificar se ainda contém &nbsp;
if ($cleanedValue -match "&nbsp;") {
    Write-Host "❌ ERRO: Ainda contém &nbsp;!" -ForegroundColor Red
} else {
    Write-Host "✅ SUCESSO: &nbsp; removido!" -ForegroundColor Green
}

Write-Host "Teste concluído!" -ForegroundColor Magenta