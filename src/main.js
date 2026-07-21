import "./styles/main.css";
import { initGame as initOthello } from "./scripts/game.js";
import { initShogi } from "./scripts/shogi.js";
import { initChess } from "./scripts/chess.js";
import { initUno } from "./scripts/uno.js";
import { initGomoku } from "./scripts/gomoku.js";
import { initSurvivors } from "./scripts/survivors.js";
import { initFitPuzzle } from "./scripts/fitPuzzle.js";
import { initSolitaire } from "./scripts/solitaire.js";
import { createRoomTransport, resolveRoomServerUrl } from "./scripts/roomTransport.js";
import { cloudApiRequest } from "./scripts/cloudApiClient.js";

const STORAGE_LANG_KEY = "neon-arcade-lang";
const STORAGE_CLOUD_USER_ID_KEY = "neon-cloud-user-id";
const STORAGE_CLOUD_PASSWORD_KEY = "neon-cloud-password";
const STORAGE_PLAYER_NAME_KEY = "neon-player-name";
const STORAGE_ROOM_SERVER_URL_KEY = "neon-room-server-url";
const ROOM_SERVER_QUERY_PARAM_KEY = "roomServer";
const DEFAULT_ROOM_SERVER_URL = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.hostname || "localhost"}:8788`;
const APP_URL_TAG = "ToufuGameshow";

const entryScreen = document.getElementById("entryScreen");
const menuScreen = document.getElementById("menuScreen");
const lobbyScreen = document.getElementById("lobbyScreen");
const othelloScreen = document.getElementById("othelloScreen");
const shogiScreen = document.getElementById("shogiScreen");
const chessScreen = document.getElementById("chessScreen");
const unoScreen = document.getElementById("unoScreen");
const gomokuScreen = document.getElementById("gomokuScreen");
const survivorsScreen = document.getElementById("survivorsScreen");
const fitPuzzleScreen = document.getElementById("fitPuzzleScreen");
const solitaireScreen = document.getElementById("solitaireScreen");

const playOthelloBtn = document.getElementById("playOthelloBtn");
const playShogiBtn = document.getElementById("playShogiBtn");
const playChessBtn = document.getElementById("playChessBtn");
const playUnoBtn = document.getElementById("playUnoBtn");
const playGomokuBtn = document.getElementById("playGomokuBtn");
const playSurvivorsBtn = document.getElementById("playSurvivorsBtn");
const playFitPuzzleBtn = document.getElementById("playFitPuzzleBtn");
const playSolitaireSingleBtn = document.getElementById("playSolitaireSingleBtn");
const playSolitaireMultiBtn = document.getElementById("playSolitaireMultiBtn");
const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const roomCodeInput = document.getElementById("roomCodeInput");
const playerNameInput = document.getElementById("playerNameInput");
const entryCloudUserIdInput = document.getElementById("entryCloudUserIdInput");
const entryCloudPasswordInput = document.getElementById("entryCloudPasswordInput");
const entryLoginBtn = document.getElementById("entryLoginBtn");
const entryGuestBtn = document.getElementById("entryGuestBtn");
const entryMessage = document.getElementById("entryMessage");
const cloudUserIdInput = document.getElementById("cloudUserIdInput");
const cloudPasswordInput = document.getElementById("cloudPasswordInput");
const saveCloudAuthBtn = document.getElementById("saveCloudAuthBtn");
const backToEntryBtn = document.getElementById("backToEntryBtn");
const roomMenuMessage = document.getElementById("roomMenuMessage");

const lobbyRoomCodeText = document.getElementById("lobbyRoomCodeText");
const lobbyRoleText = document.getElementById("lobbyRoleText");
const lobbySelfNameText = document.getElementById("lobbySelfNameText");
const lobbyPeerNameText = document.getElementById("lobbyPeerNameText");
const lobbyParticipantsText = document.getElementById("lobbyParticipantsText");
const lobbyPeerText = document.getElementById("lobbyPeerText");
const lobbyMessage = document.getElementById("lobbyMessage");
const lobbyStartOthelloBtn = document.getElementById("lobbyStartOthelloBtn");
const lobbyStartShogiBtn = document.getElementById("lobbyStartShogiBtn");
const lobbyStartChessBtn = document.getElementById("lobbyStartChessBtn");
const lobbyStartUnoBtn = document.getElementById("lobbyStartUnoBtn");
const lobbyStartGomokuBtn = document.getElementById("lobbyStartGomokuBtn");
const lobbyStartSurvivorsBtn = document.getElementById("lobbyStartSurvivorsBtn");
const lobbyStartSolitaireBtn = document.getElementById("lobbyStartSolitaireBtn");
const lobbyBackBtn = document.getElementById("lobbyBackBtn");

const lobbyStartConfigs = [
  { gameKey: "othello", button: lobbyStartOthelloBtn, labelKey: "othelloStart" },
  { gameKey: "shogi", button: lobbyStartShogiBtn, labelKey: "shogiStart" },
  { gameKey: "chess", button: lobbyStartChessBtn, labelKey: "chessStart" },
  { gameKey: "uno", button: lobbyStartUnoBtn, labelKey: "unoStart" },
  { gameKey: "gomoku", button: lobbyStartGomokuBtn, labelKey: "gomokuStart" },
  { gameKey: "survivors", button: lobbyStartSurvivorsBtn, labelKey: "survivorsStart" },
  { gameKey: "solitaire", button: lobbyStartSolitaireBtn, labelKey: "solitaireStart" },
];

const roomStatus = document.getElementById("roomStatus");
const roomCodeText = document.getElementById("roomCodeText");
const roomRoleText = document.getElementById("roomRoleText");
const langSelect = document.getElementById("langSelect");
const roomChatPanel = document.getElementById("roomChatPanel");
const roomChatTitle = document.getElementById("roomChatTitle");
const roomChatLog = document.getElementById("roomChatLog");
const roomChatGroupSelect = document.getElementById("roomChatGroupSelect");
const roomChatGroupNameInput = document.getElementById("roomChatGroupNameInput");
const roomChatGroupCreateBtn = document.getElementById("roomChatGroupCreateBtn");
const roomChatGroupInfo = document.getElementById("roomChatGroupInfo");
const roomChatSearchDateInput = document.getElementById("roomChatSearchDate");
const roomChatSearchWordInput = document.getElementById("roomChatSearchWord");
const roomChatSearchClearBtn = document.getElementById("roomChatSearchClearBtn");
const roomChatSearchStatus = document.getElementById("roomChatSearchStatus");
const roomHostMutePanel = document.getElementById("roomHostMutePanel");
const roomHostMuteTitle = document.getElementById("roomHostMuteTitle");
const roomHostMuteList = document.getElementById("roomHostMuteList");
const roomChatInput = document.getElementById("roomChatInput");
const roomChatSendBtn = document.getElementById("roomChatSendBtn");
const roomChatClearBtn = document.getElementById("roomChatClearBtn");

const messages = {
  ja: {
    entryTitle: "セッション開始",
    entrySubtitle: "ログインして進行データを共有するか、ゲストとして今すぐ遊べます。",
    loginAndPlay: "ログインして遊ぶ",
    playAsGuest: "ゲストで遊ぶ",
    entryGuestSelected: "ゲストモードで開始しました",
    loginConfirmPrompt: "ログインします。よろしいですか？",
    loginCanceled: "ログインをキャンセルしました",
    guestConfirmPrompt: "セーブデータが保存されません。よろしいですか？",
    guestCanceled: "ゲスト開始をキャンセルしました",
    menuSubtitle: "遊びたいゲームを選択してください",
    roomCardTitle: "ルーム対戦",
    roomCardDesc: "ルーム番号で集合してからゲームを選択。",
    othelloCardDesc: "CPU対戦対応のオセロ。相手の石をはさんで自分の色にし、最後に石が多い方が勝ち。",
    shogiCardDesc: "2人対戦の将棋。駒を動かして相手の王を詰ませたら勝ち。取った駒は自分の持ち駒として使えます。",
    chessCardDesc: "2人対戦のチェス。ルーム対戦にも対応。",
    unoCardDesc: "ローカル2人で遊べるUNO。手札を先に出し切ったプレイヤーの勝ち。",
    gomokuCardDesc: "五目並べ。先に5つ石を並べたプレイヤーの勝ち。",
    survivorsCardDesc: "2Dサバイバルアクション。移動しながら自動攻撃で敵の波をさばく。",
    fitPuzzleCardDesc: "ピースを枠内に収めるパズル。すべてのマスを埋めればクリア。",
    solitaireCardDesc: "定番のクロンダイク。AからKまで4組そろえるとクリア。",
    shogiDetailSummary: "詳細",
    shogiDetailTitle: "駒の名称と強さ（目安）",
    shogiPieceKing: "王: 最重要（取られたら負け）",
    shogiPieceRook: "飛車: 非常に強い（縦横に長く動ける）",
    shogiPieceBishop: "角行: 非常に強い（斜めに長く動ける）",
    shogiPieceGold: "金将: 強い（前後左右と前斜め）",
    shogiPieceSilver: "銀将: 中くらい（斜め中心に動く）",
    shogiPieceKnight: "桂馬: やや特殊（前に跳ぶ）",
    shogiPieceLance: "香車: 直線特化（前にまっすぐ）",
    shogiPiecePawn: "歩兵: 基本駒（1マス前進）",
    lobbyTitle: "Room Lobby",
    lobbySubtitle: "ルームに全員が集まったらゲームを選択します",
    othelloSubtitle: "CPU対戦・CPU同士対戦・ローカル2人対戦を選べます。",
    shogiSubtitle: "先手後手で交互に指します。王を取れば勝ち。",
    chessSubtitle: "白黒で交互に指します。キングを詰ませた側の勝ち。",
    unoSubtitle: "CPU対戦またはローカル2人対戦。手札を先に出し切ったら勝ち。",
    gomokuSubtitle: "黒白で交互に置き、先に5連を作った側の勝ち。",
    survivorsSubtitle: "WASD / 矢印キーで移動。自動攻撃で生き残れ。",
    fitPuzzleSubtitle: "ピースを選んで枠内に配置し、すべて埋めるとクリア。",
    solitaireSubtitle: "ストックからめくって並べ替え、4つの土台を完成させよう。",
    unoModeCpu: "1P 対 CPU",
    unoModeLocal: "ローカル2人",
    createRoom: "ルーム作成",
    join: "参加",
    play: "プレイ",
    backToMenu: "メニューへ戻る",
    othelloStart: "オセロ開始",
    shogiStart: "将棋開始",
    chessStart: "チェス開始",
    unoStart: "UNO開始",
    gomokuStart: "五目並べ開始",
    survivorsStart: "サバイバー開始",
    solitaireStart: "ソリティア開始",
    bankGacha: "スキンガチャ",
    bankGacha10: "スキンガチャ x10",
    singlePlay: "シングル",
    multiPlay: "マルチ",
    newGame: "ゲーム開始",
    remake: "リメイク",
    menu: "メニュー",
    newMatch: "ゲーム開始",
    menuJa: "メニュー",
    rotate: "回転",
    reset: "リセット",
    resetEn: "RESET",
    playerNamePlaceholder: "あなたの名前",
    cloudUserPlaceholder: "クラウドID",
    cloudPassPlaceholder: "クラウドパスワード",
    saveCloudAuth: "クラウド認証を保存",
    backToLogin: "ログイン画面に戻る",
    confirmBackToLogin: "ログイン画面に戻ります。よろしいですか？",
    cloudAuthSaved: "クラウド認証情報を保存しました",
    cloudAuthInvalid: "クラウドID/パスワードを入力してください",
    cloudIdDuplicateWarn: "このIDは既に使用されています。別のIDか、正しいパスワードを入力してください",
    cloudCheckFailed: "クラウド確認に失敗しました。サーバー起動後にもう一度お試しください",
    roomCodePlaceholder: "6桁の番号",
    roomWaiting: "参加者待機中",
    roomConnected: "相手が参加しました",
    roomWaitingCount: "参加者 {count} / 8",
    roomConnectedCount: "参加者 {count} / 8",
    roomFullRejected: "ルーム {code} は満員です（8人まで）",
    menuRoomConnected: "ルーム {code} に接続しました",
    menuRoomJoined: "ルーム {code} へ参加しました",
    roomCodeInvalid: "6桁のルーム番号を入力してください",
    lobbyWaitPeer: "相手の参加を待っています...",
    lobbyJoinedWaitHost: "ルームに参加しました。ホストのゲーム選択を待っています...",
    lobbyParticipantConnected: "参加者が接続しました。ゲームを選択してください。",
    lobbyPeerLeft: "相手が退出しました。再接続を待っています...",
    lobbyRoomFull: "ルームが満員です（8人）",
    gameWaitHostStart: "ホストの開始を待っています...",
    gameWaitPeerReconnect: "相手の再接続を待っています...",
    lobbyNoPeer: "参加者がまだ接続していません。",
    roleHost: "ホスト",
    roleGuest: "ゲスト",
    labelRoom: "ルーム",
    labelRole: "役割",
    labelYou: "あなた",
    labelPeer: "相手",
    labelParticipants: "参加メンバー",
    labelStatus: "状態",
    gameSelectTitle: "ゲーム選択",
    unsupportedGameSelected: "相手が未対応ゲーム {game} を選択しました。この端末ではプレイできません。",
    peerDoesNotSupportGame: "参加者の端末が {game} に未対応です: {peers}",
    roomChatTitle: "ルームチャット",
    roomChatGroupAll: "全体",
    roomChatGroupNamePlaceholder: "新規グループ名",
    roomChatGroupCreate: "作成",
    roomChatGroupInfo: "表示グループ: {group} / 参加 {count}人",
    roomChatGroupCreateEmpty: "グループ名を入力してください",
    roomChatGroupCreateExists: "同じ名前のグループが既にあります",
    roomChatSearchWordPlaceholder: "ワード検索",
    roomChatSearchDateAria: "日付で検索",
    roomChatSearchClear: "条件クリア",
    roomChatFilterStatus: "表示 {shown} / {total}",
    roomChatNoMatch: "検索条件に一致するメッセージはありません",
    roomChatHostMutePanelTitle: "ホストミュート中",
    roomChatHostMutePanelEmpty: "現在ミュート中の相手はいません",
    roomChatHostMutePanelItem: "{name} (残り {seconds} 秒)",
    roomChatInputPlaceholder: "メッセージを入力",
    roomChatSend: "送信",
    roomChatClear: "入力クリア",
    roomChatEmpty: "まだメッセージはありません",
    roomChatRateLimitedFast: "送信が速すぎます。少し待ってから送信してください",
    roomChatRateLimitedBurst: "短時間に送信しすぎです。少し待ってください",
    roomChatRateLimitedDuplicate: "同じ内容の連投はできません",
    roomChatIncomingSuppressed: "{name} からの連投を自動抑制しました",
    roomChatMuted: "{name} をミュートしました",
    roomChatUnmuted: "{name} のミュートを解除しました",
    roomChatMuteEmpty: "ミュートする名前を指定してください（例: /mute 太郎）",
    roomChatUnmuteEmpty: "解除する名前を指定してください（例: /unmute 太郎）",
    roomChatMuteList: "ミュート一覧: {names}",
    roomChatMuteListEmpty: "ミュート中の相手はいません",
    roomChatDmUsage: "DM送信: /dm 名前 メッセージ",
    roomChatDmTargetNotFound: "DM相手が見つかりません: {name}",
    roomChatDmSent: "{name} とのDMを開始しました",
    roomChatDmClearUsage: "DM削除: /dmclear 名前 または /dmclear all",
    roomChatDmCleared: "{name} とのDM履歴を削除しました",
    roomChatDmClearedAll: "すべてのDM履歴を削除しました",
    roomChatEditUsage: "修正: /editlast 新しいメッセージ",
    roomChatEditNoTarget: "修正できる自分の最新メッセージがありません",
    roomChatEditWindowExpired: "編集/取り消し可能な時間（30秒）を過ぎています",
    roomChatEditedLabel: "編集済み",
    roomChatRetractNoTarget: "取り消せる自分の最新メッセージがありません",
    roomChatRetractedLabel: "このメッセージは取り消されました",
    roomChatRetractCooldown: "送信取り消しは連続で使用できません。しばらく待ってください",
    roomChatServerMuted: "現在ミュート中のため送信できません（解除まで {seconds} 秒）",
    roomChatServerRateLimitFast: "サーバー: 送信が速すぎます。少し待ってください",
    roomChatServerRateLimitBurst: "サーバー: 送信回数が上限を超えました。少し待ってください",
    roomChatServerRateLimitDuplicate: "サーバー: 同じ内容の連投はできません",
    roomChatServerWindowExpired: "サーバー: 編集/取り消し時間を過ぎています",
    roomChatServerMessageNotFound: "サーバー: 対象メッセージが見つかりません",
    roomChatServerNotOwned: "サーバー: 自分のメッセージのみ編集/取り消しできます",
    roomChatServerHostOnly: "この操作はホストのみ実行できます",
    roomChatServerTargetRequired: "対象ユーザーを指定してください",
    roomChatServerReportSelfForbidden: "自分のメッセージは通報できません",
    roomChatServerUnknownError: "サーバーエラー: {code}",
    roomChatHostMuteUsage: "ホストミュート: /hostmute 名前 [秒]",
    roomChatHostUnmuteUsage: "ホストミュート解除: /hostunmute 名前",
    roomChatReportLastNoTarget: "通報できる対象メッセージが見つかりません",
    roomChatReportPrompt: "通報理由（任意・60文字以内）",
    roomChatReportSent: "通報を送信しました",
    roomChatHostMutesEmpty: "ホストミュート中の相手はいません",
    roomChatHostMutesList: "ホストミュート一覧: {list}",
    roomChatHostMutedNotice: "{name} がホストによりミュートされました",
    roomChatHostUnmutedNotice: "{name} のホストミュートが解除されました",
    roomChatAutoMutedNotice: "{name} は通報により一時ミュートされました",
    roomChatActionEdit: "修正",
    roomChatActionRetract: "取消",
    roomChatActionReport: "通報",
    roomChatActionHostMute: "ホストミュート",
    roomChatActionHostUnmute: "解除",
    roomChatUnknownCommand: "未対応コマンドです（/help /mute /unmute /mutes /dm /dmclear /editlast /retractlast /reportlast /hostmute /hostunmute /hostmutes）",
    roomChatHelpSummary: "コマンドヘルプ",
    roomChatHelpLine1: "/help または /commands: ヘルプ表示",
    roomChatHelpLine2: "/mute 名前: 相手をミュート",
    roomChatHelpLine3: "/unmute 名前: ミュート解除",
    roomChatHelpLine4: "/mutes: ミュート一覧表示",
    roomChatHelpLine5: "/dm 名前 メッセージ: 1対1DM（保存期限なし）",
    roomChatHelpLine6: "/dmclear 名前|all: DM履歴削除",
    roomChatHelpLine7: "/editlast 新しいメッセージ: 直近メッセージ修正",
    roomChatHelpLine8: "/retractlast /reportlast [理由] /hostmute 名前 [秒] /hostunmute 名前 /hostmutes",
    roomChatHelpInline: "コマンド: /help, /mute 名前, /unmute 名前, /mutes, /dm 名前 メッセージ, /dmclear 名前|all, /editlast 新しいメッセージ, /retractlast, /reportlast [理由], /hostmute 名前 [秒], /hostunmute 名前, /hostmutes",
  },
  ko: {
    entryTitle: "Start Session",
    entrySubtitle: "로그인하여 진행 데이터를 공유하거나, 게스트로 바로 플레이할 수 있습니다.",
    loginAndPlay: "LOGIN & PLAY",
    playAsGuest: "PLAY AS GUEST",
    entryGuestSelected: "게스트 모드로 시작했습니다",
    loginConfirmPrompt: "로그인하시겠습니까?",
    loginCanceled: "로그인을 취소했습니다",
    guestConfirmPrompt: "저장 데이터가 보관되지 않습니다. 계속할까요?",
    guestCanceled: "게스트 시작을 취소했습니다",
    menuSubtitle: "플레이할 게임을 선택하세요",
    roomCardTitle: "룸 매치",
    roomCardDesc: "룸 번호로 모인 뒤 게임을 선택합니다.",
    othelloCardDesc: "CPU 대전 지원 오셀로. 상대 돌을 사이에 두어 뒤집고, 마지막에 돌이 더 많으면 승리합니다.",
    shogiCardDesc: "2인 대전 장기(쇼기). 말을 움직여 상대 왕을 막으면 승리, 잡은 말은 내 말로 사용할 수 있습니다.",
    chessCardDesc: "2인 대전 체스. 룸 대전도 지원합니다.",
    unoCardDesc: "로컬 2인 UNO. 손패를 먼저 모두 낸 플레이어가 승리합니다.",
    gomokuCardDesc: "오목. 먼저 돌 5개를 연속으로 놓는 플레이어가 승리합니다.",
    survivorsCardDesc: "2D 서바이벌 액션. 이동하며 자동 공격으로 적의 물결을 버티세요.",
    fitPuzzleCardDesc: "조각을 프레임 안에 배치하는 퍼즐. 모든 칸을 채우면 클리어.",
    solitaireCardDesc: "클론다이크 솔리테어. A부터 K까지 4세트를 완성하면 클리어.",
    shogiDetailSummary: "상세",
    shogiDetailTitle: "말 이름과 강함(대략)",
    shogiPieceKing: "왕: 최중요(잡히면 패배)",
    shogiPieceRook: "비차: 매우 강함(세로/가로 장거리)",
    shogiPieceBishop: "각행: 매우 강함(대각선 장거리)",
    shogiPieceGold: "금장: 강함(전후좌우+앞 대각)",
    shogiPieceSilver: "은장: 중간(대각 중심 이동)",
    shogiPieceKnight: "계마: 특수(앞으로 점프)",
    shogiPieceLance: "향차: 직선 특화(앞으로 직진)",
    shogiPiecePawn: "보병: 기본 말(앞으로 1칸)",
    lobbyTitle: "룸 로비",
    lobbySubtitle: "모두 모이면 호스트가 게임을 선택합니다",
    othelloSubtitle: "CPU 대전, CPU vs CPU, 로컬 2인 대전을 선택할 수 있습니다.",
    shogiSubtitle: "선수/후수가 번갈아 둡니다. 왕을 잡으면 승리합니다.",
    chessSubtitle: "백/흑이 번갈아 둡니다. 킹을 체크메이트하면 승리합니다.",
    unoSubtitle: "CPU 대전 또는 로컬 2인 대전. 손패를 먼저 비우면 승리합니다.",
    gomokuSubtitle: "흑/백이 번갈아 두고, 먼저 5목을 만들면 승리합니다.",
    survivorsSubtitle: "WASD / 방향키로 이동. 자동 공격으로 생존하세요.",
    fitPuzzleSubtitle: "조각을 선택해 프레임 안에 배치하고, 전부 채우면 클리어.",
    solitaireSubtitle: "스톡에서 카드를 넘겨 정리하고, 4개의 파운데이션을 완성하세요.",
    unoModeCpu: "1P vs CPU",
    unoModeLocal: "2P LOCAL",
    createRoom: "룸 만들기",
    join: "참가",
    play: "플레이",
    backToMenu: "메뉴로",
    othelloStart: "오셀로 시작",
    shogiStart: "쇼기 시작",
    chessStart: "체스 시작",
    unoStart: "UNO 시작",
    gomokuStart: "오목 시작",
    survivorsStart: "서바이버 시작",
    solitaireStart: "솔리테어 시작",
    bankGacha: "SKIN GACHA",
    bankGacha10: "SKIN GACHA x10",
    singlePlay: "싱글",
    multiPlay: "멀티",
    newGame: "GAME START",
    remake: "REMAKE",
    menu: "메뉴",
    newMatch: "GAME START",
    menuJa: "메뉴",
    rotate: "회전",
    reset: "리셋",
    resetEn: "RESET",
    playerNamePlaceholder: "내 이름",
    cloudUserPlaceholder: "클라우드 ID",
    cloudPassPlaceholder: "클라우드 비밀번호",
    saveCloudAuth: "클라우드 인증 저장",
    backToLogin: "로그인 화면으로",
    confirmBackToLogin: "로그인 화면으로 돌아갑니다. 계속할까요?",
    cloudAuthSaved: "클라우드 인증 정보를 저장했습니다",
    cloudAuthInvalid: "클라우드 ID/비밀번호를 입력하세요",
    cloudIdDuplicateWarn: "이 ID는 이미 사용 중입니다. 다른 ID 또는 올바른 비밀번호를 입력하세요",
    cloudCheckFailed: "클라우드 확인에 실패했습니다. 서버 실행 후 다시 시도하세요",
    roomCodePlaceholder: "6자리 번호",
    roomWaiting: "참가자 대기 중",
    roomConnected: "상대가 참가했습니다",
    roomWaitingCount: "참가자 {count} / 8",
    roomConnectedCount: "참가자 {count} / 8",
    roomFullRejected: "룸 {code} 은(는) 가득 찼습니다 (최대 8명)",
    menuRoomConnected: "룸 {code} 에 연결했습니다",
    menuRoomJoined: "룸 {code} 에 참가했습니다",
    roomCodeInvalid: "6자리 룸 번호를 입력하세요",
    lobbyWaitPeer: "상대의 참가를 기다리는 중...",
    lobbyJoinedWaitHost: "룸에 참가했습니다. 호스트의 게임 선택을 기다리는 중...",
    lobbyParticipantConnected: "참가자가 연결되었습니다. 게임을 선택하세요.",
    lobbyPeerLeft: "상대가 나갔습니다. 재접속을 기다리는 중...",
    lobbyRoomFull: "룸이 가득 찼습니다 (8명)",
    gameWaitHostStart: "호스트 시작을 기다리는 중...",
    gameWaitPeerReconnect: "상대 재접속을 기다리는 중...",
    lobbyNoPeer: "아직 참가자가 연결되지 않았습니다.",
    roleHost: "HOST",
    roleGuest: "GUEST",
    labelRoom: "ROOM",
    labelRole: "ROLE",
    labelYou: "YOU",
    labelPeer: "PEER",
    labelParticipants: "MEMBERS",
    labelStatus: "STATUS",
    gameSelectTitle: "게임 선택",
    unsupportedGameSelected: "상대가 미지원 게임 {game} 을 선택했습니다. 이 기기에서는 플레이할 수 없습니다.",
    peerDoesNotSupportGame: "참가자 단말이 {game} 을(를) 지원하지 않습니다: {peers}",
    roomChatTitle: "룸 채팅",
    roomChatGroupAll: "전체",
    roomChatGroupNamePlaceholder: "새 그룹 이름",
    roomChatGroupCreate: "생성",
    roomChatGroupInfo: "표시 그룹: {group} / 참가 {count}명",
    roomChatGroupCreateEmpty: "그룹 이름을 입력하세요",
    roomChatGroupCreateExists: "같은 이름의 그룹이 이미 있습니다",
    roomChatSearchWordPlaceholder: "단어 검색",
    roomChatSearchDateAria: "날짜로 검색",
    roomChatSearchClear: "조건 지우기",
    roomChatFilterStatus: "표시 {shown} / {total}",
    roomChatNoMatch: "검색 조건과 일치하는 메시지가 없습니다",
    roomChatHostMutePanelTitle: "호스트 음소거 중",
    roomChatHostMutePanelEmpty: "현재 음소거 중인 사용자가 없습니다",
    roomChatHostMutePanelItem: "{name} (남은 {seconds}초)",
    roomChatInputPlaceholder: "메시지를 입력",
    roomChatSend: "전송",
    roomChatClear: "입력 지우기",
    roomChatEmpty: "아직 메시지가 없습니다",
    roomChatRateLimitedFast: "전송이 너무 빠릅니다. 잠시 후 다시 시도하세요",
    roomChatRateLimitedBurst: "짧은 시간에 너무 많이 보냈습니다. 잠시 기다려 주세요",
    roomChatRateLimitedDuplicate: "같은 내용을 연속 전송할 수 없습니다",
    roomChatIncomingSuppressed: "{name}의 도배 메시지를 자동 억제했습니다",
    roomChatMuted: "{name} 님을 음소거했습니다",
    roomChatUnmuted: "{name} 님 음소거를 해제했습니다",
    roomChatMuteEmpty: "음소거할 이름을 입력하세요 (예: /mute 홍길동)",
    roomChatUnmuteEmpty: "해제할 이름을 입력하세요 (예: /unmute 홍길동)",
    roomChatMuteList: "음소거 목록: {names}",
    roomChatMuteListEmpty: "음소거 중인 상대가 없습니다",
    roomChatDmUsage: "DM 전송: /dm 이름 메시지",
    roomChatDmTargetNotFound: "DM 대상을 찾을 수 없습니다: {name}",
    roomChatDmSent: "{name} 님과 DM을 시작했습니다",
    roomChatDmClearUsage: "DM 삭제: /dmclear 이름 또는 /dmclear all",
    roomChatDmCleared: "{name} 님과의 DM 기록을 삭제했습니다",
    roomChatDmClearedAll: "모든 DM 기록을 삭제했습니다",
    roomChatEditUsage: "수정: /editlast 새 메시지",
    roomChatEditNoTarget: "수정할 수 있는 내 최근 메시지가 없습니다",
    roomChatEditWindowExpired: "수정/취소 가능 시간(30초)을 지났습니다",
    roomChatEditedLabel: "수정됨",
    roomChatRetractNoTarget: "취소할 수 있는 내 최근 메시지가 없습니다",
    roomChatRetractedLabel: "이 메시지는 취소되었습니다",
    roomChatRetractCooldown: "보내기 취소는 연속으로 사용할 수 없습니다. 잠시 후 다시 시도하세요",
    roomChatServerMuted: "현재 음소거 상태라 전송할 수 없습니다 (해제까지 {seconds}초)",
    roomChatServerRateLimitFast: "서버: 전송이 너무 빠릅니다. 잠시 기다려 주세요",
    roomChatServerRateLimitBurst: "서버: 전송 횟수 제한을 초과했습니다. 잠시 기다려 주세요",
    roomChatServerRateLimitDuplicate: "서버: 같은 내용의 반복 전송은 불가합니다",
    roomChatServerWindowExpired: "서버: 수정/취소 가능 시간을 지났습니다",
    roomChatServerMessageNotFound: "서버: 대상 메시지를 찾을 수 없습니다",
    roomChatServerNotOwned: "서버: 자신의 메시지만 수정/취소할 수 있습니다",
    roomChatServerHostOnly: "이 작업은 호스트만 수행할 수 있습니다",
    roomChatServerTargetRequired: "대상 사용자를 지정하세요",
    roomChatServerReportSelfForbidden: "자신의 메시지는 신고할 수 없습니다",
    roomChatServerUnknownError: "서버 오류: {code}",
    roomChatHostMuteUsage: "호스트 음소거: /hostmute 이름 [초]",
    roomChatHostUnmuteUsage: "호스트 음소거 해제: /hostunmute 이름",
    roomChatReportLastNoTarget: "신고할 대상 메시지를 찾을 수 없습니다",
    roomChatReportPrompt: "신고 사유 (선택, 60자 이내)",
    roomChatReportSent: "신고를 전송했습니다",
    roomChatHostMutesEmpty: "호스트 음소거 중인 사용자가 없습니다",
    roomChatHostMutesList: "호스트 음소거 목록: {list}",
    roomChatHostMutedNotice: "{name} 님이 호스트에 의해 음소거되었습니다",
    roomChatHostUnmutedNotice: "{name} 님의 호스트 음소거가 해제되었습니다",
    roomChatAutoMutedNotice: "{name} 님은 신고 누적으로 일시 음소거되었습니다",
    roomChatActionEdit: "수정",
    roomChatActionRetract: "취소",
    roomChatActionReport: "신고",
    roomChatActionHostMute: "호스트 음소거",
    roomChatActionHostUnmute: "해제",
    roomChatUnknownCommand: "지원하지 않는 명령어입니다 (/help /mute /unmute /mutes /dm /dmclear /editlast /retractlast /reportlast /hostmute /hostunmute /hostmutes)",
    roomChatHelpSummary: "명령어 도움말",
    roomChatHelpLine1: "/help 또는 /commands: 도움말 표시",
    roomChatHelpLine2: "/mute 이름: 상대 음소거",
    roomChatHelpLine3: "/unmute 이름: 음소거 해제",
    roomChatHelpLine4: "/mutes: 음소거 목록 표시",
    roomChatHelpLine5: "/dm 이름 메시지: 1:1 DM (보관기한 없음)",
    roomChatHelpLine6: "/dmclear 이름|all: DM 기록 삭제",
    roomChatHelpLine7: "/editlast 새 메시지: 최근 메시지 수정",
    roomChatHelpLine8: "/retractlast /reportlast [사유] /hostmute 이름 [초] /hostunmute 이름 /hostmutes",
    roomChatHelpInline: "명령어: /help, /mute 이름, /unmute 이름, /mutes, /dm 이름 메시지, /dmclear 이름|all, /editlast 새 메시지, /retractlast, /reportlast [사유], /hostmute 이름 [초], /hostunmute 이름, /hostmutes",
  },
};

let currentLang = "ja";

function tr(key, vars = {}) {
  const dict = messages[currentLang] ?? messages.ja;
  let text = dict[key] ?? messages.ja[key] ?? key;
  Object.entries(vars).forEach(([k, v]) => {
    text = text.replaceAll(`{${k}}`, String(v));
  });
  return text;
}

function setTextById(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function applyStaticTranslations() {
  setTextById("entryTitle", tr("entryTitle"));
  setTextById("entrySubtitle", tr("entrySubtitle"));
  setTextById("menuSubtitle", tr("menuSubtitle"));
  setTextById("roomCardTitle", tr("roomCardTitle"));
  setTextById("roomCardDesc", tr("roomCardDesc"));
  setTextById("othelloCardDesc", tr("othelloCardDesc"));
  setTextById("shogiCardDesc", tr("shogiCardDesc"));
  setTextById("chessCardDesc", tr("chessCardDesc"));
  setTextById("unoCardDesc", tr("unoCardDesc"));
  setTextById("gomokuCardDesc", tr("gomokuCardDesc"));
  setTextById("survivorsCardDesc", tr("survivorsCardDesc"));
  setTextById("fitPuzzleCardDesc", tr("fitPuzzleCardDesc"));
  setTextById("solitaireCardDesc", tr("solitaireCardDesc"));
  setTextById("shogiDetailSummary", tr("shogiDetailSummary"));
  setTextById("shogiDetailTitle", tr("shogiDetailTitle"));
  setTextById("shogiPieceKing", tr("shogiPieceKing"));
  setTextById("shogiPieceRook", tr("shogiPieceRook"));
  setTextById("shogiPieceBishop", tr("shogiPieceBishop"));
  setTextById("shogiPieceGold", tr("shogiPieceGold"));
  setTextById("shogiPieceSilver", tr("shogiPieceSilver"));
  setTextById("shogiPieceKnight", tr("shogiPieceKnight"));
  setTextById("shogiPieceLance", tr("shogiPieceLance"));
  setTextById("shogiPiecePawn", tr("shogiPiecePawn"));
  setTextById("lobbyTitle", tr("lobbyTitle"));
  setTextById("lobbySubtitle", tr("lobbySubtitle"));
  setTextById("othelloSubtitle", tr("othelloSubtitle"));
  setTextById("shogiSubtitle", tr("shogiSubtitle"));
  setTextById("chessSubtitle", tr("chessSubtitle"));
  setTextById("unoSubtitle", tr("unoSubtitle"));
  setTextById("gomokuSubtitle", tr("gomokuSubtitle"));
  setTextById("survivorsSubtitle", tr("survivorsSubtitle"));
  setTextById("fitPuzzleSubtitle", tr("fitPuzzleSubtitle"));
  setTextById("solitaireSubtitle", tr("solitaireSubtitle"));
  setTextById("unoModeCpuOption", tr("unoModeCpu"));
  setTextById("unoModeLocalOption", tr("unoModeLocal"));

  if (entryCloudUserIdInput) entryCloudUserIdInput.placeholder = tr("cloudUserPlaceholder");
  if (entryCloudPasswordInput) entryCloudPasswordInput.placeholder = tr("cloudPassPlaceholder");
  if (playerNameInput) playerNameInput.placeholder = tr("playerNamePlaceholder");
  if (cloudUserIdInput) cloudUserIdInput.placeholder = tr("cloudUserPlaceholder");
  if (cloudPasswordInput) cloudPasswordInput.placeholder = tr("cloudPassPlaceholder");
  if (roomCodeInput) roomCodeInput.placeholder = tr("roomCodePlaceholder");

  if (playOthelloBtn) playOthelloBtn.textContent = tr("play");
  if (playShogiBtn) playShogiBtn.textContent = tr("play");
  if (playChessBtn) playChessBtn.textContent = tr("play");
  if (playUnoBtn) playUnoBtn.textContent = tr("play");
  if (playGomokuBtn) playGomokuBtn.textContent = tr("play");
  if (playSurvivorsBtn) playSurvivorsBtn.textContent = tr("play");
  if (playFitPuzzleBtn) playFitPuzzleBtn.textContent = tr("play");
  if (playSolitaireSingleBtn) playSolitaireSingleBtn.textContent = tr("singlePlay");
  if (playSolitaireMultiBtn) playSolitaireMultiBtn.textContent = tr("multiPlay");
  if (createRoomBtn) createRoomBtn.textContent = tr("createRoom");
  if (joinRoomBtn) joinRoomBtn.textContent = tr("join");
  if (entryLoginBtn) entryLoginBtn.textContent = tr("loginAndPlay");
  if (entryGuestBtn) entryGuestBtn.textContent = tr("playAsGuest");
  if (saveCloudAuthBtn) saveCloudAuthBtn.textContent = tr("saveCloudAuth");
  if (backToEntryBtn) backToEntryBtn.textContent = tr("backToLogin");
  lobbyStartConfigs.forEach(({ button, labelKey }) => {
    if (button) button.textContent = tr(labelKey);
  });
  if (lobbyBackBtn) lobbyBackBtn.textContent = tr("backToMenu");
  if (roomChatTitle) roomChatTitle.textContent = tr("roomChatTitle");
  if (roomChatGroupNameInput) roomChatGroupNameInput.placeholder = tr("roomChatGroupNamePlaceholder");
  if (roomChatGroupCreateBtn) roomChatGroupCreateBtn.textContent = tr("roomChatGroupCreate");
  if (roomChatSearchDateInput) roomChatSearchDateInput.setAttribute("aria-label", tr("roomChatSearchDateAria"));
  if (roomChatSearchWordInput) roomChatSearchWordInput.placeholder = tr("roomChatSearchWordPlaceholder");
  if (roomChatSearchClearBtn) roomChatSearchClearBtn.textContent = tr("roomChatSearchClear");
  if (roomHostMuteTitle) roomHostMuteTitle.textContent = tr("roomChatHostMutePanelTitle");
  setTextById("roomChatHelpSummary", tr("roomChatHelpSummary"));
  setTextById("roomChatHelpLine1", tr("roomChatHelpLine1"));
  setTextById("roomChatHelpLine2", tr("roomChatHelpLine2"));
  setTextById("roomChatHelpLine3", tr("roomChatHelpLine3"));
  setTextById("roomChatHelpLine4", tr("roomChatHelpLine4"));
  setTextById("roomChatHelpLine5", tr("roomChatHelpLine5"));
  setTextById("roomChatHelpLine6", tr("roomChatHelpLine6"));
  setTextById("roomChatHelpLine7", tr("roomChatHelpLine7"));
  setTextById("roomChatHelpLine8", tr("roomChatHelpLine8"));
  if (roomChatInput) roomChatInput.placeholder = tr("roomChatInputPlaceholder");
  if (roomChatSendBtn) roomChatSendBtn.textContent = tr("roomChatSend");
  if (roomChatClearBtn) roomChatClearBtn.textContent = tr("roomChatClear");

  setTextById("startBtn", tr("newGame"));
  setTextById("remakeBtn", tr("remake"));
  setTextById("menuBtn", tr("menu"));
  setTextById("shogiStartBtn", tr("newMatch"));
  setTextById("shogiMenuBtn", tr("menuJa"));
  setTextById("chessStartBtn", tr("newMatch"));
  setTextById("chessMenuBtn", tr("menuJa"));
  setTextById("unoStartBtn", tr("newMatch"));
  setTextById("unoMenuBtn", tr("menu"));
  setTextById("gomokuStartBtn", tr("newMatch"));
  setTextById("gomokuMenuBtn", tr("menu"));
  setTextById("survivorsStartBtn", tr("newMatch"));
  setTextById("survivorsGachaBtn", tr("bankGacha"));
  setTextById("survivorsGacha10Btn", tr("bankGacha10"));
  setTextById("survivorsMenuBtn", tr("menu"));
  setTextById("fitPuzzleStartBtn", tr("newMatch"));
  setTextById("fitPuzzleRotateBtn", tr("rotate"));
  setTextById("fitPuzzleResetBtn", tr("reset"));
  setTextById("fitPuzzleMenuBtn", tr("menu"));
  setTextById("solitaireStartBtn", tr("newMatch"));
  setTextById("solitaireResetBtn", tr("resetEn"));
  setTextById("solitaireMenuBtn", tr("menu"));

  const menuTitle = menuScreen?.querySelector(".top-bar h1");
  if (menuTitle) menuTitle.textContent = tr("gameSelectTitle");
  renderRoomChat();
}

function setLanguage(lang) {
  currentLang = messages[lang] ? lang : "ja";
  localStorage.setItem(STORAGE_LANG_KEY, currentLang);
  applyStaticTranslations();
  renderRoomChat();
  updateLobbyView();
  updateRoomStatus({ roomCode: roomSession.code, roomRole: roomSession.role });
}

const BLACK = 1;
const WHITE = 2;
const peerId = (crypto.randomUUID && crypto.randomUUID()) || String(Date.now() + Math.random());
const MAX_ROOM_PLAYERS = 8;
const roomServerUrl = resolveRoomServerUrl({
  storageKey: STORAGE_ROOM_SERVER_URL_KEY,
  queryParamKey: ROOM_SERVER_QUERY_PARAM_KEY,
  defaultUrl: DEFAULT_ROOM_SERVER_URL,
});

const roomSession = {
  code: null,
  role: null,
  transport: null,
  transportKind: "none",
  peerConnected: false,
  selectedGame: null,
  playerName: "Player",
  peerName: null,
  mutedUntil: 0,
  serverMutedPeers: new Map(),
  participants: new Map(),
  peerSupportedGames: new Map(),
  peerChatGroups: new Map(),
  chatMessages: [],
  chatGroups: [],
  activeChatGroupId: "all",
};

const ROOM_CHAT_MAX_MESSAGES = 120;
const ROOM_CHAT_INPUT_MAX_CHARS = 100;
const ROOM_CHAT_MAX_GROUPS = 24;
const ROOM_CHAT_DEFAULT_GROUP_ID = "all";
const ROOM_CHAT_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
const ROOM_CHAT_DM_GROUP_PREFIX = "dm:";
const ROOM_CHAT_MIN_INTERVAL_MS = 700;
const ROOM_CHAT_OUTGOING_WINDOW_MS = 12000;
const ROOM_CHAT_OUTGOING_MAX_IN_WINDOW = 8;
const ROOM_CHAT_DUPLICATE_BLOCK_MS = 9000;
const ROOM_CHAT_INCOMING_WINDOW_MS = 12000;
const ROOM_CHAT_INCOMING_MAX_IN_WINDOW = 10;
const ROOM_CHAT_INCOMING_REPEAT_BLOCK_COUNT = 3;
const ROOM_CHAT_RETRACT_COOLDOWN_MS = 15000;
const ROOM_CHAT_EDIT_RETRACT_WINDOW_MS = 30000;
const roomChatFilter = {
  date: "",
  word: "",
};
const roomChatModeration = {
  outgoingTimestamps: [],
  outgoingLastText: "",
  outgoingLastAt: 0,
  lastRetractAt: 0,
  incomingBySender: new Map(),
  mutedNames: new Set(),
};

const gameScreens = {
  othello: othelloScreen,
  shogi: shogiScreen,
  chess: chessScreen,
  uno: unoScreen,
  gomoku: gomokuScreen,
  survivors: survivorsScreen,
  fitPuzzle: fitPuzzleScreen,
  solitaire: solitaireScreen,
};

let games = null;
let currentGameKey = "othello";

function normalizeName(raw) {
  const trimmed = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "Player";
  return trimmed.slice(0, 18);
}

function setPlayerName(name) {
  const normalized = normalizeName(name);
  roomSession.playerName = normalized;
  localStorage.setItem(STORAGE_PLAYER_NAME_KEY, normalized);
  if (playerNameInput) playerNameInput.value = normalized;
  updateLobbyView();
}

function getCloudAuthFromStorage() {
  const userId = String(localStorage.getItem(STORAGE_CLOUD_USER_ID_KEY) || "").trim();
  const password = String(localStorage.getItem(STORAGE_CLOUD_PASSWORD_KEY) || "");
  if (!userId || !password) return null;
  return { userId, password };
}

function normalizeRoomCode(raw) {
  return String(raw ?? "").replace(/\D/g, "").slice(0, 6);
}

function normalizeChatGroupLabel(raw) {
  return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 20);
}

function normalizeChatGroupId(raw) {
  const text = String(raw || "").trim().toLowerCase();
  if (!text) return ROOM_CHAT_DEFAULT_GROUP_ID;
  const clean = text.replace(/[^a-z0-9_:-]/g, "").slice(0, 36);
  return clean || ROOM_CHAT_DEFAULT_GROUP_ID;
}

function roomChatGroupStateStorageKey(roomCode) {
  const normalized = normalizeRoomCode(roomCode);
  if (!normalized) return null;
  return `webgame.room-chat-groups.${normalized}`;
}

function getDefaultChatGroup() {
  return { id: ROOM_CHAT_DEFAULT_GROUP_ID, label: tr("roomChatGroupAll") };
}

function ensureDefaultChatGroup() {
  const existing = Array.isArray(roomSession.chatGroups)
    ? roomSession.chatGroups.find((group) => group?.id === ROOM_CHAT_DEFAULT_GROUP_ID)
    : null;
  const fallback = getDefaultChatGroup();
  if (!Array.isArray(roomSession.chatGroups)) {
    roomSession.chatGroups = [fallback];
    return;
  }
  if (!existing) {
    roomSession.chatGroups.unshift(fallback);
    return;
  }
  existing.label = fallback.label;
}

function normalizeChatGroupEntry(group) {
  if (!group || typeof group !== "object") return null;
  const id = normalizeChatGroupId(group.id);
  const label = id === ROOM_CHAT_DEFAULT_GROUP_ID
    ? tr("roomChatGroupAll")
    : normalizeChatGroupLabel(group.label || group.id);
  if (!label) return null;
  return { id, label };
}

function mergeChatGroups(rawGroups) {
  ensureDefaultChatGroup();
  if (!Array.isArray(rawGroups)) return;
  rawGroups.forEach((entry) => {
    const normalized = normalizeChatGroupEntry(entry);
    if (!normalized) return;
    const existing = roomSession.chatGroups.find((group) => group.id === normalized.id);
    if (existing) {
      if (normalized.id !== ROOM_CHAT_DEFAULT_GROUP_ID) {
        existing.label = normalized.label;
      }
      return;
    }
    if (roomSession.chatGroups.length >= ROOM_CHAT_MAX_GROUPS) return;
    roomSession.chatGroups.push(normalized);
  });
}

function upsertChatGroup(group) {
  const normalized = normalizeChatGroupEntry(group);
  if (!normalized) return null;
  ensureDefaultChatGroup();
  const existing = roomSession.chatGroups.find((entry) => entry.id === normalized.id);
  if (existing) {
    if (normalized.id !== ROOM_CHAT_DEFAULT_GROUP_ID) {
      existing.label = normalized.label;
    }
    return existing;
  }
  if (roomSession.chatGroups.length >= ROOM_CHAT_MAX_GROUPS) return null;
  roomSession.chatGroups.push(normalized);
  return normalized;
}

function chatGroupLabelById(groupId) {
  const id = normalizeChatGroupId(groupId);
  ensureDefaultChatGroup();
  const group = roomSession.chatGroups.find((entry) => entry.id === id);
  if (group) return group.label;
  return tr("roomChatGroupAll");
}

function roomChatGroupsForPayload() {
  ensureDefaultChatGroup();
  return roomSession.chatGroups
    .slice(0, ROOM_CHAT_MAX_GROUPS)
    .map((group) => ({ id: group.id, label: group.label }));
}

function saveRoomChatGroupStateToStorage() {
  if (typeof localStorage === "undefined") return;
  const key = roomChatGroupStateStorageKey(roomSession.code);
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify({
      groups: roomSession.chatGroups,
      activeGroupId: roomSession.activeChatGroupId,
    }));
  } catch {
    // Ignore storage quota/security errors.
  }
}

function loadRoomChatGroupStateFromStorage(roomCode) {
  const fallback = {
    groups: [getDefaultChatGroup()],
    activeGroupId: ROOM_CHAT_DEFAULT_GROUP_ID,
  };
  if (typeof localStorage === "undefined") return fallback;
  const key = roomChatGroupStateStorageKey(roomCode);
  if (!key) return fallback;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    const groups = [];
    if (Array.isArray(parsed?.groups)) {
      parsed.groups.forEach((entry) => {
        const normalized = normalizeChatGroupEntry(entry);
        if (!normalized) return;
        if (groups.some((group) => group.id === normalized.id)) return;
        if (groups.length >= ROOM_CHAT_MAX_GROUPS) return;
        groups.push(normalized);
      });
    }
    if (!groups.some((group) => group.id === ROOM_CHAT_DEFAULT_GROUP_ID)) {
      groups.unshift(getDefaultChatGroup());
    }

    const activeGroupId = normalizeChatGroupId(parsed?.activeGroupId);
    const hasActive = groups.some((group) => group.id === activeGroupId);
    return {
      groups,
      activeGroupId: hasActive ? activeGroupId : ROOM_CHAT_DEFAULT_GROUP_ID,
    };
  } catch {
    return fallback;
  }
}

function roomChatStorageKey(roomCode) {
  const normalized = normalizeRoomCode(roomCode);
  if (!normalized) return null;
  return `webgame.room-chat.${normalized}`;
}

function saveRoomChatToStorage() {
  if (typeof localStorage === "undefined") return;
  const key = roomChatStorageKey(roomSession.code);
  if (!key) return;
  roomSession.chatMessages = pruneRoomChatMessagesByRetention(roomSession.chatMessages);
  roomSession.chatMessages = enforceRoomChatMessageCap(roomSession.chatMessages);
  try {
    localStorage.setItem(key, JSON.stringify(roomSession.chatMessages));
  } catch {
    // Ignore storage quota/security errors.
  }
}

function loadRoomChatFromStorage(roomCode) {
  if (typeof localStorage === "undefined") return [];
  const key = roomChatStorageKey(roomCode);
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const normalized = parsed
      .map((entry) => {
        const text = normalizeChatText(entry?.text);
        if (!text) return null;
        const groupId = normalizeChatGroupId(entry?.groupId);
        return {
          name: normalizeName(entry?.name || "Player"),
          text,
          mine: Boolean(entry?.mine),
          ts: Number.isFinite(entry?.ts) ? entry.ts : Date.now(),
          senderId: typeof entry?.senderId === "string" ? entry.senderId : "",
          messageId: typeof entry?.messageId === "string" && entry.messageId ? entry.messageId : generateChatMessageId(),
          editedAt: Number.isFinite(entry?.editedAt) ? entry.editedAt : 0,
          retracted: Boolean(entry?.retracted),
          retractedAt: Number.isFinite(entry?.retractedAt) ? entry.retractedAt : 0,
          groupId,
          groupName: normalizeChatGroupLabel(entry?.groupName) || chatGroupLabelById(groupId),
        };
      })
      .filter(Boolean);
    return enforceRoomChatMessageCap(pruneRoomChatMessagesByRetention(normalized));
  } catch {
    return [];
  }
}

function generateRoomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function ensureBrandedUrlHash() {
  if (typeof window === "undefined") return;
  const current = String(window.location.hash || "");
  if (current.toLowerCase() === `#${APP_URL_TAG.toLowerCase()}`) return;
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${APP_URL_TAG}`);
}

function setMenuMessage(text) {
  roomMenuMessage.textContent = text;
}

function setEntryMessage(text) {
  if (entryMessage) entryMessage.textContent = text;
}

function setEntryActionButtonsVisible(visible) {
  const display = visible ? "" : "none";
  if (entryLoginBtn) {
    entryLoginBtn.style.display = display;
    entryLoginBtn.disabled = !visible;
  }
  if (entryGuestBtn) {
    entryGuestBtn.style.display = display;
    entryGuestBtn.disabled = !visible;
  }
}

function setLobbyMessage(text) {
  lobbyMessage.textContent = text;
}

function isRoomChatVisible() {
  if (!roomSession.code) return false;
  return entryScreen.classList.contains("hidden") && menuScreen.classList.contains("hidden");
}

function updateRoomChatVisibility() {
  if (!roomChatPanel) return;
  roomChatPanel.classList.toggle("hidden", !isRoomChatVisible());
}

function normalizeMuteName(raw) {
  return normalizeName(raw || "").toLowerCase();
}

function isDmGroupId(groupId) {
  return normalizeChatGroupId(groupId).startsWith(ROOM_CHAT_DM_GROUP_PREFIX);
}

function dmGroupIdForPeer(peer) {
  return `${ROOM_CHAT_DM_GROUP_PREFIX}${normalizeChatGroupId(peer).slice(0, 28)}`;
}

function extractPeerIdFromDmGroupId(groupId) {
  const normalized = normalizeChatGroupId(groupId);
  if (!isDmGroupId(normalized)) return "";
  return normalized.slice(ROOM_CHAT_DM_GROUP_PREFIX.length);
}

function findParticipantByName(rawName) {
  const target = normalizeMuteName(rawName);
  if (!target) return null;
  for (const [id, name] of roomSession.participants.entries()) {
    if (id === peerId) continue;
    if (normalizeMuteName(name) === target) {
      return { id, name: normalizeName(name) };
    }
  }
  return null;
}

function ensureDmGroupForPeer(targetPeerId, targetName = "") {
  const peerName = normalizeName(targetName || roomSession.participants.get(targetPeerId) || "Peer");
  const groupId = dmGroupIdForPeer(targetPeerId);
  const groupLabel = `DM:${peerName}`;
  return upsertChatGroup({ id: groupId, label: groupLabel });
}

function pruneRoomChatMessagesByRetention(entries) {
  const threshold = Date.now() - ROOM_CHAT_RETENTION_MS;
  return entries.filter((entry) => {
    const ts = Number.isFinite(entry?.ts) ? entry.ts : Date.now();
    const groupId = normalizeChatGroupId(entry?.groupId);
    if (isDmGroupId(groupId)) return true;
    return ts >= threshold;
  });
}

function enforceRoomChatMessageCap(entries) {
  let nonDmCount = 0;
  entries.forEach((entry) => {
    if (!isDmGroupId(entry.groupId)) nonDmCount += 1;
  });
  let removeCount = nonDmCount - ROOM_CHAT_MAX_MESSAGES;
  if (removeCount <= 0) return entries;

  return entries.filter((entry) => {
    if (removeCount <= 0) return true;
    if (isDmGroupId(entry.groupId)) return true;
    removeCount -= 1;
    return false;
  });
}

function removeDmHistoryByPeerId(targetPeerId) {
  const groupId = dmGroupIdForPeer(targetPeerId);
  roomSession.chatMessages = roomSession.chatMessages.filter((entry) => normalizeChatGroupId(entry.groupId) !== groupId);
  roomSession.chatGroups = roomSession.chatGroups.filter((group) => normalizeChatGroupId(group.id) !== groupId);
  if (activeChatGroupId() === groupId) {
    roomSession.activeChatGroupId = ROOM_CHAT_DEFAULT_GROUP_ID;
  }
  saveRoomChatToStorage();
  saveRoomChatGroupStateToStorage();
  renderRoomChat();
}

function pruneRecentTimestamps(list, now, windowMs) {
  while (list.length > 0 && now - list[0] > windowMs) {
    list.shift();
  }
}

function generateChatMessageId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function findChatMessageIndexById(messageId) {
  if (!messageId) return -1;
  return roomSession.chatMessages.findIndex((entry) => entry.messageId === messageId);
}

function findLatestOwnMessageInGroup(groupId) {
  const normalizedGroupId = normalizeChatGroupId(groupId);
  for (let i = roomSession.chatMessages.length - 1; i >= 0; i -= 1) {
    const entry = roomSession.chatMessages[i];
    if (!entry?.mine) continue;
    if (entry?.retracted) continue;
    if (normalizeChatGroupId(entry.groupId) !== normalizedGroupId) continue;
    return entry;
  }
  return null;
}

function canUseRetractNow() {
  const now = Date.now();
  if (roomChatModeration.lastRetractAt > 0 && now - roomChatModeration.lastRetractAt < ROOM_CHAT_RETRACT_COOLDOWN_MS) {
    return false;
  }
  return true;
}

function canMutateMessageInWindow(message) {
  if (!message || !Number.isFinite(message.ts)) return false;
  return Date.now() - message.ts <= ROOM_CHAT_EDIT_RETRACT_WINDOW_MS;
}

function mapRoomServerErrorMessage(code, detail = "") {
  if (code === "MUTED") {
    const remainMs = Math.max(0, roomSession.mutedUntil - Date.now());
    const seconds = Math.max(1, Math.ceil(remainMs / 1000));
    return tr("roomChatServerMuted", { seconds });
  }
  if (code === "RATE_LIMIT_FAST") return tr("roomChatServerRateLimitFast");
  if (code === "RATE_LIMIT_BURST") return tr("roomChatServerRateLimitBurst");
  if (code === "RATE_LIMIT_DUPLICATE") return tr("roomChatServerRateLimitDuplicate");
  if (code === "EDIT_RETRACT_WINDOW_EXPIRED") return tr("roomChatServerWindowExpired");
  if (code === "MESSAGE_NOT_FOUND") return tr("roomChatServerMessageNotFound");
  if (code === "MESSAGE_NOT_OWNED" || code === "MESSAGE_ALREADY_RETRACTED") return tr("roomChatServerNotOwned");
  if (code === "HOST_ONLY") return tr("roomChatServerHostOnly");
  if (code === "TARGET_REQUIRED" || code === "TARGET_INVALID" || code === "MESSAGE_ID_REQUIRED") {
    return tr("roomChatServerTargetRequired");
  }
  if (code === "REPORT_SELF_FORBIDDEN") return tr("roomChatServerReportSelfForbidden");
  if (detail) return `${tr("roomChatServerUnknownError", { code })} (${detail})`;
  return tr("roomChatServerUnknownError", { code: code || "UNKNOWN" });
}

function isPeerServerMuted(peerIdValue) {
  const id = String(peerIdValue || "").trim();
  if (!id) return false;
  const until = Number(roomSession.serverMutedPeers.get(id) || 0);
  if (!Number.isFinite(until) || until <= Date.now()) {
    roomSession.serverMutedPeers.delete(id);
    return false;
  }
  return true;
}

function formatHostMuteListSummary() {
  const now = Date.now();
  const lines = [];
  for (const [targetId, untilRaw] of roomSession.serverMutedPeers.entries()) {
    const until = Number(untilRaw || 0);
    if (!Number.isFinite(until) || until <= now) {
      roomSession.serverMutedPeers.delete(targetId);
      continue;
    }
    const name = normalizeName(roomSession.participants.get(targetId) || "Player");
    const seconds = Math.max(1, Math.ceil((until - now) / 1000));
    lines.push(`${name}(${seconds}s)`);
  }
  return lines;
}

function handleModerationAction(payload) {
  const targetId = typeof payload.target === "string" ? payload.target : "";
  const targetName = normalizeName(roomSession.participants.get(targetId) || payload.targetName || "Player");

  if (targetId === peerId && Number.isFinite(payload.until)) {
    roomSession.mutedUntil = Math.max(roomSession.mutedUntil, payload.until);
  }

  if (targetId && Number.isFinite(payload.until)) {
    roomSession.serverMutedPeers.set(targetId, Number(payload.until));
  }

  if (payload.action === "host-mute") {
    setLobbyMessage(tr("roomChatHostMutedNotice", { name: targetName }));
    renderRoomChat();
    return;
  }
  if (payload.action === "host-unmute") {
    if (targetId === peerId) {
      roomSession.mutedUntil = 0;
    }
    if (targetId) {
      roomSession.serverMutedPeers.delete(targetId);
    }
    setLobbyMessage(tr("roomChatHostUnmutedNotice", { name: targetName }));
    renderRoomChat();
    return;
  }
  if (payload.action === "auto-mute") {
    setLobbyMessage(tr("roomChatAutoMutedNotice", { name: targetName }));
    renderRoomChat();
  }
}

function applyChatEditById(messageId, nextText, { fromRemote = false, senderId = "" } = {}) {
  const idx = findChatMessageIndexById(messageId);
  if (idx < 0) return false;
  const target = roomSession.chatMessages[idx];
  if (!target || target.retracted) return false;
  if (fromRemote && senderId && target.senderId && target.senderId !== senderId) return false;
  const normalizedText = normalizeChatText(nextText);
  if (!normalizedText) return false;
  target.text = normalizedText;
  target.editedAt = Date.now();
  saveRoomChatToStorage();
  renderRoomChat();
  return true;
}

function applyChatRetractById(messageId, { fromRemote = false, senderId = "" } = {}) {
  const idx = findChatMessageIndexById(messageId);
  if (idx < 0) return false;
  const target = roomSession.chatMessages[idx];
  if (!target || target.retracted) return false;
  if (fromRemote && senderId && target.senderId && target.senderId !== senderId) return false;
  target.retracted = true;
  target.retractedAt = Date.now();
  target.text = "";
  saveRoomChatToStorage();
  renderRoomChat();
  return true;
}

function resetRoomChatModerationState() {
  roomChatModeration.outgoingTimestamps = [];
  roomChatModeration.outgoingLastText = "";
  roomChatModeration.outgoingLastAt = 0;
  roomChatModeration.lastRetractAt = 0;
  roomChatModeration.incomingBySender = new Map();
}

function isMutedByName(name) {
  return roomChatModeration.mutedNames.has(normalizeMuteName(name));
}

function runChatCommand(inputText) {
  const raw = String(inputText || "").trim();
  if (!raw.startsWith("/")) return false;
  const [commandRaw, ...rest] = raw.split(/\s+/);
  const command = commandRaw.toLowerCase();
  const target = rest.join(" ").trim();

  if (command === "/help" || command === "/commands") {
    setLobbyMessage(tr("roomChatHelpInline"));
    return true;
  }

  if (command === "/mute") {
    if (!target) {
      setLobbyMessage(tr("roomChatMuteEmpty"));
      return true;
    }
    roomChatModeration.mutedNames.add(normalizeMuteName(target));
    setLobbyMessage(tr("roomChatMuted", { name: normalizeName(target) }));
    renderRoomChat();
    return true;
  }

  if (command === "/unmute") {
    if (!target) {
      setLobbyMessage(tr("roomChatUnmuteEmpty"));
      return true;
    }
    roomChatModeration.mutedNames.delete(normalizeMuteName(target));
    setLobbyMessage(tr("roomChatUnmuted", { name: normalizeName(target) }));
    renderRoomChat();
    return true;
  }

  if (command === "/mutes") {
    if (roomChatModeration.mutedNames.size === 0) {
      setLobbyMessage(tr("roomChatMuteListEmpty"));
      return true;
    }
    const names = [...roomChatModeration.mutedNames].join(", ");
    setLobbyMessage(tr("roomChatMuteList", { names }));
    return true;
  }

  if (command === "/dm") {
    const [targetNameRaw, ...messageParts] = rest;
    const targetName = String(targetNameRaw || "").trim();
    const message = normalizeChatText(messageParts.join(" "));
    if (!targetName || !message) {
      setLobbyMessage(tr("roomChatDmUsage"));
      return true;
    }
    const participant = findParticipantByName(targetName);
    if (!participant) {
      setLobbyMessage(tr("roomChatDmTargetNotFound", { name: normalizeName(targetName) }));
      return true;
    }

    const dmGroup = ensureDmGroupForPeer(participant.id, participant.name);
    if (!dmGroup) return true;

    setActiveChatGroup(dmGroup.id, { silent: true });
    const ts = Date.now();
    const messageId = generateChatMessageId();
    pushRoomChatMessage({
      name: roomSession.playerName,
      text: message,
      mine: true,
      ts,
      senderId: peerId,
      groupId: dmGroup.id,
      groupName: dmGroup.label,
      messageId,
    });
    postRoomMessage({
      type: "chat",
      text: message,
      name: roomSession.playerName,
      ts,
      messageId,
      dm: true,
      to: participant.id,
      groupId: dmGroup.id,
      groupName: dmGroup.label,
    });
    setLobbyMessage(tr("roomChatDmSent", { name: participant.name }));
    return true;
  }

  if (command === "/dmclear") {
    if (!target) {
      setLobbyMessage(tr("roomChatDmClearUsage"));
      return true;
    }
    if (target.toLowerCase() === "all") {
      roomSession.chatMessages = roomSession.chatMessages.filter((entry) => !isDmGroupId(entry.groupId));
      roomSession.chatGroups = roomSession.chatGroups.filter((group) => !isDmGroupId(group.id));
      if (isDmGroupId(activeChatGroupId())) {
        roomSession.activeChatGroupId = ROOM_CHAT_DEFAULT_GROUP_ID;
      }
      saveRoomChatToStorage();
      saveRoomChatGroupStateToStorage();
      renderRoomChat();
      setLobbyMessage(tr("roomChatDmClearedAll"));
      return true;
    }

    const participant = findParticipantByName(target);
    if (!participant) {
      setLobbyMessage(tr("roomChatDmTargetNotFound", { name: normalizeName(target) }));
      return true;
    }
    removeDmHistoryByPeerId(participant.id);
    setLobbyMessage(tr("roomChatDmCleared", { name: participant.name }));
    return true;
  }

  if (command === "/editlast") {
    const nextText = normalizeChatText(rest.join(" "));
    if (!nextText) {
      setLobbyMessage(tr("roomChatEditUsage"));
      return true;
    }
    const targetMessage = findLatestOwnMessageInGroup(activeChatGroupId());
    if (!targetMessage?.messageId) {
      setLobbyMessage(tr("roomChatEditNoTarget"));
      return true;
    }
    if (!canMutateMessageInWindow(targetMessage)) {
      setLobbyMessage(tr("roomChatEditWindowExpired"));
      return true;
    }
    if (!applyChatEditById(targetMessage.messageId, nextText)) {
      setLobbyMessage(tr("roomChatEditNoTarget"));
      return true;
    }
    postRoomMessage({
      type: "chat-edit",
      messageId: targetMessage.messageId,
      text: nextText,
      groupId: targetMessage.groupId,
    });
    return true;
  }

  if (command === "/retractlast") {
    if (!canUseRetractNow()) {
      setLobbyMessage(tr("roomChatRetractCooldown"));
      return true;
    }
    const targetMessage = findLatestOwnMessageInGroup(activeChatGroupId());
    if (!targetMessage?.messageId) {
      setLobbyMessage(tr("roomChatRetractNoTarget"));
      return true;
    }
    if (!canMutateMessageInWindow(targetMessage)) {
      setLobbyMessage(tr("roomChatEditWindowExpired"));
      return true;
    }
    if (!applyChatRetractById(targetMessage.messageId)) {
      setLobbyMessage(tr("roomChatRetractNoTarget"));
      return true;
    }
    roomChatModeration.lastRetractAt = Date.now();
    postRoomMessage({
      type: "chat-retract",
      messageId: targetMessage.messageId,
      groupId: targetMessage.groupId,
    });
    return true;
  }

  if (command === "/reportlast") {
    const reason = String(rest.join(" ") || "").trim().slice(0, 60);
    const currentGroupId = activeChatGroupId();
    let targetMessage = null;
    for (let i = roomSession.chatMessages.length - 1; i >= 0; i -= 1) {
      const entry = roomSession.chatMessages[i];
      if (!entry || entry.mine) continue;
      if (entry.retracted) continue;
      if (normalizeChatGroupId(entry.groupId) !== normalizeChatGroupId(currentGroupId)) continue;
      if (!entry.messageId) continue;
      targetMessage = entry;
      break;
    }
    if (!targetMessage) {
      setLobbyMessage(tr("roomChatReportLastNoTarget"));
      return true;
    }
    postRoomMessage({
      type: "chat-report",
      messageId: targetMessage.messageId,
      reason,
    });
    setLobbyMessage(tr("roomChatReportSent"));
    return true;
  }

  if (command === "/hostmute") {
    if (roomSession.role !== "host") {
      setLobbyMessage(tr("roomChatServerHostOnly"));
      return true;
    }
    const targetName = String(rest[0] || "").trim();
    if (!targetName) {
      setLobbyMessage(tr("roomChatHostMuteUsage"));
      return true;
    }
    const participant = findParticipantByName(targetName);
    if (!participant) {
      setLobbyMessage(tr("roomChatDmTargetNotFound", { name: normalizeName(targetName) }));
      return true;
    }
    const durationSec = Number(rest[1]);
    const durationMs = Number.isFinite(durationSec) && durationSec > 0
      ? Math.max(30, Math.floor(durationSec)) * 1000
      : undefined;
    postRoomMessage({
      type: "host-mute",
      target: participant.id,
      durationMs,
    });
    return true;
  }

  if (command === "/hostunmute") {
    if (roomSession.role !== "host") {
      setLobbyMessage(tr("roomChatServerHostOnly"));
      return true;
    }
    const targetName = String(rest[0] || "").trim();
    if (!targetName) {
      setLobbyMessage(tr("roomChatHostUnmuteUsage"));
      return true;
    }
    const participant = findParticipantByName(targetName);
    if (!participant) {
      setLobbyMessage(tr("roomChatDmTargetNotFound", { name: normalizeName(targetName) }));
      return true;
    }
    postRoomMessage({
      type: "host-unmute",
      target: participant.id,
    });
    return true;
  }

  if (command === "/hostmutes") {
    if (roomSession.role !== "host") {
      setLobbyMessage(tr("roomChatServerHostOnly"));
      return true;
    }
    const list = formatHostMuteListSummary();
    if (list.length === 0) {
      setLobbyMessage(tr("roomChatHostMutesEmpty"));
      return true;
    }
    setLobbyMessage(tr("roomChatHostMutesList", { list: list.join(", ") }));
    return true;
  }

  setLobbyMessage(tr("roomChatUnknownCommand"));
  return true;
}

function checkOutgoingChatSafety(text) {
  const now = Date.now();
  const normalized = String(text || "").toLowerCase();
  pruneRecentTimestamps(roomChatModeration.outgoingTimestamps, now, ROOM_CHAT_OUTGOING_WINDOW_MS);

  if (roomChatModeration.outgoingLastAt > 0 && now - roomChatModeration.outgoingLastAt < ROOM_CHAT_MIN_INTERVAL_MS) {
    return { ok: false, reason: "fast" };
  }

  if (roomChatModeration.outgoingTimestamps.length >= ROOM_CHAT_OUTGOING_MAX_IN_WINDOW) {
    return { ok: false, reason: "burst" };
  }

  if (
    roomChatModeration.outgoingLastText
    && roomChatModeration.outgoingLastText === normalized
    && now - roomChatModeration.outgoingLastAt < ROOM_CHAT_DUPLICATE_BLOCK_MS
  ) {
    return { ok: false, reason: "duplicate" };
  }

  roomChatModeration.outgoingTimestamps.push(now);
  roomChatModeration.outgoingLastText = normalized;
  roomChatModeration.outgoingLastAt = now;
  return { ok: true };
}

function checkIncomingChatSafety(senderId, normalizedText) {
  const senderKey = typeof senderId === "string" && senderId ? senderId : "unknown";
  const now = Date.now();
  const state = roomChatModeration.incomingBySender.get(senderKey) || {
    timestamps: [],
    lastText: "",
    repeatCount: 0,
  };

  pruneRecentTimestamps(state.timestamps, now, ROOM_CHAT_INCOMING_WINDOW_MS);
  if (state.timestamps.length >= ROOM_CHAT_INCOMING_MAX_IN_WINDOW) {
    roomChatModeration.incomingBySender.set(senderKey, state);
    return { ok: false, reason: "burst" };
  }

  const comparable = String(normalizedText || "").toLowerCase();
  if (state.lastText === comparable) {
    state.repeatCount += 1;
  } else {
    state.repeatCount = 1;
    state.lastText = comparable;
  }

  if (state.repeatCount >= ROOM_CHAT_INCOMING_REPEAT_BLOCK_COUNT) {
    roomChatModeration.incomingBySender.set(senderKey, state);
    return { ok: false, reason: "repeat" };
  }

  state.timestamps.push(now);
  roomChatModeration.incomingBySender.set(senderKey, state);
  return { ok: true };
}

function activeChatGroupId() {
  const id = normalizeChatGroupId(roomSession.activeChatGroupId);
  if (roomSession.chatGroups.some((group) => group.id === id)) {
    return id;
  }
  return ROOM_CHAT_DEFAULT_GROUP_ID;
}

function updateChatGroupInfo() {
  if (!roomChatGroupInfo) return;
  const groupId = activeChatGroupId();
  const label = chatGroupLabelById(groupId);
  const members = [...roomSession.participants.keys()].filter((id) => {
    const peerGroup = roomSession.peerChatGroups.get(id);
    return normalizeChatGroupId(peerGroup) === groupId;
  }).length;
  roomChatGroupInfo.textContent = tr("roomChatGroupInfo", {
    group: label,
    count: Math.max(1, members),
  });
}

function renderRoomChatGroupControls() {
  if (!roomChatGroupSelect) {
    updateChatGroupInfo();
    return;
  }
  ensureDefaultChatGroup();
  const selectedId = activeChatGroupId();
  roomSession.activeChatGroupId = selectedId;
  roomChatGroupSelect.innerHTML = "";
  roomSession.chatGroups.forEach((group) => {
    const option = document.createElement("option");
    option.value = group.id;
    option.textContent = group.label;
    roomChatGroupSelect.appendChild(option);
  });
  roomChatGroupSelect.value = selectedId;
  updateChatGroupInfo();
}

function sendRoomPresence() {
  postRoomMessage({
    type: "presence",
    name: roomSession.playerName,
    supportedGames: localSupportedGameKeys(),
    chatGroupId: activeChatGroupId(),
    chatGroups: roomChatGroupsForPayload(),
  });
}

function setActiveChatGroup(groupId, { silent = false } = {}) {
  const normalized = normalizeChatGroupId(groupId);
  const exists = roomSession.chatGroups.some((group) => group.id === normalized);
  if (!exists) return;
  roomSession.activeChatGroupId = normalized;
  roomSession.peerChatGroups.set(peerId, normalized);
  saveRoomChatGroupStateToStorage();
  renderRoomChatGroupControls();
  renderRoomChat();
  if (!silent && roomSession.code && roomSession.transport) {
    sendRoomPresence();
  }
}

function createRoomChatGroup() {
  const label = normalizeChatGroupLabel(roomChatGroupNameInput?.value);
  if (!label) {
    setLobbyMessage(tr("roomChatGroupCreateEmpty"));
    return;
  }

  const duplicated = roomSession.chatGroups.some(
    (group) => normalizeChatGroupLabel(group.label).toLowerCase() === label.toLowerCase(),
  );
  if (duplicated) {
    setLobbyMessage(tr("roomChatGroupCreateExists"));
    return;
  }

  const base = normalizeChatGroupId(label.replace(/\s+/g, "-"));
  let id = base;
  let suffix = 2;
  while (roomSession.chatGroups.some((group) => group.id === id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }

  const created = upsertChatGroup({ id, label });
  if (!created) return;
  if (roomChatGroupNameInput) roomChatGroupNameInput.value = "";
  saveRoomChatGroupStateToStorage();
  renderRoomChatGroupControls();
  setActiveChatGroup(created.id);
  postRoomMessage({ type: "chat-group-create", group: created });
}

function hasRoomChatFilter() {
  return Boolean(roomChatFilter.date || roomChatFilter.word);
}

function dateKeyFromTimestamp(ts) {
  const d = new Date(Number.isFinite(ts) ? ts : Date.now());
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function filteredRoomChatMessages() {
  const dateFilter = roomChatFilter.date;
  const wordFilter = roomChatFilter.word;
  const groupId = activeChatGroupId();
  if (!dateFilter && !wordFilter) {
    return roomSession.chatMessages.filter((entry) => normalizeChatGroupId(entry.groupId) === groupId);
  }

  return roomSession.chatMessages.filter((entry) => {
    if (isMutedByName(entry.name)) {
      return false;
    }
    if (normalizeChatGroupId(entry.groupId) !== groupId) {
      return false;
    }
    if (dateFilter && dateKeyFromTimestamp(entry.ts) !== dateFilter) {
      return false;
    }
    if (wordFilter) {
      const haystack = `${entry.name} ${entry.text}`.toLowerCase();
      if (!haystack.includes(wordFilter)) {
        return false;
      }
    }
    return true;
  });
}

function syncRoomChatFilterFromInputs() {
  roomChatFilter.date = String(roomChatSearchDateInput?.value || "").trim();
  roomChatFilter.word = String(roomChatSearchWordInput?.value || "").trim().toLowerCase();
}

function resetRoomChatFilter({ keepRendered = false } = {}) {
  roomChatFilter.date = "";
  roomChatFilter.word = "";
  if (roomChatSearchDateInput) roomChatSearchDateInput.value = "";
  if (roomChatSearchWordInput) roomChatSearchWordInput.value = "";
  if (!keepRendered) {
    renderRoomChat();
  }
}

function renderRoomChatSearchStatus(shownCount, totalCount) {
  if (!roomChatSearchStatus) return;
  roomChatSearchStatus.textContent = tr("roomChatFilterStatus", {
    shown: shownCount,
    total: totalCount,
  });
}

function renderHostMutePanel() {
  if (!roomHostMutePanel || !roomHostMuteList) return;

  const show = roomSession.role === "host" && Boolean(roomSession.code);
  roomHostMutePanel.classList.toggle("hidden", !show);
  if (!show) return;

  const now = Date.now();
  const items = [];
  for (const [targetId, untilRaw] of roomSession.serverMutedPeers.entries()) {
    const until = Number(untilRaw || 0);
    if (!Number.isFinite(until) || until <= now) {
      roomSession.serverMutedPeers.delete(targetId);
      continue;
    }
    const name = normalizeName(roomSession.participants.get(targetId) || "Player");
    const seconds = Math.max(1, Math.ceil((until - now) / 1000));
    items.push({ name, seconds, until });
  }

  items.sort((a, b) => a.until - b.until);
  roomHostMuteList.innerHTML = "";

  if (items.length === 0) {
    const empty = document.createElement("li");
    empty.className = "room-chat-host-empty";
    empty.textContent = tr("roomChatHostMutePanelEmpty");
    roomHostMuteList.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = tr("roomChatHostMutePanelItem", {
      name: item.name,
      seconds: item.seconds,
    });
    roomHostMuteList.appendChild(li);
  });
}

function normalizeChatText(raw) {
  return String(raw || "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\u200B|\u200C|\u200D|\uFEFF/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, ROOM_CHAT_INPUT_MAX_CHARS);
}

function formatChatClock(ts) {
  const d = new Date(Number.isFinite(ts) ? ts : Date.now());
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function renderRoomChat() {
  if (!roomChatLog) return;
  renderRoomChatGroupControls();
  renderHostMutePanel();
  roomChatLog.innerHTML = "";
  const visibleMessages = filteredRoomChatMessages();
  const groupId = activeChatGroupId();
  const groupTotal = roomSession.chatMessages.filter(
    (entry) => normalizeChatGroupId(entry.groupId) === groupId,
  ).length;
  renderRoomChatSearchStatus(visibleMessages.length, groupTotal);

  if (visibleMessages.length === 0) {
    const empty = document.createElement("p");
    empty.className = "room-chat-empty";
    empty.textContent = hasRoomChatFilter() ? tr("roomChatNoMatch") : tr("roomChatEmpty");
    roomChatLog.appendChild(empty);
    return;
  }

  visibleMessages.forEach((entry) => {
    const item = document.createElement("article");
    item.className = `room-chat-item${entry.mine ? " mine" : ""}`;

    const meta = document.createElement("div");
    meta.className = "room-chat-meta";

    const name = document.createElement("span");
    name.className = "room-chat-name";
    name.textContent = entry.name;

    const clock = document.createElement("span");
    clock.className = "room-chat-time";
    const editedSuffix = entry.editedAt ? ` • ${tr("roomChatEditedLabel")}` : "";
    clock.textContent = `${formatChatClock(entry.ts)}${editedSuffix}`;

    const text = document.createElement("p");
    text.className = `room-chat-text${entry.retracted ? " retracted" : ""}`;
    text.textContent = entry.retracted ? tr("roomChatRetractedLabel") : entry.text;

    meta.appendChild(name);
    meta.appendChild(clock);
    item.appendChild(meta);
    item.appendChild(text);

    if (entry.mine && !entry.retracted && entry.messageId) {
      const actions = document.createElement("div");
      actions.className = "room-chat-actions";

      const editBtn = document.createElement("button");
      editBtn.className = "room-chat-action-btn";
      editBtn.type = "button";
      editBtn.dataset.action = "edit";
      editBtn.dataset.messageId = entry.messageId;
      editBtn.textContent = tr("roomChatActionEdit");

      const retractBtn = document.createElement("button");
      retractBtn.className = "room-chat-action-btn";
      retractBtn.type = "button";
      retractBtn.dataset.action = "retract";
      retractBtn.dataset.messageId = entry.messageId;
      retractBtn.textContent = tr("roomChatActionRetract");

      actions.appendChild(editBtn);
      actions.appendChild(retractBtn);
      item.appendChild(actions);
    }

    if (!entry.mine && !entry.retracted && entry.messageId) {
      const actions = document.createElement("div");
      actions.className = "room-chat-actions";

      const reportBtn = document.createElement("button");
      reportBtn.className = "room-chat-action-btn room-chat-action-danger";
      reportBtn.type = "button";
      reportBtn.dataset.action = "report";
      reportBtn.dataset.messageId = entry.messageId;
      reportBtn.textContent = tr("roomChatActionReport");
      actions.appendChild(reportBtn);

      if (roomSession.role === "host" && entry.senderId) {
        const muted = isPeerServerMuted(entry.senderId);
        const hostBtn = document.createElement("button");
        hostBtn.className = "room-chat-action-btn room-chat-action-host";
        hostBtn.type = "button";
        hostBtn.dataset.action = muted ? "host-unmute" : "host-mute";
        hostBtn.dataset.peerId = entry.senderId;
        hostBtn.dataset.senderName = entry.name;
        hostBtn.textContent = muted ? tr("roomChatActionHostUnmute") : tr("roomChatActionHostMute");
        actions.appendChild(hostBtn);
      }

      item.appendChild(actions);
    }

    roomChatLog.appendChild(item);
  });

  roomChatLog.scrollTop = hasRoomChatFilter() ? 0 : roomChatLog.scrollHeight;
}

function pushRoomChatMessage({ name, text, mine = false, ts = Date.now(), senderId = "", groupId = ROOM_CHAT_DEFAULT_GROUP_ID, groupName = "", messageId = "", editedAt = 0, retracted = false, retractedAt = 0 }) {
  const normalizedText = normalizeChatText(text);
  if (!normalizedText) return;
  const normalizedGroupId = normalizeChatGroupId(groupId);
  const resolvedGroup = upsertChatGroup({
    id: normalizedGroupId,
    label: normalizeChatGroupLabel(groupName) || chatGroupLabelById(normalizedGroupId),
  });

  roomSession.chatMessages.push({
    name: normalizeName(name || "Player"),
    text: normalizedText,
    mine: Boolean(mine),
    ts,
    senderId: typeof senderId === "string" ? senderId : "",
    messageId: typeof messageId === "string" && messageId ? messageId : generateChatMessageId(),
    editedAt: Number.isFinite(editedAt) ? editedAt : 0,
    retracted: Boolean(retracted),
    retractedAt: Number.isFinite(retractedAt) ? retractedAt : 0,
    groupId: normalizedGroupId,
    groupName: resolvedGroup?.label || chatGroupLabelById(normalizedGroupId),
  });

  if (roomSession.chatMessages.length > ROOM_CHAT_MAX_MESSAGES) {
    roomSession.chatMessages.splice(0, roomSession.chatMessages.length - ROOM_CHAT_MAX_MESSAGES);
  }

  saveRoomChatToStorage();
  saveRoomChatGroupStateToStorage();
  renderRoomChat();
}

function clearRoomChat() {
  if (roomChatInput) {
    roomChatInput.value = "";
    roomChatInput.focus();
  }
}

function sendRoomChat() {
  if (!roomSession.code || !roomSession.transport || !roomChatInput) return;
  if (Date.now() < roomSession.mutedUntil) {
    const seconds = Math.max(1, Math.ceil((roomSession.mutedUntil - Date.now()) / 1000));
    setLobbyMessage(tr("roomChatServerMuted", { seconds }));
    return;
  }
  const text = normalizeChatText(roomChatInput.value);
  if (!text) return;

  if (runChatCommand(text)) {
    roomChatInput.value = "";
    return;
  }

  const safety = checkOutgoingChatSafety(text);
  if (!safety.ok) {
    if (safety.reason === "fast") {
      setLobbyMessage(tr("roomChatRateLimitedFast"));
    } else if (safety.reason === "burst") {
      setLobbyMessage(tr("roomChatRateLimitedBurst"));
    } else {
      setLobbyMessage(tr("roomChatRateLimitedDuplicate"));
    }
    return;
  }

  const ts = Date.now();
  const currentGroupId = activeChatGroupId();
  const currentGroupName = chatGroupLabelById(currentGroupId);
  const dmTargetPeer = isDmGroupId(currentGroupId) ? extractPeerIdFromDmGroupId(currentGroupId) : "";

  if (dmTargetPeer) {
    const targetName = normalizeName(roomSession.participants.get(dmTargetPeer) || "Peer");
    const messageId = generateChatMessageId();
    pushRoomChatMessage({
      name: roomSession.playerName,
      text,
      mine: true,
      ts,
      senderId: peerId,
      groupId: currentGroupId,
      groupName: currentGroupName,
      messageId,
    });

    postRoomMessage({
      type: "chat",
      text,
      name: roomSession.playerName,
      ts,
      messageId,
      dm: true,
      to: dmTargetPeer,
      groupId: currentGroupId,
      groupName: currentGroupName,
    });
    setLobbyMessage(tr("roomChatDmSent", { name: targetName }));
    roomChatInput.value = "";
    return;
  }

  const messageId = generateChatMessageId();
  pushRoomChatMessage({
    name: roomSession.playerName,
    text,
    mine: true,
    ts,
    senderId: peerId,
    groupId: currentGroupId,
    groupName: currentGroupName,
    messageId,
  });

  postRoomMessage({
    type: "chat",
    text,
    name: roomSession.playerName,
    ts,
    messageId,
    groupId: currentGroupId,
    groupName: currentGroupName,
  });
  roomChatInput.value = "";
}

async function verifyCloudAuth(userId, password) {
  try {
    const { res, data } = await cloudApiRequest("/api/profile/load", { userId, password });
    if (res.ok && data?.ok !== false) {
      return { ok: true, profile: data?.profile || null };
    }
    if (data?.code === "INVALID_PASSWORD") {
      return { ok: false, reason: "duplicate" };
    }
    return { ok: false, reason: "failed" };
  } catch {
    return { ok: false, reason: "failed" };
  }
}

async function saveCloudProfile(userId, password, profile) {
  const { res, data } = await cloudApiRequest("/api/profile/save", { userId, password, profile });
  return Boolean(res.ok && data?.ok !== false);
}

async function syncPlayerNameToCloud(userId, password, baseProfile = null) {
  const name = normalizeName(playerNameInput?.value || localStorage.getItem(STORAGE_PLAYER_NAME_KEY) || "Player");
  setPlayerName(name);
  let profile = baseProfile && typeof baseProfile === "object" ? { ...baseProfile } : null;
  if (!profile) {
    const check = await verifyCloudAuth(userId, password);
    if (!check.ok) return false;
    profile = check.profile && typeof check.profile === "object" ? { ...check.profile } : {};
  }
  profile.playerName = name;
  try {
    return await saveCloudProfile(userId, password, profile);
  } catch {
    return false;
  }
}

function showOnly(screen) {
  entryScreen.classList.add("hidden");
  menuScreen.classList.add("hidden");
  lobbyScreen.classList.add("hidden");
  othelloScreen.classList.add("hidden");
  shogiScreen.classList.add("hidden");
  chessScreen.classList.add("hidden");
  unoScreen.classList.add("hidden");
  gomokuScreen.classList.add("hidden");
  survivorsScreen.classList.add("hidden");
  fitPuzzleScreen.classList.add("hidden");
  solitaireScreen.classList.add("hidden");
  screen.classList.remove("hidden");
  updateRoomChatVisibility();
}

function showEntryScreen() {
  showOnly(entryScreen);
}

function showMenuScreen() {
  showOnly(menuScreen);
}

function showLobbyScreen() {
  showOnly(lobbyScreen);
}

function showGameScreen(gameKey) {
  const screen = gameScreens[gameKey];
  if (!screen) return;
  showOnly(screen);
}

function updateRoomStatus({ roomCode, roomRole }) {
  if (!roomCode) {
    roomStatus.classList.add("hidden");
    roomCodeText.textContent = `${tr("labelRoom")}: -`;
    roomRoleText.textContent = `${tr("labelRole")}: -`;
    return;
  }

  roomStatus.classList.remove("hidden");
  roomCodeText.textContent = `${tr("labelRoom")}: ${roomCode}`;
  roomRoleText.textContent = `${tr("labelRole")}: ${roomRole === "host" ? tr("roleHost") : tr("roleGuest")} / ${roomSession.playerName}`;
}

function roomParticipantCount() {
  return roomSession.participants.size;
}

function otherParticipantNames() {
  return [...roomSession.participants.entries()]
    .filter(([id]) => id !== peerId)
    .map(([, name]) => name);
}

function localSupportedGameKeys() {
  return Object.keys(games || {});
}

function normalizeSupportedGames(raw) {
  if (!Array.isArray(raw)) return null;
  return [...new Set(
    raw
      .map((key) => String(key || "").trim())
      .filter((key) => key.length > 0)
      .slice(0, 64),
  )];
}

function setPeerSupportedGamesByPayload(peer, rawSupportedGames) {
  const normalized = normalizeSupportedGames(rawSupportedGames);
  if (!peer) return;
  if (!normalized) {
    roomSession.peerSupportedGames.delete(peer);
    return;
  }
  roomSession.peerSupportedGames.set(peer, new Set(normalized));
}

function setPeerChatGroupByPayload(peer, rawGroupId) {
  if (!peer) return;
  roomSession.peerChatGroups.set(peer, normalizeChatGroupId(rawGroupId));
}

function unsupportedPeerNamesForGame(gameKey) {
  const names = [];
  for (const [id, name] of roomSession.participants.entries()) {
    if (id === peerId) continue;
    const supported = roomSession.peerSupportedGames.get(id);
    if (!supported) continue;
    if (!supported.has(gameKey)) {
      names.push(name || id.slice(0, 8));
    }
  }
  return names;
}

function guardHostGameStart(gameKey) {
  const unsupportedPeers = unsupportedPeerNamesForGame(gameKey);
  if (unsupportedPeers.length === 0) return true;
  setLobbyMessage(tr("peerDoesNotSupportGame", {
    game: gameKey,
    peers: unsupportedPeers.join(", "),
  }));
  return false;
}

function syncRoomParticipantsToGame() {
  if (!roomSession.selectedGame) return;
  const controller = controllerOf(roomSession.selectedGame);
  if (!controller?.setRoomParticipants) return;
  controller.setRoomParticipants({ count: roomParticipantCount(), max: MAX_ROOM_PLAYERS });
}

function refreshRoomPresence() {
  const others = otherParticipantNames();
  roomSession.peerConnected = others.length > 0;
  roomSession.peerName = others.length > 0 ? (others.length === 1 ? others[0] : `${others[0]} +${others.length - 1}`) : null;
  updateLobbyView();
  syncRoomParticipantsToGame();
}

function updateLobbyView() {
  const code = roomSession.code ?? "-";
  const roleLabel = roomSession.role === "host" ? tr("roleHost") : roomSession.role === "guest" ? tr("roleGuest") : "-";
  const participants = roomSession.code ? Math.max(1, roomParticipantCount()) : 0;
  const peerLabel = roomSession.peerConnected
    ? tr("roomConnectedCount", { count: participants })
    : tr("roomWaitingCount", { count: participants });

  lobbyRoomCodeText.textContent = `${tr("labelRoom")}: ${code}`;
  lobbyRoleText.textContent = `${tr("labelRole")}: ${roleLabel}`;
  lobbySelfNameText.textContent = `${tr("labelYou")}: ${roomSession.playerName}`;
  lobbyPeerNameText.textContent = `${tr("labelPeer")}: ${roomSession.peerName ?? "-"}`;
  if (lobbyParticipantsText) {
    const memberNames = roomSession.code
      ? [...roomSession.participants.entries()]
        .map(([id, name]) => (id === peerId ? `${name} (${tr("labelYou")})` : name))
      : [];
    lobbyParticipantsText.textContent = `${tr("labelParticipants")}: ${memberNames.length > 0 ? memberNames.join(", ") : "-"}`;
  }
  lobbyPeerText.textContent = `${tr("labelStatus")}: ${peerLabel}`;

  const hostCanStart = roomSession.role === "host" && roomSession.peerConnected;
  lobbyStartConfigs.forEach(({ button }) => {
    if (button) button.disabled = !hostCanStart;
  });
}

function postRoomMessage(message) {
  if (!roomSession.transport) return;
  roomSession.transport.send(message);
}

function controllerOf(gameKey) {
  return games?.[gameKey]?.controller;
}

function reportUnsupportedGame(rawGameKey) {
  const key = String(rawGameKey || "-").slice(0, 24);
  const message = tr("unsupportedGameSelected", { game: key });
  setLobbyMessage(message);
  setMenuMessage(message);
}

function activeController() {
  return controllerOf(currentGameKey);
}

function configureAllStandardModes() {
  Object.values(games).forEach((entry) => {
    entry.controller.configureStandardMode("cpu");
  });
}

function closeRoom() {
  if (roomSession.transport) {
    postRoomMessage({ type: "leave" });
    roomSession.transport.close();
  }

  roomSession.code = null;
  roomSession.role = null;
  roomSession.transport = null;
  roomSession.transportKind = "none";
  roomSession.peerConnected = false;
  roomSession.selectedGame = null;
  roomSession.peerName = null;
  roomSession.mutedUntil = 0;
  roomSession.serverMutedPeers = new Map();
  roomSession.participants = new Map();
  roomSession.peerSupportedGames = new Map();
  roomSession.peerChatGroups = new Map();
  roomSession.chatMessages = [];
  roomSession.chatGroups = [getDefaultChatGroup()];
  roomSession.activeChatGroupId = ROOM_CHAT_DEFAULT_GROUP_ID;
  resetRoomChatModerationState();
  resetRoomChatFilter({ keepRendered: true });
  if (roomChatInput) roomChatInput.value = "";
  renderRoomChat();
  updateRoomChatVisibility();
  updateLobbyView();
  updateRoomStatus({ roomCode: null, roomRole: null });
}

function enterRoomGame(gameKey) {
  const controller = controllerOf(gameKey);
  if (!controller) {
    roomSession.selectedGame = null;
    reportUnsupportedGame(gameKey);
    showLobbyScreen();
    return;
  }

  currentGameKey = gameKey;
  roomSession.selectedGame = gameKey;

  const localPlayer = roomSession.role === "host" ? BLACK : WHITE;
  controller.configureRoomMode({
    roomCode: roomSession.code,
    roomRole: roomSession.role,
    roomPlayer: localPlayer,
    roomPlayerCount: Math.max(1, roomParticipantCount()),
    roomMaxPlayers: MAX_ROOM_PLAYERS,
  });

  showGameScreen(gameKey);

  if (roomSession.role === "host") {
    controller.setRoomLock({ locked: false, message: "" });
    controller.startNewGame();
  } else {
    controller.setRoomLock({ locked: true, message: tr("gameWaitHostStart") });
  }
}

function createGameCallbacks(gameKey) {
  return {
    onBackToMenu: () => {
      closeRoom();
      configureAllStandardModes();
      showMenuScreen();
    },
    onBackToLobby: () => {
      if (!roomSession.code) {
        closeRoom();
        configureAllStandardModes();
        showMenuScreen();
        return;
      }

      controllerOf(gameKey)?.enterStandby?.();
      roomSession.selectedGame = null;
      showLobbyScreen();
      updateLobbyView();

      if (roomSession.role === "host") {
        setLobbyMessage(roomSession.peerConnected ? tr("lobbyParticipantConnected") : tr("lobbyWaitPeer"));
      } else {
        setLobbyMessage(tr("lobbyJoinedWaitHost"));
      }
    },
    onRoomMove: (move) => {
      postRoomMessage({ type: "move", game: gameKey, move });
    },
    onRoomDrawVote: (payload) => {
      postRoomMessage({ type: "draw-vote", game: gameKey, payload });
    },
    onRoomNewGame: () => {
      const controller = controllerOf(gameKey);
      if (!controller) return;
      postRoomMessage({ type: "new-game", game: gameKey });
      postRoomMessage({ type: "snapshot", game: gameKey, snapshot: controller.getSnapshot() });
    },
    onRoomStatusChange: ({ roomCode, roomRole }) => {
      updateRoomStatus({ roomCode, roomRole });
    },
  };
}

games = {
  othello: {
    screen: othelloScreen,
    controller: initOthello(createGameCallbacks("othello")),
  },
  shogi: {
    screen: shogiScreen,
    controller: initShogi(createGameCallbacks("shogi")),
  },
  chess: {
    screen: chessScreen,
    controller: initChess(createGameCallbacks("chess")),
  },
  uno: {
    screen: unoScreen,
    controller: initUno(createGameCallbacks("uno")),
  },
  gomoku: {
    screen: gomokuScreen,
    controller: initGomoku(createGameCallbacks("gomoku")),
  },
  survivors: {
    screen: survivorsScreen,
    controller: initSurvivors(createGameCallbacks("survivors")),
  },
  fitPuzzle: {
    screen: fitPuzzleScreen,
    controller: initFitPuzzle(createGameCallbacks("fitPuzzle")),
  },
  solitaire: {
    screen: solitaireScreen,
    controller: initSolitaire(createGameCallbacks("solitaire")),
  },
};

function handleRoomMessage(payload, roomCode) {
  if (!payload || payload.from === peerId) return;
  if (payload.to && payload.to !== peerId) return;

  if (payload.type === "error") {
    const code = String(payload.code || "");
    setLobbyMessage(mapRoomServerErrorMessage(code, String(payload.detail || "")));
    return;
  }

  if (payload.type === "moderation-action") {
    handleModerationAction(payload);
    return;
  }

  if (payload.type === "room-state" && Array.isArray(payload.participants)) {
    const nextParticipants = new Map();
    const nextSupportedGames = new Map();
    const nextPeerChatGroups = new Map();
    payload.participants.forEach((entry) => {
      if (!entry || typeof entry.id !== "string") return;
      nextParticipants.set(entry.id, normalizeName(entry.name));
      const normalized = normalizeSupportedGames(entry.supportedGames);
      if (normalized) {
        nextSupportedGames.set(entry.id, new Set(normalized));
      }
      nextPeerChatGroups.set(entry.id, normalizeChatGroupId(entry.chatGroupId));
    });
    if (!nextParticipants.has(peerId)) {
      nextParticipants.set(peerId, roomSession.playerName);
    }
    nextPeerChatGroups.set(peerId, activeChatGroupId());
    roomSession.participants = nextParticipants;
    roomSession.peerSupportedGames = nextSupportedGames;
    roomSession.peerChatGroups = nextPeerChatGroups;
    refreshRoomPresence();
    renderRoomChat();
    if (!lobbyScreen.classList.contains("hidden")) {
      if (roomSession.role === "host") {
        setLobbyMessage(roomSession.peerConnected ? tr("lobbyParticipantConnected") : tr("lobbyWaitPeer"));
      } else {
        setLobbyMessage(roomSession.peerConnected ? tr("lobbyJoinedWaitHost") : tr("lobbyWaitPeer"));
      }
    }
    return;
  }

  if (payload.type === "hello") {
    const senderName = normalizeName(payload.name);
    const isKnown = roomSession.participants.has(payload.from);
    if (roomSession.role === "host" && !isKnown && roomParticipantCount() >= MAX_ROOM_PLAYERS) {
      postRoomMessage({ type: "room-full", to: payload.from, code: roomSession.code });
      setLobbyMessage(tr("lobbyRoomFull"));
      return;
    }

    roomSession.participants.set(payload.from, senderName);
    setPeerSupportedGamesByPayload(payload.from, payload.supportedGames);
    setPeerChatGroupByPayload(payload.from, payload.chatGroupId);
    mergeChatGroups(payload.chatGroups);
    saveRoomChatGroupStateToStorage();
    refreshRoomPresence();
    renderRoomChat();

    if (roomSession.role === "host") {
      setLobbyMessage(tr("lobbyParticipantConnected"));
    }

    sendRoomPresence();
    if (roomSession.role === "host" && roomSession.selectedGame) {
      if (guardHostGameStart(roomSession.selectedGame)) {
        postRoomMessage({ type: "select-game", game: roomSession.selectedGame });
      }
    }
    return;
  }

  if (payload.type === "presence") {
    roomSession.participants.set(payload.from, normalizeName(payload.name));
    setPeerSupportedGamesByPayload(payload.from, payload.supportedGames);
    setPeerChatGroupByPayload(payload.from, payload.chatGroupId);
    mergeChatGroups(payload.chatGroups);
    saveRoomChatGroupStateToStorage();
    refreshRoomPresence();
    renderRoomChat();
    if (roomSession.role === "host") {
      setLobbyMessage(tr("lobbyParticipantConnected"));
    }
    return;
  }

  if (payload.type === "chat-group-create" && payload.group) {
    const created = upsertChatGroup(payload.group);
    if (created) {
      saveRoomChatGroupStateToStorage();
      renderRoomChat();
    }
    return;
  }

  if (payload.type === "chat") {
    const text = normalizeChatText(payload.text);
    if (!text) return;

    const senderName = normalizeName(
      payload.name
      || roomSession.participants.get(payload.from)
      || roomSession.peerName
      || "Peer",
    );

    const dm = Boolean(payload.dm);
    const groupId = dm
      ? dmGroupIdForPeer(payload.from)
      : normalizeChatGroupId(payload.groupId);
    const groupName = dm
      ? `DM:${senderName}`
      : (normalizeChatGroupLabel(payload.groupName) || chatGroupLabelById(groupId));
    upsertChatGroup({ id: groupId, label: groupName });

    if (isMutedByName(senderName)) {
      return;
    }

    const incomingSafety = checkIncomingChatSafety(payload.from, text);
    if (!incomingSafety.ok) {
      if (incomingSafety.reason === "burst") {
        setLobbyMessage(tr("roomChatIncomingSuppressed", { name: senderName }));
      }
      return;
    }

    pushRoomChatMessage({
      name: senderName,
      text,
      mine: false,
      ts: Number.isFinite(payload.ts) ? payload.ts : Date.now(),
      senderId: typeof payload.from === "string" ? payload.from : "",
      messageId: typeof payload.messageId === "string" && payload.messageId ? payload.messageId : generateChatMessageId(),
      groupId,
      groupName,
    });
    return;
  }

  if (payload.type === "chat-edit") {
    const nextText = normalizeChatText(payload.text);
    if (!nextText) return;
    const messageId = typeof payload.messageId === "string" ? payload.messageId : "";
    applyChatEditById(messageId, nextText, {
      fromRemote: true,
      senderId: typeof payload.from === "string" ? payload.from : "",
    });
    return;
  }

  if (payload.type === "chat-retract") {
    const messageId = typeof payload.messageId === "string" ? payload.messageId : "";
    applyChatRetractById(messageId, {
      fromRemote: true,
      senderId: typeof payload.from === "string" ? payload.from : "",
    });
    return;
  }

  if (payload.type === "room-full") {
    if (roomSession.role === "guest") {
      const rejectedCode = payload.code || roomCode;
      closeRoom();
      configureAllStandardModes();
      showMenuScreen();
      setMenuMessage(tr("roomFullRejected", { code: rejectedCode }));
    }
    return;
  }

  if (payload.type === "leave") {
    roomSession.participants.delete(payload.from);
    roomSession.peerSupportedGames.delete(payload.from);
    roomSession.peerChatGroups.delete(payload.from);
    refreshRoomPresence();
    renderRoomChat();
    if (!lobbyScreen.classList.contains("hidden")) {
      setLobbyMessage(tr("lobbyPeerLeft"));
    }

    const selectedController = roomSession.selectedGame ? controllerOf(roomSession.selectedGame) : null;
    const inGameScreen = menuScreen.classList.contains("hidden") && lobbyScreen.classList.contains("hidden");
    if (selectedController && inGameScreen) {
      selectedController.setRoomLock({ locked: true, message: tr("gameWaitPeerReconnect") });
    }
    return;
  }

  if (payload.type === "select-game" && payload.game) {
    if (!controllerOf(payload.game)) {
      roomSession.selectedGame = null;
      reportUnsupportedGame(payload.game);
      showLobbyScreen();
      return;
    }
    roomSession.selectedGame = payload.game;
    enterRoomGame(payload.game);
    return;
  }

  if (payload.type === "new-game" && payload.game) {
    const controller = controllerOf(payload.game);
    if (!controller) {
      reportUnsupportedGame(payload.game);
      return;
    }
    controller.setRoomLock({ locked: false, message: "" });
    controller.startNewGame({ fromRemote: true });
    return;
  }

  if (payload.type === "snapshot" && payload.game && payload.snapshot) {
    const controller = controllerOf(payload.game);
    if (!controller) {
      reportUnsupportedGame(payload.game);
      return;
    }
    controller.applySnapshot(payload.snapshot);
    return;
  }

  if (payload.type === "move" && payload.game && payload.move) {
    const controller = controllerOf(payload.game);
    if (!controller) {
      reportUnsupportedGame(payload.game);
      return;
    }
    controller.applyRemoteMove({ ...payload.move, remoteId: payload.from });
    return;
  }

  if (payload.type === "draw-vote" && payload.game && payload.payload) {
    const controller = controllerOf(payload.game);
    if (!controller) {
      reportUnsupportedGame(payload.game);
      return;
    }
    controller.applyRemoteDrawVote?.(payload.payload);
  }
}

async function attachRoom(roomCode, role, playerName) {
  closeRoom();

  roomSession.code = roomCode;
  roomSession.role = role;
  roomSession.transport = null;
  roomSession.transportKind = "none";
  roomSession.peerConnected = false;
  roomSession.selectedGame = null;
  roomSession.playerName = playerName;
  roomSession.peerName = null;
  roomSession.mutedUntil = 0;
  roomSession.serverMutedPeers = new Map();
  roomSession.participants = new Map([[peerId, playerName]]);
  const loadedGroupState = loadRoomChatGroupStateFromStorage(roomCode);
  roomSession.chatGroups = loadedGroupState.groups;
  roomSession.activeChatGroupId = loadedGroupState.activeGroupId;
  roomSession.peerChatGroups = new Map([[peerId, roomSession.activeChatGroupId]]);
  roomSession.chatMessages = loadRoomChatFromStorage(roomCode);

  refreshRoomPresence();
  saveRoomChatToStorage();
  saveRoomChatGroupStateToStorage();
  showLobbyScreen();

  if (role === "host") {
    setLobbyMessage(tr("lobbyWaitPeer"));
  } else {
    setLobbyMessage(tr("lobbyJoinedWaitHost"));
  }

  const transport = await createRoomTransport({
    roomCode,
    peerId,
    serverUrl: roomServerUrl,
    onMessage: (payload) => handleRoomMessage(payload, roomCode),
  });

  if (roomSession.code !== roomCode || roomSession.role !== role) {
    transport.close();
    return;
  }

  roomSession.transport = transport;
  roomSession.transportKind = transport.kind;
  roomSession.chatMessages = loadRoomChatFromStorage(roomCode);
  saveRoomChatToStorage();
  saveRoomChatGroupStateToStorage();
  renderRoomChat();
  updateRoomChatVisibility();

  postRoomMessage({
    type: "hello",
    name: roomSession.playerName,
    supportedGames: localSupportedGameKeys(),
    chatGroupId: activeChatGroupId(),
    chatGroups: roomChatGroupsForPayload(),
  });
  setMenuMessage(tr("menuRoomConnected", { code: roomCode }));
}

function startRoomGameAsHost(gameKey) {
  if (roomSession.role !== "host") return;
  if (!roomSession.peerConnected) {
    setLobbyMessage(tr("lobbyNoPeer"));
    return;
  }
  if (!guardHostGameStart(gameKey)) {
    return;
  }

  roomSession.selectedGame = gameKey;
  postRoomMessage({ type: "select-game", game: gameKey });
  enterRoomGame(gameKey);
}

playOthelloBtn?.addEventListener("click", () => {
  closeRoom();
  configureAllStandardModes();
  currentGameKey = "othello";
  showGameScreen("othello");
  controllerOf("othello")?.enterStandby?.();
});

playShogiBtn?.addEventListener("click", () => {
  closeRoom();
  configureAllStandardModes();
  currentGameKey = "shogi";
  showGameScreen("shogi");
  controllerOf("shogi")?.enterStandby?.();
});

playChessBtn?.addEventListener("click", () => {
  closeRoom();
  configureAllStandardModes();
  currentGameKey = "chess";
  showGameScreen("chess");
  controllerOf("chess")?.enterStandby?.();
});

playUnoBtn?.addEventListener("click", () => {
  closeRoom();
  configureAllStandardModes();
  currentGameKey = "uno";
  showGameScreen("uno");
  controllerOf("uno")?.enterStandby?.();
});

playGomokuBtn?.addEventListener("click", () => {
  closeRoom();
  configureAllStandardModes();
  currentGameKey = "gomoku";
  showGameScreen("gomoku");
  controllerOf("gomoku")?.enterStandby?.();
});

playSurvivorsBtn?.addEventListener("click", () => {
  closeRoom();
  configureAllStandardModes();
  currentGameKey = "survivors";
  showGameScreen("survivors");
  controllerOf("survivors")?.enterStandby?.();
});

playFitPuzzleBtn?.addEventListener("click", () => {
  closeRoom();
  configureAllStandardModes();
  currentGameKey = "fitPuzzle";
  showGameScreen("fitPuzzle");
  controllerOf("fitPuzzle")?.enterStandby?.();
});

playSolitaireSingleBtn?.addEventListener("click", () => {
  closeRoom();
  configureAllStandardModes();
  currentGameKey = "solitaire";
  showGameScreen("solitaire");
  const solitaireController = controllerOf("solitaire");
  solitaireController?.configureStandardMode?.();
  solitaireController?.enterStandby?.();
});

playSolitaireMultiBtn?.addEventListener("click", () => {
  const playerName = normalizeName(playerNameInput?.value);
  if (playerNameInput) playerNameInput.value = playerName;

  const code = generateRoomCode();
  roomCodeInput.value = code;
  void attachRoom(code, "host", playerName);
  setLobbyMessage(tr("lobbyWaitPeer"));
});

createRoomBtn?.addEventListener("click", () => {
  const playerName = normalizeName(playerNameInput?.value);
  if (playerNameInput) playerNameInput.value = playerName;

  const code = generateRoomCode();
  roomCodeInput.value = code;
  void attachRoom(code, "host", playerName);
});

joinRoomBtn?.addEventListener("click", () => {
  const playerName = normalizeName(playerNameInput?.value);
  if (playerNameInput) playerNameInput.value = playerName;

  const code = normalizeRoomCode(roomCodeInput.value);
  if (code.length !== 6) {
    setMenuMessage(tr("roomCodeInvalid"));
    return;
  }

  void attachRoom(code, "guest", playerName);
  setMenuMessage(tr("menuRoomJoined", { code }));
});

lobbyStartConfigs.forEach(({ gameKey, button }) => {
  button?.addEventListener("click", () => {
    startRoomGameAsHost(gameKey);
  });
});

lobbyBackBtn?.addEventListener("click", () => {
  closeRoom();
  configureAllStandardModes();
  showMenuScreen();
});

roomChatSendBtn?.addEventListener("click", () => {
  sendRoomChat();
});

roomChatInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  sendRoomChat();
});

roomChatClearBtn?.addEventListener("click", () => {
  clearRoomChat();
});

roomChatGroupSelect?.addEventListener("change", () => {
  setActiveChatGroup(roomChatGroupSelect.value);
});

roomChatGroupCreateBtn?.addEventListener("click", () => {
  createRoomChatGroup();
});

roomChatGroupNameInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  createRoomChatGroup();
});

roomChatSearchDateInput?.addEventListener("input", () => {
  syncRoomChatFilterFromInputs();
  renderRoomChat();
});

roomChatSearchWordInput?.addEventListener("input", () => {
  syncRoomChatFilterFromInputs();
  renderRoomChat();
});

roomChatSearchClearBtn?.addEventListener("click", () => {
  resetRoomChatFilter();
  if (roomChatSearchWordInput) roomChatSearchWordInput.focus();
});

roomChatLog?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const btn = target.closest(".room-chat-action-btn");
  if (!(btn instanceof HTMLButtonElement)) return;

  const messageId = String(btn.dataset.messageId || "");
  const action = String(btn.dataset.action || "");
  if (!messageId || !action) return;

  if (action === "edit") {
    const idx = findChatMessageIndexById(messageId);
    if (idx < 0) return;
    const entry = roomSession.chatMessages[idx];
    if (!entry || entry.retracted) return;
    if (!canMutateMessageInWindow(entry)) {
      setLobbyMessage(tr("roomChatEditWindowExpired"));
      return;
    }
    const nextTextRaw = window.prompt(tr("roomChatEditUsage"), entry.text);
    if (nextTextRaw == null) return;
    const nextText = normalizeChatText(nextTextRaw);
    if (!nextText) {
      setLobbyMessage(tr("roomChatEditUsage"));
      return;
    }
    if (!applyChatEditById(messageId, nextText)) {
      setLobbyMessage(tr("roomChatEditNoTarget"));
      return;
    }
    postRoomMessage({
      type: "chat-edit",
      messageId,
      text: nextText,
      groupId: entry.groupId,
    });
    return;
  }

  if (action === "retract") {
    if (!canUseRetractNow()) {
      setLobbyMessage(tr("roomChatRetractCooldown"));
      return;
    }
    const idx = findChatMessageIndexById(messageId);
    if (idx < 0) return;
    const entry = roomSession.chatMessages[idx];
    if (!entry || entry.retracted) return;
    if (!canMutateMessageInWindow(entry)) {
      setLobbyMessage(tr("roomChatEditWindowExpired"));
      return;
    }
    if (!applyChatRetractById(messageId)) {
      setLobbyMessage(tr("roomChatRetractNoTarget"));
      return;
    }
    roomChatModeration.lastRetractAt = Date.now();
    postRoomMessage({
      type: "chat-retract",
      messageId,
      groupId: entry.groupId,
    });
    return;
  }

  if (action === "report") {
    const reasonRaw = window.prompt(tr("roomChatReportPrompt"), "");
    if (reasonRaw == null) return;
    const reason = String(reasonRaw || "").trim().slice(0, 60);
    postRoomMessage({
      type: "chat-report",
      messageId,
      reason,
    });
    setLobbyMessage(tr("roomChatReportSent"));
    return;
  }

  if (action === "host-mute") {
    if (roomSession.role !== "host") {
      setLobbyMessage(tr("roomChatServerHostOnly"));
      return;
    }
    const targetPeerId = String(btn.dataset.peerId || "").trim();
    if (!targetPeerId) {
      setLobbyMessage(tr("roomChatServerTargetRequired"));
      return;
    }
    postRoomMessage({
      type: "host-mute",
      target: targetPeerId,
    });
    return;
  }

  if (action === "host-unmute") {
    if (roomSession.role !== "host") {
      setLobbyMessage(tr("roomChatServerHostOnly"));
      return;
    }
    const targetPeerId = String(btn.dataset.peerId || "").trim();
    if (!targetPeerId) {
      setLobbyMessage(tr("roomChatServerTargetRequired"));
      return;
    }
    postRoomMessage({
      type: "host-unmute",
      target: targetPeerId,
    });
  }
});

roomCodeInput?.addEventListener("input", () => {
  roomCodeInput.value = normalizeRoomCode(roomCodeInput.value);
});

playerNameInput?.addEventListener("blur", () => {
  const normalized = normalizeName(playerNameInput.value);
  setPlayerName(normalized);
  const auth = getCloudAuthFromStorage();
  if (auth) {
    void syncPlayerNameToCloud(auth.userId, auth.password);
  }
});

langSelect?.addEventListener("change", () => {
  setLanguage(langSelect.value);
});

entryLoginBtn?.addEventListener("click", async () => {
  setEntryActionButtonsVisible(false);

  const userId = String(entryCloudUserIdInput?.value || "").trim();
  const password = String(entryCloudPasswordInput?.value || "");
  if (!userId || !password) {
    setEntryMessage(tr("cloudAuthInvalid"));
    setEntryActionButtonsVisible(true);
    return;
  }

  if (!window.confirm(tr("loginConfirmPrompt"))) {
    setEntryMessage(tr("loginCanceled"));
    setEntryActionButtonsVisible(true);
    return;
  }

  const check = await verifyCloudAuth(userId, password);
  if (!check.ok) {
    setEntryMessage(tr(check.reason === "duplicate" ? "cloudIdDuplicateWarn" : "cloudCheckFailed"));
    setEntryActionButtonsVisible(true);
    return;
  }

  const cloudName = check.profile?.playerName ? normalizeName(check.profile.playerName) : "";
  if (cloudName) {
    setPlayerName(cloudName);
  } else {
    await syncPlayerNameToCloud(userId, password, check.profile);
  }

  localStorage.setItem(STORAGE_CLOUD_USER_ID_KEY, userId);
  localStorage.setItem(STORAGE_CLOUD_PASSWORD_KEY, password);
  if (cloudUserIdInput) cloudUserIdInput.value = userId;
  if (cloudPasswordInput) cloudPasswordInput.value = password;
  setEntryMessage("");
  showMenuScreen();
  setMenuMessage(tr("cloudAuthSaved"));
});

entryGuestBtn?.addEventListener("click", () => {
  setEntryActionButtonsVisible(false);

  if (!window.confirm(tr("guestConfirmPrompt"))) {
    setEntryMessage(tr("guestCanceled"));
    setEntryActionButtonsVisible(true);
    return;
  }

  localStorage.removeItem(STORAGE_CLOUD_USER_ID_KEY);
  localStorage.removeItem(STORAGE_CLOUD_PASSWORD_KEY);
  if (entryCloudUserIdInput) entryCloudUserIdInput.value = "";
  if (entryCloudPasswordInput) entryCloudPasswordInput.value = "";
  if (cloudUserIdInput) cloudUserIdInput.value = "";
  if (cloudPasswordInput) cloudPasswordInput.value = "";
  setEntryMessage("");
  showMenuScreen();
  setMenuMessage(tr("entryGuestSelected"));
});

saveCloudAuthBtn?.addEventListener("click", async () => {
  const userId = String(cloudUserIdInput?.value || "").trim();
  const password = String(cloudPasswordInput?.value || "");
  if (!userId || !password) {
    setMenuMessage(tr("cloudAuthInvalid"));
    return;
  }

  const check = await verifyCloudAuth(userId, password);
  if (!check.ok) {
    setMenuMessage(tr(check.reason === "duplicate" ? "cloudIdDuplicateWarn" : "cloudCheckFailed"));
    return;
  }

  const cloudName = check.profile?.playerName ? normalizeName(check.profile.playerName) : "";
  if (cloudName) {
    setPlayerName(cloudName);
  } else {
    await syncPlayerNameToCloud(userId, password, check.profile);
  }

  localStorage.setItem(STORAGE_CLOUD_USER_ID_KEY, userId);
  localStorage.setItem(STORAGE_CLOUD_PASSWORD_KEY, password);
  if (entryCloudUserIdInput) entryCloudUserIdInput.value = userId;
  if (entryCloudPasswordInput) entryCloudPasswordInput.value = password;
  setMenuMessage(tr("cloudAuthSaved"));
});

backToEntryBtn?.addEventListener("click", () => {
  if (!window.confirm(tr("confirmBackToLogin"))) {
    return;
  }
  closeRoom();
  configureAllStandardModes();
  setMenuMessage("");
  setEntryActionButtonsVisible(true);
  showEntryScreen();
});

const initialLang = "ja";
if (langSelect) langSelect.value = initialLang;
setLanguage(initialLang);
ensureBrandedUrlHash();

if (cloudUserIdInput) {
  cloudUserIdInput.value = localStorage.getItem(STORAGE_CLOUD_USER_ID_KEY) || "";
}
if (cloudPasswordInput) {
  cloudPasswordInput.value = localStorage.getItem(STORAGE_CLOUD_PASSWORD_KEY) || "";
}
if (entryCloudUserIdInput) {
  entryCloudUserIdInput.value = localStorage.getItem(STORAGE_CLOUD_USER_ID_KEY) || "";
}
if (entryCloudPasswordInput) {
  entryCloudPasswordInput.value = localStorage.getItem(STORAGE_CLOUD_PASSWORD_KEY) || "";
}

setPlayerName(localStorage.getItem(STORAGE_PLAYER_NAME_KEY) || "Player");
setEntryActionButtonsVisible(true);

setInterval(() => {
  if (!roomSession.code || roomSession.role !== "host") return;
  renderHostMutePanel();
}, 1000);

updateLobbyView();
renderRoomChat();
updateRoomChatVisibility();
showEntryScreen();
