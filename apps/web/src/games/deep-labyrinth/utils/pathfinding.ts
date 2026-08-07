import type { MapCell, Vec2 } from "../types/game";
import { cellKey, isInside, isPassableCellType } from "./grid";

const DIR4: Array<[number, number]> = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

function heuristic(a: Vec2, b: Vec2): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function reconstruct(cameFrom: Map<string, string>, currentKey: string): Vec2[] {
  const path: Vec2[] = [];
  let cursor: string | undefined = currentKey;
  while (cursor) {
    const [r, c] = cursor.split(":").map(Number);
    path.push({ x: c, y: r });
    cursor = cameFrom.get(cursor);
  }
  return path.reverse();
}

type StepCostFn = (from: Vec2, to: Vec2, toCell: MapCell) => number;

export function findPathAStar(map: MapCell[][], start: Vec2, goal: Vec2): Vec2[] {
  const rows = map.length;
  const cols = map[0]?.length ?? 0;
  if (!rows || !cols) return [];

  const startKey = cellKey(start.y, start.x);
  const goalKey = cellKey(goal.y, goal.x);

  const open = new Set<string>([startKey]);
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>([[startKey, 0]]);
  const fScore = new Map<string, number>([[startKey, heuristic(start, goal)]]);

  while (open.size > 0) {
    let current = "";
    let best = Number.POSITIVE_INFINITY;
    open.forEach((key) => {
      const score = fScore.get(key) ?? Number.POSITIVE_INFINITY;
      if (score < best) {
        best = score;
        current = key;
      }
    });
    if (!current) break;

    if (current === goalKey) {
      return reconstruct(cameFrom, current);
    }

    open.delete(current);
    const [row, col] = current.split(":").map(Number);

    for (const [dr, dc] of DIR4) {
      const nr = row + dr;
      const nc = col + dc;
      if (!isInside(rows, cols, nr, nc)) continue;
      const nCell = map[nr][nc];
      if (!isPassableCellType(nCell.type)) continue;
      const nKey = cellKey(nr, nc);
      const tentative = (gScore.get(current) ?? Number.POSITIVE_INFINITY) + 1;
      if (tentative >= (gScore.get(nKey) ?? Number.POSITIVE_INFINITY)) continue;

      cameFrom.set(nKey, current);
      gScore.set(nKey, tentative);
      fScore.set(nKey, tentative + heuristic({ x: nc, y: nr }, goal));
      open.add(nKey);
    }
  }

  return [];
}

export function findPathAStarWithCost(
  map: MapCell[][],
  start: Vec2,
  goal: Vec2,
  getStepCost: StepCostFn,
): Vec2[] {
  const rows = map.length;
  const cols = map[0]?.length ?? 0;
  if (!rows || !cols) return [];

  const startKey = cellKey(start.y, start.x);
  const goalKey = cellKey(goal.y, goal.x);
  const open = new Set<string>([startKey]);
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>([[startKey, 0]]);
  const fScore = new Map<string, number>([[startKey, heuristic(start, goal)]]);

  while (open.size > 0) {
    let current = "";
    let best = Number.POSITIVE_INFINITY;
    open.forEach((key) => {
      const score = fScore.get(key) ?? Number.POSITIVE_INFINITY;
      if (score < best) {
        best = score;
        current = key;
      }
    });
    if (!current) break;

    if (current === goalKey) {
      return reconstruct(cameFrom, current);
    }

    open.delete(current);
    const [row, col] = current.split(":").map(Number);

    for (const [dr, dc] of DIR4) {
      const nr = row + dr;
      const nc = col + dc;
      if (!isInside(rows, cols, nr, nc)) continue;
      const nCell = map[nr][nc];
      if (!isPassableCellType(nCell.type)) continue;
      const stepCost = getStepCost({ x: col, y: row }, { x: nc, y: nr }, nCell);
      if (!Number.isFinite(stepCost) || stepCost <= 0) continue;

      const nKey = cellKey(nr, nc);
      const tentative = (gScore.get(current) ?? Number.POSITIVE_INFINITY) + stepCost;
      if (tentative >= (gScore.get(nKey) ?? Number.POSITIVE_INFINITY)) continue;

      cameFrom.set(nKey, current);
      gScore.set(nKey, tentative);
      fScore.set(nKey, tentative + heuristic({ x: nc, y: nr }, goal));
      open.add(nKey);
    }
  }

  return [];
}

export function findPathBfs(map: MapCell[][], start: Vec2, goal: Vec2): Vec2[] {
  const rows = map.length;
  const cols = map[0]?.length ?? 0;
  if (!rows || !cols) return [];

  const sKey = cellKey(start.y, start.x);
  const gKey = cellKey(goal.y, goal.x);
  const queue: Array<{ row: number; col: number }> = [{ row: start.y, col: start.x }];
  const seen = new Set<string>([sKey]);
  const cameFrom = new Map<string, string>();

  while (queue.length > 0) {
    const cur = queue.shift();
    if (!cur) break;
    const curKey = cellKey(cur.row, cur.col);
    if (curKey === gKey) return reconstruct(cameFrom, curKey);

    for (const [dr, dc] of DIR4) {
      const nr = cur.row + dr;
      const nc = cur.col + dc;
      if (!isInside(rows, cols, nr, nc)) continue;
      const nKey = cellKey(nr, nc);
      if (seen.has(nKey)) continue;
      const nCell = map[nr][nc];
      if (!isPassableCellType(nCell.type)) continue;
      seen.add(nKey);
      cameFrom.set(nKey, curKey);
      queue.push({ row: nr, col: nc });
    }
  }

  return [];
}

export function reachableSetBfs(map: MapCell[][], start: Vec2): Set<string> {
  const rows = map.length;
  const cols = map[0]?.length ?? 0;
  const set = new Set<string>();
  if (!rows || !cols) return set;

  const queue: Array<{ row: number; col: number }> = [{ row: start.y, col: start.x }];
  const sKey = cellKey(start.y, start.x);
  set.add(sKey);

  while (queue.length > 0) {
    const cur = queue.shift();
    if (!cur) break;
    for (const [dr, dc] of DIR4) {
      const nr = cur.row + dr;
      const nc = cur.col + dc;
      if (!isInside(rows, cols, nr, nc)) continue;
      const k = cellKey(nr, nc);
      if (set.has(k)) continue;
      const cell = map[nr][nc];
      if (!isPassableCellType(cell.type)) continue;
      set.add(k);
      queue.push({ row: nr, col: nc });
    }
  }

  return set;
}

export function shortestPathDistanceBfs(
  map: MapCell[][],
  start: Vec2,
  goal: Vec2,
  extraPassableKey?: string,
): number | null {
  const rows = map.length;
  const cols = map[0]?.length ?? 0;
  if (!rows || !cols) return null;

  const sKey = cellKey(start.y, start.x);
  const gKey = cellKey(goal.y, goal.x);
  const queue: Array<{ row: number; col: number; dist: number }> = [{ row: start.y, col: start.x, dist: 0 }];
  const seen = new Set<string>([sKey]);

  while (queue.length > 0) {
    const cur = queue.shift();
    if (!cur) break;
    const curKey = cellKey(cur.row, cur.col);
    if (curKey === gKey) return cur.dist;

    for (const [dr, dc] of DIR4) {
      const nr = cur.row + dr;
      const nc = cur.col + dc;
      if (!isInside(rows, cols, nr, nc)) continue;
      const nKey = cellKey(nr, nc);
      if (seen.has(nKey)) continue;
      const nCell = map[nr][nc];
      const passable = nKey === extraPassableKey || isPassableCellType(nCell.type);
      if (!passable) continue;
      seen.add(nKey);
      queue.push({ row: nr, col: nc, dist: cur.dist + 1 });
    }
  }

  return null;
}
