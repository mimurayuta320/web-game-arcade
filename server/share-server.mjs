import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { WebSocketServer } from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

const HOST = process.env.SHARE_HOST || "0.0.0.0";
const PORT = Number(process.env.SHARE_PORT || 4173);
const ROOM_PATH = process.env.ROOM_PATH || "/room";
const MAX_ROOM_PLAYERS = Number(process.env.ROOM_MAX_PLAYERS || 8);
const CHAT_RATE_MIN_INTERVAL_MS = Number(process.env.ROOM_CHAT_MIN_INTERVAL_MS || 700);
const CHAT_RATE_WINDOW_MS = Number(process.env.ROOM_CHAT_WINDOW_MS || 12000);
const CHAT_RATE_MAX_IN_WINDOW = Number(process.env.ROOM_CHAT_MAX_IN_WINDOW || 8);
const CHAT_RATE_DUP_WINDOW_MS = Number(process.env.ROOM_CHAT_DUP_WINDOW_MS || 9000);
const CHAT_EDIT_RETRACT_WINDOW_MS = Number(process.env.ROOM_CHAT_EDIT_RETRACT_WINDOW_MS || 30000);
const REPORT_AUTO_MUTE_THRESHOLD = Number(process.env.ROOM_REPORT_AUTO_MUTE_THRESHOLD || 2);
const HOST_MUTE_DEFAULT_MS = Number(process.env.ROOM_HOST_MUTE_DEFAULT_MS || 5 * 60 * 1000);
const HOST_MUTE_MAX_MS = Number(process.env.ROOM_HOST_MUTE_MAX_MS || 24 * 60 * 60 * 1000);
const MESSAGE_STATE_TTL_MS = Number(process.env.ROOM_MESSAGE_STATE_TTL_MS || 4 * 60 * 60 * 1000);
const INVITE_TOKEN_TTL_MS = Number(process.env.ROOM_INVITE_TOKEN_TTL_MS || 5 * 60 * 1000);
const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = process.env.SHARE_DB_PATH || path.join(DATA_DIR, "profiles.json");
const ROOM_CHAT_DB_PATH = process.env.SHARE_CHAT_DB_PATH || path.join(DATA_DIR, "room-chat.sqlite");
const ROOM_CHAT_HISTORY_LIMIT = Number(process.env.ROOM_CHAT_HISTORY_LIMIT || 80);

let roomChatDb = null;

const DEFAULT_PROFILE = {
  bankCoins: 0,
  pityCounter: 0,
  unlockedSkins: ["classic"],
  selectedSkin: "classic",
  playerName: "Player",
  playerAvatar: "",
};

function normalizeAvatarDataUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";
  if (value.length > 180000) return "";
  if (!/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(value)) return "";
  return value;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

const rooms = new Map();
const roomMeta = new Map();

function initRoomChatDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  roomChatDb = new DatabaseSync(ROOM_CHAT_DB_PATH);
  roomChatDb.exec(`
    CREATE TABLE IF NOT EXISTS room_chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_code TEXT NOT NULL,
      channel TEXT NOT NULL,
      message_id TEXT NOT NULL,
      from_peer_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_room_chat_messages_room_channel_time
      ON room_chat_messages(room_code, channel, created_at DESC);
  `);
}

function sanitizeChatText(raw) {
  return String(raw || "").trim().slice(0, 200);
}

function persistRoomChatMessage({ roomCode, channel, messageId, fromPeerId, senderName, text, createdAt }) {
  if (!roomChatDb) return;
  const sanitizedText = sanitizeChatText(text);
  if (!sanitizedText) return;
  roomChatDb.prepare(`
    INSERT INTO room_chat_messages (
      room_code, channel, message_id, from_peer_id, sender_name, text, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    String(roomCode || ""),
    String(channel || "room"),
    String(messageId || ""),
    String(fromPeerId || ""),
    normalizePlayerName(senderName),
    sanitizedText,
    Number.isFinite(createdAt) ? Math.floor(createdAt) : nowTs(),
  );
}

function loadRecentRoomChatMessages(roomCode, channel, limit = ROOM_CHAT_HISTORY_LIMIT) {
  if (!roomChatDb) return [];
  const max = Math.max(1, Math.min(200, Number(limit) || ROOM_CHAT_HISTORY_LIMIT));
  const rows = roomChatDb.prepare(`
    SELECT message_id, from_peer_id, sender_name, text, created_at
    FROM room_chat_messages
    WHERE room_code = ? AND channel = ?
    ORDER BY created_at DESC, id DESC
    LIMIT ?
  `).all(String(roomCode || ""), String(channel || "room"), max);
  return rows.reverse().map((row) => ({
    messageId: String(row.message_id || ""),
    from: String(row.from_peer_id || ""),
    name: normalizePlayerName(row.sender_name),
    text: sanitizeChatText(row.text),
    createdAt: Number(row.created_at || 0),
  }));
}

function roomMetaOf(code) {
  if (!roomMeta.has(code)) {
    roomMeta.set(code, {
      hostPeerId: "",
      isPublic: true,
      inGame: false,
      allowedPeerIds: new Set(),
      mutedPeers: new Map(),
      reports: new Map(),
      messageStates: new Map(),
      rematchVotes: new Set(),
      inviteTokens: new Map(),
      privateAccessPeerIds: new Set(),
    });
  }
  return roomMeta.get(code);
}

function nowTs() {
  return Date.now();
}

function pruneRoomMeta(meta, now = nowTs()) {
  for (const [peerId, until] of meta.mutedPeers.entries()) {
    if (!Number.isFinite(until) || until <= now) {
      meta.mutedPeers.delete(peerId);
    }
  }
  for (const [messageId, state] of meta.messageStates.entries()) {
    if (!state || !Number.isFinite(state.createdAt) || now - state.createdAt > MESSAGE_STATE_TTL_MS) {
      meta.messageStates.delete(messageId);
      meta.reports.delete(messageId);
    }
  }
}

function normalizeMessageId(raw) {
  const id = String(raw || "").trim();
  if (!id) return "";
  return id.slice(0, 80);
}

function isHost(meta, peerId) {
  return Boolean(meta?.hostPeerId && peerId && meta.hostPeerId === peerId);
}

function asBoolean(value, fallback = true) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.toLowerCase().trim();
    if (v === "true") return true;
    if (v === "false") return false;
  }
  return fallback;
}

function asSpectateBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.toLowerCase().trim();
    if (v === "true") return true;
    if (v === "false") return false;
  }
  return false;
}

function isChatMutatingType(type) {
  return type === "chat" || type === "chat-edit" || type === "chat-retract";
}

function sendError(ws, code, detail = "") {
  sendJson(ws, { type: "error", code, detail });
}

function checkChatRateLimit(ws, payload) {
  const now = nowTs();
  const state = ws.chatRateState || {
    timestamps: [],
    lastText: "",
    lastAt: 0,
  };
  ws.chatRateState = state;

  while (state.timestamps.length > 0 && now - state.timestamps[0] > CHAT_RATE_WINDOW_MS) {
    state.timestamps.shift();
  }

  if (state.lastAt > 0 && now - state.lastAt < CHAT_RATE_MIN_INTERVAL_MS) {
    return { ok: false, code: "RATE_LIMIT_FAST" };
  }
  if (state.timestamps.length >= CHAT_RATE_MAX_IN_WINDOW) {
    return { ok: false, code: "RATE_LIMIT_BURST" };
  }

  const text = String(payload?.text || "").trim().toLowerCase();
  if (text && state.lastText === text && now - state.lastAt < CHAT_RATE_DUP_WINDOW_MS) {
    return { ok: false, code: "RATE_LIMIT_DUPLICATE" };
  }

  state.timestamps.push(now);
  state.lastText = text;
  state.lastAt = now;
  return { ok: true };
}

function normalizePlayerName(raw) {
  const trimmed = String(raw || "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "Player";
  return trimmed.slice(0, 18);
}

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: {} }, null, 2), "utf8");
  }
}

function readDb() {
  ensureDb();
  const raw = fs.readFileSync(DB_PATH, "utf8");
  const parsed = JSON.parse(raw || "{}");
  if (!parsed.users || typeof parsed.users !== "object") {
    parsed.users = {};
  }
  return parsed;
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function sendApiJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function hashPassword(password, saltHex) {
  const salt = saltHex ? Buffer.from(saltHex, "hex") : crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, 64);
  return {
    saltHex: salt.toString("hex"),
    hashHex: key.toString("hex"),
  };
}

function verifyPassword(password, storedSaltHex, storedHashHex) {
  const { hashHex } = hashPassword(password, storedSaltHex);
  const a = Buffer.from(hashHex, "hex");
  const b = Buffer.from(storedHashHex, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function sanitizeProfile(profile) {
  const bankCoins = Number.isFinite(profile?.bankCoins) ? Math.max(0, Math.floor(profile.bankCoins)) : 0;
  const pityCounter = Number.isFinite(profile?.pityCounter) ? Math.max(0, Math.min(9, Math.floor(profile.pityCounter))) : 0;
  const unlockedSkins = Array.isArray(profile?.unlockedSkins)
    ? profile.unlockedSkins.filter((id) => typeof id === "string")
    : ["classic"];
  if (!unlockedSkins.includes("classic")) unlockedSkins.unshift("classic");
  const selectedSkin = typeof profile?.selectedSkin === "string" ? profile.selectedSkin : "classic";
  const playerName = normalizePlayerName(profile?.playerName);
  const playerAvatar = normalizeAvatarDataUrl(profile?.playerAvatar);

  return {
    bankCoins,
    pityCounter,
    unlockedSkins: [...new Set(unlockedSkins)],
    selectedSkin: unlockedSkins.includes(selectedSkin) ? selectedSkin : "classic",
    playerName,
    playerAvatar,
  };
}

function authenticateOrCreate(db, userId, password) {
  const user = db.users[userId];
  if (!user) {
    const pass = hashPassword(password);
    db.users[userId] = {
      passSaltHex: pass.saltHex,
      passHashHex: pass.hashHex,
      profile: { ...DEFAULT_PROFILE },
      updatedAt: Date.now(),
      createdAt: Date.now(),
    };
    return { ok: true, created: true, user: db.users[userId] };
  }

  const ok = verifyPassword(password, user.passSaltHex, user.passHashHex);
  if (!ok) {
    return { ok: false };
  }
  return { ok: true, created: false, user };
}

function roomOf(code) {
  if (!rooms.has(code)) {
    rooms.set(code, new Set());
  }
  return rooms.get(code);
}

function removeFromRoom(ws) {
  const code = ws.roomCode;
  if (!code) return;
  const members = rooms.get(code);
  if (!members) return;
  members.delete(ws);
  const meta = roomMeta.get(code);
  if (meta && ws.peerId) {
    meta.rematchVotes.delete(ws.peerId);
  }
  if (meta && ws.peerId && meta.hostPeerId === ws.peerId) {
    meta.hostPeerId = "";
    for (const member of members) {
      if (member.peerId && !member.spectator) {
        meta.hostPeerId = member.peerId;
        break;
      }
    }
    if (!meta.hostPeerId) {
      for (const member of members) {
        if (member.peerId) {
          meta.hostPeerId = member.peerId;
          break;
        }
      }
    }
  }
  if (members.size === 0) {
    rooms.delete(code);
    roomMeta.delete(code);
  }
}

function sendJson(ws, payload) {
  if (ws.readyState !== ws.OPEN) return;
  ws.send(JSON.stringify(payload));
}

function broadcastRoom(code, payload, exceptWs = null) {
  const members = rooms.get(code);
  if (!members) return;
  for (const member of members) {
    if (member === exceptWs) continue;
    sendJson(member, payload);
  }
}

function joinRoom(ws, payload) {
  const code = String(payload.room || "").trim();
  if (!code) {
    sendJson(ws, { type: "error", code: "ROOM_REQUIRED" });
    return false;
  }

  if (ws.roomCode && ws.roomCode !== code) {
    removeFromRoom(ws);
    ws.roomCode = null;
  }

  const members = roomOf(code);
  const requestedSpectate = asSpectateBoolean(payload?.spectate);
  if (!ws.roomCode && members.size >= MAX_ROOM_PLAYERS) {
    sendJson(ws, { type: "room-full", code });
    return { ok: false, joined: false };
  }

  const meta = roomMetaOf(code);
  const inviteToken = String(payload?.inviteToken || "").trim();
  if (!ws.roomCode && !meta.isPublic && ws.peerId !== meta.hostPeerId) {
    const alreadyAllowed = ws.peerId && meta.privateAccessPeerIds.has(ws.peerId);
    const consumed = alreadyAllowed ? true : consumeInviteToken(meta, inviteToken);
    if (!consumed) {
      sendJson(ws, { type: "invite-token-required", code });
      return { ok: false, joined: false };
    }
  }
  if (!ws.roomCode && !requestedSpectate && meta.inGame && (!ws.peerId || !meta.allowedPeerIds.has(ws.peerId))) {
    sendJson(ws, { type: "room-in-game", code });
    return { ok: false, joined: false };
  }

  let joined = false;
  if (!ws.roomCode) {
    ws.roomCode = code;
    members.add(ws);
    ws.spectator = requestedSpectate;
    joined = true;
    if (!meta.hostPeerId && ws.peerId && !ws.spectator) {
      meta.hostPeerId = ws.peerId;
    }
    if (ws.peerId) {
      meta.privateAccessPeerIds.add(ws.peerId);
    }
  }

  const requestedPublic = asBoolean(payload?.roomPublic, meta.isPublic);
  if (ws.peerId && meta.hostPeerId === ws.peerId) {
    meta.isPublic = requestedPublic;
  }

  return { ok: true, joined };
}

function roomParticipants(code) {
  const members = rooms.get(code);
  if (!members) return [];
  const meta = roomMetaOf(code);
  const participants = [];
  for (const member of members) {
    if (!member.peerId) continue;
    const role = meta.inGame && !meta.allowedPeerIds.has(member.peerId)
      ? "spectator"
      : (member.spectator ? "spectator" : (meta.hostPeerId === member.peerId ? "host" : "guest"));
    participants.push({
      id: member.peerId,
      name: normalizePlayerName(member.playerName || "Player"),
      avatar: normalizeAvatarDataUrl(member.playerAvatar),
      role,
    });
  }
  return participants;
}

function broadcastRoomState(code) {
  if (!code) return;
  const meta = roomMetaOf(code);
  broadcastRoom(code, {
    type: "room-state",
    room: code,
    participants: roomParticipants(code),
    hostPeerId: meta.hostPeerId || "",
    isPublic: Boolean(meta.isPublic),
    inGame: Boolean(meta.inGame),
    rematchVotes: [...meta.rematchVotes],
  });
}

function lockCurrentParticipantsForMatch(code) {
  const members = rooms.get(code);
  if (!members) return;
  const meta = roomMetaOf(code);
  meta.inGame = true;
  meta.allowedPeerIds = new Set();
  for (const member of members) {
    if (member.peerId && !member.spectator) meta.allowedPeerIds.add(member.peerId);
  }
}

function unlockMatchForLobby(code) {
  const meta = roomMetaOf(code);
  meta.inGame = false;
  meta.allowedPeerIds = new Set();
  meta.rematchVotes = new Set();
}

function purgeExpiredInviteTokens(meta) {
  const now = nowTs();
  for (const [token, state] of meta.inviteTokens.entries()) {
    if (!state || !Number.isFinite(state.expiresAt) || state.expiresAt <= now) {
      meta.inviteTokens.delete(token);
    }
  }
}

function issueInviteToken(code, issuedBy) {
  const meta = roomMetaOf(code);
  purgeExpiredInviteTokens(meta);
  const token = crypto.randomBytes(12).toString("base64url");
  meta.inviteTokens.set(token, {
    expiresAt: nowTs() + INVITE_TOKEN_TTL_MS,
    used: false,
    issuedBy: String(issuedBy || ""),
  });
  return token;
}

function consumeInviteToken(meta, token) {
  if (!token) return false;
  purgeExpiredInviteTokens(meta);
  const state = meta.inviteTokens.get(token);
  if (!state || state.used || !Number.isFinite(state.expiresAt) || state.expiresAt <= nowTs()) {
    return false;
  }
  state.used = true;
  return true;
}

function activePlayerCount(code) {
  const members = rooms.get(code);
  if (!members) return 0;
  let count = 0;
  for (const member of members) {
    if (member.peerId && !member.spectator) count += 1;
  }
  return count;
}

function canVoteRematch(meta, ws) {
  if (!meta.inGame) return false;
  if (!ws?.peerId || ws.spectator) return false;
  if (meta.allowedPeerIds.size > 0) return meta.allowedPeerIds.has(ws.peerId);
  return true;
}

function broadcastRematchVoteState(code) {
  const meta = roomMetaOf(code);
  broadcastRoom(code, {
    type: "rematch-vote-state",
    room: code,
    votes: [...meta.rematchVotes],
    required: 2,
  });
}

function handleHostMute(code, ws, payload) {
  const meta = roomMetaOf(code);
  if (!isHost(meta, ws.peerId)) {
    sendError(ws, "HOST_ONLY");
    return true;
  }
  const target = String(payload?.target || "").trim();
  if (!target || target === ws.peerId) {
    sendError(ws, "TARGET_INVALID");
    return true;
  }

  const durationRaw = Number(payload?.durationMs);
  const durationMs = Number.isFinite(durationRaw)
    ? Math.max(30 * 1000, Math.min(HOST_MUTE_MAX_MS, Math.floor(durationRaw)))
    : HOST_MUTE_DEFAULT_MS;
  const until = nowTs() + durationMs;
  meta.mutedPeers.set(target, until);

  broadcastRoom(code, {
    type: "moderation-action",
    action: "host-mute",
    target,
    until,
    by: ws.peerId,
    room: code,
  });
  return true;
}

function handleHostUnmute(code, ws, payload) {
  const meta = roomMetaOf(code);
  if (!isHost(meta, ws.peerId)) {
    sendError(ws, "HOST_ONLY");
    return true;
  }

  const target = String(payload?.target || "").trim();
  if (!target) {
    sendError(ws, "TARGET_REQUIRED");
    return true;
  }
  meta.mutedPeers.delete(target);

  broadcastRoom(code, {
    type: "moderation-action",
    action: "host-unmute",
    target,
    by: ws.peerId,
    room: code,
  });
  return true;
}

function handleChatReport(code, ws, payload) {
  const meta = roomMetaOf(code);
  const messageId = normalizeMessageId(payload?.messageId);
  if (!messageId) {
    sendError(ws, "MESSAGE_ID_REQUIRED");
    return true;
  }
  const state = meta.messageStates.get(messageId);
  if (!state) {
    sendError(ws, "MESSAGE_NOT_FOUND");
    return true;
  }
  if (state.ownerId === ws.peerId) {
    sendError(ws, "REPORT_SELF_FORBIDDEN");
    return true;
  }

  const reporters = meta.reports.get(messageId) || new Set();
  reporters.add(ws.peerId || "");
  meta.reports.set(messageId, reporters);

  if (reporters.size >= REPORT_AUTO_MUTE_THRESHOLD && state.ownerId) {
    const until = nowTs() + HOST_MUTE_DEFAULT_MS;
    meta.mutedPeers.set(state.ownerId, until);
    broadcastRoom(code, {
      type: "moderation-action",
      action: "auto-mute",
      target: state.ownerId,
      until,
      room: code,
      sourceMessageId: messageId,
    });
  }
  return true;
}

function validateAndTrackChatMutation(code, ws, payload) {
  const meta = roomMetaOf(code);
  pruneRoomMeta(meta);

  if (ws.peerId && meta.mutedPeers.has(ws.peerId)) {
    sendError(ws, "MUTED");
    return { ok: false };
  }

  const rateResult = checkChatRateLimit(ws, payload);
  if (!rateResult.ok) {
    sendError(ws, rateResult.code);
    return { ok: false };
  }

  const type = String(payload?.type || "");
  if (type === "chat") {
    const text = sanitizeChatText(payload?.text);
    if (!text) {
      sendError(ws, "CHAT_EMPTY");
      return { ok: false };
    }
    const messageId = normalizeMessageId(payload?.messageId);
    if (!messageId) {
      sendError(ws, "MESSAGE_ID_REQUIRED");
      return { ok: false };
    }
    meta.messageStates.set(messageId, {
      ownerId: ws.peerId || "",
      createdAt: nowTs(),
      retracted: false,
      targetPeerId: String(payload?.to || "").trim() || "",
    });
    payload.messageId = messageId;
    payload.text = text;
    return { ok: true };
  }

  if (type === "chat-edit" || type === "chat-retract") {
    const messageId = normalizeMessageId(payload?.messageId);
    if (!messageId) {
      sendError(ws, "MESSAGE_ID_REQUIRED");
      return { ok: false };
    }
    const state = meta.messageStates.get(messageId);
    if (!state) {
      sendError(ws, "MESSAGE_NOT_FOUND");
      return { ok: false };
    }
    if (!state.ownerId || state.ownerId !== ws.peerId) {
      sendError(ws, "MESSAGE_NOT_OWNED");
      return { ok: false };
    }
    if (state.retracted) {
      sendError(ws, "MESSAGE_ALREADY_RETRACTED");
      return { ok: false };
    }
    if (nowTs() - state.createdAt > CHAT_EDIT_RETRACT_WINDOW_MS) {
      sendError(ws, "EDIT_RETRACT_WINDOW_EXPIRED");
      return { ok: false };
    }
    if (type === "chat-retract") {
      state.retracted = true;
    }
    payload.messageId = messageId;
    return { ok: true, targetPeerId: state.targetPeerId || "" };
  }

  return { ok: true };
}

initRoomChatDb();

function resolveFilePath(urlPath) {
  const safePath = decodeURIComponent(urlPath.split("?")[0]).replace(/\\/g, "/");
  const normalized = safePath === "/" ? "/index.html" : safePath;
  const absolute = path.normalize(path.join(distDir, normalized));
  if (!absolute.startsWith(distDir)) {
    return null;
  }
  return absolute;
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (requestUrl.pathname === "/api/profile/load" || requestUrl.pathname === "/api/profile/save") {
    if (req.method === "OPTIONS") {
      sendApiJson(res, 204, { ok: true });
      return;
    }

    if (req.method !== "POST") {
      sendApiJson(res, 405, { ok: false, code: "METHOD_NOT_ALLOWED", message: "POST only" });
      return;
    }

    try {
      const body = await parseBody(req);
      const userId = String(body?.userId || "").trim();
      const password = String(body?.password || "");

      if (!userId || !password) {
        sendApiJson(res, 400, { ok: false, code: "AUTH_REQUIRED", message: "userId and password are required" });
        return;
      }

      const db = readDb();
      const auth = authenticateOrCreate(db, userId, password);
      if (!auth.ok) {
        sendApiJson(res, 401, { ok: false, code: "INVALID_PASSWORD", message: "Invalid password" });
        return;
      }

      if (requestUrl.pathname === "/api/profile/load") {
        writeDb(db);
        sendApiJson(res, 200, {
          ok: true,
          created: auth.created,
          profile: sanitizeProfile(auth.user.profile || DEFAULT_PROFILE),
        });
        return;
      }

      const nextProfile = sanitizeProfile(body?.profile || {});
      auth.user.profile = nextProfile;
      auth.user.updatedAt = Date.now();
      writeDb(db);
      sendApiJson(res, 200, { ok: true, profile: nextProfile });
      return;
    } catch (err) {
      sendApiJson(res, 500, {
        ok: false,
        code: "SERVER_ERROR",
        message: err?.message || "Internal server error",
      });
      return;
    }
  }

  if (!fs.existsSync(distDir)) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("dist directory not found. Run npm run build first.");
    return;
  }

  const requestPath = requestUrl.pathname || "/";
  let filePath = resolveFilePath(requestPath);

  if (!filePath) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Bad request");
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, "index.html");
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
});

const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (ws) => {
  ws.roomCode = null;
  ws.peerId = null;
  ws.spectator = false;
  ws.playerName = "Player";
  ws.playerAvatar = "";
  ws.chatRateState = {
    timestamps: [],
    lastText: "",
    lastAt: 0,
  };

  ws.on("message", (raw) => {
    let payload = null;
    try {
      payload = JSON.parse(String(raw || "{}"));
    } catch {
      return;
    }

    if (!payload || typeof payload !== "object") return;
    ws.peerId = String(payload.from || ws.peerId || "").trim() || ws.peerId;
    ws.spectator = asSpectateBoolean(payload?.spectate || ws.spectator);
    const joinResult = joinRoom(ws, payload);
    if (!joinResult.ok) return;

    const code = ws.roomCode;
    if (!code) return;

    const type = String(payload.type || "");

    if (typeof payload.name === "string") {
      ws.playerName = normalizePlayerName(payload.name);
    }
    if (typeof payload.avatar === "string") {
      ws.playerAvatar = normalizeAvatarDataUrl(payload.avatar);
    }

    if (joinResult.joined || type === "hello" || type === "presence") {
      sendJson(ws, {
        type: "chat-history",
        room: code,
        roomMessages: loadRecentRoomChatMessages(code, "room"),
        spectatorMessages: loadRecentRoomChatMessages(code, "spectator"),
      });
    }

    if (type === "host-mute") {
      handleHostMute(code, ws, payload);
      return;
    }
    if (type === "host-unmute") {
      handleHostUnmute(code, ws, payload);
      return;
    }
    if (type === "issue-invite-token") {
      const meta = roomMetaOf(code);
      if (!isHost(meta, ws.peerId)) {
        sendError(ws, "HOST_ONLY");
        return;
      }
      if (meta.isPublic) {
        sendError(ws, "INVITE_TOKEN_PRIVATE_ONLY");
        return;
      }
      const token = issueInviteToken(code, ws.peerId);
      sendJson(ws, { type: "invite-token", room: code, token, ttlMs: INVITE_TOKEN_TTL_MS });
      return;
    }
    if (type === "return-lobby") {
      unlockMatchForLobby(code);
      broadcastRoomState(code);
      return;
    }
    if (type === "chat-report") {
      handleChatReport(code, ws, payload);
      return;
    }

    if (type === "spectator-chat") {
      const text = String(payload?.text || "").trim().slice(0, 200);
      if (!text) return;
      if (!ws.spectator) {
        sendError(ws, "SPECTATOR_ONLY");
        return;
      }
      const members = rooms.get(code);
      if (!members) return;
      const envelope = {
        type: "spectator-chat",
        room: code,
        from: ws.peerId || String(payload.from || ""),
        name: ws.playerName || "Spectator",
        text,
      };
      persistRoomChatMessage({
        roomCode: code,
        channel: "spectator",
        messageId: normalizeMessageId(payload?.messageId) || `spectator-${nowTs()}-${Math.floor(Math.random() * 100000)}`,
        fromPeerId: ws.peerId || "",
        senderName: ws.playerName || "Spectator",
        text,
        createdAt: nowTs(),
      });
      for (const member of members) {
        if (member.spectator || member === ws) {
          sendJson(member, envelope);
        }
      }
      return;
    }

    if (type === "rematch-vote") {
      const meta = roomMetaOf(code);
      if (!canVoteRematch(meta, ws)) {
        sendError(ws, "REMATCH_VOTE_FORBIDDEN");
        return;
      }
      meta.rematchVotes.add(ws.peerId);
      broadcastRematchVoteState(code);

      const requiredVotes = 2;
      if (activePlayerCount(code) >= requiredVotes && meta.rematchVotes.size >= requiredVotes) {
        meta.rematchVotes = new Set();
        const nextGame = String(payload?.game || "").trim();
        if (nextGame) {
          broadcastRoom(code, {
            type: "new-game",
            room: code,
            game: nextGame,
            from: "system",
          });
          lockCurrentParticipantsForMatch(code);
        }
        broadcastRematchVoteState(code);
      }
      return;
    }

    let mutationResult = { ok: true };
    if (isChatMutatingType(type)) {
      mutationResult = validateAndTrackChatMutation(code, ws, payload);
      if (!mutationResult.ok) return;
    }

    if (type === "select-game" || type === "new-game") {
      const meta = roomMetaOf(code);
      meta.rematchVotes = new Set();
      lockCurrentParticipantsForMatch(code);
    }

    if (joinResult.joined || payload.type === "hello" || payload.type === "presence") {
      broadcastRoomState(code);
    }

    const envelope = {
      ...payload,
      room: code,
      from: ws.peerId || String(payload.from || ""),
    };

    if (type === "chat") {
      envelope.name = ws.playerName || "Player";
      persistRoomChatMessage({
        roomCode: code,
        channel: "room",
        messageId: normalizeMessageId(payload?.messageId) || `room-${nowTs()}-${Math.floor(Math.random() * 100000)}`,
        fromPeerId: ws.peerId || "",
        senderName: envelope.name,
        text: payload.text,
        createdAt: nowTs(),
      });
    }

    const members = rooms.get(code);
    if (!members) return;

    if ((type === "chat-edit" || type === "chat-retract") && mutationResult.targetPeerId) {
      for (const member of members) {
        if (member.peerId === mutationResult.targetPeerId) {
          sendJson(member, envelope);
          return;
        }
      }
      return;
    }

    if (payload.to) {
      for (const member of members) {
        if (member.peerId === payload.to) {
          sendJson(member, envelope);
          return;
        }
      }
      return;
    }

    broadcastRoom(code, envelope, ws);
  });

  ws.on("close", () => {
    const code = ws.roomCode;
    const from = ws.peerId;
    removeFromRoom(ws);
    broadcastRoomState(code);
    if (code && from) {
      broadcastRoom(code, { type: "leave", from, room: code });
    }
  });
});

server.on("upgrade", (request, socket, head) => {
  const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  if (requestUrl.pathname !== ROOM_PATH) {
    socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Share server running at http://${HOST}:${PORT}`);
  console.log(`Room websocket endpoint: ws://${HOST}:${PORT}${ROOM_PATH}`);
});
