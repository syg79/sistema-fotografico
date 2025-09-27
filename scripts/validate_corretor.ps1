
    $solicitacaoPath = 'd:/Projetos/Excel/csv_output/Solicitacao.csv'
        $latestCorretoresCsv = Get-ChildItem -Path 'd:/Projetos/Excel/csv_output' -Filter 'Corretores-*.csv' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $latestCorretoresCsv) { throw "Nenhum arquivo Corretores-*.csv encontrado na pasta csv_output." }
    $corretoresPath = $latestCorretoresCsv.FullName

    if (-not (Test-Path $solicitacaoPath)) { throw "Arquivo não encontrado: $solicitacaoPath" }
    if (-not (Test-Path $corretoresPath)) { throw "Arquivo não encontrado: $corretoresPath" }

    Add-Type -AssemblyName Microsoft.VisualBasic | Out-Null

    # Process Solicitacao.csv
    $pSolicitacao = New-Object Microsoft.VisualBasic.FileIO.TextFieldParser($solicitacaoPath, [Text.Encoding]::UTF8)
    $pSolicitacao.TextFieldType = [Microsoft.VisualBasic.FileIO.FieldType]::Delimited
    $pSolicitacao.Delimiters = @(';')
    $pSolicitacao.HasFieldsEnclosedInQuotes = $true

    $hdrSolicitacao = $pSolicitacao.ReadFields()
    $headersSolicitacao = @()
    foreach ($h in $hdrSolicitacao) { $headersSolicitacao += ($h -replace '^\uFEFF', '') }
    $idxCorretorInSolicitacao = [Array]::IndexOf($headersSolicitacao, 'corretor_responsavel')

    $solicitacaoCorretores = @{}
    while (-not $pSolicitacao.EndOfData) {
        $fields = $pSolicitacao.ReadFields()
        if ($idxCorretorInSolicitacao -ge 0 -and $idxCorretorInSolicitacao -lt $fields.Length) {
            $corretor = $fields[$idxCorretorInSolicitacao].Trim()
            if (-not [string]::IsNullOrEmpty($corretor)) {
                $solicitacaoCorretores[$corretor] = $true
            }
        }
    }
    $pSolicitacao.Close()

    # Process Corretores.csv
    $pCorretores = New-Object Microsoft.VisualBasic.FileIO.TextFieldParser($corretoresPath, [Text.Encoding]::UTF8)
    $pCorretores.TextFieldType = [Microsoft.VisualBasic.FileIO.FieldType]::Delimited
    $pCorretores.Delimiters = @(',')
    $pCorretores.HasFieldsEnclosedInQuotes = $true

    $hdrCorretores = $pCorretores.ReadFields()
    $headersCorretores = @()
    foreach ($h in $hdrCorretores) { $headersCorretores += ($h -replace '^\uFEFF', '') }
    $idxNomeCorretor = [Array]::IndexOf($headersCorretores, 'Nome do Corretor Responsável')

    $corretorNames = @{}
    while (-not $pCorretores.EndOfData) {
        $fields = $pCorretores.ReadFields()
        if ($idxNomeCorretor -ge 0 -and $idxNomeCorretor -lt $fields.Length) {
            $corretorName = $fields[$idxNomeCorretor].Trim()
             if (-not [string]::IsNullOrEmpty($corretorName)) {
                $corretorNames[$corretorName] = $true
            }
        }
    }
    $pCorretores.Close()

    # Find inconsistencies
    $inconsistencies = @()
    foreach ($key in $solicitacaoCorretores.Keys) {
        if (-not $corretorNames.ContainsKey($key)) {
            $inconsistencies += $key
        }
    }

    if ($inconsistencies.Count -gt 0) {
        Write-Output "Valores da coluna 'corretor_responsavel' em Solicitacao.csv que não existem em Corretores-2025-09-12-05-59-09.csv:"
        $inconsistencies | ForEach-Object { Write-Output $_ }
    } else {
        Write-Output "Todos os valores da coluna 'corretor_responsavel' em Solicitacao.csv existem em $($latestCorretoresCsv.Name)."
    }
