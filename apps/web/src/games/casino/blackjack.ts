// Single-player blackjack rules: dealer stands on every 17, blackjack pays 3:2, double down allowed
// on the first two cards. No splitting or insurance. Pure functions (type-only imports).
import type { Card } from "./cards";

export type HandValue = { total: number; soft: boolean };

export function cardValue(card: Card): number {
  if (card.rank === 14) return 11;
  return card.rank >= 10 ? 10 : card.rank;
}

/** Best total without busting; `soft` when an ace still counts as 11. */
export function handValue(cards: readonly Card[]): HandValue {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    total += cardValue(card);
    if (card.rank === 14) aces += 1;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return { total, soft: aces > 0 };
}

export function isBlackjack(cards: readonly Card[]): boolean {
  return cards.length === 2 && handValue(cards).total === 21;
}

export function isBust(cards: readonly Card[]): boolean {
  return handValue(cards).total > 21;
}

export function dealerMustHit(cards: readonly Card[]): boolean {
  return handValue(cards).total < 17;
}

export type BlackjackOutcome = "blackjack" | "win" | "push" | "lose" | "bust";

export function settleBlackjack(player: readonly Card[], dealer: readonly Card[]): BlackjackOutcome {
  const playerBlackjack = isBlackjack(player);
  const dealerBlackjack = isBlackjack(dealer);
  if (playerBlackjack && dealerBlackjack) return "push";
  if (playerBlackjack) return "blackjack";
  if (dealerBlackjack) return "lose";
  if (isBust(player)) return "bust";
  if (isBust(dealer)) return "win";
  const p = handValue(player).total;
  const d = handValue(dealer).total;
  if (p > d) return "win";
  if (p < d) return "lose";
  return "push";
}

/** Chips handed back for a finished hand (stake included). Bets are multiples of 10, so 3:2 is whole. */
export function blackjackReturn(outcome: BlackjackOutcome, stake: number): number {
  switch (outcome) {
    case "blackjack": return stake + (stake * 3) / 2;
    case "win": return stake * 2;
    case "push": return stake;
    default: return 0;
  }
}
