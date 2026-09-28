// High & Low: guess whether the next card is higher or lower than the one showing. Every correct guess
// multiplies the pot by fair odds (from the cards still in the deck) minus a 4% house edge; a tie or a wrong guess
// loses the pot; you can cash out after any win. Pure functions (type-only imports).
import type { Card } from "./cards";

export type Guess = "higher" | "lower";
export type Odds = { count: number; total: number; mult: number };

/** Share of fair odds that is paid out. */
export const HIGHLOW_PAYOUT_FACTOR = 0.96;
export const HIGHLOW_MAX_MULT = 20;
export const HIGHLOW_MIN_MULT = 1.05;
/** A run ends (and pays) after this many wins in a row. */
export const HIGHLOW_MAX_STREAK = 8;

function oddsFor(count: number, total: number): Odds {
  if (count <= 0 || total <= 0) return { count: 0, total, mult: 0 };
  const fair = HIGHLOW_PAYOUT_FACTOR * (total / count);
  const mult = Math.floor(Math.min(HIGHLOW_MAX_MULT, Math.max(HIGHLOW_MIN_MULT, fair)) * 100) / 100;
  return { count, total, mult };
}

/** Odds for the next card, judged on the cards still in the deck (ties count for neither side). */
export function highLowOdds(current: Card, remaining: readonly Card[]): { higher: Odds; lower: Odds } {
  const total = remaining.length;
  const higher = remaining.filter((card) => card.rank > current.rank).length;
  const lower = remaining.filter((card) => card.rank < current.rank).length;
  return { higher: oddsFor(higher, total), lower: oddsFor(lower, total) };
}

export function guessWins(guess: Guess, current: Card, next: Card): boolean {
  return guess === "higher" ? next.rank > current.rank : next.rank < current.rank;
}

/** Whole coins for a stake after a chain of winning multipliers. */
export function highLowPot(stake: number, mults: readonly number[]): number {
  return Math.floor(mults.reduce((pot, m) => pot * m, stake) + 1e-9);
}
