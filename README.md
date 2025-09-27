# Projeto: Processamento de Dados de Solicitações Tadabase para CSV Legível

## 📋 Objetivo Geral do Projeto

O objetivo principal deste projeto é automatizar a transformação de dados brutos de solicitações (originados do Tadabase) de um formato com IDs de conexão para um arquivo CSV final onde esses IDs são substituídos por nomes legíveis. O propósito final é preparar esses dados para importação e uso no arquivo **Vitrine.xlsx**.

## 🔄 Fluxo de Dados Completo (End-to-End)

Este projeto envolve uma sequência de três etapas principais para transformar os dados brutos em informações prontas para uso no Excel:

### 2.1. Origem dos Dados: Tadabase (Plataforma Online)
Os dados brutos residem em diversas tabelas na plataforma Tadabase.

**Tabelas Principais e seus IDs** (conforme configurado no arquivo `config/.env`):
- **Solicitacao**: `SOLICITACAO_TABLE_ID` (o6WQb5NnBZ)
- **Rede**: `REDE_TABLE_ID` (DVarwJjORP)
- **Clientes**: `CLIENTES_TABLE_ID` (lGArg7rmR6)
- **Fotografos**: `FOTOGRAFOS_TABLE_ID` (K2ejlOQo9B)
- **Corretores**: `CORRETORES_TABLE_ID` (eykNOvrDY3)
- **Gestores**: `GESTORES_TABLE_ID` (698rd2QZwd)
- **Regioes**: `REGIOES_TABLE_ID` (VX9QoerwYv)
- **CodigoVitrine**: `CODIGO_VITRINE_TABLE_ID` (4YZjnDNPvl)

### 2.2. Exportação para CSV Local (Passo Manual/Externo ao Script)
Os dados das tabelas Tadabase são exportados (presumivelmente de forma manual ou por outro processo externo) para arquivos CSV na pasta `d:\Projetos\Excel\csv_output\`.

**Arquivos CSV Exportados Utilizados:**
- `Solicitacao_utf8.csv` (contém os dados principais das solicitações, com IDs de conexão)
- `Rede.csv`
- `Clientes.csv`
- `Fotografos.csv`
- `Corretores-YYYY-MM-DD-HH-MM-SS.csv` (o nome exato pode variar com timestamp)
- `Gestores - Vitrine-YYYY-MM-DD-HH-MM-SS.csv` (o nome exato pode variar com timestamp)
- `Regioes-YYYY-MM-DD-HH-MM-SS.csv` (o nome exato pode variar com timestamp)

### 2.3. Processamento e Tradução de IDs (Executado por `import_tadabase_to_vitrine.ps1`)
O script `import_tadabase_to_vitrine.ps1` (localizado em `scripts\`) lê o `Solicitacao_utf8.csv` e os arquivos de dicionário locais listados acima.

Ele realiza a substituição dos IDs de conexão (ex: `field_175` para Rede, `field_86` para Clientes) por nomes legíveis, usando os dados dos dicionários.

**Saída**: `Solicitacao_resolvido.csv` (localizado em `d:\Projetos\Excel\csv_output\`). Este arquivo é o resultado do processamento.

### 2.4. Importação para o Excel (Passo Final)
O arquivo `Solicitacao_resolvido.csv` é então importado para o arquivo **Vitrine.xlsx**.

Este é o destino final dos dados processados, onde eles serão utilizados para análise, relatórios ou outras operações no Excel.

## 📁 Estrutura do Projeto

```
Excel/
├── config/
│   ├── .env                    # Configurações de API e IDs das tabelas Tadabase
│   └── schema.json
├── csv_output/                 # Pasta principal de dados
│   ├── Solicitacao_utf8.csv   # Arquivo principal de entrada (dados brutos com IDs)
│   ├── Solicitacao_resolvido.csv # Arquivo final processado (IDs substituídos por nomes)
│   ├── dictionaries/           # Dicionários de tradução (opcional)
│   ├── Rede.csv               # Dicionário de Redes
│   ├── Clientes.csv           # Dicionário de Clientes
│   ├── Fotografos.csv         # Dicionário de Fotógrafos
│   ├── Corretores-YYYY-MM-DD-HH-MM-SS.csv # Dicionário de Corretores (com timestamp)
│   ├── Gestores - Vitrine-YYYY-MM-DD-HH-MM-SS.csv # Dicionário de Gestores (com timestamp)
│   ├── Regioes-YYYY-MM-DD-HH-MM-SS.csv # Dicionário de Regiões (com timestamp)
│   └── [outros arquivos CSV exportados do Tadabase]
├── scripts/
│   ├── import_tadabase_to_vitrine.ps1  # Script principal de processamento
│   └── [outros scripts auxiliares]
├── Vitrine.xlsx               # Arquivo Excel de destino final
└── [outros arquivos do projeto]
```

## 🎯 Arquivo Principal

**`scripts\import_tadabase_to_vitrine.ps1`** - Este é o script PowerShell que contém toda a lógica de processamento e é o coração do sistema de transformação de dados.

## 🔧 Detalhes do Script `import_tadabase_to_vitrine.ps1`

Este script é a ferramenta central para a etapa de "Processamento e Tradução de IDs".

### 3.1. Função Principal
- Lê o arquivo CSV principal (`Solicitacao_utf8.csv`)
- Lê os arquivos CSV de dicionário locais
- Percorre cada linha do arquivo principal
- Para cada campo que é uma conexão, ele usa os dicionários carregados para encontrar o nome amigável correspondente ao ID e substitui o ID por esse nome

### 3.2. Componentes Chave (Funções Internas)

#### `Read-DictionaryCsv`
- Lê um arquivo CSV de dicionário e constrói um mapa de busca (ID → Nome)
- É robusta para extrair nomes de diferentes formatos de dados
- Suporta conversão de strings que representam objetos PowerShell (ex: `@{first_name=...}`)

#### `Convert-TadabaseFieldToString`
- Função utilitária para converter valores de campos (strings, objetos PowerShell, arrays) em uma representação de string limpa e legível
- Suporta diferentes tipos de dados: endereços, links, nomes completos, intervalos de datas, etc.

#### `Write-CsvWithBom`
- Salva uma coleção de objetos PowerShell em um arquivo CSV
- Garante a codificação UTF-8 com BOM para compatibilidade com Excel

### 3.3. Mapeamento de Conexões
O script utiliza os seguintes mapeamentos para resolver IDs:

| Campo no CSV Principal | Dicionário Correspondente | Arquivo de Dicionário |
|------------------------|---------------------------|----------------------|
| `field_175` | Rede | `Rede.csv` |
| `field_86` | Clientes | `Clientes.csv` |
| `field_111` | Fotografos | `Fotografos.csv` |
| `field_179` | Corretores | `Corretores-YYYY-MM-DD-HH-MM-SS.csv` |
| `field_431` | Gestores | `Gestores - Vitrine-YYYY-MM-DD-HH-MM-SS.csv` |
| `field_142` | Regioes | `Regioes-YYYY-MM-DD-HH-MM-SS.csv` |

### 3.4. Estrutura dos Arquivos de Dicionário
Cada arquivo CSV de dicionário contém:
- **Coluna ID**: Identificador único (geralmente `id`)
- **Coluna Nome**: Valor legível correspondente
  - `Rede.csv`: `field_154`
  - `Clientes.csv`: `field_57`
  - `Fotografos.csv`: `field_48`
  - `Corretores.csv`: `field_72`
  - `Gestores.csv`: `field_38`
  - `Regioes.csv`: `field_140`

## 📋 Dependências

- **PowerShell**: O script é escrito em PowerShell e requer um ambiente PowerShell para execução
- **Arquivos CSV**: Todos os arquivos de entrada e dicionário devem estar presentes na pasta `csv_output\` com os nomes e formatos esperados
- **Arquivo .env**: O script lê o arquivo `config/.env` para obter os IDs das tabelas Tadabase (mesmo que a versão atual não faça chamadas à API para os dicionários, essa configuração é mantida para consistência e futuras expansões)

## 🚀 Como Executar

1. Abra o PowerShell
2. Navegue até o diretório raiz do projeto:
   ```powershell
   cd "d:\Projetos\Excel"
   ```
3. Execute o script:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\import_tadabase_to_vitrine.ps1
   ```

### Parâmetros Opcionais
- `-InputFile`: Nome do arquivo de entrada (padrão: `Solicitacao_utf8.csv`)
- `-OutputFile`: Nome do arquivo de saída (padrão: `Solicitacao_resolvido.csv`)
- Os parâmetros `-PageSize` e `-MaxPages` não são mais relevantes para esta versão local, mas não causam problemas se mantidos

## 📝 Estado Atual e Próximos Passos

- O script foi recentemente atualizado para resolver problemas de carregamento de dicionários a partir de arquivos CSV locais e de nomes de arquivos
- **Ação Pendente**: O arquivo `D:\Projetos\Excel\csv_output\Regiões-2025-09-11-21-21-15.csv` precisa ser renomeado para `D:\Projetos\Excel\csv_output\Regioes-2025-09-11-21-21-15.csv` (removendo o `õ`) para compatibilidade com o script

## 🔄 Fluxo de Dados Resumido

```
Tadabase (Plataforma Online)
        ↓ [Exportação Manual/Externa]
Arquivos CSV Locais (csv_output/)
        ↓ [Processamento via Script]
Solicitacao_utf8.csv (IDs) → import_tadabase_to_vitrine.ps1 → Solicitacao_resolvido.csv (Nomes Legíveis)
        ↓ [Importação Manual]
Vitrine.xlsx (Destino Final)
```

## 📊 Exemplo de Transformação

**Antes (Solicitacao_utf8.csv - com IDs):**
```csv
id,field_175,field_86,field_111
1,"DVarwJjORP","lGArg7rmR6","K2ejlOQo9B"
```

**Depois (Solicitacao_resolvido.csv - com nomes):**
```csv
id,field_175,field_86,field_111
1,"Rede ABC","Cliente XYZ","Fotógrafo João"
```

## 📝 Notas Importantes

- O script opera exclusivamente com arquivos CSV locais (não faz chamadas à API do Tadabase)
- Todos os arquivos de dicionário devem estar presentes na pasta `csv_output\` para funcionamento correto
- O arquivo de saída substitui completamente o arquivo anterior se já existir
- A codificação UTF-8 com BOM garante compatibilidade com Excel e outras ferramentas
- Os nomes dos arquivos de dicionário com timestamp podem variar conforme a data de exportação
- **Importante**: Arquivos com caracteres especiais (como `õ` em "Regiões") devem ser renomeados para compatibilidade