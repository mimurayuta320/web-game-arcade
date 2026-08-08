export type SoilType = "normalSoil" | "magicSoil" | "moistSoil" | "mineralSoil" | "toxicSoil";

export type CellType =
  | "hardRock"
  | SoilType
  | "empty"
  | "coreRoom"
  | "entrance"
  | "nest"
  | "trap";

export type MonsterState = "idle" | "patrol" | "chase" | "attack" | "return" | "stunned" | "dead";
export type InvaderState = "moving" | "attacking" | "digging" | "dead";
export type MonsterRole = "tank" | "melee" | "ranged" | "support" | "healer" | "debuffer" | "summoner";
export type MonsterRarity = "common" | "uncommon" | "rare" | "epic";
export type GamePhase =
  | "initialPreparation"
  | "playerPlacement"
  | "placementConfirmation"
  | "countdown"
  | "wave"
  | "waveComplete"
  | "betweenWavePreparation"
  | "playerReposition"
  | "repositionConfirmation"
  | "paused"
  | "gameOver"
  | "victory";
export type Direction = "up" | "down" | "left" | "right";
export type DepthLayer = 0 | 1 | 2 | 3 | 4;
export type MonsterSpawnTier = "normal" | "high" | "veryHigh";

export type MaterialKey = "manaCrystal" | "lifeWater" | "voidIron" | "toxinSpore";
export type MonsterLimit = number | null;

export interface TileVariant {
  crackType: number;
  edgeType: number;
  brightness: number;
  decorationType: number;
}

export interface MapCell {
  row: number;
  col: number;
  type: CellType;
  spawnTier: MonsterSpawnTier;
  baseType: CellType;
  hp: number;
  maxHp: number;
  digging: boolean;
  digProgress: number;
  tileVariant: TileVariant;
}

export interface Vec2 {
  x: number;
  y: number;
}

export type GridPosition = Vec2;

export interface AllyMovementState {
  homePosition: GridPosition;
  wanderTarget: GridPosition | null;
  targetEnemyId: string | null;
  path: GridPosition[];
  currentPathIndex: number;
  nextDecisionAt: number;
  lastPathCalculatedAt: number;
  lastDetectionAt: number;
  chaseLostAt: number;
}

export interface AllyBehaviorProfile {
  detectionRange: number;
  leashRange: number;
  wanderMoveSpeedMultiplier: number;
  canWanderWhenIdle: boolean;
  guardCoreBias: boolean;
}

export interface AbilityState {
  abilityId: string;
  lastUsedAt: number;
  cooldown: number;
}

export interface MonsterVisualConfig {
  bodyColor: string;
  accentColor: string;
  eyeColor: string;
  shape: string;
  hasHorns?: boolean;
  hasWings?: boolean;
  hasShell?: boolean;
  hasTail?: boolean;
  hasGlow?: boolean;
}

export interface EnemyPathState {
  path: GridPosition[];
  currentPathIndex: number;
  targetPosition: GridPosition;
  pathMapVersion: number;
}

export interface Monster {
  id: string;
  kind: string;
  name: string;
  position: Vec2;
  hp: number;
  maxHp: number;
  speed: number;
  attack: number;
  range: number;
  attackCooldown: number;
  attackTimer: number;
  isActive: boolean;
  state: MonsterState;
  direction: Direction;
  motionPhase: number;
  motionTimer: number;
  movementState: AllyMovementState;
  behavior: AllyBehaviorProfile;
  role: MonsterRole;
  rarity: MonsterRarity;
  description: string;
  defense: number;
  abilityId: string | null;
  abilityState: AbilityState | null;
  visualConfig: MonsterVisualConfig;
  summonParentId: string | null;
  summonCount: number;
  isSummonedTemporary?: boolean;
  buffs?: {
    attackMultiplier: number;
    cooldownMultiplier: number;
    until: number;
  };
}

export interface Invader {
  id: string;
  kind: string;
  position: Vec2;
  hp: number;
  maxHp: number;
  speed: number;
  attack: number;
  range: number;
  target: Vec2;
  path: Vec2[];
  pathIndex: number;
  pathState: EnemyPathState;
  lastPathCalculatedAtMs?: number;
  repathTimer: number;
  attackTimer: number;
  stuckSec: number;
  direction: Direction;
  bodySize: number;
  state: InvaderState;
  slowedUntil?: number;
  slowMultiplier?: number;
  poisonedUntil?: number;
  poisonDps?: number;
  burnedUntil?: number;
  burnDps?: number;
  tauntedByMonsterId?: string | null;
  tauntedUntil?: number;
  lastHitByMonsterKind?: string | null;
}

export interface DigTask {
  key: string;
  row: number;
  col: number;
  totalSec: number;
  remainingSec: number;
}

export interface DigParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

export interface DigBreakEffect {
  id: string;
  row: number;
  column: number;
  soilType: SoilType;
  depthLayer: DepthLayer;
  startedAt: number;
  duration: number;
  particles: DigParticle[];
}

export interface WaveState {
  wave: number;
  maxWave: number;
  remainingEnemiesInWave: number;
  nextWaveInSec: number;
  spawnTimerSec: number;
}

export interface GameStats {
  totalDugCount: number;
  killedInvaders: number;
  spawnedMonsters: number;
  collectedMaterials: number;
}

export interface BestiaryEntry {
  id: string;
  discovered: boolean;
  discoveredCount: number;
  killCount: number;
}

export interface SpawnEffect {
  id: string;
  row: number;
  col: number;
  monsterName: string;
  spawnTier: MonsterSpawnTier;
  glowColor: string;
  elapsedSec: number;
  durationSec: number;
}

export interface ToastMessage {
  id: string;
  text: string;
  ttlSec: number;
}

export interface CorePlacementResult {
  canPlace: boolean;
  reason?: string;
  pathDistance?: number;
}

export type MapValidationResult = {
  valid: boolean;
  path: GridPosition[];
  pathLength: number;
  turnCount: number;
  coreCandidateCount: number;
  reasons: string[];
};

export interface GameState {
  phase: GamePhase;
  timeSec: number;
  mapSeed: number;
  mapVersion: number;
  map: MapCell[][];
  entrancePosition: GridPosition;
  playerStartPosition: GridPosition;
  playerAreaCells: GridPosition[];
  materials: Record<MaterialKey, number>;
  maxDigCount: number;
  remainingDigCount: number;
  totalDugCount: number;
  currentMonsterCount: number;
  maxMonsterCount: MonsterLimit;
  monsters: Monster[];
  invaders: Invader[];
  corePosition: Vec2 | null;
  selectedPlacementPosition: Vec2 | null;
  confirmedAllyPosition: Vec2 | null;
  isPlacementConfirmOpen: boolean;
  hasGameStarted: boolean;
  nests: Vec2[];
  traps: Vec2[];
  coreHp: number;
  coreMaxHp: number;
  score: number;
  gameSpeed: 1 | 2 | 3;
  paused: boolean;
  wave: WaveState;
  stats: GameStats;
  bestiary: Record<string, BestiaryEntry>;
  message: string;
  debugEnabled: boolean;
  corePlacementRetryCount: number;
  waveCountdownSec: number;
  toasts: ToastMessage[];
  spawnEffects: SpawnEffect[];
  digBreakEffects: DigBreakEffect[];
}

export interface HudSnapshot {
  phase: GamePhase;
  phaseLabel: string;
  allyCount: number;
  summonedCount: number;
  remainingDigCount: number;
  maxDigCount: number;
  currentMonsterCount: number;
  enemyCount: number;
  wave: number;
  maxWave: number;
  playerHp: number;
  playerMaxHp: number;
  coreHp: number;
  coreMaxHp: number;
  corePlaced: boolean;
  nextWaveInSec: number;
  waveCountdownSec: number;
  paused: boolean;
  depthLabel: string;
}
