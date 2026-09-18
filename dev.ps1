param(
  [switch]$Stop,
  [switch]$SkipInstall,
  [switch]$BackendOnly,
  [switch]$FrontendOnly,
  [switch]$NoWait
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $Root "Backend"
$FrontendDir = Join-Path $Root "Frontend"
$LogDir = Join-Path $Root ".logs"
$BackendPort = 5000
$FrontendPort = 5173

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

function Get-PortPids($port) {
  try {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    return ($conns | Select-Object -ExpandProperty OwningProcess -Unique)
  } catch { return @() }
}

function Stop-Port($port) {
  $pids = Get-PortPids $port
  foreach ($id in $pids) {
    try { Stop-Process -Id $id -Force -ErrorAction SilentlyContinue; Write-Host "Killed PID $id on port $port" } catch {}
  }
}

function Wait-Http($url, $timeoutSec, $label) {
  $deadline = (Get-Date).AddSeconds($timeoutSec)
  while ((Get-Date) -lt $deadline) {
    try {
      $r = Invoke-WebRequest -Uri $url -TimeoutSec 5 -UseBasicParsing
      if ($r.StatusCode -lt 500) { Write-Host "$label UP: $url (HTTP $($r.StatusCode))" -ForegroundColor Green; return $true }
    } catch {
      if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -lt 500) {
        Write-Host "$label UP: $url" -ForegroundColor Green; return $true
      }
    }
    Start-Sleep -Seconds 2
  }
  Write-Host "$label NOT reachable: $url after ${timeoutSec}s" -ForegroundColor Yellow
  return $false
}

if ($Stop) {
  Write-Step "Stopping dev servers (ports $BackendPort, $FrontendPort)"
  Stop-Port $BackendPort
  Stop-Port $FrontendPort
  Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*node*" } | Out-Null
  Write-Host "Done. (Run without -Stop to start again.)"
  exit 0
}

Write-Step "Checks: node / npm"
node -v
npm -v
if (-not (Test-Path $BackendDir)) { throw "Missing $BackendDir" }
if (-not (Test-Path $FrontendDir)) { throw "Missing $FrontendDir" }
New-Item -ItemType Directory -Path $LogDir -Force | Out-Null

if (-not $SkipInstall) {
  if (-not $FrontendOnly) {
    Write-Step "Backend: npm install"
    if (-not (Test-Path (Join-Path $BackendDir "node_modules"))) {
      & npm --prefix $BackendDir install
    } else {
      Write-Host "Backend node_modules exists, skipping full install (use npm --prefix Backend install to force)."
    }
  }
  if (-not $BackendOnly) {
    Write-Step "Frontend: npm install"
    if (-not (Test-Path (Join-Path $FrontendDir "node_modules"))) {
      & npm --prefix $FrontendDir install
    } else {
      Write-Host "Frontend node_modules exists, skipping full install."
    }
  }
}

Write-Step "Freeing ports $BackendPort / $FrontendPort"
if (-not $FrontendOnly) { Stop-Port $BackendPort }
if (-not $BackendOnly) { Stop-Port $FrontendPort }
Start-Sleep -Seconds 2

$backendLog = Join-Path $LogDir "backend-out.log"
$backendErr = Join-Path $LogDir "backend-err.log"
$frontendLog = Join-Path $LogDir "frontend-out.log"
$frontendErr = Join-Path $LogDir "frontend-err.log"

if (-not $FrontendOnly) {
  Write-Step "Starting backend (port $BackendPort): node server.js"
  Start-Process -FilePath "node" -ArgumentList "server.js" `
    -WorkingDirectory $BackendDir `
    -RedirectStandardOutput $backendLog -RedirectStandardError $backendErr -NoNewWindow
}

if (-not $BackendOnly) {
  Write-Step "Starting frontend (port $FrontendPort): npm run dev"
  Start-Process -FilePath "npm.cmd" `
    -ArgumentList "run", "dev", "--", "--host", "--port", $FrontendPort `
    -WorkingDirectory $FrontendDir `
    -RedirectStandardOutput $frontendLog -RedirectStandardError $frontendErr -NoNewWindow
}

Write-Step "Health checks (60s each)"
$okB = $true; $okF = $true
if (-not $FrontendOnly) { $okB = Wait-Http "http://localhost:$BackendPort/" 60 "Backend" }
if (-not $BackendOnly) { $okF = Wait-Http "http://localhost:$FrontendPort/" 60 "Frontend" }

Write-Host ""
Write-Host "Backend : http://localhost:$BackendPort/  log: $backendLog" -ForegroundColor Gray
Write-Host "Frontend: http://localhost:$FrontendPort/  log: $frontendLog" -ForegroundColor Gray
Write-Host "API base: http://localhost:$BackendPort/api (see Frontend/src/services/api.js)" -ForegroundColor Gray
if (-not $okB -and -not $FrontendOnly) {
  Write-Host "`nBackend not up. Check $backendErr and Backend/.env MONGO_URI (DB retry: DB_RETRIES/DB_RETRY_DELAY_MS)." -ForegroundColor Red
}
Write-Host "`nStop with:  .\dev.ps1 -Stop" -ForegroundColor Gray

if (-not $NoWait) {
  Write-Step "Tailing logs (Ctrl+C to stop tailing; servers keep running)"
  Get-Content -Path $backendLog, $frontendLog -Wait -ErrorAction SilentlyContinue
}
