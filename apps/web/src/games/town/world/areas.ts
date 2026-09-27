// Town area definitions. Width/height/spawn must match server/town-world.mjs.
import {
  FURNITURE_BY_KIND, ROOM_SIZES, WALL_STYLES, footprintOf, roomDoor, roomSpawn, type FurnitureKind, type RoomData,
} from "./furniture";

export type FloorKind =
  | "grass" | "stone" | "wood" | "rug" | "sand" | "shore" | "water"
  | "gravel" | "flagstone" | "asphalt" | "crosswalk" | "sidewalk"
  | "tatami" | "checker" | "carpetPink" | "carpetBlue" | "marble" | "lawn";

export type ObjectKind =
  | "tree" | "fountain" | "flowers" | "bench" | "lamp"
  | "counter" | "table" | "chair" | "plant"
  | "palm" | "parasol" | "castle"
  | "torii" | "lantern" | "sakura" | "stall" | "hall" | "offering"
  | "shop" | "vending" | "streetlight" | "planter"
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
};

export type StaticAreaId = "plaza" | "cafe" | "beach" | "shrine" | "street";
/** Static areas, or "room:<16 hex>" for a player's room. */
export type AreaId = StaticAreaId | `room:${string}`;

export type Portal = { x: number; y: number; to: AreaId; spawn: [number, number]; label: string };

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
  wallStyle?: string;
  room?: RoomData;
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
  { x: 5, color: "#f28fb8", label: "ブティック" },
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
  ],
};

export const AREAS: Record<StaticAreaId, AreaDef> = { plaza, cafe, beach, shrine, street };
export const AREA_ORDER: StaticAreaId[] = ["plaza", "street", "shrine", "cafe", "beach"];

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
};

export function emptyRoom(id: string): RoomData {
  return { id, owner: "", title: "", wall: "cream", floor: "wood", size: ROOM_SIZES[0], items: [] };
}

/** Build a walkable area from a player's room data. */
export function buildRoomArea(room: RoomData): AreaDef {
  const floor = ROOM_FLOOR[room.floor] ?? "wood";
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
        kind: item.kind, x: item.x, y: item.y, w, h, color: item.color, rot: item.rot,
        walkable: def?.walkable, seat: def?.seat, bed: def?.bed, flat: def?.flat,
      };
    }),
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
  return objectsAt(area, x, y).every((o) => o.walkable);
}

export function portalAt(area: AreaDef, x: number, y: number): Portal | undefined {
  return area.portals.find((p) => p.x === x && p.y === y);
}

export function seatAt(area: AreaDef, x: number, y: number): boolean {
  return objectsAt(area, x, y).some((o) => o.seat);
}

export function bedAt(area: AreaDef, x: number, y: number): boolean {
  return objectsAt(area, x, y).some((o) => o.bed);
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
      if (!isWalkable(area, nx, ny)) continue;
      if (dx !== 0 && dy !== 0 && (!isWalkable(area, cx + dx, cy) || !isWalkable(area, cx, cy + dy))) continue;
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

export function toGrid(sx: number, sy: number): [number, number] {
  const a = sx / (TILE_W / 2);
  const b = sy / (TILE_H / 2);
  return [Math.round((a + b) / 2), Math.round((b - a) / 2)];
}
