import { GRID_COLS, GRID_ROWS } from "../data/balance";
import type { MapCell } from "../types/game";
import { isDiggableSoil, isInside, isPassableCellType } from "../utils/grid";

const DIRECTIONS: Array<[number, number]> = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

function isAdjacentDigSpace(cell: MapCell): boolean {
  if (cell.type === "trap") {
    return isPassableCellType(cell.baseType);
  }
  return isPassableCellType(cell.type);
}

export function canDigCell(row: number, column: number, map: MapCell[][], remainingDigCount: number): boolean {
  if (remainingDigCount < 1) return false;
  if (!isInside(GRID_ROWS, GRID_COLS, row, column)) return false;

  const target = map[row][column];
  if (!target) return false;
  if (!isDiggableSoil(target.type)) return false;
  if (target.type === "hardRock") return false;
  const hasAdjacentEmptyCell = DIRECTIONS.some(([dr, dc]) => {
    const nextRow = row + dr;
    const nextCol = column + dc;
    if (!isInside(GRID_ROWS, GRID_COLS, nextRow, nextCol)) return false;
    const adjacentCell = map[nextRow][nextCol];
    if (!adjacentCell) return false;
    return isAdjacentDigSpace(adjacentCell);
  });

  return hasAdjacentEmptyCell;
}
