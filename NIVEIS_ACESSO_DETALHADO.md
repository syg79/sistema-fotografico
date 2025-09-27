# Níveis de Acesso - Sistema Fotográfico

## Matriz de Permissões por Nível

| Funcionalidade | Secretaria | Fotógrafo | Editor | Gestor |
|---|:---:|:---:|:---:|:---:|
| **Criar Novos Pedidos** | ✅ | ❌ | ❌ | ❌ |
| **Editar Dados Cliente** | ✅ | ❌ | ❌ | ❌ |
| **Agendar Fotografia** | ✅ | ❌ | ❌ | ❌ |
| **Ver Agendamentos** | ✅ | 👀 | ❌ | 👀 |
| **Atualizar Status Realizado** | ✅ | ✅ | ❌ | ❌ |
| **Ver Trabalhos p/ Edição** | ✅ | ❌ | 👀 | 👀 |
| **Entregar Edição** | ✅ | ❌ | ✅ | ❌ |
| **Conferir Trabalhos** | ✅ | ❌ | ❌ | ✅ |
| **Aprovar Faturamento** | ✅ | ❌ | ❌ | ✅ |
| **Relatórios Gerenciais** | ✅ | ❌ | ❌ | ✅ |
| **Configurar Sistema** | ✅ | ❌ | ❌ | ❌ |

**Legenda**: ✅ Acesso Total | 👀 Somente Leitura | ❌ Sem Acesso

---

## 👩‍💼 SECRETARIA - Perfil Administrativo

### Acesso Completo ao Sistema

#### 🖥️ **Sistema Excel Local**
**Localização**: `d:\Projetos\Excel\sistema_fotografico\`
**Acesso**: Direto via navegador local

##### Páginas Disponíveis:
- **Dashboard**: `http://localhost:8080/index.html`
- **Novos Pedidos**: `http://localhost:8080/novos-pedidos.html`
- **Agendamentos**: `http://localhost:8080/agendamentos.html`
- **Conferência**: `http://localhost:8080/conferencia.html`
- **Pendentes**: `http://localhost:8080/pendentes.html`
- **Realizados**: `http://localhost:8080/realizados.html`
- **Registro**: `http://localhost:8080/registro.html`

#### 📊 **Permissões Específicas**

##### ✅ **Gestão de Pedidos**
- Criar novos pedidos manualmente
- Processar pedidos vindos do Wix
- Editar informações de clientes
- Cancelar ou reagendar pedidos
- Definir prioridades e urgências

##### ✅ **Gestão de Equipe**
- Cadastrar novos fotógrafos
- Cadastrar novos editores
- Definir disponibilidade da equipe
- Atribuir trabalhos específicos
- Gerenciar férias e folgas

##### ✅ **Controle de Publicação**
- Decidir quais agendamentos publicar
- Controlar visibilidade no Google Sheets
- Remover dados após faturamento
- Gerenciar backup e versionamento

##### ✅ **Relatórios e Análises**
- Gerar relatórios de produtividade
- Análise financeira completa
- Controle de qualidade
- Métricas de performance da equipe

#### 🔧 **Ferramentas Administrativas**

##### Scripts PowerShell:
- `sync_tadabase_to_solicitacao.ps1` - Sincronização principal
- `export_solicitacao_columns.ps1` - Exportação de dados
- `validate_*.ps1` - Validação de integridade

##### Arquivos de Configuração:
- `config/.env` - Credenciais e configurações
- `config/schema.json` - Estrutura de dados

---

## 📸 FOTÓGRAFO - Perfil Operacional

### Acesso Limitado e Específico

#### ☁️ **Google Sheets (Somente Leitura)**
**Planilha**: "Agendamentos Publicados"

##### 👀 **Informações Visíveis**:
- **Data e Horário** do agendamento
- **Endereço Completo** do imóvel
- **Nome do Cliente** e telefone
- **Tipo de Serviço** (fotos, vídeo, drone, planta)
- **Observações Especiais**
- **Código de Rastreamento**

##### ❌ **Informações Ocultas**:
- Dados financeiros (valores, comissões)
- Informações pessoais sensíveis
- Histórico completo do cliente
- Dados de outros fotógrafos

#### 🌐 **Formulário Wix - Atualização de Status**
**URL**: `https://[site-wix].com/fotografo-status`

##### ✅ **Ações Permitidas**:
1. **Confirmar Chegada** no local
2. **Marcar como Realizado**
3. **Inserir Código Vitrine** (obrigatório)
4. **Adicionar Observações** sobre o trabalho
5. **Reportar Problemas** (cliente ausente, etc.)

##### 📱 **Fluxo de Trabalho**:
```
1. Consultar Google Sheets (agendamentos do dia)
2. Ir ao local do agendamento
3. Executar o trabalho fotográfico
4. Acessar formulário Wix
5. Inserir código vitrine + status "Realizado"
6. Sistema atualiza automaticamente
```

#### 📋 **Responsabilidades**:
- Cumprir horários agendados
- Manter qualidade técnica
- Comunicar problemas imediatamente
- Inserir códigos vitrine corretamente
- Seguir protocolos de atendimento

---

## 🎨 EDITOR - Perfil Criativo

### Acesso Focado em Pós-Produção

#### ☁️ **Google Sheets (Somente Leitura)**
**Planilha**: "Trabalhos para Edição"

##### 👀 **Informações Visíveis**:
- **Código Vitrine** para download
- **Tipo de Edição** necessária
- **Prazo de Entrega**
- **Especificações Técnicas**
- **Observações do Fotógrafo**
- **Referências de Estilo**

##### ❌ **Informações Ocultas**:
- Dados do cliente
- Informações financeiras
- Endereço do imóvel
- Dados de outros editores

#### 🌐 **Formulário Wix - Entrega de Edição**
**URL**: `https://[site-wix].com/editor-entrega`

##### ✅ **Ações Permitidas**:
1. **Download de Arquivos** via código vitrine
2. **Upload de Arquivos Editados**
3. **Marcar como Editado**
4. **Inserir Links de Entrega** (Google Drive, WeTransfer)
5. **Adicionar Observações** sobre a edição

##### 🎯 **Fluxo de Trabalho**:
```
1. Consultar Google Sheets (trabalhos disponíveis)
2. Fazer download via código vitrine
3. Executar edição conforme especificações
4. Fazer upload dos arquivos finais
5. Acessar formulário Wix
6. Inserir links + status "Editado"
7. Sistema notifica cliente automaticamente
```

#### 📋 **Responsabilidades**:
- Manter padrão de qualidade
- Cumprir prazos estabelecidos
- Seguir especificações técnicas
- Comunicar problemas de arquivo
- Organizar arquivos de entrega

---

## 👔 GESTOR - Perfil Supervisão

### Acesso de Supervisão e Controle

#### ☁️ **Google Sheets (Somente Leitura)**
**Planilhas**: "Conferência Gerencial" + "Relatórios"

##### 👀 **Informações Visíveis**:
- **Trabalhos Finalizados** aguardando conferência
- **Métricas de Performance** da equipe
- **Relatórios de Produtividade**
- **Indicadores de Qualidade**
- **Status Financeiro** (faturamento pendente)

#### 💻 **Sistema Excel Local (Limitado)**
**Páginas Específicas**:
- **Conferência**: `http://localhost:8080/conferencia.html`
- **Relatórios**: Dashboards gerenciais
- **Realizados**: `http://localhost:8080/realizados.html`

##### ✅ **Ações Permitidas**:
1. **Conferir Qualidade** dos trabalhos finalizados
2. **Aprovar para Faturamento**
3. **Reprovar e Solicitar Correções**
4. **Gerar Relatórios Gerenciais**
5. **Analisar Performance da Equipe**
6. **Controlar Fluxo de Caixa**

##### 📊 **Dashboards Disponíveis**:
- Performance por fotógrafo
- Tempo médio de edição
- Taxa de retrabalho
- Satisfação do cliente
- Análise financeira mensal

#### 🔍 **Fluxo de Conferência**:
```
1. Acessar trabalhos finalizados
2. Revisar qualidade técnica
3. Verificar conformidade com briefing
4. Aprovar ou reprovar
5. Se aprovado: liberar para faturamento
6. Se reprovado: retornar com observações
```

#### 📋 **Responsabilidades**:
- Garantir qualidade final
- Controlar custos e prazos
- Analisar performance da equipe
- Tomar decisões estratégicas
- Aprovar investimentos e mudanças

---

## 🔐 Controle de Acesso Técnico

### Autenticação por Nível

#### 🌐 **Sistema Wix**
```javascript
// Níveis de autenticação
const nivelAcesso = {
  publico: 0,        // Formulários públicos
  fotografo: 1,      // Atualização de status
  editor: 2,         // Entrega de edição
  gestor: 3,         // Conferência e relatórios
  secretaria: 4      // Acesso total (apenas local)
}
```

#### ☁️ **Google Sheets**
```
Compartilhamento por email:
- fotografo1@empresa.com (Leitura - Agendamentos)
- fotografo2@empresa.com (Leitura - Agendamentos)
- editor1@empresa.com (Leitura - Trabalhos)
- editor2@empresa.com (Leitura - Trabalhos)
- gestor@empresa.com (Leitura - Conferência)
```

#### 💻 **Sistema Local**
```
Acesso físico restrito:
- Máquina da secretaria (IP específico)
- VPN para gestores (quando necessário)
- Backup em servidor local seguro
```

### Logs e Auditoria

#### 📝 **Registro de Atividades**
- Todas as ações são logadas com timestamp
- Identificação do usuário e nível de acesso
- Backup automático antes de alterações
- Histórico de 90 dias mantido

#### 🔍 **Monitoramento**
- Tentativas de acesso não autorizado
- Alterações em dados críticos
- Performance do sistema
- Uso por nível de acesso

---

## 📱 Interfaces por Dispositivo

### 💻 **Desktop (Secretaria/Gestor)**
- Sistema Excel completo
- Múltiplas abas e janelas
- Relatórios complexos
- Ferramentas administrativas

### 📱 **Mobile (Fotógrafo/Editor)**
- Google Sheets responsivo
- Formulários Wix otimizados
- Upload de arquivos simplificado
- Notificações push

### 🖥️ **Tablet (Todos os Níveis)**
- Interface adaptativa
- Visualização otimizada
- Funcionalidades essenciais
- Sincronização automática

---

## 🚀 Implementação Gradual

### **Fase 1 - Básico** (30 dias)
- Configurar autenticação Wix
- Implementar Google Sheets
- Testar fluxos básicos
- Treinar equipe

### **Fase 2 - Avançado** (60 dias)
- Relatórios automáticos
- Notificações inteligentes
- App mobile nativo
- Integração completa

### **Fase 3 - Otimização** (90 dias)
- IA para otimização
- Análises preditivas
- Automação avançada
- Expansão de funcionalidades