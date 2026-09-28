"use client";

import { useEffect, useState } from "react";
import styles from "@/app/games/town/town.module.css";
import type { TownGame, Wallet } from "../core/TownGame";
import type { RoomItem } from "../world/furniture";
import { CROPS, GARDEN, cropDef, cropStage } from "../shared/shop";

type Props = {
  game: TownGame;
  item: RoomItem;
  wallet: Wallet | null;
  isOwner: boolean;
  onClose: () => void;
};

const STAGE_LABEL = ["たねをまいたところ", "めが出てきた", "ぐんぐん成長中", "しゅうかくできる！"];

function remaining(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  if (s >= 3600) return `${Math.floor(s / 3600)}時間${Math.floor((s % 3600) / 60)}分`;
  return s >= 60 ? `${Math.floor(s / 60)}分${s % 60}秒` : `${s}秒`;
}

/** Small card for one garden plot: plant (owner), water (anyone) and harvest (owner). */
export function PlotPopup({ game, item, wallet, isOwner, onClose }: Props) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const crop = item.crop;
  const def = crop ? cropDef(crop.id) : undefined;
  const stage = crop ? cropStage(crop, now) : 0;
  const ripe = Boolean(crop) && stage === 3;
  const canWater = Boolean(crop) && !ripe && crop!.waters < GARDEN.maxWater;
  const waitMs = crop ? Math.max(0, crop.lastWaterAt + GARDEN.waterCooldownMs - now) : 0;
  const seeds = CROPS.filter((c) => (wallet?.seeds[c.id] ?? 0) > 0);

  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="畑" onClick={onClose}>
      <div className={styles.plotCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.ameShopHeader}>
          <strong>🌱 畑</strong>
          <button type="button" className={styles.closeButton} aria-label="とじる" onClick={onClose}>×</button>
        </div>

        {crop && def ? (
          <>
            <p className={styles.plotStatus}>
              <span className={styles.shopEmoji}>{stage === 3 ? def.emoji : stage === 0 ? "🌰" : "🌱"}</span>
              <span>
                <strong>{def.label}</strong>
                <br />
                {STAGE_LABEL[stage]}
                {!ripe ? `（あと${remaining(crop.readyAt - now)}）` : ""}
              </span>
            </p>
            <p className={styles.ameNote}>水やり {crop.waters}/{GARDEN.maxWater}回 ・ 水やりすると早く育ちます</p>
            <div className={styles.petActions}>
              <button type="button" className={styles.secondaryButton} disabled={!canWater || waitMs > 0} onClick={() => game.water(item.x, item.y)}>
                💧 みずやり{canWater && waitMs > 0 ? `（${Math.ceil(waitMs / 1000)}秒）` : ""}
              </button>
              {isOwner ? (
                <button type="button" className={styles.primaryButton} disabled={!ripe} onClick={() => { game.harvest(item.x, item.y); onClose(); }}>
                  🧺 しゅうかく
                </button>
              ) : null}
            </div>
            {!isOwner ? <p className={styles.ameNote}>友だちの畑に水やりすると、お礼のアメがもらえます（1日の上限あり）。</p> : null}
          </>
        ) : isOwner ? (
          seeds.length > 0 ? (
            <>
              <p className={styles.ameNote}>植えるたねをえらんでね</p>
              <div className={styles.petActions}>
                {seeds.map((c) => (
                  <button key={c.id} type="button" className={styles.secondaryButton} onClick={() => { game.plant(item.x, item.y, c.id); onClose(); }}>
                    {c.emoji} {c.label} ×{wallet?.seeds[c.id] ?? 0}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className={styles.ameNote}>たねを持っていません。ガーデンショップ（🌱）で買えます。</p>
          )
        ) : (
          <p className={styles.ameNote}>まだ何も植わっていません。</p>
        )}
      </div>
    </div>
  );
}
