# Configuração da API do Google Maps

## Instruções para Configurar o Preenchimento Automático de Endereços

### 1. Obter Chave da API do Google Maps

1. **Acesse o Google Cloud Console:**
   - Vá para: https://console.cloud.google.com/

2. **Crie ou Selecione um Projeto:**
   - Crie um novo projeto ou selecione um existente
   - Anote o nome do projeto para referência

3. **Ative as APIs Necessárias:**
   - No menu lateral, vá em "APIs e Serviços" > "Biblioteca"
   - Procure e ative as seguintes APIs:
     - **Places API** (obrigatória)
     - **Maps JavaScript API** (obrigatória)
     - **Geocoding API** (opcional, para funcionalidades avançadas)

4. **Crie uma Chave de API:**
   - Vá em "APIs e Serviços" > "Credenciais"
   - Clique em "Criar Credenciais" > "Chave de API"
   - Copie a chave gerada

### 2. Configurar a Chave no Sistema

1. **Abra o arquivo de configuração:**
   ```
   docs/assets/js/config/google-maps-config.js
   ```

2. **Substitua a chave placeholder:**
   ```javascript
   // Encontre esta linha:
   apiKey: 'YOUR_GOOGLE_MAPS_API_KEY_HERE',
   
   // Substitua por sua chave real:
   apiKey: 'SUA_CHAVE_AQUI',
   ```

### 3. Configurar Restrições de Segurança (Recomendado)

1. **No Google Cloud Console:**
   - Vá em "APIs e Serviços" > "Credenciais"
   - Clique na chave de API criada

2. **Configure Restrições de Aplicativo:**
   - Selecione "Referenciadores HTTP (sites)"
   - Adicione seus domínios autorizados:
     ```
     localhost:*
     127.0.0.1:*
     seu-dominio.com/*
     ```

3. **Configure Restrições de API:**
   - Marque "Restringir chave"
   - Selecione apenas as APIs que você ativou:
     - Places API
     - Maps JavaScript API

### 4. Testar a Configuração

1. **Ative o modo debug (opcional):**
   ```javascript
   // No arquivo google-maps-config.js
   debug: true
   ```

2. **Abra o console do navegador:**
   - Pressione F12
   - Vá na aba "Console"

3. **Teste em um formulário:**
   - Acesse qualquer formulário com campo de endereço
   - Digite um endereço no campo
   - Verifique se aparecem sugestões do Google

### 5. Formulários com Autocomplete Ativo

O sistema foi configurado nos seguintes formulários:

- **Novos Pedidos:** `docs/cadastros/novos-pedidos.html`
  - Campo: "Endereço do Imóvel" (id="endereco")
  - Preenche automaticamente: endereço, bairro, CEP

- **Editar Registro (Operação):** `docs/operacao/editar-registro.html`
  - Campo: "Endereço" (id="endereco")
  - Preenche automaticamente: endereço completo

- **Editar Registro (Agendamentos):** `docs/agendamentos/editar-registro.html`
  - Campo: "Endereço do Imóvel" (id="enderecoImovel")
  - Preenche automaticamente: endereço, bairro

### 6. Solução de Problemas

**Problema: Autocomplete não aparece**
- Verifique se a chave da API está correta
- Verifique se as APIs estão ativadas no Google Cloud
- Verifique o console do navegador para erros

**Problema: Erro de cota excedida**
- Verifique os limites de uso no Google Cloud Console
- Configure billing se necessário

**Problema: Erro de domínio não autorizado**
- Adicione seu domínio nas restrições da chave de API
- Para desenvolvimento local, adicione `localhost:*`

### 7. Custos

- **Places API:** Aproximadamente $0.017 por solicitação
- **Maps JavaScript API:** Aproximadamente $0.007 por carregamento
- Google oferece $200 de crédito gratuito por mês

### 8. Configurações Avançadas

Para personalizar o comportamento, edite o arquivo:
```
docs/assets/js/config/google-maps-config.js
```

Opções disponíveis:
- `language`: Idioma das sugestões (padrão: 'pt-BR')
- `region`: Região para priorizar resultados (padrão: 'BR')
- `types`: Tipos de lugares a incluir (padrão: ['address'])
- `componentRestrictions`: Restrições por país (padrão: Brasil)

---

**Importante:** Mantenha sua chave de API segura e nunca a compartilhe publicamente!