import "./styles/main.css";
import { initGame as initOthello } from "./scripts/game.js";
import { initShogi } from "./scripts/shogi.js";
import { initChess } from "./scripts/chess.js";
import { initUno } from "./scripts/uno.js";
import { initGomoku } from "./scripts/gomoku.js";
import { initSurvivors } from "./scripts/survivors.js";
import { initFitPuzzle } from "./scripts/fitPuzzle.js";
import { initMinesweeper } from "./scripts/minesweeper.js";
import { initSolitaire } from "./scripts/solitaire.js";
import { initMahjong } from "./scripts/mahjong.js";
import { initSevens } from "./scripts/sevens.js";
import { initNumeron } from "./scripts/numeron.js";
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
const APP_URL_TAG = "NeonBoardArcade";

const entryScreen = document.getElementById("entryScreen");
const menuScreen = document.getElementById("menuScreen");
const cardListScreen = document.getElementById("cardListScreen");
const casinoListScreen = document.getElementById("casinoListScreen");
const lobbyScreen = document.getElementById("lobbyScreen");
const othelloScreen = document.getElementById("othelloScreen");
const shogiScreen = document.getElementById("shogiScreen");
const chessScreen = document.getElementById("chessScreen");
const unoScreen = document.getElementById("unoScreen");
const gomokuScreen = document.getElementById("gomokuScreen");
const survivorsScreen = document.getElementById("survivorsScreen");
const fitPuzzleScreen = document.getElementById("fitPuzzleScreen");
const minesweeperScreen = document.getElementById("minesweeperScreen");
const solitaireScreen = document.getElementById("solitaireScreen");
const mahjongScreen = document.getElementById("mahjongScreen");
const sevensScreen = document.getElementById("sevensScreen");
const numeronScreen = document.getElementById("numeronScreen");

const playOthelloBtn = document.getElementById("playOthelloBtn");
const playShogiBtn = document.getElementById("playShogiBtn");
const playChessBtn = document.getElementById("playChessBtn");
const playUnoBtn = document.getElementById("playUnoBtn");
const playGomokuBtn = document.getElementById("playGomokuBtn");
const playSurvivorsBtn = document.getElementById("playSurvivorsBtn");
const playFitPuzzleBtn = document.getElementById("playFitPuzzleBtn");
const playMinesweeperBtn = document.getElementById("playMinesweeperBtn");
const playMahjongBtn = document.getElementById("playMahjongBtn");
const playSolitaireSingleBtn = document.getElementById("playSolitaireSingleBtn");
const playSolitaireMultiBtn = document.getElementById("playSolitaireMultiBtn");
const openCardListBtn = document.getElementById("openCardListBtn");
const cardListUnoBtn = document.getElementById("cardListUnoBtn");
const cardListSevensBtn = document.getElementById("cardListSevensBtn");
const cardListSolitaireBtn = document.getElementById("cardListSolitaireBtn");
const cardListDaifugoBtn = document.getElementById("cardListDaifugoBtn");
const cardListNumeronBtn = document.getElementById("cardListNumeronBtn");
const cardListBackBtn = document.getElementById("cardListBackBtn");
const cardListMessage = document.getElementById("cardListMessage");
const openCasinoListBtn = document.getElementById("openCasinoListBtn");
const casinoListBlackjackBtn = document.getElementById("casinoListBlackjackBtn");
const casinoListPokerBtn = document.getElementById("casinoListPokerBtn");
const casinoListBackBtn = document.getElementById("casinoListBackBtn");
const casinoListMessage = document.getElementById("casinoListMessage");
const quickMatchBtn = document.getElementById("quickMatchBtn");
const roomPublicRadio = document.getElementById("roomPublicRadio");
const roomPrivateRadio = document.getElementById("roomPrivateRadio");
const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const spectateRoomBtn = document.getElementById("spectateRoomBtn");
const roomCodeInput = document.getElementById("roomCodeInput");
const playerNameInput = document.getElementById("playerNameInput");
const entryCloudUserIdInput = document.getElementById("entryCloudUserIdInput");
const entryCloudPasswordInput = document.getElementById("entryCloudPasswordInput");
const entryLoginBtn = document.getElementById("entryLoginBtn");
const entryRegisterBtn = document.getElementById("entryRegisterBtn");
const entryGuestBtn = document.getElementById("entryGuestBtn");
const entryMessage = document.getElementById("entryMessage");
const entryLoadingPanel = document.getElementById("entryLoadingPanel");
const entryLoadingText = document.getElementById("entryLoadingText");
const entryLoadingFill = document.getElementById("entryLoadingFill");
const entryLoadingElapsed = document.getElementById("entryLoadingElapsed");
const cloudUserIdInput = document.getElementById("cloudUserIdInput");
const cloudPasswordInput = document.getElementById("cloudPasswordInput");
const saveCloudAuthBtn = document.getElementById("saveCloudAuthBtn");
const backToEntryBtn = document.getElementById("backToEntryBtn");
const roomMenuMessage = document.getElementById("roomMenuMessage");
const friendsPanel = document.getElementById("friendsPanel");
const friendsTitle = document.getElementById("friendsTitle");
const friendsHint = document.getElementById("friendsHint");
const friendUserIdInput = document.getElementById("friendUserIdInput");
const friendAddBtn = document.getElementById("friendAddBtn");
const friendRemoveBtn = document.getElementById("friendRemoveBtn");
const friendReloadBtn = document.getElementById("friendReloadBtn");
const friendsTabFriendsBtn = document.getElementById("friendsTabFriendsBtn");
const friendsTabIncomingBtn = document.getElementById("friendsTabIncomingBtn");
const friendsTabOutgoingBtn = document.getElementById("friendsTabOutgoingBtn");
const friendsList = document.getElementById("friendsList");
const friendsMessage = document.getElementById("friendsMessage");

const lobbyRoomCodeText = document.getElementById("lobbyRoomCodeText");
const lobbyRoleText = document.getElementById("lobbyRoleText");
const lobbyParticipantsText = document.getElementById("lobbyParticipantsText");
const lobbyPlayersTitle = document.getElementById("lobbyPlayersTitle");
const lobbyPlayersList = document.getElementById("lobbyPlayersList");
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
const lobbyStartFitPuzzleBtn = document.getElementById("lobbyStartFitPuzzleBtn");
const lobbyStartMinesweeperBtn = document.getElementById("lobbyStartMinesweeperBtn");
const lobbyStartSolitaireBtn = document.getElementById("lobbyStartSolitaireBtn");
const lobbyStartMahjongBtn = document.getElementById("lobbyStartMahjongBtn");
const lobbyStartSevensBtn = document.getElementById("lobbyStartSevensBtn");
const lobbyStartNumeronBtn = document.getElementById("lobbyStartNumeronBtn");
const lobbyOpenCardGamesBtn = document.getElementById("lobbyOpenCardGamesBtn");
const lobbySwitchSpectateBtn = document.getElementById("lobbySwitchSpectateBtn");
const lobbyBackBtn = document.getElementById("lobbyBackBtn");
const copyInviteLinkBtn = document.getElementById("copyInviteLinkBtn");
const globalRematchBtn = document.getElementById("globalRematchBtn");
const menuMore = document.getElementById("menuMore");
const menuMoreBtn = document.getElementById("menuMoreBtn");
const menuMorePanel = document.getElementById("menuMorePanel");
const spectatorChatPanel = document.getElementById("spectatorChatPanel");
const spectatorChatLog = document.getElementById("spectatorChatLog");
const spectatorChatInput = document.getElementById("spectatorChatInput");
const spectatorChatSendBtn = document.getElementById("spectatorChatSendBtn");
const roomChatPanel = document.getElementById("roomChatPanel");
const roomChatLog = document.getElementById("roomChatLog");
const roomChatInput = document.getElementById("roomChatInput");
const roomChatSendBtn = document.getElementById("roomChatSendBtn");

const roomStatus = document.getElementById("roomStatus");
const roomCodeText = document.getElementById("roomCodeText");
const roomRoleText = document.getElementById("roomRoleText");
const lobbyGameCountNodes = document.querySelectorAll("[data-lobby-game-count]");
const langSelect = document.getElementById("langSelect");
const friendsToggleBtn = document.getElementById("friendsToggleBtn");

const messages = {
  ja: {
    entryTitle: "セッション開始",
    entrySubtitle: "ログインして進行データを共有するか、ゲストとして今すぐ遊べます。",
    loginAndPlay: "ログインして遊ぶ",
    registerAndPlay: "新規登録",
    playAsGuest: "ゲストで遊ぶ",
    entryGuestSelected: "ゲストモードで開始しました",
    loginConfirmPrompt: "ログインします。よろしいですか？",
    registerConfirmPrompt: "このIDで新規登録します。よろしいですか？",
    loginCanceled: "ログインをキャンセルしました",
    registerCanceled: "新規登録をキャンセルしました",
    registerSuccess: "新規登録が完了しました",
    registerDuplicate: "このIDは既に使われています。ログインしてください",
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
    minesweeperCardDesc: "VSプレイヤーや級力モードに対応したマインスイーパー。",
    mahjongCardDesc: "同じ牌を選んで消していくクリック型の麻雀ペアゲーム。",
    solitaireCardDesc: "定番のクロンダイク。AからKまで4組そろえるとクリア。",
    lobbyCardGamesTitle: "カードゲーム一覧",
    lobbyCardGamesDesc: "ルームで遊べるカードゲームをここから選択します。",
    lobbyCardGamesOpen: "一覧表示",
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
    minesweeperSubtitle: "VSプレイヤーや級力モードを選び、マインスイーパーで対戦できます。",
    mahjongSubtitle: "同じ牌を2回まで曲がる線でつなげると消せます。すべて消したらクリア。",
    solitaireSubtitle: "ストックからめくって並べ替え、4つの土台を完成させよう。",
    unoModeCpu: "1P 対 CPU",
    unoModeLocal: "ローカル2人",
    createRoom: "ルーム作成",
    join: "参加",
    spectateJoin: "観戦参加",
    spectateToggleToSpectator: "観戦",
    spectateToggleToPlayer: "プレイヤー",
    play: "プレイ",
    backToMenu: "メニューへ戻る",
    othelloStart: "オセロ開始",
    shogiStart: "将棋開始",
    chessStart: "チェス開始",
    unoStart: "UNO開始",
    gomokuStart: "五目並べ開始",
    survivorsStart: "サバイバー開始",
    fitPuzzleStart: "Fit Puzzle開始",
    minesweeperStart: "Minesweeper開始",
    solitaireStart: "ソリティア開始",
    mahjongStart: "麻雀開始",
    sevensStart: "7並べ開始",
    numeronStart: "NUMERON開始",
    bankGacha: "スキンガチャ",
    bankGacha10: "スキンガチャ x10",
    singlePlay: "シングル",
    multiPlay: "マルチ",
    quickMatchMulti: "クイックマッチ（マルチ）",
    optionsMenu: "option",
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
    roomChatTitle: "ルームチャット",
    roomChatPlaceholder: "メッセージを入力",
    roomChatSend: "送信",
    roomChatEmpty: "まだメッセージはありません",
    roomChatMuted: "チャット送信が制限されています",
    roomChatRateLimited: "送信が早すぎます。少し待ってください",
    newGame: "ゲーム開始",
    remake: "リメイク",
    menu: "メニュー",
    newMatch: "ゲーム開始",
    menuJa: "メニュー",
    rotate: "回転",
    shuffle: "シャッフル",
    hint: "ヒント",
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
    friendsTitle: "フレンド",
    friendsToggle: "フレンド一覧",
    friendsClose: "閉じる",
    friendsHintNoAuth: "ログインするとフレンド一覧を読み込みます",
    friendsHintReady: "フレンドIDで追加/削除できます",
    friendsHintIncoming: "承認待ちタブでは申請者IDを承認/拒否できます",
    friendsHintOutgoing: "申請中タブでは送信済みIDを取り消せます",
    friendsTabFriends: "フレンド",
    friendsTabIncoming: "承認待ち",
    friendsTabOutgoing: "申請中",
    friendIdPlaceholder: "フレンドID",
    friendAdd: "追加",
    friendRequestSend: "申請",
    friendApprove: "承認",
    friendReject: "拒否",
    friendCancel: "取消",
    friendRemove: "削除",
    friendReload: "再読込",
    friendsLoading: "フレンド一覧を読み込み中...",
    friendsListEmpty: "フレンドはまだいません",
    friendsIncomingEmpty: "承認待ちの申請はありません",
    friendsOutgoingEmpty: "申請中のユーザーはいません",
    friendsLoadFailed: "フレンド取得に失敗しました",
    friendIdRequired: "フレンドIDを入力してください",
    friendAddSuccess: "フレンドを追加しました",
    friendRequestSent: "フレンド申請を送信しました",
    friendApproveSuccess: "フレンド申請を承認しました",
    friendRejectSuccess: "フレンド申請を拒否しました",
    friendCancelSuccess: "フレンド申請を取り消しました",
    friendRemoveSuccess: "フレンドを削除しました",
    friendAddFailed: "フレンド追加に失敗しました",
    friendRequestSendFailed: "フレンド申請の送信に失敗しました",
    friendApproveFailed: "フレンド申請の承認に失敗しました",
    friendRejectFailed: "フレンド申請の拒否に失敗しました",
    friendCancelFailed: "フレンド申請の取消に失敗しました",
    friendRemoveFailed: "フレンド削除に失敗しました",
    friendNotFound: "指定したIDのユーザーが見つかりません",
    friendSelfForbidden: "自分自身は追加できません",
    friendRequestAlreadySent: "すでに申請済みです",
    friendRequestAlreadyReceived: "相手からの申請が届いています。承認待ちタブで承認してください",
    friendRequestNotFound: "対象の申請が見つかりません",
    cloudUserNotFound: "ユーザーが存在しません。新規登録してください",
    cloudIdDuplicateWarn: "このIDは既に使用されています。別のIDか、正しいパスワードを入力してください",
    cloudCheckFailed: "クラウド確認に失敗しました。通信状況をご確認のうえ、もう一度お試しください",
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
    roomInGameSuggestSpectate: "対戦中のため参加できません。観戦を使ってください。",
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
    lobbySelectSameGamePrompt: "ホストがゲームを選択しました。同じゲームを選択して開始してください。",
    lobbySelectMatchOnly: "ホストが選択したゲームのみ開始できます。",
    roomArcadeModeNotice: "3人以上のルームでは各自が好きなゲームを開始できます。",
    gameWaitHostStart: "ホストの開始を待っています...",
    gameWaitPeerReconnect: "相手の再接続を待っています...",
    lobbyNoPeer: "参加者がまだ接続していません。",
    roleHost: "ホスト",
    roleGuest: "ゲスト",
    roleSpectator: "観戦",
    spectatorReadOnly: "観戦中です。試合には参加できません。",
    labelRoom: "ルーム",
    labelRole: "役割",
    labelParticipants: "参加人数",
    lobbyPlayersTitle: "参加プレイヤー",
    lobbyPlayerYou: "あなた",
    lobbyPlayerRoleHost: "ホスト",
    lobbyPlayerRoleGuest: "プレイヤー",
    lobbyPlayerRoleSpectator: "観戦",
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
    registerAndPlay: "SIGN UP",
    playAsGuest: "PLAY AS GUEST",
    entryGuestSelected: "게스트 모드로 시작했습니다",
    loginConfirmPrompt: "로그인하시겠습니까?",
    registerConfirmPrompt: "이 ID로 신규 가입할까요?",
    loginCanceled: "로그인을 취소했습니다",
    registerCanceled: "신규 가입을 취소했습니다",
    registerSuccess: "신규 가입이 완료되었습니다",
    registerDuplicate: "이미 사용 중인 ID입니다. 로그인을 이용하세요",
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
    minesweeperCardDesc: "VS 플레이어와 난이도 모드를 지원하는 마인스위퍼.",
    mahjongCardDesc: "같은 패를 클릭해 제거하는 클릭형 마작 페어 게임.",
    solitaireCardDesc: "클론다이크 솔리테어. A부터 K까지 4세트를 완성하면 클리어.",
    lobbyCardGamesTitle: "카드게임 목록",
    lobbyCardGamesDesc: "룸에서 플레이 가능한 카드게임을 여기서 선택합니다.",
    lobbyCardGamesOpen: "목록 보기",
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
    minesweeperSubtitle: "VS 플레이어와 난이도 모드를 골라 마인스위퍼를 플레이하세요.",
    mahjongSubtitle: "같은 패를 2번 이하로 꺾는 선으로 연결하면 제거됩니다. 전부 지우면 클리어.",
    solitaireSubtitle: "스톡에서 카드를 넘겨 정리하고, 4개의 파운데이션을 완성하세요.",
    unoModeCpu: "1P vs CPU",
    unoModeLocal: "2P LOCAL",
    createRoom: "룸 만들기",
    join: "참가",
    spectateJoin: "관전 참가",
    spectateToggleToSpectator: "관전",
    spectateToggleToPlayer: "플레이어",
    play: "플레이",
    backToMenu: "메뉴로",
    othelloStart: "오셀로 시작",
    shogiStart: "쇼기 시작",
    chessStart: "체스 시작",
    unoStart: "UNO 시작",
    gomokuStart: "오목 시작",
    survivorsStart: "서바이버 시작",
    fitPuzzleStart: "핏 퍼즐 시작",
    minesweeperStart: "마인스위퍼 시작",
    solitaireStart: "솔리테어 시작",
    mahjongStart: "마작 시작",
    sevensStart: "세븐스 시작",
    numeronStart: "뉴메론 시작",
    bankGacha: "SKIN GACHA",
    bankGacha10: "SKIN GACHA x10",
    singlePlay: "싱글",
    multiPlay: "멀티",
    quickMatchMulti: "빠른 매치 (멀티)",
    optionsMenu: "option",
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
    roomChatTitle: "룸 채팅",
    roomChatPlaceholder: "메시지를 입력",
    roomChatSend: "전송",
    roomChatEmpty: "아직 메시지가 없습니다",
    roomChatMuted: "채팅 전송이 제한되었습니다",
    roomChatRateLimited: "전송이 너무 빠릅니다. 잠시 후 다시 시도하세요",
    newGame: "GAME START",
    remake: "REMAKE",
    menu: "메뉴",
    newMatch: "GAME START",
    menuJa: "메뉴",
    rotate: "회전",
    shuffle: "셔플",
    hint: "힌트",
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
    friendsTitle: "친구",
    friendsToggle: "친구 목록",
    friendsClose: "닫기",
    friendsHintNoAuth: "로그인하면 친구 목록을 불러옵니다",
    friendsHintReady: "친구 ID로 추가/삭제할 수 있습니다",
    friendsHintIncoming: "대기 탭에서 신청자 ID를 승인/거절할 수 있습니다",
    friendsHintOutgoing: "신청 중 탭에서 보낸 요청을 취소할 수 있습니다",
    friendsTabFriends: "친구",
    friendsTabIncoming: "대기",
    friendsTabOutgoing: "신청 중",
    friendIdPlaceholder: "친구 ID",
    friendAdd: "추가",
    friendRequestSend: "신청",
    friendApprove: "승인",
    friendReject: "거절",
    friendCancel: "취소",
    friendRemove: "삭제",
    friendReload: "새로고침",
    friendsLoading: "친구 목록을 불러오는 중...",
    friendsListEmpty: "친구가 아직 없습니다",
    friendsIncomingEmpty: "대기 중인 요청이 없습니다",
    friendsOutgoingEmpty: "신청 중인 사용자가 없습니다",
    friendsLoadFailed: "친구 목록을 불러오지 못했습니다",
    friendIdRequired: "친구 ID를 입력하세요",
    friendAddSuccess: "친구를 추가했습니다",
    friendRequestSent: "친구 요청을 보냈습니다",
    friendApproveSuccess: "친구 요청을 승인했습니다",
    friendRejectSuccess: "친구 요청을 거절했습니다",
    friendCancelSuccess: "친구 요청을 취소했습니다",
    friendRemoveSuccess: "친구를 삭제했습니다",
    friendAddFailed: "친구 추가에 실패했습니다",
    friendRequestSendFailed: "친구 요청 전송에 실패했습니다",
    friendApproveFailed: "친구 요청 승인에 실패했습니다",
    friendRejectFailed: "친구 요청 거절에 실패했습니다",
    friendCancelFailed: "친구 요청 취소에 실패했습니다",
    friendRemoveFailed: "친구 삭제에 실패했습니다",
    friendNotFound: "해당 ID의 사용자를 찾을 수 없습니다",
    friendSelfForbidden: "자기 자신은 추가할 수 없습니다",
    friendRequestAlreadySent: "이미 요청을 보냈습니다",
    friendRequestAlreadyReceived: "상대 요청이 도착했습니다. 대기 탭에서 승인해 주세요",
    friendRequestNotFound: "대상 요청을 찾을 수 없습니다",
    cloudUserNotFound: "사용자가 존재하지 않습니다. 회원가입을 진행해 주세요",
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
    roomInGameSuggestSpectate: "경기 중이라 참가할 수 없습니다. 관전을 이용하세요.",
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
    lobbySelectSameGamePrompt: "호스트가 게임을 선택했습니다. 같은 게임을 선택해 시작하세요.",
    lobbySelectMatchOnly: "호스트가 선택한 게임만 시작할 수 있습니다.",
    roomArcadeModeNotice: "3명 이상 룸에서는 각자 원하는 게임을 시작할 수 있습니다.",
    gameWaitHostStart: "호스트 시작을 기다리는 중...",
    gameWaitPeerReconnect: "상대 재접속을 기다리는 중...",
    lobbyNoPeer: "아직 참가자가 연결되지 않았습니다.",
    roleHost: "HOST",
    roleGuest: "GUEST",
    roleSpectator: "SPECTATOR",
    spectatorReadOnly: "관전 중입니다. 경기에는 참가할 수 없습니다.",
    labelRoom: "ROOM",
    labelRole: "ROLE",
    labelParticipants: "참가 인원",
    lobbyPlayersTitle: "참가 플레이어",
    lobbyPlayerYou: "나",
    lobbyPlayerRoleHost: "호스트",
    lobbyPlayerRoleGuest: "플레이어",
    lobbyPlayerRoleSpectator: "관전",
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
  setTextById("roomCardGameSelect", tr("gameSelectTitle"));
  setTextById("roomCardDesc", tr("roomCardDesc"));
  setTextById("othelloCardDesc", tr("othelloCardDesc"));
  setTextById("shogiCardDesc", tr("shogiCardDesc"));
  setTextById("chessCardDesc", tr("chessCardDesc"));
  setTextById("unoCardDesc", tr("unoCardDesc"));
  setTextById("gomokuCardDesc", tr("gomokuCardDesc"));
  setTextById("survivorsCardDesc", tr("survivorsCardDesc"));
  setTextById("fitPuzzleCardDesc", tr("fitPuzzleCardDesc"));
  setTextById("minesweeperCardDesc", tr("minesweeperCardDesc"));
  setTextById("mahjongCardDesc", tr("mahjongCardDesc"));
  setTextById("solitaireCardDesc", tr("solitaireCardDesc"));
  setTextById("lobbyCardGamesTitle", tr("lobbyCardGamesTitle"));
  setTextById("lobbyCardGamesDesc", tr("lobbyCardGamesDesc"));
  if (lobbyOpenCardGamesBtn) lobbyOpenCardGamesBtn.textContent = tr("lobbyCardGamesOpen");
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
  setTextById("minesweeperSubtitle", tr("minesweeperSubtitle"));
  setTextById("mahjongSubtitle", tr("mahjongSubtitle"));
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
  if (playMinesweeperBtn) playMinesweeperBtn.textContent = tr("play");
  if (playMahjongBtn) playMahjongBtn.textContent = tr("play");
  if (playSolitaireSingleBtn) playSolitaireSingleBtn.textContent = tr("singlePlay");
  if (playSolitaireMultiBtn) playSolitaireMultiBtn.textContent = tr("multiPlay");
  if (quickMatchBtn) quickMatchBtn.textContent = tr("quickMatchMulti");
  setTextById("roomPublicOptionLabel", tr("roomPublicToggle"));
  setTextById("roomPrivateOptionLabel", tr("roomPrivateToggle"));
  if (createRoomBtn) createRoomBtn.textContent = tr("createRoom");
  if (joinRoomBtn) joinRoomBtn.textContent = tr("join");
  if (spectateRoomBtn) spectateRoomBtn.textContent = tr("spectateJoin");
  if (entryLoginBtn) entryLoginBtn.textContent = tr("loginAndPlay");
  if (entryRegisterBtn) entryRegisterBtn.textContent = tr("registerAndPlay");
  if (entryGuestBtn) entryGuestBtn.textContent = tr("playAsGuest");
  if (menuMoreBtn) {
    menuMoreBtn.textContent = tr("optionsMenu");
    menuMoreBtn.setAttribute("aria-label", tr("optionsMenu"));
  }
  if (saveCloudAuthBtn) saveCloudAuthBtn.textContent = tr("saveCloudAuth");
  if (backToEntryBtn) backToEntryBtn.textContent = tr("backToLogin");
  if (friendsTitle) friendsTitle.textContent = tr("friendsTitle");
  if (friendUserIdInput) friendUserIdInput.placeholder = tr("friendIdPlaceholder");
  if (friendReloadBtn) friendReloadBtn.textContent = tr("friendReload");
  renderFriendsTabButtons();
  updateFriendsHintText(getCloudAuthFromStorage());
  updateFriendActionButtons(Boolean(getCloudAuthFromStorage()));
  if (friendsToggleBtn) {
    const isOpen = friendsPanel && !friendsPanel.classList.contains("hidden");
    friendsToggleBtn.textContent = isOpen ? tr("friendsClose") : tr("friendsToggle");
  }
  if (lobbyStartOthelloBtn) lobbyStartOthelloBtn.textContent = tr("othelloStart");
  if (lobbyStartShogiBtn) lobbyStartShogiBtn.textContent = tr("shogiStart");
  if (lobbyStartChessBtn) lobbyStartChessBtn.textContent = tr("chessStart");
  if (lobbyStartUnoBtn) lobbyStartUnoBtn.textContent = tr("unoStart");
  if (lobbyStartGomokuBtn) lobbyStartGomokuBtn.textContent = tr("gomokuStart");
  if (lobbyStartSurvivorsBtn) lobbyStartSurvivorsBtn.textContent = tr("survivorsStart");
  if (lobbyStartFitPuzzleBtn) lobbyStartFitPuzzleBtn.textContent = tr("fitPuzzleStart");
  if (lobbyStartMinesweeperBtn) lobbyStartMinesweeperBtn.textContent = tr("minesweeperStart");
  if (lobbyStartSolitaireBtn) lobbyStartSolitaireBtn.textContent = tr("solitaireStart");
  if (lobbyStartMahjongBtn) lobbyStartMahjongBtn.textContent = tr("mahjongStart");
  if (lobbyStartSevensBtn) lobbyStartSevensBtn.textContent = tr("sevensStart");
  if (lobbyStartNumeronBtn) lobbyStartNumeronBtn.textContent = tr("numeronStart");
  updateLobbySpectateToggleButton();
  if (lobbyBackBtn) lobbyBackBtn.textContent = tr("backToMenu");
  if (lobbyPlayersTitle) lobbyPlayersTitle.textContent = tr("lobbyPlayersTitle");
  if (copyInviteLinkBtn) copyInviteLinkBtn.textContent = tr("copyInviteLink");
  if (globalRematchBtn) globalRematchBtn.textContent = tr("rematchApproveNow");
  if (spectatorBadge) spectatorBadge.textContent = tr("spectatorBadge");
  setTextById("spectatorChatTitle", tr("spectatorChatTitle"));
  if (spectatorChatInput) spectatorChatInput.placeholder = tr("spectatorChatPlaceholder");
  if (spectatorChatSendBtn) spectatorChatSendBtn.textContent = tr("spectatorChatSend");
  setTextById("roomChatTitle", tr("roomChatTitle"));
  if (roomChatInput) roomChatInput.placeholder = tr("roomChatPlaceholder");
  if (roomChatSendBtn) roomChatSendBtn.textContent = tr("roomChatSend");

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
  setTextById("mahjongStartBtn", tr("newMatch"));
  setTextById("mahjongShuffleBtn", tr("shuffle"));
  setTextById("mahjongHintBtn", tr("hint"));
  setTextById("mahjongMenuBtn", tr("menu"));
  setTextById("solitaireStartBtn", tr("newMatch"));
  setTextById("solitaireResetBtn", tr("resetEn"));
  setTextById("solitaireMenuBtn", tr("menu"));

  const menuTitle = menuScreen?.querySelector(".top-bar h1");
  if (menuTitle) menuTitle.textContent = tr("gameSelectTitle");
  updateConnectionText();
}

function setFriendsPanelOpen(open) {
  if (!friendsPanel) return;
  if (open) {
    setMenuMoreOpen(false);
  }
  friendsPanel.classList.toggle("hidden", !open);
  if (friendsToggleBtn) {
    friendsToggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
    friendsToggleBtn.textContent = open ? tr("friendsClose") : tr("friendsToggle");
  }
  if (open) {
    void refreshFriendsList();
  }
}

function setMenuMoreOpen(open) {
  if (!menuMorePanel || !menuMoreBtn) return;
  if (open) {
    friendsPanel?.classList.add("hidden");
    if (friendsToggleBtn) {
      friendsToggleBtn.setAttribute("aria-expanded", "false");
      friendsToggleBtn.textContent = tr("friendsToggle");
    }
  }
  menuMorePanel.classList.toggle("hidden", !open);
  menuMoreBtn.setAttribute("aria-expanded", open ? "true" : "false");
}

function updateFriendsAvailability() {
  if (!friendsPanel || !friendsToggleBtn) return;
  const auth = getCloudAuthFromStorage();
  const inMenu = !menuScreen.classList.contains("hidden");
  friendsToggleBtn.classList.toggle("hidden", !inMenu);

  if (!inMenu) {
    setFriendsPanelOpen(false);
    return;
  }

  if (!auth && friendsHint) {
    friendsHint.textContent = tr("friendsHintNoAuth");
  }

  const isOpen = !friendsPanel.classList.contains("hidden");
  friendsToggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  friendsToggleBtn.textContent = isOpen ? tr("friendsClose") : tr("friendsToggle");
}

function setFriendsMessage(text) {
  if (!friendsMessage) return;
  friendsMessage.textContent = text;
}

const friendsViewState = {
  activeTab: "friends",
  friends: [],
  incoming: [],
  outgoing: [],
};

function normalizeFriendTab(tab) {
  if (tab === "incoming" || tab === "outgoing") return tab;
  return "friends";
}

function activeFriendRows() {
  if (friendsViewState.activeTab === "incoming") return friendsViewState.incoming;
  if (friendsViewState.activeTab === "outgoing") return friendsViewState.outgoing;
  return friendsViewState.friends;
}

function activeFriendEmptyMessageKey() {
  if (friendsViewState.activeTab === "incoming") return "friendsIncomingEmpty";
  if (friendsViewState.activeTab === "outgoing") return "friendsOutgoingEmpty";
  return "friendsListEmpty";
}

function sanitizeFriendIds(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((id) => String(id || "").trim())
    .filter(Boolean)
    .slice(0, 200);
}

function applyFriendLists(data) {
  if (!data || typeof data !== "object") return;
  if (Array.isArray(data.friends)) friendsViewState.friends = sanitizeFriendIds(data.friends);
  if (Array.isArray(data.incoming)) friendsViewState.incoming = sanitizeFriendIds(data.incoming);
  if (Array.isArray(data.outgoing)) friendsViewState.outgoing = sanitizeFriendIds(data.outgoing);
}

function renderFriendsTabButtons() {
  const friendCount = friendsViewState.friends.length;
  const incomingCount = friendsViewState.incoming.length;
  const outgoingCount = friendsViewState.outgoing.length;

  if (friendsTabFriendsBtn) {
    friendsTabFriendsBtn.textContent = `${tr("friendsTabFriends")} (${friendCount})`;
    const selected = friendsViewState.activeTab === "friends";
    friendsTabFriendsBtn.classList.toggle("active", selected);
    friendsTabFriendsBtn.setAttribute("aria-selected", selected ? "true" : "false");
  }
  if (friendsTabIncomingBtn) {
    friendsTabIncomingBtn.textContent = `${tr("friendsTabIncoming")} (${incomingCount})`;
    const selected = friendsViewState.activeTab === "incoming";
    friendsTabIncomingBtn.classList.toggle("active", selected);
    friendsTabIncomingBtn.setAttribute("aria-selected", selected ? "true" : "false");
  }
  if (friendsTabOutgoingBtn) {
    friendsTabOutgoingBtn.textContent = `${tr("friendsTabOutgoing")} (${outgoingCount})`;
    const selected = friendsViewState.activeTab === "outgoing";
    friendsTabOutgoingBtn.classList.toggle("active", selected);
    friendsTabOutgoingBtn.setAttribute("aria-selected", selected ? "true" : "false");
  }
}

function updateFriendsHintText(auth) {
  if (!friendsHint) return;
  if (!auth) {
    friendsHint.textContent = tr("friendsHintNoAuth");
    return;
  }
  if (friendsViewState.activeTab === "incoming") {
    friendsHint.textContent = tr("friendsHintIncoming");
    return;
  }
  if (friendsViewState.activeTab === "outgoing") {
    friendsHint.textContent = tr("friendsHintOutgoing");
    return;
  }
  friendsHint.textContent = tr("friendsHintReady");
}

function updateFriendActionButtons(enabled) {
  const tab = normalizeFriendTab(friendsViewState.activeTab);
  if (friendAddBtn) {
    if (tab === "friends") friendAddBtn.textContent = tr("friendRequestSend");
    if (tab === "incoming") friendAddBtn.textContent = tr("friendApprove");
    if (tab === "outgoing") friendAddBtn.textContent = tr("friendRequestSend");
  }
  if (friendRemoveBtn) {
    if (tab === "friends") friendRemoveBtn.textContent = tr("friendRemove");
    if (tab === "incoming") friendRemoveBtn.textContent = tr("friendReject");
    if (tab === "outgoing") friendRemoveBtn.textContent = tr("friendCancel");
  }

  const disableAddOnOutgoing = tab === "outgoing";
  if (friendAddBtn) friendAddBtn.disabled = !enabled || disableAddOnOutgoing;
  if (friendRemoveBtn) friendRemoveBtn.disabled = !enabled;
  if (friendReloadBtn) friendReloadBtn.disabled = !enabled;
}

function setFriendsTab(tab) {
  friendsViewState.activeTab = normalizeFriendTab(tab);
  renderFriendsTabButtons();
  const auth = getCloudAuthFromStorage();
  updateFriendsHintText(auth);
  updateFriendActionButtons(Boolean(auth));
  renderFriendsList();
}

function setFriendsButtonsEnabled(enabled) {
  updateFriendActionButtons(enabled);
}

function renderFriendsList() {
  if (!friendsList) return;
  friendsList.innerHTML = "";
  const rows = activeFriendRows();
  if (!rows.length) {
    const li = document.createElement("li");
    li.textContent = tr(activeFriendEmptyMessageKey());
    friendsList.appendChild(li);
    return;
  }

  rows.forEach((id) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = String(id);
    button.addEventListener("click", () => {
      if (friendUserIdInput) friendUserIdInput.value = String(id);
      friendUserIdInput?.focus();
    });
    li.appendChild(button);
    friendsList.appendChild(li);
  });
}

async function refreshFriendsList() {
  if (!friendsPanel) return;
  if (friendsPanel.classList.contains("hidden")) return;
  const auth = getCloudAuthFromStorage();
  if (!auth) {
    friendsViewState.friends = [];
    friendsViewState.incoming = [];
    friendsViewState.outgoing = [];
    renderFriendsTabButtons();
    updateFriendsHintText(null);
    renderFriendsList();
    setFriendsMessage("");
    setFriendsButtonsEnabled(false);
    return;
  }

  updateFriendsHintText(auth);
  setFriendsButtonsEnabled(false);
  setFriendsMessage(tr("friendsLoading"));

  const requestBody = {
    userId: auth.userId,
    password: auth.password,
  };

  try {
    const [friendsRes, incomingRes, outgoingRes] = await Promise.all([
      cloudApiRequest("/api/friends/list", requestBody),
      cloudApiRequest("/api/friends/request/incoming", requestBody),
      cloudApiRequest("/api/friends/request/outgoing", requestBody),
    ]);
    applyFriendLists(friendsRes?.data);
    applyFriendLists(incomingRes?.data);
    applyFriendLists(outgoingRes?.data);
    renderFriendsTabButtons();
    renderFriendsList();
    setFriendsMessage("");
  } catch {
    friendsViewState.friends = [];
    friendsViewState.incoming = [];
    friendsViewState.outgoing = [];
    renderFriendsTabButtons();
    renderFriendsList();
    setFriendsMessage(tr("friendsLoadFailed"));
  } finally {
    setFriendsButtonsEnabled(true);
  }
}

async function mutateFriend(action) {
  const auth = getCloudAuthFromStorage();
  if (!auth) {
    setFriendsMessage(tr("cloudAuthInvalid"));
    return;
  }
  const friendUserId = String(friendUserIdInput?.value || "").trim().slice(0, 24);
  if (!friendUserId) {
    setFriendsMessage(tr("friendIdRequired"));
    return;
  }

  const tab = normalizeFriendTab(friendsViewState.activeTab);
  let endpoint = "";
  let payloadKey = "";
  let successMessageKey = "";
  let failedMessageKey = "";

  if (action === "add" && tab === "friends") {
    endpoint = "/api/friends/request/send";
    payloadKey = "targetUserId";
    successMessageKey = "friendRequestSent";
    failedMessageKey = "friendRequestSendFailed";
  } else if (action === "add" && tab === "incoming") {
    endpoint = "/api/friends/request/approve";
    payloadKey = "requesterUserId";
    successMessageKey = "friendApproveSuccess";
    failedMessageKey = "friendApproveFailed";
  } else if (action === "remove" && tab === "friends") {
    endpoint = "/api/friends/remove";
    payloadKey = "friendUserId";
    successMessageKey = "friendRemoveSuccess";
    failedMessageKey = "friendRemoveFailed";
  } else if (action === "remove" && tab === "incoming") {
    endpoint = "/api/friends/request/reject";
    payloadKey = "requesterUserId";
    successMessageKey = "friendRejectSuccess";
    failedMessageKey = "friendRejectFailed";
  } else if (action === "remove" && tab === "outgoing") {
    endpoint = "/api/friends/request/cancel";
    payloadKey = "targetUserId";
    successMessageKey = "friendCancelSuccess";
    failedMessageKey = "friendCancelFailed";
  }

  if (!endpoint || !payloadKey) {
    setFriendsMessage(tr("friendRequestSendFailed"));
    return;
  }

  setFriendsButtonsEnabled(false);
  try {
    const { data } = await cloudApiRequest(endpoint, {
      userId: auth.userId,
      password: auth.password,
      [payloadKey]: friendUserId,
    });
    applyFriendLists(data);
    renderFriendsTabButtons();
    renderFriendsList();
    setFriendsMessage(tr(successMessageKey));
  } catch (err) {
    const code = String(err?.code || "");
    if (code === "FRIEND_NOT_FOUND") {
      setFriendsMessage(tr("friendNotFound"));
    } else if (code === "FRIEND_SELF_FORBIDDEN") {
      setFriendsMessage(tr("friendSelfForbidden"));
    } else if (code === "REQUEST_ALREADY_SENT") {
      setFriendsMessage(tr("friendRequestAlreadySent"));
    } else if (code === "REQUEST_ALREADY_RECEIVED") {
      setFriendsMessage(tr("friendRequestAlreadyReceived"));
    } else if (code === "REQUEST_NOT_FOUND") {
      setFriendsMessage(tr("friendRequestNotFound"));
    } else {
      setFriendsMessage(tr(failedMessageKey));
    }
  } finally {
    setFriendsButtonsEnabled(true);
  }
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
const GAME_SELECTION_KEYS = [
  "othello",
  "shogi",
  "chess",
  "uno",
  "gomoku",
  "survivors",
  "fitPuzzle",
  "minesweeper",
  "solitaire",
  "mahjong",
  "sevens",
  "numeron",
];
const roomServerUrl = resolveRoomServerUrl({
  storageKey: STORAGE_ROOM_SERVER_URL_KEY,
  queryParamKey: ROOM_SERVER_QUERY_PARAM_KEY,
  defaultUrl: DEFAULT_ROOM_SERVER_URL,
});

const roomSession = {
  code: null,
  role: null,
  hostPeerId: null,
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
  quickMatchAttempt: 0,
  quickMatchSeed: 0,
  quickMatchTriedCodes: new Set(),
  roomVisibility: "public",
  activeGame: null,
  spectateIntent: false,
  pendingInviteToken: "",
  rematchVotes: new Set(),
  spectatorChatMessages: [],
  roomChatMessages: [],
  gameSelections: new Map(),
};

function createRoomMessageId() {
  const rnd = typeof crypto?.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  return `msg-${peerId.slice(0, 8)}-${rnd}`.slice(0, 80);
}

let inviteTokenRequestResolve = null;

const gameScreens = {
  othello: othelloScreen,
  shogi: shogiScreen,
  chess: chessScreen,
  uno: unoScreen,
  gomoku: gomokuScreen,
  survivors: survivorsScreen,
  fitPuzzle: fitPuzzleScreen,
  minesweeper: minesweeperScreen,
  solitaire: solitaireScreen,
  mahjong: mahjongScreen,
  sevens: sevensScreen,
  numeron: numeronScreen,
};

let games = null;
let currentGameKey = "othello";
let entryLoadingTimerId = 0;
let entryLoadingStartedAt = 0;

const CLOUD_API_TIMEOUT_MS = 4500;
const LOGIN_FLOW_TIMEOUT_MS = 30000;

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

function hashStringSeed(text) {
  let hash = 0;
  const input = String(text || "");
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) % 1000003;
  }
  return Math.abs(hash);
}

function quickMatchOffsetByAttempt(attempt) {
  if (attempt <= 0) return 0;
  const depth = Math.ceil(attempt / 2);
  return attempt % 2 === 1 ? depth : -depth;
}

function nextQuickMatchCodeCandidate() {
  const MAX_QUICK_MATCH_ATTEMPTS = 80;
  for (let i = 0; i < MAX_QUICK_MATCH_ATTEMPTS; i += 1) {
    const attempt = roomSession.quickMatchAttempt;
    const jitter = roomSession.quickMatchSeed % 7;
    const offset = quickMatchOffsetByAttempt(attempt) + jitter;
    const code = generateQuickMatchCode(offset);
    roomSession.quickMatchAttempt += 1;
    if (roomSession.quickMatchTriedCodes.has(code)) continue;
    roomSession.quickMatchTriedCodes.add(code);
    return code;
  }

  roomSession.quickMatchAttempt = 0;
  roomSession.quickMatchTriedCodes.clear();
  const fallback = generateQuickMatchCode(roomSession.quickMatchSeed % 9);
  roomSession.quickMatchTriedCodes.add(fallback);
  roomSession.quickMatchAttempt = 1;
  return fallback;
}

function retryQuickMatch(playerName) {
  const code = nextQuickMatchCodeCandidate();
  if (roomCodeInput) roomCodeInput.value = code;
  setMenuMessage(tr("quickMatchSearching"));
  void attachRoom(code, "guest", playerName, {
    quickMatchMode: true,
    quickJoin: true,
    roomPublic: true,
  });
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
  if (entryLoginBtn) {
    entryLoginBtn.disabled = !visible;
  }
  if (entryRegisterBtn) {
    entryRegisterBtn.disabled = !visible;
  }
  if (entryGuestBtn) {
    entryGuestBtn.disabled = !visible;
  }
  if (entryCloudUserIdInput) entryCloudUserIdInput.disabled = !visible;
  if (entryCloudPasswordInput) entryCloudPasswordInput.disabled = !visible;
}

function renderEntryLoadingProgress() {
  if (!entryLoadingFill || !entryLoadingElapsed || !entryLoadingPanel) return;
  const elapsedMs = Math.max(0, performance.now() - entryLoadingStartedAt);
  const elapsedSec = elapsedMs / 1000;
  const rawRatio = elapsedMs / LOGIN_FLOW_TIMEOUT_MS;
  let progress = rawRatio * 100;
  if (progress > 100) {
    progress = 92 + ((Math.sin(elapsedMs / 220) + 1) * 4);
  }

  let stage = "fast";
  if (rawRatio >= 0.85) {
    stage = "slow";
  } else if (rawRatio >= 0.5) {
    stage = "mid";
  }
  entryLoadingPanel.dataset.stage = stage;

  entryLoadingFill.style.width = `${Math.max(0, Math.min(100, progress)).toFixed(1)}%`;
  entryLoadingElapsed.textContent = `${elapsedSec.toFixed(1)}秒`;
}

function startEntryLoading(text = "接続中...") {
  if (!entryLoadingPanel) return;
  if (entryLoadingTimerId) {
    window.clearInterval(entryLoadingTimerId);
    entryLoadingTimerId = 0;
  }
  entryLoadingStartedAt = performance.now();
  entryLoadingPanel.dataset.stage = "fast";
  entryLoadingPanel.classList.remove("hidden");
  if (entryLoadingText) entryLoadingText.textContent = text;
  renderEntryLoadingProgress();
  entryLoadingTimerId = window.setInterval(renderEntryLoadingProgress, 80);
}

function stopEntryLoading() {
  if (entryLoadingTimerId) {
    window.clearInterval(entryLoadingTimerId);
    entryLoadingTimerId = 0;
  }
  if (entryLoadingFill) entryLoadingFill.style.width = "0%";
  if (entryLoadingElapsed) entryLoadingElapsed.textContent = "0.0秒";
  if (entryLoadingPanel) entryLoadingPanel.dataset.stage = "fast";
  entryLoadingPanel?.classList.add("hidden");
}

function setLobbyMessage(text) {
  lobbyMessage.textContent = text;
}

function setCardListMessage(text) {
  if (!cardListMessage) return;
  cardListMessage.textContent = text;
}

function setCasinoListMessage(text) {
  if (!casinoListMessage) return;
  casinoListMessage.textContent = text;
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

function shouldShowRoomChat() {
  return Boolean(roomSession.code) && roomSession.role !== "spectator";
}

function renderRoomChat() {
  if (!roomChatPanel || !roomChatLog) return;
  const visible = shouldShowRoomChat();
  roomChatPanel.classList.toggle("hidden", !visible);
  roomChatLog.innerHTML = "";
  if (!visible) return;
  if (!roomSession.roomChatMessages.length) {
    const empty = document.createElement("p");
    empty.className = "room-chat-empty";
    empty.textContent = tr("roomChatEmpty");
    roomChatLog.appendChild(empty);
    return;
  }

  roomSession.roomChatMessages.slice(-80).forEach((message) => {
    const row = document.createElement("p");
    row.className = "room-chat-item";
    row.textContent = `${message.name}: ${message.text}`;
    roomChatLog.appendChild(row);
  });
  roomChatLog.scrollTop = roomChatLog.scrollHeight;
}

function appendRoomChatMessage(name, text) {
  const normalizedName = normalizeName(name || "Player");
  const normalizedText = String(text || "").trim().slice(0, 200);
  if (!normalizedText) return;
  roomSession.roomChatMessages.push({ name: normalizedName, text: normalizedText });
  if (roomSession.roomChatMessages.length > 160) {
    roomSession.roomChatMessages.splice(0, roomSession.roomChatMessages.length - 160);
  }
  renderRoomChat();
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
  const primaryBase = window.location.origin.replace(/\/$/, "");
  const candidates = [...cloudApiCandidates()].sort((a, b) => {
    const aIsPrimary = a === primaryBase;
    const bIsPrimary = b === primaryBase;
    if (aIsPrimary && !bIsPrimary) return -1;
    if (!aIsPrimary && bIsPrimary) return 1;
    return 0;
  });
  const authoritativeCodes = new Set([
    "USER_NOT_FOUND",
    "INVALID_PASSWORD",
    "USER_ALREADY_EXISTS",
    "AUTH_REQUIRED",
    "FRIEND_NOT_FOUND",
    "FRIEND_SELF_FORBIDDEN",
    "FRIEND_ID_REQUIRED",
  ]);

  let lastError = null;
  for (let i = 0; i < candidates.length; i += 1) {
    const base = candidates[i];
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), CLOUD_API_TIMEOUT_MS);
    try {
      const res = await fetch(`${base}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      // If this candidate cannot handle the cloud endpoint, try the next one.
      // Some hosts may return HTML (index page) for unknown /api paths; treat that as a failure.
      if (!res.ok || data?.ok !== true) {
        const err = new Error(data?.message || `Cloud API request failed at ${base}`);
        err.code = data?.code || (res.ok ? "INVALID_API_RESPONSE" : "CLOUD_REQUEST_ERROR");
        err.status = res.status;
        // USER_NOT_FOUND can be a false negative when multiple cloud endpoints are configured.
        // Keep trying remaining candidates before concluding this user does not exist.
        if (err.code === "USER_NOT_FOUND" && i < candidates.length - 1) {
          lastError = err;
          continue;
        }
        if (authoritativeCodes.has(err.code)) {
          throw err;
        }
        lastError = err;
        continue;
      }

      return { res, data };
    } catch (err) {
      lastError = err;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  throw lastError || new Error("Cloud API request failed");
}

function withTimeout(promise, timeoutMs, timeoutMessage = "Request timeout") {
  let timeoutId = 0;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

async function verifyCloudAuth(userId, password) {
  try {
    const { res, data } = await cloudApiRequest("/api/auth/login", { userId, password });
    if (res.ok && data?.ok !== false) {
      return { ok: true, profile: data?.profile || null };
    }
    if (data?.code === "USER_NOT_FOUND") {
      return { ok: false, reason: "not_found" };
    }
    if (data?.code === "INVALID_PASSWORD") {
      return { ok: false, reason: "duplicate" };
    }
    return { ok: false, reason: "failed" };
  } catch (err) {
    if (String(err?.code || "") === "USER_NOT_FOUND") {
      return { ok: false, reason: "not_found" };
    }
    if (String(err?.code || "") === "INVALID_PASSWORD") {
      return { ok: false, reason: "duplicate" };
    }
    return { ok: false, reason: "failed" };
  }
}

async function registerCloudAuth(userId, password) {
  try {
    const { res, data } = await cloudApiRequest("/api/auth/register", { userId, password });
    if (res.ok && data?.ok !== false) {
      return { ok: true, profile: data?.profile || null };
    }
    if (data?.code === "USER_ALREADY_EXISTS") {
      return { ok: false, reason: "duplicate" };
    }
    return { ok: false, reason: "failed" };
  } catch (err) {
    if (String(err?.code || "") === "USER_ALREADY_EXISTS") {
      return { ok: false, reason: "duplicate" };
    }
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
  setMenuMoreOpen(false);
  entryScreen.classList.add("hidden");
  menuScreen.classList.add("hidden");
  cardListScreen.classList.add("hidden");
  casinoListScreen.classList.add("hidden");
  lobbyScreen.classList.add("hidden");
  othelloScreen.classList.add("hidden");
  shogiScreen.classList.add("hidden");
  chessScreen.classList.add("hidden");
  unoScreen.classList.add("hidden");
  gomokuScreen.classList.add("hidden");
  survivorsScreen.classList.add("hidden");
  fitPuzzleScreen.classList.add("hidden");
  minesweeperScreen.classList.add("hidden");
  solitaireScreen.classList.add("hidden");
  mahjongScreen.classList.add("hidden");
  sevensScreen.classList.add("hidden");
  numeronScreen.classList.add("hidden");
  screen.classList.remove("hidden");
  updateFriendsAvailability();
}

function showEntryScreen() {
  showOnly(entryScreen);
  setFriendsPanelOpen(false);
}

function showMenuScreen() {
  showOnly(menuScreen);
  void refreshFriendsList();
}

function showCardListScreen() {
  showOnly(cardListScreen);
}

function showCasinoListScreen() {
  showOnly(casinoListScreen);
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

function normalizeSelectionGameKey(raw) {
  const key = String(raw || "").trim();
  return GAME_SELECTION_KEYS.includes(key) ? key : "";
}

function cleanupGameSelections() {
  const participantIds = new Set(roomSession.participants.keys());
  [...roomSession.gameSelections.keys()].forEach((id) => {
    if (!participantIds.has(id)) {
      roomSession.gameSelections.delete(id);
      return;
    }
    const gameKey = normalizeSelectionGameKey(roomSession.gameSelections.get(id));
    if (!gameKey) {
      roomSession.gameSelections.delete(id);
    }
  });
}

function setLocalGameSelection(gameKey, { broadcast = true } = {}) {
  const normalized = normalizeSelectionGameKey(gameKey);
  if (!normalized || !roomSession.code) return;
  roomSession.gameSelections.set(peerId, normalized);
  updateLobbyView();
  if (broadcast) {
    postRoomMessage({ type: "game-selection", game: normalized });
  }
}

function renderLobbyGameCounts(totalParticipants) {
  if (!lobbyGameCountNodes || lobbyGameCountNodes.length === 0) return;
  cleanupGameSelections();
  const total = Math.max(0, Number(totalParticipants) || 0);

  const counts = new Map();
  GAME_SELECTION_KEYS.forEach((gameKey) => counts.set(gameKey, 0));
  roomSession.gameSelections.forEach((gameKey) => {
    const normalized = normalizeSelectionGameKey(gameKey);
    if (!normalized) return;
    counts.set(normalized, (counts.get(normalized) || 0) + 1);
  });

  lobbyGameCountNodes.forEach((node) => {
    const gameKey = normalizeSelectionGameKey(node.getAttribute("data-lobby-game-count"));
    if (!gameKey) return;
    const current = counts.get(gameKey) || 0;
    node.textContent = `${current}/${total}`;
  });
}

function lobbyRoleLabelByPeerId(id) {
  if (roomSession.spectatorIds.has(id)) return tr("lobbyPlayerRoleSpectator");
  if (roomSession.hostPeerId && id === roomSession.hostPeerId) return tr("lobbyPlayerRoleHost");
  return tr("lobbyPlayerRoleGuest");
}

function renderLobbyPlayersList() {
  if (!lobbyPlayersList) return;

  const entries = [...roomSession.participants.entries()];
  const hostId = roomSession.hostPeerId;
  entries.sort(([aId], [bId]) => {
    const aRank = aId === hostId ? 0 : roomSession.spectatorIds.has(aId) ? 2 : 1;
    const bRank = bId === hostId ? 0 : roomSession.spectatorIds.has(bId) ? 2 : 1;
    if (aRank !== bRank) return aRank - bRank;
    return aId.localeCompare(bId);
  });

  lobbyPlayersList.innerHTML = "";
  if (entries.length === 0) {
    const li = document.createElement("li");
    li.textContent = "-";
    lobbyPlayersList.appendChild(li);
    return;
  }

  entries.forEach(([id, name]) => {
    const li = document.createElement("li");
    const roleLabel = lobbyRoleLabelByPeerId(id);
    const selfTag = id === peerId ? ` (${tr("lobbyPlayerYou")})` : "";
    li.textContent = `${name}${selfTag} - ${roleLabel}`;
    lobbyPlayersList.appendChild(li);
  });
}

function isRoomArcadeMode() {
  return Boolean(roomSession.code) && roomParticipantCount() >= 3;
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

function updateLobbySpectateToggleButton() {
  if (!lobbySwitchSpectateBtn) return;
  const inRoom = Boolean(roomSession.code);
  lobbySwitchSpectateBtn.disabled = !inRoom;
  lobbySwitchSpectateBtn.textContent = roomSession.role === "spectator"
    ? tr("spectateToggleToPlayer")
    : tr("spectateToggleToSpectator");
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
  if (lobbyParticipantsText) {
    lobbyParticipantsText.textContent = `${tr("labelParticipants")}: ${participants} / ${MAX_ROOM_PLAYERS}`;
  }
  lobbySelfNameText.textContent = `${tr("labelYou")}: ${roomSession.playerName}`;
  lobbyPeerNameText.textContent = `${tr("labelPeer")}: ${roomSession.peerName ?? "-"}`;
  lobbyPeerText.textContent = `${tr("labelStatus")}: ${peerLabel}`;
  updateConnectionText();
  renderLobbyGameCounts(participants);
  renderLobbyPlayersList();

  const hostCanStart = roomSession.role === "host" && roomSession.peerConnected;
  const arcadeMode = isRoomArcadeMode();
  const canFreePlay = arcadeMode && roomSession.role !== "spectator";
  const role = roomSession.role;
  const guestTarget = role === "guest" ? roomSession.selectedGame : null;
  const disabledForRole = (gameKey) => {
    if (canFreePlay) return false;
    if (role === "host") return !hostCanStart;
    if (role === "guest") return !guestTarget || guestTarget !== gameKey;
    return true;
  };

  if (lobbyStartOthelloBtn) lobbyStartOthelloBtn.disabled = disabledForRole("othello");
  if (lobbyStartShogiBtn) lobbyStartShogiBtn.disabled = disabledForRole("shogi");
  if (lobbyStartChessBtn) lobbyStartChessBtn.disabled = disabledForRole("chess");
  if (lobbyStartUnoBtn) lobbyStartUnoBtn.disabled = disabledForRole("uno");
  if (lobbyStartGomokuBtn) lobbyStartGomokuBtn.disabled = disabledForRole("gomoku");
  if (lobbyStartSurvivorsBtn) lobbyStartSurvivorsBtn.disabled = disabledForRole("survivors");
  if (lobbyStartSevensBtn) lobbyStartSevensBtn.disabled = disabledForRole("sevens");
  if (lobbyStartFitPuzzleBtn) lobbyStartFitPuzzleBtn.disabled = disabledForRole("fitPuzzle");
  if (lobbyStartMinesweeperBtn) lobbyStartMinesweeperBtn.disabled = disabledForRole("minesweeper");
  if (lobbyStartSolitaireBtn) lobbyStartSolitaireBtn.disabled = disabledForRole("solitaire");
  if (lobbyStartMahjongBtn) lobbyStartMahjongBtn.disabled = disabledForRole("mahjong");
  if (lobbyStartNumeronBtn) lobbyStartNumeronBtn.disabled = disabledForRole("numeron");
  updateLobbySpectateToggleButton();
  if (copyInviteLinkBtn) copyInviteLinkBtn.disabled = !roomSession.code;
  renderSpectatorBadge();
  renderRoomChat();
  renderSpectatorChat();
  updateRematchButtonVisibility();

  if (arcadeMode && !lobbyScreen.classList.contains("hidden")) {
    setLobbyMessage(tr("roomArcadeModeNotice"));
  }
}

function startRoomArcadeGame(gameKey) {
  const controller = controllerOf(gameKey);
  if (!controller) return;
  roomSession.selectedGame = null;
  roomSession.activeGame = null;
  currentGameKey = gameKey;
  if (gameKey === "solitaire") {
    controller.configureStandardMode?.();
  } else {
    controller.configureStandardMode?.("local");
  }
  showGameScreen(gameKey);
  controller.enterStandby?.();
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
  roomSession.quickMatchSeed = hashStringSeed(`${peerId}-${playerName}-${Date.now()}`) % 97;
  roomSession.quickMatchAttempt = 0;
  roomSession.quickMatchTriedCodes.clear();
  retryQuickMatch(playerName);
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
  roomSession.hostPeerId = null;
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
  roomSession.roomChatMessages = [];
  roomSession.gameSelections = new Map();
  if (inviteTokenRequestResolve) {
    inviteTokenRequestResolve("");
    inviteTokenRequestResolve = null;
  }
  setConnectionState("offline");
  roomSession.reconnectAttempt = 0;
  roomSession.quickMatchMode = false;
  roomSession.quickMatchAttempt = 0;
  roomSession.quickMatchSeed = 0;
  roomSession.quickMatchTriedCodes.clear();
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
    if (gameKey === "mahjong") {
      // Mahjong room mode lets host pick VS or CPU-coop before pressing GAME START.
      controller.enterStandby?.();
    } else {
      controller.startNewGame();
    }
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
    onRoomCursor: (payload) => {
      postRoomMessage({ type: "cursor", game: gameKey, payload });
    },
    onRoomDrawVote: (payload) => {
      postRoomMessage({ type: "draw-vote", game: gameKey, payload });
    },
    onRoomSnapshot: () => {
      const controller = controllerOf(gameKey);
      if (!controller) return;
      postRoomMessage({ type: "snapshot", game: gameKey, snapshot: controller.getSnapshot() });
    },
    onRoomCountdownStart: (seconds) => {
      postRoomMessage({ type: "countdown", game: gameKey, seconds: Number(seconds) || 3 });
    },
    onRoomNewGame: () => {
      const controller = controllerOf(gameKey);
      if (!controller) return;
      postRoomMessage({ type: "new-game", game: gameKey });
      postRoomMessage({ type: "snapshot", game: gameKey, snapshot: controller.getSnapshot() });
    },
    onRoomRemake: () => {
      postRoomMessage({ type: "remake", game: gameKey });
    },
    onRoomModeChange: (payload) => {
      postRoomMessage({ type: "mode", game: gameKey, payload });
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
  minesweeper: {
    screen: minesweeperScreen,
    controller: initMinesweeper(createGameCallbacks("minesweeper")),
  },
  mahjong: {
    screen: mahjongScreen,
    controller: initMahjong(createGameCallbacks("mahjong")),
  },
  solitaire: {
    screen: solitaireScreen,
    controller: initSolitaire(createGameCallbacks("solitaire")),
  },
  sevens: {
    screen: sevensScreen,
    controller: initSevens(createGameCallbacks("sevens")),
  },
  numeron: {
    screen: numeronScreen,
    controller: initNumeron(createGameCallbacks("numeron")),
  },
};

function handleRoomMessage(payload, roomCode) {
  if (!payload || payload.from === peerId) return;
  if (payload.to && payload.to !== peerId) return;

  if (payload.type === "room-state" && Array.isArray(payload.participants)) {
    const prevRole = roomSession.role;
    roomSession.hostPeerId = typeof payload.hostPeerId === "string" && payload.hostPeerId.trim()
      ? payload.hostPeerId.trim()
      : roomSession.hostPeerId;
    const selfEntry = payload.participants.find((entry) => entry && entry.id === peerId);
    if (selfEntry && (selfEntry.role === "host" || selfEntry.role === "guest" || selfEntry.role === "spectator")) {
      roomSession.role = selfEntry.role;
    } else if (typeof payload.hostPeerId === "string" && payload.hostPeerId.trim()) {
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
    cleanupGameSelections();
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
    const mySelection = normalizeSelectionGameKey(roomSession.gameSelections.get(peerId));
    if (mySelection) {
      postRoomMessage({ type: "game-selection", game: mySelection });
    }
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

  if (payload.type === "game-selection") {
    const gameKey = normalizeSelectionGameKey(payload.game);
    if (!gameKey) return;
    roomSession.gameSelections.set(payload.from, gameKey);
    updateLobbyView();
    return;
  }

  if (payload.type === "room-assigned" && payload.code) {
    roomSession.code = normalizeRoomCode(payload.code);
    if (roomCodeInput) roomCodeInput.value = roomSession.code;
    if (payload.role === "host" || payload.role === "guest" || payload.role === "spectator") {
      roomSession.role = payload.role;
      if (payload.role === "spectator") {
        setLobbyMessage(tr("spectatorReadOnly"));
      }
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
      retryQuickMatch(roomSession.playerName);
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
        retryQuickMatch(currentPlayerName);
      } else {
        setMenuMessage(tr("roomFullRejected", { code: rejectedCode }));
      }
    }
    return;
  }

  if (payload.type === "leave") {
    roomSession.gameSelections.delete(payload.from);
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
    if (isRoomArcadeMode()) {
      roomSession.selectedGame = payload.game;
      roomSession.activeGame = null;
      updateLobbyView();
      return;
    }
    roomSession.gameSelections.set(payload.from, payload.game);
    roomSession.selectedGame = payload.game;
    roomSession.activeGame = payload.game;
    roomSession.rematchVotes = new Set();
    if (roomSession.role === "guest") {
      showLobbyScreen();
      updateLobbyView();
      setLobbyMessage(tr("lobbySelectSameGamePrompt"));
      return;
    }
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

  if (payload.type === "countdown" && payload.game) {
    const controller = controllerOf(payload.game);
    if (!controller) return;
    controller.applyRoomCountdown?.(Number(payload.seconds) || 3);
    return;
  }

  if (payload.type === "cursor" && payload.game && payload.payload) {
    const controller = controllerOf(payload.game);
    if (!controller) return;
    controller.applyRoomCursor?.(payload.payload);
    return;
  }

  if (payload.type === "remake" && payload.game) {
    const controller = controllerOf(payload.game);
    if (!controller) return;
    controller.applyRoomRemake?.();
    return;
  }

  if (payload.type === "mode" && payload.game && payload.payload) {
    const controller = controllerOf(payload.game);
    if (!controller) return;
    controller.applyRoomMode?.(payload.payload);
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

  if (payload.type === "chat") {
    appendRoomChatMessage(payload.name || payload.from || "Player", payload.text || "");
    return;
  }

  if (payload.type === "error") {
    const code = String(payload.code || "");
    if (code === "MUTED") {
      setLobbyMessage(tr("roomChatMuted"));
      return;
    }
    if (code.startsWith("RATE_LIMIT_")) {
      setLobbyMessage(tr("roomChatRateLimited"));
    }
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
  roomSession.hostPeerId = role === "host" ? peerId : null;
  roomSession.transport = null;
  roomSession.transportKind = "none";
  roomSession.peerConnected = false;
  roomSession.selectedGame = null;
  roomSession.playerName = playerName;
  roomSession.peerName = null;
  roomSession.participants = new Map([[peerId, playerName]]);
  roomSession.gameSelections = new Map();
  roomSession.reconnectAttempt = 0;
  roomSession.quickMatchMode = Boolean(options?.quickMatchMode);
  roomSession.roomVisibility = asBooleanRoomVisibility(
    options?.roomPublic ?? (roomPublicRadio?.checked ?? roomSession.roomVisibility !== "private"),
  );
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
  if (value === "private") return "private";
  if (value === "public") return "public";
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

playMinesweeperBtn?.addEventListener("click", () => {
  closeRoom();
  configureAllStandardModes();
  currentGameKey = "minesweeper";
  showGameScreen("minesweeper");
  controllerOf("minesweeper")?.enterStandby?.();
});

playMahjongBtn?.addEventListener("click", () => {
  closeRoom();
  configureAllStandardModes();
  currentGameKey = "mahjong";
  showGameScreen("mahjong");
  controllerOf("mahjong")?.enterStandby?.();
});

openCardListBtn?.addEventListener("click", () => {
  closeRoom();
  configureAllStandardModes();
  setCardListMessage("");
  showCardListScreen();
});

cardListBackBtn?.addEventListener("click", () => {
  setCardListMessage("");
  if (roomSession.code) {
    showLobbyScreen();
  } else {
    showMenuScreen();
  }
});

cardListUnoBtn?.addEventListener("click", () => {
  if (roomSession.code) {
    setCardListMessage("");
    requestLobbyGameStart("uno");
    return;
  }
  closeRoom();
  configureAllStandardModes();
  setCardListMessage("");
  currentGameKey = "uno";
  showGameScreen("uno");
  controllerOf("uno")?.enterStandby?.();
});

cardListSolitaireBtn?.addEventListener("click", () => {
  if (roomSession.code) {
    setCardListMessage("");
    requestLobbyGameStart("solitaire");
    return;
  }
  closeRoom();
  configureAllStandardModes();
  setCardListMessage("");
  currentGameKey = "solitaire";
  showGameScreen("solitaire");
  const solitaireController = controllerOf("solitaire");
  solitaireController?.configureStandardMode?.();
  solitaireController?.enterStandby?.();
});

cardListSevensBtn?.addEventListener("click", () => {
  if (roomSession.code) {
    setCardListMessage("");
    requestLobbyGameStart("sevens");
    return;
  }
  closeRoom();
  configureAllStandardModes();
  setCardListMessage("");
  currentGameKey = "sevens";
  showGameScreen("sevens");
  controllerOf("sevens")?.enterStandby?.();
});

cardListDaifugoBtn?.addEventListener("click", () => {
  setCardListMessage("大富豪はこの一覧からの起動対応を順次反映中です");
});

cardListNumeronBtn?.addEventListener("click", () => {
  if (roomSession.code) {
    setCardListMessage("");
    requestLobbyGameStart("numeron");
    return;
  }
  closeRoom();
  configureAllStandardModes();
  setCardListMessage("");
  currentGameKey = "numeron";
  showGameScreen("numeron");
  controllerOf("numeron")?.enterStandby?.();
});

openCasinoListBtn?.addEventListener("click", () => {
  closeRoom();
  configureAllStandardModes();
  setCasinoListMessage("");
  showCasinoListScreen();
});

casinoListBackBtn?.addEventListener("click", () => {
  setCasinoListMessage("");
  showMenuScreen();
});

casinoListBlackjackBtn?.addEventListener("click", () => {
  setCasinoListMessage("ブラックジャックはこの一覧からの起動対応を順次反映中です");
});

casinoListPokerBtn?.addEventListener("click", () => {
  setCasinoListMessage("ポーカーはこの一覧からの起動対応を順次反映中です");
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

function applyRoomVisibilitySelection(nextVisibility) {
  roomSession.roomVisibility = nextVisibility === "private" ? "private" : "public";
  if (roomSession.roomVisibility === "public") {
    roomSession.pendingInviteToken = "";
  }
  localStorage.setItem(STORAGE_ROOM_PUBLIC_KEY, roomSession.roomVisibility);

  if (roomPublicRadio) roomPublicRadio.checked = roomSession.roomVisibility === "public";
  if (roomPrivateRadio) roomPrivateRadio.checked = roomSession.roomVisibility === "private";

  if (roomSession.code && roomSession.role === "host") {
    postRoomMessage({ type: "presence", name: roomSession.playerName, roomPublic: roomSession.roomVisibility === "public" });
  }
}

roomPublicRadio?.addEventListener("change", () => {
  if (!roomPublicRadio.checked) return;
  applyRoomVisibilitySelection("public");
});

roomPrivateRadio?.addEventListener("change", () => {
  if (!roomPrivateRadio.checked) return;
  applyRoomVisibilitySelection("private");
});

createRoomBtn?.addEventListener("click", () => {
  const playerName = normalizeName(playerNameInput?.value);
  if (playerNameInput) playerNameInput.value = playerName;

  const code = generateRoomCode();
  roomCodeInput.value = code;
  void attachRoom(code, "host", playerName, { roomPublic: roomPublicRadio?.checked ?? true });
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

function requestLobbyGameStart(gameKey) {
  if (!roomSession.code) return;

  if (isRoomArcadeMode() && roomSession.role !== "spectator") {
    setLocalGameSelection(gameKey);
    startRoomArcadeGame(gameKey);
    return;
  }

  if (roomSession.role === "host") {
    if (!roomSession.peerConnected) {
      setLobbyMessage(tr("lobbyNoPeer"));
      return;
    }
    setLocalGameSelection(gameKey);
    roomSession.selectedGame = gameKey;
    postRoomMessage({ type: "select-game", game: gameKey });
    enterRoomGame(gameKey);
    return;
  }

  if (roomSession.role === "guest") {
    if (roomSession.selectedGame !== gameKey) {
      setLobbyMessage(tr("lobbySelectMatchOnly"));
      return;
    }
    setLocalGameSelection(gameKey);
    enterRoomGame(gameKey);
  }
}

lobbyStartOthelloBtn?.addEventListener("click", () => requestLobbyGameStart("othello"));
lobbyStartShogiBtn?.addEventListener("click", () => requestLobbyGameStart("shogi"));
lobbyStartChessBtn?.addEventListener("click", () => requestLobbyGameStart("chess"));
lobbyStartUnoBtn?.addEventListener("click", () => requestLobbyGameStart("uno"));
lobbyStartGomokuBtn?.addEventListener("click", () => requestLobbyGameStart("gomoku"));
lobbyStartSurvivorsBtn?.addEventListener("click", () => requestLobbyGameStart("survivors"));
lobbyStartFitPuzzleBtn?.addEventListener("click", () => requestLobbyGameStart("fitPuzzle"));
lobbyStartMinesweeperBtn?.addEventListener("click", () => requestLobbyGameStart("minesweeper"));
lobbyStartSolitaireBtn?.addEventListener("click", () => requestLobbyGameStart("solitaire"));
lobbyStartMahjongBtn?.addEventListener("click", () => requestLobbyGameStart("mahjong"));
lobbyStartSevensBtn?.addEventListener("click", () => requestLobbyGameStart("sevens"));
lobbyStartNumeronBtn?.addEventListener("click", () => requestLobbyGameStart("numeron"));

lobbyOpenCardGamesBtn?.addEventListener("click", () => {
  if (!roomSession.code) return;
  setCardListMessage("");
  showCardListScreen();
});

lobbyBackBtn?.addEventListener("click", () => {
  if (roomSession.code) {
    postRoomMessage({ type: "return-lobby" });
  }
  closeRoom();
  configureAllStandardModes();
  showMenuScreen();
});

lobbySwitchSpectateBtn?.addEventListener("click", () => {
  if (!roomSession.code) return;

  const code = roomSession.code;
  const name = roomSession.playerName;
  const switchToSpectator = roomSession.role !== "spectator";
  const nextRole = switchToSpectator ? "spectator" : "guest";
  void attachRoom(code, nextRole, name, {
    spectate: switchToSpectator,
    quickMatchMode: roomSession.quickMatchMode,
    roomPublic: roomSession.roomVisibility === "public",
    inviteToken: roomSession.pendingInviteToken,
  });
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

roomChatSendBtn?.addEventListener("click", () => {
  if (!roomSession.code || roomSession.role === "spectator") return;
  const text = String(roomChatInput?.value || "").trim().slice(0, 200);
  if (!text) return;
  const messageId = createRoomMessageId();
  postRoomMessage({
    type: "chat",
    room: roomSession.code,
    name: roomSession.playerName,
    text,
    messageId,
  });
  appendRoomChatMessage(roomSession.playerName, text);
  if (roomChatInput) roomChatInput.value = "";
});

roomChatInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  roomChatSendBtn?.click();
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
  startEntryLoading("ログイン接続中...");
  setEntryMessage("接続を確認中...");

  try {
    const userId = String(entryCloudUserIdInput?.value || "").trim();
    const password = String(entryCloudPasswordInput?.value || "");
    if (!userId || !password) {
      setEntryMessage(tr("cloudAuthInvalid"));
      return;
    }

    if (!window.confirm(tr("loginConfirmPrompt"))) {
      setEntryMessage(tr("loginCanceled"));
      return;
    }

    const check = await withTimeout(
      verifyCloudAuth(userId, password),
      LOGIN_FLOW_TIMEOUT_MS,
      "Login timeout",
    );
    if (!check.ok) {
      const key = check.reason === "duplicate"
        ? "cloudIdDuplicateWarn"
        : (check.reason === "not_found" ? "cloudUserNotFound" : "cloudCheckFailed");
      setEntryMessage(tr(key));
      return;
    }

    const cloudName = check.profile?.playerName ? normalizeName(check.profile.playerName) : "";
    if (cloudName) {
      setPlayerName(cloudName);
    } else {
      void syncPlayerNameToCloud(userId, password, check.profile).catch(() => {});
    }

    localStorage.setItem(STORAGE_CLOUD_USER_ID_KEY, userId);
    localStorage.setItem(STORAGE_CLOUD_PASSWORD_KEY, password);
    if (cloudUserIdInput) cloudUserIdInput.value = userId;
    if (cloudPasswordInput) cloudPasswordInput.value = password;
    setEntryMessage("");
    showMenuScreen();
  } catch {
    setEntryMessage(tr("cloudCheckFailed"));
  } finally {
    stopEntryLoading();
    setEntryActionButtonsVisible(true);
  }
});

entryRegisterBtn?.addEventListener("click", async () => {
  setEntryActionButtonsVisible(false);
  startEntryLoading("新規登録中...");
  setEntryMessage("接続を確認中...");

  try {
    const userId = String(entryCloudUserIdInput?.value || "").trim();
    const password = String(entryCloudPasswordInput?.value || "");
    if (!userId || !password) {
      setEntryMessage(tr("cloudAuthInvalid"));
      return;
    }

    if (!window.confirm(tr("registerConfirmPrompt"))) {
      setEntryMessage(tr("registerCanceled"));
      return;
    }

    const created = await withTimeout(
      registerCloudAuth(userId, password),
      LOGIN_FLOW_TIMEOUT_MS,
      "Register timeout",
    );
    if (!created.ok) {
      setEntryMessage(tr(created.reason === "duplicate" ? "registerDuplicate" : "cloudCheckFailed"));
      return;
    }

    const cloudName = created.profile?.playerName ? normalizeName(created.profile.playerName) : "";
    if (cloudName) {
      setPlayerName(cloudName);
    } else {
      void syncPlayerNameToCloud(userId, password, created.profile).catch(() => {});
    }

    localStorage.setItem(STORAGE_CLOUD_USER_ID_KEY, userId);
    localStorage.setItem(STORAGE_CLOUD_PASSWORD_KEY, password);
    if (cloudUserIdInput) cloudUserIdInput.value = userId;
    if (cloudPasswordInput) cloudPasswordInput.value = password;
    setEntryMessage("");
    showMenuScreen();
    setMenuMessage(tr("registerSuccess"));
  } catch {
    setEntryMessage(tr("cloudCheckFailed"));
  } finally {
    stopEntryLoading();
    setEntryActionButtonsVisible(true);
  }
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
    const key = check.reason === "duplicate"
      ? "cloudIdDuplicateWarn"
      : (check.reason === "not_found" ? "cloudUserNotFound" : "cloudCheckFailed");
    setMenuMessage(tr(key));
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
  updateFriendsAvailability();
  void refreshFriendsList();
});

friendReloadBtn?.addEventListener("click", () => {
  void refreshFriendsList();
});

friendAddBtn?.addEventListener("click", () => {
  void mutateFriend("add");
});

friendRemoveBtn?.addEventListener("click", () => {
  void mutateFriend("remove");
});

friendUserIdInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  void mutateFriend("add");
});

friendsTabFriendsBtn?.addEventListener("click", () => {
  setFriendsTab("friends");
});

friendsTabIncomingBtn?.addEventListener("click", () => {
  setFriendsTab("incoming");
});

friendsTabOutgoingBtn?.addEventListener("click", () => {
  setFriendsTab("outgoing");
});

friendsToggleBtn?.addEventListener("click", () => {
  const nextOpen = friendsPanel?.classList.contains("hidden") !== true;
  setFriendsPanelOpen(!nextOpen);
});

menuMoreBtn?.addEventListener("click", () => {
  const nextOpen = menuMorePanel?.classList.contains("hidden") !== true;
  setMenuMoreOpen(!nextOpen);
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Node)) return;
  if (menuMore && menuMore.contains(target)) return;
  setMenuMoreOpen(false);
});

backToEntryBtn?.addEventListener("click", () => {
  if (!window.confirm(tr("confirmBackToLogin"))) {
    return;
  }
  closeRoom();
  setMenuMessage("");
  setEntryActionButtonsVisible(true);
  showEntryScreen();
});

const initialLang = "ja";
if (langSelect) langSelect.value = initialLang;
setLanguage(initialLang);
ensureBrandedUrlHash();

const initialRoomPublic = (localStorage.getItem(STORAGE_ROOM_PUBLIC_KEY) || "public") !== "private";
roomSession.roomVisibility = initialRoomPublic ? "public" : "private";
if (roomPublicRadio) roomPublicRadio.checked = initialRoomPublic;
if (roomPrivateRadio) roomPrivateRadio.checked = !initialRoomPublic;

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
setFriendsButtonsEnabled(false);
setFriendsTab("friends");
renderFriendsList();

updateLobbyView();
showEntryScreen();
