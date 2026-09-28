"use client";

import { useState } from "react";
import styles from "@/app/games/town/town.module.css";
import type { AvatarConfig } from "../avatar/parts";
import type { TownGame, Wallet } from "../core/TownGame";
import type { FurnitureKind } from "../world/furniture";
import {
  BAITS, CASINO_ITEMS, POINT_SHOP, RODS, type ShopCategory, type ShopEntry, type ShopId,
} from "../shared/shop";
import { AvatarCanvas } from "./AvatarCanvas";
import { FurnitureIcon } from "./FurnitureIcon";

type Props = {
  game: TownGame;
  wallet: Wallet;
  avatar: AvatarConfig;
  /** Casino coins (kept in this browser, shared with the arcade casino games). */
  coins: number;
  initialShop: ShopId;
  onClose: () => void;
};

const CATEGORY_LABEL: Record<ShopCategory, string> = {
  rod: "つりざお", bait: "エサ", ride: "のりもの", furniture: "家具", wear: "ふく・こもの", item: "カジノアイテム",
};
const ORDER: Record<ShopId, ShopCategory[]> = {
  fishing: ["rod", "bait", "ride"],
  casino: ["item", "furniture", "ride", "wear"],
};
const ICON: Record<string, string> = {
  glass: "🎣", carbon: "🎣", master: "🏆", legend: "🌟", worm: "🪱", shrimp: "🦐", lure: "✨", glow: "💡", crab: "🦀",
  "slot-free": "🎟", "roulette-insure": "🛡", "bj-peek": "👓", "poker-redraw": "🔁",
};

function describe(entry: ShopEntry): string {
  if (entry.rod) return RODS.find((r) => r.id === entry.rod)?.desc ?? "";
  if (entry.bait) return BAITS.find((b) => b.id === entry.bait)?.desc ?? "";
  if (entry.item) return CASINO_ITEMS.find((i) => i.id === entry.item)?.desc ?? "";
  if (entry.key === "ride") return "乗ると歩くのが速くなる（着せかえの「のりもの」で使う）";
  if (entry.furniture) return "マイルームに置ける";
  return "着せかえで使える";
}

/** Pigg-style exchange counters: the tackle shop (fishing points) and the casino prize counter (coins). */
export function PointShop({ game, wallet, avatar, coins, initialShop, onClose }: Props) {
  const [shop, setShop] = useState<ShopId>(initialShop);
  const balance = shop === "fishing" ? wallet.fishPoints : coins;
  const unit = shop === "fishing" ? "釣りポイント" : "コイン";
  const mark = shop === "fishing" ? "🎣" : "🪙";

  const owned = (entry: ShopEntry): boolean =>
    Boolean(
      (entry.key && entry.part && wallet.owned.parts.includes(`${entry.key}:${entry.part}`))
      || (entry.furniture && wallet.owned.furniture.includes(entry.furniture))
      || (entry.rod && wallet.fishing.rods.includes(entry.rod)),
    );
  const stock = (entry: ShopEntry): number | null => {
    if (entry.bait) return wallet.fishing.baits[entry.bait] ?? 0;
    if (entry.item) return wallet.items[entry.item] ?? 0;
    return null;
  };

  const preview = (entry: ShopEntry) => {
    if (entry.key && entry.part) {
      // Show clothes in the colour they are meant to be seen in (the player can recolour them later).
      const tint = entry.part === "dealer" ? { topColor: "#2e2e38" } : entry.part === "fedora" ? { hatColor: "#3a3a46" } : {};
      const look = { ...avatar, ...tint, [entry.key]: entry.part } as AvatarConfig;
      return <AvatarCanvas avatar={look} width={80} height={90} focus={entry.key === "hat" ? "head" : "body"} />;
    }
    if (entry.furniture) return <FurnitureIcon kind={entry.furniture as FurnitureKind} size={80} />;
    return <span className={styles.shopEmoji}>{ICON[entry.rod ?? entry.bait ?? entry.item ?? ""] ?? "🎁"}</span>;
  };

  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label={shop === "fishing" ? "釣り具屋" : "景品交換所"} onClick={onClose}>
      <div className={styles.ameShop} onClick={(e) => e.stopPropagation()}>
        <div className={styles.ameShopHeader}>
          <span className={styles.ameBig}>{mark} {balance.toLocaleString()} <small>{unit}</small></span>
          <button type="button" className={styles.closeButton} aria-label="とじる" onClick={onClose}>×</button>
        </div>
        <div className={styles.groupTabs} role="tablist">
          {([["fishing", "🎣 釣り具屋"], ["casino", "🪙 景品交換所"]] as Array<[ShopId, string]>).map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={shop === id} className={styles.groupTab} onClick={() => setShop(id)}>
              {label}
            </button>
          ))}
        </div>
        <p className={styles.ameNote}>
          {shop === "fishing"
            ? "釣りポイントはビーチで魚を釣るとたまります。"
            : "カジノコインで交換できます（コインはカジノで増やせます。毎日のログインでももらえます）。"}
        </p>

        {ORDER[shop].map((category) => (
          <section key={category} className={styles.ameSection}>
            <h3 className={styles.ameHeading}>{CATEGORY_LABEL[category]}</h3>
            <div className={styles.shopGrid}>
              {POINT_SHOP.filter((e) => e.shop === shop && e.category === category).map((entry) => {
                const have = owned(entry);
                const count = stock(entry);
                return (
                  <div key={entry.id} className={styles.shopItem} data-owned={have}>
                    {preview(entry)}
                    <span className={styles.shopLabel}>{entry.label}</span>
                    <small className={styles.shopDesc}>{describe(entry)}</small>
                    {count !== null ? <small className={styles.ownedTag}>もってる: {count}</small> : null}
                    {have ? (
                      <span className={styles.ownedTag}>もってる</span>
                    ) : (
                      <button type="button" className={styles.buyButton} disabled={balance < entry.price} onClick={() => game.shopBuy(entry.id)}>
                        {mark} {entry.price.toLocaleString()}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
