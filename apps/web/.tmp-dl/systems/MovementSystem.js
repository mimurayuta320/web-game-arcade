"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnemyFinalMoveSpeed = getEnemyFinalMoveSpeed;
const balance_1 = require("../data/balance");
function getEnemyFinalMoveSpeed(invader, waveSpeedMultiplier, statusEffectMultiplier) {
    return invader.speed * balance_1.ENEMY_BALANCE.speedMultiplier * waveSpeedMultiplier * statusEffectMultiplier;
}
