import { ENEMY_BALANCE, ENEMY_MOVE_SPEED_MULTIPLIER } from "../data/balance";
import type { Invader } from "../types/game";

export function getEnemyFinalMoveSpeed(
  invader: Invader,
  waveSpeedMultiplier: number,
  statusEffectMultiplier: number,
): number {
  const baseMoveSpeed = invader.speed;
  const finalMoveSpeed =
    baseMoveSpeed *
    ENEMY_BALANCE.speedMultiplier *
    ENEMY_MOVE_SPEED_MULTIPLIER *
    waveSpeedMultiplier *
    statusEffectMultiplier;
  return finalMoveSpeed;
}
