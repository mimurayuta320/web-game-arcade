# Server Startup Guide

このファイルは、サーバー起動系コマンドだけをまとめたガイドです。

## 1) 最短で共有対戦を始める（推奨）

前提: プロジェクトのルートフォルダで実行

1. 依存インストール（初回のみ）

npm install

2. 共有サーバー起動

npm run share

3. 表示されたURLを相手に共有

例:
http://<このPCのIP>:4173/#NeonBoardArcade

## 2) 開発向けに分離起動する

ターミナルを3つ開いて、それぞれ実行します。

ターミナルA（クラウド保存API）

npm run cloud

ターミナルB（ルームWebSocket）

npm run room

ターミナルC（フロント開発サーバー）

npm run dev

アクセス例:
http://<このPCのIP>:5173/#NeonBoardArcade

## 2.5) 本番稼働中でもテスト環境を並行起動する

本番ポートと衝突しないテスト専用ポートを使います。

ターミナルA（テスト用クラウド保存API: 18787, DB分離）

npm run cloud:test

ターミナルB（テスト用ルームWebSocket: 18788）

npm run room:test

ターミナルC（テスト用フロント: 5174）

npm run dev:test

アクセス例（同一PC）:
http://localhost:5174/?cloudApi=http://localhost:18787&roomServer=ws://localhost:18788#NeonBoardArcade

補足:
- `cloudApi` はクラウドAPI接続先を固定するクエリです（初回アクセス時にlocalStorageへ保存）。
- テストDBは `server/data/a5m2.test.sqlite` を使用し、本番DBと分離されます。

共有モードをテストしたい場合（4174 / テスト用JSON保存）:

npm run share:test

## 3) グローバルNode.jsがないPCで実行する

PowerShellで実行:

$nodeDir = (Resolve-Path .\.tools\node-v24.18.0-win-x64).Path
$env:Path = "$nodeDir;$env:Path"
& "$nodeDir\npm.cmd" install
& "$nodeDir\npm.cmd" run share

## 4) 起動確認

- 共有モード: ブラウザでURLを開いてゲーム画面が表示される
- 分離モード: cloud, room, dev の3つでエラーが出ていない

## 5) よくあるエラー

EADDRINUSE が出る場合（ポート競合）

1. 使用中プロセス確認

netstat -ano | findstr :4173
netstat -ano | findstr :5173
netstat -ano | findstr :8787
netstat -ano | findstr :8788

2. 該当PIDを終了

taskkill /PID <PID番号> /F

3. 再起動

npm run share

## 6) 別PCからアクセスできない場合

- 同じWi-Fi/LANに接続しているか確認
- Windowsファイアウォールで 4173, 5173, 8787, 8788 の受信を許可
- 相手には localhost ではなく、このPCのIPアドレスを共有する

## 7) A5M2でユーザー/戦績を保存する

クラウド保存サーバーはSQLiteへ保存します。A5M2から同じDBファイルを開いて確認できます。

- DBファイル: `server/data/a5m2.sqlite`
- ユーザー: `users` テーブル
- 戦績履歴: `match_records` テーブル

手順:

1. サーバー起動

```bash
npm run cloud
```

2. A5M2で `server/data/a5m2.sqlite` を開く

3. APIで保存される内容

- ユーザー保存: `POST /api/profile/load`（初回自動作成）
- プロファイル更新: `POST /api/profile/save`
- 戦績追加: `POST /api/match/record`

補足:

- 旧 `server/data/profiles.json` が存在し、`users` が空の場合は初回起動時に自動移行されます。
- パスワード平文はDBへ保存されません。`users.pass_hash_bcrypt` にbcryptハッシュのみ保存されます。
- 旧方式（scrypt）の既存ユーザーは、ログイン成功時にbcryptへ自動移行されます。
