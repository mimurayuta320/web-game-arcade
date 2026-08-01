import styles from "./mahjong.module.css";
import type { MahjongActionButton } from "./types";

type ActionButtonsProps = {
  actions: MahjongActionButton[];
};

const toneClass = {
  primary: styles.actionPrimary,
  accent: styles.actionAccent,
  normal: "",
  subtle: styles.actionSubtle,
} as const;

export default function ActionButtons({ actions }: ActionButtonsProps) {
  return (
    <div className={styles.actionsWrap}>
      {actions.map((action) => (
        <button
          key={action.key}
          type="button"
          className={`${styles.actionBtn} ${toneClass[action.tone] || ""}`.trim()}
          onClick={action.onClick}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
