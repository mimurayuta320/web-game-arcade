import "./styles/main.css";
import { initGame as initOthello } from "./scripts/game.js";
import { initShogi } from "./scripts/shogi.js";
import { initChess } from "./scripts/chess.js";
import { initUno } from "./scripts/uno.js";
import { initGomoku } from "./scripts/gomoku.js";
import { initSurvivors } from "./scripts/survivors.js";
import { initFitPuzzle } from "./scripts/fitPuzzle.js";
import { initSolitaire } from "./scripts/solitaire.js";
import { cloudApiCandidates } from "./scripts/cloudApiClient.js";
import { createRoomTransport, resolveRoomServerUrl } from "./scripts/roomTransport.js";

const STORAGE_LANG_KEY = "neon-arcade-lang";
const STORAGE_CLOUD_USER_ID_KEY = "neon-cloud-user-id";
const STORAGE_CLOUD_PASSWORD_KEY = "neon-cloud-password";
const STORAGE_PLAYER_NAME_KEY = "neon-player-name";
const STORAGE_ROOM_SERVER_URL_KEY = "neon-room-server-url";
const STORAGE_ROOM_PUBLIC_KEY = "neon-room-public";
const ROOM_SERVER_QUERY_PARAM_KEY = "roomServer";
const ROOM_CODE_QUERY_PARAM_KEY = "roomCode";
const ROOM_INVITE_TOKEN_QUERY_PARAM_KEY = "inviteToken";
const DEFAULT_ROOM_SERVER_URL = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host || "localhost"}/room`;
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
const quickMatchBtn = document.getElementById("quickMatchBtn");
const roomPublicToggle = document.getElementById("roomPublicToggle");
const roomPublicLabel = document.getElementById("roomPublicLabel");
const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const spectateRoomBtn = document.getElementById("spectateRoomBtn");
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
const lobbyPeerText = document.getElementById("lobbyPeerText");
const lobbyConnectionText = document.getElementById("lobbyConnectionText");
const spectatorBadge = document.getElementById("spectatorBadge");
const lobbyMessage = document.getElementById("lobbyMessage");
const lobbyStartOthelloBtn = document.getElementById("lobbyStartOthelloBtn");
const lobbyStartShogiBtn = document.getElementById("lobbyStartShogiBtn");
const lobbyStartChessBtn = document.getElementById("lobbyStartChessBtn");
const lobbyStartUnoBtn = document.getElementById("lobbyStartUnoBtn");
const lobbyStartGomokuBtn = document.getElementById("lobbyStartGomokuBtn");
const lobbyStartSurvivorsBtn = document.getElementById("lobbyStartSurvivorsBtn");
const lobbyStartSolitaireBtn = document.getElementById("lobbyStartSolitaireBtn");
const lobbyBackBtn = document.getElementById("lobbyBackBtn");
const copyInviteLinkBtn = document.getElementById("copyInviteLinkBtn");
const globalRematchBtn = document.getElementById("globalRematchBtn");
const spectatorChatPanel = document.getElementById("spectatorChatPanel");
const spectatorChatLog = document.getElementById("spectatorChatLog");
const spectatorChatInput = document.getElementById("spectatorChatInput");
const spectatorChatSendBtn = document.getElementById("spectatorChatSendBtn");

const roomStatus = document.getElementById("roomStatus");
const roomCodeText = document.getElementById("roomCodeText");
const roomRoleText = document.getElementById("roomRoleText");
const langSelect = document.getElementById("langSelect");

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
    spectateJoin: "観戦参加",
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
    quickMatchMulti: "クイックマッチ（マルチ）",
    quickMatchSearching: "マルチプレイの相手を検索中...",
    quickMatchConnected: "クイックマッチに接続しました（ルーム {code}）",
    quickMatchPrivateSkipped: "非公開ルームに当たったため、別のマッチを検索します...",
    roomReconnecting: "接続が切れました。再接続中... ({count})",
    roomReconnected: "再接続に成功しました",
    rematchNow: "即再戦",
    rematchApproveNow: "再戦に同意",
    rematchWithdrawNow: "同意を取り消す",
    rematchVoteWaiting: "再戦の同意待ち... ({count}/{need})",
    rematchVoteReady: "全員同意で再戦を開始します",
    inviteTokenRequired: "この非公開ルームへの参加には招待リンクが必要です",
    inviteTokenIssueFailed: "招待トークンの発行に失敗しました",
    spectatorBadge: "観戦中",
    spectatorChatTitle: "観戦チャット",
    spectatorChatPlaceholder: "観戦コメントを入力",
    spectatorChatSend: "送信",
    spectatorChatEmpty: "まだコメントはありません",
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
    roomPublicToggle: "公開ルーム（クイックマッチ対象）",
    roomPrivateToggle: "非公開ルーム（招待のみ）",
    roomWaiting: "参加者待機中",
    roomConnected: "相手が参加しました",
    roomWaitingCount: "参加者 {count} / 8",
    roomConnectedCount: "参加者 {count} / 8",
    roomFullRejected: "ルーム {code} は満員です（8人まで）",
    menuRoomConnected: "ルーム {code} に接続しました",
    menuRoomJoined: "ルーム {code} へ参加しました",
    menuRoomSpectate: "ルーム {code} を観戦中です",
    roomInGameSuggestSpectate: "対戦中のため参加できません。観戦参加を使ってください。",
    roomCodeInvalid: "6桁のルーム番号を入力してください",
    copyInviteLink: "招待リンクをコピー",
    inviteLinkCopied: "招待リンクをコピーしました",
    inviteLinkCopyFailed: "招待リンクのコピーに失敗しました",
    lobbyWaitPeer: "相手の参加を待っています...",
    lobbyJoinedWaitHost: "ルームに参加しました。ホストのゲーム選択を待っています...",
    lobbyParticipantConnected: "参加者が接続しました。ゲームを選択してください。",
    lobbyPromotedHost: "ホストが退出したため、あなたがホストになりました。",
    lobbyPeerLeft: "相手が退出しました。再接続を待っています...",
    lobbyRoomFull: "ルームが満員です（8人）",
    gameWaitHostStart: "ホストの開始を待っています...",
    gameWaitPeerReconnect: "相手の再接続を待っています...",
    lobbyNoPeer: "参加者がまだ接続していません。",
    roleHost: "ホスト",
    roleGuest: "ゲスト",
    roleSpectator: "観戦",
    spectatorReadOnly: "観戦中です。試合には参加できません。",
    labelRoom: "ルーム",
    labelRole: "役割",
    labelYou: "あなた",
    labelPeer: "相手",
    labelStatus: "状態",
    labelConnection: "通信",
    connectionConnecting: "接続中",
    connectionConnected: "オンライン",
    connectionReconnecting: "再接続中",
    connectionFallback: "ローカル接続",
    connectionOffline: "オフライン",
    gameSelectTitle: "ゲーム選択",
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
    spectateJoin: "관전 참가",
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
    quickMatchMulti: "빠른 매치 (멀티)",
    quickMatchSearching: "멀티 플레이 상대를 찾는 중...",
    quickMatchConnected: "빠른 매치에 연결했습니다 (룸 {code})",
    quickMatchPrivateSkipped: "비공개 룸이어서 다른 매치를 찾는 중...",
    roomReconnecting: "연결이 끊겨 재접속 중... ({count})",
    roomReconnected: "재접속에 성공했습니다",
    rematchNow: "즉시 재대전",
    rematchApproveNow: "재대전 동의",
    rematchWithdrawNow: "동의 취소",
    rematchVoteWaiting: "재대전 동의 대기... ({count}/{need})",
    rematchVoteReady: "전원 동의로 재대전을 시작합니다",
    inviteTokenRequired: "이 비공개 룸은 초대 링크가 필요합니다",
    inviteTokenIssueFailed: "초대 토큰 발급에 실패했습니다",
    spectatorBadge: "관전 중",
    spectatorChatTitle: "관전 채팅",
    spectatorChatPlaceholder: "관전 코멘트를 입력",
    spectatorChatSend: "전송",
    spectatorChatEmpty: "아직 코멘트가 없습니다",
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
    roomPublicToggle: "공개 룸 (빠른 매치 대상)",
    roomPrivateToggle: "비공개 룸 (초대 전용)",
    roomWaiting: "참가자 대기 중",
    roomConnected: "상대가 참가했습니다",
    roomWaitingCount: "참가자 {count} / 8",
    roomConnectedCount: "참가자 {count} / 8",
    roomFullRejected: "룸 {code} 은(는) 가득 찼습니다 (최대 8명)",
    menuRoomConnected: "룸 {code} 에 연결했습니다",
    menuRoomJoined: "룸 {code} 에 참가했습니다",
    menuRoomSpectate: "룸 {code} 관전 중",
    roomInGameSuggestSpectate: "경기 중이라 참가할 수 없습니다. 관전 참가를 이용하세요.",
    roomCodeInvalid: "6자리 룸 번호를 입력하세요",
    copyInviteLink: "초대 링크 복사",
    inviteLinkCopied: "초대 링크를 복사했습니다",
    inviteLinkCopyFailed: "초대 링크 복사에 실패했습니다",
    lobbyWaitPeer: "상대의 참가를 기다리는 중...",
    lobbyJoinedWaitHost: "룸에 참가했습니다. 호스트의 게임 선택을 기다리는 중...",
    lobbyParticipantConnected: "참가자가 연결되었습니다. 게임을 선택하세요.",
    lobbyPromotedHost: "호스트가 나가서 이제 당신이 호스트입니다.",
    lobbyPeerLeft: "상대가 나갔습니다. 재접속을 기다리는 중...",
    lobbyRoomFull: "룸이 가득 찼습니다 (8명)",
    gameWaitHostStart: "호스트 시작을 기다리는 중...",
    gameWaitPeerReconnect: "상대 재접속을 기다리는 중...",
    lobbyNoPeer: "아직 참가자가 연결되지 않았습니다.",
    roleHost: "HOST",
    roleGuest: "GUEST",
    roleSpectator: "SPECTATOR",
    spectatorReadOnly: "관전 중입니다. 경기에는 참가할 수 없습니다.",
    labelRoom: "ROOM",
    labelRole: "ROLE",
    labelYou: "YOU",
    labelPeer: "PEER",
    labelStatus: "STATUS",
    labelConnection: "CONNECTION",
    connectionConnecting: "CONNECTING",
    connectionConnected: "ONLINE",
    connectionReconnecting: "RECONNECTING",
    connectionFallback: "LOCAL LINK",
    connectionOffline: "OFFLINE",
    gameSelectTitle: "게임 선택",
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
  if (quickMatchBtn) quickMatchBtn.textContent = tr("quickMatchMulti");
  if (roomPublicLabel) {
    roomPublicLabel.textContent = roomPublicToggle?.checked ? tr("roomPublicToggle") : tr("roomPrivateToggle");
  }
  if (createRoomBtn) createRoomBtn.textContent = tr("createRoom");
  if (joinRoomBtn) joinRoomBtn.textContent = tr("join");
  if (spectateRoomBtn) spectateRoomBtn.textContent = tr("spectateJoin");
  if (entryLoginBtn) entryLoginBtn.textContent = tr("loginAndPlay");
  if (entryGuestBtn) entryGuestBtn.textContent = tr("playAsGuest");
  if (saveCloudAuthBtn) saveCloudAuthBtn.textContent = tr("saveCloudAuth");
  if (backToEntryBtn) backToEntryBtn.textContent = tr("backToLogin");
  if (lobbyStartOthelloBtn) lobbyStartOthelloBtn.textContent = tr("othelloStart");
  if (lobbyStartShogiBtn) lobbyStartShogiBtn.textContent = tr("shogiStart");
  if (lobbyStartChessBtn) lobbyStartChessBtn.textContent = tr("chessStart");
  if (lobbyStartUnoBtn) lobbyStartUnoBtn.textContent = tr("unoStart");
  if (lobbyStartGomokuBtn) lobbyStartGomokuBtn.textContent = tr("gomokuStart");
  if (lobbyStartSurvivorsBtn) lobbyStartSurvivorsBtn.textContent = tr("survivorsStart");
  if (lobbyStartSolitaireBtn) lobbyStartSolitaireBtn.textContent = tr("solitaireStart");
  if (lobbyBackBtn) lobbyBackBtn.textContent = tr("backToMenu");
  if (copyInviteLinkBtn) copyInviteLinkBtn.textContent = tr("copyInviteLink");
  if (globalRematchBtn) globalRematchBtn.textContent = tr("rematchApproveNow");
  if (spectatorBadge) spectatorBadge.textContent = tr("spectatorBadge");
  setTextById("spectatorChatTitle", tr("spectatorChatTitle"));
  if (spectatorChatInput) spectatorChatInput.placeholder = tr("spectatorChatPlaceholder");
  if (spectatorChatSendBtn) spectatorChatSendBtn.textContent = tr("spectatorChatSend");

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
  updateConnectionText();
}

function setLanguage(lang) {
  currentLang = messages[lang] ? lang : "ja";
  localStorage.setItem(STORAGE_LANG_KEY, currentLang);
  applyStaticTranslations();
  updateLobbyView();
  updateRoomStatus({ roomCode: roomSession.code, roomRole: roomSession.role });
}

const BLACK = 1;
const WHITE = 2;
const peerId = (crypto.randomUUID && crypto.randomUUID()) || String(Date.now() + Math.random());
const MAX_ROOM_PLAYERS = 8;
const ROOM_RECONNECT_BASE_DELAY_MS = 1200;
const ROOM_RECONNECT_MAX_DELAY_MS = 9000;
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
  participants: new Map(),
  spectatorIds: new Set(),
  connectionState: "offline",
  reconnectAttempt: 0,
  reconnectTimerId: 0,
  manualDisconnect: false,
  quickMatchMode: false,
  roomVisibility: "public",
  activeGame: null,
  spectateIntent: false,
  pendingInviteToken: "",
  rematchVotes: new Set(),
  spectatorChatMessages: [],
};

let inviteTokenRequestResolve = null;

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

function generateRoomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateQuickMatchCode(slotOffset = 0) {
  const slot = Math.floor(Date.now() / 30000) + Number(slotOffset || 0);
  const normalized = ((slot % 900000) + 900000) % 900000;
  return String(100000 + normalized).slice(0, 6);
}

function ensureBrandedUrlHash() {
  if (typeof window === "undefined") return;
  const current = String(window.location.hash || "");
  if (current.toLowerCase() === `#${APP_URL_TAG.toLowerCase()}`) return;
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${APP_URL_TAG}`);
}

function roomServerUrlForInvite() {
  if (roomSession.transportKind === "websocket") {
    const endpoint = String(roomSession.transport?.endpoint || "").trim();
    if (endpoint) return endpoint;
  }
  return roomServerUrl;
}

function buildInviteUrl(roomCode) {
  const url = new URL(window.location.href);
  url.hash = `#${APP_URL_TAG}`;
  url.searchParams.set(ROOM_CODE_QUERY_PARAM_KEY, roomCode);

  const endpoint = roomServerUrlForInvite();
  if (endpoint) {
    url.searchParams.set(ROOM_SERVER_QUERY_PARAM_KEY, endpoint);
  }
  if (roomSession.pendingInviteToken) {
    url.searchParams.set(ROOM_INVITE_TOKEN_QUERY_PARAM_KEY, roomSession.pendingInviteToken);
  } else {
    url.searchParams.delete(ROOM_INVITE_TOKEN_QUERY_PARAM_KEY);
  }
  return url.toString();
}

function stripInviteTokenFromAddressBar() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has(ROOM_INVITE_TOKEN_QUERY_PARAM_KEY)) return;
  url.searchParams.delete(ROOM_INVITE_TOKEN_QUERY_PARAM_KEY);
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

async function copyInviteUrl(roomCode) {
  if (roomSession.role === "host" && roomSession.roomVisibility === "private") {
    const token = await requestInviteToken(roomCode);
    if (!token) {
      setLobbyMessage(tr("inviteTokenIssueFailed"));
      return false;
    }
  }
  const text = buildInviteUrl(roomCode);
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to manual copy prompt
  }
  return Boolean(window.prompt("Copy URL", text));
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

function connectionLabel() {
  if (roomSession.connectionState === "connecting") return tr("connectionConnecting");
  if (roomSession.connectionState === "connected") return tr("connectionConnected");
  if (roomSession.connectionState === "reconnecting") return tr("connectionReconnecting");
  if (roomSession.connectionState === "fallback") return tr("connectionFallback");
  return tr("connectionOffline");
}

function updateConnectionText() {
  if (!lobbyConnectionText) return;
  lobbyConnectionText.textContent = `${tr("labelConnection")}: ${connectionLabel()}`;
}

function renderSpectatorBadge() {
  if (!spectatorBadge) return;
  const visible = Boolean(roomSession.code) && roomSession.role === "spectator";
  spectatorBadge.classList.toggle("hidden", !visible);
}

function renderSpectatorChat() {
  if (!spectatorChatPanel || !spectatorChatLog) return;
  const visible = Boolean(roomSession.code) && roomSession.role === "spectator";
  spectatorChatPanel.classList.toggle("hidden", !visible);
  spectatorChatLog.innerHTML = "";
  if (!visible) return;
  if (!roomSession.spectatorChatMessages.length) {
    const empty = document.createElement("p");
    empty.className = "spectator-chat-empty";
    empty.textContent = tr("spectatorChatEmpty");
    spectatorChatLog.appendChild(empty);
    return;
  }

  roomSession.spectatorChatMessages.slice(-40).forEach((message) => {
    const row = document.createElement("p");
    row.className = "spectator-chat-item";
    row.textContent = `${message.name}: ${message.text}`;
    spectatorChatLog.appendChild(row);
  });
  spectatorChatLog.scrollTop = spectatorChatLog.scrollHeight;
}

function setRematchVoteMessage(count, need) {
  if (!roomSession.code || !roomSession.activeGame || isSpectator()) return;
  if (count >= need && need > 0) {
    setLobbyMessage(tr("rematchVoteReady"));
    return;
  }
  setLobbyMessage(tr("rematchVoteWaiting", { count, need }));
}

function requestInviteToken(roomCode) {
  return new Promise((resolve) => {
    inviteTokenRequestResolve = resolve;
    postRoomMessage({ type: "issue-invite-token", room: roomCode });
    window.setTimeout(() => {
      if (!inviteTokenRequestResolve) return;
      inviteTokenRequestResolve("");
      inviteTokenRequestResolve = null;
    }, 1800);
  });
}

function setConnectionState(nextState) {
  roomSession.connectionState = nextState;
  updateConnectionText();
}

function clearReconnectTimer() {
  if (!roomSession.reconnectTimerId) return;
  window.clearTimeout(roomSession.reconnectTimerId);
  roomSession.reconnectTimerId = 0;
}

async function cloudApiRequest(path, payload) {
  const candidates = cloudApiCandidates();

  let lastError = null;
  for (const base of candidates) {
    try {
      const res = await fetch(`${base}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      // If this candidate cannot handle the cloud endpoint, try the next one.
      if (!res.ok || data?.ok === false) {
        lastError = new Error(data?.message || `Cloud API request failed at ${base}`);
        continue;
      }

      return { res, data };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Cloud API request failed");
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
  let roleLabel = tr("roleGuest");
  if (roomRole === "host") roleLabel = tr("roleHost");
  if (roomRole === "spectator") roleLabel = tr("roleSpectator");
  roomRoleText.textContent = `${tr("labelRole")}: ${roleLabel} / ${roomSession.playerName}`;
}

function roomParticipantCount() {
  return roomSession.participants.size;
}

function otherParticipantNames() {
  return [...roomSession.participants.entries()]
    .filter(([id]) => id !== peerId)
    .map(([, name]) => name);
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
  let roleLabel = "-";
  if (roomSession.role === "host") roleLabel = tr("roleHost");
  if (roomSession.role === "guest") roleLabel = tr("roleGuest");
  if (roomSession.role === "spectator") roleLabel = tr("roleSpectator");
  const participants = roomSession.code ? Math.max(1, roomParticipantCount()) : 0;
  const peerLabel = roomSession.peerConnected
    ? tr("roomConnectedCount", { count: participants })
    : tr("roomWaitingCount", { count: participants });

  lobbyRoomCodeText.textContent = `${tr("labelRoom")}: ${code}`;
  lobbyRoleText.textContent = `${tr("labelRole")}: ${roleLabel}`;
  lobbySelfNameText.textContent = `${tr("labelYou")}: ${roomSession.playerName}`;
  lobbyPeerNameText.textContent = `${tr("labelPeer")}: ${roomSession.peerName ?? "-"}`;
  lobbyPeerText.textContent = `${tr("labelStatus")}: ${peerLabel}`;
  updateConnectionText();

  const hostCanStart = roomSession.role === "host" && roomSession.peerConnected;
  lobbyStartOthelloBtn.disabled = !hostCanStart;
  lobbyStartShogiBtn.disabled = !hostCanStart;
  lobbyStartChessBtn.disabled = !hostCanStart;
  lobbyStartUnoBtn.disabled = !hostCanStart;
  lobbyStartGomokuBtn.disabled = !hostCanStart;
  lobbyStartSurvivorsBtn.disabled = !hostCanStart;
  lobbyStartSolitaireBtn.disabled = !hostCanStart;
  if (copyInviteLinkBtn) copyInviteLinkBtn.disabled = !roomSession.code;
  renderSpectatorBadge();
  renderSpectatorChat();
  updateRematchButtonVisibility();
}

function postRoomMessage(message) {
  if (!roomSession.transport) return;
  roomSession.transport.send(message);
}

function handleTransportStatus(status) {
  if (!roomSession.code) return;
  const state = String(status?.state || "");
  if (state === "connecting") {
    setConnectionState("connecting");
    return;
  }
  if (state === "connected") {
    if (status?.transport === "broadcast") {
      setConnectionState("fallback");
    } else {
      setConnectionState("connected");
    }
    roomSession.reconnectAttempt = 0;
    clearReconnectTimer();
    return;
  }
  if (state === "fallback") {
    setConnectionState("fallback");
    return;
  }
  if (state === "disconnected" && status?.transport === "websocket") {
    if (roomSession.manualDisconnect) return;
    setConnectionState("reconnecting");
    scheduleReconnect();
  }
}

async function connectRoomTransport({ roomCode, role, reconnecting = false }) {
  const transport = await createRoomTransport({
    roomCode,
    peerId,
    serverUrl: roomServerUrl,
    onMessage: (payload) => handleRoomMessage(payload, roomCode),
    onStatusChange: handleTransportStatus,
  });

  if (roomSession.code !== roomCode || roomSession.role !== role) {
    transport.close();
    return false;
  }

  roomSession.transport = transport;
  roomSession.transportKind = transport.kind;
  roomSession.reconnectAttempt = 0;
  clearReconnectTimer();

  postRoomMessage({
    type: "hello",
    name: roomSession.playerName,
    spectate: roomSession.spectateIntent,
    roomPublic: roomSession.roomVisibility === "public",
    inviteToken: roomSession.pendingInviteToken,
  });

  if (reconnecting) {
    setLobbyMessage(tr("roomReconnected"));
    return true;
  }

  if (roomSession.quickMatchMode) {
    setMenuMessage(tr("quickMatchConnected", { code: roomCode }));
    return true;
  }

  if (transport.kind === "broadcast") {
    setMenuMessage(`${tr("menuRoomConnected", { code: roomCode })} (BroadcastChannel)`);
  } else {
    const endpointText = String(transport.endpoint || roomServerUrlForInvite() || "");
    setMenuMessage(endpointText ? `${tr("menuRoomConnected", { code: roomCode })} (${endpointText})` : tr("menuRoomConnected", { code: roomCode }));
  }
  return true;
}

async function reconnectRoomIfNeeded(expectedCode) {
  if (roomSession.manualDisconnect) return;
  if (!roomSession.code || roomSession.code !== expectedCode) return;
  const role = roomSession.role || "guest";
  setConnectionState("reconnecting");
  const ok = await connectRoomTransport({ roomCode: expectedCode, role, reconnecting: true });
  if (!ok && roomSession.code === expectedCode) {
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (roomSession.reconnectTimerId || !roomSession.code) return;
  roomSession.reconnectAttempt += 1;
  const delay = Math.min(
    ROOM_RECONNECT_MAX_DELAY_MS,
    ROOM_RECONNECT_BASE_DELAY_MS * (2 ** Math.max(0, roomSession.reconnectAttempt - 1)),
  );
  const expectedCode = roomSession.code;
  setLobbyMessage(tr("roomReconnecting", { count: roomSession.reconnectAttempt }));
  roomSession.reconnectTimerId = window.setTimeout(() => {
    roomSession.reconnectTimerId = 0;
    void reconnectRoomIfNeeded(expectedCode);
  }, delay);
}

function startQuickMatch() {
  const playerName = normalizeName(playerNameInput?.value);
  if (playerNameInput) playerNameInput.value = playerName;
  const code = generateQuickMatchCode(0);
  if (roomCodeInput) roomCodeInput.value = code;
  setMenuMessage(tr("quickMatchSearching"));
  void attachRoom(code, "guest", playerName, { quickMatchMode: true, quickJoin: true });
}

function isSpectator() {
  return roomSession.role === "spectator";
}

function updateRematchButtonVisibility() {
  if (!globalRematchBtn) return;
  const visible = Boolean(roomSession.code) && !menuScreen.classList.contains("hidden") && !lobbyScreen.classList.contains("hidden");
  globalRematchBtn.classList.toggle("hidden", !visible);
  const alreadyVoted = roomSession.rematchVotes.has(peerId);
  globalRematchBtn.disabled = !visible || !roomSession.peerConnected || isSpectator();
  globalRematchBtn.textContent = alreadyVoted ? tr("rematchWithdrawNow") : tr("rematchApproveNow");
}

function controllerOf(gameKey) {
  return games?.[gameKey]?.controller;
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
  roomSession.manualDisconnect = true;
  clearReconnectTimer();
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
  roomSession.activeGame = null;
  roomSession.peerName = null;
  roomSession.participants = new Map();
  roomSession.spectatorIds = new Set();
  roomSession.pendingInviteToken = "";
  roomSession.rematchVotes = new Set();
  roomSession.spectatorChatMessages = [];
  if (inviteTokenRequestResolve) {
    inviteTokenRequestResolve("");
    inviteTokenRequestResolve = null;
  }
  setConnectionState("offline");
  roomSession.reconnectAttempt = 0;
  roomSession.quickMatchMode = false;
  roomSession.roomVisibility = "public";
  roomSession.spectateIntent = false;
  updateLobbyView();
  updateRematchButtonVisibility();
  updateRoomStatus({ roomCode: null, roomRole: null });
}

function enterRoomGame(gameKey) {
  const controller = controllerOf(gameKey);
  if (!controller) return;

  currentGameKey = gameKey;
  roomSession.selectedGame = gameKey;
  roomSession.activeGame = gameKey;

  const localPlayer = roomSession.role === "host" ? BLACK : WHITE;
  controller.configureRoomMode({
    roomCode: roomSession.code,
    roomRole: roomSession.role,
    roomPlayer: localPlayer,
    roomPlayerCount: Math.max(1, roomParticipantCount()),
    roomMaxPlayers: MAX_ROOM_PLAYERS,
  });

  showGameScreen(gameKey);

  if (isSpectator()) {
    controller.setRoomLock({ locked: true, message: tr("spectatorReadOnly") });
  } else if (roomSession.role === "host") {
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

  if (payload.type === "room-state" && Array.isArray(payload.participants)) {
    const prevRole = roomSession.role;
    if (typeof payload.hostPeerId === "string" && payload.hostPeerId.trim()) {
      roomSession.role = payload.hostPeerId === peerId ? "host" : "guest";
    }

    const nextParticipants = new Map();
    const spectatorIds = new Set();
    payload.participants.forEach((entry) => {
      if (!entry || typeof entry.id !== "string") return;
      nextParticipants.set(entry.id, normalizeName(entry.name));
      if (entry.role === "spectator") {
        spectatorIds.add(entry.id);
      }
    });
    if (!nextParticipants.has(peerId)) {
      nextParticipants.set(peerId, roomSession.playerName);
    }
    roomSession.participants = nextParticipants;
    roomSession.spectatorIds = spectatorIds;
    if (spectatorIds.has(peerId)) {
      roomSession.role = "spectator";
      const selectedController = roomSession.selectedGame ? controllerOf(roomSession.selectedGame) : null;
      selectedController?.setRoomLock?.({ locked: true, message: tr("spectatorReadOnly") });
    }
    updateRoomStatus({ roomCode: roomSession.code, roomRole: roomSession.role });
    refreshRoomPresence();
    if (Array.isArray(payload.rematchVotes)) {
      roomSession.rematchVotes = new Set(payload.rematchVotes.filter((id) => typeof id === "string"));
      setRematchVoteMessage(roomSession.rematchVotes.size, 2);
    }
    updateRematchButtonVisibility();
    if (!lobbyScreen.classList.contains("hidden")) {
      if (prevRole !== roomSession.role && roomSession.role === "host") {
        setLobbyMessage(tr("lobbyPromotedHost"));
        return;
      }
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
    refreshRoomPresence();

    if (roomSession.role === "host") {
      setLobbyMessage(tr("lobbyParticipantConnected"));
    }

    postRoomMessage({
      type: "presence",
      name: roomSession.playerName,
      roomPublic: roomSession.roomVisibility === "public",
      spectate: roomSession.spectateIntent,
    });
    if (roomSession.role === "host" && roomSession.selectedGame) {
      postRoomMessage({ type: "select-game", game: roomSession.selectedGame });
    }
    return;
  }

  if (payload.type === "presence") {
    roomSession.participants.set(payload.from, normalizeName(payload.name));
    refreshRoomPresence();
    if (roomSession.role === "host") {
      setLobbyMessage(tr("lobbyParticipantConnected"));
    }
    return;
  }

  if (payload.type === "room-assigned" && payload.code) {
    roomSession.code = normalizeRoomCode(payload.code);
    if (roomCodeInput) roomCodeInput.value = roomSession.code;
    if (payload.role === "spectator") {
      roomSession.role = "spectator";
      setLobbyMessage(tr("spectatorReadOnly"));
    }
    if (payload.roomPublic === false && roomSession.quickMatchMode) {
      setMenuMessage(tr("quickMatchPrivateSkipped"));
    }
    updateRoomStatus({ roomCode: roomSession.code, roomRole: roomSession.role });
    updateLobbyView();
    return;
  }

  if (payload.type === "invite-token" && payload.room === roomSession.code) {
    const token = typeof payload.token === "string" ? payload.token : "";
    roomSession.pendingInviteToken = token;
    if (inviteTokenRequestResolve) {
      inviteTokenRequestResolve(token);
      inviteTokenRequestResolve = null;
    }
    return;
  }

  if (payload.type === "invite-token-required") {
    closeRoom();
    configureAllStandardModes();
    showMenuScreen();
    setMenuMessage(tr("inviteTokenRequired"));
    return;
  }

  if (payload.type === "room-in-game") {
    if (roomSession.quickMatchMode) {
      setMenuMessage(tr("quickMatchSearching"));
      const fallbackOffset = Math.floor(Math.random() * 4) + 1;
      const fallbackCode = generateQuickMatchCode(fallbackOffset);
      if (roomCodeInput) roomCodeInput.value = fallbackCode;
      void attachRoom(fallbackCode, "guest", roomSession.playerName, { quickMatchMode: true, quickJoin: true });
      return;
    }
    closeRoom();
    configureAllStandardModes();
    showMenuScreen();
    setMenuMessage(tr("roomInGameSuggestSpectate"));
    return;
  }

  if (payload.type === "room-full") {
    if (roomSession.role === "guest") {
      const wasQuickMatch = roomSession.quickMatchMode;
      const currentPlayerName = roomSession.playerName;
      const rejectedCode = payload.code || roomCode;
      closeRoom();
      configureAllStandardModes();
      showMenuScreen();
      if (wasQuickMatch) {
        setMenuMessage(tr("quickMatchSearching"));
        const fallbackOffset = Math.floor(Math.random() * 4) + 1;
        const fallbackCode = generateQuickMatchCode(fallbackOffset);
        if (roomCodeInput) roomCodeInput.value = fallbackCode;
        void attachRoom(fallbackCode, "guest", currentPlayerName, { quickMatchMode: true });
      } else {
        setMenuMessage(tr("roomFullRejected", { code: rejectedCode }));
      }
    }
    return;
  }

  if (payload.type === "leave") {
    roomSession.participants.delete(payload.from);
    refreshRoomPresence();
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
    roomSession.selectedGame = payload.game;
    roomSession.activeGame = payload.game;
    roomSession.rematchVotes = new Set();
    enterRoomGame(payload.game);
    return;
  }

  if (payload.type === "new-game" && payload.game) {
    const controller = controllerOf(payload.game);
    if (!controller) return;
    roomSession.rematchVotes = new Set();
    controller.setRoomLock({ locked: false, message: "" });
    controller.startNewGame({ fromRemote: true });
    return;
  }

  if (payload.type === "rematch-vote-state") {
    const votes = Array.isArray(payload.votes) ? payload.votes : [];
    roomSession.rematchVotes = new Set(votes.filter((id) => typeof id === "string"));
    setRematchVoteMessage(roomSession.rematchVotes.size, Number(payload.required || 2));
    updateRematchButtonVisibility();
    return;
  }

  if (payload.type === "spectator-chat") {
    const text = String(payload.text || "").trim();
    if (!text) return;
    roomSession.spectatorChatMessages.push({
      name: normalizeName(payload.name || "Spectator"),
      text: text.slice(0, 200),
    });
    if (roomSession.spectatorChatMessages.length > 80) {
      roomSession.spectatorChatMessages.splice(0, roomSession.spectatorChatMessages.length - 80);
    }
    renderSpectatorChat();
    return;
  }

  if (payload.type === "snapshot" && payload.game && payload.snapshot) {
    const controller = controllerOf(payload.game);
    if (!controller) return;
    controller.applySnapshot(payload.snapshot);
    return;
  }

  if (payload.type === "move" && payload.game && payload.move) {
    const controller = controllerOf(payload.game);
    if (!controller) return;
    controller.applyRemoteMove({ ...payload.move, remoteId: payload.from });
    return;
  }

  if (payload.type === "draw-vote" && payload.game && payload.payload) {
    const controller = controllerOf(payload.game);
    if (!controller) return;
    controller.applyRemoteDrawVote?.(payload.payload);
  }
}

async function attachRoom(roomCode, role, playerName, options = {}) {
  closeRoom();

  roomSession.manualDisconnect = false;
  roomSession.code = roomCode;
  roomSession.role = role;
  roomSession.transport = null;
  roomSession.transportKind = "none";
  roomSession.peerConnected = false;
  roomSession.selectedGame = null;
  roomSession.playerName = playerName;
  roomSession.peerName = null;
  roomSession.participants = new Map([[peerId, playerName]]);
  roomSession.reconnectAttempt = 0;
  roomSession.quickMatchMode = Boolean(options?.quickMatchMode);
  roomSession.roomVisibility = asBooleanRoomVisibility(options?.roomPublic ?? (roomPublicToggle?.checked ?? true));
  roomSession.spectateIntent = Boolean(options?.spectate);
  roomSession.pendingInviteToken = String(options?.inviteToken || "").trim();
  roomSession.rematchVotes = new Set();
  roomSession.spectatorChatMessages = [];

  setConnectionState("connecting");
  refreshRoomPresence();
  showLobbyScreen();
  updateRematchButtonVisibility();

  if (role === "host") {
    setLobbyMessage(tr("lobbyWaitPeer"));
  } else {
    setLobbyMessage(tr("lobbyJoinedWaitHost"));
  }

  const ok = await connectRoomTransport({ roomCode, role, reconnecting: false });
  if (ok) {
    stripInviteTokenFromAddressBar();
  }
  if (ok && options?.quickJoin) {
    postRoomMessage({
      type: "quick-join",
      room: roomCode,
      name: roomSession.playerName,
      roomPublic: roomSession.roomVisibility === "public",
      spectate: roomSession.spectateIntent,
      inviteToken: roomSession.pendingInviteToken,
    });
  }
  return ok;
}

function asBooleanRoomVisibility(value) {
  return value === false ? "private" : "public";
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

quickMatchBtn?.addEventListener("click", () => {
  startQuickMatch();
});

roomPublicToggle?.addEventListener("change", () => {
  roomSession.roomVisibility = roomPublicToggle.checked ? "public" : "private";
  if (roomPublicToggle.checked) {
    roomSession.pendingInviteToken = "";
  }
  localStorage.setItem(STORAGE_ROOM_PUBLIC_KEY, roomSession.roomVisibility);
  if (roomPublicLabel) {
    roomPublicLabel.textContent = roomPublicToggle.checked ? tr("roomPublicToggle") : tr("roomPrivateToggle");
  }
  if (roomSession.code && roomSession.role === "host") {
    postRoomMessage({ type: "presence", name: roomSession.playerName, roomPublic: roomPublicToggle.checked });
  }
});

createRoomBtn?.addEventListener("click", () => {
  const playerName = normalizeName(playerNameInput?.value);
  if (playerNameInput) playerNameInput.value = playerName;

  const code = generateRoomCode();
  roomCodeInput.value = code;
  void attachRoom(code, "host", playerName, { roomPublic: roomPublicToggle?.checked ?? true });
});

joinRoomBtn?.addEventListener("click", () => {
  const playerName = normalizeName(playerNameInput?.value);
  if (playerNameInput) playerNameInput.value = playerName;

  const code = normalizeRoomCode(roomCodeInput.value);
  if (code.length !== 6) {
    setMenuMessage(tr("roomCodeInvalid"));
    return;
  }

  void attachRoom(code, "guest", playerName, { inviteToken: startupInviteToken });
  setMenuMessage(tr("menuRoomJoined", { code }));
});

spectateRoomBtn?.addEventListener("click", () => {
  const playerName = normalizeName(playerNameInput?.value);
  if (playerNameInput) playerNameInput.value = playerName;

  const code = normalizeRoomCode(roomCodeInput.value);
  if (code.length !== 6) {
    setMenuMessage(tr("roomCodeInvalid"));
    return;
  }

  void attachRoom(code, "spectator", playerName, { spectate: true, inviteToken: startupInviteToken });
  setMenuMessage(tr("menuRoomSpectate", { code }));
});

lobbyStartOthelloBtn?.addEventListener("click", () => {
  if (roomSession.role !== "host") return;
  if (!roomSession.peerConnected) {
    setLobbyMessage(tr("lobbyNoPeer"));
    return;
  }

  roomSession.selectedGame = "othello";
  postRoomMessage({ type: "select-game", game: "othello" });
  enterRoomGame("othello");
});

lobbyStartShogiBtn?.addEventListener("click", () => {
  if (roomSession.role !== "host") return;
  if (!roomSession.peerConnected) {
    setLobbyMessage(tr("lobbyNoPeer"));
    return;
  }

  roomSession.selectedGame = "shogi";
  postRoomMessage({ type: "select-game", game: "shogi" });
  enterRoomGame("shogi");
});

lobbyStartChessBtn?.addEventListener("click", () => {
  if (roomSession.role !== "host") return;
  if (!roomSession.peerConnected) {
    setLobbyMessage(tr("lobbyNoPeer"));
    return;
  }

  roomSession.selectedGame = "chess";
  postRoomMessage({ type: "select-game", game: "chess" });
  enterRoomGame("chess");
});

lobbyStartUnoBtn?.addEventListener("click", () => {
  if (roomSession.role !== "host") return;
  if (!roomSession.peerConnected) {
    setLobbyMessage(tr("lobbyNoPeer"));
    return;
  }

  roomSession.selectedGame = "uno";
  postRoomMessage({ type: "select-game", game: "uno" });
  enterRoomGame("uno");
});

lobbyStartGomokuBtn?.addEventListener("click", () => {
  if (roomSession.role !== "host") return;
  if (!roomSession.peerConnected) {
    setLobbyMessage(tr("lobbyNoPeer"));
    return;
  }

  roomSession.selectedGame = "gomoku";
  postRoomMessage({ type: "select-game", game: "gomoku" });
  enterRoomGame("gomoku");
});

lobbyStartSurvivorsBtn?.addEventListener("click", () => {
  if (roomSession.role !== "host") return;
  if (!roomSession.peerConnected) {
    setLobbyMessage(tr("lobbyNoPeer"));
    return;
  }

  roomSession.selectedGame = "survivors";
  postRoomMessage({ type: "select-game", game: "survivors" });
  enterRoomGame("survivors");
});

lobbyStartSolitaireBtn?.addEventListener("click", () => {
  if (roomSession.role !== "host") return;
  if (!roomSession.peerConnected) {
    setLobbyMessage(tr("lobbyNoPeer"));
    return;
  }

  roomSession.selectedGame = "solitaire";
  postRoomMessage({ type: "select-game", game: "solitaire" });
  enterRoomGame("solitaire");
});

lobbyBackBtn?.addEventListener("click", () => {
  if (roomSession.code) {
    postRoomMessage({ type: "return-lobby" });
  }
  closeRoom();
  configureAllStandardModes();
  showMenuScreen();
});

globalRematchBtn?.addEventListener("click", () => {
  if (!roomSession.code || !roomSession.activeGame || isSpectator()) return;
  if (roomSession.rematchVotes.has(peerId)) {
    postRoomMessage({ type: "rematch-unvote", game: roomSession.activeGame });
    roomSession.rematchVotes.delete(peerId);
  } else {
    postRoomMessage({ type: "rematch-vote", game: roomSession.activeGame });
    roomSession.rematchVotes.add(peerId);
  }
  setRematchVoteMessage(roomSession.rematchVotes.size, 2);
  updateRematchButtonVisibility();
});

copyInviteLinkBtn?.addEventListener("click", async () => {
  if (!roomSession.code) return;
  const copied = await copyInviteUrl(roomSession.code);
  setLobbyMessage(copied ? tr("inviteLinkCopied") : tr("inviteLinkCopyFailed"));
});

spectatorChatSendBtn?.addEventListener("click", () => {
  if (!roomSession.code || !isSpectator()) return;
  const text = String(spectatorChatInput?.value || "").trim();
  if (!text) return;
  postRoomMessage({
    type: "spectator-chat",
    room: roomSession.code,
    name: roomSession.playerName,
    text: text.slice(0, 200),
  });
  if (spectatorChatInput) spectatorChatInput.value = "";
});

spectatorChatInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  spectatorChatSendBtn?.click();
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

const initialRoomPublic = (localStorage.getItem(STORAGE_ROOM_PUBLIC_KEY) || "public") !== "private";
if (roomPublicToggle) {
  roomPublicToggle.checked = initialRoomPublic;
}
roomSession.roomVisibility = initialRoomPublic ? "public" : "private";
if (roomPublicLabel) {
  roomPublicLabel.textContent = initialRoomPublic ? tr("roomPublicToggle") : tr("roomPrivateToggle");
}

const startupParams = new URLSearchParams(window.location.search);
const startupRoomCode = normalizeRoomCode(startupParams.get(ROOM_CODE_QUERY_PARAM_KEY) || "");
const startupInviteToken = String(startupParams.get(ROOM_INVITE_TOKEN_QUERY_PARAM_KEY) || "").trim();
if (startupRoomCode && roomCodeInput) {
  roomCodeInput.value = startupRoomCode;
}
if (startupInviteToken) {
  roomSession.pendingInviteToken = startupInviteToken;
}

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

updateLobbyView();
showEntryScreen();
