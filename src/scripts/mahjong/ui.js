import { tileLabelOf } from "./tiles.js";

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
      tile.textContent = tileLabelOf(value);
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
