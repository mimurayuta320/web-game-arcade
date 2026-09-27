"use client";

import { useEffect, useRef } from "react";
import { FURNITURE_BY_KIND, type FurnitureKind } from "../world/furniture";
import { drawFlatObject, drawObject } from "../world/objects";

type Props = { kind: FurnitureKind; color?: string; size?: number };

/** Small rendering of a furniture piece for the room editor palette. */
export function FurnitureIcon({ kind, color, size = 56 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    const def = FURNITURE_BY_KIND.get(kind);
    const w = def?.w ?? 1;
    const h = def?.h ?? 1;
    const scale = (size / 64) * (w + h > 2 ? 0.55 : 0.75);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    ctx.translate(size / 2, size * 0.72);
    ctx.scale(scale, scale);
    // Centre multi-tile pieces on the icon.
    ctx.translate(-((w - 1) - (h - 1)) * 16, -((w - 1) + (h - 1)) * 8);
    const object = { kind, x: 0, y: 0, w, h, color, flat: def?.flat };
    if (def?.flat) drawFlatObject(ctx, object);
    else drawObject(ctx, object, 0);
  }, [kind, color, size]);

  return <canvas ref={canvasRef} style={{ width: size, height: size }} aria-hidden="true" />;
}
