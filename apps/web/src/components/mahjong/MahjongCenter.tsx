import MahjongTile from "./MahjongTile";
import styles from "./mahjong.module.css";
import type { MahjongCenterInfoView, MahjongDiscardAnimationView, MahjongPlayerView } from "./types";

type CenterSeat = "top" | "right" | "bottom" | "left";

type MahjongCenterProps = {
  playerCount: 3 | 4;
  info: MahjongCenterInfoView;
  selfPlayer: MahjongPlayerView;
  topPlayer: MahjongPlayerView;
  leftPlayer: MahjongPlayerView | null;
  rightPlayer: MahjongPlayerView | null;
  selfRiichiTileIndex: number | null;
  latestDiscardSeat: CenterSeat | null;
  latestDiscardTargetable?: boolean;
  discardAnimation?: MahjongDiscardAnimationView | null;
};

function seatClassName(seat: CenterSeat): string {
  if (seat === "top") return styles.centerSeatTop;
  if (seat === "right") return styles.centerSeatRight;
  if (seat === "left") return styles.centerSeatLeft;
  return styles.centerSeatBottom;
}

function windClassName(seat: CenterSeat): string {
  if (seat === "top") return styles.windTop;
  if (seat === "right") return styles.windRight;
  if (seat === "left") return styles.windLeft;
  return styles.windBottom;
}

function scoreClassName(seat: CenterSeat): string {
  if (seat === "top") return styles.scoreTop;
  if (seat === "right") return styles.scoreRight;
  if (seat === "left") return styles.scoreLeft;
  return styles.scoreBottom;
}

export default function MahjongCenter({
  playerCount,
  info,
  selfPlayer,
  topPlayer,
  leftPlayer,
  rightPlayer,
  selfRiichiTileIndex,
  latestDiscardSeat,
  latestDiscardTargetable = false,
  discardAnimation = null,
}: MahjongCenterProps) {
  const seats: Array<{ seat: CenterSeat; player: MahjongPlayerView | null }> = [
    { seat: "top", player: topPlayer },
    { seat: "right", player: rightPlayer },
    { seat: "bottom", player: selfPlayer },
    { seat: "left", player: leftPlayer },
  ];

  const doraTiles = info.doraIndicators;
  const uraTiles = info.uraDoraIndicators;

  return (
    <div className={styles.centerArena} data-player-count={playerCount}>
      {seats.map(({ seat, player }) => {
        if (!player) return null;
        const rotateClass = seat === "top"
          ? styles.centerDiscardTop
          : seat === "left"
            ? styles.centerDiscardLeft
            : seat === "right"
              ? styles.centerDiscardRight
              : "";
        const isLatestSeat = latestDiscardSeat === seat;
        const riichiTileIndex = seat === "bottom" ? selfRiichiTileIndex : null;
        return (
          <div key={`discard-${seat}`} className={`${styles.centerDiscardSeat} ${seatClassName(seat)}`.trim()}>
            <div className={`${styles.centerDiscardTray} ${rotateClass}`.trim()}>
              <div className={styles.centerDiscardGrid}>
                {player.discards.slice(0, 18).map((tile, index) => {
                  const isLastTile = index === player.discards.length - 1;
                  const isLatestDiscardTile = isLatestSeat && isLastTile;
                  const discardClassName = [
                    styles.centerDiscardTile,
                    isLatestDiscardTile && latestDiscardTargetable ? styles.discardTargetable : "",
                  ].filter(Boolean).join(" ");
                  return (
                    <MahjongTile
                      key={`${seat}-${index}-${tile}`}
                      tile={tile}
                      compact
                      orientation={seat}
                      className={discardClassName}
                      riichiRotate={riichiTileIndex === index}
                      lastDiscard={isLatestDiscardTile}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      {discardAnimation ? (
        <div className={`${styles.centerDiscardFlightSeat} ${seatClassName(discardAnimation.seat as CenterSeat)}`.trim()}>
          <div
            className={[
              styles.centerDiscardFlightTile,
              discardAnimation.seat === "top"
                ? styles.centerDiscardFlightTop
                : discardAnimation.seat === "left"
                  ? styles.centerDiscardFlightLeft
                  : discardAnimation.seat === "right"
                    ? styles.centerDiscardFlightRight
                    : styles.centerDiscardFlightBottom,
            ].join(" ")}
            style={{ animationDuration: `${Math.max(180, Math.min(380, discardAnimation.durationMs))}ms` }}
          >
            <MahjongTile
              tile={discardAnimation.tile}
              compact
              orientation={discardAnimation.seat}
              className={`${styles.centerDiscardTile} ${styles.centerDiscardTileFlight}`.trim()}
            />
          </div>
        </div>
      ) : null}

      <div className={styles.doraPocket}>
        <p className={styles.centerSmallLabel}>ドラ</p>
        <div className={styles.doraPocketTiles}>
          {doraTiles.length === 0 ? <span className={styles.centerTinyText}>-</span> : null}
          {doraTiles.map((tile, index) => (
            <MahjongTile key={`dora-${index}-${tile}`} tile={tile} compact orientation="bottom" className={`${styles.centerDiscardTile} ${styles.doraTile}`.trim()} />
          ))}
        </div>
        {uraTiles.length > 0 ? (
          <>
            <p className={styles.centerSmallLabel}>裏</p>
            <div className={styles.doraPocketTiles}>
              {uraTiles.map((tile, index) => (
                <MahjongTile key={`ura-${index}-${tile}`} tile={tile} compact orientation="bottom" className={`${styles.centerDiscardTile} ${styles.doraTile}`.trim()} />
              ))}
            </div>
          </>
        ) : null}
      </div>

      <div className={styles.centerStatusPanel}>
        <div className={styles.centerRoundLine}>{info.roundLabel}</div>
        <div className={styles.centerRemainLine}>残{Math.max(0, info.remainingTiles)}</div>
        <div className={styles.centerMetaLine}>本場 {info.honba} / 供託 {info.kyotaku}</div>
      </div>

      {seats.map(({ seat, player }) => {
        if (!player) return null;
        return (
          <div
            key={`wind-${seat}`}
            className={`${styles.windBadge} ${windClassName(seat)} ${seat === "bottom" ? styles.windBadgeSelf : ""} ${player.isDealer ? styles.windBadgeDealer : ""}`.trim()}
          >
            <span>{player.wind}</span>
            {player.isDealer ? <span className={styles.oyaMark}>親</span> : null}
          </div>
        );
      })}

      {seats.map(({ seat, player }) => {
        if (!player) return null;
        return (
          <div
            key={`score-${seat}`}
            className={`${styles.centerScore} ${scoreClassName(seat)} ${seat === "bottom" ? styles.centerScoreSelf : ""}`.trim()}
          >
            {Math.max(0, player.score).toLocaleString()}
          </div>
        );
      })}
    </div>
  );
}