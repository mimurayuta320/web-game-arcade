// Paper-doll avatar renderer: composes face, hair, clothes and items in
// layer order, and animates Pigg-style actions (expressions, arm poses,
// body moves and effects). Local coordinates: feet at (0, 0), up is -y.
import type { AvatarConfig } from "./parts";
import type { ActionId } from "./actions";
import { LINE, ellipse, fillStroke, headScaleX, heartPath, line, starPath, type Ctx, type Direction8, type Facing } from "./draw/common";
import {
  drawBrows, drawCheek, drawEyes, drawHead, drawMark, drawMouth, drawNose,
} from "./draw/face";
import { drawHairBackLayer, drawHairBackView, drawHairFront } from "./draw/hair";
import {
  defaultArms, drawArms, drawBottom, drawBottomOverTorso, drawKigurumiHood, drawLegs, drawTorso,
  type ArmPose,
} from "./draw/body";
import { drawBackItem, drawGlasses, drawHandItem, drawHat, drawNeck, handItemIsBehind } from "./draw/items";
import { drawRide, rideLift } from "./draw/ride";

export { shade } from "./draw/common";

export type AvatarPose = {
  /** front = facing the camera (moving down the screen), back = facing away. */
  facing: Facing;
  /** Mirror horizontally; front+flip faces screen-left. */
  flip: boolean;
  /**
   * Heading on screen. When set it decides facing, mirroring and how far the body and head turn
   * (so walking up-right really faces up-right); `facing`/`flip` are then only a fallback.
   */
  dir?: Direction8;
  /** Walk cycle phase in radians, or null when standing still. */
  walkPhase: number | null;
  action?: ActionId | null;
  /** Seconds since the action started. */
  actionTime?: number;
  /** Wall clock in seconds (blinking, wings, halo). */
  clock?: number;
  /** Per-avatar offset so everyone doesn't blink in sync. */
  seed?: number;
};

type Expression = { eyes?: string; mouth?: string; brows?: string; cheek?: string; browRaise?: number };

const HEAD_PIVOT_Y = -33;
/** Pigg-style big head: the whole head group (hair, hats, glasses) is drawn a bit larger around the neck. */
const HEAD_SCALE = 1.1;
const NECK_Y = -30;
const headY = (y: number) => NECK_Y + (y - NECK_Y) * HEAD_SCALE;

type DirView = {
  facing: Facing;
  flip: boolean;
  /** Sideways shift of the face features (0 = straight at the camera). */
  look: number;
  /** Lean of the whole body toward the heading (negative = toward +x before mirroring). */
  skew: number;
  /** Narrower body when seen from the side. */
  bodyScale: number;
  /** Extra head turn (radians) when walking away diagonally. */
  headTurn: number;
};

/** Unmirrored variants face screen-right; `flip` mirrors them to face screen-left. */
const DIR_VIEW: Record<Direction8, DirView> = {
  "down":       { facing: "front", flip: false, look: 0,   skew: 0,     bodyScale: 1,    headTurn: 0 },
  "down-right": { facing: "front", flip: false, look: 1.8, skew: -0.03, bodyScale: 1,    headTurn: 0 },
  "right":      { facing: "front", flip: false, look: 3.8, skew: -0.07, bodyScale: 0.84, headTurn: 0 },
  "up-right":   { facing: "back",  flip: false, look: 0,   skew: -0.09, bodyScale: 0.92, headTurn: 0.17 },
  "up":         { facing: "back",  flip: false, look: 0,   skew: 0,     bodyScale: 1,    headTurn: 0 },
  "up-left":    { facing: "back",  flip: true,  look: 0,   skew: -0.09, bodyScale: 0.92, headTurn: 0.17 },
  "left":       { facing: "front", flip: true,  look: 3.8, skew: -0.07, bodyScale: 0.84, headTurn: 0 },
  "down-left":  { facing: "front", flip: true,  look: 1.8, skew: -0.03, bodyScale: 1,    headTurn: 0 },
};

function expressionFor(action: ActionId | null | undefined, t: number): Expression {
  switch (action) {
    case "laugh": return { eyes: "smile", mouth: "open" };
    case "cry": return { eyes: "closed", mouth: "frown", brows: "worried" };
    case "angry": return { mouth: "frown", brows: "angry" };
    case "shy": return { eyes: "smile", mouth: "three", cheek: "lines" };
    case "surprise": return { eyes: "shock", mouth: "o", browRaise: 2 };
    case "love": return { eyes: "heart", mouth: "open" };
    case "sweat": return { mouth: "wavy", brows: "worried" };
    case "sleep": return { eyes: "closed", mouth: "neutral" };
    case "clap": return { eyes: "smile", mouth: "open" };
    case "banzai": return { eyes: "smile", mouth: "open" };
    case "peace": return { eyes: "wink", mouth: "grin" };
    case "dance": return { eyes: "smile", mouth: "open" };
    case "bow": return Math.sin((Math.PI * t) / 1.6) > 0.4 ? { eyes: "closed" } : {};
    case "lie": return { eyes: "closed", mouth: "smile" };
    default: return {};
  }
}

function armsFor(action: ActionId | null | undefined, t: number, swing: number): ArmPose {
  switch (action) {
    case "wave":
      return { left: [-10.6, -16], right: [14.5 + Math.sin(t * 14) * 2.2, -39] };
    case "clap": {
      const gap = 1.4 + (0.5 + 0.5 * Math.cos(t * 16)) * 4.5;
      return { left: [-gap, -23], right: [gap, -23] };
    }
    case "shy":
      return { left: [-2.6, -21], right: [2.6, -21] };
    case "banzai":
      return { left: [-13, -45], right: [13, -45] };
    case "peace":
      return { left: [-10.6, -16], right: [12.5, -36] };
    case "dance": {
      const beat = Math.floor(t / 0.4) % 2 === 0;
      return beat ? { left: [-12, -17], right: [13.5, -42] } : { left: [-13.5, -42], right: [12, -17] };
    }
    case "surprise":
      return { left: [-12.5, -30], right: [12.5, -30] };
    case "cry":
      return { left: [-5.5, -36], right: [5.5, -36] };
    case "angry":
      return { left: [-8, -18], right: [8, -18] };
    case "fish":
      return { left: [-5, -22], right: [9, -26] };
    default:
      return defaultArms(swing);
  }
}

/** Highest point of the avatar (for placing chat bubbles), in local units. */
export function avatarTopY(a: AvatarConfig): number {
  const up = a.ride && a.ride !== "none" ? rideLift(a.ride) : 0;
  if (a.hand === "umbrella" || a.hand === "balloon") return -96 - up;
  if (a.hat === "witch") return headY(-94) - up;
  if (a.hand === "flag") return -86 - up;
  if (a.hat === "mushroom" || a.hat === "unicorn") return headY(-86) - up;
  if (a.hat === "silk" || a.hat === "bunnyears") return headY(-86) - up;
  if (a.hair === "mohawk" || a.hat === "halo") return headY(-76) - up;
  return headY(-70) - up;
}

// ------------------------------------------------------------------ effects

function drawEffects(ctx: Ctx, action: ActionId | null | undefined, t: number, clock: number) {
  switch (action) {
    case "cry":
      for (const side of [-1, 1]) {
        for (let k = 0; k < 2; k += 1) {
          const p = ((t * 1.6 + k * 0.5) % 1);
          ctx.globalAlpha = 1 - p;
          ellipse(ctx, side * 7.5, -39 + p * 12, 1.3, 1.9, "#6ec3e8", false);
        }
      }
      ctx.globalAlpha = 1;
      break;
    case "angry": {
      const s = 1 + Math.sin(t * 12) * 0.15;
      ctx.save();
      ctx.translate(15, -60);
      ctx.scale(s, s);
      ctx.strokeStyle = "#e0303c";
      ctx.lineWidth = 1.6;
      for (let i = 0; i < 4; i += 1) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 2);
        ctx.beginPath();
        ctx.arc(3.2, 3.2, 2.2, Math.PI, Math.PI * 1.5);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
      ctx.globalAlpha = 0.14;
      ellipse(ctx, 0, -44, 15, 13, "#e0303c", false);
      ctx.globalAlpha = 1;
      break;
    }
    case "sweat": {
      const p = (t % 1.2) / 1.2;
      ctx.beginPath();
      ctx.moveTo(18, -56 + p * 8);
      ctx.quadraticCurveTo(21, -50 + p * 8, 18, -49 + p * 8);
      ctx.quadraticCurveTo(15, -50 + p * 8, 18, -56 + p * 8);
      fillStroke(ctx, "#8fd3f0");
      break;
    }
    case "surprise": {
      const pop = Math.min(1, t / 0.2);
      ctx.save();
      ctx.translate(0, -80);
      ctx.scale(pop, pop);
      ctx.font = "bold 16px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#ffffff";
      ctx.strokeText("!", 0, 0);
      ctx.fillStyle = "#e0303c";
      ctx.fillText("!", 0, 0);
      ctx.restore();
      break;
    }
    case "sleep":
      ctx.font = "bold 9px system-ui, sans-serif";
      ctx.textAlign = "center";
      for (let k = 0; k < 3; k += 1) {
        const p = ((clock * 0.6 + k / 3) % 1);
        ctx.globalAlpha = 1 - p;
        ctx.fillStyle = "#4f8fe0";
        ctx.font = `bold ${7 + p * 6}px system-ui, sans-serif`;
        ctx.fillText("Z", 12 + p * 8, -60 - p * 18);
      }
      ctx.globalAlpha = 1;
      break;
    case "dance":
      for (let k = 0; k < 2; k += 1) {
        const p = ((t * 0.9 + k * 0.5) % 1);
        const x = (k === 0 ? -16 : 16) + Math.sin(p * 8) * 2;
        const y = -58 - p * 20;
        ctx.globalAlpha = 1 - p;
        ellipse(ctx, x, y, 2.2, 1.7, "#9a6bd8", false, -0.3);
        line(ctx, [[x + 2, y - 0.5], [x + 2, y - 8], [x + 5, y - 6.5]], "#9a6bd8", 1);
      }
      ctx.globalAlpha = 1;
      break;
    case "love":
    case "heart":
      for (let k = 0; k < 3; k += 1) {
        const p = (t / 1.4 - k * 0.18);
        if (p < 0 || p > 1) continue;
        ctx.globalAlpha = 1 - p;
        heartPath(ctx, (k - 1) * 10 + Math.sin(p * 9) * 3, -64 - p * 26, 1.3);
        fillStroke(ctx, "#f0587d", false);
      }
      ctx.globalAlpha = 1;
      break;
    case "clap":
    case "banzai":
      for (let k = 0; k < 4; k += 1) {
        const ang = t * 3 + (k * Math.PI) / 2;
        const tw = (Math.sin(t * 10 + k) + 1) / 2;
        ctx.globalAlpha = tw;
        starPath(ctx, Math.cos(ang) * 18, -40 + Math.sin(ang) * 14, 2.2, 4, 0.35);
        fillStroke(ctx, "#f5cf47", false);
      }
      ctx.globalAlpha = 1;
      break;
  }
}

/** Rod held out toward the water, line and a bobbing float. */
function drawFishingRod(ctx: Ctx, hand: [number, number], clock: number) {
  const [hx, hy] = hand;
  const tip: [number, number] = [hx + 24, hy - 40];
  line(ctx, [[hx - 3, hy + 4], tip], "#8a5a35", 1.6);
  const bob = Math.sin(clock * 3) * 1.5;
  const float: [number, number] = [hx + 34, hy - 6 + bob];
  ctx.beginPath();
  ctx.moveTo(tip[0], tip[1]);
  ctx.quadraticCurveTo(tip[0] + 8, tip[1] + 14, float[0], float[1]);
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 0.6;
  ctx.stroke();
  ellipse(ctx, float[0], float[1], 2.2, 2.2, "#ffffff");
  ctx.beginPath();
  ctx.arc(float[0], float[1], 2.2, Math.PI, 0);
  ctx.fillStyle = "#e0303c";
  ctx.fill();
}

function drawPeaceFingers(ctx: Ctx, hand: [number, number]) {
  const [hx, hy] = hand;
  for (const dx of [-1.2, 1.2]) {
    ctx.beginPath();
    ctx.moveTo(hx + dx * 0.4, hy - 1);
    ctx.lineTo(hx + dx * 1.6, hy - 6);
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.stroke();
  }
}

// -------------------------------------------------------------------- entry

export function drawAvatar(ctx: Ctx, a: AvatarConfig, pose: AvatarPose) {
  const action = pose.action ?? null;
  const t = pose.actionTime ?? 0;
  const clock = pose.clock ?? 0;
  const walking = pose.walkPhase !== null;
  const swing = walking ? Math.sin(pose.walkPhase as number) : 0;
  const sitting = action === "sit";
  const ride = a.ride && a.ride !== "none" && !sitting && action !== "lie" ? a.ride : "";
  // On a ride the legs stay still and the wheels turn instead.
  const lift: [number, number] = walking && !ride ? [Math.max(0, swing) * 2, Math.max(0, -swing) * 2] : [0, 0];

  const view = pose.dir ? DIR_VIEW[pose.dir] : null;
  let facing = view ? view.facing : pose.facing;
  let flip = view ? view.flip : pose.flip;
  if (action === "spin") {
    const k = Math.floor(t / 0.15) % 4;
    facing = k === 1 || k === 2 ? "back" : "front";
    flip = k >= 2;
  } else if (action === "dance") {
    flip = Math.floor(t / 0.8) % 2 === 1;
    facing = "front";
  } else if (action === "lie") {
    facing = "front";
    flip = false;
  } else if (action === "sleep" || sitting || action === "bow") {
    facing = "front";
  }
  const front = facing === "front";
  // Actions that pick their own facing (spin, dance, sitting...) switch the heading cues off.
  const heading = view && facing === view.facing && flip === view.flip ? view : null;

  // Vertical offset (bob, hops) and rotation for acrobatics.
  let dy = walking ? -Math.abs(Math.sin(pose.walkPhase as number)) * 1.2 : 0;
  let rot = 0;
  let dx = 0;
  if (sitting) dy = 5;
  if (action === "jump") dy = -Math.sin((Math.PI * Math.min(t, 0.52)) / 0.52) * 20;
  if (action === "surprise" && t < 0.3) dy = -Math.sin((Math.PI * t) / 0.3) * 7;
  if (action === "banzai") dy = -Math.abs(Math.sin((t * Math.PI) / 0.4)) * 5;
  if (action === "dance") dy = -Math.abs(Math.sin((t * Math.PI) / 0.4)) * 3;
  if (action === "laugh") dx = Math.sin(t * 28) * 0.7;
  if (action === "backflip") {
    const p = Math.min(1, t / 0.9);
    dy = -Math.sin(Math.PI * p) * 28;
    rot = -Math.PI * 2 * (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
  }
  const bowDip = action === "bow" ? Math.sin((Math.PI * Math.min(t, 1.6)) / 1.6) * 5 : 0;

  // Expression overrides and idle blinking.
  const expr = expressionFor(action, t);
  const blink = !expr.eyes && ((clock + (pose.seed ?? 1.7)) % 4.2) < 0.13;
  const eyes = expr.eyes ?? (blink ? "closed" : a.eyes);
  const face: AvatarConfig = {
    ...a,
    brows: expr.brows ? (a.brows === "none" ? "none" : expr.brows) : a.brows,
    cheek: expr.cheek ?? a.cheek,
  };
  const mouth = expr.mouth ?? a.mouth;
  const look = heading && front ? heading.look : front ? 1.8 : 0;
  const arms = armsFor(action, t, swing);
  const sx = headScaleX(a.face);

  ctx.save();
  if (flip) ctx.scale(-1, 1);
  if (heading && action !== "lie") ctx.transform(heading.bodyScale, 0, heading.skew, 1, 0, 0);
  if (ride) {
    drawRide(ctx, ride, walking ? (pose.walkPhase as number) : 0, clock);
    ctx.translate(0, -rideLift(ride));
  }
  if (action === "lie") {
    // Lie along the iso y axis (like a bed), head toward the back-right,
    // with the middle of the body on the anchor point.
    ctx.translate(0, -8);
    ctx.rotate(Math.PI / 2 - Math.atan2(16, 32));
    ctx.translate(0, 33);
  }
  ctx.translate(dx, dy);
  if (rot) {
    ctx.translate(0, HEAD_PIVOT_Y);
    ctx.rotate(rot);
    ctx.translate(0, -HEAD_PIVOT_Y);
  }

  const headGroup = (paint: () => void) => {
    ctx.save();
    ctx.translate(0, bowDip + NECK_Y);
    ctx.scale(HEAD_SCALE, HEAD_SCALE);
    ctx.translate(0, -NECK_Y);
    paint();
    ctx.restore();
  };
  const scaledHead = (paint: () => void) => {
    ctx.save();
    ctx.scale(sx, 1);
    paint();
    ctx.restore();
  };

  if (front) {
    drawBackItem(ctx, a, "front", "under", clock);
    headGroup(() => scaledHead(() => drawHairBackLayer(ctx, a)));
    drawLegs(ctx, a, lift, sitting);
    drawBottom(ctx, a, sitting);
    drawTorso(ctx, a, "front", sitting);
    drawBottomOverTorso(ctx, a, "front");
    drawNeck(ctx, a, "front");
    drawBackItem(ctx, a, "front", "over", clock);
    if (handItemIsBehind(a)) drawHandItem(ctx, a, arms.right, clock);
    drawArms(ctx, a, arms);
    if (!handItemIsBehind(a)) drawHandItem(ctx, a, arms.right, clock);
    if (action === "peace") drawPeaceFingers(ctx, arms.right);
    headGroup(() => {
      drawHead(ctx, a);
      drawCheek(ctx, look, face.cheek);
      drawEyes(ctx, a, look, eyes);
      drawNose(ctx, a, look);
      drawMouth(ctx, look, mouth);
      drawMark(ctx, a, look);
      scaledHead(() => drawHairFront(ctx, a));
      drawBrows(ctx, face, look, expr.browRaise ?? 0);
      drawGlasses(ctx, a, look);
      scaledHead(() => {
        drawKigurumiHood(ctx, a, "front");
        drawHat(ctx, a, "front", look, clock);
      });
    });
  } else {
    drawLegs(ctx, a, lift, sitting);
    drawBottom(ctx, a, sitting);
    drawTorso(ctx, a, "back", sitting);
    drawBottomOverTorso(ctx, a, "back");
    drawNeck(ctx, a, "back");
    drawArms(ctx, a, arms);
    drawHandItem(ctx, a, arms.right, clock);
    drawBackItem(ctx, a, "back", "under", clock);
    drawBackItem(ctx, a, "back", "over", clock);
    headGroup(() => {
      // Walking away diagonally: turn the head toward the heading (the back of the head only, no face).
      if (heading && heading.headTurn) {
        ctx.translate(0, HEAD_PIVOT_Y);
        ctx.rotate(heading.headTurn);
        ctx.translate(heading.headTurn * 12, -HEAD_PIVOT_Y);
      }
      drawHead(ctx, a);
      scaledHead(() => {
        drawHairBackView(ctx, a);
        drawKigurumiHood(ctx, a, "back");
        drawHat(ctx, a, "back", 0, clock);
      });
    });
  }
  if (action === "fish") drawFishingRod(ctx, arms.right, clock);
  ctx.restore();

  // Effects are drawn unmirrored so text and marks stay readable.
  ctx.save();
  if (action !== "lie") ctx.translate(0, Math.min(0, dy));
  drawEffects(ctx, action, t, clock);
  ctx.restore();
}
