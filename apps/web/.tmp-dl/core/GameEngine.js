"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameEngine = void 0;
const balance_1 = require("../data/balance");
const materials_1 = require("../data/materials");
const invaders_1 = require("../data/invaders");
const monsters_1 = require("../data/monsters");
const BattleSystem_1 = require("../systems/BattleSystem");
const CorePlacementSystem_1 = require("../systems/CorePlacementSystem");
const DigSystem_1 = require("../systems/DigSystem");
const MapGenerationSystem_1 = require("../systems/MapGenerationSystem");
const MovementSystem_1 = require("../systems/MovementSystem");
const ResourceSystem_1 = require("../systems/ResourceSystem");
const SpawnSystem_1 = require("../systems/SpawnSystem");
const WaveSystem_1 = require("../systems/WaveSystem");
const grid_1 = require("../utils/grid");
const pathfinding_1 = require("../utils/pathfinding");
const random_1 = require("../utils/random");
const DIRECTIONS4 = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
];
function bresenhamLine(a, b) {
    const points = [];
    let x0 = a.x;
    let y0 = a.y;
    const x1 = b.x;
    const y1 = b.y;
    const dx = Math.abs(x1 - x0);
    const sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0);
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    while (true) {
        points.push({ x: x0, y: y0 });
        if (x0 === x1 && y0 === y1)
            break;
        const e2 = 2 * err;
        if (e2 >= dy) {
            err += dy;
            x0 += sx;
        }
        if (e2 <= dx) {
            err += dx;
            y0 += sy;
        }
    }
    return points;
}
function directionFromDelta(dx, dy, fallback) {
    if (Math.abs(dx) > Math.abs(dy))
        return dx > 0 ? "right" : "left";
    if (Math.abs(dy) > 0)
        return dy > 0 ? "down" : "up";
    return fallback;
}
function invaderCell(invader) {
    return {
        x: Math.floor(invader.position.x),
        y: Math.floor(invader.position.y),
    };
}
function cellCenter(cell) {
    return { x: cell.x + 0.5, y: cell.y + 0.5 };
}
class GameEngine {
    constructor(seed) {
        this.mapVersion = 1;
        this.digTasks = new Map();
        this.lastHudEmitMs = 0;
        this.hudSubscribers = new Set();
        this.dragVisited = new Set();
        this.lastDragCell = null;
        this.queuedInWave = 0;
        this.messageStamp = 0;
        this.toastSerial = 0;
        this.effectSerial = 0;
        this.corePlaceableKeys = new Set();
        this.invaderSerial = 0;
        this.placementProcessing = false;
        this.phaseBeforePause = null;
        const chosenSeed = seed ?? ((Date.now() ^ (0, random_1.randomInt)(1, 0x7fffffff)) >>> 0);
        const generated = (0, MapGenerationSystem_1.generateLabyrinthMap)(chosenSeed);
        this.state = {
            phase: "preparation",
            timeSec: 0,
            mapSeed: generated.seed,
            mapVersion: 1,
            map: generated.map,
            entrancePosition: generated.entrance,
            playerStartPosition: generated.playerStart,
            playerAreaCells: generated.playerArea,
            materials: { ...materials_1.INITIAL_MATERIALS },
            maxDigCount: balance_1.DIG_BALANCE.maxDigCount,
            remainingDigCount: balance_1.DIG_BALANCE.maxDigCount,
            totalDugCount: 0,
            currentMonsterCount: 0,
            maxMonsterCount: balance_1.SPAWN_BALANCE.maxMonsterCount,
            monsters: [],
            invaders: [],
            corePosition: null,
            selectedPlacementPosition: null,
            confirmedAllyPosition: null,
            isPlacementConfirmOpen: false,
            hasGameStarted: false,
            nests: [],
            traps: [],
            coreHp: 0,
            coreMaxHp: 0,
            score: 0,
            gameSpeed: 1,
            paused: false,
            wave: {
                wave: 1,
                maxWave: balance_1.WAVE_BALANCE.maxWave,
                remainingEnemiesInWave: 0,
                nextWaveInSec: balance_1.INITIAL_PREPARATION_TIME,
                spawnTimerSec: balance_1.WAVE_BALANCE.spawnEverySec,
            },
            stats: {
                totalDugCount: 0,
                killedInvaders: 0,
                spawnedMonsters: 0,
                collectedMaterials: 0,
            },
            message: generated.validation.valid
                ? `seed ${generated.seed} / map ok`
                : `seed ${generated.seed} / fallback map`,
            debugEnabled: false,
            corePlacementRetryCount: 0,
            waveCountdownSec: 0,
            toasts: [],
            spawnEffects: [],
        };
    }
    getRenderState() {
        return this.state;
    }
    getMapVersion() {
        return this.mapVersion;
    }
    isDebugEnabled() {
        return this.state.debugEnabled;
    }
    toggleDebug() {
        this.state.debugEnabled = !this.state.debugEnabled;
        this.emitHud(true);
    }
    getDebugOverlay() {
        const passable = new Set();
        for (let r = 0; r < balance_1.GRID_ROWS; r += 1) {
            for (let c = 0; c < balance_1.GRID_COLS; c += 1) {
                if ((0, grid_1.isPassableCellType)(this.state.map[r][c].type))
                    passable.add((0, grid_1.cellKey)(r, c));
            }
        }
        const reachable = (0, pathfinding_1.reachableSetBfs)(this.state.map, this.state.entrancePosition);
        const coreCandidateKeys = new Set((0, CorePlacementSystem_1.listPlaceableCoreCells)(this.state).map((p) => (0, grid_1.cellKey)(p.row, p.col)));
        return {
            enabled: this.state.debugEnabled,
            mapVersion: this.mapVersion,
            reachableKeys: reachable,
            passableKeys: passable,
            coreCandidateKeys,
            enemyPaths: this.state.invaders
                .filter((v) => v.state !== "dead")
                .map((v) => ({
                id: v.id,
                path: v.pathState.path,
                index: v.pathState.currentPathIndex,
                state: `${v.kind}/${v.state}/${v.direction}`,
            })),
        };
    }
    subscribeHud(handler) {
        this.hudSubscribers.add(handler);
        handler(this.getHudSnapshot());
        return () => this.hudSubscribers.delete(handler);
    }
    emitHud(force = false) {
        const now = typeof performance !== "undefined" ? performance.now() : Date.now();
        if (!force && now - this.lastHudEmitMs < balance_1.HUD_NOTIFY_INTERVAL_MS)
            return;
        this.lastHudEmitMs = now;
        const snap = this.getHudSnapshot();
        this.hudSubscribers.forEach((handler) => handler(snap));
    }
    getHudSnapshot() {
        return {
            phase: this.state.phase,
            remainingDigCount: this.state.remainingDigCount,
            maxDigCount: this.state.maxDigCount,
            currentMonsterCount: this.state.currentMonsterCount,
            maxMonsterCount: this.state.maxMonsterCount,
            enemyCount: this.state.invaders.filter((it) => it.state !== "dead").length,
            wave: this.state.wave.wave,
            maxWave: this.state.wave.maxWave,
            coreHp: this.state.coreHp,
            coreMaxHp: this.state.coreMaxHp,
            corePlaced: Boolean(this.state.corePosition),
            nextWaveInSec: Math.max(0, Math.ceil(this.state.wave.nextWaveInSec)),
            waveCountdownSec: Math.max(0, Math.ceil(this.state.waveCountdownSec)),
            paused: this.state.paused,
        };
    }
    getToasts() {
        return this.state.toasts;
    }
    getSpawnEffects() {
        return this.state.spawnEffects;
    }
    pushToast(text, ttlSec = 2.2) {
        this.toastSerial += 1;
        this.state.toasts.push({ id: `toast-${this.toastSerial}`, text, ttlSec });
    }
    pushSpawnEffect(row, col, monsterName) {
        this.effectSerial += 1;
        this.state.spawnEffects.push({
            id: `effect-${this.effectSerial}`,
            row,
            col,
            monsterName,
            elapsedSec: 0,
            durationSec: 0.55,
        });
    }
    updateUiEffects(dt) {
        this.state.toasts = this.state.toasts
            .map((toast) => ({ ...toast, ttlSec: toast.ttlSec - dt }))
            .filter((toast) => toast.ttlSec > 0);
        this.state.spawnEffects = this.state.spawnEffects
            .map((effect) => ({ ...effect, elapsedSec: effect.elapsedSec + dt }))
            .filter((effect) => effect.elapsedSec < effect.durationSec);
    }
    bumpMapVersion() {
        this.mapVersion += 1;
        this.state.mapVersion = this.mapVersion;
    }
    setGameSpeed(speed) {
        if (this.state.phase === "countdown" || this.state.phase === "placementConfirmation")
            return;
        this.state.gameSpeed = speed;
        this.emitHud(true);
    }
    setPaused(paused) {
        if (this.state.phase === "allyPlacement" || this.state.phase === "placementConfirmation" || this.state.phase === "countdown") {
            return;
        }
        if (paused) {
            if (!this.state.paused) {
                this.phaseBeforePause = this.state.phase;
                this.state.phase = "paused";
                this.state.paused = true;
            }
        }
        else {
            if (this.state.paused) {
                this.state.phase = this.phaseBeforePause ?? "wave";
                this.phaseBeforePause = null;
                this.state.paused = false;
            }
        }
        this.emitHud(true);
    }
    togglePause() {
        this.setPaused(!this.state.paused);
    }
    setMessage(msg) {
        const now = Date.now();
        if (this.state.message === msg && now - this.messageStamp < 800)
            return;
        this.state.message = msg;
        this.messageStamp = now;
    }
    canDigNow() {
        return this.state.phase === "preparation" || this.state.phase === "wave" || this.state.phase === "waveResult";
    }
    consumeDigCount() {
        if (this.state.remainingDigCount <= 0) {
            this.setMessage("掘削回数が残っていません");
            return false;
        }
        return true;
    }
    queueDig(row, col) {
        if (!this.canDigNow()) {
            this.setMessage("掘削は一時停止中です");
            return false;
        }
        if (!this.consumeDigCount())
            return false;
        if (!(0, DigSystem_1.canDigCell)(row, col, this.state.map, this.state.remainingDigCount)) {
            this.setMessage("掘削済みの空間に隣接する土だけ掘れます");
            return false;
        }
        const key = (0, grid_1.cellKey)(row, col);
        if (this.digTasks.has(key))
            return false;
        const cell = this.state.map[row][col];
        const duration = (0, DigSystem_1.digDurationByType)(cell.type);
        if (duration <= 0)
            return false;
        cell.digging = true;
        cell.digProgress = 0;
        this.digTasks.set(key, { key, row, col, totalSec: duration, remainingSec: duration });
        return true;
    }
    completeDig(task) {
        const cell = this.state.map[task.row][task.col];
        const prevType = cell.type;
        cell.type = "empty";
        cell.baseType = "empty";
        cell.digging = false;
        cell.digProgress = 1;
        this.state.remainingDigCount = Math.max(0, this.state.remainingDigCount - 1);
        this.state.totalDugCount += 1;
        this.state.stats.totalDugCount += 1;
        const mat = (0, ResourceSystem_1.materialFromSoil)(prevType);
        if (mat) {
            this.state.materials[mat] += 1;
            this.state.stats.collectedMaterials += 1;
        }
        const natural = (0, SpawnSystem_1.maybeNaturalSpawn)(prevType, { x: task.col + 0.5, y: task.row + 0.5 });
        if (natural) {
            if (this.state.currentMonsterCount < this.state.maxMonsterCount) {
                this.state.monsters.push(natural);
                this.state.stats.spawnedMonsters += 1;
                this.state.currentMonsterCount = this.countCurrentMonsters();
                this.pushSpawnEffect(task.row, task.col, natural.name);
                this.pushToast(`魔物が誕生した！ ${natural.name}`);
            }
            else {
                if (mat) {
                    this.state.materials[mat] += 1;
                    this.state.stats.collectedMaterials += 1;
                }
                this.pushToast("魔物上限のため、素材へ変換されました", 1.8);
            }
        }
        this.bumpMapVersion();
    }
    countCurrentMonsters() {
        return this.state.monsters.filter((monster) => monster.state !== "dead" && monster.isActive).length;
    }
    beginDrag() {
        this.dragVisited.clear();
        this.lastDragCell = null;
    }
    endDrag() {
        this.dragVisited.clear();
        this.lastDragCell = null;
    }
    digAtCell(row, col, dragging) {
        if (!(0, grid_1.isInside)(balance_1.GRID_ROWS, balance_1.GRID_COLS, row, col))
            return;
        if (this.state.phase === "allyPlacement") {
            const result = this.selectCorePlacement(row, col);
            if (!result.canPlace && result.reason)
                this.setMessage(result.reason);
            this.emitHud();
            return;
        }
        if (this.state.phase === "placementConfirmation" || this.state.phase === "countdown") {
            this.setMessage("配置確認中です");
            this.emitHud();
            return;
        }
        if (!dragging)
            this.beginDrag();
        const current = { x: col, y: row };
        const line = this.lastDragCell ? bresenhamLine(this.lastDragCell, current) : [current];
        for (const p of line) {
            const key = (0, grid_1.cellKey)(p.y, p.x);
            if (this.dragVisited.has(key))
                continue;
            const ok = this.queueDig(p.y, p.x);
            if (!ok) {
                if (dragging && this.lastDragCell)
                    break;
                this.dragVisited.add(key);
                continue;
            }
            this.dragVisited.add(key);
        }
        this.lastDragCell = current;
        this.emitHud();
    }
    chooseCorePosition() {
        if (this.state.corePosition)
            return this.state.corePosition;
        for (let row = 0; row < balance_1.GRID_ROWS; row += 1) {
            for (let col = 0; col < balance_1.GRID_COLS; col += 1) {
                if (this.state.map[row][col].type === "coreRoom")
                    return { x: col, y: row };
            }
        }
        return null;
    }
    chooseEntrancePosition() {
        return this.state.entrancePosition;
    }
    refreshCorePlacementCache() {
        const keys = (0, CorePlacementSystem_1.listPlaceableCoreCells)(this.state).map((entry) => (0, grid_1.cellKey)(entry.row, entry.col));
        this.corePlaceableKeys = new Set(keys);
    }
    isCorePlacementPhase() {
        return this.state.phase === "allyPlacement";
    }
    isPlacementConfirmationPhase() {
        return this.state.phase === "placementConfirmation";
    }
    isCountdownPhase() {
        return this.state.phase === "countdown";
    }
    isPlacementProcessing() {
        return this.placementProcessing;
    }
    isControlLocked() {
        return this.state.phase === "placementConfirmation" || this.state.phase === "countdown";
    }
    canPlaceCoreAt(row, col) {
        return (0, CorePlacementSystem_1.canPlaceCore)(row, col, this.state);
    }
    isCorePlacementCandidate(row, col) {
        return this.corePlaceableKeys.has((0, grid_1.cellKey)(row, col));
    }
    selectCorePlacement(row, col) {
        const result = (0, CorePlacementSystem_1.canPlaceCore)(row, col, this.state);
        if (!result.canPlace)
            return result;
        this.state.selectedPlacementPosition = { x: col, y: row };
        this.state.isPlacementConfirmOpen = true;
        this.state.phase = "placementConfirmation";
        this.setMessage("この場所に守る味方を配置して開始しますか？");
        return result;
    }
    clearCorePlacementSelection() {
        this.state.selectedPlacementPosition = null;
        this.state.isPlacementConfirmOpen = false;
        this.state.phase = "allyPlacement";
    }
    findSafestAutoCoreCell() {
        const entrance = this.chooseEntrancePosition();
        let best = null;
        let bestDist = -1;
        for (let row = 1; row < balance_1.GRID_ROWS - 1; row += 1) {
            for (let col = 1; col < balance_1.GRID_COLS - 1; col += 1) {
                const strict = (0, CorePlacementSystem_1.canPlaceCore)(row, col, this.state);
                if (strict.canPlace && (strict.pathDistance ?? -1) > bestDist) {
                    best = { x: col, y: row };
                    bestDist = strict.pathDistance ?? -1;
                    continue;
                }
                const cell = this.state.map[row][col];
                if (cell.type !== "empty")
                    continue;
                const dist = (0, pathfinding_1.shortestPathDistanceBfs)(this.state.map, entrance, { x: col, y: row }, `${row}:${col}`);
                if (dist != null && dist > bestDist) {
                    best = { x: col, y: row };
                    bestDist = dist;
                }
            }
        }
        return best;
    }
    autoPlaceCoreAtSafestCell() {
        if (this.state.phase !== "allyPlacement")
            return false;
        const spot = this.findSafestAutoCoreCell();
        if (!spot) {
            this.setMessage("配置できる空間が見つかりません");
            return false;
        }
        this.state.selectedPlacementPosition = { ...spot };
        this.state.isPlacementConfirmOpen = true;
        this.state.phase = "placementConfirmation";
        this.setMessage("この場所に守る味方を配置して開始しますか？");
        return true;
    }
    targetForInvader() {
        return this.state.corePosition ?? this.state.playerStartPosition;
    }
    crowdMap() {
        const map = new Map();
        for (const inv of this.state.invaders) {
            if (inv.state === "dead")
                continue;
            const c = invaderCell(inv);
            const key = (0, grid_1.cellKey)(c.y, c.x);
            map.set(key, (map.get(key) ?? 0) + 1);
        }
        return map;
    }
    localMonsterPressure(cell) {
        let pressure = 0;
        for (const m of this.state.monsters) {
            if (!m.isActive || m.state === "dead")
                continue;
            const dx = Math.abs(Math.floor(m.position.x) - cell.x);
            const dy = Math.abs(Math.floor(m.position.y) - cell.y);
            const d = dx + dy;
            if (d <= 4)
                pressure += Math.max(0, 5 - d);
        }
        return pressure;
    }
    invaderStepCost(invader, to, toCell, crowd) {
        if (!(0, grid_1.isPassableCellType)(toCell.type))
            return Number.POSITIVE_INFINITY;
        const key = (0, grid_1.cellKey)(to.y, to.x);
        const crowdCount = crowd.get(key) ?? 0;
        const trapCost = toCell.type === "trap" ? (invader.kind === "purifier" ? 2 : 7) : 0;
        const pressure = this.localMonsterPressure(to);
        let base = 1;
        if (invader.kind === "scout")
            base = 0.95;
        if (invader.kind === "swordsman")
            base = 1;
        if (invader.kind === "heavy")
            base = 1.2;
        if (invader.kind === "caster")
            base = 1.1;
        if (invader.kind === "miner")
            base = 1.15;
        if (invader.kind === "purifier")
            base = 1.05;
        const crowdCost = invader.kind === "heavy" ? crowdCount * 0.45 : crowdCount * 0.3;
        const monsterCost = invader.kind === "caster" ? pressure * 0.28 : pressure * 0.44;
        const noise = ((0, random_1.hash2d)(this.state.mapSeed ^ invader.id.length, to.y, to.x) % 7) * 0.03;
        return base + crowdCost + trapCost + monsterCost + noise;
    }
    tryMinerDig(invader, target) {
        if (invader.kind !== "miner")
            return false;
        const cur = invaderCell(invader);
        const options = [];
        for (const [dr, dc] of DIRECTIONS4) {
            const r = cur.y + dr;
            const c = cur.x + dc;
            if (!(0, grid_1.isInside)(balance_1.GRID_ROWS, balance_1.GRID_COLS, r, c))
                continue;
            const cell = this.state.map[r][c];
            if (!(cell.type === "normalSoil" || cell.type === "magicSoil" || cell.type === "moistSoil" || cell.type === "mineralSoil" || cell.type === "toxicSoil")) {
                continue;
            }
            const score = Math.abs(target.x - c) + Math.abs(target.y - r);
            options.push({ row: r, col: c, score });
        }
        options.sort((a, b) => a.score - b.score);
        const pick = options[0];
        if (!pick)
            return false;
        const cell = this.state.map[pick.row][pick.col];
        cell.type = "empty";
        cell.baseType = "empty";
        invader.state = "digging";
        this.bumpMapVersion();
        return true;
    }
    recalcInvaderPath(invader, force = false) {
        const target = this.targetForInvader();
        const current = invaderCell(invader);
        const staleMap = invader.pathState.pathMapVersion !== this.mapVersion;
        const staleTarget = invader.pathState.targetPosition.x !== target.x || invader.pathState.targetPosition.y !== target.y;
        if (!force && !staleMap && !staleTarget && invader.pathState.path.length > 1) {
            return true;
        }
        const crowd = this.crowdMap();
        const path = (0, pathfinding_1.findPathAStarWithCost)(this.state.map, current, target, (_, to, toCell) => this.invaderStepCost(invader, to, toCell, crowd));
        if (path.length === 0) {
            const dug = this.tryMinerDig(invader, target);
            if (dug) {
                const pathRetry = (0, pathfinding_1.findPathAStarWithCost)(this.state.map, current, target, (_, to, toCell) => this.invaderStepCost(invader, to, toCell, this.crowdMap()));
                if (pathRetry.length === 0)
                    return false;
                invader.pathState = {
                    path: pathRetry,
                    currentPathIndex: 0,
                    targetPosition: target,
                    pathMapVersion: this.mapVersion,
                };
                invader.path = pathRetry;
                invader.pathIndex = 0;
                return true;
            }
            return false;
        }
        invader.pathState = {
            path,
            currentPathIndex: 0,
            targetPosition: target,
            pathMapVersion: this.mapVersion,
        };
        invader.path = path;
        invader.pathIndex = 0;
        return true;
    }
    cellCapacity(invader) {
        if (invader.kind === "heavy")
            return 1;
        if (invader.kind === "scout")
            return 3;
        return 2;
    }
    confirmCorePlacement() {
        if (this.state.phase !== "placementConfirmation" || !this.state.isPlacementConfirmOpen)
            return false;
        if (this.placementProcessing)
            return false;
        const pending = this.state.selectedPlacementPosition;
        if (!pending) {
            this.setMessage("配置場所を選択してください");
            return false;
        }
        this.placementProcessing = true;
        const result = (0, CorePlacementSystem_1.canPlaceCore)(pending.y, pending.x, this.state);
        if (!result.canPlace) {
            this.setMessage("選択した場所には配置できなくなりました。別の場所を選択してください");
            this.state.selectedPlacementPosition = null;
            this.state.isPlacementConfirmOpen = false;
            this.state.phase = "allyPlacement";
            this.refreshCorePlacementCache();
            this.placementProcessing = false;
            return false;
        }
        const pathFromEntrance = (0, pathfinding_1.findPathBfs)(this.state.map, this.state.entrancePosition, pending);
        if (pathFromEntrance.length === 0) {
            this.setMessage("敵入口から到達できる場所に魔界核を配置してください");
            this.placementProcessing = false;
            return false;
        }
        const cell = this.state.map[pending.y][pending.x];
        cell.type = "coreRoom";
        cell.baseType = "coreRoom";
        this.state.corePosition = { ...pending };
        this.state.confirmedAllyPosition = { ...pending };
        this.state.selectedPlacementPosition = null;
        this.state.isPlacementConfirmOpen = false;
        this.state.coreHp = 1000;
        this.state.coreMaxHp = 1000;
        this.state.phase = "countdown";
        this.state.paused = false;
        this.state.hasGameStarted = false;
        this.state.wave.wave = 1;
        this.state.waveCountdownSec = balance_1.CORE_PLACEMENT_COUNTDOWN_SEC;
        this.queuedInWave = (0, WaveSystem_1.enemiesForWave)(this.state.wave.wave);
        this.state.wave.remainingEnemiesInWave = this.queuedInWave;
        this.state.wave.spawnTimerSec = balance_1.WAVE_BALANCE.spawnEverySec;
        this.bumpMapVersion();
        for (const inv of this.state.invaders) {
            this.recalcInvaderPath(inv, true);
        }
        this.setMessage("守護核を設置しました。襲撃まで 3 秒");
        this.pushToast("襲撃開始までカウントダウン", 1.2);
        this.placementProcessing = false;
        this.emitHud(true);
        return true;
    }
    cancelCorePlacementConfirmation() {
        if (this.state.phase !== "placementConfirmation")
            return;
        this.state.selectedPlacementPosition = null;
        this.state.isPlacementConfirmOpen = false;
        this.state.phase = "allyPlacement";
        this.setMessage("配置場所を選び直してください");
        this.refreshCorePlacementCache();
        this.emitHud(true);
    }
    handleNoCorePlaceableCells() {
        if (this.state.corePlacementRetryCount === 0) {
            this.state.corePlacementRetryCount = 1;
            this.state.remainingDigCount += 5;
            this.state.phase = "preparation";
            this.state.paused = false;
            this.state.wave.nextWaveInSec = balance_1.EXTRA_PREPARATION_TIME_SEC;
            this.setMessage("魔界核を配置できる空間がありません。追加時間内に配置場所を作ってください");
            return;
        }
        this.state.phase = "allyPlacement";
        this.state.paused = true;
        this.setMessage("配置候補が不足しています。自分で掘るか自動配置を選択してください");
    }
    enterCorePlacementPhase() {
        this.state.phase = "allyPlacement";
        this.state.paused = true;
        this.state.wave.nextWaveInSec = 0;
        this.state.selectedPlacementPosition = null;
        this.state.isPlacementConfirmOpen = false;
        this.refreshCorePlacementCache();
        if (this.corePlaceableKeys.size === 0) {
            this.handleNoCorePlaceableCells();
            return;
        }
        this.setMessage("守る魔界核を配置してください");
    }
    shouldShowAutoCorePlaceButton() {
        return this.state.phase === "allyPlacement" && this.state.corePlacementRetryCount >= 1;
    }
    resumePreparationForCorePlacement() {
        if (this.state.phase !== "allyPlacement" && this.state.phase !== "placementConfirmation")
            return;
        this.state.phase = "preparation";
        this.state.paused = false;
        this.state.selectedPlacementPosition = null;
        this.state.isPlacementConfirmOpen = false;
        this.state.remainingDigCount += 5;
        this.state.wave.nextWaveInSec = balance_1.EXTRA_PREPARATION_TIME_SEC;
        this.setMessage("追加準備時間です。配置できる空間を作ってください");
    }
    placeNestNearCore() {
        const origin = this.chooseCorePosition() ?? this.state.playerStartPosition;
        const candidates = [];
        for (const [dr, dc] of DIRECTIONS4) {
            const r = origin.y + dr;
            const c = origin.x + dc;
            if (!(0, grid_1.isInside)(balance_1.GRID_ROWS, balance_1.GRID_COLS, r, c))
                continue;
            const cell = this.state.map[r][c];
            if (cell.type === "empty")
                candidates.push({ x: c, y: r });
        }
        if (candidates.length === 0)
            return;
        const spot = (0, random_1.randomPick)(candidates);
        const target = this.state.map[spot.y][spot.x];
        target.type = "nest";
        this.state.nests.push(spot);
        this.bumpMapVersion();
    }
    spawnMonsterFromFirstNest(kind) {
        if (this.state.currentMonsterCount >= this.state.maxMonsterCount) {
            this.setMessage("味方魔物の配置上限に達しています");
            return;
        }
        if (this.state.nests.length === 0) {
            this.setMessage("先に巣を配置してください");
            return;
        }
        const blueprint = monsters_1.MONSTER_BLUEPRINTS.find((item) => item.id === kind);
        if (!blueprint)
            return;
        for (const [mat, need] of Object.entries(blueprint.cost)) {
            const key = mat;
            if (this.state.materials[key] < (need ?? 0)) {
                this.setMessage("素材が不足しています");
                return;
            }
        }
        for (const [mat, need] of Object.entries(blueprint.cost)) {
            const key = mat;
            this.state.materials[key] -= need ?? 0;
        }
        const nest = this.state.nests[0];
        const monster = (0, SpawnSystem_1.spawnMonsterFromNest)(kind, { x: nest.x + 0.5, y: nest.y + 0.5 });
        this.state.monsters.push(monster);
        this.state.currentMonsterCount = this.countCurrentMonsters();
        this.state.stats.spawnedMonsters += 1;
        this.emitHud();
    }
    spawnInvader() {
        const entrance = this.chooseEntrancePosition();
        const target = this.targetForInvader();
        const bp = (0, random_1.randomPick)(invaders_1.INVADER_BLUEPRINTS);
        this.invaderSerial += 1;
        const invader = {
            id: `e-${Date.now()}-${this.invaderSerial}`,
            kind: bp.id,
            position: { x: entrance.x + 0.5, y: entrance.y + 0.5 },
            hp: bp.hp,
            maxHp: bp.hp,
            speed: bp.speed,
            attack: bp.attack,
            range: bp.range,
            target: { x: target.x + 0.5, y: target.y + 0.5 },
            path: [],
            pathIndex: 0,
            pathState: {
                path: [],
                currentPathIndex: 0,
                targetPosition: target,
                pathMapVersion: -1,
            },
            repathTimer: (0, random_1.randomFloat)() * 0.6,
            attackTimer: 0,
            stuckSec: 0,
            direction: "down",
            bodySize: bp.id === "heavy" ? 1.1 : bp.id === "scout" ? 0.75 : 0.9,
            state: "moving",
        };
        this.recalcInvaderPath(invader, true);
        this.state.invaders.push(invader);
    }
    updatePhaseTimers(dt, realDt) {
        if (this.state.phase === "preparation") {
            this.state.wave.nextWaveInSec -= dt;
            if (this.state.wave.nextWaveInSec <= 0)
                this.enterCorePlacementPhase();
            return;
        }
        if (this.state.phase === "waveResult") {
            this.state.wave.nextWaveInSec -= dt;
            if (this.state.wave.nextWaveInSec <= 0) {
                this.state.phase = "wave";
                this.state.paused = false;
                this.state.wave.wave += 1;
                this.queuedInWave = (0, WaveSystem_1.enemiesForWave)(this.state.wave.wave);
                this.state.wave.remainingEnemiesInWave = this.queuedInWave;
                this.state.wave.spawnTimerSec = 0;
            }
            return;
        }
        if (this.state.phase === "countdown") {
            const before = Math.ceil(this.state.waveCountdownSec);
            this.state.waveCountdownSec = Math.max(0, this.state.waveCountdownSec - realDt);
            const after = Math.ceil(this.state.waveCountdownSec);
            if (after !== before && after > 0)
                this.setMessage(`${after}`);
            if (before > 0 && after === 0) {
                this.state.phase = "wave";
                this.state.hasGameStarted = true;
                this.state.paused = false;
                this.setMessage("襲撃開始！");
            }
        }
    }
    updateWaveSpawning(dt) {
        if (this.state.phase !== "wave")
            return;
        this.state.wave.spawnTimerSec -= dt;
        if (this.queuedInWave > 0 && this.state.wave.spawnTimerSec <= 0) {
            this.spawnInvader();
            this.queuedInWave -= 1;
            this.state.wave.remainingEnemiesInWave = this.queuedInWave;
            this.state.wave.spawnTimerSec = balance_1.WAVE_BALANCE.spawnEverySec;
        }
        const alive = this.state.invaders.filter((it) => it.state !== "dead").length;
        if (this.queuedInWave <= 0 && alive === 0) {
            if (this.state.wave.wave >= this.state.wave.maxWave) {
                this.state.phase = "victory";
                return;
            }
            this.state.phase = "waveResult";
            this.state.wave.nextWaveInSec = balance_1.WAVE_BALANCE.betweenWaveSec;
        }
    }
    updateDigTasks(dt) {
        const done = [];
        this.digTasks.forEach((task) => {
            task.remainingSec -= dt;
            const cell = this.state.map[task.row][task.col];
            cell.digProgress = Math.min(1, 1 - task.remainingSec / task.totalSec);
            if (task.remainingSec <= 0)
                done.push(task);
        });
        for (const task of done) {
            this.digTasks.delete(task.key);
            this.completeDig(task);
        }
    }
    updateInvaders(dt) {
        if (this.state.paused || this.state.phase !== "wave")
            return;
        const target = this.targetForInvader();
        const occupancyNow = this.crowdMap();
        const occupancyNext = new Map();
        const waveSpeedMultiplier = this.state.gameSpeed;
        for (const invader of this.state.invaders) {
            if (invader.state === "dead")
                continue;
            invader.repathTimer -= dt;
            const targetChanged = invader.pathState.targetPosition.x !== target.x ||
                invader.pathState.targetPosition.y !== target.y;
            const needsMapRefresh = invader.pathState.pathMapVersion !== this.mapVersion;
            if (invader.repathTimer <= 0 ||
                targetChanged ||
                needsMapRefresh ||
                invader.pathState.path.length <= 1 ||
                invader.stuckSec > 0.9) {
                this.recalcInvaderPath(invader, true);
                invader.repathTimer = 0.45 + (((0, random_1.hash2d)(this.state.mapSeed ^ invader.id.length, invaderCell(invader).y, invaderCell(invader).x) % 100) / 1000);
                invader.stuckSec = 0;
            }
            const idx = invader.pathState.currentPathIndex;
            const path = invader.pathState.path;
            const currentCell = invaderCell(invader);
            if (path.length === 0) {
                invader.stuckSec += dt;
                continue;
            }
            if (idx < path.length && path[idx].x !== currentCell.x && path[idx].y !== currentCell.y) {
                invader.pathState.currentPathIndex = Math.max(0, idx - 1);
            }
            const nextIndex = Math.min(invader.pathState.currentPathIndex + 1, path.length - 1);
            const nextCell = path[nextIndex];
            const center = cellCenter(nextCell);
            const nextKey = (0, grid_1.cellKey)(nextCell.y, nextCell.x);
            const cap = this.cellCapacity(invader);
            const occ = (occupancyNow.get(nextKey) ?? 0) + (occupancyNext.get(nextKey) ?? 0);
            let speedFactor = 1;
            if (occ >= cap)
                speedFactor = 0.28;
            if (occ >= cap + 1)
                speedFactor = 0;
            const speed = (0, MovementSystem_1.getEnemyFinalMoveSpeed)(invader, waveSpeedMultiplier, speedFactor);
            const dx = center.x - invader.position.x;
            const dy = center.y - invader.position.y;
            const dist = Math.hypot(dx, dy);
            if (dist <= 0.001) {
                invader.position.x = center.x;
                invader.position.y = center.y;
                if (nextIndex > invader.pathState.currentPathIndex) {
                    invader.pathState.currentPathIndex = nextIndex;
                    invader.pathIndex = nextIndex;
                }
            }
            else if (speed > 0) {
                const step = Math.min(dist, speed * dt);
                const ux = dx / dist;
                const uy = dy / dist;
                invader.direction = directionFromDelta(ux, uy, invader.direction);
                const movingHoriz = Math.abs(ux) > Math.abs(uy);
                if (movingHoriz) {
                    invader.position.x += ux * step;
                    invader.position.y = Math.round(invader.position.y * 1000) / 1000;
                }
                else {
                    invader.position.y += uy * step;
                    invader.position.x = Math.round(invader.position.x * 1000) / 1000;
                }
                if (step < 0.0001)
                    invader.stuckSec += dt;
                else
                    invader.stuckSec = Math.max(0, invader.stuckSec - dt * 0.5);
            }
            else {
                invader.stuckSec += dt;
            }
            const afterCell = invaderCell(invader);
            const afterKey = (0, grid_1.cellKey)(afterCell.y, afterCell.x);
            occupancyNext.set(afterKey, (occupancyNext.get(afterKey) ?? 0) + 1);
            const core = this.chooseCorePosition() ?? this.state.playerStartPosition;
            const coreDx = core.x + 0.5 - invader.position.x;
            const coreDy = core.y + 0.5 - invader.position.y;
            const coreDist = Math.hypot(coreDx, coreDy);
            if (coreDist <= invader.range) {
                invader.attackTimer -= dt;
                invader.state = "attacking";
                if (invader.attackTimer <= 0) {
                    this.state.coreHp = Math.max(0, this.state.coreHp - invader.attack);
                    invader.attackTimer = 1;
                }
            }
            else if (invader.state !== "digging") {
                invader.state = "moving";
            }
            if (this.state.corePosition && this.state.coreHp <= 0)
                this.state.phase = "gameOver";
        }
    }
    updateMonsters(dt) {
        if (this.state.paused || this.state.phase === "allyPlacement" || this.state.phase === "placementConfirmation" || this.state.phase === "countdown") {
            return;
        }
        const killed = (0, BattleSystem_1.applyCombat)(this.state.monsters, this.state.invaders, dt);
        if (killed > 0) {
            this.state.stats.killedInvaders += killed;
            this.state.score += killed * 10;
        }
        this.state.invaders = this.state.invaders.filter((invader) => invader.state !== "dead");
        this.state.monsters = this.state.monsters.filter((monster) => monster.state !== "dead");
        this.state.currentMonsterCount = this.countCurrentMonsters();
    }
    tick(deltaSecRaw) {
        if (this.state.phase === "gameOver" || this.state.phase === "victory") {
            this.updateUiEffects(deltaSecRaw);
            this.emitHud(true);
            return;
        }
        const frozenByPhase = this.state.phase === "allyPlacement" ||
            this.state.phase === "placementConfirmation" ||
            this.state.phase === "countdown";
        const frozen = this.state.paused || frozenByPhase;
        const deltaSec = frozen ? 0 : deltaSecRaw * this.state.gameSpeed;
        this.updateUiEffects(deltaSecRaw);
        if (!frozenByPhase)
            this.state.timeSec += deltaSec;
        if (balance_1.DIG_BALANCE.regenPerSecond > 0 && this.state.remainingDigCount < this.state.maxDigCount) {
            const next = this.state.remainingDigCount + balance_1.DIG_BALANCE.regenPerSecond * deltaSec;
            this.state.remainingDigCount = Math.min(this.state.maxDigCount, Math.floor(next));
        }
        this.updateDigTasks(deltaSec);
        this.updatePhaseTimers(deltaSec, deltaSecRaw);
        this.updateWaveSpawning(deltaSec);
        this.updateInvaders(deltaSec);
        this.updateMonsters(deltaSec);
        this.emitHud();
    }
    getCellAt(row, col) {
        if (!(0, grid_1.isInside)(balance_1.GRID_ROWS, balance_1.GRID_COLS, row, col))
            return null;
        return this.state.map[row][col] ?? null;
    }
    isCellDiggable(row, col) {
        if (!this.canDigNow())
            return false;
        return (0, DigSystem_1.canDigCell)(row, col, this.state.map, this.state.remainingDigCount);
    }
    isCellBlocked(row, col) {
        const cell = this.getCellAt(row, col);
        if (!cell)
            return true;
        return cell.type === "hardRock" || !(0, grid_1.isPassableCellType)(cell.type);
    }
    refreshDerivedState() {
        this.state.currentMonsterCount = this.countCurrentMonsters();
        this.emitHud(true);
    }
    restart() {
        const fresh = new GameEngine();
        this.state = fresh.state;
        this.mapVersion = 1;
        this.digTasks.clear();
        this.dragVisited.clear();
        this.lastDragCell = null;
        this.queuedInWave = 0;
        this.corePlaceableKeys.clear();
        this.invaderSerial = 0;
        this.placementProcessing = false;
        this.phaseBeforePause = null;
        this.emitHud(true);
    }
    getMapCopy() {
        return (0, grid_1.cloneMap)(this.state.map);
    }
}
exports.GameEngine = GameEngine;
