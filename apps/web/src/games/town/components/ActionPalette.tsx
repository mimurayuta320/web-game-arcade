"use client";

import { useState } from "react";
import styles from "@/app/games/town/town.module.css";
import { ACTIONS, ACTION_CATEGORIES, type ActionCategory, type ActionId } from "../avatar/actions";

type Props = {
  onAct: (action: ActionId) => void;
  onClose: () => void;
};

/** Pigg-style action list, grouped by feeling / greeting / move. */
export function ActionPalette({ onAct, onClose }: Props) {
  const [category, setCategory] = useState<ActionCategory>("feel");
  return (
    <div className={styles.actionPalette} role="dialog" aria-label="アクション">
      <div className={styles.actionTabs} role="tablist">
        {ACTION_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={category === c.id}
            className={styles.categoryTab}
            onClick={() => setCategory(c.id)}
          >
            {c.label}
          </button>
        ))}
        <button type="button" className={styles.closeButton} aria-label="とじる" onClick={onClose}>
          ×
        </button>
      </div>
      <div className={styles.actionGrid}>
        {ACTIONS.filter((a) => a.category === category).map((a) => (
          <button key={a.id} type="button" className={styles.actionButton} onClick={() => onAct(a.id)}>
            <span className={styles.actionIcon} aria-hidden="true">{a.icon}</span>
            <span>{a.label}</span>
          </button>
        ))}
      </div>
      <p className={styles.actionHint}>「こんにちは」「ありがとう」「www」などの発言でも表情が変わるよ</p>
    </div>
  );
}
