# PlayFlow マルチプレイ仕様書 v0

最終更新: 2026-07-27
作成者: <name>
版数: v0.1
状態: Draft

---

## 1. 目的と適用範囲

- 本書は PlayFlow のオンライン対戦（ルーム方式）の実装仕様を固定する。
- 対象は Next.js フロント（apps/web）と Room サーバー（server/room-server.mjs）。
- 1人プレイ固有仕様は本書の対象外とする。

## 2. 接続方式

- 通信方式: WebSocket
- 分離起動時の既定エンドポイント: ws://<host>:8788
- 共有モード時の既定エンドポイント: 同一オリジン /room
- ルームコード: 6桁数値

## 3. ロールと権限

- host:
  - ルームの主判定者
  - ゲーム開始、招待トークン発行、ミュート操作を実行可能
- guest:
  - 対戦参加者
  - 対象ゲームでは操作要求を host に送信し、host 判定後に確定
- spectator:
  - 観戦専用
  - ゲーム操作不可、観戦チャット可

## 4. ルーム制御

- 公開/非公開ルームを提供する。
- ルーム上限人数は 16 人（環境変数 ROOM_MAX_PLAYERS 未指定時）。
- クイックマッチは公開ルームを優先探索する。
- 非公開ルームは招待トークンが必須。
  - 招待トークン有効期限: 5分（既定）
- 試合開始時に参加者ロック（allowedPeerIds）を設定する。
  - ロック後に新規参加したユーザーは spectator 扱いとする。

## 5. 対戦成立と進行

- 対戦開始条件:
  - host が開始操作を実行
  - 必要人数を満たしていること
- 対戦中の基本ルール:
  - 手番外操作は拒否
  - spectator の操作は拒否
  - guest の操作は host 判定待ちを経由
- 終了条件:
  - 各ゲーム固有の勝敗条件
  - 降参時は敗北確定

## 6. 同期モデル

### 6.1 判定責務

- 原則は host 権威モデル（host authoritative）。
- guest は確定操作を直接適用しない。

### 6.2 リクエスト型同期（厳密同期対象）

- othello: othello-request-move
- gomoku: gomoku-request-move
- chess: chess-request-click
- shogi: shogi-request-click
- uno: uno-request-action
- daifugo: daifugo-request-action

### 6.3 スナップショット同期

- host は arcade-sync を定期送信する。
- 受信側は最新スナップショットで状態を補正する。
- リクエスト型未対応ゲームは、スナップショット同期を最低保証とする。

## 7. 切断と再接続

- メンバー生存監視の既定しきい値: 5500ms（ROOM_STALE_MEMBER_TTL_MS）。
- 一時切断時は再接続を試行し、復帰時は最新ルーム状態を再同期する。
- 再接続不能時はロビー復帰導線を表示する。

## 8. 再戦とドロー

- 再戦投票:
  - イベント: rematch-vote / rematch-unvote
  - 必要人数の投票成立で再戦開始
- ドロー投票:
  - イベント: draw-vote / draw-unvote
  - 必要人数の同意で引き分け成立
- spectator は投票不可

## 9. チャットとモデレーション

- ルームチャット、観戦チャットを分離する。
- レート制限（既定）:
  - 最短送信間隔: 700ms
  - 監視ウィンドウ: 12秒
  - バースト上限: 8件
  - 重複抑止ウィンドウ: 9秒
- 編集/撤回可能時間は既定 30秒運用。
- 通報自動ミュート:
  - 通報 2 件以上で自動ミュート（既定）
- host ミュート:
  - 既定 5分
  - 最大 24時間

## 10. エラー処理方針

- 代表エラー:
  - ROOM_FULL
  - INVITE_TOKEN_REQUIRED
  - HOST_ONLY
  - SPECTATOR_ONLY
  - REMATCH_VOTE_FORBIDDEN
  - DRAW_VOTE_FORBIDDEN
  - MUTED
  - RATE_LIMIT_FAST / RATE_LIMIT_BURST / RATE_LIMIT_DUPLICATE
- UI はエラーコードをユーザー向け文言へマッピングして表示する。

## 11. 非機能要件（マルチ）

- 接続成功率: 99%以上（同一リージョン想定）
- 対戦完了率: 90%以上
- 重大同期ズレ率: 1%未満
- 再接続復帰率: 80%以上（一時断）

## 12. テストと受け入れ基準

- 回帰テストは docs/room-e2e-regression-checklist.md を基準とする。
- 最低受け入れ条件:
  - 6ゲーム（othello/gomoku/chess/shogi/uno/daifugo）で host-guest 同期一致
  - spectator 操作拒否
  - 再戦/ドロー投票の両端末一致
  - ルーム参加者一覧一致

## 13. 変更管理

- 仕様変更は以下を同時更新する:
  - docs/PlayFlow_ゲーム仕様書_v0.1.docx
  - docs/playflow-requirements-v0.md
  - docs/playflow-multiplayer-spec-v0.md
- 変更時は版数、変更理由、影響範囲（要件ID/イベント名）を記録する。
