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
Start-Process -FilePath $npm -ArgumentList "run", "cloud"

try {
  . (Join-Path $workspace "scripts\cloudflare\common.ps1")
  $cloudflared = Get-CloudflaredExe
  Start-Process -FilePath "powershell" -ArgumentList @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-Command",
    "& '$cloudflared' tunnel --url http://localhost:3000 --no-autoupdate"
  )
  Write-Host "Cloudflare quick tunnel started in a separate window."
} catch {
  Write-Warning "cloudflared not found. Public URL is not available. Install with: winget install --id Cloudflare.cloudflared -e"
}

Start-Process -FilePath $npm -ArgumentList "run", "room"
Start-Process chrome "http://localhost:3000/"
& $npm run dev:web -- --hostname 0.0.0.0 --port 3000
