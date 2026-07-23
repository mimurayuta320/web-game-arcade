import { readStoredAuth, scopedStorageKey } from "./userScopedStorage.js";

const SIZE = 8;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;
const TURN_LIMIT_SEC = 30;
const OTHELLO_LEARNING_KEY = "neon-othello-learning-v1";
const LEARNING_CELL_CLAMP = 24;
const LEARNING_REWARD = 0.35;
const TT_MAX_ENTRIES = 120000;
const CPU_THINK_DELAY_MAX_MS = 360;
const CORNER_SACRIFICE_DESTROY_COUNT = 3;
const NO_CORNER_SACRIFICE_COUNT = 2;
const NO_CORNER_DESTROY_COUNT = 1;
const ITERATIVE_SEARCH_BUDGET_MAX_MS = 420;
const ENDGAME_SEARCH_BUDGET_MAX_MS = 620;
const ITERATIVE_SEARCH_MAX_NODES = 42000;
const ENDGAME_SEARCH_MAX_NODES = 140000;
const OPENING_BOOK_PRIORITY = [
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
];

const DIFFICULTY_SETTINGS = {
  easy: {
    label: "かんたん",
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
    learningBiasScale: 0.18,
    enableOpponentLearning: false,
  },
  normal: {
    label: "ふつう",
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
    learningBiasScale: 0.32,
    enableOpponentLearning: false,
  },
  hard: {
    label: "つよい",
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
    endgameSolveEmpty: 10,
    ttMaxEntries: 140000,
    learningBiasScale: 0.55,
    enableOpponentLearning: false,
  },
  expert: {
    label: "さいきょう",
    thinkMs: 2800,
    randomRate: 0,
    flipWeight: 1.45,
    edgeWeight: 5,
    cornerWeight: 68,
    xPenalty: -26,
    cPenalty: -13,
    mobilityWeight: 6.3,
    positionalWeight: 1.45,
    searchDepth: 10,
    maxBranches: 28,
    endgameSolveEmpty: 24,
    iterativeBudgetMaxMs: 3200,
    endgameBudgetMaxMs: 5200,
    iterativeMaxNodes: 1200000,
    endgameMaxNodes: 4000000,
    ttMaxEntries: 520000,
    // For strongest mode, favor deterministic deep search over adaptive bias.
    enableLearningBias: false,
    learningBiasScale: 0,
    enableOpponentLearning: false,
    opponentLearningScale: 0,
  },
  pro: {
    label: "プロ",
    thinkMs: 5200,
    randomRate: 0,
    flipWeight: 1.5,
    edgeWeight: 5.6,
    cornerWeight: 76,
    xPenalty: -30,
    cPenalty: -15,
    mobilityWeight: 7.2,
    positionalWeight: 1.62,
    searchDepth: 12,
    maxDepthCap: 16,
    maxBranches: 40,
    endgameSolveEmpty: 28,
    iterativeBudgetMaxMs: 7000,
    endgameBudgetMaxMs: 12000,
    iterativeMaxNodes: 3600000,
    endgameMaxNodes: 12000000,
    ttMaxEntries: 1200000,
    useOpeningBook: true,
    openingBookMaxPly: 14,
    enableLearningBias: false,
    learningBiasScale: 0,
    enableOpponentLearning: false,
    opponentLearningScale: 0,
  },
};

const POSITION_WEIGHT = [
  [40, -12, 10, 6, 6, 10, -12, 40],
  [-12, -18, -3, -3, -3, -3, -18, -12],
  [10, -3, 4, 2, 2, 4, -3, 10],
  [6, -3, 2, 1, 1, 2, -3, 6],
  [6, -3, 2, 1, 1, 2, -3, 6],
  [10, -3, 4, 2, 2, 4, -3, 10],
  [-12, -18, -3, -3, -3, -3, -18, -12],
  [40, -12, 10, 6, 6, 10, -12, 40],
];

const DIRECTIONS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

const HANDICAP_PATTERNS = {
  none: [],
  immutable1: [],
};

function createZeroMatrix() {
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => 0));
}

function createFalseMatrix() {
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => false));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeBooleanMatrix(matrix) {
  if (!Array.isArray(matrix) || matrix.length !== SIZE) return createFalseMatrix();
  return matrix.map((line) => {
    if (!Array.isArray(line) || line.length !== SIZE) {
      return Array.from({ length: SIZE }, () => false);
    }
    return line.map((value) => Boolean(value));
  });
}

function createDefaultLearning() {
  return {
    playerTendency: createZeroMatrix(),
    cpuBias: createZeroMatrix(),
    totalPlayerMoves: 0,
  };
}

function loadLearningState() {
  try {
    const auth = readStoredAuth();
    const scopedKey = scopedStorageKey(OTHELLO_LEARNING_KEY, auth?.userId || "");
    let raw = localStorage.getItem(scopedKey);
    if (!raw) {
      // Migrate the pre-user-scoped learning cache on first read.
      const legacy = localStorage.getItem(OTHELLO_LEARNING_KEY);
      if (legacy) {
        raw = legacy;
        localStorage.setItem(scopedKey, legacy);
      }
    }
    if (!raw) return createDefaultLearning();
    const parsed = JSON.parse(raw);

    if (!parsed || !Array.isArray(parsed.playerTendency) || !Array.isArray(parsed.cpuBias)) {
      return createDefaultLearning();
    }

    const playerTendency = createZeroMatrix();
    const cpuBias = createZeroMatrix();

    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        const tendency = Number(parsed.playerTendency?.[row]?.[col]);
        const bias = Number(parsed.cpuBias?.[row]?.[col]);
        playerTendency[row][col] = Number.isFinite(tendency) ? Math.max(0, tendency) : 0;
        cpuBias[row][col] = Number.isFinite(bias) ? clamp(bias, -LEARNING_CELL_CLAMP, LEARNING_CELL_CLAMP) : 0;
      }
    }

    const totalPlayerMoves = Number(parsed.totalPlayerMoves);
    return {
      playerTendency,
      cpuBias,
      totalPlayerMoves: Number.isFinite(totalPlayerMoves) ? Math.max(0, totalPlayerMoves) : 0,
    };
  } catch {
    return createDefaultLearning();
  }
}

function saveLearningState(learning) {
  try {
    const auth = readStoredAuth();
    const scopedKey = scopedStorageKey(OTHELLO_LEARNING_KEY, auth?.userId || "");
    localStorage.setItem(scopedKey, JSON.stringify(learning));
  } catch {
    // Ignore storage errors to keep gameplay uninterrupted.
  }
}

function moveKey(move) {
  return `${move.row}-${move.col}`;
}

function ensureKillerEntry(searchState, ply) {
  if (!searchState?.killerMoves) return [];
  const existing = searchState.killerMoves.get(ply);
  if (existing) return existing;
  const created = [];
  searchState.killerMoves.set(ply, created);
  return created;
}

function registerKillerMove(searchState, ply, move) {
  if (!searchState?.killerMoves) return;
  const killers = ensureKillerEntry(searchState, ply);
  const key = moveKey(move);
  if (killers[0] === key) return;
  if (killers[1] === key) {
    killers[1] = killers[0];
    killers[0] = key;
    return;
  }
  killers[1] = killers[0];
  killers[0] = key;
}

function registerHistoryMove(searchState, move, depth) {
  if (!searchState?.historyTable) return;
  const bonus = Math.max(1, depth * depth);
  searchState.historyTable[move.row][move.col] += bonus;
}

function moveOrderScore(board, playerToMove, move, depthOrPly, searchState) {
  let score = scoreMove(board, playerToMove, move);

  if (searchState?.historyTable) {
    score += searchState.historyTable[move.row][move.col] * 0.22;
  }

  if (searchState?.killerMoves) {
    const killers = searchState.killerMoves.get(depthOrPly);
    if (killers?.includes(moveKey(move))) {
      score += 10000;
    }
  }

  return score;
}

function boardKey(board, playerToMove, depth, phaseTag) {
  let key = `${phaseTag}|${playerToMove}|${depth}|`;
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      key += board[row][col];
    }
  }
  return key;
}

function ttGet(searchState, key) {
  return searchState?.tt?.get(key);
}

function ttSet(searchState, key, value) {
  if (!searchState?.tt) return;
  const maxEntries = Math.max(10000, searchState.ttMaxEntries ?? TT_MAX_ENTRIES);
  if (searchState.tt.size >= maxEntries) {
    searchState.tt.clear();
  }
  searchState.tt.set(key, value);
}

function shouldStopSearch(searchState) {
  if (!searchState) return false;

  searchState.nodes = (searchState.nodes ?? 0) + 1;
  if ((searchState.maxNodes ?? Infinity) <= searchState.nodes) {
    searchState.timedOut = true;
    return true;
  }

  if (performance.now() >= searchState.deadline) {
    searchState.timedOut = true;
    return true;
  }

  return false;
}

export function initGame(options = {}) {
  const boardEl = document.getElementById("board");
  const blackCountEl = document.getElementById("blackCount");
  const whiteCountEl = document.getElementById("whiteCount");
  const turnTextEl = document.getElementById("turnText");
  const turnTimerTextEl = document.getElementById("turnTimerText");
  const messageEl = document.getElementById("message");
  const overlay = document.getElementById("overlay");
  const startBtn = document.getElementById("startBtn");
  const remakeBtn = document.getElementById("remakeBtn");
  const menuBtn = document.getElementById("menuBtn");
  const modeSelect = document.getElementById("modeSelect");
  const difficultySelect = document.getElementById("difficultySelect");
  const difficultyCurrentTextEl = document.getElementById("difficultyCurrentText");
  const turnOrderSelect = document.getElementById("turnOrderSelect");
  const handicapMetric = document.getElementById("handicapMetric");
  const handicapSelect = document.getElementById("handicapSelect");
  const handicapTargetMetric = document.getElementById("handicapTargetMetric");
  const handicapTargetSelect = document.getElementById("handicapTargetSelect");
  const bothBlackHandicapMetric = document.getElementById("bothBlackHandicapMetric");
  const bothWhiteHandicapMetric = document.getElementById("bothWhiteHandicapMetric");
  const bothBlackHandicapSelect = document.getElementById("bothBlackHandicapSelect");
  const bothWhiteHandicapSelect = document.getElementById("bothWhiteHandicapSelect");
  const overwriteLimitMetric = document.getElementById("overwriteLimitMetric");
  const overwriteLimitSelect = document.getElementById("overwriteLimitSelect");
  const bothBlackOverwriteMetric = document.getElementById("bothBlackOverwriteMetric");
  const bothWhiteOverwriteMetric = document.getElementById("bothWhiteOverwriteMetric");
  const bothBlackOverwriteSelect = document.getElementById("bothBlackOverwriteSelect");
  const bothWhiteOverwriteSelect = document.getElementById("bothWhiteOverwriteSelect");
  const randomLineCountIgnoreMetric = document.getElementById("randomLineCountIgnoreMetric");
  const randomLineCountIgnoreSelect = document.getElementById("randomLineCountIgnoreSelect");
  const destroyLimitPanel = document.getElementById("destroyLimitPanel");
  const destroyLimitWhitePanel = document.getElementById("destroyLimitWhitePanel");
  const destroyLimitBlackSelect = document.getElementById("destroyLimitBlackSelect");
  const destroyLimitWhiteSelect = document.getElementById("destroyLimitWhiteSelect");
  const sideBlackCard = document.getElementById("sideBlackCard");
  const sideWhiteCard = document.getElementById("sideWhiteCard");
  const othelloPlayArea = document.getElementById("othelloPlayArea");
  const othelloSkillPanel = document.getElementById("othelloSkillPanel");
  const immutablePlaceBtn = document.getElementById("immutablePlaceBtn");
  const doubleActionBtn = document.getElementById("doubleActionBtn");
  const destroySkillBtn = document.getElementById("destroySkillBtn");
  const chaosOverwriteTextEl = document.getElementById("chaosOverwriteText");
  const doubleActionStockTextEl = document.getElementById("doubleActionStockText");
  const i18nLang = () => (document.documentElement.getAttribute("lang") || "ja").toLowerCase();
  const t = (ja, ko) => (i18nLang().startsWith("ko") ? ko : ja);

  function normalizeOverwriteLimit(value) {
    const parsed = Number.parseInt(String(value ?? "3"), 10);
    if (!Number.isFinite(parsed)) return 3;
    return clamp(parsed, 0, 8);
  }

  function normalizeDestroyLimit(value) {
    const parsed = Number.parseInt(String(value ?? "1"), 10);
    if (!Number.isFinite(parsed)) return 1;
    return clamp(parsed, 0, 8);
  }

  function normalizeNonNegativeInt(value, fallback = 0, cap = 99) {
    const parsed = Number.parseInt(String(value ?? fallback), 10);
    if (!Number.isFinite(parsed)) return fallback;
    return clamp(parsed, 0, cap);
  }

  function normalizeToggle(value) {
    return String(value ?? "off").toLowerCase() === "on";
  }

  function normalizeOwnerType(value) {
    return value === "none" || value === "white" || value === "player" || value === "opponent" || value === "both" || value === "black"
      ? value
      : "none";
  }

  function normalizeHandicapType(value) {
    return HANDICAP_PATTERNS[value] ? value : "none";
  }

  const state = {
    board: createInitialBoard(),
    currentPlayer: BLACK,
    gameOver: false,
    gameMode:
      modeSelect?.value === "local"
        ? "local"
        : modeSelect?.value === "cpuvscpu"
          ? "cpuvscpu"
          : modeSelect?.value === "chaos"
            ? "chaos"
            : "cpu",
    roomCode: null,
    roomRole: null,
    roomPlayer: BLACK,
    roomRuleMode: "local",
    roomLocked: false,
    roomLockMessage: "",
    roomSyncPending: false,
    overwriteRemaining: { [BLACK]: 3, [WHITE]: 3 },
    overwriteLimit: normalizeOverwriteLimit(overwriteLimitSelect?.value),
    randomLineCountIgnoreEnabled: normalizeToggle(randomLineCountIgnoreSelect?.value),
    randomLineCountIgnoreLine: null,
    bothOverwriteLimit: {
      [BLACK]: normalizeOverwriteLimit(bothBlackOverwriteSelect?.value ?? overwriteLimitSelect?.value),
      [WHITE]: normalizeOverwriteLimit(bothWhiteOverwriteSelect?.value ?? overwriteLimitSelect?.value),
    },
    immutableDiscs: createFalseMatrix(),
    immutablePlaceCharges: { [BLACK]: 0, [WHITE]: 0 },
    immutablePlaceArmed: { [BLACK]: false, [WHITE]: false },
    destroySkillArmed: { [BLACK]: false, [WHITE]: false },
    destroySkillSelectedSelfSacrifices: { [BLACK]: [], [WHITE]: [] },
    destroySkillRemaining: {
      [BLACK]: normalizeDestroyLimit(destroyLimitBlackSelect?.value),
      [WHITE]: normalizeDestroyLimit(destroyLimitWhiteSelect?.value),
    },
    destroySkillLimit: {
      [BLACK]: normalizeDestroyLimit(destroyLimitBlackSelect?.value),
      [WHITE]: normalizeDestroyLimit(destroyLimitWhiteSelect?.value),
    },
    firstCornerTakenBonusUsed: false,
    doubleActionCharges: { [BLACK]: 0, [WHITE]: 0 },
    doubleActionArmed: { [BLACK]: false, [WHITE]: false },
    cornerLossStreak: { [BLACK]: 0, [WHITE]: 0 },
    drawVotes: { [BLACK]: false, [WHITE]: false },
    cpuPlayer: WHITE,
    playerSide: BLACK,
    learning: loadLearningState(),
    opponentModel: createZeroMatrix(),
    opponentModelTotal: 0,
    cpuMovesThisGame: [],
    cpuTimerId: null,
    turnTimerId: null,
    turnRemainingSec: TURN_LIMIT_SEC,
    difficulty: DIFFICULTY_SETTINGS[difficultySelect?.value] ? difficultySelect.value : "normal",
    turnOrder: turnOrderSelect?.value || "player-first",
    handicapType: normalizeHandicapType(handicapSelect?.value),
    handicapTarget: normalizeOwnerType(handicapTargetSelect?.value),
    bothHandicapType: {
      [BLACK]: normalizeHandicapType(bothBlackHandicapSelect?.value),
      [WHITE]: normalizeHandicapType(bothWhiteHandicapSelect?.value),
    },
  };

  // Always start from normal difficulty as requested.
  if (difficultySelect) {
    difficultySelect.value = "normal";
  }
  state.difficulty = "normal";

  function updateTimerText() {
    if (!turnTimerTextEl) return;
    if (isRoomMode()) {
      turnTimerTextEl.textContent = "残り-秒";
      return;
    }
    turnTimerTextEl.textContent = `残り${state.turnRemainingSec}秒`;
  }

  function getOverwriteLimitFor(player) {
    if (state.handicapTarget === "both") {
      return normalizeOverwriteLimit(state.bothOverwriteLimit[player]);
    }
    return normalizeOverwriteLimit(state.overwriteLimit);
  }

  function getDestroyLimitFor(player) {
    const targets = new Set(resolveConfiguredOwners(state.handicapTarget));
    if (!targets.has(player)) return 0;
    return normalizeDestroyLimit(state.destroySkillLimit[player]);
  }

  function stopTurnTimer({ reset = false } = {}) {
    clearInterval(state.turnTimerId);
    state.turnTimerId = null;
    if (reset) {
      state.turnRemainingSec = TURN_LIMIT_SEC;
    }
    updateTimerText();
  }

  function onTurnTimeout() {
    if (state.gameOver || state.roomLocked) return;

    if (!isRoomMode()) {
      const timedOutPlayer = state.currentPlayer;
      const validMoves = getValidMoves(state.board, timedOutPlayer, { allowChaosOverwrite: isChaosMode() });

      if (validMoves.length > 0) {
        const move = validMoves[Math.floor(Math.random() * validMoves.length)];
        placeMove(move.row, move.col, timedOutPlayer, move.flips);

        if (isHumanVsCpuMode() && timedOutPlayer !== state.cpuPlayer) {
          recordPlayerMove(move.row, move.col);
        }

        messageEl.textContent = `${getDisplayName(timedOutPlayer)}は時間切れのためランダム配置されました`;
        nextTurnOrFinish();
        render();
        scheduleCpuMove();
        return;
      }
    }

    state.gameOver = true;
    clearTimeout(state.cpuTimerId);
    state.cpuTimerId = null;
    stopTurnTimer();

    const winner = opponentOf(state.currentPlayer);
    overlay.textContent = `時間切れ: ${outcomeTextForWinner(winner)}`;
    overlay.style.opacity = "1";
    messageEl.textContent = `${getDisplayName(state.currentPlayer)}が時間切れになりました`;
    render();
  }

  function startTurnTimer() {
    stopTurnTimer();
    if (state.gameOver || state.roomLocked) return;
    if (isRoomMode()) {
      return;
    }

    const deadline = Date.now() + TURN_LIMIT_SEC * 1000;
    state.turnRemainingSec = TURN_LIMIT_SEC;
    updateTimerText();

    state.turnTimerId = setInterval(() => {
      const remain = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      if (remain !== state.turnRemainingSec) {
        state.turnRemainingSec = remain;
        updateTimerText();
      }
      if (remain <= 0) {
        stopTurnTimer();
        onTurnTimeout();
      }
    }, 200);
  }

  function isLocalMode() {
    return state.gameMode === "local";
  }

  function isChaosMode() {
    return state.gameMode === "chaos" || (isRoomMode() && state.roomRuleMode === "chaos");
  }

  function isRoomMode() {
    return state.gameMode === "room";
  }

  function isHumanVsCpuMode() {
    return !isLocalMode() && !isChaosMode() && !isRoomMode() && !isCpuVsCpuMode();
  }

  function isCpuVsCpuMode() {
    return state.gameMode === "cpuvscpu";
  }

  function getThinkingMessage(player = state.currentPlayer) {
    return isCpuVsCpuMode()
      ? `${getDisplayName(player)}CPU（${getDifficultyLabel()}）が考えています...`
      : `CPU（${getDifficultyLabel()}）が考えています...`;
  }

  function recordPlayerMove(row, col) {
    if (!isHumanVsCpuMode()) return;
    state.learning.playerTendency[row][col] += 1;
    state.learning.totalPlayerMoves += 1;

    // Per-match adaptation to the current opponent's habits.
    state.opponentModel[row][col] += 1;
    state.opponentModelTotal += 1;
    if (state.opponentModelTotal > 220) {
      for (let r = 0; r < SIZE; r += 1) {
        for (let c = 0; c < SIZE; c += 1) {
          state.opponentModel[r][c] *= 0.82;
        }
      }
      state.opponentModelTotal = Math.floor(state.opponentModelTotal * 0.82);
    }

    // Soft decay keeps older behavior from dominating forever.
    if (state.learning.totalPlayerMoves > 2400) {
      for (let r = 0; r < SIZE; r += 1) {
        for (let c = 0; c < SIZE; c += 1) {
          state.learning.playerTendency[r][c] *= 0.75;
        }
      }
      state.learning.totalPlayerMoves = Math.floor(state.learning.totalPlayerMoves * 0.75);
    }

    saveLearningState(state.learning);
  }

  function applyOutcomeLearning(cpuWon, draw) {
    if (!isHumanVsCpuMode() || state.cpuMovesThisGame.length === 0) return;

    const delta = draw ? 0 : cpuWon ? LEARNING_REWARD : -LEARNING_REWARD;
    if (delta !== 0) {
      state.cpuMovesThisGame.forEach(({ row, col }) => {
        const next = state.learning.cpuBias[row][col] + delta;
        state.learning.cpuBias[row][col] = clamp(next, -LEARNING_CELL_CLAMP, LEARNING_CELL_CLAMP);
      });
      saveLearningState(state.learning);
    }
  }

  function updateModeUiState() {
    const hasHandicapTarget = state.handicapTarget !== "none";
    if (difficultySelect) {
      difficultySelect.disabled = isLocalMode() || isRoomMode();
    }
    if (turnOrderSelect) {
      turnOrderSelect.disabled = state.gameMode !== "cpu";
      turnOrderSelect.value = state.turnOrder;
    }
    if (modeSelect) {
      if (isRoomMode()) {
        modeSelect.value = state.roomRuleMode === "chaos" ? "chaos" : "local";
      } else {
        modeSelect.value = state.gameMode;
      }
      modeSelect.disabled = isRoomMode() && state.roomRole !== "host";
    }
    if (handicapMetric) {
      handicapMetric.classList.toggle("hidden", !isChaosMode() || !hasHandicapTarget);
    }
    if (handicapTargetMetric) {
      handicapTargetMetric.classList.toggle("hidden", !isChaosMode());
    }
    if (handicapSelect) {
      const shouldDisable = !hasHandicapTarget || state.handicapTarget === "both" || (isRoomMode() && state.roomRole !== "host");
      handicapSelect.disabled = shouldDisable;
      handicapSelect.value = state.handicapType;
    }
    if (handicapTargetSelect) {
      handicapTargetSelect.disabled = isRoomMode() && state.roomRole !== "host";
      handicapTargetSelect.value = state.handicapTarget;
    }
    if (bothBlackHandicapMetric) {
      bothBlackHandicapMetric.classList.toggle("hidden", !isChaosMode() || state.handicapTarget !== "both");
    }
    if (bothWhiteHandicapMetric) {
      bothWhiteHandicapMetric.classList.toggle("hidden", !isChaosMode() || state.handicapTarget !== "both");
    }
    if (bothBlackHandicapSelect) {
      const shouldDisable = state.handicapTarget !== "both" || (isRoomMode() && state.roomRole !== "host");
      bothBlackHandicapSelect.disabled = shouldDisable;
      bothBlackHandicapSelect.value = state.bothHandicapType[BLACK];
    }
    if (bothWhiteHandicapSelect) {
      const shouldDisable = state.handicapTarget !== "both" || (isRoomMode() && state.roomRole !== "host");
      bothWhiteHandicapSelect.disabled = shouldDisable;
      bothWhiteHandicapSelect.value = state.bothHandicapType[WHITE];
    }
    const visibleOwners = new Set(resolveConfiguredOwners(state.handicapTarget));
    if (sideBlackCard) {
      sideBlackCard.classList.toggle("hidden", !isChaosMode() || !hasHandicapTarget || !visibleOwners.has(BLACK));
    }
    if (sideWhiteCard) {
      sideWhiteCard.classList.toggle("hidden", !isChaosMode() || !hasHandicapTarget || !visibleOwners.has(WHITE));
    }
    if (overwriteLimitMetric) {
      overwriteLimitMetric.classList.toggle("hidden", !isChaosMode() || !hasHandicapTarget || state.handicapTarget === "both");
    }
    if (randomLineCountIgnoreMetric) {
      randomLineCountIgnoreMetric.classList.toggle("hidden", !isChaosMode());
    }
    if (bothBlackOverwriteMetric) {
      bothBlackOverwriteMetric.classList.toggle("hidden", !isChaosMode() || state.handicapTarget !== "both");
    }
    if (bothWhiteOverwriteMetric) {
      bothWhiteOverwriteMetric.classList.toggle("hidden", !isChaosMode() || state.handicapTarget !== "both");
    }
    if (overwriteLimitSelect) {
      const shouldDisable = !isChaosMode() || !hasHandicapTarget || state.handicapTarget === "both" || (isRoomMode() && state.roomRole !== "host");
      overwriteLimitSelect.disabled = shouldDisable;
      overwriteLimitSelect.value = String(state.overwriteLimit);
    }
    if (randomLineCountIgnoreSelect) {
      const shouldDisable = !isChaosMode() || (isRoomMode() && state.roomRole !== "host");
      randomLineCountIgnoreSelect.disabled = shouldDisable;
      randomLineCountIgnoreSelect.value = state.randomLineCountIgnoreEnabled ? "on" : "off";
    }
    if (bothBlackOverwriteSelect) {
      const shouldDisable = !isChaosMode() || state.handicapTarget !== "both" || (isRoomMode() && state.roomRole !== "host");
      bothBlackOverwriteSelect.disabled = shouldDisable;
      bothBlackOverwriteSelect.value = String(state.bothOverwriteLimit[BLACK]);
    }
    if (bothWhiteOverwriteSelect) {
      const shouldDisable = !isChaosMode() || state.handicapTarget !== "both" || (isRoomMode() && state.roomRole !== "host");
      bothWhiteOverwriteSelect.disabled = shouldDisable;
      bothWhiteOverwriteSelect.value = String(state.bothOverwriteLimit[WHITE]);
    }
    if (destroyLimitPanel) {
      destroyLimitPanel.classList.toggle(
        "hidden",
        !isChaosMode() || !hasHandicapTarget || !visibleOwners.has(BLACK),
      );
    }
    if (destroyLimitWhitePanel) {
      destroyLimitWhitePanel.classList.toggle(
        "hidden",
        !isChaosMode() || !hasHandicapTarget || !visibleOwners.has(WHITE),
      );
    }
    if (destroyLimitBlackSelect) {
      const shouldDisable =
        !isChaosMode() || !hasHandicapTarget || !visibleOwners.has(BLACK) || (isRoomMode() && state.roomRole !== "host");
      destroyLimitBlackSelect.disabled = shouldDisable;
      destroyLimitBlackSelect.value = String(state.destroySkillLimit[BLACK]);
    }
    if (destroyLimitWhiteSelect) {
      const shouldDisable =
        !isChaosMode() || !hasHandicapTarget || !visibleOwners.has(WHITE) || (isRoomMode() && state.roomRole !== "host");
      destroyLimitWhiteSelect.disabled = shouldDisable;
      destroyLimitWhiteSelect.value = String(state.destroySkillLimit[WHITE]);
    }
    if (othelloSkillPanel) {
      othelloSkillPanel.classList.toggle("hidden", !isChaosMode());
    }
    if (othelloPlayArea) {
      othelloPlayArea.classList.toggle("othello-play-area-chaos", isChaosMode());
    }
    if (immutablePlaceBtn) {
      const current = state.currentPlayer;
      const hasImmutableSkill =
        Boolean(state.immutablePlaceArmed[current]) || (state.immutablePlaceCharges[current] ?? 0) > 0;
      const canActivate =
        isChaosMode() &&
        hasImmutableSkill &&
        !state.gameOver &&
        !state.roomLocked &&
        isLocalPlayersTurn() &&
        (state.immutablePlaceArmed[current] || (state.immutablePlaceCharges[current] ?? 0) > 0);
      immutablePlaceBtn.disabled = !canActivate;
      immutablePlaceBtn.classList.toggle("hidden", !isChaosMode() || !hasImmutableSkill);
      immutablePlaceBtn.classList.toggle("skill-armed", Boolean(state.immutablePlaceArmed[current]));
    }
    if (destroySkillBtn) {
      const current = state.currentPlayer;
      const canActivate =
        isChaosMode() &&
        !state.gameOver &&
        !state.roomLocked &&
        isLocalPlayersTurn() &&
        (state.destroySkillArmed[current] || (state.destroySkillRemaining[current] ?? 0) > 0);
      destroySkillBtn.disabled = !canActivate;
      destroySkillBtn.classList.toggle("hidden", !isChaosMode());
      destroySkillBtn.classList.toggle("skill-armed", Boolean(state.destroySkillArmed[current]));
    }
    if (doubleActionBtn) {
      const current = state.currentPlayer;
      let buttonOwner = current;
      if (isRoomMode()) {
        buttonOwner = state.roomPlayer;
      } else if (state.gameMode === "cpu") {
        buttonOwner = state.playerSide;
      }
      const stock = state.doubleActionCharges[buttonOwner] ?? 0;
      const hasDoubleActionSkill =
        Boolean(state.doubleActionArmed[buttonOwner]) || (state.doubleActionCharges[buttonOwner] ?? 0) > 0;
      const armedNow = Boolean(state.doubleActionArmed[current]);
      const canActivate =
        isChaosMode() &&
        !state.gameOver &&
        !state.roomLocked &&
        isLocalPlayersTurn() &&
        (state.doubleActionArmed[current] || (state.doubleActionCharges[current] ?? 0) > 0);
      doubleActionBtn.disabled = !canActivate;
      doubleActionBtn.classList.toggle("hidden", !isChaosMode() || !hasDoubleActionSkill);
      doubleActionBtn.classList.toggle("skill-armed", armedNow);
      if (armedNow) {
        doubleActionBtn.textContent = t(`2回行動 待機中 (${stock})`, `더블 액션 대기 (${stock})`);
      } else {
        doubleActionBtn.textContent = t(`2回行動 (${stock})`, `더블 액션 (${stock})`);
      }
    }
    if (startBtn) {
      startBtn.disabled = isRoomMode() && state.roomRole !== "host";
    }
    if (chaosOverwriteTextEl) {
      chaosOverwriteTextEl.classList.toggle("hidden", !isChaosMode());
    }
    if (doubleActionStockTextEl) {
      doubleActionStockTextEl.classList.toggle("hidden", !isChaosMode());
    }
    updateDifficultyIndicator();
  }

  function getDifficultySetting() {
    return DIFFICULTY_SETTINGS[state.difficulty] ?? DIFFICULTY_SETTINGS.normal;
  }

  function getDifficultyLabel() {
    return getDifficultySetting().label;
  }

  function updateDifficultyIndicator({ emphasize = false } = {}) {
    if (!difficultyCurrentTextEl) return;
    difficultyCurrentTextEl.textContent = `現在: ${getDifficultyLabel()}`;
    if (!emphasize) return;

    difficultyCurrentTextEl.classList.remove("flash");
    // Force reflow so repeated changes still trigger animation.
    void difficultyCurrentTextEl.offsetWidth;
    difficultyCurrentTextEl.classList.add("flash");
  }

  function applyOpeningConfig() {
    state.currentPlayer = BLACK;

    if (state.gameMode !== "cpu") {
      state.playerSide = BLACK;
      state.cpuPlayer = WHITE;
      return;
    }

    let order = state.turnOrder;
    if (order === "random") {
      order = Math.random() < 0.5 ? "player-first" : "player-second";
    }

    if (order === "player-second") {
      state.playerSide = WHITE;
      state.cpuPlayer = BLACK;
      return;
    }

    state.playerSide = BLACK;
    state.cpuPlayer = WHITE;
  }

  function createInitialBoard() {
    const board = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => EMPTY));
    board[3][3] = WHITE;
    board[3][4] = BLACK;
    board[4][3] = BLACK;
    board[4][4] = WHITE;
    return board;
  }

  function resolveConfiguredOwner(ownerType) {
    if (ownerType === "none") return null;
    if (ownerType === "white") return WHITE;
    if (ownerType === "player") {
      if (state.gameMode === "cpu") return state.playerSide;
      if (isRoomMode()) return state.roomPlayer;
      return BLACK;
    }
    if (ownerType === "opponent") {
      if (state.gameMode === "cpu") return state.cpuPlayer;
      if (isRoomMode()) return opponentOf(state.roomPlayer);
      return WHITE;
    }
    return BLACK;
  }

  function resolveConfiguredOwners(ownerType) {
    if (ownerType === "none") {
      return [];
    }
    if (ownerType === "both") {
      return [BLACK, WHITE];
    }
    const owner = resolveConfiguredOwner(ownerType);
    return owner === BLACK || owner === WHITE ? [owner] : [];
  }

  function resolveHandicapPlayers() {
    return resolveConfiguredOwners(state.handicapTarget);
  }

  function resetImmutablePlacementState() {
    state.immutableDiscs = createFalseMatrix();
    state.immutablePlaceArmed[BLACK] = false;
    state.immutablePlaceArmed[WHITE] = false;
    state.destroySkillArmed[BLACK] = false;
    state.destroySkillArmed[WHITE] = false;
    state.destroySkillSelectedSelfSacrifices[BLACK] = [];
    state.destroySkillSelectedSelfSacrifices[WHITE] = [];
    state.immutablePlaceCharges[BLACK] = 0;
    state.immutablePlaceCharges[WHITE] = 0;

    if (!isChaosMode()) return;

    if (state.handicapTarget === "both") {
      if (state.bothHandicapType[BLACK] === "immutable1") {
        state.immutablePlaceCharges[BLACK] = (state.immutablePlaceCharges[BLACK] ?? 0) + 1;
      }
      if (state.bothHandicapType[WHITE] === "immutable1") {
        state.immutablePlaceCharges[WHITE] = (state.immutablePlaceCharges[WHITE] ?? 0) + 1;
      }
      return;
    }

    if (state.handicapType !== "immutable1") return;
    const owners = resolveHandicapPlayers();
    owners.forEach((owner) => {
      state.immutablePlaceCharges[owner] = (state.immutablePlaceCharges[owner] ?? 0) + 1;
    });
  }

  function applyOpeningHandicap() {
    resetImmutablePlacementState();

    const cells = HANDICAP_PATTERNS[state.handicapType] ?? HANDICAP_PATTERNS.none;
    const owners = resolveHandicapPlayers();
    const fallbackOwner = owners[0] ?? BLACK;

    cells.forEach(([row, col], index) => {
      state.board[row][col] = owners[index] ?? fallbackOwner;
    });
  }

  function isImmutableDisc(row, col) {
    return Boolean(state.immutableDiscs?.[row]?.[col]);
  }

  function isInteriorCell(row, col) {
    return row > 0 && row < SIZE - 1 && col > 0 && col < SIZE - 1;
  }

  function canPlaceImmutableDisc(player, row, col) {
    return (
      isChaosMode() &&
      ((state.immutablePlaceCharges[player] ?? 0) > 0 || state.immutablePlaceArmed[player]) &&
      isInteriorCell(row, col) &&
      state.board[row][col] === player &&
      !isImmutableDisc(row, col) &&
      (state.immutablePlaceCharges[player] ?? 0) > 0
    );
  }

  function isDestroySacrificeCell(player, row, col) {
    return isCorner(row, col) && state.board[row][col] === player && !isImmutableDisc(row, col);
  }

  function isDestroySelfSacrificeCell(player, row, col) {
    return state.board[row][col] === player && !isImmutableDisc(row, col);
  }

  function isDestroyTargetCell(player, row, col) {
    return state.board[row][col] === opponentOf(player) && !isImmutableDisc(row, col);
  }

  function countDestroyCandidates(player) {
    const cornerSacrifices = [];
    const selfSacrifices = [];
    const targets = [];
    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        if (isDestroySacrificeCell(player, row, col)) cornerSacrifices.push({ row, col });
        if (isDestroySelfSacrificeCell(player, row, col)) selfSacrifices.push({ row, col });
        if (isDestroyTargetCell(player, row, col)) targets.push({ row, col });
      }
    }
    return { cornerSacrifices, selfSacrifices, targets };
  }

  function canUseDestroySkill(player) {
    if (!isChaosMode()) return false;
    const targetOwners = new Set(resolveConfiguredOwners(state.handicapTarget));
    if (!targetOwners.has(player)) return false;
    if ((state.destroySkillRemaining[player] ?? 0) <= 0) return false;
    const { cornerSacrifices, selfSacrifices, targets } = countDestroyCandidates(player);
    if (cornerSacrifices.length >= 1 && targets.length >= CORNER_SACRIFICE_DESTROY_COUNT) {
      return true;
    }
    return (
      cornerSacrifices.length === 0 &&
      selfSacrifices.length >= NO_CORNER_SACRIFICE_COUNT &&
      targets.length >= NO_CORNER_DESTROY_COUNT
    );
  }

  function pickRandomCells(cells, count) {
    const pool = [...cells];
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, Math.max(0, count));
  }

  function executeDestroySkill(player, sacrifices, destroyedTargets, { isRemote = false } = {}) {
    if (!Array.isArray(sacrifices) || sacrifices.length === 0 || !Array.isArray(destroyedTargets)) {
      return false;
    }
    if ((state.destroySkillRemaining[player] ?? 0) <= 0) {
      return false;
    }

    const sacrificeKeys = new Set(sacrifices.map(({ row, col }) => `${row}-${col}`));
    if (sacrificeKeys.size !== sacrifices.length) return false;
    const targetKeys = new Set(destroyedTargets.map(({ row, col }) => `${row}-${col}`));
    if (targetKeys.size !== destroyedTargets.length) return false;

    const { cornerSacrifices } = countDestroyCandidates(player);
    const hasCorner = cornerSacrifices.length > 0;

    if (hasCorner) {
      if (sacrifices.length !== 1 || destroyedTargets.length !== CORNER_SACRIFICE_DESTROY_COUNT) return false;
      const [corner] = sacrifices;
      if (!isDestroySacrificeCell(player, corner.row, corner.col)) return false;
    } else {
      if (sacrifices.length !== NO_CORNER_SACRIFICE_COUNT || destroyedTargets.length !== NO_CORNER_DESTROY_COUNT) {
        return false;
      }
      const validSacrifices = sacrifices.every(({ row, col }) => isDestroySelfSacrificeCell(player, row, col));
      if (!validSacrifices) return false;
    }

    const validTargets = destroyedTargets.every(({ row, col }) => isDestroyTargetCell(player, row, col));
    if (!validTargets) return false;

    sacrifices.forEach(({ row, col }) => {
      state.board[row][col] = EMPTY;
    });
    destroyedTargets.forEach(({ row, col }) => {
      state.board[row][col] = EMPTY;
    });

    state.destroySkillArmed[player] = false;
    state.destroySkillSelectedSelfSacrifices[player] = [];
    state.destroySkillRemaining[player] = Math.max(0, (state.destroySkillRemaining[player] ?? 0) - 1);

    if (isRoomMode() && !isRemote) {
      options.onRoomMove?.({ action: "destroy-skill", sacrifices, destroyedTargets });
    }

    if (sacrifices.length === 1) {
      messageEl.textContent = `${getDisplayName(player)}が角を犠牲にして敵駒3つを破壊しました（残り${state.destroySkillRemaining[player]}回）`;
    } else {
      messageEl.textContent = `${getDisplayName(player)}が自駒2つを犠牲にして敵駒1つを破壊しました（残り${state.destroySkillRemaining[player]}回）`;
    }
    nextTurnOrFinish({ forcedPlayer: player });
    render();
    scheduleCpuMove();
    return true;
  }

  function handleDestroySkillClick(row, col, { isRemote = false } = {}) {
    if (state.gameOver) return false;
    if (!isRemote && !isLocalPlayersTurn()) return false;

    const player = state.currentPlayer;
    const armed = isRemote ? true : Boolean(state.destroySkillArmed[player]);
    if (!armed) return false;

    const { cornerSacrifices, selfSacrifices, targets } = countDestroyCandidates(player);
    if (cornerSacrifices.length > 0) {
      if (!isDestroySacrificeCell(player, row, col)) return false;
      if (targets.length < CORNER_SACRIFICE_DESTROY_COUNT) return false;
      const destroyedTargets = pickRandomCells(targets, CORNER_SACRIFICE_DESTROY_COUNT);
      return executeDestroySkill(player, [{ row, col }], destroyedTargets, { isRemote });
    }

    if (selfSacrifices.length < NO_CORNER_SACRIFICE_COUNT || targets.length < NO_CORNER_DESTROY_COUNT) return false;

    const selected = state.destroySkillSelectedSelfSacrifices[player] ?? [];
    const selectedIndex = selected.findIndex((cell) => cell.row === row && cell.col === col);
    const awaitingTarget = selected.length >= NO_CORNER_SACRIFICE_COUNT;

    if (awaitingTarget && isDestroyTargetCell(player, row, col)) {
      return executeDestroySkill(player, selected, [{ row, col }], { isRemote });
    }

    if (selectedIndex >= 0) {
      const nextSelected = selected.filter((_, idx) => idx !== selectedIndex);
      state.destroySkillSelectedSelfSacrifices[player] = nextSelected;
      messageEl.textContent = `${getDisplayName(player)}は犠牲駒の選択を解除しました（${nextSelected.length}/${NO_CORNER_SACRIFICE_COUNT}）`;
      render();
      return true;
    }

    if (!isDestroySelfSacrificeCell(player, row, col)) return false;

    if (selected.length >= NO_CORNER_SACRIFICE_COUNT) {
      state.destroySkillSelectedSelfSacrifices[player] = [{ row, col }];
      messageEl.textContent = `${getDisplayName(player)}は犠牲にする自駒をもう1つ選択してください（1/${NO_CORNER_SACRIFICE_COUNT}）`;
      render();
      return true;
    }

    const nextSelected = [...selected, { row, col }];
    state.destroySkillSelectedSelfSacrifices[player] = nextSelected;
    if (nextSelected.length < NO_CORNER_SACRIFICE_COUNT) {
      messageEl.textContent = `${getDisplayName(player)}は犠牲にする自駒をもう1つ選択してください（${nextSelected.length}/${NO_CORNER_SACRIFICE_COUNT}）`;
      render();
      return true;
    }

    messageEl.textContent = `${getDisplayName(player)}は消す敵駒を1つ選択してください`;
    render();
    return true;
  }

  function placeImmutableDisc(row, col, { isRemote = false } = {}) {
    if (state.gameOver) return;
    if (!isRemote && !isLocalPlayersTurn()) return;

    const player = state.currentPlayer;
    const armed = isRemote ? true : Boolean(state.immutablePlaceArmed[player]);
    if (!armed) return;
    if (!canPlaceImmutableDisc(player, row, col)) {
      if (!isRemote) {
        if ((state.immutablePlaceCharges[player] ?? 0) <= 0) {
          messageEl.textContent = `${getDisplayName(player)}の固定石回数が不足しています`;
        } else if (state.board[row][col] !== player) {
          messageEl.textContent = `${getDisplayName(player)}は自分の駒を選択してください`;
        } else if (!isInteriorCell(row, col)) {
          messageEl.textContent = `${getDisplayName(player)}は内側の駒のみ固定できます`;
        } else if (isImmutableDisc(row, col)) {
          messageEl.textContent = `${getDisplayName(player)}はすでに固定済みの駒を選択しました`;
        } else {
          messageEl.textContent = `${getDisplayName(player)}は固定できる駒を選択してください`;
        }
        render();
      }
      return;
    }

    state.immutablePlaceArmed[player] = false;
    state.immutablePlaceCharges[player] = Math.max(0, (state.immutablePlaceCharges[player] ?? 0) - 1);
    state.immutableDiscs[row][col] = true;

    if (isRoomMode() && !isRemote) {
      options.onRoomMove?.({ action: "immutable-place", row, col });
    }

    messageEl.textContent = `${getDisplayName(player)}が固定石を指定しました`;
    nextTurnOrFinish({ forcedPlayer: player });
    render();
    scheduleCpuMove();
  }

  function resetGame({ fromRemote = false } = {}) {
    clearTimeout(state.cpuTimerId);
    state.cpuTimerId = null;
    stopTurnTimer({ reset: true });
    state.board = createInitialBoard();
    applyOpeningConfig();
    applyOpeningHandicap();
    state.gameOver = false;
    state.overwriteRemaining[BLACK] = getOverwriteLimitFor(BLACK);
    state.overwriteRemaining[WHITE] = getOverwriteLimitFor(WHITE);
    state.destroySkillRemaining[BLACK] = getDestroyLimitFor(BLACK);
    state.destroySkillRemaining[WHITE] = getDestroyLimitFor(WHITE);
    state.firstCornerTakenBonusUsed = false;
    state.randomLineCountIgnoreLine = null;
    state.doubleActionCharges[BLACK] = 0;
    state.doubleActionCharges[WHITE] = 0;
    state.doubleActionArmed[BLACK] = false;
    state.doubleActionArmed[WHITE] = false;
    state.cornerLossStreak[BLACK] = 0;
    state.cornerLossStreak[WHITE] = 0;
    resetDrawVotes();
    state.cpuMovesThisGame = [];
    state.opponentModel = createZeroMatrix();
    state.opponentModelTotal = 0;
    if (isRoomMode() && state.roomLocked) {
      overlay.style.opacity = "1";
      overlay.textContent = state.roomLockMessage || "対戦相手を待っています...";
    } else {
      overlay.style.opacity = "0";
      overlay.textContent = "";
    }
    if (isRoomMode()) {
      state.roomSyncPending = Boolean(fromRemote && state.roomRole !== "host");
      if (state.roomLocked) {
        messageEl.textContent = state.roomLockMessage || "対戦相手を待っています...";
      } else if (state.roomSyncPending) {
        messageEl.textContent = "ホストの盤面同期を待っています...";
      } else {
        messageEl.textContent =
          state.currentPlayer === state.roomPlayer ? "あなたの手番です" : "相手の手番です";
      }
      if (!fromRemote) {
        options.onRoomNewGame?.();
      }
    } else {
      state.roomSyncPending = false;
      messageEl.textContent = isLocalMode() || isChaosMode()
        ? "黒の手番です"
        : isCpuVsCpuMode()
          ? getThinkingMessage(BLACK)
          : isCpuTurn()
            ? getThinkingMessage(BLACK)
            : `${getDisplayName(state.currentPlayer)}（あなた）の手番です`;
    }
    updateModeUiState();
    render();
    startTurnTimer();
    scheduleCpuMove();
  }

  function enterStandby() {
    clearTimeout(state.cpuTimerId);
    state.cpuTimerId = null;
    stopTurnTimer({ reset: true });
    state.board = createInitialBoard();
    state.currentPlayer = BLACK;
    state.gameOver = true;
    state.roomLocked = false;
    state.roomLockMessage = "";
    state.roomSyncPending = false;
    resetImmutablePlacementState();
    state.overwriteRemaining[BLACK] = getOverwriteLimitFor(BLACK);
    state.overwriteRemaining[WHITE] = getOverwriteLimitFor(WHITE);
    state.destroySkillRemaining[BLACK] = getDestroyLimitFor(BLACK);
    state.destroySkillRemaining[WHITE] = getDestroyLimitFor(WHITE);
    state.firstCornerTakenBonusUsed = false;
    state.randomLineCountIgnoreLine = null;
    state.doubleActionCharges[BLACK] = 0;
    state.doubleActionCharges[WHITE] = 0;
    state.doubleActionArmed[BLACK] = false;
    state.doubleActionArmed[WHITE] = false;
    state.cornerLossStreak[BLACK] = 0;
    state.cornerLossStreak[WHITE] = 0;
    resetDrawVotes();
    overlay.style.opacity = "1";
    overlay.textContent = t("ゲーム開始で開始", "게임 시작으로 시작");
    messageEl.textContent = t("開始ボタンで開始してください", "시작 버튼을 눌러 시작하세요");
    updateModeUiState();
    render();
  }

  function getPlayerName(player) {
    return player === BLACK ? t("黒", "흑") : t("白", "백");
  }

  function getDisplayName(player) {
    return player === BLACK ? t("黒", "흑") : t("白", "백");
  }

  function outcomeName(player) {
    if (isRoomMode()) {
      return player === state.roomPlayer ? "あなた" : "相手";
    }
    if (isCpuVsCpuMode()) {
      return `${getDisplayName(player)}CPU`;
    }
    if (isHumanVsCpuMode()) {
      return player === state.cpuPlayer ? "CPU" : "あなた";
    }
    return getDisplayName(player);
  }

  function outcomeTextForWinner(winner) {
    const loser = opponentOf(winner);
    return `${outcomeName(winner)}: 勝ち / ${outcomeName(loser)}: 負け`;
  }

  function resetDrawVotes() {
    state.drawVotes[BLACK] = false;
    state.drawVotes[WHITE] = false;
  }

  function canUseDrawVote() {
    return isLocalMode() || isRoomMode();
  }

  function handleDrawByAgreement() {
    state.gameOver = true;
    clearTimeout(state.cpuTimerId);
    state.cpuTimerId = null;
    stopTurnTimer();
    overlay.textContent = "合意により引き分け";
    overlay.style.opacity = "1";
    messageEl.textContent = "双方の投票で引き分け成立";
    render();
  }

  function applyDrawVote(voter, { isRemote = false } = {}) {
    if (state.gameOver || !canUseDrawVote()) return;
    if (voter !== BLACK && voter !== WHITE) return;

    if (!state.drawVotes[voter]) {
      state.drawVotes[voter] = true;
      if (isRoomMode() && !isRemote) {
        options.onRoomDrawVote?.({ voter });
      }
    }

    if (state.drawVotes[BLACK] && state.drawVotes[WHITE]) {
      handleDrawByAgreement();
      return;
    }

    if (isRoomMode() && (state.roomPlayer === BLACK || state.roomPlayer === WHITE)) {
      const opponent = opponentOf(state.roomPlayer);
      if (state.drawVotes[opponent] && !state.drawVotes[state.roomPlayer]) {
        messageEl.textContent = t(
          "相手が再戦を希望しています。再戦ボタンで同意してください",
          "상대가 재대전을 요청했습니다. 재대전 버튼으로 동의하세요",
        );
      } else if (state.drawVotes[state.roomPlayer] && !state.drawVotes[opponent]) {
        messageEl.textContent = "リメイク希望を送信しました。相手の同意待ちです";
      } else {
        const waitingFor = state.drawVotes[BLACK] ? WHITE : BLACK;
        messageEl.textContent = `${getDisplayName(waitingFor)}の投票待ちです`;
      }
    } else {
      const waitingFor = state.drawVotes[BLACK] ? WHITE : BLACK;
      messageEl.textContent = `${getDisplayName(waitingFor)}の投票待ちです`;
    }
    render();
  }

  function onRemakeButtonClick() {
    const confirmed = window.confirm("リメイクします。よろしいですか？");
    if (!confirmed) {
      return;
    }

    if (!isRoomMode()) {
      enterStandby();
      return;
    }

    if (canUseDrawVote()) {
      const voter = isRoomMode() ? state.roomPlayer : state.currentPlayer;
      applyDrawVote(voter, { isRemote: false });
      return;
    }

    resetGame();
  }

  function opponentOf(player) {
    return player === BLACK ? WHITE : BLACK;
  }

  function inBounds(row, col) {
    return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
  }

  function isCorner(row, col) {
    return (row === 0 || row === SIZE - 1) && (col === 0 || col === SIZE - 1);
  }

  function isEdge(row, col) {
    return row === 0 || row === SIZE - 1 || col === 0 || col === SIZE - 1;
  }

  function isXSquare(row, col) {
    return (row === 1 || row === SIZE - 2) && (col === 1 || col === SIZE - 2);
  }

  function isCSquare(row, col) {
    const cSquares = [
      [0, 1],
      [1, 0],
      [0, SIZE - 2],
      [1, SIZE - 1],
      [SIZE - 2, 0],
      [SIZE - 1, 1],
      [SIZE - 2, SIZE - 1],
      [SIZE - 1, SIZE - 2],
    ];
    return cSquares.some(([r, c]) => r === row && c === col);
  }

  function getMoveCandidate(board, row, col, player, { allowChaosOverwrite = false } = {}) {
    if (!inBounds(row, col)) return null;

    const opponent = opponentOf(player);
    const cell = board[row][col];
    const isOverwrite =
      allowChaosOverwrite && isChaosMode() && cell === opponent && (state.overwriteRemaining[player] ?? 0) > 0;
    if (isOverwrite && isImmutableDisc(row, col)) return null;
    if (cell !== EMPTY && !isOverwrite) return null;

    const flips = [];

    for (const [dr, dc] of DIRECTIONS) {
      const line = [];
      let r = row + dr;
      let c = col + dc;

      while (inBounds(r, c) && board[r][c] === opponent) {
        line.push([r, c]);
        r += dr;
        c += dc;
      }

      if (line.length > 0 && inBounds(r, c) && board[r][c] === player) {
        flips.push(...line);
      }
    }

    if (flips.length === 0 && !isOverwrite) return null;

    return { row, col, flips, isOverwrite };
  }

  function getValidMoves(board, player, { allowChaosOverwrite = false } = {}) {
    const moves = [];
    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        const move = getMoveCandidate(board, row, col, player, { allowChaosOverwrite });
        if (move) {
          moves.push(move);
        }
      }
    }
    return moves;
  }

  function cloneBoard(board) {
    return board.map((line) => [...line]);
  }

  function countPieces(board) {
    let black = 0;
    let white = 0;

    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        if (board[row][col] === BLACK) black += 1;
        if (board[row][col] === WHITE) white += 1;
      }
    }

    return { black, white };
  }

  function countEmptyCells(board) {
    let empty = 0;
    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        if (board[row][col] === EMPTY) empty += 1;
      }
    }
    return empty;
  }

  function normalizeRandomLineCountIgnoreLine(value) {
    if (!value || typeof value !== "object") return null;
    const axis = value.axis === "col" ? "col" : value.axis === "row" ? "row" : null;
    if (!axis) return null;
    const index = normalizeNonNegativeInt(value.index, -1, SIZE - 1);
    if (index < 0 || index >= SIZE) return null;
    return { axis, index };
  }

  function pickRandomLineForCountIgnore() {
    return {
      axis: Math.random() < 0.5 ? "row" : "col",
      index: Math.floor(Math.random() * SIZE),
    };
  }

  function countPiecesWithIgnoredLine(board, ignoredLine) {
    if (!ignoredLine) return countPieces(board);

    let black = 0;
    let white = 0;
    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        if (ignoredLine.axis === "row" && row === ignoredLine.index) continue;
        if (ignoredLine.axis === "col" && col === ignoredLine.index) continue;
        if (board[row][col] === BLACK) black += 1;
        if (board[row][col] === WHITE) white += 1;
      }
    }

    return { black, white };
  }

  function estimateStableEdgeDiscs(board, owner) {
    let stable = 0;

    // From top-left corner along top row.
    if (board[0][0] === owner) {
      for (let col = 0; col < SIZE && board[0][col] === owner; col += 1) stable += 1;
      for (let row = 1; row < SIZE && board[row][0] === owner; row += 1) stable += 1;
    }

    // From top-right corner.
    if (board[0][SIZE - 1] === owner) {
      for (let col = SIZE - 1; col >= 0 && board[0][col] === owner; col -= 1) stable += 1;
      for (let row = 1; row < SIZE && board[row][SIZE - 1] === owner; row += 1) stable += 1;
    }

    // From bottom-left corner.
    if (board[SIZE - 1][0] === owner) {
      for (let col = 0; col < SIZE && board[SIZE - 1][col] === owner; col += 1) stable += 1;
      for (let row = SIZE - 2; row >= 0 && board[row][0] === owner; row -= 1) stable += 1;
    }

    // From bottom-right corner.
    if (board[SIZE - 1][SIZE - 1] === owner) {
      for (let col = SIZE - 1; col >= 0 && board[SIZE - 1][col] === owner; col -= 1) stable += 1;
      for (let row = SIZE - 2; row >= 0 && board[row][SIZE - 1] === owner; row -= 1) stable += 1;
    }

    return stable;
  }

  function applyMoveToBoard(board, move, player) {
    const next = cloneBoard(board);
    next[move.row][move.col] = player;
    move.flips.forEach(([r, c]) => {
      if (isImmutableDisc(r, c)) return;
      next[r][c] = player;
    });
    return next;
  }

  function parityAdvantageForPlayer(empties, playerToMove, aiPlayer) {
    if (!playerToMove || empties > 16) return 0;
    const likelyLastMover = empties % 2 === 1 ? playerToMove : opponentOf(playerToMove);
    return likelyLastMover === aiPlayer ? 1 : -1;
  }

  function evaluateBoardForPlayer(board, aiPlayer, playerToMove = null) {
    const enemy = opponentOf(aiPlayer);
    const aiMoves = getValidMoves(board, aiPlayer).length;
    const enemyMoves = getValidMoves(board, enemy).length;
    const empties = countEmptyCells(board);

    let positionalDiff = 0;
    let cornerDiff = 0;
    let edgeDiff = 0;

    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        const cell = board[row][col];
        if (cell === EMPTY) continue;

        const sign = cell === aiPlayer ? 1 : -1;
        positionalDiff += POSITION_WEIGHT[row][col] * sign;

        if (isCorner(row, col)) cornerDiff += sign;
        else if (isEdge(row, col)) edgeDiff += sign;
      }
    }

    const { black, white } = countPieces(board);
    const aiCount = aiPlayer === BLACK ? black : white;
    const enemyCount = aiPlayer === BLACK ? white : black;
    const pieceDiff = aiCount - enemyCount;
    const stableDiff = estimateStableEdgeDiscs(board, aiPlayer) - estimateStableEdgeDiscs(board, enemy);
    const parityDiff = parityAdvantageForPlayer(empties, playerToMove, aiPlayer);

    const stableWeight = empties <= 14 ? 8.4 : empties <= 28 ? 5.2 : 3.2;
    const parityWeight = empties <= 10 ? 8.2 : empties <= 16 ? 4.6 : 0;

    return (
      pieceDiff * 0.35 +
      (aiMoves - enemyMoves) * 4.2 +
      cornerDiff * 38 +
      edgeDiff * 2.2 +
      stableDiff * stableWeight +
      parityDiff * parityWeight +
      positionalDiff * 0.85
    );
  }

  function updateStatusText() {
    const { black, white } = countPieces(state.board);
    blackCountEl.textContent = String(black);
    whiteCountEl.textContent = String(white);
    turnTextEl.textContent = getPlayerName(state.currentPlayer);

    let visibleCounterPlayer = state.currentPlayer;
    if (isRoomMode()) {
      visibleCounterPlayer = state.roomPlayer;
    } else if (state.gameMode === "cpu") {
      visibleCounterPlayer = state.playerSide;
    }

    if (chaosOverwriteTextEl) {
      if (isChaosMode()) {
        const remain = state.overwriteRemaining[visibleCounterPlayer] ?? 0;
        chaosOverwriteTextEl.textContent = `上書き残り: ${remain}`;
      } else {
        chaosOverwriteTextEl.textContent = "上書き残り: -";
      }
    }
    if (doubleActionStockTextEl) {
      if (isChaosMode()) {
        const stock = state.doubleActionCharges[visibleCounterPlayer] ?? 0;
        const armed = state.doubleActionArmed[visibleCounterPlayer] ? "（発動予約中）" : "";
        doubleActionStockTextEl.textContent = `2回行動: ${stock}${armed}`;
      } else {
        doubleActionStockTextEl.textContent = "2回行動: -";
      }
    }
    updateRemakeRequestUi();
    updateModeUiState();
  }

  function updateRemakeRequestUi() {
    if (!remakeBtn) return;
    const defaultLabel = t("リメイク", "리메이크");
    remakeBtn.dataset.defaultLabel = defaultLabel;

    let opponentRequested = false;
    if (isRoomMode() && (state.roomPlayer === BLACK || state.roomPlayer === WHITE)) {
      const opponent = opponentOf(state.roomPlayer);
      opponentRequested = Boolean(state.drawVotes[opponent]) && !Boolean(state.drawVotes[state.roomPlayer]);
    }

    remakeBtn.classList.toggle("remake-requested-by-opponent", opponentRequested);
    remakeBtn.textContent = opponentRequested
      ? `${defaultLabel} !`
      : defaultLabel;
  }

  function isCpuTurn() {
    if (state.gameOver || isLocalMode() || isChaosMode() || isRoomMode()) return false;
    if (isCpuVsCpuMode()) return true;
    return state.currentPlayer === state.cpuPlayer;
  }

  function isLocalPlayersTurn() {
    if (isRoomMode()) {
      return !state.roomLocked && !state.roomSyncPending && state.currentPlayer === state.roomPlayer;
    }
    if (isChaosMode()) return true;
    if (isLocalMode()) return true;
    return !isCpuTurn();
  }

  function endGame() {
    state.gameOver = true;
    clearTimeout(state.cpuTimerId);
    state.cpuTimerId = null;
    stopTurnTimer();
    let ignoredLine = null;
    if (isChaosMode() && state.randomLineCountIgnoreEnabled) {
      ignoredLine = normalizeRandomLineCountIgnoreLine(state.randomLineCountIgnoreLine) ?? pickRandomLineForCountIgnore();
      state.randomLineCountIgnoreLine = ignoredLine;
    } else {
      state.randomLineCountIgnoreLine = null;
    }
    const { black, white } = countPiecesWithIgnoredLine(state.board, ignoredLine);

    applyOutcomeLearning(white > black, white === black);

    if (black > white) {
      overlay.textContent = `ゲーム終了: ${outcomeTextForWinner(BLACK)} (${black} - ${white})`;
    } else if (white > black) {
      overlay.textContent = `ゲーム終了: ${outcomeTextForWinner(WHITE)} (${white} - ${black})`;
    } else {
      overlay.textContent = `ゲーム終了: 引き分け (${black} - ${white})`;
    }

    if (ignoredLine) {
      const lineLabel = ignoredLine.axis === "row" ? `横${ignoredLine.index + 1}列` : `縦${ignoredLine.index + 1}列`;
      overlay.textContent += ` / ${lineLabel}はカウント対象外`;
    }

    overlay.style.opacity = "1";
    messageEl.textContent = t("ゲーム開始で再開できます", "게임 시작으로 재개할 수 있습니다");
  }

  function nextTurnOrFinish({ preferSamePlayer = false, forcedPlayer = state.currentPlayer } = {}) {
    // In chaos mode, overwrite can keep producing legal moves on a full board.
    // Match requested behavior: once the board is full, decide the winner immediately.
    if (countEmptyCells(state.board) === 0) {
      endGame();
      return;
    }

    if (preferSamePlayer) {
      const sameMoves = getValidMoves(state.board, forcedPlayer, { allowChaosOverwrite: isChaosMode() });
      if (sameMoves.length > 0) {
        state.currentPlayer = forcedPlayer;
        startTurnTimer();
        messageEl.textContent = `${getDisplayName(state.currentPlayer)}の2回行動が発動しました`;
        return;
      }
    }

    state.currentPlayer = forcedPlayer;
    const opponent = opponentOf(state.currentPlayer);
    const opponentMoves = getValidMoves(state.board, opponent, { allowChaosOverwrite: isChaosMode() });

    if (opponentMoves.length > 0) {
      state.currentPlayer = opponent;
      startTurnTimer();
      messageEl.textContent = isCpuTurn()
        ? getThinkingMessage()
        : isRoomMode()
          ? state.roomLocked
            ? state.roomLockMessage || "対戦相手を待っています..."
            : state.currentPlayer === state.roomPlayer
            ? "あなたの手番です"
            : "相手の手番です"
        : isLocalMode() || isChaosMode()
          ? `${getDisplayName(state.currentPlayer)}の手番です`
          : `${getDisplayName(state.currentPlayer)}（あなた）の手番です`;
      return;
    }

    const currentMoves = getValidMoves(state.board, state.currentPlayer, { allowChaosOverwrite: isChaosMode() });
    if (currentMoves.length > 0) {
      startTurnTimer();
      messageEl.textContent = `${getDisplayName(opponent)}は置ける場所がないためパス`;
      return;
    }

    endGame();
  }

  function placeMove(row, col, player, flips, { isOverwrite = false } = {}) {
    if (isOverwrite) {
      state.overwriteRemaining[player] = Math.max(0, (state.overwriteRemaining[player] ?? 0) - 1);
    }
    state.board[row][col] = player;
    flips.forEach(([r, c]) => {
      if (isImmutableDisc(r, c)) return;
      state.board[r][c] = player;
    });
  }

  function applyFirstCornerTakenBonus(player, row, col) {
    if (!isChaosMode()) return;
    if (state.firstCornerTakenBonusUsed) return;
    if (!isCorner(row, col)) return;

    const bonusOwner = opponentOf(player);
    state.overwriteRemaining[bonusOwner] = (state.overwriteRemaining[bonusOwner] ?? 0) + 1;
    state.firstCornerTakenBonusUsed = true;
  }

  function applyConsecutiveCornerLossBonus(player, row, col) {
    if (!isChaosMode()) return;
    if (!isCorner(row, col)) return;

    const victim = opponentOf(player);
    state.cornerLossStreak[victim] = (state.cornerLossStreak[victim] ?? 0) + 1;
    state.cornerLossStreak[player] = 0;

    while (state.cornerLossStreak[victim] >= 2) {
      state.doubleActionCharges[victim] = (state.doubleActionCharges[victim] ?? 0) + 1;
      state.cornerLossStreak[victim] -= 2;
    }
  }

  function consumeDoubleActionForMove(player, { isRemote = false, useDoubleAction = false } = {}) {
    if (!isChaosMode()) return false;

    const shouldUse = isRemote ? Boolean(useDoubleAction) : Boolean(state.doubleActionArmed[player]);
    if (!shouldUse) return false;

    if ((state.doubleActionCharges[player] ?? 0) <= 0) {
      state.doubleActionArmed[player] = false;
      return false;
    }

    state.doubleActionCharges[player] = Math.max(0, (state.doubleActionCharges[player] ?? 0) - 1);
    state.doubleActionArmed[player] = false;
    return true;
  }

  function simulateBoardAfterMove(board, move, player) {
    const next = cloneBoard(board);
    next[move.row][move.col] = player;
    move.flips.forEach(([r, c]) => {
      if (isImmutableDisc(r, c)) return;
      next[r][c] = player;
    });
    return next;
  }

  function scoreMove(board, player, move) {
    const setting = getDifficultySetting();
    const opponent = opponentOf(player);

    let score = move.flips.length * setting.flipWeight;
    if (isEdge(move.row, move.col)) score += setting.edgeWeight;
    if (isCorner(move.row, move.col)) score += setting.cornerWeight;
    if (isXSquare(move.row, move.col)) score += setting.xPenalty;
    if (isCSquare(move.row, move.col)) score += setting.cPenalty;

    score += POSITION_WEIGHT[move.row][move.col] * setting.positionalWeight;

    if (setting.mobilityWeight > 0) {
      const nextBoard = simulateBoardAfterMove(board, move, player);
      const opponentMoves = getValidMoves(nextBoard, opponent).length;
      score -= opponentMoves * setting.mobilityWeight;
    }

    if (isHumanVsCpuMode()) {
      if (setting.enableLearningBias !== false) {
        const learningBiasScale = setting.learningBiasScale ?? 1;
        const total = Math.max(1, state.learning.totalPlayerMoves);
        const tendency = state.learning.playerTendency[move.row][move.col] / total;
        score += tendency * 50 * learningBiasScale;

        let neighborTendency = 0;
        let neighborCount = 0;
        for (let dr = -1; dr <= 1; dr += 1) {
          for (let dc = -1; dc <= 1; dc += 1) {
            if (dr === 0 && dc === 0) continue;
            const r = move.row + dr;
            const c = move.col + dc;
            if (!inBounds(r, c)) continue;
            neighborTendency += state.learning.playerTendency[r][c];
            neighborCount += 1;
          }
        }

        if (neighborCount > 0) {
          score += ((neighborTendency / neighborCount) / total) * 28 * learningBiasScale;
        }

        score += state.learning.cpuBias[move.row][move.col] * learningBiasScale;
      }

      if (setting.enableOpponentLearning !== false) {
        const opponentLearningScale = setting.opponentLearningScale ?? 1;
        const matchTotal = Math.max(1, state.opponentModelTotal);
        const matchTendency = state.opponentModel[move.row][move.col] / matchTotal;
        score += matchTendency * 88 * opponentLearningScale;

        let nearbyMatchTendency = 0;
        let nearbyMatchCount = 0;
        for (let dr = -1; dr <= 1; dr += 1) {
          for (let dc = -1; dc <= 1; dc += 1) {
            if (dr === 0 && dc === 0) continue;
            const r = move.row + dr;
            const c = move.col + dc;
            if (!inBounds(r, c)) continue;
            nearbyMatchTendency += state.opponentModel[r][c];
            nearbyMatchCount += 1;
          }
        }

        if (nearbyMatchCount > 0) {
          score += ((nearbyMatchTendency / nearbyMatchCount) / matchTotal) * 34 * opponentLearningScale;
        }
      }
    }

    return score;
  }

  function minimax(board, playerToMove, aiPlayer, depth, alpha, beta, setting, searchState) {
    if (shouldStopSearch(searchState)) {
      return evaluateBoardForPlayer(board, aiPlayer, playerToMove);
    }

    const key = boardKey(board, playerToMove, depth, "m");
    const cached = ttGet(searchState, key);
    if (cached !== undefined) {
      return cached;
    }

    const enemy = opponentOf(playerToMove);
    const moves = getValidMoves(board, playerToMove);

    if (depth <= 0) {
      const score = evaluateBoardForPlayer(board, aiPlayer, playerToMove);
      ttSet(searchState, key, score);
      return score;
    }

    if (moves.length === 0) {
      const enemyMoves = getValidMoves(board, enemy);
      if (enemyMoves.length === 0) {
        const { black, white } = countPieces(board);
        const aiCount = aiPlayer === BLACK ? black : white;
        const enemyCount = aiPlayer === BLACK ? white : black;
        const score = (aiCount - enemyCount) * 1000;
        ttSet(searchState, key, score);
        return score;
      }
      const score = minimax(board, enemy, aiPlayer, depth - 1, alpha, beta, setting, searchState);
      ttSet(searchState, key, score);
      return score;
    }

    const orderedMoves = [...moves].sort(
      (a, b) => moveOrderScore(board, playerToMove, b, depth, searchState) - moveOrderScore(board, playerToMove, a, depth, searchState),
    );
    const limitedMoves = orderedMoves.slice(0, setting.maxBranches ?? orderedMoves.length);

    if (playerToMove === aiPlayer) {
      let best = -Infinity;
      for (const move of limitedMoves) {
        if (searchState?.timedOut) break;
        const next = applyMoveToBoard(board, move, playerToMove);
        const val = minimax(next, enemy, aiPlayer, depth - 1, alpha, beta, setting, searchState);
        if (searchState?.timedOut) break;
        if (val > best) best = val;
        if (val > alpha) alpha = val;
        if (beta <= alpha) {
          registerKillerMove(searchState, depth, move);
          registerHistoryMove(searchState, move, depth);
          break;
        }
      }
      const score = best === -Infinity ? evaluateBoardForPlayer(board, aiPlayer, playerToMove) : best;
      ttSet(searchState, key, score);
      return score;
    }

    let best = Infinity;
    for (const move of limitedMoves) {
      if (searchState?.timedOut) break;
      const next = applyMoveToBoard(board, move, playerToMove);
      const val = minimax(next, enemy, aiPlayer, depth - 1, alpha, beta, setting, searchState);
      if (searchState?.timedOut) break;
      if (val < best) best = val;
      if (val < beta) beta = val;
      if (beta <= alpha) {
        registerKillerMove(searchState, depth, move);
        registerHistoryMove(searchState, move, depth);
        break;
      }
    }
    const score = best === Infinity ? evaluateBoardForPlayer(board, aiPlayer, playerToMove) : best;
    ttSet(searchState, key, score);
    return score;
  }

  function endgameSolveExact(board, playerToMove, aiPlayer, alpha, beta, searchState, ply = 0) {
    if (shouldStopSearch(searchState)) {
      return evaluateBoardForPlayer(board, aiPlayer, playerToMove);
    }

    const key = boardKey(board, playerToMove, -1, "e");
    const cached = ttGet(searchState, key);
    if (cached !== undefined) {
      return cached;
    }

    const enemy = opponentOf(playerToMove);
    const moves = getValidMoves(board, playerToMove);

    if (moves.length === 0) {
      const enemyMoves = getValidMoves(board, enemy);
      if (enemyMoves.length === 0) {
        const { black, white } = countPieces(board);
        const aiCount = aiPlayer === BLACK ? black : white;
        const enemyCount = aiPlayer === BLACK ? white : black;
        const score = (aiCount - enemyCount) * 1000;
        ttSet(searchState, key, score);
        return score;
      }
      const score = endgameSolveExact(board, enemy, aiPlayer, alpha, beta, searchState, ply + 1);
      ttSet(searchState, key, score);
      return score;
    }

    const orderedMoves = [...moves].sort(
      (a, b) => moveOrderScore(board, playerToMove, b, ply, searchState) - moveOrderScore(board, playerToMove, a, ply, searchState),
    );

    if (playerToMove === aiPlayer) {
      let best = -Infinity;
      for (const move of orderedMoves) {
        if (searchState?.timedOut) break;
        const next = applyMoveToBoard(board, move, playerToMove);
        const val = endgameSolveExact(next, enemy, aiPlayer, alpha, beta, searchState, ply + 1);
        if (searchState?.timedOut) break;
        if (val > best) best = val;
        if (val > alpha) alpha = val;
        if (beta <= alpha) {
          registerKillerMove(searchState, ply, move);
          registerHistoryMove(searchState, move, 6);
          break;
        }
      }
      const score = best === -Infinity ? evaluateBoardForPlayer(board, aiPlayer, playerToMove) : best;
      ttSet(searchState, key, score);
      return score;
    }

    let best = Infinity;
    for (const move of orderedMoves) {
      if (searchState?.timedOut) break;
      const next = applyMoveToBoard(board, move, playerToMove);
      const val = endgameSolveExact(next, enemy, aiPlayer, alpha, beta, searchState, ply + 1);
      if (searchState?.timedOut) break;
      if (val < best) best = val;
      if (val < beta) beta = val;
      if (beta <= alpha) {
        registerKillerMove(searchState, ply, move);
        registerHistoryMove(searchState, move, 6);
        break;
      }
    }
    const score = best === Infinity ? evaluateBoardForPlayer(board, aiPlayer, playerToMove) : best;
    ttSet(searchState, key, score);
    return score;
  }

  function searchBestMoveEndgame(board, player, moves, setting) {
    const enemy = opponentOf(player);
    const candidates = [...moves].sort((a, b) => scoreMove(board, player, b) - scoreMove(board, player, a));

    let bestMove = candidates[0];
    let bestScore = -Infinity;
    const budgetMaxMs = setting.endgameBudgetMaxMs ?? ENDGAME_SEARCH_BUDGET_MAX_MS;
    const budgetMs = clamp(Math.floor((setting.thinkMs ?? 900) * 0.55), 140, budgetMaxMs);
    const deadline = performance.now() + budgetMs;
    const searchState = {
      deadline,
      timedOut: false,
      tt: new Map(),
      ttMaxEntries: setting.ttMaxEntries ?? TT_MAX_ENTRIES,
      historyTable: createZeroMatrix(),
      killerMoves: new Map(),
      nodes: 0,
      maxNodes: setting.endgameMaxNodes ?? ENDGAME_SEARCH_MAX_NODES,
    };

    for (const move of candidates) {
      if (performance.now() >= deadline) {
        searchState.timedOut = true;
        break;
      }

      const next = applyMoveToBoard(board, move, player);
      const val = endgameSolveExact(next, enemy, player, -Infinity, Infinity, searchState, 1);
      if (searchState.timedOut) break;

      if (val > bestScore) {
        bestScore = val;
        bestMove = move;
      }
    }

    return bestMove;
  }

  function searchBestMoveIterative(board, player, moves, setting) {
    const orderedMoves = [...moves].sort((a, b) => scoreMove(board, player, b) - scoreMove(board, player, a));
    const candidates = orderedMoves.slice(0, setting.maxBranches ?? orderedMoves.length);
    const enemy = opponentOf(player);

    let bestMove = candidates[0];
    let bestScore = -Infinity;

    // Fallback result from shallow static evaluation.
    candidates.forEach((move) => {
      const staticScore = scoreMove(board, player, move);
      if (staticScore > bestScore) {
        bestScore = staticScore;
        bestMove = move;
      }
    });

    const maxDepth = resolveIterativeDepth(board, setting);
    const budgetMaxMs = setting.iterativeBudgetMaxMs ?? ITERATIVE_SEARCH_BUDGET_MAX_MS;
    const budgetMs = clamp(Math.floor((setting.thinkMs ?? 700) * 0.5), 90, budgetMaxMs);
    const deadline = performance.now() + budgetMs;
    const tt = new Map();
    const historyTable = createZeroMatrix();
    const killerMoves = new Map();
    const searchState = {
      deadline,
      timedOut: false,
      tt,
      ttMaxEntries: setting.ttMaxEntries ?? TT_MAX_ENTRIES,
      historyTable,
      killerMoves,
      nodes: 0,
      maxNodes: setting.iterativeMaxNodes ?? ITERATIVE_SEARCH_MAX_NODES,
    };

    for (let depth = 2; depth <= maxDepth; depth += 1) {
      let depthBestMove = bestMove;
      let depthBestScore = -Infinity;

      if (searchState.timedOut) break;

      for (const move of candidates) {
        if (performance.now() >= deadline) {
          searchState.timedOut = true;
          break;
        }

        const next = applyMoveToBoard(board, move, player);
        const val = minimax(next, enemy, player, depth - 1, -Infinity, Infinity, setting, searchState);

        if (searchState.timedOut) break;
        if (val > depthBestScore) {
          depthBestScore = val;
          depthBestMove = move;
        }
      }

      if (searchState.timedOut) break;
      bestMove = depthBestMove;
      bestScore = depthBestScore;
    }

    return bestMove;
  }

  function resolveIterativeDepth(board, setting) {
    let depth = Math.max(1, setting.searchDepth ?? 1);
    const empties = countEmptyCells(board);

    // Increase depth in late phases where exactness matters more.
    if (empties <= 20) depth += 1;
    if (empties <= 14) depth += 1;

    const depthCap = Math.max(2, setting.maxDepthCap ?? 10);

    return Math.min(depthCap, Math.max(2, depth));
  }

  function pickImmediateWipeMove(board, player, moves) {
    const enemy = opponentOf(player);
    const wipeMoves = [];

    for (const move of moves) {
      const nextBoard = applyMoveToBoard(board, move, player);
      const { black, white } = countPieces(nextBoard);
      const enemyCount = enemy === BLACK ? black : white;
      if (enemyCount === 0) {
        wipeMoves.push(move);
      }
    }

    if (wipeMoves.length === 0) return null;

    wipeMoves.sort((a, b) => {
      if (b.flips.length !== a.flips.length) return b.flips.length - a.flips.length;
      const aCorner = isCorner(a.row, a.col) ? 1 : 0;
      const bCorner = isCorner(b.row, b.col) ? 1 : 0;
      if (bCorner !== aCorner) return bCorner - aCorner;
      return scoreMove(board, player, b) - scoreMove(board, player, a);
    });

    return wipeMoves[0];
  }

  function pickOpeningBookMove(board, player, moves, setting) {
    if (!setting.useOpeningBook || moves.length === 0) return null;

    const { black, white } = countPieces(board);
    const ply = Math.max(0, black + white - 4);
    const maxPly = setting.openingBookMaxPly ?? 0;
    if (ply > maxPly) return null;

    const cornerMove = moves.find((move) => isCorner(move.row, move.col));
    if (cornerMove) return cornerMove;

    const preferenceBand = OPENING_BOOK_PRIORITY[Math.min(OPENING_BOOK_PRIORITY.length - 1, Math.floor(ply / 3))];
    if (!preferenceBand) return null;

    const moveMap = new Map();
    moves.forEach((move) => {
      moveMap.set(`${move.row}-${move.col}`, move);
    });

    for (const [row, col] of preferenceBand) {
      const found = moveMap.get(`${row}-${col}`);
      if (found) {
        return found;
      }
    }

    return null;
  }

  function pickCpuMove(board, player, moves) {
    const setting = getDifficultySetting();

    const immediateWipe = pickImmediateWipeMove(board, player, moves);
    if (immediateWipe) {
      return immediateWipe;
    }

    const openingBookMove = pickOpeningBookMove(board, player, moves, setting);
    if (openingBookMove) {
      return openingBookMove;
    }

    if ((setting.endgameSolveEmpty ?? -1) >= 0) {
      const empties = countEmptyCells(board);
      if (empties <= setting.endgameSolveEmpty) {
        return searchBestMoveEndgame(board, player, moves, setting);
      }
    }

    if (Math.random() < setting.randomRate) {
      return moves[Math.floor(Math.random() * moves.length)];
    }

    if ((setting.searchDepth ?? 1) > 1) {
      return searchBestMoveIterative(board, player, moves, setting);
    }

    const sorted = [...moves].sort((a, b) => scoreMove(board, player, b) - scoreMove(board, player, a));
    const bestScore = scoreMove(board, player, sorted[0]);
    const bestMoves = sorted.filter((m) => scoreMove(board, player, m) === bestScore);
    const randomIndex = Math.floor(Math.random() * bestMoves.length);
    return bestMoves[randomIndex];
  }

  function scheduleCpuMove() {
    clearTimeout(state.cpuTimerId);
    if (!isCpuTurn()) return;

    const setting = getDifficultySetting();
    const delayMs = Math.min(setting.thinkMs ?? 240, CPU_THINK_DELAY_MAX_MS);

    state.cpuTimerId = setTimeout(() => {
      if (!isCpuTurn()) return;

      const validMoves = getValidMoves(state.board, state.currentPlayer);
      if (validMoves.length === 0) {
        nextTurnOrFinish();
        render();
        scheduleCpuMove();
        return;
      }

      let move;
      try {
        move = pickCpuMove(state.board, state.currentPlayer, validMoves);
      } catch (error) {
        console.error("CPU move search failed. Falling back to random move.", error);
      }

      if (!move || !Array.isArray(move.flips)) {
        move = validMoves[Math.floor(Math.random() * validMoves.length)];
      }

      if (isHumanVsCpuMode()) {
        state.cpuMovesThisGame.push({ row: move.row, col: move.col });
      }
      placeMove(move.row, move.col, state.currentPlayer, move.flips, { isOverwrite: Boolean(move.isOverwrite) });
      nextTurnOrFinish();
      render();
      scheduleCpuMove();
    }, delayMs);
  }

  function stopGameLoop() {
    clearTimeout(state.cpuTimerId);
    state.cpuTimerId = null;
    stopTurnTimer();
  }

  function syncRoomSnapshotIfHost() {
    if (!isRoomMode() || state.roomRole !== "host") return;
    options.onRoomSnapshot?.();
  }

  function handleMove(row, col, { isRemote = false, useDoubleAction = false } = {}) {
    if (state.gameOver) return;
    if (!isRemote && !isLocalPlayersTurn()) return;

    const movePlayer = state.currentPlayer;
    const move = getMoveCandidate(state.board, row, col, state.currentPlayer, {
      allowChaosOverwrite: isChaosMode(),
    });
    if (!move) return;

    const consumedDoubleAction = consumeDoubleActionForMove(movePlayer, { isRemote, useDoubleAction });
    placeMove(row, col, state.currentPlayer, move.flips, { isOverwrite: Boolean(move.isOverwrite) });
    applyFirstCornerTakenBonus(state.currentPlayer, row, col);
    applyConsecutiveCornerLossBonus(state.currentPlayer, row, col);
    if (isChaosMode() && move.isOverwrite) {
      const remain = state.overwriteRemaining[state.currentPlayer];
      messageEl.textContent = `上書きを使用しました（残り${remain}回）`;
    }
    if (!isRemote && isHumanVsCpuMode() && state.currentPlayer !== state.cpuPlayer) {
      recordPlayerMove(row, col);
    }
    if (isRoomMode() && !isRemote) {
      options.onRoomMove?.({ row, col, useDoubleAction: consumedDoubleAction });
    }

    nextTurnOrFinish({ preferSamePlayer: consumedDoubleAction, forcedPlayer: movePlayer });
    render();
    scheduleCpuMove();
  }

  function renderBoard() {
    boardEl.innerHTML = "";
    const validMoves = getValidMoves(state.board, state.currentPlayer, { allowChaosOverwrite: isChaosMode() });
    const validSet = new Set(validMoves.map((m) => `${m.row}-${m.col}`));
    const ignoredLineForDisplay = state.gameOver
      ? normalizeRandomLineCountIgnoreLine(state.randomLineCountIgnoreLine)
      : null;
    const showValid = !state.gameOver && isLocalPlayersTurn();
    const canPlaceImmutableNow =
      !state.gameOver &&
      isLocalPlayersTurn() &&
      Boolean(state.immutablePlaceArmed[state.currentPlayer]);
    const canUseDestroyNow =
      !state.gameOver &&
      isLocalPlayersTurn() &&
      Boolean(state.destroySkillArmed[state.currentPlayer]);
    const canUseDoubleActionNow =
      !state.gameOver &&
      isLocalPlayersTurn() &&
      Boolean(state.doubleActionArmed[state.currentPlayer]);
    const destroyContext = canUseDestroyNow ? countDestroyCandidates(state.currentPlayer) : null;
    const useCornerDestroy = Boolean(destroyContext && destroyContext.cornerSacrifices.length > 0);
    const selectedSacrificeSet = new Set(
      (state.destroySkillSelectedSelfSacrifices[state.currentPlayer] ?? []).map(({ row, col }) => `${row}-${col}`),
    );
    const awaitingDestroyTarget = !useCornerDestroy && selectedSacrificeSet.size >= NO_CORNER_SACRIFICE_COUNT;

    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "cell";
        cell.disabled = state.gameOver || !isLocalPlayersTurn();

        if (state.board[row][col] === BLACK) cell.classList.add("black");
        if (state.board[row][col] === WHITE) cell.classList.add("white");
        if (isImmutableDisc(row, col)) cell.classList.add("locked");
        if (canPlaceImmutableNow && canPlaceImmutableDisc(state.currentPlayer, row, col)) {
          cell.classList.add("immutable-candidate");
        }
        if (canUseDestroyNow) {
          if (awaitingDestroyTarget) {
            if (isDestroyTargetCell(state.currentPlayer, row, col)) {
              cell.classList.add("destroy-target-candidate");
            }
          } else {
            const canSacrifice =
              useCornerDestroy
                ? isDestroySacrificeCell(state.currentPlayer, row, col)
                : isDestroySelfSacrificeCell(state.currentPlayer, row, col);
            if (canSacrifice) {
              cell.classList.add("destroy-sacrifice-candidate");
            }
          }
          if (selectedSacrificeSet.has(`${row}-${col}`)) {
            cell.classList.add("destroy-sacrifice-selected");
          }
        }
        if (showValid && validSet.has(`${row}-${col}`)) cell.classList.add("valid");
        if (canUseDoubleActionNow && validSet.has(`${row}-${col}`)) {
          cell.classList.add("double-action-candidate");
        }
        if (ignoredLineForDisplay) {
          const isIgnoredRow = ignoredLineForDisplay.axis === "row" && row === ignoredLineForDisplay.index;
          const isIgnoredCol = ignoredLineForDisplay.axis === "col" && col === ignoredLineForDisplay.index;
          if (isIgnoredRow || isIgnoredCol) {
            cell.classList.add("count-ignore-line");
          }
        }

        cell.addEventListener("click", () => {
          if (canUseDestroyNow) {
            handleDestroySkillClick(row, col, { isRemote: false });
            return;
          }
          if (canPlaceImmutableNow) {
            placeImmutableDisc(row, col, { isRemote: false });
            return;
          }
          handleMove(row, col, { isRemote: false });
        });

        boardEl.appendChild(cell);
      }
    }
  }

  function render() {
    updateStatusText();
    renderBoard();
  }

  startBtn.addEventListener("click", resetGame);
  remakeBtn?.addEventListener("click", onRemakeButtonClick);

  menuBtn?.addEventListener("click", () => {
    const confirmed = window.confirm("ゲーム一覧に戻りますか？");
    if (!confirmed) return;
    stopGameLoop();
    if (isRoomMode()) {
      options.onBackToLobby?.();
      return;
    }
    options.onBackToMenu?.();
  });

  if (difficultySelect) {
    difficultySelect.addEventListener("change", () => {
      state.difficulty = DIFFICULTY_SETTINGS[difficultySelect.value] ? difficultySelect.value : "normal";
      updateDifficultyIndicator({ emphasize: true });

      if (isCpuTurn()) {
        messageEl.textContent = getThinkingMessage();
        scheduleCpuMove();
      }
    });
  }

  if (modeSelect) {
    modeSelect.addEventListener("change", () => {
      if (isRoomMode()) {
        state.roomRuleMode = modeSelect.value === "chaos" ? "chaos" : "local";
        if (state.roomRuleMode === "chaos") {
          state.handicapTarget = "none";
        }
        options.onRoomModeChange?.({ mode: state.roomRuleMode });
        enterStandby();
        return;
      }

      state.gameMode =
        modeSelect.value === "local"
          ? "local"
          : modeSelect.value === "cpuvscpu"
            ? "cpuvscpu"
            : modeSelect.value === "chaos"
              ? "chaos"
              : "cpu";
      if (state.gameMode === "chaos") {
        state.handicapTarget = "none";
      }
      enterStandby();
    });
  }

  if (turnOrderSelect) {
    turnOrderSelect.addEventListener("change", () => {
      state.turnOrder =
        turnOrderSelect.value === "player-second" || turnOrderSelect.value === "random"
          ? turnOrderSelect.value
          : "player-first";
      if (state.gameMode === "cpu") {
        enterStandby();
      } else {
        updateModeUiState();
      }
    });
  }

  if (handicapSelect) {
    handicapSelect.addEventListener("change", () => {
      state.handicapType = normalizeHandicapType(handicapSelect.value);
      updateModeUiState();
      syncRoomSnapshotIfHost();
    });
  }

  if (handicapTargetSelect) {
    handicapTargetSelect.addEventListener("change", () => {
      state.handicapTarget = normalizeOwnerType(handicapTargetSelect.value);
      updateModeUiState();
      syncRoomSnapshotIfHost();
    });
  }

  if (bothBlackHandicapSelect) {
    bothBlackHandicapSelect.addEventListener("change", () => {
      state.bothHandicapType[BLACK] = normalizeHandicapType(bothBlackHandicapSelect.value);
      updateModeUiState();
      syncRoomSnapshotIfHost();
    });
  }

  if (bothWhiteHandicapSelect) {
    bothWhiteHandicapSelect.addEventListener("change", () => {
      state.bothHandicapType[WHITE] = normalizeHandicapType(bothWhiteHandicapSelect.value);
      updateModeUiState();
      syncRoomSnapshotIfHost();
    });
  }

  if (overwriteLimitSelect) {
    overwriteLimitSelect.addEventListener("change", () => {
      state.overwriteLimit = normalizeOverwriteLimit(overwriteLimitSelect.value);
      updateModeUiState();
    });
  }

  if (randomLineCountIgnoreSelect) {
    randomLineCountIgnoreSelect.addEventListener("change", () => {
      state.randomLineCountIgnoreEnabled = normalizeToggle(randomLineCountIgnoreSelect.value);
      state.randomLineCountIgnoreLine = null;
      updateModeUiState();
    });
  }

  if (bothBlackOverwriteSelect) {
    bothBlackOverwriteSelect.addEventListener("change", () => {
      state.bothOverwriteLimit[BLACK] = normalizeOverwriteLimit(bothBlackOverwriteSelect.value);
      updateModeUiState();
    });
  }

  if (bothWhiteOverwriteSelect) {
    bothWhiteOverwriteSelect.addEventListener("change", () => {
      state.bothOverwriteLimit[WHITE] = normalizeOverwriteLimit(bothWhiteOverwriteSelect.value);
      updateModeUiState();
    });
  }

  if (destroyLimitBlackSelect) {
    destroyLimitBlackSelect.addEventListener("change", () => {
      state.destroySkillLimit[BLACK] = normalizeDestroyLimit(destroyLimitBlackSelect.value);
      updateModeUiState();
    });
  }

  if (destroyLimitWhiteSelect) {
    destroyLimitWhiteSelect.addEventListener("change", () => {
      state.destroySkillLimit[WHITE] = normalizeDestroyLimit(destroyLimitWhiteSelect.value);
      updateModeUiState();
    });
  }

  if (doubleActionBtn) {
    doubleActionBtn.addEventListener("click", () => {
      if (!isChaosMode() || state.gameOver || state.roomLocked || !isLocalPlayersTurn()) return;
      const player = state.currentPlayer;
      if (state.doubleActionArmed[player]) {
        state.doubleActionArmed[player] = false;
        messageEl.textContent = `${getDisplayName(player)}は2回行動の予約を解除しました`;
        render();
        return;
      }
      if ((state.doubleActionCharges[player] ?? 0) <= 0) return;
      state.doubleActionArmed[player] = true;
      messageEl.textContent = `${getDisplayName(player)}が2回行動を予約しました。次の1手で連続行動します`;
      render();
    });
  }

  if (immutablePlaceBtn) {
    immutablePlaceBtn.addEventListener("click", () => {
      if (!isChaosMode() || state.gameOver || state.roomLocked || !isLocalPlayersTurn()) return;
      const player = state.currentPlayer;
      if (state.immutablePlaceArmed[player]) {
        state.immutablePlaceArmed[player] = false;
        messageEl.textContent = `${getDisplayName(player)}は固定石の指定を解除しました`;
        render();
        return;
      }
      if ((state.immutablePlaceCharges[player] ?? 0) <= 0) {
        messageEl.textContent = `${getDisplayName(player)}の固定石回数が不足しています`;
        render();
        return;
      }
      state.immutablePlaceArmed[player] = true;
      state.destroySkillArmed[player] = false;
      messageEl.textContent = `${getDisplayName(player)}は固定する石を選択してください`;
      render();
    });
  }

  if (destroySkillBtn) {
    destroySkillBtn.addEventListener("click", () => {
      if (!isChaosMode() || state.gameOver || state.roomLocked || !isLocalPlayersTurn()) return;
      const player = state.currentPlayer;
      if (state.destroySkillArmed[player]) {
        state.destroySkillArmed[player] = false;
        state.destroySkillSelectedSelfSacrifices[player] = [];
        messageEl.textContent = `${getDisplayName(player)}は通常手番に戻りました`;
        render();
        return;
      }
      if ((state.destroySkillRemaining[player] ?? 0) <= 0) {
        messageEl.textContent = `${getDisplayName(player)}の駒破壊回数が不足しています`;
        render();
        return;
      }
      state.destroySkillArmed[player] = true;
      state.destroySkillSelectedSelfSacrifices[player] = [];
      state.immutablePlaceArmed[player] = false;
      const { cornerSacrifices, selfSacrifices, targets } = countDestroyCandidates(player);
      if (cornerSacrifices.length > 0 && targets.length >= CORNER_SACRIFICE_DESTROY_COUNT) {
        messageEl.textContent = `${getDisplayName(player)}は犠牲にする角の駒を選択してください`;
      } else if (
        cornerSacrifices.length === 0 &&
        selfSacrifices.length >= NO_CORNER_SACRIFICE_COUNT &&
        targets.length >= NO_CORNER_DESTROY_COUNT
      ) {
        messageEl.textContent = `${getDisplayName(player)}は犠牲にする自駒を選択してください（2個犠牲で1個破壊）`;
      } else if (cornerSacrifices.length === 0 && selfSacrifices.length < NO_CORNER_SACRIFICE_COUNT) {
        messageEl.textContent = `${getDisplayName(player)}は犠牲にできる自駒が不足しています（必要: ${NO_CORNER_SACRIFICE_COUNT}）`;
      } else if (cornerSacrifices.length === 0 && targets.length < NO_CORNER_DESTROY_COUNT) {
        messageEl.textContent = `${getDisplayName(player)}は破壊対象が不足しています（必要: ${NO_CORNER_DESTROY_COUNT}）`;
      } else if (targets.length < CORNER_SACRIFICE_DESTROY_COUNT) {
        messageEl.textContent = `${getDisplayName(player)}は破壊対象が不足しています（必要: ${CORNER_SACRIFICE_DESTROY_COUNT}）`;
      } else {
        messageEl.textContent = `${getDisplayName(player)}は駒破壊を発動できません`;
      }
      render();
    });
  }

  enterStandby();
  return {
    startNewGame: (opts) => resetGame(opts),
    enterStandby,
    stop: stopGameLoop,
    configureRoomMode: ({ roomCode, roomRole, roomPlayer }) => {
      state.gameMode = "room";
      state.roomCode = roomCode;
      state.roomRole = roomRole;
      state.roomPlayer = roomPlayer;
      state.roomRuleMode = "local";
      updateModeUiState();
      options.onRoomStatusChange?.({ roomCode: state.roomCode, roomRole: state.roomRole });
    },
    configureStandardMode: (mode) => {
      state.gameMode =
        mode === "local" ? "local" : mode === "cpuvscpu" ? "cpuvscpu" : mode === "chaos" ? "chaos" : "cpu";
      state.roomCode = null;
      state.roomRole = null;
      state.roomPlayer = BLACK;
      state.roomRuleMode = "local";
      state.roomLocked = false;
      state.roomLockMessage = "";
      if (state.gameMode !== "cpu") {
        state.turnOrder = "player-first";
      }
      updateModeUiState();
      options.onRoomStatusChange?.({ roomCode: null, roomRole: null });
    },
    setRoomLock: ({ locked, message }) => {
      state.roomLocked = Boolean(locked);
      state.roomLockMessage = message ?? "";

      if (state.roomLocked) {
        stopTurnTimer({ reset: true });
        overlay.textContent = state.roomLockMessage || "対戦相手を待っています...";
        overlay.style.opacity = "1";
        messageEl.textContent = state.roomLockMessage || "対戦相手を待っています...";
      } else if (!state.gameOver) {
        overlay.textContent = "";
        overlay.style.opacity = "0";
        messageEl.textContent = state.roomSyncPending
          ? "ホストの盤面同期を待っています..."
          : state.currentPlayer === state.roomPlayer
            ? "あなたの手番です"
            : "相手の手番です";
        startTurnTimer();
      }

      render();
    },
    applyRemoteMove: ({ row, col, useDoubleAction, action, sacrifice, sacrifices, destroyedTargets }) => {
      if (action === "immutable-place") {
        if (!isChaosMode()) return;
        placeImmutableDisc(row, col, { isRemote: true });
        return;
      }
      if (action === "destroy-skill") {
        if (!isChaosMode()) return;
        const normalizedSacrifices = Array.isArray(sacrifices)
          ? sacrifices
          : sacrifice
            ? [sacrifice]
            : [];
        executeDestroySkill(state.currentPlayer, normalizedSacrifices, destroyedTargets, { isRemote: true });
        return;
      }
      handleMove(row, col, { isRemote: true, useDoubleAction: Boolean(useDoubleAction) });
    },
    applyRemoteDrawVote: ({ voter }) => {
      applyDrawVote(voter, { isRemote: true });
    },
    applyRoomMode: ({ mode }) => {
      if (!isRoomMode()) return;
      state.roomRuleMode = mode === "chaos" ? "chaos" : "local";
      enterStandby();
    },
    getSnapshot: () => ({
      board: cloneBoard(state.board),
      currentPlayer: state.currentPlayer,
      gameOver: state.gameOver,
      roomRuleMode: state.roomRuleMode,
      handicapType: state.handicapType,
      handicapTarget: state.handicapTarget,
      bothHandicapType: { ...state.bothHandicapType },
      overwriteRemaining: { ...state.overwriteRemaining },
      overwriteLimit: state.overwriteLimit,
      randomLineCountIgnoreEnabled: state.randomLineCountIgnoreEnabled,
      randomLineCountIgnoreLine: state.randomLineCountIgnoreLine
        ? { ...state.randomLineCountIgnoreLine }
        : null,
      bothOverwriteLimit: { ...state.bothOverwriteLimit },
      destroySkillLimit: { ...state.destroySkillLimit },
      destroySkillRemaining: { ...state.destroySkillRemaining },
      immutableDiscs: normalizeBooleanMatrix(state.immutableDiscs),
      immutablePlaceCharges: { ...state.immutablePlaceCharges },
      immutablePlaceArmed: { ...state.immutablePlaceArmed },
      destroySkillArmed: { ...state.destroySkillArmed },
      firstCornerTakenBonusUsed: state.firstCornerTakenBonusUsed,
      doubleActionCharges: { ...state.doubleActionCharges },
      doubleActionArmed: { ...state.doubleActionArmed },
      cornerLossStreak: { ...state.cornerLossStreak },
    }),
    applySnapshot: ({
      board,
      currentPlayer,
      gameOver,
      roomRuleMode,
      handicapType,
      handicapTarget,
      bothHandicapType,
      overwriteRemaining,
      overwriteLimit,
      randomLineCountIgnoreEnabled,
      randomLineCountIgnoreLine,
      bothOverwriteLimit,
      destroySkillLimit,
      destroySkillRemaining,
      immutableDiscs,
      immutablePlaceCharges,
      immutablePlaceArmed,
      destroySkillArmed,
      firstCornerTakenBonusUsed,
      doubleActionCharges,
      doubleActionArmed,
      cornerLossStreak,
    }) => {
      if (!board || !Array.isArray(board)) return;
      state.board = cloneBoard(board);
      state.currentPlayer = currentPlayer;
      state.gameOver = Boolean(gameOver);
      if (isRoomMode()) {
        state.roomRuleMode = roomRuleMode === "chaos" ? "chaos" : "local";
      }
      state.handicapType = normalizeHandicapType(handicapType ?? state.handicapType);
      state.handicapTarget = normalizeOwnerType(handicapTarget ?? state.handicapTarget);
      if (bothHandicapType && typeof bothHandicapType === "object") {
        state.bothHandicapType[BLACK] = normalizeHandicapType(bothHandicapType[BLACK]);
        state.bothHandicapType[WHITE] = normalizeHandicapType(bothHandicapType[WHITE]);
      }
      state.overwriteLimit = normalizeOverwriteLimit(overwriteLimit ?? state.overwriteLimit);
      state.randomLineCountIgnoreEnabled = normalizeToggle(
        randomLineCountIgnoreEnabled ?? state.randomLineCountIgnoreEnabled,
      );
      state.randomLineCountIgnoreLine = normalizeRandomLineCountIgnoreLine(randomLineCountIgnoreLine);
      if (bothOverwriteLimit && typeof bothOverwriteLimit === "object") {
        state.bothOverwriteLimit[BLACK] = normalizeOverwriteLimit(bothOverwriteLimit[BLACK]);
        state.bothOverwriteLimit[WHITE] = normalizeOverwriteLimit(bothOverwriteLimit[WHITE]);
      }
      if (destroySkillLimit && typeof destroySkillLimit === "object") {
        state.destroySkillLimit[BLACK] = normalizeDestroyLimit(destroySkillLimit[BLACK]);
        state.destroySkillLimit[WHITE] = normalizeDestroyLimit(destroySkillLimit[WHITE]);
      } else {
        const sharedLimit = normalizeDestroyLimit(destroySkillLimit ?? state.destroySkillLimit[BLACK]);
        state.destroySkillLimit[BLACK] = sharedLimit;
        state.destroySkillLimit[WHITE] = sharedLimit;
      }
      if (destroySkillRemaining && typeof destroySkillRemaining === "object") {
        state.destroySkillRemaining[BLACK] = Math.min(
          normalizeNonNegativeInt(destroySkillRemaining[BLACK]),
          getDestroyLimitFor(BLACK),
        );
        state.destroySkillRemaining[WHITE] = Math.min(
          normalizeNonNegativeInt(destroySkillRemaining[WHITE]),
          getDestroyLimitFor(WHITE),
        );
      }
      state.immutableDiscs = normalizeBooleanMatrix(immutableDiscs ?? state.immutableDiscs);
      if (immutablePlaceCharges && typeof immutablePlaceCharges === "object") {
        state.immutablePlaceCharges[BLACK] = normalizeNonNegativeInt(immutablePlaceCharges[BLACK]);
        state.immutablePlaceCharges[WHITE] = normalizeNonNegativeInt(immutablePlaceCharges[WHITE]);
      }
      if (immutablePlaceArmed && typeof immutablePlaceArmed === "object") {
        state.immutablePlaceArmed[BLACK] = Boolean(immutablePlaceArmed[BLACK]);
        state.immutablePlaceArmed[WHITE] = Boolean(immutablePlaceArmed[WHITE]);
      }
      if (destroySkillArmed && typeof destroySkillArmed === "object") {
        state.destroySkillArmed[BLACK] = Boolean(destroySkillArmed[BLACK]);
        state.destroySkillArmed[WHITE] = Boolean(destroySkillArmed[WHITE]);
      }
      state.firstCornerTakenBonusUsed = Boolean(firstCornerTakenBonusUsed);
      if (overwriteRemaining && typeof overwriteRemaining === "object") {
        state.overwriteRemaining[BLACK] = normalizeNonNegativeInt(overwriteRemaining[BLACK]);
        state.overwriteRemaining[WHITE] = normalizeNonNegativeInt(overwriteRemaining[WHITE]);
      }
      if (doubleActionCharges && typeof doubleActionCharges === "object") {
        state.doubleActionCharges[BLACK] = normalizeNonNegativeInt(doubleActionCharges[BLACK]);
        state.doubleActionCharges[WHITE] = normalizeNonNegativeInt(doubleActionCharges[WHITE]);
      }
      if (doubleActionArmed && typeof doubleActionArmed === "object") {
        state.doubleActionArmed[BLACK] = Boolean(doubleActionArmed[BLACK]);
        state.doubleActionArmed[WHITE] = Boolean(doubleActionArmed[WHITE]);
      }
      if (cornerLossStreak && typeof cornerLossStreak === "object") {
        state.cornerLossStreak[BLACK] = normalizeNonNegativeInt(cornerLossStreak[BLACK]);
        state.cornerLossStreak[WHITE] = normalizeNonNegativeInt(cornerLossStreak[WHITE]);
      }
      resetDrawVotes();
      if (state.gameOver || state.roomLocked) {
        stopTurnTimer();
      } else {
        startTurnTimer();
      }
      state.roomSyncPending = false;
      render();
    },
  };
}
