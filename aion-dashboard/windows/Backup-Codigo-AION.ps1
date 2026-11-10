# Backup apenas dos arquivos do projeto. Nao exporta localStorage do navegador.
$ErrorActionPreference='Stop'
$Base=Split-Path -Parent $PSScriptRoot
$Project=Join-Path $Base 'aion-dashboard-v05'
$Dest=Join-Path $Base '_backups_codigo'
if (-not (Test-Path -LiteralPath (Join-Path $Project 'index.html'))) { throw 'Projeto AION nao localizado.' }
New-Item -ItemType Directory -Path $Dest -Force | Out-Null
$stamp=(Get-Date -Format 'yyyyMMdd-HHmmss-fff')+'-'+[guid]::NewGuid().ToString('N').Substring(0,8)
$target=Join-Path $Dest "AION-Codigo-$stamp.zip"
$tmp=Join-Path $Dest ".staging-$stamp"
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
try {
 $allowed=@('index.html','styles.css','legacy.js','tools.js','protecao.js','sw.js','servidor_aion.py','manifest.webmanifest','aion-version.json','README.md','icons/icon-192.png','icons/icon-512.png')
 $files=foreach($name in $allowed){Get-Item -LiteralPath (Join-Path $Project $name)}
 foreach ($f in $files) {
  $rel=$f.FullName.Substring($Project.Length).TrimStart([char]'\',[char]'/')
  $to=Join-Path $tmp $rel
  New-Item -ItemType Directory -Path (Split-Path $to) -Force | Out-Null
  Copy-Item -LiteralPath $f.FullName -Destination $to
 }
 Compress-Archive -Path (Join-Path $tmp '*') -DestinationPath $target -CompressionLevel Optimal
 if (-not (Test-Path -LiteralPath $target)) { throw 'ZIP nao criado' }
  $stream=[IO.File]::OpenRead($target)
 $sha=[Security.Cryptography.SHA256]::Create()
 try{$hash=[BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-','')}finally{$stream.Dispose();$sha.Dispose()}
 @{Hash=$hash} | ConvertTo-Json | Set-Content -LiteralPath ($target+'.sha256.json') -Encoding UTF8
 Write-Host "Backup do codigo: $target" -ForegroundColor Green
} finally {
 $resolved=[IO.Path]::GetFullPath($tmp)
 if($resolved.StartsWith([IO.Path]::GetFullPath($Dest)+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $resolved)){Remove-Item -LiteralPath $resolved -Recurse -Force}
}
