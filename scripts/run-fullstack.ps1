param(
  [Parameter(Mandatory = $true)]
  [string]$WorkspaceFolder
)

$ErrorActionPreference = "Stop"
$workspace = (Resolve-Path $WorkspaceFolder).Path
$nodeDir = Join-Path $WorkspaceFolder ".tools\node-v24.18.0-win-x64"
$npm = Join-Path $WorkspaceFolder ".tools\node-v24.18.0-win-x64\npm.cmd"
$env:Path = "$nodeDir;$env:Path"

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
$nextCli = Join-Path $workspace "apps\web\node_modules\next\dist\bin\next"
& "$nodeDir\node.exe" $nextCli dev --hostname 0.0.0.0 --port 3000
