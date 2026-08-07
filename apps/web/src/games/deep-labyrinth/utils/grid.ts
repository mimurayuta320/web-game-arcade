import type { CellType, MapCell } from "../types/game";

export function cellKey(row: number, col: number): string {
  return `${row}:${col}`;
}

export function isInside(rows: number, cols: number, row: number, col: number): boolean {
  return row >= 0 && row < rows && col >= 0 && col < cols;
}

export function isPassableCellType(type: CellType): boolean {
  return type === "empty" || type === "entrance" || type === "coreRoom" || type === "nest" || type === "trap";
}

export function isDiggableSoil(type: CellType): boolean {
  return type === "normalSoil" || type === "magicSoil" || type === "moistSoil" || type === "mineralSoil" || type === "toxicSoil";
}

export function cloneMap(map: MapCell[][]): MapCell[][] {
  return map.map((row) => row.map((cell) => ({ ...cell })));
}
