"use client";

import { useState } from "react";
import styles from "@/app/games/town/town.module.css";
import type { TownGame, Wallet } from "../core/TownGame";
import {
  CROPS, FERTS, GARDEN, GARDEN_ITEMS, GARDEN_TOOLS, PET_CONFIG, RECIPES, cropDef, recipeDef, type Season,
} from "../shared/shop";
import { SEASON_LABEL, maxPlotsFor, gardenSizeFor, seasonOf, xpForLevel } from "../shared/gardenRules.mjs";
import { formatDuration } from "../world/garden";

export type GardenBookTab = "shop" | "bag" | "cook" | "orders" | "dex" | "level";

type Props = { game: TownGame; wallet: Wallet; initialTab?: GardenBookTab; onClose: () => void };

const TABS: Array<[GardenBookTab, string]> = [
  ["shop", "🛒 ショップ"],
  ["bag", "🧺 もちもの"],
  ["cook", "🍳 りょうり"],
  ["orders", "📦 ちゅうもん"],
  ["dex", "📖 ずかん"],
  ["level", "⭐ レベル"],
];

function nameOf(id: string): string {
  const c = cropDef(id);
  if (c) return `${c.emoji}${c.label}`;
  const r = recipeDef(id);
  return r ? `${r.emoji}${r.label}` : id;
}

/** ガーデン手帳: seeds & tools shop, inventory & selling, cooking, daily orders, crop dex and level. */
export function GardenBook({ game, wallet, initialTab = "shop", onClose }: Props) {
  const [tab, setTab] = useState<GardenBookTab>(initialTab);
  const g = wallet.garden;
  const level = g.level;
  const season = seasonOf(Date.now()) as Season;
  const nextXp = xpForLevel(level + 1);
  const curXp = xpForLevel(level);
  const xpPct = level >= GARDEN.maxLevel ? 100 : Math.round(((g.xp - curXp) / Math.max(1, nextXp - curXp)) * 100);

  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="ガーデン手帳" onClick={onClose}>
      <div className={`${styles.ameShop} ${styles.gardenBook}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.ameShopHeader}>
          <span className={styles.gardenBookTitle}>
            🌱 ガーデン手帳 <small>Lv.{level} ・ {SEASON_LABEL[season]} ・ 🍬 {wallet.ame.toLocaleString()}</small>
          </span>
          <button type="button" className={styles.closeButton} aria-label="とじる" onClick={onClose}>×</button>
        </div>
        <div className={styles.xpBar} aria-label={`けいけんち ${xpPct}%`}>
          <span style={{ width: `${xpPct}%` }} />
        </div>
        <div className={styles.gardenTabs} role="tablist">
          {TABS.map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} className={styles.categoryTab} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>

        {tab === "shop" ? (
          <section className={styles.ameSection}>
            <h3 className={styles.ameHeading}>🌱 たね</h3>
            <div className={styles.shopGrid}>
              {CROPS.filter((c) => !c.rare).map((c) => {
                const locked = c.unlock > level;
                const offSeason = Boolean(c.season && c.season !== season);
                return (
                  <div key={c.id} className={styles.shopItem} data-locked={locked || offSeason}>
                    <span className={styles.shopEmoji}>{c.emoji}</span>
                    <span className={styles.shopLabel}>
                      {c.label}
                      {c.season ? <em className={styles.seasonTag} data-season={c.season}>{SEASON_LABEL[c.season]}</em> : null}
                    </span>
                    <small className={styles.shopDesc}>
                      {formatDuration(c.growMs)}で実る ・ 収穫{c.yield[0]}〜{c.yield[1]} ・ 売値{c.sell}🍬
                    </small>
                    <small className={styles.ownedTag}>もってる: {wallet.seeds[c.id] ?? 0}</small>
                    {locked ? (
                      <span className={styles.lockTag}>Lv.{c.unlock}で解放</span>
                    ) : offSeason ? (
                      <span className={styles.lockTag}>{SEASON_LABEL[c.season!]}だけ</span>
                    ) : (
                      <div className={styles.buyRow}>
                        {[1, 5].map((n) => (
                          <button key={n} type="button" className={styles.buyButton} disabled={wallet.ame < c.seedPrice * n} onClick={() => game.gardenShop("seed", c.id, n)}>
                            ×{n} 🍬{(c.seedPrice * n).toLocaleString()}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <h3 className={styles.ameHeading}>🟤 ひりょう</h3>
            <div className={styles.shopGrid}>
              {FERTS.filter((f) => f.price > 0).map((f) => {
                const locked = (f.unlock ?? 1) > level;
                return (
                  <div key={f.id} className={styles.shopItem} data-locked={locked}>
                    <span className={styles.shopEmoji}>{f.emoji}</span>
                    <span className={styles.shopLabel}>{f.label}</span>
                    <small className={styles.shopDesc}>{f.desc}</small>
                    <small className={styles.ownedTag}>もってる: {g.ferts[f.id] ?? 0}</small>
                    {locked ? (
                      <span className={styles.lockTag}>Lv.{f.unlock}で解放</span>
                    ) : (
                      <div className={styles.buyRow}>
                        {[1, 5].map((n) => (
                          <button key={n} type="button" className={styles.buyButton} disabled={wallet.ame < f.price * n} onClick={() => game.gardenShop("fert", f.id, n)}>
                            ×{n} 🍬{f.price * n}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <h3 className={styles.ameHeading}>🧰 どうぐ・せつび</h3>
            <div className={styles.shopGrid}>
              {[...GARDEN_TOOLS.map((t) => ({ ...t, kind: "tool" as const })), ...GARDEN_ITEMS.map((i) => ({ ...i, kind: "item" as const }))].map((t) => {
                const locked = t.unlock > level;
                const owned = t.kind === "tool" && g.tools.includes(t.id);
                return (
                  <div key={t.id} className={styles.shopItem} data-locked={locked} data-owned={owned}>
                    <span className={styles.shopEmoji}>{t.emoji}</span>
                    <span className={styles.shopLabel}>{t.label}</span>
                    <small className={styles.shopDesc}>{t.desc}</small>
                    {t.kind === "item" ? <small className={styles.ownedTag}>もってる: {g.items[t.id] ?? 0}（置いてない分）</small> : null}
                    {locked ? (
                      <span className={styles.lockTag}>Lv.{t.unlock}で解放</span>
                    ) : owned ? (
                      <span className={styles.ownedTag}>もってる</span>
                    ) : (
                      <button type="button" className={styles.buyButton} disabled={wallet.ame < t.price} onClick={() => game.gardenShop(t.kind, t.id)}>
                        🍬 {t.price}
                      </button>
                    )}
                  </div>
                );
              })}
              <div className={styles.shopItem}>
                <span className={styles.shopEmoji}>🍖</span>
                <span className={styles.shopLabel}>ペットフード</span>
                <small className={styles.shopDesc}>おなかを{PET_CONFIG.foodValue}回復</small>
                <small className={styles.ownedTag}>もってる: {wallet.petFood}</small>
                <div className={styles.buyRow}>
                  {[1, 5].map((n) => (
                    <button key={n} type="button" className={styles.buyButton} disabled={wallet.ame < PET_CONFIG.foodPrice * n} onClick={() => game.buyPetFood(n)}>
                      ×{n} 🍬{PET_CONFIG.foodPrice * n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {tab === "bag" ? (
          <section className={styles.ameSection}>
            <p className={styles.ameNote}>
              たね {Object.values(wallet.seeds).reduce((a, b) => a + b, 0)}こ
              {g.mystery ? ` ・ ✨ふしぎなたね ${g.mystery}こ` : ""}
              {Object.entries(g.ferts).length ? ` ・ ${Object.entries(g.ferts).map(([id, n]) => `${FERTS.find((f) => f.id === id)?.emoji ?? ""}${n}`).join(" ")}` : ""}
            </p>
            <h3 className={styles.ameHeading}>🧺 しゅうかくぶつ</h3>
            <GoodsGrid
              entries={CROPS.filter((c) => (wallet.goods[c.id] ?? 0) > 0).map((c) => ({ id: c.id, n: wallet.goods[c.id], unit: c.sell }))}
              empty="まだ収穫物がありません"
              onSell={(id) => game.gardenSell("crop", id)}
            />
            <h3 className={styles.ameHeading}>★ きんの作物 <small>（5倍で売れる）</small></h3>
            <GoodsGrid
              entries={CROPS.filter((c) => (g.gold[c.id] ?? 0) > 0).map((c) => ({ id: c.id, n: g.gold[c.id], unit: c.sell * 5, gold: true }))}
              empty="よく水やりすると、まれに★きんの作物がとれます"
              onSell={(id) => game.gardenSell("gold", id)}
            />
            <h3 className={styles.ameHeading}>🍽 りょうり</h3>
            <GoodsGrid
              entries={RECIPES.filter((r) => (g.dishes[r.id] ?? 0) > 0).map((r) => ({ id: r.id, n: g.dishes[r.id], unit: r.sell }))}
              empty="「りょうり」タブで作れます"
              onSell={(id) => game.gardenSell("dish", id)}
            />
          </section>
        ) : null}

        {tab === "cook" ? (
          <section className={styles.ameSection}>
            <p className={styles.ameNote}>収穫した作物でりょうりを作ろう。高く売れて、ペットのごはんや「ちゅうもん」にも使えます。</p>
            <div className={styles.recipeList}>
              {RECIPES.map((r) => {
                const locked = r.unlock > level;
                const ready = !locked && Object.entries(r.ingredients).every(([id, n]) => (wallet.goods[id] ?? 0) >= n);
                return (
                  <div key={r.id} className={styles.recipeCard} data-locked={locked}>
                    <span className={styles.shopEmoji}>{locked ? "❓" : r.emoji}</span>
                    <div className={styles.recipeBody}>
                      <strong>{locked ? `？？？（Lv.${r.unlock}）` : r.label}</strong>
                      <span className={styles.recipeIngredients}>
                        {Object.entries(r.ingredients).map(([id, n]) => {
                          const have = wallet.goods[id] ?? 0;
                          return (
                            <span key={id} data-short={have < n}>
                              {nameOf(id)} {have}/{n}
                            </span>
                          );
                        })}
                      </span>
                      <small>売値 {r.sell}🍬{r.feed ? ` ・ ペット ${r.feed}` : ""}{g.cooked[r.id] ? ` ・ 作った回数 ${g.cooked[r.id]}` : ""}</small>
                    </div>
                    <button type="button" className={styles.buyButton} disabled={!ready} onClick={() => game.cook(r.id)}>
                      つくる
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {tab === "orders" ? (
          <section className={styles.ameSection}>
            <p className={styles.ameNote}>毎日かわる「のうえんのちゅうもん」。作物やりょうりをとどけて、アメとけいけんちをもらおう。</p>
            <div className={styles.recipeList}>
              {g.orders.list.map((o) => {
                const ready = Object.entries(o.needs).every(([id, n]) => ((cropDef(id) ? wallet.goods[id] : g.dishes[id]) ?? 0) >= n);
                return (
                  <div key={o.id} className={styles.recipeCard} data-done={o.done}>
                    <span className={styles.shopEmoji}>{o.done ? "✅" : "📦"}</span>
                    <div className={styles.recipeBody}>
                      <span className={styles.recipeIngredients}>
                        {Object.entries(o.needs).map(([id, n]) => {
                          const have = (cropDef(id) ? wallet.goods[id] : g.dishes[id]) ?? 0;
                          return (
                            <span key={id} data-short={!o.done && have < n}>
                              {nameOf(id)} {o.done ? n : `${have}/${n}`}
                            </span>
                          );
                        })}
                      </span>
                      <small>ごほうび 🍬{o.ame} ・ ⭐{o.xp}</small>
                    </div>
                    {o.done ? (
                      <span className={styles.ownedTag}>とどけた</span>
                    ) : (
                      <div className={styles.orderButtons}>
                        <button type="button" className={styles.buyButton} disabled={!ready} onClick={() => game.deliverOrder(o.id)}>とどける</button>
                        <button type="button" className={styles.linkButton} disabled={wallet.ame < GARDEN.orders.refreshCost} onClick={() => game.refreshOrder(o.id)}>
                          いれかえ（🍬{GARDEN.orders.refreshCost}）
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {tab === "dex" ? (
          <section className={styles.ameSection}>
            <p className={styles.ameNote}>
              {Object.keys(g.dex).length}/{CROPS.length} しゅるい（{g.dexPct}%）・ ★きん {Object.values(g.dex).reduce((a, d) => a + d.gold, 0)}こ
            </p>
            <div className={styles.dexMilestones}>
              {GARDEN.dexMilestones.map((m) => {
                const claimed = g.dexClaimed.includes(m.pct);
                return (
                  <button key={m.pct} type="button" className={styles.chip} data-active={claimed} disabled={claimed || g.dexPct < m.pct} onClick={() => game.claimDex(m.pct)}>
                    {m.pct}% {claimed ? "✓" : `🍬${m.ame}`}
                  </button>
                );
              })}
            </div>
            <div className={styles.dexGrid}>
              {CROPS.map((c) => {
                const entry = g.dex[c.id];
                return (
                  <div key={c.id} className={styles.dexCell} data-found={Boolean(entry)} title={entry ? c.label : "？？？"}>
                    <span className={styles.shopEmoji}>{entry ? c.emoji : "❔"}</span>
                    <small>{entry ? c.label : c.rare ? "レア" : "？？？"}</small>
                    {entry ? <small className={styles.dexCount}>{entry.n}{entry.gold ? ` ★${entry.gold}` : ""}</small> : null}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {tab === "level" ? (
          <section className={styles.ameSection}>
            <p className={styles.ameNote}>
              ガーデンレベル {level}（けいけんち {g.xp}{level < GARDEN.maxLevel ? ` / つぎまで ${nextXp - g.xp}` : " ・ さいだい"}）
              <br />
              畑 さいだい {maxPlotsFor(level, GARDEN)}まい ・ ガーデン {gardenSizeFor(level, GARDEN)}×{gardenSizeFor(level, GARDEN)}
              {g.helped ? ` ・ おてつだい ${g.helped}回` : ""}
            </p>
            <h3 className={styles.ameHeading}>これから解放されるもの</h3>
            <ul className={styles.unlockList}>
              {Array.from({ length: Math.min(6, GARDEN.maxLevel - level) }, (_, i) => level + 1 + i).map((lv) => {
                const things = [
                  ...CROPS.filter((c) => !c.rare && c.unlock === lv).map((c) => `${c.emoji}${c.label}`),
                  ...RECIPES.filter((r) => r.unlock === lv).map((r) => `${r.emoji}${r.label}`),
                  ...GARDEN_TOOLS.filter((t) => t.unlock === lv).map((t) => `${t.emoji}${t.label}`),
                  ...GARDEN_ITEMS.filter((t) => t.unlock === lv).map((t) => `${t.emoji}${t.label}`),
                  ...FERTS.filter((f) => f.unlock === lv).map((f) => `${f.emoji}${f.label}`),
                ];
                if (gardenSizeFor(lv, GARDEN) > gardenSizeFor(lv - 1, GARDEN)) things.push(`ガーデン${gardenSizeFor(lv, GARDEN)}×${gardenSizeFor(lv, GARDEN)}`);
                return (
                  <li key={lv}>
                    <strong>Lv.{lv}</strong> 畑{maxPlotsFor(lv, GARDEN)}まい{things.length ? ` ・ ${things.join("・")}` : ""}
                  </li>
                );
              })}
            </ul>
            <h3 className={styles.ameHeading}>けいけんちのもらいかた</h3>
            <p className={styles.ameNote}>
              収穫（いちばん多い）・ ちゅうもん ・ りょうり ・ 雑草とり ・ 水やり ・ 友だちのガーデンのおてつだい
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function GoodsGrid({ entries, empty, onSell }: {
  entries: Array<{ id: string; n: number; unit: number; gold?: boolean }>;
  empty: string;
  onSell: (id: string) => void;
}) {
  if (entries.length === 0) return <p className={styles.ameNote}>{empty}</p>;
  return (
    <div className={styles.shopGrid}>
      {entries.map((e) => (
        <div key={e.id} className={styles.shopItem} data-gold={e.gold}>
          <span className={styles.shopLabel}>{e.gold ? "★" : ""}{nameOf(e.id)} ×{e.n}</span>
          <button type="button" className={styles.buyButton} onClick={() => onSell(e.id)}>
            ぜんぶ売る 🍬{(e.unit * e.n).toLocaleString()}
          </button>
        </div>
      ))}
    </div>
  );
}
