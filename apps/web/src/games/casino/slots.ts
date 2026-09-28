// Slot machine logic: 3 reels x 3 rows, 5 fixed paylines. Pure functions only (no imports),
// so it can be exercised directly with node in scripts/casino-check.mjs.

export type SlotSymbol = "cherry" | "lemon" | "grape" | "bell" | "bar" | "seven";

export const SLOT_LINE_COUNT = 5;

export const SLOT_EMOJI: Record<SlotSymbol, string> = {
  cherry: "🍒",
  lemon: "🍋",
  grape: "🍇",
  bell: "🔔",
  bar: "BAR",
  seven: "7️⃣",
};

/** Multiplier of the per-line bet for three of a kind. Tuned so computeSlotRtp() ≈ 95.2%. */
export const SLOT_TRIPLE_PAY: Record<SlotSymbol, number> = {
  seven: 300,
  bar: 75,
  bell: 35,
  grape: 18,
  lemon: 10,
  cherry: 6,
};

/** Cherries pay from the left even without a full line. */
export const SLOT_CHERRY_ONE = 1;
export const SLOT_CHERRY_TWO = 2;

// Rows are [top, middle, bottom]; each line picks one row index per reel.
export const SLOT_LINES: ReadonlyArray<readonly [number, number, number]> = [
  [1, 1, 1],
  [0, 0, 0],
  [2, 2, 2],
  [0, 1, 2],
  [2, 1, 0],
];

export const SLOT_LINE_LABELS = ["中段", "上段", "下段", "ななめ↘", "ななめ↗"];

// 24 stops. Same strip on every reel; symbols are spread out so neighbours rarely repeat.
export const SLOT_STRIP: readonly SlotSymbol[] = [
  "cherry", "lemon", "grape", "cherry", "bell", "lemon",
  "cherry", "grape", "bar", "lemon", "cherry", "bell",
  "lemon", "grape", "seven", "cherry", "lemon", "bell",
  "cherry", "grape", "bar", "lemon", "cherry", "bar",
];

export type SlotWin = {
  line: number;
  symbol: SlotSymbol;
  count: number;
  multiplier: number;
};

export type SlotResult = {
  stops: [number, number, number];
  /** grid[reel][row] */
  grid: SlotSymbol[][];
  wins: SlotWin[];
  totalMultiplier: number;
};

export function symbolAt(reel: number, stop: number): SlotSymbol {
  void reel;
  const n = SLOT_STRIP.length;
  return SLOT_STRIP[((stop % n) + n) % n];
}

export function buildGrid(stops: readonly [number, number, number]): SlotSymbol[][] {
  return stops.map((stop, reel) => [
    symbolAt(reel, stop - 1),
    symbolAt(reel, stop),
    symbolAt(reel, stop + 1),
  ]);
}

export function evaluateGrid(grid: SlotSymbol[][]): { wins: SlotWin[]; totalMultiplier: number } {
  const wins: SlotWin[] = [];
  SLOT_LINES.forEach((rows, line) => {
    const [a, b, c] = rows.map((row, reel) => grid[reel][row]);
    if (a === b && b === c) {
      wins.push({ line, symbol: a, count: 3, multiplier: SLOT_TRIPLE_PAY[a] });
      return;
    }
    if (a === "cherry") {
      const count = b === "cherry" ? 2 : 1;
      wins.push({ line, symbol: "cherry", count, multiplier: count === 2 ? SLOT_CHERRY_TWO : SLOT_CHERRY_ONE });
    }
  });
  return { wins, totalMultiplier: wins.reduce((sum, win) => sum + win.multiplier, 0) };
}

export function spinWithStops(stops: [number, number, number]): SlotResult {
  const grid = buildGrid(stops);
  return { stops, grid, ...evaluateGrid(grid) };
}

/** `randomInt(n)` must return an unbiased integer in [0, n). */
export function spinSlots(randomInt: (n: number) => number): SlotResult {
  const n = SLOT_STRIP.length;
  return spinWithStops([randomInt(n), randomInt(n), randomInt(n)]);
}

/** Bets are multiples of 10, so a line bet is always a whole number. */
export function lineBet(totalBet: number): number {
  return Math.floor(totalBet / SLOT_LINE_COUNT);
}

export function slotPayout(totalBet: number, result: Pick<SlotResult, "totalMultiplier">): number {
  return lineBet(totalBet) * result.totalMultiplier;
}

/** Exact return-to-player over every possible stop combination. */
export function computeSlotRtp(): { rtp: number; hitRate: number; combos: number } {
  const n = SLOT_STRIP.length;
  let multiplierSum = 0;
  let hits = 0;
  for (let a = 0; a < n; a++) {
    for (let b = 0; b < n; b++) {
      for (let c = 0; c < n; c++) {
        const { totalMultiplier } = spinWithStops([a, b, c]);
        multiplierSum += totalMultiplier;
        if (totalMultiplier > 0) hits++;
      }
    }
  }
  const combos = n * n * n;
  return { rtp: multiplierSum / combos / SLOT_LINE_COUNT, hitRate: hits / combos, combos };
}
