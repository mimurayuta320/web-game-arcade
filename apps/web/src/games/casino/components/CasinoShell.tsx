"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import styles from "../casino.module.css";

type Props = {
  title: string;
  bank: number;
  ready: boolean;
  showLobbyLink?: boolean;
  children: ReactNode;
};

export function CasinoShell({ title, bank, ready, showLobbyLink = true, children }: Props) {
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <nav className={styles.headerLinks} aria-label="ナビゲーション">
          <Link className={styles.linkButton} href="/arcade?from=town">← ゲームセンター</Link>
          <Link className={styles.linkButton} href="/?area=casino">タウンへ</Link>
          {showLobbyLink ? <Link className={styles.linkButton} href="/games/casino">カジノロビー</Link> : null}
        </nav>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.bankChip} aria-live="polite">
          <span className={styles.bankLabel}>COIN</span>
          <span className={styles.bankValue}>{ready ? bank.toLocaleString("ja-JP") : "…"}</span>
        </div>
      </header>
      <main className={styles.main}>
        {children}
        <p className={styles.notice}>
          コインはこのブラウザだけで使える仮想コインです。購入・換金はできません。ブラックジャック・ポーカーと共通です。
        </p>
      </main>
    </div>
  );
}
