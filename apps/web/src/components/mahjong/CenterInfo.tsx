import styles from "./mahjong.module.css";
import MahjongTile from "./MahjongTile";
import type { MahjongCenterInfoView } from "./types";

type CenterInfoProps = {
  info: MahjongCenterInfoView;
};

export default function CenterInfo({ info }: CenterInfoProps) {
  const wallPreview = Math.max(0, Math.min(8, info.wallPreviewCount || 0));

  return (
    <div className={styles.centerInfo}>
      <div className={styles.centerInfoStrong}>
        <p className={styles.metaLabel}>局 / 場風</p>
        <p className={styles.metaValue}>{info.roundLabel} / {info.tableWind}</p>
        <p className={styles.metaLabel}>手番: {info.turnPlayerName} / 親: {info.dealerName}</p>
      </div>
      <div className={styles.centerInfoStats}>
        <div className={styles.centerInfoStatItem}>
          <p className={styles.metaLabel}>本場</p>
          <p className={styles.metaValue}>{info.honba}</p>
        </div>
        <div className={styles.centerInfoStatItem}>
          <p className={styles.metaLabel}>供託</p>
          <p className={styles.metaValue}>{info.kyotaku}</p>
        </div>
        <div className={styles.centerInfoStatItem}>
          <p className={styles.metaLabel}>残り牌</p>
          <p className={styles.metaValue}>{info.remainingTiles}枚</p>
        </div>
      </div>

      <div className={styles.centerInfoGridCompact}>
        <div className={styles.centerInfoBlock}>
          <p className={styles.metaLabel}>ドラ表示</p>
          <div className={styles.doraRow}>
            {info.doraIndicators.map((tile, index) => (
              <MahjongTile key={`dora-${index}-${tile}`} tile={tile} compact />
            ))}
          </div>
        </div>
        <div className={styles.centerInfoBlock}>
          <p className={styles.metaLabel}>裏ドラ表示</p>
          <div className={styles.doraRow}>
            {info.uraDoraIndicators.length === 0 ? <span className="text-xs text-slate-300">-</span> : null}
            {info.uraDoraIndicators.map((tile, index) => (
              <MahjongTile key={`ura-${index}-${tile}`} tile={tile} compact />
            ))}
          </div>
        </div>

        <div className={styles.centerInfoBlock}>
          <div className={styles.wallHeaderRow}>
            <p className={styles.metaLabel}>山牌（表示簡略）</p>
            <p className={styles.metaLabel}>残り牌 {info.remainingTiles}</p>
          </div>
          <div className={styles.wallGrid}>
            {Array.from({ length: wallPreview }, (_, index) => (
              <MahjongTile key={`wall-${index}`} tile="back" compact faceDown className={styles.wallTile} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
