"use client";

import { useEffect, useRef, useState } from "react";
import styles from "../casino.module.css";
import { CasinoFrame } from "./CasinoFrame";
import { BetControls } from "./BetControls";
import { PlayingCard } from "./PlayingCard";
import { useCasinoBank } from "../useCasinoBank";
import { MIN_BET, clampBet, randomInt } from "../bank";
import { freshShuffledDeck, type Card } from "../cards";
import {
  HIGHLOW_MAX_STREAK, guessWins, highLowOdds, highLowPot, type Guess,
} from "../highlow";

type Phase = "bet" | "play" | "done";
type Result = "lose" | "cashout" | "max";

/** Everything needed to settle a run, kept in a ref so leaving mid-run still pays out what was won. */
type Live = { active: boolean; deck: Card[]; current: Card | null; stake: number; mults: number[] };

const TRAIL = 5;

export function HighLow({ embedded = false, onClose }: { embedded?: boolean; onClose?: () => void } = {}) {
  const { ready, bank, change, refillIfBroke, current: balanceNow } = useCasinoBank();
  const [bet, setBet] = useState(MIN_BET);
  const [phase, setPhase] = useState<Phase>("bet");
  const [card, setCard] = useState<Card | null>(null);
  const [trail, setTrail] = useState<Card[]>([]);
  const [mults, setMults] = useState<number[]>([]);
  const [stake, setStake] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [paid, setPaid] = useState(0);
  const live = useRef<Live>({ active: false, deck: [], current: null, stake: 0, mults: [] });

  // Leaving mid-run pays the pot won so far (or hands back the stake if nothing was guessed yet).
  useEffect(() => () => {
    const run = live.current;
    if (!run.active) return;
    run.active = false;
    change(run.mults.length > 0 ? highLowPot(run.stake, run.mults) : run.stake);
  }, [change]);

  const deal = () => {
    const balance = balanceNow();
    const wager = clampBet(bet, balance);
    if (balance < MIN_BET || balance < wager || live.current.active) return;
    change(-wager);
    const deck = freshShuffledDeck(randomInt);
    const first = deck.shift() as Card;
    live.current = { active: true, deck, current: first, stake: wager, mults: [] };
    setStake(wager);
    setCard(first);
    setTrail([]);
    setMults([]);
    setResult(null);
    setPaid(0);
    setPhase("play");
  };

  const settle = (kind: Result, pot: number) => {
    live.current.active = false;
    if (pot > 0) change(pot);
    setPaid(pot);
    setResult(kind);
    setPhase("done");
  };

  const cashOut = () => {
    const run = live.current;
    if (!run.active || run.mults.length === 0) return;
    settle("cashout", highLowPot(run.stake, run.mults));
  };

  const guess = (choice: Guess) => {
    const run = live.current;
    if (!run.active || !run.current) return;
    const odds = highLowOdds(run.current, run.deck)[choice];
    if (odds.mult <= 0) return;
    const previous = run.current;
    const next = run.deck.shift() as Card;
    const won = guessWins(choice, previous, next);
    setTrail((list) => [...list, previous].slice(-TRAIL));
    run.current = next;
    setCard(next);
    if (!won) {
      settle("lose", 0);
      return;
    }
    run.mults = [...run.mults, odds.mult];
    setMults(run.mults);
    if (run.mults.length >= HIGHLOW_MAX_STREAK) settle("max", highLowPot(run.stake, run.mults));
  };

  const odds = phase === "play" && card ? highLowOdds(card, live.current.deck) : null;
  const pot = highLowPot(stake, mults);
  const message = phase === "bet"
    ? "ベットして「配る」を押してね"
    : phase === "play"
      ? mults.length === 0
        ? "次のカードはハイ（大きい）？ ロー（小さい）？ 同じ数字は負けです"
        : `${mults.length}連勝中！ 続けるか、うけとるか選んでね`
      : result === "lose"
        ? "はずれ… 賭け金はなくなりました"
        : result === "max"
          ? `${HIGHLOW_MAX_STREAK}連勝達成！ ${paid.toLocaleString("ja-JP")} コインを獲得`
          : `${paid.toLocaleString("ja-JP")} コインをうけとりました`;
  const good = phase === "done" && result !== "lose";

  return (
    <CasinoFrame title="ハイ＆ロー" bank={bank} ready={ready} embedded={embedded} onClose={onClose}>
      <section className={styles.panel} aria-label="ハイ＆ローのテーブル">
        <div className={styles.tableFelt}>
          <div>
            <p className={styles.handLabel}>
              <span>{stake > 0 ? `ベット ${stake.toLocaleString("ja-JP")}` : "カード"}</span>
              <span className={styles.handTotal}>{mults.length > 0 ? `ポット ${pot.toLocaleString("ja-JP")}` : ""}</span>
            </p>
            <div className={styles.cardRow}>
              {card ? <PlayingCard card={card} /> : <PlayingCard faceDown />}
              {phase === "play" ? <PlayingCard faceDown /> : null}
            </div>
          </div>
          {trail.length > 0 ? (
            <div>
              <p className={styles.handLabel}><span>これまで</span></p>
              <div className={`${styles.cardRow} ${styles.trailRow}`}>
                {trail.map((c, i) => <PlayingCard key={i} card={c} />)}
              </div>
            </div>
          ) : null}
        </div>

        <p className={`${styles.message} ${phase === "done" ? (good ? styles.messageWin : styles.messageLose) : ""}`} role="status" aria-live="polite" style={{ marginTop: 12 }}>
          {message}
        </p>

        {phase === "play" && odds ? (
          <div className={styles.actionRowCenter}>
            <button className={`${styles.button} ${styles.buttonPrimary}`} onClick={() => guess("higher")} disabled={odds.higher.mult <= 0}>
              ハイ ▲ {odds.higher.mult > 0 ? `×${odds.higher.mult.toFixed(2)}` : "—"}
            </button>
            <button className={`${styles.button} ${styles.buttonPrimary}`} onClick={() => guess("lower")} disabled={odds.lower.mult <= 0}>
              ロー ▼ {odds.lower.mult > 0 ? `×${odds.lower.mult.toFixed(2)}` : "—"}
            </button>
            <button className={styles.button} onClick={cashOut} disabled={mults.length === 0}>
              うけとる {mults.length > 0 ? pot.toLocaleString("ja-JP") : ""}
            </button>
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
        <p className={styles.smallNote}>
          残りのカードから数えた本当の確率にもとづく倍率です（配当は理論値の96%）。勝つたびにポットが倍率ぶん増え、いつでもうけとれます。同じ数字は負け、{HIGHLOW_MAX_STREAK}連勝で自動的にうけとり。
        </p>
      </section>
    </CasinoFrame>
  );
}
