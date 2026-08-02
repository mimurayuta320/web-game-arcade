import styles from "./mahjong.module.css";
import MahjongTile from "./MahjongTile";
import type { MahjongMeldView, MahjongSeatPosition } from "./types";

type MeldAreaProps = {
  melds: MahjongMeldView[];
  position: MahjongSeatPosition;
};

export default function MeldArea({ melds, position }: MeldAreaProps) {
  const side = position === "left" || position === "right";
  const rowClass = [styles.meldRow, side ? styles.meldRowSide : ""].filter(Boolean).join(" ");

  if (melds.length === 0) {
    return <div className={rowClass} aria-label="meld area" />;
  }

  return (
    <div className={rowClass} aria-label="meld area">
      {melds.map((meld) => (
        <div key={meld.id} className={`${styles.meldGroup} ${side ? styles.meldGroupSide : ""}`.trim()}>
          {meld.tiles.map((tile, index) => (
            <div key={`${meld.id}-${index}`} className={meld.calledTileIndex === index ? styles.meldCalled : ""}>
              <MahjongTile
                tile={tile}
                compact
                orientation={position}
                className={[styles.meldTile, side ? styles.sideTileRotate : ""].filter(Boolean).join(" ")}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
