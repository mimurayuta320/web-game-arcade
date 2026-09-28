"use client";

import styles from "@/app/games/town/town.module.css";
import { circleRadius, reelZones, type ReelGrade, type ReelMode, type ReelRod } from "../fishing/reel";

type Props = {
  /** Shrink progress of this round, 0 (full size) .. 1 (fully shrunk). */
  size: number;
  /** Radius of the target frame, in arena radii. */
  target: number;
  mode: ReelMode;
  /** Grade of the last release (shown while `mode` is "flash"). */
  grade: ReelGrade;
  /** Gauge change of the last round (null before the first release). */
  lastGain: number | null;
  /** Still holding from a shrunk-out round: let go before the next one. */
  needRelease: boolean;
  rod: ReelRod;
  /** Fish size factor: bigger fish give a narrower frame. */
  frame: number;
  secondsLeft: number;
};

const WIDTH = 240;
const HEIGHT = 266;
const C = WIDTH / 2;
/** Pixels (in the 240-wide drawing) per arena radius. */
const UNIT = 100;

const GRADE_LABEL: Record<ReelGrade, string> = { perfect: "PERFECT!", great: "GREAT!", hit: "GOOD", miss: "BAD" };

/**
 * A big circle shrinks while you hold. Let go while it is inside the coloured frame: PERFECT in the pink middle,
 * GREAT in the orange, GOOD in the yellow. The frame is wider with a better rod and narrower for a bigger fish.
 */
export function ReelDial({ size, target, mode, grade, lastGain, needRelease, rod, frame, secondsLeft }: Props) {
  const z = reelZones(rod, frame);
  const radius = circleRadius(size) * UNIT;
  const result = mode === "flash" && lastGain !== null;
  const label = result
    ? GRADE_LABEL[grade]
    : mode === "hold"
      ? "わくの中ではなそう！"
      : mode === "flash"
        ? "スタンバイ…"
        : needRelease ? "いちど はなしてね" : "長押しでスタート";
  const labelKind = result ? grade : mode === "hold" ? "hold" : "idle";
  return (
    <svg className={styles.reelDial} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="リールのまと">
      <circle cx={C} cy={C} r={UNIT} className={styles.dialArena} />
      <circle cx={C} cy={C} r={target * UNIT} className={styles.dialBand} data-zone="hit" strokeWidth={z.hit * 2 * UNIT} />
      <circle cx={C} cy={C} r={target * UNIT} className={styles.dialBand} data-zone="great" strokeWidth={z.great * 2 * UNIT} />
      <circle cx={C} cy={C} r={target * UNIT} className={styles.dialBand} data-zone="perfect" strokeWidth={z.perfect * 2 * UNIT} />
      <circle cx={C} cy={C} r={radius} className={styles.dialCatch} data-grade={result ? grade : "idle"} data-mode={mode} />
      <text x={C} y={C} className={styles.dialFish} textAnchor="middle" dominantBaseline="central">🐟</text>
      <text x={C} y={C + 126} className={styles.dialGrade} data-grade={labelKind} textAnchor="middle">
        {label}
      </text>
      <text x={C} y={C + 145} className={styles.dialTime} textAnchor="middle">
        {result && lastGain !== null ? `ゲージ ${lastGain >= 0 ? "+" : ""}${Math.round(lastGain * 100)}% ・ ` : ""}のこり {secondsLeft}秒
      </text>
    </svg>
  );
}
