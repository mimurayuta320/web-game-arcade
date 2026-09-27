// Town (Pigg-style virtual world) realtime state.
// Messages whose type starts with "town-" are routed here from room-server.mjs.
import crypto from "node:crypto";
import { WebSocket } from "ws";
import {
  FLAT_FURNITURE, FLOOR_STYLES, LIMITED_FURNITURE, LIMITED_PARTS, ROOM_SIZES, WALL_STYLES,
  addAme, canPlace, dailyOf, economy, ensurePlayer, itemAt, maxItems, newRoomId, normalizeName, ownsFurniture,
  ownsPart, playerIdFor, players, publicRoom, roomSpawn, rooms, sanitizeItem, sanitizeRoom, scheduleSave, walletOf,
} from "./town-data.mjs";

// Keep in sync with apps/web/src/games/town/world/areas.ts (size and spawn only).
const AREAS = {
  plaza: { width: 16, height: 16, spawn: [7, 12] },
  cafe: { width: 12, height: 12, spawn: [6, 10] },
  beach: { width: 16, height: 16, spawn: [8, 13] },
  shrine: { width: 14, height: 14, spawn: [6, 12] },
  street: { width: 18, height: 10, spawn: [1, 6] },
};
const DEFAULT_AREA = "plaza";

// Keep in sync with apps/web/src/games/town/avatar/{parts,actions}.ts.
const AVATAR_KEYS = [
  "skin", "face", "brows", "browColor", "eyes", "eyeColor", "nose", "mouth", "cheek", "mark", "hair", "hairColor",
  "top", "topColor", "bottom", "bottomColor", "onepiece", "onepieceColor", "shoes", "shoesColor",
  "hat", "hatColor", "glasses", "glassesColor", "neck", "neckColor", "back", "backColor", "hand", "handColor",
];
const ACTIONS = new Set([
  "laugh", "cry", "angry", "shy", "surprise", "love", "sweat", "sleep",
  "wave", "bow", "clap", "banzai", "peace", "heart",
  "jump", "spin", "dance", "backflip", "sit", "lie",
]);

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
  return avatar;
}

function normalizeClientKey(raw) {
  const key = String(raw || "").trim();
  return /^[a-z0-9-]{8,64}$/i.test(key) ? key : "";
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
    roomId: player?.rooms[0] || "", goodPigg: player?.goodPigg || 0,
  };
}

function areaOfChannel(channelKey) {
  return String(channelKey || "").split("#")[0];
}

function pickChannel(area) {
  const capacity = roomIdOfArea(area) ? ROOM_CHANNEL_CAPACITY : CHANNEL_CAPACITY;
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

function applyRoomEdit(room, player, payload) {
  const op = String(payload.op || "");
  if (op === "place") {
    if (room.items.length >= maxItems(room.size)) return "ROOM_FULL";
    const item = sanitizeItem(payload.item);
    if (!item) return "CANT_PLACE";
    if (!ownsFurniture(player, item.kind)) return "NOT_OWNED";
    if (!canPlace(room, item)) return "CANT_PLACE";
    room.items.push(item);
    return "";
  }
  if (op === "remove") {
    const target = itemAt(room, Math.floor(Number(payload.x)), Math.floor(Number(payload.y)));
    if (!target) return "NOTHING";
    room.items = room.items.filter((o) => o !== target);
    return "";
  }
  if (op === "rotate") {
    const target = itemAt(room, Math.floor(Number(payload.x)), Math.floor(Number(payload.y)));
    if (!target) return "NOTHING";
    const turned = { ...target, rot: target.rot ? 0 : 1 };
    if (!turned.rot) delete turned.rot;
    const others = { ...room, items: room.items.filter((o) => o !== target) };
    if (!canPlace(others, turned)) return "CANT_ROTATE";
    room.items = [...others.items, turned];
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
    if (!part || player.owned.parts.includes(key)) return;
    if (!spend(part.price)) return;
    grantItem(player, { kind: "part", key: part.key, id: part.id });
    send(ws, { type: "town-bought", label: part.label });
  } else if (what === "furniture") {
    const item = LIMITED_FURNITURE.get(String(payload.id));
    if (!item || player.owned.furniture.includes(item.kind)) return;
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

// ------------------------------------------------------------ join

function handleJoin(ws, payload) {
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
      praised: new Map(),
    };
  }
  const t = ws.town;
  leaveChannel(ws);

  const clientKey = normalizeClientKey(payload.clientKey);
  if (clientKey) {
    const previous = socketsByClientKey.get(clientKey);
    if (previous && previous !== ws) {
      leaveChannel(previous);
      send(previous, { type: "town-replaced" });
      if (previous.town) previous.town.clientKey = "";
    }
    t.clientKey = clientKey;
    t.playerId = playerIdFor(clientKey);
    socketsByClientKey.set(clientKey, ws);
  }

  t.name = normalizeName(payload.name);
  const player = t.playerId ? ensurePlayer(t.playerId, t.name) : null;
  t.avatar = normalizeAvatar(payload.avatar, player);

  const requestedArea = String(payload.area || "");
  let area = requestedArea;
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

  const spawn = Array.isArray(payload.spawn) ? payload.spawn : areaSize(area).spawn;
  [t.x, t.y] = clampTile(area, spawn[0], spawn[1]);

  const { key, number } = pickChannel(area);
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
  });
  broadcast(key, { type: "town-member-joined", member: publicMember(ws) }, ws);

  if (!player) return;
  const daily = dailyOf(player);
  if (!daily.login) {
    daily.login = true;
    earn(ws, player, EARN.login, "ログインボーナス");
  }
  if (room && room.ownerId !== player.id && !daily.visits.includes(room.id)) {
    daily.visits.push(room.id);
    if (daily.visits.length * EARN.visitRoom <= EARN.visitRoomDailyCap) earn(ws, player, EARN.visitRoom, "へや訪問ボーナス");
    else scheduleSave();
  }
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
    handleJoin(ws, payload);
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
      const gave = capped(dailyOf(player), "praiseGiven", EARN.praiseGiven, EARN.praiseGivenDailyCap);
      earn(ws, player, gave, "グッピグした");
    }
    return true;
  }
  if (type === "town-update") {
    t.name = normalizeName(payload.name);
    const nextAvatar = normalizeAvatar(payload.avatar, player);
    const changed = JSON.stringify(nextAvatar) !== JSON.stringify(t.avatar);
    t.avatar = nextAvatar;
    if (player) ensurePlayer(player.id, t.name);
    broadcast(t.channelKey, { type: "town-member-updated", member: publicMember(ws) }, ws);
    if (player && changed) {
      const daily = dailyOf(player);
      if (!daily.dress) {
        daily.dress = true;
        earn(ws, player, EARN.dress, "きせかえボーナス");
      }
    }
    return true;
  }
  if (type === "town-wallet") {
    sendWallet(ws);
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
  if (type === "town-room-edit") {
    const room = rooms.get(roomIdOfArea(area));
    if (!room || !player || room.ownerId !== player.id) {
      send(ws, { type: "town-error", code: "NOT_OWNER" });
      return true;
    }
    if (now - t.lastEditAt < EDIT_MIN_INTERVAL_MS) return true;
    t.lastEditAt = now;
    const error = applyRoomEdit(room, player, payload);
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
