param(
  [Parameter(Mandatory = $true)]
  [string]$WorkspaceFolder,

  [string]$UserId = "",

  [switch]$All
)

$ErrorActionPreference = "Stop"
$workspace = (Resolve-Path $WorkspaceFolder).Path
$nodeDir = Join-Path $workspace ".tools\node-v24.18.0-win-x64"
$dbPath = Join-Path $workspace "server\data\a5m2.sqlite"

if (-not (Test-Path $dbPath)) {
  Write-Warning "DB not found: $dbPath"
  exit 0
}

if (-not (Test-Path (Join-Path $nodeDir "node.exe"))) {
  throw "Bundled Node.js not found: $nodeDir\\node.exe"
}

$targetUserId = $UserId.Trim()
if ($All -or [string]::IsNullOrWhiteSpace($targetUserId)) {
  $script = @"
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync(process.argv[1]);
const result = db.prepare('DELETE FROM auth_sessions').run();
console.log('Cleared auth_sessions:', result.changes);
"@
  & "$nodeDir\node.exe" -e $script $dbPath
  exit 0
}

$script = @"
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync(process.argv[1]);
const userId = process.argv[2];
const result = db.prepare('DELETE FROM auth_sessions WHERE user_id = ?').run(userId);
console.log('Cleared auth_sessions for', userId + ':', result.changes);
"@
& "$nodeDir\node.exe" -e $script $dbPath $targetUserId
