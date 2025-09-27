# Script de teste para verificar a função Resolve-Connection

# Carregar o dicionário de Clientes
$clientesPath = "D:\Projetos\Excel\csv_output\dictionaries\Clientes.csv"
$dictionaries = @{}

if (Test-Path $clientesPath) {
    Write-Host "Carregando dicionário de Clientes..."
    
    # Detectar delimitador
    $firstLine = Get-Content $clientesPath -First 1
    $delimiter = if ($firstLine.Contains(',')) { ',' } else { ';' }
    Write-Host "Usando delimitador: $delimiter"
    
    $clientesData = Import-Csv -Path $clientesPath -Delimiter $delimiter
    $clientesDict = @{}
    
    foreach ($row in $clientesData) {
        $key = $null
        $value = $null
        
        # Procurar por campo Record ID (chave) e Nome (valor)
        foreach ($prop in $row.PSObject.Properties) {
            if ($prop.Name -match "^Record\s*ID$") {
                $key = $prop.Value
            }
            if ($prop.Name -match "^Nome|^Empresa" -and $prop.Name -notmatch "^ID") {
                $value = $prop.Value
            }
        }
        
        if ($key -and $value) {
            $clientesDict[$key] = $value
        }
    }
    
    $dictionaries["Clientes"] = $clientesDict
    Write-Host "Dicionário carregado com $($clientesDict.Count) registros"
    
    # Testar os IDs específicos mencionados pelo usuário
    $testIds = @("L5MjK9wN0k", "230", "217", "232", "222", "227", "210")
    
    Write-Host "`nTestando resolução de IDs:"
    foreach ($id in $testIds) {
        if ($clientesDict.ContainsKey($id)) {
            Write-Host "ID $id -> $($clientesDict[$id])"
        } else {
            Write-Host "ID $id -> NÃO ENCONTRADO"
        }
    }
    
    # Mostrar alguns registros do dicionário para debug
    Write-Host "`nPrimeiros 10 registros do dicionário:"
    $count = 0
    foreach ($key in $clientesDict.Keys) {
        if ($count -lt 10) {
            Write-Host "$key -> $($clientesDict[$key])"
            $count++
        }
    }
} else {
    Write-Host "Arquivo não encontrado: $clientesPath"
}

Write-Host "`nTeste concluído."