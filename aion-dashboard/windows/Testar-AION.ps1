# Teste nao destrutivo do AION local
$ErrorActionPreference='Stop'
$Project=Join-Path $env:USERPROFILE 'AION Visual Lab\AION-Dashboard\aion-dashboard-v05'
$Files=@('index.html','styles.css','legacy.js','tools.js','manifest.webmanifest','sw.js','icons\icon-192.png','icons\icon-512.png')
$failed=0
foreach ($f in $Files) {
 $p=Join-Path $Project $f
 if (Test-Path -LiteralPath $p -PathType Leaf) { Write-Host "OK arquivo: $f" -ForegroundColor Green }
 else { Write-Host "FALHA arquivo ausente: $f" -ForegroundColor Red; $failed++ }
}
try {
 $manifest=Get-Content -LiteralPath (Join-Path $Project 'manifest.webmanifest') -Raw | ConvertFrom-Json
 if ($manifest.name -or $manifest.short_name) { Write-Host 'OK manifest PWA' -ForegroundColor Green }
 else { throw 'manifest sem nome' }
} catch { Write-Host "FALHA manifest: $_" -ForegroundColor Red; $failed++ }
try {
 $r=Invoke-WebRequest 'http://127.0.0.1:5500/' -UseBasicParsing -TimeoutSec 5
 if ($r.StatusCode -eq 200 -and $r.Content -match '<title>AION') { Write-Host 'OK servidor AION' -ForegroundColor Green }
 else { throw 'resposta inesperada' }
} catch { Write-Host "FALHA servidor: $_" -ForegroundColor Red; $failed++ }
if ($failed -gt 0) { Write-Host "Falhas: $failed" -ForegroundColor Red; exit 1 }
Write-Host 'Verificacoes basicas aprovadas. Ainda faltam testes completos dos recursos no navegador.' -ForegroundColor Green
