import { getAbilityDefinition } from "../data/abilities";
import {
  findMonsterDefinition,
  MONSTER_BLUEPRINTS,
  MONSTER_RARITY_COLOR,
  ROLE_LABEL,
  type AllyMonsterDefinition,
} from "../data/monsters";
import {
  DEPTH_LAYER_SPAWN_TUNING,
  MONSTER_SPAWN_TIER_MULTIPLIERS,
  SPAWN_BALANCE,
  getDepthLayer,
  getMonsterSpawnTier,
} from "../data/balance";
import { RARITY_RATES_BY_DEPTH } from "../data/mapConfig";
import type { CellType, Monster, MonsterRarity, MonsterSpawnTier, SoilType, Vec2 } from "../types/game";
import { randomFloat, randomPick, weightedPick } from "../utils/random";

let serial = 0;

function createMonster(kind: string, position: Vec2): Monster {
  const bp = findMonsterDefinition(kind) ?? MONSTER_BLUEPRINTS[0];
  serial += 1;
  const now = Date.now();
  const ability = getAbilityDefinition(bp.abilityId);
  return {
    id: `m-${serial}`,
    kind: bp.id,
    name: bp.name,
    position,
    hp: bp.maxHp,
    maxHp: bp.maxHp,
    speed: bp.moveSpeed,
    attack: bp.attackPower,
    range: bp.attackRange,
    attackCooldown: bp.attackInterval,
    attackTimer: 0,
    isActive: true,
    state: "idle",
    direction: "down",
    motionPhase: randomFloat() * Math.PI * 2,
    motionTimer: 0,
    behavior: {
      detectionRange: bp.detectionRange,
      leashRange: bp.leashRange,
      wanderMoveSpeedMultiplier: bp.wanderMoveSpeedMultiplier,
      canWanderWhenIdle: bp.canWanderWhenIdle,
      guardCoreBias: bp.guardCoreBias,
    },
    role: bp.role,
    rarity: bp.rarity,
    description: bp.description,
    defense: bp.defense,
    abilityId: bp.abilityId,
    abilityState: ability ? { abilityId: ability.id, cooldown: ability.cooldown, lastUsedAt: -99999 } : null,
    visualConfig: { ...bp.visualConfig },
    summonParentId: null,
    summonCount: 0,
    isSummonedTemporary: false,
    movementState: {
      homePosition: { x: Math.floor(position.x), y: Math.floor(position.y) },
      wanderTarget: null,
      targetEnemyId: null,
      path: [],
      currentPathIndex: 0,
      nextDecisionAt: now + 600 + Math.floor(randomFloat() * 1000),
      lastPathCalculatedAt: 0,
      lastDetectionAt: now - Math.floor(randomFloat() * 300),
      chaseLostAt: 0,
    },
  };
}

export function createSummonedMinion(parent: Monster, position: Vec2): Monster {
  const minion = createMonster("sporeRat", position);
  minion.name = `${parent.name}の眷属`;
  minion.maxHp = Math.floor(minion.maxHp * 0.65);
  minion.hp = minion.maxHp;
  minion.attack = Math.floor(minion.attack * 0.65);
  minion.role = "melee";
  minion.rarity = "common";
  minion.abilityId = null;
  minion.abilityState = null;
  minion.summonParentId = parent.id;
  minion.isSummonedTemporary = true;
  return minion;
}

function normalizeSoilType(type: CellType): Exclude<CellType, "hardRock" | "empty" | "coreRoom" | "entrance" | "nest" | "trap"> | null {
  return (
    type === "normalSoil" ||
    type === "magicSoil" ||
    type === "moistSoil" ||
    type === "mineralSoil" ||
    type === "toxicSoil"
      ? type
      : null
  );
}

export function getFinalSpawnRate(
  soilType: CellType,
  row: number,
  spawnTier: MonsterSpawnTier,
): number {
  const key = normalizeSoilType(soilType);
  if (!key) return 0;
  const depthLayer = getDepthLayer(row);
  const depthMultiplier = DEPTH_LAYER_SPAWN_TUNING[depthLayer].spawnRateMultiplier;
  const baseSpawnRate =
    SPAWN_BALANCE.naturalSpawnChance[key] * SPAWN_BALANCE.naturalMonsterSpawnMultiplier;
  const finalSpawnRate = Math.min(
    baseSpawnRate * depthMultiplier * MONSTER_SPAWN_TIER_MULTIPLIERS[spawnTier],
    SPAWN_BALANCE.maxNaturalMonsterSpawnRate,
  );
  return Math.max(0, finalSpawnRate);
}

export function getMonsterSpawnTierLabel(tier: MonsterSpawnTier): string {
  if (tier === "veryHigh") return "非常に高い";
  if (tier === "high") return "高い";
  return "通常";
}

export function getSpawnTierFromRate(rate: number): MonsterSpawnTier {
  return getMonsterSpawnTier(rate);
}

const RARITY_ORDER: MonsterRarity[] = ["common", "uncommon", "rare", "epic"];

function lowerRarity(rarity: MonsterRarity): MonsterRarity | null {
  const idx = RARITY_ORDER.indexOf(rarity);
  if (idx <= 0) return null;
  return RARITY_ORDER[idx - 1];
}

function tierOrder(t: MonsterSpawnTier): number {
  if (t === "normal") return 0;
  if (t === "high") return 1;
  return 2;
}

function rollRarityByDepth(layer: number): MonsterRarity {
  const depthLayer = Math.max(0, Math.min(4, layer)) as 0 | 1 | 2 | 3 | 4;
  const rates = RARITY_RATES_BY_DEPTH[depthLayer];
  const r = randomFloat();
  if (r < rates.common) return "common";
  if (r < rates.common + rates.uncommon) return "uncommon";
  if (r < rates.common + rates.uncommon + rates.rare) return "rare";
  return "epic";
}

function filterSpawnableByTier(defs: AllyMonsterDefinition[], tier: MonsterSpawnTier): AllyMonsterDefinition[] {
  return defs.filter((def) => tierOrder(tier) >= tierOrder(def.minimumSpawnTier));
}

function pickByWeight(defs: AllyMonsterDefinition[]): string {
  if (defs.length <= 0) return randomPick(MONSTER_BLUEPRINTS).id;
  return weightedPick(defs.map((def) => ({ monsterId: def.id, weight: Math.max(1, def.spawnWeight) }))).monsterId;
}

function candidatesBySoilLayerRarity(
  soil: SoilType,
  layer: number,
  rarity: MonsterRarity,
  tier: MonsterSpawnTier,
): AllyMonsterDefinition[] {
  const defs = MONSTER_BLUEPRINTS.filter(
    (def) =>
      def.rarity === rarity &&
      def.spawnSoilTypes.includes(soil) &&
      def.spawnDepthLayers.includes(layer),
  );
  return filterSpawnableByTier(defs, tier);
}

function candidatesByLayerRarity(
  layer: number,
  rarity: MonsterRarity,
  tier: MonsterSpawnTier,
): AllyMonsterDefinition[] {
  const defs = MONSTER_BLUEPRINTS.filter(
    (def) => def.rarity === rarity && def.spawnDepthLayers.includes(layer),
  );
  return filterSpawnableByTier(defs, tier);
}

function pickMonsterKindBySoilDepthTier(
  soil: SoilType,
  row: number,
  tier: MonsterSpawnTier,
): string {
  const layer = getDepthLayer(row);
  const rolledRarity = rollRarityByDepth(layer);

  const bucket1 = candidatesBySoilLayerRarity(soil, layer, rolledRarity, tier);
  if (bucket1.length > 0) return pickByWeight(bucket1);

  const bucket2 = candidatesByLayerRarity(layer, rolledRarity, tier);
  if (bucket2.length > 0) return pickByWeight(bucket2);

  const lower = lowerRarity(rolledRarity);
  if (lower) {
    const bucket3 = candidatesBySoilLayerRarity(soil, layer, lower, tier);
    if (bucket3.length > 0) return pickByWeight(bucket3);

    const bucket4 = candidatesByLayerRarity(layer, lower, tier);
    if (bucket4.length > 0) return pickByWeight(bucket4);
  }

  const bucket5 = filterSpawnableByTier(
    MONSTER_BLUEPRINTS.filter((def) => def.spawnDepthLayers.includes(layer)),
    tier,
  );
  if (bucket5.length > 0) return pickByWeight(bucket5);

  const tierFallback = filterSpawnableByTier(MONSTER_BLUEPRINTS, tier);
  return pickByWeight(tierFallback.length > 0 ? tierFallback : MONSTER_BLUEPRINTS);
}

export function maybeNaturalSpawn(soilType: CellType, position: Vec2, row: number): Monster | null {
  const key = normalizeSoilType(soilType);
  if (!key) return null;
  const finalSpawnRate = getFinalSpawnRate(key, row, "normal");
  if (randomFloat() >= finalSpawnRate) return null;
  const kind = pickMonsterKindBySoilDepthTier(key, row, "normal");
  return createMonster(kind, position);
}

export function maybeNaturalSpawnWithTier(
  soilType: CellType,
  position: Vec2,
  row: number,
  spawnTier: MonsterSpawnTier,
): Monster | null {
  const key = normalizeSoilType(soilType);
  if (!key) return null;
  const finalSpawnRate = getFinalSpawnRate(key, row, spawnTier);
  if (randomFloat() >= finalSpawnRate) return null;
  const kind = pickMonsterKindBySoilDepthTier(key, row, spawnTier);
  return createMonster(kind, position);
}

export function pickSpawnCandidatesBySoil(soilType: CellType, row?: number): string {
  const key = normalizeSoilType(soilType);
  if (!key) return "なし";
  const layer = typeof row === "number" ? getDepthLayer(row) : null;
  const names = MONSTER_BLUEPRINTS
    .filter((item) => item.spawnSoilTypes.includes(key))
    .filter((item) => (layer == null ? true : item.spawnDepthLayers.includes(layer)))
    .sort((a, b) => b.spawnWeight - a.spawnWeight)
    .slice(0, 4)
    .map((item) => item.name);
  return names.join(" / ") || "なし";
}

export function getRarityExpectationLabelByDepth(row: number): string {
  const layer = getDepthLayer(row);
  const rates = RARITY_RATES_BY_DEPTH[layer];
  const rareBand = rates.rare + rates.epic;
  if (rareBand >= 0.5) return "非常に高い";
  if (rareBand >= 0.3) return "高い";
  if (rareBand >= 0.15) return "中";
  return "低い";
}

export function getCandidateRarityBandByDepth(row: number): string {
  const layer = getDepthLayer(row);
  if (layer >= 4) return "rare～epic";
  if (layer >= 3) return "uncommon～epic";
  if (layer >= 2) return "uncommon～rare";
  if (layer >= 1) return "common～rare";
  return "common～uncommon";
}

export function spawnMonsterFromNest(kind: string, position: Vec2): Monster {
  return createMonster(kind, position);
}

export function rarityColorByMonsterKind(kind: string): string {
  const def = findMonsterDefinition(kind);
  if (!def) return "#83e7d4";
  return MONSTER_RARITY_COLOR[def.rarity];
}

export function spawnMessageByMonsterKind(kind: string): string[] {
  const def = findMonsterDefinition(kind);
  if (!def) return [];
  const rarityMark =
    def.rarity === "common"
      ? "○"
      : def.rarity === "uncommon"
        ? "△"
        : def.rarity === "rare"
          ? "◇"
          : "★";
  const rarityText = def.rarity === "common" ? "味方が誕生しました" : `${rarityMark} レアな味方が誕生しました！`;
  return [
    rarityText,
    def.name,
    `役割: ${ROLE_LABEL[def.role]}`,
    def.description,
  ];
}
