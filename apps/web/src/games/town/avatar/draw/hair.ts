// Hairstyles: a back layer (behind the body, front view), a front layer
// (after the face) and a full back view.
import type { AvatarConfig } from "../parts";
import { ellipse, fillStroke, line, poly, roundRect, shade, type Ctx } from "./common";

type Pt = [number, number];

function dome(ctx: Ctx, bangs: Pt[], color: string, top = -67) {
  ctx.beginPath();
  ctx.moveTo(-17.4, -39);
  ctx.bezierCurveTo(-19.5, top, 19.5, top, 17.4, -39);
  for (const [x, y] of bangs) ctx.lineTo(x, y);
  ctx.closePath();
  fillStroke(ctx, color);
}

const BANGS_ZIG: Pt[] = [
  [15.5, -48], [11.5, -45.5], [7.5, -50.5], [3.5, -46.5], [-0.5, -51.5],
  [-4.5, -46.5], [-8.5, -50.5], [-12.5, -45.5], [-15.5, -48],
];
const BANGS_STRAIGHT: Pt[] = [[16, -46.5], [-16, -46.5]];
const BANGS_SIDE: Pt[] = [[15.5, -45], [10, -47], [4, -49.5], [-3, -53], [-8, -49], [-14, -46]];
const BANGS_SEVEN_THREE: Pt[] = [[15.5, -46], [12, -53.5], [9, -54], [2, -51], [-6, -48.5], [-12, -46.5], [-15.5, -44]];
const BANGS_MESSY: Pt[] = [
  [16, -44], [13, -49], [10.5, -44.5], [7, -50], [4, -45], [0, -51], [-3, -46], [-6.5, -52], [-9, -45.5], [-13, -50], [-16, -44],
];
const SPIKES: Pt[] = [[-15, -50], [-15, -61], [-9, -57], [-6, -69], [0, -59], [5, -70], [8, -58], [15, -63], [15, -50]];

function sideLocks(ctx: Ctx, color: string, bottomY: number, top = -49) {
  roundRect(ctx, -18.5, top, 6, bottomY - top, 3, color);
  roundRect(ctx, 12.5, top, 6, bottomY - top, 3, color);
}

function wavyLock(ctx: Ctx, x: number, color: string, bottomY: number) {
  for (let y = -48; y <= bottomY; y += 4.2) ellipse(ctx, x + Math.sin(y * 0.8) * 1.2, y, 3.6, 3, color);
}

function braid(ctx: Ctx, x: number, color: string, from: number, to: number) {
  for (let y = from; y <= to; y += 3.6) ellipse(ctx, x, y, 3, 2.3, color);
  ellipse(ctx, x, to + 2.6, 1.5, 1.5, "#e0525c");
  line(ctx, [[x - 1.5, to + 4], [x - 2.3, to + 7.5]], color, 1.6);
  line(ctx, [[x + 1.5, to + 4], [x + 2.3, to + 7.5]], color, 1.6);
}

function tie(ctx: Ctx, x: number, y: number) {
  ellipse(ctx, x, y, 2.2, 2.2, "#e0525c");
}

// ------------------------------------------------------------ front view

export function drawHairBackLayer(ctx: Ctx, a: AvatarConfig) {
  const c = shade(a.hairColor, -0.1);
  switch (a.hair) {
    case "long":
    case "hime":
      roundRect(ctx, -18.5, -52, 37, 30, 8, c);
      break;
    case "wavy":
      roundRect(ctx, -19, -52, 38, 22, 9, c);
      for (let x = -16; x <= 16; x += 6.4) ellipse(ctx, x, -29, 4.2, 4.6, c);
      break;
    case "bob":
    case "mash":
      roundRect(ctx, -19, -52, 38, 20, 8, c);
      break;
    case "twintail":
      for (const side of [-1, 1]) {
        ellipse(ctx, side * 21, -36, 5.5, 11, c, true, side * 0.25);
        tie(ctx, side * 17.5, -47);
      }
      break;
    case "ponytail":
      ellipse(ctx, -18, -44, 5, 11, c, true, 0.5);
      break;
    case "sidetail":
      ellipse(ctx, 21, -40, 5.5, 12, c, true, -0.2);
      tie(ctx, 17.5, -50);
      break;
    case "braid":
      braid(ctx, -15.5, c, -40, -26);
      braid(ctx, 15.5, c, -40, -26);
      break;
    case "afro":
      ellipse(ctx, 0, -50, 23, 19, a.hairColor);
      break;
  }
}

export function drawHairFront(ctx: Ctx, a: AvatarConfig) {
  const c = a.hairColor;
  switch (a.hair) {
    case "short":
    case "twintail":
      dome(ctx, BANGS_ZIG, c);
      break;
    case "spiky":
      poly(ctx, SPIKES, c);
      dome(ctx, BANGS_ZIG, c);
      break;
    case "sidepart":
      dome(ctx, BANGS_SEVEN_THREE, c);
      line(ctx, [[9, -54], [6, -61]], shade(c, -0.3), 0.8);
      break;
    case "messy":
      poly(ctx, [[-17, -48], [-21, -53], [-15, -55]], c);
      poly(ctx, [[17, -48], [21, -54], [15, -56]], c);
      poly(ctx, [[-4, -58], [-2, -66], [3, -58]], c);
      dome(ctx, BANGS_MESSY, c);
      break;
    case "mash":
      ctx.beginPath();
      ctx.moveTo(-18.6, -38);
      ctx.bezierCurveTo(-20.5, -69, 20.5, -69, 18.6, -38);
      ctx.quadraticCurveTo(17, -44, 13, -44.5);
      ctx.lineTo(-13, -44.5);
      ctx.quadraticCurveTo(-17, -44, -18.6, -38);
      ctx.closePath();
      fillStroke(ctx, c);
      break;
    case "bob":
      sideLocks(ctx, c, -34);
      dome(ctx, BANGS_STRAIGHT, c);
      break;
    case "hime":
      sideLocks(ctx, c, -34, -48);
      line(ctx, [[-18.5, -34], [-12.5, -34]], shade(c, -0.25), 0.8);
      line(ctx, [[12.5, -34], [18.5, -34]], shade(c, -0.25), 0.8);
      dome(ctx, [[16, -45.5], [-16, -45.5]], c);
      break;
    case "long":
      sideLocks(ctx, c, -29);
      dome(ctx, BANGS_SIDE, c);
      break;
    case "wavy":
      wavyLock(ctx, -16, c, -30);
      wavyLock(ctx, 16, c, -30);
      dome(ctx, BANGS_SIDE, c);
      break;
    case "ponytail":
    case "sidetail":
    case "braid":
      dome(ctx, BANGS_SIDE, c);
      break;
    case "bun":
      ellipse(ctx, 0, -62.5, 7.5, 6.5, c);
      dome(ctx, BANGS_STRAIGHT, c);
      break;
    case "doublebun":
      ellipse(ctx, -12, -59.5, 6.2, 5.8, c);
      ellipse(ctx, 12, -59.5, 6.2, 5.8, c);
      dome(ctx, BANGS_ZIG, c);
      break;
    case "afro":
      dome(ctx, BANGS_STRAIGHT, c);
      for (let x = -14; x <= 14; x += 7) ellipse(ctx, x, -48, 4.5, 3.5, c, false);
      break;
    case "mohawk":
      ctx.save();
      ctx.globalAlpha = 0.35;
      dome(ctx, [[16, -48], [-16, -48]], c);
      ctx.restore();
      poly(ctx, [[-4, -57], [-6, -64], [-3, -63], [-4, -71], [0, -66], [2, -74], [3, -66], [6, -69], [4, -57]], c);
      break;
  }
}

// -------------------------------------------------------------- back view

export function drawHairBackView(ctx: Ctx, a: AvatarConfig) {
  const c = a.hairColor;
  switch (a.hair) {
    case "none":
      return;
    case "mohawk":
      ctx.save();
      ctx.globalAlpha = 0.35;
      ellipse(ctx, 0, -46, 17, 15, c, false);
      ctx.restore();
      poly(ctx, [[-4, -36], [-5, -64], [0, -74], [5, -64], [4, -36]], c);
      return;
    case "afro":
      ellipse(ctx, 0, -50, 23, 19, c);
      return;
    case "long":
    case "hime":
      roundRect(ctx, -18, -52, 36, 30, 8, c);
      break;
    case "wavy":
      roundRect(ctx, -18.5, -52, 37, 22, 9, c);
      for (let x = -16; x <= 16; x += 6.4) ellipse(ctx, x, -29, 4.2, 4.6, c);
      break;
    case "bob":
    case "mash":
      roundRect(ctx, -18.5, -52, 37, 19, 8, c);
      break;
    case "spiky":
      poly(ctx, SPIKES, c);
      break;
    case "messy":
      poly(ctx, [[-17, -44], [-22, -50], [-15, -54], [-8, -64], [0, -60], [8, -65], [15, -54], [22, -50], [17, -44]], c);
      break;
  }
  ellipse(ctx, 0, -45.5, 17.6, 15.6, c);
  switch (a.hair) {
    case "twintail":
      for (const side of [-1, 1]) {
        ellipse(ctx, side * 20, -36, 5.5, 11, c, true, side * 0.25);
        tie(ctx, side * 16.5, -47);
      }
      break;
    case "ponytail":
      ellipse(ctx, 0, -34, 5, 10, c);
      tie(ctx, 0, -43);
      break;
    case "sidetail":
      ellipse(ctx, -20, -40, 5.5, 12, c, true, 0.2);
      tie(ctx, -16.5, -50);
      break;
    case "braid":
      braid(ctx, -6, c, -36, -24);
      braid(ctx, 6, c, -36, -24);
      break;
    case "bun":
      ellipse(ctx, 0, -60, 7.5, 6.5, c);
      break;
    case "doublebun":
      ellipse(ctx, -12, -58, 6.2, 5.8, c);
      ellipse(ctx, 12, -58, 6.2, 5.8, c);
      break;
  }
}
