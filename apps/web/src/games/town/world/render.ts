// Canvas renderer for a town area: floor, walls, objects, avatars, bubbles.
import { avatarTopY, drawAvatar, type AvatarPose } from "../avatar/drawAvatar";
import type { AvatarConfig } from "../avatar/parts";
import { starPath } from "../avatar/draw/common";
import { TILE_H, TILE_W, toScreen, type AreaDef, type FloorKind, type TownObject } from "./areas";
import { WALL_STYLES } from "./furniture";
import { circle, diamond, footprintPath, shade, shadow, type Ctx, type Pt } from "./drawUtil";
import { drawFlatObject, drawObject } from "./objects";

export type RenderAvatar = {
  id: string;
  name: string;
  avatar: AvatarConfig;
  x: number;
  y: number;
  pose: AvatarPose;
  isSelf: boolean;
  bubble: { text: string; until: number } | null;
  /** performance.now() of the last グッピグ received, for the sparkle burst. */
  praisedAt: number;
};

/** Furniture preview while editing a room. */
export type PlacementGhost = { object: TownObject; valid: boolean };

export const AVATAR_SCALE = 1.25;
const WALL_H = 86;

const FLOOR_COLORS: Record<FloorKind, [string, string]> = {
  grass: ["#8fd16a", "#86c962"],
  lawn: ["#9ad873", "#90cf69"],
  stone: ["#e2dccf", "#d8d1c2"],
  wood: ["#c99a66", "#c0905c"],
  rug: ["#c9575f", "#c14f58"],
  sand: ["#f3e0b0", "#eed9a3"],
  shore: ["#cfe9e0", "#c3e3d8"],
  water: ["#5fb8e6", "#57b0df"],
  gravel: ["#efebe3", "#e9e4da"],
  flagstone: ["#c7bba6", "#bfb39d"],
  asphalt: ["#6b6f7a", "#666a75"],
  crosswalk: ["#6b6f7a", "#666a75"],
  sidewalk: ["#d9d4e6", "#cfc9de"],
  tatami: ["#cfd68f", "#c7cf86"],
  checker: ["#f7f4ee", "#3e4552"],
  carpetPink: ["#f2a9c4", "#efa2be"],
  carpetBlue: ["#8fb5e8", "#88aee2"],
  marble: ["#f1eee9", "#e6e2dc"],
};

// ------------------------------------------------------------------ floor/walls

function drawFloor(ctx: Ctx, area: AreaDef, time: number) {
  for (let y = 0; y < area.height; y += 1) {
    for (let x = 0; x < area.width; x += 1) {
      const kind = area.floor(x, y);
      const [sx, sy] = toScreen(x, y);
      let color = FLOOR_COLORS[kind][(x + y) % 2];
      if (kind === "water") color = shade(color, Math.sin(time * 1.6 + x * 0.8 + y * 0.5) * 0.06);
      diamond(ctx, sx, sy);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.06)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.lineWidth = 1;
      switch (kind) {
        case "wood":
          ctx.strokeStyle = "rgba(90,55,30,0.18)";
          ctx.beginPath();
          ctx.moveTo(sx - 16, sy - 8);
          ctx.lineTo(sx + 16, sy + 8);
          ctx.stroke();
          break;
        case "tatami":
          ctx.strokeStyle = "rgba(60,70,20,0.35)";
          ctx.lineWidth = 2;
          diamond(ctx, sx, sy, 1);
          ctx.stroke();
          break;
        case "gravel":
          for (let i = 0; i < 4; i += 1) circle(ctx, sx + ((x * 7 + i * 11) % 30) - 15, sy + ((y * 5 + i * 7) % 12) - 6, 1.2, "rgba(0,0,0,0.12)", "");
          break;
        case "crosswalk":
          ctx.save();
          diamond(ctx, sx, sy);
          ctx.clip();
          ctx.strokeStyle = "rgba(255,255,255,0.9)";
          ctx.lineWidth = 5;
          for (let i = -3; i <= 3; i += 1) {
            ctx.beginPath();
            ctx.moveTo(sx + i * 10 - 20, sy - 10 - i * 5);
            ctx.lineTo(sx + i * 10 + 20, sy + 10 - i * 5);
            ctx.stroke();
          }
          ctx.restore();
          break;
        case "marble":
          ctx.strokeStyle = "rgba(150,140,130,0.25)";
          ctx.beginPath();
          ctx.moveTo(sx - 10, sy - 2);
          ctx.quadraticCurveTo(sx, sy + 4, sx + 12, sy - 3);
          ctx.stroke();
          break;
        case "water":
          if ((x * 7 + y * 3) % 5 === 0) {
            ctx.strokeStyle = "rgba(255,255,255,0.55)";
            ctx.beginPath();
            const off = Math.sin(time * 2 + x) * 4;
            ctx.moveTo(sx - 10 + off, sy);
            ctx.quadraticCurveTo(sx - 4 + off, sy - 3, sx + 2 + off, sy);
            ctx.stroke();
          }
          break;
      }
    }
  }

  for (const o of area.objects) if (o.flat) drawFlatObject(ctx, o);

  for (const portal of area.portals) {
    const [sx, sy] = toScreen(portal.x, portal.y);
    const pulse = 0.35 + Math.sin(time * 3) * 0.15;
    diamond(ctx, sx, sy, 3);
    ctx.fillStyle = `rgba(255, 226, 92, ${pulse})`;
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 190, 40, 0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawWalls(ctx: Ctx, area: AreaDef) {
  if (!area.indoor) return;
  const style = WALL_STYLES.find((w) => w.id === area.wallStyle) ?? WALL_STYLES[0];
  const quad = (a: Pt, b: Pt, fill: string, top = WALL_H, bottom = 0) => {
    ctx.beginPath();
    ctx.moveTo(a[0], a[1] - bottom);
    ctx.lineTo(b[0], b[1] - bottom);
    ctx.lineTo(b[0], b[1] - top);
    ctx.lineTo(a[0], a[1] - top);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };
  const decorate = (a: Pt, b: Pt, index: number) => {
    const lerp = (t: number, h: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - h];
    ctx.save();
    switch (style.pattern) {
      case "stripe":
        ctx.globalAlpha = 0.28;
        quad(lerp(0.35, 0), lerp(0.65, 0), style.accent, WALL_H, 24);
        break;
      case "dots":
        ctx.globalAlpha = 0.45;
        for (const [t, h] of [[0.25, 36], [0.75, 52], [0.5, 70]]) {
          const p = lerp(t, h);
          circle(ctx, p[0], p[1], 2.4, style.accent, "");
        }
        break;
      case "brick":
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 1;
        for (let h = 32; h < WALL_H; h += 9) {
          const p = lerp(0, h);
          const q = lerp(1, h);
          ctx.beginPath();
          ctx.moveTo(p[0], p[1]);
          ctx.lineTo(q[0], q[1]);
          ctx.stroke();
          const m = lerp((((h - 32) / 9) % 2) * 0.5 + 0.25, h);
          ctx.beginPath();
          ctx.moveTo(m[0], m[1]);
          ctx.lineTo(m[0], m[1] - 9);
          ctx.stroke();
        }
        break;
      case "wood":
        ctx.strokeStyle = "rgba(90,55,30,0.35)";
        ctx.lineWidth = 1;
        for (let h = 34; h < WALL_H; h += 12) {
          const p = lerp(0, h);
          const q = lerp(1, h);
          ctx.beginPath();
          ctx.moveTo(p[0], p[1]);
          ctx.lineTo(q[0], q[1]);
          ctx.stroke();
        }
        break;
      case "stars":
        for (const [t, h] of [[0.2, 40 + (index % 3) * 12], [0.7, 62 - (index % 2) * 14]]) {
          const p = lerp(t, h);
          starPath(ctx, p[0], p[1], 2.6);
          ctx.fillStyle = "#f5e27a";
          ctx.fill();
        }
        break;
    }
    ctx.restore();
  };

  // Left wall runs along x = -0.5, right wall along y = -0.5.
  for (let y = 0; y < area.height; y += 1) {
    const a = toScreen(-0.5, y + 0.5);
    const b = toScreen(-0.5, y - 0.5);
    quad(a, b, style.base);
    decorate(a, b, y);
    quad(a, b, style.accent, 24);
    if (y % 4 === 2) quad(a, b, style.pattern === "stars" ? "#1b2248" : "#a9d8f2", 70, 40);
  }
  for (let x = 0; x < area.width; x += 1) {
    const a = toScreen(x - 0.5, -0.5);
    const b = toScreen(x + 0.5, -0.5);
    quad(a, b, shade(style.base, -0.06));
    decorate(a, b, x + 7);
    quad(a, b, shade(style.accent, -0.1), 24);
    if (x % 4 === 1) quad(a, b, style.pattern === "stars" ? "#1b2248" : "#a9d8f2", 70, 40);
  }
  const corner = toScreen(-0.5, -0.5);
  ctx.strokeStyle = "rgba(60,40,30,0.4)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(corner[0], corner[1]);
  ctx.lineTo(corner[0], corner[1] - WALL_H);
  ctx.stroke();
}

// --------------------------------------------------------------------- avatars

function wrapText(ctx: Ctx, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxWidth && line) {
      lines.push(line);
      line = ch;
    } else {
      line += ch;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

function drawBubble(ctx: Ctx, x: number, y: number, text: string, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = "bold 12px system-ui, sans-serif";
  const lines = wrapText(ctx, text, 150);
  const width = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 18;
  const height = lines.length * 15 + 10;
  const bx = x - width / 2;
  const by = y - height - 8;
  ctx.beginPath();
  ctx.roundRect(bx, by, width, height, 10);
  ctx.moveTo(x - 6, by + height);
  ctx.lineTo(x, by + height + 8);
  ctx.lineTo(x + 6, by + height);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "rgba(60,40,40,0.35)";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = "#3a2c2c";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  lines.forEach((l, i) => ctx.fillText(l, x, by + 6 + i * 15));
  ctx.restore();
}

function drawAvatarSprite(ctx: Ctx, a: RenderAvatar) {
  const [sx, sy] = toScreen(a.x, a.y);
  shadow(ctx, sx, sy + 1, 18, 8);
  ctx.save();
  ctx.translate(sx, sy + 2);
  ctx.scale(AVATAR_SCALE, AVATAR_SCALE);
  drawAvatar(ctx, a.avatar, a.pose);
  ctx.restore();
}

function toView(camera: Camera, gx: number, gy: number): Pt {
  const [wx, wy] = toScreen(gx, gy);
  return [camera.offsetX + wx * camera.zoom, camera.offsetY + wy * camera.zoom];
}

/** Name tag, praise burst and chat bubble, in screen pixels so text stays readable at any zoom. */
function drawAvatarOverlay(ctx: Ctx, a: RenderAvatar, camera: Camera, now: number) {
  const [sx, sy] = toView(camera, a.x, a.y);
  const headTop = sy + avatarTopY(a.avatar) * AVATAR_SCALE * camera.zoom;

  ctx.font = "bold 11px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const w = ctx.measureText(a.name).width + 12;
  ctx.beginPath();
  ctx.roundRect(sx - w / 2, sy + 6, w, 16, 8);
  ctx.fillStyle = a.isSelf ? "rgba(255,140,60,0.92)" : "rgba(30,30,50,0.62)";
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillText(a.name, sx, sy + 14.5);

  const praiseAge = (now - a.praisedAt) / 1600;
  if (praiseAge >= 0 && praiseAge < 1) {
    ctx.save();
    ctx.globalAlpha = 1 - praiseAge;
    for (let i = 0; i < 6; i += 1) {
      const ang = (i / 6) * Math.PI * 2 + praiseAge * 2;
      const r = 18 + praiseAge * 26;
      starPath(ctx, sx + Math.cos(ang) * r, headTop + 30 + Math.sin(ang) * r * 0.6, 4, 4, 0.4);
      ctx.fillStyle = "#f5cf47";
      ctx.fill();
    }
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#ffffff";
    ctx.strokeText("グッピグ！", sx, headTop - 6 - praiseAge * 18);
    ctx.fillStyle = "#f08a3c";
    ctx.fillText("グッピグ！", sx, headTop - 6 - praiseAge * 18);
    ctx.restore();
  }

  if (a.bubble && a.bubble.until > now) {
    const remain = a.bubble.until - now;
    drawBubble(ctx, sx, headTop - 4, a.bubble.text, Math.min(1, remain / 400));
  }
}

// ------------------------------------------------------------------------ view

export type Camera = { offsetX: number; offsetY: number; zoom: number };

export function computeCamera(area: AreaDef, width: number, height: number): Camera {
  const left = -area.height * (TILE_W / 2);
  const right = area.width * (TILE_W / 2);
  const top = -(TILE_H / 2) - (area.indoor ? WALL_H : 90);
  const bottom = (area.width + area.height - 1) * (TILE_H / 2) + 30;
  const zoom = Math.max(0.35, Math.min(1.6, Math.min(width / (right - left + 24), height / (bottom - top + 24))));
  return {
    zoom,
    offsetX: width / 2 - ((left + right) / 2) * zoom,
    offsetY: height / 2 - ((top + bottom) / 2) * zoom,
  };
}

/** Screen-space hit box of an avatar (for clicking on people). */
export function avatarHitBox(camera: Camera, a: { x: number; y: number }): { x0: number; x1: number; y0: number; y1: number } {
  const [sx, sy] = toView(camera, a.x, a.y);
  const s = AVATAR_SCALE * camera.zoom;
  return { x0: sx - 20 * s, x1: sx + 20 * s, y0: sy - 70 * s, y1: sy + 4 * s };
}

export function renderArea(
  ctx: Ctx,
  area: AreaDef,
  avatars: RenderAvatar[],
  camera: Camera,
  width: number,
  height: number,
  now: number,
  hoverTile: [number, number] | null,
  ghost: PlacementGhost | null = null,
) {
  const time = now / 1000;
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, area.background[0]);
  grad.addColorStop(1, area.background[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(camera.offsetX, camera.offsetY);
  ctx.scale(camera.zoom, camera.zoom);

  drawWalls(ctx, area);
  drawFloor(ctx, area, time);

  if (hoverTile && !ghost) {
    const [hx, hy] = toScreen(hoverTile[0], hoverTile[1]);
    diamond(ctx, hx, hy, 2);
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  type Drawable = { depth: number; draw: () => void };
  const drawables: Drawable[] = [];
  for (const o of area.objects) {
    if (o.flat) continue;
    // Walkable furniture (beds, sofas, chairs) sorts by its nearest tile so
    // avatars sitting or lying on any part of it are drawn on top.
    const depth = o.walkable ? o.x + o.y - 0.5 : o.x + (o.w ?? 1) - 1 + o.y + (o.h ?? 1) - 1;
    drawables.push({ depth, draw: () => drawObject(ctx, o, time) });
  }
  for (const a of avatars) {
    drawables.push({ depth: a.x + a.y + 0.01, draw: () => drawAvatarSprite(ctx, a) });
  }
  if (ghost) {
    const o = ghost.object;
    drawables.push({
      depth: o.x + (o.w ?? 1) - 1 + o.y + (o.h ?? 1) - 1 + 0.02,
      draw: () => {
        footprintPath(ctx, o.x, o.y, o.w ?? 1, o.h ?? 1, 0.04);
        ctx.fillStyle = ghost.valid ? "rgba(90,210,120,0.35)" : "rgba(230,70,70,0.35)";
        ctx.fill();
        ctx.save();
        ctx.globalAlpha = 0.6;
        if (o.flat) drawFlatObject(ctx, o);
        else drawObject(ctx, o, time);
        ctx.restore();
      },
    });
  }
  drawables.sort((p, q) => p.depth - q.depth);
  for (const d of drawables) d.draw();
  ctx.restore();

  // Labels, name tags and bubbles: screen space, on top of everything.
  const labelled = new Set<string>();
  for (const portal of area.portals) {
    if (labelled.has(portal.to)) continue;
    labelled.add(portal.to);
    const group = area.portals.filter((p) => p.to === portal.to);
    const gx = group.reduce((s, p) => s + p.x, 0) / group.length;
    const gy = group.reduce((s, p) => s + p.y, 0) / group.length;
    const [sx, sy] = toView(camera, gx, gy);
    ctx.font = "bold 12px system-ui, sans-serif";
    const text = `→ ${portal.label}`;
    const w = ctx.measureText(text).width + 14;
    ctx.beginPath();
    // Below the tile so it never covers avatars standing on or next to the portal.
    ctx.roundRect(sx - w / 2, sy + 14 * camera.zoom + 4, w, 20, 6);
    ctx.fillStyle = "rgba(255,170,40,0.95)";
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, sx, sy + 14 * camera.zoom + 14);
  }
  const byDepth = [...avatars].sort((p, q) => p.x + p.y - (q.x + q.y));
  for (const a of byDepth) drawAvatarOverlay(ctx, a, camera, now);
}
