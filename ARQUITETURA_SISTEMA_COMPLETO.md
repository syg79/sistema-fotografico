# Arquitetura do Sistema Fotográfico Completo

## Visão Geral da Arquitetura

O sistema fotográfico utiliza uma arquitetura híbrida que combina:

- **🌐 Wix (Online)**: Interface web pública para formulários e consultas
- **📊 Excel (Offline)**: Base de dados principal e sistema de gestão local
- **☁️ Google Sheets (Publicação)**: Camada de sincronização para dados específicos

## Estrutura da Arquitetura

### 1. Camada Offline (Excel Local)
**Localização**: `d:\Projetos\Excel\`

- **Base de Dados Principal**: Arquivos CSV locais
- **Sistema de Gestão**: Interface HTML/JavaScript local
- **Controle Total**: Secretaria e Gestores

### 2. Camada Online (Wix)
**Função**: Interface pública web

- **Formulários Públicos**: Novos pedidos e agendamentos
- **Consultas**: Status de solicitações
- **Acesso Limitado**: Apenas visualização e entrada de dados

### 3. Camada de Sincronização (Google Sheets)
**Função**: Ponte entre offline e online

- **Dados Publicados**: Apenas solicitações aprovadas
- **Acesso Controlado**: Fotógrafos, Editores e Conferência
- **Sincronização Bidirecional**: Excel ↔ Google Sheets ↔ Wix

## Níveis de Acesso e Permissões

### 👩‍💼 Secretaria (Nível Máximo)
**Acesso**: Sistema Excel Local Completo

#### Permissões:
- ✅ **Criar** novos pedidos e clientes
- ✅ **Editar** todas as informações
- ✅ **Excluir** registros (com backup)
- ✅ **Gerenciar** fotógrafos e editores
- ✅ **Controlar** publicação para Google Sheets
- ✅ **Acessar** relatórios completos
- ✅ **Configurar** sistema e integrações

#### Ferramentas Disponíveis:
- Sistema Excel local completo
- Scripts PowerShell de sincronização
- Interface de gestão HTML local
- Controle de backup e versionamento

### 📸 Fotógrafo (Acesso Limitado)
**Acesso**: Google Sheets (Somente Leitura) + Wix (Atualização Status)

#### Permissões:
- 👀 **Visualizar** agendamentos publicados
- 👀 **Consultar** dados do cliente e localização
- ✅ **Atualizar** status para "Realizado"
- ✅ **Inserir** código vitrine
- ❌ **Não pode** editar dados do cliente
- ❌ **Não pode** cancelar agendamentos

#### Ferramentas Disponíveis:
- Google Sheets (visualização de agendamentos)
- Formulário Wix para atualização de status
- App mobile (futuro) para campo

### 🎨 Editor de Imagem (Acesso Específico)
**Acesso**: Google Sheets (Leitura) + Wix (Atualização)

#### Permissões:
- 👀 **Visualizar** trabalhos "Realizados"
- 👀 **Acessar** códigos vitrine
- ✅ **Atualizar** status para "Editado"
- ✅ **Inserir** links de entrega
- ❌ **Não pode** alterar dados originais
- ❌ **Não pode** acessar dados financeiros

#### Ferramentas Disponíveis:
- Google Sheets (trabalhos para edição)
- Formulário Wix para entrega
- Sistema de upload de arquivos

### 👔 Gestor (Acesso Supervisão)
**Acesso**: Google Sheets (Leitura) + Relatórios Excel

#### Permissões:
- 👀 **Visualizar** todos os trabalhos publicados
- 👀 **Acessar** relatórios de performance
- 👀 **Conferir** trabalhos finalizados
- ✅ **Aprovar** faturamento
- ✅ **Gerar** relatórios gerenciais
- ❌ **Não pode** editar dados operacionais

#### Ferramentas Disponíveis:
- Google Sheets (conferência)
- Dashboard de relatórios
- Sistema de aprovação de faturamento

## Fluxo de Dados do Sistema

### 📥 Entrada de Dados (Novos Pedidos)

```
Cliente/Corretor → Wix (Formulário) → Excel Local (Secretaria)
                                   ↓
                            Validação e Processamento
                                   ↓
                            Agendamento Criado
```

### 📤 Publicação para Equipe

```
Excel Local → Scripts PowerShell → Google Sheets → Notificação Equipe
     ↓                                    ↓
Backup Local                    Acesso Fotógrafos/Editores
```

### 🔄 Atualização de Status

```
Fotógrafo/Editor → Wix (Formulário) → Google Sheets → Sync Excel Local
                                                           ↓
                                                    Atualização Automática
```

### 💰 Processo de Faturamento

```
Trabalhos Finalizados → Conferência (Gestor) → Aprovação Faturamento
                                                        ↓
                                              Remoção Google Sheets
                                                        ↓
                                              Arquivo Offline (Excel)
```

## Acesso aos Formulários por Nível

### 🌐 Formulários Wix (Públicos)

#### 1. **Novo Pedido Fotográfico**
- **Acesso**: Público (Clientes/Corretores)
- **Destino**: Excel Local (via integração)
- **Campos**: Cliente, Endereço, Tipo de Serviço, Data Preferencial

#### 2. **Atualização de Status - Fotógrafo**
- **Acesso**: Fotógrafos autenticados
- **Função**: Marcar como "Realizado" + Código Vitrine
- **Integração**: Google Sheets → Excel Local

#### 3. **Entrega de Edição**
- **Acesso**: Editores autenticados
- **Função**: Upload de arquivos + Status "Editado"
- **Integração**: Google Sheets → Excel Local

#### 4. **Consulta de Status**
- **Acesso**: Público (com código de rastreamento)
- **Função**: Verificar andamento do pedido
- **Fonte**: Google Sheets (dados publicados)

### 💻 Sistema Excel Local

#### 1. **Dashboard Principal**
- **Acesso**: Secretaria, Gestores
- **URL**: `http://localhost:8080/index.html`
- **Função**: Visão geral e estatísticas

#### 2. **Novos Pedidos**
- **Acesso**: Secretaria
- **URL**: `http://localhost:8080/novos-pedidos.html`
- **Função**: Cadastro manual e processamento de pedidos Wix

#### 3. **Agendamentos**
- **Acesso**: Secretaria
- **URL**: `http://localhost:8080/agendamentos.html`
- **Função**: Gestão completa de agendamentos

#### 4. **Conferência**
- **Acesso**: Gestores, Secretaria
- **URL**: `http://localhost:8080/conferencia.html`
- **Função**: Validação antes do faturamento

#### 5. **Relatórios**
- **Acesso**: Gestores, Secretaria
- **Função**: Análises e relatórios gerenciais

### ☁️ Google Sheets (Sincronização)

#### 1. **Agendamentos Publicados**
- **Acesso**: Fotógrafos (leitura)
- **Conteúdo**: Dados necessários para execução
- **Atualização**: Automática via scripts PowerShell

#### 2. **Trabalhos para Edição**
- **Acesso**: Editores (leitura)
- **Conteúdo**: Trabalhos "Realizados" aguardando edição
- **Atualização**: Tempo real

#### 3. **Conferência Gerencial**
- **Acesso**: Gestores (leitura)
- **Conteúdo**: Trabalhos finalizados para aprovação
- **Função**: Controle de qualidade e faturamento

## Segurança e Controle de Acesso

### 🔐 Autenticação

#### Wix (Online)
- **Login Social**: Google, Facebook
- **Verificação**: Email + Telefone
- **Níveis**: Público, Fotógrafo, Editor, Gestor

#### Excel Local
- **Acesso Físico**: Máquina da secretaria
- **Backup**: Automático com versionamento
- **Logs**: Todas as operações registradas

#### Google Sheets
- **Compartilhamento**: Por email específico
- **Permissões**: Somente leitura (exceto formulários Wix)
- **Auditoria**: Histórico de alterações

### 🛡️ Proteção de Dados

#### Dados Sensíveis (Offline)
- Informações financeiras
- Dados pessoais completos
- Histórico completo de alterações
- Configurações do sistema

#### Dados Publicados (Online)
- Apenas informações necessárias para execução
- Dados anonimizados quando possível
- Remoção automática após faturamento

## Configuração e Manutenção

### ⚙️ Configuração Inicial

#### 1. **Sistema Excel Local**
```bash
cd d:\Projetos\Excel\sistema_fotografico
python -m http.server 8080
```

#### 2. **Scripts de Sincronização**
- Configurar credenciais Google Sheets API
- Configurar webhooks Wix
- Testar sincronização bidirecional

#### 3. **Formulários Wix**
- Criar formulários com campos padronizados
- Configurar integrações com Google Sheets
- Implementar autenticação por nível

### 🔄 Rotinas de Manutenção

#### Diária
- Backup automático Excel Local
- Sincronização Google Sheets
- Verificação de integridade dos dados

#### Semanal
- Limpeza de dados faturados no Google Sheets
- Relatórios de performance
- Verificação de logs de erro

#### Mensal
- Backup completo do sistema
- Análise de uso por nível de acesso
- Otimização de performance

## Vantagens da Arquitetura

### ✅ **Controle Total**
- Dados principais sempre offline e seguros
- Secretaria mantém controle absoluto
- Backup e versionamento completos

### ✅ **Acesso Distribuído**
- Equipe acessa apenas dados necessários
- Interface web moderna e responsiva
- Trabalho remoto facilitado

### ✅ **Sincronização Inteligente**
- Dados publicados apenas quando necessário
- Remoção automática após faturamento
- Sincronização bidirecional confiável

### ✅ **Escalabilidade**
- Fácil adição de novos usuários
- Expansão de funcionalidades
- Integração com novos sistemas

### ✅ **Segurança**
- Dados sensíveis sempre offline
- Controle granular de permissões
- Auditoria completa de operações

## Próximos Passos

### 🚀 **Implementação Fase 1**
1. Configurar formulários Wix
2. Implementar integração Google Sheets
3. Criar sistema de autenticação
4. Testar fluxo completo

### 🚀 **Implementação Fase 2**
1. App mobile para fotógrafos
2. Sistema de notificações automáticas
3. Relatórios avançados
4. Integração com sistemas de pagamento

### 🚀 **Implementação Fase 3**
1. IA para otimização de rotas
2. Sistema de avaliação de qualidade
3. Integração com CRM
4. Dashboard executivo avançado