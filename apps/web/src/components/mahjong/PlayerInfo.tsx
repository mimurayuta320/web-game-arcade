import styles from "./mahjong.module.css";
import type { MahjongPlayerView } from "./types";

type PlayerInfoProps = {
  player: MahjongPlayerView;
};

export default function PlayerInfo({ player }: PlayerInfoProps) {
  return (
    <div className={`${styles.playerInfo} ${player.isTurn ? styles.playerInfoTurn : ""}`.trim()}>
      <div className={styles.playerIcon} aria-hidden="true">{player.icon}</div>
      <div className={styles.playerMeta}>
        <p className={styles.playerName}>{player.name}</p>
        <p className={styles.playerSub}>{player.score.toLocaleString()} / {player.wind} / {player.rank}位</p>
      </div>
      <div className={styles.playerBadges}>
        {player.isDealer ? <span className={styles.badge}>親</span> : <span className={styles.badge}>子</span>}
        {player.isRiichi ? <span className={styles.badge}>リーチ</span> : null}
        {!player.isConnected ? <span className={`${styles.badge} ${styles.badgeWarn}`}>切断</span> : null}
        <span className={styles.badge}>{player.thinkingSec}s</span>
      </div>
    </div>
  );
}
