const SIZE = 15;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

function createBoard() {
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => EMPTY));
}

function opposite(player) {
  return player === BLACK ? WHITE : BLACK;
}

function turnText(player) {
  return player === BLACK ? "BLACK" : "WHITE";
}

function messageTurn(player, state) {
  if (state.gameMode === "room") {
    return player === state.roomPlayer ? "あなたの手番です" : "相手の手番です";
  }
  return player === BLACK ? "黒の手番です" : "白の手番です";
}

function inside(row, col) {
  return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
}

function cloneBoard(board) {
  return board.map((row) => [...row]);
}

function hasFive(board, row, col, player) {
  const dirs = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ];

  return dirs.some(([dr, dc]) => {
    let count = 1;

    let r = row + dr;
    let c = col + dc;
    while (inside(r, c) && board[r][c] === player) {
      count += 1;
      r += dr;
      c += dc;
    }

    r = row - dr;
    c = col - dc;
    while (inside(r, c) && board[r][c] === player) {
      count += 1;
      r -= dr;
      c -= dc;
    }

    return count >= 5;
  });
}

function isBoardFull(board) {
  return board.every((row) => row.every((cell) => cell !== EMPTY));
}

export function initGomoku(options = {}) {
  const screenEl = document.getElementById("gomokuScreen");
  const boardEl = document.getElementById("gomokuBoard");
  const turnTextEl = document.getElementById("gomokuTurnText");
  const messageEl = document.getElementById("gomokuMessage");
  const overlayEl = document.getElementById("gomokuOverlay");
  const startBtn = document.getElementById("gomokuStartBtn");
  const menuBtn = document.getElementById("gomokuMenuBtn");

  const state = {
    board: createBoard(),
    currentPlayer: BLACK,
    gameOver: true,
    gameMode: "local",
    roomCode: null,
    roomRole: null,
    roomPlayer: BLACK,
    roomLocked: false,
    roomLockMessage: "",
  };

  function fitBoardToGrid() {
    const wrap = boardEl?.parentElement;
    if (!wrap) return;

    const BORDER = 2;
    const GAP = 1;
    const CHROME = BORDER * 2 + GAP * (SIZE - 1);
    const maxByWrap = Math.max(260, wrap.clientWidth - 6);
    const maxByViewport = Math.max(260, Math.floor(window.innerHeight * 0.72));
    const maxBoard = Math.min(maxByWrap, maxByViewport, 760);

    const cellByBoard = Math.floor((maxBoard - CHROME) / SIZE);
    const cellPx = Math.max(14, Math.min(42, cellByBoard));
    const boardPx = cellPx * SIZE + CHROME;

    boardEl.style.setProperty("--gomoku-cell-size", `${cellPx}px`);
    boardEl.style.width = `${boardPx}px`;
    boardEl.style.height = `${boardPx}px`;
  }

  function isRoomMode() {
    return state.gameMode === "room";
  }

  function isLocalPlayersTurn() {
    if (!isRoomMode()) return true;
    return state.currentPlayer === state.roomPlayer;
  }

  function setOverlay(text) {
    if (!overlayEl) return;
    if (text) {
      overlayEl.style.opacity = "1";
      overlayEl.textContent = text;
    } else {
      overlayEl.style.opacity = "0";
      overlayEl.textContent = "";
    }
  }

  function updateHeader() {
    turnTextEl.textContent = turnText(state.currentPlayer);
  }

  function renderBoard() {
    boardEl.innerHTML = "";

    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "gomoku-cell";
        cell.disabled = state.gameOver || state.roomLocked || !isLocalPlayersTurn();

        const stone = state.board[row][col];
        if (stone !== EMPTY) {
          const span = document.createElement("span");
          span.className = `gomoku-stone ${stone === BLACK ? "black" : "white"}`;
          cell.appendChild(span);
        }

        cell.addEventListener("click", () => placeStone(row, col, { isRemote: false }));
        boardEl.appendChild(cell);
      }
    }
  }

  function render() {
    updateHeader();
    renderBoard();
  }

  function setWinner(player) {
    state.gameOver = true;
    const winner = player === BLACK ? "黒" : "白";

    if (isRoomMode()) {
      messageEl.textContent = player === state.roomPlayer ? "あなたの勝ちです" : "相手の勝ちです";
    } else {
      messageEl.textContent = `${winner}の勝ちです`;
    }

    setOverlay(`${winner} WIN`);
    render();
  }

  function setDraw() {
    state.gameOver = true;
    messageEl.textContent = "引き分けです";
    setOverlay("DRAW");
    render();
  }

  function placeStone(row, col, { isRemote = false } = {}) {
    if (state.gameOver || state.roomLocked) return;
    if (!inside(row, col)) return;
    if (!isRemote && !isLocalPlayersTurn()) return;
    if (state.board[row][col] !== EMPTY) return;

    const player = state.currentPlayer;
    state.board[row][col] = player;

    if (isRoomMode() && !isRemote) {
      options.onRoomMove?.({ row, col });
    }

    if (hasFive(state.board, row, col, player)) {
      setWinner(player);
      return;
    }

    if (isBoardFull(state.board)) {
      setDraw();
      return;
    }

    state.currentPlayer = opposite(state.currentPlayer);
    messageEl.textContent = messageTurn(state.currentPlayer, state);
    render();
  }

  function resetGame({ fromRemote = false } = {}) {
    state.board = createBoard();
    state.currentPlayer = BLACK;
    state.gameOver = false;

    if (isRoomMode() && state.roomLocked) {
      messageEl.textContent = state.roomLockMessage || "対戦相手を待っています...";
      setOverlay(state.roomLockMessage || "対戦相手を待っています...");
    } else {
      messageEl.textContent = messageTurn(state.currentPlayer, state);
      setOverlay("");
    }

    render();

    if (isRoomMode() && !fromRemote) {
      options.onRoomNewGame?.();
    }
  }

  function enterStandby() {
    state.board = createBoard();
    state.currentPlayer = BLACK;
    state.gameOver = true;
    state.roomLocked = false;
    state.roomLockMessage = "";
    messageEl.textContent = "GAME STARTを押してください";
    setOverlay("GAME STARTで開始");
    render();
  }

  startBtn?.addEventListener("click", () => {
    if (isRoomMode() && state.roomRole !== "host") return;
    resetGame({ fromRemote: false });
  });

  menuBtn?.addEventListener("click", () => {
    const confirmed = window.confirm("ゲーム一覧に戻りますか？");
    if (!confirmed) return;
    options.onBackToMenu?.();
  });
  window.addEventListener("resize", fitBoardToGrid);

  if (screenEl && screenEl.classList.contains("hidden")) {
    fitBoardToGrid();
  }
  enterStandby();

  return {
    startNewGame: ({ fromRemote = false } = {}) => resetGame({ fromRemote }),
    enterStandby,
    stop: () => {
      window.removeEventListener("resize", fitBoardToGrid);
    },
    configureRoomMode: ({ roomCode, roomRole, roomPlayer }) => {
      state.gameMode = "room";
      state.roomCode = roomCode;
      state.roomRole = roomRole;
      state.roomPlayer = roomPlayer === WHITE ? WHITE : BLACK;
      state.roomLocked = false;
      state.roomLockMessage = "";
      options.onRoomStatusChange?.({ roomCode, roomRole });
      fitBoardToGrid();
      render();
    },
    configureStandardMode: () => {
      state.gameMode = "local";
      state.roomCode = null;
      state.roomRole = null;
      state.roomPlayer = BLACK;
      state.roomLocked = false;
      state.roomLockMessage = "";
      options.onRoomStatusChange?.({ roomCode: null, roomRole: null });
      fitBoardToGrid();
      render();
    },
    setRoomLock: ({ locked, message }) => {
      state.roomLocked = Boolean(locked);
      state.roomLockMessage = message ?? "";

      if (state.roomLocked) {
        messageEl.textContent = state.roomLockMessage || "対戦相手を待っています...";
        setOverlay(state.roomLockMessage || "対戦相手を待っています...");
      } else if (!state.gameOver) {
        messageEl.textContent = messageTurn(state.currentPlayer, state);
        setOverlay("");
      }

      render();
    },
    applyRemoteMove: (payload) => {
      if (!payload) return;
      placeStone(payload.row, payload.col, { isRemote: true });
    },
    getSnapshot: () => ({
      board: cloneBoard(state.board),
      currentPlayer: state.currentPlayer,
      gameOver: state.gameOver,
      roomLocked: state.roomLocked,
      roomLockMessage: state.roomLockMessage,
      message: messageEl.textContent,
      overlay: overlayEl?.textContent || "",
    }),
    applySnapshot: (snapshot) => {
      fitBoardToGrid();
      if (!snapshot || !Array.isArray(snapshot.board)) return;

      state.board = cloneBoard(snapshot.board);
      state.currentPlayer = snapshot.currentPlayer === WHITE ? WHITE : BLACK;
      state.gameOver = Boolean(snapshot.gameOver);
      state.roomLocked = Boolean(snapshot.roomLocked);
      state.roomLockMessage = snapshot.roomLockMessage ?? "";

      if (typeof snapshot.message === "string" && snapshot.message) {
        messageEl.textContent = snapshot.message;
      } else if (state.gameOver) {
        messageEl.textContent = "対局終了";
      } else {
        messageEl.textContent = messageTurn(state.currentPlayer, state);
      }

      if (state.gameOver || state.roomLocked) {
        setOverlay(snapshot.overlay || state.roomLockMessage || "対局終了");
      } else {
        setOverlay("");
      }

      render();
    },
  };
}
