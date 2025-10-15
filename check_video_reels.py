import csv

with open('docs/data/Solicitacao.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f, delimiter=';')
    headers = next(reader)
    
    print('=== REGISTROS COM "Video em Solo (formato Reels)" ===')
    count = 0
    for row in reader:
        if len(row) > 28 and 'Video em Solo (formato Reels)' in row[28]:
            count += 1
            if count <= 5:  # Mostrar apenas os primeiros 5
                record_id = row[1] if len(row) > 1 else 'N/A'
                tipo_servico = row[28] if len(row) > 28 else 'N/A'
                qtd_foto = row[37] if len(row) > 37 else 'N/A'
                qtd_video = row[40] if len(row) > 40 else 'N/A'
                print(f'Record ID: {record_id}')
                print(f'  Tipo: {tipo_servico}')
                print(f'  Qtd FOTO: "{qtd_foto}"')
                print(f'  Qtd VIDEO: "{qtd_video}"')
                print()
    
    print(f'Total de registros encontrados: {count}')