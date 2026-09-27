// Head shape and facial features (front view only).
import type { AvatarConfig } from "../parts";
import {
  EYE_X, EYE_Y, HEAD_Y, LINE, ellipse, fillStroke, heartPath, line, shade, starPath, type Ctx,
} from "./common";

/** Build the head outline path for a face shape. */
export function headPath(ctx: Ctx, face: string) {
  ctx.beginPath();
  switch (face) {
    case "egg":
      ctx.moveTo(-16, HEAD_Y);
      ctx.ellipse(0, HEAD_Y, 16, 15.2, 0, Math.PI, Math.PI * 2);
      ctx.bezierCurveTo(16, -35, 8.5, -29, 0, -28.6);
      ctx.bezierCurveTo(-8.5, -29, -16, -35, -16, HEAD_Y);
      break;
    case "sharp":
      ctx.moveTo(-16, HEAD_Y);
      ctx.ellipse(0, HEAD_Y, 16, 15.2, 0, Math.PI, Math.PI * 2);
      ctx.bezierCurveTo(16, -37, 6, -31, 0, -28.2);
      ctx.bezierCurveTo(-6, -31, -16, -37, -16, HEAD_Y);
      break;
    case "square":
      ctx.roundRect(-16.2, -59, 32.4, 30.2, [12, 12, 9, 9]);
      break;
    case "wide":
      ctx.ellipse(0, HEAD_Y + 0.5, 18, 14.6, 0, 0, Math.PI * 2);
      break;
    default:
      ctx.ellipse(0, HEAD_Y, 16.5, 15, 0, 0, Math.PI * 2);
  }
  ctx.closePath();
}

export function earX(face: string): number {
  return face === "wide" ? 17.6 : face === "egg" || face === "sharp" ? 15.6 : 16;
}

export function drawHead(ctx: Ctx, a: AvatarConfig) {
  const ex = earX(a.face);
  ellipse(ctx, -ex, -42, 3, 3.4, a.skin);
  ellipse(ctx, ex, -42, 3, 3.4, a.skin);
  headPath(ctx, a.face);
  fillStroke(ctx, a.skin);
}

// --------------------------------------------------------------------- brows

export function drawBrows(ctx: Ctx, a: AvatarConfig, look: number, raise = 0) {
  if (a.brows === "none") return;
  // Brows sit over the bangs (anime style); a skin-coloured halo keeps them
  // readable on hair of the same colour.
  drawBrowShapes(ctx, { ...a, browColor: a.skin }, look, raise, 0.9);
  drawBrowShapes(ctx, a, look, raise, 0);
}

function drawBrowShapes(ctx: Ctx, a: AvatarConfig, look: number, raise: number, halo: number) {
  const y = -48.2 - raise;
  const lineW = (w: number) => w + halo;
  ctx.save();
  for (const side of [-1, 1]) {
    const cx = side * EYE_X + look;
    const inner = cx - side * 3; // towards the nose
    const outer = cx + side * 3;
    switch (a.brows) {
      case "thin":
        line(ctx, [[inner, y + 0.2], [cx, y - 0.8], [outer, y + 0.2]], a.browColor, lineW(0.9));
        break;
      case "thick":
        line(ctx, [[inner, y + 0.3], [cx, y - 0.6], [outer, y + 0.3]], a.browColor, lineW(2.4));
        break;
      case "angry":
        line(ctx, [[inner, y + 1.6], [outer, y - 1]], a.browColor, lineW(1.8));
        break;
      case "worried":
        line(ctx, [[inner, y - 1.2], [outer, y + 1.2]], a.browColor, lineW(1.6));
        break;
      case "short":
        ellipse(ctx, cx - side * 0.8, y - 1, 1.6 + halo / 2, 1.1 + halo / 2, a.browColor, false);
        break;
      case "arch":
        ctx.beginPath();
        ctx.moveTo(inner, y + 0.8);
        ctx.quadraticCurveTo(cx, y - 2.6, outer, y + 0.8);
        ctx.strokeStyle = a.browColor;
        ctx.lineWidth = lineW(1.4);
        ctx.lineCap = "round";
        ctx.stroke();
        break;
      default:
        line(ctx, [[inner, y + 0.4], [cx, y - 0.7], [outer, y + 0.3]], a.browColor, lineW(1.5));
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------------- eyes

function lashes(ctx: Ctx, ex: number, ey: number, side: number) {
  line(ctx, [[ex - 3, ey - 3.4], [ex + side * 0.2, ey - 4.4], [ex + 3.2, ey - 3.4]], LINE, 1.2);
  line(ctx, [[ex + side * 3, ey - 3.6], [ex + side * 4.6, ey - 5]], LINE, 1);
}

function eyeArc(ctx: Ctx, ex: number, ey: number, color: string, up: boolean, width = 1.5) {
  ctx.beginPath();
  if (up) ctx.arc(ex, ey + 1.6, 2.7, 1.15 * Math.PI, 1.85 * Math.PI);
  else ctx.arc(ex, ey - 1.4, 2.7, 0.15 * Math.PI, 0.85 * Math.PI);
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
        ellipse(ctx, ex, ey, 3, 3.9, c, false);
        ellipse(ctx, ex, ey + 1.4, 2.1, 1.6, shade(c, 0.35), false);
        ellipse(ctx, ex + 0.9, ey - 1.5, 1.2, 1.2, "#ffffff", false);
        ellipse(ctx, ex - 1, ey + 1.4, 0.55, 0.55, "#ffffff", false);
        lashes(ctx, ex, ey, side);
        break;
      case "big":
        ellipse(ctx, ex, ey, 3.6, 4.4, "#ffffff", true);
        ellipse(ctx, ex + look * 0.3, ey + 0.4, 2.7, 3.5, c, false);
        ellipse(ctx, ex + look * 0.3, ey + 0.6, 1.3, 1.7, shade(c, -0.5), false);
        ellipse(ctx, ex + 1.1, ey - 1.4, 1.1, 1.1, "#ffffff", false);
        break;
      case "tare":
        ellipse(ctx, ex, ey + 0.3, 2.5, 3, c, false);
        ellipse(ctx, ex + 0.7, ey - 0.8, 0.9, 0.9, "#ffffff", false);
        line(ctx, [[ex - side * 3, ey - 3.2], [ex + side * 3.2, ey - 1.6]], LINE, 1.2);
        break;
      case "tsuri":
        ellipse(ctx, ex, ey, 2.4, 3, c, false);
        ellipse(ctx, ex + 0.7, ey - 1, 0.9, 0.9, "#ffffff", false);
        line(ctx, [[ex - side * 3, ey - 2], [ex + side * 3.4, ey - 3.8]], LINE, 1.3);
        break;
      case "lashes":
        ellipse(ctx, ex, ey, 2.4, 3.3, c, false);
        ellipse(ctx, ex + 0.8, ey - 1.2, 0.9, 0.9, "#ffffff", false);
        lashes(ctx, ex, ey, side);
        break;
      case "smile":
        eyeArc(ctx, ex, ey, c, true);
        break;
      case "closed":
        eyeArc(ctx, ex, ey, LINE, false, 1.3);
        break;
      case "cry":
        line(ctx, [[ex - side * 2.6, ey - 2.2], [ex + side * 1.6, ey], [ex - side * 2.6, ey + 2.2]], LINE, 1.4);
        break;
      case "shock":
        ellipse(ctx, ex, ey, 3.2, 3.8, "#ffffff", true);
        ellipse(ctx, ex, ey, 0.9, 0.9, LINE, false);
        break;
      case "sleepy":
        ctx.beginPath();
        ctx.arc(ex, ey - 0.4, 2.6, 0, Math.PI);
        ctx.fillStyle = c;
        ctx.fill();
        line(ctx, [[ex - 3.2, ey - 0.4], [ex + 3.2, ey - 0.4]], LINE, 1.3);
        break;
      case "dot":
        ellipse(ctx, ex, ey, 1.5, 1.7, c, false);
        break;
      case "line":
        line(ctx, [[ex - 2.6, ey], [ex + 2.6, ey]], c, 1.5);
        break;
      case "star":
        starPath(ctx, ex, ey, 3.8);
        fillStroke(ctx, c, false);
        ellipse(ctx, ex + 0.6, ey - 0.8, 0.8, 0.8, "#ffffff", false);
        break;
      case "heart":
        heartPath(ctx, ex, ey + 0.3, 0.72);
        fillStroke(ctx, c === "#2b2320" ? "#f0587d" : c, false);
        break;
      case "cat":
        ellipse(ctx, ex, ey, 2.8, 3.4, shade(c, 0.5), true);
        ellipse(ctx, ex, ey, 0.9, 3, c, false);
        break;
      default: // round
        ellipse(ctx, ex, ey, 2.3, 3.2, c, false);
        ellipse(ctx, ex + 0.7, ey - 1.2, 0.9, 0.9, "#ffffff", false);
    }
  }
}

// --------------------------------------------------------------- nose/mouth

export function drawNose(ctx: Ctx, a: AvatarConfig, look: number) {
  const nx = look * 0.95;
  const ny = -38.4;
  const tone = shade(a.skin, -0.28);
  switch (a.nose) {
    case "dot":
      ellipse(ctx, nx, ny, 0.8, 0.6, tone, false);
      break;
    case "ku":
      line(ctx, [[nx + 0.2, ny - 2], [nx - 1.2, ny], [nx + 0.4, ny + 0.8]], tone, 1);
      break;
    case "round":
      ellipse(ctx, nx, ny, 1.8, 1.4, shade(a.skin, -0.12), false);
      ellipse(ctx, nx - 0.5, ny - 0.5, 0.6, 0.45, "rgba(255,255,255,0.7)", false);
      break;
    case "line":
      line(ctx, [[nx + 0.4, ny - 2.6], [nx + 0.4, ny + 0.6]], tone, 0.9);
      break;
    case "pig":
      ellipse(ctx, nx, ny, 3, 2.1, "#f7a8bf", true);
      ellipse(ctx, nx - 1, ny, 0.55, 0.8, "#b8566e", false);
      ellipse(ctx, nx + 1, ny, 0.55, 0.8, "#b8566e", false);
      break;
  }
}

export function drawMouth(ctx: Ctx, look: number, style: string) {
  const mx = look * 0.8;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.1;
  ctx.lineCap = "round";
  switch (style) {
    case "open":
      ctx.beginPath();
      ctx.moveTo(mx - 3, -35.8);
      ctx.quadraticCurveTo(mx, -30.2, mx + 3, -35.8);
      ctx.closePath();
      fillStroke(ctx, "#d9505d");
      break;
    case "grin":
      ctx.beginPath();
      ctx.moveTo(mx - 3.8, -36);
      ctx.quadraticCurveTo(mx, -30.4, mx + 3.8, -36);
      ctx.closePath();
      fillStroke(ctx, "#ffffff");
      line(ctx, [[mx - 3.2, -35], [mx + 3.2, -35]], "rgba(58,38,38,0.4)", 0.6);
      break;
    case "three":
      ctx.beginPath();
      ctx.moveTo(mx - 1.2, -37);
      ctx.quadraticCurveTo(mx + 2.4, -36.2, mx - 0.4, -35);
      ctx.quadraticCurveTo(mx + 2.4, -33.8, mx - 1.2, -33);
      ctx.stroke();
      break;
    case "cat":
      ctx.beginPath();
      ctx.arc(mx - 1.5, -35.4, 1.5, 0, Math.PI);
      ctx.moveTo(mx + 3, -35.4);
      ctx.arc(mx + 1.5, -35.4, 1.5, 0, Math.PI);
      ctx.stroke();
      break;
    case "tongue":
      ctx.beginPath();
      ctx.arc(mx, -37, 3, 0.18 * Math.PI, 0.82 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(mx + 1.2, -33.6, 1.6, 1.9, 0, 0, Math.PI);
      fillStroke(ctx, "#f07f95");
      break;
    case "neutral":
      line(ctx, [[mx - 2, -34.8], [mx + 2, -34.8]], LINE, 1.1);
      break;
    case "o":
      ellipse(ctx, mx, -34.6, 1.4, 1.8, "#b8434f");
      break;
    case "frown":
      ctx.beginPath();
      ctx.arc(mx, -32.6, 3, 1.2 * Math.PI, 1.8 * Math.PI);
      ctx.stroke();
      break;
    case "wavy":
      ctx.beginPath();
      ctx.moveTo(mx - 3.2, -34.8);
      ctx.quadraticCurveTo(mx - 1.6, -36.4, mx, -34.8);
      ctx.quadraticCurveTo(mx + 1.6, -33.2, mx + 3.2, -34.8);
      ctx.stroke();
      break;
    case "fang":
      ctx.beginPath();
      ctx.arc(mx, -37, 3, 0.18 * Math.PI, 0.82 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mx + 0.8, -34.2);
      ctx.lineTo(mx + 1.6, -32.4);
      ctx.lineTo(mx + 2.3, -34.4);
      fillStroke(ctx, "#ffffff");
      break;
    default: // smile
      ctx.beginPath();
      ctx.arc(mx, -37, 3, 0.18 * Math.PI, 0.82 * Math.PI);
      ctx.stroke();
  }
}

// ------------------------------------------------------------ cheek & marks

export function drawCheek(ctx: Ctx, look: number, style: string) {
  const y = -37.5;
  for (const side of [-1, 1]) {
    const x = side * 10.5 + look;
    switch (style) {
      case "soft":
        ctx.globalAlpha = 0.2;
        ellipse(ctx, x, y, 3, 1.8, "#f07f95", false);
        break;
      case "pink":
        ctx.globalAlpha = 0.55;
        ellipse(ctx, x, y, 3.2, 2, "#f07f95", false);
        break;
      case "lines":
        ctx.globalAlpha = 0.45;
        ellipse(ctx, x, y, 3.4, 2, "#f07f95", false);
        ctx.globalAlpha = 0.9;
        for (let i = -1; i <= 1; i += 1) line(ctx, [[x + i * 1.6 + 0.8, y - 1.4], [x + i * 1.6 - 0.6, y + 1.2]], "#d9505d", 0.7);
        break;
      case "star":
        ctx.globalAlpha = 0.85;
        starPath(ctx, x, y, 2.2);
        fillStroke(ctx, "#f5cf47", false);
        break;
      case "heart":
        ctx.globalAlpha = 0.8;
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
      ellipse(ctx, 8.8 + look, -38.6, 0.7, 0.7, "#4a3228", false);
      break;
    case "freckles":
      for (const side of [-1, 1]) {
        for (const [dx, dy] of [[-1.5, 0], [0.5, -1], [1.8, 0.6]]) {
          ellipse(ctx, side * 10 + look + dx, -38.6 + dy, 0.45, 0.45, "#b0714a", false);
        }
      }
      break;
    case "mustache":
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(look * 0.8 + side * 2.4, -36.6, 2.8, 1.2, side * -0.25, 0, Math.PI * 2);
        fillStroke(ctx, hairTone, false);
      }
      break;
    case "beard":
      ctx.beginPath();
      ctx.moveTo(-9 + look * 0.4, -35);
      ctx.quadraticCurveTo(look * 0.6, -24, 9 + look * 0.4, -35);
      ctx.quadraticCurveTo(look * 0.6, -29.5, -9 + look * 0.4, -35);
      fillStroke(ctx, hairTone, false);
      break;
    case "bandaid":
      ctx.save();
      ctx.translate(-10 + look, -37.5);
      ctx.rotate(-0.4);
      ctx.beginPath();
      ctx.roundRect(-3.5, -1.4, 7, 2.8, 1.2);
      fillStroke(ctx, "#f3c89a");
      ctx.restore();
      break;
    case "sticker":
      heartPath(ctx, 10 + look, -39.5, 0.4);
      fillStroke(ctx, "#f0587d", false);
      break;
    case "whiskers":
      for (const side of [-1, 1]) {
        for (const dy of [-1.2, 1.2]) {
          line(ctx, [[side * 9 + look, -37 + dy * 0.6], [side * 15 + look, -37 + dy * 1.6]], "rgba(58,38,38,0.7)", 0.6);
        }
      }
      break;
  }
}
