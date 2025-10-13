# Project Roadmap - Sistema Fotografico Migration
Goal: Rebuild the Tadabase workflows (cadastro, agendas, confirmacoes, faturamento) using Google Sheets + Apps Script as the interim backend, and later move to Supabase without losing functionality.

## Pages in scope (status)
- [x] Cadastro de solicitacao (docs/cadastros/novos-pedidos.html)
- [x] Pendentes para agendamento (docs/agendamentos/pendentes.html)
- [x] Agendados (interno) (docs/agendamentos/agendados.html)
- [x] Agenda por fotografo (docs/fotografos/agenda.html)
- [x] Confirmacao de realizados / codigo vitrine (docs/operacao/registro.html)
- [x] Fila "nao editado" (docs/editores/nao-editados.html)
- [x] Faturamento "nao faturado" (docs/financeiro/nao-faturados.html)

## Integration tasks
- [x] Copiar HTMLs do Tadabase para docs/
- [x] Atualizar roleLinks e menu da home com as novas rotas
- [ ] Migrar scripts para googleSheetsAPI / googleSheetsWriter
  - [x] Pendentes (docs/agendamentos/pendentes.html + assets/js/pages/pendentes.js)
  - [x] Agendados interno (docs/agendamentos/agendados.html)
  - [ ] Agenda fotografos (docs/fotografos/agenda.html)
  - [ ] Registro / codigo vitrine (docs/operacao/registro.html)
  - [ ] Nao editados (docs/editores/nao-editados.html)
  - [ ] Nao faturados (docs/financeiro/nao-faturados.html)
  - [ ] Cadastro (docs/cadastros/novos-pedidos.html)
- [ ] Padronizar layout (componentes reutilizaveis, estilos centralizados)
- [ ] Planejar migracao para Supabase (schema, triggers, policies) apos MVP em Sheets
