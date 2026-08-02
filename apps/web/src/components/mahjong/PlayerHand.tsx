import styles from "./mahjong.module.css";
import MahjongTile from "./MahjongTile";

type PlayerHandProps = {
  concealedHand: number[];
  drawnTile: number | null;
  selectedIndex: number | null;
  disabled?: boolean;
  selectableIndexes?: number[] | null;
  discardAnimatingIndex?: number | null;
  discardAnimatingTsumogiri?: boolean;
  onTileClick: (index: number) => void;
};

export default function PlayerHand({
  concealedHand,
  drawnTile,
  selectedIndex,
  disabled,
  selectableIndexes,
  discardAnimatingIndex = null,
  discardAnimatingTsumogiri = false,
  onTileClick,
}: PlayerHandProps) {
  const selectableSet = selectableIndexes ? new Set(selectableIndexes) : null;
  const drawnIndex = drawnTile === null ? null : concealedHand.length;

  return (
    <div className={styles.handSelf}>
      <div className={styles.normalTiles}>
        {concealedHand.map((tile, index) => (
          <MahjongTile
            key={`self-tile-${index}-${tile}`}
            tile={tile}
            orientation="bottom"
            selected={selectedIndex === index}
            className={[
              selectableSet ? (selectableSet.has(index) ? styles.tileSelectable : styles.tileDimmed) : "",
              discardAnimatingIndex === index ? styles.tileDiscardLaunching : "",
            ].filter(Boolean).join(" ")}
            onClick={() => onTileClick(index)}
            disabled={disabled || (selectableSet ? !selectableSet.has(index) : false)}
          />
        ))}
      </div>

      {drawnTile !== null && drawnIndex !== null ? (
        <div className={styles.drawnTile}>
          <MahjongTile
            key={`self-drawn-${drawnIndex}-${drawnTile}`}
            tile={drawnTile}
            orientation="bottom"
            selected={selectedIndex === drawnIndex}
            tsumo
            className={[
              selectableSet ? (selectableSet.has(drawnIndex) ? styles.tileSelectable : styles.tileDimmed) : "",
              discardAnimatingIndex === drawnIndex
                ? (discardAnimatingTsumogiri ? styles.tileDiscardLaunchingTsumo : styles.tileDiscardLaunching)
                : "",
            ].filter(Boolean).join(" ")}
            onClick={() => onTileClick(drawnIndex)}
            disabled={disabled || (selectableSet ? !selectableSet.has(drawnIndex) : false)}
          />
        </div>
      ) : null}
    </div>
  );
}
