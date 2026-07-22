const SIZE = 15;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;
const CPU_THINK_MS = 260;

function gomokuLang() {
  const langSelectEl = document.getElementById("langSelect");
  return langSelectEl?.value === "ko" ? "ko" : "ja";
}

function gomokuText(key) {
  const dict = {
    ja: {
      black: "黒",
      white: "白",
      yourTurn: "あなたの手番です",
      opponentTurn: "相手の手番です",
      cpuTurn: "CPUの手番です",
      roomLabel: "ルーム",
      roleLabel: "役割",
      roleHost: "ホスト",
      roleGuest: "ゲスト",
      roleSpectator: "観戦",
    },
    ko: {
      black: "흑",
      white: "백",
      yourTurn: "당신의 턴입니다",
      opponentTurn: "상대 턴입니다",
      cpuTurn: "CPU 턴입니다",
      roomLabel: "룸",
      roleLabel: "역할",
      roleHost: "호스트",
      roleGuest: "게스트",
      roleSpectator: "관전",
    },
  };
  return dict[gomokuLang()][key] || dict.ja[key] || key;
}

function createBoard() {
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => EMPTY));
}

function opposite(player) {
  return player === BLACK ? WHITE : BLACK;
}

function turnText(player) {
  return player === BLACK ? gomokuText("black") : gomokuText("white");
}

function messageTurn(player, state) {
  if (state.gameMode === "room") {
    return player === state.roomPlayer ? gomokuText("yourTurn") : gomokuText("opponentTurn");
  }
  if (state.playMode === "cpu") {
    return player === state.cpuPlayer ? gomokuText("cpuTurn") : gomokuText("yourTurn");
  }
  return `${turnText(player)}${gomokuLang() === "ko" ? " 턴입니다" : "の手番です"}`;
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
  const modeSelectEl = document.getElementById("gomokuModeSelect");
  const roomStatusEl = document.getElementById("gomokuRoomStatus");
  const roomCodeTextEl = document.getElementById("gomokuRoomCodeText");
  const roomRoleTextEl = document.getElementById("gomokuRoomRoleText");
  const startBtn = document.getElementById("gomokuStartBtn");
  const menuBtn = document.getElementById("gomokuMenuBtn");

  const state = {
    board: createBoard(),
    currentPlayer: BLACK,
    gameOver: true,
    gameMode: "local",
    playMode: "cpu",
    cpuPlayer: WHITE,
    cpuThinking: false,
    cpuTimerId: null,
    roomCode: null,
    roomRole: null,
    roomPlayer: BLACK,
    roomLocked: false,
    roomLockMessage: "",
  };

  function clearCpuTimer() {
    if (state.cpuTimerId) {
      window.clearTimeout(state.cpuTimerId);
      state.cpuTimerId = null;
    }
  }

  function isCpuMode() {
    return state.gameMode !== "room" && state.playMode === "cpu";
  }

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
    if (isCpuMode()) {
      return state.currentPlayer !== state.cpuPlayer && !state.cpuThinking;
    }
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

  function playerNameFor(player) {
    if (isRoomMode()) {
      return player === state.roomPlayer ? "あなた" : "相手";
    }
    if (isCpuMode()) {
      return player === state.cpuPlayer ? "CPU" : "あなた";
    }
    return player === BLACK ? "黒" : "白";
  }

  function outcomeTextForWinner(winnerPlayer) {
    const loserPlayer = opposite(winnerPlayer);
    return `${playerNameFor(winnerPlayer)}: 勝ち / ${playerNameFor(loserPlayer)}: 負け`;
  }

  function syncStartButtonDisabled() {
    if (!startBtn) return;
    startBtn.disabled = isRoomMode() && state.roomRole !== "host";
  }

  function syncModeSelectDisabled() {
    if (!modeSelectEl) return;
    modeSelectEl.disabled = isRoomMode() || !state.gameOver || state.cpuThinking;
    modeSelectEl.value = state.playMode;
  }

  function updateRoomStatusPanel() {
    if (!roomStatusEl || !roomCodeTextEl || !roomRoleTextEl) return;

    if (!isRoomMode() || !state.roomCode) {
      roomStatusEl.classList.add("hidden");
      roomCodeTextEl.textContent = `${gomokuText("roomLabel")}: -`;
      roomRoleTextEl.textContent = `${gomokuText("roleLabel")}: -`;
      return;
    }

    roomStatusEl.classList.remove("hidden");
    roomCodeTextEl.textContent = `${gomokuText("roomLabel")}: ${state.roomCode}`;
    const roleLabel =
      state.roomRole === "host"
        ? gomokuText("roleHost")
        : state.roomRole === "guest"
          ? gomokuText("roleGuest")
          : gomokuText("roleSpectator");
    roomRoleTextEl.textContent = `${gomokuText("roleLabel")}: ${roleLabel}`;
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
    updateRoomStatusPanel();
    syncStartButtonDisabled();
    syncModeSelectDisabled();
    renderBoard();
  }

  function collectEmptyCells(board) {
    const cells = [];
    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        if (board[row][col] === EMPTY) {
          cells.push({ row, col });
        }
      }
    }
    return cells;
  }

  function hasNeighborStone(board, row, col) {
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        if (dr === 0 && dc === 0) continue;
        const r = row + dr;
        const c = col + dc;
        if (inside(r, c) && board[r][c] !== EMPTY) {
          return true;
        }
      }
    }
    return false;
  }

  function findImmediateMove(board, player) {
    const empties = collectEmptyCells(board);
    for (const cell of empties) {
      board[cell.row][cell.col] = player;
      const win = hasFive(board, cell.row, cell.col, player);
      board[cell.row][cell.col] = EMPTY;
      if (win) return cell;
    }
    return null;
  }

  function chooseCpuMove() {
    const board = state.board;
    const cpu = state.currentPlayer;
    const enemy = opposite(cpu);

    const winning = findImmediateMove(board, cpu);
    if (winning) return winning;

    const block = findImmediateMove(board, enemy);
    if (block) return block;

    const empties = collectEmptyCells(board);
    if (empties.length === 0) return null;

    const center = Math.floor(SIZE / 2);
    const active = empties.filter((cell) => hasNeighborStone(board, cell.row, cell.col));
    const candidates = active.length > 0 ? active : empties;

    let bestScore = -Infinity;
    let best = candidates[0];
    for (const cell of candidates) {
      let score = 0;
      const centerDist = Math.abs(cell.row - center) + Math.abs(cell.col - center);
      score += (SIZE - centerDist) * 0.25;

      for (let dr = -1; dr <= 1; dr += 1) {
        for (let dc = -1; dc <= 1; dc += 1) {
          if (dr === 0 && dc === 0) continue;
          const r = cell.row + dr;
          const c = cell.col + dc;
          if (!inside(r, c)) continue;
          if (board[r][c] === cpu) score += 1.2;
          if (board[r][c] === enemy) score += 0.9;
        }
      }

      // Small noise keeps games from feeling repetitive when scores tie.
      score += Math.random() * 0.08;

      if (score > bestScore) {
        bestScore = score;
        best = cell;
      }
    }

    return best;
  }

  function maybeTriggerCpuTurn() {
    clearCpuTimer();
    state.cpuThinking = false;

    if (!isCpuMode() || state.gameOver || state.roomLocked) {
      return;
    }
    if (state.currentPlayer !== state.cpuPlayer) {
      return;
    }

    state.cpuThinking = true;
    messageEl.textContent = "CPUが考えています...";
    render();

    state.cpuTimerId = window.setTimeout(() => {
      state.cpuTimerId = null;
      state.cpuThinking = false;

      if (!isCpuMode() || state.gameOver || state.roomLocked) {
        render();
        return;
      }

      const move = chooseCpuMove();
      if (!move) {
        setDraw();
        return;
      }

      placeStone(move.row, move.col, { isCpu: true });
    }, CPU_THINK_MS);
  }

  function setWinner(player) {
    state.gameOver = true;
    const outcomeText = outcomeTextForWinner(player);
    messageEl.textContent = outcomeText;
    setOverlay(outcomeText);
    render();
  }

  function setDraw() {
    state.gameOver = true;
    messageEl.textContent = "引き分けです";
    setOverlay("DRAW");
    render();
  }

  function placeStone(row, col, { isRemote = false, isCpu = false } = {}) {
    if (state.gameOver || state.roomLocked) return;
    if (!inside(row, col)) return;
    if (!isRemote && !isCpu && !isLocalPlayersTurn()) return;
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
    maybeTriggerCpuTurn();
  }

  function resetGame({ fromRemote = false } = {}) {
    clearCpuTimer();
    state.cpuThinking = false;
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

    maybeTriggerCpuTurn();
  }

  function enterStandby() {
    clearCpuTimer();
    state.cpuThinking = false;
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

  modeSelectEl?.addEventListener("change", () => {
    if (isRoomMode()) return;
    const nextMode = modeSelectEl.value === "local" ? "local" : "cpu";
    state.playMode = nextMode;
    enterStandby();
  });

  menuBtn?.addEventListener("click", () => {
    const confirmed = window.confirm("ゲーム一覧に戻りますか？");
    if (!confirmed) return;
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
    startNewGame: ({ fromRemote = false } = {}) => resetGame({ fromRemote }),
    enterStandby,
    stop: () => {
      clearCpuTimer();
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
      enterStandby();
    },
    configureStandardMode: (mode) => {
      state.gameMode = "local";
      state.playMode = mode === "local" ? "local" : "cpu";
      state.roomCode = null;
      state.roomRole = null;
      state.roomPlayer = BLACK;
      state.roomLocked = false;
      state.roomLockMessage = "";
      options.onRoomStatusChange?.({ roomCode: null, roomRole: null });
      fitBoardToGrid();
      enterStandby();
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
