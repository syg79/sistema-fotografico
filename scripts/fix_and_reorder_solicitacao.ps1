param(
    [string]$CsvDir = "D:\Projetos\Excel\csv_output",
    [string]$InputFile = "Solicitacao_resolvido.csv",
    [string]$OutputFile = "Solicitacao_FINAL_COMPLETO.csv",
    [int]$PageSize = 200,
    [int]$MaxPages = 0 # 0 = todas
)

$ErrorActionPreference = 'Stop'

# Ordem correta das colunas conforme especificado pelo usuário
$CorrectColumnOrder = @(
    'auto_increment', 'record_id', 'created_at', 'auto_increment_2', 'link_email_solicitacao', 'status', 'rede', 'data_da_solicitacao_email', 'nome_cliente', 'data_hora_inclusao', 'referencia_do_cliente', 'tipo_do_imovel', 'condicao_de_habitacao', 'bairro_localidade', 'endereco_do_imovel', 'street_view_a', 'street_view_b', 'street_view_formula', 'complemento', 'm2', 'nome_do_condominio', 'descricao_do_imovel', 'contato_para_agendar_01', 'contato_para_agendar_02', 'observacao_para_o_agendamento', 'corretor_responsavel', 'data_do_agendamento', 'horario_da_sessao', 'tipo_do_servico', 'fotografo', 'fazer_area_comum', 'referencias_a_serem_copiadas', 'observacao_para_o_fotografo', 'data_realizada', 'feedback_da_sessao_fotografo_gestor_e_ou_editor', 'quilometragem', 'tour_360', 'quantidade_de_sessoes_foto', 'quantidade_de_inclusoes', 'quantidade_drone_video', 'quantidade_video', 'codigo_vitrine', 'cobranca', 'observacao_para_o_cliente', 'pre_solicitacao', 'publicar_agenda', 'diretorio', 'formato_apolar', 'mensagem_ola_conforme_contato_a_sessao_fotografica_do_imovel', 'msg_1_ficou_agenada_para', 'msg_2_a_previsao_de_chegada_do_fotografo_no_local_esta_entre', 'msg_3_importante_o_imovel_estar_organizado_e_pronto', 'msg_4_at_te', 'download_da_sessao_fotos', 'download_da_sessao_video', 'download_da_sessao_tour_360', 'download_da_sessao_04', 'grupo_tipo', 'chaves', 'editado', 'a_imagem_do_street_view_esta_mostrando_corretamente_o_imovel', 'outros_street_view_croqui_da_localizacao', 'endereco_fotografo', 'status_fotografo', 'status_tarefa', 'impresso', 'anexo', 'copiar_email_original', 'equacao_endereco', 'equacao_bairro', 'formula_endereco_para_mensagem_de_confirmacao', 'mensagem_envio_das_fotos_por_email', 'mensagem_ola', 'mensagem_de_envio_das_fotos_titulo', 'data_entregue', 'email_adicional', 'fone_corretor_01_para_msgs_de_email', 'formula_endereco_e_complemento', 'email_titulo_endereco_e_complemento', 'observacao_feedback_sem_quebrar', 'status_novo_radio', 'codigo_vitrine_automatico', 'livro_impresso', 'contagem_validar_livro_vitrine', 'atencao_fotografo', 'observacao_para_o_agendamento_2021', 'horario_sessao_list', 'horario_sessao_lista_completa', 'horario_sessao_formato_agenda', 'date_time_completo', 'hora_partiu', 'hora_chegou', 'hora_finalizou', 'equation', 'nao_possui_complemento', 'equation_mais_15', 'horario_intervalo_para_mensagem', 'rfc_3339_google_calendar', 'id_event_google_calendar', 'corretor_acompanhou', 'corretor_ajudou', 'possui_obs_para_o_editor', 'quantidade_drone_fotos', 'distancia', 'diretorio_lopes', 'rede_para_text_formula', 'diretorio_equation', 'equation_ano', 'equation_mes', 'equation_nome_cliente', 'formular_nome_do_fotografo', 'data_pretendida_cliente', 'horario_preferencial_para_a_sessao_lista_cliente_1', 'gestor', 'link_google_maps', 'equation_gerar_link_endereco_do_imovel_para_o_whataspp', 'link_google_maps_text', 'fechar_agenda', 'processado', 'origem', 'valor_do_imovel_apolar', 'situacao_apolar', 'data_angariacao_apolar', 'data_vencimeto_angariacao_apolar', 'descritivo_apolar', 'quantidade_dormitorios_apolar', 'vagas_de_garagem_apolar', 'observacoes_internas_apolar', 'endereco_agenda', 'emoji_pino', 'emoji_calendario', 'emoji_relogio', 'emoji_atencao', 'emoji_mapa', 'emji_confirmada', 'conferido', 'url_galeria_fotos_apolarnet', 'link_apolarnet_cadastro_fotos', 'arquivado_google_drive'
)

#region Funções Auxiliares

function Read-Env($path){
    if(-not (Test-Path $path)){ throw "Arquivo .env não encontrado: $path" }
    $kv=@{}; (Get-Content -Raw -Encoding UTF8 $path) -split "`r?`n" | % { if($_ -match '^(?<k>[^=]+)=(?<v>.*)$'){ $kv[$Matches.k]=$Matches.v } }
    return $kv
}

function Flatten-Value($val){
    if($null -eq $val){ return '' }
    if(($val -is [string]) -or ($val -is [ValueType])){ return ''+$val }
    if($val -is [System.Collections.IEnumerable]){
        $out = New-Object System.Collections.Generic.List[string]
        foreach($it in $val){ $out.Add((Flatten-Value $it)) }
        return ($out | Where-Object { $_ -ne '' }) -join '; '
    }
    if($val -is [psobject]){
        foreach($k in 'title','record_title','name','val','label'){
            if($val.PSObject.Properties.Name -contains $k){ return ''+$val.$k }
        }
    }
    return ''+$val
}

function Read-CsvUtf8([string]$path){
    Add-Type -AssemblyName Microsoft.VisualBasic | Out-Null
    $p = New-Object Microsoft.VisualBasic.FileIO.TextFieldParser($path,[Text.Encoding]::UTF8)
    $p.TextFieldType=[Microsoft.VisualBasic.FileIO.FieldType]::Delimited
    $p.Delimiters=@(';')
    $p.HasFieldsEnclosedInQuotes=$true
    $hdr=$p.ReadFields()
    $headers=@(); foreach($h in $hdr){ $headers += ($h -replace '^[\uFEFF]', '') }
    $rows=@()
    while(-not $p.EndOfData){
        $f=$p.ReadFields(); $obj=[ordered]@{}
        for($i=0;$i -lt $headers.Length;$i++){ $obj[$headers[$i]] = if($i -lt $f.Length){ $f[$i] } else { '' } }
        $rows += [pscustomobject]$obj
    }
    $p.Close(); return @($headers,$rows)
}

function Write-CsvBom([string]$path,[string[]]$headers,[object[]]$rows){
    $enc = New-Object System.Text.UTF8Encoding($true)
    $sw = New-Object System.IO.StreamWriter($path,$false,$enc)
    try{ 
        $sw.WriteLine( ($headers | % { '"' + ($_ -replace '"','""') + '"' }) -join ';' )
        foreach($r in $rows){ 
            $vals=@(); 
            foreach($h in $headers){ 
                $s=[string]$r.$h; 
                $vals += ('"'+($s -replace '"','""')+'"') 
            }
            $sw.WriteLine(($vals -join ';')) 
        } 
    } finally { $sw.Flush(); $sw.Dispose() }
}

# Lê CSV local e cria mapa id->title
function Build-MapFromCsv([string]$path,[string]$idCol,[string]$titleCol){
    if(-not (Test-Path $path)){ return @{} }
    $csv = Read-CsvUtf8 $path
    $hdr = $csv[0]; $rows = $csv[1]
    if(-not ($hdr -contains $idCol) -or -not ($hdr -contains $titleCol)){ return @{} }
    $m=@{}; foreach($r in $rows){ $id=[string]$r.$idCol; $title=[string]$r.$titleCol; if($id){ $m[$id]=$title } }
    return $m
}

# Busca arquivos CSV por padrão e constrói mapa
function Build-MapFromPattern([string]$pattern, [string[]]$titleRegexes){
    $file = Get-ChildItem -File $CsvDir | Where-Object { $_.Name -match $pattern } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if(-not $file){ return @{} }
    
    Add-Type -AssemblyName Microsoft.VisualBasic | Out-Null
    $p = New-Object Microsoft.VisualBasic.FileIO.TextFieldParser($file.FullName,[Text.Encoding]::UTF8)
    $p.TextFieldType=[Microsoft.VisualBasic.FileIO.FieldType]::Delimited; $p.Delimiters=@(';',','); $p.HasFieldsEnclosedInQuotes=$true
    $hdr=$p.ReadFields(); $headers=@(); foreach($h in $hdr){ $headers += ($h -replace '^[\uFEFF]', '') }
    $idCol = ($headers | Where-Object { $_ -match '^(?i)(record[_ ]?id|id)$' } | Select-Object -First 1)
    if(-not $idCol){ $p.Close(); return @{} }
    $titleCol = $null
    foreach($rx in $titleRegexes){ $titleCol = ($headers | Where-Object { $_ -match $rx } | Select-Object -First 1); if($titleCol){ break } }
    if(-not $titleCol){
        # fallback: primeira coluna não-sistêmica
        $titleCol = ($headers | Where-Object { $_ -notmatch '^(?i)(auto_increment|record[_ ]?id|created_at)$' } | Select-Object -First 1)
    }
    $rows=@{}; while(-not $p.EndOfData){ $f=$p.ReadFields(); $dict=@{}; for($i=0;$i -lt $headers.Length;$i++){ $dict[$headers[$i]] = if($i -lt $f.Length){ $f[$i] } else { '' } }; $id = [string]$dict[$idCol]; $title=[string]$dict[$titleCol]; if($id){ $rows[$id]=$title } }
    $p.Close(); return $rows
}

# Função para buscar dados da API (caso necessário)
function Fetch-Map(){
    $env = Read-Env "config/.env"
    $base = ($env['TADABASE_API_URL']).TrimEnd('/')
    $headers = @{ 'X-Tadabase-App-Id'=$env['TADABASE_APP_ID']; 'X-Tadabase-App-Key'=$env['TADABASE_APP_KEY']; 'X-Tadabase-App-Secret'=$env['TADABASE_APP_SECRET'] }
    $tableId = $env['SOLICITACAO_TABLE_ID']
    if(-not $tableId){ throw 'SOLICITACAO_TABLE_ID ausente no .env' }
    $page=1; $map=@{}
    while($true){
        if($MaxPages -gt 0 -and $page -gt $MaxPages){ break }
        $url = "$base/data-tables/$tableId/records?per_page=$PageSize&page=$page"
        try { $resp = Invoke-RestMethod -Method GET -Uri $url -Headers $headers -TimeoutSec 120 } catch { break }
        $items = if($resp.data){ $resp.data } elseif($resp.items){ $resp.items } else { $resp }
        if(-not $items -or $items.Count -eq 0){ break }
        foreach($it in $items){
            $rid = ''+$it.id
            if(-not $rid){ continue }
            $map[$rid] = [pscustomobject]@{
                rede                 = Flatten-Value $it.field_175
                nome_cliente         = Flatten-Value $it.field_86
                fotografo            = Flatten-Value $it.field_111
                bairro_localidade    = Flatten-Value $it.field_142
                tipo_do_servico      = Flatten-Value $it.field_92
                codigo_vitrine_automatico = Flatten-Value $it.field_390
                nao_possui_complemento    = Flatten-Value $it.field_212
                gestor               = Flatten-Value $it.field_431
                corretor_responsavel = Flatten-Value $it.field_109
            }
        }
        $page++
    }
    return $map
}

# Função para processar campos com @{link=; text=} e @{address=...}
function Process-ConnectionField([string]$value){
    if([string]::IsNullOrWhiteSpace($value)){ return $value }
    
    # Processar campos @{link=; text=}
    if($value -match '@\{link=([^;]*);\s*text=([^}]*)\}'){
        $link = $matches[1]
        $text = $matches[2]
        if(-not [string]::IsNullOrWhiteSpace($text)){
            return $text
        } elseif(-not [string]::IsNullOrWhiteSpace($link)){
            return $link
        }
    }
    
    # Processar campos @{address=...}
    if($value -match '@\{address=([^;]*);\s*address2=([^;]*);\s*city=([^;]*);\s*state=([^;]*);\s*country=([^;]*);\s*zip=([^;]*);\s*lng=([^;]*);\s*lat=([^}]*)\}'){
        $address = $matches[1]
        $address2 = $matches[2]
        $city = $matches[3]
        $state = $matches[4]
        $country = $matches[5]
        $zip = $matches[6]
        
        $parts = @($address, $address2, $city, $state, $zip) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
        return ($parts -join ', ')
    }
    
    # Remover padrões como "segue&nbsp;link&nbsp;para&nbsp;download&nbsp;das&nbsp;fotos:&nbsp;"
    $value = $value -replace 'segue&nbsp;link&nbsp;para&nbsp;download&nbsp;das&nbsp;fotos:&nbsp;', ''
    $value = $value -replace '&nbsp;', ' '
    
    return $value.Trim()
}

#endregion

#region Execução Principal

Write-Host "=== INICIANDO CORREÇÃO E REORDENAÇÃO ==="

# 1. Ler arquivo de entrada
$inputPath = "D:\Projetos\Excel\csv_output\Solicitacao_resolvido.csv"
if(-not (Test-Path $inputPath)){ throw "Arquivo não encontrado: $inputPath" }

Write-Host "Lendo arquivo: $inputPath"
$csv = Read-CsvUtf8 $inputPath
$originalHeaders = $csv[0]
$rows = $csv[1]

Write-Host "Arquivo carregado: $($rows.Count) registros, $($originalHeaders.Count) colunas"

# 2. Construir mapas de conexão a partir de arquivos CSV locais
Write-Host "Construindo mapas de conexão..."
$mapRede       = Build-MapFromPattern 'Rede.*\.csv$' @('(?i)rede','(?i)name','(?i)titulo')
$mapCliente    = Build-MapFromPattern 'Clientes.*\.csv$' @('(?i)nome','(?i)empresa','(?i)name')
$mapFotografo  = Build-MapFromPattern 'Fotografos.*\.csv$' @('(?i)fotografo','(?i)nome','(?i)name')
$mapBairro     = Build-MapFromPattern 'Regi(ões|oes).*\.csv$' @('(?i)bairro','(?i)name','(?i)titulo')
$mapCodVitrine = Build-MapFromPattern 'Codigo\s*Vitrine.*\.csv$' @('(?i)codigo\s*vitrine','(?i)titulo','(?i)name')
$mapGestor     = Build-MapFromPattern 'Gestores?.*Vitrine.*\.csv$' @('(?i)gestor','(?i)nome','(?i)name')
$mapCorretor   = Build-MapFromPattern 'Corretores.*\.csv$' @('(?i)corretor','(?i)nome','(?i)name')

Write-Host "Mapas construídos: Rede($($mapRede.Count)), Cliente($($mapCliente.Count)), Fotógrafo($($mapFotografo.Count)), Bairro($($mapBairro.Count)), CódVitrine($($mapCodVitrine.Count)), Gestor($($mapGestor.Count)), Corretor($($mapCorretor.Count))"

# 3. Processar cada linha para corrigir campos de conexão
Write-Host "Processando campos de conexão..."
$processedRows = @()

foreach($row in $rows){
    $newRow = [ordered]@{}
    
    # Copiar todos os campos originais
    foreach($header in $originalHeaders){
        $value = [string]$row.$header
        
        # Processar campos especiais
        $value = Process-ConnectionField $value
        
        # Aplicar mapeamentos de conexão para campos específicos
        switch($header){
            'rede' {
                if($value -match '[A-Za-z0-9]{10}'){
                    $parts = $value -split ';\s*'
                    $mapped = $parts | ForEach-Object { if($mapRede.ContainsKey($_)){ $mapRede[$_] } else { $_ } }
                    $value = ($mapped -join '; ')
                }
            }
            'nome_cliente' {
                if($value -match '[A-Za-z0-9]{10}'){
                    $parts = $value -split ';\s*'
                    $mapped = $parts | ForEach-Object { if($mapCliente.ContainsKey($_)){ $mapCliente[$_] } else { $_ } }
                    $value = ($mapped -join '; ')
                }
            }
            'fotografo' {
                if($value -match '[A-Za-z0-9]{10}'){
                    $parts = $value -split ';\s*'
                    $mapped = $parts | ForEach-Object { if($mapFotografo.ContainsKey($_)){ $mapFotografo[$_] } else { $_ } }
                    $value = ($mapped -join '; ')
                }
            }
            'bairro_localidade' {
                if($value -match '[A-Za-z0-9]{10}'){
                    $parts = $value -split ';\s*'
                    $mapped = $parts | ForEach-Object { if($mapBairro.ContainsKey($_)){ $mapBairro[$_] } else { $_ } }
                    $value = ($mapped -join '; ')
                }
            }
            'codigo_vitrine_automatico' {
                if($value -match '[A-Za-z0-9]{10}'){
                    $parts = $value -split ';\s*'
                    $mapped = $parts | ForEach-Object { if($mapCodVitrine.ContainsKey($_)){ $mapCodVitrine[$_] } else { $_ } }
                    $value = ($mapped -join '; ')
                }
            }
            'gestor' {
                if($value -match '[A-Za-z0-9]{10}'){
                    $parts = $value -split ';\s*'
                    $mapped = $parts | ForEach-Object { if($mapGestor.ContainsKey($_)){ $mapGestor[$_] } else { $_ } }
                    $value = ($mapped -join '; ')
                }
            }
            'corretor_responsavel' {
                if($value -match '[A-Za-z0-9]{10}'){
                    $parts = $value -split ';\s*'
                    $mapped = $parts | ForEach-Object { if($mapCorretor.ContainsKey($_)){ $mapCorretor[$_] } else { $_ } }
                    $value = ($mapped -join '; ')
                }
            }
        }
        
        $newRow[$header] = $value
    }
    
    $processedRows += [pscustomobject]$newRow
}

Write-Host "Campos de conexão processados."

# 4. Reordenar colunas conforme ordem especificada
Write-Host "Reordenando colunas..."

# Identificar colunas disponíveis no arquivo
$availableColumns = @()
$missingColumns = @()

foreach($col in $CorrectColumnOrder){
    if($originalHeaders -contains $col){
        $availableColumns += $col
    } else {
        $missingColumns += $col
    }
}

# Adicionar colunas extras que não estão na ordem especificada
$extraColumns = $originalHeaders | Where-Object { $CorrectColumnOrder -notcontains $_ }
$finalColumnOrder = $availableColumns + $extraColumns

Write-Host "Colunas disponíveis: $($availableColumns.Count)"
Write-Host "Colunas ausentes: $($missingColumns.Count)"
Write-Host "Colunas extras: $($extraColumns.Count)"

# 5. Criar linhas reordenadas
$reorderedRows = @()
foreach($row in $processedRows){
    $reorderedRow = [ordered]@{}
    foreach($col in $finalColumnOrder){
        $reorderedRow[$col] = if($row.PSObject.Properties.Name -contains $col){ $row.$col } else { '' }
    }
    $reorderedRows += [pscustomobject]$reorderedRow
}

# 6. Salvar arquivo final
$outputPath = Join-Path $CsvDir $OutputFile
Write-Host "Salvando arquivo: $outputPath"

Write-CsvBom -path $outputPath -headers $finalColumnOrder -rows $reorderedRows

Write-Host "=== CONCLUÍDO ==="
Write-Host "Arquivo salvo: $outputPath"
Write-Host "Total de registros: $($reorderedRows.Count)"
Write-Host "Total de colunas: $($finalColumnOrder.Count)"
Write-Host "Colunas na ordem correta: $($availableColumns.Count)/$($CorrectColumnOrder.Count)"

if($missingColumns.Count -gt 0){
    Write-Host "ATENÇÃO: Colunas ausentes no arquivo original:"
    $missingColumns | ForEach-Object { Write-Host "  - $_" }
}

if($extraColumns.Count -gt 0){
    Write-Host "Colunas extras adicionadas ao final:"
    $extraColumns | ForEach-Object { Write-Host "  - $_" }
}

#endregion