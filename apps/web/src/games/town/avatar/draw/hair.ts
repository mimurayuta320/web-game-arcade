// Hairstyles: a back layer (behind the body, front view), a front layer
// (after the face) and a full back view.
// Pigg-like hair: a soft rounded cap, bangs made of plump locks, side locks
// that hide the ears, a glossy "angel ring" highlight and a few strand lines.
import type { AvatarConfig } from "../parts";
import { ellipse, fillStroke, line, mix, outlineOf, shade, type Ctx } from "./common";
import { headPath } from "./face";

type Pt = [number, number];

// ------------------------------------------------------------------ helpers

/** Vertical gradient: a little lighter on top, deeper toward the tips. */
function hairFill(ctx: Ctx, c: string, top: number, bottom: number, deep = 0) {
  const g = ctx.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, shade(c, 0.1 - deep));
  g.addColorStop(0.5, shade(c, -deep));
  g.addColorStop(1, shade(c, -0.16 - deep));
  return g;
}

/** Fill the current path with hair shading and a colored outline. */
function paint(ctx: Ctx, c: string, top: number, bottom: number, deep = 0) {
  ctx.fillStyle = hairFill(ctx, c, top, bottom, deep);
  ctx.fill();
  ctx.strokeStyle = outlineOf(shade(c, -deep));
  ctx.lineWidth = 0.95;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();
}

/** Hairline height at x: higher in the middle of the forehead. */
function hairline(x: number, base = -51.2) {
  return base + (x / 17) ** 2 * 5;
}

/**
 * Bangs as plump locks. `tips` run from the right temple to the left one;
 * between two tips the edge climbs back up to the hairline.
 */
function traceBangs(ctx: Ctx, tips: Pt[], base = -51.2) {
  let prev = tips[0];
  ctx.lineTo(prev[0], prev[1]);
  for (let i = 1; i < tips.length; i += 1) {
    const tip = tips[i];
    const rx = (prev[0] + tip[0]) / 2;
    const root: Pt = [rx, Math.min(hairline(rx, base), Math.min(prev[1], tip[1]) - 2.5)];
    // Up from the previous tip, then down into the next one: each side bulges a little.
    ctx.quadraticCurveTo(prev[0] + (root[0] - prev[0]) * 0.75, prev[1] - (prev[1] - root[1]) * 0.25, root[0], root[1]);
    ctx.quadraticCurveTo(tip[0] + (root[0] - tip[0]) * 0.75, tip[1] - (tip[1] - root[1]) * 0.25, tip[0], tip[1]);
    prev = tip;
  }
}

/** The hair cap over the skull, closed along the bangs. */
function capPath(ctx: Ctx, tips: Pt[], top = -65, width = 18.6, base = -51.2) {
  const yc = -40 + (top + 40) / 0.75;
  ctx.beginPath();
  ctx.moveTo(-width, -40);
  ctx.bezierCurveTo(-width - 1.6, yc, width + 1.6, yc, width, -40);
  traceBangs(ctx, tips, base);
  ctx.lineTo(-width, -40);
  ctx.closePath();
}

/** Glossy ring and strand lines, clipped to the current path. */
function gloss(ctx: Ctx, c: string, pathFn: () => void, ringY = -57, strands: Pt[][] = []) {
  ctx.save();
  pathFn();
  ctx.clip();
  // Angel ring: a soft light band broken into a few pieces.
  ctx.strokeStyle = mix(c, "#ffffff", 0.45);
  ctx.globalAlpha = 0.55;
  ctx.lineCap = "round";
  for (const [a0, a1, w] of [[1.18, 1.36, 2.2], [1.42, 1.62, 2.6], [1.68, 1.8, 2]] as Array<[number, number, number]>) {
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.ellipse(0, ringY + 13, 15.5, 13, 0, a0 * Math.PI, a1 * Math.PI);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 0.65;
  ctx.strokeStyle = shade(c, -0.25);
  for (const s of strands) {
    ctx.beginPath();
    ctx.moveTo(s[0][0], s[0][1]);
    if (s.length === 3) ctx.quadraticCurveTo(s[1][0], s[1][1], s[2][0], s[2][1]);
    else ctx.lineTo(s[1][0], s[1][1]);
    ctx.stroke();
  }
  ctx.restore();
}

/** Soft shadow that the bangs cast on the forehead. */
function foreheadShadow(ctx: Ctx, a: AvatarConfig, tips: Pt[], base = -51.2) {
  ctx.save();
  headPath(ctx, a.face);
  ctx.clip();
  ctx.translate(0.3, 1.5);
  capPath(ctx, tips, -65, 18.6, base);
  ctx.fillStyle = shade(a.skin, -0.2);
  ctx.globalAlpha = 0.4;
  ctx.fill();
  ctx.restore();
}

/** Cap with bangs, shading, gloss and strands. */
function cap(ctx: Ctx, a: AvatarConfig, c: string, tips: Pt[], opts: { top?: number; base?: number; shadow?: boolean } = {}) {
  const top = opts.top ?? -65;
  const base = opts.base ?? -51.2;
  if (opts.shadow !== false) foreheadShadow(ctx, a, tips, base);
  const path = () => capPath(ctx, tips, top, 18.6, base);
  path();
  paint(ctx, c, top, -40);
  // Strands run from the crown into the bigger locks.
  const strands: Pt[][] = tips
    .filter((t, i) => i > 0 && i < tips.length - 1 && t[1] > base + 1.5)
    .slice(0, 5)
    .map((t) => [[t[0] * 0.55, top + 6], [t[0] * 0.9, (top + t[1]) / 2 + 2], [t[0], t[1] - 1.6]] as Pt[]);
  gloss(ctx, c, path, top + 8, strands);
}

/** Side lock in front of the ear (もみあげ / face-framing lock). */
function sideLock(ctx: Ctx, c: string, side: number, bottom: number, width = 4.6, top = -50) {
  const outer = side * 18.4;
  const inner = side * (18.4 - width);
  ctx.beginPath();
  ctx.moveTo(outer, top);
  ctx.bezierCurveTo(outer + side * 0.8, (top + bottom) / 2, outer - side * 0.6, bottom - 2, outer - side * width * 0.4, bottom);
  ctx.bezierCurveTo(inner + side * 0.6, bottom - 3, inner - side * 0.4, (top + bottom) / 2, inner, top);
  ctx.closePath();
  paint(ctx, c, top, bottom);
}

/** Straight-cut side lock (ひめカット). */
function blockLock(ctx: Ctx, c: string, side: number, bottom: number) {
  const outer = side * 18.6;
  const inner = side * 12.8;
  ctx.beginPath();
  ctx.moveTo(outer, -50);
  ctx.quadraticCurveTo(outer + side * 0.6, (bottom - 50) / 2, outer, bottom);
  ctx.lineTo(inner, bottom);
  ctx.quadraticCurveTo(inner - side * 0.6, (bottom - 50) / 2, inner, -50);
  ctx.closePath();
  paint(ctx, c, -50, bottom);
}

/** Long hair behind the shoulders with softly rounded ends. */
function longBack(ctx: Ctx, c: string, bottom: number, width = 19.4, scallops = 4, deep = 0.08) {
  ctx.beginPath();
  ctx.moveTo(-width + 1, -52);
  ctx.bezierCurveTo(-width - 1.4, -44, -width - 0.6, bottom - 8, -width + 1.6, bottom);
  const step = ((width - 1.6) * 2) / scallops;
  for (let i = 0; i < scallops; i += 1) {
    const x0 = -width + 1.6 + i * step;
    ctx.quadraticCurveTo(x0 + step / 2, bottom + 3, x0 + step, bottom);
  }
  ctx.bezierCurveTo(width + 0.6, bottom - 8, width + 1.4, -44, width - 1, -52);
  ctx.closePath();
  paint(ctx, c, -52, bottom, deep);
  ctx.save();
  ctx.globalAlpha = 0.4;
  for (const x of [-width * 0.6, -width * 0.2, width * 0.25, width * 0.62]) {
    line(ctx, [[x * 0.9, -46], [x, bottom - 3]], shade(c, -0.3 - deep), 0.6);
  }
  ctx.restore();
}

/** A tail of hair hanging from `from`, bulging outward and ending in a soft point. */
function tail(ctx: Ctx, c: string, from: Pt, to: Pt, bulge: number, width = 5.5) {
  const [fx, fy] = from;
  const [tx, ty] = to;
  const mx = (fx + tx) / 2 + bulge;
  const my = (fy + ty) / 2;
  ctx.beginPath();
  ctx.moveTo(fx - width * 0.5, fy);
  ctx.bezierCurveTo(mx - width * 1.3, my - 4, mx - width * 0.6, ty - 3, tx, ty);
  ctx.bezierCurveTo(mx + width * 1.1, ty - 5, mx + width * 1.2, my - 6, fx + width * 0.5, fy);
  ctx.closePath();
  paint(ctx, c, fy, ty);
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.moveTo(fx, fy + 2);
  ctx.quadraticCurveTo(mx, my, tx + (mx - tx) * 0.3, ty - 3);
  ctx.strokeStyle = shade(c, -0.3);
  ctx.lineWidth = 0.6;
  ctx.stroke();
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(fx + bulge * 0.2, fy + 3);
  ctx.quadraticCurveTo(mx - bulge * 0.1, my - 2, mx - bulge * 0.3, my + 3);
  ctx.strokeStyle = mix(c, "#ffffff", 0.45);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
}

function scrunchie(ctx: Ctx, x: number, y: number, color = "#f0587d") {
  ellipse(ctx, x, y, 2.5, 2.1, color);
  ellipse(ctx, x - 0.7, y - 0.6, 0.8, 0.6, "rgba(255,255,255,0.7)", false);
}

function braid(ctx: Ctx, x: number, c: string, from: number, to: number) {
  for (let y = from; y <= to; y += 3.4) {
    const k = ((y - from) / 3.4) % 2 === 0 ? 1 : -1;
    ellipse(ctx, x + k * 0.5, y, 3, 2.3, shade(c, k > 0 ? 0 : -0.06), true, k * 0.35);
  }
  scrunchie(ctx, x, to + 2.6);
  ctx.beginPath();
  ctx.moveTo(x - 1.6, to + 4);
  ctx.quadraticCurveTo(x, to + 9.5, x + 1.6, to + 4);
  ctx.closePath();
  fillStroke(ctx, c);
}

function ball(ctx: Ctx, c: string, x: number, y: number, rx: number, ry: number) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  paint(ctx, c, y - ry, y + ry);
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.ellipse(x, y, rx * 0.7, ry * 0.65, 0, 1.15 * Math.PI, 1.6 * Math.PI);
  ctx.strokeStyle = mix(c, "#ffffff", 0.45);
  ctx.lineWidth = 1.2;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.arc(x, y + ry * 0.2, rx * 0.55, 0.15 * Math.PI, 0.6 * Math.PI);
  ctx.strokeStyle = shade(c, -0.3);
  ctx.lineWidth = 0.6;
  ctx.stroke();
  ctx.restore();
}

/** Spiky tufts (front view: behind the cap; back view: on top). */
function spikes(ctx: Ctx, c: string, pts: Pt[]) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i += 1) {
    const [px, py] = pts[i - 1];
    const [x, y] = pts[i];
    ctx.quadraticCurveTo((px + x) / 2 + (y < py ? -0.8 : 0.8), (py + y) / 2, x, y);
  }
  ctx.closePath();
  paint(ctx, c, -74, -48);
}

// ------------------------------------------------------------------- bangs

const BANGS_ROUND: Pt[] = [[16.8, -41], [11.4, -45.4], [5.6, -47.2], [-0.2, -46.6], [-6, -47.2], [-11.6, -45.4], [-16.8, -41]];
const BANGS_STRAIGHT: Pt[] = [[16.8, -43.6], [13.2, -46.2], [9, -46.8], [4.6, -47], [0, -47], [-4.6, -47], [-9, -46.8], [-13.2, -46.2], [-16.8, -43.6]];
const BANGS_SIDE: Pt[] = [[16.8, -41.5], [12.4, -45.2], [7, -48.2], [1.8, -50], [-4, -49.4], [-9.6, -47.4], [-14.2, -44.4], [-16.8, -40.6]];
const BANGS_SEVEN_THREE: Pt[] = [[16.8, -42], [14.2, -48.6], [8.6, -48.8], [2.4, -48], [-3.6, -47.4], [-9.4, -46.2], [-14, -43.8], [-16.8, -40.4]];
const BANGS_MESSY: Pt[] = [[16.8, -41], [13.4, -46.4], [9.4, -44.6], [5.2, -48.2], [0.6, -45.6], [-3.8, -48.4], [-8.2, -45.2], [-12.4, -47], [-16.8, -41]];
const BANGS_MASH: Pt[] = [[17.2, -40.6], [14, -44.8], [9.6, -45.6], [4.8, -46], [0, -46], [-4.8, -46], [-9.6, -45.6], [-14, -44.8], [-17.2, -40.6]];

const SPIKES: Pt[] = [[-16, -50], [-18, -60], [-11.5, -58], [-9, -70], [-3, -61], [2, -73], [6, -61], [12, -68], [12.5, -57], [18, -59], [16, -50]];

// ------------------------------------------------------------ front view

export function drawHairBackLayer(ctx: Ctx, a: AvatarConfig) {
  const c = a.hairColor;
  switch (a.hair) {
    case "long":
    case "hime":
      longBack(ctx, c, -23);
      break;
    case "longstraight":
      longBack(ctx, c, -17, 19.2, 5);
      break;
    case "wavy":
      longBack(ctx, c, -27, 20.4, 5);
      for (const side of [-1, 1]) ball(ctx, shade(c, -0.06), side * 17.6, -28.6, 4.4, 4);
      break;
    case "bob":
    case "mash":
      longBack(ctx, c, -33.5, 19.6, 4);
      break;
    case "twintail":
      for (const side of [-1, 1]) tail(ctx, c, [side * 17, -51], [side * 22, -24], side * 6.5, 6);
      break;
    case "ponytail":
      tail(ctx, c, [-12, -56], [-21, -30], -6, 5.4);
      break;
    case "sidetail":
      tail(ctx, c, [16, -52], [22.5, -26], 6, 6);
      break;
    case "braid":
      braid(ctx, -15.6, c, -40, -27);
      braid(ctx, 15.6, c, -40, -27);
      break;
    case "afro":
      ball(ctx, c, 0, -50, 23.5, 19.5);
      break;
    case "hipony":
      tail(ctx, c, [0, -64], [-8, -40], -9, 5.4);
      break;
    case "sidebraid":
      braid(ctx, 16.4, c, -43, -27);
      break;
    case "wolf":
      longBack(ctx, c, -33, 19.6, 6);
      break;
    case "curly":
      for (const side of [-1, 1]) {
        ball(ctx, c, side * 18, -38, 4.8, 5.2);
        ball(ctx, c, side * 17, -31, 4.2, 4.4);
      }
      break;
  }
}

export function drawHairFront(ctx: Ctx, a: AvatarConfig) {
  const c = a.hairColor;
  switch (a.hair) {
    case "none":
      return;
    case "short":
      for (const side of [-1, 1]) sideLock(ctx, c, side, -39, 4.2);
      cap(ctx, a, c, BANGS_ROUND);
      break;
    case "twintail":
      for (const side of [-1, 1]) sideLock(ctx, c, side, -36, 4.4);
      cap(ctx, a, c, BANGS_ROUND);
      for (const side of [-1, 1]) scrunchie(ctx, side * 17.4, -51.5);
      break;
    case "spiky":
      spikes(ctx, c, SPIKES);
      for (const side of [-1, 1]) sideLock(ctx, c, side, -40, 4);
      cap(ctx, a, c, BANGS_MESSY);
      break;
    case "sidepart":
      for (const side of [-1, 1]) sideLock(ctx, c, side, -39.5, 4);
      cap(ctx, a, c, BANGS_SEVEN_THREE);
      break;
    case "messy":
      spikes(ctx, c, [[-16, -48], [-21.5, -54], [-16, -56], [-6, -63], [-4, -69], [1, -63], [16, -56], [21.5, -55], [16, -48]]);
      for (const side of [-1, 1]) sideLock(ctx, c, side, -38, 4.2);
      cap(ctx, a, c, BANGS_MESSY);
      break;
    case "mash":
      cap(ctx, a, c, BANGS_MASH, { top: -66, base: -52 });
      break;
    case "bob":
      for (const side of [-1, 1]) sideLock(ctx, c, side, -33.6, 6.2);
      cap(ctx, a, c, BANGS_STRAIGHT);
      break;
    case "hime":
      for (const side of [-1, 1]) blockLock(ctx, c, side, -34);
      cap(ctx, a, c, BANGS_STRAIGHT);
      break;
    case "long":
      for (const side of [-1, 1]) sideLock(ctx, c, side, -29, 5.6);
      cap(ctx, a, c, BANGS_SIDE);
      break;
    case "wavy":
      for (const side of [-1, 1]) {
        sideLock(ctx, c, side, -33, 5.8);
        ball(ctx, c, side * 16.4, -32, 3.8, 3.4);
      }
      cap(ctx, a, c, BANGS_SIDE);
      break;
    case "ponytail":
      for (const side of [-1, 1]) sideLock(ctx, c, side, -37, 4.2);
      cap(ctx, a, c, BANGS_SIDE);
      scrunchie(ctx, -15.6, -55);
      break;
    case "sidetail":
      for (const side of [-1, 1]) sideLock(ctx, c, side, -37, 4.2);
      cap(ctx, a, c, BANGS_SIDE);
      scrunchie(ctx, 16.4, -52.5);
      break;
    case "braid":
    case "sidebraid":
    case "hipony":
      for (const side of [-1, 1]) sideLock(ctx, c, side, -36.5, 4.2);
      cap(ctx, a, c, BANGS_SIDE);
      if (a.hair === "hipony") scrunchie(ctx, 0, -63.4);
      break;
    case "bun":
      ball(ctx, c, 0, -63.5, 7.6, 6.6);
      for (const side of [-1, 1]) sideLock(ctx, c, side, -37, 4.2);
      cap(ctx, a, c, BANGS_STRAIGHT);
      break;
    case "doublebun":
      for (const side of [-1, 1]) ball(ctx, c, side * 12.4, -60.5, 6.4, 6);
      for (const side of [-1, 1]) sideLock(ctx, c, side, -36.5, 4.2);
      cap(ctx, a, c, BANGS_ROUND);
      break;
    case "afro":
      cap(ctx, a, c, BANGS_STRAIGHT, { top: -66 });
      ctx.save();
      ctx.globalAlpha = 0.5;
      for (let x = -12; x <= 12; x += 6) {
        ctx.beginPath();
        ctx.arc(x, -50, 2.4, 0.9 * Math.PI, 2.1 * Math.PI);
        ctx.strokeStyle = shade(c, -0.3);
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
      ctx.restore();
      break;
    case "mohawk":
      ctx.save();
      ctx.globalAlpha = 0.28;
      capPath(ctx, [[16.8, -48], [-16.8, -48]], -63);
      ctx.fillStyle = c;
      ctx.fill();
      ctx.restore();
      spikes(ctx, c, [[-4.4, -57], [-6.4, -65], [-3, -64], [-4.2, -72], [0, -67], [2, -75], [3.2, -67], [6.4, -70], [4.4, -57]]);
      break;
    case "curly":
      for (const side of [-1, 1]) ball(ctx, c, side * 17.6, -44, 4.6, 6);
      cap(ctx, a, c, BANGS_ROUND);
      for (let x = -13.5; x <= 13.5; x += 6.75) ball(ctx, c, x, -54.5 - (Math.abs(x) < 8 ? 3 : 0), 5, 4.4);
      break;
    case "longstraight":
      for (const side of [-1, 1]) blockLock(ctx, c, side, -21);
      cap(ctx, a, c, BANGS_STRAIGHT);
      break;
    case "wolf":
      for (const side of [-1, 1]) sideLock(ctx, c, side, -34, 5);
      spikes(ctx, c, [[-16, -48], [-21.5, -53], [-15, -56], [15, -56], [21.5, -54], [16, -48]]);
      cap(ctx, a, c, BANGS_MESSY);
      break;
    case "pompadour":
      for (const side of [-1, 1]) sideLock(ctx, c, side, -40, 4);
      cap(ctx, a, c, BANGS_SIDE, { shadow: true });
      ball(ctx, c, 3, -64.5, 15, 7.6);
      break;
    default:
      cap(ctx, a, c, BANGS_ROUND);
  }
}

// -------------------------------------------------------------- back view

function backCap(ctx: Ctx, c: string) {
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(-18.4, -43);
    ctx.bezierCurveTo(-19.8, -71, 19.8, -71, 18.4, -43);
    ctx.bezierCurveTo(18.6, -35, 12, -30.6, 0, -30.4);
    ctx.bezierCurveTo(-12, -30.6, -18.6, -35, -18.4, -43);
    ctx.closePath();
  };
  path();
  paint(ctx, c, -64, -30);
  gloss(ctx, c, path, -57, [
    [[0, -62], [-3, -46], [-6, -32]],
    [[0, -62], [4, -46], [7, -32]],
    [[-8, -58], [-13, -46], [-14, -36]],
    [[8, -58], [13, -46], [14, -36]],
  ]);
}

export function drawHairBackView(ctx: Ctx, a: AvatarConfig) {
  const c = a.hairColor;
  switch (a.hair) {
    case "none":
      return;
    case "mohawk":
      ctx.save();
      ctx.globalAlpha = 0.3;
      ellipse(ctx, 0, -46, 17, 15, c, false);
      ctx.restore();
      spikes(ctx, c, [[-4, -36], [-5, -64], [0, -75], [5, -64], [4, -36]]);
      return;
    case "afro":
      ball(ctx, c, 0, -50, 23.5, 19.5);
      return;
    case "long":
    case "hime":
      longBack(ctx, c, -23, 19, 4, 0);
      break;
    case "wavy":
      longBack(ctx, c, -27, 20, 5, 0);
      break;
    case "bob":
    case "mash":
      longBack(ctx, c, -33.5, 19.4, 4, 0);
      break;
    case "spiky":
      spikes(ctx, c, SPIKES);
      break;
    case "messy":
    case "wolf":
      spikes(ctx, c, [[-17, -44], [-22, -50], [-16, -55], [-8, -65], [0, -60], [8, -66], [16, -55], [22, -50], [17, -44]]);
      if (a.hair === "wolf") longBack(ctx, c, -33, 19.4, 6, 0);
      break;
    case "longstraight":
      longBack(ctx, c, -17, 19, 5, 0);
      break;
    case "curly":
      for (let x = -15; x <= 15; x += 7.5) ball(ctx, c, x, -56 - (Math.abs(x) < 8 ? 3 : 0), 5, 4.6);
      for (const side of [-1, 1]) ball(ctx, c, side * 17, -34, 4.4, 4.6);
      break;
    case "pompadour":
      ball(ctx, c, 0, -61, 15, 8);
      break;
  }
  backCap(ctx, c);
  switch (a.hair) {
    case "twintail":
      for (const side of [-1, 1]) {
        tail(ctx, c, [side * 16, -51], [side * 21, -24], side * 6.5, 6);
        scrunchie(ctx, side * 16.4, -51.5);
      }
      break;
    case "ponytail":
      tail(ctx, c, [0, -46], [1, -24], 2, 5.6);
      scrunchie(ctx, 0, -46);
      break;
    case "sidetail":
      tail(ctx, c, [-16, -52], [-22.5, -26], -6, 6);
      scrunchie(ctx, -16.4, -52.5);
      break;
    case "braid":
      braid(ctx, -6, c, -36, -24);
      braid(ctx, 6, c, -36, -24);
      break;
    case "bun":
      ball(ctx, c, 0, -61, 7.6, 6.6);
      break;
    case "doublebun":
      for (const side of [-1, 1]) ball(ctx, c, side * 12.4, -59, 6.4, 6);
      break;
    case "hipony":
      tail(ctx, c, [0, -63], [0, -38], 3, 5.6);
      scrunchie(ctx, 0, -63);
      break;
    case "sidebraid":
      braid(ctx, -13, c, -44, -28);
      break;
  }
}
