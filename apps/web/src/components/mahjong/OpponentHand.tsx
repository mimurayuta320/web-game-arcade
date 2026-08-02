import styles from "./mahjong.module.css";
import type { MahjongSeatPosition } from "./types";
import OpponentTileBack from "./OpponentTileBack";
import type { CSSProperties } from "react";

type OpponentHandProps = {
  count: number;
  rotate?: boolean;
  position: MahjongSeatPosition;
};

export default function OpponentHand({ count, rotate = false, position }: OpponentHandProps) {
  const isSide = rotate || position === "left" || position === "right";
  const safeCount = Math.max(0, count);
  const side = position === "left" ? "left" : position === "right" ? "right" : null;

  const rowClass = [
    styles.handRow,
    styles.handOpponent,
    isSide ? styles.handOpponentSide : "",
    position === "left" ? styles.handOpponentLeft : "",
    position === "right" ? styles.handOpponentRight : "",
  ].filter(Boolean).join(" ");

  const tileWrapClass = isSide ? styles.sideTileSlot : "";
  const rowStyle = { "--opponent-count": Math.max(1, safeCount) } as CSSProperties;

  return (
    <div className={rowClass} style={rowStyle}>
      {Array.from({ length: safeCount }, (_, index) => (
        <div key={`opponent-back-${index}`} className={tileWrapClass}>
          <OpponentTileBack position={position} side={isSide ? side : null} />
        </div>
      ))}
    </div>
  );
}
