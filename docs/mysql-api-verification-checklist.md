# PlayFlow MySQL運用確認チェックリスト（API実動確認）

最終更新: 2026-07-30  
対象: Windows / PlayFlow (`apps/api`) / A5:SQL Mk-2

---

## 0. 前提

- [ ] MariaDB/MySQL が起動している
- [ ] `apps/api/.env` の `DATABASE_URL` が MySQL を指している
- [ ] `web_game` データベースが存在する

---

## 1. API起動

PowerShell:

```powershell
$env:Path = "<repo>\\.tools\\node-v24.18.0-win-x64;" + $env:Path
cd <repo>\\apps\\api
npm.cmd run start:dev
```

期待結果:

- [ ] `Nest application successfully started` が出る
- [ ] ポート競合エラー（`EADDRINUSE`）が出ない

補足:

- デフォルトは `PORT=4000`

---

## 2. ヘルス確認

PowerShell:

```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:4000/scores" -UseBasicParsing
```

- [ ] `StatusCode: 200` を確認

---

## 3. ユーザー登録（DB書き込み確認）

PowerShell:

```powershell
$uid = "mysql_check_$(Get-Date -Format 'yyyyMMddHHmmss')"
$body = @{ userId = $uid; password = "TestPass1234" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://127.0.0.1:4000/api/auth/register" -Method Post -ContentType "application/json" -Body $body
$uid
```

- [ ] APIが `ok: true` を返す
- [ ] 実行した `userId` を控える

---

## 4. A5M2で users を確認

A5M2 SQL:

```sql
USE web_game;
SELECT COUNT(*) AS users_count FROM users;
SELECT user_id, created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;
```

- [ ] `users_count` が増えている
- [ ] 直前に登録した `userId` が見える

---

## 5. 問い合わせ送信（DB書き込み確認）

PowerShell:

```powershell
$uid = "inq_check_$(Get-Date -Format 'yyyyMMddHHmmss')"
$reg = Invoke-RestMethod -Uri "http://127.0.0.1:4000/api/auth/register" -Method Post -ContentType "application/json" -Body (@{ userId = $uid; password = "TestPass1234" } | ConvertTo-Json)

$inqBody = @{
  userId = $uid
  password = "TestPass1234"
  sessionId = $reg.sessionId
  name = "mysql-check"
  message = "mysql inquiry route check message"
  url = "http://localhost/test"
  lang = "ja"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:4000/api/inquiry/submit" -Method Post -ContentType "application/json" -Body $inqBody
```

- [ ] APIが `ok: true` を返す
- [ ] `id` が返る

---

## 6. A5M2で inquiries を確認

A5M2 SQL:

```sql
USE web_game;
SELECT COUNT(*) AS inquiries_count FROM inquiries;
SELECT id, user_id, name, submitted_at
FROM inquiries
ORDER BY submitted_at DESC
LIMIT 10;
```

- [ ] `inquiries_count` が増えている
- [ ] 直前送信データが見える

---

## 7. 追加推奨チェック

- [ ] `/api/auth/login` が成功する
- [ ] `/api/profile/save` の更新が `user_profiles` に反映される
- [ ] `/scores` POSTで `scores` に反映される

---

## 8. トラブル時の即確認

### 500 Internal Server Error

- [ ] APIログの直近スタックトレースを確認
- [ ] `DATABASE_URL` のユーザー/パスワード/DB名を再確認
- [ ] ポート競合時は `netstat -ano | findstr :4000` で占有PIDを特定

### A5M2に反映されない

- [ ] 接続先DBが `web_game` か確認
- [ ] APIの保存先ポートが正しいか確認（`4000`）
- [ ] 古いAPIプロセスが残っていないか確認
