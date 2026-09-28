"use client";

import styles from "@/app/games/town/town.module.css";
import type { TownGame, Wallet } from "../core/TownGame";
import { CROPS, GARDEN, PET_CONFIG } from "../shared/shop";

type Props = { game: TownGame; wallet: Wallet; onClose: () => void };

function minutes(ms: number): string {
  const m = Math.round(ms / 60000);
  return m >= 60 ? `${Math.floor(m / 60)}時間${m % 60 ? `${m % 60}分` : ""}` : `${m}分`;
}

/** Garden shop: seeds to plant in your plots, selling the harvest, and pet food. */
export function GardenPanel({ game, wallet, onClose }: Props) {
  const goods = CROPS.filter((c) => (wallet.goods[c.id] ?? 0) > 0);
  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="ガーデンショップ" onClick={onClose}>
      <div className={styles.ameShop} onClick={(e) => e.stopPropagation()}>
        <div className={styles.ameShopHeader}>
          <span className={styles.ameBig}>🍬 {wallet.ame.toLocaleString()} <small>アメ</small></span>
          <button type="button" className={styles.closeButton} aria-label="とじる" onClick={onClose}>×</button>
        </div>
        <p className={styles.ameNote}>
          「畑」（マイルームの家具・にわ）にたねをまいて育てよう。畑をクリックすると植える・水やり・収穫ができます。
          水やりは1回で成長が早まります（最大{GARDEN.maxWater}回・{Math.round(GARDEN.waterCooldownMs / 1000)}秒に1回）。友だちの畑にも水やりできて、お礼のアメがもらえます。
        </p>

        <section className={styles.ameSection}>
          <h3 className={styles.ameHeading}>🌱 たね</h3>
          <div className={styles.shopGrid}>
            {CROPS.map((c) => (
              <div key={c.id} className={styles.shopItem}>
                <span className={styles.shopEmoji}>{c.emoji}</span>
                <span className={styles.shopLabel}>{c.label}</span>
                <small className={styles.shopDesc}>
                  {minutes(c.growMs)}で実る ・ 収穫{c.yield[0]}〜{c.yield[1]} ・ 売値{c.sell}🍬
                </small>
                <small className={styles.ownedTag}>もってる: {wallet.seeds[c.id] ?? 0}</small>
                <div className={styles.buyRow}>
                  {[1, 5].map((n) => (
                    <button key={n} type="button" className={styles.buyButton} disabled={wallet.ame < c.seedPrice * n} onClick={() => game.buySeed(c.id, n)}>
                      ×{n} 🍬{(c.seedPrice * n).toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.ameSection}>
          <h3 className={styles.ameHeading}>🧺 しゅうかくぶつ</h3>
          {goods.length === 0 ? (
            <p className={styles.ameNote}>まだ収穫物がありません。売ればアメに、ペットのごはんにもなります。</p>
          ) : (
            <div className={styles.shopGrid}>
              {goods.map((c) => {
                const n = wallet.goods[c.id] ?? 0;
                return (
                  <div key={c.id} className={styles.shopItem}>
                    <span className={styles.shopEmoji}>{c.emoji}</span>
                    <span className={styles.shopLabel}>{c.label} ×{n}</span>
                    <button type="button" className={styles.buyButton} onClick={() => game.sellGoods(c.id, true)}>
                      ぜんぶ売る 🍬{(c.sell * n).toLocaleString()}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className={styles.ameSection}>
          <h3 className={styles.ameHeading}>🍖 ペットフード</h3>
          <div className={styles.shopGrid}>
            <div className={styles.shopItem}>
              <span className={styles.shopEmoji}>🍖</span>
              <span className={styles.shopLabel}>ペットフード（もってる: {wallet.petFood}）</span>
              <small className={styles.shopDesc}>おなかを{PET_CONFIG.foodValue}回復・なかよし度+{PET_CONFIG.feedBond}</small>
              <div className={styles.buyRow}>
                {[1, 5, 10].map((n) => (
                  <button key={n} type="button" className={styles.buyButton} disabled={wallet.ame < PET_CONFIG.foodPrice * n} onClick={() => game.buyPetFood(n)}>
                    ×{n} 🍬{PET_CONFIG.foodPrice * n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
