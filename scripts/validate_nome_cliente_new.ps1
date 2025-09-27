
    $solicitacaoPath = 'd:/Projetos/Excel/csv_output/Solicitacao.csv'
    $clientesPath = 'd:/Projetos/Excel/csv_output/Clientes-2025-09-12-18-09-07.csv'

    if (-not (Test-Path $solicitacaoPath)) { throw "Arquivo não encontrado: $solicitacaoPath" }
    if (-not (Test-Path $clientesPath)) { throw "Arquivo não encontrado: $clientesPath" }

    Add-Type -AssemblyName Microsoft.VisualBasic | Out-Null

    # Process Solicitacao.csv
    $pSolicitacao = New-Object Microsoft.VisualBasic.FileIO.TextFieldParser($solicitacaoPath, [Text.Encoding]::UTF8)
    $pSolicitacao.TextFieldType = [Microsoft.VisualBasic.FileIO.FieldType]::Delimited
    $pSolicitacao.Delimiters = @(';')
    $pSolicitacao.HasFieldsEnclosedInQuotes = $true

    $hdrSolicitacao = $pSolicitacao.ReadFields()
    $headersSolicitacao = @()
    foreach ($h in $hdrSolicitacao) { $headersSolicitacao += ($h -replace '^\uFEFF', '') }
    $idxNomeClienteInSolicitacao = [Array]::IndexOf($headersSolicitacao, 'nome_cliente')

    $solicitacaoClientes = @{}
    while (-not $pSolicitacao.EndOfData) {
        $fields = $pSolicitacao.ReadFields()
        if ($idxNomeClienteInSolicitacao -ge 0 -and $idxNomeClienteInSolicitacao -lt $fields.Length) {
            $cliente = $fields[$idxNomeClienteInSolicitacao].Trim()
            if (-not [string]::IsNullOrEmpty($cliente)) {
                $solicitacaoClientes[$cliente] = $true
            }
        }
    }
    $pSolicitacao.Close()

    # Process Clientes.csv
    $pClientes = New-Object Microsoft.VisualBasic.FileIO.TextFieldParser($clientesPath, [Text.Encoding]::UTF8)
    $pClientes.TextFieldType = [Microsoft.VisualBasic.FileIO.FieldType]::Delimited
    $pClientes.Delimiters = @(',')
    $pClientes.HasFieldsEnclosedInQuotes = $true

    $hdrClientes = $pClientes.ReadFields()
    $headersClientes = @()
    foreach ($h in $hdrClientes) { $headersClientes += ($h -replace '^\uFEFF', '') }
    $idxNomeEmpresa = [Array]::IndexOf($headersClientes, 'Nome Empresa')

    $clienteNames = @{}
    while (-not $pClientes.EndOfData) {
        $fields = $pClientes.ReadFields()
        if ($idxNomeEmpresa -ge 0 -and $idxNomeEmpresa -lt $fields.Length) {
            $clienteName = $fields[$idxNomeEmpresa].Trim()
             if (-not [string]::IsNullOrEmpty($clienteName)) {
                $clienteNames[$clienteName] = $true
            }
        }
    }
    $pClientes.Close()

    # Find inconsistencies
    $inconsistencies = @()
    foreach ($key in $solicitacaoClientes.Keys) {
        if (-not $clienteNames.ContainsKey($key)) {
            $inconsistencies += $key
        }
    }

    if ($inconsistencies.Count -gt 0) {
        Write-Output "Valores da coluna 'nome_cliente' em Solicitacao.csv que não existem em Clientes-2025-09-12-18-09-07.csv:"
        $inconsistencies | ForEach-Object { Write-Output $_ }
    } else {
        Write-Output "Todos os valores da coluna 'nome_cliente' em Solicitacao.csv existem em Clientes-2025-09-12-18-09-07.csv."
    }
