import CenterInfo from "./CenterInfo";
import DiscardArea from "./DiscardArea";
import MeldArea from "./MeldArea";
import OpponentHand from "./OpponentHand";
import PlayerHand from "./PlayerHand";
import PlayerInfo from "./PlayerInfo";
import styles from "./mahjong.module.css";
import type { MahjongCenterInfoView, MahjongPlayerView, MahjongSeatPosition } from "./types";

type PlayerAreaProps = {
  position: MahjongSeatPosition;
  player: MahjongPlayerView;
  selfHand?: number[];
  selfSelectedIndex?: number | null;
  selfTsumoIndex?: number | null;
  onSelfTileClick?: (index: number) => void;
  centerInfo?: MahjongCenterInfoView;
  riichiTileIndex?: number | null;
  compactCenter?: boolean;
};

export default function PlayerArea({
  position,
  player,
  selfHand,
  selfSelectedIndex,
  selfTsumoIndex,
  onSelfTileClick,
  centerInfo,
  riichiTileIndex,
}: PlayerAreaProps) {
  const isBottom = position === "bottom";
  const areaClass = `${styles.playerArea} ${position === "left" || position === "right" ? styles.playerAreaSide : ""}`.trim();

  return (
    <section className={areaClass}>
      <PlayerInfo player={player} />
      {isBottom && selfHand ? (
        <PlayerHand
          hand={selfHand}
          selectedIndex={selfSelectedIndex ?? null}
          tsumoIndex={selfTsumoIndex ?? null}
          onTileClick={(index) => onSelfTileClick?.(index)}
        />
      ) : (
        <OpponentHand count={player.handBackCount} rotate={position === "left" || position === "right"} />
      )}
      <MeldArea melds={player.melds} />
      <DiscardArea
        tiles={player.discards}
        riichiTileIndex={position === "bottom" ? riichiTileIndex ?? null : null}
      />
      {position === "top" && centerInfo ? <CenterInfo info={centerInfo} /> : null}
    </section>
  );
}
