"use client";

import { useEffect, useState } from "react";
import styles from "@/app/games/town/town.module.css";
import type { TownGame, Wallet } from "../core/TownGame";
import { CROPS, FERTS, GARDEN, fertDef } from "../shared/shop";
import { formatDuration, plotState, serverNow, type GardenData, type GardenPlot } from "../world/garden";

type Props = {
  game: TownGame;
  garden: GardenData;
  plot: GardenPlot;
  wallet: Wallet;
  isOwner: boolean;
  clockOffset: number;
  onClose: () => void;
};

const STAGE_LABEL = ["たねをまいたところ", "めが出てきた", "はっぱがふえてきた", "もうすぐ実りそう", "しゅうかくできる！"];

/** Everything about one garden plot, with the actions that make sense right now. */
export function GardenPlotCard({ game, garden, plot, wallet, isOwner, clockOffset, onClose }: Props) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const now = serverNow(clockOffset);
  const st = plotState(plot, garden, now);
  const crop = st.crop;
  const g = wallet.garden;
  const act = (op: string, params: Record<string, unknown> = {}) => game.gardenAct(op, { x: plot.x, y: plot.y, ...params });
  const fert = plot.crop?.fert ? fertDef(plot.crop.fert) : undefined;
  const goldChance = Math.round((GARDEN.goldBase + (st.care >= 0.8 ? GARDEN.goldCare : 0) + (fert?.goldBonus ?? 0)) * 100);
  const seeds = [
    ...CROPS.filter((c) => !c.rare && c.unlock <= garden.level && (wallet.seeds[c.id] ?? 0) > 0),
  ];

  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="畑" onClick={onClose}>
      <div className={styles.plotCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.ameShopHeader}>
          <strong>🌱 畑（{plot.x + 1}, {plot.y + 1}）</strong>
          <button type="button" className={styles.closeButton} aria-label="とじる" onClick={onClose}>×</button>
        </div>

        {crop ? (
          <>
            <p className={styles.plotStatus}>
              <span className={styles.shopEmoji}>{st.withered ? "🥀" : st.ripe ? crop.emoji : st.stage === 0 ? "🌰" : "🌱"}</span>
              <span>
                <strong>{crop.label}</strong>
                <br />
                {st.withered ? "かれてしまった…（収穫するとたいひになる）" : STAGE_LABEL[st.stage]}
                {!st.ripe ? `（あと約${formatDuration(st.ripeAt - now)}）` : ""}
              </span>
            </p>
            {!st.ripe ? (
              <div className={styles.growBar} aria-label={`成長 ${Math.round(st.progress * 100)}%`}>
                <span style={{ width: `${Math.round(st.progress * 100)}%` }} />
              </div>
            ) : null}
            <ul className={styles.plotFacts}>
              <li data-bad={!st.wet && !st.ripe}>{st.sprinkled ? "⛲ スプリンクラーでずっとしめっている" : st.wet ? `💧 しめっている（あと${formatDuration(plot.wetUntil - now)}）` : st.ripe ? "💧 —" : "🏜️ かわいている（成長がおそい）"}</li>
              {plot.weed ? <li data-bad="true">🌿 雑草がはえている（成長がおそい）</li> : null}
              {plot.bug ? <li data-bad="true">🐛 虫がいる（収穫が1へる）</li> : null}
              {st.guarded ? <li>🧍 かかしが見はっている</li> : null}
              <li>{fert ? `${fert.emoji} ${fert.label}：${fert.desc}` : "ひりょう：なし"}</li>
              {crop.season ? <li>{crop.season === garden.season ? "🌸 旬なので早く育つ" : "季節はずれ"}</li> : null}
              {!st.withered ? <li>★きんの作物になる確率 約{goldChance}%（水やりをきらさないと上がる）</li> : null}
            </ul>
            <div className={styles.petActions}>
              {!st.ripe ? (
                <button type="button" className={styles.secondaryButton} disabled={st.wet} onClick={() => act("water")}>💧 みずやり</button>
              ) : null}
              {plot.weed || plot.bug ? (
                <button type="button" className={styles.secondaryButton} onClick={() => act("weed")}>✂️ とる</button>
              ) : null}
              {isOwner && !st.ripe && !plot.crop?.fert ? FERTS.filter((f) => (g.ferts[f.id] ?? 0) > 0).map((f) => (
                <button key={f.id} type="button" className={styles.secondaryButton} onClick={() => act("fert", { fert: f.id })}>
                  {f.emoji} {f.label}
                </button>
              )) : null}
              {isOwner && st.ripe ? (
                <button type="button" className={styles.primaryButton} onClick={() => { act("harvest"); onClose(); }}>🧺 しゅうかく</button>
              ) : null}
            </div>
          </>
        ) : isOwner ? (
          <>
            <p className={styles.ameNote}>たがやした畑です。うえるたねをえらんでね。</p>
            <div className={styles.petActions}>
              {g.mystery > 0 ? (
                <button type="button" className={styles.secondaryButton} onClick={() => { act("plant", { crop: "mystery" }); onClose(); }}>✨ ふしぎなたね ×{g.mystery}</button>
              ) : null}
              {seeds.map((c) => (
                <button key={c.id} type="button" className={styles.secondaryButton} onClick={() => { act("plant", { crop: c.id }); onClose(); }}>
                  {c.emoji} {c.label} ×{wallet.seeds[c.id]}
                </button>
              ))}
              {seeds.length === 0 && g.mystery === 0 ? <span className={styles.ameNote}>たねがありません（📖手帳のショップで買えます）</span> : null}
            </div>
            {plot.weed || plot.bug ? (
              <div className={styles.petActions}>
                <button type="button" className={styles.secondaryButton} onClick={() => act("weed")}>✂️ 雑草をとる</button>
              </div>
            ) : null}
          </>
        ) : (
          <p className={styles.ameNote}>まだ何も植わっていません。</p>
        )}
      </div>
    </div>
  );
}
