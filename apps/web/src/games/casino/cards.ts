// Playing cards shared by blackjack and video poker. Pure functions only (no value imports).

export type Suit = "S" | "H" | "D" | "C";
/** 2-10 as numbers, then J, Q, K, A. */
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
export type Card = { rank: Rank; suit: Suit };

export const SUITS: readonly Suit[] = ["S", "H", "D", "C"];
export const SUIT_SYMBOL: Record<Suit, string> = { S: "♠", H: "♥", D: "♦", C: "♣" };
const RANK_LABEL: Record<number, string> = { 11: "J", 12: "Q", 13: "K", 14: "A" };

export function rankLabel(rank: Rank): string {
  return RANK_LABEL[rank] ?? String(rank);
}

export function isRed(card: Card): boolean {
  return card.suit === "H" || card.suit === "D";
}

export function newDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) for (let rank = 2; rank <= 14; rank += 1) deck.push({ rank: rank as Rank, suit });
  return deck;
}

/** Fisher-Yates with an unbiased `randomInt(n)` in [0, n). */
export function shuffle(cards: Card[], randomInt: (n: number) => number): Card[] {
  const deck = [...cards];
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function freshShuffledDeck(randomInt: (n: number) => number): Card[] {
  return shuffle(newDeck(), randomInt);
}
