"use client";

import { useEffect, useRef } from "react";
import { drawPet } from "../avatar/draw/pet";

type Props = { species: string; level?: number; size?: number };

/** A still portrait of a companion (shop cards, pet list). */
export function PetCanvas({ species, level = 2, size = 72 }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    const scale = size / 38;
    ctx.translate(size / 2, size - 4);
    ctx.scale(scale, scale);
    drawPet(ctx, { species, walkPhase: null, clock: 0, level });
  }, [species, level, size]);

  return <canvas ref={ref} style={{ width: size, height: size }} aria-hidden="true" />;
}
