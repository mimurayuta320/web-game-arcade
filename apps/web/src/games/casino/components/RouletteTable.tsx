"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "../casino.module.css";
import { CasinoFrame } from "./CasinoFrame";
import { useCasinoBank } from "../useCasinoBank";
import { useCasinoItems } from "../items";
import { MIN_BET, randomInt } from "../bank";
import {
  ROULETTE_WHEEL, betWins, rouletteColor, settleRoulette, straightBetId, totalStake,
  type RouletteBetId, type RouletteBets, type RouletteColor, type RouletteSettlement,
} from "../roulette";

const CHIPS = [10, 50, 100, 500] as const;
const STEP = 360 / ROULETTE_WHEEL.length;
const SPIN_MS = 4700;
const HISTORY_LIMIT = 14;

const COLOR_CLASS: Record<RouletteColor, string> = {
  red: styles.colorRed,
  black: styles.colorBlack,
  green: styles.colorGreen,
};
const COLOR_LABEL: Record<RouletteColor, string> = { red: "赤", black: "黒", green: "緑" };
const CHIP_CLASS: Record<number, string> = {
  10: styles.chip10,
  50: styles.chip50,
  100: styles.chip100,
  500: styles.chip500,
};

type Placement = { id: RouletteBetId; amount: number };

function polar(radius: number, angle: number): [number, number] {
  const rad = (angle * Math.PI) / 180;
  return [150 + radius * Math.sin(rad), 150 - radius * Math.cos(rad)];
}

function wedgePath(index: number): string {
  const [x0, y0] = polar(140, (index - 0.5) * STEP);
  const [x1, y1] = polar(140, (index + 0.5) * STEP);
  const [x2, y2] = polar(92, (index + 0.5) * STEP);
  const [x3, y3] = polar(92, (index - 0.5) * STEP);
  const f = (n: number) => n.toFixed(2);
  return `M${f(x0)} ${f(y0)} A140 140 0 0 1 ${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)} A92 92 0 0 0 ${f(x3)} ${f(y3)} Z`;
}

const WHEEL_FILL: Record<RouletteColor, string> = { red: "#c62828", black: "#1b1b1b", green: "#1b8a4a" };

function Wheel({ angle }: { angle: number }) {
  return (
    <svg className={styles.wheel} viewBox="0 0 300 300" style={{ transform: `rotate(${angle}deg)` }} aria-hidden="true">
      <circle cx="150" cy="150" r="148" fill="#5a3d0a" />
      {ROULETTE_WHEEL.map((n, index) => (
        <g key={n}>
          <path d={wedgePath(index)} fill={WHEEL_FILL[rouletteColor(n)]} stroke="#f5c451" strokeWidth="0.6" />
          <text
            x="150" y="26" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff"
            transform={`rotate(${(index * STEP).toFixed(2)} 150 150)`}
          >
            {n}
          </text>
        </g>
      ))}
      <circle cx="150" cy="150" r="90" fill="#2a1a3a" stroke="#f5c451" strokeWidth="2" />
      <circle cx="150" cy="150" r="20" fill="#f5c451" />
    </svg>
  );
}

export function RouletteTable({ embedded = false, onClose }: { embedded?: boolean; onClose?: () => void } = {}) {
  const { ready, bank, change, refillIfBroke, current } = useCasinoBank();
  const [chip, setChip] = useState<number>(10);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [lastPlacements, setLastPlacements] = useState<Placement[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [angle, setAngle] = useState(0);
  const [held, setHeld] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [outcome, setOutcome] = useState<RouletteSettlement | null>(null);
  const [insure, setInsure] = useState(false);
  /** Coins handed back by the insurance chip on the last spin. */
  const [refund, setRefund] = useState(0);
  const items = useCasinoItems();
  const insuranceLeft = items?.count("roulette-insure") ?? 0;
  const timer = useRef<number | null>(null);
  const busy = useRef(false);

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);

  const bets = useMemo<RouletteBets>(() => {
    const next: RouletteBets = {};
    placements.forEach(({ id, amount }) => { next[id] = (next[id] ?? 0) + amount; });
    return next;
  }, [placements]);
  const staked = totalStake(bets);
  const shownBank = spinning ? held : bank;
  const free = spinning ? held : bank - staked;

  const place = useCallback((id: RouletteBetId) => {
    if (busy.current || chip > current() - totalStake(bets)) return;
    setPlacements((list) => [...list, { id, amount: chip }]);
    setOutcome(null);
  }, [bets, chip, current]);

  const spin = useCallback(async () => {
    if (busy.current) return;
    const balance = current();
    const stake = totalStake(bets);
    if (stake <= 0 || stake > balance) return;

    busy.current = true;
    // The insurance chip is spent on the spin whether or not it pays.
    const insured = insure && insuranceLeft > 0 && Boolean(await items?.use("roulette-insure"));
    const number = randomInt(ROULETTE_WHEEL.length);
    // The wheel is laid out in ROULETTE_WHEEL order, so the pocket index decides where it must stop.
    const pocket = ROULETTE_WHEEL.indexOf(number);
    const settlement = settleRoulette(bets, number);
    const back = insured && settlement.totalReturn === 0 ? Math.floor(stake / 2) : 0;
    const after = change(settlement.totalReturn + back - stake);
    setRefund(back);
    if (insured) setInsure(false);

    setHeld(balance - stake);
    setOutcome(null);
    setSpinning(true);
    setAngle((prev) => Math.ceil(prev / 360) * 360 + 360 * 5 + ((360 - ((pocket * STEP) % 360)) % 360));

    timer.current = window.setTimeout(() => {
      setHeld(after);
      setOutcome(settlement);
      setHistory((list) => [number, ...list].slice(0, HISTORY_LIMIT));
      setLastPlacements(placements);
      setPlacements([]);
      setSpinning(false);
      busy.current = false;
    }, SPIN_MS);
  }, [bets, change, current, placements, insure, insuranceLeft, items]);

  const rebet = () => {
    const total = lastPlacements.reduce((sum, item) => sum + item.amount, 0);
    if (total <= 0 || total > bank) return;
    setPlacements(lastPlacements);
    setOutcome(null);
  };

  const cell = (id: RouletteBetId, label: string, extra = "") => {
    const stake = bets[id] ?? 0;
    const hit = outcome !== null && !spinning && betWins(id, outcome.number);
    return (
      <button
        key={id}
        type="button"
        className={`${styles.betCell} ${extra} ${hit ? styles.betCellHit : ""}`}
        onClick={() => place(id)}
        disabled={spinning}
        aria-label={`${label} に ${chip} コインをベット`}
      >
        {label}
        {stake > 0 ? <span className={styles.stakeBadge}>{stake}</span> : null}
      </button>
    );
  };

  const numberCell = (n: number) => cell(
    straightBetId(n),
    String(n),
    n === 0 ? styles.betZero : rouletteColor(n) === "red" ? styles.betRed : styles.betBlack,
  );

  const message = spinning
    ? "ボールが回っています…"
    : outcome
      ? outcome.totalReturn > 0
        ? `当たり！ ${outcome.totalReturn.toLocaleString("ja-JP")} コイン払い戻し（収支 ${outcome.net >= 0 ? "+" : ""}${outcome.net.toLocaleString("ja-JP")}）`
        : refund > 0
          ? `ハズレ… でもほけんで ${refund.toLocaleString("ja-JP")} コインもどった（-${(outcome.totalStake - refund).toLocaleString("ja-JP")}）`
          : `ハズレ… （-${outcome.totalStake.toLocaleString("ja-JP")}）`
      : "チップを選んで、盤面をタップしてベット";
  const messageClass = outcome && !spinning
    ? outcome.totalReturn > 0 ? styles.messageWin : styles.messageLose
    : "";
  const lastTotal = lastPlacements.reduce((sum, item) => sum + item.amount, 0);

  return (
    <CasinoFrame title="ネオン ルーレット" bank={shownBank} ready={ready} embedded={embedded} onClose={onClose}>
      <div className={styles.rouletteLayout}>
        <section className={styles.panel} aria-label="ルーレットホイール">
          <div className={styles.wheelWrap}>
            <Wheel angle={angle} />
            <div className={styles.wheelPointer} />
            {outcome && !spinning ? (
              <div className={styles.wheelResult}>
                <div className={`${styles.resultBadge} ${COLOR_CLASS[outcome.color]}`} aria-label={`出目 ${outcome.number} ${COLOR_LABEL[outcome.color]}`}>
                  {outcome.number}
                </div>
              </div>
            ) : null}
          </div>
          <div className={styles.history} aria-label="出目の履歴">
            {history.map((n, index) => (
              <span className={`${styles.historyDot} ${COLOR_CLASS[rouletteColor(n)]}`} key={`${index}-${n}`}>{n}</span>
            ))}
          </div>
        </section>

        <section className={styles.panel} aria-label="ベット盤面">
          <p className={`${styles.message} ${messageClass}`} role="status" aria-live="polite">{message}</p>

          <div className={styles.felt}>
            <div className={styles.numberGrid}>
              {numberCell(0)}
              {Array.from({ length: 36 }, (_, i) => numberCell(i + 1))}
            </div>
            <div className={styles.outsideRow}>
              {cell("c1", "列1")}
              {cell("c2", "列2")}
              {cell("c3", "列3")}
            </div>
            <div className={styles.outsideRow}>
              {cell("d1", "1st 12")}
              {cell("d2", "2nd 12")}
              {cell("d3", "3rd 12")}
            </div>
            <div className={`${styles.outsideRow} ${styles.outsideRowSix}`}>
              {cell("low", "1-18")}
              {cell("even", "偶数")}
              {cell("red", "赤", styles.betRed)}
              {cell("black", "黒", styles.betBlack)}
              {cell("odd", "奇数")}
              {cell("high", "19-36")}
            </div>
          </div>

          <div className={styles.chipRow} style={{ marginTop: 14 }} role="group" aria-label="チップ">
            {CHIPS.map((value) => (
              <button
                key={value}
                type="button"
                className={`${styles.chipButton} ${CHIP_CLASS[value]} ${chip === value ? styles.chipSelected : ""}`}
                onClick={() => setChip(value)}
                disabled={spinning}
                aria-pressed={chip === value}
              >
                {value}
              </button>
            ))}
          </div>

          <div className={styles.actionRow} style={{ marginTop: 14 }}>
            <button className={`${styles.button} ${styles.buttonPrimary}`} onClick={() => void spin()} disabled={spinning || staked <= 0 || staked > bank}>
              スピン
            </button>
            {items ? (
              <label className={styles.itemToggle}>
                <input type="checkbox" checked={insure && insuranceLeft > 0} disabled={spinning || insuranceLeft <= 0} onChange={(e) => setInsure(e.target.checked)} />
                🛡 ほけんチップを使う（のこり{insuranceLeft}）
              </label>
            ) : null}
            <button className={styles.button} onClick={() => setPlacements((list) => list.slice(0, -1))} disabled={spinning || placements.length === 0}>
              1つ取り消す
            </button>
            <button className={styles.button} onClick={() => setPlacements([])} disabled={spinning || placements.length === 0}>
              クリア
            </button>
            <button className={styles.button} onClick={rebet} disabled={spinning || placements.length > 0 || lastTotal <= 0 || lastTotal > bank}>
              同じ賭けをもう一度
            </button>
            <span className={styles.totalStake}>ベット合計 <strong>{staked.toLocaleString("ja-JP")}</strong>（残り {Math.max(0, free).toLocaleString("ja-JP")}）</span>
          </div>

          {ready && !spinning && bank < MIN_BET ? (
            <button className={styles.button} style={{ marginTop: 12 }} onClick={() => refillIfBroke()}>
              コインがなくなりました — 1,000枚もらって再開
            </button>
          ) : null}

          <p className={styles.smallNote}>
            ヨーロピアン（0が1つ）。1点賭け 36倍払い戻し、2倍賭け（赤黒・奇偶・前半後半）2倍、12個賭け・列賭け 3倍。
            0が出ると外側の賭けはすべて負け。理論還元率はどの賭けも 97.3%。
          </p>
        </section>
      </div>
    </CasinoFrame>
  );
}
