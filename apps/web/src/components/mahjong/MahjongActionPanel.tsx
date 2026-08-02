import ActionButtons from "./ActionButtons";
import styles from "./mahjong.module.css";
import type { MahjongActionButton } from "./types";

type MahjongActionPanelProps = {
  actions: MahjongActionButton[];
  actionDeadlineAt?: number | null;
};

export default function MahjongActionPanel({ actions, actionDeadlineAt = null }: MahjongActionPanelProps) {
  return (
    <div className={styles.mahjongActionPanel}>
      <ActionButtons actions={actions} actionDeadlineAt={actionDeadlineAt} />
    </div>
  );
}
