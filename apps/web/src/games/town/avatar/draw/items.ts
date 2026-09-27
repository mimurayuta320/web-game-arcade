// Accessories: hats, glasses, neckwear, back items and hand-held items.
import type { AvatarConfig } from "../parts";
import {
  EYE_X, EYE_Y, LINE, ellipse, fillStroke, heartPath, line, poly, roundRect, shade, starPath, type Ctx, type Facing,
} from "./common";
import type { Point } from "./body";

const GOLD = "#f5cf47";

// ------------------------------------------------------------------- hats

function capDome(ctx: Ctx, color: string, base: number, top: number, half = 17.8) {
  ctx.beginPath();
  ctx.moveTo(-half, base);
  ctx.bezierCurveTo(-half - 1.2, top, half + 1.2, top, half, base);
  ctx.closePath();
  fillStroke(ctx, color);
}

export function drawHat(ctx: Ctx, a: AvatarConfig, facing: Facing, look: number, time: number) {
  const c = a.hatColor;
  const back = facing === "back";
  switch (a.hat) {
    case "cap":
      capDome(ctx, c, -48, -68);
      if (!back) ellipse(ctx, 4 + look * 2, -48.5, 12.5, 3.2, shade(c, -0.2));
      ellipse(ctx, 0, -62.5, 1.6, 1.2, shade(c, -0.3), false);
      break;
    case "beanie":
      capDome(ctx, c, -49, -69, 17.5);
      roundRect(ctx, -18, -53, 36, 5.5, 2.5, shade(c, -0.18));
      ellipse(ctx, 0, -64.5, 4.2, 4.2, shade(c, 0.45));
      break;
    case "beret":
      ellipse(ctx, 3, -58, 17, 6.5, c, true, -0.12);
      ellipse(ctx, 4, -64.4, 1.4, 1.8, shade(c, -0.2));
      break;
    case "straw":
      ellipse(ctx, 0, -50, 26, 6.5, "#e9c46a");
      capDome(ctx, "#f0d27f", -51, -67, 12);
      ctx.fillStyle = c;
      ctx.fillRect(-12.3, -55, 24.6, 3.2);
      break;
    case "silk":
      ellipse(ctx, 0, -56, 17, 4.2, shade(c, -0.1));
      roundRect(ctx, -10.5, -79, 21, 23, 1.5, c);
      ellipse(ctx, 0, -79, 10.5, 2.6, shade(c, 0.15));
      ctx.fillStyle = c === "#e0525c" ? "#2e2e38" : "#e0525c";
      ctx.fillRect(-10.4, -62, 20.8, 3.2);
      break;
    case "witch":
      ellipse(ctx, 0, -54, 25, 6, c);
      ctx.beginPath();
      ctx.moveTo(-12, -56);
      ctx.quadraticCurveTo(-4, -76, 9, -92);
      ctx.quadraticCurveTo(6, -74, 12, -56);
      ctx.closePath();
      fillStroke(ctx, c);
      ctx.fillStyle = GOLD;
      ctx.fillRect(-11.6, -60, 23.2, 3);
      starPath(ctx, -2, -69, 2.8);
      fillStroke(ctx, GOLD, false);
      break;
    case "santa":
      ctx.beginPath();
      ctx.moveTo(-16, -53);
      ctx.bezierCurveTo(-14, -72, 12, -76, 22, -62);
      ctx.lineTo(16, -53);
      ctx.closePath();
      fillStroke(ctx, c);
      roundRect(ctx, -18, -56, 36, 6, 3, "#ffffff");
      ellipse(ctx, 22, -61, 4, 4, "#ffffff");
      break;
    case "ribbon": {
      const x = back ? -11 : 11;
      ctx.save();
      ctx.translate(x, -57);
      ctx.rotate(back ? 0.3 : -0.3);
      for (const side of [-1, 1]) poly(ctx, [[0, 0], [side * 8, -5], [side * 8, 5]], c);
      ellipse(ctx, 0, 0, 2.4, 2.4, shade(c, -0.15));
      ctx.restore();
      break;
    }
    case "flower": {
      const x = back ? 11 : -11;
      for (let i = 0; i < 5; i += 1) {
        const ang = (i / 5) * Math.PI * 2;
        ellipse(ctx, x + Math.cos(ang) * 3.4, -55 + Math.sin(ang) * 3.4, 2.8, 2.8, c);
      }
      ellipse(ctx, x, -55, 2.2, 2.2, GOLD);
      break;
    }
    case "crown":
      poly(ctx, [[-9, -56], [-10, -67], [-5, -61], [0, -69], [5, -61], [10, -67], [9, -56]], GOLD);
      if (!back) ellipse(ctx, 0, -60, 1.8, 1.8, c);
      break;
    case "tiara":
      ctx.beginPath();
      ctx.moveTo(-11, -55);
      ctx.quadraticCurveTo(0, -66, 11, -55);
      ctx.strokeStyle = "#d8d8e0";
      ctx.lineWidth = 1.8;
      ctx.stroke();
      if (!back) {
        poly(ctx, [[-3, -58], [0, -64], [3, -58], [0, -56]], c);
        ellipse(ctx, -6.5, -58.4, 1.3, 1.3, "#ffffff", false);
        ellipse(ctx, 6.5, -58.4, 1.3, 1.3, "#ffffff", false);
      }
      break;
    case "catears":
      for (const side of [-1, 1]) {
        poly(ctx, [[side * 4, -57], [side * 12, -69], [side * 16, -53]], c);
        if (!back) poly(ctx, [[side * 7, -57], [side * 11.5, -64.5], [side * 13.5, -56]], "#f7a8bf", false);
      }
      break;
    case "bunnyears":
      for (const side of [-1, 1]) {
        ellipse(ctx, side * 6.5, -71, 4.4, 13, c, true, side * 0.15);
        if (!back) ellipse(ctx, side * 6.5, -70, 2, 9.5, "#f7a8bf", false, side * 0.15);
      }
      break;
    case "headphones":
      ctx.beginPath();
      ctx.moveTo(-17.5, -44);
      ctx.bezierCurveTo(-19, -67, 19, -67, 17.5, -44);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 4.2;
      ctx.stroke();
      ctx.strokeStyle = c;
      ctx.lineWidth = 2.6;
      ctx.stroke();
      ellipse(ctx, -18, -42, 4.2, 6, c);
      ellipse(ctx, 18, -42, 4.2, 6, c);
      break;
    case "horns":
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * 6, -56);
        ctx.quadraticCurveTo(side * 12, -62, side * 11, -70);
        ctx.quadraticCurveTo(side * 14, -62, side * 11, -54);
        ctx.closePath();
        fillStroke(ctx, c);
      }
      break;
    case "pumpkin": {
      for (const [dx, rx] of [[-8, 8], [8, 8], [0, 10]]) ellipse(ctx, dx, -58, rx, 9, dx ? "#e07a24" : "#f08a3c");
      roundRect(ctx, -2, -71, 4, 6, 1, "#3f7a3a");
      if (!back) {
        poly(ctx, [[-7, -60], [-3, -60], [-5, -64]], "#2b1d1a", false);
        poly(ctx, [[3, -60], [7, -60], [5, -64]], "#2b1d1a", false);
      }
      break;
    }
    case "chef":
      roundRect(ctx, -12, -58, 24, 7, 2, "#ffffff");
      for (const [dx, dy, r] of [[-7, -64, 7], [7, -64, 7], [0, -69, 8]]) ellipse(ctx, dx, dy, r, r * 0.9, "#ffffff");
      break;
    case "pirate":
      ctx.beginPath();
      ctx.moveTo(-22, -54);
      ctx.quadraticCurveTo(0, -48, 22, -54);
      ctx.quadraticCurveTo(14, -74, 0, -72);
      ctx.quadraticCurveTo(-14, -74, -22, -54);
      ctx.closePath();
      fillStroke(ctx, "#2e2e38");
      if (!back) {
        ellipse(ctx, 0, -62, 3.4, 3, "#ffffff", false);
        line(ctx, [[-3, -58], [3, -56]], "#ffffff", 1);
        line(ctx, [[3, -58], [-3, -56]], "#ffffff", 1);
      }
      line(ctx, [[-20, -54.5], [20, -54.5]], GOLD, 1.2);
      break;
    case "kanzashi": {
      const x = back ? 12 : -12;
      line(ctx, [[x - 6, -50], [x + 4, -60]], GOLD, 1.4);
      for (let i = 0; i < 5; i += 1) {
        const ang = (i / 5) * Math.PI * 2;
        ellipse(ctx, x + 3 + Math.cos(ang) * 3, -60 + Math.sin(ang) * 3, 2.4, 2.4, "#f7b8cf");
      }
      ellipse(ctx, x + 3, -60, 1.4, 1.4, GOLD, false);
      for (const dy of [0, 4, 8]) ellipse(ctx, x + 6, -55 + dy, 1.1, 1.1, "#f28fb8", false);
      break;
    }
    case "halo": {
      const y = -70 + Math.sin(time * 3) * 1.2;
      ctx.beginPath();
      ctx.ellipse(0, y, 11, 3.2, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(245, 207, 71, 0.95)";
      ctx.lineWidth = 2.4;
      ctx.stroke();
      break;
    }
  }
}

// ---------------------------------------------------------------- glasses

export function drawGlasses(ctx: Ctx, a: AvatarConfig, look: number) {
  const c = a.glassesColor;
  const lx = -EYE_X + look;
  const rx = EYE_X + look;
  const y = EYE_Y;
  const bridge = () => line(ctx, [[lx + 4, y - 0.5], [rx - 4, y - 0.5]], c, 1.1);
  switch (a.glasses) {
    case "round":
      for (const x of [lx, rx]) {
        ctx.beginPath();
        ctx.arc(x, y, 4.1, 0, Math.PI * 2);
        ctx.strokeStyle = c;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      bridge();
      break;
    case "square":
      for (const x of [lx, rx]) {
        ctx.beginPath();
        ctx.roundRect(x - 4.4, y - 3.2, 8.8, 6.2, 1.4);
        ctx.strokeStyle = c;
        ctx.lineWidth = 1.3;
        ctx.stroke();
      }
      bridge();
      break;
    case "sunglasses":
      roundRect(ctx, lx - 4.6, y - 3.5, 8.8, 6, 2.4, "#22222a");
      roundRect(ctx, rx - 4.2, y - 3.5, 8.8, 6, 2.4, "#22222a");
      bridge();
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fillRect(lx - 2.8, y - 2.5, 2.5, 1.2);
      ctx.fillRect(rx - 2, y - 2.5, 2.5, 1.2);
      break;
    case "heart":
      for (const x of [lx, rx]) {
        heartPath(ctx, x, y + 0.6, 0.85);
        fillStroke(ctx, c === "#2e2e38" ? "#f0587d" : c, true);
      }
      bridge();
      break;
    case "star":
      for (const x of [lx, rx]) {
        starPath(ctx, x, y, 5.2);
        fillStroke(ctx, c === "#2e2e38" ? GOLD : c, true);
      }
      break;
    case "goggles":
      line(ctx, [[-17, y - 1], [17, y - 1]], shade(c, -0.2), 2.4);
      for (const x of [lx, rx]) {
        ellipse(ctx, x, y, 4.6, 4, c);
        ellipse(ctx, x, y, 3.2, 2.7, "rgba(170,220,255,0.75)", false);
      }
      break;
    case "vr": {
      line(ctx, [[-17.5, y - 1], [17.5, y - 1]], "#2e2e38", 2.2);
      roundRect(ctx, -13 + look, y - 5.5, 26, 10, 3, c === "#2e2e38" ? "#f7f4ee" : c);
      const glow = ctx.createLinearGradient(-11 + look, 0, 11 + look, 0);
      glow.addColorStop(0, "#4f8fe0");
      glow.addColorStop(1, "#9a6bd8");
      ctx.beginPath();
      ctx.roundRect(-11 + look, y - 3.5, 22, 5.5, 2);
      ctx.fillStyle = glow;
      ctx.fill();
      break;
    }
    case "mask":
      ctx.beginPath();
      ctx.roundRect(-8 + look * 0.6, -39.5, 16, 9.5, 3.5);
      fillStroke(ctx, c === "#2e2e38" ? "#ffffff" : c);
      line(ctx, [[-8 + look * 0.6, -37], [-14, -40]], LINE, 0.6);
      line(ctx, [[8 + look * 0.6, -37], [14, -40]], LINE, 0.6);
      for (const dy of [-36.5, -33.5]) line(ctx, [[-5 + look * 0.6, dy], [5 + look * 0.6, dy]], "rgba(0,0,0,0.12)", 0.6);
      break;
  }
}

// ------------------------------------------------------------------ neck

export function drawNeck(ctx: Ctx, a: AvatarConfig, facing: Facing) {
  const c = a.neckColor;
  const front = facing === "front";
  switch (a.neck) {
    case "necktie":
      if (!front) return;
      poly(ctx, [[-1.6, -30], [1.6, -30], [1, -27.6], [-1, -27.6]], c);
      poly(ctx, [[-1, -27.6], [1, -27.6], [2, -19], [0, -17.2], [-2, -19]], c);
      break;
    case "bowtie":
      if (!front) return;
      poly(ctx, [[0, -29.4], [-4.6, -31.8], [-4.6, -27], [0, -29.4], [4.6, -31.8], [4.6, -27]], c);
      ellipse(ctx, 0, -29.4, 1.2, 1.2, shade(c, -0.2));
      break;
    case "ribbon":
      if (!front) return;
      ellipse(ctx, -3.6, -28.8, 3.6, 2.4, c, true, 0.35);
      ellipse(ctx, 3.6, -28.8, 3.6, 2.4, c, true, -0.35);
      poly(ctx, [[-1, -28.4], [-3.4, -22.6], [-1.2, -23.4]], c);
      poly(ctx, [[1, -28.4], [3.4, -22.6], [1.2, -23.4]], c);
      ellipse(ctx, 0, -28.8, 1.4, 1.4, shade(c, -0.2));
      break;
    case "scarf":
      roundRect(ctx, -8.6, -32, 17.2, 4.6, 2.2, c);
      if (front) {
        roundRect(ctx, 2.4, -29, 4.2, 11, 1.5, shade(c, -0.08));
        for (const x of [3.2, 4.6, 6]) line(ctx, [[x, -18.4], [x, -16.8]], c, 0.8);
      } else {
        roundRect(ctx, -3, -29, 4.2, 9, 1.5, shade(c, -0.08));
      }
      break;
    case "necklace":
      if (!front) return;
      for (let i = 0; i <= 8; i += 1) {
        const ang = Math.PI * (0.15 + (i / 8) * 0.7);
        ellipse(ctx, Math.cos(ang) * 5.4, -31 + Math.sin(ang) * 5, 0.8, 0.8, "#ffffff", true);
      }
      ellipse(ctx, 0, -25.4, 1.5, 1.8, c);
      break;
    case "bell":
      roundRect(ctx, -6.6, -31.2, 13.2, 2.4, 1.2, c);
      if (!front) return;
      ellipse(ctx, 0, -27.4, 2.3, 2.3, GOLD);
      line(ctx, [[-1.6, -27.4], [1.6, -27.4]], "rgba(0,0,0,0.3)", 0.5);
      break;
  }
}

// ------------------------------------------------------------------- back

/** Back items. "under" is drawn before the body, "over" after it. */
export function drawBackItem(ctx: Ctx, a: AvatarConfig, facing: Facing, layer: "under" | "over", time: number) {
  const c = a.backColor;
  const front = facing === "front";
  const flap = Math.sin(time * 6) * 0.12;
  const wings = (outline: string, fill: string, shape: "feather" | "bat" | "fairy") => {
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(side * 5, -25);
      ctx.rotate(side * (0.15 + flap));
      ctx.scale(side, 1);
      if (shape === "feather") {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(10, -16, 22, -14, 24, -8);
        ctx.bezierCurveTo(20, -6, 22, -2, 18, 0);
        ctx.bezierCurveTo(16, 3, 12, 3, 10, 6);
        ctx.closePath();
      } else if (shape === "bat") {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(10, -14);
        ctx.lineTo(24, -12);
        ctx.quadraticCurveTo(20, -6, 22, 0);
        ctx.quadraticCurveTo(16, -2, 14, 4);
        ctx.quadraticCurveTo(10, 0, 6, 5);
        ctx.closePath();
      } else {
        ctx.beginPath();
        ctx.ellipse(10, -9, 11, 7, -0.5, 0, Math.PI * 2);
        ctx.moveTo(8, 2);
        ctx.ellipse(9, 4, 7, 4.5, 0.5, 0, Math.PI * 2);
      }
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
  };

  switch (a.back) {
    case "angel":
      if ((front && layer === "under") || (!front && layer === "over")) wings(LINE, "#ffffff", "feather");
      break;
    case "devil":
      if ((front && layer === "under") || (!front && layer === "over")) wings(LINE, c === "#4f8fe0" ? "#4a2a5a" : c, "bat");
      break;
    case "fairy":
      if ((front && layer === "under") || (!front && layer === "over")) {
        ctx.save();
        ctx.globalAlpha = 0.75;
        wings("rgba(58,38,38,0.5)", shade(c, 0.55), "fairy");
        ctx.restore();
      }
      break;
    case "cape":
      if (front && layer === "under") {
        poly(ctx, [[-8, -30], [8, -30], [13, -4], [-13, -4]], shade(c, -0.25));
      } else if (front && layer === "over") {
        ellipse(ctx, -5.6, -29.6, 1.4, 1.4, GOLD);
        ellipse(ctx, 5.6, -29.6, 1.4, 1.4, GOLD);
      } else if (!front && layer === "over") {
        ctx.beginPath();
        ctx.moveTo(-8, -30);
        ctx.lineTo(8, -30);
        ctx.quadraticCurveTo(14, -16, 13, -4);
        ctx.quadraticCurveTo(0, -1, -13, -4);
        ctx.quadraticCurveTo(-14, -16, -8, -30);
        ctx.closePath();
        fillStroke(ctx, c);
      }
      break;
    case "backpack":
    case "randoseru": {
      const pack = a.back === "randoseru" ? (c === "#4f8fe0" ? "#b8323f" : c) : c;
      if (front && layer === "over") {
        line(ctx, [[-5.5, -29.5], [-6.5, -16]], shade(pack, -0.2), 1.8);
        line(ctx, [[5.5, -29.5], [6.5, -16]], shade(pack, -0.2), 1.8);
      } else if (!front && layer === "over") {
        if (a.back === "randoseru") {
          roundRect(ctx, -9.5, -30, 19, 16, 3, pack);
          roundRect(ctx, -9.5, -30, 19, 9, [3, 3, 6, 6], shade(pack, -0.12));
          ellipse(ctx, 0, -21.2, 1.4, 1.4, GOLD);
        } else {
          roundRect(ctx, -8, -29, 16, 15, 5, pack);
          roundRect(ctx, -5.5, -21, 11, 5.5, 2, shade(pack, -0.12));
        }
      } else if (front && layer === "under") {
        roundRect(ctx, -10.5, -29, 21, 14, 4, shade(pack, -0.15));
      }
      break;
    }
    case "rainbow":
      if ((front && layer === "under") || (!front && layer === "over")) {
        const colors = ["#e0525c", "#f08a3c", "#f5cf47", "#8fcf5a", "#4f8fe0", "#9a6bd8"];
        for (const side of [-1, 1]) {
          ctx.save();
          ctx.translate(side * 5, -25);
          ctx.rotate(side * (0.2 + flap));
          ctx.scale(side, 1);
          colors.forEach((col, i) => {
            ctx.beginPath();
            ctx.ellipse(8 + i * 2.6, -8 + i * 1.2, 5, 13 - i, -0.9 + i * 0.12, 0, Math.PI * 2);
            ctx.fillStyle = col;
            ctx.fill();
          });
          ctx.restore();
        }
      }
      break;
    case "jetpack":
      if (!front && layer === "over") {
        for (const x of [-5, 5]) {
          roundRect(ctx, x - 4, -30, 8, 15, 3, c === "#4f8fe0" ? "#9aa0aa" : c);
          const flame = 5 + Math.sin(time * 20 + x) * 2;
          ctx.beginPath();
          ctx.moveTo(x - 3, -15);
          ctx.lineTo(x, -15 + flame + 4);
          ctx.lineTo(x + 3, -15);
          ctx.closePath();
          ctx.fillStyle = "#f5a53c";
          ctx.fill();
        }
      } else if (front && layer === "under") {
        roundRect(ctx, -12.5, -30, 5, 14, 2.5, c === "#4f8fe0" ? "#9aa0aa" : c);
        roundRect(ctx, 7.5, -30, 5, 14, 2.5, c === "#4f8fe0" ? "#9aa0aa" : c);
      } else if (front && layer === "over") {
        line(ctx, [[-5.5, -29.5], [-6.5, -16]], "#3e4552", 1.8);
        line(ctx, [[5.5, -29.5], [6.5, -16]], "#3e4552", 1.8);
      }
      break;
    case "tail": {
      const wag = Math.sin(time * 5) * 3;
      if ((front && layer === "under") || (!front && layer === "over")) {
        ctx.beginPath();
        ctx.moveTo(front ? 4 : 0, -15);
        ctx.quadraticCurveTo(14 + wag, -14, 15 + wag, -26);
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 4.4;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.strokeStyle = c;
        ctx.lineWidth = 2.8;
        ctx.stroke();
      }
      break;
    }
  }
}

// ------------------------------------------------------------------- hand

/** Hand-held item in the right hand. */
export function drawHandItem(ctx: Ctx, a: AvatarConfig, hand: Point, time: number) {
  const [hx, hy] = hand;
  const c = a.handColor;
  switch (a.hand) {
    case "balloon": {
      const bx = hx + 6 + Math.sin(time * 1.5) * 1.5;
      const by = -82;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.quadraticCurveTo(hx + 4, (hy + by) / 2, bx, by + 9);
      ctx.strokeStyle = "rgba(58,38,38,0.7)";
      ctx.lineWidth = 0.7;
      ctx.stroke();
      ellipse(ctx, bx, by, 7.5, 9, c);
      ellipse(ctx, bx - 2.6, by - 3, 1.6, 2.4, "rgba(255,255,255,0.6)", false);
      poly(ctx, [[bx - 1.2, by + 9.4], [bx + 1.2, by + 9.4], [bx, by + 8]], c);
      break;
    }
    case "icecream":
      poly(ctx, [[hx - 3, hy - 3], [hx + 3, hy - 3], [hx, hy + 4]], "#e3b76c");
      ellipse(ctx, hx, hy - 5, 3.6, 3.2, c);
      ellipse(ctx, hx, hy - 9.2, 3, 2.8, shade(c, 0.35));
      break;
    case "bouquet":
      poly(ctx, [[hx - 4, hy - 4], [hx + 4, hy - 4], [hx + 1, hy + 4], [hx - 1, hy + 4]], "#f7f1e3");
      for (const [dx, dy] of [[-3, -7], [0, -9], [3, -7], [-1.5, -5], [1.5, -5]]) ellipse(ctx, hx + dx, hy + dy, 2.2, 2.2, c);
      ellipse(ctx, hx, hy - 9, 0.9, 0.9, GOLD, false);
      break;
    case "bag":
      ctx.beginPath();
      ctx.arc(hx, hy + 2, 3, Math.PI, 0);
      ctx.strokeStyle = shade(c, -0.3);
      ctx.lineWidth = 1;
      ctx.stroke();
      roundRect(ctx, hx - 5, hy + 2, 10, 8, 2, c);
      line(ctx, [[hx - 5, hy + 4.5], [hx + 5, hy + 4.5]], shade(c, -0.2), 0.8);
      break;
    case "umbrella":
      line(ctx, [[hx, hy + 3], [hx, -80]], "#6b4a33", 1.2);
      ctx.beginPath();
      ctx.moveTo(hx - 24, -76);
      ctx.quadraticCurveTo(hx, -100, hx + 24, -76);
      for (let i = 0; i < 4; i += 1) {
        const x0 = hx + 24 - i * 12;
        ctx.quadraticCurveTo(x0 - 6, -80, x0 - 12, -76);
      }
      ctx.closePath();
      fillStroke(ctx, c);
      break;
    case "bear":
      ellipse(ctx, hx + 2, hy + 2, 5, 5.5, c === "#f28fb8" ? "#c9965f" : c);
      ellipse(ctx, hx + 2, hy - 5, 4.2, 3.8, c === "#f28fb8" ? "#c9965f" : c);
      ellipse(ctx, hx - 1.2, hy - 8, 1.5, 1.5, c === "#f28fb8" ? "#c9965f" : c);
      ellipse(ctx, hx + 5.2, hy - 8, 1.5, 1.5, c === "#f28fb8" ? "#c9965f" : c);
      ellipse(ctx, hx + 0.8, hy - 5.4, 0.5, 0.5, LINE, false);
      ellipse(ctx, hx + 3.2, hy - 5.4, 0.5, 0.5, LINE, false);
      ellipse(ctx, hx + 2, hy - 3.8, 1.2, 0.9, "#f7f1e3", false);
      break;
    case "phone":
      roundRect(ctx, hx - 2.2, hy - 6, 4.4, 7.5, 1, c);
      roundRect(ctx, hx - 1.5, hy - 5.2, 3, 5.4, 0.5, "#a9d8f2", false);
      break;
    case "wand": {
      line(ctx, [[hx - 1, hy + 3], [hx + 5, hy - 12]], "#f7f1e3", 1.4);
      starPath(ctx, hx + 5.6, hy - 14, 4.2);
      fillStroke(ctx, c === "#f28fb8" ? GOLD : c);
      const tw = (Math.sin(time * 8) + 1) / 2;
      ctx.globalAlpha = tw;
      starPath(ctx, hx + 11, hy - 18, 1.6);
      fillStroke(ctx, "#ffffff", false);
      ctx.globalAlpha = 1;
      break;
    }
    case "fan":
      line(ctx, [[hx, hy + 2], [hx + 2, hy - 5]], "#9b6a47", 1.2);
      ellipse(ctx, hx + 3, hy - 9, 5.2, 4.8, c);
      ellipse(ctx, hx + 3, hy - 9, 2, 2, "#ffffff", false);
      break;
    case "sparkler": {
      line(ctx, [[hx, hy + 1], [hx + 4, hy - 12]], "#6b6b78", 0.9);
      const tipX = hx + 4.3;
      const tipY = hy - 13;
      ellipse(ctx, tipX, tipY, 1.8, 1.8, "#ff9a3c", false);
      ctx.strokeStyle = "#ffd36b";
      ctx.lineWidth = 0.6;
      for (let i = 0; i < 8; i += 1) {
        const ang = (i / 8) * Math.PI * 2 + time * 7;
        const r = 3 + ((time * 13 + i * 1.7) % 4);
        ctx.beginPath();
        ctx.moveTo(tipX + Math.cos(ang) * 2, tipY + Math.sin(ang) * 2);
        ctx.lineTo(tipX + Math.cos(ang) * r, tipY + Math.sin(ang) * r);
        ctx.stroke();
      }
      break;
    }
    case "guitar": {
      ctx.save();
      ctx.translate(hx - 6, hy - 6);
      ctx.rotate(-0.7);
      roundRect(ctx, -1.2, -18, 2.4, 16, 0.6, "#6b4430");
      roundRect(ctx, -2, -21, 4, 4, 1, "#3e2a20");
      ellipse(ctx, 0, 1, 5.2, 4.4, c === "#f28fb8" ? "#e0525c" : c);
      ellipse(ctx, 0, 5.5, 6.2, 5, c === "#f28fb8" ? "#e0525c" : c);
      ellipse(ctx, 0, 2.5, 1.6, 1.6, "#2e2e38", false);
      ctx.restore();
      break;
    }
    case "drink":
      roundRect(ctx, hx - 2.6, hy - 6, 5.2, 8, 1.2, "rgba(255,255,255,0.8)");
      roundRect(ctx, hx - 2.2, hy - 3.5, 4.4, 5, 0.8, c, false);
      line(ctx, [[hx + 0.5, hy - 6], [hx + 2, hy - 10]], "#e0525c", 0.9);
      break;
  }
}

export function handItemIsBehind(a: AvatarConfig): boolean {
  return a.hand === "umbrella" || a.hand === "balloon";
}
