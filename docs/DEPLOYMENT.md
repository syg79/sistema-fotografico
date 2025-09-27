# Guia de Deploy - GitHub Pages

Este documento fornece instruções detalhadas para fazer o deploy do Sistema Fotográfico no GitHub Pages.

## 🚀 Deploy Automático (Recomendado)

### Pré-requisitos

1. Repositório no GitHub
2. Pasta `docs/` com todos os arquivos
3. Branch `main` ou `master`

### Passos para Ativação

1. **Acesse as Configurações do Repositório**
   ```
   https://github.com/[seu-usuario]/[seu-repositorio]/settings
   ```

2. **Configure o GitHub Pages**
   - Navegue até a seção "Pages" no menu lateral
   - Em "Source", selecione "Deploy from a branch"
   - Em "Branch", escolha `main` (ou `master`)
   - Em "Folder", selecione `/docs`
   - Clique em "Save"

3. **Aguarde o Deploy**
   - O GitHub processará os arquivos automaticamente
   - O site estará disponível em: `https://[seu-usuario].github.io/[seu-repositorio]`
   - O processo pode levar alguns minutos

### Workflow Automático

O arquivo `.github/workflows/deploy-github-pages.yml` já está configurado e executará:

#### Triggers
- Push na branch `main`/`master` (pasta `docs/`)
- Pull requests para `main`/`master`
- Execução manual via GitHub Actions

#### Jobs Executados

1. **Build**
   - Checkout do código
   - Configuração Node.js e Ruby
   - Instalação de dependências
   - Validação HTML, CSS e JavaScript
   - Build do Jekyll
   - Upload dos artefatos

2. **Deploy**
   - Deploy automático no GitHub Pages
   - Apenas para branch `main`/`master`

3. **Test**
   - Testes de acessibilidade (pa11y)
   - Testes de performance (Lighthouse)
   - Verificação de links internos

4. **Notify**
   - Notificação do resultado geral

## 🛠️ Deploy Manual

### Usando Jekyll Localmente

```bash
# 1. Instalar Ruby e Bundler
gem install bundler jekyll

# 2. Navegar para a pasta docs
cd docs

# 3. Criar Gemfile (se não existir)
echo "source 'https://rubygems.org'" > Gemfile
echo "gem 'github-pages', group: :jekyll_plugins" >> Gemfile

# 4. Instalar dependências
bundle install

# 5. Build local
bundle exec jekyll build

# 6. Servir localmente (opcional)
bundle exec jekyll serve
```

### Usando Servidor HTTP Simples

```bash
# Python 3
python -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080

# Node.js
npx http-server docs -p 8080

# PHP
php -S localhost:8080 -t docs
```

## ⚙️ Configurações Avançadas

### Custom Domain

1. **Adicionar CNAME**
   ```bash
   echo "seudominio.com" > docs/CNAME
   ```

2. **Configurar DNS**
   - Adicione um registro CNAME apontando para `[seu-usuario].github.io`
   - Ou configure registros A para os IPs do GitHub Pages

3. **Ativar HTTPS**
   - Nas configurações do GitHub Pages
   - Marque "Enforce HTTPS"

### Configuração do Jekyll

Edite `docs/_config.yml`:

```yaml
# Configurações básicas
title: "Sistema Fotográfico"
description: "Dashboard interativo para gestão fotográfica"
baseurl: "/nome-do-repositorio"  # Para subdomínio
url: "https://seu-usuario.github.io"

# Para domínio customizado
# baseurl: ""
# url: "https://seudominio.com"
```

### Variáveis de Ambiente

Para configurações sensíveis, use GitHub Secrets:

1. **Configurar Secrets**
   ```
   Settings > Secrets and variables > Actions > New repository secret
   ```

2. **Usar no Workflow**
   ```yaml
   env:
     GOOGLE_SHEETS_API_KEY: ${{ secrets.GOOGLE_SHEETS_API_KEY }}
   ```

## 🔍 Monitoramento e Debug

### Verificar Status do Deploy

1. **GitHub Actions**
   ```
   https://github.com/[usuario]/[repositorio]/actions
   ```

2. **Logs de Build**
   - Clique no workflow em execução
   - Visualize os logs de cada job
   - Identifique erros e warnings

### Problemas Comuns

#### 1. Build Falha
```bash
# Verificar sintaxe YAML
yamllint _config.yml

# Testar Jekyll localmente
bundle exec jekyll build --verbose
```

#### 2. CSS/JS Não Carrega
```yaml
# _config.yml - verificar baseurl
baseurl: "/nome-correto-do-repositorio"
```

#### 3. Páginas 404
```bash
# Verificar estrutura de arquivos
tree docs/
```

#### 4. Validação Falha
```bash
# HTML
npx htmlhint docs/**/*.html

# CSS
npx stylelint docs/**/*.css

# JavaScript
npx eslint docs/**/*.js
```

## 📊 Otimização de Performance

### Minificação

```yaml
# _config.yml
sass:
  style: compressed

plugins:
  - jekyll-minifier
```

### Cache e CDN

```html
<!-- Usar CDNs para bibliotecas -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
```

### Otimização de Imagens

```bash
# Comprimir imagens antes do commit
imagemin docs/assets/images/* --out-dir=docs/assets/images/
```

## 🔒 Segurança

### Headers de Segurança

Adicione ao `_config.yml`:

```yaml
plugins:
  - jekyll-security-headers

security_headers:
  Content-Security-Policy: "default-src 'self'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net"
  X-Frame-Options: "DENY"
  X-Content-Type-Options: "nosniff"
```

### Sanitização

```javascript
// Usar DOMPurify para sanitizar HTML
const clean = DOMPurify.sanitize(dirty);
```

## 📱 Testes de Responsividade

### Ferramentas Recomendadas

1. **Chrome DevTools**
   - F12 > Toggle device toolbar
   - Testar diferentes resoluções

2. **BrowserStack**
   - Testes em dispositivos reais
   - Múltiplos navegadores

3. **Lighthouse**
   - Auditoria de performance
   - Acessibilidade e SEO

### Breakpoints Testados

```css
/* Mobile First */
@media (min-width: 576px) { /* Small */ }
@media (min-width: 768px) { /* Medium */ }
@media (min-width: 992px) { /* Large */ }
@media (min-width: 1200px) { /* Extra Large */ }
```

## 🚨 Rollback e Versionamento

### Rollback Rápido

```bash
# Reverter último commit
git revert HEAD

# Voltar para commit específico
git reset --hard [commit-hash]
git push --force-with-lease
```

### Tags de Versão

```bash
# Criar tag
git tag -a v1.0.0 -m "Versão 1.0.0"
git push origin v1.0.0

# Deploy de tag específica
git checkout v1.0.0
```

## 📞 Suporte e Troubleshooting

### Recursos Úteis

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Jekyll Documentation](https://jekyllrb.com/docs/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

### Contato

Para problemas específicos:
1. Verifique os logs do GitHub Actions
2. Teste localmente primeiro
3. Abra uma issue com logs detalhados
4. Consulte a documentação oficial

---

**Deploy realizado com sucesso! 🎉**