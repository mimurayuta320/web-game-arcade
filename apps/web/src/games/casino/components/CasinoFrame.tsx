"use client";

import { useEffect, type ReactNode } from "react";
import styles from "../casino.module.css";
import { CasinoShell } from "./CasinoShell";

type Props = {
  title: string;
  bank: number;
  ready: boolean;
  /** Inside the town: a dialog over the world instead of a full page. */
  embedded?: boolean;
  onClose?: () => void;
  /** e.g. mid-hand: closing would forfeit the stake, so it waits. */
  closeDisabled?: boolean;
  children: ReactNode;
};

/** A casino game either owns the page (header + notice) or floats over the town. */
export function CasinoFrame({ title, bank, ready, embedded = false, onClose, closeDisabled = false, children }: Props) {
  useEffect(() => {
    if (!embedded || !onClose || closeDisabled) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeDisabled, embedded, onClose]);

  if (!embedded) {
    return <CasinoShell title={title} bank={bank} ready={ready}>{children}</CasinoShell>;
  }
  return (
    <div className={styles.embedBackdrop} role="dialog" aria-modal="true" aria-label={title}>
      <div className={styles.embedPanel}>
        <div className={styles.embedHeader}>
          <h2 className={styles.title}>{title}</h2>
          <div className={styles.bankChip} aria-live="polite">
            <span className={styles.bankLabel}>COIN</span>
            <span className={styles.bankValue}>{ready ? bank.toLocaleString("ja-JP") : "…"}</span>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            aria-label={closeDisabled ? "勝負が終わると閉じられます" : "とじる"}
            title={closeDisabled ? "勝負が終わると閉じられます" : "とじる"}
            disabled={closeDisabled}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className={styles.embedBody}>{children}</div>
        <p className={styles.notice} style={{ padding: "0 16px 14px" }}>
          コインは仮想コインです（購入・換金はできません）。ゲームセンターの対戦ゲームと共通です。
        </p>
      </div>
    </div>
  );
}
