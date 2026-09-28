// のりもの drawn under the avatar. Local coordinates: feet at (0, 0), up is -y.
import { ellipse, line, roundRect, shade, starPath, fillStroke, type Ctx } from "./common";

/** How far the rider stands above the ground, per ride. */
export function rideLift(ride: string): number {
  switch (ride) {
    case "kick": return 3;
    case "bike": return 7;
    case "goldscooter": return 5;
    case "carpet": return 9;
    default: return 0;
  }
}

function wheel(ctx: Ctx, x: number, y: number, r: number, spin: number, rim = "#2e2e38") {
  ellipse(ctx, x, y, r, r, rim);
  ellipse(ctx, x, y, r * 0.55, r * 0.55, "#cfd3dc", false);
  line(ctx, [[x - Math.cos(spin) * r * 0.5, y - Math.sin(spin) * r * 0.5], [x + Math.cos(spin) * r * 0.5, y + Math.sin(spin) * r * 0.5]], "#6b6b78", 0.8);
}

/** Drawn before the body. `roll` is the walk phase (wheels spin, carpet waves). */
export function drawRide(ctx: Ctx, ride: string, roll: number, time: number) {
  switch (ride) {
    case "kick":
      line(ctx, [[10, -3], [8, -34]], "#9aa0aa", 1.8);
      line(ctx, [[4, -34], [12, -34]], "#2e2e38", 2.2);
      roundRect(ctx, -12, -4, 24, 3, 1.5, "#4f8fe0");
      wheel(ctx, -9, 0, 2.6, roll);
      wheel(ctx, 10, 0, 2.6, roll);
      return;
    case "bike":
      wheel(ctx, -14, -2, 7, roll);
      wheel(ctx, 14, -2, 7, roll);
      line(ctx, [[-14, -2], [-3, -8], [9, -9], [14, -2]], "#e0525c", 1.8);
      line(ctx, [[-3, -8], [-5, -13]], "#e0525c", 1.8);
      line(ctx, [[9, -9], [12, -22]], "#9aa0aa", 1.6);
      line(ctx, [[9, -22], [15, -22]], "#2e2e38", 2);
      roundRect(ctx, -8, -15, 7, 2.4, 1.2, "#2e2e38");
      return;
    case "goldscooter": {
      const gold = "#e3b53c";
      line(ctx, [[11, -4], [9, -36]], shade(gold, -0.2), 2.2);
      line(ctx, [[4, -36], [14, -36]], "#2e2e38", 2.4);
      ctx.beginPath();
      ctx.moveTo(-14, -6);
      ctx.quadraticCurveTo(-16, 0, -8, 0);
      ctx.lineTo(12, 0);
      ctx.quadraticCurveTo(15, -3, 12, -6);
      ctx.closePath();
      fillStroke(ctx, gold);
      wheel(ctx, -10, 1, 3.2, roll, "#6b4a1a");
      wheel(ctx, 11, 1, 3.2, roll, "#6b4a1a");
      ctx.globalAlpha = 0.5 + Math.sin(time * 6) * 0.4;
      starPath(ctx, -3, -3, 2.2);
      fillStroke(ctx, "#ffffff", false);
      ctx.globalAlpha = 1;
      return;
    }
    case "carpet": {
      const wave = (x: number) => Math.sin(time * 5 + x * 0.25) * 1.6;
      ellipse(ctx, 0, 10, 16, 3.2, "rgba(0,0,0,0.12)", false);
      ctx.beginPath();
      ctx.moveTo(-18, wave(-18));
      for (let x = -18; x <= 18; x += 4) ctx.lineTo(x, wave(x));
      for (let x = 18; x >= -18; x -= 4) ctx.lineTo(x, wave(x) + 5);
      ctx.closePath();
      fillStroke(ctx, "#b8323f");
      ctx.beginPath();
      for (let x = -16; x <= 16; x += 4) ctx.lineTo(x, wave(x) + 2.5);
      ctx.strokeStyle = "#f5cf47";
      ctx.lineWidth = 1;
      ctx.stroke();
      for (const x of [-19, 19]) line(ctx, [[x, wave(x) + 1], [x + (x < 0 ? -2 : 2), wave(x) + 5]], "#f5cf47", 0.9);
      return;
    }
    default:
  }
}
