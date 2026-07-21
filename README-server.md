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
http://<このPCのIP>:4173/

## 2) 開発向けに分離起動する

ターミナルを3つ開いて、それぞれ実行します。

ターミナルA（クラウド保存API）

npm run cloud

ターミナルB（ルームWebSocket）

npm run room

ターミナルC（フロント開発サーバー）

npm run dev

アクセス例:
http://<このPCのIP>:5173/

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
