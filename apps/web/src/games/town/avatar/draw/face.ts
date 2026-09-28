// Head shape and facial features (front view only).
// Pigg-like proportions: a soft "mochi" face that is fullest at the cheeks,
// big glossy eyes set a little low, a tiny mouth and a soft blush.
import type { AvatarConfig } from "../parts";
import {
  EYE_X, EYE_Y, ellipse, fillStroke, heartPath, line, mix, outlineOf, shade, starPath, type Ctx,
} from "./common";

/** Dark line color for facial features (eyelids, mouth, closed eyes). */
const FEATURE = "#4a2e2a";

/** Build the head outline path for a face shape. */
export function headPath(ctx: Ctx, face: string) {
  ctx.beginPath();
  switch (face) {
    case "egg":
      ctx.moveTo(0, -59.6);
      ctx.bezierCurveTo(9.6, -59.6, 16, -53.4, 16, -44.4);
      ctx.bezierCurveTo(16, -35, 10, -28.8, 0, -28.4);
      ctx.bezierCurveTo(-10, -28.8, -16, -35, -16, -44.4);
      ctx.bezierCurveTo(-16, -53.4, -9.6, -59.6, 0, -59.6);
      break;
    case "sharp":
      ctx.moveTo(0, -59.6);
      ctx.bezierCurveTo(9.6, -59.6, 16, -53.4, 16, -44.6);
      ctx.bezierCurveTo(16, -37, 9, -30.4, 0, -28);
      ctx.bezierCurveTo(-9, -30.4, -16, -37, -16, -44.6);
      ctx.bezierCurveTo(-16, -53.4, -9.6, -59.6, 0, -59.6);
      break;
    case "square":
      ctx.roundRect(-16.4, -59.4, 32.8, 30.6, [13, 13, 10, 10]);
      break;
    case "wide":
      ctx.moveTo(0, -58.8);
      ctx.bezierCurveTo(11.6, -58.8, 18.4, -52.4, 18.4, -43.6);
      ctx.bezierCurveTo(18.4, -34, 11.4, -29, 0, -29);
      ctx.bezierCurveTo(-11.4, -29, -18.4, -34, -18.4, -43.6);
      ctx.bezierCurveTo(-18.4, -52.4, -11.6, -58.8, 0, -58.8);
      break;
    default: // round: fullest a little below the middle, like a rice cake
      ctx.moveTo(0, -59.4);
      ctx.bezierCurveTo(10.2, -59.4, 16.8, -53, 16.8, -44);
      ctx.bezierCurveTo(16.8, -34.2, 10.6, -28.8, 0, -28.8);
      ctx.bezierCurveTo(-10.6, -28.8, -16.8, -34.2, -16.8, -44);
      ctx.bezierCurveTo(-16.8, -53, -10.2, -59.4, 0, -59.4);
  }
  ctx.closePath();
}

export function earX(face: string): number {
  return face === "wide" ? 17.6 : face === "egg" || face === "sharp" ? 15.4 : 16.1;
}

export function drawHead(ctx: Ctx, a: AvatarConfig) {
  const ex = earX(a.face);
  // Small ears tucked behind the cheeks.
  for (const side of [-1, 1]) {
    ellipse(ctx, side * ex, -41.6, 2.6, 3.1, a.skin);
    ctx.beginPath();
    ctx.arc(side * (ex + 0.3), -41.4, 1.3, side > 0 ? -0.4 * Math.PI : 0.4 * Math.PI, side > 0 ? 0.4 * Math.PI : 1.4 * Math.PI, side < 0);
    ctx.strokeStyle = shade(a.skin, -0.2);
    ctx.lineWidth = 0.7;
    ctx.lineCap = "round";
    ctx.stroke();
  }
  headPath(ctx, a.face);
  fillStroke(ctx, a.skin, false);
  // Soft shading: a touch darker toward the chin and the far edges, a faint shine on the forehead.
  ctx.save();
  headPath(ctx, a.face);
  ctx.clip();
  const g = ctx.createRadialGradient(-3, -50, 4, 0, -44, 21);
  g.addColorStop(0, shade(a.skin, 0.16));
  g.addColorStop(0.55, a.skin);
  g.addColorStop(1, shade(a.skin, -0.1));
  ctx.fillStyle = g;
  ctx.fillRect(-20, -62, 40, 36);
  ctx.restore();
  headPath(ctx, a.face);
  ctx.strokeStyle = outlineOf(a.skin);
  ctx.lineWidth = 0.95;
  ctx.stroke();
}

// --------------------------------------------------------------------- brows

export function drawBrows(ctx: Ctx, a: AvatarConfig, look: number, raise = 0) {
  if (a.brows === "none") return;
  // Brows sit over the bangs (anime style), a shade deeper so they still read on same-colored hair.
  drawBrowShapes(ctx, a, look, raise, 0);
}

function drawBrowShapes(ctx: Ctx, a: AvatarConfig, look: number, raise: number, halo: number) {
  const y = -47.6 - raise;
  const lineW = (w: number) => w + halo;
  const color = halo ? a.browColor : shade(a.browColor, -0.22);
  ctx.save();
  for (const side of [-1, 1]) {
    const cx = side * EYE_X + look;
    const inner = cx - side * 2.8; // towards the nose
    const outer = cx + side * 2.8;
    const arc = (lift: number, w: number) => {
      ctx.beginPath();
      ctx.moveTo(inner, y + 0.4);
      ctx.quadraticCurveTo(cx, y - lift, outer, y + 0.5);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineW(w);
      ctx.lineCap = "round";
      ctx.stroke();
    };
    switch (a.brows) {
      case "thin":
        arc(1.4, 0.8);
        break;
      case "thick":
        arc(1.3, 2.2);
        break;
      case "angry":
        line(ctx, [[inner, y + 1.6], [outer, y - 1]], color, lineW(1.6));
        break;
      case "worried":
        line(ctx, [[inner, y - 1.2], [outer, y + 1.2]], color, lineW(1.4));
        break;
      case "short":
        ellipse(ctx, cx - side * 0.8, y - 0.6, 1.5 + halo / 2, 1.05 + halo / 2, color, false);
        break;
      case "arch":
        arc(3, 1.2);
        break;
      default:
        arc(1.6, 1.25);
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------------- eyes

/** Glossy iris: deep at the top, lighter at the bottom, with two catchlights. */
function iris(ctx: Ctx, ex: number, ey: number, rx: number, ry: number, c: string, shine = 1) {
  const g = ctx.createLinearGradient(0, ey - ry, 0, ey + ry);
  g.addColorStop(0, shade(c, -0.45));
  g.addColorStop(0.55, c);
  g.addColorStop(1, mix(c, "#ffffff", 0.32));
  ctx.beginPath();
  ctx.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  // Pupil and rim.
  ellipse(ctx, ex, ey + ry * 0.08, rx * 0.46, ry * 0.5, shade(c, -0.6), false);
  ctx.beginPath();
  ctx.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2);
  ctx.strokeStyle = shade(c, -0.55);
  ctx.lineWidth = 0.6;
  ctx.stroke();
  // Catchlights.
  ellipse(ctx, ex + rx * 0.34, ey - ry * 0.38, rx * 0.44 * shine, ry * 0.34 * shine, "#ffffff", false, -0.3);
  ellipse(ctx, ex - rx * 0.36, ey + ry * 0.46, rx * 0.2, rx * 0.2, "rgba(255,255,255,0.9)", false);
}

/** A thick upper lid line; `tilt` > 0 lifts the outer corner (つり目), < 0 drops it (たれ目). */
function upperLid(ctx: Ctx, ex: number, ey: number, rx: number, ry: number, side: number, tilt = 0, width = 1.5, flick = false) {
  const inner = ex - side * (rx + 0.4);
  const outer = ex + side * (rx + 0.6);
  ctx.beginPath();
  ctx.moveTo(inner, ey - ry * 0.55 + tilt * 0.6);
  ctx.quadraticCurveTo(ex, ey - ry - 1.1, outer, ey - ry * 0.45 - tilt);
  ctx.strokeStyle = FEATURE;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.stroke();
  if (flick) {
    line(ctx, [[outer, ey - ry * 0.45 - tilt], [outer + side * 1.5, ey - ry * 0.9 - tilt]], FEATURE, 1);
    line(ctx, [[outer - side * 0.8, ey - ry * 0.75 - tilt], [outer + side * 0.6, ey - ry * 1.3 - tilt]], FEATURE, 0.8);
  }
}

function eyeArc(ctx: Ctx, ex: number, ey: number, color: string, up: boolean, width = 1.6) {
  ctx.beginPath();
  if (up) ctx.arc(ex, ey + 1.8, 2.9, 1.15 * Math.PI, 1.85 * Math.PI);
  else ctx.arc(ex, ey - 1.2, 2.9, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.stroke();
}

/**
 * Eye styles from the catalog plus expression-only styles used by actions:
 * "closed" (︶), "cry" (>_<), "shock" (tiny pupils).
 */
export function drawEyes(ctx: Ctx, a: AvatarConfig, look: number, style = a.eyes) {
  const ey = EYE_Y;
  const c = a.eyeColor;
  for (const side of [-1, 1]) {
    const ex = side * EYE_X + look;
    const s = style === "wink" ? (side === 1 ? "smile" : "round") : style;
    switch (s) {
      case "sparkle":
        iris(ctx, ex, ey, 3, 4, c, 1.1);
        starPath(ctx, ex + 1.1, ey - 1.3, 1.3, 4, 0.35);
        fillStroke(ctx, "#ffffff", false);
        upperLid(ctx, ex, ey, 3, 4, side, 0.3, 1.6, true);
        break;
      case "big":
        ellipse(ctx, ex, ey, 3.5, 4.3, "#ffffff", false);
        ctx.beginPath();
        ctx.ellipse(ex, ey, 3.5, 4.3, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(74,46,42,0.55)";
        ctx.lineWidth = 0.6;
        ctx.stroke();
        iris(ctx, ex + look * 0.25, ey + 0.5, 2.6, 3.4, c);
        upperLid(ctx, ex, ey, 3.5, 4.3, side, 0, 1.3);
        break;
      case "tare":
        iris(ctx, ex, ey + 0.4, 2.6, 3.4, c);
        upperLid(ctx, ex, ey + 0.4, 2.6, 3.4, side, -1.2, 1.4);
        break;
      case "tsuri":
        iris(ctx, ex, ey + 0.3, 2.5, 3.2, c);
        upperLid(ctx, ex, ey + 0.3, 2.5, 3.2, side, 1.4, 1.5);
        break;
      case "lashes":
        iris(ctx, ex, ey + 0.2, 2.7, 3.6, c);
        upperLid(ctx, ex, ey + 0.2, 2.7, 3.6, side, 0.2, 1.7, true);
        break;
      case "smile":
        eyeArc(ctx, ex, ey, FEATURE, true);
        break;
      case "closed":
        eyeArc(ctx, ex, ey, FEATURE, false, 1.4);
        break;
      case "cry":
        line(ctx, [[ex - side * 2.6, ey - 2.2], [ex + side * 1.6, ey], [ex - side * 2.6, ey + 2.2]], FEATURE, 1.5);
        break;
      case "shock":
        ellipse(ctx, ex, ey, 3.2, 3.9, "#ffffff", true);
        ellipse(ctx, ex, ey, 1, 1.1, FEATURE, false);
        break;
      case "sleepy":
        ctx.save();
        ctx.beginPath();
        ctx.rect(ex - 4, ey - 0.6, 8, 6);
        ctx.clip();
        iris(ctx, ex, ey + 0.4, 2.6, 3.2, c);
        ctx.restore();
        line(ctx, [[ex - 3.2, ey - 0.4], [ex + 3.2, ey - 0.6]], FEATURE, 1.4);
        break;
      case "dot":
        ellipse(ctx, ex, ey + 0.4, 1.7, 2.1, shade(c, -0.2), false);
        ellipse(ctx, ex + 0.6, ey - 0.4, 0.6, 0.6, "#ffffff", false);
        break;
      case "line":
        line(ctx, [[ex - 2.6, ey + 0.2], [ex + 2.6, ey + 0.2]], FEATURE, 1.5);
        break;
      case "star":
        starPath(ctx, ex, ey, 4);
        fillStroke(ctx, c === "#2b2320" ? "#f5b820" : c);
        ellipse(ctx, ex + 0.8, ey - 1, 0.9, 0.9, "#ffffff", false);
        break;
      case "heart":
        heartPath(ctx, ex, ey + 0.4, 0.8);
        fillStroke(ctx, c === "#2b2320" ? "#f0587d" : c);
        ellipse(ctx, ex + 1.2, ey - 1.1, 0.8, 0.6, "#ffffff", false, -0.4);
        break;
      case "cat":
        iris(ctx, ex, ey, 2.9, 3.6, mix(c, "#f5cf47", c === "#2b2320" ? 0.7 : 0.25), 0.8);
        ellipse(ctx, ex, ey + 0.2, 0.8, 3, shade(c, -0.5), false);
        upperLid(ctx, ex, ey, 2.9, 3.6, side, 1, 1.3);
        break;
      default: // round
        iris(ctx, ex, ey + 0.3, 2.6, 3.5, c);
    }
  }
}

// --------------------------------------------------------------- nose/mouth

export function drawNose(ctx: Ctx, a: AvatarConfig, look: number) {
  const nx = look * 0.95;
  const ny = -37.6;
  const tone = shade(a.skin, -0.3);
  switch (a.nose) {
    case "dot":
      ellipse(ctx, nx, ny, 0.75, 0.55, tone, false);
      break;
    case "ku":
      line(ctx, [[nx + 0.2, ny - 1.8], [nx - 1, ny], [nx + 0.4, ny + 0.7]], tone, 0.9);
      break;
    case "round":
      ellipse(ctx, nx, ny, 1.7, 1.3, shade(a.skin, -0.1), false);
      ellipse(ctx, nx - 0.5, ny - 0.5, 0.6, 0.45, "rgba(255,255,255,0.7)", false);
      break;
    case "line":
      line(ctx, [[nx + 0.4, ny - 2.4], [nx + 0.4, ny + 0.5]], tone, 0.8);
      break;
    case "pig":
      ellipse(ctx, nx, ny, 2.8, 2, "#f7a8bf", true);
      ellipse(ctx, nx - 0.9, ny, 0.5, 0.75, "#b8566e", false);
      ellipse(ctx, nx + 0.9, ny, 0.5, 0.75, "#b8566e", false);
      break;
  }
}

/** Filled open mouth with a little tongue. */
function openMouth(ctx: Ctx, mx: number, top: number, halfW: number, depth: number) {
  ctx.beginPath();
  ctx.moveTo(mx - halfW, top);
  ctx.quadraticCurveTo(mx, top + depth * 1.9, mx + halfW, top);
  ctx.closePath();
  ctx.fillStyle = "#c4495a";
  ctx.fill();
  ctx.save();
  ctx.clip();
  ellipse(ctx, mx, top + depth * 1.05, halfW * 0.7, depth * 0.55, "#f0808f", false);
  ctx.restore();
  ctx.strokeStyle = FEATURE;
  ctx.lineWidth = 0.9;
  ctx.lineJoin = "round";
  ctx.stroke();
}

export function drawMouth(ctx: Ctx, look: number, style: string) {
  const mx = look * 0.8;
  ctx.strokeStyle = FEATURE;
  ctx.lineWidth = 1;
  ctx.lineCap = "round";
  switch (style) {
    case "open":
      openMouth(ctx, mx, -35.2, 2.6, 2.6);
      break;
    case "grin":
      ctx.beginPath();
      ctx.moveTo(mx - 3.4, -35.4);
      ctx.quadraticCurveTo(mx, -30.6, mx + 3.4, -35.4);
      ctx.closePath();
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = FEATURE;
      ctx.lineWidth = 0.9;
      ctx.stroke();
      line(ctx, [[mx - 2.8, -34.4], [mx + 2.8, -34.4]], "rgba(74,46,42,0.35)", 0.5);
      break;
    case "three":
      ctx.beginPath();
      ctx.moveTo(mx - 1, -36.4);
      ctx.quadraticCurveTo(mx + 2, -35.7, mx - 0.3, -34.7);
      ctx.quadraticCurveTo(mx + 2, -33.7, mx - 1, -33);
      ctx.stroke();
      break;
    case "cat":
      ctx.beginPath();
      ctx.arc(mx - 1.3, -35, 1.3, 0.05 * Math.PI, 0.95 * Math.PI);
      ctx.moveTo(mx + 2.6, -35);
      ctx.arc(mx + 1.3, -35, 1.3, 0.05 * Math.PI, 0.95 * Math.PI);
      ctx.stroke();
      break;
    case "tongue":
      ctx.beginPath();
      ctx.arc(mx, -36.6, 2.6, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(mx + 1, -33.9, 1.4, 1.7, 0, 0, Math.PI);
      fillStroke(ctx, "#f07f95");
      break;
    case "neutral":
      line(ctx, [[mx - 1.6, -34.6], [mx + 1.6, -34.6]], FEATURE, 1);
      break;
    case "o":
      ellipse(ctx, mx, -34.4, 1.3, 1.7, "#c4495a");
      break;
    case "frown":
      ctx.beginPath();
      ctx.arc(mx, -32.6, 2.6, 1.22 * Math.PI, 1.78 * Math.PI);
      ctx.stroke();
      break;
    case "wavy":
      ctx.beginPath();
      ctx.moveTo(mx - 2.8, -34.6);
      ctx.quadraticCurveTo(mx - 1.4, -36, mx, -34.6);
      ctx.quadraticCurveTo(mx + 1.4, -33.2, mx + 2.8, -34.6);
      ctx.stroke();
      break;
    case "fang":
      ctx.beginPath();
      ctx.arc(mx, -36.6, 2.6, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mx + 0.7, -34.1);
      ctx.lineTo(mx + 1.4, -32.6);
      ctx.lineTo(mx + 2, -34.3);
      fillStroke(ctx, "#ffffff");
      break;
    default: // smile
      ctx.beginPath();
      ctx.arc(mx, -36.6, 2.4, 0.22 * Math.PI, 0.78 * Math.PI);
      ctx.stroke();
  }
}

// ------------------------------------------------------------ cheek & marks

/** Blush with soft edges (radial fade instead of a hard ellipse). */
function blush(ctx: Ctx, x: number, y: number, rx: number, ry: number, alpha: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(247, 120, 140, ${alpha})`);
  g.addColorStop(0.6, `rgba(247, 120, 140, ${alpha * 0.6})`);
  g.addColorStop(1, "rgba(247, 120, 140, 0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawCheek(ctx: Ctx, look: number, style: string) {
  const y = -36.4;
  for (const side of [-1, 1]) {
    const x = side * 10.6 + look;
    switch (style) {
      case "soft":
        blush(ctx, x, y, 3.8, 2.4, 0.38);
        break;
      case "pink":
        blush(ctx, x, y, 4, 2.6, 0.75);
        break;
      case "lines":
        blush(ctx, x, y, 4, 2.6, 0.6);
        for (let i = -1; i <= 1; i += 1) line(ctx, [[x + i * 1.5 + 0.7, y - 1.2], [x + i * 1.5 - 0.5, y + 1]], "#e0606e", 0.6);
        break;
      case "star":
        ctx.globalAlpha = 0.9;
        starPath(ctx, x, y, 2.1);
        fillStroke(ctx, "#f5cf47", false);
        break;
      case "heart":
        ctx.globalAlpha = 0.85;
        heartPath(ctx, x, y + 0.5, 0.45);
        fillStroke(ctx, "#f0587d", false);
        break;
    }
    ctx.globalAlpha = 1;
  }
}

export function drawMark(ctx: Ctx, a: AvatarConfig, look: number) {
  const hairTone = shade(a.hairColor, -0.1);
  switch (a.mark) {
    case "mole":
      ellipse(ctx, 8.8 + look, -37.4, 0.65, 0.65, "#4a3228", false);
      break;
    case "freckles":
      for (const side of [-1, 1]) {
        for (const [dx, dy] of [[-1.5, 0], [0.5, -1], [1.8, 0.6]]) {
          ellipse(ctx, side * 10 + look + dx, -37.8 + dy, 0.42, 0.42, "#c0825a", false);
        }
      }
      break;
    case "mustache":
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(look * 0.8 + side * 2.3, -36.2, 2.6, 1.1, side * -0.25, 0, Math.PI * 2);
        fillStroke(ctx, hairTone, false);
      }
      break;
    case "beard":
      ctx.beginPath();
      ctx.moveTo(-9 + look * 0.4, -34.6);
      ctx.quadraticCurveTo(look * 0.6, -24.4, 9 + look * 0.4, -34.6);
      ctx.quadraticCurveTo(look * 0.6, -29.6, -9 + look * 0.4, -34.6);
      fillStroke(ctx, hairTone, false);
      break;
    case "bandaid":
      ctx.save();
      ctx.translate(-10 + look, -37);
      ctx.rotate(-0.4);
      ctx.beginPath();
      ctx.roundRect(-3.3, -1.3, 6.6, 2.6, 1.2);
      fillStroke(ctx, "#f3c89a");
      ctx.restore();
      break;
    case "sticker":
      heartPath(ctx, 10 + look, -38.8, 0.4);
      fillStroke(ctx, "#f0587d", false);
      break;
    case "whiskers":
      for (const side of [-1, 1]) {
        for (const dy of [-1.2, 1.2]) {
          line(ctx, [[side * 9 + look, -36.6 + dy * 0.6], [side * 15 + look, -36.6 + dy * 1.6]], "rgba(74,46,42,0.6)", 0.55);
        }
      }
      break;
  }
}

