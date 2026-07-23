"use client";

import { FormEvent, PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type Score = {
  id: number;
  playerName: string;
  score: number;
  game?: string | null;
  createdAt: string;
};

type Panel = "menu" | "othello" | "gomoku" | "chess" | "shogi" | "uno" | "minesweeper" | "numeron" | "blackjack" | "chinchiro" | "sevens" | "daifugo" | "fourPanel" | "drawingRelay" | "fitPuzzle" | "mahjong" | "poker" | "solitaire" | "survivors" | "scores" | "status";

type RoomParticipant = {
  id: string;
  name: string;
  role: "host" | "guest" | "spectator";
};

type CloudAuthResult = {
  ok?: boolean;
  code?: string;
  message?: string;
  profile?: {
    playerName?: string;
  };
};

type Language = "ja" | "ko";

const LOGIN_I18N = {
  ja: {
    loginTitle: "ログイン",
    loginLead: "旧HTMLのエントリー導線をNextへ移行しました。",
    languageLabel: "Language",
    langJa: "日本語",
    langKo: "한국어",
    userId: "ユーザーID",
    password: "パスワード",
    displayName: "表示名（ゲーム内）",
    loginButton: "ログインして遊ぶ",
    registerButton: "新規登録",
    guestButton: "ゲストで遊ぶ",
    processing: "処理中...",
    requireAuthFields: "ユーザーIDとパスワードを入力してください。",
    loginLoading: "ログイン中...",
    loginFailed: "ログインに失敗しました。ID/パスワードを確認してください。",
    registerLoading: "新規登録中...",
    registerFailed: "新規登録に失敗しました。既存IDの可能性があります。",
    registerSuccess: "新規登録が完了しました。",
    guestStarted: "ゲストモードで開始しました。",
    appTitle: "Neon Board Arcade",
    appLead: "このページから /scores を同一URL経由で利用",
    backToLogin: "ログインへ戻る",
    modeCloud: "Cloud",
    modeGuest: "Guest",
    tabMenu: "メニュー",
    tabOthello: "オセロ",
    tabGomoku: "五目並べ",
    tabShogi: "将棋",
    tabChess: "チェス",
    tabUno: "UNO",
    tabMinesweeper: "マインスイーパー",
    tabNumeron: "ヌメロン",
    tabBlackjack: "ブラックジャック",
    tabChinchiro: "チンチロ",
    tabSevens: "セブンズ",
    tabDaifugo: "大富豪",
    tabFourPanel: "4コマリレー",
    tabDrawingRelay: "お絵かきリレー",
    tabFitPuzzle: "フィットパズル",
    tabMahjong: "麻雀ペア",
    tabPoker: "ポーカー",
    tabSolitaire: "ソリティア",
    tabSurvivors: "Survivors",
    tabScores: "スコア",
    tabStatus: "移行状況",
    menuTitle: "ゲーム選択（Next移行メニュー）",
    menuLead: "旧HTMLメニューを段階的に移植しています。まずはオセロ、五目並べ、チェス、UNOへ遷移できます。",
    playableLead: "Next移行版でプレイ可能",
    checkScoresLead: "保存・一覧を確認",
    migrationPlanned: "移行予定",
    shogiLater: "将棋の移行は次フェーズで対応します。",
    chessLater: "チェスの移行は次フェーズで対応します。",
    roomTitle: "ルーム操作（移行中）",
    roomServerUrl: "RoomサーバーURL",
    roomCode: "ルーム番号",
    roomCodePlaceholder: "6桁",
    roomPublic: "公開",
    roomPrivate: "非公開",
    roomCreate: "ルーム作成",
    roomJoin: "ルーム参加",
    roomDisconnect: "切断",
    roomState: "状態",
    roomConnected: "接続ルーム",
    roomRole: "ロール",
    roomRoleHost: "ホスト",
    roomRoleGuest: "ゲスト",
    roomRoleSpectator: "観戦",
    roomMembers: "参加者",
    roomMembersEmpty: "未取得",
    multiSyncTitle: "マルチ同期",
    multiSyncEnabled: "同期ON",
    multiSyncDisabled: "同期OFF",
    chaosModeLabel: "カオスモード",
    chaosModeOn: "ON",
    chaosModeOff: "OFF",
    syncHostOnlyHint: "ホストのゲーム状態をルーム参加者へ同期します。",
    syncApplied: "ルームから最新状態を反映しました。",
    chaosEvent: "カオス発動: {event}",
    roomCodeRequired: "ルーム番号を入力してください。",
    roomJoinPreparing: "ルーム {code} へ接続準備中...",
    roomCandidate: "ルーム候補: {code} ({visibility})",
    roomStateIdle: "未接続",
    roomStateConnecting: "接続中...",
    roomStateConnected: "接続済み",
    roomStateConnectFailed: "接続失敗",
    roomStateError: "接続エラー",
    roomStateClosed: "切断",
    roomTurnOwnerOnly: "この手番は操作できません。",
    roomWaitingHostJudge: "ホスト判定待ち...",
    roomSpectatorReadonly: "観戦中のため操作できません。",
    roomTurnCurrent: "現在の手番: {owner}",
    roomTurnYou: "あなた",
    roomTurnOpponent: "相手",
    roomTurnSpectator: "観戦",
    roomUrlInvalid: "RoomサーバーURLが不正です。",
    roomConnectFailed: "Roomサーバーへ接続できませんでした。",
    roomFull: "このルームは満員です。",
    roomInGame: "このルームはゲーム中です。観戦モードは次対応予定です。",
    roomInviteRequired: "このルームは非公開です。招待トークン機能は次対応予定です。",
    roomErrorPrefix: "ルームエラー",
    roomErrRoomRequired: "ルーム番号が必要です。",
    roomErrHostOnly: "ホストのみ実行できます。",
    roomErrTargetInvalid: "対象プレイヤーが不正です。",
    roomErrTargetRequired: "対象プレイヤーを指定してください。",
    roomErrMessageIdRequired: "メッセージIDが必要です。",
    roomErrMessageNotFound: "対象メッセージが見つかりません。",
    roomErrReportSelfForbidden: "自分のメッセージは通報できません。",
    roomErrMuted: "ミュート中のため送信できません。",
    roomErrMessageNotOwned: "自分のメッセージのみ編集・撤回できます。",
    roomErrMessageAlreadyRetracted: "このメッセージは既に撤回済みです。",
    roomErrEditRetractExpired: "編集・撤回可能時間を過ぎています。",
    roomErrInvitePrivateOnly: "招待トークンは非公開ルームのみ発行できます。",
    roomErrSpectatorOnly: "観戦者のみ利用できる機能です。",
    roomErrRematchVoteForbidden: "現在は再戦投票できません。",
    roomErrUnknown: "不明なエラー ({code})",
    visibilityPublic: "公開",
    visibilityPrivate: "非公開",
    othelloTitle: "オセロ（Next移行版）",
    othelloReset: "リセット",
    othelloTurnBlack: "黒の番です",
    othelloPlayed: "{current}が置きました。{next}の番です",
    othelloPass: "{next}は置ける場所がないためパス。{current}の番です",
    othelloFinish: "終局: {result}（黒 {black} - 白 {white}）",
    othelloResultDraw: "引き分け",
    othelloResultBlackWin: "黒の勝ち",
    othelloResultWhiteWin: "白の勝ち",
    othelloChaosOverwriteStock: "上書き残数",
    othelloChaosImmutableStock: "固定残数",
    othelloChaosDestroyStock: "破壊残数",
    othelloChaosDoubleStock: "二回行動残数",
    othelloChaosImmutableArm: "固定予約",
    othelloChaosDestroyArm: "破壊予約",
    othelloChaosDoubleArm: "二回行動予約",
    othelloChaosSkillArmed: "発動待機中",
    othelloChaosNeedOwnDisc: "自分の駒を選択してください。",
    othelloChaosNeedInnerDisc: "固定は内側の駒のみ指定できます。",
    othelloChaosNeedMutableDisc: "固定済み/破壊済みには使用できません。",
    othelloChaosDestroySelectSacrifice: "犠牲にする自駒を選択してください。",
    othelloChaosDestroySelectTarget: "破壊する敵駒を選択してください。",
    othelloChaosDestroyDone: "破壊スキル発動",
    othelloChaosImmutableDone: "固定スキル発動",
    othelloChaosDoubleDone: "二回行動が発動しました",
    othelloChaosOverwrite: "上書き",
    othelloChaosFixed: "固定",
    othelloChaosDestroy: "破壊",
    othelloChaosDouble: "二回行動",
    gomokuTitle: "五目並べ（Next移行版）",
    gomokuReset: "リセット",
    gomokuTurnBlack: "黒の番です",
    gomokuTurnWhite: "白の番です",
    gomokuWin: "{winner}の勝ちです",
    gomokuDraw: "引き分けです",
    applyGomokuToScore: "黒石数をスコアに反映",
    appliedGomokuToScore: "五目の黒石数をスコア欄へ反映しました。",
    chessTitle: "チェス（Next移行版）",
    chessReset: "リセット",
    chessTurnWhite: "白の番です",
    chessTurnBlack: "黒の番です",
    chessSelectOwn: "自分の駒を選択してください。",
    chessIllegalMove: "その駒はそこへ移動できません。",
    chessWin: "{winner}の勝ちです（キングを取りました）",
    chessApplyScore: "残り駒差をスコアに反映",
    chessAppliedScore: "チェスの残り駒差をスコア欄へ反映しました。",
    shogiTitle: "将棋（Next移行版）",
    shogiReset: "リセット",
    shogiTurnBlack: "先手の番です",
    shogiTurnWhite: "後手の番です",
    shogiSelectOwn: "自分の駒を選択してください。",
    shogiIllegalMove: "その駒はそこへ移動できません。",
    shogiWin: "{winner}の勝ちです（王を取りました）",
    shogiApplyScore: "残り駒差をスコアに反映",
    shogiAppliedScore: "将棋の残り駒差をスコア欄へ反映しました。",
    minesTitle: "マインスイーパー（Next移行版）",
    minesReset: "リセット",
    minesHint: "マスを開いて地雷を避けてください。",
    minesGameOver: "地雷を踏みました。",
    minesCleared: "クリアです。",
    minesApplyScore: "開放マス数をスコアに反映",
    minesAppliedScore: "開放マス数をスコア欄へ反映しました。",
    numeronTitle: "ヌメロン（Next移行版）",
    numeronReset: "リセット",
    numeronHint: "0-9の数字を重複なしで3桁選んで予想してください。",
    numeronGuess: "予想",
    numeronClearDraft: "入力クリア",
    numeronSubmitGuess: "判定する",
    numeronInvalidGuess: "3桁の重複なし数字を入力してください。",
    numeronResult: "{guess}: {hits} HIT / {blows} BLOW",
    numeronWin: "正解です！",
    numeronApplyScore: "挑戦回数からスコア反映",
    numeronAppliedScore: "ヌメロンの挑戦回数からスコア欄へ反映しました。",
    numeronHistory: "履歴",
    numeronSecretLabel: "シークレット",
    blackjackTitle: "ブラックジャック（Next移行版）",
    blackjackReset: "配り直し",
    blackjackYourTurn: "あなたのターンです。HIT か STAND を選択してください。",
    blackjackDealerTurn: "ディーラーのターンです...",
    blackjackBust: "バーストしました。あなたの負けです。",
    blackjackWin: "あなたの勝ちです。",
    blackjackLose: "ディーラーの勝ちです。",
    blackjackPush: "引き分けです。",
    blackjackHit: "HIT",
    blackjackStand: "STAND",
    blackjackDealer: "ディーラー",
    blackjackPlayer: "あなた",
    blackjackApplyScore: "手札合計をスコアに反映",
    blackjackAppliedScore: "ブラックジャックの手札合計をスコア欄へ反映しました。",
    chinchiroTitle: "チンチロ（Next移行版）",
    chinchiroReset: "リセット",
    chinchiroRoll: "ROLL",
    chinchiroHint: "ROLLでサイコロを振って勝負します。",
    chinchiroWin: "あなたの勝ち",
    chinchiroLose: "ディーラーの勝ち",
    chinchiroDraw: "引き分け",
    chinchiroPlayer: "あなた",
    chinchiroDealer: "ディーラー",
    chinchiroResultLine: "{player} / {dealer} → {result}",
    chinchiroPinzoro: "ピンゾロ",
    chinchiroArashi: "アラシ",
    chinchiroShigoro: "シゴロ",
    chinchiroHifumi: "ヒフミ",
    chinchiroButa: "ブタ",
    chinchiroPoint: "{eye}の目",
    chinchiroApplyScore: "勝負結果をスコアに反映",
    chinchiroAppliedScore: "チンチロの結果をスコア欄へ反映しました。",
    sevensTitle: "セブンズ（Next移行版）",
    sevensReset: "リセット",
    sevensPass: "パス",
    sevensYourTurn: "あなたの番です。置けるカードを選んでください。",
    sevensCpuTurn: "CPUの番です...",
    sevensNoPlayable: "置けるカードがありません。",
    sevensPlayerWin: "あなたの勝ちです。",
    sevensCpuWin: "CPUの勝ちです。",
    sevensDraw: "引き分けです。",
    sevensPlayerHand: "あなたの手札",
    sevensCpuHand: "CPU手札",
    sevensPassCount: "パス回数",
    sevensApplyScore: "残り手札差をスコアに反映",
    sevensAppliedScore: "セブンズの残り手札差をスコア欄へ反映しました。",
    daifugoTitle: "大富豪（Next移行版）",
    daifugoReset: "配り直し",
    daifugoYourTurn: "あなたの番です。場札より強いカードを出してください。",
    daifugoCpuTurn: "CPUの番です...",
    daifugoPass: "パス",
    daifugoTable: "場札",
    daifugoYourHand: "あなたの手札",
    daifugoCpuHand: "CPU手札",
    daifugoPlayerWin: "あなたの勝ちです。",
    daifugoCpuWin: "CPUの勝ちです。",
    daifugoPassInfo: "{who} がパスしました。",
    daifugoRoundClear: "全員パスで場を流しました。",
    daifugoNeedHigher: "場札より強いカードを選んでください。",
    daifugoApplyScore: "残り手札差をスコアに反映",
    daifugoAppliedScore: "大富豪の残り手札差をスコア欄へ反映しました。",
    fourPanelTitle: "4コマリレー（Next移行版）",
    fourPanelReset: "リセット",
    fourPanelSubmit: "このコマを確定",
    fourPanelClear: "描画クリア",
    fourPanelHint: "コマを描いて確定すると次のコマへ進みます。",
    fourPanelNotDrawn: "コマが未描画です。描いてから確定してください。",
    fourPanelDone: "4コマ完成です。",
    fourPanelProgress: "PANEL {current} / 4",
    fourPanelStoryTitle: "お題",
    fourPanelApplyScore: "完成度をスコアに反映",
    fourPanelAppliedScore: "4コマの進捗をスコア欄へ反映しました。",
    drawingRelayTitle: "お絵かきリレー（Next移行版）",
    drawingRelayReset: "リセット",
    drawingRelayHintDraw: "お題を見て絵を描いてください。",
    drawingRelayHintGuess: "完成絵を見て答えを入力してください。",
    drawingRelayPrompt: "お題",
    drawingRelayGuess: "回答",
    drawingRelaySubmitDrawing: "描画を確定",
    drawingRelaySubmitGuess: "回答を確定",
    drawingRelayClear: "描画クリア",
    drawingRelayNotDrawn: "まだ描画されていません。",
    drawingRelayNeedGuess: "回答を入力してください。",
    drawingRelayDone: "リレー完了: お題 {prompt} / 回答 {guess}",
    drawingRelayApplyScore: "一致度をスコアに反映",
    drawingRelayAppliedScore: "お絵かきリレーの結果をスコア欄へ反映しました。",
    fitPuzzleTitle: "フィットパズル（Next移行版）",
    fitPuzzleReset: "シャッフル",
    fitPuzzleHint: "隣接タイルをクリックして 1-8 を順番に並べてください。",
    fitPuzzleOnlyAdjacent: "空白に隣接するタイルのみ動かせます。",
    fitPuzzleProgress: "手数: {moves}",
    fitPuzzleSolved: "クリア！ 手数: {moves}",
    fitPuzzleMoves: "手数",
    fitPuzzleApplyScore: "手数からスコア反映",
    fitPuzzleAppliedScore: "フィットパズルの結果をスコア欄へ反映しました。",
    mahjongTitle: "麻雀ペア（Next移行版）",
    mahjongReset: "配牌し直し",
    mahjongShuffle: "シャッフル",
    mahjongHintButton: "ヒント",
    mahjongHint: "同じ牌を2枚選んで消してください。",
    mahjongNoHint: "現在消せるペアがありません。シャッフルしてください。",
    mahjongHintLine: "ヒント: {a} と {b}",
    mahjongRemoved: "ペアを消しました。",
    mahjongRemovedAndShuffle: "ペアを消しました。手がなくなったため自動シャッフルしました。",
    mahjongBlocked: "同じ牌ですが、2回までに曲がる経路がありません。",
    mahjongSwitched: "選択を切り替えました。",
    mahjongClear: "クリア！ すべての牌を消しました。",
    mahjongRemaining: "残り牌: {count}",
    mahjongApplyScore: "進行度をスコアに反映",
    mahjongAppliedScore: "麻雀ペアの結果をスコア欄へ反映しました。",
    pokerTitle: "ポーカー（Next移行版）",
    pokerDeal: "配り直し",
    pokerDraw: "カード交換",
    pokerHint: "残したいカードを選択して交換してください。",
    pokerReady: "交換が完了しました。結果を確認してください。",
    pokerPlayerHand: "あなたの手",
    pokerCpuHand: "CPUの手",
    pokerResultWin: "あなたの勝ちです。",
    pokerResultLose: "CPUの勝ちです。",
    pokerResultDraw: "引き分けです。",
    pokerApplyScore: "勝敗をスコアに反映",
    pokerAppliedScore: "ポーカーの結果をスコア欄へ反映しました。",
    pokerHeld: "HOLD",
    pokerHandHighCard: "ハイカード",
    pokerHandOnePair: "ワンペア",
    pokerHandTwoPair: "ツーペア",
    pokerHandThreeKind: "スリーカード",
    pokerHandStraight: "ストレート",
    pokerHandFlush: "フラッシュ",
    pokerHandFullHouse: "フルハウス",
    pokerHandFourKind: "フォーカード",
    pokerHandStraightFlush: "ストレートフラッシュ",
    solitaireTitle: "ソリティア（Next移行版）",
    solitaireReset: "配り直し",
    solitaireStock: "山札",
    solitaireWaste: "捨て札",
    solitaireHint: "カードを選択して移動先をクリックしてください。",
    solitaireInvalidMove: "その場所には移動できません。",
    solitaireSelected: "移動先を選んでください。",
    solitaireCleared: "クリア！ すべて土台へ移動しました。",
    solitaireFoundations: "土台枚数: {count}",
    solitaireApplyScore: "進行度をスコアに反映",
    solitaireAppliedScore: "ソリティアの結果をスコア欄へ反映しました。",
    survivorsTitle: "Survivors（Next移行版）",
    survivorsReset: "リスタート",
    survivorsHint: "敵をクリックして倒し、できるだけ長く生き残ってください。",
    survivorsWave: "WAVE {wave}",
    survivorsHp: "HP {hp}/{max}",
    survivorsLevel: "LV {level}",
    survivorsTime: "TIME {sec}s",
    survivorsKills: "KILL {count}",
    survivorsAttack: "ATTACK",
    survivorsWaveClear: "WAVE {wave} クリア！ 次の波が始まります。",
    survivorsGameOver: "ゲームオーバー... リスタートで再挑戦できます。",
    survivorsApplyScore: "生存結果をスコアに反映",
    survivorsAppliedScore: "Survivors の結果をスコア欄へ反映しました。",
    unoTitle: "UNO（Next移行版）",
    unoReset: "リセット",
    unoYourTurn: "あなたの番です。出せるカードを選ぶか山札から引いてください。",
    unoCpuTurn: "CPUの番です...",
    unoPlayerWin: "あなたの勝ちです。",
    unoCpuWin: "CPUの勝ちです。",
    unoDrawCard: "1枚引く",
    unoTopCard: "場札",
    unoYourHand: "あなたの手札",
    unoCpuHand: "CPU手札",
    unoNoPlayable: "出せるカードがありません。",
    unoPlayedCard: "{who} が {card} を出しました。",
    unoDrewCard: "{who} が1枚引きました。",
    unoApplyScore: "残り手札差をスコアに反映",
    unoAppliedScore: "UNOの残り手札差をスコア欄へ反映しました。",
    blackStone: "黒",
    whiteStone: "白",
    applyBlackToScore: "黒石数をスコアに反映",
    appliedBlackToScore: "黒石数をスコア欄へ反映しました。",
    scoreFormTitle: "スコア登録",
    playerNameLabel: "プレイヤー名",
    gameLabel: "ゲーム",
    scoreLabel: "スコア",
    scoreSaving: "保存中...",
    scoreSave: "スコア保存",
    scoreSaved: "スコアを保存しました。",
    scoreSaveFailed: "スコア保存に失敗しました。",
    statusTitle: "移行ステータス",
    reload: "再取得",
    statusLine1: "API単一URL化: 完了（Next rewrite経由）",
    statusLine2: "スコア保存/読込: 完了",
    statusLine3: "オセロ（クリックプレイ）: 移行完了",
    statusLine4: "他ゲーム: これからNextへ順次移植",
    statusLineGomoku: "五目並べ（クリックプレイ）: 移行完了",
    statusLineUno: "UNO（ターン制プレイ）: 移行完了",
    statusLineChess: "チェス（クリックプレイ）: 移行完了",
    statusLineShogi: "将棋（クリックプレイ）: 移行完了",
    statusLineMines: "マインスイーパー（クリックプレイ）: 移行完了",
    statusLineNumeron: "ヌメロン（クリックプレイ）: 移行完了",
    statusLineBlackjack: "ブラックジャック（クリックプレイ）: 移行完了",
    statusLineChinchiro: "チンチロ（クリックプレイ）: 移行完了",
    statusLineSevens: "セブンズ（クリックプレイ）: 移行完了",
    statusLineDaifugo: "大富豪（クリックプレイ）: 移行完了",
    statusLineFourPanel: "4コマリレー（クリックプレイ）: 移行完了",
    statusLineDrawingRelay: "お絵かきリレー（クリックプレイ）: 移行完了",
    statusLineFitPuzzle: "フィットパズル（クリックプレイ）: 移行完了",
    statusLineMahjong: "麻雀ペア（クリックプレイ）: 移行完了",
    statusLinePoker: "ポーカー（クリックプレイ）: 移行完了",
    statusLineSolitaire: "ソリティア（クリックプレイ）: 移行完了",
    statusLineSurvivors: "Survivors（クリックプレイ）: 移行完了",
    statusLineMenu: "メニュー（ゲーム選択 + ルームUI）: 移行完了",
    latestScores: "最新スコア",
    loading: "読み込み中...",
    noScores: "スコアはまだありません。",
    tableId: "ID",
    tablePlayer: "プレイヤー",
    tableGame: "ゲーム",
    tableScore: "スコア",
    tableTime: "日時",
    gameOthello: "オセロ",
    gameShogi: "将棋",
    gameChess: "チェス",
    gameUno: "UNO",
    gameGomoku: "五目並べ",
    gameMinesweeper: "マインスイーパー",
    gameNumeron: "ヌメロン",
    gameBlackjack: "ブラックジャック",
    gameChinchiro: "チンチロ",
    gameSevens: "セブンズ",
    gameDaifugo: "大富豪",
    gameFourPanel: "4コマリレー",
    gameDrawingRelay: "お絵かきリレー",
    gameFitPuzzle: "フィットパズル",
    gameMahjong: "麻雀ペア",
    gamePoker: "ポーカー",
    gameSolitaire: "ソリティア",
    gameSurvivors: "Survivors",
    scoreLoadFailed: "スコア一覧の取得に失敗しました。Nest API が起動しているか確認してください。",
  },
  ko: {
    loginTitle: "로그인",
    loginLead: "기존 HTML 엔트리 흐름을 Next로 이전했습니다.",
    languageLabel: "Language",
    langJa: "日本語",
    langKo: "한국어",
    userId: "사용자 ID",
    password: "비밀번호",
    displayName: "표시 이름 (게임 내)",
    loginButton: "로그인하고 플레이",
    registerButton: "회원가입",
    guestButton: "게스트로 플레이",
    processing: "처리 중...",
    requireAuthFields: "사용자 ID와 비밀번호를 입력하세요.",
    loginLoading: "로그인 중...",
    loginFailed: "로그인에 실패했습니다. ID/비밀번호를 확인하세요.",
    registerLoading: "회원가입 중...",
    registerFailed: "회원가입에 실패했습니다. 이미 존재하는 ID일 수 있습니다.",
    registerSuccess: "회원가입이 완료되었습니다.",
    guestStarted: "게스트 모드로 시작했습니다.",
    appTitle: "Neon Board Arcade",
    appLead: "이 페이지에서 /scores 를 동일 URL 경유로 사용",
    backToLogin: "로그인으로 돌아가기",
    modeCloud: "Cloud",
    modeGuest: "Guest",
    tabMenu: "메뉴",
    tabOthello: "오셀로",
    tabGomoku: "오목",
    tabShogi: "장기",
    tabChess: "체스",
    tabUno: "UNO",
    tabMinesweeper: "지뢰찾기",
    tabNumeron: "뉴메론",
    tabBlackjack: "블랙잭",
    tabChinchiro: "친치로",
    tabSevens: "세븐즈",
    tabDaifugo: "대부호",
    tabFourPanel: "4컷 릴레이",
    tabDrawingRelay: "그림 릴레이",
    tabFitPuzzle: "핏 퍼즐",
    tabMahjong: "마작 페어",
    tabPoker: "포커",
    tabSolitaire: "솔리테어",
    tabSurvivors: "Survivors",
    tabScores: "점수",
    tabStatus: "마이그레이션 상태",
    menuTitle: "게임 선택 (Next 마이그레이션 메뉴)",
    menuLead: "기존 HTML 메뉴를 단계적으로 이전 중입니다. 먼저 오셀로, 오목, 체스, UNO로 이동할 수 있습니다.",
    playableLead: "Next 이전판에서 플레이 가능",
    checkScoresLead: "저장/목록 확인",
    migrationPlanned: "이전 예정",
    shogiLater: "장기 마이그레이션은 다음 단계에서 대응합니다.",
    chessLater: "체스 마이그레이션은 다음 단계에서 대응합니다.",
    roomTitle: "룸 조작 (이전 중)",
    roomServerUrl: "룸 서버 URL",
    roomCode: "룸 번호",
    roomCodePlaceholder: "6자리",
    roomPublic: "공개",
    roomPrivate: "비공개",
    roomCreate: "룸 생성",
    roomJoin: "룸 참가",
    roomDisconnect: "연결 해제",
    roomState: "상태",
    roomConnected: "연결된 룸",
    roomRole: "역할",
    roomRoleHost: "호스트",
    roomRoleGuest: "게스트",
    roomRoleSpectator: "관전자",
    roomMembers: "참가자",
    roomMembersEmpty: "없음",
    multiSyncTitle: "멀티 동기화",
    multiSyncEnabled: "동기화 ON",
    multiSyncDisabled: "동기화 OFF",
    chaosModeLabel: "카오스 모드",
    chaosModeOn: "ON",
    chaosModeOff: "OFF",
    syncHostOnlyHint: "호스트의 게임 상태를 룸 참가자에게 동기화합니다.",
    syncApplied: "룸의 최신 상태를 반영했습니다.",
    chaosEvent: "카오스 발동: {event}",
    roomCodeRequired: "룸 번호를 입력하세요.",
    roomJoinPreparing: "룸 {code} 접속 준비 중...",
    roomCandidate: "룸 후보: {code} ({visibility})",
    roomStateIdle: "미연결",
    roomStateConnecting: "연결 중...",
    roomStateConnected: "연결됨",
    roomStateConnectFailed: "연결 실패",
    roomStateError: "연결 오류",
    roomStateClosed: "연결 종료",
    roomTurnOwnerOnly: "지금 턴은 조작할 수 없습니다.",
    roomWaitingHostJudge: "호스트 판정 대기 중...",
    roomSpectatorReadonly: "관전 중이라 조작할 수 없습니다.",
    roomTurnCurrent: "현재 턴: {owner}",
    roomTurnYou: "나",
    roomTurnOpponent: "상대",
    roomTurnSpectator: "관전",
    roomUrlInvalid: "룸 서버 URL이 올바르지 않습니다.",
    roomConnectFailed: "룸 서버에 연결할 수 없습니다.",
    roomFull: "이 룸은 인원이 가득 찼습니다.",
    roomInGame: "이 룸은 게임 중입니다. 관전 모드는 다음에 지원 예정입니다.",
    roomInviteRequired: "이 룸은 비공개입니다. 초대 토큰 기능은 다음에 지원 예정입니다.",
    roomErrorPrefix: "룸 오류",
    roomErrRoomRequired: "룸 번호가 필요합니다.",
    roomErrHostOnly: "호스트만 실행할 수 있습니다.",
    roomErrTargetInvalid: "대상 플레이어가 올바르지 않습니다.",
    roomErrTargetRequired: "대상 플레이어를 지정하세요.",
    roomErrMessageIdRequired: "메시지 ID가 필요합니다.",
    roomErrMessageNotFound: "대상 메시지를 찾을 수 없습니다.",
    roomErrReportSelfForbidden: "자신의 메시지는 신고할 수 없습니다.",
    roomErrMuted: "뮤트 상태라 전송할 수 없습니다.",
    roomErrMessageNotOwned: "본인 메시지만 수정/회수할 수 있습니다.",
    roomErrMessageAlreadyRetracted: "이 메시지는 이미 회수되었습니다.",
    roomErrEditRetractExpired: "수정/회수 가능 시간이 지났습니다.",
    roomErrInvitePrivateOnly: "초대 토큰은 비공개 룸에서만 발급할 수 있습니다.",
    roomErrSpectatorOnly: "관전자 전용 기능입니다.",
    roomErrRematchVoteForbidden: "지금은 재대결 투표를 할 수 없습니다.",
    roomErrUnknown: "알 수 없는 오류 ({code})",
    visibilityPublic: "공개",
    visibilityPrivate: "비공개",
    othelloTitle: "오셀로 (Next 이전판)",
    othelloReset: "리셋",
    othelloTurnBlack: "흑 차례입니다",
    othelloPlayed: "{current}이(가) 두었습니다. {next} 차례입니다",
    othelloPass: "{next}은(는) 둘 수 없어 패스. {current} 차례입니다",
    othelloFinish: "종료: {result} (흑 {black} - 백 {white})",
    othelloResultDraw: "무승부",
    othelloResultBlackWin: "흑 승리",
    othelloResultWhiteWin: "백 승리",
    othelloChaosOverwriteStock: "덮어쓰기 잔여",
    othelloChaosImmutableStock: "고정 잔여",
    othelloChaosDestroyStock: "파괴 잔여",
    othelloChaosDoubleStock: "2회 행동 잔여",
    othelloChaosImmutableArm: "고정 예약",
    othelloChaosDestroyArm: "파괴 예약",
    othelloChaosDoubleArm: "2회 행동 예약",
    othelloChaosSkillArmed: "발동 대기",
    othelloChaosNeedOwnDisc: "자신의 돌을 선택하세요.",
    othelloChaosNeedInnerDisc: "고정은 안쪽 돌만 지정할 수 있습니다.",
    othelloChaosNeedMutableDisc: "고정/파괴된 칸에는 사용할 수 없습니다.",
    othelloChaosDestroySelectSacrifice: "희생할 자신의 돌을 선택하세요.",
    othelloChaosDestroySelectTarget: "파괴할 적 돌을 선택하세요.",
    othelloChaosDestroyDone: "파괴 스킬 발동",
    othelloChaosImmutableDone: "고정 스킬 발동",
    othelloChaosDoubleDone: "2회 행동이 발동했습니다",
    othelloChaosOverwrite: "덮어쓰기",
    othelloChaosFixed: "고정",
    othelloChaosDestroy: "파괴",
    othelloChaosDouble: "2회 행동",
    gomokuTitle: "오목 (Next 이전판)",
    gomokuReset: "리셋",
    gomokuTurnBlack: "흑 차례입니다",
    gomokuTurnWhite: "백 차례입니다",
    gomokuWin: "{winner} 승리",
    gomokuDraw: "무승부입니다",
    applyGomokuToScore: "흑 돌 수를 점수에 반영",
    appliedGomokuToScore: "오목 흑 돌 수를 점수 입력란에 반영했습니다.",
    chessTitle: "체스 (Next 이전판)",
    chessReset: "리셋",
    chessTurnWhite: "백 차례입니다",
    chessTurnBlack: "흑 차례입니다",
    chessSelectOwn: "자신의 말을 선택하세요.",
    chessIllegalMove: "해당 말은 그 칸으로 이동할 수 없습니다.",
    chessWin: "{winner} 승리 (킹을 잡았습니다)",
    chessApplyScore: "남은 말 수 차이를 점수에 반영",
    chessAppliedScore: "체스 남은 말 수 차이를 점수 입력란에 반영했습니다.",
    shogiTitle: "장기 (Next 이전판)",
    shogiReset: "리셋",
    shogiTurnBlack: "선수 차례입니다",
    shogiTurnWhite: "후수 차례입니다",
    shogiSelectOwn: "자신의 말을 선택하세요.",
    shogiIllegalMove: "해당 말은 그 칸으로 이동할 수 없습니다.",
    shogiWin: "{winner} 승리 (왕을 잡았습니다)",
    shogiApplyScore: "남은 말 수 차이를 점수에 반영",
    shogiAppliedScore: "장기 남은 말 수 차이를 점수 입력란에 반영했습니다.",
    minesTitle: "지뢰찾기 (Next 이전판)",
    minesReset: "리셋",
    minesHint: "칸을 열어 지뢰를 피하세요.",
    minesGameOver: "지뢰를 밟았습니다.",
    minesCleared: "클리어했습니다.",
    minesApplyScore: "연 칸 수를 점수에 반영",
    minesAppliedScore: "연 칸 수를 점수 입력란에 반영했습니다.",
    numeronTitle: "뉴메론 (Next 이전판)",
    numeronReset: "리셋",
    numeronHint: "0-9 숫자를 중복 없이 3자리로 선택해 추측하세요.",
    numeronGuess: "추측",
    numeronClearDraft: "입력 지우기",
    numeronSubmitGuess: "판정",
    numeronInvalidGuess: "중복 없는 3자리 숫자를 입력하세요.",
    numeronResult: "{guess}: {hits} HIT / {blows} BLOW",
    numeronWin: "정답입니다!",
    numeronApplyScore: "시도 횟수로 점수 반영",
    numeronAppliedScore: "뉴메론 시도 횟수를 점수 입력란에 반영했습니다.",
    numeronHistory: "기록",
    numeronSecretLabel: "시크릿",
    blackjackTitle: "블랙잭 (Next 이전판)",
    blackjackReset: "다시 배분",
    blackjackYourTurn: "당신의 차례입니다. HIT 또는 STAND를 선택하세요.",
    blackjackDealerTurn: "딜러 차례입니다...",
    blackjackBust: "버스트했습니다. 당신의 패배입니다.",
    blackjackWin: "당신의 승리입니다.",
    blackjackLose: "딜러의 승리입니다.",
    blackjackPush: "무승부입니다.",
    blackjackHit: "HIT",
    blackjackStand: "STAND",
    blackjackDealer: "딜러",
    blackjackPlayer: "당신",
    blackjackApplyScore: "손패 합계를 점수에 반영",
    blackjackAppliedScore: "블랙잭 손패 합계를 점수 입력란에 반영했습니다.",
    chinchiroTitle: "친치로 (Next 이전판)",
    chinchiroReset: "리셋",
    chinchiroRoll: "ROLL",
    chinchiroHint: "ROLL로 주사위를 굴려 승부합니다.",
    chinchiroWin: "당신의 승리",
    chinchiroLose: "딜러의 승리",
    chinchiroDraw: "무승부",
    chinchiroPlayer: "당신",
    chinchiroDealer: "딜러",
    chinchiroResultLine: "{player} / {dealer} → {result}",
    chinchiroPinzoro: "핀조로",
    chinchiroArashi: "아라시",
    chinchiroShigoro: "시고로",
    chinchiroHifumi: "히후미",
    chinchiroButa: "부타",
    chinchiroPoint: "{eye} 눈",
    chinchiroApplyScore: "승부 결과를 점수에 반영",
    chinchiroAppliedScore: "친치로 결과를 점수 입력란에 반영했습니다.",
    sevensTitle: "세븐즈 (Next 이전판)",
    sevensReset: "리셋",
    sevensPass: "패스",
    sevensYourTurn: "당신의 차례입니다. 낼 수 있는 카드를 선택하세요.",
    sevensCpuTurn: "CPU 차례입니다...",
    sevensNoPlayable: "낼 수 있는 카드가 없습니다.",
    sevensPlayerWin: "당신의 승리입니다.",
    sevensCpuWin: "CPU의 승리입니다.",
    sevensDraw: "무승부입니다.",
    sevensPlayerHand: "내 손패",
    sevensCpuHand: "CPU 손패",
    sevensPassCount: "패스 횟수",
    sevensApplyScore: "남은 손패 차이를 점수에 반영",
    sevensAppliedScore: "세븐즈 남은 손패 차이를 점수 입력란에 반영했습니다.",
    daifugoTitle: "대부호 (Next 이전판)",
    daifugoReset: "다시 배분",
    daifugoYourTurn: "당신의 차례입니다. 테이블 카드보다 높은 카드를 내세요.",
    daifugoCpuTurn: "CPU 차례입니다...",
    daifugoPass: "패스",
    daifugoTable: "테이블 카드",
    daifugoYourHand: "내 손패",
    daifugoCpuHand: "CPU 손패",
    daifugoPlayerWin: "당신의 승리입니다.",
    daifugoCpuWin: "CPU의 승리입니다.",
    daifugoPassInfo: "{who} 이(가) 패스했습니다.",
    daifugoRoundClear: "전원 패스로 테이블을 비웠습니다.",
    daifugoNeedHigher: "테이블 카드보다 높은 카드를 선택하세요.",
    daifugoApplyScore: "남은 손패 차이를 점수에 반영",
    daifugoAppliedScore: "대부호 남은 손패 차이를 점수 입력란에 반영했습니다.",
    fourPanelTitle: "4컷 릴레이 (Next 이전판)",
    fourPanelReset: "리셋",
    fourPanelSubmit: "이 컷 확정",
    fourPanelClear: "그림 지우기",
    fourPanelHint: "컷을 그리고 확정하면 다음 컷으로 진행합니다.",
    fourPanelNotDrawn: "컷이 비어 있습니다. 그린 뒤 확정하세요.",
    fourPanelDone: "4컷 완성입니다.",
    fourPanelProgress: "PANEL {current} / 4",
    fourPanelStoryTitle: "주제",
    fourPanelApplyScore: "완성도를 점수에 반영",
    fourPanelAppliedScore: "4컷 진행도를 점수 입력란에 반영했습니다.",
    drawingRelayTitle: "그림 릴레이 (Next 이전판)",
    drawingRelayReset: "리셋",
    drawingRelayHintDraw: "주제를 보고 그림을 그리세요.",
    drawingRelayHintGuess: "완성된 그림을 보고 답을 입력하세요.",
    drawingRelayPrompt: "주제",
    drawingRelayGuess: "정답",
    drawingRelaySubmitDrawing: "그림 확정",
    drawingRelaySubmitGuess: "정답 확정",
    drawingRelayClear: "그림 지우기",
    drawingRelayNotDrawn: "아직 그림이 없습니다.",
    drawingRelayNeedGuess: "정답을 입력하세요.",
    drawingRelayDone: "릴레이 완료: 주제 {prompt} / 정답 {guess}",
    drawingRelayApplyScore: "일치도를 점수에 반영",
    drawingRelayAppliedScore: "그림 릴레이 결과를 점수 입력란에 반영했습니다.",
    fitPuzzleTitle: "핏 퍼즐 (Next 이전판)",
    fitPuzzleReset: "셔플",
    fitPuzzleHint: "인접 타일을 클릭해서 1-8 순서로 맞추세요.",
    fitPuzzleOnlyAdjacent: "빈칸 옆 타일만 움직일 수 있습니다.",
    fitPuzzleProgress: "이동 수: {moves}",
    fitPuzzleSolved: "클리어! 이동 수: {moves}",
    fitPuzzleMoves: "이동 수",
    fitPuzzleApplyScore: "이동 수로 점수 반영",
    fitPuzzleAppliedScore: "핏 퍼즐 결과를 점수 입력란에 반영했습니다.",
    mahjongTitle: "마작 페어 (Next 이전판)",
    mahjongReset: "다시 배치",
    mahjongShuffle: "셔플",
    mahjongHintButton: "힌트",
    mahjongHint: "같은 패 2장을 선택해 제거하세요.",
    mahjongNoHint: "현재 제거 가능한 페어가 없습니다. 셔플하세요.",
    mahjongHintLine: "힌트: {a} 와 {b}",
    mahjongRemoved: "페어를 제거했습니다.",
    mahjongRemovedAndShuffle: "페어를 제거했고, 수가 없어 자동 셔플했습니다.",
    mahjongBlocked: "같은 패이지만 2번 이내로 꺾는 경로가 없습니다.",
    mahjongSwitched: "선택을 변경했습니다.",
    mahjongClear: "클리어! 모든 패를 제거했습니다.",
    mahjongRemaining: "남은 패: {count}",
    mahjongApplyScore: "진행도를 점수에 반영",
    mahjongAppliedScore: "마작 페어 결과를 점수 입력란에 반영했습니다.",
    pokerTitle: "포커 (Next 이전판)",
    pokerDeal: "다시 배분",
    pokerDraw: "카드 교체",
    pokerHint: "남길 카드를 선택한 뒤 교체하세요.",
    pokerReady: "교체가 완료되었습니다. 결과를 확인하세요.",
    pokerPlayerHand: "내 패",
    pokerCpuHand: "CPU 패",
    pokerResultWin: "당신의 승리입니다.",
    pokerResultLose: "CPU의 승리입니다.",
    pokerResultDraw: "무승부입니다.",
    pokerApplyScore: "승패를 점수에 반영",
    pokerAppliedScore: "포커 결과를 점수 입력란에 반영했습니다.",
    pokerHeld: "고정",
    pokerHandHighCard: "하이카드",
    pokerHandOnePair: "원페어",
    pokerHandTwoPair: "투페어",
    pokerHandThreeKind: "트리플",
    pokerHandStraight: "스트레이트",
    pokerHandFlush: "플러시",
    pokerHandFullHouse: "풀하우스",
    pokerHandFourKind: "포카드",
    pokerHandStraightFlush: "스트레이트 플러시",
    solitaireTitle: "솔리테어 (Next 이전판)",
    solitaireReset: "다시 배분",
    solitaireStock: "덱",
    solitaireWaste: "버림",
    solitaireHint: "카드를 선택한 뒤 이동할 곳을 클릭하세요.",
    solitaireInvalidMove: "그 위치로는 이동할 수 없습니다.",
    solitaireSelected: "이동할 위치를 선택하세요.",
    solitaireCleared: "클리어! 모든 카드를 기초 더미로 옮겼습니다.",
    solitaireFoundations: "기초 더미 수: {count}",
    solitaireApplyScore: "진행도를 점수에 반영",
    solitaireAppliedScore: "솔리테어 결과를 점수 입력란에 반영했습니다.",
    survivorsTitle: "Survivors (Next 이전판)",
    survivorsReset: "재시작",
    survivorsHint: "적을 클릭해 처치하고 최대한 오래 생존하세요.",
    survivorsWave: "WAVE {wave}",
    survivorsHp: "HP {hp}/{max}",
    survivorsLevel: "LV {level}",
    survivorsTime: "TIME {sec}s",
    survivorsKills: "KILL {count}",
    survivorsAttack: "ATTACK",
    survivorsWaveClear: "WAVE {wave} 클리어! 다음 웨이브가 시작됩니다.",
    survivorsGameOver: "게임 오버... 재시작으로 다시 도전하세요.",
    survivorsApplyScore: "생존 결과를 점수에 반영",
    survivorsAppliedScore: "Survivors 결과를 점수 입력란에 반영했습니다.",
    unoTitle: "UNO (Next 이전판)",
    unoReset: "리셋",
    unoYourTurn: "내 차례입니다. 낼 수 있는 카드를 선택하거나 한 장 뽑으세요.",
    unoCpuTurn: "CPU 차례입니다...",
    unoPlayerWin: "당신의 승리입니다.",
    unoCpuWin: "CPU의 승리입니다.",
    unoDrawCard: "한 장 뽑기",
    unoTopCard: "중앙 카드",
    unoYourHand: "내 손패",
    unoCpuHand: "CPU 손패",
    unoNoPlayable: "낼 수 있는 카드가 없습니다.",
    unoPlayedCard: "{who} 이(가) {card} 카드를 냈습니다.",
    unoDrewCard: "{who} 이(가) 카드 1장을 뽑았습니다.",
    unoApplyScore: "남은 손패 차이를 점수에 반영",
    unoAppliedScore: "UNO 남은 손패 차이를 점수 입력란에 반영했습니다.",
    blackStone: "흑",
    whiteStone: "백",
    applyBlackToScore: "흑 돌 수를 점수에 반영",
    appliedBlackToScore: "흑 돌 수를 점수 입력란에 반영했습니다.",
    scoreFormTitle: "점수 등록",
    playerNameLabel: "플레이어 이름",
    gameLabel: "게임",
    scoreLabel: "점수",
    scoreSaving: "저장 중...",
    scoreSave: "점수 저장",
    scoreSaved: "점수를 저장했습니다.",
    scoreSaveFailed: "점수 저장에 실패했습니다.",
    statusTitle: "마이그레이션 상태",
    reload: "다시 불러오기",
    statusLine1: "API 단일 URL화: 완료 (Next rewrite 경유)",
    statusLine2: "점수 저장/조회: 완료",
    statusLine3: "오셀로 (클릭 플레이): 이전 완료",
    statusLine4: "기타 게임: Next로 순차 이전 예정",
    statusLineGomoku: "오목 (클릭 플레이): 이전 완료",
    statusLineUno: "UNO (턴제 플레이): 이전 완료",
    statusLineChess: "체스 (클릭 플레이): 이전 완료",
    statusLineShogi: "장기 (클릭 플레이): 이전 완료",
    statusLineMines: "지뢰찾기 (클릭 플레이): 이전 완료",
    statusLineNumeron: "뉴메론 (클릭 플레이): 이전 완료",
    statusLineBlackjack: "블랙잭 (클릭 플레이): 이전 완료",
    statusLineChinchiro: "친치로 (클릭 플레이): 이전 완료",
    statusLineSevens: "세븐즈 (클릭 플레이): 이전 완료",
    statusLineDaifugo: "대부호 (클릭 플레이): 이전 완료",
    statusLineFourPanel: "4컷 릴레이 (클릭 플레이): 이전 완료",
    statusLineDrawingRelay: "그림 릴레이 (클릭 플레이): 이전 완료",
    statusLineFitPuzzle: "핏 퍼즐 (클릭 플레이): 이전 완료",
    statusLineMahjong: "마작 페어 (클릭 플레이): 이전 완료",
    statusLinePoker: "포커 (클릭 플레이): 이전 완료",
    statusLineSolitaire: "솔리테어 (클릭 플레이): 이전 완료",
    statusLineSurvivors: "Survivors (클릭 플레이): 이전 완료",
    statusLineMenu: "메뉴 (게임 선택 + 룸 UI): 이전 완료",
    latestScores: "최신 점수",
    loading: "불러오는 중...",
    noScores: "아직 점수가 없습니다.",
    tableId: "ID",
    tablePlayer: "플레이어",
    tableGame: "게임",
    tableScore: "점수",
    tableTime: "시간",
    gameOthello: "오셀로",
    gameShogi: "장기",
    gameChess: "체스",
    gameUno: "UNO",
    gameGomoku: "오목",
    gameMinesweeper: "지뢰찾기",
    gameNumeron: "뉴메론",
    gameBlackjack: "블랙잭",
    gameChinchiro: "친치로",
    gameSevens: "세븐즈",
    gameDaifugo: "대부호",
    gameFourPanel: "4컷 릴레이",
    gameDrawingRelay: "그림 릴레이",
    gameFitPuzzle: "핏 퍼즐",
    gameMahjong: "마작 페어",
    gamePoker: "포커",
    gameSolitaire: "솔리테어",
    gameSurvivors: "Survivors",
    scoreLoadFailed: "점수 목록을 불러오지 못했습니다. Nest API 실행 여부를 확인하세요.",
  },
} as const;

const GAME_OPTIONS = [
  { id: "othello" },
  { id: "shogi" },
  { id: "chess" },
  { id: "uno" },
  { id: "gomoku" },
  { id: "minesweeper" },
  { id: "numeron" },
  { id: "blackjack" },
  { id: "chinchiro" },
  { id: "sevens" },
  { id: "daifugo" },
  { id: "fourPanel" },
  { id: "drawingRelay" },
  { id: "fitPuzzle" },
  { id: "mahjong" },
  { id: "poker" },
  { id: "solitaire" },
  { id: "survivors" },
];

type Cell = 0 | 1 | 2;
type UnoColor = "R" | "G" | "B" | "Y";
type UnoCard = {
  color: UnoColor;
  value: number;
};
type ChessColor = "w" | "b";
type ChessPieceType = "K" | "Q" | "R" | "B" | "N" | "P";
type ChessPiece = {
  color: ChessColor;
  type: ChessPieceType;
};
type ShogiColor = "b" | "w";
type ShogiPieceType = "K" | "R" | "B" | "G" | "S" | "N" | "L" | "P";
type ShogiPiece = {
  color: ShogiColor;
  type: ShogiPieceType;
};
type MineCell = {
  mine: boolean;
  open: boolean;
  around: number;
};
type NumeronHistory = {
  guess: string;
  hits: number;
  blows: number;
};
type BlackjackCard = {
  suit: "S" | "H" | "D" | "C";
  rank: number;
};
type ChinchiroHand = {
  key: "pinzoro" | "arashi" | "shigoro" | "hifumi" | "point" | "buta";
  rank: number;
  eye: number;
};
type SevensCard = {
  suit: "S" | "H" | "D" | "C";
  rank: number;
};
type SevensTableRange = {
  low: number | null;
  high: number | null;
};
type DaifugoCard = {
  suit: "S" | "H" | "D" | "C";
  rank: number;
};
type PokerSuit = "S" | "H" | "D" | "C";
type PokerCard = {
  suit: PokerSuit;
  rank: number;
};
type PokerEval = {
  score: number[];
  name:
    | "highCard"
    | "onePair"
    | "twoPair"
    | "threeKind"
    | "straight"
    | "flush"
    | "fullHouse"
    | "fourKind"
    | "straightFlush";
};
type SolitaireSuit = "H" | "D" | "C" | "S";
type SolitaireCard = {
  suit: SolitaireSuit;
  rank: number;
  faceUp: boolean;
};
type SolitaireSelection =
  | { from: "waste" }
  | { from: "tableau"; col: number; index: number };
type SurvivorsEnemy = {
  id: string;
  hp: number;
  maxHp: number;
};
type MahjongCell = number | null;
type MahjongCoord = {
  row: number;
  col: number;
};

const FOUR_PANEL_RANDOM_TITLES = [
  "朝から大事件",
  "宇宙人のアルバイト",
  "猫とロボの休日",
  "伝説のプリン",
  "秘密基地の夜",
  "温泉でタイムスリップ",
];

const DRAWING_RELAY_PROMPTS = [
  "空飛ぶラーメン屋",
  "筋トレするペンギン",
  "迷子のロボット",
  "宇宙を泳ぐ金魚",
  "ドラゴンと文化祭",
  "秘密基地の夜",
];

const FIT_PUZZLE_SIZE = 3;
const MAHJONG_ROWS = 6;
const MAHJONG_COLS = 8;
const MAHJONG_TYPE_COUNT = 16;
const MAHJONG_TILE_LABELS = [
  "M1",
  "M2",
  "M3",
  "M4",
  "M5",
  "M6",
  "M7",
  "M8",
  "M9",
  "P1",
  "P2",
  "P3",
  "P4",
  "P5",
  "P6",
  "P7",
  "P8",
  "P9",
  "S1",
  "S2",
  "S3",
  "S4",
  "S5",
  "S6",
  "S7",
  "S8",
  "S9",
  "E",
  "S",
  "W",
  "N",
  "Wh",
  "G",
  "R",
] as const;
const MAHJONG_DIRECTIONS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;

function mahjongTileLabel(id: number): string {
  if (!Number.isInteger(id) || id < 0) return "?";
  return MAHJONG_TILE_LABELS[id % MAHJONG_TILE_LABELS.length] || "?";
}

function createMahjongGrid(rows: number, cols: number, value: MahjongCell = null): MahjongCell[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => value));
}

function cloneMahjongBoard(board: MahjongCell[][]): MahjongCell[][] {
  return board.map((row) => [...row]);
}

function shuffleNumberList(list: number[]): number[] {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function mahjongAllTileCoords(board: MahjongCell[][]): MahjongCoord[] {
  const coords: MahjongCoord[] = [];
  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      if (board[row][col] !== null) coords.push({ row, col });
    }
  }
  return coords;
}

function mahjongRemainingCount(board: MahjongCell[][]): number {
  return mahjongAllTileCoords(board).length;
}

function mahjongCanConnectWithTwoTurns(board: MahjongCell[][], a: MahjongCoord, b: MahjongCoord): boolean {
  if (a.row === b.row && a.col === b.col) return false;

  const rows = board.length;
  const cols = board[0]?.length || 0;
  const start = { row: a.row + 1, col: a.col + 1 };
  const target = { row: b.row + 1, col: b.col + 1 };

  const inRange = (row: number, col: number) => row >= 0 && row <= rows + 1 && col >= 0 && col <= cols + 1;
  const isBlocked = (row: number, col: number) => {
    if (row === target.row && col === target.col) return false;
    if (row <= 0 || row > rows || col <= 0 || col > cols) return false;
    return board[row - 1][col - 1] !== null;
  };

  const visited = Array.from({ length: rows + 2 }, () =>
    Array.from({ length: cols + 2 }, () => Array.from({ length: 4 }, () => 3)),
  );

  const queue: Array<{ row: number; col: number; dir: number; turns: number }> = [
    { row: start.row, col: start.col, dir: -1, turns: 0 },
  ];

  let head = 0;
  while (head < queue.length) {
    const current = queue[head];
    head += 1;

    for (let dirIndex = 0; dirIndex < 4; dirIndex += 1) {
      const turns = current.dir === -1 || current.dir === dirIndex ? current.turns : current.turns + 1;
      if (turns > 2) continue;

      const [dr, dc] = MAHJONG_DIRECTIONS[dirIndex];
      let nextRow = current.row + dr;
      let nextCol = current.col + dc;

      while (inRange(nextRow, nextCol) && !isBlocked(nextRow, nextCol)) {
        if (turns < visited[nextRow][nextCol][dirIndex]) {
          visited[nextRow][nextCol][dirIndex] = turns;
          if (nextRow === target.row && nextCol === target.col) {
            return true;
          }
          queue.push({ row: nextRow, col: nextCol, dir: dirIndex, turns });
        }
        nextRow += dr;
        nextCol += dc;
      }
    }
  }

  return false;
}

function mahjongFindFirstMove(board: MahjongCell[][]): { a: MahjongCoord; b: MahjongCoord } | null {
  const coords = mahjongAllTileCoords(board);
  for (let i = 0; i < coords.length; i += 1) {
    const a = coords[i];
    const tileId = board[a.row][a.col];
    for (let j = i + 1; j < coords.length; j += 1) {
      const b = coords[j];
      if (board[b.row][b.col] !== tileId) continue;
      if (mahjongCanConnectWithTwoTurns(board, a, b)) {
        return { a, b };
      }
    }
  }
  return null;
}

function reshuffleMahjongBoard(board: MahjongCell[][]): MahjongCell[][] {
  const coords = mahjongAllTileCoords(board);
  const tiles = coords
    .map((coord) => board[coord.row][coord.col])
    .filter((tile): tile is number => typeof tile === "number");
  const shuffled = shuffleNumberList(tiles);
  const next = cloneMahjongBoard(board);
  coords.forEach((coord, index) => {
    next[coord.row][coord.col] = shuffled[index] ?? null;
  });
  return next;
}

function ensureMahjongPlayable(board: MahjongCell[][]): MahjongCell[][] {
  let next = cloneMahjongBoard(board);
  if (mahjongRemainingCount(next) === 0) return next;
  for (let attempt = 0; attempt < 24; attempt += 1) {
    if (mahjongFindFirstMove(next)) return next;
    next = reshuffleMahjongBoard(next);
  }
  return next;
}

function createMahjongStartBoard(): MahjongCell[][] {
  const cells = MAHJONG_ROWS * MAHJONG_COLS;
  const pairCount = Math.floor(cells / 2);
  const deck: number[] = [];

  for (let i = 0; i < pairCount; i += 1) {
    const id = i % MAHJONG_TYPE_COUNT;
    deck.push(id, id);
  }

  const shuffled = shuffleNumberList(deck);
  const board = createMahjongGrid(MAHJONG_ROWS, MAHJONG_COLS, null);

  let index = 0;
  for (let row = 0; row < MAHJONG_ROWS; row += 1) {
    for (let col = 0; col < MAHJONG_COLS; col += 1) {
      board[row][col] = shuffled[index] ?? null;
      index += 1;
    }
  }

  return ensureMahjongPlayable(board);
}

function createFitPuzzleSolvedTiles(): number[] {
  return [1, 2, 3, 4, 5, 6, 7, 8, 0];
}

function fitPuzzleCanMove(index: number, blankIndex: number): boolean {
  const row = Math.floor(index / FIT_PUZZLE_SIZE);
  const col = index % FIT_PUZZLE_SIZE;
  const blankRow = Math.floor(blankIndex / FIT_PUZZLE_SIZE);
  const blankCol = blankIndex % FIT_PUZZLE_SIZE;
  return Math.abs(row - blankRow) + Math.abs(col - blankCol) === 1;
}

function isFitPuzzleSolved(tiles: number[]): boolean {
  const solved = createFitPuzzleSolvedTiles();
  return solved.every((tile, index) => tiles[index] === tile);
}

function createFitPuzzleShuffledTiles(stepCount = 80): number[] {
  const tiles = createFitPuzzleSolvedTiles();
  let blankIndex = tiles.indexOf(0);

  for (let step = 0; step < stepCount; step += 1) {
    const candidates: number[] = [];
    for (let index = 0; index < tiles.length; index += 1) {
      if (fitPuzzleCanMove(index, blankIndex)) {
        candidates.push(index);
      }
    }
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    if (pick === undefined) continue;
    [tiles[pick], tiles[blankIndex]] = [tiles[blankIndex], tiles[pick]];
    blankIndex = pick;
  }

  if (isFitPuzzleSolved(tiles)) {
    [tiles[7], tiles[8]] = [tiles[8], tiles[7]];
  }

  return tiles;
}

const BOARD_SIZE = 8;
const GOMOKU_SIZE = 15;
const UNO_COLORS: UnoColor[] = ["R", "G", "B", "Y"];
const OTHELLO_DEFAULT_OVERWRITE = 2;
const OTHELLO_DEFAULT_IMMUTABLE = 1;
const OTHELLO_DEFAULT_DESTROY = 1;
const OTHELLO_CORNER_SACRIFICE_DESTROY_COUNT = 3;
const OTHELLO_NO_CORNER_SACRIFICE_COUNT = 2;
const OTHELLO_NO_CORNER_DESTROY_COUNT = 1;
const STORAGE_CLOUD_USER_ID_KEY = "neon-cloud-user-id";
const STORAGE_CLOUD_PASSWORD_KEY = "neon-cloud-password";
const STORAGE_LANGUAGE_KEY = "neon-ui-language";
const DIRECTIONS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
] as const;

function createInitialBoard(): Cell[][] {
  const board = Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => 0 as Cell));
  board[3][3] = 2;
  board[3][4] = 1;
  board[4][3] = 1;
  board[4][4] = 2;
  return board;
}

function createOthelloChaosMask(): boolean[][] {
  return Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => false));
}

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function isOthelloCorner(row: number, col: number): boolean {
  return (row === 0 || row === BOARD_SIZE - 1) && (col === 0 || col === BOARD_SIZE - 1);
}

function othelloPlayerIndex(player: 1 | 2): 0 | 1 {
  return player === 1 ? 0 : 1;
}

function getFlips(board: Cell[][], row: number, col: number, player: 1 | 2): Array<[number, number]> {
  if (!inBounds(row, col) || board[row][col] !== 0) return [];
  const enemy: Cell = player === 1 ? 2 : 1;
  const flips: Array<[number, number]> = [];

  for (const [dr, dc] of DIRECTIONS) {
    let r = row + dr;
    let c = col + dc;
    const line: Array<[number, number]> = [];

    while (inBounds(r, c) && board[r][c] === enemy) {
      line.push([r, c]);
      r += dr;
      c += dc;
    }

    if (line.length > 0 && inBounds(r, c) && board[r][c] === player) {
      flips.push(...line);
    }
  }

  return flips;
}

function hasMove(board: Cell[][], player: 1 | 2): boolean {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (getFlips(board, row, col, player).length > 0) {
        return true;
      }
    }
  }
  return false;
}

function countStones(board: Cell[][]): { black: number; white: number } {
  let black = 0;
  let white = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell === 1) black += 1;
      if (cell === 2) white += 1;
    }
  }
  return { black, white };
}

function createGomokuBoard(): Cell[][] {
  return Array.from({ length: GOMOKU_SIZE }, () => Array.from({ length: GOMOKU_SIZE }, () => 0 as Cell));
}

function inGomokuBounds(row: number, col: number): boolean {
  return row >= 0 && row < GOMOKU_SIZE && col >= 0 && col < GOMOKU_SIZE;
}

function hasFiveInRow(board: Cell[][], row: number, col: number, player: 1 | 2): boolean {
  const dirs = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ] as const;

  for (const [dr, dc] of dirs) {
    let count = 1;

    let r = row + dr;
    let c = col + dc;
    while (inGomokuBounds(r, c) && board[r][c] === player) {
      count += 1;
      r += dr;
      c += dc;
    }

    r = row - dr;
    c = col - dc;
    while (inGomokuBounds(r, c) && board[r][c] === player) {
      count += 1;
      r -= dr;
      c -= dc;
    }

    if (count >= 5) return true;
  }

  return false;
}

function createUnoDeck(): UnoCard[] {
  const deck: UnoCard[] = [];
  for (const color of UNO_COLORS) {
    for (let value = 0; value <= 9; value += 1) {
      deck.push({ color, value });
      if (value !== 0) {
        deck.push({ color, value });
      }
    }
  }
  return deck;
}

function shuffleCards(cards: UnoCard[]): UnoCard[] {
  const next = [...cards];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function canPlayCard(card: UnoCard, top: UnoCard): boolean {
  return card.color === top.color || card.value === top.value;
}

function createChessBoard(): Array<Array<ChessPiece | null>> {
  const empty = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null as ChessPiece | null));

  const back: ChessPieceType[] = ["R", "N", "B", "Q", "K", "B", "N", "R"];
  for (let col = 0; col < 8; col += 1) {
    empty[0][col] = { color: "b", type: back[col] };
    empty[1][col] = { color: "b", type: "P" };
    empty[6][col] = { color: "w", type: "P" };
    empty[7][col] = { color: "w", type: back[col] };
  }

  return empty;
}

function inChessBounds(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function isLineClear(
  board: Array<Array<ChessPiece | null>>,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
): boolean {
  const dr = Math.sign(toRow - fromRow);
  const dc = Math.sign(toCol - fromCol);
  let row = fromRow + dr;
  let col = fromCol + dc;
  while (row !== toRow || col !== toCol) {
    if (board[row][col]) return false;
    row += dr;
    col += dc;
  }
  return true;
}

function isLegalChessMove(
  board: Array<Array<ChessPiece | null>>,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  turn: ChessColor,
): boolean {
  if (!inChessBounds(fromRow, fromCol) || !inChessBounds(toRow, toCol)) return false;
  if (fromRow === toRow && fromCol === toCol) return false;

  const piece = board[fromRow][fromCol];
  if (!piece || piece.color !== turn) return false;

  const target = board[toRow][toCol];
  if (target && target.color === piece.color) return false;

  const dr = toRow - fromRow;
  const dc = toCol - fromCol;
  const absDr = Math.abs(dr);
  const absDc = Math.abs(dc);

  if (piece.type === "K") {
    return absDr <= 1 && absDc <= 1;
  }

  if (piece.type === "Q") {
    const straight = dr === 0 || dc === 0;
    const diagonal = absDr === absDc;
    if (!straight && !diagonal) return false;
    return isLineClear(board, fromRow, fromCol, toRow, toCol);
  }

  if (piece.type === "R") {
    if (!(dr === 0 || dc === 0)) return false;
    return isLineClear(board, fromRow, fromCol, toRow, toCol);
  }

  if (piece.type === "B") {
    if (absDr !== absDc) return false;
    return isLineClear(board, fromRow, fromCol, toRow, toCol);
  }

  if (piece.type === "N") {
    return (absDr === 1 && absDc === 2) || (absDr === 2 && absDc === 1);
  }

  if (piece.type === "P") {
    const dir = piece.color === "w" ? -1 : 1;
    const startRow = piece.color === "w" ? 6 : 1;
    if (dc === 0) {
      if (dr === dir && !target) return true;
      if (fromRow === startRow && dr === dir * 2 && !target && !board[fromRow + dir][fromCol]) return true;
      return false;
    }
    if (absDc === 1 && dr === dir) {
      return Boolean(target && target.color !== piece.color);
    }
    return false;
  }

  return false;
}

function createShogiBoard(): Array<Array<ShogiPiece | null>> {
  const board = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => null as ShogiPiece | null));
  const back: ShogiPieceType[] = ["L", "N", "S", "G", "K", "G", "S", "N", "L"];

  for (let col = 0; col < 9; col += 1) {
    board[0][col] = { color: "w", type: back[col] };
    board[2][col] = { color: "w", type: "P" };
    board[6][col] = { color: "b", type: "P" };
    board[8][col] = { color: "b", type: back[col] };
  }
  board[1][1] = { color: "w", type: "B" };
  board[1][7] = { color: "w", type: "R" };
  board[7][1] = { color: "b", type: "R" };
  board[7][7] = { color: "b", type: "B" };

  return board;
}

function inShogiBounds(row: number, col: number): boolean {
  return row >= 0 && row < 9 && col >= 0 && col < 9;
}

function isShogiPathClear(
  board: Array<Array<ShogiPiece | null>>,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
): boolean {
  const dr = Math.sign(toRow - fromRow);
  const dc = Math.sign(toCol - fromCol);
  let row = fromRow + dr;
  let col = fromCol + dc;
  while (row !== toRow || col !== toCol) {
    if (board[row][col]) return false;
    row += dr;
    col += dc;
  }
  return true;
}

function isLegalShogiMove(
  board: Array<Array<ShogiPiece | null>>,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  turn: ShogiColor,
): boolean {
  if (!inShogiBounds(fromRow, fromCol) || !inShogiBounds(toRow, toCol)) return false;
  if (fromRow === toRow && fromCol === toCol) return false;

  const piece = board[fromRow][fromCol];
  if (!piece || piece.color !== turn) return false;
  const target = board[toRow][toCol];
  if (target && target.color === piece.color) return false;

  const dr = toRow - fromRow;
  const dc = toCol - fromCol;
  const absDr = Math.abs(dr);
  const absDc = Math.abs(dc);
  const dir = piece.color === "b" ? -1 : 1;
  const fdr = dr * dir;

  if (piece.type === "K") return absDr <= 1 && absDc <= 1;

  if (piece.type === "G") {
    return (
      (fdr === 1 && absDc <= 1)
      || (fdr === 0 && absDc === 1)
      || (fdr === -1 && dc === 0)
    );
  }

  if (piece.type === "S") {
    return (fdr === 1 && absDc <= 1) || (fdr === -1 && absDc === 1);
  }

  if (piece.type === "N") {
    return fdr === 2 && absDc === 1;
  }

  if (piece.type === "L") {
    if (dc !== 0 || fdr <= 0) return false;
    return isShogiPathClear(board, fromRow, fromCol, toRow, toCol);
  }

  if (piece.type === "P") {
    return fdr === 1 && dc === 0;
  }

  if (piece.type === "R") {
    if (!(dr === 0 || dc === 0)) return false;
    return isShogiPathClear(board, fromRow, fromCol, toRow, toCol);
  }

  if (piece.type === "B") {
    if (absDr !== absDc) return false;
    return isShogiPathClear(board, fromRow, fromCol, toRow, toCol);
  }

  return false;
}

function createMinesweeperBoard(size = 9, mineCount = 10): MineCell[][] {
  const board = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ mine: false, open: false, around: 0 } as MineCell)),
  );

  let placed = 0;
  while (placed < mineCount) {
    const row = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);
    if (board[row][col].mine) continue;
    board[row][col].mine = true;
    placed += 1;
  }

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (board[row][col].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr += 1) {
        for (let dc = -1; dc <= 1; dc += 1) {
          if (dr === 0 && dc === 0) continue;
          const nr = row + dr;
          const nc = col + dc;
          if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
          if (board[nr][nc].mine) count += 1;
        }
      }
      board[row][col].around = count;
    }
  }

  return board;
}

function openMinesCell(board: MineCell[][], row: number, col: number): MineCell[][] {
  const size = board.length;
  const next = board.map((line) => line.map((cell) => ({ ...cell })));
  const queue: Array<[number, number]> = [[row, col]];

  while (queue.length > 0) {
    const [r, c] = queue.shift() as [number, number];
    if (r < 0 || r >= size || c < 0 || c >= size) continue;
    const cell = next[r][c];
    if (cell.open) continue;
    cell.open = true;
    if (cell.mine) continue;
    if (cell.around > 0) continue;

    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        if (dr === 0 && dc === 0) continue;
        queue.push([r + dr, c + dc]);
      }
    }
  }

  return next;
}

function createNumeronSecret(length = 3): string {
  const digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  for (let i = digits.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits.slice(0, length).join("");
}

function evaluateNumeron(secret: string, guess: string): { hits: number; blows: number } {
  let hits = 0;
  let blows = 0;
  for (let i = 0; i < Math.min(secret.length, guess.length); i += 1) {
    if (guess[i] === secret[i]) {
      hits += 1;
    } else if (secret.includes(guess[i])) {
      blows += 1;
    }
  }
  return { hits, blows };
}

function createBlackjackDeck(): BlackjackCard[] {
  const suits: Array<"S" | "H" | "D" | "C"> = ["S", "H", "D", "C"];
  const deck: BlackjackCard[] = [];
  for (const suit of suits) {
    for (let rank = 1; rank <= 13; rank += 1) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

function shuffleBlackjackDeck(cards: BlackjackCard[]): BlackjackCard[] {
  const next = [...cards];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function blackjackCardLabel(card: BlackjackCard): string {
  const suitMap: Record<BlackjackCard["suit"], string> = {
    S: "♠",
    H: "♥",
    D: "♦",
    C: "♣",
  };
  const rank = card.rank === 1 ? "A" : card.rank === 11 ? "J" : card.rank === 12 ? "Q" : card.rank === 13 ? "K" : String(card.rank);
  return `${rank}${suitMap[card.suit]}`;
}

function blackjackHandValue(cards: BlackjackCard[]): number {
  let total = 0;
  let aces = 0;
  cards.forEach((card) => {
    if (card.rank === 1) {
      total += 11;
      aces += 1;
      return;
    }
    total += card.rank >= 10 ? 10 : card.rank;
  });

  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  return total;
}

function rollChinchiroDice(): [number, number, number] {
  return [
    1 + Math.floor(Math.random() * 6),
    1 + Math.floor(Math.random() * 6),
    1 + Math.floor(Math.random() * 6),
  ];
}

function evaluateChinchiroHand(dice: [number, number, number]): ChinchiroHand {
  const [a, b, c] = [...dice].sort((x, y) => x - y);

  if (a === 1 && b === 1 && c === 1) return { key: "pinzoro", rank: 60, eye: 1 };
  if (a === b && b === c) return { key: "arashi", rank: 50 + a, eye: a };
  if (a === 4 && b === 5 && c === 6) return { key: "shigoro", rank: 40, eye: 6 };
  if (a === 1 && b === 2 && c === 3) return { key: "hifumi", rank: 10, eye: 0 };
  if (a === b) return { key: "point", rank: 30 + c, eye: c };
  if (b === c) return { key: "point", rank: 30 + a, eye: a };
  if (a === c) return { key: "point", rank: 30 + b, eye: b };

  return { key: "buta", rank: 20, eye: 0 };
}

function createSevensDeck(): SevensCard[] {
  const suits: Array<"S" | "H" | "D" | "C"> = ["S", "H", "D", "C"];
  const deck: SevensCard[] = [];
  for (const suit of suits) {
    for (let rank = 1; rank <= 13; rank += 1) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

function shuffleSevensDeck(cards: SevensCard[]): SevensCard[] {
  const next = [...cards];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function createSevensTable(): Record<"S" | "H" | "D" | "C", SevensTableRange> {
  return {
    S: { low: null, high: null },
    H: { low: null, high: null },
    D: { low: null, high: null },
    C: { low: null, high: null },
  };
}

function sortSevensHand(cards: SevensCard[]): SevensCard[] {
  const suitOrder = { S: 0, H: 1, D: 2, C: 3 } as const;
  return [...cards].sort((a, b) => {
    const sd = suitOrder[a.suit] - suitOrder[b.suit];
    if (sd !== 0) return sd;
    return a.rank - b.rank;
  });
}

function isSevensPlayable(card: SevensCard, table: Record<"S" | "H" | "D" | "C", SevensTableRange>): boolean {
  const range = table[card.suit];
  if (range.low === null || range.high === null) return card.rank === 7;
  return card.rank === range.low - 1 || card.rank === range.high + 1;
}

function hasSevensPlayable(cards: SevensCard[], table: Record<"S" | "H" | "D" | "C", SevensTableRange>): boolean {
  return cards.some((card) => isSevensPlayable(card, table));
}

function applySevensCard(table: Record<"S" | "H" | "D" | "C", SevensTableRange>, card: SevensCard) {
  const next = {
    S: { ...table.S },
    H: { ...table.H },
    D: { ...table.D },
    C: { ...table.C },
  };
  const range = next[card.suit];
  if (range.low === null || range.high === null) {
    range.low = card.rank;
    range.high = card.rank;
  } else {
    range.low = Math.min(range.low, card.rank);
    range.high = Math.max(range.high, card.rank);
  }
  return next;
}

function sevensCardLabel(card: SevensCard): string {
  const suitMap = {
    S: "♠",
    H: "♥",
    D: "♦",
    C: "♣",
  } as const;
  const rank = card.rank === 1 ? "A" : card.rank === 11 ? "J" : card.rank === 12 ? "Q" : card.rank === 13 ? "K" : String(card.rank);
  return `${rank}${suitMap[card.suit]}`;
}

function createDaifugoDeck(): DaifugoCard[] {
  const suits: Array<"S" | "H" | "D" | "C"> = ["S", "H", "D", "C"];
  const deck: DaifugoCard[] = [];
  for (const suit of suits) {
    for (let rank = 1; rank <= 13; rank += 1) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

function shuffleDaifugoDeck(cards: DaifugoCard[]): DaifugoCard[] {
  const next = [...cards];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function daifugoPower(rank: number): number {
  if (rank === 1) return 14;
  if (rank === 2) return 15;
  return rank;
}

function sortDaifugoHand(cards: DaifugoCard[]): DaifugoCard[] {
  const suitOrder = { S: 0, H: 1, D: 2, C: 3 } as const;
  return [...cards].sort((a, b) => {
    const p = daifugoPower(a.rank) - daifugoPower(b.rank);
    if (p !== 0) return p;
    return suitOrder[a.suit] - suitOrder[b.suit];
  });
}

function daifugoCardLabel(card: DaifugoCard): string {
  const suitMap = {
    S: "♠",
    H: "♥",
    D: "♦",
    C: "♣",
  } as const;
  const rank = card.rank === 1 ? "A" : card.rank === 11 ? "J" : card.rank === 12 ? "Q" : card.rank === 13 ? "K" : String(card.rank);
  return `${rank}${suitMap[card.suit]}`;
}

function createPokerDeck(): PokerCard[] {
  const suits: PokerSuit[] = ["S", "H", "D", "C"];
  const deck: PokerCard[] = [];
  for (const suit of suits) {
    for (let rank = 2; rank <= 14; rank += 1) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

function shufflePokerDeck(cards: PokerCard[]): PokerCard[] {
  const next = [...cards];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function pokerRankLabel(rank: number): string {
  if (rank === 14) return "A";
  if (rank === 13) return "K";
  if (rank === 12) return "Q";
  if (rank === 11) return "J";
  return String(rank);
}

function pokerCardLabel(card: PokerCard): string {
  const suitMap = {
    S: "♠",
    H: "♥",
    D: "♦",
    C: "♣",
  } as const;
  return `${pokerRankLabel(card.rank)}${suitMap[card.suit]}`;
}

function evaluatePokerHand(cards: PokerCard[]): PokerEval {
  const ranks = cards.map((card) => card.rank);
  const ranksDesc = [...ranks].sort((a, b) => b - a);
  const rankCountMap = new Map<number, number>();
  ranks.forEach((rank) => {
    rankCountMap.set(rank, (rankCountMap.get(rank) || 0) + 1);
  });

  const rankCounts = [...rankCountMap.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return b[0] - a[0];
  });

  const isFlush = cards.every((card) => card.suit === cards[0]?.suit);
  const uniqueAsc = [...new Set(ranks)].sort((a, b) => a - b);
  const isWheel = uniqueAsc.length === 5 && uniqueAsc[0] === 2 && uniqueAsc[1] === 3 && uniqueAsc[2] === 4 && uniqueAsc[3] === 5 && uniqueAsc[4] === 14;
  const isStraight = uniqueAsc.length === 5 && ((uniqueAsc[4] - uniqueAsc[0] === 4 && uniqueAsc.every((rank, i) => i === 0 || rank - uniqueAsc[i - 1] === 1)) || isWheel);
  const straightHigh = isWheel ? 5 : uniqueAsc[4] || 0;

  if (isStraight && isFlush) return { score: [8, straightHigh], name: "straightFlush" };
  if (rankCounts[0]?.[1] === 4) return { score: [7, rankCounts[0][0], rankCounts[1][0]], name: "fourKind" };
  if (rankCounts[0]?.[1] === 3 && rankCounts[1]?.[1] === 2) return { score: [6, rankCounts[0][0], rankCounts[1][0]], name: "fullHouse" };
  if (isFlush) return { score: [5, ...ranksDesc], name: "flush" };
  if (isStraight) return { score: [4, straightHigh], name: "straight" };

  if (rankCounts[0]?.[1] === 3) {
    const kickers = rankCounts.slice(1).map(([rank]) => rank).sort((a, b) => b - a);
    return { score: [3, rankCounts[0][0], ...kickers], name: "threeKind" };
  }

  if (rankCounts[0]?.[1] === 2 && rankCounts[1]?.[1] === 2) {
    const highPair = Math.max(rankCounts[0][0], rankCounts[1][0]);
    const lowPair = Math.min(rankCounts[0][0], rankCounts[1][0]);
    const kicker = rankCounts[2]?.[0] || 0;
    return { score: [2, highPair, lowPair, kicker], name: "twoPair" };
  }

  if (rankCounts[0]?.[1] === 2) {
    const pairRank = rankCounts[0][0];
    const kickers = rankCounts.slice(1).map(([rank]) => rank).sort((a, b) => b - a);
    return { score: [1, pairRank, ...kickers], name: "onePair" };
  }

  return { score: [0, ...ranksDesc], name: "highCard" };
}

function comparePokerEval(a: PokerEval, b: PokerEval): number {
  const len = Math.max(a.score.length, b.score.length);
  for (let i = 0; i < len; i += 1) {
    const av = a.score[i] || 0;
    const bv = b.score[i] || 0;
    if (av > bv) return 1;
    if (av < bv) return -1;
  }
  return 0;
}

function pokerCpuHoldIndexes(cards: PokerCard[]): Set<number> {
  const counts = new Map<number, number>();
  cards.forEach((card) => {
    counts.set(card.rank, (counts.get(card.rank) || 0) + 1);
  });

  const hold = new Set<number>();
  cards.forEach((card, index) => {
    if ((counts.get(card.rank) || 0) >= 2) hold.add(index);
  });
  if (hold.size > 0) return hold;

  cards
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => card.rank >= 12)
    .sort((a, b) => b.card.rank - a.card.rank)
    .slice(0, 2)
    .forEach(({ index }) => hold.add(index));

  return hold;
}

function createSolitaireDeck(): SolitaireCard[] {
  const suits: SolitaireSuit[] = ["H", "D", "C", "S"];
  const deck: SolitaireCard[] = [];
  for (const suit of suits) {
    for (let rank = 1; rank <= 13; rank += 1) {
      deck.push({ suit, rank, faceUp: false });
    }
  }
  return deck;
}

function shuffleSolitaireDeck(cards: SolitaireCard[]): SolitaireCard[] {
  const next = [...cards];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function solitaireRankLabel(rank: number): string {
  if (rank === 1) return "A";
  if (rank === 11) return "J";
  if (rank === 12) return "Q";
  if (rank === 13) return "K";
  return String(rank);
}

function solitaireSuitSymbol(suit: SolitaireSuit): string {
  if (suit === "H") return "♥";
  if (suit === "D") return "♦";
  if (suit === "C") return "♣";
  return "♠";
}

function solitaireIsRed(suit: SolitaireSuit): boolean {
  return suit === "H" || suit === "D";
}

function solitaireCardLabel(card: SolitaireCard): string {
  return `${solitaireRankLabel(card.rank)}${solitaireSuitSymbol(card.suit)}`;
}

export default function Home() {
  const [scores, setScores] = useState<Score[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [message, setMessage] = useState("");
  const [playerName, setPlayerName] = useState("player-1");
  const [game, setGame] = useState("othello");
  const [score, setScore] = useState(100);
  const [board, setBoard] = useState<Cell[][]>(() => createInitialBoard());
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [othelloFixedMask, setOthelloFixedMask] = useState<boolean[][]>(() => createOthelloChaosMask());
  const [othelloBrokenMask, setOthelloBrokenMask] = useState<boolean[][]>(() => createOthelloChaosMask());
  const [othelloOverwriteRemaining, setOthelloOverwriteRemaining] = useState<[number, number]>([
    OTHELLO_DEFAULT_OVERWRITE,
    OTHELLO_DEFAULT_OVERWRITE,
  ]);
  const [othelloImmutableCharges, setOthelloImmutableCharges] = useState<[number, number]>([
    OTHELLO_DEFAULT_IMMUTABLE,
    OTHELLO_DEFAULT_IMMUTABLE,
  ]);
  const [othelloDestroyRemaining, setOthelloDestroyRemaining] = useState<[number, number]>([
    OTHELLO_DEFAULT_DESTROY,
    OTHELLO_DEFAULT_DESTROY,
  ]);
  const [othelloDoubleActionCharges, setOthelloDoubleActionCharges] = useState<[number, number]>([0, 0]);
  const [othelloImmutableArmed, setOthelloImmutableArmed] = useState<[boolean, boolean]>([false, false]);
  const [othelloDestroyArmed, setOthelloDestroyArmed] = useState<[boolean, boolean]>([false, false]);
  const [othelloDoubleArmed, setOthelloDoubleArmed] = useState<[boolean, boolean]>([false, false]);
  const [othelloDestroySelectedSacrifices, setOthelloDestroySelectedSacrifices] = useState<
    [{ row: number; col: number }[], { row: number; col: number }[]]
  >([[], []]);
  const [othelloFirstCornerBonusUsed, setOthelloFirstCornerBonusUsed] = useState(false);
  const [othelloCornerLossStreak, setOthelloCornerLossStreak] = useState<[number, number]>([0, 0]);
  const [othelloMessage, setOthelloMessage] = useState<string>(LOGIN_I18N.ja.othelloTurnBlack);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gomokuBoard, setGomokuBoard] = useState<Cell[][]>(() => createGomokuBoard());
  const [gomokuPlayer, setGomokuPlayer] = useState<1 | 2>(1);
  const [gomokuMessage, setGomokuMessage] = useState<string>(LOGIN_I18N.ja.gomokuTurnBlack);
  const [isGomokuOver, setIsGomokuOver] = useState(false);
  const [chessBoard, setChessBoard] = useState<Array<Array<ChessPiece | null>>>(() => createChessBoard());
  const [chessTurn, setChessTurn] = useState<ChessColor>("w");
  const [selectedChess, setSelectedChess] = useState<{ row: number; col: number } | null>(null);
  const [chessMessage, setChessMessage] = useState<string>(LOGIN_I18N.ja.chessTurnWhite);
  const [isChessOver, setIsChessOver] = useState(false);
  const [shogiBoard, setShogiBoard] = useState<Array<Array<ShogiPiece | null>>>(() => createShogiBoard());
  const [shogiTurn, setShogiTurn] = useState<ShogiColor>("b");
  const [selectedShogi, setSelectedShogi] = useState<{ row: number; col: number } | null>(null);
  const [shogiMessage, setShogiMessage] = useState<string>(LOGIN_I18N.ja.shogiTurnBlack);
  const [isShogiOver, setIsShogiOver] = useState(false);
  const [mineBoard, setMineBoard] = useState<MineCell[][]>(() => createMinesweeperBoard());
  const [mineMessage, setMineMessage] = useState<string>(LOGIN_I18N.ja.minesHint);
  const [isMineOver, setIsMineOver] = useState(false);
  const [numeronSecret, setNumeronSecret] = useState(() => createNumeronSecret());
  const [numeronDraft, setNumeronDraft] = useState<string[]>([]);
  const [numeronHistory, setNumeronHistory] = useState<NumeronHistory[]>([]);
  const [isNumeronOver, setIsNumeronOver] = useState(false);
  const [numeronMessage, setNumeronMessage] = useState<string>(LOGIN_I18N.ja.numeronHint);
  const [blackjackDeck, setBlackjackDeck] = useState<BlackjackCard[]>([]);
  const [blackjackPlayerHand, setBlackjackPlayerHand] = useState<BlackjackCard[]>([]);
  const [blackjackDealerHand, setBlackjackDealerHand] = useState<BlackjackCard[]>([]);
  const [blackjackMessage, setBlackjackMessage] = useState<string>(LOGIN_I18N.ja.blackjackYourTurn);
  const [isBlackjackOver, setIsBlackjackOver] = useState(false);
  const [chinchiroPlayerDice, setChinchiroPlayerDice] = useState<[number, number, number] | null>(null);
  const [chinchiroDealerDice, setChinchiroDealerDice] = useState<[number, number, number] | null>(null);
  const [chinchiroMessage, setChinchiroMessage] = useState<string>(LOGIN_I18N.ja.chinchiroHint);
  const [isChinchiroOver, setIsChinchiroOver] = useState(false);
  const [sevensHands, setSevensHands] = useState<[SevensCard[], SevensCard[]]>([[], []]);
  const [sevensTable, setSevensTable] = useState<Record<"S" | "H" | "D" | "C", SevensTableRange>>(createSevensTable());
  const [sevensTurn, setSevensTurn] = useState<"player" | "cpu">("player");
  const [sevensPassCount, setSevensPassCount] = useState<[number, number]>([0, 0]);
  const [sevensMessage, setSevensMessage] = useState<string>(LOGIN_I18N.ja.sevensYourTurn);
  const [isSevensOver, setIsSevensOver] = useState(false);
  const [daifugoHands, setDaifugoHands] = useState<[DaifugoCard[], DaifugoCard[]]>([[], []]);
  const [daifugoTableCard, setDaifugoTableCard] = useState<DaifugoCard | null>(null);
  const [daifugoTurn, setDaifugoTurn] = useState<"player" | "cpu">("player");
  const [daifugoPassStreak, setDaifugoPassStreak] = useState(0);
  const [daifugoMessage, setDaifugoMessage] = useState<string>(LOGIN_I18N.ja.daifugoYourTurn);
  const [isDaifugoOver, setIsDaifugoOver] = useState(false);
  const [fourPanelTitle, setFourPanelTitle] = useState(FOUR_PANEL_RANDOM_TITLES[0]);
  const [fourPanelImages, setFourPanelImages] = useState<string[]>([]);
  const [fourPanelIndex, setFourPanelIndex] = useState(0);
  const [fourPanelMessage, setFourPanelMessage] = useState<string>(LOGIN_I18N.ja.fourPanelHint);
  const [drawingRelayPrompt, setDrawingRelayPrompt] = useState(DRAWING_RELAY_PROMPTS[0]);
  const [drawingRelayImage, setDrawingRelayImage] = useState("");
  const [drawingRelayGuess, setDrawingRelayGuess] = useState("");
  const [drawingRelayPhase, setDrawingRelayPhase] = useState<"draw" | "guess" | "done">("draw");
  const [drawingRelayMessage, setDrawingRelayMessage] = useState<string>(LOGIN_I18N.ja.drawingRelayHintDraw);
  const [fitPuzzleTiles, setFitPuzzleTiles] = useState<number[]>(() => createFitPuzzleShuffledTiles());
  const [fitPuzzleMoves, setFitPuzzleMoves] = useState(0);
  const [fitPuzzleMessage, setFitPuzzleMessage] = useState<string>(LOGIN_I18N.ja.fitPuzzleHint);
  const [isFitPuzzleOver, setIsFitPuzzleOver] = useState(false);
  const [mahjongBoard, setMahjongBoard] = useState<MahjongCell[][]>(() => createMahjongStartBoard());
  const [mahjongSelected, setMahjongSelected] = useState<MahjongCoord | null>(null);
  const [mahjongMessage, setMahjongMessage] = useState<string>(LOGIN_I18N.ja.mahjongHint);
  const [isMahjongOver, setIsMahjongOver] = useState(false);
  const [pokerDeck, setPokerDeck] = useState<PokerCard[]>([]);
  const [pokerPlayerHand, setPokerPlayerHand] = useState<PokerCard[]>([]);
  const [pokerCpuHand, setPokerCpuHand] = useState<PokerCard[]>([]);
  const [pokerHold, setPokerHold] = useState<boolean[]>([false, false, false, false, false]);
  const [pokerPhase, setPokerPhase] = useState<"draw" | "result">("draw");
  const [pokerMessage, setPokerMessage] = useState<string>(LOGIN_I18N.ja.pokerHint);
  const [pokerPlayerEval, setPokerPlayerEval] = useState<PokerEval | null>(null);
  const [pokerCpuEval, setPokerCpuEval] = useState<PokerEval | null>(null);
  const [pokerOutcome, setPokerOutcome] = useState<"win" | "lose" | "draw" | "pending">("pending");
  const [solitaireStock, setSolitaireStock] = useState<SolitaireCard[]>([]);
  const [solitaireWaste, setSolitaireWaste] = useState<SolitaireCard[]>([]);
  const [solitaireFoundations, setSolitaireFoundations] = useState<Record<SolitaireSuit, SolitaireCard[]>>({ H: [], D: [], C: [], S: [] });
  const [solitaireTableau, setSolitaireTableau] = useState<SolitaireCard[][]>(Array.from({ length: 7 }, () => []));
  const [solitaireSelection, setSolitaireSelection] = useState<SolitaireSelection | null>(null);
  const [solitaireMessage, setSolitaireMessage] = useState<string>(LOGIN_I18N.ja.solitaireHint);
  const [isSolitaireOver, setIsSolitaireOver] = useState(false);
  const [survivorsWave, setSurvivorsWave] = useState(1);
  const [survivorsHp, setSurvivorsHp] = useState(100);
  const [survivorsMaxHp, setSurvivorsMaxHp] = useState(100);
  const [survivorsLevel, setSurvivorsLevel] = useState(1);
  const [survivorsXp, setSurvivorsXp] = useState(0);
  const [survivorsTimeSec, setSurvivorsTimeSec] = useState(0);
  const [survivorsKills, setSurvivorsKills] = useState(0);
  const [survivorsEnemies, setSurvivorsEnemies] = useState<SurvivorsEnemy[]>([]);
  const [survivorsMessage, setSurvivorsMessage] = useState<string>(LOGIN_I18N.ja.survivorsHint);
  const [isSurvivorsOver, setIsSurvivorsOver] = useState(false);
  const [unoDeck, setUnoDeck] = useState<UnoCard[]>([]);
  const [unoPlayerHand, setUnoPlayerHand] = useState<UnoCard[]>([]);
  const [unoCpuHand, setUnoCpuHand] = useState<UnoCard[]>([]);
  const [unoTopCard, setUnoTopCard] = useState<UnoCard | null>(null);
  const [unoTurn, setUnoTurn] = useState<"player" | "cpu">("player");
  const [unoMessage, setUnoMessage] = useState<string>(LOGIN_I18N.ja.unoYourTurn);
  const [isUnoOver, setIsUnoOver] = useState(false);
  const [activePanel, setActivePanel] = useState<Panel>("menu");
  const [roomCode, setRoomCode] = useState("");
  const [roomVisibility, setRoomVisibility] = useState<"public" | "private">("public");
  const [roomServerUrl, setRoomServerUrl] = useState("ws://127.0.0.1:8788");
  const [roomStatus, setRoomStatus] = useState("未接続");
  const [connectedRoomCode, setConnectedRoomCode] = useState("");
  const [roomRole, setRoomRole] = useState("");
  const [roomParticipants, setRoomParticipants] = useState<RoomParticipant[]>([]);
  const [pendingRemoteOthelloMove, setPendingRemoteOthelloMove] = useState<{ row: number; col: number } | null>(null);
  const [pendingRemoteGomokuMove, setPendingRemoteGomokuMove] = useState<{ row: number; col: number } | null>(null);
  const [pendingRemoteChessClick, setPendingRemoteChessClick] = useState<{ row: number; col: number } | null>(null);
  const [pendingRemoteShogiClick, setPendingRemoteShogiClick] = useState<{ row: number; col: number } | null>(null);
  const [pendingRemoteUnoAction, setPendingRemoteUnoAction] = useState<{ action: "play" | "draw"; index?: number } | null>(null);
  const [pendingRemoteDaifugoAction, setPendingRemoteDaifugoAction] = useState<{ action: "play" | "pass"; index?: number } | null>(null);
  const [isMultiSyncEnabled, setIsMultiSyncEnabled] = useState(true);
  const [isChaosMode, setIsChaosMode] = useState(false);
  const [menuMessage, setMenuMessage] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUserId, setAuthUserId] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [entryMessage, setEntryMessage] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authMode, setAuthMode] = useState<"guest" | "cloud">("guest");
  const [language, setLanguage] = useState<Language>("ja");
  const roomSocketRef = useRef<WebSocket | null>(null);
  const peerIdRef = useRef(`next-${Math.random().toString(36).slice(2, 10)}`);
  const snapshotRef = useRef<Record<string, unknown>>({});
  const fourPanelCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fourPanelDrawingRef = useRef(false);
  const fourPanelHasStrokeRef = useRef(false);
  const drawingRelayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRelayDrawingRef = useRef(false);
  const drawingRelayHasStrokeRef = useRef(false);

  const loadScores = useCallback(async () => {
    setIsLoading(true);
    setMessage("");
    try {
      const res = await fetch("/scores?limit=20", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as Score[];
      setScores(data);
    } catch (error) {
      console.error(error);
      setMessage(LOGIN_I18N[language].scoreLoadFailed);
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  useEffect(() => {
    void loadScores();
  }, [loadScores]);

  useEffect(() => {
    const savedUserId = localStorage.getItem(STORAGE_CLOUD_USER_ID_KEY) || "";
    const savedPassword = localStorage.getItem(STORAGE_CLOUD_PASSWORD_KEY) || "";
    const savedLanguage = localStorage.getItem(STORAGE_LANGUAGE_KEY);
    setAuthUserId(savedUserId);
    setAuthPassword(savedPassword);
    if (savedLanguage === "ja" || savedLanguage === "ko") {
      setLanguage(savedLanguage);
    }
  }, []);

  const t = useCallback(
    (key: keyof typeof LOGIN_I18N.ja) => {
      return LOGIN_I18N[language][key];
    },
    [language],
  );

  const switchLanguage = useCallback((nextLanguage: Language) => {
    setLanguage(nextLanguage);
    localStorage.setItem(STORAGE_LANGUAGE_KEY, nextLanguage);
  }, []);

  const tf = useCallback(
    (key: keyof typeof LOGIN_I18N.ja, values: Record<string, string | number>) => {
      let text: string = t(key);
      Object.entries(values).forEach(([name, value]) => {
        text = text.replaceAll(`{${name}}`, String(value));
      });
      return text;
    },
    [t],
  );

  const gameLabelById = useCallback(
    (id: string) => {
      if (id === "othello") return t("gameOthello");
      if (id === "shogi") return t("gameShogi");
      if (id === "chess") return t("gameChess");
      if (id === "uno") return t("gameUno");
      if (id === "gomoku") return t("gameGomoku");
      if (id === "minesweeper") return t("gameMinesweeper");
      if (id === "numeron") return t("gameNumeron");
      if (id === "blackjack") return t("gameBlackjack");
      if (id === "chinchiro") return t("gameChinchiro");
      if (id === "sevens") return t("gameSevens");
      if (id === "daifugo") return t("gameDaifugo");
      if (id === "fourPanel") return t("gameFourPanel");
      if (id === "drawingRelay") return t("gameDrawingRelay");
      if (id === "fitPuzzle") return t("gameFitPuzzle");
      if (id === "mahjong") return t("gameMahjong");
      if (id === "poker") return t("gamePoker");
      if (id === "solitaire") return t("gameSolitaire");
      if (id === "survivors") return t("gameSurvivors");
      return id;
    },
    [t],
  );

  const pokerHandName = useCallback((name: PokerEval["name"]) => {
    if (name === "highCard") return t("pokerHandHighCard");
    if (name === "onePair") return t("pokerHandOnePair");
    if (name === "twoPair") return t("pokerHandTwoPair");
    if (name === "threeKind") return t("pokerHandThreeKind");
    if (name === "straight") return t("pokerHandStraight");
    if (name === "flush") return t("pokerHandFlush");
    if (name === "fullHouse") return t("pokerHandFullHouse");
    if (name === "fourKind") return t("pokerHandFourKind");
    return t("pokerHandStraightFlush");
  }, [t]);

  const chessPieceLabel = useCallback((piece: ChessPiece) => {
    const color = piece.color === "w" ? t("whiteStone") : t("blackStone");
    const map: Record<ChessPieceType, string> = {
      K: "K",
      Q: "Q",
      R: "R",
      B: "B",
      N: "N",
      P: "P",
    };
    return `${color}${map[piece.type]}`;
  }, [t]);

  const shogiPieceLabel = useCallback((piece: ShogiPiece) => {
    const color = piece.color === "b" ? t("blackStone") : t("whiteStone");
    return `${color}${piece.type}`;
  }, [t]);

  const roomRoleLabel = useCallback(
    (role: string) => {
      if (role === "host") return t("roomRoleHost");
      if (role === "guest") return t("roomRoleGuest");
      if (role === "spectator") return t("roomRoleSpectator");
      return role;
    },
    [t],
  );

  const roomErrorLabel = useCallback(
    (code: string) => {
      if (code === "ROOM_REQUIRED") return t("roomErrRoomRequired");
      if (code === "HOST_ONLY") return t("roomErrHostOnly");
      if (code === "TARGET_INVALID") return t("roomErrTargetInvalid");
      if (code === "TARGET_REQUIRED") return t("roomErrTargetRequired");
      if (code === "MESSAGE_ID_REQUIRED") return t("roomErrMessageIdRequired");
      if (code === "MESSAGE_NOT_FOUND") return t("roomErrMessageNotFound");
      if (code === "REPORT_SELF_FORBIDDEN") return t("roomErrReportSelfForbidden");
      if (code === "MUTED") return t("roomErrMuted");
      if (code === "MESSAGE_NOT_OWNED") return t("roomErrMessageNotOwned");
      if (code === "MESSAGE_ALREADY_RETRACTED") return t("roomErrMessageAlreadyRetracted");
      if (code === "EDIT_RETRACT_WINDOW_EXPIRED") return t("roomErrEditRetractExpired");
      if (code === "INVITE_TOKEN_PRIVATE_ONLY") return t("roomErrInvitePrivateOnly");
      if (code === "SPECTATOR_ONLY") return t("roomErrSpectatorOnly");
      if (code === "REMATCH_VOTE_FORBIDDEN") return t("roomErrRematchVoteForbidden");
      return tf("roomErrUnknown", { code });
    },
    [t, tf],
  );

  const dateLocale = language === "ko" ? "ko-KR" : "ja-JP";

  const unoColorLabel = useCallback(
    (color: UnoColor) => {
      if (language === "ko") {
        if (color === "R") return "빨강";
        if (color === "G") return "초록";
        if (color === "B") return "파랑";
        return "노랑";
      }
      if (color === "R") return "赤";
      if (color === "G") return "緑";
      if (color === "B") return "青";
      return "黄";
    },
    [language],
  );

  const unoCardLabel = useCallback(
    (card: UnoCard) => {
      return `${unoColorLabel(card.color)} ${card.value}`;
    },
    [unoColorLabel],
  );

  const legalMoveSet = useMemo(() => {
    const set = new Set<string>();
    const enemy: 1 | 2 = currentPlayer === 1 ? 2 : 1;
    const currentIndex = othelloPlayerIndex(currentPlayer);
    const canOverwrite = (othelloOverwriteRemaining[currentIndex] ?? 0) > 0;
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        if (othelloBrokenMask[row][col]) continue;
        const cell = board[row][col];
        if (getFlips(board, row, col, currentPlayer).length > 0) {
          set.add(`${row}-${col}`);
          continue;
        }
        if (isChaosMode && canOverwrite && cell === enemy && !othelloFixedMask[row][col]) {
          set.add(`${row}-${col}`);
        }
      }
    }
    return set;
  }, [board, currentPlayer, isChaosMode, othelloBrokenMask, othelloFixedMask, othelloOverwriteRemaining]);

  const stoneCount = useMemo(() => countStones(board), [board]);
  const gomokuStoneCount = useMemo(() => countStones(gomokuBoard), [gomokuBoard]);
  const othelloRoomPlayer = useMemo<1 | 2 | null>(() => {
    if (!connectedRoomCode) return null;
    if (roomRole === "host") return 1;
    if (roomRole === "guest") return 2;
    return null;
  }, [connectedRoomCode, roomRole]);

  const canOperateOthelloNow = useMemo(() => {
    if (!connectedRoomCode) return true;
    if (!othelloRoomPlayer) return false;
    return currentPlayer === othelloRoomPlayer;
  }, [connectedRoomCode, currentPlayer, othelloRoomPlayer]);

  const gomokuRoomPlayer = useMemo<1 | 2 | null>(() => {
    if (!connectedRoomCode) return null;
    if (roomRole === "host") return 1;
    if (roomRole === "guest") return 2;
    return null;
  }, [connectedRoomCode, roomRole]);

  const canOperateGomokuNow = useMemo(() => {
    if (!connectedRoomCode) return true;
    if (!gomokuRoomPlayer) return false;
    return gomokuPlayer === gomokuRoomPlayer;
  }, [connectedRoomCode, gomokuPlayer, gomokuRoomPlayer]);

  const chessRoomPlayer = useMemo<ChessColor | null>(() => {
    if (!connectedRoomCode) return null;
    if (roomRole === "host") return "w";
    if (roomRole === "guest") return "b";
    return null;
  }, [connectedRoomCode, roomRole]);

  const canOperateChessNow = useMemo(() => {
    if (!connectedRoomCode) return true;
    if (!chessRoomPlayer) return false;
    return chessTurn === chessRoomPlayer;
  }, [chessRoomPlayer, chessTurn, connectedRoomCode]);

  const shogiRoomPlayer = useMemo<ShogiColor | null>(() => {
    if (!connectedRoomCode) return null;
    if (roomRole === "host") return "b";
    if (roomRole === "guest") return "w";
    return null;
  }, [connectedRoomCode, roomRole]);

  const canOperateShogiNow = useMemo(() => {
    if (!connectedRoomCode) return true;
    if (!shogiRoomPlayer) return false;
    return shogiTurn === shogiRoomPlayer;
  }, [connectedRoomCode, shogiRoomPlayer, shogiTurn]);

  const unoRoomPlayer = useMemo<"player" | "cpu" | null>(() => {
    if (!connectedRoomCode) return null;
    if (roomRole === "host") return "player";
    if (roomRole === "guest") return "cpu";
    return null;
  }, [connectedRoomCode, roomRole]);

  const canOperateUnoNow = useMemo(() => {
    if (!connectedRoomCode) return true;
    if (!unoRoomPlayer) return false;
    return unoTurn === unoRoomPlayer;
  }, [connectedRoomCode, unoRoomPlayer, unoTurn]);

  const daifugoRoomPlayer = useMemo<"player" | "cpu" | null>(() => {
    if (!connectedRoomCode) return null;
    if (roomRole === "host") return "player";
    if (roomRole === "guest") return "cpu";
    return null;
  }, [connectedRoomCode, roomRole]);

  const canOperateDaifugoNow = useMemo(() => {
    if (!connectedRoomCode) return true;
    if (!daifugoRoomPlayer) return false;
    return daifugoTurn === daifugoRoomPlayer;
  }, [connectedRoomCode, daifugoRoomPlayer, daifugoTurn]);

  const unoLocalSide = useMemo<"player" | "cpu">(() => {
    if (connectedRoomCode && roomRole === "guest") return "cpu";
    return "player";
  }, [connectedRoomCode, roomRole]);

  const daifugoLocalSide = useMemo<"player" | "cpu">(() => {
    if (connectedRoomCode && roomRole === "guest") return "cpu";
    return "player";
  }, [connectedRoomCode, roomRole]);

  const roomTurnText = useCallback((isYourTurn: boolean) => {
    if (!connectedRoomCode) return "";
    if (roomRole === "spectator") {
      return tf("roomTurnCurrent", { owner: t("roomTurnSpectator") });
    }
    return tf("roomTurnCurrent", { owner: isYourTurn ? t("roomTurnYou") : t("roomTurnOpponent") });
  }, [connectedRoomCode, roomRole, t, tf]);

  const resetOthello = () => {
    setBoard(createInitialBoard());
    setCurrentPlayer(1);
    setOthelloFixedMask(createOthelloChaosMask());
    setOthelloBrokenMask(createOthelloChaosMask());
    setOthelloOverwriteRemaining([OTHELLO_DEFAULT_OVERWRITE, OTHELLO_DEFAULT_OVERWRITE]);
    setOthelloImmutableCharges([OTHELLO_DEFAULT_IMMUTABLE, OTHELLO_DEFAULT_IMMUTABLE]);
    setOthelloDestroyRemaining([OTHELLO_DEFAULT_DESTROY, OTHELLO_DEFAULT_DESTROY]);
    setOthelloDoubleActionCharges([0, 0]);
    setOthelloImmutableArmed([false, false]);
    setOthelloDestroyArmed([false, false]);
    setOthelloDoubleArmed([false, false]);
    setOthelloDestroySelectedSacrifices([[], []]);
    setOthelloFirstCornerBonusUsed(false);
    setOthelloCornerLossStreak([0, 0]);
    setIsGameOver(false);
    setOthelloMessage(t("othelloTurnBlack"));
  };

  const openOthello = () => {
    setActivePanel("othello");
    setMenuMessage("");
  };

  const openScores = () => {
    setActivePanel("scores");
    setMenuMessage("");
  };

  const openGomoku = () => {
    setActivePanel("gomoku");
    setMenuMessage("");
  };

  const openChess = () => {
    setActivePanel("chess");
    setMenuMessage("");
  };

  const openShogi = () => {
    setActivePanel("shogi");
    setMenuMessage("");
  };

  const openMinesweeper = () => {
    setActivePanel("minesweeper");
    setMenuMessage("");
  };

  const openUno = () => {
    setActivePanel("uno");
    setMenuMessage("");
  };

  const openNumeron = () => {
    setActivePanel("numeron");
    setMenuMessage("");
  };

  const openBlackjack = () => {
    setActivePanel("blackjack");
    setMenuMessage("");
  };

  const openChinchiro = () => {
    setActivePanel("chinchiro");
    setMenuMessage("");
  };

  const openSevens = () => {
    setActivePanel("sevens");
    setMenuMessage("");
  };

  const openDaifugo = () => {
    setActivePanel("daifugo");
    setMenuMessage("");
  };

  const openFourPanel = () => {
    setActivePanel("fourPanel");
    setMenuMessage("");
  };

  const openDrawingRelay = () => {
    setActivePanel("drawingRelay");
    setMenuMessage("");
  };

  const openFitPuzzle = () => {
    setActivePanel("fitPuzzle");
    setMenuMessage("");
  };

  const openMahjong = () => {
    setActivePanel("mahjong");
    setMenuMessage("");
  };

  const openPoker = () => {
    setActivePanel("poker");
    setMenuMessage("");
  };

  const openSolitaire = () => {
    setActivePanel("solitaire");
    setMenuMessage("");
  };

  const openSurvivors = () => {
    setActivePanel("survivors");
    setMenuMessage("");
  };

  const openStatus = () => {
    setActivePanel("status");
    setMenuMessage("");
  };

  const onJoinRoom = () => {
    if (!roomCode.trim()) {
      setMenuMessage(t("roomCodeRequired"));
      return;
    }
    setMenuMessage(tf("roomJoinPreparing", { code: roomCode.trim() }));
  };

  const closeRoomSocket = useCallback(() => {
    const ws = roomSocketRef.current;
    roomSocketRef.current = null;
    if (!ws) return;
    try {
      ws.close();
    } catch {
      // ignore close error
    }
  }, []);

  const sendRoomEvent = useCallback((payload: Record<string, unknown>) => {
    const ws = roomSocketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (!connectedRoomCode) return;
    try {
      ws.send(
        JSON.stringify({
          ...payload,
          room: connectedRoomCode,
          from: peerIdRef.current,
          name: playerName,
        }),
      );
    } catch {
      // ignore send error
    }
  }, [connectedRoomCode, playerName]);

  const applyArcadeSnapshot = useCallback((snapshot: Record<string, unknown>) => {
    const state = snapshot?.state as Record<string, unknown> | undefined;
    if (!state) return;

    if (state.activePanel) setActivePanel(state.activePanel as Panel);

    if (Array.isArray(state.board)) setBoard(state.board as Cell[][]);
    if (Array.isArray(state.othelloFixedMask)) setOthelloFixedMask(state.othelloFixedMask as boolean[][]);
    if (Array.isArray(state.othelloBrokenMask)) setOthelloBrokenMask(state.othelloBrokenMask as boolean[][]);
    if (Array.isArray(state.othelloOverwriteRemaining)) {
      setOthelloOverwriteRemaining(state.othelloOverwriteRemaining as [number, number]);
    }
    if (Array.isArray(state.othelloImmutableCharges)) {
      setOthelloImmutableCharges(state.othelloImmutableCharges as [number, number]);
    }
    if (Array.isArray(state.othelloDestroyRemaining)) {
      setOthelloDestroyRemaining(state.othelloDestroyRemaining as [number, number]);
    }
    if (Array.isArray(state.othelloDoubleActionCharges)) {
      setOthelloDoubleActionCharges(state.othelloDoubleActionCharges as [number, number]);
    }
    if (Array.isArray(state.othelloImmutableArmed)) {
      setOthelloImmutableArmed(state.othelloImmutableArmed as [boolean, boolean]);
    }
    if (Array.isArray(state.othelloDestroyArmed)) {
      setOthelloDestroyArmed(state.othelloDestroyArmed as [boolean, boolean]);
    }
    if (Array.isArray(state.othelloDoubleArmed)) {
      setOthelloDoubleArmed(state.othelloDoubleArmed as [boolean, boolean]);
    }
    if (Array.isArray(state.othelloDestroySelectedSacrifices)) {
      setOthelloDestroySelectedSacrifices(
        state.othelloDestroySelectedSacrifices as [{ row: number; col: number }[], { row: number; col: number }[]],
      );
    }
    if (typeof state.othelloFirstCornerBonusUsed === "boolean") {
      setOthelloFirstCornerBonusUsed(state.othelloFirstCornerBonusUsed);
    }
    if (Array.isArray(state.othelloCornerLossStreak)) {
      setOthelloCornerLossStreak(state.othelloCornerLossStreak as [number, number]);
    }
    if (state.currentPlayer === 1 || state.currentPlayer === 2) setCurrentPlayer(state.currentPlayer as 1 | 2);
    if (typeof state.othelloMessage === "string") setOthelloMessage(state.othelloMessage);
    if (typeof state.isGameOver === "boolean") setIsGameOver(state.isGameOver);

    if (Array.isArray(state.gomokuBoard)) setGomokuBoard(state.gomokuBoard as Cell[][]);
    if (state.gomokuPlayer === 1 || state.gomokuPlayer === 2) setGomokuPlayer(state.gomokuPlayer as 1 | 2);
    if (typeof state.gomokuMessage === "string") setGomokuMessage(state.gomokuMessage);
    if (typeof state.isGomokuOver === "boolean") setIsGomokuOver(state.isGomokuOver);

    if (Array.isArray(state.chessBoard)) setChessBoard(state.chessBoard as Array<Array<ChessPiece | null>>);
    if (state.chessTurn === "w" || state.chessTurn === "b") setChessTurn(state.chessTurn as ChessColor);
    if (state.selectedChess === null || typeof state.selectedChess === "object") {
      setSelectedChess(state.selectedChess as { row: number; col: number } | null);
    }
    if (typeof state.chessMessage === "string") setChessMessage(state.chessMessage);
    if (typeof state.isChessOver === "boolean") setIsChessOver(state.isChessOver);

    if (Array.isArray(state.shogiBoard)) setShogiBoard(state.shogiBoard as Array<Array<ShogiPiece | null>>);
    if (state.shogiTurn === "b" || state.shogiTurn === "w") setShogiTurn(state.shogiTurn as ShogiColor);
    if (state.selectedShogi === null || typeof state.selectedShogi === "object") {
      setSelectedShogi(state.selectedShogi as { row: number; col: number } | null);
    }
    if (typeof state.shogiMessage === "string") setShogiMessage(state.shogiMessage);
    if (typeof state.isShogiOver === "boolean") setIsShogiOver(state.isShogiOver);

    if (Array.isArray(state.mineBoard)) setMineBoard(state.mineBoard as MineCell[][]);
    if (typeof state.mineMessage === "string") setMineMessage(state.mineMessage);
    if (typeof state.isMineOver === "boolean") setIsMineOver(state.isMineOver);

    if (typeof state.numeronSecret === "string") setNumeronSecret(state.numeronSecret);
    if (Array.isArray(state.numeronDraft)) setNumeronDraft(state.numeronDraft as string[]);
    if (Array.isArray(state.numeronHistory)) setNumeronHistory(state.numeronHistory as NumeronHistory[]);
    if (typeof state.isNumeronOver === "boolean") setIsNumeronOver(state.isNumeronOver);
    if (typeof state.numeronMessage === "string") setNumeronMessage(state.numeronMessage);

    if (Array.isArray(state.blackjackDeck)) setBlackjackDeck(state.blackjackDeck as BlackjackCard[]);
    if (Array.isArray(state.blackjackPlayerHand)) setBlackjackPlayerHand(state.blackjackPlayerHand as BlackjackCard[]);
    if (Array.isArray(state.blackjackDealerHand)) setBlackjackDealerHand(state.blackjackDealerHand as BlackjackCard[]);
    if (typeof state.blackjackMessage === "string") setBlackjackMessage(state.blackjackMessage);
    if (typeof state.isBlackjackOver === "boolean") setIsBlackjackOver(state.isBlackjackOver);

    if (state.chinchiroPlayerDice === null || Array.isArray(state.chinchiroPlayerDice)) {
      setChinchiroPlayerDice(state.chinchiroPlayerDice as [number, number, number] | null);
    }
    if (state.chinchiroDealerDice === null || Array.isArray(state.chinchiroDealerDice)) {
      setChinchiroDealerDice(state.chinchiroDealerDice as [number, number, number] | null);
    }
    if (typeof state.chinchiroMessage === "string") setChinchiroMessage(state.chinchiroMessage);
    if (typeof state.isChinchiroOver === "boolean") setIsChinchiroOver(state.isChinchiroOver);

    if (Array.isArray(state.sevensHands)) setSevensHands(state.sevensHands as [SevensCard[], SevensCard[]]);
    if (state.sevensTable && typeof state.sevensTable === "object") {
      setSevensTable(state.sevensTable as Record<"S" | "H" | "D" | "C", SevensTableRange>);
    }
    if (state.sevensTurn === "player" || state.sevensTurn === "cpu") setSevensTurn(state.sevensTurn as "player" | "cpu");
    if (Array.isArray(state.sevensPassCount)) setSevensPassCount(state.sevensPassCount as [number, number]);
    if (typeof state.sevensMessage === "string") setSevensMessage(state.sevensMessage);
    if (typeof state.isSevensOver === "boolean") setIsSevensOver(state.isSevensOver);

    if (Array.isArray(state.daifugoHands)) setDaifugoHands(state.daifugoHands as [DaifugoCard[], DaifugoCard[]]);
    if (state.daifugoTableCard === null || typeof state.daifugoTableCard === "object") {
      setDaifugoTableCard(state.daifugoTableCard as DaifugoCard | null);
    }
    if (state.daifugoTurn === "player" || state.daifugoTurn === "cpu") setDaifugoTurn(state.daifugoTurn as "player" | "cpu");
    if (typeof state.daifugoPassStreak === "number") setDaifugoPassStreak(state.daifugoPassStreak);
    if (typeof state.daifugoMessage === "string") setDaifugoMessage(state.daifugoMessage);
    if (typeof state.isDaifugoOver === "boolean") setIsDaifugoOver(state.isDaifugoOver);

    if (typeof state.fourPanelTitle === "string") setFourPanelTitle(state.fourPanelTitle);
    if (Array.isArray(state.fourPanelImages)) setFourPanelImages(state.fourPanelImages as string[]);
    if (typeof state.fourPanelIndex === "number") setFourPanelIndex(state.fourPanelIndex);
    if (typeof state.fourPanelMessage === "string") setFourPanelMessage(state.fourPanelMessage);

    if (typeof state.drawingRelayPrompt === "string") setDrawingRelayPrompt(state.drawingRelayPrompt);
    if (typeof state.drawingRelayImage === "string") setDrawingRelayImage(state.drawingRelayImage);
    if (typeof state.drawingRelayGuess === "string") setDrawingRelayGuess(state.drawingRelayGuess);
    if (state.drawingRelayPhase === "draw" || state.drawingRelayPhase === "guess" || state.drawingRelayPhase === "done") {
      setDrawingRelayPhase(state.drawingRelayPhase as "draw" | "guess" | "done");
    }
    if (typeof state.drawingRelayMessage === "string") setDrawingRelayMessage(state.drawingRelayMessage);

    if (Array.isArray(state.fitPuzzleTiles)) setFitPuzzleTiles(state.fitPuzzleTiles as number[]);
    if (typeof state.fitPuzzleMoves === "number") setFitPuzzleMoves(state.fitPuzzleMoves);
    if (typeof state.fitPuzzleMessage === "string") setFitPuzzleMessage(state.fitPuzzleMessage);
    if (typeof state.isFitPuzzleOver === "boolean") setIsFitPuzzleOver(state.isFitPuzzleOver);

    if (Array.isArray(state.mahjongBoard)) setMahjongBoard(state.mahjongBoard as MahjongCell[][]);
    if (state.mahjongSelected === null || typeof state.mahjongSelected === "object") {
      setMahjongSelected(state.mahjongSelected as MahjongCoord | null);
    }
    if (typeof state.mahjongMessage === "string") setMahjongMessage(state.mahjongMessage);
    if (typeof state.isMahjongOver === "boolean") setIsMahjongOver(state.isMahjongOver);

    if (Array.isArray(state.pokerDeck)) setPokerDeck(state.pokerDeck as PokerCard[]);
    if (Array.isArray(state.pokerPlayerHand)) setPokerPlayerHand(state.pokerPlayerHand as PokerCard[]);
    if (Array.isArray(state.pokerCpuHand)) setPokerCpuHand(state.pokerCpuHand as PokerCard[]);
    if (Array.isArray(state.pokerHold)) setPokerHold(state.pokerHold as boolean[]);
    if (state.pokerPhase === "draw" || state.pokerPhase === "result") setPokerPhase(state.pokerPhase as "draw" | "result");
    if (typeof state.pokerMessage === "string") setPokerMessage(state.pokerMessage);
    if (state.pokerPlayerEval === null || typeof state.pokerPlayerEval === "object") {
      setPokerPlayerEval(state.pokerPlayerEval as PokerEval | null);
    }
    if (state.pokerCpuEval === null || typeof state.pokerCpuEval === "object") {
      setPokerCpuEval(state.pokerCpuEval as PokerEval | null);
    }
    if (
      state.pokerOutcome === "win"
      || state.pokerOutcome === "lose"
      || state.pokerOutcome === "draw"
      || state.pokerOutcome === "pending"
    ) {
      setPokerOutcome(state.pokerOutcome as "win" | "lose" | "draw" | "pending");
    }

    if (Array.isArray(state.solitaireStock)) setSolitaireStock(state.solitaireStock as SolitaireCard[]);
    if (Array.isArray(state.solitaireWaste)) setSolitaireWaste(state.solitaireWaste as SolitaireCard[]);
    if (state.solitaireFoundations && typeof state.solitaireFoundations === "object") {
      setSolitaireFoundations(state.solitaireFoundations as Record<SolitaireSuit, SolitaireCard[]>);
    }
    if (Array.isArray(state.solitaireTableau)) setSolitaireTableau(state.solitaireTableau as SolitaireCard[][]);
    if (state.solitaireSelection === null || typeof state.solitaireSelection === "object") {
      setSolitaireSelection(state.solitaireSelection as SolitaireSelection | null);
    }
    if (typeof state.solitaireMessage === "string") setSolitaireMessage(state.solitaireMessage);
    if (typeof state.isSolitaireOver === "boolean") setIsSolitaireOver(state.isSolitaireOver);

    if (typeof state.survivorsWave === "number") setSurvivorsWave(state.survivorsWave);
    if (typeof state.survivorsHp === "number") setSurvivorsHp(state.survivorsHp);
    if (typeof state.survivorsMaxHp === "number") setSurvivorsMaxHp(state.survivorsMaxHp);
    if (typeof state.survivorsLevel === "number") setSurvivorsLevel(state.survivorsLevel);
    if (typeof state.survivorsXp === "number") setSurvivorsXp(state.survivorsXp);
    if (typeof state.survivorsTimeSec === "number") setSurvivorsTimeSec(state.survivorsTimeSec);
    if (typeof state.survivorsKills === "number") setSurvivorsKills(state.survivorsKills);
    if (Array.isArray(state.survivorsEnemies)) setSurvivorsEnemies(state.survivorsEnemies as SurvivorsEnemy[]);
    if (typeof state.survivorsMessage === "string") setSurvivorsMessage(state.survivorsMessage);
    if (typeof state.isSurvivorsOver === "boolean") setIsSurvivorsOver(state.isSurvivorsOver);

    if (Array.isArray(state.unoDeck)) setUnoDeck(state.unoDeck as UnoCard[]);
    if (Array.isArray(state.unoPlayerHand)) setUnoPlayerHand(state.unoPlayerHand as UnoCard[]);
    if (Array.isArray(state.unoCpuHand)) setUnoCpuHand(state.unoCpuHand as UnoCard[]);
    if (state.unoTopCard === null || typeof state.unoTopCard === "object") setUnoTopCard(state.unoTopCard as UnoCard | null);
    if (state.unoTurn === "player" || state.unoTurn === "cpu") setUnoTurn(state.unoTurn as "player" | "cpu");
    if (typeof state.unoMessage === "string") setUnoMessage(state.unoMessage);
    if (typeof state.isUnoOver === "boolean") setIsUnoOver(state.isUnoOver);
  }, []);

  const connectRoom = useCallback(
    (requestedCode: string, createIfEmpty: boolean) => {
      const normalizedCode = requestedCode.replace(/[^0-9]/g, "").slice(0, 6);
      const code = normalizedCode || (createIfEmpty ? String(Math.floor(100000 + Math.random() * 900000)) : "");
      if (!code) {
        setMenuMessage(t("roomCodeRequired"));
        return;
      }

      closeRoomSocket();
      setRoomStatus(t("roomStateConnecting"));
      setMenuMessage("");

      let ws: WebSocket;
      try {
        ws = new WebSocket(roomServerUrl.trim());
      } catch {
        setRoomStatus(t("roomStateConnectFailed"));
        setMenuMessage(t("roomUrlInvalid"));
        return;
      }

      roomSocketRef.current = ws;

      ws.onopen = () => {
        setRoomStatus(t("roomStateConnected"));
        setRoomCode(code);
        const payload = {
          type: "hello",
          room: code,
          from: peerIdRef.current,
          name: playerName,
          roomPublic: roomVisibility === "public",
        };
        ws.send(JSON.stringify(payload));
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(String(event.data || "{}"));
          const type = String(payload?.type || "");

          if (type === "arcade-sync") {
            if (String(payload?.from || "") === peerIdRef.current) {
              return;
            }
            if (typeof payload?.chaos === "boolean") {
              setIsChaosMode(Boolean(payload.chaos));
            }
            if (payload?.snapshot && typeof payload.snapshot === "object") {
              applyArcadeSnapshot(payload.snapshot as Record<string, unknown>);
              setMenuMessage(t("syncApplied"));
            }
            return;
          }

          if (type === "arcade-chaos") {
            if (String(payload?.from || "") === peerIdRef.current) {
              return;
            }
            setIsChaosMode(Boolean(payload?.enabled));
            return;
          }

          if (type === "othello-request-move") {
            if (String(payload?.from || "") === peerIdRef.current) {
              return;
            }
            const row = Number(payload?.row);
            const col = Number(payload?.col);
            if (!Number.isInteger(row) || !Number.isInteger(col)) return;
            setPendingRemoteOthelloMove({ row, col });
            return;
          }

          if (type === "gomoku-request-move") {
            if (String(payload?.from || "") === peerIdRef.current) {
              return;
            }
            const row = Number(payload?.row);
            const col = Number(payload?.col);
            if (!Number.isInteger(row) || !Number.isInteger(col)) return;
            setPendingRemoteGomokuMove({ row, col });
            return;
          }

          if (type === "chess-request-click") {
            if (String(payload?.from || "") === peerIdRef.current) {
              return;
            }
            const row = Number(payload?.row);
            const col = Number(payload?.col);
            if (!Number.isInteger(row) || !Number.isInteger(col)) return;
            setPendingRemoteChessClick({ row, col });
            return;
          }

          if (type === "shogi-request-click") {
            if (String(payload?.from || "") === peerIdRef.current) {
              return;
            }
            const row = Number(payload?.row);
            const col = Number(payload?.col);
            if (!Number.isInteger(row) || !Number.isInteger(col)) return;
            setPendingRemoteShogiClick({ row, col });
            return;
          }

          if (type === "uno-request-action") {
            if (String(payload?.from || "") === peerIdRef.current) {
              return;
            }
            const action = String(payload?.action || "");
            if (action !== "play" && action !== "draw") return;
            const index = Number(payload?.index);
            setPendingRemoteUnoAction({ action, index: Number.isInteger(index) ? index : undefined });
            return;
          }

          if (type === "daifugo-request-action") {
            if (String(payload?.from || "") === peerIdRef.current) {
              return;
            }
            const action = String(payload?.action || "");
            if (action !== "play" && action !== "pass") return;
            const index = Number(payload?.index);
            setPendingRemoteDaifugoAction({ action, index: Number.isInteger(index) ? index : undefined });
            return;
          }

          if (type === "room-assigned") {
            if (payload.code) {
              setConnectedRoomCode(String(payload.code));
              setRoomCode(String(payload.code));
            }
            if (payload.role) {
              setRoomRole(String(payload.role));
            }
            return;
          }

          if (type === "room-state") {
            setConnectedRoomCode(String(payload.room || ""));
            setRoomParticipants(Array.isArray(payload.participants) ? payload.participants : []);
            const myself = Array.isArray(payload.participants)
              ? payload.participants.find((p: RoomParticipant) => p.id === peerIdRef.current)
              : null;
            if (myself?.role) {
              setRoomRole(myself.role);
            }
            return;
          }

          if (type === "room-full") {
            setMenuMessage(t("roomFull"));
            return;
          }

          if (type === "room-in-game") {
            setMenuMessage(t("roomInGame"));
            return;
          }

          if (type === "invite-token-required") {
            setMenuMessage(t("roomInviteRequired"));
            return;
          }

          if (type === "error") {
            const code = String(payload.code || "UNKNOWN");
            setMenuMessage(`${t("roomErrorPrefix")}: ${roomErrorLabel(code)}`);
          }
        } catch {
          // ignore malformed message
        }
      };

      ws.onerror = () => {
        setRoomStatus(t("roomStateError"));
        setMenuMessage(t("roomConnectFailed"));
      };

      ws.onclose = () => {
        setRoomStatus(t("roomStateClosed"));
      };
    },
    [applyArcadeSnapshot, closeRoomSocket, playerName, roomErrorLabel, roomServerUrl, roomVisibility, t],
  );

  useEffect(() => {
    return () => {
      closeRoomSocket();
    };
  }, [closeRoomSocket]);

  useEffect(() => {
    snapshotRef.current = {
      state: {
        activePanel,
        board,
        othelloFixedMask,
        othelloBrokenMask,
        othelloOverwriteRemaining,
        othelloImmutableCharges,
        othelloDestroyRemaining,
        othelloDoubleActionCharges,
        othelloImmutableArmed,
        othelloDestroyArmed,
        othelloDoubleArmed,
        othelloDestroySelectedSacrifices,
        othelloFirstCornerBonusUsed,
        othelloCornerLossStreak,
        currentPlayer,
        othelloMessage,
        isGameOver,
        gomokuBoard,
        gomokuPlayer,
        gomokuMessage,
        isGomokuOver,
        chessBoard,
        chessTurn,
        selectedChess,
        chessMessage,
        isChessOver,
        shogiBoard,
        shogiTurn,
        selectedShogi,
        shogiMessage,
        isShogiOver,
        mineBoard,
        mineMessage,
        isMineOver,
        numeronSecret,
        numeronDraft,
        numeronHistory,
        isNumeronOver,
        numeronMessage,
        blackjackDeck,
        blackjackPlayerHand,
        blackjackDealerHand,
        blackjackMessage,
        isBlackjackOver,
        chinchiroPlayerDice,
        chinchiroDealerDice,
        chinchiroMessage,
        isChinchiroOver,
        sevensHands,
        sevensTable,
        sevensTurn,
        sevensPassCount,
        sevensMessage,
        isSevensOver,
        daifugoHands,
        daifugoTableCard,
        daifugoTurn,
        daifugoPassStreak,
        daifugoMessage,
        isDaifugoOver,
        fourPanelTitle,
        fourPanelImages,
        fourPanelIndex,
        fourPanelMessage,
        drawingRelayPrompt,
        drawingRelayImage,
        drawingRelayGuess,
        drawingRelayPhase,
        drawingRelayMessage,
        fitPuzzleTiles,
        fitPuzzleMoves,
        fitPuzzleMessage,
        isFitPuzzleOver,
        mahjongBoard,
        mahjongSelected,
        mahjongMessage,
        isMahjongOver,
        pokerDeck,
        pokerPlayerHand,
        pokerCpuHand,
        pokerHold,
        pokerPhase,
        pokerMessage,
        pokerPlayerEval,
        pokerCpuEval,
        pokerOutcome,
        solitaireStock,
        solitaireWaste,
        solitaireFoundations,
        solitaireTableau,
        solitaireSelection,
        solitaireMessage,
        isSolitaireOver,
        survivorsWave,
        survivorsHp,
        survivorsMaxHp,
        survivorsLevel,
        survivorsXp,
        survivorsTimeSec,
        survivorsKills,
        survivorsEnemies,
        survivorsMessage,
        isSurvivorsOver,
        unoDeck,
        unoPlayerHand,
        unoCpuHand,
        unoTopCard,
        unoTurn,
        unoMessage,
        isUnoOver,
      },
    };
  });

  useEffect(() => {
    if (!isMultiSyncEnabled) return;
    if (!connectedRoomCode) return;
    if (roomRole !== "host") return;

    const push = () => {
      sendRoomEvent({
        type: "arcade-sync",
        chaos: isChaosMode,
        snapshot: snapshotRef.current,
      });
    };

    push();
    const timer = setInterval(push, 1000);
    return () => clearInterval(timer);
  }, [connectedRoomCode, isChaosMode, isMultiSyncEnabled, roomRole, sendRoomEvent]);

  useEffect(() => {
    if (!isChaosMode) return;
    if (activePanel === "menu" || activePanel === "scores" || activePanel === "status") return;

    const timer = setInterval(() => {
      if (activePanel === "gomoku" && !isGomokuOver) {
        setGomokuPlayer((prev) => (prev === 1 ? 2 : 1));
        setGomokuMessage(tf("chaosEvent", { event: "Gomoku turn swap" }));
      }

      if (activePanel === "chess" && !isChessOver) {
        setChessTurn((prev) => (prev === "w" ? "b" : "w"));
        setChessMessage(tf("chaosEvent", { event: "Chess turn swap" }));
      }

      if (activePanel === "shogi" && !isShogiOver) {
        setShogiTurn((prev) => (prev === "b" ? "w" : "b"));
        setShogiMessage(tf("chaosEvent", { event: "Shogi turn swap" }));
      }

      if (activePanel === "minesweeper" && !isMineOver) {
        setMineMessage(tf("chaosEvent", { event: "Mines pressure" }));
      }

      if (activePanel === "numeron" && !isNumeronOver) {
        setNumeronDraft((prev) => [...prev].reverse());
        setNumeronMessage(tf("chaosEvent", { event: "Numeron draft reverse" }));
      }

      if (activePanel === "uno" && !isUnoOver && unoDeck.length > 0) {
        const card = unoDeck[0];
        setUnoDeck((prev) => prev.slice(1));
        setUnoPlayerHand((prev) => [...prev, card]);
        setUnoMessage(tf("chaosEvent", { event: "UNO forced draw" }));
      }

      if (activePanel === "blackjack" && !isBlackjackOver && blackjackDeck.length > 0) {
        const card = blackjackDeck[0];
        setBlackjackDeck((prev) => prev.slice(1));
        setBlackjackPlayerHand((prev) => [...prev, card]);
        setBlackjackMessage(tf("chaosEvent", { event: "Blackjack forced hit" }));
      }

      if (activePanel === "chinchiro" && !isChinchiroOver) {
        setChinchiroMessage(tf("chaosEvent", { event: "Chinchiro shake" }));
      }

      if (activePanel === "sevens" && !isSevensOver) {
        setSevensPassCount((prev) => [prev[0] + 1, prev[1] + 1]);
        setSevensMessage(tf("chaosEvent", { event: "Sevens pass storm" }));
      }

      if (activePanel === "daifugo" && !isDaifugoOver) {
        setDaifugoPassStreak((prev) => prev + 1);
        setDaifugoMessage(tf("chaosEvent", { event: "Daifugo pressure" }));
      }

      if (activePanel === "fourPanel") {
        setFourPanelMessage(tf("chaosEvent", { event: "4-panel caption twist" }));
      }

      if (activePanel === "drawingRelay") {
        setDrawingRelayMessage(tf("chaosEvent", { event: "Drawing relay remix" }));
      }

      if (activePanel === "fitPuzzle" && !isFitPuzzleOver) {
        const blankIndex = fitPuzzleTiles.indexOf(0);
        const candidates: number[] = [];
        for (let index = 0; index < fitPuzzleTiles.length; index += 1) {
          if (fitPuzzleCanMove(index, blankIndex)) candidates.push(index);
        }
        if (candidates.length > 0) {
          const pick = candidates[Math.floor(Math.random() * candidates.length)];
          const next = [...fitPuzzleTiles];
          [next[pick], next[blankIndex]] = [next[blankIndex], next[pick]];
          setFitPuzzleTiles(next);
          setFitPuzzleMoves((prev) => prev + 1);
          setFitPuzzleMessage(tf("chaosEvent", { event: "Puzzle random shift" }));
        }
      }

      if (activePanel === "mahjong" && !isMahjongOver) {
        setMahjongBoard((prev) => ensureMahjongPlayable(reshuffleMahjongBoard(prev)));
        setMahjongMessage(tf("chaosEvent", { event: "Mahjong reshuffle" }));
      }

      if (activePanel === "survivors" && !isSurvivorsOver) {
        setSurvivorsHp((prev) => Math.max(0, prev - 3));
        setSurvivorsEnemies((prev) => prev.map((enemy) => ({ ...enemy, hp: Math.max(0, enemy.hp - 2) })).filter((enemy) => enemy.hp > 0));
        setSurvivorsMessage(tf("chaosEvent", { event: "Survivors storm damage" }));
      }

      if (activePanel === "poker" && pokerPhase === "draw") {
        const index = Math.floor(Math.random() * 5);
        setPokerHold((prev) => prev.map((flag, i) => (i === index ? !flag : flag)));
        setPokerMessage(tf("chaosEvent", { event: "Poker random hold" }));
      }

      if (activePanel === "solitaire" && !isSolitaireOver && solitaireStock.length > 0) {
        const card = solitaireStock[solitaireStock.length - 1];
        setSolitaireStock((prev) => prev.slice(0, -1));
        setSolitaireWaste((prev) => [...prev, { ...card, faceUp: true }]);
        setSolitaireMessage(tf("chaosEvent", { event: "Solitaire auto draw" }));
      }

      setMenuMessage(tf("chaosEvent", { event: activePanel }));
    }, 2800);

    return () => clearInterval(timer);
  }, [
    activePanel,
    blackjackDeck,
    fitPuzzleTiles,
    isBlackjackOver,
    isChessOver,
    isChaosMode,
    isChinchiroOver,
    isDaifugoOver,
    isFitPuzzleOver,
    isGomokuOver,
    isMahjongOver,
    isMineOver,
    isNumeronOver,
    isSevensOver,
    isShogiOver,
    isSolitaireOver,
    isSurvivorsOver,
    isUnoOver,
    pokerPhase,
    solitaireStock,
    tf,
    unoDeck,
  ]);

  const onBoardClick = (row: number, col: number, options?: { isRemote?: boolean }) => {
    if (isGameOver) return;

    const isRemote = Boolean(options?.isRemote);

    if (connectedRoomCode && !isRemote) {
      if (roomRole === "spectator") {
        setOthelloMessage(t("roomSpectatorReadonly"));
        return;
      }
      if (roomRole === "host" && currentPlayer !== 1) {
        setOthelloMessage(t("roomTurnOwnerOnly"));
        return;
      }
      if (roomRole === "guest") {
        if (currentPlayer !== 2) {
          setOthelloMessage(t("roomTurnOwnerOnly"));
          return;
        }
        sendRoomEvent({ type: "othello-request-move", row, col });
        setOthelloMessage(t("roomWaitingHostJudge"));
        return;
      }
    }

    const player = currentPlayer;
    const enemy: 1 | 2 = player === 1 ? 2 : 1;
    const playerIndex = othelloPlayerIndex(player);
    const enemyIndex = othelloPlayerIndex(enemy);

    const nextBoard = board.map((line) => [...line]);
    const nextFixedMask = othelloFixedMask.map((line) => [...line]);
    const nextBrokenMask = othelloBrokenMask.map((line) => [...line]);
    const nextOverwriteRemaining: [number, number] = [...othelloOverwriteRemaining];
    const nextImmutableCharges: [number, number] = [...othelloImmutableCharges];
    const nextDestroyRemaining: [number, number] = [...othelloDestroyRemaining];
    const nextDoubleCharges: [number, number] = [...othelloDoubleActionCharges];
    const nextImmutableArmed: [boolean, boolean] = [...othelloImmutableArmed];
    const nextDestroyArmed: [boolean, boolean] = [...othelloDestroyArmed];
    const nextDoubleArmed: [boolean, boolean] = [...othelloDoubleArmed];
    const nextDestroySelected: [{ row: number; col: number }[], { row: number; col: number }[]] = [
      [...othelloDestroySelectedSacrifices[0]],
      [...othelloDestroySelectedSacrifices[1]],
    ];
    const nextCornerLossStreak: [number, number] = [...othelloCornerLossStreak];
    let nextFirstCornerBonusUsed = othelloFirstCornerBonusUsed;

    const hasChaosMove = (targetPlayer: 1 | 2) => {
      const targetIndex = othelloPlayerIndex(targetPlayer);
      const targetEnemy: 1 | 2 = targetPlayer === 1 ? 2 : 1;
      const overwriteCount = nextOverwriteRemaining[targetIndex] ?? 0;
      for (let r = 0; r < BOARD_SIZE; r += 1) {
        for (let c = 0; c < BOARD_SIZE; c += 1) {
          if (nextBrokenMask[r][c]) continue;
          const cell = nextBoard[r][c];
          if (getFlips(nextBoard, r, c, targetPlayer).length > 0) return true;
          if (isChaosMode && overwriteCount > 0 && cell === targetEnemy && !nextFixedMask[r][c]) return true;
        }
      }
      return false;
    };

    const commitAndAdvance = (preferSamePlayer: boolean, extraLine = "") => {
      const nextPlayer: 1 | 2 = player === 1 ? 2 : 1;
      const currentName = player === 1 ? t("blackStone") : t("whiteStone");
      const nextName = nextPlayer === 1 ? t("blackStone") : t("whiteStone");
      const nextHasMove = hasChaosMove(nextPlayer);
      const currentHasMove = hasChaosMove(player);

      setBoard(nextBoard);
      setOthelloFixedMask(nextFixedMask);
      setOthelloBrokenMask(nextBrokenMask);
      setOthelloOverwriteRemaining(nextOverwriteRemaining);
      setOthelloImmutableCharges(nextImmutableCharges);
      setOthelloDestroyRemaining(nextDestroyRemaining);
      setOthelloDoubleActionCharges(nextDoubleCharges);
      setOthelloImmutableArmed(nextImmutableArmed);
      setOthelloDestroyArmed(nextDestroyArmed);
      setOthelloDoubleArmed(nextDoubleArmed);
      setOthelloDestroySelectedSacrifices(nextDestroySelected);
      setOthelloFirstCornerBonusUsed(nextFirstCornerBonusUsed);
      setOthelloCornerLossStreak(nextCornerLossStreak);

      if (preferSamePlayer && currentHasMove) {
        setCurrentPlayer(player);
        setOthelloMessage(`${tf("othelloPlayed", { current: currentName, next: currentName })}${extraLine}`);
        return;
      }

      if (nextHasMove) {
        setCurrentPlayer(nextPlayer);
        setOthelloMessage(`${tf("othelloPlayed", { current: currentName, next: nextName })}${extraLine}`);
        return;
      }

      if (currentHasMove) {
        setCurrentPlayer(player);
        setOthelloMessage(`${tf("othelloPass", { next: nextName, current: currentName })}${extraLine}`);
        return;
      }

      const counts = countStones(nextBoard);
      const result =
        counts.black === counts.white
          ? t("othelloResultDraw")
          : counts.black > counts.white
            ? t("othelloResultBlackWin")
            : t("othelloResultWhiteWin");
      setIsGameOver(true);
      setOthelloMessage(`${tf("othelloFinish", { result, black: counts.black, white: counts.white })}${extraLine}`);
    };

    const isMutableOwnDisc =
      nextBoard[row][col] === player && !nextFixedMask[row][col] && !nextBrokenMask[row][col];
    const isMutableEnemyDisc =
      nextBoard[row][col] === enemy && !nextFixedMask[row][col] && !nextBrokenMask[row][col];

    if (isChaosMode && nextImmutableArmed[playerIndex]) {
      if (!isMutableOwnDisc) {
        setOthelloMessage(t("othelloChaosNeedOwnDisc"));
        return;
      }
      if (!(row > 0 && row < BOARD_SIZE - 1 && col > 0 && col < BOARD_SIZE - 1)) {
        setOthelloMessage(t("othelloChaosNeedInnerDisc"));
        return;
      }
      if ((nextImmutableCharges[playerIndex] ?? 0) <= 0) {
        setOthelloMessage(t("othelloChaosNeedMutableDisc"));
        return;
      }
      nextFixedMask[row][col] = true;
      nextImmutableCharges[playerIndex] = Math.max(0, (nextImmutableCharges[playerIndex] ?? 0) - 1);
      nextImmutableArmed[playerIndex] = false;
      commitAndAdvance(false, ` / ${tf("chaosEvent", { event: t("othelloChaosImmutableDone") })}`);
      return;
    }

    if (isChaosMode && nextDestroyArmed[playerIndex]) {
      if ((nextDestroyRemaining[playerIndex] ?? 0) <= 0) {
        nextDestroyArmed[playerIndex] = false;
        setOthelloDestroyArmed(nextDestroyArmed);
        setOthelloMessage(t("othelloChaosNeedMutableDisc"));
        return;
      }

      const cornerSacrifices: Array<{ row: number; col: number }> = [];
      const selfSacrifices: Array<{ row: number; col: number }> = [];
      const destroyTargets: Array<{ row: number; col: number }> = [];
      for (let r = 0; r < BOARD_SIZE; r += 1) {
        for (let c = 0; c < BOARD_SIZE; c += 1) {
          if (nextBrokenMask[r][c] || nextFixedMask[r][c]) continue;
          if (nextBoard[r][c] === player) {
            selfSacrifices.push({ row: r, col: c });
            if (isOthelloCorner(r, c)) cornerSacrifices.push({ row: r, col: c });
          }
          if (nextBoard[r][c] === enemy) destroyTargets.push({ row: r, col: c });
        }
      }

      if (cornerSacrifices.length > 0) {
        if (!(isMutableOwnDisc && isOthelloCorner(row, col))) {
          setOthelloMessage(t("othelloChaosDestroySelectSacrifice"));
          return;
        }
        if (destroyTargets.length < OTHELLO_CORNER_SACRIFICE_DESTROY_COUNT) {
          setOthelloMessage(t("othelloChaosDestroySelectTarget"));
          return;
        }
        nextBoard[row][col] = 0;
        const targets = [...destroyTargets];
        for (let i = 0; i < OTHELLO_CORNER_SACRIFICE_DESTROY_COUNT; i += 1) {
          const pick = Math.floor(Math.random() * targets.length);
          const cell = targets.splice(pick, 1)[0];
          if (!cell) continue;
          nextBoard[cell.row][cell.col] = 0;
        }
        nextDestroyRemaining[playerIndex] = Math.max(0, (nextDestroyRemaining[playerIndex] ?? 0) - 1);
        nextDestroyArmed[playerIndex] = false;
        nextDestroySelected[playerIndex] = [];
        commitAndAdvance(false, ` / ${tf("chaosEvent", { event: t("othelloChaosDestroyDone") })}`);
        return;
      }

      const selected = nextDestroySelected[playerIndex] ?? [];
      const selectedIndex = selected.findIndex((cell) => cell.row === row && cell.col === col);

      if (selected.length >= OTHELLO_NO_CORNER_SACRIFICE_COUNT && isMutableEnemyDisc) {
        selected.forEach((cell) => {
          nextBoard[cell.row][cell.col] = 0;
        });
        nextBoard[row][col] = 0;
        nextDestroyRemaining[playerIndex] = Math.max(0, (nextDestroyRemaining[playerIndex] ?? 0) - 1);
        nextDestroyArmed[playerIndex] = false;
        nextDestroySelected[playerIndex] = [];
        commitAndAdvance(false, ` / ${tf("chaosEvent", { event: t("othelloChaosDestroyDone") })}`);
        return;
      }

      if (selectedIndex >= 0) {
        nextDestroySelected[playerIndex] = selected.filter((_, idx) => idx !== selectedIndex);
        setOthelloDestroySelectedSacrifices(nextDestroySelected);
        setOthelloMessage(t("othelloChaosDestroySelectSacrifice"));
        return;
      }

      if (!isMutableOwnDisc) {
        setOthelloMessage(t("othelloChaosDestroySelectSacrifice"));
        return;
      }

      if (selected.length >= OTHELLO_NO_CORNER_SACRIFICE_COUNT) {
        nextDestroySelected[playerIndex] = [{ row, col }];
        setOthelloDestroySelectedSacrifices(nextDestroySelected);
        setOthelloMessage(t("othelloChaosDestroySelectSacrifice"));
        return;
      }

      nextDestroySelected[playerIndex] = [...selected, { row, col }];
      setOthelloDestroySelectedSacrifices(nextDestroySelected);
      if (nextDestroySelected[playerIndex].length >= OTHELLO_NO_CORNER_SACRIFICE_COUNT) {
        setOthelloMessage(t("othelloChaosDestroySelectTarget"));
      } else {
        setOthelloMessage(t("othelloChaosDestroySelectSacrifice"));
      }
      return;
    }

    if (nextBrokenMask[row][col]) return;

    const targetCell = nextBoard[row][col];
    const canChaosOverwrite =
      isChaosMode
      && (nextOverwriteRemaining[playerIndex] ?? 0) > 0
      && targetCell === enemy
      && !nextFixedMask[row][col];

    let flips = getFlips(nextBoard, row, col, player);
    if (targetCell !== 0 && canChaosOverwrite) {
      const temp = nextBoard.map((line) => [...line]);
      temp[row][col] = 0;
      flips = getFlips(temp, row, col, player);
    }
    if (flips.length === 0 && !canChaosOverwrite) return;

    if (canChaosOverwrite) {
      nextOverwriteRemaining[playerIndex] = Math.max(0, (nextOverwriteRemaining[playerIndex] ?? 0) - 1);
    }

    nextBoard[row][col] = player;
    for (const [r, c] of flips) {
      if (!nextFixedMask[r][c]) {
        nextBoard[r][c] = player;
      }
    }

    if (isChaosMode && !nextFirstCornerBonusUsed && isOthelloCorner(row, col)) {
      nextOverwriteRemaining[enemyIndex] = (nextOverwriteRemaining[enemyIndex] ?? 0) + 1;
      nextFirstCornerBonusUsed = true;
    }

    if (isChaosMode && isOthelloCorner(row, col)) {
      nextCornerLossStreak[enemyIndex] = (nextCornerLossStreak[enemyIndex] ?? 0) + 1;
      nextCornerLossStreak[playerIndex] = 0;
      while (nextCornerLossStreak[enemyIndex] >= 2) {
        nextDoubleCharges[enemyIndex] = (nextDoubleCharges[enemyIndex] ?? 0) + 1;
        nextCornerLossStreak[enemyIndex] -= 2;
      }
    }

    let preferSamePlayer = false;
    let chaosLine = "";
    if (isChaosMode && nextDoubleArmed[playerIndex] && (nextDoubleCharges[playerIndex] ?? 0) > 0) {
      nextDoubleCharges[playerIndex] = Math.max(0, (nextDoubleCharges[playerIndex] ?? 0) - 1);
      nextDoubleArmed[playerIndex] = false;
      preferSamePlayer = true;
      chaosLine = ` / ${tf("chaosEvent", { event: t("othelloChaosDoubleDone") })}`;
    }

    commitAndAdvance(preferSamePlayer, chaosLine);
  };

  useEffect(() => {
    if (!pendingRemoteOthelloMove) return;
    if (roomRole !== "host") {
      setPendingRemoteOthelloMove(null);
      return;
    }
    onBoardClick(pendingRemoteOthelloMove.row, pendingRemoteOthelloMove.col, { isRemote: true });
    setPendingRemoteOthelloMove(null);
  }, [pendingRemoteOthelloMove, roomRole]);

  useEffect(() => {
    if (!pendingRemoteGomokuMove) return;
    if (roomRole !== "host") {
      setPendingRemoteGomokuMove(null);
      return;
    }
    onGomokuClick(pendingRemoteGomokuMove.row, pendingRemoteGomokuMove.col, { isRemote: true });
    setPendingRemoteGomokuMove(null);
  }, [pendingRemoteGomokuMove, roomRole]);

  useEffect(() => {
    if (!pendingRemoteChessClick) return;
    if (roomRole !== "host") {
      setPendingRemoteChessClick(null);
      return;
    }
    onChessClick(pendingRemoteChessClick.row, pendingRemoteChessClick.col, { isRemote: true });
    setPendingRemoteChessClick(null);
  }, [pendingRemoteChessClick, roomRole]);

  useEffect(() => {
    if (!pendingRemoteShogiClick) return;
    if (roomRole !== "host") {
      setPendingRemoteShogiClick(null);
      return;
    }
    onShogiClick(pendingRemoteShogiClick.row, pendingRemoteShogiClick.col, { isRemote: true });
    setPendingRemoteShogiClick(null);
  }, [pendingRemoteShogiClick, roomRole]);

  useEffect(() => {
    if (!pendingRemoteDaifugoAction) return;
    if (roomRole !== "host") {
      setPendingRemoteDaifugoAction(null);
      return;
    }
    if (pendingRemoteDaifugoAction.action === "play" && Number.isInteger(pendingRemoteDaifugoAction.index)) {
      onDaifugoPlay(Number(pendingRemoteDaifugoAction.index), { isRemote: true, side: "cpu" });
    }
    if (pendingRemoteDaifugoAction.action === "pass") {
      onDaifugoPass({ isRemote: true, side: "cpu" });
    }
    setPendingRemoteDaifugoAction(null);
  }, [pendingRemoteDaifugoAction, roomRole]);

  const resetGomoku = () => {
    setGomokuBoard(createGomokuBoard());
    setGomokuPlayer(1);
    setIsGomokuOver(false);
    setGomokuMessage(t("gomokuTurnBlack"));
  };

  const onGomokuClick = (row: number, col: number, options?: { isRemote?: boolean }) => {
    if (isGomokuOver) return;
    const isRemote = Boolean(options?.isRemote);

    if (connectedRoomCode && !isRemote) {
      if (roomRole === "spectator") {
        setGomokuMessage(t("roomSpectatorReadonly"));
        return;
      }
      if (roomRole === "host" && gomokuPlayer !== 1) {
        setGomokuMessage(t("roomTurnOwnerOnly"));
        return;
      }
      if (roomRole === "guest") {
        if (gomokuPlayer !== 2) {
          setGomokuMessage(t("roomTurnOwnerOnly"));
          return;
        }
        sendRoomEvent({ type: "gomoku-request-move", row, col });
        setGomokuMessage(t("roomWaitingHostJudge"));
        return;
      }
    }

    if (gomokuBoard[row][col] !== 0) return;

    const next = gomokuBoard.map((line) => [...line]);
    next[row][col] = gomokuPlayer;
    setGomokuBoard(next);

    const currentName = gomokuPlayer === 1 ? t("blackStone") : t("whiteStone");
    const nextPlayer: 1 | 2 = gomokuPlayer === 1 ? 2 : 1;
    const nextName = nextPlayer === 1 ? t("blackStone") : t("whiteStone");

    if (hasFiveInRow(next, row, col, gomokuPlayer)) {
      setIsGomokuOver(true);
      setGomokuMessage(tf("gomokuWin", { winner: currentName }));
      return;
    }

    const isDraw = next.every((line) => line.every((cell) => cell !== 0));
    if (isDraw) {
      setIsGomokuOver(true);
      setGomokuMessage(t("gomokuDraw"));
      return;
    }

    setGomokuPlayer(nextPlayer);
    setGomokuMessage(nextPlayer === 1 ? t("gomokuTurnBlack") : t("gomokuTurnWhite"));
    setMenuMessage(`${currentName} → ${nextName}`);
  };

  const resetChess = () => {
    setChessBoard(createChessBoard());
    setChessTurn("w");
    setSelectedChess(null);
    setIsChessOver(false);
    setChessMessage(t("chessTurnWhite"));
  };

  const onChessClick = (row: number, col: number, options?: { isRemote?: boolean }) => {
    if (isChessOver) return;
    const isRemote = Boolean(options?.isRemote);

    if (connectedRoomCode && !isRemote) {
      if (roomRole === "spectator") {
        setChessMessage(t("roomSpectatorReadonly"));
        return;
      }
      if (roomRole === "host" && chessTurn !== "w") {
        setChessMessage(t("roomTurnOwnerOnly"));
        return;
      }
      if (roomRole === "guest") {
        if (chessTurn !== "b") {
          setChessMessage(t("roomTurnOwnerOnly"));
          return;
        }
        sendRoomEvent({ type: "chess-request-click", row, col });
        setChessMessage(t("roomWaitingHostJudge"));
        return;
      }
    }

    const piece = chessBoard[row][col];

    if (!selectedChess) {
      if (!piece || piece.color !== chessTurn) {
        setChessMessage(t("chessSelectOwn"));
        return;
      }
      setSelectedChess({ row, col });
      return;
    }

    if (selectedChess.row === row && selectedChess.col === col) {
      setSelectedChess(null);
      return;
    }

    if (
      piece
      && piece.color === chessTurn
      && !isLegalChessMove(chessBoard, selectedChess.row, selectedChess.col, row, col, chessTurn)
    ) {
      setSelectedChess({ row, col });
      return;
    }

    const legal = isLegalChessMove(chessBoard, selectedChess.row, selectedChess.col, row, col, chessTurn);
    if (!legal) {
      setChessMessage(t("chessIllegalMove"));
      return;
    }

    const next = chessBoard.map((line) => [...line]);
    const moving = next[selectedChess.row][selectedChess.col];
    const captured = next[row][col];
    next[row][col] = moving;
    next[selectedChess.row][selectedChess.col] = null;

    // Simple promotion to queen when a pawn reaches the back rank.
    if (moving?.type === "P" && (row === 0 || row === 7)) {
      next[row][col] = { color: moving.color, type: "Q" };
    }

    setChessBoard(next);
    setSelectedChess(null);

    if (captured?.type === "K") {
      const winner = chessTurn === "w" ? t("whiteStone") : t("blackStone");
      setChessMessage(tf("chessWin", { winner }));
      setIsChessOver(true);
      return;
    }

    const nextTurn: ChessColor = chessTurn === "w" ? "b" : "w";
    setChessTurn(nextTurn);
    setChessMessage(nextTurn === "w" ? t("chessTurnWhite") : t("chessTurnBlack"));
  };

  const resetShogi = () => {
    setShogiBoard(createShogiBoard());
    setShogiTurn("b");
    setSelectedShogi(null);
    setIsShogiOver(false);
    setShogiMessage(t("shogiTurnBlack"));
  };

  const onShogiClick = (row: number, col: number, options?: { isRemote?: boolean }) => {
    if (isShogiOver) return;
    const isRemote = Boolean(options?.isRemote);

    if (connectedRoomCode && !isRemote) {
      if (roomRole === "spectator") {
        setShogiMessage(t("roomSpectatorReadonly"));
        return;
      }
      if (roomRole === "host" && shogiTurn !== "b") {
        setShogiMessage(t("roomTurnOwnerOnly"));
        return;
      }
      if (roomRole === "guest") {
        if (shogiTurn !== "w") {
          setShogiMessage(t("roomTurnOwnerOnly"));
          return;
        }
        sendRoomEvent({ type: "shogi-request-click", row, col });
        setShogiMessage(t("roomWaitingHostJudge"));
        return;
      }
    }

    const piece = shogiBoard[row][col];

    if (!selectedShogi) {
      if (!piece || piece.color !== shogiTurn) {
        setShogiMessage(t("shogiSelectOwn"));
        return;
      }
      setSelectedShogi({ row, col });
      return;
    }

    if (selectedShogi.row === row && selectedShogi.col === col) {
      setSelectedShogi(null);
      return;
    }

    if (
      piece
      && piece.color === shogiTurn
      && !isLegalShogiMove(shogiBoard, selectedShogi.row, selectedShogi.col, row, col, shogiTurn)
    ) {
      setSelectedShogi({ row, col });
      return;
    }

    const legal = isLegalShogiMove(shogiBoard, selectedShogi.row, selectedShogi.col, row, col, shogiTurn);
    if (!legal) {
      setShogiMessage(t("shogiIllegalMove"));
      return;
    }

    const next = shogiBoard.map((line) => [...line]);
    const moving = next[selectedShogi.row][selectedShogi.col];
    const captured = next[row][col];
    next[row][col] = moving;
    next[selectedShogi.row][selectedShogi.col] = null;

    setShogiBoard(next);
    setSelectedShogi(null);

    if (captured?.type === "K") {
      const winner = shogiTurn === "b" ? t("blackStone") : t("whiteStone");
      setShogiMessage(tf("shogiWin", { winner }));
      setIsShogiOver(true);
      return;
    }

    const nextTurn: ShogiColor = shogiTurn === "b" ? "w" : "b";
    setShogiTurn(nextTurn);
    setShogiMessage(nextTurn === "b" ? t("shogiTurnBlack") : t("shogiTurnWhite"));
  };

  const resetMinesweeper = () => {
    setMineBoard(createMinesweeperBoard());
    setIsMineOver(false);
    setMineMessage(t("minesHint"));
  };

  const onMinesClick = (row: number, col: number) => {
    if (isMineOver) return;
    const current = mineBoard[row][col];
    if (current.open) return;

    const next = openMinesCell(mineBoard, row, col);
    setMineBoard(next);

    if (next[row][col].mine) {
      setIsMineOver(true);
      setMineMessage(t("minesGameOver"));
      return;
    }

    const total = next.length * next.length;
    const mineCount = next.flat().filter((cell) => cell.mine).length;
    const openedSafe = next.flat().filter((cell) => cell.open && !cell.mine).length;
    if (openedSafe >= total - mineCount) {
      setIsMineOver(true);
      setMineMessage(t("minesCleared"));
      return;
    }

    setMineMessage(t("minesHint"));
  };

  const resetNumeron = () => {
    setNumeronSecret(createNumeronSecret());
    setNumeronDraft([]);
    setNumeronHistory([]);
    setIsNumeronOver(false);
    setNumeronMessage(t("numeronHint"));
  };

  const onNumeronPickDigit = (digit: string) => {
    if (isNumeronOver) return;
    if (!/^\d$/.test(digit)) return;
    setNumeronDraft((prev) => {
      if (prev.includes(digit) || prev.length >= 3) return prev;
      return [...prev, digit];
    });
  };

  const onNumeronSubmit = () => {
    if (isNumeronOver) return;
    const guess = numeronDraft.join("");
    if (!/^\d{3}$/.test(guess) || new Set(guess.split("")).size !== 3) {
      setNumeronMessage(t("numeronInvalidGuess"));
      return;
    }

    const result = evaluateNumeron(numeronSecret, guess);
    setNumeronHistory((prev) => [...prev, { guess, hits: result.hits, blows: result.blows }]);
    setNumeronDraft([]);
    setNumeronMessage(tf("numeronResult", { guess, hits: result.hits, blows: result.blows }));

    if (result.hits >= 3) {
      setIsNumeronOver(true);
      setNumeronMessage(t("numeronWin"));
    }
  };

  const resetBlackjack = useCallback(() => {
    const deck = shuffleBlackjackDeck(createBlackjackDeck());
    const player = [deck[0], deck[2]].filter(Boolean) as BlackjackCard[];
    const dealer = [deck[1], deck[3]].filter(Boolean) as BlackjackCard[];
    const rest = deck.slice(4);
    setBlackjackDeck(rest);
    setBlackjackPlayerHand(player);
    setBlackjackDealerHand(dealer);
    setIsBlackjackOver(false);
    setBlackjackMessage(t("blackjackYourTurn"));
  }, [t]);

  const onBlackjackHit = () => {
    if (isBlackjackOver || blackjackDeck.length === 0) return;
    const nextCard = blackjackDeck[0];
    const restDeck = blackjackDeck.slice(1);
    const nextHand = [...blackjackPlayerHand, nextCard];
    const value = blackjackHandValue(nextHand);

    setBlackjackDeck(restDeck);
    setBlackjackPlayerHand(nextHand);

    if (value > 21) {
      setIsBlackjackOver(true);
      setBlackjackMessage(t("blackjackBust"));
      return;
    }

    setBlackjackMessage(t("blackjackYourTurn"));
  };

  const onBlackjackStand = () => {
    if (isBlackjackOver) return;

    let localDeck = [...blackjackDeck];
    const dealer = [...blackjackDealerHand];
    while (blackjackHandValue(dealer) < 17 && localDeck.length > 0) {
      dealer.push(localDeck.shift() as BlackjackCard);
    }

    const playerValue = blackjackHandValue(blackjackPlayerHand);
    const dealerValue = blackjackHandValue(dealer);

    setBlackjackDeck(localDeck);
    setBlackjackDealerHand(dealer);
    setIsBlackjackOver(true);

    if (dealerValue > 21 || playerValue > dealerValue) {
      setBlackjackMessage(t("blackjackWin"));
      return;
    }
    if (playerValue < dealerValue) {
      setBlackjackMessage(t("blackjackLose"));
      return;
    }
    setBlackjackMessage(t("blackjackPush"));
  };

  const chinchiroHandLabel = useCallback((hand: ChinchiroHand) => {
    if (hand.key === "pinzoro") return t("chinchiroPinzoro");
    if (hand.key === "arashi") return t("chinchiroArashi");
    if (hand.key === "shigoro") return t("chinchiroShigoro");
    if (hand.key === "hifumi") return t("chinchiroHifumi");
    if (hand.key === "point") return tf("chinchiroPoint", { eye: hand.eye });
    return t("chinchiroButa");
  }, [t, tf]);

  const resetChinchiro = useCallback(() => {
    setChinchiroPlayerDice(null);
    setChinchiroDealerDice(null);
    setIsChinchiroOver(false);
    setChinchiroMessage(t("chinchiroHint"));
  }, [t]);

  const onChinchiroRoll = () => {
    if (isChinchiroOver) return;
    const player = rollChinchiroDice();
    const dealer = rollChinchiroDice();
    const playerHand = evaluateChinchiroHand(player);
    const dealerHand = evaluateChinchiroHand(dealer);

    setChinchiroPlayerDice(player);
    setChinchiroDealerDice(dealer);
    setIsChinchiroOver(true);

    let resultLabel = t("chinchiroDraw");
    if (playerHand.rank > dealerHand.rank || (playerHand.rank === dealerHand.rank && playerHand.eye > dealerHand.eye)) {
      resultLabel = t("chinchiroWin");
    } else if (playerHand.rank < dealerHand.rank || (playerHand.rank === dealerHand.rank && playerHand.eye < dealerHand.eye)) {
      resultLabel = t("chinchiroLose");
    }

    setChinchiroMessage(
      tf("chinchiroResultLine", {
        player: chinchiroHandLabel(playerHand),
        dealer: chinchiroHandLabel(dealerHand),
        result: resultLabel,
      }),
    );
  };

  const resetSevens = useCallback(() => {
    const shuffled = shuffleSevensDeck(createSevensDeck());
    const player: SevensCard[] = [];
    const cpu: SevensCard[] = [];
    shuffled.forEach((card, index) => {
      if (index % 2 === 0) player.push(card);
      else cpu.push(card);
    });

    setSevensHands([sortSevensHand(player), sortSevensHand(cpu)]);
    setSevensTable(createSevensTable());
    setSevensTurn("player");
    setSevensPassCount([0, 0]);
    setIsSevensOver(false);
    setSevensMessage(t("sevensYourTurn"));
  }, [t]);

  const onSevensPlay = (index: number) => {
    if (isSevensOver || sevensTurn !== "player") return;
    const playerHand = sevensHands[0];
    const card = playerHand[index];
    if (!card) return;
    if (!isSevensPlayable(card, sevensTable)) {
      setSevensMessage(t("sevensNoPlayable"));
      return;
    }

    const nextTable = applySevensCard(sevensTable, card);
    const nextPlayer = playerHand.filter((_, i) => i !== index);
    const nextHands: [SevensCard[], SevensCard[]] = [nextPlayer, sevensHands[1]];
    setSevensTable(nextTable);
    setSevensHands(nextHands);

    if (nextPlayer.length === 0) {
      setIsSevensOver(true);
      setSevensMessage(t("sevensPlayerWin"));
      return;
    }

    setSevensTurn("cpu");
    setSevensMessage(t("sevensCpuTurn"));
  };

  const onSevensPass = () => {
    if (isSevensOver || sevensTurn !== "player") return;
    if (hasSevensPlayable(sevensHands[0], sevensTable)) {
      setSevensMessage(t("sevensYourTurn"));
      return;
    }
    setSevensPassCount((prev) => [prev[0] + 1, prev[1]]);
    setSevensTurn("cpu");
    setSevensMessage(t("sevensCpuTurn"));
  };

  const resetDaifugo = useCallback(() => {
    const shuffled = shuffleDaifugoDeck(createDaifugoDeck());
    const player = sortDaifugoHand(shuffled.filter((_, i) => i % 2 === 0));
    const cpu = sortDaifugoHand(shuffled.filter((_, i) => i % 2 === 1));
    setDaifugoHands([player, cpu]);
    setDaifugoTableCard(null);
    setDaifugoTurn("player");
    setDaifugoPassStreak(0);
    setIsDaifugoOver(false);
    setDaifugoMessage(t("daifugoYourTurn"));
  }, [t]);

  const onDaifugoPlay = (index: number, options?: { isRemote?: boolean; side?: "player" | "cpu" }) => {
    const isRemote = Boolean(options?.isRemote);
    const side = options?.side || (connectedRoomCode && roomRole === "guest" ? "cpu" : "player");
    if (isDaifugoOver || daifugoTurn !== side) return;

    if (connectedRoomCode && !isRemote) {
      if (roomRole === "spectator") {
        setDaifugoMessage(t("roomSpectatorReadonly"));
        return;
      }
      if (!canOperateDaifugoNow) {
        setDaifugoMessage(t("roomTurnOwnerOnly"));
        return;
      }
      if (roomRole === "guest") {
        sendRoomEvent({ type: "daifugo-request-action", action: "play", index });
        setDaifugoMessage(t("roomWaitingHostJudge"));
        return;
      }
    }

    const handIndex = side === "player" ? 0 : 1;
    const enemyIndex = side === "player" ? 1 : 0;
    const playerHand = daifugoHands[handIndex];
    const card = playerHand[index];
    if (!card) return;
    if (daifugoTableCard && daifugoPower(card.rank) <= daifugoPower(daifugoTableCard.rank)) {
      setDaifugoMessage(t("daifugoNeedHigher"));
      return;
    }

    const nextPlayer = playerHand.filter((_, i) => i !== index);
    const nextHands: [DaifugoCard[], DaifugoCard[]] =
      side === "player" ? [nextPlayer, daifugoHands[1]] : [daifugoHands[0], nextPlayer];
    setDaifugoHands(nextHands);
    setDaifugoTableCard(card);
    setDaifugoPassStreak(0);

    if (nextPlayer.length === 0) {
      setIsDaifugoOver(true);
      setDaifugoMessage(side === "player" ? t("daifugoPlayerWin") : t("daifugoCpuWin"));
      return;
    }

    const nextTurn = side === "player" ? "cpu" : "player";
    setDaifugoTurn(nextTurn);
    if (connectedRoomCode) {
      const nextIsYou = daifugoRoomPlayer ? daifugoRoomPlayer === nextTurn : false;
      setDaifugoMessage(roomTurnText(nextIsYou));
    } else {
      setDaifugoMessage(nextTurn === "cpu" ? t("daifugoCpuTurn") : t("daifugoYourTurn"));
    }
  };

  const onDaifugoPass = (options?: { isRemote?: boolean; side?: "player" | "cpu" }) => {
    const isRemote = Boolean(options?.isRemote);
    const side = options?.side || (connectedRoomCode && roomRole === "guest" ? "cpu" : "player");
    if (isDaifugoOver || daifugoTurn !== side) return;

    if (connectedRoomCode && !isRemote) {
      if (roomRole === "spectator") {
        setDaifugoMessage(t("roomSpectatorReadonly"));
        return;
      }
      if (!canOperateDaifugoNow) {
        setDaifugoMessage(t("roomTurnOwnerOnly"));
        return;
      }
      if (roomRole === "guest") {
        sendRoomEvent({ type: "daifugo-request-action", action: "pass" });
        setDaifugoMessage(t("roomWaitingHostJudge"));
        return;
      }
    }

    if (!daifugoTableCard) return;
    const streak = daifugoPassStreak + 1;
    setDaifugoPassStreak(streak);
    setDaifugoMessage(tf("daifugoPassInfo", { who: side === "player" ? "YOU" : "CPU" }));
    if (streak >= 2) {
      setDaifugoTableCard(null);
      setDaifugoPassStreak(0);
      setDaifugoTurn(side);
      setDaifugoMessage(t("daifugoRoundClear"));
      return;
    }
    setDaifugoTurn(side === "player" ? "cpu" : "player");
  };

  const clearFourPanelCanvas = useCallback(() => {
    const canvas = fourPanelCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    fourPanelHasStrokeRef.current = false;
  }, []);

  const resetFourPanel = useCallback(() => {
    const title = FOUR_PANEL_RANDOM_TITLES[Math.floor(Math.random() * FOUR_PANEL_RANDOM_TITLES.length)] || FOUR_PANEL_RANDOM_TITLES[0];
    setFourPanelTitle(title);
    setFourPanelImages([]);
    setFourPanelIndex(0);
    setFourPanelMessage(t("fourPanelHint"));
    clearFourPanelCanvas();
  }, [clearFourPanelCanvas, t]);

  const fourPanelPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const onFourPanelPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (activePanel !== "fourPanel" || fourPanelIndex >= 4) return;
    const canvas = event.currentTarget;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = fourPanelPoint(event);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    fourPanelDrawingRef.current = true;
    canvas.setPointerCapture(event.pointerId);
  };

  const onFourPanelPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!fourPanelDrawingRef.current || activePanel !== "fourPanel" || fourPanelIndex >= 4) return;
    const canvas = event.currentTarget;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = fourPanelPoint(event);
    ctx.lineTo(x, y);
    ctx.stroke();
    fourPanelHasStrokeRef.current = true;
  };

  const onFourPanelPointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!fourPanelDrawingRef.current) return;
    fourPanelDrawingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const submitFourPanel = () => {
    if (fourPanelIndex >= 4) return;
    const canvas = fourPanelCanvasRef.current;
    if (!canvas) return;
    if (!fourPanelHasStrokeRef.current) {
      setFourPanelMessage(t("fourPanelNotDrawn"));
      return;
    }

    const image = canvas.toDataURL("image/png");
    const next = [...fourPanelImages, image];
    setFourPanelImages(next);
    setFourPanelIndex(next.length);
    clearFourPanelCanvas();

    if (next.length >= 4) {
      setFourPanelMessage(t("fourPanelDone"));
      return;
    }

    setFourPanelMessage(tf("fourPanelProgress", { current: next.length + 1 }));
  };

  const clearDrawingRelayCanvas = useCallback(() => {
    const canvas = drawingRelayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawingRelayHasStrokeRef.current = false;
  }, []);

  const resetDrawingRelay = useCallback(() => {
    const prompt = DRAWING_RELAY_PROMPTS[Math.floor(Math.random() * DRAWING_RELAY_PROMPTS.length)] || DRAWING_RELAY_PROMPTS[0];
    setDrawingRelayPrompt(prompt);
    setDrawingRelayImage("");
    setDrawingRelayGuess("");
    setDrawingRelayPhase("draw");
    setDrawingRelayMessage(t("drawingRelayHintDraw"));
    clearDrawingRelayCanvas();
  }, [clearDrawingRelayCanvas, t]);

  const drawingRelayPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const onDrawingRelayPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (activePanel !== "drawingRelay" || drawingRelayPhase !== "draw") return;
    const canvas = event.currentTarget;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = drawingRelayPoint(event);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    drawingRelayDrawingRef.current = true;
    canvas.setPointerCapture(event.pointerId);
  };

  const onDrawingRelayPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRelayDrawingRef.current || activePanel !== "drawingRelay" || drawingRelayPhase !== "draw") return;
    const canvas = event.currentTarget;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = drawingRelayPoint(event);
    ctx.lineTo(x, y);
    ctx.stroke();
    drawingRelayHasStrokeRef.current = true;
  };

  const onDrawingRelayPointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRelayDrawingRef.current) return;
    drawingRelayDrawingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const submitDrawingRelayDrawing = () => {
    if (drawingRelayPhase !== "draw") return;
    const canvas = drawingRelayCanvasRef.current;
    if (!canvas) return;
    if (!drawingRelayHasStrokeRef.current) {
      setDrawingRelayMessage(t("drawingRelayNotDrawn"));
      return;
    }
    const image = canvas.toDataURL("image/png");
    setDrawingRelayImage(image);
    setDrawingRelayPhase("guess");
    setDrawingRelayMessage(t("drawingRelayHintGuess"));
  };

  const submitDrawingRelayGuess = () => {
    if (drawingRelayPhase !== "guess") return;
    const answer = drawingRelayGuess.trim();
    if (!answer) {
      setDrawingRelayMessage(t("drawingRelayNeedGuess"));
      return;
    }
    setDrawingRelayPhase("done");
    setDrawingRelayMessage(tf("drawingRelayDone", { prompt: drawingRelayPrompt, guess: answer }));
  };

  const resetFitPuzzle = useCallback(() => {
    setFitPuzzleTiles(createFitPuzzleShuffledTiles());
    setFitPuzzleMoves(0);
    setIsFitPuzzleOver(false);
    setFitPuzzleMessage(t("fitPuzzleHint"));
  }, [t]);

  const onFitPuzzleTileClick = (index: number) => {
    if (isFitPuzzleOver) return;
    const blankIndex = fitPuzzleTiles.indexOf(0);
    if (blankIndex < 0) return;
    if (!fitPuzzleCanMove(index, blankIndex)) {
      setFitPuzzleMessage(t("fitPuzzleOnlyAdjacent"));
      return;
    }

    const nextTiles = [...fitPuzzleTiles];
    [nextTiles[index], nextTiles[blankIndex]] = [nextTiles[blankIndex], nextTiles[index]];
    const nextMoves = fitPuzzleMoves + 1;
    setFitPuzzleTiles(nextTiles);
    setFitPuzzleMoves(nextMoves);

    if (isFitPuzzleSolved(nextTiles)) {
      setIsFitPuzzleOver(true);
      setFitPuzzleMessage(tf("fitPuzzleSolved", { moves: nextMoves }));
      return;
    }

    setFitPuzzleMessage(tf("fitPuzzleProgress", { moves: nextMoves }));
  };

  const resetMahjong = useCallback(() => {
    setMahjongBoard(createMahjongStartBoard());
    setMahjongSelected(null);
    setIsMahjongOver(false);
    setMahjongMessage(t("mahjongHint"));
  }, [t]);

  const onMahjongHint = () => {
    if (isMahjongOver) return;
    const move = mahjongFindFirstMove(mahjongBoard);
    if (!move) {
      setMahjongMessage(t("mahjongNoHint"));
      return;
    }
    const aLabel = `${mahjongTileLabel(mahjongBoard[move.a.row][move.a.col] ?? -1)}(${move.a.row + 1},${move.a.col + 1})`;
    const bLabel = `${mahjongTileLabel(mahjongBoard[move.b.row][move.b.col] ?? -1)}(${move.b.row + 1},${move.b.col + 1})`;
    setMahjongMessage(tf("mahjongHintLine", { a: aLabel, b: bLabel }));
  };

  const onMahjongShuffle = () => {
    if (isMahjongOver) return;
    const next = ensureMahjongPlayable(reshuffleMahjongBoard(mahjongBoard));
    setMahjongBoard(next);
    setMahjongSelected(null);
    setMahjongMessage(t("mahjongHint"));
  };

  const onMahjongTileClick = (row: number, col: number) => {
    if (isMahjongOver) return;
    const tile = mahjongBoard[row]?.[col] ?? null;
    if (tile === null) return;

    const picked = { row, col };
    if (!mahjongSelected) {
      setMahjongSelected(picked);
      return;
    }

    if (mahjongSelected.row === row && mahjongSelected.col === col) {
      setMahjongSelected(null);
      return;
    }

    const selectedTile = mahjongBoard[mahjongSelected.row]?.[mahjongSelected.col] ?? null;
    if (selectedTile !== tile) {
      setMahjongSelected(picked);
      setMahjongMessage(t("mahjongSwitched"));
      return;
    }

    if (!mahjongCanConnectWithTwoTurns(mahjongBoard, mahjongSelected, picked)) {
      setMahjongSelected(picked);
      setMahjongMessage(t("mahjongBlocked"));
      return;
    }

    const nextBoard = cloneMahjongBoard(mahjongBoard);
    nextBoard[mahjongSelected.row][mahjongSelected.col] = null;
    nextBoard[row][col] = null;

    if (mahjongRemainingCount(nextBoard) === 0) {
      setMahjongBoard(nextBoard);
      setMahjongSelected(null);
      setIsMahjongOver(true);
      setMahjongMessage(t("mahjongClear"));
      return;
    }

    if (!mahjongFindFirstMove(nextBoard)) {
      const playable = ensureMahjongPlayable(nextBoard);
      setMahjongBoard(playable);
      setMahjongSelected(null);
      setMahjongMessage(t("mahjongRemovedAndShuffle"));
      return;
    }

    setMahjongBoard(nextBoard);
    setMahjongSelected(null);
    setMahjongMessage(t("mahjongRemoved"));
  };

  const resetPoker = useCallback(() => {
    const deck = shufflePokerDeck(createPokerDeck());
    const player = deck.slice(0, 5);
    const cpu = deck.slice(5, 10);
    const rest = deck.slice(10);
    setPokerPlayerHand(player);
    setPokerCpuHand(cpu);
    setPokerDeck(rest);
    setPokerHold([false, false, false, false, false]);
    setPokerPhase("draw");
    setPokerMessage(t("pokerHint"));
    setPokerPlayerEval(null);
    setPokerCpuEval(null);
    setPokerOutcome("pending");
  }, [t]);

  const togglePokerHold = (index: number) => {
    if (pokerPhase !== "draw") return;
    setPokerHold((prev) => prev.map((flag, i) => (i === index ? !flag : flag)));
  };

  const onPokerDraw = () => {
    if (pokerPhase !== "draw") return;
    let rest = [...pokerDeck];

    const nextPlayer = pokerPlayerHand.map((card, index) => {
      if (pokerHold[index]) return card;
      const next = rest.shift();
      return next || card;
    });

    const cpuHold = pokerCpuHoldIndexes(pokerCpuHand);
    const nextCpu = pokerCpuHand.map((card, index) => {
      if (cpuHold.has(index)) return card;
      const next = rest.shift();
      return next || card;
    });

    const playerEval = evaluatePokerHand(nextPlayer);
    const cpuEval = evaluatePokerHand(nextCpu);
    const cmp = comparePokerEval(playerEval, cpuEval);

    setPokerPlayerHand(nextPlayer);
    setPokerCpuHand(nextCpu);
    setPokerDeck(rest);
    setPokerPhase("result");
    setPokerPlayerEval(playerEval);
    setPokerCpuEval(cpuEval);

    if (cmp > 0) {
      setPokerOutcome("win");
      setPokerMessage(t("pokerResultWin"));
      return;
    }
    if (cmp < 0) {
      setPokerOutcome("lose");
      setPokerMessage(t("pokerResultLose"));
      return;
    }
    setPokerOutcome("draw");
    setPokerMessage(t("pokerResultDraw"));
  };

  const resetSolitaire = useCallback(() => {
    const deck = shuffleSolitaireDeck(createSolitaireDeck());
    const tableau: SolitaireCard[][] = Array.from({ length: 7 }, () => []);
    let index = 0;

    for (let col = 0; col < 7; col += 1) {
      for (let row = 0; row <= col; row += 1) {
        const base = deck[index];
        if (!base) continue;
        tableau[col].push({ ...base, faceUp: row === col });
        index += 1;
      }
    }

    const stock = deck.slice(index).map((card) => ({ ...card, faceUp: false }));
    setSolitaireStock(stock);
    setSolitaireWaste([]);
    setSolitaireFoundations({ H: [], D: [], C: [], S: [] });
    setSolitaireTableau(tableau);
    setSolitaireSelection(null);
    setSolitaireMessage(t("solitaireHint"));
    setIsSolitaireOver(false);
  }, [t]);

  const foundationCount = useCallback((foundations: Record<SolitaireSuit, SolitaireCard[]>) => {
    return foundations.H.length + foundations.D.length + foundations.C.length + foundations.S.length;
  }, []);

  const flipTableauTopIfNeeded = useCallback((tableau: SolitaireCard[][], col: number) => {
    const next = tableau.map((pile) => [...pile]);
    const top = next[col]?.[next[col].length - 1];
    if (top && !top.faceUp) {
      top.faceUp = true;
    }
    return next;
  }, []);

  const tryAutoWinSolitaire = useCallback((foundations: Record<SolitaireSuit, SolitaireCard[]>) => {
    if (foundationCount(foundations) >= 52) {
      setIsSolitaireOver(true);
      setSolitaireMessage(t("solitaireCleared"));
      return true;
    }
    return false;
  }, [foundationCount, t]);

  const drawSolitaireStock = () => {
    if (isSolitaireOver) return;
    if (solitaireStock.length > 0) {
      const nextStock = [...solitaireStock];
      const drawn = nextStock.pop();
      if (!drawn) return;
      setSolitaireStock(nextStock);
      setSolitaireWaste([...solitaireWaste, { ...drawn, faceUp: true }]);
      setSolitaireSelection(null);
      return;
    }

    if (solitaireWaste.length > 0) {
      const restocked = [...solitaireWaste].reverse().map((card) => ({ ...card, faceUp: false }));
      setSolitaireStock(restocked);
      setSolitaireWaste([]);
      setSolitaireSelection(null);
    }
  };

  const onSolitaireSelectWaste = () => {
    if (isSolitaireOver || solitaireWaste.length <= 0) return;
    setSolitaireSelection((prev) => {
      if (prev?.from === "waste") {
        setSolitaireMessage(t("solitaireHint"));
        return null;
      }
      setSolitaireMessage(t("solitaireSelected"));
      return { from: "waste" };
    });
  };

  const onSolitaireSelectTableau = (col: number) => {
    if (isSolitaireOver) return;
    const pile = solitaireTableau[col] || [];
    const index = pile.length - 1;
    const card = pile[index];
    if (!card || !card.faceUp) return;
    setSolitaireSelection((prev) => {
      if (prev?.from === "tableau" && prev.col === col && prev.index === index) {
        setSolitaireMessage(t("solitaireHint"));
        return null;
      }
      setSolitaireMessage(t("solitaireSelected"));
      return { from: "tableau", col, index };
    });
  };

  const onSolitaireMoveToFoundation = (suit: SolitaireSuit) => {
    if (isSolitaireOver || !solitaireSelection) return;

    let card: SolitaireCard | null = null;
    if (solitaireSelection.from === "waste") {
      card = solitaireWaste[solitaireWaste.length - 1] || null;
    } else {
      card = solitaireTableau[solitaireSelection.col]?.[solitaireSelection.index] || null;
    }
    if (!card) return;
    if (card.suit !== suit) {
      setSolitaireMessage(t("solitaireInvalidMove"));
      return;
    }

    const foundationPile = solitaireFoundations[suit];
    const needed = foundationPile.length + 1;
    if (card.rank !== needed) {
      setSolitaireMessage(t("solitaireInvalidMove"));
      return;
    }

    const nextFoundations = {
      H: [...solitaireFoundations.H],
      D: [...solitaireFoundations.D],
      C: [...solitaireFoundations.C],
      S: [...solitaireFoundations.S],
    };
    nextFoundations[suit].push({ ...card, faceUp: true });

    if (solitaireSelection.from === "waste") {
      setSolitaireWaste(solitaireWaste.slice(0, -1));
    } else {
      const nextTableau = solitaireTableau.map((pile) => [...pile]);
      nextTableau[solitaireSelection.col] = nextTableau[solitaireSelection.col].slice(0, -1);
      setSolitaireTableau(flipTableauTopIfNeeded(nextTableau, solitaireSelection.col));
    }

    setSolitaireFoundations(nextFoundations);
    setSolitaireSelection(null);
    if (!tryAutoWinSolitaire(nextFoundations)) {
      setSolitaireMessage(t("solitaireHint"));
    }
  };

  const onSolitaireMoveToTableau = (targetCol: number) => {
    if (isSolitaireOver || !solitaireSelection) return;
    const targetPile = solitaireTableau[targetCol] || [];
    const targetTop = targetPile[targetPile.length - 1] || null;

    let movingCard: SolitaireCard | null = null;
    if (solitaireSelection.from === "waste") {
      movingCard = solitaireWaste[solitaireWaste.length - 1] || null;
    } else {
      movingCard = solitaireTableau[solitaireSelection.col]?.[solitaireSelection.index] || null;
    }
    if (!movingCard) return;

    const canPlace = targetTop
      ? targetTop.faceUp && solitaireIsRed(targetTop.suit) !== solitaireIsRed(movingCard.suit) && targetTop.rank === movingCard.rank + 1
      : movingCard.rank === 13;

    if (!canPlace) {
      setSolitaireMessage(t("solitaireInvalidMove"));
      return;
    }

    const nextTableau = solitaireTableau.map((pile) => [...pile]);
    if (solitaireSelection.from === "waste") {
      setSolitaireWaste(solitaireWaste.slice(0, -1));
    } else {
      nextTableau[solitaireSelection.col] = nextTableau[solitaireSelection.col].slice(0, -1);
      const flipped = flipTableauTopIfNeeded(nextTableau, solitaireSelection.col);
      for (let i = 0; i < nextTableau.length; i += 1) {
        nextTableau[i] = flipped[i];
      }
    }

    nextTableau[targetCol].push({ ...movingCard, faceUp: true });
    setSolitaireTableau(nextTableau);
    setSolitaireSelection(null);
    setSolitaireMessage(t("solitaireHint"));
  };

  const createSurvivorsEnemies = useCallback((wave: number) => {
    const count = Math.min(6, 2 + Math.floor((wave + 1) / 2));
    return Array.from({ length: count }, (_, index) => {
      const hp = 18 + wave * 6 + index * 3;
      return {
        id: `w${wave}-e${index}-${Math.random().toString(36).slice(2, 7)}`,
        hp,
        maxHp: hp,
      } satisfies SurvivorsEnemy;
    });
  }, []);

  const resetSurvivors = useCallback(() => {
    setSurvivorsWave(1);
    setSurvivorsHp(100);
    setSurvivorsMaxHp(100);
    setSurvivorsLevel(1);
    setSurvivorsXp(0);
    setSurvivorsTimeSec(0);
    setSurvivorsKills(0);
    setSurvivorsEnemies(createSurvivorsEnemies(1));
    setSurvivorsMessage(t("survivorsHint"));
    setIsSurvivorsOver(false);
  }, [createSurvivorsEnemies, t]);

  const onSurvivorsAttack = (enemyId: string) => {
    if (isSurvivorsOver) return;

    const damage = 8 + survivorsLevel * 3 + Math.floor(Math.random() * 4);
    const nextEnemies = survivorsEnemies
      .map((enemy) => (enemy.id === enemyId ? { ...enemy, hp: enemy.hp - damage } : enemy))
      .filter((enemy) => enemy.hp > 0);

    const killed = survivorsEnemies.length - nextEnemies.length;
    if (killed > 0) {
      setSurvivorsKills((prev) => prev + killed);
      setSurvivorsXp((prev) => prev + killed * (8 + survivorsWave));
    }

    if (nextEnemies.length <= 0) {
      const nextWave = survivorsWave + 1;
      setSurvivorsWave(nextWave);
      setSurvivorsEnemies(createSurvivorsEnemies(nextWave));
      setSurvivorsMessage(tf("survivorsWaveClear", { wave: survivorsWave }));
      setSurvivorsHp((prev) => Math.min(survivorsMaxHp, prev + 6));
      return;
    }

    setSurvivorsEnemies(nextEnemies);
  };

  useEffect(() => {
    if (survivorsXp < survivorsLevel * 40) return;
    setSurvivorsXp((prev) => prev - survivorsLevel * 40);
    setSurvivorsLevel((prev) => prev + 1);
    setSurvivorsMaxHp((prev) => prev + 8);
    setSurvivorsHp((prev) => prev + 8);
  }, [survivorsLevel, survivorsXp]);

  useEffect(() => {
    if (activePanel !== "survivors" || isSurvivorsOver) return;

    const timer = setInterval(() => {
      setSurvivorsTimeSec((prev) => prev + 1);
      setSurvivorsHp((prev) => {
        const incoming = Math.max(1, Math.floor((survivorsEnemies.length + survivorsWave) / 2));
        const nextHp = prev - incoming;
        if (nextHp <= 0) {
          setIsSurvivorsOver(true);
          setSurvivorsMessage(t("survivorsGameOver"));
          return 0;
        }
        return nextHp;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activePanel, isSurvivorsOver, survivorsEnemies.length, survivorsWave, t]);

  useEffect(() => {
    if (activePanel !== "chinchiro") return;
    if (!chinchiroPlayerDice && !chinchiroDealerDice && !isChinchiroOver) {
      setChinchiroMessage(t("chinchiroHint"));
    }
  }, [activePanel, chinchiroDealerDice, chinchiroPlayerDice, isChinchiroOver, t]);

  useEffect(() => {
    if (activePanel !== "blackjack") return;
    if (blackjackPlayerHand.length === 0 || blackjackDealerHand.length === 0) {
      resetBlackjack();
    }
  }, [activePanel, blackjackDealerHand.length, blackjackPlayerHand.length, resetBlackjack]);

  useEffect(() => {
    if (activePanel !== "sevens") return;
    if (sevensHands[0].length === 0 && sevensHands[1].length === 0) {
      resetSevens();
    }
  }, [activePanel, resetSevens, sevensHands]);

  useEffect(() => {
    if (activePanel !== "sevens" || sevensTurn !== "cpu" || isSevensOver) return;

    const timer = setTimeout(() => {
      const cpuHand = sevensHands[1];
      const playableIndex = cpuHand.findIndex((card) => isSevensPlayable(card, sevensTable));

      if (playableIndex >= 0) {
        const card = cpuHand[playableIndex];
        const nextTable = applySevensCard(sevensTable, card);
        const nextCpu = cpuHand.filter((_, i) => i !== playableIndex);
        setSevensTable(nextTable);
        setSevensHands([sevensHands[0], nextCpu]);

        if (nextCpu.length === 0) {
          setIsSevensOver(true);
          setSevensMessage(t("sevensCpuWin"));
          return;
        }

        setSevensTurn("player");
        setSevensMessage(t("sevensYourTurn"));
        return;
      }

      setSevensPassCount((prev) => [prev[0], prev[1] + 1]);
      if (!hasSevensPlayable(sevensHands[0], sevensTable)) {
        setIsSevensOver(true);
        setSevensMessage(t("sevensDraw"));
        return;
      }
      setSevensTurn("player");
      setSevensMessage(t("sevensYourTurn"));
    }, 500);

    return () => clearTimeout(timer);
  }, [activePanel, isSevensOver, sevensHands, sevensTable, sevensTurn, t]);

  useEffect(() => {
    if (activePanel !== "daifugo") return;
    if (daifugoHands[0].length === 0 && daifugoHands[1].length === 0) {
      resetDaifugo();
    }
  }, [activePanel, daifugoHands, resetDaifugo]);

  useEffect(() => {
    if (connectedRoomCode) return;
    if (activePanel !== "daifugo" || daifugoTurn !== "cpu" || isDaifugoOver) return;

    const timer = setTimeout(() => {
      const cpuHand = daifugoHands[1];
      const playableIndex = cpuHand.findIndex((card) => !daifugoTableCard || daifugoPower(card.rank) > daifugoPower(daifugoTableCard.rank));

      if (playableIndex >= 0) {
        const card = cpuHand[playableIndex];
        const nextCpu = cpuHand.filter((_, i) => i !== playableIndex);
        setDaifugoHands([daifugoHands[0], nextCpu]);
        setDaifugoTableCard(card);
        setDaifugoPassStreak(0);

        if (nextCpu.length === 0) {
          setIsDaifugoOver(true);
          setDaifugoMessage(t("daifugoCpuWin"));
          return;
        }

        setDaifugoTurn("player");
        setDaifugoMessage(t("daifugoYourTurn"));
        return;
      }

      const streak = daifugoPassStreak + 1;
      if (streak >= 2) {
        setDaifugoTableCard(null);
        setDaifugoPassStreak(0);
        setDaifugoTurn("player");
        setDaifugoMessage(t("daifugoRoundClear"));
        return;
      }

      setDaifugoPassStreak(streak);
      setDaifugoTurn("player");
      setDaifugoMessage(tf("daifugoPassInfo", { who: "CPU" }));
    }, 500);

    return () => clearTimeout(timer);
  }, [activePanel, connectedRoomCode, daifugoHands, daifugoPassStreak, daifugoTableCard, daifugoTurn, isDaifugoOver, t, tf]);

  useEffect(() => {
    if (activePanel !== "fourPanel") return;
    if (fourPanelIndex === 0 && fourPanelImages.length === 0) {
      setFourPanelMessage(t("fourPanelHint"));
    }
  }, [activePanel, fourPanelImages.length, fourPanelIndex, t]);

  useEffect(() => {
    if (activePanel !== "drawingRelay") return;
    if (!drawingRelayImage && drawingRelayPhase === "draw") {
      setDrawingRelayMessage(t("drawingRelayHintDraw"));
    }
  }, [activePanel, drawingRelayImage, drawingRelayPhase, t]);

  useEffect(() => {
    if (activePanel !== "fitPuzzle") return;
    if (fitPuzzleMoves === 0 && !isFitPuzzleOver) {
      setFitPuzzleMessage(t("fitPuzzleHint"));
    }
  }, [activePanel, fitPuzzleMoves, isFitPuzzleOver, t]);

  useEffect(() => {
    if (activePanel !== "mahjong") return;
    if (!isMahjongOver && mahjongRemainingCount(mahjongBoard) === MAHJONG_ROWS * MAHJONG_COLS) {
      setMahjongMessage(t("mahjongHint"));
    }
  }, [activePanel, isMahjongOver, mahjongBoard, t]);

  useEffect(() => {
    if (activePanel !== "poker") return;
    if (pokerPlayerHand.length === 0 || pokerCpuHand.length === 0) {
      resetPoker();
    }
  }, [activePanel, pokerCpuHand.length, pokerPlayerHand.length, resetPoker]);

  useEffect(() => {
    if (activePanel !== "solitaire") return;
    if (solitaireStock.length === 0 && solitaireWaste.length === 0 && foundationCount(solitaireFoundations) === 0) {
      resetSolitaire();
    }
  }, [activePanel, foundationCount, resetSolitaire, solitaireFoundations, solitaireStock.length, solitaireWaste.length]);

  useEffect(() => {
    if (activePanel !== "survivors") return;
    if (survivorsEnemies.length === 0 && survivorsWave === 1 && survivorsTimeSec === 0) {
      resetSurvivors();
    }
  }, [activePanel, resetSurvivors, survivorsEnemies.length, survivorsTimeSec, survivorsWave]);

  const resetUno = useCallback(() => {
    const deck = shuffleCards(createUnoDeck());
    const player = deck.slice(0, 7);
    const cpu = deck.slice(7, 14);
    const top = deck[14] || { color: "R", value: 0 };
    const rest = deck.slice(15);
    setUnoPlayerHand(player);
    setUnoCpuHand(cpu);
    setUnoTopCard(top);
    setUnoDeck(rest);
    setUnoTurn("player");
    setIsUnoOver(false);
    setUnoMessage(t("unoYourTurn"));
  }, [t]);

  const drawUnoCard = useCallback((): UnoCard | null => {
    if (unoDeck.length <= 0) return null;
    const [card, ...rest] = unoDeck;
    setUnoDeck(rest);
    return card;
  }, [unoDeck]);

  const playUnoCard = useCallback(
    (index: number, options?: { isRemote?: boolean; side?: "player" | "cpu" }) => {
      const isRemote = Boolean(options?.isRemote);
      const side = options?.side || (connectedRoomCode && roomRole === "guest" ? "cpu" : "player");
      if (isUnoOver || unoTurn !== side || !unoTopCard) return;

      if (connectedRoomCode && !isRemote) {
        if (roomRole === "spectator") {
          setUnoMessage(t("roomSpectatorReadonly"));
          return;
        }
        if (!canOperateUnoNow) {
          setUnoMessage(t("roomTurnOwnerOnly"));
          return;
        }
        if (roomRole === "guest") {
          sendRoomEvent({ type: "uno-request-action", action: "play", index });
          setUnoMessage(t("roomWaitingHostJudge"));
          return;
        }
      }

      const currentHand = side === "player" ? unoPlayerHand : unoCpuHand;
      const card = currentHand[index];
      if (!card) return;
      if (!canPlayCard(card, unoTopCard)) {
        setUnoMessage(t("unoNoPlayable"));
        return;
      }

      const nextHand = currentHand.filter((_, i) => i !== index);
      if (side === "player") {
        setUnoPlayerHand(nextHand);
      } else {
        setUnoCpuHand(nextHand);
      }
      setUnoTopCard(card);
      setUnoMessage(tf("unoPlayedCard", { who: side === "player" ? "YOU" : "CPU", card: unoCardLabel(card) }));

      if (nextHand.length === 0) {
        setIsUnoOver(true);
        setUnoMessage(side === "player" ? t("unoPlayerWin") : t("unoCpuWin"));
        return;
      }

      setUnoTurn(side === "player" ? "cpu" : "player");
    },
    [canOperateUnoNow, connectedRoomCode, isUnoOver, roomRole, sendRoomEvent, t, tf, unoCardLabel, unoCpuHand, unoPlayerHand, unoTopCard, unoTurn],
  );

  const drawUnoForPlayer = useCallback((options?: { isRemote?: boolean; side?: "player" | "cpu" }) => {
    const isRemote = Boolean(options?.isRemote);
    const side = options?.side || (connectedRoomCode && roomRole === "guest" ? "cpu" : "player");
    if (isUnoOver || unoTurn !== side) return;

    if (connectedRoomCode && !isRemote) {
      if (roomRole === "spectator") {
        setUnoMessage(t("roomSpectatorReadonly"));
        return;
      }
      if (!canOperateUnoNow) {
        setUnoMessage(t("roomTurnOwnerOnly"));
        return;
      }
      if (roomRole === "guest") {
        sendRoomEvent({ type: "uno-request-action", action: "draw" });
        setUnoMessage(t("roomWaitingHostJudge"));
        return;
      }
    }

    const card = drawUnoCard();
    if (!card) {
      setUnoMessage(t("unoNoPlayable"));
      setUnoTurn(side === "player" ? "cpu" : "player");
      return;
    }
    if (side === "player") {
      setUnoPlayerHand((prev) => [...prev, card]);
    } else {
      setUnoCpuHand((prev) => [...prev, card]);
    }
    setUnoMessage(tf("unoDrewCard", { who: side === "player" ? "YOU" : "CPU" }));
    setUnoTurn(side === "player" ? "cpu" : "player");
  }, [canOperateUnoNow, connectedRoomCode, drawUnoCard, isUnoOver, roomRole, sendRoomEvent, t, tf, unoTurn]);

  useEffect(() => {
    if (!pendingRemoteUnoAction) return;
    if (roomRole !== "host") {
      setPendingRemoteUnoAction(null);
      return;
    }
    if (pendingRemoteUnoAction.action === "play" && Number.isInteger(pendingRemoteUnoAction.index)) {
      playUnoCard(Number(pendingRemoteUnoAction.index), { isRemote: true, side: "cpu" });
    }
    if (pendingRemoteUnoAction.action === "draw") {
      drawUnoForPlayer({ isRemote: true, side: "cpu" });
    }
    setPendingRemoteUnoAction(null);
  }, [drawUnoForPlayer, pendingRemoteUnoAction, playUnoCard, roomRole]);

  useEffect(() => {
    if (activePanel !== "uno") return;
    if (!unoTopCard && !isUnoOver) {
      resetUno();
    }
  }, [activePanel, isUnoOver, resetUno, unoTopCard]);

  useEffect(() => {
    if (connectedRoomCode) return;
    if (unoTurn !== "cpu" || isUnoOver || !unoTopCard) return;

    setUnoMessage(t("unoCpuTurn"));
    const timer = setTimeout(() => {
      const playableIndex = unoCpuHand.findIndex((card) => canPlayCard(card, unoTopCard));
      if (playableIndex >= 0) {
        const card = unoCpuHand[playableIndex];
        const nextHand = unoCpuHand.filter((_, i) => i !== playableIndex);
        setUnoCpuHand(nextHand);
        setUnoTopCard(card);
        if (nextHand.length === 0) {
          setIsUnoOver(true);
          setUnoMessage(t("unoCpuWin"));
          return;
        }
        setUnoMessage(tf("unoPlayedCard", { who: "CPU", card: unoCardLabel(card) }));
        setUnoTurn("player");
        return;
      }

      const drawn = unoDeck[0];
      if (drawn) {
        setUnoDeck((prev) => prev.slice(1));
        setUnoCpuHand((prev) => [...prev, drawn]);
        setUnoMessage(tf("unoDrewCard", { who: "CPU" }));
      }
      setUnoTurn("player");
    }, 550);

    return () => clearTimeout(timer);
  }, [connectedRoomCode, isUnoOver, t, tf, unoCpuHand, unoDeck, unoTopCard, unoTurn, unoCardLabel]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPosting(true);
    setMessage("");

    try {
      const res = await fetch("/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName: playerName.trim() || "player",
          score: Number(score),
          game,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      setMessage(t("scoreSaved"));
      await loadScores();
    } catch (error) {
      console.error(error);
      setMessage(t("scoreSaveFailed"));
    } finally {
      setIsPosting(false);
    }
  };

  const callCloudAuthApi = useCallback(async (path: string, payload: Record<string, unknown>) => {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as CloudAuthResult;
    if (!res.ok) {
      throw new Error(String(data?.code || data?.message || `HTTP ${res.status}`));
    }
    if (data?.ok !== true) {
      throw new Error(String(data?.code || data?.message || "AUTH_FAILED"));
    }
    return data;
  }, []);

  const applyCloudLoginSuccess = useCallback((userId: string, password: string, data: CloudAuthResult) => {
    const cloudName = String(data?.profile?.playerName || "").trim();
    if (cloudName) {
      setPlayerName(cloudName.slice(0, 24));
    }
    localStorage.setItem(STORAGE_CLOUD_USER_ID_KEY, userId);
    localStorage.setItem(STORAGE_CLOUD_PASSWORD_KEY, password);
    setAuthMode("cloud");
    setEntryMessage("");
    setIsAuthenticated(true);
  }, []);

  const handleCloudLogin = useCallback(async () => {
    const userId = authUserId.trim();
    const password = authPassword;
    if (!userId || !password) {
      setEntryMessage(t("requireAuthFields"));
      return;
    }

    setIsAuthLoading(true);
    setEntryMessage(t("loginLoading"));
    try {
      const data = await callCloudAuthApi("/api/auth/login", { userId, password });
      applyCloudLoginSuccess(userId, password, data);
    } catch (error) {
      console.error(error);
      setEntryMessage(t("loginFailed"));
    } finally {
      setIsAuthLoading(false);
    }
  }, [applyCloudLoginSuccess, authPassword, authUserId, callCloudAuthApi, t]);

  const handleCloudRegister = useCallback(async () => {
    const userId = authUserId.trim();
    const password = authPassword;
    if (!userId || !password) {
      setEntryMessage(t("requireAuthFields"));
      return;
    }

    setIsAuthLoading(true);
    setEntryMessage(t("registerLoading"));
    try {
      const data = await callCloudAuthApi("/api/auth/register", { userId, password });
      applyCloudLoginSuccess(userId, password, data);
      setMenuMessage(t("registerSuccess"));
    } catch (error) {
      console.error(error);
      setEntryMessage(t("registerFailed"));
    } finally {
      setIsAuthLoading(false);
    }
  }, [applyCloudLoginSuccess, authPassword, authUserId, callCloudAuthApi, t]);

  const handleGuestStart = useCallback(() => {
    localStorage.removeItem(STORAGE_CLOUD_USER_ID_KEY);
    localStorage.removeItem(STORAGE_CLOUD_PASSWORD_KEY);
    setAuthMode("guest");
    setEntryMessage("");
    setMenuMessage(t("guestStarted"));
    setIsAuthenticated(true);
  }, [t]);

  const handleBackToLogin = useCallback(() => {
    closeRoomSocket();
    setConnectedRoomCode("");
    setRoomParticipants([]);
    setRoomRole("");
    setRoomStatus(t("roomStateIdle"));
    setIsAuthenticated(false);
  }, [closeRoomSocket, t]);

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#16213a_0%,#0d1324_45%,#090d18_100%)] px-5 py-8 text-slate-100">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
          <header className="rounded-2xl border border-cyan-200/20 bg-cyan-300/10 p-6 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs tracking-[0.25em] text-cyan-200">NEXT MIGRATION HUB</p>
              <div className="flex items-center gap-1 rounded-md border border-cyan-200/30 bg-slate-950/40 p-1 text-xs">
                <span className="px-1 text-cyan-100">{t("languageLabel")}</span>
                <button
                  type="button"
                  onClick={() => switchLanguage("ja")}
                  className={`rounded px-2 py-1 ${language === "ja" ? "bg-cyan-300 text-slate-900" : "text-slate-100"}`}
                >
                  {t("langJa")}
                </button>
                <button
                  type="button"
                  onClick={() => switchLanguage("ko")}
                  className={`rounded px-2 py-1 ${language === "ko" ? "bg-cyan-300 text-slate-900" : "text-slate-100"}`}
                >
                  {t("langKo")}
                </button>
              </div>
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{t("loginTitle")}</h1>
            <p className="mt-2 text-sm text-slate-300">{t("loginLead")}</p>
          </header>

          <section className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
            <div className="grid gap-3">
              <label className="grid gap-1 text-sm">
                {t("userId")}
                <input
                  value={authUserId}
                  onChange={(event) => setAuthUserId(event.target.value.slice(0, 24))}
                  placeholder="user123"
                  className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  disabled={isAuthLoading}
                />
              </label>

              <label className="grid gap-1 text-sm">
                {t("password")}
                <input
                  type="password"
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                  placeholder="password"
                  className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  disabled={isAuthLoading}
                />
              </label>

              <label className="grid gap-1 text-sm">
                {t("displayName")}
                <input
                  value={playerName}
                  onChange={(event) => setPlayerName(event.target.value.slice(0, 24))}
                  placeholder="Player"
                  className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  disabled={isAuthLoading}
                />
              </label>

              <div className="mt-1 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleCloudLogin()}
                  disabled={isAuthLoading}
                  className="rounded-md bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
                >
                  {isAuthLoading ? t("processing") : t("loginButton")}
                </button>
                <button
                  type="button"
                  onClick={() => void handleCloudRegister()}
                  disabled={isAuthLoading}
                  className="rounded-md border border-cyan-200/40 px-3 py-2 text-sm disabled:opacity-60"
                >
                  {t("registerButton")}
                </button>
                <button
                  type="button"
                  onClick={handleGuestStart}
                  disabled={isAuthLoading}
                  className="rounded-md border border-emerald-200/40 px-3 py-2 text-sm disabled:opacity-60"
                >
                  {t("guestButton")}
                </button>
              </div>
            </div>

            {entryMessage ? <p className="mt-3 text-sm text-cyan-200">{entryMessage}</p> : null}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#16213a_0%,#0d1324_45%,#090d18_100%)] px-5 py-8 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-2xl border border-cyan-200/20 bg-cyan-300/10 p-6 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs tracking-[0.25em] text-cyan-200">NEXT MIGRATION HUB</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-md border border-cyan-200/30 bg-slate-950/40 p-1 text-xs">
                <span className="px-1 text-cyan-100">{t("languageLabel")}</span>
                <button
                  type="button"
                  onClick={() => switchLanguage("ja")}
                  className={`rounded px-2 py-1 ${language === "ja" ? "bg-cyan-300 text-slate-900" : "text-slate-100"}`}
                >
                  {t("langJa")}
                </button>
                <button
                  type="button"
                  onClick={() => switchLanguage("ko")}
                  className={`rounded px-2 py-1 ${language === "ko" ? "bg-cyan-300 text-slate-900" : "text-slate-100"}`}
                >
                  {t("langKo")}
                </button>
              </div>
              <button
                type="button"
                onClick={handleBackToLogin}
                className="rounded-md border border-cyan-200/40 px-3 py-1 text-xs"
              >
                {t("backToLogin")} ({authMode === "cloud" ? t("modeCloud") : t("modeGuest")})
              </button>
            </div>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{t("appTitle")}</h1>
          <p className="mt-2 text-sm text-slate-300">{t("appLead")}</p>
        </header>

        <section className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActivePanel("menu")}
              className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
            >
              {t("tabMenu")}
            </button>
            <button
              type="button"
              onClick={openOthello}
              className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
            >
              {t("tabOthello")}
            </button>
            <button
              type="button"
              onClick={openGomoku}
              className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
            >
              {t("tabGomoku")}
            </button>
            <button
              type="button"
              onClick={openChess}
              className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
            >
              {t("tabChess")}
            </button>
            <button
              type="button"
              onClick={openShogi}
              className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
            >
              {t("tabShogi")}
            </button>
            <button
              type="button"
              onClick={openMinesweeper}
              className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
            >
              {t("tabMinesweeper")}
            </button>
            <button
              type="button"
              onClick={openNumeron}
              className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
            >
              {t("tabNumeron")}
            </button>
            <button
              type="button"
              onClick={openBlackjack}
              className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
            >
              {t("tabBlackjack")}
            </button>
            <button
              type="button"
              onClick={openChinchiro}
              className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
            >
              {t("tabChinchiro")}
            </button>
            <button
              type="button"
              onClick={openSevens}
              className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
            >
              {t("tabSevens")}
            </button>
            <button
              type="button"
              onClick={openDaifugo}
              className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
            >
              {t("tabDaifugo")}
            </button>
            <button
              type="button"
              onClick={openFourPanel}
              className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
            >
              {t("tabFourPanel")}
            </button>
            <button
              type="button"
              onClick={openDrawingRelay}
              className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
            >
              {t("tabDrawingRelay")}
            </button>
            <button
              type="button"
              onClick={openFitPuzzle}
              className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
            >
              {t("tabFitPuzzle")}
            </button>
            <button
              type="button"
              onClick={openMahjong}
              className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
            >
              {t("tabMahjong")}
            </button>
            <button
              type="button"
              onClick={openPoker}
              className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
            >
              {t("tabPoker")}
            </button>
            <button
              type="button"
              onClick={openSolitaire}
              className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
            >
              {t("tabSolitaire")}
            </button>
            <button
              type="button"
              onClick={openSurvivors}
              className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
            >
              {t("tabSurvivors")}
            </button>
            <button
              type="button"
              onClick={openUno}
              className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
            >
              {t("tabUno")}
            </button>
            <button
              type="button"
              onClick={openScores}
              className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
            >
              {t("tabScores")}
            </button>
            <button
              type="button"
              onClick={openStatus}
              className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
            >
              {t("tabStatus")}
            </button>
          </div>
        </section>

        {activePanel === "menu" ? (
          <section className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <h2 className="text-xl font-semibold">{t("menuTitle")}</h2>
              <p className="mt-2 text-sm text-slate-300">{t("menuLead")}</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={openOthello}
                  className="rounded-xl border border-emerald-200/30 bg-emerald-400/10 p-4 text-left"
                >
                  <p className="text-lg font-semibold">{t("gameOthello")}</p>
                  <p className="mt-1 text-sm text-slate-300">{t("playableLead")}</p>
                </button>
                <button
                  type="button"
                  onClick={openGomoku}
                  className="rounded-xl border border-lime-200/30 bg-lime-400/10 p-4 text-left"
                >
                  <p className="text-lg font-semibold">{t("gameGomoku")}</p>
                  <p className="mt-1 text-sm text-slate-300">{t("playableLead")}</p>
                </button>
                <button
                  type="button"
                  onClick={openUno}
                  className="rounded-xl border border-cyan-200/30 bg-cyan-400/10 p-4 text-left"
                >
                  <p className="text-lg font-semibold">{t("tabUno")}</p>
                  <p className="mt-1 text-sm text-slate-300">{t("playableLead")}</p>
                </button>
                <button
                  type="button"
                  onClick={openMinesweeper}
                  className="rounded-xl border border-teal-200/30 bg-teal-400/10 p-4 text-left"
                >
                  <p className="text-lg font-semibold">{t("tabMinesweeper")}</p>
                  <p className="mt-1 text-sm text-slate-300">{t("playableLead")}</p>
                </button>
                <button
                  type="button"
                  onClick={openNumeron}
                  className="rounded-xl border border-amber-200/30 bg-amber-400/10 p-4 text-left"
                >
                  <p className="text-lg font-semibold">{t("tabNumeron")}</p>
                  <p className="mt-1 text-sm text-slate-300">{t("playableLead")}</p>
                </button>
                <button
                  type="button"
                  onClick={openBlackjack}
                  className="rounded-xl border border-rose-200/30 bg-rose-400/10 p-4 text-left"
                >
                  <p className="text-lg font-semibold">{t("tabBlackjack")}</p>
                  <p className="mt-1 text-sm text-slate-300">{t("playableLead")}</p>
                </button>
                <button
                  type="button"
                  onClick={openChinchiro}
                  className="rounded-xl border border-fuchsia-200/30 bg-fuchsia-400/10 p-4 text-left"
                >
                  <p className="text-lg font-semibold">{t("tabChinchiro")}</p>
                  <p className="mt-1 text-sm text-slate-300">{t("playableLead")}</p>
                </button>
                <button
                  type="button"
                  onClick={openSevens}
                  className="rounded-xl border border-violet-200/30 bg-violet-400/10 p-4 text-left"
                >
                  <p className="text-lg font-semibold">{t("tabSevens")}</p>
                  <p className="mt-1 text-sm text-slate-300">{t("playableLead")}</p>
                </button>
                <button
                  type="button"
                  onClick={openDaifugo}
                  className="rounded-xl border border-orange-200/30 bg-orange-400/10 p-4 text-left"
                >
                  <p className="text-lg font-semibold">{t("tabDaifugo")}</p>
                  <p className="mt-1 text-sm text-slate-300">{t("playableLead")}</p>
                </button>
                <button
                  type="button"
                  onClick={openFourPanel}
                  className="rounded-xl border border-sky-200/30 bg-sky-400/10 p-4 text-left"
                >
                  <p className="text-lg font-semibold">{t("tabFourPanel")}</p>
                  <p className="mt-1 text-sm text-slate-300">{t("playableLead")}</p>
                </button>
                <button
                  type="button"
                  onClick={openDrawingRelay}
                  className="rounded-xl border border-indigo-200/30 bg-indigo-400/10 p-4 text-left"
                >
                  <p className="text-lg font-semibold">{t("tabDrawingRelay")}</p>
                  <p className="mt-1 text-sm text-slate-300">{t("playableLead")}</p>
                </button>
                <button
                  type="button"
                  onClick={openFitPuzzle}
                  className="rounded-xl border border-pink-200/30 bg-pink-400/10 p-4 text-left"
                >
                  <p className="text-lg font-semibold">{t("tabFitPuzzle")}</p>
                  <p className="mt-1 text-sm text-slate-300">{t("playableLead")}</p>
                </button>
                <button
                  type="button"
                  onClick={openMahjong}
                  className="rounded-xl border border-red-200/30 bg-red-400/10 p-4 text-left"
                >
                  <p className="text-lg font-semibold">{t("tabMahjong")}</p>
                  <p className="mt-1 text-sm text-slate-300">{t("playableLead")}</p>
                </button>
                <button
                  type="button"
                  onClick={openPoker}
                  className="rounded-xl border border-rose-200/30 bg-rose-400/10 p-4 text-left"
                >
                  <p className="text-lg font-semibold">{t("tabPoker")}</p>
                  <p className="mt-1 text-sm text-slate-300">{t("playableLead")}</p>
                </button>
                <button
                  type="button"
                  onClick={openSolitaire}
                  className="rounded-xl border border-amber-200/30 bg-amber-400/10 p-4 text-left"
                >
                  <p className="text-lg font-semibold">{t("tabSolitaire")}</p>
                  <p className="mt-1 text-sm text-slate-300">{t("playableLead")}</p>
                </button>
                <button
                  type="button"
                  onClick={openSurvivors}
                  className="rounded-xl border border-emerald-200/30 bg-emerald-400/10 p-4 text-left"
                >
                  <p className="text-lg font-semibold">{t("tabSurvivors")}</p>
                  <p className="mt-1 text-sm text-slate-300">{t("playableLead")}</p>
                </button>
                <button
                  type="button"
                  onClick={openChess}
                  className="rounded-xl border border-slate-200/20 bg-slate-400/10 p-4 text-left"
                >
                  <p className="text-lg font-semibold">{t("gameChess")}</p>
                  <p className="mt-1 text-sm text-slate-300">{t("playableLead")}</p>
                </button>
                <button
                  type="button"
                  onClick={openShogi}
                  className="rounded-xl border border-slate-200/20 bg-slate-400/10 p-4 text-left"
                >
                  <p className="text-lg font-semibold">{t("gameShogi")}</p>
                  <p className="mt-1 text-sm text-slate-300">{t("playableLead")}</p>
                </button>
                <button
                  type="button"
                  onClick={openScores}
                  className="rounded-xl border border-slate-200/20 bg-slate-400/10 p-4 text-left"
                >
                  <p className="text-lg font-semibold">{t("tabScores")}</p>
                  <p className="mt-1 text-sm text-slate-300">{t("checkScoresLead")}</p>
                </button>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <h2 className="text-xl font-semibold">{t("roomTitle")}</h2>

              <div className="mt-4 grid gap-3">
                <label className="grid gap-1 text-sm">
                  {t("roomServerUrl")}
                  <input
                    value={roomServerUrl}
                    onChange={(event) => setRoomServerUrl(event.target.value)}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  {t("roomCode")}
                  <input
                    value={roomCode}
                    onChange={(event) => setRoomCode(event.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                    placeholder={t("roomCodePlaceholder")}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <div className="flex items-center gap-4 text-sm">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      checked={roomVisibility === "public"}
                      onChange={() => setRoomVisibility("public")}
                    />
                    {t("roomPublic")}
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      checked={roomVisibility === "private"}
                      onChange={() => setRoomVisibility("private")}
                    />
                    {t("roomPrivate")}
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const nextCode = String(Math.floor(100000 + Math.random() * 900000));
                      setRoomCode(nextCode);
                      setMenuMessage(
                        tf("roomCandidate", {
                          code: nextCode,
                          visibility: roomVisibility === "public" ? t("visibilityPublic") : t("visibilityPrivate"),
                        }),
                      );
                      connectRoom(nextCode, true);
                    }}
                    className="rounded-md bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950"
                  >
                    {t("roomCreate")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onJoinRoom();
                      connectRoom(roomCode, false);
                    }}
                    className="rounded-md border border-cyan-200/40 px-3 py-2 text-sm"
                  >
                    {t("roomJoin")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closeRoomSocket();
                      setConnectedRoomCode("");
                      setRoomParticipants([]);
                      setRoomRole("");
                    }}
                    className="rounded-md border border-red-200/40 px-3 py-2 text-sm"
                  >
                    {t("roomDisconnect")}
                  </button>
                </div>

                <div className="rounded-lg border border-slate-400/25 bg-slate-950/40 p-3 text-sm">
                  <p>{t("roomState")}: {roomStatus}</p>
                  <p>{t("roomConnected")}: {connectedRoomCode || "-"}</p>
                  <p>{t("roomRole")}: {roomRole ? roomRoleLabel(roomRole) : "-"}</p>
                </div>

                <div className="rounded-lg border border-slate-400/25 bg-slate-950/40 p-3">
                  <p className="text-sm font-semibold">{t("multiSyncTitle")}</p>
                  <p className="mt-1 text-xs text-slate-300">{t("syncHostOnlyHint")}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => setIsMultiSyncEnabled((prev) => !prev)}
                      className="rounded-md border border-cyan-200/40 px-3 py-1"
                    >
                      {isMultiSyncEnabled ? t("multiSyncEnabled") : t("multiSyncDisabled")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isChaosMode;
                        setIsChaosMode(next);
                        sendRoomEvent({ type: "arcade-chaos", enabled: next });
                      }}
                      className="rounded-md border border-rose-200/40 px-3 py-1"
                    >
                      {t("chaosModeLabel")}: {isChaosMode ? t("chaosModeOn") : t("chaosModeOff")}
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-400/25 bg-slate-950/40 p-3">
                  <p className="text-sm font-semibold">{t("roomMembers")}</p>
                  {roomParticipants.length === 0 ? (
                    <p className="mt-1 text-sm text-slate-300">{t("roomMembersEmpty")}</p>
                  ) : (
                    <ul className="mt-2 space-y-1 text-sm text-slate-200">
                      {roomParticipants.map((participant) => (
                        <li key={participant.id}>
                          {participant.name} ({roomRoleLabel(participant.role)})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {menuMessage ? <p className="mt-3 text-sm text-cyan-200">{menuMessage}</p> : null}
            </article>
          </section>
        ) : null}

        {activePanel === "othello" ? (
          <section className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">{t("othelloTitle")}</h2>
              <button
                type="button"
                onClick={resetOthello}
                className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
              >
                {t("othelloReset")}
              </button>
            </div>

            <p className="mt-2 text-sm text-slate-300">{othelloMessage}</p>
            {connectedRoomCode ? <p className="mt-1 text-xs text-cyan-200">{roomTurnText(canOperateOthelloNow)}</p> : null}

            {isChaosMode ? (
              <div className="mt-3 rounded-lg border border-cyan-200/25 bg-slate-950/35 p-3 text-xs text-slate-200">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <p>{t("othelloChaosOverwriteStock")}: {othelloOverwriteRemaining[othelloPlayerIndex(currentPlayer)]}</p>
                  <p>{t("othelloChaosImmutableStock")}: {othelloImmutableCharges[othelloPlayerIndex(currentPlayer)]}</p>
                  <p>{t("othelloChaosDestroyStock")}: {othelloDestroyRemaining[othelloPlayerIndex(currentPlayer)]}</p>
                  <p>{t("othelloChaosDoubleStock")}: {othelloDoubleActionCharges[othelloPlayerIndex(currentPlayer)]}</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const idx = othelloPlayerIndex(currentPlayer);
                      if ((othelloImmutableCharges[idx] ?? 0) <= 0) return;
                      setOthelloImmutableArmed((prev) => {
                        const next: [boolean, boolean] = [...prev];
                        const armed = !next[idx];
                        next[idx] = armed;
                        return next;
                      });
                      setOthelloDestroyArmed((prev) => {
                        const next: [boolean, boolean] = [...prev];
                        next[idx] = false;
                        return next;
                      });
                    }}
                    className={`rounded-md border px-2 py-1 ${othelloImmutableArmed[othelloPlayerIndex(currentPlayer)] ? "border-amber-300 bg-amber-300/20" : "border-cyan-200/40"}`}
                  >
                    {t("othelloChaosImmutableArm")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const idx = othelloPlayerIndex(currentPlayer);
                      if ((othelloDestroyRemaining[idx] ?? 0) <= 0) return;
                      setOthelloDestroyArmed((prev) => {
                        const next: [boolean, boolean] = [...prev];
                        const armed = !next[idx];
                        next[idx] = armed;
                        return next;
                      });
                      setOthelloImmutableArmed((prev) => {
                        const next: [boolean, boolean] = [...prev];
                        next[idx] = false;
                        return next;
                      });
                    }}
                    className={`rounded-md border px-2 py-1 ${othelloDestroyArmed[othelloPlayerIndex(currentPlayer)] ? "border-rose-300 bg-rose-300/20" : "border-cyan-200/40"}`}
                  >
                    {t("othelloChaosDestroyArm")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const idx = othelloPlayerIndex(currentPlayer);
                      if ((othelloDoubleActionCharges[idx] ?? 0) <= 0) return;
                      setOthelloDoubleArmed((prev) => {
                        const next: [boolean, boolean] = [...prev];
                        next[idx] = !next[idx];
                        return next;
                      });
                    }}
                    className={`rounded-md border px-2 py-1 ${othelloDoubleArmed[othelloPlayerIndex(currentPlayer)] ? "border-violet-300 bg-violet-300/20" : "border-cyan-200/40"}`}
                  >
                    {t("othelloChaosDoubleArm")}
                  </button>
                </div>
                {othelloDestroyArmed[othelloPlayerIndex(currentPlayer)] ? (
                  <p className="mt-2 text-cyan-200">
                    {t("othelloChaosSkillArmed")} ({othelloDestroySelectedSacrifices[othelloPlayerIndex(currentPlayer)].length}/{OTHELLO_NO_CORNER_SACRIFICE_COUNT})
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="mt-4 grid w-full max-w-[420px] grid-cols-8 gap-1 rounded-xl bg-emerald-900/70 p-2">
              {board.map((line, row) =>
                line.map((cell, col) => {
                  const key = `${row}-${col}`;
                  const isLegal = legalMoveSet.has(key);
                  const isFixed = othelloFixedMask[row][col];
                  const isBroken = othelloBrokenMask[row][col];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onBoardClick(row, col)}
                      disabled={!canOperateOthelloNow || isGameOver}
                      className={`relative aspect-square rounded-sm ${isBroken ? "bg-slate-800/95" : "bg-emerald-700/95 hover:bg-emerald-600/95"} disabled:cursor-not-allowed disabled:opacity-70`}
                      aria-label={`cell-${row + 1}-${col + 1}`}
                    >
                      {cell === 1 ? (
                        <span className="absolute inset-[14%] block rounded-full bg-slate-900 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.08)]" />
                      ) : null}
                      {cell === 2 ? (
                        <span className="absolute inset-[14%] block rounded-full bg-slate-100 shadow-[inset_0_0_0_2px_rgba(0,0,0,0.15)]" />
                      ) : null}
                      {isLegal ? (
                        <span className={`absolute ${cell === 0 ? "inset-[40%] rounded-full" : "inset-[20%] rounded-md border-2"} block bg-cyan-200/90`} />
                      ) : null}
                      {isFixed ? (
                        <span className="absolute right-1 top-1 rounded bg-amber-300 px-1 text-[10px] font-bold text-slate-900">F</span>
                      ) : null}
                      {isBroken ? (
                        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-lg font-black text-rose-300/90">×</span>
                      ) : null}
                    </button>
                  );
                }),
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-md bg-slate-800 px-3 py-1">{t("blackStone")}: {stoneCount.black}</span>
              <span className="rounded-md bg-slate-800 px-3 py-1">{t("whiteStone")}: {stoneCount.white}</span>
              <button
                type="button"
                onClick={() => {
                  setGame("othello");
                  setScore(stoneCount.black);
                  setMessage(t("appliedBlackToScore"));
                }}
                className="rounded-md border border-cyan-200/40 px-3 py-1"
              >
                {t("applyBlackToScore")}
              </button>
            </div>
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
            <h2 className="text-xl font-semibold">{t("scoreFormTitle")}</h2>
            <form onSubmit={onSubmit} className="mt-4 grid gap-3">
              <label className="grid gap-1 text-sm">
                {t("playerNameLabel")}
                <input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={24}
                  className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                />
              </label>

              <label className="grid gap-1 text-sm">
                {t("gameLabel")}
                <select
                  value={game}
                  onChange={(e) => setGame(e.target.value)}
                  className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                >
                  {GAME_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {gameLabelById(option.id)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-sm">
                {t("scoreLabel")}
                <input
                  type="number"
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                />
              </label>

              <button
                type="submit"
                disabled={isPosting}
                className="mt-2 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60"
              >
                {isPosting ? t("scoreSaving") : t("scoreSave")}
              </button>
            </form>
            {message ? <p className="mt-3 text-sm text-cyan-200">{message}</p> : null}
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{t("statusTitle")}</h2>
                <button
                  type="button"
                  onClick={() => void loadScores()}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("reload")}
                </button>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>{t("statusLine1")}</li>
                <li>{t("statusLine2")}</li>
                <li>{t("statusLine3")}</li>
                <li>{t("statusLineGomoku")}</li>
                <li>{t("statusLineChess")}</li>
                <li>{t("statusLineShogi")}</li>
                <li>{t("statusLineMines")}</li>
                <li>{t("statusLineNumeron")}</li>
                <li>{t("statusLineBlackjack")}</li>
                <li>{t("statusLineChinchiro")}</li>
                <li>{t("statusLineSevens")}</li>
                <li>{t("statusLineDaifugo")}</li>
                <li>{t("statusLineUno")}</li>
                <li>{t("statusLine4")}</li>
              </ul>
            </article>
          </section>
        ) : null}

        {activePanel === "gomoku" ? (
          <section className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("gomokuTitle")}</h2>
                <button
                  type="button"
                  onClick={resetGomoku}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("gomokuReset")}
                </button>
              </div>

              <p className="mt-2 text-sm text-slate-300">{gomokuMessage}</p>
              {connectedRoomCode ? <p className="mt-1 text-xs text-cyan-200">{roomTurnText(canOperateGomokuNow)}</p> : null}

              <div className="mt-4 grid w-full max-w-[560px] grid-cols-15 gap-1 rounded-xl bg-amber-900/70 p-2" style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}>
                {gomokuBoard.map((line, row) =>
                  line.map((cell, col) => {
                    const key = `g-${row}-${col}`;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => onGomokuClick(row, col)}
                        disabled={!canOperateGomokuNow || isGomokuOver}
                        className="relative aspect-square rounded-sm bg-amber-700/95 hover:bg-amber-600/95 disabled:cursor-not-allowed disabled:opacity-70"
                        aria-label={`gomoku-${row + 1}-${col + 1}`}
                      >
                        {cell === 1 ? (
                          <span className="absolute inset-[22%] block rounded-full bg-slate-900" />
                        ) : null}
                        {cell === 2 ? (
                          <span className="absolute inset-[22%] block rounded-full bg-slate-100" />
                        ) : null}
                      </button>
                    );
                  }),
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-md bg-slate-800 px-3 py-1">{t("blackStone")}: {gomokuStoneCount.black}</span>
                <span className="rounded-md bg-slate-800 px-3 py-1">{t("whiteStone")}: {gomokuStoneCount.white}</span>
                <button
                  type="button"
                  onClick={() => {
                    setGame("gomoku");
                    setScore(gomokuStoneCount.black);
                    setMessage(t("appliedGomokuToScore"));
                  }}
                  className="rounded-md border border-cyan-200/40 px-3 py-1"
                >
                  {t("applyGomokuToScore")}
                </button>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <h2 className="text-xl font-semibold">{t("scoreFormTitle")}</h2>
              <form onSubmit={onSubmit} className="mt-4 grid gap-3">
                <label className="grid gap-1 text-sm">
                  {t("playerNameLabel")}
                  <input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={24}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  {t("gameLabel")}
                  <select
                    value={game}
                    onChange={(e) => setGame(e.target.value)}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  >
                    {GAME_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {gameLabelById(option.id)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-sm">
                  {t("scoreLabel")}
                  <input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isPosting}
                  className="mt-2 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60"
                >
                  {isPosting ? t("scoreSaving") : t("scoreSave")}
                </button>
              </form>
              {message ? <p className="mt-3 text-sm text-cyan-200">{message}</p> : null}
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{t("statusTitle")}</h2>
                <button
                  type="button"
                  onClick={() => void loadScores()}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("reload")}
                </button>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>{t("statusLine1")}</li>
                <li>{t("statusLine2")}</li>
                <li>{t("statusLineGomoku")}</li>
                <li>{t("statusLine4")}</li>
              </ul>
            </article>
          </section>
        ) : null}

        {activePanel === "chess" ? (
          <section className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("chessTitle")}</h2>
                <button
                  type="button"
                  onClick={resetChess}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("chessReset")}
                </button>
              </div>

              <p className="mt-2 text-sm text-slate-300">{chessMessage}</p>
              {connectedRoomCode ? <p className="mt-1 text-xs text-cyan-200">{roomTurnText(canOperateChessNow)}</p> : null}

              <div className="mt-4 grid w-full max-w-[520px] grid-cols-8 gap-1 rounded-xl bg-sky-900/50 p-2">
                {chessBoard.map((line, row) =>
                  line.map((piece, col) => {
                    const isSelected = selectedChess?.row === row && selectedChess?.col === col;
                    const key = `c-${row}-${col}`;
                    const dark = (row + col) % 2 === 1;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => onChessClick(row, col)}
                        disabled={!canOperateChessNow || isChessOver}
                        className={`aspect-square rounded-sm px-1 text-[11px] font-semibold ${dark ? "bg-slate-700/95" : "bg-slate-500/95"} ${isSelected ? "ring-2 ring-cyan-300" : ""} disabled:cursor-not-allowed disabled:opacity-70`}
                        aria-label={`chess-${row + 1}-${col + 1}`}
                      >
                        {piece ? chessPieceLabel(piece) : ""}
                      </button>
                    );
                  }),
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setGame("chess");
                    const whiteCount = chessBoard.flat().filter((p) => p?.color === "w").length;
                    const blackCount = chessBoard.flat().filter((p) => p?.color === "b").length;
                    setScore(Math.max(0, whiteCount - blackCount + 20));
                    setMessage(t("chessAppliedScore"));
                  }}
                  className="rounded-md border border-cyan-200/40 px-3 py-1"
                >
                  {t("chessApplyScore")}
                </button>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <h2 className="text-xl font-semibold">{t("scoreFormTitle")}</h2>
              <form onSubmit={onSubmit} className="mt-4 grid gap-3">
                <label className="grid gap-1 text-sm">
                  {t("playerNameLabel")}
                  <input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={24}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  {t("gameLabel")}
                  <select
                    value={game}
                    onChange={(e) => setGame(e.target.value)}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  >
                    {GAME_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {gameLabelById(option.id)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-sm">
                  {t("scoreLabel")}
                  <input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isPosting}
                  className="mt-2 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60"
                >
                  {isPosting ? t("scoreSaving") : t("scoreSave")}
                </button>
              </form>
              {message ? <p className="mt-3 text-sm text-cyan-200">{message}</p> : null}
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{t("statusTitle")}</h2>
                <button
                  type="button"
                  onClick={() => void loadScores()}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("reload")}
                </button>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>{t("statusLine1")}</li>
                <li>{t("statusLine2")}</li>
                <li>{t("statusLineChess")}</li>
                <li>{t("statusLineShogi")}</li>
                <li>{t("statusLineMines")}</li>
                <li>{t("statusLineNumeron")}</li>
                <li>{t("statusLine4")}</li>
              </ul>
            </article>
          </section>
        ) : null}

        {activePanel === "shogi" ? (
          <section className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("shogiTitle")}</h2>
                <button
                  type="button"
                  onClick={resetShogi}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("shogiReset")}
                </button>
              </div>

              <p className="mt-2 text-sm text-slate-300">{shogiMessage}</p>
              {connectedRoomCode ? <p className="mt-1 text-xs text-cyan-200">{roomTurnText(canOperateShogiNow)}</p> : null}

              <div className="mt-4 grid w-full max-w-[560px] grid-cols-9 gap-1 rounded-xl bg-amber-900/60 p-2" style={{ gridTemplateColumns: "repeat(9, minmax(0, 1fr))" }}>
                {shogiBoard.map((line, row) =>
                  line.map((piece, col) => {
                    const isSelected = selectedShogi?.row === row && selectedShogi?.col === col;
                    const dark = (row + col) % 2 === 1;
                    return (
                      <button
                        key={`s-${row}-${col}`}
                        type="button"
                        onClick={() => onShogiClick(row, col)}
                        disabled={!canOperateShogiNow || isShogiOver}
                        className={`aspect-square rounded-sm px-1 text-[11px] font-semibold ${dark ? "bg-amber-700/95" : "bg-amber-500/95"} ${isSelected ? "ring-2 ring-cyan-300" : ""} disabled:cursor-not-allowed disabled:opacity-70`}
                        aria-label={`shogi-${row + 1}-${col + 1}`}
                      >
                        {piece ? shogiPieceLabel(piece) : ""}
                      </button>
                    );
                  }),
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setGame("shogi");
                    const blackCount = shogiBoard.flat().filter((p) => p?.color === "b").length;
                    const whiteCount = shogiBoard.flat().filter((p) => p?.color === "w").length;
                    setScore(Math.max(0, blackCount - whiteCount + 20));
                    setMessage(t("shogiAppliedScore"));
                  }}
                  className="rounded-md border border-cyan-200/40 px-3 py-1"
                >
                  {t("shogiApplyScore")}
                </button>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <h2 className="text-xl font-semibold">{t("scoreFormTitle")}</h2>
              <form onSubmit={onSubmit} className="mt-4 grid gap-3">
                <label className="grid gap-1 text-sm">
                  {t("playerNameLabel")}
                  <input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={24}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  {t("gameLabel")}
                  <select
                    value={game}
                    onChange={(e) => setGame(e.target.value)}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  >
                    {GAME_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {gameLabelById(option.id)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-sm">
                  {t("scoreLabel")}
                  <input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isPosting}
                  className="mt-2 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60"
                >
                  {isPosting ? t("scoreSaving") : t("scoreSave")}
                </button>
              </form>
              {message ? <p className="mt-3 text-sm text-cyan-200">{message}</p> : null}
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{t("statusTitle")}</h2>
                <button
                  type="button"
                  onClick={() => void loadScores()}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("reload")}
                </button>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>{t("statusLine1")}</li>
                <li>{t("statusLine2")}</li>
                <li>{t("statusLineShogi")}</li>
                <li>{t("statusLineMines")}</li>
                <li>{t("statusLineNumeron")}</li>
                <li>{t("statusLine4")}</li>
              </ul>
            </article>
          </section>
        ) : null}

        {activePanel === "minesweeper" ? (
          <section className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("minesTitle")}</h2>
                <button
                  type="button"
                  onClick={resetMinesweeper}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("minesReset")}
                </button>
              </div>

              <p className="mt-2 text-sm text-slate-300">{mineMessage}</p>

              <div className="mt-4 grid w-full max-w-[420px] grid-cols-9 gap-1 rounded-xl bg-teal-900/60 p-2" style={{ gridTemplateColumns: "repeat(9, minmax(0, 1fr))" }}>
                {mineBoard.map((line, row) =>
                  line.map((cell, col) => (
                    <button
                      key={`m-${row}-${col}`}
                      type="button"
                      onClick={() => onMinesClick(row, col)}
                      className={`aspect-square rounded-sm text-xs font-semibold ${cell.open ? "bg-slate-700" : "bg-teal-700 hover:bg-teal-600"}`}
                      aria-label={`mine-${row + 1}-${col + 1}`}
                    >
                      {cell.open ? (cell.mine ? "*" : (cell.around > 0 ? String(cell.around) : "")) : ""}
                    </button>
                  )),
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setGame("minesweeper");
                    const openedSafe = mineBoard.flat().filter((cell) => cell.open && !cell.mine).length;
                    setScore(openedSafe);
                    setMessage(t("minesAppliedScore"));
                  }}
                  className="rounded-md border border-cyan-200/40 px-3 py-1"
                >
                  {t("minesApplyScore")}
                </button>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <h2 className="text-xl font-semibold">{t("scoreFormTitle")}</h2>
              <form onSubmit={onSubmit} className="mt-4 grid gap-3">
                <label className="grid gap-1 text-sm">
                  {t("playerNameLabel")}
                  <input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={24}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  {t("gameLabel")}
                  <select
                    value={game}
                    onChange={(e) => setGame(e.target.value)}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  >
                    {GAME_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {gameLabelById(option.id)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-sm">
                  {t("scoreLabel")}
                  <input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isPosting}
                  className="mt-2 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60"
                >
                  {isPosting ? t("scoreSaving") : t("scoreSave")}
                </button>
              </form>
              {message ? <p className="mt-3 text-sm text-cyan-200">{message}</p> : null}
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{t("statusTitle")}</h2>
                <button
                  type="button"
                  onClick={() => void loadScores()}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("reload")}
                </button>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>{t("statusLine1")}</li>
                <li>{t("statusLine2")}</li>
                <li>{t("statusLineMines")}</li>
                <li>{t("statusLineNumeron")}</li>
                <li>{t("statusLine4")}</li>
              </ul>
            </article>
          </section>
        ) : null}

        {activePanel === "numeron" ? (
          <section className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("numeronTitle")}</h2>
                <button
                  type="button"
                  onClick={resetNumeron}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("numeronReset")}
                </button>
              </div>

              <p className="mt-2 text-sm text-slate-300">{numeronMessage}</p>
              <p className="mt-2 text-xs text-slate-400">
                {t("numeronSecretLabel")}: {isNumeronOver ? numeronSecret : "***"}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {Array.from({ length: 10 }, (_, i) => String(i)).map((digit) => {
                  const selected = numeronDraft.includes(digit);
                  return (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => onNumeronPickDigit(digit)}
                      disabled={isNumeronOver || selected || numeronDraft.length >= 3}
                      className={`h-10 w-10 rounded-md border text-sm font-semibold ${selected ? "border-amber-300/60 bg-amber-300/20" : "border-cyan-200/30 bg-cyan-400/10"}`}
                    >
                      {digit}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-4 py-2 text-lg tracking-[0.3em]">
                  {numeronDraft.join("") || "---"}
                </div>
                <button
                  type="button"
                  onClick={() => setNumeronDraft([])}
                  disabled={isNumeronOver || numeronDraft.length === 0}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("numeronClearDraft")}
                </button>
                <button
                  type="button"
                  onClick={onNumeronSubmit}
                  disabled={isNumeronOver}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("numeronSubmitGuess")}
                </button>
              </div>

              <div className="mt-5">
                <p className="text-sm font-semibold">{t("numeronHistory")}</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-200">
                  {numeronHistory.length === 0 ? (
                    <li className="text-slate-400">-</li>
                  ) : (
                    numeronHistory.map((entry, index) => (
                      <li key={`${entry.guess}-${entry.hits}-${entry.blows}-${index}`}>
                        {index + 1}. {tf("numeronResult", { guess: entry.guess, hits: entry.hits, blows: entry.blows })}
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setGame("numeron");
                    const tries = numeronHistory.length || 1;
                    setScore(Math.max(10, 130 - tries * 10));
                    setMessage(t("numeronAppliedScore"));
                  }}
                  className="rounded-md border border-cyan-200/40 px-3 py-1"
                >
                  {t("numeronApplyScore")}
                </button>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <h2 className="text-xl font-semibold">{t("scoreFormTitle")}</h2>
              <form onSubmit={onSubmit} className="mt-4 grid gap-3">
                <label className="grid gap-1 text-sm">
                  {t("playerNameLabel")}
                  <input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={24}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  {t("gameLabel")}
                  <select
                    value={game}
                    onChange={(e) => setGame(e.target.value)}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  >
                    {GAME_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {gameLabelById(option.id)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-sm">
                  {t("scoreLabel")}
                  <input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isPosting}
                  className="mt-2 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60"
                >
                  {isPosting ? t("scoreSaving") : t("scoreSave")}
                </button>
              </form>
              {message ? <p className="mt-3 text-sm text-cyan-200">{message}</p> : null}
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{t("statusTitle")}</h2>
                <button
                  type="button"
                  onClick={() => void loadScores()}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("reload")}
                </button>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>{t("statusLine1")}</li>
                <li>{t("statusLine2")}</li>
                <li>{t("statusLineNumeron")}</li>
                <li>{t("statusLineMines")}</li>
                <li>{t("statusLine4")}</li>
              </ul>
            </article>
          </section>
        ) : null}

        {activePanel === "blackjack" ? (
          <section className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("blackjackTitle")}</h2>
                <button
                  type="button"
                  onClick={resetBlackjack}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("blackjackReset")}
                </button>
              </div>

              <p className="mt-2 text-sm text-slate-300">{blackjackMessage}</p>

              <div className="mt-4 grid gap-3 rounded-lg border border-slate-500/30 bg-slate-950/40 p-4">
                <p className="text-sm">
                  {t("blackjackDealer")}: {blackjackDealerHand.map((card) => blackjackCardLabel(card)).join(" ")} ({blackjackHandValue(blackjackDealerHand)})
                </p>
                <p className="text-sm">
                  {t("blackjackPlayer")}: {blackjackPlayerHand.map((card) => blackjackCardLabel(card)).join(" ")} ({blackjackHandValue(blackjackPlayerHand)})
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={onBlackjackHit}
                  disabled={isBlackjackOver || blackjackDeck.length === 0}
                  className="rounded-md border border-cyan-200/40 px-3 py-1"
                >
                  {t("blackjackHit")}
                </button>
                <button
                  type="button"
                  onClick={onBlackjackStand}
                  disabled={isBlackjackOver}
                  className="rounded-md border border-cyan-200/40 px-3 py-1"
                >
                  {t("blackjackStand")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGame("blackjack");
                    setScore(blackjackHandValue(blackjackPlayerHand));
                    setMessage(t("blackjackAppliedScore"));
                  }}
                  className="rounded-md border border-cyan-200/40 px-3 py-1"
                >
                  {t("blackjackApplyScore")}
                </button>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <h2 className="text-xl font-semibold">{t("scoreFormTitle")}</h2>
              <form onSubmit={onSubmit} className="mt-4 grid gap-3">
                <label className="grid gap-1 text-sm">
                  {t("playerNameLabel")}
                  <input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={24}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  {t("gameLabel")}
                  <select
                    value={game}
                    onChange={(e) => setGame(e.target.value)}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  >
                    {GAME_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {gameLabelById(option.id)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-sm">
                  {t("scoreLabel")}
                  <input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isPosting}
                  className="mt-2 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60"
                >
                  {isPosting ? t("scoreSaving") : t("scoreSave")}
                </button>
              </form>
              {message ? <p className="mt-3 text-sm text-cyan-200">{message}</p> : null}
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{t("statusTitle")}</h2>
                <button
                  type="button"
                  onClick={() => void loadScores()}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("reload")}
                </button>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>{t("statusLine1")}</li>
                <li>{t("statusLine2")}</li>
                <li>{t("statusLineBlackjack")}</li>
                <li>{t("statusLineNumeron")}</li>
                <li>{t("statusLine4")}</li>
              </ul>
            </article>
          </section>
        ) : null}

        {activePanel === "chinchiro" ? (
          <section className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("chinchiroTitle")}</h2>
                <button
                  type="button"
                  onClick={resetChinchiro}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("chinchiroReset")}
                </button>
              </div>

              <p className="mt-2 text-sm text-slate-300">{chinchiroMessage}</p>

              <div className="mt-4 grid gap-3 rounded-lg border border-slate-500/30 bg-slate-950/40 p-4">
                <p className="text-sm">
                  {t("chinchiroPlayer")}: {chinchiroPlayerDice ? chinchiroPlayerDice.join(" / ") : "-"}
                </p>
                <p className="text-sm">
                  {t("chinchiroDealer")}: {chinchiroDealerDice ? chinchiroDealerDice.join(" / ") : "-"}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={onChinchiroRoll}
                  disabled={isChinchiroOver}
                  className="rounded-md border border-cyan-200/40 px-3 py-1"
                >
                  {t("chinchiroRoll")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGame("chinchiro");
                    const p = chinchiroPlayerDice ? evaluateChinchiroHand(chinchiroPlayerDice).rank : 20;
                    const d = chinchiroDealerDice ? evaluateChinchiroHand(chinchiroDealerDice).rank : 20;
                    setScore(Math.max(0, 100 + p - d));
                    setMessage(t("chinchiroAppliedScore"));
                  }}
                  className="rounded-md border border-cyan-200/40 px-3 py-1"
                >
                  {t("chinchiroApplyScore")}
                </button>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <h2 className="text-xl font-semibold">{t("scoreFormTitle")}</h2>
              <form onSubmit={onSubmit} className="mt-4 grid gap-3">
                <label className="grid gap-1 text-sm">
                  {t("playerNameLabel")}
                  <input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={24}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  {t("gameLabel")}
                  <select
                    value={game}
                    onChange={(e) => setGame(e.target.value)}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  >
                    {GAME_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {gameLabelById(option.id)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-sm">
                  {t("scoreLabel")}
                  <input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isPosting}
                  className="mt-2 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60"
                >
                  {isPosting ? t("scoreSaving") : t("scoreSave")}
                </button>
              </form>
              {message ? <p className="mt-3 text-sm text-cyan-200">{message}</p> : null}
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{t("statusTitle")}</h2>
                <button
                  type="button"
                  onClick={() => void loadScores()}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("reload")}
                </button>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>{t("statusLine1")}</li>
                <li>{t("statusLine2")}</li>
                <li>{t("statusLineChinchiro")}</li>
                <li>{t("statusLineBlackjack")}</li>
                <li>{t("statusLine4")}</li>
              </ul>
            </article>
          </section>
        ) : null}

        {activePanel === "sevens" ? (
          <section className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("sevensTitle")}</h2>
                <button
                  type="button"
                  onClick={resetSevens}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("sevensReset")}
                </button>
              </div>

              <p className="mt-2 text-sm text-slate-300">{sevensMessage}</p>

              <div className="mt-4 grid gap-2 rounded-lg border border-slate-500/30 bg-slate-950/40 p-3 text-sm">
                {(["S", "H", "D", "C"] as const).map((suit) => (
                  <div key={suit} className="grid grid-cols-[1.5rem_1fr] items-center gap-2">
                    <span>{suit === "S" ? "♠" : suit === "H" ? "♥" : suit === "D" ? "♦" : "♣"}</span>
                    <div className="grid grid-cols-13 gap-1">
                      {Array.from({ length: 13 }, (_, i) => i + 1).map((rank) => {
                        const range = sevensTable[suit];
                        const played = range.low !== null && range.high !== null && rank >= range.low && rank <= range.high;
                        const text = rank === 1 ? "A" : rank === 11 ? "J" : rank === 12 ? "Q" : rank === 13 ? "K" : String(rank);
                        return (
                          <span
                            key={`${suit}-${rank}`}
                            className={`rounded px-1 py-0.5 text-center text-[10px] ${played ? "bg-cyan-400/20 text-cyan-100" : "bg-slate-800/60 text-slate-500"}`}
                          >
                            {text}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-2">
                <p className="text-sm font-semibold">{t("sevensPlayerHand")} ({sevensHands[0].length})</p>
                <div className="flex flex-wrap gap-2">
                  {sevensHands[0].map((card, index) => {
                    const playable = isSevensPlayable(card, sevensTable);
                    return (
                      <button
                        key={`${card.suit}-${card.rank}-${index}`}
                        type="button"
                        onClick={() => onSevensPlay(index)}
                        disabled={isSevensOver || sevensTurn !== "player"}
                        className={`rounded-md border px-2 py-1 text-xs ${playable ? "border-cyan-300/60 bg-cyan-400/10" : "border-slate-500/30 bg-slate-800/40"}`}
                      >
                        {sevensCardLabel(card)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <span>{t("sevensCpuHand")}: {sevensHands[1].length}</span>
                <span>{t("sevensPassCount")}: {sevensPassCount[0]} / {sevensPassCount[1]}</span>
                <button
                  type="button"
                  onClick={onSevensPass}
                  disabled={isSevensOver || sevensTurn !== "player"}
                  className="rounded-md border border-cyan-200/40 px-3 py-1"
                >
                  {t("sevensPass")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGame("sevens");
                    setScore(Math.max(0, sevensHands[1].length - sevensHands[0].length + 26));
                    setMessage(t("sevensAppliedScore"));
                  }}
                  className="rounded-md border border-cyan-200/40 px-3 py-1"
                >
                  {t("sevensApplyScore")}
                </button>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <h2 className="text-xl font-semibold">{t("scoreFormTitle")}</h2>
              <form onSubmit={onSubmit} className="mt-4 grid gap-3">
                <label className="grid gap-1 text-sm">
                  {t("playerNameLabel")}
                  <input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={24}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  {t("gameLabel")}
                  <select
                    value={game}
                    onChange={(e) => setGame(e.target.value)}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  >
                    {GAME_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {gameLabelById(option.id)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-sm">
                  {t("scoreLabel")}
                  <input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isPosting}
                  className="mt-2 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60"
                >
                  {isPosting ? t("scoreSaving") : t("scoreSave")}
                </button>
              </form>
              {message ? <p className="mt-3 text-sm text-cyan-200">{message}</p> : null}
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{t("statusTitle")}</h2>
                <button
                  type="button"
                  onClick={() => void loadScores()}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("reload")}
                </button>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>{t("statusLine1")}</li>
                <li>{t("statusLine2")}</li>
                <li>{t("statusLineSevens")}</li>
                <li>{t("statusLineChinchiro")}</li>
                <li>{t("statusLine4")}</li>
              </ul>
            </article>
          </section>
        ) : null}

        {activePanel === "daifugo" ? (
          <section className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("daifugoTitle")}</h2>
                <button
                  type="button"
                  onClick={resetDaifugo}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("daifugoReset")}
                </button>
              </div>

              <p className="mt-2 text-sm text-slate-300">{daifugoMessage}</p>
              {connectedRoomCode ? <p className="mt-1 text-xs text-cyan-200">{roomTurnText(canOperateDaifugoNow)}</p> : null}

              <div className="mt-4 grid gap-2 rounded-lg border border-slate-500/30 bg-slate-950/40 p-4 text-sm">
                <p>{t("daifugoTable")}: {daifugoTableCard ? daifugoCardLabel(daifugoTableCard) : "-"}</p>
                <p>{t("daifugoCpuHand")}: {daifugoLocalSide === "player" ? daifugoHands[1].length : daifugoHands[0].length}</p>
              </div>

              <div className="mt-4">
                <p className="text-sm font-semibold">{t("daifugoYourHand")} ({daifugoLocalSide === "player" ? daifugoHands[0].length : daifugoHands[1].length})</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(daifugoLocalSide === "player" ? daifugoHands[0] : daifugoHands[1]).map((card, index) => {
                    const playable = !daifugoTableCard || daifugoPower(card.rank) > daifugoPower(daifugoTableCard.rank);
                    return (
                      <button
                        key={`${card.suit}-${card.rank}-${index}`}
                        type="button"
                        onClick={() => onDaifugoPlay(index, { side: daifugoLocalSide })}
                        disabled={isDaifugoOver || !canOperateDaifugoNow}
                        className={`rounded-md border px-2 py-1 text-xs ${playable ? "border-cyan-300/60 bg-cyan-400/10" : "border-slate-500/30 bg-slate-800/40"}`}
                      >
                        {daifugoCardLabel(card)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => onDaifugoPass({ side: daifugoLocalSide })}
                  disabled={isDaifugoOver || !canOperateDaifugoNow || !daifugoTableCard}
                  className="rounded-md border border-cyan-200/40 px-3 py-1"
                >
                  {t("daifugoPass")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGame("daifugo");
                    const my = daifugoLocalSide === "player" ? daifugoHands[0].length : daifugoHands[1].length;
                    const enemy = daifugoLocalSide === "player" ? daifugoHands[1].length : daifugoHands[0].length;
                    setScore(Math.max(0, enemy - my + 26));
                    setMessage(t("daifugoAppliedScore"));
                  }}
                  className="rounded-md border border-cyan-200/40 px-3 py-1"
                >
                  {t("daifugoApplyScore")}
                </button>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <h2 className="text-xl font-semibold">{t("scoreFormTitle")}</h2>
              <form onSubmit={onSubmit} className="mt-4 grid gap-3">
                <label className="grid gap-1 text-sm">
                  {t("playerNameLabel")}
                  <input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={24}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  {t("gameLabel")}
                  <select
                    value={game}
                    onChange={(e) => setGame(e.target.value)}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  >
                    {GAME_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {gameLabelById(option.id)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-sm">
                  {t("scoreLabel")}
                  <input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isPosting}
                  className="mt-2 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60"
                >
                  {isPosting ? t("scoreSaving") : t("scoreSave")}
                </button>
              </form>
              {message ? <p className="mt-3 text-sm text-cyan-200">{message}</p> : null}
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{t("statusTitle")}</h2>
                <button
                  type="button"
                  onClick={() => void loadScores()}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("reload")}
                </button>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>{t("statusLine1")}</li>
                <li>{t("statusLine2")}</li>
                <li>{t("statusLineDaifugo")}</li>
                <li>{t("statusLineSevens")}</li>
                <li>{t("statusLine4")}</li>
              </ul>
            </article>
          </section>
        ) : null}

        {activePanel === "fourPanel" ? (
          <section className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("fourPanelTitle")}</h2>
                <button
                  type="button"
                  onClick={resetFourPanel}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("fourPanelReset")}
                </button>
              </div>

              <p className="mt-2 text-sm text-slate-300">{t("fourPanelStoryTitle")}: {fourPanelTitle}</p>
              <p className="mt-1 text-sm text-slate-300">{fourPanelMessage}</p>

              <div className="mt-4 rounded-xl border border-slate-500/40 bg-white p-2">
                <canvas
                  ref={fourPanelCanvasRef}
                  width={720}
                  height={360}
                  onPointerDown={onFourPanelPointerDown}
                  onPointerMove={onFourPanelPointerMove}
                  onPointerUp={onFourPanelPointerUp}
                  onPointerLeave={onFourPanelPointerUp}
                  className="h-auto w-full rounded bg-white"
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={clearFourPanelCanvas}
                  disabled={fourPanelIndex >= 4}
                  className="rounded-md border border-cyan-200/40 px-3 py-1"
                >
                  {t("fourPanelClear")}
                </button>
                <button
                  type="button"
                  onClick={submitFourPanel}
                  disabled={fourPanelIndex >= 4}
                  className="rounded-md border border-cyan-200/40 px-3 py-1"
                >
                  {t("fourPanelSubmit")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGame("fourPanel");
                    setScore(Math.max(0, fourPanelImages.length * 25));
                    setMessage(t("fourPanelAppliedScore"));
                  }}
                  className="rounded-md border border-cyan-200/40 px-3 py-1"
                >
                  {t("fourPanelApplyScore")}
                </button>
                <span className="rounded-md bg-slate-800 px-3 py-1 text-xs">
                  {tf("fourPanelProgress", { current: Math.min(4, fourPanelIndex + 1) })}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Array.from({ length: 4 }, (_, i) => {
                  const img = fourPanelImages[i];
                  return (
                    <div key={`fp-${i}`} className="rounded-lg border border-slate-500/40 bg-slate-950/40 p-1">
                      <p className="px-1 py-1 text-[10px] text-slate-300">PANEL {i + 1}</p>
                      {img ? (
                        <img src={img} alt={`panel-${i + 1}`} className="h-20 w-full rounded object-cover" />
                      ) : (
                        <div className="flex h-20 items-center justify-center rounded bg-slate-800/60 text-xs text-slate-400">-</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <h2 className="text-xl font-semibold">{t("scoreFormTitle")}</h2>
              <form onSubmit={onSubmit} className="mt-4 grid gap-3">
                <label className="grid gap-1 text-sm">
                  {t("playerNameLabel")}
                  <input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={24}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  {t("gameLabel")}
                  <select
                    value={game}
                    onChange={(e) => setGame(e.target.value)}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  >
                    {GAME_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {gameLabelById(option.id)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-sm">
                  {t("scoreLabel")}
                  <input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isPosting}
                  className="mt-2 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60"
                >
                  {isPosting ? t("scoreSaving") : t("scoreSave")}
                </button>
              </form>
              {message ? <p className="mt-3 text-sm text-cyan-200">{message}</p> : null}
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{t("statusTitle")}</h2>
                <button
                  type="button"
                  onClick={() => void loadScores()}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("reload")}
                </button>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>{t("statusLine1")}</li>
                <li>{t("statusLine2")}</li>
                <li>{t("statusLineFourPanel")}</li>
                <li>{t("statusLineDaifugo")}</li>
                <li>{t("statusLine4")}</li>
              </ul>
            </article>
          </section>
        ) : null}

        {activePanel === "drawingRelay" ? (
          <section className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("drawingRelayTitle")}</h2>
                <button
                  type="button"
                  onClick={resetDrawingRelay}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("drawingRelayReset")}
                </button>
              </div>

              <p className="mt-2 text-sm text-slate-300">{t("drawingRelayPrompt")}: {drawingRelayPrompt}</p>
              <p className="mt-1 text-sm text-slate-300">{drawingRelayMessage}</p>

              {drawingRelayPhase === "draw" ? (
                <div className="mt-4 rounded-xl border border-slate-500/40 bg-white p-2">
                  <canvas
                    ref={drawingRelayCanvasRef}
                    width={720}
                    height={360}
                    onPointerDown={onDrawingRelayPointerDown}
                    onPointerMove={onDrawingRelayPointerMove}
                    onPointerUp={onDrawingRelayPointerUp}
                    onPointerLeave={onDrawingRelayPointerUp}
                    className="h-auto w-full rounded bg-white"
                  />
                </div>
              ) : null}

              {drawingRelayImage ? (
                <div className="mt-4 rounded-xl border border-slate-500/40 bg-slate-950/40 p-2">
                  <img src={drawingRelayImage} alt="relay-drawing" className="h-auto w-full rounded" />
                </div>
              ) : null}

              {drawingRelayPhase === "guess" || drawingRelayPhase === "done" ? (
                <label className="mt-4 grid gap-1 text-sm">
                  {t("drawingRelayGuess")}
                  <input
                    value={drawingRelayGuess}
                    onChange={(e) => setDrawingRelayGuess(e.target.value)}
                    maxLength={64}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                    disabled={drawingRelayPhase === "done"}
                  />
                </label>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                {drawingRelayPhase === "draw" ? (
                  <>
                    <button
                      type="button"
                      onClick={clearDrawingRelayCanvas}
                      className="rounded-md border border-cyan-200/40 px-3 py-1"
                    >
                      {t("drawingRelayClear")}
                    </button>
                    <button
                      type="button"
                      onClick={submitDrawingRelayDrawing}
                      className="rounded-md border border-cyan-200/40 px-3 py-1"
                    >
                      {t("drawingRelaySubmitDrawing")}
                    </button>
                  </>
                ) : null}

                {drawingRelayPhase === "guess" ? (
                  <button
                    type="button"
                    onClick={submitDrawingRelayGuess}
                    className="rounded-md border border-cyan-200/40 px-3 py-1"
                  >
                    {t("drawingRelaySubmitGuess")}
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    setGame("drawingRelay");
                    const normalizedPrompt = drawingRelayPrompt.trim();
                    const normalizedGuess = drawingRelayGuess.trim();
                    const match = normalizedPrompt && normalizedGuess && (normalizedPrompt === normalizedGuess);
                    setScore(match ? 120 : drawingRelayPhase === "done" ? 80 : 40);
                    setMessage(t("drawingRelayAppliedScore"));
                  }}
                  className="rounded-md border border-cyan-200/40 px-3 py-1"
                >
                  {t("drawingRelayApplyScore")}
                </button>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <h2 className="text-xl font-semibold">{t("scoreFormTitle")}</h2>
              <form onSubmit={onSubmit} className="mt-4 grid gap-3">
                <label className="grid gap-1 text-sm">
                  {t("playerNameLabel")}
                  <input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={24}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  {t("gameLabel")}
                  <select
                    value={game}
                    onChange={(e) => setGame(e.target.value)}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  >
                    {GAME_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {gameLabelById(option.id)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-sm">
                  {t("scoreLabel")}
                  <input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isPosting}
                  className="mt-2 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60"
                >
                  {isPosting ? t("scoreSaving") : t("scoreSave")}
                </button>
              </form>
              {message ? <p className="mt-3 text-sm text-cyan-200">{message}</p> : null}
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{t("statusTitle")}</h2>
                <button
                  type="button"
                  onClick={() => void loadScores()}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("reload")}
                </button>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>{t("statusLine1")}</li>
                <li>{t("statusLine2")}</li>
                <li>{t("statusLineDrawingRelay")}</li>
                <li>{t("statusLineFitPuzzle")}</li>
                <li>{t("statusLineMahjong")}</li>
                <li>{t("statusLinePoker")}</li>
                <li>{t("statusLineSolitaire")}</li>
                <li>{t("statusLineSurvivors")}</li>
                <li>{t("statusLineFourPanel")}</li>
                <li>{t("statusLine4")}</li>
              </ul>
            </article>
          </section>
        ) : null}

        {activePanel === "fitPuzzle" ? (
          <section className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("fitPuzzleTitle")}</h2>
                <button
                  type="button"
                  onClick={resetFitPuzzle}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("fitPuzzleReset")}
                </button>
              </div>

              <p className="mt-2 text-sm text-slate-300">{fitPuzzleMessage}</p>
              <p className="mt-1 text-sm text-slate-300">{t("fitPuzzleMoves")}: {fitPuzzleMoves}</p>

              <div className="mt-4 grid max-w-[360px] grid-cols-3 gap-2">
                {fitPuzzleTiles.map((tile, index) => {
                  const blankIndex = fitPuzzleTiles.indexOf(0);
                  const movable = tile !== 0 && fitPuzzleCanMove(index, blankIndex);
                  return (
                    <button
                      key={`fit-${index}-${tile}`}
                      type="button"
                      onClick={() => onFitPuzzleTileClick(index)}
                      disabled={tile === 0 || isFitPuzzleOver}
                      className={`aspect-square rounded-lg border text-lg font-semibold ${tile === 0 ? "border-slate-700/30 bg-slate-950/20" : movable ? "border-cyan-300/50 bg-cyan-400/10" : "border-slate-500/40 bg-slate-800/60"}`}
                    >
                      {tile === 0 ? "" : tile}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setGame("fitPuzzle");
                    const base = isFitPuzzleOver ? 220 : 90;
                    const applied = Math.max(20, base - fitPuzzleMoves * 6);
                    setScore(applied);
                    setMessage(t("fitPuzzleAppliedScore"));
                  }}
                  className="rounded-md border border-cyan-200/40 px-3 py-1"
                >
                  {t("fitPuzzleApplyScore")}
                </button>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <h2 className="text-xl font-semibold">{t("scoreFormTitle")}</h2>
              <form onSubmit={onSubmit} className="mt-4 grid gap-3">
                <label className="grid gap-1 text-sm">
                  {t("playerNameLabel")}
                  <input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={24}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  {t("gameLabel")}
                  <select
                    value={game}
                    onChange={(e) => setGame(e.target.value)}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  >
                    {GAME_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {gameLabelById(option.id)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-sm">
                  {t("scoreLabel")}
                  <input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isPosting}
                  className="mt-2 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60"
                >
                  {isPosting ? t("scoreSaving") : t("scoreSave")}
                </button>
              </form>
              {message ? <p className="mt-3 text-sm text-cyan-200">{message}</p> : null}
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{t("statusTitle")}</h2>
                <button
                  type="button"
                  onClick={() => void loadScores()}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("reload")}
                </button>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>{t("statusLine1")}</li>
                <li>{t("statusLine2")}</li>
                <li>{t("statusLineFitPuzzle")}</li>
                <li>{t("statusLineDrawingRelay")}</li>
                <li>{t("statusLineMahjong")}</li>
                <li>{t("statusLinePoker")}</li>
                <li>{t("statusLineSolitaire")}</li>
                <li>{t("statusLineSurvivors")}</li>
                <li>{t("statusLine4")}</li>
              </ul>
            </article>
          </section>
        ) : null}

        {activePanel === "mahjong" ? (
          <section className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("mahjongTitle")}</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={resetMahjong}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("mahjongReset")}
                  </button>
                  <button
                    type="button"
                    onClick={onMahjongShuffle}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("mahjongShuffle")}
                  </button>
                  <button
                    type="button"
                    onClick={onMahjongHint}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("mahjongHintButton")}
                  </button>
                </div>
              </div>

              <p className="mt-2 text-sm text-slate-300">{mahjongMessage}</p>
              <p className="mt-1 text-sm text-slate-300">{tf("mahjongRemaining", { count: mahjongRemainingCount(mahjongBoard) })}</p>

              <div
                className="mt-4 grid gap-2"
                style={{ gridTemplateColumns: `repeat(${MAHJONG_COLS}, minmax(0, 1fr))` }}
              >
                {mahjongBoard.flatMap((row, rowIndex) =>
                  row.map((tile, colIndex) => {
                    if (tile === null) {
                      return (
                        <div
                          key={`mahjong-empty-${rowIndex}-${colIndex}`}
                          className="aspect-[0.8] rounded-md border border-slate-700/30 bg-slate-950/20"
                        />
                      );
                    }

                    const selected = mahjongSelected?.row === rowIndex && mahjongSelected?.col === colIndex;

                    return (
                      <button
                        key={`mahjong-${rowIndex}-${colIndex}-${tile}`}
                        type="button"
                        onClick={() => onMahjongTileClick(rowIndex, colIndex)}
                        disabled={isMahjongOver}
                        className={`aspect-[0.8] rounded-md border text-xs font-semibold sm:text-sm ${selected ? "border-cyan-200 bg-cyan-400/20" : "border-amber-200/40 bg-amber-400/10"}`}
                      >
                        {mahjongTileLabel(tile)}
                      </button>
                    );
                  }),
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setGame("mahjong");
                    const remain = mahjongRemainingCount(mahjongBoard);
                    const removed = MAHJONG_ROWS * MAHJONG_COLS - remain;
                    const applied = Math.max(20, (isMahjongOver ? 260 : 120) - remain * 2 + removed);
                    setScore(applied);
                    setMessage(t("mahjongAppliedScore"));
                  }}
                  className="rounded-md border border-cyan-200/40 px-3 py-1"
                >
                  {t("mahjongApplyScore")}
                </button>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <h2 className="text-xl font-semibold">{t("scoreFormTitle")}</h2>
              <form onSubmit={onSubmit} className="mt-4 grid gap-3">
                <label className="grid gap-1 text-sm">
                  {t("playerNameLabel")}
                  <input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={24}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  {t("gameLabel")}
                  <select
                    value={game}
                    onChange={(e) => setGame(e.target.value)}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  >
                    {GAME_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {gameLabelById(option.id)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-sm">
                  {t("scoreLabel")}
                  <input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isPosting}
                  className="mt-2 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60"
                >
                  {isPosting ? t("scoreSaving") : t("scoreSave")}
                </button>
              </form>
              {message ? <p className="mt-3 text-sm text-cyan-200">{message}</p> : null}
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{t("statusTitle")}</h2>
                <button
                  type="button"
                  onClick={() => void loadScores()}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("reload")}
                </button>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>{t("statusLine1")}</li>
                <li>{t("statusLine2")}</li>
                <li>{t("statusLineMahjong")}</li>
                <li>{t("statusLineFitPuzzle")}</li>
                <li>{t("statusLinePoker")}</li>
                <li>{t("statusLineSolitaire")}</li>
                <li>{t("statusLineSurvivors")}</li>
                <li>{t("statusLine4")}</li>
              </ul>
            </article>
          </section>
        ) : null}

        {activePanel === "poker" ? (
          <section className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("pokerTitle")}</h2>
                <button
                  type="button"
                  onClick={resetPoker}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("pokerDeal")}
                </button>
              </div>

              <p className="mt-2 text-sm text-slate-300">{pokerMessage}</p>

              <div className="mt-4 grid gap-4 rounded-lg border border-slate-500/30 bg-slate-950/40 p-4">
                <div>
                  <p className="text-sm font-semibold">{t("pokerPlayerHand")}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {pokerPlayerHand.map((card, index) => {
                      const held = pokerHold[index];
                      return (
                        <button
                          key={`poker-player-${card.suit}-${card.rank}-${index}`}
                          type="button"
                          onClick={() => togglePokerHold(index)}
                          disabled={pokerPhase !== "draw"}
                          className={`rounded-md border px-3 py-2 text-sm ${held ? "border-cyan-200 bg-cyan-400/20" : "border-slate-400/30 bg-slate-800/40"}`}
                        >
                          {pokerCardLabel(card)} {held ? `(${t("pokerHeld")})` : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold">{t("pokerCpuHand")}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {pokerCpuHand.map((card, index) => (
                      <div
                        key={`poker-cpu-${card.suit}-${card.rank}-${index}`}
                        className="rounded-md border border-slate-400/30 bg-slate-800/40 px-3 py-2 text-sm"
                      >
                        {pokerPhase === "result" ? pokerCardLabel(card) : "??"}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={onPokerDraw}
                  disabled={pokerPhase !== "draw"}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 disabled:opacity-60"
                >
                  {t("pokerDraw")}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGame("poker");
                    const applied = pokerOutcome === "win" ? 220 : pokerOutcome === "draw" ? 120 : pokerOutcome === "lose" ? 70 : 40;
                    setScore(applied);
                    setMessage(t("pokerAppliedScore"));
                  }}
                  className="rounded-md border border-cyan-200/40 px-3 py-1"
                >
                  {t("pokerApplyScore")}
                </button>
              </div>

              {pokerPhase === "result" && pokerPlayerEval && pokerCpuEval ? (
                <div className="mt-4 rounded-lg border border-slate-500/30 bg-slate-950/40 p-4 text-sm text-slate-200">
                  <p>{t("pokerPlayerHand")}: {pokerHandName(pokerPlayerEval.name)}</p>
                  <p>{t("pokerCpuHand")}: {pokerHandName(pokerCpuEval.name)}</p>
                </div>
              ) : null}
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <h2 className="text-xl font-semibold">{t("scoreFormTitle")}</h2>
              <form onSubmit={onSubmit} className="mt-4 grid gap-3">
                <label className="grid gap-1 text-sm">
                  {t("playerNameLabel")}
                  <input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={24}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  {t("gameLabel")}
                  <select
                    value={game}
                    onChange={(e) => setGame(e.target.value)}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  >
                    {GAME_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {gameLabelById(option.id)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-sm">
                  {t("scoreLabel")}
                  <input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isPosting}
                  className="mt-2 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60"
                >
                  {isPosting ? t("scoreSaving") : t("scoreSave")}
                </button>
              </form>
              {message ? <p className="mt-3 text-sm text-cyan-200">{message}</p> : null}
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{t("statusTitle")}</h2>
                <button
                  type="button"
                  onClick={() => void loadScores()}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("reload")}
                </button>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>{t("statusLine1")}</li>
                <li>{t("statusLine2")}</li>
                <li>{t("statusLinePoker")}</li>
                <li>{t("statusLineMahjong")}</li>
                <li>{t("statusLineSurvivors")}</li>
                <li>{t("statusLine4")}</li>
              </ul>
            </article>
          </section>
        ) : null}

        {activePanel === "solitaire" ? (
          <section className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("solitaireTitle")}</h2>
                <button
                  type="button"
                  onClick={resetSolitaire}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("solitaireReset")}
                </button>
              </div>

              <p className="mt-2 text-sm text-slate-300">{solitaireMessage}</p>
              <p className="mt-1 text-sm text-slate-300">{tf("solitaireFoundations", { count: foundationCount(solitaireFoundations) })}</p>

              <div className="mt-4 grid gap-3 rounded-lg border border-slate-500/30 bg-slate-950/40 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={drawSolitaireStock}
                    className="rounded-md border border-slate-400/40 bg-slate-800/50 px-3 py-2 text-sm"
                  >
                    {t("solitaireStock")}: {solitaireStock.length}
                  </button>

                  <button
                    type="button"
                    onClick={onSolitaireSelectWaste}
                    className={`rounded-md border px-3 py-2 text-sm ${solitaireSelection?.from === "waste" ? "border-cyan-200 bg-cyan-400/20" : "border-slate-400/40 bg-slate-800/50"}`}
                  >
                    {t("solitaireWaste")}: {solitaireWaste.length > 0 ? solitaireCardLabel(solitaireWaste[solitaireWaste.length - 1] as SolitaireCard) : "-"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(["H", "D", "C", "S"] as SolitaireSuit[]).map((suit) => {
                    const pile = solitaireFoundations[suit];
                    const top = pile[pile.length - 1];
                    return (
                      <button
                        key={`foundation-${suit}`}
                        type="button"
                        onClick={() => onSolitaireMoveToFoundation(suit)}
                        className="rounded-md border border-emerald-200/30 bg-emerald-400/10 px-3 py-2 text-sm"
                      >
                        {solitaireSuitSymbol(suit)} {top ? solitaireCardLabel(top) : "A"}
                      </button>
                    );
                  })}
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {solitaireTableau.map((pile, col) => {
                    const top = pile[pile.length - 1];
                    const selected = solitaireSelection?.from === "tableau" && solitaireSelection.col === col;
                    return (
                      <div key={`tableau-${col}`} className="rounded-md border border-slate-600/40 bg-slate-900/50 p-2">
                        <button
                          type="button"
                          onClick={() => onSolitaireMoveToTableau(col)}
                          className="w-full rounded border border-slate-500/40 bg-slate-800/40 px-2 py-1 text-xs"
                        >
                          TABLEAU {col + 1}
                        </button>
                        <button
                          type="button"
                          onClick={() => onSolitaireSelectTableau(col)}
                          className={`mt-2 w-full rounded border px-2 py-2 text-sm ${selected ? "border-cyan-200 bg-cyan-400/20" : "border-slate-500/40 bg-slate-800/40"}`}
                        >
                          {top ? solitaireCardLabel(top) : "-"}
                        </button>
                        <p className="mt-1 text-xs text-slate-400">{pile.length} cards</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setGame("solitaire");
                    const done = foundationCount(solitaireFoundations);
                    const applied = Math.max(20, done * 5 + (isSolitaireOver ? 120 : 0));
                    setScore(applied);
                    setMessage(t("solitaireAppliedScore"));
                  }}
                  className="rounded-md border border-cyan-200/40 px-3 py-1"
                >
                  {t("solitaireApplyScore")}
                </button>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <h2 className="text-xl font-semibold">{t("scoreFormTitle")}</h2>
              <form onSubmit={onSubmit} className="mt-4 grid gap-3">
                <label className="grid gap-1 text-sm">
                  {t("playerNameLabel")}
                  <input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={24}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  {t("gameLabel")}
                  <select
                    value={game}
                    onChange={(e) => setGame(e.target.value)}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  >
                    {GAME_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {gameLabelById(option.id)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-sm">
                  {t("scoreLabel")}
                  <input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isPosting}
                  className="mt-2 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60"
                >
                  {isPosting ? t("scoreSaving") : t("scoreSave")}
                </button>
              </form>
              {message ? <p className="mt-3 text-sm text-cyan-200">{message}</p> : null}
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{t("statusTitle")}</h2>
                <button
                  type="button"
                  onClick={() => void loadScores()}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("reload")}
                </button>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>{t("statusLine1")}</li>
                <li>{t("statusLine2")}</li>
                <li>{t("statusLineSolitaire")}</li>
                <li>{t("statusLinePoker")}</li>
                <li>{t("statusLine4")}</li>
              </ul>
            </article>
          </section>
        ) : null}

        {activePanel === "survivors" ? (
          <section className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("survivorsTitle")}</h2>
                <button
                  type="button"
                  onClick={resetSurvivors}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("survivorsReset")}
                </button>
              </div>

              <p className="mt-2 text-sm text-slate-300">{survivorsMessage}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <span className="rounded border border-slate-400/40 px-2 py-1">{tf("survivorsWave", { wave: survivorsWave })}</span>
                <span className="rounded border border-slate-400/40 px-2 py-1">{tf("survivorsHp", { hp: survivorsHp, max: survivorsMaxHp })}</span>
                <span className="rounded border border-slate-400/40 px-2 py-1">{tf("survivorsLevel", { level: survivorsLevel })}</span>
                <span className="rounded border border-slate-400/40 px-2 py-1">{tf("survivorsTime", { sec: survivorsTimeSec })}</span>
                <span className="rounded border border-slate-400/40 px-2 py-1">{tf("survivorsKills", { count: survivorsKills })}</span>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {survivorsEnemies.map((enemy, index) => (
                  <button
                    key={enemy.id}
                    type="button"
                    onClick={() => onSurvivorsAttack(enemy.id)}
                    disabled={isSurvivorsOver}
                    className="rounded-lg border border-rose-200/40 bg-rose-400/10 p-3 text-left disabled:opacity-60"
                  >
                    <p className="text-sm font-semibold">ENEMY {index + 1}</p>
                    <p className="mt-1 text-xs text-slate-300">HP {Math.max(0, enemy.hp)} / {enemy.maxHp}</p>
                    <p className="mt-2 text-xs text-rose-200">{t("survivorsAttack")}</p>
                  </button>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setGame("survivors");
                    const applied = Math.max(20, survivorsWave * 18 + survivorsKills * 4 + survivorsLevel * 12 + Math.floor(survivorsTimeSec / 2));
                    setScore(applied);
                    setMessage(t("survivorsAppliedScore"));
                  }}
                  className="rounded-md border border-cyan-200/40 px-3 py-1"
                >
                  {t("survivorsApplyScore")}
                </button>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <h2 className="text-xl font-semibold">{t("scoreFormTitle")}</h2>
              <form onSubmit={onSubmit} className="mt-4 grid gap-3">
                <label className="grid gap-1 text-sm">
                  {t("playerNameLabel")}
                  <input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={24}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  {t("gameLabel")}
                  <select
                    value={game}
                    onChange={(e) => setGame(e.target.value)}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  >
                    {GAME_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {gameLabelById(option.id)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-sm">
                  {t("scoreLabel")}
                  <input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isPosting}
                  className="mt-2 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60"
                >
                  {isPosting ? t("scoreSaving") : t("scoreSave")}
                </button>
              </form>
              {message ? <p className="mt-3 text-sm text-cyan-200">{message}</p> : null}
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{t("statusTitle")}</h2>
                <button
                  type="button"
                  onClick={() => void loadScores()}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("reload")}
                </button>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>{t("statusLine1")}</li>
                <li>{t("statusLine2")}</li>
                <li>{t("statusLineSurvivors")}</li>
                <li>{t("statusLineSolitaire")}</li>
                <li>{t("statusLine4")}</li>
              </ul>
            </article>
          </section>
        ) : null}

        {activePanel === "uno" ? (
          <section className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("unoTitle")}</h2>
                <button
                  type="button"
                  onClick={resetUno}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("unoReset")}
                </button>
              </div>

              <p className="mt-2 text-sm text-slate-300">{unoMessage}</p>
              {connectedRoomCode ? <p className="mt-1 text-xs text-cyan-200">{roomTurnText(canOperateUnoNow)}</p> : null}

              <div className="mt-4 grid gap-3 rounded-lg border border-slate-500/30 bg-slate-950/40 p-4">
                <p className="text-sm">{t("unoTopCard")}: {unoTopCard ? unoCardLabel(unoTopCard) : "-"}</p>
                <p className="text-sm">{t("unoCpuHand")}: {unoLocalSide === "player" ? unoCpuHand.length : unoPlayerHand.length}</p>
              </div>

              <div className="mt-4">
                <p className="text-sm font-semibold">{t("unoYourHand")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(unoLocalSide === "player" ? unoPlayerHand : unoCpuHand).map((card, index) => {
                    const playable = unoTopCard ? canPlayCard(card, unoTopCard) : true;
                    return (
                      <button
                        key={`${card.color}-${card.value}-${index}`}
                        type="button"
                        onClick={() => playUnoCard(index, { side: unoLocalSide })}
                        disabled={!canOperateUnoNow || isUnoOver}
                        className={`rounded-md border px-3 py-2 text-sm ${playable ? "border-cyan-300/60 bg-cyan-400/10" : "border-slate-400/30 bg-slate-800/40"}`}
                      >
                        {unoCardLabel(card)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => drawUnoForPlayer({ side: unoLocalSide })}
                  disabled={!canOperateUnoNow || isUnoOver}
                  className="rounded-md border border-cyan-200/40 px-3 py-1"
                >
                  {t("unoDrawCard")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGame("uno");
                    const my = unoLocalSide === "player" ? unoPlayerHand.length : unoCpuHand.length;
                    const enemy = unoLocalSide === "player" ? unoCpuHand.length : unoPlayerHand.length;
                    setScore(Math.max(0, enemy - my + 20));
                    setMessage(t("unoAppliedScore"));
                  }}
                  className="rounded-md border border-cyan-200/40 px-3 py-1"
                >
                  {t("unoApplyScore")}
                </button>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <h2 className="text-xl font-semibold">{t("scoreFormTitle")}</h2>
              <form onSubmit={onSubmit} className="mt-4 grid gap-3">
                <label className="grid gap-1 text-sm">
                  {t("playerNameLabel")}
                  <input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={24}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  {t("gameLabel")}
                  <select
                    value={game}
                    onChange={(e) => setGame(e.target.value)}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  >
                    {GAME_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {gameLabelById(option.id)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-sm">
                  {t("scoreLabel")}
                  <input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isPosting}
                  className="mt-2 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60"
                >
                  {isPosting ? t("scoreSaving") : t("scoreSave")}
                </button>
              </form>
              {message ? <p className="mt-3 text-sm text-cyan-200">{message}</p> : null}
            </article>

            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{t("statusTitle")}</h2>
                <button
                  type="button"
                  onClick={() => void loadScores()}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("reload")}
                </button>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>{t("statusLine1")}</li>
                <li>{t("statusLine2")}</li>
                <li>{t("statusLineUno")}</li>
                <li>{t("statusLineShogi")}</li>
                <li>{t("statusLineMines")}</li>
                <li>{t("statusLineNumeron")}</li>
                <li>{t("statusLineBlackjack")}</li>
                <li>{t("statusLineChinchiro")}</li>
                <li>{t("statusLineSevens")}</li>
                <li>{t("statusLineDaifugo")}</li>
                <li>{t("statusLineFourPanel")}</li>
                <li>{t("statusLineDrawingRelay")}</li>
                <li>{t("statusLineFitPuzzle")}</li>
                <li>{t("statusLineMahjong")}</li>
                <li>{t("statusLinePoker")}</li>
                <li>{t("statusLineSolitaire")}</li>
                <li>{t("statusLineSurvivors")}</li>
                <li>{t("statusLine4")}</li>
              </ul>
            </article>
          </section>
        ) : null}

        {activePanel === "scores" ? (
          <section className="grid gap-5 md:grid-cols-[1fr]">
            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <h2 className="text-xl font-semibold">{t("scoreFormTitle")}</h2>
              <form onSubmit={onSubmit} className="mt-4 grid gap-3">
                <label className="grid gap-1 text-sm">
                  {t("playerNameLabel")}
                  <input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={24}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <label className="grid gap-1 text-sm">
                  {t("gameLabel")}
                  <select
                    value={game}
                    onChange={(e) => setGame(e.target.value)}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  >
                    {GAME_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {gameLabelById(option.id)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-sm">
                  {t("scoreLabel")}
                  <input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isPosting}
                  className="mt-2 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60"
                >
                  {isPosting ? t("scoreSaving") : t("scoreSave")}
                </button>
              </form>
              {message ? <p className="mt-3 text-sm text-cyan-200">{message}</p> : null}
            </article>
          </section>
        ) : null}

        {activePanel === "status" ? (
          <section className="grid gap-5 md:grid-cols-[1fr]">
            <article className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t("statusTitle")}</h2>
              <button
                type="button"
                onClick={() => void loadScores()}
                className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
              >
                {t("reload")}
              </button>
            </div>

            <ul className="mt-4 space-y-2 text-sm text-slate-200">
              <li>{t("statusLine1")}</li>
              <li>{t("statusLine2")}</li>
              <li>{t("statusLineMenu")}</li>
              <li>{t("statusLine3")}</li>
              <li>{t("statusLineGomoku")}</li>
              <li>{t("statusLineChess")}</li>
              <li>{t("statusLineShogi")}</li>
              <li>{t("statusLineMines")}</li>
              <li>{t("statusLineNumeron")}</li>
              <li>{t("statusLineBlackjack")}</li>
              <li>{t("statusLineChinchiro")}</li>
              <li>{t("statusLineSevens")}</li>
              <li>{t("statusLineDaifugo")}</li>
              <li>{t("statusLineFourPanel")}</li>
              <li>{t("statusLineDrawingRelay")}</li>
              <li>{t("statusLineFitPuzzle")}</li>
              <li>{t("statusLineMahjong")}</li>
              <li>{t("statusLinePoker")}</li>
              <li>{t("statusLineSolitaire")}</li>
              <li>{t("statusLineSurvivors")}</li>
              <li>{t("statusLineUno")}</li>
              <li>{t("statusLine4")}</li>
            </ul>
            </article>
          </section>
        ) : null}

        <section className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
          <h2 className="text-xl font-semibold">{t("latestScores")}</h2>
          {isLoading ? <p className="mt-3 text-sm text-slate-300">{t("loading")}</p> : null}
          {!isLoading && scores.length === 0 ? (
            <p className="mt-3 text-sm text-slate-300">{t("noScores")}</p>
          ) : null}
          {!isLoading && scores.length > 0 ? (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-400/30 text-left text-slate-300">
                    <th className="px-2 py-2">{t("tableId")}</th>
                    <th className="px-2 py-2">{t("tablePlayer")}</th>
                    <th className="px-2 py-2">{t("tableGame")}</th>
                    <th className="px-2 py-2">{t("tableScore")}</th>
                    <th className="px-2 py-2">{t("tableTime")}</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map((row) => (
                    <tr key={row.id} className="border-b border-slate-500/20">
                      <td className="px-2 py-2">{row.id}</td>
                      <td className="px-2 py-2">{row.playerName}</td>
                      <td className="px-2 py-2">{row.game ? gameLabelById(row.game) : "-"}</td>
                      <td className="px-2 py-2">{row.score}</td>
                      <td className="px-2 py-2">{new Date(row.createdAt).toLocaleString(dateLocale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
