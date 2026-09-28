// Sic Bo (dice): three dice. Bet on 大 (11-17) or 小 (4-10) - any triple loses both - paying 1:1, or on a
// number 1-6, paying 1:1 for each die that shows it. Pure functions only (no imports).

export type SicBoBetId = "big" | "small" | "n1" | "n2" | "n3" | "n4" | "n5" | "n6";
export type Dice = [number, number, number];

export const SICBO_BETS: ReadonlyArray<{ id: SicBoBetId; label: string; hint: string }> = [
  { id: "small", label: "小", hint: "4〜10（ゾロ目は負け）1:1" },
  { id: "big", label: "大", hint: "11〜17（ゾロ目は負け）1:1" },
  { id: "n1", label: "1", hint: "1の目1つにつき 1:1" },
  { id: "n2", label: "2", hint: "2の目1つにつき 1:1" },
  { id: "n3", label: "3", hint: "3の目1つにつき 1:1" },
  { id: "n4", label: "4", hint: "4の目1つにつき 1:1" },
  { id: "n5", label: "5", hint: "5の目1つにつき 1:1" },
  { id: "n6", label: "6", hint: "6の目1つにつき 1:1" },
];

/** `randomInt(n)` returns an unbiased integer in [0, n). */
export function rollDice(randomInt: (n: number) => number): Dice {
  return [randomInt(6) + 1, randomInt(6) + 1, randomInt(6) + 1];
}

export const isTriple = (dice: Dice) => dice[0] === dice[1] && dice[1] === dice[2];
export const diceTotal = (dice: Dice) => dice[0] + dice[1] + dice[2];

/** Total coins handed back for a bet: stake included for a win, 0 for a loss. */
export function betReturn(bet: SicBoBetId, stake: number, dice: Dice): number {
  if (bet === "big") return !isTriple(dice) && diceTotal(dice) >= 11 ? stake * 2 : 0;
  if (bet === "small") return !isTriple(dice) && diceTotal(dice) <= 10 ? stake * 2 : 0;
  const face = Number(bet.slice(1));
  const matches = dice.filter((d) => d === face).length;
  return matches > 0 ? stake * (1 + matches) : 0;
}

export function settleSicBo(bets: Partial<Record<SicBoBetId, number>>, dice: Dice) {
  let totalStake = 0;
  let totalReturn = 0;
  const wins: SicBoBetId[] = [];
  for (const [id, stake] of Object.entries(bets) as Array<[SicBoBetId, number]>) {
    if (!stake || stake <= 0) continue;
    totalStake += stake;
    const back = betReturn(id, stake, dice);
    totalReturn += back;
    if (back > 0) wins.push(id);
  }
  return { totalStake, totalReturn, net: totalReturn - totalStake, wins };
}

/** Exact return-to-player of a 1-coin bet, by enumerating all 216 rolls. */
export function sicBoRtp(bet: SicBoBetId): number {
  let sum = 0;
  for (let a = 1; a <= 6; a += 1) for (let b = 1; b <= 6; b += 1) for (let c = 1; c <= 6; c += 1) sum += betReturn(bet, 1, [a, b, c]);
  return sum / 216;
}
