param(
  [Parameter(Mandatory = $true)]
  [string]$WorkspaceFolder
)

$ErrorActionPreference = "Stop"
$workspace = (Resolve-Path $WorkspaceFolder).Path
$nodeDir = Join-Path $WorkspaceFolder ".tools\node-v24.18.0-win-x64"
$npm = Join-Path $WorkspaceFolder ".tools\node-v24.18.0-win-x64\npm.cmd"
$env:Path = "$nodeDir;$env:Path"

# Start required backend services for online play.
Start-Process -FilePath $npm -ArgumentList "run", "cloud" -NoNewWindow

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

Start-Process -FilePath $npm -ArgumentList "run", "room" -NoNewWindow
Start-Process chrome "http://localhost:3000/"
& $npm run dev:web -- --hostname 0.0.0.0 --port 3000
