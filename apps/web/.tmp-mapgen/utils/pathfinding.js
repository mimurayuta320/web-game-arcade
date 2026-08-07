"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findPathAStar = findPathAStar;
exports.findPathAStarWithCost = findPathAStarWithCost;
exports.findPathBfs = findPathBfs;
exports.reachableSetBfs = reachableSetBfs;
exports.shortestPathDistanceBfs = shortestPathDistanceBfs;
const grid_1 = require("./grid");
const DIR4 = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
];
function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
function reconstruct(cameFrom, currentKey) {
    const path = [];
    let cursor = currentKey;
    while (cursor) {
        const [r, c] = cursor.split(":").map(Number);
        path.push({ x: c, y: r });
        cursor = cameFrom.get(cursor);
    }
    return path.reverse();
}
function findPathAStar(map, start, goal) {
    const rows = map.length;
    const cols = map[0]?.length ?? 0;
    if (!rows || !cols)
        return [];
    const startKey = (0, grid_1.cellKey)(start.y, start.x);
    const goalKey = (0, grid_1.cellKey)(goal.y, goal.x);
    const open = new Set([startKey]);
    const cameFrom = new Map();
    const gScore = new Map([[startKey, 0]]);
    const fScore = new Map([[startKey, heuristic(start, goal)]]);
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
        if (!current)
            break;
        if (current === goalKey) {
            return reconstruct(cameFrom, current);
        }
        open.delete(current);
        const [row, col] = current.split(":").map(Number);
        for (const [dr, dc] of DIR4) {
            const nr = row + dr;
            const nc = col + dc;
            if (!(0, grid_1.isInside)(rows, cols, nr, nc))
                continue;
            const nCell = map[nr][nc];
            if (!(0, grid_1.isPassableCellType)(nCell.type))
                continue;
            const nKey = (0, grid_1.cellKey)(nr, nc);
            const tentative = (gScore.get(current) ?? Number.POSITIVE_INFINITY) + 1;
            if (tentative >= (gScore.get(nKey) ?? Number.POSITIVE_INFINITY))
                continue;
            cameFrom.set(nKey, current);
            gScore.set(nKey, tentative);
            fScore.set(nKey, tentative + heuristic({ x: nc, y: nr }, goal));
            open.add(nKey);
        }
    }
    return [];
}
function findPathAStarWithCost(map, start, goal, getStepCost) {
    const rows = map.length;
    const cols = map[0]?.length ?? 0;
    if (!rows || !cols)
        return [];
    const startKey = (0, grid_1.cellKey)(start.y, start.x);
    const goalKey = (0, grid_1.cellKey)(goal.y, goal.x);
    const open = new Set([startKey]);
    const cameFrom = new Map();
    const gScore = new Map([[startKey, 0]]);
    const fScore = new Map([[startKey, heuristic(start, goal)]]);
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
        if (!current)
            break;
        if (current === goalKey) {
            return reconstruct(cameFrom, current);
        }
        open.delete(current);
        const [row, col] = current.split(":").map(Number);
        for (const [dr, dc] of DIR4) {
            const nr = row + dr;
            const nc = col + dc;
            if (!(0, grid_1.isInside)(rows, cols, nr, nc))
                continue;
            const nCell = map[nr][nc];
            if (!(0, grid_1.isPassableCellType)(nCell.type))
                continue;
            const stepCost = getStepCost({ x: col, y: row }, { x: nc, y: nr }, nCell);
            if (!Number.isFinite(stepCost) || stepCost <= 0)
                continue;
            const nKey = (0, grid_1.cellKey)(nr, nc);
            const tentative = (gScore.get(current) ?? Number.POSITIVE_INFINITY) + stepCost;
            if (tentative >= (gScore.get(nKey) ?? Number.POSITIVE_INFINITY))
                continue;
            cameFrom.set(nKey, current);
            gScore.set(nKey, tentative);
            fScore.set(nKey, tentative + heuristic({ x: nc, y: nr }, goal));
            open.add(nKey);
        }
    }
    return [];
}
function findPathBfs(map, start, goal) {
    const rows = map.length;
    const cols = map[0]?.length ?? 0;
    if (!rows || !cols)
        return [];
    const sKey = (0, grid_1.cellKey)(start.y, start.x);
    const gKey = (0, grid_1.cellKey)(goal.y, goal.x);
    const queue = [{ row: start.y, col: start.x }];
    const seen = new Set([sKey]);
    const cameFrom = new Map();
    while (queue.length > 0) {
        const cur = queue.shift();
        if (!cur)
            break;
        const curKey = (0, grid_1.cellKey)(cur.row, cur.col);
        if (curKey === gKey)
            return reconstruct(cameFrom, curKey);
        for (const [dr, dc] of DIR4) {
            const nr = cur.row + dr;
            const nc = cur.col + dc;
            if (!(0, grid_1.isInside)(rows, cols, nr, nc))
                continue;
            const nKey = (0, grid_1.cellKey)(nr, nc);
            if (seen.has(nKey))
                continue;
            const nCell = map[nr][nc];
            if (!(0, grid_1.isPassableCellType)(nCell.type))
                continue;
            seen.add(nKey);
            cameFrom.set(nKey, curKey);
            queue.push({ row: nr, col: nc });
        }
    }
    return [];
}
function reachableSetBfs(map, start) {
    const rows = map.length;
    const cols = map[0]?.length ?? 0;
    const set = new Set();
    if (!rows || !cols)
        return set;
    const queue = [{ row: start.y, col: start.x }];
    const sKey = (0, grid_1.cellKey)(start.y, start.x);
    set.add(sKey);
    while (queue.length > 0) {
        const cur = queue.shift();
        if (!cur)
            break;
        for (const [dr, dc] of DIR4) {
            const nr = cur.row + dr;
            const nc = cur.col + dc;
            if (!(0, grid_1.isInside)(rows, cols, nr, nc))
                continue;
            const k = (0, grid_1.cellKey)(nr, nc);
            if (set.has(k))
                continue;
            const cell = map[nr][nc];
            if (!(0, grid_1.isPassableCellType)(cell.type))
                continue;
            set.add(k);
            queue.push({ row: nr, col: nc });
        }
    }
    return set;
}
function shortestPathDistanceBfs(map, start, goal, extraPassableKey) {
    const rows = map.length;
    const cols = map[0]?.length ?? 0;
    if (!rows || !cols)
        return null;
    const sKey = (0, grid_1.cellKey)(start.y, start.x);
    const gKey = (0, grid_1.cellKey)(goal.y, goal.x);
    const queue = [{ row: start.y, col: start.x, dist: 0 }];
    const seen = new Set([sKey]);
    while (queue.length > 0) {
        const cur = queue.shift();
        if (!cur)
            break;
        const curKey = (0, grid_1.cellKey)(cur.row, cur.col);
        if (curKey === gKey)
            return cur.dist;
        for (const [dr, dc] of DIR4) {
            const nr = cur.row + dr;
            const nc = cur.col + dc;
            if (!(0, grid_1.isInside)(rows, cols, nr, nc))
                continue;
            const nKey = (0, grid_1.cellKey)(nr, nc);
            if (seen.has(nKey))
                continue;
            const nCell = map[nr][nc];
            const passable = nKey === extraPassableKey || (0, grid_1.isPassableCellType)(nCell.type);
            if (!passable)
                continue;
            seen.add(nKey);
            queue.push({ row: nr, col: nc, dist: cur.dist + 1 });
        }
    }
    return null;
}
