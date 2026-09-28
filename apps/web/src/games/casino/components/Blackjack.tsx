"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "../casino.module.css";
import { CasinoFrame } from "./CasinoFrame";
import { BetControls } from "./BetControls";
import { PlayingCard } from "./PlayingCard";
import { useCasinoBank } from "../useCasinoBank";
import { useCasinoItems } from "../items";
import { MIN_BET, clampBet, randomInt } from "../bank";
import { freshShuffledDeck, type Card } from "../cards";
import {
  blackjackReturn, dealerMustHit, handValue, isBlackjack, isBust, settleBlackjack, type BlackjackOutcome,
} from "../blackjack";

const DEALER_DELAY_MS = 650;

type Phase = "bet" | "player" | "dealer" | "done";

/** Everything needed to finish a hand, kept in a ref so leaving mid-hand can still settle it. */
type Live = { active: boolean; deck: Card[]; player: Card[]; dealer: Card[]; stake: number };

const OUTCOME_TEXT: Record<BlackjackOutcome, string> = {
  blackjack: "ブラックジャック！ 3:2 でお支払い",
  win: "あなたの勝ち！",
  push: "引き分け（賭け金は戻ります）",
  lose: "ディーラーの勝ち…",
  bust: "バースト…",
};

export function Blackjack({ embedded = false, onClose }: { embedded?: boolean; onClose?: () => void } = {}) {
  const { ready, bank, change, refillIfBroke, current } = useCasinoBank();
  const [bet, setBet] = useState(MIN_BET);
  const [phase, setPhase] = useState<Phase>("bet");
  const [player, setPlayer] = useState<Card[]>([]);
  const [dealer, setDealer] = useState<Card[]>([]);
  const [stake, setStake] = useState(0);
  const [outcome, setOutcome] = useState<BlackjackOutcome | null>(null);
  const [peek, setPeek] = useState(false);
  const [peeking, setPeeking] = useState(false);
  const items = useCasinoItems();
  const peeksLeft = items?.count("bj-peek") ?? 0;
  const live = useRef<Live>({ active: false, deck: [], player: [], dealer: [], stake: 0 });
  const timer = useRef<number | null>(null);

  // Leaving mid-hand (closing the page) plays the dealer out instantly so the stake is never simply lost.
  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    const hand = live.current;
    if (!hand.active) return;
    hand.active = false;
    const dealerCards = [...hand.dealer];
    if (!isBust(hand.player)) while (dealerMustHit(dealerCards)) dealerCards.push(hand.deck.shift() as Card);
    change(blackjackReturn(settleBlackjack(hand.player, dealerCards), hand.stake));
  }, [change]);

  const finish = useCallback((playerCards: Card[], dealerCards: Card[], finalStake: number) => {
    const result = settleBlackjack(playerCards, dealerCards);
    live.current.active = false;
    const back = blackjackReturn(result, finalStake);
    if (back > 0) change(back);
    setPlayer(playerCards);
    setDealer(dealerCards);
    setOutcome(result);
    setPhase("done");
  }, [change]);

  const dealerTurn = useCallback((playerCards: Card[], finalStake: number) => {
    setPhase("dealer");
    const step = () => {
      const hand = live.current;
      if (!hand.active) return;
      if (dealerMustHit(hand.dealer)) {
        hand.dealer = [...hand.dealer, hand.deck.shift() as Card];
        setDealer(hand.dealer);
        timer.current = window.setTimeout(step, DEALER_DELAY_MS);
      } else {
        finish(playerCards, hand.dealer, finalStake);
      }
    };
    timer.current = window.setTimeout(step, DEALER_DELAY_MS);
  }, [finish]);

  const deal = () => {
    const balance = current();
    const wager = clampBet(bet, balance);
    if (balance < MIN_BET || balance < wager || live.current.active) return;
    change(-wager);
    const deck = freshShuffledDeck(randomInt);
    const playerCards = [deck.shift() as Card, deck.shift() as Card];
    const dealerCards = [deck.shift() as Card, deck.shift() as Card];
    live.current = { active: true, deck, player: playerCards, dealer: dealerCards, stake: wager };
    setStake(wager);
    setPlayer(playerCards);
    setDealer(dealerCards);
    setOutcome(null);
    setPeek(false);
    if (isBlackjack(playerCards) || isBlackjack(dealerCards)) {
      finish(playerCards, dealerCards, wager);
      return;
    }
    setPhase("player");
  };

  const hit = () => {
    const hand = live.current;
    if (!hand.active || phase !== "player") return;
    hand.player = [...hand.player, hand.deck.shift() as Card];
    setPlayer(hand.player);
    if (isBust(hand.player)) finish(hand.player, hand.dealer, hand.stake);
    else if (handValue(hand.player).total === 21) dealerTurn(hand.player, hand.stake);
  };

  const stand = () => {
    const hand = live.current;
    if (!hand.active || phase !== "player") return;
    dealerTurn(hand.player, hand.stake);
  };

  const canDouble = phase === "player" && player.length === 2 && bank >= stake;
  const double = () => {
    const hand = live.current;
    if (!hand.active || phase !== "player" || hand.player.length !== 2 || current() < hand.stake) return;
    change(-hand.stake);
    hand.stake *= 2;
    setStake(hand.stake);
    hand.player = [...hand.player, hand.deck.shift() as Card];
    setPlayer(hand.player);
    if (isBust(hand.player)) finish(hand.player, hand.dealer, hand.stake);
    else dealerTurn(hand.player, hand.stake);
  };

  const peekHole = async () => {
    if (peeking || peek || phase !== "player") return;
    setPeeking(true);
    const ok = await items?.use("bj-peek");
    setPeeking(false);
    if (ok) setPeek(true);
  };

  const hideHole = phase === "player" && !peek;
  const dealerShown = hideHole ? dealer.slice(0, 1) : dealer;
  const inHand = phase === "player" || phase === "dealer";
  const message = phase === "bet"
    ? "ベットして「配る」を押してね"
    : phase === "player"
      ? "ヒット（1枚引く）かスタンド（勝負する）を選んでね"
      : phase === "dealer"
        ? "ディーラーの番…"
        : outcome ? OUTCOME_TEXT[outcome] : "";
  const won = outcome === "win" || outcome === "blackjack";

  return (
    <CasinoFrame title="ブラックジャック" bank={bank} ready={ready} embedded={embedded} onClose={onClose} closeDisabled={inHand}>
      <section className={styles.panel} aria-label="ブラックジャックのテーブル">
        <div className={styles.tableFelt}>
          <div>
            <p className={styles.handLabel}>
              <span>ディーラー</span>
              <span className={styles.handTotal}>{dealer.length > 0 && !hideHole ? handValue(dealer).total : ""}</span>
            </p>
            <div className={styles.cardRow}>
              {dealerShown.map((card, i) => <PlayingCard key={i} card={card} />)}
              {hideHole && dealer.length > 1 ? <PlayingCard faceDown /> : null}
            </div>
          </div>
          <div>
            <p className={styles.handLabel}>
              <span>あなた{stake > 0 ? `（ベット ${stake.toLocaleString("ja-JP")}）` : ""}</span>
              <span className={styles.handTotal}>{player.length > 0 ? handValue(player).total : ""}</span>
            </p>
            <div className={styles.cardRow}>
              {player.map((card, i) => <PlayingCard key={i} card={card} />)}
            </div>
          </div>
        </div>

        <p className={`${styles.message} ${phase === "done" ? (won ? styles.messageWin : styles.messageLose) : ""}`} role="status" aria-live="polite" style={{ marginTop: 12 }}>
          {message}
        </p>

        {phase === "bet" || phase === "done" ? (
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
        ) : (
          <div className={styles.actionRowCenter}>
            <button className={`${styles.button} ${styles.buttonPrimary}`} onClick={hit} disabled={phase !== "player"}>ヒット</button>
            <button className={styles.button} onClick={stand} disabled={phase !== "player"}>スタンド</button>
            <button className={styles.button} onClick={double} disabled={!canDouble}>ダブルダウン</button>
            {items ? (
              <button className={styles.itemButton} onClick={() => void peekHole()} disabled={phase !== "player" || peek || peeking || peeksLeft <= 0}>
                👓 のぞき見メガネ（のこり{peeksLeft}）
              </button>
            ) : null}
          </div>
        )}
        <p className={styles.smallNote}>
          ディーラーは17以上で止まります。ブラックジャックは3:2の配当。最初の2枚のときだけダブルダウン（ベット2倍・あと1枚だけ）ができます。スプリット・インシュランスはありません。
        </p>
      </section>
    </CasinoFrame>
  );
}
