"use client";

import styles from "../casino.module.css";
import { BET_STEP, MIN_BET, clampBet, maxBet } from "../bank";

const PRESETS = [10, 50, 100, 500] as const;

type Props = {
  /** Current bet (already clamped or not; it is clamped to the bank here). */
  bet: number;
  bank: number;
  disabled?: boolean;
  onBet: (bet: number) => void;
};

/** −/＋ , preset chips and MAX, shared by the card games. */
export function BetControls({ bet, bank, disabled = false, onBet }: Props) {
  const shown = clampBet(bet, bank);
  return (
    <div className={styles.betRow}>
      <button className={styles.button} onClick={() => onBet(clampBet(shown - BET_STEP, bank))} disabled={disabled || shown <= MIN_BET} aria-label="ベットを減らす">−</button>
      <span className={styles.betValue}>{shown.toLocaleString("ja-JP")}</span>
      <button className={styles.button} onClick={() => onBet(clampBet(shown + BET_STEP, bank))} disabled={disabled || shown >= maxBet(bank)} aria-label="ベットを増やす">＋</button>
      {PRESETS.map((preset) => (
        <button className={styles.button} key={preset} onClick={() => onBet(clampBet(preset, bank))} disabled={disabled || preset > maxBet(bank)}>{preset}</button>
      ))}
      <button className={styles.button} onClick={() => onBet(maxBet(bank))} disabled={disabled}>MAX</button>
    </div>
  );
}
