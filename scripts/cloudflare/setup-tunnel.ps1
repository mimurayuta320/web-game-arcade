param(
  [Parameter(Mandatory = $true)]
  [string]$Hostname,
  [string]$TunnelName = "web-game-share",
  [int]$LocalPort = 4173
)

$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

$cloudflared = Get-CloudflaredExe
$projectRoot = Get-ProjectRoot
$configDir = Join-Path $projectRoot ".cloudflared"
$configPath = Join-Path $configDir "config.yml"
$homeConfigDir = Join-Path $env:USERPROFILE ".cloudflared"
$certPath = Join-Path $homeConfigDir "cert.pem"

if (!(Test-Path $certPath)) {
  Write-Host "Starting Cloudflare login (browser opens)..."
  & $cloudflared tunnel login
}

$listJson = & $cloudflared tunnel list --output json
$tunnels = @()
if ($listJson) {
  $tunnels = $listJson | ConvertFrom-Json
}

$tunnel = $tunnels | Where-Object { $_.name -eq $TunnelName } | Select-Object -First 1
if (-not $tunnel) {
  Write-Host "Creating tunnel '$TunnelName'..."
  & $cloudflared tunnel create $TunnelName | Out-Host
  $listJson = & $cloudflared tunnel list --output json
  $tunnels = $listJson | ConvertFrom-Json
  $tunnel = $tunnels | Where-Object { $_.name -eq $TunnelName } | Select-Object -First 1
}

if (-not $tunnel) {
  throw "Tunnel creation failed."
}

Write-Host "Configuring DNS route: $Hostname"
& $cloudflared tunnel route dns $TunnelName $Hostname | Out-Host

if (!(Test-Path $configDir)) {
  New-Item -Path $configDir -ItemType Directory | Out-Null
}

$credentialsFile = Join-Path $homeConfigDir ("{0}.json" -f $tunnel.id)
$yaml = @(
  "tunnel: $($tunnel.id)",
  "credentials-file: '$credentialsFile'",
  "ingress:",
  "  - hostname: $Hostname",
  "    service: http://127.0.0.1:$LocalPort",
  "  - service: http_status:404"
) -join "`n"

Set-Content -Path $configPath -Value $yaml -Encoding UTF8

Write-Host ""
Write-Host "Setup complete"
Write-Host "- Tunnel Name: $TunnelName"
Write-Host "- Hostname:    $Hostname"
Write-Host "- Config:      $configPath"
Write-Host ""
Write-Host "Next commands:"
Write-Host "1) & '.\\.tools\\node-v24.18.0-win-x64\\npm.cmd' run share"
Write-Host "2) powershell -ExecutionPolicy Bypass -File .\\scripts\\cloudflare\\run-tunnel.ps1 -TunnelName '$TunnelName'"
