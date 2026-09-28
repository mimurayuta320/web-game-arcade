"use client";

import { useEffect } from "react";
import styles from "@/app/games/town/town.module.css";
import type { Wallet } from "../core/TownGame";
import { CROPS, FERTS, GARDEN, GARDEN_DECOS, GARDEN_ITEMS, GARDEN_TOOLS } from "../shared/shop";
import { SEASON_LABEL, xpForLevel } from "../shared/gardenRules.mjs";
import { plotState, serverNow, type GardenData } from "../world/garden";

export type GardenTool = "hand" | "till" | "plant" | "water" | "weed" | "fert" | "harvest" | "deco" | "remove";

const OWNER_TOOLS: Array<[GardenTool, string, string]> = [
  ["hand", "✋", "みる・あるく"],
  ["till", "⛏️", "たがやす"],
  ["plant", "🌱", "たねまき"],
  ["water", "💧", "みずやり"],
  ["weed", "✂️", "くさとり・むしとり"],
  ["fert", "🟤", "ひりょう"],
  ["harvest", "🧺", "しゅうかく"],
  ["deco", "🪴", "かざる"],
  ["remove", "🗑️", "かたづける"],
];
const VISITOR_TOOLS = OWNER_TOOLS.filter(([id]) => id === "hand" || id === "water" || id === "weed");

const DECO_LABEL: Record<string, string> = { fence: "🪵 さく", flowerbed: "🌷 かだん", gnome: "🧙 こびと", well: "🪣 いど", bench: "🪑 ベンチ", lamp: "💡 がいとう" };

export type GardenToolState = {
  tool: GardenTool;
  seed: string;
  fert: string;
  deco: string;
  /** Use the 3×3 watering can / sickle when owned. */
  wide: boolean;
};

type Props = {
  garden: GardenData;
  wallet: Wallet;
  isOwner: boolean;
  clockOffset: number;
  state: GardenToolState;
  onChange: (next: Partial<GardenToolState>) => void;
  onOpenBook: () => void;
  onHarvestAll: () => void;
};

/** Top status line + tool bar shown while in a garden. */
export function GardenToolbar({ garden, wallet, isOwner, clockOffset, state, onChange, onOpenBook, onHarvestAll }: Props) {
  const g = wallet.garden;
  const now = serverNow(clockOffset);
  const states = garden.plots.map((p) => plotState(p, garden, now));
  const ripe = states.filter((st) => st.ripe && !st.withered).length;
  const trouble = garden.plots.filter((p) => p.weed || p.bug).length;
  const dry = garden.plots.filter((p, i) => p.crop && !states[i].ripe && !states[i].wet).length;
  const level = garden.level;
  const next = xpForLevel(level + 1);
  const cur = xpForLevel(level);
  const xpPct = isOwner ? Math.max(0, Math.min(100, Math.round(((g.xp - cur) / Math.max(1, next - cur)) * 100))) : 0;
  const tools = isOwner ? OWNER_TOOLS : VISITOR_TOOLS;
  const wideOwned = state.tool === "water" ? g.tools.includes("bigcan") : state.tool === "weed" ? g.tools.includes("sickle") : false;
  const seeds = [
    ...CROPS.filter((c) => (wallet.seeds[c.id] ?? 0) > 0 && c.unlock <= level && !c.rare).map((c) => ({ id: c.id, label: `${c.emoji}${c.label}`, n: wallet.seeds[c.id] })),
    ...(g.mystery > 0 ? [{ id: "mystery", label: "✨ふしぎなたね", n: g.mystery }] : []),
  ];
  const ferts = FERTS.filter((f) => (g.ferts[f.id] ?? 0) > 0);
  const decos = [
    ...GARDEN_DECOS.map((d) => ({ id: d, label: DECO_LABEL[d] ?? d, n: Infinity })),
    ...GARDEN_ITEMS.filter((i) => (g.items[i.id] ?? 0) > 0).map((i) => ({ id: i.id, label: `${i.emoji} ${i.label}`, n: g.items[i.id] })),
  ];

  // Keep a usable seed / fertilizer selected so the first click on a plot just works.
  const seedIds = seeds.map((s) => s.id).join(",");
  const fertIds = ferts.map((f) => f.id).join(",");
  useEffect(() => {
    const ids = seedIds ? seedIds.split(",") : [];
    if (state.tool === "plant" && ids.length && !ids.includes(state.seed)) onChange({ seed: ids[0] });
    const fids = fertIds ? fertIds.split(",") : [];
    if (state.tool === "fert" && fids.length && !fids.includes(state.fert)) onChange({ fert: fids[0] });
  }, [state.tool, state.seed, state.fert, seedIds, fertIds, onChange]);

  return (
    <>
      <div className={styles.gardenHud}>
        <span className={styles.gardenHudTitle}>
          🌱 {isOwner ? "マイガーデン" : `${garden.owner}のガーデン`} <b>Lv.{level}</b>
        </span>
        {isOwner ? (
          <span className={styles.gardenHudXp} title={`けいけんち ${g.xp}`}>
            <span style={{ width: `${xpPct}%` }} />
          </span>
        ) : null}
        <span>畑 {garden.plots.length}/{garden.maxPlots}</span>
        <span>{SEASON_LABEL[garden.season]}</span>
        {ripe ? <span className={styles.gardenHudBadge}>🧺 {ripe}</span> : null}
        {dry ? <span className={styles.gardenHudBadge} data-kind="dry">💧 {dry}</span> : null}
        {trouble ? <span className={styles.gardenHudBadge} data-kind="bug">🐛 {trouble}</span> : null}
        {isOwner ? (
          <>
            {g.tools.includes("basket") && ripe > 0 ? (
              <button type="button" className={styles.chip} onClick={onHarvestAll}>まとめて収穫</button>
            ) : null}
            <button type="button" className={styles.chip} onClick={onOpenBook}>📖 手帳</button>
          </>
        ) : null}
      </div>

      <div className={styles.gardenToolbar} role="toolbar" aria-label="ガーデンのどうぐ">
        <div className={styles.gardenTools}>
          {tools.map(([id, icon, label]) => (
            <button
              key={id}
              type="button"
              className={styles.gardenToolButton}
              aria-pressed={state.tool === id}
              title={label}
              onClick={() => onChange({ tool: id })}
            >
              <span aria-hidden="true">{icon}</span>
              <small>{label.split("・")[0]}</small>
            </button>
          ))}
        </div>
        {state.tool === "plant" ? (
          <div className={styles.gardenPicker}>
            {seeds.length === 0 ? <span className={styles.ameNote}>たねがありません（📖手帳のショップで買えます）</span> : seeds.map((s) => (
              <button key={s.id} type="button" className={styles.chip} data-active={state.seed === s.id} onClick={() => onChange({ seed: s.id })}>
                {s.label} ×{s.n}
              </button>
            ))}
          </div>
        ) : null}
        {state.tool === "fert" ? (
          <div className={styles.gardenPicker}>
            {ferts.length === 0 ? <span className={styles.ameNote}>ひりょうがありません</span> : ferts.map((f) => (
              <button key={f.id} type="button" className={styles.chip} data-active={state.fert === f.id} onClick={() => onChange({ fert: f.id })} title={f.desc}>
                {f.emoji}{f.label} ×{g.ferts[f.id]}
              </button>
            ))}
          </div>
        ) : null}
        {state.tool === "deco" ? (
          <div className={styles.gardenPicker}>
            {decos.map((d) => (
              <button key={d.id} type="button" className={styles.chip} data-active={state.deco === d.id} onClick={() => onChange({ deco: d.id })}>
                {d.label}{Number.isFinite(d.n) ? ` ×${d.n}` : ""}
              </button>
            ))}
          </div>
        ) : null}
        {wideOwned ? (
          <div className={styles.gardenPicker}>
            <button type="button" className={styles.chip} data-active={state.wide} onClick={() => onChange({ wide: !state.wide })}>
              {state.tool === "water" ? GARDEN_TOOLS.find((t) => t.id === "bigcan")?.emoji : GARDEN_TOOLS.find((t) => t.id === "sickle")?.emoji} まとめて（3×3）
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}

export function gardenHint(tool: GardenTool, isOwner: boolean): string {
  switch (tool) {
    case "till": return "草地をクリックして畑にする";
    case "plant": return "畑をクリックしてたねをまく";
    case "water": return `作物をクリックして水やり（土がかわくと成長が${Math.round(GARDEN.dryRate * 100)}%に）`;
    case "weed": return "雑草・虫をクリックして取る";
    case "fert": return "育っている作物にひりょうをまく";
    case "harvest": return "実った作物をクリックして収穫";
    case "deco": return "空いている草地をクリックして置く";
    case "remove": return "かざり・畑をクリックして片づける";
    default: return isOwner ? "畑をクリックでようすを見る ・ 下のどうぐで畑しごと" : "水やり・草とりでおてつだいするとお礼がもらえます";
  }
}
