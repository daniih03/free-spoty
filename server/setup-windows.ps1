<#
.SYNOPSIS
  Configuración única de Free-Spoty 0 anuncios en Windows.

.DESCRIPTION
  1. Instala Tailscale (si falta) e inicia sesión (se abre el navegador).
  2. Publica el servidor con Tailscale Funnel en una dirección HTTPS FIJA
     (https://<tu-pc>.<tailnet>.ts.net), accesible desde cualquier móvil.
  3. Registra una tarea de Windows que arranca el servidor en segundo plano al
     iniciar sesión (con reinicio automático y actualización diaria de yt-dlp).
  4. Arranca el servidor y muestra el enlace + QR para conectar cada
     dispositivo UNA sola vez.

  Para deshacerlo: setup-windows.ps1 -Uninstall

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File server\setup-windows.ps1
#>
param(
  [int]$Port = 3000,
  [string]$AppUrl = 'https://daniih03.github.io/free-spoty/',
  [switch]$Uninstall
)

$ErrorActionPreference = 'Stop'
$ServerDir = $PSScriptRoot
$TaskName = 'Free-Spoty Audio Engine'
$Ts = 'C:\Program Files\Tailscale\tailscale.exe'

function Step($Text) { Write-Host "`n▶ $Text" -ForegroundColor Red }

function Invoke-Tailscale {
  # Ejecuta tailscale.exe sin que PowerShell 5.1 trate su stderr como error fatal
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try { & $Ts @args 2>&1 | ForEach-Object { "$_" } } finally { $ErrorActionPreference = $prev }
}

if ($Uninstall) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
  if (Test-Path $Ts) { Invoke-Tailscale funnel reset | Out-Null }
  Get-CimInstance Win32_Process |
    Where-Object { ($_.Name -eq 'node.exe' -and $_.CommandLine -match 'index\.js') -or ($_.Name -eq 'python.exe' -and $_.CommandLine -match 'ytdlp_worker') -or ($_.Name -eq 'powershell.exe' -and $_.CommandLine -match 'start-windows\.ps1') } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  Write-Host 'Arranque automático y Funnel desactivados. (Tailscale sigue instalado; desinstálalo desde Windows si quieres.)'
  exit 0
}

# 1. Tailscale ----------------------------------------------------------------
Step 'Tailscale'
if (-not (Test-Path $Ts)) {
  Write-Host 'Instalando Tailscale (Windows pedirá permiso)...'
  winget install --id Tailscale.Tailscale -e --silent --accept-package-agreements --accept-source-agreements | Out-Null
  for ($i = 0; $i -lt 30 -and -not (Test-Path $Ts); $i++) { Start-Sleep 2 }
  if (-not (Test-Path $Ts)) { throw 'No se pudo instalar Tailscale. Instálalo desde https://tailscale.com/download y vuelve a ejecutar este script.' }
}

$status = (Invoke-Tailscale status --json) -join "`n" | ConvertFrom-Json -ErrorAction SilentlyContinue
if (-not $status -or $status.BackendState -ne 'Running') {
  Write-Host 'Inicia sesión en Tailscale en el navegador que se va a abrir (por ejemplo con tu cuenta de Google)...'
  Invoke-Tailscale up | ForEach-Object {
    Write-Host $_
    if ($_ -match '(https://login\.tailscale\.com/\S+)') { Start-Process $Matches[1] }
  }
  $status = (Invoke-Tailscale status --json) -join "`n" | ConvertFrom-Json
}
$DnsName = $status.Self.DNSName.TrimEnd('.')
Write-Host "Conectado como $DnsName"

# Sin esto, en ESTE PC la dirección *.ts.net resuelve a una IP interna de
# Tailscale (100.x) y Chrome/Edge bloquean que la web pública (GitHub Pages) la
# use ("Local Network Access"). Resolviendo por DNS público, el PC usa el mismo
# camino que el móvil.
Invoke-Tailscale set --accept-dns=false | Out-Null
Clear-DnsClientCache

# 2. Arranque automático + servidor -------------------------------------------
Step 'Arranque automático con Windows'
# conhost --headless: consola sin ventana. Con Windows Terminal como consola por
# defecto, un PowerShell "oculto" lanzado por el Programador recibe un cierre de
# consola (0xC000013A) y muere; así no pasa.
$action = New-ScheduledTaskAction -Execute 'conhost.exe' `
  -Argument "--headless powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$ServerDir\start-windows.ps1`" -Background -Port $Port"
# Al iniciar sesión + cada 5 min como autocuración (si el bucle vive, se ignora: IgnoreNew)
$trigger = @(
  (New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME),
  (New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 5))
)$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew `
  -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 1) -StartWhenAvailable
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings `
  -Description 'Servidor de audio sin anuncios para Free-Spoty' -Force | Out-Null
Start-ScheduledTask -TaskName $TaskName

Write-Host 'Arrancando el servidor (la primera vez instala yt-dlp, puede tardar un minuto)...'
$up = $false
for ($i = 0; $i -lt 90 -and -not $up; $i++) {
  Start-Sleep 2
  try { $up = (Invoke-RestMethod "http://localhost:$Port/health" -TimeoutSec 2).status -eq 'ok' } catch {}
}
if (-not $up) { throw "El servidor no arrancó. Revisa $ServerDir\bin\server.err.log" }
Write-Host 'Servidor activo.'

# 3. Dirección fija con Funnel --------------------------------------------------
Step 'Dirección HTTPS fija (Tailscale Funnel)'
Write-Host 'Si es la primera vez, Tailscale abrirá una página para activar Funnel: pulsa "Enable" y vuelve aquí.'
Invoke-Tailscale funnel --bg $Port | ForEach-Object {
  Write-Host $_
  if ($_ -match '(https://login\.tailscale\.com/\S+)') { Start-Process $Matches[1] }
}
$PublicUrl = "https://$DnsName"

$ok = $false
for ($i = 0; $i -lt 30 -and -not $ok; $i++) {
  try { $ok = (Invoke-RestMethod "$PublicUrl/health" -TimeoutSec 5).status -eq 'ok' } catch { Start-Sleep 3 }
}

# 4. Enlace + QR ----------------------------------------------------------------
$link = "$($AppUrl)?server=$PublicUrl"
Step 'Listo'
Write-Host "Dirección fija del servidor: $PublicUrl" -ForegroundColor White
if (-not $ok) { Write-Warning 'La dirección pública aún no responde (el certificado HTTPS puede tardar unos minutos la primera vez).' }
Write-Host "`nAbre este enlace UNA vez en cada dispositivo (PC, Android, iPhone):" -ForegroundColor White
Write-Host $link -ForegroundColor Yellow
Push-Location $ServerDir
node -e "require('qrcode-terminal').generate(process.argv[1], { small: true })" $link
Pop-Location
Write-Host 'El servidor arrancará solo cada vez que inicies sesión en Windows.' -ForegroundColor DarkGray
