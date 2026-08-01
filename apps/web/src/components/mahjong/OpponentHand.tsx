import styles from "./mahjong.module.css";
import MahjongTile from "./MahjongTile";

type OpponentHandProps = {
  count: number;
  rotate?: boolean;
};

export default function OpponentHand({ count, rotate = false }: OpponentHandProps) {
  return (
    <div
      className={`${styles.handRow} ${styles.handOpponent}`.trim()}
      style={rotate ? { transform: "rotate(90deg)", transformOrigin: "center" } : undefined}
    >
      {Array.from({ length: Math.max(0, count) }, (_, index) => (
        <div key={`opponent-back-${index}`} aria-label="opponent tile back">
          <MahjongTile tile="back" compact faceDown />
        </div>
      ))}
    </div>
  );
}
