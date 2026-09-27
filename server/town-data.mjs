// Persistent town state: players (アメ wallet, owned items, rooms) and rooms.
// Players are identified by a hash of their per-browser clientKey; the key
// itself never leaves the owner's socket.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import economy from "../apps/web/src/games/town/shared/economy.json" with { type: "json" };

export { economy };

const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "data");
const DATA_PATH = process.env.TOWN_DATA_PATH || path.join(DATA_DIR, "town-data.json");
// Pre-economy saves (rooms + praise only) are migrated on first load.
const LEGACY_ROOMS_PATH = process.env.TOWN_ROOMS_PATH || path.join(DATA_DIR, "town-rooms.json");

export const FURNITURE = economy.furnitureFootprints;
export const FLAT_FURNITURE = new Set(economy.flatFurniture);
export const WALL_STYLES = new Set(economy.wallStyles);
export const FLOOR_STYLES = new Set(economy.floorStyles);
export const ROOM_SIZES = economy.rooms.sizes;
export const LIMITED_PARTS = new Map(economy.limitedParts.map((p) => [`${p.key}:${p.id}`, p]));
export const LIMITED_FURNITURE = new Map(economy.limitedFurniture.map((f) => [f.kind, f]));

/** playerId -> player */
export const players = new Map();
/** roomId -> room */
export const rooms = new Map();

const nowTs = () => Date.now();

/** Calendar day in Japan time, used for daily bonuses and caps. */
export function dayKey(ts = nowTs()) {
  return new Date(ts + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function playerIdFor(clientKey) {
  return crypto.createHash("sha256").update(`town-room:${clientKey}`).digest("hex").slice(0, 16);
}

export function newRoomId() {
  let id = "";
  do id = crypto.randomBytes(8).toString("hex");
  while (rooms.has(id) || players.has(id));
  return id;
}

export function normalizeName(raw) {
  const trimmed = String(raw || "").trim().replace(/\s+/g, " ");
  return trimmed.slice(0, 12) || "ゲスト";
}

function freshDaily() {
  return { day: dayKey(), login: false, dress: false, onlineMs: 0, onlineEarned: 0, praiseReceived: 0, praiseGiven: 0, visits: [] };
}

export function dailyOf(player) {
  if (!player.daily || player.daily.day !== dayKey()) player.daily = freshDaily();
  return player.daily;
}

// ------------------------------------------------------------ rooms

export function roomDoor(size) {
  return [[size / 2 - 1, size - 1], [size / 2, size - 1]];
}

export function roomSpawn(size) {
  return [size / 2, size - 2];
}

export function maxItems(size) {
  return economy.rooms.maxItems[String(size)] ?? 50;
}

export function footprint(item) {
  const [w, h] = FURNITURE[item.kind] || [1, 1];
  return item.rot ? { w: h, h: w } : { w, h };
}

function covers(item, x, y) {
  const { w, h } = footprint(item);
  return x >= item.x && x < item.x + w && y >= item.y && y < item.y + h;
}

export function itemAt(room, x, y) {
  const hits = room.items.filter((o) => covers(o, x, y));
  return hits.find((o) => !FLAT_FURNITURE.has(o.kind)) || hits[0];
}

export function canPlace(room, item) {
  const { w, h } = footprint(item);
  if (item.x < 0 || item.y < 0 || item.x + w > room.size || item.y + h > room.size) return false;
  const door = roomDoor(room.size);
  const flat = FLAT_FURNITURE.has(item.kind);
  for (let dx = 0; dx < w; dx += 1) {
    for (let dy = 0; dy < h; dy += 1) {
      const x = item.x + dx;
      const y = item.y + dy;
      if (door.some(([ddx, ddy]) => ddx === x && ddy === y)) return false;
      // Rugs may sit under furniture and vice versa; solid pieces can't overlap each other.
      if (room.items.some((o) => covers(o, x, y) && FLAT_FURNITURE.has(o.kind) === flat)) return false;
    }
  }
  return true;
}

export function sanitizeItem(raw) {
  const kind = String(raw?.kind || "");
  if (!Object.prototype.hasOwnProperty.call(FURNITURE, kind)) return null;
  const item = { kind, x: Math.floor(Number(raw.x)), y: Math.floor(Number(raw.y)) };
  if (!Number.isFinite(item.x) || !Number.isFinite(item.y)) return null;
  const color = String(raw.color || "");
  if (/^#[0-9a-f]{6}$/i.test(color)) item.color = color.toLowerCase();
  if (raw.rot) item.rot = 1;
  return item;
}

export function sanitizeRoom(raw) {
  const size = ROOM_SIZES.includes(Number(raw.size)) ? Number(raw.size) : ROOM_SIZES[0];
  const room = {
    id: String(raw.id),
    ownerId: String(raw.ownerId || raw.id),
    owner: normalizeName(raw.owner),
    title: String(raw.title || "").replace(/\s+/g, " ").trim().slice(0, 20),
    wall: WALL_STYLES.has(raw.wall) ? raw.wall : "cream",
    floor: FLOOR_STYLES.has(raw.floor) ? raw.floor : "wood",
    size,
    items: [],
    updatedAt: Number(raw.updatedAt) || nowTs(),
  };
  for (const itemRaw of Array.isArray(raw.items) ? raw.items : []) {
    const item = sanitizeItem(itemRaw);
    if (item && room.items.length < maxItems(size) && canPlace(room, item)) room.items.push(item);
  }
  return room;
}

export function publicRoom(room) {
  const owner = players.get(room.ownerId);
  return {
    id: room.id, owner: room.owner, title: room.title, wall: room.wall, floor: room.floor,
    size: room.size, items: room.items, goodPigg: owner?.goodPigg || 0,
  };
}

// ------------------------------------------------------------ players

export function ensurePlayer(id, name) {
  let player = players.get(id);
  if (!player) {
    player = {
      id,
      name: normalizeName(name),
      ame: economy.startingAme,
      owned: { parts: [], furniture: [] },
      rooms: [],
      goodPigg: 0,
      daily: freshDaily(),
      createdAt: nowTs(),
    };
    players.set(id, player);
    scheduleSave();
  }
  if (name && player.name !== normalizeName(name)) {
    player.name = normalizeName(name);
    for (const roomId of player.rooms) {
      const room = rooms.get(roomId);
      if (room) room.owner = player.name;
    }
    scheduleSave();
  }
  // Everyone has a home room; its id equals the player id for backward compatibility.
  if (player.rooms.length === 0) {
    const room = sanitizeRoom({ id: player.id, ownerId: player.id, owner: player.name });
    rooms.set(room.id, room);
    player.rooms.push(room.id);
    scheduleSave();
  }
  return player;
}

export function addAme(player, delta) {
  player.ame = Math.max(0, Math.floor(player.ame + delta));
  scheduleSave();
  return player.ame;
}

export function ownsPart(player, key, id) {
  return !LIMITED_PARTS.has(`${key}:${id}`) || player.owned.parts.includes(`${key}:${id}`);
}

export function ownsFurniture(player, kind) {
  return !LIMITED_FURNITURE.has(kind) || player.owned.furniture.includes(kind);
}

export function walletOf(player) {
  const daily = dailyOf(player);
  return {
    ame: player.ame,
    owned: player.owned,
    rooms: player.rooms.map((id) => rooms.get(id)).filter(Boolean).map((r) => ({
      id: r.id, title: r.title, size: r.size, items: r.items.length,
    })),
    goodPigg: player.goodPigg,
    today: {
      login: daily.login,
      dress: daily.dress,
      onlineEarned: daily.onlineEarned,
      praiseReceived: daily.praiseReceived,
      praiseGiven: daily.praiseGiven,
      visits: daily.visits.length,
    },
  };
}

// ------------------------------------------------------------ persistence

function load() {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
    for (const raw of data.players || []) {
      if (!/^[0-9a-f]{16}$/.test(raw?.id)) continue;
      players.set(raw.id, {
        id: raw.id,
        name: normalizeName(raw.name),
        ame: Math.max(0, Math.floor(Number(raw.ame) || 0)),
        owned: {
          parts: (raw.owned?.parts || []).filter((p) => LIMITED_PARTS.has(p)),
          furniture: (raw.owned?.furniture || []).filter((f) => LIMITED_FURNITURE.has(f)),
        },
        rooms: (raw.rooms || []).filter((id) => /^[0-9a-f]{16}$/.test(id)),
        goodPigg: Math.max(0, Math.floor(Number(raw.goodPigg) || 0)),
        daily: raw.daily && typeof raw.daily === "object" ? { ...freshDaily(), ...raw.daily } : freshDaily(),
        createdAt: Number(raw.createdAt) || nowTs(),
      });
    }
    for (const raw of data.rooms || []) {
      if (/^[0-9a-f]{16}$/.test(raw?.id)) rooms.set(raw.id, sanitizeRoom(raw));
    }
    return;
  } catch (error) {
    if (error?.code !== "ENOENT") {
      console.warn("[town] failed to load town data:", error?.message || error);
      return;
    }
  }
  migrateLegacy();
}

function migrateLegacy() {
  let legacy;
  try {
    legacy = JSON.parse(fs.readFileSync(LEGACY_ROOMS_PATH, "utf8"));
  } catch {
    return;
  }
  const praise = legacy.goodPiggs || {};
  for (const raw of legacy.rooms || []) {
    if (!/^[0-9a-f]{16}$/.test(raw?.id)) continue;
    // Legacy rooms were keyed by the owner's id.
    const room = sanitizeRoom({ ...raw, ownerId: raw.id, size: 10 });
    rooms.set(room.id, room);
    players.set(raw.id, {
      id: raw.id,
      name: room.owner,
      ame: economy.startingAme,
      owned: { parts: [], furniture: [] },
      rooms: [room.id],
      goodPigg: Math.max(0, Math.floor(Number(praise[raw.id]) || 0)),
      daily: freshDaily(),
      createdAt: nowTs(),
    });
  }
  console.log(`[town] migrated ${rooms.size} legacy room(s) from ${path.basename(LEGACY_ROOMS_PATH)}`);
  scheduleSave();
}

let saveTimer = null;
export function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    const data = { version: 2, players: [...players.values()], rooms: [...rooms.values()] };
    const tmp = `${DATA_PATH}.tmp`;
    fs.promises.mkdir(path.dirname(DATA_PATH), { recursive: true })
      .then(() => fs.promises.writeFile(tmp, JSON.stringify(data)))
      .then(() => fs.promises.rename(tmp, DATA_PATH))
      .catch((error) => console.warn("[town] failed to save town data:", error?.message || error));
  }, 1000);
}

load();
