# Script completo para corrigir campos de conexão e renomear colunas field_XXX para nomes corretos
param(
    [string]$CsvDir = "D:\Projetos\Excel\csv_output",
    [string]$InputFile = "Solicitacao_resolvido.csv",
    [string]$OutputFile = "Solicitacao_FINAL_COMPLETO.csv"
)

$ErrorActionPreference = 'Stop'

# Mapeamento CONHECIDO dos campos de conexão
$knownConnectionMap = @{
    'rede' = 'field_175';
    'nome_cliente' = 'field_86';
    'fotografo' = 'field_111';
    'corretor_responsavel' = 'field_179';
    'gestor' = 'field_431';
    'bairro_localidade' = 'field_142';
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

# GABARITO DE CABEÇALHOS DEFINIDO PELO USUÁRIO (ordem correta)
$finalHeaders = @(
    'auto_increment','record_id','created_at','auto_increment_2','link_email_solicitacao','status','rede','data_da_solicitacao_email','nome_cliente','data_hora_inclusao','referencia_do_cliente','tipo_do_imovel','condicao_de_habitacao','bairro_localidade','endereco_do_imovel','street_view_a','street_view_b','street_view_formula','complemento','m2','nome_do_condominio','descricao_do_imovel','contato_para_agendar_01','contato_para_agendar_02','observacao_para_o_agendamento','corretor_responsavel','data_do_agendamento','horario_da_sessao','tipo_do_servico','fotografo','fazer_area_comum','referencias_a_serem_copiadas','observacao_para_o_fotografo','data_realizada','feedback_da_sessao_fotografo_gestor_e_ou_editor','quilometragem','tour_360','quantidade_de_sessoes_foto','quantidade_de_inclusoes','quantidade_drone_video','quantidade_video','codigo_vitrine','cobranca','observacao_para_o_cliente','pre_solicitacao','publicar_agenda','diretorio','formato_apolar','mensagem_ola_conforme_contato_a_sessao_fotografica_do_imovel','msg_1_ficou_agenada_para','msg_2_a_previsao_de_chegada_do_fotografo_no_local_esta_entre','msg_3_importante_o_imovel_estar_organizado_e_pronto','msg_4_at_te','download_da_sessao_fotos','download_da_sessao_video','download_da_sessao_tour_360','download_da_sessao_04','grupo_tipo','chaves','editado','a_imagem_do_street_view_esta_mostrando_corretamente_o_imovel','outros_street_view_croqui_da_localizacao','endereco_fotografo','status_fotografo','status_tarefa','impresso','anexo','copiar_email_original','equacao_endereco','equacao_bairro','formula_endereco_para_mensagem_de_confirmacao','mensagem_envio_das_fotos_por_email','mensagem_ola','mensagem_de_envio_das_fotos_titulo','data_entregue','email_adicional','fone_corretor_01_para_msgs_de_email','formula_endereco_e_complemento','email_titulo_endereco_e_complemento','observacao_feedback_sem_quebrar','status_novo_radio','codigo_vitrine_automatico','livro_impresso','contagem_validar_livro_vitrine','atencao_fotografo','observacao_para_o_agendamento_2021','horario_sessao_list','horario_sessao_lista_completa','horario_sessao_formato_agenda','date_time_completo','hora_partiu','hora_chegou','hora_finalizou','equation','nao_possui_complemento','equation_mais_15','horario_intervalo_para_mensagem','rfc_3339_google_calendar','id_event_google_calendar','corretor_acompanhou','corretor_ajudou','possui_obs_para_o_editor','quantidade_drone_fotos','distancia','diretorio_lopes','rede_para_text_formula','diretorio_equation','equation_ano','equation_mes','equation_nome_cliente','formular_nome_do_fotografo','data_pretendida_cliente','horario_preferencial_para_a_sessao_lista_cliente_1','gestor','link_google_maps','equation_gerar_link_endereco_do_imovel_para_o_whataspp','link_google_maps_text','fechar_agenda','processado','origem','valor_do_imovel_apolar','situacao_apolar','data_angariacao_apolar','data_vencimeto_angariacao_apolar','descritivo_apolar','quantidade_dormitorios_apolar','vagas_de_garagem_apolar','observacoes_internas_apolar','endereco_agenda','emoji_pino','emoji_calendario','emoji_relogio','emoji_atencao','emoji_mapa','emji_confirmada','conferido','url_galeria_fotos_apolarnet','link_apolarnet_cadastro_fotos','arquivado_google_drive'
)

# Mapeamento automático de field_XXX para nomes corretos (baseado no gabarito)
$fieldToNameMap = @{
    'record_id' = 'record_id'
    'field_103' = 'auto_increment'
    'field_106' = 'created_at'
    'field_110' = 'auto_increment_2'
    'field_111' = 'fotografo'
    'field_112' = 'link_email_solicitacao'
    'field_113' = 'status'
    'field_114' = 'data_da_solicitacao_email'
    'field_115' = 'data_hora_inclusao'
    'field_116' = 'referencia_do_cliente'
    'field_117' = 'tipo_do_imovel'
    'field_118' = 'condicao_de_habitacao'
    'field_119' = 'endereco_do_imovel'
    'field_124' = 'street_view_a'
    'field_136' = 'street_view_b'
    'field_137' = 'street_view_formula'
    'field_139' = 'complemento'
    'field_142' = 'bairro_localidade'
    'field_175' = 'rede'
    'field_177' = 'm2'
    'field_178' = 'nome_do_condominio'
    'field_179' = 'corretor_responsavel'
    'field_183' = 'descricao_do_imovel'
    'field_184' = 'contato_para_agendar_01'
    'field_186' = 'contato_para_agendar_02'
    'field_187' = 'observacao_para_o_agendamento'
    'field_188' = 'data_do_agendamento'
    'field_189' = 'horario_da_sessao'
    'field_206' = 'tipo_do_servico'
    'field_215' = 'fazer_area_comum'
    'field_219' = 'referencias_a_serem_copiadas'
    'field_223' = 'observacao_para_o_fotografo'
    'field_233' = 'data_realizada'
    'field_234' = 'feedback_da_sessao_fotografo_gestor_e_ou_editor'
    'field_242' = 'quilometragem'
    'field_243' = 'tour_360'
    'field_244' = 'quantidade_de_sessoes_foto'
    'field_245' = 'quantidade_de_inclusoes'
    'field_246' = 'quantidade_drone_video'
    'field_247' = 'quantidade_video'
    'field_248' = 'codigo_vitrine'
    'field_249' = 'cobranca'
    'field_250' = 'observacao_para_o_cliente'
    'field_251' = 'pre_solicitacao'
    'field_270' = 'publicar_agenda'
    'field_271' = 'diretorio'
    'field_272' = 'formato_apolar'
    'field_273' = 'mensagem_ola_conforme_contato_a_sessao_fotografica_do_imovel'
    'field_274' = 'msg_1_ficou_agenada_para'
    'field_275' = 'msg_2_a_previsao_de_chegada_do_fotografo_no_local_esta_entre'
    'field_276' = 'msg_3_importante_o_imovel_estar_organizado_e_pronto'
    'field_277' = 'msg_4_at_te'
    'field_304' = 'download_da_sessao_fotos'
    'field_305' = 'download_da_sessao_video'
    'field_306' = 'download_da_sessao_tour_360'
    'field_310' = 'download_da_sessao_04'
    'field_330' = 'grupo_tipo'
    'field_331' = 'chaves'
    'field_332' = 'editado'
    'field_333' = 'a_imagem_do_street_view_esta_mostrando_corretamente_o_imovel'
    'field_340' = 'outros_street_view_croqui_da_localizacao'
    'field_341' = 'endereco_fotografo'
    'field_342' = 'status_fotografo'
    'field_345' = 'status_tarefa'
    'field_358' = 'impresso'
    'field_375' = 'anexo'
    'field_376' = 'copiar_email_original'
    'field_384' = 'equacao_endereco'
    'field_385' = 'equacao_bairro'
    'field_386' = 'formula_endereco_para_mensagem_de_confirmacao'
    'field_390' = 'codigo_vitrine_automatico'
    'field_391' = 'mensagem_envio_das_fotos_por_email'
    'field_395' = 'mensagem_ola'
    'field_398' = 'mensagem_de_envio_das_fotos_titulo'
    'field_399' = 'data_entregue'
    'field_400' = 'email_adicional'
    'field_401' = 'fone_corretor_01_para_msgs_de_email'
    'field_402' = 'formula_endereco_e_complemento'
    'field_403' = 'email_titulo_endereco_e_complemento'
    'field_404' = 'observacao_feedback_sem_quebrar'
    'field_405' = 'status_novo_radio'
    'field_406' = 'livro_impresso'
    'field_407' = 'contagem_validar_livro_vitrine'
    'field_408' = 'atencao_fotografo'
    'field_410' = 'observacao_para_o_agendamento_2021'
    'field_411' = 'horario_sessao_list'
    'field_412' = 'horario_sessao_lista_completa'
    'field_413' = 'horario_sessao_formato_agenda'
    'field_414' = 'date_time_completo'
    'field_415' = 'hora_partiu'
    'field_416' = 'hora_chegou'
    'field_417' = 'hora_finalizou'
    'field_418' = 'equation'
    'field_419' = 'nao_possui_complemento'
    'field_420' = 'equation_mais_15'
    'field_421' = 'horario_intervalo_para_mensagem'
    'field_425' = 'rfc_3339_google_calendar'
    'field_426' = 'id_event_google_calendar'
    'field_427' = 'corretor_acompanhou'
    'field_428' = 'corretor_ajudou'
    'field_429' = 'possui_obs_para_o_editor'
    'field_430' = 'quantidade_drone_fotos'
    'field_431' = 'gestor'
    'field_434' = 'distancia'
    'field_435' = 'diretorio_lopes'
    'field_436' = 'rede_para_text_formula'
    'field_437' = 'diretorio_equation'
    'field_447' = 'equation_ano'
    'field_448' = 'equation_mes'
    'field_449' = 'equation_nome_cliente'
    'field_450' = 'formular_nome_do_fotografo'
    'field_451' = 'data_pretendida_cliente'
    'field_452' = 'horario_preferencial_para_a_sessao_lista_cliente_1'
    'field_453' = 'link_google_maps'
    'field_454' = 'equation_gerar_link_endereco_do_imovel_para_o_whataspp'
    'field_455' = 'link_google_maps_text'
    'field_456' = 'fechar_agenda'
    'field_459' = 'processado'
    'field_465' = 'origem'
    'field_466' = 'valor_do_imovel_apolar'
    'field_467' = 'situacao_apolar'
    'field_468' = 'data_angariacao_apolar'
    'field_469' = 'data_vencimeto_angariacao_apolar'
    'field_470' = 'descritivo_apolar'
    'field_474' = 'quantidade_dormitorios_apolar'
    'field_475' = 'vagas_de_garagem_apolar'
    'field_487' = 'observacoes_internas_apolar'
    'field_489' = 'endereco_agenda'
    'field_85' = 'emoji_pino'
    'field_86' = 'nome_cliente'
    'field_89' = 'emoji_calendario'
    'field_92' = 'emoji_relogio'
    'field_93' = 'emoji_atencao'
    'field_94' = 'emoji_mapa'
    'field_95' = 'emji_confirmada'
    'field_96' = 'conferido'
    'field_97' = 'url_galeria_fotos_apolarnet'
    'field_98' = 'link_apolarnet_cadastro_fotos'
    'field_99' = 'arquivado_google_drive'
}

#region Funções Auxiliares

# Função para ler arquivo .env
function Read-Env($path) {
    $env = @{}
    if (Test-Path $path) {
        Get-Content $path | ForEach-Object {
            if ($_ -match '^([^=]+)=(.*)$') {
                $env[$matches[1].Trim()] = $matches[2].Trim()
            }
        }
    }
    return $env
}

# Função para converter valores do Tadabase em string
function Convert-TadabaseFieldToString($field) {
    if ($null -eq $field) { return '' }
    if ($field -is [string]) { 
        # Limpar valores problemáticos
        if ($field -match '^@\{.*\}$') {
            # Tentar extrair informações úteis de objetos serializados
            if ($field -match 'text=([^;]+)') {
                return $matches[1]
            }
            if ($field -match 'address=([^;]+)') {
                return $field -replace '@\{|\}', '' -replace ';', ', '
            }
            return ''
        }
        return $field
    }
    
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
        if ($propNames -contains 'text') { return $field.text }
        
        return ($props | ForEach-Object { "$($_.Name): $($_.Value)" }) -join '; '
    }

    return [string]$field
}

# Função para ler dicionários CSV
function Read-DictionaryCsv($fileName, $idColumn, $nameColumn) {
    $filePath = Join-Path $CsvDir $fileName
    $map = @{}
    
    if (-not (Test-Path $filePath)) {
        Write-Warning "Arquivo de dicionário não encontrado: $fileName"
        return $map
    }
    
    $csvData = Import-Csv -Path $filePath -Delimiter ';'
    foreach ($row in $csvData) {
        $id = [string]$row.$idColumn
        $nameValue = [string]$row.$nameColumn
        
        if ($id -and $nameValue) {
            $extractedName = Convert-TadabaseFieldToString $nameValue
            if (-not $map.ContainsKey($id)) {
                $map.Add($id, $extractedName)
            }
        }
    }
    
    Write-Host "Dicionário '$fileName' carregado com $($map.Count) itens."
    return $map
}

# Função para escrever CSV com BOM
function Write-CsvWithBom([string]$path, [object[]]$rows) {
    if ($rows.Count -eq 0) {
        Write-Warning "Nenhum dado para escrever no arquivo de saída."
        return
    }
    $rows | Export-Csv -Path $path -Delimiter ';' -NoTypeInformation -Encoding UTF8
    Write-Host "[OK] Arquivo final salvo em: $path"
}

#endregion

Write-Host "=== INICIANDO CORREÇÃO COMPLETA ==="

# 1. Ler arquivo de entrada
$inputPath = Join-Path $CsvDir $InputFile
if(-not (Test-Path $inputPath)){ throw "Arquivo não encontrado: $inputPath" }

Write-Host "Lendo arquivo: $inputPath"
$csvData = Import-Csv -Path $inputPath -Delimiter ';'
Write-Host "Arquivo carregado: $($csvData.Count) registros, $($csvData[0].PSObject.Properties.Count) colunas"

# 2. Construir mapas de conexão
Write-Host "Construindo mapas de conexão..."
$dictionaryFiles = @(
    @{ Name = 'Rede';       File = 'Rede.csv';                     IdCol = 'record_id'; NameCol = 'rede_imobiliaria_name' },
    @{ Name = 'Clientes';   File = 'Clientes.csv';                 IdCol = 'record_id'; NameCol = 'nome_empresa' },
    @{ Name = 'Fotografos'; File = 'Fotografos.csv';               IdCol = 'record_id'; NameCol = 'nome_do_fotografo' },
    @{ Name = 'Corretores'; File = 'Corretores-2025-09-12-05-59-09.csv'; IdCol = 'Record ID'; NameCol = 'Nome do Corretor Responsável' },
    @{ Name = 'Gestores';   File = 'Gestores - Vitrine-2025-09-12-00-17-20.csv'; IdCol = 'Record ID'; NameCol = 'Nome do gestor' },
    @{ Name = 'Regioes';    File = 'Regioes-2025-09-11-21-21-15.csv';  IdCol = 'Record ID'; NameCol = 'Bairro Name' }
)

$lookupMaps = @{}
foreach ($dict in $dictionaryFiles) {
    $lookupMaps[$dict.Name] = Read-DictionaryCsv -fileName $dict.File -idColumn $dict.IdCol -nameColumn $dict.NameCol
}

Write-Host "Mapas construídos: Rede($($lookupMaps['Rede'].Count)), Cliente($($lookupMaps['Clientes'].Count)), Fotógrafo($($lookupMaps['Fotografos'].Count)), Corretor($($lookupMaps['Corretores'].Count)), Gestor($($lookupMaps['Gestores'].Count)), Regiao($($lookupMaps['Regioes'].Count))"

# 3. Processar cada registro
Write-Host "Processando registros..."
$finalRecords = foreach ($row in $csvData) {
    $orderedRecord = [ordered]@{}
    
    # Para cada campo no gabarito final
    foreach ($headerName in $finalHeaders) {
        $value = ''
        
        # Encontrar o field_XXX correspondente
        $fieldKey = $null
        foreach ($key in $fieldToNameMap.Keys) {
            if ($fieldToNameMap[$key] -eq $headerName) {
                $fieldKey = $key
                break
            }
        }
        
        # Se encontrou o campo no arquivo original
        if ($fieldKey -and $row.PSObject.Properties.Name -contains $fieldKey) {
            $rawValue = $row.$fieldKey
            
            # Verificar se é um campo de conexão que precisa ser resolvido
            if ($knownConnectionMap.ContainsValue($fieldKey)) {
                # Encontrar qual conexão é esta
                $connectionName = $null
                foreach ($connKey in $knownConnectionMap.Keys) {
                    if ($knownConnectionMap[$connKey] -eq $fieldKey) {
                        $connectionName = $connKey
                        break
                    }
                }
                
                if ($connectionName -and $connectionTargetToDictionary.ContainsKey($connectionName)) {
                    $dictName = $connectionTargetToDictionary[$connectionName]
                    if ($lookupMaps.ContainsKey($dictName) -and $lookupMaps[$dictName].ContainsKey($rawValue)) {
                        $value = $lookupMaps[$dictName][$rawValue]
                    } else {
                        $value = Convert-TadabaseFieldToString $rawValue
                    }
                } else {
                    $value = Convert-TadabaseFieldToString $rawValue
                }
            } else {
                # Campo normal, apenas converter
                $value = Convert-TadabaseFieldToString $rawValue
            }
        }
        
        $orderedRecord[$headerName] = $value
    }
    
    [pscustomobject]$orderedRecord
}

# 4. Salvar arquivo final
$outputPath = Join-Path $CsvDir $OutputFile
Write-CsvWithBom $outputPath $finalRecords

Write-Host "=== CONCLUÍDO ==="
Write-Host "Arquivo salvo: $outputPath"
Write-Host "Total de registros: $($finalRecords.Count)"
Write-Host "Total de colunas: $($finalHeaders.Count)"
Write-Host "Colunas na ordem correta: $($finalHeaders.Count)/$($finalHeaders.Count)"