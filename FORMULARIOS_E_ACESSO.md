# Formulários e Acesso - Sistema Fotográfico

## Mapa Completo de Formulários

### 🌐 **FORMULÁRIOS WIX (Online)**

#### 📝 **1. Formulário Novo Pedido Fotográfico**
**URL**: `https://[site-wix].com/novo-pedido`
**Acesso**: Público (Clientes e Corretores)

##### Campos do Formulário:
```html
<!-- Dados do Cliente -->
<input name="nome_cliente" type="text" required>
<input name="telefone" type="tel" required>
<input name="email" type="email" required>
<input name="cpf_cnpj" type="text">

<!-- Dados do Corretor (se aplicável) -->
<input name="nome_corretor" type="text">
<input name="telefone_corretor" type="tel">
<input name="rede_imobiliaria" type="select">

<!-- Endereço do Imóvel -->
<input name="endereco_completo" type="text" required>
<input name="bairro" type="text" required>
<input name="cidade" type="text" required>
<input name="cep" type="text">

<!-- Tipo de Serviço -->
<checkbox name="servico_fotos" value="true">
<checkbox name="servico_video" value="true">
<checkbox name="servico_drone" value="true">
<checkbox name="servico_planta" value="true">

<!-- Preferências -->
<input name="data_preferencial" type="date">
<input name="horario_preferencial" type="time">
<textarea name="observacoes" rows="4"></textarea>
```

##### Validações JavaScript:
```javascript
function validarFormulario() {
    // Validar telefone brasileiro
    if (!telefone.match(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)) {
        return false;
    }
    
    // Validar pelo menos um serviço selecionado
    if (!servicoFotos && !servicoVideo && !servicoDrone && !servicoPlanta) {
        return false;
    }
    
    // Validar data não retroativa
    if (dataPreferencial < new Date()) {
        return false;
    }
    
    return true;
}
```

##### Integração com Google Sheets:
```javascript
// Webhook automático após submissão
wixData.save("NovosPedidos", dadosFormulario)
    .then(() => {
        // Enviar para Google Sheets via API
        enviarParaGoogleSheets(dadosFormulario);
        
        // Gerar código de rastreamento
        const codigoTracking = gerarCodigoTracking();
        
        // Enviar email de confirmação
        enviarEmailConfirmacao(dadosFormulario.email, codigoTracking);
    });
```

#### 📸 **2. Formulário Status Fotógrafo**
**URL**: `https://[site-wix].com/fotografo-status`
**Acesso**: Fotógrafos Autenticados

##### Campos do Formulário:
```html
<!-- Identificação -->
<input name="codigo_tracking" type="text" required>
<input name="nome_fotografo" type="text" readonly>

<!-- Status do Trabalho -->
<select name="status_trabalho" required>
    <option value="confirmado">Confirmado - A caminho</option>
    <option value="no_local">No local - Iniciando</option>
    <option value="realizado">Realizado - Concluído</option>
    <option value="problema">Problema - Ver observações</option>
</select>

<!-- Código Vitrine (obrigatório se realizado) -->
<input name="codigo_vitrine" type="text" 
       placeholder="Ex: VIT001, VIT002...">

<!-- Observações -->
<textarea name="observacoes" rows="3"
          placeholder="Problemas, destaques ou informações importantes"></textarea>

<!-- Timestamp automático -->
<input name="timestamp" type="hidden" value="auto">
```

##### Validações Específicas:
```javascript
function validarStatusFotografo() {
    const status = document.getElementById('status_trabalho').value;
    const codigoVitrine = document.getElementById('codigo_vitrine').value;
    
    // Código vitrine obrigatório se status = realizado
    if (status === 'realizado' && !codigoVitrine) {
        alert('Código vitrine é obrigatório para trabalhos realizados');
        return false;
    }
    
    // Validar formato do código vitrine
    if (codigoVitrine && !codigoVitrine.match(/^VIT\d{3,}$/)) {
        alert('Formato do código vitrine: VIT001, VIT002, etc.');
        return false;
    }
    
    return true;
}
```

#### 🎨 **3. Formulário Entrega Editor**
**URL**: `https://[site-wix].com/editor-entrega`
**Acesso**: Editores Autenticados

##### Campos do Formulário:
```html
<!-- Identificação do Trabalho -->
<input name="codigo_vitrine" type="text" required>
<input name="nome_editor" type="text" readonly>

<!-- Upload de Arquivos -->
<input name="arquivos_editados" type="file" multiple 
       accept=".jpg,.jpeg,.png,.mp4,.mov">

<!-- Links de Entrega Alternativos -->
<input name="link_google_drive" type="url" 
       placeholder="https://drive.google.com/...">
<input name="link_wetransfer" type="url" 
       placeholder="https://wetransfer.com/...">
<input name="link_dropbox" type="url" 
       placeholder="https://dropbox.com/...">

<!-- Especificações da Edição -->
<textarea name="especificacoes_edicao" rows="4"
          placeholder="Descreva as edições realizadas: HDR, correção de cor, etc."></textarea>

<!-- Observações -->
<textarea name="observacoes_editor" rows="3"
          placeholder="Problemas encontrados, sugestões, etc."></textarea>
```

##### Upload e Validação:
```javascript
function processarEntregaEditor() {
    const arquivos = document.getElementById('arquivos_editados').files;
    const links = [
        document.getElementById('link_google_drive').value,
        document.getElementById('link_wetransfer').value,
        document.getElementById('link_dropbox').value
    ].filter(link => link !== '');
    
    // Deve ter arquivos OU links
    if (arquivos.length === 0 && links.length === 0) {
        alert('É necessário fazer upload de arquivos OU fornecer links de entrega');
        return false;
    }
    
    // Validar tamanho dos arquivos (max 100MB por arquivo)
    for (let arquivo of arquivos) {
        if (arquivo.size > 100 * 1024 * 1024) {
            alert(`Arquivo ${arquivo.name} muito grande. Máximo 100MB por arquivo.`);
            return false;
        }
    }
    
    return true;
}
```

#### 🔍 **4. Formulário Consulta Status**
**URL**: `https://[site-wix].com/consultar-status`
**Acesso**: Público

##### Campos do Formulário:
```html
<!-- Consulta por Código -->
<input name="codigo_tracking" type="text" required
       placeholder="Ex: TRK001, TRK002...">

<!-- OU Consulta por Dados -->
<input name="telefone_cliente" type="tel"
       placeholder="Telefone cadastrado">
<input name="cpf_cliente" type="text"
       placeholder="CPF cadastrado">

<button onclick="consultarStatus()">Consultar Status</button>

<!-- Resultado da Consulta -->
<div id="resultado_consulta" style="display:none;">
    <h3>Status do Pedido</h3>
    <p><strong>Cliente:</strong> <span id="nome_cliente"></span></p>
    <p><strong>Endereço:</strong> <span id="endereco"></span></p>
    <p><strong>Status Atual:</strong> <span id="status_atual"></span></p>
    <p><strong>Data Agendada:</strong> <span id="data_agendada"></span></p>
    <p><strong>Fotógrafo:</strong> <span id="nome_fotografo"></span></p>
    <p><strong>Última Atualização:</strong> <span id="ultima_atualizacao"></span></p>
</div>
```

---

### 💻 **SISTEMA EXCEL LOCAL**

#### 🏠 **1. Dashboard Principal**
**URL**: `http://localhost:8080/index.html`
**Acesso**: Secretaria, Gestores

##### Widgets Disponíveis:
```html
<!-- Estatísticas Gerais -->
<div class="widget-stats">
    <div class="stat-card">
        <h3>Pedidos Hoje</h3>
        <span class="stat-number" id="pedidos-hoje">0</span>
    </div>
    <div class="stat-card">
        <h3>Agendamentos Semana</h3>
        <span class="stat-number" id="agendamentos-semana">0</span>
    </div>
    <div class="stat-card">
        <h3>Trabalhos Pendentes</h3>
        <span class="stat-number" id="trabalhos-pendentes">0</span>
    </div>
    <div class="stat-card">
        <h3>Faturamento Mês</h3>
        <span class="stat-number" id="faturamento-mes">R$ 0</span>
    </div>
</div>

<!-- Gráficos -->
<div class="widget-charts">
    <canvas id="grafico-mensal"></canvas>
    <canvas id="grafico-fotografos"></canvas>
</div>

<!-- Lista de Pendências -->
<div class="widget-pendencias">
    <h3>Ações Necessárias</h3>
    <ul id="lista-pendencias">
        <!-- Preenchido via JavaScript -->
    </ul>
</div>
```

#### 📝 **2. Novos Pedidos**
**URL**: `http://localhost:8080/novos-pedidos.html`
**Acesso**: Secretaria

##### Formulário Completo:
```html
<form id="form-novo-pedido">
    <!-- Dados do Cliente -->
    <fieldset>
        <legend>Dados do Cliente</legend>
        <input name="nome_cliente" type="text" required>
        <input name="telefone" type="tel" required>
        <input name="email" type="email">
        <input name="cpf_cnpj" type="text">
        <select name="tipo_cliente">
            <option value="particular">Particular</option>
            <option value="imobiliaria">Imobiliária</option>
            <option value="corretor">Corretor</option>
        </select>
    </fieldset>

    <!-- Dados do Corretor -->
    <fieldset id="dados-corretor" style="display:none;">
        <legend>Dados do Corretor</legend>
        <select name="corretor_id" id="select-corretor">
            <!-- Preenchido via JavaScript -->
        </select>
        <input name="novo_corretor" type="text" placeholder="Ou cadastrar novo">
        <select name="rede_id">
            <!-- Preenchido via JavaScript -->
        </select>
    </fieldset>

    <!-- Endereço do Imóvel -->
    <fieldset>
        <legend>Endereço do Imóvel</legend>
        <input name="endereco" type="text" required>
        <input name="numero" type="text">
        <input name="complemento" type="text">
        <input name="bairro" type="text" required>
        <select name="regiao_id">
            <!-- Preenchido via JavaScript -->
        </select>
        <input name="cep" type="text">
    </fieldset>

    <!-- Serviços Solicitados -->
    <fieldset>
        <legend>Serviços Solicitados</legend>
        <div class="servicos-grid">
            <label><input type="checkbox" name="servico_fotos"> Fotos</label>
            <label><input type="checkbox" name="servico_video"> Vídeo</label>
            <label><input type="checkbox" name="servico_drone"> Drone</label>
            <label><input type="checkbox" name="servico_planta"> Planta</label>
        </div>
        
        <!-- Quantidades -->
        <div class="quantidades">
            <input name="qtd_fotos" type="number" placeholder="Qtd fotos">
            <input name="qtd_videos" type="number" placeholder="Qtd vídeos">
            <select name="tipo_drone">
                <option value="">Selecione tipo drone</option>
                <option value="externo">Externo</option>
                <option value="interno">Interno</option>
                <option value="ambos">Ambos</option>
            </select>
        </div>
    </fieldset>

    <!-- Agendamento -->
    <fieldset>
        <legend>Agendamento</legend>
        <input name="data_agendamento" type="date" required>
        <input name="horario_agendamento" type="time" required>
        <select name="fotografo_id">
            <option value="">Selecionar fotógrafo</option>
            <!-- Preenchido via JavaScript -->
        </select>
        <select name="prioridade">
            <option value="normal">Normal</option>
            <option value="urgente">Urgente</option>
            <option value="expressa">Expressa</option>
        </select>
    </fieldset>

    <!-- Observações -->
    <fieldset>
        <legend>Observações</legend>
        <textarea name="obs_fotografo" placeholder="Observações para o fotógrafo"></textarea>
        <textarea name="obs_editor" placeholder="Observações para o editor"></textarea>
        <textarea name="obs_internas" placeholder="Observações internas"></textarea>
    </fieldset>

    <button type="submit">Salvar Pedido</button>
</form>
```

#### 📅 **3. Agendamentos**
**URL**: `http://localhost:8080/agendamentos.html`
**Acesso**: Secretaria

##### Interface de Gestão:
```html
<!-- Filtros -->
<div class="filtros-agendamento">
    <input type="date" id="filtro-data-inicio">
    <input type="date" id="filtro-data-fim">
    <select id="filtro-fotografo">
        <option value="">Todos os fotógrafos</option>
    </select>
    <select id="filtro-status">
        <option value="">Todos os status</option>
        <option value="agendado">Agendado</option>
        <option value="confirmado">Confirmado</option>
        <option value="realizado">Realizado</option>
        <option value="cancelado">Cancelado</option>
    </select>
    <button onclick="aplicarFiltros()">Filtrar</button>
</div>

<!-- Calendário -->
<div id="calendario-agendamentos">
    <!-- Implementado com FullCalendar.js -->
</div>

<!-- Lista Detalhada -->
<div class="lista-agendamentos">
    <table id="tabela-agendamentos">
        <thead>
            <tr>
                <th>Data/Hora</th>
                <th>Cliente</th>
                <th>Endereço</th>
                <th>Fotógrafo</th>
                <th>Serviços</th>
                <th>Status</th>
                <th>Ações</th>
            </tr>
        </thead>
        <tbody>
            <!-- Preenchido via JavaScript -->
        </tbody>
    </table>
</div>

<!-- Modal de Edição -->
<div id="modal-editar-agendamento" class="modal">
    <form id="form-editar-agendamento">
        <!-- Campos editáveis -->
    </form>
</div>
```

#### 🔍 **4. Conferência**
**URL**: `http://localhost:8080/conferencia.html`
**Acesso**: Gestores, Secretaria

##### Interface de Conferência:
```html
<!-- Filtros de Conferência -->
<div class="filtros-conferencia">
    <select id="filtro-periodo">
        <option value="hoje">Hoje</option>
        <option value="semana">Esta Semana</option>
        <option value="mes">Este Mês</option>
        <option value="personalizado">Período Personalizado</option>
    </select>
    <select id="filtro-fotografo-conf">
        <option value="">Todos os fotógrafos</option>
    </select>
    <select id="filtro-editor-conf">
        <option value="">Todos os editores</option>
    </select>
</div>

<!-- Lista de Trabalhos para Conferência -->
<div class="trabalhos-conferencia">
    <div class="trabalho-item" data-id="TRK001">
        <div class="trabalho-header">
            <h4>João Silva - Apartamento Batel</h4>
            <span class="status-badge finalizado">Finalizado</span>
        </div>
        <div class="trabalho-details">
            <p><strong>Fotógrafo:</strong> Carlos Santos</p>
            <p><strong>Editor:</strong> Ana Costa</p>
            <p><strong>Data Realização:</strong> 17/01/2025</p>
            <p><strong>Data Edição:</strong> 18/01/2025</p>
            <p><strong>Código Vitrine:</strong> VIT001</p>
        </div>
        <div class="trabalho-actions">
            <button onclick="visualizarTrabalho('TRK001')">Visualizar</button>
            <button onclick="aprovarTrabalho('TRK001')" class="btn-aprovar">Aprovar</button>
            <button onclick="reprovarTrabalho('TRK001')" class="btn-reprovar">Reprovar</button>
        </div>
    </div>
</div>

<!-- Modal de Visualização -->
<div id="modal-visualizar-trabalho" class="modal">
    <div class="galeria-trabalho">
        <!-- Galeria de imagens/vídeos -->
    </div>
    <div class="detalhes-trabalho">
        <!-- Detalhes completos -->
    </div>
</div>
```

---

### ☁️ **GOOGLE SHEETS (Sincronização)**

#### 📋 **1. Planilha: Agendamentos_Publicados**
**Acesso**: Fotógrafos (Somente Leitura)

##### Estrutura da Planilha:
```
| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Data | Horário | Cliente | Telefone | Endereço | Serviços | Observações | Código |
| 17/01/25 | 14:00 | João Silva | 41999999999 | Rua A, 123 | Fotos+Drone | Apt novo | TRK001 |
```

##### Formatação Condicional:
```javascript
// Cores por status
function formatarPorStatus() {
    const range = SpreadsheetApp.getActiveSheet().getDataRange();
    const values = range.getValues();
    
    for (let i = 1; i < values.length; i++) {
        const status = values[i][8]; // Coluna I = Status
        let cor = '#FFFFFF';
        
        switch(status) {
            case 'Agendado': cor = '#E3F2FD'; break;
            case 'Confirmado': cor = '#FFF3E0'; break;
            case 'Realizado': cor = '#E8F5E8'; break;
            case 'Cancelado': cor = '#FFEBEE'; break;
        }
        
        range.getCell(i + 1, 1).setBackground(cor);
    }
}
```

#### 🎨 **2. Planilha: Trabalhos_Edicao**
**Acesso**: Editores (Somente Leitura)

##### Estrutura da Planilha:
```
| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| Código Vitrine | Tipo Edição | Prazo | Especificações | Obs Fotógrafo | Status | Editor |
| VIT001 | Fotos Residencial | 19/01/25 | HDR+Correção | Boa luz | Pendente | - |
```

#### 👔 **3. Planilha: Conferencia_Gerencial**
**Acesso**: Gestores (Somente Leitura)

##### Estrutura da Planilha:
```
| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Código | Cliente | Fotógrafo | Editor | Data Real. | Data Edição | Status | Valor |
| TRK001 | João Silva | Carlos | Ana | 17/01/25 | 18/01/25 | Finalizado | R$ 300 |
```

---

## 🔐 Controle de Acesso Detalhado

### 🎯 **Matriz de Acesso por Formulário**

| Formulário | Secretaria | Fotógrafo | Editor | Gestor | Público |
|---|:---:|:---:|:---:|:---:|:---:|
| **Novo Pedido (Wix)** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Status Fotógrafo (Wix)** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Entrega Editor (Wix)** | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Consulta Status (Wix)** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Dashboard (Local)** | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Novos Pedidos (Local)** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Agendamentos (Local)** | ✅ | ❌ | ❌ | 👀 | ❌ |
| **Conferência (Local)** | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Agendamentos (Sheets)** | ✅ | 👀 | ❌ | 👀 | ❌ |
| **Trabalhos Edição (Sheets)** | ✅ | ❌ | 👀 | 👀 | ❌ |
| **Conferência (Sheets)** | ✅ | ❌ | ❌ | 👀 | ❌ |

### 🔑 **Implementação de Autenticação**

#### Wix (Sistema de Membros):
```javascript
// Verificação de nível de acesso
import { authentication } from 'wix-members';

export function verificarAcesso(nivelNecessario) {
    return authentication.currentMember.getRoles()
        .then(roles => {
            const nivelUsuario = roles.includes('gestor') ? 4 :
                               roles.includes('secretaria') ? 3 :
                               roles.includes('editor') ? 2 :
                               roles.includes('fotografo') ? 1 : 0;
            
            return nivelUsuario >= nivelNecessario;
        });
}

// Uso nos formulários
$w.onReady(() => {
    verificarAcesso(1) // Nível fotógrafo
        .then(temAcesso => {
            if (!temAcesso) {
                $w('#formulario').hide();
                $w('#mensagem-acesso-negado').show();
            }
        });
});
```

#### Google Sheets (Compartilhamento):
```javascript
// Script para controlar acesso
function verificarPermissaoUsuario() {
    const email = Session.getActiveUser().getEmail();
    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    
    // Definir permissões por email
    const permissoes = {
        'fotografo1@empresa.com': 'agendamentos',
        'fotografo2@empresa.com': 'agendamentos',
        'editor1@empresa.com': 'trabalhos',
        'editor2@empresa.com': 'trabalhos',
        'gestor@empresa.com': 'conferencia',
        'secretaria@empresa.com': 'admin'
    };
    
    const nivelUsuario = permissoes[email] || 'negado';
    
    // Ocultar abas não autorizadas
    const abas = planilha.getSheets();
    abas.forEach(aba => {
        const nomeAba = aba.getName();
        if (!podeAcessarAba(nivelUsuario, nomeAba)) {
            aba.hideSheet();
        }
    });
}
```

---

## 📱 Responsividade e Dispositivos

### 🖥️ **Desktop (Secretaria/Gestor)**
- Interface completa com múltiplas abas
- Formulários extensos com validação avançada
- Relatórios e gráficos interativos
- Atalhos de teclado para agilidade

### 📱 **Mobile (Fotógrafo/Editor)**
- Interface simplificada e touch-friendly
- Formulários otimizados para tela pequena
- Upload de fotos direto da câmera
- Geolocalização automática

### 🖥️ **Tablet (Todos os Níveis)**
- Interface adaptativa híbrida
- Visualização otimizada de dados
- Formulários de tamanho médio
- Suporte a gestos touch

---

## 🚀 Implementação e Deploy

### **Fase 1: Configuração Wix**
1. Criar site Wix com sistema de membros
2. Configurar formulários com validação
3. Implementar webhooks para Google Sheets
4. Testar fluxo completo de dados

### **Fase 2: Integração Google Sheets**
1. Criar planilhas com estrutura definida
2. Configurar compartilhamento por nível
3. Implementar scripts de automação
4. Sincronizar com sistema Excel local

### **Fase 3: Otimização e Testes**
1. Testar todos os fluxos de dados
2. Validar permissões de acesso
3. Otimizar performance e responsividade
4. Treinar equipe e documentar processos

O sistema está arquitetado para crescer gradualmente, mantendo sempre a segurança e integridade dos dados como prioridade máxima.