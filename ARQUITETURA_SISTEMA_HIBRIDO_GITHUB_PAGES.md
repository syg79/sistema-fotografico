# Arquitetura do Sistema Híbrido - GitHub Pages + Google Sheets

## Visão Geral

Sistema fotográfico híbrido que combina operações offline para a Secretaria com interface online para fotógrafos e editores, utilizando GitHub Pages e Google Sheets como ponte de dados.

## Objetivos Principais

1. **Desativar Tadabase rapidamente** (1-2 semanas)
2. **Manter operações offline** da Secretaria intactas
3. **Criar interface online** simples para equipe externa
4. **Preparar migração futura** para Supabase/Appsmith

## Arquitetura Geral

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   SECRETARIA    │    │  GOOGLE SHEETS   │    │  EQUIPE EXTERNA │
│   (OFFLINE)     │◄──►│   (BRIDGE)       │◄──►│   (ONLINE)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
│                      │                      │
│ • Excel Local        │ • API Robusta        │ • GitHub Pages
│ • Sistema HTML/JS    │ • Sync Tempo Real    │ • HTML/CSS/JS
│ • Scripts PowerShell │ • Controle Acesso    │ • Google Sheets API
│ • Backup Local       │ • Backup Automático  │ • Interface Responsiva
```

## Componentes do Sistema

### 1. SECRETARIA (OFFLINE)
**Localização**: Local (Excel + Sistema HTML atual)
**Responsabilidades**:
- Cadastro de pedidos fotográficos
- Agendamento de sessões
- Cancelamentos e reagendamentos
- Controle administrativo completo
- Backup e segurança local

**Tecnologias**:
- Excel/CSV para dados
- Sistema HTML/CSS/JS atual (mantido)
- Scripts PowerShell para sincronização
- Backup automático local

### 2. GOOGLE SHEETS (PONTE DE DADOS)
**Localização**: Cloud (Google Drive)
**Responsabilidades**:
- Receber dados da Secretaria via API
- Fornecer dados para equipe externa via API
- Sincronização bidirecional
- Controle de permissões
- Log de alterações

**Estrutura da Planilha**: "Sistema Fotográfico"
- **Aba "Agendamentos"**: Sessões agendadas
- **Aba "Realizados"**: Trabalhos concluídos pelos fotógrafos
- **Aba "Edicao"**: Controle de edição
- **Aba "Conferencia"**: Dashboard para conferência
- **Aba "Logs"**: Histórico de alterações

### 3. EQUIPE EXTERNA (ONLINE)
**Localização**: GitHub Pages (Hospedagem gratuita)
**Responsabilidades**:
- Fotógrafos: Consultar agenda + Marcar "REALIZADO"
- Editores: Marcar "EDITADO" + Cadastrar pedidos de edição
- Conferência: Dashboard online (se Google Sheets for suficiente)

**Tecnologias**:
- GitHub Pages (hospedagem)
- HTML/CSS/JS puro
- Google Sheets API v4
- Google OAuth 2.0
- Interface responsiva

## Fluxo de Dados

### Fluxo Principal
```
Secretaria → Excel Local → PowerShell → Google Sheets → GitHub Pages → Fotógrafos/Editores
                ↑                                                            ↓
            Backup Local ←─────────────── Updates Online ←─────────────────┘
```

### Sincronização Imediata (Secretaria)
1. Secretaria faz alteração no Excel
2. Script PowerShell detecta mudança (FileSystemWatcher)
3. Sincronização imediata com Google Sheets via API
4. Equipe externa vê alteração em tempo real

### Updates da Equipe (Intervalo Aceitável)
1. Fotógrafo/Editor faz alteração no GitHub Pages
2. JavaScript envia para Google Sheets API
3. Script PowerShell sincroniza de volta para Excel (a cada 5-10 min)
4. Secretaria vê alteração no próximo refresh

## Interfaces Online

### Para Fotógrafos
- **Página**: `/fotografos`
- **Funcionalidades**:
  - Consultar agenda do dia/semana
  - Ver detalhes do agendamento
  - Links de navegação (Waze/Google Maps)
  - Botão "Marcar como REALIZADO"
  - Histórico de trabalhos

### Para Editores
- **Página**: `/editores`
- **Funcionalidades**:
  - Lista de trabalhos para edição
  - Marcar como "EDITADO"
  - Cadastrar novos pedidos de edição
  - Status de progresso

### Para Conferência
- **Opção 1**: Dashboard no Google Sheets (recomendado)
- **Opção 2**: Página `/conferencia` no GitHub Pages

## Implementação Técnica

### GitHub Pages
- **Repositório**: Público ou privado
- **Deploy**: Automático via Git push
- **URL**: `https://[usuario].github.io/[repositorio]`
- **SSL**: Automático (HTTPS)

### Google Sheets API
- **Versão**: v4
- **Autenticação**: OAuth 2.0 + Service Account
- **Permissões**: Read/Write específicas por usuário
- **Rate Limits**: 300 requests/min/user

### Scripts PowerShell
- **Sincronização**: Bidirecional Excel ↔ Google Sheets
- **Monitoramento**: FileSystemWatcher para mudanças
- **Backup**: Automático antes de cada sync
- **Logs**: Detalhados para troubleshooting

## Cronograma de Implementação

### Semana 1: Setup e Documentação
- [x] Documentação completa
- [ ] Revisão estrutura dados offline
- [ ] Setup Google Sheets
- [ ] Configuração GitHub Pages

### Semana 2: Desenvolvimento
- [ ] Adaptação código HTML/JS para Google Sheets API
- [ ] Scripts PowerShell de sincronização
- [ ] Testes de integração
- [ ] Deploy e validação

## Vantagens da Solução

### GitHub Pages
- ✅ **Gratuito** e confiável
- ✅ **Rápido** de implementar (código 90% pronto)
- ✅ **Controle total** do código
- ✅ **Versionamento** automático
- ✅ **SSL** incluído
- ✅ **Facilita migração** futura

### Google Sheets como Bridge
- ✅ **API robusta** e bem documentada
- ✅ **Sincronização** em tempo real
- ✅ **Controle de acesso** granular
- ✅ **Backup automático** na nuvem
- ✅ **Interface familiar** para conferência

## Preparação para Migração Futura

### Supabase/Appsmith
- Estrutura de dados já organizada
- APIs padronizadas
- Código modular e reutilizável
- Documentação completa para transição

## Segurança e Backup

### Dados Offline (Secretaria)
- Backup local automático
- Versionamento de arquivos
- Controle de acesso local

### Dados Online (Google Sheets)
- Backup automático Google Drive
- Controle de permissões por usuário
- Log de alterações
- Recuperação de versões

## Monitoramento e Logs

### PowerShell Scripts
- Logs detalhados de sincronização
- Alertas de erro via email/webhook
- Métricas de performance

### Google Sheets
- Log de todas as alterações
- Timestamp de cada operação
- Usuário responsável por cada mudança

---

**Status**: Em desenvolvimento
**Última atualização**: Janeiro 2025
**Responsável**: Sistema de Gestão Fotográfica