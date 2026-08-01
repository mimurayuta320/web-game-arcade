import styles from "./mahjong.module.css";
import type { MahjongLogEvent } from "./types";

type GameLogProps = {
  open: boolean;
  onClose: () => void;
  events: MahjongLogEvent[];
};

export default function GameLog({ open, onClose, events }: GameLogProps) {
  if (!open) return null;

  return (
    <aside className={styles.logDrawer} aria-label="game log">
      <div className="flex items-center justify-between border-b border-slate-400/30 px-3 py-2">
        <h3 className="text-sm font-semibold text-emerald-100">ゲームログ</h3>
        <button type="button" onClick={onClose} className="rounded-md border border-slate-300/40 px-2 py-1 text-xs text-slate-200">閉じる</button>
      </div>
      <div className={styles.logPanel}>
        {events.length === 0 ? <p className="text-xs text-slate-300">ログはまだありません。</p> : null}
        {events.map((event) => {
          const toneClass = event.tone === "warn" ? styles.logWarn : event.tone === "success" ? styles.logSuccess : "";
          return (
            <article key={event.id} className={`${styles.logRow} ${toneClass}`.trim()}>
              <p className="text-[10px] text-slate-300">{event.ts}</p>
              <p className="mt-0.5 text-xs text-slate-100">{event.text}</p>
            </article>
          );
        })}
      </div>
    </aside>
  );
}
