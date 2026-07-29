# PlayFlow 自宅PC MySQL構築チェックリスト（v0.1）

最終更新: 2026-07-29  
対象: Windows / PlayFlow (`apps/api`)

---

## 0. 事前確認

- [ ] MySQL が起動している
- [ ] リポジトリを最新化済み
- [ ] `apps/api` で `npm install` 済み

---

## 1. DB作成

MySQL クライアントで実行:

```sql
CREATE DATABASE IF NOT EXISTS web_game
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

- [ ] `web_game` が作成された

---

## 2. DBユーザー作成（推奨）

MySQL クライアントで実行:

```sql
CREATE USER IF NOT EXISTS 'web_game_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON web_game.* TO 'web_game_user'@'localhost';
FLUSH PRIVILEGES;
```

- [ ] `web_game_user` で接続できる

---

## 3. .env設定

`apps/api/.env` に設定:

```text
DATABASE_URL="mysql://web_game_user:your_strong_password@127.0.0.1:3306/web_game"
PORT=4000
```

- [ ] `DATABASE_URL` が自宅PCの実環境値になっている

---

## 4. Prisma適用

PowerShell:

```powershell
cd apps/api
npm run prisma:generate
npx prisma migrate deploy
npx prisma migrate status
```

- [ ] `prisma generate` が成功
- [ ] `migrate deploy` が成功
- [ ] `migrate status` に Pending がない

---

## 5. テーブル確認

MySQL クライアントで実行:

```sql
USE web_game;
SHOW TABLES;
```

最低限の確認対象:

- [ ] `users`
- [ ] `user_profiles`
- [ ] `auth_sessions`
- [ ] `scores`
- [ ] `match_records`
- [ ] `friends`
- [ ] `friend_requests`
- [ ] `friend_messages`
- [ ] `friend_chat_reads`
- [ ] `inquiries`

---

## 6. API起動確認

PowerShell:

```powershell
cd apps/api
npm run start:dev
```

- [ ] 起動ログに DB 接続エラーがない

---

## 7. 更新時の定例手順（毎回）

PowerShell:

```powershell
cd apps/api
npx prisma migrate deploy
npm run prisma:generate
```

- [ ] pull 後に上記2コマンドを実行した

---

## 8. よくあるエラー

### P1001: Can't reach database server

- [ ] MySQL が起動している
- [ ] `DATABASE_URL` のホスト/ポートが正しい
- [ ] ユーザー名/パスワードが正しい

### Access denied

- [ ] ユーザー作成済み
- [ ] `GRANT` 済み
- [ ] `FLUSH PRIVILEGES` 済み
