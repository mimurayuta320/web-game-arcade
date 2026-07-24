param(
  [Parameter(Mandatory = $true)]
  [string]$WorkspaceFolder
)

$ErrorActionPreference = "Stop"
$workspace = (Resolve-Path $WorkspaceFolder).Path
$nodeDir = Join-Path $workspace ".tools\node-v24.18.0-win-x64"
$npm = Join-Path $nodeDir "npm.cmd"
$env:Path = "$nodeDir;$env:Path"

# Start API on the same endpoint used by local play.
Start-Process -FilePath "powershell" -ArgumentList @(
  "-NoProfile",
  "-ExecutionPolicy", "Bypass",
  "-Command",
  "`$env:Path='$nodeDir;' + `$env:Path; `$env:PORT='4002'; `$env:HOST='127.0.0.1'; & '$npm' --prefix '$workspace\apps\api' run start:dev"
)

# Start share-server (room websocket + API proxy).
Start-Process -FilePath "powershell" -ArgumentList @(
  "-NoProfile",
  "-ExecutionPolicy", "Bypass",
  "-Command",
  "`$env:Path='$nodeDir;' + `$env:Path; `$env:SHARE_PORT='4273'; `$env:SHARE_WEB_APP_BASE='http://127.0.0.1:3000'; `$env:SHARE_CLOUD_API_BASE='http://127.0.0.1:4002'; & '$nodeDir\\node.exe' '$workspace\\server\\share-server.mjs'"
)

try {
  . (Join-Path $workspace "scripts\cloudflare\common.ps1")
  $cloudflared = Get-CloudflaredExe
  Start-Process -FilePath "powershell" -ArgumentList @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-Command",
    "& '$cloudflared' tunnel --url http://localhost:4273 --no-autoupdate"
  )
  Write-Host "Cloudflare quick tunnel started in a separate window."
} catch {
  Write-Warning "cloudflared not found. Public URL is not available. Install with: winget install --id Cloudflare.cloudflared -e"
}

# Build and run Next in production mode for stable public delivery.
& $npm --prefix "$workspace\apps\web" run build
& $npm --prefix "$workspace\apps\web" run start -- --hostname 0.0.0.0 --port 3000
