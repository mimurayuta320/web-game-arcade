import styles from "./mahjong.module.css";
import MahjongTile from "./MahjongTile";

type DiscardAreaProps = {
  tiles: number[];
  riichiTileIndex: number | null;
};

export default function DiscardArea({ tiles, riichiTileIndex }: DiscardAreaProps) {
  return (
    <div className={styles.discardSection}>
      <div className={styles.discardGrid}>
        {tiles.length === 0 ? <span className="text-xs text-slate-300">-</span> : null}
        {tiles.map((tile, index) => (
          <MahjongTile
            key={`discard-${index}-${tile}`}
            tile={tile}
            compact
            riichiRotate={riichiTileIndex === index}
            lastDiscard={index === tiles.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
