param(
  [string]$TunnelName = "web-game-share"
)

$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

$cloudflared = Get-CloudflaredExe
$projectRoot = Get-ProjectRoot
$configPath = Join-Path $projectRoot ".cloudflared\config.yml"

if (!(Test-Path $configPath)) {
  throw "config.yml not found. Run scripts/cloudflare/setup-tunnel.ps1 first."
}

& $cloudflared tunnel --config $configPath run $TunnelName
