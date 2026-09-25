<#
.SYNOPSIS
  Arranca el Free-Spoty Audio Engine en Windows (0 anuncios).

.DESCRIPTION
  - Instala dependencias de Node si faltan.
  - Descarga yt-dlp.exe en server\bin y lo actualiza si tiene más de 3 días.
  - Arranca el servidor en http://localhost:<Port>.
  - Con -Tunnel abre un túnel HTTPS gratuito de Cloudflare (sin cuenta) y
    muestra un enlace + código QR para conectar el móvil.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File server\start-windows.ps1
  powershell -ExecutionPolicy Bypass -File server\start-windows.ps1 -Tunnel
#>
param(
  [switch]$Tunnel,
  [int]$Port = 3000,
  [string]$AppUrl = 'https://daniih03.github.io/free-spoty/'
)

$ErrorActionPreference = 'Stop'
$ServerDir = $PSScriptRoot
$BinDir = Join-Path $ServerDir 'bin'
$YtDlp = Join-Path $BinDir 'yt-dlp.exe'
$Cloudflared = Join-Path $BinDir 'cloudflared.exe'
New-Item -ItemType Directory -Force $BinDir | Out-Null

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
  Write-Host "Descargando $(Split-Path $Path -Leaf)..." -ForegroundColor DarkGray
  Invoke-WebRequest -Uri $Url -OutFile $Path -UseBasicParsing
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw 'Node.js no está instalado (https://nodejs.org).'
}

if (-not (Test-Path (Join-Path $ServerDir 'node_modules'))) {
  Write-Host 'Instalando dependencias del servidor...' -ForegroundColor DarkGray
  Push-Location $ServerDir
  Invoke-Native { npm install --omit=dev --no-audit --no-fund } 'npm install'
  Pop-Location
}

# yt-dlp: YouTube cambia a menudo, mantenerlo al día es clave.
# Con Python → venv privado + workers persistentes (extracción ~3x más rápida).
# Sin Python → yt-dlp.exe autónomo.
$Venv = Join-Path $BinDir 'venv'
$VenvPython = Join-Path $Venv 'Scripts\python.exe'
$Stamp = Join-Path $BinDir '.ytdlp-updated'
$Stale = -not (Test-Path $Stamp) -or (Get-Item $Stamp).LastWriteTime -lt (Get-Date).AddDays(-3)
$SystemPython = Get-Command python -ErrorAction SilentlyContinue |
  Where-Object { $_.Source -notmatch 'WindowsApps' } | Select-Object -First 1

if ($SystemPython) {
  if (-not (Test-Path $VenvPython)) {
    Write-Host 'Creando entorno de yt-dlp...' -ForegroundColor DarkGray
    Invoke-Native { & $SystemPython.Source -m venv $Venv } 'python -m venv'
    $Stale = $true
  }
  if ($Stale) {
    Write-Host 'Instalando/actualizando yt-dlp...' -ForegroundColor DarkGray
    Invoke-Native { & $VenvPython -m pip install -q -U --disable-pip-version-check yt-dlp } 'pip install yt-dlp'
    New-Item -ItemType File -Force $Stamp | Out-Null
  }
  $env:YTDLP_PYTHON = $VenvPython
  $env:YTDLP_PATH = Join-Path $Venv 'Scripts\yt-dlp.exe'
} else {
  if (-not (Test-Path $YtDlp)) {
    Get-Binary 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe' $YtDlp
  } elseif ($Stale) {
    Write-Host 'Actualizando yt-dlp...' -ForegroundColor DarkGray
    Invoke-Native { & $YtDlp -U } 'yt-dlp -U'
  }
  New-Item -ItemType File -Force $Stamp | Out-Null
  $env:YTDLP_PATH = $YtDlp
}

$env:PORT = "$Port"
$server = Start-Process node -ArgumentList 'index.js' -WorkingDirectory $ServerDir -NoNewWindow -PassThru

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
      Write-Host '  (la URL del túnel cambia en cada arranque; vuelve a abrir el enlace o escanea el QR)' -ForegroundColor DarkGray
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
