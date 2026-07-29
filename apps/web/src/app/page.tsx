"use client";

import { PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import LegacyFitPuzzle from "./components/LegacyFitPuzzle";

type Panel = "menu" | "scores" | "othello" | "gomoku" | "chess" | "shogi" | "uno" | "minesweeper" | "numeron" | "blackjack" | "chinchiro" | "sevens" | "daifugo" | "fourPanel" | "drawingRelay" | "fitPuzzle" | "mahjong" | "poker" | "solitaire" | "survivors";
type PlayablePanel = Exclude<Panel, "menu" | "scores">;

const INITIAL_GAME_START_STATE: Record<PlayablePanel, boolean> = {
  othello: false,
  gomoku: false,
  chess: false,
  shogi: false,
  uno: false,
  minesweeper: false,
  numeron: false,
  blackjack: false,
  chinchiro: false,
  sevens: false,
  daifugo: false,
  fourPanel: false,
  drawingRelay: false,
  fitPuzzle: false,
  mahjong: false,
  poker: false,
  solitaire: false,
  survivors: false,
};

const PLAYABLE_PANELS: PlayablePanel[] = [
  "othello",
  "gomoku",
  "chess",
  "shogi",
  "uno",
  "minesweeper",
  "numeron",
  "blackjack",
  "chinchiro",
  "sevens",
  "daifugo",
  "fourPanel",
  "drawingRelay",
  "fitPuzzle",
  "mahjong",
  "poker",
  "solitaire",
  "survivors",
];

type RoomParticipant = {
  id: string;
  name: string;
  role: "host" | "guest" | "spectator";
  panel?: PlayablePanel | null;
};

type PublicRoomSummary = {
  code: string;
  listContext: "menu" | "game";
  isPublic: boolean;
  inGame: boolean;
  activePlayers: number;
  spectatorCount: number;
  totalParticipants: number;
  hostName: string;
  guestName: string;
  panels: PlayablePanel[];
};

type ScoreEntry = {
  id: number;
  playerName: string;
  score: number;
  game?: string | null;
  createdAt?: string;
};

type FitPuzzleDifficulty = "easy" | "normal" | "hard";

type FitPuzzleStageProfile = {
  bias: "balanced" | "long" | "blocks";
  mutationSteps: number;
  minComplex: number;
  minBranch: number;
};

type FitPuzzleCustomStage = {
  rows: number;
  cols: number;
  pieceCount: number;
  title: string;
  profile: FitPuzzleStageProfile;
  openingRotation: "mixed" | "mostly-rotated";
  assistLimit: number;
  seed: number;
};

type FitPuzzleProgress = {
  highestUnlockedStage: number;
  selectedStageIndex: number;
  difficulty: FitPuzzleDifficulty;
  noRotateMode: boolean;
  customStages: FitPuzzleCustomStage[];
  updatedAt: string | null;
};

type CloudAuthResult = {
  ok?: boolean;
  code?: string;
  message?: string;
  sessionId?: string;
  friendId?: string;
  profile?: {
    playerName?: string;
    profileBio?: string;
    playerAvatar?: string;
    fitPuzzleProgress?: unknown;
  };
};

type CloudApiResult = {
  ok?: boolean;
  code?: string;
  message?: string;
  [key: string]: unknown;
};

type FriendChatMessage = {
  id: number;
  senderUserId: string;
  receiverUserId: string;
  message: string;
  createdAt: number;
};

type FriendChatPeerReadState = {
  lastReadMessageId: number;
  lastReadAt: number;
};

type FriendListEntry = {
  friendId: string;
  playerName: string;
};

type FriendTab = "friends" | "incoming" | "outgoing" | "search";
type LanguageLabelKey = "langJa" | "langKo" | "langEn" | "langZh";
type MenuCategory = "board" | "card" | "casino" | "party";
type MenuTabCategory = "menu" | MenuCategory;

const INITIAL_MENU_TAB_OPEN_STATE: Record<MenuTabCategory, boolean> = {
  menu: true,
  board: true,
  card: true,
  casino: true,
  party: true,
};

const INITIAL_MENU_CARD_OPEN_STATE: Record<MenuCategory, boolean> = {
  board: true,
  card: true,
  casino: true,
  party: true,
};

type Language = "ja" | "ko" | "en" | "zh";
type OthelloMode = "cpu" | "cpuvscpu" | "local" | "chaos";
type OthelloCpuLevel = "easy" | "normal" | "hard";
type OthelloTurnOrder = "black" | "white" | "random";
type GomokuMode = "local" | "cpu";
type GomokuCpuLevel = "easy" | "normal" | "hard";
type GomokuTurnOrder = "black" | "white" | "random";
type ChessMode = "local" | "cpu";
type ChessCpuLevel = "easy" | "normal" | "hard";
type ChessTurnOrder = "white" | "black" | "random";
type ShogiMode = "local" | "cpu" | "chaos";
type ShogiCpuLevel = "easy" | "normal" | "hard";
type ShogiTurnOrder = "black" | "white" | "random";
type OthelloChaosTarget = "none" | "black" | "white" | "both" | "player" | "opponent";
type OthelloChaosHandicap = "none" | "immutable1";
type OthelloChaosToggle = "off" | "on";
type OthelloChaosSettings = {
  target: OthelloChaosTarget;
  handicap: OthelloChaosHandicap;
  randomLineIgnore: OthelloChaosToggle;
  overwriteLimit: number;
  bothBlackHandicap: OthelloChaosHandicap;
  bothWhiteHandicap: OthelloChaosHandicap;
  bothBlackOverwriteLimit: number;
  bothWhiteOverwriteLimit: number;
  destroyLimitBlack: number;
  destroyLimitWhite: number;
};

function normalizeOthelloModeForRoom(mode: OthelloMode, chaosEnabled: boolean): OthelloMode {
  if (mode === "local" || mode === "chaos") return mode;
  return chaosEnabled ? "chaos" : "local";
}

const LOGIN_I18N = {
  ja: {
    loginTitle: "ログイン",
    loginLead: "旧HTMLのエントリー導線をNextへ移行しました。",
    languageLabel: "Language",
    langJa: "日本語",
    langKo: "한국어",
    langEn: "English",
    langZh: "中文",
    userId: "ユーザーID",
    password: "パスワード",
    displayName: "表示名（ゲーム内）",
    displayNameAfterLogin: "ログイン後の表示名",
    displayNameSave: "表示名を保存",
    displayNameRequired: "表示名を入力してください。",
    displayNameUpdated: "表示名を更新しました。",
    profileBioLabel: "自己紹介文",
    profileBioPlaceholder: "自己紹介文を入力（180文字まで）",
    profileBioSave: "自己紹介文を保存",
    profileBioUpdated: "自己紹介文を更新しました。",
    profileSaveFailed: "プロフィールの保存に失敗しました。",
    loginButton: "ログインして遊ぶ",
    registerButton: "新規登録",
    guestButton: "ゲストで遊ぶ",
    credentialSaveLead: "IDとパスワードを手元に保存できます（端末内のみ処理）。",
    credentialSaveTxtButton: "ID/パスをTXT保存",
    credentialSavePdfButton: "ID/パスをPDF保存",
    credentialSaveTxtDone: "認証メモ(TXT)を保存しました。",
    credentialSavePdfDone: "印刷画面を開きました。保存先で「PDFに保存」を選んでください。",
    credentialSavePopupBlocked: "印刷ウィンドウを開けませんでした。ポップアップを許可してください。",
    processing: "処理中...",
    requireAuthFields: "ユーザーIDとパスワードを入力してください。",
    loginLoading: "ログイン中...",
    loginFailed: "ログインに失敗しました。ID/パスワードを確認してください。",
    loginAlreadyLoggedIn: "このアカウントは別の端末でログイン中です。先にログアウトしてください。",
    localResetConfirm: "このゲームをリセットします。よろしいですか？",
    roomSurrenderConfirm: "マルチ対戦中です。リセットすると降参になります。よろしいですか？",
    roomSurrendered: "{name} が降参しました。",
    registerLoading: "新規登録中...",
    registerFailed: "新規登録に失敗しました。既存IDの可能性があります。",
    registerSuccess: "新規登録が完了しました。",
    guestStarted: "ゲストモードで開始しました。",
    appTitle: "Neon Board Arcade",
    appLead: "旧HTMLの主要導線をNextへ移行中",
    backToLogin: "ログイン画面に戻る",
    backToMenuConfirm: "メニューに戻りますか？",
    modeCloud: "Cloud",
    modeGuest: "Guest",
    tabMenu: "メニュー",
    backToMenu: "メニューに戻る",
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
    tabMahjong: "麻雀",
    tabPoker: "ポーカー",
    tabSolitaire: "ソリティア",
    tabSurvivors: "Survivors",
    tabScores: "スコア",
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
    roomCodeInvalid: "6桁のルーム番号を入力してください。",
    roomPublic: "公開",
    roomPrivate: "非公開",
    roomPasswordLabel: "パスワード",
    roomPasswordOff: "なし",
    roomPasswordOn: "あり",
    roomListTitle: "公開ルーム一覧",
    roomListRefresh: "更新",
    roomListEmpty: "参加可能な公開ルームがありません。",
    roomSelectRequired: "参加するルームを選んでください。",
    spectateJoin: "観戦参加",
    quickMatchMulti: "クイックマッチ（マルチ）",
    roomCreate: "ルーム作成",
    roomJoin: "ルーム参加",
    roomDisconnect: "切断",
    copyInviteLink: "招待リンクをコピー",
    inviteLinkCopied: "招待リンクをコピーしました",
    inviteLinkCopyFailed: "招待リンクのコピーに失敗しました",
    inviteTokenIssueFailed: "招待トークンの発行に失敗しました",
    roomState: "状態",
    roomConnected: "接続ルーム",
    roomCreatePreparing: "ルームを作成中...（パスワード: {password}）",
    roomRole: "ロール",
    roomRoleHost: "ホスト",
    roomRoleGuest: "ゲスト",
    roomRoleSpectator: "観戦",
    roomMembers: "参加者",
    roomMatchedPlayers: "マッチ人数",
    roomOpponentLabel: "対面",
    roomOpponentWaiting: "相手待機中",
    roomMembersEmpty: "未参加",
    roomCapacityHint: "ルーム上限: 16人",
    profileLink: "プロフィール",
    inquiryViewerLink: "問い合わせ管理",
    inquiryFormLink: "問い合わせフォーム",
    friendsTitle: "フレンド",
    friendsTabFriends: "フレンド",
    friendsTabIncoming: "承認待ち",
    friendsTabOutgoing: "申請中",
    friendsTabSearch: "検索",
    friendsHintNoAuth: "ログインするとフレンド一覧を読み込みます",
    friendsHintReady: "フレンドタブでは名前/IDで絞り込み検索できます",
    friendsHintIncoming: "承認待ちタブでは申請者IDを承認/拒否できます",
    friendsHintOutgoing: "申請中タブでは送信済みIDを取り消せます",
    friendsHintSearch: "検索タブで名前/IDを検索して申請できます",
    friendIdPlaceholder: "名前 or フレンドID",
    friendSearchPlaceholder: "フレンドを検索（名前 or フレンドID）",
    friendSearchAction: "検索",
    friendRequestSend: "申請",
    friendApprove: "承認",
    friendReject: "拒否",
    friendCancel: "取消",
    friendRemove: "削除",
    friendReload: "再読込",
    friendsLoading: "フレンド一覧を読み込み中...",
    friendsListEmpty: "フレンドはまだいません",
    friendsSearchEmpty: "検索結果がありません",
    friendsSearchPrompt: "名前またはフレンドIDを入力して検索してください",
    friendsIncomingEmpty: "承認待ちの申請はありません",
    friendsOutgoingEmpty: "申請中のユーザーはいません",
    friendsLoadFailed: "フレンド取得に失敗しました",
    friendIdRequired: "名前またはフレンドIDを入力してください",
    friendIdCopy: "Friend IDをコピー",
    friendIdCopied: "Friend IDをコピーしました",
    friendIdCopyFailed: "Friend IDのコピーに失敗しました",
    friendRequestSent: "フレンド申請を送信しました",
    friendApproveSuccess: "フレンド申請を承認しました",
    friendRejectSuccess: "フレンド申請を拒否しました",
    friendCancelSuccess: "フレンド申請を取り消しました",
    friendRemoveSuccess: "フレンドを削除しました",
    friendNotFound: "指定した名前/IDのユーザーが見つかりません",
    friendSelfForbidden: "自分自身は追加できません",
    friendRequestAlreadySent: "すでに申請済みです",
    friendRequestAlreadyReceived: "相手からの申請が届いています。承認待ちタブで承認してください",
    friendRequestNotFound: "対象の申請が見つかりません",
    friendAlreadyExists: "すでにフレンドです",
    friendActionFailed: "フレンド操作に失敗しました",
    friendViewProfile: "プロフィールを見る",
    friendOpenChat: "チャット",
    friendChatWith: "チャット: {userId}",
    friendChatPlaceholder: "メッセージを入力",
    friendChatSend: "送信",
    friendChatLoading: "チャットを読み込み中...",
    friendChatEmpty: "まだメッセージはありません",
    friendChatMessageRequired: "メッセージを入力してください",
    friendChatForbidden: "フレンド同士のみチャットできます",
    friendChatSendFailed: "チャット送信に失敗しました",
    friendChatLoadFailed: "チャット取得に失敗しました",
    friendChatRateLimited: "送信が早すぎます。少し待ってください",
    friendChatRead: "既読",
    friendChatReadAt: "既読 {time}",
    profileViewerTitle: "プロフィール",
    profileViewerNoBio: "自己紹介文はまだありません。",
    profileViewerLoadFailed: "プロフィールの取得に失敗しました。",
    closeLabel: "閉じる",
    roomControlsOpen: "開く",
    roomControlsClose: "閉じる",
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
    roomFullRejected: "ルーム {code} は満員です（16人まで）",
    roomInGame: "このルームはゲーム中です。観戦モードは次対応予定です。",
    roomInGameSuggestSpectate: "対戦中のため参加できません。観戦を使ってください。",
    roomInviteRequired: "この非公開ルームへの参加には招待リンクが必要です。",
    quickMatchSearching: "マルチプレイの相手を検索中...",
    quickMatchConnected: "クイックマッチに接続しました（ルーム {code}）",
    quickMatchPrivateSkipped: "非公開ルームに当たったため、別のマッチを検索します...",
    spectatorReadOnly: "観戦モードで接続しました。操作は読み取り専用です。",
    roomErrorPrefix: "ルームエラー",
    roomErrRoomRequired: "ルーム情報の取得に失敗しました。再試行してください。",
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
    roomErrDrawVoteForbidden: "現在はドロー申請できません。",
    roomErrUnknown: "不明なエラー ({code})",
    spectatorChatTitle: "観戦チャット",
    spectatorChatPlaceholder: "観戦コメントを入力",
    spectatorChatSend: "送信",
    spectatorChatEmpty: "まだコメントはありません",
    roomChatTitle: "ルームチャット",
    roomChatPlaceholder: "メッセージを入力",
    roomChatSend: "送信",
    roomChatEmpty: "まだメッセージはありません",
    roomChatMuted: "チャット送信が制限されています",
    roomChatRateLimited: "送信が早すぎます。少し待ってください",
    visibilityPublic: "公開",
    visibilityPrivate: "非公開",
    gameStart: "ゲーム開始",
    gameStarting: "カウント中...",
    gameStartPrompt: "「ゲーム開始」を押すと操作できます。",
    gameStartCountdown: "開始まで {count}",
    roomWaitHostStart: "参加側はホストのゲーム開始を待ってください。",
    othelloTitle: "オセロ",
    othelloReset: "リセット",
    othelloModeLabel: "MODE",
    othelloModeCpu: "1P vs CPU",
    othelloModeCpuVsCpu: "CPU vs CPU",
    othelloModeLocal: "2P LOCAL",
    othelloModeChaos: "CHAOS",
    othelloChaosTargetLabel: "カオス対象",
    othelloChaosTargetNone: "なし",
    othelloChaosTargetBlack: "黒",
    othelloChaosTargetWhite: "白",
    othelloChaosTargetBoth: "両方",
    othelloChaosTargetPlayer: "プレイヤー",
    othelloChaosTargetOpponent: "相手",
    othelloChaosHandicapLabel: "固定石",
    othelloChaosHandicapNone: "なし",
    othelloChaosHandicapImmutable1: "1個固定",
    othelloChaosRandomLineIgnoreLabel: "直線無視",
    othelloChaosToggleOff: "OFF",
    othelloChaosToggleOn: "ON",
    othelloChaosOverwriteLimitLabel: "上書き回数",
    othelloChaosBlackSideTitle: "黒サイド",
    othelloChaosWhiteSideTitle: "白サイド",
    othelloChaosBlackHandicapLabel: "黒の固定石",
    othelloChaosWhiteHandicapLabel: "白の固定石",
    othelloChaosBlackOverwriteLimitLabel: "黒上書き回数",
    othelloChaosWhiteOverwriteLimitLabel: "白上書き回数",
    othelloChaosBlackDestroyLimitLabel: "黒破壊回数",
    othelloChaosWhiteDestroyLimitLabel: "白破壊回数",
    othelloCpuLevelLabel: "CPU LEVEL",
    othelloCpuLevelEasy: "やさしい",
    othelloCpuLevelNormal: "ふつう",
    othelloCpuLevelHard: "つよい",
    othelloTurnOrderLabel: "TURN",
    othelloTurnOrderBlack: "1P先手(黒)",
    othelloTurnOrderWhite: "1P後手(白)",
    othelloTurnOrderRandom: "ランダム",
    othelloChaosImmutableButton: "駒固定",
    othelloChaosDestroyButton: "駒破壊",
    othelloChaosDoubleButton: "二回行動",
    othelloChaosImmutableGuide: "駒固定の対象を選択中: 内側の自分の駒を1つ選んでください",
    othelloChaosDestroyGuideCorner: "駒破壊の対象を選択中: 角の自分の駒を1つ選んでください",
    othelloChaosDestroyGuideSelf: "駒破壊の対象を選択中: 自分の駒を{need}個選んでください（{count}/{need}）",
    othelloChaosDestroyGuideEnemy: "駒破壊の対象を選択中: 破壊する相手の駒を1つ選んでください",
    othelloDrawRequestSent: "ドロー申請を送信しました。相手の同意を待っています。",
    othelloDrawRequestCanceled: "ドロー申請を取り消しました。",
    othelloDrawRequestPending: "相手からドロー申請が来ています。リセットを押すと同意します。",
    othelloDrawAgreed: "両者同意でドロー成立。",
    othelloCpuThinking: "CPUが考えています...",
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
    gomokuTitle: "五目並べ",
    gomokuReset: "リセット",
    gomokuModeLabel: "MODE",
    gomokuModeCpu: "1P vs CPU",
    gomokuModeLocal: "2P LOCAL",
    gomokuCpuLevelLabel: "CPU LEVEL",
    gomokuCpuLevelEasy: "やさしい",
    gomokuCpuLevelNormal: "ふつう",
    gomokuCpuLevelHard: "つよい",
    gomokuTurnOrderLabel: "TURN",
    gomokuTurnOrderBlack: "1P先手(黒)",
    gomokuTurnOrderWhite: "1P後手(白)",
    gomokuTurnOrderRandom: "ランダム",
    gomokuCpuThinking: "CPUが考えています...",
    gomokuTurnBlack: "黒の番です",
    gomokuTurnWhite: "白の番です",
    gomokuWin: "{winner}の勝ちです",
    gomokuDraw: "引き分けです",
    applyGomokuToScore: "黒石数をスコアに反映",
    appliedGomokuToScore: "五目の黒石数をスコア欄へ反映しました。",
    chessTitle: "チェス",
    chessReset: "リセット",
    chessModeLabel: "MODE",
    chessModeCpu: "1P vs CPU",
    chessModeLocal: "2P LOCAL",
    chessCpuLevelLabel: "CPU LEVEL",
    chessCpuLevelEasy: "やさしい",
    chessCpuLevelNormal: "ふつう",
    chessCpuLevelHard: "つよい",
    chessTurnOrderLabel: "TURN",
    chessTurnOrderWhite: "1P先手(白)",
    chessTurnOrderBlack: "1P後手(黒)",
    chessTurnOrderRandom: "ランダム",
    chessCpuThinking: "CPUが考えています...",
    chessTurnWhite: "白の番です",
    chessTurnBlack: "黒の番です",
    chessSelectOwn: "自分の駒を選択してください。",
    chessIllegalMove: "その駒はそこへ移動できません。",
    chessWin: "{winner}の勝ちです（キングを取りました）",
    chessDraw: "引き分けです。",
    chessApplyScore: "残り駒差をスコアに反映",
    chessAppliedScore: "チェスの残り駒差をスコア欄へ反映しました。",
    shogiTitle: "将棋",
    shogiReset: "リセット",
    shogiModeLabel: "MODE",
    shogiModeCpu: "1P vs CPU",
    shogiModeLocal: "ローカル2人",
    shogiModeChaos: "CHAOS",
    shogiCpuLevelLabel: "CPU LEVEL",
    shogiCpuLevelEasy: "かんたん",
    shogiCpuLevelNormal: "ふつう",
    shogiCpuLevelHard: "つよい",
    shogiTurnOrderLabel: "TURN",
    shogiTurnOrderBlack: "1P先手(先手)",
    shogiTurnOrderWhite: "1P後手(後手)",
    shogiTurnOrderRandom: "ランダム",
    shogiCpuThinking: "CPUが考えています...",
    shogiTurnBlack: "先手の番です",
    shogiTurnWhite: "後手の番です",
    shogiSelectOwn: "自分の駒を選択してください。",
    shogiIllegalMove: "その駒はそこへ移動できません。",
    shogiWin: "{winner}の勝ちです（王を取りました）",
    shogiApplyScore: "残り駒差をスコアに反映",
    shogiAppliedScore: "将棋の残り駒差をスコア欄へ反映しました。",
    minesTitle: "マインスイーパー",
    minesReset: "リセット",
    minesHint: "マスを開いて地雷を避けてください。",
    minesGameOver: "地雷を踏みました。",
    minesCleared: "クリアです。",
    minesApplyScore: "開放マス数をスコアに反映",
    minesAppliedScore: "開放マス数をスコア欄へ反映しました。",
    numeronTitle: "ヌメロン",
    numeronReset: "リセット",
    numeronHint: "0-9の数字を重複なしで3桁選んで予想してください。",
    numeronHintWithDigits: "0-9の数字を重複なしで{digits}桁選んで予想してください。",
    numeronGuess: "予想",
    numeronClearDraft: "入力クリア",
    numeronSubmitGuess: "判定する",
    numeronInvalidGuess: "3桁の重複なし数字を入力してください。",
    numeronInvalidGuessDigits: "{digits}桁の重複なし数字を入力してください。",
    numeronResult: "{guess}: {hits} HIT / {blows} BLOW",
    numeronWin: "正解です！",
    numeronApplyScore: "挑戦回数からスコア反映",
    numeronAppliedScore: "ヌメロンの挑戦回数からスコア欄へ反映しました。",
    numeronHistory: "履歴",
    numeronSecretLabel: "シークレット",
    numeronDigitsLabel: "DIGITS",
    numeronTryLabel: "TRIES",
    numeronLimitLabel: "LIMIT",
    numeronCandidatesLabel: "CANDIDATES",
    numeronBack: "1文字戻す",
    numeronAssistTitle: "アシスト",
    numeronHighLowDigit: "HIGH&LOW数字",
    numeronUseHighLow: "HIGH&LOW",
    numeronUseReveal: "REVEAL",
    numeronNoCharges: "もう使えません。",
    numeronTryLimitReached: "手数上限です。シークレットは {secret} でした。",
    numeronHighLowResult: "{digit} -> {result}",
    numeronRevealResult: "{index}桁目は {digit}",
    numeronSecretSetupTitle: "あなたのシークレット設定",
    numeronSecretInputPlaceholder: "重複なしの数字",
    numeronSecretSet: "この数字で開始",
    numeronSecretRandom: "ランダム",
    numeronSecretSetDone: "シークレットを設定しました。",
    numeronSetSecretFirst: "先にシークレットを設定してください。",
    numeronSecretReady: "シークレット設定済み",
    numeronEditSecret: "シークレット再編集",
    numeronCloseSecretEditor: "閉じる",
    numeronOpponentField: "相手の場",
    numeronOpponentHistory: "相手への予想履歴",
    numeronYourField: "自分の場",
    numeronYourSecret: "自分のシークレット",
    numeronEnemyIncomingHistory: "敵からの履歴",
    numeronEnemyHistoryOpen: "履歴を開く",
    numeronEnemyHistoryClose: "履歴を閉じる",
    numeronEnemyResult: "敵 {guess}: {hits} HIT / {blows} BLOW",
    numeronEnemySolved: "敵が正解しました… ({guess})",
    numeronItemConfirmHighLow: "HIGH&LOWを使用しますか？",
    numeronItemConfirmReveal: "REVEALを使用しますか？",
    numeronItemUseYes: "はい",
    numeronItemUseNo: "いいえ",
    numeronItemUseCanceled: "アイテム使用をキャンセルしました。",
    blackjackTitle: "ブラックジャック",
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
    chinchiroTitle: "チンチロ",
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
    sevensTitle: "セブンズ",
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
    daifugoTitle: "大富豪",
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
    fourPanelTitle: "4コマリレー",
    fourPanelReset: "リセット",
    fourPanelSubmit: "このコマを確定",
    fourPanelClear: "描画クリア",
    fourPanelUndoStroke: "1手戻す",
    fourPanelUndoPanel: "1コマ戻す",
    fourPanelUndoUnavailable: "これ以上戻せません。",
    fourPanelShortcutHint: "Ctrl+Z: 1手戻す / Enter: 確定 / Delete: クリア",
    fourPanelHint: "コマを描いて確定すると次のコマへ進みます。",
    fourPanelNotDrawn: "コマが未描画です。描いてから確定してください。",
    fourPanelDone: "4コマ完成です。",
    fourPanelProgress: "PANEL {current} / 4",
    fourPanelStoryTitle: "お題",
    fourPanelApplyScore: "完成度をスコアに反映",
    fourPanelAppliedScore: "4コマの進捗をスコア欄へ反映しました。",
    drawingRelayTitle: "お絵かきリレー",
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
    fitPuzzleTitle: "フィットパズル",
    fitPuzzleReset: "シャッフル",
    fitPuzzleHint: "隣接タイルをクリックして 1-8 を順番に並べてください。",
    fitPuzzleOnlyAdjacent: "空白に隣接するタイルのみ動かせます。",
    fitPuzzleProgress: "手数: {moves}",
    fitPuzzleSolved: "クリア！ 手数: {moves}",
    fitPuzzleMoves: "手数",
    fitPuzzleApplyScore: "手数からスコア反映",
    fitPuzzleAppliedScore: "フィットパズルの結果をスコア欄へ反映しました。",
    mahjongTitle: "麻雀",
    mahjongReset: "配牌し直し",
    mahjongShuffle: "ツモる",
    mahjongHintButton: "ヒント",
    mahjongHint: "13枚からツモって14枚にし、1枚打牌してください。14枚で和了判定できます。",
    mahjongNoHint: "この形では有効な待ちが見つかりません。",
    mahjongHintLine: "有効牌: {a}",
    mahjongRemoved: "打牌しました。",
    mahjongRemovedAndShuffle: "テンパイ候補がありません。形を作り直しましょう。",
    mahjongBlocked: "14枚時は牌を選んで打牌、13枚時はツモってください。",
    mahjongSwitched: "打牌候補を選択しました。もう一度押して確定します。",
    mahjongClear: "ツモ！ 和了です。",
    mahjongRemaining: "山牌残り: {count}",
    mahjongDrawn: "ツモ: {tile}。打牌してください。",
    mahjongWinReady: "{tile} をツモ。和了できます。",
    mahjongNeedDiscardFirst: "先に打牌してください。",
    mahjongNeedDrawFirst: "先にツモってください。",
    mahjongCannotWinYet: "まだ和了形ではありません。",
    mahjongRyukyoku: "流局です。山牌が尽きました。",
    mahjongTsumo: "ツモ和了",
    mahjongHand: "手牌",
    mahjongRiver: "河",
    mahjongWall: "山",
    mahjongRound: "局",
    mahjongSeat: "自風",
    mahjongDora: "ドラ表示",
    mahjongJunme: "巡目",
    mahjongOpponent: "対面",
    mahjongHonba: "本場",
    mahjongKyotaku: "供託",
    mahjongRiichi: "リーチ",
    mahjongHintDiscard: "打牌候補: {tile} 切り -> 待ち {waits} ({outs} 枚)",
    mahjongResultTitle: "和了結果",
    mahjongResultHanFu: "{han} 翻 / {fu} 符",
    mahjongResultPoint: "目安点: {point}",
    mahjongResultYakuman: "役満",
    mahjongYakuMenzenTsumo: "門前清自摸和",
    mahjongYakuTanyao: "断么九",
    mahjongYakuToitoi: "対々和",
    mahjongYakuYakuhai: "役牌",
    mahjongYakuChiitoitsu: "七対子",
    mahjongYakuHonitsu: "混一色",
    mahjongYakuChinitsu: "清一色",
    mahjongYakuKokushi: "国士無双",
    mahjongApplyScore: "進行度をスコアに反映",
    mahjongAppliedScore: "麻雀の結果をスコア欄へ反映しました。",
    pokerTitle: "ポーカー",
    pokerDeal: "配り直し",
    pokerDraw: "勝負",
    pokerHint: "大会ルールです。BET後に次へで進行します。",
    pokerReady: "ショーダウンが完了しました。結果を確認してください。",
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
    solitaireTitle: "ソリティア",
    solitaireReset: "配り直し",
    solitaireStock: "山札",
    solitaireWaste: "捨て札",
    solitaireHint: "カードを選択して移動先をクリックしてください。",
    solitaireInvalidMove: "その場所には移動できません。",
    solitaireSelected: "移動先を選んでください。",
    solitaireCleared: "クリア！ すべて土台へ移動しました。",
    solitaireUndo: "1手戻す",
    solitaireUndoUnavailable: "これ以上戻せません。",
    solitaireAutoClear: "CLEAR",
    solitaireAutoClearUnavailable: "まだCLEARは使えません。",
    solitaireFoundations: "土台枚数: {count}",
    solitaireApplyScore: "進行度をスコアに反映",
    solitaireAppliedScore: "ソリティアの結果をスコア欄へ反映しました。",
    survivorsTitle: "Survivors",
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
    unoTitle: "UNO",
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
    unoChooseMatchRule: "出し方を選択してください（色一致 / 数字一致）",
    unoMatchByColor: "色一致",
    unoMatchByNumber: "数字一致",
    unoMatchRuleReset: "選択解除",
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
    scoreLoading: "読み込み中...",
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
    gameMahjong: "麻雀",
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
    langEn: "English",
    langZh: "中文",
    userId: "사용자 ID",
    password: "비밀번호",
    displayName: "표시 이름 (게임 내)",
    displayNameAfterLogin: "로그인 후 표시 이름",
    displayNameSave: "표시 이름 저장",
    displayNameRequired: "표시 이름을 입력하세요.",
    displayNameUpdated: "표시 이름을 업데이트했습니다.",
    profileBioLabel: "자기소개",
    profileBioPlaceholder: "자기소개를 입력하세요 (최대 180자)",
    profileBioSave: "자기소개 저장",
    profileBioUpdated: "자기소개를 업데이트했습니다.",
    profileSaveFailed: "프로필 저장에 실패했습니다.",
    loginButton: "로그인하고 플레이",
    registerButton: "회원가입",
    guestButton: "게스트로 플레이",
    credentialSaveLead: "ID와 비밀번호를 기기에 저장할 수 있습니다 (로컬 처리).",
    credentialSaveTxtButton: "ID/비밀번호 TXT 저장",
    credentialSavePdfButton: "ID/비밀번호 PDF 저장",
    credentialSaveTxtDone: "인증 메모(TXT)를 저장했습니다.",
    credentialSavePdfDone: "인쇄 화면을 열었습니다. 저장 대상에서 PDF 저장을 선택하세요.",
    credentialSavePopupBlocked: "인쇄 창을 열 수 없습니다. 팝업 허용을 확인하세요.",
    processing: "처리 중...",
    requireAuthFields: "사용자 ID와 비밀번호를 입력하세요.",
    loginLoading: "로그인 중...",
    loginFailed: "로그인에 실패했습니다. ID/비밀번호를 확인하세요.",
    loginAlreadyLoggedIn: "이 계정은 다른 기기에서 로그인 중입니다. 먼저 로그아웃해 주세요.",
    localResetConfirm: "이 게임을 리셋할까요?",
    roomSurrenderConfirm: "멀티 대전 중입니다. 리셋하면 기권 처리됩니다. 진행할까요?",
    roomSurrendered: "{name} 님이 기권했습니다.",
    registerLoading: "회원가입 중...",
    registerFailed: "회원가입에 실패했습니다. 이미 존재하는 ID일 수 있습니다.",
    registerSuccess: "회원가입이 완료되었습니다.",
    guestStarted: "게스트 모드로 시작했습니다.",
    appTitle: "Neon Board Arcade",
    appLead: "기존 HTML 주요 동선을 Next로 이전 중",
    backToLogin: "로그인으로 돌아가기",
    backToMenuConfirm: "메뉴로 돌아갈까요?",
    modeCloud: "Cloud",
    modeGuest: "Guest",
    tabMenu: "메뉴",
    backToMenu: "메뉴로 돌아가기",
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
    tabMahjong: "마작",
    tabPoker: "포커",
    tabSolitaire: "솔리테어",
    tabSurvivors: "Survivors",
    tabScores: "점수",
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
    roomCodeInvalid: "6자리 룸 번호를 입력하세요.",
    roomPublic: "공개",
    roomPrivate: "비공개",
    roomPasswordLabel: "비밀번호",
    roomPasswordOff: "없음",
    roomPasswordOn: "있음",
    roomListTitle: "공개 룸 목록",
    roomListRefresh: "새로고침",
    roomListEmpty: "참가 가능한 공개 룸이 없습니다.",
    roomSelectRequired: "참가할 룸을 선택하세요.",
    spectateJoin: "관전 참가",
    quickMatchMulti: "빠른 매치 (멀티)",
    roomCreate: "룸 생성",
    roomJoin: "룸 참가",
    roomDisconnect: "연결 해제",
    copyInviteLink: "초대 링크 복사",
    inviteLinkCopied: "초대 링크를 복사했습니다",
    inviteLinkCopyFailed: "초대 링크 복사에 실패했습니다",
    inviteTokenIssueFailed: "초대 토큰 발급에 실패했습니다",
    roomState: "상태",
    roomConnected: "연결된 룸",
    roomCreatePreparing: "룸 생성 중... (비밀번호: {password})",
    roomRole: "역할",
    roomRoleHost: "호스트",
    roomRoleGuest: "게스트",
    roomRoleSpectator: "관전자",
    roomMembers: "참가자",
    roomMatchedPlayers: "매치 인원",
    roomOpponentLabel: "상대",
    roomOpponentWaiting: "상대 대기 중",
    roomMembersEmpty: "없음",
    roomCapacityHint: "룸 최대 인원: 16명",
    profileLink: "프로필",
    inquiryViewerLink: "문의 관리",
    inquiryFormLink: "문의 폼",
    friendsTitle: "친구",
    friendsTabFriends: "친구",
    friendsTabIncoming: "승인 대기",
    friendsTabOutgoing: "요청 중",
    friendsTabSearch: "검색",
    friendsHintNoAuth: "로그인하면 친구 목록을 불러옵니다",
    friendsHintReady: "친구 탭에서는 이름/ID로 필터 검색할 수 있습니다",
    friendsHintIncoming: "대기 탭에서 신청자 ID를 승인/거절할 수 있습니다",
    friendsHintOutgoing: "요청 중 탭에서 보낸 요청을 취소할 수 있습니다",
    friendsHintSearch: "검색 탭에서 이름/ID를 검색해 친구 요청을 보낼 수 있습니다",
    friendIdPlaceholder: "이름 또는 친구 ID",
    friendSearchPlaceholder: "친구 검색 (이름 또는 친구 ID)",
    friendSearchAction: "검색",
    friendRequestSend: "요청",
    friendApprove: "승인",
    friendReject: "거절",
    friendCancel: "취소",
    friendRemove: "삭제",
    friendReload: "새로고침",
    friendsLoading: "친구 목록을 불러오는 중...",
    friendsListEmpty: "친구가 아직 없습니다",
    friendsSearchEmpty: "검색 결과가 없습니다",
    friendsSearchPrompt: "이름 또는 친구 ID를 입력해 검색하세요",
    friendsIncomingEmpty: "승인 대기 요청이 없습니다",
    friendsOutgoingEmpty: "요청 중인 사용자가 없습니다",
    friendsLoadFailed: "친구 목록을 불러오지 못했습니다",
    friendIdRequired: "이름 또는 친구 ID를 입력하세요",
    friendIdCopy: "Friend ID 복사",
    friendIdCopied: "Friend ID를 복사했습니다",
    friendIdCopyFailed: "Friend ID 복사에 실패했습니다",
    friendRequestSent: "친구 요청을 보냈습니다",
    friendApproveSuccess: "친구 요청을 승인했습니다",
    friendRejectSuccess: "친구 요청을 거절했습니다",
    friendCancelSuccess: "친구 요청을 취소했습니다",
    friendRemoveSuccess: "친구를 삭제했습니다",
    friendNotFound: "해당 이름/ID의 사용자를 찾을 수 없습니다",
    friendSelfForbidden: "자기 자신은 추가할 수 없습니다",
    friendRequestAlreadySent: "이미 요청을 보냈습니다",
    friendRequestAlreadyReceived: "상대 요청이 도착했습니다. 승인 대기 탭에서 승인해 주세요",
    friendRequestNotFound: "대상 요청을 찾을 수 없습니다",
    friendAlreadyExists: "이미 친구입니다",
    friendActionFailed: "친구 작업에 실패했습니다",
    friendViewProfile: "프로필 보기",
    friendOpenChat: "채팅",
    friendChatWith: "채팅: {userId}",
    friendChatPlaceholder: "메시지를 입력하세요",
    friendChatSend: "전송",
    friendChatLoading: "채팅을 불러오는 중...",
    friendChatEmpty: "아직 메시지가 없습니다",
    friendChatMessageRequired: "메시지를 입력하세요",
    friendChatForbidden: "친구끼리만 채팅할 수 있습니다",
    friendChatSendFailed: "채팅 전송에 실패했습니다",
    friendChatLoadFailed: "채팅을 불러오지 못했습니다",
    friendChatRateLimited: "전송이 너무 빠릅니다. 잠시 후 다시 시도하세요",
    friendChatRead: "읽음",
    friendChatReadAt: "읽음 {time}",
    profileViewerTitle: "프로필",
    profileViewerNoBio: "자기소개가 아직 없습니다.",
    profileViewerLoadFailed: "프로필을 불러오지 못했습니다.",
    closeLabel: "닫기",
    roomControlsOpen: "열기",
    roomControlsClose: "닫기",
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
    roomFullRejected: "룸 {code} 은(는) 가득 찼습니다 (최대 16명)",
    roomInGame: "이 룸은 게임 중입니다. 관전 모드는 다음에 지원 예정입니다.",
    roomInGameSuggestSpectate: "경기 중이라 참가할 수 없습니다. 관전을 이용하세요.",
    roomInviteRequired: "이 비공개 룸은 초대 링크가 필요합니다.",
    quickMatchSearching: "멀티 플레이 상대를 찾는 중...",
    quickMatchConnected: "빠른 매치에 연결했습니다 (룸 {code})",
    quickMatchPrivateSkipped: "비공개 룸이어서 다른 매치를 찾는 중...",
    spectatorReadOnly: "관전 모드로 접속했습니다. 조작은 읽기 전용입니다.",
    roomErrorPrefix: "룸 오류",
    roomErrRoomRequired: "룸 정보를 가져오지 못했습니다. 다시 시도해 주세요.",
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
    roomErrDrawVoteForbidden: "지금은 무승부 신청을 할 수 없습니다.",
    roomErrUnknown: "알 수 없는 오류 ({code})",
    spectatorChatTitle: "관전 채팅",
    spectatorChatPlaceholder: "관전 코멘트를 입력",
    spectatorChatSend: "전송",
    spectatorChatEmpty: "아직 코멘트가 없습니다",
    roomChatTitle: "룸 채팅",
    roomChatPlaceholder: "메시지를 입력",
    roomChatSend: "전송",
    roomChatEmpty: "아직 메시지가 없습니다",
    roomChatMuted: "채팅 전송이 제한되었습니다",
    roomChatRateLimited: "전송이 너무 빠릅니다. 잠시 후 다시 시도하세요",
    visibilityPublic: "공개",
    visibilityPrivate: "비공개",
    gameStart: "게임 시작",
    gameStarting: "카운트 중...",
    gameStartPrompt: "\"게임 시작\"을 누르면 조작할 수 있습니다.",
    gameStartCountdown: "시작까지 {count}",
    roomWaitHostStart: "참가자는 호스트의 게임 시작을 기다려 주세요.",
    othelloTitle: "오셀로 (Next 이전판)",
    othelloReset: "리셋",
    othelloModeLabel: "MODE",
    othelloModeCpu: "1P vs CPU",
    othelloModeCpuVsCpu: "CPU vs CPU",
    othelloModeLocal: "2P LOCAL",
    othelloModeChaos: "CHAOS",
    othelloChaosTargetLabel: "카오스 대상",
    othelloChaosTargetNone: "없음",
    othelloChaosTargetBlack: "흑",
    othelloChaosTargetWhite: "백",
    othelloChaosTargetBoth: "양쪽",
    othelloChaosTargetPlayer: "플레이어",
    othelloChaosTargetOpponent: "상대",
    othelloChaosHandicapLabel: "고정석",
    othelloChaosHandicapNone: "없음",
    othelloChaosHandicapImmutable1: "1개 고정",
    othelloChaosRandomLineIgnoreLabel: "직선 무시",
    othelloChaosToggleOff: "OFF",
    othelloChaosToggleOn: "ON",
    othelloChaosOverwriteLimitLabel: "덮어쓰기 횟수",
    othelloChaosBlackSideTitle: "흑 사이드",
    othelloChaosWhiteSideTitle: "백 사이드",
    othelloChaosBlackHandicapLabel: "흑 고정석",
    othelloChaosWhiteHandicapLabel: "백 고정석",
    othelloChaosBlackOverwriteLimitLabel: "흑 덮어쓰기 횟수",
    othelloChaosWhiteOverwriteLimitLabel: "백 덮어쓰기 횟수",
    othelloChaosBlackDestroyLimitLabel: "흑 파괴 횟수",
    othelloChaosWhiteDestroyLimitLabel: "백 파괴 횟수",
    othelloCpuLevelLabel: "CPU LEVEL",
    othelloCpuLevelEasy: "쉬움",
    othelloCpuLevelNormal: "보통",
    othelloCpuLevelHard: "어려움",
    othelloTurnOrderLabel: "TURN",
    othelloTurnOrderBlack: "1P 선공(흑)",
    othelloTurnOrderWhite: "1P 후공(백)",
    othelloTurnOrderRandom: "랜덤",
    othelloChaosImmutableButton: "돌 고정",
    othelloChaosDestroyButton: "돌 파괴",
    othelloChaosDoubleButton: "2회 행동",
    othelloChaosImmutableGuide: "돌 고정 대상 선택 중: 안쪽에 있는 자신의 돌 1개를 선택하세요",
    othelloChaosDestroyGuideCorner: "돌 파괴 대상 선택 중: 모서리의 자신의 돌 1개를 선택하세요",
    othelloChaosDestroyGuideSelf: "돌 파괴 대상 선택 중: 자신의 돌 {need}개를 선택하세요 ({count}/{need})",
    othelloChaosDestroyGuideEnemy: "돌 파괴 대상 선택 중: 파괴할 상대 돌 1개를 선택하세요",
    othelloDrawRequestSent: "무승부 신청을 보냈습니다. 상대 동의를 기다리는 중입니다.",
    othelloDrawRequestCanceled: "무승부 신청을 취소했습니다.",
    othelloDrawRequestPending: "상대가 무승부를 신청했습니다. 리셋을 누르면 동의합니다.",
    othelloDrawAgreed: "양측 동의로 무승부가 성립했습니다.",
    othelloCpuThinking: "CPU가 생각 중입니다...",
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
    gomokuModeLabel: "MODE",
    gomokuModeCpu: "1P vs CPU",
    gomokuModeLocal: "2P LOCAL",
    gomokuCpuLevelLabel: "CPU LEVEL",
    gomokuCpuLevelEasy: "쉬움",
    gomokuCpuLevelNormal: "보통",
    gomokuCpuLevelHard: "어려움",
    gomokuTurnOrderLabel: "TURN",
    gomokuTurnOrderBlack: "1P 선공(흑)",
    gomokuTurnOrderWhite: "1P 후공(백)",
    gomokuTurnOrderRandom: "랜덤",
    gomokuCpuThinking: "CPU가 생각 중입니다...",
    gomokuTurnBlack: "흑 차례입니다",
    gomokuTurnWhite: "백 차례입니다",
    gomokuWin: "{winner} 승리",
    gomokuDraw: "무승부입니다",
    applyGomokuToScore: "흑 돌 수를 점수에 반영",
    appliedGomokuToScore: "오목 흑 돌 수를 점수 입력란에 반영했습니다.",
    chessTitle: "체스 (Next 이전판)",
    chessReset: "리셋",
    chessModeLabel: "MODE",
    chessModeCpu: "1P vs CPU",
    chessModeLocal: "2P LOCAL",
    chessCpuLevelLabel: "CPU LEVEL",
    chessCpuLevelEasy: "쉬움",
    chessCpuLevelNormal: "보통",
    chessCpuLevelHard: "어려움",
    chessTurnOrderLabel: "TURN",
    chessTurnOrderWhite: "1P 선공(백)",
    chessTurnOrderBlack: "1P 후공(흑)",
    chessTurnOrderRandom: "랜덤",
    chessCpuThinking: "CPU가 생각 중입니다...",
    chessTurnWhite: "백 차례입니다",
    chessTurnBlack: "흑 차례입니다",
    chessSelectOwn: "자신의 말을 선택하세요.",
    chessIllegalMove: "해당 말은 그 칸으로 이동할 수 없습니다.",
    chessWin: "{winner} 승리 (킹을 잡았습니다)",
    chessDraw: "무승부입니다.",
    chessApplyScore: "남은 말 수 차이를 점수에 반영",
    chessAppliedScore: "체스 남은 말 수 차이를 점수 입력란에 반영했습니다.",
    shogiTitle: "장기 (Next 이전판)",
    shogiReset: "리셋",
    shogiModeLabel: "MODE",
    shogiModeCpu: "1P vs CPU",
    shogiModeLocal: "로컬 2인",
    shogiModeChaos: "CHAOS",
    shogiCpuLevelLabel: "CPU LEVEL",
    shogiCpuLevelEasy: "쉬움",
    shogiCpuLevelNormal: "보통",
    shogiCpuLevelHard: "어려움",
    shogiTurnOrderLabel: "TURN",
    shogiTurnOrderBlack: "1P 선공(선수)",
    shogiTurnOrderWhite: "1P 후공(후수)",
    shogiTurnOrderRandom: "랜덤",
    shogiCpuThinking: "CPU가 생각 중입니다...",
    shogiTurnBlack: "선수 차례입니다",
    shogiTurnWhite: "후수 차례입니다",
    shogiSelectOwn: "자신의 말을 선택하세요.",
    shogiIllegalMove: "해당 말은 그 칸으로 이동할 수 없습니다.",
    shogiWin: "{winner} 승리 (왕을 잡았습니다)",
    shogiApplyScore: "남은 말 수 차이를 점수에 반영",
    shogiAppliedScore: "장기 남은 말 수 차이를 점수 입력란에 반영했습니다.",
    minesTitle: "지뢰찾기",
    minesReset: "리셋",
    minesHint: "칸을 열어 지뢰를 피하세요.",
    minesGameOver: "지뢰를 밟았습니다.",
    minesCleared: "클리어했습니다.",
    minesApplyScore: "연 칸 수를 점수에 반영",
    minesAppliedScore: "연 칸 수를 점수 입력란에 반영했습니다.",
    numeronTitle: "뉴메론 (Next 이전판)",
    numeronReset: "리셋",
    numeronHint: "0-9 숫자를 중복 없이 3자리로 선택해 추측하세요.",
    numeronHintWithDigits: "0-9 숫자를 중복 없이 {digits}자리로 선택해 추측하세요.",
    numeronGuess: "추측",
    numeronClearDraft: "입력 지우기",
    numeronSubmitGuess: "판정",
    numeronInvalidGuess: "중복 없는 3자리 숫자를 입력하세요.",
    numeronInvalidGuessDigits: "중복 없는 {digits}자리 숫자를 입력하세요.",
    numeronResult: "{guess}: {hits} HIT / {blows} BLOW",
    numeronWin: "정답입니다!",
    numeronApplyScore: "시도 횟수로 점수 반영",
    numeronAppliedScore: "뉴메론 시도 횟수를 점수 입력란에 반영했습니다.",
    numeronHistory: "기록",
    numeronSecretLabel: "시크릿",
    numeronDigitsLabel: "DIGITS",
    numeronTryLabel: "TRIES",
    numeronLimitLabel: "LIMIT",
    numeronCandidatesLabel: "CANDIDATES",
    numeronBack: "한 글자 지우기",
    numeronAssistTitle: "보조 기능",
    numeronHighLowDigit: "HIGH&LOW 숫자",
    numeronUseHighLow: "HIGH&LOW",
    numeronUseReveal: "REVEAL",
    numeronNoCharges: "더 이상 사용할 수 없습니다.",
    numeronTryLimitReached: "시도 횟수 제한입니다. 시크릿은 {secret} 였습니다.",
    numeronHighLowResult: "{digit} -> {result}",
    numeronRevealResult: "{index}번째 자리는 {digit}",
    numeronSecretSetupTitle: "내 시크릿 설정",
    numeronSecretInputPlaceholder: "중복 없는 숫자",
    numeronSecretSet: "이 숫자로 시작",
    numeronSecretRandom: "랜덤",
    numeronSecretSetDone: "시크릿을 설정했습니다.",
    numeronSetSecretFirst: "먼저 시크릿을 설정해 주세요.",
    numeronSecretReady: "시크릿 설정 완료",
    numeronEditSecret: "시크릿 다시 편집",
    numeronCloseSecretEditor: "닫기",
    numeronOpponentField: "상대 필드",
    numeronOpponentHistory: "상대 추측 이력",
    numeronYourField: "내 필드",
    numeronYourSecret: "내 시크릿",
    numeronEnemyIncomingHistory: "적의 추측 기록",
    numeronEnemyHistoryOpen: "기록 열기",
    numeronEnemyHistoryClose: "기록 닫기",
    numeronEnemyResult: "적 {guess}: {hits} HIT / {blows} BLOW",
    numeronEnemySolved: "적이 정답을 맞췄습니다... ({guess})",
    numeronItemConfirmHighLow: "HIGH&LOW를 사용하시겠습니까?",
    numeronItemConfirmReveal: "REVEAL을 사용하시겠습니까?",
    numeronItemUseYes: "예",
    numeronItemUseNo: "아니요",
    numeronItemUseCanceled: "아이템 사용을 취소했습니다.",
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
    fourPanelUndoStroke: "한 획 되돌리기",
    fourPanelUndoPanel: "한 컷 되돌리기",
    fourPanelUndoUnavailable: "더 이상 되돌릴 수 없습니다.",
    fourPanelShortcutHint: "Ctrl+Z: 한 획 되돌리기 / Enter: 확정 / Delete: 지우기",
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
    mahjongTitle: "마작",
    mahjongReset: "다시 배치",
    mahjongShuffle: "쯔모",
    mahjongHintButton: "힌트",
    mahjongHint: "13패에서 쯔모해 14패를 만들고 1장을 버리세요. 14패에서 화료 판정이 가능합니다.",
    mahjongNoHint: "현재 형태에서는 유효 대기가 없습니다.",
    mahjongHintLine: "유효패: {a}",
    mahjongRemoved: "패를 버렸습니다.",
    mahjongRemovedAndShuffle: "텐파이 후보가 없습니다. 형태를 다시 만드세요.",
    mahjongBlocked: "14패일 때는 패를 버리고, 13패일 때는 쯔모하세요.",
    mahjongSwitched: "버릴 패를 선택했습니다. 다시 누르면 확정됩니다.",
    mahjongClear: "쯔모! 화료입니다.",
    mahjongRemaining: "남은 산패: {count}",
    mahjongDrawn: "쯔모: {tile}. 패를 버리세요.",
    mahjongWinReady: "{tile} 쯔모. 화료 가능합니다.",
    mahjongNeedDiscardFirst: "먼저 패를 버리세요.",
    mahjongNeedDrawFirst: "먼저 쯔모하세요.",
    mahjongCannotWinYet: "아직 화료 형태가 아닙니다.",
    mahjongRyukyoku: "유국입니다. 산패가 다 떨어졌습니다.",
    mahjongTsumo: "쯔모 화료",
    mahjongHand: "손패",
    mahjongRiver: "버림패",
    mahjongWall: "산",
    mahjongRound: "국",
    mahjongSeat: "자풍",
    mahjongDora: "도라 표시",
    mahjongJunme: "순목",
    mahjongOpponent: "상대",
    mahjongHonba: "본장",
    mahjongKyotaku: "공탁",
    mahjongRiichi: "리치",
    mahjongHintDiscard: "추천 타패: {tile} -> 대기 {waits} ({outs}장)",
    mahjongResultTitle: "화료 결과",
    mahjongResultHanFu: "{han} 판 / {fu} 부",
    mahjongResultPoint: "예상 점수: {point}",
    mahjongResultYakuman: "역만",
    mahjongYakuMenzenTsumo: "멘젠 쯔모",
    mahjongYakuTanyao: "탕야오",
    mahjongYakuToitoi: "또이또이",
    mahjongYakuYakuhai: "역패",
    mahjongYakuChiitoitsu: "치또이츠",
    mahjongYakuHonitsu: "혼일색",
    mahjongYakuChinitsu: "청일색",
    mahjongYakuKokushi: "국사무쌍",
    mahjongApplyScore: "진행도를 점수에 반영",
    mahjongAppliedScore: "마작 결과를 점수 입력란에 반영했습니다.",
    pokerTitle: "포커 (Next 이전판)",
    pokerDeal: "다시 배분",
    pokerDraw: "승부",
    pokerHint: "대회 룰입니다. BET 후 다음으로 진행하세요.",
    pokerReady: "쇼다운이 완료되었습니다. 결과를 확인하세요.",
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
    solitaireUndo: "한 수 되돌리기",
    solitaireUndoUnavailable: "더 이상 되돌릴 수 없습니다.",
    solitaireAutoClear: "CLEAR",
    solitaireAutoClearUnavailable: "아직 CLEAR를 사용할 수 없습니다.",
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
    unoChooseMatchRule: "카드 기준을 고르세요 (색 일치 / 숫자 일치)",
    unoMatchByColor: "색 일치",
    unoMatchByNumber: "숫자 일치",
    unoMatchRuleReset: "선택 해제",
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
    scoreLoading: "불러오는 중...",
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
    gameMahjong: "마작",
    gamePoker: "포커",
    gameSolitaire: "솔리테어",
    gameSurvivors: "Survivors",
    scoreLoadFailed: "점수 목록을 불러오지 못했습니다. Nest API 실행 여부를 확인하세요.",
  },
} as const;

type I18nMap = { [K in keyof typeof LOGIN_I18N.ja]: string };

const EN_I18N: Partial<I18nMap> = {
  loginTitle: "Login",
  loginLead: "The legacy HTML entry flow has been migrated to Next.",
  languageLabel: "Language",
  langJa: "Japanese",
  langKo: "Korean",
  langEn: "English",
  langZh: "Chinese",
  userId: "User ID",
  password: "Password",
  displayName: "Display Name (in game)",
  displayNameAfterLogin: "Display Name After Login",
  displayNameSave: "Save Display Name",
  displayNameRequired: "Please enter a display name.",
  displayNameUpdated: "Display name updated.",
  profileBioLabel: "Bio",
  profileBioPlaceholder: "Write your bio (up to 180 chars)",
  profileBioSave: "Save Bio",
  profileBioUpdated: "Bio updated.",
  profileSaveFailed: "Failed to save profile.",
  loginButton: "Login and Play",
  registerButton: "Register",
  guestButton: "Play as Guest",
  credentialSaveLead: "You can save your ID and password locally on this device.",
  credentialSaveTxtButton: "Save ID/Password as TXT",
  credentialSavePdfButton: "Save ID/Password as PDF",
  credentialSaveTxtDone: "Credential memo (TXT) has been downloaded.",
  credentialSavePdfDone: "Print view opened. Choose Save as PDF in the print dialog.",
  credentialSavePopupBlocked: "Could not open print window. Please allow pop-ups.",
  processing: "Processing...",
  requireAuthFields: "Please enter both user ID and password.",
  loginLoading: "Logging in...",
  loginFailed: "Login failed. Please check your ID/password.",
  loginAlreadyLoggedIn: "This account is already logged in on another device. Please log out there first.",
  localResetConfirm: "Reset this game?",
  roomSurrenderConfirm: "You are in multiplayer. Pressing reset will count as surrender. Continue?",
  roomSurrendered: "{name} surrendered.",
  registerLoading: "Registering...",
  registerFailed: "Registration failed. The ID may already exist.",
  registerSuccess: "Registration completed.",
  guestStarted: "Started in guest mode.",
  appTitle: "Neon Board Arcade",
  appLead: "Main legacy HTML flows are being migrated to Next.",
  backToLogin: "Back to Login",
  backToMenuConfirm: "Return to menu?",
  modeCloud: "Cloud",
  modeGuest: "Guest",
  tabMenu: "Menu",
  gameStarting: "Counting...",
  gameStartCountdown: "Starting in {count}",
  roomWaitHostStart: "Participants should wait for the host to start the game.",
  tabOthello: "Othello",
  tabGomoku: "Gomoku",
  tabShogi: "Shogi",
  tabChess: "Chess",
  tabUno: "UNO",
  tabMinesweeper: "Minesweeper",
  tabNumeron: "Numeron",
  tabBlackjack: "Blackjack",
  tabChinchiro: "Chinchiro",
  tabSevens: "Sevens",
  tabDaifugo: "Daifugo",
  tabFourPanel: "4-Panel Relay",
  tabDrawingRelay: "Drawing Relay",
  tabFitPuzzle: "Fit Puzzle",
  tabMahjong: "Mahjong",
  tabPoker: "Poker",
  tabSolitaire: "Solitaire",
  tabSurvivors: "Survivors",
  menuTitle: "Game Select (Next Migration Menu)",
  menuLead: "The legacy HTML menu is being migrated in phases. You can move to Othello, Gomoku, Chess, and UNO first.",
  playableLead: "Playable in Next migration",
  roomTitle: "Room Controls (Migrating)",
  roomServerUrl: "Room Server URL",
  roomCode: "Room Code",
  roomCodePlaceholder: "6 digits",
  roomPublic: "Public",
  roomPrivate: "Private",
  roomPasswordLabel: "Password",
  roomPasswordOff: "Off",
  roomPasswordOn: "On",
  roomListTitle: "Public Rooms",
  roomListRefresh: "Refresh",
  roomListEmpty: "No joinable public rooms right now.",
  roomSelectRequired: "Please select a room first.",
  roomCreate: "Create Room",
  roomJoin: "Join Room",
  roomDisconnect: "Disconnect",
  copyInviteLink: "Copy Invite Link",
  roomState: "State",
  roomConnected: "Connected Room",
  roomCreatePreparing: "Creating room... (Password: {password})",
  roomRole: "Role",
  roomMembers: "Participants",
  roomMatchedPlayers: "Matched Players",
  roomOpponentLabel: "Opponent",
  roomOpponentWaiting: "Waiting for opponent",
  roomCapacityHint: "Room Capacity: 16 participants",
  profileLink: "Profile",
  friendViewProfile: "View Profile",
  friendOpenChat: "Chat",
  friendChatWith: "Chat: {userId}",
  friendsTabSearch: "Search",
  friendsHintSearch: "Search by name/Friend ID and send requests.",
  friendsHintReady: "Filter friends by name or Friend ID in the Friends tab.",
  friendIdPlaceholder: "Name or Friend ID",
  friendSearchPlaceholder: "Search friends (name or Friend ID)",
  friendSearchAction: "Search",
  friendIdRequired: "Please enter a name or Friend ID.",
  friendChatPlaceholder: "Type a message",
  friendChatSend: "Send",
  friendChatLoading: "Loading chat...",
  friendChatEmpty: "No messages yet",
  friendsSearchEmpty: "No matching friends found.",
  friendsSearchPrompt: "Enter a name or Friend ID to search.",
  friendChatMessageRequired: "Please enter a message.",
  friendChatForbidden: "Only friends can chat.",
  friendChatSendFailed: "Failed to send message.",
  friendChatLoadFailed: "Failed to load chat.",
  friendChatRateLimited: "You are sending too quickly. Please wait.",
  friendIdCopy: "Copy Friend ID",
  friendIdCopied: "Friend ID copied.",
  friendIdCopyFailed: "Failed to copy Friend ID.",
  friendNotFound: "No user found for that name/ID.",
  friendChatRead: "Read",
  friendChatReadAt: "Read {time}",
  profileViewerTitle: "Profile",
  profileViewerNoBio: "No bio yet.",
  profileViewerLoadFailed: "Failed to load profile.",
  closeLabel: "Close",
  roomControlsOpen: "Open",
  roomControlsClose: "Close",
  inquiryViewerLink: "Inquiry Admin",
  inquiryFormLink: "Inquiry Form",
  loading: "Loading...",
  gameOthello: "Othello",
  gameShogi: "Shogi",
  gameChess: "Chess",
  gameUno: "UNO",
  gameGomoku: "Gomoku",
  gameMinesweeper: "Minesweeper",
  gameNumeron: "Numeron",
  gameBlackjack: "Blackjack",
  gameChinchiro: "Chinchiro",
  gameSevens: "Sevens",
  gameDaifugo: "Daifugo",
  gameFourPanel: "4-Panel Relay",
  gameDrawingRelay: "Drawing Relay",
  gameFitPuzzle: "Fit Puzzle",
  gameMahjong: "Mahjong",
  gamePoker: "Poker",
  gameSolitaire: "Solitaire",
  gameSurvivors: "Survivors",
};

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

const ZH_I18N: Partial<I18nMap> = {
  loginTitle: "登录",
  loginLead: "旧版 HTML 入口流程已迁移到 Next。",
  languageLabel: "Language",
  langJa: "日语",
  langKo: "韩语",
  langEn: "英语",
  langZh: "中文",
  userId: "用户 ID",
  password: "密码",
  displayName: "显示名（游戏内）",
  displayNameAfterLogin: "登录后的显示名",
  displayNameSave: "保存显示名",
  profileBioLabel: "个人简介",
  profileBioPlaceholder: "输入个人简介（最多180字）",
  profileBioSave: "保存个人简介",
  profileBioUpdated: "个人简介已更新。",
  profileSaveFailed: "保存个人资料失败。",
  loginButton: "登录并开始",
  registerButton: "注册",
  guestButton: "游客模式",
  credentialSaveLead: "可将 ID 和密码仅在本设备本地保存。",
  credentialSaveTxtButton: "将 ID/密码保存为 TXT",
  credentialSavePdfButton: "将 ID/密码保存为 PDF",
  credentialSaveTxtDone: "认证备忘录（TXT）已下载。",
  credentialSavePdfDone: "已打开打印页面，请在打印对话框中选择“保存为 PDF”。",
  credentialSavePopupBlocked: "无法打开打印窗口，请允许弹窗。",
  processing: "处理中...",
  loginAlreadyLoggedIn: "此账号已在其他设备登录，请先在其他设备退出。",
  localResetConfirm: "要重置这个游戏吗？",
  roomSurrenderConfirm: "当前为多人对战，点击重置将判定为认输。是否继续？",
  roomSurrendered: "{name} 已认输。",
  backToLogin: "返回登录",
  backToMenuConfirm: "要返回菜单吗？",
  tabMenu: "菜单",
  gameStarting: "倒计时中...",
  gameStartCountdown: "倒计时 {count}",
  roomWaitHostStart: "参与方请等待房主开始游戏。",
  roomTitle: "房间操作",
  roomCode: "房间号",
  roomPublic: "公开",
  roomPrivate: "私密",
  roomPasswordLabel: "密码",
  roomPasswordOff: "无",
  roomPasswordOn: "有",
  friendsHintReady: "在好友标签可按名称或 Friend ID 进行筛选",
  friendsTabSearch: "搜索",
  friendsHintSearch: "可在搜索标签按名称/Friend ID查找并发送申请",
  friendIdPlaceholder: "名称或 Friend ID",
  friendSearchPlaceholder: "搜索好友（名称或 Friend ID）",
  friendSearchAction: "搜索",
  friendIdRequired: "请输入名称或 Friend ID",
  friendNotFound: "找不到该名称/ID的用户",
  friendsSearchEmpty: "没有匹配的好友",
  friendsSearchPrompt: "请输入名称或 Friend ID 进行搜索",
  friendIdCopy: "复制 Friend ID",
  friendIdCopied: "已复制 Friend ID",
  friendIdCopyFailed: "复制 Friend ID 失败",
  roomListTitle: "公开房间列表",
  roomListRefresh: "刷新",
  roomListEmpty: "当前没有可加入的公开房间。",
  roomSelectRequired: "请先选择房间。",
  roomCreate: "创建房间",
  roomJoin: "加入房间",
  roomDisconnect: "断开连接",
  roomState: "状态",
  roomConnected: "已连接房间",
  roomCreatePreparing: "正在创建房间...（密码: {password}）",
  roomRole: "角色",
  roomMembers: "参与者",
  roomMatchedPlayers: "匹配人数",
  roomOpponentLabel: "对手",
  roomOpponentWaiting: "等待对手中",
  roomCapacityHint: "房间上限: 16人",
  profileLink: "个人资料",
  friendViewProfile: "查看资料",
  friendOpenChat: "聊天",
  friendChatWith: "聊天: {userId}",
  friendChatPlaceholder: "输入消息",
  friendChatSend: "发送",
  friendChatLoading: "正在加载聊天...",
  friendChatEmpty: "暂无消息",
  friendChatMessageRequired: "请输入消息",
  friendChatForbidden: "仅好友可聊天",
  friendChatSendFailed: "发送消息失败",
  friendChatLoadFailed: "获取聊天失败",
  friendChatRateLimited: "发送过快，请稍后重试",
  friendChatRead: "已读",
  friendChatReadAt: "已读 {time}",
  profileViewerTitle: "个人资料",
  profileViewerNoBio: "暂时没有个人简介。",
  profileViewerLoadFailed: "获取个人资料失败。",
  closeLabel: "关闭",
  roomControlsOpen: "展开",
  roomControlsClose: "收起",
  roomChatTitle: "房间聊天",
  roomChatSend: "发送",
  roomChatPlaceholder: "输入消息",
  quickMatchSearching: "正在搜索多人对战...",
  quickMatchConnected: "已连接快速匹配（房间 {code}）",
  roomChatRateLimited: "发送过快，请稍后再试。",
  roomChatMuted: "聊天发送已受限。",
};

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
type NumeronDigitCount = 3 | 4;
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
  type PokerPhase = "betting" | "preflop" | "flop" | "turn" | "river" | "showdown";
type SolitaireSuit = "H" | "D" | "C" | "S";
type SolitaireCard = {
  suit: SolitaireSuit;
  rank: number;
  faceUp: boolean;
};
type SolitaireSelection =
  | { from: "waste" }
  | { from: "foundation"; suit: SolitaireSuit }
  | { from: "tableau"; col: number; index: number };
type SolitaireDragOverTarget =
  | { kind: "foundation"; suit: SolitaireSuit }
  | { kind: "tableau"; col: number };
type SolitaireSnapshot = {
  stock: SolitaireCard[];
  waste: SolitaireCard[];
  foundations: Record<SolitaireSuit, SolitaireCard[]>;
  tableau: SolitaireCard[][];
  selection: SolitaireSelection | null;
  message: string;
  isOver: boolean;
};
type SolitairePartyPiece = {
  id: string;
  left: number;
  delay: number;
  duration: number;
  drift: number;
  spin: number;
  size: number;
  color: string;
};
type SolitaireFoundationFlight = {
  id: string;
  label: string;
  red: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  delayMs: number;
  durationMs: number;
  phase: "start" | "end";
};
type SurvivorsEnemy = {
  id: string;
  hp: number;
  maxHp: number;
};
type BrushCursorPreview = {
  x: number;
  y: number;
  size: number;
  visible: boolean;
};
type MahjongCell = number;
type MahjongMeld = {
  type: "triplet" | "sequence";
  tile: MahjongCell;
};
type MahjongWinSummary = {
  yakuKeys: Array<keyof typeof LOGIN_I18N.ja>;
  han: number;
  fu: number;
  point: number;
  isYakuman: boolean;
};

const FOUR_PANEL_RANDOM_TITLES = [
  "朝から大事件",
  "宇宙人のアルバイト",
  "猫とロボの休日",
  "伝説のプリン",
  "秘密基地の夜",
  "温泉でタイムスリップ",
];

const pickRandomFourPanelTitle = () => {
  return FOUR_PANEL_RANDOM_TITLES[Math.floor(Math.random() * FOUR_PANEL_RANDOM_TITLES.length)] || FOUR_PANEL_RANDOM_TITLES[0];
};

const normalizeFourPanelTitle = (value: string) => {
  return String(value || "").trim().slice(0, 40);
};

const DRAWING_RELAY_PROMPTS = [
  "空飛ぶラーメン屋",
  "筋トレするペンギン",
  "迷子のロボット",
  "宇宙を泳ぐ金魚",
  "ドラゴンと文化祭",
  "秘密基地の夜",
];
const DEFAULT_FOUR_PANEL_BRUSH_COLOR = "#111827";
const DEFAULT_DRAWING_RELAY_BRUSH_COLOR = "#0f172a";
const BRUSH_SIZE_MIN = 1;
const BRUSH_SIZE_MAX = 50;

const hexToRgba = (hexColor: string, opacityPercent: number) => {
  const raw = hexColor.replace("#", "");
  if (raw.length !== 6) return hexColor;
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  const alpha = Math.min(100, Math.max(0, opacityPercent)) / 100;
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
};

const clampBrushSize = (value: number) => {
  if (!Number.isFinite(value)) return BRUSH_SIZE_MIN;
  const rounded = Math.round(value);
  return Math.max(BRUSH_SIZE_MIN, Math.min(BRUSH_SIZE_MAX, rounded));
};

const brushCursorFromEvent = (event: ReactPointerEvent<HTMLCanvasElement>, brushSize: number) => {
  const canvas = event.currentTarget;
  const rect = canvas.getBoundingClientRect();
  const x = Math.max(0, Math.min(rect.width || 0, event.clientX - rect.left));
  const y = Math.max(0, Math.min(rect.height || 0, event.clientY - rect.top));
  const size = clampBrushSize(brushSize);
  return { x, y, size };
};

const drawBrushSegment = (
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
  diameter: number,
  color: string,
  minDistance = 0,
) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  const radius = Math.max(0.5, diameter / 2);

  if (distance > 0.001 && distance < minDistance) {
    return false;
  }

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = diameter;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;

  if (distance <= 0.001) {
    ctx.beginPath();
    ctx.arc(from.x, from.y, radius, 0, Math.PI * 2);
    ctx.fill();
    return true;
  }

  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  return true;
};

const beginStrokeLayerSession = (
  canvas: HTMLCanvasElement,
  layerRef: React.MutableRefObject<HTMLCanvasElement | null>,
  baseSnapshotRef: React.MutableRefObject<ImageData | null>,
) => {
  const baseCtx = canvas.getContext("2d");
  if (!baseCtx) return null;

  baseSnapshotRef.current = baseCtx.getImageData(0, 0, canvas.width, canvas.height);

  let layer = layerRef.current;
  if (!layer) {
    layer = document.createElement("canvas");
    layerRef.current = layer;
  }
  if (layer.width !== canvas.width || layer.height !== canvas.height) {
    layer.width = canvas.width;
    layer.height = canvas.height;
  }

  const layerCtx = layer.getContext("2d");
  if (!layerCtx) return null;
  layerCtx.clearRect(0, 0, layer.width, layer.height);
  return { baseCtx, layer, layerCtx };
};

const compositeStrokeLayer = (
  baseCtx: CanvasRenderingContext2D,
  baseSnapshot: ImageData,
  layer: HTMLCanvasElement,
  opacityPercent: number,
) => {
  baseCtx.putImageData(baseSnapshot, 0, 0);
  baseCtx.save();
  baseCtx.globalAlpha = Math.min(100, Math.max(0, opacityPercent)) / 100;
  baseCtx.drawImage(layer, 0, 0);
  baseCtx.restore();
};

const FIT_PUZZLE_SIZE = 3;
const MAHJONG_TYPE_COUNT = 34;
const MAHJONG_START_HAND_COUNT = 13;
const MAHJONG_WAIT_HINT_LIMIT = 8;
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
const MAHJONG_ORPHAN_TILE_IDS = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33] as const;
const FOUR_PANEL_EMPTY_SNAPSHOT = "__EMPTY__";

function mahjongTileLabel(id: number): string {
  if (!Number.isInteger(id) || id < 0) return "?";
  return MAHJONG_TILE_LABELS[id % MAHJONG_TILE_LABELS.length] || "?";
}

function mahjongTileFace(tile: number): { main: string; sub: string; toneClass: string } {
  if (tile >= 0 && tile <= 8) {
    return { main: String((tile % 9) + 1), sub: "萬", toneClass: "text-rose-700" };
  }
  if (tile >= 9 && tile <= 17) {
    return { main: String((tile % 9) + 1), sub: "筒", toneClass: "text-slate-700" };
  }
  if (tile >= 18 && tile <= 26) {
    return { main: String((tile % 9) + 1), sub: "索", toneClass: "text-emerald-700" };
  }

  const honorFaces = ["東", "南", "西", "北", "白", "發", "中"];
  const honorIndex = tile - 27;
  const main = honorFaces[honorIndex] || "?";
  const toneClass = tile === 33 ? "text-red-700" : tile === 32 ? "text-emerald-700" : "text-slate-800";
  return { main, sub: "", toneClass };
}

const MAHJONG_DIGIT_KANJI = ["一", "二", "三", "四", "五", "六", "七", "八", "九"] as const;
const MAHJONG_PIN_COORDS = [
  [[50, 50]],
  [[50, 24], [50, 76]],
  [[50, 18], [50, 50], [50, 82]],
  [[30, 24], [70, 24], [30, 76], [70, 76]],
  [[30, 24], [70, 24], [50, 50], [30, 76], [70, 76]],
  [[30, 20], [70, 20], [30, 50], [70, 50], [30, 80], [70, 80]],
  [[30, 16], [70, 16], [50, 34], [30, 50], [70, 50], [30, 84], [70, 84]],
  [[30, 14], [70, 14], [30, 36], [70, 36], [30, 64], [70, 64], [30, 86], [70, 86]],
  [[30, 14], [50, 14], [70, 14], [30, 50], [50, 50], [70, 50], [30, 86], [50, 86], [70, 86]],
] as const;

const MAHJONG_SOU_COORDS = [
  [[50, 50]],
  [[40, 28], [60, 72]],
  [[35, 22], [50, 50], [65, 78]],
  [[35, 24], [65, 24], [35, 76], [65, 76]],
  [[35, 24], [65, 24], [50, 50], [35, 76], [65, 76]],
  [[35, 18], [65, 18], [35, 50], [65, 50], [35, 82], [65, 82]],
  [[25, 18], [50, 18], [75, 18], [25, 50], [75, 50], [25, 82], [75, 82]],
  [[25, 16], [50, 16], [75, 16], [25, 39], [75, 39], [25, 62], [75, 62], [50, 84]],
  [[25, 16], [50, 16], [75, 16], [25, 39], [50, 39], [75, 39], [25, 72], [50, 72], [75, 72]],
] as const;

function mahjongTileKind(tile: number): "man" | "pin" | "sou" | "honor" {
  if (tile >= 0 && tile <= 8) return "man";
  if (tile >= 9 && tile <= 17) return "pin";
  if (tile >= 18 && tile <= 26) return "sou";
  return "honor";
}

function mahjongTileRank(tile: number): number {
  return (tile % 9) + 1;
}

function renderMahjongTileArt(tile: number, compact = false) {
  const kind = mahjongTileKind(tile);
  const rank = mahjongTileRank(tile);
  const isRedFive = rank === 5 && (kind === "man" || kind === "pin" || kind === "sou");
  const brushFont = "'Yu Mincho', 'Hiragino Mincho ProN', 'MS Mincho', serif";

  if (kind === "man") {
    return (
      <>
        <span
          className={`block text-center ${compact ? "text-sm" : "text-xl"} font-black leading-none tracking-tight ${isRedFive ? "text-red-700" : "text-slate-800"}`}
          style={{ fontFamily: brushFont }}
        >
          {MAHJONG_DIGIT_KANJI[rank - 1]}
        </span>
        <span
          className={`mt-0.5 block text-center ${compact ? "text-[8px]" : "text-[10px]"} font-semibold leading-none ${isRedFive ? "text-red-700" : "text-slate-700"}`}
          style={{ fontFamily: brushFont }}
        >
          萬
        </span>
      </>
    );
  }

  if (kind === "pin") {
    const coords = MAHJONG_PIN_COORDS[rank - 1] || [];
    return (
      <div className={`relative mx-auto ${compact ? "h-8 w-5" : "h-11 w-7"}`}>
        {coords.map(([x, y], idx) => {
          const ring = isRedFive ? "bg-red-700" : rank === 1 ? "bg-rose-700" : "bg-sky-800";
          const center = isRedFive ? "bg-rose-300" : "bg-white";
          return (
            <span
              key={`mahjong-pin-${tile}-${idx}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <span className={`block h-2.5 w-2.5 rounded-full ${ring} shadow-[inset_0_0_0_1px_rgba(255,255,255,0.28)]`}>
                <span className={`mx-auto mt-[3px] block h-1 w-1 rounded-full ${center}`} />
              </span>
            </span>
          );
        })}
      </div>
    );
  }

  if (kind === "sou") {
    const coords = MAHJONG_SOU_COORDS[rank - 1] || [];
    return (
      <div className={`relative mx-auto ${compact ? "h-8 w-5" : "h-11 w-7"}`}>
        {coords.map(([x, y], idx) => {
          const stem = isRedFive ? "bg-red-700" : "bg-emerald-700";
          return (
            <span
              key={`mahjong-sou-${tile}-${idx}`}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <span className={`relative block h-3 w-1.5 rounded-full ${stem} shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22)]`}>
                <span className="absolute -top-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald-300/80" />
                <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald-300/80" />
              </span>
            </span>
          );
        })}
      </div>
    );
  }

  const face = mahjongTileFace(tile);
  if (tile === 31) {
    return <span className={`block text-center ${compact ? "text-base" : "text-2xl"} font-black leading-none text-slate-400`} style={{ fontFamily: brushFont }}>▢</span>;
  }
  return (
    <span
      className={`block text-center ${compact ? "text-base" : "text-2xl"} font-extrabold leading-none tracking-tight ${face.toneClass}`}
      style={{ fontFamily: brushFont, textShadow: "0 0.4px 0 rgba(15,23,42,0.15)" }}
    >
      {face.main}
    </span>
  );
}

function shuffleNumberList(list: number[]): number[] {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function sortMahjongTiles(tiles: number[]): number[] {
  return [...tiles].sort((a, b) => a - b);
}

function normalizeMahjongTileList(source: unknown): number[] {
  if (!Array.isArray(source)) return [];
  return source
    .flat(Infinity)
    .filter((value): value is number => Number.isInteger(value) && value >= 0 && value < MAHJONG_TYPE_COUNT);
}

function createMahjongWall(): number[] {
  const wall: number[] = [];
  for (let tile = 0; tile < MAHJONG_TYPE_COUNT; tile += 1) {
    for (let copy = 0; copy < 4; copy += 1) {
      wall.push(tile);
    }
  }
  return shuffleNumberList(wall);
}

function createMahjongStartBoard(): { hand: MahjongCell[]; wall: MahjongCell[] } {
  const wall = createMahjongWall();
  const hand = sortMahjongTiles(wall.slice(0, MAHJONG_START_HAND_COUNT));
  return {
    hand,
    wall: wall.slice(MAHJONG_START_HAND_COUNT),
  };
}

function mahjongRemainingCount(wall: MahjongCell[]): number {
  return wall.length;
}

function mahjongCountTiles(tiles: MahjongCell[]): number[] {
  const counts = Array.from({ length: MAHJONG_TYPE_COUNT }, () => 0);
  tiles.forEach((tile) => {
    counts[tile] += 1;
  });
  return counts;
}

function mahjongCanFormMelds(counts: number[]): boolean {
  let first = -1;
  for (let i = 0; i < counts.length; i += 1) {
    if (counts[i] > 0) {
      first = i;
      break;
    }
  }
  if (first < 0) return true;

  if (counts[first] >= 3) {
    counts[first] -= 3;
    if (mahjongCanFormMelds(counts)) {
      counts[first] += 3;
      return true;
    }
    counts[first] += 3;
  }

  const suit = Math.floor(first / 9);
  const rank = first % 9;
  const canChow = suit <= 2 && rank <= 6 && counts[first + 1] > 0 && counts[first + 2] > 0;
  if (canChow) {
    counts[first] -= 1;
    counts[first + 1] -= 1;
    counts[first + 2] -= 1;
    if (mahjongCanFormMelds(counts)) {
      counts[first] += 1;
      counts[first + 1] += 1;
      counts[first + 2] += 1;
      return true;
    }
    counts[first] += 1;
    counts[first + 1] += 1;
    counts[first + 2] += 1;
  }

  return false;
}

function mahjongIsStandardWin(hand: MahjongCell[]): boolean {
  if (hand.length !== 14) return false;
  const counts = mahjongCountTiles(hand);
  for (let pairTile = 0; pairTile < counts.length; pairTile += 1) {
    if (counts[pairTile] < 2) continue;
    counts[pairTile] -= 2;
    if (mahjongCanFormMelds(counts)) {
      counts[pairTile] += 2;
      return true;
    }
    counts[pairTile] += 2;
  }
  return false;
}

function mahjongIsSevenPairs(hand: MahjongCell[]): boolean {
  if (hand.length !== 14) return false;
  const counts = mahjongCountTiles(hand);
  let pairUnits = 0;
  for (let i = 0; i < counts.length; i += 1) {
    const count = counts[i];
    if (count % 2 !== 0) return false;
    pairUnits += count / 2;
  }
  return pairUnits === 7;
}

function mahjongIsThirteenOrphans(hand: MahjongCell[]): boolean {
  if (hand.length !== 14) return false;
  const counts = mahjongCountTiles(hand);
  let pairFound = false;

  for (let tile = 0; tile < MAHJONG_TYPE_COUNT; tile += 1) {
    const isOrphan = MAHJONG_ORPHAN_TILE_IDS.includes(tile as (typeof MAHJONG_ORPHAN_TILE_IDS)[number]);
    if (!isOrphan && counts[tile] > 0) return false;
  }

  for (const tile of MAHJONG_ORPHAN_TILE_IDS) {
    if (counts[tile] === 0) return false;
    if (counts[tile] >= 2) {
      if (pairFound) return false;
      pairFound = true;
    }
  }

  return pairFound;
}

function mahjongIsWinningHand(hand: MahjongCell[]): boolean {
  return mahjongIsStandardWin(hand) || mahjongIsSevenPairs(hand) || mahjongIsThirteenOrphans(hand);
}

function mahjongFindWinningTiles(hand: MahjongCell[]): MahjongCell[] {
  if (hand.length !== 13) return [];
  const counts = mahjongCountTiles(hand);
  const waits: MahjongCell[] = [];
  for (let tile = 0; tile < MAHJONG_TYPE_COUNT; tile += 1) {
    if (counts[tile] >= 4) continue;
    if (mahjongIsWinningHand([...hand, tile])) waits.push(tile);
  }
  return waits;
}

function mahjongFindBestDiscards(hand: MahjongCell[]): Array<{ index: number; tile: MahjongCell; waits: MahjongCell[]; outs: number }> {
  if (hand.length !== 14) return [];

  const results: Array<{ index: number; tile: MahjongCell; waits: MahjongCell[]; outs: number }> = [];
  const seenTile = new Set<number>();

  for (let index = 0; index < hand.length; index += 1) {
    const tile = hand[index];
    if (seenTile.has(tile)) continue;
    seenTile.add(tile);

    const nextHand = hand.filter((_, i) => i !== index);
    const waits = mahjongFindWinningTiles(nextHand);
    const nextCounts = mahjongCountTiles(nextHand);
    const outs = waits.reduce((sum, waitTile) => sum + Math.max(0, 4 - nextCounts[waitTile]), 0);
    results.push({ index, tile, waits, outs });
  }

  return results.sort((a, b) => {
    if (b.outs !== a.outs) return b.outs - a.outs;
    if (b.waits.length !== a.waits.length) return b.waits.length - a.waits.length;
    return a.tile - b.tile;
  });
}

function mahjongIsHonor(tile: MahjongCell): boolean {
  return tile >= 27;
}

function mahjongIsTerminal(tile: MahjongCell): boolean {
  if (mahjongIsHonor(tile)) return false;
  const rank = (tile % 9) + 1;
  return rank === 1 || rank === 9;
}

function mahjongIsTerminalOrHonor(tile: MahjongCell): boolean {
  return mahjongIsHonor(tile) || mahjongIsTerminal(tile);
}

function mahjongTileSuit(tile: MahjongCell): "m" | "p" | "s" | "z" {
  if (tile <= 8) return "m";
  if (tile <= 17) return "p";
  if (tile <= 26) return "s";
  return "z";
}

function mahjongExtractStandardPattern(hand: MahjongCell[]): { pairTile: MahjongCell; melds: MahjongMeld[] } | null {
  if (hand.length !== 14) return null;
  const counts = mahjongCountTiles(hand);

  const recurse = (work: number[], melds: MahjongMeld[]): MahjongMeld[] | null => {
    let first = -1;
    for (let i = 0; i < work.length; i += 1) {
      if (work[i] > 0) {
        first = i;
        break;
      }
    }
    if (first < 0) return melds;

    if (work[first] >= 3) {
      work[first] -= 3;
      const tripletResult = recurse(work, [...melds, { type: "triplet", tile: first }]);
      work[first] += 3;
      if (tripletResult) return tripletResult;
    }

    const suit = Math.floor(first / 9);
    const rank = first % 9;
    if (suit <= 2 && rank <= 6 && work[first + 1] > 0 && work[first + 2] > 0) {
      work[first] -= 1;
      work[first + 1] -= 1;
      work[first + 2] -= 1;
      const sequenceResult = recurse(work, [...melds, { type: "sequence", tile: first }]);
      work[first] += 1;
      work[first + 1] += 1;
      work[first + 2] += 1;
      if (sequenceResult) return sequenceResult;
    }

    return null;
  };

  for (let pairTile = 0; pairTile < counts.length; pairTile += 1) {
    if (counts[pairTile] < 2) continue;
    counts[pairTile] -= 2;
    const melds = recurse(counts, []);
    counts[pairTile] += 2;
    if (melds && melds.length === 4) {
      return { pairTile, melds };
    }
  }

  return null;
}

function mahjongEstimatePoint(han: number, fu: number, isYakuman: boolean): number {
  if (isYakuman) return 32000;
  if (han <= 0) return 0;

  const mangan = han >= 5 || (han === 4 && fu >= 40) || (han === 3 && fu >= 70);
  let basePoint: number;
  if (han >= 13) basePoint = 8000;
  else if (han >= 11) basePoint = 6000;
  else if (han >= 8) basePoint = 4000;
  else if (han >= 6) basePoint = 3000;
  else if (mangan) basePoint = 2000;
  else basePoint = fu * (2 ** (han + 2));

  return Math.ceil((basePoint * 4) / 100) * 100;
}

function mahjongSummarizeWin(hand: MahjongCell[]): MahjongWinSummary | null {
  if (!mahjongIsWinningHand(hand)) return null;

  const yakuKeys: Array<keyof typeof LOGIN_I18N.ja> = ["mahjongYakuMenzenTsumo"];

  if (mahjongIsThirteenOrphans(hand)) {
    yakuKeys.push("mahjongYakuKokushi");
    return {
      yakuKeys,
      han: 13,
      fu: 0,
      point: mahjongEstimatePoint(13, 0, true),
      isYakuman: true,
    };
  }

  if (mahjongIsSevenPairs(hand)) {
    let han = 3;
    yakuKeys.push("mahjongYakuChiitoitsu");

    const hasHonor = hand.some((tile) => mahjongIsHonor(tile));
    const suitSet = new Set(hand.filter((tile) => !mahjongIsHonor(tile)).map((tile) => mahjongTileSuit(tile)));
    if (!hasHonor && suitSet.size === 1) {
      han += 6;
      yakuKeys.push("mahjongYakuChinitsu");
    } else if (hasHonor && suitSet.size === 1) {
      han += 3;
      yakuKeys.push("mahjongYakuHonitsu");
    }

    return {
      yakuKeys,
      han,
      fu: 25,
      point: mahjongEstimatePoint(han, 25, false),
      isYakuman: false,
    };
  }

  const pattern = mahjongExtractStandardPattern(hand);
  if (!pattern) return null;

  let han = 1;

  const allSimple = hand.every((tile) => !mahjongIsTerminalOrHonor(tile));
  if (allSimple) {
    han += 1;
    yakuKeys.push("mahjongYakuTanyao");
  }

  const allTriplets = pattern.melds.every((meld) => meld.type === "triplet");
  if (allTriplets) {
    han += 2;
    yakuKeys.push("mahjongYakuToitoi");
  }

  const dragonTripletCount = pattern.melds.filter((meld) => meld.type === "triplet" && meld.tile >= 31 && meld.tile <= 33).length;
  for (let i = 0; i < dragonTripletCount; i += 1) {
    han += 1;
    yakuKeys.push("mahjongYakuYakuhai");
  }

  const hasHonor = hand.some((tile) => mahjongIsHonor(tile));
  const suitSet = new Set(hand.filter((tile) => !mahjongIsHonor(tile)).map((tile) => mahjongTileSuit(tile)));
  if (!hasHonor && suitSet.size === 1) {
    han += 6;
    yakuKeys.push("mahjongYakuChinitsu");
  } else if (hasHonor && suitSet.size === 1) {
    han += 3;
    yakuKeys.push("mahjongYakuHonitsu");
  }

  let fu = 20;
  fu += 2;
  if (pattern.pairTile >= 31 && pattern.pairTile <= 33) fu += 2;

  pattern.melds.forEach((meld) => {
    if (meld.type !== "triplet") return;
    fu += mahjongIsTerminalOrHonor(meld.tile) ? 8 : 4;
  });

  fu = Math.max(20, Math.ceil(fu / 10) * 10);

  return {
    yakuKeys,
    han,
    fu,
    point: mahjongEstimatePoint(han, fu, false),
    isYakuman: false,
  };
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
const OTHELLO_CHAOS_LIMIT_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;
const OTHELLO_CPU_THINK_DELAY_MAX_MS = 360;
const OTHELLO_CPU_SETTINGS: Record<
  OthelloCpuLevel,
  {
    thinkMs: number;
    randomRate: number;
    flipWeight: number;
    edgeWeight: number;
    cornerWeight: number;
    xPenalty: number;
    cPenalty: number;
    mobilityWeight: number;
    positionalWeight: number;
    searchDepth: number;
    maxBranches: number;
  }
> = {
  easy: {
    thinkMs: 220,
    randomRate: 0.62,
    flipWeight: 1,
    edgeWeight: 1,
    cornerWeight: 10,
    xPenalty: -4,
    cPenalty: -2,
    mobilityWeight: 0,
    positionalWeight: 0,
    searchDepth: 1,
    maxBranches: 8,
  },
  normal: {
    thinkMs: 420,
    randomRate: 0.22,
    flipWeight: 1.15,
    edgeWeight: 2,
    cornerWeight: 22,
    xPenalty: -10,
    cPenalty: -4,
    mobilityWeight: 1.4,
    positionalWeight: 0.45,
    searchDepth: 1,
    maxBranches: 10,
  },
  hard: {
    thinkMs: 1080,
    randomRate: 0.003,
    flipWeight: 1.4,
    edgeWeight: 4.6,
    cornerWeight: 56,
    xPenalty: -24,
    cPenalty: -12,
    mobilityWeight: 5.8,
    positionalWeight: 1.35,
    searchDepth: 4,
    maxBranches: 10,
  },
};
const OTHELLO_CPU_POSITION_WEIGHTS = [
  [40, -12, 10, 6, 6, 10, -12, 40],
  [-12, -18, -3, -3, -3, -3, -18, -12],
  [10, -3, 4, 2, 2, 4, -3, 10],
  [6, -3, 2, 1, 1, 2, -3, 6],
  [6, -3, 2, 1, 1, 2, -3, 6],
  [10, -3, 4, 2, 2, 4, -3, 10],
  [-12, -18, -3, -3, -3, -3, -18, -12],
  [40, -12, 10, 6, 6, 10, -12, 40],
] as const;
const CHESS_PIECE_VALUE: Record<ChessPieceType, number> = {
  K: 100,
  Q: 9,
  R: 5,
  B: 3,
  N: 3,
  P: 1,
};
const CHESS_CPU_THINK_MS: Record<ChessCpuLevel, number> = {
  easy: 220,
  normal: 360,
  hard: 520,
};
const GOMOKU_CPU_THINK_MS: Record<GomokuCpuLevel, number> = {
  easy: 180,
  normal: 280,
  hard: 420,
};
const SHOGI_PIECE_VALUE: Record<ShogiPieceType, number> = {
  K: 100,
  R: 9,
  B: 8,
  G: 6,
  S: 5,
  N: 4,
  L: 3,
  P: 1,
};
const SHOGI_CPU_THINK_MS: Record<ShogiCpuLevel, number> = {
  easy: 240,
  normal: 380,
  hard: 520,
};
const OTHELLO_OPENING_BOOK_PRIORITY = [
  [
    [2, 3],
    [3, 2],
    [4, 5],
    [5, 4],
  ],
  [
    [2, 4],
    [3, 5],
    [4, 2],
    [5, 3],
  ],
  [
    [2, 2],
    [2, 5],
    [5, 2],
    [5, 5],
  ],
  [
    [1, 2],
    [1, 5],
    [2, 1],
    [2, 6],
    [5, 1],
    [5, 6],
    [6, 2],
    [6, 5],
  ],
  [
    [2, 6],
    [6, 2],
    [1, 4],
    [4, 1],
    [3, 6],
    [6, 3],
  ],
] as const;
const STORAGE_CLOUD_USER_ID_KEY = "neon-cloud-user-id";
const STORAGE_CLOUD_PASSWORD_KEY = "neon-cloud-password";
const STORAGE_CLOUD_SESSION_ID_KEY = "neon-cloud-session-id";
const STORAGE_CLOUD_FRIEND_ID_KEY = "neon-cloud-friend-id";
const STORAGE_LANGUAGE_KEY = "neon-ui-language";
const STORAGE_MENU_TAB_OPEN_STATE_KEY = "neon-menu-tab-open-state";
const STORAGE_MENU_CARD_OPEN_STATE_KEY = "neon-menu-card-open-state";
const STORAGE_FIT_PUZZLE_PROGRESS_KEY = "neon-fit-puzzle-progress-v1";
const STORAGE_ROOM_CLIENT_ID_SESSION_KEY = "neon-room-client-id";
const CHINCHIRO_VISIBLE = false;
const CASINO_SHARED_BANK_STORAGE_KEY = "neon-casino-shared-bank-v1";
const DEFAULT_CASINO_BANKROLL = 1000;
const MIN_CASINO_BET = 10;
const CASINO_BET_STEP = 10;
const ROOM_SERVER_QUERY_PARAM_KEY = "roomServer";
const ROOM_CODE_QUERY_PARAM_KEY = "roomCode";
const ROOM_INVITE_TOKEN_QUERY_PARAM_KEY = "inviteToken";
const INQUIRY_ADMIN_USER_IDS = String(process.env.NEXT_PUBLIC_INQUIRY_ADMIN_USER_IDS || "admin,NullToufu")
  .split(",")
  .map((id) => id.trim().slice(0, 24))
  .filter(Boolean);
const APP_URL_TAG = "NeonBoardArcade";
const BLACKJACK_DEALER_REVEAL_DELAY_MS = 700;
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

function isLoopbackHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function clampCasinoBet(value: number, bankroll: number): number {
  const safeBankroll = Math.max(0, Math.floor(Number.isFinite(bankroll) ? bankroll : 0));
  const max = Math.max(MIN_CASINO_BET, Math.floor(safeBankroll / CASINO_BET_STEP) * CASINO_BET_STEP || MIN_CASINO_BET);
  const normalized = Math.floor(Number.isFinite(value) ? value : MIN_CASINO_BET);
  return Math.max(MIN_CASINO_BET, Math.min(max, Math.floor(normalized / CASINO_BET_STEP) * CASINO_BET_STEP));
}

function isBlackjack(cards: BlackjackCard[]): boolean {
  return Array.isArray(cards) && cards.length === 2 && blackjackHandValue(cards) === 21;
}

function parseIntSafe(raw: unknown, fallback = 0): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.floor(n);
}

function normalizeFitPuzzleProgress(raw: unknown): FitPuzzleProgress | null {
  if (!raw || typeof raw !== "object") return null;
  const src = raw as Record<string, unknown>;

  const normalizeStage = (stage: unknown): FitPuzzleCustomStage | null => {
    if (!stage || typeof stage !== "object") return null;
    const row = stage as Record<string, unknown>;
    const rows = Math.max(4, Math.min(12, parseIntSafe(row.rows, 10)));
    const cols = Math.max(4, Math.min(12, parseIntSafe(row.cols, 10)));
    const maxCells = rows * cols;
    const pieceCount = Math.max(2, Math.min(maxCells, parseIntSafe(row.pieceCount, Math.max(2, Math.floor(maxCells / 2)))));
    const title = String(row.title || "").trim().slice(0, 40) || "カスタム";
    const profileRaw = row.profile && typeof row.profile === "object" ? row.profile as Record<string, unknown> : {};
    const bias = profileRaw.bias === "long" || profileRaw.bias === "blocks" ? profileRaw.bias : "balanced";
    const openingRotation = row.openingRotation === "mostly-rotated" ? "mostly-rotated" : "mixed";
    return {
      rows,
      cols,
      pieceCount,
      title,
      profile: {
        bias,
        mutationSteps: Math.max(0, Math.min(20000, parseIntSafe(profileRaw.mutationSteps, rows * cols * 6))),
        minComplex: Math.max(0, Math.min(200, parseIntSafe(profileRaw.minComplex, 0))),
        minBranch: Math.max(0, Math.min(200, parseIntSafe(profileRaw.minBranch, 0))),
      },
      openingRotation,
      assistLimit: Math.max(0, Math.min(10, parseIntSafe(row.assistLimit, 0))),
      seed: Math.max(1, parseIntSafe(row.seed, 1)),
    };
  };

  const customStages = Array.isArray(src.customStages)
    ? src.customStages.map((stage) => normalizeStage(stage)).filter(Boolean) as FitPuzzleCustomStage[]
    : [];

  return {
    highestUnlockedStage: Math.max(0, parseIntSafe(src.highestUnlockedStage, 0)),
    selectedStageIndex: Math.max(0, parseIntSafe(src.selectedStageIndex, 0)),
    difficulty: src.difficulty === "easy" || src.difficulty === "hard" ? src.difficulty : "normal",
    noRotateMode: Boolean(src.noRotateMode),
    customStages,
    updatedAt: typeof src.updatedAt === "string" && src.updatedAt.trim() ? src.updatedAt.trim().slice(0, 64) : null,
  };
}

function cloudFitPuzzleProgressStorageKey(userIdRaw: string): string {
  const userId = String(userIdRaw || "").trim().slice(0, 24) || "anonymous";
  return `${STORAGE_FIT_PUZZLE_PROGRESS_KEY}:cloud:${userId}`;
}

function readFitPuzzleProgressFromStorage(key: string): FitPuzzleProgress | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return normalizeFitPuzzleProgress(JSON.parse(raw));
  } catch {
    return null;
  }
}

function getAutoRoomServerUrl(): string {
  if (typeof window === "undefined") {
    return "ws://127.0.0.1:8788";
  }
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const host = window.location.host || "127.0.0.1:3000";
  const hostname = window.location.hostname || "127.0.0.1";
  if (isLoopbackHost(hostname)) {
    // Use IPv4 loopback explicitly to avoid ::1 resolution mismatches.
    return `${protocol}://127.0.0.1:8788`;
  }
  // For LAN access (e.g. http://192.168.x.x:3000), target the same host on room port.
  if (window.location.port === "3000" || window.location.port === "5173") {
    return `${protocol}://${hostname}:8788`;
  }
  return `${protocol}://${host}/room`;
}

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

function isOthelloEdge(row: number, col: number): boolean {
  return row === 0 || row === BOARD_SIZE - 1 || col === 0 || col === BOARD_SIZE - 1;
}

function isOthelloXSquare(row: number, col: number): boolean {
  return (row === 1 || row === BOARD_SIZE - 2) && (col === 1 || col === BOARD_SIZE - 2);
}

function isOthelloCSquare(row: number, col: number): boolean {
  const max = BOARD_SIZE - 1;
  return (
    (row === 0 && (col === 1 || col === max - 1))
    || (row === max && (col === 1 || col === max - 1))
    || (col === 0 && (row === 1 || row === max - 1))
    || (col === max && (row === 1 || row === max - 1))
  );
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

function getOthelloLegalMoves(
  board: Cell[][],
  player: 1 | 2,
  options: {
    isChaosMode: boolean;
    brokenMask: boolean[][];
    fixedMask: boolean[][];
    overwriteRemaining: [number, number];
  },
): Array<{ row: number; col: number }> {
  const moves: Array<{ row: number; col: number }> = [];
  const enemy: 1 | 2 = player === 1 ? 2 : 1;
  const playerIndex = othelloPlayerIndex(player);
  const canOverwrite = (options.overwriteRemaining[playerIndex] ?? 0) > 0;
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (options.brokenMask[row][col]) continue;
      const cell = board[row][col];
      const flips = getFlips(board, row, col, player);
      if (flips.length > 0) {
        moves.push({ row, col });
        continue;
      }
      if (options.isChaosMode && canOverwrite && cell === enemy && !options.fixedMask[row][col]) {
        const temp = board.map((line) => [...line]);
        temp[row][col] = 0;
        const chaosFlips = getFlips(temp, row, col, player);
        if (chaosFlips.length > 0) {
          moves.push({ row, col });
        }
      }
    }
  }
  return moves;
}

function applyOthelloMoveForSearch(
  board: Cell[][],
  player: 1 | 2,
  move: { row: number; col: number },
  options: {
    isChaosMode: boolean;
    fixedMask: boolean[][];
    overwriteRemaining: [number, number];
  },
): Cell[][] | null {
  const { row, col } = move;
  const enemy: 1 | 2 = player === 1 ? 2 : 1;
  const playerIndex = othelloPlayerIndex(player);
  const cell = board[row][col];
  const canOverwrite =
    options.isChaosMode
    && (options.overwriteRemaining[playerIndex] ?? 0) > 0
    && cell === enemy
    && !options.fixedMask[row][col];

  let flips = getFlips(board, row, col, player);
  if (cell !== 0 && canOverwrite) {
    const temp = board.map((line) => [...line]);
    temp[row][col] = 0;
    flips = getFlips(temp, row, col, player);
  }
  if (flips.length === 0 && !canOverwrite) return null;

  const nextBoard = board.map((line) => [...line]);
  nextBoard[row][col] = player;
  for (const [r, c] of flips) {
    nextBoard[r][c] = player;
  }
  return nextBoard;
}

function evaluateOthelloMoveScore(
  board: Cell[][],
  player: 1 | 2,
  move: { row: number; col: number },
  level: OthelloCpuLevel,
  options: {
    isChaosMode: boolean;
    fixedMask: boolean[][];
    overwriteRemaining: [number, number];
    brokenMask: boolean[][];
  },
): { score: number; nextBoard: Cell[][] } | null {
  const setting = OTHELLO_CPU_SETTINGS[level];
  const enemy: 1 | 2 = player === 1 ? 2 : 1;
  const { row, col } = move;
  const nextBoard = applyOthelloMoveForSearch(board, player, move, options);
  if (!nextBoard) return null;

  const ownCount = countStones(nextBoard)[player === 1 ? "black" : "white"];
  const enemyCount = countStones(nextBoard)[enemy === 1 ? "black" : "white"];
  const enemyMobility = getOthelloLegalMoves(nextBoard, enemy, {
    isChaosMode: options.isChaosMode,
    brokenMask: options.brokenMask,
    fixedMask: options.fixedMask,
    overwriteRemaining: options.overwriteRemaining,
  }).length;
  const posWeight = OTHELLO_CPU_POSITION_WEIGHTS[row][col] ?? 0;
  const flips = getFlips(board, row, col, player).length;

  let score = flips * setting.flipWeight;
  if (isOthelloEdge(row, col)) score += setting.edgeWeight;
  if (isOthelloCorner(row, col)) score += setting.cornerWeight;
  if (isOthelloXSquare(row, col)) score += setting.xPenalty;
  if (isOthelloCSquare(row, col)) score += setting.cPenalty;
  score += posWeight * setting.positionalWeight;
  score -= enemyMobility * setting.mobilityWeight;
  score += (ownCount - enemyCount) * 0.25;

  return { score, nextBoard };
}

function evaluateOthelloBoardScore(
  board: Cell[][],
  aiPlayer: 1 | 2,
  level: OthelloCpuLevel,
  options: {
    isChaosMode: boolean;
    brokenMask: boolean[][];
    fixedMask: boolean[][];
    overwriteRemaining: [number, number];
  },
): number {
  const setting = OTHELLO_CPU_SETTINGS[level];
  const enemy: 1 | 2 = aiPlayer === 1 ? 2 : 1;
  const counts = countStones(board);
  const aiCount = aiPlayer === 1 ? counts.black : counts.white;
  const enemyCount = enemy === 1 ? counts.black : counts.white;

  let positional = 0;
  let cornerDiff = 0;
  let edgeDiff = 0;
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const cell = board[row][col];
      if (cell === 0) continue;
      const sign = cell === aiPlayer ? 1 : -1;
      positional += (OTHELLO_CPU_POSITION_WEIGHTS[row][col] ?? 0) * sign;
      if (isOthelloCorner(row, col)) cornerDiff += sign;
      if (isOthelloEdge(row, col)) edgeDiff += sign;
    }
  }

  const aiMobility = getOthelloLegalMoves(board, aiPlayer, options).length;
  const enemyMobility = getOthelloLegalMoves(board, enemy, options).length;
  const mobilityDiff = aiMobility - enemyMobility;

  return (
    (aiCount - enemyCount) * 0.8
    + cornerDiff * setting.cornerWeight * 0.7
    + edgeDiff * setting.edgeWeight * 0.45
    + positional * setting.positionalWeight
    + mobilityDiff * setting.mobilityWeight
  );
}

function minimaxOthello(
  board: Cell[][],
  playerToMove: 1 | 2,
  aiPlayer: 1 | 2,
  depth: number,
  alpha: number,
  beta: number,
  level: OthelloCpuLevel,
  options: {
    isChaosMode: boolean;
    brokenMask: boolean[][];
    fixedMask: boolean[][];
    overwriteRemaining: [number, number];
  },
): number {
  const enemy: 1 | 2 = playerToMove === 1 ? 2 : 1;
  const moves = getOthelloLegalMoves(board, playerToMove, options);
  const enemyMoves = getOthelloLegalMoves(board, enemy, options);

  if (depth <= 0 || (moves.length === 0 && enemyMoves.length === 0)) {
    if (moves.length === 0 && enemyMoves.length === 0) {
      const counts = countStones(board);
      const aiCount = aiPlayer === 1 ? counts.black : counts.white;
      const oppCount = aiPlayer === 1 ? counts.white : counts.black;
      return (aiCount - oppCount) * 1000;
    }
    return evaluateOthelloBoardScore(board, aiPlayer, level, options);
  }

  if (moves.length === 0) {
    return minimaxOthello(board, enemy, aiPlayer, depth - 1, alpha, beta, level, options);
  }

  const setting = OTHELLO_CPU_SETTINGS[level];
  const ordered = moves
    .map((move) => {
      const evalMove = evaluateOthelloMoveScore(board, playerToMove, move, level, options);
      return evalMove ? { move, score: evalMove.score, nextBoard: evalMove.nextBoard } : null;
    })
    .filter((item): item is { move: { row: number; col: number }; score: number; nextBoard: Cell[][] } => Boolean(item))
    .sort((a, b) => b.score - a.score)
    .slice(0, setting.maxBranches);

  if (playerToMove === aiPlayer) {
    let best = -Infinity;
    for (const item of ordered) {
      const value = minimaxOthello(item.nextBoard, enemy, aiPlayer, depth - 1, alpha, beta, level, options);
      if (value > best) best = value;
      if (best > alpha) alpha = best;
      if (beta <= alpha) break;
    }
    return best;
  }

  let best = Infinity;
  for (const item of ordered) {
    const value = minimaxOthello(item.nextBoard, enemy, aiPlayer, depth - 1, alpha, beta, level, options);
    if (value < best) best = value;
    if (best < beta) beta = best;
    if (beta <= alpha) break;
  }
  return best;
}

function pickImmediateWipeMove(
  board: Cell[][],
  player: 1 | 2,
  legalMoves: Array<{ row: number; col: number }>,
  options: {
    isChaosMode: boolean;
    fixedMask: boolean[][];
    overwriteRemaining: [number, number];
  },
): { row: number; col: number } | null {
  const enemy: 1 | 2 = player === 1 ? 2 : 1;
  let best: { row: number; col: number; flips: number } | null = null;

  for (const move of legalMoves) {
    const next = applyOthelloMoveForSearch(board, player, move, options);
    if (!next) continue;
    const counts = countStones(next);
    const enemyCount = enemy === 1 ? counts.black : counts.white;
    if (enemyCount !== 0) continue;
    const flips = getFlips(board, move.row, move.col, player).length;
    if (!best || flips > best.flips || (flips === best.flips && isOthelloCorner(move.row, move.col))) {
      best = { row: move.row, col: move.col, flips };
    }
  }

  return best ? { row: best.row, col: best.col } : null;
}

function pickOpeningBookMove(
  board: Cell[][],
  legalMoves: Array<{ row: number; col: number }>,
): { row: number; col: number } | null {
  if (legalMoves.length === 0) return null;
  const counts = countStones(board);
  const ply = Math.max(0, counts.black + counts.white - 4);
  const maxPly = 14;
  if (ply > maxPly) return null;

  const cornerMove = legalMoves.find((move) => isOthelloCorner(move.row, move.col));
  if (cornerMove) return cornerMove;

  const band = OTHELLO_OPENING_BOOK_PRIORITY[Math.min(OTHELLO_OPENING_BOOK_PRIORITY.length - 1, Math.floor(ply / 3))];
  if (!band) return null;
  const moveMap = new Map(legalMoves.map((move) => [`${move.row}-${move.col}`, move]));
  for (const [row, col] of band) {
    const found = moveMap.get(`${row}-${col}`);
    if (found) return found;
  }
  return null;
}

function pickOthelloCpuMove(
  board: Cell[][],
  player: 1 | 2,
  legalMoves: Array<{ row: number; col: number }>,
  level: OthelloCpuLevel,
  options: {
    isChaosMode: boolean;
    brokenMask: boolean[][];
    fixedMask: boolean[][];
    overwriteRemaining: [number, number];
  },
): { row: number; col: number } | null {
  if (legalMoves.length === 0) return null;
  const setting = OTHELLO_CPU_SETTINGS[level];

  const immediateWipe = pickImmediateWipeMove(board, player, legalMoves, {
    isChaosMode: options.isChaosMode,
    fixedMask: options.fixedMask,
    overwriteRemaining: options.overwriteRemaining,
  });
  if (immediateWipe) return immediateWipe;

  if (level === "hard") {
    const openingBook = pickOpeningBookMove(board, legalMoves);
    if (openingBook) return openingBook;
  }

  if (Math.random() < setting.randomRate) {
    return legalMoves[Math.floor(Math.random() * legalMoves.length)] ?? null;
  }

  const scored = legalMoves
    .map((move) => {
      const evalMove = evaluateOthelloMoveScore(board, player, move, level, options);
      return evalMove ? { move, score: evalMove.score, nextBoard: evalMove.nextBoard } : null;
    })
    .filter((item): item is { move: { row: number; col: number }; score: number; nextBoard: Cell[][] } => Boolean(item))
    .sort((a, b) => b.score - a.score)
    .slice(0, setting.maxBranches);
  if (scored.length === 0) {
    return legalMoves[Math.floor(Math.random() * legalMoves.length)] ?? null;
  }

  if (setting.searchDepth <= 1) {
    const bestScore = scored[0]?.score ?? 0;
    const candidates = scored.filter((item) => item.score >= bestScore - 2).map((item) => item.move);
    return candidates[Math.floor(Math.random() * candidates.length)] ?? scored[0]?.move ?? null;
  }

  const enemy: 1 | 2 = player === 1 ? 2 : 1;
  let bestValue = -Infinity;
  const bestMoves: Array<{ row: number; col: number }> = [];
  for (const item of scored) {
    const value = minimaxOthello(item.nextBoard, enemy, player, setting.searchDepth - 1, -Infinity, Infinity, level, options);
    if (value > bestValue) {
      bestValue = value;
      bestMoves.length = 0;
      bestMoves.push(item.move);
    } else if (value === bestValue) {
      bestMoves.push(item.move);
    }
  }
  return bestMoves[Math.floor(Math.random() * bestMoves.length)] ?? scored[0].move;
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

function gomokuLongestLineAt(board: Cell[][], row: number, col: number, player: 1 | 2): number {
  const dirs = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ] as const;

  let best = 1;
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
    if (count > best) best = count;
  }
  return best;
}

function gomokuHasNeighbor(board: Cell[][], row: number, col: number): boolean {
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (!inGomokuBounds(nr, nc)) continue;
      if (board[nr][nc] !== 0) return true;
    }
  }
  return false;
}

function pickGomokuCpuMove(board: Cell[][], player: 1 | 2, level: GomokuCpuLevel): { row: number; col: number } | null {
  const enemy: 1 | 2 = player === 1 ? 2 : 1;
  const occupied = board.some((line) => line.some((cell) => cell !== 0));
  const center = Math.floor(GOMOKU_SIZE / 2);

  const candidates: Array<{ row: number; col: number }> = [];
  for (let row = 0; row < GOMOKU_SIZE; row += 1) {
    for (let col = 0; col < GOMOKU_SIZE; col += 1) {
      if (board[row][col] !== 0) continue;
      if (!occupied || gomokuHasNeighbor(board, row, col)) {
        candidates.push({ row, col });
      }
    }
  }
  if (candidates.length === 0) return null;

  if (!occupied) {
    return { row: center, col: center };
  }

  if (level === "easy") {
    return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
  }

  let bestScore = -Infinity;
  const bestMoves: Array<{ row: number; col: number }> = [];

  for (const move of candidates) {
    const next = board.map((line) => [...line]);
    next[move.row][move.col] = player;

    if (hasFiveInRow(next, move.row, move.col, player)) {
      return move;
    }

    const blockBoard = board.map((line) => [...line]);
    blockBoard[move.row][move.col] = enemy;
    const blocksWin = hasFiveInRow(blockBoard, move.row, move.col, enemy);

    const myLine = gomokuLongestLineAt(next, move.row, move.col, player);
    const centerDistance = Math.abs(center - move.row) + Math.abs(center - move.col);
    const centerScore = Math.max(0, 14 - centerDistance);
    const levelBonus = level === "hard" ? 1.2 : 1;
    const blockScore = blocksWin ? 500 : 0;
    const total = blockScore + myLine * 30 * levelBonus + centerScore + Math.random() * (level === "hard" ? 0.5 : 2.2);

    if (total > bestScore) {
      bestScore = total;
      bestMoves.length = 0;
      bestMoves.push(move);
    } else if (total === bestScore) {
      bestMoves.push(move);
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)] ?? candidates[0] ?? null;
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

function collectLegalChessMoves(board: Array<Array<ChessPiece | null>>, turn: ChessColor) {
  const moves: Array<{ fromRow: number; fromCol: number; toRow: number; toCol: number; capture: ChessPiece | null }> = [];
  for (let fromRow = 0; fromRow < 8; fromRow += 1) {
    for (let fromCol = 0; fromCol < 8; fromCol += 1) {
      const piece = board[fromRow][fromCol];
      if (!piece || piece.color !== turn) continue;

      for (let toRow = 0; toRow < 8; toRow += 1) {
        for (let toCol = 0; toCol < 8; toCol += 1) {
          if (!isLegalChessMove(board, fromRow, fromCol, toRow, toCol, turn)) continue;
          moves.push({
            fromRow,
            fromCol,
            toRow,
            toCol,
            capture: board[toRow][toCol],
          });
        }
      }
    }
  }
  return moves;
}

function pickChessCpuMove(
  board: Array<Array<ChessPiece | null>>,
  turn: ChessColor,
  level: ChessCpuLevel,
) {
  const legal = collectLegalChessMoves(board, turn);
  if (legal.length === 0) return null;

  if (level === "easy") {
    return legal[Math.floor(Math.random() * legal.length)] ?? null;
  }

  const scored = legal.map((move) => {
    const mover = board[move.fromRow][move.fromCol];
    const captureScore = move.capture ? CHESS_PIECE_VALUE[move.capture.type] * 10 : 0;
    const centerDistance = Math.abs(3.5 - move.toRow) + Math.abs(3.5 - move.toCol);
    const centerScore = Math.max(0, 7 - centerDistance);
    const promotionScore = mover?.type === "P" && (move.toRow === 0 || move.toRow === 7) ? 12 : 0;
    const aggression = level === "hard" && move.capture ? CHESS_PIECE_VALUE[move.capture.type] : 0;
    const noise = Math.random() * (level === "normal" ? 1.8 : 0.8);
    const total = captureScore + centerScore + promotionScore + aggression + noise;
    return { move, total };
  });

  scored.sort((a, b) => b.total - a.total);
  return scored[0]?.move ?? null;
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

function collectLegalShogiMoves(board: Array<Array<ShogiPiece | null>>, turn: ShogiColor) {
  const moves: Array<{ fromRow: number; fromCol: number; toRow: number; toCol: number; capture: ShogiPiece | null }> = [];
  for (let fromRow = 0; fromRow < 9; fromRow += 1) {
    for (let fromCol = 0; fromCol < 9; fromCol += 1) {
      const piece = board[fromRow][fromCol];
      if (!piece || piece.color !== turn) continue;

      for (let toRow = 0; toRow < 9; toRow += 1) {
        for (let toCol = 0; toCol < 9; toCol += 1) {
          if (!isLegalShogiMove(board, fromRow, fromCol, toRow, toCol, turn)) continue;
          moves.push({
            fromRow,
            fromCol,
            toRow,
            toCol,
            capture: board[toRow][toCol],
          });
        }
      }
    }
  }
  return moves;
}

function pickShogiCpuMove(
  board: Array<Array<ShogiPiece | null>>,
  turn: ShogiColor,
  level: ShogiCpuLevel,
) {
  const legal = collectLegalShogiMoves(board, turn);
  if (legal.length === 0) return null;

  if (level === "easy") {
    return legal[Math.floor(Math.random() * legal.length)] ?? null;
  }

  const scored = legal.map((move) => {
    const mover = board[move.fromRow][move.fromCol];
    const captureScore = move.capture ? SHOGI_PIECE_VALUE[move.capture.type] * 10 : 0;
    const centerDistance = Math.abs(4 - move.toRow) + Math.abs(4 - move.toCol);
    const centerScore = Math.max(0, 8 - centerDistance);
    const forwardGain = turn === "b" ? move.fromRow - move.toRow : move.toRow - move.fromRow;
    const forwardScore = Math.max(0, forwardGain) * (mover?.type === "P" ? 2.5 : 1.2);
    const kingPressure = move.capture?.type === "K" ? 1000 : 0;
    const aggression = level === "hard" && move.capture ? SHOGI_PIECE_VALUE[move.capture.type] : 0;
    const noise = Math.random() * (level === "normal" ? 1.8 : 1.0);
    const total = captureScore + centerScore + forwardScore + kingPressure + aggression + noise;
    return { move, total };
  });

  scored.sort((a, b) => b.total - a.total);
  return scored[0]?.move ?? null;
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

function normalizeNumeronDigitCount(value: unknown): NumeronDigitCount {
  return value === 4 || value === "4" ? 4 : 3;
}

function isValidNumeronCode(value: string, digitCount: NumeronDigitCount): boolean {
  const re = new RegExp(`^\\d{${digitCount}}$`);
  return re.test(value) && new Set(value.split("")).size === digitCount;
}

function sanitizeNumeronSecretInput(value: string, digitCount: NumeronDigitCount): string {
  const digits = value.replace(/\D/g, "").split("");
  const unique: string[] = [];
  for (let i = 0; i < digits.length; i += 1) {
    const digit = digits[i];
    if (unique.includes(digit)) continue;
    unique.push(digit);
    if (unique.length >= digitCount) break;
  }
  return unique.join("");
}

function normalizeNumeronDigitDraft(value: unknown, digitCount: NumeronDigitCount): string[] {
  if (Array.isArray(value)) {
    const packed = value.filter((digit): digit is string => typeof digit === "string").join("");
    return sanitizeNumeronSecretInput(packed, digitCount).split("");
  }
  if (typeof value === "string") {
    return sanitizeNumeronSecretInput(value, digitCount).split("");
  }
  return [];
}

function createNumeronAllCodes(digitCount: NumeronDigitCount): string[] {
  const all: string[] = [];
  const used = new Set<number>();
  const draft: number[] = [];

  const visit = () => {
    if (draft.length >= digitCount) {
      all.push(draft.join(""));
      return;
    }
    for (let digit = 0; digit <= 9; digit += 1) {
      if (used.has(digit)) continue;
      used.add(digit);
      draft.push(digit);
      visit();
      draft.pop();
      used.delete(digit);
    }
  };

  visit();
  return all;
}

function buildNumeronCandidates(history: NumeronHistory[], digitCount: NumeronDigitCount): string[] {
  let candidates = createNumeronAllCodes(digitCount);
  history.forEach((entry) => {
    candidates = candidates.filter((code) => {
      const result = evaluateNumeron(code, entry.guess);
      return result.hits === entry.hits && result.blows === entry.blows;
    });
  });
  return candidates;
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

function evaluatePokerFiveCard(cards: PokerCard[]): PokerEval {
  if (cards.length < 5) {
    return { score: [0], name: "highCard" };
  }

  const picked = cards.slice(0, 5);
  const ranks = picked.map((card) => card.rank);
  const ranksDesc = [...ranks].sort((a, b) => b - a);
  const rankCountMap = new Map<number, number>();
  ranks.forEach((rank) => {
    rankCountMap.set(rank, (rankCountMap.get(rank) || 0) + 1);
  });

  const rankCounts = [...rankCountMap.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return b[0] - a[0];
  });

  const isFlush = picked.every((card) => card.suit === picked[0]?.suit);
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

function evaluatePokerHand(cards: PokerCard[]): PokerEval {
  if (cards.length === 2) {
    const [a, b] = cards;
    if (a && b && a.rank === b.rank) {
      return { score: [1, a.rank], name: "onePair" };
    }
    const high = Math.max(a?.rank || 0, b?.rank || 0);
    const low = Math.min(a?.rank || 0, b?.rank || 0);
    return { score: [0, high, low], name: "highCard" };
  }

  return evaluatePokerFiveCard(cards);
}

function evaluatePokerBestOfSeven(cards: PokerCard[]): PokerEval {
  if (cards.length <= 5) return evaluatePokerHand(cards);

  let best: PokerEval | null = null;
  const total = cards.length;
  for (let a = 0; a < total - 4; a += 1) {
    for (let b = a + 1; b < total - 3; b += 1) {
      for (let c = b + 1; c < total - 2; c += 1) {
        for (let d = c + 1; d < total - 1; d += 1) {
          for (let e = d + 1; e < total; e += 1) {
            const current = evaluatePokerFiveCard([cards[a], cards[b], cards[c], cards[d], cards[e]]);
            if (!best || comparePokerEval(current, best) > 0) best = current;
          }
        }
      }
    }
  }

  return best || { score: [0], name: "highCard" };
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
  const [message, setMessage] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [game, setGame] = useState("othello");
  const [score, setScore] = useState(100);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [isScoreSaving, setIsScoreSaving] = useState(false);
  const [isScoreLoading, setIsScoreLoading] = useState(false);
  const [board, setBoard] = useState<Cell[][]>(() => createInitialBoard());
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [othelloMode, setOthelloMode] = useState<OthelloMode>("cpu");
  const [othelloCpuLevel, setOthelloCpuLevel] = useState<OthelloCpuLevel>("normal");
  const [othelloTurnOrder, setOthelloTurnOrder] = useState<OthelloTurnOrder>("black");
  const [othelloPlayerSide, setOthelloPlayerSide] = useState<1 | 2>(1);
  const [othelloChaosTarget, setOthelloChaosTarget] = useState<OthelloChaosTarget>("none");
  const [othelloChaosHandicap, setOthelloChaosHandicap] = useState<OthelloChaosHandicap>("none");
  const [othelloChaosRandomLineIgnore, setOthelloChaosRandomLineIgnore] = useState<OthelloChaosToggle>("off");
  const [othelloChaosOverwriteLimit, setOthelloChaosOverwriteLimit] = useState(3);
  const [othelloChaosBothBlackHandicap, setOthelloChaosBothBlackHandicap] = useState<OthelloChaosHandicap>("none");
  const [othelloChaosBothWhiteHandicap, setOthelloChaosBothWhiteHandicap] = useState<OthelloChaosHandicap>("none");
  const [othelloChaosBothBlackOverwriteLimit, setOthelloChaosBothBlackOverwriteLimit] = useState(3);
  const [othelloChaosBothWhiteOverwriteLimit, setOthelloChaosBothWhiteOverwriteLimit] = useState(3);
  const [othelloChaosDestroyLimitBlack, setOthelloChaosDestroyLimitBlack] = useState(1);
  const [othelloChaosDestroyLimitWhite, setOthelloChaosDestroyLimitWhite] = useState(1);
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
  const [gomokuMode, setGomokuMode] = useState<GomokuMode>("local");
  const [gomokuCpuLevel, setGomokuCpuLevel] = useState<GomokuCpuLevel>("normal");
  const [gomokuTurnOrder, setGomokuTurnOrder] = useState<GomokuTurnOrder>("black");
  const [gomokuPlayerSide, setGomokuPlayerSide] = useState<1 | 2>(1);
  const [gomokuPlayer, setGomokuPlayer] = useState<1 | 2>(1);
  const [gomokuMessage, setGomokuMessage] = useState<string>(LOGIN_I18N.ja.gomokuTurnBlack);
  const [isGomokuOver, setIsGomokuOver] = useState(false);
  const [chessBoard, setChessBoard] = useState<Array<Array<ChessPiece | null>>>(() => createChessBoard());
  const [chessMode, setChessMode] = useState<ChessMode>("local");
  const [chessCpuLevel, setChessCpuLevel] = useState<ChessCpuLevel>("normal");
  const [chessTurnOrder, setChessTurnOrder] = useState<ChessTurnOrder>("white");
  const [chessPlayerSide, setChessPlayerSide] = useState<ChessColor>("w");
  const [chessTurn, setChessTurn] = useState<ChessColor>("w");
  const [selectedChess, setSelectedChess] = useState<{ row: number; col: number } | null>(null);
  const [chessMessage, setChessMessage] = useState<string>(LOGIN_I18N.ja.chessTurnWhite);
  const [isChessOver, setIsChessOver] = useState(false);
  const chessMoveTargets = useMemo(() => {
    const targets = new Map<string, { capture: boolean }>();
    if (!selectedChess) return targets;

    const selectedPiece = chessBoard[selectedChess.row]?.[selectedChess.col];
    if (!selectedPiece || selectedPiece.color !== chessTurn) return targets;

    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        if (!isLegalChessMove(chessBoard, selectedChess.row, selectedChess.col, row, col, chessTurn)) continue;
        const targetPiece = chessBoard[row][col];
        targets.set(`${row}-${col}`, {
          capture: Boolean(targetPiece && targetPiece.color !== selectedPiece.color),
        });
      }
    }

    return targets;
  }, [chessBoard, selectedChess, chessTurn]);
  const [shogiBoard, setShogiBoard] = useState<Array<Array<ShogiPiece | null>>>(() => createShogiBoard());
  const [shogiMode, setShogiMode] = useState<ShogiMode>("local");
  const [shogiCpuLevel, setShogiCpuLevel] = useState<ShogiCpuLevel>("normal");
  const [shogiTurnOrder, setShogiTurnOrder] = useState<ShogiTurnOrder>("black");
  const [shogiPlayerSide, setShogiPlayerSide] = useState<ShogiColor>("b");
  const [shogiTurn, setShogiTurn] = useState<ShogiColor>("b");
  const [selectedShogi, setSelectedShogi] = useState<{ row: number; col: number } | null>(null);
  const shogiMoveTargets = useMemo(() => {
    const targets = new Map<string, { capture: boolean }>();
    if (!selectedShogi) return targets;

    const selectedPiece = shogiBoard[selectedShogi.row]?.[selectedShogi.col];
    if (!selectedPiece || selectedPiece.color !== shogiTurn) return targets;

    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        if (!isLegalShogiMove(shogiBoard, selectedShogi.row, selectedShogi.col, row, col, shogiTurn)) continue;
        const targetPiece = shogiBoard[row][col];
        targets.set(`${row}-${col}`, {
          capture: Boolean(targetPiece && targetPiece.color !== selectedPiece.color),
        });
      }
    }

    return targets;
  }, [selectedShogi, shogiBoard, shogiTurn]);
  const [shogiMessage, setShogiMessage] = useState<string>(LOGIN_I18N.ja.shogiTurnBlack);
  const [isShogiOver, setIsShogiOver] = useState(false);
  const [mineBoard, setMineBoard] = useState<MineCell[][]>(() => createMinesweeperBoard());
  const [mineMessage, setMineMessage] = useState<string>(LOGIN_I18N.ja.minesHint);
  const [isMineOver, setIsMineOver] = useState(false);
  const [numeronSecret, setNumeronSecret] = useState(() => createNumeronSecret());
  const [numeronDigitCount, setNumeronDigitCount] = useState<NumeronDigitCount>(3);
  const [numeronSecretDraft, setNumeronSecretDraft] = useState<string[]>([]);
  const [isNumeronSecretConfirmed, setIsNumeronSecretConfirmed] = useState(false);
  const [isNumeronSecretPanelOpen, setIsNumeronSecretPanelOpen] = useState(true);
  const [numeronDraft, setNumeronDraft] = useState<string[]>([]);
  const [numeronHistory, setNumeronHistory] = useState<NumeronHistory[]>([]);
  const [numeronEnemyHistory, setNumeronEnemyHistory] = useState<NumeronHistory[]>([]);
  const [isNumeronEnemyHistoryOpen, setIsNumeronEnemyHistoryOpen] = useState(false);
  const [numeronPendingItem, setNumeronPendingItem] = useState<"highlow" | "reveal" | null>(null);
  const [numeronHintDigit, setNumeronHintDigit] = useState("5");
  const [numeronAssistCharges, setNumeronAssistCharges] = useState<{ highlow: number; reveal: number }>({ highlow: 1, reveal: 1 });
  const [isNumeronOver, setIsNumeronOver] = useState(false);
  const [numeronMessage, setNumeronMessage] = useState<string>(LOGIN_I18N.ja.numeronHint);
  const [blackjackDeck, setBlackjackDeck] = useState<BlackjackCard[]>([]);
  const [blackjackPlayerHand, setBlackjackPlayerHand] = useState<BlackjackCard[]>([]);
  const [blackjackDealerHand, setBlackjackDealerHand] = useState<BlackjackCard[]>([]);
  const [blackjackBet, setBlackjackBet] = useState(MIN_CASINO_BET);
  const [blackjackWager, setBlackjackWager] = useState(0);
  const [blackjackMessage, setBlackjackMessage] = useState<string>(LOGIN_I18N.ja.blackjackYourTurn);
  const [isBlackjackOver, setIsBlackjackOver] = useState(false);
  const [isBlackjackDealerResolving, setIsBlackjackDealerResolving] = useState(false);
  const [chinchiroPlayerDice, setChinchiroPlayerDice] = useState<[number, number, number] | null>(null);
  const [chinchiroDealerDice, setChinchiroDealerDice] = useState<[number, number, number] | null>(null);
  const [chinchiroBet, setChinchiroBet] = useState(MIN_CASINO_BET);
  const [chinchiroWager, setChinchiroWager] = useState(0);
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
  const [fourPanelBrushSize, setFourPanelBrushSize] = useState(5);
  const [fourPanelBrushColor, setFourPanelBrushColor] = useState(DEFAULT_FOUR_PANEL_BRUSH_COLOR);
  const [fourPanelBrushOpacity, setFourPanelBrushOpacity] = useState(100);
  const [fourPanelCursor, setFourPanelCursor] = useState<BrushCursorPreview>({ x: 0, y: 0, size: 5, visible: false });
  const [fourPanelMessage, setFourPanelMessage] = useState<string>(LOGIN_I18N.ja.fourPanelHint);
  const [drawingRelayPrompt, setDrawingRelayPrompt] = useState(DRAWING_RELAY_PROMPTS[0]);
  const [drawingRelayImage, setDrawingRelayImage] = useState("");
  const [drawingRelayGuess, setDrawingRelayGuess] = useState("");
  const [drawingRelayPhase, setDrawingRelayPhase] = useState<"draw" | "guess" | "done">("draw");
  const [drawingRelayBrushSize, setDrawingRelayBrushSize] = useState(5);
  const [drawingRelayBrushColor, setDrawingRelayBrushColor] = useState(DEFAULT_DRAWING_RELAY_BRUSH_COLOR);
  const [drawingRelayBrushOpacity, setDrawingRelayBrushOpacity] = useState(100);
  const [drawingRelayCursor, setDrawingRelayCursor] = useState<BrushCursorPreview>({ x: 0, y: 0, size: 5, visible: false });
  const [drawingRelayMessage, setDrawingRelayMessage] = useState<string>(LOGIN_I18N.ja.drawingRelayHintDraw);
  const [fitPuzzleTiles, setFitPuzzleTiles] = useState<number[]>(() => createFitPuzzleShuffledTiles());
  const [fitPuzzleMoves, setFitPuzzleMoves] = useState(0);
  const [fitPuzzleMessage, setFitPuzzleMessage] = useState<string>(LOGIN_I18N.ja.fitPuzzleHint);
  const [isFitPuzzleOver, setIsFitPuzzleOver] = useState(false);
  const mahjongStartRef = useRef<{ hand: MahjongCell[]; wall: MahjongCell[] } | null>(null);
  if (!mahjongStartRef.current) {
    mahjongStartRef.current = createMahjongStartBoard();
  }
  const [mahjongBoard, setMahjongBoard] = useState<MahjongCell[]>(() => [...(mahjongStartRef.current?.hand || [])]);
  const [mahjongWall, setMahjongWall] = useState<MahjongCell[]>(() => [...(mahjongStartRef.current?.wall || [])]);
  const [mahjongRiver, setMahjongRiver] = useState<MahjongCell[]>([]);
  const [mahjongSelected, setMahjongSelected] = useState<number | null>(null);
  const [mahjongLastDraw, setMahjongLastDraw] = useState<MahjongCell | null>(null);
  const [mahjongRoundWind, setMahjongRoundWind] = useState<"東" | "南" | "西" | "北">("東");
  const [mahjongRoundNumber, setMahjongRoundNumber] = useState(1);
  const [mahjongSeatWind, setMahjongSeatWind] = useState<"東" | "南" | "西" | "北">("東");
  const [mahjongHonba, setMahjongHonba] = useState(0);
  const [mahjongKyotaku, setMahjongKyotaku] = useState(0);
  const [mahjongRiichiTileIndex, setMahjongRiichiTileIndex] = useState<number | null>(null);
  const [mahjongDoraIndicator, setMahjongDoraIndicator] = useState<MahjongCell | null>(() => mahjongStartRef.current?.wall[4] ?? null);
  const [mahjongWinSummary, setMahjongWinSummary] = useState<MahjongWinSummary | null>(null);
  const [mahjongMessage, setMahjongMessage] = useState<string>(LOGIN_I18N.ja.mahjongHint);
  const [isMahjongOver, setIsMahjongOver] = useState(false);
  const [pokerDeck, setPokerDeck] = useState<PokerCard[]>([]);
  const [pokerPlayerHand, setPokerPlayerHand] = useState<PokerCard[]>([]);
  const [pokerCpuHand, setPokerCpuHand] = useState<PokerCard[]>([]);
  const [pokerCommunity, setPokerCommunity] = useState<PokerCard[]>([]);
  const [pokerBet, setPokerBet] = useState(MIN_CASINO_BET);
  const [pokerWager, setPokerWager] = useState(0);
  const [pokerHold, setPokerHold] = useState<boolean[]>([false, false]);
  const [pokerPhase, setPokerPhase] = useState<PokerPhase>("betting");
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
  const [solitaireUndoStack, setSolitaireUndoStack] = useState<SolitaireSnapshot[]>([]);
  const [solitaireDraggingSelection, setSolitaireDraggingSelection] = useState<SolitaireSelection | null>(null);
  const [solitaireDragOverTarget, setSolitaireDragOverTarget] = useState<SolitaireDragOverTarget | null>(null);
  const [solitairePartyPieces, setSolitairePartyPieces] = useState<SolitairePartyPiece[]>([]);
  const [solitaireFoundationFlights, setSolitaireFoundationFlights] = useState<SolitaireFoundationFlight[]>([]);
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
  const [unoLocalHands, setUnoLocalHands] = useState<UnoCard[][]>([[], []]);
  const [unoCpuCount, setUnoCpuCount] = useState(1);
  const [unoRoomCpuCount, setUnoRoomCpuCount] = useState(0);
  const [unoLocalTurnIndex, setUnoLocalTurnIndex] = useState(0);
  const [unoTopCard, setUnoTopCard] = useState<UnoCard | null>(null);
  const [unoTurn, setUnoTurn] = useState<"player" | "cpu">("player");
  const [unoActivationFilter, setUnoActivationFilter] = useState<"color" | "number" | null>(null);
  const [unoMessage, setUnoMessage] = useState<string>(LOGIN_I18N.ja.unoYourTurn);
  const [isUnoOver, setIsUnoOver] = useState(false);
  const [activePanel, setActivePanel] = useState<Panel>("menu");
  const [roomBadgePanel, setRoomBadgePanel] = useState<PlayablePanel | null>(null);
  const [menuTabOpenState, setMenuTabOpenState] = useState<Record<MenuTabCategory, boolean>>(INITIAL_MENU_TAB_OPEN_STATE);
  const [menuCardOpenState, setMenuCardOpenState] = useState<Record<MenuCategory, boolean>>(INITIAL_MENU_CARD_OPEN_STATE);
  const [gameStarted, setGameStarted] = useState<Record<PlayablePanel, boolean>>(INITIAL_GAME_START_STATE);
  const [startCountdownPanel, setStartCountdownPanel] = useState<PlayablePanel | null>(null);
  const [startCountdownSec, setStartCountdownSec] = useState(0);
  const [roomCode, setRoomCode] = useState("");
  const [roomVisibility, setRoomVisibility] = useState<"public" | "private">("public");
  const [isRoomControlsOpen, setIsRoomControlsOpen] = useState(true);
  const [roomStatus, setRoomStatus] = useState("未接続");
  const [connectedRoomCode, setConnectedRoomCode] = useState("");
  const [menuRootRoomCode, setMenuRootRoomCode] = useState("");
  const [currentRoomParentCode, setCurrentRoomParentCode] = useState("");
  const [pendingLobbyReturnCode, setPendingLobbyReturnCode] = useState("");
  const [roomReadyById, setRoomReadyById] = useState<Record<string, boolean>>({});
  const [roomRole, setRoomRole] = useState("");
  const [roomParticipants, setRoomParticipants] = useState<RoomParticipant[]>([]);
  const [menuPublicRooms, setMenuPublicRooms] = useState<PublicRoomSummary[]>([]);
  const [panelPublicRooms, setPanelPublicRooms] = useState<PublicRoomSummary[]>([]);
  const [selectedMenuPublicRoomCode, setSelectedMenuPublicRoomCode] = useState("");
  const [selectedPanelPublicRoomCode, setSelectedPanelPublicRoomCode] = useState("");
  const [isMenuRoomListOpen, setIsMenuRoomListOpen] = useState(true);
  const [isPanelRoomListOpen, setIsPanelRoomListOpen] = useState(true);
  const [isMenuPublicRoomsLoading, setIsMenuPublicRoomsLoading] = useState(false);
  const [isPanelPublicRoomsLoading, setIsPanelPublicRoomsLoading] = useState(false);
  const [othelloDrawVotes, setOthelloDrawVotes] = useState<string[]>([]);
  const [pendingRemoteOthelloMove, setPendingRemoteOthelloMove] = useState<{ row: number; col: number } | null>(null);
  const [pendingRemoteGomokuMove, setPendingRemoteGomokuMove] = useState<{ row: number; col: number } | null>(null);
  const [pendingRemoteChessClick, setPendingRemoteChessClick] = useState<{ row: number; col: number } | null>(null);
  const [pendingRemoteShogiClick, setPendingRemoteShogiClick] = useState<{ row: number; col: number } | null>(null);
  const [pendingRemoteUnoAction, setPendingRemoteUnoAction] = useState<{ action: "play" | "draw"; index?: number } | null>(null);
  const [pendingRemoteDaifugoAction, setPendingRemoteDaifugoAction] = useState<{ action: "play" | "pass"; index?: number } | null>(null);
  const [isChaosMode, setIsChaosMode] = useState(false);
  const [menuMessage, setMenuMessage] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUserId, setAuthUserId] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authSessionId, setAuthSessionId] = useState("");
  const [cloudFriendId, setCloudFriendId] = useState("");
  const [profileNameDraft, setProfileNameDraft] = useState("");
  const [profileBioDraft, setProfileBioDraft] = useState("");
  const [fitPuzzleProgress, setFitPuzzleProgress] = useState<FitPuzzleProgress | null>(null);
  const [entryMessage, setEntryMessage] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authMode, setAuthMode] = useState<"guest" | "cloud">("guest");
  const [casinoBankroll, setCasinoBankroll] = useState(DEFAULT_CASINO_BANKROLL);
  const [showCasinoWinBurst, setShowCasinoWinBurst] = useState(false);
  const [language, setLanguage] = useState<Language>("ja");
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);
  const [isProfileNameEditOpen, setIsProfileNameEditOpen] = useState(false);
  const [isProfileBioEditOpen, setIsProfileBioEditOpen] = useState(false);
  const [isFriendPanelOpen, setIsFriendPanelOpen] = useState(false);
  const [friendTab, setFriendTab] = useState<FriendTab>("friends");
  const [friendUserIdDraft, setFriendUserIdDraft] = useState("");
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [friendSearchResults, setFriendSearchResults] = useState<string[]>([]);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [incomingFriendIds, setIncomingFriendIds] = useState<string[]>([]);
  const [outgoingFriendIds, setOutgoingFriendIds] = useState<string[]>([]);
  const [friendDisplayNames, setFriendDisplayNames] = useState<Record<string, string>>({});
  const [friendActionUserId, setFriendActionUserId] = useState("");
  const [activeFriendChatUserId, setActiveFriendChatUserId] = useState("");
  const [friendChatMessages, setFriendChatMessages] = useState<FriendChatMessage[]>([]);
  const [friendChatPeerReadState, setFriendChatPeerReadState] = useState<FriendChatPeerReadState>({
    lastReadMessageId: 0,
    lastReadAt: 0,
  });
  const [friendChatDraft, setFriendChatDraft] = useState("");
  const [isFriendChatLoading, setIsFriendChatLoading] = useState(false);
  const [isFriendChatSending, setIsFriendChatSending] = useState(false);
  const [friendUnreadCounts, setFriendUnreadCounts] = useState<Record<string, number>>({});
  const [roomMemberActionId, setRoomMemberActionId] = useState("");
  const [friendsMessage, setFriendsMessage] = useState("");
  const [isFriendsLoading, setIsFriendsLoading] = useState(false);
  const [isFriendsActionLoading, setIsFriendsActionLoading] = useState(false);
  const [isFriendSearchLoading, setIsFriendSearchLoading] = useState(false);
  const [isPublicProfileLoading, setIsPublicProfileLoading] = useState(false);
  const [publicProfile, setPublicProfile] = useState<{
    userId: string;
    friendId: string;
    playerName: string;
    profileBio: string;
    playerAvatar: string;
  } | null>(null);
  const [quickMatchMode, setQuickMatchMode] = useState(false);
  const [pendingInviteToken, setPendingInviteToken] = useState("");
  const [inviteCopyFeedback, setInviteCopyFeedback] = useState<"idle" | "copied" | "failed">("idle");
  const [roomChatMessages, setRoomChatMessages] = useState<Array<{ id?: string; name: string; text: string }>>([]);
  const [spectatorChatMessages, setSpectatorChatMessages] = useState<Array<{ name: string; text: string }>>([]);
  const [roomChatInput, setRoomChatInput] = useState("");
  const [spectatorChatInput, setSpectatorChatInput] = useState("");
  const roomSocketRef = useRef<WebSocket | null>(null);
  const inviteTokenResolveRef = useRef<((token: string) => void) | null>(null);
  const inviteCopyFeedbackTimerRef = useRef<number | null>(null);
  const pendingRoomChatIdsRef = useRef<string[]>([]);
  const peerIdRef = useRef(`next-${Math.random().toString(36).slice(2, 10)}`);
  const clientIdRef = useRef(`client-${Math.random().toString(36).slice(2, 12)}`);
  const activePanelRef = useRef<Panel>("menu");
  const isNumeronSessionActiveRef = useRef(false);
  const startCountdownTimerRef = useRef<number | null>(null);
  const casinoWinBurstTimerRef = useRef<number | null>(null);
  const blackjackDealerResolveTimerRef = useRef<number | null>(null);
  const prevUnreadTotalRef = useRef(0);
  const friendChatListRef = useRef<HTMLUListElement | null>(null);
  const snapshotRef = useRef<Record<string, unknown>>({});
  const minesweeperLegacyControllerRef = useRef<{ stop: () => void } | null>(null);
  const fourPanelCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fourPanelDrawingRef = useRef(false);
  const fourPanelLastPointRef = useRef<{ x: number; y: number } | null>(null);
  const fourPanelStrokeLayerRef = useRef<HTMLCanvasElement | null>(null);
  const fourPanelStrokeBaseSnapshotRef = useRef<ImageData | null>(null);
  const fourPanelHasStrokeRef = useRef(false);
  const fourPanelUndoStackRef = useRef<string[]>([]);
  const drawingRelayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRelayDrawingRef = useRef(false);
  const drawingRelayLastPointRef = useRef<{ x: number; y: number } | null>(null);
  const drawingRelayStrokeLayerRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRelayStrokeBaseSnapshotRef = useRef<ImageData | null>(null);
  const drawingRelayHasStrokeRef = useRef(false);
  const numeronGuessPanelRef = useRef<HTMLDivElement | null>(null);
  const fitPuzzleProgressRef = useRef<FitPuzzleProgress | null>(null);
  const fitPuzzleProgressSaveTimerRef = useRef<number | null>(null);
  const solitairePartyTimerRef = useRef<number | null>(null);
  const solitaireFlightTimersRef = useRef<number[]>([]);
  const solitaireDragSelectionRef = useRef<SolitaireSelection | null>(null);
  const casinoBankHydratedRef = useRef(false);

  const normalizeRoomPanel = useCallback((value: unknown): PlayablePanel | null => {
    const panel = String(value || "").trim();
    if (
      panel === "othello"
      || panel === "gomoku"
      || panel === "chess"
      || panel === "shogi"
      || panel === "uno"
      || panel === "minesweeper"
      || panel === "numeron"
      || panel === "blackjack"
      || panel === "chinchiro"
      || panel === "sevens"
      || panel === "daifugo"
      || panel === "fourPanel"
      || panel === "drawingRelay"
      || panel === "fitPuzzle"
      || panel === "mahjong"
      || panel === "poker"
      || panel === "solitaire"
      || panel === "survivors"
    ) {
      return panel as PlayablePanel;
    }
    return null;
  }, []);

  const getCurrentRoomPanel = useCallback((): PlayablePanel | "" => {
    const current = activePanelRef.current;
    const normalizedCurrent = normalizeRoomPanel(current);
    if (normalizedCurrent) return normalizedCurrent;
    return "";
  }, [normalizeRoomPanel]);

  const getCurrentRoomClientId = useCallback(() => {
    let current = String(clientIdRef.current || "").trim();
    try {
      const stored = String(window.sessionStorage.getItem(STORAGE_ROOM_CLIENT_ID_SESSION_KEY) || "").trim();
      if (stored) {
        current = stored;
      } else if (current) {
        window.sessionStorage.setItem(STORAGE_ROOM_CLIENT_ID_SESSION_KEY, current);
      }
    } catch {
      // ignore storage access errors
    }
    if (!current) {
      current = `client-${Math.random().toString(36).slice(2, 12)}`;
    }
    clientIdRef.current = current;
    return current;
  }, []);

  const getCurrentRoomUserId = useCallback(() => {
    const cloudUserId = authMode === "cloud" ? authUserId.trim().slice(0, 24) : "";
    return cloudUserId || "";
  }, [authMode, authUserId]);

  const sendRoomEvent = useCallback((payload: Record<string, unknown>) => {
    const ws = roomSocketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (!connectedRoomCode) return;
    const clientId = getCurrentRoomClientId();
    const userId = getCurrentRoomUserId();
    try {
      ws.send(
        JSON.stringify({
          ...payload,
          room: connectedRoomCode,
          from: peerIdRef.current,
          clientId,
          userId,
          panel: getCurrentRoomPanel(),
          name: playerName,
        }),
      );
    } catch {
      // ignore send error
    }
  }, [connectedRoomCode, getCurrentRoomClientId, getCurrentRoomPanel, getCurrentRoomUserId, playerName]);

  useEffect(() => {
    activePanelRef.current = activePanel;
    isNumeronSessionActiveRef.current = activePanel === "numeron" || gameStarted.numeron;
  }, [activePanel, gameStarted.numeron]);



  useEffect(() => {
    const savedUserId = localStorage.getItem(STORAGE_CLOUD_USER_ID_KEY) || "";
    const savedPassword = localStorage.getItem(STORAGE_CLOUD_PASSWORD_KEY) || "";
    const savedSessionId = localStorage.getItem(STORAGE_CLOUD_SESSION_ID_KEY) || "";
    const savedFriendId = localStorage.getItem(STORAGE_CLOUD_FRIEND_ID_KEY) || "";
    const savedLanguage = localStorage.getItem(STORAGE_LANGUAGE_KEY);
    const savedMenuTabOpenState = localStorage.getItem(STORAGE_MENU_TAB_OPEN_STATE_KEY);
    const savedMenuCardOpenState = localStorage.getItem(STORAGE_MENU_CARD_OPEN_STATE_KEY);
    setAuthUserId(savedUserId);
    setAuthPassword(savedPassword);
    setAuthSessionId(savedSessionId);
    setCloudFriendId(savedFriendId);
    if (savedLanguage === "ja" || savedLanguage === "ko" || savedLanguage === "en" || savedLanguage === "zh") {
      setLanguage(savedLanguage);
    }

    if (savedMenuTabOpenState) {
      try {
        const parsed = JSON.parse(savedMenuTabOpenState) as Partial<Record<MenuTabCategory, boolean>>;
        setMenuTabOpenState((prev) => ({
          ...prev,
          ...parsed,
        }));
      } catch {
        // ignore invalid storage value
      }
    }

    if (savedMenuCardOpenState) {
      try {
        const parsed = JSON.parse(savedMenuCardOpenState) as Partial<Record<MenuCategory, boolean>>;
        setMenuCardOpenState((prev) => ({
          ...prev,
          ...parsed,
        }));
      } catch {
        // ignore invalid storage value
      }
    }

    try {
      const url = new URL(window.location.href);
      const roomCodeParam = String(url.searchParams.get(ROOM_CODE_QUERY_PARAM_KEY) || "").replace(/\D/g, "").slice(0, 6);
      const inviteTokenParam = String(url.searchParams.get(ROOM_INVITE_TOKEN_QUERY_PARAM_KEY) || "").trim();
      if (roomCodeParam) {
        setRoomCode(roomCodeParam);
      }
      if (inviteTokenParam) {
        setPendingInviteToken(inviteTokenParam);
      }
    } catch {
      // ignore query parse error
    }
  }, []);

  const casinoScopeId = useMemo(() => {
    const cloudUserId = authUserId.trim().slice(0, 24);
    if (authMode === "cloud" && cloudUserId) {
      return `cloud:${cloudUserId}`;
    }
    return "guest";
  }, [authMode, authUserId]);

  const casinoStorageKey = useMemo(() => {
    return `${CASINO_SHARED_BANK_STORAGE_KEY}:${casinoScopeId}`;
  }, [casinoScopeId]);

  useEffect(() => {
    let nextBank = DEFAULT_CASINO_BANKROLL;
    try {
      const raw = Number(localStorage.getItem(casinoStorageKey));
      if (Number.isFinite(raw) && raw >= 0) {
        nextBank = Math.floor(raw);
      }
    } catch {
      // ignore storage read failure
    }
    setCasinoBankroll(nextBank);
    casinoBankHydratedRef.current = true;
  }, [casinoStorageKey]);

  useEffect(() => {
    if (!casinoBankHydratedRef.current) return;
    try {
      localStorage.setItem(casinoStorageKey, String(Math.max(0, Math.floor(casinoBankroll))));
    } catch {
      // ignore storage write failure
    }
  }, [casinoBankroll, casinoStorageKey]);

  useEffect(() => {
    setBlackjackBet((prev) => clampCasinoBet(prev, casinoBankroll));
    setChinchiroBet((prev) => clampCasinoBet(prev, casinoBankroll));
    setPokerBet((prev) => clampCasinoBet(prev, casinoBankroll));
  }, [casinoBankroll]);

  const t = useCallback(
    (key: keyof typeof LOGIN_I18N.ja) => {
      if (language === "en") {
        return EN_I18N[key] ?? LOGIN_I18N.ja[key];
      }
      if (language === "zh") {
        return ZH_I18N[key] ?? LOGIN_I18N.ja[key];
      }
      return LOGIN_I18N[language][key];
    },
    [language],
  );

  const switchLanguage = useCallback((nextLanguage: Language) => {
    setLanguage(nextLanguage);
    localStorage.setItem(STORAGE_LANGUAGE_KEY, nextLanguage);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = language;
  }, [language]);

  const clearSolitaireFlightTimers = useCallback(() => {
    if (solitaireFlightTimersRef.current.length === 0) return;
    for (let i = 0; i < solitaireFlightTimersRef.current.length; i += 1) {
      window.clearTimeout(solitaireFlightTimersRef.current[i]);
    }
    solitaireFlightTimersRef.current = [];
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_MENU_TAB_OPEN_STATE_KEY, JSON.stringify(menuTabOpenState));
  }, [menuTabOpenState]);

  useEffect(() => {
    localStorage.setItem(STORAGE_MENU_CARD_OPEN_STATE_KEY, JSON.stringify(menuCardOpenState));
  }, [menuCardOpenState]);

  useEffect(() => {
    if (CHINCHIRO_VISIBLE) return;
    if (activePanel === "chinchiro") {
      setActivePanel("menu");
    }
  }, [activePanel]);

  useEffect(() => {
    fitPuzzleProgressRef.current = fitPuzzleProgress;
  }, [fitPuzzleProgress]);

  useEffect(() => {
    return () => {
      if (inviteCopyFeedbackTimerRef.current !== null) {
        window.clearTimeout(inviteCopyFeedbackTimerRef.current);
      }
      if (startCountdownTimerRef.current !== null) {
        window.clearInterval(startCountdownTimerRef.current);
      }
      if (fitPuzzleProgressSaveTimerRef.current !== null) {
        window.clearTimeout(fitPuzzleProgressSaveTimerRef.current);
      }
      if (solitairePartyTimerRef.current !== null) {
        window.clearTimeout(solitairePartyTimerRef.current);
      }
      clearSolitaireFlightTimers();
    };
  }, [clearSolitaireFlightTimers]);

  useEffect(() => {
    if (activePanel !== "minesweeper") {
      minesweeperLegacyControllerRef.current?.stop();
      minesweeperLegacyControllerRef.current = null;
      return;
    }

    let disposed = false;

    void import("./minesweeperLegacy.js").then(({ initMinesweeper }) => {
      if (disposed) return;
      minesweeperLegacyControllerRef.current?.stop();
      minesweeperLegacyControllerRef.current = initMinesweeper({
        onBackToMenu: () => {
          if (connectedRoomCode && menuRootRoomCode && menuRootRoomCode !== connectedRoomCode) {
            setPendingLobbyReturnCode(currentRoomParentCode || menuRootRoomCode);
            sendRoomEvent({ type: "return-lobby" });
          }
          setActivePanel("menu");
        },
      });
    });

    return () => {
      disposed = true;
      minesweeperLegacyControllerRef.current?.stop();
      minesweeperLegacyControllerRef.current = null;
    };
  }, [activePanel, connectedRoomCode, currentRoomParentCode, language, menuRootRoomCode, sendRoomEvent]);

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

  const isLoopbackRuntime = useCallback(() => {
    if (typeof window === "undefined") return false;
    return isLoopbackHost(window.location.hostname);
  }, []);

  const confirmLocalReset = useCallback(() => {
    if (!isLoopbackRuntime()) return true;
    return window.confirm(t("localResetConfirm"));
  }, [isLoopbackRuntime, t]);

  const runWithLocalResetConfirm = useCallback((action: () => void) => {
    if (!confirmLocalReset()) return;
    action();
  }, [confirmLocalReset]);

  const normalizeCasinoBankroll = useCallback(() => {
    if (casinoBankroll >= MIN_CASINO_BET) return casinoBankroll;
    setCasinoBankroll(DEFAULT_CASINO_BANKROLL);
    return DEFAULT_CASINO_BANKROLL;
  }, [casinoBankroll]);

  const stepBlackjackBet = useCallback((delta: number) => {
    setBlackjackBet((prev) => clampCasinoBet(prev + delta, casinoBankroll));
  }, [casinoBankroll]);

  const stepChinchiroBet = useCallback((delta: number) => {
    setChinchiroBet((prev) => clampCasinoBet(prev + delta, casinoBankroll));
  }, [casinoBankroll]);

  const stepPokerBet = useCallback((delta: number) => {
    setPokerBet((prev) => clampCasinoBet(prev + delta, casinoBankroll));
  }, [casinoBankroll]);

  const allInBlackjackBet = useCallback(() => {
    setBlackjackBet(clampCasinoBet(casinoBankroll, casinoBankroll));
  }, [casinoBankroll]);

  const allInChinchiroBet = useCallback(() => {
    setChinchiroBet(clampCasinoBet(casinoBankroll, casinoBankroll));
  }, [casinoBankroll]);

  const allInPokerBet = useCallback(() => {
    setPokerBet(clampCasinoBet(casinoBankroll, casinoBankroll));
  }, [casinoBankroll]);

  const setBlackjackBetByRatio = useCallback((ratio: number) => {
    const safeRatio = Math.min(1, Math.max(0.1, ratio));
    const target = Math.floor((casinoBankroll * safeRatio) / CASINO_BET_STEP) * CASINO_BET_STEP;
    setBlackjackBet(clampCasinoBet(target, casinoBankroll));
  }, [casinoBankroll]);

  const setPokerBetByRatio = useCallback((ratio: number) => {
    const safeRatio = Math.min(1, Math.max(0.1, ratio));
    const target = Math.floor((casinoBankroll * safeRatio) / CASINO_BET_STEP) * CASINO_BET_STEP;
    setPokerBet(clampCasinoBet(target, casinoBankroll));
  }, [casinoBankroll]);

  const formatChip = useCallback((value: number) => {
    const locale = language === "ko" ? "ko-KR" : language === "en" ? "en-US" : "ja-JP";
    return new Intl.NumberFormat(locale).format(Math.max(0, Math.floor(value)));
  }, [language]);

  const isBlackjackRoundActive = !isBlackjackOver && blackjackWager > 0 && blackjackPlayerHand.length > 0;
  const isPokerRoundActive = pokerPhase !== "betting" && pokerPhase !== "showdown" && pokerWager > 0 && pokerPlayerHand.length > 0;

  const clearBlackjackDealerResolveTimer = useCallback(() => {
    if (blackjackDealerResolveTimerRef.current !== null) {
      window.clearTimeout(blackjackDealerResolveTimerRef.current);
      blackjackDealerResolveTimerRef.current = null;
    }
  }, []);

  const triggerCasinoWinBurst = useCallback(() => {
    if (casinoWinBurstTimerRef.current !== null) {
      window.clearTimeout(casinoWinBurstTimerRef.current);
      casinoWinBurstTimerRef.current = null;
    }
    setShowCasinoWinBurst(false);
    window.requestAnimationFrame(() => {
      setShowCasinoWinBurst(true);
      casinoWinBurstTimerRef.current = window.setTimeout(() => {
        setShowCasinoWinBurst(false);
        casinoWinBurstTimerRef.current = null;
      }, 900);
    });
  }, []);

  useEffect(() => {
    return () => {
      clearBlackjackDealerResolveTimer();
      if (casinoWinBurstTimerRef.current !== null) {
        window.clearTimeout(casinoWinBurstTimerRef.current);
        casinoWinBurstTimerRef.current = null;
      }
    };
  }, [clearBlackjackDealerResolveTimer]);

  const stripInviteTokenFromAddressBar = useCallback(() => {
    try {
      const url = new URL(window.location.href);
      if (!url.searchParams.has(ROOM_INVITE_TOKEN_QUERY_PARAM_KEY)) return;
      url.searchParams.delete(ROOM_INVITE_TOKEN_QUERY_PARAM_KEY);
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    } catch {
      // ignore URL update error
    }
  }, []);

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

  const pokerPhaseLabel = useMemo(() => {
    if (pokerPhase === "betting") return "BET";
    if (pokerPhase === "preflop") return "PREFLOP";
    if (pokerPhase === "flop") return "FLOP";
    if (pokerPhase === "turn") return "TURN";
    if (pokerPhase === "river") return "RIVER";
    return "SHOWDOWN";
  }, [pokerPhase]);

  const pokerActionLabel = useMemo(() => {
    if (pokerPhase === "betting") return "BET";
    if (language === "ko") return "다음";
    return "次へ";
  }, [language, pokerPhase]);

  const chessPieceLabel = useCallback((piece: ChessPiece) => {
    const map: Record<ChessColor, Record<ChessPieceType, string>> = {
      w: {
        K: "♔",
        Q: "♕",
        R: "♖",
        B: "♗",
        N: "♘",
        P: "♙",
      },
      b: {
        K: "♚",
        Q: "♛",
        R: "♜",
        B: "♝",
        N: "♞",
        P: "♟",
      },
    };
    return map[piece.color][piece.type];
  }, []);

  const chessPlayerColorLabel = useMemo(
    () => (chessPlayerSide === "w" ? t("whiteStone") : t("blackStone")),
    [chessPlayerSide, t],
  );
  const chessEnemyColorLabel = useMemo(
    () => (chessPlayerSide === "w" ? t("blackStone") : t("whiteStone")),
    [chessPlayerSide, t],
  );

  const shogiPieceLabel = useCallback((piece: ShogiPiece) => {
    const map: Record<ShogiPieceType, string> = {
      K: "王",
      R: "飛",
      B: "角",
      G: "金",
      S: "銀",
      N: "桂",
      L: "香",
      P: "歩",
    };
    return map[piece.type];
  }, []);

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
      if (code === "DRAW_VOTE_FORBIDDEN") return t("roomErrDrawVoteForbidden");
      return tf("roomErrUnknown", { code });
    },
    [t, tf],
  );

  const pushRoomChatMessage = useCallback((name: string, text: string, id?: string) => {
    const normalizedText = String(text || "").trim().slice(0, 200);
    if (!normalizedText) return;
    const normalizedName = String(name || "Player").trim().slice(0, 24) || "Player";
    const normalizedId = String(id || "").trim().slice(0, 120);
    setRoomChatMessages((prev) => {
      if (normalizedId && prev.some((row) => row.id === normalizedId)) {
        return prev;
      }
      const next = [...prev, { id: normalizedId || undefined, name: normalizedName, text: normalizedText }];
      if (next.length > 160) {
        return next.slice(next.length - 160);
      }
      return next;
    });
  }, []);

  const rollbackLatestPendingRoomChat = useCallback(() => {
    const pending = pendingRoomChatIdsRef.current;
    if (!pending.length) return;
    const latestId = pending[pending.length - 1];
    pendingRoomChatIdsRef.current = pending.slice(0, -1);
    if (!latestId) return;
    setRoomChatMessages((prev) => prev.filter((row) => row.id !== latestId));
  }, []);

  const pushSpectatorChatMessage = useCallback((name: string, text: string) => {
    const normalizedText = String(text || "").trim().slice(0, 200);
    if (!normalizedText) return;
    const normalizedName = String(name || "Spectator").trim().slice(0, 24) || "Spectator";
    setSpectatorChatMessages((prev) => {
      const next = [...prev, { name: normalizedName, text: normalizedText }];
      if (next.length > 80) {
        return next.slice(next.length - 80);
      }
      return next;
    });
  }, []);

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

  const renderPlayingCardFace = useCallback(
    (label: string, options?: { compact?: boolean; muted?: boolean }) => {
      const text = String(label || "").trim();
      const suit = text.slice(-1);
      const rank = text.slice(0, -1);
      const isSuitCard = suit === "♠" || suit === "♥" || suit === "♦" || suit === "♣";

      if (!isSuitCard || !rank) {
        return (
          <span className="inline-flex min-h-9 min-w-16 items-center justify-center rounded-md border border-slate-300/35 bg-white/95 px-2.5 py-1.5 text-xs font-bold text-slate-900 shadow-sm">
            {text || "-"}
          </span>
        );
      }

      const compact = Boolean(options?.compact);
      const muted = Boolean(options?.muted);
      const redSuit = suit === "♥" || suit === "♦";
      const suitTone = redSuit ? "text-rose-600" : "text-slate-900";
      const rankTone = muted ? "text-slate-700" : suitTone;
      const shellTone = muted
        ? "border-slate-400/50 bg-slate-200/90 text-slate-600"
        : "border-slate-300/45 bg-white/95";

      return (
        <span
          aria-label={text}
          className={`relative inline-flex shrink-0 items-center justify-center rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.25)] ${compact ? "h-10 w-8 sm:h-11 sm:w-9" : "h-12 w-9 sm:h-14 sm:w-10 lg:h-16 lg:w-12"} ${shellTone}`}
        >
          <span className={`absolute left-0.5 top-0.5 rounded-sm bg-white/90 px-[1px] text-[12px] font-black leading-none tracking-tight [font-variant-numeric:tabular-nums] shadow-[0_0_1px_rgba(255,255,255,0.98)] ${rankTone}`}>{rank}</span>
          <span className={`absolute left-1 top-[11px] text-[8px] leading-none opacity-70 ${suitTone}`}>{suit}</span>
          <span className={`text-base leading-none opacity-85 ${suitTone}`}>{suit}</span>
          <span className={`absolute bottom-0 right-0.5 rotate-180 rounded-sm bg-white/90 px-[1px] text-[12px] font-black leading-none tracking-tight [font-variant-numeric:tabular-nums] shadow-[0_0_1px_rgba(255,255,255,0.98)] ${rankTone}`}>{rank}</span>
          <span className={`absolute bottom-[11px] right-1 rotate-180 text-[8px] leading-none opacity-70 ${suitTone}`}>{suit}</span>
        </span>
      );
    },
    [],
  );

  const renderUnoCardFace = useCallback((card: UnoCard) => {
    const colorClass =
      card.color === "R"
        ? "border-rose-300/60 bg-rose-500/85"
        : card.color === "G"
          ? "border-emerald-300/60 bg-emerald-500/85"
          : card.color === "B"
            ? "border-sky-300/60 bg-sky-500/85"
            : "border-amber-300/60 bg-amber-400/90";
    const value = String(card.value || "");
    return (
      <span className={`inline-flex h-12 w-9 items-center justify-center rounded-md border text-sm font-black text-white shadow-[0_1px_2px_rgba(0,0,0,0.25)] sm:h-14 sm:w-10 sm:text-base lg:h-16 lg:w-12 lg:text-lg ${colorClass}`}>
        {value}
      </span>
    );
  }, []);

  const renderUnoCardBack = useCallback(() => {
    return (
      <span
        aria-label="UNO card back"
        className="relative inline-flex h-12 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-indigo-200/55 bg-indigo-900/90 text-[10px] font-black tracking-wider text-indigo-100 shadow-[0_1px_2px_rgba(0,0,0,0.25)] sm:h-14 sm:w-10 lg:h-16 lg:w-12"
      >
        <span className="absolute inset-[3px] rounded-[4px] border border-cyan-200/45" />
        <span className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(125,211,252,0.16)_0px,rgba(125,211,252,0.16)_4px,rgba(15,23,42,0)_4px,rgba(15,23,42,0)_8px)]" />
        <span className="relative z-[1]">UNO</span>
      </span>
    );
  }, []);

  const playerHandFanStyle = useCallback((
    index: number,
    total: number,
    options?: {
      overlap?: number;
      spread?: number;
      maxRotate?: number;
      centerLift?: number;
      centerOffset?: number;
    },
  ) => {
    const baseOverlap = options?.overlap ?? 12;
    const baseSpread = options?.spread ?? 2.2;
    const maxRotate = options?.maxRotate ?? 11;
    const centerLift = options?.centerLift ?? 0.75;
    const baseCenterOffset = options?.centerOffset ?? 0.8;
    const squeeze = Math.max(0, total - 8);
    const overlap = Math.min(26, baseOverlap + squeeze * 1.35);
    const spread = Math.max(0.85, baseSpread - squeeze * 0.08);
    const centerOffset = Math.max(0.2, baseCenterOffset - squeeze * 0.045);
    const center = (total - 1) / 2;
    const offset = index - center;
    const maxAbs = Math.max(1, center);
    const centerBias = Math.max(0, 1 - Math.abs(offset) / maxAbs);
    const rotate = Math.max(-maxRotate, Math.min(maxRotate, offset * spread));
    const lift = centerBias * centerLift;
    const xShift = offset * centerOffset;
    const stackTop = total - Math.round(Math.abs(offset) * 2);
    return {
      marginLeft: index === 0 ? 0 : -overlap,
      transform: `translateX(${xShift.toFixed(2)}px) translateY(-${lift.toFixed(2)}px) rotate(${rotate.toFixed(2)}deg)`,
      transformOrigin: "bottom center" as const,
      zIndex: Math.max(1, stackTop),
    };
  }, []);

  const opponentHandStackStyle = useCallback((index: number, total: number) => {
    const squeeze = Math.max(0, total - 7);
    const overlap = Math.min(24, 9 + squeeze * 1.6);
    const center = (total - 1) / 2;
    const offset = index - center;
    const distance = Math.abs(index - center);
    const edgeDrop = center > 0 ? (distance / center) * 5 : 0;
    const rotate = Math.max(-8, Math.min(8, offset * 1.05));
    const spread = Math.max(0.45, 0.9 - squeeze * 0.04);
    const xShift = offset * spread;
    const stackTop = total - Math.round(distance * 2);
    return {
      marginLeft: index === 0 ? 0 : -overlap,
      transform: `translateX(${xShift.toFixed(2)}px) translateY(${edgeDrop.toFixed(2)}px) rotate(${rotate.toFixed(2)}deg)`,
      transformOrigin: "bottom center" as const,
      zIndex: Math.max(1, stackTop),
    };
  }, []);

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
  const isOthelloGameStarted = useMemo(() => {
    let occupied = 0;
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        if (board[row][col] !== 0) occupied += 1;
      }
    }
    if (occupied !== 4) return true;
    return !(board[3][3] === 2 && board[3][4] === 1 && board[4][3] === 1 && board[4][4] === 2);
  }, [board]);
  const gomokuStoneCount = useMemo(() => countStones(gomokuBoard), [gomokuBoard]);
  const othelloRoomPlayer = useMemo<1 | 2 | null>(() => {
    if (!connectedRoomCode) return null;
    if (roomRole === "host") return 1;
    if (roomRole === "guest") return 2;
    return null;
  }, [connectedRoomCode, roomRole]);

  const canOperateOthelloNow = useMemo(() => {
    if (!connectedRoomCode) {
      if (othelloMode === "local") return true;
      if (othelloMode === "chaos") return true;
      if (othelloMode === "cpu") return currentPlayer === othelloPlayerSide;
      return false;
    }
    if (!othelloRoomPlayer) return false;
    return currentPlayer === othelloRoomPlayer;
  }, [connectedRoomCode, currentPlayer, othelloMode, othelloPlayerSide, othelloRoomPlayer]);

  const gomokuRoomPlayer = useMemo<1 | 2 | null>(() => {
    if (!connectedRoomCode) return null;
    if (roomRole === "host") return 1;
    if (roomRole === "guest") return 2;
    return null;
  }, [connectedRoomCode, roomRole]);

  const canOperateGomokuNow = useMemo(() => {
    if (!connectedRoomCode) {
      if (gomokuMode === "cpu") return gomokuPlayer === gomokuPlayerSide;
      return true;
    }
    if (!gomokuRoomPlayer) return false;
    return gomokuPlayer === gomokuRoomPlayer;
  }, [connectedRoomCode, gomokuMode, gomokuPlayer, gomokuPlayerSide, gomokuRoomPlayer]);

  const chessRoomPlayer = useMemo<ChessColor | null>(() => {
    if (!connectedRoomCode) return null;
    if (roomRole === "host") return "w";
    if (roomRole === "guest") return "b";
    return null;
  }, [connectedRoomCode, roomRole]);

  const canOperateChessNow = useMemo(() => {
    if (!connectedRoomCode) {
      if (chessMode === "local") return true;
      return chessTurn === chessPlayerSide;
    }
    if (!chessRoomPlayer) return false;
    return chessTurn === chessRoomPlayer;
  }, [chessMode, chessPlayerSide, chessRoomPlayer, chessTurn, connectedRoomCode]);

  const isChessBoardFlippedForViewer = useMemo(() => connectedRoomCode && roomRole === "guest", [connectedRoomCode, roomRole]);
  const chessDisplayRows = useMemo(
    () => (isChessBoardFlippedForViewer ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7]),
    [isChessBoardFlippedForViewer],
  );
  const chessDisplayCols = useMemo(
    () => (isChessBoardFlippedForViewer ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7]),
    [isChessBoardFlippedForViewer],
  );

  const shogiRoomPlayer = useMemo<ShogiColor | null>(() => {
    if (!connectedRoomCode) return null;
    if (roomRole === "host") return "b";
    if (roomRole === "guest") return "w";
    return null;
  }, [connectedRoomCode, roomRole]);

  const canOperateShogiNow = useMemo(() => {
    if (!connectedRoomCode) {
      if (shogiMode === "cpu") return shogiTurn === shogiPlayerSide;
      return true;
    }
    if (!shogiRoomPlayer) return false;
    return shogiTurn === shogiRoomPlayer;
  }, [connectedRoomCode, shogiMode, shogiPlayerSide, shogiRoomPlayer, shogiTurn]);

  const unoRoomPlayer = useMemo<"player" | "cpu" | null>(() => {
    if (!connectedRoomCode) return null;
    if (roomRole === "host") return "player";
    if (roomRole === "guest") return "cpu";
    return null;
  }, [connectedRoomCode, roomRole]);

  const unoRoomHumanIndex = useMemo(() => {
    if (!connectedRoomCode) return 0;
    if (roomRole === "host") return 0;
    if (roomRole === "guest") return 1;
    return -1;
  }, [connectedRoomCode, roomRole]);

  const isUnoExtendedMode = useMemo(() => {
    return !connectedRoomCode || unoRoomCpuCount > 0;
  }, [connectedRoomCode, unoRoomCpuCount]);

  const canOperateUnoNow = useMemo(() => {
    if (isUnoExtendedMode) {
      if (connectedRoomCode && roomRole === "spectator") return false;
      return unoRoomHumanIndex >= 0 && unoLocalTurnIndex === unoRoomHumanIndex;
    }
    if (!connectedRoomCode) return unoLocalTurnIndex === 0;
    if (!unoRoomPlayer) return false;
    return unoTurn === unoRoomPlayer;
  }, [connectedRoomCode, isUnoExtendedMode, roomRole, unoLocalTurnIndex, unoRoomHumanIndex, unoRoomPlayer, unoTurn]);

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

  const unoLocalTotalPlayers = useMemo(() => {
    return 1 + unoCpuCount;
  }, [unoCpuCount]);

  const unoRoomTotalPlayers = useMemo(() => {
    return 2 + unoRoomCpuCount;
  }, [unoRoomCpuCount]);

  const unoLocalPlayerHand = useMemo(() => {
    return unoLocalHands[0] || [];
  }, [unoLocalHands]);

  const unoLocalCpuHands = useMemo(() => {
    return Array.from({ length: unoCpuCount }, (_, i) => unoLocalHands[i + 1] || []);
  }, [unoCpuCount, unoLocalHands]);

  const isUnoLocalTableMode = useMemo(() => {
    return !connectedRoomCode && unoLocalTotalPlayers >= 3;
  }, [connectedRoomCode, unoLocalTotalPlayers]);

  const unoVisibleHand = useMemo(() => {
    if (connectedRoomCode && isUnoExtendedMode) {
      if (unoRoomHumanIndex < 0) return [];
      return unoLocalHands[unoRoomHumanIndex] || [];
    }
    if (connectedRoomCode) {
      return unoLocalSide === "player" ? unoPlayerHand : unoCpuHand;
    }
    return unoLocalPlayerHand;
  }, [connectedRoomCode, isUnoExtendedMode, unoCpuHand, unoLocalHands, unoLocalPlayerHand, unoLocalSide, unoPlayerHand, unoRoomHumanIndex]);

  const unoActivationState = useMemo(() => {
    const playableByColor = new Set<number>();
    const playableByNumber = new Set<number>();
    const playableAny = new Set<number>();

    if (!unoTopCard) {
      return {
        playableAny,
        activeIndices: new Set<number>(),
        canChooseColor: false,
        canChooseNumber: false,
        requiresRuleChoice: false,
      };
    }

    unoVisibleHand.forEach((card, index) => {
      if (!canPlayCard(card, unoTopCard)) return;
      playableAny.add(index);
      if (card.color === unoTopCard.color) playableByColor.add(index);
      if (card.value === unoTopCard.value) playableByNumber.add(index);
    });

    const canChooseColor = playableByColor.size > 0;
    const canChooseNumber = playableByNumber.size > 0;
    const requiresRuleChoice = playableAny.size > 1 && canChooseColor && canChooseNumber;

    const activeIndices = new Set<number>();
    if (!requiresRuleChoice || !unoActivationFilter) {
      playableAny.forEach((idx) => activeIndices.add(idx));
    } else if (unoActivationFilter === "color") {
      playableByColor.forEach((idx) => activeIndices.add(idx));
    } else {
      playableByNumber.forEach((idx) => activeIndices.add(idx));
    }

    return {
      playableAny,
      activeIndices,
      canChooseColor,
      canChooseNumber,
      requiresRuleChoice,
    };
  }, [unoActivationFilter, unoTopCard, unoVisibleHand]);

  useEffect(() => {
    setUnoActivationFilter(null);
  }, [connectedRoomCode, unoLocalTurnIndex, unoTopCard, unoTurn]);

  const unoCpuSeatLayout = useMemo(() => {
    const totalCpu = unoLocalCpuHands.length;
    if (totalCpu <= 0) return [] as Array<{ hand: UnoCard[]; cpuIdx: number; x: number; y: number; orientation: "top" | "left" | "right" }>;
    const radiusX = totalCpu >= 6 ? 44 : totalCpu >= 4 ? 42 : 41;
    const radiusY = totalCpu >= 6 ? 34 : totalCpu >= 4 ? 33 : 31;
    return unoLocalCpuHands.map((hand, cpuIdx) => {
      const ratio = totalCpu === 1 ? 0.5 : cpuIdx / (totalCpu - 1);
      const angleDeg = -165 + ratio * 150;
      const rad = (angleDeg * Math.PI) / 180;
      const x = 50 + radiusX * Math.cos(rad);
      const y = 54 + radiusY * Math.sin(rad);
      const side = Math.cos(rad);
      const orientation: "top" | "left" | "right" = side < -0.45 ? "left" : side > 0.45 ? "right" : "top";
      return { hand, cpuIdx, x, y, orientation };
    });
  }, [unoLocalCpuHands]);

  const unoRoomSeatLayout = useMemo(() => {
    if (!connectedRoomCode) {
      return [] as Array<{ label: string; handCount: number | null; x: number; y: number; orientation: "top" | "left" | "right" }>;
    }
    const active = roomParticipants.filter((p) => p.role === "host" || p.role === "guest");
    const withHands = active.map((p, idx) => ({
      label: String(p.name || "").trim() || `P${idx + 1}`,
      handCount: isUnoExtendedMode ? (unoLocalHands[idx]?.length ?? null) : null,
      id: p.id,
    }));
    const opponents = withHands.filter((p) => p.id !== peerIdRef.current);
    const cpuSeats = isUnoExtendedMode
      ? Array.from({ length: unoRoomCpuCount }, (_, i) => ({
        label: `CPU ${i + 1}`,
        handCount: unoLocalHands[active.length + i]?.length ?? null,
        id: `cpu-${i}`,
      }))
      : [];
    const seatEntities = [...opponents, ...cpuSeats];
    const total = seatEntities.length;
    if (total <= 0) {
      return [] as Array<{ label: string; handCount: number | null; x: number; y: number; orientation: "top" | "left" | "right" }>;
    }

    const radiusX = total >= 6 ? 44 : total >= 4 ? 42 : 41;
    const radiusY = total >= 6 ? 34 : total >= 4 ? 33 : 31;

    return seatEntities.map((seat, idx) => {
      const ratio = total === 1 ? 0.5 : idx / (total - 1);
      const angleDeg = -165 + ratio * 150;
      const rad = (angleDeg * Math.PI) / 180;
      const x = 50 + radiusX * Math.cos(rad);
      const y = 54 + radiusY * Math.sin(rad);
      const side = Math.cos(rad);
      const orientation: "top" | "left" | "right" = side < -0.45 ? "left" : side > 0.45 ? "right" : "top";
      const seatLabel = seat.label;
      return {
        label: seatLabel.length > 10 ? `${seatLabel.slice(0, 10)}…` : seatLabel,
        handCount: seat.handCount,
        x,
        y,
        orientation,
      };
    });
  }, [connectedRoomCode, isUnoExtendedMode, roomParticipants, unoLocalHands, unoRoomCpuCount]);

  const isUnoRoomTableMode = useMemo(() => {
    if (!connectedRoomCode) return false;
    const activeCount = roomParticipants.filter((p) => p.role === "host" || p.role === "guest").length;
    return activeCount + (isUnoExtendedMode ? unoRoomCpuCount : 0) >= 3;
  }, [connectedRoomCode, isUnoExtendedMode, roomParticipants, unoRoomCpuCount]);

  const isUnoTableMode = useMemo(() => {
    return isUnoLocalTableMode || isUnoRoomTableMode;
  }, [isUnoLocalTableMode, isUnoRoomTableMode]);

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

  const roomHostName = useMemo(() => {
    const host = roomParticipants.find((participant) => participant.role === "host");
    return String(host?.name || "").trim();
  }, [roomParticipants]);

  const roomGuestName = useMemo(() => {
    const guest = roomParticipants.find((participant) => participant.role === "guest");
    return String(guest?.name || "").trim();
  }, [roomParticipants]);

  const roomOpponentDisplay = useMemo(() => {
    if (!connectedRoomCode) return "";
    if (roomRole === "host") return roomGuestName;
    if (roomRole === "guest") return roomHostName;
    if (roomRole === "spectator") {
      if (roomHostName && roomGuestName) {
        return `${roomHostName} vs ${roomGuestName}`;
      }
      return roomHostName || roomGuestName;
    }
    return "";
  }, [connectedRoomCode, roomGuestName, roomHostName, roomRole]);

  const roomPanelLabel = useCallback((panel: PlayablePanel) => {
    if (panel === "othello") return t("tabOthello");
    if (panel === "gomoku") return t("tabGomoku");
    if (panel === "chess") return t("tabChess");
    if (panel === "shogi") return t("tabShogi");
    if (panel === "uno") return t("tabUno");
    if (panel === "minesweeper") return t("tabMinesweeper");
    if (panel === "numeron") return t("tabNumeron");
    if (panel === "blackjack") return t("tabBlackjack");
    if (panel === "chinchiro") return t("tabChinchiro");
    if (panel === "sevens") return t("tabSevens");
    if (panel === "daifugo") return t("tabDaifugo");
    if (panel === "fourPanel") return t("tabFourPanel");
    if (panel === "drawingRelay") return t("tabDrawingRelay");
    if (panel === "fitPuzzle") return t("tabFitPuzzle");
    if (panel === "mahjong") return t("tabMahjong");
    if (panel === "poker") return t("tabPoker");
    if (panel === "solitaire") return t("tabSolitaire");
    return t("tabSurvivors");
  }, [t]);

  const roomMatchedPlayerCount = useMemo(() => {
    return roomParticipants.length;
  }, [roomParticipants]);

  const roomActivePlayerCount = useMemo(() => {
    return roomParticipants.filter((participant) => participant.role === "host" || participant.role === "guest").length;
  }, [roomParticipants]);

  const roomReadyCount = useMemo(() => {
    return roomParticipants.filter((participant) => (
      (participant.role === "host" || participant.role === "guest")
      && Boolean(roomReadyById[participant.id])
    )).length;
  }, [roomParticipants, roomReadyById]);

  const roomAllReady = useMemo(() => {
    const active = roomParticipants.filter((participant) => participant.role === "host" || participant.role === "guest");
    if (active.length < 2) return false;
    return active.every((participant) => Boolean(roomReadyById[participant.id]));
  }, [roomParticipants, roomReadyById]);

  const myRoomReady = useMemo(() => {
    return Boolean(roomReadyById[peerIdRef.current]);
  }, [roomReadyById]);

  const roomOccupancyText = useMemo(() => {
    const count = Math.max(0, Math.min(16, roomMatchedPlayerCount));
    return `${String(count).padStart(2, "0")}/16`;
  }, [roomMatchedPlayerCount]);

  const roomParticipantCountsByPanel = useMemo(() => {
    const counts = Object.fromEntries(PLAYABLE_PANELS.map((panel) => [panel, 0])) as Record<PlayablePanel, number>;
    const seenCodes = new Set<string>();

    for (const room of panelPublicRooms) {
      const code = String(room.code || "").replace(/\D/g, "").slice(0, 6);
      if (code.length === 6) {
        if (seenCodes.has(code)) continue;
        seenCodes.add(code);
      }
      const activePlayers = Math.max(0, Math.min(16, Number(room.activePlayers) || 0));
      if (activePlayers <= 0) continue;
      for (const panel of room.panels) {
        if (!(panel in counts)) continue;
        counts[panel] += activePlayers;
      }
    }

    // Fallback: include the current room snapshot when list updates are delayed.
    const currentCode = String(connectedRoomCode || "").replace(/\D/g, "").slice(0, 6);
    if (currentCode.length === 6 && !seenCodes.has(currentCode)) {
      for (const participant of roomParticipants) {
        if (participant.role !== "host" && participant.role !== "guest") continue;
        const panel = participant.panel;
        if (!panel || !(panel in counts)) continue;
        counts[panel] += 1;
      }
    }

    return counts;
  }, [connectedRoomCode, panelPublicRooms, roomParticipants]);

  const roomOccupancyTextByPanel = useMemo(() => {
    const byPanel = Object.fromEntries(PLAYABLE_PANELS.map((panel) => [panel, "00/16"])) as Record<PlayablePanel, string>;
    for (const panel of PLAYABLE_PANELS) {
      const count = Math.max(0, Math.min(16, roomParticipantCountsByPanel[panel] || 0));
      byPanel[panel] = `${String(count).padStart(2, "0")}/16`;
    }
    return byPanel;
  }, [roomParticipantCountsByPanel]);

  const currentPlayablePanel = useMemo(() => {
    return normalizeRoomPanel(activePanel);
  }, [activePanel, normalizeRoomPanel]);

  const filteredPanelPublicRooms = useMemo(() => {
    if (!currentPlayablePanel) return panelPublicRooms;
    return panelPublicRooms.filter((room) => room.panels.length === 0 || room.panels.includes(currentPlayablePanel));
  }, [currentPlayablePanel, panelPublicRooms]);

  const allocateClientRoomCode = useCallback(() => {
    const mergedRooms = [...menuPublicRooms, ...panelPublicRooms];
    const usedCodes = new Set(mergedRooms.map((room) => String(room.code || "").replace(/\D/g, "").slice(0, 6)));
    if (connectedRoomCode) {
      usedCodes.add(String(connectedRoomCode || "").replace(/\D/g, "").slice(0, 6));
    }
    for (let i = 0; i < 120; i += 1) {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      if (!usedCodes.has(code)) return code;
    }
    return String(Math.floor(100000 + Math.random() * 900000));
  }, [connectedRoomCode, menuPublicRooms, panelPublicRooms]);

  const numeronMatchedPlayersCount = useMemo(() => {
    return Math.max(0, roomActivePlayerCount);
  }, [roomActivePlayerCount]);

  const resolveOthelloChaosOwners = (target: OthelloChaosTarget, playerSide: 1 | 2): Array<1 | 2> => {
    if (target === "black") return [1];
    if (target === "white") return [2];
    if (target === "both") return [1, 2];
    if (target === "player") return [playerSide];
    if (target === "opponent") return [playerSide === 1 ? 2 : 1];
    return [];
  };

  const clampOthelloChaosLimit = (value: number) => {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(8, Math.floor(value)));
  };

  const buildOthelloChaosStocks = (
    settings: OthelloChaosSettings,
    chaosEnabled: boolean,
    playerSide: 1 | 2,
  ): {
    overwrite: [number, number];
    immutable: [number, number];
    destroy: [number, number];
  } => {
    if (!chaosEnabled) {
      return {
        overwrite: [OTHELLO_DEFAULT_OVERWRITE, OTHELLO_DEFAULT_OVERWRITE],
        immutable: [OTHELLO_DEFAULT_IMMUTABLE, OTHELLO_DEFAULT_IMMUTABLE],
        destroy: [OTHELLO_DEFAULT_DESTROY, OTHELLO_DEFAULT_DESTROY],
      };
    }

    const overwrite: [number, number] = [0, 0];
    const immutable: [number, number] = [0, 0];
    const destroy: [number, number] = [0, 0];

    if (settings.target === "both") {
      overwrite[0] = clampOthelloChaosLimit(settings.bothBlackOverwriteLimit);
      overwrite[1] = clampOthelloChaosLimit(settings.bothWhiteOverwriteLimit);
      immutable[0] = settings.bothBlackHandicap === "immutable1" ? 1 : 0;
      immutable[1] = settings.bothWhiteHandicap === "immutable1" ? 1 : 0;
      destroy[0] = clampOthelloChaosLimit(settings.destroyLimitBlack);
      destroy[1] = clampOthelloChaosLimit(settings.destroyLimitWhite);
      return { overwrite, immutable, destroy };
    }

    const targetOwners = resolveOthelloChaosOwners(settings.target, playerSide);
    targetOwners.forEach((owner) => {
      const index = othelloPlayerIndex(owner);
      overwrite[index] = clampOthelloChaosLimit(settings.overwriteLimit);
      immutable[index] = settings.handicap === "immutable1" ? 1 : 0;
      destroy[index] = owner === 1
        ? clampOthelloChaosLimit(settings.destroyLimitBlack)
        : clampOthelloChaosLimit(settings.destroyLimitWhite);
    });

    return { overwrite, immutable, destroy };
  };

  const resetOthello = (
    override: Partial<OthelloChaosSettings> = {},
    forceChaosMode = isChaosMode,
    options: { rerollRandomSide?: boolean; playerSideOverride?: 1 | 2; turnOrderOverride?: OthelloTurnOrder } = {},
  ) => {
    const nextChaosSettings: OthelloChaosSettings = {
      target: othelloChaosTarget,
      handicap: othelloChaosHandicap,
      randomLineIgnore: othelloChaosRandomLineIgnore,
      overwriteLimit: othelloChaosOverwriteLimit,
      bothBlackHandicap: othelloChaosBothBlackHandicap,
      bothWhiteHandicap: othelloChaosBothWhiteHandicap,
      bothBlackOverwriteLimit: othelloChaosBothBlackOverwriteLimit,
      bothWhiteOverwriteLimit: othelloChaosBothWhiteOverwriteLimit,
      destroyLimitBlack: othelloChaosDestroyLimitBlack,
      destroyLimitWhite: othelloChaosDestroyLimitWhite,
      ...override,
    };
    const shouldRerollRandomSide = Boolean(options.rerollRandomSide);
    const effectiveTurnOrder = options.turnOrderOverride ?? othelloTurnOrder;
    const currentOrOverrideSide = options.playerSideOverride ?? othelloPlayerSide;
    const nextPlayerSide: 1 | 2 = effectiveTurnOrder === "random"
      ? shouldRerollRandomSide
        ? (Math.random() < 0.5 ? 1 : 2)
        : currentOrOverrideSide
      : effectiveTurnOrder === "white"
        ? 2
        : 1;
    const stocks = buildOthelloChaosStocks(nextChaosSettings, forceChaosMode, nextPlayerSide);

    setBoard(createInitialBoard());
    setOthelloPlayerSide(nextPlayerSide);
    setCurrentPlayer(1);
    setOthelloFixedMask(createOthelloChaosMask());
    setOthelloBrokenMask(createOthelloChaosMask());
    setOthelloOverwriteRemaining(stocks.overwrite);
    setOthelloImmutableCharges(stocks.immutable);
    setOthelloDestroyRemaining(stocks.destroy);
    setOthelloDoubleActionCharges([0, 0]);
    setOthelloImmutableArmed([false, false]);
    setOthelloDestroyArmed([false, false]);
    setOthelloDoubleArmed([false, false]);
    setOthelloDestroySelectedSacrifices([[], []]);
    setOthelloFirstCornerBonusUsed(false);
    setOthelloCornerLossStreak([0, 0]);
    setOthelloDrawVotes([]);
    setIsGameOver(false);
    setOthelloMessage(t("othelloTurnBlack"));
  };

  const finalizeOthelloDrawAgreement = useCallback(() => {
    setOthelloDrawVotes([]);
    setIsGameOver(true);
    setOthelloMessage(t("othelloDrawAgreed"));
    setMenuMessage(t("othelloDrawAgreed"));
  }, [t]);

  const openPanel = (panel: Panel) => {
    if (connectedRoomCode && roomSocketRef.current?.readyState === WebSocket.OPEN) {
      const ws = roomSocketRef.current;
      const clientId = getCurrentRoomClientId();
      const userId = getCurrentRoomUserId();
      try {
        ws.send(
          JSON.stringify({
            type: "presence",
            room: connectedRoomCode,
            from: peerIdRef.current,
            clientId,
            userId,
            panel,
            name: playerName,
            roomPublic: roomVisibility === "public",
          }),
        );
        ws.send(
          JSON.stringify({
            type: "sync-room-state",
            room: connectedRoomCode,
            from: peerIdRef.current,
            clientId,
            userId,
            panel,
            name: playerName,
          }),
        );
      } catch {
        // ignore send error
      }
      setRoomParticipants((prev) => prev.map((participant) => (
        participant.id === peerIdRef.current
          ? { ...participant, panel: normalizeRoomPanel(panel) }
          : participant
      )));
    }
    setActivePanel(panel);
    setMenuMessage("");
    if (panel !== "menu" && panel !== "scores") {
      setRoomBadgePanel(panel);
      setGameStarted((prev) => ({ ...prev, [panel]: false }));
    }
  };

  const startPanelGame = (panel: PlayablePanel, reset: () => void) => {
    if (connectedRoomCode && roomRole === "spectator") {
      setMenuMessage(t("spectatorReadOnly"));
      return;
    }
    if (connectedRoomCode && roomRole !== "host") {
      setMenuMessage(t("roomWaitHostStart"));
      return;
    }
    if (connectedRoomCode && roomRole === "host" && !roomAllReady) {
      setMenuMessage("参加者全員の準備完了後に開始できます。");
      return;
    }

    if (startCountdownTimerRef.current !== null) {
      window.clearInterval(startCountdownTimerRef.current);
      startCountdownTimerRef.current = null;
    }

    if (connectedRoomCode && roomRole === "host") {
      sendRoomEvent({ type: "room-ready-reset" });
      setRoomReadyById((prev) => {
        const next: Record<string, boolean> = {};
        Object.keys(prev).forEach((id) => {
          next[id] = false;
        });
        return next;
      });
    }

    setStartCountdownPanel(null);
    setStartCountdownSec(0);
    reset();
    setGameStarted((prev) => ({ ...prev, [panel]: true }));
  };

  const toggleRoomReady = useCallback(() => {
    if (!connectedRoomCode) return;
    if (roomRole === "spectator") {
      setMenuMessage(t("spectatorReadOnly"));
      return;
    }
    const nextReady = !Boolean(roomReadyById[peerIdRef.current]);
    setRoomReadyById((prev) => ({ ...prev, [peerIdRef.current]: nextReady }));
    sendRoomEvent({ type: "room-ready", ready: nextReady });
    setMenuMessage(nextReady ? "準備完了にしました。" : "準備を解除しました。");
  }, [connectedRoomCode, roomReadyById, roomRole, sendRoomEvent, t]);

  const openOthello = () => {
    openPanel("othello");
  };


  const openGomoku = () => {
    openPanel("gomoku");
  };

  const openChess = () => {
    openPanel("chess");
  };

  const openShogi = () => {
    openPanel("shogi");
  };

  const openMinesweeper = () => {
    openPanel("minesweeper");
  };

  const openUno = () => {
    openPanel("uno");
  };

  const openNumeron = () => {
    openPanel("numeron");
  };

  const openBlackjack = () => {
    openPanel("blackjack");
  };

  const openChinchiro = () => {
    openPanel("chinchiro");
  };

  const openSevens = () => {
    openPanel("sevens");
  };

  const openDaifugo = () => {
    openPanel("daifugo");
  };

  const openFourPanel = () => {
    openPanel("fourPanel");
  };

  const openDrawingRelay = () => {
    openPanel("drawingRelay");
  };

  const openFitPuzzle = () => {
    openPanel("fitPuzzle");
  };

  const openMahjong = () => {
    openPanel("mahjong");
  };

  const openPoker = () => {
    openPanel("poker");
  };

  const openSolitaire = () => {
    openPanel("solitaire");
  };

  const openSurvivors = () => {
    openPanel("survivors");
  };

  const languageButtons: Array<{ code: Language; labelKey: LanguageLabelKey }> = [
    { code: "ja", labelKey: "langJa" },
    { code: "ko", labelKey: "langKo" },
    { code: "en", labelKey: "langEn" },
    { code: "zh", labelKey: "langZh" },
  ];

  const menuTabCategoryLabels: Record<MenuTabCategory, string> = language === "ko"
    ? {
      menu: "메뉴",
      board: "보드게임",
      card: "카드게임",
      casino: "카지노",
      party: "퍼즐/파티",
    }
    : language === "en"
      ? {
        menu: "Menu",
        board: "Board Games",
        card: "Card Games",
        casino: "Casino",
        party: "Puzzle / Party",
      }
      : {
        menu: "メニュー",
        board: "ボードゲーム一覧",
        card: "カードゲーム一覧",
        casino: "カジノ",
        party: "パズル・パーティー",
      };

  const chinchiroTabButton: { panel: Panel; category: MenuTabCategory; label: string; onClick: () => void } = {
    panel: "chinchiro",
    category: "casino",
    label: t("tabChinchiro"),
    onClick: openChinchiro,
  };

  const menuTabButtons: Array<{ panel: Panel; category: MenuTabCategory; label: string; onClick: () => void }> = [
    { panel: "menu", category: "menu", label: t("tabMenu"), onClick: () => setActivePanel("menu") },
    { panel: "othello", category: "board", label: t("tabOthello"), onClick: openOthello },
    { panel: "gomoku", category: "board", label: t("tabGomoku"), onClick: openGomoku },
    { panel: "chess", category: "board", label: t("tabChess"), onClick: openChess },
    { panel: "shogi", category: "board", label: t("tabShogi"), onClick: openShogi },
    { panel: "uno", category: "card", label: t("tabUno"), onClick: openUno },
    { panel: "sevens", category: "card", label: t("tabSevens"), onClick: openSevens },
    { panel: "daifugo", category: "card", label: t("tabDaifugo"), onClick: openDaifugo },
    { panel: "solitaire", category: "card", label: t("tabSolitaire"), onClick: openSolitaire },
    { panel: "blackjack", category: "casino", label: t("tabBlackjack"), onClick: openBlackjack },
    { panel: "poker", category: "casino", label: t("tabPoker"), onClick: openPoker },
    ...(CHINCHIRO_VISIBLE ? [chinchiroTabButton] : []),
    { panel: "minesweeper", category: "party", label: t("tabMinesweeper"), onClick: openMinesweeper },
    { panel: "numeron", category: "party", label: t("tabNumeron"), onClick: openNumeron },
    { panel: "fitPuzzle", category: "party", label: t("tabFitPuzzle"), onClick: openFitPuzzle },
    { panel: "mahjong", category: "party", label: t("tabMahjong"), onClick: openMahjong },
    { panel: "fourPanel", category: "party", label: t("tabFourPanel"), onClick: openFourPanel },
    { panel: "drawingRelay", category: "party", label: t("tabDrawingRelay"), onClick: openDrawingRelay },
    { panel: "survivors", category: "party", label: t("tabSurvivors"), onClick: openSurvivors },
  ];

  const menuTabCategoryOrder: MenuTabCategory[] = ["menu", "board", "card", "casino", "party"];
  const menuTabGroups = menuTabCategoryOrder
    .map((category) => ({
      category,
      label: menuTabCategoryLabels[category],
      tabs: menuTabButtons.filter((button) => button.category === category),
    }))
    .filter((group) => group.tabs.length > 0);

  const menuCategoryLabels: Record<MenuCategory, string> = language === "ko"
    ? {
      board: "보드게임",
      card: "카드게임",
      casino: "카지노",
      party: "퍼즐/파티",
    }
    : language === "en"
      ? {
        board: "Board Games",
        card: "Card Games",
        casino: "Casino",
        party: "Puzzle / Party",
      }
      : {
        board: "ボードゲーム一覧",
        card: "カードゲーム一覧",
        casino: "カジノ",
        party: "パズル・パーティー",
      };

  const chinchiroGameCard: { panel: PlayablePanel; category: MenuCategory; title: string; className: string; onClick: () => void } = {
    panel: "chinchiro",
    category: "casino",
    title: t("tabChinchiro"),
    onClick: openChinchiro,
    className: "rounded-xl border border-fuchsia-200/30 bg-fuchsia-400/10 p-4 text-left",
  };

  const menuGameCards: Array<{ panel: PlayablePanel; category: MenuCategory; title: string; className: string; onClick: () => void }> = [
    { panel: "othello", category: "board", title: t("gameOthello"), onClick: openOthello, className: "rounded-xl border border-emerald-200/30 bg-emerald-400/10 p-4 text-left" },
    { panel: "gomoku", category: "board", title: t("gameGomoku"), onClick: openGomoku, className: "rounded-xl border border-lime-200/30 bg-lime-400/10 p-4 text-left" },
    { panel: "chess", category: "board", title: t("gameChess"), onClick: openChess, className: "rounded-xl border border-slate-200/20 bg-slate-400/10 p-4 text-left" },
    { panel: "shogi", category: "board", title: t("gameShogi"), onClick: openShogi, className: "rounded-xl border border-slate-200/20 bg-slate-400/10 p-4 text-left" },
    { panel: "uno", category: "card", title: t("tabUno"), onClick: openUno, className: "rounded-xl border border-cyan-200/30 bg-cyan-400/10 p-4 text-left" },
    { panel: "sevens", category: "card", title: t("tabSevens"), onClick: openSevens, className: "rounded-xl border border-violet-200/30 bg-violet-400/10 p-4 text-left" },
    { panel: "daifugo", category: "card", title: t("tabDaifugo"), onClick: openDaifugo, className: "rounded-xl border border-orange-200/30 bg-orange-400/10 p-4 text-left" },
    { panel: "solitaire", category: "card", title: t("tabSolitaire"), onClick: openSolitaire, className: "rounded-xl border border-amber-200/30 bg-amber-400/10 p-4 text-left" },
    { panel: "blackjack", category: "casino", title: t("tabBlackjack"), onClick: openBlackjack, className: "rounded-xl border border-rose-200/30 bg-rose-400/10 p-4 text-left" },
    { panel: "poker", category: "casino", title: t("tabPoker"), onClick: openPoker, className: "rounded-xl border border-rose-200/30 bg-rose-400/10 p-4 text-left" },
    ...(CHINCHIRO_VISIBLE ? [chinchiroGameCard] : []),
    { panel: "minesweeper", category: "party", title: t("tabMinesweeper"), onClick: openMinesweeper, className: "rounded-xl border border-teal-200/30 bg-teal-400/10 p-4 text-left" },
    { panel: "numeron", category: "party", title: t("tabNumeron"), onClick: openNumeron, className: "rounded-xl border border-amber-200/30 bg-amber-400/10 p-4 text-left" },
    { panel: "fitPuzzle", category: "party", title: t("tabFitPuzzle"), onClick: openFitPuzzle, className: "rounded-xl border border-pink-200/30 bg-pink-400/10 p-4 text-left" },
    { panel: "mahjong", category: "party", title: t("tabMahjong"), onClick: openMahjong, className: "rounded-xl border border-red-200/30 bg-red-400/10 p-4 text-left" },
    { panel: "fourPanel", category: "party", title: t("tabFourPanel"), onClick: openFourPanel, className: "rounded-xl border border-sky-200/30 bg-sky-400/10 p-4 text-left" },
    { panel: "drawingRelay", category: "party", title: t("tabDrawingRelay"), onClick: openDrawingRelay, className: "rounded-xl border border-indigo-200/30 bg-indigo-400/10 p-4 text-left" },
    { panel: "survivors", category: "party", title: t("tabSurvivors"), onClick: openSurvivors, className: "rounded-xl border border-emerald-200/30 bg-emerald-400/10 p-4 text-left" },
  ];

  const menuCategoryOrder: MenuCategory[] = ["board", "card", "casino", "party"];
  const menuGameCardGroups = menuCategoryOrder
    .map((category) => ({
      category,
      label: menuCategoryLabels[category],
      cards: menuGameCards.filter((card) => card.category === category),
    }))
    .filter((group) => group.cards.length > 0);

  const toggleMenuTabGroup = (category: MenuTabCategory) => {
    setMenuTabOpenState((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const toggleMenuCardGroup = (category: MenuCategory) => {
    setMenuCardOpenState((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const onJoinRoom = (code: string) => {
    if (!code.trim()) {
      setMenuMessage(t("roomSelectRequired"));
      return false;
    }
    setMenuMessage(tf("roomJoinPreparing", { code: code.trim() }));
    return true;
  };

  const closeRoomSocket = useCallback(() => {
    if (inviteTokenResolveRef.current) {
      inviteTokenResolveRef.current("");
      inviteTokenResolveRef.current = null;
    }
    const ws = roomSocketRef.current;
    roomSocketRef.current = null;
    if (!ws) return;
    try {
      ws.close();
    } catch {
      // ignore close error
    }
  }, []);

  const handleBackToMenuClick = useCallback(() => {
    const fallbackLobbyCode = menuRootRoomCode && connectedRoomCode && menuRootRoomCode !== connectedRoomCode
      ? menuRootRoomCode
      : "";
    const returnTargetCode = currentRoomParentCode || fallbackLobbyCode;
    if (activePanel === "fitPuzzle") {
      if (returnTargetCode) {
        setPendingLobbyReturnCode(returnTargetCode);
        sendRoomEvent({ type: "return-lobby" });
      }
      setActivePanel("menu");
      return;
    }
    if (!window.confirm(t("backToMenuConfirm"))) return;
    if (returnTargetCode) {
      setPendingLobbyReturnCode(returnTargetCode);
      sendRoomEvent({ type: "return-lobby" });
    }
    setActivePanel("menu");
  }, [activePanel, connectedRoomCode, currentRoomParentCode, menuRootRoomCode, sendRoomEvent, t]);

  const handleBackToMenuDirect = useCallback(() => {
    const fallbackLobbyCode = menuRootRoomCode && connectedRoomCode && menuRootRoomCode !== connectedRoomCode
      ? menuRootRoomCode
      : "";
    const returnTargetCode = currentRoomParentCode || fallbackLobbyCode;
    if (returnTargetCode) {
      setPendingLobbyReturnCode(returnTargetCode);
      sendRoomEvent({ type: "return-lobby" });
    }
    setActivePanel("menu");
  }, [connectedRoomCode, currentRoomParentCode, menuRootRoomCode, sendRoomEvent]);

  const normalizePublicRoomSummary = useCallback((value: unknown): PublicRoomSummary | null => {
    if (!value || typeof value !== "object") return null;
    const row = value as Record<string, unknown>;
    const code = String(row.code || "").replace(/\D/g, "").slice(0, 6);
    if (code.length !== 6) return null;
    const rawPanels = Array.isArray(row.panels) ? row.panels : [];
    const panels = rawPanels
      .map((panel) => normalizeRoomPanel(panel))
      .filter((panel): panel is PlayablePanel => Boolean(panel));
    const rawListContext = String(row.listContext || "").trim().toLowerCase();
    const listContext: "menu" | "game" = rawListContext === "game" ? "game" : "menu";
    return {
      code,
      listContext,
      isPublic: Boolean(row.isPublic ?? true),
      inGame: Boolean(row.inGame),
      activePlayers: Math.max(0, Math.min(16, Number(row.activePlayers) || 0)),
      spectatorCount: Math.max(0, Math.min(16, Number(row.spectatorCount) || 0)),
      totalParticipants: Math.max(0, Math.min(16, Number(row.totalParticipants) || 0)),
      hostName: String(row.hostName || "").trim(),
      guestName: String(row.guestName || "").trim(),
      panels,
    };
  }, [normalizeRoomPanel]);

  const applyPublicRoomList = useCallback((target: "menu" | "panel", roomsRaw: unknown[]) => {
    const normalizedRooms = roomsRaw
      .map((row) => normalizePublicRoomSummary(row))
      .filter((row): row is PublicRoomSummary => Boolean(row));
    const nextRooms = target === "menu"
      ? normalizedRooms.filter((room) => room.listContext === "menu")
      : normalizedRooms.filter((room) => room.listContext === "game");
    if (target === "menu") {
      setMenuPublicRooms(nextRooms);
      setSelectedMenuPublicRoomCode((prev) => {
        if (prev && nextRooms.some((room) => room.code === prev)) return prev;
        return nextRooms[0]?.code || "";
      });
      setIsMenuPublicRoomsLoading(false);
      return;
    }
    setPanelPublicRooms(nextRooms);
    setSelectedPanelPublicRoomCode((prev) => {
      if (prev && nextRooms.some((room) => room.code === prev)) return prev;
      return nextRooms[0]?.code || "";
    });
    setIsPanelPublicRoomsLoading(false);
  }, [normalizePublicRoomSummary]);

  const requestPublicRoomList = useCallback((target: "menu" | "panel", silent = false) => {
    const requestPayload = {
      type: "list-rooms",
      listContext: target === "menu" ? "menu" : "game",
      from: peerIdRef.current,
      clientId: getCurrentRoomClientId(),
      userId: getCurrentRoomUserId(),
      panel: getCurrentRoomPanel(),
      name: playerName,
    };

    const activeWs = roomSocketRef.current;
    if (activeWs && activeWs.readyState === WebSocket.OPEN) {
      if (!silent) {
        if (target === "menu") setIsMenuPublicRoomsLoading(true);
        else setIsPanelPublicRoomsLoading(true);
      }
      try {
        activeWs.send(JSON.stringify(requestPayload));
      } catch {
        if (!silent) {
          if (target === "menu") setIsMenuPublicRoomsLoading(false);
          else setIsPanelPublicRoomsLoading(false);
        }
      }
      return;
    }

    const wsUrl = getAutoRoomServerUrl();
    let listWs: WebSocket;
    if (!silent) {
      if (target === "menu") setIsMenuPublicRoomsLoading(true);
      else setIsPanelPublicRoomsLoading(true);
    }
    try {
      listWs = new WebSocket(wsUrl);
    } catch {
      if (!silent) {
        if (target === "menu") setIsMenuPublicRoomsLoading(false);
        else setIsPanelPublicRoomsLoading(false);
      }
      return;
    }

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      if (!silent) {
        if (target === "menu") setIsMenuPublicRoomsLoading(false);
        else setIsPanelPublicRoomsLoading(false);
      }
      try {
        listWs.close();
      } catch {
        // ignore close error
      }
    };

    const timeout = window.setTimeout(() => {
      finish();
    }, 4000);

    listWs.onopen = () => {
      try {
        listWs.send(JSON.stringify(requestPayload));
      } catch {
        window.clearTimeout(timeout);
        finish();
      }
    };

    listWs.onmessage = (event) => {
      try {
        const payload = JSON.parse(String(event.data || "{}"));
        if (String(payload?.type || "") === "rooms-list" && Array.isArray(payload.rooms)) {
          applyPublicRoomList(target, payload.rooms as unknown[]);
        }
      } catch {
        // ignore parse error
      } finally {
        window.clearTimeout(timeout);
        finish();
      }
    };

    listWs.onerror = () => {
      window.clearTimeout(timeout);
      finish();
    };

    listWs.onclose = () => {
      window.clearTimeout(timeout);
      finish();
    };
  }, [applyPublicRoomList, getCurrentRoomClientId, getCurrentRoomPanel, getCurrentRoomUserId, playerName]);

  const applySurrenderToPanel = useCallback((panel: PlayablePanel, loserName: string) => {
    if (startCountdownTimerRef.current !== null) {
      window.clearInterval(startCountdownTimerRef.current);
      startCountdownTimerRef.current = null;
    }
    setStartCountdownPanel(null);
    setStartCountdownSec(0);
    setGameStarted((prev) => ({ ...prev, [panel]: false }));
    const message = tf("roomSurrendered", { name: loserName || "Player" });
    if (panel === "othello") {
      setIsGameOver(true);
      setOthelloMessage(message);
      return;
    }
    if (panel === "gomoku") {
      setIsGomokuOver(true);
      setGomokuMessage(message);
      return;
    }
    if (panel === "chess") {
      setIsChessOver(true);
      setChessMessage(message);
      return;
    }
    if (panel === "shogi") {
      setIsShogiOver(true);
      setShogiMessage(message);
      return;
    }
    if (panel === "minesweeper") {
      setIsMineOver(true);
      setMineMessage(message);
      return;
    }
    if (panel === "numeron") {
      setIsNumeronOver(true);
      setNumeronMessage(message);
      return;
    }
    if (panel === "blackjack") {
      setIsBlackjackOver(true);
      setBlackjackMessage(message);
      return;
    }
    if (panel === "chinchiro") {
      setIsChinchiroOver(true);
      setChinchiroMessage(message);
      return;
    }
    if (panel === "sevens") {
      setIsSevensOver(true);
      setSevensMessage(message);
      return;
    }
    if (panel === "daifugo") {
      setIsDaifugoOver(true);
      setDaifugoMessage(message);
      return;
    }
    if (panel === "fourPanel") {
      setFourPanelMessage(message);
      return;
    }
    if (panel === "drawingRelay") {
      setDrawingRelayMessage(message);
      return;
    }
    if (panel === "fitPuzzle") {
      setIsFitPuzzleOver(true);
      setFitPuzzleMessage(message);
      return;
    }
    if (panel === "mahjong") {
      setIsMahjongOver(true);
      setMahjongMessage(message);
      return;
    }
    if (panel === "poker") {
      setPokerPhase("showdown");
      setPokerMessage(message);
      return;
    }
    if (panel === "solitaire") {
      setIsSolitaireOver(true);
      setSolitaireMessage(message);
      return;
    }
    if (panel === "survivors") {
      setIsSurvivorsOver(true);
      setSurvivorsMessage(message);
      return;
    }
    if (panel === "uno") {
      setIsUnoOver(true);
      setUnoMessage(message);
    }
  }, [tf]);

  const runWithResetGuard = useCallback((panel: PlayablePanel, action: () => void) => {
    const isRoomPvp = Boolean(connectedRoomCode) && roomRole !== "spectator";
    if (isRoomPvp) {
      if (!window.confirm(t("roomSurrenderConfirm"))) return;
      applySurrenderToPanel(panel, playerName);
      setMenuMessage(tf("roomSurrendered", { name: playerName }));
      sendRoomEvent({
        type: "match-surrender",
        panel,
        loserId: peerIdRef.current,
        loserName: playerName,
      });
      return;
    }
    runWithLocalResetConfirm(() => {
      if (startCountdownTimerRef.current !== null) {
        window.clearInterval(startCountdownTimerRef.current);
        startCountdownTimerRef.current = null;
      }
      setStartCountdownPanel(null);
      setStartCountdownSec(0);
      setGameStarted((prev) => ({ ...prev, [panel]: false }));
      action();
    });
  }, [applySurrenderToPanel, connectedRoomCode, playerName, roomRole, runWithLocalResetConfirm, sendRoomEvent, t, tf]);

  const applyArcadeSnapshot = useCallback((snapshot: Record<string, unknown>) => {
    const state = snapshot?.state as Record<string, unknown> | undefined;
    if (!state) return;

    // Keep per-client panel selection independent while connected to a room.
    if (state.activePanel && !connectedRoomCode) setActivePanel(state.activePanel as Panel);
    const shouldApplySharedStartState = !connectedRoomCode;
    if (shouldApplySharedStartState) {
      if (state.gameStarted && typeof state.gameStarted === "object") {
        setGameStarted((state.gameStarted as Record<PlayablePanel, boolean>));
      }
      if (
        state.startCountdownPanel === null
        || state.startCountdownPanel === "othello"
        || state.startCountdownPanel === "gomoku"
        || state.startCountdownPanel === "chess"
        || state.startCountdownPanel === "shogi"
        || state.startCountdownPanel === "uno"
        || state.startCountdownPanel === "minesweeper"
        || state.startCountdownPanel === "numeron"
        || state.startCountdownPanel === "blackjack"
        || state.startCountdownPanel === "chinchiro"
        || state.startCountdownPanel === "sevens"
        || state.startCountdownPanel === "daifugo"
        || state.startCountdownPanel === "fourPanel"
        || state.startCountdownPanel === "drawingRelay"
        || state.startCountdownPanel === "fitPuzzle"
        || state.startCountdownPanel === "mahjong"
        || state.startCountdownPanel === "poker"
        || state.startCountdownPanel === "solitaire"
        || state.startCountdownPanel === "survivors"
      ) {
        setStartCountdownPanel((state.startCountdownPanel ?? null) as PlayablePanel | null);
      }
      if (Number.isFinite(state.startCountdownSec)) {
        setStartCountdownSec(Math.max(0, Math.floor(Number(state.startCountdownSec))));
      }
    }

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
    if (state.othelloMode === "cpu" || state.othelloMode === "cpuvscpu" || state.othelloMode === "local" || state.othelloMode === "chaos") {
      setOthelloMode(state.othelloMode as OthelloMode);
    }
    if (state.othelloCpuLevel === "easy" || state.othelloCpuLevel === "normal" || state.othelloCpuLevel === "hard") {
      setOthelloCpuLevel(state.othelloCpuLevel as OthelloCpuLevel);
    }
    if (state.othelloTurnOrder === "black" || state.othelloTurnOrder === "white" || state.othelloTurnOrder === "random") {
      setOthelloTurnOrder(state.othelloTurnOrder as OthelloTurnOrder);
    } else if (state.othelloPlayerSide === 1 || state.othelloPlayerSide === 2) {
      setOthelloTurnOrder((state.othelloPlayerSide as 1 | 2) === 1 ? "black" : "white");
    }
    if (state.othelloPlayerSide === 1 || state.othelloPlayerSide === 2) {
      setOthelloPlayerSide(state.othelloPlayerSide as 1 | 2);
    }
    if (
      state.othelloChaosTarget === "none"
      || state.othelloChaosTarget === "black"
      || state.othelloChaosTarget === "white"
      || state.othelloChaosTarget === "both"
      || state.othelloChaosTarget === "player"
      || state.othelloChaosTarget === "opponent"
    ) {
      setOthelloChaosTarget(state.othelloChaosTarget as OthelloChaosTarget);
    }
    if (state.othelloChaosHandicap === "none" || state.othelloChaosHandicap === "immutable1") {
      setOthelloChaosHandicap(state.othelloChaosHandicap as OthelloChaosHandicap);
    }
    if (state.othelloChaosRandomLineIgnore === "off" || state.othelloChaosRandomLineIgnore === "on") {
      setOthelloChaosRandomLineIgnore(state.othelloChaosRandomLineIgnore as OthelloChaosToggle);
    }
    if (Number.isFinite(state.othelloChaosOverwriteLimit)) {
      setOthelloChaosOverwriteLimit(Number(state.othelloChaosOverwriteLimit));
    }
    if (state.othelloChaosBothBlackHandicap === "none" || state.othelloChaosBothBlackHandicap === "immutable1") {
      setOthelloChaosBothBlackHandicap(state.othelloChaosBothBlackHandicap as OthelloChaosHandicap);
    }
    if (state.othelloChaosBothWhiteHandicap === "none" || state.othelloChaosBothWhiteHandicap === "immutable1") {
      setOthelloChaosBothWhiteHandicap(state.othelloChaosBothWhiteHandicap as OthelloChaosHandicap);
    }
    if (Number.isFinite(state.othelloChaosBothBlackOverwriteLimit)) {
      setOthelloChaosBothBlackOverwriteLimit(Number(state.othelloChaosBothBlackOverwriteLimit));
    }
    if (Number.isFinite(state.othelloChaosBothWhiteOverwriteLimit)) {
      setOthelloChaosBothWhiteOverwriteLimit(Number(state.othelloChaosBothWhiteOverwriteLimit));
    }
    if (Number.isFinite(state.othelloChaosDestroyLimitBlack)) {
      setOthelloChaosDestroyLimitBlack(Number(state.othelloChaosDestroyLimitBlack));
    }
    if (Number.isFinite(state.othelloChaosDestroyLimitWhite)) {
      setOthelloChaosDestroyLimitWhite(Number(state.othelloChaosDestroyLimitWhite));
    }
    if (typeof state.othelloMessage === "string") setOthelloMessage(state.othelloMessage);
    if (typeof state.isGameOver === "boolean") setIsGameOver(state.isGameOver);

    if (Array.isArray(state.gomokuBoard)) setGomokuBoard(state.gomokuBoard as Cell[][]);
    if (state.gomokuMode === "local" || state.gomokuMode === "cpu") setGomokuMode(state.gomokuMode as GomokuMode);
    if (state.gomokuCpuLevel === "easy" || state.gomokuCpuLevel === "normal" || state.gomokuCpuLevel === "hard") {
      setGomokuCpuLevel(state.gomokuCpuLevel as GomokuCpuLevel);
    }
    if (state.gomokuTurnOrder === "black" || state.gomokuTurnOrder === "white" || state.gomokuTurnOrder === "random") {
      setGomokuTurnOrder(state.gomokuTurnOrder as GomokuTurnOrder);
    }
    if (state.gomokuPlayerSide === 1 || state.gomokuPlayerSide === 2) {
      setGomokuPlayerSide(state.gomokuPlayerSide as 1 | 2);
    }
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
    if (state.shogiMode === "local" || state.shogiMode === "cpu" || state.shogiMode === "chaos") {
      setShogiMode(state.shogiMode as ShogiMode);
    }
    if (state.shogiCpuLevel === "easy" || state.shogiCpuLevel === "normal" || state.shogiCpuLevel === "hard") {
      setShogiCpuLevel(state.shogiCpuLevel as ShogiCpuLevel);
    }
    if (state.shogiTurnOrder === "black" || state.shogiTurnOrder === "white" || state.shogiTurnOrder === "random") {
      setShogiTurnOrder(state.shogiTurnOrder as ShogiTurnOrder);
    }
    if (state.shogiPlayerSide === "b" || state.shogiPlayerSide === "w") {
      setShogiPlayerSide(state.shogiPlayerSide as ShogiColor);
    }
    if (state.shogiTurn === "b" || state.shogiTurn === "w") setShogiTurn(state.shogiTurn as ShogiColor);
    if (state.selectedShogi === null || typeof state.selectedShogi === "object") {
      setSelectedShogi(state.selectedShogi as { row: number; col: number } | null);
    }
    if (typeof state.shogiMessage === "string") setShogiMessage(state.shogiMessage);
    if (typeof state.isShogiOver === "boolean") setIsShogiOver(state.isShogiOver);

    if (Array.isArray(state.mineBoard)) setMineBoard(state.mineBoard as MineCell[][]);
    if (typeof state.mineMessage === "string") setMineMessage(state.mineMessage);
    if (typeof state.isMineOver === "boolean") setIsMineOver(state.isMineOver);

    const shouldApplyNumeronSync = !connectedRoomCode;
    if (shouldApplyNumeronSync) {
      if (typeof state.numeronSecret === "string") setNumeronSecret(state.numeronSecret);
      setNumeronDigitCount(normalizeNumeronDigitCount(state.numeronDigitCount));
      {
        const count = normalizeNumeronDigitCount(state.numeronDigitCount);
        setNumeronSecretDraft(normalizeNumeronDigitDraft(state.numeronSecretDraft ?? state.numeronSecretInput, count));
      }
      if (typeof state.isNumeronSecretConfirmed === "boolean") {
        setIsNumeronSecretConfirmed(state.isNumeronSecretConfirmed);
      } else {
        const restoredCount = normalizeNumeronDigitCount(state.numeronDigitCount);
        const restoredSecret = typeof state.numeronSecret === "string" ? state.numeronSecret : "";
        const restoredHistory = Array.isArray(state.numeronHistory) ? (state.numeronHistory as NumeronHistory[]) : [];
        setIsNumeronSecretConfirmed(isValidNumeronCode(restoredSecret, restoredCount) || restoredHistory.length > 0);
      }
      if (typeof state.isNumeronSecretPanelOpen === "boolean") {
        setIsNumeronSecretPanelOpen(state.isNumeronSecretPanelOpen);
      }
      if (Array.isArray(state.numeronDraft)) setNumeronDraft(state.numeronDraft as string[]);
      if (Array.isArray(state.numeronHistory)) setNumeronHistory(state.numeronHistory as NumeronHistory[]);
      if (Array.isArray(state.numeronEnemyHistory)) setNumeronEnemyHistory(state.numeronEnemyHistory as NumeronHistory[]);
      if (typeof state.isNumeronEnemyHistoryOpen === "boolean") setIsNumeronEnemyHistoryOpen(state.isNumeronEnemyHistoryOpen);
      if (/^\d$/.test(String(state.numeronHintDigit ?? ""))) setNumeronHintDigit(String(state.numeronHintDigit));
      if (state.numeronAssistCharges && typeof state.numeronAssistCharges === "object") {
        const charges = state.numeronAssistCharges as { highlow?: unknown; reveal?: unknown };
        setNumeronAssistCharges({
          highlow: typeof charges.highlow === "number" ? Math.max(0, Math.floor(charges.highlow)) : 1,
          reveal: typeof charges.reveal === "number" ? Math.max(0, Math.floor(charges.reveal)) : 1,
        });
      }
      if (typeof state.isNumeronOver === "boolean") setIsNumeronOver(state.isNumeronOver);
      if (typeof state.numeronMessage === "string") setNumeronMessage(state.numeronMessage);
    }

    if (Array.isArray(state.blackjackDeck)) setBlackjackDeck(state.blackjackDeck as BlackjackCard[]);
    if (Array.isArray(state.blackjackPlayerHand)) setBlackjackPlayerHand(state.blackjackPlayerHand as BlackjackCard[]);
    if (Array.isArray(state.blackjackDealerHand)) setBlackjackDealerHand(state.blackjackDealerHand as BlackjackCard[]);
    if (typeof state.blackjackBet === "number") setBlackjackBet(Math.max(MIN_CASINO_BET, Math.floor(state.blackjackBet)));
    if (typeof state.blackjackWager === "number") setBlackjackWager(Math.max(0, Math.floor(state.blackjackWager)));
    if (typeof state.blackjackMessage === "string") setBlackjackMessage(state.blackjackMessage);
    if (typeof state.isBlackjackOver === "boolean") setIsBlackjackOver(state.isBlackjackOver);

    if (state.chinchiroPlayerDice === null || Array.isArray(state.chinchiroPlayerDice)) {
      setChinchiroPlayerDice(state.chinchiroPlayerDice as [number, number, number] | null);
    }
    if (state.chinchiroDealerDice === null || Array.isArray(state.chinchiroDealerDice)) {
      setChinchiroDealerDice(state.chinchiroDealerDice as [number, number, number] | null);
    }
    if (typeof state.chinchiroBet === "number") setChinchiroBet(Math.max(MIN_CASINO_BET, Math.floor(state.chinchiroBet)));
    if (typeof state.chinchiroWager === "number") setChinchiroWager(Math.max(0, Math.floor(state.chinchiroWager)));
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

    if (Array.isArray(state.mahjongBoard)) {
      const parsedHand = sortMahjongTiles(normalizeMahjongTileList(state.mahjongBoard));
      if (parsedHand.length === 13 || parsedHand.length === 14) {
        setMahjongBoard(parsedHand);
      }
    }
    if (Array.isArray(state.mahjongWall)) {
      const parsedWall = normalizeMahjongTileList(state.mahjongWall);
      setMahjongWall(parsedWall);
    }
    if (Array.isArray(state.mahjongRiver)) {
      const parsedRiver = normalizeMahjongTileList(state.mahjongRiver);
      setMahjongRiver(parsedRiver);
    }
    if (state.mahjongSelected === null || typeof state.mahjongSelected === "number") {
      setMahjongSelected(state.mahjongSelected as number | null);
    }
    if (state.mahjongLastDraw === null || typeof state.mahjongLastDraw === "number") {
      setMahjongLastDraw(state.mahjongLastDraw as MahjongCell | null);
    }
    if (state.mahjongRoundWind === "東" || state.mahjongRoundWind === "南" || state.mahjongRoundWind === "西" || state.mahjongRoundWind === "北") {
      setMahjongRoundWind(state.mahjongRoundWind);
    }
    if (typeof state.mahjongRoundNumber === "number") {
      const nextRound = Math.max(1, Math.min(4, Math.floor(state.mahjongRoundNumber)));
      setMahjongRoundNumber(nextRound);
    }
    if (state.mahjongSeatWind === "東" || state.mahjongSeatWind === "南" || state.mahjongSeatWind === "西" || state.mahjongSeatWind === "北") {
      setMahjongSeatWind(state.mahjongSeatWind);
    }
    if (typeof state.mahjongHonba === "number") {
      setMahjongHonba(Math.max(0, Math.floor(state.mahjongHonba)));
    }
    if (typeof state.mahjongKyotaku === "number") {
      setMahjongKyotaku(Math.max(0, Math.floor(state.mahjongKyotaku)));
    }
    if (state.mahjongRiichiTileIndex === null || typeof state.mahjongRiichiTileIndex === "number") {
      setMahjongRiichiTileIndex(state.mahjongRiichiTileIndex as number | null);
    }
    if (state.mahjongDoraIndicator === null || typeof state.mahjongDoraIndicator === "number") {
      setMahjongDoraIndicator(state.mahjongDoraIndicator as MahjongCell | null);
    }
    if (state.mahjongWinSummary === null || typeof state.mahjongWinSummary === "object") {
      setMahjongWinSummary(state.mahjongWinSummary as MahjongWinSummary | null);
    }
    if (typeof state.mahjongMessage === "string") setMahjongMessage(state.mahjongMessage);
    if (typeof state.isMahjongOver === "boolean") setIsMahjongOver(state.isMahjongOver);

    if (Array.isArray(state.pokerDeck)) setPokerDeck(state.pokerDeck as PokerCard[]);
    if (Array.isArray(state.pokerPlayerHand)) setPokerPlayerHand(state.pokerPlayerHand as PokerCard[]);
    if (Array.isArray(state.pokerCpuHand)) setPokerCpuHand(state.pokerCpuHand as PokerCard[]);
    if (Array.isArray(state.pokerCommunity)) setPokerCommunity(state.pokerCommunity as PokerCard[]);
    if (typeof state.pokerBet === "number") setPokerBet(Math.max(MIN_CASINO_BET, Math.floor(state.pokerBet)));
    if (typeof state.pokerWager === "number") setPokerWager(Math.max(0, Math.floor(state.pokerWager)));
    if (Array.isArray(state.pokerHold)) setPokerHold(state.pokerHold as boolean[]);
    if (
      state.pokerPhase === "betting"
      || state.pokerPhase === "preflop"
      || state.pokerPhase === "flop"
      || state.pokerPhase === "turn"
      || state.pokerPhase === "river"
      || state.pokerPhase === "showdown"
    ) {
      setPokerPhase(state.pokerPhase as PokerPhase);
    }
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
    if (typeof state.casinoBankroll === "number") setCasinoBankroll(Math.max(0, Math.floor(state.casinoBankroll)));

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
    if (Array.isArray(state.unoLocalHands)) setUnoLocalHands(state.unoLocalHands as UnoCard[][]);
    if (typeof state.unoRoomCpuCount === "number") setUnoRoomCpuCount(Math.max(0, Math.min(6, Math.trunc(state.unoRoomCpuCount))));
    if (typeof state.unoLocalTurnIndex === "number") setUnoLocalTurnIndex(Math.max(0, Math.trunc(state.unoLocalTurnIndex)));
    if (state.unoTopCard === null || typeof state.unoTopCard === "object") setUnoTopCard(state.unoTopCard as UnoCard | null);
    if (state.unoTurn === "player" || state.unoTurn === "cpu") setUnoTurn(state.unoTurn as "player" | "cpu");
    if (typeof state.unoMessage === "string") setUnoMessage(state.unoMessage);
    if (typeof state.isUnoOver === "boolean") setIsUnoOver(state.isUnoOver);
  }, [connectedRoomCode, roomRole]);

  const connectRoom = useCallback(
    (
      requestedCode: string,
      createIfEmpty: boolean,
      options?: {
        quickJoin?: boolean;
        spectate?: boolean;
        roomPublic?: boolean;
        inviteToken?: string;
        panelOverride?: PlayablePanel | "";
        createRoom?: boolean;
        sourceRoomCode?: string;
        listContextOverride?: "menu" | "game";
        serverAllocateCode?: boolean;
      },
    ) => {
      const quickJoin = Boolean(options?.quickJoin);
      const normalizedCode = requestedCode.replace(/[^0-9]/g, "").slice(0, 6);
      const shouldUseServerAllocatedCode = Boolean(options?.createRoom && options?.serverAllocateCode);
      const code = quickJoin
        ? normalizedCode
        : (normalizedCode || ((createIfEmpty && !shouldUseServerAllocatedCode) ? allocateClientRoomCode() : ""));
      if (!quickJoin && !code && !Boolean(options?.createRoom)) {
        setMenuMessage(t("roomCodeRequired"));
        return;
      }

      closeRoomSocket();
      setConnectedRoomCode("");
      setRoomReadyById({});
      setRoomParticipants([]);
      setRoomRole("");
      setOthelloDrawVotes([]);
      setRoomChatMessages([]);
      setSpectatorChatMessages([]);
      setRoomStatus(t("roomStateConnecting"));

      const wsUrl = getAutoRoomServerUrl();
      const connectFailedMessage = `${t("roomConnectFailed")} (${wsUrl})`;
      let ws: WebSocket;
      try {
        ws = new WebSocket(wsUrl);
      } catch {
        setQuickMatchMode(false);
        setRoomStatus(t("roomStateConnectFailed"));
        setMenuMessage(connectFailedMessage);
        return;
      }

      roomSocketRef.current = ws;
      const isCurrentSocket = () => roomSocketRef.current === ws;
      let hasOpened = false;
      let retriedRoomRequiredOnCreate = false;
      let hasQuickMatchResolved = false;
      const connectTimeout = window.setTimeout(() => {
        if (!isCurrentSocket()) return;
        if (hasOpened) return;
        try {
          ws.close();
        } catch {
          // ignore close error
        }
        setQuickMatchMode(false);
        setRoomStatus(t("roomStateConnectFailed"));
        setMenuMessage(connectFailedMessage);
      }, 6000);

      ws.onopen = () => {
        if (!isCurrentSocket()) {
          try {
            ws.close();
          } catch {
            // ignore close error
          }
          return;
        }
        hasOpened = true;
        window.clearTimeout(connectTimeout);
        setRoomStatus(t("roomStateConnected"));
        if (code) {
          setRoomCode(code);
        }
        try {
          const payload: Record<string, unknown> = {
            type: quickJoin ? "quick-join" : "hello",
            from: peerIdRef.current,
            clientId: getCurrentRoomClientId(),
            userId: getCurrentRoomUserId(),
            panel: options?.panelOverride ?? getCurrentRoomPanel(),
            name: playerName,
            roomPublic: Boolean(options?.roomPublic ?? (roomVisibility === "public")),
            spectate: Boolean(options?.spectate),
            create: Boolean(options?.createRoom),
            inviteToken: String(options?.inviteToken || "").trim(),
          };
          if (options?.listContextOverride === "menu" || options?.listContextOverride === "game") {
            payload.listContext = options.listContextOverride;
          }
          const sourceRoomCode = String(options?.sourceRoomCode || "").replace(/[^0-9]/g, "").slice(0, 6);
          if (sourceRoomCode) {
            payload.sourceRoom = sourceRoomCode;
          }
          if (code) {
            payload.room = code;
          }
          ws.send(JSON.stringify(payload));
        } catch {
          if (quickJoin) {
            setQuickMatchMode(false);
            setMenuMessage(t("roomListEmpty"));
          }
        }
      };

      ws.onmessage = (event) => {
        if (!isCurrentSocket()) return;
        try {
          const payload = JSON.parse(String(event.data || "{}"));
          const type = String(payload?.type || "");

          if (type === "rooms-list") {
            if (Array.isArray(payload.rooms)) {
              const listContext = String(payload.listContext || "").trim().toLowerCase();
              if (listContext === "menu") {
                applyPublicRoomList("menu", payload.rooms as unknown[]);
              } else if (listContext === "game") {
                applyPublicRoomList("panel", payload.rooms as unknown[]);
              } else {
                applyPublicRoomList("menu", payload.rooms as unknown[]);
                applyPublicRoomList("panel", payload.rooms as unknown[]);
              }
            } else {
              setIsMenuPublicRoomsLoading(false);
              setIsPanelPublicRoomsLoading(false);
            }
            return;
          }

          if (type === "arcade-sync") {
            if (String(payload?.from || "") === peerIdRef.current) {
              return;
            }
            const incomingPanel = String((payload?.snapshot as { state?: { activePanel?: unknown } } | undefined)?.state?.activePanel || "");
            if (isNumeronSessionActiveRef.current || incomingPanel === "numeron") {
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

          if (type === "match-surrender") {
            if (String(payload?.from || "") === peerIdRef.current) {
              return;
            }
            const panelText = String(payload?.panel || "");
            const panel = (
              panelText === "othello"
              || panelText === "gomoku"
              || panelText === "chess"
              || panelText === "shogi"
              || panelText === "uno"
              || panelText === "minesweeper"
              || panelText === "numeron"
              || panelText === "blackjack"
              || panelText === "chinchiro"
              || panelText === "sevens"
              || panelText === "daifugo"
              || panelText === "fourPanel"
              || panelText === "drawingRelay"
              || panelText === "fitPuzzle"
              || panelText === "mahjong"
              || panelText === "poker"
              || panelText === "solitaire"
              || panelText === "survivors"
            )
              ? panelText as PlayablePanel
              : activePanel === "menu" || activePanel === "scores"
                ? "othello"
                : activePanel;
            const loserName = String(payload?.loserName || "Opponent").trim() || "Opponent";
            applySurrenderToPanel(panel, loserName);
            setMenuMessage(tf("roomSurrendered", { name: loserName }));
            return;
          }

          if (type === "draw-vote") {
            const from = String(payload?.from || "");
            if (!from || from === peerIdRef.current) return;
            setOthelloDrawVotes((prev) => (prev.includes(from) ? prev : [...prev, from]));
            setMenuMessage(t("othelloDrawRequestPending"));
            return;
          }

          if (type === "draw-unvote") {
            const from = String(payload?.from || "");
            if (!from || from === peerIdRef.current) return;
            setOthelloDrawVotes((prev) => prev.filter((vote) => vote !== from));
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
            hasQuickMatchResolved = true;
            const assignedCode = String(payload.code || "").replace(/\D/g, "").slice(0, 6);
            if (assignedCode) {
              setConnectedRoomCode(assignedCode);
              setRoomCode(assignedCode);
              const payloadListContextRaw = String(payload.listContext || "").trim().toLowerCase();
              const payloadAssignedContext = payloadListContextRaw === "menu" || payloadListContextRaw === "game"
                ? payloadListContextRaw
                : "";
              const fallbackContext = activePanel === "menu" ? "menu" : "game";
              const assignedContext = payloadAssignedContext || options?.listContextOverride || fallbackContext;
              if (assignedContext === "menu") {
                setSelectedMenuPublicRoomCode(assignedCode);
                setMenuRootRoomCode(assignedCode);
                setCurrentRoomParentCode("");
              } else if (assignedContext === "game") {
                setSelectedPanelPublicRoomCode(assignedCode);
                const parentCodeFromPayload = String(payload.parentRoomCode || "").replace(/\D/g, "").slice(0, 6);
                const parentCodeFromOptions = String(options?.sourceRoomCode || "").replace(/\D/g, "").slice(0, 6);
                const parentCode = parentCodeFromPayload || parentCodeFromOptions;
                if (parentCode && parentCode !== assignedCode) {
                  setCurrentRoomParentCode(parentCode);
                } else {
                  setCurrentRoomParentCode("");
                }
              } else if (activePanel === "menu") {
                setSelectedMenuPublicRoomCode(assignedCode);
                if (!menuRootRoomCode) {
                  setMenuRootRoomCode(assignedCode);
                }
                if (menuRootRoomCode && assignedCode === menuRootRoomCode) {
                  setCurrentRoomParentCode("");
                }
              } else {
                setSelectedPanelPublicRoomCode(assignedCode);
              }
              requestPublicRoomList(activePanel === "menu" ? "menu" : "panel", true);
            }
            if (Array.isArray(payload.participants)) {
              const incoming = (payload.participants as RoomParticipant[]).map((participant) => ({
                ...participant,
                panel: normalizeRoomPanel((participant as { panel?: unknown }).panel),
              }));
              setRoomParticipants((prev) => {
                const prevPanels = new Map(prev.map((participant) => [participant.id, participant.panel]));
                return incoming.map((participant) => ({
                  ...participant,
                  panel: participant.panel || prevPanels.get(participant.id) || null,
                }));
              });
              const myself = incoming.find((p) => p.id === peerIdRef.current);
              if (myself?.role) {
                setRoomRole(myself.role);
              }
            }
            stripInviteTokenFromAddressBar();
            if (payload.role) {
              const nextRole = String(payload.role);
              setRoomRole(nextRole);
              if (nextRole === "spectator") {
                setMenuMessage(t("spectatorReadOnly"));
              }
            }

            if (quickJoin) {
              if (payload.roomPublic === false) {
                setMenuMessage(t("quickMatchPrivateSkipped"));
                closeRoomSocket();
                window.setTimeout(() => {
                  connectRoom("", false, { quickJoin: true, roomPublic: true });
                }, 100);
                return;
              }
              if (assignedCode) {
                setMenuMessage(tf("roomJoinPreparing", { code: assignedCode }));
              }
            }

            if (assignedCode && ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  type: "presence",
                  room: assignedCode,
                  from: peerIdRef.current,
                  clientId: getCurrentRoomClientId(),
                  userId: getCurrentRoomUserId(),
                  panel: getCurrentRoomPanel(),
                  name: playerName,
                  roomPublic: Boolean(payload.roomPublic ?? (roomVisibility === "public")),
                }),
              );
            }
            return;
          }

          if (type === "quick-no-room") {
            if (quickJoin) {
              hasQuickMatchResolved = true;
              setQuickMatchMode(false);
              closeRoomSocket();
              setMenuMessage(t("roomListEmpty"));
            }
            return;
          }

          if (type === "presence") {
            const from = String(payload.from || "").trim();
            if (!from) return;
            const nextPanel = normalizeRoomPanel((payload as { panel?: unknown }).panel);
            if (!nextPanel) return;
            setRoomParticipants((prev) => prev.map((participant) => (
              participant.id === from
                ? { ...participant, panel: nextPanel }
                : participant
            )));
            return;
          }

          if (type === "room-state") {
            const nextRoomCode = String(payload.room || "");
            if (quickJoin && nextRoomCode) {
              hasQuickMatchResolved = true;
            }
            const participants: RoomParticipant[] = Array.isArray(payload.participants)
              ? payload.participants.map((participant: unknown) => ({
                ...(participant as RoomParticipant),
                panel: normalizeRoomPanel((participant as { panel?: unknown }).panel),
              }))
              : [];
            setConnectedRoomCode(nextRoomCode);
            setRoomParticipants((prev) => {
              const prevPanels = new Map(prev.map((participant) => [participant.id, participant.panel]));
              return participants.map((participant) => ({
                ...participant,
                panel: participant.panel || prevPanels.get(participant.id) || null,
              }));
            });
            if (Array.isArray(payload.drawVotes)) {
              setOthelloDrawVotes(payload.drawVotes.map((vote: unknown) => String(vote)).filter((vote: string) => vote.length > 0));
            } else {
              setOthelloDrawVotes([]);
            }
            const myself = participants.find((p: RoomParticipant) => p.id === peerIdRef.current);
            if (myself?.role) {
              setRoomRole(myself.role);
            }
            if (nextRoomCode) {
              stripInviteTokenFromAddressBar();
            }
            if (quickJoin) {
              const activePlayers = participants.filter((p: RoomParticipant) => p.role === "host" || p.role === "guest").length;
              if (activePlayers >= 2) {
                setQuickMatchMode(false);
                setMenuMessage(tf("quickMatchConnected", { code: nextRoomCode || roomCode }));
              } else {
                setMenuMessage(t("quickMatchSearching"));
              }
            }
            return;
          }

          if (type === "room-ready") {
            const from = String(payload?.from || "").trim();
            if (!from) return;
            const ready = Boolean(payload?.ready);
            setRoomReadyById((prev) => ({ ...prev, [from]: ready }));
            return;
          }

          if (type === "room-ready-reset") {
            setRoomReadyById((prev) => {
              const next: Record<string, boolean> = {};
              Object.keys(prev).forEach((id) => {
                next[id] = false;
              });
              return next;
            });
            return;
          }

          if (type === "draw-vote-state") {
            const votes = Array.isArray(payload.votes)
              ? payload.votes.map((vote: unknown) => String(vote)).filter((vote: string) => vote.length > 0)
              : [];
            setOthelloDrawVotes(votes);
            if (votes.includes(peerIdRef.current)) {
              setMenuMessage(t("othelloDrawRequestSent"));
            } else if (votes.length > 0) {
              setMenuMessage(t("othelloDrawRequestPending"));
            }
            return;
          }

          if (type === "draw-confirmed") {
            finalizeOthelloDrawAgreement();
            return;
          }

          if (type === "invite-token") {
            const token = String(payload.token || "").trim();
            setPendingInviteToken(token);
            if (inviteTokenResolveRef.current) {
              inviteTokenResolveRef.current(token);
              inviteTokenResolveRef.current = null;
            }
            return;
          }

          if (type === "spectator-chat") {
            pushSpectatorChatMessage(String(payload.name || "Spectator"), String(payload.text || ""));
            return;
          }

          if (type === "chat") {
            const incomingId = String(payload.messageId || "").trim();
            pushRoomChatMessage(String(payload.name || payload.from || "Player"), String(payload.text || ""), incomingId);
            if (incomingId && String(payload.from || "") === peerIdRef.current) {
              pendingRoomChatIdsRef.current = pendingRoomChatIdsRef.current.filter((id) => id !== incomingId);
            }
            return;
          }

          if (type === "room-full") {
            if (quickJoin) {
              setMenuMessage(t("quickMatchSearching"));
              closeRoomSocket();
              window.setTimeout(() => {
                connectRoom("", false, { quickJoin: true, roomPublic: true });
              }, 100);
              return;
            }
            closeRoomSocket();
            setConnectedRoomCode("");
            setRoomReadyById({});
            setRoomParticipants([]);
            setRoomRole("");
            setOthelloDrawVotes([]);
            setRoomChatMessages([]);
            setSpectatorChatMessages([]);
            setRoomStatus(t("roomStateClosed"));
            setMenuMessage(tf("roomFullRejected", { code: String(payload.code || roomCode || "------") }));
            return;
          }

          if (type === "room-in-game") {
            if (quickJoin) {
              setMenuMessage(t("quickMatchSearching"));
              closeRoomSocket();
              window.setTimeout(() => {
                connectRoom("", false, { quickJoin: true, roomPublic: true });
              }, 100);
              return;
            }
            closeRoomSocket();
            setConnectedRoomCode("");
            setRoomReadyById({});
            setRoomParticipants([]);
            setRoomRole("");
            setOthelloDrawVotes([]);
            setRoomChatMessages([]);
            setSpectatorChatMessages([]);
            setRoomStatus(t("roomStateClosed"));
            setMenuMessage(t("roomInGameSuggestSpectate"));
            return;
          }

          if (type === "invite-token-required") {
            closeRoomSocket();
            setConnectedRoomCode("");
            setRoomReadyById({});
            setRoomParticipants([]);
            setRoomRole("");
            setOthelloDrawVotes([]);
            setPendingInviteToken("");
            setRoomChatMessages([]);
            setSpectatorChatMessages([]);
            setRoomStatus(t("roomStateClosed"));
            setMenuMessage(t("roomInviteRequired"));
            return;
          }

          if (type === "error") {
            const code = String(payload.code || "UNKNOWN");
            const shouldRecoverRoomRequired = options?.createRoom || createIfEmpty;
            if (code === "ROOM_REQUIRED" && shouldRecoverRoomRequired && !retriedRoomRequiredOnCreate) {
              retriedRoomRequiredOnCreate = true;
              connectRoom("", true, {
                ...options,
                createRoom: true,
                serverAllocateCode: true,
                panelOverride: options?.panelOverride ?? getCurrentRoomPanel(),
              });
              return;
            }
            if (code === "ROOM_REQUIRED" && shouldRecoverRoomRequired) {
              setMenuMessage(
                tf("roomCreatePreparing", {
                  password: roomVisibility === "private" ? t("roomPasswordOn") : t("roomPasswordOff"),
                }),
              );
              return;
            }
            if (code === "MUTED") {
              rollbackLatestPendingRoomChat();
              setMenuMessage(t("roomChatMuted"));
              return;
            }
            if (code.startsWith("RATE_LIMIT_")) {
              rollbackLatestPendingRoomChat();
              setMenuMessage(t("roomChatRateLimited"));
              return;
            }
            setMenuMessage(`${t("roomErrorPrefix")}: ${roomErrorLabel(code)}`);
          }
        } catch {
          // ignore malformed message
        }
      };

      ws.onerror = () => {
        if (!isCurrentSocket()) return;
        window.clearTimeout(connectTimeout);
        setIsMenuPublicRoomsLoading(false);
        setIsPanelPublicRoomsLoading(false);
        setQuickMatchMode(false);
        setRoomStatus(t("roomStateError"));
        setMenuMessage(connectFailedMessage);
      };

      ws.onclose = () => {
        if (!isCurrentSocket()) return;
        window.clearTimeout(connectTimeout);
        roomSocketRef.current = null;
        setIsMenuPublicRoomsLoading(false);
        setIsPanelPublicRoomsLoading(false);
        setQuickMatchMode(false);
        if (!hasOpened) {
          setOthelloDrawVotes([]);
          setRoomStatus(t("roomStateConnectFailed"));
          setMenuMessage(connectFailedMessage);
          return;
        }
        setOthelloDrawVotes([]);
        setRoomStatus(t("roomStateClosed"));
      };
    },
    [
      applyArcadeSnapshot,
      closeRoomSocket,
      getCurrentRoomClientId,
      playerName,
      getCurrentRoomPanel,
      getCurrentRoomUserId,
      pushRoomChatMessage,
      rollbackLatestPendingRoomChat,
      pushSpectatorChatMessage,
      normalizeRoomPanel,
      allocateClientRoomCode,
      roomCode,
      roomErrorLabel,
      roomVisibility,
      stripInviteTokenFromAddressBar,
      finalizeOthelloDrawAgreement,
      applySurrenderToPanel,
      applyPublicRoomList,
      activePanel,
      menuRootRoomCode,
      t,
      tf,
    ],
  );

  useEffect(() => {
    if (!pendingLobbyReturnCode) return;
    if (activePanel !== "menu") return;
    const targetCode = pendingLobbyReturnCode.replace(/\D/g, "").slice(0, 6);
    if (targetCode.length !== 6) {
      setPendingLobbyReturnCode("");
      return;
    }
    if (connectedRoomCode === targetCode) {
      setCurrentRoomParentCode("");
      setPendingLobbyReturnCode("");
      return;
    }
    setPendingLobbyReturnCode("");
    setRoomCode(targetCode);
    connectRoom(targetCode, false, { panelOverride: "", listContextOverride: "menu" });
  }, [activePanel, connectedRoomCode, connectRoom, pendingLobbyReturnCode]);

  useEffect(() => {
    if (activePanel !== "menu") return;
    if (pendingLobbyReturnCode) return;
    if (quickMatchMode) return;
    const rootCode = menuRootRoomCode.replace(/\D/g, "").slice(0, 6);
    const currentCode = connectedRoomCode.replace(/\D/g, "").slice(0, 6);
    if (rootCode.length !== 6 || currentCode.length !== 6) return;
    if (rootCode === currentCode) return;
    setRoomCode(rootCode);
    connectRoom(rootCode, false, { panelOverride: "", listContextOverride: "menu" });
  }, [activePanel, connectedRoomCode, connectRoom, menuRootRoomCode, pendingLobbyReturnCode, quickMatchMode]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (activePanel !== "menu") return;
    requestPublicRoomList("menu", true);
    requestPublicRoomList("panel", true);
    const timer = window.setInterval(() => {
      requestPublicRoomList("menu", true);
      requestPublicRoomList("panel", true);
    }, 3500);
    return () => window.clearInterval(timer);
  }, [activePanel, connectedRoomCode, isAuthenticated, requestPublicRoomList]);

  const requestInviteToken = useCallback(() => {
    return new Promise<string>((resolve) => {
      inviteTokenResolveRef.current = resolve;
      sendRoomEvent({ type: "issue-invite-token" });
      window.setTimeout(() => {
        if (!inviteTokenResolveRef.current) return;
        inviteTokenResolveRef.current("");
        inviteTokenResolveRef.current = null;
      }, 1800);
    });
  }, [sendRoomEvent]);

  const buildInviteUrl = useCallback((room: string, inviteToken: string) => {
    const url = new URL(window.location.href);
    url.hash = `#${APP_URL_TAG}`;
    url.searchParams.set(ROOM_CODE_QUERY_PARAM_KEY, room);
    url.searchParams.delete(ROOM_SERVER_QUERY_PARAM_KEY);
    if (inviteToken) {
      url.searchParams.set(ROOM_INVITE_TOKEN_QUERY_PARAM_KEY, inviteToken);
    } else {
      url.searchParams.delete(ROOM_INVITE_TOKEN_QUERY_PARAM_KEY);
    }
    return url.toString();
  }, []);

  const showInviteCopyFeedback = useCallback((status: "copied" | "failed") => {
    setInviteCopyFeedback(status);
    if (inviteCopyFeedbackTimerRef.current !== null) {
      window.clearTimeout(inviteCopyFeedbackTimerRef.current);
    }
    inviteCopyFeedbackTimerRef.current = window.setTimeout(() => {
      setInviteCopyFeedback("idle");
      inviteCopyFeedbackTimerRef.current = null;
    }, 2000);
  }, []);

  const copyInviteLink = useCallback(async () => {
    const code = connectedRoomCode || roomCode;
    if (!code) return;

    let token = "";
    if (roomRole === "host" && roomVisibility === "private") {
      token = await requestInviteToken();
      if (!token) {
        setMenuMessage(t("inviteTokenIssueFailed"));
        return;
      }
      setPendingInviteToken(token);
    }

    const link = buildInviteUrl(code, token || pendingInviteToken);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
        showInviteCopyFeedback("copied");
        setMenuMessage(t("inviteLinkCopied"));
        return;
      }
    } catch {
      // fallthrough to prompt
    }

    const copied = Boolean(window.prompt("Copy URL", link));
    showInviteCopyFeedback(copied ? "copied" : "failed");
    setMenuMessage(copied ? t("inviteLinkCopied") : t("inviteLinkCopyFailed"));
  }, [buildInviteUrl, connectedRoomCode, pendingInviteToken, requestInviteToken, roomCode, roomRole, roomVisibility, showInviteCopyFeedback, t]);

  const copyFriendId = useCallback(async () => {
    const value = cloudFriendId.trim();
    if (!value) {
      setMenuMessage(t("friendIdRequired"));
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        setMenuMessage(t("friendIdCopied"));
        return;
      }
    } catch {
      // fallthrough to prompt
    }

    const copied = Boolean(window.prompt("Copy Friend ID", value));
    setMenuMessage(copied ? t("friendIdCopied") : t("friendIdCopyFailed"));
  }, [cloudFriendId, t]);

  const startQuickMatch = useCallback(() => {
    setQuickMatchMode(true);
    setMenuMessage(t("quickMatchSearching"));
    connectRoom("", false, { quickJoin: true, roomPublic: true });
  }, [connectRoom, t]);

  const joinRoomAsPlayer = useCallback(() => {
    const targetCode = activePanel === "menu" ? selectedMenuPublicRoomCode : selectedPanelPublicRoomCode;
    const code = targetCode.replace(/[^0-9]/g, "").slice(0, 6);
    if (code.length !== 6) {
      setMenuMessage(t("roomSelectRequired"));
      return;
    }
    setQuickMatchMode(false);
    if (!onJoinRoom(code)) return;
    setRoomCode(code);
    connectRoom(code, false, { inviteToken: pendingInviteToken });
  }, [activePanel, connectRoom, onJoinRoom, pendingInviteToken, selectedMenuPublicRoomCode, selectedPanelPublicRoomCode, t]);

  const joinRoomAsSpectator = useCallback(() => {
    const targetCode = activePanel === "menu" ? selectedMenuPublicRoomCode : selectedPanelPublicRoomCode;
    const code = targetCode.replace(/[^0-9]/g, "").slice(0, 6);
    if (code.length !== 6) {
      setMenuMessage(t("roomSelectRequired"));
      return;
    }
    setQuickMatchMode(false);
    setRoomCode(code);
    connectRoom(code, false, { spectate: true, inviteToken: pendingInviteToken });
  }, [activePanel, connectRoom, pendingInviteToken, selectedMenuPublicRoomCode, selectedPanelPublicRoomCode, t]);

  const createRoomFromCurrentPanel = useCallback(() => {
    setQuickMatchMode(false);
    setPendingInviteToken("");
    const panelNow = normalizeRoomPanel(activePanel) || getCurrentRoomPanel();
    const sourceRoomCode = menuRootRoomCode || connectedRoomCode;

    setMenuMessage(
      tf("roomCreatePreparing", {
        password: roomVisibility === "private" ? t("roomPasswordOn") : t("roomPasswordOff"),
      }),
    );
    connectRoom("", true, {
      roomPublic: roomVisibility === "public",
      panelOverride: panelNow,
      createRoom: true,
      sourceRoomCode,
      listContextOverride: "game",
      serverAllocateCode: true,
    });
    window.setTimeout(() => {
      requestPublicRoomList("panel", true);
    }, 250);
  }, [activePanel, connectedRoomCode, connectRoom, getCurrentRoomPanel, menuRootRoomCode, normalizeRoomPanel, requestPublicRoomList, roomVisibility, t, tf]);

  const createRoomFromMenu = useCallback(() => {
    setQuickMatchMode(false);
    setPendingInviteToken("");

    setMenuMessage(
      tf("roomCreatePreparing", {
        password: t("roomPasswordOff"),
      }),
    );
    connectRoom("", true, {
      roomPublic: true,
      panelOverride: "",
      createRoom: true,
      listContextOverride: "menu",
      serverAllocateCode: true,
    });
    window.setTimeout(() => {
      requestPublicRoomList("menu", true);
    }, 250);
  }, [connectRoom, requestPublicRoomList, t, tf]);

  const disconnectRoomFromCurrentPanel = useCallback(() => {
    setQuickMatchMode(false);
    setPendingInviteToken("");
    closeRoomSocket();
    setConnectedRoomCode("");
    setRoomReadyById({});
    setRoomParticipants([]);
    setRoomRole("");
    setRoomChatMessages([]);
    setSpectatorChatMessages([]);
    requestPublicRoomList(activePanel === "menu" ? "menu" : "panel", true);
  }, [closeRoomSocket, requestPublicRoomList]);

  const sendRoomChat = useCallback(() => {
    if (roomRole === "spectator") return;
    const text = roomChatInput.trim().slice(0, 200);
    if (!text) return;
    const messageId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${peerIdRef.current}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    pendingRoomChatIdsRef.current = [...pendingRoomChatIdsRef.current, messageId];
    pushRoomChatMessage(playerName, text, messageId);
    sendRoomEvent({ type: "chat", text, messageId });
    setRoomChatInput("");
  }, [playerName, pushRoomChatMessage, roomChatInput, roomRole, sendRoomEvent]);

  const sendSpectatorChat = useCallback(() => {
    if (roomRole !== "spectator") return;
    const text = spectatorChatInput.trim().slice(0, 200);
    if (!text) return;
    sendRoomEvent({ type: "spectator-chat", text });
    setSpectatorChatInput("");
  }, [roomRole, sendRoomEvent, spectatorChatInput]);

  useEffect(() => {
    if (!connectedRoomCode) return;
    if (roomRole !== "host") return;
    sendRoomEvent({ type: "presence", roomPublic: roomVisibility === "public" });
  }, [connectedRoomCode, roomRole, roomVisibility, sendRoomEvent]);

  useEffect(() => {
    if (!connectedRoomCode) {
      setRoomReadyById({});
      return;
    }
    setRoomReadyById((prev) => {
      const activeIds = roomParticipants
        .filter((participant) => participant.role === "host" || participant.role === "guest")
        .map((participant) => participant.id)
        .filter((id) => id.length > 0);
      const next: Record<string, boolean> = {};
      activeIds.forEach((id) => {
        next[id] = Boolean(prev[id]);
      });
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      if (prevKeys.length === nextKeys.length && prevKeys.every((key) => next[key] === prev[key])) {
        return prev;
      }
      return next;
    });
  }, [connectedRoomCode, roomParticipants]);

  useEffect(() => {
    if (!quickMatchMode) return;
    if (connectedRoomCode) return;

    const ws = roomSocketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const sendQuickJoin = () => {
      const currentWs = roomSocketRef.current;
      if (!currentWs || currentWs.readyState !== WebSocket.OPEN) return;
      if (connectedRoomCode) return;
      try {
        currentWs.send(
          JSON.stringify({
            type: "quick-join",
            from: peerIdRef.current,
            clientId: getCurrentRoomClientId(),
            userId: getCurrentRoomUserId(),
            panel: getCurrentRoomPanel(),
            name: playerName,
            roomPublic: true,
          }),
        );
      } catch {
        // ignore send error
      }
    };

    sendQuickJoin();
    const retryTimer = window.setTimeout(sendQuickJoin, 700);
    return () => {
      window.clearTimeout(retryTimer);
    };
  }, [
    connectedRoomCode,
    getCurrentRoomClientId,
    getCurrentRoomPanel,
    getCurrentRoomUserId,
    playerName,
    quickMatchMode,
  ]);

  useEffect(() => {
    if (!connectedRoomCode) return;
    sendRoomEvent({ type: "presence", roomPublic: roomVisibility === "public" });
    sendRoomEvent({ type: "sync-room-state" });
  }, [activePanel, connectedRoomCode, roomVisibility, sendRoomEvent]);

  useEffect(() => {
    if (!connectedRoomCode) return;

    const heartbeat = () => {
      sendRoomEvent({ type: "sync-room-state" });
    };

    heartbeat();
    const timer = window.setInterval(heartbeat, 1500);
    const onFocus = () => heartbeat();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [connectedRoomCode, sendRoomEvent]);

  useEffect(() => {
    return () => {
      closeRoomSocket();
    };
  }, [closeRoomSocket]);

  useEffect(() => {
    snapshotRef.current = {
      state: {
        activePanel,
        gameStarted,
        startCountdownPanel,
        startCountdownSec,
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
        othelloMode,
        othelloCpuLevel,
        othelloTurnOrder,
        othelloPlayerSide,
        othelloChaosTarget,
        othelloChaosHandicap,
        othelloChaosRandomLineIgnore,
        othelloChaosOverwriteLimit,
        othelloChaosBothBlackHandicap,
        othelloChaosBothWhiteHandicap,
        othelloChaosBothBlackOverwriteLimit,
        othelloChaosBothWhiteOverwriteLimit,
        othelloChaosDestroyLimitBlack,
        othelloChaosDestroyLimitWhite,
        othelloMessage,
        isGameOver,
        gomokuBoard,
        gomokuMode,
        gomokuCpuLevel,
        gomokuTurnOrder,
        gomokuPlayerSide,
        gomokuPlayer,
        gomokuMessage,
        isGomokuOver,
        chessBoard,
        chessTurn,
        selectedChess,
        chessMessage,
        isChessOver,
        shogiBoard,
        shogiMode,
        shogiCpuLevel,
        shogiTurnOrder,
        shogiPlayerSide,
        shogiTurn,
        selectedShogi,
        shogiMessage,
        isShogiOver,
        mineBoard,
        mineMessage,
        isMineOver,
        numeronSecret,
        numeronDigitCount,
        numeronSecretDraft,
        isNumeronSecretConfirmed,
        isNumeronSecretPanelOpen,
        numeronDraft,
        numeronHistory,
        numeronEnemyHistory,
        isNumeronEnemyHistoryOpen,
        numeronHintDigit,
        numeronAssistCharges,
        isNumeronOver,
        numeronMessage,
        blackjackDeck,
        blackjackPlayerHand,
        blackjackDealerHand,
        blackjackBet,
        blackjackWager,
        blackjackMessage,
        isBlackjackOver,
        chinchiroPlayerDice,
        chinchiroDealerDice,
        chinchiroBet,
        chinchiroWager,
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
        mahjongWall,
        mahjongRiver,
        mahjongSelected,
        mahjongLastDraw,
        mahjongRoundWind,
        mahjongRoundNumber,
        mahjongSeatWind,
        mahjongHonba,
        mahjongKyotaku,
        mahjongRiichiTileIndex,
        mahjongDoraIndicator,
        mahjongWinSummary,
        mahjongMessage,
        isMahjongOver,
        pokerDeck,
        pokerPlayerHand,
        pokerCpuHand,
        pokerCommunity,
        pokerBet,
        pokerWager,
        pokerHold,
        pokerPhase,
        pokerMessage,
        pokerPlayerEval,
        pokerCpuEval,
        pokerOutcome,
        casinoBankroll,
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
        unoLocalHands,
        unoRoomCpuCount,
        unoLocalTurnIndex,
        unoTopCard,
        unoTurn,
        unoMessage,
        isUnoOver,
      },
    };
  });

  useEffect(() => {
    if (!connectedRoomCode) return;
    if (roomRole !== "host") return;

    const push = () => {
      if (isNumeronSessionActiveRef.current) {
        return;
      }
      const roomMode = normalizeOthelloModeForRoom(othelloMode, isChaosMode);
      const baseState = (snapshotRef.current.state || {}) as Record<string, unknown>;
      const {
        activePanel: _activePanel,
        numeronSecret: _numeronSecret,
        numeronDigitCount: _numeronDigitCount,
        numeronSecretDraft: _numeronSecretDraft,
        isNumeronSecretConfirmed: _isNumeronSecretConfirmed,
        isNumeronSecretPanelOpen: _isNumeronSecretPanelOpen,
        numeronDraft: _numeronDraft,
        numeronHistory: _numeronHistory,
        numeronEnemyHistory: _numeronEnemyHistory,
        isNumeronEnemyHistoryOpen: _isNumeronEnemyHistoryOpen,
        numeronHintDigit: _numeronHintDigit,
        numeronAssistCharges: _numeronAssistCharges,
        isNumeronOver: _isNumeronOver,
        numeronMessage: _numeronMessage,
        ...roomSafeState
      } = baseState;
      sendRoomEvent({
        type: "arcade-sync",
        chaos: isChaosMode,
        snapshot: {
          ...snapshotRef.current,
          state: {
            ...roomSafeState,
            othelloMode: roomMode,
          },
        },
      });
    };

    push();
    const timer = setInterval(push, 1000);
    return () => clearInterval(timer);
  }, [connectedRoomCode, isChaosMode, othelloMode, roomRole, sendRoomEvent]);

  useEffect(() => {
    if (!connectedRoomCode) return;
    setOthelloMode((prev) => normalizeOthelloModeForRoom(prev, isChaosMode));
  }, [connectedRoomCode, isChaosMode]);

  const onBoardClick = (row: number, col: number, options?: { isRemote?: boolean; byCpu?: boolean }) => {
    if (isGameOver) return;

    const isRemote = Boolean(options?.isRemote);
    const byCpu = Boolean(options?.byCpu);

    if (!connectedRoomCode && !byCpu) {
      if (othelloMode === "cpuvscpu" || (othelloMode === "cpu" && currentPlayer !== othelloPlayerSide)) {
        setOthelloMessage(t("othelloCpuThinking"));
        return;
      }
    }

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
    if (activePanel !== "othello") return;
    if (!gameStarted.othello) return;
    if (connectedRoomCode) return;
    if (isGameOver) return;

    const cpuPlayer: 1 | 2 | null =
      othelloMode === "cpu"
        ? (othelloPlayerSide === 1 ? 2 : 1)
        : othelloMode === "cpuvscpu"
          ? currentPlayer
          : null;
    if (!cpuPlayer || currentPlayer !== cpuPlayer) return;

    const legalMoves = getOthelloLegalMoves(board, currentPlayer, {
      isChaosMode,
      brokenMask: othelloBrokenMask,
      fixedMask: othelloFixedMask,
      overwriteRemaining: othelloOverwriteRemaining,
    });
    if (legalMoves.length === 0) return;

    setOthelloMessage(t("othelloCpuThinking"));
    const delayBase = OTHELLO_CPU_SETTINGS[othelloCpuLevel].thinkMs;
    const delay = othelloMode === "cpuvscpu"
      ? Math.min(220, OTHELLO_CPU_THINK_DELAY_MAX_MS)
      : Math.min(delayBase, OTHELLO_CPU_THINK_DELAY_MAX_MS);
    const timer = setTimeout(() => {
      const move = pickOthelloCpuMove(board, currentPlayer, legalMoves, othelloCpuLevel, {
        isChaosMode,
        brokenMask: othelloBrokenMask,
        fixedMask: othelloFixedMask,
        overwriteRemaining: othelloOverwriteRemaining,
      });
      if (!move) return;
      onBoardClick(move.row, move.col, { byCpu: true });
    }, delay);

    return () => clearTimeout(timer);
  }, [
    activePanel,
    board,
    connectedRoomCode,
    currentPlayer,
    isChaosMode,
    isGameOver,
    othelloBrokenMask,
    othelloCpuLevel,
    othelloFixedMask,
    othelloMode,
    othelloOverwriteRemaining,
    othelloPlayerSide,
    gameStarted.othello,
    t,
  ]);

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

  const resolveGomokuPlayerSide = (order: GomokuTurnOrder): 1 | 2 => {
    if (order === "random") return Math.random() < 0.5 ? 1 : 2;
    return order === "white" ? 2 : 1;
  };

  const resetGomokuWith = (nextMode: GomokuMode, nextOrder: GomokuTurnOrder) => {
    const nextPlayerSide = resolveGomokuPlayerSide(nextOrder);
    const nextFirstPlayer: 1 | 2 = nextOrder === "random" ? (Math.random() < 0.5 ? 1 : 2) : (nextOrder === "white" ? 2 : 1);
    setGomokuBoard(createGomokuBoard());
    setGomokuPlayer(nextFirstPlayer);
    setGomokuPlayerSide(nextMode === "cpu" ? nextPlayerSide : 1);
    setIsGomokuOver(false);
    setGomokuMessage(nextFirstPlayer === 1 ? t("gomokuTurnBlack") : t("gomokuTurnWhite"));
  };

  const resetGomoku = () => {
    resetGomokuWith(gomokuMode, gomokuTurnOrder);
  };

  const onGomokuClick = (row: number, col: number, options?: { isRemote?: boolean }) => {
    if (isGomokuOver) return;
    const isRemote = Boolean(options?.isRemote);

    if (!connectedRoomCode && !isRemote && gomokuMode === "cpu" && gomokuPlayer !== gomokuPlayerSide) {
      setGomokuMessage(t("gomokuCpuThinking"));
      return;
    }

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

  useEffect(() => {
    if (activePanel !== "gomoku") return;
    if (!gameStarted.gomoku) return;
    if (connectedRoomCode) return;
    if (gomokuMode !== "cpu") return;
    if (isGomokuOver) return;

    const cpuPlayer: 1 | 2 = gomokuPlayerSide === 1 ? 2 : 1;
    if (gomokuPlayer !== cpuPlayer) return;

    setGomokuMessage(t("gomokuCpuThinking"));

    const timer = setTimeout(() => {
      const move = pickGomokuCpuMove(gomokuBoard, cpuPlayer, gomokuCpuLevel);
      if (!move) return;

      const next = gomokuBoard.map((line) => [...line]);
      next[move.row][move.col] = cpuPlayer;
      setGomokuBoard(next);

      const currentName = cpuPlayer === 1 ? t("blackStone") : t("whiteStone");
      const nextPlayer: 1 | 2 = cpuPlayer === 1 ? 2 : 1;

      if (hasFiveInRow(next, move.row, move.col, cpuPlayer)) {
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
    }, GOMOKU_CPU_THINK_MS[gomokuCpuLevel]);

    return () => clearTimeout(timer);
  }, [
    activePanel,
    connectedRoomCode,
    gameStarted.gomoku,
    gomokuBoard,
    gomokuCpuLevel,
    gomokuMode,
    gomokuPlayer,
    gomokuPlayerSide,
    isGomokuOver,
    t,
    tf,
  ]);

  const resolveChessPlayerSide = (order: ChessTurnOrder): ChessColor => {
    if (order === "random") {
      return Math.random() < 0.5 ? "w" : "b";
    }
    return order === "white" ? "w" : "b";
  };

  const resetChess = (overrideTurnOrder?: ChessTurnOrder) => {
    const nextOrder = overrideTurnOrder ?? chessTurnOrder;
    const nextPlayerSide = resolveChessPlayerSide(nextOrder);
    setChessPlayerSide(nextPlayerSide);
    setChessBoard(createChessBoard());
    setChessTurn("w");
    setSelectedChess(null);
    setIsChessOver(false);
    setChessMessage(t("chessTurnWhite"));
  };

  const onChessClick = (row: number, col: number, options?: { isRemote?: boolean }) => {
    if (isChessOver) return;
    const isRemote = Boolean(options?.isRemote);

    if (!connectedRoomCode && !isRemote && chessMode === "cpu" && chessTurn !== chessPlayerSide) {
      setChessMessage(t("chessCpuThinking"));
      return;
    }

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

  useEffect(() => {
    if (activePanel !== "chess") return;
    if (!gameStarted.chess) return;
    if (connectedRoomCode) return;
    if (chessMode !== "cpu") return;
    if (isChessOver) return;

    const cpuColor: ChessColor = chessPlayerSide === "w" ? "b" : "w";
    if (chessTurn !== cpuColor) return;

    setChessMessage(t("chessCpuThinking"));

    const timer = setTimeout(() => {
      const move = pickChessCpuMove(chessBoard, cpuColor, chessCpuLevel);
      if (!move) {
        setIsChessOver(true);
        setChessMessage(t("chessDraw"));
        return;
      }

      const next = chessBoard.map((line) => [...line]);
      const moving = next[move.fromRow][move.fromCol];
      const captured = next[move.toRow][move.toCol];
      next[move.toRow][move.toCol] = moving;
      next[move.fromRow][move.fromCol] = null;

      if (moving?.type === "P" && (move.toRow === 0 || move.toRow === 7)) {
        next[move.toRow][move.toCol] = { color: moving.color, type: "Q" };
      }

      setChessBoard(next);
      setSelectedChess(null);

      if (captured?.type === "K") {
        const winner = cpuColor === "w" ? t("whiteStone") : t("blackStone");
        setChessMessage(tf("chessWin", { winner }));
        setIsChessOver(true);
        return;
      }

      const nextTurn: ChessColor = cpuColor === "w" ? "b" : "w";
      setChessTurn(nextTurn);
      setChessMessage(nextTurn === "w" ? t("chessTurnWhite") : t("chessTurnBlack"));
    }, CHESS_CPU_THINK_MS[chessCpuLevel]);

    return () => clearTimeout(timer);
  }, [
    activePanel,
    chessBoard,
    chessCpuLevel,
    chessMode,
    chessPlayerSide,
    chessTurn,
    connectedRoomCode,
    gameStarted.chess,
    isChessOver,
    t,
    tf,
  ]);

  const resolveShogiPlayerSide = (order: ShogiTurnOrder): ShogiColor => {
    if (order === "random") {
      return Math.random() < 0.5 ? "b" : "w";
    }
    return order === "white" ? "w" : "b";
  };

  const resetShogiWith = (nextMode: ShogiMode, nextOrder: ShogiTurnOrder) => {
    const nextPlayerSide = resolveShogiPlayerSide(nextOrder);
    const nextTurn: ShogiColor = nextOrder === "random" ? (Math.random() < 0.5 ? "b" : "w") : (nextOrder === "white" ? "w" : "b");
    setShogiPlayerSide(nextMode === "cpu" ? nextPlayerSide : "b");
    setShogiBoard(createShogiBoard());
    setShogiTurn(nextTurn);
    setSelectedShogi(null);
    setIsShogiOver(false);
    setShogiMessage(nextTurn === "b" ? t("shogiTurnBlack") : t("shogiTurnWhite"));
  };

  const resetShogi = () => {
    resetShogiWith(shogiMode, shogiTurnOrder);
  };

  const onShogiClick = (row: number, col: number, options?: { isRemote?: boolean }) => {
    if (isShogiOver) return;
    const isRemote = Boolean(options?.isRemote);

    if (!connectedRoomCode && !isRemote && shogiMode === "cpu" && shogiTurn !== shogiPlayerSide) {
      setShogiMessage(t("shogiCpuThinking"));
      return;
    }

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

  useEffect(() => {
    if (activePanel !== "shogi") return;
    if (!gameStarted.shogi) return;
    if (connectedRoomCode) return;
    if (shogiMode !== "cpu") return;
    if (isShogiOver) return;

    const cpuColor: ShogiColor = shogiPlayerSide === "b" ? "w" : "b";
    if (shogiTurn !== cpuColor) return;

    setShogiMessage(t("shogiCpuThinking"));

    const timer = setTimeout(() => {
      const move = pickShogiCpuMove(shogiBoard, cpuColor, shogiCpuLevel);
      if (!move) {
        return;
      }

      const next = shogiBoard.map((line) => [...line]);
      const moving = next[move.fromRow][move.fromCol];
      const captured = next[move.toRow][move.toCol];
      next[move.toRow][move.toCol] = moving;
      next[move.fromRow][move.fromCol] = null;

      setShogiBoard(next);
      setSelectedShogi(null);

      if (captured?.type === "K") {
        const winner = cpuColor === "b" ? t("blackStone") : t("whiteStone");
        setShogiMessage(tf("shogiWin", { winner }));
        setIsShogiOver(true);
        return;
      }

      const nextTurn: ShogiColor = cpuColor === "b" ? "w" : "b";
      setShogiTurn(nextTurn);
      setShogiMessage(nextTurn === "b" ? t("shogiTurnBlack") : t("shogiTurnWhite"));
    }, SHOGI_CPU_THINK_MS[shogiCpuLevel]);

    return () => clearTimeout(timer);
  }, [
    activePanel,
    connectedRoomCode,
    gameStarted.shogi,
    isShogiOver,
    shogiBoard,
    shogiCpuLevel,
    shogiMode,
    shogiPlayerSide,
    shogiTurn,
    t,
    tf,
  ]);

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

  const numeronTryLimit = numeronDigitCount === 3 ? 8 : 10;
  const numeronCandidateCount = useMemo(
    () => buildNumeronCandidates(numeronHistory, numeronDigitCount).length,
    [numeronHistory, numeronDigitCount],
  );

  const resetNumeron = (nextDigitCount: NumeronDigitCount = numeronDigitCount) => {
    const nextSecretDraft = normalizeNumeronDigitDraft(numeronSecretDraft, nextDigitCount);
    const fixedSecret = nextSecretDraft.length === nextDigitCount ? nextSecretDraft.join("") : "";
    setNumeronDigitCount(nextDigitCount);
    setNumeronSecretDraft(nextSecretDraft);
    setNumeronSecret(fixedSecret || createNumeronSecret(nextDigitCount));
    setIsNumeronSecretConfirmed(false);
    setIsNumeronSecretPanelOpen(true);
    setNumeronDraft([]);
    setNumeronHistory([]);
    setNumeronEnemyHistory([]);
    setIsNumeronEnemyHistoryOpen(false);
    setNumeronPendingItem(null);
    setNumeronHintDigit("5");
    setNumeronAssistCharges({ highlow: 1, reveal: 1 });
    setIsNumeronOver(false);
    setNumeronMessage(tf("numeronHintWithDigits", { digits: nextDigitCount }));
  };

  const pickNumeronEnemyGuess = () => {
    const guessed = new Set(numeronEnemyHistory.map((entry) => entry.guess));
    const narrowed = buildNumeronCandidates(numeronEnemyHistory, numeronDigitCount).filter((code) => !guessed.has(code));
    const pool = narrowed.length > 0
      ? narrowed
      : createNumeronAllCodes(numeronDigitCount).filter((code) => !guessed.has(code));
    if (pool.length <= 0) {
      return createNumeronSecret(numeronDigitCount);
    }
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const onNumeronPickDigit = (digit: string) => {
    if (isNumeronOver || !isNumeronSecretConfirmed || Boolean(numeronPendingItem)) return;
    if (!/^\d$/.test(digit)) return;
    setNumeronDraft((prev) => {
      if (prev.includes(digit) || prev.length >= numeronDigitCount) return prev;
      return [...prev, digit];
    });
  };

  const onNumeronPickSecretDigit = (digit: string) => {
    if (isNumeronOver || numeronHistory.length > 0 || isNumeronSecretConfirmed) return;
    if (!/^\d$/.test(digit)) return;
    setNumeronSecretDraft((prev) => {
      if (prev.includes(digit) || prev.length >= numeronDigitCount) return prev;
      return [...prev, digit];
    });
  };

  const onNumeronBackDigit = () => {
    if (isNumeronOver || !isNumeronSecretConfirmed || Boolean(numeronPendingItem)) return;
    setNumeronDraft((prev) => prev.slice(0, -1));
  };

  const onNumeronBackSecretDigit = () => {
    if (isNumeronOver || numeronHistory.length > 0 || isNumeronSecretConfirmed) return;
    setNumeronSecretDraft((prev) => prev.slice(0, -1));
  };

  const onNumeronClearSecretDraft = () => {
    if (isNumeronOver || numeronHistory.length > 0 || isNumeronSecretConfirmed) return;
    setNumeronSecretDraft([]);
  };

  const runNumeronUseHighLow = () => {
    if (isNumeronOver) return;
    if (numeronAssistCharges.highlow <= 0) {
      setNumeronMessage(t("numeronNoCharges"));
      return;
    }
    if (!/^\d$/.test(numeronHintDigit)) {
      setNumeronMessage(t("numeronInvalidGuess"));
      return;
    }

    const resultText = numeronSecret.includes(numeronHintDigit)
      ? (Number(numeronHintDigit) >= 5 ? "HIGH" : "LOW")
      : "NONE";
    setNumeronAssistCharges((prev) => ({ ...prev, highlow: Math.max(0, prev.highlow - 1) }));
    setNumeronMessage(tf("numeronHighLowResult", { digit: numeronHintDigit, result: resultText }));
  };

  const runNumeronUseReveal = () => {
    if (isNumeronOver) return;
    if (numeronAssistCharges.reveal <= 0) {
      setNumeronMessage(t("numeronNoCharges"));
      return;
    }

    const revealIndex = Math.floor(Math.random() * numeronSecret.length);
    setNumeronAssistCharges((prev) => ({ ...prev, reveal: Math.max(0, prev.reveal - 1) }));
    setNumeronMessage(tf("numeronRevealResult", { index: String(revealIndex + 1), digit: numeronSecret[revealIndex] ?? "?" }));
  };

  const onNumeronUseHighLow = () => {
    if (isNumeronOver || numeronAssistCharges.highlow <= 0) return;
    setNumeronPendingItem("highlow");
    setNumeronMessage(t("numeronItemConfirmHighLow"));
  };

  const onNumeronUseReveal = () => {
    if (isNumeronOver || numeronAssistCharges.reveal <= 0) return;
    setNumeronPendingItem("reveal");
    setNumeronMessage(t("numeronItemConfirmReveal"));
  };

  const onNumeronConfirmItemUse = () => {
    if (numeronPendingItem === "highlow") {
      runNumeronUseHighLow();
    } else if (numeronPendingItem === "reveal") {
      runNumeronUseReveal();
    }
    setNumeronPendingItem(null);
  };

  const onNumeronCancelItemUse = () => {
    if (!numeronPendingItem) return;
    setNumeronPendingItem(null);
    setNumeronMessage(t("numeronItemUseCanceled"));
  };

  const onNumeronSetSecret = () => {
    if (numeronHistory.length > 0 || isNumeronOver || isNumeronSecretConfirmed) return;
    const next = numeronSecretDraft.join("");
    if (!isValidNumeronCode(next, numeronDigitCount)) {
      setNumeronMessage(tf("numeronInvalidGuessDigits", { digits: numeronDigitCount }));
      return;
    }
    setNumeronSecret(next);
    setIsNumeronSecretConfirmed(true);
    setIsNumeronSecretPanelOpen(false);
    setNumeronDraft([]);
    setNumeronMessage(t("numeronSecretSetDone"));
  };

  const onNumeronSetRandomSecret = () => {
    if (numeronHistory.length > 0 || isNumeronOver || isNumeronSecretConfirmed) return;
    const random = createNumeronSecret(numeronDigitCount);
    setNumeronSecret(random);
    setNumeronSecretDraft(random.split(""));
    setIsNumeronSecretConfirmed(true);
    setIsNumeronSecretPanelOpen(false);
    setNumeronDraft([]);
    setNumeronMessage(tf("numeronHintWithDigits", { digits: numeronDigitCount }));
  };

  useEffect(() => {
    if (activePanel !== "numeron") return;
    if (!gameStarted.numeron) return;
    if (!isNumeronSecretConfirmed || isNumeronSecretPanelOpen) return;
    numeronGuessPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activePanel, gameStarted.numeron, isNumeronSecretConfirmed, isNumeronSecretPanelOpen]);

  const onNumeronSubmit = () => {
    if (isNumeronOver) return;
    if (numeronPendingItem) {
      setNumeronMessage(numeronPendingItem === "highlow" ? t("numeronItemConfirmHighLow") : t("numeronItemConfirmReveal"));
      return;
    }
    if (!isNumeronSecretConfirmed) {
      setNumeronMessage(t("numeronSetSecretFirst"));
      return;
    }
    const guess = numeronDraft.join("");
    if (!isValidNumeronCode(guess, numeronDigitCount)) {
      setNumeronMessage(tf("numeronInvalidGuessDigits", { digits: numeronDigitCount }));
      return;
    }

    const result = evaluateNumeron(numeronSecret, guess);
    const nextHistory = [...numeronHistory, { guess, hits: result.hits, blows: result.blows }];
    setNumeronHistory(nextHistory);
    setNumeronDraft([]);
    setNumeronMessage(tf("numeronResult", { guess, hits: result.hits, blows: result.blows }));

    if (result.hits >= numeronDigitCount) {
      setIsNumeronOver(true);
      setNumeronMessage(t("numeronWin"));
      return;
    }

    if (nextHistory.length >= numeronTryLimit) {
      setIsNumeronOver(true);
      setNumeronMessage(tf("numeronTryLimitReached", { secret: numeronSecret }));
      return;
    }

    const enemyGuess = pickNumeronEnemyGuess();
    const enemyResult = evaluateNumeron(numeronSecret, enemyGuess);
    const nextEnemyHistory = [...numeronEnemyHistory, { guess: enemyGuess, hits: enemyResult.hits, blows: enemyResult.blows }];
    setNumeronEnemyHistory(nextEnemyHistory);

    if (enemyResult.hits >= numeronDigitCount) {
      setIsNumeronOver(true);
      setNumeronMessage(t("numeronEnemySolved").replace("{guess}", enemyGuess));
      return;
    }

    setNumeronMessage(
      `${tf("numeronResult", { guess, hits: result.hits, blows: result.blows })} / ${tf("numeronEnemyResult", {
        guess: enemyGuess,
        hits: enemyResult.hits,
        blows: enemyResult.blows,
      })}`,
    );
  };

  useEffect(() => {
    if (activePanel !== "numeron" || !gameStarted.numeron) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) return;
      }

      if (/^\d$/.test(event.key)) {
        onNumeronPickDigit(event.key);
        event.preventDefault();
        return;
      }
      if (event.key === "Backspace") {
        onNumeronBackDigit();
        event.preventDefault();
        return;
      }
      if (event.key === "Delete") {
        setNumeronDraft([]);
        event.preventDefault();
        return;
      }
      if (event.key === "Enter") {
        onNumeronSubmit();
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activePanel, gameStarted.numeron, isNumeronOver, numeronDigitCount, numeronDraft, numeronAssistCharges, numeronHintDigit, numeronSecret, numeronHistory, numeronPendingItem]);

  const resetBlackjack = useCallback(() => {
    clearBlackjackDealerResolveTimer();
    setIsBlackjackDealerResolving(false);
    const bank = normalizeCasinoBankroll();
    setBlackjackBet(clampCasinoBet(blackjackBet, bank));
    setBlackjackWager(0);
    setBlackjackDeck([]);
    setBlackjackPlayerHand([]);
    setBlackjackDealerHand([]);
    setIsBlackjackOver(false);
    setBlackjackMessage("BETを決めてDEALしてください。");
  }, [blackjackBet, clearBlackjackDealerResolveTimer, normalizeCasinoBankroll, t]);

  const settleBlackjackRound = useCallback((playerHand: BlackjackCard[], dealerStart: BlackjackCard[], deckStart: BlackjackCard[], wager: number) => {
    let localDeck = [...deckStart];
    const dealer = [...dealerStart];
    while (blackjackHandValue(dealer) < 17 && localDeck.length > 0) {
      dealer.push(localDeck.shift() as BlackjackCard);
    }

    const playerValue = blackjackHandValue(playerHand);
    const dealerValue = blackjackHandValue(dealer);

    setBlackjackDeck(localDeck);
    setBlackjackDealerHand(dealer);
    setIsBlackjackOver(true);

    if (dealerValue > 21 || playerValue > dealerValue) {
      setCasinoBankroll((prev) => prev + wager * 2);
      triggerCasinoWinBurst();
      setBlackjackMessage(`${t("blackjackWin")} (+${wager})`);
      return;
    }
    if (playerValue < dealerValue) {
      setBlackjackMessage(`${t("blackjackLose")} (-${wager})`);
      return;
    }
    setCasinoBankroll((prev) => prev + wager);
    setBlackjackMessage(`${t("blackjackPush")} (+${wager})`);
  }, [t, triggerCasinoWinBurst]);

  const onBlackjackDeal = () => {
    clearBlackjackDealerResolveTimer();
    setIsBlackjackDealerResolving(false);
    if (!gameStarted.blackjack) return;
    if ((!isBlackjackOver && blackjackPlayerHand.length > 0) || isBlackjackDealerResolving) return;

    const bank = normalizeCasinoBankroll();
    if (bank < MIN_CASINO_BET) {
      setBlackjackMessage("チップが不足しています。");
      return;
    }

    const wager = clampCasinoBet(blackjackBet, bank);
    const deck = shuffleBlackjackDeck(createBlackjackDeck());
    const player = [deck[0], deck[2]].filter(Boolean) as BlackjackCard[];
    const dealer = [deck[1], deck[3]].filter(Boolean) as BlackjackCard[];
    const rest = deck.slice(4);
    const playerNatural = isBlackjack(player);
    const dealerNatural = isBlackjack(dealer);

    setCasinoBankroll(Math.max(0, bank - wager));
    setBlackjackBet(wager);
    setBlackjackWager(wager);
    setBlackjackDeck(rest);
    setBlackjackPlayerHand(player);
    setBlackjackDealerHand(dealer);

    if (playerNatural && dealerNatural) {
      setCasinoBankroll((prev) => prev + wager);
      setIsBlackjackOver(true);
      setBlackjackMessage(`${t("blackjackPush")} (+${wager})`);
      return;
    }
    if (playerNatural) {
      const payout = Math.floor(wager * 2.5);
      setCasinoBankroll((prev) => prev + payout);
      triggerCasinoWinBurst();
      setIsBlackjackOver(true);
      setBlackjackMessage(`${t("blackjackWin")} (+${Math.floor(wager * 1.5)})`);
      return;
    }
    if (dealerNatural) {
      setIsBlackjackOver(true);
      setBlackjackMessage(`${t("blackjackLose")} (-${wager})`);
      return;
    }

    setIsBlackjackOver(false);
    setBlackjackMessage(`${t("blackjackYourTurn")} (BET ${wager})`);
  };

  const onBlackjackHit = () => {
    if (isBlackjackOver || isBlackjackDealerResolving || blackjackDeck.length === 0 || blackjackPlayerHand.length === 0) return;
    const nextCard = blackjackDeck[0];
    const restDeck = blackjackDeck.slice(1);
    const nextHand = [...blackjackPlayerHand, nextCard];
    const value = blackjackHandValue(nextHand);

    setBlackjackDeck(restDeck);
    setBlackjackPlayerHand(nextHand);

    if (value > 21) {
      setIsBlackjackOver(true);
      setBlackjackMessage(`${t("blackjackBust")} (-${blackjackWager})`);
      return;
    }

    setBlackjackMessage(t("blackjackYourTurn"));
  };

  const onBlackjackStand = () => {
    if (isBlackjackOver || isBlackjackDealerResolving || blackjackPlayerHand.length === 0 || blackjackDealerHand.length === 0) return;
    clearBlackjackDealerResolveTimer();
    setBlackjackMessage(t("blackjackDealerTurn"));
    setIsBlackjackDealerResolving(true);
    blackjackDealerResolveTimerRef.current = window.setTimeout(() => {
      blackjackDealerResolveTimerRef.current = null;
      settleBlackjackRound(blackjackPlayerHand, blackjackDealerHand, blackjackDeck, blackjackWager);
      setIsBlackjackDealerResolving(false);
    }, BLACKJACK_DEALER_REVEAL_DELAY_MS);
  };

  const onBlackjackDouble = () => {
    if (isBlackjackOver || isBlackjackDealerResolving || blackjackPlayerHand.length !== 2 || blackjackDealerHand.length === 0) return;
    if (casinoBankroll < blackjackWager) {
      setBlackjackMessage("DOUBLEするには同額のチップが必要です。");
      return;
    }
    if (blackjackDeck.length === 0) return;

    const nextWager = blackjackWager * 2;
    const nextCard = blackjackDeck[0];
    const restDeck = blackjackDeck.slice(1);
    const nextHand = [...blackjackPlayerHand, nextCard];

    setCasinoBankroll((prev) => Math.max(0, prev - blackjackWager));
    setBlackjackWager(nextWager);
    setBlackjackPlayerHand(nextHand);

    if (blackjackHandValue(nextHand) > 21) {
      setBlackjackDeck(restDeck);
      setIsBlackjackOver(true);
      setBlackjackMessage(`${t("blackjackBust")} (-${nextWager})`);
      return;
    }

    clearBlackjackDealerResolveTimer();
    setBlackjackMessage(t("blackjackDealerTurn"));
    setIsBlackjackDealerResolving(true);
    blackjackDealerResolveTimerRef.current = window.setTimeout(() => {
      blackjackDealerResolveTimerRef.current = null;
      settleBlackjackRound(nextHand, blackjackDealerHand, restDeck, nextWager);
      setIsBlackjackDealerResolving(false);
    }, BLACKJACK_DEALER_REVEAL_DELAY_MS);
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
    const bank = normalizeCasinoBankroll();
    const wager = clampCasinoBet(chinchiroBet, bank);
    setCasinoBankroll(Math.max(0, bank - wager));
    setChinchiroBet(wager);
    setChinchiroWager(wager);
    setChinchiroPlayerDice(null);
    setChinchiroDealerDice(null);
    setIsChinchiroOver(false);
    setChinchiroMessage(`${t("chinchiroHint")} (BET ${wager})`);
  }, [chinchiroBet, normalizeCasinoBankroll, t]);

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
    let bankrollDiff = 0;
    if (playerHand.rank > dealerHand.rank || (playerHand.rank === dealerHand.rank && playerHand.eye > dealerHand.eye)) {
      resultLabel = t("chinchiroWin");
      bankrollDiff = chinchiroWager;
      setCasinoBankroll((prev) => prev + chinchiroWager * 2);
      triggerCasinoWinBurst();
    } else if (playerHand.rank < dealerHand.rank || (playerHand.rank === dealerHand.rank && playerHand.eye < dealerHand.eye)) {
      resultLabel = t("chinchiroLose");
      bankrollDiff = -chinchiroWager;
    } else {
      bankrollDiff = 0;
      setCasinoBankroll((prev) => prev + chinchiroWager);
    }

    setChinchiroMessage(
      tf("chinchiroResultLine", {
        player: chinchiroHandLabel(playerHand),
        dealer: chinchiroHandLabel(dealerHand),
        result: `${resultLabel} (${bankrollDiff >= 0 ? "+" : ""}${bankrollDiff})`,
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

  const clearFourPanelCanvas = useCallback((options?: { recordUndo?: boolean }) => {
    const canvas = fourPanelCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (options?.recordUndo && fourPanelHasStrokeRef.current) {
      fourPanelUndoStackRef.current.push(canvas.toDataURL("image/png"));
      if (fourPanelUndoStackRef.current.length > 40) {
        fourPanelUndoStackRef.current = fourPanelUndoStackRef.current.slice(-40);
      }
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    fourPanelHasStrokeRef.current = false;
    fourPanelLastPointRef.current = null;
    fourPanelStrokeBaseSnapshotRef.current = null;
    if (fourPanelStrokeLayerRef.current) {
      const layerCtx = fourPanelStrokeLayerRef.current.getContext("2d");
      layerCtx?.clearRect(0, 0, fourPanelStrokeLayerRef.current.width, fourPanelStrokeLayerRef.current.height);
    }
  }, []);

  const restoreFourPanelCanvas = useCallback((snapshot: string) => {
    const canvas = fourPanelCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!snapshot || snapshot === FOUR_PANEL_EMPTY_SNAPSHOT) {
      fourPanelHasStrokeRef.current = false;
      fourPanelLastPointRef.current = null;
      fourPanelStrokeBaseSnapshotRef.current = null;
      return;
    }
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      fourPanelHasStrokeRef.current = true;
      fourPanelLastPointRef.current = null;
      fourPanelStrokeBaseSnapshotRef.current = null;
    };
    img.src = snapshot;
  }, []);

  const undoFourPanelStroke = useCallback(() => {
    const prev = fourPanelUndoStackRef.current.pop();
    if (typeof prev !== "string") {
      setFourPanelMessage(t("fourPanelUndoUnavailable"));
      return;
    }
    restoreFourPanelCanvas(prev);
    setFourPanelMessage(t("fourPanelHint"));
  }, [restoreFourPanelCanvas, t]);

  const undoFourPanelPanel = useCallback(() => {
    if (fourPanelImages.length <= 0) {
      setFourPanelMessage(t("fourPanelUndoUnavailable"));
      return;
    }
    const rollbackImage = fourPanelImages[fourPanelImages.length - 1] || "";
    const nextImages = fourPanelImages.slice(0, -1);
    setFourPanelImages(nextImages);
    setFourPanelIndex(nextImages.length);
    fourPanelUndoStackRef.current = [];
    restoreFourPanelCanvas(rollbackImage);
    setFourPanelMessage(tf("fourPanelProgress", { current: nextImages.length + 1 }));
  }, [fourPanelImages, restoreFourPanelCanvas, t, tf]);

  const randomizeFourPanelTitle = useCallback(() => {
    setFourPanelTitle(pickRandomFourPanelTitle());
  }, []);

  const fourPanelResolvedTitle = useMemo(() => {
    return normalizeFourPanelTitle(fourPanelTitle) || FOUR_PANEL_RANDOM_TITLES[0];
  }, [fourPanelTitle]);

  const resetFourPanel = useCallback(() => {
    setFourPanelTitle((prev) => normalizeFourPanelTitle(prev) || pickRandomFourPanelTitle());
    setFourPanelImages([]);
    setFourPanelIndex(0);
    setFourPanelMessage(t("fourPanelHint"));
    setFourPanelCursor((prev) => ({ ...prev, visible: false }));
    fourPanelUndoStackRef.current = [];
    clearFourPanelCanvas();
  }, [clearFourPanelCanvas, t]);

  const fourPanelPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const onFourPanelPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (activePanel !== "fourPanel" || fourPanelIndex >= 4) return;
    const canvas = event.currentTarget;
    const preview = brushCursorFromEvent(event, fourPanelBrushSize);
    setFourPanelCursor({ ...preview, visible: true });
    fourPanelUndoStackRef.current.push(
      fourPanelHasStrokeRef.current ? canvas.toDataURL("image/png") : FOUR_PANEL_EMPTY_SNAPSHOT,
    );
    if (fourPanelUndoStackRef.current.length > 40) {
      fourPanelUndoStackRef.current = fourPanelUndoStackRef.current.slice(-40);
    }
    const { x, y } = fourPanelPoint(event);
    const session = beginStrokeLayerSession(canvas, fourPanelStrokeLayerRef, fourPanelStrokeBaseSnapshotRef);
    if (!session) return;
    const brushColor = hexToRgba(fourPanelBrushColor, 100);
    fourPanelLastPointRef.current = { x, y };
    drawBrushSegment(session.layerCtx, { x, y }, { x, y }, fourPanelBrushSize, brushColor);
    if (fourPanelStrokeBaseSnapshotRef.current) {
      compositeStrokeLayer(session.baseCtx, fourPanelStrokeBaseSnapshotRef.current, session.layer, fourPanelBrushOpacity);
    }
    fourPanelHasStrokeRef.current = true;
    fourPanelDrawingRef.current = true;
    canvas.setPointerCapture(event.pointerId);
  };

  const onFourPanelPointerEnter = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const preview = brushCursorFromEvent(event, fourPanelBrushSize);
    setFourPanelCursor({ ...preview, visible: true });
  };

  const onFourPanelPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const preview = brushCursorFromEvent(event, fourPanelBrushSize);
    setFourPanelCursor({ ...preview, visible: true });
    if (!fourPanelDrawingRef.current || activePanel !== "fourPanel" || fourPanelIndex >= 4) return;
    const canvas = event.currentTarget;
    const baseCtx = canvas.getContext("2d");
    const layer = fourPanelStrokeLayerRef.current;
    const baseSnapshot = fourPanelStrokeBaseSnapshotRef.current;
    if (!baseCtx || !layer || !baseSnapshot) return;
    const layerCtx = layer.getContext("2d");
    if (!layerCtx) return;
    const { x, y } = fourPanelPoint(event);
    const last = fourPanelLastPointRef.current || { x, y };
    const brushColor = hexToRgba(fourPanelBrushColor, 100);
    const minDistance = Math.max(0.5, fourPanelBrushSize * 0.12);
    const drew = drawBrushSegment(layerCtx, last, { x, y }, fourPanelBrushSize, brushColor, minDistance);
    if (!drew) return;
    compositeStrokeLayer(baseCtx, baseSnapshot, layer, fourPanelBrushOpacity);
    fourPanelLastPointRef.current = { x, y };
    fourPanelHasStrokeRef.current = true;
  };

  const onFourPanelPointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const preview = brushCursorFromEvent(event, fourPanelBrushSize);
    setFourPanelCursor({ ...preview, visible: true });
    if (!fourPanelDrawingRef.current) return;
    fourPanelDrawingRef.current = false;
    fourPanelLastPointRef.current = null;
    fourPanelStrokeBaseSnapshotRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const onFourPanelPointerLeave = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    onFourPanelPointerUp(event);
    setFourPanelCursor((prev) => ({ ...prev, visible: false }));
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
    fourPanelUndoStackRef.current = [];
    clearFourPanelCanvas();

    if (next.length >= 4) {
      setFourPanelMessage(t("fourPanelDone"));
      return;
    }

    setFourPanelMessage(tf("fourPanelProgress", { current: next.length + 1 }));
  };

  useEffect(() => {
    if (activePanel !== "fourPanel") return;
    if (!gameStarted.fourPanel) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        submitFourPanel();
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        clearFourPanelCanvas({ recordUndo: true });
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undoFourPanelStroke();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activePanel, clearFourPanelCanvas, gameStarted.fourPanel, submitFourPanel, undoFourPanelStroke]);

  const clearDrawingRelayCanvas = useCallback(() => {
    const canvas = drawingRelayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawingRelayHasStrokeRef.current = false;
    drawingRelayLastPointRef.current = null;
    drawingRelayStrokeBaseSnapshotRef.current = null;
    if (drawingRelayStrokeLayerRef.current) {
      const layerCtx = drawingRelayStrokeLayerRef.current.getContext("2d");
      layerCtx?.clearRect(0, 0, drawingRelayStrokeLayerRef.current.width, drawingRelayStrokeLayerRef.current.height);
    }
  }, []);

  const resetDrawingRelay = useCallback(() => {
    const prompt = DRAWING_RELAY_PROMPTS[Math.floor(Math.random() * DRAWING_RELAY_PROMPTS.length)] || DRAWING_RELAY_PROMPTS[0];
    setDrawingRelayPrompt(prompt);
    setDrawingRelayImage("");
    setDrawingRelayGuess("");
    setDrawingRelayPhase("draw");
    setDrawingRelayMessage(t("drawingRelayHintDraw"));
    setDrawingRelayCursor((prev) => ({ ...prev, visible: false }));
    clearDrawingRelayCanvas();
  }, [clearDrawingRelayCanvas, t]);

  const drawingRelayPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const onDrawingRelayPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (activePanel !== "drawingRelay" || drawingRelayPhase !== "draw") return;
    const canvas = event.currentTarget;
    const preview = brushCursorFromEvent(event, drawingRelayBrushSize);
    setDrawingRelayCursor({ ...preview, visible: true });
    const { x, y } = drawingRelayPoint(event);
    const session = beginStrokeLayerSession(canvas, drawingRelayStrokeLayerRef, drawingRelayStrokeBaseSnapshotRef);
    if (!session) return;
    const brushColor = hexToRgba(drawingRelayBrushColor, 100);
    drawingRelayLastPointRef.current = { x, y };
    drawBrushSegment(session.layerCtx, { x, y }, { x, y }, drawingRelayBrushSize, brushColor);
    if (drawingRelayStrokeBaseSnapshotRef.current) {
      compositeStrokeLayer(session.baseCtx, drawingRelayStrokeBaseSnapshotRef.current, session.layer, drawingRelayBrushOpacity);
    }
    drawingRelayHasStrokeRef.current = true;
    drawingRelayDrawingRef.current = true;
    canvas.setPointerCapture(event.pointerId);
  };

  const onDrawingRelayPointerEnter = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const preview = brushCursorFromEvent(event, drawingRelayBrushSize);
    setDrawingRelayCursor({ ...preview, visible: true });
  };

  const onDrawingRelayPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const preview = brushCursorFromEvent(event, drawingRelayBrushSize);
    setDrawingRelayCursor({ ...preview, visible: true });
    if (!drawingRelayDrawingRef.current || activePanel !== "drawingRelay" || drawingRelayPhase !== "draw") return;
    const canvas = event.currentTarget;
    const baseCtx = canvas.getContext("2d");
    const layer = drawingRelayStrokeLayerRef.current;
    const baseSnapshot = drawingRelayStrokeBaseSnapshotRef.current;
    if (!baseCtx || !layer || !baseSnapshot) return;
    const layerCtx = layer.getContext("2d");
    if (!layerCtx) return;
    const { x, y } = drawingRelayPoint(event);
    const last = drawingRelayLastPointRef.current || { x, y };
    const brushColor = hexToRgba(drawingRelayBrushColor, 100);
    const minDistance = Math.max(0.5, drawingRelayBrushSize * 0.12);
    const drew = drawBrushSegment(layerCtx, last, { x, y }, drawingRelayBrushSize, brushColor, minDistance);
    if (!drew) return;
    compositeStrokeLayer(baseCtx, baseSnapshot, layer, drawingRelayBrushOpacity);
    drawingRelayLastPointRef.current = { x, y };
    drawingRelayHasStrokeRef.current = true;
  };

  const onDrawingRelayPointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const preview = brushCursorFromEvent(event, drawingRelayBrushSize);
    setDrawingRelayCursor({ ...preview, visible: true });
    if (!drawingRelayDrawingRef.current) return;
    drawingRelayDrawingRef.current = false;
    drawingRelayLastPointRef.current = null;
    drawingRelayStrokeBaseSnapshotRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const onDrawingRelayPointerLeave = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    onDrawingRelayPointerUp(event);
    setDrawingRelayCursor((prev) => ({ ...prev, visible: false }));
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
    const start = createMahjongStartBoard();
    setMahjongBoard(start.hand);
    setMahjongWall(start.wall);
    setMahjongRiver([]);
    setMahjongSelected(null);
    setMahjongLastDraw(null);
    setMahjongRoundWind("東");
    setMahjongRoundNumber(1);
    setMahjongSeatWind("東");
    setMahjongHonba(0);
    setMahjongKyotaku(0);
    setMahjongRiichiTileIndex(null);
    setMahjongDoraIndicator(start.wall[4] ?? null);
    setMahjongWinSummary(null);
    setIsMahjongOver(false);
    setMahjongMessage(t("mahjongHint"));
  }, [t]);

  const onMahjongHint = () => {
    if (isMahjongOver) return;

    if (mahjongBoard.length === 13) {
      const waits = mahjongFindWinningTiles(mahjongBoard);
      if (waits.length === 0) {
        setMahjongMessage(t("mahjongNoHint"));
        return;
      }
      const label = waits.slice(0, MAHJONG_WAIT_HINT_LIMIT).map((tile) => mahjongTileLabel(tile)).join(", ");
      setMahjongMessage(tf("mahjongHintLine", { a: label }));
      return;
    }

    if (mahjongBoard.length !== 14) {
      setMahjongMessage(t("mahjongBlocked"));
      return;
    }

    if (mahjongIsWinningHand(mahjongBoard)) {
      const readyTile = mahjongLastDraw !== null ? mahjongTileLabel(mahjongLastDraw) : "*";
      setMahjongMessage(tf("mahjongWinReady", { tile: readyTile }));
      return;
    }

    const suggestions = mahjongFindBestDiscards(mahjongBoard);
    const best = suggestions.find((item) => item.waits.length > 0 && item.outs > 0);
    if (!best) {
      setMahjongMessage(t("mahjongRemovedAndShuffle"));
      return;
    }
    const waitLabel = best.waits.slice(0, MAHJONG_WAIT_HINT_LIMIT).map((tile) => mahjongTileLabel(tile)).join(", ");
    setMahjongMessage(tf("mahjongHintDiscard", {
      tile: mahjongTileLabel(best.tile),
      waits: waitLabel,
      outs: best.outs,
    }));
  };

  const onMahjongShuffle = () => {
    if (isMahjongOver) return;
    if (mahjongBoard.length === 14) {
      setMahjongMessage(t("mahjongNeedDiscardFirst"));
      return;
    }
    if (mahjongWall.length <= 0) {
      setMahjongHonba((prev) => prev + 1);
      setIsMahjongOver(true);
      setMahjongMessage(t("mahjongRyukyoku"));
      return;
    }

    const drawTile = mahjongWall[0];
    const nextWall = mahjongWall.slice(1);
    const nextHand = [...sortMahjongTiles(mahjongBoard), drawTile];

    setMahjongBoard(nextHand);
    setMahjongWall(nextWall);
    setMahjongSelected(null);
    setMahjongLastDraw(drawTile);
    setMahjongWinSummary(null);

    if (mahjongIsWinningHand(nextHand)) {
      setMahjongMessage(tf("mahjongWinReady", { tile: mahjongTileLabel(drawTile) }));
      return;
    }

    setMahjongMessage(tf("mahjongDrawn", { tile: mahjongTileLabel(drawTile) }));
  };

  const onMahjongTsumo = () => {
    if (isMahjongOver) return;
    if (mahjongBoard.length !== 14) {
      setMahjongMessage(t("mahjongNeedDrawFirst"));
      return;
    }

    if (!mahjongIsWinningHand(mahjongBoard)) {
      setMahjongMessage(t("mahjongCannotWinYet"));
      return;
    }

    const summary = mahjongSummarizeWin(mahjongBoard);
    setMahjongWinSummary(summary);
    setMahjongKyotaku(0);
    setIsMahjongOver(true);
    setMahjongMessage(t("mahjongClear"));
  };

  const onMahjongApplyScore = () => {
    if (!mahjongWinSummary) return;
    setScore(Math.max(0, Math.floor(mahjongWinSummary.point)));
    setMessage(t("mahjongAppliedScore"));
  };

  const onMahjongTileClick = (index: number) => {
    if (isMahjongOver) return;

    if (mahjongBoard.length !== 14) {
      setMahjongMessage(t("mahjongNeedDrawFirst"));
      return;
    }

    if (index < 0 || index >= mahjongBoard.length) {
      setMahjongMessage(t("mahjongNoHint"));
      return;
    }

    if (mahjongSelected !== index) {
      setMahjongSelected(index);
      setMahjongMessage(t("mahjongSwitched"));
      return;
    }

    const discardTile = mahjongBoard[index];
    const nextBoard = sortMahjongTiles(mahjongBoard.filter((_, i) => i !== index));
    const nextRiver = [...mahjongRiver, discardTile];

    setMahjongBoard(nextBoard);
    setMahjongRiver(nextRiver);
    setMahjongSelected(null);
    setMahjongLastDraw(null);
    setMahjongWinSummary(null);

    if (mahjongWall.length === 0) {
      setMahjongSelected(null);
      setMahjongHonba((prev) => prev + 1);
      setIsMahjongOver(true);
      setMahjongMessage(t("mahjongRyukyoku"));
      return;
    }

    const waits = mahjongFindWinningTiles(nextBoard);
    if (waits.length === 0) {
      setMahjongMessage(t("mahjongRemoved"));
      return;
    }

    if (mahjongRiichiTileIndex === null) {
      setMahjongRiichiTileIndex(nextRiver.length - 1);
      setMahjongKyotaku(1);
    }

    const waitLabel = waits.slice(0, MAHJONG_WAIT_HINT_LIMIT).map((tile) => mahjongTileLabel(tile)).join(", ");
    setMahjongMessage(tf("mahjongHintLine", { a: waitLabel }));
  };

  const resetPoker = useCallback(() => {
    const bank = normalizeCasinoBankroll();
    const nextBet = clampCasinoBet(pokerBet, bank);
    const deck = shufflePokerDeck(createPokerDeck());
    const player = deck.slice(0, 2);
    const cpu = deck.slice(2, 4);
    const rest = deck.slice(4);
    setPokerBet(nextBet);
    setPokerWager(0);
    setPokerPlayerHand(player);
    setPokerCpuHand(cpu);
    setPokerCommunity([]);
    setPokerDeck(rest);
    setPokerHold([false, false]);
    setPokerPhase("betting");
    setPokerMessage(`${t("pokerHint")} (BET ${nextBet})`);
    setPokerPlayerEval(null);
    setPokerCpuEval(null);
    setPokerOutcome("pending");
  }, [normalizeCasinoBankroll, pokerBet, t]);

  const onPokerDraw = () => {
    if (pokerPhase === "showdown") return;

    if (pokerPhase === "preflop") {
      const rest = [...pokerDeck];
      const flop = [rest.shift(), rest.shift(), rest.shift()].filter(Boolean) as PokerCard[];
      setPokerDeck(rest);
      setPokerCommunity(flop);
      setPokerPhase("flop");
      setPokerMessage("フロップ: 次へでターンカードを公開します。");
      return;
    }

    if (pokerPhase === "flop") {
      const rest = [...pokerDeck];
      const turn = rest.shift();
      if (!turn) return;
      setPokerDeck(rest);
      setPokerCommunity((prev) => [...prev, turn]);
      setPokerPhase("turn");
      setPokerMessage("ターン: 次へでリバーカードを公開します。");
      return;
    }

    if (pokerPhase === "turn") {
      const rest = [...pokerDeck];
      const river = rest.shift();
      if (!river) return;
      setPokerDeck(rest);
      setPokerCommunity((prev) => [...prev, river]);
      setPokerPhase("river");
      setPokerMessage("リバー: 次へでショーダウンします。");
      return;
    }

    if (pokerPhase === "river") {
      const playerEval = evaluatePokerBestOfSeven([...pokerPlayerHand, ...pokerCommunity]);
      const cpuEval = evaluatePokerBestOfSeven([...pokerCpuHand, ...pokerCommunity]);
      const cmp = comparePokerEval(playerEval, cpuEval);

      setPokerPhase("showdown");
      setPokerPlayerEval(playerEval);
      setPokerCpuEval(cpuEval);

      if (cmp > 0) {
        setCasinoBankroll((prev) => prev + pokerWager * 2);
        triggerCasinoWinBurst();
        setPokerOutcome("win");
        setPokerMessage(`${t("pokerResultWin")} (+${pokerWager})`);
        return;
      }
      if (cmp < 0) {
        setPokerOutcome("lose");
        setPokerMessage(`${t("pokerResultLose")} (-${pokerWager})`);
        return;
      }
      setCasinoBankroll((prev) => prev + pokerWager);
      setPokerOutcome("draw");
      setPokerMessage(`${t("pokerResultDraw")} (+${pokerWager})`);
      return;
    }

    if (pokerPhase !== "betting") return;
    const bank = normalizeCasinoBankroll();
    if (bank < MIN_CASINO_BET) {
      setPokerMessage("チップが不足しています。");
      return;
    }

    const wager = clampCasinoBet(pokerBet, bank);

    setCasinoBankroll(Math.max(0, bank - wager));
    setPokerBet(wager);
    setPokerWager(wager);
    setPokerCommunity([]);
    setPokerHold([false, false]);
    setPokerPlayerEval(null);
    setPokerCpuEval(null);
    setPokerOutcome("pending");
    setPokerPhase("preflop");
    setPokerMessage("プリフロップ: 次へでフロップを公開します。");
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
    setSolitaireUndoStack([]);
    setSolitaireDraggingSelection(null);
    setSolitaireDragOverTarget(null);
    setSolitairePartyPieces([]);
    setSolitaireFoundationFlights([]);
    clearSolitaireFlightTimers();
    setSolitaireMessage(t("solitaireHint"));
    setIsSolitaireOver(false);
  }, [clearSolitaireFlightTimers, t]);

  const foundationCount = useCallback((foundations: Record<SolitaireSuit, SolitaireCard[]>) => {
    return foundations.H.length + foundations.D.length + foundations.C.length + foundations.S.length;
  }, []);

  const isMovableSolitaireTableauStack = useCallback((tableau: SolitaireCard[][], col: number, startIndex: number) => {
    const pile = tableau[col] || [];
    if (startIndex < 0 || startIndex >= pile.length) return false;
    if (!pile[startIndex]?.faceUp) return false;
    for (let i = startIndex; i < pile.length - 1; i += 1) {
      const upper = pile[i];
      const lower = pile[i + 1];
      if (!upper.faceUp || !lower.faceUp) return false;
      if (solitaireIsRed(upper.suit) === solitaireIsRed(lower.suit)) return false;
      if (upper.rank !== lower.rank + 1) return false;
    }
    return true;
  }, []);

  const flipTableauTopIfNeeded = useCallback((tableau: SolitaireCard[][], col: number) => {
    const next = tableau.map((pile) => [...pile]);
    const top = next[col]?.[next[col].length - 1];
    if (top && !top.faceUp) {
      top.faceUp = true;
    }
    return next;
  }, []);

  const cloneSolitairePile = useCallback((cards: SolitaireCard[]) => cards.map((card) => ({ ...card })), []);

  const cloneSolitaireFoundations = useCallback((foundations: Record<SolitaireSuit, SolitaireCard[]>) => ({
    H: cloneSolitairePile(foundations.H || []),
    D: cloneSolitairePile(foundations.D || []),
    C: cloneSolitairePile(foundations.C || []),
    S: cloneSolitairePile(foundations.S || []),
  }), [cloneSolitairePile]);

  const cloneSolitaireTableau = useCallback((tableau: SolitaireCard[][]) => (
    tableau.map((pile) => cloneSolitairePile(pile))
  ), [cloneSolitairePile]);

  const makeSolitaireSnapshot = useCallback((): SolitaireSnapshot => ({
    stock: cloneSolitairePile(solitaireStock),
    waste: cloneSolitairePile(solitaireWaste),
    foundations: cloneSolitaireFoundations(solitaireFoundations),
    tableau: cloneSolitaireTableau(solitaireTableau),
    selection: solitaireSelection
      ? solitaireSelection.from === "waste"
        ? { from: "waste" }
        : solitaireSelection.from === "foundation"
          ? { from: "foundation", suit: solitaireSelection.suit }
        : { from: "tableau", col: solitaireSelection.col, index: solitaireSelection.index }
      : null,
    message: solitaireMessage,
    isOver: isSolitaireOver,
  }), [
    cloneSolitaireFoundations,
    cloneSolitairePile,
    cloneSolitaireTableau,
    isSolitaireOver,
    solitaireFoundations,
    solitaireMessage,
    solitaireSelection,
    solitaireStock,
    solitaireTableau,
    solitaireWaste,
  ]);

  const pushSolitaireUndo = useCallback((snapshot: SolitaireSnapshot) => {
    setSolitaireUndoStack((prev) => {
      const next = [...prev, snapshot];
      if (next.length > 120) return next.slice(next.length - 120);
      return next;
    });
  }, []);

  const restoreSolitaireSnapshot = useCallback((snapshot: SolitaireSnapshot) => {
    setSolitaireStock(cloneSolitairePile(snapshot.stock));
    setSolitaireWaste(cloneSolitairePile(snapshot.waste));
    setSolitaireFoundations(cloneSolitaireFoundations(snapshot.foundations));
    setSolitaireTableau(cloneSolitaireTableau(snapshot.tableau));
    setSolitaireSelection(snapshot.selection
      ? snapshot.selection.from === "waste"
        ? { from: "waste" }
        : snapshot.selection.from === "foundation"
          ? { from: "foundation", suit: snapshot.selection.suit }
        : { from: "tableau", col: snapshot.selection.col, index: snapshot.selection.index }
      : null);
    setSolitaireDraggingSelection(null);
    setSolitaireDragOverTarget(null);
    setSolitaireMessage(snapshot.message || t("solitaireHint"));
    setIsSolitaireOver(Boolean(snapshot.isOver));
    setSolitairePartyPieces([]);
    setSolitaireFoundationFlights([]);
    clearSolitaireFlightTimers();
    if (solitairePartyTimerRef.current !== null) {
      window.clearTimeout(solitairePartyTimerRef.current);
      solitairePartyTimerRef.current = null;
    }
  }, [clearSolitaireFlightTimers, cloneSolitaireFoundations, cloneSolitairePile, cloneSolitaireTableau, t]);

  const emitSolitaireFoundationFlights = useCallback((
    flights: Array<{ card: SolitaireCard; toSuit: SolitaireSuit; from: "waste" | "tableau"; col?: number; index?: number; delayMs?: number }>,
  ) => {
    if (flights.length === 0) return;

    const foundationX: Record<SolitaireSuit, number> = { H: 64, D: 74, C: 84, S: 94 };
    const now = Date.now();
    const created = flights.map((entry, index) => {
      const fromX = entry.from === "waste" ? 20 : 8 + (entry.col ?? 0) * 13.3;
      const fromY = entry.from === "waste" ? 17 : 34 + Math.min(44, (entry.index ?? 0) * 5.8);
      const delayMs = entry.delayMs ?? index * 40;
      return {
        id: `sf-${now}-${index}-${Math.random().toString(36).slice(2, 8)}`,
        label: solitaireCardLabel(entry.card),
        red: solitaireIsRed(entry.card.suit),
        startX: fromX,
        startY: fromY,
        endX: foundationX[entry.toSuit],
        endY: 17,
        delayMs,
        durationMs: 420,
        phase: "start" as const,
      };
    });

    const createdIds = new Set(created.map((flight) => flight.id));
    setSolitaireFoundationFlights((prev) => [...prev, ...created]);

    window.requestAnimationFrame(() => {
      setSolitaireFoundationFlights((prev) => prev.map((flight) => (
        createdIds.has(flight.id) ? { ...flight, phase: "end" } : flight
      )));
    });

    const lifetime = Math.max(...created.map((flight) => flight.delayMs + flight.durationMs)) + 150;
    const timer = window.setTimeout(() => {
      setSolitaireFoundationFlights((prev) => prev.filter((flight) => !createdIds.has(flight.id)));
      solitaireFlightTimersRef.current = solitaireFlightTimersRef.current.filter((id) => id !== timer);
    }, lifetime);
    solitaireFlightTimersRef.current.push(timer);
  }, []);

  const undoSolitaireMove = useCallback(() => {
    let restored = false;
    setSolitaireUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const snapshot = next.pop();
      if (snapshot) {
        restoreSolitaireSnapshot(snapshot);
        restored = true;
      }
      return next;
    });
    if (!restored) {
      setSolitaireMessage(t("solitaireUndoUnavailable"));
    }
  }, [restoreSolitaireSnapshot, t]);

  const triggerSolitaireClearEffect = useCallback(() => {
    const palette = ["#ffd166", "#ff6b35", "#16db93", "#6de2ff", "#ff8fab", "#fff1a8"];
    const pieces = Array.from({ length: 56 }, (_, index) => ({
      id: `p-${Date.now()}-${index}`,
      left: Math.random() * 100,
      delay: Math.random() * 0.22,
      duration: 1.25 + Math.random() * 0.95,
      drift: (Math.random() - 0.5) * 34,
      spin: (Math.random() - 0.5) * 340,
      size: 7 + Math.random() * 7,
      color: palette[Math.floor(Math.random() * palette.length)] as string,
    }));
    setSolitairePartyPieces(pieces);

    if (solitairePartyTimerRef.current !== null) {
      window.clearTimeout(solitairePartyTimerRef.current);
    }
    solitairePartyTimerRef.current = window.setTimeout(() => {
      setSolitairePartyPieces([]);
      solitairePartyTimerRef.current = null;
    }, 2600);
  }, []);

  const tryAutoWinSolitaire = useCallback((foundations: Record<SolitaireSuit, SolitaireCard[]>) => {
    if (foundationCount(foundations) >= 52) {
      triggerSolitaireClearEffect();
      setIsSolitaireOver(true);
      setSolitaireMessage(t("solitaireCleared"));
      return true;
    }
    return false;
  }, [foundationCount, t, triggerSolitaireClearEffect]);

  const drawSolitaireStock = () => {
    if (isSolitaireOver) return;
    const undoPoint = makeSolitaireSnapshot();
    if (solitaireStock.length > 0) {
      const nextStock = [...solitaireStock];
      const drawn = nextStock.pop();
      if (!drawn) return;
      setSolitaireStock(nextStock);
      setSolitaireWaste([...solitaireWaste, { ...drawn, faceUp: true }]);
      setSolitaireSelection(null);
      pushSolitaireUndo(undoPoint);
      return;
    }

    if (solitaireWaste.length > 0) {
      const restocked = [...solitaireWaste].reverse().map((card) => ({ ...card, faceUp: false }));
      setSolitaireStock(restocked);
      setSolitaireWaste([]);
      setSolitaireSelection(null);
      pushSolitaireUndo(undoPoint);
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

  const onSolitaireSelectTableau = (col: number, index: number) => {
    if (isSolitaireOver) return;
    const pile = solitaireTableau[col] || [];
    const card = pile[index];
    if (!card || !card.faceUp) return;
    if (!isMovableSolitaireTableauStack(solitaireTableau, col, index)) {
      setSolitaireMessage(t("solitaireInvalidMove"));
      return;
    }
    setSolitaireSelection((prev) => {
      if (prev?.from === "tableau" && prev.col === col && prev.index === index) {
        setSolitaireMessage(t("solitaireHint"));
        return null;
      }
      setSolitaireMessage(t("solitaireSelected"));
      return { from: "tableau", col, index };
    });
  };

  const canDragSolitaireSelection = useCallback((selection: SolitaireSelection) => {
    if (isSolitaireOver || !gameStarted.solitaire) return false;
    if (selection.from === "waste") {
      return solitaireWaste.length > 0;
    }
    if (selection.from === "foundation") {
      const pile = solitaireFoundations[selection.suit] || [];
      return pile.length > 0;
    }
    const pile = solitaireTableau[selection.col] || [];
    const card = pile[selection.index];
    if (!card || !card.faceUp) return false;
    return isMovableSolitaireTableauStack(solitaireTableau, selection.col, selection.index);
  }, [gameStarted.solitaire, isMovableSolitaireTableauStack, isSolitaireOver, solitaireFoundations, solitaireTableau, solitaireWaste.length]);

  const parseSolitaireDragSelection = (payload: string | null): SolitaireSelection | null => {
    if (!payload) return null;
    try {
      const parsed = JSON.parse(payload) as unknown;
      if (!parsed || typeof parsed !== "object") return null;
      const value = parsed as Record<string, unknown>;
      if (value.from === "waste") return { from: "waste" };
      if (value.from === "foundation") {
        const suit = value.suit;
        if (suit === "H" || suit === "D" || suit === "C" || suit === "S") {
          return { from: "foundation", suit };
        }
        return null;
      }
      if (value.from === "tableau") {
        const col = typeof value.col === "number" ? value.col : -1;
        const index = typeof value.index === "number" ? value.index : -1;
        if (col >= 0 && col < 7 && index >= 0) {
          return { from: "tableau", col, index };
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  const getSolitaireDragSelection = (e: React.DragEvent): SolitaireSelection | null => {
    const fromRef = solitaireDragSelectionRef.current;
    if (fromRef) return fromRef;
    return parseSolitaireDragSelection(e.dataTransfer?.getData("application/x-solitaire-selection") || null);
  };

  const canMoveSolitaireSelectionToFoundation = useCallback((selection: SolitaireSelection, suit: SolitaireSuit) => {
    let movingCard: SolitaireCard | null = null;
    if (selection.from === "waste") {
      movingCard = solitaireWaste[solitaireWaste.length - 1] || null;
    } else if (selection.from === "foundation") {
      return false;
    } else {
      const pile = solitaireTableau[selection.col] || [];
      if (!isMovableSolitaireTableauStack(solitaireTableau, selection.col, selection.index)) return false;
      movingCard = pile[selection.index] || null;
    }
    if (!movingCard) return false;
    const foundationPile = solitaireFoundations[suit];
    const needed = foundationPile.length + 1;
    return movingCard.suit === suit && movingCard.rank === needed;
  }, [isMovableSolitaireTableauStack, solitaireFoundations, solitaireTableau, solitaireWaste]);

  const canMoveSolitaireSelectionToTableau = useCallback((selection: SolitaireSelection, targetCol: number) => {
    if (selection.from === "tableau" && selection.col === targetCol) return false;
    const targetPile = solitaireTableau[targetCol] || [];
    const targetTop = targetPile[targetPile.length - 1] || null;

    let movingCards: SolitaireCard[] = [];
    if (selection.from === "waste") {
      const top = solitaireWaste[solitaireWaste.length - 1] || null;
      movingCards = top ? [top] : [];
    } else if (selection.from === "foundation") {
      const pile = solitaireFoundations[selection.suit] || [];
      const top = pile[pile.length - 1] || null;
      movingCards = top ? [top] : [];
    } else {
      const sourcePile = solitaireTableau[selection.col] || [];
      if (!isMovableSolitaireTableauStack(solitaireTableau, selection.col, selection.index)) return false;
      movingCards = sourcePile.slice(selection.index);
    }

    const movingCard = movingCards[0] || null;
    if (!movingCard) return false;
    if (!targetTop) return movingCard.rank === 13;
    return targetTop.faceUp && solitaireIsRed(targetTop.suit) !== solitaireIsRed(movingCard.suit) && targetTop.rank === movingCard.rank + 1;
  }, [isMovableSolitaireTableauStack, solitaireFoundations, solitaireTableau, solitaireWaste]);

  const onSolitaireDragStart = (e: React.DragEvent, selection: SolitaireSelection) => {
    if (!canDragSolitaireSelection(selection)) {
      e.preventDefault();
      return;
    }
    solitaireDragSelectionRef.current = selection;
    setSolitaireDraggingSelection(selection);
    setSolitaireDragOverTarget(null);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/x-solitaire-selection", JSON.stringify(selection));
  };

  const onSolitaireDragEnd = () => {
    solitaireDragSelectionRef.current = null;
    setSolitaireDraggingSelection(null);
    setSolitaireDragOverTarget(null);
  };

  const onSolitaireDragOverFoundation = (e: React.DragEvent, suit: SolitaireSuit) => {
    if (isSolitaireOver || !gameStarted.solitaire) return;
    const dragged = getSolitaireDragSelection(e);
    if (!dragged || !canMoveSolitaireSelectionToFoundation(dragged, suit)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setSolitaireDragOverTarget({ kind: "foundation", suit });
  };

  const onSolitaireDragOverTableau = (e: React.DragEvent, col: number) => {
    if (isSolitaireOver || !gameStarted.solitaire) return;
    const dragged = getSolitaireDragSelection(e);
    if (!dragged || !canMoveSolitaireSelectionToTableau(dragged, col)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setSolitaireDragOverTarget({ kind: "tableau", col });
  };

  const onSolitaireDropToFoundation = (e: React.DragEvent, suit: SolitaireSuit) => {
    if (isSolitaireOver || !gameStarted.solitaire) return;
    e.preventDefault();
    const dragged = getSolitaireDragSelection(e);
    solitaireDragSelectionRef.current = null;
    setSolitaireDraggingSelection(null);
    setSolitaireDragOverTarget(null);
    if (!dragged) return;
    moveSolitaireSelectionToFoundation(dragged, suit);
  };

  const onSolitaireDropToTableau = (e: React.DragEvent, targetCol: number) => {
    if (isSolitaireOver || !gameStarted.solitaire) return;
    e.preventDefault();
    const dragged = getSolitaireDragSelection(e);
    solitaireDragSelectionRef.current = null;
    setSolitaireDraggingSelection(null);
    setSolitaireDragOverTarget(null);
    if (!dragged) return;
    moveSolitaireSelectionToTableau(dragged, targetCol);
  };

  const moveSolitaireSelectionToFoundation = (selection: SolitaireSelection, suit: SolitaireSuit, opts: { recordUndo?: boolean } = {}) => {
    const { recordUndo = true } = opts;
    const undoPoint = recordUndo ? makeSolitaireSnapshot() : null;
    let movingCards: SolitaireCard[] = [];
    if (selection.from === "waste") {
      const top = solitaireWaste[solitaireWaste.length - 1] || null;
      movingCards = top ? [top] : [];
    } else if (selection.from === "foundation") {
      const top = solitaireFoundations[selection.suit][solitaireFoundations[selection.suit].length - 1] || null;
      movingCards = top ? [top] : [];
    } else {
      const pile = solitaireTableau[selection.col] || [];
      if (!isMovableSolitaireTableauStack(solitaireTableau, selection.col, selection.index)) {
        setSolitaireMessage(t("solitaireInvalidMove"));
        return false;
      }
      movingCards = pile.slice(selection.index);
    }
    if (movingCards.length !== 1) {
      setSolitaireMessage(t("solitaireInvalidMove"));
      return false;
    }

    const card = movingCards[0] || null;
    if (!card) return false;
    if (card.suit !== suit) {
      setSolitaireMessage(t("solitaireInvalidMove"));
      return false;
    }

    const foundationPile = solitaireFoundations[suit];
    const needed = foundationPile.length + 1;
    if (card.rank !== needed) {
      setSolitaireMessage(t("solitaireInvalidMove"));
      return false;
    }

    const nextFoundations = {
      H: [...solitaireFoundations.H],
      D: [...solitaireFoundations.D],
      C: [...solitaireFoundations.C],
      S: [...solitaireFoundations.S],
    };
    nextFoundations[suit].push({ ...card, faceUp: true });

    if (selection.from === "waste") {
      emitSolitaireFoundationFlights([{ card, toSuit: suit, from: "waste" }]);
    } else if (selection.from === "foundation") {
      setSolitaireMessage(t("solitaireInvalidMove"));
      return false;
    } else {
      const fromPile = solitaireTableau[selection.col] || [];
      emitSolitaireFoundationFlights([{
        card,
        toSuit: suit,
        from: "tableau",
        col: selection.col,
        index: Math.max(0, fromPile.length - 1),
      }]);
    }

    if (selection.from === "waste") {
      setSolitaireWaste(solitaireWaste.slice(0, -1));
    } else {
      const nextTableau = solitaireTableau.map((pile) => [...pile]);
      nextTableau[selection.col] = nextTableau[selection.col].slice(0, selection.index);
      setSolitaireTableau(flipTableauTopIfNeeded(nextTableau, selection.col));
    }

    setSolitaireFoundations(nextFoundations);
    setSolitaireSelection(null);
    if (undoPoint) {
      pushSolitaireUndo(undoPoint);
    }
    if (!tryAutoWinSolitaire(nextFoundations)) {
      setSolitaireMessage(t("solitaireHint"));
    }
    return true;
  };

  const moveSolitaireSelectionToTableau = (selection: SolitaireSelection, targetCol: number, opts: { recordUndo?: boolean } = {}) => {
    const { recordUndo = true } = opts;
    const undoPoint = recordUndo ? makeSolitaireSnapshot() : null;
    const targetPile = solitaireTableau[targetCol] || [];
    const targetTop = targetPile[targetPile.length - 1] || null;

    if (selection.from === "tableau" && selection.col === targetCol) {
      setSolitaireMessage(t("solitaireHint"));
      return false;
    }

    let movingCards: SolitaireCard[] = [];
    if (selection.from === "waste") {
      const top = solitaireWaste[solitaireWaste.length - 1] || null;
      movingCards = top ? [top] : [];
    } else if (selection.from === "foundation") {
      const pile = solitaireFoundations[selection.suit] || [];
      const top = pile[pile.length - 1] || null;
      movingCards = top ? [top] : [];
    } else {
      const sourcePile = solitaireTableau[selection.col] || [];
      if (!isMovableSolitaireTableauStack(solitaireTableau, selection.col, selection.index)) {
        setSolitaireMessage(t("solitaireInvalidMove"));
        return false;
      }
      movingCards = sourcePile.slice(selection.index);
    }

    const movingCard = movingCards[0] || null;
    if (!movingCard) return false;

    const canPlace = targetTop
      ? targetTop.faceUp && solitaireIsRed(targetTop.suit) !== solitaireIsRed(movingCard.suit) && targetTop.rank === movingCard.rank + 1
      : movingCard.rank === 13;

    if (!canPlace) {
      setSolitaireMessage(t("solitaireInvalidMove"));
      return false;
    }

    const nextTableau = solitaireTableau.map((pile) => [...pile]);
    if (selection.from === "waste") {
      setSolitaireWaste(solitaireWaste.slice(0, -1));
    } else if (selection.from === "foundation") {
      const nextFoundations = {
        H: [...solitaireFoundations.H],
        D: [...solitaireFoundations.D],
        C: [...solitaireFoundations.C],
        S: [...solitaireFoundations.S],
      };
      nextFoundations[selection.suit] = nextFoundations[selection.suit].slice(0, -1);
      setSolitaireFoundations(nextFoundations);
    } else {
      nextTableau[selection.col] = nextTableau[selection.col].slice(0, selection.index);
      const flipped = flipTableauTopIfNeeded(nextTableau, selection.col);
      for (let i = 0; i < nextTableau.length; i += 1) {
        nextTableau[i] = flipped[i];
      }
    }

    movingCards.forEach((card) => {
      nextTableau[targetCol].push({ ...card, faceUp: true });
    });

    setSolitaireTableau(nextTableau);
    setSolitaireSelection(null);
    if (undoPoint) {
      pushSolitaireUndo(undoPoint);
    }
    setSolitaireMessage(t("solitaireHint"));
    return true;
  };

  const tryAutoPlaceSolitaire = (selection: SolitaireSelection) => {
    const undoPoint = makeSolitaireSnapshot();
    let movingCard: SolitaireCard | null = null;
    if (selection.from === "waste") {
      movingCard = solitaireWaste[solitaireWaste.length - 1] || null;
    } else if (selection.from === "foundation") {
      const pile = solitaireFoundations[selection.suit] || [];
      movingCard = pile[pile.length - 1] || null;
    } else {
      const sourcePile = solitaireTableau[selection.col] || [];
      movingCard = sourcePile[selection.index] || null;
    }
    if (!movingCard) return false;

    const suits: SolitaireSuit[] = ["H", "D", "C", "S"];
    for (let i = 0; i < suits.length; i += 1) {
      const suit = suits[i];
      const foundationPile = solitaireFoundations[suit];
      const needed = foundationPile.length + 1;
      if (movingCard.suit === suit && movingCard.rank === needed) {
        if (moveSolitaireSelectionToFoundation(selection, suit, { recordUndo: false })) {
          pushSolitaireUndo(undoPoint);
          return true;
        }
      }
    }

    for (let col = 0; col < solitaireTableau.length; col += 1) {
      if (selection.from === "tableau" && selection.col === col) continue;
      if (moveSolitaireSelectionToTableau(selection, col, { recordUndo: false })) {
        pushSolitaireUndo(undoPoint);
        return true;
      }
    }

    return false;
  };

  const canOfferSolitaireAutoClear = useCallback(() => {
    if (!gameStarted.solitaire || isSolitaireOver) return false;
    if (foundationCount(solitaireFoundations) >= 52) return false;
    if (solitaireStock.length > 0 || solitaireWaste.length > 0) return false;

    for (let col = 0; col < solitaireTableau.length; col += 1) {
      const pile = solitaireTableau[col];
      for (let i = 0; i < pile.length; i += 1) {
        if (!pile[i]?.faceUp) return false;
      }
    }

    return true;
  }, [foundationCount, gameStarted.solitaire, isSolitaireOver, solitaireFoundations, solitaireStock.length, solitaireTableau, solitaireWaste.length]);

  const autoClearSolitaire = () => {
    if (!canOfferSolitaireAutoClear()) {
      setSolitaireMessage(t("solitaireAutoClearUnavailable"));
      return;
    }

    const undoPoint = makeSolitaireSnapshot();

    const nextFoundations = {
      H: [...solitaireFoundations.H],
      D: [...solitaireFoundations.D],
      C: [...solitaireFoundations.C],
      S: [...solitaireFoundations.S],
    };
    const nextTableau = solitaireTableau.map((pile) => [...pile]);

    let movedAny = false;
    let guard = 0;
    const flightEntries: Array<{ card: SolitaireCard; toSuit: SolitaireSuit; from: "tableau"; col: number; index: number; delayMs: number }> = [];

    while (guard < 300) {
      guard += 1;
      let movedThisRound = false;

      for (let col = 0; col < nextTableau.length; col += 1) {
        const pile = nextTableau[col];
        if (pile.length === 0) continue;

        const top = pile[pile.length - 1];
        if (!top || !top.faceUp) continue;

        const suit = top.suit;
        const needed = nextFoundations[suit].length + 1;
        if (top.rank !== needed) continue;

        const topIndex = pile.length - 1;
        pile.pop();
        const newTop = pile[pile.length - 1];
        if (newTop && !newTop.faceUp) {
          newTop.faceUp = true;
        }
        nextFoundations[suit].push({ ...top, faceUp: true });
        flightEntries.push({
          card: { ...top, faceUp: true },
          toSuit: suit,
          from: "tableau",
          col,
          index: topIndex,
          delayMs: Math.min(260, flightEntries.length * 34),
        });
        movedThisRound = true;
        movedAny = true;
      }

      if (!movedThisRound || foundationCount(nextFoundations) >= 52) {
        break;
      }
    }

    if (!movedAny) {
      setSolitaireMessage(t("solitaireAutoClearUnavailable"));
      return;
    }

    setSolitaireTableau(nextTableau);
    setSolitaireFoundations(nextFoundations);
    setSolitaireSelection(null);
    emitSolitaireFoundationFlights(flightEntries);
    pushSolitaireUndo(undoPoint);
    if (!tryAutoWinSolitaire(nextFoundations)) {
      setSolitaireMessage(t("solitaireHint"));
    }
  };

  const onSolitaireMoveToFoundation = (suit: SolitaireSuit) => {
    if (isSolitaireOver) return;
    const pile = solitaireFoundations[suit] || [];
    const top = pile[pile.length - 1] || null;

    if (!solitaireSelection) {
      if (!top) {
        setSolitaireMessage(t("solitaireHint"));
        return;
      }
      setSolitaireSelection({ from: "foundation", suit });
      setSolitaireMessage(t("solitaireSelected"));
      return;
    }

    if (solitaireSelection.from === "foundation" && solitaireSelection.suit === suit) {
      setSolitaireSelection(null);
      setSolitaireMessage(t("solitaireHint"));
      return;
    }

    moveSolitaireSelectionToFoundation(solitaireSelection, suit);
  };

  const onSolitaireMoveToTableau = (targetCol: number) => {
    if (isSolitaireOver || !solitaireSelection) return;
    moveSolitaireSelectionToTableau(solitaireSelection, targetCol);
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

  const onSurvivorsApplyScore = () => {
    const nextScore = Math.max(
      0,
      Math.floor(survivorsTimeSec * 4 + survivorsKills * 14 + survivorsWave * 20 + survivorsLevel * 10),
    );
    setScore(nextScore);
    setMessage(t("survivorsAppliedScore"));
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
    if (!gameStarted.survivors) return;

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
  }, [activePanel, gameStarted.survivors, isSurvivorsOver, survivorsEnemies.length, survivorsWave, t]);

  useEffect(() => {
    if (activePanel !== "chinchiro") return;
    if (!chinchiroPlayerDice && !chinchiroDealerDice && !isChinchiroOver) {
      setChinchiroMessage(t("chinchiroHint"));
    }
  }, [activePanel, chinchiroDealerDice, chinchiroPlayerDice, isChinchiroOver, t]);

  useEffect(() => {
    if (activePanel !== "sevens") return;
    if (!gameStarted.sevens) return;
    if (sevensHands[0].length === 0 && sevensHands[1].length === 0) {
      resetSevens();
    }
  }, [activePanel, gameStarted.sevens, resetSevens, sevensHands]);

  useEffect(() => {
    if (activePanel !== "sevens" || sevensTurn !== "cpu" || isSevensOver) return;
    if (!gameStarted.sevens) return;

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
  }, [activePanel, gameStarted.sevens, isSevensOver, sevensHands, sevensTable, sevensTurn, t]);

  useEffect(() => {
    if (activePanel !== "daifugo") return;
    if (!gameStarted.daifugo) return;
    if (daifugoHands[0].length === 0 && daifugoHands[1].length === 0) {
      resetDaifugo();
    }
  }, [activePanel, daifugoHands, gameStarted.daifugo, resetDaifugo]);

  useEffect(() => {
    if (connectedRoomCode) return;
    if (activePanel !== "daifugo" || daifugoTurn !== "cpu" || isDaifugoOver) return;
    if (!gameStarted.daifugo) return;

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
  }, [activePanel, connectedRoomCode, daifugoHands, daifugoPassStreak, daifugoTableCard, daifugoTurn, gameStarted.daifugo, isDaifugoOver, t, tf]);

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
    if (!isMahjongOver && mahjongBoard.length === MAHJONG_START_HAND_COUNT && mahjongRiver.length === 0) {
      setMahjongMessage(t("mahjongHint"));
    }
  }, [activePanel, isMahjongOver, mahjongBoard.length, mahjongRiver.length, t]);

  useEffect(() => {
    if (activePanel !== "poker") return;
    if (!gameStarted.poker) return;
    if (pokerPlayerHand.length === 0 || pokerCpuHand.length === 0) {
      resetPoker();
    }
  }, [activePanel, gameStarted.poker, pokerCpuHand.length, pokerPlayerHand.length, resetPoker]);

  useEffect(() => {
    if (activePanel !== "solitaire") return;
    if (!gameStarted.solitaire) return;
    if (solitaireStock.length === 0 && solitaireWaste.length === 0 && foundationCount(solitaireFoundations) === 0) {
      resetSolitaire();
    }
  }, [activePanel, foundationCount, gameStarted.solitaire, resetSolitaire, solitaireFoundations, solitaireStock.length, solitaireWaste.length]);

  useEffect(() => {
    if (activePanel !== "survivors") return;
    if (!gameStarted.survivors) return;
    if (survivorsEnemies.length === 0 && survivorsWave === 1 && survivorsTimeSec === 0) {
      resetSurvivors();
    }
  }, [activePanel, gameStarted.survivors, resetSurvivors, survivorsEnemies.length, survivorsTimeSec, survivorsWave]);

  const resetUno = useCallback(() => {
    const deck = shuffleCards(createUnoDeck());
    if (isUnoExtendedMode) {
      const totalPlayers = connectedRoomCode ? unoRoomTotalPlayers : unoLocalTotalPlayers;
      const hands: UnoCard[][] = Array.from({ length: totalPlayers }, (_, i) => deck.slice(i * 7, i * 7 + 7));
      const top = deck[totalPlayers * 7] || { color: "R", value: 0 };
      const rest = deck.slice(totalPlayers * 7 + 1);
      setUnoLocalHands(hands);
      setUnoPlayerHand(hands[0] || []);
      setUnoCpuHand(hands[1] || []);
      setUnoLocalTurnIndex(0);
      setUnoTopCard(top);
      setUnoDeck(rest);
      setUnoTurn("player");
      setIsUnoOver(false);
      setUnoMessage(t("unoYourTurn"));
      return;
    }

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
  }, [connectedRoomCode, isUnoExtendedMode, t, unoLocalTotalPlayers, unoRoomTotalPlayers]);

  const drawUnoCard = useCallback((): UnoCard | null => {
    if (unoDeck.length <= 0) return null;
    const [card, ...rest] = unoDeck;
    setUnoDeck(rest);
    return card;
  }, [unoDeck]);

  const playUnoCard = useCallback(
    (index: number, options?: { isRemote?: boolean; side?: "player" | "cpu" }) => {
      if (isUnoExtendedMode) {
        if (isUnoOver || !unoTopCard) return;
        const isRemote = Boolean(options?.isRemote);
        let actorIndex = connectedRoomCode ? unoRoomHumanIndex : 0;

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
        if (connectedRoomCode && isRemote) {
          actorIndex = 1;
        }
        if (actorIndex < 0 || unoLocalTurnIndex !== actorIndex) return;

        const currentHand = unoLocalHands[actorIndex] || [];
        const card = currentHand[index];
        if (!card) return;
        if (!canPlayCard(card, unoTopCard)) {
          setUnoMessage(t("unoNoPlayable"));
          return;
        }

        const nextHand = currentHand.filter((_, i) => i !== index);
        const nextHands = [...unoLocalHands];
        nextHands[actorIndex] = nextHand;
        setUnoLocalHands(nextHands);
        setUnoPlayerHand(nextHands[0] || []);
        setUnoCpuHand(nextHands[1] || []);
        setUnoTopCard(card);
        const whoLabel = actorIndex === 0 ? "YOU" : actorIndex === 1 ? "OPP" : `CPU ${actorIndex - 1}`;
        setUnoMessage(tf("unoPlayedCard", { who: whoLabel, card: unoCardLabel(card) }));

        if (nextHand.length === 0) {
          setIsUnoOver(true);
          setUnoMessage(actorIndex === 0 ? t("unoPlayerWin") : t("unoCpuWin"));
          return;
        }

        const totalPlayers = connectedRoomCode ? unoRoomTotalPlayers : unoLocalTotalPlayers;
        const nextTurn = (actorIndex + 1) % Math.max(2, totalPlayers);
        setUnoLocalTurnIndex(nextTurn);
        setUnoTurn(nextTurn === 0 ? "player" : "cpu");
        return;
      }

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
    [canOperateUnoNow, connectedRoomCode, isUnoExtendedMode, isUnoOver, roomRole, sendRoomEvent, t, tf, unoCardLabel, unoCpuHand, unoLocalHands, unoLocalTotalPlayers, unoLocalTurnIndex, unoPlayerHand, unoRoomHumanIndex, unoRoomTotalPlayers, unoTopCard, unoTurn],
  );

  const drawUnoForPlayer = useCallback((options?: { isRemote?: boolean; side?: "player" | "cpu" }) => {
    if (isUnoExtendedMode) {
      if (isUnoOver) return;
      const isRemote = Boolean(options?.isRemote);
      let actorIndex = connectedRoomCode ? unoRoomHumanIndex : 0;

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
      if (connectedRoomCode && isRemote) {
        actorIndex = 1;
      }
      if (actorIndex < 0 || unoLocalTurnIndex !== actorIndex) return;

      const card = drawUnoCard();
      if (!card) {
        setUnoMessage(t("unoNoPlayable"));
        const totalPlayers = connectedRoomCode ? unoRoomTotalPlayers : unoLocalTotalPlayers;
        const nextTurn = (actorIndex + 1) % Math.max(2, totalPlayers);
        setUnoLocalTurnIndex(nextTurn);
        setUnoTurn(nextTurn === 0 ? "player" : "cpu");
        return;
      }
      const nextHands = [...unoLocalHands];
      nextHands[actorIndex] = [...(nextHands[actorIndex] || []), card];
      setUnoLocalHands(nextHands);
      setUnoPlayerHand(nextHands[0] || []);
      setUnoCpuHand(nextHands[1] || []);
      const whoLabel = actorIndex === 0 ? "YOU" : actorIndex === 1 ? "OPP" : `CPU ${actorIndex - 1}`;
      setUnoMessage(tf("unoDrewCard", { who: whoLabel }));
      const totalPlayers = connectedRoomCode ? unoRoomTotalPlayers : unoLocalTotalPlayers;
      const nextTurn = (actorIndex + 1) % Math.max(2, totalPlayers);
      setUnoLocalTurnIndex(nextTurn);
      setUnoTurn(nextTurn === 0 ? "player" : "cpu");
      return;
    }

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
  }, [canOperateUnoNow, connectedRoomCode, drawUnoCard, isUnoExtendedMode, isUnoOver, roomRole, sendRoomEvent, t, tf, unoLocalHands, unoLocalTotalPlayers, unoLocalTurnIndex, unoRoomHumanIndex, unoRoomTotalPlayers, unoTurn]);

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
    if (!gameStarted.uno) return;
    if (!unoTopCard && !isUnoOver) {
      resetUno();
    }
  }, [activePanel, gameStarted.uno, isUnoOver, resetUno, unoTopCard]);

  useEffect(() => {
    if (!isUnoExtendedMode) return;
    if (connectedRoomCode && roomRole !== "host") return;
    if (!gameStarted.uno) return;
    if (isUnoOver || !unoTopCard) return;
    const cpuStartIndex = connectedRoomCode ? 2 : 1;
    if (unoLocalTurnIndex < cpuStartIndex) return;

    setUnoMessage(t("unoCpuTurn"));
    const timer = setTimeout(() => {
      const cpuIndex = unoLocalTurnIndex;
      const hand = unoLocalHands[cpuIndex] || [];
      const playableIndex = hand.findIndex((card) => canPlayCard(card, unoTopCard));
      if (playableIndex >= 0) {
        const card = hand[playableIndex];
        const nextHand = hand.filter((_, i) => i !== playableIndex);
        const nextHands = [...unoLocalHands];
        nextHands[cpuIndex] = nextHand;
        setUnoLocalHands(nextHands);
        setUnoPlayerHand(nextHands[0] || []);
        setUnoCpuHand(nextHands[1] || []);
        setUnoTopCard(card);
        if (nextHand.length === 0) {
          setIsUnoOver(true);
          setUnoMessage(t("unoCpuWin"));
          return;
        }
        setUnoMessage(tf("unoPlayedCard", { who: `CPU ${cpuIndex}`, card: unoCardLabel(card) }));
        const totalPlayers = connectedRoomCode ? unoRoomTotalPlayers : unoLocalTotalPlayers;
        const nextTurn = (cpuIndex + 1) % Math.max(2, totalPlayers);
        setUnoLocalTurnIndex(nextTurn);
        setUnoTurn(nextTurn === 0 ? "player" : "cpu");
        return;
      }

      const drawn = unoDeck[0];
      if (drawn) {
        setUnoDeck((prev) => prev.slice(1));
        const nextHands = [...unoLocalHands];
        nextHands[cpuIndex] = [...(nextHands[cpuIndex] || []), drawn];
        setUnoLocalHands(nextHands);
        setUnoPlayerHand(nextHands[0] || []);
        setUnoCpuHand(nextHands[1] || []);
        setUnoMessage(tf("unoDrewCard", { who: `CPU ${cpuIndex}` }));
      }
      const totalPlayers = connectedRoomCode ? unoRoomTotalPlayers : unoLocalTotalPlayers;
      const nextTurn = (cpuIndex + 1) % Math.max(2, totalPlayers);
      setUnoLocalTurnIndex(nextTurn);
      setUnoTurn(nextTurn === 0 ? "player" : "cpu");
    }, 550);

    return () => clearTimeout(timer);
  }, [connectedRoomCode, gameStarted.uno, isUnoExtendedMode, isUnoOver, roomRole, t, tf, unoCardLabel, unoDeck, unoLocalHands, unoLocalTotalPlayers, unoLocalTurnIndex, unoRoomTotalPlayers, unoTopCard]);

  const cloudAuthPayload = useMemo(() => {
    if (authMode !== "cloud") return null;
    const userId = authUserId.trim();
    const password = authPassword;
    const sessionId = authSessionId.trim();
    if (!userId || !password || !sessionId) return null;
    return { userId, password, sessionId };
  }, [authMode, authPassword, authSessionId, authUserId]);

  const canAccessInquiryViewer = useMemo(() => {
    if (authMode !== "cloud") return false;
    const currentUserId = authUserId.trim().slice(0, 24);
    if (!currentUserId) return false;
    return INQUIRY_ADMIN_USER_IDS.includes(currentUserId);
  }, [authMode, authUserId]);

  const callCloudApi = useCallback(async <T extends CloudApiResult>(path: string, payload: Record<string, unknown>) => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);

    let res: Response;
    try {
      res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (error) {
      if ((error as Error)?.name === "AbortError") {
        throw new Error("REQUEST_TIMEOUT");
      }
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }

    const data = (await res.json().catch(() => ({}))) as T;
    if (!res.ok) {
      throw new Error(String(data?.code || data?.message || `HTTP ${res.status}`));
    }
    if (data?.ok !== true) {
      throw new Error(String(data?.code || data?.message || "API_FAILED"));
    }
    return data;
  }, []);

  const callCloudAuthApi = useCallback(async (path: string, payload: Record<string, unknown>) => {
    const data = await callCloudApi<CloudAuthResult & CloudApiResult>(path, payload);
    return data as CloudAuthResult;
  }, [callCloudApi]);

  const requestFitPuzzleProgress = useCallback((): FitPuzzleProgress | null => {
    if (authMode === "cloud") {
      return fitPuzzleProgressRef.current
        || readFitPuzzleProgressFromStorage(cloudFitPuzzleProgressStorageKey(authUserId));
    }
    return readFitPuzzleProgressFromStorage(STORAGE_FIT_PUZZLE_PROGRESS_KEY);
  }, [authMode, authUserId]);

  const saveFitPuzzleProgress = useCallback((rawProgress: unknown) => {
    const normalized = normalizeFitPuzzleProgress(rawProgress);
    if (!normalized) return;
    fitPuzzleProgressRef.current = normalized;
    setFitPuzzleProgress(normalized);

    if (authMode === "cloud") {
      try {
        localStorage.setItem(cloudFitPuzzleProgressStorageKey(authUserId), JSON.stringify(normalized));
      } catch {
        // ignore storage write failure
      }
    }

    if (authMode !== "cloud" || !cloudAuthPayload) {
      try {
        localStorage.setItem(STORAGE_FIT_PUZZLE_PROGRESS_KEY, JSON.stringify(normalized));
      } catch {
        // ignore storage write failure
      }
      return;
    }

    if (fitPuzzleProgressSaveTimerRef.current !== null) {
      window.clearTimeout(fitPuzzleProgressSaveTimerRef.current);
    }
    fitPuzzleProgressSaveTimerRef.current = window.setTimeout(() => {
      void callCloudApi<CloudApiResult>("/api/profile/save", {
        ...cloudAuthPayload,
        profile: {
          fitPuzzleProgress: normalized,
        },
      }).catch((error) => {
        console.warn("fitPuzzleProgress save failed", error);
      });
    }, 350);
  }, [authMode, authUserId, callCloudApi, cloudAuthPayload]);

  const normalizeFriendList = useCallback((value: unknown): { ids: string[]; names: Record<string, string> } => {
    if (!Array.isArray(value)) {
      return {
        ids: [],
        names: {},
      };
    }
    const unique = new Set<string>();
    const names: Record<string, string> = {};
    value.forEach((item) => {
      const source = item && typeof item === "object" ? (item as Record<string, unknown>) : null;
      const rawFriendId = source ? source.friendId ?? source.userId : item;
      const normalized = String(rawFriendId || "").trim();
      if (normalized) {
        unique.add(normalized);
        if (source) {
          const playerName = String(source.playerName || "").trim();
          if (playerName) {
            names[normalized] = playerName;
          }
        }
      }
    });
    return {
      ids: Array.from(unique),
      names,
    };
  }, []);

  const applyFriendPayload = useCallback((payload: Record<string, unknown>) => {
    const nextNames: Record<string, string> = {};
    if ("friends" in payload) {
      const normalized = normalizeFriendList(payload.friends);
      setFriendIds(normalized.ids);
      Object.assign(nextNames, normalized.names);
    }
    if ("incoming" in payload) {
      const normalized = normalizeFriendList(payload.incoming);
      setIncomingFriendIds(normalized.ids);
      Object.assign(nextNames, normalized.names);
    }
    if ("outgoing" in payload) {
      const normalized = normalizeFriendList(payload.outgoing);
      setOutgoingFriendIds(normalized.ids);
      Object.assign(nextNames, normalized.names);
    }
    if (Object.keys(nextNames).length > 0) {
      setFriendDisplayNames((prev) => ({
        ...prev,
        ...nextNames,
      }));
    }
  }, [normalizeFriendList]);

  const mapFriendErrorMessage = useCallback((code: string) => {
    if (code === "FRIEND_ID_REQUIRED" || code === "REQUESTER_ID_REQUIRED") return t("friendIdRequired");
    if (code === "FRIEND_NOT_FOUND") return t("friendNotFound");
    if (code === "FRIEND_SELF_FORBIDDEN") return t("friendSelfForbidden");
    if (code === "REQUEST_ALREADY_SENT") return t("friendRequestAlreadySent");
    if (code === "REQUEST_ALREADY_RECEIVED") return t("friendRequestAlreadyReceived");
    if (code === "REQUEST_NOT_FOUND") return t("friendRequestNotFound");
    if (code === "ALREADY_FRIENDS") return t("friendAlreadyExists");
    if (code === "FRIEND_CHAT_FORBIDDEN") return t("friendChatForbidden");
    if (code === "FRIEND_CHAT_MESSAGE_REQUIRED") return t("friendChatMessageRequired");
    if (code === "FRIEND_CHAT_RATE_LIMITED") return t("friendChatRateLimited");
    if (code === "AUTH_REQUIRED") return t("friendsHintNoAuth");
    return t("friendActionFailed");
  }, [t]);

  const loadFriendUnreadCounts = useCallback(async () => {
    if (!cloudAuthPayload) {
      setFriendUnreadCounts({});
      return;
    }

    try {
      const payload = await callCloudApi<CloudApiResult>("/api/friends/chat/unread", {
        ...cloudAuthPayload,
      });
      const source = payload.unreadByFriend;
      const next: Record<string, number> = {};
      if (source && typeof source === "object") {
        Object.entries(source as Record<string, unknown>).forEach(([friendUserId, value]) => {
          const normalizedId = String(friendUserId || "").trim();
          const count = Number(value);
          if (normalizedId && Number.isFinite(count) && count > 0) {
            next[normalizedId] = Math.floor(count);
          }
        });
      }
      const nextTotal = Object.values(next).reduce((sum, value) => sum + value, 0);
      const prevTotal = prevUnreadTotalRef.current;
      if (nextTotal > prevTotal) {
        try {
          const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (AudioCtx) {
            const context = new AudioCtx();
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.type = "triangle";
            oscillator.frequency.value = 880;
            gain.gain.setValueAtTime(0.0001, context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.2);
            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start();
            oscillator.stop(context.currentTime + 0.22);
            window.setTimeout(() => {
              void context.close();
            }, 260);
          }
        } catch {
          // Ignore sound play errors (autoplay/user gesture restrictions)
        }
      }
      prevUnreadTotalRef.current = nextTotal;
      setFriendUnreadCounts(next);
    } catch (error) {
      console.error(error);
    }
  }, [callCloudApi, cloudAuthPayload]);

  const markFriendChatRead = useCallback(async (friendUserId: string) => {
    if (!cloudAuthPayload) return;
    const normalized = friendUserId.trim().slice(0, 24);
    if (!normalized) return;

    try {
      await callCloudApi<CloudApiResult>("/api/friends/chat/read", {
        ...cloudAuthPayload,
        friendUserId: normalized,
      });
      setFriendUnreadCounts((prev) => {
        const next = { ...prev };
        delete next[normalized];
        return next;
      });
    } catch (error) {
      console.error(error);
    }
  }, [callCloudApi, cloudAuthPayload]);

  const normalizeFriendChatRows = useCallback((value: unknown): FriendChatMessage[] => {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => {
        const row = item && typeof item === "object" ? (item as Record<string, unknown>) : null;
        if (!row) return null;
        const id = Number(row.id);
        const senderUserId = String(row.senderUserId || "").trim();
        const receiverUserId = String(row.receiverUserId || "").trim();
        const message = String(row.message || "").trim();
        const createdAt = Number(row.createdAt);
        if (!Number.isFinite(id) || !senderUserId || !receiverUserId || !message) return null;
        return {
          id: Math.floor(id),
          senderUserId,
          receiverUserId,
          message,
          createdAt: Number.isFinite(createdAt) ? Math.floor(createdAt) : Date.now(),
        };
      })
      .filter((row): row is FriendChatMessage => Boolean(row))
      .sort((a, b) => a.createdAt - b.createdAt || a.id - b.id);
  }, []);

  const normalizeFriendChatPeerReadState = useCallback((value: unknown): FriendChatPeerReadState => {
    const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
    const lastReadMessageId = Number(row.lastReadMessageId);
    const lastReadAt = Number(row.lastReadAt);
    return {
      lastReadMessageId: Number.isFinite(lastReadMessageId) ? Math.max(0, Math.floor(lastReadMessageId)) : 0,
      lastReadAt: Number.isFinite(lastReadAt) ? Math.max(0, Math.floor(lastReadAt)) : 0,
    };
  }, []);

  const applyFriendChatPayload = useCallback((payload: CloudApiResult) => {
    setFriendChatMessages(normalizeFriendChatRows(payload.messages));
    setFriendChatPeerReadState(normalizeFriendChatPeerReadState(payload.peerReadState));
  }, [normalizeFriendChatPeerReadState, normalizeFriendChatRows]);

  const loadFriendChat = useCallback(async (friendUserId: string, showLoading = true, shouldMarkRead = false) => {
    if (!cloudAuthPayload) {
      setFriendChatMessages([]);
      setFriendChatPeerReadState({ lastReadMessageId: 0, lastReadAt: 0 });
      return;
    }

    const normalized = friendUserId.trim().slice(0, 24);
    if (!normalized) {
      setFriendChatMessages([]);
      setFriendChatPeerReadState({ lastReadMessageId: 0, lastReadAt: 0 });
      return;
    }

    if (showLoading) {
      setIsFriendChatLoading(true);
    }

    try {
      const payload = await callCloudApi<CloudApiResult>("/api/friends/chat/list", {
        ...cloudAuthPayload,
        friendUserId: normalized,
      });
      applyFriendChatPayload(payload);
      if (shouldMarkRead) {
        await markFriendChatRead(normalized);
      }
    } catch (error) {
      console.error(error);
      const code = error instanceof Error ? error.message : "UNKNOWN";
      setFriendsMessage(code === "FRIEND_CHAT_FORBIDDEN" ? t("friendChatForbidden") : t("friendChatLoadFailed"));
      setFriendChatMessages([]);
      setFriendChatPeerReadState({ lastReadMessageId: 0, lastReadAt: 0 });
    } finally {
      if (showLoading) {
        setIsFriendChatLoading(false);
      }
    }
  }, [applyFriendChatPayload, callCloudApi, cloudAuthPayload, markFriendChatRead, t]);

  const openFriendChat = useCallback((friendUserId: string) => {
    const normalized = friendUserId.trim().slice(0, 24);
    if (!normalized) return;
    setActiveFriendChatUserId(normalized);
    setFriendChatDraft("");
    void loadFriendChat(normalized, true, true);
  }, [loadFriendChat]);

  const sendFriendChat = useCallback(async () => {
    if (!cloudAuthPayload || !activeFriendChatUserId) {
      setFriendsMessage(t("friendsHintNoAuth"));
      return;
    }

    const message = friendChatDraft.trim();
    if (!message) {
      setFriendsMessage(t("friendChatMessageRequired"));
      return;
    }

    setIsFriendChatSending(true);
    try {
      const payload = await callCloudApi<CloudApiResult>("/api/friends/chat/send", {
        ...cloudAuthPayload,
        friendUserId: activeFriendChatUserId,
        message,
      });
      applyFriendChatPayload(payload);
      setFriendChatDraft("");
    } catch (error) {
      console.error(error);
      const code = error instanceof Error ? error.message : "UNKNOWN";
      setFriendsMessage(code === "FRIEND_CHAT_FORBIDDEN" ? t("friendChatForbidden") : t("friendChatSendFailed"));
    } finally {
      setIsFriendChatSending(false);
    }
  }, [activeFriendChatUserId, applyFriendChatPayload, callCloudApi, cloudAuthPayload, friendChatDraft, t]);

  const refreshFriends = useCallback(async (showLoading = true) => {
    if (!cloudAuthPayload) {
      setFriendIds([]);
      setIncomingFriendIds([]);
      setOutgoingFriendIds([]);
      setFriendDisplayNames({});
      return;
    }

    if (showLoading) {
      setIsFriendsLoading(true);
    }

    try {
      const [friendsData, incomingData, outgoingData] = await Promise.all([
        callCloudApi<CloudApiResult>("/api/friends/list", cloudAuthPayload),
        callCloudApi<CloudApiResult>("/api/friends/request/incoming", cloudAuthPayload),
        callCloudApi<CloudApiResult>("/api/friends/request/outgoing", cloudAuthPayload),
      ]);
      applyFriendPayload(friendsData as Record<string, unknown>);
      applyFriendPayload(incomingData as Record<string, unknown>);
      applyFriendPayload(outgoingData as Record<string, unknown>);
      await loadFriendUnreadCounts();
    } catch (error) {
      console.error(error);
      setFriendsMessage(t("friendsLoadFailed"));
    } finally {
      if (showLoading) {
        setIsFriendsLoading(false);
      }
    }
  }, [applyFriendPayload, callCloudApi, cloudAuthPayload, loadFriendUnreadCounts, t]);

  const runFriendAction = useCallback(async (
    path: string,
    body: Record<string, unknown>,
    successMessageKey: keyof typeof LOGIN_I18N.ja,
  ) => {
    if (!cloudAuthPayload) {
      setFriendsMessage(t("friendsHintNoAuth"));
      return;
    }

    setIsFriendsActionLoading(true);
    try {
      const payload = await callCloudApi<CloudApiResult>(path, {
        ...cloudAuthPayload,
        ...body,
      });
      applyFriendPayload(payload as Record<string, unknown>);
      await refreshFriends(false);
      setFriendsMessage(t(successMessageKey));
    } catch (error) {
      console.error(error);
      const code = error instanceof Error ? error.message : "UNKNOWN";
      setFriendsMessage(mapFriendErrorMessage(code));
    } finally {
      setIsFriendsActionLoading(false);
    }
  }, [applyFriendPayload, callCloudApi, cloudAuthPayload, mapFriendErrorMessage, refreshFriends, t]);

  const activeFriendRows = useMemo(() => {
    if (friendTab === "search") return friendSearchResults;
    if (friendTab === "incoming") return incomingFriendIds;
    if (friendTab === "outgoing") return outgoingFriendIds;
    return friendIds;
  }, [friendIds, friendSearchResults, friendTab, incomingFriendIds, outgoingFriendIds]);

  const visibleFriendRows = useMemo(() => {
    if (friendTab !== "friends") {
      return activeFriendRows;
    }
    const query = friendSearchQuery.trim().toLowerCase();
    if (!query) {
      return activeFriendRows;
    }
    return activeFriendRows.filter((id) => {
      const friendIdText = id.toLowerCase();
      const displayNameText = String(friendDisplayNames[id] || "").toLowerCase();
      return friendIdText.includes(query) || displayNameText.includes(query);
    });
  }, [activeFriendRows, friendDisplayNames, friendSearchQuery, friendTab]);

  const friendsHintText = useMemo(() => {
    if (authMode !== "cloud") return t("friendsHintNoAuth");
    if (friendTab === "search") return t("friendsHintSearch");
    if (friendTab === "incoming") return t("friendsHintIncoming");
    if (friendTab === "outgoing") return t("friendsHintOutgoing");
    return t("friendsHintReady");
  }, [authMode, friendTab, t]);

  const activeFriendsEmptyText = useMemo(() => {
    if (friendTab === "search") {
      return friendUserIdDraft.trim() ? t("friendsSearchEmpty") : t("friendsSearchPrompt");
    }
    if (friendTab === "incoming") return t("friendsIncomingEmpty");
    if (friendTab === "outgoing") return t("friendsOutgoingEmpty");
    if (friendSearchQuery.trim()) return t("friendsSearchEmpty");
    return t("friendsListEmpty");
  }, [friendSearchQuery, friendTab, friendUserIdDraft, t]);

  const loginStatusText = useMemo(() => {
    const safeName = (playerName.trim() || authUserId.trim() || "player").slice(0, 24);
    if (language === "ko") return `${safeName}(사용자명)으로 로그인 중입니다.`;
    if (language === "en") return `Logged in as ${safeName} (username).`;
    if (language === "zh") return `正在以${safeName}（用户名）登录。`;
    return `${safeName}（ユーザー名）でログイン中です。`;
  }, [authUserId, language, playerName]);

  const canUseFriends = isAuthenticated && authMode === "cloud" && Boolean(cloudAuthPayload);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (authMode !== "cloud") {
      setFriendIds([]);
      setIncomingFriendIds([]);
      setOutgoingFriendIds([]);
      setFriendSearchResults([]);
      setFriendDisplayNames({});
      setFriendUnreadCounts({});
      prevUnreadTotalRef.current = 0;
      setActiveFriendChatUserId("");
      setFriendChatMessages([]);
      setFriendChatPeerReadState({ lastReadMessageId: 0, lastReadAt: 0 });
      setFriendChatDraft("");
      return;
    }
    void refreshFriends(true);
  }, [authMode, isAuthenticated, refreshFriends]);

  useEffect(() => {
    if (activePanel !== "menu") return;
    if (!isFriendPanelOpen) return;
    if (!canUseFriends) return;

    void refreshFriends(false);
    const timer = window.setInterval(() => {
      if (isFriendsActionLoading || isFriendSearchLoading) return;
      void refreshFriends(false);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [activePanel, canUseFriends, isFriendPanelOpen, isFriendSearchLoading, isFriendsActionLoading, refreshFriends]);

  useEffect(() => {
    if (!isFriendPanelOpen || friendTab !== "friends" || !activeFriendChatUserId) return;
    if (activePanel !== "menu") return;
    if (!canUseFriends) return;
    const timer = window.setInterval(() => {
      void loadFriendChat(activeFriendChatUserId, false, true);
      void loadFriendUnreadCounts();
    }, 4000);
    return () => window.clearInterval(timer);
  }, [activeFriendChatUserId, activePanel, canUseFriends, friendTab, isFriendPanelOpen, loadFriendChat, loadFriendUnreadCounts]);

  useEffect(() => {
    if (activePanel !== "menu") return;
    if (!isFriendPanelOpen || friendTab !== "friends" || !activeFriendChatUserId) return;
    const listEl = friendChatListRef.current;
    if (!listEl) return;
    listEl.scrollTop = listEl.scrollHeight;
  }, [activePanel, activeFriendChatUserId, friendChatMessages, friendTab, isFriendPanelOpen]);

  useEffect(() => {
    if (friendTab !== "friends") return;
    if (friendIds.includes(activeFriendChatUserId)) return;
    setActiveFriendChatUserId("");
    setFriendChatMessages([]);
    setFriendChatPeerReadState({ lastReadMessageId: 0, lastReadAt: 0 });
    setFriendChatDraft("");
  }, [activeFriendChatUserId, friendIds, friendTab]);

  useEffect(() => {
    if (authMode === "guest") {
      setIsProfilePanelOpen(false);
      setIsProfileNameEditOpen(false);
      setIsProfileBioEditOpen(false);
      setIsFriendPanelOpen(false);
      setFriendSearchResults([]);
      setFriendActionUserId("");
      setFriendUnreadCounts({});
      prevUnreadTotalRef.current = 0;
      setActiveFriendChatUserId("");
      setFriendChatMessages([]);
      setFriendChatPeerReadState({ lastReadMessageId: 0, lastReadAt: 0 });
      setFriendChatDraft("");
      setRoomMemberActionId("");
      setPublicProfile(null);
    }
  }, [authMode]);

  const totalFriendUnreadCount = useMemo(() => {
    return Object.values(friendUnreadCounts).reduce((sum, value) => {
      const safeValue = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
      return sum + safeValue;
    }, 0);
  }, [friendUnreadCounts]);

  const applyPlayerName = useCallback(async () => {
    const nextName = profileNameDraft.trim().slice(0, 24);
    if (!nextName) {
      setMenuMessage(t("displayNameRequired"));
      return;
    }
    setPlayerName(nextName);
    setProfileNameDraft(nextName);

    if (authMode === "cloud" && cloudAuthPayload) {
      try {
        const payload = await callCloudApi<CloudApiResult>("/api/profile/save", {
          ...cloudAuthPayload,
          profile: {
            playerName: nextName,
            profileBio: profileBioDraft,
          },
        });
        const loaded = payload.profile as Record<string, unknown> | undefined;
        setProfileBioDraft(String(loaded?.profileBio || profileBioDraft).slice(0, 180));
      } catch (error) {
        console.error(error);
        setMenuMessage(t("profileSaveFailed"));
        return;
      }
    }

    setMenuMessage(t("displayNameUpdated"));
    setIsProfileNameEditOpen(false);
  }, [authMode, callCloudApi, cloudAuthPayload, profileBioDraft, profileNameDraft, t]);

  const applyProfileBio = useCallback(async () => {
    const nextBio = profileBioDraft
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .slice(0, 180);
    setProfileBioDraft(nextBio);

    if (authMode === "cloud" && cloudAuthPayload) {
      try {
        await callCloudApi<CloudApiResult>("/api/profile/save", {
          ...cloudAuthPayload,
          profile: {
            profileBio: nextBio,
          },
        });
      } catch (error) {
        console.error(error);
        setMenuMessage(t("profileSaveFailed"));
        return;
      }
    }

    setMenuMessage(t("profileBioUpdated"));
    setIsProfileBioEditOpen(false);
  }, [authMode, callCloudApi, cloudAuthPayload, profileBioDraft, t]);

  const handleFriendRemove = useCallback((targetFriendId?: string) => {
    const friendUserId = (targetFriendId ?? friendUserIdDraft).trim();
    if (!friendUserId) {
      setFriendsMessage(t("friendIdRequired"));
      return;
    }
    void runFriendAction("/api/friends/remove", { friendUserId }, "friendRemoveSuccess");
  }, [friendUserIdDraft, runFriendAction, t]);

  const handleFriendRequestSend = useCallback((target?: string) => {
    const targetUserId = (target ?? friendUserIdDraft).trim();
    if (!targetUserId) {
      setFriendsMessage(t("friendIdRequired"));
      return;
    }
    void runFriendAction("/api/friends/request/send", { targetUserId }, "friendRequestSent");
  }, [friendUserIdDraft, runFriendAction, t]);

  const searchFriendUsers = useCallback(async () => {
    if (!cloudAuthPayload) {
      setFriendsMessage(t("friendsHintNoAuth"));
      return;
    }
    const query = friendUserIdDraft.trim();
    if (!query) {
      setFriendsMessage(t("friendIdRequired"));
      setFriendSearchResults([]);
      return;
    }

    setIsFriendSearchLoading(true);
    try {
      const payload = await callCloudApi<CloudApiResult>("/api/friends/search", {
        ...cloudAuthPayload,
        query,
      });
      const source = Array.isArray(payload.users) ? payload.users : [];
      const nextNames: Record<string, string> = {};
      const next = Array.from(new Set(source
        .map((item) => {
          const row = item && typeof item === "object" ? (item as Record<string, unknown>) : null;
          if (row) {
            const friendId = String(row.friendId || row.userId || "").trim();
            if (!friendId) return "";
            const playerName = String(row.playerName || "").trim();
            if (playerName) {
              nextNames[friendId] = playerName;
            }
            return friendId;
          }
          return String(item || "").trim();
        })
        .filter(Boolean)));
      if (Object.keys(nextNames).length > 0) {
        setFriendDisplayNames((prev) => ({
          ...prev,
          ...nextNames,
        }));
      }
      setFriendSearchResults(next);
      if (next.length === 0) {
        setFriendsMessage(t("friendsSearchEmpty"));
      } else {
        setFriendsMessage("");
      }
    } catch (error) {
      console.error(error);
      const code = error instanceof Error ? error.message : "UNKNOWN";
      setFriendsMessage(mapFriendErrorMessage(code));
      setFriendSearchResults([]);
    } finally {
      setIsFriendSearchLoading(false);
    }
  }, [callCloudApi, cloudAuthPayload, friendUserIdDraft, mapFriendErrorMessage, t]);

  const handleFriendApprove = useCallback(() => {
    const requesterUserId = friendUserIdDraft.trim();
    if (!requesterUserId) {
      setFriendsMessage(t("friendIdRequired"));
      return;
    }
    void runFriendAction("/api/friends/request/approve", { requesterUserId }, "friendApproveSuccess");
  }, [friendUserIdDraft, runFriendAction, t]);

  const handleFriendReject = useCallback(() => {
    const requesterUserId = friendUserIdDraft.trim();
    if (!requesterUserId) {
      setFriendsMessage(t("friendIdRequired"));
      return;
    }
    void runFriendAction("/api/friends/request/reject", { requesterUserId }, "friendRejectSuccess");
  }, [friendUserIdDraft, runFriendAction, t]);

  const handleFriendCancel = useCallback(() => {
    const targetUserId = friendUserIdDraft.trim();
    if (!targetUserId) {
      setFriendsMessage(t("friendIdRequired"));
      return;
    }
    void runFriendAction("/api/friends/request/cancel", { targetUserId }, "friendCancelSuccess");
  }, [friendUserIdDraft, runFriendAction, t]);

  const openPublicProfile = useCallback(async (targetUserId: string, targetPlayerName = "") => {
    const normalizedUserId = targetUserId.trim();
    const normalizedPlayerName = targetPlayerName.trim();
    if (!normalizedUserId && !normalizedPlayerName) return;
    if (!cloudAuthPayload) {
      setFriendsMessage(t("friendsHintNoAuth"));
      return;
    }

    setIsPublicProfileLoading(true);
    try {
      const payload = await callCloudApi<CloudApiResult>("/api/profile/public", {
        ...cloudAuthPayload,
        ...(normalizedUserId ? { targetUserId: normalizedUserId } : {}),
        ...(normalizedPlayerName ? { targetPlayerName: normalizedPlayerName } : {}),
      });
      const loaded = payload.profile as Record<string, unknown> | undefined;
      setPublicProfile({
        userId: String(loaded?.userId || normalizedUserId || "-").slice(0, 24),
        friendId: String(loaded?.friendId || normalizedUserId || "-").slice(0, 24),
        playerName: String(loaded?.playerName || normalizedPlayerName || normalizedUserId).slice(0, 24),
        profileBio: String(loaded?.profileBio || "").slice(0, 180),
        playerAvatar: String(loaded?.playerAvatar || ""),
      });
      setFriendActionUserId("");
      setRoomMemberActionId("");
    } catch (error) {
      console.error(error);
      setFriendsMessage(t("profileViewerLoadFailed"));
    } finally {
      setIsPublicProfileLoading(false);
    }
  }, [callCloudApi, cloudAuthPayload, t]);

  const openProfileEditor = useCallback(() => {
    setActivePanel("menu");
    setIsFriendPanelOpen(false);
    setFriendActionUserId("");
    setIsProfilePanelOpen((prev) => {
      const next = !prev;
      if (!next) {
        setIsProfileNameEditOpen(false);
        setIsProfileBioEditOpen(false);
      }
      return next;
    });
  }, []);

  const loadScores = useCallback(async () => {
    setIsScoreLoading(true);
    try {
      const res = await fetch("/scores?limit=20", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data: unknown = await res.json();
      if (!Array.isArray(data)) {
        setScores([]);
        return;
      }
      const nextScores = data
        .map((row) => {
          if (!row || typeof row !== "object") return null;
          const item = row as Record<string, unknown>;
          const id = Number(item.id);
          const name = String(item.playerName || "").trim();
          const point = Number(item.score);
          const gameName = item.game == null ? null : String(item.game);
          const createdAt = item.createdAt == null ? undefined : String(item.createdAt);
          if (!Number.isFinite(id) || !name || !Number.isFinite(point)) return null;
          return {
            id,
            playerName: name,
            score: Math.floor(point),
            game: gameName,
            createdAt,
          };
        })
        .filter((row) => row !== null) as ScoreEntry[];
      setScores(nextScores);
    } catch (error) {
      console.error(error);
      setMessage(t("scoreLoadFailed"));
    } finally {
      setIsScoreLoading(false);
    }
  }, [t]);

  const saveScore = useCallback(async () => {
    const normalizedName = (profileNameDraft.trim() || playerName.trim() || "player-1").slice(0, 24);
    const normalizedScore = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;

    setIsScoreSaving(true);
    try {
      const res = await fetch("/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName: normalizedName,
          score: normalizedScore,
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
      setIsScoreSaving(false);
    }
  }, [game, loadScores, playerName, profileNameDraft, score, t]);

  const scoreDateLabel = useCallback((createdAt?: string) => {
    if (!createdAt) return "-";
    const parsed = new Date(createdAt);
    if (Number.isNaN(parsed.getTime())) return createdAt;
    return parsed.toLocaleString(language === "ja" ? "ja-JP" : "ko-KR", { hour12: false });
  }, [language]);

  const applyCloudLoginSuccess = useCallback((userId: string, password: string, data: CloudAuthResult) => {
    const nextSessionId = String(data?.sessionId || "").trim();
    if (!nextSessionId) {
      throw new Error("SESSION_REQUIRED");
    }
    const cloudName = String(data?.profile?.playerName || "").trim();
    const cloudBio = String(data?.profile?.profileBio || "").slice(0, 180);
    const cloudFitPuzzleProgress = normalizeFitPuzzleProgress(data?.profile?.fitPuzzleProgress)
      || readFitPuzzleProgressFromStorage(cloudFitPuzzleProgressStorageKey(userId));
    const nextName = (cloudName || userId || "player").slice(0, 24);
    setPlayerName(nextName);
    setProfileNameDraft(nextName);
    setProfileBioDraft(cloudBio);
    fitPuzzleProgressRef.current = cloudFitPuzzleProgress;
    setFitPuzzleProgress(cloudFitPuzzleProgress);
    localStorage.setItem(STORAGE_CLOUD_USER_ID_KEY, userId);
    localStorage.setItem(STORAGE_CLOUD_PASSWORD_KEY, password);
    localStorage.setItem(STORAGE_CLOUD_SESSION_ID_KEY, nextSessionId);
    const nextFriendId = String(data?.friendId || localStorage.getItem(STORAGE_CLOUD_FRIEND_ID_KEY) || "").trim().slice(0, 24);
    setCloudFriendId(nextFriendId);
    if (nextFriendId) {
      localStorage.setItem(STORAGE_CLOUD_FRIEND_ID_KEY, nextFriendId);
    } else {
      localStorage.removeItem(STORAGE_CLOUD_FRIEND_ID_KEY);
    }
    setAuthMode("cloud");
    setAuthSessionId(nextSessionId);
    setEntryMessage("");
    setFriendsMessage("");
    setQuickMatchMode(false);
    setPendingInviteToken("");
    setRoomChatMessages([]);
    setSpectatorChatMessages([]);
    setIsAuthenticated(true);
  }, []);

  const handleCloudLogin = useCallback(async () => {
    if (isAuthLoading) return;
    const userId = authUserId.trim();
    const password = authPassword;
    if (!userId || !password) {
      setEntryMessage(t("requireAuthFields"));
      return;
    }

    setIsAuthLoading(true);
    setEntryMessage(t("loginLoading"));
    const sessionId = authSessionId.trim() || undefined;
    try {
      const data = await callCloudAuthApi("/api/auth/login", {
        userId,
        password,
        sessionId,
      });
      applyCloudLoginSuccess(userId, password, data);
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      const isAlreadyLoggedIn = code === "ALREADY_LOGGED_IN" || code === "HTTP 409";
      if (isAlreadyLoggedIn) {
        try {
          await callCloudApi<CloudApiResult>("/api/auth/logout", {
            userId,
            password,
            sessionId,
          });
          const retried = await callCloudAuthApi("/api/auth/login", {
            userId,
            password,
            sessionId,
          });
          applyCloudLoginSuccess(userId, password, retried);
          return;
        } catch (retryError) {
          console.error(retryError);
          setEntryMessage(t("loginAlreadyLoggedIn"));
        }
      } else {
        console.error(error);
        setEntryMessage(t("loginFailed"));
      }
    } finally {
      setIsAuthLoading(false);
    }
  }, [applyCloudLoginSuccess, authPassword, authSessionId, authUserId, callCloudApi, callCloudAuthApi, isAuthLoading, t]);

  const handleCloudRegister = useCallback(async () => {
    if (isAuthLoading) return;
    const rawUserId = authUserId.trim();
    const userId = rawUserId.slice(0, 24);
    const password = authPassword;
    if (!userId || !password) {
      setEntryMessage(t("requireAuthFields"));
      return;
    }

    if (rawUserId.length > 24) {
      setEntryMessage(`${t("registerFailed")} (USER_ID_TOO_LONG: max 24 chars)`);
      return;
    }

    const registerConfirmMessage = language === "ja"
      ? `新規IDを作成しますか？\nID: ${userId}`
      : language === "ko"
        ? `새 ID를 생성하시겠습니까?\nID: ${userId}`
        : language === "zh"
          ? `要创建新ID吗？\nID: ${userId}`
          : `Create a new ID?\nID: ${userId}`;
    if (!window.confirm(registerConfirmMessage)) {
      setEntryMessage(language === "ja" ? "新規登録をキャンセルしました。" : "Registration canceled.");
      return;
    }

    setIsAuthLoading(true);
    setEntryMessage(t("registerLoading"));
    try {
      const data = await callCloudAuthApi("/api/auth/register", {
        userId,
        password,
        sessionId: authSessionId.trim() || undefined,
      });
      applyCloudLoginSuccess(userId, password, data);
      setMenuMessage(t("registerSuccess"));
    } catch (error) {
      console.error(error);
      const code = error instanceof Error ? String(error.message || "") : "";
      if (code === "USER_ALREADY_EXISTS") {
        setEntryMessage(`${t("registerFailed")} (USER_ALREADY_EXISTS)`);
      } else if (code === "USER_ID_CASE_CONFLICT") {
        if (language === "ja") {
          setEntryMessage("このIDは大文字/小文字違いを含めて既に使われています。別のIDを入力してください。");
        } else {
          setEntryMessage("This user ID is already used (case-insensitive). Please choose a different ID.");
        }
      } else {
        setEntryMessage(`${t("registerFailed")} (${code || "UNKNOWN_ERROR"})`);
      }
    } finally {
      setIsAuthLoading(false);
    }
  }, [applyCloudLoginSuccess, authPassword, authSessionId, authUserId, callCloudAuthApi, isAuthLoading, language, t]);

  const buildCredentialMemo = useCallback(() => {
    const userId = authUserId.trim().slice(0, 24);
    const password = authPassword;
    if (!userId || !password) return null;

    const locale = language === "ja" ? "ja-JP" : language === "ko" ? "ko-KR" : language === "zh" ? "zh-CN" : "en-US";
    const issuedAt = new Date().toLocaleString(locale, { hour12: false });
    const text = [
      "Neon Board Arcade Credential Memo",
      `SavedAt: ${issuedAt}`,
      `UserId: ${userId}`,
      `Password: ${password}`,
      "",
      "Important: Keep this memo in a safe place.",
    ].join("\n");

    return { userId, password, issuedAt, text };
  }, [authPassword, authUserId, language]);

  const handleDownloadCredentialTxt = useCallback(() => {
    const memo = buildCredentialMemo();
    if (!memo) {
      setEntryMessage(t("requireAuthFields"));
      return;
    }

    const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15);
    const safeUserId = memo.userId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = `neon-credential-${safeUserId}-${stamp}.txt`;
    const blob = new Blob([memo.text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setEntryMessage(t("credentialSaveTxtDone"));
  }, [buildCredentialMemo, t]);

  const handlePrintCredentialPdf = useCallback(() => {
    const memo = buildCredentialMemo();
    if (!memo) {
      setEntryMessage(t("requireAuthFields"));
      return;
    }

    const popup = window.open("", "_blank", "noopener,noreferrer,width=740,height=920");
    if (!popup) {
      setEntryMessage(t("credentialSavePopupBlocked"));
      return;
    }

    const escapeHtml = (raw: string) => raw
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

    popup.document.open();
    popup.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Credential Memo</title>
  <style>
    body { font-family: "Segoe UI", sans-serif; margin: 24px; color: #0f172a; }
    .card { border: 1px solid #94a3b8; border-radius: 12px; padding: 16px; max-width: 640px; }
    h1 { margin: 0 0 12px; font-size: 22px; }
    .row { margin: 8px 0; word-break: break-all; }
    .label { display: inline-block; min-width: 92px; color: #334155; font-weight: 700; }
    .warn { margin-top: 14px; color: #b45309; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Neon Board Arcade Credential Memo</h1>
    <div class="row"><span class="label">SavedAt:</span> ${escapeHtml(memo.issuedAt)}</div>
    <div class="row"><span class="label">UserId:</span> ${escapeHtml(memo.userId)}</div>
    <div class="row"><span class="label">Password:</span> ${escapeHtml(memo.password)}</div>
    <p class="warn">Important: Keep this memo in a safe place.</p>
  </div>
</body>
</html>`);
    popup.document.close();
    popup.focus();
    popup.print();
    setEntryMessage(t("credentialSavePdfDone"));
  }, [buildCredentialMemo, t]);

  useEffect(() => {
    if (!isAuthLoading) return;
    const timer = window.setTimeout(() => {
      setIsAuthLoading(false);
    }, 12000);
    return () => window.clearTimeout(timer);
  }, [isAuthLoading]);

  const handleGuestStart = useCallback(() => {
    const nextName = profileNameDraft.trim().slice(0, 24) || "guest";
    setPlayerName(nextName);
    setProfileNameDraft(nextName);
    setProfileBioDraft("");
    localStorage.removeItem(STORAGE_CLOUD_USER_ID_KEY);
    localStorage.removeItem(STORAGE_CLOUD_PASSWORD_KEY);
    localStorage.removeItem(STORAGE_CLOUD_SESSION_ID_KEY);
    setAuthMode("guest");
    setAuthSessionId("");
    try {
      const raw = localStorage.getItem(STORAGE_FIT_PUZZLE_PROGRESS_KEY);
      setFitPuzzleProgress(raw ? normalizeFitPuzzleProgress(JSON.parse(raw)) : null);
    } catch {
      setFitPuzzleProgress(null);
    }
    setEntryMessage("");
    setFriendsMessage("");
    setFriendUserIdDraft("");
    setQuickMatchMode(false);
    setPendingInviteToken("");
    setRoomChatMessages([]);
    setSpectatorChatMessages([]);
    setMenuMessage(t("guestStarted"));
    setIsAuthenticated(true);
  }, [profileNameDraft, t]);

  useEffect(() => {
    if (activePanel === "scores") {
      setActivePanel("menu");
    }
  }, [activePanel]);

  const handleBackToLogin = useCallback(() => {
    if (authMode === "cloud") {
      const userId = authUserId.trim();
      const password = authPassword;
      const sessionId = authSessionId.trim();
      if (userId && password && sessionId) {
        void callCloudApi<CloudApiResult>("/api/auth/logout", {
          userId,
          password,
          sessionId,
        }).catch((error) => {
          console.warn("logout failed", error);
        });
      }
    }

    closeRoomSocket();
    setConnectedRoomCode("");
    setRoomParticipants([]);
    setRoomRole("");
    setRoomStatus(t("roomStateIdle"));
    setFriendsMessage("");
    setFriendUserIdDraft("");
    setQuickMatchMode(false);
    setPendingInviteToken("");
    setRoomChatMessages([]);
    setSpectatorChatMessages([]);
    localStorage.removeItem(STORAGE_CLOUD_SESSION_ID_KEY);
    localStorage.removeItem(STORAGE_CLOUD_FRIEND_ID_KEY);
    setAuthSessionId("");
    setCloudFriendId("");
    setIsAuthenticated(false);
  }, [authMode, authPassword, authSessionId, authUserId, callCloudApi, closeRoomSocket, t]);

  useEffect(() => {
    if (!isAuthenticated || authMode !== "cloud" || !cloudAuthPayload) return;

    const ping = () => {
      void callCloudApi<CloudApiResult>("/api/auth/ping", cloudAuthPayload)
        .then((payload) => {
          const nextFriendId = String((payload as Record<string, unknown>).friendId || "").trim().slice(0, 24);
          if (!nextFriendId) return;
          setCloudFriendId(nextFriendId);
          localStorage.setItem(STORAGE_CLOUD_FRIEND_ID_KEY, nextFriendId);
        })
        .catch((error) => {
          const code = error instanceof Error ? error.message : "";
          if (code === "INVALID_SESSION") {
            setEntryMessage(t("loginFailed"));
            setIsAuthenticated(false);
          }
        });
    };

    ping();
    const timer = window.setInterval(ping, 60_000);
    return () => window.clearInterval(timer);
  }, [authMode, callCloudApi, cloudAuthPayload, isAuthenticated, t]);

  const othelloChaosShowsBlackSide =
    othelloChaosTarget === "black"
    || othelloChaosTarget === "both"
    || (othelloChaosTarget === "player" && othelloPlayerSide === 1)
    || (othelloChaosTarget === "opponent" && othelloPlayerSide === 2);
  const othelloChaosShowsWhiteSide =
    othelloChaosTarget === "white"
    || othelloChaosTarget === "both"
    || (othelloChaosTarget === "player" && othelloPlayerSide === 2)
    || (othelloChaosTarget === "opponent" && othelloPlayerSide === 1);
  const othelloChaosUsesBothSideSettings = othelloChaosTarget === "both";
  const othelloShowChaosSidePanel = isChaosMode && !gameStarted.othello;
  const othelloCurrentPlayerIndex = othelloPlayerIndex(currentPlayer);
  const othelloSelfDrawVoted = othelloDrawVotes.includes(peerIdRef.current);
  const othelloCanUseChaosSkills =
    isChaosMode && gameStarted.othello && canOperateOthelloNow && !isGameOver;
  const othelloImmutableButtonArmed = Boolean(othelloImmutableArmed[othelloCurrentPlayerIndex]);
  const othelloDestroyButtonArmed = Boolean(othelloDestroyArmed[othelloCurrentPlayerIndex]);
  const othelloDoubleButtonArmed = Boolean(othelloDoubleArmed[othelloCurrentPlayerIndex]);
  const othelloImmutableButtonEnabled =
    othelloCanUseChaosSkills
    && (othelloImmutableButtonArmed || (othelloImmutableCharges[othelloCurrentPlayerIndex] ?? 0) > 0);
  const othelloDestroyButtonEnabled =
    othelloCanUseChaosSkills
    && (othelloDestroyButtonArmed || (othelloDestroyRemaining[othelloCurrentPlayerIndex] ?? 0) > 0);
  const othelloDoubleButtonEnabled =
    othelloCanUseChaosSkills
    && (othelloDoubleButtonArmed || (othelloDoubleActionCharges[othelloCurrentPlayerIndex] ?? 0) > 0);
  const othelloShowImmutableGuide = isChaosMode && othelloImmutableButtonArmed;
  const othelloShowDestroyGuide = isChaosMode && othelloDestroyButtonArmed;
  const othelloDestroySelectedCurrent = othelloDestroySelectedSacrifices[othelloCurrentPlayerIndex] ?? [];
  const othelloDestroySelectedCount = othelloDestroySelectedCurrent.length;
  const othelloDestroySelectedKeySet = new Set(
    othelloDestroySelectedCurrent.map((cell) => `${cell.row}-${cell.col}`),
  );
  let othelloDestroyCornerCandidateCount = 0;
  const othelloDestroySelfCandidateKeySet = new Set<string>();
  const othelloDestroyEnemyCandidateKeySet = new Set<string>();
  if (othelloShowDestroyGuide) {
    const enemy: 1 | 2 = currentPlayer === 1 ? 2 : 1;
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        if (othelloBrokenMask[row][col] || othelloFixedMask[row][col]) continue;
        if (board[row][col] === currentPlayer) {
          const key = `${row}-${col}`;
          othelloDestroySelfCandidateKeySet.add(key);
          if (isOthelloCorner(row, col)) othelloDestroyCornerCandidateCount += 1;
        }
        if (board[row][col] === enemy) {
          const key = `${row}-${col}`;
          othelloDestroyEnemyCandidateKeySet.add(key);
        }
      }
    }
  }
  const othelloDestroyMode: "corner" | "self" | "enemy" | null = !othelloShowDestroyGuide
    ? null
    : othelloDestroyCornerCandidateCount > 0
      ? "corner"
      : othelloDestroySelectedCount >= OTHELLO_NO_CORNER_SACRIFICE_COUNT
        ? "enemy"
        : "self";
  const othelloDestroyGuideText =
    othelloDestroyMode === "corner"
      ? t("othelloChaosDestroyGuideCorner")
      : othelloDestroyMode === "enemy"
        ? t("othelloChaosDestroyGuideEnemy")
        : othelloShowDestroyGuide
          ? tf("othelloChaosDestroyGuideSelf", {
            count: String(othelloDestroySelectedCount),
            need: String(OTHELLO_NO_CORNER_SACRIFICE_COUNT),
          })
          : "";
  const othelloHideLegalMarker = othelloShowImmutableGuide || othelloShowDestroyGuide;

  const onToggleOthelloImmutableSkill = () => {
    if (!othelloCanUseChaosSkills) return;
    const playerIndex = othelloCurrentPlayerIndex;
    const nextImmutableArmed: [boolean, boolean] = [...othelloImmutableArmed];
    const nextDestroyArmed: [boolean, boolean] = [...othelloDestroyArmed];
    const nextDestroySelected: [{ row: number; col: number }[], { row: number; col: number }[]] = [
      [...othelloDestroySelectedSacrifices[0]],
      [...othelloDestroySelectedSacrifices[1]],
    ];

    if (nextImmutableArmed[playerIndex]) {
      nextImmutableArmed[playerIndex] = false;
      setOthelloImmutableArmed(nextImmutableArmed);
      return;
    }

    if ((othelloImmutableCharges[playerIndex] ?? 0) <= 0) {
      setOthelloMessage(t("othelloChaosNeedMutableDisc"));
      return;
    }

    nextImmutableArmed[playerIndex] = true;
    nextDestroyArmed[playerIndex] = false;
    nextDestroySelected[playerIndex] = [];
    setOthelloImmutableArmed(nextImmutableArmed);
    setOthelloDestroyArmed(nextDestroyArmed);
    setOthelloDestroySelectedSacrifices(nextDestroySelected);
    setOthelloMessage(t("othelloChaosNeedOwnDisc"));
  };

  const onToggleOthelloDestroySkill = () => {
    if (!othelloCanUseChaosSkills) return;
    const player = currentPlayer;
    const enemy: 1 | 2 = player === 1 ? 2 : 1;
    const playerIndex = othelloCurrentPlayerIndex;
    const nextDestroyArmed: [boolean, boolean] = [...othelloDestroyArmed];
    const nextImmutableArmed: [boolean, boolean] = [...othelloImmutableArmed];
    const nextDestroySelected: [{ row: number; col: number }[], { row: number; col: number }[]] = [
      [...othelloDestroySelectedSacrifices[0]],
      [...othelloDestroySelectedSacrifices[1]],
    ];

    if (nextDestroyArmed[playerIndex]) {
      nextDestroyArmed[playerIndex] = false;
      nextDestroySelected[playerIndex] = [];
      setOthelloDestroyArmed(nextDestroyArmed);
      setOthelloDestroySelectedSacrifices(nextDestroySelected);
      return;
    }

    if ((othelloDestroyRemaining[playerIndex] ?? 0) <= 0) {
      setOthelloMessage(t("othelloChaosNeedMutableDisc"));
      return;
    }

    nextDestroyArmed[playerIndex] = true;
    nextImmutableArmed[playerIndex] = false;
    nextDestroySelected[playerIndex] = [];
    setOthelloDestroyArmed(nextDestroyArmed);
    setOthelloImmutableArmed(nextImmutableArmed);
    setOthelloDestroySelectedSacrifices(nextDestroySelected);

    let cornerSacrifices = 0;
    let selfSacrifices = 0;
    let targets = 0;
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        if (othelloBrokenMask[row][col] || othelloFixedMask[row][col]) continue;
        if (board[row][col] === player) {
          selfSacrifices += 1;
          if (isOthelloCorner(row, col)) cornerSacrifices += 1;
        }
        if (board[row][col] === enemy) targets += 1;
      }
    }

    if (cornerSacrifices > 0) {
      setOthelloMessage(targets >= OTHELLO_CORNER_SACRIFICE_DESTROY_COUNT
        ? t("othelloChaosDestroySelectSacrifice")
        : t("othelloChaosDestroySelectTarget"));
      return;
    }

    if (selfSacrifices >= OTHELLO_NO_CORNER_SACRIFICE_COUNT && targets >= OTHELLO_NO_CORNER_DESTROY_COUNT) {
      setOthelloMessage(t("othelloChaosDestroySelectSacrifice"));
      return;
    }

    setOthelloMessage(selfSacrifices < OTHELLO_NO_CORNER_SACRIFICE_COUNT
      ? t("othelloChaosDestroySelectSacrifice")
      : t("othelloChaosDestroySelectTarget"));
  };

  const onToggleOthelloDoubleSkill = () => {
    if (!othelloCanUseChaosSkills) return;
    const playerIndex = othelloCurrentPlayerIndex;
    const nextDoubleArmed: [boolean, boolean] = [...othelloDoubleArmed];

    if (nextDoubleArmed[playerIndex]) {
      nextDoubleArmed[playerIndex] = false;
      setOthelloDoubleArmed(nextDoubleArmed);
      return;
    }

    if ((othelloDoubleActionCharges[playerIndex] ?? 0) <= 0) {
      setOthelloMessage(t("othelloChaosNeedMutableDisc"));
      return;
    }

    nextDoubleArmed[playerIndex] = true;
    setOthelloDoubleArmed(nextDoubleArmed);
    setOthelloMessage(t("othelloChaosSkillArmed"));
  };

  const onOthelloResetClick = () => {
    if (connectedRoomCode && roomRole === "spectator") {
      setMenuMessage(t("spectatorReadOnly"));
      return;
    }

    runWithResetGuard("othello", () => resetOthello({}, isChaosMode, { rerollRandomSide: true }));
  };

  const isPanelStartCounting = useCallback((panel: PlayablePanel) => {
    return false;
  }, []);

  const startButtonLabel = useCallback((panel: PlayablePanel) => {
    return t("gameStart");
  }, [t]);

  useEffect(() => {
    if (!connectedRoomCode) return;
    if (!gameStarted.othello) return;
    if (isGameOver) return;
    if (othelloDrawVotes.length < 2) return;
    finalizeOthelloDrawAgreement();
  }, [
    connectedRoomCode,
    finalizeOthelloDrawAgreement,
    gameStarted.othello,
    isGameOver,
    othelloDrawVotes,
  ]);

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#16213a_0%,#0d1324_45%,#090d18_100%)] px-4 py-6 text-slate-100 sm:px-6 sm:py-8 xl:px-8">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
          <header className="rounded-2xl border border-cyan-200/20 bg-cyan-300/10 p-6 backdrop-blur">
            <div className="flex items-center justify-end gap-3">
              <div className="flex items-center gap-1 rounded-md border border-cyan-200/30 bg-slate-950/40 p-1 text-xs">
                <span className="px-1 text-cyan-100">{t("languageLabel")}</span>
                {languageButtons.map((button) => (
                  <button
                    key={`entry-lang-${button.code}`}
                    type="button"
                    onClick={() => switchLanguage(button.code)}
                    className={`rounded px-2 py-1 ${language === button.code ? "bg-cyan-300 text-slate-900" : "text-slate-100"}`}
                  >
                    {t(button.labelKey)}
                  </button>
                ))}
              </div>
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{t("loginTitle")}</h1>
          </header>

          <section className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
            <div className="grid gap-3">
              <label className="grid gap-1 text-sm">
                {t("userId")}
                <input
                  value={authUserId}
                  onChange={(event) => setAuthUserId(event.target.value.slice(0, 24))}
                  autoComplete="username"
                  placeholder="user123"
                  className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                />
              </label>

              <label className="grid gap-1 text-sm">
                {t("password")}
                <input
                  type="password"
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="password"
                  className="rounded-lg border border-slate-400/40 bg-slate-950/70 px-3 py-2"
                />
              </label>

              <div className="mt-1 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleCloudLogin()}
                  className="rounded-md bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
                >
                  {isAuthLoading ? t("processing") : t("loginButton")}
                </button>
                <button
                  type="button"
                  onClick={() => void handleCloudRegister()}
                  className="rounded-md border border-cyan-200/40 px-3 py-2 text-sm disabled:opacity-60"
                >
                  {t("registerButton")}
                </button>
                <button
                  type="button"
                  onClick={handleGuestStart}
                  className="rounded-md border border-emerald-200/40 px-3 py-2 text-sm disabled:opacity-60"
                >
                  {t("guestButton")}
                </button>
              </div>

              <div className="mt-2 rounded-lg border border-slate-400/25 bg-slate-950/35 p-3">
                <p className="text-xs text-slate-300">{t("credentialSaveLead")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadCredentialTxt}
                    className="rounded-md border border-cyan-200/40 px-3 py-1.5 text-xs hover:border-cyan-200/70"
                  >
                    {t("credentialSaveTxtButton")}
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintCredentialPdf}
                    className="rounded-md border border-cyan-200/40 px-3 py-1.5 text-xs hover:border-cyan-200/70"
                  >
                    {t("credentialSavePdfButton")}
                  </button>
                </div>
              </div>
            </div>

            {entryMessage ? <p className="mt-3 text-sm text-cyan-200">{entryMessage}</p> : null}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#16213a_0%,#0d1324_45%,#090d18_100%)] px-4 py-6 text-slate-100 sm:px-6 sm:py-8 xl:px-8">
      <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-6">
        <div className="relative">
          {authMode === "cloud" ? (
            <div className="fixed right-3 top-3 z-40 sm:right-6 sm:top-4">
              <p className="rounded-md border border-cyan-200/25 bg-slate-950/70 px-3 py-1 text-xs text-cyan-100/95 backdrop-blur">
                {loginStatusText}
              </p>
            </div>
          ) : null}
          <header className="rounded-2xl border border-cyan-200/20 bg-cyan-300/10 p-6 backdrop-blur">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-md border border-cyan-200/30 bg-slate-950/40 p-1 text-xs">
                    <span className="px-1 text-cyan-100">{t("languageLabel")}</span>
                    {languageButtons.map((button) => (
                      <button
                        key={`auth-lang-${button.code}`}
                        type="button"
                        onClick={() => switchLanguage(button.code)}
                        className={`rounded px-2 py-1 ${language === button.code ? "bg-cyan-300 text-slate-900" : "text-slate-100"}`}
                      >
                        {t(button.labelKey)}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-xs"
                  >
                    {t("backToLogin")} ({authMode === "cloud" ? t("modeCloud") : t("modeGuest")})
                  </button>
                </div>
                {authMode === "cloud" ? (
                  <div className="flex flex-col items-end gap-1">
                    <div className="relative flex items-center gap-2">
                    <button
                      type="button"
                      onClick={openProfileEditor}
                      className={`rounded-md border px-3 py-1 text-xs ${isProfilePanelOpen ? "border-cyan-200/80 bg-cyan-300 text-slate-900" : "border-cyan-200/40 hover:border-cyan-200/70"}`}
                      aria-expanded={isProfilePanelOpen}
                    >
                      {t("profileLink")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfilePanelOpen(false);
                        setFriendActionUserId("");
                        setIsProfileNameEditOpen(false);
                        setIsProfileBioEditOpen(false);
                        setIsFriendPanelOpen((prev) => !prev);
                      }}
                      className={`rounded-md border px-3 py-1 text-xs ${isFriendPanelOpen ? "border-cyan-200/80 bg-cyan-300 text-slate-900" : "border-cyan-200/40"}`}
                      aria-expanded={isFriendPanelOpen}
                    >
                      {t("friendsTitle")}
                    </button>

                    {activePanel === "menu" && isProfilePanelOpen ? (
                    <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfilePanelOpen(false);
                        setIsProfileNameEditOpen(false);
                        setIsProfileBioEditOpen(false);
                      }}
                      className="fixed inset-0 z-20 cursor-default bg-transparent"
                      aria-label="Close profile panel"
                    />
                    <section className="absolute right-0 top-full z-30 mt-2 w-[320px] max-w-[calc(100vw-1rem)] rounded-2xl border border-slate-300/20 bg-slate-900/95 p-4 shadow-[0_18px_35px_rgba(2,6,23,0.55)] sm:w-[360px]">
                      <p className="text-xs font-semibold">{t("profileLink")}</p>
                      <p className="mt-1 text-xs text-slate-300">{loginStatusText}</p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsProfileNameEditOpen((prev) => !prev)}
                          className="rounded-md border border-cyan-200/40 px-2.5 py-1.5 text-xs"
                        >
                          {t("displayName")}
                        </button>
                      </div>
                      {isProfileNameEditOpen ? (
                        <div className="mt-2.5 grid gap-1.5 sm:grid-cols-[1fr_auto]">
                          <input
                            value={profileNameDraft}
                            onChange={(event) => setProfileNameDraft(event.target.value.slice(0, 24))}
                            placeholder="Player"
                            className="rounded-md border border-slate-400/40 bg-slate-950/70 px-2.5 py-1.5 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => void applyPlayerName()}
                            className="rounded-md border border-cyan-200/40 px-2.5 py-1.5 text-xs"
                          >
                            {t("displayNameSave")}
                          </button>
                        </div>
                      ) : null}
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsProfileBioEditOpen((prev) => !prev)}
                          className="rounded-md border border-cyan-200/40 px-2.5 py-1.5 text-xs"
                        >
                          {t("profileBioLabel")}
                        </button>
                      </div>
                      {isProfileBioEditOpen ? (
                        <div className="mt-2.5 grid gap-1.5">
                          <textarea
                            value={profileBioDraft}
                            onChange={(event) => setProfileBioDraft(event.target.value.slice(0, 180))}
                            placeholder={t("profileBioPlaceholder")}
                            rows={4}
                            className="rounded-md border border-slate-400/40 bg-slate-950/70 px-2.5 py-1.5 text-xs"
                          />
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-slate-300">{profileBioDraft.length}/180</span>
                            <button
                              type="button"
                              onClick={() => void applyProfileBio()}
                              className="rounded-md border border-cyan-200/40 px-2.5 py-1.5 text-xs"
                            >
                              {t("profileBioSave")}
                            </button>
                          </div>
                        </div>
                      ) : null}
                      <p className="mt-1 text-xs text-slate-300">Friend ID: {cloudFriendId || "-"}</p>
                      <button
                        type="button"
                        onClick={() => {
                          void copyFriendId();
                        }}
                        className="mt-2 rounded-md border border-cyan-200/40 px-2.5 py-1.5 text-xs"
                      >
                        {t("friendIdCopy")}
                      </button>
                    </section>
                    </>
                    ) : null}

                    {activePanel === "menu" && isFriendPanelOpen ? (
                    <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsFriendPanelOpen(false);
                        setFriendActionUserId("");
                        setActiveFriendChatUserId("");
                        setFriendChatMessages([]);
                        setFriendChatPeerReadState({ lastReadMessageId: 0, lastReadAt: 0 });
                        setFriendChatDraft("");
                      }}
                      className="fixed inset-0 z-20 cursor-default bg-transparent"
                      aria-label="Close friends panel"
                    />
                    <section className="absolute right-0 top-full z-30 mt-2 w-[320px] max-w-[calc(100vw-1rem)] rounded-2xl border border-slate-300/20 bg-slate-900/95 p-4 shadow-[0_18px_35px_rgba(2,6,23,0.55)] sm:w-[360px]">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold">{t("friendsTitle")}</p>
                      <button
                        type="button"
                        onClick={() => {
                          void refreshFriends(true);
                        }}
                        disabled={!canUseFriends || isFriendsLoading || isFriendsActionLoading}
                        className="rounded-md border border-cyan-200/40 px-2 py-1 text-xs disabled:opacity-60"
                      >
                        {t("friendReload")}
                      </button>
                    </div>

                    <p className="mt-1 text-xs text-slate-300">{friendsHintText}</p>

                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFriendTab("friends")}
                        className={`rounded-full border px-2.5 py-1 text-[11px] ${friendTab === "friends" ? "border-amber-300/70 bg-amber-300/15" : "border-slate-400/40"}`}
                      >
                        {t("friendsTabFriends")} ({friendIds.length})
                        {totalFriendUnreadCount > 0 ? ` • ${totalFriendUnreadCount}` : ""}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFriendTab("incoming")}
                        className={`rounded-full border px-2.5 py-1 text-[11px] ${friendTab === "incoming" ? "border-amber-300/70 bg-amber-300/15" : "border-slate-400/40"}`}
                      >
                        {t("friendsTabIncoming")} ({incomingFriendIds.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFriendTab("outgoing")}
                        className={`rounded-full border px-2.5 py-1 text-[11px] ${friendTab === "outgoing" ? "border-amber-300/70 bg-amber-300/15" : "border-slate-400/40"}`}
                      >
                        {t("friendsTabOutgoing")} ({outgoingFriendIds.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFriendTab("search");
                          setFriendActionUserId("");
                        }}
                        className={`rounded-full border px-2.5 py-1 text-[11px] ${friendTab === "search" ? "border-amber-300/70 bg-amber-300/15" : "border-slate-400/40"}`}
                      >
                        {t("friendsTabSearch")}
                      </button>
                    </div>

                    <div className="mt-2.5 grid gap-1.5 sm:grid-cols-[1fr_auto_auto]">
                      <input
                        value={friendTab === "friends" ? friendSearchQuery : friendUserIdDraft}
                        onChange={(event) => {
                          const next = event.target.value.slice(0, 24);
                          if (friendTab === "friends") {
                            setFriendSearchQuery(next);
                          } else {
                            setFriendUserIdDraft(next);
                          }
                        }}
                        placeholder={friendTab === "friends" ? t("friendSearchPlaceholder") : t("friendIdPlaceholder")}
                        className="rounded-md border border-slate-400/40 bg-slate-950/70 px-2.5 py-1.5 text-xs"
                        disabled={!canUseFriends || isFriendsActionLoading}
                      />

                      {friendTab === "friends" ? (
                        <>
                          <span className="hidden sm:block" />
                          <span className="hidden sm:block" />
                        </>
                      ) : null}

                      {friendTab === "incoming" ? (
                        <>
                          <button
                            type="button"
                            onClick={handleFriendApprove}
                            disabled={!canUseFriends || isFriendsActionLoading}
                            className="rounded-md border border-emerald-200/40 px-2.5 py-1.5 text-xs disabled:opacity-60"
                          >
                            {t("friendApprove")}
                          </button>
                          <button
                            type="button"
                            onClick={handleFriendReject}
                            disabled={!canUseFriends || isFriendsActionLoading}
                            className="rounded-md border border-rose-200/40 px-2.5 py-1.5 text-xs disabled:opacity-60"
                          >
                            {t("friendReject")}
                          </button>
                        </>
                      ) : null}

                      {friendTab === "outgoing" ? (
                        <>
                          <button
                            type="button"
                            onClick={handleFriendCancel}
                            disabled={!canUseFriends || isFriendsActionLoading}
                            className="rounded-md border border-rose-200/40 px-2.5 py-1.5 text-xs disabled:opacity-60"
                          >
                            {t("friendCancel")}
                          </button>
                          <span className="hidden sm:block" />
                        </>
                      ) : null}

                      {friendTab === "search" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              void searchFriendUsers();
                            }}
                            disabled={!canUseFriends || isFriendsActionLoading || isFriendSearchLoading}
                            className="rounded-md border border-cyan-200/40 px-2.5 py-1.5 text-xs disabled:opacity-60"
                          >
                            {isFriendSearchLoading ? t("processing") : t("friendSearchAction")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFriendRequestSend()}
                            disabled={!canUseFriends || isFriendsActionLoading}
                            className="rounded-md border border-emerald-200/40 px-2.5 py-1.5 text-xs disabled:opacity-60"
                          >
                            {t("friendRequestSend")}
                          </button>
                        </>
                      ) : null}
                    </div>

                    {isFriendsLoading ? (
                      <p className="mt-3 text-xs text-slate-300">{t("friendsLoading")}</p>
                    ) : (
                      <ul className="mt-2.5 max-h-36 space-y-1 overflow-y-auto text-xs text-slate-200">
                        {visibleFriendRows.length === 0 ? (
                          <li className="text-slate-300">{activeFriendsEmptyText}</li>
                        ) : (
                          visibleFriendRows.map((id) => (
                            <li key={`friend-row-${friendTab}-${id}`}>
                              {(() => {
                                const displayName = friendDisplayNames[id] || id;
                                return (
                              <button
                                type="button"
                                onClick={() => {
                                  setFriendUserIdDraft(id);
                                  setFriendActionUserId((prev) => (prev === id ? "" : id));
                                }}
                                onDoubleClick={() => {
                                  setFriendUserIdDraft(id);
                                  void openPublicProfile(id);
                                }}
                                className="w-full rounded-md border border-slate-500/40 px-2 py-1 text-left text-xs hover:border-cyan-300/60"
                              >
                                <span className="flex items-center justify-between gap-2">
                                  <span>{displayName}</span>
                                  {friendTab === "friends" && (friendUnreadCounts[id] || 0) > 0 ? (
                                    <span className="rounded-full bg-rose-400/90 px-1.5 py-0.5 text-[10px] text-slate-950">
                                      {friendUnreadCounts[id]}
                                    </span>
                                  ) : null}
                                </span>
                              </button>
                                );
                              })()}
                              {friendActionUserId === id ? (
                                <div className="mt-1 flex justify-end">
                                  {friendTab === "friends" ? (
                                    <button
                                      type="button"
                                      onClick={() => void openPublicProfile(id)}
                                      className="mr-1 rounded-md border border-cyan-200/40 px-2 py-1 text-[11px]"
                                    >
                                      {t("friendViewProfile")}
                                    </button>
                                  ) : null}
                                  {friendTab === "friends" ? (
                                    <button
                                      type="button"
                                      onClick={() => openFriendChat(id)}
                                      className="mr-1 rounded-md border border-emerald-200/40 px-2 py-1 text-[11px]"
                                    >
                                      {t("friendOpenChat")}
                                    </button>
                                  ) : null}
                                  {friendTab === "friends" ? (
                                    <button
                                      type="button"
                                      onClick={() => handleFriendRemove(id)}
                                      className="rounded-md border border-rose-200/40 px-2 py-1 text-[11px]"
                                    >
                                      {t("friendRemove")}
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => void openPublicProfile(id)}
                                      className="rounded-md border border-cyan-200/40 px-2 py-1 text-[11px]"
                                    >
                                      {t("friendViewProfile")}
                                    </button>
                                  )}
                                  {friendTab === "search" ? (
                                    <button
                                      type="button"
                                      onClick={() => handleFriendRequestSend(id)}
                                      className="ml-1 rounded-md border border-emerald-200/40 px-2 py-1 text-[11px]"
                                    >
                                      {t("friendRequestSend")}
                                    </button>
                                  ) : null}
                                </div>
                              ) : null}
                            </li>
                          ))
                        )}
                      </ul>
                    )}

                    {friendTab === "friends" && activeFriendChatUserId ? (
                      <div className="mt-3 rounded-xl border border-emerald-200/25 bg-slate-950/60 p-2.5">
                        <p className="text-[11px] text-emerald-100">{tf("friendChatWith", { userId: friendDisplayNames[activeFriendChatUserId] || activeFriendChatUserId })}</p>

                        {isFriendChatLoading ? (
                          <p className="mt-2 text-xs text-slate-300">{t("friendChatLoading")}</p>
                        ) : (
                          <ul ref={friendChatListRef} className="mt-2 max-h-36 space-y-1 overflow-y-auto text-xs">
                            {friendChatMessages.length === 0 ? (
                              <li className="text-slate-300">{t("friendChatEmpty")}</li>
                            ) : (
                              friendChatMessages.map((row) => (
                                <li
                                  key={`friend-chat-${row.id}`}
                                  className={`rounded-md px-2 py-1 ${row.senderUserId === cloudFriendId.trim() ? "bg-cyan-300/15 text-cyan-100" : "bg-slate-800/70 text-slate-100"}`}
                                >
                                  <p className="text-[10px] opacity-80">{row.senderUserId === cloudFriendId.trim() ? playerName : (friendDisplayNames[row.senderUserId] || row.senderUserId)}</p>
                                  <p className="whitespace-pre-wrap break-words">{row.message}</p>
                                  {row.senderUserId === cloudFriendId.trim() && row.id <= friendChatPeerReadState.lastReadMessageId ? (
                                    <p className="mt-1 text-[10px] text-cyan-200/80">
                                      {friendChatPeerReadState.lastReadAt > 0
                                        ? tf("friendChatReadAt", { time: new Date(friendChatPeerReadState.lastReadAt).toLocaleTimeString() })
                                        : t("friendChatRead")}
                                    </p>
                                  ) : null}
                                </li>
                              ))
                            )}
                          </ul>
                        )}

                        <div className="mt-2 flex items-center gap-1.5">
                          <input
                            value={friendChatDraft}
                            onChange={(event) => setFriendChatDraft(event.target.value.slice(0, 400))}
                            placeholder={t("friendChatPlaceholder")}
                            className="min-w-0 flex-1 rounded-md border border-slate-500/40 bg-slate-900/70 px-2 py-1.5 text-xs"
                            disabled={!canUseFriends || isFriendChatSending}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                void sendFriendChat();
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => void sendFriendChat()}
                            disabled={!canUseFriends || isFriendChatSending}
                            className="rounded-md border border-emerald-200/40 px-2.5 py-1.5 text-xs disabled:opacity-60"
                          >
                            {t("friendChatSend")}
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {friendsMessage ? <p className="mt-2 text-xs text-cyan-200">{friendsMessage}</p> : null}
                    </section>
                    </>
                    ) : null}
                    </div>
                  </div>
                ) : null}
                {authMode !== "cloud" ? (
                  <div className="flex flex-col items-end gap-1">
                    <div className="relative flex items-center gap-2">
                      <button
                        type="button"
                        onClick={openProfileEditor}
                        className={`rounded-md border px-3 py-1 text-xs ${isProfilePanelOpen ? "border-cyan-200/80 bg-cyan-300 text-slate-900" : "border-cyan-200/40 hover:border-cyan-200/70"}`}
                        aria-expanded={isProfilePanelOpen}
                      >
                        {t("profileLink")}
                      </button>

                      {activePanel === "menu" && isProfilePanelOpen ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setIsProfilePanelOpen(false);
                              setIsProfileNameEditOpen(false);
                            }}
                            className="fixed inset-0 z-20 cursor-default bg-transparent"
                            aria-label="Close profile panel"
                          />
                          <section className="absolute right-0 top-full z-30 mt-2 w-[320px] max-w-[calc(100vw-1rem)] rounded-2xl border border-slate-300/20 bg-slate-900/95 p-4 shadow-[0_18px_35px_rgba(2,6,23,0.55)] sm:w-[360px]">
                            <p className="text-xs font-semibold">{t("profileLink")}</p>
                            <p className="mt-1 text-xs text-slate-300">{loginStatusText}</p>
                            <div className="mt-2.5 flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setIsProfileNameEditOpen((prev) => !prev)}
                                className="rounded-md border border-cyan-200/40 px-2.5 py-1.5 text-xs"
                              >
                                {t("displayName")}
                              </button>
                            </div>
                            {isProfileNameEditOpen ? (
                              <div className="mt-2.5 grid gap-1.5 sm:grid-cols-[1fr_auto]">
                                <input
                                  value={profileNameDraft}
                                  onChange={(event) => setProfileNameDraft(event.target.value.slice(0, 24))}
                                  placeholder="Player"
                                  className="rounded-md border border-slate-400/40 bg-slate-950/70 px-2.5 py-1.5 text-xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => void applyPlayerName()}
                                  className="rounded-md border border-cyan-200/40 px-2.5 py-1.5 text-xs"
                                >
                                  {t("displayNameSave")}
                                </button>
                              </div>
                            ) : null}
                          </section>
                        </>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{t("appTitle")}</h1>
            {authMode === "cloud" ? (
              <div className="mt-2 flex justify-end gap-2">
                {canAccessInquiryViewer ? (
                  <a
                    href="/admin/inquiries"
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-xs hover:border-cyan-200/70"
                  >
                    {t("inquiryViewerLink")}
                  </a>
                ) : null}
                <a
                  href="/inquiry"
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-xs hover:border-cyan-200/70"
                >
                  {t("inquiryFormLink")}
                </a>
              </div>
            ) : null}
          </header>
        </div>

        {message ? (
          <section className="rounded-2xl border border-cyan-200/20 bg-cyan-300/10 px-4 py-3">
            <p className="text-sm text-cyan-100">{message}</p>
          </section>
        ) : null}

        {isPublicProfileLoading || publicProfile ? (
          <>
            <button
              type="button"
              onClick={() => {
                setIsPublicProfileLoading(false);
                setPublicProfile(null);
              }}
              className="fixed inset-0 z-40 cursor-default bg-slate-950/50"
              aria-label="Close profile viewer"
            />
            <section className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-cyan-200/25 bg-slate-900 p-4 shadow-[0_18px_35px_rgba(2,6,23,0.55)]">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-cyan-100">{t("profileViewerTitle")}</p>
                <button
                  type="button"
                  onClick={() => {
                    setIsPublicProfileLoading(false);
                    setPublicProfile(null);
                  }}
                  className="rounded-md border border-cyan-200/40 px-2 py-1 text-xs"
                >
                  {t("closeLabel")}
                </button>
              </div>

              {isPublicProfileLoading ? (
                <p className="mt-3 text-sm text-slate-200">{t("processing")}</p>
              ) : publicProfile ? (
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 overflow-hidden rounded-full border border-cyan-200/40 bg-slate-950/70">
                      {publicProfile.playerAvatar ? (
                        <img
                          src={publicProfile.playerAvatar}
                          alt="profile avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-300">NO IMG</div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{publicProfile.playerName || publicProfile.userId}</p>
                      <p className="text-xs text-slate-300">Friend ID: {publicProfile.friendId || "-"}</p>
                    </div>
                  </div>
                  <div className="rounded-md border border-slate-500/35 bg-slate-950/50 p-2.5">
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-100">
                      {publicProfile.profileBio || t("profileViewerNoBio")}
                    </p>
                  </div>
                </div>
              ) : null}
            </section>
          </>
        ) : null}

        {activePanel === "menu" ? (
          <section className="grid gap-5">
            <article className="order-2 rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <h2 className="text-xl font-semibold">{t("menuTitle")}</h2>

              <div className="mt-4 space-y-4">
                {menuGameCardGroups.map((group) => (
                  <section key={`menu-category-${group.category}`}>
                    <button
                      type="button"
                      onClick={() => toggleMenuCardGroup(group.category)}
                      className="flex w-full items-center justify-between rounded-lg border border-cyan-200/35 bg-slate-950/35 px-3 py-2 text-left text-sm font-semibold tracking-wide text-cyan-100 transition-colors hover:bg-cyan-300/10 hover:border-cyan-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/80"
                      aria-expanded={menuCardOpenState[group.category]}
                    >
                      <span>{group.label}</span>
                      <span className="rounded border border-cyan-200/35 px-2 py-[2px] text-[11px] leading-none">{menuCardOpenState[group.category] ? "−" : "+"}</span>
                    </button>
                    {menuCardOpenState[group.category] ? (
                      <div className="mt-2 grid gap-3 sm:grid-cols-2">
                        {group.cards.map((card) => (
                          <button
                            key={`menu-card-${card.panel}`}
                            type="button"
                            onClick={card.onClick}
                            className={`${card.className} relative cursor-pointer transition duration-150 hover:-translate-y-0.5 hover:border-cyan-200/75 hover:bg-cyan-300/15 hover:shadow-[0_10px_22px_rgba(56,189,248,0.18)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/90`}
                          >
                            <span className="pointer-events-none absolute right-3 top-3 rounded border border-cyan-200/40 bg-slate-950/55 px-2 py-[2px] text-[10px] font-semibold tracking-wide text-cyan-100">OPEN</span>
                            <p className="flex items-center gap-2 text-lg font-semibold">
                              <span>{card.title}</span>
                              <span className="inline-flex items-center gap-1 rounded-md border border-cyan-200/55 bg-cyan-300/22 px-2 py-[2px] text-[11px] font-black leading-none text-cyan-50 shadow-[0_0_0_1px_rgba(34,211,238,0.18)_inset]">
                                <span className="tracking-wide">ROOM:</span>
                                <span className="font-mono [font-variant-numeric:tabular-nums] text-cyan-100">
                                  {roomOccupancyTextByPanel[card.panel]}
                                </span>
                              </span>
                            </p>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </section>
                ))}
              </div>
            </article>

            <article className="order-1 rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-semibold">{t("roomTitle")}</h2>
                <button
                  type="button"
                  onClick={() => setIsRoomControlsOpen((prev) => !prev)}
                  className="rounded-md border border-slate-300/35 px-3 py-1.5 text-xs text-slate-100 transition-colors hover:border-cyan-200/70 hover:text-cyan-100"
                  aria-expanded={isRoomControlsOpen}
                >
                  {isRoomControlsOpen ? t("roomControlsClose") : t("roomControlsOpen")}
                </button>
              </div>

              {isRoomControlsOpen ? (
              <div className="mt-4 grid gap-3">
                <div className="grid gap-2 rounded-lg border border-slate-400/25 bg-slate-950/35 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setIsMenuRoomListOpen((prev) => !prev)}
                      className="text-left text-sm font-semibold text-slate-100"
                      aria-expanded={isMenuRoomListOpen}
                    >
                      {t("roomListTitle")} {isMenuRoomListOpen ? "[-]" : "[+]"}
                    </button>
                    {isMenuRoomListOpen ? (
                      <button
                        type="button"
                        onClick={() => requestPublicRoomList("menu", false)}
                        className="rounded-md border border-cyan-200/40 px-2 py-1 text-xs"
                      >
                        {isMenuPublicRoomsLoading ? t("loading") : t("roomListRefresh")}
                      </button>
                    ) : null}
                  </div>
                  {isMenuRoomListOpen ? (menuPublicRooms.length === 0 ? (
                    <p className="text-sm text-slate-300">{t("roomListEmpty")}</p>
                  ) : (
                    <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-slate-100">
                      {menuPublicRooms.map((room) => {
                        const selected = room.code === selectedMenuPublicRoomCode;
                        const host = room.hostName || "Host";
                        const guest = room.guestName || t("roomOpponentWaiting");
                        const panelText = room.panels.length > 0
                          ? room.panels.map((panel) => roomPanelLabel(panel)).join(" / ")
                          : "-";
                        return (
                          <li key={`room-list-menu-${room.code}`}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMenuPublicRoomCode(room.code);
                                setRoomCode(room.code);
                              }}
                              className={`w-full rounded-md border px-2 py-1.5 text-left ${selected ? "border-cyan-300/80 bg-cyan-300/20" : "border-slate-500/40 bg-slate-900/40 hover:border-cyan-200/60"}`}
                            >
                              <p className="font-mono text-[11px]">{room.code}{room.isPublic ? "" : " 🔒"}</p>
                              <p className="text-[11px] text-slate-200">{host} vs {guest}</p>
                              <p className="text-[10px] text-slate-300">{panelText} • {room.totalParticipants}/16 • +{room.spectatorCount}</p>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={startQuickMatch}
                    className="rounded-md border border-emerald-200/40 px-3 py-2 text-sm"
                  >
                    {t("quickMatchMulti")}
                  </button>
                  <button
                    type="button"
                    onClick={createRoomFromMenu}
                    className="rounded-md bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950"
                  >
                    {t("roomCreate")}
                  </button>
                  <button
                    type="button"
                    onClick={joinRoomAsPlayer}
                    className="rounded-md border border-cyan-200/40 px-3 py-2 text-sm"
                  >
                    {t("roomJoin")}
                  </button>
                  <button
                    type="button"
                    onClick={joinRoomAsSpectator}
                    className="rounded-md border border-violet-200/40 px-3 py-2 text-sm"
                  >
                    {t("spectateJoin")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void copyInviteLink();
                    }}
                    disabled={!connectedRoomCode}
                    className="min-w-[11rem] rounded-md border border-amber-200/40 px-3 py-2 text-center text-sm disabled:opacity-60"
                  >
                    {inviteCopyFeedback === "copied"
                      ? t("inviteLinkCopied")
                      : inviteCopyFeedback === "failed"
                        ? t("inviteLinkCopyFailed")
                        : t("copyInviteLink")}
                  </button>
                  <button
                    type="button"
                    onClick={disconnectRoomFromCurrentPanel}
                    className="rounded-md border border-red-200/40 px-3 py-2 text-sm"
                  >
                    {t("roomDisconnect")}
                  </button>
                </div>

                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
                  <div className="grid gap-3">
                    <div className="rounded-lg border border-slate-400/25 bg-slate-950/40 p-3 text-sm">
                      <p>{t("roomState")}: {roomStatus}</p>
                      <p>{t("roomConnected")}: {connectedRoomCode || "-"}</p>
                      <p>{t("roomRole")}: {roomRole ? roomRoleLabel(roomRole) : "-"}</p>
                      <p>{t("roomMatchedPlayers")}: {connectedRoomCode ? roomOccupancyText : "-"}</p>
                      <p>{t("roomCapacityHint")}</p>
                      {quickMatchMode ? (
                        <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-cyan-200/30 bg-cyan-300/10 px-2 py-1 text-xs text-cyan-100">
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-cyan-100/35 border-t-cyan-100" aria-hidden="true" />
                          <span>{t("quickMatchSearching")}</span>
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-lg border border-slate-400/25 bg-slate-950/40 p-3">
                      <p className="text-sm font-semibold">
                        {t("roomMembers")}: {connectedRoomCode ? roomOccupancyText : "-"}
                      </p>
                      {roomParticipants.length === 0 ? (
                        <p className="mt-1 text-sm text-slate-300">{t("roomMembersEmpty")}</p>
                      ) : (
                        <ul className="mt-2 space-y-1 text-sm text-slate-200">
                          {roomParticipants.map((participant) => (
                            <li key={participant.id}>
                              <button
                                type="button"
                                onClick={() => setRoomMemberActionId((prev) => (prev === participant.id ? "" : participant.id))}
                                onDoubleClick={() => {
                                  void openPublicProfile(participant.id, participant.name);
                                }}
                                className="rounded border border-slate-500/40 px-2 py-1 text-left text-sm hover:border-cyan-300/60"
                              >
                                {participant.name} ({roomRoleLabel(participant.role)})
                              </button>
                              {roomMemberActionId === participant.id ? (
                                <div className="mt-1 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      void openPublicProfile(participant.id, participant.name);
                                    }}
                                    className="rounded-md border border-cyan-200/40 px-2 py-1 text-[11px]"
                                  >
                                    {t("friendViewProfile")}
                                  </button>
                                </div>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {connectedRoomCode && roomRole !== "spectator" ? (
                    <div className="flex h-[15.5rem] flex-col rounded-lg border border-slate-400/25 bg-slate-950/40 p-3">
                      <p className="text-sm font-semibold">{t("roomChatTitle")}</p>
                      <div className="mt-2 flex-1 space-y-1 overflow-y-auto rounded-md border border-slate-500/40 bg-slate-950/60 p-2 text-xs text-slate-200">
                        {roomChatMessages.length === 0 ? (
                          <p className="text-slate-300">{t("roomChatEmpty")}</p>
                        ) : (
                          roomChatMessages.map((row, index) => (
                            <p key={`room-chat-${index}-${row.name}`}>
                              <span className="text-cyan-200">{row.name}</span>: {row.text}
                            </p>
                          ))
                        )}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <input
                          value={roomChatInput}
                          onChange={(event) => setRoomChatInput(event.target.value.slice(0, 200))}
                          onKeyDown={(event) => {
                            if (event.key !== "Enter") return;
                            sendRoomChat();
                          }}
                          placeholder={t("roomChatPlaceholder")}
                          className="flex-1 rounded-md border border-slate-400/40 bg-slate-950/70 px-2 py-1 text-sm"
                          disabled={!connectedRoomCode}
                        />
                        <button
                          type="button"
                          onClick={sendRoomChat}
                          disabled={!connectedRoomCode}
                          className="rounded-md border border-cyan-200/40 px-3 py-1 text-xs disabled:opacity-60"
                        >
                          {t("roomChatSend")}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {connectedRoomCode && roomRole === "spectator" ? (
                    <div className="flex h-[15.5rem] flex-col rounded-lg border border-slate-400/25 bg-slate-950/40 p-3">
                      <p className="text-sm font-semibold">{t("spectatorChatTitle")}</p>
                      <div className="mt-2 flex-1 space-y-1 overflow-y-auto rounded-md border border-slate-500/40 bg-slate-950/60 p-2 text-xs text-slate-200">
                        {spectatorChatMessages.length === 0 ? (
                          <p className="text-slate-300">{t("spectatorChatEmpty")}</p>
                        ) : (
                          spectatorChatMessages.map((row, index) => (
                            <p key={`spectator-chat-${index}-${row.name}`}>
                              <span className="text-cyan-200">{row.name}</span>: {row.text}
                            </p>
                          ))
                        )}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <input
                          value={spectatorChatInput}
                          onChange={(event) => setSpectatorChatInput(event.target.value.slice(0, 200))}
                          onKeyDown={(event) => {
                            if (event.key !== "Enter") return;
                            sendSpectatorChat();
                          }}
                          placeholder={t("spectatorChatPlaceholder")}
                          className="flex-1 rounded-md border border-slate-400/40 bg-slate-950/70 px-2 py-1 text-sm"
                          disabled={!connectedRoomCode}
                        />
                        <button
                          type="button"
                          onClick={sendSpectatorChat}
                          disabled={!connectedRoomCode}
                          className="rounded-md border border-cyan-200/40 px-3 py-1 text-xs disabled:opacity-60"
                        >
                          {t("spectatorChatSend")}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

              </div>
              ) : null}

              {menuMessage ? <p className="mt-3 text-sm text-cyan-200">{menuMessage}</p> : null}
            </article>
          </section>
        ) : null}

        {activePanel !== "menu" && activePanel !== "scores" ? (
          <section className="rounded-xl border border-slate-300/20 bg-slate-900/35 p-3">
            <div className="grid gap-2">
              <p className="text-sm font-semibold text-slate-100">{t("roomTitle")}</p>
              <div className="grid gap-2 sm:grid-cols-[minmax(0,12rem)_auto] sm:items-center">
                <div className="rounded-md border border-slate-400/30 bg-slate-950/45 p-2">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPanelRoomListOpen((prev) => !prev)}
                      className="text-left text-xs font-semibold text-slate-100"
                      aria-expanded={isPanelRoomListOpen}
                    >
                      {t("roomListTitle")} {isPanelRoomListOpen ? "[-]" : "[+]"}
                    </button>
                    {isPanelRoomListOpen ? (
                      <button
                        type="button"
                        onClick={() => requestPublicRoomList("panel", false)}
                        className="rounded border border-cyan-200/40 px-2 py-[3px] text-[11px]"
                      >
                        {isPanelPublicRoomsLoading ? t("loading") : t("roomListRefresh")}
                      </button>
                    ) : null}
                  </div>
                  {isPanelRoomListOpen ? (filteredPanelPublicRooms.length === 0 ? (
                    <p className="text-xs text-slate-300">{t("roomListEmpty")}</p>
                  ) : (
                    <ul className="max-h-28 space-y-1 overflow-y-auto text-[11px] text-slate-100">
                      {filteredPanelPublicRooms.map((room) => {
                        const selected = room.code === selectedPanelPublicRoomCode;
                        const host = room.hostName || "Host";
                        const guest = room.guestName || t("roomOpponentWaiting");
                        return (
                          <li key={`room-list-panel-${room.code}`}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPanelPublicRoomCode(room.code);
                                setRoomCode(room.code);
                              }}
                              className={`w-full rounded border px-2 py-1 text-left ${selected ? "border-cyan-300/80 bg-cyan-300/20" : "border-slate-500/40 bg-slate-900/35 hover:border-cyan-200/60"}`}
                            >
                              <p>
                                <span className="font-mono">{room.code}{room.isPublic ? "" : " 🔒"}</span>
                                <span className="ml-2 text-slate-200">{host} vs {guest}</span>
                              </p>
                              <p className="text-[10px] text-slate-300">{room.totalParticipants}/16 • +{room.spectatorCount}</p>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )) : null}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200">
                  <span className="font-semibold text-slate-200">{t("roomPasswordLabel")}:</span>
                  <label className="inline-flex items-center gap-1.5">
                    <input
                      type="radio"
                      checked={roomVisibility === "public"}
                      onChange={() => setRoomVisibility("public")}
                    />
                    {t("roomPasswordOff")}
                  </label>
                  <label className="inline-flex items-center gap-1.5">
                    <input
                      type="radio"
                      checked={roomVisibility === "private"}
                      onChange={() => setRoomVisibility("private")}
                    />
                    {t("roomPasswordOn")}
                  </label>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={toggleRoomReady}
                  disabled={!connectedRoomCode || roomRole === "spectator"}
                  className="rounded-md border border-emerald-200/50 px-3 py-1.5 text-xs disabled:opacity-60"
                >
                  {myRoomReady ? "準備解除" : "準備完了"}
                </button>
                <button
                  type="button"
                  onClick={createRoomFromCurrentPanel}
                  className="rounded-md bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950"
                >
                  {t("roomCreate")}
                </button>
                <button
                  type="button"
                  onClick={joinRoomAsPlayer}
                  className="rounded-md border border-cyan-200/40 px-3 py-1.5 text-xs"
                >
                  {t("roomJoin")}
                </button>
                <button
                  type="button"
                  onClick={joinRoomAsSpectator}
                  className="rounded-md border border-violet-200/40 px-3 py-1.5 text-xs"
                >
                  {t("spectateJoin")}
                </button>
                <button
                  type="button"
                  onClick={disconnectRoomFromCurrentPanel}
                  className="rounded-md border border-red-200/40 px-3 py-1.5 text-xs"
                >
                  {t("roomDisconnect")}
                </button>
              </div>
              <p className="text-xs text-slate-300">{t("roomState")}: {roomStatus}</p>
              {connectedRoomCode ? (
                <p className="text-xs text-emerald-200">準備状況: {roomReadyCount}/{roomActivePlayerCount} {roomAllReady ? "(開始可能)" : "(全員準備で開始可能)"}</p>
              ) : null}
              {menuMessage ? <p className="text-xs text-cyan-200">{menuMessage}</p> : null}
            </div>
          </section>
        ) : null}

        {connectedRoomCode && activePanel !== "menu" && activePanel !== "scores" ? (
          <section className="rounded-xl border border-cyan-200/30 bg-slate-900/35 px-4 py-2 text-sm text-slate-200">
            <span className="text-slate-300">{t("roomOpponentLabel")}: </span>
            <span className="font-semibold text-cyan-100">{roomOpponentDisplay || t("roomOpponentWaiting")}</span>
          </section>
        ) : null}

        {activePanel === "othello" ? (
          <section className="grid gap-5">
            <article className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">{t("othelloTitle")}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => startPanelGame("othello", () => resetOthello({}, isChaosMode, { rerollRandomSide: true }))}
                  disabled={isPanelStartCounting("othello")}
                  className="rounded-md bg-cyan-400 px-3 py-1 text-sm font-semibold text-slate-950"
                >
                  {startButtonLabel("othello")}
                </button>
                <button
                  type="button"
                  onClick={onOthelloResetClick}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("othelloReset")}
                </button>
                <button
                  type="button"
                  onClick={handleBackToMenuClick}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("backToMenu")}
                </button>
              </div>
            </div>

            {!gameStarted.othello ? <p className="mt-2 text-xs text-amber-200">{t("gameStartPrompt")}</p> : null}

            <p className="text-sm text-slate-300">{othelloMessage}</p>
            {connectedRoomCode ? <p className="mt-1 text-xs text-cyan-200">{roomTurnText(canOperateOthelloNow)}</p> : null}

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <label className="grid gap-1 text-xs text-slate-300">
                  <span>{t("othelloModeLabel")}</span>
                  <select
                    value={othelloMode}
                    onChange={(event) => {
                      const nextMode = event.target.value as OthelloMode;
                      if (connectedRoomCode && nextMode !== "local" && nextMode !== "chaos") return;
                      setOthelloMode(nextMode);
                      setIsChaosMode(nextMode === "chaos");
                      resetOthello({}, nextMode === "chaos");
                    }}
                    disabled={Boolean(
                      gameStarted.othello
                      || (connectedRoomCode && (roomRole === "guest" || roomRole === "spectator"))
                    )}
                    className="rounded-md border border-slate-400/40 bg-slate-950/70 px-2 py-2 text-sm disabled:opacity-60"
                  >
                    {!connectedRoomCode ? <option value="cpu">{t("othelloModeCpu")}</option> : null}
                    {!connectedRoomCode ? <option value="cpuvscpu">{t("othelloModeCpuVsCpu")}</option> : null}
                    <option value="local">{t("othelloModeLocal")}</option>
                    <option value="chaos">{t("othelloModeChaos")}</option>
                  </select>
                  {connectedRoomCode ? <span className="text-[11px] text-slate-400">{roomRole === "host" ? "開始前のみ変更可能" : "ホストが設定"}</span> : null}
                </label>

                <label className="grid gap-1 text-xs text-slate-300">
                  <span>{t("othelloCpuLevelLabel")}</span>
                  <select
                    value={othelloCpuLevel}
                    onChange={(event) => setOthelloCpuLevel(event.target.value as OthelloCpuLevel)}
                    className="rounded-md border border-slate-400/40 bg-slate-950/70 px-2 py-2 text-sm"
                  >
                    <option value="easy">{t("othelloCpuLevelEasy")}</option>
                    <option value="normal">{t("othelloCpuLevelNormal")}</option>
                    <option value="hard">{t("othelloCpuLevelHard")}</option>
                  </select>
                </label>

                <label className={`grid gap-1 text-xs text-slate-300 ${othelloMode === "cpu" || othelloMode === "chaos" ? "" : "opacity-60"}`}>
                  <span>{t("othelloTurnOrderLabel")}</span>
                  <select
                    value={othelloTurnOrder}
                    onChange={(event) => {
                      const nextOrder = event.target.value as OthelloTurnOrder;
                      setOthelloTurnOrder(nextOrder);
                      const nextSide: 1 | 2 = nextOrder === "random"
                        ? (Math.random() < 0.5 ? 1 : 2)
                        : nextOrder === "white"
                          ? 2
                          : 1;
                      setOthelloPlayerSide(nextSide);
                      resetOthello({}, isChaosMode, { playerSideOverride: nextSide, turnOrderOverride: nextOrder });
                    }}
                    disabled={othelloMode !== "cpu" && othelloMode !== "chaos"}
                    className="rounded-md border border-slate-400/40 bg-slate-950/70 px-2 py-2 text-sm disabled:opacity-60"
                  >
                    <option value="black">{t("othelloTurnOrderBlack")}</option>
                    <option value="white">{t("othelloTurnOrderWhite")}</option>
                    <option value="random">{t("othelloTurnOrderRandom")}</option>
                  </select>
                </label>
              </div>

            <div className={`mt-4 grid gap-3 ${othelloShowChaosSidePanel ? "md:grid-cols-2 md:items-start" : ""}`}>
            {othelloShowChaosSidePanel ? (
              <div className="rounded-lg border border-cyan-200/25 bg-slate-950/35 p-3 text-xs text-slate-200 md:order-2">
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="grid gap-1">
                    <span>{t("othelloChaosTargetLabel")}</span>
                    <select
                      value={othelloChaosTarget}
                      onChange={(event) => {
                        const nextValue = event.target.value as OthelloChaosTarget;
                        setOthelloChaosTarget(nextValue);
                        resetOthello({ target: nextValue }, true);
                      }}
                      className="rounded-md border border-slate-400/40 bg-slate-950/70 px-2 py-1 text-xs"
                    >
                      <option value="none">{t("othelloChaosTargetNone")}</option>
                      <option value="black">{t("othelloChaosTargetBlack")}</option>
                      <option value="white">{t("othelloChaosTargetWhite")}</option>
                      <option value="both">{t("othelloChaosTargetBoth")}</option>
                      <option value="player">{t("othelloChaosTargetPlayer")}</option>
                      <option value="opponent">{t("othelloChaosTargetOpponent")}</option>
                    </select>
                  </label>
                  <label className="grid gap-1">
                    <span>{t("othelloChaosRandomLineIgnoreLabel")}</span>
                    <select
                      value={othelloChaosRandomLineIgnore}
                      onChange={(event) => {
                        const nextValue = event.target.value as OthelloChaosToggle;
                        setOthelloChaosRandomLineIgnore(nextValue);
                        resetOthello({ randomLineIgnore: nextValue }, true);
                      }}
                      className="rounded-md border border-slate-400/40 bg-slate-950/70 px-2 py-1 text-xs"
                    >
                      <option value="off">{t("othelloChaosToggleOff")}</option>
                      <option value="on">{t("othelloChaosToggleOn")}</option>
                    </select>
                  </label>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {othelloChaosShowsBlackSide ? (
                    <section className="rounded-md border border-slate-500/40 bg-slate-900/45 p-2">
                      <h3 className="mb-2 font-semibold">{t("othelloChaosBlackSideTitle")}</h3>
                      <div className="grid gap-2">
                        <label className="grid gap-1">
                          <span>{t("othelloChaosBlackHandicapLabel")}</span>
                          <select
                            value={othelloChaosUsesBothSideSettings ? othelloChaosBothBlackHandicap : othelloChaosHandicap}
                            onChange={(event) => {
                              const nextValue = event.target.value as OthelloChaosHandicap;
                              if (othelloChaosUsesBothSideSettings) {
                                setOthelloChaosBothBlackHandicap(nextValue);
                                resetOthello({ bothBlackHandicap: nextValue }, true);
                                return;
                              }
                              setOthelloChaosHandicap(nextValue);
                              resetOthello({ handicap: nextValue }, true);
                            }}
                            className="rounded-md border border-slate-400/40 bg-slate-950/70 px-2 py-1 text-xs"
                          >
                            <option value="none">{t("othelloChaosHandicapNone")}</option>
                            <option value="immutable1">{t("othelloChaosHandicapImmutable1")}</option>
                          </select>
                        </label>
                        <label className="grid gap-1">
                          <span>{t("othelloChaosBlackOverwriteLimitLabel")}</span>
                          <select
                            value={String(othelloChaosUsesBothSideSettings ? othelloChaosBothBlackOverwriteLimit : othelloChaosOverwriteLimit)}
                            onChange={(event) => {
                              const nextValue = Number(event.target.value);
                              if (othelloChaosUsesBothSideSettings) {
                                setOthelloChaosBothBlackOverwriteLimit(nextValue);
                                resetOthello({ bothBlackOverwriteLimit: nextValue }, true);
                                return;
                              }
                              setOthelloChaosOverwriteLimit(nextValue);
                              resetOthello({ overwriteLimit: nextValue }, true);
                            }}
                            className="rounded-md border border-slate-400/40 bg-slate-950/70 px-2 py-1 text-xs"
                          >
                            {OTHELLO_CHAOS_LIMIT_OPTIONS.map((limit) => (
                              <option key={`othello-chaos-overwrite-black-${limit}`} value={String(limit)}>{limit}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <label className="mt-2 grid gap-1">
                        <span>{t("othelloChaosBlackDestroyLimitLabel")}</span>
                        <select
                          value={String(othelloChaosDestroyLimitBlack)}
                          onChange={(event) => {
                            const nextValue = Number(event.target.value);
                            setOthelloChaosDestroyLimitBlack(nextValue);
                            resetOthello({ destroyLimitBlack: nextValue }, true);
                          }}
                          className="rounded-md border border-slate-400/40 bg-slate-950/70 px-2 py-1 text-xs"
                        >
                          {OTHELLO_CHAOS_LIMIT_OPTIONS.map((limit) => (
                            <option key={`othello-chaos-destroy-black-${limit}`} value={String(limit)}>{limit}</option>
                          ))}
                        </select>
                      </label>
                    </section>
                  ) : null}

                  {othelloChaosShowsWhiteSide ? (
                    <section className="rounded-md border border-slate-500/40 bg-slate-900/45 p-2">
                      <h3 className="mb-2 font-semibold">{t("othelloChaosWhiteSideTitle")}</h3>
                      <div className="grid gap-2">
                        <label className="grid gap-1">
                          <span>{t("othelloChaosWhiteHandicapLabel")}</span>
                          <select
                            value={othelloChaosUsesBothSideSettings ? othelloChaosBothWhiteHandicap : othelloChaosHandicap}
                            onChange={(event) => {
                              const nextValue = event.target.value as OthelloChaosHandicap;
                              if (othelloChaosUsesBothSideSettings) {
                                setOthelloChaosBothWhiteHandicap(nextValue);
                                resetOthello({ bothWhiteHandicap: nextValue }, true);
                                return;
                              }
                              setOthelloChaosHandicap(nextValue);
                              resetOthello({ handicap: nextValue }, true);
                            }}
                            className="rounded-md border border-slate-400/40 bg-slate-950/70 px-2 py-1 text-xs"
                          >
                            <option value="none">{t("othelloChaosHandicapNone")}</option>
                            <option value="immutable1">{t("othelloChaosHandicapImmutable1")}</option>
                          </select>
                        </label>
                        <label className="grid gap-1">
                          <span>{t("othelloChaosWhiteOverwriteLimitLabel")}</span>
                          <select
                            value={String(othelloChaosUsesBothSideSettings ? othelloChaosBothWhiteOverwriteLimit : othelloChaosOverwriteLimit)}
                            onChange={(event) => {
                              const nextValue = Number(event.target.value);
                              if (othelloChaosUsesBothSideSettings) {
                                setOthelloChaosBothWhiteOverwriteLimit(nextValue);
                                resetOthello({ bothWhiteOverwriteLimit: nextValue }, true);
                                return;
                              }
                              setOthelloChaosOverwriteLimit(nextValue);
                              resetOthello({ overwriteLimit: nextValue }, true);
                            }}
                            className="rounded-md border border-slate-400/40 bg-slate-950/70 px-2 py-1 text-xs"
                          >
                            {OTHELLO_CHAOS_LIMIT_OPTIONS.map((limit) => (
                              <option key={`othello-chaos-overwrite-white-${limit}`} value={String(limit)}>{limit}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <label className="mt-2 grid gap-1">
                        <span>{t("othelloChaosWhiteDestroyLimitLabel")}</span>
                        <select
                          value={String(othelloChaosDestroyLimitWhite)}
                          onChange={(event) => {
                            const nextValue = Number(event.target.value);
                            setOthelloChaosDestroyLimitWhite(nextValue);
                            resetOthello({ destroyLimitWhite: nextValue }, true);
                          }}
                          className="rounded-md border border-slate-400/40 bg-slate-950/70 px-2 py-1 text-xs"
                        >
                          {OTHELLO_CHAOS_LIMIT_OPTIONS.map((limit) => (
                            <option key={`othello-chaos-destroy-white-${limit}`} value={String(limit)}>{limit}</option>
                          ))}
                        </select>
                      </label>
                    </section>
                  ) : null}
                </div>

                {isOthelloGameStarted ? (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <p>{t("othelloChaosOverwriteStock")}: {othelloOverwriteRemaining[othelloPlayerIndex(currentPlayer)]}</p>
                    <p>{t("othelloChaosImmutableStock")}: {othelloImmutableCharges[othelloPlayerIndex(currentPlayer)]}</p>
                    <p>{t("othelloChaosDestroyStock")}: {othelloDestroyRemaining[othelloPlayerIndex(currentPlayer)]}</p>
                    <p>{t("othelloChaosDoubleStock")}: {othelloDoubleActionCharges[othelloPlayerIndex(currentPlayer)]}</p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className={othelloShowChaosSidePanel ? "md:order-1" : ""}>
              {isChaosMode ? (
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={onToggleOthelloImmutableSkill}
                    disabled={!othelloImmutableButtonEnabled}
                    className={`rounded-md border px-3 py-1 text-xs font-semibold ${othelloImmutableButtonArmed ? "border-cyan-300/70 bg-cyan-300/20 text-cyan-100" : "border-slate-400/40 bg-slate-950/60 text-slate-100"} disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {t("othelloChaosImmutableButton")} ({othelloImmutableCharges[othelloCurrentPlayerIndex] ?? 0})
                  </button>
                  <button
                    type="button"
                    onClick={onToggleOthelloDestroySkill}
                    disabled={!othelloDestroyButtonEnabled}
                    className={`rounded-md border px-3 py-1 text-xs font-semibold ${othelloDestroyButtonArmed ? "border-cyan-300/70 bg-cyan-300/20 text-cyan-100" : "border-slate-400/40 bg-slate-950/60 text-slate-100"} disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {t("othelloChaosDestroyButton")} ({othelloDestroyRemaining[othelloCurrentPlayerIndex] ?? 0})
                  </button>
                  <button
                    type="button"
                    onClick={onToggleOthelloDoubleSkill}
                    disabled={!othelloDoubleButtonEnabled}
                    className={`rounded-md border px-3 py-1 text-xs font-semibold ${othelloDoubleButtonArmed ? "border-cyan-300/70 bg-cyan-300/20 text-cyan-100" : "border-slate-400/40 bg-slate-950/60 text-slate-100"} disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {t("othelloChaosDoubleButton")} ({othelloDoubleActionCharges[othelloCurrentPlayerIndex] ?? 0})
                  </button>
                </div>
              ) : null}

              {othelloShowImmutableGuide ? (
                <p className="mb-2 text-xs text-amber-200">{t("othelloChaosImmutableGuide")}</p>
              ) : null}
              {othelloShowDestroyGuide ? (
                <p className="mb-2 text-xs text-rose-200">{othelloDestroyGuideText}</p>
              ) : null}

              <div className={`grid w-full max-w-[min(96vw,680px)] grid-cols-8 gap-[3px] rounded-xl bg-emerald-900/70 p-1.5 sm:gap-1 sm:p-2 ${othelloShowChaosSidePanel ? "mx-auto md:mx-0" : "mx-auto"} ${!gameStarted.othello ? "pointer-events-none opacity-60" : ""}`}>
                {board.map((line, row) =>
                  line.map((cell, col) => {
                    const key = `${row}-${col}`;
                    const isLegal = legalMoveSet.has(key);
                    const isFixed = othelloFixedMask[row][col];
                    const isBroken = othelloBrokenMask[row][col];
                    const isImmutableTargetCandidate =
                      othelloShowImmutableGuide
                      && cell === currentPlayer
                      && !isFixed
                      && !isBroken
                      && row > 0
                      && row < BOARD_SIZE - 1
                      && col > 0
                      && col < BOARD_SIZE - 1;
                    const isDestroySelectedSelf = othelloDestroySelectedKeySet.has(key);
                    const isDestroySelfCandidate =
                      othelloShowDestroyGuide
                      && othelloDestroyMode !== "enemy"
                      && othelloDestroySelfCandidateKeySet.has(key)
                      && (othelloDestroyMode !== "corner" || isOthelloCorner(row, col));
                    const isDestroyEnemyCandidate =
                      othelloShowDestroyGuide
                      && othelloDestroyMode === "enemy"
                      && othelloDestroyEnemyCandidateKeySet.has(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => onBoardClick(row, col)}
                        disabled={!canOperateOthelloNow || isGameOver || !gameStarted.othello}
                        className={`relative aspect-square rounded-sm ${isBroken ? "bg-slate-800/95" : "bg-emerald-700/95 hover:bg-emerald-600/95"} disabled:cursor-not-allowed disabled:opacity-70`}
                        aria-label={`cell-${row + 1}-${col + 1}`}
                      >
                        {cell === 1 ? (
                          <span className="absolute inset-[14%] block rounded-full bg-slate-900 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.08)]" />
                        ) : null}
                        {cell === 2 ? (
                          <span className="absolute inset-[14%] block rounded-full bg-slate-100 shadow-[inset_0_0_0_2px_rgba(0,0,0,0.15)]" />
                        ) : null}
                        {isImmutableTargetCandidate ? (
                          <span className="immutable-target-hint pointer-events-none absolute inset-[8%] block rounded-full border-2 border-amber-200/95 shadow-[0_0_0_1px_rgba(255,190,90,0.45),0_0_10px_rgba(251,191,36,0.45)] animate-pulse" />
                        ) : null}
                        {isDestroySelfCandidate ? (
                          <span className="destroy-self-hint pointer-events-none absolute inset-[12%] block rounded-full border border-rose-200/80 shadow-[0_0_8px_rgba(251,113,133,0.45)]" />
                        ) : null}
                        {isDestroySelectedSelf ? (
                          <span className="destroy-self-selected-hint pointer-events-none absolute inset-[22%] block rounded-full bg-rose-300/80 shadow-[0_0_8px_rgba(251,113,133,0.6)]" />
                        ) : null}
                        {isDestroyEnemyCandidate ? (
                          <span className="destroy-enemy-target-hint pointer-events-none absolute inset-[12%] block rounded-full border-2 border-rose-200/95 shadow-[0_0_10px_rgba(244,63,94,0.5)] animate-pulse" />
                        ) : null}
                        {gameStarted.othello && isLegal && !othelloHideLegalMarker ? (
                          <span className="absolute inset-[40%] block rounded-full bg-cyan-200/90 shadow-[0_0_8px_rgba(103,232,249,0.55)]" />
                        ) : null}
                        {isFixed ? (
                          <>
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-[18%] rounded-full border border-amber-200/80 shadow-[0_0_10px_rgba(251,191,36,0.35)] animate-pulse"
                            />
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute left-[18%] right-[18%] top-1/2 h-[2px] -translate-y-1/2 rounded bg-amber-300/85 shadow-[0_0_6px_rgba(251,191,36,0.55)]"
                            />
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute bottom-[18%] left-[18%] right-[18%] h-[2px] rounded bg-amber-300/75 shadow-[0_0_6px_rgba(251,191,36,0.45)]"
                            />
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute bottom-[18%] top-[18%] left-1/2 w-[2px] -translate-x-1/2 rounded bg-amber-300/85 shadow-[0_0_6px_rgba(251,191,36,0.55)]"
                            />
                            <span
                              aria-label={t("othelloChaosFixed")}
                              className="fixed-lock-icon absolute right-1 top-1 inline-flex h-4 w-4 items-center justify-center rounded border border-amber-200/80 bg-slate-950/90 shadow-[0_0_0_1px_rgba(251,191,36,0.25),0_0_10px_rgba(251,191,36,0.35)] animate-pulse"
                            >
                              <span className="pointer-events-none relative block h-[6px] w-[7px] rounded-[1px] border border-amber-200/90 bg-amber-200/20" aria-hidden="true">
                                <span className="pointer-events-none absolute -top-[4px] left-1/2 block h-[4px] w-[7px] -translate-x-1/2 rounded-t-full border-x border-t border-amber-200/90" />
                              </span>
                            </span>
                          </>
                        ) : null}
                        {isBroken ? (
                          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-lg font-black text-rose-300/90">×</span>
                        ) : null}
                      </button>
                    );
                  }),
                )}
              </div>
            </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-md bg-slate-800 px-3 py-1">{t("blackStone")}: {stoneCount.black}</span>
              <span className="rounded-md bg-slate-800 px-3 py-1">{t("whiteStone")}: {stoneCount.white}</span>
            </div>
            </article>

            
          </section>
        ) : null}

        {activePanel === "gomoku" ? (
          <section className="grid gap-5">
            <article className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("gomokuTitle")}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startPanelGame("gomoku", resetGomoku)}
                    disabled={isPanelStartCounting("gomoku")}
                    className="rounded-md bg-cyan-400 px-3 py-1 text-sm font-semibold text-slate-950"
                  >
                    {startButtonLabel("gomoku")}
                  </button>
                  <button
                    type="button"
                    onClick={() => runWithResetGuard("gomoku", resetGomoku)}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("gomokuReset")}
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToMenuClick}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("backToMenu")}
                  </button>
                </div>
              </div>

              {!gameStarted.gomoku ? <p className="mt-2 text-xs text-amber-200">{t("gameStartPrompt")}</p> : null}

              <p className="text-sm text-slate-300">{gomokuMessage}</p>
              {connectedRoomCode ? <p className="mt-1 text-xs text-cyan-200">{roomTurnText(canOperateGomokuNow)}</p> : null}

              {!connectedRoomCode ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <label className="grid gap-1 text-xs text-slate-300">
                    <span>{t("gomokuModeLabel")}</span>
                    <select
                      value={gomokuMode}
                      onChange={(event) => {
                        const nextMode = (event.target.value === "cpu" ? "cpu" : "local") as GomokuMode;
                        setGomokuMode(nextMode);
                        resetGomokuWith(nextMode, gomokuTurnOrder);
                      }}
                      className="rounded-md border border-slate-400/40 bg-slate-950/70 px-2 py-2 text-sm"
                    >
                      <option value="cpu">{t("gomokuModeCpu")}</option>
                      <option value="local">{t("gomokuModeLocal")}</option>
                    </select>
                  </label>

                  <label className="grid gap-1 text-xs text-slate-300">
                    <span>{t("gomokuCpuLevelLabel")}</span>
                    <select
                      value={gomokuCpuLevel}
                      onChange={(event) => {
                        const nextLevel = event.target.value === "easy"
                          ? "easy"
                          : event.target.value === "hard"
                            ? "hard"
                            : "normal";
                        setGomokuCpuLevel(nextLevel as GomokuCpuLevel);
                      }}
                      disabled={gomokuMode !== "cpu"}
                      className="rounded-md border border-slate-400/40 bg-slate-950/70 px-2 py-2 text-sm disabled:opacity-50"
                    >
                      <option value="easy">{t("gomokuCpuLevelEasy")}</option>
                      <option value="normal">{t("gomokuCpuLevelNormal")}</option>
                      <option value="hard">{t("gomokuCpuLevelHard")}</option>
                    </select>
                  </label>

                  <label className="grid gap-1 text-xs text-slate-300">
                    <span>{t("gomokuTurnOrderLabel")}</span>
                    <select
                      value={gomokuTurnOrder}
                      onChange={(event) => {
                        const nextOrder = event.target.value === "white"
                          ? "white"
                          : event.target.value === "random"
                            ? "random"
                            : "black";
                        setGomokuTurnOrder(nextOrder as GomokuTurnOrder);
                        resetGomokuWith(gomokuMode, nextOrder as GomokuTurnOrder);
                      }}
                      className="rounded-md border border-slate-400/40 bg-slate-950/70 px-2 py-2 text-sm"
                    >
                      <option value="black">{t("gomokuTurnOrderBlack")}</option>
                      <option value="white">{t("gomokuTurnOrderWhite")}</option>
                      <option value="random">{t("gomokuTurnOrderRandom")}</option>
                    </select>
                  </label>
                </div>
              ) : null}

              <div className={`mt-4 mx-auto grid w-full max-w-[min(98vw,820px)] grid-cols-15 gap-[2px] rounded-xl bg-amber-900/70 p-1 sm:gap-[3px] sm:p-1.5 md:gap-1 md:p-2 ${!gameStarted.gomoku ? "pointer-events-none opacity-60" : ""}`} style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}>
                {gomokuBoard.map((line, row) =>
                  line.map((cell, col) => {
                    const key = `g-${row}-${col}`;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => onGomokuClick(row, col)}
                        disabled={!canOperateGomokuNow || isGomokuOver || !gameStarted.gomoku}
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
              </div>
            </article>

            
          </section>
        ) : null}

        {activePanel === "chess" ? (
          <section className="grid gap-5">
            <article className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("chessTitle")}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startPanelGame("chess", resetChess)}
                    disabled={isPanelStartCounting("chess")}
                    className="rounded-md bg-cyan-400 px-3 py-1 text-sm font-semibold text-slate-950"
                  >
                    {startButtonLabel("chess")}
                  </button>
                  <button
                    type="button"
                    onClick={() => runWithResetGuard("chess", () => resetChess())}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("chessReset")}
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToMenuClick}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("backToMenu")}
                  </button>
                </div>
              </div>

              {!gameStarted.chess ? <p className="mt-2 text-xs text-amber-200">{t("gameStartPrompt")}</p> : null}

              <p className="text-sm text-slate-300">{chessMessage}</p>
              {connectedRoomCode ? <p className="mt-1 text-xs text-cyan-200">{roomTurnText(canOperateChessNow)}</p> : null}
              {!connectedRoomCode && chessMode === "cpu" ? (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-md border border-cyan-300/60 bg-cyan-400/15 px-2 py-1 text-cyan-100">1P: {chessPlayerColorLabel}</span>
                  <span className="rounded-md border border-rose-300/60 bg-rose-400/15 px-2 py-1 text-rose-100">CPU: {chessEnemyColorLabel}</span>
                </div>
              ) : null}

              {!connectedRoomCode ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <label className="grid gap-1 text-xs text-slate-300">
                    <span>{t("chessModeLabel")}</span>
                    <select
                      value={chessMode}
                      onChange={(event) => {
                        const nextMode = (event.target.value === "cpu" ? "cpu" : "local") as ChessMode;
                        setChessMode(nextMode);
                        resetChess();
                      }}
                      className="rounded-md border border-slate-400/40 bg-slate-950/70 px-2 py-2 text-sm"
                    >
                      <option value="cpu">{t("chessModeCpu")}</option>
                      <option value="local">{t("chessModeLocal")}</option>
                    </select>
                  </label>

                  <label className="grid gap-1 text-xs text-slate-300">
                    <span>{t("chessCpuLevelLabel")}</span>
                    <select
                      value={chessCpuLevel}
                      onChange={(event) => {
                        const nextLevel = (event.target.value === "easy" || event.target.value === "hard")
                          ? event.target.value
                          : "normal";
                        setChessCpuLevel(nextLevel as ChessCpuLevel);
                      }}
                      disabled={chessMode !== "cpu"}
                      className="rounded-md border border-slate-400/40 bg-slate-950/70 px-2 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="easy">{t("chessCpuLevelEasy")}</option>
                      <option value="normal">{t("chessCpuLevelNormal")}</option>
                      <option value="hard">{t("chessCpuLevelHard")}</option>
                    </select>
                  </label>

                  <label className="grid gap-1 text-xs text-slate-300">
                    <span>{t("chessTurnOrderLabel")}</span>
                    <select
                      value={chessTurnOrder}
                      onChange={(event) => {
                        const nextOrder = event.target.value === "black"
                          ? "black"
                          : event.target.value === "random"
                            ? "random"
                            : "white";
                        setChessTurnOrder(nextOrder as ChessTurnOrder);
                        resetChess(nextOrder as ChessTurnOrder);
                      }}
                      className="rounded-md border border-slate-400/40 bg-slate-950/70 px-2 py-2 text-sm"
                    >
                      <option value="white">{t("chessTurnOrderWhite")}</option>
                      <option value="black">{t("chessTurnOrderBlack")}</option>
                      <option value="random">{t("chessTurnOrderRandom")}</option>
                    </select>
                  </label>
                </div>
              ) : null}

              <div className={`mt-4 mx-auto grid w-full max-w-[min(96vw,680px)] grid-cols-8 gap-[3px] rounded-xl bg-emerald-900/70 p-1.5 sm:gap-1 sm:p-2 ${!gameStarted.chess ? "pointer-events-none opacity-60" : ""}`}>
                {chessDisplayRows.map((row) =>
                  chessDisplayCols.map((col) => {
                    const piece = chessBoard[row]?.[col] ?? null;
                    const isSelected = selectedChess?.row === row && selectedChess?.col === col;
                    const moveTarget = chessMoveTargets.get(`${row}-${col}`);
                    const isMoveTarget = Boolean(moveTarget);
                    const isCaptureTarget = Boolean(moveTarget?.capture);
                    const shouldEmphasizeTurnPiece = chessMode === "local" && !connectedRoomCode && gameStarted.chess && !isChessOver;
                    const isTurnPiece = piece?.color === chessTurn;
                    const key = `c-${row}-${col}`;
                    const dark = (row + col) % 2 === 1;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => onChessClick(row, col)}
                        disabled={!canOperateChessNow || isChessOver || !gameStarted.chess}
                        className={`relative aspect-square rounded-sm px-1 text-2xl font-semibold leading-none sm:text-4xl ${dark ? "bg-emerald-700/95 hover:bg-emerald-600/95" : "bg-emerald-600/95 hover:bg-emerald-500/95"} ${isSelected ? "ring-2 ring-cyan-300" : ""} ${isMoveTarget ? (isCaptureTarget ? "ring-2 ring-rose-300" : "ring-2 ring-amber-200") : ""} disabled:cursor-not-allowed disabled:opacity-70`}
                        aria-label={`chess-${row + 1}-${col + 1}`}
                      >
                        {isMoveTarget && !piece ? (
                          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <span className="h-3 w-3 rounded-full bg-amber-200/90 shadow-[0_0_0_2px_rgba(8,12,22,0.35)] sm:h-3.5 sm:w-3.5" />
                          </span>
                        ) : null}
                        {piece ? (
                          <span
                            className={`inline-block ${piece.color === "w" ? "text-slate-100 [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]" : "text-slate-950 [text-shadow:0_0_2px_rgba(241,245,249,0.9)]"} ${shouldEmphasizeTurnPiece && !isTurnPiece ? "opacity-45" : "opacity-100"} ${shouldEmphasizeTurnPiece && isTurnPiece ? "drop-shadow-[0_0_6px_rgba(125,211,252,0.75)]" : ""}`}
                            aria-label={`${piece.color === "w" ? t("whiteStone") : t("blackStone")}${chessPieceLabel(piece)}`}
                          >
                            {chessPieceLabel(piece)}
                          </span>
                        ) : ""}
                      </button>
                    );
                  }),
                )}
              </div>

            </article>

            
          </section>
        ) : null}

        {activePanel === "shogi" ? (
          <section className="grid gap-5">
            <article className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("shogiTitle")}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startPanelGame("shogi", resetShogi)}
                    disabled={isPanelStartCounting("shogi")}
                    className="rounded-md bg-cyan-400 px-3 py-1 text-sm font-semibold text-slate-950"
                  >
                    {startButtonLabel("shogi")}
                  </button>
                  <button
                    type="button"
                    onClick={() => runWithResetGuard("shogi", resetShogi)}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("shogiReset")}
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToMenuClick}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("backToMenu")}
                  </button>
                </div>
              </div>

              {!gameStarted.shogi ? <p className="mt-2 text-xs text-amber-200">{t("gameStartPrompt")}</p> : null}

              <p className="text-sm text-slate-300">{shogiMessage}</p>
              {connectedRoomCode ? <p className="mt-1 text-xs text-cyan-200">{roomTurnText(canOperateShogiNow)}</p> : null}

              {!connectedRoomCode ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
                  <label className="grid gap-1 text-xs text-slate-300">
                    <span>{t("shogiModeLabel")}</span>
                    <select
                      value={shogiMode}
                      onChange={(event) => {
                        const nextMode = event.target.value === "cpu"
                          ? "cpu"
                          : event.target.value === "chaos"
                            ? "chaos"
                            : "local";
                        setShogiMode(nextMode as ShogiMode);
                        resetShogiWith(nextMode as ShogiMode, shogiTurnOrder);
                      }}
                      className="rounded-md border border-slate-400/40 bg-slate-950/70 px-2 py-2 text-sm min-[360px]:text-[13px]"
                    >
                      <option value="cpu">{t("shogiModeCpu")}</option>
                      <option value="local">{t("shogiModeLocal")}</option>
                      <option value="chaos">{t("shogiModeChaos")}</option>
                    </select>
                  </label>

                  <label className="grid gap-1 text-xs text-slate-300">
                    <span>{t("shogiCpuLevelLabel")}</span>
                    <select
                      value={shogiCpuLevel}
                      onChange={(event) => {
                        const nextLevel = event.target.value === "easy"
                          ? "easy"
                          : event.target.value === "hard"
                            ? "hard"
                            : "normal";
                        setShogiCpuLevel(nextLevel as ShogiCpuLevel);
                      }}
                      disabled={shogiMode !== "cpu"}
                      className="rounded-md border border-slate-400/40 bg-slate-950/70 px-2 py-2 text-sm min-[360px]:text-[13px] disabled:opacity-50"
                    >
                      <option value="easy">{t("shogiCpuLevelEasy")}</option>
                      <option value="normal">{t("shogiCpuLevelNormal")}</option>
                      <option value="hard">{t("shogiCpuLevelHard")}</option>
                    </select>
                  </label>

                  <label className="grid gap-1 text-xs text-slate-300">
                    <span>{t("shogiTurnOrderLabel")}</span>
                    <select
                      value={shogiTurnOrder}
                      onChange={(event) => {
                        const nextOrder = event.target.value === "white"
                          ? "white"
                          : event.target.value === "random"
                            ? "random"
                            : "black";
                        setShogiTurnOrder(nextOrder as ShogiTurnOrder);
                        resetShogiWith(shogiMode, nextOrder as ShogiTurnOrder);
                      }}
                      className="rounded-md border border-slate-400/40 bg-slate-950/70 px-2 py-2 text-sm min-[360px]:text-[13px]"
                    >
                      <option value="black">{t("shogiTurnOrderBlack")}</option>
                      <option value="white">{t("shogiTurnOrderWhite")}</option>
                      <option value="random">{t("shogiTurnOrderRandom")}</option>
                    </select>
                  </label>
                </div>
              ) : null}

              <div className={`mt-4 mx-auto grid w-full max-w-[min(96vw,680px)] grid-cols-9 gap-[3px] rounded-xl bg-amber-900/60 p-1.5 sm:gap-1 sm:p-2 ${!gameStarted.shogi ? "pointer-events-none opacity-60" : ""}`} style={{ gridTemplateColumns: "repeat(9, minmax(0, 1fr))" }}>
                {shogiBoard.map((line, row) =>
                  line.map((piece, col) => {
                    const isSelected = selectedShogi?.row === row && selectedShogi?.col === col;
                    const moveTarget = shogiMoveTargets.get(`${row}-${col}`);
                    const isMoveTarget = Boolean(moveTarget);
                    const isCaptureTarget = Boolean(moveTarget?.capture);
                    const dark = (row + col) % 2 === 1;
                    return (
                      <button
                        key={`s-${row}-${col}`}
                        type="button"
                        onClick={() => onShogiClick(row, col)}
                        disabled={!canOperateShogiNow || isShogiOver || !gameStarted.shogi}
                        className={`relative aspect-square rounded-sm px-0.5 sm:px-1 ${dark ? "bg-amber-700/95" : "bg-amber-500/95"} ${isSelected ? "ring-2 ring-cyan-300" : ""} ${isMoveTarget ? (isCaptureTarget ? "ring-2 ring-rose-300" : "ring-2 ring-amber-200") : ""} disabled:cursor-not-allowed disabled:opacity-70`}
                        aria-label={`shogi-${row + 1}-${col + 1}`}
                      >
                        {isMoveTarget && !piece ? (
                          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <span className="h-2.5 w-2.5 rounded-full bg-amber-100/95 shadow-[0_0_0_2px_rgba(8,12,22,0.25)] sm:h-3 sm:w-3" />
                          </span>
                        ) : null}
                        {piece ? (
                          <span
                            className={`mx-auto grid h-[82%] w-[76%] place-items-center border border-amber-900/80 bg-gradient-to-b from-amber-100 via-amber-200 to-amber-300 text-[clamp(10px,2.45vw,20px)] font-black leading-none text-amber-950 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_2px_4px_rgba(0,0,0,0.25)] [clip-path:polygon(18%_0%,82%_0%,100%_100%,0%_100%)] ${piece.color === "w" ? "rotate-180" : ""}`}
                            aria-label={`${piece.color === "b" ? t("blackStone") : t("whiteStone")}${shogiPieceLabel(piece)}`}
                          >
                            <span className="translate-y-[1px]">{shogiPieceLabel(piece)}</span>
                          </span>
                        ) : (
                          ""
                        )}
                      </button>
                    );
                  }),
                )}
              </div>

            </article>

            
          </section>
        ) : null}

        {activePanel === "minesweeper" ? (
          <section className="grid gap-5">
            <article className="mx-auto w-full max-w-[88rem] rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("minesTitle")}</h2>
              </div>

              <select id="langSelect" key={`ms-lang-${language}`} defaultValue={language === "ko" ? "ko" : "ja"} className="hidden" aria-hidden="true" tabIndex={-1}>
                <option value="ja">ja</option>
                <option value="ko">ko</option>
              </select>

              <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <label className="grid gap-1 text-xs text-slate-200">
                  <span id="minesweeperModeLabel">MODE</span>
                  <select id="minesweeperModeSelect" className="rounded-md border border-slate-400/40 bg-slate-950/70 px-2 py-2 text-sm">
                    <option value="solo">SINGLE</option>
                    <option value="duel">DUEL</option>
                    <option value="battle">BATTLE</option>
                    <option value="coop">COOP</option>
                  </select>
                </label>

                <label className="grid gap-1 text-xs text-slate-200">
                  <span id="minesweeperPlayerCountLabel">PLAYERS</span>
                  <select id="minesweeperPlayerCountSelect" className="rounded-md border border-slate-400/40 bg-slate-950/70 px-2 py-2 text-sm">
                    <option value="2">2P</option>
                    <option value="3">3P</option>
                    <option value="4">4P</option>
                  </select>
                </label>

                <label className="grid gap-1 text-xs text-slate-200">
                  <span id="minesweeperCoopLivesLabel">LIVES</span>
                  <input
                    id="minesweeperCoopLivesSelect"
                    type="number"
                    min={1}
                    placeholder="∞"
                    className="rounded-md border border-slate-400/40 bg-slate-950/70 px-2 py-2 text-sm"
                  />
                </label>

                <label className="grid gap-1 text-xs text-slate-200">
                  <span id="minesweeperDifficultyLabel">DIFFICULTY</span>
                  <select id="minesweeperDifficultySelect" className="rounded-md border border-slate-400/40 bg-slate-950/70 px-2 py-2 text-sm">
                    <option value="easy">Easy</option>
                    <option value="normal">Normal</option>
                    <option value="hard">Hard</option>
                    <option value="expert">Expert</option>
                  </select>
                </label>

                <label className="grid gap-1 text-xs text-slate-200">
                  <span id="minesweeperBoardSizeLabel">BOARD SIZE</span>
                  <select id="minesweeperBoardSizeSelect" className="rounded-md border border-slate-400/40 bg-slate-950/70 px-2 py-2 text-sm">
                    <option value="9">9x9</option>
                    <option value="12">12x12</option>
                    <option value="16">16x16</option>
                    <option value="20">20x20</option>
                  </select>
                </label>
              </section>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button id="minesweeperStartBtn" type="button" className="rounded-md bg-cyan-400 px-3 py-1 text-sm font-semibold text-slate-950">
                  {t("gameStart")}
                </button>
                <button id="minesweeperRemakeBtn" type="button" className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm">
                  {t("minesReset")}
                </button>
                <button id="minesweeperMenuBtn" type="button" className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm">
                  {t("backToMenu")}
                </button>
              </div>

              <p id="minesweeperMessage" className="mt-3 text-sm text-slate-300">{t("minesHint")}</p>

              <section id="minesweeperPlayLayout" className="minesweeper-play-layout" aria-label="Minesweeper board and status">
                <div className="minesweeper-main-area">
                  <div className="minesweeper-row-metrics" aria-label="Minesweeper quick status">
                    <span><strong>MINE:</strong> <span id="minesweeperMineCount">0</span></span>
                    <span><strong>FLAG:</strong> <span id="minesweeperFlagCount">0</span></span>
                    <span><strong>TIME:</strong> <span id="minesweeperTimer">00:00</span></span>
                    <span><strong id="minesweeperTurnLabel">TURN</strong>: <span id="minesweeperTurnText">-</span></span>
                    <span><strong id="minesweeperScoreLabel">SCORE</strong>: <span id="minesweeperScoreText">0</span></span>
                  </div>

                  <div id="minesweeperBoardViewport" className="minesweeper-board-viewport">
                    <div id="minesweeperStartOverlay" className="minesweeper-start-overlay">READY</div>
                    <div id="minesweeperBoard" className="minesweeper-board" role="grid" />
                  </div>
                </div>

                <aside id="minesweeperEnemyPanel" className="minesweeper-side-panel hidden" aria-live="polite">
                  <h3 id="minesweeperEnemyLabel">ENEMY BOARD</h3>
                  <p id="minesweeperEnemyCountdown" className="text-xs text-slate-300">-</p>
                  <div id="minesweeperEnemyBoard" className="minesweeper-enemy-board" />
                </aside>

                <aside id="minesweeperOverviewPanel" className="minesweeper-side-panel hidden" aria-live="polite">
                  <h3 id="minesweeperOverviewLabel">BOARD OVERVIEW</h3>
                  <canvas id="minesweeperOverviewCanvas" width={180} height={180} />
                  <p className="text-xs text-slate-300"><span id="minesweeperCoopLifeLeftLabel">LIFE LEFT</span>: <span id="minesweeperCoopLifeLeftText">-</span></p>
                  <p className="text-xs text-slate-300"><span>TIME</span>: <span id="minesweeperSideTime">00:00</span></p>
                  <p className="text-xs text-slate-300"><span>LIFE</span>: <span id="minesweeperSideLife">-</span></p>
                </aside>
              </section>

            </article>

            
          </section>
        ) : null}

        {activePanel === "numeron" ? (
          <section className="grid gap-5 md:grid-cols-[1.62fr_0.82fr]">
            <article className="min-h-[700px] rounded-2xl border border-cyan-300/25 bg-[linear-gradient(160deg,rgba(12,24,39,0.88),rgba(8,19,28,0.92))] p-6 shadow-[0_0_0_1px_rgba(24,219,255,0.12),0_14px_30px_rgba(3,8,13,0.45)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("numeronTitle")}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startPanelGame("numeron", resetNumeron)}
                    disabled={isPanelStartCounting("numeron")}
                    className="rounded-md bg-cyan-400 px-3 py-1 text-sm font-semibold text-slate-950"
                  >
                    {startButtonLabel("numeron")}
                  </button>
                  <button
                    type="button"
                    onClick={() => runWithResetGuard("numeron", resetNumeron)}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("numeronReset")}
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToMenuClick}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("backToMenu")}
                  </button>
                </div>
              </div>

              {connectedRoomCode && gameStarted.numeron ? (
                <p className="mt-2 inline-flex items-center gap-2 rounded-md border border-cyan-200/35 bg-cyan-300/10 px-2 py-1 text-xs text-cyan-100">
                  <span>{t("roomMatchedPlayers")}:</span>
                  <span className="font-mono font-semibold [font-variant-numeric:tabular-nums]">{numeronMatchedPlayersCount}</span>
                </p>
              ) : null}

              {!gameStarted.numeron ? <p className="mt-2 text-xs text-amber-200">{t("gameStartPrompt")}</p> : null}
              <fieldset disabled={!gameStarted.numeron} className={!gameStarted.numeron ? "mt-2 pointer-events-none opacity-60" : "mt-2"}>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="rounded-lg border border-cyan-200/25 bg-slate-950/55 px-3 py-2 text-xs text-slate-300">
                    <span className="mb-1 block tracking-wide text-slate-400">{t("numeronDigitsLabel")}</span>
                    <select
                      value={numeronDigitCount}
                      onChange={(event) => resetNumeron(normalizeNumeronDigitCount(event.target.value))}
                      disabled={isPanelStartCounting("numeron")}
                      className="w-full rounded-md border border-cyan-200/30 bg-slate-900/80 px-2 py-1 text-sm"
                    >
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                    </select>
                  </label>
                  <div className="rounded-lg border border-cyan-200/20 bg-slate-950/50 px-3 py-2 text-xs">
                    <p className="tracking-wide text-slate-400">{t("numeronTryLabel")}</p>
                    <p className="mt-1 text-base font-semibold text-slate-100">{numeronHistory.length}</p>
                  </div>
                  <div className="rounded-lg border border-cyan-200/20 bg-slate-950/50 px-3 py-2 text-xs">
                    <p className="tracking-wide text-slate-400">{t("numeronLimitLabel")}</p>
                    <p className="mt-1 text-base font-semibold text-slate-100">{numeronTryLimit}</p>
                  </div>
                  <div className="rounded-lg border border-cyan-200/20 bg-slate-950/50 px-3 py-2 text-xs">
                    <p className="tracking-wide text-slate-400">{t("numeronCandidatesLabel")}</p>
                    <p className="mt-1 text-base font-semibold text-slate-100">{numeronCandidateCount}</p>
                  </div>
                </div>

                {isNumeronSecretPanelOpen || !isNumeronSecretConfirmed ? (
                  <div className="mt-4 rounded-xl border border-cyan-300/20 bg-slate-950/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs tracking-wide text-slate-400">{t("numeronSecretSetupTitle")}</p>
                      {isNumeronSecretConfirmed ? (
                        <button
                          type="button"
                          onClick={() => setIsNumeronSecretPanelOpen(false)}
                          className="rounded-md border border-cyan-200/35 px-2 py-1 text-xs"
                        >
                          {t("numeronCloseSecretEditor")}
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Array.from({ length: numeronDigitCount }, (_, index) => {
                        const value = numeronSecretDraft[index] ?? "-";
                        const canBackTo = Boolean(numeronSecretDraft[index]);
                        return (
                          <button
                            key={`numeron-secret-slot-${index}`}
                            type="button"
                            onClick={() => setNumeronSecretDraft((prev) => prev.slice(0, index))}
                            disabled={!canBackTo || isNumeronOver || numeronHistory.length > 0 || isNumeronSecretConfirmed}
                            className="h-11 min-w-11 rounded-md border border-cyan-200/35 bg-slate-900/80 px-3 text-lg font-bold tracking-[0.22em] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {Array.from({ length: 10 }, (_, i) => String(i)).map((digit) => {
                        const selected = numeronSecretDraft.includes(digit);
                        return (
                          <button
                            key={`numeron-secret-digit-${digit}`}
                            type="button"
                            onClick={() => onNumeronPickSecretDigit(digit)}
                            disabled={isNumeronOver || numeronHistory.length > 0 || isNumeronSecretConfirmed || selected || numeronSecretDraft.length >= numeronDigitCount}
                            className={`h-11 w-11 rounded-md border text-base font-semibold ${selected ? "border-amber-300/60 bg-amber-300/20" : "border-cyan-200/30 bg-cyan-400/10"}`}
                          >
                            {digit}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={onNumeronBackSecretDigit}
                        disabled={isNumeronOver || numeronHistory.length > 0 || isNumeronSecretConfirmed || numeronSecretDraft.length === 0}
                        className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                      >
                        {t("numeronBack")}
                      </button>
                      <button
                        type="button"
                        onClick={onNumeronClearSecretDraft}
                        disabled={isNumeronOver || numeronHistory.length > 0 || isNumeronSecretConfirmed || numeronSecretDraft.length === 0}
                        className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                      >
                        {t("numeronClearDraft")}
                      </button>
                      <button
                        type="button"
                        onClick={onNumeronSetSecret}
                        disabled={isNumeronOver || numeronHistory.length > 0 || isNumeronSecretConfirmed}
                        className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                      >
                        {t("numeronSecretSet")}
                      </button>
                      <button
                        type="button"
                        onClick={onNumeronSetRandomSecret}
                        disabled={isNumeronOver || numeronHistory.length > 0 || isNumeronSecretConfirmed}
                        className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                      >
                        {t("numeronSecretRandom")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-cyan-300/20 bg-slate-950/35 px-3 py-2 text-xs text-cyan-100">
                    <span>{t("numeronSecretReady")}</span>
                  </div>
                )}

                <p className="mt-4 text-sm text-slate-200">{numeronMessage}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {t("numeronSecretLabel")}: {isNumeronOver ? numeronSecret : "*".repeat(numeronDigitCount)}
                </p>

                <div ref={numeronGuessPanelRef} className="mt-4 rounded-xl border border-cyan-300/20 bg-slate-950/40 p-3">
                  <p className="text-xs tracking-wide text-slate-400">{t("numeronGuess")}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Array.from({ length: numeronDigitCount }, (_, index) => {
                      const value = numeronDraft[index] ?? "-";
                      const canBackTo = Boolean(numeronDraft[index]);
                      return (
                        <button
                          key={`numeron-slot-${index}`}
                          type="button"
                          onClick={() => setNumeronDraft((prev) => prev.slice(0, index))}
                          disabled={!canBackTo || isNumeronOver || !isNumeronSecretConfirmed || Boolean(numeronPendingItem)}
                          className="h-11 min-w-11 rounded-md border border-cyan-200/35 bg-slate-900/80 px-3 text-lg font-bold tracking-[0.22em] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {Array.from({ length: 10 }, (_, i) => String(i)).map((digit) => {
                      const selected = numeronDraft.includes(digit);
                      return (
                        <button
                          key={digit}
                          type="button"
                          onClick={() => onNumeronPickDigit(digit)}
                          disabled={isNumeronOver || !isNumeronSecretConfirmed || Boolean(numeronPendingItem) || selected || numeronDraft.length >= numeronDigitCount}
                          className={`h-11 w-11 rounded-md border text-base font-semibold ${selected ? "border-amber-300/60 bg-amber-300/20" : "border-cyan-200/30 bg-cyan-400/10"}`}
                        >
                          {digit}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={onNumeronBackDigit}
                    disabled={isNumeronOver || !isNumeronSecretConfirmed || Boolean(numeronPendingItem) || numeronDraft.length === 0}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("numeronBack")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNumeronDraft([])}
                    disabled={isNumeronOver || !isNumeronSecretConfirmed || Boolean(numeronPendingItem) || numeronDraft.length === 0}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("numeronClearDraft")}
                  </button>
                  <button
                    type="button"
                    onClick={onNumeronSubmit}
                    disabled={isNumeronOver || !isNumeronSecretConfirmed || Boolean(numeronPendingItem)}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("numeronSubmitGuess")}
                  </button>
                </div>

                <p className="mt-2 text-xs text-slate-500">0-9 / Backspace / Delete / Enter キー対応</p>

                <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/5 p-3">
                  <p className="text-sm font-semibold text-amber-100">{t("numeronAssistTitle")}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    <label className="flex items-center gap-2">
                      <span className="text-xs text-amber-50/85">{t("numeronHighLowDigit")}</span>
                      <select
                        value={numeronHintDigit}
                        onChange={(event) => setNumeronHintDigit(event.target.value)}
                        disabled={isNumeronOver}
                        className="rounded-md border border-amber-200/40 bg-slate-900/85 px-2 py-1"
                      >
                        {Array.from({ length: 10 }, (_, i) => String(i)).map((digit) => (
                          <option key={`numeron-hl-${digit}`} value={digit}>{digit}</option>
                        ))}
                      </select>
                    </label>

                    <button
                      type="button"
                      onClick={onNumeronUseHighLow}
                      disabled={isNumeronOver || numeronAssistCharges.highlow <= 0 || Boolean(numeronPendingItem)}
                      className="rounded-md border border-amber-200/45 px-3 py-1"
                    >
                      {t("numeronUseHighLow")} ({numeronAssistCharges.highlow})
                    </button>
                    <button
                      type="button"
                      onClick={onNumeronUseReveal}
                      disabled={isNumeronOver || numeronAssistCharges.reveal <= 0 || Boolean(numeronPendingItem)}
                      className="rounded-md border border-amber-200/45 px-3 py-1"
                    >
                      {t("numeronUseReveal")} ({numeronAssistCharges.reveal})
                    </button>
                  </div>
                  {numeronPendingItem ? (
                    <div className="mt-3 rounded-md border border-amber-200/25 bg-amber-100/5 p-2">
                      <p className="text-xs text-amber-50/90">
                        {numeronPendingItem === "highlow" ? t("numeronItemConfirmHighLow") : t("numeronItemConfirmReveal")}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={onNumeronConfirmItemUse}
                          className="rounded-md border border-amber-200/50 px-2.5 py-1 text-xs"
                        >
                          {t("numeronItemUseYes")}
                        </button>
                        <button
                          type="button"
                          onClick={onNumeronCancelItemUse}
                          className="rounded-md border border-slate-400/40 px-2.5 py-1 text-xs"
                        >
                          {t("numeronItemUseNo")}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </fieldset>
            </article>

            <article className="w-full max-w-[360px] justify-self-end rounded-2xl border border-slate-300/20 bg-slate-900/40 p-4">
              <div className="grid gap-4">
                <div>
                  <p className="text-sm font-semibold text-cyan-100">{t("numeronOpponentField")}</p>
                  <div className="mt-2 rounded-lg border border-cyan-200/20 bg-slate-950/45 p-3">
                    <p className="text-[11px] tracking-wide text-slate-400">{t("numeronSecretLabel")}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Array.from({ length: numeronDigitCount }, (_, index) => (
                        <span
                          key={`numeron-op-secret-${index}`}
                          className="inline-grid h-9 min-w-9 place-items-center rounded-md border border-cyan-200/25 bg-slate-900/80 px-2 text-base font-bold"
                        >
                          {isNumeronOver ? (numeronSecret[index] ?? "-") : "?"}
                        </span>
                      ))}
                    </div>

                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-emerald-100">{t("numeronYourField")}</p>
                  <div className="mt-2 rounded-lg border border-emerald-200/20 bg-slate-950/45 p-3">
                    <p className="text-[11px] tracking-wide text-slate-400">{t("numeronYourSecret")}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Array.from({ length: numeronDigitCount }, (_, index) => {
                        const value = isNumeronSecretConfirmed
                          ? (numeronSecret[index] ?? "-")
                          : (numeronSecretDraft[index] ?? "-");
                        return (
                          <span
                            key={`numeron-my-secret-${index}`}
                            className="inline-grid h-9 min-w-9 place-items-center rounded-md border border-emerald-200/25 bg-slate-900/80 px-2 text-base font-bold"
                          >
                            {value}
                          </span>
                        );
                      })}
                    </div>

                    <p className="mt-3 text-[11px] tracking-wide text-slate-300">{t("numeronOpponentHistory")}</p>
                    <ul className="mt-2 max-h-[210px] space-y-1 overflow-auto rounded-md border border-slate-500/25 bg-slate-950/35 p-2 text-sm text-slate-200">
                      {numeronHistory.length === 0 ? (
                        <li className="text-slate-400">-</li>
                      ) : (
                        numeronHistory.map((entry, index) => (
                          <li key={`op-${entry.guess}-${entry.hits}-${entry.blows}-${index}`} className="grid grid-cols-[2rem_1fr] gap-2">
                            <span className="text-slate-500">{index + 1}.</span>
                            <span>{tf("numeronResult", { guess: entry.guess, hits: entry.hits, blows: entry.blows })}</span>
                          </li>
                        ))
                      )}
                    </ul>

                    <p className="mt-3 text-sm font-semibold">MEMO</p>
                    <textarea
                      rows={7}
                      placeholder="候補メモ"
                      className="mt-2 w-full max-w-[320px] rounded-lg border border-slate-500/30 bg-slate-950/55 p-3 text-sm outline-none focus:border-cyan-300/45"
                    />

                    <div className="mt-3 rounded-md border border-emerald-200/20 bg-slate-950/35 p-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] tracking-wide text-slate-300">{t("numeronEnemyIncomingHistory")}</p>
                        <button
                          type="button"
                          onClick={() => setIsNumeronEnemyHistoryOpen((prev) => !prev)}
                          className="rounded-md border border-emerald-200/35 px-2 py-1 text-[11px]"
                        >
                          {isNumeronEnemyHistoryOpen ? t("numeronEnemyHistoryClose") : t("numeronEnemyHistoryOpen")}
                        </button>
                      </div>
                      {isNumeronEnemyHistoryOpen ? (
                        <ul className="mt-2 max-h-[160px] space-y-1 overflow-auto rounded-md border border-slate-500/25 bg-slate-950/40 p-2 text-xs text-slate-200">
                          {numeronEnemyHistory.length === 0 ? (
                            <li className="text-slate-400">-</li>
                          ) : (
                            numeronEnemyHistory.map((entry, index) => (
                              <li key={`enemy-${entry.guess}-${entry.hits}-${entry.blows}-${index}`} className="grid grid-cols-[1.6rem_1fr] gap-2">
                                <span className="text-slate-500">{index + 1}.</span>
                                <span>{tf("numeronEnemyResult", { guess: entry.guess, hits: entry.hits, blows: entry.blows })}</span>
                              </li>
                            ))
                          )}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </section>
        ) : null}

        {activePanel === "blackjack" ? (
          <section className="grid gap-5">
            <article className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("blackjackTitle")}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startPanelGame("blackjack", resetBlackjack)}
                    disabled={isPanelStartCounting("blackjack")}
                    className="rounded-md bg-cyan-400 px-3 py-1 text-sm font-semibold text-slate-950"
                  >
                    {startButtonLabel("blackjack")}
                  </button>
                  <button
                    type="button"
                    onClick={() => runWithResetGuard("blackjack", resetBlackjack)}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("blackjackReset")}
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToMenuClick}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("backToMenu")}
                  </button>
                </div>
              </div>

              {!gameStarted.blackjack ? <p className="mt-2 text-xs text-amber-200">{t("gameStartPrompt")}</p> : (
              <fieldset className="mt-2">

              <div className="mb-3 grid gap-2 rounded-xl border border-cyan-200/20 bg-slate-950/35 p-3">
                <div className="grid gap-2 text-xs text-slate-200 sm:grid-cols-3">
                  <div className="rounded-md border border-cyan-200/25 bg-slate-900/65 px-3 py-2">
                    <p className="text-[10px] tracking-wide text-cyan-100/70">BANK</p>
                    <p className="mt-1 text-base font-bold text-cyan-100">{formatChip(casinoBankroll)}</p>
                  </div>
                  <div className="rounded-md border border-cyan-200/25 bg-slate-900/65 px-3 py-2">
                    <p className="text-[10px] tracking-wide text-cyan-100/70">BET</p>
                    <p className="mt-1 text-base font-bold text-cyan-100">{formatChip(blackjackBet)}</p>
                  </div>
                  <div className="rounded-md border border-cyan-200/25 bg-slate-900/65 px-3 py-2">
                    <p className="text-[10px] tracking-wide text-cyan-100/70">WAGER</p>
                    <p className="mt-1 text-base font-bold text-cyan-100">{formatChip(blackjackWager)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setBlackjackBetByRatio(0.25)}
                    disabled={isBlackjackRoundActive}
                    className="rounded-md border border-slate-400/40 px-2 py-1 disabled:opacity-45"
                  >
                    25%
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlackjackBetByRatio(0.5)}
                    disabled={isBlackjackRoundActive}
                    className="rounded-md border border-slate-400/40 px-2 py-1 disabled:opacity-45"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlackjackBetByRatio(0.75)}
                    disabled={isBlackjackRoundActive}
                    className="rounded-md border border-slate-400/40 px-2 py-1 disabled:opacity-45"
                  >
                    75%
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200">
                <button
                  type="button"
                  onClick={() => stepBlackjackBet(-CASINO_BET_STEP)}
                  disabled={isBlackjackRoundActive}
                  className="rounded-md border border-slate-400/40 px-2 py-1 disabled:opacity-45"
                >
                  -{CASINO_BET_STEP}
                </button>
                <button
                  type="button"
                  onClick={() => stepBlackjackBet(CASINO_BET_STEP)}
                  disabled={isBlackjackRoundActive}
                  className="rounded-md border border-slate-400/40 px-2 py-1 disabled:opacity-45"
                >
                  +{CASINO_BET_STEP}
                </button>
                <button
                  type="button"
                  onClick={allInBlackjackBet}
                  disabled={isBlackjackRoundActive}
                  className="rounded-md border border-amber-300/50 px-2 py-1 text-amber-100 disabled:opacity-45"
                >
                  ALL IN
                </button>
                  {isBlackjackRoundActive ? <span className="text-amber-200/85">ラウンド中はベット変更できません</span> : null}
                </div>
              </div>

              <p className="text-sm text-slate-300">{blackjackMessage}</p>

              <div className="relative mt-4 grid gap-3 overflow-hidden rounded-[2rem] border-4 border-amber-200/25 bg-[radial-gradient(circle_at_28%_24%,rgba(74,222,128,0.28),rgba(6,78,59,0.92)_60%,rgba(2,44,34,0.98))] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07),0_18px_30px_rgba(2,6,23,0.45)]">
                <p className="pointer-events-none absolute inset-0 -mt-2 flex items-center justify-center text-4xl font-black tracking-[0.32em] text-amber-100/10">BLACKJACK</p>
                {showCasinoWinBurst ? (
                  <div className="pointer-events-none absolute inset-0">
                    <span className="absolute left-[18%] top-[58%] h-3 w-3 animate-ping rounded-full bg-amber-300/80" />
                    <span className="absolute left-[43%] top-[36%] h-2.5 w-2.5 animate-ping rounded-full bg-emerald-300/80 [animation-delay:120ms]" />
                    <span className="absolute left-[72%] top-[61%] h-3 w-3 animate-ping rounded-full bg-rose-300/80 [animation-delay:220ms]" />
                  </div>
                ) : null}
                <div>
                  <p className="text-sm font-semibold">{t("blackjackDealer")} ({blackjackHandValue(blackjackDealerHand)})</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {blackjackDealerHand.map((card, index) => (
                      <span key={`bj-dealer-${card.suit}-${card.rank}-${index}`}>{renderPlayingCardFace(blackjackCardLabel(card))}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold">{t("blackjackPlayer")} ({blackjackHandValue(blackjackPlayerHand)})</p>
                  <div className="mt-2 flex items-end overflow-x-auto pb-2 pr-2 pl-1">
                    {blackjackPlayerHand.map((card, index) => (
                      <span
                        key={`bj-player-${card.suit}-${card.rank}-${index}`}
                        className="inline-flex shrink-0 transition-transform duration-150 hover:-translate-y-1"
                        style={playerHandFanStyle(index, blackjackPlayerHand.length, { overlap: 11, spread: 1.9, maxRotate: 10, centerLift: 0.5, centerOffset: 0.5 })}
                      >
                        {renderPlayingCardFace(blackjackCardLabel(card))}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-2 rounded-xl border border-amber-200/30 bg-slate-950/45 p-3 text-xs text-amber-50/95 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                <p className="text-[11px] font-semibold tracking-[0.2em] text-amber-100/80">BET STATUS</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div className="rounded-md border border-emerald-200/35 bg-emerald-400/15 px-2 py-1.5 sm:min-w-0">
                    <p className="text-[10px] tracking-wide text-emerald-100/80">BANK</p>
                    <p className="text-base font-extrabold tabular-nums text-emerald-100 sm:text-sm">{formatChip(casinoBankroll)}</p>
                  </div>
                  <div className="rounded-md border border-amber-200/35 bg-amber-400/15 px-2 py-1.5 sm:min-w-0">
                    <p className="text-[10px] tracking-wide text-amber-100/80">BET</p>
                    <p className="text-base font-extrabold tabular-nums text-amber-100 sm:text-sm">{formatChip(blackjackBet)}</p>
                  </div>
                  <div className="rounded-md border border-cyan-200/35 bg-cyan-400/15 px-2 py-1.5 sm:min-w-0">
                    <p className="text-[10px] tracking-wide text-cyan-100/80">WAGER</p>
                    <p className="text-base font-extrabold tabular-nums text-cyan-100 sm:text-sm">{formatChip(blackjackWager)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={onBlackjackDeal}
                  disabled={isBlackjackDealerResolving || (!isBlackjackOver && blackjackPlayerHand.length > 0)}
                  className="rounded-md border border-emerald-200/55 bg-emerald-300/85 px-3 py-1 font-semibold text-emerald-950 shadow-[0_2px_10px_rgba(16,185,129,0.35)] disabled:opacity-60"
                >
                  BET
                </button>
                <button
                  type="button"
                  onClick={onBlackjackHit}
                  disabled={isBlackjackDealerResolving || isBlackjackOver || blackjackDeck.length === 0 || blackjackPlayerHand.length === 0}
                  className="rounded-md border border-rose-200/55 bg-rose-300/80 px-3 py-1 font-semibold text-rose-950 shadow-[0_2px_10px_rgba(244,63,94,0.28)] disabled:opacity-60"
                >
                  {t("blackjackHit")}
                </button>
                <button
                  type="button"
                  onClick={onBlackjackStand}
                  disabled={isBlackjackDealerResolving || isBlackjackOver || blackjackPlayerHand.length === 0}
                  className="rounded-md border border-slate-200/45 bg-slate-800/90 px-3 py-1 font-semibold text-slate-100 shadow-[0_2px_10px_rgba(15,23,42,0.35)] disabled:opacity-60"
                >
                  {t("blackjackStand")}
                </button>
                <button
                  type="button"
                  onClick={onBlackjackDouble}
                  disabled={isBlackjackDealerResolving || isBlackjackOver || blackjackPlayerHand.length !== 2 || casinoBankroll < blackjackWager}
                  className="rounded-md border border-amber-200/55 bg-amber-300/80 px-3 py-1 font-semibold text-amber-950 shadow-[0_2px_10px_rgba(245,158,11,0.28)] disabled:opacity-60"
                >
                  DOUBLE
                </button>
              </div>
              </fieldset>
              )}
            </article>

            
          </section>
        ) : null}

        {CHINCHIRO_VISIBLE && activePanel === "chinchiro" ? (
          <section className="grid gap-5">
            <article className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("chinchiroTitle")}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startPanelGame("chinchiro", resetChinchiro)}
                    disabled={isPanelStartCounting("chinchiro")}
                    className="rounded-md bg-cyan-400 px-3 py-1 text-sm font-semibold text-slate-950"
                  >
                    {startButtonLabel("chinchiro")}
                  </button>
                  <button
                    type="button"
                    onClick={() => runWithResetGuard("chinchiro", resetChinchiro)}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("chinchiroReset")}
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToMenuClick}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("backToMenu")}
                  </button>
                </div>
              </div>

              {!gameStarted.chinchiro ? <p className="mt-2 text-xs text-amber-200">{t("gameStartPrompt")}</p> : (
              <fieldset className="mt-2">

              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-200">
                <span className="rounded-md bg-slate-800/70 px-2 py-1">BANK: {casinoBankroll}</span>
                <span className="rounded-md bg-slate-800/70 px-2 py-1">BET: {chinchiroBet}</span>
                <span className="rounded-md bg-slate-800/70 px-2 py-1">WAGER: {chinchiroWager}</span>
                <button
                  type="button"
                  onClick={() => stepChinchiroBet(-CASINO_BET_STEP)}
                  disabled={!isChinchiroOver && chinchiroWager > 0}
                  className="rounded-md border border-slate-400/40 px-2 py-1 disabled:opacity-45"
                >
                  -{CASINO_BET_STEP}
                </button>
                <button
                  type="button"
                  onClick={() => stepChinchiroBet(CASINO_BET_STEP)}
                  disabled={!isChinchiroOver && chinchiroWager > 0}
                  className="rounded-md border border-slate-400/40 px-2 py-1 disabled:opacity-45"
                >
                  +{CASINO_BET_STEP}
                </button>
                <button
                  type="button"
                  onClick={allInChinchiroBet}
                  disabled={!isChinchiroOver && chinchiroWager > 0}
                  className="rounded-md border border-amber-300/50 px-2 py-1 text-amber-100 disabled:opacity-45"
                >
                  ALL IN
                </button>
              </div>

              <p className="text-sm text-slate-300">{chinchiroMessage}</p>

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
              </div>
              </fieldset>
              )}
            </article>

            
          </section>
        ) : null}

        {activePanel === "sevens" ? (
          <section className="grid gap-5">
            <article className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("sevensTitle")}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startPanelGame("sevens", resetSevens)}
                    disabled={isPanelStartCounting("sevens")}
                    className="rounded-md bg-cyan-400 px-3 py-1 text-sm font-semibold text-slate-950"
                  >
                    {startButtonLabel("sevens")}
                  </button>
                  <button
                    type="button"
                    onClick={() => runWithResetGuard("sevens", resetSevens)}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("sevensReset")}
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToMenuClick}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("backToMenu")}
                  </button>
                </div>
              </div>

              {!gameStarted.sevens ? <p className="mt-2 text-xs text-amber-200">{t("gameStartPrompt")}</p> : (
              <fieldset className="mt-2">

              <p className="text-sm text-slate-300">{sevensMessage}</p>

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
                <div className="flex items-end overflow-x-auto pb-2 pr-2 pl-1">
                  {sevensHands[0].map((card, index) => {
                    const playable = isSevensPlayable(card, sevensTable);
                    return (
                      <span
                        key={`${card.suit}-${card.rank}-${index}`}
                        className="inline-flex shrink-0"
                        style={playerHandFanStyle(index, sevensHands[0].length, { overlap: 15, spread: 2.8, maxRotate: 14, centerLift: 0.8, centerOffset: 0.95 })}
                      >
                        <button
                          type="button"
                          onClick={() => onSevensPlay(index)}
                          disabled={isSevensOver || sevensTurn !== "player"}
                          className={`origin-bottom rounded-md border px-2 py-1 text-xs transition-transform duration-150 hover:-translate-y-2 focus-visible:-translate-y-2 ${playable ? "border-cyan-300/60 bg-cyan-400/10" : "border-slate-500/30 bg-slate-800/40"}`}
                        >
                          {renderPlayingCardFace(sevensCardLabel(card), { compact: true, muted: !playable })}
                        </button>
                      </span>
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
              </div>
              </fieldset>
              )}
            </article>

            
          </section>
        ) : null}

        {activePanel === "daifugo" ? (
          <section className="grid gap-5">
            <article className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("daifugoTitle")}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startPanelGame("daifugo", resetDaifugo)}
                    disabled={isPanelStartCounting("daifugo")}
                    className="rounded-md bg-cyan-400 px-3 py-1 text-sm font-semibold text-slate-950"
                  >
                    {startButtonLabel("daifugo")}
                  </button>
                  <button
                    type="button"
                    onClick={() => runWithResetGuard("daifugo", resetDaifugo)}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("daifugoReset")}
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToMenuClick}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("backToMenu")}
                  </button>
                </div>
              </div>

              {!gameStarted.daifugo ? <p className="mt-2 text-xs text-amber-200">{t("gameStartPrompt")}</p> : (
              <fieldset className="mt-2">

              <p className="text-sm text-slate-300">{daifugoMessage}</p>
              {connectedRoomCode ? <p className="mt-1 text-xs text-cyan-200">{roomTurnText(canOperateDaifugoNow)}</p> : null}

              <div className="mt-4 grid gap-2 rounded-lg border border-slate-500/30 bg-slate-950/40 p-4 text-sm">
                <p className="flex items-center gap-2">
                  <span>{t("daifugoTable")}:</span>
                  {daifugoTableCard ? renderPlayingCardFace(daifugoCardLabel(daifugoTableCard)) : <span>-</span>}
                </p>
                <p>{t("daifugoCpuHand")}: {daifugoLocalSide === "player" ? daifugoHands[1].length : daifugoHands[0].length}</p>
              </div>

              <div className="mt-4">
                <p className="text-sm font-semibold">{t("daifugoYourHand")} ({daifugoLocalSide === "player" ? daifugoHands[0].length : daifugoHands[1].length})</p>
                <div className="mt-2 flex items-end overflow-x-auto pb-2 pr-2 pl-1">
                  {(daifugoLocalSide === "player" ? daifugoHands[0] : daifugoHands[1]).map((card, index, cards) => {
                    const playable = !daifugoTableCard || daifugoPower(card.rank) > daifugoPower(daifugoTableCard.rank);
                    return (
                      <span
                        key={`${card.suit}-${card.rank}-${index}`}
                        className="inline-flex shrink-0"
                        style={playerHandFanStyle(index, cards.length, { overlap: 15, spread: 2.7, maxRotate: 14, centerLift: 0.75, centerOffset: 0.9 })}
                      >
                        <button
                          type="button"
                          onClick={() => onDaifugoPlay(index, { side: daifugoLocalSide })}
                          disabled={isDaifugoOver || !canOperateDaifugoNow}
                          className={`origin-bottom rounded-md border px-2 py-1 text-xs transition-transform duration-150 hover:-translate-y-2 focus-visible:-translate-y-2 ${playable ? "border-cyan-300/60 bg-cyan-400/10" : "border-slate-500/30 bg-slate-800/40"}`}
                        >
                          {renderPlayingCardFace(daifugoCardLabel(card), { compact: true, muted: !playable })}
                        </button>
                      </span>
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
              </div>
              </fieldset>
              )}
            </article>

            
          </section>
        ) : null}

        {activePanel === "fourPanel" ? (
          <section className="grid gap-5">
            <article className="mx-auto w-full max-w-[110rem] rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("fourPanelTitle")}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startPanelGame("fourPanel", resetFourPanel)}
                    disabled={isPanelStartCounting("fourPanel")}
                    className="rounded-md bg-cyan-400 px-3 py-1 text-sm font-semibold text-slate-950"
                  >
                    {startButtonLabel("fourPanel")}
                  </button>
                  <button
                    type="button"
                    onClick={() => runWithResetGuard("fourPanel", resetFourPanel)}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("fourPanelReset")}
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToMenuClick}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("backToMenu")}
                  </button>
                </div>
              </div>

              <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <label className="grid gap-1 text-sm text-slate-300">
                  <span>{t("fourPanelStoryTitle")}</span>
                  <input
                    list="four-panel-title-list"
                    value={fourPanelTitle}
                    onChange={(event) => setFourPanelTitle(event.currentTarget.value.slice(0, 40))}
                    onBlur={(event) => setFourPanelTitle(normalizeFourPanelTitle(event.currentTarget.value))}
                    maxLength={40}
                    className="rounded-md border border-slate-400/40 bg-slate-950/70 px-3 py-2 text-sm"
                    placeholder="お題を入力"
                  />
                  <datalist id="four-panel-title-list">
                    {FOUR_PANEL_RANDOM_TITLES.map((title) => (
                      <option key={`four-panel-title-${title}`} value={title} />
                    ))}
                  </datalist>
                </label>
                <button
                  type="button"
                  onClick={randomizeFourPanelTitle}
                  className="rounded-md border border-cyan-200/40 px-3 py-2 text-sm"
                >
                  ランダム
                </button>
              </div>

              {!gameStarted.fourPanel ? <p className="mt-2 text-xs text-amber-200">{t("gameStartPrompt")}</p> : null}
              <fieldset disabled={!gameStarted.fourPanel} className={!gameStarted.fourPanel ? "mt-2 pointer-events-none opacity-60" : "mt-2"}>

              <p className="mt-2 text-sm text-slate-300">{t("fourPanelStoryTitle")}: {fourPanelResolvedTitle}</p>
              <p className="mt-1 text-sm text-slate-300">{fourPanelMessage}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-200">
                <label className="ml-1 inline-flex items-center gap-1 rounded-md bg-slate-800/80 px-2 py-1">
                  <span>SIZE</span>
                  <input
                    type="range"
                    min={BRUSH_SIZE_MIN}
                    max={BRUSH_SIZE_MAX}
                    step={1}
                    value={fourPanelBrushSize}
                    onChange={(event) => setFourPanelBrushSize(clampBrushSize(Number(event.currentTarget.value)))}
                    className="h-4 w-28 accent-cyan-300"
                  />
                  <input
                    type="number"
                    min={BRUSH_SIZE_MIN}
                    max={BRUSH_SIZE_MAX}
                    step={1}
                    value={fourPanelBrushSize}
                    onChange={(event) => setFourPanelBrushSize(clampBrushSize(Number(event.currentTarget.value)))}
                    className="w-14 rounded border border-slate-400/40 bg-slate-950/70 px-1 py-0.5 text-right text-xs text-slate-100"
                  />
                </label>
                <label className="ml-1 inline-flex items-center gap-2 rounded-md bg-slate-800/80 px-2 py-1">
                  <span>COLOR</span>
                  <input
                    type="color"
                    value={fourPanelBrushColor}
                    onChange={(event) => setFourPanelBrushColor(event.currentTarget.value)}
                    className="h-6 w-8 cursor-pointer rounded border border-slate-300/50 bg-transparent p-0"
                  />
                  <span className="w-16 text-right uppercase">{fourPanelBrushColor}</span>
                </label>
                <label className="ml-1 inline-flex items-center gap-1 rounded-md bg-slate-800/80 px-2 py-1">
                  <span>ALPHA</span>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={fourPanelBrushOpacity}
                    onChange={(event) => setFourPanelBrushOpacity(Number(event.currentTarget.value))}
                    className="h-4 w-20 accent-cyan-300"
                  />
                  <span className="w-9 text-right">{fourPanelBrushOpacity}%</span>
                </label>
              </div>

              <div className="mt-4 rounded-xl border border-slate-500/40 bg-white p-2">
                <div className="relative">
                  <canvas
                    ref={fourPanelCanvasRef}
                    width={720}
                    height={360}
                    onPointerDown={onFourPanelPointerDown}
                    onPointerEnter={onFourPanelPointerEnter}
                    onPointerMove={onFourPanelPointerMove}
                    onPointerUp={onFourPanelPointerUp}
                    onPointerLeave={onFourPanelPointerLeave}
                    className="h-auto w-full cursor-none rounded bg-white"
                  />
                  {fourPanelCursor.visible ? (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute z-10 rounded-md border border-slate-900/70 bg-slate-950/90 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-cyan-100"
                      style={{
                        left: Math.round(fourPanelCursor.x) + 10,
                        top: Math.round(fourPanelCursor.y) - 16,
                        boxShadow: "0 2px 6px rgba(15, 23, 42, 0.35)",
                      }}
                    >
                      {fourPanelCursor.size}px
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={undoFourPanelStroke}
                  className="rounded-md border border-cyan-200/40 px-3 py-1"
                >
                  {t("fourPanelUndoStroke")}
                </button>
                <button
                  type="button"
                  onClick={undoFourPanelPanel}
                  disabled={fourPanelImages.length <= 0}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 disabled:opacity-45"
                >
                  {t("fourPanelUndoPanel")}
                </button>
                <button
                  type="button"
                  onClick={() => clearFourPanelCanvas({ recordUndo: true })}
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
                <span className="rounded-md bg-slate-800 px-3 py-1 text-xs">
                  {tf("fourPanelProgress", { current: Math.min(4, fourPanelIndex + 1) })}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">{t("fourPanelShortcutHint")}</p>

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
              </fieldset>
            </article>

            
          </section>
        ) : null}

        {activePanel === "drawingRelay" ? (
          <section className="grid gap-5">
            <article className="mx-auto w-full max-w-[110rem] rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("drawingRelayTitle")}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startPanelGame("drawingRelay", resetDrawingRelay)}
                    disabled={isPanelStartCounting("drawingRelay")}
                    className="rounded-md bg-cyan-400 px-3 py-1 text-sm font-semibold text-slate-950"
                  >
                    {startButtonLabel("drawingRelay")}
                  </button>
                  <button
                    type="button"
                    onClick={() => runWithResetGuard("drawingRelay", resetDrawingRelay)}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("drawingRelayReset")}
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToMenuClick}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("backToMenu")}
                  </button>
                </div>
              </div>

              {!gameStarted.drawingRelay ? <p className="mt-2 text-xs text-amber-200">{t("gameStartPrompt")}</p> : null}
              <fieldset disabled={!gameStarted.drawingRelay} className={!gameStarted.drawingRelay ? "mt-2 pointer-events-none opacity-60" : "mt-2"}>

              <p className="text-sm text-slate-300">{t("drawingRelayPrompt")}: {drawingRelayPrompt}</p>
              <p className="mt-1 text-sm text-slate-300">{drawingRelayMessage}</p>

              {drawingRelayPhase === "draw" ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-200">
                  <label className="ml-1 inline-flex items-center gap-1 rounded-md bg-slate-800/80 px-2 py-1">
                    <span>SIZE</span>
                    <input
                      type="range"
                      min={BRUSH_SIZE_MIN}
                      max={BRUSH_SIZE_MAX}
                      step={1}
                      value={drawingRelayBrushSize}
                      onChange={(event) => setDrawingRelayBrushSize(clampBrushSize(Number(event.currentTarget.value)))}
                      className="h-4 w-28 accent-cyan-300"
                    />
                    <input
                      type="number"
                      min={BRUSH_SIZE_MIN}
                      max={BRUSH_SIZE_MAX}
                      step={1}
                      value={drawingRelayBrushSize}
                      onChange={(event) => setDrawingRelayBrushSize(clampBrushSize(Number(event.currentTarget.value)))}
                      className="w-14 rounded border border-slate-400/40 bg-slate-950/70 px-1 py-0.5 text-right text-xs text-slate-100"
                    />
                  </label>
                  <label className="ml-1 inline-flex items-center gap-2 rounded-md bg-slate-800/80 px-2 py-1">
                    <span>COLOR</span>
                    <input
                      type="color"
                      value={drawingRelayBrushColor}
                      onChange={(event) => setDrawingRelayBrushColor(event.currentTarget.value)}
                      className="h-6 w-8 cursor-pointer rounded border border-slate-300/50 bg-transparent p-0"
                    />
                    <span className="w-16 text-right uppercase">{drawingRelayBrushColor}</span>
                  </label>
                  <label className="ml-1 inline-flex items-center gap-1 rounded-md bg-slate-800/80 px-2 py-1">
                    <span>ALPHA</span>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={drawingRelayBrushOpacity}
                      onChange={(event) => setDrawingRelayBrushOpacity(Number(event.currentTarget.value))}
                      className="h-4 w-20 accent-cyan-300"
                    />
                    <span className="w-9 text-right">{drawingRelayBrushOpacity}%</span>
                  </label>
                </div>
              ) : null}

              {drawingRelayPhase === "draw" ? (
                <div className="mt-4 rounded-xl border border-slate-500/40 bg-white p-2">
                  <div className="relative">
                    <canvas
                      ref={drawingRelayCanvasRef}
                      width={720}
                      height={360}
                      onPointerDown={onDrawingRelayPointerDown}
                      onPointerEnter={onDrawingRelayPointerEnter}
                      onPointerMove={onDrawingRelayPointerMove}
                      onPointerUp={onDrawingRelayPointerUp}
                      onPointerLeave={onDrawingRelayPointerLeave}
                      className="h-auto w-full cursor-none rounded bg-white"
                    />
                    {drawingRelayCursor.visible ? (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute z-10 rounded-md border border-slate-900/70 bg-slate-950/90 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-cyan-100"
                        style={{
                          left: Math.round(drawingRelayCursor.x) + 10,
                          top: Math.round(drawingRelayCursor.y) - 16,
                          boxShadow: "0 2px 6px rgba(15, 23, 42, 0.35)",
                        }}
                      >
                        {drawingRelayCursor.size}px
                      </div>
                    ) : null}
                  </div>
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

              </div>
              </fieldset>
            </article>

            
          </section>
        ) : null}

        {activePanel === "fitPuzzle" ? (
          <section className="grid gap-5">
            <article className="mx-auto w-full max-w-[110rem] rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("fitPuzzleTitle")}</h2>
                <button
                  type="button"
                  onClick={handleBackToMenuClick}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("backToMenu")}
                </button>
              </div>

              <div className="mt-3">
                <LegacyFitPuzzle
                  onBackToMenu={handleBackToMenuDirect}
                  language={language}
                  onFitPuzzleProgressRequest={requestFitPuzzleProgress}
                  onFitPuzzleProgressSave={saveFitPuzzleProgress}
                />
              </div>
            </article>

            
          </section>
        ) : null}

        {activePanel === "mahjong" ? (
          <section className="grid gap-5">
            <article className="mx-auto w-full max-w-[110rem] rounded-2xl border border-emerald-200/25 bg-gradient-to-b from-emerald-950/70 via-emerald-900/55 to-slate-900/65 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("mahjongTitle")}</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startPanelGame("mahjong", resetMahjong)}
                    disabled={isPanelStartCounting("mahjong")}
                    className="rounded-md bg-cyan-400 px-3 py-1 text-sm font-semibold text-slate-950"
                  >
                    {startButtonLabel("mahjong")}
                  </button>
                  <button
                    type="button"
                    onClick={() => runWithResetGuard("mahjong", resetMahjong)}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("mahjongReset")}
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToMenuClick}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("backToMenu")}
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
                  <button
                    type="button"
                    onClick={onMahjongTsumo}
                    className="rounded-md border border-emerald-200/40 px-3 py-1 text-sm"
                  >
                    {t("mahjongTsumo")}
                  </button>
                </div>
              </div>

              {!gameStarted.mahjong ? <p className="mt-2 text-xs text-amber-200">{t("gameStartPrompt")}</p> : null}
              <fieldset disabled={!gameStarted.mahjong} className={!gameStarted.mahjong ? "mt-2 pointer-events-none opacity-60" : "mt-2"}>

              <p className="text-sm text-slate-300">{mahjongMessage}</p>
              <div className="mt-2 rounded-xl border border-emerald-300/25 bg-emerald-950/35 p-3">
                <div className="grid gap-2 text-xs text-emerald-50 sm:grid-cols-2 lg:grid-cols-7">
                  <div className="rounded-md border border-emerald-200/25 bg-emerald-900/45 px-2 py-1.5">
                    <span className="text-emerald-100/70">{t("mahjongRound")}</span>
                    <p className="mt-0.5 text-sm font-semibold">{mahjongRoundWind}{mahjongRoundNumber}</p>
                  </div>
                  <div className="rounded-md border border-emerald-200/25 bg-emerald-900/45 px-2 py-1.5">
                    <span className="text-emerald-100/70">{t("mahjongSeat")}</span>
                    <p className="mt-0.5 text-sm font-semibold">{mahjongSeatWind}</p>
                  </div>
                  <div className="rounded-md border border-emerald-200/25 bg-emerald-900/45 px-2 py-1.5">
                    <span className="text-emerald-100/70">{t("mahjongHonba")}</span>
                    <p className="mt-0.5 text-sm font-semibold">{mahjongHonba}</p>
                  </div>
                  <div className="rounded-md border border-emerald-200/25 bg-emerald-900/45 px-2 py-1.5">
                    <span className="text-emerald-100/70">{t("mahjongKyotaku")}</span>
                    <p className="mt-0.5 text-sm font-semibold">{mahjongKyotaku}</p>
                  </div>
                  <div className="rounded-md border border-emerald-200/25 bg-emerald-900/45 px-2 py-1.5">
                    <span className="text-emerald-100/70">{t("mahjongJunme")}</span>
                    <p className="mt-0.5 text-sm font-semibold">{mahjongRiver.length + 1}</p>
                  </div>
                  <div className="rounded-md border border-emerald-200/25 bg-emerald-900/45 px-2 py-1.5">
                    <span className="text-emerald-100/70">{t("mahjongDora")}</span>
                    {mahjongDoraIndicator === null ? (
                      <p className="mt-0.5 text-sm font-semibold">-</p>
                    ) : (
                      <div className="relative mt-0.5 inline-flex h-12 w-8 items-center justify-center overflow-hidden rounded border border-stone-300 bg-gradient-to-b from-white via-stone-100 to-stone-200 px-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_1px_2px_rgba(0,0,0,0.25)]">
                        <span className="pointer-events-none absolute inset-y-0 left-0 w-[2px] bg-stone-300/70" />
                        <span className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-white/80" />
                        <span className="relative z-10">{renderMahjongTileArt(mahjongDoraIndicator, true)}</span>
                      </div>
                    )}
                  </div>
                  <div className="rounded-md border border-emerald-200/25 bg-emerald-900/45 px-2 py-1.5">
                    <span className="text-emerald-100/70">{t("mahjongWall")}</span>
                    <p className="mt-0.5 text-sm font-semibold">{tf("mahjongRemaining", { count: mahjongRemainingCount(mahjongWall) })}</p>
                  </div>
                </div>

                <p className="mt-3 text-sm text-emerald-100/85">{t("mahjongWall")}: {mahjongWall.length}</p>
              </div>

              {mahjongWinSummary ? (
                <div className="mt-3 rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-3 text-sm text-emerald-50">
                  <p className="font-semibold">{t("mahjongResultTitle")}</p>
                  <p className="mt-1 text-emerald-100/90">
                    {mahjongWinSummary.isYakuman
                      ? t("mahjongResultYakuman")
                      : tf("mahjongResultHanFu", { han: mahjongWinSummary.han, fu: mahjongWinSummary.fu })}
                  </p>
                  <p className="text-emerald-100/90">{tf("mahjongResultPoint", { point: mahjongWinSummary.point })}</p>
                  <p className="mt-1 text-xs text-emerald-100/80">
                    {mahjongWinSummary.yakuKeys.map((key) => t(key)).join(" / ")}
                  </p>
                  <button
                    type="button"
                    onClick={onMahjongApplyScore}
                    className="mt-3 rounded-md border border-emerald-200/50 px-3 py-1 text-xs font-semibold"
                  >
                    {t("mahjongApplyScore")}
                  </button>
                </div>
              ) : null}

              <p className="mt-4 text-xs uppercase tracking-wide text-slate-400">{t("mahjongOpponent")}</p>
              <div className="mt-2 rounded-xl border border-emerald-200/20 bg-emerald-900/30 p-3">
                <p className="text-lg font-semibold text-emerald-100">13</p>
              </div>

              <p className="mt-4 text-xs uppercase tracking-wide text-slate-400">{t("mahjongHand")}</p>
              <div className="mt-2 rounded-xl border border-emerald-200/20 bg-emerald-900/35 p-3">
              <div className="flex flex-wrap gap-2">
                {(mahjongBoard.length >= 14 ? mahjongBoard.slice(0, 13) : mahjongBoard).map((tile, index) => {
                  const selected = mahjongSelected === index;
                  return (
                    <button
                      key={`mahjong-hand-${index}-${tile}`}
                      type="button"
                      onClick={() => onMahjongTileClick(index)}
                      disabled={isMahjongOver}
                      className={`relative h-[4.8rem] w-10 overflow-hidden rounded-md border bg-gradient-to-b from-white via-stone-100 to-stone-200 px-1 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_1px_2px_rgba(0,0,0,0.3)] transition ${selected ? "-translate-y-1 border-cyan-400 ring-2 ring-cyan-300/70" : "border-stone-300 hover:-translate-y-0.5"}`}
                    >
                      <span className="pointer-events-none absolute inset-y-0 left-0 w-[2px] bg-stone-300/70" />
                      <span className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-white/80" />
                      <span className="relative z-10">{renderMahjongTileArt(tile)}</span>
                    </button>
                  );
                })}
                {mahjongBoard.length >= 14 ? (
                  <>
                    <div className="mx-1 h-[4.8rem] w-px self-center bg-emerald-100/25" />
                    {(() => {
                      const index = mahjongBoard.length - 1;
                      const tile = mahjongBoard[index];
                      const selected = mahjongSelected === index;
                      return (
                        <button
                          key={`mahjong-hand-tsumo-${index}-${tile}`}
                          type="button"
                          onClick={() => onMahjongTileClick(index)}
                          disabled={isMahjongOver}
                          className={`relative h-[4.8rem] w-10 overflow-hidden rounded-md border bg-gradient-to-b from-white via-stone-100 to-stone-200 px-1 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_1px_2px_rgba(0,0,0,0.3)] transition ring-2 ring-amber-300 ${selected ? "-translate-y-1 border-cyan-400 ring-cyan-300/70" : "border-stone-300 hover:-translate-y-0.5"}`}
                        >
                          <span className="pointer-events-none absolute inset-y-0 left-0 w-[2px] bg-stone-300/70" />
                          <span className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-white/80" />
                          <span className="relative z-10">{renderMahjongTileArt(tile)}</span>
                        </button>
                      );
                    })()}
                  </>
                ) : null}
              </div>
              </div>

              <p className="mt-5 text-xs uppercase tracking-wide text-slate-400">{t("mahjongRiver")}</p>
              <div className="mt-2 rounded-xl border border-emerald-200/20 bg-emerald-900/30 p-3">
              {mahjongRiichiTileIndex !== null ? (
                <p className="mb-2 text-[11px] font-semibold tracking-wide text-amber-200">{t("mahjongRiichi")}</p>
              ) : null}
              <div className="grid grid-cols-6 gap-1.5">
                {mahjongRiver.length === 0 ? (
                  <span className="col-span-full text-sm text-slate-400">-</span>
                ) : (
                  mahjongRiver.map((tile, index) => (
                    <div
                      key={`mahjong-river-${index}-${tile}`}
                      className={`relative mx-auto h-14 w-9 overflow-hidden rounded border border-stone-300 bg-gradient-to-b from-white via-stone-100 to-stone-200 px-1 py-1 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_1px_2px_rgba(0,0,0,0.25)] transition ${index === mahjongRiichiTileIndex ? "rotate-90" : ""}`}
                    >
                      <span className="pointer-events-none absolute inset-y-0 left-0 w-[2px] bg-stone-300/70" />
                      <span className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-white/80" />
                      <span className="relative z-10">{renderMahjongTileArt(tile, true)}</span>
                    </div>
                  ))
                )}
              </div>
              </div>

              </fieldset>
            </article>

            
          </section>
        ) : null}

        {activePanel === "poker" ? (
          <section className="grid gap-5">
            <article className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("pokerTitle")}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startPanelGame("poker", resetPoker)}
                    disabled={isPanelStartCounting("poker")}
                    className="rounded-md bg-cyan-400 px-3 py-1 text-sm font-semibold text-slate-950"
                  >
                    {startButtonLabel("poker")}
                  </button>
                  <button
                    type="button"
                    onClick={() => runWithResetGuard("poker", resetPoker)}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("pokerDeal")}
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToMenuClick}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("backToMenu")}
                  </button>
                </div>
              </div>

              {!gameStarted.poker ? <p className="mt-2 text-xs text-amber-200">{t("gameStartPrompt")}</p> : (
              <fieldset className="mt-2">

              <div className="mb-3 grid gap-2 rounded-xl border border-cyan-200/20 bg-slate-950/35 p-3">
                <div className="grid gap-2 text-xs text-slate-200 sm:grid-cols-3">
                  <div className="rounded-md border border-cyan-200/25 bg-slate-900/65 px-3 py-2">
                    <p className="text-[10px] tracking-wide text-cyan-100/70">BANK</p>
                    <p className="mt-1 text-base font-bold text-cyan-100">{formatChip(casinoBankroll)}</p>
                  </div>
                  <div className="rounded-md border border-cyan-200/25 bg-slate-900/65 px-3 py-2">
                    <p className="text-[10px] tracking-wide text-cyan-100/70">BET</p>
                    <p className="mt-1 text-base font-bold text-cyan-100">{formatChip(pokerBet)}</p>
                  </div>
                  <div className="rounded-md border border-cyan-200/25 bg-slate-900/65 px-3 py-2">
                    <p className="text-[10px] tracking-wide text-cyan-100/70">WAGER</p>
                    <p className="mt-1 text-base font-bold text-cyan-100">{formatChip(pokerWager)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPokerBetByRatio(0.25)}
                    className="rounded-md border border-slate-400/40 px-2 py-1"
                  >
                    25%
                  </button>
                  <button
                    type="button"
                    onClick={() => setPokerBetByRatio(0.5)}
                    className="rounded-md border border-slate-400/40 px-2 py-1"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setPokerBetByRatio(0.75)}
                    className="rounded-md border border-slate-400/40 px-2 py-1"
                  >
                    75%
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200">
                <button
                  type="button"
                  onClick={() => stepPokerBet(-CASINO_BET_STEP)}
                  className="rounded-md border border-slate-400/40 px-2 py-1"
                >
                  -{CASINO_BET_STEP}
                </button>
                <button
                  type="button"
                  onClick={() => stepPokerBet(CASINO_BET_STEP)}
                  className="rounded-md border border-slate-400/40 px-2 py-1"
                >
                  +{CASINO_BET_STEP}
                </button>
                <button
                  type="button"
                  onClick={allInPokerBet}
                  className="rounded-md border border-amber-300/50 px-2 py-1 text-amber-100"
                >
                  ALL IN
                </button>
                  {isPokerRoundActive ? <span className="text-amber-200/85">進行中ラウンドには反映されません（次ラウンドから有効）</span> : null}
                </div>
              </div>

              <p className="text-xs font-semibold tracking-[0.14em] text-amber-100/85">PHASE: {pokerPhaseLabel}</p>
              <p className="text-sm text-slate-300">{pokerMessage}</p>

              <div className="relative mt-4 grid gap-4 overflow-hidden rounded-[2rem] border-4 border-amber-200/25 bg-[radial-gradient(circle_at_72%_22%,rgba(45,212,191,0.24),rgba(4,94,74,0.92)_58%,rgba(2,44,34,0.98))] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07),0_18px_30px_rgba(2,6,23,0.45)]">
                <p className="pointer-events-none absolute inset-0 -mt-2 flex items-center justify-center text-4xl font-black tracking-[0.32em] text-amber-100/10">POKER</p>
                {showCasinoWinBurst ? (
                  <div className="pointer-events-none absolute inset-0">
                    <span className="absolute left-[23%] top-[62%] h-3 w-3 animate-ping rounded-full bg-amber-300/80" />
                    <span className="absolute left-[52%] top-[40%] h-2.5 w-2.5 animate-ping rounded-full bg-cyan-300/80 [animation-delay:120ms]" />
                    <span className="absolute left-[78%] top-[56%] h-3 w-3 animate-ping rounded-full bg-emerald-300/80 [animation-delay:220ms]" />
                  </div>
                ) : null}
                <div>
                  <p className="text-sm font-semibold">{t("pokerPlayerHand")}</p>
                  <div className="mt-2 flex items-end overflow-x-auto pb-2 pr-2 pl-1">
                    {pokerPlayerHand.map((card, index) => {
                      const held = pokerHold[index];
                      return (
                        <span
                          key={`poker-player-${card.suit}-${card.rank}-${index}`}
                          className="inline-flex shrink-0"
                          style={playerHandFanStyle(index, pokerPlayerHand.length, { overlap: 10, spread: 1.8, maxRotate: 9, centerLift: 0.4, centerOffset: 0.45 })}
                        >
                          <button
                            type="button"
                            aria-pressed={held}
                            disabled
                            className={`origin-bottom rounded-md border p-1.5 text-sm transition-transform duration-150 hover:-translate-y-2 focus-visible:-translate-y-2 aria-pressed:-translate-y-2 ${held ? "border-cyan-200 bg-cyan-400/20" : "border-slate-400/30 bg-slate-800/40"}`}
                          >
                            <span className="inline-flex flex-col items-center gap-1">
                              {pokerPhase === "betting"
                                ? <span className="inline-flex h-12 w-9 items-center justify-center rounded-md border border-slate-500/50 bg-slate-700/80 text-sm font-bold text-slate-200">🂠</span>
                                : renderPlayingCardFace(pokerCardLabel(card))}
                              <span className={`rounded px-1.5 py-[1px] text-[10px] ${held ? "bg-cyan-300/25 text-cyan-100" : "bg-slate-700/40 text-slate-400"}`}>
                                {held ? t("pokerHeld") : ""}
                              </span>
                            </span>
                          </button>
                        </span>
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
                        {pokerPhase === "showdown"
                          ? renderPlayingCardFace(pokerCardLabel(card))
                          : <span className="inline-flex h-12 w-9 items-center justify-center rounded-md border border-slate-500/50 bg-slate-700/80 text-sm font-bold text-slate-200">??</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold">COMMUNITY</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const card = pokerCommunity[index];
                      return (
                        <div
                          key={`poker-community-${index}`}
                          className="rounded-md border border-slate-400/30 bg-slate-800/40 px-3 py-2 text-sm"
                        >
                          {card
                            ? renderPlayingCardFace(pokerCardLabel(card))
                            : <span className="inline-flex h-12 w-9 items-center justify-center rounded-md border border-slate-500/50 bg-slate-700/80 text-sm font-bold text-slate-200">?</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-2 rounded-xl border border-amber-200/30 bg-slate-950/45 p-3 text-xs text-amber-50/95 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                <p className="text-[11px] font-semibold tracking-[0.2em] text-amber-100/80">BET STATUS</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div className="rounded-md border border-emerald-200/35 bg-emerald-400/15 px-2 py-1.5 sm:min-w-0">
                    <p className="text-[10px] tracking-wide text-emerald-100/80">BANK</p>
                    <p className="text-base font-extrabold tabular-nums text-emerald-100 sm:text-sm">{formatChip(casinoBankroll)}</p>
                  </div>
                  <div className="rounded-md border border-amber-200/35 bg-amber-400/15 px-2 py-1.5 sm:min-w-0">
                    <p className="text-[10px] tracking-wide text-amber-100/80">BET</p>
                    <p className="text-base font-extrabold tabular-nums text-amber-100 sm:text-sm">{formatChip(pokerBet)}</p>
                  </div>
                  <div className="rounded-md border border-cyan-200/35 bg-cyan-400/15 px-2 py-1.5 sm:min-w-0">
                    <p className="text-[10px] tracking-wide text-cyan-100/80">WAGER</p>
                    <p className="text-base font-extrabold tabular-nums text-cyan-100 sm:text-sm">{formatChip(pokerWager)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={onPokerDraw}
                  disabled={pokerPhase === "showdown"}
                  className="rounded-md border border-emerald-200/55 bg-emerald-300/85 px-3 py-1 font-semibold text-emerald-950 shadow-[0_2px_10px_rgba(16,185,129,0.35)] disabled:opacity-60"
                >
                  {pokerActionLabel}
                </button>

              </div>

              {pokerPhase === "showdown" && pokerPlayerEval && pokerCpuEval ? (
                <div className="mt-4 rounded-lg border border-slate-500/30 bg-slate-950/40 p-4 text-sm text-slate-200">
                  <p>{t("pokerPlayerHand")}: {pokerHandName(pokerPlayerEval.name)}</p>
                  <p>{t("pokerCpuHand")}: {pokerHandName(pokerCpuEval.name)}</p>
                </div>
              ) : null}
              </fieldset>
              )}
            </article>

            
          </section>
        ) : null}

        {activePanel === "solitaire" ? (
          <section className="grid gap-5">
            <article className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("solitaireTitle")}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startPanelGame("solitaire", resetSolitaire)}
                    disabled={isPanelStartCounting("solitaire")}
                    className="rounded-md bg-cyan-400 px-3 py-1 text-sm font-semibold text-slate-950"
                  >
                    {startButtonLabel("solitaire")}
                  </button>
                  <button
                    type="button"
                    onClick={() => runWithResetGuard("solitaire", resetSolitaire)}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("solitaireReset")}
                  </button>
                  <button
                    type="button"
                    onClick={undoSolitaireMove}
                    disabled={solitaireUndoStack.length === 0}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm disabled:opacity-45"
                  >
                    {t("solitaireUndo")}
                  </button>
                  <button
                    type="button"
                    onClick={autoClearSolitaire}
                    disabled={!canOfferSolitaireAutoClear()}
                    className="rounded-md border border-amber-300/50 bg-amber-300/15 px-3 py-1 text-sm font-semibold text-amber-100 disabled:opacity-45"
                  >
                    {t("solitaireAutoClear")}
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToMenuClick}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("backToMenu")}
                  </button>
                </div>
              </div>

              {!gameStarted.solitaire ? <p className="mt-2 text-xs text-amber-200">{t("gameStartPrompt")}</p> : null}
              <fieldset disabled={!gameStarted.solitaire} className={!gameStarted.solitaire ? "mt-2 pointer-events-none opacity-60" : "mt-2"}>

              <p className="text-sm text-slate-300">{solitaireMessage}</p>
              <p className="mt-1 text-sm text-slate-300">{tf("solitaireFoundations", { count: foundationCount(solitaireFoundations) })}</p>

              <div className="solitaire-wrap">
                <div className="solitaire-top-row">
                  <div className="solitaire-piles-left">
                    <button
                      type="button"
                      onClick={drawSolitaireStock}
                      className={`solitaire-slot ${solitaireStock.length > 0 ? "card-back" : ""}`}
                      aria-label={t("solitaireStock")}
                    >
                      {solitaireStock.length > 0 ? "" : "↺"}
                    </button>

                    {(() => {
                      const wasteTop = solitaireWaste[solitaireWaste.length - 1];
                      const wasteSelected = solitaireSelection?.from === "waste";
                      const wasteDragging = solitaireDraggingSelection?.from === "waste";
                      const wasteClass = wasteTop
                        ? `solitaire-slot card-face ${solitaireIsRed(wasteTop.suit) ? "red" : ""} ${wasteSelected ? "selected" : ""} ${wasteDragging ? "drag-source" : ""}`
                        : "solitaire-slot";
                      return (
                        <button
                          type="button"
                          onClick={onSolitaireSelectWaste}
                          onDoubleClick={() => {
                            if (isSolitaireOver || solitaireWaste.length <= 0) return;
                            if (!tryAutoPlaceSolitaire({ from: "waste" })) {
                              setSolitaireMessage(t("solitaireInvalidMove"));
                            }
                          }}
                          draggable={Boolean(gameStarted.solitaire && wasteTop && !isSolitaireOver)}
                          onDragStart={(e) => onSolitaireDragStart(e, { from: "waste" })}
                          onDragEnd={onSolitaireDragEnd}
                          className={wasteClass}
                          aria-label={t("solitaireWaste")}
                        >
                          {wasteTop ? solitaireCardLabel(wasteTop) : "W"}
                        </button>
                      );
                    })()}
                  </div>

                  <div className="solitaire-foundations">
                    {(["H", "D", "C", "S"] as SolitaireSuit[]).map((suit) => {
                      const pile = solitaireFoundations[suit];
                      const top = pile[pile.length - 1];
                      const foundationSelected = solitaireSelection?.from === "foundation" && solitaireSelection.suit === suit;
                      const foundationDragging = solitaireDraggingSelection?.from === "foundation" && solitaireDraggingSelection.suit === suit;
                      const foundationDragTarget = solitaireDragOverTarget?.kind === "foundation" && solitaireDragOverTarget.suit === suit;
                      const className = top
                        ? `solitaire-slot card-face ${solitaireIsRed(top.suit) ? "red" : ""} ${foundationSelected ? "selected" : ""} ${foundationDragging ? "drag-source" : ""} ${foundationDragTarget ? "drag-target" : ""}`
                        : `solitaire-slot ${foundationSelected ? "selected" : ""} ${foundationDragTarget ? "drag-target" : ""}`;
                      return (
                        <button
                          key={`foundation-${suit}`}
                          type="button"
                          onClick={() => onSolitaireMoveToFoundation(suit)}
                          draggable={Boolean(gameStarted.solitaire && top && !isSolitaireOver)}
                          onDragStart={(e) => onSolitaireDragStart(e, { from: "foundation", suit })}
                          onDragEnd={onSolitaireDragEnd}
                          onDragOver={(e) => onSolitaireDragOverFoundation(e, suit)}
                          onDrop={(e) => onSolitaireDropToFoundation(e, suit)}
                          className={className}
                          aria-label={`Foundation ${suit}`}
                        >
                          {top ? solitaireCardLabel(top) : solitaireSuitSymbol(suit)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="solitaire-tableau" aria-label="Tableau">
                  {solitaireTableau.map((pile, col) => (
                    <div
                      key={`tableau-${col}`}
                      className={`solitaire-col ${solitaireDragOverTarget?.kind === "tableau" && solitaireDragOverTarget.col === col ? "drag-target" : ""}`}
                    >
                      {pile.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => onSolitaireMoveToTableau(col)}
                          onDragOver={(e) => onSolitaireDragOverTableau(e, col)}
                          onDrop={(e) => onSolitaireDropToTableau(e, col)}
                          className="solitaire-tableau-card empty"
                        >
                          
                        </button>
                      ) : (
                        pile.map((card, idx) => {
                          const selectable = card.faceUp && isMovableSolitaireTableauStack(solitaireTableau, col, idx);
                          const selected =
                            solitaireSelection?.from === "tableau"
                            && solitaireSelection.col === col
                            && idx >= solitaireSelection.index;
                          const dragging =
                            solitaireDraggingSelection?.from === "tableau"
                            && solitaireDraggingSelection.col === col
                            && idx >= solitaireDraggingSelection.index;
                          const classes = ["solitaire-tableau-card"];
                          if (!card.faceUp) {
                            classes.push("card-back");
                          } else {
                            classes.push("card-face");
                            if (solitaireIsRed(card.suit)) classes.push("red");
                          }
                          if (selected) classes.push("selected");
                          if (dragging) classes.push("drag-source");

                          return (
                            <button
                              key={`tableau-${col}-${idx}`}
                              type="button"
                              onClick={() => {
                                if (!card.faceUp) return;
                                if (solitaireSelection && !selected) {
                                  onSolitaireMoveToTableau(col);
                                  return;
                                }
                                if (!selectable) {
                                  setSolitaireMessage(t("solitaireInvalidMove"));
                                  return;
                                }
                                onSolitaireSelectTableau(col, idx);
                              }}
                              onDoubleClick={() => {
                                if (!card.faceUp || isSolitaireOver) return;
                                const ref: SolitaireSelection = { from: "tableau", col, index: idx };
                                if (!tryAutoPlaceSolitaire(ref)) {
                                  setSolitaireMessage(t("solitaireInvalidMove"));
                                }
                              }}
                              draggable={Boolean(gameStarted.solitaire && card.faceUp && selectable && !isSolitaireOver)}
                              onDragStart={(e) => onSolitaireDragStart(e, { from: "tableau", col, index: idx })}
                              onDragEnd={onSolitaireDragEnd}
                              onDragOver={(e) => onSolitaireDragOverTableau(e, col)}
                              onDrop={(e) => onSolitaireDropToTableau(e, col)}
                              className={classes.join(" ")}
                              style={{ marginTop: idx === 0 ? "0" : card.faceUp ? "var(--solitaire-overlap-face)" : "var(--solitaire-overlap-back)", zIndex: idx + 1 }}
                            >
                              {card.faceUp ? solitaireCardLabel(card) : ""}
                            </button>
                          );
                        })
                      )}
                    </div>
                  ))}
                </div>

                {solitaireFoundationFlights.length > 0 ? (
                  <div className="solitaire-flight-layer" aria-hidden="true">
                    {solitaireFoundationFlights.map((flight) => (
                      <span
                        key={flight.id}
                        className={`solitaire-flight-card ${flight.red ? "red" : ""} ${flight.phase === "end" ? "is-end" : ""}`}
                        style={{
                          left: `${flight.phase === "end" ? flight.endX : flight.startX}%`,
                          top: `${flight.phase === "end" ? flight.endY : flight.startY}%`,
                          transitionDuration: `${flight.durationMs}ms`,
                          transitionDelay: `${flight.delayMs}ms`,
                        }}
                      >
                        {flight.label}
                      </span>
                    ))}
                  </div>
                ) : null}

                {solitairePartyPieces.length > 0 ? (
                  <div className="solitaire-party-layer" aria-hidden="true">
                    <div className="solitaire-party-burst">CLEAR!</div>
                    {solitairePartyPieces.map((piece) => (
                      <span
                        key={piece.id}
                        className="solitaire-party-piece"
                        style={{
                          left: `${piece.left}%`,
                          background: piece.color,
                          width: `${piece.size}px`,
                          height: `${Math.max(4, piece.size * 0.55)}px`,
                          animationDelay: `${piece.delay}s`,
                          animationDuration: `${piece.duration}s`,
                          ["--party-drift" as string]: `${piece.drift}vw`,
                          ["--party-spin" as string]: `${piece.spin}deg`,
                        }}
                      />
                    ))}
                  </div>
                ) : null}
              </div>

              </fieldset>
            </article>

            
          </section>
        ) : null}

        {activePanel === "survivors" ? (
          <section className="grid gap-5">
            <article className="mx-auto w-full max-w-[110rem] rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("survivorsTitle")}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startPanelGame("survivors", resetSurvivors)}
                    disabled={isPanelStartCounting("survivors")}
                    className="rounded-md bg-cyan-400 px-3 py-1 text-sm font-semibold text-slate-950"
                  >
                    {startButtonLabel("survivors")}
                  </button>
                  <button
                    type="button"
                    onClick={() => runWithResetGuard("survivors", resetSurvivors)}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("survivorsReset")}
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToMenuClick}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("backToMenu")}
                  </button>
                </div>
              </div>

              {!gameStarted.survivors ? <p className="mt-2 text-xs text-amber-200">{t("gameStartPrompt")}</p> : null}
              <fieldset disabled={!gameStarted.survivors} className={!gameStarted.survivors ? "mt-2 pointer-events-none opacity-60" : "mt-2"}>

              <p className="text-sm text-slate-300">{survivorsMessage}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <span className="rounded border border-slate-400/40 px-2 py-1">{tf("survivorsWave", { wave: survivorsWave })}</span>
                <span className="rounded border border-slate-400/40 px-2 py-1">{tf("survivorsHp", { hp: survivorsHp, max: survivorsMaxHp })}</span>
                <span className="rounded border border-slate-400/40 px-2 py-1">{tf("survivorsLevel", { level: survivorsLevel })}</span>
                <span className="rounded border border-slate-400/40 px-2 py-1">{tf("survivorsTime", { sec: survivorsTimeSec })}</span>
                <span className="rounded border border-slate-400/40 px-2 py-1">{tf("survivorsKills", { count: survivorsKills })}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onSurvivorsApplyScore}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {t("survivorsApplyScore")}
                </button>
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

              </fieldset>
            </article>

            
          </section>
        ) : null}

        {activePanel === "uno" ? (
          <section className="grid gap-5">
            <article className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-300/20 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t("unoTitle")}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startPanelGame("uno", resetUno)}
                    disabled={isPanelStartCounting("uno")}
                    className="rounded-md bg-cyan-400 px-3 py-1 text-sm font-semibold text-slate-950"
                  >
                    {startButtonLabel("uno")}
                  </button>
                  <button
                    type="button"
                    onClick={() => runWithResetGuard("uno", resetUno)}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("unoReset")}
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToMenuClick}
                    className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                  >
                    {t("backToMenu")}
                  </button>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-slate-300">CPU人数:</span>
                <select
                  value={String(unoCpuCount)}
                  onChange={(event) => setUnoCpuCount(Math.max(1, Math.min(7, Number(event.target.value))))}
                  disabled={gameStarted.uno || Boolean(connectedRoomCode)}
                  className="rounded border border-cyan-200/40 bg-slate-950/70 px-2 py-1 disabled:opacity-60"
                >
                  <option value="1">1 (2人戦)</option>
                  <option value="2">2 (3人戦)</option>
                  <option value="3">3 (4人戦)</option>
                  <option value="4">4 (5人戦)</option>
                  <option value="5">5 (6人戦)</option>
                  <option value="6">6 (7人戦)</option>
                  <option value="7">7 (8人戦)</option>
                </select>
                {connectedRoomCode ? <span className="text-xs text-slate-400">ルーム対戦中は固定</span> : null}
              </div>

              {connectedRoomCode ? (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-slate-300">ルームCPU人数:</span>
                  <select
                    value={String(unoRoomCpuCount)}
                    onChange={(event) => setUnoRoomCpuCount(Math.max(0, Math.min(6, Number(event.target.value))))}
                    disabled={gameStarted.uno || roomRole !== "host"}
                    className="rounded border border-cyan-200/40 bg-slate-950/70 px-2 py-1 disabled:opacity-60"
                  >
                    <option value="0">0 (2人戦)</option>
                    <option value="1">1 (3人戦)</option>
                    <option value="2">2 (4人戦)</option>
                    <option value="3">3 (5人戦)</option>
                    <option value="4">4 (6人戦)</option>
                    <option value="5">5 (7人戦)</option>
                    <option value="6">6 (8人戦)</option>
                  </select>
                  <span className="text-xs text-slate-400">{roomRole === "host" ? "開始前のみ変更可能" : "ホストが設定"}</span>
                </div>
              ) : null}

              {!gameStarted.uno ? <p className="mt-2 text-xs text-amber-200">{t("gameStartPrompt")}</p> : (
              <fieldset className="mt-2">

              <p className="text-sm text-slate-300">{unoMessage}</p>
              {connectedRoomCode ? <p className="mt-1 text-xs text-cyan-200">{roomTurnText(canOperateUnoNow)}</p> : null}

              {canOperateUnoNow && !isUnoOver && unoActivationState.requiresRuleChoice ? (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                  <span>{t("unoChooseMatchRule")}</span>
                  <button
                    type="button"
                    onClick={() => setUnoActivationFilter("color")}
                    disabled={!unoActivationState.canChooseColor}
                    className={`rounded border px-2 py-1 ${unoActivationFilter === "color" ? "border-cyan-200 bg-cyan-400/20 text-cyan-100" : "border-slate-400/40"}`}
                  >
                    {t("unoMatchByColor")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnoActivationFilter("number")}
                    disabled={!unoActivationState.canChooseNumber}
                    className={`rounded border px-2 py-1 ${unoActivationFilter === "number" ? "border-cyan-200 bg-cyan-400/20 text-cyan-100" : "border-slate-400/40"}`}
                  >
                    {t("unoMatchByNumber")}
                  </button>
                  {unoActivationFilter ? (
                    <button
                      type="button"
                      onClick={() => setUnoActivationFilter(null)}
                      className="rounded border border-slate-400/40 px-2 py-1"
                    >
                      {t("unoMatchRuleReset")}
                    </button>
                  ) : null}
                </div>
              ) : null}

              {isUnoTableMode ? (
                <div className="mt-4 rounded-lg border border-slate-500/30 bg-slate-950/40 p-4">
                  <div className="relative min-h-[560px] rounded-xl border border-cyan-300/30 bg-slate-900/70">
                    <div className="pointer-events-none absolute inset-4 rounded-[999px] border border-cyan-300/20 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.16)_0%,rgba(8,47,73,0.22)_48%,rgba(2,6,23,0.08)_100%)]" />
                    <div className="absolute inset-0 grid place-items-center px-4">
                      <div className="grid place-items-center rounded-xl border border-cyan-300/35 bg-slate-900/70 p-4">
                        <p className="text-xs font-semibold tracking-wide text-cyan-200">{t("unoTopCard")}</p>
                        <div className="mt-2 grid min-h-[120px] w-full max-w-[220px] place-items-center rounded-lg border-2 border-dashed border-cyan-300/45 bg-cyan-400/5 p-3">
                          {unoTopCard ? renderUnoCardFace(unoTopCard) : <span className="text-sm text-slate-400">-</span>}
                        </div>
                      </div>
                    </div>

                    {(isUnoRoomTableMode
                      ? unoRoomSeatLayout.map((seat, idx) => ({
                        hand: Array.from({ length: seat.handCount ?? 1 }),
                        cpuIdx: idx,
                        x: seat.x,
                        y: seat.y,
                        orientation: seat.orientation,
                        label: seat.label,
                        isTurnSeat: false,
                        explicitCount: seat.handCount,
                      }))
                      : unoCpuSeatLayout.map(({ hand, cpuIdx, x, y, orientation }) => ({
                        hand,
                        cpuIdx,
                        x,
                        y,
                        orientation,
                        label: `CPU ${cpuIdx + 1}`,
                        isTurnSeat: unoLocalTurnIndex === cpuIdx + 1,
                        explicitCount: hand.length,
                      }))
                    ).map(({ hand, cpuIdx, x, y, orientation, label, isTurnSeat, explicitCount }) => {
                      const seatIndex = cpuIdx + 1;
                      const isSideSeat = orientation !== "top";
                      const compactTable = isUnoRoomTableMode || unoLocalTotalPlayers >= 5;
                      const denseTable = compactTable;
                      const ultraDenseTable = isUnoRoomTableMode || unoLocalTotalPlayers >= 7;
                      const visibleCount = isUnoRoomTableMode
                        ? 1
                        : compactTable
                        ? Math.min(hand.length, 1)
                        : ultraDenseTable
                        ? (isSideSeat ? Math.min(hand.length, 2) : Math.min(hand.length, 3))
                        : denseTable
                          ? (isSideSeat ? Math.min(hand.length, 3) : Math.min(hand.length, 4))
                        : (isSideSeat ? Math.min(hand.length, 4) : Math.min(hand.length, 5));
                      const displayCount = explicitCount === null ? "?" : String(explicitCount ?? hand.length);
                      const hiddenCount = explicitCount === null ? 0 : Math.max(0, explicitCount - visibleCount);
                      const seatWidth = orientation === "top"
                        ? (ultraDenseTable ? "min(42vw, 280px)" : denseTable ? "min(50vw, 330px)" : "min(62vw, 420px)")
                        : (ultraDenseTable ? "110px" : denseTable ? "130px" : "170px");
                      const seatStyle = {
                        left: `${x.toFixed(2)}%`,
                        top: `${y.toFixed(2)}%`,
                        transform: "translate(-50%, -50%)",
                        width: seatWidth,
                        zIndex: 10 + cpuIdx,
                      };
                      return (
                        <div key={`uno-table-cpu-${cpuIdx}`} className="absolute" style={seatStyle}>
                          <div className={`rounded-lg border px-2 py-1 ${isTurnSeat ? "border-cyan-200/70 bg-cyan-400/12" : "border-slate-400/35 bg-slate-900/45"}`}>
                            <p className={`text-center font-semibold text-slate-200 ${ultraDenseTable ? "text-[11px]" : "text-xs"}`}>{label}: {displayCount}</p>
                          </div>
                          {isSideSeat ? (
                            <div className={`mt-1 flex justify-center overflow-y-auto pb-1 ${ultraDenseTable ? "max-h-[165px]" : "max-h-[210px]"}`}>
                              <div className="flex flex-col items-center pt-1">
                                {Array.from({ length: visibleCount }).map((_, cardIndex) => (
                                  <span
                                    key={`uno-table-cpu-side-${cpuIdx}-${cardIndex}`}
                                    className="inline-flex"
                                    style={{
                                      marginTop: cardIndex === 0 ? 0 : ultraDenseTable ? -16 : denseTable ? -20 : -26,
                                      transform: `rotate(${orientation === "left" ? "-90deg" : "90deg"}) translateY(${Math.max(0, 7 - cardIndex * 0.4).toFixed(2)}px) scale(${ultraDenseTable ? 0.72 : denseTable ? 0.82 : 1})`,
                                      transformOrigin: "center",
                                      zIndex: cardIndex + 1,
                                    }}
                                  >
                                    {renderUnoCardBack()}
                                  </span>
                                ))}
                                {hiddenCount > 0 ? <p className={`mt-1 text-center font-semibold text-cyan-200/90 ${ultraDenseTable ? "text-[10px]" : "text-[11px]"}`}>+{hiddenCount}</p> : null}
                              </div>
                            </div>
                          ) : (
                            <div className="mt-1 overflow-x-auto pb-1">
                              <div className={`relative left-1/2 flex w-max -translate-x-1/2 items-end pr-2 pl-1 ${ultraDenseTable ? "min-h-[56px]" : "min-h-[70px]"}`}>
                                {Array.from({ length: visibleCount }).map((_, cardIndex) => (
                                  (() => {
                                    const topStack = opponentHandStackStyle(cardIndex, visibleCount);
                                    return (
                                      <span
                                        key={`uno-table-cpu-top-${cpuIdx}-${cardIndex}`}
                                        className="inline-flex shrink-0"
                                        style={{
                                          ...topStack,
                                          transform: `${String(topStack.transform)} scale(${ultraDenseTable ? 0.72 : denseTable ? 0.82 : 1})`,
                                        }}
                                      >
                                        {renderUnoCardBack()}
                                      </span>
                                    );
                                  })()
                                ))}
                              </div>
                              {hiddenCount > 0 ? <p className={`mt-1 text-center font-semibold text-cyan-200/90 ${ultraDenseTable ? "text-[10px]" : "text-[11px]"}`}>+{hiddenCount}</p> : null}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div className="absolute bottom-3 left-1/2 z-10 w-[88%] max-w-[760px] -translate-x-1/2">
                      <p className={`text-center text-sm font-semibold ${unoLocalTurnIndex === 0 ? "text-cyan-200" : "text-slate-100"}`}>{t("unoYourHand")}</p>
                      <div className="mt-1 overflow-x-auto pb-1">
                        <div className="relative left-1/2 flex w-max -translate-x-1/2 items-end px-2">
                          {unoVisibleHand.map((card, index) => {
                            const playable = unoTopCard ? canPlayCard(card, unoTopCard) : true;
                            const lockedByRuleChoice = unoActivationState.requiresRuleChoice && !unoActivationFilter;
                            const cardActive = playable && !lockedByRuleChoice && unoActivationState.activeIndices.has(index);
                            return (
                              <span
                                key={`${card.color}-${card.value}-${index}`}
                                className="inline-flex shrink-0"
                                style={playerHandFanStyle(index, unoVisibleHand.length, { overlap: 13, spread: 2.4, maxRotate: 13, centerLift: 0.65, centerOffset: 0.85 })}
                              >
                                <button
                                  type="button"
                                  onClick={() => playUnoCard(index, { side: unoLocalSide })}
                                  disabled={!canOperateUnoNow || isUnoOver || !cardActive}
                                  className={`origin-bottom rounded-md border p-1.5 text-sm transition-transform duration-150 hover:-translate-y-2 focus-visible:-translate-y-2 ${cardActive ? "border-cyan-300/70 bg-cyan-400/20" : playable ? "border-amber-300/50 bg-amber-400/10" : "border-slate-400/30 bg-slate-800/40"}`}
                                >
                                  <span className="inline-flex items-center">
                                    {renderUnoCardFace(card)}
                                  </span>
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-4 grid gap-3 rounded-lg border border-slate-500/30 bg-slate-950/40 p-4">
                    {connectedRoomCode ? (
                      <>
                        <p className="text-sm">{t("unoCpuHand")}: {unoLocalSide === "player" ? unoCpuHand.length : unoPlayerHand.length}</p>
                        <div className="overflow-x-auto pb-1">
                          <div className="relative left-1/2 flex min-h-[78px] w-max -translate-x-1/2 items-end pr-2 pl-1">
                            {Array.from({ length: unoLocalSide === "player" ? unoCpuHand.length : unoPlayerHand.length }).map((_, index) => (
                              <span
                                key={`uno-opponent-back-${index}`}
                                className="inline-flex shrink-0"
                                style={opponentHandStackStyle(index, unoLocalSide === "player" ? unoCpuHand.length : unoPlayerHand.length)}
                              >
                                {renderUnoCardBack()}
                              </span>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="grid gap-2">
                        {unoLocalCpuHands.map((hand, cpuIdx) => (
                          <div key={`uno-cpu-hand-${cpuIdx}`} className="grid gap-1">
                            <p className="text-sm">CPU {cpuIdx + 1}手札: {hand.length}</p>
                            <div className="overflow-x-auto pb-1">
                              <div className="relative left-1/2 flex min-h-[70px] w-max -translate-x-1/2 items-end pr-2 pl-1">
                                {Array.from({ length: hand.length }).map((_, cardIndex) => (
                                  <span
                                    key={`uno-opponent-${cpuIdx}-back-${cardIndex}`}
                                    className="inline-flex shrink-0"
                                    style={opponentHandStackStyle(cardIndex, hand.length)}
                                  >
                                    {renderUnoCardBack()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid place-items-center rounded-xl border border-cyan-300/35 bg-slate-900/70 p-4">
                      <p className="text-xs font-semibold tracking-wide text-cyan-200">{t("unoTopCard")}</p>
                      <div className="mt-2 grid min-h-[120px] w-full max-w-[220px] place-items-center rounded-lg border-2 border-dashed border-cyan-300/45 bg-cyan-400/5 p-3">
                        {unoTopCard ? renderUnoCardFace(unoTopCard) : <span className="text-sm text-slate-400">-</span>}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-semibold">{t("unoYourHand")}</p>
                    <div className="mt-2 overflow-x-auto pb-2">
                      <div className="relative left-1/2 flex w-max -translate-x-1/2 items-end px-2">
                        {unoVisibleHand.map((card, index) => {
                          const playable = unoTopCard ? canPlayCard(card, unoTopCard) : true;
                          const lockedByRuleChoice = unoActivationState.requiresRuleChoice && !unoActivationFilter;
                          const cardActive = playable && !lockedByRuleChoice && unoActivationState.activeIndices.has(index);
                          return (
                            <span
                              key={`${card.color}-${card.value}-${index}`}
                              className="inline-flex shrink-0"
                              style={playerHandFanStyle(index, unoVisibleHand.length, { overlap: 13, spread: 2.4, maxRotate: 13, centerLift: 0.65, centerOffset: 0.85 })}
                            >
                              <button
                                type="button"
                                onClick={() => playUnoCard(index, { side: unoLocalSide })}
                                disabled={!canOperateUnoNow || isUnoOver || !cardActive}
                                className={`origin-bottom rounded-md border p-1.5 text-sm transition-transform duration-150 hover:-translate-y-2 focus-visible:-translate-y-2 ${cardActive ? "border-cyan-300/70 bg-cyan-400/20" : playable ? "border-amber-300/50 bg-amber-400/10" : "border-slate-400/30 bg-slate-800/40"}`}
                              >
                                <span className="inline-flex items-center">
                                  {renderUnoCardFace(card)}
                                </span>
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => drawUnoForPlayer({ side: unoLocalSide })}
                  disabled={!canOperateUnoNow || isUnoOver}
                  className="rounded-md border border-cyan-200/40 px-3 py-1"
                >
                  {t("unoDrawCard")}
                </button>
              </div>
              </fieldset>
              )}
            </article>

            
          </section>
        ) : null}
      </div>
    </main>
  );
}





