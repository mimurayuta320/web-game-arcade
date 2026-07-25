param(
  [Parameter(Mandatory = $true)]
  [string]$WorkspaceFolder
)

$ErrorActionPreference = "Stop"
$workspace = (Resolve-Path $WorkspaceFolder).Path
$nodeDir = Join-Path $workspace ".tools\node-v24.18.0-win-x64"
$npm = Join-Path $nodeDir "npm.cmd"
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

# Start API on the same endpoint used by local play.
Start-Process -FilePath "powershell" -ArgumentList @(
  "-NoProfile",
  "-ExecutionPolicy", "Bypass",
  "-Command",
  "`$env:Path='$nodeDir;' + `$env:Path; `$env:PORT='4002'; `$env:HOST='127.0.0.1'; & '$npm' --prefix '$workspace\apps\api' run start:dev"
) -NoNewWindow

# Start share-server (room websocket + API proxy).
Start-Process -FilePath "powershell" -ArgumentList @(
  "-NoProfile",
  "-ExecutionPolicy", "Bypass",
  "-Command",
  "`$env:Path='$nodeDir;' + `$env:Path; `$env:SHARE_PORT='4273'; `$env:SHARE_WEB_APP_BASE='http://127.0.0.1:3000'; `$env:SHARE_CLOUD_API_BASE='http://127.0.0.1:4002'; & '$nodeDir\\node.exe' '$workspace\\server\\share-server.mjs'"
) -NoNewWindow

try {
  . (Join-Path $workspace "scripts\cloudflare\common.ps1")
  $cloudflared = Get-CloudflaredExe
  Start-Process -FilePath $cloudflared -ArgumentList @(
    "tunnel",
    "--url", "http://localhost:4273",
    "--no-autoupdate"
  ) -NoNewWindow
  Write-Host "Cloudflare quick tunnel started in this terminal session."
} catch {
  Write-Warning "cloudflared not found. Public URL is not available. Install with: winget install --id Cloudflare.cloudflared -e"
}

# Build and run Next in production mode for stable public delivery.
& $npm --prefix "$workspace\apps\web" run build
& $npm --prefix "$workspace\apps\web" run start -- --hostname 0.0.0.0 --port 3000
