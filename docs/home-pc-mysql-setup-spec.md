# PlayFlow 自宅PC MySQL構築仕様書（v0.1）

最終更新: 2026-07-29  
対象環境: Windows  
対象プロジェクト: PlayFlow（apps/api）

---

## 1. 目的

本書は、自宅PC上で PlayFlow 用 MySQL データベースを新規作成し、
Prisma マイグレーションを適用して API が利用できる状態まで構築するための仕様を定義する。

---

## 2. ゴール（完了条件）

以下を満たした時点を完了とする。

1. MySQL サーバーが起動している。
2. `web_game` データベースが作成されている。
3. `apps/api/.env` の `DATABASE_URL` が自宅PCの接続情報に設定されている。
4. Prisma migration が適用済みである。
5. `users`, `user_profiles`, `auth_sessions`, `scores`, `match_records` を含むテーブルが存在する。
6. API 起動時に DB 接続エラーが発生しない。

---

## 3. 前提条件

1. Git リポジトリが取得済みである。
2. Node.js / npm が利用可能である。
3. `apps/api` 配下で `npm install` 済みである。
4. MySQL 8 系を利用する（推奨）。

---

## 4. 構成方針

### 4.1 データベース名

- DB 名: `web_game`

### 4.2 文字コード

- 文字コード: `utf8mb4`
- 照合順序: `utf8mb4_unicode_ci`（推奨）

### 4.3 接続先

- ホスト: `127.0.0.1`
- ポート: `3306`（既定）

ポート競合時は別ポートを使用してよい（例: `3307`）。

---

## 5. セキュリティ方針

1. 本番用パスワードと同等の文字列を使い回さない。
2. `root` の常用接続を避け、専用ユーザーを作成する。
3. `.env` は Git 管理しない（既存ルールに従う）。
4. DB を外部公開しない（ローカル利用のみ）。

推奨ユーザー:

- ユーザー名: `web_game_user`
- 権限: `web_game` データベースへの必要権限のみ

---

## 6. 構築手順仕様

### 6.1 MySQL 起動

MySQL サービスが起動済みであることを確認する。

### 6.2 データベース作成

`web_game` データベースを作成する。

SQL 仕様:

```sql
CREATE DATABASE IF NOT EXISTS web_game
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### 6.3 専用ユーザー作成（推奨）

SQL 仕様（例）:

```sql
CREATE USER IF NOT EXISTS 'web_game_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON web_game.* TO 'web_game_user'@'localhost';
FLUSH PRIVILEGES;
```

### 6.4 接続文字列設定

`apps/api/.env` の `DATABASE_URL` を設定する。

形式:

```text
DATABASE_URL="mysql://<user>:<password>@127.0.0.1:<port>/web_game"
```

例（3306）:

```text
DATABASE_URL="mysql://web_game_user:your_strong_password@127.0.0.1:3306/web_game"
```

### 6.5 Prisma 生成と migration 適用

`apps/api` ディレクトリで以下を実行する。

```powershell
npm run prisma:generate
npx prisma migrate deploy
```

補足:

- DB が空の場合は初期テーブルが作成される。
- 既適用 migration は再適用されない。

---

## 7. 期待テーブル（最低限）

以下テーブルが存在すること。

1. `users`
2. `user_profiles`
3. `auth_sessions`
4. `scores`
5. `match_records`
6. `friends`
7. `friend_requests`
8. `friend_messages`
9. `friend_chat_reads`
10. `inquiries`

---

## 8. 動作確認仕様

### 8.1 migration 状態確認

```powershell
npx prisma migrate status
```

期待値:

- Pending migration がない。
- Database が正常接続される。

### 8.2 API 起動確認

```powershell
npm run start:dev
```

期待値:

- 起動時に DB 接続エラー（P1001 など）が出ない。
- `/api/auth/register` への登録処理が成功する。

---

## 9. トラブルシュート仕様

### 9.1 P1001（DB 接続不可）

確認項目:

1. MySQL サービス起動状態
2. `DATABASE_URL` のホスト/ポート
3. ユーザー名・パスワード
4. ファイアウォール設定

### 9.2 認証エラー

確認項目:

1. DBユーザー作成の成否
2. 権限付与（GRANT）の有無
3. パスワードの誤記

### 9.3 migration 適用失敗

確認項目:

1. 既存テーブル競合（旧 `Score` テーブル含む）
2. SQL 実行権限
3. Prisma schema と migration ファイルの整合

---

## 10. 運用仕様（自宅PC）

1. リポジトリ更新後は `npx prisma migrate deploy` を実行する。
2. 続けて `npm run prisma:generate` を実行する。
3. スキーマ変更がない場合は DB 変更は発生しない。
4. 定期バックアップを実施する（最低週1回）。

推奨バックアップ方式:

- `mysqldump` による `web_game` 全体ダンプ

---

## 11. 関連ドキュメント

1. `docs/mysql-data-design.md`
2. `docs/mysql-migration-runbook.md`
3. `apps/api/prisma/schema.prisma`
4. `docs/home-pc-mysql-setup-checklist.md`
