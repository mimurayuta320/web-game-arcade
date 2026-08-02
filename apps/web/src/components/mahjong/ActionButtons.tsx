import { useEffect, useMemo, useState } from "react";
import MahjongTile from "./MahjongTile";
import styles from "./mahjong.module.css";
import type { MahjongActionButton } from "./types";

type ActionButtonsProps = {
  actions: MahjongActionButton[];
  actionDeadlineAt?: number | null;
};

const fallbackPriority: Record<string, number> = {
  ron: 1,
  tsumo: 2,
  riichi: 3,
  kan: 4,
  pon: 5,
  chi: 6,
  kita: 7,
  kyuushu: 8,
  pass: 9,
  cancel: 10,
};

const actionToneClass: Record<string, string> = {
  ron: styles.actionRon,
  tsumo: styles.actionTsumo,
  riichi: styles.actionRiichi,
  kan: styles.actionKan,
  pon: styles.actionPon,
  chi: styles.actionChi,
  kita: styles.actionKita,
  kyuushu: styles.actionAbortive,
  pass: styles.actionPass,
  cancel: styles.actionCancel,
};

export default function ActionButtons({ actions, actionDeadlineAt = null }: ActionButtonsProps) {
  const [expandedActionKey, setExpandedActionKey] = useState<string | null>(null);
  const [isAppearing, setIsAppearing] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);

  const orderedActions = useMemo(() => {
    return [...actions].sort((a, b) => {
      const pa = a.priority ?? fallbackPriority[a.key] ?? 99;
      const pb = b.priority ?? fallbackPriority[b.key] ?? 99;
      if (pa !== pb) return pa - pb;
      return a.label.localeCompare(b.label, "ja");
    });
  }, [actions]);

  const panelKey = useMemo(() => orderedActions.map((action) => `${action.key}:${action.label}`).join("|"), [orderedActions]);

  useEffect(() => {
    if (!panelKey) return;
    setIsAppearing(true);
    const timerId = window.setTimeout(() => {
      setIsAppearing(false);
    }, 280);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [panelKey]);

  useEffect(() => {
    if (!actionDeadlineAt) {
      setRemainingMs(0);
      return;
    }
    const update = () => {
      setRemainingMs(Math.max(0, actionDeadlineAt - Date.now()));
    };
    update();
    const timerId = window.setInterval(update, 200);
    return () => {
      window.clearInterval(timerId);
    };
  }, [actionDeadlineAt]);

  useEffect(() => {
    if (!expandedActionKey) return;
    const exists = orderedActions.some((action) => action.key === expandedActionKey && (action.options?.length || 0) > 0);
    if (!exists) {
      setExpandedActionKey(null);
    }
  }, [expandedActionKey, orderedActions]);

  if (orderedActions.length <= 0) return null;

  const remainingSec = Math.ceil(remainingMs / 1000);
  const showDeadline = actionDeadlineAt !== null;

  return (
    <div className={`${styles.actionsWrap} ${isAppearing ? styles.actionsWrapEnter : ""}`.trim()}>
      <div className={styles.actionGrid}>
        {orderedActions.map((action) => {
          const hasOptions = (action.options?.length || 0) > 0;
          const open = expandedActionKey === action.key;
          const passCountLabel = showDeadline && action.key === "pass" ? `${action.label} ${Math.max(0, remainingSec)}s` : action.label;
          const isReadyAction = action.key === "ron" || action.key === "tsumo";

          return (
            <div key={action.key} className={styles.actionSlot}>
              <button
                type="button"
                className={`${styles.actionBtn} ${actionToneClass[action.key] || ""} ${action.emphasis === "critical" ? styles.actionCritical : action.emphasis === "high" ? styles.actionHigh : ""}`.trim()}
                onClick={() => {
                  if (hasOptions) {
                    setExpandedActionKey((prev) => (prev === action.key ? null : action.key));
                    return;
                  }
                  action.onClick();
                }}
              >
                <span className={styles.actionLabelMain}>{passCountLabel}</span>
                {isReadyAction ? <span className={styles.actionReadyHint}>和了可能</span> : null}
                {hasOptions ? <span className={styles.actionOptionHint}>候補</span> : null}
              </button>

              {open ? (
                <div className={styles.actionOptionPanel}>
                  {action.options?.map((option) => (
                    <div key={option.key} className={styles.actionOptionItem}>
                      <button
                        type="button"
                        className={styles.actionOptionBtn}
                        onClick={() => {
                          option.onClick();
                          setExpandedActionKey(null);
                        }}
                      >
                        {option.tiles && option.tiles.length > 0 ? (
                          <span className={styles.actionOptionTileRow}>
                            {option.tiles.map((tile, index) => (
                              <MahjongTile key={`${option.key}-${tile}-${index}`} tile={tile} compact orientation="bottom" className={styles.actionOptionTile} />
                            ))}
                          </span>
                        ) : null}
                        <span className={styles.actionOptionText}>{option.label}</span>
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className={styles.actionOptionCancelBtn}
                    onClick={() => setExpandedActionKey(null)}
                  >
                    戻る
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
