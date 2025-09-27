# Script de diagnóstico focado em resolver o problema de carregamento de dicionário.

$ErrorActionPreference = 'Stop'

# --- Configuração de Pastas ---
$RootPath = $PSScriptRoot | Split-Path
$ConfigPath = Join-Path $RootPath "config"

#region Funções Auxiliares (copiadas do script principal)
function Read-Env($path) {
  if (-not (Test-Path $path)) { throw "Arquivo .env não encontrado: $path" }
  $kv = @{}
  (Get-Content -Raw -Encoding UTF8 $path) -split "`r?`n" | ForEach-Object {
    if ($_ -match '^\s*#') { return }
    if ($_ -match '^(?<k>[A-Za-z0-9_]+)=(?<v>.*)$') { $kv[$Matches.k] = $Matches.v.Trim() }
  }
  return $kv
}

function Get-Records([string]$base, $headersAuth, [string]$tableId, [int]$perPage, [int]$maxPages) {
  $page = 1
  $allRecords = New-Object System.Collections.Generic.List[object]
  while ($true) {
    if ($maxPages -gt 0 -and $page -gt $maxPages) { break }
    Write-Host "    Buscando página $page..." -NoNewline
    $uri = "$base/data-tables/$tableId/records?per_page=$perPage&page=$page"
    try {
        $resp = Invoke-RestMethod -Method GET -Uri $uri -Headers $headersAuth -TimeoutSec 180
        $items = $resp.items
        Write-Host " $($items.Count) registros."
        if (-not $items -or $items.Count -eq 0) { break }
        $allRecords.AddRange($items)
        if ($items.Count -lt $perPage) { break } # Última página
        $page++
        Start-Sleep -Seconds 1
    } catch {
        Write-Warning ("`nFalha ao buscar página $page para a tabela $tableId. Tentando novamente em 5s...")
        Write-Warning ($_.Exception.Message)
        Start-Sleep -Seconds 5
    }
  }
  return $allRecords
}

# Função de conversão com DIAGNÓSTICOS DETALHADOS
function Convert-TadabaseFieldToString($field) {
    Write-Host "--- Dentro de Convert-TadabaseFieldToString ---"
    if ($null -eq $field) {
        Write-Host "DEBUG: Valor é nulo. Retornando string vazia."
        return ''
    }

    $type = $field.GetType().FullName
    Write-Host "DEBUG: Tipo do valor de entrada: [$type]"
    
    try {
        $outString = $field | Out-String
        Write-Host "DEBUG: Valor de entrada (via Out-String): $outString"
    } catch {
        Write-Host "DEBUG: Não foi possível converter valor para Out-String."
    }

    if ($field -is [string]) {
        Write-Host "DEBUG: Condição 'is [string]' satisfeita. Retornando valor diretamente."
        return $field
    }
    
    if ($field -is [array]) {
        Write-Host "DEBUG: Condição 'is [array]' satisfeita. Processando cada item."
        $result = ($field | ForEach-Object { Convert-TadabaseFieldToString $_ }) -join ', '
        Write-Host "DEBUG: Resultado do processamento do array: [$result]"
        return $result
    }

    if ($field -is [psobject]) {
        Write-Host "DEBUG: Condição 'is [psobject]' satisfeita. Analisando propriedades."
        $props = $field.PSObject.Properties
        $propNames = $props.Name

        if (($propNames -contains 'first_name')) {
            $result = "$($field.first_name) $($field.last_name)".Trim()
            Write-Host "DEBUG: É um objeto NOME. Resultado: [$result]"
            return $result
        }
        
        if ($propNames -contains 'val') {
            $result = $field.val
            Write-Host "DEBUG: É um objeto de CONEXÃO. Resultado: [$result]"
            return $result
        }
        
        $fallbackResult = ($field | Out-String).Trim()
        Write-Host "DEBUG: É um PSObject, mas sem regra específica. Usando fallback de Out-String. Resultado: [$fallbackResult]"
        return $fallbackResult
    }

    Write-Host "DEBUG: Nenhuma condição satisfeita. Usando .ToString() como último recurso."
    return $field.ToString()
}
#endregion

# --- Lógica Principal do Teste ---
$env = Read-Env (Join-Path $ConfigPath ".env")
$base = ($env['TADABASE_API_URL']).TrimEnd('/')
$auth = @{ 'X-Tadabase-App-Id' = $env['TADABASE_APP_ID']; 'X-Tadabase-App-Key' = $env['TADABASE_APP_KEY']; 'X-Tadabase-App-Secret' = $env['TADABASE_APP_SECRET'] }

# Focar apenas no dicionário 'Regioes' que deveria ser o mais simples
$tableName = 'Regioes'
$tableId = $env['REGIOES_TABLE_ID']
$titleField = 'field_140' # O campo de título para Regioes

Write-Host "--- INICIANDO TESTE DE DICIONÁRIO PARA A TABELA '$tableName' ---"

Write-Host "Baixando 5 registros para teste..."
$records = Get-Records $base $auth $tableId 5 1 # Apenas 5 registros para o teste

$map = @{}
Write-Host "`n--- Processando $($records.Count) registros baixados ---`n"

foreach ($item in $records) {
    $id = $item.id
    # Acessar o valor do campo de título dinamicamente
    $valueToConvert = $item.PSObject.Properties[$titleField].Value

    Write-Host "================================="
    Write-Host "Processando Registro ID: $id"
    
    $title = Convert-TadabaseFieldToString $valueToConvert

    Write-Host "-> Título extraído final: '$title'"

    if ($id -and $title -and -not $map.ContainsKey($id)) {
        $map.Add($id, $title)
        Write-Host "-> SUCESSO: Adicionado ao mapa."
    } else {
        Write-Host "-> FALHA: Não foi adicionado ao mapa (ID ou Título vazio, ou ID já existe)."
    }
    Write-Host "=================================`n"
}

Write-Host "`n--- TESTE CONCLUÍDO ---"
Write-Host "Total de itens no mapa final: $($map.Count)"
Write-Host "Conteúdo do mapa:"
$map
