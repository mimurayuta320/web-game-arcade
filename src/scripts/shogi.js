import { bindBackToMenuButton } from "./uiButtonHelpers.js";

const SIZE = 9;
const BLACK = "black";
const WHITE = "white";
const SHOGI_CPU_THINK_MS = 260;
const SHOGI_CPU_SETTINGS = {
  easy: {
    thinkMs: 180,
    randomRate: 0.55,
    lookaheadDepth: 1,
    candidateLimit: 14,
    enemyCandidateLimit: 12,
    selfReplyCandidateLimit: 10,
  },
  normal: {
    thinkMs: 260,
    randomRate: 0.18,
    lookaheadDepth: 1,
    candidateLimit: 22,
    enemyCandidateLimit: 16,
    selfReplyCandidateLimit: 12,
  },
  hard: {
    thinkMs: 420,
    randomRate: 0,
    lookaheadDepth: 2,
    candidateLimit: 32,
    enemyCandidateLimit: 22,
    selfReplyCandidateLimit: 14,
  },
  pro: {
    thinkMs: 700,
    randomRate: 0,
    lookaheadDepth: 3,
    candidateLimit: 42,
    enemyCandidateLimit: 28,
    selfReplyCandidateLimit: 20,
  },
};

const HAND_TYPES = ["R", "B", "G", "S", "N", "L", "P"];

const PIECE_LABEL = {
  K: "王",
  R: "飛",
  B: "角",
  G: "金",
  S: "銀",
  N: "桂",
  L: "香",
  P: "歩",
};

const PROMOTED_PIECE_LABEL = {
  R: "竜",
  B: "馬",
  S: "成銀",
  N: "成桂",
  L: "成香",
  P: "と",
};

const PIECE_VALUE = {
  K: 100000,
  R: 1000,
  B: 900,
  G: 650,
  S: 560,
  N: 420,
  L: 360,
  P: 110,
};

function cloneBoard(board) {
  return board.map((row) => row.map((piece) => (piece ? { ...piece } : null)));
}

function createEmptyHands() {
  const template = { R: 0, B: 0, G: 0, S: 0, N: 0, L: 0, P: 0 };
  return { [BLACK]: { ...template }, [WHITE]: { ...template } };
}

function cloneHands(hands) {
  return { [BLACK]: { ...hands[BLACK] }, [WHITE]: { ...hands[WHITE] } };
}

function inside(row, col) {
  return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
}

function opposite(owner) {
  return owner === BLACK ? WHITE : BLACK;
}

function forward(owner) {
  return owner === BLACK ? -1 : 1;
}

function inPromotionZone(owner, row) {
  return owner === BLACK ? row <= 2 : row >= 6;
}

function canPromoteType(type) {
  return ["R", "B", "S", "N", "L", "P"].includes(type);
}

function mustPromote(owner, type, toRow) {
  if (type === "P" || type === "L") {
    return owner === BLACK ? toRow === 0 : toRow === SIZE - 1;
  }
  if (type === "N") {
    return owner === BLACK ? toRow <= 1 : toRow >= SIZE - 2;
  }
  return false;
}

function shouldOfferPromotion(piece, fromRow, toRow) {
  if (piece.promoted || !canPromoteType(piece.type)) return false;
  return inPromotionZone(piece.owner, fromRow) || inPromotionZone(piece.owner, toRow);
}

function makeInitialBoard() {
  const board = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => null));
  const back = ["L", "N", "S", "G", "K", "G", "S", "N", "L"];

  for (let i = 0; i < SIZE; i += 1) {
    board[0][i] = { owner: WHITE, type: back[i], promoted: false };
    board[8][i] = { owner: BLACK, type: back[i], promoted: false };
    board[2][i] = { owner: WHITE, type: "P", promoted: false };
    board[6][i] = { owner: BLACK, type: "P", promoted: false };
  }

  board[1][1] = { owner: WHITE, type: "R", promoted: false };
  board[1][7] = { owner: WHITE, type: "B", promoted: false };
  board[7][1] = { owner: BLACK, type: "B", promoted: false };
  board[7][7] = { owner: BLACK, type: "R", promoted: false };

  return board;
}

function getGoldLikeMoves(owner, row, col) {
  const d = forward(owner);
  return [
    [row + d, col - 1],
    [row + d, col],
    [row + d, col + 1],
    [row, col - 1],
    [row, col + 1],
    [row - d, col],
  ];
}

function getStepMoves(piece, row, col) {
  const d = forward(piece.owner);

  if (piece.type === "K") {
    return [
      [row - 1, col - 1],
      [row - 1, col],
      [row - 1, col + 1],
      [row, col - 1],
      [row, col + 1],
      [row + 1, col - 1],
      [row + 1, col],
      [row + 1, col + 1],
    ];
  }

  if (piece.promoted && ["S", "N", "L", "P"].includes(piece.type)) {
    return getGoldLikeMoves(piece.owner, row, col);
  }

  if (piece.type === "G") return getGoldLikeMoves(piece.owner, row, col);

  if (piece.type === "S") {
    return [
      [row + d, col - 1],
      [row + d, col],
      [row + d, col + 1],
      [row - d, col - 1],
      [row - d, col + 1],
    ];
  }

  if (piece.type === "N") {
    return [
      [row + d * 2, col - 1],
      [row + d * 2, col + 1],
    ];
  }

  if (piece.type === "P") return [[row + d, col]];

  if (piece.promoted && piece.type === "R") {
    return [
      [row - 1, col - 1],
      [row - 1, col + 1],
      [row + 1, col - 1],
      [row + 1, col + 1],
    ];
  }

  if (piece.promoted && piece.type === "B") {
    return [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ];
  }

  return [];
}

function getSlideDirs(piece) {
  if (piece.type === "R") return [[-1, 0], [1, 0], [0, -1], [0, 1]];
  if (piece.type === "B") return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  if (piece.type === "L") return piece.owner === BLACK ? [[-1, 0]] : [[1, 0]];
  return [];
}

function getPseudoMoves(board, row, col) {
  const piece = board[row][col];
  if (!piece) return [];

  const moves = [];

  for (const [r, c] of getStepMoves(piece, row, col)) {
    if (!inside(r, c)) continue;
    const target = board[r][c];
    if (!target || target.owner !== piece.owner) {
      moves.push({ row: r, col: c });
    }
  }

  for (const [dr, dc] of getSlideDirs(piece)) {
    let r = row + dr;
    let c = col + dc;
    while (inside(r, c)) {
      const target = board[r][c];
      if (!target) {
        moves.push({ row: r, col: c });
      } else {
        if (target.owner !== piece.owner) moves.push({ row: r, col: c });
        break;
      }
      r += dr;
      c += dc;
    }
  }

  return moves;
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

function isInCheck(board, owner) {
  const kingPos = findKing(board, owner);
  if (!kingPos) return true;

  const enemy = opposite(owner);
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.owner !== enemy) continue;
      if (getPseudoMoves(board, row, col).some((m) => m.row === kingPos.row && m.col === kingPos.col)) {
        return true;
      }
    }
  }
  return false;
}

function applyMoveOn(board, hands, fromRow, fromCol, toRow, toCol, promote) {
  const piece = board[fromRow][fromCol];
  if (!piece) return false;

  const target = board[toRow][toCol];
  if (target) {
    if (target.type === "K") {
      board[toRow][toCol] = { ...piece, promoted: promote ? true : piece.promoted };
      board[fromRow][fromCol] = null;
      return "captured-king";
    }
    hands[piece.owner][target.type] += 1;
  }

  board[toRow][toCol] = { ...piece, promoted: promote ? true : piece.promoted };
  board[fromRow][fromCol] = null;
  return true;
}

function applyDropOn(board, hands, owner, type, toRow, toCol) {
  if (hands[owner][type] <= 0 || board[toRow][toCol]) return false;
  hands[owner][type] -= 1;
  board[toRow][toCol] = { owner, type, promoted: false };
  return true;
}

function hasUnpromotedPawnOnFile(board, owner, col) {
  for (let row = 0; row < SIZE; row += 1) {
    const piece = board[row][col];
    if (piece && piece.owner === owner && piece.type === "P" && !piece.promoted) return true;
  }
  return false;
}

function canDropTo(board, owner, type, row, col) {
  if (!inside(row, col) || board[row][col]) return false;

  if (type === "P") {
    if ((owner === BLACK && row === 0) || (owner === WHITE && row === SIZE - 1)) return false;
    if (hasUnpromotedPawnOnFile(board, owner, col)) return false;
  }
  if (type === "L") {
    if ((owner === BLACK && row === 0) || (owner === WHITE && row === SIZE - 1)) return false;
  }
  if (type === "N") {
    if ((owner === BLACK && row <= 1) || (owner === WHITE && row >= SIZE - 2)) return false;
  }
  return true;
}

function getDropMoves(board, hands, owner, type) {
  if (hands[owner][type] <= 0) return [];
  const moves = [];

  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (!canDropTo(board, owner, type, row, col)) continue;
      const simBoard = cloneBoard(board);
      const simHands = cloneHands(hands);
      applyDropOn(simBoard, simHands, owner, type, row, col);
      if (!isInCheck(simBoard, owner)) moves.push({ row, col, type });
    }
  }

  return moves;
}

function getLegalMoveOptions(board, hands, owner, fromRow, fromCol, toRow, toCol) {
  const piece = board[fromRow][fromCol];
  if (!piece || piece.owner !== owner) return [];

  if (!getPseudoMoves(board, fromRow, fromCol).some((m) => m.row === toRow && m.col === toCol)) {
    return [];
  }

  const forcePromote = mustPromote(owner, piece.type, toRow);
  const canPromote = shouldOfferPromotion(piece, fromRow, toRow);
  const candidates = forcePromote ? [true] : canPromote ? [false, true] : [false];

  const options = [];
  for (const promote of candidates) {
    const simBoard = cloneBoard(board);
    const simHands = cloneHands(hands);
    applyMoveOn(simBoard, simHands, fromRow, fromCol, toRow, toCol, promote);
    if (!isInCheck(simBoard, owner)) options.push(promote);
  }

  return options;
}

function hasAnyLegalAction(board, hands, owner) {
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.owner !== owner) continue;
      for (const move of getPseudoMoves(board, row, col)) {
        if (getLegalMoveOptions(board, hands, owner, row, col, move.row, move.col).length > 0) {
          return true;
        }
      }
    }
  }

  for (const type of HAND_TYPES) {
    if (getDropMoves(board, hands, owner, type).length > 0) return true;
  }

  return false;
}

function cloneAction(action) {
  return { ...action };
}

function actionOrderScore(action) {
  let score = 0;
  if (action.captureType) score += (PIECE_VALUE[action.captureType] ?? 0) * 2;
  if (action.kind === "move" && action.promote) score += 120;
  return score;
}

function applyActionSim(board, hands, owner, action) {
  if (action.kind === "drop") {
    return applyDropOn(board, hands, owner, action.type, action.toRow, action.toCol);
  }
  return applyMoveOn(board, hands, action.fromRow, action.fromCol, action.toRow, action.toCol, Boolean(action.promote));
}

function pieceDisplayLabel(piece) {
  if (piece.promoted && PROMOTED_PIECE_LABEL[piece.type]) {
    return PROMOTED_PIECE_LABEL[piece.type];
  }
  return PIECE_LABEL[piece.type] ?? piece.type;
}

function materialScore(board, hands, owner) {
  const enemy = opposite(owner);
  let myScore = 0;
  let enemyScore = 0;

  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const piece = board[row][col];
      if (!piece) continue;
      const base = PIECE_VALUE[piece.type] ?? 0;
      const promotedBonus = piece.promoted ? Math.max(40, Math.floor(base * 0.2)) : 0;
      if (piece.owner === owner) myScore += base + promotedBonus;
      else enemyScore += base + promotedBonus;
    }
  }

  HAND_TYPES.forEach((type) => {
    const handValue = PIECE_VALUE[type] ?? 0;
    myScore += (hands[owner][type] ?? 0) * handValue;
    enemyScore += (hands[enemy][type] ?? 0) * handValue;
  });

  return myScore - enemyScore;
}

function getAllLegalActions(board, hands, owner) {
  const actions = [];

  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.owner !== owner) continue;

      for (const move of getPseudoMoves(board, row, col)) {
        const legalOptions = getLegalMoveOptions(board, hands, owner, row, col, move.row, move.col);
        if (legalOptions.length === 0) continue;

        legalOptions.forEach((promote) => {
          const target = board[move.row][move.col];
          actions.push({
            kind: "move",
            fromRow: row,
            fromCol: col,
            toRow: move.row,
            toCol: move.col,
            promote,
            captureType: target?.type ?? null,
          });
        });
      }
    }
  }

  HAND_TYPES.forEach((type) => {
    getDropMoves(board, hands, owner, type).forEach((drop) => {
      actions.push({ kind: "drop", type, toRow: drop.row, toCol: drop.col, captureType: null });
    });
  });

  return actions;
}

function evaluateAction(board, hands, owner, action) {
  const enemy = opposite(owner);
  const simBoard = cloneBoard(board);
  const simHands = cloneHands(hands);

  applyActionSim(simBoard, simHands, owner, action);

  if (!findKing(simBoard, enemy)) {
    return Number.POSITIVE_INFINITY;
  }

  let score = materialScore(simBoard, simHands, owner) - materialScore(simBoard, simHands, enemy) * 0.1;

  if (action.captureType) {
    score += (PIECE_VALUE[action.captureType] ?? 0) * 1.25;
  }
  if (action.kind === "move" && action.promote) {
    score += 85;
  }

  if (isInCheck(simBoard, enemy)) score += 280;
  if (isInCheck(simBoard, owner)) score -= 220;

  const myMobility = getAllLegalActions(simBoard, simHands, owner).length;
  const enemyMobility = getAllLegalActions(simBoard, simHands, enemy).length;
  score += (myMobility - enemyMobility) * 4;

  return score;
}

export function initShogi(options = {}) {
  const boardEl = document.getElementById("shogiBoard");
  const turnTextEl = document.getElementById("shogiTurnText");
  const selectTextEl = document.getElementById("shogiSelectText");
  const messageEl = document.getElementById("shogiMessage");
  const overlay = document.getElementById("shogiOverlay");
  const startBtn = document.getElementById("shogiStartBtn");
  const remakeBtn = document.getElementById("shogiRemakeBtn");
  const menuBtn = document.getElementById("shogiMenuBtn");
  const modeSelect = document.getElementById("shogiModeSelect");
  const difficultySelect = document.getElementById("shogiDifficultySelect");
  const blackHandEl = document.getElementById("shogiBlackHand");
  const whiteHandEl = document.getElementById("shogiWhiteHand");

  const state = {
    board: makeInitialBoard(),
    hands: createEmptyHands(),
    currentPlayer: BLACK,
    selectedPiece: null,
    selectedHandType: null,
    validMoves: [],
    gameOver: false,
    gameMode: "local",
    cpuLevel: SHOGI_CPU_SETTINGS[difficultySelect?.value] ? difficultySelect.value : "normal",
    cpuPlayer: WHITE,
    cpuTimerId: null,
    roomCode: null,
    roomRole: null,
    roomPlayer: BLACK,
    roomLocked: false,
    roomLockMessage: "",
  };

  function fitBoardToGrid() {
    const wrap = boardEl?.parentElement;
    if (!wrap) return;

    const GAP = 2;
    const PADDING = 2;
    const BORDER = 1;
    const CHROME = GAP * (SIZE - 1) + PADDING * 2 + BORDER * 2;

    const maxBoardByWrap = Math.max(220, wrap.clientWidth - 6);
    const maxBoardByViewport = Math.max(220, Math.floor(window.innerHeight * 0.68));
    const maxBoard = Math.min(maxBoardByWrap, maxBoardByViewport, 780);

    const cellByBoard = Math.floor((maxBoard - CHROME) / SIZE);
    const cellPx = Math.max(22, Math.min(84, cellByBoard));
    const boardPx = cellPx * SIZE + CHROME;

    boardEl.style.setProperty("--shogi-cell-size", `${cellPx}px`);
    boardEl.style.width = `${boardPx}px`;
    boardEl.style.height = `${boardPx}px`;
  }

  function isRoomMode() {
    return state.gameMode === "room";
  }

  function isCpuMode() {
    return state.gameMode === "cpu";
  }

  function getCpuSetting() {
    return SHOGI_CPU_SETTINGS[state.cpuLevel] ?? SHOGI_CPU_SETTINGS.normal;
  }

  function isCpuTurn() {
    return isCpuMode() && !state.gameOver && state.currentPlayer === state.cpuPlayer;
  }

  function clearCpuTimer() {
    clearTimeout(state.cpuTimerId);
    state.cpuTimerId = null;
  }

  function isLocalPlayersTurn() {
    if (isRoomMode()) return !state.roomLocked && state.currentPlayer === state.roomPlayer;
    if (isCpuMode()) return state.currentPlayer !== state.cpuPlayer;
    return true;
  }

  function turnLabel(owner) {
    return owner === BLACK ? "先手" : "後手";
  }

  function clearSelection() {
    state.selectedPiece = null;
    state.selectedHandType = null;
    state.validMoves = [];
  }

  function updateMessageForTurn() {
    if (isRoomMode()) {
      if (state.roomLocked) {
        messageEl.textContent = state.roomLockMessage || "対戦相手を待機中...";
        return;
      }
      const base = state.currentPlayer === state.roomPlayer ? "あなたの手番" : "相手の手番";
      messageEl.textContent = isInCheck(state.board, state.currentPlayer) ? `${base}（王手）` : base;
      return;
    }

    if (isCpuTurn()) {
      const levelLabel =
        state.cpuLevel === "easy"
          ? "かんたん"
          : state.cpuLevel === "hard"
            ? "つよい"
            : state.cpuLevel === "pro"
              ? "プロ"
              : "ふつう";
      messageEl.textContent = `CPU（${levelLabel}）が考えています...`;
      return;
    }

    const base = `${turnLabel(state.currentPlayer)}の手番`;
    messageEl.textContent = isInCheck(state.board, state.currentPlayer) ? `${base}（王手）` : base;
  }

  function chooseCpuAction() {
    const setting = getCpuSetting();
    const actions = getAllLegalActions(state.board, state.hands, state.currentPlayer);
    if (actions.length === 0) return null;

    const ordered = [...actions]
      .sort((a, b) => actionOrderScore(b) - actionOrderScore(a))
      .slice(0, setting.candidateLimit ?? actions.length);

    if (Math.random() < (setting.randomRate ?? 0)) {
      return cloneAction(ordered[Math.floor(Math.random() * ordered.length)]);
    }

    let best = ordered[0];
    let bestScore = -Infinity;

    const deadline = performance.now() + Math.max(80, setting.thinkMs ?? SHOGI_CPU_THINK_MS);

    for (const action of ordered) {
      if (performance.now() >= deadline) break;
      const score = evaluateAction(state.board, state.hands, state.currentPlayer, action);

      let finalScore = score;
      if ((setting.lookaheadDepth ?? 1) >= 2) {
        const simBoard = cloneBoard(state.board);
        const simHands = cloneHands(state.hands);
        const ok = applyActionSim(simBoard, simHands, state.currentPlayer, action);
        if (ok) {
          const enemy = opposite(state.currentPlayer);
          const enemyActions = getAllLegalActions(simBoard, simHands, enemy)
            .sort((a, b) => actionOrderScore(b) - actionOrderScore(a))
            .slice(0, setting.enemyCandidateLimit ?? 20);

          let enemyBest = -Infinity;
          let enemyBestAction = null;
          for (const enemyAction of enemyActions) {
            if (performance.now() >= deadline) break;
            const enemyScore = evaluateAction(simBoard, simHands, enemy, enemyAction);
            if (enemyScore > enemyBest) {
              enemyBest = enemyScore;
              enemyBestAction = enemyAction;
            }
          }

          if (enemyBest > -Infinity) {
            finalScore -= enemyBest * 0.72;

            if ((setting.lookaheadDepth ?? 1) >= 3 && enemyBestAction) {
              const simBoard2 = cloneBoard(simBoard);
              const simHands2 = cloneHands(simHands);
              const enemyApplied = applyActionSim(simBoard2, simHands2, enemy, enemyBestAction);
              if (enemyApplied && findKing(simBoard2, state.currentPlayer)) {
                const replyActions = getAllLegalActions(simBoard2, simHands2, state.currentPlayer)
                  .sort((a, b) => actionOrderScore(b) - actionOrderScore(a))
                  .slice(0, setting.selfReplyCandidateLimit ?? 16);

                let selfBestReply = -Infinity;
                for (const replyAction of replyActions) {
                  if (performance.now() >= deadline) break;
                  const replyScore = evaluateAction(simBoard2, simHands2, state.currentPlayer, replyAction);
                  if (replyScore > selfBestReply) selfBestReply = replyScore;
                }

                if (selfBestReply > -Infinity) {
                  finalScore += selfBestReply * 0.46;
                }
              }
            }
          }
        }
      }

      if (finalScore > bestScore) {
        bestScore = finalScore;
        best = action;
      }
    }

    return cloneAction(best);
  }

  function scheduleCpuMove() {
    clearCpuTimer();
    if (!isCpuTurn()) return;

    const setting = getCpuSetting();
    const thinkMs = Math.max(90, setting.thinkMs ?? SHOGI_CPU_THINK_MS);

    state.cpuTimerId = setTimeout(() => {
      if (!isCpuTurn()) return;

      const action = chooseCpuAction();
      if (!action) {
        const mover = state.currentPlayer;
        state.currentPlayer = opposite(state.currentPlayer);
        checkGameStateAfterTurn(mover);
        if (!state.gameOver) updateMessageForTurn();
        render();
        scheduleCpuMove();
        return;
      }

      if (action.kind === "drop") {
        applyDrop(action.type, action.toRow, action.toCol, { isRemote: false, force: true });
      } else {
        applyMove(action.fromRow, action.fromCol, action.toRow, action.toCol, Boolean(action.promote), {
          isRemote: false,
          force: true,
        });
      }
    }, thinkMs);
  }

  function updateHeader() {
    turnTextEl.textContent = turnLabel(state.currentPlayer);

    if (state.selectedHandType) {
      selectTextEl.textContent = `打: ${PIECE_LABEL[state.selectedHandType]}`;
      return;
    }

    if (!state.selectedPiece) {
      selectTextEl.textContent = "-";
      return;
    }

    const piece = state.board[state.selectedPiece.row][state.selectedPiece.col];
    selectTextEl.textContent = piece ? `${turnLabel(piece.owner)} ${pieceDisplayLabel(piece)}` : "-";
  }

  function endGame(winnerOwner, reason) {
    state.gameOver = true;
    overlay.style.opacity = "1";
    overlay.textContent = `${turnLabel(winnerOwner)}の勝ち`;
    messageEl.textContent = reason;
    clearSelection();
    render();
  }

  function checkGameStateAfterTurn(prevOwner) {
    const enemy = opposite(prevOwner);

    if (!findKing(state.board, enemy)) {
      endGame(prevOwner, "王を取りました");
      return;
    }

    if (!hasAnyLegalAction(state.board, state.hands, enemy)) {
      if (isInCheck(state.board, enemy)) {
        endGame(prevOwner, "詰み");
      } else {
        endGame(prevOwner, "合法手なし");
      }
    }
  }

  function resetGame({ fromRemote = false } = {}) {
    clearCpuTimer();
    fitBoardToGrid();
    state.board = makeInitialBoard();
    state.hands = createEmptyHands();
    state.currentPlayer = BLACK;
    state.gameOver = false;
    clearSelection();

    if (isRoomMode() && state.roomLocked) {
      overlay.style.opacity = "1";
      overlay.textContent = state.roomLockMessage || "対戦相手を待機中...";
      messageEl.textContent = state.roomLockMessage || "対戦相手を待機中...";
    } else {
      overlay.style.opacity = "0";
      overlay.textContent = "";
      updateMessageForTurn();
    }

    render();
    scheduleCpuMove();

    if (isRoomMode() && !fromRemote) {
      options.onRoomNewGame?.();
    }
  }

  function enterStandby() {
    clearCpuTimer();
    fitBoardToGrid();
    state.board = makeInitialBoard();
    state.hands = createEmptyHands();
    state.currentPlayer = BLACK;
    state.gameOver = true;
    clearSelection();
    overlay.style.opacity = "1";
    overlay.textContent = "新規対局で開始";
    messageEl.textContent = "STARTボタンで開始してください";
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

  function applyMove(fromRow, fromCol, toRow, toCol, promote, { isRemote = false, force = false } = {}) {
    if (state.gameOver) return;

    const piece = state.board[fromRow]?.[fromCol];
    if (!piece) return;
    if (!isRemote && !force && !isLocalPlayersTurn()) return;
    if (!isRemote && piece.owner !== state.currentPlayer) return;

    const legalOptions = getLegalMoveOptions(state.board, state.hands, state.currentPlayer, fromRow, fromCol, toRow, toCol);
    if (legalOptions.length === 0) return;

    let usePromote = Boolean(promote);
    if (!isRemote && !force) {
      if (legalOptions.length === 2) {
        usePromote = window.confirm("成りますか?");
      } else {
        usePromote = legalOptions[0];
      }
    } else if (!legalOptions.includes(usePromote)) {
      usePromote = legalOptions[0];
    }

    const ok = applyMoveOn(state.board, state.hands, fromRow, fromCol, toRow, toCol, usePromote);
    if (!ok) return;

    if (isRoomMode() && !isRemote) {
      options.onRoomMove?.({ kind: "move", fromRow, fromCol, toRow, toCol, promote: usePromote });
    }

    const mover = state.currentPlayer;
    state.currentPlayer = opposite(state.currentPlayer);
    clearSelection();

    checkGameStateAfterTurn(mover);
    if (!state.gameOver) updateMessageForTurn();
    render();
    scheduleCpuMove();
  }

  function applyDrop(type, toRow, toCol, { isRemote = false, force = false } = {}) {
    if (state.gameOver) return;
    if (!isRemote && !force && !isLocalPlayersTurn()) return;

    if (!canDropTo(state.board, state.currentPlayer, type, toRow, toCol)) return;
    if (!getDropMoves(state.board, state.hands, state.currentPlayer, type).some((d) => d.row === toRow && d.col === toCol)) {
      return;
    }

    const ok = applyDropOn(state.board, state.hands, state.currentPlayer, type, toRow, toCol);
    if (!ok) return;

    if (isRoomMode() && !isRemote) {
      options.onRoomMove?.({ kind: "drop", type, toRow, toCol });
    }

    const mover = state.currentPlayer;
    state.currentPlayer = opposite(state.currentPlayer);
    clearSelection();

    checkGameStateAfterTurn(mover);
    if (!state.gameOver) updateMessageForTurn();
    render();
    scheduleCpuMove();
  }

  function selectPiece(row, col) {
    const piece = state.board[row][col];
    if (!piece || piece.owner !== state.currentPlayer) {
      clearSelection();
      render();
      return;
    }

    state.selectedPiece = { row, col };
    state.selectedHandType = null;
    state.validMoves = getPseudoMoves(state.board, row, col)
      .filter((m) => getLegalMoveOptions(state.board, state.hands, state.currentPlayer, row, col, m.row, m.col).length > 0)
      .map((m) => ({ ...m, kind: "move" }));
    render();
  }

  function selectHand(type) {
    if (!isLocalPlayersTurn() || state.gameOver) return;
    if (state.hands[state.currentPlayer][type] <= 0) return;

    state.selectedPiece = null;
    state.selectedHandType = type;
    state.validMoves = getDropMoves(state.board, state.hands, state.currentPlayer, type).map((m) => ({
      row: m.row,
      col: m.col,
      kind: "drop",
      type,
    }));
    render();
  }

  function onCellClick(row, col) {
    if (!isLocalPlayersTurn() || state.gameOver) return;

    const valid = state.validMoves.find((m) => m.row === row && m.col === col);
    if (valid && state.selectedPiece && valid.kind === "move") {
      applyMove(state.selectedPiece.row, state.selectedPiece.col, row, col, false, { isRemote: false });
      return;
    }

    if (valid && state.selectedHandType && valid.kind === "drop") {
      applyDrop(state.selectedHandType, row, col, { isRemote: false });
      return;
    }

    const piece = state.board[row][col];
    if (piece && piece.owner === state.currentPlayer) {
      selectPiece(row, col);
      return;
    }

    clearSelection();
    render();
  }

  function renderHands() {
    blackHandEl.innerHTML = "";
    whiteHandEl.innerHTML = "";

    const renderOne = (owner, mount) => {
      HAND_TYPES.forEach((type) => {
        const count = state.hands[owner][type];
        if (count <= 0) return;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "shogi-hand-btn";
        if (state.selectedHandType === type && state.currentPlayer === owner && isLocalPlayersTurn()) {
          btn.classList.add("selected");
        }

        btn.disabled = state.gameOver || owner !== state.currentPlayer || !isLocalPlayersTurn();
        btn.textContent = `${PIECE_LABEL[type]} x${count}`;

        btn.addEventListener("click", () => {
          if (state.selectedHandType === type) {
            clearSelection();
            render();
            return;
          }
          selectHand(type);
        });

        mount.appendChild(btn);
      });
    };

    renderOne(WHITE, whiteHandEl);
    renderOne(BLACK, blackHandEl);
  }

  function renderBoard() {
    boardEl.innerHTML = "";

    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "shogi-cell";
        cell.disabled = state.gameOver || !isLocalPlayersTurn();

        if (state.selectedPiece && state.selectedPiece.row === row && state.selectedPiece.col === col) {
          cell.classList.add("selected");
        }
        if (state.validMoves.some((m) => m.row === row && m.col === col)) {
          cell.classList.add("valid");
        }

        const piece = state.board[row][col];
        if (piece) {
          const span = document.createElement("span");
          span.className = `shogi-piece ${piece.owner === WHITE ? "white" : "black"}`;
          span.textContent = pieceDisplayLabel(piece);
          cell.appendChild(span);
        }

        cell.addEventListener("click", () => onCellClick(row, col));
        boardEl.appendChild(cell);
      }
    }
  }

  function render() {
    updateHeader();
    renderHands();
    renderBoard();
  }

  startBtn?.addEventListener("click", () => resetGame());
  remakeBtn?.addEventListener("click", onRemakeButtonClick);
  bindBackToMenuButton(menuBtn, () => {
    clearCpuTimer();
    options.onBackToMenu?.();
  });

  modeSelect?.addEventListener("change", () => {
    if (isRoomMode()) return;
    state.gameMode = modeSelect.value === "cpu" ? "cpu" : "local";
    if (difficultySelect) {
      difficultySelect.disabled = state.gameMode !== "cpu";
    }
    enterStandby();
  });

  difficultySelect?.addEventListener("change", () => {
    state.cpuLevel = SHOGI_CPU_SETTINGS[difficultySelect.value] ? difficultySelect.value : "normal";
    if (isCpuTurn()) {
      updateMessageForTurn();
      scheduleCpuMove();
    }
  });
  window.addEventListener("resize", fitBoardToGrid);

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
      state.gameMode = "room";
      state.roomCode = roomCode;
      state.roomRole = roomRole;
      state.roomPlayer = roomPlayer;
      if (modeSelect) {
        modeSelect.disabled = true;
      }
      if (difficultySelect) {
        difficultySelect.disabled = true;
      }
      options.onRoomStatusChange?.({ roomCode, roomRole });
    },
    configureStandardMode: () => {
      clearCpuTimer();
      state.gameMode = "local";
      state.roomCode = null;
      state.roomRole = null;
      state.roomPlayer = BLACK;
      state.roomLocked = false;
      state.roomLockMessage = "";
      if (modeSelect) {
        modeSelect.disabled = false;
        modeSelect.value = state.gameMode;
      }
      if (difficultySelect) {
        difficultySelect.disabled = true;
      }
      options.onRoomStatusChange?.({ roomCode: null, roomRole: null });
    },
    setRoomLock: ({ locked, message }) => {
      fitBoardToGrid();
      state.roomLocked = Boolean(locked);
      state.roomLockMessage = message ?? "";

      if (state.roomLocked) {
        overlay.style.opacity = "1";
        overlay.textContent = state.roomLockMessage || "対戦相手を待機中...";
        messageEl.textContent = state.roomLockMessage || "対戦相手を待機中...";
      } else if (!state.gameOver) {
        overlay.style.opacity = "0";
        overlay.textContent = "";
        updateMessageForTurn();
        scheduleCpuMove();
      }

      render();
    },
    applyRemoteMove: (payload) => {
      if (!payload) return;

      if (payload.kind === "drop") {
        applyDrop(payload.type, payload.toRow, payload.toCol, { isRemote: true });
        return;
      }

      if (payload.kind === "move") {
        applyMove(payload.fromRow, payload.fromCol, payload.toRow, payload.toCol, Boolean(payload.promote), {
          isRemote: true,
        });
        return;
      }

      if (typeof payload.fromRow === "number") {
        applyMove(payload.fromRow, payload.fromCol, payload.toRow, payload.toCol, false, { isRemote: true });
      }
    },
    getSnapshot: () => ({
      board: cloneBoard(state.board),
      hands: cloneHands(state.hands),
      currentPlayer: state.currentPlayer,
      gameOver: state.gameOver,
    }),
    applySnapshot: ({ board, hands, currentPlayer, gameOver }) => {
      fitBoardToGrid();
      if (!board || !Array.isArray(board)) return;
      state.board = cloneBoard(board);
      state.hands = hands ? cloneHands(hands) : createEmptyHands();
      state.currentPlayer = currentPlayer;
      state.gameOver = Boolean(gameOver);
      clearSelection();
      updateMessageForTurn();
      render();
    },
  };
}
