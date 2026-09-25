<#
.SYNOPSIS
  Arranca el Free-Spoty Audio Engine en Windows (0 anuncios).

.DESCRIPTION
  - Instala dependencias de Node si faltan.
  - Instala yt-dlp (venv privado con workers rápidos si hay Python; si no,
    yt-dlp.exe) en server\bin y lo mantiene actualizado.
  - Arranca el servidor en http://localhost:<Port>.
  - -Tunnel: túnel HTTPS temporal de Cloudflare (sin cuenta) con enlace + QR.
  - -Background: modo servicio para el arranque automático (lo usa
    setup-windows.ps1): sin salida por pantalla, logs en server\bin\*.log,
    reinicio si el servidor se cae y actualización diaria de yt-dlp.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File server\start-windows.ps1
  powershell -ExecutionPolicy Bypass -File server\start-windows.ps1 -Tunnel
#>
param(
  [switch]$Tunnel,
  [switch]$Background,
  [int]$Port = 3000,
  [string]$AppUrl = 'https://daniih03.github.io/free-spoty/'
)

$ErrorActionPreference = 'Stop'
$ServerDir = $PSScriptRoot
$BinDir = Join-Path $ServerDir 'bin'
$YtDlpExe = Join-Path $BinDir 'yt-dlp.exe'
$Cloudflared = Join-Path $BinDir 'cloudflared.exe'
$Venv = Join-Path $BinDir 'venv'
$VenvPython = Join-Path $Venv 'Scripts\python.exe'
$Stamp = Join-Path $BinDir '.ytdlp-updated'
New-Item -ItemType Directory -Force $BinDir | Out-Null

function Say($Text, $Color = 'DarkGray') {
  if (-not $Background) { Write-Host $Text -ForegroundColor $Color }
}

# PowerShell 5.1 convierte cualquier salida de stderr de un ejecutable en error
# fatal con ErrorActionPreference=Stop: se ejecuta en modo Continue y se juzga
# por el código de salida.
function Invoke-Native([scriptblock]$Command, [string]$What) {
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try { & $Command 2>&1 | Out-Null } finally { $ErrorActionPreference = $prev }
  if ($LASTEXITCODE -ne 0) { throw "$What falló (código $LASTEXITCODE)" }
}

function Get-Binary($Url, $Path) {
  Say "Descargando $(Split-Path $Path -Leaf)..."
  Invoke-WebRequest -Uri $Url -OutFile $Path -UseBasicParsing
}

# yt-dlp: YouTube cambia a menudo, mantenerlo al día es clave.
# Con Python → venv privado + workers persistentes (extracción ~3x más rápida).
function Update-YtDlp([int]$MaxAgeDays = 3) {
  $stale = -not (Test-Path $Stamp) -or (Get-Item $Stamp).LastWriteTime -lt (Get-Date).AddDays(-$MaxAgeDays)
  $python = Get-Command python -ErrorAction SilentlyContinue |
    Where-Object { $_.Source -notmatch 'WindowsApps' } | Select-Object -First 1

  if ($python) {
    if (-not (Test-Path $VenvPython)) {
      Say 'Creando entorno de yt-dlp...'
      Invoke-Native { & $python.Source -m venv $Venv } 'python -m venv'
      $stale = $true
    }
    if ($stale) {
      Say 'Instalando/actualizando yt-dlp...'
      Invoke-Native { & $VenvPython -m pip install -q -U --disable-pip-version-check yt-dlp } 'pip install yt-dlp'
      New-Item -ItemType File -Force $Stamp | Out-Null
    }
    $env:YTDLP_PYTHON = $VenvPython
    $env:YTDLP_PATH = Join-Path $Venv 'Scripts\yt-dlp.exe'
  } else {
    if (-not (Test-Path $YtDlpExe)) {
      Get-Binary 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe' $YtDlpExe
    } elseif ($stale) {
      Say 'Actualizando yt-dlp...'
      Invoke-Native { & $YtDlpExe -U } 'yt-dlp -U'
    }
    New-Item -ItemType File -Force $Stamp | Out-Null
    $env:YTDLP_PATH = $YtDlpExe
  }
}

function Start-Server {
  $opts = @{ FilePath = 'node'; ArgumentList = 'index.js'; WorkingDirectory = $ServerDir; PassThru = $true }
  if ($Background) {
    # Comparte la consola sin ventana (conhost --headless) del bucle de servicio
    $opts.NoNewWindow = $true
    $opts.RedirectStandardOutput = Join-Path $BinDir 'server.log'
    $opts.RedirectStandardError = Join-Path $BinDir 'server.err.log'
  } else {
    $opts.NoNewWindow = $true
  }
  Start-Process @opts
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw 'Node.js no está instalado (https://nodejs.org).'
}
if (-not (Test-Path (Join-Path $ServerDir 'node_modules'))) {
  Say 'Instalando dependencias del servidor...'
  Push-Location $ServerDir
  Invoke-Native { npm install --omit=dev --no-audit --no-fund } 'npm install'
  Pop-Location
}

$env:PORT = "$Port"

# ---------------------------------------------------------------------------
# Modo servicio (arranque automático)
# ---------------------------------------------------------------------------
if ($Background) {
  # Si otro proceso ya sirve el puerto (p. ej. arrancado a mano), se espera a
  # que lo libere en lugar de salir: así el bucle siempre queda vigilando.
  while (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) { Start-Sleep -Seconds 30 }

  while ($true) {
    try { Update-YtDlp -MaxAgeDays 1 } catch { Add-Content (Join-Path $BinDir 'server.err.log') "[$(Get-Date)] $_" }
    $server = Start-Server
    # Reinicio diario (para aplicar actualizaciones de yt-dlp) o si el servidor cae
    [void]$server.WaitForExit(86400000)
    if (-not $server.HasExited) {
      Stop-Process -Id $server.Id -Force
      Get-CimInstance Win32_Process -Filter "Name = 'python.exe'" |
        Where-Object { $_.CommandLine -match 'ytdlp_worker' } |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    }
    Start-Sleep -Seconds 5
  }
}

# ---------------------------------------------------------------------------
# Modo interactivo
# ---------------------------------------------------------------------------
Update-YtDlp
$server = Start-Server
$tunnelProc = $null
try {
  Start-Sleep -Seconds 2
  $local = "http://localhost:$Port"
  Write-Host ''
  Write-Host '  Free-Spoty Audio Engine activo (0 anuncios)' -ForegroundColor Red
  Write-Host "  En este PC: $($AppUrl)?server=$local" -ForegroundColor White

  if ($Tunnel) {
    if (-not (Test-Path $Cloudflared)) {
      Get-Binary 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' $Cloudflared
    }
    $log = Join-Path $BinDir 'tunnel.log'
    Remove-Item $log -ErrorAction SilentlyContinue
    $tunnelProc = Start-Process $Cloudflared -ArgumentList "tunnel --no-autoupdate --url $local" `
      -RedirectStandardError $log -NoNewWindow -PassThru

    $publicUrl = $null
    for ($i = 0; $i -lt 60 -and -not $publicUrl; $i++) {
      Start-Sleep -Milliseconds 500
      if (Test-Path $log) {
        $m = Select-String -Path $log -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' | Select-Object -First 1
        if ($m) { $publicUrl = $m.Matches[0].Value }
      }
    }

    if ($publicUrl) {
      $link = "$($AppUrl)?server=$publicUrl"
      Write-Host "  En el móvil / fuera de casa: $link" -ForegroundColor White
      Write-Host '  (la URL del túnel cambia en cada arranque; para una fija usa setup-windows.ps1)' -ForegroundColor DarkGray
      Push-Location $ServerDir
      node -e "require('qrcode-terminal').generate(process.argv[1], { small: true })" $link
      Pop-Location
    } else {
      Write-Warning "No se obtuvo la URL del túnel; revisa $log"
    }
  }

  Write-Host ''
  Write-Host '  Ctrl+C para detener.' -ForegroundColor DarkGray
  Wait-Process -Id $server.Id
} finally {
  if ($tunnelProc -and -not $tunnelProc.HasExited) { Stop-Process -Id $tunnelProc.Id -Force }
  if (-not $server.HasExited) { Stop-Process -Id $server.Id -Force }
}
