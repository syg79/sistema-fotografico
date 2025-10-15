/**
 * Script para atualizar todas as páginas HTML com o Data Sync Manager
 * Execute este script para adicionar o data-sync-manager.js em todas as páginas que usam google-sheets-api.js
 */

const fs = require('fs');
const path = require('path');

// Lista de arquivos HTML que precisam ser atualizados
const htmlFiles = [
    'editores/nao-editados.html',
    'financeiro/nao-faturados.html',
    'operacao/editar-registro.html',
    'conferencia/dashboard.html',
    'editores/trabalhos.html',
    'cadastros/novos-pedidos.html',
    'agendamentos/editar-registro.html',
    'agendamentos/pendentes.html',
    'agendamentos/agendados.html',
    'financeiro/cobranca-lote.html',
    'agendamentos/novo-agendamento.html',
    'fotografos/agenda.html',
    'agendamentos/agendar.html'
];

function updateHtmlFile(filePath) {
    try {
        const fullPath = path.join(__dirname, '../../', filePath);
        let content = fs.readFileSync(fullPath, 'utf8');
        
        // Verificar se já tem o data-sync-manager.js
        if (content.includes('data-sync-manager.js')) {
            console.log(`✅ ${filePath} já atualizado`);
            return;
        }
        
        // Procurar por app-config.js e adicionar data-sync-manager.js depois
        const configPattern = /(<script src="[^"]*app-config\.js"><\/script>)/;
        const match = content.match(configPattern);
        
        if (match) {
            const replacement = match[1] + '\n    <script src="../assets/js/data-sync-manager.js"></script>';
            content = content.replace(configPattern, replacement);
            
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`✅ ${filePath} atualizado com sucesso`);
        } else {
            console.warn(`⚠️ ${filePath} - Não foi possível encontrar app-config.js`);
        }
        
    } catch (error) {
        console.error(`❌ Erro ao atualizar ${filePath}:`, error.message);
    }
}

// Atualizar todos os arquivos
console.log('🔄 Iniciando atualização das páginas HTML...\n');

htmlFiles.forEach(updateHtmlFile);

console.log('\n✅ Atualização concluída!');
console.log('\n📝 Páginas atualizadas com data-sync-manager.js:');
htmlFiles.forEach(file => console.log(`   - ${file}`));

console.log('\n💡 O Data Sync Manager agora está disponível em todas as páginas que usam Google Sheets API.');
console.log('   Ele fornece:');
console.log('   - Sincronização automática entre Google Sheets e CSVs');
console.log('   - Indicadores visuais da fonte de dados ativa');
console.log('   - Sistema de backup local para maior confiabilidade');
console.log('   - Detecção de divergências entre fontes de dados');