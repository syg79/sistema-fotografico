# Projeto: Sistema Fotográfico – Migração Tadabase ➜ Google Sheets/Supabase
Documentação de trabalho para reproduzir, no novo stack, todos os fluxos do Tadabase (cadastros, agendas, confirmações e faturamento), garantindo que os dados sejam mantidos em operação via Google Sheets/Apps Script e, posteriormente, Supabase.

## Estrutura de páginas necessária
- [x] **Cadastro de Solicitação**: formulário para criar pedidos (`docs/cadastros/novos-pedidos.html`).
- [x] **Pendentes para Agendamento**: listagem dos pedidos com status pendente (`docs/agendamentos/pendentes.html`).
- [x] **Agendados não Publicados**: painel de agendamentos aguardando publicação (`docs/agendamentos/agendados.html`).
- [x] **Agenda por Fotógrafo**: agenda pública por profissional (`docs/fotografos/agenda.html`).
- [x] **Confirmação de Realizados**: livro de registro / geração de código vitrine (`docs/operacao/registro.html`).
- [x] **Fila dos Não Editados**: imóveis realizados aguardando edição (`docs/editores/nao-editados.html`).
- [x] **Faturamento Pendentes**: imóveis realizados + editados, porém “não faturados” (`docs/financeiro/nao-faturados.html`).

## Próximas ações
- [x] Localizar/copiar HTML existente de cada tela e mover para `docs/...`.
- [x] Ajustar `roleLinks` e navegação no `docs/index.html` com os novos caminhos.
- [ ] Adaptar cada página para usar `googleSheetsAPI`/`googleSheetsWriter` (busca/atualização) em vez de CSV local.
- [ ] Definir design system/common components para manter aparência consistente nos novos módulos.
- [ ] Planejar transição futura para Supabase (schema, triggers, policies) após MVP estável usando Sheets.
