"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maybeNaturalSpawn = maybeNaturalSpawn;
exports.spawnMonsterFromNest = spawnMonsterFromNest;
const monsters_1 = require("../data/monsters");
const balance_1 = require("../data/balance");
const random_1 = require("../utils/random");
let serial = 0;
function createMonster(kind, position) {
    const bp = monsters_1.MONSTER_BLUEPRINTS.find((item) => item.id === kind) ?? monsters_1.MONSTER_BLUEPRINTS[0];
    serial += 1;
    return {
        id: `m-${serial}`,
        kind: bp.id,
        name: bp.name,
        position,
        hp: bp.hp,
        maxHp: bp.hp,
        speed: bp.speed,
        attack: bp.attack,
        range: bp.range,
        attackCooldown: bp.attackCooldown,
        attackTimer: 0,
        isActive: true,
        state: "idle",
    };
}
function maybeNaturalSpawn(soilType, position) {
    const key = soilType === "normalSoil" ||
        soilType === "magicSoil" ||
        soilType === "moistSoil" ||
        soilType === "mineralSoil" ||
        soilType === "toxicSoil"
        ? soilType
        : null;
    if (!key)
        return null;
    const base = balance_1.SPAWN_BALANCE.naturalSpawnChance[key];
    const finalSpawnRate = Math.min(base * balance_1.SPAWN_BALANCE.naturalMonsterSpawnMultiplier, balance_1.SPAWN_BALANCE.maxNaturalMonsterSpawnRate);
    if ((0, random_1.randomFloat)() >= finalSpawnRate)
        return null;
    const weighted = balance_1.SPAWN_BALANCE.naturalSpawnWeights[key];
    const kind = weighted?.length ? (0, random_1.weightedPick)(weighted).monsterId : (0, random_1.randomPick)(monsters_1.MONSTER_BLUEPRINTS).id;
    return createMonster(kind, position);
}
function spawnMonsterFromNest(kind, position) {
    return createMonster(kind, position);
}
