$root=Join-Path $env:USERPROFILE 'AION Visual Lab\AION-Dashboard'
$app=Join-Path $root 'aion-dashboard-v05'
Write-Host '=== AION AUTOUPDATE - DIAGNOSTICO ===' -ForegroundColor Cyan
$versao=Join-Path $app 'aion-version.json'
if(Test-Path $versao) { Get-Content -LiteralPath $versao -Raw }
else { Write-Host 'Arquivo de versao nao encontrado.' -ForegroundColor Yellow }
Get-ScheduledTask -TaskName 'AION-Atualizacao-Automatica' -ErrorAction SilentlyContinue | Select-Object TaskName,State
Get-ScheduledTaskInfo -TaskName 'AION-Atualizacao-Automatica' -ErrorAction SilentlyContinue | Select-Object LastRunTime,LastTaskResult,NextRunTime
$state=Join-Path $root '_automacao\update-state.json'
if(Test-Path $state){Get-Content -LiteralPath $state -Raw}
try {
 $r=Invoke-RestMethod 'http://127.0.0.1:5500/api/status' -TimeoutSec 3
 Write-Host ('API do AION ativa. Backups: '+$r.dataBackupCount) -ForegroundColor Green
} catch { Write-Host 'API local indisponivel neste momento.' -ForegroundColor Yellow }
$log=Join-Path $root '_automacao_logs\atualizacoes.log'
if(Test-Path $log) { Get-Content -LiteralPath $log -Tail 8 }
