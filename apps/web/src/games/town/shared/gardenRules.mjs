// My Garden rules shared by the server (server/town-garden.mjs) and the client,
// so both compute the same growth, stages and unlocks. Plain JS so Node can import it.
// Every function takes the "garden" section of economy.json as `cfg`.

/**
 * @typedef {{ id: string; growMs: number; unlock?: number; season?: string; rare?: boolean }} CropCfg
 * @typedef {{ id: string; plantedAt: number; growth: number; calcAt: number; fert?: string; careWet?: number; careDry?: number; ripeAt?: number }} PlotCrop
 * @typedef {{ x: number; y: number; wetUntil?: number; weed?: boolean; bug?: boolean; crop?: PlotCrop | null }} GardenPlot
 * @typedef {{ kind: string; x: number; y: number }} GardenDeco
 */

const JST_MS = 9 * 60 * 60 * 1000;

/** Season in Japan for a timestamp. */
export function seasonOf(ts) {
  const month = new Date(ts + JST_MS).getUTCMonth() + 1;
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

export const SEASON_LABEL = { spring: "はる", summer: "なつ", autumn: "あき", winter: "ふゆ" };

/** Total XP needed to reach `level` (level 1 needs 0). */
export function xpForLevel(level) {
  return level <= 1 ? 0 : Math.round(20 * (level - 1) ** 1.6);
}

export function levelFromXp(xp, maxLevel) {
  let level = 1;
  while (level < maxLevel && xp >= xpForLevel(level + 1)) level += 1;
  return level;
}

export function gardenSizeFor(level, cfg) {
  let size = cfg.sizes[0].size;
  for (const step of cfg.sizes) if (level >= step.level) size = step.size;
  return size;
}

export function maxPlotsFor(level, cfg) {
  return Math.min(cfg.plotsMax, cfg.plotsBase + cfg.plotsPerLevel * (level - 1));
}

/** Gate at the middle of the front edge (leads back to the plaza). */
export function gardenDoor(size) {
  return [[size / 2 - 1, size - 1], [size / 2, size - 1]];
}

export function gardenSpawn(size) {
  return [size / 2, size - 2];
}

export function isDoorTile(size, x, y) {
  return gardenDoor(size).some(([dx, dy]) => dx === x && dy === y);
}

function near(decos, kind, x, y, radius) {
  return decos.some((d) => d.kind === kind && Math.abs(d.x - x) <= radius && Math.abs(d.y - y) <= radius);
}

/** A sprinkler next to the plot keeps its soil wet. */
export function isSprinkled(decos, x, y, cfg) {
  return near(decos, "sprinkler", x, y, cfg.sprinklerRadius);
}

/** A scarecrow nearby keeps bugs away. */
export function isGuarded(decos, x, y, cfg) {
  return near(decos, "scarecrow", x, y, cfg.scarecrowRadius);
}

export function isWet(plot, now, sprinkled) {
  return sprinkled || (plot.wetUntil || 0) > now;
}

function fertDef(cfg, id) {
  return cfg.ferts.find((f) => f.id === id);
}

/** Growth speed multiplier from fertilizer, season and weeds (moisture is applied separately). */
export function growthRate(plot, crop, cropCfg, cfg, season) {
  const fert = crop.fert ? fertDef(cfg, crop.fert) : null;
  let rate = fert?.speed ?? 1;
  if (cropCfg.season && cropCfg.season === season) rate *= cfg.seasonBoost;
  if (plot.weed) rate *= cfg.weedRate;
  return rate;
}

/**
 * Where a crop is at `now`, without changing it. Wet soil grows at full speed until `wetUntil`,
 * dry soil at `cfg.dryRate`. Returns the growth (ms of full-speed growing), 0..1 progress,
 * the moment it ripened (or will ripen, if the soil stays as it is) and whether it has withered.
 * @param {GardenPlot} plot
 * @param {number} now
 * @param {CropCfg} cropCfg
 * @param {*} cfg
 * @param {{ sprinkled: boolean; season: string }} env
 */
export function projectCrop(plot, now, cropCfg, cfg, env) {
  const crop = plot.crop;
  if (crop.ripeAt) {
    return { growth: cropCfg.growMs, progress: 1, ripe: true, ripeAt: crop.ripeAt, withered: now >= crop.ripeAt + cfg.witherMs, careWet: crop.careWet || 0, careDry: crop.careDry || 0 };
  }
  const rate = growthRate(plot, crop, cropCfg, cfg, env.season);
  const from = crop.calcAt;
  const dt = Math.max(0, now - from);
  const wetEnd = env.sprinkled ? Infinity : Math.max(from, plot.wetUntil || 0);
  const wetDt = Math.min(dt, wetEnd - from);
  const dryDt = dt - wetDt;
  const remaining = Math.max(0, cropCfg.growMs - crop.growth);
  // Time from `from` until the crop is ripe under the current conditions.
  const wetSpan = Math.max(0, wetEnd - from);
  const toRipe = remaining <= wetSpan * rate
    ? remaining / rate
    : wetSpan + (remaining - wetSpan * rate) / (rate * cfg.dryRate);
  if (toRipe <= dt) {
    const ripeAt = Math.round(from + toRipe);
    const wetUsed = Math.min(toRipe, wetSpan);
    return {
      growth: cropCfg.growMs, progress: 1, ripe: true, ripeAt, withered: now >= ripeAt + cfg.witherMs,
      careWet: (crop.careWet || 0) + wetUsed, careDry: (crop.careDry || 0) + (toRipe - wetUsed),
    };
  }
  const growth = crop.growth + (wetDt + dryDt * cfg.dryRate) * rate;
  return {
    growth, progress: Math.min(0.999, growth / cropCfg.growMs), ripe: false, ripeAt: Math.round(from + toRipe), withered: false,
    careWet: (crop.careWet || 0) + wetDt, careDry: (crop.careDry || 0) + dryDt,
  };
}

/** 0 seed, 1 sprout, 2 leafy, 3 flowering / fruit forming, 4 ripe. */
export function stageOf(progress, ripe) {
  if (ripe) return 4;
  if (progress < 0.12) return 0;
  if (progress < 0.35) return 1;
  if (progress < 0.65) return 2;
  return 3;
}

/** Share of the growing time the soil was kept wet (0..1). */
export function careRatio(careWet, careDry) {
  const total = careWet + careDry;
  return total > 0 ? careWet / total : 0;
}
