const DIRECTIONS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

function createGrid(rows, cols, value = null) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => value));
}

function cloneBoard(board) {
  return board.map((row) => [...row]);
}

function shuffle(list) {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function allTileCoords(board) {
  const coords = [];
  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      if (board[row][col] !== null) coords.push({ row, col });
    }
  }
  return coords;
}

function isBoardCleared(board) {
  return allTileCoords(board).length === 0;
}

function canConnectWithTwoTurns(board, a, b) {
  if (!a || !b) return false;
  if (a.row === b.row && a.col === b.col) return false;

  const rows = board.length;
  const cols = board[0].length;

  const start = { row: a.row + 1, col: a.col + 1 };
  const target = { row: b.row + 1, col: b.col + 1 };

  const inRange = (row, col) => row >= 0 && row <= rows + 1 && col >= 0 && col <= cols + 1;

  const isBlocked = (row, col) => {
    if (row === target.row && col === target.col) return false;
    if (row <= 0 || row > rows || col <= 0 || col > cols) return false;
    return board[row - 1][col - 1] !== null;
  };

  const visited = Array.from({ length: rows + 2 }, () =>
    Array.from({ length: cols + 2 }, () => Array.from({ length: 4 }, () => 3)),
  );

  const queue = [{ row: start.row, col: start.col, dir: -1, turns: 0 }];
  let head = 0;

  while (head < queue.length) {
    const current = queue[head];
    head += 1;

    for (let dirIndex = 0; dirIndex < 4; dirIndex += 1) {
      const turns = current.dir === -1 || current.dir === dirIndex
        ? current.turns
        : current.turns + 1;
      if (turns > 2) continue;

      const [dr, dc] = DIRECTIONS[dirIndex];
      let nextRow = current.row + dr;
      let nextCol = current.col + dc;

      while (inRange(nextRow, nextCol) && !isBlocked(nextRow, nextCol)) {
        if (turns < visited[nextRow][nextCol][dirIndex]) {
          visited[nextRow][nextCol][dirIndex] = turns;
          if (nextRow === target.row && nextCol === target.col) {
            return true;
          }
          queue.push({ row: nextRow, col: nextCol, dir: dirIndex, turns });
        }
        nextRow += dr;
        nextCol += dc;
      }
    }
  }

  return false;
}

function createDeck(cellCount, typeCount) {
  const pairCount = Math.floor(cellCount / 2);
  const deck = [];
  for (let i = 0; i < pairCount; i += 1) {
    const id = i % typeCount;
    deck.push(id, id);
  }
  return shuffle(deck);
}

function writeDeckToBoard(deck, rows, cols) {
  const board = createGrid(rows, cols, null);
  let index = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (index < deck.length) {
        board[row][col] = deck[index];
        index += 1;
      }
    }
  }
  return board;
}

function forEachMatchingPair(board, callback) {
  const coords = allTileCoords(board);
  for (let i = 0; i < coords.length; i += 1) {
    const a = coords[i];
    const tileId = board[a.row][a.col];
    for (let j = i + 1; j < coords.length; j += 1) {
      const b = coords[j];
      if (board[b.row][b.col] !== tileId) continue;
      if (canConnectWithTwoTurns(board, a, b)) {
        callback(a, b);
      }
    }
  }
}

function findFirstMove(board) {
  let found = null;
  forEachMatchingPair(board, (a, b) => {
    if (!found) found = { a, b };
  });
  return found;
}

function reshuffleBoard(board) {
  const coords = allTileCoords(board);
  const tiles = coords.map((c) => board[c.row][c.col]);
  const shuffled = shuffle(tiles);
  const next = cloneBoard(board);
  coords.forEach((c, index) => {
    next[c.row][c.col] = shuffled[index];
  });
  return next;
}

function normalizeCoord(coord) {
  const row = Number(coord?.row);
  const col = Number(coord?.col);
  if (!Number.isInteger(row) || !Number.isInteger(col)) return null;
  return { row, col };
}

export function createMahjongEngine({ rows = 8, cols = 14, typeCount = 34 } = {}) {
  const cellCount = rows * cols;
  const evenCellCount = cellCount % 2 === 0 ? cellCount : cellCount - 1;

  const state = {
    rows,
    cols,
    board: createGrid(rows, cols, null),
    selected: null,
    message: "",
  };

  function remainingTileCount() {
    return allTileCoords(state.board).length;
  }

  function restart() {
    const deck = createDeck(evenCellCount, typeCount);
    state.board = writeDeckToBoard(deck, rows, cols);
    state.selected = null;
    state.message = "";

    if (!findFirstMove(state.board) && !isBoardCleared(state.board)) {
      ensurePlayable();
    }
  }

  function ensurePlayable() {
    if (isBoardCleared(state.board)) return false;
    for (let attempt = 0; attempt < 24; attempt += 1) {
      const move = findFirstMove(state.board);
      if (move) return true;
      state.board = reshuffleBoard(state.board);
    }
    return Boolean(findFirstMove(state.board));
  }

  function getHint() {
    return findFirstMove(state.board);
  }

  function removePair(a, b) {
    state.board[a.row][a.col] = null;
    state.board[b.row][b.col] = null;
    state.selected = null;
  }

  function resolveRemovalOutcome(action) {
    const remaining = remainingTileCount();
    const cleared = remaining === 0;
    if (!cleared && !findFirstMove(state.board)) {
      ensurePlayable();
      return { ok: true, action: `${action}+reshuffle`, remaining: remainingTileCount(), cleared: false };
    }
    return { ok: true, action, remaining, cleared };
  }

  function playPair(aCoord, bCoord) {
    const a = normalizeCoord(aCoord);
    const b = normalizeCoord(bCoord);
    if (!a || !b) return { ok: false, reason: "invalid" };
    if (a.row < 0 || a.row >= rows || a.col < 0 || a.col >= cols) return { ok: false, reason: "out-of-range" };
    if (b.row < 0 || b.row >= rows || b.col < 0 || b.col >= cols) return { ok: false, reason: "out-of-range" };
    if (a.row === b.row && a.col === b.col) return { ok: false, reason: "same-tile" };

    const tileA = state.board[a.row][a.col];
    const tileB = state.board[b.row][b.col];
    if (tileA === null || tileB === null) return { ok: false, reason: "empty" };
    if (tileA !== tileB) return { ok: false, reason: "different" };
    if (!canConnectWithTwoTurns(state.board, a, b)) return { ok: false, reason: "blocked" };

    removePair(a, b);
    return {
      ...resolveRemovalOutcome("remove"),
      pair: { a, b },
    };
  }

  function select(row, col) {
    if (!Number.isInteger(row) || !Number.isInteger(col)) {
      return { ok: false, reason: "invalid" };
    }
    if (row < 0 || row >= rows || col < 0 || col >= cols) {
      return { ok: false, reason: "out-of-range" };
    }

    const tileId = state.board[row][col];
    if (tileId === null) {
      return { ok: false, reason: "empty" };
    }

    const picked = { row, col };
    if (!state.selected) {
      state.selected = picked;
      return { ok: true, action: "select" };
    }

    if (state.selected.row === row && state.selected.col === col) {
      state.selected = null;
      return { ok: true, action: "unselect" };
    }

    const selectedTileId = state.board[state.selected.row][state.selected.col];
    if (selectedTileId !== tileId) {
      state.selected = picked;
      return { ok: true, action: "switch" };
    }

    const canRemove = canConnectWithTwoTurns(state.board, state.selected, picked);
    if (!canRemove) {
      state.selected = picked;
      return { ok: true, action: "blocked" };
    }

    const pair = { a: { ...state.selected }, b: picked };
    removePair(state.selected, picked);
    return {
      ...resolveRemovalOutcome("remove"),
      pair,
    };
  }

  function shuffleRemaining() {
    if (isBoardCleared(state.board)) return false;
    state.board = reshuffleBoard(state.board);
    state.selected = null;
    return ensurePlayable();
  }

  function getSnapshot() {
    return {
      rows: state.rows,
      cols: state.cols,
      board: cloneBoard(state.board),
      selected: state.selected ? { ...state.selected } : null,
      message: String(state.message || ""),
    };
  }

  function applySnapshot(snapshot) {
    if (!snapshot || !Array.isArray(snapshot.board)) return;
    state.board = cloneBoard(snapshot.board);
    const row = Number(snapshot.selected?.row);
    const col = Number(snapshot.selected?.col);
    if (Number.isInteger(row) && Number.isInteger(col)) {
      state.selected = { row, col };
    } else {
      state.selected = null;
    }
    state.message = String(snapshot.message || "");
  }

  return {
    restart,
    select,
    playPair,
    getHint,
    shuffleRemaining,
    ensurePlayable,
    remainingTileCount,
    getSnapshot,
    applySnapshot,
    get board() {
      return state.board;
    },
    get selected() {
      return state.selected;
    },
  };
}
