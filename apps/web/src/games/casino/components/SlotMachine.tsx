"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "../casino.module.css";
import { CasinoFrame } from "./CasinoFrame";
import { useCasinoBank } from "../useCasinoBank";
import { useCasinoItems } from "../items";
import { BET_STEP, MIN_BET, clampBet, maxBet, randomInt } from "../bank";
import {
  SLOT_CHERRY_ONE, SLOT_CHERRY_TWO, SLOT_EMOJI, SLOT_LINES, SLOT_LINE_COUNT, SLOT_LINE_LABELS, SLOT_STRIP,
  SLOT_TRIPLE_PAY, computeSlotRtp, lineBet, slotPayout, spinSlots,
  type SlotResult, type SlotSymbol,
} from "../slots";

const REEL_STOP_MS = [700, 1050, 1400] as const;
const TICK_MS = 80;
const BET_PRESETS = [10, 50, 100, 500] as const;
const PAY_ORDER: SlotSymbol[] = ["seven", "bar", "bell", "grape", "lemon", "cherry"];
const INITIAL_GRID: SlotSymbol[][] = [
  ["cherry", "bell", "lemon"],
  ["grape", "seven", "bar"],
  ["lemon", "cherry", "bell"],
];

const THEORETICAL_RTP = computeSlotRtp().rtp;
/** A free-spin ticket covers a bet up to this much. */
const FREE_SPIN_MAX_BET = 100;

type Outcome = { result: SlotResult; payout: number; wager: number; free: boolean };

function randomColumn(): SlotSymbol[] {
  return [0, 1, 2].map(() => SLOT_STRIP[randomInt(SLOT_STRIP.length)]);
}

export function SlotMachine({ embedded = false, onClose }: { embedded?: boolean; onClose?: () => void } = {}) {
  const { ready, bank, change, refillIfBroke, current } = useCasinoBank();
  const items = useCasinoItems();
  const freeSpins = items?.count("slot-free") ?? 0;
  const [bet, setBet] = useState(MIN_BET);
  const [grid, setGrid] = useState<SlotSymbol[][]>(INITIAL_GRID);
  const [stopped, setStopped] = useState<boolean[]>([true, true, true]);
  const [spinning, setSpinning] = useState(false);
  const [held, setHeld] = useState(0);
  const [wager, setWager] = useState(MIN_BET);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const timers = useRef<number[]>([]);
  const ticker = useRef<number | null>(null);
  const busy = useRef(false);

  useEffect(() => () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    if (ticker.current !== null) window.clearInterval(ticker.current);
  }, []);

  const shownBet = spinning ? wager : clampBet(bet, bank);
  // The balance is already settled in storage when the reels start; keep the display behind the animation.
  const shownBank = spinning ? held : bank;
  const canSpin = ready && !spinning && bank >= shownBet && bank >= MIN_BET;

  const spin = useCallback(async (free = false) => {
    if (busy.current) return;
    const balance = current();
    // A free spin (ticket) plays the current bet, capped at FREE_SPIN_MAX_BET, without taking coins.
    const stake = free ? Math.min(clampBet(bet, Math.max(balance, FREE_SPIN_MAX_BET)), FREE_SPIN_MAX_BET) : clampBet(bet, balance);
    if (!free && (balance < MIN_BET || balance < stake)) return;

    busy.current = true;
    if (free && !(await items?.use("slot-free"))) {
      busy.current = false;
      return;
    }
    const result = spinSlots(randomInt);
    const payout = slotPayout(stake, result);
    const cost = free ? 0 : stake;
    const after = change(payout - cost);

    const reelStopped = [false, false, false];
    setWager(stake);
    setHeld(balance - cost);
    setOutcome(null);
    setStopped([false, false, false]);
    setSpinning(true);

    ticker.current = window.setInterval(() => {
      setGrid((prev) => prev.map((column, reel) => (reelStopped[reel] ? column : randomColumn())));
    }, TICK_MS);

    timers.current = REEL_STOP_MS.map((ms, reel) => window.setTimeout(() => {
      reelStopped[reel] = true;
      setGrid((prev) => prev.map((column, index) => (index === reel ? result.grid[reel] : column)));
      setStopped((prev) => prev.map((value, index) => (index === reel ? true : value)));
      if (reel !== REEL_STOP_MS.length - 1) return;
      if (ticker.current !== null) window.clearInterval(ticker.current);
      ticker.current = null;
      setHeld(after);
      setOutcome({ result, payout, wager: stake, free });
      setSpinning(false);
      busy.current = false;
    }, ms));
  }, [bet, change, current, items]);

  const winCells = useMemo(() => {
    const cells = new Set<string>();
    outcome?.result.wins.forEach((win) => {
      const rows = SLOT_LINES[win.line];
      for (let reel = 0; reel < win.count; reel++) cells.add(`${reel}-${rows[reel]}`);
    });
    return cells;
  }, [outcome]);

  const hitSymbols = useMemo(() => new Set(outcome?.result.wins.map((win) => win.symbol) ?? []), [outcome]);

  const adjustBet = (delta: number) => setBet(clampBet(shownBet + delta, bank));

  const message = spinning
    ? "回転中…"
    : outcome
      ? outcome.payout > 0
        ? `${outcome.free ? "フリースピンで " : ""}${outcome.payout.toLocaleString("ja-JP")} コイン獲得！（${outcome.result.wins.length}ライン）`
        : outcome.free ? "フリースピンはハズレ…" : "ハズレ… もう一度！"
      : "ベットしてSPINを押してね";
  const messageClass = outcome && !spinning
    ? outcome.payout > 0 ? styles.messageWin : styles.messageLose
    : "";

  return (
    <CasinoFrame title="ネオン スロット" bank={shownBank} ready={ready} embedded={embedded} onClose={onClose}>
      <div className={styles.slotLayout}>
        <section className={styles.panel} aria-label="スロットマシン">
          <div className={styles.machine}>
            <div className={styles.reels} role="group" aria-label="リール">
              {grid.map((column, reel) => (
                <div className={styles.reel} key={reel}>
                  {column.map((symbol, row) => {
                    const classes = [styles.cell];
                    if (symbol === "bar") classes.push(styles.cellBar);
                    if (!stopped[reel]) classes.push(styles.cellSpinning);
                    if (!spinning && winCells.has(`${reel}-${row}`)) classes.push(styles.cellWin);
                    return <div className={classes.join(" ")} key={row}>{SLOT_EMOJI[symbol]}</div>;
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.slotControls}>
            <p className={`${styles.message} ${messageClass}`} role="status" aria-live="polite">{message}</p>

            <div className={styles.betRow}>
              <button className={styles.button} onClick={() => adjustBet(-BET_STEP)} disabled={spinning || shownBet <= MIN_BET} aria-label="ベットを減らす">−</button>
              <span className={styles.betValue}>{shownBet.toLocaleString("ja-JP")}</span>
              <button className={styles.button} onClick={() => adjustBet(BET_STEP)} disabled={spinning || shownBet >= maxBet(bank)} aria-label="ベットを増やす">＋</button>
              {BET_PRESETS.map((preset) => (
                <button className={styles.button} key={preset} onClick={() => setBet(clampBet(preset, bank))} disabled={spinning || preset > maxBet(bank)}>{preset}</button>
              ))}
              <button className={styles.button} onClick={() => setBet(maxBet(bank))} disabled={spinning}>MAX</button>
            </div>

            <button className={`${styles.button} ${styles.buttonPrimary} ${styles.spinButton}`} onClick={() => void spin(false)} disabled={!canSpin}>
              {spinning ? "…" : "SPIN"}
            </button>

            {items ? (
              <button className={styles.itemButton} onClick={() => void spin(true)} disabled={!ready || spinning || freeSpins <= 0}>
                🎟 フリースピン券で回す（ベット{Math.min(shownBet, FREE_SPIN_MAX_BET)}・のこり{freeSpins}）
              </button>
            ) : null}

            {ready && !spinning && bank < MIN_BET ? (
              <button className={styles.button} onClick={() => refillIfBroke()}>
                コインがなくなりました — 1,000枚もらって再開
              </button>
            ) : null}
          </div>
        </section>

        <aside className={styles.panel} aria-label="配当表">
          <h2 className={styles.panelTitle}>配当表（1ラインの賭け金 × 倍率）</h2>
          <ul className={styles.payTable}>
            {PAY_ORDER.map((symbol) => (
              <li className={`${styles.payRow} ${hitSymbols.has(symbol) && !spinning ? styles.payRowHit : ""}`} key={symbol}>
                <span>{SLOT_EMOJI[symbol]} {SLOT_EMOJI[symbol]} {SLOT_EMOJI[symbol]}</span>
                <span className={styles.payMult}>×{SLOT_TRIPLE_PAY[symbol]}</span>
              </li>
            ))}
            <li className={styles.payRow}><span>🍒 🍒 （左から）</span><span className={styles.payMult}>×{SLOT_CHERRY_TWO}</span></li>
            <li className={styles.payRow}><span>🍒 （左のリール）</span><span className={styles.payMult}>×{SLOT_CHERRY_ONE}</span></li>
          </ul>
          <p className={styles.smallNote}>
            {SLOT_LINE_COUNT}ライン（{SLOT_LINE_LABELS.join("・")}）が有効。合計ベットを{SLOT_LINE_COUNT}等分して各ラインに賭けます
            （現在 1ライン = {lineBet(shownBet)}）。理論還元率 {(THEORETICAL_RTP * 100).toFixed(1)}%。
          </p>
        </aside>
      </div>
    </CasinoFrame>
  );
}
