import styles from "./mahjong.module.css";
import MahjongTile from "./MahjongTile";
import type { MahjongMeldView } from "./types";

type MeldAreaProps = {
  melds: MahjongMeldView[];
};

export default function MeldArea({ melds }: MeldAreaProps) {
  if (melds.length === 0) {
    return <div className={styles.meldRow} aria-label="meld area" />;
  }

  return (
    <div className={styles.meldRow} aria-label="meld area">
      {melds.map((meld) => (
        <div key={meld.id} className={styles.meldGroup}>
          {meld.tiles.map((tile, index) => (
            <div key={`${meld.id}-${index}`} className={meld.calledTileIndex === index ? styles.meldCalled : ""}>
              <MahjongTile tile={tile} compact />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
