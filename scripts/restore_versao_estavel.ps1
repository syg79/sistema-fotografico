# 🔄 SCRIPT DE RESTAURAÇÃO - VERSÃO ESTÁVEL
# Data: 16 de Janeiro de 2025
# Propósito: Restaurar arquivos para a versão estável funcional

param(
    [switch]$ListBackups,
    [string]$BackupDate,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

# Diretórios
$csvDir = "D:\Projetos\Excel\csv_output"
$scriptsDir = "D:\Projetos\Excel\scripts"

Write-Host "🔄 RESTAURAÇÃO PARA VERSÃO ESTÁVEL" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray

if ($ListBackups) {
    Write-Host "📁 Backups disponíveis:" -ForegroundColor Yellow
    
    # Listar backups do CSV
    Write-Host "\n📊 Arquivos CSV:" -ForegroundColor Green
    Get-ChildItem "$csvDir\Solicitacao-VERSAO_ESTAVEL-*.csv" | 
        Sort-Object Name -Descending | 
        ForEach-Object { 
            $date = $_.Name -replace "Solicitacao-VERSAO_ESTAVEL-(.+)\.csv", '$1'
            Write-Host "  - $date" -ForegroundColor White
        }
    
    # Listar backups dos scripts
    Write-Host "\n📜 Scripts:" -ForegroundColor Green
    Get-ChildItem "$scriptsDir\*-VERSAO_ESTAVEL-*.ps1" | 
        Sort-Object Name -Descending | 
        ForEach-Object { 
            $name = $_.Name -replace "-VERSAO_ESTAVEL-.+\.ps1", ''
            $date = $_.Name -replace ".+-VERSAO_ESTAVEL-(.+)\.ps1", '$1'
            Write-Host "  - $name ($date)" -ForegroundColor White
        }
    
    Write-Host "\n💡 Para restaurar, use: .\restore_versao_estavel.ps1 -BackupDate 'YYYY-MM-DD-HH-MM-SS'" -ForegroundColor Yellow
    exit 0
}

if (-not $BackupDate) {
    # Encontrar o backup mais recente
    $latestBackup = Get-ChildItem "$csvDir\Solicitacao-VERSAO_ESTAVEL-*.csv" | 
        Sort-Object Name -Descending | 
        Select-Object -First 1
    
    if ($latestBackup) {
        $BackupDate = $latestBackup.Name -replace "Solicitacao-VERSAO_ESTAVEL-(.+)\.csv", '$1'
        Write-Host "📅 Usando backup mais recente: $BackupDate" -ForegroundColor Green
    } else {
        Write-Host "❌ Nenhum backup encontrado!" -ForegroundColor Red
        Write-Host "💡 Use -ListBackups para ver backups disponíveis" -ForegroundColor Yellow
        exit 1
    }
}

# Verificar se os arquivos de backup existem
$csvBackup = "$csvDir\Solicitacao-VERSAO_ESTAVEL-$BackupDate.csv"
$syncBackup = "$scriptsDir\sync_tadabase_to_solicitacao-VERSAO_ESTAVEL-$BackupDate.ps1"
$fixBackup = "$scriptsDir\fix_solicitacao_connections-VERSAO_ESTAVEL-$BackupDate.ps1"

if (-not (Test-Path $csvBackup)) {
    Write-Host "❌ Backup CSV não encontrado: $csvBackup" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $syncBackup)) {
    Write-Host "❌ Backup do script sync não encontrado: $syncBackup" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $fixBackup)) {
    Write-Host "❌ Backup do script fix não encontrado: $fixBackup" -ForegroundColor Red
    exit 1
}

# Confirmação
if (-not $Force) {
    Write-Host "⚠️  ATENÇÃO: Esta operação irá sobrescrever os arquivos atuais!" -ForegroundColor Yellow
    Write-Host "📁 Arquivos que serão restaurados:" -ForegroundColor White
    Write-Host "  - Solicitacao.csv" -ForegroundColor Gray
    Write-Host "  - sync_tadabase_to_solicitacao.ps1" -ForegroundColor Gray
    Write-Host "  - fix_solicitacao_connections.ps1" -ForegroundColor Gray
    
    $confirm = Read-Host "\n🤔 Deseja continuar? (s/N)"
    if ($confirm -ne 's' -and $confirm -ne 'S') {
        Write-Host "❌ Operação cancelada pelo usuário" -ForegroundColor Yellow
        exit 0
    }
}

try {
    Write-Host "\n🔄 Iniciando restauração..." -ForegroundColor Cyan
    
    # Fazer backup dos arquivos atuais antes de restaurar
    $currentTimestamp = Get-Date -Format 'yyyy-MM-dd-HH-mm-ss'
    Write-Host "📦 Fazendo backup dos arquivos atuais..." -ForegroundColor Yellow
    
    Copy-Item "$csvDir\Solicitacao.csv" "$csvDir\Solicitacao-ANTES_RESTAURACAO-$currentTimestamp.csv" -ErrorAction SilentlyContinue
    Copy-Item "$scriptsDir\sync_tadabase_to_solicitacao.ps1" "$scriptsDir\sync_tadabase_to_solicitacao-ANTES_RESTAURACAO-$currentTimestamp.ps1" -ErrorAction SilentlyContinue
    Copy-Item "$scriptsDir\fix_solicitacao_connections.ps1" "$scriptsDir\fix_solicitacao_connections-ANTES_RESTAURACAO-$currentTimestamp.ps1" -ErrorAction SilentlyContinue
    
    # Restaurar arquivos
    Write-Host "📊 Restaurando Solicitacao.csv..." -ForegroundColor Green
    Copy-Item $csvBackup "$csvDir\Solicitacao.csv" -Force
    
    Write-Host "📜 Restaurando sync_tadabase_to_solicitacao.ps1..." -ForegroundColor Green
    Copy-Item $syncBackup "$scriptsDir\sync_tadabase_to_solicitacao.ps1" -Force
    
    Write-Host "📜 Restaurando fix_solicitacao_connections.ps1..." -ForegroundColor Green
    Copy-Item $fixBackup "$scriptsDir\fix_solicitacao_connections.ps1" -Force
    
    Write-Host "\n✅ RESTAURAÇÃO CONCLUÍDA COM SUCESSO!" -ForegroundColor Green
    Write-Host "📅 Versão restaurada: $BackupDate" -ForegroundColor White
    Write-Host "💾 Backup dos arquivos anteriores salvo com timestamp: $currentTimestamp" -ForegroundColor Gray
    
} catch {
    Write-Host "\n❌ ERRO durante a restauração: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "\n🎯 Próximos passos recomendados:" -ForegroundColor Cyan
Write-Host "1. Verificar se os arquivos foram restaurados corretamente" -ForegroundColor White
Write-Host "2. Executar um teste de sincronização" -ForegroundColor White
Write-Host "3. Validar os dados no arquivo Solicitacao.csv" -ForegroundColor White