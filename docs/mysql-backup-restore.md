# MySQL Backup and Restore

This project includes one-click PowerShell scripts for dump export and restore.

## Scripts

- Backup: scripts/backup-mysql.ps1
- Restore: scripts/restore-mysql.ps1

## Backup

Run from project root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\backup-mysql.ps1 -WorkspaceFolder .
```

Output:

- Folder: backups/
- File name: <db>_yyyyMMdd_HHmmss.sql

Connection info is read from apps/api/.env (DATABASE_URL).

## Restore (safe default)

By default, restore refuses writing into the default DB unless -Force is specified.

Restore latest dump into default DB:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\restore-mysql.ps1 -WorkspaceFolder . -Database web_game -Force -SkipCreateDatabase
```

Restore a specific dump file:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\restore-mysql.ps1 -WorkspaceFolder . -InputFile .\backups\web_game_20260730_015249.sql -Database web_game -Force -SkipCreateDatabase
```

## Notes

- If your DB user has no CREATE DATABASE privilege, pass -SkipCreateDatabase.
- The restore script imports SQL via MariaDB/MySQL client stdin.
- Required client command: mariadb or mysql.

## Daily Automation (Windows Task Scheduler)

Register a daily backup task (preview only):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\register-mysql-backup-task.ps1 -WorkspaceFolder . -StartTime 03:30
```

Apply registration:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\register-mysql-backup-task.ps1 -WorkspaceFolder . -StartTime 03:30 -Apply
```

Optional custom task name:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\register-mysql-backup-task.ps1 -WorkspaceFolder . -TaskName "WebGame-Backup-MySQL" -StartTime 02:00 -Apply
```
