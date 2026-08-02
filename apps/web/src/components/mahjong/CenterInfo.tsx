import styles from "./mahjong.module.css";
import MahjongTile from "./MahjongTile";
import type { MahjongCenterInfoView } from "./types";

type CenterInfoProps = {
  info: MahjongCenterInfoView;
};

export default function CenterInfo({ info }: CenterInfoProps) {
  const wallPreview = Math.max(0, Math.min(4, info.wallPreviewCount || 0));

  return (
    <div className={styles.centerInfo}>
      <div className={styles.centerInfoHeader}>
        <p className={styles.metaValue}>{info.roundLabel} / {info.tableWind}</p>
        <p className={styles.metaLabel}>手番: {info.turnPlayerName}</p>
        <p className={styles.metaLabel}>親: {info.dealerName}</p>
      </div>

      <div className={styles.centerInfoInlineStats}>
        <div className={styles.centerInfoChip}>
          <span className={styles.metaLabel}>本場</span>
          <span className={styles.metaValue}>{info.honba}</span>
        </div>
        <div className={styles.centerInfoChip}>
          <span className={styles.metaLabel}>供託</span>
          <span className={styles.metaValue}>{info.kyotaku}</span>
        </div>
        <div className={styles.centerInfoChip}>
          <span className={styles.metaLabel}>残り牌</span>
          <span className={styles.metaValue}>{info.remainingTiles}枚</span>
        </div>
      </div>

      <div className={styles.centerInfoBody}>
        <div className={styles.centerInfoLane}>
          <p className={styles.metaLabel}>ドラ表示</p>
          <div className={styles.doraRow}>
            {info.doraIndicators.map((tile, index) => (
              <MahjongTile key={`dora-${index}-${tile}`} tile={tile} compact orientation="bottom" className={styles.doraTile} />
            ))}
          </div>
        </div>

        <div className={styles.centerInfoLane}>
          <p className={styles.metaLabel}>裏ドラ表示</p>
          <div className={styles.doraRow}>
            {info.uraDoraIndicators.length === 0 ? <span className="text-xs text-slate-300">-</span> : null}
            {info.uraDoraIndicators.map((tile, index) => (
              <MahjongTile key={`ura-${index}-${tile}`} tile={tile} compact orientation="bottom" className={styles.doraTile} />
            ))}
          </div>
        </div>

        <div className={styles.centerInfoLane}>
          <div className={styles.wallHeaderRow}>
            <p className={styles.metaLabel}>山牌（簡略）</p>
            <p className={styles.metaLabel}>{info.remainingTiles}枚</p>
          </div>
          <div className={styles.wallGrid}>
            {Array.from({ length: wallPreview }, (_, index) => (
              <MahjongTile key={`wall-${index}`} tile="back" compact faceDown orientation="top" className={styles.wallTile} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
