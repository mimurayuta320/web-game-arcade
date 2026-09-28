// Sanity checks for the casino game logic. Run with the bundled Node:
//   .\.tools\node-v24.18.0-win-x64\node.exe --no-warnings scripts/casino-check.mjs
import assert from "node:assert/strict";
import { computeSlotRtp, spinWithStops, slotPayout, lineBet, SLOT_STRIP } from "../apps/web/src/games/casino/slots.ts";
import { newDeck, shuffle } from "../apps/web/src/games/casino/cards.ts";
import { handValue, isBlackjack, settleBlackjack, blackjackReturn, dealerMustHit } from "../apps/web/src/games/casino/blackjack.ts";
import { evaluatePokerHand, pokerPays, drawPokerHand } from "../apps/web/src/games/casino/videoPoker.ts";
import {
  ROULETTE_WHEEL, OUTSIDE_BETS, rouletteColor, betRtp, settleRoulette, straightBetId, betWins,
} from "../apps/web/src/games/casino/roulette.ts";
import { HIGHLOW_MAX_MULT, HIGHLOW_MIN_MULT, guessWins, highLowOdds, highLowPot } from "../apps/web/src/games/casino/highlow.ts";
import { SICBO_BETS, betReturn, diceTotal, isTriple, rollDice, settleSicBo, sicBoRtp } from "../apps/web/src/games/casino/sicbo.ts";

// --- slots ---
const slots = computeSlotRtp();
console.log(`slots: RTP ${(slots.rtp * 100).toFixed(2)}%  hit ${(slots.hitRate * 100).toFixed(1)}%`);
assert.ok(slots.rtp > 0.93 && slots.rtp < 0.97, "slot RTP should stay near 95%");
assert.equal(SLOT_STRIP.length, 24);

const sevenStop = SLOT_STRIP.indexOf("seven");
const jackpot = spinWithStops([sevenStop, sevenStop, sevenStop]);
assert.ok(jackpot.wins.some((w) => w.symbol === "seven" && w.count === 3 && w.line === 0), "777 on the middle line");
assert.equal(slotPayout(100, jackpot), lineBet(100) * jackpot.totalMultiplier);
assert.ok(Number.isInteger(slotPayout(10, jackpot)), "payouts stay whole numbers");

// --- roulette ---
assert.equal(ROULETTE_WHEEL.length, 37);
assert.deepEqual([...ROULETTE_WHEEL].sort((a, b) => a - b), Array.from({ length: 37 }, (_, i) => i));
assert.equal(ROULETTE_WHEEL.filter((n) => rouletteColor(n) === "red").length, 18);
assert.equal(ROULETTE_WHEEL.filter((n) => rouletteColor(n) === "black").length, 18);

for (const bet of [...OUTSIDE_BETS.map((b) => b.id), ...Array.from({ length: 37 }, (_, n) => straightBetId(n))]) {
  assert.ok(Math.abs(betRtp(bet) - 36 / 37) < 1e-9, `${bet} RTP must be 36/37`);
}

const win = settleRoulette({ "n:17": 10, red: 100, odd: 50 }, 17);
assert.equal(win.totalStake, 160);
assert.ok(!betWins("red", 17) && betWins("black", 17)); // 17 is black and odd
assert.equal(win.totalReturn, 10 * 36 + 50 * 2);
assert.equal(win.net, win.totalReturn - 160);

const zero = settleRoulette({ red: 100, even: 100, low: 100, d1: 100, c1: 100, "n:0": 10 }, 0);
assert.equal(zero.totalReturn, 10 * 36, "zero only pays the straight-up bet");

// --- cards / blackjack / video poker ---
const c = (rank, suit = "S") => ({ rank, suit });
const deck = newDeck();
assert.equal(deck.length, 52);
assert.equal(new Set(deck.map((k) => `${k.rank}${k.suit}`)).size, 52);
const shuffled = shuffle(deck, (n) => Math.floor(Math.random() * n));
assert.equal(shuffled.length, 52);
assert.deepEqual(shuffled.map((k) => `${k.rank}${k.suit}`).sort(), deck.map((k) => `${k.rank}${k.suit}`).sort());

assert.deepEqual(handValue([c(14), c(13)]), { total: 21, soft: true });
assert.deepEqual(handValue([c(14), c(14), c(9)]), { total: 21, soft: true });
assert.deepEqual(handValue([c(14), c(9), c(9)]), { total: 19, soft: false });
assert.equal(handValue([c(10), c(12), c(5)]).total, 25);
assert.ok(isBlackjack([c(14), c(11)]) && !isBlackjack([c(10), c(5), c(6)]));
assert.equal(settleBlackjack([c(14), c(13)], [c(10), c(9)]), "blackjack");
assert.equal(settleBlackjack([c(14), c(13)], [c(14), c(12)]), "push");
assert.equal(settleBlackjack([c(10), c(6), c(9)], [c(10), c(8)]), "bust");
assert.equal(settleBlackjack([c(10), c(8)], [c(10), c(6), c(9)]), "win");
assert.equal(settleBlackjack([c(10), c(8)], [c(10), c(8)]), "push");
assert.equal(settleBlackjack([c(10), c(7)], [c(10), c(8)]), "lose");
assert.equal(blackjackReturn("blackjack", 10), 25);
assert.equal(blackjackReturn("win", 50), 100);
assert.equal(blackjackReturn("push", 50), 50);
assert.equal(blackjackReturn("bust", 50), 0);
assert.ok(dealerMustHit([c(10), c(6)]) && !dealerMustHit([c(10), c(7)]) && !dealerMustHit([c(14), c(6)]));

const hand = (spec) => spec.map(([r, s]) => c(r, s));
assert.equal(evaluatePokerHand(hand([[10, "S"], [11, "S"], [12, "S"], [13, "S"], [14, "S"]])), "royal-flush");
assert.equal(evaluatePokerHand(hand([[9, "H"], [10, "H"], [11, "H"], [12, "H"], [13, "H"]])), "straight-flush");
assert.equal(evaluatePokerHand(hand([[14, "H"], [2, "H"], [3, "H"], [4, "H"], [5, "H"]])), "straight-flush", "wheel straight flush");
assert.equal(evaluatePokerHand(hand([[5, "S"], [5, "H"], [5, "D"], [5, "C"], [9, "S"]])), "four-kind");
assert.equal(evaluatePokerHand(hand([[5, "S"], [5, "H"], [5, "D"], [9, "C"], [9, "S"]])), "full-house");
assert.equal(evaluatePokerHand(hand([[2, "S"], [5, "S"], [9, "S"], [11, "S"], [13, "S"]])), "flush");
assert.equal(evaluatePokerHand(hand([[14, "S"], [2, "H"], [3, "D"], [4, "C"], [5, "S"]])), "straight");
assert.equal(evaluatePokerHand(hand([[10, "S"], [11, "H"], [12, "D"], [13, "C"], [14, "S"]])), "straight", "broadway is not a royal without a flush");
assert.equal(evaluatePokerHand(hand([[12, "S"], [13, "H"], [14, "D"], [2, "C"], [3, "S"]])), "nothing", "no wrap-around straight");
assert.equal(evaluatePokerHand(hand([[7, "S"], [7, "H"], [7, "D"], [2, "C"], [9, "S"]])), "three-kind");
assert.equal(evaluatePokerHand(hand([[7, "S"], [7, "H"], [9, "D"], [9, "C"], [2, "S"]])), "two-pair");
assert.equal(evaluatePokerHand(hand([[11, "S"], [11, "H"], [9, "D"], [4, "C"], [2, "S"]])), "jacks-or-better");
assert.equal(evaluatePokerHand(hand([[10, "S"], [10, "H"], [9, "D"], [4, "C"], [2, "S"]])), "nothing", "pair of tens does not pay");
assert.equal(pokerPays("full-house"), 9);
assert.equal(pokerPays("flush"), 6);
assert.equal(pokerPays("nothing"), 0);
assert.deepEqual(
  drawPokerHand(hand([[2, "S"], [3, "S"], [4, "S"], [5, "S"], [6, "S"]]), [true, false, true, false, false], hand([[9, "H"], [10, "H"], [11, "H"]])).map((k) => `${k.rank}${k.suit}`),
  ["2S", "9H", "4S", "10H", "11H"],
);

// --- high & low ---
{
  const full = newDeck();
  const ace = c(14);
  const none = highLowOdds(ace, full.filter((k) => !(k.rank === 14 && k.suit === "S")));
  assert.equal(none.higher.mult, 0, "nothing beats an ace");
  assert.equal(none.higher.count, 0);
  assert.equal(none.lower.count, 48, "48 cards are lower than an ace");
  const mid = highLowOdds(c(8), full.filter((k) => !(k.rank === 8 && k.suit === "S")));
  assert.equal(mid.higher.count, 24);
  assert.equal(mid.lower.count, 24);
  assert.ok(mid.higher.mult >= 1.9 && mid.higher.mult < 2.1, `8: higher pays about x2 (${mid.higher.mult})`);
  assert.ok(highLowOdds(c(2), full.filter((k) => !(k.rank === 2 && k.suit === "S"))).higher.mult >= HIGHLOW_MIN_MULT);
  assert.ok(guessWins("higher", c(5), c(9)) && !guessWins("higher", c(5), c(5)) && !guessWins("lower", c(5), c(5)) && guessWins("lower", c(9), c(3)));
  assert.equal(highLowPot(100, [1.5, 2]), 300);
  assert.equal(highLowPot(10, []), 10);
  // Best-side guess every time, cash out after one win: RTP must stay under 100% but close to the 96% target.
  let staked = 0;
  let returned = 0;
  for (let i = 0; i < 60000; i += 1) {
    const deck = shuffle(newDeck(), (n) => Math.floor(Math.random() * n));
    const cur = deck.shift();
    const o = highLowOdds(cur, deck);
    const side = o.higher.mult >= o.lower.mult ? "higher" : "lower";
    const next = deck.shift();
    staked += 10;
    if (guessWins(side, cur, next)) returned += highLowPot(10, [o[side].mult]);
  }
  const rtp = returned / staked;
  console.log(`high&low: RTP ${(rtp * 100).toFixed(1)}% (betting the bigger payout, cash out after one)`);
  assert.ok(rtp > 0.9 && rtp < 1.0, "high&low must not be a money machine");
  assert.ok(HIGHLOW_MAX_MULT >= 10);
}

// --- sic bo ---
{
  for (const bet of ["big", "small"]) assert.ok(Math.abs(sicBoRtp(bet) - 105 / 108) < 1e-9, `${bet} RTP is 105/108`);
  for (const bet of SICBO_BETS.filter((b) => b.id.startsWith("n"))) assert.ok(Math.abs(sicBoRtp(bet.id) - 199 / 216) < 1e-9, `${bet.id} RTP is 199/216`);
  assert.equal(betReturn("big", 10, [6, 6, 6]), 0, "triples lose big");
  assert.equal(betReturn("small", 10, [1, 1, 1]), 0, "triples lose small");
  assert.equal(betReturn("big", 10, [4, 4, 5]), 20);
  assert.equal(betReturn("small", 10, [1, 2, 3]), 20);
  assert.equal(betReturn("n3", 10, [3, 3, 1]), 30, "two matching dice pay 2:1 plus the stake");
  assert.equal(betReturn("n3", 10, [3, 3, 3]), 40);
  assert.equal(betReturn("n3", 10, [1, 2, 4]), 0);
  const settled = settleSicBo({ big: 100, n6: 10, small: 50 }, [6, 5, 2]);
  assert.equal(settled.totalStake, 160);
  assert.equal(settled.totalReturn, 200 + 20);
  assert.deepEqual(settled.wins.sort(), ["big", "n6"]);
  assert.equal(settled.net, 60);
  const dice = rollDice((n) => Math.floor(Math.random() * n));
  assert.ok(dice.every((d) => d >= 1 && d <= 6) && diceTotal(dice) >= 3 && typeof isTriple(dice) === "boolean");
}

console.log("casino logic OK");
