// Video poker, "Jacks or Better" (9/6 full-pay table): deal five, hold any, draw once.
// Pure functions (type-only imports).
import type { Card } from "./cards";

export type PokerHand =
  | "royal-flush" | "straight-flush" | "four-kind" | "full-house" | "flush"
  | "straight" | "three-kind" | "two-pair" | "jacks-or-better" | "nothing";

/** Multiple of the bet paid (stake included in the return). */
export const POKER_PAYTABLE: ReadonlyArray<{ hand: PokerHand; label: string; pays: number }> = [
  { hand: "royal-flush", label: "ロイヤルフラッシュ", pays: 250 },
  { hand: "straight-flush", label: "ストレートフラッシュ", pays: 50 },
  { hand: "four-kind", label: "フォーカード", pays: 25 },
  { hand: "full-house", label: "フルハウス", pays: 9 },
  { hand: "flush", label: "フラッシュ", pays: 6 },
  { hand: "straight", label: "ストレート", pays: 4 },
  { hand: "three-kind", label: "スリーカード", pays: 3 },
  { hand: "two-pair", label: "ツーペア", pays: 2 },
  { hand: "jacks-or-better", label: "ジャックス・オア・ベター（J以上のペア）", pays: 1 },
];

export function evaluatePokerHand(cards: readonly Card[]): PokerHand {
  if (cards.length !== 5) return "nothing";
  const ranks = cards.map((c) => c.rank).sort((a, b) => a - b);
  const counts = new Map<number, number>();
  for (const rank of ranks) counts.set(rank, (counts.get(rank) ?? 0) + 1);
  const groups = [...counts.values()].sort((a, b) => b - a);
  const flush = cards.every((c) => c.suit === cards[0].suit);
  const distinct = counts.size === 5;
  const wheel = distinct && ranks.join(",") === "2,3,4,5,14";
  const straight = distinct && (ranks[4] - ranks[0] === 4 || wheel);

  if (straight && flush) return ranks[0] === 10 && ranks[4] === 14 ? "royal-flush" : "straight-flush";
  if (groups[0] === 4) return "four-kind";
  if (groups[0] === 3 && groups[1] === 2) return "full-house";
  if (flush) return "flush";
  if (straight) return "straight";
  if (groups[0] === 3) return "three-kind";
  if (groups[0] === 2 && groups[1] === 2) return "two-pair";
  if (groups[0] === 2) {
    const pairRank = [...counts.entries()].find(([, n]) => n === 2)?.[0] ?? 0;
    if (pairRank >= 11) return "jacks-or-better";
  }
  return "nothing";
}

export function pokerPays(hand: PokerHand): number {
  return POKER_PAYTABLE.find((row) => row.hand === hand)?.pays ?? 0;
}

export function pokerHandLabel(hand: PokerHand): string {
  return POKER_PAYTABLE.find((row) => row.hand === hand)?.label ?? "役なし";
}

/**
 * The hand after the draw: held cards stay, the rest are replaced from the top of `deck`
 * (the cards that follow the initial five).
 */
export function drawPokerHand(hand: readonly Card[], held: readonly boolean[], deck: readonly Card[]): Card[] {
  let next = 0;
  return hand.map((card, i) => (held[i] ? card : deck[next++]));
}
