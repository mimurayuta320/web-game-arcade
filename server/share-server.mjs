import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { WebSocketServer } from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

const HOST = process.env.SHARE_HOST || "0.0.0.0";
const PORT = Number(process.env.SHARE_PORT || 4173);
const ROOM_PATH = process.env.ROOM_PATH || "/room";
const CLOUD_API_BASE = process.env.SHARE_CLOUD_API_BASE || "http://127.0.0.1:8787";
const WEB_APP_BASE = String(process.env.SHARE_WEB_APP_BASE || "").trim();
const HARD_MAX_ROOM_PLAYERS = 8;
const MIN_ROOM_PLAYERS = 2;
const DEFAULT_ROOM_MAX_PLAYERS = Math.max(
  MIN_ROOM_PLAYERS,
  Math.min(HARD_MAX_ROOM_PLAYERS, Number(process.env.ROOM_MAX_PLAYERS || HARD_MAX_ROOM_PLAYERS) || HARD_MAX_ROOM_PLAYERS),
);
const CHAT_RATE_MIN_INTERVAL_MS = Number(process.env.ROOM_CHAT_MIN_INTERVAL_MS || 700);
const CHAT_RATE_WINDOW_MS = Number(process.env.ROOM_CHAT_WINDOW_MS || 12000);
const CHAT_RATE_MAX_IN_WINDOW = Number(process.env.ROOM_CHAT_MAX_IN_WINDOW || 8);
const CHAT_RATE_DUP_WINDOW_MS = Number(process.env.ROOM_CHAT_DUP_WINDOW_MS || 9000);
const CHAT_EDIT_RETRACT_WINDOW_MS = Number(process.env.ROOM_CHAT_EDIT_RETRACT_WINDOW_MS || 30000);
const REPORT_AUTO_MUTE_THRESHOLD = Number(process.env.ROOM_REPORT_AUTO_MUTE_THRESHOLD || 2);
const HOST_MUTE_DEFAULT_MS = Number(process.env.ROOM_HOST_MUTE_DEFAULT_MS || 5 * 60 * 1000);
const HOST_MUTE_MAX_MS = Number(process.env.ROOM_HOST_MUTE_MAX_MS || 24 * 60 * 60 * 1000);
const ROOM_HOST_REASSIGN_GRACE_MS = Number(process.env.ROOM_HOST_REASSIGN_GRACE_MS || 5000);
const MESSAGE_STATE_TTL_MS = Number(process.env.ROOM_MESSAGE_STATE_TTL_MS || 4 * 60 * 60 * 1000);
const INVITE_TOKEN_TTL_MS = Number(process.env.ROOM_INVITE_TOKEN_TTL_MS || 5 * 60 * 1000);
const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = process.env.SHARE_DB_PATH || path.join(DATA_DIR, "profiles.json");

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

function roomMetaOf(code) {
  if (!roomMeta.has(code)) {
    roomMeta.set(code, {
      hostPeerId: "",
      hostNameSnapshot: "",
      hostReassignGraceUntil: 0,
      pendingTransitionCount: 0,
      pendingTransitionUntil: 0,
      parentRoomCode: "",
      listContext: "menu",
      isPublic: true,
      maxPlayers: DEFAULT_ROOM_MAX_PLAYERS,
      accessPassword: "",
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

function normalizeRoomPassword(raw) {
  return String(raw || "").trim().slice(0, 32);
}

function normalizeRoomMaxPlayers(raw, fallback = DEFAULT_ROOM_MAX_PLAYERS) {
  const base = Number.isFinite(fallback) ? Number(fallback) : DEFAULT_ROOM_MAX_PLAYERS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return Math.max(MIN_ROOM_PLAYERS, Math.min(HARD_MAX_ROOM_PLAYERS, Math.floor(base)));
  }
  return Math.max(MIN_ROOM_PLAYERS, Math.min(HARD_MAX_ROOM_PLAYERS, Math.floor(parsed)));
}

function normalizePlayablePanel(raw) {
  const panel = String(raw || "").trim();
  if (!panel || panel === "menu" || panel === "scores") return "";
  if (
    panel === "othello"
    || panel === "gomoku"
    || panel === "chess"
    || panel === "shogi"
    || panel === "uno"
    || panel === "minesweeper"
    || panel === "numeron"
    || panel === "blackjack"
    || panel === "chinchiro"
    || panel === "sevens"
    || panel === "daifugo"
    || panel === "fourPanel"
    || panel === "drawingRelay"
    || panel === "fitPuzzle"
    || panel === "mahjong"
    || panel === "poker"
    || panel === "solitaire"
    || panel === "survivors"
  ) {
    return panel;
  }
  return "";
}

function normalizeRoomCode(raw) {
  return String(raw || "").replace(/\D/g, "").slice(0, 6);
}

function generateRoomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function allocateRoomCode() {
  for (let i = 0; i < 120; i += 1) {
    const code = generateRoomCode();
    if (!rooms.has(code) || (rooms.get(code)?.size || 0) === 0) return code;
  }
  return generateRoomCode();
}

function pickQuickJoinRoomCode() {
  let bestCode = "";
  for (const [code, members] of rooms.entries()) {
    const size = members?.size || 0;
    if (size <= 0) continue;
    const meta = roomMetaOf(code);
    const capacity = normalizeRoomMaxPlayers(meta.maxPlayers, DEFAULT_ROOM_MAX_PLAYERS);
    if (size >= capacity) continue;
    if (!meta.isPublic || meta.inGame) continue;
    const activePlayers = activePlayerCount(code);
    if (activePlayers < 1 || activePlayers >= capacity) continue;
    bestCode = code;
    break;
  }
  return bestCode;
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

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 1024 * 1024) {
        reject(new Error("Payload too large"));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function proxyApiRequest(req, res, requestUrl) {
  const proxiedPath = requestUrl.pathname.startsWith("/api/cloud/")
    ? requestUrl.pathname.replace(/^\/api\/cloud\//, "/api/")
    : requestUrl.pathname;
  const target = `${CLOUD_API_BASE}${proxiedPath}${requestUrl.search}`;

  if (req.method === "OPTIONS") {
    sendApiJson(res, 204, { ok: true });
    return;
  }

  const rawBody = ["GET", "HEAD"].includes(req.method || "")
    ? undefined
    : await readRawBody(req);

  let response;
  try {
    response = await fetch(target, {
      method: req.method,
      headers: {
        "content-type": req.headers["content-type"] || "application/json",
      },
      body: rawBody,
    });
  } catch (error) {
    sendApiJson(res, 502, {
      ok: false,
      code: "CLOUD_API_UNAVAILABLE",
      message: error?.message || "Failed to reach cloud API",
    });
    return;
  }

  const bodyText = await response.text();
  const contentType = response.headers.get("content-type") || "application/json; charset=utf-8";
  res.writeHead(response.status, {
    "Content-Type": contentType,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(bodyText);
}

async function proxyWebAppRequest(req, res, requestUrl) {
  if (!WEB_APP_BASE) return false;

  const target = `${WEB_APP_BASE}${requestUrl.pathname}${requestUrl.search}`;
  const upstreamHeaders = {};
  for (const [key, value] of Object.entries(req.headers || {})) {
    const lower = String(key).toLowerCase();
    if (lower === "host" || lower === "connection" || lower === "content-length") {
      continue;
    }
    if (Array.isArray(value)) {
      upstreamHeaders[key] = value.join(", ");
    } else if (typeof value === "string") {
      upstreamHeaders[key] = value;
    }
  }

  const rawBody = ["GET", "HEAD"].includes(req.method || "")
    ? undefined
    : await readRawBody(req);

  let response;
  try {
    response = await fetch(target, {
      method: req.method,
      headers: upstreamHeaders,
      body: rawBody,
    });
  } catch (error) {
    res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({
      ok: false,
      code: "WEB_APP_UNAVAILABLE",
      message: error?.message || "Failed to reach web app",
    }));
    return true;
  }

  const downstreamHeaders = {};
  response.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "connection" || lower === "transfer-encoding" || lower === "content-encoding") {
      return;
    }
    downstreamHeaders[key] = value;
  });

  const body = Buffer.from(await response.arrayBuffer());
  res.writeHead(response.status, downstreamHeaders);
  res.end(body);
  return true;
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

function authenticateOnly(db, userId, password) {
  const user = db.users[userId];
  if (!user) {
    return { ok: false, code: "USER_NOT_FOUND" };
  }
  const ok = verifyPassword(password, user.passSaltHex, user.passHashHex);
  if (!ok) {
    return { ok: false, code: "INVALID_PASSWORD" };
  }
  return { ok: true, user };
}

function registerUser(db, userId, password) {
  if (db.users[userId]) {
    return { ok: false, code: "USER_ALREADY_EXISTS" };
  }
  const pass = hashPassword(password);
  db.users[userId] = {
    passSaltHex: pass.saltHex,
    passHashHex: pass.hashHex,
    profile: { ...DEFAULT_PROFILE },
    updatedAt: Date.now(),
    createdAt: Date.now(),
  };
  return { ok: true, user: db.users[userId] };
}

function roomOf(code) {
  if (!rooms.has(code)) {
    rooms.set(code, new Set());
  }
  return rooms.get(code);
}

function pickNextHostPeerId(code) {
  const members = rooms.get(code);
  if (!members) return "";
  for (const member of members) {
    if (member.peerId && !member.spectator) return member.peerId;
  }
  return "";
}

function ensureHostPeerId(code) {
  const meta = roomMetaOf(code);
  const members = rooms.get(code);
  if (!members || members.size === 0) {
    meta.hostPeerId = "";
    meta.hostNameSnapshot = "";
    meta.hostReassignGraceUntil = 0;
    meta.pendingTransitionCount = 0;
    meta.pendingTransitionUntil = 0;
    return;
  }
  const hasActiveHost = [...members].some(
    (member) => member.peerId && member.peerId === meta.hostPeerId && !member.spectator,
  );
  if (hasActiveHost) {
    const activeHost = [...members].find(
      (member) => member.peerId && member.peerId === meta.hostPeerId && !member.spectator,
    );
    if (activeHost) {
      meta.hostNameSnapshot = normalizePlayerName(activeHost.playerName || "Player");
    }
    meta.hostReassignGraceUntil = 0;
    return;
  }
  if (!hasActiveHost) {
    if (meta.hostPeerId && Number(meta.hostReassignGraceUntil || 0) > nowTs()) {
      return;
    }
    if (meta.hostPeerId && hasLiveChildRoomForParent(code)) {
      return;
    }
    meta.hostReassignGraceUntil = 0;
    meta.hostPeerId = pickNextHostPeerId(code);
    if (meta.hostPeerId) {
      const nextHost = [...members].find((member) => member.peerId === meta.hostPeerId);
      if (nextHost) {
        meta.hostNameSnapshot = normalizePlayerName(nextHost.playerName || "Player");
      }
    } else {
      meta.hostNameSnapshot = "";
    }
  }
}

function grantPrivateAccessFromSourceRoom(targetMeta, sourceCode) {
  if (!targetMeta || !sourceCode) return;
  const sourceMembers = rooms.get(sourceCode);
  if (!sourceMembers || sourceMembers.size === 0) return;
  for (const member of sourceMembers) {
    const peerId = String(member?.peerId || "").trim();
    if (!peerId) continue;
    targetMeta.privateAccessPeerIds.add(peerId);
  }
}

function listLiveChildRoomCodes(parentCode) {
  const codes = [];
  if (!parentCode) return codes;
  for (const [code, members] of rooms.entries()) {
    if (code === parentCode) continue;
    if (!members || members.size <= 0) continue;
    const meta = roomMeta.get(code);
    if (!meta) continue;
    if (meta.listContext !== "game") continue;
    if (normalizeRoomCode(meta.parentRoomCode) !== parentCode) continue;
    codes.push(code);
  }
  return codes;
}

function hasLiveChildRoomForParent(parentCode) {
  return listLiveChildRoomCodes(parentCode).length > 0;
}

function listPublicRooms(limit = 80, listContext = "all") {
  const summaries = [];
  for (const [code, members] of rooms.entries()) {
    if (summaries.length >= limit) break;
    const size = members?.size || 0;
    const hasLiveChildren = hasLiveChildRoomForParent(code);
    if (size <= 0 && !hasLiveChildren) continue;

    const meta = roomMetaOf(code);
    const roomListContext = meta.listContext === "game" ? "game" : "menu";
    const capacity = normalizeRoomMaxPlayers(meta.maxPlayers, DEFAULT_ROOM_MAX_PLAYERS);
    if (listContext === "menu" && roomListContext !== "menu") continue;
    if (listContext === "game" && roomListContext !== "game") continue;

    const participants = roomParticipants(code);
    const activePlayers = participants.filter((participant) => participant.role === "host" || participant.role === "guest");
    const host = activePlayers.find((participant) => participant.role === "host");
    const guest = activePlayers.find((participant) => participant.role === "guest");
    let mergedActivePlayers = activePlayers.length;
    let mergedSpectatorCount = participants.filter((participant) => participant.role === "spectator").length;
    let mergedTotalParticipants = participants.length;
    if ((Number(meta.pendingTransitionCount) || 0) > 0) {
      meta.pendingTransitionCount = 0;
      meta.pendingTransitionUntil = 0;
    }
    const panelSet = new Set();
    for (const participant of activePlayers) {
      const panel = normalizePlayablePanel(participant.panel);
      if (panel) panelSet.add(panel);
    }

    if (roomListContext === "menu" && hasLiveChildren) {
      const childCodes = listLiveChildRoomCodes(code);
      for (const childCode of childCodes) {
        const childParticipants = roomParticipants(childCode);
        const childActivePlayers = childParticipants.filter((participant) => participant.role === "host" || participant.role === "guest");
        mergedActivePlayers += childActivePlayers.length;
        mergedSpectatorCount += childParticipants.filter((participant) => participant.role === "spectator").length;
        mergedTotalParticipants += childParticipants.length;
        for (const participant of childActivePlayers) {
          const panel = normalizePlayablePanel(participant.panel);
          if (panel) panelSet.add(panel);
        }
      }
    }

    summaries.push({
      code,
      listContext: roomListContext,
      isPublic: Boolean(meta.isPublic),
      maxPlayers: capacity,
      hasPassword: Boolean(meta.accessPassword),
      inGame: Boolean(meta.inGame),
      activePlayers: Math.max(0, Math.min(capacity, mergedActivePlayers)),
      spectatorCount: mergedSpectatorCount,
      totalParticipants: Math.max(0, Math.min(capacity, mergedTotalParticipants)),
      hostName: String(host?.name || meta.hostNameSnapshot || "").trim(),
      guestName: String(guest?.name || "").trim(),
      panels: [...panelSet],
    });
  }

  summaries.sort((a, b) => {
    const scoreA = a.activePlayers * 10 + a.totalParticipants;
    const scoreB = b.activePlayers * 10 + b.totalParticipants;
    if (scoreA !== scoreB) return scoreB - scoreA;
    return String(a.code).localeCompare(String(b.code));
  });

  return summaries.slice(0, limit);
}

function broadcastRoomsList(limit = 80) {
  const payload = {
    type: "rooms-list",
    listContext: "all",
    rooms: listPublicRooms(limit),
    fetchedAt: nowTs(),
  };
  for (const client of wss.clients) {
    sendJson(client, payload);
  }
}

function removeFromRoom(ws, options = {}) {
  const code = ws.roomCode;
  if (!code) return;
  const members = rooms.get(code);
  if (!members) return;
  const meta = roomMeta.get(code);
  const preserveEmptyRoom = Boolean(options?.preserveEmptyRoom);
  const preserveHostPeerId = Boolean(options?.preserveHostPeerId);
  const isLikelyLobbyToGameTransition = Boolean(
    meta
    && meta.listContext === "menu"
    && normalizePlayablePanel(ws.currentPanel),
  );
  members.delete(ws);
  if (meta && ws.peerId) {
    meta.rematchVotes.delete(ws.peerId);
  }
  if (
    meta
    && ws.peerId
    && meta.hostPeerId === ws.peerId
    && !preserveHostPeerId
    && !isLikelyLobbyToGameTransition
  ) {
    const shouldGraceHoldHost = meta.listContext === "menu" && members.size > 0;
    if (shouldGraceHoldHost) {
      meta.hostReassignGraceUntil = nowTs() + ROOM_HOST_REASSIGN_GRACE_MS;
    } else {
      meta.hostReassignGraceUntil = 0;
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
  }
  if (
    meta
    && ws.peerId
    && meta.hostPeerId === ws.peerId
    && !preserveHostPeerId
    && isLikelyLobbyToGameTransition
    && meta.listContext === "menu"
    && members.size > 0
  ) {
    meta.hostReassignGraceUntil = nowTs() + ROOM_HOST_REASSIGN_GRACE_MS;
  }
  if (
    meta
    && isLikelyLobbyToGameTransition
    && meta.listContext === "menu"
    && members.size > 0
  ) {
    meta.pendingTransitionCount = 0;
    meta.pendingTransitionUntil = 0;
  }
  if (members.size === 0) {
    if (preserveEmptyRoom) {
      return;
    }
    if (hasLiveChildRoomForParent(code)) {
      return;
    }
    rooms.delete(code);
    roomMeta.delete(code);
  } else {
    ensureHostPeerId(code);
  }
}

function sendJson(ws, payload) {
  if (ws.readyState !== ws.OPEN) return;
  ws.send(JSON.stringify(payload));
}

function evictDuplicatePeerConnections(ws) {
  if (!ws?.peerId) return false;
  let changed = false;
  for (const members of rooms.values()) {
    if (!members || members.size === 0) continue;
    for (const member of [...members]) {
      if (member === ws) continue;
      const samePeer = Boolean(ws.peerId && member.peerId && member.peerId === ws.peerId);
      if (!samePeer) continue;
      removeFromRoom(member);
      changed = true;
      try {
        member.close();
      } catch {
        // ignore close error
      }
    }
  }
  return changed;
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
  const type = String(payload?.type || "");
  const quickJoin = type === "quick-join";
  const isJoinIntent = type === "hello" || quickJoin;
  const requestedListContextRaw = String(payload?.listContext || "").trim().toLowerCase();
  const requestedListContext = requestedListContextRaw === "game" || requestedListContextRaw === "menu"
    ? requestedListContextRaw
    : "";
  let code = quickJoin ? pickQuickJoinRoomCode() : normalizeRoomCode(payload.room);
  const explicitCreate = asBoolean(payload?.create, false);
  const requestedSourceCode = normalizeRoomCode(payload?.sourceRoom);

  if (!code && ws.roomCode) {
    code = ws.roomCode;
  }

  if (quickJoin && !code) {
    code = allocateRoomCode();
  }

  if (!quickJoin && !code && explicitCreate && type === "hello") {
    code = allocateRoomCode();
  }

  if (!code) {
    if (isJoinIntent) {
      sendJson(ws, { type: "error", code: "ROOM_REQUIRED" });
    }
    return { ok: false, joined: false };
  }

  if (ws.roomCode && ws.roomCode !== code) {
    if (!isJoinIntent) {
      code = ws.roomCode;
    } else {
      const currentCode = normalizeRoomCode(ws.roomCode);
      const sourceCode = requestedSourceCode;
      const preserveSourceRoom = Boolean(
        explicitCreate
        && sourceCode
        && currentCode
        && currentCode === sourceCode
        && sourceCode !== code,
      );
      if (preserveSourceRoom) {
        removeFromRoom(ws, { preserveEmptyRoom: true, preserveHostPeerId: true });
      } else {
        removeFromRoom(ws);
      }
      ws.roomCode = null;
    }
  }

  evictDuplicatePeerConnections(ws);
  const members = roomOf(code);
  const requestedSpectate = asSpectateBoolean(payload?.spectate);
  const meta = roomMetaOf(code);
  const roomCapacity = normalizeRoomMaxPlayers(meta.maxPlayers, DEFAULT_ROOM_MAX_PLAYERS);
  if (!ws.roomCode && members.size >= roomCapacity) {
    sendJson(ws, { type: "room-full", code, maxPlayers: roomCapacity });
    return { ok: false, joined: false };
  }

  if (ws.peerId && meta.hostPeerId === ws.peerId && !meta.inGame) {
    meta.maxPlayers = normalizeRoomMaxPlayers(payload?.maxPlayers, meta.maxPlayers);
  }

  const requestedRoomPassword = normalizeRoomPassword(payload?.roomPassword);
  const inviteToken = String(payload?.inviteToken || "").trim();
  if (!ws.roomCode && meta.accessPassword && ws.peerId !== meta.hostPeerId) {
    if (!requestedRoomPassword) {
      sendError(ws, "ROOM_PASSWORD_REQUIRED");
      return { ok: false, joined: false };
    }
    if (requestedRoomPassword !== meta.accessPassword) {
      sendError(ws, "ROOM_PASSWORD_INVALID");
      return { ok: false, joined: false };
    }
  }
  const requiresInviteToken = !meta.isPublic && !meta.accessPassword;
  if (!ws.roomCode && requiresInviteToken && ws.peerId !== meta.hostPeerId) {
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
  let assignedRole = "guest";
  if (!ws.roomCode) {
    ws.roomCode = code;
    members.add(ws);
    ws.spectator = requestedSpectate;
    joined = true;
    if (members.size === 1) {
      meta.listContext = requestedListContext || (ws.currentPanel ? "game" : "menu");
    }
    if (!meta.hostPeerId && ws.peerId && !ws.spectator) {
      meta.hostPeerId = ws.peerId;
      meta.hostNameSnapshot = normalizePlayerName(ws.playerName || "Player");
      assignedRole = "host";
    } else if (ws.spectator) {
      assignedRole = "spectator";
    }
    if (explicitCreate && requestedListContext === "game" && ws.peerId && !ws.spectator) {
      meta.hostPeerId = ws.peerId;
      meta.hostNameSnapshot = normalizePlayerName(ws.playerName || "Player");
      assignedRole = "host";
    }
    if (quickJoin && members.size === 1) {
      meta.isPublic = true;
    }
    if (explicitCreate) {
      const sourceCode = requestedSourceCode;
      if (sourceCode && sourceCode !== code) {
        roomOf(sourceCode);
        const sourceMeta = roomMetaOf(sourceCode);
        if (sourceMeta.listContext !== "menu") {
          sourceMeta.listContext = "menu";
        }
        sourceMeta.pendingTransitionCount = 0;
        sourceMeta.pendingTransitionUntil = 0;
        meta.parentRoomCode = sourceCode;
        grantPrivateAccessFromSourceRoom(meta, sourceCode);
      }
    }
    if (ws.peerId) {
      meta.privateAccessPeerIds.add(ws.peerId);
    }
  }

  ensureHostPeerId(code);

  if (ws.spectator) {
    assignedRole = "spectator";
  } else if (ws.peerId && meta.hostPeerId === ws.peerId) {
    meta.hostNameSnapshot = normalizePlayerName(ws.playerName || "Player");
    assignedRole = "host";
  }

  const requestedPublic = asBoolean(payload?.roomPublic, meta.isPublic);
  if (ws.peerId && meta.hostPeerId === ws.peerId) {
    meta.isPublic = requestedPublic;
    if (explicitCreate) {
      meta.listContext = requestedListContext || (ws.currentPanel ? "game" : "menu");
      meta.accessPassword = requestedRoomPassword;
      meta.maxPlayers = normalizeRoomMaxPlayers(payload?.maxPlayers, meta.maxPlayers);
    }
  }

  return {
    ok: true,
    joined,
    code,
    quickJoin,
    assignedRole,
    isPublic: Boolean(meta.isPublic),
  };
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
      panel: normalizePlayablePanel(member.currentPanel),
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
    maxPlayers: normalizeRoomMaxPlayers(meta.maxPlayers, DEFAULT_ROOM_MAX_PLAYERS),
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
  const required = Math.max(2, activePlayerCount(code));
  broadcastRoom(code, {
    type: "rematch-vote-state",
    room: code,
    votes: [...meta.rematchVotes],
    required,
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

  if (requestUrl.pathname.startsWith("/api/")) {
    try {
      await proxyApiRequest(req, res, requestUrl);
    } catch (err) {
      sendApiJson(res, 500, {
        ok: false,
        code: "SERVER_ERROR",
        message: err?.message || "Internal server error",
      });
    }
    return;
  }

  if (WEB_APP_BASE) {
    try {
      const proxied = await proxyWebAppRequest(req, res, requestUrl);
      if (proxied) return;
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({
        ok: false,
        code: "WEB_APP_PROXY_ERROR",
        message: err?.message || "Web app proxy failed",
      }));
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
  ws.currentPanel = "";
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
    if (Object.prototype.hasOwnProperty.call(payload, "panel")) {
      ws.currentPanel = normalizePlayablePanel(payload.panel);
    }
    ws.spectator = asSpectateBoolean(payload?.spectate || ws.spectator);
    const type = String(payload.type || "");
    if (type === "list-rooms") {
      const requestedListContextRaw = String(payload?.listContext || "").trim().toLowerCase();
      const requestedListContext = requestedListContextRaw === "menu" || requestedListContextRaw === "game"
        ? requestedListContextRaw
        : "all";
      sendJson(ws, {
        type: "rooms-list",
        listContext: requestedListContext,
        rooms: listPublicRooms(80, requestedListContext),
        fetchedAt: nowTs(),
      });
      return;
    }

    const joinResult = joinRoom(ws, payload);
    if (!joinResult.ok) return;

    const code = ws.roomCode;
    if (!code) return;

    if (typeof payload.name === "string") {
      ws.playerName = normalizePlayerName(payload.name);
    }
    if (typeof payload.avatar === "string") {
      ws.playerAvatar = normalizeAvatarDataUrl(payload.avatar);
    }

    if (type === "quick-join") {
      const meta = roomMetaOf(code);
      const roomListContext = meta.listContext === "game" ? "game" : "menu";
      const parentRoomCode = normalizeRoomCode(meta.parentRoomCode);
      sendJson(ws, {
        type: "room-assigned",
        code: joinResult.code,
        role: joinResult.assignedRole,
        roomPublic: joinResult.isPublic,
        listContext: roomListContext,
        parentRoomCode,
        participants: roomParticipants(code),
      });
      broadcastRoomState(code);
      broadcastRoomsList();
      return;
    }

    if (type === "hello") {
      const meta = roomMetaOf(code);
      const roomListContext = meta.listContext === "game" ? "game" : "menu";
      const parentRoomCode = normalizeRoomCode(meta.parentRoomCode);
      sendJson(ws, {
        type: "room-assigned",
        code,
        role: joinResult.assignedRole,
        roomPublic: joinResult.isPublic,
        listContext: roomListContext,
        parentRoomCode,
        participants: roomParticipants(code),
      });
      broadcastRoomsList();
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
      const meta = roomMetaOf(code);
      unlockMatchForLobby(code);
      const parentRoomCode = normalizeRoomCode(meta.parentRoomCode);
      if (parentRoomCode && parentRoomCode !== code && rooms.has(parentRoomCode)) {
        removeFromRoom(ws);
        ws.roomCode = null;

        const parentMembers = roomOf(parentRoomCode);
        const parentMeta = roomMetaOf(parentRoomCode);
        ws.spectator = false;
        ws.roomCode = parentRoomCode;
        parentMembers.add(ws);
        if (ws.peerId) {
          parentMeta.privateAccessPeerIds.add(ws.peerId);
        }
        ensureHostPeerId(parentRoomCode);

        const nextRole = ws.peerId && parentMeta.hostPeerId === ws.peerId ? "host" : "guest";
        const parentListContext = parentMeta.listContext === "game" ? "game" : "menu";
        const parentParentRoomCode = normalizeRoomCode(parentMeta.parentRoomCode);
        sendJson(ws, {
          type: "room-assigned",
          code: parentRoomCode,
          role: nextRole,
          roomPublic: Boolean(parentMeta.isPublic),
          listContext: parentListContext,
          parentRoomCode: parentParentRoomCode,
          participants: roomParticipants(parentRoomCode),
        });

        broadcastRoomState(code);
        broadcastRoomState(parentRoomCode);
        broadcastRoomsList();
        return;
      }
      broadcastRoomState(code);
      broadcastRoomsList();
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

      const requiredVotes = Math.max(2, activePlayerCount(code));
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

    if (type === "rematch-unvote") {
      const meta = roomMetaOf(code);
      if (!canVoteRematch(meta, ws)) {
        sendError(ws, "REMATCH_VOTE_FORBIDDEN");
        return;
      }
      meta.rematchVotes.delete(ws.peerId);
      broadcastRematchVoteState(code);
      return;
    }

    if (type === "uno-request-action") {
      const action = String(payload?.action || "").trim();
      if (action !== "play" && action !== "draw") {
        sendError(ws, "UNO_ACTION_INVALID");
        return;
      }
      if (action === "play") {
        const cardIds = Array.isArray(payload?.cardIds)
          ? payload.cardIds.map((id) => String(id || "").trim()).filter(Boolean)
          : [];
        if (cardIds.length <= 0) {
          sendError(ws, "UNO_CARD_IDS_REQUIRED");
          return;
        }
        const unique = new Set(cardIds);
        if (unique.size !== cardIds.length) {
          sendError(ws, "UNO_DUPLICATE_CARD_ID");
          return;
        }
        payload.cardIds = cardIds;
      }
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
      broadcastRoomsList();
    }

    if (joinResult.joined || payload.type === "hello" || payload.type === "presence") {
      broadcastRoomState(code);
      if (joinResult.joined) {
        broadcastRoomsList();
      }
    }

    const envelope = {
      ...payload,
      room: code,
      from: ws.peerId || String(payload.from || ""),
    };

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
    broadcastRoomsList();
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
