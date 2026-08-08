export type DepthLayer = 0 | 1 | 2 | 3 | 4;

export const DEPTH_LAYER_HEIGHT = 8;
export const DEPTH_LAYER_COUNT = 5;

export const DEPTH_LAYERS = [
  {
    id: 0,
    name: "浅層",
    startRow: 0,
    endRow: 7,
    baseColor: "#76503a",
    darkColor: "#503526",
    accentColor: "#aa7958",
  },
  {
    id: 1,
    name: "岩盤層",
    startRow: 8,
    endRow: 15,
    baseColor: "#624137",
    darkColor: "#3e2924",
    accentColor: "#956250",
  },
  {
    id: 2,
    name: "魔晶層",
    startRow: 16,
    endRow: 23,
    baseColor: "#41425c",
    darkColor: "#292a3d",
    accentColor: "#686b96",
  },
  {
    id: 3,
    name: "瘴気層",
    startRow: 24,
    endRow: 31,
    baseColor: "#37463b",
    darkColor: "#222d27",
    accentColor: "#617967",
  },
  {
    id: 4,
    name: "深淵層",
    startRow: 32,
    endRow: 39,
    baseColor: "#30283f",
    darkColor: "#1d1827",
    accentColor: "#9170b7",
  },
] as const;

export const RARITY_RATES_BY_DEPTH: Record<
  DepthLayer,
  {
    common: number;
    uncommon: number;
    rare: number;
    epic: number;
  }
> = {
  0: {
    common: 0.78,
    uncommon: 0.2,
    rare: 0.02,
    epic: 0,
  },
  1: {
    common: 0.6,
    uncommon: 0.32,
    rare: 0.08,
    epic: 0,
  },
  2: {
    common: 0.4,
    uncommon: 0.4,
    rare: 0.18,
    epic: 0.02,
  },
  3: {
    common: 0.22,
    uncommon: 0.38,
    rare: 0.34,
    epic: 0.06,
  },
  4: {
    common: 0.1,
    uncommon: 0.25,
    rare: 0.48,
    epic: 0.17,
  },
};

export function assertRarityRatesByDepth(): void {
  for (const layer of DEPTH_LAYERS) {
    const rates = RARITY_RATES_BY_DEPTH[layer.id];
    const sum = rates.common + rates.uncommon + rates.rare + rates.epic;
    if (Math.abs(sum - 1) > 1e-9) {
      throw new Error(`RARITY_RATES_BY_DEPTH[${layer.id}] must sum to 1.0, got ${sum}`);
    }
  }
}

assertRarityRatesByDepth();
