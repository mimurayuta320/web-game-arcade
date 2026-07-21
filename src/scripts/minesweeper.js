const DIFFICULTY_PRESETS = {
  easy: { rows: 9, cols: 9, mines: 10 },
  normal: { rows: 12, cols: 12, mines: 24 },
  hard: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 20, cols: 20, mines: 80 },
};

const BOARD_SIZE_PRESETS = {
  small: { rows: 9, cols: 9 },
  normal: { rows: 12, cols: 12 },
  large: { rows: 16, cols: 16 },
  xlarge: { rows: 20, cols: 20 },
};

const MIN_BOARD_SIZE = 10;
const MAX_BOARD_SIZE = 100;
const BOARD_SIZE_STEP = 10;

const DIFFICULTY_DENSITY = {
  easy: 10 / (9 * 9),
  normal: 24 / (12 * 12),
  hard: 40 / (16 * 16),
  expert: 80 / (20 * 20),
};

const ENEMY_BOARD_REVEAL_INTERVAL_MS = 10000;
const ENEMY_BOARD_REVEAL_DURATION_MS = 2000;

const TEXT = {
  ja: {
    modeLabel: "モード",
    modeSolo: "シングル",
    modeDuel: "タイム対戦 (同一盤面)",
    modeBattle: "ターン対戦 (同一盤面)",
    modeCoop: "協力プレイ (最大8人)",
    playerCountLabel: "人数",
    livesLabel: "ミス回数",
    coopLifeLeftLabel: "ミス",
    turnLabel: "手番",
    scoreLabel: "タイム",
    player1: "P1",
    player2: "P2",
    turnText: "{player} の手番",
    duelResult: "対戦終了: {winner} の勝ち",
    duelDraw: "対戦終了: 引き分け",
    duelMissWait: "{player} がミス。{seconds}秒待機します",
    duelRoundStart: "{player} の挑戦開始",
    duelRoundNext: "{player} の挑戦へ",
    duelPenaltyApplied: "{player} ミス。+{seconds}秒ペナルティ",
    duelWaitingOpponent: "クリア！ 相手の完了待ちです",
    duelOpponentFinished: "相手が先にクリア。続行するかMENUで終了できます",
    duelWinYou: "対戦終了: あなたの勝ち",
    duelWinOpponent: "対戦終了: 相手の勝ち",
    battleTurn: "{player} の手番",
    battleMiss: "{player} ミス。ミス回数: {count}",
    battleOut: "{player} は脱落しました",
    battleWinSurvival: "対戦終了: {winner} の勝ち（生存）",
    battleWinScore: "対戦終了: {winner} の勝ち（スコア）",
    battleDraw: "対戦終了: 引き分け",
    coopClear: "協力クリア！ タイム {time}",
    coopFailed: "協力失敗。地雷を踏みました",
    coopLifeLost: "{player} ミス！ ミス回数: {count}",
    difficultyLabel: "難易度",
    boardSizeLabel: "マス",
    difficultyEasy: "かんたん",
    difficultyNormal: "ふつう",
    difficultyHard: "むずかしい",
    difficultyExpert: "エキスパート",
    expertRescue: "エキスパート補助: 安全マスを1つ開きました",
    boardSizeSmall: "9x9",
    boardSizeNormal: "12x12",
    boardSizeLarge: "16x16",
    boardSizeXLarge: "20x20",
    enemyBoard: "相手盤面",
    boardOverview: "全体マップ",
    enemyBoardNextIn: "次回表示まで {seconds}秒",
    enemyBoardShowing: "表示中 ({seconds})",
    missCountdown: "ミス！再開まで {seconds}",
    countdownStart: "開始まで {seconds}",
    standby: "GAME STARTを押してください",
    playHint: "左クリックで開く / 右クリックで旗",
    antiStuck: "運ゲー回避: 確定情報として安全マスを1つ開きました",
    guessGuard: "推測保護: 地雷を安全マスへ変換しました",
    gameOver: "ゲームオーバー。地雷を踏みました。",
    clear: "クリア。すべての安全マスを開きました。",
    remakeConfirm: "リメイクします。よろしいですか？",
    menuConfirm: "ゲーム一覧に戻りますか？",
  },
  ko: {
    modeLabel: "모드",
    modeSolo: "싱글",
    modeDuel: "타임 대전 (동일 보드)",
    modeBattle: "턴 대전 (동일 보드)",
    modeCoop: "협력 플레이 (최대 8명)",
    playerCountLabel: "인원",
    livesLabel: "실수 횟수",
    coopLifeLeftLabel: "실수",
    turnLabel: "턴",
    scoreLabel: "타임",
    player1: "P1",
    player2: "P2",
    turnText: "{player} 턴",
    duelResult: "대전 종료: {winner} 승리",
    duelDraw: "대전 종료: 무승부",
    duelMissWait: "{player} 실수. {seconds}초 대기",
    duelRoundStart: "{player} 도전 시작",
    duelRoundNext: "{player} 도전으로 전환",
    duelPenaltyApplied: "{player} 실수. +{seconds}초 패널티",
    duelWaitingOpponent: "클리어! 상대 완료를 기다리는 중",
    duelOpponentFinished: "상대가 먼저 클리어했습니다. 계속하거나 MENU로 종료할 수 있습니다",
    duelWinYou: "대전 종료: 당신의 승리",
    duelWinOpponent: "대전 종료: 상대 승리",
    battleTurn: "{player} 턴",
    battleMiss: "{player} 실수. 실수 횟수: {count}",
    battleOut: "{player} 탈락",
    battleWinSurvival: "대전 종료: {winner} 승리 (생존)",
    battleWinScore: "대전 종료: {winner} 승리 (점수)",
    battleDraw: "대전 종료: 무승부",
    coopClear: "협력 클리어! 타임 {time}",
    coopFailed: "협력 실패. 지뢰를 밟았습니다",
    coopLifeLost: "{player} 실수! 실수 횟수: {count}",
    difficultyLabel: "난이도",
    boardSizeLabel: "칸",
    difficultyEasy: "쉬움",
    difficultyNormal: "보통",
    difficultyHard: "어려움",
    difficultyExpert: "전문가",
    expertRescue: "전문가 보조: 안전 칸 1개를 열었습니다",
    boardSizeSmall: "9x9",
    boardSizeNormal: "12x12",
    boardSizeLarge: "16x16",
    boardSizeXLarge: "20x20",
    enemyBoard: "상대 보드",
    boardOverview: "전체 맵",
    enemyBoardNextIn: "다음 표시까지 {seconds}초",
    enemyBoardShowing: "표시 중 ({seconds})",
    missCountdown: "실수! 재개까지 {seconds}",
    countdownStart: "시작까지 {seconds}",
    standby: "GAME START를 눌러주세요",
    playHint: "좌클릭: 열기 / 우클릭: 깃발",
    antiStuck: "운빨 회피: 확정 정보로 안전 칸 1개를 열었습니다",
    guessGuard: "추측 보호: 지뢰를 안전 칸으로 변경했습니다",
    gameOver: "게임 오버. 지뢰를 밟았습니다.",
    clear: "클리어. 모든 안전 칸을 열었습니다.",
    remakeConfirm: "리메이크할까요?",
    menuConfirm: "게임 목록으로 돌아갈까요?",
  },
};

const NEIGHBOR_OFFSETS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

function createCell() {
  return {
    mine: false,
    revealed: false,
    flagged: false,
    miss: false,
    adjacent: 0,
  };
}

function createGrid(rows, cols) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => createCell()));
}

function inBounds(row, col, rows, cols) {
  return row >= 0 && row < rows && col >= 0 && col < cols;
}

function clampMines(mines, rows, cols) {
  const maxMines = Math.max(1, rows * cols - 1);
  const normalized = Math.floor(Number(mines) || 0);
  return Math.max(1, Math.min(maxMines, normalized));
}

function formatTime(sec) {
  const safe = Math.max(0, Math.floor(sec));
  const m = String(Math.floor(safe / 60)).padStart(2, "0");
  const s = String(safe % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function minesweeperLang() {
  const langSelectEl = document.getElementById("langSelect");
  return langSelectEl?.value === "ko" ? "ko" : "ja";
}

function minesweeperText(key) {
  const lang = minesweeperLang();
  return TEXT[lang]?.[key] || TEXT.ja[key] || key;
}

function minesweeperFormat(key, vars = {}) {
  let text = minesweeperText(key);
  Object.entries(vars).forEach(([name, value]) => {
    text = text.replaceAll(`{${name}}`, String(value));
  });
  return text;
}

export function initMinesweeper(options = {}) {
  const boardEl = document.getElementById("minesweeperBoard");
  const boardViewportEl = document.getElementById("minesweeperBoardViewport");
  const playLayoutEl = document.getElementById("minesweeperPlayLayout");
  const enemyPanelEl = document.getElementById("minesweeperEnemyPanel");
  const enemyLabelEl = document.getElementById("minesweeperEnemyLabel");
  const enemyCountdownEl = document.getElementById("minesweeperEnemyCountdown");
  const enemyBoardEl = document.getElementById("minesweeperEnemyBoard");
  const overviewPanelEl = document.getElementById("minesweeperOverviewPanel");
  const overviewLabelEl = document.getElementById("minesweeperOverviewLabel");
  const overviewCanvasEl = document.getElementById("minesweeperOverviewCanvas");
  const sideTimeEl = document.getElementById("minesweeperSideTime");
  const sideLifeEl = document.getElementById("minesweeperSideLife");
  const startOverlayEl = document.getElementById("minesweeperStartOverlay");
  const messageEl = document.getElementById("minesweeperMessage");
  const mineCountEl = document.getElementById("minesweeperMineCount");
  const flagCountEl = document.getElementById("minesweeperFlagCount");
  const timerEl = document.getElementById("minesweeperTimer");
  const modeLabelEl = document.getElementById("minesweeperModeLabel");
  const modeSelectEl = document.getElementById("minesweeperModeSelect");
  const playerCountLabelEl = document.getElementById("minesweeperPlayerCountLabel");
  const playerCountSelectEl = document.getElementById("minesweeperPlayerCountSelect");
  const coopLivesLabelEl = document.getElementById("minesweeperCoopLivesLabel");
  const coopLivesSelectEl = document.getElementById("minesweeperCoopLivesSelect");
  const coopLifeLeftLabelEl = document.getElementById("minesweeperCoopLifeLeftLabel");
  const coopLifeLeftTextEl = document.getElementById("minesweeperCoopLifeLeftText");
  const turnLabelEl = document.getElementById("minesweeperTurnLabel");
  const turnTextEl = document.getElementById("minesweeperTurnText");
  const scoreLabelEl = document.getElementById("minesweeperScoreLabel");
  const scoreTextEl = document.getElementById("minesweeperScoreText");
  const difficultyLabelEl = document.getElementById("minesweeperDifficultyLabel");
  const difficultySelectEl = document.getElementById("minesweeperDifficultySelect");
  const boardSizeLabelEl = document.getElementById("minesweeperBoardSizeLabel");
  const boardSizeSelectEl = document.getElementById("minesweeperBoardSizeSelect");
  const startBtn = document.getElementById("minesweeperStartBtn");
  const remakeBtn = document.getElementById("minesweeperRemakeBtn");
  const menuBtn = document.getElementById("minesweeperMenuBtn");
  const langSelectEl = document.getElementById("langSelect");

  const state = {
    rows: DIFFICULTY_PRESETS.normal.rows,
    cols: DIFFICULTY_PRESETS.normal.cols,
    mines: DIFFICULTY_PRESETS.normal.mines,
    difficulty: "normal",
    boardSize: 12,
    board: createGrid(DIFFICULTY_PRESETS.normal.rows, DIFFICULTY_PRESETS.normal.cols),
    started: false,
    gameOver: true,
    revealedCount: 0,
    flagsPlaced: 0,
    timerSec: 0,
    timerId: null,
    duelPenaltyTimerId: null,
    duelPenaltyRemainingSec: 0,
    startCountdownTimerId: null,
    startCountdownSec: 0,
    turnLocked: false,
    playMode: "solo",
    playerCount: 2,
    battleMisses: [0, 0],
    coopMisses: [0, 0],
    coopClearTimeSec: null,
    currentPlayer: 0,
    scores: [0, 0],
    firstSafeUsed: [false, false],
    duelTemplate: null,
    duelTemplateShared: false,
    duelStartCell: null,
    duelRoundIndex: 0,
    duelTimes: [],
    gameMode: "local",
    roomCode: null,
    roomRole: null,
    roomLocked: false,
    roomLockMessage: "",
    opponentSnapshot: null,
    opponentDuelTime: null,
    opponentCursor: null,
    opponentCursorTimerId: null,
    enemyRevealEnabled: false,
    enemyRevealVisible: false,
    enemyRevealIntervalId: null,
    enemyRevealHideTimerId: null,
    enemyRevealTickerId: null,
    enemyRevealNextAtMs: 0,
    enemyRevealHideAtMs: 0,
    pendingRemotePlayerIndex: null,
  };

  function isDuelMode() {
    return state.playMode === "duel";
  }

  function isRoomMode() {
    return state.gameMode === "room";
  }

  function isCoopMode() {
    return state.playMode === "coop";
  }

  function isBattleMode() {
    return state.playMode === "battle";
  }

  function isTurnMode() {
    return isDuelMode() || isCoopMode() || isBattleMode();
  }

  function playerLabel(index) {
    return `P${index + 1}`;
  }

  function roomDuelLocalPlayerIndex() {
    if (!isRoomMode() || !isDuelMode()) return 0;
    return state.roomRole === "guest" ? 1 : 0;
  }

  function roomDuelRemotePlayerIndex() {
    if (!isRoomMode() || !isDuelMode()) return 1;
    return state.roomRole === "guest" ? 0 : 1;
  }

  function roomCoopRemotePlayerIndex() {
    if (!isRoomMode() || !isCoopMode()) return 1;
    const remote = state.roomRole === "guest" ? 0 : 1;
    return Math.max(0, Math.min(state.playerCount - 1, remote));
  }

  function currentTurnText() {
    if (!isTurnMode()) return "-";
    if (isBattleMode()) {
      return minesweeperFormat("battleTurn", { player: playerLabel(state.currentPlayer) });
    }
    return minesweeperFormat("turnText", { player: playerLabel(state.currentPlayer) });
  }

  function scoreText() {
    if (isDuelMode()) {
      if (!state.duelTimes.length) {
        return Array.from({ length: state.playerCount }, (_, idx) => `${playerLabel(idx)} --:--`).join(" / ");
      }
      return state.duelTimes.map((time, idx) => `${playerLabel(idx)} ${time == null ? "--:--" : formatTime(time)}`).join(" / ");
    }
    if (isCoopMode()) {
      return state.coopClearTimeSec == null ? "--:--" : formatTime(state.coopClearTimeSec);
    }
    if (isBattleMode()) {
      return state.scores
        .map((score, idx) => `${playerLabel(idx)} ${score} (M${Math.max(0, state.battleMisses[idx] ?? 0)})`)
        .join(" / ");
    }
    return state.scores.map((score, idx) => `${playerLabel(idx)} ${score}`).join(" / ");
  }

  function switchTurn() {
    if (!isTurnMode() || state.gameOver) return;
    state.currentPlayer = (state.currentPlayer + 1) % state.playerCount;
  }

  function maxPlayersForMode(mode = state.playMode) {
    return mode === "coop" ? 8 : 4;
  }

  function normalizePlayerCount(rawCount, mode = state.playMode) {
    const parsed = Number.parseInt(String(rawCount), 10);
    const safe = Number.isFinite(parsed) ? parsed : 2;
    return Math.max(2, Math.min(maxPlayersForMode(mode), safe));
  }

  function normalizeMissArray(rawMisses, targetCount = state.playerCount) {
    const source = Array.isArray(rawMisses) ? rawMisses : [rawMisses];
    const out = source.slice(0, targetCount).map((count) => Math.max(0, Number(count) || 0));
    while (out.length < targetCount) {
      out.push(0);
    }
    return out;
  }

  function coopMissText() {
    if (!isCoopMode()) return "-";
    return state.coopMisses
      .map((count, idx) => `${playerLabel(idx)}:M${Math.max(0, Number(count) || 0)}`)
      .join(" / ");
  }

  function finalizeBattleByScore() {
    const best = Math.max(...state.scores);
    const winners = state.scores
      .map((score, idx) => ({ score, idx }))
      .filter((entry) => entry.score === best)
      .map((entry) => playerLabel(entry.idx));
    if (winners.length > 1) {
      messageEl.textContent = minesweeperText("battleDraw");
      return;
    }
    messageEl.textContent = minesweeperFormat("battleWinScore", { winner: winners[0] || playerLabel(0) });
  }

  function isInputLocked() {
    return (state.turnLocked || state.roomLocked) && !state.gameOver;
  }

  function cloneBoardData() {
    return state.board.map((line) =>
      line.map((cell) => ({
        mine: Boolean(cell.mine),
        revealed: Boolean(cell.revealed),
        flagged: Boolean(cell.flagged),
        miss: Boolean(cell.miss),
        adjacent: Number(cell.adjacent) || 0,
      })),
    );
  }

  function applyBoardData(board) {
    if (!Array.isArray(board) || board.length !== state.rows) {
      state.board = createGrid(state.rows, state.cols);
      return;
    }

    state.board = board.map((line) => {
      if (!Array.isArray(line) || line.length !== state.cols) {
        return Array.from({ length: state.cols }, () => createCell());
      }
      return line.map((raw) => ({
        mine: Boolean(raw?.mine),
        revealed: Boolean(raw?.revealed),
        flagged: Boolean(raw?.flagged),
        miss: Boolean(raw?.miss),
        adjacent: Number(raw?.adjacent) || 0,
      }));
    });
  }

  function emitRoomSnapshot({ force = false } = {}) {
    if (!isRoomMode()) return;
    options.onRoomSnapshot?.();
  }

  function shouldShowEnemyBoard() {
    return isRoomMode() && isDuelMode() && state.enemyRevealEnabled && !state.gameOver;
  }

  function clearEnemyRevealCycle() {
    if (state.enemyRevealIntervalId) {
      window.clearInterval(state.enemyRevealIntervalId);
      state.enemyRevealIntervalId = null;
    }
    if (state.enemyRevealHideTimerId) {
      window.clearTimeout(state.enemyRevealHideTimerId);
      state.enemyRevealHideTimerId = null;
    }
    if (state.enemyRevealTickerId) {
      window.clearInterval(state.enemyRevealTickerId);
      state.enemyRevealTickerId = null;
    }
    state.enemyRevealVisible = false;
    state.enemyRevealNextAtMs = 0;
    state.enemyRevealHideAtMs = 0;
  }

  function clearOpponentCursor() {
    if (state.opponentCursorTimerId) {
      window.clearTimeout(state.opponentCursorTimerId);
      state.opponentCursorTimerId = null;
    }
    state.opponentCursor = null;
  }

  function sendLocalCursor(row, col) {
    if (!isRoomMode() || !isDuelMode() || state.gameOver) return;
    options.onRoomCursor?.({ row, col });
  }

  function applyOpponentCursor(payload = {}) {
    const row = Number(payload.row);
    const col = Number(payload.col);
    if (!Number.isFinite(row) || !Number.isFinite(col)) {
      clearOpponentCursor();
      renderEnemyBoard();
      return;
    }

    state.opponentCursor = { row: Math.floor(row), col: Math.floor(col) };
    if (state.opponentCursorTimerId) {
      window.clearTimeout(state.opponentCursorTimerId);
    }
    state.opponentCursorTimerId = window.setTimeout(() => {
      state.opponentCursorTimerId = null;
      state.opponentCursor = null;
      renderEnemyBoard();
    }, 800);
    renderEnemyBoard();
  }

  function startEnemyRevealWindow() {
    if (!shouldShowEnemyBoard()) return;
    if (state.enemyRevealHideTimerId) {
      window.clearTimeout(state.enemyRevealHideTimerId);
      state.enemyRevealHideTimerId = null;
    }

    state.enemyRevealVisible = true;
    const now = Date.now();
    state.enemyRevealHideAtMs = now + ENEMY_BOARD_REVEAL_DURATION_MS;
    state.enemyRevealNextAtMs = now + ENEMY_BOARD_REVEAL_INTERVAL_MS;
    renderEnemyBoard();

    state.enemyRevealHideTimerId = window.setTimeout(() => {
      state.enemyRevealHideTimerId = null;
      state.enemyRevealVisible = false;
      state.enemyRevealHideAtMs = 0;
      renderEnemyBoard();
    }, ENEMY_BOARD_REVEAL_DURATION_MS);
  }

  function ensureEnemyRevealCycle() {
    if (!shouldShowEnemyBoard()) {
      clearEnemyRevealCycle();
      return;
    }
    if (state.enemyRevealIntervalId) return;

    state.enemyRevealNextAtMs = Date.now() + ENEMY_BOARD_REVEAL_INTERVAL_MS;

    state.enemyRevealIntervalId = window.setInterval(() => {
      if (!shouldShowEnemyBoard()) {
        clearEnemyRevealCycle();
        renderEnemyBoard();
        return;
      }
      startEnemyRevealWindow();
    }, ENEMY_BOARD_REVEAL_INTERVAL_MS);

    state.enemyRevealTickerId = window.setInterval(() => {
      if (!shouldShowEnemyBoard()) {
        clearEnemyRevealCycle();
        renderEnemyBoard();
        return;
      }
      renderEnemyBoard();
    }, 1000);
  }

  function applyOpponentSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      state.opponentSnapshot = null;
      return;
    }
    state.opponentSnapshot = {
      rows: Math.max(1, Number(snapshot.rows) || 1),
      cols: Math.max(1, Number(snapshot.cols) || 1),
      board: Array.isArray(snapshot.board) ? snapshot.board : [],
    };

    const remoteIndex = roomDuelRemotePlayerIndex();
    const remoteTime = Number(snapshot?.duelTimes?.[remoteIndex]);
    state.opponentDuelTime = Number.isFinite(remoteTime) ? remoteTime : null;
    if (Number.isFinite(remoteTime)) {
      state.duelTimes[remoteIndex] = remoteTime;
    }
  }

  function finalizeRoomDuelResultIfReady() {
    const ownIndex = roomDuelLocalPlayerIndex();
    const ownTime = Number(state.duelTimes[ownIndex]);
    const opponentTime = Number(state.opponentDuelTime);
    const ownFinished = Number.isFinite(ownTime);
    const opponentFinished = Number.isFinite(opponentTime);

    if (opponentFinished && !ownFinished) {
      messageEl.textContent = minesweeperText("duelOpponentFinished");
      return false;
    }

    if (!ownFinished || !opponentFinished) {
      messageEl.textContent = minesweeperText("duelWaitingOpponent");
      return false;
    }

    if (ownTime === opponentTime) {
      messageEl.textContent = minesweeperText("duelDraw");
    } else if (ownTime < opponentTime) {
      messageEl.textContent = minesweeperText("duelWinYou");
    } else {
      messageEl.textContent = minesweeperText("duelWinOpponent");
    }
    return true;
  }

  function renderEnemyBoard() {
    if (!enemyPanelEl || !enemyBoardEl) return;

    ensureEnemyRevealCycle();

    if (!shouldShowEnemyBoard()) {
      enemyPanelEl.classList.add("hidden");
      enemyBoardEl.innerHTML = "";
      if (enemyCountdownEl) enemyCountdownEl.textContent = "";
      return;
    }

    enemyPanelEl.classList.remove("hidden");
    if (enemyCountdownEl) {
      const now = Date.now();
      if (state.enemyRevealVisible && state.enemyRevealHideAtMs > now) {
        const left = Math.max(1, Math.ceil((state.enemyRevealHideAtMs - now) / 1000));
        enemyCountdownEl.textContent = minesweeperFormat("enemyBoardShowing", { seconds: left });
      } else {
        const left = state.enemyRevealNextAtMs > now ? Math.max(1, Math.ceil((state.enemyRevealNextAtMs - now) / 1000)) : 0;
        enemyCountdownEl.textContent = minesweeperFormat("enemyBoardNextIn", { seconds: left });
      }
    }

    const forceCursorPreview = Boolean(state.opponentCursor);
    if (!state.enemyRevealVisible && !forceCursorPreview) {
      enemyBoardEl.innerHTML = "";
      return;
    }

    enemyBoardEl.innerHTML = "";
    if (enemyLabelEl) {
      enemyLabelEl.textContent = minesweeperText("enemyBoard");
    }
    if (overviewLabelEl) {
      overviewLabelEl.textContent = minesweeperText("boardOverview");
    }

    const snapshot = state.opponentSnapshot;
    const rows = Number(snapshot?.rows) || state.rows;
    const cols = Number(snapshot?.cols) || state.cols;
    const board = Array.isArray(snapshot?.board) && snapshot.board.length > 0 ? snapshot.board : null;

    enemyBoardEl.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const cellData = board?.[row]?.[col] || createCell();
        const cellBtn = document.createElement("button");
        cellBtn.type = "button";
        cellBtn.className = "minesweeper-cell";
        cellBtn.disabled = true;

        if (cellData.revealed) {
          cellBtn.classList.add("revealed");
          if (cellData.mine) {
            cellBtn.classList.add("mine");
            cellBtn.textContent = "*";
          } else if ((Number(cellData.adjacent) || 0) > 0) {
            cellBtn.textContent = String(Number(cellData.adjacent) || 0);
            cellBtn.dataset.adjacent = String(Number(cellData.adjacent) || 0);
          }
        } else if (cellData.flagged) {
          cellBtn.classList.add("flagged");
          cellBtn.textContent = "!";
        }

        if (cellData.miss) {
          cellBtn.classList.add("miss");
          cellBtn.textContent = "X";
        }

        if (state.opponentCursor?.row === row && state.opponentCursor?.col === col) {
          cellBtn.classList.add("opponent-cursor");
        }

        enemyBoardEl.appendChild(cellBtn);
      }
    }
  }

  function shouldShowOverviewMap() {
    return state.cols >= 30 || state.rows >= 30;
  }

  function renderOverviewMap() {
    if (!overviewPanelEl || !(overviewCanvasEl instanceof HTMLCanvasElement)) return;

    if (!shouldShowOverviewMap()) {
      overviewPanelEl.classList.add("hidden");
      return;
    }

    overviewPanelEl.classList.remove("hidden");
    if (overviewLabelEl) {
      overviewLabelEl.textContent = minesweeperText("boardOverview");
    }

    const ctx = overviewCanvasEl.getContext("2d");
    if (!ctx) return;

    const width = overviewCanvasEl.width;
    const height = overviewCanvasEl.height;
    const cellW = width / state.cols;
    const cellH = height / state.rows;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#0e1a30";
    ctx.fillRect(0, 0, width, height);

    for (let row = 0; row < state.rows; row += 1) {
      for (let col = 0; col < state.cols; col += 1) {
        const cell = state.board[row][col];
        if (cell.miss) {
          ctx.fillStyle = "#f59f40";
        } else if (cell.flagged) {
          ctx.fillStyle = "#ffcc74";
        } else if (cell.revealed && cell.mine) {
          ctx.fillStyle = "#d14f4f";
        } else if (cell.revealed && cell.adjacent > 0) {
          ctx.fillStyle = "#98b7e6";
        } else if (cell.revealed) {
          ctx.fillStyle = "#dce7f9";
        } else {
          ctx.fillStyle = "#253a5e";
        }
        ctx.fillRect(col * cellW, row * cellH, Math.ceil(cellW), Math.ceil(cellH));
      }
    }

    if (boardViewportEl && boardEl) {
      const contentW = Math.max(1, boardEl.scrollWidth);
      const contentH = Math.max(1, boardEl.scrollHeight);
      const vx = (boardViewportEl.scrollLeft / contentW) * width;
      const vy = (boardViewportEl.scrollTop / contentH) * height;
      const vw = Math.max(2, (boardViewportEl.clientWidth / contentW) * width);
      const vh = Math.max(2, (boardViewportEl.clientHeight / contentH) * height);

      ctx.strokeStyle = "rgba(112, 235, 255, 0.95)";
      ctx.lineWidth = 2;
      ctx.strokeRect(vx, vy, vw, vh);
    }
  }

  function renderStartCountdownOverlay() {
    if (!startOverlayEl) return;

    const isPenaltyCountdown = state.duelPenaltyRemainingSec > 0;
    if (playLayoutEl) {
      playLayoutEl.classList.toggle("board-hidden", isPenaltyCountdown);
    }

    if (isPenaltyCountdown) {
      startOverlayEl.textContent = minesweeperFormat("missCountdown", {
        seconds: state.duelPenaltyRemainingSec,
      });
      startOverlayEl.classList.remove("hidden");
      return;
    }

    if (state.startCountdownSec > 0) {
      startOverlayEl.textContent = String(state.startCountdownSec);
      startOverlayEl.classList.remove("hidden");
      return;
    }
    startOverlayEl.classList.add("hidden");
  }

  function shareDuelTemplateIfNeeded() {
    if (!isRoomMode() || !isDuelMode()) return;
    if (state.roomRole !== "host") return;
    if (!state.started || state.gameOver) return;
    if (!state.duelTemplate || state.duelTemplateShared) return;
    state.duelTemplateShared = true;
    emitRoomSnapshot({ force: true });
  }

  function roomModePayload() {
    return {
      playMode: state.playMode,
      difficulty: state.difficulty,
      boardSize: state.boardSize,
      playerCount: state.playerCount,
    };
  }

  function normalizeBoardSize(boardSize) {
    if (typeof boardSize === "string" && BOARD_SIZE_PRESETS[boardSize]) {
      return BOARD_SIZE_PRESETS[boardSize].rows;
    }
    const parsed = Number.parseInt(String(boardSize), 10);
    const safe = Number.isFinite(parsed) ? parsed : 12;
    const clamped = Math.max(MIN_BOARD_SIZE, Math.min(MAX_BOARD_SIZE, safe));
    const stepped = Math.round(clamped / BOARD_SIZE_STEP) * BOARD_SIZE_STEP;
    return Math.max(MIN_BOARD_SIZE, Math.min(MAX_BOARD_SIZE, stepped));
  }

  function applyRoomModePayload(payload = {}, { shouldEmit = false } = {}) {
    if (!payload || typeof payload !== "object") return;

    const nextModeRaw = String(payload.playMode || state.playMode || "solo");
    const nextMode = nextModeRaw === "duel" || nextModeRaw === "battle" || nextModeRaw === "coop" ? nextModeRaw : "solo";
    state.playMode = nextMode;

    const nextDifficultyRaw = String(payload.difficulty || state.difficulty || "normal");
    state.difficulty = DIFFICULTY_PRESETS[nextDifficultyRaw] ? nextDifficultyRaw : "normal";

    const nextBoardSizeRaw = payload.boardSize ?? state.boardSize ?? 12;
    state.boardSize = normalizeBoardSize(nextBoardSizeRaw);
    setBoardSize(state.boardSize);
    setDifficulty(state.difficulty);

    const parsedPlayerCount = Number.parseInt(String(payload.playerCount ?? state.playerCount), 10);
    state.playerCount = normalizePlayerCount(parsedPlayerCount, nextMode);

    state.battleMisses = normalizeMissArray(payload.battleMisses, state.playerCount);
    state.coopMisses = normalizeMissArray(payload.coopMisses, state.playerCount);
    state.coopClearTimeSec = null;
    state.scores = Array.from({ length: state.playerCount }, () => 0);
    state.firstSafeUsed = Array.from({ length: state.playerCount }, () => false);
    state.duelTimes = Array.from({ length: state.playerCount }, () => null);
    state.duelTemplateShared = false;

    if (modeSelectEl) modeSelectEl.value = state.playMode;
    if (difficultySelectEl) difficultySelectEl.value = state.difficulty;
    if (boardSizeSelectEl) boardSizeSelectEl.value = String(state.boardSize);
    if (playerCountSelectEl) playerCountSelectEl.value = String(state.playerCount);
    if (coopLivesSelectEl) coopLivesSelectEl.disabled = true;

    if (shouldEmit && isRoomMode() && state.roomRole === "host") {
      options.onRoomModeChange?.(roomModePayload());
    }
  }

  function clearDuelPenaltyTimer() {
    if (state.duelPenaltyTimerId) {
      window.clearInterval(state.duelPenaltyTimerId);
      state.duelPenaltyTimerId = null;
    }
    state.duelPenaltyRemainingSec = 0;
  }

  function clearStartCountdown() {
    if (state.startCountdownTimerId) {
      window.clearInterval(state.startCountdownTimerId);
      state.startCountdownTimerId = null;
    }
    state.startCountdownSec = 0;
  }

  function beginRoomCountdown(seconds = 3, { fromRemote = false } = {}) {
    if (!isRoomMode()) {
      startNewGame({ fromRemote: false });
      return;
    }
    if (state.roomRole !== "host" && !fromRemote) return;
    if (state.startCountdownTimerId) return;

    const total = Math.max(1, Number.parseInt(String(seconds), 10) || 3);
    state.startCountdownSec = total;
    messageEl.textContent = minesweeperFormat("countdownStart", { seconds: state.startCountdownSec });
    render();

    if (!fromRemote && state.roomRole === "host") {
      options.onRoomCountdownStart?.(total);
    }

    state.startCountdownTimerId = window.setInterval(() => {
      state.startCountdownSec -= 1;
      if (state.startCountdownSec > 0) {
        messageEl.textContent = minesweeperFormat("countdownStart", { seconds: state.startCountdownSec });
        render();
        return;
      }

      clearStartCountdown();
      startNewGame({ fromRemote: true });
    }, 1000);
  }

  function beginDuelPenaltyWait(missedPlayer) {
    clearDuelPenaltyTimer();
    state.turnLocked = true;
    state.duelPenaltyRemainingSec = 5;
    messageEl.textContent = minesweeperFormat("duelMissWait", {
      player: playerLabel(missedPlayer),
      seconds: state.duelPenaltyRemainingSec,
    });
    render();

    state.duelPenaltyTimerId = window.setInterval(() => {
      if (state.gameOver) {
        clearDuelPenaltyTimer();
        state.turnLocked = false;
        render();
        return;
      }

      state.duelPenaltyRemainingSec -= 1;
      if (state.duelPenaltyRemainingSec > 0) {
        messageEl.textContent = minesweeperFormat("duelMissWait", {
          player: playerLabel(missedPlayer),
          seconds: state.duelPenaltyRemainingSec,
        });
        render();
        return;
      }

      clearDuelPenaltyTimer();
      state.turnLocked = false;
      if (isDuelMode()) {
        state.timerSec += 5;
        messageEl.textContent = minesweeperFormat("duelPenaltyApplied", {
          player: playerLabel(missedPlayer),
          seconds: 5,
        });
      } else {
        switchTurn();
        messageEl.textContent = currentTurnText();
      }
      render();
    }, 1000);
  }

  function createDuelTemplate(startRow, startCol) {
    const template = Array.from({ length: state.rows }, () => Array.from({ length: state.cols }, () => false));
    const blocked = new Set([`${startRow}-${startCol}`]);
    getNeighbors(startRow, startCol).forEach(([r, c]) => blocked.add(`${r}-${c}`));

    let placed = 0;
    while (placed < state.mines) {
      const row = Math.floor(Math.random() * state.rows);
      const col = Math.floor(Math.random() * state.cols);
      const key = `${row}-${col}`;
      if (template[row][col] || blocked.has(key)) continue;
      template[row][col] = true;
      placed += 1;
    }

    return template;
  }

  function applyDuelTemplate(template) {
    state.board = createGrid(state.rows, state.cols);
    for (let row = 0; row < state.rows; row += 1) {
      for (let col = 0; col < state.cols; col += 1) {
        state.board[row][col].mine = Boolean(template?.[row]?.[col]);
      }
    }
    recalcAdjacents();
  }

  function startDuelRound(roundIndex, keepTimer = false) {
    if (!state.duelTemplate || !state.duelStartCell) return;

    clearTimer();
    state.duelRoundIndex = roundIndex;
    state.currentPlayer = roundIndex;
    state.revealedCount = 0;
    state.flagsPlaced = 0;
    if (!keepTimer) {
      state.timerSec = 0;
    }
    state.turnLocked = false;

    applyDuelTemplate(state.duelTemplate);
    revealCell(state.duelStartCell.row, state.duelStartCell.col);
    state.firstSafeUsed[roundIndex] = false;

    state.started = true;
    state.gameOver = false;
    startTimerIfNeeded();
    messageEl.textContent = minesweeperFormat("duelRoundStart", { player: playerLabel(roundIndex) });
    render();
  }

  function finalizeDuelResult() {
    const valid = state.duelTimes
      .map((time, idx) => ({ time, idx }))
      .filter((entry) => Number.isFinite(entry.time));
    if (valid.length === 0) {
      messageEl.textContent = minesweeperText("duelDraw");
      return;
    }

    const best = Math.min(...valid.map((entry) => entry.time));
    const winners = valid.filter((entry) => entry.time === best).map((entry) => playerLabel(entry.idx));
    if (winners.length > 1) {
      messageEl.textContent = minesweeperText("duelDraw");
      return;
    }
    messageEl.textContent = minesweeperFormat("duelResult", { winner: winners[0] || playerLabel(0) });
  }

  function clearTimer() {
    if (state.timerId) {
      window.clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function startTimerIfNeeded() {
    if (state.timerId || state.gameOver) return;
    state.timerId = window.setInterval(() => {
      state.timerSec += 1;
      updateHud();
    }, 1000);
  }

  function getNeighbors(row, col) {
    return NEIGHBOR_OFFSETS
      .map(([dr, dc]) => [row + dr, col + dc])
      .filter(([nr, nc]) => inBounds(nr, nc, state.rows, state.cols));
  }

  function collectGuaranteedSafeCells() {
    const safe = new Set();

    for (let row = 0; row < state.rows; row += 1) {
      for (let col = 0; col < state.cols; col += 1) {
        const cell = state.board[row][col];
        if (!cell.revealed || cell.mine || cell.adjacent <= 0) continue;

        const neighbors = getNeighbors(row, col);
        const hidden = [];
        let flagged = 0;

        neighbors.forEach(([nr, nc]) => {
          const neighbor = state.board[nr][nc];
          if (neighbor.flagged) {
            flagged += 1;
            return;
          }
          if (!neighbor.revealed) {
            hidden.push([nr, nc]);
          }
        });

        if (hidden.length > 0 && flagged === cell.adjacent) {
          hidden.forEach(([nr, nc]) => {
            safe.add(`${nr}-${nc}`);
          });
        }
      }
    }

    return safe;
  }

  function recalcAdjacents() {
    for (let row = 0; row < state.rows; row += 1) {
      for (let col = 0; col < state.cols; col += 1) {
        const cell = state.board[row][col];
        if (cell.mine) {
          cell.adjacent = 0;
          continue;
        }
        cell.adjacent = getNeighbors(row, col).reduce((sum, [nr, nc]) => sum + (state.board[nr][nc].mine ? 1 : 0), 0);
      }
    }
  }

  function relocateMineFromCell(row, col) {
    const fromCell = state.board[row][col];
    if (!fromCell?.mine) return false;

    const sourceTouchesRevealed = getNeighbors(row, col).some(([r, c]) => state.board[r][c].revealed);
    if (sourceTouchesRevealed) {
      return false;
    }

    const candidates = [];
    for (let r = 0; r < state.rows; r += 1) {
      for (let c = 0; c < state.cols; c += 1) {
        const candidate = state.board[r][c];
        if (r === row && c === col) continue;
        if (candidate.mine || candidate.revealed || candidate.flagged) continue;
        const candidateTouchesRevealed = getNeighbors(r, c).some(([nr, nc]) => state.board[nr][nc].revealed);
        if (candidateTouchesRevealed) continue;
        candidates.push([r, c]);
      }
    }

    if (candidates.length === 0) return false;

    // Deterministic relocation avoids introducing extra luck when guess-protection triggers.
    const [targetRow, targetCol] = candidates[0];
    fromCell.mine = false;
    state.board[targetRow][targetCol].mine = true;
    recalcAdjacents();
    return true;
  }

  function applyAntiStuckRescue({ fromFlagToggle = false } = {}) {
    if (!state.started || state.gameOver) return false;
    if (fromFlagToggle && (isCoopMode() || isBattleMode())) return false;

    const guaranteedSafe = collectGuaranteedSafeCells();
    if (guaranteedSafe.size > 0) return false;

    const candidates = [];
    for (let row = 0; row < state.rows; row += 1) {
      for (let col = 0; col < state.cols; col += 1) {
        const cell = state.board[row][col];
        if (!cell.revealed && !cell.flagged && !cell.mine) {
          candidates.push([row, col]);
        }
      }
    }

    if (candidates.length === 0) return false;

    candidates.sort((a, b) => {
      const aAdj = state.board[a[0]][a[1]].adjacent;
      const bAdj = state.board[b[0]][b[1]].adjacent;
      if (aAdj !== bAdj) return aAdj - bAdj;
      if (a[0] !== b[0]) return a[0] - b[0];
      return a[1] - b[1];
    });

    const [row, col] = candidates[0];
    const rescuePlayer = state.currentPlayer;
    const gained = revealCell(row, col);
    if (isCoopMode() || isBattleMode()) {
      state.scores[rescuePlayer] += gained;
    }

    if (checkWin()) {
      if (isCoopMode()) {
        state.gameOver = true;
        state.coopClearTimeSec = state.timerSec;
        clearTimer();
        messageEl.textContent = minesweeperFormat("coopClear", { time: formatTime(state.coopClearTimeSec) });
      } else if (isBattleMode()) {
        state.gameOver = true;
        clearTimer();
        finalizeBattleByScore();
      } else {
        state.gameOver = true;
        clearTimer();
        messageEl.textContent = minesweeperText("clear");
      }
    } else {
      if (isCoopMode() || isBattleMode()) {
        switchTurn();
        messageEl.textContent = `${minesweeperText("antiStuck")} / ${currentTurnText()}`;
      } else {
        messageEl.textContent = minesweeperText("antiStuck");
      }
    }

    return true;
  }

  function applyExpertGuessRescue() {
    if (state.difficulty !== "expert") return false;
    if (!state.started || state.gameOver) return false;
    if (isTurnMode()) return false;

    const candidates = [];
    for (let row = 0; row < state.rows; row += 1) {
      for (let col = 0; col < state.cols; col += 1) {
        const cell = state.board[row][col];
        if (!cell.revealed && !cell.flagged && !cell.mine) {
          candidates.push([row, col]);
        }
      }
    }

    if (candidates.length === 0) return false;

    const [row, col] = candidates[0];
    revealCell(row, col);

    if (checkWin()) {
      state.gameOver = true;
      clearTimer();
      messageEl.textContent = minesweeperText("clear");
    } else {
      messageEl.textContent = minesweeperText("expertRescue");
    }

    return true;
  }

  function placeMines(firstRow, firstCol) {
    if (isDuelMode()) {
      if (!state.duelTemplate) {
        state.duelStartCell = { row: firstRow, col: firstCol };
        state.duelTemplate = createDuelTemplate(firstRow, firstCol);
      }
      applyDuelTemplate(state.duelTemplate);
      return;
    }

    const blocked = new Set([`${firstRow}-${firstCol}`]);
    getNeighbors(firstRow, firstCol).forEach(([r, c]) => blocked.add(`${r}-${c}`));

    const candidates = [];
    for (let row = 0; row < state.rows; row += 1) {
      for (let col = 0; col < state.cols; col += 1) {
        if (blocked.has(`${row}-${col}`)) continue;
        candidates.push([row, col]);
      }
    }

    // Shuffle once and place in the first N cells for stable, duplicate-free placement.
    for (let i = candidates.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    const mineCount = Math.min(state.mines, candidates.length);
    for (let i = 0; i < mineCount; i += 1) {
      const [row, col] = candidates[i];
      state.board[row][col].mine = true;
    }

    for (let row = 0; row < state.rows; row += 1) {
      for (let col = 0; col < state.cols; col += 1) {
        const cell = state.board[row][col];
        if (cell.mine) continue;
        cell.adjacent = getNeighbors(row, col).reduce((sum, [nr, nc]) => sum + (state.board[nr][nc].mine ? 1 : 0), 0);
      }
    }
  }

  function revealCell(row, col) {
    if (!inBounds(row, col, state.rows, state.cols)) return 0;
    const cell = state.board[row][col];
    if (cell.revealed || cell.flagged) return 0;

    cell.revealed = true;
    state.revealedCount += 1;
    let revealed = 1;

    if (cell.adjacent !== 0 || cell.mine) return revealed;

    const queue = [[row, col]];
    while (queue.length > 0) {
      const [currentRow, currentCol] = queue.shift();
      getNeighbors(currentRow, currentCol).forEach(([nr, nc]) => {
        const nextCell = state.board[nr][nc];
        if (nextCell.revealed || nextCell.flagged || nextCell.mine) return;
        nextCell.revealed = true;
        state.revealedCount += 1;
        revealed += 1;
        if (nextCell.adjacent === 0) {
          queue.push([nr, nc]);
        }
      });
    }

    return revealed;
  }

  function revealAllMines() {
    for (let row = 0; row < state.rows; row += 1) {
      for (let col = 0; col < state.cols; col += 1) {
        const cell = state.board[row][col];
        if (cell.mine) {
          cell.revealed = true;
        }
      }
    }
  }

  function checkWin() {
    const safeCells = state.rows * state.cols - state.mines;
    return state.revealedCount >= safeCells;
  }

  function updateHud() {
    if (mineCountEl) mineCountEl.textContent = String(state.mines);
    if (flagCountEl) flagCountEl.textContent = String(Math.max(0, state.mines - state.flagsPlaced));
    if (timerEl) timerEl.textContent = formatTime(state.timerSec);
    if (sideTimeEl) sideTimeEl.textContent = formatTime(state.timerSec);
    if (modeSelectEl) modeSelectEl.value = state.playMode;
    ensurePlayerCountOptions();
    if (playerCountSelectEl) {
      playerCountSelectEl.value = String(state.playerCount);
      playerCountSelectEl.disabled = (state.playMode !== "duel" && state.playMode !== "battle" && state.playMode !== "coop") || !state.gameOver;
    }
    if (coopLivesSelectEl) {
      coopLivesSelectEl.disabled = true;
    }
    if (coopLifeLeftTextEl) {
      coopLifeLeftTextEl.textContent = isCoopMode() ? coopMissText() : "-";
    }
    if (turnTextEl) turnTextEl.textContent = currentTurnText();
    if (scoreTextEl) scoreTextEl.textContent = scoreText();
    if (sideLifeEl) {
      if (isCoopMode()) {
        sideLifeEl.textContent = coopMissText();
      } else if (isBattleMode()) {
        sideLifeEl.textContent = state.battleMisses.map((count, idx) => `${playerLabel(idx)}:M${Math.max(0, Number(count) || 0)}`).join(" / ");
      } else {
        sideLifeEl.textContent = "-";
      }
    }
    if (difficultySelectEl) difficultySelectEl.value = state.difficulty;
    if (boardSizeSelectEl) boardSizeSelectEl.value = String(state.boardSize);
    if (isRoomMode()) {
      const lockedUi = state.roomRole !== "host" || !state.gameOver || state.startCountdownSec > 0;
      if (modeSelectEl) modeSelectEl.disabled = lockedUi;
      if (playerCountSelectEl) playerCountSelectEl.disabled = true;
      if (coopLivesSelectEl) coopLivesSelectEl.disabled = true;
      if (difficultySelectEl) difficultySelectEl.disabled = lockedUi;
      if (boardSizeSelectEl) boardSizeSelectEl.disabled = lockedUi;
      if (startBtn) startBtn.disabled = state.roomRole !== "host" || state.startCountdownSec > 0;
    } else {
      if (boardSizeSelectEl) boardSizeSelectEl.disabled = !state.gameOver;
      if (startBtn) startBtn.disabled = false;
    }
  }

  function difficultyTextByKey(key) {
    if (key === "easy") return minesweeperText("difficultyEasy");
    if (key === "hard") return minesweeperText("difficultyHard");
    if (key === "expert") return minesweeperText("difficultyExpert");
    return minesweeperText("difficultyNormal");
  }

  function ensureBoardSizeOptions() {
    if (!boardSizeSelectEl) return;
    const expectedCount = Math.floor((MAX_BOARD_SIZE - MIN_BOARD_SIZE) / BOARD_SIZE_STEP) + 1;
    if (boardSizeSelectEl.options.length !== expectedCount) {
      boardSizeSelectEl.innerHTML = "";
      for (let size = MIN_BOARD_SIZE; size <= MAX_BOARD_SIZE; size += BOARD_SIZE_STEP) {
        const option = document.createElement("option");
        option.value = String(size);
        option.textContent = `${size}x${size}`;
        if (size === state.boardSize) {
          option.selected = true;
        }
        boardSizeSelectEl.appendChild(option);
      }
    }
    boardSizeSelectEl.value = String(state.boardSize);
  }

  function ensurePlayerCountOptions() {
    if (!playerCountSelectEl) return;
    const maxPlayers = maxPlayersForMode(state.playMode);
    const expectedCount = maxPlayers - 1;
    if (playerCountSelectEl.options.length !== expectedCount) {
      playerCountSelectEl.innerHTML = "";
      for (let count = 2; count <= maxPlayers; count += 1) {
        const option = document.createElement("option");
        option.value = String(count);
        option.textContent = `${count}P`;
        if (count === state.playerCount) {
          option.selected = true;
        }
        playerCountSelectEl.appendChild(option);
      }
    }
    state.playerCount = normalizePlayerCount(state.playerCount, state.playMode);
    playerCountSelectEl.value = String(state.playerCount);
  }

  function syncDifficultyTexts() {
    if (modeLabelEl) {
      modeLabelEl.textContent = minesweeperText("modeLabel");
    }
    if (enemyLabelEl) {
      enemyLabelEl.textContent = minesweeperText("enemyBoard");
    }
    if (turnLabelEl) {
      turnLabelEl.textContent = minesweeperText("turnLabel");
    }
    if (scoreLabelEl) {
      scoreLabelEl.textContent = minesweeperText("scoreLabel");
    }
    if (modeSelectEl) {
      [...modeSelectEl.options].forEach((option) => {
        if (option.value === "duel") {
          option.textContent = minesweeperText("modeDuel");
        } else if (option.value === "battle") {
          option.textContent = minesweeperText("modeBattle");
        } else if (option.value === "coop") {
          option.textContent = minesweeperText("modeCoop");
        } else {
          option.textContent = minesweeperText("modeSolo");
        }
      });
    }
    ensurePlayerCountOptions();
    if (playerCountLabelEl) {
      playerCountLabelEl.textContent = minesweeperText("playerCountLabel");
    }
    if (coopLivesLabelEl) {
      coopLivesLabelEl.textContent = minesweeperText("livesLabel");
    }
    if (coopLifeLeftLabelEl) {
      coopLifeLeftLabelEl.textContent = minesweeperText("coopLifeLeftLabel");
    }
    if (difficultyLabelEl) {
      difficultyLabelEl.textContent = minesweeperText("difficultyLabel");
    }
    if (boardSizeLabelEl) {
      boardSizeLabelEl.textContent = minesweeperText("boardSizeLabel");
    }
    if (!difficultySelectEl) return;
    [...difficultySelectEl.options].forEach((option) => {
      option.textContent = difficultyTextByKey(option.value);
    });
    ensureBoardSizeOptions();
  }

  function renderBoard() {
    if (!boardEl) return;

    const inputLocked = isInputLocked();
    boardEl.classList.toggle("is-locked", inputLocked);
    boardEl.innerHTML = "";
    let cellSize = 34;
    if (state.cols >= 100) {
      cellSize = 14;
    } else if (state.cols >= 90) {
      cellSize = 15;
    } else if (state.cols >= 80) {
      cellSize = 16;
    } else if (state.cols >= 70) {
      cellSize = 18;
    } else if (state.cols >= 60) {
      cellSize = 20;
    } else if (state.cols >= 50) {
      cellSize = 22;
    } else if (state.cols >= 40) {
      cellSize = 24;
    } else if (state.cols >= 30) {
      cellSize = 26;
    } else if (state.cols >= 20) {
      cellSize = 30;
    }
    boardEl.style.setProperty("--ms-cell-size", `${cellSize}px`);
    boardEl.style.setProperty("--ms-font-size", `${Math.max(8, Math.floor(cellSize * 0.62))}px`);
    boardEl.style.setProperty("--ms-radius", `${Math.max(2, Math.floor(cellSize * 0.22))}px`);
    boardEl.style.gridTemplateColumns = `repeat(${state.cols}, var(--ms-cell-size))`;
    let density = "normal";
    if (state.cols >= 80) {
      density = "ultra";
    } else if (state.cols >= 60) {
      density = "high";
    } else if (state.cols >= 36) {
      density = "mid";
    }
    boardEl.dataset.density = density;

    boardEl.style.maxWidth = "none";

    for (let row = 0; row < state.rows; row += 1) {
      for (let col = 0; col < state.cols; col += 1) {
        const cellData = state.board[row][col];
        const cellBtn = document.createElement("button");
        cellBtn.type = "button";
        cellBtn.className = "minesweeper-cell";
        cellBtn.setAttribute("aria-label", `row ${row + 1} col ${col + 1}`);

        if (cellData.revealed) {
          cellBtn.classList.add("revealed");
          if (cellData.mine) {
            cellBtn.classList.add("mine");
            cellBtn.textContent = "*";
          } else if (cellData.adjacent > 0) {
            cellBtn.textContent = String(cellData.adjacent);
            cellBtn.dataset.adjacent = String(cellData.adjacent);
          }
        } else if (cellData.flagged) {
          cellBtn.classList.add("flagged");
          cellBtn.textContent = "!";
        }

        if (cellData.miss) {
          cellBtn.classList.add("miss");
          cellBtn.textContent = "X";
        }

        cellBtn.disabled = state.gameOver || inputLocked;

        cellBtn.addEventListener("click", () => {
          if (state.gameOver) return;
          if (isInputLocked()) return;
          if (isRoomMode() && isCoopMode() && state.roomRole !== "host") {
            options.onRoomMove?.({ action: "reveal", row, col });
            return;
          }

          const pendingRemote = Number.isInteger(state.pendingRemotePlayerIndex) ? state.pendingRemotePlayerIndex : null;
          if (isRoomMode() && isCoopMode() && pendingRemote != null) {
            state.currentPlayer = Math.max(0, Math.min(state.playerCount - 1, pendingRemote));
          }

          if (!state.started) {
            placeMines(row, col);
            state.started = true;
            shareDuelTemplateIfNeeded();
            startTimerIfNeeded();
          }

          const targetCell = state.board[row][col];
          if (targetCell.flagged || targetCell.revealed) return;

          const current = state.currentPlayer;
          const protectFirstMove = isDuelMode() && !state.firstSafeUsed[current];

          if (targetCell.mine && protectFirstMove) {
            const moved = relocateMineFromCell(row, col);
            if (moved) {
              messageEl.textContent = minesweeperText("guessGuard");
            }
          } else if (targetCell.mine && collectGuaranteedSafeCells().size === 0) {
            const moved = relocateMineFromCell(row, col);
            if (moved) {
              messageEl.textContent = minesweeperText("guessGuard");
            }
          }

          if (targetCell.mine) {
            if (collectGuaranteedSafeCells().size === 0) {
              const rescued = applyAntiStuckRescue();
              if (rescued) {
                render();
                emitRoomSnapshot();
                return;
              }
            }

            targetCell.miss = true;
            if (isDuelMode()) {
              beginDuelPenaltyWait(state.currentPlayer);
              return;
            }

            if (isBattleMode()) {
              if (!targetCell.flagged) {
                targetCell.flagged = true;
                state.flagsPlaced += 1;
              }

              const missPlayer = state.currentPlayer;
              state.battleMisses[missPlayer] = Math.max(0, (state.battleMisses[missPlayer] ?? 0) + 1);

              switchTurn();
              messageEl.textContent = `${minesweeperFormat("battleMiss", { player: playerLabel(missPlayer), count: state.battleMisses[missPlayer] })} / ${currentTurnText()}`;
              render();
              return;
            }

            if (isCoopMode()) {
              if (!targetCell.flagged) {
                targetCell.flagged = true;
                state.flagsPlaced += 1;
              }
              const missPlayer = state.currentPlayer;
              state.coopMisses[missPlayer] = Math.max(0, (state.coopMisses[missPlayer] ?? 0) + 1);
              switchTurn();
              messageEl.textContent = `${minesweeperFormat("coopLifeLost", { player: playerLabel(missPlayer), count: state.coopMisses[missPlayer] })} / ${currentTurnText()}`;
              render();
              return;
            }

            targetCell.revealed = true;
            revealAllMines();
            state.gameOver = true;
            clearTimer();
            messageEl.textContent = minesweeperText("gameOver");
            render();
            return;
          }

          if (isDuelMode()) {
            state.firstSafeUsed[state.currentPlayer] = true;
          }

          const gained = revealCell(row, col);
          if (isTurnMode()) {
            state.scores[state.currentPlayer] += gained;
          }

          if (checkWin()) {
            if (isDuelMode()) {
              clearTimer();
              state.duelTimes[state.currentPlayer] = state.timerSec;

              if (isRoomMode()) {
                state.gameOver = true;
                state.turnLocked = true;
                finalizeRoomDuelResultIfReady();
                render();
                emitRoomSnapshot();
                return;
              }

              const next = state.currentPlayer + 1;
              if (next < state.playerCount) {
                state.turnLocked = true;
                messageEl.textContent = minesweeperFormat("duelRoundNext", { player: playerLabel(next) });
                render();
                window.setTimeout(() => {
                  if (state.playMode !== "duel") return;
                  startDuelRound(next);
                }, 800);
                return;
              }

              state.gameOver = true;
              finalizeDuelResult();
            } else if (isCoopMode()) {
              state.gameOver = true;
              state.coopClearTimeSec = state.timerSec;
              clearTimer();
              messageEl.textContent = minesweeperFormat("coopClear", { time: formatTime(state.coopClearTimeSec) });
            } else if (isBattleMode()) {
              state.gameOver = true;
              clearTimer();
              finalizeBattleByScore();
            } else {
              state.gameOver = true;
              clearTimer();
              messageEl.textContent = minesweeperText("clear");
            }
          } else {
            if (!applyAntiStuckRescue()) {
              if (isCoopMode() || isBattleMode()) {
                switchTurn();
                messageEl.textContent = currentTurnText();
              } else if (isDuelMode()) {
                messageEl.textContent = minesweeperFormat("duelRoundStart", { player: playerLabel(state.currentPlayer) });
              } else {
                messageEl.textContent = minesweeperText("playHint");
              }
            }
          }
          render();
          emitRoomSnapshot();
        });

        cellBtn.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          if (state.gameOver) return;
          if (isInputLocked()) return;
          if (isRoomMode() && isCoopMode() && state.roomRole !== "host") {
            options.onRoomMove?.({ action: "toggleFlag", row, col });
            return;
          }
          const targetCell = state.board[row][col];
          if (targetCell.revealed) return;
          targetCell.flagged = !targetCell.flagged;
          state.flagsPlaced += targetCell.flagged ? 1 : -1;
          if (!state.gameOver) {
            applyAntiStuckRescue({ fromFlagToggle: true });
          }
          render();
          emitRoomSnapshot();
        });

        cellBtn.addEventListener("mouseenter", () => {
          sendLocalCursor(row, col);
        });

        boardEl.appendChild(cellBtn);
      }
    }
  }

  function render() {
    updateHud();
    renderBoard();
    renderEnemyBoard();
    renderOverviewMap();
    renderStartCountdownOverlay();
  }

  function setDifficulty(difficulty) {
    const next = DIFFICULTY_PRESETS[difficulty] ? difficulty : "normal";
    state.difficulty = next;
    const density = DIFFICULTY_DENSITY[next] ?? DIFFICULTY_DENSITY.normal;
    state.mines = clampMines(Math.round(state.rows * state.cols * density), state.rows, state.cols);
  }

  function setBoardSize(boardSize) {
    const size = normalizeBoardSize(boardSize);
    state.boardSize = size;
    state.rows = size;
    state.cols = size;
  }

  function enterStandby() {
    clearTimer();
    clearDuelPenaltyTimer();
    clearStartCountdown();
    setBoardSize(state.boardSize);
    setDifficulty(state.difficulty);
    state.board = createGrid(state.rows, state.cols);
    state.started = false;
    state.gameOver = true;
    state.revealedCount = 0;
    state.flagsPlaced = 0;
    state.timerSec = 0;
    state.turnLocked = false;
    state.currentPlayer = roomDuelLocalPlayerIndex();
    state.battleMisses = Array.from({ length: state.playerCount }, () => 0);
    state.coopMisses = Array.from({ length: state.playerCount }, () => 0);
    state.coopClearTimeSec = null;
    state.scores = Array.from({ length: state.playerCount }, () => 0);
    state.firstSafeUsed = Array.from({ length: state.playerCount }, () => false);
    state.duelTemplate = null;
    state.duelTemplateShared = false;
    state.duelStartCell = null;
    state.duelRoundIndex = 0;
    state.duelTimes = Array.from({ length: state.playerCount }, () => null);
    state.opponentSnapshot = null;
    state.opponentDuelTime = null;
    clearOpponentCursor();
    state.enemyRevealEnabled = false;
    messageEl.textContent = minesweeperText("standby");
    render();
  }

  function startNewGame({ fromRemote = false } = {}) {
    clearTimer();
    clearDuelPenaltyTimer();
    clearStartCountdown();
    clearEnemyRevealCycle();
    state.board = createGrid(state.rows, state.cols);
    state.started = false;
    state.gameOver = false;
    state.revealedCount = 0;
    state.flagsPlaced = 0;
    state.timerSec = 0;
    state.turnLocked = false;
    state.currentPlayer = roomDuelLocalPlayerIndex();
    state.battleMisses = Array.from({ length: state.playerCount }, () => 0);
    state.coopMisses = Array.from({ length: state.playerCount }, () => 0);
    state.coopClearTimeSec = null;
    state.scores = Array.from({ length: state.playerCount }, () => 0);
    state.firstSafeUsed = Array.from({ length: state.playerCount }, () => false);
    state.duelTemplate = null;
    state.duelTemplateShared = false;
    state.duelStartCell = null;
    state.duelRoundIndex = 0;
    state.duelTimes = Array.from({ length: state.playerCount }, () => null);
    state.opponentSnapshot = null;
    state.opponentDuelTime = null;
    clearOpponentCursor();
    state.enemyRevealEnabled = isRoomMode() && isDuelMode();
    if (isRoomMode()) {
      state.roomLocked = false;
      state.roomLockMessage = "";
    }

    if (isDuelMode()) {
      messageEl.textContent = minesweeperFormat("duelRoundStart", { player: playerLabel(state.currentPlayer) });
      render();
      return;
    }

    messageEl.textContent = isTurnMode() ? currentTurnText() : minesweeperText("playHint");
    render();

    if (isRoomMode() && !fromRemote && state.roomRole === "host") {
      options.onRoomNewGame?.();
    }
  }

  difficultySelectEl?.addEventListener("change", () => {
    if (isRoomMode() && state.roomRole !== "host") return;
    const next = difficultySelectEl.value;
    setDifficulty(next);
    if (isRoomMode() && state.roomRole === "host") {
      applyRoomModePayload({ difficulty: state.difficulty }, { shouldEmit: true });
    }
    enterStandby();
  });

  boardSizeSelectEl?.addEventListener("change", () => {
    if (isRoomMode() && state.roomRole !== "host") return;
    const next = boardSizeSelectEl.value;
    setBoardSize(next);
    setDifficulty(state.difficulty);
    if (isRoomMode() && state.roomRole === "host") {
      applyRoomModePayload({ boardSize: state.boardSize }, { shouldEmit: true });
    }
    enterStandby();
  });

  modeSelectEl?.addEventListener("change", () => {
    if (isRoomMode() && state.roomRole !== "host") return;
    if (modeSelectEl.value === "duel") {
      state.playMode = "duel";
    } else if (modeSelectEl.value === "battle") {
      state.playMode = "battle";
    } else if (modeSelectEl.value === "coop") {
      state.playMode = "coop";
      state.playerCount = normalizePlayerCount(state.playerCount, "coop");
    } else {
      state.playMode = "solo";
    }
    if (isRoomMode() && state.roomRole === "host") {
      applyRoomModePayload({ playMode: state.playMode }, { shouldEmit: true });
    }
    enterStandby();
  });

  playerCountSelectEl?.addEventListener("change", () => {
    if (isRoomMode() && state.roomRole !== "host") return;
    const parsed = Number.parseInt(playerCountSelectEl.value || "2", 10);
    state.playerCount = normalizePlayerCount(parsed, state.playMode);
    if (isRoomMode() && state.roomRole === "host") {
      applyRoomModePayload({ playerCount: state.playerCount }, { shouldEmit: true });
    }
    enterStandby();
  });

  coopLivesSelectEl?.addEventListener("change", () => {
    if (coopLivesSelectEl) {
      coopLivesSelectEl.disabled = true;
    }
  });

  startBtn?.addEventListener("click", () => {
    if (isRoomMode() && state.roomRole !== "host") return;
    if (isRoomMode()) {
      beginRoomCountdown(3, { fromRemote: false });
      return;
    }
    startNewGame({ fromRemote: false });
  });

  remakeBtn?.addEventListener("click", () => {
    const confirmed = window.confirm(minesweeperText("remakeConfirm"));
    if (!confirmed) return;

    if (isRoomMode()) {
      if (state.roomRole !== "host") return;
      options.onRoomRemake?.();
    }

    enterStandby();
  });

  menuBtn?.addEventListener("click", () => {
    const confirmed = window.confirm(minesweeperText("menuConfirm"));
    if (!confirmed) return;
    options.onBackToMenu?.();
  });

  langSelectEl?.addEventListener("change", () => {
    syncDifficultyTexts();
    if (state.gameOver) {
      messageEl.textContent = minesweeperText("standby");
    }
    render();
  });

  boardEl?.addEventListener("mouseleave", () => {
    sendLocalCursor(null, null);
  });

  boardViewportEl?.addEventListener("scroll", () => {
    renderOverviewMap();
  });

  overviewCanvasEl?.addEventListener("click", (event) => {
    if (!(overviewCanvasEl instanceof HTMLCanvasElement) || !boardViewportEl || !boardEl) return;
    if (!shouldShowOverviewMap()) return;

    const rect = overviewCanvasEl.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const ratioX = (event.clientX - rect.left) / rect.width;
    const ratioY = (event.clientY - rect.top) / rect.height;
    const targetLeft = ratioX * boardEl.scrollWidth - boardViewportEl.clientWidth / 2;
    const targetTop = ratioY * boardEl.scrollHeight - boardViewportEl.clientHeight / 2;

    boardViewportEl.scrollLeft = Math.max(0, Math.min(boardEl.scrollWidth - boardViewportEl.clientWidth, targetLeft));
    boardViewportEl.scrollTop = Math.max(0, Math.min(boardEl.scrollHeight - boardViewportEl.clientHeight, targetTop));
    renderOverviewMap();
  });

  syncDifficultyTexts();

  enterStandby();

  return {
    startNewGame: ({ fromRemote = false } = {}) => startNewGame({ fromRemote }),
    enterStandby,
    stop: () => {
      clearTimer();
      clearDuelPenaltyTimer();
      clearStartCountdown();
      clearEnemyRevealCycle();
      clearOpponentCursor();
    },
    configureRoomMode: ({ roomCode = null, roomRole = null } = {}) => {
      state.gameMode = "room";
      state.roomCode = roomCode;
      state.roomRole = roomRole;
      state.roomLocked = false;
      state.roomLockMessage = "";
      state.opponentSnapshot = null;
      enterStandby();
    },
    configureStandardMode: () => {
      state.gameMode = "local";
      state.roomCode = null;
      state.roomRole = null;
      state.roomLocked = false;
      state.roomLockMessage = "";
      state.opponentSnapshot = null;
      enterStandby();
    },
    setRoomLock: ({ locked, message } = {}) => {
      state.roomLocked = Boolean(locked);
      state.roomLockMessage = message || "";
      if (state.roomLocked && state.roomLockMessage) {
        messageEl.textContent = state.roomLockMessage;
      }
      render();
    },
    applyRoomMode: (payload) => {
      applyRoomModePayload(payload, { shouldEmit: false });
      enterStandby();
    },
    applyRoomCountdown: (seconds = 3) => {
      beginRoomCountdown(seconds, { fromRemote: true });
    },
    applyRoomCursor: (payload) => {
      applyOpponentCursor(payload);
    },
    applyRoomRemake: () => {
      enterStandby();
    },
    applyRemoteMove: (move) => {
      if (!isRoomMode() || !isCoopMode() || state.roomRole !== "host") return;
      if (!move || typeof move !== "object") return;

      const row = Number.parseInt(String(move.row), 10);
      const col = Number.parseInt(String(move.col), 10);
      if (!Number.isFinite(row) || !Number.isFinite(col)) return;
      if (!inBounds(row, col, state.rows, state.cols)) return;

      const idx = row * state.cols + col;
      const targetBtn = boardEl?.children?.[idx];
      if (!(targetBtn instanceof HTMLElement)) return;

      state.pendingRemotePlayerIndex = roomCoopRemotePlayerIndex();

      try {
        if (move.action === "toggleFlag") {
          const ev = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
          targetBtn.dispatchEvent(ev);
          return;
        }

        const ev = new MouseEvent("click", { bubbles: true, cancelable: true });
        targetBtn.dispatchEvent(ev);
      } finally {
        state.pendingRemotePlayerIndex = null;
      }
    },
    getSnapshot: () => ({
      rows: state.rows,
      cols: state.cols,
      mines: state.mines,
      difficulty: state.difficulty,
      boardSize: state.boardSize,
      board: cloneBoardData(),
      started: state.started,
      gameOver: state.gameOver,
      revealedCount: state.revealedCount,
      flagsPlaced: state.flagsPlaced,
      timerSec: state.timerSec,
      playMode: state.playMode,
      playerCount: state.playerCount,
      coopMisses: Array.isArray(state.coopMisses) ? [...state.coopMisses] : normalizeMissArray(state.coopMisses, state.playerCount),
      coopClearTimeSec: state.coopClearTimeSec,
      battleMisses: Array.isArray(state.battleMisses) ? [...state.battleMisses] : normalizeMissArray(state.battleMisses, state.playerCount),
      currentPlayer: state.currentPlayer,
      scores: Array.isArray(state.scores) ? [...state.scores] : [],
      firstSafeUsed: Array.isArray(state.firstSafeUsed) ? [...state.firstSafeUsed] : [],
      duelTemplate: state.duelTemplate,
      duelTemplateShared: state.duelTemplateShared,
      duelStartCell: state.duelStartCell,
      duelRoundIndex: state.duelRoundIndex,
      duelTimes: Array.isArray(state.duelTimes) ? [...state.duelTimes] : [],
      turnLocked: state.turnLocked,
      roomLocked: state.roomLocked,
      roomLockMessage: state.roomLockMessage,
      message: messageEl?.textContent || "",
    }),
    applySnapshot: (snapshot) => {
      if (!snapshot || typeof snapshot !== "object") return;

      if (isRoomMode() && snapshot.playMode === "duel") {
        applyOpponentSnapshot(snapshot);
        if (!state.duelTemplate && Array.isArray(snapshot.duelTemplate)) {
          state.duelTemplate = snapshot.duelTemplate;
          state.duelStartCell = snapshot.duelStartCell && typeof snapshot.duelStartCell === "object" ? snapshot.duelStartCell : null;
          state.duelTemplateShared = Boolean(snapshot.duelTemplateShared);
        }
        if (isDuelMode()) {
          finalizeRoomDuelResultIfReady();
        }
        render();
        return;
      }

      clearTimer();
      clearDuelPenaltyTimer();

      state.rows = Number(snapshot.rows) || state.rows;
      state.cols = Number(snapshot.cols) || state.cols;
      state.mines = Number(snapshot.mines) || state.mines;
      state.difficulty = snapshot.difficulty || state.difficulty;
      state.boardSize = normalizeBoardSize(snapshot.boardSize ?? snapshot.rows ?? state.boardSize);
      applyBoardData(snapshot.board);
      state.started = Boolean(snapshot.started);
      state.gameOver = Boolean(snapshot.gameOver);
      state.revealedCount = Number(snapshot.revealedCount) || 0;
      state.flagsPlaced = Number(snapshot.flagsPlaced) || 0;
      state.timerSec = Number(snapshot.timerSec) || 0;
      state.playMode = snapshot.playMode || state.playMode;
      state.playerCount = normalizePlayerCount(Number(snapshot.playerCount) || state.playerCount, state.playMode);
      const legacyCoopMisses = Array.isArray(snapshot.coopLives) ? snapshot.coopLives.map(() => 0) : snapshot.coopLives;
      state.coopMisses = normalizeMissArray(snapshot.coopMisses ?? legacyCoopMisses, state.playerCount);
      state.coopClearTimeSec = snapshot.coopClearTimeSec == null ? null : Math.max(0, Number(snapshot.coopClearTimeSec) || 0);
      const legacyBattleMisses = Array.isArray(snapshot.battleLives) ? snapshot.battleLives.map(() => 0) : snapshot.battleLives;
      state.battleMisses = normalizeMissArray(snapshot.battleMisses ?? legacyBattleMisses, state.playerCount);
      state.currentPlayer = Math.max(0, Math.min(state.playerCount - 1, Number(snapshot.currentPlayer) || 0));
      state.scores = Array.isArray(snapshot.scores)
        ? snapshot.scores.map((score) => Math.max(0, Number(score) || 0)).slice(0, state.playerCount)
        : Array.from({ length: state.playerCount }, () => 0);
      while (state.scores.length < state.playerCount) {
        state.scores.push(0);
      }
      state.firstSafeUsed = Array.isArray(snapshot.firstSafeUsed)
        ? snapshot.firstSafeUsed.map((value) => Boolean(value)).slice(0, state.playerCount)
        : Array.from({ length: state.playerCount }, () => false);
      while (state.firstSafeUsed.length < state.playerCount) {
        state.firstSafeUsed.push(false);
      }
      state.duelTemplate = Array.isArray(snapshot.duelTemplate) ? snapshot.duelTemplate : null;
      state.duelTemplateShared = Boolean(snapshot.duelTemplateShared);
      state.duelStartCell = snapshot.duelStartCell && typeof snapshot.duelStartCell === "object" ? snapshot.duelStartCell : null;
      state.duelRoundIndex = Number(snapshot.duelRoundIndex) || 0;
      state.duelTimes = Array.isArray(snapshot.duelTimes)
        ? snapshot.duelTimes.map((value) => (Number.isFinite(Number(value)) ? Number(value) : null)).slice(0, state.playerCount)
        : Array.from({ length: state.playerCount }, () => null);
      while (state.duelTimes.length < state.playerCount) {
        state.duelTimes.push(null);
      }
      state.turnLocked = Boolean(snapshot.turnLocked);
      state.roomLocked = Boolean(snapshot.roomLocked);
      state.roomLockMessage = snapshot.roomLockMessage || "";

      if (typeof snapshot.message === "string" && snapshot.message) {
        messageEl.textContent = snapshot.message;
      }

      if (state.started && !state.gameOver) {
        startTimerIfNeeded();
      }

      render();
    },
  };
}
