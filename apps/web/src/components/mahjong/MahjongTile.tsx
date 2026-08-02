import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./mahjong.module.css";
import type { MahjongTileCode } from "./types";
import { getMahjongSpriteMeta, tileNumberToSpriteCode } from "./tileSprite";

type DebugPayload = {
  enabled?: boolean;
};

type MahjongTileProps = {
  tile: number | MahjongTileCode;
  compact?: boolean;
  faceDown?: boolean;
  orientation?: "bottom" | "top" | "left" | "right";
  className?: string;
  selected?: boolean;
  tsumo?: boolean;
  lastDiscard?: boolean;
  riichiRotate?: boolean;
  onClick?: () => void;
  disabled?: boolean;
};

export default function MahjongTile({
  tile,
  compact = false,
  faceDown = false,
  orientation = "bottom",
  className,
  selected = false,
  tsumo = false,
  lastDiscard = false,
  riichiRotate = false,
  onClick,
  disabled,
}: MahjongTileProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);
  const [debugRect, setDebugRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [debugEnabled, setDebugEnabled] = useState(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.dataset.mahjongTileDebug === "1";
  });

  const tileCode = useMemo<MahjongTileCode>(() => {
    if (faceDown) return "back";
    return typeof tile === "number" ? tileNumberToSpriteCode(tile) : tile;
  }, [faceDown, tile]);

  const baseClass = compact ? styles.tileMini : styles.tileBtn;
  const stateClass = [
    className ?? "",
    selected ? styles.tileSelected : "",
    tsumo ? styles.tileTsumo : "",
    lastDiscard ? styles.discardTileLast : "",
    riichiRotate ? styles.discardRiichi : "",
  ].filter(Boolean).join(" ");

  useEffect(() => {
    const readFlag = () => {
      if (typeof document === "undefined") return false;
      return document.documentElement.dataset.mahjongTileDebug === "1";
    };

    const onToggle = (event: Event) => {
      const detail = (event as CustomEvent<DebugPayload>).detail;
      if (typeof detail?.enabled === "boolean") {
        setDebugEnabled(detail.enabled);
        return;
      }
      setDebugEnabled(readFlag());
    };

    window.addEventListener("mahjong-tile-debug-toggle", onToggle as EventListener);
    return () => {
      window.removeEventListener("mahjong-tile-debug-toggle", onToggle as EventListener);
    };
  }, []);

  useEffect(() => {
    let disposed = false;

    const draw = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const meta = await getMahjongSpriteMeta();
      if (disposed) return;

      const rect = meta.tileMap[tileCode] ?? meta.tileMap.back;
      setDebugRect(rect);
      const cssWidth = Math.max(1, Math.floor(canvas.clientWidth));
      const cssHeight = Math.max(1, Math.floor(canvas.clientHeight));
      const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
      const pixelWidth = cssWidth * dpr;
      const pixelHeight = cssHeight * dpr;

      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, pixelWidth, pixelHeight);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(
        meta.image,
        rect.x,
        rect.y,
        rect.width,
        rect.height,
        0,
        0,
        pixelWidth,
        pixelHeight,
      );

      if (!ready) setReady(true);
    };

    void draw();

    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") {
      return () => {
        disposed = true;
      };
    }

    const observer = new ResizeObserver(() => {
      void draw();
    });
    observer.observe(canvas);

    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, [tileCode, ready]);

  const tileFace = (
    <>
      {faceDown ? (
        <div className={styles.tileBackFace} aria-hidden="true">
          <span className={styles.tileBackCore} />
        </div>
      ) : (
        <canvas ref={canvasRef} className={styles.tileCanvas} aria-hidden="true" data-ready={ready ? "1" : "0"} />
      )}
      {debugEnabled && debugRect ? (
        <span className={styles.tileDebugLabel}>
          {`${tileCode} x:${debugRect.x} y:${debugRect.y}`}
        </span>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={`${baseClass} ${stateClass}`.trim()}
        onClick={onClick}
        disabled={disabled}
        data-tile-orientation={orientation}
      >
        <span className={styles.tileFace}>{tileFace}</span>
      </button>
    );
  }

  return (
    <div className={`${baseClass} ${stateClass}`.trim()} data-tile-orientation={orientation}>
      <span className={styles.tileFace}>{tileFace}</span>
    </div>
  );
}
