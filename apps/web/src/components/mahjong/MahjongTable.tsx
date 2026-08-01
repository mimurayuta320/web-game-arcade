import CenterInfo from "./CenterInfo";
import PlayerArea from "./PlayerArea";
import styles from "./mahjong.module.css";
import type { MahjongCenterInfoView, MahjongPlayerView } from "./types";

type MahjongTableProps = {
  selfPlayer: MahjongPlayerView;
  topPlayer: MahjongPlayerView;
  leftPlayer: MahjongPlayerView;
  rightPlayer: MahjongPlayerView;
  selfHand: number[];
  selfSelectedIndex: number | null;
  selfTsumoIndex: number | null;
  riichiTileIndex: number | null;
  centerInfo: MahjongCenterInfoView;
  onSelfTileClick: (index: number) => void;
};

export default function MahjongTable({
  selfPlayer,
  topPlayer,
  leftPlayer,
  rightPlayer,
  selfHand,
  selfSelectedIndex,
  selfTsumoIndex,
  riichiTileIndex,
  centerInfo,
  onSelfTileClick,
}: MahjongTableProps) {
  return (
    <div className={styles.table}>
      <div className={styles.ring} />
      <div className={styles.grid}>
        <div className={styles.seatTop}>
          <PlayerArea
            position="top"
            player={topPlayer}
          />
        </div>
        <div className={styles.seatLeft}>
          <PlayerArea
            position="left"
            player={leftPlayer}
          />
        </div>
        <div className={styles.center}>
          <CenterInfo info={centerInfo} />
        </div>
        <div className={styles.seatRight}>
          <PlayerArea
            position="right"
            player={rightPlayer}
          />
        </div>
        <div className={styles.seatBottom}>
          <PlayerArea
            position="bottom"
            player={selfPlayer}
            selfHand={selfHand}
            selfSelectedIndex={selfSelectedIndex}
            selfTsumoIndex={selfTsumoIndex}
            onSelfTileClick={onSelfTileClick}
            riichiTileIndex={riichiTileIndex}
          />
        </div>
      </div>
    </div>
  );
}
