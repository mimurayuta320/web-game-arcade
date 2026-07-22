param(
  [Parameter(Mandatory = $true)]
  [string]$WorkspaceFolder
)

$ErrorActionPreference = "Stop"
$nodeDir = Join-Path $WorkspaceFolder ".tools\node-v24.18.0-win-x64"
$npm = Join-Path $WorkspaceFolder ".tools\node-v24.18.0-win-x64\npm.cmd"
$env:Path = "$nodeDir;$env:Path"

Start-Process chrome "http://localhost:5173/"
& $npm run dev -- --strictPort
