// Typed view of the fishing / casino point shops in economy.json (the server reads the same file).
import economy from "./economy.json";

export type ShopId = "fishing" | "casino";
export type ShopCategory = "rod" | "bait" | "ride" | "furniture" | "wear" | "item";

export type ShopEntry = {
  id: string;
  shop: ShopId;
  category: ShopCategory;
  label: string;
  price: number;
  /** Avatar part (rides and clothes). */
  key?: string;
  part?: string;
  furniture?: string;
  rod?: string;
  bait?: string;
  item?: string;
  /** How many a consumable purchase gives. */
  pack?: number;
};

export type RodDef = { id: string; label: string; zone: number; drain: number; desc: string };
export type BaitDef = { id: string; label: string; rare: number; bite: number; desc: string };
export type FishRarity = "common" | "uncommon" | "rare" | "legend";
export type FishDef = {
  id: string; label: string; emoji: string; rarity: FishRarity; weight: number; points: number;
  cm: [number, number]; power: number; speed: number;
  /** Size of the reel frame: bigger fish have a smaller one. */
  frame: number;
  /** Where it lives: the sea (beach) by default, or the freshwater "pond" (park and campsite). */
  habitat?: "sea" | "pond";
};
export type CasinoItemId = "slot-free" | "roulette-insure" | "bj-peek" | "poker-redraw";
export type CasinoItemDef = { id: CasinoItemId; label: string; game: string; desc: string };

export const POINT_SHOP = economy.pointShop as ShopEntry[];

// ------------------------------------------------------------------ pets & garden

export type PetSpeciesId = "dog" | "cat" | "rabbit" | "chick" | "penguin" | "panda" | "hamster" | "frog" | "bear" | "fox" | "owl";
export type PetSpecies = { id: PetSpeciesId; label: string; emoji: string; price: number };
export type CropKind = "veg" | "fruit" | "flower";
export type Season = "spring" | "summer" | "autumn" | "winter";
export type CropDef = {
  id: string; label: string; emoji: string; kind: CropKind; seedPrice: number; growMs: number;
  yield: [number, number]; sell: number; feed: number;
  /** Garden level that unlocks the seed. */
  unlock: number;
  xp: number;
  /** Seasonal crops grow faster in season and their seeds are only sold then. */
  season?: Season;
  /** Only grows from mystery seeds. */
  rare?: boolean;
};
export type FertDef = { id: string; label: string; emoji: string; price: number; speed?: number; yieldBonus?: number; goldBonus?: number; unlock?: number; desc: string };
export type GardenToolDef = { id: string; label: string; emoji: string; price: number; unlock: number; desc: string };
export type RecipeDef = { id: string; label: string; emoji: string; unlock: number; ingredients: Record<string, number>; sell: number; feed: number };

export const PET_CONFIG = economy.pets;
export const PET_SPECIES = economy.pets.species as PetSpecies[];
export const GARDEN = economy.garden;
export const CROPS = economy.garden.crops as CropDef[];
export const FERTS = economy.garden.ferts as FertDef[];
export const GARDEN_TOOLS = economy.garden.tools as GardenToolDef[];
/** Things placed in the garden that do something (scarecrow, sprinkler). */
export const GARDEN_ITEMS = economy.garden.items as GardenToolDef[];
export const GARDEN_DECOS = economy.garden.decos as string[];
export const RECIPES = economy.garden.recipes as unknown as RecipeDef[];

export function cropDef(id: string): CropDef | undefined {
  return CROPS.find((c) => c.id === id);
}

export function recipeDef(id: string): RecipeDef | undefined {
  return RECIPES.find((r) => r.id === id);
}

export function fertDef(id: string): FertDef | undefined {
  return FERTS.find((f) => f.id === id);
}

export function petSpecies(id: string): PetSpecies | undefined {
  return PET_SPECIES.find((s) => s.id === id);
}

/** A crop growing in a plot, as stored on the room item (times are server clock, ms). */
export type PlotCrop = { id: string; plantedAt: number; readyAt: number; waters: number; lastWaterAt: number };

/** 0 seed, 1 sprout, 2 growing, 3 ripe. */
export function cropStage(crop: PlotCrop, now: number): 0 | 1 | 2 | 3 {
  if (now >= crop.readyAt) return 3;
  const total = Math.max(1, crop.readyAt - crop.plantedAt);
  const progress = (now - crop.plantedAt) / total;
  return progress < 0.34 ? 0 : progress < 0.68 ? 1 : 2;
}
export const RODS = economy.fishing.rods as RodDef[];
export const BAITS = economy.fishing.baits as BaitDef[];
export const FISH = economy.fishing.fish as FishDef[];
export const CASINO_ITEMS = economy.casinoItems as CasinoItemDef[];

export const RARITY_LABEL: Record<FishRarity, string> = {
  common: "ふつう", uncommon: "すこし珍しい", rare: "レア", legend: "でんせつ",
};

export function rodDef(id: string): RodDef {
  return RODS.find((r) => r.id === id) ?? RODS[0];
}

export function baitDef(id: string): BaitDef | undefined {
  return BAITS.find((b) => b.id === id);
}

/** Point-shop avatar parts, e.g. "ride:bike" → entry. */
export const SHOP_PARTS = POINT_SHOP.filter((e) => e.key && e.part);
/** Point-shop furniture kinds. */
export const SHOP_FURNITURE = POINT_SHOP.filter((e) => e.furniture);
