import styles from "./mahjong.module.css";
import MahjongTile from "./MahjongTile";
import type { MahjongSeatPosition } from "./types";

type DiscardAreaProps = {
  tiles: number[];
  position: MahjongSeatPosition;
  riichiTileIndex: number | null;
};

export default function DiscardArea({ tiles, position, riichiTileIndex }: DiscardAreaProps) {
  const side = position === "left" || position === "right";
  const sectionClass = [styles.discardSection, side ? styles.discardSectionSide : ""].filter(Boolean).join(" ");
  const gridClass = [styles.discardGrid, side ? styles.discardGridSide : ""].filter(Boolean).join(" ");

  return (
    <div className={sectionClass}>
      <div className={gridClass}>
        {tiles.length === 0 ? <span className="text-xs text-slate-300">-</span> : null}
        {tiles.map((tile, index) => (
          <MahjongTile
            key={`discard-${index}-${tile}`}
            tile={tile}
            compact
            orientation={position}
            className={[styles.discardTile, side ? styles.sideTileRotate : ""].filter(Boolean).join(" ")}
            riichiRotate={riichiTileIndex === index}
            lastDiscard={index === tiles.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
