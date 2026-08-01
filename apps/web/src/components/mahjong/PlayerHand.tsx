import styles from "./mahjong.module.css";
import MahjongTile from "./MahjongTile";

type PlayerHandProps = {
  hand: number[];
  selectedIndex: number | null;
  tsumoIndex: number | null;
  disabled?: boolean;
  onTileClick: (index: number) => void;
};

export default function PlayerHand({
  hand,
  selectedIndex,
  tsumoIndex,
  disabled,
  onTileClick,
}: PlayerHandProps) {
  return (
    <div className={`${styles.handRow} ${styles.handSelf}`.trim()}>
      {hand.map((tile, index) => (
        <MahjongTile
          key={`self-tile-${index}-${tile}`}
          tile={tile}
          selected={selectedIndex === index}
          tsumo={tsumoIndex === index}
          onClick={() => onTileClick(index)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
