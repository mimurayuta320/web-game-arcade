"use client";

import { useState } from "react";
import styles from "@/app/games/town/town.module.css";
import type { QuestEntry, TownGame, Wallet } from "../core/TownGame";

type Props = { game: TownGame; wallet: Wallet; onClose: () => void };

/** Number of rewards waiting to be collected (for the header badge). */
export function claimableCount(wallet: Wallet): number {
  const missions = wallet.missions.list.filter((m) => m.progress >= m.target && !m.claimed).length;
  const bonus = wallet.missions.bonus.ready && !wallet.missions.bonus.claimed ? 1 : 0;
  const achievements = wallet.achievements.filter((a) => a.progress >= a.target && !a.claimed).length;
  return missions + bonus + achievements;
}

function Row({ entry, desc, onClaim }: { entry: QuestEntry; desc?: string; onClaim: () => void }) {
  const done = entry.progress >= entry.target;
  return (
    <li className={styles.questRow} data-done={done} data-claimed={entry.claimed}>
      <div className={styles.questText}>
        <strong>{entry.label}</strong>
        {desc ? <small>{desc}</small> : null}
        <span className={styles.questBar}>
          <span style={{ width: `${Math.min(100, (entry.progress / entry.target) * 100)}%` }} />
        </span>
        <small>{entry.progress.toLocaleString()} / {entry.target.toLocaleString()}</small>
      </div>
      {entry.claimed ? (
        <span className={styles.ownedTag}>受け取りずみ</span>
      ) : (
        <button type="button" className={styles.buyButton} disabled={!done} onClick={onClaim}>
          🍬 {entry.reward.toLocaleString()}
        </button>
      )}
    </li>
  );
}

/** Daily missions (a fresh set every day) and lifetime achievements, each paying アメ. */
export function MissionPanel({ game, wallet, onClose }: Props) {
  const [tab, setTab] = useState<"daily" | "ach">("daily");
  const { list, bonus } = wallet.missions;
  const doneCount = list.filter((m) => m.claimed).length;
  const achDone = wallet.achievements.filter((a) => a.claimed).length;
  // Achievements ready to claim first, then in-progress, then claimed.
  const achievements = [...wallet.achievements].sort((a, b) => {
    const rank = (x: QuestEntry) => (x.claimed ? 2 : x.progress >= x.target ? 0 : 1);
    return rank(a) - rank(b);
  });

  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="ミッション" onClick={onClose}>
      <div className={styles.ameShop} onClick={(e) => e.stopPropagation()}>
        <div className={styles.ameShopHeader}>
          <span className={styles.ameBig}>🍬 {wallet.ame.toLocaleString()} <small>アメ</small></span>
          <button type="button" className={styles.closeButton} aria-label="とじる" onClick={onClose}>×</button>
        </div>
        <div className={styles.groupTabs} role="tablist">
          {([["daily", `📋 今日のミッション（${doneCount}/${list.length}）`], ["ach", `🏆 じっせき（${achDone}/${wallet.achievements.length}）`]] as Array<["daily" | "ach", string]>).map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} className={styles.groupTab} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>

        {tab === "daily" ? (
          <>
            <p className={styles.ameNote}>ミッションは毎日（日本時間0時）入れかわります。3つ全部受け取るとボーナス！</p>
            <ul className={styles.questList}>
              {list.map((m) => <Row key={m.id} entry={m} onClaim={() => game.claimMission(m.id)} />)}
            </ul>
            <div className={styles.questBonus} data-ready={bonus.ready && !bonus.claimed}>
              <span>🎁 全部達成ボーナス</span>
              {bonus.claimed ? (
                <span className={styles.ownedTag}>受け取りずみ</span>
              ) : (
                <button type="button" className={styles.buyButton} disabled={!bonus.ready} onClick={() => game.claimMissionBonus()}>
                  🍬 {bonus.reward}
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <p className={styles.ameNote}>やりこむほど増えるじっせき。達成したらアメを受け取ろう。</p>
            <ul className={styles.questList}>
              {achievements.map((a) => <Row key={a.id} entry={a} desc={a.desc} onClaim={() => game.claimAchievement(a.id)} />)}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
