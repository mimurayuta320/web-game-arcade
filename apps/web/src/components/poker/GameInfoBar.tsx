"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

type InfoCardTone = "chips" | "pot" | "bet" | "call" | "phase" | "record" | "round";

type PokerPhaseKey = "waiting" | "preflop" | "flop" | "turn" | "river" | "showdown" | "result" | "tournamentResult";

type PokerLanguage = "ja" | "ko" | "en" | "zh";

type PokerGameInfoBarProps = {
  language: PokerLanguage;
  chips: number;
  pot: number;
  currentBet: number;
  toCall: number;
  phaseLabel: string;
  phaseKey: PokerPhaseKey;
  wins: number;
  losses: number;
  draws: number;
  round: number;
};

const toneClassMap: Record<InfoCardTone, string> = {
  chips: "border-amber-300/50 bg-amber-500/12 text-amber-100",
  pot: "border-orange-300/50 bg-orange-500/12 text-orange-100",
  bet: "border-sky-300/45 bg-sky-500/12 text-sky-100",
  call: "border-rose-300/50 bg-rose-500/13 text-rose-100",
  phase: "border-violet-300/45 bg-violet-500/12 text-violet-100",
  record: "border-emerald-300/45 bg-emerald-500/12 text-emerald-100",
  round: "border-slate-300/35 bg-slate-500/12 text-slate-100",
};

function resolveLocale(language: PokerLanguage): string {
  if (language === "ko") return "ko-KR";
  if (language === "en") return "en-US";
  if (language === "zh") return "zh-CN";
  return "ja-JP";
}

function useAnimatedCount(value: number, durationMs = 320): number {
  const [display, setDisplay] = useState(Math.max(0, Math.floor(value)));

  useEffect(() => {
    const target = Math.max(0, Math.floor(value));
    const from = display;
    if (from === target) return;

    let frameId = 0;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / durationMs);
      const eased = 1 - (1 - progress) * (1 - progress);
      const next = Math.round(from + (target - from) * eased);
      setDisplay(next);
      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [value]);

  return display;
}

function InfoCard({
  tone,
  title,
  icon,
  value,
  flashKey,
  valueClassName,
  sub,
  compact = false,
}: {
  tone: InfoCardTone;
  title: string;
  icon: string;
  value: ReactNode;
  flashKey: string | number;
  valueClassName?: string;
  sub?: ReactNode;
  compact?: boolean;
}) {
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    setIsFlashing(true);
    const timerId = window.setTimeout(() => {
      setIsFlashing(false);
    }, 220);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [flashKey]);

  return (
    <article
      className={`flex ${compact ? "h-[104px] min-w-[136px]" : "h-[118px] min-w-[152px]"} flex-1 flex-col justify-between rounded-xl border ${compact ? "px-2.5 py-2" : "px-3 py-2.5"} shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-opacity duration-200 ${toneClassMap[tone]} ${isFlashing ? "opacity-85" : "opacity-100"}`}
    >
      <p className={`${compact ? "text-[9px]" : "text-[10px]"} font-semibold tracking-[0.14em] text-white/75`}>
        <span className="mr-1">{icon}</span>
        {title}
      </p>
      <div>
        <p className={`${compact ? "text-[1.2rem]" : "text-[1.4rem]"} font-black leading-tight text-white ${valueClassName || ""}`}>{value}</p>
        {sub ? <div className={`${compact ? "mt-0.5 text-[10px]" : "mt-1 text-[11px]"} text-white/75`}>{sub}</div> : null}
      </div>
    </article>
  );
}

export default function GameInfoBar({
  language,
  chips,
  pot,
  currentBet,
  toCall,
  phaseLabel,
  phaseKey,
  wins,
  losses,
  draws,
  round,
}: PokerGameInfoBarProps) {
  const locale = useMemo(() => resolveLocale(language), [language]);
  const format = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const chipsAnimated = useAnimatedCount(chips);
  const potAnimated = useAnimatedCount(pot);
  const betAnimated = useAnimatedCount(currentBet);
  const callAnimated = useAnimatedCount(toCall);
  const roundAnimated = useAnimatedCount(round, 260);

  const callNeedsAction = toCall > 0;
  const phaseTone = phaseKey === "result" || phaseKey === "tournamentResult" ? "text-amber-100 border-amber-200/60 bg-amber-400/20" : "text-violet-100 border-violet-200/60 bg-violet-400/20";

  return (
    <section className="mt-2">
      <div className="flex flex-wrap items-stretch gap-2.5 md:gap-3">
        <InfoCard tone="chips" title="所持チップ" icon="💰" value={format.format(chipsAnimated)} flashKey={chips} valueClassName="text-amber-100" />
        <InfoCard tone="pot" title="ポット" icon="🪙" value={format.format(potAnimated)} flashKey={pot} valueClassName="text-orange-100" />
        <InfoCard tone="bet" title="現在ベット" icon="📈" value={format.format(betAnimated)} flashKey={currentBet} valueClassName="text-sky-100" />
        <InfoCard
          tone="call"
          title="必要コール"
          icon="📞"
          value={callNeedsAction ? format.format(callAnimated) : "チェック可能"}
          flashKey={toCall}
          compact
          valueClassName={callNeedsAction ? "text-rose-100" : "text-emerald-100 text-[1.15rem]"}
          sub={callNeedsAction ? "コールが必要です" : "ベット不要で進行できます"}
        />
        <InfoCard
          tone="phase"
          title="フェーズ"
          icon="🃏"
          flashKey={phaseLabel}
          value={
            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-sm font-black ${phaseTone}`}>
              {phaseLabel}
            </span>
          }
          valueClassName="text-[1.05rem]"
        />
        <InfoCard
          tone="record"
          title="勝敗"
          icon="🏆"
          flashKey={`${wins}-${losses}-${draws}`}
          value={
            <span className="inline-flex flex-wrap items-center gap-1 text-[1rem] sm:text-[1.05rem]">
              <span className="font-black text-emerald-100">{wins}勝</span>
              <span className="text-white/45">|</span>
              <span className="font-black text-rose-100">{losses}敗</span>
              <span className="text-white/45">|</span>
              <span className="font-black text-slate-100">{draws}分</span>
            </span>
          }
          valueClassName="text-[1rem]"
        />
        <InfoCard tone="round" title="ラウンド" icon="🎯" value={format.format(roundAnimated)} flashKey={round} />
      </div>
    </section>
  );
}
