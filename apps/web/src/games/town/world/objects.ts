// Drawers for every placeable thing: town scenery and my-room furniture.
import { toScreen, type TownObject } from "./areas";
import {
  circle, faceQuad, facePoint, footprintPath, isoBox, label, polyFill, shade, shadow, type Ctx, type Pt,
} from "./drawUtil";
import { starPath } from "../avatar/draw/common";

function stroke(ctx: Ctx, pts: Pt[], color: string, width: number) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.stroke();
}

/** Upright panel standing on the back edge (y - 0.5) of a footprint. */
function backPanel(ctx: Ctx, x: number, y: number, w: number, height: number, lift: number, color: string, inset = 0.1) {
  const a = toScreen(x - 0.5 + inset, y - 0.5 + inset);
  const b = toScreen(x + w - 0.5 - inset, y - 0.5 + inset);
  polyFill(ctx, [[a[0], a[1] - lift], [b[0], b[1] - lift], [b[0], b[1] - lift - height], [a[0], a[1] - lift - height]], color);
}

/**
 * Swapping the grid axes mirrors the screen horizontally, so a piece turned
 * 90° is the unturned piece drawn at the transposed tile, flipped.
 */
function withRotation(ctx: Ctx, o: TownObject, paint: (o: TownObject) => void) {
  if (!o.rot) {
    paint(o);
    return;
  }
  ctx.save();
  ctx.scale(-1, 1);
  paint({ ...o, rot: undefined, x: o.y, y: o.x, w: o.h, h: o.w });
  ctx.restore();
}

/** Flat floor decorations (rugs) are drawn with the floor, under avatars. */
export function drawFlatObject(ctx: Ctx, o: TownObject) {
  withRotation(ctx, o, (obj) => drawFlatRaw(ctx, obj));
}

function drawFlatRaw(ctx: Ctx, o: TownObject) {
  if (o.kind !== "rug") return;
  const c = o.color ?? "#e0525c";
  footprintPath(ctx, o.x, o.y, o.w ?? 2, o.h ?? 2, 0.12);
  ctx.fillStyle = c;
  ctx.fill();
  footprintPath(ctx, o.x, o.y, o.w ?? 2, o.h ?? 2, 0.3);
  ctx.strokeStyle = shade(c, 0.45);
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawObject(ctx: Ctx, o: TownObject, time: number) {
  withRotation(ctx, o, (obj) => drawObjectRaw(ctx, obj, time));
}

function drawObjectRaw(ctx: Ctx, o: TownObject, time: number) {
  const w = o.w ?? 1;
  const h = o.h ?? 1;
  const [sx, sy] = toScreen(o.x + (w - 1) / 2, o.y + (h - 1) / 2);
  const c = o.color;
  switch (o.kind) {
    // ------------------------------------------------------------ outdoors
    case "tree":
      shadow(ctx, sx, sy + 2, 22, 10);
      ctx.fillStyle = "#8a5a35";
      ctx.fillRect(sx - 4, sy - 30, 8, 30);
      circle(ctx, sx, sy - 44, 22, "#5fae4a");
      circle(ctx, sx - 11, sy - 36, 14, "#6bbb52");
      circle(ctx, sx + 11, sy - 38, 14, "#55a343");
      circle(ctx, sx - 2, sy - 58, 13, "#78c85c");
      break;
    case "sakura": {
      shadow(ctx, sx, sy + 2, 24, 11);
      ctx.fillStyle = "#6b4430";
      ctx.fillRect(sx - 4, sy - 30, 8, 30);
      const petal = "rgba(186,90,120,0.3)";
      circle(ctx, sx, sy - 46, 23, "#f7b8cf", petal);
      circle(ctx, sx - 13, sy - 37, 14, "#f9c8da", petal);
      circle(ctx, sx + 13, sy - 39, 14, "#f4a8c2", petal);
      circle(ctx, sx - 2, sy - 61, 13, "#fbd5e3", petal);
      for (let i = 0; i < 4; i += 1) {
        const p = ((time * 0.25 + i / 4 + o.x * 0.13) % 1);
        const px = sx - 20 + i * 12 + Math.sin(p * 10 + i) * 6;
        const py = sy - 40 + p * 44;
        ctx.globalAlpha = 1 - p;
        ctx.beginPath();
        ctx.ellipse(px, py, 2.2, 1.4, p * 6, 0, Math.PI * 2);
        ctx.fillStyle = "#f7a8c4";
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case "fountain": {
      shadow(ctx, sx, sy + 4, 58, 28);
      ctx.beginPath();
      ctx.ellipse(sx, sy, 54, 26, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#b9b3a6";
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(sx, sy - 6, 54, 26, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#d9d3c6";
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(sx, sy - 6, 45, 20, 0, 0, Math.PI * 2);
      ctx.fillStyle = shade("#6ec3e8", Math.sin(time * 2) * 0.05);
      ctx.fill();
      ctx.fillStyle = "#cfc8ba";
      ctx.fillRect(sx - 5, sy - 42, 10, 36);
      ctx.beginPath();
      ctx.ellipse(sx, sy - 42, 16, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#e3ddd1";
      ctx.fill();
      for (let i = 0; i < 8; i += 1) {
        const p = ((time * 0.9 + i / 8) % 1);
        const ang = (i / 8) * Math.PI * 2;
        circle(ctx, sx + Math.cos(ang) * 22 * p, sy + Math.sin(ang) * 9 * p - 48 + 40 * p * p, 2, "rgba(190,235,255,0.9)", "");
      }
      break;
    }
    case "flowers":
      ctx.beginPath();
      ctx.ellipse(sx, sy, 22, 11, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#7a5438";
      ctx.fill();
      ["#f28fb8", "#f5cf47", "#ffffff", "#e0525c", "#9a6bd8", "#f28fb8", "#f5cf47"].forEach((fc, i) => {
        const ang = i * 0.9;
        circle(ctx, sx + Math.cos(ang) * 13, sy - 4 + Math.sin(ang) * 5, 3.6, fc, "");
      });
      break;
    case "bench":
      isoBox(ctx, o.x, o.y, 1, 1, 4, "#b07b4f", 0.12, 8);
      ctx.fillStyle = "#6b4a33";
      ctx.fillRect(sx - 18, sy - 8, 3, 8);
      ctx.fillRect(sx + 15, sy - 8, 3, 8);
      break;
    case "lamp":
    case "streetlight": {
      shadow(ctx, sx, sy + 1, 8, 4);
      ctx.fillStyle = "#3e4552";
      ctx.fillRect(sx - 2, sy - 62, 4, 62);
      const glow = 0.55 + Math.sin(time * 2.5) * 0.1;
      if (o.kind === "streetlight") {
        ctx.fillRect(sx - 2, sy - 64, 16, 3);
        circle(ctx, sx + 14, sy - 60, 6, `rgba(255,236,160,${glow})`, "#3e4552");
      } else {
        circle(ctx, sx, sy - 66, 9, `rgba(255,236,160,${glow})`, "#3e4552");
      }
      break;
    }
    case "palm": {
      shadow(ctx, sx + 6, sy + 2, 24, 10);
      ctx.strokeStyle = "#9b6a47";
      ctx.lineWidth = 7;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(sx - 4, sy - 40, sx + 8, sy - 72);
      ctx.stroke();
      const sway = Math.sin(time * 1.2) * 0.08;
      for (let i = 0; i < 6; i += 1) {
        const ang = -Math.PI / 2 + (i - 2.5) * 0.55 + sway;
        ctx.strokeStyle = i % 2 ? "#4f9e3f" : "#5fae4a";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(sx + 8, sy - 72);
        ctx.quadraticCurveTo(
          sx + 8 + Math.cos(ang) * 22, sy - 72 + Math.sin(ang) * 22 - 6,
          sx + 8 + Math.cos(ang) * 34, sy - 72 + Math.sin(ang) * 30 + 12,
        );
        ctx.stroke();
      }
      circle(ctx, sx + 5, sy - 68, 4, "#7a5438", "");
      circle(ctx, sx + 11, sy - 68, 4, "#7a5438", "");
      break;
    }
    case "parasol": {
      const pc = c ?? "#e0525c";
      ctx.beginPath();
      ctx.ellipse(sx + 18, sy + 6, 16, 7, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      shadow(ctx, sx, sy + 2, 28, 12);
      ctx.fillStyle = "#e8e4dc";
      ctx.fillRect(sx - 1.5, sy - 58, 3, 58);
      for (let i = 0; i < 6; i += 1) {
        ctx.beginPath();
        ctx.moveTo(sx, sy - 66);
        ctx.arc(sx, sy - 52, 32, Math.PI + (i * Math.PI) / 6, Math.PI + ((i + 1) * Math.PI) / 6);
        ctx.closePath();
        ctx.fillStyle = i % 2 ? "#ffffff" : pc;
        ctx.fill();
      }
      break;
    }
    case "castle":
      isoBox(ctx, o.x, o.y, 1, 1, 12, "#e2c98f", 0.15);
      isoBox(ctx, o.x, o.y, 1, 1, 10, "#e8d29b", 0.32, 12);
      ctx.fillStyle = "#e0525c";
      ctx.beginPath();
      ctx.moveTo(sx, sy - 36);
      ctx.lineTo(sx + 9, sy - 32);
      ctx.lineTo(sx, sy - 28);
      ctx.fill();
      ctx.fillStyle = "#6b4a33";
      ctx.fillRect(sx - 1, sy - 36, 1.5, 14);
      break;

    // -------------------------------------------------------------- shrine
    case "torii": {
      const red = "#d9412f";
      const a = toScreen(o.x - 0.3, o.y);
      const b = toScreen(o.x + w - 0.7, o.y);
      for (const p of [a, b]) {
        shadow(ctx, p[0], p[1] + 1, 7, 3);
        ctx.fillStyle = red;
        ctx.fillRect(p[0] - 3.5, p[1] - 78, 7, 78);
        ctx.fillStyle = "#2e2e38";
        ctx.fillRect(p[0] - 4, p[1] - 6, 8, 6);
      }
      const ext = 12;
      const dx = (b[0] - a[0]) / Math.hypot(b[0] - a[0], b[1] - a[1]);
      const dy = (b[1] - a[1]) / Math.hypot(b[0] - a[0], b[1] - a[1]);
      stroke(ctx, [[a[0] - dx * 6, a[1] - 60 - dy * 6], [b[0] + dx * 6, b[1] - 60 + dy * 6]], red, 5);
      stroke(ctx, [[a[0] - dx * ext, a[1] - 80 - dy * ext], [b[0] + dx * ext, b[1] - 80 + dy * ext]], red, 7);
      stroke(ctx, [[a[0] - dx * (ext + 3), a[1] - 86 - dy * (ext + 3)], [b[0] + dx * (ext + 3), b[1] - 86 + dy * (ext + 3)]], "#2e2e38", 5);
      break;
    }
    case "lantern":
      shadow(ctx, sx, sy + 1, 12, 5);
      isoBox(ctx, o.x, o.y, 1, 1, 8, "#b9b3a6", 0.28);
      ctx.fillStyle = "#b0aa9c";
      ctx.fillRect(sx - 3, sy - 34, 6, 26);
      isoBox(ctx, o.x, o.y, 1, 1, 12, "#d0cabd", 0.32, 34);
      ctx.fillStyle = `rgba(255,214,120,${0.75 + Math.sin(time * 3 + o.x) * 0.15})`;
      ctx.fillRect(sx - 4, sy - 44, 8, 6);
      polyFill(ctx, [[sx - 16, sy - 46], [sx, sy - 58], [sx + 16, sy - 46], [sx, sy - 40]], "#8f8a7e");
      break;
    case "hall": {
      const body = isoBox(ctx, o.x, o.y, w, h, 58, "#b8452f", 0.1);
      polyFill(ctx, faceQuad(body.left, 0.3, 0.7, 0, 0.72), "#6b2a1c");
      for (let i = 1; i < 4; i += 1) polyFill(ctx, faceQuad(body.left, i * 0.25 - 0.02, i * 0.25 + 0.02, 0, 1), "#8f3322", null);
      const [lx, ly] = toScreen(o.x - 0.9, o.y + h - 0.1);
      const [rx, ry] = toScreen(o.x + w - 0.1, o.y - 0.9);
      const [bx, by] = toScreen(o.x + w - 0.1, o.y + h - 0.1);
      const [tx, ty] = toScreen(o.x - 0.9, o.y - 0.9);
      const lift = 58;
      polyFill(ctx, [[lx, ly - lift], [bx, by - lift], [bx, by - lift - 30], [lx, ly - lift - 30]], "#3e4552");
      polyFill(ctx, [[bx, by - lift], [rx, ry - lift], [rx, ry - lift - 30], [bx, by - lift - 30]], "#2e333e");
      polyFill(ctx, [[tx, ty - lift - 30], [rx, ry - lift - 30], [bx, by - lift - 30], [lx, ly - lift - 30]], "#4a5261");
      const rope = faceQuad(body.left, 0.1, 0.9, 0.78, 0.84);
      polyFill(ctx, rope, "#e9d8a6");
      const bell = facePoint(body.left, 0.5, 0.7);
      circle(ctx, bell[0], bell[1] + 2, 5, "#f5cf47", "#8a6034");
      break;
    }
    case "offering": {
      const box = isoBox(ctx, o.x, o.y, w, h, 16, "#8a5a35", 0.15);
      for (let i = 1; i < 6; i += 1) polyFill(ctx, faceQuad(box.left, i / 6 - 0.015, i / 6 + 0.015, 0.4, 1), "#4a3228", null);
      break;
    }
    case "stall": {
      const sc = c ?? "#e0525c";
      const counter = isoBox(ctx, o.x, o.y, w, h, 22, "#c9965f", 0.08);
      polyFill(ctx, faceQuad(counter.left, 0, 1, 0.5, 0.75), "#ffffff", null);
      const poleA = facePoint(counter.left, 0.04, 1);
      const poleB = facePoint(counter.left, 0.96, 1);
      for (const p of [poleA, poleB]) {
        ctx.fillStyle = "#8a6034";
        ctx.fillRect(p[0] - 1.2, p[1] - 30, 2.4, 30);
      }
      for (let i = 0; i < 6; i += 1) {
        const u0 = i / 6;
        const u1 = (i + 1) / 6;
        const a0 = facePoint(counter.left, u0, 1);
        const a1 = facePoint(counter.left, u1, 1);
        polyFill(ctx, [[a0[0], a0[1] - 30], [a1[0], a1[1] - 30], [a1[0] - 4, a1[1] - 18], [a0[0] - 4, a0[1] - 18]], i % 2 ? "#ffffff" : sc, null);
      }
      if (o.label) {
        const m = facePoint(counter.left, 0.5, 1);
        label(ctx, o.label, m[0], m[1] - 38, sc);
      }
      break;
    }

    // -------------------------------------------------------------- street
    case "shop": {
      const sc = c ?? "#4f8fe0";
      const body = isoBox(ctx, o.x, o.y, w, h, 92, "#f2e2c4", 0.02);
      polyFill(ctx, faceQuad(body.left, 0.08, 0.92, 0.06, 0.55), "#a9d8f2");
      polyFill(ctx, faceQuad(body.left, 0.38, 0.62, 0, 0.5), shade(sc, -0.25));
      for (let i = 0; i < 8; i += 1) polyFill(ctx, faceQuad(body.left, i / 8, (i + 1) / 8, 0.56, 0.68), i % 2 ? "#ffffff" : sc, null);
      polyFill(ctx, faceQuad(body.left, 0.15, 0.85, 0.74, 0.92), sc);
      if (o.label) {
        const m = facePoint(body.left, 0.5, 0.83);
        ctx.font = "bold 12px system-ui, sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(o.label, m[0], m[1]);
      }
      break;
    }
    case "vending": {
      const vc = o.x % 2 ? "#4f8fe0" : "#e0525c";
      const body = isoBox(ctx, o.x, o.y, 1, 1, 50, vc, 0.18);
      polyFill(ctx, faceQuad(body.left, 0.1, 0.9, 0.45, 0.9), "#eef6ff");
      for (let i = 0; i < 3; i += 1) {
        const p = facePoint(body.left, 0.22 + i * 0.28, 0.66);
        ctx.fillStyle = ["#f5cf47", "#8fcf5a", "#f28fb8"][i];
        ctx.fillRect(p[0] - 2, p[1] - 4, 4, 7);
      }
      polyFill(ctx, faceQuad(body.left, 0.3, 0.7, 0.08, 0.2), "#2e2e38", null);
      break;
    }
    case "planter":
      isoBox(ctx, o.x, o.y, 1, 1, 12, "#9b9489", 0.15);
      circle(ctx, sx - 6, sy - 18, 9, "#5fae4a");
      circle(ctx, sx + 6, sy - 18, 9, "#6bbb52");
      circle(ctx, sx, sy - 24, 9, "#78c85c");
      circle(ctx, sx - 3, sy - 22, 2.4, "#f28fb8", "");
      circle(ctx, sx + 5, sy - 20, 2.4, "#f5cf47", "");
      break;

    // --------------------------------------------------------- cafe & room
    case "counter":
      isoBox(ctx, o.x, o.y, w, h, 30, "#8a5a35", 0.05);
      for (const cupX of [1, 3]) {
        const [cx, cy] = toScreen(o.x + cupX, o.y);
        circle(ctx, cx, cy - 36, 5, "#ffffff", "#999");
      }
      break;
    case "table":
      shadow(ctx, sx, sy + 2, 18, 9);
      ctx.fillStyle = "#6b4a33";
      ctx.fillRect(sx - 2, sy - 20, 4, 20);
      ctx.beginPath();
      ctx.ellipse(sx, sy - 22, 22, 11, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#b07b4f";
      ctx.fill();
      ctx.strokeStyle = "rgba(40,28,24,0.35)";
      ctx.stroke();
      circle(ctx, sx + 5, sy - 25, 3.5, "#ffffff", "#999");
      break;
    case "chair":
      backPanel(ctx, o.x, o.y, 1, 16, 10, shade(c ?? "#e0525c", -0.1), 0.28);
      isoBox(ctx, o.x, o.y, 1, 1, 3, c ?? "#e0525c", 0.28, 10);
      break;
    case "cushion":
      isoBox(ctx, o.x, o.y, 1, 1, 5, c ?? "#9a6bd8", 0.2);
      circle(ctx, sx, sy - 5, 2, shade(c ?? "#9a6bd8", 0.45), "");
      break;
    case "plant":
      isoBox(ctx, o.x, o.y, 1, 1, 16, "#c96f4a", 0.3);
      circle(ctx, sx, sy - 30, 11, "#5fae4a");
      circle(ctx, sx - 8, sy - 24, 8, "#6bbb52");
      circle(ctx, sx + 8, sy - 25, 8, "#55a343");
      break;
    case "bed": {
      const bc = c ?? "#4f8fe0";
      backPanel(ctx, o.x, o.y, 1, 30, 0, "#8a5a35", 0.05);
      isoBox(ctx, o.x, o.y, 1, 2, 10, "#b07b4f", 0.05);
      isoBox(ctx, o.x, o.y, 1, 2, 5, "#ffffff", 0.1, 10);
      isoBox(ctx, o.x, o.y + 0.7, 1, 1.3, 3, bc, 0.08, 14);
      const [px, py] = toScreen(o.x, o.y);
      ctx.beginPath();
      ctx.ellipse(px, py - 16, 14, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#f7f1e3";
      ctx.fill();
      ctx.strokeStyle = "rgba(40,28,24,0.3)";
      ctx.stroke();
      break;
    }
    case "sofa": {
      const fc = c ?? "#46b3a0";
      backPanel(ctx, o.x, o.y, w, 24, 0, shade(fc, -0.15), 0.08);
      isoBox(ctx, o.x, o.y, w, h, 12, fc, 0.1);
      isoBox(ctx, o.x, o.y, 0.3, 1, 18, shade(fc, -0.08), 0.1);
      isoBox(ctx, o.x + w - 0.3, o.y, 0.3, 1, 18, shade(fc, -0.08), 0.1);
      break;
    }
    case "kotatsu": {
      const kc = c ?? "#e0525c";
      isoBox(ctx, o.x, o.y, 1, 1, 13, kc, 0.02);
      isoBox(ctx, o.x, o.y, 1, 1, 3, "#c9965f", 0.1, 13);
      circle(ctx, sx - 4, sy - 19, 3.4, "#f08a3c", "#b86424");
      circle(ctx, sx + 3, sy - 18, 3.4, "#f08a3c", "#b86424");
      break;
    }
    case "desk": {
      const top = isoBox(ctx, o.x, o.y, 1, 1, 24, "#c9965f", 0.08);
      polyFill(ctx, faceQuad(top.left, 0.1, 0.9, 0.1, 0.85), "#b07b4f");
      polyFill(ctx, faceQuad(top.left, 0.35, 0.65, 0.45, 0.6), "#f5cf47", null);
      isoBox(ctx, o.x + 0.15, o.y + 0.2, 0.35, 0.5, 3, "#4f8fe0", 0.02, 24);
      ctx.fillStyle = "#3e4552";
      ctx.fillRect(sx + 7, sy - 44, 2, 18);
      circle(ctx, sx + 8, sy - 46, 5, "rgba(255,236,160,0.9)", "#3e4552");
      break;
    }
    case "bookshelf": {
      const shelf = isoBox(ctx, o.x, o.y, 1, 1, 56, "#8a5a35", 0.12);
      const colors = ["#e0525c", "#4f8fe0", "#f5cf47", "#8fcf5a", "#9a6bd8", "#f08a3c"];
      for (let row = 0; row < 3; row += 1) {
        for (let i = 0; i < 6; i += 1) {
          polyFill(ctx, faceQuad(shelf.left, 0.1 + i * 0.135, 0.2 + i * 0.135, 0.08 + row * 0.31, 0.3 + row * 0.31), colors[(i + row * 2) % 6], null);
        }
      }
      break;
    }
    case "tv": {
      isoBox(ctx, o.x, o.y, 1, 1, 12, "#6b4a33", 0.15);
      const a = toScreen(o.x - 0.35, o.y + 0.1);
      const b = toScreen(o.x + 0.35, o.y + 0.1);
      const flicker = 0.75 + Math.sin(time * 7) * 0.08;
      polyFill(ctx, [[a[0], a[1] - 14], [b[0], b[1] - 14], [b[0], b[1] - 42], [a[0], a[1] - 42]], "#22222a");
      polyFill(ctx, [[a[0] + 2, a[1] - 17], [b[0] - 2, b[1] - 17], [b[0] - 2, b[1] - 39], [a[0] + 2, a[1] - 39]], `rgba(120,200,255,${flicker})`, null);
      break;
    }
    case "floorlamp":
      shadow(ctx, sx, sy + 1, 9, 4);
      ctx.fillStyle = "#3e4552";
      ctx.fillRect(sx - 1.5, sy - 56, 3, 56);
      polyFill(ctx, [[sx - 11, sy - 50], [sx + 11, sy - 50], [sx + 7, sy - 66], [sx - 7, sy - 66]], "#fff1c2");
      ctx.globalAlpha = 0.18 + Math.sin(time * 2) * 0.04;
      circle(ctx, sx, sy - 52, 22, "#fff1a0", "");
      ctx.globalAlpha = 1;
      break;
    case "piano": {
      const body = isoBox(ctx, o.x, o.y, w, h, 30, "#22222a", 0.08);
      polyFill(ctx, faceQuad(body.left, 0.05, 0.95, 0.72, 0.88), "#ffffff");
      for (let i = 1; i < 14; i += 1) {
        if (i % 7 === 3 || i % 7 === 0) continue;
        polyFill(ctx, faceQuad(body.left, 0.05 + i * 0.064 - 0.012, 0.05 + i * 0.064 + 0.012, 0.8, 0.88), "#22222a", null);
      }
      backPanel(ctx, o.x, o.y, w, 18, 30, "#2e2e38", 0.08);
      break;
    }
    case "fridge": {
      const body = isoBox(ctx, o.x, o.y, 1, 1, 58, c ?? "#f7f1e3", 0.14);
      polyFill(ctx, faceQuad(body.left, 0.02, 0.98, 0.6, 0.62), "rgba(0,0,0,0.25)", null);
      polyFill(ctx, faceQuad(body.left, 0.8, 0.86, 0.65, 0.85), "#9aa0aa", null);
      polyFill(ctx, faceQuad(body.left, 0.8, 0.86, 0.3, 0.5), "#9aa0aa", null);
      break;
    }
    case "teddy": {
      const tc = c ?? "#c9965f";
      shadow(ctx, sx, sy + 1, 16, 7);
      circle(ctx, sx, sy - 14, 14, tc, "rgba(58,38,38,0.5)");
      circle(ctx, sx, sy - 36, 12, tc, "rgba(58,38,38,0.5)");
      circle(ctx, sx - 10, sy - 46, 5, tc, "rgba(58,38,38,0.5)");
      circle(ctx, sx + 10, sy - 46, 5, tc, "rgba(58,38,38,0.5)");
      circle(ctx, sx, sy - 32, 5, shade(tc, 0.5), "");
      circle(ctx, sx - 4.5, sy - 38, 1.6, "#2b2320", "");
      circle(ctx, sx + 4.5, sy - 38, 1.6, "#2b2320", "");
      circle(ctx, sx, sy - 33.5, 1.6, "#2b2320", "");
      circle(ctx, sx, sy - 14, 7, shade(tc, 0.4), "");
      break;
    }
    case "aquarium": {
      isoBox(ctx, o.x, o.y, 1, 1, 12, "#6b4a33", 0.12);
      ctx.globalAlpha = 0.55;
      isoBox(ctx, o.x, o.y, 1, 1, 26, "#8fd3f0", 0.14, 12);
      ctx.globalAlpha = 1;
      for (let i = 0; i < 3; i += 1) {
        const fx = sx + Math.sin(time * (0.8 + i * 0.3) + i * 2) * 12;
        const fy = sy - 22 - i * 6;
        ctx.beginPath();
        ctx.ellipse(fx, fy, 3.4, 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = ["#f08a3c", "#f5cf47", "#e0525c"][i];
        ctx.fill();
      }
      circle(ctx, sx - 8, sy - 30 - ((time * 12) % 12), 1.4, "rgba(255,255,255,0.8)", "");
      break;
    }
    case "xmastree": {
      shadow(ctx, sx, sy + 1, 18, 8);
      isoBox(ctx, o.x, o.y, 1, 1, 8, "#c96f4a", 0.3);
      for (let i = 0; i < 3; i += 1) {
        const base = sy - 8 - i * 16;
        polyFill(ctx, [[sx - 22 + i * 5, base], [sx + 22 - i * 5, base], [sx, base - 26]], ["#3f8f4a", "#4a9e52", "#57ad5e"][i]);
      }
      const bulbs = ["#e0525c", "#f5cf47", "#4f8fe0", "#f28fb8"];
      for (let i = 0; i < 8; i += 1) {
        const on = Math.sin(time * 4 + i) > -0.3;
        circle(ctx, sx + Math.sin(i * 2.3) * (14 - i), sy - 14 - i * 6, 2.2, on ? bulbs[i % 4] : "#8a8a8a", "");
      }
      starPath(ctx, sx, sy - 66, 6);
      ctx.fillStyle = "#f5cf47";
      ctx.fill();
      break;
    }

    // ------------------------------------------------------- more furniture
    case "beanbag": {
      const bc = c ?? "#f08a3c";
      shadow(ctx, sx, sy + 1, 20, 9);
      ctx.beginPath();
      ctx.ellipse(sx, sy - 9, 20, 12, 0, 0, Math.PI * 2);
      ctx.fillStyle = bc;
      ctx.fill();
      ctx.strokeStyle = "rgba(40,28,24,0.35)";
      ctx.stroke();
      circle(ctx, sx - 6, sy - 14, 5, shade(bc, 0.3), "");
      break;
    }
    case "wardrobe": {
      const body = isoBox(ctx, o.x, o.y, 1, 1, 62, c ?? "#c9965f", 0.1);
      polyFill(ctx, faceQuad(body.left, 0.49, 0.51, 0.04, 0.96), "rgba(0,0,0,0.3)", null);
      for (const u of [0.42, 0.58]) polyFill(ctx, faceQuad(body.left, u - 0.03, u + 0.03, 0.45, 0.55), "#f5cf47", null);
      break;
    }
    case "dresser": {
      const top = isoBox(ctx, o.x, o.y, 1, 1, 24, c ?? "#f7f1e3", 0.14);
      polyFill(ctx, faceQuad(top.left, 0.1, 0.9, 0.1, 0.45), shade(c ?? "#f7f1e3", -0.1));
      polyFill(ctx, faceQuad(top.left, 0.1, 0.9, 0.55, 0.9), shade(c ?? "#f7f1e3", -0.1));
      backPanel(ctx, o.x, o.y, 1, 30, 24, "#c9965f", 0.2);
      backPanel(ctx, o.x, o.y, 1, 24, 27, "#bfe3f5", 0.28);
      circle(ctx, sx - 4, sy - 30, 2.4, "#f28fb8", "");
      circle(ctx, sx + 3, sy - 29, 2, "#9a6bd8", "");
      break;
    }
    case "grandclock": {
      const body = isoBox(ctx, o.x, o.y, 1, 1, 68, "#6b4430", 0.26);
      const face = facePoint(body.left, 0.5, 0.8);
      circle(ctx, face[0], face[1], 7, "#f7f1e3", "#3e2a20");
      const ang = time * 1.2;
      ctx.strokeStyle = "#3e2a20";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(face[0], face[1]);
      ctx.lineTo(face[0] + Math.cos(ang) * 5, face[1] + Math.sin(ang) * 5);
      ctx.moveTo(face[0], face[1]);
      ctx.lineTo(face[0] + Math.cos(ang / 12) * 3.5, face[1] + Math.sin(ang / 12) * 3.5);
      ctx.stroke();
      const pivot = facePoint(body.left, 0.5, 0.6);
      const swing = Math.sin(time * 3) * 0.4;
      stroke(ctx, [pivot, [pivot[0] + Math.sin(swing) * 14, pivot[1] + Math.cos(swing) * 14]], "#c9a227", 1.2);
      circle(ctx, pivot[0] + Math.sin(swing) * 14, pivot[1] + Math.cos(swing) * 14, 3, "#f5cf47", "#8a6034");
      break;
    }
    case "fireplace": {
      const body = isoBox(ctx, o.x, o.y, w, h, 42, "#b8594a", 0.06);
      polyFill(ctx, faceQuad(body.left, 0.25, 0.75, 0, 0.62), "#2b1d1a");
      for (let i = 0; i < 3; i += 1) {
        const f = facePoint(body.left, 0.38 + i * 0.12, 0.12);
        const flick = Math.sin(time * 9 + i * 2) * 2;
        ctx.beginPath();
        ctx.ellipse(f[0], f[1] - 6, 4, 8 + flick, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#f08a3c";
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(f[0], f[1] - 4, 2, 4 + flick / 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#f5cf47";
        ctx.fill();
      }
      isoBox(ctx, o.x, o.y, w, h, 4, "#e2dccf", 0, 42);
      break;
    }
    case "sink": {
      const body = isoBox(ctx, o.x, o.y, 1, 1, 30, "#e8e4dc", 0.06);
      polyFill(ctx, faceQuad(body.left, 0.15, 0.85, 0.15, 0.8), "#cfd3da");
      ctx.beginPath();
      ctx.ellipse(sx, sy - 31, 12, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#9aa0aa";
      ctx.fill();
      stroke(ctx, [[sx + 6, sy - 32], [sx + 6, sy - 42], [sx + 1, sy - 42]], "#9aa0aa", 2.2);
      break;
    }
    case "stove": {
      const body = isoBox(ctx, o.x, o.y, 1, 1, 30, "#cfd3da", 0.06);
      polyFill(ctx, faceQuad(body.left, 0.15, 0.85, 0.2, 0.7), "#3e4552");
      for (const [dx, dy] of [[-7, -31], [7, -31]]) {
        ctx.beginPath();
        ctx.ellipse(sx + dx, sy + dy, 6, 3, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "#2e2e38";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      isoBox(ctx, o.x + 0.2, o.y + 0.25, 0.35, 0.35, 8, "#e0525c", 0, 30);
      break;
    }
    case "diningtable": {
      for (const [dx, dy] of [[0.15, 0.2], [w - 0.15, 0.2], [0.15, h - 0.2], [w - 0.15, h - 0.2]]) {
        const [lx, ly] = toScreen(o.x - 0.5 + dx, o.y - 0.5 + dy);
        ctx.fillStyle = "#6b4a33";
        ctx.fillRect(lx - 1.5, ly - 22, 3, 22);
      }
      isoBox(ctx, o.x, o.y, w, h, 4, "#c9965f", 0.08, 22);
      for (const gx of [0, w - 1]) {
        const [px, py] = toScreen(o.x + gx, o.y);
        ctx.beginPath();
        ctx.ellipse(px, py - 27, 7, 3.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      }
      break;
    }
    case "bathtub": {
      const tub = c ?? "#f7f1e3";
      isoBox(ctx, o.x, o.y, w, h, 18, tub, 0.06);
      ctx.save();
      ctx.translate(0, -18);
      footprintPath(ctx, o.x, o.y, w, h, 0.18);
      ctx.fillStyle = "#8fd3f0";
      ctx.fill();
      ctx.restore();
      for (let i = 0; i < 5; i += 1) {
        const bx = sx - 18 + i * 9 + Math.sin(time * 2 + i) * 2;
        circle(ctx, bx, sy - 22 - ((time * 8 + i * 5) % 14), 2.2, "rgba(255,255,255,0.85)", "");
      }
      break;
    }
    case "toilet":
      backPanel(ctx, o.x, o.y, 1, 26, 0, "#f7f1e3", 0.25);
      ctx.beginPath();
      ctx.ellipse(sx, sy - 6, 12, 7, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = "rgba(40,28,24,0.35)";
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(sx, sy - 12, 11, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#f2f2f2";
      ctx.fill();
      ctx.stroke();
      break;
    case "washbasin": {
      ctx.fillStyle = "#e8e4dc";
      ctx.fillRect(sx - 4, sy - 22, 8, 22);
      ctx.beginPath();
      ctx.ellipse(sx, sy - 24, 14, 7, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = "rgba(40,28,24,0.35)";
      ctx.stroke();
      backPanel(ctx, o.x, o.y, 1, 26, 30, "#bfe3f5", 0.28);
      break;
    }
    case "chabudai":
      shadow(ctx, sx, sy + 1, 22, 10);
      ctx.fillStyle = "#4a3228";
      ctx.fillRect(sx - 14, sy - 10, 3, 10);
      ctx.fillRect(sx + 11, sy - 10, 3, 10);
      ctx.beginPath();
      ctx.ellipse(sx, sy - 11, 24, 12, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#6b4430";
      ctx.fill();
      ctx.strokeStyle = "rgba(40,28,24,0.4)";
      ctx.stroke();
      circle(ctx, sx - 5, sy - 15, 4, "#3f8f4a", "#2b5a30");
      circle(ctx, sx + 6, sy - 13, 3, "#ffffff", "#999");
      break;
    case "tansu": {
      const body = isoBox(ctx, o.x, o.y, 1, 1, 44, "#9b6a47", 0.1);
      for (let row = 0; row < 3; row += 1) {
        const v0 = 0.08 + row * 0.31;
        polyFill(ctx, faceQuad(body.left, 0.08, 0.92, v0, v0 + 0.26), "#b07b4f");
        const k = facePoint(body.left, 0.5, v0 + 0.13);
        circle(ctx, k[0], k[1], 1.6, "#2e2e38", "");
      }
      break;
    }
    case "bonsai":
      isoBox(ctx, o.x, o.y, 1, 1, 8, "#3e4552", 0.3);
      stroke(ctx, [[sx, sy - 8], [sx - 3, sy - 16], [sx + 4, sy - 24]], "#6b4430", 3);
      for (const [dx, dy, r] of [[-8, -20, 7], [6, -27, 8], [-2, -31, 6]]) {
        ctx.beginPath();
        ctx.ellipse(sx + dx, sy + dy, r + 3, r * 0.6, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#3f7a3a";
        ctx.fill();
      }
      break;
    case "andon": {
      const glow = 0.8 + Math.sin(time * 2.4) * 0.08;
      ctx.globalAlpha = 0.18;
      circle(ctx, sx, sy - 18, 22, "#fff1a0", "");
      ctx.globalAlpha = 1;
      // isoBox shades hex colours only; flicker the lantern with alpha instead.
      ctx.globalAlpha = glow;
      const box = isoBox(ctx, o.x, o.y, 1, 1, 34, "#fff2c4", 0.3);
      ctx.globalAlpha = 1;
      polyFill(ctx, faceQuad(box.left, 0.48, 0.52, 0, 1), "#6b4430", null);
      polyFill(ctx, faceQuad(box.right, 0.48, 0.52, 0, 1), "#6b4430", null);
      break;
    }
    case "arcade": {
      const ac = c ?? "#9a6bd8";
      const body = isoBox(ctx, o.x, o.y, 1, 1, 54, ac, 0.18);
      polyFill(ctx, faceQuad(body.left, 0.12, 0.88, 0.55, 0.88), "#1b2248");
      const flicker = (Math.sin(time * 6) + 1) / 2;
      for (let i = 0; i < 3; i += 1) {
        const p = facePoint(body.left, 0.3 + i * 0.2, 0.7);
        circle(ctx, p[0], p[1], 2, ["#f5cf47", "#8fcf5a", "#f28fb8"][i], "");
      }
      polyFill(ctx, faceQuad(body.left, 0.12, 0.88, 0.45, 0.5), `rgba(255,255,255,${0.3 + flicker * 0.4})`, null);
      const stick = facePoint(body.left, 0.35, 0.42);
      stroke(ctx, [stick, [stick[0], stick[1] - 6]], "#2e2e38", 1.6);
      circle(ctx, stick[0], stick[1] - 7, 2.2, "#e0525c", "");
      break;
    }
    case "snowman":
      shadow(ctx, sx, sy + 1, 16, 7);
      circle(ctx, sx, sy - 12, 13, "#ffffff", "rgba(80,100,130,0.35)");
      circle(ctx, sx, sy - 33, 9, "#ffffff", "rgba(80,100,130,0.35)");
      circle(ctx, sx - 3, sy - 35, 1.3, "#2e2e38", "");
      circle(ctx, sx + 3, sy - 35, 1.3, "#2e2e38", "");
      polyFill(ctx, [[sx, sy - 32], [sx + 7, sy - 31], [sx, sy - 30]], "#f08a3c", null);
      polyFill(ctx, [[sx - 8, sy - 40], [sx + 8, sy - 40], [sx + 6, sy - 50], [sx - 6, sy - 50]], "#2e2e38", null);
      ctx.fillStyle = "#e0525c";
      ctx.fillRect(sx - 9, sy - 26, 18, 3);
      break;
    case "pumpkinlamp": {
      shadow(ctx, sx, sy + 1, 16, 7);
      for (const dx of [-8, 8, 0]) {
        ctx.beginPath();
        ctx.ellipse(sx + dx, sy - 12, dx ? 9 : 10, 12, 0, 0, Math.PI * 2);
        ctx.fillStyle = dx ? "#e07a24" : "#f08a3c";
        ctx.fill();
      }
      ctx.fillStyle = "#3f7a3a";
      ctx.fillRect(sx - 1.5, sy - 28, 3, 5);
      const lit = `rgba(255,220,90,${0.75 + Math.sin(time * 8) * 0.2})`;
      polyFill(ctx, [[sx - 8, sy - 16], [sx - 3, sy - 16], [sx - 5.5, sy - 20]], lit, null);
      polyFill(ctx, [[sx + 3, sy - 16], [sx + 8, sy - 16], [sx + 5.5, sy - 20]], lit, null);
      polyFill(ctx, [[sx - 7, sy - 10], [sx + 7, sy - 10], [sx + 4, sy - 6], [sx, sy - 8], [sx - 4, sy - 6]], lit, null);
      break;
    }
    case "kadomatsu": {
      isoBox(ctx, o.x, o.y, 1, 1, 14, "#d9b48a", 0.22);
      for (const [dx, hgt] of [[-6, 44], [6, 38], [0, 52]]) {
        ctx.fillStyle = "#6bbb52";
        ctx.fillRect(sx + dx - 3, sy - hgt, 6, hgt - 10);
        polyFill(ctx, [[sx + dx - 3, sy - hgt], [sx + dx + 3, sy - hgt - 5], [sx + dx + 3, sy - hgt + 2], [sx + dx - 3, sy - hgt + 4]], "#b8e0a0", null);
      }
      circle(ctx, sx - 12, sy - 18, 5, "#2f6b35", "");
      circle(ctx, sx + 12, sy - 18, 5, "#2f6b35", "");
      circle(ctx, sx + 9, sy - 14, 2, "#e0525c", "");
      break;
    }
    case "sunflower":
      isoBox(ctx, o.x, o.y, 1, 1, 12, "#c96f4a", 0.3);
      stroke(ctx, [[sx, sy - 12], [sx + 2, sy - 44]], "#3f8f4a", 2.4);
      ctx.beginPath();
      ctx.ellipse(sx - 5, sy - 28, 6, 3, -0.5, 0, Math.PI * 2);
      ctx.fillStyle = "#4a9e52";
      ctx.fill();
      for (let i = 0; i < 12; i += 1) {
        const ang = (i / 12) * Math.PI * 2 + Math.sin(time) * 0.05;
        ctx.beginPath();
        ctx.ellipse(sx + 2 + Math.cos(ang) * 8, sy - 48 + Math.sin(ang) * 8, 4, 2, ang, 0, Math.PI * 2);
        ctx.fillStyle = "#f5cf47";
        ctx.fill();
      }
      circle(ctx, sx + 2, sy - 48, 6, "#6b4430", "");
      break;

    // ------------------------------------------------------ limited pieces
    case "canopybed": {
      const bc = c ?? "#f28fb8";
      backPanel(ctx, o.x, o.y, 1, 34, 0, "#f7f1e3", 0.05);
      isoBox(ctx, o.x, o.y, 1, 2, 10, "#f7f1e3", 0.05);
      isoBox(ctx, o.x, o.y, 1, 2, 5, "#ffffff", 0.1, 10);
      isoBox(ctx, o.x, o.y + 0.7, 1, 1.3, 3, bc, 0.08, 14);
      const [px, py] = toScreen(o.x, o.y);
      ctx.beginPath();
      ctx.ellipse(px, py - 16, 14, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      const corners: Pt[] = [
        toScreen(o.x - 0.45, o.y - 0.45), toScreen(o.x + 0.45, o.y - 0.45),
        toScreen(o.x + 0.45, o.y + 1.45), toScreen(o.x - 0.45, o.y + 1.45),
      ];
      for (const [cx, cy] of corners) {
        ctx.fillStyle = "#f5cf47";
        ctx.fillRect(cx - 1.5, cy - 62, 3, 62);
      }
      polyFill(ctx, corners.map(([cx, cy]) => [cx, cy - 62] as Pt), shade(bc, 0.35));
      ctx.globalAlpha = 0.35;
      polyFill(ctx, [corners[3], corners[2], [corners[2][0], corners[2][1] - 62], [corners[3][0], corners[3][1] - 62]], bc, null);
      ctx.globalAlpha = 1;
      break;
    }
    case "throne": {
      const tc = c ?? "#b8323f";
      backPanel(ctx, o.x, o.y, 1, 46, 0, "#e3b53c", 0.2);
      backPanel(ctx, o.x, o.y, 1, 34, 8, tc, 0.28);
      isoBox(ctx, o.x, o.y, 1, 1, 12, "#e3b53c", 0.22);
      isoBox(ctx, o.x, o.y, 1, 1, 4, tc, 0.28, 12);
      const top = toScreen(o.x, o.y - 0.4);
      starPath(ctx, top[0], top[1] - 50, 5);
      ctx.fillStyle = "#f5cf47";
      ctx.fill();
      circle(ctx, top[0], top[1] - 50, 1.8, "#4f8fe0", "");
      break;
    }
    case "neonsign": {
      const nc = c ?? "#f28fb8";
      ctx.fillStyle = "#3e4552";
      ctx.fillRect(sx - 1.5, sy - 30, 3, 30);
      const on = Math.sin(time * 5) > -0.8;
      ctx.save();
      ctx.shadowColor = nc;
      ctx.shadowBlur = on ? 14 : 0;
      ctx.strokeStyle = on ? nc : shade(nc, -0.4);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx, sy - 36);
      ctx.bezierCurveTo(sx - 20, sy - 50, sx - 10, sy - 66, sx, sy - 56);
      ctx.bezierCurveTo(sx + 10, sy - 66, sx + 20, sy - 50, sx, sy - 36);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case "goldpig": {
      isoBox(ctx, o.x, o.y, 1, 1, 12, "#e8e4dc", 0.22);
      const gold = "#e3b53c";
      const shine = 0.5 + Math.sin(time * 3) * 0.3;
      ctx.beginPath();
      ctx.ellipse(sx, sy - 26, 15, 11, 0, 0, Math.PI * 2);
      ctx.fillStyle = gold;
      ctx.fill();
      ctx.strokeStyle = "#8a6034";
      ctx.stroke();
      for (const dx of [-8, 8]) {
        ctx.fillStyle = shade(gold, -0.15);
        ctx.fillRect(sx + dx - 2, sy - 18, 4, 6);
      }
      circle(ctx, sx + 12, sy - 32, 8, gold, "#8a6034");
      polyFill(ctx, [[sx + 9, sy - 39], [sx + 12, sy - 45], [sx + 15, sy - 39]], shade(gold, -0.1));
      ctx.beginPath();
      ctx.ellipse(sx + 18, sy - 31, 3.2, 2.6, 0, 0, Math.PI * 2);
      ctx.fillStyle = shade(gold, -0.2);
      ctx.fill();
      circle(ctx, sx + 11, sy - 34, 1, "#4a3228", "");
      ctx.globalAlpha = shine;
      starPath(ctx, sx - 6, sy - 32, 3.5, 4, 0.35);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.globalAlpha = 1;
      break;
    }
    case "minifountain": {
      ctx.beginPath();
      ctx.ellipse(sx, sy - 4, 24, 12, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#d9d3c6";
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(sx, sy - 6, 19, 9, 0, 0, Math.PI * 2);
      ctx.fillStyle = shade("#6ec3e8", Math.sin(time * 2) * 0.05);
      ctx.fill();
      ctx.fillStyle = "#cfc8ba";
      ctx.fillRect(sx - 3, sy - 26, 6, 20);
      for (let i = 0; i < 6; i += 1) {
        const p = ((time * 0.9 + i / 6) % 1);
        const ang = (i / 6) * Math.PI * 2;
        circle(ctx, sx + Math.cos(ang) * 10 * p, sy + Math.sin(ang) * 4 * p - 30 + 24 * p * p, 1.6, "rgba(190,235,255,0.9)", "");
      }
      break;
    }
    case "sakuratree": {
      isoBox(ctx, o.x, o.y, 1, 1, 12, "#c96f4a", 0.28);
      stroke(ctx, [[sx, sy - 12], [sx - 2, sy - 30], [sx + 3, sy - 40]], "#6b4430", 3);
      const petal = "rgba(186,90,120,0.3)";
      circle(ctx, sx, sy - 44, 14, "#f7b8cf", petal);
      circle(ctx, sx - 10, sy - 38, 9, "#f9c8da", petal);
      circle(ctx, sx + 10, sy - 39, 9, "#f4a8c2", petal);
      for (let i = 0; i < 3; i += 1) {
        const p = ((time * 0.3 + i / 3) % 1);
        ctx.globalAlpha = 1 - p;
        ctx.beginPath();
        ctx.ellipse(sx - 12 + i * 12 + Math.sin(p * 9) * 4, sy - 36 + p * 34, 2, 1.3, p * 6, 0, Math.PI * 2);
        ctx.fillStyle = "#f7a8c4";
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      break;
    }
  }
}
