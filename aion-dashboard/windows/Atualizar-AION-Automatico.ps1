# AION automatic updater v1.1 - Windows PowerShell 5.1 / usuario atual.
# Canal fixo do proprietario, sem comandos remotos, sem instalacao de dependencias.
param(
    [string]$LocalFeed = '',
    [switch]$CheckOnly
)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$root = Split-Path -Parent $PSScriptRoot
$app = Join-Path $root 'aion-dashboard-v05'
$automation = Join-Path $root '_automacao'
$backups = Join-Path $root '_backups_codigo'
$logs = Join-Path $root '_automacao_logs'
$statePath = Join-Path $automation 'update-state.json'
$remoteRoot = 'https://raw.githubusercontent.com/vaneitosta/aion-orb/dashboard-updates/aion-dashboard'
$whitelist = @(
    'index.html','styles.css','legacy.js','tools.js','protecao.js','sw.js',
    'manifest.webmanifest','servidor_aion.py','README.md','aion-version.json',
    'icons/icon-192.png','icons/icon-512.png'
)
$mutex = New-Object System.Threading.Mutex($false, 'Local\AION-Dashboard-Updater')
$acquired = $false
$stage = $null
function Get-Sha256([string]$path) {
    $stream=[IO.File]::OpenRead($path)
    $sha=[Security.Cryptography.SHA256]::Create()
    try { return [BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-','').ToLowerInvariant() }
    finally { $stream.Dispose(); $sha.Dispose() }
}
function Log([string]$message) {
    $line = ('{0} | {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $message)
    Add-Content -LiteralPath (Join-Path $logs 'atualizacoes.log') -Value $line -Encoding UTF8
    Write-Host $line
}
function Save-State([string]$version,[string]$hash) {
    $value = @{ installedVersion=$version; packageSha256=$hash; installedAt=(Get-Date).ToString('o'); channel='stable' } | ConvertTo-Json -Compress
    $tmp = Join-Path $automation ('update-state-' + [guid]::NewGuid().ToString('N') + '.tmp')
    Set-Content -LiteralPath $tmp -Value $value -Encoding UTF8
    Move-Item -LiteralPath $tmp -Destination $statePath -Force
}
function Allowed-Name([string]$name) {
    if ([string]::IsNullOrWhiteSpace($name)) { return $false }
    if ($name.Contains('..') -or $name.Contains(':') -or $name.Contains('\') -or $name.StartsWith('/') -or $name.StartsWith('.')) { return $false }
    return $whitelist -ccontains $name
}
function Read-Manifest($location) {
    $json = if ($LocalFeed) {
        Get-Content -LiteralPath (Join-Path $LocalFeed 'stable.json') -Raw -Encoding UTF8
    } else {
        (Invoke-WebRequest -Uri "$remoteRoot/channel/stable.json" -UseBasicParsing -TimeoutSec 25 -Headers @{'Cache-Control'='no-cache'}).Content
    }
    if ($json.Length -gt 20000) { throw 'Manifesto remoto excede o tamanho permitido.' }
    $m = ConvertFrom-Json -InputObject $json
    if ($m.schema -ne 1 -or $m.channel -ne 'stable' -or $m.version -notmatch '^0\.[0-9]{1,3}\.[0-9]{1,3}$') { throw 'Manifesto invalido.' }
    if ($m.sha256 -notmatch '^[0-9a-fA-F]{64}$') { throw 'Hash de pacote invalido.' }
    if ($m.package -ne 'package.b64') { throw 'Pacote fora do formato autorizado.' }
    if ($m.files.Count -lt 3 -or $m.files.Count -gt $whitelist.Count) { throw 'Quantidade invalida de arquivos.' }
    $names = @{}
    foreach($f in $m.files) {
        $name = [string]$f.path
        if (-not (Allowed-Name $name) -or $names.ContainsKey($name)) { throw "Caminho nao permitido: $name" }
        if ($f.sha256 -notmatch '^[0-9a-fA-F]{64}$' -or [long]$f.bytes -lt 1 -or [long]$f.bytes -gt 1000000) { throw "Dados invalidos: $name" }
        $names[$name] = $true
    }
    foreach($name in @('index.html','sw.js','aion-version.json')) {
        if (-not $names.ContainsKey($name)) { throw "Arquivo obrigatorio ausente: $name" }
    }
    return $m
}
try {
    New-Item -ItemType Directory -Force -Path $automation,$backups,$logs | Out-Null
    if (-not (Test-Path -LiteralPath (Join-Path $app 'index.html'))) { throw 'AION v0.5 existente nao encontrado.' }
    $acquired = $mutex.WaitOne(0)
    if (-not $acquired) { Log 'Outra verificacao ja esta ativa. Saindo sem alteracoes.'; exit 0 }
    $installed = '0.5.1'
    if (Test-Path -LiteralPath $statePath) {
        try {
            $old = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
            if ([string]$old.installedVersion -match '^0\.[0-9]{1,3}\.[0-9]{1,3}$') { $installed = [string]$old.installedVersion }
        } catch { Log 'Estado antigo ilegivel; usando versao local detectada.' }
    } elseif (Test-Path -LiteralPath (Join-Path $app 'aion-version.json')) {
        try {
            $v = Get-Content -LiteralPath (Join-Path $app 'aion-version.json') -Raw | ConvertFrom-Json
            if ([string]$v.version -match '^0\.[0-9]{1,3}\.[0-9]{1,3}$') { $installed = [string]$v.version }
        } catch {}
    }
    Log "Procurando atualizacoes. Versao local: $installed"
    $m = Read-Manifest $LocalFeed
    $next = [string]$m.version
    if ([version]$next -le [version]$installed) { Log "Sem atualizacao. Canal: $next."; exit 0 }
    Log "Versao $next disponivel; iniciando verificacao."
    if ($CheckOnly) { exit 0 }
    $stage = Join-Path $root ('_staging_update_' + [guid]::NewGuid().ToString('N'))
    $stageApp = Join-Path $stage 'conteudo'
    New-Item -ItemType Directory -Force -Path $stage,$stageApp | Out-Null
    $download = Join-Path $stage 'package.b64'
    $package = Join-Path $stage 'release.zip'
    if ($LocalFeed) { Copy-Item -LiteralPath (Join-Path $LocalFeed 'package.b64') -Destination $download }
    else { Invoke-WebRequest -Uri "$remoteRoot/releases/$next/package.b64" -OutFile $download -UseBasicParsing -TimeoutSec 40 }
    $b64 = [IO.File]::ReadAllText($download).Trim()
    if ($b64.Length -gt 2800000) { throw 'Arquivo de distribuicao excede o limite.' }
    [IO.File]::WriteAllBytes($package, [Convert]::FromBase64String($b64))
    $pkgBytes = (Get-Item -LiteralPath $package).Length
    if ($pkgBytes -gt 2000000 -or $pkgBytes -lt 1000) { throw 'Tamanho do pacote invalido.' }
    $actualHash = (Get-Sha256 $package)
    if ($actualHash -ne ([string]$m.sha256).ToLowerInvariant()) { throw 'SHA-256 do pacote divergente: nada instalado.' }
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [IO.Compression.ZipFile]::OpenRead($package)
    try {
        if ($zip.Entries.Count -ne $m.files.Count) { throw 'Lista de arquivos do pacote nao confere.' }
        $seen = @{}
        $total = 0L
        foreach($entry in $zip.Entries) {
            $name = [string]$entry.FullName
            if (-not (Allowed-Name $name) -or $seen.ContainsKey($name)) { throw "Arquivo inesperado no pacote: $name" }
            $seen[$name] = $true
            $total += $entry.Length
            if ($entry.Length -gt 1000000 -or $total -gt 4000000) { throw 'Pacote excede tamanho descompactado permitido.' }
        }
        [IO.Compression.ZipFile]::ExtractToDirectory($package,$stageApp)
    } finally { $zip.Dispose() }
    foreach($f in $m.files) {
        $name = [string]$f.path
        $path = Join-Path $stageApp $name
        if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Arquivo ausente: $name" }
        if ((Get-Item -LiteralPath $path).Length -ne [long]$f.bytes -or (Get-Sha256 $path) -ne ([string]$f.sha256).ToLowerInvariant()) { throw "Arquivo corrompido: $name" }
    }
    $versionFile = Get-Content -LiteralPath (Join-Path $stageApp 'aion-version.json') -Raw -Encoding UTF8 | ConvertFrom-Json
    if ([string]$versionFile.version -ne $next) { throw 'Identificacao da versao divergente.' }
    if (-not ((Get-Content -LiteralPath (Join-Path $stageApp 'index.html') -Raw) -match [regex]::Escape('content="' + $next + '"'))) { throw 'Versao HTML divergente.' }
    $node = Get-Command node -ErrorAction SilentlyContinue
    if ($node) {
        foreach($n in @('legacy.js','tools.js','protecao.js','sw.js')) {
            if (-not (Test-Path -LiteralPath (Join-Path $stageApp $n))) { continue }
            & $node.Source --check (Join-Path $stageApp $n) | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "Erro de sintaxe JavaScript: $n" }
        }
    }
    $py = Get-Command python -ErrorAction SilentlyContinue
    if ($py) {
        $src = Join-Path $stageApp 'servidor_aion.py'
        if (Test-Path -LiteralPath $src) { & $py.Source -c 'import ast,sys,tokenize;ast.parse(tokenize.open(sys.argv[1]).read())' $src
        if ($LASTEXITCODE -ne 0) { throw 'Erro de sintaxe Python no pacote.' } }
    }
    $backup = Join-Path $backups ('AION-Antes-AutoUpdate-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff') + '-' + [guid]::NewGuid().ToString('N').Substring(0,8) + '.zip')
    Compress-Archive -Path (Join-Path $app '*') -DestinationPath $backup -CompressionLevel Optimal
    if (-not (Test-Path -LiteralPath $backup) -or (Get-Item -LiteralPath $backup).Length -lt 1000) { throw 'Backup previo nao validado.' }
    Log "Backup anterior salvo: $backup"
    $previous = Join-Path $stage 'anterior'
    New-Item -ItemType Directory -Force -Path $previous | Out-Null
    $wasPresent = @{}
    foreach($f in $m.files) {
        $name = [string]$f.path
        $oldPath = Join-Path $app $name
        $wasPresent[$name] = Test-Path -LiteralPath $oldPath
        if ($wasPresent[$name]) {
            $prevPath = Join-Path $previous $name
            New-Item -ItemType Directory -Force -Path (Split-Path -Parent $prevPath) | Out-Null
            Copy-Item -LiteralPath $oldPath -Destination $prevPath -Force
        }
    }
    $completed = $false
    try {
        foreach($f in $m.files) {
            $name = [string]$f.path
            $to = Join-Path $app $name
            New-Item -ItemType Directory -Force -Path (Split-Path -Parent $to) | Out-Null
            Copy-Item -LiteralPath (Join-Path $stageApp $name) -Destination $to -Force
        }
        foreach($f in $m.files) {
            $name = [string]$f.path
            if ((Get-Sha256 (Join-Path $app $name)) -ne ([string]$f.sha256).ToLowerInvariant()) { throw "Falha ao verificar arquivo instalado: $name" }
        }
        Save-State $next $actualHash
        $completed = $true
    } finally {
        if (-not $completed) {
            foreach($f in $m.files) {
                $name = [string]$f.path
                $to = Join-Path $app $name
                if ($wasPresent[$name]) { Copy-Item -LiteralPath (Join-Path $previous $name) -Destination $to -Force }
                else { Remove-Item -LiteralPath $to -Force -ErrorAction SilentlyContinue }
            }
            Log 'Falha na instalacao: arquivos anteriores restaurados.'
        }
    }
    Log "Atualizacao $next concluida. Dados pessoais e projeto Sincronia preservados."
    exit 0
} catch {
    try { Log ('ERRO: ' + $_.Exception.Message) } catch { Write-Host ('ERRO: ' + $_.Exception.Message) }
    exit 1
} finally {
    if ($stage -and (Test-Path -LiteralPath $stage)) {
        $resolved=[IO.Path]::GetFullPath($stage)
        if ($resolved.StartsWith([IO.Path]::GetFullPath($root)+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction SilentlyContinue }
    }
    if ($acquired) { $mutex.ReleaseMutex() | Out-Null }
    $mutex.Dispose()
}
