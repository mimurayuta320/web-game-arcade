"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enemiesForWave = enemiesForWave;
const balance_1 = require("../data/balance");
function enemiesForWave(wave) {
    return balance_1.WAVE_BALANCE.initialEnemies + Math.max(0, wave - 1) * balance_1.WAVE_BALANCE.enemiesPerWave;
}
