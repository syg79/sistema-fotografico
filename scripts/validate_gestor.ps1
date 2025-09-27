
    $solicitacaoPath = 'd:/Projetos/Excel/csv_output/Solicitacao.csv'
    $gestoresPath = 'd:/Projetos/Excel/csv_output/Gestores - Vitrine-2025-09-12-00-17-20.csv'

    if (-not (Test-Path $solicitacaoPath)) { throw "Arquivo não encontrado: $solicitacaoPath" }
    if (-not (Test-Path $gestoresPath)) { throw "Arquivo não encontrado: $gestoresPath" }

    Add-Type -AssemblyName Microsoft.VisualBasic | Out-Null

    # Process Solicitacao.csv
    $pSolicitacao = New-Object Microsoft.VisualBasic.FileIO.TextFieldParser($solicitacaoPath, [Text.Encoding]::UTF8)
    $pSolicitacao.TextFieldType = [Microsoft.VisualBasic.FileIO.FieldType]::Delimited
    $pSolicitacao.Delimiters = @(';')
    $pSolicitacao.HasFieldsEnclosedInQuotes = $true

    $hdrSolicitacao = $pSolicitacao.ReadFields()
    $headersSolicitacao = @()
    foreach ($h in $hdrSolicitacao) { $headersSolicitacao += ($h -replace '^\uFEFF', '') }
    $idxGestorInSolicitacao = [Array]::IndexOf($headersSolicitacao, 'gestor')

    $solicitacaoGestores = @{}
    while (-not $pSolicitacao.EndOfData) {
        $fields = $pSolicitacao.ReadFields()
        if ($idxGestorInSolicitacao -ge 0 -and $idxGestorInSolicitacao -lt $fields.Length) {
            $gestor = $fields[$idxGestorInSolicitacao].Trim()
            if (-not [string]::IsNullOrEmpty($gestor)) {
                $solicitacaoGestores[$gestor] = $true
            }
        }
    }
    $pSolicitacao.Close()

    # Process Gestores.csv
    $pGestores = New-Object Microsoft.VisualBasic.FileIO.TextFieldParser($gestoresPath, [Text.Encoding]::UTF8)
    $pGestores.TextFieldType = [Microsoft.VisualBasic.FileIO.FieldType]::Delimited
    $pGestores.Delimiters = @(',')
    $pGestores.HasFieldsEnclosedInQuotes = $true

    $hdrGestores = $pGestores.ReadFields()
    $headersGestores = @()
    foreach ($h in $hdrGestores) { $headersGestores += ($h -replace '^\uFEFF', '') }
    $idxNomeGestor = [Array]::IndexOf($headersGestores, 'Nome do gestor')

    $gestorNames = @{}
    while (-not $pGestores.EndOfData) {
        $fields = $pGestores.ReadFields()
        if ($idxNomeGestor -ge 0 -and $idxNomeGestor -lt $fields.Length) {
            $gestorName = $fields[$idxNomeGestor].Trim()
             if (-not [string]::IsNullOrEmpty($gestorName)) {
                $gestorNames[$gestorName] = $true
            }
        }
    }
    $pGestores.Close()

    # Find inconsistencies
    $inconsistencies = @()
    foreach ($key in $solicitacaoGestores.Keys) {
        if (-not $gestorNames.ContainsKey($key)) {
            $inconsistencies += $key
        }
    }

    if ($inconsistencies.Count -gt 0) {
        Write-Output "Valores da coluna 'gestor' em Solicitacao.csv que não existem em Gestores - Vitrine-2025-09-12-00-17-20.csv:"
        $inconsistencies | ForEach-Object { Write-Output $_ }
    } else {
        Write-Output "Todos os valores da coluna 'gestor' em Solicitacao.csv existem em $($latestGestoresCsv.Name)."
    }
