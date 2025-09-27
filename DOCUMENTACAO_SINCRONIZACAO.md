# 📋 DOCUMENTAÇÃO - SINCRONIZAÇÃO TADABASE → SOLICITACAO.CSV

## 🎯 OBJETIVO
Sincronizar dados do Tadabase com o arquivo `Solicitacao.csv` mantendo a estrutura de colunas definida pelo usuário.

## 📊 ANÁLISE DA ESTRUTURA

### Campos Especiais (SEM Field ID)
As **3 primeiras colunas** são campos nativos do Tadabase:
```
1. Auto Increment  → auto_increment  (campo automático)
2. Record ID       → id              (ID único do registro)
3. Created At      → created_at      (data de criação)
```
**IMPORTANTE**: Estes campos NÃO possuem Field ID customizado e são acessados diretamente pela API.

### Campos Customizados (COM Field ID)
Da linha 4 em diante, todos os campos possuem:
- **Field Name**: Nome descritivo (ex: "ID Solicitacao")
- **Field Type**: Tipo do campo (ex: "Auto Increment", "Connection", "Select")
- **Field Slug**: Nome da coluna no CSV (ex: "field_85")
- **Field ID**: ID único no Tadabase (ex: "53GN69vrzx")

## 🔄 ESTRATÉGIA DE SINCRONIZAÇÃO

### 1. MAPEAMENTO DE CAMPOS
```
Estrutura_Solicitacao_CSV.csv → Mapa de conversão:
- Field ID → Field Slug (para buscar na API)
- Field Slug → Nome da coluna no CSV final
```

### 2. TIPOS DE CAMPOS E TRATAMENTO

#### A) Campos Simples
- **Text, Number, Date, Date/Time**: Valor direto
- **Radio, Select**: Valor selecionado
- **Address**: Objeto JSON com endereço completo

#### B) Campos de Conexão (Connection)
Requerem resolução via dicionários:
- **Rede** → `dictionaries/Rede.csv`
- **Nome Cliente** → `dictionaries/Clientes.csv`
- **Fotografo** → `dictionaries/Fotografos.csv`
- **Corretor Responsavel** → `dictionaries/Corretores.csv`
- **Bairro/Localidade** → `dictionaries/Regioes.csv`

#### C) Campos Calculados
- **Text Formula, Equation**: Valores calculados pelo Tadabase
- **Link**: Objetos com URL e texto

### 3. PROCESSO DE SINCRONIZAÇÃO

#### PASSO 1: Preparação
1. Carregar arquivo `Estrutura_Solicitacao_CSV.csv`
2. Criar mapa: Field ID → Field Slug
3. Carregar todos os dicionários de conexão
4. Validar credenciais da API (.env)

#### PASSO 2: Busca de Dados
1. **Campos Nativos**: Buscar `id`, `auto_increment`, `created_at`
2. **Campos Customizados**: Buscar usando Field IDs da estrutura
3. **Paginação**: Processar todos os registros (API limita a 100 por página)

#### PASSO 3: Transformação
1. **Campos Simples**: Copiar valor direto
2. **Conexões**: Resolver ID → Nome usando dicionários
3. **Objetos JSON**: Extrair valores relevantes
4. **Campos Vazios**: Preencher com string vazia

#### PASSO 4: Montagem Final
1. Criar cabeçalho com field_slugs na ordem correta
2. Processar cada registro linha por linha
3. Garantir que todas as 139 colunas estejam presentes
4. Salvar no formato CSV com separador `;`

## 🔧 CONFIGURAÇÕES TÉCNICAS

### API Tadabase
- **URL**: `https://api.tadabase.io/api/v1`
- **Tabela**: `o6WQb5NnBZ` (SOLICITACAO_TABLE_ID)
- **Autenticação**: App ID + App Key + App Secret
- **Limite**: 100 registros por requisição

### Dicionários Disponíveis
```
dictionaries/
├── Clientes.csv     → field_86 (Nome Cliente)
├── Corretores.csv   → field_XXX (Corretor Responsavel)
├── Fotografos.csv   → field_XXX (Fotografo)
├── Gestores.csv     → field_XXX (Gestor)
├── Rede.csv         → field_175 (Rede)
├── Regioes.csv      → field_142 (Bairro/Localidade)
└── CodigoVitrine.csv → field_XXX (Codigo Vitrine)
```

### Estrutura do CSV Final
- **Separador**: `;` (ponto e vírgula)
- **Encoding**: UTF-8
- **Colunas**: 139 (conforme estrutura definida)
- **Ordem**: Exatamente como no `Solicitacao.csv` atual

## ⚠️ PONTOS DE ATENÇÃO

1. **Campos sem Field ID**: Os 3 primeiros campos são especiais
2. **Conexões**: Sempre resolver IDs para nomes legíveis
3. **Objetos JSON**: Extrair apenas valores necessários
4. **Paginação**: API retorna máximo 100 registros por vez
5. **Rate Limit**: Respeitar limites da API do Tadabase
6. **Backup**: Sempre fazer backup antes de sobrescrever

## 🚀 PRÓXIMOS PASSOS

1. ✅ Documentação completa
2. 🔄 Criar script de sincronização
3. 🧪 Testar com poucos registros
4. 📊 Validar estrutura final
5. 🎯 Executar sincronização completa

---
**Data**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
**Arquivo**: DOCUMENTACAO_SINCRONIZACAO.md
**Status**: Pronto para implementação