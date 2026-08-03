import MahjongCenter from "./MahjongCenter";
import PlayerArea from "./PlayerArea";
import type { ReactNode } from "react";
import styles from "./mahjong.module.css";
import type { MahjongCenterInfoView, MahjongDiscardAnimationView, MahjongPlayerView, MahjongTileInstanceView } from "./types";

type MahjongTableProps = {
  playerCount: 3 | 4;
  selfPlayer: MahjongPlayerView;
  topPlayer: MahjongPlayerView;
  leftPlayer: MahjongPlayerView | null;
  rightPlayer: MahjongPlayerView | null;
  selfConcealedHand: MahjongTileInstanceView[];
  selfDrawnTile: MahjongTileInstanceView | null;
  selfSelectedTileId: string | null;
  selfActionPanel?: ReactNode;
  selfSelectableTileIds?: string[] | null;
  riichiTileIndex: number | null;
  latestDiscardSeat: "top" | "right" | "bottom" | "left" | null;
  latestDiscardTargetable?: boolean;
  discardAnimation?: MahjongDiscardAnimationView | null;
  centerInfo: MahjongCenterInfoView;
  onSelfTileClick: (payload: { tileId: string; source: "concealed" | "drawn" }) => void;
};

export default function MahjongTable({
  playerCount,
  selfPlayer,
  topPlayer,
  leftPlayer,
  rightPlayer,
  selfConcealedHand,
  selfDrawnTile,
  selfSelectedTileId,
  selfActionPanel,
  selfSelectableTileIds,
  riichiTileIndex,
  latestDiscardSeat,
  latestDiscardTargetable = false,
  discardAnimation = null,
  centerInfo,
  onSelfTileClick,
}: MahjongTableProps) {
  const gridClassName = [styles.grid, playerCount === 3 ? styles.gridPlayers3 : ""].filter(Boolean).join(" ");

  return (
    <div className={styles.table}>
      <div className={styles.ring} />
      <div className={gridClassName} data-player-count={playerCount}>
        <div className={styles.seatTop}>
          <PlayerArea
            position="top"
            player={topPlayer}
          />
        </div>
        {leftPlayer ? (
          <div className={styles.seatLeft}>
            <PlayerArea
              position="left"
              player={leftPlayer}
            />
          </div>
        ) : null}
        <div className={styles.center}>
          <MahjongCenter
            playerCount={playerCount}
            info={centerInfo}
            selfPlayer={selfPlayer}
            topPlayer={topPlayer}
            leftPlayer={leftPlayer}
            rightPlayer={rightPlayer}
            selfRiichiTileIndex={riichiTileIndex}
            latestDiscardSeat={latestDiscardSeat}
            latestDiscardTargetable={latestDiscardTargetable}
            discardAnimation={discardAnimation}
          />
        </div>
        {rightPlayer ? (
          <div className={styles.seatRight}>
            <PlayerArea
              position="right"
              player={rightPlayer}
            />
          </div>
        ) : null}
        <div className={styles.seatBottom}>
          <PlayerArea
            position="bottom"
            player={selfPlayer}
            selfConcealedHand={selfConcealedHand}
            selfDrawnTile={selfDrawnTile}
            selfSelectedTileId={selfSelectedTileId}
            selfActionPanel={selfActionPanel}
            selfSelectableTileIds={selfSelectableTileIds}
            selfDiscardAnimation={discardAnimation && discardAnimation.seat === "bottom" ? discardAnimation : null}
            onSelfTileClick={onSelfTileClick}
          />
        </div>
      </div>
    </div>
  );
}
