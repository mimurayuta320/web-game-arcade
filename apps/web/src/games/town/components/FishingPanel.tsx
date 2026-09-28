"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "@/app/games/town/town.module.css";
import type { TownGame, Wallet } from "../core/TownGame";
import { BAITS, FISH, RARITY_LABEL, baitDef, rodDef } from "../shared/shop";
import {
  REEL_TIME_LIMIT, newReel, perfectRatio, stepReel, type ReelState,
} from "../fishing/reel";
import { ReelDial } from "./ReelDial";

type Props = {
  game: TownGame;
  wallet: Wallet | null;
  onOpenShop: () => void;
  onClose: () => void;
};

type Cast = { castId: string; biteMs: number; power: number; speed: number; rarity: string; rod: string; frame: number };
type Caught = { emoji: string; label: string; rarity: string; cm: number; points: number; perfect: number; isRecord: boolean };

type Phase =
  | { kind: "ready" }
  | { kind: "casting" }
  | { kind: "waiting"; cast: Cast }
  | { kind: "bite"; cast: Cast }
  | { kind: "reel"; cast: Cast }
  | { kind: "sending"; caught: boolean }
  | { kind: "caught"; result: Caught }
  | { kind: "escaped"; reason: string };

/** How long you have to react once the float goes under. */
const BITE_WINDOW_MS = 2200;

/** Keep receiving pointerup even if the finger/mouse leaves the panel while holding. */
function capture(e: React.PointerEvent<HTMLElement>) {
  try {
    e.currentTarget.setPointerCapture(e.pointerId);
  } catch {
    // pointer already gone (e.g. released instantly) – nothing to capture
  }
}

export function FishingPanel({ game, wallet, onOpenShop, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>({ kind: "ready" });
  const [reel, setReel] = useState<ReelState>(newReel);
  const [bookOpen, setBookOpen] = useState(false);
  const [tooSoon, setTooSoon] = useState(false);
  const holding = useRef(false);
  const phaseRef = useRef<Phase>(phase);
  phaseRef.current = phase;

  const gear = wallet?.fishing ?? { rod: "bamboo", bait: "none", rods: ["bamboo"], baits: {} };
  const rod = rodDef(gear.rod);

  // Server answers: the cast (bite timing), the catch, or the escape.
  useEffect(() => game.onEvent((event) => {
    if (event.type === "fish-cast") {
      setPhase({ kind: "waiting", cast: event });
    } else if (event.type === "fish-caught") {
      setPhase({ kind: "caught", result: { ...event.fish, cm: event.cm, points: event.points, perfect: event.perfect, isRecord: event.isRecord } });
    } else if (event.type === "fish-escaped") {
      setPhase((p) => (p.kind === "sending" || p.kind === "reel" || p.kind === "bite" ? { kind: "escaped", reason: "にげられた…" } : p));
    } else if (event.type === "error" && phaseRef.current.kind === "casting") {
      setPhase({ kind: "ready" });
    }
  }), [game]);

  // Waiting for a bite → the float goes under.
  useEffect(() => {
    if (phase.kind !== "waiting") return undefined;
    const timer = window.setTimeout(() => setPhase({ kind: "bite", cast: phase.cast }), phase.cast.biteMs);
    return () => window.clearTimeout(timer);
  }, [phase]);

  // Too slow to strike → it got away.
  useEffect(() => {
    if (phase.kind !== "bite") return undefined;
    const cast = phase.cast;
    const timer = window.setTimeout(() => {
      game.fishResult(cast.castId, false, 0);
      setPhase({ kind: "escaped", reason: "あわせるのが遅かった…" });
    }, BITE_WINDOW_MS);
    return () => window.clearTimeout(timer);
  }, [game, phase]);

  const finishReel = useCallback((cast: Cast, state: ReelState) => {
    const caught = state.done === "caught";
    game.fishResult(cast.castId, caught, perfectRatio(state));
    setPhase(caught ? { kind: "sending", caught } : { kind: "escaped", reason: state.elapsed >= REEL_TIME_LIMIT ? "時間切れ… にげられた" : "糸が切れた… にげられた" });
  }, [game]);

  // The reeling loop.
  useEffect(() => {
    if (phase.kind !== "reel") return undefined;
    const cast = phase.cast;
    const fish = { power: cast.power, speed: cast.speed, frame: cast.frame };
    const rodStats = rodDef(cast.rod);
    // Pressed the button to strike? Let go once before the first round can start.
    let state: ReelState = { ...newReel(), needRelease: holding.current };
    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      state = stepReel(state, dt, { holding: holding.current }, fish, rodStats, Math.random);
      setReel(state);
      if (state.done) {
        finishReel(cast, state);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    setReel(state);
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [finishReel, phase]);

  const cast = () => {
    setTooSoon(false);
    if (game.fishCast()) setPhase({ kind: "casting" });
  };

  const press = () => {
    holding.current = true;
    const p = phaseRef.current;
    if (p.kind === "bite") setPhase({ kind: "reel", cast: p.cast });
    else if (p.kind === "waiting") setTooSoon(true);
  };
  const release = () => {
    holding.current = false;
  };

  // Letting go is tracked on the window, so it is never missed when the pointer leaves the panel or the panel
  // re-renders under the finger; the space bar works like holding the mouse button.
  useEffect(() => {
    const typing = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      return Boolean(target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT"));
    };
    const down = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat || typing(e)) return;
      e.preventDefault();
      press();
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") release();
    };
    const end = () => release();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    window.addEventListener("blur", end);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      window.removeEventListener("blur", end);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- press/release only touch refs and phaseRef
  }, []);
  const close = () => {
    const p = phaseRef.current;
    if (p.kind === "waiting" || p.kind === "bite" || p.kind === "reel") game.fishResult(p.cast.castId, false, 0);
    game.stopFishing();
    onClose();
  };

  const busy = phase.kind === "casting" || phase.kind === "waiting" || phase.kind === "bite" || phase.kind === "reel" || phase.kind === "sending";
  const baitCount = gear.bait !== "none" ? gear.baits[gear.bait] ?? 0 : 0;
  const caughtKinds = FISH.filter((f) => (wallet?.fishLog[f.id]?.count ?? 0) > 0).length;

  return (
    <div className={styles.fishingPanel} role="dialog" aria-label="つり">
      <div className={styles.fishingHeader}>
        <strong>🎣 つり</strong>
        <span className={styles.fishingPoints}>釣りポイント {wallet?.fishPoints.toLocaleString() ?? "—"}</span>
        <button type="button" className={styles.fishingLink} onClick={() => setBookOpen(!bookOpen)} disabled={busy}>
          図鑑 {caughtKinds}/{FISH.length}
        </button>
        <button type="button" className={styles.fishingLink} onClick={onOpenShop} disabled={busy}>釣り具屋</button>
        <button type="button" className={styles.closeButton} aria-label="釣りをやめる" onClick={close}>×</button>
      </div>

      {bookOpen && !busy ? (
        <ul className={styles.fishBook}>
          {[...FISH].sort((a, b) => Number((a.habitat ?? "sea") === "pond") - Number((b.habitat ?? "sea") === "pond")).map((f) => {
            const log = wallet?.fishLog[f.id];
            return (
              <li key={f.id} data-caught={Boolean(log)}>
                <span className={styles.fishBookEmoji}>{log ? f.emoji : "❔"}</span>
                <span>{log ? f.label : "？？？"}</span>
                <small>{f.habitat === "pond" ? "🏞 池" : "🌊 海"} ・ {RARITY_LABEL[f.rarity]}{log ? ` ・ ${log.count}匹 ・ 最大 ${log.best}cm` : ""}</small>
              </li>
            );
          })}
        </ul>
      ) : null}

      {phase.kind === "ready" || phase.kind === "casting" ? (
        <div className={styles.fishingBody}>
          <div className={styles.fishingGear}>
            <label>
              さお
              <select value={gear.rod} onChange={(e) => game.setFishGear({ rod: e.target.value })}>
                {gear.rods.map((id) => <option key={id} value={id}>{rodDef(id).label}</option>)}
              </select>
            </label>
            <label>
              エサ
              <select value={gear.bait} onChange={(e) => game.setFishGear({ bait: e.target.value })}>
                <option value="none">なし</option>
                {BAITS.filter((b) => (gear.baits[b.id] ?? 0) > 0).map((b) => (
                  <option key={b.id} value={b.id}>{b.label}（{gear.baits[b.id]}）</option>
                ))}
              </select>
            </label>
          </div>
          <p className={styles.fishingNote}>
            {rod.desc}
            {gear.bait !== "none" ? ` ／ ${baitDef(gear.bait)?.label}: ${baitDef(gear.bait)?.desc}（のこり${baitCount}）` : " ／ エサを使うと珍しい魚がかかりやすくなります"}
          </p>
          <button type="button" className={styles.primaryButton} onClick={cast} disabled={phase.kind === "casting"}>
            {phase.kind === "casting" ? "…" : "キャストする"}
          </button>
        </div>
      ) : null}

      {phase.kind === "waiting" || phase.kind === "bite" ? (
        <div
          className={styles.fishingBody}
          onPointerDown={(e) => {
            capture(e);
            press();
          }}
          onPointerUp={release}
          onPointerCancel={release}
        >
          <div className={styles.fishFloat} data-bite={phase.kind === "bite"}>
            <span>{phase.kind === "bite" ? "❗" : "〰"}</span>
          </div>
          <p className={styles.fishingBig}>
            {phase.kind === "bite" ? "かかった！ 長押しで引け！" : tooSoon ? "まだだよ… ウキがしずむまで待とう" : "ウキを見ていよう…"}
          </p>
          <p className={styles.fishingNote}>クリック（またはスペースキー）を長押し</p>
        </div>
      ) : null}

      {phase.kind === "reel" ? (
        <div
          className={`${styles.fishingBody} ${styles.reelBody}`}
          onPointerDown={(e) => {
            capture(e);
            press();
          }}
          onPointerUp={release}
          onPointerCancel={release}
          onContextMenu={(e) => e.preventDefault()}
        >
          <ReelDial
            size={reel.size}
            target={reel.target}
            mode={reel.mode}
            grade={reel.grade}
            lastGain={reel.lastGain}
            needRelease={reel.needRelease}
            rod={rodDef(phase.cast.rod)}
            frame={phase.cast.frame}
            secondsLeft={Math.max(0, Math.ceil(REEL_TIME_LIMIT - reel.elapsed))}
          />
          <div className={styles.catchGauge} aria-label="つりあげゲージ">
            <span style={{ width: `${reel.gauge * 100}%` }} />
          </div>
          <p className={styles.fishingNote}>
            長押しで円がちぢむ。円がわく（色つきの輪）の中に入った瞬間にはなそう！ わくの真ん中ほど PERFECT。早すぎ・遅すぎは BAD。ゲージが満タンでゲット
            {phase.cast.frame < 0.85 ? " ・ 大物！ まとがせまい" : phase.cast.frame > 1.15 ? " ・ 小さめの魚 まとが広い" : ""}
          </p>
        </div>
      ) : null}

      {phase.kind === "sending" ? (
        <div className={styles.fishingBody}>
          <p className={styles.fishingBig}>つりあげた…！</p>
        </div>
      ) : null}

      {phase.kind === "caught" ? (
        <div className={styles.fishingBody}>
          <p className={styles.fishResultEmoji}>{phase.result.emoji}</p>
          <p className={styles.fishingBig}>
            {phase.result.label} {phase.result.cm}cm
            {phase.result.isRecord ? <span className={styles.recordTag}>記録更新！</span> : null}
          </p>
          <p className={styles.fishingNote}>
            {RARITY_LABEL[phase.result.rarity as keyof typeof RARITY_LABEL] ?? ""} ・ PERFECT {Math.round(phase.result.perfect * 100)}% ・ +{phase.result.points} 釣りポイント
          </p>
          <button type="button" className={styles.primaryButton} onClick={cast}>もう一度キャスト</button>
        </div>
      ) : null}

      {phase.kind === "escaped" ? (
        <div className={styles.fishingBody}>
          <p className={styles.fishingBig}>{phase.reason}</p>
          <button type="button" className={styles.primaryButton} onClick={cast}>もう一度キャスト</button>
        </div>
      ) : null}
    </div>
  );
}
