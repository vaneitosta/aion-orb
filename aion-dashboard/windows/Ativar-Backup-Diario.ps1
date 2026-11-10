# Agenda backup diario do codigo as 20:00 (usuario logado), sem privilegios administrativos.
$ErrorActionPreference='Stop'
$Script=Join-Path $PSScriptRoot 'Backup-Codigo-AION.ps1'
if (-not (Test-Path -LiteralPath $Script)) { throw 'Backup-Codigo-AION.ps1 ausente.' }
$action=New-ScheduledTaskAction -Execute 'powershell.exe' -Argument ('-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "' + $Script + '"')
$trigger=New-ScheduledTaskTrigger -Daily -At '20:00'
$principal=New-ScheduledTaskPrincipal -UserId ([System.Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType Interactive -RunLevel Limited
$settings=New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew
$task=New-ScheduledTask -Settings $settings -Action $action -Trigger $trigger -Principal $principal -Description 'Backup diario do codigo AION; nao inclui dados do navegador.'
Register-ScheduledTask -TaskName 'AION-Backup-Codigo-Diario' -InputObject $task -Force | Out-Null
Write-Host 'Backup diario do codigo agendado as 20:00, quando o usuario estiver conectado.' -ForegroundColor Green
Write-Host 'O backup automatico nao inclui tarefas e sessoes gravadas no navegador.' -ForegroundColor Yellow
