import { useEffect, useMemo, useState } from "react";

type ShopEffectLine = {
  text: string;
  kind: "positive" | "negative" | "special" | "neutral";
};

type ShopCardProduct = {
  id: string;
  title: string;
  desc: string;
};

export type SurvivorsShopSlotView = {
  slotId: string;
  product: ShopCardProduct;
  category: "weapon" | "item";
  rarity: "common" | "rare" | "epic";
  price: number;
  locked: boolean;
  purchased: boolean;
  effects: ShopEffectLine[];
};

export type SurvivorsOwnedItemView = {
  id: string;
  title: string;
  desc: string;
  count: number;
};

export type SurvivorsOwnedWeaponView = {
  id: string;
  title: string;
  desc: string;
  rarity: "common" | "rare" | "epic";
  count: number;
};

export type SurvivorsShopStatTab = "main" | "sub";

export type SurvivorsShopStatRowView = {
  key: string;
  icon: string;
  label: string;
  description: string;
  tab: SurvivorsShopStatTab;
  value: number;
  baseline: number;
  unit?: "flat" | "percent" | "ms";
  displayValue?: string;
  semantic?: "normal" | "curse" | "rangeMagic";
  reverseBetter?: boolean;
};

export type SurvivorsShopWaveEventView = {
  key: string;
  kind: "horde" | "boss" | "special";
  label: string;
  icon: string;
  wave: number;
};

type WaveShopScreenProps = {
  finishedWave: number;
  nextWave: number;
  coins: number;
  rerollCost: number;
  canReroll: boolean;
  rerolling: boolean;
  slots: SurvivorsShopSlotView[];
  ownedItems: SurvivorsOwnedItemView[];
  ownedWeapons: SurvivorsOwnedWeaponView[];
  weaponLimit: number;
  currentLevel: number;
  stats: SurvivorsShopStatRowView[];
  waveEvents: SurvivorsShopWaveEventView[];
  canStartNextWave: boolean;
  onBuy: (slotId: string) => void;
  onToggleLock: (slotId: string) => void;
  onReroll: () => void;
  onStartNextWave: () => void;
};

const rarityTone: Record<SurvivorsShopSlotView["rarity"], string> = {
  common: "border-slate-400/35",
  rare: "border-cyan-300/55",
  epic: "border-fuchsia-300/55",
};

const effectTone: Record<ShopEffectLine["kind"], string> = {
  positive: "text-emerald-300",
  negative: "text-rose-300",
  special: "text-cyan-300",
  neutral: "text-slate-100",
};

export default function WaveShopScreen({
  finishedWave,
  nextWave,
  coins,
  rerollCost,
  canReroll,
  rerolling,
  slots,
  ownedItems,
  ownedWeapons,
  weaponLimit,
  currentLevel,
  stats,
  waveEvents,
  canStartNextWave,
  onBuy,
  onToggleLock,
  onReroll,
  onStartNextWave,
}: WaveShopScreenProps) {
  const [activeTab, setActiveTab] = useState<SurvivorsShopStatTab>("main");
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window === "undefined" ? 1200 : (window.innerWidth || 1200)));
  const [isStatusOpenCompact, setIsStatusOpenCompact] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const applyViewport = () => setViewportWidth(window.innerWidth || 1200);
    window.addEventListener("resize", applyViewport);
    return () => window.removeEventListener("resize", applyViewport);
  }, []);

  const isDesktop = viewportWidth >= 1000;
  const isCompact = viewportWidth < 1000;
  const isMobile = viewportWidth < 600;

  const visibleStats = useMemo(
    () => stats.filter((row) => row.tab === activeTab),
    [activeTab, stats],
  );

  const subStatsCount = useMemo(
    () => stats.filter((row) => row.tab === "sub").length,
    [stats],
  );

  const formatStatValue = (row: SurvivorsShopStatRowView) => {
    if (row.displayValue) return row.displayValue;
    const rounded = Math.abs(row.value - Math.round(row.value)) < 0.001
      ? String(Math.round(row.value))
      : String(Math.round(row.value * 10) / 10);
    if (row.unit === "percent") return `${rounded}%`;
    if (row.unit === "ms") return `${rounded}ms`;
    return rounded;
  };

  const getStatValueTone = (row: SurvivorsShopStatRowView) => {
    if (row.semantic === "curse") return "text-violet-300";
    const delta = row.value - row.baseline;
    if (Math.abs(delta) < 0.001) {
      return row.semantic === "rangeMagic" ? "text-sky-300" : "text-slate-200";
    }
    const improved = row.reverseBetter ? delta < 0 : delta > 0;
    return improved ? "text-emerald-300" : "text-rose-300";
  };

  const getStatLabelTone = (row: SurvivorsShopStatRowView) => {
    if (row.semantic === "curse") return "text-violet-200";
    if (row.semantic === "rangeMagic") return "text-sky-200";
    return "text-slate-200";
  };

  const nextHordeEvent = waveEvents.find((event) => event.kind === "horde");
  const nextBossEvent = waveEvents.find((event) => event.kind === "boss");
  const showStatusPanel = isDesktop || isStatusOpenCompact;

  return (
    <section className="relative mt-2 min-h-0 rounded-xl border border-cyan-200/30 bg-[radial-gradient(circle_at_30%_0%,rgba(34,211,238,0.12),rgba(2,6,23,0.94)_62%)] p-2.5 pb-20 min-[600px]:pb-2.5">
      <div className="grid min-h-0 gap-3 min-[1000px]:h-[min(74vh,580px)] min-[1000px]:grid-cols-[minmax(0,1fr)_clamp(300px,22vw,400px)]">
        <div className="min-w-0 min-h-0 space-y-2">
          <header className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-300/20 bg-slate-950/65 px-2.5 py-2">
            <p className="text-sm font-semibold text-cyan-100">ショップ（第{finishedWave}ウェーブ終了）</p>
            <div className="flex items-center gap-2">
              <div className="rounded-md border border-amber-200/45 bg-amber-300/15 px-2 py-1 text-xs font-semibold text-amber-100">
                <span className="mr-1">🪙</span>
                <span className="text-sm">{coins}</span>
              </div>
              <button
                type="button"
                onClick={onReroll}
                disabled={!canReroll || rerolling}
                className="rounded-md border border-cyan-200/45 bg-slate-900/80 px-2.5 py-1 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                title="ショートカット: R"
              >
                リロール: {rerollCost}
              </button>
            </div>
          </header>

          {isCompact ? (
            <div className="grid gap-2 min-[720px]:grid-cols-[minmax(0,1fr)_auto]">
              <button
                type="button"
                onClick={() => setIsStatusOpenCompact((prev) => !prev)}
                className="w-full rounded-lg border border-cyan-200/35 bg-slate-900/70 px-3 py-2 text-left text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/15"
              >
                {isStatusOpenCompact ? "ステータスを閉じる" : "ステータスを見る"}
              </button>
              {!isMobile ? (
                <button
                  type="button"
                  onClick={onStartNextWave}
                  disabled={!canStartNextWave}
                  className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-bold text-slate-950 shadow-[0_6px_20px_rgba(34,211,238,0.28)] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
                >
                  GO（第{nextWave}ウェーブ）
                </button>
              ) : null}
            </div>
          ) : null}

          <div className={`grid gap-2 min-[600px]:grid-cols-2 min-[1000px]:grid-cols-4 ${rerolling ? "opacity-70" : "opacity-100"}`}>
            {slots.map((slot) => {
              const canBuy = !slot.purchased && coins >= slot.price;
              return (
                <article
                  key={slot.slotId}
                  role="button"
                  tabIndex={canBuy ? 0 : -1}
                  aria-disabled={!canBuy}
                  onClick={() => {
                    if (!canBuy) return;
                    onBuy(slot.slotId);
                  }}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return;
                    if (!canBuy) return;
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    onBuy(slot.slotId);
                  }}
                  className={`rounded-lg border ${rarityTone[slot.rarity]} bg-slate-950/70 p-2 transition ${canBuy ? "cursor-pointer hover:bg-slate-900/80" : "opacity-85"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-100">{slot.product.title}</p>
                      <p className="text-[10px] text-slate-400">{slot.category === "weapon" ? "武器" : "アイテム"} / {slot.rarity.toUpperCase()}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleLock(slot.slotId);
                      }}
                      disabled={slot.purchased}
                      className={`rounded border px-1.5 py-0.5 text-[10px] ${slot.locked ? "border-amber-200/70 bg-amber-300/15 text-amber-100" : "border-slate-400/40 text-slate-300"} disabled:opacity-50`}
                    >
                      {slot.locked ? "🔒" : "🔓"}
                    </button>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-300">{slot.product.desc}</p>
                  <ul className="mt-1 space-y-0.5">
                    {slot.effects.map((effect) => (
                      <li key={`${slot.slotId}-${effect.text}`} className={`text-[10px] ${effectTone[effect.kind]}`}>
                        • {effect.text}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-sm font-bold text-amber-100">{slot.price}</p>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onBuy(slot.slotId);
                      }}
                      disabled={!canBuy}
                      className="rounded-md bg-cyan-400 px-2 py-1 text-[11px] font-bold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
                    >
                      {slot.purchased ? "売り切れ" : "購入"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="grid gap-2 rounded-lg border border-slate-300/20 bg-slate-950/62 p-2 min-[1000px]:grid-cols-2">
            <section>
              <p className="text-[11px] font-semibold text-cyan-100">所持アイテム</p>
              {ownedItems.length <= 0 ? <p className="mt-1 text-[11px] text-slate-400">所持アイテムなし</p> : null}
              <div className="mt-1 flex flex-wrap gap-1.5">
                {ownedItems.map((item) => (
                  <div
                    key={`owned-item-${item.id}`}
                    className="h-10 w-10 rounded-md border border-emerald-300/35 bg-emerald-400/10 p-1 text-center"
                    title={`${item.title} x${item.count}\n${item.desc}`}
                  >
                    <p className="truncate text-[9px] text-emerald-100">{item.title}</p>
                    <p className="mt-0.5 text-[9px] font-semibold text-emerald-200">x{item.count}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <p className="text-[11px] font-semibold text-cyan-100">武器（{ownedWeapons.reduce((sum, row) => sum + row.count, 0)}/{weaponLimit}）</p>
              {ownedWeapons.length <= 0 ? <p className="mt-1 text-[11px] text-slate-400">所持武器なし</p> : null}
              <div className="mt-1 flex flex-wrap gap-1.5">
                {ownedWeapons.map((weapon) => (
                  <div
                    key={`owned-weapon-${weapon.id}`}
                    className={`h-10 w-10 rounded-md border p-1 text-center ${rarityTone[weapon.rarity]}`}
                    title={`${weapon.title} x${weapon.count}\n${weapon.desc}`}
                  >
                    <p className="truncate text-[9px] text-slate-100">{weapon.title}</p>
                    <p className="mt-0.5 text-[9px] font-semibold text-cyan-100">x{weapon.count}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {showStatusPanel ? (
          <aside className="min-w-0 min-h-0 rounded-lg border border-slate-300/20 bg-slate-950/72 p-2 min-[1000px]:flex min-[1000px]:h-full min-[1000px]:flex-col">
            <p className="text-base font-bold tracking-wide text-cyan-100">ステータス</p>

            <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg border border-slate-300/20 bg-slate-900/45 p-1">
              <button
                type="button"
                onClick={() => setActiveTab("main")}
                className={`rounded-md px-2 py-1.5 text-xs font-semibold transition ${activeTab === "main" ? "bg-cyan-400/25 text-cyan-100" : "text-slate-300 hover:bg-slate-800/70"}`}
              >
                メイン
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("sub")}
                disabled={subStatsCount <= 0}
                className={`rounded-md px-2 py-1.5 text-xs font-semibold transition ${activeTab === "sub" ? "bg-fuchsia-400/25 text-fuchsia-100" : "text-slate-300 hover:bg-slate-800/70"} ${subStatsCount <= 0 ? "cursor-not-allowed opacity-60" : ""}`}
              >
                {subStatsCount <= 0 ? "サブ（準備中）" : "サブ"}
              </button>
            </div>

            <div className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="rounded border border-slate-300/15 bg-slate-900/55 px-2 py-1.5 text-[11px]">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <span className="text-slate-300">現在のレベル</span>
                  <span className="text-right font-semibold tabular-nums text-cyan-100">{currentLevel}</span>
                </div>
              </div>

              <div className="mt-1.5 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
                {activeTab === "sub" && subStatsCount <= 0 ? (
                  <p className="rounded border border-slate-300/15 bg-slate-900/45 px-2 py-1.5 text-[11px] text-slate-300">
                    特殊効果なし
                  </p>
                ) : null}

                {visibleStats.map((row) => (
                  <div
                    key={`stat-${row.key}`}
                    className="rounded border border-slate-300/15 bg-slate-900/45 px-2 py-1 text-[11px]"
                    title={row.description}
                  >
                    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
                      <span className="text-base leading-none">{row.icon}</span>
                      <span className={`truncate ${getStatLabelTone(row)}`}>{row.label}</span>
                      <span className={`text-right font-semibold tabular-nums ${getStatValueTone(row)}`}>
                        {formatStatValue(row)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <section className="mt-2 rounded-md border border-cyan-200/30 bg-cyan-400/10 p-2">
              <p className="text-[11px] font-semibold text-cyan-100">次ウェーブ情報</p>
              <p className="mt-1 text-[11px] text-slate-100">次: 第{nextWave}ウェーブ</p>
              {nextHordeEvent ? <p className="mt-1 text-[11px] text-amber-100">ウェーブ{nextHordeEvent.wave}で大群が出現</p> : null}
              {nextBossEvent ? <p className="mt-0.5 text-[11px] text-rose-100">ウェーブ{nextBossEvent.wave}でボスが出現</p> : null}
              {waveEvents.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {waveEvents.map((event) => (
                    <div key={`wave-event-${event.key}`} className="relative h-8 w-8 rounded border border-slate-300/25 bg-slate-900/65">
                      <span className="absolute inset-0 flex items-center justify-center text-sm">{event.icon}</span>
                      <span className="absolute -bottom-1 -right-1 rounded bg-slate-950/85 px-1 text-[9px] font-semibold text-cyan-100">
                        {event.wave}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-[11px] text-slate-300">通常ウェーブ</p>
              )}
            </section>

            {!isMobile && !isCompact ? (
              <button
                type="button"
                onClick={onStartNextWave}
                disabled={!canStartNextWave}
                className="mt-2 w-full rounded-md bg-cyan-400 px-2 py-2 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
              >
                GO（第{nextWave}ウェーブ）
              </button>
            ) : null}
          </aside>
        ) : null}
      </div>

      {isMobile ? (
        <div className="pointer-events-none fixed inset-x-3 bottom-3 z-50 min-[600px]:hidden">
          <button
            type="button"
            onClick={onStartNextWave}
            disabled={!canStartNextWave}
            className="pointer-events-auto w-full rounded-lg bg-cyan-400 px-3 py-3 text-sm font-bold text-slate-950 shadow-[0_8px_28px_rgba(34,211,238,0.32)] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
          >
            GO（第{nextWave}ウェーブ）
          </button>
        </div>
      ) : null}
    </section>
  );
}
