export const MAP_COLUMNS = 48;
export const MAP_ROWS = 24;
export const GRID_COLS = MAP_COLUMNS;
export const GRID_ROWS = MAP_ROWS;

export const DEPTH_LAYER_HEIGHT = 8;
export type DepthLayer = 0 | 1 | 2;

export function getDepthLayer(row: number): DepthLayer {
  return Math.min(2, Math.floor(row / DEPTH_LAYER_HEIGHT)) as DepthLayer;
}

export const DEPTH_LAYER_COLORS: Record<
  DepthLayer,
  {
    name: string;
    base: string;
    light: string;
    dark: string;
    border: string;
    particle: string;
  }
> = {
  0: {
    name: "浅層",
    base: "#76503a",
    light: "#91694e",
    dark: "#503526",
    border: "#39271e",
    particle: "#aa7958",
  },
  1: {
    name: "中層",
    base: "#604034",
    light: "#7d5544",
    dark: "#3e2924",
    border: "#2e1e1a",
    particle: "#91604c",
  },
  2: {
    name: "深層",
    base: "#3b3548",
    light: "#504760",
    dark: "#272330",
    border: "#1c1924",
    particle: "#675b78",
  },
};

export const DEPTH_LAYER_SOIL_RATIOS: Record<
  DepthLayer,
  {
    normalSoil: number;
    magicSoil: number;
    moistSoil: number;
    mineralSoil: number;
    toxicSoil: number;
  }
> = {
  0: {
    normalSoil: 0.75,
    magicSoil: 0.05,
    moistSoil: 0.12,
    mineralSoil: 0.04,
    toxicSoil: 0.04,
  },
  1: {
    normalSoil: 0.58,
    magicSoil: 0.14,
    moistSoil: 0.09,
    mineralSoil: 0.12,
    toxicSoil: 0.07,
  },
  2: {
    normalSoil: 0.42,
    magicSoil: 0.2,
    moistSoil: 0.08,
    mineralSoil: 0.16,
    toxicSoil: 0.14,
  },
};

export const DEPTH_LAYER_SPAWN_TUNING: Record<
  DepthLayer,
  {
    spawnRateMultiplier: number;
    monsterWeightBonus: Partial<Record<"slime" | "wisp" | "ironMole" | "poisonBug" | "shadowMimic", number>>;
  }
> = {
  0: {
    spawnRateMultiplier: 0.95,
    monsterWeightBonus: { slime: 1.3, wisp: 1.05, poisonBug: 0.85, ironMole: 0.8, shadowMimic: 0.7 },
  },
  1: {
    spawnRateMultiplier: 1,
    monsterWeightBonus: { slime: 1, wisp: 1.15, poisonBug: 1, ironMole: 1.15, shadowMimic: 1 },
  },
  2: {
    spawnRateMultiplier: 1.12,
    monsterWeightBonus: { slime: 0.82, wisp: 1.25, poisonBug: 1.2, ironMole: 1.22, shadowMimic: 1.35 },
  },
};

export const DEPTH_LAYER_MATERIAL_BONUS_CHANCE: Record<DepthLayer, number> = {
  0: 0,
  1: 0.18,
  2: 0.32,
};

export const MONSTER_SPAWN_TIER_MULTIPLIERS = {
  normal: 1,
  high: 1.5,
  veryHigh: 2.2,
} as const;

export function getMonsterSpawnTier(spawnRate: number): "normal" | "high" | "veryHigh" {
  if (spawnRate >= 0.35) return "veryHigh";
  if (spawnRate >= 0.2) return "high";
  return "normal";
}

export const SPAWN_TIER_CLUSTER_SIZE_MIN = 2;
export const SPAWN_TIER_CLUSTER_SIZE_MAX = 5;

export const DEPTH_LAYER_TIER_RATIOS: Record<
  DepthLayer,
  {
    normal: number;
    high: number;
    veryHigh: number;
  }
> = {
  0: {
    normal: 0.78,
    high: 0.19,
    veryHigh: 0.03,
  },
  1: {
    normal: 0.68,
    high: 0.24,
    veryHigh: 0.08,
  },
  2: {
    normal: 0.58,
    high: 0.27,
    veryHigh: 0.15,
  },
};

export const DIG_BREAK_ANIMATION_DURATION = 180;
export const MIN_CELL_SIZE = 12;

export const HUD_NOTIFY_INTERVAL_MS = 150;
export const INITIAL_PREPARATION_TIME = 60;
export const EXTRA_PREPARATION_TIME_SEC = 30;
export const CORE_PLACEMENT_COUNTDOWN_SEC = 3;
export const MIN_CORE_PATH_DISTANCE = 8;
export const INITIAL_MAX_DIG_COUNT = 150;
export const INITIAL_REMAINING_DIG_COUNT = 150;
export const DIG_RECOVERY_PER_WAVE = 10;

export const DIG_BALANCE = {
  maxDigCount: INITIAL_MAX_DIG_COUNT,
  regenPerSecond: 0,
};

export const SPAWN_BALANCE = {
  naturalSpawnChance: {
    normalSoil: 0.05,
    magicSoil: 0.24,
    moistSoil: 0.28,
    mineralSoil: 0.2,
    toxicSoil: 0.26,
  },
  naturalMonsterSpawnMultiplier: 1.75,
  maxNaturalMonsterSpawnRate: 0.45,
  naturalSpawnWeights: {
    normalSoil: [
      { monsterId: "slime", weight: 60 },
      { monsterId: "wisp", weight: 25 },
      { monsterId: "poisonBug", weight: 15 },
    ],
    magicSoil: [
      { monsterId: "wisp", weight: 70 },
      { monsterId: "shadowMimic", weight: 20 },
      { monsterId: "poisonBug", weight: 10 },
    ],
    moistSoil: [
      { monsterId: "slime", weight: 65 },
      { monsterId: "wisp", weight: 25 },
      { monsterId: "poisonBug", weight: 10 },
    ],
    mineralSoil: [
      { monsterId: "ironMole", weight: 60 },
      { monsterId: "slime", weight: 30 },
      { monsterId: "wisp", weight: 10 },
    ],
    toxicSoil: [
      { monsterId: "poisonBug", weight: 65 },
      { monsterId: "slime", weight: 25 },
      { monsterId: "shadowMimic", weight: 10 },
    ],
  },
  maxMonsterCount: 15,
};

export const WAVE_BALANCE = {
  preparationSec: INITIAL_PREPARATION_TIME,
  betweenWaveSec: 30,
  initialEnemies: 8,
  enemiesPerWave: 3,
  spawnEverySec: 1.8,
  maxWave: 10,
};

export const ENEMY_MOVE_SPEED_MULTIPLIER = 0.6;

export const ENEMY_BALANCE = {
  speedMultiplier: 0.5,
};

export const ALLY_WANDER_CONFIG = {
  minWaitTime: 1000,
  maxWaitTime: 3000,
  minDistance: 1,
  maxDistance: 5,
  moveSpeedMultiplier: 0.65,
} as const;

export const DEFAULT_ALLY_DETECTION_RANGE = 7;
export const DEFAULT_ALLY_LEASH_RANGE = 12;
export const ALLY_PATH_RECALCULATION_INTERVAL = 350;
export const ALLY_DETECTION_INTERVAL = 300;
