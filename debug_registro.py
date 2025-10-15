import csv

# Ler o CSV
with open('docs/data/Solicitacao.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f, delimiter=';')
    headers = next(reader)
    
    # Encontrar o registro xPjXEq7rKG
    for row in reader:
        if len(row) > 1 and row[1] == 'xPjXEq7rKG':
            print('=== ANÁLISE DO REGISTRO xPjXEq7rKG ===')
            print(f'Total de colunas: {len(headers)}')
            print()
            
            # Encontrar colunas de quantidade
            quantidade_cols = []
            for i, header in enumerate(headers):
                if 'quantidade' in header.lower() or 'tour 360' in header.lower():
                    quantidade_cols.append((i, header, row[i] if i < len(row) else ''))
            
            print('COLUNAS DE QUANTIDADE:')
            for pos, header, value in quantidade_cols:
                print(f'  Posição {pos}: {header} = "{value}"')
            
            print()
            print('TIPO DO SERVIÇO:')
            tipo_servico_idx = headers.index('Tipo do Servico') if 'Tipo do Servico' in headers else -1
            if tipo_servico_idx >= 0 and tipo_servico_idx < len(row):
                print(f'  {headers[tipo_servico_idx]} = "{row[tipo_servico_idx]}"')
            
            print()
            print('DADOS COMPLETOS DO REGISTRO:')
            for i, (header, value) in enumerate(zip(headers, row)):
                if value.strip():  # Só mostrar campos com valor
                    print(f'  {i}: {header} = "{value}"')
            
            break