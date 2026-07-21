import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { WebSocketServer, WebSocket } from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

const HOST = process.env.SHARE_HOST || "0.0.0.0";
const PORT = Number(process.env.SHARE_PORT || 4173);
const ROOM_PATH = process.env.ROOM_PATH || "/room";
const MAX_ROOM_PLAYERS = Number(process.env.ROOM_MAX_PLAYERS || 8);
const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "profiles.json");
const INQUIRY_PATH = path.join(DATA_DIR, "inquiries.json");

const GAME_KEYS = ["othello", "shogi", "chess", "uno", "gomoku", "survivors", "fitPuzzle", "solitaire", "sevens"];

function createDefaultGameData() {
  const gameData = {};
  GAME_KEYS.forEach((key) => {
    gameData[key] = {
      playCount: 0,
      roomPlayCount: 0,
      lastPlayedAt: null,
    };
  });
  return gameData;
}

const DEFAULT_PROFILE = {
  bankCoins: 0,
  pityCounter: 0,
  unlockedSkins: ["classic"],
  selectedSkin: "classic",
  playerName: "Player",
  gameData: createDefaultGameData(),
  fitPuzzleProgress: {
    highestUnlockedStage: 0,
    selectedStageIndex: 0,
    difficulty: "normal",
    noRotateMode: false,
    updatedAt: null,
  },
};

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

function readInquiries() {
  ensureDb();
  if (!fs.existsSync(INQUIRY_PATH)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(INQUIRY_PATH, "utf8");
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeInquiries(items) {
  ensureDb();
  fs.writeFileSync(INQUIRY_PATH, JSON.stringify(items, null, 2), "utf8");
}

function sanitizeInquiry(raw) {
  const name = String(raw?.name || "").trim().slice(0, 40);
  const message = String(raw?.message || "").trim().slice(0, 1200);
  const url = String(raw?.url || "").trim().slice(0, 400);
  const lang = String(raw?.lang || "").trim().slice(0, 10);
  return {
    id: crypto.randomUUID(),
    name,
    message,
    url,
    lang,
    submittedAt: new Date().toISOString(),
  };
}

function ensureInquiryId(item) {
  if (item && typeof item === "object" && typeof item.id === "string" && item.id.trim()) {
    return item;
  }
  return {
    ...(item && typeof item === "object" ? item : {}),
    id: crypto.randomUUID(),
  };
}

function normalizeInquiryList(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ensureInquiryId(item));
}

function normalizeInquiryLimit(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 50;
  return Math.max(1, Math.min(200, Math.floor(n)));
}

function selectLatestInquiries(items, limit = 50) {
  const safeLimit = normalizeInquiryLimit(limit);
  return items.slice(-safeLimit).reverse();
}

function removeInquiryById(items, inquiryId) {
  const list = normalizeInquiryList(items);
  const targetId = String(inquiryId || "").trim();
  const index = list.findIndex((item) => String(item?.id || "") === targetId);
  if (index < 0) {
    return { removed: false, items: list };
  }
  list.splice(index, 1);
  return { removed: true, items: list };
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
  const gameData = createDefaultGameData();
  const fitPuzzleProgress = {
    highestUnlockedStage: 0,
    selectedStageIndex: 0,
    difficulty: "normal",
    noRotateMode: false,
    customStages: [],
    updatedAt: null,
  };

  if (profile?.gameData && typeof profile.gameData === "object") {
    GAME_KEYS.forEach((key) => {
      const src = profile.gameData[key];
      if (!src || typeof src !== "object") return;
      const playCount = Number(src.playCount);
      const roomPlayCount = Number(src.roomPlayCount);
      const lastPlayedAt = typeof src.lastPlayedAt === "string" && src.lastPlayedAt.trim()
        ? src.lastPlayedAt.trim().slice(0, 64)
        : null;
      gameData[key] = {
        playCount: Number.isFinite(playCount) ? Math.max(0, Math.floor(playCount)) : 0,
        roomPlayCount: Number.isFinite(roomPlayCount) ? Math.max(0, Math.floor(roomPlayCount)) : 0,
        lastPlayedAt,
      };
    });
  }

  if (profile?.fitPuzzleProgress && typeof profile.fitPuzzleProgress === "object") {
    const rawHighest = Number(profile.fitPuzzleProgress.highestUnlockedStage);
    const rawSelected = Number(profile.fitPuzzleProgress.selectedStageIndex);
    fitPuzzleProgress.highestUnlockedStage = Number.isFinite(rawHighest) ? Math.max(0, Math.floor(rawHighest)) : 0;
    fitPuzzleProgress.selectedStageIndex = Number.isFinite(rawSelected)
      ? Math.max(0, Math.min(fitPuzzleProgress.highestUnlockedStage, Math.floor(rawSelected)))
      : 0;
    fitPuzzleProgress.difficulty =
      profile.fitPuzzleProgress.difficulty === "easy" ||
      profile.fitPuzzleProgress.difficulty === "normal" ||
      profile.fitPuzzleProgress.difficulty === "hard"
        ? profile.fitPuzzleProgress.difficulty
        : "normal";
    fitPuzzleProgress.noRotateMode = Boolean(profile.fitPuzzleProgress.noRotateMode);
    if (Array.isArray(profile.fitPuzzleProgress.customStages)) {
      fitPuzzleProgress.customStages = profile.fitPuzzleProgress.customStages.map((raw, idx) => {
        const rows = Math.max(4, Math.min(12, Number.isFinite(Number(raw?.rows)) ? Math.floor(Number(raw.rows)) : 10));
        const cols = Math.max(4, Math.min(12, Number.isFinite(Number(raw?.cols)) ? Math.floor(Number(raw.cols)) : 10));
        const maxCells = rows * cols;
        const pieceCount = Math.max(2, Math.min(maxCells, Number.isFinite(Number(raw?.pieceCount)) ? Math.floor(Number(raw.pieceCount)) : Math.max(2, Math.floor(maxCells / 2))));
        const bias = raw?.profile?.bias === "long" || raw?.profile?.bias === "blocks" ? raw.profile.bias : "balanced";
        const mutationSteps = Math.max(0, Math.min(20000, Number.isFinite(Number(raw?.profile?.mutationSteps)) ? Math.floor(Number(raw.profile.mutationSteps)) : rows * cols * 6));
        const minComplex = Math.max(0, Math.min(200, Number.isFinite(Number(raw?.profile?.minComplex)) ? Math.floor(Number(raw.profile.minComplex)) : 0));
        const minBranch = Math.max(0, Math.min(200, Number.isFinite(Number(raw?.profile?.minBranch)) ? Math.floor(Number(raw.profile.minBranch)) : 0));
        const openingRotation = raw?.openingRotation === "mostly-rotated" ? "mostly-rotated" : "mixed";
        const assistLimit = Math.max(0, Math.min(10, Number.isFinite(Number(raw?.assistLimit)) ? Math.floor(Number(raw.assistLimit)) : 0));
        const seed = Math.max(1, Number.isFinite(Number(raw?.seed)) ? Math.floor(Number(raw.seed)) : 10001 + idx * 101);
        const title = String(raw?.title || `カスタム-${idx + 1}`).trim().slice(0, 40) || `カスタム-${idx + 1}`;
        return {
          rows,
          cols,
          pieceCount,
          title,
          profile: {
            bias,
            mutationSteps,
            minComplex,
            minBranch,
          },
          openingRotation,
          assistLimit,
          seed,
        };
      });
    }
    fitPuzzleProgress.updatedAt =
      typeof profile.fitPuzzleProgress.updatedAt === "string" && profile.fitPuzzleProgress.updatedAt.trim()
        ? profile.fitPuzzleProgress.updatedAt.trim().slice(0, 64)
        : null;
  }

  return {
    bankCoins,
    pityCounter,
    unlockedSkins: [...new Set(unlockedSkins)],
    selectedSkin: unlockedSkins.includes(selectedSkin) ? selectedSkin : "classic",
    playerName,
    gameData,
    fitPuzzleProgress,
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
  if (members.size === 0) {
    rooms.delete(code);
  }
}

function sendJson(ws, payload) {
  if (ws.readyState !== WebSocket.OPEN) return;
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
  if (!ws.roomCode && members.size >= MAX_ROOM_PLAYERS) {
    sendJson(ws, { type: "room-full", code });
    return { ok: false, joined: false };
  }

  let joined = false;
  if (!ws.roomCode) {
    ws.roomCode = code;
    members.add(ws);
    joined = true;
  }

  return { ok: true, joined };
}

function roomParticipants(code) {
  const members = rooms.get(code);
  if (!members) return [];
  const participants = [];
  for (const member of members) {
    if (!member.peerId) continue;
    participants.push({
      id: member.peerId,
      name: normalizePlayerName(member.playerName || "Player"),
    });
  }
  return participants;
}

function broadcastRoomState(code) {
  if (!code) return;
  broadcastRoom(code, { type: "room-state", room: code, participants: roomParticipants(code) });
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

  if (requestUrl.pathname === "/api/profile/load" || requestUrl.pathname === "/api/profile/save" || requestUrl.pathname === "/api/inquiry" || requestUrl.pathname === "/api/inquiry/list" || requestUrl.pathname === "/api/inquiry/delete") {
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

      if (requestUrl.pathname === "/api/inquiry") {
        const inquiry = sanitizeInquiry(body);
        if (!inquiry.message) {
          sendApiJson(res, 400, { ok: false, code: "INQUIRY_REQUIRED", message: "message is required" });
          return;
        }
        const list = normalizeInquiryList(readInquiries());
        list.push(inquiry);
        if (list.length > 1000) {
          list.splice(0, list.length - 1000);
        }
        writeInquiries(list);
        sendApiJson(res, 200, { ok: true });
        return;
      }

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

      if (requestUrl.pathname === "/api/inquiry/list") {
        const items = selectLatestInquiries(normalizeInquiryList(readInquiries()), body?.limit);
        sendApiJson(res, 200, { ok: true, items });
        return;
      }

      if (requestUrl.pathname === "/api/inquiry/delete") {
        const inquiryId = String(body?.id || "").trim();
        if (!inquiryId) {
          sendApiJson(res, 400, { ok: false, code: "INQUIRY_ID_REQUIRED", message: "id is required" });
          return;
        }
        const result = removeInquiryById(readInquiries(), inquiryId);
        if (!result.removed) {
          sendApiJson(res, 404, { ok: false, code: "INQUIRY_NOT_FOUND", message: "inquiry not found" });
          return;
        }
        writeInquiries(result.items);
        sendApiJson(res, 200, { ok: true });
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

      const mergedProfile = {
        ...(auth.user.profile || DEFAULT_PROFILE),
        ...(body?.profile && typeof body.profile === "object" ? body.profile : {}),
      };
      const nextProfile = sanitizeProfile(mergedProfile);
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
  const isIndexHtml = filePath === path.join(distDir, "index.html");
  const isHashedAsset = requestPath.startsWith("/assets/");

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    const headers = { "Content-Type": contentType };
    if (isIndexHtml) {
      // Always revalidate HTML so clients pick up latest hashed bundles after deploy.
      headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
      headers.Pragma = "no-cache";
      headers.Expires = "0";
    } else if (isHashedAsset) {
      headers["Cache-Control"] = "public, max-age=31536000, immutable";
    }

    res.writeHead(200, headers);
    res.end(data);
  });
});

const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (ws) => {
  ws.roomCode = null;
  ws.peerId = null;
  ws.playerName = "Player";

  ws.on("message", (raw) => {
    let payload = null;
    try {
      payload = JSON.parse(String(raw || "{}"));
    } catch {
      return;
    }

    if (!payload || typeof payload !== "object") return;
    const joinResult = joinRoom(ws, payload);
    if (!joinResult.ok) return;

    ws.peerId = String(payload.from || ws.peerId || "").trim() || ws.peerId;
    if (typeof payload.name === "string") {
      ws.playerName = normalizePlayerName(payload.name);
    }

    if (joinResult.joined || payload.type === "hello" || payload.type === "presence") {
      broadcastRoomState(ws.roomCode);
    }

    const envelope = {
      ...payload,
      room: ws.roomCode,
      from: ws.peerId || String(payload.from || ""),
    };

    const members = rooms.get(ws.roomCode);
    if (!members) return;

    if (payload.to) {
      for (const member of members) {
        if (member.peerId === payload.to) {
          sendJson(member, envelope);
          return;
        }
      }
      return;
    }

    broadcastRoom(ws.roomCode, envelope, ws);
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
