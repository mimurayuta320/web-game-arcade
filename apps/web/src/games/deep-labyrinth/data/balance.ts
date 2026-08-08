import {
  DEPTH_LAYER_COUNT,
  DEPTH_LAYER_HEIGHT as DEPTH_LAYER_HEIGHT_CONFIG,
  DEPTH_LAYERS,
  type DepthLayer,
} from "./mapConfig";

export const MAP_COLUMNS = 48;
export const MAP_ROWS = 40;
export const GRID_COLS = MAP_COLUMNS;
export const GRID_ROWS = MAP_ROWS;

export const DEPTH_LAYER_HEIGHT = DEPTH_LAYER_HEIGHT_CONFIG;
export type { DepthLayer };
export { DEPTH_LAYER_COUNT };

export function getDepthLayer(row: number): DepthLayer {
  return Math.min(
    DEPTH_LAYER_COUNT - 1,
    Math.floor(row / DEPTH_LAYER_HEIGHT),
  ) as DepthLayer;
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
    name: DEPTH_LAYERS[0].name,
    base: DEPTH_LAYERS[0].baseColor,
    light: DEPTH_LAYERS[0].accentColor,
    dark: DEPTH_LAYERS[0].darkColor,
    border: DEPTH_LAYERS[0].darkColor,
    particle: DEPTH_LAYERS[0].accentColor,
  },
  1: {
    name: DEPTH_LAYERS[1].name,
    base: DEPTH_LAYERS[1].baseColor,
    light: DEPTH_LAYERS[1].accentColor,
    dark: DEPTH_LAYERS[1].darkColor,
    border: DEPTH_LAYERS[1].darkColor,
    particle: DEPTH_LAYERS[1].accentColor,
  },
  2: {
    name: DEPTH_LAYERS[2].name,
    base: DEPTH_LAYERS[2].baseColor,
    light: DEPTH_LAYERS[2].accentColor,
    dark: DEPTH_LAYERS[2].darkColor,
    border: DEPTH_LAYERS[2].darkColor,
    particle: DEPTH_LAYERS[2].accentColor,
  },
  3: {
    name: DEPTH_LAYERS[3].name,
    base: DEPTH_LAYERS[3].baseColor,
    light: DEPTH_LAYERS[3].accentColor,
    dark: DEPTH_LAYERS[3].darkColor,
    border: DEPTH_LAYERS[3].darkColor,
    particle: DEPTH_LAYERS[3].accentColor,
  },
  4: {
    name: DEPTH_LAYERS[4].name,
    base: DEPTH_LAYERS[4].baseColor,
    light: DEPTH_LAYERS[4].accentColor,
    dark: DEPTH_LAYERS[4].darkColor,
    border: DEPTH_LAYERS[4].darkColor,
    particle: DEPTH_LAYERS[4].accentColor,
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
    normalSoil: 0.68,
    magicSoil: 0.05,
    moistSoil: 0.2,
    mineralSoil: 0.04,
    toxicSoil: 0.03,
  },
  1: {
    normalSoil: 0.52,
    magicSoil: 0.08,
    moistSoil: 0.1,
    mineralSoil: 0.24,
    toxicSoil: 0.06,
  },
  2: {
    normalSoil: 0.26,
    magicSoil: 0.3,
    moistSoil: 0.08,
    mineralSoil: 0.24,
    toxicSoil: 0.12,
  },
  3: {
    normalSoil: 0.18,
    magicSoil: 0.31,
    moistSoil: 0.08,
    mineralSoil: 0.14,
    toxicSoil: 0.29,
  },
  4: {
    normalSoil: 0.1,
    magicSoil: 0.32,
    moistSoil: 0.06,
    mineralSoil: 0.28,
    toxicSoil: 0.24,
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
    spawnRateMultiplier: 0.92,
    monsterWeightBonus: { slime: 1.3, wisp: 1.05, poisonBug: 0.85, ironMole: 0.8, shadowMimic: 0.7 },
  },
  1: {
    spawnRateMultiplier: 1,
    monsterWeightBonus: { slime: 1, wisp: 1.15, poisonBug: 1, ironMole: 1.15, shadowMimic: 1 },
  },
  2: {
    spawnRateMultiplier: 1.08,
    monsterWeightBonus: { slime: 0.82, wisp: 1.25, poisonBug: 1.2, ironMole: 1.22, shadowMimic: 1.35 },
  },
  3: {
    spawnRateMultiplier: 1.14,
    monsterWeightBonus: { slime: 0.72, wisp: 1.3, poisonBug: 1.24, ironMole: 1.2, shadowMimic: 1.42 },
  },
  4: {
    spawnRateMultiplier: 1.2,
    monsterWeightBonus: { slime: 0.66, wisp: 1.36, poisonBug: 1.28, ironMole: 1.18, shadowMimic: 1.52 },
  },
};

export const DEPTH_LAYER_MATERIAL_BONUS_CHANCE: Record<DepthLayer, number> = {
  0: 0.02,
  1: 0.08,
  2: 0.18,
  3: 0.27,
  4: 0.35,
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
    normal: 0.84,
    high: 0.14,
    veryHigh: 0.02,
  },
  1: {
    normal: 0.75,
    high: 0.19,
    veryHigh: 0.06,
  },
  2: {
    normal: 0.62,
    high: 0.25,
    veryHigh: 0.13,
  },
  3: {
    normal: 0.52,
    high: 0.28,
    veryHigh: 0.2,
  },
  4: {
    normal: 0.4,
    high: 0.34,
    veryHigh: 0.26,
  },
};

export const DIG_BREAK_ANIMATION_DURATION = 180;
export const MIN_CELL_SIZE = 12;

export const HUD_NOTIFY_INTERVAL_MS = 200;
export const INITIAL_PREPARATION_TIME = 60;
export const EXTRA_PREPARATION_TIME_SEC = 30;
export const CORE_PLACEMENT_COUNTDOWN_SEC = 3;
export const BETWEEN_WAVE_PREPARATION_TIME = 15;
export const MIN_CORE_PATH_DISTANCE = 8;
export const INITIAL_MAX_DIG_COUNT = 600;
export const INITIAL_REMAINING_DIG_COUNT = 600;
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
export const ALLY_PATH_RECALCULATION_INTERVAL = 500;
export const ALLY_DETECTION_INTERVAL = 400;

export const PERFORMANCE_CONFIG = {
  logicUpdatesPerSecond: 30,
  logicUpdatesPerSecondLowPower: 15,
  hudUpdateIntervalMs: 200,
  maxDeltaTimeMs: 100,
  maxRenderPixelRatio: 1.5,
  lowPowerRenderPixelRatio: 1,
  lowPowerDetectionIntervalMs: 700,
  maxPathfindingPerLogicStep: 2,
  pathRecalculationCooldownMs: 500,
  maxDigBreakEffects: 120,
  maxSpawnEffects: 80,
};
