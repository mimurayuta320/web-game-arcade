// Town area definitions. Width/height/spawn must match server/town-world.mjs.
import type { PlotCrop } from "../shared/shop";
import {
  FURNITURE_BY_KIND, LEVEL_PX, ROOM_SIZES, WALL_STYLES, blockHeightOfKind, footprintOf, isBlockKind, isStairsKind, levelOf, roomDoor, roomSpawn,
  standHeights, surfaceHeights, type FurnitureKind, type RoomData,
} from "./furniture";

export type FloorKind =
  | "grass" | "stone" | "wood" | "rug" | "sand" | "shore" | "water"
  | "gravel" | "flagstone" | "asphalt" | "crosswalk" | "sidewalk"
  | "tatami" | "checker" | "carpetPink" | "carpetBlue" | "marble" | "lawn"
  | "carpetGreen" | "carpetRed" | "tile" | "slate" | "snow" | "darkwood";

export type ObjectKind =
  | "tree" | "fountain" | "flowers" | "bench" | "lamp"
  | "counter" | "table" | "chair" | "plant"
  | "palm" | "parasol" | "castle"
  | "torii" | "lantern" | "sakura" | "stall" | "hall" | "offering"
  | "shop" | "vending" | "streetlight" | "planter"
  | "slotmachine" | "roulettetable" | "cardtable"
  | "tent" | "campfire" | "log" | "slide" | "swing" | "sandbox" | "lilypad"
  | FurnitureKind;

export type TownObject = {
  kind: ObjectKind;
  x: number;
  y: number;
  w?: number;
  h?: number;
  /** Avatars may stand on this tile (and sit, if `seat`). */
  walkable?: boolean;
  seat?: boolean;
  bed?: boolean;
  flat?: boolean;
  color?: string;
  label?: string;
  /** Furniture turned 90° (footprint w/h already swapped). */
  rot?: 1;
  /** What is growing in a plot. */
  crop?: PlotCrop;
  /** Level it sits on (0 = the floor, 1 = on top of one block, ...). */
  z?: number;
  /** Which way a staircase climbs (0-3). */
  dir?: number;
};

export type StaticAreaId = "plaza" | "cafe" | "beach" | "shrine" | "street" | "casino" | "park" | "camp";
/** Static areas, or "room:<16 hex>" for a player's room. */
export type AreaId = StaticAreaId | `room:${string}`;

export type Portal = { x: number; y: number; to: AreaId; spawn: [number, number]; label: string };

/** Where a spot leads: a casino game, fishing, a point shop, or the arcade hall (the old game menu at /arcade). */
export type SpotGame = "slots" | "roulette" | "blackjack" | "poker" | "highlow" | "sicbo" | "arcade" | "fishing" | "fishshop" | "prizeshop" | "petshop" | "gardenshop";
/** Walking onto this tile opens the game. */
export type GameSpot = { x: number; y: number; game: SpotGame; label: string };

export type AreaDef = {
  id: AreaId;
  name: string;
  width: number;
  height: number;
  spawn: [number, number];
  indoor: boolean;
  background: [string, string];
  floor: (x: number, y: number) => FloorKind;
  objects: TownObject[];
  portals: Portal[];
  spots?: GameSpot[];
  wallStyle?: string;
  room?: RoomData;
  /** Rooms with blocks: per tile, where an avatar stands (null = blocked), in levels. Absent = everything is level 0. */
  heights?: Array<number | null>;
  /** Rooms with blocks: per tile, the height of the surface under the pointer, in levels. */
  tops?: number[];
  /** Screen pixels the tallest thing rises above the floor (for framing the camera). */
  risePx?: number;
};

const at = (kind: ObjectKind, list: number[][], extra: Partial<TownObject> = {}): TownObject[] =>
  list.map(([x, y]) => ({ kind, x, y, ...extra }));

const plaza: AreaDef = {
  id: "plaza",
  name: "ひろば",
  width: 16,
  height: 16,
  spawn: [7, 12],
  indoor: false,
  background: ["#bfe6ff", "#e8f7ff"],
  floor: (x, y) => {
    if (x >= 5 && x <= 10 && y >= 5 && y <= 10) return "stone";
    if (x === 7 || x === 8 || y === 7 || y === 8) return "stone";
    return "grass";
  },
  objects: [
    { kind: "fountain", x: 7, y: 7, w: 2, h: 2 },
    ...at("tree", [[1, 1], [4, 1], [1, 4], [14, 1], [11, 1], [14, 4], [1, 14], [1, 11], [4, 14], [14, 14], [11, 14], [14, 11]]),
    ...at("flowers", [[3, 3], [12, 3], [3, 12], [12, 12]]),
    ...at("bench", [[4, 5], [4, 10], [11, 5], [11, 10]], { walkable: true, seat: true }),
    ...at("lamp", [[5, 5], [10, 5], [5, 10], [10, 10]]),
  ],
  portals: [
    { x: 15, y: 7, to: "cafe", spawn: [5, 10], label: "カフェ" },
    { x: 15, y: 8, to: "cafe", spawn: [6, 10], label: "カフェ" },
    { x: 0, y: 7, to: "beach", spawn: [7, 13], label: "ビーチ" },
    { x: 0, y: 8, to: "beach", spawn: [8, 13], label: "ビーチ" },
    { x: 7, y: 0, to: "shrine", spawn: [6, 12], label: "じんじゃ" },
    { x: 8, y: 0, to: "shrine", spawn: [7, 12], label: "じんじゃ" },
    { x: 7, y: 15, to: "street", spawn: [1, 6], label: "しょうてんがい" },
    { x: 8, y: 15, to: "street", spawn: [1, 7], label: "しょうてんがい" },
    { x: 15, y: 3, to: "park", spawn: [1, 6], label: "こうえん" },
    { x: 15, y: 4, to: "park", spawn: [1, 7], label: "こうえん" },
    { x: 0, y: 3, to: "camp", spawn: [14, 6], label: "キャンプ場" },
    { x: 0, y: 4, to: "camp", spawn: [14, 7], label: "キャンプ場" },
  ],
};

const cafe: AreaDef = {
  id: "cafe",
  name: "カフェ",
  width: 12,
  height: 12,
  spawn: [6, 10],
  indoor: true,
  wallStyle: "cream",
  background: ["#3b2a26", "#5a4038"],
  floor: (x, y) => (x >= 4 && x <= 7 && y >= 4 && y <= 8 ? "rug" : "wood"),
  objects: [
    { kind: "counter", x: 2, y: 0, w: 6, h: 1 },
    ...at("plant", [[0, 0], [11, 0], [0, 11], [11, 11]]),
    ...[[2, 4], [9, 4], [2, 8], [9, 8]].flatMap(([x, y]) => [
      { kind: "table" as const, x, y },
      { kind: "chair" as const, x: x - 1, y, walkable: true, seat: true },
      { kind: "chair" as const, x: x + 1, y, walkable: true, seat: true },
    ]),
  ],
  portals: [
    { x: 5, y: 11, to: "plaza", spawn: [14, 7], label: "ひろば" },
    { x: 6, y: 11, to: "plaza", spawn: [14, 8], label: "ひろば" },
  ],
};

const beach: AreaDef = {
  id: "beach",
  name: "ビーチ",
  width: 16,
  height: 16,
  spawn: [8, 13],
  indoor: false,
  background: ["#8fd3ff", "#d8f1ff"],
  floor: (x, y) => {
    const coast = 3 + Math.round(Math.sin(x * 0.7) * 0.8);
    if (y < coast) return "water";
    if (y === coast) return "shore";
    return "sand";
  },
  objects: [
    ...at("palm", [[2, 6], [13, 6], [1, 12], [14, 11]]),
    { kind: "parasol", x: 5, y: 8, color: "#e0525c" },
    { kind: "parasol", x: 10, y: 9, color: "#4f8fe0" },
    { kind: "castle", x: 8, y: 6 },
    { kind: "stall", x: 11, y: 12, w: 2, h: 1, color: "#3f8fd0", label: "つりぐや" },
  ],
  // Keep the fishing tiles in sync with FISHING_SPOTS in server/town-world.mjs.
  spots: [
    ...[[3, 4], [5, 3], [11, 4], [13, 3]].map(([x, y]) => ({ x, y, game: "fishing" as const, label: "つり場" })),
    { x: 11, y: 13, game: "fishshop", label: "釣り具屋" },
    { x: 12, y: 13, game: "fishshop", label: "釣り具屋" },
  ],
  portals: [
    { x: 7, y: 15, to: "plaza", spawn: [1, 7], label: "ひろば" },
    { x: 8, y: 15, to: "plaza", spawn: [1, 8], label: "ひろば" },
  ],
};

const shrine: AreaDef = {
  id: "shrine",
  name: "じんじゃ",
  width: 14,
  height: 14,
  spawn: [6, 12],
  indoor: false,
  background: ["#ffd9c2", "#fff1e6"],
  floor: (x, y) => ((x === 6 || x === 7) && y >= 3 ? "flagstone" : "gravel"),
  objects: [
    { kind: "hall", x: 5, y: 0, w: 4, h: 2 },
    { kind: "offering", x: 6, y: 2, w: 2, h: 1 },
    { kind: "torii", x: 6, y: 9, w: 2, h: 1, walkable: true },
    ...at("lantern", [[4, 5], [9, 5], [4, 11], [9, 11]]),
    ...at("sakura", [[1, 1], [12, 1], [1, 7], [12, 7], [2, 12], [11, 12]]),
    { kind: "stall", x: 1, y: 4, w: 2, h: 1, color: "#e0525c", label: "たこやき" },
    { kind: "stall", x: 11, y: 4, w: 2, h: 1, color: "#4f8fe0", label: "わたあめ" },
    { kind: "stall", x: 11, y: 9, w: 2, h: 1, color: "#f08a3c", label: "きんぎょ" },
    ...at("bench", [[2, 9]], { walkable: true, seat: true }),
  ],
  portals: [
    { x: 6, y: 13, to: "plaza", spawn: [7, 1], label: "ひろば" },
    { x: 7, y: 13, to: "plaza", spawn: [8, 1], label: "ひろば" },
  ],
};

const SHOPS: Array<{ x: number; color: string; label: string }> = [
  { x: 1, color: "#8a5a35", label: "カフェ" },
  { x: 5, color: "#f28fb8", label: "ペット" },
  { x: 9, color: "#4f8fe0", label: "ゲーム" },
  { x: 13, color: "#8fcf5a", label: "おはなや" },
];

const street: AreaDef = {
  id: "street",
  name: "しょうてんがい",
  width: 18,
  height: 10,
  spawn: [1, 6],
  indoor: false,
  background: ["#c7d8ff", "#eef3ff"],
  floor: (x, y) => {
    if (y === 4 || y === 5) return x === 11 || x === 12 ? "crosswalk" : "asphalt";
    return "sidewalk";
  },
  objects: [
    ...SHOPS.map((s) => ({ kind: "shop" as const, x: s.x, y: 0, w: 3, h: 1, color: s.color, label: s.label })),
    ...at("vending", [[0, 0], [4, 0], [17, 0]]),
    ...at("streetlight", [[3, 3], [9, 3], [15, 3], [6, 8], [12, 8]]),
    ...at("planter", [[4, 9], [10, 9], [16, 9]]),
    ...at("bench", [[7, 8], [14, 8]], { walkable: true, seat: true }),
  ],
  portals: [
    { x: 0, y: 6, to: "plaza", spawn: [7, 14], label: "ひろば" },
    { x: 0, y: 7, to: "plaza", spawn: [8, 14], label: "ひろば" },
    { x: 2, y: 1, to: "cafe", spawn: [6, 10], label: "カフェ" },
    { x: 17, y: 6, to: "casino", spawn: [6, 10], label: "カジノ" },
    { x: 17, y: 7, to: "casino", spawn: [7, 10], label: "カジノ" },
  ],
  // The "ゲーム" shop (x 9-11) opens the arcade hall; "ペット" (x 5-7) and "おはなや" (x 13-15) open their counters.
  spots: [
    { x: 6, y: 1, game: "petshop", label: "ペットショップ" },
    { x: 10, y: 1, game: "arcade", label: "ゲームセンター" },
    { x: 14, y: 1, game: "gardenshop", label: "おはなや" },
  ],
};

const casino: AreaDef = {
  id: "casino",
  name: "カジノ",
  width: 14,
  height: 12,
  spawn: [6, 10],
  indoor: true,
  wallStyle: "night",
  background: ["#140a24", "#2a1244"],
  floor: (x, y) => (x >= 2 && x <= 11 && y >= 3 && y <= 9 ? "checker" : "carpetBlue"),
  objects: [
    ...at("slotmachine", [[1, 1], [2, 1], [3, 1], [4, 1], [5, 1]]),
    { kind: "roulettetable", x: 8, y: 1, w: 3, h: 2, label: "ROULETTE" },
    { kind: "cardtable", x: 2, y: 5, w: 3, h: 2, color: "#1d7a4a", label: "BLACKJACK" },
    { kind: "cardtable", x: 9, y: 5, w: 3, h: 2, color: "#8a2a3a", label: "VIDEO POKER" },
    { kind: "cardtable", x: 5, y: 3, w: 2, h: 2, color: "#3a4a8a", label: "HI & LO" },
    { kind: "cardtable", x: 7, y: 7, w: 2, h: 2, color: "#6a3a8a", label: "SIC BO" },
    { kind: "neonsign", x: 6, y: 1, color: "#ff3d9a" },
    { kind: "goldpig", x: 12, y: 1 },
    ...at("plant", [[0, 0], [13, 0], [0, 11], [13, 11]]),
    { kind: "stall", x: 1, y: 9, w: 2, h: 1, color: "#e3b53c", label: "けいひん" },
  ],
  spots: [
    { x: 1, y: 10, game: "prizeshop", label: "景品交換所" },
    { x: 2, y: 10, game: "prizeshop", label: "景品交換所" },
    ...[1, 2, 3, 4, 5].map((x) => ({ x, y: 2, game: "slots" as const, label: "スロット" })),
    { x: 9, y: 3, game: "roulette", label: "ルーレット" },
    { x: 3, y: 7, game: "blackjack", label: "ブラックジャック" },
    { x: 10, y: 7, game: "poker", label: "ビデオポーカー" },
    { x: 5, y: 5, game: "highlow", label: "ハイ＆ロー" },
    { x: 7, y: 9, game: "sicbo", label: "サイコロ" },
  ],
  portals: [
    { x: 6, y: 11, to: "street", spawn: [16, 6], label: "しょうてんがい" },
    { x: 7, y: 11, to: "street", spawn: [16, 7], label: "しょうてんがい" },
  ],
};

// A pond in the park: an ellipse of water ringed by shore tiles (the fishing spots).
const inPond = (x: number, y: number) => ((x - 6) ** 2) / 10.24 + ((y - 5) ** 2) / 4.84 < 1;
const nearPond = (x: number, y: number) =>
  !inPond(x, y) && [-1, 0, 1].some((dx) => [-1, 0, 1].some((dy) => inPond(x + dx, y + dy)));

const park: AreaDef = {
  id: "park",
  name: "こうえん",
  width: 16,
  height: 14,
  spawn: [8, 11],
  indoor: false,
  background: ["#c8f0c0", "#eafbe4"],
  floor: (x, y) => {
    if (inPond(x, y)) return "water";
    if (nearPond(x, y)) return "shore";
    if (x >= 9 && x <= 14 && y >= 6 && y <= 11) return "sand";
    return "grass";
  },
  objects: [
    ...at("tree", [[1, 1], [4, 0], [8, 0], [12, 0], [14, 2], [1, 4], [14, 12], [1, 12], [5, 12], [9, 13]]),
    ...at("flowerbed", [[3, 10], [4, 10], [11, 3], [12, 3]]),
    ...at("bench", [[2, 8], [9, 3], [7, 10], [13, 5]], { walkable: true, seat: true }),
    ...at("lamp", [[3, 2], [9, 8], [11, 11]]),
    ...at("lilypad", [[5, 4], [7, 6], [4, 5], [8, 4]]),
    { kind: "swing", x: 9, y: 6, w: 2, h: 1 },
    { kind: "slide", x: 13, y: 6 },
    { kind: "carousel", x: 10, y: 9, w: 2, h: 2 },
    { kind: "sandbox", x: 13, y: 10, w: 2, h: 1 },
    { kind: "stall", x: 1, y: 10, w: 2, h: 1, color: "#f28fb8", label: "ソフトクリーム" },
  ],
  // Keep the fishing tiles in sync with FISHING_SPOTS in server/town-world.mjs.
  spots: [[6, 8], [4, 7], [8, 7], [6, 2], [2, 5], [10, 5]].map(([x, y]) => ({ x, y, game: "fishing" as const, label: "つり池" })),
  portals: [
    { x: 0, y: 6, to: "plaza", spawn: [14, 2], label: "ひろば" },
    { x: 0, y: 7, to: "plaza", spawn: [14, 3], label: "ひろば" },
  ],
};

const camp: AreaDef = {
  id: "camp",
  name: "キャンプ場",
  width: 16,
  height: 14,
  spawn: [8, 11],
  indoor: false,
  background: ["#9fd0f5", "#e2f2ff"],
  floor: (x, y) => {
    if (y <= 1) return "water";
    if (y === 2) return "shore";
    if (x >= 5 && x <= 9 && y >= 5 && y <= 9) return "gravel";
    return "grass";
  },
  objects: [
    ...at("tree", [[1, 4], [14, 4], [1, 12], [14, 12], [5, 13], [10, 13], [1, 9], [14, 9]]),
    { kind: "tent", x: 2, y: 5, w: 2, h: 2, color: "#e0525c" },
    { kind: "tent", x: 11, y: 5, w: 2, h: 2, color: "#4f8fe0" },
    { kind: "tent", x: 11, y: 10, w: 2, h: 2, color: "#f5cf47" },
    { kind: "campfire", x: 7, y: 7 },
    ...at("log", [[5, 7], [9, 7], [7, 9], [7, 5]], { walkable: true, seat: true }),
    ...at("lantern", [[4, 9], [10, 9]]),
  ],
  // Keep the fishing tiles in sync with FISHING_SPOTS in server/town-world.mjs.
  spots: [3, 6, 9, 12].map((x) => ({ x, y: 2, game: "fishing" as const, label: "つり場" })),
  portals: [
    { x: 15, y: 6, to: "plaza", spawn: [1, 2], label: "ひろば" },
    { x: 15, y: 7, to: "plaza", spawn: [1, 3], label: "ひろば" },
  ],
};

export const AREAS: Record<StaticAreaId, AreaDef> = { plaza, cafe, beach, shrine, street, casino, park, camp };
export const AREA_ORDER: StaticAreaId[] = ["plaza", "street", "casino", "park", "camp", "shrine", "cafe", "beach"];

export function isStaticAreaId(value: unknown): value is StaticAreaId {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(AREAS, value);
}

export function isRoomAreaId(value: unknown): value is `room:${string}` {
  return typeof value === "string" && /^room:[0-9a-f]{16}$/.test(value);
}

export function isAreaId(value: unknown): value is AreaId {
  return isStaticAreaId(value) || isRoomAreaId(value);
}

// ------------------------------------------------------------------- rooms

const ROOM_FLOOR: Record<string, FloorKind> = {
  wood: "wood", tatami: "tatami", checker: "checker", carpetPink: "carpetPink",
  carpetBlue: "carpetBlue", marble: "marble", lawn: "lawn",
  carpetGreen: "carpetGreen", carpetRed: "carpetRed", tile: "tile", slate: "slate", snow: "snow", darkwood: "darkwood",
};

export function emptyRoom(id: string): RoomData {
  return { id, owner: "", title: "", wall: "cream", floor: "wood", size: ROOM_SIZES[0], items: [] };
}

/** Build a walkable area from a player's room data. */
export function buildRoomArea(room: RoomData): AreaDef {
  const floor = ROOM_FLOOR[room.floor] ?? "wood";
  // Only rooms that have blocks or stairs need the height maps.
  const built = room.items.some((i) => isBlockKind(i.kind) || isStairsKind(i.kind));
  const risePx = room.items.reduce((m, i) => Math.max(m, (levelOf(i) + (isBlockKind(i.kind) ? blockHeightOfKind(i.kind) : isStairsKind(i.kind) ? 1 : 2)) * LEVEL_PX), 0);
  const wall = WALL_STYLES.find((w) => w.id === room.wall) ?? WALL_STYLES[0];
  return {
    id: `room:${room.id}`,
    name: room.title || (room.owner ? `${room.owner}のへや` : "マイルーム"),
    width: room.size,
    height: room.size,
    spawn: roomSpawn(room.size),
    indoor: true,
    wallStyle: wall.id,
    background: ["#2b2330", "#443a4c"],
    floor: () => floor,
    objects: room.items.map((item) => {
      const def = FURNITURE_BY_KIND.get(item.kind);
      const { w, h } = footprintOf(item);
      return {
        kind: item.kind, x: item.x, y: item.y, w, h, color: item.color, rot: item.rot, crop: item.crop, z: item.z, dir: item.dir,
        walkable: def?.walkable, seat: def?.seat, bed: def?.bed, flat: def?.flat,
      };
    }),
    ...(built ? { heights: standHeights(room), tops: surfaceHeights(room), risePx } : {}),
    portals: roomDoor(room.size).map(([x, y], i) => ({ x, y, to: "plaza" as const, spawn: [7 + i, 12] as [number, number], label: "ひろば" })),
    room,
  };
}

// ------------------------------------------------------------------ queries

export function objectsAt(area: AreaDef, x: number, y: number): TownObject[] {
  return area.objects.filter((o) => x >= o.x && x < o.x + (o.w ?? 1) && y >= o.y && y < o.y + (o.h ?? 1));
}

export function isWalkable(area: AreaDef, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= area.width || y >= area.height) return false;
  if (area.floor(x, y) === "water") return false;
  if (area.heights) return area.heights[y * area.width + x] !== null;
  return objectsAt(area, x, y).every((o) => o.walkable);
}

export function portalAt(area: AreaDef, x: number, y: number): Portal | undefined {
  return area.portals.find((p) => p.x === x && p.y === y);
}

export function spotAt(area: AreaDef, x: number, y: number): GameSpot | undefined {
  return area.spots?.find((s) => s.x === x && s.y === y);
}

export function seatAt(area: AreaDef, x: number, y: number): boolean {
  return objectsAt(area, x, y).some((o) => o.seat);
}

export function bedAt(area: AreaDef, x: number, y: number): boolean {
  return objectsAt(area, x, y).some((o) => o.bed);
}

/** Where an avatar stands on this tile, in levels (0 on the floor). */
export function standHeightAt(area: AreaDef, x: number, y: number): number {
  if (!area.heights || x < 0 || y < 0 || x >= area.width || y >= area.height) return 0;
  return area.heights[y * area.width + x] ?? 0;
}

const STAIR_ASCENT: ReadonlyArray<readonly [number, number]> = [[1, 0], [0, 1], [-1, 0], [0, -1]];

function stairAt(area: AreaDef, x: number, y: number): TownObject | undefined {
  return objectsAt(area, x, y).find((o) => isStairsKind(o.kind));
}

/** Height at the edge used to leave a tile. A staircase has a low edge, a high edge and two half-height sides. */
function edgeHeight(area: AreaDef, x: number, y: number, dx: number, dy: number): number {
  const stairs = stairAt(area, x, y);
  if (!stairs) return standHeightAt(area, x, y);
  const [upX, upY] = STAIR_ASCENT[((stairs.dir ?? 0) % 4 + 4) % 4];
  const along = dx * upX + dy * upY;
  const base = levelOf(stairs);
  return along > 0 ? base + 1 : along < 0 ? base : base + 0.5;
}

/**
 * Height under an avatar at its exact position. On stairs this follows the slope instead of jumping at the
 * tile centre, producing a continuous climb from the low edge to the high edge.
 */
export function standHeightAtPosition(area: AreaDef, x: number, y: number): number {
  const tileX = Math.round(x);
  const tileY = Math.round(y);
  const stairs = stairAt(area, tileX, tileY);
  if (!stairs) return standHeightAt(area, tileX, tileY);
  const [upX, upY] = STAIR_ASCENT[((stairs.dir ?? 0) % 4 + 4) % 4];
  const progress = Math.max(0, Math.min(1, 0.5 + (x - tileX) * upX + (y - tileY) * upY));
  return levelOf(stairs) + progress;
}

/** Height during a one-tile walk. Plain blocks interpolate over the step; legacy stairs follow their slope. */
export function movementHeightAt(area: AreaDef, x: number, y: number, target?: readonly [number, number]): number {
  if (!target) return standHeightAtPosition(area, x, y);
  const dx = target[0] - x;
  const dy = target[1] - y;
  if (Math.abs(dx) > 1.001 || Math.abs(dy) > 1.001 || (Math.abs(dx) > 0.001 && Math.abs(dy) > 0.001)) {
    return standHeightAtPosition(area, x, y);
  }
  const fromX = target[0] - Math.sign(dx);
  const fromY = target[1] - Math.sign(dy);
  if (stairAt(area, fromX, fromY) || stairAt(area, target[0], target[1])) {
    return standHeightAtPosition(area, x, y);
  }
  const remaining = Math.min(1, Math.hypot(dx, dy));
  const progress = 1 - remaining;
  const fromHeight = standHeightAt(area, fromX, fromY);
  const toHeight = standHeightAt(area, target[0], target[1]);
  return fromHeight + (toHeight - fromHeight) * progress;
}

/**
 * Two neighbouring tiles are joined when the height changes by at most one block. Dedicated stair pieces still
 * use their low/high edges, but ordinary blocks can now be climbed directly.
 */
function canStep(area: AreaDef, ax: number, ay: number, bx: number, by: number): boolean {
  if (!area.heights) return true;
  const dx = bx - ax;
  const dy = by - ay;
  // Climbing diagonally would skip the low or high end of a staircase. Diagonal movement remains available
  // across level surfaces; height changes must use a cardinal edge.
  if (dx !== 0 && dy !== 0) {
    return Math.abs(standHeightAt(area, ax, ay) - standHeightAt(area, bx, by)) < 0.001;
  }
  if (!stairAt(area, ax, ay) && !stairAt(area, bx, by)) {
    return Math.abs(standHeightAt(area, ax, ay) - standHeightAt(area, bx, by)) <= 1;
  }
  return Math.abs(edgeHeight(area, ax, ay, dx, dy) - edgeHeight(area, bx, by, -dx, -dy)) < 0.001;
}

/** 8-directional BFS without cutting corners. Returns tiles after `from`, ending at `to`. */
export function findPath(area: AreaDef, from: [number, number], to: [number, number]): Array<[number, number]> {
  if (!isWalkable(area, to[0], to[1])) return [];
  const key = (x: number, y: number) => y * area.width + x;
  const prev = new Map<number, number>();
  const start = key(from[0], from[1]);
  const goal = key(to[0], to[1]);
  prev.set(start, -1);
  const queue: number[] = [start];
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  while (queue.length > 0) {
    const cur = queue.shift() as number;
    if (cur === goal) break;
    const cx = cur % area.width;
    const cy = Math.floor(cur / area.width);
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!isWalkable(area, nx, ny) || !canStep(area, cx, cy, nx, ny)) continue;
      if (dx !== 0 && dy !== 0 && (!isWalkable(area, cx + dx, cy) || !isWalkable(area, cx, cy + dy)
        || !canStep(area, cx, cy, cx + dx, cy) || !canStep(area, cx, cy, cx, cy + dy))) continue;
      const k = key(nx, ny);
      if (prev.has(k)) continue;
      prev.set(k, cur);
      queue.push(k);
    }
  }
  if (!prev.has(goal)) return [];
  const path: Array<[number, number]> = [];
  for (let k = goal; k !== start; k = prev.get(k) as number) {
    path.push([k % area.width, Math.floor(k / area.width)]);
  }
  return path.reverse();
}

// Isometric projection: tile centers, 64x32 diamonds.
export const TILE_W = 64;
export const TILE_H = 32;

export function toScreen(gx: number, gy: number): [number, number] {
  return [(gx - gy) * (TILE_W / 2), (gx + gy) * (TILE_H / 2)];
}

/**
 * The tile under a point in world (unscaled) screen space. Rooms with blocks look at each tile's top face,
 * front to back, so you can click the top of a tall stack.
 */
export function pickTile(area: AreaDef, wx: number, wy: number): [number, number] | null {
  if (!area.tops) {
    const [gx, gy] = toGrid(wx, wy);
    return gx < 0 || gy < 0 || gx >= area.width || gy >= area.height ? null : [gx, gy];
  }
  const order: Array<[number, number]> = [];
  for (let y = 0; y < area.height; y += 1) for (let x = 0; x < area.width; x += 1) order.push([x, y]);
  order.sort((a, b) => b[0] + b[1] - (a[0] + a[1]));
  for (const [x, y] of order) {
    const [sx, sy] = toScreen(x, y);
    const lift = (area.tops[y * area.width + x] ?? 0) * LEVEL_PX;
    if (Math.abs(wx - sx) / (TILE_W / 2) + Math.abs(wy - (sy - lift)) / (TILE_H / 2) <= 1) return [x, y];
  }
  return null;
}

export function toGrid(sx: number, sy: number): [number, number] {
  const a = sx / (TILE_W / 2);
  const b = sy / (TILE_H / 2);
  return [Math.round((a + b) / 2), Math.round((b - a) / 2)];
}
