# MySQL LAN共有クイックスタート（このPCをDBサーバ化）

最終更新: 2026-07-30
対象: Windows + MariaDB/MySQL + PlayFlow

この手順で、\"このPC\" の DB を他PCから利用できます。

- DBサーバPC（このPC）: `10.226.70.96`
- DBポート: `3306`
- DB名: `web_game`

## 1. このPC側の設定

### 1-1. DB待受確認（PowerShell）

```powershell
Get-NetTCPConnection -LocalPort 3306 -State Listen | Select-Object LocalAddress,LocalPort,OwningProcess
```

期待値:
- `0.0.0.0:3306` または このPCのIPで LISTEN している

### 1-2. ファイアウォール許可（PowerShellを管理者で実行）

```powershell
netsh advfirewall firewall add rule name="MySQL 3306 Inbound" dir=in action=allow protocol=TCP localport=3306
```

確認:

```powershell
netsh advfirewall firewall show rule name="MySQL 3306 Inbound"
```

### 1-3. 他PC接続用ユーザー作成（A5M2でSQL実行）

A5M2 で `root` など管理者権限ユーザーで接続し、次を実行してください。

```sql
CREATE USER IF NOT EXISTS 'web_game_user'@'10.226.70.%' IDENTIFIED BY 'PlayFlow2026Local';
GRANT ALL PRIVILEGES ON web_game.* TO 'web_game_user'@'10.226.70.%';
FLUSH PRIVILEGES;
SHOW GRANTS FOR 'web_game_user'@'10.226.70.%';
```

注意:
- `10.226.70.%` は同一LAN内（10.226.70.x）のみ許可します。
- どこからでも許可したい場合でも `%` は推奨しません。

## 2. 他PC側の設定

### 2-1. 疎通確認（PowerShell）

```powershell
Test-NetConnection 10.226.70.96 -Port 3306
```

期待値:
- `TcpTestSucceeded : True`

### 2-2. API接続先をこのPCに変更（apps/api/.env）

他PCの `apps/api/.env` を以下に変更:

```text
DATABASE_URL="mysql://web_game_user:PlayFlow2026Local@10.226.70.96:3306/web_game"
PORT=8787
```

### 2-3. API起動（他PC）

```powershell
$env:Path = "$PWD\.tools\node-v24.18.0-win-x64;" + $env:Path
.\.tools\node-v24.18.0-win-x64\npm.cmd --prefix apps/api run start:cloud
```

## 3. 動作確認

### 3-1. 他PCからDBテーブル確認（任意）

A5M2 か任意クライアントで接続先を以下にして接続:

- Host: `10.226.70.96`
- Port: `3306`
- User: `web_game_user`
- Password: `PlayFlow2026Local`
- Database: `web_game`

SQL:

```sql
SHOW TABLES;
```

### 3-2. 他PCからAPI確認

```powershell
curl.exe -s -i http://127.0.0.1:8787/scores
```

`HTTP/1.1 200 OK` が返ればOKです。

## 4. よくある詰まりポイント

- `TcpTestSucceeded : False`
  - このPCのファイアウォール未許可
  - ルーター/セグメントが異なる
  - DBプロセスが3306で待受していない

- `Access denied for user 'web_game_user'`
  - `@'10.226.70.%'` でユーザー作成されていない
  - パスワード不一致

- つながるがデータが見えない
  - 接続先が `127.0.0.1` になっている（他PC自身を見ている）
  - `.env` の `DATABASE_URL` が更新されていない

## 5. 切り戻し（アクセス停止）

このPCでA5M2から実行:

```sql
DROP USER IF EXISTS 'web_game_user'@'10.226.70.%';
FLUSH PRIVILEGES;
```

ファイアウォールルール削除（管理者PowerShell）:

```powershell
netsh advfirewall firewall delete rule name="MySQL 3306 Inbound"
```
