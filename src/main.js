import "./styles/main.css";
import { initGame as initOthello } from "./scripts/game.js";
import { initShogi } from "./scripts/shogi.js";
import { initChess } from "./scripts/chess.js";
import { initUno } from "./scripts/uno.js";
import { initGomoku } from "./scripts/gomoku.js";
import { initSurvivors } from "./scripts/survivors.js";
import { initBikeRunner } from "./scripts/bikeRunner.js";
import { initFitPuzzle } from "./scripts/fitPuzzle.js";
import { initSolitaire } from "./scripts/solitaire.js";
import { initMinesweeper } from "./scripts/minesweeper.js";
import { initSevens } from "./scripts/sevens.js";
import { initDaifugo } from "./scripts/daifugo.js";
import { initNumeron } from "./scripts/numeron.js";
import { initPoker } from "./scripts/poker.js";
import { initBlackjack } from "./scripts/blackjack.js";
import { initChinchiro } from "./scripts/chinchiro.js";
import { initDrawingRelay } from "./scripts/drawingRelay.js";
import { initFourPanelCollab } from "./scripts/fourPanelCollab.js";
import { createRoomTransport, resolveRoomServerUrl } from "./scripts/roomTransport.js";

const STORAGE_LANG_KEY = "neon-arcade-lang";
const STORAGE_CLOUD_USER_ID_KEY = "neon-cloud-user-id";
const STORAGE_CLOUD_PASSWORD_KEY = "neon-cloud-password";
const STORAGE_PLAYER_NAME_KEY = "neon-player-name";
const STORAGE_GAME_DATA_KEY = "neon-game-data-v1";
const STORAGE_FIT_PUZZLE_PROGRESS_KEY = "neon-fit-puzzle-progress-v1";
const STORAGE_ROOM_SERVER_URL_KEY = "neon-room-server-url";
const ROOM_SERVER_QUERY_PARAM_KEY = "roomServer";
const DEFAULT_CASINO_BANKROLL = 1000;
const CLOUD_API_PRIMARY_BASE = window.location.origin;
const CLOUD_API_HOST_FALLBACK_BASE = `${window.location.protocol}//${window.location.hostname || "localhost"}:8787`;
const CLOUD_API_LOCALHOST_FALLBACK_BASE = "http://localhost:8787";
const DEFAULT_ROOM_SERVER_URL = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.hostname || "localhost"}:8788`;
const PERMISSIONS_VISIBLE_USER_ID = "nulltoufu";
const ALL_GAME_KEYS = ["othello", "shogi", "chess", "uno", "gomoku", "survivors", "bikeRunner", "fitPuzzle", "solitaire", "minesweeper", "drawingRelay", "fourPanel", "sevens", "daifugo", "numeron", "poker", "blackjack", "chinchiro"];

const entryScreen = document.getElementById("entryScreen");
const menuScreen = document.getElementById("menuScreen");
const cardGamesMenuScreen = document.getElementById("cardGamesMenuScreen");
const casinoMenuScreen = document.getElementById("casinoMenuScreen");
const lobbyScreen = document.getElementById("lobbyScreen");
const othelloScreen = document.getElementById("othelloScreen");
const shogiScreen = document.getElementById("shogiScreen");
const chessScreen = document.getElementById("chessScreen");
const unoScreen = document.getElementById("unoScreen");
const gomokuScreen = document.getElementById("gomokuScreen");
const survivorsScreen = document.getElementById("survivorsScreen");
const bikeRunnerScreen = document.getElementById("bikeRunnerScreen");
const fitPuzzleScreen = document.getElementById("fitPuzzleScreen");
const solitaireScreen = document.getElementById("solitaireScreen");
const minesweeperScreen = document.getElementById("minesweeperScreen");
const drawingRelayScreen = document.getElementById("drawingRelayScreen");
const fourPanelScreen = document.getElementById("fourPanelScreen");
const pokerScreen = document.getElementById("pokerScreen");
const blackjackScreen = document.getElementById("blackjackScreen");
const chinchiroScreen = document.getElementById("chinchiroScreen");
const sevensScreen = document.getElementById("sevensScreen");
const daifugoScreen = document.getElementById("daifugoScreen");
const numeronScreen = document.getElementById("numeronScreen");

const playOthelloBtn = document.getElementById("playOthelloBtn");
const playShogiBtn = document.getElementById("playShogiBtn");
const playChessBtn = document.getElementById("playChessBtn");
const playUnoBtn = document.getElementById("playUnoBtn");
const playGomokuBtn = document.getElementById("playGomokuBtn");
const playSurvivorsBtn = document.getElementById("playSurvivorsBtn");
const playBikeRunnerBtn = document.getElementById("playBikeRunnerBtn");
const playFitPuzzleBtn = document.getElementById("playFitPuzzleBtn");
const playSolitaireSingleBtn = document.getElementById("playSolitaireSingleBtn");
const playSolitaireMultiBtn = document.getElementById("playSolitaireMultiBtn");
const playMinesweeperBtn = document.getElementById("playMinesweeperBtn");
const playMinesweeperMultiBtn = document.getElementById("playMinesweeperMultiBtn");
const drawingModeSelect = document.getElementById("drawingModeSelect");
const playDrawingModeBtn = document.getElementById("playDrawingModeBtn");
const playPokerBtn = document.getElementById("playPokerBtn");
const playBlackjackBtn = document.getElementById("playBlackjackBtn");
const playChinchiroBtn = document.getElementById("playChinchiroBtn");
const playSevensBtn = document.getElementById("playSevensBtn");
const playDaifugoBtn = document.getElementById("playDaifugoBtn");
const playNumeronBtn = document.getElementById("playNumeronBtn");
const permissionsCard = document.getElementById("permissionsCard");
const grantNotificationBtn = document.getElementById("grantNotificationBtn");
const grantClipboardBtn = document.getElementById("grantClipboardBtn");
const permissionMessage = document.getElementById("permissionMessage");
const openInquiryAdminBtn = document.getElementById("openInquiryAdminBtn");
const inquiryAdminStatus = document.getElementById("inquiryAdminStatus");
const inquiryAdminList = document.getElementById("inquiryAdminList");
const inquiryNameInput = document.getElementById("inquiryNameInput");
const inquiryMessageInput = document.getElementById("inquiryMessageInput");
const sendInquiryBtn = document.getElementById("sendInquiryBtn");
const inquiryStatusMessage = document.getElementById("inquiryStatusMessage");
const openCardGamesCard = document.getElementById("openCardGamesCard");
const openCardGamesBtn = document.getElementById("openCardGamesBtn");
const openCasinoCard = document.getElementById("openCasinoCard");
const openCasinoBtn = document.getElementById("openCasinoBtn");
const cardGamesBackBtn = document.getElementById("cardGamesBackBtn");
const casinoBackBtn = document.getElementById("casinoBackBtn");
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
const lobbyPeerText = document.getElementById("lobbyPeerText");
const lobbyMessage = document.getElementById("lobbyMessage");
const lobbyGameButtons = document.getElementById("lobbyGameButtons");
const lobbyBackBtn = document.getElementById("lobbyBackBtn");

const roomStatus = document.getElementById("roomStatus");
const roomCodeText = document.getElementById("roomCodeText");
const roomRoleText = document.getElementById("roomRoleText");
const langSelect = document.getElementById("langSelect");
const othelloStartGameBtn = document.getElementById("startBtn");
const shogiStartGameBtn = document.getElementById("shogiStartBtn");
const chessStartGameBtn = document.getElementById("chessStartBtn");
const unoStartGameBtn = document.getElementById("unoStartBtn");
const gomokuStartGameBtn = document.getElementById("gomokuStartBtn");
const survivorsStartGameBtn = document.getElementById("survivorsStartBtn");
const bikeRunnerStartGameBtn = document.getElementById("bikeRunnerStartBtn");
const fitPuzzleStartGameBtn = document.getElementById("fitPuzzleStartBtn");
const solitaireStartGameBtn = document.getElementById("solitaireStartBtn");
const minesweeperStartGameBtn = document.getElementById("minesweeperStartBtn");
const drawingRelayStartGameBtn = document.getElementById("drawingRelayStartBtn");
const fourPanelStartGameBtn = document.getElementById("fourPanelStartBtn");
const pokerStartGameBtn = document.getElementById("pokerStartBtn");
const blackjackStartGameBtn = document.getElementById("blackjackStartBtn");
const chinchiroStartGameBtn = document.getElementById("chinchiroStartBtn");
const sevensStartGameBtn = document.getElementById("sevensStartBtn");
const daifugoStartGameBtn = document.getElementById("daifugoStartBtn");
const numeronStartGameBtn = document.getElementById("numeronStartBtn");

const gameCardsByKey = new Map();
const ROOM_LOBBY_GAME_KEYS = ["othello", "shogi", "chess", "uno", "gomoku", "survivors", "solitaire", "minesweeper", "numeron"];
const LOBBY_START_LABEL_KEYS = {
  othello: "othelloStart",
  shogi: "shogiStart",
  chess: "chessStart",
  uno: "unoStart",
  gomoku: "gomokuStart",
  survivors: "survivorsStart",
  solitaire: "solitaireStart",
  minesweeper: "minesweeperStart",
  numeron: "numeronStart",
};
const lobbyStartButtonsByGame = new Map();

function registerGameCard(gameKey, triggerElement) {
  if (!triggerElement || typeof triggerElement.closest !== "function") return;
  const card = triggerElement.closest(".game-card");
  if (!card) return;

  const current = gameCardsByKey.get(gameKey);
  if (current) {
    current.add(card);
  } else {
    gameCardsByKey.set(gameKey, new Set([card]));
  }
}

function updatePlayedGameCardState() {
  ALL_GAME_KEYS.forEach((gameKey) => {
    const cards = gameCardsByKey.get(gameKey);
    if (!cards || cards.size === 0) return;
    const played = startedGameKeysCache.has(gameKey);
    cards.forEach((card) => {
      card.classList.toggle("disabled", played);
    });
  });
}

function registerGameStartButton(gameKey, buttonElement) {
  if (!buttonElement) return;
  buttonElement.addEventListener("click", () => {
    recordGamePlay(gameKey, roomSession.code ? "room" : "local");
  });
}

registerGameCard("othello", playOthelloBtn);
registerGameCard("shogi", playShogiBtn);
registerGameCard("chess", playChessBtn);
registerGameCard("uno", playUnoBtn);
registerGameCard("gomoku", playGomokuBtn);
registerGameCard("survivors", playSurvivorsBtn);
registerGameCard("bikeRunner", playBikeRunnerBtn);
registerGameCard("fitPuzzle", playFitPuzzleBtn);
registerGameCard("solitaire", playSolitaireSingleBtn);
registerGameCard("solitaire", playSolitaireMultiBtn);
registerGameCard("minesweeper", playMinesweeperBtn);
registerGameCard("minesweeper", playMinesweeperMultiBtn);
registerGameCard("drawingRelay", playDrawingModeBtn);
registerGameCard("poker", playPokerBtn);
registerGameCard("blackjack", playBlackjackBtn);
registerGameCard("chinchiro", playChinchiroBtn);
registerGameCard("sevens", playSevensBtn);
registerGameCard("daifugo", playDaifugoBtn);
registerGameCard("numeron", playNumeronBtn);

registerGameStartButton("othello", othelloStartGameBtn);
registerGameStartButton("shogi", shogiStartGameBtn);
registerGameStartButton("chess", chessStartGameBtn);
registerGameStartButton("uno", unoStartGameBtn);
registerGameStartButton("gomoku", gomokuStartGameBtn);
registerGameStartButton("survivors", survivorsStartGameBtn);
registerGameStartButton("bikeRunner", bikeRunnerStartGameBtn);
registerGameStartButton("fitPuzzle", fitPuzzleStartGameBtn);
registerGameStartButton("solitaire", solitaireStartGameBtn);
registerGameStartButton("minesweeper", minesweeperStartGameBtn);
registerGameStartButton("drawingRelay", drawingRelayStartGameBtn);
registerGameStartButton("fourPanel", fourPanelStartGameBtn);
registerGameStartButton("poker", pokerStartGameBtn);
registerGameStartButton("blackjack", blackjackStartGameBtn);
registerGameStartButton("chinchiro", chinchiroStartGameBtn);
registerGameStartButton("sevens", sevensStartGameBtn);
registerGameStartButton("daifugo", daifugoStartGameBtn);
registerGameStartButton("numeron", numeronStartGameBtn);

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
    cardGamesCardTitle: "カードゲーム",
    cardGamesCardDesc: "UNO・ソリティア・7並べ・大富豪・ヌメロンを一覧表示から選択できます。",
    openCardGames: "一覧を開く",
    cardGamesMenuTitle: "カードゲーム一覧",
    cardGamesMenuSubtitle: "遊びたいカードゲームを選択してください",
    casinoCardTitle: "カジノ",
    casinoCardDesc: "今後追加するカジノゲームをここにまとめます。",
    openCasino: "一覧を開く",
    casinoMenuTitle: "カジノ一覧",
    casinoMenuSubtitle: "ポーカーとブラックジャックを含むカジノゲーム一覧です",
    pokerCasinoDesc: "カジノジャンルのポーカー。テキサスホールデムでCPUと勝負します。",
    blackjackCasinoDesc: "ディーラーと21を目指すブラックジャック。HIT / STAND / DOUBLEで駆け引き。",
    chinchiroCasinoDesc: "3つのサイコロで勝負する丁半系ゲーム。目役で配当が変わります。",
    pokerSubtitle: "2枚の手札と場札5枚で勝負するテキサスホールデム。",
    blackjackSubtitle: "ディーラーに近い21を作れ。超えるとバーストで負け。",
    chinchiroSubtitle: "3つのサイコロを振って役を作り、ディーラーより強い目を狙え。",
    chinchiroBank: "所持チップ",
    chinchiroBet: "ベット",
    chinchiroBetRange: "ベット範囲",
    chinchiroDealerDice: "ディーラーの目",
    chinchiroPlayerDice: "あなたの目",
    chinchiroStats: "戦績",
    chinchiroRoll: "サイコロを振る",
    chinchiroAllIn: "オールイン",
    chinchiroReplay: "リプレイ",
    blackjackBank: "所持チップ",
    blackjackBet: "ベット",
    blackjackWager: "かけ金",
    blackjackBetRange: "ベット範囲",
    blackjackDealerTotal: "ディーラー合計",
    blackjackPlayerTotal: "あなたの合計",
    blackjackStats: "戦績",
    blackjackHit: "ヒット",
    blackjackStand: "スタンド",
    blackjackDouble: "ダブル",
    blackjackAllIn: "オールイン",
    blackjackReplay: "リプレイ",
    pokerRuleLabel: "ルール",
    pokerRuleTournament: "大会ルール",
    pokerRuleDraw5: "5枚配り",
    pokerOpponentLabel: "対戦相手",
    pokerOpponentCpu: "CPU戦",
    pokerOpponentDealer: "ディーラー戦",
    pokerCpuCountLabel: "CPU人数",
    pokerCpuCount1: "1人",
    pokerCpuCount2: "2人",
    pokerCpuCount3: "3人",
    pokerCpuStyleLabel: "CPU性格",
    pokerCpuStyleWeak: "弱気",
    pokerCpuStyleNormal: "標準",
    pokerCpuStyleAggressive: "強気",
    pokerSfxLabel: "効果音",
    pokerSfxOn: "ON",
    pokerSfxOff: "OFF",
    pokerBank: "所持チップ",
    pokerBet: "あなたのかけ金",
    pokerOpponentBet: "相手のかけ金",
    pokerTablePlayerBet: "あなた",
    pokerTableOpponentBet: "相手",
    pokerTablePot: "合計ポット",
    pokerBetRange: "ベット範囲",
    pokerRaiseAmount: "レイズ額",
    pokerStats: "戦績",
    pokerBetMinus: "- ベット",
    pokerBetPlus: "+ ベット",
    pokerRaiseMinus: "- レイズ",
    pokerRaisePlus: "+ レイズ",
    pokerRaise25: "25% ポット",
    pokerRaise50: "50% ポット",
    pokerRaise75: "75% ポット",
    pokerRaise100: "100% ポット",
    pokerAllIn: "オールイン",
    pokerChange: "カード交換",
    pokerRaise: "レイズ",
    pokerCheck: "チェック",
    pokerCall: "コール",
    pokerFold: "フォールド",
    pokerNext: "次へ",
    casinoUpcomingTitle: "近日追加",
    casinoUpcomingDesc: "今後追加するカジノゲームはこの一覧に表示されます。",
    roomCardTitle: "ルーム対戦",
    roomCardDesc: "ルーム番号で集合してからゲームを選択。",
    othelloCardDesc: "CPU対戦対応のオセロ。相手の石をはさんで自分の色にし、最後に石が多い方が勝ち。",
    shogiCardDesc: "2人対戦の将棋。駒を動かして相手の王を詰ませたら勝ち。取った駒は自分の持ち駒として使えます。",
    chessCardDesc: "2人対戦のチェス。ルーム対戦にも対応。",
    unoCardDesc: "ローカル2人で遊べるUNO。手札を先に出し切ったプレイヤーの勝ち。",
    gomokuCardDesc: "五目並べ。先に5つ石を並べたプレイヤーの勝ち。",
    survivorsCardDesc: "2Dサバイバルアクション。移動しながら自動攻撃で敵の波をさばく。",
    bikeRunnerCardDesc: "チャリ走風の横スクロール。ジャンプとダッシュで障害物を避け、距離を伸ばせ。",
    fitPuzzleCardDesc: "ピースを枠内に収めるパズル。すべてのマスを埋めればクリア。",
    solitaireCardDesc: "定番のクロンダイク。AからKまで4組そろえるとクリア。",
    drawingRelayCardDesc: "お絵描きモードから「伝言リレー」か「4コマ協力」を選んで遊べます。",
    drawingModeRelay: "伝言リレー",
    drawingModeFourPanel: "4コマ協力",
    fourPanelCardDesc: "4人で1コマずつ描いて、1本の4コマ漫画を完成させる協力お絵描きゲーム。",
    sevensCardDesc: "トランプの7ならべ。手札を早く出し切ったプレイヤーの勝ち。",
    daifugoCardDesc: "大富豪。場より強いカードを出して、先に手札をなくしたプレイヤーの勝ち。",
    numeronCardDesc: "ヌメロン風の数字推理バトル。3桁の秘密コードを先に見破ったプレイヤーの勝ち。",
    permissionsCardTitle: "権限設定",
    permissionsCardDesc: "このWebゲームで使うブラウザ権限をここから付与できます。",
    inquiryCardTitle: "問い合わせ箱",
    inquiryCardDesc: "ご意見・不具合報告を開発者へ送れます。送信するとサーバーへ保存されます。",
    inquiryNamePlaceholder: "お名前（任意）",
    inquiryMessagePlaceholder: "お問い合わせ内容を入力",
    inquirySend: "送信",
    inquiryValidation: "お問い合わせ内容を入力してください",
    inquirySending: "送信中です...",
    inquirySubmitted: "お問い合わせを受け付けました。ありがとうございます。",
    inquirySubmitFailed: "送信に失敗しました。時間をおいて再度お試しください。",
    inquiryAdminOpen: "問い合わせ一覧を更新",
    inquiryAdminNeedLogin: "問い合わせ一覧の確認にはログインが必要です。",
    inquiryAdminLoading: "問い合わせ一覧を取得中です...",
    inquiryAdminLoadFailed: "問い合わせ一覧の取得に失敗しました。",
    inquiryAdminEmpty: "問い合わせはまだありません。",
    inquiryAdminLoaded: "問い合わせ {count} 件を表示しています。",
    grantNotification: "通知権限を付与",
    grantClipboard: "クリップボード権限を確認",
    permissionNotificationGranted: "通知権限が付与されました",
    permissionNotificationDenied: "通知権限が拒否されました",
    permissionClipboardGranted: "クリップボードを利用できます",
    permissionClipboardDenied: "クリップボード権限を確認できませんでした",
    permissionUnsupported: "このブラウザでは対応していません",
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
    lobbyTitle: "ルームロビー",
    lobbySubtitle: "ルームに全員が集まったらゲームを選択します",
    othelloSubtitle: "CPU対戦・CPU同士対戦・ローカル2人対戦を選べます。",
    shogiSubtitle: "先手後手で交互に指します。王を取れば勝ち。",
    chessSubtitle: "白黒で交互に指します。キングを詰ませた側の勝ち。",
    chessModeCpu: "1P 対 CPU",
    chessModeLocal: "ローカル2人",
    chessCpuSideLabel: "先攻後攻",
    chessCpuSideWhite: "先攻（あなた）",
    chessCpuSideBlack: "後攻（あなた）",
    chessCpuSideRandom: "ランダム",
    chessCpuLevelLabel: "CPUレベル",
    chessCpuEasy: "かんたん",
    chessCpuNormal: "ふつう",
    chessCpuHard: "つよい",
    chessMyPieceColorLabel: "自分の駒色",
    chessMyPieceColorAmber: "金",
    chessMyPieceColorCyan: "シアン",
    chessMyPieceColorLime: "ライム",
    chessMyPieceColorMagenta: "マゼンタ",
    unoSubtitle: "CPU対戦またはローカル2人対戦。手札を先に出し切ったら勝ち。",
    gomokuSubtitle: "黒白で交互に置き、先に5連を作った側の勝ち。",
    survivorsSubtitle: "WASD / 矢印キーで移動。自動攻撃で生き残れ。",
    bikeRunnerSubtitle: "Space / ↑ でジャンプ、Shift / X でダッシュ。障害物を避けて距離を伸ばせ。",
    fitPuzzleSubtitle: "ピースを選んで枠内に配置し、すべて埋めるとクリア。",
    fitPuzzleBoardLabel: "ボード",
    fitPuzzlePlacedLabel: "配置",
    fitPuzzleScoreLabel: "スコア",
    fitPuzzleTimeLabel: "タイム",
    fitPuzzleDifficultyLabel: "難易度",
    fitPuzzleStageSelectLabel: "ステージ選択",
    fitPuzzleDifficultyEasy: "かんたん",
    fitPuzzleDifficultyNormal: "ふつう",
    fitPuzzleDifficultyHard: "むずかしい",
    solitaireSubtitle: "ストックからめくって並べ替え、4つの土台を完成させよう。",
    sevensSubtitle: "7を起点に同じマークの数字をつなげて、先に手札をなくそう。",
    daifugoSubtitle: "場の数字より強いカードを出して、先に手札を出し切ろう。",
    numeronSubtitle: "3桁の重複なしコードを推理し、EATとBITEを手掛かりに先に当てよう。",
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
    minesweeperStart: "マインスイーパー開始",
    numeronStart: "ヌメロン開始",
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
    noRotateMode: "回転なし",
    nextStage: "次のステージ",
    assist: "アシスト",
    reset: "リセット",
    undo: "元に戻す",
    resetEn: "リセット",
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
    roleSpectator: "観戦",
    labelRoom: "ルーム",
    labelRole: "役割",
    labelYou: "あなた",
    labelPeer: "相手",
    labelStatus: "状態",
    shogiTurnOrderLabel: "先攻後攻",
    shogiTurnOrderFirst: "先攻",
    shogiTurnOrderSecond: "後攻",
    shogiTurnOrderRandom: "ランダム",
    shogiMyPieceColorLabel: "自分の駒色",
    shogiMyPieceColorAmber: "金",
    shogiMyPieceColorCyan: "シアン",
    shogiMyPieceColorLime: "ライム",
    shogiMyPieceColorMagenta: "マゼンタ",
    shogiChaosPlayerModeLabel: "対局人数",
    shogiChaosPlayerMode2: "2人",
    shogiChaosPlayerMode4: "4人",
    shogiChaosRuleLabel: "カオスルール",
    handicapLabel: "ハンデ",
    handicapTargetLabel: "ハンデ対象",
    handicapTargetNone: "なし",
    handicapNone: "なし",
    handicapImmutable: "固定石 +1（反転不可）",
    handicapTargetBlack: "黒",
    handicapTargetWhite: "白",
    handicapTargetPlayer: "あなた",
    handicapTargetOpponent: "相手 / CPU",
    handicapTargetBoth: "両者",
    bothBlackHandicapLabel: "黒のハンデ",
    bothWhiteHandicapLabel: "白のハンデ",
    bothBlackOverwriteLabel: "黒の上書き回数",
    bothWhiteOverwriteLabel: "白の上書き回数",
    immutablePlaceActivate: "固定石を指定",
    destroySkillActivate: "駒破壊",
    overwriteLimitLabel: "上書き回数",
    randomLineCountIgnoreLabel: "共通ハンデ: ランダム1列をカウント対象外",
    randomLineCountIgnoreOff: "オフ",
    randomLineCountIgnoreOn: "オン",
    destroyLimitGroupLabel: "駒破壊回数",
    destroyLimitBlackLabel: "黒",
    destroyLimitWhiteLabel: "白",
    doubleActionActivate: "2回行動を発動",
    gameSelectTitle: "ゲーム選択",
    langLabel: "言語",
    othelloTurnLabel: "手番",
    othelloTimerLabel: "タイマー",
    othelloModeLabel: "モード",
    othelloCpuLevelLabel: "CPUレベル",
    othelloBlackLabel: "黒",
    othelloWhiteLabel: "白",
    shogiModeLabel: "モード",
    shogiCpuLevelLabel: "CPUレベル",
    chessModeLabel: "モード",
    gomokuTurnLabel: "手番",
    gomokuModeLabel: "モード",
    gomokuModeCpu: "CPU対戦",
    gomokuModeLocal: "ローカル2人",
    survivorsCharLabel: "キャラ",
    survivorsInfoLabel: "情報",
    survivorsBankLabel: "BANK",
    survivorsLevelMetaLabel: "レベル",
    survivorsCoinsMetaLabel: "コイン",
    survivorsHpLabel: "HP",
    survivorsMpLabel: "MP",
    survivorsWaveTimerLabel: "ウェーブタイマー",
    othelloModeCpu: "1P 対 CPU",
    othelloModeCpuVsCpu: "CPU同士",
    othelloModeLocal: "ローカル2人",
    othelloModeChaos: "カオス",
    survivorsCharacterBalanced: "バランス",
    survivorsCharacterFairy: "フェアリー",
    survivorsPause: "一時停止",
    survivorsResume: "再開",
    survivorsStatsOn: "ステータス: ON",
    survivorsStatsOff: "ステータス: OFF",
    survivorsRestart: "リスタート",
  },
  ko: {
    entryTitle: "세션 시작",
    entrySubtitle: "로그인하여 진행 데이터를 공유하거나, 게스트로 바로 플레이할 수 있습니다.",
    loginAndPlay: "로그인하고 플레이",
    playAsGuest: "게스트로 플레이",
    entryGuestSelected: "게스트 모드로 시작했습니다",
    loginConfirmPrompt: "로그인하시겠습니까?",
    loginCanceled: "로그인을 취소했습니다",
    guestConfirmPrompt: "저장 데이터가 보관되지 않습니다. 계속할까요?",
    guestCanceled: "게스트 시작을 취소했습니다",
    menuSubtitle: "플레이할 게임을 선택하세요",
    cardGamesCardTitle: "카드 게임",
    cardGamesCardDesc: "UNO, 솔리테어, 세븐즈, 대부호, 누메론을 목록 화면에서 고를 수 있습니다.",
    openCardGames: "목록 열기",
    cardGamesMenuTitle: "카드 게임 목록",
    cardGamesMenuSubtitle: "플레이할 카드 게임을 선택하세요",
    casinoCardTitle: "카지노",
    casinoCardDesc: "앞으로 추가할 카지노 게임을 여기에 모읍니다.",
    openCasino: "목록 열기",
    casinoMenuTitle: "카지노 목록",
    casinoMenuSubtitle: "포커와 블랙잭을 포함한 카지노 게임 목록입니다",
    pokerCasinoDesc: "카지노 장르의 포커입니다. 텍사스 홀덤으로 CPU와 겨룹니다.",
    blackjackCasinoDesc: "딜러와 21을 겨루는 블랙잭. HIT / STAND / DOUBLE로 승부합니다.",
    chinchiroCasinoDesc: "주사위 3개로 겨루는 친치로. 족보에 따라 배당이 달라집니다.",
    pokerSubtitle: "2장의 핸드와 5장의 커뮤니티 카드로 겨루는 텍사스 홀덤.",
    blackjackSubtitle: "딜러보다 21에 가깝게 맞추세요. 21을 넘기면 버스트입니다.",
    chinchiroSubtitle: "주사위 3개를 굴려 족보를 만들고 딜러보다 강한 눈을 노리세요.",
    chinchiroBank: "보유 칩",
    chinchiroBet: "베팅",
    chinchiroBetRange: "베팅 범위",
    chinchiroDealerDice: "딜러 눈",
    chinchiroPlayerDice: "내 눈",
    chinchiroStats: "전적",
    chinchiroRoll: "주사위 굴리기",
    chinchiroAllIn: "올인",
    chinchiroReplay: "리플레이",
    blackjackBank: "보유 칩",
    blackjackBet: "베팅",
    blackjackWager: "배팅 금액",
    blackjackBetRange: "베팅 범위",
    blackjackDealerTotal: "딜러 합계",
    blackjackPlayerTotal: "내 합계",
    blackjackStats: "전적",
    blackjackHit: "히트",
    blackjackStand: "스탠드",
    blackjackDouble: "더블",
    blackjackAllIn: "올인",
    blackjackReplay: "리플레이",
    pokerRuleLabel: "룰",
    pokerRuleTournament: "토너먼트 룰",
    pokerRuleDraw5: "5장 드로우",
    pokerOpponentLabel: "상대",
    pokerOpponentCpu: "CPU전",
    pokerOpponentDealer: "딜러전",
    pokerCpuCountLabel: "CPU 수",
    pokerCpuCount1: "1명",
    pokerCpuCount2: "2명",
    pokerCpuCount3: "3명",
    pokerCpuStyleLabel: "CPU 성향",
    pokerCpuStyleWeak: "소극",
    pokerCpuStyleNormal: "표준",
    pokerCpuStyleAggressive: "공격",
    pokerSfxLabel: "효과음",
    pokerSfxOn: "ON",
    pokerSfxOff: "OFF",
    pokerBank: "보유 칩",
    pokerBet: "내 베팅",
    pokerOpponentBet: "상대 베팅",
    pokerTablePlayerBet: "내 베팅",
    pokerTableOpponentBet: "상대 베팅",
    pokerTablePot: "팟 합계",
    pokerBetRange: "베팅 범위",
    pokerRaiseAmount: "레이즈 금액",
    pokerStats: "전적",
    pokerBetMinus: "- 베팅",
    pokerBetPlus: "+ 베팅",
    pokerRaiseMinus: "- 레이즈",
    pokerRaisePlus: "+ 레이즈",
    pokerRaise25: "25% 팟",
    pokerRaise50: "50% 팟",
    pokerRaise75: "75% 팟",
    pokerRaise100: "100% 팟",
    pokerAllIn: "올인",
    pokerChange: "카드 교체",
    pokerRaise: "레이즈",
    pokerCheck: "체크",
    pokerCall: "콜",
    pokerFold: "폴드",
    pokerNext: "다음",
    casinoUpcomingTitle: "곧 추가",
    casinoUpcomingDesc: "앞으로 추가할 카지노 게임이 이 목록에 표시됩니다.",
    roomCardTitle: "룸 매치",
    roomCardDesc: "룸 번호로 모인 뒤 게임을 선택합니다.",
    othelloCardDesc: "CPU 대전 지원 오셀로. 상대 돌을 사이에 두어 뒤집고, 마지막에 돌이 더 많으면 승리합니다.",
    shogiCardDesc: "2인 대전 장기(쇼기). 말을 움직여 상대 왕을 막으면 승리, 잡은 말은 내 말로 사용할 수 있습니다.",
    chessCardDesc: "2인 대전 체스. 룸 대전도 지원합니다.",
    unoCardDesc: "로컬 2인 UNO. 손패를 먼저 모두 낸 플레이어가 승리합니다.",
    gomokuCardDesc: "오목. 먼저 돌 5개를 연속으로 놓는 플레이어가 승리합니다.",
    survivorsCardDesc: "2D 서바이벌 액션. 이동하며 자동 공격으로 적의 물결을 버티세요.",
    bikeRunnerCardDesc: "차리소 스타일의 횡스크롤. 점프와 대시로 장애물을 피하고 거리를 늘리세요.",
    fitPuzzleCardDesc: "조각을 프레임 안에 배치하는 퍼즐. 모든 칸을 채우면 클리어.",
    solitaireCardDesc: "클론다이크 솔리테어. A부터 K까지 4세트를 완성하면 클리어.",
    drawingRelayCardDesc: "그림 모드에서 '그림 릴레이' 또는 '4컷 협동'을 선택해 플레이할 수 있습니다.",
    drawingModeRelay: "그림 릴레이",
    drawingModeFourPanel: "4컷 협동",
    fourPanelCardDesc: "4명이 한 컷씩 그려 한 편의 4컷 만화를 완성하는 협동 그림 게임.",
    sevensCardDesc: "카드 7 올려놓기. 손패를 먼저 모두 내면 승리합니다.",
    daifugoCardDesc: "대부호. 더 강한 카드를 내고 먼저 손패를 모두 비우면 승리합니다.",
    numeronCardDesc: "누메론풍 숫자 추리 배틀. 3자리 비밀 코드를 먼저 맞히면 승리합니다.",
    permissionsCardTitle: "권한 설정",
    permissionsCardDesc: "이 웹게임에서 사용하는 브라우저 권한을 여기서 부여할 수 있습니다.",
    inquiryCardTitle: "문의함",
    inquiryCardDesc: "의견/버그 제보를 개발자에게 보낼 수 있습니다. 전송하면 서버에 저장됩니다.",
    inquiryNamePlaceholder: "이름 (선택)",
    inquiryMessagePlaceholder: "문의 내용을 입력하세요",
    inquirySend: "보내기",
    inquiryValidation: "문의 내용을 입력하세요",
    inquirySending: "전송 중입니다...",
    inquirySubmitted: "문의가 접수되었습니다. 감사합니다.",
    inquirySubmitFailed: "전송에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    inquiryAdminOpen: "문의 목록 새로고침",
    inquiryAdminNeedLogin: "문의 목록 확인에는 로그인이 필요합니다.",
    inquiryAdminLoading: "문의 목록을 불러오는 중입니다...",
    inquiryAdminLoadFailed: "문의 목록을 불러오지 못했습니다.",
    inquiryAdminEmpty: "문의가 아직 없습니다.",
    inquiryAdminLoaded: "문의 {count}건을 표시 중입니다.",
    grantNotification: "알림 권한 부여",
    grantClipboard: "클립보드 권한 확인",
    permissionNotificationGranted: "알림 권한이 허용되었습니다",
    permissionNotificationDenied: "알림 권한이 거부되었습니다",
    permissionClipboardGranted: "클립보드를 사용할 수 있습니다",
    permissionClipboardDenied: "클립보드 권한을 확인하지 못했습니다",
    permissionUnsupported: "이 브라우저에서는 지원하지 않습니다",
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
    chessModeCpu: "1P 대 CPU",
    chessModeLocal: "로컬 2인",
    chessCpuSideLabel: "선공/후공",
    chessCpuSideWhite: "선공 (당신)",
    chessCpuSideBlack: "후공 (당신)",
    chessCpuSideRandom: "랜덤",
    chessCpuLevelLabel: "CPU 레벨",
    chessCpuEasy: "쉬움",
    chessCpuNormal: "보통",
    chessCpuHard: "강함",
    chessMyPieceColorLabel: "내 말 색",
    chessMyPieceColorAmber: "골드",
    chessMyPieceColorCyan: "시안",
    chessMyPieceColorLime: "라임",
    chessMyPieceColorMagenta: "마젠타",
    unoSubtitle: "CPU 대전 또는 로컬 2인 대전. 손패를 먼저 비우면 승리합니다.",
    gomokuSubtitle: "흑/백이 번갈아 두고, 먼저 5목을 만들면 승리합니다.",
    survivorsSubtitle: "WASD / 방향키로 이동. 자동 공격으로 생존하세요.",
    bikeRunnerSubtitle: "Space / ↑ 점프, Shift / X 대시. 장애물을 피해 거리를 늘리세요.",
    fitPuzzleSubtitle: "조각을 선택해 프레임 안에 배치하고, 전부 채우면 클리어.",
    fitPuzzleBoardLabel: "보드",
    fitPuzzlePlacedLabel: "배치",
    fitPuzzleScoreLabel: "점수",
    fitPuzzleTimeLabel: "시간",
    fitPuzzleDifficultyLabel: "난이도",
    fitPuzzleStageSelectLabel: "스테이지 선택",
    fitPuzzleDifficultyEasy: "쉬움",
    fitPuzzleDifficultyNormal: "보통",
    fitPuzzleDifficultyHard: "어려움",
    solitaireSubtitle: "스톡에서 카드를 넘겨 정리하고, 4개의 파운데이션을 완성하세요.",
    sevensSubtitle: "7을 시작으로 같은 무늬 숫자를 이어서, 먼저 손패를 비우세요.",
    daifugoSubtitle: "필드 카드보다 높은 숫자를 내고, 먼저 손패를 모두 내세요.",
    numeronSubtitle: "중복 없는 3자리 코드를 추리하고, EAT/BITE 힌트로 먼저 정답을 맞히세요.",
    unoModeCpu: "1P 대 CPU",
    unoModeLocal: "로컬 2인",
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
    minesweeperStart: "지뢰찾기 시작",
    numeronStart: "누메론 시작",
    bankGacha: "스킨 가챠",
    bankGacha10: "스킨 가챠 x10",
    singlePlay: "싱글",
    multiPlay: "멀티",
    newGame: "게임 시작",
    remake: "리메이크",
    menu: "메뉴",
    newMatch: "게임 시작",
    menuJa: "메뉴",
    rotate: "회전",
    noRotateMode: "회전 없음",
    nextStage: "다음 스테이지",
    assist: "어시스트",
    reset: "리셋",
    undo: "되돌리기",
    resetEn: "리셋",
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
    roleHost: "호스트",
    roleGuest: "게스트",
    roleSpectator: "관전",
    labelRoom: "룸",
    labelRole: "역할",
    labelYou: "나",
    labelPeer: "상대",
    labelStatus: "상태",
    shogiTurnOrderLabel: "선공후공",
    shogiTurnOrderFirst: "선공",
    shogiTurnOrderSecond: "후공",
    shogiTurnOrderRandom: "랜덤",
    shogiMyPieceColorLabel: "내 말 색",
    shogiMyPieceColorAmber: "골드",
    shogiMyPieceColorCyan: "시안",
    shogiMyPieceColorLime: "라임",
    shogiMyPieceColorMagenta: "마젠타",
    shogiChaosPlayerModeLabel: "대국 인원",
    shogiChaosPlayerMode2: "2인",
    shogiChaosPlayerMode4: "4인",
    shogiChaosRuleLabel: "카오스 룰",
    handicapLabel: "핸디캡",
    handicapTargetLabel: "핸디캡 대상",
    handicapTargetNone: "없음",
    handicapNone: "없음",
    handicapImmutable: "고정 돌 +1 (뒤집기 불가)",
    handicapTargetBlack: "흑",
    handicapTargetWhite: "백",
    handicapTargetPlayer: "당신",
    handicapTargetOpponent: "상대 / CPU",
    handicapTargetBoth: "양쪽",
    bothBlackHandicapLabel: "흑 핸디캡",
    bothWhiteHandicapLabel: "백 핸디캡",
    bothBlackOverwriteLabel: "흑 덮어쓰기 횟수",
    bothWhiteOverwriteLabel: "백 덮어쓰기 횟수",
    immutablePlaceActivate: "고정 돌 지정",
    destroySkillActivate: "돌 파괴",
    overwriteLimitLabel: "덮어쓰기 횟수",
    randomLineCountIgnoreLabel: "공통 핸디캡: 랜덤 1줄 카운트 제외",
    randomLineCountIgnoreOff: "끔",
    randomLineCountIgnoreOn: "켬",
    destroyLimitGroupLabel: "돌 파괴 횟수",
    destroyLimitBlackLabel: "흑",
    destroyLimitWhiteLabel: "백",
    doubleActionActivate: "2회 행동 발동",
    gameSelectTitle: "게임 선택",
    langLabel: "언어",
    othelloTurnLabel: "턴",
    othelloTimerLabel: "타이머",
    othelloModeLabel: "모드",
    othelloCpuLevelLabel: "CPU 레벨",
    othelloBlackLabel: "흑",
    othelloWhiteLabel: "백",
    shogiModeLabel: "모드",
    shogiCpuLevelLabel: "CPU 레벨",
    chessModeLabel: "모드",
    gomokuTurnLabel: "턴",
    gomokuModeLabel: "모드",
    gomokuModeCpu: "CPU 대전",
    gomokuModeLocal: "로컬 2인",
    survivorsCharLabel: "캐릭터",
    survivorsInfoLabel: "정보",
    survivorsBankLabel: "BANK",
    survivorsLevelMetaLabel: "레벨",
    survivorsCoinsMetaLabel: "코인",
    survivorsHpLabel: "HP",
    survivorsMpLabel: "MP",
    survivorsWaveTimerLabel: "웨이브 타이머",
    othelloModeCpu: "1P 대 CPU",
    othelloModeCpuVsCpu: "CPU 대 CPU",
    othelloModeLocal: "로컬 2인",
    othelloModeChaos: "카오스",
    survivorsCharacterBalanced: "밸런스",
    survivorsCharacterFairy: "페어리",
    survivorsPause: "일시정지",
    survivorsResume: "재개",
    survivorsStatsOn: "상태: ON",
    survivorsStatsOff: "상태: OFF",
    survivorsRestart: "재시작",
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
  setTextById("langSelectLabel", tr("langLabel"));
  setTextById("othelloTurnLabel", tr("othelloTurnLabel"));
  setTextById("othelloTimerLabel", tr("othelloTimerLabel"));
  setTextById("othelloModeLabel", tr("othelloModeLabel"));
  setTextById("othelloCpuLevelLabel", tr("othelloCpuLevelLabel"));
  setTextById("othelloBlackLabel", `${tr("othelloBlackLabel")}:`);
  setTextById("othelloWhiteLabel", `${tr("othelloWhiteLabel")}:`);
  setTextById("shogiModeLabel", tr("shogiModeLabel"));
  setTextById("shogiCpuLevelLabel", tr("shogiCpuLevelLabel"));
  setTextById("chessModeLabel", tr("chessModeLabel"));
  setTextById("gomokuTurnLabel", tr("gomokuTurnLabel"));
  setTextById("gomokuModeLabel", tr("gomokuModeLabel"));
  setTextById("survivorsCharLabel", tr("survivorsCharLabel"));
  setTextById("survivorsInfoLabel", tr("survivorsInfoLabel"));
  setTextById("survivorsBankLabel", tr("survivorsBankLabel"));
  setTextById("survivorsLevelMetaLabel", `${tr("survivorsLevelMetaLabel")}:`);
  setTextById("survivorsCoinsMetaLabel", `${tr("survivorsCoinsMetaLabel")}:`);
  setTextById("survivorsHpLabel", tr("survivorsHpLabel"));
  setTextById("survivorsMpLabel", tr("survivorsMpLabel"));
  setTextById("survivorsWaveTimerLabel", tr("survivorsWaveTimerLabel"));
  const othelloModeSelectEl = document.getElementById("modeSelect");
  if (othelloModeSelectEl instanceof HTMLSelectElement && othelloModeSelectEl.options.length >= 4) {
    othelloModeSelectEl.options[0].textContent = tr("othelloModeCpu");
    othelloModeSelectEl.options[1].textContent = tr("othelloModeCpuVsCpu");
    othelloModeSelectEl.options[2].textContent = tr("othelloModeLocal");
    othelloModeSelectEl.options[3].textContent = tr("othelloModeChaos");
  }
  setTextById("entryTitle", tr("entryTitle"));
  setTextById("entrySubtitle", tr("entrySubtitle"));
  setTextById("menuSubtitle", tr("menuSubtitle"));
  setTextById("cardGamesCardTitle", tr("cardGamesCardTitle"));
  setTextById("cardGamesCardDesc", tr("cardGamesCardDesc"));
  setTextById("openCardGamesBtn", tr("openCardGames"));
  setTextById("cardGamesMenuTitle", tr("cardGamesMenuTitle"));
  setTextById("cardGamesMenuSubtitle", tr("cardGamesMenuSubtitle"));
  setTextById("casinoCardTitle", tr("casinoCardTitle"));
  setTextById("casinoCardDesc", tr("casinoCardDesc"));
  setTextById("openCasinoBtn", tr("openCasino"));
  setTextById("casinoMenuTitle", tr("casinoMenuTitle"));
  setTextById("casinoMenuSubtitle", tr("casinoMenuSubtitle"));
  setTextById("pokerCasinoDesc", tr("pokerCasinoDesc"));
  setTextById("blackjackCasinoDesc", tr("blackjackCasinoDesc"));
  setTextById("chinchiroCasinoDesc", tr("chinchiroCasinoDesc"));
  setTextById("pokerSubtitle", tr("pokerSubtitle"));
  setTextById("blackjackSubtitle", tr("blackjackSubtitle"));
  setTextById("chinchiroSubtitle", tr("chinchiroSubtitle"));
  setTextById("chinchiroBankLabel", tr("chinchiroBank"));
  setTextById("chinchiroBetLabel", tr("chinchiroBet"));
  setTextById("chinchiroBetRangeLabel", tr("chinchiroBetRange"));
  setTextById("chinchiroDealerLabel", tr("chinchiroDealerDice"));
  setTextById("chinchiroPlayerLabel", tr("chinchiroPlayerDice"));
  setTextById("chinchiroStatsLabel", tr("chinchiroStats"));
  setTextById("chinchiroRollBtn", tr("chinchiroRoll"));
  setTextById("chinchiroAllInBtn", tr("chinchiroAllIn"));
  setTextById("blackjackBankLabel", tr("blackjackBank"));
  setTextById("blackjackBetLabel", tr("blackjackBet"));
  setTextById("blackjackWagerLabel", tr("blackjackWager"));
  setTextById("blackjackBetRangeLabel", tr("blackjackBetRange"));
  setTextById("blackjackDealerTotalLabel", tr("blackjackDealerTotal"));
  setTextById("blackjackPlayerTotalLabel", tr("blackjackPlayerTotal"));
  setTextById("blackjackStatsLabel", tr("blackjackStats"));
  setTextById("blackjackHitBtn", tr("blackjackHit"));
  setTextById("blackjackStandBtn", tr("blackjackStand"));
  setTextById("blackjackDoubleBtn", tr("blackjackDouble"));
  setTextById("blackjackAllInBtn", tr("blackjackAllIn"));
  setTextById("pokerRuleLabel", tr("pokerRuleLabel"));
  setTextById("pokerRuleTournamentOption", tr("pokerRuleTournament"));
  setTextById("pokerRuleDraw5Option", tr("pokerRuleDraw5"));
  setTextById("pokerOpponentLabel", tr("pokerOpponentLabel"));
  setTextById("pokerOpponentCpuOption", tr("pokerOpponentCpu"));
  setTextById("pokerOpponentDealerOption", tr("pokerOpponentDealer"));
  setTextById("pokerCpuCountLabel", tr("pokerCpuCountLabel"));
  setTextById("pokerCpuCount1Option", tr("pokerCpuCount1"));
  setTextById("pokerCpuCount2Option", tr("pokerCpuCount2"));
  setTextById("pokerCpuCount3Option", tr("pokerCpuCount3"));
  setTextById("pokerCpuStyleLabel", tr("pokerCpuStyleLabel"));
  setTextById("pokerCpuStyleWeakOption", tr("pokerCpuStyleWeak"));
  setTextById("pokerCpuStyleNormalOption", tr("pokerCpuStyleNormal"));
  setTextById("pokerCpuStyleAggressiveOption", tr("pokerCpuStyleAggressive"));
  setTextById("pokerSfxLabel", tr("pokerSfxLabel"));
  setTextById("pokerSfxOnOption", tr("pokerSfxOn"));
  setTextById("pokerSfxOffOption", tr("pokerSfxOff"));
  setTextById("pokerBankLabel", tr("pokerBank"));
  setTextById("pokerBetLabel", tr("pokerBet"));
  setTextById("pokerOpponentBetLabel", tr("pokerOpponentBet"));
  setTextById("pokerTablePlayerBetLabel", tr("pokerTablePlayerBet"));
  setTextById("pokerTableOpponentBetLabel", tr("pokerTableOpponentBet"));
  setTextById("pokerTablePotLabel", tr("pokerTablePot"));
  setTextById("pokerFocusBetLabel", tr("pokerBet"));
  setTextById("pokerFocusRaiseLabel", tr("pokerRaiseAmount"));
  setTextById("pokerBetRangeLabel", tr("pokerBetRange"));
  setTextById("pokerRaiseAmountLabel", tr("pokerRaiseAmount"));
  setTextById("pokerStatsLabel", tr("pokerStats"));
  setTextById("casinoUpcomingTitle", tr("casinoUpcomingTitle"));
  setTextById("casinoUpcomingDesc", tr("casinoUpcomingDesc"));
  setTextById("roomCardTitle", tr("roomCardTitle"));
  setTextById("roomCardDesc", tr("roomCardDesc"));
  setTextById("othelloCardDesc", tr("othelloCardDesc"));
  setTextById("shogiCardDesc", tr("shogiCardDesc"));
  setTextById("chessCardDesc", tr("chessCardDesc"));
  setTextById("unoCardDesc", tr("unoCardDesc"));
  setTextById("gomokuCardDesc", tr("gomokuCardDesc"));
  setTextById("survivorsCardDesc", tr("survivorsCardDesc"));
  setTextById("bikeRunnerCardDesc", tr("bikeRunnerCardDesc"));
  setTextById("fitPuzzleCardDesc", tr("fitPuzzleCardDesc"));
  setTextById("solitaireCardDesc", tr("solitaireCardDesc"));
  setTextById("drawingRelayCardDesc", tr("drawingRelayCardDesc"));
  setTextById("sevensCardDesc", tr("sevensCardDesc"));
  setTextById("daifugoCardDesc", tr("daifugoCardDesc"));
  setTextById("numeronCardDesc", tr("numeronCardDesc"));
  setTextById("permissionsCardTitle", tr("permissionsCardTitle"));
  setTextById("permissionsCardDesc", tr("permissionsCardDesc"));
  setTextById("inquiryCardTitle", tr("inquiryCardTitle"));
  setTextById("inquiryCardDesc", tr("inquiryCardDesc"));
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
  setTextById("chessModeCpuOption", tr("chessModeCpu"));
  setTextById("chessModeLocalOption", tr("chessModeLocal"));
  setTextById("chessCpuSideLabel", tr("chessCpuSideLabel"));
  setTextById("chessCpuSideWhiteOption", tr("chessCpuSideWhite"));
  setTextById("chessCpuSideBlackOption", tr("chessCpuSideBlack"));
  setTextById("chessCpuSideRandomOption", tr("chessCpuSideRandom"));
  setTextById("chessCpuLevelLabel", tr("chessCpuLevelLabel"));
  setTextById("chessCpuEasyOption", tr("chessCpuEasy"));
  setTextById("chessCpuNormalOption", tr("chessCpuNormal"));
  setTextById("chessCpuHardOption", tr("chessCpuHard"));
  setTextById("chessMyPieceColorLabel", tr("chessMyPieceColorLabel"));
  setTextById("chessMyPieceColorAmber", tr("chessMyPieceColorAmber"));
  setTextById("chessMyPieceColorCyan", tr("chessMyPieceColorCyan"));
  setTextById("chessMyPieceColorLime", tr("chessMyPieceColorLime"));
  setTextById("chessMyPieceColorMagenta", tr("chessMyPieceColorMagenta"));
  setTextById("unoSubtitle", tr("unoSubtitle"));
  setTextById("gomokuSubtitle", tr("gomokuSubtitle"));
  setTextById("survivorsSubtitle", tr("survivorsSubtitle"));
  setTextById("bikeRunnerSubtitle", tr("bikeRunnerSubtitle"));
  setTextById("fitPuzzleSubtitle", tr("fitPuzzleSubtitle"));
  setTextById("solitaireSubtitle", tr("solitaireSubtitle"));
  setTextById("sevensSubtitle", tr("sevensSubtitle"));
  setTextById("daifugoSubtitle", tr("daifugoSubtitle"));
  setTextById("numeronSubtitle", tr("numeronSubtitle"));
  setTextById("unoModeCpuOption", tr("unoModeCpu"));
  setTextById("unoModeLocalOption", tr("unoModeLocal"));
  const gomokuModeSelectEl = document.getElementById("gomokuModeSelect");
  if (gomokuModeSelectEl instanceof HTMLSelectElement && gomokuModeSelectEl.options.length >= 2) {
    gomokuModeSelectEl.options[0].textContent = tr("gomokuModeCpu");
    gomokuModeSelectEl.options[1].textContent = tr("gomokuModeLocal");
  }
  const survivorsCharacterSelectEl = document.getElementById("survivorsCharacterSelect");
  if (survivorsCharacterSelectEl instanceof HTMLSelectElement && survivorsCharacterSelectEl.options.length >= 2) {
    survivorsCharacterSelectEl.options[0].textContent = tr("survivorsCharacterBalanced");
    survivorsCharacterSelectEl.options[1].textContent = tr("survivorsCharacterFairy");
  }
  setTextById("survivorsPauseBtn", tr("survivorsPause"));
  setTextById("survivorsStatsToggleBtn", tr("survivorsStatsOn"));
  setTextById("survivorsRemakeBtn", tr("survivorsRestart"));

  if (entryCloudUserIdInput) entryCloudUserIdInput.placeholder = tr("cloudUserPlaceholder");
  if (entryCloudPasswordInput) entryCloudPasswordInput.placeholder = tr("cloudPassPlaceholder");
  if (playerNameInput) playerNameInput.placeholder = tr("playerNamePlaceholder");
  if (cloudUserIdInput) cloudUserIdInput.placeholder = tr("cloudUserPlaceholder");
  if (cloudPasswordInput) cloudPasswordInput.placeholder = tr("cloudPassPlaceholder");
  if (inquiryNameInput) inquiryNameInput.placeholder = tr("inquiryNamePlaceholder");
  if (inquiryMessageInput) inquiryMessageInput.placeholder = tr("inquiryMessagePlaceholder");
  if (roomCodeInput) roomCodeInput.placeholder = tr("roomCodePlaceholder");

  if (playOthelloBtn) playOthelloBtn.textContent = tr("play");
  if (playShogiBtn) playShogiBtn.textContent = tr("play");
  if (playChessBtn) playChessBtn.textContent = tr("play");
  if (playUnoBtn) playUnoBtn.textContent = tr("play");
  if (playGomokuBtn) playGomokuBtn.textContent = tr("play");
  if (playSurvivorsBtn) playSurvivorsBtn.textContent = tr("play");
  if (playBikeRunnerBtn) playBikeRunnerBtn.textContent = tr("play");
  if (playFitPuzzleBtn) playFitPuzzleBtn.textContent = tr("play");
  if (playSolitaireSingleBtn) playSolitaireSingleBtn.textContent = tr("singlePlay");
  if (playSolitaireMultiBtn) playSolitaireMultiBtn.textContent = tr("multiPlay");
  if (playMinesweeperBtn) playMinesweeperBtn.textContent = tr("play");
  if (playMinesweeperMultiBtn) playMinesweeperMultiBtn.textContent = tr("multiPlay");
  setTextById("drawingModeRelayOption", tr("drawingModeRelay"));
  setTextById("drawingModeFourPanelOption", tr("drawingModeFourPanel"));
  if (playDrawingModeBtn) playDrawingModeBtn.textContent = tr("play");
  if (playPokerBtn) playPokerBtn.textContent = tr("play");
  if (playBlackjackBtn) playBlackjackBtn.textContent = tr("play");
  if (playChinchiroBtn) playChinchiroBtn.textContent = tr("play");
  if (playSevensBtn) playSevensBtn.textContent = tr("play");
  if (playDaifugoBtn) playDaifugoBtn.textContent = tr("play");
  if (playNumeronBtn) playNumeronBtn.textContent = tr("play");
  if (grantNotificationBtn) grantNotificationBtn.textContent = tr("grantNotification");
  if (grantClipboardBtn) grantClipboardBtn.textContent = tr("grantClipboard");
  if (openInquiryAdminBtn) openInquiryAdminBtn.textContent = tr("inquiryAdminOpen");
  if (sendInquiryBtn) sendInquiryBtn.textContent = tr("inquirySend");
  if (cardGamesBackBtn) cardGamesBackBtn.textContent = tr("backToMenu");
  if (casinoBackBtn) casinoBackBtn.textContent = tr("backToMenu");
  if (createRoomBtn) createRoomBtn.textContent = tr("createRoom");
  if (joinRoomBtn) joinRoomBtn.textContent = tr("join");
  if (entryLoginBtn) entryLoginBtn.textContent = tr("loginAndPlay");
  if (entryGuestBtn) entryGuestBtn.textContent = tr("playAsGuest");
  if (saveCloudAuthBtn) saveCloudAuthBtn.textContent = tr("saveCloudAuth");
  if (backToEntryBtn) backToEntryBtn.textContent = tr("backToLogin");
  renderLobbyGameButtons();
  if (lobbyBackBtn) lobbyBackBtn.textContent = tr("backToMenu");
  setTextById("shogiTurnOrderLabel", tr("shogiTurnOrderLabel"));
  setTextById("shogiTurnOrderFirst", tr("shogiTurnOrderFirst"));
  setTextById("shogiTurnOrderSecond", tr("shogiTurnOrderSecond"));
  setTextById("shogiTurnOrderRandom", tr("shogiTurnOrderRandom"));
  setTextById("shogiMyPieceColorLabel", tr("shogiMyPieceColorLabel"));
  setTextById("shogiMyPieceColorAmber", tr("shogiMyPieceColorAmber"));
  setTextById("shogiMyPieceColorCyan", tr("shogiMyPieceColorCyan"));
  setTextById("shogiMyPieceColorLime", tr("shogiMyPieceColorLime"));
  setTextById("shogiMyPieceColorMagenta", tr("shogiMyPieceColorMagenta"));
  setTextById("shogiChaosPlayerModeLabel", tr("shogiChaosPlayerModeLabel"));
  setTextById("shogiChaosPlayerMode2Option", tr("shogiChaosPlayerMode2"));
  setTextById("shogiChaosPlayerMode4Option", tr("shogiChaosPlayerMode4"));
  setTextById("shogiChaosRuleLabel", tr("shogiChaosRuleLabel"));
  setTextById("handicapLabel", tr("handicapLabel"));
  setTextById("handicapTargetLabel", tr("handicapTargetLabel"));
  setTextById("handicapTargetNoneOption", tr("handicapTargetNone"));
  setTextById("handicapNoneOption", tr("handicapNone"));
  setTextById("handicapImmutableOption", tr("handicapImmutable"));
  setTextById("handicapTargetBlackOption", tr("handicapTargetBlack"));
  setTextById("handicapTargetWhiteOption", tr("handicapTargetWhite"));
  setTextById("handicapTargetPlayerOption", tr("handicapTargetPlayer"));
  setTextById("handicapTargetOpponentOption", tr("handicapTargetOpponent"));
  setTextById("handicapTargetBothOption", tr("handicapTargetBoth"));
  setTextById("sideBlackTitle", tr("handicapTargetBlack"));
  setTextById("sideWhiteTitle", tr("handicapTargetWhite"));
  setTextById("bothBlackHandicapLabel", tr("bothBlackHandicapLabel"));
  setTextById("bothWhiteHandicapLabel", tr("bothWhiteHandicapLabel"));
  setTextById("bothBlackHandicapNoneOption", tr("handicapNone"));
  setTextById("bothBlackHandicapImmutableOption", tr("handicapImmutable"));
  setTextById("bothWhiteHandicapNoneOption", tr("handicapNone"));
  setTextById("bothWhiteHandicapImmutableOption", tr("handicapImmutable"));
  setTextById("bothBlackOverwriteLabel", tr("bothBlackOverwriteLabel"));
  setTextById("bothWhiteOverwriteLabel", tr("bothWhiteOverwriteLabel"));
  setTextById("immutablePlaceBtn", tr("immutablePlaceActivate"));
  setTextById("destroySkillBtn", tr("destroySkillActivate"));
  setTextById("overwriteLimitLabel", tr("overwriteLimitLabel"));
  setTextById("randomLineCountIgnoreLabel", tr("randomLineCountIgnoreLabel"));
  setTextById("randomLineCountIgnoreOffOption", tr("randomLineCountIgnoreOff"));
  setTextById("randomLineCountIgnoreOnOption", tr("randomLineCountIgnoreOn"));
  setTextById("destroyLimitGroupLabel", tr("destroyLimitGroupLabel"));
  setTextById("destroyLimitGroupLabelWhite", tr("destroyLimitGroupLabel"));
  setTextById("destroyLimitBlackLabel", tr("destroyLimitBlackLabel"));
  setTextById("destroyLimitWhiteLabel", tr("destroyLimitWhiteLabel"));
  setTextById("doubleActionBtn", tr("doubleActionActivate"));

  setTextById("startBtn", tr("newGame"));
  setTextById("remakeBtn", tr("remake"));
  setTextById("menuBtn", tr("menu"));
  setTextById("shogiStartBtn", tr("newMatch"));
  setTextById("shogiRemakeBtn", tr("remake"));
  setTextById("shogiMenuBtn", tr("menuJa"));
  setTextById("chessStartBtn", tr("newMatch"));
  setTextById("chessRemakeBtn", tr("remake"));
  setTextById("chessMenuBtn", tr("menuJa"));
  setTextById("unoStartBtn", tr("newMatch"));
  setTextById("unoMenuBtn", tr("menu"));
  setTextById("gomokuStartBtn", tr("newMatch"));
  setTextById("gomokuMenuBtn", tr("menu"));
  setTextById("survivorsStartBtn", tr("newMatch"));
  setTextById("survivorsGachaBtn", tr("bankGacha"));
  setTextById("survivorsMenuBtn", tr("menu"));
  setTextById("bikeRunnerStartBtn", tr("newMatch"));
  setTextById("bikeRunnerRemakeBtn", tr("remake"));
  setTextById("bikeRunnerMenuBtn", tr("menu"));
  setTextById("fitPuzzleStartBtn", tr("newMatch"));
  setTextById("fitPuzzleBoardLabel", tr("fitPuzzleBoardLabel"));
  setTextById("fitPuzzlePlacedLabel", tr("fitPuzzlePlacedLabel"));
  setTextById("fitPuzzleScoreLabel", tr("fitPuzzleScoreLabel"));
  setTextById("fitPuzzleTimeLabel", tr("fitPuzzleTimeLabel"));
  setTextById("fitPuzzleDifficultyLabel", tr("fitPuzzleDifficultyLabel"));
  setTextById("fitPuzzleStageSelectLabel", tr("fitPuzzleStageSelectLabel"));
  setTextById("fitPuzzleDifficultyEasyOption", tr("fitPuzzleDifficultyEasy"));
  setTextById("fitPuzzleDifficultyNormalOption", tr("fitPuzzleDifficultyNormal"));
  setTextById("fitPuzzleDifficultyHardOption", tr("fitPuzzleDifficultyHard"));
  setTextById("drawingRelayDifficultyLabel", tr("fitPuzzleDifficultyLabel"));
  setTextById("drawingRelayDifficultyEasyOption", tr("fitPuzzleDifficultyEasy"));
  setTextById("drawingRelayDifficultyNormalOption", tr("fitPuzzleDifficultyNormal"));
  setTextById("drawingRelayDifficultyHardOption", tr("fitPuzzleDifficultyHard"));
  setTextById("fitPuzzleNextBtn", tr("nextStage"));
  setTextById("fitPuzzleRotateBtn", tr("rotate"));
  setTextById("fitPuzzleNoRotateBtn", tr("noRotateMode"));
  setTextById("fitPuzzleAssistBtn", tr("assist"));
  setTextById("fitPuzzleResetBtn", tr("reset"));
  setTextById("fitPuzzleMenuBtn", tr("menu"));
  setTextById("solitaireStartBtn", tr("newMatch"));
  setTextById("solitaireResetBtn", tr("resetEn"));
  setTextById("solitaireUndoBtn", tr("undo"));
  setTextById("solitaireMenuBtn", tr("menu"));
  setTextById("minesweeperRemakeBtn", tr("remake"));
  setTextById("drawingRelayStartBtn", tr("newMatch"));
  setTextById("drawingRelayRemakeBtn", tr("remake"));
  setTextById("drawingRelayMenuBtn", tr("menu"));
  setTextById("fourPanelStartBtn", tr("newMatch"));
  setTextById("fourPanelRemakeBtn", tr("remake"));
  setTextById("fourPanelMenuBtn", tr("menu"));
  setTextById("pokerStartBtn", tr("newMatch"));
  setTextById("pokerRemakeBtn", tr("remake"));
  setTextById("pokerBetMinusBtn", "-");
  setTextById("pokerBetPlusBtn", "+");
  setTextById("pokerRaiseMinusBtn", "-");
  setTextById("pokerRaisePlusBtn", "+");
  setTextById("pokerRaise25Btn", tr("pokerRaise25"));
  setTextById("pokerRaise50Btn", tr("pokerRaise50"));
  setTextById("pokerRaise75Btn", tr("pokerRaise75"));
  setTextById("pokerRaise100Btn", tr("pokerRaise100"));
  setTextById("pokerAllInBtn", tr("pokerAllIn"));
  setTextById("pokerChangeBtn", tr("pokerChange"));
  setTextById("pokerRaiseBtn", tr("pokerRaise"));
  setTextById("pokerStandBtn", tr("pokerCheck"));
  setTextById("pokerCallBtn", tr("pokerCall"));
  setTextById("pokerFoldBtn", tr("pokerFold"));
  setTextById("pokerDrawBtn", tr("pokerNext"));
  setTextById("pokerMenuBtn", tr("menu"));
  setTextById("blackjackStartBtn", tr("newMatch"));
  setTextById("blackjackRemakeBtn", tr("blackjackReplay"));
  setTextById("blackjackMenuBtn", tr("menu"));
  setTextById("chinchiroStartBtn", tr("newMatch"));
  setTextById("chinchiroRemakeBtn", tr("chinchiroReplay"));
  setTextById("chinchiroMenuBtn", tr("menu"));
  setTextById("sevensStartBtn", tr("newMatch"));
  setTextById("sevensMenuBtn", tr("menu"));
  setTextById("daifugoStartBtn", tr("newMatch"));
  setTextById("daifugoMenuBtn", tr("menu"));
  setTextById("numeronStartBtn", tr("newMatch"));
  setTextById("numeronMenuBtn", tr("menu"));

  const menuTitle = menuScreen?.querySelector(".top-bar h1");
  if (menuTitle) menuTitle.textContent = tr("gameSelectTitle");
}

function setLanguage(lang) {
  currentLang = messages[lang] ? lang : "ja";
  document.documentElement.setAttribute("lang", currentLang);
  if (langSelect && langSelect.value !== currentLang) {
    langSelect.value = currentLang;
  }
  localStorage.setItem(STORAGE_LANG_KEY, currentLang);
  applyStaticTranslations();
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
  autoRoleJoin: false,
  hasAuthoritativeRoomState: false,
  transport: null,
  transportKind: "none",
  peerConnected: false,
  selectedGame: null,
  playerName: "Player",
  peerName: null,
  participants: new Map(),
};

const ROOM_SNAPSHOT_SEND_INTERVAL_MS = 40;
const ROOM_SNAPSHOT_APPLY_INTERVAL_MS = 40;
const roomSnapshotSendState = new Map();
const roomSnapshotApplyState = new Map();
const roomSnapshotSendSeq = new Map();
const roomSnapshotLastReceivedSeq = new Map();

const gameScreens = {
  othello: othelloScreen,
  shogi: shogiScreen,
  chess: chessScreen,
  uno: unoScreen,
  gomoku: gomokuScreen,
  survivors: survivorsScreen,
  bikeRunner: bikeRunnerScreen,
  fitPuzzle: fitPuzzleScreen,
  solitaire: solitaireScreen,
  minesweeper: minesweeperScreen,
  drawingRelay: drawingRelayScreen,
  fourPanel: fourPanelScreen,
  poker: pokerScreen,
  blackjack: blackjackScreen,
  chinchiro: chinchiroScreen,
  sevens: sevensScreen,
  daifugo: daifugoScreen,
  numeron: numeronScreen,
};

let games = null;
let currentGameKey = "othello";
let activeCloudAuth = null;
let activeCloudProfile = null;
let gameDataCache = null;
let gameDataSyncTimerId = null;
let gameDataDirty = false;
let fitPuzzleProgressCache = null;
let fitPuzzleProgressDirty = false;
let startedGameKeysCache = new Set();

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

function createDefaultGameData() {
  const data = {};
  ALL_GAME_KEYS.forEach((key) => {
    data[key] = {
      playCount: 0,
      roomPlayCount: 0,
      lastPlayedAt: null,
    };
  });
  data.casinoBankroll = DEFAULT_CASINO_BANKROLL;
  data.casinoBankUpdatedAt = null;
  return data;
}

function scopedGameDataStorageKey(userId = "") {
  const normalized = String(userId || "").trim();
  const scope = normalized ? `user:${normalized}` : "guest";
  return `${STORAGE_GAME_DATA_KEY}:${scope}`;
}

function syncStartedGamesScope() {
  startedGameKeysCache = new Set();
  updatePlayedGameCardState();
}

function markGameStarted(gameKey) {
  if (!ALL_GAME_KEYS.includes(gameKey)) return;
  if (startedGameKeysCache.has(gameKey)) return;
  startedGameKeysCache.add(gameKey);
  updatePlayedGameCardState();
}

function createDefaultFitPuzzleProgress() {
  return {
    highestUnlockedStage: 0,
    selectedStageIndex: 0,
    difficulty: "normal",
    noRotateMode: false,
    customStages: [],
    updatedAt: null,
  };
}

function sanitizeFitPuzzleStage(raw, idx = 0) {
  const rows = Math.max(4, Math.min(12, Number.isFinite(Number(raw?.rows)) ? Math.floor(Number(raw.rows)) : 10));
  const cols = Math.max(4, Math.min(12, Number.isFinite(Number(raw?.cols)) ? Math.floor(Number(raw.cols)) : 10));
  const maxCells = rows * cols;
  const pieceCount = Math.max(2, Math.min(maxCells, Number.isFinite(Number(raw?.pieceCount)) ? Math.floor(Number(raw.pieceCount)) : Math.max(2, Math.floor(maxCells / 2))));
  const bias = raw?.profile?.bias === "long" || raw?.profile?.bias === "blocks" ? raw.profile.bias : "balanced";
  const mutationSteps = Math.max(0, Math.min(20000, Number.isFinite(Number(raw?.profile?.mutationSteps)) ? Math.floor(Number(raw.profile.mutationSteps)) : rows * cols * 6));
  const minComplex = Math.max(0, Math.min(200, Number.isFinite(Number(raw?.profile?.minComplex)) ? Math.floor(Number(raw.profile.minComplex)) : 0));
  const minBranch = Math.max(0, Math.min(200, Number.isFinite(Number(raw?.profile?.minBranch)) ? Math.floor(Number(raw.profile.minBranch)) : 0));
  const openingRotation = raw?.openingRotation === "mostly-rotated" ? "mostly-rotated" : "mixed";
  const assistLimit = Math.max(0, Math.min(10, Number.isFinite(Number(raw?.assistLimit)) ? Math.floor(Number(raw.assistLimit)) : 0));
  const seed = Math.max(1, Number.isFinite(Number(raw?.seed)) ? Math.floor(Number(raw.seed)) : 10001 + idx * 101);
  const title = String(raw?.title || `カスタム-${idx + 1}`).trim().slice(0, 40) || `カスタム-${idx + 1}`;
  return {
    rows,
    cols,
    pieceCount,
    title,
    profile: {
      bias,
      mutationSteps,
      minComplex,
      minBranch,
    },
    openingRotation,
    assistLimit,
    seed,
  };
}

function scopedFitPuzzleProgressStorageKey(userId = "") {
  const normalized = String(userId || "").trim();
  const scope = normalized ? `user:${normalized}` : "guest";
  return `${STORAGE_FIT_PUZZLE_PROGRESS_KEY}:${scope}`;
}

function sanitizeFitPuzzleProgress(raw) {
  const fallback = createDefaultFitPuzzleProgress();
  if (!raw || typeof raw !== "object") return fallback;

  const highestUnlockedStage = Number(raw.highestUnlockedStage);
  const selectedStageIndex = Number(raw.selectedStageIndex);
  const difficulty = raw.difficulty === "easy" || raw.difficulty === "normal" || raw.difficulty === "hard" ? raw.difficulty : "normal";
  const updatedAt = typeof raw.updatedAt === "string" && raw.updatedAt.trim() ? raw.updatedAt.trim().slice(0, 64) : null;
  const safeHighest = Number.isFinite(highestUnlockedStage) ? Math.max(0, Math.floor(highestUnlockedStage)) : 0;
  const safeSelected = Number.isFinite(selectedStageIndex) ? Math.max(0, Math.floor(selectedStageIndex)) : 0;
  const customStages = Array.isArray(raw.customStages) ? raw.customStages.map((stage, idx) => sanitizeFitPuzzleStage(stage, idx)) : [];

  return {
    highestUnlockedStage: safeHighest,
    selectedStageIndex: Math.min(safeHighest, safeSelected),
    difficulty,
    noRotateMode: Boolean(raw.noRotateMode),
    customStages,
    updatedAt,
  };
}

function loadLocalFitPuzzleProgress(userId = "") {
  try {
    const scopedKey = scopedFitPuzzleProgressStorageKey(userId);
    const raw = localStorage.getItem(scopedKey);
    if (raw) return sanitizeFitPuzzleProgress(JSON.parse(raw));
    return createDefaultFitPuzzleProgress();
  } catch {
    return createDefaultFitPuzzleProgress();
  }
}

function saveLocalFitPuzzleProgress(data, userId = "") {
  try {
    localStorage.setItem(scopedFitPuzzleProgressStorageKey(userId), JSON.stringify(sanitizeFitPuzzleProgress(data)));
  } catch {
    // Keep gameplay functional even when storage is unavailable.
  }
}

function mergeFitPuzzleProgress(localProgress, cloudProgress) {
  const local = sanitizeFitPuzzleProgress(localProgress);
  const cloud = sanitizeFitPuzzleProgress(cloudProgress);
  const localTime = local.updatedAt || "";
  const cloudTime = cloud.updatedAt || "";
  const newer = cloudTime >= localTime ? cloud : local;
  const highestUnlockedStage = Math.max(local.highestUnlockedStage, cloud.highestUnlockedStage);
  const customStages =
    cloudTime > localTime
      ? cloud.customStages
      : localTime > cloudTime
        ? local.customStages
        : (cloud.customStages?.length || 0) >= (local.customStages?.length || 0)
          ? cloud.customStages
          : local.customStages;
  return {
    highestUnlockedStage,
    selectedStageIndex: Math.min(highestUnlockedStage, newer.selectedStageIndex),
    difficulty: newer.difficulty,
    noRotateMode: newer.noRotateMode,
    customStages: Array.isArray(customStages) ? customStages : [],
    updatedAt: newer.updatedAt || null,
  };
}

function syncFitPuzzleProgressScope({ userId = "", cloudProfile = null }) {
  const localProgress = loadLocalFitPuzzleProgress(userId);
  if (cloudProfile && typeof cloudProfile === "object") {
    fitPuzzleProgressCache = mergeFitPuzzleProgress(localProgress, cloudProfile.fitPuzzleProgress);
  } else {
    fitPuzzleProgressCache = localProgress;
  }
  saveLocalFitPuzzleProgress(fitPuzzleProgressCache, userId);
}

function updateFitPuzzleProgress(nextProgress) {
  const auth = activeCloudAuth || getCloudAuthFromStorage();
  fitPuzzleProgressCache = sanitizeFitPuzzleProgress({
    ...nextProgress,
    updatedAt: new Date().toISOString(),
  });
  saveLocalFitPuzzleProgress(fitPuzzleProgressCache, auth?.userId || "");
  fitPuzzleProgressDirty = true;
  scheduleGameDataCloudSync();
}

function sanitizeGameData(raw) {
  const fallback = createDefaultGameData();
  if (!raw || typeof raw !== "object") return fallback;

  ALL_GAME_KEYS.forEach((key) => {
    const src = raw[key];
    if (!src || typeof src !== "object") return;
    const playCount = Number(src.playCount);
    const roomPlayCount = Number(src.roomPlayCount);
    const lastPlayedAt = typeof src.lastPlayedAt === "string" && src.lastPlayedAt.trim() ? src.lastPlayedAt.trim() : null;
    fallback[key] = {
      playCount: Number.isFinite(playCount) ? Math.max(0, Math.floor(playCount)) : 0,
      roomPlayCount: Number.isFinite(roomPlayCount) ? Math.max(0, Math.floor(roomPlayCount)) : 0,
      lastPlayedAt,
    };
  });

  const casinoBankroll = Number(raw.casinoBankroll);
  const casinoBankUpdatedAt = typeof raw.casinoBankUpdatedAt === "string" && raw.casinoBankUpdatedAt.trim() ? raw.casinoBankUpdatedAt.trim() : null;
  fallback.casinoBankroll = Number.isFinite(casinoBankroll) ? Math.max(0, Math.floor(casinoBankroll)) : DEFAULT_CASINO_BANKROLL;
  fallback.casinoBankUpdatedAt = casinoBankUpdatedAt;

  return fallback;
}

function loadLocalGameData(userId = "") {
  try {
    const scopedKey = scopedGameDataStorageKey(userId);
    const raw = localStorage.getItem(scopedKey);
    if (raw) return sanitizeGameData(JSON.parse(raw));

    const legacy = localStorage.getItem(STORAGE_GAME_DATA_KEY);
    if (!legacy) return createDefaultGameData();
    const migrated = sanitizeGameData(JSON.parse(legacy));
    localStorage.setItem(scopedKey, JSON.stringify(migrated));
    return migrated;
  } catch {
    return createDefaultGameData();
  }
}

function saveLocalGameData(data, userId = "") {
  try {
    localStorage.setItem(scopedGameDataStorageKey(userId), JSON.stringify(sanitizeGameData(data)));
  } catch {
    // Keep gameplay functional even when storage is unavailable.
  }
}

function syncGameDataScope({ userId = "", cloudProfile = null }) {
  const localData = loadLocalGameData(userId);
  if (cloudProfile && typeof cloudProfile === "object") {
    const cloudData = sanitizeGameData(cloudProfile.gameData);
    const merged = createDefaultGameData();
    ALL_GAME_KEYS.forEach((key) => {
      const localEntry = localData[key] || merged[key];
      const cloudEntry = cloudData[key] || merged[key];
      const localTime = localEntry.lastPlayedAt || "";
      const cloudTime = cloudEntry.lastPlayedAt || "";
      merged[key] = {
        playCount: Math.max(localEntry.playCount || 0, cloudEntry.playCount || 0),
        roomPlayCount: Math.max(localEntry.roomPlayCount || 0, cloudEntry.roomPlayCount || 0),
        lastPlayedAt: localTime > cloudTime ? localTime : cloudTime || null,
      };
    });

    const localCasinoTime = typeof localData.casinoBankUpdatedAt === "string" ? localData.casinoBankUpdatedAt : "";
    const cloudCasinoTime = typeof cloudData.casinoBankUpdatedAt === "string" ? cloudData.casinoBankUpdatedAt : "";
    const localCasinoBank = Number.isFinite(Number(localData.casinoBankroll)) ? Math.max(0, Math.floor(Number(localData.casinoBankroll))) : DEFAULT_CASINO_BANKROLL;
    const cloudCasinoBank = Number.isFinite(Number(cloudData.casinoBankroll)) ? Math.max(0, Math.floor(Number(cloudData.casinoBankroll))) : DEFAULT_CASINO_BANKROLL;
    if (cloudCasinoTime > localCasinoTime) {
      merged.casinoBankroll = cloudCasinoBank;
      merged.casinoBankUpdatedAt = cloudCasinoTime || null;
    } else {
      merged.casinoBankroll = localCasinoBank;
      merged.casinoBankUpdatedAt = localCasinoTime || cloudCasinoTime || null;
    }

    gameDataCache = merged;
  } else {
    gameDataCache = localData;
  }
  saveLocalGameData(gameDataCache, userId);
  updatePlayedGameCardState();
  controllerOf("poker")?.onSaveDataScopeChanged?.();
  controllerOf("blackjack")?.onSaveDataScopeChanged?.();
  controllerOf("chinchiro")?.onSaveDataScopeChanged?.();
}

function getCasinoBankrollFromSaveData() {
  if (!gameDataCache) {
    const auth = activeCloudAuth || getCloudAuthFromStorage();
    syncGameDataScope({ userId: auth?.userId || "" });
  }
  const raw = Number(gameDataCache?.casinoBankroll);
  if (!Number.isFinite(raw) || raw < 0) return DEFAULT_CASINO_BANKROLL;
  return Math.floor(raw);
}

function saveCasinoBankrollToSaveData(nextBankroll) {
  if (!gameDataCache) {
    const auth = activeCloudAuth || getCloudAuthFromStorage();
    syncGameDataScope({ userId: auth?.userId || "" });
  }
  if (!gameDataCache) {
    gameDataCache = createDefaultGameData();
  }

  gameDataCache.casinoBankroll = Math.max(0, Math.floor(Number(nextBankroll) || 0));
  gameDataCache.casinoBankUpdatedAt = new Date().toISOString();

  const auth = activeCloudAuth || getCloudAuthFromStorage();
  saveLocalGameData(gameDataCache, auth?.userId || "");
  scheduleGameDataCloudSync();
}

function scheduleGameDataCloudSync() {
  if (!activeCloudAuth || (!gameDataCache && !fitPuzzleProgressCache)) return;
  if (gameDataCache) gameDataDirty = true;
  if (gameDataSyncTimerId) {
    window.clearTimeout(gameDataSyncTimerId);
  }
  gameDataSyncTimerId = window.setTimeout(async () => {
    gameDataSyncTimerId = null;
    if (!activeCloudAuth) return;
    if (!gameDataDirty && !fitPuzzleProgressDirty) return;
    if (!gameDataCache && !fitPuzzleProgressCache) return;

    let profile = activeCloudProfile && typeof activeCloudProfile === "object" ? { ...activeCloudProfile } : null;
    if (!profile) {
      const check = await verifyCloudAuth(activeCloudAuth.userId, activeCloudAuth.password);
      if (!check.ok) return;
      profile = check.profile && typeof check.profile === "object" ? { ...check.profile } : {};
    }

    if (gameDataCache) {
      profile.gameData = sanitizeGameData(gameDataCache);
    }
    if (fitPuzzleProgressCache) {
      profile.fitPuzzleProgress = sanitizeFitPuzzleProgress(fitPuzzleProgressCache);
    }

    try {
      const ok = await saveCloudProfile(activeCloudAuth.userId, activeCloudAuth.password, profile);
      if (ok) {
        activeCloudProfile = profile;
        gameDataDirty = false;
        fitPuzzleProgressDirty = false;
      }
    } catch {
      // Keep dirty=true to retry on next local update.
    }
  }, 900);
}

function recordGamePlay(gameKey, mode = "local") {
  if (!ALL_GAME_KEYS.includes(gameKey)) return;
  if (!gameDataCache) {
    const auth = activeCloudAuth || getCloudAuthFromStorage();
    syncGameDataScope({ userId: auth?.userId || "" });
  }

  const current = gameDataCache?.[gameKey] || { playCount: 0, roomPlayCount: 0, lastPlayedAt: null };
  gameDataCache[gameKey] = {
    playCount: Math.max(0, Math.floor(Number(current.playCount) || 0)) + 1,
    roomPlayCount: Math.max(0, Math.floor(Number(current.roomPlayCount) || 0)) + (mode === "room" ? 1 : 0),
    lastPlayedAt: new Date().toISOString(),
  };

  updatePlayedGameCardState();

  const auth = activeCloudAuth || getCloudAuthFromStorage();
  saveLocalGameData(gameDataCache, auth?.userId || "");
  scheduleGameDataCloudSync();
}

function normalizeRoomCode(raw) {
  return String(raw ?? "").replace(/\D/g, "").slice(0, 6);
}

function generateRoomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function setMenuMessage(text) {
  roomMenuMessage.textContent = text;
}

function setInquiryStatus(text) {
  if (inquiryStatusMessage) inquiryStatusMessage.textContent = text || "";
}

function setInquiryAdminStatus(text) {
  if (inquiryAdminStatus) inquiryAdminStatus.textContent = text || "";
}

function formatInquiryDate(isoText) {
  const date = new Date(isoText);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(currentLang === "ko" ? "ko-KR" : "ja-JP");
}

function renderInquiryAdminList(items) {
  if (!inquiryAdminList) return;
  if (!Array.isArray(items) || items.length === 0) {
    inquiryAdminList.textContent = tr("inquiryAdminEmpty");
    return;
  }

  const blocks = items.map((item, idx) => {
    const title = `#${idx + 1} ${formatInquiryDate(item.submittedAt)}`;
    const name = String(item.name || "").trim() || "(anonymous)";
    const message = String(item.message || "").trim();
    const url = String(item.url || "").trim();
    return `${title}\nname: ${name}\nurl: ${url || "-"}\nmessage:\n${message}`;
  });

  inquiryAdminList.textContent = blocks.join("\n\n----------------------------------------\n\n");
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

function resolveAutoRoleFromParticipants() {
  if (!roomSession.autoRoleJoin) return;

  let nextRole = "host";
  if (roomSession.hasAuthoritativeRoomState) {
    const participantIds = [...roomSession.participants.keys()];
    const firstParticipantId = participantIds[0] || peerId;
    const secondParticipantId = participantIds[1] || null;
    if (firstParticipantId === peerId) {
      nextRole = "host";
    } else if (secondParticipantId === peerId) {
      nextRole = "guest";
    } else {
      nextRole = "spectator";
    }
  } else if (otherParticipantNames().length > 0) {
    nextRole = "guest";
  }

  roomSession.role = nextRole;
  updateRoomStatus({ roomCode: roomSession.code, roomRole: roomSession.role });
}

async function cloudApiRequest(path, payload) {
  const candidates = [CLOUD_API_PRIMARY_BASE];

  if (CLOUD_API_HOST_FALLBACK_BASE !== CLOUD_API_PRIMARY_BASE) {
    candidates.push(CLOUD_API_HOST_FALLBACK_BASE);
  }

  if (CLOUD_API_LOCALHOST_FALLBACK_BASE !== CLOUD_API_PRIMARY_BASE && CLOUD_API_LOCALHOST_FALLBACK_BASE !== CLOUD_API_HOST_FALLBACK_BASE) {
    candidates.push(CLOUD_API_LOCALHOST_FALLBACK_BASE);
  }

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
        const err = new Error(data?.message || `Cloud API request failed at ${base}`);
        err.code = data?.code || "CLOUD_REQUEST_ERROR";
        err.status = res.status;

        // Auth failures are definitive; do not mask them with later fallback attempts.
        if (err.code === "INVALID_PASSWORD" || err.code === "AUTH_REQUIRED") {
          throw err;
        }

        lastError = err;
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
  } catch (err) {
    if (err?.code === "INVALID_PASSWORD") {
      return { ok: false, reason: "duplicate" };
    }
    return { ok: false, reason: "failed" };
  }
}

async function saveCloudProfile(userId, password, profile) {
  const { res, data } = await cloudApiRequest("/api/profile/save", { userId, password, profile });
  return Boolean(res.ok && data?.ok !== false);
}

async function submitInquiry(payload) {
  const { res, data } = await cloudApiRequest("/api/inquiry", payload);
  return Boolean(res.ok && data?.ok !== false);
}

async function loadInquiryList(limit = 50) {
  if (!activeCloudAuth?.userId || !activeCloudAuth?.password) {
    return null;
  }
  const { res, data } = await cloudApiRequest("/api/inquiry/list", {
    userId: activeCloudAuth.userId,
    password: activeCloudAuth.password,
    limit,
  });
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.message || "failed to load inquiries");
  }
  return Array.isArray(data?.items) ? data.items : [];
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
    const ok = await saveCloudProfile(userId, password, profile);
    if (ok && activeCloudAuth?.userId === userId) {
      activeCloudProfile = { ...profile };
    }
    return ok;
  } catch {
    return false;
  }
}

function showOnly(screen) {
  [
    entryScreen,
    menuScreen,
    cardGamesMenuScreen,
    casinoMenuScreen,
    lobbyScreen,
    othelloScreen,
    shogiScreen,
    chessScreen,
    unoScreen,
    gomokuScreen,
    survivorsScreen,
    bikeRunnerScreen,
    fitPuzzleScreen,
    solitaireScreen,
    minesweeperScreen,
    drawingRelayScreen,
    fourPanelScreen,
    pokerScreen,
    blackjackScreen,
    chinchiroScreen,
    sevensScreen,
    daifugoScreen,
    numeronScreen,
  ].forEach((el) => {
    el?.classList.add("hidden");
  });
  screen?.classList.remove("hidden");
}

function showEntryScreen() {
  showOnly(entryScreen);
}

function showMenuScreen() {
  updatePermissionCardVisibility();
  showOnly(menuScreen);
}

function showCardGamesMenuScreen() {
  showOnly(cardGamesMenuScreen);
}

function showCasinoMenuScreen() {
  showOnly(casinoMenuScreen);
}

function setPermissionMessage(text) {
  if (!permissionMessage) return;
  permissionMessage.textContent = text || "";
}

function canViewPermissionsCard() {
  const userId = String(activeCloudAuth?.userId || "").trim().toLowerCase();
  return userId === PERMISSIONS_VISIBLE_USER_ID;
}

function updatePermissionCardVisibility() {
  if (!permissionsCard) return;
  const visible = canViewPermissionsCard();
  permissionsCard.classList.toggle("hidden", !visible);
  if (!visible) {
    setPermissionMessage("");
    setInquiryAdminStatus("");
    if (inquiryAdminList) inquiryAdminList.textContent = "";
  }
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
  const roleText =
    roomRole === "host"
      ? tr("roleHost")
      : roomRole === "guest"
        ? tr("roleGuest")
        : roomRole === "spectator"
          ? tr("roleSpectator")
          : "-";
  roomRoleText.textContent = `${tr("labelRole")}: ${roleText} / ${roomSession.playerName}`;
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
  controller.setRoomParticipants({
    count: roomParticipantCount(),
    max: MAX_ROOM_PLAYERS,
    participants: [...roomSession.participants.entries()].map(([id, name]) => ({ id, name })),
  });
}

function refreshRoomPresence() {
  resolveAutoRoleFromParticipants();
  const others = otherParticipantNames();
  roomSession.peerConnected = others.length > 0;
  roomSession.peerName = others.length > 0 ? (others.length === 1 ? others[0] : `${others[0]} +${others.length - 1}`) : null;
  updateLobbyView();
  if (roomSession.role === "host" && roomSession.code) {
    setMenuMessage(roomSession.peerConnected ? tr("lobbyParticipantConnected") : tr("lobbyWaitPeer"));
  }

  const selectedController = roomSession.selectedGame ? controllerOf(roomSession.selectedGame) : null;
  const inGameScreen = menuScreen.classList.contains("hidden") && lobbyScreen.classList.contains("hidden");
  if (selectedController && inGameScreen) {
    if (roomSession.role === "host") {
      selectedController.setRoomLock({
        locked: !roomSession.peerConnected,
        message: roomSession.peerConnected ? "" : tr("gameWaitPeerReconnect"),
      });
    } else if (roomSession.role === "guest") {
      selectedController.setRoomLock({
        locked: true,
        message: roomSession.peerConnected ? tr("gameWaitHostStart") : tr("gameWaitPeerReconnect"),
      });
    }
  }

  syncRoomParticipantsToGame();
}

function updateLobbyView() {
  const code = roomSession.code ?? "-";
  const roleLabel =
    roomSession.role === "host"
      ? tr("roleHost")
      : roomSession.role === "guest"
        ? tr("roleGuest")
        : roomSession.role === "spectator"
          ? tr("roleSpectator")
          : "-";
  const participants = roomSession.code ? Math.max(1, roomParticipantCount()) : 0;
  const peerLabel = roomSession.peerConnected
    ? tr("roomConnectedCount", { count: participants })
    : tr("roomWaitingCount", { count: participants });

  lobbyRoomCodeText.textContent = `${tr("labelRoom")}: ${code}`;
  lobbyRoleText.textContent = `${tr("labelRole")}: ${roleLabel}`;
  lobbySelfNameText.textContent = `${tr("labelYou")}: ${roomSession.playerName}`;
  lobbyPeerNameText.textContent = `${tr("labelPeer")}: ${roomSession.peerName ?? "-"}`;
  lobbyPeerText.textContent = `${tr("labelStatus")}: ${peerLabel}`;

  const hostCanStart = roomSession.role === "host";
  lobbyStartButtonsByGame.forEach((button) => {
    button.disabled = !hostCanStart;
  });

}

function startLobbyRoomGame(gameKey) {
  if (roomSession.role !== "host") return;

  roomSession.selectedGame = gameKey;
  postRoomMessage({ type: "select-game", game: gameKey });
  enterRoomGame(gameKey);
}

function renderLobbyGameButtons() {
  if (!lobbyGameButtons) return;

  ROOM_LOBBY_GAME_KEYS.forEach((gameKey) => {
    let button = lobbyStartButtonsByGame.get(gameKey);
    if (!button) {
      button = document.createElement("button");
      button.className = "start-btn";
      button.type = "button";
      button.dataset.gameKey = gameKey;
      button.addEventListener("click", () => {
        startLobbyRoomGame(gameKey);
      });
      lobbyStartButtonsByGame.set(gameKey, button);
      lobbyGameButtons.append(button);
    }

    const labelKey = LOBBY_START_LABEL_KEYS[gameKey];
    button.textContent = labelKey ? tr(labelKey) : `${gameKey.toUpperCase()} START`;
  });
}

function resolveLocalPlayer() {
  if (roomSession.role === "host") return BLACK;
  if (roomSession.role === "guest") return WHITE;
  return null;
}

function postRoomMessage(message) {
  if (!roomSession.transport) return;
  roomSession.transport.send(message);
}

function controllerOf(gameKey) {
  return games?.[gameKey]?.controller;
}

function activeController() {
  return controllerOf(currentGameKey);
}

function clearSnapshotSchedulers() {
  roomSnapshotSendState.forEach((entry) => {
    if (entry?.timerId) {
      window.clearTimeout(entry.timerId);
    }
  });
  roomSnapshotApplyState.forEach((entry) => {
    if (entry?.timerId) {
      window.clearTimeout(entry.timerId);
    }
  });
  roomSnapshotSendState.clear();
  roomSnapshotApplyState.clear();
  roomSnapshotSendSeq.clear();
  roomSnapshotLastReceivedSeq.clear();
}

function clearSnapshotApplyForGame(gameKey) {
  const state = roomSnapshotApplyState.get(gameKey);
  if (state?.timerId) {
    window.clearTimeout(state.timerId);
  }
  roomSnapshotApplyState.delete(gameKey);
}

function scheduleRoomSnapshotBroadcast(gameKey, { force = false } = {}) {
  const controller = controllerOf(gameKey);
  if (!controller) return;

  let state = roomSnapshotSendState.get(gameKey);
  if (!state) {
    state = { timerId: null, lastSentAt: 0, pendingSnapshot: null };
    roomSnapshotSendState.set(gameKey, state);
  }

  state.pendingSnapshot = controller.getSnapshot();

  const sendNow = () => {
    state.timerId = null;
    if (!roomSession.transport) return;
    if (!state.pendingSnapshot) return;
    const nextSeq = (roomSnapshotSendSeq.get(gameKey) || 0) + 1;
    roomSnapshotSendSeq.set(gameKey, nextSeq);
    postRoomMessage({ type: "snapshot", game: gameKey, snapshot: state.pendingSnapshot, snapshotSeq: nextSeq });
    state.pendingSnapshot = null;
    state.lastSentAt = Date.now();
  };

  if (force) {
    if (state.timerId) {
      window.clearTimeout(state.timerId);
      state.timerId = null;
    }
    sendNow();
    return;
  }

  const elapsed = Date.now() - state.lastSentAt;
  if (elapsed >= ROOM_SNAPSHOT_SEND_INTERVAL_MS && !state.timerId) {
    sendNow();
    return;
  }

  if (state.timerId) return;
  const waitMs = Math.max(0, ROOM_SNAPSHOT_SEND_INTERVAL_MS - elapsed);
  state.timerId = window.setTimeout(sendNow, waitMs);
}

function applyRoomSnapshotCoalesced(gameKey, snapshot) {
  const controller = controllerOf(gameKey);
  if (!controller) return;

  const shouldCoalesce = roomSession.role !== "host";
  if (!shouldCoalesce) {
    controller.applySnapshot(snapshot);
    return;
  }

  let state = roomSnapshotApplyState.get(gameKey);
  if (!state) {
    state = { timerId: null, lastAppliedAt: 0, pendingSnapshot: null };
    roomSnapshotApplyState.set(gameKey, state);
  }

  state.pendingSnapshot = snapshot;

  const applyNow = () => {
    state.timerId = null;
    const target = controllerOf(gameKey);
    if (!target || !state.pendingSnapshot) return;
    target.applySnapshot(state.pendingSnapshot);
    state.pendingSnapshot = null;
    state.lastAppliedAt = Date.now();
  };

  const elapsed = Date.now() - state.lastAppliedAt;
  if (elapsed >= ROOM_SNAPSHOT_APPLY_INTERVAL_MS && !state.timerId) {
    applyNow();
    return;
  }

  if (state.timerId) return;
  const waitMs = Math.max(0, ROOM_SNAPSHOT_APPLY_INTERVAL_MS - elapsed);
  state.timerId = window.setTimeout(applyNow, waitMs);
}

function shouldIgnoreStaleSnapshot(payload) {
  const sender = String(payload?.from || "");
  const game = String(payload?.game || "");
  const seq = Number(payload?.snapshotSeq);
  if (!sender || !game || !Number.isFinite(seq)) return false;
  const key = `${game}:${sender}`;
  const last = roomSnapshotLastReceivedSeq.get(key) || 0;
  if (seq <= last) {
    return true;
  }
  roomSnapshotLastReceivedSeq.set(key, seq);
  return false;
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

  clearSnapshotSchedulers();

  roomSession.code = null;
  roomSession.role = null;
  roomSession.autoRoleJoin = false;
  roomSession.hasAuthoritativeRoomState = false;
  roomSession.transport = null;
  roomSession.transportKind = "none";
  roomSession.peerConnected = false;
  roomSession.selectedGame = null;
  roomSession.peerName = null;
  roomSession.participants = new Map();
  updateLobbyView();
  updateRoomStatus({ roomCode: null, roomRole: null });
}

function enterRoomGame(gameKey) {
  const controller = controllerOf(gameKey);
  if (!controller) return;

  currentGameKey = gameKey;
  roomSession.selectedGame = gameKey;

  const localPlayer = resolveLocalPlayer();
  controller.configureRoomMode({
    roomCode: roomSession.code,
    roomRole: roomSession.role,
    roomPlayer: localPlayer,
    roomPlayerCount: Math.max(1, roomParticipantCount()),
    roomMaxPlayers: MAX_ROOM_PLAYERS,
  });

  showGameScreen(gameKey);

  if (roomSession.role === "host") {
    controller.setRoomLock({
      locked: !roomSession.peerConnected,
      message: roomSession.peerConnected ? "" : tr("gameWaitPeerReconnect"),
    });
    controller.enterStandby?.();
  } else {
    controller.setRoomLock({ locked: true, message: tr("gameWaitHostStart") });
  }
}

function tryStartRoomGameFromMenu(gameKey) {
  if (roomSession.role !== "host" || !roomSession.code) return false;

  roomSession.selectedGame = gameKey;
  postRoomMessage({ type: "select-game", game: gameKey });
  enterRoomGame(gameKey);
  return true;
}

function createGameCallbacks(gameKey) {
  return {
    localPeerId: () => peerId,
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
    onRoomNewGame: () => {
      const controller = controllerOf(gameKey);
      if (!controller) return;
      postRoomMessage({ type: "new-game", game: gameKey });
      scheduleRoomSnapshotBroadcast(gameKey, { force: true });
    },
    onRoomCountdownStart: (seconds) => {
      postRoomMessage({ type: "countdown", game: gameKey, seconds });
    },
    onRoomRemake: () => {
      postRoomMessage({ type: "remake", game: gameKey });
    },
    onRoomModeChange: (payload) => {
      postRoomMessage({ type: "mode", game: gameKey, payload });
    },
    onRoomSnapshot: () => {
      scheduleRoomSnapshotBroadcast(gameKey, { force: false });
    },
    onRoomStatusChange: ({ roomCode, roomRole }) => {
      updateRoomStatus({ roomCode, roomRole });
    },
    onFitPuzzleProgressRequest: () => {
      if (gameKey !== "fitPuzzle") return null;
      return fitPuzzleProgressCache || createDefaultFitPuzzleProgress();
    },
    onFitPuzzleProgressSave: (progress) => {
      if (gameKey !== "fitPuzzle") return;
      updateFitPuzzleProgress(progress);
    },
    onCasinoBankRequest: () => getCasinoBankrollFromSaveData(),
    onCasinoBankSave: (nextBankroll) => {
      saveCasinoBankrollToSaveData(nextBankroll);
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
  bikeRunner: {
    screen: bikeRunnerScreen,
    controller: initBikeRunner(createGameCallbacks("bikeRunner")),
  },
  fitPuzzle: {
    screen: fitPuzzleScreen,
    controller: initFitPuzzle(createGameCallbacks("fitPuzzle")),
  },
  solitaire: {
    screen: solitaireScreen,
    controller: initSolitaire(createGameCallbacks("solitaire")),
  },
  minesweeper: {
    screen: minesweeperScreen,
    controller: initMinesweeper(createGameCallbacks("minesweeper")),
  },
  drawingRelay: {
    screen: drawingRelayScreen,
    controller: initDrawingRelay(createGameCallbacks("drawingRelay")),
  },
  fourPanel: {
    screen: fourPanelScreen,
    controller: initFourPanelCollab(createGameCallbacks("fourPanel")),
  },
  poker: {
    screen: pokerScreen,
    controller: initPoker(createGameCallbacks("poker")),
  },
  blackjack: {
    screen: blackjackScreen,
    controller: initBlackjack(createGameCallbacks("blackjack")),
  },
  chinchiro: {
    screen: chinchiroScreen,
    controller: initChinchiro(createGameCallbacks("chinchiro")),
  },
  sevens: {
    screen: sevensScreen,
    controller: initSevens(createGameCallbacks("sevens")),
  },
  daifugo: {
    screen: daifugoScreen,
    controller: initDaifugo(createGameCallbacks("daifugo")),
  },
  numeron: {
    screen: numeronScreen,
    controller: initNumeron(createGameCallbacks("numeron")),
  },
};

function handleRoomMessage(payload, roomCode) {
  if (payload.type === "room-state" && Array.isArray(payload.participants)) {
    roomSession.hasAuthoritativeRoomState = true;
    const nextParticipants = new Map();
    payload.participants.forEach((entry) => {
      if (!entry || typeof entry.id !== "string") return;
      nextParticipants.set(entry.id, normalizeName(entry.name));
    });
    if (!nextParticipants.has(peerId)) {
      nextParticipants.set(peerId, roomSession.playerName);
    }
    roomSession.participants = nextParticipants;
    refreshRoomPresence();
    if (!lobbyScreen.classList.contains("hidden")) {
      if (roomSession.role === "host") {
        setLobbyMessage(roomSession.peerConnected ? tr("lobbyParticipantConnected") : tr("lobbyWaitPeer"));
      } else {
        setLobbyMessage(roomSession.peerConnected ? tr("lobbyJoinedWaitHost") : tr("lobbyWaitPeer"));
      }
    }
    return;
  }

  if (!payload || payload.from === peerId) return;
  if (payload.to && payload.to !== peerId) return;

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

    postRoomMessage({ type: "presence", name: roomSession.playerName });
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

  if (payload.type === "room-full") {
    if (roomSession.role !== "host") {
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
    clearSnapshotApplyForGame(payload.game);
    roomSession.selectedGame = payload.game;
    enterRoomGame(payload.game);
    return;
  }

  if (payload.type === "new-game" && payload.game) {
    clearSnapshotApplyForGame(payload.game);
    const controller = controllerOf(payload.game);
    if (!controller) return;
    controller.setRoomLock({ locked: false, message: "" });
    controller.startNewGame({ fromRemote: true });
    return;
  }

  if (payload.type === "countdown" && payload.game) {
    clearSnapshotApplyForGame(payload.game);
    const controller = controllerOf(payload.game);
    if (!controller) return;
    controller.applyRoomCountdown?.(payload.seconds);
    return;
  }

  if (payload.type === "remake" && payload.game) {
    clearSnapshotApplyForGame(payload.game);
    const controller = controllerOf(payload.game);
    if (!controller) return;
    controller.applyRoomRemake?.();
    return;
  }

  if (payload.type === "mode" && payload.game && payload.payload) {
    clearSnapshotApplyForGame(payload.game);
    const controller = controllerOf(payload.game);
    if (!controller) return;
    controller.applyRoomMode?.(payload.payload);
    return;
  }

  if (payload.type === "snapshot" && payload.game && payload.snapshot) {
    if (shouldIgnoreStaleSnapshot(payload)) return;
    applyRoomSnapshotCoalesced(payload.game, payload.snapshot);
    return;
  }

  if (payload.type === "move" && payload.game && payload.move) {
    const controller = controllerOf(payload.game);
    if (!controller) return;
    controller.applyRemoteMove({ ...payload.move, remoteId: payload.from });
    return;
  }

  if (payload.type === "cursor" && payload.game && payload.payload) {
    const controller = controllerOf(payload.game);
    if (!controller) return;
    controller.applyRoomCursor?.(payload.payload);
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

  roomSession.code = roomCode;
  roomSession.role = role === "auto" ? "host" : role;
  roomSession.autoRoleJoin = role === "auto";
  roomSession.hasAuthoritativeRoomState = false;
  roomSession.transport = null;
  roomSession.transportKind = "none";
  roomSession.peerConnected = false;
  roomSession.selectedGame = null;
  roomSession.playerName = playerName;
  roomSession.peerName = null;
  roomSession.participants = new Map([[peerId, playerName]]);

  refreshRoomPresence();
  const showLobby = options.showLobby !== false;
  if (showLobby) {
    showLobbyScreen();

    if (role === "host") {
      setLobbyMessage(tr("lobbyWaitPeer"));
    } else if (roomSession.autoRoleJoin) {
      setLobbyMessage(tr("lobbyWaitPeer"));
    } else {
      setLobbyMessage(tr("lobbyJoinedWaitHost"));
    }
  } else {
    showMenuScreen();
  }

  const transport = await createRoomTransport({
    roomCode,
    peerId,
    serverUrl: roomServerUrl,
    onMessage: (payload) => handleRoomMessage(payload, roomCode),
  });

  if (roomSession.code !== roomCode) {
    transport.close();
    return;
  }

  roomSession.transport = transport;
  roomSession.transportKind = transport.kind;

  postRoomMessage({ type: "hello", name: roomSession.playerName });

  setMenuMessage(tr("menuRoomConnected", { code: roomCode }));
}

playOthelloBtn?.addEventListener("click", () => {
  if (tryStartRoomGameFromMenu("othello")) return;
  closeRoom();
  configureAllStandardModes();
  currentGameKey = "othello";
  showGameScreen("othello");
  controllerOf("othello")?.enterStandby?.();
});

playShogiBtn?.addEventListener("click", () => {
  if (tryStartRoomGameFromMenu("shogi")) return;
  closeRoom();
  configureAllStandardModes();
  currentGameKey = "shogi";
  showGameScreen("shogi");
  controllerOf("shogi")?.enterStandby?.();
});

playChessBtn?.addEventListener("click", () => {
  if (tryStartRoomGameFromMenu("chess")) return;
  closeRoom();
  configureAllStandardModes();
  currentGameKey = "chess";
  showGameScreen("chess");
  controllerOf("chess")?.enterStandby?.();
});

playUnoBtn?.addEventListener("click", () => {
  if (tryStartRoomGameFromMenu("uno")) return;
  closeRoom();
  configureAllStandardModes();
  currentGameKey = "uno";
  showGameScreen("uno");
  controllerOf("uno")?.enterStandby?.();
});

playGomokuBtn?.addEventListener("click", () => {
  if (tryStartRoomGameFromMenu("gomoku")) return;
  closeRoom();
  configureAllStandardModes();
  currentGameKey = "gomoku";
  showGameScreen("gomoku");
  controllerOf("gomoku")?.enterStandby?.();
});

playSurvivorsBtn?.addEventListener("click", () => {
  if (tryStartRoomGameFromMenu("survivors")) return;
  closeRoom();
  configureAllStandardModes();
  currentGameKey = "survivors";
  showGameScreen("survivors");
  controllerOf("survivors")?.enterStandby?.();
});

playBikeRunnerBtn?.addEventListener("click", () => {
  if (tryStartRoomGameFromMenu("bikeRunner")) return;
  closeRoom();
  configureAllStandardModes();
  currentGameKey = "bikeRunner";
  showGameScreen("bikeRunner");
  controllerOf("bikeRunner")?.enterStandby?.();
});

playFitPuzzleBtn?.addEventListener("click", () => {
  closeRoom();
  configureAllStandardModes();
  currentGameKey = "fitPuzzle";
  showGameScreen("fitPuzzle");
  const fitController = controllerOf("fitPuzzle");
  fitController?.applyProgress?.(fitPuzzleProgressCache || createDefaultFitPuzzleProgress());
  fitController?.enterStandby?.();
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
  if (tryStartRoomGameFromMenu("solitaire")) return;
  const playerName = normalizeName(playerNameInput?.value);
  if (playerNameInput) playerNameInput.value = playerName;

  const code = generateRoomCode();
  roomCodeInput.value = code;
  void attachRoom(code, "host", playerName);
  setLobbyMessage(tr("lobbyWaitPeer"));
});

playMinesweeperBtn?.addEventListener("click", () => {
  closeRoom();
  configureAllStandardModes();
  currentGameKey = "minesweeper";
  showGameScreen("minesweeper");
  controllerOf("minesweeper")?.enterStandby?.();
});

playMinesweeperMultiBtn?.addEventListener("click", () => {
  if (tryStartRoomGameFromMenu("minesweeper")) return;
  const playerName = normalizeName(playerNameInput?.value);
  if (playerNameInput) playerNameInput.value = playerName;

  const code = generateRoomCode();
  roomCodeInput.value = code;
  void attachRoom(code, "host", playerName);
  setLobbyMessage(tr("lobbyWaitPeer"));
});

playDrawingModeBtn?.addEventListener("click", () => {
  const mode = drawingModeSelect instanceof HTMLSelectElement ? drawingModeSelect.value : "relay";
  const targetGameKey = mode === "four-panel" ? "fourPanel" : "drawingRelay";
  if (tryStartRoomGameFromMenu(targetGameKey)) return;
  closeRoom();
  configureAllStandardModes();
  currentGameKey = targetGameKey;
  showGameScreen(targetGameKey);
  controllerOf(targetGameKey)?.enterStandby?.();
});

playPokerBtn?.addEventListener("click", () => {
  if (tryStartRoomGameFromMenu("poker")) return;
  closeRoom();
  configureAllStandardModes();
  currentGameKey = "poker";
  showGameScreen("poker");
  controllerOf("poker")?.enterStandby?.();
});

playBlackjackBtn?.addEventListener("click", () => {
  if (tryStartRoomGameFromMenu("blackjack")) return;
  closeRoom();
  configureAllStandardModes();
  currentGameKey = "blackjack";
  showGameScreen("blackjack");
  controllerOf("blackjack")?.enterStandby?.();
});

playChinchiroBtn?.addEventListener("click", () => {
  if (tryStartRoomGameFromMenu("chinchiro")) return;
  closeRoom();
  configureAllStandardModes();
  currentGameKey = "chinchiro";
  showGameScreen("chinchiro");
  controllerOf("chinchiro")?.enterStandby?.();
});

playSevensBtn?.addEventListener("click", () => {
  if (tryStartRoomGameFromMenu("sevens")) return;
  closeRoom();
  configureAllStandardModes();
  currentGameKey = "sevens";
  showGameScreen("sevens");
  controllerOf("sevens")?.enterStandby?.();
});

playDaifugoBtn?.addEventListener("click", () => {
  if (tryStartRoomGameFromMenu("daifugo")) return;
  closeRoom();
  configureAllStandardModes();
  currentGameKey = "daifugo";
  showGameScreen("daifugo");
  controllerOf("daifugo")?.enterStandby?.();
});

playNumeronBtn?.addEventListener("click", () => {
  if (tryStartRoomGameFromMenu("numeron")) return;
  closeRoom();
  configureAllStandardModes();
  currentGameKey = "numeron";
  showGameScreen("numeron");
  controllerOf("numeron")?.enterStandby?.();
});

openCardGamesBtn?.addEventListener("click", () => {
  showCardGamesMenuScreen();
});

openCasinoBtn?.addEventListener("click", () => {
  showCasinoMenuScreen();
});

openCardGamesCard?.addEventListener("click", (event) => {
  if (event.target instanceof Element && event.target.closest("button")) return;
  showCardGamesMenuScreen();
});

openCardGamesCard?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  showCardGamesMenuScreen();
});

openCasinoCard?.addEventListener("click", (event) => {
  if (event.target instanceof Element && event.target.closest("button")) return;
  showCasinoMenuScreen();
});

openCasinoCard?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  showCasinoMenuScreen();
});

cardGamesBackBtn?.addEventListener("click", () => {
  showMenuScreen();
});

casinoBackBtn?.addEventListener("click", () => {
  showMenuScreen();
});

grantNotificationBtn?.addEventListener("click", async () => {
  if (!("Notification" in window)) {
    setPermissionMessage(tr("permissionUnsupported"));
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    setPermissionMessage(permission === "granted" ? tr("permissionNotificationGranted") : tr("permissionNotificationDenied"));
  } catch {
    setPermissionMessage(tr("permissionNotificationDenied"));
  }
});

grantClipboardBtn?.addEventListener("click", async () => {
  if (!navigator.clipboard) {
    setPermissionMessage(tr("permissionUnsupported"));
    return;
  }

  try {
    await navigator.clipboard.writeText("Neon Arcade Permission Check");
    setPermissionMessage(tr("permissionClipboardGranted"));
  } catch {
    setPermissionMessage(tr("permissionClipboardDenied"));
  }
});

openInquiryAdminBtn?.addEventListener("click", async () => {
  if (!activeCloudAuth?.userId || !activeCloudAuth?.password) {
    setInquiryAdminStatus(tr("inquiryAdminNeedLogin"));
    return;
  }

  openInquiryAdminBtn.disabled = true;
  setInquiryAdminStatus(tr("inquiryAdminLoading"));
  try {
    const items = await loadInquiryList(50);
    renderInquiryAdminList(items || []);
    setInquiryAdminStatus(tr("inquiryAdminLoaded", { count: (items || []).length }));
  } catch {
    setInquiryAdminStatus(tr("inquiryAdminLoadFailed"));
  } finally {
    openInquiryAdminBtn.disabled = false;
  }
});

sendInquiryBtn?.addEventListener("click", async () => {
  const senderName = String(inquiryNameInput?.value || "").trim();
  const message = String(inquiryMessageInput?.value || "").trim();

  if (!message) {
    setInquiryStatus(tr("inquiryValidation"));
    return;
  }

  if (sendInquiryBtn) sendInquiryBtn.disabled = true;
  setInquiryStatus(tr("inquirySending"));

  try {
    const ok = await submitInquiry({
      name: senderName,
      message,
      url: window.location.href,
      lang: currentLang,
    });

    if (!ok) {
      setInquiryStatus(tr("inquirySubmitFailed"));
      return;
    }

    if (inquiryMessageInput) inquiryMessageInput.value = "";
    setInquiryStatus(tr("inquirySubmitted"));
  } catch {
    setInquiryStatus(tr("inquirySubmitFailed"));
  } finally {
    if (sendInquiryBtn) sendInquiryBtn.disabled = false;
  }
});

createRoomBtn?.addEventListener("click", () => {
  const playerName = normalizeName(playerNameInput?.value);
  if (playerNameInput) playerNameInput.value = playerName;

  const code = generateRoomCode();
  roomCodeInput.value = code;
  void attachRoom(code, "host", playerName, { showLobby: false });
});

joinRoomBtn?.addEventListener("click", () => {
  const playerName = normalizeName(playerNameInput?.value);
  if (playerNameInput) playerNameInput.value = playerName;

  const code = normalizeRoomCode(roomCodeInput.value);
  if (code.length !== 6) {
    setMenuMessage(tr("roomCodeInvalid"));
    return;
  }

  void attachRoom(code, "auto", playerName);
  setMenuMessage(tr("menuRoomJoined", { code }));
});

lobbyBackBtn?.addEventListener("click", () => {
  closeRoom();
  configureAllStandardModes();
  showMenuScreen();
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
  activeCloudAuth = { userId, password };
  activeCloudProfile = check.profile && typeof check.profile === "object" ? { ...check.profile } : {};
  controllerOf("survivors")?.setCloudAuth?.(activeCloudAuth, activeCloudProfile);
  updatePermissionCardVisibility();
  syncGameDataScope({ userId, cloudProfile: activeCloudProfile });
  syncFitPuzzleProgressScope({ userId, cloudProfile: activeCloudProfile });
  fitPuzzleProgressDirty = false;
  controllerOf("fitPuzzle")?.applyProgress?.(fitPuzzleProgressCache || createDefaultFitPuzzleProgress());
  scheduleGameDataCloudSync();
  syncStartedGamesScope();
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
  activeCloudAuth = null;
  activeCloudProfile = null;
  controllerOf("survivors")?.setCloudAuth?.(null, null);
  updatePermissionCardVisibility();
  gameDataDirty = false;
  fitPuzzleProgressDirty = false;
  syncGameDataScope({ userId: "" });
  syncFitPuzzleProgressScope({ userId: "" });
  syncStartedGamesScope();
  controllerOf("fitPuzzle")?.applyProgress?.(fitPuzzleProgressCache || createDefaultFitPuzzleProgress());
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
  activeCloudAuth = { userId, password };
  activeCloudProfile = check.profile && typeof check.profile === "object" ? { ...check.profile } : {};
  controllerOf("survivors")?.setCloudAuth?.(activeCloudAuth, activeCloudProfile);
  updatePermissionCardVisibility();
  syncGameDataScope({ userId, cloudProfile: activeCloudProfile });
  syncFitPuzzleProgressScope({ userId, cloudProfile: activeCloudProfile });
  fitPuzzleProgressDirty = false;
  controllerOf("fitPuzzle")?.applyProgress?.(fitPuzzleProgressCache || createDefaultFitPuzzleProgress());
  scheduleGameDataCloudSync();
  syncStartedGamesScope();
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

const storedLang = localStorage.getItem(STORAGE_LANG_KEY) || "ja";
const initialLang = messages[storedLang] ? storedLang : "ja";
if (langSelect) langSelect.value = initialLang;
setLanguage(initialLang);

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

const initialAuth = getCloudAuthFromStorage();
if (initialAuth) {
  activeCloudAuth = { ...initialAuth };
  controllerOf("survivors")?.setCloudAuth?.(activeCloudAuth, null);
  updatePermissionCardVisibility();
  syncGameDataScope({ userId: initialAuth.userId });
  syncFitPuzzleProgressScope({ userId: initialAuth.userId });
  syncStartedGamesScope();
} else {
  controllerOf("survivors")?.setCloudAuth?.(null, null);
  updatePermissionCardVisibility();
  syncGameDataScope({ userId: "" });
  syncFitPuzzleProgressScope({ userId: "" });
  syncStartedGamesScope();
}

controllerOf("fitPuzzle")?.applyProgress?.(fitPuzzleProgressCache || createDefaultFitPuzzleProgress());

setPlayerName(localStorage.getItem(STORAGE_PLAYER_NAME_KEY) || "Player");
setEntryActionButtonsVisible(true);

updateLobbyView();
showEntryScreen();
