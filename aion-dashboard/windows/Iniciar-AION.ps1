param([switch]$SemNavegador)
$ErrorActionPreference='Stop'
$base=Join-Path $env:USERPROFILE 'AION Visual Lab\AION-Dashboard'
$project=Join-Path $base 'aion-dashboard-v05'
$server=Join-Path $project 'servidor_aion.py'
$logDir=Join-Path $base '_automacao_logs'
$url='http://127.0.0.1:5500/'
if(-not(Test-Path $server)){throw 'servidor_aion.py nao encontrado. Instale o pacote v0.5.1.'}
New-Item -Path $logDir -ItemType Directory -Force|Out-Null
try{
 $r=Invoke-RestMethod -Uri ($url+'api/status') -TimeoutSec 3
 if($r.ok -eq $true){Write-Host 'AION protegido ja esta ativo.' -ForegroundColor Green;if(-not $SemNavegador){Start-Process $url};exit 0}
}catch{}
$listener=Get-NetTCPConnection -LocalPort 5500 -State Listen -ErrorAction SilentlyContinue
if($listener){throw 'Porta 5500 em uso por outro servidor. Instale o upgrade para migrar a versao anterior.'}
$py=$null;$prefix=@()
foreach($exe in @('py','python')){
 $cmd=Get-Command $exe -ErrorAction SilentlyContinue
 if(-not $cmd){continue}
 try{ $args=if($exe -eq 'py'){@('-3','--version')}else{@('--version')};$v=& $cmd.Source @args 2>&1|Out-String
  if($LASTEXITCODE -eq 0 -and $v -match 'Python 3'){$py=$cmd.Source;if($exe -eq 'py'){$prefix=@('-3')};break}
 }catch{}
}
if(-not $py){throw 'Python 3 nao encontrado.'}
$arguments=@()+$prefix+@(('"'+$server+'"'),'--port','5500')
$p=Start-Process -FilePath $py -ArgumentList $arguments -WorkingDirectory $project -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDir 'servidor-saida.log') -RedirectStandardError (Join-Path $logDir 'servidor-erros.log')
$ok=$false
for($i=0;$i -lt 24;$i++){
 Start-Sleep -Milliseconds 400
 try{$r=Invoke-RestMethod -Uri ($url+'api/status') -TimeoutSec 2;if($r.ok){$ok=$true;break}}catch{}
 if($p.HasExited){break}
}
if(-not $ok){throw 'Novo servidor nao iniciou. Confira _automacao_logs.'}
Write-Host "AION protegido ativo em $url (PID $($p.Id))" -ForegroundColor Green
if(-not $SemNavegador){Start-Process $url}
