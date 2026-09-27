"use client";

import { useEffect, useState } from "react";
import styles from "@/app/games/town/town.module.css";
import economy from "../shared/economy.json";
import type { AvatarConfig } from "../avatar/parts";
import type { ScratchPrize, TownGame, Wallet } from "../core/TownGame";
import { expandCost, roomSlotCost, type FurnitureKind } from "../world/furniture";
import { AvatarCanvas } from "./AvatarCanvas";
import { FurnitureIcon } from "./FurnitureIcon";
import { ScratchCard } from "./ScratchCard";

type Tab = "scratch" | "shop" | "earn";

type Props = {
  game: TownGame;
  wallet: Wallet;
  avatar: AvatarConfig;
  /** Room the player is standing in, when it's one of theirs (for expanding). */
  currentRoom: { id: string; size: number } | null;
  initialTab?: Tab;
  /** Balance to show elsewhere (header) while a card is unrevealed; null = show the real one. */
  onHoldBalance?: (ame: number | null) => void;
  onClose: () => void;
};

type ScratchState = { cells: string[]; prize: ScratchPrize; revealed: boolean } | null;

function prizeText(prize: ScratchPrize): string {
  if (prize.type === "ame") return prize.amount >= 80 ? `大当たり！ ${prize.amount} アメ` : `${prize.amount} アメ`;
  return `超大当たり！ 限定「${prize.item.label}」`;
}

/** Pigg-style アメ corner: scratch cards, a shop for limited items, and how to earn. */
export function AmeShop({ game, wallet, avatar, currentRoom, initialTab = "scratch", onHoldBalance, onClose }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [scratch, setScratch] = useState<ScratchState>(null);
  const [pending, setPending] = useState(false);
  // Balance right after paying, shown until the card is revealed so the prize isn't spoiled.
  const [paidAme, setPaidAme] = useState<number | null>(null);

  useEffect(() => {
    return game.onEvent((event) => {
      if (event.type === "scratch") {
        setScratch({ cells: event.cells, prize: event.prize, revealed: false });
        setPending(false);
      }
      if (event.type === "error") {
        setPending(false);
        setPaidAme(null);
      }
    });
  }, [game]);

  useEffect(() => {
    onHoldBalance?.(paidAme);
  }, [paidAme, onHoldBalance]);
  useEffect(() => () => onHoldBalance?.(null), [onHoldBalance]);

  const ownedParts = new Set(wallet.owned.parts);
  const ownedFurniture = new Set(wallet.owned.furniture);
  const earn = economy.earn;
  const price = economy.scratch.price;
  const slotCost = roomSlotCost(wallet.rooms.length);
  const expand = currentRoom ? expandCost(currentRoom.size) : null;

  // Closing with an unscratched card reveals it first, so the result is never missed.
  const close = () => {
    if (scratch && !scratch.revealed) {
      setScratch({ ...scratch, revealed: true });
      setPaidAme(null);
      return;
    }
    onClose();
  };

  const buyScratch = () => {
    setPaidAme(wallet.ame - price);
    setPending(true);
    setScratch(null);
    game.scratch();
  };

  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="アメ" onClick={close}>
      <div className={styles.ameShop} onClick={(e) => e.stopPropagation()}>
        <div className={styles.ameShopHeader}>
          <span className={styles.ameBig}>🍬 {(paidAme ?? wallet.ame).toLocaleString()} <small>アメ</small></span>
          <button type="button" className={styles.closeButton} aria-label="とじる" onClick={close}>×</button>
        </div>
        <div className={styles.groupTabs} role="tablist">
          {([["scratch", "スクラッチ"], ["shop", "ショップ"], ["earn", "もらいかた"]] as Array<[Tab, string]>).map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} className={styles.groupTab} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>

        {tab === "scratch" ? (
          <section className={styles.ameSection}>
            <p className={styles.ameLead}>
              {price}アメで1回。3つそろった絵柄がもらえるよ。🎁がそろうと限定アイテム！
            </p>
            <ul className={styles.prizeList}>
              <li>🎁 限定アイテム</li>
              <li>💎 150</li>
              <li>⭐ 80</li>
              <li>🍀 40</li>
              <li>🌸 20</li>
              <li>🍬 10</li>
            </ul>
            {scratch ? (
              <>
                <ScratchCard
                  cells={scratch.cells}
                  prize={scratch.prize}
                  forceReveal={scratch.revealed}
                  onRevealed={() => {
                    setScratch((s) => (s ? { ...s, revealed: true } : s));
                    setPaidAme(null);
                  }}
                />
                {scratch.revealed ? <p className={styles.prizeResult}>{prizeText(scratch.prize)}</p> : null}
              </>
            ) : null}
            <button
              type="button"
              className={styles.primaryButton}
              disabled={pending || wallet.ame < price || Boolean(scratch && !scratch.revealed)}
              onClick={buyScratch}
            >
              {scratch ? "もう1回" : "スクラッチを買う"}（{price}アメ）
            </button>
            {wallet.ame < price ? <p className={styles.ameNote}>アメがたりません。「もらいかた」を見てね</p> : null}
          </section>
        ) : null}

        {tab === "shop" ? (
          <section className={styles.ameSection}>
            <h3 className={styles.ameHeading}>げんていパーツ</h3>
            <div className={styles.shopGrid}>
              {economy.limitedParts.map((p) => {
                const owned = ownedParts.has(`${p.key}:${p.id}`);
                return (
                  <div key={`${p.key}:${p.id}`} className={styles.shopItem} data-owned={owned}>
                    <AvatarCanvas avatar={{ ...avatar, [p.key]: p.id }} width={80} height={90} focus={p.key === "hat" || p.key === "glasses" ? "head" : "body"} facing={p.key === "back" ? "back" : "front"} />
                    <span className={styles.shopLabel}>{p.label}</span>
                    {owned ? (
                      <span className={styles.ownedTag}>もってる</span>
                    ) : (
                      <button type="button" className={styles.buyButton} disabled={wallet.ame < p.price} onClick={() => game.buy("part", { key: p.key, id: p.id })}>
                        🍬 {p.price}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <h3 className={styles.ameHeading}>げんてい家具</h3>
            <div className={styles.shopGrid}>
              {economy.limitedFurniture.map((f) => {
                const owned = ownedFurniture.has(f.kind);
                return (
                  <div key={f.kind} className={styles.shopItem} data-owned={owned}>
                    <FurnitureIcon kind={f.kind as FurnitureKind} size={80} />
                    <span className={styles.shopLabel}>{f.label}</span>
                    {owned ? (
                      <span className={styles.ownedTag}>もってる</span>
                    ) : (
                      <button type="button" className={styles.buyButton} disabled={wallet.ame < f.price} onClick={() => game.buy("furniture", { id: f.kind })}>
                        🍬 {f.price}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <h3 className={styles.ameHeading}>へや</h3>
            <div className={styles.roomShop}>
              <div className={styles.roomShopRow}>
                <span>へやをふやす（いま {wallet.rooms.length} へや）</span>
                {slotCost === null ? (
                  <span className={styles.ownedTag}>さいだいです</span>
                ) : (
                  <button type="button" className={styles.buyButton} disabled={wallet.ame < slotCost} onClick={() => game.buy("room")}>
                    🍬 {slotCost}
                  </button>
                )}
              </div>
              <div className={styles.roomShopRow}>
                <span>
                  {currentRoom ? `このへやを広げる（いま ${currentRoom.size}×${currentRoom.size}）` : "へやを広げる（自分のへやで使えます）"}
                </span>
                {currentRoom && expand ? (
                  <button type="button" className={styles.buyButton} disabled={wallet.ame < expand.cost} onClick={() => game.buy("expand", { roomId: currentRoom.id })}>
                    {expand.next}×{expand.next}へ 🍬 {expand.cost}
                  </button>
                ) : currentRoom ? (
                  <span className={styles.ownedTag}>さいだいです</span>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {tab === "earn" ? (
          <section className={styles.ameSection}>
            <ul className={styles.earnList}>
              <li data-done={wallet.today.login}>
                <span>毎日のログインボーナス</span>
                <b>+{earn.login}</b>
                <em>{wallet.today.login ? "きょうはもらった" : "まだ"}</em>
              </li>
              <li data-done={wallet.today.dress}>
                <span>きせかえをする（1日1回）</span>
                <b>+{earn.dress}</b>
                <em>{wallet.today.dress ? "きょうはもらった" : "まだ"}</em>
              </li>
              <li data-done={wallet.today.onlineEarned >= earn.onlineDailyCap}>
                <span>タウンにいる（{earn.onlineStepMinutes}分ごと）</span>
                <b>+{earn.onlinePerStep}</b>
                <em>{wallet.today.onlineEarned}/{earn.onlineDailyCap}</em>
              </li>
              <li data-done={wallet.today.praiseReceived >= earn.praiseReceivedDailyCap}>
                <span>グッピグされる</span>
                <b>+{earn.praiseReceived}</b>
                <em>{wallet.today.praiseReceived}/{earn.praiseReceivedDailyCap}</em>
              </li>
              <li data-done={wallet.today.praiseGiven >= earn.praiseGivenDailyCap}>
                <span>グッピグする</span>
                <b>+{earn.praiseGiven}</b>
                <em>{wallet.today.praiseGiven}/{earn.praiseGivenDailyCap}</em>
              </li>
              <li data-done={wallet.today.visits * earn.visitRoom >= earn.visitRoomDailyCap}>
                <span>ほかの人のへやに遊びに行く</span>
                <b>+{earn.visitRoom}</b>
                <em>{Math.min(wallet.today.visits * earn.visitRoom, earn.visitRoomDailyCap)}/{earn.visitRoomDailyCap}</em>
              </li>
            </ul>
            <p className={styles.ameNote}>日付は日本時間の0時に切りかわります。</p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
