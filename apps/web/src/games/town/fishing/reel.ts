// Reeling minigame model (pure, no DOM). A big circle stays put in the middle and shrinks while you hold. A target
// frame (a ring with a PERFECT / GREAT / GOOD band) is drawn at a smaller size; LET GO while the circle is inside
// the frame. The closer the circle is to the middle of the frame, the better the grade and the more the catch
// gauge fills. Letting go too early, or holding until the circle has shrunk all the way, is BAD and drains the
// gauge. Full gauge = caught; empty gauge or time up = got away.
// The frame is wider with a better rod and narrower for a bigger fish; a faster / stronger fish shrinks the
// circle faster and less predictably.
// Sizes are in arena radii (the arena is 1 across from the centre to the edge).

export type ReelGrade = "perfect" | "great" | "hit" | "miss";

export type ReelFish = { power: number; speed: number; frame?: number };
export type ReelRod = { zone: number; drain: number };
/** `holding` is the pointer button / space bar. */
export type ReelInput = { holding: boolean };

/** wait: circle at full size, press to start; hold: shrinking; flash: showing the last result. */
export type ReelMode = "wait" | "hold" | "flash";

export type ReelState = {
  /** Shrink progress of the current round, 0 (full size) .. 1 (fully shrunk). */
  size: number;
  /** Radius of the target frame for the current round. */
  target: number;
  /** This round's shrink speed factor (strong fish are unpredictable). */
  pace: number;
  gauge: number;
  mode: ReelMode;
  flashT: number;
  /** After a shrunk-out round the button must be let go before the next one can start. */
  needRelease: boolean;
  elapsed: number;
  rounds: number;
  perfects: number;
  /** Grade of the last release (while flashing). */
  grade: ReelGrade;
  /** Gauge change of the last round, for the result pop-up (null before the first round). */
  lastGain: number | null;
  done: "caught" | "escaped" | null;
};

export const REEL_TIME_LIMIT = 40;
export const REEL_START_GAUGE = 0.3;

/** Circle radius at full size and fully shrunk. */
export const CIRCLE_MAX = 0.85;
export const CIRCLE_MIN = 0.06;
/** Seconds for the circle to shrink all the way at fish speed 1. */
export const SHRINK_TIME = 1.6;
const FLASH_TIME = 0.8;
const INTRO_TIME = 0.6;
const ROUND_GAIN: Record<ReelGrade, number> = { perfect: 0.22, great: 0.13, hit: 0.06, miss: -0.2 };

/** Half widths of the frame's bands (radius units), widened by better rods and narrowed by bigger fish. */
export function reelZones(rod: ReelRod, frame = 1): { perfect: number; great: number; hit: number } {
  const k = rod.zone * frame;
  return { perfect: Math.min(0.09, 0.033 * k), great: Math.min(0.16, 0.075 * k), hit: Math.min(0.24, 0.128 * k) };
}

export function circleRadius(size: number): number {
  return CIRCLE_MAX - (CIRCLE_MAX - CIRCLE_MIN) * Math.max(0, Math.min(1, size));
}

/** Shrink progress at which the circle is exactly `radius` wide. */
export function sizeForRadius(radius: number): number {
  return (CIRCLE_MAX - radius) / (CIRCLE_MAX - CIRCLE_MIN);
}

export function gradeAt(size: number, target: number, rod: ReelRod, frame = 1): ReelGrade {
  const d = Math.abs(circleRadius(size) - target);
  const z = reelZones(rod, frame);
  if (d <= z.perfect) return "perfect";
  if (d <= z.great) return "great";
  if (d <= z.hit) return "hit";
  return "miss";
}

export function roundGain(grade: ReelGrade, rod: ReelRod): number {
  return grade === "miss" ? ROUND_GAIN.miss * rod.drain : ROUND_GAIN[grade];
}

function nextRound(s: ReelState, fish: ReelFish, random: () => number) {
  s.size = 0;
  s.target = 0.32 + random() * 0.14;
  s.pace = 1 + (random() * 2 - 1) * Math.min(1, fish.power) * 0.25;
}

export function newReel(): ReelState {
  return {
    size: 0, target: 0.38, pace: 1, gauge: REEL_START_GAUGE, mode: "flash", flashT: INTRO_TIME, needRelease: false,
    elapsed: 0, rounds: 0, perfects: 0, grade: "miss", lastGain: null, done: null,
  };
}

/** Advance by `dt` seconds. `random` returns [0, 1). */
export function stepReel(s: ReelState, dt: number, input: ReelInput, fish: ReelFish, rod: ReelRod, random: () => number): ReelState {
  if (s.done) return s;
  const next = { ...s };
  const frame = fish.frame ?? 1;
  next.elapsed += dt;

  if (next.mode === "flash") {
    next.flashT -= dt;
    if (next.flashT <= 0) {
      next.mode = "wait";
      next.grade = "miss";
      nextRound(next, fish, random);
    }
  } else {
    if (next.needRelease && !input.holding) next.needRelease = false;
    if (next.mode === "wait" && input.holding && !next.needRelease) next.mode = "hold";
  }

  if (next.mode === "hold") {
    next.size = Math.min(1, next.size + (dt * Math.max(0.5, fish.speed) * next.pace) / SHRINK_TIME);
    const shrunkOut = next.size >= 1;
    if (!input.holding || shrunkOut) {
      // Let go (or ran out of circle): score it. The circle stays where it was while the result shows.
      const grade: ReelGrade = shrunkOut ? "miss" : gradeAt(next.size, next.target, rod, frame);
      const gain = roundGain(grade, rod);
      next.gauge = Math.max(0, Math.min(1, next.gauge + gain));
      next.rounds += 1;
      if (grade === "perfect") next.perfects += 1;
      next.grade = grade;
      next.lastGain = gain;
      next.mode = "flash";
      next.flashT = FLASH_TIME;
      next.needRelease = shrunkOut && input.holding;
      if (next.gauge >= 1) next.done = "caught";
      else if (next.gauge <= 0) next.done = "escaped";
    }
  }
  if (!next.done && next.elapsed >= REEL_TIME_LIMIT) next.done = "escaped";
  return next;
}

/** Share of the rounds released in the PERFECT band (0..1): bigger fish and more points. */
export function perfectRatio(s: ReelState): number {
  return s.rounds > 0 ? Math.min(1, s.perfects / s.rounds) : 0;
}
