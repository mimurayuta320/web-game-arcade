// My Garden on the client: the data the server sends, the walkable area built from it,
// and the per-plot state the UI and renderer show (computed with the shared rules).
import { cropDef, type CropDef, type Season } from "../shared/shop";
import economy from "../shared/economy.json";
import {
  careRatio, gardenDoor, gardenSpawn, isGuarded, isSprinkled, projectCrop, stageOf,
} from "../shared/gardenRules.mjs";
import type { AreaDef, FloorKind, TownObject } from "./areas";

const G = economy.garden;

export type GardenCrop = {
  id: string; plantedAt: number; growth: number; calcAt: number; fert: string; careWet: number; careDry: number; ripeAt: number;
};
export type GardenPlot = { x: number; y: number; wetUntil: number; weed: boolean; bug: boolean; crop: GardenCrop | null };
export type GardenDeco = { kind: string; x: number; y: number };
export type GardenData = {
  id: string; owner: string; level: number; size: number; maxPlots: number; serverNow: number; season: Season;
  plots: GardenPlot[]; decos: GardenDeco[];
};

/** A plot as the renderer sees it: the plot plus what it needs to work out the current state. */
export type GardenPlotView = { plot: GardenPlot; garden: GardenData; clockOffset: number };

export type PlotState = {
  crop: CropDef | null;
  stage: 0 | 1 | 2 | 3 | 4;
  progress: number;
  ripe: boolean;
  withered: boolean;
  /** When it will be ripe if the soil stays as it is now (server clock). */
  ripeAt: number;
  wet: boolean;
  sprinkled: boolean;
  guarded: boolean;
  care: number;
};

/** Server time now, from the offset measured when the garden arrived. */
export function serverNow(clockOffset: number): number {
  return Date.now() + clockOffset;
}

export function plotState(plot: GardenPlot, garden: GardenData, now: number): PlotState {
  const sprinkled = isSprinkled(garden.decos, plot.x, plot.y, G);
  const guarded = isGuarded(garden.decos, plot.x, plot.y, G);
  const wet = sprinkled || plot.wetUntil > now;
  const crop = plot.crop ? cropDef(plot.crop.id) ?? null : null;
  if (!plot.crop || !crop) {
    return { crop: null, stage: 0, progress: 0, ripe: false, withered: false, ripeAt: 0, wet, sprinkled, guarded, care: 0 };
  }
  const p = projectCrop(plot, now, crop, G, { sprinkled, season: garden.season });
  return {
    crop,
    stage: stageOf(p.progress, p.ripe) as PlotState["stage"],
    progress: p.progress,
    ripe: p.ripe,
    withered: p.withered,
    ripeAt: p.ripeAt,
    wet,
    sprinkled,
    guarded,
    care: careRatio(p.careWet, p.careDry),
  };
}

export function emptyGarden(id: string): GardenData {
  return { id, owner: "", level: 1, size: 12, maxPlots: G.plotsBase, serverNow: Date.now(), season: "spring", plots: [], decos: [] };
}

/** Walkable area for a garden: lawn, a flagstone path from the gate, tilled plots and decorations. */
export function buildGardenArea(garden: GardenData, clockOffset: number): AreaDef {
  const size = garden.size;
  const door = gardenDoor(size);
  const doorXs = new Set(door.map(([x]) => x));
  const objects: TownObject[] = [];
  for (const plot of garden.plots) {
    const view: GardenPlotView = { plot, garden, clockOffset };
    objects.push({ kind: "gsoil", x: plot.x, y: plot.y, flat: true, walkable: true, gplot: view });
    if (plot.crop || plot.weed || plot.bug) objects.push({ kind: "gcrop", x: plot.x, y: plot.y, walkable: true, gplot: view });
  }
  for (const deco of garden.decos) {
    objects.push({ kind: deco.kind as TownObject["kind"], x: deco.x, y: deco.y, walkable: false });
  }
  return {
    id: `garden:${garden.id}`,
    name: garden.owner ? `${garden.owner}のガーデン` : "マイガーデン",
    width: size,
    height: size,
    spawn: gardenSpawn(size) as [number, number],
    indoor: false,
    background: ["#bfe6ff", "#eaf8ff"],
    floor: (x, y): FloorKind => (doorXs.has(x) && y >= size - 3 ? "flagstone" : "lawn"),
    objects,
    portals: door.map(([x, y], i) => ({ x, y, to: "plaza" as const, spawn: [7 + i, 12] as [number, number], label: "ひろば" })),
    garden,
  };
}

export function gardenPlotAt(garden: GardenData, x: number, y: number): GardenPlot | undefined {
  return garden.plots.find((p) => p.x === x && p.y === y);
}

export function gardenDecoAt(garden: GardenData, x: number, y: number): GardenDeco | undefined {
  return garden.decos.find((d) => d.x === x && d.y === y);
}

export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  if (s >= 3600) return `${Math.floor(s / 3600)}時間${Math.floor((s % 3600) / 60)}分`;
  return s >= 60 ? `${Math.floor(s / 60)}分${s % 60 ? `${s % 60}秒` : ""}` : `${s}秒`;
}
