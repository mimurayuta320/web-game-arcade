"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENEMY_BALANCE = exports.WAVE_BALANCE = exports.SPAWN_BALANCE = exports.DIG_BALANCE = exports.MIN_CORE_PATH_DISTANCE = exports.CORE_PLACEMENT_COUNTDOWN_SEC = exports.EXTRA_PREPARATION_TIME_SEC = exports.INITIAL_PREPARATION_TIME = exports.HUD_NOTIFY_INTERVAL_MS = exports.GRID_ROWS = exports.GRID_COLS = void 0;
exports.GRID_COLS = 32;
exports.GRID_ROWS = 20;
exports.HUD_NOTIFY_INTERVAL_MS = 150;
exports.INITIAL_PREPARATION_TIME = 60;
exports.EXTRA_PREPARATION_TIME_SEC = 30;
exports.CORE_PLACEMENT_COUNTDOWN_SEC = 3;
exports.MIN_CORE_PATH_DISTANCE = 8;
exports.DIG_BALANCE = {
    maxDigCount: 60,
    regenPerSecond: 0,
    normalSoilSec: 0.25,
    magicSoilSec: 0.45,
    moistSoilSec: 0.45,
    mineralSoilSec: 0.8,
    toxicSoilSec: 0.5,
};
exports.SPAWN_BALANCE = {
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
exports.WAVE_BALANCE = {
    preparationSec: exports.INITIAL_PREPARATION_TIME,
    betweenWaveSec: 30,
    initialEnemies: 8,
    enemiesPerWave: 3,
    spawnEverySec: 1.8,
    maxWave: 10,
};
exports.ENEMY_BALANCE = {
    speedMultiplier: 0.5,
};
