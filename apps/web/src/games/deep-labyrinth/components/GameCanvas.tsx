"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEPTH_LAYER_COUNT,
  DEPTH_LAYER_COLORS,
  DEPTH_LAYER_HEIGHT,
  GRID_COLS,
  GRID_ROWS,
  MIN_CELL_SIZE,
  PERFORMANCE_CONFIG,
  getDepthLayer,
} from "../data/balance";
import type { Direction, MapCell, Monster, MonsterSpawnTier, TileVariant } from "../types/game";
import { InputManager } from "../core/InputManager";
import { GameEngine } from "../core/GameEngine";
import { deepLabPerfMonitor, isDeepLabPerfEnabled } from "../core/performance";

type Props = {
  engine: GameEngine;
  onSelectCell: (cell: MapCell | null) => void;
  showExactSpawnRate: boolean;
  reduceGlowAnimation: boolean;
  lowPowerMode: boolean;
};

type DrawMetrics = {
  cellSize: number;
  width: number;
  height: number;
  viewportWidth: number;
  viewportHeight: number;
};

type CameraState = {
  zoom: number;
  offsetX: number;
  offsetY: number;
};

type InspectInfo = {
  row: number;
  col: number;
  soilLabel: string;
  depthLabel: string;
  spawnTierLabel: string;
  rarityExpectationLabel: string;
  candidateRarityBand: string;
  spawnRate: number;
  spawnCandidates: string;
  diggable: boolean;
  materialLabel: string;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.slice(1), 16);
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
  };
}

function blendColor(baseHex: string, overlayHex: string, alpha: number): string {
  const base = hexToRgb(baseHex);
  const over = hexToRgb(overlayHex);
  const mix = {
    r: Math.round(base.r * (1 - alpha) + over.r * alpha),
    g: Math.round(base.g * (1 - alpha) + over.g * alpha),
    b: Math.round(base.b * (1 - alpha) + over.b * alpha),
  };
  return `rgb(${mix.r},${mix.g},${mix.b})`;
}

function applyBrightness(hex: string, delta: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = clamp(((n >> 16) & 255) + delta, 0, 255);
  const g = clamp(((n >> 8) & 255) + delta, 0, 255);
  const b = clamp((n & 255) + delta, 0, 255);
  return `rgb(${r},${g},${b})`;
}

function depthBaseColor(row: number): string {
  return DEPTH_LAYER_COLORS[getDepthLayer(row)].base;
}

function soilOverlayColor(type: string): { color: string; alpha: number } {
  if (type === "magicSoil") return { color: "#6f5cd9", alpha: 0.33 };
  if (type === "moistSoil") return { color: "#2f8e8d", alpha: 0.28 };
  if (type === "mineralSoil") return { color: "#a8afbf", alpha: 0.22 };
  if (type === "toxicSoil") return { color: "#8dad3e", alpha: 0.33 };
  if (type === "hardRock") return { color: "#45444f", alpha: 0.68 };
  return { color: "#000000", alpha: 0 };
}

function drawSoilTile(
  ctx: CanvasRenderingContext2D,
  cell: MapCell,
  x: number,
  y: number,
  size: number,
): void {
  const layer = getDepthLayer(cell.row);
  const layerColors = DEPTH_LAYER_COLORS[layer];
  const v: TileVariant = cell.tileVariant;
  const baseLayer = depthBaseColor(cell.row);
  const overlay = soilOverlayColor(cell.type);
  const merged = overlay.alpha > 0 ? blendColor(baseLayer, overlay.color, overlay.alpha) : baseLayer;

  const deep = applyBrightness(merged, v.brightness - 12);
  const mid = applyBrightness(merged, v.brightness - 2);
  const high = applyBrightness(merged, v.brightness + 9);

  const grad = ctx.createLinearGradient(x, y, x + size, y + size);
  grad.addColorStop(0, high);
  grad.addColorStop(0.55, mid);
  grad.addColorStop(1, deep);
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, size, size);

  ctx.strokeStyle = layerColors.border;
  ctx.globalAlpha = 0.2;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
  ctx.globalAlpha = 1;

  const chip = Math.floor(size * 0.2);
  if (v.edgeType === 0) ctx.clearRect(x, y, chip, chip);
  if (v.edgeType === 1) ctx.clearRect(x + size - chip, y, chip, chip);
  if (v.edgeType === 2) ctx.clearRect(x, y + size - chip, chip, chip);
  if (v.edgeType === 3) ctx.clearRect(x + size - chip, y + size - chip, chip, chip);

  ctx.strokeStyle = "rgba(18,12,10,0.4)";
  ctx.lineWidth = Math.max(1, size * 0.06);
  if (v.crackType === 0) {
    ctx.beginPath();
    ctx.moveTo(x + size * 0.2, y + size * 0.45);
    ctx.lineTo(x + size * 0.48, y + size * 0.35);
    ctx.lineTo(x + size * 0.74, y + size * 0.62);
    ctx.stroke();
  } else if (v.crackType === 1) {
    ctx.beginPath();
    ctx.moveTo(x + size * 0.55, y + size * 0.12);
    ctx.lineTo(x + size * 0.36, y + size * 0.49);
    ctx.lineTo(x + size * 0.7, y + size * 0.85);
    ctx.stroke();
  } else if (v.crackType === 2) {
    ctx.beginPath();
    ctx.moveTo(x + size * 0.18, y + size * 0.28);
    ctx.lineTo(x + size * 0.62, y + size * 0.27);
    ctx.lineTo(x + size * 0.84, y + size * 0.52);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(20,20,20,0.28)";
  const grains = 2 + (v.decorationType % 3);
  for (let i = 0; i < grains; i += 1) {
    const gx = x + ((v.crackType * 13 + i * 19 + v.edgeType * 7) % 100) * 0.01 * size;
    const gy = y + ((v.decorationType * 17 + i * 23 + v.edgeType * 11) % 100) * 0.01 * size;
    ctx.fillRect(gx, gy, Math.max(1, size * 0.06), Math.max(1, size * 0.06));
  }

  if (cell.type === "magicSoil" || cell.type === "moistSoil" || cell.type === "mineralSoil" || cell.type === "toxicSoil") {
    const glowColor =
      cell.type === "magicSoil"
        ? "rgba(123,109,230,0.18)"
        : cell.type === "moistSoil"
          ? "rgba(67,181,168,0.17)"
          : cell.type === "mineralSoil"
            ? "rgba(194,205,222,0.16)"
            : "rgba(166,208,88,0.15)";
    ctx.fillStyle = glowColor;
    ctx.fillRect(x + size * 0.1, y + size * 0.1, size * 0.8, size * 0.8);
  }
}

function drawInvader(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  dir: Direction,
): void {
  ctx.fillStyle = "#e4aa82";
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2a1f19";
  const eye = size * 0.18;
  if (dir === "left") {
    ctx.fillRect(x - size * 0.4, y - eye, eye, eye);
  } else if (dir === "right") {
    ctx.fillRect(x + size * 0.2, y - eye, eye, eye);
  } else if (dir === "up") {
    ctx.fillRect(x - eye * 0.5, y - size * 0.42, eye, eye);
  } else {
    ctx.fillRect(x - eye * 0.5, y + size * 0.2, eye, eye);
  }
}

function drawMonster(
  ctx: CanvasRenderingContext2D,
  monster: Monster,
  x: number,
  y: number,
  size: number,
  timeSec: number,
): void {
  const body = monster.visualConfig.bodyColor;
  const accent = monster.visualConfig.accentColor;
  const eye = monster.visualConfig.eyeColor;
  const bob = Math.sin(timeSec * 5 + monster.motionPhase * Math.PI * 2) * size * 0.07;
  const cx = x;
  const cy = y + bob;

  if (monster.visualConfig.hasGlow) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 1.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = body;
  if (monster.kind === "slime" || monster.kind === "manaMoth") {
    ctx.beginPath();
    ctx.ellipse(cx, cy, size * 1.05, size * 0.82, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (monster.kind === "wisp" || monster.kind === "shadowBat") {
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.72, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(cx - size * 1.2, cy);
    ctx.quadraticCurveTo(cx - size * 0.5, cy - size * 0.4, cx, cy);
    ctx.quadraticCurveTo(cx + size * 0.5, cy - size * 0.4, cx + size * 1.2, cy);
    ctx.lineTo(cx + size * 0.9, cy + size * 0.26);
    ctx.lineTo(cx - size * 0.9, cy + size * 0.26);
    ctx.closePath();
    ctx.fill();
  } else if (monster.kind === "mole" || monster.kind === "magmaCrab") {
    ctx.beginPath();
    ctx.rect(cx - size, cy - size * 0.55, size * 2, size * 1.1);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.fillRect(cx - size * 1.1, cy + size * 0.15, size * 0.35, size * 0.26);
    ctx.fillRect(cx + size * 0.75, cy + size * 0.15, size * 0.35, size * 0.26);
  } else if (monster.kind === "poisonBug" || monster.kind === "crystalBeetle") {
    ctx.beginPath();
    ctx.ellipse(cx, cy, size * 0.9, size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = Math.max(1.2, size * 0.14);
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.7, cy - size * 0.2);
    ctx.lineTo(cx + size * 0.7, cy - size * 0.2);
    ctx.moveTo(cx - size * 0.75, cy + size * 0.2);
    ctx.lineTo(cx + size * 0.75, cy + size * 0.2);
    ctx.stroke();
  } else if (monster.kind === "mimic" || monster.kind === "runeShaman") {
    ctx.beginPath();
    ctx.rect(cx - size * 0.8, cy - size * 0.8, size * 1.6, size * 1.6);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.fillRect(cx - size * 0.65, cy - size * 0.08, size * 1.3, size * 0.22);
  } else if (monster.kind === "barkHorn" || monster.kind === "nestMother") {
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.86, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.6, cy - size * 0.15);
    ctx.lineTo(cx - size * 1.05, cy - size * 0.8);
    ctx.lineTo(cx - size * 0.2, cy - size * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + size * 0.6, cy - size * 0.15);
    ctx.lineTo(cx + size * 1.05, cy - size * 0.8);
    ctx.lineTo(cx + size * 0.2, cy - size * 0.45);
    ctx.closePath();
    ctx.fill();
  } else if (monster.kind === "bubbleFrog") {
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.86, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(cx - size * 0.52, cy - size * 0.68, size * 0.23, 0, Math.PI * 2);
    ctx.arc(cx + size * 0.52, cy - size * 0.68, size * 0.23, 0, Math.PI * 2);
    ctx.fill();
  } else if (monster.kind === "sporeRat" || monster.kind === "mistLeech") {
    ctx.beginPath();
    ctx.ellipse(cx, cy, size, size * 0.64, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = Math.max(1, size * 0.1);
    ctx.beginPath();
    ctx.moveTo(cx + size * 0.9, cy);
    ctx.quadraticCurveTo(cx + size * 1.3, cy + size * 0.2, cx + size * 1.45, cy + size * 0.55);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.86, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = eye;
  ctx.beginPath();
  ctx.arc(cx - size * 0.28, cy - size * 0.1, size * 0.12, 0, Math.PI * 2);
  ctx.arc(cx + size * 0.28, cy - size * 0.1, size * 0.12, 0, Math.PI * 2);
  ctx.fill();

  const rarityMark = monster.rarity === "epic" ? "★" : monster.rarity === "rare" ? "◆" : monster.rarity === "uncommon" ? "▲" : "●";
  const rarityColor = monster.rarity === "epic" ? "#d9b15f" : monster.rarity === "rare" ? "#7b7ff4" : monster.rarity === "uncommon" ? "#79dc8f" : "#f2f7ff";
  ctx.fillStyle = rarityColor;
  ctx.font = `${Math.max(8, Math.floor(size * 0.95))}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(rarityMark, cx, cy - size * 1.02);
}

function soilParticleColor(soilType: string, layer: ReturnType<typeof getDepthLayer>): string {
  const base = DEPTH_LAYER_COLORS[layer].particle;
  if (soilType === "magicSoil") return blendColor(base, "#8f78df", 0.5);
  if (soilType === "moistSoil") return blendColor(base, "#59bca9", 0.5);
  if (soilType === "mineralSoil") return blendColor(base, "#c8d2e0", 0.4);
  if (soilType === "toxicSoil") return blendColor(base, "#98bb45", 0.55);
  return base;
}

function spawnTierGlow(tier: MonsterSpawnTier): string {
  if (tier === "veryHigh") return "rgba(245, 186, 82, 0.58)";
  if (tier === "high") return "rgba(136, 156, 255, 0.44)";
  return "rgba(0, 0, 0, 0)";
}

function spawnTierBorder(tier: MonsterSpawnTier): { color: string; width: number } {
  if (tier === "veryHigh") return { color: "rgba(254, 214, 124, 0.88)", width: 2.4 };
  if (tier === "high") return { color: "rgba(164, 210, 255, 0.74)", width: 1.8 };
  return { color: "rgba(0,0,0,0)", width: 0 };
}

function drawSpawnTierOverlay(
  ctx: CanvasRenderingContext2D,
  cell: MapCell,
  x: number,
  y: number,
  size: number,
  pulse: number,
  animateGlow: boolean,
): void {
  if (cell.spawnTier === "normal") return;

  const border = spawnTierBorder(cell.spawnTier);
  ctx.lineWidth = border.width;
  ctx.strokeStyle = border.color;
  ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);

  const glow = spawnTierGlow(cell.spawnTier);
  if (cell.spawnTier === "high") {
    ctx.fillStyle = glow;
    ctx.fillRect(x + size * 0.08, y + size * 0.08, size * 0.84, size * 0.84);
  } else {
    const alpha = animateGlow ? 0.38 + 0.22 * pulse : 0.44;
    ctx.fillStyle = `rgba(245, 186, 82, ${alpha})`;
    ctx.fillRect(x + size * 0.05, y + size * 0.05, size * 0.9, size * 0.9);
  }

  const eggColor = cell.spawnTier === "veryHigh" ? "rgba(253, 236, 167, 0.92)" : "rgba(196, 220, 255, 0.85)";
  const eggStroke = cell.spawnTier === "veryHigh" ? "rgba(123, 66, 29, 0.64)" : "rgba(50, 72, 108, 0.62)";
  ctx.fillStyle = eggColor;
  ctx.strokeStyle = eggStroke;
  ctx.lineWidth = Math.max(1, size * 0.06);

  const eggCount = cell.spawnTier === "veryHigh" ? 2 : 1;
  for (let i = 0; i < eggCount; i += 1) {
    const ox = eggCount === 1 ? 0 : i === 0 ? -size * 0.14 : size * 0.14;
    ctx.beginPath();
    ctx.ellipse(x + size * 0.5 + ox, y + size * 0.54, size * 0.13, size * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = cell.spawnTier === "veryHigh" ? "rgba(255, 244, 188, 0.84)" : "rgba(192, 225, 255, 0.72)";
  const sparkleCount = cell.spawnTier === "veryHigh" ? 2 : 1;
  for (let i = 0; i < sparkleCount; i += 1) {
    const sx = x + size * (0.26 + (((cell.tileVariant.edgeType + i * 3) % 5) * 0.13));
    const sy = y + size * (0.22 + (((cell.tileVariant.crackType + i * 2) % 4) * 0.12));
    ctx.fillRect(sx, sy, Math.max(1, size * 0.08), Math.max(1, size * 0.08));
  }

  if (cell.spawnTier === "veryHigh") {
    ctx.strokeStyle = "rgba(249, 198, 104, 0.84)";
    ctx.lineWidth = Math.max(1, size * 0.07);
    ctx.beginPath();
    ctx.moveTo(x + size * 0.1, y + size * 0.1);
    ctx.lineTo(x + size * 0.2, y + size * 0.1);
    ctx.lineTo(x + size * 0.2, y + size * 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + size * 0.8, y + size * 0.8);
    ctx.lineTo(x + size * 0.9, y + size * 0.8);
    ctx.lineTo(x + size * 0.9, y + size * 0.9);
    ctx.stroke();
  }

  if (getDepthLayer(cell.row) >= 3) {
    ctx.fillStyle = "rgba(255, 240, 176, 0.88)";
    ctx.beginPath();
    ctx.moveTo(x + size * 0.78, y + size * 0.22);
    ctx.lineTo(x + size * 0.83, y + size * 0.33);
    ctx.lineTo(x + size * 0.95, y + size * 0.35);
    ctx.lineTo(x + size * 0.86, y + size * 0.43);
    ctx.lineTo(x + size * 0.89, y + size * 0.55);
    ctx.lineTo(x + size * 0.78, y + size * 0.49);
    ctx.lineTo(x + size * 0.67, y + size * 0.55);
    ctx.lineTo(x + size * 0.7, y + size * 0.43);
    ctx.lineTo(x + size * 0.61, y + size * 0.35);
    ctx.lineTo(x + size * 0.73, y + size * 0.33);
    ctx.closePath();
    ctx.fill();
  }
}

export function GameCanvas({ engine, onSelectCell, showExactSpawnRate, reduceGlowAnimation, lowPowerMode }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const staticLayerRef = useRef<HTMLCanvasElement | null>(null);
  const staticLayerMapVersionRef = useRef(-1);
  const staticLayerCellSizeRef = useRef(-1);
  const cameraRef = useRef<CameraState>({ zoom: 1, offsetX: 0, offsetY: 0 });
  const [metrics, setMetrics] = useState<DrawMetrics>({
    cellSize: 20,
    width: GRID_COLS * 20,
    height: GRID_ROWS * 20,
    viewportWidth: GRID_COLS * 20,
    viewportHeight: GRID_ROWS * 20,
  });
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);
  const [inspectInfo, setInspectInfo] = useState<InspectInfo | null>(null);
  const [camera, setCamera] = useState<CameraState>({ zoom: 1, offsetX: 0, offsetY: 0 });
  const [cameraMode, setCameraMode] = useState<"dig" | "pan">("dig");

  const input = useMemo(() => new InputManager(), []);
  const isDraggingRef = useRef(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const pinchCenterRef = useRef<{ x: number; y: number } | null>(null);
  const isShiftDownRef = useRef(false);
  const longPressTimerRef = useRef<number | null>(null);

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  const clampCamera = useCallback(
    (next: CameraState): CameraState => {
      const mapW = metrics.width * next.zoom;
      const mapH = metrics.height * next.zoom;
      const viewW = metrics.viewportWidth;
      const viewH = metrics.viewportHeight;

      let minX = viewW - mapW;
      let maxX = 0;
      let minY = viewH - mapH;
      let maxY = 0;

      if (mapW <= viewW) {
        minX = maxX = Math.floor((viewW - mapW) * 0.5);
      }
      if (mapH <= viewH) {
        minY = maxY = Math.floor((viewH - mapH) * 0.5);
      }

      return {
        zoom: next.zoom,
        offsetX: clamp(next.offsetX, minX, maxX),
        offsetY: clamp(next.offsetY, minY, maxY),
      };
    },
    [metrics.height, metrics.viewportHeight, metrics.viewportWidth, metrics.width],
  );

  const fitOverview = useCallback(() => {
    if (metrics.viewportWidth <= 0 || metrics.viewportHeight <= 0) return;
    const z = clamp(
      Math.min(metrics.viewportWidth / metrics.width, metrics.viewportHeight / metrics.height),
      0.55,
      2.4,
    );
    const centered = {
      zoom: z,
      offsetX: (metrics.viewportWidth - metrics.width * z) * 0.5,
      offsetY: (metrics.viewportHeight - metrics.height * z) * 0.5,
    };
    setCamera(clampCamera(centered));
  }, [clampCamera, metrics.height, metrics.viewportHeight, metrics.viewportWidth, metrics.width]);

  const focusToCell = useCallback(
    (row: number, col: number, forcedZoom?: number) => {
      const zoom = forcedZoom ?? camera.zoom;
      const x = (col + 0.5) * metrics.cellSize * zoom;
      const y = (row + 0.5) * metrics.cellSize * zoom;
      const next = {
        zoom,
        offsetX: metrics.viewportWidth * 0.5 - x,
        offsetY: metrics.viewportHeight * 0.5 - y,
      };
      setCamera(clampCamera(next));
    },
    [camera.zoom, clampCamera, metrics.cellSize, metrics.viewportHeight, metrics.viewportWidth],
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const observer = new ResizeObserver(() => {
      const bounds = viewport.getBoundingClientRect();
      const containerWidth = bounds.width;
      const containerHeight = bounds.height;
      const cellSize = Math.max(
        MIN_CELL_SIZE,
        Math.floor(Math.min(containerWidth / GRID_COLS, containerHeight / GRID_ROWS)),
      );
      const width = cellSize * GRID_COLS;
      const height = cellSize * GRID_ROWS;
      setMetrics({ cellSize, width, height, viewportWidth: containerWidth, viewportHeight: containerHeight });
    });

    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        if (isDeepLabPerfEnabled()) {
          deepLabPerfMonitor().registerTimerStop("longPressInspect");
        }
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    fitOverview();
  }, [fitOverview]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "ShiftLeft" || event.code === "ShiftRight") isShiftDownRef.current = true;
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "ShiftLeft" || event.code === "ShiftRight") isShiftDownRef.current = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable='true']")) return;
      if (!canvasRef.current) return;

      const current = hoverCell ?? (() => {
        const p = engine.getPlayerFocusPosition();
        return { row: p.y, col: p.x };
      })();

      let nextRow = current.row;
      let nextCol = current.col;
      let moved = false;

      if (event.code === "ArrowUp" || event.code === "KeyW") {
        nextRow = Math.max(0, current.row - 1);
        moved = true;
      } else if (event.code === "ArrowDown" || event.code === "KeyS") {
        nextRow = Math.min(GRID_ROWS - 1, current.row + 1);
        moved = true;
      } else if (event.code === "ArrowLeft" || event.code === "KeyA") {
        nextCol = Math.max(0, current.col - 1);
        moved = true;
      } else if (event.code === "ArrowRight" || event.code === "KeyD") {
        nextCol = Math.min(GRID_COLS - 1, current.col + 1);
        moved = true;
      } else if (event.code === "Space") {
        event.preventDefault();
        engine.beginDrag();
        engine.digAtCell(current.row, current.col, false);
        engine.endDrag();
        onSelectCell(engine.getCellAt(current.row, current.col));
        const info = engine.inspectCell(current.row, current.col);
        setInspectInfo(
          info
            ? {
                row: current.row,
                col: current.col,
                ...info,
              }
            : null,
        );
        return;
      }

      if (!moved) return;
      event.preventDefault();
      setHoverCell({ row: nextRow, col: nextCol });
      onSelectCell(engine.getCellAt(nextRow, nextCol));
      const info = engine.inspectCell(nextRow, nextCol);
      setInspectInfo(
        info
          ? {
              row: nextRow,
              col: nextCol,
              ...info,
            }
          : null,
      );
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [engine, hoverCell, onSelectCell]);

  const ensureStaticLayer = useCallback(() => {
    const state = engine.getRenderState();
    const needsRedraw =
      !staticLayerRef.current ||
      staticLayerMapVersionRef.current !== state.mapVersion ||
      staticLayerCellSizeRef.current !== metrics.cellSize;

    if (!needsRedraw) return;

    const staticCanvas = document.createElement("canvas");
    staticCanvas.width = Math.max(1, Math.floor(metrics.width));
    staticCanvas.height = Math.max(1, Math.floor(metrics.height));
    const staticCtx = staticCanvas.getContext("2d");
    if (!staticCtx) return;

    for (let row = 0; row < GRID_ROWS; row += 1) {
      for (let col = 0; col < GRID_COLS; col += 1) {
        const cell = state.map[row][col];
        const x = col * metrics.cellSize;
        const y = row * metrics.cellSize;

        if (cell.type === "empty" || cell.type === "coreRoom" || cell.type === "entrance" || cell.type === "nest" || cell.type === "trap") {
          const layer = getDepthLayer(row);
          const floorBase =
            cell.type === "coreRoom"
              ? blendColor(DEPTH_LAYER_COLORS[layer].base, "#4a1e56", 0.4)
              : cell.type === "entrance"
                ? blendColor(DEPTH_LAYER_COLORS[layer].base, "#80432f", 0.55)
                : blendColor(DEPTH_LAYER_COLORS[layer].base, "#16202a", 0.6);
          staticCtx.fillStyle = applyBrightness(floorBase, cell.tileVariant.brightness - 2);
          staticCtx.fillRect(x, y, metrics.cellSize, metrics.cellSize);
          staticCtx.strokeStyle = "rgba(205,218,230,0.08)";
          staticCtx.strokeRect(x + 0.5, y + 0.5, metrics.cellSize - 1, metrics.cellSize - 1);
        } else {
          drawSoilTile(staticCtx, cell, x, y, metrics.cellSize);
          // Cache base spawn-tier visuals and keep pulse animation for the dynamic layer only.
          drawSpawnTierOverlay(staticCtx, cell, x, y, metrics.cellSize, 0.75, false);
        }

        if (state.playerAreaCells.some((p) => p.x === col && p.y === row)) {
          staticCtx.fillStyle = "rgba(103,138,237,0.14)";
          staticCtx.fillRect(x, y, metrics.cellSize, metrics.cellSize);
        }
      }
    }

    staticLayerRef.current = staticCanvas;
    staticLayerMapVersionRef.current = state.mapVersion;
    staticLayerCellSizeRef.current = metrics.cellSize;
  }, [engine, metrics.cellSize, metrics.height, metrics.width]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;

    const render = () => {
      const frameStart = typeof performance !== "undefined" ? performance.now() : Date.now();
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        rafId = window.requestAnimationFrame(render);
        return;
      }
      const state = engine.getRenderState();
      const debug = engine.getDebugOverlay();
      const nowMs = Date.now();
      const rawDpr = window.devicePixelRatio || 1;
      const dpr = Math.min(
        rawDpr,
        lowPowerMode ? PERFORMANCE_CONFIG.lowPowerRenderPixelRatio : PERFORMANCE_CONFIG.maxRenderPixelRatio,
      );
      const drawW = Math.floor(metrics.viewportWidth);
      const drawH = Math.floor(metrics.viewportHeight);

      canvas.width = Math.max(1, Math.floor(drawW * dpr));
      canvas.height = Math.max(1, Math.floor(drawH * dpr));
      canvas.style.width = `${drawW}px`;
      canvas.style.height = `${drawH}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, drawW, drawH);

      const clampedCamera = clampCamera(cameraRef.current);

      const focusRow = (-clampedCamera.offsetY + drawH * 0.5) / (metrics.cellSize * clampedCamera.zoom);
      engine.setCameraFocusRow(focusRow);

      ctx.save();
      ctx.translate(clampedCamera.offsetX, clampedCamera.offsetY);
      ctx.scale(clampedCamera.zoom, clampedCamera.zoom);

      const viewLeft = -clampedCamera.offsetX / clampedCamera.zoom;
      const viewTop = -clampedCamera.offsetY / clampedCamera.zoom;
      const viewRight = viewLeft + drawW / clampedCamera.zoom;
      const viewBottom = viewTop + drawH / clampedCamera.zoom;

      ensureStaticLayer();
      if (staticLayerRef.current) {
        ctx.drawImage(staticLayerRef.current, 0, 0);
      }

      for (let row = 0; row < GRID_ROWS; row += 1) {
        for (let col = 0; col < GRID_COLS; col += 1) {
          const cell = state.map[row][col];
          const x = col * metrics.cellSize;
          const y = row * metrics.cellSize;

          if (
            x + metrics.cellSize < viewLeft ||
            x > viewRight ||
            y + metrics.cellSize < viewTop ||
            y > viewBottom
          ) {
            continue;
          }

          if (cell.type !== "empty" && cell.type !== "coreRoom" && cell.type !== "entrance" && cell.type !== "nest" && cell.type !== "trap") {
            if (cell.spawnTier !== "normal") {
              const pulse = 0.5 + Math.sin((nowMs + row * 41 + col * 23) * 0.0022) * 0.5;
              drawSpawnTierOverlay(
                ctx,
                cell,
                x,
                y,
                metrics.cellSize,
                pulse,
                !reduceGlowAnimation && !lowPowerMode,
              );
            }
          }

          if (engine.isCorePlacementPhase()) {
            const canPlace = engine.isCorePlacementCandidate(row, col);
            if (canPlace) {
              ctx.strokeStyle = "rgba(164,170,255,0.72)";
              ctx.lineWidth = 2;
              ctx.strokeRect(x + 1, y + 1, metrics.cellSize - 2, metrics.cellSize - 2);
            } else {
              ctx.fillStyle = "rgba(0,0,0,0.28)";
              ctx.fillRect(x, y, metrics.cellSize, metrics.cellSize);
            }
          }

          if (debug.enabled) {
            const key = `${row}:${col}`;
            if (debug.coreCandidateKeys.has(key)) {
              ctx.fillStyle = "rgba(222,182,70,0.18)";
              ctx.fillRect(x + 1, y + 1, metrics.cellSize - 2, metrics.cellSize - 2);
            } else if (debug.reachableKeys.has(key)) {
              ctx.fillStyle = "rgba(92,169,255,0.11)";
              ctx.fillRect(x + 1, y + 1, metrics.cellSize - 2, metrics.cellSize - 2);
            }
          }
        }
      }

      for (let layer = 1; layer < DEPTH_LAYER_COUNT; layer += 1) {
        const boundaryRow = layer * DEPTH_LAYER_HEIGHT;
        const y = boundaryRow * metrics.cellSize;
        ctx.strokeStyle = "rgba(205, 189, 166, 0.16)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(metrics.width, y + 0.5);
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(225,236,255,0.75)";
      ctx.font = `${Math.max(11, Math.floor(metrics.cellSize * 0.43))}px sans-serif`;
      ctx.textAlign = "left";
      for (let layer = 0; layer < DEPTH_LAYER_COUNT; layer += 1) {
        const layerKey = layer as keyof typeof DEPTH_LAYER_COLORS;
        const labelY = (layer * DEPTH_LAYER_HEIGHT + DEPTH_LAYER_HEIGHT * 0.5) * metrics.cellSize;
        ctx.fillText(DEPTH_LAYER_COLORS[layerKey].name, 6, labelY);
      }

      if (state.selectedPlacementPosition) {
        const px = state.selectedPlacementPosition.x * metrics.cellSize;
        const py = state.selectedPlacementPosition.y * metrics.cellSize;
        const size = metrics.cellSize;
        ctx.fillStyle = "rgba(187,78,172,0.58)";
        ctx.beginPath();
        ctx.arc(px + size * 0.5, py + size * 0.5, size * 0.34, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const monster of state.monsters) {
        if (!monster.isActive || monster.state === "dead") continue;
        const x = monster.position.x * metrics.cellSize;
        const y = monster.position.y * metrics.cellSize;
        if (x < viewLeft - metrics.cellSize || x > viewRight + metrics.cellSize || y < viewTop - metrics.cellSize || y > viewBottom + metrics.cellSize) {
          continue;
        }
        drawMonster(ctx, monster, x, y, Math.max(4, metrics.cellSize * 0.28), state.timeSec);
      }

      for (const invader of state.invaders) {
        if (invader.state === "dead") continue;
        const x = invader.position.x * metrics.cellSize;
        const y = invader.position.y * metrics.cellSize;
        if (x < viewLeft - metrics.cellSize || x > viewRight + metrics.cellSize || y < viewTop - metrics.cellSize || y > viewBottom + metrics.cellSize) {
          continue;
        }
        drawInvader(ctx, x, y, Math.max(4, metrics.cellSize * 0.2 * invader.bodySize), invader.direction);
      }

      for (const effect of engine.getSpawnEffects()) {
        const cx = (effect.col + 0.5) * metrics.cellSize;
        const cy = (effect.row + 0.5) * metrics.cellSize;
        const rate = effect.elapsedSec / effect.durationSec;
        const glow = 1 - rate;
        ctx.save();
        ctx.globalAlpha = Math.max(0.2, glow);
        ctx.fillStyle = effect.glowColor;
        ctx.beginPath();
        ctx.arc(cx, cy, metrics.cellSize * (0.2 + 0.5 * rate), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      for (const digEffect of engine.getDigBreakEffects()) {
        const color = soilParticleColor(digEffect.soilType, digEffect.depthLayer);
        for (const p of digEffect.particles) {
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = color;
          ctx.fillRect(
            p.x * metrics.cellSize - p.size * metrics.cellSize * 0.5,
            p.y * metrics.cellSize - p.size * metrics.cellSize * 0.5,
            p.size * metrics.cellSize,
            p.size * metrics.cellSize,
          );
        }
        ctx.globalAlpha = 1;
        const dustAlpha = Math.max(0, 1 - (Date.now() - digEffect.startedAt) / digEffect.duration) * 0.45;
        ctx.fillStyle = `rgba(196, 178, 162, ${dustAlpha})`;
        ctx.beginPath();
        ctx.arc(
          (digEffect.column + 0.5) * metrics.cellSize,
          (digEffect.row + 0.64) * metrics.cellSize,
          metrics.cellSize * 0.35,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }

      if (debug.enabled) {
        ctx.lineWidth = 1.5;
        for (const pathInfo of debug.enemyPaths) {
          const pts = pathInfo.path;
          if (pts.length < 2) continue;
          ctx.strokeStyle = "rgba(255,165,121,0.7)";
          ctx.beginPath();
          for (let i = 0; i < pts.length; i += 1) {
            const px = (pts[i].x + 0.5) * metrics.cellSize;
            const py = (pts[i].y + 0.5) * metrics.cellSize;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
      }

      if (hoverCell) {
        const x = hoverCell.col * metrics.cellSize;
        const y = hoverCell.row * metrics.cellSize;
        const cell = state.map[hoverCell.row][hoverCell.col];
        const inCorePlacement = engine.isCorePlacementPhase();
        const coreCheck = inCorePlacement ? engine.canPlaceCoreAt(hoverCell.row, hoverCell.col) : null;
        const diggable = inCorePlacement ? Boolean(coreCheck?.canPlace) : engine.isCellDiggable(hoverCell.row, hoverCell.col);
        const isHard = cell.type === "hardRock";
        ctx.strokeStyle = isHard ? "#6f1a1a" : diggable ? (inCorePlacement ? "#ffe170" : "#76e8ff") : "#ff6e6e";
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 1, y + 1, metrics.cellSize - 2, metrics.cellSize - 2);
      }

      ctx.restore();

      if (debug.enabled) {
        ctx.fillStyle = "rgba(4,10,24,0.72)";
        ctx.fillRect(8, 8, 250, 84);
        ctx.fillStyle = "#b7d2ff";
        ctx.font = "12px monospace";
        ctx.fillText(`mapVersion: ${debug.mapVersion}`, 14, 28);
        ctx.fillText(`seed: ${state.mapSeed}`, 14, 44);
        ctx.fillText(`invaders: ${state.invaders.length}`, 14, 60);
        ctx.fillText(`map: ${GRID_COLS}x${GRID_ROWS}`, 14, 76);
      }

      rafId = window.requestAnimationFrame(render);

      if (isDeepLabPerfEnabled()) {
        const frameEnd = typeof performance !== "undefined" ? performance.now() : Date.now();
        deepLabPerfMonitor().recordFrame(frameEnd - frameStart);
        deepLabPerfMonitor().updateCanvasInfo({
          cssWidth: drawW,
          cssHeight: drawH,
          internalWidth: canvas.width,
          internalHeight: canvas.height,
          devicePixelRatio: rawDpr,
          renderPixelRatio: dpr,
        });
      }
    };

    if (isDeepLabPerfEnabled()) {
      deepLabPerfMonitor().registerLoopStart("render");
    }

    rafId = window.requestAnimationFrame(render);
    return () => {
      window.cancelAnimationFrame(rafId);
      if (isDeepLabPerfEnabled()) {
        deepLabPerfMonitor().registerLoopStop("render");
      }
    };
  }, [clampCamera, engine, ensureStaticLayer, lowPowerMode, metrics, reduceGlowAnimation]);

  const pointToCell = (clientX: number, clientY: number): { row: number; col: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - camera.offsetX) / camera.zoom;
    const y = (clientY - rect.top - camera.offsetY) / camera.zoom;
    const col = Math.floor(x / metrics.cellSize);
    const row = Math.floor(y / metrics.cellSize);
    if (!isFinite(row) || !isFinite(col)) return null;
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return null;
    return { row, col };
  };

  const updateInspectFromPoint = (clientX: number, clientY: number): void => {
    const pos = pointToCell(clientX, clientY);
    if (!pos) {
      setInspectInfo(null);
      return;
    }
    const info = engine.inspectCell(pos.row, pos.col);
    if (!info) {
      setInspectInfo(null);
      return;
    }
    setInspectInfo({
      row: pos.row,
      col: pos.col,
      ...info,
    });
  };

  return (
    <div ref={viewportRef} className="dlCanvasViewport">
      {engine.isPlacementConfirmationPhase() ? <div className="dlMapDim" /> : null}
      <div className="dlCanvasTools" data-ui-panel="true">
        <button type="button" className="dlBtnSmall" onClick={() => setCameraMode((v) => (v === "dig" ? "pan" : "dig"))}>
          {cameraMode === "dig" ? "掘削" : "移動"}
        </button>
        <button type="button" className="dlBtnSmall" onClick={fitOverview}>
          全体表示
        </button>
        <button
          type="button"
          className="dlBtnSmall"
          onClick={() => {
            const core = engine.getCorePosition();
            if (!core) return;
            focusToCell(core.y, core.x, Math.max(1.2, camera.zoom));
          }}
        >
          魔界核へ移動
        </button>
        <button
          type="button"
          className="dlBtnSmall"
          onClick={() => {
            const p = engine.getPlayerFocusPosition();
            focusToCell(p.y, p.x, Math.max(1.2, camera.zoom));
          }}
        >
          プレイヤーへ移動
        </button>
        <button
          type="button"
          className="dlBtnSmall"
          onClick={() => {
            const e = engine.getEntrancePosition();
            focusToCell(e.y, e.x, Math.max(1.2, camera.zoom));
          }}
        >
          敵入口へ移動
        </button>
        {([0, 1, 2, 3, 4] as const).map((layer) => (
          <button
            key={`layer-focus-${layer}`}
            type="button"
            className="dlBtnSmall"
            onClick={() => {
              const centerRow = layer * DEPTH_LAYER_HEIGHT + Math.floor(DEPTH_LAYER_HEIGHT * 0.5);
              focusToCell(centerRow, Math.floor(GRID_COLS * 0.5), Math.max(0.92, camera.zoom));
            }}
          >
            {DEPTH_LAYER_COLORS[layer].name}
          </button>
        ))}
      </div>

      <canvas
        ref={canvasRef}
        className="dlCanvas"
        onContextMenu={(event) => {
          event.preventDefault();
          const pos = pointToCell(event.clientX, event.clientY);
          if (!pos) return;
          onSelectCell(engine.getCellAt(pos.row, pos.col));
        }}
        onWheel={(event) => {
          event.preventDefault();
          const pivotX = event.clientX;
          const pivotY = event.clientY;
          const prevZoom = camera.zoom;
          const nextZoom = clamp(event.deltaY < 0 ? prevZoom * 1.08 : prevZoom / 1.08, 0.55, 2.4);

          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;
          const beforeX = (pivotX - rect.left - camera.offsetX) / prevZoom;
          const beforeY = (pivotY - rect.top - camera.offsetY) / prevZoom;
          const offsetX = pivotX - rect.left - beforeX * nextZoom;
          const offsetY = pivotY - rect.top - beforeY * nextZoom;
          setCamera(clampCamera({ zoom: nextZoom, offsetX, offsetY }));
        }}
        onPointerDown={(event) => {
          if (input.shouldIgnoreByUi(event.target)) return;
          if (engine.isPlacementConfirmationPhase() || engine.isCountdownPhase()) return;

          const isMiddleMouse = event.pointerType === "mouse" && event.button === 1;
          const isSpacePan = isShiftDownRef.current && event.button === 0;
          const shouldPan = cameraMode === "pan" || isMiddleMouse || isSpacePan;

          if (shouldPan) {
            isPanningRef.current = true;
            panStartRef.current = { x: event.clientX, y: event.clientY, ox: camera.offsetX, oy: camera.offsetY };
            return;
          }

          if (event.pointerType === "mouse" && event.button !== 0) return;
          event.preventDefault();
          isDraggingRef.current = true;
          engine.beginDrag();
          const pos = pointToCell(event.clientX, event.clientY);
          if (!pos) return;
          engine.digAtCell(pos.row, pos.col, false);
          onSelectCell(engine.getCellAt(pos.row, pos.col));
        }}
        onPointerMove={(event) => {
          if (isPanningRef.current) {
            const start = panStartRef.current;
            if (!start) return;
            setCamera((prev) =>
              clampCamera({
                ...prev,
                offsetX: start.ox + (event.clientX - start.x),
                offsetY: start.oy + (event.clientY - start.y),
              }),
            );
            return;
          }

          const pos = pointToCell(event.clientX, event.clientY);
          setHoverCell(pos);
          updateInspectFromPoint(event.clientX, event.clientY);
          if (!isDraggingRef.current || !pos) return;
          engine.digAtCell(pos.row, pos.col, true);
        }}
        onPointerUp={() => {
          isDraggingRef.current = false;
          isPanningRef.current = false;
          panStartRef.current = null;
          engine.endDrag();
        }}
        onPointerCancel={() => {
          isDraggingRef.current = false;
          isPanningRef.current = false;
          panStartRef.current = null;
          engine.endDrag();
        }}
        onPointerLeave={() => {
          setHoverCell(null);
          setInspectInfo(null);
        }}
        onTouchStart={(event) => {
          event.preventDefault();
          if (event.touches.length === 1) {
            const t = event.touches[0];
            if (longPressTimerRef.current) {
              if (isDeepLabPerfEnabled()) {
                deepLabPerfMonitor().registerTimerStop("longPressInspect");
              }
              window.clearTimeout(longPressTimerRef.current);
            }
            if (isDeepLabPerfEnabled()) {
              deepLabPerfMonitor().registerTimerStart("longPressInspect");
            }
            longPressTimerRef.current = window.setTimeout(() => {
              updateInspectFromPoint(t.clientX, t.clientY);
              if (isDeepLabPerfEnabled()) {
                deepLabPerfMonitor().registerTimerStop("longPressInspect");
              }
              longPressTimerRef.current = null;
            }, 450);
          }
          if (event.touches.length >= 2) {
            const center = input.getTouchCenter(event.touches);
            pinchCenterRef.current = center;
          }
          const ratio = input.updatePinchScale(event.touches);
          if (ratio) {
            setCamera((prev) => clampCamera({ ...prev, zoom: clamp(prev.zoom * ratio, 0.55, 2.4) }));
          }
        }}
        onTouchMove={(event) => {
          event.preventDefault();
          if (longPressTimerRef.current && event.touches.length > 0) {
            const touch = event.touches[0];
            updateInspectFromPoint(touch.clientX, touch.clientY);
          }
          const ratio = input.updatePinchScale(event.touches);
          if (ratio) {
            setCamera((prev) => clampCamera({ ...prev, zoom: clamp(prev.zoom * ratio, 0.55, 2.4) }));
          }

          if (event.touches.length >= 2) {
            const center = input.getTouchCenter(event.touches);
            if (pinchCenterRef.current) {
              const dx = center.x - pinchCenterRef.current.x;
              const dy = center.y - pinchCenterRef.current.y;
              setCamera((prev) => clampCamera({ ...prev, offsetX: prev.offsetX + dx, offsetY: prev.offsetY + dy }));
            }
            pinchCenterRef.current = center;
            return;
          }

          if (cameraMode === "pan" && event.touches.length === 1) {
            const t = event.touches[0];
            if (!panStartRef.current) {
              panStartRef.current = { x: t.clientX, y: t.clientY, ox: camera.offsetX, oy: camera.offsetY };
              return;
            }
            const start = panStartRef.current;
            setCamera((prev) =>
              clampCamera({
                ...prev,
                offsetX: start.ox + (t.clientX - start.x),
                offsetY: start.oy + (t.clientY - start.y),
              }),
            );
          }
        }}
        onTouchEnd={() => {
          if (longPressTimerRef.current) {
            if (isDeepLabPerfEnabled()) {
              deepLabPerfMonitor().registerTimerStop("longPressInspect");
            }
            window.clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
          panStartRef.current = null;
        }}
      />
      {inspectInfo ? (
        <div className="dlCellInfoPopover" data-ui-panel="true">
          <p>{inspectInfo.soilLabel}</p>
          <p>深度: {inspectInfo.depthLabel}</p>
          <p>魔物出現期待度: {inspectInfo.spawnTierLabel}</p>
          <p>レア期待度: {inspectInfo.rarityExpectationLabel}</p>
          <p>出現候補帯: {inspectInfo.candidateRarityBand}</p>
          {showExactSpawnRate ? <p>魔物出現確率: {Math.round(inspectInfo.spawnRate * 100)}%</p> : null}
          <p>出現候補: {inspectInfo.spawnCandidates}</p>
          <p>取得素材: {inspectInfo.materialLabel}</p>
          <p>掘削可能: {inspectInfo.diggable ? "はい" : "いいえ"}</p>
        </div>
      ) : null}
    </div>
  );
}
