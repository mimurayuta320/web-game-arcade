import {
  ALLY_DETECTION_INTERVAL,
  ALLY_PATH_RECALCULATION_INTERVAL,
  ALLY_WANDER_CONFIG,
  CORE_PLACEMENT_COUNTDOWN_SEC,
  DEPTH_LAYER_COLORS,
  DEPTH_LAYER_HEIGHT,
  DEPTH_LAYER_MATERIAL_BONUS_CHANCE,
  DIG_BALANCE,
  DIG_BREAK_ANIMATION_DURATION,
  DIG_RECOVERY_PER_WAVE,
  EXTRA_PREPARATION_TIME_SEC,
  GRID_COLS,
  GRID_ROWS,
  HUD_NOTIFY_INTERVAL_MS,
  INITIAL_MAX_DIG_COUNT,
  INITIAL_PREPARATION_TIME,
  INITIAL_REMAINING_DIG_COUNT,
  WAVE_BALANCE,
  getDepthLayer,
} from "../data/balance";
import { getAbilityDefinition } from "../data/abilities";
import { INITIAL_MATERIALS } from "../data/materials";
import { INVADER_BLUEPRINTS } from "../data/invaders";
import {
  ALLY_MONSTER_DEFINITIONS,
  DEFAULT_ALLY_BEHAVIOR,
  findMonsterDefinition,
  MONSTER_BLUEPRINTS,
  MONSTER_RARITY_COLOR,
} from "../data/monsters";
import type {
  AllyMovementState,
  BestiaryEntry,
  CorePlacementResult,
  DigBreakEffect,
  Direction,
  GamePhase,
  GameState,
  GridPosition,
  HudSnapshot,
  Invader,
  MapCell,
  MonsterLimit,
  MonsterSpawnTier,
  SoilType,
  Vec2,
} from "../types/game";
import { canPlaceCore, listPlaceableCoreCells } from "../systems/CorePlacementSystem";
import { canDigCell } from "../systems/DigSystem";
import { generateLabyrinthMap } from "../systems/MapGenerationSystem";
import { getEnemyFinalMoveSpeed } from "../systems/MovementSystem";
import { materialFromSoil } from "../systems/ResourceSystem";
import {
  createSummonedMinion,
  getFinalSpawnRate,
  getMonsterSpawnTierLabel,
  maybeNaturalSpawnWithTier,
  pickSpawnCandidatesBySoil,
  rarityColorByMonsterKind,
  spawnMessageByMonsterKind,
  spawnMonsterFromNest,
} from "../systems/SpawnSystem";
import { enemiesForWave } from "../systems/WaveSystem";
import { cellKey, cloneMap, isInside, isPassableCellType } from "../utils/grid";
import { findPathAStarWithCost, findPathBfs, reachableSetBfs, shortestPathDistanceBfs } from "../utils/pathfinding";
import { hash2d, randomFloat, randomInt, randomPick } from "../utils/random";

const DIRECTIONS4: Array<[number, number]> = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

function bresenhamLine(a: Vec2, b: Vec2): Vec2[] {
  const points: Vec2[] = [];
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
    if (x0 === x1 && y0 === y1) break;
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

function directionFromDelta(dx: number, dy: number, fallback: Direction): Direction {
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
  if (Math.abs(dy) > 0) return dy > 0 ? "down" : "up";
  return fallback;
}

function getManhattanDistance(a: GridPosition, b: GridPosition): number {
  return Math.abs(a.y - b.y) + Math.abs(a.x - b.x);
}

function invaderCell(invader: Invader): GridPosition {
  return {
    x: Math.floor(invader.position.x),
    y: Math.floor(invader.position.y),
  };
}

function cellCenter(cell: GridPosition): Vec2 {
  return { x: cell.x + 0.5, y: cell.y + 0.5 };
}

function hasReachedMonsterLimit(currentCount: number, maxCount: MonsterLimit): boolean {
  return maxCount !== null && currentCount >= maxCount;
}

const BESTIARY_STORAGE_KEY = "deep-labyrinth-bestiary-v1";

function createDefaultBestiary(): Record<string, BestiaryEntry> {
  const out: Record<string, BestiaryEntry> = {};
  for (const def of ALLY_MONSTER_DEFINITIONS) {
    out[def.id] = {
      id: def.id,
      discovered: false,
      discoveredCount: 0,
      killCount: 0,
    };
  }
  return out;
}

export class GameEngine {
  state: GameState;

  private mapVersion = 1;
  private lastHudEmitMs = 0;
  private hudSubscribers = new Set<(hud: HudSnapshot) => void>();
  private dragVisited = new Set<string>();
  private lastDragCell: Vec2 | null = null;
  private queuedInWave = 0;
  private messageStamp = 0;
  private toastSerial = 0;
  private pendingToasts: Array<{ text: string; ttlSec: number }> = [];
  private effectSerial = 0;
  private corePlaceableKeys = new Set<string>();
  private invaderSerial = 0;
  private digBreakSerial = 0;
  private cameraFocusRow = 0;
  private placementProcessing = false;
  private phaseBeforePause: GamePhase | null = null;

  constructor(seed?: number) {
    const chosenSeed = seed ?? ((Date.now() ^ randomInt(1, 0x7fffffff)) >>> 0);
    const generated = generateLabyrinthMap(chosenSeed);

    this.state = {
      phase: "preparation",
      timeSec: 0,
      mapSeed: generated.seed,
      mapVersion: 1,
      map: generated.map,
      entrancePosition: generated.entrance,
      playerStartPosition: generated.playerStart,
      playerAreaCells: generated.playerArea,
      materials: { ...INITIAL_MATERIALS },
      maxDigCount: INITIAL_MAX_DIG_COUNT,
      remainingDigCount: INITIAL_REMAINING_DIG_COUNT,
      totalDugCount: 0,
      currentMonsterCount: 0,
      maxMonsterCount: null,
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
        maxWave: WAVE_BALANCE.maxWave,
        remainingEnemiesInWave: 0,
        nextWaveInSec: INITIAL_PREPARATION_TIME,
        spawnTimerSec: WAVE_BALANCE.spawnEverySec,
      },
      stats: {
        totalDugCount: 0,
        killedInvaders: 0,
        spawnedMonsters: 0,
        collectedMaterials: 0,
      },
      bestiary: createDefaultBestiary(),
      message: generated.validation.valid
        ? `seed ${generated.seed} / map ok`
        : `seed ${generated.seed} / fallback map`,
      debugEnabled: false,
      corePlacementRetryCount: 0,
      waveCountdownSec: 0,
      toasts: [],
      spawnEffects: [],
      digBreakEffects: [],
    };

    this.loadBestiary();
  }

  getRenderState(): GameState {
    return this.state;
  }

  getMapVersion(): number {
    return this.mapVersion;
  }

  isDebugEnabled(): boolean {
    return this.state.debugEnabled;
  }

  toggleDebug(): void {
    this.state.debugEnabled = !this.state.debugEnabled;
    this.emitHud(true);
  }

  getDebugOverlay(): {
    enabled: boolean;
    mapVersion: number;
    reachableKeys: Set<string>;
    passableKeys: Set<string>;
    coreCandidateKeys: Set<string>;
    enemyPaths: Array<{ id: string; path: GridPosition[]; index: number; state: string }>;
  } {
    const passable = new Set<string>();
    for (let r = 0; r < GRID_ROWS; r += 1) {
      for (let c = 0; c < GRID_COLS; c += 1) {
        if (isPassableCellType(this.state.map[r][c].type)) passable.add(cellKey(r, c));
      }
    }

    const reachable = reachableSetBfs(this.state.map, this.state.entrancePosition);
    const coreCandidateKeys = new Set<string>(
      listPlaceableCoreCells(this.state).map((p) => cellKey(p.row, p.col)),
    );

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

  subscribeHud(handler: (hud: HudSnapshot) => void): () => void {
    this.hudSubscribers.add(handler);
    handler(this.getHudSnapshot());
    return () => this.hudSubscribers.delete(handler);
  }

  private emitHud(force = false): void {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (!force && now - this.lastHudEmitMs < HUD_NOTIFY_INTERVAL_MS) return;
    this.lastHudEmitMs = now;
    const snap = this.getHudSnapshot();
    this.hudSubscribers.forEach((handler) => handler(snap));
  }

  private getHudSnapshot(): HudSnapshot {
    const layer = getDepthLayer(this.cameraFocusRow);
    const from = layer * DEPTH_LAYER_HEIGHT;
    const to = from + DEPTH_LAYER_HEIGHT - 1;
    return {
      phase: this.state.phase,
      remainingDigCount: this.state.remainingDigCount,
      maxDigCount: this.state.maxDigCount,
      currentMonsterCount: this.state.currentMonsterCount,
      enemyCount: this.state.invaders.filter((it) => it.state !== "dead").length,
      wave: this.state.wave.wave,
      maxWave: this.state.wave.maxWave,
      coreHp: this.state.coreHp,
      coreMaxHp: this.state.coreMaxHp,
      corePlaced: Boolean(this.state.corePosition),
      nextWaveInSec: Math.max(0, Math.ceil(this.state.wave.nextWaveInSec)),
      waveCountdownSec: Math.max(0, Math.ceil(this.state.waveCountdownSec)),
      paused: this.state.paused,
      depthLabel: `深度: ${DEPTH_LAYER_COLORS[layer].name}（${from}～${to}マス）`,
    };
  }

  setCameraFocusRow(row: number): void {
    const clamped = Math.max(0, Math.min(GRID_ROWS - 1, Math.floor(row)));
    if (clamped === this.cameraFocusRow) return;
    this.cameraFocusRow = clamped;
    this.emitHud();
  }

  getToasts(): GameState["toasts"] {
    return this.state.toasts;
  }

  getSpawnEffects(): GameState["spawnEffects"] {
    return this.state.spawnEffects;
  }

  getDigBreakEffects(): GameState["digBreakEffects"] {
    return this.state.digBreakEffects;
  }

  getBestiaryEntries(): Array<BestiaryEntry & { name: string; role: string; rarity: string; description: string }> {
    return ALLY_MONSTER_DEFINITIONS.map((def) => {
      const entry = this.state.bestiary[def.id] ?? {
        id: def.id,
        discovered: false,
        discoveredCount: 0,
        killCount: 0,
      };
      return {
        ...entry,
        name: def.name,
        role: def.role,
        rarity: def.rarity,
        description: def.description,
      };
    });
  }

  private loadBestiary(): void {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(BESTIARY_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, BestiaryEntry>;
      this.state.bestiary = { ...createDefaultBestiary(), ...parsed };
    } catch {
      this.state.bestiary = createDefaultBestiary();
    }
  }

  private saveBestiary(): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(BESTIARY_STORAGE_KEY, JSON.stringify(this.state.bestiary));
    } catch {
      // ignore storage write errors
    }
  }

  private registerBestiaryDiscovery(kind: string): void {
    const entry = this.state.bestiary[kind] ?? {
      id: kind,
      discovered: false,
      discoveredCount: 0,
      killCount: 0,
    };
    entry.discovered = true;
    entry.discoveredCount += 1;
    this.state.bestiary[kind] = entry;
    this.saveBestiary();
  }

  private registerBestiaryKill(kind: string): void {
    const entry = this.state.bestiary[kind] ?? {
      id: kind,
      discovered: false,
      discoveredCount: 0,
      killCount: 0,
    };
    entry.killCount += 1;
    this.state.bestiary[kind] = entry;
    this.saveBestiary();
  }

  private pushToast(text: string, ttlSec = 2.2): void {
    const payload = { text, ttlSec };
    if (this.state.toasts.length > 0) {
      this.pendingToasts.push(payload);
      return;
    }
    this.toastSerial += 1;
    this.state.toasts.push({ id: `toast-${this.toastSerial}`, ...payload });
  }

  private spawnGlowColorByTier(spawnTier: MonsterSpawnTier): string {
    if (spawnTier === "veryHigh") return "rgba(244, 178, 82, 0.68)";
    if (spawnTier === "high") return "rgba(128, 120, 245, 0.58)";
    return "rgba(122, 238, 255, 0.42)";
  }

  private pushSpawnEffect(
    row: number,
    col: number,
    monsterName: string,
    spawnTier: MonsterSpawnTier,
    customGlowColor?: string,
  ): void {
    this.effectSerial += 1;
    this.state.spawnEffects.push({
      id: `effect-${this.effectSerial}`,
      row,
      col,
      monsterName,
      spawnTier,
      glowColor: customGlowColor ?? this.spawnGlowColorByTier(spawnTier),
      elapsedSec: 0,
      durationSec: 0.55,
    });
  }

  private updateUiEffects(dt: number): void {
    this.state.toasts = this.state.toasts
      .map((toast) => ({ ...toast, ttlSec: toast.ttlSec - dt }))
      .filter((toast) => toast.ttlSec > 0);
    if (this.state.toasts.length === 0 && this.pendingToasts.length > 0) {
      const next = this.pendingToasts.shift();
      if (next) {
        this.toastSerial += 1;
        this.state.toasts.push({ id: `toast-${this.toastSerial}`, text: next.text, ttlSec: next.ttlSec });
      }
    }
    this.state.spawnEffects = this.state.spawnEffects
      .map((effect) => ({ ...effect, elapsedSec: effect.elapsedSec + dt }))
      .filter((effect) => effect.elapsedSec < effect.durationSec);
    this.state.digBreakEffects = this.state.digBreakEffects
      .map((effect) => {
        const ratio = Math.min(1, (Date.now() - effect.startedAt) / effect.duration);
        const particles = effect.particles.map((particle) => ({
          ...particle,
          x: particle.x + particle.vx * dt,
          y: particle.y + particle.vy * dt,
          vy: particle.vy + 6.2 * dt,
          alpha: Math.max(0, 1 - ratio),
        }));
        return { ...effect, particles };
      })
      .filter((effect) => Date.now() - effect.startedAt < effect.duration);
  }

  private bumpMapVersion(): void {
    this.mapVersion += 1;
    this.state.mapVersion = this.mapVersion;
  }

  setGameSpeed(speed: 1 | 2 | 3): void {
    if (this.state.phase === "countdown" || this.state.phase === "placementConfirmation") return;
    this.state.gameSpeed = speed;
    this.emitHud(true);
  }

  setPaused(paused: boolean): void {
    if (this.state.phase === "allyPlacement" || this.state.phase === "placementConfirmation" || this.state.phase === "countdown") {
      return;
    }

    if (paused) {
      if (!this.state.paused) {
        this.phaseBeforePause = this.state.phase;
        this.state.phase = "paused";
        this.state.paused = true;
      }
    } else {
      if (this.state.paused) {
        this.state.phase = this.phaseBeforePause ?? "wave";
        this.phaseBeforePause = null;
        this.state.paused = false;
      }
    }
    this.emitHud(true);
  }

  togglePause(): void {
    this.setPaused(!this.state.paused);
  }

  private setMessage(msg: string): void {
    const now = Date.now();
    if (this.state.message === msg && now - this.messageStamp < 800) return;
    this.state.message = msg;
    this.messageStamp = now;
  }

  private canDigNow(): boolean {
    return this.state.phase === "preparation" || this.state.phase === "wave" || this.state.phase === "waveResult";
  }

  private consumeDigCount(): boolean {
    if (this.state.remainingDigCount <= 0) {
      this.setMessage("掘削回数が残っていません");
      return false;
    }
    return true;
  }

  private isSoilType(type: string): type is SoilType {
    return type === "normalSoil" || type === "magicSoil" || type === "moistSoil" || type === "mineralSoil" || type === "toxicSoil";
  }

  private pushDigBreakEffect(row: number, column: number, soilType: SoilType): void {
    this.digBreakSerial += 1;
    const particles = Array.from({ length: randomInt(4, 8) }, (_, i) => ({
      id: `dig-p-${this.digBreakSerial}-${i}`,
      x: column + 0.5 + randomFloat() * 0.2 - 0.1,
      y: row + 0.5 + randomFloat() * 0.2 - 0.1,
      vx: randomFloat() * 1.1 - 0.55,
      vy: -(randomFloat() * 1.4 + 0.2),
      size: randomFloat() * 0.16 + 0.08,
      alpha: 1,
    }));
    const depthLayer = getDepthLayer(row);
    const effect: DigBreakEffect = {
      id: `dig-break-${this.digBreakSerial}`,
      row,
      column,
      soilType,
      depthLayer,
      startedAt: Date.now(),
      duration: DIG_BREAK_ANIMATION_DURATION,
      particles,
    };
    this.state.digBreakEffects.push(effect);
  }

  private recalcInvaderPathsAfterDig(): void {
    for (const invader of this.state.invaders) {
      if (invader.state === "dead") continue;
      this.recalcInvaderPath(invader, true);
    }
  }

  private queueDig(row: number, col: number): boolean {
    if (!this.canDigNow()) {
      this.setMessage("掘削は一時停止中です");
      return false;
    }
    if (!this.consumeDigCount()) return false;
    if (!canDigCell(row, col, this.state.map, this.state.remainingDigCount)) {
      this.setMessage("掘削済みの空間に隣接する土だけ掘れます");
      return false;
    }
    const cell = this.state.map[row][col];
    const soilType = cell.type;
    if (!this.isSoilType(soilType)) return false;

    const prevType = cell.type;
    cell.type = "empty";
    cell.baseType = "empty";
    cell.digging = false;
    cell.digProgress = 0;

    this.state.remainingDigCount = Math.max(0, this.state.remainingDigCount - 1);
    this.state.totalDugCount += 1;
    this.state.stats.totalDugCount += 1;

    const mat = materialFromSoil(prevType);
    if (mat) {
      this.state.materials[mat] += 1;
      this.state.stats.collectedMaterials += 1;
      const depthLayer = getDepthLayer(row);
      if (randomFloat() < DEPTH_LAYER_MATERIAL_BONUS_CHANCE[depthLayer]) {
        this.state.materials[mat] += 1;
        this.state.stats.collectedMaterials += 1;
      }
    }

    const spawnTier: MonsterSpawnTier = cell.spawnTier ?? "normal";
    const natural = maybeNaturalSpawnWithTier(prevType, { x: col + 0.5, y: row + 0.5 }, row, spawnTier);
    if (natural) {
      this.state.monsters.push(natural);
      this.state.stats.spawnedMonsters += 1;
      this.state.currentMonsterCount = this.countCurrentMonsters();
      this.registerBestiaryDiscovery(natural.kind);
      this.pushSpawnEffect(row, col, natural.name, spawnTier, rarityColorByMonsterKind(natural.kind));
      const lines = spawnMessageByMonsterKind(natural.kind);
      for (const line of lines) this.pushToast(line, 2.6);
    }

    this.bumpMapVersion();
    this.pushDigBreakEffect(row, col, soilType);
    this.recalcInvaderPathsAfterDig();
    return true;
  }

  private countCurrentMonsters(): number {
    return this.state.monsters.filter((monster) => monster.state !== "dead" && monster.isActive).length;
  }

  beginDrag(): void {
    this.dragVisited.clear();
    this.lastDragCell = null;
  }

  endDrag(): void {
    this.dragVisited.clear();
    this.lastDragCell = null;
  }

  digAtCell(row: number, col: number, dragging: boolean): void {
    if (!isInside(GRID_ROWS, GRID_COLS, row, col)) return;

    if (this.state.phase === "allyPlacement") {
      const result = this.selectCorePlacement(row, col);
      if (!result.canPlace && result.reason) this.setMessage(result.reason);
      this.emitHud();
      return;
    }

    if (this.state.phase === "placementConfirmation" || this.state.phase === "countdown") {
      this.setMessage("配置確認中です");
      this.emitHud();
      return;
    }

    if (!dragging) this.beginDrag();

    const current = { x: col, y: row };
    const line = this.lastDragCell ? bresenhamLine(this.lastDragCell, current) : [current];

    for (const p of line) {
      const key = cellKey(p.y, p.x);
      if (this.dragVisited.has(key)) continue;

      const ok = this.queueDig(p.y, p.x);
      if (!ok) {
        if (dragging && this.lastDragCell) break;
        this.dragVisited.add(key);
        continue;
      }
      this.dragVisited.add(key);
    }

    this.lastDragCell = current;
    this.emitHud();
  }

  private chooseCorePosition(): Vec2 | null {
    if (this.state.corePosition) return this.state.corePosition;
    for (let row = 0; row < GRID_ROWS; row += 1) {
      for (let col = 0; col < GRID_COLS; col += 1) {
        if (this.state.map[row][col].type === "coreRoom") return { x: col, y: row };
      }
    }
    return null;
  }

  private chooseEntrancePosition(): Vec2 {
    return this.state.entrancePosition;
  }

  getEntrancePosition(): GridPosition {
    return this.state.entrancePosition;
  }

  getCorePosition(): GridPosition | null {
    return this.state.corePosition;
  }

  private refreshCorePlacementCache(): void {
    const keys = listPlaceableCoreCells(this.state).map((entry) => cellKey(entry.row, entry.col));
    this.corePlaceableKeys = new Set(keys);
  }

  isCorePlacementPhase(): boolean {
    return this.state.phase === "allyPlacement";
  }

  isPlacementConfirmationPhase(): boolean {
    return this.state.phase === "placementConfirmation";
  }

  isCountdownPhase(): boolean {
    return this.state.phase === "countdown";
  }

  isPlacementProcessing(): boolean {
    return this.placementProcessing;
  }

  isControlLocked(): boolean {
    return this.state.phase === "placementConfirmation" || this.state.phase === "countdown";
  }

  canPlaceCoreAt(row: number, col: number): CorePlacementResult {
    return canPlaceCore(row, col, this.state);
  }

  isCorePlacementCandidate(row: number, col: number): boolean {
    return this.corePlaceableKeys.has(cellKey(row, col));
  }

  selectCorePlacement(row: number, col: number): CorePlacementResult {
    const result = canPlaceCore(row, col, this.state);
    if (!result.canPlace) return result;
    this.state.selectedPlacementPosition = { x: col, y: row };
    this.state.isPlacementConfirmOpen = true;
    this.state.phase = "placementConfirmation";
    this.setMessage("この場所に守る味方を配置して開始しますか？");
    return result;
  }

  clearCorePlacementSelection(): void {
    this.state.selectedPlacementPosition = null;
    this.state.isPlacementConfirmOpen = false;
    this.state.phase = "allyPlacement";
  }

  private findSafestAutoCoreCell(): Vec2 | null {
    const entrance = this.chooseEntrancePosition();
    let best: Vec2 | null = null;
    let bestDist = -1;

    for (let row = 1; row < GRID_ROWS - 1; row += 1) {
      for (let col = 1; col < GRID_COLS - 1; col += 1) {
        const strict = canPlaceCore(row, col, this.state);
        if (strict.canPlace && (strict.pathDistance ?? -1) > bestDist) {
          best = { x: col, y: row };
          bestDist = strict.pathDistance ?? -1;
          continue;
        }

        const cell = this.state.map[row][col];
        if (cell.type !== "empty") continue;
        const dist = shortestPathDistanceBfs(this.state.map, entrance, { x: col, y: row }, `${row}:${col}`);
        if (dist != null && dist > bestDist) {
          best = { x: col, y: row };
          bestDist = dist;
        }
      }
    }

    return best;
  }

  autoPlaceCoreAtSafestCell(): boolean {
    if (this.state.phase !== "allyPlacement") return false;
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

  private targetForInvader(invader?: Invader): GridPosition {
    if (invader && invader.tauntedUntil && invader.tauntedUntil > this.state.timeSec && invader.tauntedByMonsterId) {
      const source = this.state.monsters.find((m) => m.id === invader.tauntedByMonsterId && m.isActive && m.state !== "dead");
      if (source) return this.monsterCell(source);
    }
    return this.state.corePosition ?? this.state.playerStartPosition;
  }

  private crowdMap(): Map<string, number> {
    const map = new Map<string, number>();
    for (const inv of this.state.invaders) {
      if (inv.state === "dead") continue;
      const c = invaderCell(inv);
      const key = cellKey(c.y, c.x);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }

  private localMonsterPressure(cell: GridPosition): number {
    let pressure = 0;
    for (const m of this.state.monsters) {
      if (!m.isActive || m.state === "dead") continue;
      const dx = Math.abs(Math.floor(m.position.x) - cell.x);
      const dy = Math.abs(Math.floor(m.position.y) - cell.y);
      const d = dx + dy;
      if (d <= 4) pressure += Math.max(0, 5 - d);
    }
    return pressure;
  }

  private invaderStepCost(invader: Invader, to: GridPosition, toCell: MapCell, crowd: Map<string, number>): number {
    if (!isPassableCellType(toCell.type)) return Number.POSITIVE_INFINITY;

    const key = cellKey(to.y, to.x);
    const crowdCount = crowd.get(key) ?? 0;
    const trapCost = toCell.type === "trap" ? (invader.kind === "purifier" ? 2 : 7) : 0;
    const pressure = this.localMonsterPressure(to);

    let base = 1;
    if (invader.kind === "scout") base = 0.95;
    if (invader.kind === "swordsman") base = 1;
    if (invader.kind === "heavy") base = 1.2;
    if (invader.kind === "caster") base = 1.1;
    if (invader.kind === "miner") base = 1.15;
    if (invader.kind === "purifier") base = 1.05;

    const crowdCost = invader.kind === "heavy" ? crowdCount * 0.45 : crowdCount * 0.3;
    const monsterCost = invader.kind === "caster" ? pressure * 0.28 : pressure * 0.44;
    const noise = (hash2d(this.state.mapSeed ^ invader.id.length, to.y, to.x) % 7) * 0.03;

    return base + crowdCost + trapCost + monsterCost + noise;
  }

  private tryMinerDig(invader: Invader, target: GridPosition): boolean {
    if (invader.kind !== "miner") return false;

    const cur = invaderCell(invader);
    const options: Array<{ row: number; col: number; score: number }> = [];
    for (const [dr, dc] of DIRECTIONS4) {
      const r = cur.y + dr;
      const c = cur.x + dc;
      if (!isInside(GRID_ROWS, GRID_COLS, r, c)) continue;
      const cell = this.state.map[r][c];
      if (!(cell.type === "normalSoil" || cell.type === "magicSoil" || cell.type === "moistSoil" || cell.type === "mineralSoil" || cell.type === "toxicSoil")) {
        continue;
      }
      const score = Math.abs(target.x - c) + Math.abs(target.y - r);
      options.push({ row: r, col: c, score });
    }

    options.sort((a, b) => a.score - b.score);
    const pick = options[0];
    if (!pick) return false;

    const cell = this.state.map[pick.row][pick.col];
    cell.type = "empty";
    cell.baseType = "empty";
    invader.state = "digging";
    this.bumpMapVersion();
    return true;
  }

  private recalcInvaderPath(invader: Invader, force = false): boolean {
    const target = this.targetForInvader(invader);
    const current = invaderCell(invader);

    const staleMap = invader.pathState.pathMapVersion !== this.mapVersion;
    const staleTarget =
      invader.pathState.targetPosition.x !== target.x || invader.pathState.targetPosition.y !== target.y;

    if (!force && !staleMap && !staleTarget && invader.pathState.path.length > 1) {
      return true;
    }

    const crowd = this.crowdMap();
    const path = findPathAStarWithCost(this.state.map, current, target, (_, to, toCell) =>
      this.invaderStepCost(invader, to, toCell, crowd),
    );

    if (path.length === 0) {
      const dug = this.tryMinerDig(invader, target);
      if (dug) {
        const pathRetry = findPathAStarWithCost(this.state.map, current, target, (_, to, toCell) =>
          this.invaderStepCost(invader, to, toCell, this.crowdMap()),
        );
        if (pathRetry.length === 0) return false;
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

  private cellCapacity(invader: Invader): number {
    if (invader.kind === "heavy") return 1;
    if (invader.kind === "scout") return 3;
    return 2;
  }

  confirmCorePlacement(): boolean {
    if (this.state.phase !== "placementConfirmation" || !this.state.isPlacementConfirmOpen) return false;
    if (this.placementProcessing) return false;

    const pending = this.state.selectedPlacementPosition;
    if (!pending) {
      this.setMessage("配置場所を選択してください");
      return false;
    }

    this.placementProcessing = true;

    const result = canPlaceCore(pending.y, pending.x, this.state);
    if (!result.canPlace) {
      this.setMessage("選択した場所には配置できなくなりました。別の場所を選択してください");
      this.state.selectedPlacementPosition = null;
      this.state.isPlacementConfirmOpen = false;
      this.state.phase = "allyPlacement";
      this.refreshCorePlacementCache();
      this.placementProcessing = false;
      return false;
    }

    const pathFromEntrance = findPathBfs(this.state.map, this.state.entrancePosition, pending);
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
    this.state.waveCountdownSec = CORE_PLACEMENT_COUNTDOWN_SEC;
    this.queuedInWave = enemiesForWave(this.state.wave.wave);
    this.state.wave.remainingEnemiesInWave = this.queuedInWave;
    this.state.wave.spawnTimerSec = WAVE_BALANCE.spawnEverySec;
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

  cancelCorePlacementConfirmation(): void {
    if (this.state.phase !== "placementConfirmation") return;
    this.state.selectedPlacementPosition = null;
    this.state.isPlacementConfirmOpen = false;
    this.state.phase = "allyPlacement";
    this.setMessage("配置場所を選び直してください");
    this.refreshCorePlacementCache();
    this.emitHud(true);
  }

  private handleNoCorePlaceableCells(): void {
    if (this.state.corePlacementRetryCount === 0) {
      this.state.corePlacementRetryCount = 1;
      this.state.remainingDigCount = Math.min(this.state.maxDigCount, this.state.remainingDigCount + 5);
      this.state.phase = "preparation";
      this.state.paused = false;
      this.state.wave.nextWaveInSec = EXTRA_PREPARATION_TIME_SEC;
      this.setMessage("魔界核を配置できる空間がありません。追加時間内に配置場所を作ってください");
      return;
    }

    this.state.phase = "allyPlacement";
    this.state.paused = true;
    this.setMessage("配置候補が不足しています。自分で掘るか自動配置を選択してください");
  }

  private enterCorePlacementPhase(): void {
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

  shouldShowAutoCorePlaceButton(): boolean {
    return this.state.phase === "allyPlacement" && this.state.corePlacementRetryCount >= 1;
  }

  resumePreparationForCorePlacement(): void {
    if (this.state.phase !== "allyPlacement" && this.state.phase !== "placementConfirmation") return;
    this.state.phase = "preparation";
    this.state.paused = false;
    this.state.selectedPlacementPosition = null;
    this.state.isPlacementConfirmOpen = false;
    this.state.remainingDigCount = Math.min(this.state.maxDigCount, this.state.remainingDigCount + 5);
    this.state.wave.nextWaveInSec = EXTRA_PREPARATION_TIME_SEC;
    this.setMessage("追加準備時間です。配置できる空間を作ってください");
  }

  placeNestNearCore(): void {
    const origin = this.chooseCorePosition() ?? this.state.playerStartPosition;
    const candidates: Vec2[] = [];
    for (const [dr, dc] of DIRECTIONS4) {
      const r = origin.y + dr;
      const c = origin.x + dc;
      if (!isInside(GRID_ROWS, GRID_COLS, r, c)) continue;
      const cell = this.state.map[r][c];
      if (cell.type === "empty") candidates.push({ x: c, y: r });
    }
    if (candidates.length === 0) return;
    const spot = randomPick(candidates);
    const target = this.state.map[spot.y][spot.x];
    target.type = "nest";
    this.state.nests.push(spot);
    this.bumpMapVersion();
  }

  spawnMonsterFromFirstNest(kind: string): void {
    if (hasReachedMonsterLimit(this.state.currentMonsterCount, this.state.maxMonsterCount)) {
      return;
    }
    if (this.state.nests.length === 0) {
      this.setMessage("先に巣を配置してください");
      return;
    }

    const blueprint = MONSTER_BLUEPRINTS.find((item) => item.id === kind);
    if (!blueprint) return;

    for (const [mat, need] of Object.entries(blueprint.cost)) {
      const key = mat as keyof GameState["materials"];
      if (this.state.materials[key] < (need ?? 0)) {
        this.setMessage("素材が不足しています");
        return;
      }
    }

    for (const [mat, need] of Object.entries(blueprint.cost)) {
      const key = mat as keyof GameState["materials"];
      this.state.materials[key] -= need ?? 0;
    }

    const nest = this.state.nests[0];
    const monster = spawnMonsterFromNest(kind, { x: nest.x + 0.5, y: nest.y + 0.5 });
    this.state.monsters.push(monster);
    this.registerBestiaryDiscovery(monster.kind);
    this.pushSpawnEffect(nest.y, nest.x, monster.name, "high", rarityColorByMonsterKind(monster.kind));
    const lines = spawnMessageByMonsterKind(monster.kind);
    for (const line of lines) this.pushToast(line, 2.6);
    this.state.currentMonsterCount = this.countCurrentMonsters();
    this.state.stats.spawnedMonsters += 1;
    this.emitHud();
  }

  private spawnInvader(): void {
    const entrance = this.chooseEntrancePosition();
    const target = this.targetForInvader();

    const bp = randomPick(INVADER_BLUEPRINTS);
    this.invaderSerial += 1;
    const invader: Invader = {
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
      repathTimer: randomFloat() * 0.6,
      attackTimer: 0,
      stuckSec: 0,
      direction: "down",
      bodySize: bp.id === "heavy" ? 1.1 : bp.id === "scout" ? 0.75 : 0.9,
      state: "moving",
    };

    this.recalcInvaderPath(invader, true);
    this.state.invaders.push(invader);
  }

  private updatePhaseTimers(dt: number, realDt: number): void {
    if (this.state.phase === "preparation") {
      this.state.wave.nextWaveInSec -= dt;
      if (this.state.wave.nextWaveInSec <= 0) this.enterCorePlacementPhase();
      return;
    }

    if (this.state.phase === "waveResult") {
      this.state.wave.nextWaveInSec -= dt;
      if (this.state.wave.nextWaveInSec <= 0) {
        this.state.phase = "wave";
        this.state.paused = false;
        this.state.wave.wave += 1;
        this.queuedInWave = enemiesForWave(this.state.wave.wave);
        this.state.wave.remainingEnemiesInWave = this.queuedInWave;
        this.state.wave.spawnTimerSec = 0;
      }
      return;
    }

    if (this.state.phase === "countdown") {
      const before = Math.ceil(this.state.waveCountdownSec);
      this.state.waveCountdownSec = Math.max(0, this.state.waveCountdownSec - realDt);
      const after = Math.ceil(this.state.waveCountdownSec);
      if (after !== before && after > 0) this.setMessage(`${after}`);
      if (before > 0 && after === 0) {
        this.state.phase = "wave";
        this.state.hasGameStarted = true;
        this.state.paused = false;
        this.setMessage("襲撃開始！");
      }
    }
  }

  private updateWaveSpawning(dt: number): void {
    if (this.state.phase !== "wave") return;

    this.state.wave.spawnTimerSec -= dt;
    if (this.queuedInWave > 0 && this.state.wave.spawnTimerSec <= 0) {
      this.spawnInvader();
      this.queuedInWave -= 1;
      this.state.wave.remainingEnemiesInWave = this.queuedInWave;
      this.state.wave.spawnTimerSec = WAVE_BALANCE.spawnEverySec;
    }

    const alive = this.state.invaders.filter((it) => it.state !== "dead").length;
    if (this.queuedInWave <= 0 && alive === 0) {
      if (this.state.wave.wave >= this.state.wave.maxWave) {
        this.state.phase = "victory";
        return;
      }
      const recovered = Math.min(
        this.state.maxDigCount,
        this.state.remainingDigCount + DIG_RECOVERY_PER_WAVE,
      );
      if (recovered > this.state.remainingDigCount) {
        this.state.remainingDigCount = recovered;
        this.pushToast("ウェーブ突破報酬：掘削回数が10回復しました", 2.4);
      }
      this.state.phase = "waveResult";
      this.state.wave.nextWaveInSec = WAVE_BALANCE.betweenWaveSec;
    }
  }

  private updateInvaders(dt: number): void {
    if (this.state.paused || this.state.phase !== "wave") return;

    const occupancyNow = this.crowdMap();
    const occupancyNext = new Map<string, number>();
    const waveSpeedMultiplier = this.state.gameSpeed;

    for (const invader of this.state.invaders) {
      if (invader.state === "dead") continue;

      if (invader.slowedUntil && invader.slowedUntil <= this.state.timeSec) {
        invader.slowedUntil = 0;
        invader.slowMultiplier = 1;
      }
      if (invader.poisonedUntil && invader.poisonedUntil > this.state.timeSec) {
        invader.hp -= (invader.poisonDps ?? 0) * dt;
      }
      if (invader.burnedUntil && invader.burnedUntil > this.state.timeSec) {
        invader.hp -= (invader.burnDps ?? 0) * dt;
      }
      if (invader.hp <= 0) {
        invader.state = "dead";
        if (invader.lastHitByMonsterKind) {
          this.registerBestiaryKill(invader.lastHitByMonsterKind);
        }
        continue;
      }

      const target = this.targetForInvader(invader);

      invader.repathTimer -= dt;
      const targetChanged =
        invader.pathState.targetPosition.x !== target.x ||
        invader.pathState.targetPosition.y !== target.y;
      const needsMapRefresh = invader.pathState.pathMapVersion !== this.mapVersion;

      if (
        invader.repathTimer <= 0 ||
        targetChanged ||
        needsMapRefresh ||
        invader.pathState.path.length <= 1 ||
        invader.stuckSec > 0.9
      ) {
        this.recalcInvaderPath(invader, true);
        invader.repathTimer = 0.45 + ((hash2d(this.state.mapSeed ^ invader.id.length, invaderCell(invader).y, invaderCell(invader).x) % 100) / 1000);
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

      const nextKey = cellKey(nextCell.y, nextCell.x);
      const cap = this.cellCapacity(invader);
      const occ = (occupancyNow.get(nextKey) ?? 0) + (occupancyNext.get(nextKey) ?? 0);

      let speedFactor = 1;
      if (occ >= cap) speedFactor = 0.28;
      if (occ >= cap + 1) speedFactor = 0;

      const statusSlow =
        invader.slowedUntil && invader.slowedUntil > this.state.timeSec
          ? Math.max(0.45, Math.min(1, invader.slowMultiplier ?? 0.72))
          : 1;
      const speed = getEnemyFinalMoveSpeed(invader, waveSpeedMultiplier, speedFactor * statusSlow);
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
      } else if (speed > 0) {
        const step = Math.min(dist, speed * dt);
        const ux = dx / dist;
        const uy = dy / dist;
        invader.direction = directionFromDelta(ux, uy, invader.direction);

        const movingHoriz = Math.abs(ux) > Math.abs(uy);
        if (movingHoriz) {
          invader.position.x += ux * step;
          invader.position.y = Math.round(invader.position.y * 1000) / 1000;
        } else {
          invader.position.y += uy * step;
          invader.position.x = Math.round(invader.position.x * 1000) / 1000;
        }

        if (step < 0.0001) invader.stuckSec += dt;
        else invader.stuckSec = Math.max(0, invader.stuckSec - dt * 0.5);
      } else {
        invader.stuckSec += dt;
      }

      const afterCell = invaderCell(invader);
      const afterKey = cellKey(afterCell.y, afterCell.x);
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
      } else if (invader.state !== "digging") {
        invader.state = "moving";
      }

      if (this.state.corePosition && this.state.coreHp <= 0) this.state.phase = "gameOver";
    }
  }

  private monsterCell(monster: { position: Vec2 }): GridPosition {
    return { x: Math.floor(monster.position.x), y: Math.floor(monster.position.y) };
  }

  private ensureMonsterAiDefaults(monster: { behavior: typeof DEFAULT_ALLY_BEHAVIOR; movementState: AllyMovementState; position: Vec2 }, nowMs: number): void {
    if (!monster.behavior) {
      monster.behavior = { ...DEFAULT_ALLY_BEHAVIOR };
    } else {
      monster.behavior = {
        detectionRange: monster.behavior.detectionRange || DEFAULT_ALLY_BEHAVIOR.detectionRange,
        leashRange: monster.behavior.leashRange || DEFAULT_ALLY_BEHAVIOR.leashRange,
        wanderMoveSpeedMultiplier:
          typeof monster.behavior.wanderMoveSpeedMultiplier === "number"
            ? monster.behavior.wanderMoveSpeedMultiplier
            : DEFAULT_ALLY_BEHAVIOR.wanderMoveSpeedMultiplier,
        canWanderWhenIdle:
          typeof monster.behavior.canWanderWhenIdle === "boolean"
            ? monster.behavior.canWanderWhenIdle
            : DEFAULT_ALLY_BEHAVIOR.canWanderWhenIdle,
        guardCoreBias:
          typeof monster.behavior.guardCoreBias === "boolean"
            ? monster.behavior.guardCoreBias
            : DEFAULT_ALLY_BEHAVIOR.guardCoreBias,
      };
    }

    if (!monster.movementState) {
      const home = this.monsterCell({ position: monster.position });
      monster.movementState = {
        homePosition: home,
        wanderTarget: null,
        targetEnemyId: null,
        path: [],
        currentPathIndex: 0,
        nextDecisionAt: nowMs,
        lastPathCalculatedAt: 0,
        lastDetectionAt: 0,
        chaseLostAt: 0,
      };
    }
  }

  private isAllyPassableCell(row: number, col: number): boolean {
    if (!isInside(GRID_ROWS, GRID_COLS, row, col)) return false;
    const cell = this.state.map[row][col];
    if (!isPassableCellType(cell.type)) return false;
    if (row === this.state.entrancePosition.y && col === this.state.entrancePosition.x) return false;
    return true;
  }

  private allyOccupancy(ignoreMonsterId?: string): Map<string, number> {
    const occ = new Map<string, number>();
    for (const ally of this.state.monsters) {
      if (!ally.isActive || ally.state === "dead") continue;
      if (ignoreMonsterId && ally.id === ignoreMonsterId) continue;
      const c = this.monsterCell(ally);
      const key = cellKey(c.y, c.x);
      occ.set(key, (occ.get(key) ?? 0) + 1);
    }
    return occ;
  }

  private allyTargetSoftCap(invader: Invader): number {
    if (invader.kind === "heavy") return 5;
    if (invader.kind === "purifier") return 5;
    if (invader.kind === "caster") return 4;
    return 3;
  }

  private findInvaderById(id: string | null): Invader | null {
    if (!id) return null;
    return this.state.invaders.find((inv) => inv.id === id && inv.state !== "dead") ?? null;
  }

  private pickAllyTarget(monster: {
    id: string;
    kind: string;
    behavior: typeof DEFAULT_ALLY_BEHAVIOR;
    movementState: AllyMovementState;
    position: Vec2;
  }, assignments: Map<string, number>): Invader | null {
    const from = this.monsterCell(monster);
    const core = this.chooseCorePosition() ?? this.state.playerStartPosition;
    const detection = Math.max(3, monster.behavior.detectionRange);

    const candidates = this.state.invaders
      .filter((inv) => inv.state !== "dead")
      .map((inv) => ({ inv, cell: invaderCell(inv), manhattan: getManhattanDistance(from, invaderCell(inv)) }))
      .filter((entry) => entry.manhattan <= detection)
      .sort((a, b) => a.manhattan - b.manhattan)
      .slice(0, 10);

    let best: Invader | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const entry of candidates) {
      const pathDist = shortestPathDistanceBfs(this.state.map, from, entry.cell);
      if (pathDist == null) continue;

      const assigned = assignments.get(entry.inv.id) ?? 0;
      const cap = this.allyTargetSoftCap(entry.inv);
      const oversubPenalty = assigned >= cap ? (assigned - cap + 1) * 2.25 : 0;

      const nearCore = getManhattanDistance(entry.cell, core);
      const guardBonus = monster.behavior.guardCoreBias ? Math.max(0, 6 - nearCore) * 0.7 : 0;

      const typeBias =
        entry.inv.kind === "caster"
          ? -0.8
          : entry.inv.kind === "heavy"
            ? 0.6
            : entry.inv.kind === "scout"
              ? -0.2
              : 0;

      const score = pathDist + oversubPenalty - guardBonus + typeBias;
      if (score < bestScore) {
        bestScore = score;
        best = entry.inv;
      }
    }

    return best;
  }

  private pickWanderTarget(home: GridPosition, from: GridPosition): GridPosition | null {
    const candidates: GridPosition[] = [];
    for (let r = home.y - ALLY_WANDER_CONFIG.maxDistance; r <= home.y + ALLY_WANDER_CONFIG.maxDistance; r += 1) {
      for (let c = home.x - ALLY_WANDER_CONFIG.maxDistance; c <= home.x + ALLY_WANDER_CONFIG.maxDistance; c += 1) {
        if (!this.isAllyPassableCell(r, c)) continue;
        const distFromHome = Math.abs(r - home.y) + Math.abs(c - home.x);
        if (distFromHome < ALLY_WANDER_CONFIG.minDistance || distFromHome > ALLY_WANDER_CONFIG.maxDistance) {
          continue;
        }
        const distFromCurrent = Math.abs(r - from.y) + Math.abs(c - from.x);
        if (distFromCurrent < ALLY_WANDER_CONFIG.minDistance) continue;
        candidates.push({ x: c, y: r });
      }
    }
    if (candidates.length === 0) return null;
    return randomPick(candidates);
  }

  private buildAllyPath(monster: { id: string; behavior: typeof DEFAULT_ALLY_BEHAVIOR }, start: GridPosition, goal: GridPosition): GridPosition[] {
    const occ = this.allyOccupancy(monster.id);
    return findPathAStarWithCost(this.state.map, start, goal, (_from, to, toCell) => {
      if (!isPassableCellType(toCell.type)) return Number.POSITIVE_INFINITY;
      const key = cellKey(to.y, to.x);
      const crowd = occ.get(key) ?? 0;
      const crowdPenalty = crowd * 0.8;
      const guardPenalty = monster.behavior.guardCoreBias ? 0 : 0.05;
      return 1 + crowdPenalty + guardPenalty;
    });
  }

  private moveMonsterAlongPath(monster: {
    direction: Direction;
    speed: number;
    position: Vec2;
    motionTimer: number;
    motionPhase: number;
    movementState: AllyMovementState;
  }, dt: number, speedMultiplier: number): boolean {
    const path = monster.movementState.path;
    if (path.length === 0) return false;

    const state = monster.movementState;
    let index = Math.max(0, state.currentPathIndex);
    if (index >= path.length) return false;

    const currentCell = this.monsterCell({ position: monster.position });
    if (path[index] && path[index].x === currentCell.x && path[index].y === currentCell.y) {
      index = Math.min(path.length - 1, index + 1);
    }

    const waypointCell = path[index] ?? path[path.length - 1];
    const waypoint = cellCenter(waypointCell);
    const dx = waypoint.x - monster.position.x;
    const dy = waypoint.y - monster.position.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 0.02) {
      state.currentPathIndex = index + 1;
      return index + 1 < path.length;
    }

    const moveSpeed = Math.max(0, monster.speed * speedMultiplier);
    const step = Math.min(dist, moveSpeed * dt);
    if (step <= 0) return false;

    const ux = dx / dist;
    const uy = dy / dist;
    monster.direction = directionFromDelta(ux, uy, monster.direction);

    if (Math.abs(ux) >= Math.abs(uy)) {
      monster.position.x += ux * step;
      monster.position.y = Math.round(monster.position.y * 1000) / 1000;
    } else {
      monster.position.y += uy * step;
      monster.position.x = Math.round(monster.position.x * 1000) / 1000;
    }

    monster.motionTimer += dt;
    monster.motionPhase = (monster.motionPhase + dt * (3.4 + moveSpeed * 1.6)) % (Math.PI * 2);

    if (step + 0.001 >= dist) {
      state.currentPathIndex = index + 1;
    } else {
      state.currentPathIndex = index;
    }

    return true;
  }

  private applyDamageToInvader(invader: Invader, damage: number, attackerKind: string): boolean {
    invader.hp -= Math.max(1, damage);
    invader.lastHitByMonsterKind = attackerKind;
    if (invader.hp <= 0 && invader.state !== "dead") {
      invader.state = "dead";
      this.registerBestiaryKill(attackerKind);
      return true;
    }
    return false;
  }

  private canUseAbility(monster: { abilityState: { lastUsedAt: number; cooldown: number } | null }, nowSec: number): boolean {
    if (!monster.abilityState) return false;
    return nowSec - monster.abilityState.lastUsedAt >= monster.abilityState.cooldown;
  }

  private markAbilityUsed(monster: { abilityState: { lastUsedAt: number } | null }, nowSec: number): void {
    if (!monster.abilityState) return;
    monster.abilityState.lastUsedAt = nowSec;
  }

  private useMonsterAbility(
    monster: {
      id: string;
      kind: string;
      role: string;
      abilityId: string | null;
      abilityState: { lastUsedAt: number; cooldown: number } | null;
      position: Vec2;
      direction: Direction;
      hp: number;
      maxHp: number;
      summonCount: number;
    },
    target: Invader | null,
    nowSec: number,
  ): number {
    if (!monster.abilityId || !this.canUseAbility(monster, nowSec)) return 0;
    const ability = getAbilityDefinition(monster.abilityId);
    if (!ability) return 0;
    const from = this.monsterCell({ position: monster.position });
    let killed = 0;

    if (monster.abilityId === "intimidate") {
      for (const inv of this.state.invaders) {
        if (inv.state === "dead") continue;
        const d = getManhattanDistance(from, invaderCell(inv));
        if (d > ability.range) continue;
        inv.tauntedByMonsterId = monster.id;
        inv.tauntedUntil = this.state.timeSec + 2.6;
      }
      this.markAbilityUsed(monster, nowSec);
      return killed;
    }

    if (monster.abilityId === "manaScales" && target) {
      const tc = invaderCell(target);
      for (const inv of this.state.invaders) {
        if (inv.state === "dead") continue;
        const d = getManhattanDistance(tc, invaderCell(inv));
        if (d > 1) continue;
        if (this.applyDamageToInvader(inv, 6, monster.kind)) killed += 1;
      }
      this.markAbilityUsed(monster, nowSec);
      return killed;
    }

    if (monster.abilityId === "bubbleShot" && target) {
      target.slowedUntil = this.state.timeSec + 2.4;
      target.slowMultiplier = Math.max(0.55, target.slowMultiplier ?? 1, 0.55);
      target.lastHitByMonsterKind = monster.kind;
      if (randomFloat() < 0.18) {
        const mc = this.monsterCell({ position: monster.position });
        const tc = invaderCell(target);
        const dx = tc.x - mc.x;
        const dy = tc.y - mc.y;
        const back = { x: tc.x + Math.sign(dx || 1), y: tc.y + Math.sign(dy || 1) };
        if (isInside(GRID_ROWS, GRID_COLS, back.y, back.x) && isPassableCellType(this.state.map[back.y][back.x].type)) {
          target.position = { x: back.x + 0.5, y: back.y + 0.5 };
        }
      }
      this.markAbilityUsed(monster, nowSec);
      return killed;
    }

    if (monster.abilityId === "infectSpore" && target) {
      target.poisonedUntil = this.state.timeSec + 4.4;
      target.poisonDps = 2.6;
      target.lastHitByMonsterKind = monster.kind;
      for (const other of this.state.invaders) {
        if (other.id === target.id || other.state === "dead") continue;
        if (getManhattanDistance(invaderCell(target), invaderCell(other)) <= 1 && randomFloat() < 0.2) {
          other.poisonedUntil = this.state.timeSec + 2.6;
          other.poisonDps = 1.7;
          other.lastHitByMonsterKind = monster.kind;
        }
      }
      this.markAbilityUsed(monster, nowSec);
      return killed;
    }

    if (monster.abilityId === "runeWarcry") {
      for (const ally of this.state.monsters) {
        if (!ally.isActive || ally.state === "dead") continue;
        if (getManhattanDistance(from, this.monsterCell(ally)) > ability.range) continue;
        ally.buffs = {
          attackMultiplier: 1.22,
          cooldownMultiplier: 0.86,
          until: this.state.timeSec + 4.5,
        };
      }
      this.markAbilityUsed(monster, nowSec);
      return killed;
    }

    if (monster.abilityId === "lifeAttach") {
      const candidates = this.state.monsters
        .filter((ally) => ally.isActive && ally.state !== "dead" && ally.hp < ally.maxHp)
        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
      const heal = candidates[0];
      if (heal && getManhattanDistance(from, this.monsterCell(heal)) <= ability.range) {
        heal.hp = Math.min(heal.maxHp, heal.hp + 15);
        monster.hp = Math.min(monster.maxHp, monster.hp + 3);
        this.markAbilityUsed(monster, nowSec);
      }
      return killed;
    }

    if (monster.abilityId === "heatSpray") {
      const mc = this.monsterCell({ position: monster.position });
      for (const inv of this.state.invaders) {
        if (inv.state === "dead") continue;
        const ic = invaderCell(inv);
        const md = getManhattanDistance(mc, ic);
        if (md > 3) continue;
        const inFront =
          (monster.direction === "up" && ic.y <= mc.y) ||
          (monster.direction === "down" && ic.y >= mc.y) ||
          (monster.direction === "left" && ic.x <= mc.x) ||
          (monster.direction === "right" && ic.x >= mc.x);
        if (!inFront) continue;
        inv.burnedUntil = this.state.timeSec + 3.4;
        inv.burnDps = 3.2;
        inv.lastHitByMonsterKind = monster.kind;
        if (this.applyDamageToInvader(inv, 8, monster.kind)) killed += 1;
      }
      this.markAbilityUsed(monster, nowSec);
      return killed;
    }

    if (monster.abilityId === "shadowLeap" && target) {
      const targetCell = invaderCell(target);
      const path = findPathBfs(this.state.map, from, targetCell);
      if (path.length > 2) {
        const hop = path[Math.min(path.length - 2, 3)];
        monster.position = { x: hop.x + 0.5, y: hop.y + 0.5 };
      }
      this.markAbilityUsed(monster, nowSec);
      return killed;
    }

    if (monster.abilityId === "broodSpawn") {
      if (monster.summonCount >= 3) return 0;
      const mc = this.monsterCell({ position: monster.position });
      const spots = DIRECTIONS4
        .map(([dr, dc]) => ({ y: mc.y + dr, x: mc.x + dc }))
        .filter((p) => isInside(GRID_ROWS, GRID_COLS, p.y, p.x) && isPassableCellType(this.state.map[p.y][p.x].type));
      const spot = spots[0];
      if (spot) {
        const sourceMonster = this.state.monsters.find((m) => m.id === monster.id);
        if (!sourceMonster) return 0;
        const minion = createSummonedMinion(
          sourceMonster,
          { x: spot.x + 0.5, y: spot.y + 0.5 },
        );
        this.state.monsters.push(minion);
        monster.summonCount += 1;
        this.registerBestiaryDiscovery(minion.kind);
        this.pushToast(`${sourceMonster.name}が眷属を生成`, 2.2);
        this.markAbilityUsed(monster, nowSec);
      }
      return 0;
    }

    if (monster.abilityId === "crystalReflect") {
      for (const inv of this.state.invaders) {
        if (inv.state === "dead") continue;
        if (getManhattanDistance(from, invaderCell(inv)) <= 1) {
          if (this.applyDamageToInvader(inv, Math.max(1, Math.floor(inv.attack * 0.2)), monster.kind)) killed += 1;
        }
      }
      this.markAbilityUsed(monster, nowSec);
      return killed;
    }

    return 0;
  }

  private updateMonsters(dt: number): void {
    if (this.state.paused || this.state.phase === "allyPlacement" || this.state.phase === "placementConfirmation" || this.state.phase === "countdown") {
      return;
    }

    const nowMs = Date.now();
    const assignments = new Map<string, number>();
    for (const ally of this.state.monsters) {
      if (!ally.isActive || ally.state === "dead") continue;
      const targetId = ally.movementState?.targetEnemyId;
      if (!targetId) continue;
      assignments.set(targetId, (assignments.get(targetId) ?? 0) + 1);
    }

    let killed = 0;

    for (const monster of this.state.monsters) {
      if (!monster.isActive || monster.state === "dead") continue;

      this.ensureMonsterAiDefaults(monster, nowMs);
      const movement = monster.movementState;
      const from = this.monsterCell(monster);
      if (monster.buffs && monster.buffs.until <= this.state.timeSec) {
        monster.buffs = undefined;
      }

      monster.attackTimer = Math.max(-0.25, monster.attackTimer - dt);

      if (monster.state === "stunned") {
        monster.motionTimer = Math.max(0, monster.motionTimer - dt);
        continue;
      }

      let target = this.findInvaderById(movement.targetEnemyId);
      const timeSinceDetect = nowMs - movement.lastDetectionAt;
      if (!target || timeSinceDetect >= ALLY_DETECTION_INTERVAL) {
        movement.lastDetectionAt = nowMs;
        const nextTarget = this.pickAllyTarget(monster, assignments);
        if (nextTarget && nextTarget.id !== movement.targetEnemyId) {
          if (movement.targetEnemyId) {
            assignments.set(
              movement.targetEnemyId,
              Math.max(0, (assignments.get(movement.targetEnemyId) ?? 1) - 1),
            );
          }
          assignments.set(nextTarget.id, (assignments.get(nextTarget.id) ?? 0) + 1);
        }
        movement.targetEnemyId = nextTarget?.id ?? null;
        target = nextTarget;
      }

      const home = movement.homePosition;
      const distFromHome = getManhattanDistance(from, home);
      const leash = Math.max(4, monster.behavior.leashRange);

      if (target) {
        const targetCell = invaderCell(target);
        const targetDist = Math.hypot(target.position.x - monster.position.x, target.position.y - monster.position.y);

        killed += this.useMonsterAbility(monster, target, this.state.timeSec);

        if (distFromHome > leash + 2) {
          movement.targetEnemyId = null;
          movement.chaseLostAt = nowMs;
          target = null;
        } else if (targetDist <= monster.range) {
          monster.state = "attack";
          movement.path = [];
          movement.currentPathIndex = 0;
          monster.direction = directionFromDelta(
            target.position.x - monster.position.x,
            target.position.y - monster.position.y,
            monster.direction,
          );
          if (monster.attackTimer <= 0) {
            const attackMultiplier = monster.buffs?.attackMultiplier ?? 1;
            const cooldownMultiplier = monster.buffs?.cooldownMultiplier ?? 1;
            const dealt = Math.max(1, Math.floor(monster.attack * attackMultiplier));
            const down = this.applyDamageToInvader(target, dealt, monster.kind);
            monster.attackTimer = monster.attackCooldown * cooldownMultiplier;
            if (down) {
              killed += 1;
              movement.targetEnemyId = null;
            }
          }
        } else {
          monster.state = "chase";
          const shouldRepath =
            movement.path.length === 0 ||
            nowMs - movement.lastPathCalculatedAt >= ALLY_PATH_RECALCULATION_INTERVAL ||
            movement.path[movement.path.length - 1]?.x !== targetCell.x ||
            movement.path[movement.path.length - 1]?.y !== targetCell.y;

          if (shouldRepath) {
            movement.path = this.buildAllyPath(monster, from, targetCell);
            movement.currentPathIndex = 0;
            movement.lastPathCalculatedAt = nowMs;
          }

          if (movement.path.length === 0) {
            if (movement.chaseLostAt === 0) movement.chaseLostAt = nowMs;
            if (nowMs - movement.chaseLostAt > 1400) {
              movement.targetEnemyId = null;
              target = null;
              movement.chaseLostAt = nowMs;
            }
          } else {
            movement.chaseLostAt = 0;
            this.moveMonsterAlongPath(monster, dt, 1);
          }
        }
      }

      if (!target) {
        killed += this.useMonsterAbility(monster, null, this.state.timeSec);
        const atHome = getManhattanDistance(this.monsterCell(monster), home) <= 1;

        if (!atHome) {
          monster.state = "return";
          const shouldRepath =
            movement.path.length === 0 || nowMs - movement.lastPathCalculatedAt >= ALLY_PATH_RECALCULATION_INTERVAL;
          if (shouldRepath) {
            movement.path = this.buildAllyPath(monster, this.monsterCell(monster), home);
            movement.currentPathIndex = 0;
            movement.lastPathCalculatedAt = nowMs;
          }
          this.moveMonsterAlongPath(monster, dt, 1);
          movement.wanderTarget = null;
          continue;
        }

        const canWander = monster.behavior.canWanderWhenIdle && monster.behavior.wanderMoveSpeedMultiplier > 0;
        if (!canWander) {
          monster.state = "idle";
          movement.path = [];
          movement.currentPathIndex = 0;
          continue;
        }

        if (nowMs >= movement.nextDecisionAt) {
          const next = this.pickWanderTarget(home, this.monsterCell(monster));
          movement.wanderTarget = next;
          movement.path = next ? this.buildAllyPath(monster, this.monsterCell(monster), next) : [];
          movement.currentPathIndex = 0;
          movement.lastPathCalculatedAt = nowMs;
          movement.nextDecisionAt =
            nowMs + randomInt(ALLY_WANDER_CONFIG.minWaitTime, ALLY_WANDER_CONFIG.maxWaitTime);
        }

        if (movement.path.length > 0) {
          monster.state = "patrol";
          const moved = this.moveMonsterAlongPath(monster, dt, monster.behavior.wanderMoveSpeedMultiplier);
          if (!moved || movement.currentPathIndex >= movement.path.length) {
            movement.path = [];
          }
        } else {
          monster.state = "idle";
        }
      }
    }

    if (killed > 0) {
      this.state.stats.killedInvaders += killed;
      this.state.score += killed * 10;
    }

    this.state.invaders = this.state.invaders.filter((invader) => invader.state !== "dead" && invader.hp > 0);
    this.state.monsters = this.state.monsters.filter((monster) => monster.state !== "dead");
    this.state.currentMonsterCount = this.countCurrentMonsters();
  }

  tick(deltaSecRaw: number): void {
    if (this.state.phase === "gameOver" || this.state.phase === "victory") {
      this.updateUiEffects(deltaSecRaw);
      this.emitHud(true);
      return;
    }

    const frozenByPhase =
      this.state.phase === "allyPlacement" ||
      this.state.phase === "placementConfirmation" ||
      this.state.phase === "countdown";
    const frozen = this.state.paused || frozenByPhase;
    const deltaSec = frozen ? 0 : deltaSecRaw * this.state.gameSpeed;

    this.updateUiEffects(deltaSecRaw);
    if (!frozenByPhase) this.state.timeSec += deltaSec;

    if (DIG_BALANCE.regenPerSecond > 0 && this.state.remainingDigCount < this.state.maxDigCount) {
      const next = this.state.remainingDigCount + DIG_BALANCE.regenPerSecond * deltaSec;
      this.state.remainingDigCount = Math.min(this.state.maxDigCount, Math.floor(next));
    }

    this.updatePhaseTimers(deltaSec, deltaSecRaw);
    this.updateWaveSpawning(deltaSec);
    this.updateInvaders(deltaSec);
    this.updateMonsters(deltaSec);

    this.emitHud();
  }

  getCellAt(row: number, col: number): MapCell | null {
    if (!isInside(GRID_ROWS, GRID_COLS, row, col)) return null;
    return this.state.map[row][col] ?? null;
  }

  isCellDiggable(row: number, col: number): boolean {
    if (!this.canDigNow()) return false;
    return canDigCell(row, col, this.state.map, this.state.remainingDigCount);
  }

  isCellBlocked(row: number, col: number): boolean {
    const cell = this.getCellAt(row, col);
    if (!cell) return true;
    return cell.type === "hardRock" || !isPassableCellType(cell.type);
  }

  inspectCell(row: number, col: number): {
    soilLabel: string;
    depthLabel: string;
    spawnTierLabel: string;
    spawnRate: number;
    spawnCandidates: string;
    diggable: boolean;
    materialLabel: string;
  } | null {
    const cell = this.getCellAt(row, col);
    if (!cell) return null;
    const depthLayer = getDepthLayer(row);
    const spawnTier: MonsterSpawnTier = cell.spawnTier ?? "normal";
    const spawnRate = getFinalSpawnRate(cell.type, row, spawnTier);
    const material = materialFromSoil(cell.type);
    const soilLabelByType: Record<string, string> = {
      normalSoil: "通常の土",
      magicSoil: "魔力を含む土",
      moistSoil: "湿った土",
      mineralSoil: "鉱物を含む土",
      toxicSoil: "毒性の土",
      hardRock: "岩盤",
      empty: "空洞",
      entrance: "入口",
      coreRoom: "魔界核",
      nest: "巣",
      trap: "罠",
    };
    const materialLabelByKey: Record<string, string> = {
      manaCrystal: "魔力結晶",
      lifeWater: "生命水",
      voidIron: "魔鉄",
      toxinSpore: "毒胞子",
    };

    return {
      soilLabel: soilLabelByType[cell.type] ?? cell.type,
      depthLabel: DEPTH_LAYER_COLORS[depthLayer].name,
      spawnTierLabel: getMonsterSpawnTierLabel(spawnTier),
      spawnRate,
      spawnCandidates: pickSpawnCandidatesBySoil(cell.type),
      diggable: this.isCellDiggable(row, col),
      materialLabel: material ? materialLabelByKey[material] ?? material : "なし",
    };
  }

  refreshDerivedState(): void {
    this.state.currentMonsterCount = this.countCurrentMonsters();
    this.emitHud(true);
  }

  restart(): void {
    const fresh = new GameEngine();
    this.state = fresh.state;
    this.mapVersion = 1;
    this.dragVisited.clear();
    this.lastDragCell = null;
    this.queuedInWave = 0;
    this.corePlaceableKeys.clear();
    this.invaderSerial = 0;
    this.placementProcessing = false;
    this.phaseBeforePause = null;
    this.emitHud(true);
  }

  getMapCopy(): MapCell[][] {
    return cloneMap(this.state.map);
  }
}
