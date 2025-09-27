# Estrutura do Google Sheets para Sincronização

## Visão Geral
O Google Sheets será estruturado em múltiplas abas, espelhando a organização dos arquivos CSV existentes, mantendo a integridade relacional dos dados.

## Estrutura das Abas

### 1. **ABA: "Solicitacoes"** (Principal)
**Fonte**: `Solicitacao.csv` (6.556 linhas)

#### Campos Essenciais para o Sistema Online:

##### **Identificação e Controle**
- `Auto Increment` - ID sequencial
- `Record ID` - ID único do registro
- `ID Solicitacao` - Código da solicitação
- `Status` - Status atual (Agendado, Realizado, Editado, etc.)
- `Created At` - Data/hora de criação

##### **Cliente e Corretor**
- `Nome Cliente` - Nome da imobiliária
- `Rede` - Rede da imobiliária (Apolar, Lopes, etc.)
- `Corretor Responsavel` - Corretor responsável
- `Referencia do Cliente` - Código de referência

##### **Imóvel**
- `Endereco do Imovel` - Endereço completo
- `Bairro/Localidade` - Bairro
- `Complemento` - Complemento do endereço
- `Tipo do Imovel` - Casa, Apartamento, etc.
- `Condicao de Habitacao` - Ocupado, Vazio, etc.
- `m2` - Área do imóvel

##### **Agendamento**
- `Data do agendamento` - Data da sessão
- `Horario da Sessao` - Horário agendado
- `Tipo do Servico` - Fotos, Vídeo, Tour 360
- `Fotografo` - Fotógrafo designado

##### **Execução**
- `Data Realizada` - Data de realização
- `Feedback da Sessao` - Feedback do fotógrafo
- `Quilometragem` - Distância percorrida
- `Hora PARTIU` - Hora de saída
- `Hora CHEGOU` - Hora de chegada
- `Hora FINALIZOU` - Hora de finalização

##### **Entrega e Links**
- `Data Entregue` - Data de entrega
- `Download da sessao FOTOS` - Link das fotos
- `Download da sessao VIDEO` - Link dos vídeos
- `Download da sessao TOUR 360` - Link do tour 360
- `Editado` - Status de edição

##### **Observações**
- `Observacao para o Agendamento` - Obs para agendamento
- `Observacao para o Fotografo` - Obs para fotógrafo
- `Observacao para o CLIENTE` - Obs para cliente

### 2. **ABA: "Fotografos"**
**Fonte**: `Fotografos.csv` (5.033 linhas)

#### Campos Principais:
- `id` - ID único do fotógrafo
- `field_48` - Nome do fotógrafo
- `field_49` - Email
- `field_52` - Telefone/WhatsApp
- `field_143` - Região de atuação
- `field_290` - Status ativo/inativo
- Dados de endereço e localização

### 3. **ABA: "Clientes"**
**Fonte**: `Clientes.csv` (366 linhas)

#### Campos Principais:
- `ID Cliente` - ID único do cliente
- `Nome Empresa` - Nome da imobiliária
- `Email Cliente 01/02` - Emails de contato
- `Endereço Loja (Cliente)` - Endereço da loja
- `Rede` - Rede da imobiliária
- `Corretor` - Corretor principal
- `CNPJ/CPF` - Documento
- Dados de contato (telefones, celulares)

### 4. **ABA: "Redes"**
**Fonte**: `Rede.csv` (157.069 linhas)

#### Campos Principais:
- `id` - ID único da rede
- `field_154` - Nome da rede (Apolar, Lopes, Nexus, etc.)
- `field_155` - Código da rede

### 5. **ABA: "Configuracao"** (Nova)
Configurações do sistema para controle online

#### Campos Propostos:
- `chave` - Nome da configuração
- `valor` - Valor da configuração
- `descricao` - Descrição da configuração
- `ativo` - Se está ativo

**Exemplos de Configurações**:
```
chave: "sync_interval", valor: "300", descricao: "Intervalo de sincronização em segundos"
chave: "max_uploads_per_day", valor: "50", descricao: "Máximo de uploads por dia"
chave: "notification_email", valor: "admin@empresa.com", descricao: "Email para notificações"
```

## Permissões e Acesso

### **Níveis de Acesso**:

#### 1. **Secretaria (Editor Completo)**
- Acesso total a todas as abas
- Pode editar todos os campos
- Gerencia configurações

#### 2. **Fotógrafos (Visualização + Edição Limitada)**
- **Visualização**: Aba "Solicitacoes" (apenas seus agendamentos)
- **Edição Limitada**: 
  - `Status` (para "Realizado")
  - `Data Realizada`
  - `Feedback da Sessao`
  - `Quilometragem`
  - `Hora PARTIU/CHEGOU/FINALIZOU`

#### 3. **Editores (Visualização + Edição de Links)**
- **Visualização**: Solicitações com status "Realizado"
- **Edição**:
  - `Editado` (marcar como editado)
  - `Download da sessao FOTOS/VIDEO/TOUR 360`
  - `Data Entregue`

#### 4. **Gestores (Visualização Completa)**
- Acesso de leitura a todas as abas
- Dashboards e relatórios

## APIs e Integrações

### **Google Sheets API v4**
- **Escopo**: `https://www.googleapis.com/auth/spreadsheets`
- **Operações**:
  - `spreadsheets.values.get` - Leitura de dados
  - `spreadsheets.values.update` - Atualização de células
  - `spreadsheets.values.batchUpdate` - Atualizações em lote

### **Autenticação**
- **OAuth 2.0** para usuários finais
- **Service Account** para sincronização automática

## Estrutura de Filtros para Interfaces Online

### **Para Fotógrafos**:
```javascript
// Filtrar apenas agendamentos do fotógrafo logado
WHERE Fotografo = "Nome_do_Fotografo" 
AND Status IN ("Agendado", "Confirmado")
AND Data_do_agendamento >= TODAY()
```

### **Para Editores**:
```javascript
// Filtrar apenas trabalhos realizados pendentes de edição
WHERE Status = "Realizado" 
AND Editado != "Sim"
ORDER BY Data_Realizada ASC
```

### **Para Conferência**:
```javascript
// Dashboard com métricas gerais
SELECT Status, COUNT(*) as Total
FROM Solicitacoes 
WHERE MONTH(Created_At) = CURRENT_MONTH()
GROUP BY Status
```

## Sincronização com Excel Local

### **Fluxo de Dados**:
1. **Excel → CSV** (processo atual mantido)
2. **CSV → Google Sheets** (novo script PowerShell)
3. **Google Sheets → Interfaces Online** (GitHub Pages)

### **Campos de Controle de Sincronização**:
- `ultima_sincronizacao` - Timestamp da última sync
- `hash_dados` - Hash para detectar mudanças
- `origem` - "excel" ou "online"

## Backup e Versionamento

### **Estratégias**:
1. **Google Sheets nativo**: Histórico de versões automático
2. **Export diário**: Backup automático para Google Drive
3. **Log de alterações**: Registro de todas as mudanças online

## Próximos Passos

1. ✅ Criar planilha no Google Sheets com esta estrutura
2. ✅ Configurar permissões por usuário/grupo
3. ✅ Desenvolver script de sincronização PowerShell
4. ✅ Implementar interfaces GitHub Pages
5. ✅ Testes de integração completa

---

**Observação**: Esta estrutura mantém 100% de compatibilidade com o sistema atual, apenas adicionando a camada online sem impactar o fluxo offline da Secretaria.