// Legs, shoes, bottoms, tops, one-pieces and arms.
import type { AvatarConfig } from "../parts";
import {
  HIP_Y, LINE, LINE_WIDTH, ellipse, fillStroke, line, luminance, poly, roundRect, shade, type Ctx, type Facing,
} from "./common";

export type Point = [number, number];
export type ArmPose = { left: Point; right: Point };

const WHITE = "#f7f4ee";

export function onepieceOf(a: AvatarConfig): string | null {
  return a.onepiece && a.onepiece !== "none" ? a.onepiece : null;
}

type SleeveKind = "none" | "short" | "long" | "puff" | "wide";

function sleeveOf(a: AvatarConfig): { kind: SleeveKind; color: string } {
  const op = onepieceOf(a);
  if (op) {
    const kind: SleeveKind = op === "dress" || op === "wedding" || op === "swimsuit" ? "none" : op === "princess" || op === "maid" || op === "idol" ? "puff" : op === "yukata" ? "wide" : op === "swimsuit" ? "none" : op === "china" ? "short" : "long";
    return { kind, color: op === "suit" ? shade(a.onepieceColor, -0.05) : a.onepieceColor };
  }
  if (a.top === "none") return { kind: "none", color: a.skin };
  const kinds: Record<string, SleeveKind> = { tank: "none", tshirt: "short", dots: "short", blouse: "puff", polo: "short", aloha: "short" };
  return { kind: kinds[a.top] ?? "long", color: a.top === "sailor" ? WHITE : a.topColor };
}

function legColor(a: AvatarConfig): string {
  const op = onepieceOf(a);
  if (op === "suit" || op === "tsunagi" || op === "kigurumi" || op === "astronaut" || op === "ninja") return a.onepieceColor;
  if (op) return a.skin;
  if (a.bottom === "pants" || a.bottom === "jeans" || a.bottom === "overalls" || a.bottom === "cargo" || a.bottom === "wide") return a.bottomColor;
  return a.skin;
}

// ------------------------------------------------------------------- legs

export function drawLegs(ctx: Ctx, a: AvatarConfig, lift: [number, number], sitting: boolean) {
  const color = legColor(a);
  const footY = sitting ? -8 : -3;
  const op = onepieceOf(a);
  [-4, 4].forEach((x, i) => {
    const bottom = footY - lift[i];
    roundRect(ctx, x - 2.6, HIP_Y - 1, 5.2, bottom - HIP_Y + 1, 2.2, color);
    if (!op && a.bottom === "shorts") roundRect(ctx, x - 2.9, HIP_Y - 1, 5.8, 5, 1.5, a.bottomColor);
    if (!op && a.bottom === "cargo") roundRect(ctx, x + (x < 0 ? -2.4 : 0.6), (bottom + HIP_Y) / 2 - 1, 2, 3.2, 0.6, shade(a.bottomColor, -0.22), false);
    if (!op && a.bottom === "wide") roundRect(ctx, x - 3.2, bottom - 6, 6.4, 6, 1.2, shade(a.bottomColor, -0.12), false);
    if (!op && a.bottom === "jeans") line(ctx, [[x + (x < 0 ? 1.4 : -1.4), HIP_Y], [x + (x < 0 ? 1.4 : -1.4), bottom - 1]], shade(a.bottomColor, 0.35), 0.6);
    drawShoe(ctx, a, x, bottom, x < 0 ? -1 : 1);
  });
}

function drawShoe(ctx: Ctx, a: AvatarConfig, x: number, y: number, side: number) {
  const c = a.shoesColor;
  const toe = x + side * 0.6;
  switch (a.shoes) {
    case "none":
      return;
    case "hightops":
      roundRect(ctx, x - 2.9, y - 4, 5.8, 4.5, 1.5, c);
      ellipse(ctx, toe, y + 0.3, 4, 2.5, c);
      ellipse(ctx, toe + side * 1.6, y + 0.2, 1.8, 1.5, "#ffffff", false);
      line(ctx, [[toe - 3.6, y + 1.5], [toe + 3.6, y + 1.5]], "#ffffff", 1);
      break;
    case "loafers":
      ellipse(ctx, toe, y + 0.3, 3.6, 2.2, shade(c, -0.25));
      break;
    case "pumps":
      ellipse(ctx, toe, y, 3.3, 2, c);
      ellipse(ctx, toe - 0.6, y - 0.6, 1, 0.6, "rgba(255,255,255,0.6)", false);
      roundRect(ctx, x - side * 2.2 - 0.6, y, 1.2, 2.2, 0.4, shade(c, -0.3), false);
      break;
    case "boots":
      roundRect(ctx, x - 3, y - 5, 6, 6, 1.5, c);
      ellipse(ctx, toe, y + 0.6, 3.8, 2.2, c);
      break;
    case "longboots":
      roundRect(ctx, x - 3, y - 9, 6, 10, 1.5, c);
      ellipse(ctx, toe, y + 0.6, 3.8, 2.2, c);
      line(ctx, [[x - 3, y - 8], [x + 3, y - 8]], shade(c, -0.3), 0.8);
      break;
    case "rollerskates":
      roundRect(ctx, x - 2.9, y - 3.6, 5.8, 4.2, 1.4, c);
      ellipse(ctx, toe, y - 0.4, 3.8, 2.2, c);
      roundRect(ctx, x - 3.4, y + 0.6, 7.4, 1.4, 0.5, "#dfe6ee", false);
      for (const dx of [-2.4, 2.4]) ellipse(ctx, x + dx, y + 2.6, 1.3, 1.3, "#2e2e38");
      break;
    case "rainboots":
      roundRect(ctx, x - 3, y - 7, 6, 8, 1.6, c);
      ellipse(ctx, toe, y + 0.5, 3.9, 2.3, c);
      roundRect(ctx, x - 3, y - 7, 6, 1.6, 0.6, shade(c, 0.35), false);
      ellipse(ctx, x, y - 3.4, 1.1, 1.1, "#ffffff", false);
      break;
    case "sandals":
      ellipse(ctx, toe, y + 0.4, 3.4, 2, a.skin);
      line(ctx, [[toe - 3, y - 0.2], [toe + 3, y - 0.2]], c, 1.2);
      ellipse(ctx, toe, y + 2, 3.8, 0.9, shade(c, -0.2), false);
      break;
    case "geta":
      roundRect(ctx, toe - 3.8, y + 0.8, 7.6, 1.6, 0.5, "#c9965f");
      roundRect(ctx, toe - 3, y + 2.4, 1.5, 1.4, 0.2, "#8a6034", false);
      roundRect(ctx, toe + 1.5, y + 2.4, 1.5, 1.4, 0.2, "#8a6034", false);
      ellipse(ctx, toe, y - 0.2, 3, 1.6, a.skin);
      line(ctx, [[toe - 2.4, y + 0.4], [toe, y - 1.4], [toe + 2.4, y + 0.4]], c, 1.1);
      break;
    default: // sneakers
      ellipse(ctx, toe, y + 0.2, 4, 2.6, c);
      line(ctx, [[toe - 3.6, y + 1.4], [toe + 3.6, y + 1.4]], "#ffffff", 1);
  }
}

// ---------------------------------------------------------------- bottoms

function skirt(ctx: Ctx, color: string, bottomY: number, flare: number, pleats: boolean) {
  poly(ctx, [[-8.6, -16], [8.6, -16], [8.6 + flare, bottomY], [-8.6 - flare, bottomY]], color);
  if (!pleats) return;
  for (const px of [-5, 0, 5]) line(ctx, [[px * 0.8, -15], [px * 1.1, bottomY - 0.5]], shade(color, -0.25), 0.8);
}

export function drawBottom(ctx: Ctx, a: AvatarConfig, sitting: boolean) {
  if (onepieceOf(a)) return;
  const c = a.bottomColor;
  const s = sitting ? 1 : 0;
  switch (a.bottom) {
    case "none":
      // Standard underwear remains when every removable clothing item is taken off.
      roundRect(ctx, -8.4, -16, 16.8, 4.8, 1.5, "#f7f4ee");
      line(ctx, [[-7.2, -13], [0, -11.5], [7.2, -13]], "#c9c4ba", 0.7);
      break;
    case "skirt":
      skirt(ctx, c, -7.5, 2.9 + s, true);
      break;
    case "mini":
      skirt(ctx, c, -10, 1.6 + s, false);
      roundRect(ctx, -8.8, -16.5, 17.6, 2, 1, shade(c, -0.2), false);
      break;
    case "kilt":
      skirt(ctx, c, -7.5, 2.9 + s, false);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-8.6, -16);
      ctx.lineTo(8.6, -16);
      ctx.lineTo(8.6 + 2.9 + s, -7.5);
      ctx.lineTo(-8.6 - 2.9 - s, -7.5);
      ctx.closePath();
      ctx.clip();
      for (let x = -12; x <= 12; x += 4) line(ctx, [[x, -16], [x * 1.2, -7]], shade(c, 0.4), 0.8);
      for (const y of [-13.5, -10]) line(ctx, [[-13, y], [13, y]], shade(c, -0.3), 0.8);
      ctx.restore();
      break;
    case "long":
      skirt(ctx, c, -3.5, 4.5 + s, false);
      line(ctx, [[-2, -15], [-3, -4.5]], shade(c, -0.2), 0.8);
      line(ctx, [[3, -15], [4, -4.5]], shade(c, -0.2), 0.8);
      break;
    default:
      roundRect(ctx, -8.8, -16, 17.6, 5, 1.5, c);
      if (a.bottom === "jeans") {
        roundRect(ctx, -8.8, -16.2, 17.6, 1.6, 0.6, shade(c, -0.2), false);
        ellipse(ctx, 0, -15.4, 0.7, 0.7, "#f5cf47", false);
      }
  }
}

/** Overall bib and straps sit on top of the shirt. */
export function drawBottomOverTorso(ctx: Ctx, a: AvatarConfig, facing: Facing) {
  if (onepieceOf(a) || a.bottom !== "overalls") return;
  const c = a.bottomColor;
  if (facing === "front") {
    roundRect(ctx, -5.5, -24, 11, 10, 1.5, c);
    roundRect(ctx, -2.5, -22, 5, 3.4, 0.8, shade(c, -0.15), false);
  }
  line(ctx, [[-4.5, -24], [-6, -30]], c, 1.8);
  line(ctx, [[4.5, -24], [6, -30]], c, 1.8);
  if (facing === "front") {
    ellipse(ctx, -4.6, -23.6, 0.8, 0.8, "#f5cf47", false);
    ellipse(ctx, 4.6, -23.6, 0.8, 0.8, "#f5cf47", false);
  }
}

// ------------------------------------------------------------------ torso

export function torsoPath(ctx: Ctx) {
  ctx.beginPath();
  ctx.moveTo(-7, -30);
  ctx.quadraticCurveTo(0, -31.5, 7, -30);
  ctx.quadraticCurveTo(9.2, -22, 9, -14);
  ctx.lineTo(-9, -14);
  ctx.quadraticCurveTo(-9.2, -22, -7, -30);
  ctx.closePath();
}

function torso(ctx: Ctx, color: string) {
  torsoPath(ctx);
  fillStroke(ctx, color);
}

function clipTorso(ctx: Ctx, paint: () => void) {
  ctx.save();
  torsoPath(ctx);
  ctx.clip();
  paint();
  ctx.restore();
  torsoPath(ctx);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = LINE_WIDTH;
  ctx.stroke();
}

function buttons(ctx: Ctx, x: number, from: number, to: number, color: string) {
  for (let y = from; y <= to; y += 4) ellipse(ctx, x, y, 0.75, 0.75, color, false);
}

function neckline(ctx: Ctx, color: string) {
  ctx.beginPath();
  ctx.arc(0, -31, 3.2, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawTop(ctx: Ctx, a: AvatarConfig, facing: Facing) {
  const c = a.topColor;
  const front = facing === "front";
  switch (a.top) {
    case "none":
      torso(ctx, a.skin);
      return;
    case "stripe":
      torso(ctx, c);
      clipTorso(ctx, () => {
        ctx.fillStyle = luminance(c) > 0.8 ? "#3651a8" : "rgba(255,255,255,0.85)";
        for (let y = -28; y < -14; y += 3.4) ctx.fillRect(-10, y, 20, 1.5);
      });
      if (front) neckline(ctx, shade(c, -0.3));
      return;
    case "dots":
      torso(ctx, c);
      clipTorso(ctx, () => {
        for (let row = 0; row < 5; row += 1) {
          const y = -29 + row * 4;
          for (let x = -9; x < 10; x += 4.4) ellipse(ctx, x + (row % 2 ? 2.2 : 0), y, 0.9, 0.9, luminance(c) > 0.8 ? "#e0525c" : "#ffffff", false);
        }
      });
      if (front) neckline(ctx, shade(c, -0.3));
      return;
    case "polo":
      torso(ctx, c);
      if (!front) return;
      poly(ctx, [[-4.6, -30.6], [0, -27.4], [-2, -25.2], [-5.2, -28.4]], shade(c, 0.3));
      poly(ctx, [[4.6, -30.6], [0, -27.4], [2, -25.2], [5.2, -28.4]], shade(c, 0.3));
      line(ctx, [[0, -27.4], [0, -22]], shade(c, -0.25), 0.7);
      buttons(ctx, 0, -26, -23, shade(c, 0.6));
      return;
    case "aloha":
      torso(ctx, c);
      clipTorso(ctx, () => {
        const flower = luminance(c) > 0.8 ? "#e0525c" : "#ffd84a";
        for (const [x, y] of [[-5, -27], [3, -24], [-3, -19], [6, -18], [-7, -16]]) {
          for (let k = 0; k < 5; k += 1) ellipse(ctx, x + Math.cos(k * 1.257) * 1.6, y + Math.sin(k * 1.257) * 1.6, 1.1, 1.1, flower, false);
          ellipse(ctx, x, y, 0.7, 0.7, "#ffffff", false);
        }
      });
      if (front) {
        poly(ctx, [[-4.6, -30.6], [0, -27.4], [-2, -25.4], [-5, -28.6]], shade(c, 0.4));
        poly(ctx, [[4.6, -30.6], [0, -27.4], [2, -25.4], [5, -28.6]], shade(c, 0.4));
      }
      return;
    case "turtleneck":
      torso(ctx, c);
      roundRect(ctx, -5.2, -33, 10.4, 4.6, 2, shade(c, 0.12));
      line(ctx, [[-4.6, -30.6], [4.6, -30.6]], shade(c, -0.2), 0.6);
      return;
    case "baseball":
      torso(ctx, WHITE);
      clipTorso(ctx, () => {
        ctx.fillStyle = c;
        ctx.fillRect(-10, -31, 5, 17);
        ctx.fillRect(5, -31, 5, 17);
      });
      if (front) {
        ctx.fillStyle = shade(c, -0.1);
        ctx.font = "bold 8px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("7", 0, -22.5);
      }
      return;
    case "tank":
      torso(ctx, c);
      if (front) {
        ctx.beginPath();
        ctx.ellipse(0, -30.5, 4.6, 3.4, 0, 0, Math.PI);
        fillStroke(ctx, a.skin, false);
      }
      ctx.save();
      ctx.beginPath();
      ctx.rect(-10, -31, 20, 3);
      ctx.clip();
      ellipse(ctx, -7.8, -28.5, 2.4, 3, a.skin, false);
      ellipse(ctx, 7.8, -28.5, 2.4, 3, a.skin, false);
      ctx.restore();
      return;
    case "shirt":
      torso(ctx, c);
      if (!front) return;
      poly(ctx, [[-4.6, -30.6], [0, -27.4], [-2, -25.6], [-5, -28.6]], shade(c, 0.35));
      poly(ctx, [[4.6, -30.6], [0, -27.4], [2, -25.6], [5, -28.6]], shade(c, 0.35));
      line(ctx, [[0, -27], [0, -14.5]], shade(c, -0.2), 0.7);
      buttons(ctx, 0.9, -25, -16, shade(c, -0.35));
      roundRect(ctx, -6.4, -24.4, 3.4, 3, 0.6, shade(c, -0.08), true);
      return;
    case "blouse":
      torso(ctx, c);
      if (!front) return;
      for (let i = -3; i <= 3; i += 1) ellipse(ctx, i * 1.5, -30 + Math.abs(i) * 0.25, 1.4, 1.4, WHITE, false);
      ellipse(ctx, 0, -27.5, 1.6, 1.3, shade(c, -0.3));
      return;
    case "sweater":
      torso(ctx, c);
      clipTorso(ctx, () => {
        ctx.strokeStyle = shade(c, -0.14);
        ctx.lineWidth = 0.8;
        for (const x of [-4.5, 0, 4.5]) {
          ctx.beginPath();
          for (let y = -28; y <= -16; y += 2) ctx.lineTo(x + (y % 4 === 0 ? 0.9 : -0.9), y);
          ctx.stroke();
        }
      });
      roundRect(ctx, -9.2, -16.4, 18.4, 2.6, 1, shade(c, -0.15));
      if (front) roundRect(ctx, -4, -31.6, 8, 2.4, 1.2, shade(c, -0.15));
      return;
    case "hoodie":
      torso(ctx, c);
      ellipse(ctx, 0, front ? -30 : -27, front ? 8.5 : 7.5, front ? 2.6 : 5, shade(c, -0.15));
      if (!front) return;
      roundRect(ctx, -5.5, -21, 11, 5, 1.8, shade(c, -0.1));
      line(ctx, [[-2, -29], [-2.3, -24]], WHITE, 0.9);
      line(ctx, [[2, -29], [2.3, -24]], WHITE, 0.9);
      return;
    case "cardigan":
      torso(ctx, c);
      if (!front) return;
      poly(ctx, [[-3.4, -30.6], [3.4, -30.6], [2.2, -14], [-2.2, -14]], WHITE, false);
      line(ctx, [[-3.4, -30.6], [-2.2, -14]], shade(c, -0.3), 0.9);
      line(ctx, [[3.4, -30.6], [2.2, -14]], shade(c, -0.3), 0.9);
      buttons(ctx, -3.8, -25, -16, shade(c, 0.5));
      roundRect(ctx, -9.2, -16, 18.4, 2, 1, shade(c, -0.12), false);
      return;
    case "jacket":
      torso(ctx, c);
      if (!front) return;
      poly(ctx, [[-3.2, -30.5], [3.2, -30.5], [2.2, -14], [-2.2, -14]], WHITE, false);
      line(ctx, [[-3.2, -30.5], [-1, -24], [-2.2, -14]], shade(c, -0.35), 1);
      line(ctx, [[3.2, -30.5], [1, -24], [2.2, -14]], shade(c, -0.35), 1);
      return;
    case "sailor": {
      torso(ctx, WHITE);
      if (!front) {
        poly(ctx, [[-7.5, -30], [7.5, -30], [7, -22], [-7, -22]], c);
        line(ctx, [[-6.2, -23.2], [6.2, -23.2]], WHITE, 0.7);
        return;
      }
      poly(ctx, [[-7.5, -30], [7.5, -30], [0, -22.5]], c);
      const tie = c.toLowerCase() === "#e0525c" ? "#3651a8" : "#e0525c";
      ellipse(ctx, -2.2, -23, 2.4, 1.6, tie, true, 0.3);
      ellipse(ctx, 2.2, -23, 2.4, 1.6, tie, true, -0.3);
      ellipse(ctx, 0, -23, 1.1, 1.1, tie);
      ctx.fillStyle = c;
      ctx.fillRect(-9, -15.8, 18, 1.8);
      return;
    }
    case "gakuran":
      torso(ctx, c);
      roundRect(ctx, -4.2, -32, 8.4, 2.6, 0.8, shade(c, -0.15));
      if (!front) return;
      line(ctx, [[0, -29.5], [0, -14.5]], shade(c, 0.25), 0.6);
      buttons(ctx, 0, -27, -16, "#f5cf47");
      return;
    case "dealer": {
      // White shirt, a vest in the chosen color and a red bow tie.
      torso(ctx, WHITE);
      clipTorso(ctx, () => {
        ctx.fillStyle = c;
        if (!front) {
          ctx.fillRect(-10, -31, 20, 17);
          return;
        }
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(side * 10, -31);
          ctx.lineTo(side * 2.6, -31);
          ctx.lineTo(side * 0.4, -21);
          ctx.lineTo(side * 0.4, -14);
          ctx.lineTo(side * 10, -14);
          ctx.closePath();
          ctx.fill();
        }
      });
      if (!front) return;
      buttons(ctx, -1.8, -20, -16, "#f5cf47");
      ellipse(ctx, -2.2, -29.4, 2.2, 1.4, "#b8323f", true, 0.3);
      ellipse(ctx, 2.2, -29.4, 2.2, 1.4, "#b8323f", true, -0.3);
      ellipse(ctx, 0, -29.4, 0.9, 0.9, "#b8323f");
      return;
    }
    default: // tshirt
      torso(ctx, c);
      if (front) neckline(ctx, shade(c, -0.3));
  }
}

// ------------------------------------------------------------- one-pieces

function flaredSkirt(ctx: Ctx, color: string, top: number, bottom: number, half: number, sitting: boolean) {
  const w = half + (sitting ? 1 : 0);
  ctx.beginPath();
  ctx.moveTo(-8.5, top);
  ctx.lineTo(8.5, top);
  ctx.lineTo(w, bottom);
  ctx.quadraticCurveTo(0, bottom + 2, -w, bottom);
  ctx.closePath();
  fillStroke(ctx, color);
}

function drawOnepiece(ctx: Ctx, a: AvatarConfig, op: string, facing: Facing, sitting: boolean) {
  const c = a.onepieceColor;
  const front = facing === "front";
  switch (op) {
    case "dress":
      flaredSkirt(ctx, c, -18, -6.5, 13, sitting);
      line(ctx, [[-12, -7.5], [0, -5.8], [12, -7.5]], shade(c, 0.55), 1.2);
      torso(ctx, c);
      if (front) ellipse(ctx, 0, -18.5, 1.6, 1.6, shade(c, 0.5));
      return;
    case "princess":
      flaredSkirt(ctx, c, -18, -3.5, 16, sitting);
      flaredSkirt(ctx, shade(c, 0.25), -18, -9, 12.5, sitting);
      for (let x = -14; x <= 14; x += 3.5) ellipse(ctx, x, -3.6 + Math.abs(x) * 0.02, 1.8, 1.3, WHITE, false);
      torso(ctx, c);
      roundRect(ctx, -9, -18.8, 18, 2.4, 1, shade(c, -0.2), false);
      if (front) {
        ellipse(ctx, -3, -17.6, 2.8, 1.8, shade(c, -0.2), true, 0.3);
        ellipse(ctx, 3, -17.6, 2.8, 1.8, shade(c, -0.2), true, -0.3);
        ellipse(ctx, 0, -17.6, 1.2, 1.2, shade(c, -0.3));
      }
      return;
    case "maid":
      flaredSkirt(ctx, c, -18, -6, 12.5, sitting);
      torso(ctx, c);
      if (front) {
        roundRect(ctx, -6, -19, 12, 12.5, 2, WHITE);
        for (let x = -5; x <= 5; x += 2.5) ellipse(ctx, x, -6.6, 1.3, 1, WHITE, false);
        roundRect(ctx, -4.5, -26, 9, 7, 1.5, WHITE);
        poly(ctx, [[-4.2, -30.4], [0, -27.6], [4.2, -30.4], [3, -28], [-3, -28]], WHITE);
        ellipse(ctx, 0, -28.2, 1.2, 1.2, "#e0525c");
      } else {
        ellipse(ctx, -2.6, -18.2, 3, 1.8, WHITE, true, 0.3);
        ellipse(ctx, 2.6, -18.2, 3, 1.8, WHITE, true, -0.3);
      }
      return;
    case "yukata": {
      poly(ctx, [[-9, -18], [9, -18], [9.6, -3.2], [-9.6, -3.2]], c);
      torso(ctx, c);
      ctx.save();
      ctx.beginPath();
      ctx.rect(-10, -31, 20, 28);
      ctx.clip();
      for (let row = 0; row < 4; row += 1) {
        const y = -28 + row * 6;
        for (let x = -7; x <= 7; x += 7) {
          const px = x + (row % 2 ? 3.5 : 0);
          for (let k = 0; k < 4; k += 1) ellipse(ctx, px + Math.cos(k * 1.57) * 1, y + Math.sin(k * 1.57) * 1, 0.8, 0.8, shade(c, 0.55), false);
        }
      }
      ctx.restore();
      if (front) {
        line(ctx, [[-4.5, -30.5], [2.5, -21]], shade(c, -0.4), 1);
        line(ctx, [[4.5, -30.5], [0.6, -24.5]], shade(c, -0.4), 1);
        line(ctx, [[1.8, -18], [3, -3.4]], shade(c, -0.3), 0.8);
      }
      const obi = luminance(c) > 0.6 ? "#b8323f" : "#f5cf47";
      roundRect(ctx, -9.4, -21, 18.8, 4.2, 1, obi);
      if (!front) {
        ellipse(ctx, -3.6, -19, 3.4, 2.6, obi, true, 0.2);
        ellipse(ctx, 3.6, -19, 3.4, 2.6, obi, true, -0.2);
      }
      return;
    }
    case "suit":
      roundRect(ctx, -8.8, -16, 17.6, 4, 1.5, c);
      torso(ctx, c);
      if (!front) return;
      poly(ctx, [[-3.2, -30.5], [3.2, -30.5], [2.2, -17], [-2.2, -17]], WHITE, false);
      line(ctx, [[-3.2, -30.5], [-1, -24], [-1.6, -15]], shade(c, -0.4), 1);
      line(ctx, [[3.2, -30.5], [1, -24], [1.6, -15]], shade(c, -0.4), 1);
      buttons(ctx, -0.2, -20, -16, shade(c, -0.4));
      return;
    case "tsunagi":
      roundRect(ctx, -8.8, -16, 17.6, 4, 1.5, c);
      torso(ctx, c);
      roundRect(ctx, -9, -16.5, 18, 1.8, 0.6, shade(c, -0.3), false);
      if (!front) return;
      line(ctx, [[0, -30], [0, -16.5]], shade(c, -0.3), 0.8);
      roundRect(ctx, -6.6, -25.5, 3.6, 3, 0.6, shade(c, -0.1));
      return;
    case "idol": {
      flaredSkirt(ctx, c, -18, -8, 12, sitting);
      for (let i = 0; i < 7; i += 1) {
        const x = -11 + i * 3.7;
        poly(ctx, [[x - 1.8, -8.4], [x + 1.8, -8.4], [x, -5.6]], WHITE, false);
      }
      torso(ctx, c);
      if (front) {
        line(ctx, [[-6, -29], [6, -29]], WHITE, 1.4);
        ellipse(ctx, -2.6, -22, 2.8, 1.8, WHITE, true, 0.3);
        ellipse(ctx, 2.6, -22, 2.8, 1.8, WHITE, true, -0.3);
        ellipse(ctx, 0, -22, 1.2, 1.2, "#f5cf47");
        for (const [x, y] of [[-5, -26], [5, -17], [-4, -16]]) ellipse(ctx, x, y, 0.8, 0.8, "#f5cf47", false);
      }
      return;
    }
    case "wedding": {
      const dress = c.toLowerCase() === "#f28fb8" ? "#ffffff" : c;
      flaredSkirt(ctx, dress, -18, -2, 16, sitting);
      for (let x = -14; x <= 14; x += 4) ellipse(ctx, x, -2.3, 2, 1.2, shade(dress, -0.06), false);
      ctx.save();
      ctx.globalAlpha = 0.35;
      flaredSkirt(ctx, "#ffffff", -18, -6, 13.5, sitting);
      ctx.restore();
      torsoPath(ctx);
      fillStroke(ctx, dress);
      if (front) {
        ctx.beginPath();
        ctx.ellipse(0, -30.5, 6, 3.4, 0, 0, Math.PI);
        fillStroke(ctx, a.skin, false);
        for (let i = -2; i <= 2; i += 1) ellipse(ctx, i * 2.2, -20.5, 0.9, 0.9, "#f7b8cf", false);
      }
      return;
    }
    case "kigurumi":
      roundRect(ctx, -8.8, -16, 17.6, 4, 1.5, c);
      torso(ctx, c);
      if (front) ellipse(ctx, 0, -20, 5.2, 5.8, shade(c, 0.45), false);
      else ellipse(ctx, 0, -14.5, 3, 3, shade(c, 0.3));
      return;
    case "swimsuit": {
      // Trunks-and-top swimwear with a polka-dot pattern.
      roundRect(ctx, -8.8, -16, 17.6, 5, 1.6, c);
      torso(ctx, c);
      ctx.save();
      torsoPath(ctx);
      ctx.clip();
      for (const [x, y] of [[-5, -26], [0, -22], [5, -27], [-4, -17], [4, -19], [0, -30]]) ellipse(ctx, x, y, 1.2, 1.2, shade(c, 0.55), false);
      ctx.restore();
      if (front) ellipse(ctx, 0, -30.4, 6, 3.2, a.skin, false);
      return;
    }
    case "china": {
      flaredSkirt(ctx, c, -18, -5, 9.6, sitting);
      torso(ctx, c);
      const trim = "#f5cf47";
      if (front) {
        line(ctx, [[-1, -18], [-1.6, -5.4]], shade(c, -0.35), 0.9);
        roundRect(ctx, -3.6, -31.6, 7.2, 3.4, 1.6, c);
        line(ctx, [[-2, -29.4], [5.6, -17.6]], trim, 1);
        for (const [x, y] of [[-4.5, -22], [-2, -17.2]]) ellipse(ctx, x, y, 1.1, 1.1, trim, false);
        ellipse(ctx, 6, -18.2, 1.1, 1.1, trim, false);
      } else {
        roundRect(ctx, -3.6, -31.6, 7.2, 3.4, 1.6, c);
      }
      line(ctx, [[-9.6, -5.2], [9.6, -5.2]], trim, 1);
      return;
    }
    case "astronaut": {
      roundRect(ctx, -8.8, -16, 17.6, 4, 1.5, c);
      torso(ctx, c);
      ellipse(ctx, 0, -30.4, 8.4, 2.8, shade(c, -0.12), false);
      if (front) {
        roundRect(ctx, -5.4, -26, 10.8, 7, 1.4, shade(c, -0.1));
        ellipse(ctx, -2.6, -22.6, 1, 1, "#e0525c", false);
        ellipse(ctx, 0.2, -22.6, 1, 1, "#4f8fe0", false);
        ellipse(ctx, 3, -22.6, 1, 1, "#8fcf5a", false);
        ellipse(ctx, 6.4, -27.6, 2.2, 2.2, "#3651a8");
      }
      roundRect(ctx, -9, -16.5, 18, 1.8, 0.6, shade(c, -0.3), false);
      return;
    }
    case "ninja": {
      roundRect(ctx, -8.8, -16, 17.6, 4, 1.5, c);
      torso(ctx, c);
      const sash = "#e0525c";
      roundRect(ctx, -9, -20.4, 18, 3.6, 1, sash);
      if (front) {
        line(ctx, [[-4, -30.5], [3, -20.6]], shade(c, 0.3), 1);
        line(ctx, [[4, -30.5], [-3, -20.6]], shade(c, 0.3), 1);
      } else {
        poly(ctx, [[-1.6, -18.6], [-6.6, -12], [-3.4, -12]], sash);
        poly(ctx, [[1.6, -18.6], [6.6, -12], [3.4, -12]], shade(sash, -0.2));
      }
      return;
    }
  }
}

export function drawTorso(ctx: Ctx, a: AvatarConfig, facing: Facing, sitting: boolean) {
  const op = onepieceOf(a);
  if (op) drawOnepiece(ctx, a, op, facing, sitting);
  else drawTop(ctx, a, facing);
}

/** Kigurumi hood frames the face; drawn after the hair, before the hat. */
export function drawKigurumiHood(ctx: Ctx, a: AvatarConfig, facing: Facing) {
  if (onepieceOf(a) !== "kigurumi") return;
  const c = a.onepieceColor;
  ellipse(ctx, -13.5, -60, 5, 5, c);
  ellipse(ctx, 13.5, -60, 5, 5, c);
  ellipse(ctx, -13.5, -60, 2.6, 2.6, shade(c, 0.45), false);
  ellipse(ctx, 13.5, -60, 2.6, 2.6, shade(c, 0.45), false);
  ctx.beginPath();
  ctx.ellipse(0, -45, 20.5, 19, 0, 0, Math.PI * 2);
  if (facing === "front") ctx.ellipse(0, -41.5, 14.2, 12.6, 0, 0, Math.PI * 2, true);
  ctx.fillStyle = c;
  ctx.fill("evenodd");
  ctx.strokeStyle = LINE;
  ctx.lineWidth = LINE_WIDTH;
  ctx.stroke();
}

// ------------------------------------------------------------------- arms

export function defaultArms(swing: number): ArmPose {
  return { left: [-10.6, -16 - swing * 1.4], right: [10.6, -16 + swing * 1.4] };
}

export function drawArms(ctx: Ctx, a: AvatarConfig, arms: ArmPose) {
  const { kind, color } = sleeveOf(a);
  for (const [side, hand] of [[-1, arms.left], [1, arms.right]] as Array<[number, Point]>) {
    const sx = side * 8.2;
    const sy = -27.5;
    const [hx, hy] = hand;
    const at = (t: number): Point => [sx + (hx - sx) * t, sy + (hy - sy) * t];

    ctx.lineCap = "round";
    line(ctx, [[sx, sy], [hx, hy]], LINE, 5.4);
    line(ctx, [[sx, sy], [hx, hy]], kind === "long" || kind === "wide" ? color : a.skin, 3.4);
    if (kind === "short") line(ctx, [[sx, sy], at(0.45)], color, 4.6);
    if (kind === "puff") {
      const [px, py] = at(0.25);
      ellipse(ctx, px, py, 3.6, 3.2, color);
    }
    if (kind === "wide") {
      const [px, py] = at(0.72);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(Math.atan2(hy - sy, hx - sx) - Math.PI / 2);
      roundRect(ctx, -3.6, -3, 7.2, 8, 2, color);
      ctx.restore();
    }
    if (a.top === "sailor" && !onepieceOf(a)) line(ctx, [at(0.82), at(0.9)], a.topColor, 3.6);
    const handColor = onepieceOf(a) === "kigurumi" ? a.onepieceColor : a.skin;
    ellipse(ctx, hx, hy + 0.6, 2.4, 2.4, handColor);
  }
}
