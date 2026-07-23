# 作業用README（別PC引き継ぎ）

最終更新: 2026-07-23

## 1. 現在の状況
- Next移行の主要実装は完了。
- 直近は以下を反映済み。
  - 手番表示（Othello/Gomoku/Chess/Shogi/UNO/Daifugo）
  - UNO/大富豪のルーム時リクエスト型操作（guest -> host判定）
  - ルーム接続時のUNO/大富豪CPU自動進行の停止
- 検証結果: `npm --prefix apps/web run build` は成功。

## 2. 別PCへ移る前にこのPCでやること
- 変更確認
  - `git status --short`
- 必要なら最終ビルド確認
  - `npm --prefix apps/web run build`
- コミット
  - `git add -A`
  - `git commit -m "chore: handoff before moving to another pc"`
- リモートへ送信
  - `git push`

## 3. 別PCで再開する手順
- リポジトリ取得
  - 初回: `git clone <repo-url>`
  - 既存: `git pull`
- 依存関係インストール（ルート）
  - `npm install`
- モノレポ配下の依存関係インストール
  - `npm --prefix apps/web install`
  - `npm --prefix apps/api install`
- ビルド確認
  - `npm --prefix apps/web run build`

## 4. 起動コマンド（再開時）
- Webのみ起動
  - `npm run dev:web`
- APIのみ起動
  - `npm run dev:api`
- Web + APIを1URLで起動（既存スクリプト）
  - `npm run dev:oneurl`

## 5. 再開後の優先作業
- ルーム対戦の手動E2E確認（最優先）
  - UNO: guest操作 -> host判定 -> 両者同期
  - 大富豪: guest操作 -> host判定 -> 両者同期
- 手番表示の文言確認
  - 自分の番 / 相手の番 / 観戦中 の表示が役割ごとに正しいか確認
- 回帰確認
  - Othello/Gomoku/Chess/Shogiの既存マルチ操作が壊れていないか確認

## 6. 簡易チェックリスト
- [ ] 最新コミットをpush済み
- [ ] 別PCでpull済み
- [ ] 依存関係をinstall済み
- [ ] `npm --prefix apps/web run build` 成功
- [ ] UNO/大富豪のルーム同期を手動確認
- [ ] 手番表示を手動確認

## 7. 参考
- Next移行の進捗メモ: `docs/next-migration-status.md`
- メイン実装ファイル: `apps/web/src/app/page.tsx`
