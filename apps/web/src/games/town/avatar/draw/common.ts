// Shared drawing helpers for the avatar renderer.
// Avatar local coordinates: feet at (0, 0), up is -y, head centre (0, -44).

export type Ctx = CanvasRenderingContext2D;
export type Facing = "front" | "back";
/** Which way the avatar heads on screen (up = away from the camera). */
export type Direction8 = "down" | "down-right" | "right" | "up-right" | "up" | "up-left" | "left" | "down-left";

const DIRECTION_BY_SECTOR: readonly Direction8[] = ["right", "down-right", "down", "down-left", "left", "up-left", "up", "up-right"];

/** Nearest of the 8 screen directions for a screen-space movement vector (y grows downward). */
export function directionOf(screenDx: number, screenDy: number): Direction8 {
  const sector = Math.round(Math.atan2(screenDy, screenDx) / (Math.PI / 4));
  return DIRECTION_BY_SECTOR[((sector % 8) + 8) % 8];
}

export const LINE = "rgba(74, 46, 42, 0.92)";
export const LINE_WIDTH = 0.95;
export const HEAD_Y = -44;
export const HIP_Y = -13;
export const EYE_Y = -41.2;
export const EYE_X = 6.5;

export function shade(hex: string, amount: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const mix = (c: number) => (amount >= 0 ? c + (255 - c) * amount : c * (1 + amount));
  const r = clamp(mix((n >> 16) & 255));
  const g = clamp(mix((n >> 8) & 255));
  const b = clamp(mix(n & 255));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/** Mix two #rrggbb colors (t = 0 → a, 1 → b). */
export function mix(a: string, b: string, t: number): string {
  const p = Number.parseInt(a.slice(1), 16);
  const q = Number.parseInt(b.slice(1), 16);
  const ch = (sh: number) => Math.round(((p >> sh) & 255) * (1 - t) + ((q >> sh) & 255) * t);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
}

const HEX = /^#[0-9a-f]{6}$/i;
const outlineCache = new Map<string, string>();

/**
 * Pigg-style outline: a deeper, slightly warm version of the fill instead of one dark line color,
 * which keeps light parts soft and dark parts crisp.
 */
export function outlineOf(fill: string): string {
  if (!HEX.test(fill)) return LINE;
  let out = outlineCache.get(fill);
  if (!out) {
    out = mix(shade(fill, -0.58), "#3a2620", 0.45);
    outlineCache.set(fill, out);
  }
  return out;
}

/** Perceived brightness 0..1, used to pick readable accent colors. */
export function luminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

export function fillStroke(ctx: Ctx, fill: string, stroke = true) {
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    // roundRect() leaves a zero-length subpath at its origin; a round cap
    // (left over from line drawing) would stamp a dot there.
    ctx.lineCap = "butt";
    ctx.lineJoin = "round";
    ctx.strokeStyle = outlineOf(fill);
    ctx.lineWidth = LINE_WIDTH;
    ctx.stroke();
  }
}

export function ellipse(ctx: Ctx, x: number, y: number, rx: number, ry: number, fill: string, stroke = true, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  fillStroke(ctx, fill, stroke);
}

export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number | number[], fill: string, stroke = true) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  fillStroke(ctx, fill, stroke);
}

export function poly(ctx: Ctx, pts: Array<[number, number]>, fill: string, stroke = true) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (const [x, y] of pts.slice(1)) ctx.lineTo(x, y);
  ctx.closePath();
  fillStroke(ctx, fill, stroke);
}

export function line(ctx: Ctx, pts: Array<[number, number]>, color: string, width: number) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (const [x, y] of pts.slice(1)) ctx.lineTo(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
}

export function heartPath(ctx: Ctx, x: number, y: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(x, y + 3 * s);
  ctx.bezierCurveTo(x - 6 * s, y - 2 * s, x - 3 * s, y - 7 * s, x, y - 3.5 * s);
  ctx.bezierCurveTo(x + 3 * s, y - 7 * s, x + 6 * s, y - 2 * s, x, y + 3 * s);
  ctx.closePath();
}

export function starPath(ctx: Ctx, x: number, y: number, r: number, points = 5, inner = 0.45) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const rr = i % 2 === 0 ? r : r * inner;
    const ang = -Math.PI / 2 + (i * Math.PI) / points;
    const px = x + Math.cos(ang) * rr;
    const py = y + Math.sin(ang) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** Horizontal head scale per face shape, so hair and hats hug wider faces. */
export function headScaleX(face: string): number {
  if (face === "wide") return 1.09;
  if (face === "sharp" || face === "egg") return 0.97;
  return 1;
}
