# Este script processa arquivos CSV locais para resolver campos de conexão.
# Ele NÃO faz chamadas à API para buscar dados, apenas lê arquivos da pasta /csv_output.

param(
    [string]$InputFile = 'Solicitacao_ALL_FIELDS.csv',
    [string]$OutputFile = 'Solicitacao_resolvido.csv'
)

$ErrorActionPreference = 'Stop'

# --- Configuração de Pastas ---
$RootPath = $PSScriptRoot | Split-Path
$OutputCsvPath = Join-Path $RootPath "csv_output"

#region Funções Auxiliares

# Função de conversão de TadabaseFieldToString (copiada da versão depurada)
function Convert-TadabaseFieldToString($field) {
    if ($null -eq $field) { return '' }
    if ($field -is [string]) { return $field }
    
    if ($field -is [array]) {
        return ($field | ForEach-Object { Convert-TadabaseFieldToString $_ }) -join ', '
    }

    if ($field -is [psobject]) {
        $props = $field.PSObject.Properties
        $propNames = $props.Name

        if (($propNames -contains 'address') -and ($propNames -contains 'city')) {
            return (@($field.address, $field.address2, $field.city, $field.state, $field.zip) -join ' ' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' } | Out-String).Trim()
        }
        if ($propNames -contains 'link') { return $field.link }
        if ($propNames -contains 'url') { return $field.url }
        if (($propNames -contains 'first_name') -and ($propNames -contains 'last_name')) {
            return "$($field.first_name) $($field.last_name)".Trim()
        }
        if (($propNames -contains 'start') -and ($propNames -contains 'end')) {
            return "$($field.start) - $($field.end)".Trim(' - ')
        }
        if ($propNames -contains 'val') { return $field.val }

        return ($field | Out-String).Trim()
    }

    return $field.ToString()
}

# Função para ler um CSV de dicionário e criar um mapa de busca (ID -> Nome)
function Read-DictionaryCsv([string]$fileName, [string]$idColumn, [string]$nameColumn) {
    $filePath = Join-Path $OutputCsvPath $fileName
    if (-not (Test-Path $filePath)) {
        Write-Warning "Arquivo de dicionário não encontrado: $filePath"
        return @{}
    }

    $map = @{}
    $csvData = Import-Csv -Path $filePath -Delimiter ';'

    foreach ($row in $csvData) {
        $id = $row.$idColumn
        $nameValue = $row.$nameColumn

        if ($null -eq $id -or [string]::IsNullOrWhiteSpace($id)) { continue }

        $extractedName = $nameValue
        # NOVO: Tentar converter a string que parece objeto para objeto e extrair o nome
        if ($nameValue -is [string] -and $nameValue -match '^@\{.*\}$') {
            $cleanString = $nameValue -replace '^@\{|\}$' -replace ';', "`n" # Remove @{} e substitui ; por nova linha
            try {
                $obj = ConvertFrom-StringData $cleanString
                if ($obj.ContainsKey('first_name')) { $extractedName = $obj.first_name }
                elseif ($obj.ContainsKey('val')) { $extractedName = $obj.val }
                elseif ($obj.ContainsKey('address')) { $extractedName = $obj.address }
                # Adicionar mais condições aqui se outros tipos de objetos aparecerem
            } catch {
                # Se a conversão falhar, usa a string original
                $extractedName = $nameValue
            }
        }
        # FIM NOVO

        if (-not $map.ContainsKey($id)) {
            $map.Add($id, $extractedName)
        }
    }
    Write-Host "Dicionário '$fileName' carregado com $($map.Count) itens."
    return $map
}

# Função para escrever o resultado final em CSV com codificação UTF-8 com BOM
function Write-CsvWithBom([string]$path, [object[]]$rows) {
    if ($rows.Count -eq 0) {
        Write-Warning "Nenhum dado para escrever no arquivo de saída."
        return
    }
    # Usa o primeiro objeto para obter os cabeçalhos na ordem correta
    $headers = $rows[0].PSObject.Properties.Name
    $rows | Export-Csv -Path $path -Delimiter ';' -NoTypeInformation -Encoding UTF8
    Write-Host "[OK] Arquivo final salvo em: $path"
}

#endregion

# --- LÓGICA PRINCIPAL ---

Write-Host "--- INICIANDO PROCESSAMENTO LOCAL ---"

# 1. Mapeamento de dicionários: Nome do arquivo, Coluna de ID, Coluna de Nome
$dictionaryFiles = @(
    @{ Name = 'Rede';       File = 'Rede.csv';                     IdCol = 'id'; NameCol = 'field_154' },
    @{ Name = 'Clientes';     File = 'Clientes.csv';                 IdCol = 'id'; NameCol = 'field_57' },
    @{ Name = 'Fotografos';   File = 'Fotografos.csv';               IdCol = 'id'; NameCol = 'field_48' },
    @{ Name = 'Corretores';   File = 'Corretores-2025-09-12-05-59-09.csv'; IdCol = 'id'; NameCol = 'field_72' },
    @{ Name = 'Gestores';     File = 'Gestores - Vitrine-2025-09-12-00-17-20.csv'; IdCol = 'id'; NameCol = 'field_38' },
    @{ Name = 'Regioes';      File = 'Regiões-2025-09-11-21-21-15.csv';  IdCol = 'id'; NameCol = 'field_140' } # Nome do arquivo corrigido (sem 'õ')
)

# 2. Mapeamento de Conexões: Campo no arquivo principal -> Nome do Dicionário
$connectionMap = @{
    'field_175' = 'Rede';
    'field_86'  = 'Clientes';
    'field_111' = 'Fotografos';
    'field_179' = 'Corretores';
    'field_431' = 'Gestores';
    'field_142' = 'Regioes'
}

# 3. Carregar todos os dicionários em memória
$lookupMaps = @{}
foreach ($dict in $dictionaryFiles) {
    $lookupMaps[$dict.Name] = Read-DictionaryCsv -fileName $dict.File -idColumn $dict.IdCol -nameColumn $dict.NameCol
}

# 4. Ler o arquivo principal de Solicitações
$mainCsvPath = Join-Path $OutputCsvPath $InputFile
if (-not (Test-Path $mainCsvPath)) { throw "Arquivo de entrada principal não encontrado: $mainCsvPath" }
$mainCsvData = Import-Csv -Path $mainCsvPath -Delimiter ';'
Write-Host "Arquivo principal '$InputFile' carregado com $($mainCsvData.Count) registros."

# 5. Processar cada linha e resolver as conexões
$finalRecords = foreach ($row in $mainCsvData) {
    # Criar uma cópia da linha para preservar todos os campos
    $newRow = [PSCustomObject]@{}
    
    # Copiar TODOS os campos da linha original
    foreach ($property in $row.PSObject.Properties) {
        $newRow | Add-Member -MemberType NoteProperty -Name $property.Name -Value $property.Value
    }
    
    # Processar apenas os campos de conexão específicos
    foreach ($sourceField in $connectionMap.Keys) {
        # Verificar se a linha atual tem este campo de conexão
        if ($newRow.PSObject.Properties.Name -contains $sourceField) {
            $connectionId = $newRow.$sourceField
            $dictionaryName = $connectionMap[$sourceField]
            $map = $lookupMaps[$dictionaryName]

            # Se o ID existe no mapa, substitui o ID pelo nome
            if ($null -ne $connectionId -and $map.ContainsKey($connectionId)) {
                $newRow.$sourceField = $map[$connectionId]
            }
        }
    }
    $newRow # Retorna a linha modificada com TODOS os campos preservados
}

# 6. Salvar o resultado final
$outputFilePath = Join-Path $OutputCsvPath $OutputFile
Write-CsvWithBom -path $outputFilePath -rows $finalRecords

Write-Host "--- PROCESSAMENTO CONCLUÍDO ---"