# Configuração de Fontes de Dados

O Sistema Fotográfico suporta **dois modos de operação** para carregamento de dados:

## 🔧 Modos Disponíveis

### 1. **CSV Local** (Padrão)
- **Vantagens**: 
  - ✅ Funciona offline
  - ✅ Não requer configuração de APIs
  - ✅ Mais rápido para carregar
  - ✅ Ideal para GitHub Pages
  - ✅ Sem limites de quota

- **Desvantagens**:
  - ❌ Não permite edição em tempo real
  - ❌ Requer atualização manual dos arquivos

### 2. **Google Sheets API**
- **Vantagens**:
  - ✅ Dados sempre atualizados
  - ✅ Permite edição colaborativa
  - ✅ Sincronização automática
  - ✅ Interface familiar (Google Sheets)

- **Desvantagens**:
  - ❌ Requer configuração de API
  - ❌ Sujeito a limites de quota
  - ❌ Requer conexão com internet
  - ❌ Mais complexo de configurar

## ⚙️ Como Configurar

### Alternar para CSV Local (Recomendado para GitHub Pages)

1. Abra o arquivo `assets/js/app-config.js`
2. Altere a configuração:
```javascript
DATA_SOURCE: 'csv'
```

3. Certifique-se de que os arquivos CSV estão na pasta `data/`:
   - `data/Solicitacao.csv`
   - `data/Fotografos.csv`
   - `data/Clientes.csv`
   - `data/Rede.csv`

### Alternar para Google Sheets

1. Abra o arquivo `assets/js/app-config.js`
2. Altere a configuração:
```javascript
DATA_SOURCE: 'google-sheets'
```

3. Configure as credenciais do Google Sheets:
```javascript
GOOGLE_SHEETS: {
    SPREADSHEET_ID: 'SEU_ID_DA_PLANILHA_AQUI',
    API_KEY: 'SUA_CHAVE_API_AQUI',
    // ... outras configurações
}
```

## 🔄 Sistema Híbrido

O sistema utiliza um **Data Loader híbrido** que:

- Detecta automaticamente qual fonte usar baseado na configuração
- Carrega os scripts apropriados (CSV Loader ou Google Sheets API)
- Fornece uma interface unificada para ambos os modos
- Permite alternar entre modos sem modificar o código das páginas

## 📁 Estrutura de Arquivos

```
docs/
├── assets/js/
│   ├── csv-loader.js          # Carregador de CSV
│   ├── google-sheets-api.js   # API do Google Sheets
│   └── data-loader.js         # Loader híbrido (novo)
├── config/
│   └── config.js              # Configurações (atualizado)
└── data/                      # Arquivos CSV (para modo CSV)
    ├── Solicitacao.csv
    ├── Fotografos.csv
    ├── Clientes.csv
    └── Rede.csv
```

## 🚀 Recomendações

### Para GitHub Pages (Produção)
- **Use CSV Local** (`DATA_SOURCE: 'csv'`)
- Mais confiável e rápido
- Sem dependências externas

### Para Desenvolvimento/Colaboração
- **Use Google Sheets** (`DATA_SOURCE: 'google-sheets'`)
- Facilita atualizações colaborativas
- Dados sempre sincronizados

## 🔍 Verificação do Status

O sistema exibe no console qual fonte está sendo utilizada:
```
🔄 Data Loader inicializado com fonte: csv
🚀 Data Loader híbrido pronto para uso
```

## 🛠️ Solução de Problemas

### CSV não carrega
1. Verifique se os arquivos estão na pasta `data/`
2. Confirme que `DATA_SOURCE: 'csv'` no config.js
3. Verifique o console para erros de carregamento

### Google Sheets não carrega
1. Verifique as credenciais no config.js
2. Confirme que `DATA_SOURCE: 'google-sheets'`
3. Verifique se a planilha está compartilhada publicamente
4. Confirme que a API está habilitada no Google Cloud Console

## 📝 Notas Importantes

- O sistema mantém **compatibilidade total** entre os dois modos
- Todas as funcionalidades funcionam independente da fonte escolhida
- A alteração pode ser feita a qualquer momento editando apenas o config.js
- O Google Sheets API permanece disponível para uso futuro mesmo quando usando CSV
