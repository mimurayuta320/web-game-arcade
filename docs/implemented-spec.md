# 実装仕様書（現行実装ベース）

最終更新: 2026-07-24

本書は「現在コードとして実装されている仕様」を対象にまとめたものです。
企画案や将来予定ではなく、実装確認できた機能のみを記載します。

---

## 1. 対象範囲

- フロントエンド（主系）: `apps/web`（Next.js）
- フロントエンド（旧系/共有配信）: ルート `src/`（Vite + vanilla JS）
- ルームサーバー: `server/room-server.mjs`
- 共有サーバー: `server/share-server.mjs`
- クラウド保存API: `apps/api`（NestJS）

補足:
- `docs/next-migration-status.md` 上は「bikeRunner を除く主要ゲームは Next 移行済み（lite含む）」。

---

## 2. 実装済みゲーム一覧

### 2.1 Next.js版でプレイ可能なゲーム

- オセロ（othello）
- 五目並べ（gomoku）
- チェス（chess）
- 将棋（shogi）
- UNO（uno）
- マインスイーパー（minesweeper）
- ヌメロン（numeron）
- ブラックジャック（blackjack）
- チンチロ（chinchiro）
- セブンズ（sevens）
- 大富豪（daifugo）
- 4コマリレー（fourPanel）
- お絵かきリレー（drawingRelay）
- フィットパズル（fitPuzzle）
- 麻雀ペア（mahjong）
- ポーカー（poker）
- ソリティア（solitaire）
- Survivors（survivors）

### 2.2 旧Vite版に存在する追加ゲーム/モジュール

- bikeRunner（Next移行対象外）
- そのほか旧 `src/scripts` 配下の実装群（同名ゲームの旧実装含む）

---

## 3. ゲーム仕様（要点）

### 3.1 ボード系

- オセロ
  - 8x8、合法手判定、反転、パス、終局判定
  - CPU難易度: easy / normal / hard
  - モード: 1P vs CPU / CPU vs CPU / 2P LOCAL / CHAOS
  - CHAOS拡張: 上書き、固定、破壊、二回行動などのスキル系ルール

- 五目並べ
  - 15x15、交互着手、5連判定、引き分け判定

- チェス（lite）
  - 基本移動、手番、キング取得で勝敗
  - ポーンの最終段到達時クイーン昇格（簡易実装）

- 将棋（lite）
  - 基本移動、手番、王取得で勝敗
  - 旧Vite版では成り/持ち駒/打ち/二歩/王手詰み等まで実装済み記述あり

### 3.2 カード/テーブル系

- UNO（lite）
  - 1P対CPUの基本ループ
  - ルーム時は guest 操作を host が判定するリクエスト型同期

- 大富豪（lite）
  - 2者手札、場札比較、パス、ラウンドクリア
  - ルーム時は guest 操作を host が判定するリクエスト型同期

- セブンズ（lite）
  - 配札、場レンジ更新、パス処理、勝敗判定

- ポーカー（lite）
  - ドロー前ホールド、交換、役比較（CPU対戦）

- ブラックジャック（lite）
  - Hit/Stand、ディーラー規則（17以上まで）

- チンチロ（lite）
  - サイコロ役判定、勝敗比較

- ソリティア（lite）
  - Tableau / Foundation / Stock / Waste の基本操作

### 3.3 パズル/アクション系

- マインスイーパー
  - セル開示、地雷ゲームオーバー、全安全マス開示でクリア

- ヌメロン（lite）
  - 3桁重複なし推理、Hit/Blow判定

- フィットパズル
  - 3x3スライド、隣接移動、手数カウント

- 麻雀ペア
  - 同牌ペア消去、2回まで曲がり連結判定、詰み回避シャッフル

- 4コマリレー
  - 4枚連続お題描画（キャンバス入力）

- お絵かきリレー
  - 描画フェーズ → 回答フェーズ

- Survivors（lite）
  - ウェーブ進行、敵撃破、経験値/レベル、時間経過ダメージ

---

## 4. マルチプレイ仕様（ルーム）

### 4.1 接続方式

- 通信: WebSocket
- ルームコード: 6桁数値
- 既定ポート: `8788`（分離起動時）
- 共有モードでは同一オリジン配下の `/room` を使用可能

### 4.2 ロール

- host
  - ルームの主判定者
  - guest からの操作リクエストを受理して適用
- guest
  - 対象ゲームでは直接確定せず、`*-request-*` イベントで host に要求
- spectator
  - 観戦専用（操作不可）
  - 観戦チャット利用可

### 4.3 ルーム制御

- 公開/非公開ルーム
- クイックマッチ（公開ルームを優先探索）
- 非公開ルーム招待トークン
  - host 発行
  - 有効期限デフォルト 5 分
- 最大参加人数: 16（環境変数未指定時の既定値）

### 4.4 対戦中参加制御

- 試合開始時に参加者ロック（allowedPeerIds）
- 試合中プレイヤー参加は制限し、観戦誘導

### 4.5 リクエスト型同期が明示実装されているゲーム

- オセロ: `othello-request-move`
- 五目並べ: `gomoku-request-move`
- チェス: `chess-request-click`
- 将棋: `shogi-request-click`
- UNO: `uno-request-action`
- 大富豪: `daifugo-request-action`

### 4.6 ルーム内コミュニケーション/モデレーション

- ルームチャット
- 観戦チャット
- レート制限
  - 最短送信間隔
  - バースト上限
  - 重複投稿抑止
- 編集/撤回可能時間（既定 30 秒）
- 通報による自動ミュート
- host によるミュート/解除

### 4.7 再戦・ドロー合意

- 再戦投票（rematch-vote / unvote）
- ドロー投票（draw-vote / unvote）
- 2名合意で成立する設計（実装既定値）

---

## 5. マルチ同期レイヤー（Next側）

- host は一定間隔でスナップショット同期（`arcade-sync`）を送信
- 受信側はスナップショットを反映
- これにより、明示リクエスト未実装ゲームでも「状態共有」自体は可能
- ただし、厳密な同時操作対戦の整合性はリクエスト型同期ゲームの方が高い

---

## 6. クラウド保存/API仕様

### 6.1 基本

- ベース: `apps/api`（NestJS）
- 主要保存先: SQLite（`server/data/a5m2.sqlite` 系）
- 認証: userId + password
  - bcryptハッシュ保存

### 6.2 主要API（`/api/*`）

- 認証
  - `POST /api/auth/register`
  - `POST /api/auth/login`
- プロファイル
  - `POST /api/profile/load`
  - `POST /api/profile/save`
- 戦績
  - `POST /api/match/record`
- フレンド
  - `POST /api/friends/list`
  - `POST /api/friends/remove`
  - `POST /api/friends/request/send`
  - `POST /api/friends/request/incoming`
  - `POST /api/friends/request/outgoing`
  - `POST /api/friends/request/approve`
  - `POST /api/friends/request/reject`
  - `POST /api/friends/request/cancel`
  - `POST /api/friends/search`
- 問い合わせ
  - `POST /api/inquiry/submit`
  - `POST /api/inquiry/list`
  - `POST /api/inquiry/delete`

### 6.3 スコアAPI

- `GET /scores?limit=...`
- `POST /scores`

---

## 7. プロファイル/戦績データ

- プロファイル項目（代表）
  - bankCoins
  - pityCounter
  - unlockedSkins
  - selectedSkin
  - playerName
  - playerAvatar
  - matchStats
  - recentMatches
- 戦績
  - game
  - result（win / lose / draw）
  - playedAt
  - roomCode
  - opponent

---

## 8. 起動構成

### 8.1 分離起動（開発）

- フロント: `npm run dev:web`
- クラウドAPI: `npm run cloud`
- ルームWS: `npm run room`

### 8.2 共有起動（配布/検証）

- `npm run share`
- 単一URLでフロント配信 + ルーム + クラウドAPIプロキシを提供

### 8.3 テスト用ポート分離

- cloud:test（18787）
- room:test（18788）
- dev:test（5174）
- share:test（4174）

---

## 9. 既知の実装上の補足

- `docs/next-migration-status.md` の「lite」は、コアプレイ優先で移植した段階を意味する。
- 旧Vite版の将棋仕様は Next版より機能が多い記述があり、完全同等移植とは限らない。
- マルチは「観戦」「招待リンク」「公開/非公開」「クイックマッチ」まで実装済み。

---

## 10. 参照元

- `apps/web/src/app/page.tsx`
- `server/room-server.mjs`
- `server/share-server.mjs`
- `apps/api/src/cloud/cloud.controller.ts`
- `apps/api/src/cloud/cloud.service.ts`
- `apps/api/src/scores/scores.controller.ts`
- `README.md`
- `README-server.md`
- `docs/next-migration-status.md`

---

## 11. ゲーム別詳細仕様表

表記ルール:
- マルチ列の「判定」は、guest入力をhostが確定するリクエスト型実装を指す。
- 「同期のみ」は、スナップショット共有で状態反映は行うが、専用の操作判定イベントは未実装の扱い。

| ゲーム | 目的 | 基本操作 | 勝敗/クリア条件 | 実装モード | マルチ |
|---|---|---|---|---|---|
| オセロ | 相手石を挟んで最終石数で優位 | 盤面クリックで着手 | 両者置けなくなった時点で石数比較 | CPU, CPUvsCPU, Local2P, Chaos | 判定あり |
| 五目並べ | 先に5連を作る | 盤面クリックで着手 | 5連成立で勝利、満盤で引き分け | Local2P | 判定あり |
| チェス | 相手キングを取る | 駒選択→移動先選択 | キング取得で勝利 | Local2P | 判定あり |
| 将棋 | 相手王を取る | 駒選択→移動先選択 | 王取得で勝利 | Local2P, Chaos(状態) | 判定あり |
| UNO | 手札を先に0枚にする | カード選択、山札ドロー | 先に手札を出し切る | CPU対戦, Local2P相当 | 判定あり |
| 大富豪 | より強い札を出し切る | カード選択、パス | 手札0で勝利 | CPU対戦, Local2P相当 | 判定あり |
| セブンズ | 場を伸ばし手札を出し切る | カード選択、パス | 手札0で勝利 | CPU対戦 | 同期のみ |
| ポーカー | 交換後の役でCPUに勝つ | ホールド切替、ドロー | 役比較で win/lose/draw | CPU対戦 | 同期のみ |
| ブラックジャック | 21に近づけて勝つ | Hit, Stand | バースト/点数比較で決着 | CPU対戦 | 同期のみ |
| チンチロ | サイコロ役で勝つ | ロール | 役比較で決着 | CPU対戦 | 同期のみ |
| ソリティア | 全カードを土台へ移動 | ストックめくり、移動選択 | Foundation合計52でクリア | Single | 同期のみ |
| マインスイーパー | 地雷を避けて全安全マス開示 | セルクリック | 地雷で敗北、安全セル全開示でクリア | Single | 同期のみ |
| ヌメロン | 3桁秘密数を推理 | 数字選択、回答送信 | 3 Hit達成で勝利 | Single | 同期のみ |
| フィットパズル | 3x3タイルを整列 | タイルクリックでスライド | 正解配列でクリア | Single | 同期のみ |
| 麻雀ペア | 同牌を連結可能条件で消す | 牌選択（2枚） | 全消去でクリア | Single | 同期のみ |
| 4コマリレー | 4枚のお題連作を完成 | キャンバス描画、送信 | 4枚完了で終了 | Single | 同期のみ |
| お絵かきリレー | お題描画と回答 | キャンバス描画、回答入力 | 回答送信で1セッション完了 | Single | 同期のみ |
| Survivors | ウェーブを生存し続ける | 敵選択攻撃（クリック） | HP0でゲームオーバー | Single | 同期のみ |

### 11.1 マルチ判定ありゲームのイベント対応

| ゲーム | guest -> host リクエストイベント |
|---|---|
| オセロ | `othello-request-move` |
| 五目並べ | `gomoku-request-move` |
| チェス | `chess-request-click` |
| 将棋 | `shogi-request-click` |
| UNO | `uno-request-action` |
| 大富豪 | `daifugo-request-action` |

### 11.2 共通UI/操作仕様

- 基本入力はクリック/タップを主操作とする。
- ルーム接続中:
  - host/guestは手番外操作を拒否。
  - spectatorは読み取り専用。
- ルームメッセージ:
  - 一般チャット（プレイヤー）と観戦チャット（spectator）を分離。
- i18n:
  - 日本語/韓国語/英語の文言セットを保持。

---

## 12. 仕様差分メモ（Next版と旧版）

- 将棋:
  - 旧版ドキュメントでは成り・持ち駒・打ち・二歩など詳細ルールが明記。
  - Next版は lite として基本対局優先実装。
- そのほか lite 表記ゲーム:
  - コア体験を優先し、段階的に周辺機能を追加する前提。

---

## 13. 未実装項目リスト（優先度付き）

本節は「現行コードから見える改善余地」を、着手順の目安として整理したものです。
「未実装」は不具合を意味せず、機能拡張候補を含みます。

### 13.1 最優先（P1）

| 項目 | 対象 | 優先理由 | 完了条件 |
|---|---|---|---|
| ルーム対戦E2E回帰の固定化 | UNO / 大富豪 / オセロ / 五目 / チェス / 将棋 | 実装はあるが手動依存が大きく、回帰検知が遅れる | 2クライアント手順をチェックリスト化し、毎回同一手順で再現確認できる |
| liteゲームの対戦整合性確認 | UNO / 大富豪 | guest->host判定経路が中心のため、同期ズレ時の影響が大きい | 主要操作（出す/引く/パス）で双方表示が一致し続ける |
| 将棋の仕様差分明文化 | 将棋（Next/旧版） | 旧版の仕様が豊富で、移行差分の誤解が起きやすい | 「Nextで対応済み」「未対応」を項目単位で一覧化 |

### 13.2 高優先（P2）

| 項目 | 対象 | 優先理由 | 完了条件 |
|---|---|---|---|
| ルーム判定イベントの適用範囲拡張 | セブンズ / ポーカー / ブラックジャック など | 同期のみ運用は対戦型で整合性リスクが残る | 必要なゲームに `*-request-*` 相当を追加し、host確定へ統一 |
| 観戦体験の改善 | spectator UI | 観戦は実装済みだが、ゲーム別表示強化余地がある | 観戦時の手番・結果・ログ表示がプレイヤー時と同等に追跡可能 |
| エラーコード運用表の整備 | room / cloud API | 運用時の一次切り分けを高速化できる | エラーコード、原因、ユーザー向け文言、対応手順を1表で管理 |

### 13.3 中優先（P3）

| 項目 | 対象 | 優先理由 | 完了条件 |
|---|---|---|---|
| スコア/戦績のゲーム別可視化強化 | `/scores`, profile.matchStats | 保存はあるが分析導線が限定的 | ゲーム別の勝率/件数をUIから確認できる |
| チュートリアル文言の拡充 | liteゲーム全般 | 初見ユーザーの離脱を減らせる | 各ゲームで1画面以内の操作ガイドを表示 |
| モバイル操作最適化の再点検 | キャンバス系 / 盤面系 | クリック主操作前提のため端末差確認が必要 | 主要端末で誤タップ率と操作不能箇所が許容範囲 |

### 13.4 参考（将来検討）

| 項目 | 対象 | 備考 |
|---|---|---|
| bikeRunner のNext移行可否 | bikeRunner | 現状は移行対象外。別トラックで判断 |
| 高度ルールの段階移植 | 将棋/チェスなど | コア体験維持を優先し、段階導入する |

### 13.5 推奨着手順（短期）

1. P1のE2E回帰手順を文書化し、実機2クライアントで固定テスト化
2. 将棋の「旧版 vs Next」差分表を作成
3. P2から1タイトル選び、判定イベント方式へ寄せる

関連ドキュメント:
- `docs/room-e2e-regression-checklist.md`
