// Town (Pigg-style virtual world) realtime state.
// Messages whose type starts with "town-" are routed here from room-server.mjs.
import crypto from "node:crypto";
import { WebSocket } from "ws";
import {
  BAITS, CASINO_ITEMS, CROPS, FLAT_FURNITURE, FLOOR_STYLES, LIMITED_FURNITURE, LIMITED_PARTS, PET_SPECIES, POINT_SHOP, RODS, ROOM_SIZES, WALL_STYLES,
  normalizePetName, petHunger, petLevel, publicPet,
  BLOCK_KINDS, LAYOUT_SLOTS, MAX_LEVEL, autoLevel, hasAbove, settleItems, footprint,
  addAme, bindCloud, bump, canPlace, claimAchievement, claimMission, claimMissionBonus, cloudKeyOf, dailyOf, economy, ensurePlayer, itemAt, linkedPlayerId, maxItems, newRoomId,
  normalizeName, ownsFurniture, ownsPart, players, publicRoom, resolvePlayerId, roomSpawn, rooms, sanitizeItem,
  sanitizeRoom, scheduleSave, walletOf,
} from "./town-data.mjs";

// Keep in sync with apps/web/src/games/town/world/areas.ts (size and spawn only).
const AREAS = {
  plaza: { width: 16, height: 16, spawn: [7, 12] },
  cafe: { width: 12, height: 12, spawn: [6, 10] },
  beach: { width: 16, height: 16, spawn: [8, 13] },
  shrine: { width: 14, height: 14, spawn: [6, 12] },
  street: { width: 18, height: 10, spawn: [1, 6] },
  casino: { width: 14, height: 12, spawn: [6, 10] },
  park: { width: 16, height: 14, spawn: [8, 11] },
  camp: { width: 16, height: 14, spawn: [8, 11] },
};
const DEFAULT_AREA = "plaza";

// Keep in sync with apps/web/src/games/town/avatar/{parts,actions}.ts.
const AVATAR_KEYS = [
  "skin", "face", "brows", "browColor", "eyes", "eyeColor", "nose", "mouth", "cheek", "mark", "hair", "hairColor",
  "top", "topColor", "bottom", "bottomColor", "onepiece", "onepieceColor", "shoes", "shoesColor",
  "hat", "hatColor", "glasses", "glassesColor", "neck", "neckColor", "back", "backColor", "hand", "handColor", "ride",
];
const WEAR_KEYS = new Set(["top", "bottom", "onepiece", "shoes", "hat", "glasses", "neck", "back", "hand", "ride"]);
const MAX_WEAR_ITEMS = 20;
const ACTIONS = new Set([
  "laugh", "cry", "angry", "shy", "surprise", "love", "sweat", "sleep",
  "wave", "bow", "clap", "banzai", "peace", "heart",
  "jump", "spin", "dance", "backflip", "sit", "lie", "fish",
]);

// Keep in sync with the "fishing" spots of the beach in apps/web/src/games/town/world/areas.ts.
const FISHING_SPOTS = {
  beach: [[3, 4], [5, 3], [11, 4], [13, 3]],
  park: [[6, 8], [4, 7], [8, 7], [6, 2], [2, 5], [10, 5]],
  camp: [[3, 2], [6, 2], [9, 2], [12, 2]],
};
/** Which fish live where: the beach is the sea, the park pond and the camp river are freshwater. */
const HABITAT_OF = { beach: "sea", park: "pond", camp: "pond" };
const FISH_CAST_MIN_INTERVAL_MS = 1000;
const STACK_MAX = 999;

const CHANNEL_CAPACITY = Number(process.env.TOWN_CHANNEL_CAPACITY || 30);
const ROOM_CHANNEL_CAPACITY = 20;
const CHAT_MAX_LENGTH = 80;
const CHAT_MIN_INTERVAL_MS = 700;
const CHAT_WINDOW_MS = 12000;
const CHAT_MAX_IN_WINDOW = 8;
const CHAT_DUP_WINDOW_MS = 9000;
const ACTION_MIN_INTERVAL_MS = 500;
const MOVE_MIN_INTERVAL_MS = 80;
const EDIT_MIN_INTERVAL_MS = 120;
const SHOP_MIN_INTERVAL_MS = 300;
const GOOD_PIGG_COOLDOWN_MS = 30000;
const WHERE_MIN_INTERVAL_MS = 3000;
const WHERE_MAX_IDS = 100;
// Online time only counts while messages keep arriving (clients ping every 15s).
const ONLINE_TICK_MAX_MS = 30000;
// Clients ping every 15s; anything silent for longer is a dead connection
// (closed laptop, dropped Wi-Fi) whose avatar would otherwise linger.
const STALE_MEMBER_MS = Number(process.env.TOWN_STALE_MEMBER_MS || 45000);
const STALE_SWEEP_INTERVAL_MS = 10000;

const EARN = economy.earn;
const SCRATCH_SYMBOLS = ["🍬", "🌸", "🍀", "⭐", "💎", "🎁"];

/** channelKey ("plaza#1", "room:<id>#1") -> Set<ws> */
const channels = new Map();
/** Per-browser key -> ws, so re-joining from the same browser replaces the old avatar. */
const socketsByClientKey = new Map();

const nowTs = () => Date.now();

// ------------------------------------------------------------ helpers

function send(ws, payload) {
  if (ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(payload));
}

function broadcast(channelKey, payload, exceptWs = null) {
  const members = channels.get(channelKey);
  if (!members) return;
  const text = JSON.stringify(payload);
  for (const member of members) {
    if (member === exceptWs || member.readyState !== WebSocket.OPEN) continue;
    member.send(text);
  }
}

function playerOf(ws) {
  return ws.town?.playerId ? players.get(ws.town.playerId) || null : null;
}

function sendWallet(ws) {
  const player = playerOf(ws);
  if (player) send(ws, { type: "town-wallet", wallet: walletOf(player) });
}

/** Credit アメ and tell the player why (for the toast). */
function earn(ws, player, amount, reason) {
  if (!player || amount <= 0) return;
  addAme(player, amount);
  if (ws) {
    send(ws, { type: "town-ame", delta: amount, reason, ame: player.ame });
    sendWallet(ws);
  }
}

/** Drop unknown values and limited parts the player doesn't own. */
function normalizeAvatar(raw, player) {
  const src = raw && typeof raw === "object" ? raw : {};
  const avatar = {};
  for (const key of AVATAR_KEYS) {
    const value = String(src[key] ?? "").trim().slice(0, 24);
    if (!value || !/^[a-z0-9#-]*$/i.test(value)) continue;
    if (LIMITED_PARTS.has(`${key}:${value}`) && (!player || !ownsPart(player, key, value))) continue;
    avatar[key] = value;
  }
  if (Array.isArray(src.wearItems)) {
    avatar.wearItems = [];
    for (const rawItem of src.wearItems) {
      if (avatar.wearItems.length >= MAX_WEAR_ITEMS || !rawItem || typeof rawItem !== "object") break;
      const key = String(rawItem.key || "").trim();
      const id = String(rawItem.id || "").trim().slice(0, 24);
      const color = String(rawItem.color || "").trim().slice(0, 24);
      if (!WEAR_KEYS.has(key) || !id || id === "none" || !/^[a-z0-9-]*$/i.test(id)) continue;
      if (LIMITED_PARTS.has(`${key}:${id}`) && (!player || !ownsPart(player, key, id))) continue;
      avatar.wearItems.push({ key, id, ...(/^#[0-9a-f]{6}$/i.test(color) ? { color: color.toLowerCase() } : {}) });
    }
  }
  return avatar;
}

function normalizeClientKey(raw) {
  const key = String(raw || "").trim();
  return /^[a-z0-9-]{8,64}$/i.test(key) ? key : "";
}

/**
 * Cloud "friend ID" a browser claims for itself. Same format as apps/api. It is
 * NOT verified here (town identity is self-declared, like the name), so it is
 * only used for showing where friends are and for the add-friend button; the
 * friend API itself still authenticates every request.
 */
function normalizeFriendId(raw) {
  return String(raw || "").trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24);
}

function roomIdOfArea(area) {
  const match = /^room:([0-9a-f]{16})$/.exec(String(area || ""));
  return match ? match[1] : "";
}

function areaSize(area) {
  const roomId = roomIdOfArea(area);
  if (roomId) {
    const size = rooms.get(roomId)?.size || ROOM_SIZES[0];
    return { width: size, height: size, spawn: roomSpawn(size) };
  }
  return AREAS[area] || AREAS[DEFAULT_AREA];
}

function clampTile(area, x, y) {
  const def = areaSize(area);
  const cx = Math.max(0, Math.min(def.width - 1, Math.floor(Number(x))));
  const cy = Math.max(0, Math.min(def.height - 1, Math.floor(Number(y))));
  if (!Number.isFinite(cx) || !Number.isFinite(cy)) return def.spawn;
  return [cx, cy];
}

function publicMember(ws) {
  const t = ws.town;
  const player = playerOf(ws);
  return {
    id: t.id, name: t.name, avatar: t.avatar, x: t.x, y: t.y,
    roomId: player?.rooms[0] || "", goodPigg: player?.goodPigg || 0, friendId: t.friendId || "", pet: publicPet(player),
  };
}

function areaOfChannel(channelKey) {
  return String(channelKey || "").split("#")[0];
}

function pickChannel(area, preferred = 0) {
  const capacity = roomIdOfArea(area) ? ROOM_CHANNEL_CAPACITY : CHANNEL_CAPACITY;
  // Joining a friend: use their channel when it still has space.
  if (Number.isInteger(preferred) && preferred >= 1 && preferred < 1000) {
    const key = `${area}#${preferred}`;
    const members = channels.get(key);
    if (members && members.size < capacity) return { key, number: preferred };
  }
  for (let n = 1; n < 1000; n += 1) {
    const key = `${area}#${n}`;
    const members = channels.get(key);
    if (!members || members.size < capacity) return { key, number: n };
  }
  return { key: `${area}#1`, number: 1 };
}

function countIn(area) {
  let count = 0;
  for (const [key, members] of channels.entries()) if (areaOfChannel(key) === area) count += members.size;
  return count;
}

function areaCounts() {
  const counts = {};
  for (const area of Object.keys(AREAS)) counts[area] = countIn(area);
  return counts;
}

function leaveChannel(ws) {
  const t = ws.town;
  if (!t || !t.channelKey) return;
  const members = channels.get(t.channelKey);
  if (members) {
    members.delete(ws);
    if (members.size === 0) channels.delete(t.channelKey);
  }
  broadcast(t.channelKey, { type: "town-member-left", id: t.id });
  t.channelKey = null;
}

function forgetClientKey(ws) {
  const clientKey = ws.town?.clientKey;
  if (clientKey && socketsByClientKey.get(clientKey) === ws) socketsByClientKey.delete(clientKey);
}

function checkChatRate(t, text) {
  const now = nowTs();
  t.chatTimes = t.chatTimes.filter((ts) => now - ts < CHAT_WINDOW_MS);
  if (t.chatTimes.length > 0 && now - t.chatTimes[t.chatTimes.length - 1] < CHAT_MIN_INTERVAL_MS) return "TOO_FAST";
  if (t.chatTimes.length >= CHAT_MAX_IN_WINDOW) return "TOO_MANY";
  if (text === t.lastChatText && now - t.lastChatAt < CHAT_DUP_WINDOW_MS) return "DUPLICATE";
  t.chatTimes.push(now);
  t.lastChatText = text;
  t.lastChatAt = now;
  return "";
}

function broadcastRoom(room) {
  const areaKey = `room:${room.id}`;
  for (const key of channels.keys()) {
    if (areaOfChannel(key) === areaKey) broadcast(key, { type: "town-room", room: publicRoom(room) });
  }
}

// ------------------------------------------------------------ earning

/** Online-time bonus: every N minutes spent in town, up to a daily cap. */
function tickOnline(ws, now) {
  const t = ws.town;
  const player = playerOf(ws);
  if (!t?.channelKey || !player) return;
  const dt = now - (t.lastActiveAt || now);
  t.lastActiveAt = now;
  if (dt <= 0 || dt > ONLINE_TICK_MAX_MS) return;
  const daily = dailyOf(player);
  daily.onlineMs += dt;
  const stepMs = EARN.onlineStepMinutes * 60 * 1000;
  let earned = 0;
  while (daily.onlineMs >= stepMs && daily.onlineEarned + EARN.onlinePerStep <= EARN.onlineDailyCap) {
    daily.onlineMs -= stepMs;
    daily.onlineEarned += EARN.onlinePerStep;
    earned += EARN.onlinePerStep;
  }
  if (daily.onlineEarned >= EARN.onlineDailyCap) daily.onlineMs = 0;
  if (earned) earn(ws, player, earned, "おさんぽボーナス");
}

function capped(daily, field, amount, cap) {
  const room = Math.max(0, cap - daily[field]);
  const got = Math.min(amount, room);
  daily[field] += got;
  return got;
}

// ------------------------------------------------------------ rooms

/** Room editing. Returns "" on success or an error code. The server decides every height (`z`) itself. */
const STAIRS = economy.build.stairs;
const BLOCKS = BLOCK_KINDS;

function tileCoord(v) {
  return Math.floor(Number(v));
}

/** Plots keep whatever is growing in them across edits that rebuild the item list. */
function cropsByTile(room) {
  const map = new Map();
  for (const o of room.items) if (o.kind === "plot" && o.crop) map.set(`${o.x},${o.y}`, o.crop);
  return map;
}

/** Rebuild the room from a list of pieces: only what the player owns, only what stands on something. */
function rebuildItems(room, player, rawItems) {
  const crops = cropsByTile(room);
  const items = [];
  for (const raw of rawItems) {
    const item = sanitizeItem(raw);
    if (!item || !ownsFurniture(player, item.kind)) continue;
    delete item.crop;
    const crop = item.kind === "plot" ? crops.get(`${item.x},${item.y}`) : null;
    if (crop) item.crop = crop;
    items.push(item);
  }
  room.items = settleItems(room.size, items, maxItems(room.size));
}

function rectOf(payload, room) {
  const clamp = (v) => Math.max(0, Math.min(room.size - 1, v));
  const ax = tileCoord(payload.x0);
  const bx = tileCoord(payload.x1);
  const ay = tileCoord(payload.y0);
  const by = tileCoord(payload.y1);
  if (![ax, bx, ay, by].every(Number.isFinite)) return null;
  return { x0: clamp(Math.min(ax, bx)), x1: clamp(Math.max(ax, bx)), y0: clamp(Math.min(ay, by)), y1: clamp(Math.max(ay, by)) };
}

function applyRoomEdit(room, player, payload, now) {
  const op = String(payload.op || "");
  if (op === "place") {
    if (room.items.length >= maxItems(room.size)) return "ROOM_FULL";
    const item = sanitizeItem(payload.item);
    if (!item) return "CANT_PLACE";
    // A freshly placed plot is always empty: crops only come from planting.
    delete item.crop;
    if (!ownsFurniture(player, item.kind)) return "NOT_OWNED";
    delete item.z;
    const z = autoLevel(room, item);
    if (z > 0) item.z = z;
    if (!canPlace(room, item)) return z > MAX_LEVEL - 1 && (BLOCKS.has(item.kind) || STAIRS.includes(item.kind)) ? "TOO_HIGH" : "CANT_PLACE";
    room.items.push(item);
    return "";
  }
  if (op === "remove") {
    const target = itemAt(room, tileCoord(payload.x), tileCoord(payload.y));
    if (!target) return "NOTHING";
    if (hasAbove(room, target)) return "HAS_ABOVE";
    room.items = room.items.filter((o) => o !== target);
    return "";
  }
  if (op === "rotate") {
    const target = itemAt(room, tileCoord(payload.x), tileCoord(payload.y));
    if (!target) return "NOTHING";
    if (STAIRS.includes(target.kind)) {
      const dir = ((target.dir || 0) + 1) % 4;
      const turned = { ...target };
      if (dir) turned.dir = dir;
      else delete turned.dir;
      room.items = room.items.map((o) => (o === target ? turned : o));
      return "";
    }
    if (BLOCKS.has(target.kind)) return "";
    const turned = { ...target, rot: target.rot ? 0 : 1 };
    if (!turned.rot) delete turned.rot;
    if (!canPlace(room, turned, target)) return "CANT_ROTATE";
    room.items = room.items.map((o) => (o === target ? turned : o));
    return "";
  }
  if (op === "recolor") {
    const target = itemAt(room, tileCoord(payload.x), tileCoord(payload.y));
    if (!target) return "NOTHING";
    const color = String(payload.color || "");
    if (!/^#[0-9a-f]{6}$/i.test(color)) return "BAD_OP";
    room.items = room.items.map((o) => (o === target ? { ...o, color: color.toLowerCase() } : o));
    return "";
  }
  if (op === "move") {
    const target = itemAt(room, tileCoord(payload.x), tileCoord(payload.y));
    if (!target) return "NOTHING";
    if (hasAbove(room, target)) return "HAS_ABOVE";
    const moved = { ...target, x: tileCoord(payload.toX), y: tileCoord(payload.toY) };
    if (!Number.isFinite(moved.x) || !Number.isFinite(moved.y)) return "CANT_PLACE";
    const others = { ...room, items: room.items.filter((o) => o !== target) };
    if (!canPlace(others, moved)) return "CANT_PLACE";
    room.items = [...others.items, moved];
    return "";
  }
  if (op === "fill") {
    const base = sanitizeItem({ kind: payload.kind, x: 0, y: 0, color: payload.color, dir: payload.dir });
    if (!base) return "CANT_PLACE";
    const { w, h } = footprint(base);
    if (w !== 1 || h !== 1) return "CANT_PLACE";
    if (!ownsFurniture(player, base.kind)) return "NOT_OWNED";
    const rect = rectOf(payload, room);
    if (!rect) return "BAD_OP";
    let placed = 0;
    let full = false;
    for (let y = rect.y0; y <= rect.y1 && !full; y += 1) {
      for (let x = rect.x0; x <= rect.x1; x += 1) {
        if (room.items.length >= maxItems(room.size)) {
          full = true;
          break;
        }
        const item = { ...base, x, y };
        const z = autoLevel(room, item);
        if (z > 0) item.z = z;
        if (!canPlace(room, item)) continue;
        room.items.push(item);
        placed += 1;
      }
    }
    if (placed === 0) return full ? "ROOM_FULL" : "CANT_PLACE";
    return "";
  }
  if (op === "erase") {
    const rect = rectOf(payload, room);
    if (!rect) return "BAD_OP";
    const inside = (o) => {
      const { w, h } = footprint(o);
      return o.x <= rect.x1 && o.x + w - 1 >= rect.x0 && o.y <= rect.y1 && o.y + h - 1 >= rect.y0;
    };
    const kept = room.items.filter((o) => !inside(o));
    if (kept.length === room.items.length) return "NOTHING";
    // Whatever was resting on the removed blocks goes with them.
    room.items = settleItems(room.size, kept, maxItems(room.size));
    return "";
  }
  if (op === "restore") {
    if (!Array.isArray(payload.items) || payload.items.length > maxItems(room.size)) return "BAD_OP";
    rebuildItems(room, player, payload.items);
    return "";
  }
  if (op === "layout-save") {
    const slot = Math.floor(Number(payload.slot));
    if (!(slot >= 0 && slot < LAYOUT_SLOTS)) return "BAD_OP";
    const layouts = Array.from({ length: LAYOUT_SLOTS }, (_, i) => room.layouts?.[i] || null);
    layouts[slot] = {
      savedAt: now, size: room.size, wall: room.wall, floor: room.floor,
      items: room.items.map((o) => {
        const copy = { ...o };
        delete copy.crop;
        return copy;
      }),
    };
    room.layouts = layouts;
    return "";
  }
  if (op === "layout-load") {
    const slot = Math.floor(Number(payload.slot));
    const layout = slot >= 0 && slot < LAYOUT_SLOTS ? room.layouts?.[slot] : null;
    if (!layout) return "NOTHING";
    // A layout saved before the room was enlarged keeps its place relative to the middle.
    const shift = (room.size - layout.size) / 2;
    rebuildItems(room, player, layout.items.map((o) => ({ ...o, x: o.x + shift, y: o.y + shift })));
    room.wall = layout.wall;
    room.floor = layout.floor;
    return "";
  }
  if (op === "style") {
    if (WALL_STYLES.has(payload.wall)) room.wall = payload.wall;
    if (FLOOR_STYLES.has(payload.floor)) room.floor = payload.floor;
    if (typeof payload.title === "string") room.title = payload.title.replace(/\s+/g, " ").trim().slice(0, 20);
    return "";
  }
  if (op === "clear") {
    room.items = [];
    return "";
  }
  return "BAD_OP";
}

function listRooms(selfPlayerId) {
  return [...rooms.values()]
    .map((room) => ({
      id: room.id, owner: room.owner, title: room.title, size: room.size, count: countIn(`room:${room.id}`),
      items: room.items.length, goodPigg: players.get(room.ownerId)?.goodPigg || 0, updatedAt: room.updatedAt,
      mine: room.ownerId === selfPlayerId,
    }))
    .filter((r) => r.mine || r.items > 0 || r.count > 0)
    .sort((a, b) => Number(b.mine) - Number(a.mine) || b.count - a.count || b.updatedAt - a.updatedAt)
    .slice(0, 40);
}

// ------------------------------------------------------------ shop & scratch

function randomLimitedPrize(player) {
  const pool = [
    ...economy.limitedParts.filter((p) => !player.owned.parts.includes(`${p.key}:${p.id}`)).map((p) => ({ kind: "part", key: p.key, id: p.id, label: p.label })),
    ...economy.limitedFurniture.filter((f) => !player.owned.furniture.includes(f.kind)).map((f) => ({ kind: "furniture", id: f.kind, label: f.label })),
  ];
  return pool.length ? pool[crypto.randomInt(pool.length)] : null;
}

function grantItem(player, item) {
  if (item.kind === "part") player.owned.parts.push(`${item.key}:${item.id}`);
  else player.owned.furniture.push(item.id);
  scheduleSave();
}

function scratchCells(winSymbol) {
  // Three of the winning symbol, the rest never three-of-a-kind.
  const cells = [winSymbol, winSymbol, winSymbol];
  const counts = new Map();
  while (cells.length < 9) {
    const s = SCRATCH_SYMBOLS[crypto.randomInt(SCRATCH_SYMBOLS.length)];
    if (s === winSymbol || (counts.get(s) || 0) >= 2) continue;
    counts.set(s, (counts.get(s) || 0) + 1);
    cells.push(s);
  }
  for (let i = cells.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(i + 1);
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  return cells;
}

function handleScratch(ws, player) {
  const price = economy.scratch.price;
  if (player.ame < price) return send(ws, { type: "town-error", code: "NOT_ENOUGH_AME" });
  addAme(player, -price);
  const prizes = economy.scratch.prizes;
  let roll = crypto.randomInt(prizes.reduce((s, p) => s + p.weight, 0));
  let prize = prizes[prizes.length - 1];
  for (const p of prizes) {
    if (roll < p.weight) {
      prize = p;
      break;
    }
    roll -= p.weight;
  }
  let result;
  if (prize.type === "item") {
    const item = randomLimitedPrize(player);
    if (item) {
      grantItem(player, item);
      result = { type: "item", item, symbol: "🎁" };
    } else {
      // Everything already owned: pay out the top アメ prize instead.
      addAme(player, 150);
      result = { type: "ame", amount: 150, symbol: "💎" };
    }
  } else {
    addAme(player, prize.amount);
    const symbol = { 150: "💎", 80: "⭐", 40: "🍀", 20: "🌸" }[prize.amount] || "🍬";
    result = { type: "ame", amount: prize.amount, symbol };
  }
  send(ws, { type: "town-scratch", cells: scratchCells(result.symbol), prize: result, ame: player.ame });
  sendWallet(ws);
}

function handleBuy(ws, player, payload) {
  const what = String(payload.what || "");
  const spend = (price) => {
    if (player.ame < price) {
      send(ws, { type: "town-error", code: "NOT_ENOUGH_AME" });
      return false;
    }
    addAme(player, -price);
    return true;
  };
  if (what === "part") {
    const key = `${payload.key}:${payload.id}`;
    const part = LIMITED_PARTS.get(key);
    // Point-shop parts are sold for fishing points / casino coins (town-shop-buy), not アメ.
    if (!part || part.shop || player.owned.parts.includes(key)) return;
    if (!spend(part.price)) return;
    grantItem(player, { kind: "part", key: part.key, id: part.id });
    send(ws, { type: "town-bought", label: part.label });
  } else if (what === "furniture") {
    const item = LIMITED_FURNITURE.get(String(payload.id));
    if (!item || item.shop || player.owned.furniture.includes(item.kind)) return;
    if (!spend(item.price)) return;
    grantItem(player, { kind: "furniture", id: item.kind });
    send(ws, { type: "town-bought", label: item.label });
  } else if (what === "expand") {
    const room = rooms.get(String(payload.roomId));
    if (!room || room.ownerId !== player.id) return;
    const next = ROOM_SIZES[ROOM_SIZES.indexOf(room.size) + 1];
    if (!next) return;
    if (!spend(economy.rooms.expandCost[String(next)])) return;
    // Grow toward the back-left so furniture keeps its place; the door moves with the front edge.
    const shift = next - room.size;
    room.items = room.items.map((o) => ({ ...o, x: o.x + shift / 2, y: o.y + shift / 2 }));
    room.size = next;
    room.items = sanitizeRoom(room).items;
    room.updatedAt = nowTs();
    scheduleSave();
    broadcastRoom(room);
    send(ws, { type: "town-bought", label: `へやを${next}×${next}に拡張` });
  } else if (what === "room") {
    const cost = economy.rooms.slotCost[player.rooms.length];
    if (cost === undefined) return send(ws, { type: "town-error", code: "ROOM_LIMIT" });
    if (!spend(cost)) return;
    const room = sanitizeRoom({ id: newRoomId(), ownerId: player.id, owner: player.name, title: `${player.name}のへや${player.rooms.length + 1}` });
    rooms.set(room.id, room);
    player.rooms.push(room.id);
    scheduleSave();
    send(ws, { type: "town-bought", label: "あたらしいへや", roomId: room.id });
  } else {
    return;
  }
  sendWallet(ws);
}

// ------------------------------------------------------------ fishing

function pickFish(bait, area) {
  const rare = bait?.rare ?? 1;
  const boost = { common: 1, uncommon: rare, rare: rare ** 1.5, legend: rare ** 2 };
  const favor = bait?.favor ?? [];
  const habitat = HABITAT_OF[area] || "sea";
  const pool = economy.fishing.fish.filter((f) => (f.habitat || "sea") === habitat).map((f) => ({ fish: f, weight: f.weight * (boost[f.rarity] ?? 1) * (favor.includes(f.id) ? 3 : 1) }));
  const total = pool.reduce((s, p) => s + p.weight, 0);
  let roll = Math.random() * total;
  for (const p of pool) {
    if (roll < p.weight) return p.fish;
    roll -= p.weight;
  }
  return pool[0].fish;
}

function atFishingSpot(area, t) {
  return (FISHING_SPOTS[area] || []).some(([x, y]) => x === t.x && y === t.y);
}

function handleFishCast(ws, t, player, area, now) {
  if (!atFishingSpot(area, t)) return send(ws, { type: "town-error", code: "NOT_FISHING_SPOT" });
  if (now - (t.lastCastAt || 0) < FISH_CAST_MIN_INTERVAL_MS) return send(ws, { type: "town-error", code: "BUSY" });
  t.lastCastAt = now;
  const gear = player.fishing;
  let bait = null;
  if (gear.bait !== "none" && gear.baits[gear.bait] > 0) {
    bait = BAITS.get(gear.bait);
    gear.baits[gear.bait] -= 1;
    if (gear.baits[gear.bait] <= 0) {
      delete gear.baits[gear.bait];
      gear.bait = "none";
    }
    scheduleSave();
  }
  const fish = pickFish(bait, area);
  const biteMs = Math.round((1800 + Math.random() * 3400) * (bait?.bite ?? 1));
  const castId = crypto.randomBytes(6).toString("hex");
  t.fishCast = { castId, fish, castAt: now, biteAt: now + biteMs, rod: gear.rod };
  send(ws, {
    type: "town-fish-cast", castId, biteMs, rod: gear.rod, bait: bait?.id ?? "none",
    // Only how the fish fights is revealed up front; which fish it is comes with the catch.
    power: fish.power, speed: fish.speed, rarity: fish.rarity, frame: fish.frame ?? 1,
  });
  sendWallet(ws);
}

function handleFishResult(ws, t, player, payload, now) {
  const cast = t.fishCast;
  if (!cast || cast.castId !== String(payload.castId || "")) return;
  t.fishCast = null;
  const fish = cast.fish;
  const tooEarly = now < cast.biteAt + economy.fishing.minReelMs;
  const tooLate = now > cast.castAt + economy.fishing.castTimeoutMs;
  if (!payload.caught || tooEarly || tooLate) {
    send(ws, { type: "town-fish-escaped" });
    return;
  }
  const perfect = Math.max(0, Math.min(1, Number(payload.perfect) || 0));
  const [minCm, maxCm] = fish.cm;
  const sizeRatio = Math.random() ** (1.6 - perfect * 1.2);
  const cm = Math.round((minCm + (maxCm - minCm) * sizeRatio) * 10) / 10;
  const points = Math.max(1, Math.round(fish.points * (1 + perfect * 0.5) * (0.8 + sizeRatio * 0.4)));
  player.fishPoints += points;
  const entry = player.fishLog[fish.id] || { count: 0, best: 0 };
  const isRecord = cm > entry.best;
  player.fishLog[fish.id] = { count: entry.count + 1, best: Math.max(entry.best, cm) };
  bump(player, "fish");
  if (fish.rarity !== "common") bump(player, "fishRare");
  scheduleSave();
  send(ws, {
    type: "town-fish-caught",
    fish: { id: fish.id, label: fish.label, emoji: fish.emoji, rarity: fish.rarity },
    cm, points, perfect, isRecord, fishPoints: player.fishPoints,
  });
  sendWallet(ws);
  if (fish.rarity === "rare" || fish.rarity === "legend") {
    broadcast(t.channelKey, { type: "town-fish-news", name: t.name, label: fish.label, emoji: fish.emoji, cm, rarity: fish.rarity }, ws);
  }
}

function handleFishGear(ws, player, payload) {
  const gear = player.fishing;
  const rod = String(payload.rod || "");
  if (rod && gear.rods.includes(rod)) gear.rod = rod;
  const bait = String(payload.bait || "");
  if (bait === "none" || (bait && gear.baits[bait] > 0)) gear.bait = bait;
  scheduleSave();
  sendWallet(ws);
}

// ------------------------------------------------------------ point shops

/**
 * Fishing-shop prices are paid in fishing points here. Casino coins live in the browser (shared with the
 * arcade games), so for the casino shop the client deducts the coins itself after `town-shop-bought`.
 */
function handleShopBuy(ws, player, payload) {
  const entry = POINT_SHOP.get(String(payload.id || ""));
  if (!entry) return;
  const owned =
    (entry.key && entry.part && player.owned.parts.includes(`${entry.key}:${entry.part}`))
    || (entry.furniture && player.owned.furniture.includes(entry.furniture))
    || (entry.rod && player.fishing.rods.includes(entry.rod));
  if (owned) return send(ws, { type: "town-error", code: "ALREADY_OWNED" });
  if (entry.shop === "fishing") {
    if (player.fishPoints < entry.price) return send(ws, { type: "town-error", code: "NOT_ENOUGH_FISH" });
    player.fishPoints -= entry.price;
  }
  if (entry.key && entry.part) player.owned.parts.push(`${entry.key}:${entry.part}`);
  else if (entry.furniture) player.owned.furniture.push(entry.furniture);
  else if (entry.rod) player.fishing.rods.push(entry.rod);
  else if (entry.bait) player.fishing.baits[entry.bait] = Math.min(STACK_MAX, (player.fishing.baits[entry.bait] || 0) + (entry.pack || 1));
  else if (entry.item) player.items[entry.item] = Math.min(STACK_MAX, (player.items[entry.item] || 0) + (entry.pack || 1));
  scheduleSave();
  send(ws, { type: "town-shop-bought", id: entry.id, label: entry.label, shop: entry.shop, price: entry.price });
  sendWallet(ws);
}

/** Casino items are spent one at a time, confirmed back to the game that asked (`req`). */
function handleItemUse(ws, player, payload) {
  const id = String(payload.id || "");
  const req = String(payload.req || "").slice(0, 32);
  const ok = CASINO_ITEMS.has(id) && (player.items[id] || 0) > 0;
  if (ok) {
    player.items[id] -= 1;
    if (player.items[id] <= 0) delete player.items[id];
    scheduleSave();
  }
  send(ws, { type: "town-item-used", id, req, ok });
  if (ok) sendWallet(ws);
}

// ------------------------------------------------------------ pets

const PETS = economy.pets;

function petOf(player, id) {
  return player.pets.find((p) => p.id === String(id || "")) || null;
}

function announcePet(ws) {
  const t = ws.town;
  if (t?.channelKey) broadcast(t.channelKey, { type: "town-member-updated", member: publicMember(ws) }, ws);
}

function petReply(ws, player, payload) {
  send(ws, { type: "town-pet-done", ...payload });
  sendWallet(ws);
  scheduleSave();
}

function handlePetBuy(ws, player, payload) {
  const species = PET_SPECIES.get(String(payload.species || ""));
  if (!species) return;
  if (player.pets.length >= PETS.max) return send(ws, { type: "town-error", code: "PET_LIMIT" });
  if (player.ame < species.price) return send(ws, { type: "town-error", code: "NOT_ENOUGH_AME" });
  addAme(player, -species.price);
  const pet = {
    id: crypto.randomBytes(6).toString("hex"), species: species.id, name: normalizePetName(payload.name, species.id),
    bond: 0, fedAt: nowTs(), pattedAt: 0,
  };
  player.pets.push(pet);
  if (!player.activePet) player.activePet = pet.id;
  petReply(ws, player, { op: "buy", id: pet.id, label: `${species.emoji} ${pet.name}` });
  announcePet(ws);
}

function handlePetActive(ws, player, payload) {
  const id = String(payload.id || "");
  if (id && !petOf(player, id)) return;
  player.activePet = id;
  petReply(ws, player, { op: "active", id });
  announcePet(ws);
}

function handlePetRename(ws, player, payload) {
  const pet = petOf(player, payload.id);
  if (!pet) return;
  pet.name = normalizePetName(payload.name, pet.species);
  petReply(ws, player, { op: "rename", id: pet.id, label: pet.name });
  announcePet(ws);
}

function handlePetPat(ws, player, payload, now) {
  const pet = petOf(player, payload.id);
  if (!pet) return;
  if (now - (pet.pattedAt || 0) < PETS.petCooldownMs) return send(ws, { type: "town-error", code: "PET_BUSY" });
  pet.pattedAt = now;
  const daily = dailyOf(player);
  const hungry = petHunger(pet, now) >= 80;
  let gain = 0;
  if (!hungry && pet.bond < 100) {
    gain = Math.min(PETS.petBond, 100 - pet.bond, Math.max(0, PETS.petBondDailyCap - daily.petBond));
    pet.bond += gain;
    daily.petBond += gain;
  }
  bump(player, "pat");
  petReply(ws, player, { op: "pat", id: pet.id, gain, hungry, capped: !hungry && gain === 0 && pet.bond < 100 });
  announcePet(ws);
}

function handlePetFeed(ws, player, payload, now) {
  const pet = petOf(player, payload.id);
  if (!pet) return;
  const food = String(payload.food || "");
  let value = 0;
  if (food === "petfood") {
    if (player.petFood <= 0) return send(ws, { type: "town-error", code: "NO_FOOD" });
    value = PETS.foodValue;
  } else if (CROPS.has(food)) {
    if ((player.goods[food] || 0) <= 0) return send(ws, { type: "town-error", code: "NO_FOOD" });
    value = CROPS.get(food).feed;
  } else {
    return;
  }
  const hunger = petHunger(pet, now);
  // Not hungry enough: nothing is eaten, so food is never wasted.
  if (hunger < PETS.feedMinHunger) return send(ws, { type: "town-error", code: "NOT_HUNGRY" });
  if (food === "petfood") player.petFood -= 1;
  else {
    player.goods[food] -= 1;
    if (player.goods[food] <= 0) delete player.goods[food];
  }
  const newHunger = Math.max(0, hunger - value);
  pet.fedAt = now - Math.round((newHunger / 100) * PETS.hungerFullMs);
  const gain = Math.min(PETS.feedBond, 100 - pet.bond);
  pet.bond += gain;
  bump(player, "feed");
  petReply(ws, player, { op: "feed", id: pet.id, gain, hungerBefore: hunger, hungerAfter: newHunger });
  announcePet(ws);
}

// ------------------------------------------------------------ garden

const GARDEN = economy.garden;

function plotAt(area, x, y) {
  const room = rooms.get(roomIdOfArea(area));
  if (!room) return { room: null, item: null };
  const item = room.items.find((o) => o.kind === "plot" && o.x === Math.floor(Number(x)) && o.y === Math.floor(Number(y)));
  return { room, item: item || null };
}

function gardenDone(ws, payload) {
  send(ws, { type: "town-garden-done", ...payload });
  sendWallet(ws);
  scheduleSave();
}

function handleSeedBuy(ws, player, payload) {
  const crop = CROPS.get(String(payload.id || ""));
  const count = [1, 5, 10].includes(Number(payload.count)) ? Number(payload.count) : 1;
  if (!crop) return;
  const price = crop.seedPrice * count;
  if (player.ame < price) return send(ws, { type: "town-error", code: "NOT_ENOUGH_AME" });
  addAme(player, -price);
  player.seeds[crop.id] = Math.min(9999, (player.seeds[crop.id] || 0) + count);
  gardenDone(ws, { op: "seed", label: `${crop.emoji} ${crop.label}のたね ×${count}` });
}

function handleFoodBuy(ws, player, payload) {
  const count = [1, 5, 10].includes(Number(payload.count)) ? Number(payload.count) : 1;
  const price = PETS.foodPrice * count;
  if (player.ame < price) return send(ws, { type: "town-error", code: "NOT_ENOUGH_AME" });
  addAme(player, -price);
  player.petFood = Math.min(9999, player.petFood + count);
  gardenDone(ws, { op: "food", label: `🍖 ペットフード ×${count}` });
}

function handleGoodsSell(ws, player, payload) {
  const crop = CROPS.get(String(payload.id || ""));
  if (!crop) return;
  const have = player.goods[crop.id] || 0;
  const count = payload.all ? have : Math.min(have, Math.max(0, Math.floor(Number(payload.count) || 0)));
  if (count <= 0) return send(ws, { type: "town-error", code: "NO_GOODS" });
  player.goods[crop.id] -= count;
  if (player.goods[crop.id] <= 0) delete player.goods[crop.id];
  const total = crop.sell * count;
  addAme(player, total);
  bump(player, "sell");
  send(ws, { type: "town-ame", delta: total, reason: `${crop.label}を売った`, ame: player.ame });
  gardenDone(ws, { op: "sell", label: `${crop.emoji} ${crop.label} ×${count}`, total });
}

function handlePlant(ws, t, player, area, payload) {
  const { room, item } = plotAt(area, payload.x, payload.y);
  if (!room || !item) return send(ws, { type: "town-error", code: "NO_PLOT" });
  if (room.ownerId !== player.id) return send(ws, { type: "town-error", code: "NOT_OWNER" });
  const crop = CROPS.get(String(payload.crop || ""));
  if (!crop) return;
  if (item.crop) return send(ws, { type: "town-error", code: "PLOT_BUSY" });
  if ((player.seeds[crop.id] || 0) <= 0) return send(ws, { type: "town-error", code: "NO_SEED" });
  player.seeds[crop.id] -= 1;
  if (player.seeds[crop.id] <= 0) delete player.seeds[crop.id];
  const now = nowTs();
  item.crop = { id: crop.id, plantedAt: now, readyAt: now + crop.growMs, waters: 0, lastWaterAt: 0 };
  room.updatedAt = now;
  broadcastRoom(room);
  bump(player, "plant");
  gardenDone(ws, { op: "plant", label: `${crop.emoji} ${crop.label}` });
}

function handleWater(ws, t, player, area, payload, now) {
  const { room, item } = plotAt(area, payload.x, payload.y);
  if (!room || !item) return send(ws, { type: "town-error", code: "NO_PLOT" });
  const crop = item.crop;
  if (!crop) return send(ws, { type: "town-error", code: "PLOT_EMPTY" });
  if (now >= crop.readyAt) return send(ws, { type: "town-error", code: "ALREADY_RIPE" });
  if (crop.waters >= GARDEN.maxWater) return send(ws, { type: "town-error", code: "WATER_MAX" });
  if (now - crop.lastWaterAt < GARDEN.waterCooldownMs) {
    return send(ws, { type: "town-error", code: "WATER_WAIT", waitMs: GARDEN.waterCooldownMs - (now - crop.lastWaterAt) });
  }
  crop.waters += 1;
  crop.lastWaterAt = now;
  crop.readyAt = crop.plantedAt + Math.round(CROPS.get(crop.id).growMs * (1 - GARDEN.waterSpeedup * crop.waters));
  room.updatedAt = now;
  broadcastRoom(room);
  bump(player, "water");
  gardenDone(ws, { op: "water", label: `${CROPS.get(crop.id).emoji} みずやり ${crop.waters}/${GARDEN.maxWater}` });
  // Watering a friend's garden is a favour: a small アメ thank-you, capped per day.
  if (room.ownerId !== player.id) {
    const got = capped(dailyOf(player), "waterAme", GARDEN.visitorWaterAme, GARDEN.visitorWaterDailyCap);
    earn(ws, player, got, "みずやりボーナス");
  }
}

function handleHarvest(ws, t, player, area, payload, now) {
  const { room, item } = plotAt(area, payload.x, payload.y);
  if (!room || !item) return send(ws, { type: "town-error", code: "NO_PLOT" });
  if (room.ownerId !== player.id) return send(ws, { type: "town-error", code: "NOT_OWNER" });
  const crop = item.crop;
  if (!crop) return send(ws, { type: "town-error", code: "PLOT_EMPTY" });
  if (now < crop.readyAt) return send(ws, { type: "town-error", code: "NOT_RIPE" });
  const def = CROPS.get(crop.id);
  const [lo, hi] = def.yield;
  const amount = lo + crypto.randomInt(hi - lo + 1);
  player.goods[def.id] = Math.min(9999, (player.goods[def.id] || 0) + amount);
  delete item.crop;
  room.updatedAt = now;
  broadcastRoom(room);
  bump(player, "harvest");
  gardenDone(ws, { op: "harvest", label: `${def.emoji} ${def.label} ×${amount}`, amount });
}

// ------------------------------------------------------------ join

/**
 * `verified` is null for guests, or { userId, friendId } once the cloud API has confirmed the
 * login (see verifyCloud). Only verified joins get an account-linked player record.
 */
function handleJoin(ws, payload, verified = null) {
  if (!ws.town) {
    ws.town = {
      id: crypto.randomBytes(6).toString("hex"),
      name: "ゲスト",
      avatar: {},
      x: 0,
      y: 0,
      channelKey: null,
      clientKey: "",
      playerId: "",
      chatTimes: [],
      lastChatText: "",
      lastChatAt: 0,
      lastActionAt: 0,
      lastMoveAt: 0,
      lastEditAt: 0,
      lastShopAt: 0,
      lastActiveAt: 0,
      lastWhereAt: 0,
      friendId: "",
      cloudKey: "",
      shareLocation: true,
      praised: new Map(),
    };
  }
  const t = ws.town;
  leaveChannel(ws);
  t.fishCast = null;

  const clientKey = normalizeClientKey(payload.clientKey);
  if (clientKey) {
    const previous = socketsByClientKey.get(clientKey);
    if (previous && previous !== ws) {
      leaveChannel(previous);
      send(previous, { type: "town-replaced" });
      if (previous.town) previous.town.clientKey = "";
    }
    t.clientKey = clientKey;
    t.cloudKey = verified ? cloudKeyOf(verified.userId) : "";
    t.playerId = resolvePlayerId(clientKey, t.cloudKey);
    socketsByClientKey.set(clientKey, ws);
  }

  // A verified account's saved look wins over whatever this browser remembers.
  const stored = verified && t.playerId ? players.get(t.playerId)?.profile : null;
  t.name = normalizeName(stored ? stored.name : payload.name);
  t.friendId = verified ? normalizeFriendId(verified.friendId) : "";
  t.shareLocation = payload.shareLocation !== false;
  const player = t.playerId ? ensurePlayer(t.playerId, t.name) : null;
  if (player && verified) bindCloud(player, t.cloudKey);
  t.avatar = normalizeAvatar(stored ? stored.avatar : payload.avatar, player);
  if (player && verified && !stored) {
    player.profile = { name: t.name, avatar: t.avatar };
    scheduleSave();
  }

  const requestedArea = String(payload.area || "");
  // "home" = wherever this browser's own room is (used right after login).
  const wantsHome = requestedArea === "home";
  let area = wantsHome ? (player?.rooms[0] ? `room:${player.rooms[0]}` : DEFAULT_AREA) : requestedArea;
  const roomId = roomIdOfArea(area);
  let room = null;
  if (roomId) {
    room = rooms.get(roomId) || null;
    if (!room) {
      send(ws, { type: "town-error", code: "NO_ROOM" });
      area = DEFAULT_AREA;
    }
  } else if (!Object.prototype.hasOwnProperty.call(AREAS, area)) {
    area = DEFAULT_AREA;
  }

  const spawn = Array.isArray(payload.spawn) && !wantsHome ? payload.spawn : areaSize(area).spawn;
  [t.x, t.y] = clampTile(area, spawn[0], spawn[1]);

  const { key, number } = pickChannel(area, Math.floor(Number(payload.channel)));
  if (!channels.has(key)) channels.set(key, new Set());
  const members = channels.get(key);
  members.add(ws);
  t.channelKey = key;
  t.lastActiveAt = nowTs();

  send(ws, {
    type: "town-welcome",
    selfId: t.id,
    selfRoomId: player?.rooms[0] || "",
    requestedArea,
    area,
    channel: number,
    self: publicMember(ws),
    members: [...members].filter((m) => m !== ws).map(publicMember),
    areaCounts: areaCounts(),
    room: room && roomIdOfArea(area) ? publicRoom(room) : null,
    wallet: player ? walletOf(player) : null,
    // Sent only for logged-in players: their saved name + look, so a new device matches.
    profile: player && verified ? { name: t.name, avatar: t.avatar } : null,
    cloud: Boolean(verified),
  });
  broadcast(key, { type: "town-member-joined", member: publicMember(ws) }, ws);

  if (!player) return;
  const daily = dailyOf(player);
  if (!daily.login) {
    daily.login = true;
    earn(ws, player, EARN.login, "ログインボーナス");
  }
  // Casino coins live in the browser (shared with the arcade games), so the server only decides
  // "once per account per day" and tells the client how many to add.
  const companion = player.activePet ? player.pets.find((p) => p.id === player.activePet) : null;
  if (companion && !daily.petGift && petLevel(companion) >= 1) {
    daily.petGift = true;
    earn(ws, player, PETS.giftPerLevel * petLevel(companion), `${companion.name}からのおくりもの`);
  }
  if (!daily.coinLogin) {
    daily.coinLogin = true;
    scheduleSave();
    send(ws, { type: "town-coins", delta: EARN.loginCoins, reason: "ログインボーナス" });
    sendWallet(ws);
  }
  if (room && room.ownerId !== player.id && !daily.visits.includes(room.id)) {
    daily.visits.push(room.id);
    bump(player, "visit");
    if (daily.visits.length * EARN.visitRoom <= EARN.visitRoomDailyCap) earn(ws, player, EARN.visitRoom, "へや訪問ボーナス");
    else scheduleSave();
  }
}

// ------------------------------------------------------------ cloud login check

const CLOUD_API = (process.env.TOWN_CLOUD_API || "http://127.0.0.1:8787").replace(/\/+$/, "");
const AUTH_CACHE_MS = 5 * 60 * 1000;
const AUTH_TIMEOUT_MS = 4000;
const AUTH_MAX_FAILS = 6;
const AUTH_FAIL_WINDOW_MS = 60 * 1000;
/** sha256(userId|password|sessionId) -> { userId, friendId, at }. Only the hash is kept, never the password. */
const authCache = new Map();

function authKey(auth) {
  return crypto.createHash("sha256").update(`${auth.userId}\n${auth.password}\n${auth.sessionId}`).digest("hex");
}

function readAuth(raw) {
  if (!raw || typeof raw !== "object") return null;
  const userId = String(raw.userId || "").trim();
  const password = String(raw.password || "");
  const sessionId = String(raw.sessionId || "").trim();
  if (!userId || !password || !sessionId || userId.length > 24 || password.length > 128 || sessionId.length > 64) return null;
  return { userId, password, sessionId };
}

/**
 * Ask the cloud API (the same one the arcade logs in with) whether these credentials + session are valid.
 * Returns { userId, friendId } or null. Failed attempts are rate limited per socket so this can't be
 * used to guess passwords quickly.
 */
async function verifyCloud(ws, raw) {
  const auth = readAuth(raw);
  if (!auth) return null;
  const key = authKey(auth);
  const cached = authCache.get(key);
  if (cached && nowTs() - cached.at < AUTH_CACHE_MS) return { userId: cached.userId, friendId: cached.friendId };

  const now = nowTs();
  ws.townAuthFails = (ws.townAuthFails || []).filter((ts) => now - ts < AUTH_FAIL_WINDOW_MS);
  if (ws.townAuthFails.length >= AUTH_MAX_FAILS) return null;
  try {
    const res = await fetch(`${CLOUD_API}/api/auth/ping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(auth),
      signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.ok === true) {
      const result = { userId: auth.userId, friendId: normalizeFriendId(data.friendId) };
      authCache.set(key, { ...result, at: nowTs() });
      return result;
    }
    if (res.status >= 400 && res.status < 500) ws.townAuthFails.push(nowTs());
  } catch (error) {
    console.warn("[town] cloud login check failed:", error?.message || error);
  }
  return null;
}

setInterval(() => {
  const cutoff = nowTs() - AUTH_CACHE_MS;
  for (const [key, entry] of authCache.entries()) if (entry.at < cutoff) authCache.delete(key);
}, AUTH_CACHE_MS).unref();

async function joinWithAuth(ws, payload) {
  // A newer join supersedes one still waiting on the cloud API.
  const seq = (ws.townJoinSeq = (ws.townJoinSeq || 0) + 1);
  let verified = null;
  if (payload.auth) {
    verified = await verifyCloud(ws, payload.auth);
    if (ws.townJoinSeq !== seq || ws.readyState !== WebSocket.OPEN) return;
  }
  // The town is for logged-in accounts only: no valid login, no entry (and no avatar left behind).
  if (!verified) {
    leaveChannel(ws);
    send(ws, { type: "town-error", code: payload.auth ? "AUTH_FAILED" : "LOGIN_REQUIRED" });
    return;
  }
  handleJoin(ws, payload, verified);
}

/** Saved look of a logged-in account, for a device that has none yet. */
async function sendCloudProfile(ws, payload) {
  const verified = await verifyCloud(ws, payload.auth);
  let profile = null;
  if (verified) {
    const linked = players.get(linkedPlayerId(cloudKeyOf(verified.userId)));
    profile = linked?.profile ?? null;
  }
  send(ws, { type: "town-profile", ok: Boolean(verified), profile });
}

// ------------------------------------------------------------ messages

/**
 * Handle a town-* message. Returns true when the message was consumed.
 */
export function handleTownMessage(ws, payload) {
  const type = String(payload?.type || "");
  if (!type.startsWith("town-")) return false;
  const now = nowTs();
  ws.townSeenAt = now;

  if (type === "town-join") {
    void joinWithAuth(ws, payload);
    return true;
  }
  if (type === "town-profile") {
    void sendCloudProfile(ws, payload);
    return true;
  }
  if (type === "town-areas") {
    send(ws, { type: "town-areas", areaCounts: areaCounts() });
    return true;
  }
  if (type === "town-rooms") {
    send(ws, { type: "town-rooms", rooms: listRooms(ws.town?.playerId || "") });
    return true;
  }

  const t = ws.town;
  if (!t || !t.channelKey) return true;
  tickOnline(ws, now);
  const area = areaOfChannel(t.channelKey);
  const player = playerOf(ws);

  if (type === "town-move") {
    if (now - t.lastMoveAt < MOVE_MIN_INTERVAL_MS) return true;
    t.lastMoveAt = now;
    [t.x, t.y] = clampTile(area, payload.x, payload.y);
    broadcast(t.channelKey, { type: "town-member-moved", id: t.id, x: t.x, y: t.y }, ws);
    return true;
  }
  if (type === "town-chat") {
    const text = String(payload.text || "").replace(/\s+/g, " ").trim().slice(0, CHAT_MAX_LENGTH);
    if (!text) return true;
    const rateError = checkChatRate(t, text);
    if (rateError) {
      send(ws, { type: "town-error", code: rateError });
      return true;
    }
    broadcast(t.channelKey, { type: "town-chat", id: t.id, name: t.name, text, at: now });
    if (player) bump(player, "chat");
    return true;
  }
  if (type === "town-action" || type === "town-emote") {
    const action = String(payload.action || payload.emote || "");
    if (!ACTIONS.has(action) || now - t.lastActionAt < ACTION_MIN_INTERVAL_MS) return true;
    t.lastActionAt = now;
    broadcast(t.channelKey, { type: "town-action", id: t.id, action }, ws);
    return true;
  }
  if (type === "town-goodpigg") {
    const targetId = String(payload.to || "");
    const members = channels.get(t.channelKey) || new Set();
    const target = [...members].find((m) => m.town?.id === targetId);
    const targetPlayer = target ? playerOf(target) : null;
    if (!target || target === ws || !targetPlayer || targetPlayer === player) return true;
    const last = t.praised.get(targetId) || 0;
    if (now - last < GOOD_PIGG_COOLDOWN_MS) {
      send(ws, { type: "town-error", code: "GOOD_PIGG_COOLDOWN" });
      return true;
    }
    t.praised.set(targetId, now);
    targetPlayer.goodPigg += 1;
    scheduleSave();
    broadcast(t.channelKey, {
      type: "town-goodpigg", from: t.id, fromName: t.name, to: targetId, toName: target.town.name, count: targetPlayer.goodPigg,
    });
    const recv = capped(dailyOf(targetPlayer), "praiseReceived", EARN.praiseReceived, EARN.praiseReceivedDailyCap);
    earn(target, targetPlayer, recv, "グッピグされた");
    if (player) {
      bump(player, "praise");
      const gave = capped(dailyOf(player), "praiseGiven", EARN.praiseGiven, EARN.praiseGivenDailyCap);
      earn(ws, player, gave, "グッピグした");
    }
    return true;
  }
  if (type === "town-where") {
    if (now - t.lastWhereAt < WHERE_MIN_INTERVAL_MS) return true;
    t.lastWhereAt = now;
    const wanted = new Set(
      (Array.isArray(payload.ids) ? payload.ids : []).slice(0, WHERE_MAX_IDS).map(normalizeFriendId).filter(Boolean),
    );
    const found = [];
    for (const [key, members] of channels.entries()) {
      for (const member of members) {
        const mt = member.town;
        if (!mt?.friendId || !mt.shareLocation || !wanted.has(mt.friendId)) continue;
        found.push({ friendId: mt.friendId, area: areaOfChannel(key), channel: Number(key.split("#")[1]) || 1 });
      }
    }
    send(ws, { type: "town-where", found });
    return true;
  }
  if (type === "town-update") {
    if ("shareLocation" in payload) t.shareLocation = payload.shareLocation !== false;
    t.name = normalizeName(payload.name);
    const nextAvatar = normalizeAvatar(payload.avatar, player);
    const changed = JSON.stringify(nextAvatar) !== JSON.stringify(t.avatar);
    t.avatar = nextAvatar;
    if (player) ensurePlayer(player.id, t.name);
    if (player && t.cloudKey) {
      player.profile = { name: t.name, avatar: t.avatar };
      scheduleSave();
    }
    broadcast(t.channelKey, { type: "town-member-updated", member: publicMember(ws) }, ws);
    if (player && changed) {
      const daily = dailyOf(player);
      if (!daily.dress) {
        daily.dress = true;
        bump(player, "dress");
        earn(ws, player, EARN.dress, "きせかえボーナス");
      }
    }
    return true;
  }
  if (type === "town-wallet") {
    sendWallet(ws);
    return true;
  }
  if (type === "town-mission-claim" || type === "town-mission-bonus" || type === "town-ach-claim") {
    if (!player) return true;
    if (now - t.lastShopAt < SHOP_MIN_INTERVAL_MS) {
      send(ws, { type: "town-error", code: "BUSY" });
      return true;
    }
    t.lastShopAt = now;
    const id = String(payload.id || "").slice(0, 32);
    const reward = type === "town-mission-claim" ? claimMission(player, id) : type === "town-mission-bonus" ? claimMissionBonus(player) : claimAchievement(player, id);
    if (reward > 0) {
      const reason = type === "town-ach-claim" ? "じっせき達成" : type === "town-mission-bonus" ? "ミッション全達成ボーナス" : "ミッション達成";
      earn(ws, player, reward, reason);
    } else {
      send(ws, { type: "town-error", code: "NOT_READY" });
    }
    return true;
  }
  if (type === "town-scratch" || type === "town-buy") {
    if (!player) return true;
    if (now - t.lastShopAt < SHOP_MIN_INTERVAL_MS) {
      send(ws, { type: "town-error", code: "BUSY" });
      return true;
    }
    t.lastShopAt = now;
    if (type === "town-scratch") handleScratch(ws, player);
    else handleBuy(ws, player, payload);
    return true;
  }
  if (type === "town-fish-cast" || type === "town-fish-result" || type === "town-fish-gear" || type === "town-shop-buy" || type === "town-item-use") {
    if (!player) return true;
    if (type === "town-fish-cast") handleFishCast(ws, t, player, area, now);
    else if (type === "town-fish-result") handleFishResult(ws, t, player, payload, now);
    else if (type === "town-fish-gear") handleFishGear(ws, player, payload);
    else if (type === "town-item-use") handleItemUse(ws, player, payload);
    else {
      if (now - t.lastShopAt < SHOP_MIN_INTERVAL_MS) return send(ws, { type: "town-error", code: "BUSY" }), true;
      t.lastShopAt = now;
      handleShopBuy(ws, player, payload);
    }
    return true;
  }
  if (type.startsWith("town-pet-") || type.startsWith("town-garden-")) {
    if (!player) return true;
    if (now - t.lastShopAt < 120) return send(ws, { type: "town-error", code: "BUSY" }), true;
    t.lastShopAt = now;
    switch (type) {
      case "town-pet-buy": handlePetBuy(ws, player, payload); break;
      case "town-pet-active": handlePetActive(ws, player, payload); break;
      case "town-pet-rename": handlePetRename(ws, player, payload); break;
      case "town-pet-pat": handlePetPat(ws, player, payload, now); break;
      case "town-pet-feed": handlePetFeed(ws, player, payload, now); break;
      case "town-garden-seed": handleSeedBuy(ws, player, payload); break;
      case "town-garden-food": handleFoodBuy(ws, player, payload); break;
      case "town-garden-sell": handleGoodsSell(ws, player, payload); break;
      case "town-garden-plant": handlePlant(ws, t, player, area, payload); break;
      case "town-garden-water": handleWater(ws, t, player, area, payload, now); break;
      case "town-garden-harvest": handleHarvest(ws, t, player, area, payload, now); break;
      default: break;
    }
    return true;
  }
  if (type === "town-room-edit") {
    const room = rooms.get(roomIdOfArea(area));
    if (!room || !player || room.ownerId !== player.id) {
      send(ws, { type: "town-error", code: "NOT_OWNER" });
      return true;
    }
    if (now - t.lastEditAt < EDIT_MIN_INTERVAL_MS) return true;
    t.lastEditAt = now;
    const error = applyRoomEdit(room, player, payload, now);
    if (error) {
      send(ws, { type: "town-error", code: error });
      return true;
    }
    room.updatedAt = now;
    scheduleSave();
    broadcastRoom(room);
    sendWallet(ws);
    return true;
  }
  if (type === "town-leave") {
    leaveChannel(ws);
    forgetClientKey(ws);
    return true;
  }
  // town-ping and unknown town-* messages only keep the connection alive.
  return true;
}

export function handleTownClose(ws) {
  leaveChannel(ws);
  forgetClientKey(ws);
}

function sweepStaleMembers() {
  const now = nowTs();
  for (const members of [...channels.values()]) {
    for (const ws of [...members]) {
      const alive = ws.readyState === WebSocket.OPEN && now - (ws.townSeenAt || 0) <= STALE_MEMBER_MS;
      if (alive) continue;
      leaveChannel(ws);
      forgetClientKey(ws);
      ws.terminate();
    }
  }
}

setInterval(sweepStaleMembers, STALE_SWEEP_INTERVAL_MS).unref();
