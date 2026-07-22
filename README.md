# Neon Board Arcade

ブラウザで遊べるボードゲーム集です（オセロ / 将棋 / チェス）。

サーバー起動コマンドだけ確認したい場合は README-server.md を参照してください。

## このPCをサーバーにして遊ぶ（LAN推奨）

同じWi-Fi/LAN内の別PCやスマホから遊ぶ場合は、まずこのPCで次を実行します。

```bash
npm run share
```

- 画面に表示される `http://<このPCのIP>:4173/#NeonBoardArcade` をそのまま共有します。
- このモードはフロント配信・ルームWebSocket・クラウド保存APIを1つのサーバーで提供します。

別々に起動する場合は、以下をこのPCで同時に起動してください。

```bash
npm run cloud
npm run room
npm run dev
```

- 別端末からは `http://<このPCのIP>:5173/#NeonBoardArcade` にアクセスします。
- 必要に応じて Windows ファイアウォールで `5173` `8787` `8788` を許可してください。

## 本番を止めずにテスト環境で確認する

本番と別ポートで起動するため、同じPC上で並行確認できます。

```bash
npm run cloud:test
npm run room:test
npm run dev:test
```

テストアクセスURL（同一PC）:

```text
http://localhost:5174/?cloudApi=http://localhost:18787&roomServer=ws://localhost:18788#NeonBoardArcade
```

- `cloudApi` はクラウドAPI接続先を指定します（初回アクセス時に保存）。
- テストDBは `server/data/a5m2.test.sqlite` で、本番DBと分離されます。
- 共有モードのテストは `npm run share:test`（`4174`、保存先 `server/data/profiles.test.json`）。

## セットアップ

```bash
npm install
```

## 開発サーバー起動

```bash
npm run dev
```

## 起動手順（おすすめ）

通常は次の順で起動すると安定します。

1. ターミナルAでクラウド保存サーバーを起動

```bash
npm run cloud
```

2. ターミナルBでフロント開発サーバーを起動

```bash
npm run dev
```

3. ターミナルCでルーム(WebSocket)サーバーを起動

```bash
npm run room
```

4. ブラウザで開く

- `http://localhost:5173/#NeonBoardArcade`
- 別端末からは `http://<このPCのIP>:5173/#NeonBoardArcade`

クラウド保存を使わない場合は `npm run dev` だけでOKです。

## ローカル独自URLで起動（toufugameshow.local）

Windowsで `toufugameshow.local` を使う場合は、管理者権限のPowerShellで一度だけ hosts へ追記してください。

```powershell
Add-Content -Path "$env:WINDIR\System32\drivers\etc\hosts" -Value "`n127.0.0.1 toufugameshow.local"
```

その後、通常権限のターミナルで次を実行します。

```bash
npm run dev:tofu
```

アクセスURL:

- `http://toufugameshow.local:5173/#NeonBoardArcade`

## 起動確認チェック

- フロント: 画面が表示される
- クラウド保存: ログイン時に「クラウド確認に失敗しました」が出ない
- ルーム対戦: 同じ6桁コードで別ブラウザから参加できる

## トラブルシュート（起動できないとき）

### `npm run cloud` が失敗する（`EADDRINUSE`）

同じポート `8787` を別プロセスが使用中です。

1. 使用中プロセス確認

```powershell
netstat -ano | findstr :8787
```

2. 対象PIDを終了（PIDは置き換え）

```powershell
taskkill /PID 12345 /F
```

3. もう一度クラウド起動

```bash
npm run cloud
```

### `npm run dev:tofu` で開けない

- hosts 追記が未実施の可能性があります。
- 管理者PowerShellで次を実行後、ブラウザを再読み込みしてください。

```powershell
Add-Content -Path "$env:WINDIR\System32\drivers\etc\hosts" -Value "`n127.0.0.1 toufugameshow.local"
```

## クラウド保存サーバー起動（ID + パスワード）

サバイバーの `BANK / PITY / スキン解放 / 選択スキン` を、ユーザーIDごとに保存できます。

```bash
npm run cloud
```

- エンドポイント: `http://localhost:8787`
- 初回 `load` 時にユーザーがなければ自動作成されます。
- パスワードはサーバー側で `scrypt` ハッシュ化して保存します（平文保存しません）。
- 保存ファイル: `server/data/profiles.json`

開発時は `npm run dev` と `npm run cloud` の両方を起動してください。

## ビルド

```bash
npm run build
```

## 同じURLを渡してそのまま対戦する（推奨）

1. 共有サーバーを起動

```bash
npm run share
```

2. 表示されたURLを相手にそのまま共有

- 例: `http://<your-host>:4173/#NeonBoardArcade`

このモードではフロント配信とルームWebSocketが同じオリジンで動作するため、
`roomServer` クエリは不要です。

## 実装済み（第1段階）

- ゲーム選択画面（オセロ / 将棋 / チェス）
- 8x8盤面の表示
- 合法手の判定と表示
- 石を置いたときの反転処理
- 手番交代
- パス判定と終局判定
- 勝敗表示
- CPU対戦（あなたは黒、CPUは白）
- ローカル2人対戦（黒白を交互に操作）
- 難易度選択（かんたん / ふつう / つよい）
- ルーム作成 / 参加（6桁番号）
- ルームロビー（参加者が揃ってからホストがゲーム選択）
- マルチ時のプレイヤー名設定（ロビーに自分/相手の名前を表示）
- 将棋（2人対戦、ルームから選択可能）
- チェス（2人対戦、ルームから選択可能）

## 将棋の現在仕様

- 9x9盤面で基本駒の移動に対応
- 成り対応（任意成りと必須成り）
- 持ち駒対応（取った駒を手駒に追加）
- 打ち対応（手駒から盤面へ配置）
- 二歩制限（同筋に自分の未成歩があると歩を打てない）
- 王手 / 詰み判定

### 将棋の今後候補

- 打ち歩詰めの厳密判定
- 千日手や持将棋などの引き分け処理

## ルーム対戦について

- ルーム番号を作成して共有し、番号入力で参加できます。
- 既定では `ws://localhost:8788` のWebSocketサーバーに接続します。
- WebSocketに接続できない場合は `BroadcastChannel` へフォールバックします。

### ローカルでオンライン対戦をテストする

1. ターミナルAでルームサーバーを起動

```bash
npm run room
```

2. ターミナルBでフロントを起動

```bash
npm run dev
```

3. 1台で試す場合は通常ウィンドウとシークレットウィンドウで開き、同じルーム番号に参加

### インターネット越しで使う

#### まずは同じURL共有モード（おすすめ）

`npm run share` を公開ホストで起動し、`4173` を開放してURLを共有します。

#### 既存の分離構成を使う場合

1. 公開可能なサーバーで `npm run room` を実行（ポート `8788` を開放）
2. クライアントURLに `roomServer` クエリを付ける

```text
http://<your-host>:5173/?roomServer=ws://<public-host>:8788#NeonBoardArcade
```

3. HTTPS配信時は `wss://` を使う

```text
https://<your-host>/?roomServer=wss://<public-host>:8788#NeonBoardArcade
```

`roomServer` を一度指定すると、その値はブラウザのlocalStorageに保存されます。

## 備考

- グローバルにNode.js未導入でも、`.tools/node-v24.18.0-win-x64` を使って実行できます。

## グローバルNode.jsがない環境での実行

PowerShellで次を実行:

```powershell
$nodeDir = (Resolve-Path .\.tools\node-v24.18.0-win-x64).Path
$env:Path = "$nodeDir;$env:Path"
& "$nodeDir\npm.cmd" install
& "$nodeDir\npm.cmd" run dev
```

## 別PCへ移すときのメモ

### 先に覚えておくこと

- ルーム機能は WebSocket 優先です。
- WebSocketが利用できない場合だけ BroadcastChannel を使用します。

## 戦績機能の共通ファイル（各ゲーム本体は未改修でもOK）

今回、各ゲームの内部コードには直接組み込まず、共通ファイルだけ追加しています。

- 追加ファイル: `src/scripts/matchStatsClient.js`
- 戦績保存先: `server/data/profiles.json`（この1ファイルを別PCへ移せば戦績も一緒に引き継げます）

### サーバーAPI

- `/api/match/record`
	- 認証後に 1試合分を追記
	- 集計先: `profile.matchStats`
	- 履歴先: `profile.recentMatches`

### 各ゲームに後から実装するとき（最小例）

ゲーム終了時に次を呼ぶだけで戦績を保存できます。

```js
import { createMatchStatsClient } from "./scripts/matchStatsClient.js";

const userId = localStorage.getItem("neon-cloud-user-id") || "";
const password = localStorage.getItem("neon-cloud-password") || "";
const stats = createMatchStatsClient({ userId, password });

// 例: オセロで勝利したとき
await stats.recordMatch({
	game: "othello",
	result: "win", // "win" | "lose" | "draw"
	roomCode: "123456", // 任意
	opponent: "Player2", // 任意
});
```

### 別PCへ移すときに重要なファイル

- `server/data/profiles.json`
	- クラウドIDごとの戦績・スキン・BANK情報が入ります

- 別PC同士で遊ぶ場合はルームサーバーを公開して `roomServer` を指定します。

### いまのサバイバー マルチ仕様

- ルーム参加は最大8人です（同一環境前提）。
- 参加人数に応じてサバイバーの敵出現数と出現間隔が増加します。

### 移行時チェックリスト

- プロジェクトフォルダ全体をコピーする（src / index.html / package.json / .tools を含む）。
- 新PCで依存を再インストールする（npm install）。
- 動作確認は npm run dev で行う。
- 本番用出力が必要なら npm run build を実行する。

### データ引き継ぎに関する注意

- 学習値や設定の一部はブラウザの localStorage に保存されます。
- localStorage の内容は、通常フォルダコピーだけでは別PCへ引き継がれません。
- 同じブラウザプロファイルの移行が必要です（ブラウザ側のエクスポート/同期機能などを利用）。
- クラウド保存を使う場合は `server/data/profiles.json` のバックアップも必要です。