# Teste simples da função Process-FieldValue

function Process-FieldValue {
    param(
        [object]$Value,
        [string]$FieldType,
        [string]$FieldName
    )
    
    if ($null -eq $Value -or $Value -eq "") {
        return ""
    }
    
    # Campos conhecidos que contêm HTML/Rich Text (baseado nos field IDs problemáticos)
    $richTextFields = @(
        "field_112",  # Observacao para o Fotografo
        "field_115",  # Feedback da Sessao (fotografo, gestor e/ou editor)
        "field_276",  # Observacao para o Agendamento
        "field_189"   # Observacao para o CLIENTE
    )
    
    # Se o campo está na lista de Rich Text conhecidos, forçar tratamento como Rich Text
    if ($richTextFields -contains $FieldName) {
        $FieldType = "Rich Text"
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
        
        "Text" {
            # Aplicar mesmo tratamento para campos Text que podem conter HTML
            $cleanValue = $Value.ToString()
            # Verificar se contém tags HTML
            if ($cleanValue -match '<[^>]+>') {
                # Remover tags HTML
                $cleanValue = $cleanValue -replace '<[^>]+>', ''
            }
            # Escapar quebras de linha para evitar quebra do CSV
            $cleanValue = $cleanValue -replace '\r\n', ' '
            $cleanValue = $cleanValue -replace '\n', ' '
            $cleanValue = $cleanValue -replace '\r', ' '
            # Remover múltiplos espaços
            $cleanValue = $cleanValue -replace '\s+', ' '
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

# Testar com o valor problemático real encontrado no CSV
$problematicValue = "<p>Marcelle: Por favor colocar essas fotos nas refs</p>`n<div>212065</div>`n<div>212066</div>"

Write-Host "=== TESTE DE CORREÇÃO DE CAMPOS RICH TEXT ===" -ForegroundColor Cyan
Write-Host "`nValor original problemático:" -ForegroundColor Yellow
Write-Host "'$problematicValue'"

# Testar com field_112 (Observacao para o Fotografo)
Write-Host "`nTestando field_112 (Observacao para o Fotografo):" -ForegroundColor Green
$result112 = Process-FieldValue -Value $problematicValue -FieldType "Text" -FieldName "field_112"
Write-Host "Resultado: '$result112'"

# Verificar se ainda contém quebras de linha
if ($result112 -match "\r|\n") {
    Write-Host "❌ ERRO: Ainda contém quebras de linha!" -ForegroundColor Red
} else {
    Write-Host "✅ SUCESSO: Sem quebras de linha!" -ForegroundColor Green
}

# Testar com field_115 (Feedback da Sessao)
Write-Host "`nTestando field_115 (Feedback da Sessao):" -ForegroundColor Green
$result115 = Process-FieldValue -Value $problematicValue -FieldType "Text" -FieldName "field_115"
Write-Host "Resultado: '$result115'"

# Verificar se ainda contém quebras de linha
if ($result115 -match "\r|\n") {
    Write-Host "❌ ERRO: Ainda contém quebras de linha!" -ForegroundColor Red
} else {
    Write-Host "✅ SUCESSO: Sem quebras de linha!" -ForegroundColor Green
}

# Testar com um campo normal (não Rich Text)
Write-Host "`nTestando campo normal (field_001):" -ForegroundColor Blue
$resultNormal = Process-FieldValue -Value "Texto normal sem HTML" -FieldType "Text" -FieldName "field_001"
Write-Host "Resultado: '$resultNormal'"

Write-Host "`n=== TESTE CONCLUÍDO ===" -ForegroundColor Cyan