// My-room furniture, room styles and room geometry. Footprints, prices and
// limits come from shared/economy.json, which the server reads too.
import economy from "../shared/economy.json";
import { SHOP_FURNITURE, type PlotCrop, type ShopId } from "../shared/shop";

export type FurnitureKind = keyof typeof economy.furnitureFootprints;

export type FurnitureCategory = "build" | "living" | "kitchen" | "bath" | "japanese" | "fun" | "season" | "limited" | "casino" | "garden";

export type FurnitureDef = {
  kind: FurnitureKind;
  label: string;
  category: FurnitureCategory;
  w: number;
  h: number;
  walkable?: boolean;
  seat?: boolean;
  /** Walking onto it lies the avatar down. */
  bed?: boolean;
  /** Drawn flat on the floor, under everything. */
  flat?: boolean;
  colorable?: boolean;
  /** Needs to be bought (shop / scratch) before it can be placed. */
  price?: number;
  /** Sold in the fishing / casino point shop instead of for アメ. */
  shop?: ShopId;
  /** A solid one-level cube you can stand on and stack. */
  block?: boolean;
  /** A staircase: climbs half a level, so it links two heights. */
  stairs?: boolean;
  /** Kept for old saved rooms, but no longer offered in the editor palette. */
  legacy?: boolean;
};

type Base = Omit<FurnitureDef, "w" | "h" | "price" | "shop">;

// Building pieces (blocks, stairs) are listed in economy.build.
const BLOCK_LABELS: Record<string, string> = {
  block: "ブロック", woodblock: "きのブロック", brickblock: "レンガブロック", stoneblock: "いしブロック", grassblock: "くさブロック",
  glassblock: "ガラスブロック", iceblock: "こおりのブロック", neonblock: "ネオンブロック", goldblock: "きんのブロック",
};
const HALF_BLOCK_LABELS: Record<string, string> = { halfblock: "ハーフブロック" };
const STAIRS_LABELS: Record<string, string> = { stairs: "かいだん", woodstairs: "きのかいだん", stonestairs: "いしのかいだん", goldstairs: "きんのかいだん" };

const BASE: Base[] = [
  ...economy.build.blocks.map((kind) => ({ kind: kind as FurnitureKind, label: BLOCK_LABELS[kind] ?? kind, category: "build" as const, colorable: kind === "block", block: true })),
  ...economy.build.halfBlocks.map((kind) => ({ kind: kind as FurnitureKind, label: HALF_BLOCK_LABELS[kind] ?? kind, category: "build" as const, colorable: true, block: true })),
  ...economy.build.stairs.map((kind) => ({ kind: kind as FurnitureKind, label: STAIRS_LABELS[kind] ?? kind, category: "build" as const, colorable: kind === "stairs", stairs: true, legacy: true })),
  { kind: "railing", label: "てすり", category: "build", colorable: true },
  { kind: "pillar", label: "はしら", category: "build", colorable: true },
  { kind: "bed", label: "ベッド", category: "living", walkable: true, bed: true, colorable: true },
  { kind: "sofa", label: "ソファ", category: "living", walkable: true, seat: true, colorable: true },
  { kind: "chair", label: "いす", category: "living", walkable: true, seat: true, colorable: true },
  { kind: "beanbag", label: "ビーズクッション", category: "living", walkable: true, seat: true, colorable: true },
  { kind: "table", label: "テーブル", category: "living" },
  { kind: "desk", label: "つくえ", category: "living" },
  { kind: "bookshelf", label: "本だな", category: "living" },
  { kind: "wardrobe", label: "クローゼット", category: "living", colorable: true },
  { kind: "dresser", label: "ドレッサー", category: "living", colorable: true },
  { kind: "tv", label: "テレビ", category: "living" },
  { kind: "floorlamp", label: "スタンドライト", category: "living" },
  { kind: "plant", label: "かんようしょくぶつ", category: "living" },
  { kind: "grandclock", label: "はしら時計", category: "living" },
  { kind: "fireplace", label: "だんろ", category: "living" },
  { kind: "rug", label: "ラグ", category: "living", walkable: true, flat: true, colorable: true },
  { kind: "fridge", label: "れいぞうこ", category: "kitchen", colorable: true },
  { kind: "sink", label: "シンク", category: "kitchen" },
  { kind: "stove", label: "コンロ", category: "kitchen" },
  { kind: "diningtable", label: "ダイニングテーブル", category: "kitchen" },
  { kind: "bathtub", label: "おふろ", category: "bath", walkable: true, seat: true, colorable: true },
  { kind: "toilet", label: "トイレ", category: "bath", walkable: true, seat: true },
  { kind: "washbasin", label: "せんめんだい", category: "bath" },
  { kind: "kotatsu", label: "こたつ", category: "japanese", colorable: true },
  { kind: "cushion", label: "ざぶとん", category: "japanese", walkable: true, seat: true, colorable: true },
  { kind: "chabudai", label: "ちゃぶ台", category: "japanese" },
  { kind: "tansu", label: "たんす", category: "japanese" },
  { kind: "bonsai", label: "ぼんさい", category: "japanese" },
  { kind: "andon", label: "あんどん", category: "japanese" },
  { kind: "piano", label: "ピアノ", category: "fun" },
  { kind: "arcade", label: "ゲームき", category: "fun", colorable: true },
  { kind: "aquarium", label: "すいそう", category: "fun" },
  { kind: "teddy", label: "おおきなクマ", category: "fun", colorable: true },
  { kind: "xmastree", label: "ツリー", category: "season" },
  { kind: "snowman", label: "ゆきだるま", category: "season" },
  { kind: "pumpkinlamp", label: "かぼちゃランタン", category: "season" },
  { kind: "kadomatsu", label: "かどまつ", category: "season" },
  { kind: "sunflower", label: "ひまわり", category: "season" },
  { kind: "canopybed", label: "天がいベッド", category: "limited", walkable: true, bed: true, colorable: true },
  { kind: "throne", label: "王さまのいす", category: "limited", walkable: true, seat: true, colorable: true },
  { kind: "neonsign", label: "ネオンサイン", category: "limited", colorable: true },
  { kind: "goldpig", label: "金のブタ像", category: "limited" },
  { kind: "minifountain", label: "ミニ噴水", category: "limited" },
  { kind: "sakuratree", label: "へやの桜", category: "limited" },
  { kind: "slotmachine", label: "スロット台", category: "casino" },
  { kind: "roulettetable", label: "ルーレット台", category: "casino" },
  { kind: "cardtable", label: "カードテーブル", category: "casino", colorable: true },
  { kind: "chiptower", label: "チップタワー", category: "casino" },
  { kind: "plot", label: "はたけ", category: "garden" },
  // second wave
  { kind: "lowtable", label: "ローテーブル", category: "living", colorable: true },
  { kind: "cactus", label: "サボテン", category: "living" },
  { kind: "vase", label: "はなびん", category: "living", colorable: true },
  { kind: "petbed", label: "ペットベッド", category: "living", colorable: true },
  { kind: "fruitbasket", label: "フルーツかご", category: "kitchen" },
  { kind: "cakestand", label: "ケーキスタンド", category: "kitchen" },
  { kind: "shower", label: "シャワー", category: "bath" },
  { kind: "duck", label: "ラバーダック", category: "bath" },
  { kind: "shoji", label: "しょうじ", category: "japanese" },
  { kind: "futon", label: "おふとん", category: "japanese", walkable: true, bed: true, colorable: true },
  { kind: "jukebox", label: "ジュークボックス", category: "fun" },
  { kind: "pooltable", label: "ビリヤードだい", category: "fun" },
  { kind: "telescope", label: "ぼうえんきょう", category: "fun" },
  { kind: "globe", label: "ちきゅうぎ", category: "fun" },
  { kind: "koinobori", label: "こいのぼり", category: "season" },
  { kind: "kagamimochi", label: "かがみもち", category: "season" },
  { kind: "ghost", label: "おばけ", category: "season" },
  { kind: "kamakura", label: "かまくら", category: "season" },
  { kind: "crystal", label: "ひかるクリスタル", category: "limited" },
  { kind: "rocket", label: "ロケット", category: "limited" },
  { kind: "bigtank", label: "大すいそう", category: "limited" },
  { kind: "carousel", label: "メリーゴーランド", category: "limited" },
  { kind: "lighthouse", label: "とうだい", category: "limited" },
  { kind: "ufo", label: "UFO", category: "limited" },
  { kind: "fence", label: "フェンス", category: "garden", colorable: true },
  { kind: "scarecrow", label: "かかし", category: "garden" },
  { kind: "well", label: "いど", category: "garden" },
  { kind: "flowerbed", label: "はなだん", category: "garden" },
  { kind: "gnome", label: "ノーム", category: "garden" },
];

const PRICES = new Map(economy.limitedFurniture.map((f) => [f.kind, f.price]));
const SHOP_BY_KIND = new Map(SHOP_FURNITURE.map((e) => [e.furniture, e]));

export const FURNITURE: FurnitureDef[] = BASE.map((b) => {
  const [w, h] = economy.furnitureFootprints[b.kind];
  const shop = SHOP_BY_KIND.get(b.kind);
  return { ...b, w, h, price: shop?.price ?? PRICES.get(b.kind), shop: shop?.shop };
});

export const FURNITURE_BY_KIND = new Map(FURNITURE.map((f) => [f.kind, f]));

export const FURNITURE_CATEGORIES: Array<{ id: FurnitureCategory; label: string }> = [
  { id: "build", label: "ブロック" },
  { id: "living", label: "リビング" },
  { id: "kitchen", label: "キッチン" },
  { id: "bath", label: "おふろ" },
  { id: "japanese", label: "わしつ" },
  { id: "fun", label: "あそび" },
  { id: "season", label: "きせつ" },
  { id: "limited", label: "げんてい" },
  { id: "casino", label: "カジノ" },
  { id: "garden", label: "にわ" },
];

export const FURNITURE_COLORS = [
  "#e0525c", "#f08a3c", "#f5cf47", "#8fcf5a", "#46b3a0", "#4f8fe0", "#3651a8", "#9a6bd8", "#f28fb8", "#9b6a47", "#f7f1e3", "#2e2e38",
];

export const WALL_STYLES: Array<{ id: string; label: string; base: string; accent: string; pattern: "plain" | "stripe" | "brick" | "stars" | "wood" | "dots" }> = [
  { id: "cream", label: "クリーム", base: "#f3e3c8", accent: "#9b6a47", pattern: "plain" },
  { id: "pink", label: "ピンク", base: "#fbd9e4", accent: "#e889b5", pattern: "dots" },
  { id: "mint", label: "ミント", base: "#d4f0e4", accent: "#46b3a0", pattern: "stripe" },
  { id: "sky", label: "そら", base: "#d6ecfb", accent: "#4f8fe0", pattern: "plain" },
  { id: "wood", label: "ログハウス", base: "#d9a86c", accent: "#8a5a35", pattern: "wood" },
  { id: "brick", label: "レンガ", base: "#c9745a", accent: "#8f4632", pattern: "brick" },
  { id: "night", label: "よぞら", base: "#26305c", accent: "#141a3a", pattern: "stars" },
  { id: "lemon", label: "レモン", base: "#fff2b3", accent: "#f0b429", pattern: "stripe" },
  { id: "lavender", label: "ラベンダー", base: "#e6dcf7", accent: "#9a6bd8", pattern: "dots" },
  { id: "forest", label: "もり", base: "#cfe6c4", accent: "#3f8f4a", pattern: "stripe" },
  { id: "sunset", label: "ゆうやけ", base: "#ffd9b0", accent: "#e0525c", pattern: "stripe" },
  { id: "snow", label: "ゆきぐに", base: "#f2f8ff", accent: "#8fb5e8", pattern: "dots" },
  { id: "cocoa", label: "ココア", base: "#b58a68", accent: "#6b4430", pattern: "wood" },
  { id: "sea", label: "うみ", base: "#bfe6f2", accent: "#4f8fe0", pattern: "stripe" },
];

export const FLOOR_STYLES: Array<{ id: string; label: string }> = [
  { id: "wood", label: "フローリング" },
  { id: "tatami", label: "たたみ" },
  { id: "checker", label: "チェック" },
  { id: "carpetPink", label: "ピンクじゅうたん" },
  { id: "carpetBlue", label: "ブルーじゅうたん" },
  { id: "marble", label: "だいりせき" },
  { id: "lawn", label: "しばふ" },
  { id: "carpetGreen", label: "グリーンじゅうたん" },
  { id: "carpetRed", label: "レッドじゅうたん" },
  { id: "tile", label: "タイル" },
  { id: "slate", label: "いし" },
  { id: "snow", label: "ゆき" },
  { id: "darkwood", label: "ダークウッド" },
];

// ------------------------------------------------------------------ rooms

export const ROOM_SIZES = economy.rooms.sizes;

export function roomDoor(size: number): Array<[number, number]> {
  return [[size / 2 - 1, size - 1], [size / 2, size - 1]];
}

export function roomSpawn(size: number): [number, number] {
  return [size / 2, size - 2];
}

export function maxItems(size: number): number {
  return (economy.rooms.maxItems as Record<string, number>)[String(size)] ?? 50;
}

/** Cost to grow a room to the next size, or null at the maximum. */
export function expandCost(size: number): { next: number; cost: number } | null {
  const next = ROOM_SIZES[ROOM_SIZES.indexOf(size) + 1];
  if (!next) return null;
  return { next, cost: (economy.rooms.expandCost as Record<string, number>)[String(next)] };
}

/** Cost of the next extra room, or null when the limit is reached. */
export function roomSlotCost(ownedRooms: number): number | null {
  return economy.rooms.slotCost[ownedRooms] ?? null;
}

export type RoomItem = { kind: FurnitureKind; x: number; y: number; color?: string; rot?: 1; dir?: number; z?: number; crop?: PlotCrop };

export type RoomData = {
  id: string;
  owner: string;
  title: string;
  wall: string;
  floor: string;
  size: number;
  items: RoomItem[];
  goodPigg?: number;
  /** Saved layouts (my room only matters to its owner): when it was saved and how many pieces. */
  layouts?: Array<{ savedAt: number; count: number } | null>;
};

// ------------------------------------------------------------- building rules
// Same rules as canPlace() / tileTop() in server/town-data.mjs.

export const MAX_LEVEL = economy.rooms.maxLevel;
export const LEVEL_PX = economy.build.levelPx;
export const LAYOUT_SLOTS = economy.rooms.layoutSlots;
const HALF_BLOCK_SET = new Set<string>(economy.build.halfBlocks);
const BLOCK_SET = new Set<string>([...economy.build.blocks, ...economy.build.halfBlocks]);
const STAIRS_SET = new Set<string>(economy.build.stairs);
export const isBlockKind = (kind: string) => BLOCK_SET.has(kind);
export const isHalfBlockKind = (kind: string) => HALF_BLOCK_SET.has(kind);
export const blockHeightOfKind = (kind: string): number => isHalfBlockKind(kind) ? 0.5 : isBlockKind(kind) ? 1 : 0;
export const isStairsKind = (kind: string) => STAIRS_SET.has(kind);
const isFlat = (kind: FurnitureKind) => Boolean(FURNITURE_BY_KIND.get(kind)?.flat);
/** The level a piece sits on: 0 = the floor, 1 = on top of one block, ... */
export const levelOf = (item: { z?: number }) => item.z ?? 0;

/** Vertical space occupied by a solid piece, in levels. */
const pieceHeight = (item: RoomItem): number => isBlockKind(item.kind) ? blockHeightOfKind(item.kind) : 1;

export function footprintOf(item: { kind: FurnitureKind; rot?: 1 | 0 }): { w: number; h: number } {
  const def = FURNITURE_BY_KIND.get(item.kind);
  const w = def?.w ?? 1;
  const h = def?.h ?? 1;
  return item.rot ? { w: h, h: w } : { w, h };
}

function covers(item: RoomItem, x: number, y: number): boolean {
  const { w, h } = footprintOf(item);
  return x >= item.x && x < item.x + w && y >= item.y && y < item.y + h;
}

/**
 * Where the next thing on this tile would sit: `top` is the height of the block stack, `occupied` is true when
 * furniture or a staircase already stands on it.
 */
export function tileTop(room: { items: RoomItem[] }, x: number, y: number, ignore?: RoomItem): { top: number; occupied: boolean } {
  const here = room.items.filter((o) => o !== ignore && !isFlat(o.kind) && covers(o, x, y));
  let top = 0;
  while (true) {
    const block = here.find((o) => isBlockKind(o.kind) && levelOf(o) === top);
    if (!block) break;
    top += blockHeightOfKind(block.kind);
  }
  return { top, occupied: here.some((o) => !isBlockKind(o.kind) && levelOf(o) === top) };
}

/** The level a new piece lands on when dropped at its position: on top of whatever is built there. */
export function autoLevel(room: { items: RoomItem[] }, item: { kind: FurnitureKind; x: number; y: number }, ignore?: RoomItem): number {
  if (isFlat(item.kind)) return 0;
  return tileTop(room, item.x, item.y, ignore).top;
}

/** Something rests on this block, so it can't be taken out from under it. */
export function hasAbove(room: { items: RoomItem[] }, item: RoomItem): boolean {
  if (!isBlockKind(item.kind)) return false;
  return room.items.some((o) => o !== item && !isFlat(o.kind) && levelOf(o) > levelOf(item) && covers(o, item.x, item.y));
}

export function canPlaceItem(room: RoomData, item: RoomItem, ignore?: RoomItem): boolean {
  const { w, h } = footprintOf(item);
  if (item.x < 0 || item.y < 0 || item.x + w > room.size || item.y + h > room.size) return false;
  const others = room.items.filter((o) => o !== ignore);
  if (!ignore && others.length >= maxItems(room.size)) return false;
  const z = levelOf(item);
  const flat = isFlat(item.kind);
  if (flat && z !== 0) return false;
  const height = isBlockKind(item.kind) ? blockHeightOfKind(item.kind) : isStairsKind(item.kind) ? 1 : 0;
  if (z < 0 || z > MAX_LEVEL - height) return false;
  const door = roomDoor(room.size);
  const scope = { items: others };
  for (let dx = 0; dx < w; dx += 1) {
    for (let dy = 0; dy < h; dy += 1) {
      const x = item.x + dx;
      const y = item.y + dy;
      if (door.some(([ddx, ddy]) => ddx === x && ddy === y)) return false;
      if (flat) {
        if (others.some((o) => covers(o, x, y) && isFlat(o.kind))) return false;
        continue;
      }
      // Floating building blocks are allowed, but no two solid pieces may occupy the same vertical space.
      const itemTop = z + pieceHeight(item);
      if (others.some((o) => {
        if (isFlat(o.kind) || !covers(o, x, y)) return false;
        const otherZ = levelOf(o);
        return Math.max(z, otherZ) < Math.min(itemTop, otherZ + pieceHeight(o)) - 0.001;
      })) return false;
      const t = tileTop(scope, x, y);
      if (!isBlockKind(item.kind) && (t.occupied || t.top !== z)) return false;
    }
  }
  return true;
}

/** The piece you pick at a tile: the highest solid one, or a rug if that is all there is. */
export function itemAt(room: { items: RoomItem[] }, x: number, y: number): RoomItem | undefined {
  const hits = room.items.filter((o) => covers(o, x, y));
  const solid = hits.filter((o) => !isFlat(o.kind)).sort((a, b) => levelOf(b) - levelOf(a));
  return solid[0] ?? hits[0];
}

/**
 * Per tile: where an avatar stands (null when blocked). Blocks raise it by a level, stairs half a level, walkable
 * furniture (sofas, beds) is stood on at its own level, anything else blocks the tile.
 */
export function standHeights(room: RoomData): Array<number | null> {
  const out: Array<number | null> = [];
  for (let y = 0; y < room.size; y += 1) {
    for (let x = 0; x < room.size; x += 1) {
      const here = room.items.filter((o) => !isFlat(o.kind) && covers(o, x, y)).sort((a, b) => levelOf(a) - levelOf(b));
      let stand: number | null = 0;
      let top = 0;
      for (const o of here) {
        if (isBlockKind(o.kind)) {
          top = Math.max(top, levelOf(o) + blockHeightOfKind(o.kind));
          stand = top;
        } else if (isStairsKind(o.kind)) {
          stand = levelOf(o) + 0.5;
        } else {
          stand = FURNITURE_BY_KIND.get(o.kind)?.walkable ? levelOf(o) : null;
        }
      }
      out.push(stand);
    }
  }
  return out;
}

/** Per tile: the height of the top surface you would click on (for picking), stairs count half a level. */
export function surfaceHeights(room: RoomData): number[] {
  const out: number[] = [];
  for (let y = 0; y < room.size; y += 1) {
    for (let x = 0; x < room.size; x += 1) {
      const here = room.items.filter((o) => !isFlat(o.kind) && covers(o, x, y));
      const blockTop = here.reduce((top, o) => isBlockKind(o.kind) ? Math.max(top, levelOf(o) + blockHeightOfKind(o.kind)) : top, 0);
      const stairTop = here.reduce((top, o) => isStairsKind(o.kind) ? Math.max(top, levelOf(o) + 0.5) : top, 0);
      out.push(Math.max(blockTop, stairTop));
    }
  }
  return out;
}
