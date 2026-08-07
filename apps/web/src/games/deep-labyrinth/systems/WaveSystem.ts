import { WAVE_BALANCE } from "../data/balance";

export function enemiesForWave(wave: number): number {
  return WAVE_BALANCE.initialEnemies + Math.max(0, wave - 1) * WAVE_BALANCE.enemiesPerWave;
}
