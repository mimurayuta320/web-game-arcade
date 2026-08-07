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
import type { CellType, Monster, MonsterSpawnTier, SoilType, Vec2 } from "../types/game";
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
  return minion;
}

export function maybeNaturalSpawn(soilType: CellType, position: Vec2, row: number): Monster | null {
  const key =
    soilType === "normalSoil" ||
    soilType === "magicSoil" ||
    soilType === "moistSoil" ||
    soilType === "mineralSoil" ||
    soilType === "toxicSoil"
      ? soilType
      : null;

  if (!key) return null;
  const depthLayer = getDepthLayer(row);
  const layerTuning = DEPTH_LAYER_SPAWN_TUNING[depthLayer];
  const finalSpawnRate = getFinalSpawnRate(key, row, "normal");

  if (randomFloat() >= finalSpawnRate) return null;

  const kind = pickMonsterKindBySoilDepthTier(key, row, "normal", layerTuning);
  return createMonster(kind, position);
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
    0.65,
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

export function pickSpawnCandidatesBySoil(soilType: CellType): string {
  const key = normalizeSoilType(soilType);
  if (!key) return "なし";
  const names = MONSTER_BLUEPRINTS.filter((item) => item.spawnSoilTypes.includes(key))
    .sort((a, b) => b.spawnWeight - a.spawnWeight)
    .slice(0, 4)
    .map((item) => item.name);
  return names.join(" / ") || "なし";
}

export function maybeNaturalSpawnWithTier(
  soilType: CellType,
  position: Vec2,
  row: number,
  spawnTier: MonsterSpawnTier,
): Monster | null {
  const key = normalizeSoilType(soilType);
  if (!key) return null;
  const depthLayer = getDepthLayer(row);
  const layerTuning = DEPTH_LAYER_SPAWN_TUNING[depthLayer];
  const finalSpawnRate = getFinalSpawnRate(key, row, spawnTier);

  if (randomFloat() >= finalSpawnRate) return null;

  const kind = pickMonsterKindBySoilDepthTier(key, row, spawnTier, layerTuning);
  return createMonster(kind, position);
}

export function spawnMonsterFromNest(kind: string, position: Vec2): Monster {
  return createMonster(kind, position);
}

function tierOrder(t: MonsterSpawnTier): number {
  if (t === "normal") return 0;
  if (t === "high") return 1;
  return 2;
}

function raritySpawnModifier(def: AllyMonsterDefinition): number {
  if (def.rarity === "common") return 1;
  if (def.rarity === "uncommon") return 0.85;
  if (def.rarity === "rare") return 0.6;
  return 0.35;
}

function depthAffinityModifier(def: AllyMonsterDefinition, layer: number): number {
  if (def.spawnDepthLayers.includes(layer)) return 1;
  const minDist = def.spawnDepthLayers.reduce((best, v) => Math.min(best, Math.abs(v - layer)), 9);
  if (minDist === 1) return 0.07;
  return 0;
}

function pickMonsterKindBySoilDepthTier(
  soil: SoilType,
  row: number,
  tier: MonsterSpawnTier,
  layerTuning: (typeof DEPTH_LAYER_SPAWN_TUNING)[0],
): string {
  const layer = getDepthLayer(row);
  const pool = MONSTER_BLUEPRINTS.filter((def) => def.spawnSoilTypes.includes(soil));
  const weighted = pool
    .map((def) => {
      const tierOk = tierOrder(tier) >= tierOrder(def.minimumSpawnTier) ? 1 : 0;
      if (!tierOk) return null;
      const layerAffinity = depthAffinityModifier(def, layer);
      if (layerAffinity <= 0) return null;
      const bonus =
        layerTuning.monsterWeightBonus[def.id as keyof typeof layerTuning.monsterWeightBonus] ?? 1;
      const roleWeight = def.role === "support" || def.role === "healer" || def.role === "summoner" ? 0.82 : 1;
      const weight = Math.max(
        1,
        def.spawnWeight * layerAffinity * bonus * raritySpawnModifier(def) * roleWeight,
      );
      return { monsterId: def.id, weight };
    })
    .filter((entry): entry is { monsterId: string; weight: number } => Boolean(entry));

  if (weighted.length <= 0) return randomPick(pool.length ? pool : MONSTER_BLUEPRINTS).id;
  return weightedPick(weighted).monsterId;
}

export function rarityColorByMonsterKind(kind: string): string {
  const def = findMonsterDefinition(kind);
  if (!def) return "#83e7d4";
  return MONSTER_RARITY_COLOR[def.rarity];
}

export function spawnMessageByMonsterKind(kind: string): string[] {
  const def = findMonsterDefinition(kind);
  if (!def) return [];
  const rarityText = def.rarity === "common" ? "味方が誕生しました" : "レアな味方が誕生しました！";
  return [
    rarityText,
    def.name,
    `役割: ${ROLE_LABEL[def.role]}`,
    def.description,
  ];
}
