# Sistema Fotográfico - GitHub Pages

Este projeto implementa uma interface web moderna para o Sistema Fotográfico usando GitHub Pages, fornecendo dashboards interativos para diferentes tipos de usuários.

## 📋 Visão Geral

O sistema oferece interfaces especializadas para:
- **Conferência**: Dashboard com estatísticas e análises
- **Editores**: Gerenciamento de trabalhos e projetos
- **Fotógrafos**: Agenda e cronograma de eventos

## 🚀 Funcionalidades

### Componentes Principais
- **TableComponent**: Tabelas interativas com paginação, ordenação e filtros
- **ModalComponent**: Modais reutilizáveis para formulários e visualizações
- **Utils**: Funções auxiliares para formatação e validação

### Recursos Implementados
- ✅ Interface responsiva com Bootstrap 5
- ✅ Tema escuro automático baseado na preferência do sistema
- ✅ Componentes JavaScript modulares e reutilizáveis
- ✅ Validação de formulários e sanitização de dados
- ✅ Gráficos interativos com Chart.js
- ✅ Notificações toast e modais de confirmação
- ✅ Integração com Google Sheets API
- ✅ Sistema de autenticação e autorização

## 📁 Estrutura do Projeto

```
docs/
├── _config.yml                 # Configuração do Jekyll
├── index.html                  # Página principal
├── assets/
│   ├── css/
│   │   ├── main.css           # Estilos principais
│   │   └── components.css     # Estilos dos componentes
│   └── js/
│       ├── utils.js           # Funções auxiliares
│       └── components/
│           ├── table-component.js
│           └── modal-component.js
├── conferencia/
│   └── dashboard.html         # Dashboard de conferência
├── editores/
│   └── trabalhos.html         # Interface para editores
├── fotografos/
│   └── agenda.html            # Agenda dos fotógrafos
├── config/
│   └── sheets-config.js       # Configuração das planilhas
├── .htmlhintrc               # Configuração de validação HTML
├── .stylelintrc.json         # Configuração de validação CSS
└── .eslintrc.json            # Configuração de validação JavaScript
```

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Framework CSS**: Bootstrap 5.3.0
- **Ícones**: Font Awesome 6.4.0
- **Gráficos**: Chart.js
- **Build**: Jekyll (GitHub Pages)
- **CI/CD**: GitHub Actions

## 📦 Deployment

### Configuração Automática (Recomendado)

1. **Ativar GitHub Pages**:
   - Vá para Settings > Pages no seu repositório
   - Selecione "Deploy from a branch"
   - Escolha a branch `main` e pasta `/docs`
   - Clique em "Save"

2. **Workflow Automático**:
   - O arquivo `.github/workflows/deploy-github-pages.yml` já está configurado
   - O deploy acontece automaticamente a cada push na branch `main`
   - Inclui validação de HTML, CSS e JavaScript
   - Testes de acessibilidade e performance

### Configuração Manual

Se preferir configurar manualmente:

```bash
# 1. Clone o repositório
git clone [seu-repositorio]
cd [nome-do-repositorio]

# 2. Navegue para a pasta docs
cd docs

# 3. Instale as dependências (se necessário)
bundle install

# 4. Execute localmente
bundle exec jekyll serve
```

## 🔧 Configuração

### Variáveis de Ambiente

Configure as seguintes variáveis no arquivo `config/sheets-config.js`:

```javascript
const CONFIG = {
    GOOGLE_SHEETS_API_KEY: 'sua-api-key-aqui',
    SPREADSHEET_ID: 'id-da-sua-planilha',
    // ... outras configurações
};
```

### Personalização

1. **Cores e Tema**: Edite as variáveis CSS em `assets/css/main.css`
2. **Componentes**: Modifique os arquivos em `assets/js/components/`
3. **Configuração Jekyll**: Ajuste `_config.yml` conforme necessário

## 🧪 Testes

### Testes Locais

```bash
# Servidor HTTP simples
python -m http.server 8080

# Ou usando Node.js
npx http-server docs -p 8080
```

### Validação Automática

O workflow do GitHub Actions executa:
- Validação HTML com HTMLHint
- Validação CSS com Stylelint
- Validação JavaScript com ESLint
- Testes de acessibilidade com pa11y
- Testes de performance com Lighthouse

## 📱 Responsividade

O sistema é totalmente responsivo e otimizado para:
- 📱 Mobile (320px+)
- 📱 Tablet (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large Desktop (1200px+)

## 🎨 Componentes de UI

### TableComponent

```javascript
const table = new TableComponent('#table-container', {
    columns: [
        { key: 'name', label: 'Nome', sortable: true },
        { key: 'email', label: 'Email', sortable: true }
    ],
    data: dados,
    pagination: true,
    search: true
});
```

### ModalComponent

```javascript
// Modal de confirmação
ModalComponent.showConfirm(
    'Confirmar Ação',
    'Tem certeza que deseja continuar?',
    () => console.log('Confirmado')
);

// Modal de formulário
ModalComponent.showForm('Novo Item', campos, (dados) => {
    console.log('Dados do formulário:', dados);
});
```

## 🔒 Segurança

- Sanitização automática de HTML
- Validação de entrada de dados
- Proteção contra XSS
- Headers de segurança configurados

## 📈 Performance

- CSS e JavaScript minificados em produção
- Lazy loading de imagens
- Otimização de fontes e ícones
- Cache de recursos estáticos

## 🐛 Troubleshooting

### Problemas Comuns

1. **CSS não carrega**: Verifique os caminhos dos arquivos CSS
2. **JavaScript não funciona**: Verifique o console do navegador
3. **Dados não aparecem**: Verifique a configuração da API do Google Sheets

### Logs e Debug

- Use o console do navegador (F12)
- Verifique os logs do GitHub Actions
- Teste localmente antes do deploy

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte e dúvidas:
- Abra uma issue no GitHub
- Consulte a documentação dos componentes
- Verifique os exemplos de uso

---

**Desenvolvido com ❤️ para o Sistema Fotográfico**