param(
  [string]$WorkspaceFolder,
  [string]$OutputDir
)

$ErrorActionPreference = "Stop"

if (-not $WorkspaceFolder) {
  $WorkspaceFolder = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
} else {
  $WorkspaceFolder = (Resolve-Path $WorkspaceFolder).Path
}

$apiEnvPath = Join-Path $WorkspaceFolder "apps\api\.env"
if (-not (Test-Path $apiEnvPath)) {
  throw "apps/api/.env not found: $apiEnvPath"
}

if (-not $OutputDir) {
  $OutputDir = Join-Path $WorkspaceFolder "backups"
}
if (-not (Test-Path $OutputDir)) {
  New-Item -Path $OutputDir -ItemType Directory | Out-Null
}

function Get-EnvValue {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [Parameter(Mandatory = $true)]
    [string]$Key
  )

  $line = Get-Content -Path $Path |
    Where-Object { $_ -match "^\s*$Key\s*=" } |
    Select-Object -First 1

  if (-not $line) {
    return $null
  }

  $value = ($line -split "=", 2)[1].Trim()
  if ($value.StartsWith('"') -and $value.EndsWith('"')) {
    $value = $value.Substring(1, $value.Length - 2)
  }
  return $value
}

function Get-DumpExecutable {
  $candidates = @(
    "mariadb-dump",
    "mysqldump",
    "C:\Program Files\MariaDB 12.3\bin\mariadb-dump.exe",
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe"
  )

  foreach ($name in $candidates) {
    try {
      $cmd = Get-Command $name -ErrorAction Stop
      if ($cmd -and $cmd.Source) {
        return $cmd.Source
      }
    } catch {
      if (Test-Path $name) {
        return $name
      }
    }
  }

  throw "mariadb-dump or mysqldump was not found. Install a MariaDB/MySQL client."
}

$databaseUrl = Get-EnvValue -Path $apiEnvPath -Key "DATABASE_URL"
if (-not $databaseUrl) {
  throw "DATABASE_URL is missing in apps/api/.env."
}

$uri = [Uri]$databaseUrl
if ($uri.Scheme -ne "mysql") {
  throw "DATABASE_URL scheme must be mysql, got: $($uri.Scheme)"
}

$dbHost = if ($uri.Host) { $uri.Host } else { "127.0.0.1" }
$port = if ($uri.Port -gt 0) { $uri.Port } else { 3306 }
$username = [Uri]::UnescapeDataString($uri.UserInfo.Split(':')[0])
$password = ""
if ($uri.UserInfo.Contains(':')) {
  $password = [Uri]::UnescapeDataString($uri.UserInfo.Split(':', 2)[1])
}
$dbName = $uri.AbsolutePath.Trim('/')

if (-not $username -or -not $dbName) {
  throw "Could not parse username or database name from DATABASE_URL."
}

$dumpExe = Get-DumpExecutable
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outFile = Join-Path $OutputDir ("{0}_{1}.sql" -f $dbName, $timestamp)

$args = @(
  "-h", $dbHost,
  "-P", "$port",
  "-u", $username,
  "-p$password",
  "--databases", $dbName,
  "--routines",
  "--events",
  "--triggers",
  "--single-transaction",
  "--quick",
  "--result-file", $outFile
)

& $dumpExe @args

if (-not (Test-Path $outFile)) {
  throw "Backup file was not created."
}

$size = (Get-Item $outFile).Length
Write-Host "Backup completed: $outFile"
Write-Host "Size: $size bytes"
