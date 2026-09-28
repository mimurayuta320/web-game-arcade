"use client";

import { useState } from "react";
import styles from "@/app/games/town/town.module.css";
import type { TownGame, Wallet } from "../core/TownGame";
import { CROPS, PET_CONFIG, PET_SPECIES, petSpecies } from "../shared/shop";
import { PetCanvas } from "./PetCanvas";

type Props = {
  game: TownGame;
  wallet: Wallet;
  initialTab: "mine" | "shop";
  onClose: () => void;
};

const LEVEL_LABEL = ["はじめまして", "なかよし", "ともだち", "しんゆう", "ずっといっしょ"];

function Gauge({ label, value, tone }: { label: string; value: number; tone: "hunger" | "bond" }) {
  return (
    <div className={styles.gaugeRow}>
      <span className={styles.gaugeLabel}>{label}</span>
      <span className={styles.gaugeTrack}>
        <span className={styles.gaugeFill} data-tone={tone} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </span>
    </div>
  );
}

/** Pet shop and pet list: buy a companion, pat and feed it, pick who walks with you. */
export function PetPanel({ game, wallet, initialTab, onClose }: Props) {
  const [tab, setTab] = useState<"mine" | "shop">(initialTab);
  const [name, setName] = useState("");
  const [food, setFood] = useState("petfood");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);

  const foods: Array<{ id: string; label: string; count: number }> = [
    { id: "petfood", label: "🍖 ペットフード", count: wallet.petFood },
    ...CROPS.filter((c) => (wallet.goods[c.id] ?? 0) > 0).map((c) => ({ id: c.id, label: `${c.emoji} ${c.label}`, count: wallet.goods[c.id] ?? 0 })),
  ];
  const foodChoice = foods.find((f) => f.id === food) ?? foods[0];
  const full = wallet.pets.length >= PET_CONFIG.max;

  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="ペット" onClick={onClose}>
      <div className={styles.ameShop} onClick={(e) => e.stopPropagation()}>
        <div className={styles.ameShopHeader}>
          <span className={styles.ameBig}>🍬 {wallet.ame.toLocaleString()} <small>アメ</small></span>
          <button type="button" className={styles.closeButton} aria-label="とじる" onClick={onClose}>×</button>
        </div>
        <div className={styles.groupTabs} role="tablist">
          {([["mine", `🐾 うちの子（${wallet.pets.length}/${PET_CONFIG.max}）`], ["shop", "🏪 ペットショップ"]] as Array<["mine" | "shop", string]>).map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} className={styles.groupTab} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>

        {tab === "shop" ? (
          <>
            <p className={styles.ameNote}>
              なまえをつけて迎えよう（最大{PET_CONFIG.max}ひき）。{full ? "これ以上は迎えられません。" : "お世話するとなかよし度が上がります。"}
            </p>
            <input
              className={styles.petNameInput}
              value={name}
              maxLength={PET_CONFIG.nameMax}
              placeholder={`なまえ（${PET_CONFIG.nameMax}文字まで・空なら種類名）`}
              onChange={(e) => setName(e.target.value)}
            />
            <div className={styles.shopGrid}>
              {PET_SPECIES.map((sp) => (
                <div key={sp.id} className={styles.shopItem}>
                  <PetCanvas species={sp.id} size={72} />
                  <span className={styles.shopLabel}>{sp.emoji} {sp.label}</span>
                  <button
                    type="button"
                    className={styles.buyButton}
                    disabled={full || wallet.ame < sp.price}
                    onClick={() => {
                      game.petBuy(sp.id, name.trim() || undefined);
                      setName("");
                      setTab("mine");
                    }}
                  >
                    🍬 {sp.price.toLocaleString()}
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : wallet.pets.length === 0 ? (
          <p className={styles.ameNote}>まだペットがいません。ペットショップで迎えてみよう。</p>
        ) : (
          <>
            <p className={styles.ameNote}>
              なでる・ごはんでなかよし度アップ。「つれていく」にした子がついてきます。おなかがすくと元気がなくなるので、たまにごはんをあげてね。
            </p>
            <div className={styles.petFoodBar}>
              <label>
                ごはん:{" "}
                <select className={styles.petSelect} value={foodChoice?.id ?? ""} onChange={(e) => setFood(e.target.value)}>
                  {foods.map((f) => <option key={f.id} value={f.id}>{f.label} ×{f.count}</option>)}
                </select>
              </label>
            </div>
            <ul className={styles.petList}>
              {wallet.pets.map((pet) => {
                const sp = petSpecies(pet.species);
                const isActive = wallet.activePet === pet.id;
                const isEditing = editing?.id === pet.id;
                return (
                  <li key={pet.id} className={styles.petCard} data-active={isActive}>
                    <PetCanvas species={pet.species} level={pet.level} size={72} />
                    <div className={styles.petBody}>
                      {isEditing ? (
                        <form
                          className={styles.petRename}
                          onSubmit={(e) => {
                            e.preventDefault();
                            game.petRename(pet.id, editing.name);
                            setEditing(null);
                          }}
                        >
                          <input
                            className={styles.petNameInput}
                            autoFocus
                            value={editing.name}
                            maxLength={PET_CONFIG.nameMax}
                            onChange={(e) => setEditing({ id: pet.id, name: e.target.value })}
                          />
                          <button type="submit" className={styles.buyButton}>OK</button>
                        </form>
                      ) : (
                        <strong className={styles.petName}>
                          {sp?.emoji} {pet.name}
                          <button type="button" className={styles.linkButton} onClick={() => setEditing({ id: pet.id, name: pet.name })}>なまえ変更</button>
                        </strong>
                      )}
                      <Gauge label="おなか" value={100 - pet.hunger} tone="hunger" />
                      <Gauge label={`なかよし（${LEVEL_LABEL[pet.level] ?? ""}）`} value={pet.bond} tone="bond" />
                      <div className={styles.petActions}>
                        <button type="button" className={styles.secondaryButton} onClick={() => game.petPat(pet.id)}>なでる</button>
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          disabled={!foodChoice || foodChoice.count <= 0}
                          onClick={() => game.petFeed(pet.id, foodChoice.id)}
                        >
                          ごはん
                        </button>
                        <button type="button" className={isActive ? styles.primaryButton : styles.secondaryButton} onClick={() => game.petActive(isActive ? "" : pet.id)}>
                          {isActive ? "つれていく中" : "つれていく"}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        <p className={styles.ameNote}>
          ペットフードや野菜のごはんは、にわ（ガーデニング）のお店・畑で手に入ります。
        </p>
      </div>
    </div>
  );
}
