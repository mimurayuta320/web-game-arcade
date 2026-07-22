param(
  [Parameter(Mandatory = $true)]
  [string]$WorkspaceFolder
)

$nodeCmd = Join-Path $WorkspaceFolder ".tools\node-v24.18.0-win-x64\npm.cmd"

Start-Process powershell -ArgumentList @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-Command",
  "& '$nodeCmd' run room"
)

Start-Process chrome "http://localhost:5173/"
& $nodeCmd run dev
