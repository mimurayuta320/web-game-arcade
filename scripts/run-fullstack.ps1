param(
  [Parameter(Mandatory = $true)]
  [string]$WorkspaceFolder
)

$ErrorActionPreference = "Stop"
$workspace = (Resolve-Path $WorkspaceFolder).Path
$nodeDir = Join-Path $workspace ".tools\node-v24.18.0-win-x64"
$npm = Join-Path $nodeDir "npm.cmd"
$env:Path = "$nodeDir;$env:Path"

function Stop-ListeningProcessOnPort {
  param(
    [Parameter(Mandatory = $true)]
    [int]$Port
  )

  $lines = @(netstat -ano | Select-String ":$Port\s" | Select-String "LISTENING")
  if ($lines.Count -eq 0) {
    return
  }

  $pids = @()
  foreach ($line in $lines) {
    $parts = ($line.ToString() -split "\s+") | Where-Object { $_ -ne "" }
    if ($parts.Length -gt 0) {
      $procId = [int]$parts[$parts.Length - 1]
      if ($procId -gt 0) {
        $pids += $procId
      }
    }
  }

  foreach ($procId in ($pids | Sort-Object -Unique)) {
    try {
      taskkill /PID $procId /T /F | Out-Null
    } catch {
      # ignore process race
    }
  }
}

# Avoid startup crashes when previous dev servers are still running.
Stop-ListeningProcessOnPort -Port 3000
Stop-ListeningProcessOnPort -Port 8787
Stop-ListeningProcessOnPort -Port 8788

# Clear stale auth sessions so login buttons do not get stuck behind old server-side sessions.
$dbPath = Join-Path $workspace "server\data\a5m2.sqlite"
if (Test-Path $dbPath) {
  $clearSessionsScript = @"
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync(process.argv[1]);
const result = db.prepare('DELETE FROM auth_sessions').run();
console.log('Cleared auth_sessions:', result.changes);
"@
  & "$nodeDir\node.exe" -e $clearSessionsScript $dbPath
}

# Start required backend services for online play.
Start-Process -FilePath $npm -ArgumentList "run", "cloud" -NoNewWindow
Start-Process -FilePath $npm -ArgumentList "run", "room" -NoNewWindow

try {
  . (Join-Path $workspace "scripts\cloudflare\common.ps1")
  $cloudflared = Get-CloudflaredExe
  Start-Process -FilePath $cloudflared -ArgumentList @(
    "tunnel",
    "--url", "http://localhost:3000",
    "--no-autoupdate"
  ) -NoNewWindow
  Write-Host "Cloudflare quick tunnel started in this terminal session."
} catch {
  Write-Warning "cloudflared not found. Public URL is not available. Install with: winget install --id Cloudflare.cloudflared -e"
}

Start-Process chrome "http://localhost:3000/"
Push-Location (Join-Path $workspace "apps\web")
try {
  $nextCli = Join-Path $workspace "apps\web\node_modules\next\dist\bin\next"
  & "$nodeDir\node.exe" $nextCli dev --hostname 0.0.0.0 --port 3000
} finally {
  Pop-Location
}
