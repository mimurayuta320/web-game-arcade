// Isometric drawing primitives shared by the floor, wall and object renderers.
import { shade } from "../avatar/draw/common";
import { TILE_H, TILE_W, toScreen } from "./areas";

export type Ctx = CanvasRenderingContext2D;
export type Pt = [number, number];

export { shade };

export function diamond(ctx: Ctx, sx: number, sy: number, inset = 0) {
  const hw = TILE_W / 2 - inset * 2;
  const hh = TILE_H / 2 - inset;
  ctx.beginPath();
  ctx.moveTo(sx, sy - hh);
  ctx.lineTo(sx + hw, sy);
  ctx.lineTo(sx, sy + hh);
  ctx.lineTo(sx - hw, sy);
  ctx.closePath();
}

/** Diamond covering a w*h footprint starting at tile (x, y). */
export function footprintPath(ctx: Ctx, x: number, y: number, w: number, h: number, inset = 0) {
  const p = [
    toScreen(x - 0.5 + inset, y - 0.5 + inset),
    toScreen(x + w - 0.5 - inset, y - 0.5 + inset),
    toScreen(x + w - 0.5 - inset, y + h - 0.5 - inset),
    toScreen(x - 0.5 + inset, y + h - 0.5 - inset),
  ];
  ctx.beginPath();
  ctx.moveTo(p[0][0], p[0][1]);
  for (const q of p.slice(1)) ctx.lineTo(q[0], q[1]);
  ctx.closePath();
}

export function polyFill(ctx: Ctx, pts: Pt[], fill: string, stroke: string | null = "rgba(40,28,24,0.35)") {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

export type BoxFaces = { top: Pt[]; left: Pt[]; right: Pt[] };

/**
 * Axis-aligned box on the iso grid, footprint from (x,y) of size w*h tiles.
 * "left" is the face toward +y (screen lower-left), "right" toward +x.
 */
export function isoBox(
  ctx: Ctx,
  x: number, y: number, w: number, h: number,
  height: number, top: string, inset = 0, lift = 0,
): BoxFaces {
  const x0 = x - 0.5 + inset;
  const y0 = y - 0.5 + inset;
  const x1 = x + w - 0.5 - inset;
  const y1 = y + h - 0.5 - inset;
  const pTop = toScreen(x0, y0);
  const pRight = toScreen(x1, y0);
  const pBottom = toScreen(x1, y1);
  const pLeft = toScreen(x0, y1);
  const up = (p: Pt, d: number): Pt => [p[0], p[1] - d];
  const hi = height + lift;
  const faces: BoxFaces = {
    left: [up(pLeft, lift), up(pBottom, lift), up(pBottom, hi), up(pLeft, hi)],
    right: [up(pBottom, lift), up(pRight, lift), up(pRight, hi), up(pBottom, hi)],
    top: [up(pTop, hi), up(pRight, hi), up(pBottom, hi), up(pLeft, hi)],
  };
  polyFill(ctx, faces.left, shade(top, -0.18));
  polyFill(ctx, faces.right, shade(top, -0.32));
  polyFill(ctx, faces.top, top);
  return faces;
}

/** Point on a face quad: u along the bottom edge (0..1), v up the face (0..1). */
export function facePoint(face: Pt[], u: number, v: number): Pt {
  const [a, b, c, d] = face; // bottom-left, bottom-right, top-right, top-left
  const bx = a[0] + (b[0] - a[0]) * u;
  const by = a[1] + (b[1] - a[1]) * u;
  const tx = d[0] + (c[0] - d[0]) * u;
  const ty = d[1] + (c[1] - d[1]) * u;
  return [bx + (tx - bx) * v, by + (ty - by) * v];
}

/** Sub-quad of a face, for windows, doors and panels. */
export function faceQuad(face: Pt[], u0: number, u1: number, v0: number, v1: number): Pt[] {
  return [facePoint(face, u0, v0), facePoint(face, u1, v0), facePoint(face, u1, v1), facePoint(face, u0, v1)];
}

export function shadow(ctx: Ctx, sx: number, sy: number, rx: number, ry: number) {
  ctx.beginPath();
  ctx.ellipse(sx, sy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.16)";
  ctx.fill();
}

export function circle(ctx: Ctx, x: number, y: number, r: number, fill: string, stroke = "rgba(40,60,30,0.35)") {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

export function label(ctx: Ctx, text: string, x: number, y: number, bg: string, fg = "#ffffff", size = 10) {
  ctx.font = `bold ${size}px system-ui, sans-serif`;
  const w = ctx.measureText(text).width + 10;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - size / 2 - 4, w, size + 8, 4);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
}
