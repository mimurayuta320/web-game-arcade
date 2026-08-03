import MeldArea from "./MeldArea";
import OpponentHand from "./OpponentHand";
import PlayerHand from "./PlayerHand";
import PlayerInfo from "./PlayerInfo";
import type { ReactNode } from "react";
import styles from "./mahjong.module.css";
import type { MahjongDiscardAnimationView, MahjongPlayerView, MahjongSeatPosition, MahjongTileInstanceView } from "./types";

type PlayerAreaProps = {
  position: MahjongSeatPosition;
  player: MahjongPlayerView;
  selfConcealedHand?: MahjongTileInstanceView[];
  selfDrawnTile?: MahjongTileInstanceView | null;
  selfSelectedTileId?: string | null;
  selfActionPanel?: ReactNode;
  selfSelectableTileIds?: string[] | null;
  selfDiscardAnimation?: MahjongDiscardAnimationView | null;
  onSelfTileClick?: (payload: { tileId: string; source: "concealed" | "drawn" }) => void;
};

export default function PlayerArea({
  position,
  player,
  selfConcealedHand,
  selfDrawnTile,
  selfSelectedTileId,
  selfActionPanel,
  selfSelectableTileIds,
  selfDiscardAnimation,
  onSelfTileClick,
}: PlayerAreaProps) {
  const isBottom = position === "bottom";
  const areaClass = [
    styles.playerArea,
    position === "left" || position === "right" ? styles.playerAreaSide : "",
    position === "top" ? styles.playerAreaTop : "",
    position === "bottom" ? styles.playerAreaBottom : "",
    position === "left" ? styles.playerAreaLeft : "",
    position === "right" ? styles.playerAreaRight : "",
  ].filter(Boolean).join(" ");

  const infoNode = <PlayerInfo player={player} />;
  const handNode = isBottom && selfConcealedHand
    ? (
      <PlayerHand
        concealedHand={selfConcealedHand}
        drawnTile={selfDrawnTile ?? null}
        selectedTileId={selfSelectedTileId ?? null}
        selectableTileIds={selfSelectableTileIds ?? null}
        discardAnimatingTileId={null}
        discardAnimatingTsumogiri={selfDiscardAnimation?.isTsumogiri ?? false}
        onTileClick={(payload) => onSelfTileClick?.(payload)}
      />
    )
    : <OpponentHand count={player.handBackCount} drawnBack={player.drawnBackActive === true} rotate={position === "left" || position === "right"} position={position} />;
  const meldNode = <MeldArea melds={player.melds} position={position} />;
  const isTop = position === "top";
  const isSide = position === "left" || position === "right";

  return (
    <section className={areaClass}>
      {isTop || isSide ? (
        <>
          {infoNode}
          {handNode}
          {meldNode}
        </>
      ) : (
        <>
          <div className={styles.selfArea}>
            <div className={styles.selfActionDock}>{selfActionPanel}</div>
            <div className={styles.selfInfoDock}>{infoNode}</div>
            <div className={styles.selfHandDock}>{handNode}</div>
          </div>
          <div className={styles.selfMeldDock}>{meldNode}</div>
        </>
      )}
    </section>
  );
}
