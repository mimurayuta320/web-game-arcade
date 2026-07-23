param(
  [Parameter(Mandatory = $true)]
  [string]$WorkspaceFolder
)

$ErrorActionPreference = "Stop"
$workspace = (Resolve-Path $WorkspaceFolder).Path
$nodeDir = Join-Path $workspace ".tools\node-v24.18.0-win-x64"
$npm = Join-Path $nodeDir "npm.cmd"
$env:Path = "$nodeDir;$env:Path"

# Start Nest API on a fixed local port for Next rewrite proxy.
Start-Process -FilePath "powershell" -ArgumentList @(
  "-NoProfile",
  "-ExecutionPolicy", "Bypass",
  "-Command",
  "`$env:PORT='4002'; `$env:HOST='127.0.0.1'; & '$npm' --prefix '$workspace\apps\api' run start:dev"
)

# Run Next in the foreground and proxy API calls to the Nest API above.
$env:NEST_API_ORIGIN = "http://127.0.0.1:4002"
& $npm --prefix "$workspace\apps\web" run dev
