// Companion pets, drawn procedurally like the avatars. Local coordinates: feet at (0, 0), up is -y,
// about 24 units tall (an avatar is ~70). `flip` mirrors to face screen-left; drawn facing right.
import { ellipse, fillStroke, line, poly, shade, type Ctx } from "./common";

export type PetLook = {
  species: string;
  /** Walk cycle phase (radians) or null when standing. */
  walkPhase: number | null;
  clock: number;
  /** 0-4 friendship: happier faces and a little heart at the top level. */
  level: number;
};

type Palette = { body: string; belly: string; accent: string; nose: string };

const PALETTE: Record<string, Palette> = {
  dog: { body: "#d9a066", belly: "#f4dcc0", accent: "#a56a3a", nose: "#2e2e38" },
  cat: { body: "#f0a04b", belly: "#fbe2c2", accent: "#c97a2a", nose: "#e88fa0" },
  rabbit: { body: "#f4f0ea", belly: "#ffffff", accent: "#f2b6c4", nose: "#e88fa0" },
  chick: { body: "#ffe066", belly: "#fff2a8", accent: "#f08a3c", nose: "#f08a3c" },
  penguin: { body: "#2e3448", belly: "#ffffff", accent: "#f08a3c", nose: "#f08a3c" },
  panda: { body: "#ffffff", belly: "#ffffff", accent: "#2e2e38", nose: "#2e2e38" },
  hamster: { body: "#e8b880", belly: "#fff3e0", accent: "#c98f52", nose: "#e88fa0" },
  frog: { body: "#7fcf5a", belly: "#e8f7b8", accent: "#4f9f3a", nose: "#3f8f2f" },
  bear: { body: "#9b6a47", belly: "#d9b48a", accent: "#6f4a30", nose: "#2e2e38" },
  fox: { body: "#f08a3c", belly: "#ffffff", accent: "#ffffff", nose: "#2e2e38" },
  owl: { body: "#a9805a", belly: "#f0dcc0", accent: "#6f4a30", nose: "#f5b640" },
};

function eye(ctx: Ctx, x: number, y: number, happy: boolean) {
  if (happy) {
    ctx.beginPath();
    ctx.arc(x, y + 0.6, 1.5, Math.PI * 1.1, Math.PI * 1.9);
    ctx.strokeStyle = "#2e2e38";
    ctx.lineWidth = 1;
    ctx.stroke();
  } else {
    ellipse(ctx, x, y, 1.15, 1.4, "#2e2e38", false);
    ellipse(ctx, x + 0.4, y - 0.5, 0.4, 0.4, "#ffffff", false);
  }
}

export function drawPet(ctx: Ctx, look: PetLook) {
  const pal = PALETTE[look.species] ?? PALETTE.dog;
  const walking = look.walkPhase !== null;
  const swing = walking ? Math.sin((look.walkPhase ?? 0) * 1.3) : 0;
  const bob = walking ? -Math.abs(swing) * 1.4 : Math.sin(look.clock * 2) * 0.35;
  const happy = look.level >= 2;

  ctx.save();
  ctx.translate(0, bob);

  // Feet (little hops), body, head.
  const feet = (color: string) => {
    ellipse(ctx, -4 + Math.max(0, swing) * 1.6, -1.4, 2.6, 1.8, color);
    ellipse(ctx, 4 + Math.max(0, -swing) * 1.6, -1.4, 2.6, 1.8, color);
  };

  switch (look.species) {
    case "chick": {
      feet(pal.accent);
      ellipse(ctx, 0, -9, 8.4, 8, pal.body);
      ellipse(ctx, -6.4, -8, 2.6, 4, shade(pal.body, -0.08), true, 0.4);
      poly(ctx, [[5.4, -10.4], [9.4, -9.2], [5.4, -8]], pal.accent);
      eye(ctx, 2.6, -11.4, happy);
      ellipse(ctx, 0, -17.2, 1.8, 2.4, pal.body, true, 0.2);
      break;
    }
    case "hamster": {
      feet(pal.accent);
      ellipse(ctx, 0, -9, 9.2, 8.2, pal.body);
      ellipse(ctx, 1.4, -7.4, 5.6, 5, pal.belly, false);
      ellipse(ctx, -4.6, -16.4, 2.4, 2.4, pal.accent);
      ellipse(ctx, 5.4, -16.6, 2.4, 2.4, pal.accent);
      ellipse(ctx, 1, -12.6, 7.6, 6.2, pal.body, false);
      eye(ctx, -0.6, -12.6, happy);
      eye(ctx, 4.6, -12.6, happy);
      ellipse(ctx, 2.6, -10.6, 1.6, 1.1, pal.nose, false);
      ellipse(ctx, -1.6, -10.4, 2, 1.6, "rgba(255,150,150,0.5)", false);
      break;
    }
    case "frog": {
      feet(pal.accent);
      ellipse(ctx, 0, -7.6, 9.4, 6.4, pal.body);
      ellipse(ctx, 1.4, -5.6, 6, 3.6, pal.belly, false);
      ellipse(ctx, -3.2, -14.4, 3.6, 3.6, pal.body);
      ellipse(ctx, 4.6, -14.4, 3.6, 3.6, pal.body);
      eye(ctx, -3.2, -14.8, happy);
      eye(ctx, 4.6, -14.8, happy);
      ctx.beginPath();
      ctx.arc(1.4, -9.2, 3.6, 0.2, Math.PI - 0.2);
      ctx.strokeStyle = pal.nose;
      ctx.lineWidth = 1;
      ctx.stroke();
      break;
    }
    case "owl": {
      feet(pal.nose);
      ellipse(ctx, 0, -10.4, 8.8, 10.6, pal.body);
      ellipse(ctx, 1, -8, 5.8, 6.6, pal.belly, false);
      for (const dy of [-6, -3.4, -8.6]) line(ctx, [[-1, dy], [3.4, dy + 0.6]], "rgba(120,80,50,0.45)", 0.7);
      poly(ctx, [[-4.6, -18], [-6.2, -23.6], [-1, -19.4]], pal.accent);
      poly(ctx, [[3.4, -19.4], [8, -23.6], [7.6, -17.6]], pal.accent);
      ellipse(ctx, -0.8, -15.4, 3.6, 3.6, "#ffffff", false);
      ellipse(ctx, 5, -15.4, 3.6, 3.6, "#ffffff", false);
      eye(ctx, -0.6, -15.4, happy);
      eye(ctx, 4.8, -15.4, happy);
      poly(ctx, [[1.4, -14.4], [3.4, -14.4], [2.4, -11.8]], pal.nose);
      break;
    }
    case "penguin": {
      feet(pal.accent);
      ellipse(ctx, 0, -10.4, 7.8, 10.2, pal.body);
      ellipse(ctx, 1.4, -9.6, 5, 7.6, pal.belly, false);
      ellipse(ctx, -6.8, -9.6, 2.2, 5, pal.body, true, 0.25);
      poly(ctx, [[3.6, -15.2], [8.2, -14], [3.6, -12.8]], pal.accent);
      eye(ctx, 2.4, -16.4, happy);
      break;
    }
    case "panda": {
      ellipse(ctx, -4.2, -3.8, 2.8, 3.4, pal.accent);
      ellipse(ctx, 4.2, -3.8, 2.8, 3.4, pal.accent);
      ellipse(ctx, 0, -8.6, 8.2, 6.2, pal.body);
      ellipse(ctx, -5.6, -8.6, 2.2, 3.6, pal.accent, false);
      ellipse(ctx, 5.6, -8.6, 2.2, 3.6, pal.accent, false);
      ellipse(ctx, 1, -16, 7.6, 6.6, pal.body);
      ellipse(ctx, -4.8, -21, 2.4, 2.4, pal.accent);
      ellipse(ctx, 6.4, -21, 2.4, 2.4, pal.accent);
      ellipse(ctx, -1.2, -16.6, 2.2, 2.6, pal.accent, false, 0.3);
      ellipse(ctx, 5, -16.6, 2.2, 2.6, pal.accent, false, -0.3);
      eye(ctx, -1.4, -16.8, happy);
      eye(ctx, 4.8, -16.8, happy);
      ellipse(ctx, 1.9, -14, 1, 0.7, pal.nose, false);
      break;
    }
    default: {
      // dog / cat / rabbit share a round body and head; ears and tail make the animal.
      const tailWag = Math.sin(look.clock * (look.species === "dog" ? 9 : 2.4)) * 3;
      if (look.species === "fox") {
        ellipse(ctx, -10.4, -9 + tailWag * 0.3, 5.2, 3.2, pal.body, true, -0.5 + tailWag * 0.05);
        ellipse(ctx, -13.4, -10.6 + tailWag * 0.3, 2.2, 1.6, pal.accent, false, -0.5);
      } else if (look.species === "bear") {
        ellipse(ctx, -7.6, -6.4, 2.4, 2.4, pal.accent);
      } else if (look.species === "cat") {
        line(ctx, [[-7, -7], [-11, -11 + tailWag * 0.2], [-10, -16], [-7, -17]], pal.accent, 2.2);
      } else if (look.species === "rabbit") {
        ellipse(ctx, -7.6, -6.4, 2.6, 2.6, pal.belly);
      } else {
        line(ctx, [[-7, -7], [-11.4, -10 + tailWag * 0.4]], pal.accent, 2.4);
      }
      feet(pal.body);
      ellipse(ctx, 0, -8, 8.2, 6.4, pal.body);
      ellipse(ctx, 2, -6.6, 4.8, 3.6, pal.belly, false);

      // Ears (behind the head).
      if (look.species === "rabbit") {
        ellipse(ctx, -1.6, -25, 2.2, 6.4, pal.body, true, -0.12);
        ellipse(ctx, 3.6, -25, 2.2, 6.4, pal.body, true, 0.12);
        ellipse(ctx, -1.6, -25, 1, 4.4, pal.accent, false, -0.12);
        ellipse(ctx, 3.6, -25, 1, 4.4, pal.accent, false, 0.12);
      } else if (look.species === "cat" || look.species === "fox") {
        poly(ctx, [[-4, -18.6], [-3, -25.6], [0.6, -19.6]], pal.body);
        poly(ctx, [[2.6, -19.6], [6.2, -25.6], [7.2, -18.4]], pal.body);
        if (look.species === "fox") {
          poly(ctx, [[-3.4, -19.2], [-3, -23.2], [-0.4, -19.8]], "#3a2a2a");
          poly(ctx, [[3.2, -19.8], [6, -23.2], [6.6, -19]], "#3a2a2a");
        }
      } else if (look.species === "bear") {
        ellipse(ctx, -3.4, -20, 2.6, 2.6, pal.accent);
        ellipse(ctx, 6.4, -20, 2.6, 2.6, pal.accent);
      } else {
        ellipse(ctx, -3.8, -19, 2.4, 4.2, pal.accent, true, 0.4);
        ellipse(ctx, 7, -19, 2.4, 4.2, pal.accent, true, -0.4);
      }

      ellipse(ctx, 1.4, -15.4, 7.4, 6.6, pal.body);
      if (look.species === "dog" || look.species === "bear") ellipse(ctx, 5.4, -13.4, 3.4, 2.6, pal.belly, false);
      if (look.species === "fox") {
        poly(ctx, [[3, -12.4], [9.4, -13.6], [6.4, -10.2]], pal.belly);
      }
      eye(ctx, -0.4, -16.4, happy);
      eye(ctx, 5, -16.4, happy);
      ellipse(ctx, 6.6, -14.4, 1, 0.8, pal.nose, false);
      if (look.species === "cat") {
        line(ctx, [[5, -13.6], [9.6, -13.8]], "rgba(58,38,38,0.6)", 0.5);
        line(ctx, [[5, -12.8], [9.4, -12.2]], "rgba(58,38,38,0.6)", 0.5);
      }
      if (look.species === "rabbit") ellipse(ctx, 3.4, -13.4, 1.6, 1, "rgba(255,140,150,0.55)", false);
    }
  }

  // Full friendship: a little heart floating up.
  if (look.level >= 4) {
    const p = (look.clock * 0.6) % 1;
    ctx.globalAlpha = 1 - p;
    ctx.beginPath();
    const hx = -8;
    const hy = -30 - p * 8;
    ctx.moveTo(hx, hy + 2);
    ctx.bezierCurveTo(hx - 4, hy - 1, hx - 2, hy - 4, hx, hy - 2);
    ctx.bezierCurveTo(hx + 2, hy - 4, hx + 4, hy - 1, hx, hy + 2);
    fillStroke(ctx, "#f2648c", false);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
