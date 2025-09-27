
    $solicitacaoPath = 'd:/Projetos/Excel/csv_output/Solicitacao.csv'
    $fotografosPath = 'd:/Projetos/Excel/csv_output/Fotografos.csv'

    if (-not (Test-Path $solicitacaoPath)) { throw "Arquivo não encontrado: $solicitacaoPath" }
    if (-not (Test-Path $fotografosPath)) { throw "Arquivo não encontrado: $fotografosPath" }

    Add-Type -AssemblyName Microsoft.VisualBasic | Out-Null

    # Process Solicitacao.csv
    $pSolicitacao = New-Object Microsoft.VisualBasic.FileIO.TextFieldParser($solicitacaoPath, [Text.Encoding]::UTF8)
    $pSolicitacao.TextFieldType = [Microsoft.VisualBasic.FileIO.FieldType]::Delimited
    $pSolicitacao.Delimiters = @(';')
    $pSolicitacao.HasFieldsEnclosedInQuotes = $true

    $hdrSolicitacao = $pSolicitacao.ReadFields()
    $headersSolicitacao = @()
    foreach ($h in $hdrSolicitacao) { $headersSolicitacao += ($h -replace '^\uFEFF', '') }
    $idxFotografoInSolicitacao = [Array]::IndexOf($headersSolicitacao, 'fotografo')

    $solicitacaoFotografos = @{}
    while (-not $pSolicitacao.EndOfData) {
        $fields = $pSolicitacao.ReadFields()
        if ($idxFotografoInSolicitacao -ge 0 -and $idxFotografoInSolicitacao -lt $fields.Length) {
            $fotografo = $fields[$idxFotografoInSolicitacao].Trim()
            if (-not [string]::IsNullOrEmpty($fotografo)) {
                $solicitacaoFotografos[$fotografo] = $true
            }
        }
    }
    $pSolicitacao.Close()

    # Process Fotografos.csv
    $pFotografos = New-Object Microsoft.VisualBasic.FileIO.TextFieldParser($fotografosPath, [Text.Encoding]::UTF8)
    $pFotografos.TextFieldType = [Microsoft.VisualBasic.FileIO.FieldType]::Delimited
    $pFotografos.Delimiters = @(';')
    $pFotografos.HasFieldsEnclosedInQuotes = $true

    $hdrFotografos = $pFotografos.ReadFields()
    $headersFotografos = @()
    foreach ($h in $hdrFotografos) { $headersFotografos += ($h -replace '^\uFEFF', '') }
    $idxNomeFotografo = [Array]::IndexOf($headersFotografos, 'nome_do_fotografo')

    $fotografoNames = @{}
    while (-not $pFotografos.EndOfData) {
        $fields = $pFotografos.ReadFields()
        if ($idxNomeFotografo -ge 0 -and $idxNomeFotografo -lt $fields.Length) {
            $fotografoName = $fields[$idxNomeFotografo].Trim()
             if (-not [string]::IsNullOrEmpty($fotografoName)) {
                $fotografoNames[$fotografoName] = $true
            }
        }
    }
    $pFotografos.Close()

    # Find inconsistencies
    $inconsistencies = @()
    foreach ($key in $solicitacaoFotografos.Keys) {
        if (-not $fotografoNames.ContainsKey($key)) {
            $inconsistencies += $key
        }
    }

    if ($inconsistencies.Count -gt 0) {
        Write-Output "Valores da coluna 'fotografo' em Solicitacao.csv que não existem em Fotografos.csv:"
        $inconsistencies | ForEach-Object { Write-Output $_ }
    } else {
        Write-Output "Todos os valores da coluna 'fotografo' em Solicitacao.csv existem em Fotografos.csv."
    }
