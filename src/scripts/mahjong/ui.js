import { tileLabelOf } from "./tiles.js";

const MAHJONG_TILE_SHEET_URL = new URL("../../motionPng/麻雀/麻雀牌.png", import.meta.url).href;
const MAHJONG_SHEET_COLS = 10;
const MAHJONG_SHEET_ROWS = 4;

function tileSheetCoordOf(tileId) {
  if (!Number.isInteger(tileId) || tileId < 0) return null;
  const idx = tileId % 34;
  if (idx <= 26) {
    return { col: idx % 9, row: Math.floor(idx / 9) };
  }
  return { col: idx - 27, row: 3 };
}

export function renderMahjongBoard({ boardEl, board, selected, onTileClick, disabled }) {
  if (!boardEl) return;

  const rows = board.length;
  const cols = rows > 0 ? board[0].length : 0;

  boardEl.style.setProperty("--mahjong-cols", String(cols));
  boardEl.innerHTML = "";

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const value = board[row][col];
      if (value === null) {
        const empty = document.createElement("div");
        empty.className = "mahjong-empty";
        empty.dataset.row = String(row);
        empty.dataset.col = String(col);
        boardEl.appendChild(empty);
        continue;
      }

      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "mahjong-tile";
      const label = tileLabelOf(value);
      tile.textContent = label;
      tile.dataset.label = label;

      const coord = tileSheetCoordOf(value);
      if (coord) {
        tile.classList.add("has-image");
        tile.style.setProperty("--mahjong-sheet-url", `url("${MAHJONG_TILE_SHEET_URL}")`);
        tile.style.setProperty("--mahjong-sheet-cols", String(MAHJONG_SHEET_COLS));
        tile.style.setProperty("--mahjong-sheet-rows", String(MAHJONG_SHEET_ROWS));
        tile.style.setProperty("--mahjong-sheet-col", String(coord.col));
        tile.style.setProperty("--mahjong-sheet-row", String(coord.row));
      }

      tile.disabled = Boolean(disabled);
      tile.dataset.row = String(row);
      tile.dataset.col = String(col);

      if (selected && selected.row === row && selected.col === col) {
        tile.classList.add("selected");
      }

      tile.addEventListener("click", () => onTileClick(row, col));
      boardEl.appendChild(tile);
    }
  }
}
