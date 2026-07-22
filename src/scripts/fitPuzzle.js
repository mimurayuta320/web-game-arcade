const ROWS = 6;
const COLS = 6;
const PIECE_COUNT = 6;

const PALETTE = ["#ff6b35", "#16db93", "#ffd166", "#4cc9f0", "#f72585", "#b5179e", "#7209b7", "#f77f00"];

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null));
}

function cloneRects(rects) {
  return rects.map((r) => ({ ...r }));
}

function generateRects() {
  let rects = [{ row: 0, col: 0, h: ROWS, w: COLS }];

  while (rects.length < PIECE_COUNT) {
    const candidates = rects.filter((r) => r.h >= 2 || r.w >= 2);
    if (candidates.length === 0) break;

    const target = candidates[Math.floor(Math.random() * candidates.length)];
    const idx = rects.indexOf(target);

    const canSplitH = target.h >= 2;
    const canSplitW = target.w >= 2;

    let splitHorizontal = false;
    if (canSplitH && canSplitW) {
      splitHorizontal = Math.random() < 0.5;
    } else {
      splitHorizontal = canSplitH;
    }

    if (splitHorizontal) {
      const cut = 1 + Math.floor(Math.random() * (target.h - 1));
      const a = { row: target.row, col: target.col, h: cut, w: target.w };
      const b = { row: target.row + cut, col: target.col, h: target.h - cut, w: target.w };
      rects.splice(idx, 1, a, b);
    } else {
      const cut = 1 + Math.floor(Math.random() * (target.w - 1));
      const a = { row: target.row, col: target.col, h: target.h, w: cut };
      const b = { row: target.row, col: target.col + cut, h: target.h, w: target.w - cut };
      rects.splice(idx, 1, a, b);
    }
  }

  return rects;
}

export function initFitPuzzle(options = {}) {
  const boardEl = document.getElementById("fitPuzzleBoard");
  const piecesEl = document.getElementById("fitPuzzlePieces");
  const boardTextEl = document.getElementById("fitPuzzleBoardText");
  const placedTextEl = document.getElementById("fitPuzzlePlacedText");
  const messageEl = document.getElementById("fitPuzzleMessage");
  const startBtn = document.getElementById("fitPuzzleStartBtn");
  const rotateBtn = document.getElementById("fitPuzzleRotateBtn");
  const resetBtn = document.getElementById("fitPuzzleResetBtn");
  const menuBtn = document.getElementById("fitPuzzleMenuBtn");

  const state = {
    board: createEmptyBoard(),
    pieces: [],
    selectedId: null,
    started: false,
  };

  function pieceDims(piece) {
    if (piece.rot % 2 === 0) return { h: piece.baseH, w: piece.baseW };
    return { h: piece.baseW, w: piece.baseH };
  }

  function placedCount() {
    return state.pieces.filter((p) => p.placed).length;
  }

  function updateHud() {
    boardTextEl.textContent = `${ROWS} x ${COLS}`;
    placedTextEl.textContent = `${placedCount()} / ${state.pieces.length}`;
  }

  function clearBoardOf(pieceId) {
    for (let r = 0; r < ROWS; r += 1) {
      for (let c = 0; c < COLS; c += 1) {
        if (state.board[r][c] === pieceId) state.board[r][c] = null;
      }
    }
  }

  function getPieceById(id) {
    return state.pieces.find((p) => p.id === id) || null;
  }

  function removePlacedPiece(piece) {
    if (!piece || !piece.placed) return;
    clearBoardOf(piece.id);
    piece.placed = false;
    piece.row = null;
    piece.col = null;
  }

  function canPlace(piece, row, col) {
    const { h, w } = pieceDims(piece);
    if (row < 0 || col < 0 || row + h > ROWS || col + w > COLS) return false;

    for (let rr = row; rr < row + h; rr += 1) {
      for (let cc = col; cc < col + w; cc += 1) {
        if (state.board[rr][cc] !== null) return false;
      }
    }
    return true;
  }

  function placePiece(piece, row, col) {
    if (!canPlace(piece, row, col)) return false;

    const { h, w } = pieceDims(piece);
    for (let rr = row; rr < row + h; rr += 1) {
      for (let cc = col; cc < col + w; cc += 1) {
        state.board[rr][cc] = piece.id;
      }
    }

    piece.placed = true;
    piece.row = row;
    piece.col = col;
    return true;
  }

  function isClear() {
    if (!state.started) return false;
    return state.pieces.length > 0 && state.pieces.every((p) => p.placed);
  }

  function renderBoard() {
    boardEl.innerHTML = "";

    for (let r = 0; r < ROWS; r += 1) {
      for (let c = 0; c < COLS; c += 1) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "fit-cell";
        const pieceId = state.board[r][c];

        if (pieceId) {
          const piece = getPieceById(pieceId);
          if (piece) {
            cell.classList.add("filled");
            cell.style.setProperty("--piece-color", piece.color);
          }
        }

        cell.addEventListener("click", () => {
          if (!state.started) return;

          const existingId = state.board[r][c];
          if (existingId && state.selectedId === null) {
            const existingPiece = getPieceById(existingId);
            removePlacedPiece(existingPiece);
            state.selectedId = existingId;
            messageEl.textContent = "配置済みピースを戻しました";
            render();
            return;
          }

          const selected = getPieceById(state.selectedId);
          if (!selected || selected.placed) return;

          if (placePiece(selected, r, c)) {
            state.selectedId = null;
            if (isClear()) {
              messageEl.textContent = "クリア! すべて枠内に収まりました";
            } else {
              messageEl.textContent = "配置しました";
            }
          } else {
            messageEl.textContent = "ここには置けません";
          }
          render();
        });

        boardEl.appendChild(cell);
      }
    }
  }

  function renderPieces() {
    piecesEl.innerHTML = "";

    state.pieces.forEach((piece) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "fit-piece";
      if (piece.placed) item.classList.add("placed");
      if (state.selectedId === piece.id) item.classList.add("selected");
      item.style.setProperty("--piece-color", piece.color);

      const { h, w } = pieceDims(piece);
      item.style.setProperty("--piece-h", String(h));
      item.style.setProperty("--piece-w", String(w));
      item.disabled = !state.started;

      for (let i = 0; i < h * w; i += 1) {
        const unit = document.createElement("span");
        unit.className = "fit-piece-unit";
        item.appendChild(unit);
      }

      item.addEventListener("click", () => {
        if (!state.started) return;
        if (piece.placed) {
          removePlacedPiece(piece);
          state.selectedId = piece.id;
          messageEl.textContent = "配置済みピースを戻しました";
        } else {
          state.selectedId = state.selectedId === piece.id ? null : piece.id;
          messageEl.textContent = state.selectedId ? "ピースを選択しました" : "選択解除しました";
        }
        render();
      });

      piecesEl.appendChild(item);
    });
  }

  function render() {
    updateHud();
    renderBoard();
    renderPieces();
  }

  function newPuzzle() {
    const solutionRects = generateRects();
    const pieces = cloneRects(solutionRects).map((r, idx) => ({
      id: `piece-${idx + 1}`,
      baseH: r.h,
      baseW: r.w,
      rot: Math.random() < 0.5 ? 0 : 1,
      color: PALETTE[idx % PALETTE.length],
      placed: false,
      row: null,
      col: null,
    }));

    state.board = createEmptyBoard();
    state.pieces = shuffle(pieces);
    state.selectedId = state.pieces[0]?.id ?? null;
    state.started = true;
    messageEl.textContent = "ピースを選んで枠内に配置してください";
    render();
  }

  function resetCurrent() {
    if (!state.started) return;
    state.board = createEmptyBoard();
    state.pieces.forEach((p) => {
      p.placed = false;
      p.row = null;
      p.col = null;
      p.rot = 0;
    });
    state.selectedId = state.pieces[0]?.id ?? null;
    messageEl.textContent = "配置をリセットしました";
    render();
  }

  function rotateSelected() {
    if (!state.started) return;
    const piece = getPieceById(state.selectedId);
    if (!piece || piece.placed) return;
    if (piece.baseH === piece.baseW) {
      messageEl.textContent = "このピースは回転しても形が同じです";
      return;
    }
    piece.rot = (piece.rot + 1) % 2;
    messageEl.textContent = "回転しました";
    render();
  }

  function enterStandby() {
    state.started = false;
    state.board = createEmptyBoard();
    state.pieces = [];
    state.selectedId = null;
    messageEl.textContent = "GAME STARTで開始";
    render();
  }

  startBtn?.addEventListener("click", () => newPuzzle());
  rotateBtn?.addEventListener("click", () => rotateSelected());
  resetBtn?.addEventListener("click", () => resetCurrent());
  menuBtn?.addEventListener("click", () => {
    const confirmed = window.confirm("ゲーム一覧に戻りますか？");
    if (!confirmed) return;
    options.onBackToMenu?.();
  });

  enterStandby();

  return {
    startNewGame: () => newPuzzle(),
    enterStandby,
    stop: () => {},
    configureRoomMode: () => {
      enterStandby();
      messageEl.textContent = "このパズルは現在ROOM未対応です";
    },
    configureStandardMode: () => {},
    setRoomLock: () => {},
    applyRemoteMove: () => {},
    getSnapshot: () => ({}),
    applySnapshot: () => {},
  };
}
