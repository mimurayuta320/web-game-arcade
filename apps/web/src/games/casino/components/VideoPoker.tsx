"use client";

import { useEffect, useRef, useState } from "react";
import styles from "../casino.module.css";
import { CasinoFrame } from "./CasinoFrame";
import { BetControls } from "./BetControls";
import { PlayingCard } from "./PlayingCard";
import { useCasinoBank } from "../useCasinoBank";
import { useCasinoItems } from "../items";
import { MIN_BET, clampBet, randomInt } from "../bank";
import { freshShuffledDeck, type Card } from "../cards";
import {
  POKER_PAYTABLE, drawPokerHand, evaluatePokerHand, pokerHandLabel, pokerPays, type PokerHand,
} from "../videoPoker";

type Phase = "bet" | "hold" | "offer" | "done";

/** `redrawn`: the extra draw (おかわりドロー券) has been used this round. */
type Live = { active: boolean; hand: Card[]; held: boolean[]; rest: Card[]; stake: number; redrawn: boolean };

const ALL_HELD = [true, true, true, true, true];
const NONE_HELD = [false, false, false, false, false];

export function VideoPoker({ embedded = false, onClose }: { embedded?: boolean; onClose?: () => void } = {}) {
  const { ready, bank, change, refillIfBroke, current } = useCasinoBank();
  const [bet, setBet] = useState(MIN_BET);
  const [phase, setPhase] = useState<Phase>("bet");
  const [hand, setHand] = useState<Card[]>([]);
  const [held, setHeld] = useState<boolean[]>([false, false, false, false, false]);
  const [stake, setStake] = useState(0);
  const [result, setResult] = useState<{ hand: PokerHand; back: number } | null>(null);
  const live = useRef<Live>({ active: false, hand: [], held: [], rest: [], stake: 0, redrawn: false });
  const items = useCasinoItems();
  const redrawsLeft = items?.count("poker-redraw") ?? 0;
  const [busy, setBusy] = useState(false);
  const [redrawn, setRedrawn] = useState(false);

  // Leaving with cards still up: draw with the current holds so the stake isn't simply lost.
  useEffect(() => () => {
    const round = live.current;
    if (!round.active) return;
    round.active = false;
    const final = drawPokerHand(round.hand, round.held, round.rest);
    change(round.stake * pokerPays(evaluatePokerHand(final)));
  }, [change]);

  const deal = () => {
    const balance = current();
    const wager = clampBet(bet, balance);
    if (balance < MIN_BET || balance < wager || live.current.active) return;
    change(-wager);
    const deck = freshShuffledDeck(randomInt);
    const first = deck.slice(0, 5);
    live.current = { active: true, hand: first, held: [...NONE_HELD], rest: deck.slice(5), stake: wager, redrawn: false };
    setStake(wager);
    setHand(first);
    setHeld([false, false, false, false, false]);
    setResult(null);
    setRedrawn(false);
    setPhase("hold");
  };

  const toggle = (index: number) => {
    const round = live.current;
    if (!round.active || phase !== "hold") return;
    round.held = round.held.map((value, i) => (i === index ? !value : value));
    setHeld(round.held);
  };

  const settle = (final: Card[]) => {
    const round = live.current;
    const rank = evaluatePokerHand(final);
    const back = round.stake * pokerPays(rank);
    round.active = false;
    if (back > 0) change(back);
    setHand(final);
    setResult({ hand: rank, back });
    setPhase("done");
  };

  const draw = () => {
    const round = live.current;
    if (!round.active || phase !== "hold") return;
    const final = drawPokerHand(round.hand, round.held, round.rest);
    if (!round.redrawn && redrawsLeft > 0) {
      // Holding a redraw ticket: show the hand and offer one more draw before it counts.
      round.rest = round.rest.slice(round.held.filter((h) => !h).length);
      round.hand = final;
      round.held = [...ALL_HELD];
      setHand(final);
      setHeld([...NONE_HELD]);
      setPhase("offer");
      return;
    }
    settle(final);
  };

  const redraw = async () => {
    const round = live.current;
    if (!round.active || phase !== "offer" || busy) return;
    setBusy(true);
    const ok = await items?.use("poker-redraw");
    setBusy(false);
    if (!ok) return;
    round.redrawn = true;
    setRedrawn(true);
    round.held = [...NONE_HELD];
    setHeld([...NONE_HELD]);
    setPhase("hold");
  };

  const keep = () => {
    const round = live.current;
    if (!round.active || phase !== "offer") return;
    settle(round.hand);
  };

  const message = phase === "bet"
    ? "ベットして「配る」を押してね"
    : phase === "hold"
      ? redrawn ? "おかわり！ もう一度、残すカードを選んで「ドロー」" : "残したいカードをタップ（HOLD）して「ドロー」"
      : phase === "offer"
        ? `いまの役: ${pokerHandLabel(evaluatePokerHand(hand))}。おかわりドロー券でもう1回引きなおせるよ`
        : result && result.back > 0
        ? `${pokerHandLabel(result.hand)}！ ${result.back.toLocaleString("ja-JP")} コイン獲得`
        : "役なし… もう一度！";

  return (
    <CasinoFrame title="ビデオポーカー" bank={bank} ready={ready} embedded={embedded} onClose={onClose} closeDisabled={phase === "hold" || phase === "offer"}>
      <div className={styles.slotLayout}>
        <section className={styles.panel} aria-label="ビデオポーカー">
          <div className={styles.tableFelt}>
            <p className={styles.handLabel}>
              <span>{stake > 0 ? `ベット ${stake.toLocaleString("ja-JP")}` : "5枚配って、1回だけ引き直せます"}</span>
              <span className={styles.handTotal}>{phase === "done" && result ? pokerHandLabel(result.hand) : ""}</span>
            </p>
            <div className={styles.cardRow} style={{ paddingBottom: 22 }}>
              {hand.length === 0
                ? [0, 1, 2, 3, 4].map((i) => <PlayingCard key={i} faceDown />)
                : hand.map((card, i) => (
                  <PlayingCard
                    key={`${i}-${card.rank}${card.suit}`}
                    card={card}
                    held={phase === "hold" && held[i]}
                    onClick={phase === "hold" ? () => toggle(i) : undefined}
                  />
                ))}
            </div>
          </div>

          <p className={`${styles.message} ${phase === "done" ? (result && result.back > 0 ? styles.messageWin : styles.messageLose) : ""}`} role="status" aria-live="polite" style={{ marginTop: 12 }}>
            {message}
          </p>

          {phase === "hold" ? (
            <div className={styles.actionRowCenter}>
              <button className={`${styles.button} ${styles.buttonPrimary}`} onClick={draw}>ドロー</button>
            </div>
          ) : phase === "offer" ? (
            <div className={styles.actionRowCenter}>
              <button className={styles.itemButton} onClick={() => void redraw()} disabled={busy}>🔁 おかわりドロー券を使う（のこり{redrawsLeft}）</button>
              <button className={`${styles.button} ${styles.buttonPrimary}`} onClick={keep} disabled={busy}>この役で決定</button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              <BetControls bet={bet} bank={bank} onBet={setBet} />
              <div className={styles.actionRowCenter}>
                <button className={`${styles.button} ${styles.buttonPrimary}`} onClick={deal} disabled={!ready || bank < MIN_BET}>
                  {phase === "done" ? "もう一度配る" : "配る"}
                </button>
              </div>
              {ready && bank < MIN_BET ? (
                <button className={styles.button} onClick={() => refillIfBroke()}>コインがなくなりました — 1,000枚もらって再開</button>
              ) : null}
            </div>
          )}
        </section>

        <aside className={styles.panel} aria-label="配当表">
          <h2 className={styles.panelTitle}>配当表（ベット × 倍率）</h2>
          <ul className={styles.payTable}>
            {POKER_PAYTABLE.map((row) => (
              <li className={`${styles.payRow} ${phase === "done" && result?.hand === row.hand ? styles.payRowHit : ""}`} key={row.hand}>
                <span>{row.label}</span>
                <span className={styles.payMult}>×{row.pays}</span>
              </li>
            ))}
          </ul>
          <p className={styles.smallNote}>ジャックス・オア・ベター（9/6 フルペイ表）。ジャック以上のペアから配当があります。</p>
        </aside>
      </div>
    </CasinoFrame>
  );
}
