const SIZE = 8;
const WHITE = "white";
const BLACK = "black";
const CPU_THINK_DELAY_MS = 300;

const CPU_LEVEL_SETTINGS = {
  easy: {
    randomRate: 0.58,
    thinkDelayMinMs: 120,
    thinkDelayVarMs: 200,
    captureWeight: 8,
    checkBonus: 2,
    centerBonus: 0.7,
    searchDepth: 1,
    maxBranches: 12,
  },
  normal: {
    randomRate: 0.2,
    thinkDelayMinMs: CPU_THINK_DELAY_MS,
    thinkDelayVarMs: 220,
    captureWeight: 10,
    checkBonus: 4,
    centerBonus: 1,
    searchDepth: 2,
    maxBranches: 16,
  },
  hard: {
    randomRate: 0.04,
    thinkDelayMinMs: 360,
    thinkDelayVarMs: 260,
    captureWeight: 11,
    checkBonus: 5,
    centerBonus: 1.1,
    searchDepth: 3,
    maxBranches: 20,
  },
};

const PIECE_SCORE = {
  K: 1000,
  Q: 9,
  R: 5,
  B: 3,
  N: 3,
  P: 1,
};

const PIECE_COLOR_THEME = {
  amber: {
    color: "#ffdb8a",
    glow: "rgba(255, 195, 95, 0.62)",
    stroke: "rgba(16, 10, 6, 0.9)",
  },
  cyan: {
    color: "#9ff6ff",
    glow: "rgba(94, 223, 255, 0.62)",
    stroke: "rgba(8, 33, 36, 0.9)",
  },
  lime: {
    color: "#cdfb9b",
    glow: "rgba(141, 236, 102, 0.62)",
    stroke: "rgba(20, 37, 14, 0.9)",
  },
  magenta: {
    color: "#ffb5f1",
    glow: "rgba(248, 123, 224, 0.62)",
    stroke: "rgba(48, 13, 38, 0.9)",
  },
};

const PIECE_NAME = {
  K: "キング",
  Q: "クイーン",
  R: "ルーク",
  B: "ビショップ",
  N: "ナイト",
  P: "ポーン",
};

const PIECE_GLYPH = {
  white: {
    K: "♔",
    Q: "♕",
    R: "♖",
    B: "♗",
    N: "♘",
    P: "♙",
  },
  black: {
    K: "♚",
    Q: "♛",
    R: "♜",
    B: "♝",
    N: "♞",
    P: "♟",
  },
};

function inside(row, col) {
  return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
}

function opposite(owner) {
  return owner === WHITE ? BLACK : WHITE;
}

function cloneBoard(board) {
  return board.map((row) => row.map((piece) => (piece ? { ...piece } : null)));
}

function createInitialBoard() {
  const board = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => null));
  const back = ["R", "N", "B", "Q", "K", "B", "N", "R"];

  for (let i = 0; i < SIZE; i += 1) {
    board[0][i] = { owner: BLACK, type: back[i] };
    board[1][i] = { owner: BLACK, type: "P" };
    board[6][i] = { owner: WHITE, type: "P" };
    board[7][i] = { owner: WHITE, type: back[i] };
  }

  return board;
}

function findKing(board, owner) {
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const piece = board[row][col];
      if (piece && piece.owner === owner && piece.type === "K") {
        return { row, col };
      }
    }
  }
  return null;
}

function pushStep(board, piece, row, col, moves) {
  if (!inside(row, col)) return;
  const target = board[row][col];
  if (!target || target.owner !== piece.owner) {
    moves.push({ row, col });
  }
}

function pushSlide(board, piece, fromRow, fromCol, deltas, moves) {
  deltas.forEach(([dr, dc]) => {
    let row = fromRow + dr;
    let col = fromCol + dc;
    while (inside(row, col)) {
      const target = board[row][col];
      if (!target) {
        moves.push({ row, col });
      } else {
        if (target.owner !== piece.owner) {
          moves.push({ row, col });
        }
        break;
      }
      row += dr;
      col += dc;
    }
  });
}

function getPseudoMoves(board, fromRow, fromCol, { forAttack = false } = {}) {
  const piece = board[fromRow]?.[fromCol];
  if (!piece) return [];

  const moves = [];

  if (piece.type === "P") {
    const dir = piece.owner === WHITE ? -1 : 1;
    const startRow = piece.owner === WHITE ? 6 : 1;

    if (!forAttack) {
      const oneRow = fromRow + dir;
      if (inside(oneRow, fromCol) && !board[oneRow][fromCol]) {
        moves.push({ row: oneRow, col: fromCol });

        const twoRow = fromRow + dir * 2;
        if (fromRow === startRow && !board[twoRow][fromCol]) {
          moves.push({ row: twoRow, col: fromCol });
        }
      }
    }

    [[dir, -1], [dir, 1]].forEach(([dr, dc]) => {
      const row = fromRow + dr;
      const col = fromCol + dc;
      if (!inside(row, col)) return;

      if (forAttack) {
        moves.push({ row, col });
        return;
      }

      const target = board[row][col];
      if (target && target.owner !== piece.owner) {
        moves.push({ row, col });
      }
    });

    return moves;
  }

  if (piece.type === "N") {
    [
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1],
    ].forEach(([dr, dc]) => pushStep(board, piece, fromRow + dr, fromCol + dc, moves));
    return moves;
  }

  if (piece.type === "K") {
    [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ].forEach(([dr, dc]) => pushStep(board, piece, fromRow + dr, fromCol + dc, moves));
    return moves;
  }

  if (piece.type === "B" || piece.type === "Q") {
    pushSlide(
      board,
      piece,
      fromRow,
      fromCol,
      [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ],
      moves,
    );
  }

  if (piece.type === "R" || piece.type === "Q") {
    pushSlide(
      board,
      piece,
      fromRow,
      fromCol,
      [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ],
      moves,
    );
  }

  return moves;
}

function applyMoveOnBoard(board, fromRow, fromCol, toRow, toCol) {
  const piece = board[fromRow][fromCol];
  if (!piece) return false;

  board[toRow][toCol] = { ...piece };
  board[fromRow][fromCol] = null;

  if (piece.type === "P") {
    if ((piece.owner === WHITE && toRow === 0) || (piece.owner === BLACK && toRow === SIZE - 1)) {
      board[toRow][toCol].type = "Q";
    }
  }

  return true;
}

function isInCheck(board, owner) {
  const kingPos = findKing(board, owner);
  if (!kingPos) return true;

  const enemy = opposite(owner);
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.owner !== enemy) continue;
      const attacks = getPseudoMoves(board, row, col, { forAttack: true });
      if (attacks.some((m) => m.row === kingPos.row && m.col === kingPos.col)) {
        return true;
      }
    }
  }

  return false;
}

function getLegalMoves(board, fromRow, fromCol) {
  const piece = board[fromRow]?.[fromCol];
  if (!piece) return [];

  const pseudo = getPseudoMoves(board, fromRow, fromCol);
  return pseudo.filter((target) => {
    const targetPiece = board[target.row]?.[target.col];
    if (targetPiece?.type === "K") return false;

    const next = cloneBoard(board);
    if (!applyMoveOnBoard(next, fromRow, fromCol, target.row, target.col)) return false;
    return !isInCheck(next, piece.owner);
  });
}

function hasAnyLegalMove(board, owner) {
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.owner !== owner) continue;
      if (getLegalMoves(board, row, col).length > 0) {
        return true;
      }
    }
  }
  return false;
}

function collectAllLegalMoves(board, owner) {
  const moves = [];
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.owner !== owner) continue;

      const legal = getLegalMoves(board, row, col);
      legal.forEach((target) => {
        moves.push({ fromRow: row, fromCol: col, toRow: target.row, toCol: target.col });
      });
    }
  }
  return moves;
}

function evaluateBoard(board, owner, cpuSetting) {
  const enemy = opposite(owner);
  let score = 0;

  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const piece = board[row][col];
      if (!piece) continue;

      const base = PIECE_SCORE[piece.type] ?? 0;
      const centerDistance = Math.abs(3.5 - row) + Math.abs(3.5 - col);
      const centerScore = (4 - centerDistance) * cpuSetting.centerBonus;
      const signed = base + centerScore;

      score += piece.owner === owner ? signed : -signed;
    }
  }

  if (isInCheck(board, enemy)) {
    score += cpuSetting.checkBonus;
  }
  if (isInCheck(board, owner)) {
    score -= cpuSetting.checkBonus;
  }

  return score;
}

function scoreMoveHeuristic(board, move, owner, cpuSetting) {
  const target = board[move.toRow][move.toCol];
  let score = 0;

  if (target) {
    score += (PIECE_SCORE[target.type] ?? 0) * cpuSetting.captureWeight;
  }

  const centerDistance = Math.abs(3.5 - move.toRow) + Math.abs(3.5 - move.toCol);
  score += (5 - centerDistance) * cpuSetting.centerBonus;

  const next = cloneBoard(board);
  applyMoveOnBoard(next, move.fromRow, move.fromCol, move.toRow, move.toCol);
  if (isInCheck(next, opposite(owner))) {
    score += cpuSetting.checkBonus;
  }

  return score;
}

function minimax(board, rootOwner, currentOwner, depth, alpha, beta, cpuSetting) {
  const legalMoves = collectAllLegalMoves(board, currentOwner);

  if (legalMoves.length === 0) {
    if (isInCheck(board, currentOwner)) {
      return currentOwner === rootOwner ? -100000 : 100000;
    }
    return 0;
  }

  if (depth <= 0) {
    return evaluateBoard(board, rootOwner, cpuSetting);
  }

  const ordered = [...legalMoves]
    .sort((a, b) => scoreMoveHeuristic(board, b, currentOwner, cpuSetting) - scoreMoveHeuristic(board, a, currentOwner, cpuSetting))
    .slice(0, cpuSetting.maxBranches);

  if (currentOwner === rootOwner) {
    let value = -Infinity;
    for (const move of ordered) {
      const next = cloneBoard(board);
      applyMoveOnBoard(next, move.fromRow, move.fromCol, move.toRow, move.toCol);
      value = Math.max(value, minimax(next, rootOwner, opposite(currentOwner), depth - 1, alpha, beta, cpuSetting));
      alpha = Math.max(alpha, value);
      if (beta <= alpha) break;
    }
    return value;
  }

  let value = Infinity;
  for (const move of ordered) {
    const next = cloneBoard(board);
    applyMoveOnBoard(next, move.fromRow, move.fromCol, move.toRow, move.toCol);
    value = Math.min(value, minimax(next, rootOwner, opposite(currentOwner), depth - 1, alpha, beta, cpuSetting));
    beta = Math.min(beta, value);
    if (beta <= alpha) break;
  }
  return value;
}

function chooseCpuMove(board, owner, level = "normal") {
  const cpuSetting = CPU_LEVEL_SETTINGS[level] ?? CPU_LEVEL_SETTINGS.normal;
  const candidates = collectAllLegalMoves(board, owner);
  if (candidates.length === 0) return null;

  if (Math.random() < cpuSetting.randomRate) {
    return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
  }

  let bestScore = -Infinity;
  let bestMoves = [];

  const orderedCandidates = [...candidates]
    .sort((a, b) => scoreMoveHeuristic(board, b, owner, cpuSetting) - scoreMoveHeuristic(board, a, owner, cpuSetting))
    .slice(0, cpuSetting.maxBranches);

  orderedCandidates.forEach((move) => {
    const next = cloneBoard(board);
    applyMoveOnBoard(next, move.fromRow, move.fromCol, move.toRow, move.toCol);

    const score =
      minimax(next, owner, opposite(owner), cpuSetting.searchDepth - 1, -Infinity, Infinity, cpuSetting) + Math.random() * 0.3;

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  });

  return bestMoves[Math.floor(Math.random() * bestMoves.length)] ?? null;
}

function turnLabel(owner) {
  const ko = (document.documentElement.getAttribute("lang") || "ja").toLowerCase().startsWith("ko");
  return owner === WHITE ? (ko ? "백" : "白") : (ko ? "흑" : "黒");
}

function pieceLabel(piece) {
  return `${turnLabel(piece.owner)} ${PIECE_NAME[piece.type]}`;
}

function pieceGlyph(piece) {
  return PIECE_GLYPH[piece.owner]?.[piece.type] ?? "?";
}

function normalizeMyPieceColor(value) {
  const raw = String(value ?? "amber").trim().toLowerCase();
  if (["amber", "cyan", "lime", "magenta"].includes(raw)) return raw;
  return "amber";
}

export function initChess(options = {}) {
  const screenEl = document.getElementById("chessScreen");
  const boardEl = document.getElementById("chessBoard");
  const turnTextEl = document.getElementById("chessTurnText");
  const selectTextEl = document.getElementById("chessSelectText");
  const messageEl = document.getElementById("chessMessage");
  const overlayEl = document.getElementById("chessOverlay");
  const startBtn = document.getElementById("chessStartBtn");
  const remakeBtn = document.getElementById("chessRemakeBtn");
  const menuBtn = document.getElementById("chessMenuBtn");
  const modeSelect = document.getElementById("chessModeSelect");
  const cpuSideSelect = document.getElementById("chessCpuSideSelect");
  const difficultySelect = document.getElementById("chessDifficultySelect");
  const myPieceColorSelect = document.getElementById("chessMyPieceColorSelect");
  const i18nLang = () => (document.documentElement.getAttribute("lang") || "ja").toLowerCase();
  const t = (ja, ko) => (i18nLang().startsWith("ko") ? ko : ja);

  function resolveCpuPlayerFromSelection() {
    const selected = cpuSideSelect?.value ?? "white";
    if (selected === "random") {
      return Math.random() < 0.5 ? WHITE : BLACK;
    }
    return selected === "white" ? BLACK : WHITE;
  }

  const state = {
    board: createInitialBoard(),
    currentPlayer: WHITE,
    selected: null,
    validMoves: [],
    gameOver: false,
    playMode: modeSelect?.value === "local" ? "local" : "cpu",
    cpuPlayer: resolveCpuPlayerFromSelection(),
    cpuLevel: CPU_LEVEL_SETTINGS[difficultySelect?.value] ? difficultySelect.value : "normal",
    myPieceColor: normalizeMyPieceColor(myPieceColorSelect?.value),
    roomPieceColorByOwner: {
      [WHITE]: normalizeMyPieceColor(myPieceColorSelect?.value),
      [BLACK]: "amber",
    },
    cpuTimerId: null,
    cpuThinking: false,
    gameMode: "local",
    roomCode: null,
    roomRole: null,
    roomPlayer: WHITE,
    roomLocked: false,
    roomLockMessage: "",
  };

  function fitBoardToGrid() {
    const wrap = boardEl?.parentElement;
    if (!wrap) return;

    const BORDER = 2;
    const GAP = 0;
    const CHROME = BORDER * 2 + GAP * (SIZE - 1);
    const maxByWrap = Math.max(220, wrap.clientWidth - 6);
    const maxByViewport = Math.max(220, Math.floor(window.innerHeight * 0.74));
    const maxBoard = Math.min(maxByWrap, maxByViewport, 760);

    const cellByBoard = Math.floor((maxBoard - CHROME) / SIZE);
    const cellPx = Math.max(26, Math.min(92, cellByBoard));
    const boardPx = cellPx * SIZE + CHROME;

    boardEl.style.setProperty("--chess-cell-size", `${cellPx}px`);
    boardEl.style.width = `${boardPx}px`;
    boardEl.style.height = `${boardPx}px`;
  }

  function isRoomMode() {
    return state.gameMode === "room";
  }

  function isCpuMode() {
    return !isRoomMode() && state.playMode === "cpu";
  }

  function clearCpuTimer() {
    clearTimeout(state.cpuTimerId);
    state.cpuTimerId = null;
  }

  function isCpuTurn() {
    return isCpuMode() && !state.gameOver && state.currentPlayer === state.cpuPlayer;
  }

  function playerNameFor(owner) {
    if (isRoomMode()) {
      return owner === state.roomPlayer ? t("あなた", "당신") : t("相手", "상대");
    }
    if (isCpuMode()) {
      return owner === state.cpuPlayer ? "CPU" : t("あなた", "당신");
    }
    return turnLabel(owner);
  }

  function outcomeTextForWinner(winnerOwner) {
    const loserOwner = opposite(winnerOwner);
    return `${playerNameFor(winnerOwner)}: 勝ち / ${playerNameFor(loserOwner)}: 負け`;
  }

  function getLocalPlayerOwner() {
    if (isRoomMode()) {
      return state.roomPlayer;
    }
    if (isCpuMode()) {
      return opposite(state.cpuPlayer);
    }
    return WHITE;
  }

  function shouldFlipBoard() {
    return getLocalPlayerOwner() === BLACK;
  }

  function getColorTheme(color) {
    return PIECE_COLOR_THEME[normalizeMyPieceColor(color)] ?? PIECE_COLOR_THEME.amber;
  }

  function getPieceColorByOwner(owner) {
    if (isRoomMode()) {
      return normalizeMyPieceColor(state.roomPieceColorByOwner[owner] ?? "amber");
    }
    if (owner === getLocalPlayerOwner()) {
      return state.myPieceColor;
    }
    return owner === WHITE ? "white" : "black";
  }

  function applyMyPieceColorTheme() {
    if (!boardEl) return;
    const color = normalizeMyPieceColor(myPieceColorSelect?.value ?? state.myPieceColor);
    state.myPieceColor = color;

    if (isRoomMode()) {
      state.roomPieceColorByOwner[state.roomPlayer] = color;
    }

    const localOwner = getLocalPlayerOwner();
    const enemyOwner = opposite(localOwner);
    const selfTheme = getColorTheme(getPieceColorByOwner(localOwner));

    let opponentTheme;
    if (isRoomMode()) {
      opponentTheme = getColorTheme(getPieceColorByOwner(enemyOwner));
    } else {
      opponentTheme =
        enemyOwner === WHITE
          ? { color: "#ffffff", glow: "rgba(0, 0, 0, 0.72)", stroke: "#0a0a0a" }
          : { color: "#111111", glow: "rgba(255, 255, 255, 0.36)", stroke: "#f2f2f2" };
    }

    boardEl.style.setProperty("--chess-self-color", selfTheme.color);
    boardEl.style.setProperty("--chess-self-shadow", selfTheme.glow);
    boardEl.style.setProperty("--chess-self-stroke", selfTheme.stroke);
    boardEl.style.setProperty("--chess-opponent-color", opponentTheme.color);
    boardEl.style.setProperty("--chess-opponent-shadow", opponentTheme.glow);
    boardEl.style.setProperty("--chess-opponent-stroke", opponentTheme.stroke);
  }

  function isLocalPlayersTurn() {
    if (!isRoomMode()) {
      if (!isCpuMode()) return true;
      return !isCpuTurn();
    }
    return !state.roomLocked && state.currentPlayer === state.roomPlayer;
  }

  function scheduleCpuMove() {
    clearCpuTimer();
    if (!isCpuTurn()) {
      state.cpuThinking = false;
      return;
    }

    const cpuSetting = CPU_LEVEL_SETTINGS[state.cpuLevel] ?? CPU_LEVEL_SETTINGS.normal;

    state.cpuThinking = true;
    updateMessageForTurn();
    renderBoard();

    state.cpuTimerId = setTimeout(() => {
      state.cpuTimerId = null;
      if (!isCpuTurn() || state.gameOver) {
        state.cpuThinking = false;
        updateMessageForTurn();
        renderBoard();
        return;
      }

      const moveWithLevel = chooseCpuMove(state.board, state.cpuPlayer, state.cpuLevel);
      state.cpuThinking = false;

      if (!moveWithLevel) {
        const winner = opposite(state.currentPlayer);
        if (isInCheck(state.board, state.currentPlayer)) {
          endGame(winner, "チェックメイト");
        } else {
          state.gameOver = true;
          overlayEl.style.opacity = "1";
          overlayEl.textContent = "引き分け";
          messageEl.textContent = "ステイルメイト";
          clearSelection();
          render();
        }
        return;
      }

      movePiece(moveWithLevel.fromRow, moveWithLevel.fromCol, moveWithLevel.toRow, moveWithLevel.toCol, { isCpu: true });
    }, cpuSetting.thinkDelayMinMs + Math.floor(Math.random() * cpuSetting.thinkDelayVarMs));
  }

  function clearSelection() {
    state.selected = null;
    state.validMoves = [];
  }

  function updateHeader() {
    turnTextEl.textContent = turnLabel(state.currentPlayer);
    if (!state.selected) {
      selectTextEl.textContent = "-";
      return;
    }

    const piece = state.board[state.selected.row][state.selected.col];
    selectTextEl.textContent = piece ? pieceLabel(piece) : "-";
  }

  function updateMessageForTurn() {
    if (state.gameOver) return;

    if (isRoomMode()) {
      if (state.roomLocked) {
        messageEl.textContent = state.roomLockMessage || t("対戦相手を待機中...", "상대를 기다리는 중...");
        return;
      }

      const base = state.currentPlayer === state.roomPlayer ? t("あなたの手番", "당신의 턴") : t("相手の手番", "상대의 턴");
      messageEl.textContent = isInCheck(state.board, state.currentPlayer) ? `${base}${t("（チェック）", " (체크)")}` : base;
      return;
    }

    if (isCpuMode()) {
      if (isCpuTurn() && state.cpuThinking) {
        messageEl.textContent = t("CPUが思考中...", "CPU가 생각 중...");
        return;
      }

      const base = state.currentPlayer === state.cpuPlayer ? t("CPUの手番", "CPU 턴") : t("あなたの手番", "당신의 턴");
      messageEl.textContent = isInCheck(state.board, state.currentPlayer) ? `${base}${t("（チェック）", " (체크)")}` : base;
      return;
    }

    const base = `${turnLabel(state.currentPlayer)}${t("の手番", " 턴")}`;
    messageEl.textContent = isInCheck(state.board, state.currentPlayer) ? `${base}${t("（チェック）", " (체크)")}` : base;
  }

  function endGame(winnerOwner, reason) {
    state.gameOver = true;
    const outcomeText = outcomeTextForWinner(winnerOwner);
    overlayEl.style.opacity = "1";
    overlayEl.textContent = outcomeText;
    messageEl.textContent = `${reason} / ${outcomeText}`;
    clearSelection();
    render();
  }

  function evaluateAfterMove(mover) {
    const enemy = opposite(mover);

    const enemyHasMove = hasAnyLegalMove(state.board, enemy);
    if (!enemyHasMove) {
      if (isInCheck(state.board, enemy)) {
        endGame(mover, "チェックメイト");
      } else {
        state.gameOver = true;
        overlayEl.style.opacity = "1";
        overlayEl.textContent = "引き分け";
        messageEl.textContent = "ステイルメイト";
        clearSelection();
        render();
      }
      return;
    }

    updateMessageForTurn();
  }

  function resetGame({ fromRemote = false } = {}) {
    fitBoardToGrid();
    clearCpuTimer();
    state.cpuThinking = false;

    if (!isRoomMode()) {
      state.playMode = modeSelect?.value === "local" ? "local" : "cpu";
      state.cpuPlayer = resolveCpuPlayerFromSelection();
      state.cpuLevel = CPU_LEVEL_SETTINGS[difficultySelect?.value] ? difficultySelect.value : "normal";
    }

    state.board = createInitialBoard();
    state.currentPlayer = WHITE;
    state.gameOver = false;
    clearSelection();

    if (isRoomMode() && state.roomLocked) {
      overlayEl.style.opacity = "1";
      overlayEl.textContent = state.roomLockMessage || "対戦相手を待機中...";
      messageEl.textContent = state.roomLockMessage || "対戦相手を待機中...";
    } else {
      overlayEl.style.opacity = "0";
      overlayEl.textContent = "";
      updateMessageForTurn();
    }

    render();

    if (!isRoomMode()) {
      scheduleCpuMove();
    }

    if (isRoomMode() && !fromRemote) {
      options.onRoomNewGame?.();
    }
  }

  function enterStandby() {
    clearCpuTimer();
    state.cpuThinking = false;
    fitBoardToGrid();
    state.board = createInitialBoard();
    state.currentPlayer = WHITE;
    state.gameOver = true;
    clearSelection();
    overlayEl.style.opacity = "1";
    overlayEl.textContent = "新規対局で開始";
    messageEl.textContent = t("開始ボタンで開始してください", "시작 버튼을 눌러 시작하세요");
    render();
  }

  function onRemakeButtonClick() {
    const confirmed = window.confirm("リメイクします。よろしいですか？");
    if (!confirmed) return;

    if (isRoomMode()) {
      resetGame();
      return;
    }

    enterStandby();
  }

  function movePiece(fromRow, fromCol, toRow, toCol, { isRemote = false, isCpu = false } = {}) {
    if (state.gameOver) return;

    const piece = state.board[fromRow]?.[fromCol];
    if (!piece) return;
    if (!isRemote && !isCpu && !isLocalPlayersTurn()) return;
    if (!isRemote && !isCpu && piece.owner !== state.currentPlayer) return;
    if (isCpu && piece.owner !== state.currentPlayer) return;

    const legal = getLegalMoves(state.board, fromRow, fromCol);
    if (!legal.some((m) => m.row === toRow && m.col === toCol)) return;

    if (!applyMoveOnBoard(state.board, fromRow, fromCol, toRow, toCol)) return;

    if (isRoomMode() && !isRemote) {
      options.onRoomMove?.({ fromRow, fromCol, toRow, toCol });
    }

    const mover = state.currentPlayer;
    state.currentPlayer = opposite(state.currentPlayer);
    clearSelection();

    evaluateAfterMove(mover);
    if (!state.gameOver) {
      render();
      if (!isRoomMode()) {
        scheduleCpuMove();
      }
    }
  }

  function onCellClick(row, col) {
    if (!isLocalPlayersTurn() || state.gameOver) return;

    const valid = state.validMoves.find((m) => m.row === row && m.col === col);
    if (valid && state.selected) {
      movePiece(state.selected.row, state.selected.col, row, col, { isRemote: false });
      return;
    }

    const piece = state.board[row][col];
    if (!piece || piece.owner !== state.currentPlayer) {
      clearSelection();
      render();
      return;
    }

    state.selected = { row, col };
    state.validMoves = getLegalMoves(state.board, row, col);
    render();
  }

  function renderBoard() {
    boardEl.innerHTML = "";
    const flip = shouldFlipBoard();
    const localOwner = getLocalPlayerOwner();

    for (let displayRow = 0; displayRow < SIZE; displayRow += 1) {
      for (let displayCol = 0; displayCol < SIZE; displayCol += 1) {
        const row = flip ? SIZE - 1 - displayRow : displayRow;
        const col = flip ? SIZE - 1 - displayCol : displayCol;
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = `chess-cell ${(row + col) % 2 === 0 ? "light" : "dark"}`;
        cell.disabled = state.gameOver || !isLocalPlayersTurn() || state.cpuThinking;

        if (state.selected && state.selected.row === row && state.selected.col === col) {
          cell.classList.add("selected");
        }

        if (state.validMoves.some((m) => m.row === row && m.col === col)) {
          cell.classList.add("valid");
        }

        const piece = state.board[row][col];
        if (piece) {
          const span = document.createElement("span");
          span.className = `chess-piece ${piece.owner} ${piece.owner === localOwner ? "self" : "opponent"}`;
          span.textContent = pieceGlyph(piece);
          cell.appendChild(span);
        }

        cell.addEventListener("click", () => onCellClick(row, col));
        boardEl.appendChild(cell);
      }
    }
  }

  function render() {
    applyMyPieceColorTheme();
    if (modeSelect) {
      modeSelect.disabled = isRoomMode();
    }
    if (cpuSideSelect) {
      cpuSideSelect.disabled = isRoomMode();
    }
    if (difficultySelect) {
      difficultySelect.disabled = isRoomMode() || !isCpuMode();
    }
    updateHeader();
    renderBoard();
  }

  startBtn?.addEventListener("click", () => resetGame());
  remakeBtn?.addEventListener("click", onRemakeButtonClick);
  modeSelect?.addEventListener("change", () => {
    if (isRoomMode()) return;
    state.playMode = modeSelect.value === "local" ? "local" : "cpu";
    updateMessageForTurn();
    render();
    scheduleCpuMove();
  });
  cpuSideSelect?.addEventListener("change", () => {
    if (isRoomMode()) return;
    state.cpuPlayer = resolveCpuPlayerFromSelection();
    updateMessageForTurn();
    render();
    scheduleCpuMove();
  });
  difficultySelect?.addEventListener("change", () => {
    if (isRoomMode()) return;
    state.cpuLevel = CPU_LEVEL_SETTINGS[difficultySelect.value] ? difficultySelect.value : "normal";
    updateMessageForTurn();
    render();
    scheduleCpuMove();
  });
  myPieceColorSelect?.addEventListener("change", () => {
    state.myPieceColor = normalizeMyPieceColor(myPieceColorSelect.value);
    if (isRoomMode()) {
      state.roomPieceColorByOwner[state.roomPlayer] = state.myPieceColor;
      options.onRoomModeChange?.({
        kind: "piece-color",
        owner: state.roomPlayer,
        color: state.myPieceColor,
      });
    }
    render();
  });
  menuBtn?.addEventListener("click", () => {
    const confirmed = window.confirm("ゲーム一覧に戻りますか？");
    if (!confirmed) return;
    clearCpuTimer();
    state.cpuThinking = false;
    if (isRoomMode()) {
      options.onBackToLobby?.();
      return;
    }
    options.onBackToMenu?.();
  });
  window.addEventListener("resize", fitBoardToGrid);

  if (screenEl && screenEl.classList.contains("hidden")) {
    fitBoardToGrid();
  }
  enterStandby();

  return {
    startNewGame: (opts) => resetGame(opts),
    enterStandby,
    stop: () => {
      clearCpuTimer();
      window.removeEventListener("resize", fitBoardToGrid);
    },
    configureRoomMode: ({ roomCode, roomRole, roomPlayer }) => {
      clearCpuTimer();
      state.cpuThinking = false;
      state.gameMode = "room";
      state.roomCode = roomCode;
      state.roomRole = roomRole;
      state.roomPlayer = roomPlayer === 2 ? BLACK : WHITE;
      state.roomPieceColorByOwner[state.roomPlayer] = state.myPieceColor;
      options.onRoomModeChange?.({
        kind: "piece-color",
        owner: state.roomPlayer,
        color: state.myPieceColor,
      });
      options.onRoomStatusChange?.({ roomCode, roomRole });
    },
    configureStandardMode: () => {
      clearCpuTimer();
      state.cpuThinking = false;
      state.gameMode = "local";
      state.roomCode = null;
      state.roomRole = null;
      state.roomPlayer = WHITE;
      state.playMode = modeSelect?.value === "local" ? "local" : "cpu";
      state.cpuPlayer = resolveCpuPlayerFromSelection();
      state.cpuLevel = CPU_LEVEL_SETTINGS[difficultySelect?.value] ? difficultySelect.value : "normal";
      state.roomPieceColorByOwner = {
        [WHITE]: state.myPieceColor,
        [BLACK]: "amber",
      };
      state.roomLocked = false;
      state.roomLockMessage = "";
      options.onRoomStatusChange?.({ roomCode: null, roomRole: null });
    },
    setRoomLock: ({ locked, message }) => {
      fitBoardToGrid();
      state.roomLocked = Boolean(locked);
      state.roomLockMessage = message ?? "";

      if (state.roomLocked) {
        clearCpuTimer();
        state.cpuThinking = false;
        overlayEl.style.opacity = "1";
        overlayEl.textContent = state.roomLockMessage || "対戦相手を待機中...";
        messageEl.textContent = state.roomLockMessage || "対戦相手を待機中...";
      } else if (!state.gameOver) {
        overlayEl.style.opacity = "0";
        overlayEl.textContent = "";
        updateMessageForTurn();
      }

      render();
    },
    applyRemoteMove: (payload) => {
      if (!payload) return;
      movePiece(payload.fromRow, payload.fromCol, payload.toRow, payload.toCol, { isRemote: true });
    },
    applyRoomMode: (payload) => {
      if (!payload) return;
      if (payload.kind !== "piece-color") return;

      const owner = payload.owner === BLACK ? BLACK : payload.owner === WHITE ? WHITE : null;
      if (!owner) return;

      state.roomPieceColorByOwner[owner] = normalizeMyPieceColor(payload.color);
      render();
    },
    getSnapshot: () => ({
      board: cloneBoard(state.board),
      currentPlayer: state.currentPlayer,
      gameOver: state.gameOver,
      roomPieceColorByOwner: { ...state.roomPieceColorByOwner },
    }),
    applySnapshot: ({ board, currentPlayer, gameOver, roomPieceColorByOwner }) => {
      fitBoardToGrid();
      if (!board || !Array.isArray(board)) return;
      state.board = cloneBoard(board);
      state.currentPlayer = currentPlayer;
      state.gameOver = Boolean(gameOver);
      if (roomPieceColorByOwner && typeof roomPieceColorByOwner === "object") {
        if (typeof roomPieceColorByOwner[WHITE] !== "undefined") {
          state.roomPieceColorByOwner[WHITE] = normalizeMyPieceColor(roomPieceColorByOwner[WHITE]);
        }
        if (typeof roomPieceColorByOwner[BLACK] !== "undefined") {
          state.roomPieceColorByOwner[BLACK] = normalizeMyPieceColor(roomPieceColorByOwner[BLACK]);
        }
      }
      clearSelection();
      updateMessageForTurn();
      render();
      if (!isRoomMode()) {
        scheduleCpuMove();
      }
    },
  };
}
