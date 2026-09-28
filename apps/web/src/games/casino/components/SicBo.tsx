"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "../casino.module.css";
import { CasinoFrame } from "./CasinoFrame";
import { useCasinoBank } from "../useCasinoBank";
import { MIN_BET, randomInt } from "../bank";
import {
  SICBO_BETS, diceTotal, isTriple, rollDice, settleSicBo, type Dice, type SicBoBetId,
} from "../sicbo";

const CHIPS = [10, 50, 100, 500] as const;
const ROLL_MS = 900;
const FACES = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
const CHIP_CLASS: Record<number, string> = { 10: styles.chip10, 50: styles.chip50, 100: styles.chip100, 500: styles.chip500 };

type Bets = Partial<Record<SicBoBetId, number>>;

export function SicBo({ embedded = false, onClose }: { embedded?: boolean; onClose?: () => void } = {}) {
  const { ready, bank, change, refillIfBroke, current } = useCasinoBank();
  const [chip, setChip] = useState<number>(10);
  const [bets, setBets] = useState<Bets>({});
  const [dice, setDice] = useState<Dice | null>(null);
  const [shown, setShown] = useState<Dice>([1, 1, 1]);
  const [rolling, setRolling] = useState(false);
  const [held, setHeld] = useState(0);
  const [wins, setWins] = useState<SicBoBetId[]>([]);
  const [net, setNet] = useState<number | null>(null);
  const [history, setHistory] = useState<Dice[]>([]);
  const timer = useRef<number | null>(null);
  const flicker = useRef<number | null>(null);
  const busy = useRef(false);

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    if (flicker.current !== null) window.clearInterval(flicker.current);
  }, []);

  const staked = useMemo(() => Object.values(bets).reduce((sum, n) => sum + (n ?? 0), 0), [bets]);
  const shownBank = rolling ? held : bank;
  const free = rolling ? held : bank - staked;

  const place = (id: SicBoBetId) => {
    if (busy.current || chip > current() - staked) return;
    setBets((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + chip }));
    setNet(null);
  };

  const roll = () => {
    if (busy.current) return;
    const balance = current();
    if (staked <= 0 || staked > balance) return;
    busy.current = true;
    // The coins move as soon as the dice are decided; the tumbling below is just for show.
    const result = rollDice(randomInt);
    const settled = settleSicBo(bets, result);
    change(settled.net);
    setHeld(balance - staked);
    setRolling(true);
    setNet(null);
    setDice(null);
    flicker.current = window.setInterval(() => setShown([randomInt(6) + 1, randomInt(6) + 1, randomInt(6) + 1]), 90);
    timer.current = window.setTimeout(() => {
      if (flicker.current !== null) window.clearInterval(flicker.current);
      setShown(result);
      setDice(result);
      setWins(settled.wins);
      setNet(settled.net);
      setHistory((list) => [result, ...list].slice(0, 8));
      setRolling(false);
      busy.current = false;
    }, ROLL_MS);
  };

  const clear = () => {
    if (busy.current) return;
    setBets({});
    setNet(null);
  };

  const triple = dice ? isTriple(dice) : false;
  const message = rolling
    ? "コロコロ…"
    : dice
      ? `${diceTotal(dice)}（${dice.join("・")}）${triple ? " ゾロ目！ 大小はどちらも負け" : diceTotal(dice) >= 11 ? " 大" : " 小"} ／ ${(net ?? 0) >= 0 ? "+" : ""}${(net ?? 0).toLocaleString("ja-JP")}`
      : "賭けたい場所をクリックしてチップを置いて、「ふる」を押してね";

  return (
    <CasinoFrame title="サイコロ（大小）" bank={shownBank} ready={ready} embedded={embedded} onClose={onClose} closeDisabled={rolling}>
      <section className={styles.panel} aria-label="サイコロのテーブル">
        <div className={styles.tableFelt}>
          <div className={styles.diceRow} data-rolling={rolling}>
            {shown.map((face, i) => (
              <span key={i} className={styles.die} data-hit={!rolling && dice !== null && triple}>{FACES[face]}</span>
            ))}
          </div>
          {history.length > 0 ? (
            <p className={styles.diceHistory}>
              {history.map((d, i) => <span key={i}>{diceTotal(d)}{isTriple(d) ? "★" : ""}</span>)}
            </p>
          ) : null}
        </div>

        <p className={`${styles.message} ${net !== null ? (net >= 0 ? styles.messageWin : styles.messageLose) : ""}`} role="status" aria-live="polite" style={{ marginTop: 12 }}>
          {message}
        </p>

        <div className={styles.sicGrid}>
          {SICBO_BETS.map((b) => {
            const amount = bets[b.id] ?? 0;
            return (
              <button
                key={b.id}
                type="button"
                className={`${styles.sicSpot} ${b.id === "big" || b.id === "small" ? styles.sicWide : ""}`}
                data-win={wins.includes(b.id) && !rolling && dice !== null}
                onClick={() => place(b.id)}
                disabled={rolling}
                title={b.hint}
              >
                <span className={styles.sicLabel}>{b.label}</span>
                <small>{b.hint}</small>
                {amount > 0 ? <span className={`${styles.stakeBadge}`}>{amount.toLocaleString("ja-JP")}</span> : null}
              </button>
            );
          })}
        </div>

        <div className={styles.chipRow} aria-label="チップ">
          {CHIPS.map((value) => (
            <button
              key={value}
              className={`${styles.chipButton} ${CHIP_CLASS[value]} ${chip === value ? styles.chipSelected : ""}`}
              onClick={() => setChip(value)}
              disabled={rolling}
            >
              {value}
            </button>
          ))}
        </div>

        <div className={styles.actionRowCenter}>
          <button className={`${styles.button} ${styles.buttonPrimary}`} onClick={roll} disabled={!ready || rolling || staked <= 0 || staked > bank}>
            ふる（ベット {staked.toLocaleString("ja-JP")}）
          </button>
          <button className={styles.button} onClick={clear} disabled={rolling || staked <= 0}>チップをクリア</button>
        </div>
        {ready && free < MIN_BET && staked <= 0 && bank < MIN_BET ? (
          <button className={styles.button} onClick={() => refillIfBroke()}>コインがなくなりました — 1,000枚もらって再開</button>
        ) : null}
        <p className={styles.smallNote}>
          大（11〜17）と小（4〜10）は1:1、ゾロ目はどちらも負け。数字は、その目が出たサイコロ1つにつき1:1（3つ出ると 3:1）。同じ賭け方でくりかえし遊べます。
        </p>
      </section>
    </CasinoFrame>
  );
}
