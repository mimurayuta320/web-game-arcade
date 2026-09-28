"use client";

import { useEffect, useRef } from "react";
import { drawAvatar, type AvatarPose } from "../avatar/drawAvatar";
import { actionDef, type ActionId } from "../avatar/actions";
import type { AvatarConfig, ThumbFocus } from "../avatar/parts";

/** Zoomed thumbnail frames: vertical centre and span in avatar units. */
const FRAMES: Record<Exclude<ThumbFocus, "body">, { center: number; span: number }> = {
  head: { center: -48, span: 47 },
  upper: { center: -30, span: 42 },
  lower: { center: -11, span: 28 },
  feet: { center: -5, span: 16 },
};

type Props = {
  avatar: AvatarConfig;
  width: number;
  height: number;
  facing?: AvatarPose["facing"];
  flip?: boolean;
  /** Heading on screen; overrides facing/flip when given. */
  dir?: AvatarPose["dir"];
  /** Animate a walk cycle. */
  walking?: boolean;
  /** Loop an action (feelings, dances…) for previews. */
  action?: ActionId | null;
  /** Framing: whole body, or zoomed on a region (for part thumbnails). */
  focus?: ThumbFocus;
  className?: string;
};

export function AvatarCanvas({
  avatar, width, height, facing = "front", flip = false, dir, walking = false, action = null, focus = "body", className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    const animate = walking || Boolean(action);
    const loopSec = action ? Math.max(1.2, (actionDef(action)?.durationMs || 2400) / 1000 + 0.5) : 0;
    let raf = 0;
    const start = performance.now();
    const paint = (now: number) => {
      const elapsed = (now - start) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const zoomed = FRAMES[focus as Exclude<ThumbFocus, "body">];
      if (zoomed) {
        const s = (height * 0.9) / zoomed.span;
        ctx.translate(width / 2, height / 2 - zoomed.center * s);
        ctx.scale(s, s);
      } else {
        // Leave headroom for tall hats, balloons and jumps.
        const s = (height * 0.8) / 84;
        ctx.translate(width / 2, height * 0.95);
        ctx.scale(s, s);
      }
      drawAvatar(ctx, avatar, {
        facing,
        flip,
        dir,
        walkPhase: walking ? elapsed * 9 : null,
        action,
        actionTime: loopSec ? elapsed % loopSec : 0,
        clock: elapsed,
      });
      if (animate) raf = requestAnimationFrame(paint);
    };
    paint(performance.now());
    return () => cancelAnimationFrame(raf);
  }, [avatar, width, height, facing, flip, dir, walking, action, focus]);

  return <canvas ref={canvasRef} className={className} style={{ width, height }} />;
}
