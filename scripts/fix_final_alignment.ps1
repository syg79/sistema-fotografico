# Script para corrigir alinhamento mantendo EXATAMENTE a estrutura do Tadabase o6WQb5NnBZ

# Ordem exata das colunas conforme Tadabase o6WQb5NnBZ (Solicitacao_ALL_FIELDS.csv)
$tadabaseColumnOrder = @(
    'record_id', 'field_103', 'field_106', 'field_110', 'field_111', 'field_112', 'field_113', 'field_114', 'field_115', 'field_116',
    'field_117', 'field_118', 'field_119', 'field_124', 'field_136', 'field_137', 'field_139', 'field_142', 'field_175', 'field_177',
    'field_178', 'field_179', 'field_183', 'field_184', 'field_186', 'field_187', 'field_188', 'field_189', 'field_206', 'field_215',
    'field_219', 'field_223', 'field_233', 'field_234', 'field_242', 'field_243', 'field_244', 'field_245', 'field_246', 'field_247',
    'field_248', 'field_249', 'field_250', 'field_251', 'field_270', 'field_271', 'field_272', 'field_273', 'field_274', 'field_275',
    'field_276', 'field_277', 'field_304', 'field_305', 'field_306', 'field_310', 'field_330', 'field_331', 'field_332', 'field_333',
    'field_340', 'field_341', 'field_342', 'field_345', 'field_358', 'field_375', 'field_376', 'field_384', 'field_385', 'field_386',
    'field_390', 'field_391', 'field_395', 'field_398', 'field_399', 'field_400', 'field_401', 'field_402', 'field_403', 'field_404',
    'field_405', 'field_406', 'field_407', 'field_408', 'field_410', 'field_411', 'field_412', 'field_413', 'field_414', 'field_415',
    'field_416', 'field_417', 'field_418', 'field_419', 'field_420', 'field_421', 'field_425', 'field_426', 'field_427', 'field_428',
    'field_429', 'field_430', 'field_431', 'field_434', 'field_435', 'field_436', 'field_437', 'field_447', 'field_448', 'field_449',
    'field_450', 'field_451', 'field_452', 'field_453', 'field_454', 'field_455', 'field_456', 'field_459', 'field_465', 'field_466',
    'field_467', 'field_468', 'field_469', 'field_470', 'field_474', 'field_475', 'field_487', 'field_489', 'field_85', 'field_86',
    'field_89', 'field_92', 'field_93', 'field_94', 'field_95', 'field_96', 'field_97'
)

# Mapeamento de campos para resolução de conexões e processamento especial
$specialFields = @{
    'field_118' = 'auto_increment'  # auto_increment_2
    'field_175' = 'rede_connection' # codigo_da_rede -> resolver com dicionário Rede
    'field_86' = 'cliente_connection' # codigo_cliente -> resolver com dicionário Clientes
    'field_111' = 'fotografo_connection' # fotografo -> resolver com dicionário Fotografos
}

# Função para limpar texto
function Clean-Text($text) {
    if ([string]::IsNullOrEmpty($text)) { return '' }
    
    # Remover &nbsp;
    $text = $text -replace '&nbsp;', ' '
    
    # Processar formatos @{link=; text=}
    if ($text -match '^@\{link=([^;]*);\s*text=([^}]*)\}$') {
        $link = $matches[1]
        $linkText = $matches[2]
        if ([string]::IsNullOrEmpty($link) -and [string]::IsNullOrEmpty($linkText)) {
            return ''
        }
        return if (![string]::IsNullOrEmpty($linkText)) { $linkText } else { $link }
    }
    
    # Processar formatos @{address=...}
    if ($text -match '^@\{address=([^;]+)') {
        return $matches[1]
    }
    
    return $text
}

# Função para carregar dicionários
function Load-Dictionary($fileName, $idColumn, $nameColumn) {
    $filePath = "D:\Projetos\Excel\csv_output\$fileName"
    $dict = @{}
    
    if (Test-Path $filePath) {
        try {
            $csv = Import-Csv $filePath -Delimiter ';'
            foreach ($row in $csv) {
                if ($row.$idColumn -and $row.$nameColumn) {
                    $dict[$row.$idColumn] = $row.$nameColumn
                }
            }
            Write-Host "Dicionário $fileName carregado com $($dict.Count) itens"
        } catch {
            Write-Host "Erro ao carregar $fileName : $($_.Exception.Message)"
        }
    } else {
        Write-Host "Arquivo $fileName não encontrado"
    }
    
    return $dict
}

Write-Host "=== CORREÇÃO DE ALINHAMENTO TADABASE o6WQb5NnBZ ==="

# Carregar dicionários
$dictRede = Load-Dictionary "Rede.csv" "record_id" "rede_imobiliaria_name"
$dictClientes = Load-Dictionary "Clientes.csv" "record_id" "nome_empresa"
$dictFotografos = Load-Dictionary "Fotografos.csv" "record_id" "nome_do_fotografo"

# Carregar arquivo de entrada
$inputFile = "D:\Projetos\Excel\csv_output\Solicitacao_resolvido.csv"
$outputFile = "D:\Projetos\Excel\csv_output\Solicitacao_FINAL_CORRIGIDO.csv"

Write-Host "Carregando arquivo: $inputFile"
$records = Import-Csv $inputFile -Delimiter ';'
Write-Host "Registros carregados: $($records.Count)"

# Processar registros
$processedRecords = @()
$autoIncrement = 1

foreach ($record in $records) {
    $newRecord = [ordered]@{}
    
    # Processar cada coluna na ordem exata do Tadabase
    foreach ($tadabaseField in $tadabaseColumnOrder) {
        
        if ($specialFields.ContainsKey($tadabaseField)) {
            $specialType = $specialFields[$tadabaseField]
            
            switch ($specialType) {
                'auto_increment' {
                    $newRecord[$tadabaseField] = $autoIncrement
                }
                'rede_connection' {
                    $value = if ($record.PSObject.Properties.Name -contains $tadabaseField) { $record.$tadabaseField } else { '' }
                    if ($value -and $dictRede.ContainsKey($value)) {
                        $newRecord[$tadabaseField] = $dictRede[$value]
                    } else {
                        $newRecord[$tadabaseField] = Clean-Text $value
                    }
                }
                'cliente_connection' {
                    $value = if ($record.PSObject.Properties.Name -contains $tadabaseField) { $record.$tadabaseField } else { '' }
                    if ($value -and $dictClientes.ContainsKey($value)) {
                        $newRecord[$tadabaseField] = $dictClientes[$value]
                    } else {
                        $newRecord[$tadabaseField] = Clean-Text $value
                    }
                }
                'fotografo_connection' {
                    $value = if ($record.PSObject.Properties.Name -contains $tadabaseField) { $record.$tadabaseField } else { '' }
                    if ($value -and $dictFotografos.ContainsKey($value)) {
                        $newRecord[$tadabaseField] = $dictFotografos[$value]
                    } else {
                        $newRecord[$tadabaseField] = Clean-Text $value
                    }
                }
            }
        }
        else {
            # Campo normal - limpar texto
            $value = if ($record.PSObject.Properties.Name -contains $tadabaseField) { $record.$tadabaseField } else { '' }
            $newRecord[$tadabaseField] = Clean-Text $value
        }
    }
    
    $processedRecords += [PSCustomObject]$newRecord
    $autoIncrement++
}

# Salvar arquivo corrigido
Write-Host "Salvando arquivo corrigido: $outputFile"
$processedRecords | Export-Csv $outputFile -Delimiter ';' -NoTypeInformation -Encoding UTF8

Write-Host "=== CORREÇÃO CONCLUÍDA ==="
Write-Host "Registros processados: $($processedRecords.Count)"
Write-Host "Colunas: $($tadabaseColumnOrder.Count)"
Write-Host "Arquivo salvo: $outputFile"

# Verificar se a estrutura está correta
Write-Host "`n=== VERIFICACAO DA ESTRUTURA ==="
$originalRef = Import-Csv "D:\Projetos\Excel\csv_output\Solicitacao_ALL_FIELDS.csv" -Delimiter ';'
$correctedFile = Import-Csv $outputFile -Delimiter ';'

Write-Host "Colunas arquivo original: $($originalRef[0].PSObject.Properties.Count)"
Write-Host "Colunas arquivo corrigido: $($correctedFile[0].PSObject.Properties.Count)"

$allMatch = $true
for ($i = 0; $i -lt [Math]::Min($originalRef[0].PSObject.Properties.Count, $correctedFile[0].PSObject.Properties.Count); $i++) {
    $origCol = $originalRef[0].PSObject.Properties.Name[$i]
    $corrCol = $correctedFile[0].PSObject.Properties.Name[$i]
    
    if ($origCol -ne $corrCol) {
        Write-Host "DIFERENCA na posicao $i : '$origCol' != '$corrCol'"
        $allMatch = $false
    }
}

if ($allMatch -and $originalRef[0].PSObject.Properties.Count -eq $correctedFile[0].PSObject.Properties.Count) {
    Write-Host "ESTRUTURA PERFEITA: Todas as colunas estao na ordem correta!"
} else {
    Write-Host "ESTRUTURA INCORRETA: Ha diferencas na ordem ou quantidade de colunas."
}