// Persistent town state: players (アメ wallet, owned items, rooms) and rooms.
// Players are identified by a hash of their per-browser clientKey; the key
// itself never leaves the owner's socket.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import economy from "../apps/web/src/games/town/shared/economy.json" with { type: "json" };
import { gardenSizeFor, levelFromXp } from "../apps/web/src/games/town/shared/gardenRules.mjs";

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
/** Point-shop entries (fishing points / casino coins), by id. */
export const POINT_SHOP = new Map(economy.pointShop.map((e) => [e.id, e]));
// Limited = must be owned before use. Point-shop parts/furniture are limited too (bought with other currencies).
export const LIMITED_PARTS = new Map([
  ...economy.limitedParts.map((p) => [`${p.key}:${p.id}`, p]),
  ...economy.pointShop.filter((e) => e.key && e.part).map((e) => [`${e.key}:${e.part}`, { key: e.key, id: e.part, label: e.label, price: e.price, shop: e.shop }]),
]);
export const LIMITED_FURNITURE = new Map([
  ...economy.limitedFurniture.map((f) => [f.kind, f]),
  ...economy.pointShop.filter((e) => e.furniture).map((e) => [e.furniture, { kind: e.furniture, label: e.label, price: e.price, shop: e.shop }]),
]);
export const RODS = new Map(economy.fishing.rods.map((r) => [r.id, r]));
export const BAITS = new Map(economy.fishing.baits.map((b) => [b.id, b]));
export const CASINO_ITEMS = new Map(economy.casinoItems.map((i) => [i.id, i]));
export const PET_SPECIES = new Map(economy.pets.species.map((s) => [s.id, s]));
export const CROPS = new Map(economy.garden.crops.map((c) => [c.id, c]));
const GARDEN = economy.garden;
export const RECIPES = new Map(GARDEN.recipes.map((r) => [r.id, r]));
const FERT_IDS = new Set(GARDEN.ferts.map((f) => f.id));
const TOOL_IDS = new Set(GARDEN.tools.map((t) => t.id));
const ITEM_IDS = new Set(GARDEN.items.map((i) => i.id));
const DECO_KINDS = new Set([...GARDEN.decos, ...GARDEN.items.map((i) => i.id)]);

/** playerId -> player */
export const players = new Map();
/** roomId -> room */
export const rooms = new Map();
/** playerId -> My Garden (one per player, id = player id) */
export const gardens = new Map();

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

// ------------------------------------------------------------ cloud accounts

/** cloud account key (lower-cased user id) -> playerId */
const linkIndex = new Map();

export function cloudKeyOf(userId) {
  return String(userId || "").trim().toLowerCase().slice(0, 24);
}

/**
 * Which player record a join uses.
 * - Logged in (verified): the account's own record. The first time an account joins it takes over
 *   this browser's record (so existing アメ/rooms come along) unless that already belongs to another account.
 * - Guest: this browser's record, unless an account has taken it over — then a separate guest record,
 *   so a logged-out visitor on a shared browser can't spend the account's アメ or edit its rooms.
 */
export function resolvePlayerId(clientKey, cloudKey) {
  const browserId = clientKey ? playerIdFor(clientKey) : "";
  if (cloudKey) {
    const linked = linkIndex.get(cloudKey);
    if (linked && players.has(linked)) return linked;
    const browserPlayer = browserId ? players.get(browserId) : null;
    const id = browserId && !browserPlayer?.cloudKey ? browserId : newPlayerId();
    linkIndex.set(cloudKey, id);
    return id;
  }
  if (browserId && players.get(browserId)?.cloudKey) return playerIdFor(`${clientKey}:guest`);
  return browserId;
}

/** The account's player id if it has joined town before, else "". */
export function linkedPlayerId(cloudKey) {
  const id = linkIndex.get(cloudKey);
  return id && players.has(id) ? id : "";
}

function newPlayerId() {
  let id = "";
  do id = crypto.randomBytes(8).toString("hex");
  while (rooms.has(id) || players.has(id));
  return id;
}

export function bindCloud(player, cloudKey) {
  if (player.cloudKey === cloudKey) return;
  player.cloudKey = cloudKey;
  linkIndex.set(cloudKey, player.id);
  scheduleSave();
}

/** Name + avatar kept on the server for logged-in players so every device shows the same look. */
export function sanitizeProfile(raw) {
  if (!raw || typeof raw !== "object") return null;
  const avatar = {};
  for (const [key, value] of Object.entries(raw.avatar && typeof raw.avatar === "object" ? raw.avatar : {})) {
    if (key === "wearItems") continue;
    const text = String(value ?? "").trim().slice(0, 24);
    if (/^[a-zA-Z]{1,16}$/.test(key) && text && /^[a-z0-9#-]*$/i.test(text)) avatar[key] = text;
  }
  const wearItems = raw.avatar && typeof raw.avatar === "object" && Array.isArray(raw.avatar.wearItems) ? raw.avatar.wearItems : null;
  if (wearItems) {
    avatar.wearItems = wearItems.slice(0, 20).flatMap((rawItem) => {
      if (!rawItem || typeof rawItem !== "object") return [];
      const key = String(rawItem.key || "").trim();
      const id = String(rawItem.id || "").trim().slice(0, 24);
      const color = String(rawItem.color || "").trim().slice(0, 24);
      if (!/^(top|bottom|onepiece|shoes|hat|glasses|neck|back|hand|ride)$/.test(key) || !/^[a-z0-9-]+$/i.test(id)) return [];
      return [{ key, id, ...(/^#[0-9a-f]{6}$/i.test(color) ? { color: color.toLowerCase() } : {}) }];
    });
  }
  return { name: normalizeName(raw.name), avatar };
}

export function normalizeName(raw) {
  const trimmed = String(raw || "").trim().replace(/\s+/g, " ");
  return trimmed.slice(0, 12) || "ゲスト";
}

function freshDaily() {
  return {
    day: dayKey(), login: false, coinLogin: false, petGift: false, petBond: 0, waterAme: 0, dress: false, onlineMs: 0, onlineEarned: 0,
    praiseReceived: 0, praiseGiven: 0, visits: [], stats: {}, claimed: {}, bonus: false,
  };
}

/** Fishing gear, fishing points, the fish log and casino items (added after the first release). */
function ensureExtras(player, raw = player) {
  player.fishPoints = Math.max(0, Math.floor(Number(raw.fishPoints) || 0));
  const fishing = raw.fishing && typeof raw.fishing === "object" ? raw.fishing : {};
  const rods = new Set(["bamboo", ...(Array.isArray(fishing.rods) ? fishing.rods : [])].filter((r) => RODS.has(r)));
  const baits = {};
  for (const [id, n] of Object.entries(fishing.baits && typeof fishing.baits === "object" ? fishing.baits : {})) {
    const count = Math.floor(Number(n) || 0);
    if (BAITS.has(id) && count > 0) baits[id] = count;
  }
  const rod = rods.has(fishing.rod) ? fishing.rod : "bamboo";
  const bait = baits[fishing.bait] ? fishing.bait : "none";
  player.fishing = { rod, bait, rods: [...rods], baits };
  const log = {};
  for (const [id, entry] of Object.entries(raw.fishLog && typeof raw.fishLog === "object" ? raw.fishLog : {})) {
    const count = Math.floor(Number(entry?.count) || 0);
    if (count > 0) log[id] = { count, best: Math.max(0, Number(entry.best) || 0) };
  }
  player.fishLog = log;
  const items = {};
  for (const [id, n] of Object.entries(raw.items && typeof raw.items === "object" ? raw.items : {})) {
    const count = Math.floor(Number(n) || 0);
    if (CASINO_ITEMS.has(id) && count > 0) items[id] = count;
  }
  player.items = items;

  // Pets: { id, species, name, bond (0-100), fedAt } plus which one walks with the owner.
  const pets = [];
  for (const entry of Array.isArray(raw.pets) ? raw.pets : []) {
    if (pets.length >= economy.pets.max || !PET_SPECIES.has(entry?.species) || !/^[0-9a-f]{12}$/.test(String(entry.id))) continue;
    pets.push({
      id: String(entry.id),
      species: entry.species,
      name: normalizePetName(entry.name, entry.species),
      bond: Math.max(0, Math.min(100, Math.floor(Number(entry.bond) || 0))),
      fedAt: Number(entry.fedAt) || nowTs(),
      pattedAt: 0,
    });
  }
  player.pets = pets;
  player.activePet = pets.some((p) => p.id === raw.activePet) ? raw.activePet : "";
  // Garden: seeds to plant and harvested goods, plus pet food.
  const countMap = (source, allowed) => {
    const out = {};
    for (const [id, n] of Object.entries(source && typeof source === "object" ? source : {})) {
      const count = Math.floor(Number(n) || 0);
      if (allowed.has(id) && count > 0) out[id] = Math.min(count, 9999);
    }
    return out;
  };
  player.seeds = countMap(raw.seeds, CROPS);
  // Everyone starts with some of every regular seed (given once, also to players from before this existed).
  player.starterSeeds = Boolean(raw.starterSeeds);
  if (!player.starterSeeds) {
    const n = GARDEN.starterSeeds ?? 10;
    for (const crop of CROPS.values()) {
      if (!crop.rare) player.seeds[crop.id] = Math.max(player.seeds[crop.id] ?? 0, n);
    }
    player.starterSeeds = true;
  }
  player.goods = countMap(raw.goods, CROPS);
  player.petFood = Math.max(0, Math.min(9999, Math.floor(Number(raw.petFood) || 0)));
  // Lifetime counters (for achievements) and which achievements have been claimed.
  const stats = {};
  for (const [id, n] of Object.entries(raw.stats && typeof raw.stats === "object" ? raw.stats : {})) {
    const count = Math.floor(Number(n) || 0);
    if (/^[a-zA-Z]{1,16}$/.test(id) && count > 0) stats[id] = Math.min(count, 1e9);
  }
  player.stats = stats;
  player.gp = sanitizeGardenProgress(raw.gp);
  const achIds = new Set(ACHIEVEMENTS.map((a) => a.id));
  player.achClaimed = {};
  for (const id of Object.keys(raw.achClaimed && typeof raw.achClaimed === "object" ? raw.achClaimed : {})) {
    if (achIds.has(id)) player.achClaimed[id] = true;
  }
}

/**
 * My Garden progress: xp (→ level), crop dex, dishes, ★gold crops, fertilizer, tools, placeable items,
 * mystery seeds, claimed dex rewards and today's orders.
 */
function sanitizeGardenProgress(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const counts = (source, allowed) => {
    const out = {};
    for (const [id, n] of Object.entries(source && typeof source === "object" ? source : {})) {
      const count = Math.floor(Number(n) || 0);
      if (allowed.has(id) && count > 0) out[id] = Math.min(count, 9999);
    }
    return out;
  };
  const dex = {};
  for (const [id, entry] of Object.entries(src.dex && typeof src.dex === "object" ? src.dex : {})) {
    const n = Math.floor(Number(entry?.n) || 0);
    if (CROPS.has(id) && n > 0) dex[id] = { n: Math.min(n, 1e9), gold: Math.max(0, Math.floor(Number(entry.gold) || 0)) };
  }
  const orders = src.orders && typeof src.orders === "object" && Array.isArray(src.orders.list) ? {
    day: String(src.orders.day || ""),
    refreshes: Math.max(0, Math.floor(Number(src.orders.refreshes) || 0)),
    list: src.orders.list.slice(0, GARDEN.orders.perDay).map((o) => ({
      id: String(o?.id || "").slice(0, 16),
      needs: Object.fromEntries(Object.entries(o?.needs && typeof o.needs === "object" ? o.needs : {})
        .filter(([k]) => CROPS.has(k) || RECIPES.has(k))
        .map(([k, v]) => [k, Math.max(1, Math.min(99, Math.floor(Number(v) || 1)))])),
      ame: Math.max(0, Math.floor(Number(o?.ame) || 0)),
      xp: Math.max(0, Math.floor(Number(o?.xp) || 0)),
      done: Boolean(o?.done),
    })),
  } : null;
  return {
    xp: Math.max(0, Math.floor(Number(src.xp) || 0)),
    dex,
    cooked: counts(src.cooked, RECIPES),
    dishes: counts(src.dishes, RECIPES),
    gold: counts(src.gold, CROPS),
    ferts: counts(src.ferts, FERT_IDS),
    tools: (Array.isArray(src.tools) ? src.tools : []).filter((t) => TOOL_IDS.has(t)),
    items: counts(src.items, ITEM_IDS),
    mystery: Math.max(0, Math.min(9999, Math.floor(Number(src.mystery) || 0))),
    dexClaimed: (Array.isArray(src.dexClaimed) ? src.dexClaimed : []).map(Number).filter((n) => GARDEN.dexMilestones.some((m) => m.pct === n)),
    orders,
    helped: Math.max(0, Math.floor(Number(src.helped) || 0)),
  };
}

export function gardenLevelOf(player) {
  return levelFromXp(player.gp?.xp || 0, GARDEN.maxLevel);
}

// ------------------------------------------------------------ My Garden

function sanitizeGardenCrop(raw) {
  if (!raw || typeof raw !== "object" || !CROPS.has(raw.id)) return null;
  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  return {
    id: raw.id,
    plantedAt: num(raw.plantedAt),
    growth: Math.max(0, num(raw.growth)),
    calcAt: num(raw.calcAt) || num(raw.plantedAt),
    fert: FERT_IDS.has(raw.fert) ? raw.fert : "",
    careWet: Math.max(0, num(raw.careWet)),
    careDry: Math.max(0, num(raw.careDry)),
    ripeAt: Math.max(0, num(raw.ripeAt)),
  };
}

export function sanitizeGarden(raw, size) {
  const garden = {
    id: String(raw.id),
    ownerId: String(raw.ownerId || raw.id),
    owner: normalizeName(raw.owner),
    size,
    plots: [],
    decos: [],
    updatedAt: Number(raw.updatedAt) || nowTs(),
  };
  const used = new Set();
  const inside = (x, y) => Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < size && y < size;
  for (const p of Array.isArray(raw.plots) ? raw.plots : []) {
    const x = Math.floor(Number(p?.x));
    const y = Math.floor(Number(p?.y));
    if (!inside(x, y) || used.has(`${x},${y}`)) continue;
    used.add(`${x},${y}`);
    garden.plots.push({
      x, y,
      wetUntil: Number(p.wetUntil) || 0,
      weed: Boolean(p.weed),
      bug: Boolean(p.bug),
      pestAt: Number(p.pestAt) || nowTs(),
      crop: sanitizeGardenCrop(p.crop),
    });
  }
  for (const d of Array.isArray(raw.decos) ? raw.decos : []) {
    const x = Math.floor(Number(d?.x));
    const y = Math.floor(Number(d?.y));
    if (!DECO_KINDS.has(d?.kind) || !inside(x, y) || used.has(`${x},${y}`) || garden.decos.length >= GARDEN.maxDecos) continue;
    used.add(`${x},${y}`);
    garden.decos.push({ kind: d.kind, x, y });
  }
  return garden;
}

/** The player's garden, created on first use; its size follows the garden level. */
export function ensureGarden(player) {
  const size = gardenSizeFor(gardenLevelOf(player), GARDEN);
  let garden = gardens.get(player.id);
  if (!garden) {
    garden = sanitizeGarden({ id: player.id, ownerId: player.id, owner: player.name }, size);
    gardens.set(player.id, garden);
    scheduleSave();
  }
  if (garden.size < size) {
    garden.size = size;
    scheduleSave();
  }
  if (garden.owner !== player.name) garden.owner = player.name;
  return garden;
}

export function normalizePetName(raw, species) {
  const name = String(raw ?? "").replace(/\s+/g, " ").trim().slice(0, economy.pets.nameMax);
  return name || PET_SPECIES.get(species)?.label || "ペット";
}

/** 0 = full, 100 = starving. */
export function petHunger(pet, now = nowTs()) {
  return Math.max(0, Math.min(100, Math.floor(((now - pet.fedAt) / economy.pets.hungerFullMs) * 100)));
}

export function petLevel(pet) {
  return Math.min(4, Math.floor(pet.bond / 25));
}

/** What other players see of someone's companion. */
export function publicPet(player) {
  const pet = player?.activePet ? player.pets.find((p) => p.id === player.activePet) : null;
  return pet ? { species: pet.species, name: pet.name, level: petLevel(pet) } : null;
}

export function dailyOf(player) {
  if (!player.daily || player.daily.day !== dayKey()) player.daily = freshDaily();
  if (!player.daily.stats || typeof player.daily.stats !== "object") player.daily.stats = {};
  if (!player.daily.claimed || typeof player.daily.claimed !== "object") player.daily.claimed = {};
  return player.daily;
}

// ------------------------------------------------------------ missions & achievements

const QUEST_POOL = economy.quests.pool;
const ACHIEVEMENTS = economy.achievements;

/** Count something the player did: feeds both today's missions and the lifetime achievements. */
export function bump(player, stat, n = 1) {
  if (!player || n <= 0) return;
  const daily = dailyOf(player);
  daily.stats[stat] = (daily.stats[stat] || 0) + n;
  player.stats[stat] = Math.min(1e9, (player.stats[stat] || 0) + n);
  scheduleSave();
}

function seededRandom(seed) {
  let s = crypto.createHash("sha256").update(seed).digest().readUInt32LE(0) || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Today's missions: a fixed pick per player and day, never two of the same kind. */
function todaysMissions(player) {
  const random = seededRandom(`${dayKey()}:${player.id}`);
  const pool = [...QUEST_POOL];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picked = [];
  const used = new Set();
  for (const q of pool) {
    if (picked.length >= economy.quests.dailyCount) break;
    if (used.has(q.stat)) continue;
    used.add(q.stat);
    picked.push(q);
  }
  return picked;
}

export function missionsOf(player) {
  const daily = dailyOf(player);
  const list = todaysMissions(player).map((q) => ({
    id: q.id, label: q.label, target: q.target, reward: q.reward,
    progress: Math.min(q.target, daily.stats[q.stat] || 0), claimed: Boolean(daily.claimed[q.id]),
  }));
  return {
    list,
    bonus: { reward: economy.quests.allBonus, ready: list.every((m) => m.claimed), claimed: Boolean(daily.bonus) },
  };
}

/** Amount to pay out, or 0 when the mission is unknown, not finished or already claimed. */
export function claimMission(player, id) {
  const mission = missionsOf(player).list.find((m) => m.id === id);
  if (!mission || mission.claimed || mission.progress < mission.target) return 0;
  dailyOf(player).claimed[id] = true;
  scheduleSave();
  return mission.reward;
}

export function claimMissionBonus(player) {
  const { bonus } = missionsOf(player);
  if (!bonus.ready || bonus.claimed) return 0;
  dailyOf(player).bonus = true;
  scheduleSave();
  return bonus.reward;
}

function achievementProgress(player, stat) {
  switch (stat) {
    case "species": return Object.keys(player.fishLog).length;
    case "pets": return player.pets.length;
    case "maxBond": return player.pets.reduce((m, p) => Math.max(m, p.bond), 0);
    case "furniture": return player.rooms.reduce((sum, id) => sum + (rooms.get(id)?.items.length || 0), 0);
    default: return player.stats[stat] || 0;
  }
}

export function achievementsOf(player) {
  return ACHIEVEMENTS.map((a) => {
    const progress = Math.min(a.target, achievementProgress(player, a.stat));
    return { id: a.id, label: a.label, desc: a.desc, target: a.target, reward: a.reward, progress, claimed: Boolean(player.achClaimed[a.id]) };
  });
}

export function claimAchievement(player, id) {
  const a = achievementsOf(player).find((x) => x.id === id);
  if (!a || a.claimed || a.progress < a.target) return 0;
  player.achClaimed[id] = true;
  scheduleSave();
  return a.reward;
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

// ------------------------------------------------------------ building: levels, blocks, stairs

export const MAX_LEVEL = economy.rooms.maxLevel ?? 3;
export const LAYOUT_SLOTS = economy.rooms.layoutSlots ?? 3;
export const HALF_BLOCK_KINDS = new Set(economy.build.halfBlocks || []);
export const BLOCK_KINDS = new Set([...economy.build.blocks, ...(economy.build.halfBlocks || [])]);
export const STAIRS_KINDS = new Set(economy.build.stairs);
const isBlock = (item) => BLOCK_KINDS.has(item.kind);
const isStairs = (item) => STAIRS_KINDS.has(item.kind);
export const blockHeight = (item) => HALF_BLOCK_KINDS.has(item.kind) ? 0.5 : isBlock(item) ? 1 : 0;
/** The level an item sits on: 0 = the floor, 1 = on top of one block, ... */
const level = (item) => item.z || 0;
const pieceHeight = (item) => isBlock(item) ? blockHeight(item) : 1;

export function footprint(item) {
  const [w, h] = FURNITURE[item.kind] || [1, 1];
  return item.rot ? { w: h, h: w } : { w, h };
}

function covers(item, x, y) {
  const { w, h } = footprint(item);
  return x >= item.x && x < item.x + w && y >= item.y && y < item.y + h;
}

/** The piece you would pick at a tile: the highest solid one, or a rug if that is all there is. */
export function itemAt(room, x, y) {
  const hits = room.items.filter((o) => covers(o, x, y));
  const solid = hits.filter((o) => !FLAT_FURNITURE.has(o.kind)).sort((a, b) => level(b) - level(a));
  return solid[0] || hits[0];
}

/**
 * Where the next thing on this tile would sit: `top` is the height of the block stack, `occupied` is true when
 * furniture or a staircase already stands on it (nothing can be put on those).
 */
export function tileTop(room, x, y, ignore = null) {
  const here = room.items.filter((o) => o !== ignore && !FLAT_FURNITURE.has(o.kind) && covers(o, x, y));
  let top = 0;
  while (true) {
    const block = here.find((o) => isBlock(o) && level(o) === top);
    if (!block) break;
    top += blockHeight(block);
  }
  return { top, occupied: here.some((o) => !isBlock(o) && level(o) === top) };
}

/** The level a new piece lands on when dropped at (x, y): on top of whatever is built there. */
export function autoLevel(room, item, ignore = null) {
  if (FLAT_FURNITURE.has(item.kind)) return 0;
  return tileTop(room, item.x, item.y, ignore).top;
}

/** Something is resting on this block (so it can't be taken out from under it). */
export function hasAbove(room, item) {
  if (!isBlock(item)) return false;
  const { w, h } = footprint(item);
  return room.items.some((o) => o !== item && !FLAT_FURNITURE.has(o.kind) && level(o) > level(item)
    && [...Array(w).keys()].some((dx) => [...Array(h).keys()].some((dy) => covers(o, item.x + dx, item.y + dy))));
}

export function canPlace(room, item, ignore = null) {
  const { w, h } = footprint(item);
  if (item.x < 0 || item.y < 0 || item.x + w > room.size || item.y + h > room.size) return false;
  const z = level(item);
  const flat = FLAT_FURNITURE.has(item.kind);
  if (flat && z !== 0) return false;
  const height = isBlock(item) ? blockHeight(item) : isStairs(item) ? 1 : 0;
  if (z < 0 || z > MAX_LEVEL - height) return false;
  const door = roomDoor(room.size);
  for (let dx = 0; dx < w; dx += 1) {
    for (let dy = 0; dy < h; dy += 1) {
      const x = item.x + dx;
      const y = item.y + dy;
      if (door.some(([ddx, ddy]) => ddx === x && ddy === y)) return false;
      if (flat) {
        // Rugs may sit under furniture and vice versa; rugs can't overlap each other.
        if (room.items.some((o) => o !== ignore && covers(o, x, y) && FLAT_FURNITURE.has(o.kind))) return false;
        continue;
      }
      const itemTop = z + pieceHeight(item);
      if (room.items.some((o) => {
        if (o === ignore || FLAT_FURNITURE.has(o.kind) || !covers(o, x, y)) return false;
        const otherZ = level(o);
        return Math.max(z, otherZ) < Math.min(itemTop, otherZ + pieceHeight(o)) - 0.001;
      })) return false;
      const t = tileTop(room, x, y, ignore);
      if (!isBlock(item) && (t.occupied || t.top !== z)) return false;
    }
  }
  return true;
}

/** Keep every piece that still has something to stand on, from the ground up; drop the rest. */
export function settleItems(size, items, limit) {
  const room = { size, items: [] };
  const ordered = [...items].sort((a, b) => Number(!FLAT_FURNITURE.has(a.kind)) - Number(!FLAT_FURNITURE.has(b.kind)) || level(a) - level(b));
  for (const item of ordered) {
    if (room.items.length >= limit) break;
    if (canPlace(room, item)) room.items.push(item);
  }
  return room.items;
}

export function sanitizeItem(raw) {
  const kind = String(raw?.kind || "");
  if (!Object.prototype.hasOwnProperty.call(FURNITURE, kind)) return null;
  const item = { kind, x: Math.floor(Number(raw.x)), y: Math.floor(Number(raw.y)) };
  if (!Number.isFinite(item.x) || !Number.isFinite(item.y)) return null;
  const color = String(raw.color || "");
  if (/^#[0-9a-f]{6}$/i.test(color)) item.color = color.toLowerCase();
  if (raw.rot) item.rot = 1;
  const z = Math.round(Number(raw.z) * 2) / 2;
  if (Number.isFinite(z) && z > 0) item.z = Math.min(z, MAX_LEVEL);
  if (STAIRS_KINDS.has(kind)) {
    const dir = ((Math.floor(Number(raw.dir)) || 0) % 4 + 4) % 4;
    if (dir) item.dir = dir;
  }
  // A plot remembers what is growing in it.
  const crop = raw.crop;
  if (kind === "plot" && crop && typeof crop === "object" && CROPS.has(crop.id)) {
    const plantedAt = Number(crop.plantedAt);
    const readyAt = Number(crop.readyAt);
    if (Number.isFinite(plantedAt) && Number.isFinite(readyAt) && readyAt >= plantedAt) {
      item.crop = {
        id: crop.id, plantedAt, readyAt,
        waters: Math.max(0, Math.min(economy.garden.maxWater, Math.floor(Number(crop.waters) || 0))),
        lastWaterAt: Number(crop.lastWaterAt) || 0,
      };
    }
  }
  return item;
}

function sanitizeLayouts(raw, size) {
  const out = [];
  for (const entry of Array.isArray(raw) ? raw.slice(0, LAYOUT_SLOTS) : []) {
    if (!entry || typeof entry !== "object") {
      out.push(null);
      continue;
    }
    const items = (Array.isArray(entry.items) ? entry.items : []).map(sanitizeItem).filter(Boolean).map((i) => {
      delete i.crop;
      return i;
    });
    out.push({
      savedAt: Number(entry.savedAt) || nowTs(),
      size: ROOM_SIZES.includes(Number(entry.size)) ? Number(entry.size) : size,
      wall: WALL_STYLES.has(entry.wall) ? entry.wall : "cream",
      floor: FLOOR_STYLES.has(entry.floor) ? entry.floor : "wood",
      items: items.slice(0, maxItems(Math.max(...ROOM_SIZES))),
    });
  }
  return out;
}

/** "誰々さんが遊びに来たよ！" guestbook: the most recent distinct visitors to a room. */
const MAX_ROOM_GUESTS = 12;

function sanitizeGuest(raw) {
  if (!raw || typeof raw !== "object") return null;
  const name = normalizeName(raw.name);
  if (!name) return null;
  return { name, friendId: String(raw.friendId || "").slice(0, 20), at: Number(raw.at) || nowTs() };
}

function sanitizeGuests(raw) {
  return (Array.isArray(raw) ? raw : []).map(sanitizeGuest).filter(Boolean).slice(0, MAX_ROOM_GUESTS);
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
    layouts: sanitizeLayouts(raw.layouts, size),
    guests: sanitizeGuests(raw.guests),
    updatedAt: Number(raw.updatedAt) || nowTs(),
  };
  const items = (Array.isArray(raw.items) ? raw.items : []).map(sanitizeItem).filter(Boolean);
  room.items = settleItems(size, items, maxItems(size));
  return room;
}

/** Record a visit for the room's guestbook (called at most once per visitor per day). */
export function addRoomGuest(room, name, friendId) {
  room.guests = [{ name: normalizeName(name), friendId: String(friendId || "").slice(0, 20), at: nowTs() }, ...(room.guests || [])].slice(0, MAX_ROOM_GUESTS);
  scheduleSave();
}

export function publicRoom(room) {
  const owner = players.get(room.ownerId);
  return {
    id: room.id, owner: room.owner, title: room.title, wall: room.wall, floor: room.floor,
    size: room.size, items: room.items, goodPigg: owner?.goodPigg || 0,
    guests: room.guests || [],
    layouts: (room.layouts || []).map((l) => (l ? { savedAt: l.savedAt, count: l.items.length } : null)),
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
    ensureExtras(player);
    players.set(id, player);
    scheduleSave();
  }
  if (name && player.name !== normalizeName(name)) {
    player.name = normalizeName(name);
    for (const roomId of player.rooms) {
      const room = rooms.get(roomId);
      if (room) room.owner = player.name;
    }
    const garden = gardens.get(player.id);
    if (garden) garden.owner = player.name;
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
    fishPoints: player.fishPoints,
    fishing: player.fishing,
    fishLog: player.fishLog,
    items: player.items,
    seeds: player.seeds,
    goods: player.goods,
    petFood: player.petFood,
    garden: {
      xp: player.gp.xp,
      level: gardenLevelOf(player),
      dex: player.gp.dex,
      cooked: player.gp.cooked,
      dishes: player.gp.dishes,
      gold: player.gp.gold,
      ferts: player.gp.ferts,
      tools: player.gp.tools,
      items: player.gp.items,
      mystery: player.gp.mystery,
      dexClaimed: player.gp.dexClaimed,
      helped: player.gp.helped,
      hasGarden: gardens.has(player.id),
    },
    pets: player.pets.map((p) => ({
      id: p.id, species: p.species, name: p.name, bond: p.bond, level: petLevel(p), hunger: petHunger(p),
    })),
    activePet: player.activePet,
    missions: missionsOf(player),
    achievements: achievementsOf(player),
    today: {
      login: daily.login,
      coinLogin: Boolean(daily.coinLogin),
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
      const loaded = players.get(raw.id);
      ensureExtras(loaded, raw);
      const cloudKey = cloudKeyOf(raw.cloudKey);
      if (cloudKey && !linkIndex.has(cloudKey)) {
        loaded.cloudKey = cloudKey;
        linkIndex.set(cloudKey, loaded.id);
      }
      const profile = sanitizeProfile(raw.profile);
      if (profile) loaded.profile = profile;
    }
    for (const raw of data.rooms || []) {
      if (/^[0-9a-f]{16}$/.test(raw?.id)) rooms.set(raw.id, sanitizeRoom(raw));
    }
    for (const raw of data.gardens || []) {
      const owner = players.get(String(raw?.id));
      if (!owner) continue;
      gardens.set(owner.id, sanitizeGarden(raw, gardenSizeFor(gardenLevelOf(owner), GARDEN)));
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
    const migrated = {
      id: raw.id,
      name: room.owner,
      ame: economy.startingAme,
      owned: { parts: [], furniture: [] },
      rooms: [room.id],
      goodPigg: Math.max(0, Math.floor(Number(praise[raw.id]) || 0)),
      daily: freshDaily(),
      createdAt: nowTs(),
    };
    ensureExtras(migrated);
    players.set(raw.id, migrated);
  }
  console.log(`[town] migrated ${rooms.size} legacy room(s) from ${path.basename(LEGACY_ROOMS_PATH)}`);
  scheduleSave();
}

let saveTimer = null;
export function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    const data = { version: 2, players: [...players.values()], rooms: [...rooms.values()], gardens: [...gardens.values()] };
    const tmp = `${DATA_PATH}.tmp`;
    fs.promises.mkdir(path.dirname(DATA_PATH), { recursive: true })
      .then(() => fs.promises.writeFile(tmp, JSON.stringify(data)))
      .then(() => fs.promises.rename(tmp, DATA_PATH))
      .catch((error) => console.warn("[town] failed to save town data:", error?.message || error));
  }, 1000);
}

load();
