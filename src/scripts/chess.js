import { bindBackToMenuButton } from "./uiButtonHelpers.js";

const SIZE = 8;
const WHITE = "white";
const BLACK = "black";

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

function turnLabel(owner) {
  return owner === WHITE ? "白" : "黒";
}

function pieceLabel(piece) {
  return `${turnLabel(piece.owner)} ${PIECE_NAME[piece.type]}`;
}

function pieceGlyph(piece) {
  return PIECE_GLYPH[piece.owner]?.[piece.type] ?? "?";
}

export function initChess(options = {}) {
  const screenEl = document.getElementById("chessScreen");
  const boardEl = document.getElementById("chessBoard");
  const turnTextEl = document.getElementById("chessTurnText");
  const selectTextEl = document.getElementById("chessSelectText");
  const messageEl = document.getElementById("chessMessage");
  const overlayEl = document.getElementById("chessOverlay");
  const startBtn = document.getElementById("chessStartBtn");
  const menuBtn = document.getElementById("chessMenuBtn");

  const state = {
    board: createInitialBoard(),
    currentPlayer: WHITE,
    selected: null,
    validMoves: [],
    gameOver: false,
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

  function isLocalPlayersTurn() {
    if (!isRoomMode()) return true;
    return !state.roomLocked && state.currentPlayer === state.roomPlayer;
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
        messageEl.textContent = state.roomLockMessage || "対戦相手を待機中...";
        return;
      }

      const base = state.currentPlayer === state.roomPlayer ? "あなたの手番" : "相手の手番";
      messageEl.textContent = isInCheck(state.board, state.currentPlayer) ? `${base}（チェック）` : base;
      return;
    }

    const base = `${turnLabel(state.currentPlayer)}の手番`;
    messageEl.textContent = isInCheck(state.board, state.currentPlayer) ? `${base}（チェック）` : base;
  }

  function endGame(winnerOwner, reason) {
    state.gameOver = true;
    overlayEl.style.opacity = "1";
    overlayEl.textContent = `${turnLabel(winnerOwner)}の勝ち`;
    messageEl.textContent = reason;
    clearSelection();
    render();
  }

  function evaluateAfterMove(mover) {
    const enemy = opposite(mover);

    if (!findKing(state.board, enemy)) {
      endGame(mover, "キングを取りました");
      return;
    }

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

    if (isRoomMode() && !fromRemote) {
      options.onRoomNewGame?.();
    }
  }

  function enterStandby() {
    fitBoardToGrid();
    state.board = createInitialBoard();
    state.currentPlayer = WHITE;
    state.gameOver = true;
    clearSelection();
    overlayEl.style.opacity = "1";
    overlayEl.textContent = "新規対局で開始";
    messageEl.textContent = "STARTボタンで開始してください";
    render();
  }

  function movePiece(fromRow, fromCol, toRow, toCol, { isRemote = false } = {}) {
    if (state.gameOver) return;

    const piece = state.board[fromRow]?.[fromCol];
    if (!piece) return;
    if (!isRemote && !isLocalPlayersTurn()) return;
    if (!isRemote && piece.owner !== state.currentPlayer) return;

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

    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = `chess-cell ${(row + col) % 2 === 0 ? "light" : "dark"}`;
        cell.disabled = state.gameOver || !isLocalPlayersTurn();

        if (state.selected && state.selected.row === row && state.selected.col === col) {
          cell.classList.add("selected");
        }

        if (state.validMoves.some((m) => m.row === row && m.col === col)) {
          cell.classList.add("valid");
        }

        const piece = state.board[row][col];
        if (piece) {
          const span = document.createElement("span");
          span.className = `chess-piece ${piece.owner}`;
          span.textContent = pieceGlyph(piece);
          cell.appendChild(span);
        }

        cell.addEventListener("click", () => onCellClick(row, col));
        boardEl.appendChild(cell);
      }
    }
  }

  function render() {
    updateHeader();
    renderBoard();
  }

  startBtn?.addEventListener("click", () => resetGame());
  bindBackToMenuButton(menuBtn, () => {
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
      window.removeEventListener("resize", fitBoardToGrid);
    },
    configureRoomMode: ({ roomCode, roomRole, roomPlayer }) => {
      state.gameMode = "room";
      state.roomCode = roomCode;
      state.roomRole = roomRole;
      state.roomPlayer = roomPlayer === 2 ? BLACK : WHITE;
      options.onRoomStatusChange?.({ roomCode, roomRole });
    },
    configureStandardMode: () => {
      state.gameMode = "local";
      state.roomCode = null;
      state.roomRole = null;
      state.roomPlayer = WHITE;
      state.roomLocked = false;
      state.roomLockMessage = "";
      options.onRoomStatusChange?.({ roomCode: null, roomRole: null });
    },
    setRoomLock: ({ locked, message }) => {
      fitBoardToGrid();
      state.roomLocked = Boolean(locked);
      state.roomLockMessage = message ?? "";

      if (state.roomLocked) {
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
    getSnapshot: () => ({
      board: cloneBoard(state.board),
      currentPlayer: state.currentPlayer,
      gameOver: state.gameOver,
    }),
    applySnapshot: ({ board, currentPlayer, gameOver }) => {
      fitBoardToGrid();
      if (!board || !Array.isArray(board)) return;
      state.board = cloneBoard(board);
      state.currentPlayer = currentPlayer;
      state.gameOver = Boolean(gameOver);
      clearSelection();
      updateMessageForTurn();
      render();
    },
  };
}
