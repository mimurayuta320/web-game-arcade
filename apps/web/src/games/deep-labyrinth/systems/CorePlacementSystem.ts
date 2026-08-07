import { GRID_COLS, GRID_ROWS, MIN_CORE_PATH_DISTANCE } from "../data/balance";
import type { CorePlacementResult, GameState, Vec2 } from "../types/game";
import { isInside } from "../utils/grid";
import { shortestPathDistanceBfs } from "../utils/pathfinding";

function isOnOuterRing(row: number, col: number): boolean {
  return row <= 0 || row >= GRID_ROWS - 1 || col <= 0 || col >= GRID_COLS - 1;
}

function findEntrance(state: GameState): Vec2 | null {
  for (let row = 0; row < state.map.length; row += 1) {
    for (let col = 0; col < state.map[row].length; col += 1) {
      if (state.map[row][col].type === "entrance") return { x: col, y: row };
    }
  }
  return null;
}

function hasCharacterAt(row: number, col: number, state: GameState): boolean {
  const hitMonster = state.monsters.some(
    (monster) =>
      monster.isActive &&
      monster.state !== "dead" &&
      Math.floor(monster.position.y) === row &&
      Math.floor(monster.position.x) === col,
  );
  if (hitMonster) return true;

  return state.invaders.some(
    (invader) => invader.state !== "dead" && Math.floor(invader.position.y) === row && Math.floor(invader.position.x) === col,
  );
}

export function canPlaceCore(row: number, column: number, gameState: GameState): CorePlacementResult {
  if (gameState.corePosition) {
    return { canPlace: false, reason: "魔界核はすでに配置済みです" };
  }

  if (!isInside(GRID_ROWS, GRID_COLS, row, column)) {
    return { canPlace: false, reason: "マップ外には配置できません" };
  }

  if (isOnOuterRing(row, column)) {
    return { canPlace: false, reason: "マップ外周には配置できません" };
  }

  const cell = gameState.map[row][column];
  if (!cell) {
    return { canPlace: false, reason: "無効なマスです" };
  }

  if (cell.type !== "empty") {
    if (cell.type === "entrance") return { canPlace: false, reason: "入口には配置できません" };
    if (cell.type === "hardRock") return { canPlace: false, reason: "岩盤には配置できません" };
    if (cell.type === "nest") return { canPlace: false, reason: "魔物の巣が置かれています" };
    if (cell.type === "trap") return { canPlace: false, reason: "罠が置かれています" };
    return { canPlace: false, reason: "掘削済みの空間に配置してください" };
  }

  const hasNest = gameState.nests.some((nest) => nest.x === column && nest.y === row);
  if (hasNest) return { canPlace: false, reason: "魔物の巣が置かれています" };

  const hasTrap = gameState.traps.some((trap) => trap.x === column && trap.y === row);
  if (hasTrap) return { canPlace: false, reason: "罠が置かれています" };

  if (hasCharacterAt(row, column, gameState)) {
    return { canPlace: false, reason: "ほかのキャラクターが立っています" };
  }

  const entrance = findEntrance(gameState);
  if (!entrance) return { canPlace: false, reason: "入口が見つかりません" };

  const target = { x: column, y: row };
  const dist = shortestPathDistanceBfs(gameState.map, entrance, target, `${row}:${column}`);
  if (dist == null) {
    return { canPlace: false, reason: "入口から到達できない場所です" };
  }

  if (dist < MIN_CORE_PATH_DISTANCE) {
    return { canPlace: false, reason: "入口に近すぎます", pathDistance: dist };
  }

  return { canPlace: true, pathDistance: dist };
}

export function listPlaceableCoreCells(state: GameState): Array<{ row: number; col: number; pathDistance: number }> {
  const result: Array<{ row: number; col: number; pathDistance: number }> = [];
  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let col = 0; col < GRID_COLS; col += 1) {
      const checked = canPlaceCore(row, col, state);
      if (checked.canPlace) {
        result.push({ row, col, pathDistance: checked.pathDistance ?? 0 });
      }
    }
  }
  return result;
}
