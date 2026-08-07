"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateOpenRatio = calculateOpenRatio;
exports.validateGeneratedMap = validateGeneratedMap;
exports.generateLabyrinthMap = generateLabyrinthMap;
const balance_1 = require("../data/balance");
const grid_1 = require("../utils/grid");
const pathfinding_1 = require("../utils/pathfinding");
const random_1 = require("../utils/random");
const INITIAL_OPEN_RATIO_MIN = 0.05;
const INITIAL_OPEN_RATIO_MAX = 0.08;
const INITIAL_OPEN_RATIO_HARD_MAX = 0.1;
const MIN_INITIAL_PATH_TURNS = 2;
const MAX_INITIAL_PATH_TURNS = 4;
const MIN_INITIAL_PATH_LENGTH = 18;
const SOIL_RATIOS = [
    { type: "magicSoil", ratio: 0.09 },
    { type: "moistSoil", ratio: 0.08 },
    { type: "mineralSoil", ratio: 0.07 },
    { type: "toxicSoil", ratio: 0.06 },
];
function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}
function makeVariant(seed, row, col) {
    const h = (0, random_1.hash2d)(seed, row, col);
    return {
        crackType: h % 4,
        edgeType: (h >>> 4) % 4,
        brightness: ((h >>> 8) % 21) - 10,
        decorationType: (h >>> 13) % 5,
    };
}
function makeCell(seed, row, col, type) {
    return {
        row,
        col,
        type,
        baseType: type,
        hp: 1,
        maxHp: 1,
        digging: false,
        digProgress: 0,
        tileVariant: makeVariant(seed, row, col),
    };
}
function createFilledMap(seed) {
    const map = [];
    for (let row = 0; row < balance_1.GRID_ROWS; row += 1) {
        const r = [];
        for (let col = 0; col < balance_1.GRID_COLS; col += 1) {
            const edge = row === 0 || row === balance_1.GRID_ROWS - 1 || col === 0 || col === balance_1.GRID_COLS - 1;
            r.push(makeCell(seed, row, col, edge ? "hardRock" : "normalSoil"));
        }
        map.push(r);
    }
    return map;
}
function isDiggableSoil(type) {
    return (type === "normalSoil" ||
        type === "magicSoil" ||
        type === "moistSoil" ||
        type === "mineralSoil" ||
        type === "toxicSoil");
}
function carveCell(map, row, col) {
    if (!(0, grid_1.isInside)(balance_1.GRID_ROWS, balance_1.GRID_COLS, row, col))
        return false;
    if (row === 0 || row === balance_1.GRID_ROWS - 1 || col === 0 || col === balance_1.GRID_COLS - 1)
        return false;
    map[row][col].type = "empty";
    map[row][col].baseType = "empty";
    return true;
}
function carveStraight(map, from, to, out) {
    if (from.x !== to.x && from.y !== to.y)
        return;
    const stepX = Math.sign(to.x - from.x);
    const stepY = Math.sign(to.y - from.y);
    let x = from.x;
    let y = from.y;
    while (true) {
        if (carveCell(map, y, x))
            out.push({ x, y });
        if (x === to.x && y === to.y)
            break;
        x += stepX;
        y += stepY;
    }
}
function countTurns(path) {
    if (path.length < 3)
        return 0;
    let turns = 0;
    let prevDx = path[1].x - path[0].x;
    let prevDy = path[1].y - path[0].y;
    for (let i = 2; i < path.length; i += 1) {
        const dx = path[i].x - path[i - 1].x;
        const dy = path[i].y - path[i - 1].y;
        if (dx !== prevDx || dy !== prevDy)
            turns += 1;
        prevDx = dx;
        prevDy = dy;
    }
    return turns;
}
function calculateDegrees(map, cells) {
    let branchCount = 0;
    let deadEndCount = 0;
    for (const key of cells) {
        const [rowStr, colStr] = key.split(":");
        const row = Number(rowStr);
        const col = Number(colStr);
        let degree = 0;
        const n4 = [
            [row - 1, col],
            [row + 1, col],
            [row, col - 1],
            [row, col + 1],
        ];
        for (const [nr, nc] of n4) {
            if (!(0, grid_1.isInside)(balance_1.GRID_ROWS, balance_1.GRID_COLS, nr, nc))
                continue;
            if ((0, grid_1.isPassableCellType)(map[nr][nc].type))
                degree += 1;
        }
        if (degree >= 3)
            branchCount += 1;
        if (degree === 1)
            deadEndCount += 1;
    }
    return { branchCount, deadEndCount };
}
function reachableFrom(map, start) {
    const reached = new Set();
    const queue = [{ x: start.x, y: start.y }];
    reached.add((0, grid_1.cellKey)(start.y, start.x));
    while (queue.length > 0) {
        const cur = queue.shift();
        if (!cur)
            break;
        const n4 = [
            { x: cur.x + 1, y: cur.y },
            { x: cur.x - 1, y: cur.y },
            { x: cur.x, y: cur.y + 1 },
            { x: cur.x, y: cur.y - 1 },
        ];
        for (const n of n4) {
            if (!(0, grid_1.isInside)(balance_1.GRID_ROWS, balance_1.GRID_COLS, n.y, n.x))
                continue;
            const key = (0, grid_1.cellKey)(n.y, n.x);
            if (reached.has(key))
                continue;
            if (!(0, grid_1.isPassableCellType)(map[n.y][n.x].type))
                continue;
            reached.add(key);
            queue.push(n);
        }
    }
    return reached;
}
function countCoreCandidates(map, entrance, reachable) {
    let count = 0;
    const queue = [{ p: entrance, dist: 0 }];
    const seen = new Set([(0, grid_1.cellKey)(entrance.y, entrance.x)]);
    const distMap = new Map([[(0, grid_1.cellKey)(entrance.y, entrance.x), 0]]);
    while (queue.length > 0) {
        const cur = queue.shift();
        if (!cur)
            break;
        const n4 = [
            { x: cur.p.x + 1, y: cur.p.y },
            { x: cur.p.x - 1, y: cur.p.y },
            { x: cur.p.x, y: cur.p.y + 1 },
            { x: cur.p.x, y: cur.p.y - 1 },
        ];
        for (const n of n4) {
            if (!(0, grid_1.isInside)(map.length, map[0]?.length ?? 0, n.y, n.x))
                continue;
            const key = (0, grid_1.cellKey)(n.y, n.x);
            if (seen.has(key))
                continue;
            if (!(0, grid_1.isPassableCellType)(map[n.y][n.x].type))
                continue;
            seen.add(key);
            distMap.set(key, cur.dist + 1);
            queue.push({ p: n, dist: cur.dist + 1 });
        }
    }
    for (let r = 1; r < map.length - 1; r += 1) {
        for (let c = 1; c < map[r].length - 1; c += 1) {
            const key = (0, grid_1.cellKey)(r, c);
            if (!reachable.has(key))
                continue;
            if (map[r][c].type !== "empty")
                continue;
            if (r === entrance.y && c === entrance.x)
                continue;
            const dist = distMap.get(key);
            if ((dist ?? -1) >= balance_1.MIN_CORE_PATH_DISTANCE)
                count += 1;
        }
    }
    return count;
}
function hasDiggableSoil(map) {
    for (let r = 1; r < map.length - 1; r += 1) {
        for (let c = 1; c < map[r].length - 1; c += 1) {
            if (!isDiggableSoil(map[r][c].type))
                continue;
            const n4 = [map[r - 1][c], map[r + 1][c], map[r][c - 1], map[r][c + 1]];
            if (n4.some((n) => (0, grid_1.isPassableCellType)(n.type)))
                return true;
        }
    }
    return false;
}
function hasDiggableNeighbor(map, p) {
    const n4 = [
        { x: p.x + 1, y: p.y },
        { x: p.x - 1, y: p.y },
        { x: p.x, y: p.y + 1 },
        { x: p.x, y: p.y - 1 },
    ];
    for (const n of n4) {
        if (!(0, grid_1.isInside)(balance_1.GRID_ROWS, balance_1.GRID_COLS, n.y, n.x))
            continue;
        if (isDiggableSoil(map[n.y][n.x].type))
            return true;
    }
    return false;
}
function countOpenCells(map) {
    let count = 0;
    for (let r = 0; r < balance_1.GRID_ROWS; r += 1) {
        for (let c = 0; c < balance_1.GRID_COLS; c += 1) {
            const type = map[r][c].type;
            if (type === "empty" || type === "entrance")
                count += 1;
        }
    }
    return count;
}
function calculateOpenRatio(map) {
    const open = countOpenCells(map);
    return open / (balance_1.GRID_ROWS * balance_1.GRID_COLS);
}
function listNormalSoilCells(map) {
    const cells = [];
    for (let r = 1; r < balance_1.GRID_ROWS - 1; r += 1) {
        for (let c = 1; c < balance_1.GRID_COLS - 1; c += 1) {
            if (map[r][c].type === "normalSoil")
                cells.push({ x: c, y: r });
        }
    }
    return cells;
}
function applySpecialSoils(map, seed) {
    const rng = new random_1.SeededRandom(seed ^ 0x9e3779b9);
    const soilTotal = listNormalSoilCells(map).length;
    for (const cfg of SOIL_RATIOS) {
        let remaining = Math.floor(soilTotal * cfg.ratio);
        let attempts = 0;
        while (remaining > 0 && attempts < soilTotal * 3) {
            attempts += 1;
            const normalCells = listNormalSoilCells(map);
            if (normalCells.length === 0)
                break;
            const start = rng.pick(normalCells);
            const clusterTarget = clamp(rng.int(2, 7), 1, remaining);
            const queue = [start];
            const seen = new Set();
            let placed = 0;
            while (queue.length > 0 && placed < clusterTarget) {
                const cur = queue.shift();
                if (!cur)
                    break;
                const key = (0, grid_1.cellKey)(cur.y, cur.x);
                if (seen.has(key))
                    continue;
                seen.add(key);
                if (!(0, grid_1.isInside)(balance_1.GRID_ROWS, balance_1.GRID_COLS, cur.y, cur.x))
                    continue;
                if (map[cur.y][cur.x].type !== "normalSoil")
                    continue;
                map[cur.y][cur.x].type = cfg.type;
                map[cur.y][cur.x].baseType = cfg.type;
                placed += 1;
                const next = [
                    { x: cur.x + 1, y: cur.y },
                    { x: cur.x - 1, y: cur.y },
                    { x: cur.x, y: cur.y + 1 },
                    { x: cur.x, y: cur.y - 1 },
                ];
                for (const n of next) {
                    if (!(0, grid_1.isInside)(balance_1.GRID_ROWS, balance_1.GRID_COLS, n.y, n.x))
                        continue;
                    if (map[n.y][n.x].type !== "normalSoil")
                        continue;
                    if (rng.next() < 0.8)
                        queue.push(n);
                }
            }
            if (placed <= 0)
                continue;
            remaining -= placed;
        }
    }
}
function horizontalPivotCandidates(startX, endX) {
    const out = [];
    for (let x = 2; x <= balance_1.GRID_COLS - 3; x += 1) {
        const a = Math.abs(x - startX);
        const b = Math.abs(endX - x);
        if (a >= 2 && a <= 5 && b >= 2 && b <= 5 && x !== startX && x !== endX) {
            out.push(x);
        }
    }
    return out;
}
function buildInitialPolyline(entranceInner, playerStart, turnTarget, rng) {
    const sy = entranceInner.y;
    const ey = playerStart.y;
    if (ey - sy < 10)
        return null;
    if (turnTarget === 2) {
        const minRow = sy + 4;
        const maxRow = ey - 4;
        if (minRow >= maxRow)
            return null;
        const rowA = rng.int(minRow, maxRow);
        return [
            entranceInner,
            { x: entranceInner.x, y: rowA },
            { x: playerStart.x, y: rowA },
            playerStart,
        ];
    }
    if (turnTarget === 3) {
        const minRow = sy + 3;
        const maxRow = ey - 4;
        if (minRow >= maxRow)
            return null;
        const rowA = rng.int(minRow, maxRow);
        const pivots = horizontalPivotCandidates(entranceInner.x, playerStart.x);
        if (pivots.length === 0)
            return null;
        const x1 = rng.pick(pivots);
        return [
            entranceInner,
            { x: entranceInner.x, y: rowA },
            { x: x1, y: rowA },
            { x: x1, y: ey },
            playerStart,
        ];
    }
    const rowAMin = sy + 3;
    const rowAMax = ey - 7;
    if (rowAMin >= rowAMax)
        return null;
    const rowA = rng.int(rowAMin, rowAMax);
    const rowBMin = rowA + 3;
    const rowBMax = ey - 3;
    if (rowBMin >= rowBMax)
        return null;
    const rowB = rng.int(rowBMin, rowBMax);
    const pivots = horizontalPivotCandidates(entranceInner.x, playerStart.x);
    if (pivots.length === 0)
        return null;
    const x1 = rng.pick(pivots);
    return [
        entranceInner,
        { x: entranceInner.x, y: rowA },
        { x: x1, y: rowA },
        { x: x1, y: rowB },
        { x: playerStart.x, y: rowB },
        playerStart,
    ];
}
function carvePolyline(map, points) {
    const cells = [];
    for (let i = 1; i < points.length; i += 1) {
        carveStraight(map, points[i - 1], points[i], cells);
    }
    const unique = [];
    const seen = new Set();
    for (const p of cells) {
        const key = (0, grid_1.cellKey)(p.y, p.x);
        if (seen.has(key))
            continue;
        seen.add(key);
        unique.push(p);
    }
    return unique;
}
function carveConnectedSpur(map, path, rng) {
    if (path.length < 12)
        return;
    const anchorIndex = clamp(rng.int(Math.floor(path.length * 0.35), Math.floor(path.length * 0.7)), 1, path.length - 2);
    const anchor = path[anchorIndex];
    const prev = path[anchorIndex - 1];
    const pathDirVertical = prev.x === anchor.x;
    const dirs = pathDirVertical
        ? [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
        ]
        : [
            { x: 0, y: 1 },
            { x: 0, y: -1 },
        ];
    const dir = rng.pick(dirs);
    const len = rng.int(3, 5);
    for (let i = 1; i <= len; i += 1) {
        const x = anchor.x + dir.x * i;
        const y = anchor.y + dir.y * i;
        if (!(0, grid_1.isInside)(balance_1.GRID_ROWS, balance_1.GRID_COLS, y, x))
            break;
        if (x <= 0 || x >= balance_1.GRID_COLS - 1 || y <= 0 || y >= balance_1.GRID_ROWS - 1)
            break;
        carveCell(map, y, x);
    }
}
function pickPlayerStartX(entranceX, rng) {
    const offset = rng.int(3, 8);
    const sign = rng.next() < 0.5 ? -1 : 1;
    let x = entranceX + sign * offset;
    if (x < 3 || x > balance_1.GRID_COLS - 4)
        x = entranceX - sign * offset;
    return clamp(x, 3, balance_1.GRID_COLS - 4);
}
function validateDegrees(map, path, entrance, playerStart) {
    const pathKeys = new Set(path.map((p) => (0, grid_1.cellKey)(p.y, p.x)));
    const filtered = new Set();
    for (const key of pathKeys) {
        if (key === (0, grid_1.cellKey)(entrance.y, entrance.x))
            continue;
        if (key === (0, grid_1.cellKey)(playerStart.y, playerStart.x))
            continue;
        filtered.add(key);
    }
    const { branchCount, deadEndCount } = calculateDegrees(map, filtered);
    const reasons = [];
    if (branchCount > 3)
        reasons.push("初期分岐が多すぎます");
    if (deadEndCount > 2)
        reasons.push("初期行き止まりが多すぎます");
    return reasons;
}
function carveEntrancePocket(map, entranceInner, rng) {
    const side = rng.next() < 0.5 ? -1 : 1;
    carveCell(map, entranceInner.y + 1, entranceInner.x);
    carveCell(map, entranceInner.y + 1, entranceInner.x + side);
    carveCell(map, entranceInner.y + 2, entranceInner.x + side);
    carveCell(map, entranceInner.y + 2, entranceInner.x);
}
function carvePlayerPocket(map, playerStart, rng) {
    const side = rng.next() < 0.5 ? -1 : 1;
    carveCell(map, playerStart.y, playerStart.x + side);
    carveCell(map, playerStart.y - 1, playerStart.x);
    carveCell(map, playerStart.y - 1, playerStart.x + side);
    carveCell(map, playerStart.y + 1, playerStart.x);
    carveCell(map, playerStart.y + 1, playerStart.x + side);
    const tunnelLen = rng.int(4, 6);
    for (let i = 2; i <= tunnelLen; i += 1) {
        carveCell(map, playerStart.y, playerStart.x + side * i);
    }
}
function validateGeneratedMap(map, entrance, playerArea) {
    const reasons = [];
    const playerStart = playerArea[0] ?? entrance;
    const bestPath = (0, pathfinding_1.findPathBfs)(map, entrance, playerStart);
    if (bestPath.length === 0)
        reasons.push("入口からプレイヤー初期位置へ到達できません");
    const pathLength = bestPath.length > 0 ? bestPath.length - 1 : 0;
    if (pathLength < MIN_INITIAL_PATH_LENGTH)
        reasons.push("入口から初期位置までの最短経路が短すぎます");
    const turnCount = countTurns(bestPath);
    if (turnCount < MIN_INITIAL_PATH_TURNS || turnCount > MAX_INITIAL_PATH_TURNS) {
        reasons.push("初期通路の曲がり回数が範囲外です");
    }
    if (bestPath.length > 0) {
        const straight = bestPath.every((p) => p.x === bestPath[0].x) || bestPath.every((p) => p.y === bestPath[0].y);
        if (straight)
            reasons.push("初期通路が直線すぎます");
    }
    for (const p of bestPath) {
        if (map[p.y]?.[p.x]?.type === "hardRock") {
            reasons.push("経路上にhardRockがあります");
            break;
        }
    }
    const openRatio = calculateOpenRatio(map);
    if (openRatio > INITIAL_OPEN_RATIO_HARD_MAX)
        reasons.push("初期開通率が10%を超えています");
    if (openRatio < INITIAL_OPEN_RATIO_MIN && pathLength < MIN_INITIAL_PATH_LENGTH + 2) {
        reasons.push("初期通路が短すぎます");
    }
    if (map[entrance.y]?.[entrance.x]?.type !== "entrance") {
        reasons.push("入口セルが不正です");
    }
    const reachable = reachableFrom(map, entrance);
    let passableCount = 0;
    for (let r = 0; r < balance_1.GRID_ROWS; r += 1) {
        for (let c = 0; c < balance_1.GRID_COLS; c += 1) {
            if ((0, grid_1.isPassableCellType)(map[r][c].type))
                passableCount += 1;
        }
    }
    if (reachable.size !== passableCount) {
        reasons.push("孤立した空洞があります");
    }
    reasons.push(...validateDegrees(map, bestPath, entrance, playerStart));
    if (!hasDiggableNeighbor(map, playerStart)) {
        reasons.push("プレイヤー初期位置の隣に掘れる土がありません");
    }
    const coreCandidateCount = countCoreCandidates(map, entrance, reachable);
    if (coreCandidateCount <= 0)
        reasons.push("魔界核の配置候補がありません");
    if (!hasDiggableSoil(map))
        reasons.push("掘削可能な土がありません");
    return {
        valid: reasons.length === 0,
        path: bestPath,
        pathLength,
        turnCount,
        coreCandidateCount,
        reasons,
    };
}
function generateCandidate(seed) {
    const rng = new random_1.SeededRandom(seed);
    const map = createFilledMap(seed);
    const entrance = { x: rng.int(4, balance_1.GRID_COLS - 5), y: 0 };
    map[entrance.y][entrance.x] = makeCell(seed, entrance.y, entrance.x, "entrance");
    const playerStart = {
        x: pickPlayerStartX(entrance.x, rng),
        y: rng.int(Math.floor(balance_1.GRID_ROWS * 0.6), Math.floor(balance_1.GRID_ROWS * 0.8)),
    };
    const entryInner = { x: entrance.x, y: 1 };
    carveCell(map, entryInner.y, entryInner.x);
    const turnTarget = rng.int(MIN_INITIAL_PATH_TURNS, MAX_INITIAL_PATH_TURNS);
    const points = buildInitialPolyline(entryInner, playerStart, turnTarget, rng);
    if (points) {
        const mainPath = carvePolyline(map, points);
        carveEntrancePocket(map, entryInner, rng);
        carvePlayerPocket(map, playerStart, rng);
        if (mainPath.length > 0) {
            carveConnectedSpur(map, mainPath, rng);
        }
    }
    carveCell(map, playerStart.y, playerStart.x);
    applySpecialSoils(map, seed);
    const playerArea = [playerStart];
    const validation = validateGeneratedMap(map, entrance, playerArea);
    if (validation.path.length > 0) {
        const ratio = calculateOpenRatio(map);
        if (ratio > INITIAL_OPEN_RATIO_MAX) {
            validation.valid = false;
            validation.reasons.push("開通率が推奨値を超えています");
        }
    }
    return { map, entrance, playerArea, playerStart, seed, validation };
}
function generateFallback(seed) {
    const map = createFilledMap(seed);
    const entrance = { x: clamp(Math.floor(balance_1.GRID_COLS * 0.32), 4, balance_1.GRID_COLS - 5), y: 0 };
    map[0][entrance.x] = makeCell(seed, 0, entrance.x, "entrance");
    const playerStart = {
        x: clamp(entrance.x + 6, 3, balance_1.GRID_COLS - 4),
        y: clamp(Math.floor(balance_1.GRID_ROWS * 0.75), 12, balance_1.GRID_ROWS - 3),
    };
    const fallbackPath = [
        { x: entrance.x, y: 1 },
        { x: entrance.x, y: 6 },
        { x: entrance.x + 4, y: 6 },
        { x: entrance.x + 4, y: 12 },
        { x: playerStart.x, y: 12 },
        playerStart,
    ];
    carvePolyline(map, fallbackPath);
    carveCell(map, playerStart.y, playerStart.x);
    carveEntrancePocket(map, { x: entrance.x, y: 1 }, new random_1.SeededRandom(seed + 11));
    carvePlayerPocket(map, playerStart, new random_1.SeededRandom(seed + 17));
    carveConnectedSpur(map, fallbackPath, new random_1.SeededRandom(seed + 23));
    applySpecialSoils(map, seed + 97);
    const playerArea = [playerStart];
    const validation = validateGeneratedMap(map, entrance, playerArea);
    return { map, entrance, playerArea, playerStart, seed, validation };
}
function generateLabyrinthMap(seed) {
    for (let i = 0; i < 20; i += 1) {
        const candidate = generateCandidate(seed + i * 7919);
        if (candidate.validation.valid)
            return candidate;
    }
    return generateFallback(seed + 131071);
}
