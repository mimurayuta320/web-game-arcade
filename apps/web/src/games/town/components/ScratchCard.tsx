"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/app/games/town/town.module.css";
import type { ScratchPrize } from "../core/TownGame";

type Props = {
  cells: string[];
  prize: ScratchPrize;
  onRevealed: () => void;
  /** Reveal from outside (e.g. closing the shop). */
  forceReveal?: boolean;
};

const SIZE = 240;
const CELL = SIZE / 3;
const REVEAL_RATIO = 0.55;

/** 3×3 scratch card: drag to rub off the silver coat. The prize is decided by the server. */
export function ScratchCard({ cells, prize, onRevealed, forceReveal = false }: Props) {
  const coatRef = useRef<HTMLCanvasElement | null>(null);
  const [revealed, setRevealed] = useState(false);
  const drawing = useRef(false);
  const revealedRef = useRef(false);

  useEffect(() => {
    const canvas = coatRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const grad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
    grad.addColorStop(0, "#c9ccd4");
    grad.addColorStop(0.5, "#eef0f4");
    grad.addColorStop(1, "#b3b7c2");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = "rgba(90,96,110,0.55)";
    ctx.font = "bold 22px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < 9; i += 1) ctx.fillText("?", (i % 3) * CELL + CELL / 2, Math.floor(i / 3) * CELL + CELL / 2);
    revealedRef.current = false;
    setRevealed(false);
  }, [cells]);

  const finish = () => {
    if (revealedRef.current) return;
    revealedRef.current = true;
    setRevealed(true);
    onRevealed();
  };

  useEffect(() => {
    if (forceReveal && !revealedRef.current) {
      revealedRef.current = true;
      setRevealed(true);
    }
  }, [forceReveal]);

  const scratchAt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = coatRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || revealedRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * SIZE;
    const y = ((e.clientY - rect.top) / rect.height) * SIZE;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  };

  const checkProgress = () => {
    const canvas = coatRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || revealedRef.current) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let clear = 0;
    let total = 0;
    for (let i = 3; i < data.length; i += 64) {
      total += 1;
      if (data[i] === 0) clear += 1;
    }
    if (clear / total >= REVEAL_RATIO) finish();
  };

  const winning = (i: number) => revealed && cells[i] === prize.symbol;

  return (
    <div className={styles.scratchWrap}>
      <div className={styles.scratchCard} style={{ width: SIZE, height: SIZE }}>
        <div className={styles.scratchGrid}>
          {cells.map((symbol, i) => (
            <span key={i} className={styles.scratchCell} data-win={winning(i)}>
              {symbol}
            </span>
          ))}
        </div>
        <canvas
          ref={coatRef}
          className={styles.scratchCoat}
          data-revealed={revealed}
          style={{ width: SIZE, height: SIZE }}
          onPointerDown={(e) => {
            drawing.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            scratchAt(e);
          }}
          onPointerMove={(e) => {
            if (drawing.current) scratchAt(e);
          }}
          onPointerUp={() => {
            drawing.current = false;
            checkProgress();
          }}
          aria-label="スクラッチの銀色をけずる"
        />
      </div>
      {!revealed ? (
        <button type="button" className={styles.linkButton} onClick={finish}>
          ぜんぶけずる
        </button>
      ) : null}
    </div>
  );
}
