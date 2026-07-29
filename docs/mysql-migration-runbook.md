# PlayFlow MySQL移行手順書（Runbook v0.1）

最終更新: 2026-07-29
対象: apps/api

---

## 1. 目的

本書は、Prismaスキーマと migration を使って MySQL に初期テーブルを構築し、旧 `Score` テーブルから新 `scores` テーブルへ安全に移行する手順を定義する。

---

## 2. 前提条件

- MySQL が起動していること。
- `apps/api/.env` の `DATABASE_URL` が有効であること。
- 依存インストール済みであること（`npm install`）。

確認コマンド:

```powershell
cd apps/api
npm run prisma:generate
```

---

## 3. 反映対象

- Prismaスキーマ:
  - `apps/api/prisma/schema.prisma`
- 既存 migration:
  - `apps/api/prisma/migrations/20260723061254_init/migration.sql`
- 追加 migration:
  - `apps/api/prisma/migrations/20260729155106_phase1_mysql_foundation/migration.sql`

---

## 4. 初回適用手順（空DB向け）

1. APIディレクトリへ移動する。

```powershell
cd apps/api
```

2. migration を適用する。

```powershell
npx prisma migrate deploy
```

3. 生成クライアントを更新する。

```powershell
npm run prisma:generate
```

4. 適用結果を確認する。

```powershell
npx prisma migrate status
```

期待結果:
- `users`, `user_profiles`, `auth_sessions`, `scores`, `match_records` を含む全テーブルが作成される。

---

## 5. 既存DB移行手順（旧Scoreデータあり）

### 5.1 目的

旧 `Score` テーブル（カラム: `playerName`, `score`, `game`, `createdAt`）のデータを、新 `scores` テーブル（`player_name`, `created_at` など）へ移送する。

### 5.2 移送SQL

```sql
INSERT INTO scores (player_name, score, game, created_at)
SELECT
  playerName,
  score,
  game,
  CAST(UNIX_TIMESTAMP(createdAt) * 1000 AS SIGNED)
FROM Score;
```

### 5.3 件数確認

```sql
SELECT COUNT(*) AS old_count FROM Score;
SELECT COUNT(*) AS new_count FROM scores;
```

### 5.4 クリーンアップ（任意）

データ移送確認後、旧テーブルを削除する場合:

```sql
DROP TABLE Score;
```

---

## 6. ロールバック方針

- `prisma migrate deploy` は前方適用のみを前提とする。
- ロールバックが必要な場合は以下のいずれかを実施する。
  - 直近バックアップからDBを復旧する。
  - 逆方向SQLを別途作成して手動適用する。

---

## 7. トラブルシュート

- エラー: `P1001 Can't reach database server`
  - 原因: MySQL未起動、ポート不一致、接続文字列不正。
  - 対応: MySQL起動確認、`DATABASE_URL` 再確認。

- エラー: migration が途中で失敗
  - 対応: 失敗SQLを確認後、原因修正して再実行。
  - 必要なら `prisma migrate status` で状態を確認する。

---

## 8. 運用メモ

- 本リポジトリでは、`created_at` 系時刻をミリ秒エポック（BIGINT）で保持する。
- 初回移行はテーブル作成後に API 側の実装置換（SQLite -> Prisma）を段階適用する。
