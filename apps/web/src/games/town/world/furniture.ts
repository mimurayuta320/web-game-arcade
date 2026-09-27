// My-room furniture, room styles and room geometry. Footprints, prices and
// limits come from shared/economy.json, which the server reads too.
import economy from "../shared/economy.json";

export type FurnitureKind = keyof typeof economy.furnitureFootprints;

export type FurnitureCategory = "living" | "kitchen" | "bath" | "japanese" | "fun" | "season" | "limited";

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
};

type Base = Omit<FurnitureDef, "w" | "h" | "price">;

const BASE: Base[] = [
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
];

const PRICES = new Map(economy.limitedFurniture.map((f) => [f.kind, f.price]));

export const FURNITURE: FurnitureDef[] = BASE.map((b) => {
  const [w, h] = economy.furnitureFootprints[b.kind];
  return { ...b, w, h, price: PRICES.get(b.kind) };
});

export const FURNITURE_BY_KIND = new Map(FURNITURE.map((f) => [f.kind, f]));

export const FURNITURE_CATEGORIES: Array<{ id: FurnitureCategory; label: string }> = [
  { id: "living", label: "リビング" },
  { id: "kitchen", label: "キッチン" },
  { id: "bath", label: "おふろ" },
  { id: "japanese", label: "わしつ" },
  { id: "fun", label: "あそび" },
  { id: "season", label: "きせつ" },
  { id: "limited", label: "げんてい" },
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
];

export const FLOOR_STYLES: Array<{ id: string; label: string }> = [
  { id: "wood", label: "フローリング" },
  { id: "tatami", label: "たたみ" },
  { id: "checker", label: "チェック" },
  { id: "carpetPink", label: "ピンクじゅうたん" },
  { id: "carpetBlue", label: "ブルーじゅうたん" },
  { id: "marble", label: "だいりせき" },
  { id: "lawn", label: "しばふ" },
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

export type RoomItem = { kind: FurnitureKind; x: number; y: number; color?: string; rot?: 1 };

export type RoomData = {
  id: string;
  owner: string;
  title: string;
  wall: string;
  floor: string;
  size: number;
  items: RoomItem[];
  goodPigg?: number;
};

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

/** Same rules as canPlace() in server/town-data.mjs. */
export function canPlaceItem(room: RoomData, item: RoomItem, ignore?: RoomItem): boolean {
  const { w, h } = footprintOf(item);
  if (item.x < 0 || item.y < 0 || item.x + w > room.size || item.y + h > room.size) return false;
  const others = room.items.filter((o) => o !== ignore);
  if (!ignore && others.length >= maxItems(room.size)) return false;
  const flat = Boolean(FURNITURE_BY_KIND.get(item.kind)?.flat);
  const door = roomDoor(room.size);
  for (let dx = 0; dx < w; dx += 1) {
    for (let dy = 0; dy < h; dy += 1) {
      const x = item.x + dx;
      const y = item.y + dy;
      if (door.some(([ddx, ddy]) => ddx === x && ddy === y)) return false;
      if (others.some((o) => covers(o, x, y) && Boolean(FURNITURE_BY_KIND.get(o.kind)?.flat) === flat)) return false;
    }
  }
  return true;
}

export function itemAt(room: RoomData, x: number, y: number): RoomItem | undefined {
  const hits = room.items.filter((o) => covers(o, x, y));
  return hits.find((o) => !FURNITURE_BY_KIND.get(o.kind)?.flat) ?? hits[0];
}
