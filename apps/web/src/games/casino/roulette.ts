// European (single zero) roulette. Pure functions only (no imports).

/** Pocket order around the wheel, clockwise from 0. */
export const ROULETTE_WHEEL: readonly number[] = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export type RouletteColor = "red" | "black" | "green";

export function rouletteColor(n: number): RouletteColor {
  if (n === 0) return "green";
  return RED_NUMBERS.has(n) ? "red" : "black";
}

/** "n:17" (straight up) or one of the outside bets below. */
export type RouletteBetId =
  | `n:${number}`
  | "red" | "black" | "odd" | "even" | "low" | "high"
  | "d1" | "d2" | "d3"
  | "c1" | "c2" | "c3";

export const OUTSIDE_BETS: ReadonlyArray<{ id: RouletteBetId; label: string; odds: number }> = [
  { id: "red", label: "赤", odds: 1 },
  { id: "black", label: "黒", odds: 1 },
  { id: "odd", label: "奇数", odds: 1 },
  { id: "even", label: "偶数", odds: 1 },
  { id: "low", label: "1-18", odds: 1 },
  { id: "high", label: "19-36", odds: 1 },
  { id: "d1", label: "1st 12", odds: 2 },
  { id: "d2", label: "2nd 12", odds: 2 },
  { id: "d3", label: "3rd 12", odds: 2 },
  { id: "c1", label: "列1", odds: 2 },
  { id: "c2", label: "列2", odds: 2 },
  { id: "c3", label: "列3", odds: 2 },
];

export function straightBetId(n: number): RouletteBetId {
  return `n:${n}`;
}

/** Net winnings per unit staked (a straight-up win pays 35 to 1). */
export function betOdds(id: RouletteBetId): number {
  if (id.startsWith("n:")) return 35;
  return OUTSIDE_BETS.find((bet) => bet.id === id)?.odds ?? 0;
}

export function betLabel(id: RouletteBetId): string {
  if (id.startsWith("n:")) return id.slice(2);
  return OUTSIDE_BETS.find((bet) => bet.id === id)?.label ?? id;
}

export function betWins(id: RouletteBetId, n: number): boolean {
  if (id.startsWith("n:")) return Number(id.slice(2)) === n;
  if (n === 0) return false;
  switch (id) {
    case "red": return rouletteColor(n) === "red";
    case "black": return rouletteColor(n) === "black";
    case "odd": return n % 2 === 1;
    case "even": return n % 2 === 0;
    case "low": return n <= 18;
    case "high": return n >= 19;
    case "d1": return n <= 12;
    case "d2": return n >= 13 && n <= 24;
    case "d3": return n >= 25;
    case "c1": return n % 3 === 1;
    case "c2": return n % 3 === 2;
    case "c3": return n % 3 === 0;
    default: return false;
  }
}

export type RouletteBets = Partial<Record<RouletteBetId, number>>;

export type RouletteSettlement = {
  number: number;
  color: RouletteColor;
  totalStake: number;
  /** Chips handed back: stake + winnings of every winning bet. */
  totalReturn: number;
  net: number;
  winningBets: Array<{ id: RouletteBetId; stake: number; payout: number }>;
};

export function totalStake(bets: RouletteBets): number {
  return Object.values(bets).reduce<number>((sum, stake) => sum + (stake ?? 0), 0);
}

export function settleRoulette(bets: RouletteBets, n: number): RouletteSettlement {
  const winningBets: RouletteSettlement["winningBets"] = [];
  let totalReturn = 0;
  for (const [key, stake] of Object.entries(bets) as Array<[RouletteBetId, number]>) {
    if (!stake || stake <= 0 || !betWins(key, n)) continue;
    const payout = stake * (betOdds(key) + 1);
    totalReturn += payout;
    winningBets.push({ id: key, stake, payout });
  }
  const staked = totalStake(bets);
  return { number: n, color: rouletteColor(n), totalStake: staked, totalReturn, net: totalReturn - staked, winningBets };
}

/** Exact return-to-player of a bet id (36/37 for every bet on this table). */
export function betRtp(id: RouletteBetId): number {
  let winning = 0;
  for (let n = 0; n <= 36; n++) if (betWins(id, n)) winning++;
  return (winning * (betOdds(id) + 1)) / 37;
}
