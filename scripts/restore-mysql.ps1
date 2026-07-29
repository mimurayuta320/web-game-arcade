param(
  [string]$WorkspaceFolder,
  [string]$InputFile,
  [string]$Database,
  [switch]$Force,
  [switch]$SkipCreateDatabase
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

function Get-ClientExecutable {
  $candidates = @(
    "mariadb",
    "mysql",
    "C:\Program Files\MariaDB 12.3\bin\mariadb.exe",
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
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

  throw "mariadb/mysql client was not found. Install a MariaDB/MySQL client."
}

function Resolve-InputDumpFile {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Workspace,
    [string]$ExplicitFile
  )

  if ($ExplicitFile) {
    $resolved = Resolve-Path $ExplicitFile -ErrorAction Stop
    return $resolved.Path
  }

  $backupDir = Join-Path $Workspace "backups"
  if (-not (Test-Path $backupDir)) {
    throw "Backup directory not found: $backupDir"
  }

  $latest = Get-ChildItem -Path $backupDir -Filter "*.sql" -File |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if (-not $latest) {
    throw "No .sql backup file found in: $backupDir"
  }

  return $latest.FullName
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
$defaultDbName = $uri.AbsolutePath.Trim('/')
$targetDb = if ($Database) { $Database.Trim() } else { $defaultDbName }

if (-not $username -or -not $targetDb) {
  throw "Could not parse username or target database name."
}

$inputDump = Resolve-InputDumpFile -Workspace $WorkspaceFolder -ExplicitFile $InputFile
if (-not (Test-Path $inputDump)) {
  throw "Input file not found: $inputDump"
}

if (-not $Force -and $targetDb -eq $defaultDbName) {
  throw "Refusing to restore into default DB without -Force. Target: $targetDb"
}

$clientExe = Get-ClientExecutable

$baseArgs = @(
  "-h", $dbHost,
  "-P", "$port",
  "-u", $username,
  "-p$password"
)

# Ensure target DB exists before import unless explicitly skipped.
if (-not $SkipCreateDatabase) {
  $createSql = "CREATE DATABASE IF NOT EXISTS ``$targetDb`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  & $clientExe @baseArgs --execute=$createSql
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to create/ensure target database '$targetDb'. If DB already exists and user has no CREATE privilege, retry with -SkipCreateDatabase."
  }
}

# Import SQL dump into target DB.
$importArgs = @($baseArgs + @($targetDb))
Get-Content -Path $inputDump -Raw | & $clientExe @importArgs
if ($LASTEXITCODE -ne 0) {
  throw "Restore failed while importing SQL into '$targetDb'."
}

Write-Host "Restore completed."
Write-Host "Input: $inputDump"
Write-Host "Target DB: $targetDb"
