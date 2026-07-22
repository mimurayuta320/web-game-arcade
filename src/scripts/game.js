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
const ITERATIVE_SEARCH_BUDGET_MAX_MS = 420;
const ENDGAME_SEARCH_BUDGET_MAX_MS = 620;
const CHAOS_OVERWRITE_BASE = 3;
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

function createZeroMatrix() {
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => 0));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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
    const raw = localStorage.getItem(OTHELLO_LEARNING_KEY);
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
    localStorage.setItem(OTHELLO_LEARNING_KEY, JSON.stringify(learning));
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
  const chaosOverwriteTextEl = document.getElementById("chaosOverwriteText");
  const chaosImmutableTextEl = document.getElementById("chaosImmutableText");
  const chaosDestroyTextEl = document.getElementById("chaosDestroyText");
  const chaosRandomCutTextEl = document.getElementById("chaosRandomCutText");
  const chaosHandicapPanelEl = document.getElementById("chaosHandicapPanel");
  const chaosHandicapTargetSelect = document.getElementById("chaosHandicapTargetSelect");
  const chaosHandicapBonusRow = document.getElementById("chaosHandicapBonusRow");
  const chaosHandicapBonusSelect = document.getElementById("chaosHandicapBonusSelect");
  const chaosHandicapSplitRow = document.getElementById("chaosHandicapSplitRow");
  const chaosHandicapBonusBlackSelect = document.getElementById("chaosHandicapBonusBlackSelect");
  const chaosHandicapBonusWhiteSelect = document.getElementById("chaosHandicapBonusWhiteSelect");
  const chaosImmutableBonusRow = document.getElementById("chaosImmutableBonusRow");
  const chaosImmutableBonusSelect = document.getElementById("chaosImmutableBonusSelect");
  const chaosImmutableSplitRow = document.getElementById("chaosImmutableSplitRow");
  const chaosImmutableBonusBlackSelect = document.getElementById("chaosImmutableBonusBlackSelect");
  const chaosImmutableBonusWhiteSelect = document.getElementById("chaosImmutableBonusWhiteSelect");
  const chaosDestroyBonusRow = document.getElementById("chaosDestroyBonusRow");
  const chaosDestroyBonusSelect = document.getElementById("chaosDestroyBonusSelect");
  const chaosDestroySplitRow = document.getElementById("chaosDestroySplitRow");
  const chaosDestroyBonusBlackSelect = document.getElementById("chaosDestroyBonusBlackSelect");
  const chaosDestroyBonusWhiteSelect = document.getElementById("chaosDestroyBonusWhiteSelect");
  const chaosRandomLineExcludeToggle = document.getElementById("chaosRandomLineExcludeToggle");
  const chaosHandicapSummaryEl = document.getElementById("chaosHandicapSummary");

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
    roomLocked: false,
    roomLockMessage: "",
    roomRuleMode:
      modeSelect?.value === "chaos"
        ? "chaos"
        : "local",
    overwriteRemaining: { [BLACK]: CHAOS_OVERWRITE_BASE, [WHITE]: CHAOS_OVERWRITE_BASE },
    immutableChargesRemaining: { [BLACK]: 0, [WHITE]: 0 },
    destroyChargesRemaining: { [BLACK]: 0, [WHITE]: 0 },
    chaosHandicapTarget: chaosHandicapTargetSelect?.value || "none",
    chaosHandicapBonus: Number(chaosHandicapBonusSelect?.value || 0),
    chaosHandicapBonusBlack: Number(chaosHandicapBonusBlackSelect?.value || 0),
    chaosHandicapBonusWhite: Number(chaosHandicapBonusWhiteSelect?.value || 0),
    chaosImmutableBonus: Number(chaosImmutableBonusSelect?.value || 0),
    chaosImmutableBonusBlack: Number(chaosImmutableBonusBlackSelect?.value || 0),
    chaosImmutableBonusWhite: Number(chaosImmutableBonusWhiteSelect?.value || 0),
    chaosDestroyBonus: Number(chaosDestroyBonusSelect?.value || 0),
    chaosDestroyBonusBlack: Number(chaosDestroyBonusBlackSelect?.value || 0),
    chaosDestroyBonusWhite: Number(chaosDestroyBonusWhiteSelect?.value || 0),
    chaosRandomLineExcludeEnabled: Boolean(chaosRandomLineExcludeToggle?.checked),
    chaosLastExcludedLine: null,
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
  };

  // Always start from normal difficulty as requested.
  if (difficultySelect) {
    difficultySelect.value = "normal";
  }
  state.difficulty = "normal";

  function updateTimerText() {
    if (!turnTimerTextEl) return;
    turnTimerTextEl.textContent = `残り${state.turnRemainingSec}秒`;
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
    overlay.textContent = `時間切れ: ${getDisplayName(winner)}の勝ち`;
    overlay.style.opacity = "1";
    messageEl.textContent = `${getDisplayName(state.currentPlayer)}が時間切れになりました`;
    render();
  }

  function startTurnTimer() {
    stopTurnTimer();
    if (state.gameOver || state.roomLocked) return;

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
    if (difficultySelect) {
      difficultySelect.disabled = isLocalMode() || isRoomMode();
    }
    if (turnOrderSelect) {
      turnOrderSelect.disabled = state.gameMode !== "cpu";
      turnOrderSelect.value = state.turnOrder;
    }
    if (modeSelect) {
      modeSelect.value = isRoomMode() ? state.roomRuleMode : state.gameMode;
      modeSelect.disabled = isRoomMode() ? state.roomRole !== "host" || !state.gameOver : false;
    }
    if (startBtn) {
      startBtn.disabled = isRoomMode() && state.roomRole !== "host";
    }
    if (chaosOverwriteTextEl) {
      chaosOverwriteTextEl.classList.toggle("hidden", !isChaosMode());
    }
    if (chaosImmutableTextEl) {
      chaosImmutableTextEl.classList.toggle("hidden", !isChaosMode());
    }
    if (chaosDestroyTextEl) {
      chaosDestroyTextEl.classList.toggle("hidden", !isChaosMode());
    }
    if (chaosRandomCutTextEl) {
      chaosRandomCutTextEl.classList.toggle("hidden", !isChaosMode());
    }
    if (chaosHandicapPanelEl) {
      chaosHandicapPanelEl.classList.toggle("hidden", !isChaosMode());
    }
    if (chaosHandicapTargetSelect) {
      chaosHandicapTargetSelect.disabled = !isChaosMode() || isRoomMode();
    }
    if (chaosHandicapBonusRow) {
      chaosHandicapBonusRow.classList.toggle("hidden", isChaosMode() && state.chaosHandicapTarget === "both");
    }
    if (chaosHandicapSplitRow) {
      chaosHandicapSplitRow.classList.toggle("hidden", !(isChaosMode() && state.chaosHandicapTarget === "both"));
    }
    if (chaosImmutableBonusRow) {
      chaosImmutableBonusRow.classList.toggle("hidden", isChaosMode() && state.chaosHandicapTarget === "both");
    }
    if (chaosImmutableSplitRow) {
      chaosImmutableSplitRow.classList.toggle("hidden", !(isChaosMode() && state.chaosHandicapTarget === "both"));
    }
    if (chaosDestroyBonusRow) {
      chaosDestroyBonusRow.classList.toggle("hidden", isChaosMode() && state.chaosHandicapTarget === "both");
    }
    if (chaosDestroySplitRow) {
      chaosDestroySplitRow.classList.toggle("hidden", !(isChaosMode() && state.chaosHandicapTarget === "both"));
    }
    if (chaosHandicapBonusSelect) {
      chaosHandicapBonusSelect.disabled = !isChaosMode() || isRoomMode();
    }
    if (chaosHandicapBonusBlackSelect) {
      chaosHandicapBonusBlackSelect.disabled = !isChaosMode() || isRoomMode() || state.chaosHandicapTarget !== "both";
    }
    if (chaosHandicapBonusWhiteSelect) {
      chaosHandicapBonusWhiteSelect.disabled = !isChaosMode() || isRoomMode() || state.chaosHandicapTarget !== "both";
    }
    if (chaosImmutableBonusSelect) {
      chaosImmutableBonusSelect.disabled = !isChaosMode() || isRoomMode();
    }
    if (chaosImmutableBonusBlackSelect) {
      chaosImmutableBonusBlackSelect.disabled = !isChaosMode() || isRoomMode() || state.chaosHandicapTarget !== "both";
    }
    if (chaosImmutableBonusWhiteSelect) {
      chaosImmutableBonusWhiteSelect.disabled = !isChaosMode() || isRoomMode() || state.chaosHandicapTarget !== "both";
    }
    if (chaosDestroyBonusSelect) {
      chaosDestroyBonusSelect.disabled = !isChaosMode() || isRoomMode();
    }
    if (chaosDestroyBonusBlackSelect) {
      chaosDestroyBonusBlackSelect.disabled = !isChaosMode() || isRoomMode() || state.chaosHandicapTarget !== "both";
    }
    if (chaosDestroyBonusWhiteSelect) {
      chaosDestroyBonusWhiteSelect.disabled = !isChaosMode() || isRoomMode() || state.chaosHandicapTarget !== "both";
    }
    if (chaosRandomLineExcludeToggle) {
      chaosRandomLineExcludeToggle.disabled = !isChaosMode() || isRoomMode();
    }
    updateChaosHandicapSummary();
    updateDifficultyIndicator();
  }

  function getChaosHandicapTargets() {
    if (!isChaosMode()) return [];
    const target = state.chaosHandicapTarget;
    if (target === "black") return [BLACK];
    if (target === "white") return [WHITE];
    if (target === "both") return [BLACK, WHITE];
    return [];
  }

  function applyChaosHandicapSettings() {
    state.overwriteRemaining[BLACK] = CHAOS_OVERWRITE_BASE;
    state.overwriteRemaining[WHITE] = CHAOS_OVERWRITE_BASE;
    state.immutableChargesRemaining[BLACK] = 0;
    state.immutableChargesRemaining[WHITE] = 0;
    state.destroyChargesRemaining[BLACK] = 0;
    state.destroyChargesRemaining[WHITE] = 0;

    if (!isChaosMode()) return;

    const bonus = clamp(Math.floor(Number(state.chaosHandicapBonus) || 0), 0, 3);
    const blackBonus = clamp(Math.floor(Number(state.chaosHandicapBonusBlack) || 0), 0, 3);
    const whiteBonus = clamp(Math.floor(Number(state.chaosHandicapBonusWhite) || 0), 0, 3);
    const immutableBonus = clamp(Math.floor(Number(state.chaosImmutableBonus) || 0), 0, 2);
    const immutableBlackBonus = clamp(Math.floor(Number(state.chaosImmutableBonusBlack) || 0), 0, 2);
    const immutableWhiteBonus = clamp(Math.floor(Number(state.chaosImmutableBonusWhite) || 0), 0, 2);
    const destroyBonus = clamp(Math.floor(Number(state.chaosDestroyBonus) || 0), 0, 2);
    const destroyBlackBonus = clamp(Math.floor(Number(state.chaosDestroyBonusBlack) || 0), 0, 2);
    const destroyWhiteBonus = clamp(Math.floor(Number(state.chaosDestroyBonusWhite) || 0), 0, 2);
    if (state.chaosHandicapTarget === "both") {
      state.overwriteRemaining[BLACK] += blackBonus;
      state.overwriteRemaining[WHITE] += whiteBonus;
      state.immutableChargesRemaining[BLACK] += immutableBlackBonus;
      state.immutableChargesRemaining[WHITE] += immutableWhiteBonus;
      state.destroyChargesRemaining[BLACK] += destroyBlackBonus;
      state.destroyChargesRemaining[WHITE] += destroyWhiteBonus;
      return;
    }

    getChaosHandicapTargets().forEach((player) => {
      state.overwriteRemaining[player] += bonus;
      state.immutableChargesRemaining[player] += immutableBonus;
      state.destroyChargesRemaining[player] += destroyBonus;
    });
  }

  function updateChaosHandicapSummary() {
    if (!chaosHandicapSummaryEl) return;

    const labelMap = {
      none: "なし",
      black: "黒",
      white: "白",
      both: "両者",
    };
    const targetLabel = labelMap[state.chaosHandicapTarget] ?? "なし";
    const bonus = clamp(Math.floor(Number(state.chaosHandicapBonus) || 0), 0, 3);
    const blackBonus = clamp(Math.floor(Number(state.chaosHandicapBonusBlack) || 0), 0, 3);
    const whiteBonus = clamp(Math.floor(Number(state.chaosHandicapBonusWhite) || 0), 0, 3);
    const immutableBonus = clamp(Math.floor(Number(state.chaosImmutableBonus) || 0), 0, 2);
    const immutableBlackBonus = clamp(Math.floor(Number(state.chaosImmutableBonusBlack) || 0), 0, 2);
    const immutableWhiteBonus = clamp(Math.floor(Number(state.chaosImmutableBonusWhite) || 0), 0, 2);
    const destroyBonus = clamp(Math.floor(Number(state.chaosDestroyBonus) || 0), 0, 2);
    const destroyBlackBonus = clamp(Math.floor(Number(state.chaosDestroyBonusBlack) || 0), 0, 2);
    const destroyWhiteBonus = clamp(Math.floor(Number(state.chaosDestroyBonusWhite) || 0), 0, 2);
    const randomCut = state.chaosRandomLineExcludeEnabled ? "ON" : "OFF";

    const hasAnyBonus = state.chaosHandicapTarget === "both"
      ? blackBonus > 0 || whiteBonus > 0 || immutableBlackBonus > 0 || immutableWhiteBonus > 0 || destroyBlackBonus > 0 || destroyWhiteBonus > 0
      : bonus > 0 || immutableBonus > 0 || destroyBonus > 0;

    if (targetLabel === "なし" || !hasAnyBonus) {
      chaosHandicapSummaryEl.textContent = `適用: なし / ランダム1列無効 ${randomCut}`;
      return;
    }

    if (state.chaosHandicapTarget === "both") {
      chaosHandicapSummaryEl.textContent =
        `適用: 両者 黒上書き+${blackBonus} 白上書き+${whiteBonus} 黒固定石+${immutableBlackBonus} 白固定石+${immutableWhiteBonus} 黒破壊+${destroyBlackBonus} 白破壊+${destroyWhiteBonus} / ランダム1列無効 ${randomCut}`;
      return;
    }

    chaosHandicapSummaryEl.textContent =
      `適用: ${targetLabel} 上書き+${bonus} 固定石+${immutableBonus} 破壊+${destroyBonus} / ランダム1列無効 ${randomCut}`;
  }

  function countPiecesWithExcludedLine(board, excludedLine = null) {
    let black = 0;
    let white = 0;
    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        if (excludedLine?.kind === "row" && row === excludedLine.index) continue;
        if (excludedLine?.kind === "col" && col === excludedLine.index) continue;
        if (board[row][col] === BLACK) black += 1;
        if (board[row][col] === WHITE) white += 1;
      }
    }
    return { black, white };
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

  function resetGame({ fromRemote = false } = {}) {
    clearTimeout(state.cpuTimerId);
    state.cpuTimerId = null;
    stopTurnTimer({ reset: true });
    state.board = createInitialBoard();
    applyOpeningConfig();
    state.gameOver = false;
    state.chaosLastExcludedLine = null;
    applyChaosHandicapSettings();
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
      if (state.roomLocked) {
        messageEl.textContent = state.roomLockMessage || "対戦相手を待っています...";
      } else {
        messageEl.textContent =
          state.currentPlayer === state.roomPlayer ? "あなたの手番です" : "相手の手番です";
      }
      if (!fromRemote) {
        options.onRoomNewGame?.();
      }
    } else {
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
    state.chaosLastExcludedLine = null;
    applyChaosHandicapSettings();
    resetDrawVotes();
    overlay.style.opacity = "1";
    overlay.textContent = "GAME STARTで開始";
    messageEl.textContent = "STARTボタンで開始してください";
    updateModeUiState();
    render();
  }

  function getPlayerName(player) {
    return player === BLACK ? "BLACK" : "WHITE";
  }

  function getDisplayName(player) {
    return player === BLACK ? "黒" : "白";
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

    const waitingFor = state.drawVotes[BLACK] ? WHITE : BLACK;
    messageEl.textContent = `${getDisplayName(waitingFor)}の投票待ちです`;
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
    if (chaosOverwriteTextEl) {
      if (isChaosMode()) {
        const remain = state.overwriteRemaining[state.currentPlayer] ?? 0;
        chaosOverwriteTextEl.textContent = `上書き残り: ${remain}`;
      } else {
        chaosOverwriteTextEl.textContent = "上書き残り: -";
      }
    }
    if (chaosImmutableTextEl) {
      if (isChaosMode()) {
        const remain = state.immutableChargesRemaining[state.currentPlayer] ?? 0;
        chaosImmutableTextEl.textContent = `固定石チャージ: ${remain}`;
      } else {
        chaosImmutableTextEl.textContent = "固定石チャージ: -";
      }
    }
    if (chaosDestroyTextEl) {
      if (isChaosMode()) {
        const remain = state.destroyChargesRemaining[state.currentPlayer] ?? 0;
        chaosDestroyTextEl.textContent = `駒破壊残り: ${remain}`;
      } else {
        chaosDestroyTextEl.textContent = "駒破壊残り: -";
      }
    }
    if (chaosRandomCutTextEl) {
      chaosRandomCutTextEl.textContent = isChaosMode() && state.chaosRandomLineExcludeEnabled
        ? "終局ランダム1列無効: ON"
        : "終局ランダム1列無効: OFF";
    }
  }

  function isCpuTurn() {
    if (state.gameOver || isLocalMode() || isChaosMode() || isRoomMode()) return false;
    if (isCpuVsCpuMode()) return true;
    return state.currentPlayer === state.cpuPlayer;
  }

  function isLocalPlayersTurn() {
    if (isRoomMode()) {
      return !state.roomLocked && state.currentPlayer === state.roomPlayer;
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
    let excludedLine = null;
    if (isChaosMode() && state.chaosRandomLineExcludeEnabled) {
      const kind = Math.random() < 0.5 ? "row" : "col";
      const index = Math.floor(Math.random() * SIZE);
      excludedLine = { kind, index };
    }
    state.chaosLastExcludedLine = excludedLine;
    const { black, white } = countPiecesWithExcludedLine(state.board, excludedLine);

    applyOutcomeLearning(white > black, white === black);

    const excludedText = excludedLine
      ? ` / 無効: ${excludedLine.kind === "row" ? "行" : "列"}${excludedLine.index + 1}`
      : "";

    if (black > white) {
      overlay.textContent = `ゲーム終了: 黒の勝ち (${black} - ${white})${excludedText}`;
    } else if (white > black) {
      overlay.textContent = `ゲーム終了: 白の勝ち (${white} - ${black})${excludedText}`;
    } else {
      overlay.textContent = `ゲーム終了: 引き分け (${black} - ${white})${excludedText}`;
    }

    overlay.style.opacity = "1";
    messageEl.textContent = "GAME STARTで再開できます";
  }

  function nextTurnOrFinish() {
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
      state.board[r][c] = player;
    });
  }

  function simulateBoardAfterMove(board, move, player) {
    const next = cloneBoard(board);
    next[move.row][move.col] = player;
    move.flips.forEach(([r, c]) => {
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

  function handleMove(row, col, { isRemote = false } = {}) {
    if (state.gameOver) return;
    if (!isRemote && !isLocalPlayersTurn()) return;

    const move = getMoveCandidate(state.board, row, col, state.currentPlayer, {
      allowChaosOverwrite: isChaosMode(),
    });
    if (!move) return;

    placeMove(row, col, state.currentPlayer, move.flips, { isOverwrite: Boolean(move.isOverwrite) });
    if (isChaosMode() && move.isOverwrite) {
      const remain = state.overwriteRemaining[state.currentPlayer];
      messageEl.textContent = `上書きを使用しました（残り${remain}回）`;
    }
    if (!isRemote && isHumanVsCpuMode() && state.currentPlayer !== state.cpuPlayer) {
      recordPlayerMove(row, col);
    }
    if (isRoomMode() && !isRemote) {
      options.onRoomMove?.({ row, col });
    }

    nextTurnOrFinish();
    render();
    scheduleCpuMove();
  }

  function renderBoard() {
    boardEl.innerHTML = "";
    const validMoves = getValidMoves(state.board, state.currentPlayer, { allowChaosOverwrite: isChaosMode() });
    const validSet = new Set(validMoves.map((m) => `${m.row}-${m.col}`));
    const showValid = !state.gameOver && isLocalPlayersTurn();

    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "cell";
        cell.disabled = state.gameOver || !isLocalPlayersTurn();

        if (state.board[row][col] === BLACK) cell.classList.add("black");
        if (state.board[row][col] === WHITE) cell.classList.add("white");
        if (showValid && validSet.has(`${row}-${col}`)) cell.classList.add("valid");

        cell.addEventListener("click", () => {
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
        updateModeUiState();
        enterStandby();
        options.onRoomRuleChange?.({ mode: state.roomRuleMode });
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

  if (chaosHandicapTargetSelect) {
    chaosHandicapTargetSelect.addEventListener("change", () => {
      state.chaosHandicapTarget = chaosHandicapTargetSelect.value;
      updateModeUiState();
      updateChaosHandicapSummary();

      if (isChaosMode() && state.gameOver) {
        applyChaosHandicapSettings();
        render();
      }
    });
  }

  if (chaosHandicapBonusSelect) {
    chaosHandicapBonusSelect.addEventListener("change", () => {
      state.chaosHandicapBonus = clamp(Math.floor(Number(chaosHandicapBonusSelect.value) || 0), 0, 3);
      updateChaosHandicapSummary();

      if (isChaosMode() && state.gameOver) {
        applyChaosHandicapSettings();
        render();
      }
    });
  }

  if (chaosHandicapBonusBlackSelect) {
    chaosHandicapBonusBlackSelect.addEventListener("change", () => {
      state.chaosHandicapBonusBlack = clamp(Math.floor(Number(chaosHandicapBonusBlackSelect.value) || 0), 0, 3);
      updateChaosHandicapSummary();

      if (isChaosMode() && state.gameOver) {
        applyChaosHandicapSettings();
        render();
      }
    });
  }

  if (chaosHandicapBonusWhiteSelect) {
    chaosHandicapBonusWhiteSelect.addEventListener("change", () => {
      state.chaosHandicapBonusWhite = clamp(Math.floor(Number(chaosHandicapBonusWhiteSelect.value) || 0), 0, 3);
      updateChaosHandicapSummary();

      if (isChaosMode() && state.gameOver) {
        applyChaosHandicapSettings();
        render();
      }
    });
  }

  if (chaosImmutableBonusSelect) {
    chaosImmutableBonusSelect.addEventListener("change", () => {
      state.chaosImmutableBonus = clamp(Math.floor(Number(chaosImmutableBonusSelect.value) || 0), 0, 2);
      updateChaosHandicapSummary();

      if (isChaosMode() && state.gameOver) {
        applyChaosHandicapSettings();
        render();
      }
    });
  }

  if (chaosImmutableBonusBlackSelect) {
    chaosImmutableBonusBlackSelect.addEventListener("change", () => {
      state.chaosImmutableBonusBlack = clamp(Math.floor(Number(chaosImmutableBonusBlackSelect.value) || 0), 0, 2);
      updateChaosHandicapSummary();

      if (isChaosMode() && state.gameOver) {
        applyChaosHandicapSettings();
        render();
      }
    });
  }

  if (chaosImmutableBonusWhiteSelect) {
    chaosImmutableBonusWhiteSelect.addEventListener("change", () => {
      state.chaosImmutableBonusWhite = clamp(Math.floor(Number(chaosImmutableBonusWhiteSelect.value) || 0), 0, 2);
      updateChaosHandicapSummary();

      if (isChaosMode() && state.gameOver) {
        applyChaosHandicapSettings();
        render();
      }
    });
  }

  if (chaosDestroyBonusSelect) {
    chaosDestroyBonusSelect.addEventListener("change", () => {
      state.chaosDestroyBonus = clamp(Math.floor(Number(chaosDestroyBonusSelect.value) || 0), 0, 2);
      updateChaosHandicapSummary();

      if (isChaosMode() && state.gameOver) {
        applyChaosHandicapSettings();
        render();
      }
    });
  }

  if (chaosDestroyBonusBlackSelect) {
    chaosDestroyBonusBlackSelect.addEventListener("change", () => {
      state.chaosDestroyBonusBlack = clamp(Math.floor(Number(chaosDestroyBonusBlackSelect.value) || 0), 0, 2);
      updateChaosHandicapSummary();

      if (isChaosMode() && state.gameOver) {
        applyChaosHandicapSettings();
        render();
      }
    });
  }

  if (chaosDestroyBonusWhiteSelect) {
    chaosDestroyBonusWhiteSelect.addEventListener("change", () => {
      state.chaosDestroyBonusWhite = clamp(Math.floor(Number(chaosDestroyBonusWhiteSelect.value) || 0), 0, 2);
      updateChaosHandicapSummary();

      if (isChaosMode() && state.gameOver) {
        applyChaosHandicapSettings();
        render();
      }
    });
  }

  if (chaosRandomLineExcludeToggle) {
    chaosRandomLineExcludeToggle.addEventListener("change", () => {
      state.chaosRandomLineExcludeEnabled = Boolean(chaosRandomLineExcludeToggle.checked);
      updateChaosHandicapSummary();
      render();
    });
  }

  enterStandby();
  return {
    startNewGame: (opts) => resetGame(opts),
    enterStandby,
    stop: stopGameLoop,
    configureRoomMode: ({ roomCode, roomRole, roomPlayer, roomRuleMode }) => {
      state.gameMode = "room";
      state.roomCode = roomCode;
      state.roomRole = roomRole;
      state.roomPlayer = roomPlayer;
      if (roomRuleMode === "chaos" || roomRuleMode === "local") {
        state.roomRuleMode = roomRuleMode;
      }
      updateModeUiState();
      options.onRoomStatusChange?.({ roomCode: state.roomCode, roomRole: state.roomRole });
    },
    configureStandardMode: (mode) => {
      state.gameMode =
        mode === "local" ? "local" : mode === "cpuvscpu" ? "cpuvscpu" : mode === "chaos" ? "chaos" : "cpu";
      state.roomCode = null;
      state.roomRole = null;
      state.roomPlayer = BLACK;
      state.roomLocked = false;
      state.roomLockMessage = "";
      if (state.gameMode !== "cpu") {
        state.turnOrder = "player-first";
      }
      state.roomRuleMode = "local";
      updateModeUiState();
      options.onRoomStatusChange?.({ roomCode: null, roomRole: null });
    },
    setRoomRuleMode: (mode, { fromRemote = false } = {}) => {
      if (mode !== "chaos" && mode !== "local") return;
      state.roomRuleMode = mode;
      updateModeUiState();
      if (state.gameOver) {
        render();
      }
      if (!fromRemote) {
        options.onRoomRuleChange?.({ mode: state.roomRuleMode });
      }
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
        messageEl.textContent =
          state.currentPlayer === state.roomPlayer ? "あなたの手番です" : "相手の手番です";
        startTurnTimer();
      }

      render();
    },
    applyRemoteMove: ({ row, col }) => {
      handleMove(row, col, { isRemote: true });
    },
    applyRemoteDrawVote: ({ voter }) => {
      applyDrawVote(voter, { isRemote: true });
    },
    getSnapshot: () => ({
      board: cloneBoard(state.board),
      currentPlayer: state.currentPlayer,
      gameOver: state.gameOver,
    }),
    applySnapshot: ({ board, currentPlayer, gameOver }) => {
      if (!board || !Array.isArray(board)) return;
      state.board = cloneBoard(board);
      state.currentPlayer = currentPlayer;
      state.gameOver = Boolean(gameOver);
      resetDrawVotes();
      if (state.gameOver || state.roomLocked) {
        stopTurnTimer();
      } else {
        startTurnTimer();
      }
      render();
    },
  };
}
