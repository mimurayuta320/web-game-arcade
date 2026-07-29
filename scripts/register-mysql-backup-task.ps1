param(
  [string]$WorkspaceFolder,
  [string]$TaskName = "WebGame-MySQL-Backup-Daily",
  [string]$StartTime = "03:30",
  [switch]$Apply
)

$ErrorActionPreference = "Stop"

if (-not $WorkspaceFolder) {
  $WorkspaceFolder = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
} else {
  $WorkspaceFolder = (Resolve-Path $WorkspaceFolder).Path
}

$backupScript = Join-Path $WorkspaceFolder "scripts\backup-mysql.ps1"
if (-not (Test-Path $backupScript)) {
  throw "Backup script not found: $backupScript"
}

$timeParts = $StartTime.Split(':')
if ($timeParts.Length -ne 2) {
  throw "StartTime must be HH:mm format. Example: 03:30"
}

$hour = [int]$timeParts[0]
$minute = [int]$timeParts[1]
if ($hour -lt 0 -or $hour -gt 23 -or $minute -lt 0 -or $minute -gt 59) {
  throw "StartTime is out of range. Use 00:00-23:59"
}

$startBoundary = (Get-Date).Date.AddHours($hour).AddMinutes($minute)
$actionArgs = "-NoProfile -ExecutionPolicy Bypass -File `"$backupScript`" -WorkspaceFolder `"$WorkspaceFolder`""

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $actionArgs
$trigger = New-ScheduledTaskTrigger -Daily -At $startBoundary
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

if (-not $Apply) {
  Write-Host "Preview only (no changes)."
  Write-Host "TaskName: $TaskName"
  Write-Host "Time: $StartTime"
  Write-Host "Command: powershell.exe $actionArgs"
  Write-Host ""
  Write-Host "To register, run with -Apply"
  exit 0
}

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null

Write-Host "Scheduled task registered: $TaskName"
Write-Host "Daily at: $StartTime"
