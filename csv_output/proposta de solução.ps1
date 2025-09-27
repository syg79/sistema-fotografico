param(
  [string[]]$TablesToProcess = @('Solicitacao'),
  [int]$PageSize = 100,
  [int]$MaxPages = 0 # 0 = todas as páginas. Use 1 para um teste rápido.
)

$ErrorActionPreference = 'Stop'

# --- Configuração de Pastas ---
$RootPath = $PSScriptRoot | Split-Path
$OutputCsvPath = Join-Path $RootPath "csv_output"
$DictionaryPath = Join-Path $OutputCsvPath "dictionaries"
$ConfigPath = Join-Path $RootPath "config"

#region Helper Functions
function Read-Env($path) {
  if (-not (Test-Path $path)) { throw "Arquivo .env não encontrado: $path" }
  $kv = @{}
  (Get-Content -Raw -Encoding UTF8 $path) -split "`r?`n" | ForEach-Object {
    if ($_ -match '^\s*#') { return }
    if ($_ -match '^(?<k>[A-Za-z0-9_]+)=(?<v>.*)$') { $kv[$Matches.k] = $Matches.v.Trim() }
  }
  return $kv
}

# NOVA FUNÇÃO: Obter estrutura da tabela e criar mapa de tradução
function Get-TableFieldMapping([string]$base, $headersAuth, [string]$tableId) {
    Write-Host "  Obtendo estrutura da tabela (mapeamento de campos)..." -NoNewline
    
    try {
        # Endpoint para obter a estrutura da tabela
        $uri = "$base/data-tables/$tableId"
        $response = Invoke-RestMethod -Method GET -Uri $uri -Headers $headersAuth -TimeoutSec 30
        
        $fieldMap = @{}
        
        # Processar campos da tabela
        foreach ($field in $response.fields) {
            # O nome "slug" é o nome amigável (ex: "m2", "status")
            # O "key" é o nome interno (ex: "field_123")
            $friendlyName = $field.slug
            $internalName = $field.key
            
            if ($friendlyName -and $internalName) {
                # Criar mapeamento: nome_amigavel -> field_XXX
                $fieldMap[$friendlyName] = $internalName
                
                # Também mapear variações comuns de nomenclatura
                # (underscore vs hífen, maiúsculas/minúsculas)
                $variations = @(
                    $friendlyName.ToLower(),
                    $friendlyName.ToUpper(),
                    $friendlyName -replace '-', '_',
                    $friendlyName -replace '_', '-'
                )
                
                foreach ($variant in $variations) {
                    if (-not $fieldMap.ContainsKey($variant)) {
                        $fieldMap[$variant] = $internalName
                    }
                }
            }
        }
        
        Write-Host " OK! $($fieldMap.Count) campos mapeados."
        return $fieldMap
    }
    catch {
        Write-Warning "`nFalha ao obter estrutura da tabela. Erro: $_"
        Write-Warning "Continuando com mapeamento parcial..."
        return @{}
    }
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

function Write-CsvWithBom([string]$path, [object[]]$rows, [string[]]$headers) {
  $enc = New-Object System.Text.UTF8Encoding($true)
  $sw = New-Object System.IO.StreamWriter($path, $false, $enc)
  try {
    $hdr = ($headers | ForEach-Object { '"' + ($_ -replace '"', '""') + '"' }) -join ';'
    $sw.WriteLine($hdr)
    foreach ($r in $rows) {
      $vals = @()
      foreach ($h in $headers) {
        $v = if ($r.PSObject.Properties.Name -contains $h) { $r.$h } else { '' }
        $s = if ($null -eq $v) { '' } else { [string]$v }
        $vals += ('"' + ($s -replace '"', '""') + '"')
      }
      $sw.WriteLine(($vals -join ';'))
    }
  } finally { $sw.Flush(); $sw.Dispose() }
}
#endregion

# --- INÍCIO DA LÓGICA ---

# 1. Setup
if (-not (Test-Path $OutputCsvPath)) { New-Item -ItemType Directory -Path $OutputCsvPath | Out-Null }
if (-not (Test-Path $DictionaryPath)) { New-Item -ItemType Directory -Path $DictionaryPath | Out-Null }

$env = Read-Env (Join-Path $ConfigPath ".env")
$base = ($env['TADABASE_API_URL']).TrimEnd('/')
$auth = @{ 'X-Tadabase-App-Id' = $env['TADABASE_APP_ID']; 'X-Tadabase-App-Key' = $env['TADABASE_APP_KEY']; 'X-Tadabase-App-Secret' = $env['TADABASE_APP_SECRET'] }

# 2. Configuração dos Dicionários e Conexões
$dictionaryConfig = @(
    @{ Name = 'Rede';          EnvKey = 'REDE_TABLE_ID';           TitleExtractor = { Convert-TadabaseFieldToString $param.item.field_154 } },
    @{ Name = 'Clientes';      EnvKey = 'CLIENTES_TABLE_ID';       TitleExtractor = { Convert-TadabaseFieldToString $param.item.field_57 } },
    @{ Name = 'Fotografos';    EnvKey = 'FOTOGRAFOS_TABLE_ID';     TitleExtractor = { Convert-TadabaseFieldToString $param.item.field_48 } },
    @{ Name = 'Corretores';    EnvKey = 'CORRETORES_TABLE_ID';     TitleExtractor = { Convert-TadabaseFieldToString $param.item.field_72 } },
    @{ Name = 'Gestores';      EnvKey = 'GESTORES_TABLE_ID';       TitleExtractor = { Convert-TadabaseFieldToString $param.item.field_38 } },
    @{ Name = 'Regioes';       EnvKey = 'REGIOES_TABLE_ID';        TitleExtractor = { Convert-TadabaseFieldToString $param.item.field_140 } },
    @{ Name = 'CodigoVitrine'; EnvKey = 'CODIGO_VITRINE_TABLE_ID'; TitleExtractor = { Convert-TadabaseFieldToString $param.item.field_388 } }
)

# Mapeamento CONHECIDO dos campos de conexão (será mesclado com o mapeamento automático)
$knownConnectionMap = @{
    'rede' = 'field_175';
    'nome_cliente' = 'field_86';
    'fotografo' = 'field_111';
    'corretor_responsavel' = 'field_179';
    'gestor' = 'field_431';
    'bairro_localidade' = 'field_142'; # Regiao
    'codigo_vitrine_automatico' = 'field_390'
}

# Dicionário para mapear o nome do campo de destino para o nome do dicionário de busca
$connectionTargetToDictionary = @{
    'rede' = 'Rede';
    'nome_cliente' = 'Clientes';
    'fotografo' = 'Fotografos';
    'corretor_responsavel' = 'Corretores';
    'gestor' = 'Gestores';
    'bairro_localidade' = 'Regioes';
    'codigo_vitrine_automatico' = 'CodigoVitrine'
}

# GABARITO DE CABEÇALHOS DEFINIDO PELO USUÁRIO
$finalHeaders = @(
    'auto_increment','record_id','created_at','auto_increment_2','link_email_solicitacao','status','rede','data_da_solicitacao_email','nome_cliente','data_hora_inclusao','referencia_do_cliente','tipo_do_imovel','condicao_de_habitacao','bairro_localidade','endereco_do_imovel','street_view_a','street_view_b','street_view_formula','complemento','m2','nome_do_condominio','descricao_do_imovel','contato_para_agendar_01','contato_para_agendar_02','observacao_para_o_agendamento','corretor_responsavel','data_do_agendamento','horario_da_sessao','tipo_do_servico','fotografo','fazer_area_comum','referencias_a_serem_copiadas','observacao_para_o_fotografo','data_realizada','feedback_da_sessao_fotografo_gestor_e_ou_editor','quilometragem','tour_360','quantidade_de_sessoes_foto','quantidade_de_inclusoes','quantidade_drone_video','quantidade_video','codigo_vitrine','cobranca','observacao_para_o_cliente','pre_solicitacao','publicar_agenda','diretorio','formato_apolar','mensagem_ola_conforme_contato_a_sessao_fotografica_do_imovel','msg_1_ficou_agenada_para','msg_2_a_previsao_de_chegada_do_fotografo_no_local_esta_entre','msg_3_importante_o_imovel_estar_organizado_e_pronto','msg_4_at_te','download_da_sessao_fotos','download_da_sessao_video','download_da_sessao_tour_360','download_da_sessao_04','grupo_tipo','chaves','editado','a_imagem_do_street_view_esta_mostrando_corretamente_o_imovel','outros_street_view_croqui_da_localizacao','endereco_fotografo','status_fotografo','status_tarefa','impresso','anexo','copiar_email_original','equacao_endereco','equacao_bairro','formula_endereco_para_mensagem_de_confirmacao','mensagem_envio_das_fotos_por_email','mensagem_ola','mensagem_de_envio_das_fotos_titulo','data_entregue','email_adicional','fone_corretor_01_para_msgs_de_email','formula_endereco_e_complemento','email_titulo_endereco_e_complemento','observacao_feedback_sem_quebrar','status_novo_radio','codigo_vitrine_automatico','livro_impresso','contagem_validar_livro_vitrine','atencao_fotografo','observacao_para_o_agendamento_2021','horario_sessao_list','horario_sessao_lista_completa','horario_sessao_formato_agenda','date_time_completo','hora_partiu','hora_chegou','hora_finalizou','equation','nao_possui_complemento','equation_mais_15','horario_intervalo_para_mensagem','rfc_3339_google_calendar','id_event_google_calendar','corretor_acompanhou','corretor_ajudou','possui_obs_para_o_editor','quantidade_drone_fotos','distancia','diretorio_lopes','rede_para_text_formula','diretorio_equation','equation_ano','equation_mes','equation_nome_cliente','formular_nome_do_fotografo','data_pretendida_cliente','horario_preferencial_para_a_sessao_lista_cliente_1','gestor','link_google_maps','equation_gerar_link_endereco_do_imovel_para_o_whataspp','link_google_maps_text','fechar_agenda','processado','origem','valor_do_imovel_apolar','situacao_apolar','data_angariacao_apolar','data_vencimeto_angariacao_apolar','descritivo_apolar','quantidade_dormitorios_apolar','vagas_de_garagem_apolar','observacoes_internas_apolar','endereco_agenda','emoji_pino','emoji_calendario','emoji_relogio','emoji_atencao','emoji_mapa','emji_confirmada','conferido','url_galeria_fotos_apolarnet','link_apolarnet_cadastro_fotos','arquivado_google_drive'
)

# 3. Baixar e carregar dicionários em memória
Write-Host '--- PASSO 1: ATUALIZANDO E CARREGANDO DICIONÁRIOS ---'
$lookupMaps = @{}
foreach ($config in $dictionaryConfig) {
    $tableName = $config.Name
    $tableId = $env[$config.EnvKey]
    if (-not $tableId) { Write-Warning "Sem TABLE_ID para o dicionário '$tableName'. Pulando."; continue }
    
    Write-Host "Baixando dicionário: $tableName..."
    $records = Get-Records $base $auth $tableId 500 0
    if ($records.Count -eq 0) { Write-Warning "Nenhum registro encontrado para o dicionário $tableName. Pulando."; continue }

    $map = @{}
    foreach ($item in $records) {
        $id = $item.id
        $title = & $config.TitleExtractor -item $item
        if ($id -and $title -and -not $map.ContainsKey($id)) {
            $map.Add($id, $title)
        }
    }
    $lookupMaps[$tableName] = $map
    Write-Host " -> Mapa '$tableName' carregado na memória com $($map.Count) itens."
}

# 4. Processar a tabela principal
Write-Host ''
Write-Host '--- PASSO 2: PROCESSANDO TABELA PRINCIPAL ---'
foreach ($tableToProcess in $TablesToProcess) {
    $tableId = $env["$($tableToProcess.ToUpper())_TABLE_ID"]
    if (-not $tableId) { Write-Warning "Sem TABLE_ID para a tabela '$tableToProcess'. Pulando."; continue }

    # NOVO: Obter o mapeamento completo de campos da API
    Write-Host "Obtendo estrutura da tabela $tableToProcess..."
    $autoFieldMap = Get-TableFieldMapping $base $auth $tableId
    
    # Mesclar o mapeamento automático com o mapeamento conhecido
    # (o mapeamento conhecido tem prioridade)
    $completeFieldMap = $autoFieldMap.Clone()
    foreach ($key in $knownConnectionMap.Keys) {
        $completeFieldMap[$key] = $knownConnectionMap[$key]
    }
    
    # Debug: Mostrar alguns mapeamentos descobertos
    Write-Host "  Exemplo de mapeamentos descobertos:"
    $exampleFields = @('status', 'm2', 'tipo_do_imovel', 'complemento', 'tour_360')
    foreach ($field in $exampleFields) {
        if ($completeFieldMap.ContainsKey($field)) {
            Write-Host "    $field -> $($completeFieldMap[$field])"
        }
    }

    Write-Host "Baixando registros da tabela: $tableToProcess..."
    $sourceRecords = Get-Records $base $auth $tableId $PageSize $MaxPages
    if ($sourceRecords.Count -eq 0) { Write-Warning "Nenhum registro encontrado para $tableToProcess. Pulando."; continue }
    
    Write-Host ''
    Write-Host '--- PASSO 3: CONSTRUINDO ARQUIVO FINAL COM ESTRUTURA CORRETA ---'
    $finalRecords = foreach ($rec in $sourceRecords) {
        $orderedRecord = [ordered]@{}
        foreach ($headerName in $finalHeaders) {
            $resolvedValue = ''
            
            # Determinar o nome do campo interno (field_XXX)
            $internalFieldName = $null
            
            # Primeiro, verificar se temos um mapeamento para este campo
            if ($completeFieldMap.ContainsKey($headerName)) {
                $internalFieldName = $completeFieldMap[$headerName]
            }
            # Se não encontrou, tentar com underscore/hífen
            elseif ($completeFieldMap.ContainsKey($headerName -replace '-', '_')) {
                $internalFieldName = $completeFieldMap[$headerName -replace '-', '_']
            }
            elseif ($completeFieldMap.ContainsKey($headerName -replace '_', '-')) {
                $internalFieldName = $completeFieldMap[$headerName -replace '_', '-']
            }
            # Última tentativa: usar o próprio nome como está
            else {
                $internalFieldName = $headerName
            }

            # Agora processar o valor
            if ($connectionTargetToDictionary.ContainsKey($headerName)) {
                # É um campo de conexão - fazer lookup no dicionário
                $dictName = $connectionTargetToDictionary[$headerName]
                $map = $lookupMaps[$dictName]
                
                $connectionObject = $rec.$internalFieldName
                $connectionIds = @()
                if ($null -ne $connectionObject) {
                    if ($connectionObject -is [array]) { $connectionIds = $connectionObject.id } 
                    else { $connectionIds = $connectionObject.id }
                }

                $resolvedValues = @()
                foreach($id in $connectionIds){
                    if($map.ContainsKey($id)){ $resolvedValues += $map[$id] }
                }
                $resolvedValue = $resolvedValues -join ', '
            }
            else {
                # Campo normal - buscar e limpar o valor
                if ($rec.PSObject.Properties.Name -contains $internalFieldName) {
                    $originalValue = $rec.$internalFieldName
                    $resolvedValue = Convert-TadabaseFieldToString $originalValue
                }
                # Se ainda não encontrou, tentar buscar pelo nome original
                elseif ($internalFieldName -ne $headerName -and $rec.PSObject.Properties.Name -contains $headerName) {
                    $originalValue = $rec.$headerName
                    $resolvedValue = Convert-TadabaseFieldToString $originalValue
                }
            }
            $orderedRecord[$headerName] = $resolvedValue
        }
        [pscustomobject]$orderedRecord
    }
    Write-Host "[OK] Registros limpos e reordenados: $($finalRecords.Count)"

    # 5. Salvar o resultado final em CSV
    $finalCsvPath = Join-Path $OutputCsvPath "$tableToProcess.csv"
    Write-CsvWithBom -path $finalCsvPath -rows $finalRecords -headers $finalHeaders
    Write-Host ""
    Write-Host "[OK] Tabela final '$tableToProcess' salva em '$finalCsvPath'."
}

Write-Host ''
Write-Host 'Processo concluído!'
Write-Host ''