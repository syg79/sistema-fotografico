
    $solicitacaoPath = 'd:/Projetos/Excel/csv_output/Solicitacao.csv'
    $redePath = 'd:/Projetos/Excel/csv_output/Rede.csv'

    if (-not (Test-Path $solicitacaoPath)) { throw "Arquivo não encontrado: $solicitacaoPath" }
    if (-not (Test-Path $redePath)) { throw "Arquivo não encontrado: $redePath" }

    Add-Type -AssemblyName Microsoft.VisualBasic | Out-Null

    # Process Solicitacao.csv
    $pSolicitacao = New-Object Microsoft.VisualBasic.FileIO.TextFieldParser($solicitacaoPath, [Text.Encoding]::UTF8)
    $pSolicitacao.TextFieldType = [Microsoft.VisualBasic.FileIO.FieldType]::Delimited
    $pSolicitacao.Delimiters = @(';')
    $pSolicitacao.HasFieldsEnclosedInQuotes = $true

    $hdrSolicitacao = $pSolicitacao.ReadFields()
    $headersSolicitacao = @()
    foreach ($h in $hdrSolicitacao) { $headersSolicitacao += ($h -replace '^\uFEFF', '') }
    $idxRedeInSolicitacao = [Array]::IndexOf($headersSolicitacao, 'rede')

    $solicitacaoRedes = @{}
    while (-not $pSolicitacao.EndOfData) {
        $fields = $pSolicitacao.ReadFields()
        if ($idxRedeInSolicitacao -ge 0 -and $idxRedeInSolicitacao -lt $fields.Length) {
            $rede = $fields[$idxRedeInSolicitacao].Trim()
            if (-not [string]::IsNullOrEmpty($rede)) {
                $solicitacaoRedes[$rede] = $true
            }
        }
    }
    $pSolicitacao.Close()

    # Process Rede.csv
    $pRede = New-Object Microsoft.VisualBasic.FileIO.TextFieldParser($redePath, [Text.Encoding]::UTF8)
    $pRede.TextFieldType = [Microsoft.VisualBasic.FileIO.FieldType]::Delimited
    $pRede.Delimiters = @(';')
    $pRede.HasFieldsEnclosedInQuotes = $true

    $hdrRede = $pRede.ReadFields()
    $headersRede = @()
    foreach ($h in $hdrRede) { $headersRede += ($h -replace '^\uFEFF', '') }
    $idxRedeName = [Array]::IndexOf($headersRede, 'rede_imobiliaria_name')

    $redeNames = @{}
    while (-not $pRede.EndOfData) {
        $fields = $pRede.ReadFields()
        if ($idxRedeName -ge 0 -and $idxRedeName -lt $fields.Length) {
            $redeName = $fields[$idxRedeName].Trim()
             if (-not [string]::IsNullOrEmpty($redeName)) {
                $redeNames[$redeName] = $true
            }
        }
    }
    $pRede.Close()

    # Find inconsistencies
    $inconsistencies = @()
    foreach ($key in $solicitacaoRedes.Keys) {
        if (-not $redeNames.ContainsKey($key)) {
            $inconsistencies += $key
        }
    }

    if ($inconsistencies.Count -gt 0) {
        Write-Output "Valores da coluna 'rede' em Solicitacao.csv que não existem em Rede.csv:"
        $inconsistencies | ForEach-Object { Write-Output $_ }
    } else {
        Write-Output "Todos os valores da coluna 'rede' em Solicitacao.csv existem em Rede.csv."
    }
