import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { DatabaseSync } from "node:sqlite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "data");
const LEGACY_JSON_PATH = path.join(DATA_DIR, "profiles.json");
const SQLITE_PATH = process.env.A5M2_DB_PATH || path.join(DATA_DIR, "a5m2.sqlite");
const HOST = process.env.CLOUD_HOST || "0.0.0.0";
const PORT = Number(process.env.CLOUD_PORT || 8787);
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);
const ENABLE_LEGACY_JSON_MIGRATION = String(process.env.ENABLE_LEGACY_JSON_MIGRATION || "false").toLowerCase() === "true";

const DEFAULT_PROFILE = {
  bankCoins: 0,
  pityCounter: 0,
  unlockedSkins: ["classic"],
  selectedSkin: "classic",
  playerName: "Player",
  playerAvatar: "",
  matchStats: {
    total: 0,
    win: 0,
    lose: 0,
    draw: 0,
    byGame: {},
  },
  recentMatches: [],
};

const MATCH_RECENT_LIMIT = 60;
const MATCH_RESULT_VALUES = new Set(["win", "lose", "draw"]);

let db = null;

function normalizePlayerName(raw) {
  const trimmed = String(raw || "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "Player";
  return trimmed.slice(0, 18);
}

function normalizeAvatarDataUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";
  if (value.length > 180000) return "";
  if (!/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(value)) return "";
  return value;
}

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function cloneDefaultProfile() {
  return JSON.parse(JSON.stringify(DEFAULT_PROFILE));
}

function safeParseProfileJson(raw) {
  try {
    const parsed = JSON.parse(String(raw || "{}"));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function initSqlite() {
  ensureDb();
  db = new DatabaseSync(SQLITE_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      pass_salt_hex TEXT NOT NULL,
      pass_hash_hex TEXT NOT NULL,
      profile_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS match_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      game TEXT NOT NULL,
      result TEXT NOT NULL,
      room_code TEXT NOT NULL,
      opponent TEXT NOT NULL,
      played_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_match_records_user_time
      ON match_records(user_id, played_at DESC);
    CREATE TABLE IF NOT EXISTS friends (
      user_id TEXT NOT NULL,
      friend_user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, friend_user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_friends_user
      ON friends(user_id);
  `);

  ensureAuthColumns();

  migrateLegacyJsonIfNeeded();
}

function ensureAuthColumns() {
  const columns = db.prepare("PRAGMA table_info(users)").all();
  const hasBcrypt = columns.some((col) => col?.name === "pass_hash_bcrypt");
  if (!hasBcrypt) {
    db.exec("ALTER TABLE users ADD COLUMN pass_hash_bcrypt TEXT NOT NULL DEFAULT ''");
  }
}

function readUser(userId) {
  const row = db.prepare(`
    SELECT user_id, pass_salt_hex, pass_hash_hex, pass_hash_bcrypt, profile_json, created_at, updated_at
    FROM users
    WHERE user_id = ?
  `).get(userId);
  if (!row) return null;
  return {
    userId: row.user_id,
    passSaltHex: row.pass_salt_hex,
    passHashHex: row.pass_hash_hex,
    passHashBcrypt: String(row.pass_hash_bcrypt || ""),
    profile: safeParseProfileJson(row.profile_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function insertUser({ userId, passSaltHex, passHashHex, passHashBcrypt, profile }) {
  const now = Date.now();
  db.prepare(`
    INSERT INTO users (user_id, pass_salt_hex, pass_hash_hex, pass_hash_bcrypt, profile_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, passSaltHex, passHashHex, passHashBcrypt, JSON.stringify(profile), now, now);
}

function updateUserPasswordHashBcrypt({ userId, passHashBcrypt }) {
  db.prepare(`
    UPDATE users
    SET pass_hash_bcrypt = ?, updated_at = ?
    WHERE user_id = ?
  `).run(passHashBcrypt, Date.now(), userId);
}

function updateUserProfile({ userId, profile }) {
  db.prepare(`
    UPDATE users
    SET profile_json = ?, updated_at = ?
    WHERE user_id = ?
  `).run(JSON.stringify(profile), Date.now(), userId);
}

function insertMatchRecord({ userId, game, result, roomCode, opponent, playedAt }) {
  db.prepare(`
    INSERT INTO match_records (user_id, game, result, room_code, opponent, played_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, game, result, roomCode, opponent, playedAt);
}

function migrateLegacyJsonIfNeeded() {
  if (!ENABLE_LEGACY_JSON_MIGRATION) return;

  const userCountRow = db.prepare("SELECT COUNT(*) AS count FROM users").get();
  const userCount = Number(userCountRow?.count || 0);
  if (userCount > 0) return;
  if (!fs.existsSync(LEGACY_JSON_PATH)) return;

  const raw = fs.readFileSync(LEGACY_JSON_PATH, "utf8");
  const parsed = JSON.parse(raw || "{}");
  const users = parsed?.users && typeof parsed.users === "object" ? parsed.users : {};
  const entries = Object.entries(users);
  if (entries.length === 0) return;

  const tx = db.prepare(`
    INSERT INTO users (user_id, pass_salt_hex, pass_hash_hex, pass_hash_bcrypt, profile_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const now = Date.now();
  db.exec("BEGIN");
  try {
    for (const [userId, row] of entries) {
      if (!row || typeof row !== "object") continue;
      if (!row.passSaltHex || !row.passHashHex) continue;
      const profile = sanitizeProfile(row.profile || cloneDefaultProfile(), cloneDefaultProfile());
      const createdAt = Number.isFinite(row.createdAt) ? Math.floor(row.createdAt) : now;
      const updatedAt = Number.isFinite(row.updatedAt) ? Math.floor(row.updatedAt) : now;
      tx.run(userId, row.passSaltHex, row.passHashHex, "", JSON.stringify(profile), createdAt, updatedAt);
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

function sendJson(res, status, payload) {
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

function hashPasswordLegacyScrypt(password, saltHex) {
  const salt = saltHex ? Buffer.from(saltHex, "hex") : crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, 64);
  return {
    saltHex: salt.toString("hex"),
    hashHex: key.toString("hex"),
  };
}

function hashPasswordBcrypt(password) {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

function verifyPasswordLegacyScrypt(password, storedSaltHex, storedHashHex) {
  const { hashHex } = hashPasswordLegacyScrypt(password, storedSaltHex);
  const a = Buffer.from(hashHex, "hex");
  const b = Buffer.from(storedHashHex, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function verifyPassword(password, user) {
  const bcryptHash = String(user?.passHashBcrypt || "");
  if (bcryptHash) {
    return bcrypt.compareSync(password, bcryptHash);
  }

  const hasLegacy = Boolean(user?.passSaltHex && user?.passHashHex);
  if (!hasLegacy) return false;
  return verifyPasswordLegacyScrypt(password, user.passSaltHex, user.passHashHex);
}

function sanitizeMatchStats(stats) {
  const total = Number.isFinite(stats?.total) ? Math.max(0, Math.floor(stats.total)) : 0;
  const win = Number.isFinite(stats?.win) ? Math.max(0, Math.floor(stats.win)) : 0;
  const lose = Number.isFinite(stats?.lose) ? Math.max(0, Math.floor(stats.lose)) : 0;
  const draw = Number.isFinite(stats?.draw) ? Math.max(0, Math.floor(stats.draw)) : 0;

  const byGame = {};
  if (stats?.byGame && typeof stats.byGame === "object") {
    for (const [gameKey, value] of Object.entries(stats.byGame)) {
      if (typeof gameKey !== "string" || !gameKey) continue;
      const row = value && typeof value === "object" ? value : {};
      byGame[gameKey] = {
        total: Number.isFinite(row.total) ? Math.max(0, Math.floor(row.total)) : 0,
        win: Number.isFinite(row.win) ? Math.max(0, Math.floor(row.win)) : 0,
        lose: Number.isFinite(row.lose) ? Math.max(0, Math.floor(row.lose)) : 0,
        draw: Number.isFinite(row.draw) ? Math.max(0, Math.floor(row.draw)) : 0,
      };
    }
  }

  return {
    total,
    win,
    lose,
    draw,
    byGame,
  };
}

function sanitizeRecentMatches(matches) {
  if (!Array.isArray(matches)) return [];
  const normalized = [];

  for (const row of matches) {
    if (!row || typeof row !== "object") continue;
    const game = String(row.game || "").trim().slice(0, 24);
    const result = String(row.result || "").trim().toLowerCase();
    if (!game) continue;
    if (!MATCH_RESULT_VALUES.has(result)) continue;

    const playedAt = Number.isFinite(row.playedAt) ? Math.max(0, Math.floor(row.playedAt)) : Date.now();
    const roomCode = typeof row.roomCode === "string" ? row.roomCode.trim().slice(0, 12) : "";
    const opponent = typeof row.opponent === "string" ? normalizePlayerName(row.opponent) : "";

    normalized.push({
      game,
      result,
      playedAt,
      roomCode,
      opponent,
    });
  }

  return normalized
    .sort((a, b) => b.playedAt - a.playedAt)
    .slice(0, MATCH_RECENT_LIMIT);
}

function normalizeGameKey(raw) {
  return String(raw || "").trim().slice(0, 24).toLowerCase();
}

function normalizeMatchResult(raw) {
  const value = String(raw || "").trim().toLowerCase();
  return MATCH_RESULT_VALUES.has(value) ? value : "";
}

function normalizeRoomCode(raw) {
  return String(raw || "").replace(/\D/g, "").slice(0, 6);
}

function normalizeUserId(raw) {
  return String(raw || "").trim().slice(0, 24);
}

function listFriends(userId) {
  const rows = db.prepare(`
    SELECT friend_user_id
    FROM friends
    WHERE user_id = ?
    ORDER BY friend_user_id COLLATE NOCASE ASC
  `).all(userId);
  return rows
    .map((row) => normalizeUserId(row?.friend_user_id || ""))
    .filter(Boolean);
}

function addFriendBothWays(userId, friendUserId) {
  const now = Date.now();
  const insert = db.prepare(`
    INSERT OR IGNORE INTO friends (user_id, friend_user_id, created_at)
    VALUES (?, ?, ?)
  `);
  db.exec("BEGIN");
  try {
    insert.run(userId, friendUserId, now);
    insert.run(friendUserId, userId, now);
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

function removeFriendBothWays(userId, friendUserId) {
  const del = db.prepare(`
    DELETE FROM friends
    WHERE (user_id = ? AND friend_user_id = ?)
       OR (user_id = ? AND friend_user_id = ?)
  `);
  del.run(userId, friendUserId, friendUserId, userId);
}

function applyMatchRecord(profile, rawRecord) {
  const game = normalizeGameKey(rawRecord?.game);
  const result = normalizeMatchResult(rawRecord?.result);
  if (!game || !result) {
    return { ok: false, code: "INVALID_MATCH", message: "game and result are required" };
  }

  const next = sanitizeProfile(profile, profile);
  next.matchStats.total += 1;
  if (result === "win") next.matchStats.win += 1;
  if (result === "lose") next.matchStats.lose += 1;
  if (result === "draw") next.matchStats.draw += 1;

  if (!next.matchStats.byGame[game]) {
    next.matchStats.byGame[game] = { total: 0, win: 0, lose: 0, draw: 0 };
  }
  const row = next.matchStats.byGame[game];
  row.total += 1;
  if (result === "win") row.win += 1;
  if (result === "lose") row.lose += 1;
  if (result === "draw") row.draw += 1;

  const match = {
    game,
    result,
    playedAt: Date.now(),
    roomCode: normalizeRoomCode(rawRecord?.roomCode),
    opponent: typeof rawRecord?.opponent === "string" ? normalizePlayerName(rawRecord.opponent) : "",
  };

  next.recentMatches = [match, ...sanitizeRecentMatches(next.recentMatches)].slice(0, MATCH_RECENT_LIMIT);
  return { ok: true, profile: sanitizeProfile(next, next), match };
}

function sanitizeProfile(profile, baseProfile = DEFAULT_PROFILE) {
  const source = profile && typeof profile === "object" ? profile : {};
  const base = baseProfile && typeof baseProfile === "object" ? baseProfile : DEFAULT_PROFILE;

  const bankCoins = Number.isFinite(source.bankCoins)
    ? Math.max(0, Math.floor(source.bankCoins))
    : Number.isFinite(base.bankCoins)
      ? Math.max(0, Math.floor(base.bankCoins))
      : 0;
  const pityCounter = Number.isFinite(source.pityCounter)
    ? Math.max(0, Math.min(9, Math.floor(source.pityCounter)))
    : Number.isFinite(base.pityCounter)
      ? Math.max(0, Math.min(9, Math.floor(base.pityCounter)))
      : 0;
  const unlockedSkins = Array.isArray(source.unlockedSkins)
    ? source.unlockedSkins.filter((id) => typeof id === "string")
    : Array.isArray(base.unlockedSkins)
      ? base.unlockedSkins.filter((id) => typeof id === "string")
      : ["classic"];
  if (!unlockedSkins.includes("classic")) unlockedSkins.unshift("classic");
  const selectedSkin = typeof source.selectedSkin === "string"
    ? source.selectedSkin
    : typeof base.selectedSkin === "string"
      ? base.selectedSkin
      : "classic";
  const playerName = normalizePlayerName(source.playerName ?? base.playerName);
  const playerAvatar = normalizeAvatarDataUrl(source.playerAvatar ?? base.playerAvatar);

  const matchStats = sanitizeMatchStats(source.matchStats ?? base.matchStats);
  const recentMatches = sanitizeRecentMatches(source.recentMatches ?? base.recentMatches);

  return {
    bankCoins,
    pityCounter,
    unlockedSkins: [...new Set(unlockedSkins)],
    selectedSkin: unlockedSkins.includes(selectedSkin) ? selectedSkin : "classic",
    playerName,
    playerAvatar,
    matchStats,
    recentMatches,
  };
}

function authenticateOrCreate(db, userId, password) {
  const user = readUser(userId);
  if (!user) {
    const passHashBcrypt = hashPasswordBcrypt(password);
    insertUser({
      userId,
      passSaltHex: "",
      passHashHex: "",
      passHashBcrypt,
      profile: cloneDefaultProfile(),
    });
    return { ok: true, created: true, user: readUser(userId) };
  }

  const ok = verifyPassword(password, user);
  if (!ok) {
    return { ok: false };
  }

  if (!user.passHashBcrypt) {
    const passHashBcrypt = hashPasswordBcrypt(password);
    updateUserPasswordHashBcrypt({ userId, passHashBcrypt });
    user.passHashBcrypt = passHashBcrypt;
  }
  return { ok: true, created: false, user };
}

function authenticateOnly(userId, password) {
  const user = readUser(userId);
  if (!user) {
    return { ok: false, code: "USER_NOT_FOUND" };
  }
  const ok = verifyPassword(password, user);
  if (!ok) {
    return { ok: false, code: "INVALID_PASSWORD" };
  }

  if (!user.passHashBcrypt) {
    const passHashBcrypt = hashPasswordBcrypt(password);
    updateUserPasswordHashBcrypt({ userId, passHashBcrypt });
    user.passHashBcrypt = passHashBcrypt;
  }
  return { ok: true, user };
}

function registerUser(userId, password) {
  const existing = readUser(userId);
  if (existing) {
    return { ok: false, code: "USER_ALREADY_EXISTS" };
  }
  const passHashBcrypt = hashPasswordBcrypt(password);
  insertUser({
    userId,
    passSaltHex: "",
    passHashHex: "",
    passHashBcrypt,
    profile: cloneDefaultProfile(),
  });
  return { ok: true, user: readUser(userId) };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    return sendJson(res, 204, { ok: true });
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, code: "METHOD_NOT_ALLOWED", message: "POST only" });
  }

  if (
    req.url !== "/api/auth/login"
    && req.url !== "/api/auth/register"
    && req.url !== "/api/profile/load"
    && req.url !== "/api/profile/save"
    && req.url !== "/api/match/record"
    && req.url !== "/api/friends/list"
    && req.url !== "/api/friends/add"
    && req.url !== "/api/friends/remove"
  ) {
    return sendJson(res, 404, { ok: false, code: "NOT_FOUND", message: "Unknown endpoint" });
  }

  try {
    const body = await parseBody(req);
    const userId = normalizeUserId(body?.userId || "");
    const password = String(body?.password || "");

    if (!userId || !password) {
      return sendJson(res, 400, { ok: false, code: "AUTH_REQUIRED", message: "userId and password are required" });
    }

    if (req.url === "/api/auth/register") {
      const registered = registerUser(userId, password);
      if (!registered.ok) {
        if (registered.code === "USER_ALREADY_EXISTS") {
          return sendJson(res, 409, { ok: false, code: registered.code, message: "User already exists" });
        }
        return sendJson(res, 400, { ok: false, code: registered.code || "REGISTER_FAILED", message: "Register failed" });
      }
      return sendJson(res, 200, {
        ok: true,
        created: true,
        profile: sanitizeProfile(registered.user.profile || DEFAULT_PROFILE, DEFAULT_PROFILE),
      });
    }

    if (req.url === "/api/auth/login") {
      const auth = authenticateOnly(userId, password);
      if (!auth.ok) {
        const status = auth.code === "USER_NOT_FOUND" ? 404 : 401;
        return sendJson(res, status, { ok: false, code: auth.code, message: "Login failed" });
      }
      return sendJson(res, 200, {
        ok: true,
        profile: sanitizeProfile(auth.user.profile || DEFAULT_PROFILE, DEFAULT_PROFILE),
      });
    }

    const auth = authenticateOnly(userId, password);
    if (!auth.ok) {
      const status = auth.code === "USER_NOT_FOUND" ? 404 : 401;
      return sendJson(res, status, { ok: false, code: auth.code, message: "Authentication failed" });
    }

    if (req.url === "/api/profile/load") {
      return sendJson(res, 200, {
        ok: true,
        profile: sanitizeProfile(auth.user.profile || DEFAULT_PROFILE, DEFAULT_PROFILE),
      });
    }

    if (req.url === "/api/friends/list") {
      const friends = listFriends(userId);
      return sendJson(res, 200, { ok: true, friends });
    }

    if (req.url === "/api/friends/add") {
      const friendUserId = normalizeUserId(body?.friendUserId || "");
      if (!friendUserId) {
        return sendJson(res, 400, { ok: false, code: "FRIEND_ID_REQUIRED", message: "friendUserId is required" });
      }
      if (friendUserId === userId) {
        return sendJson(res, 400, { ok: false, code: "FRIEND_SELF_FORBIDDEN", message: "Cannot add yourself" });
      }
      const friendUser = readUser(friendUserId);
      if (!friendUser) {
        return sendJson(res, 404, { ok: false, code: "FRIEND_NOT_FOUND", message: "Friend user not found" });
      }
      addFriendBothWays(userId, friendUserId);
      const friends = listFriends(userId);
      return sendJson(res, 200, { ok: true, friends });
    }

    if (req.url === "/api/friends/remove") {
      const friendUserId = normalizeUserId(body?.friendUserId || "");
      if (!friendUserId) {
        return sendJson(res, 400, { ok: false, code: "FRIEND_ID_REQUIRED", message: "friendUserId is required" });
      }
      removeFriendBothWays(userId, friendUserId);
      const friends = listFriends(userId);
      return sendJson(res, 200, { ok: true, friends });
    }

    if (req.url === "/api/match/record") {
      const recorded = applyMatchRecord(auth.user.profile || DEFAULT_PROFILE, body?.match || {});
      if (!recorded.ok) {
        return sendJson(res, 400, {
          ok: false,
          code: recorded.code,
          message: recorded.message,
        });
      }

      auth.user.profile = recorded.profile;
      updateUserProfile({ userId, profile: auth.user.profile });
      insertMatchRecord({
        userId,
        game: recorded.match.game,
        result: recorded.match.result,
        roomCode: recorded.match.roomCode,
        opponent: recorded.match.opponent,
        playedAt: recorded.match.playedAt,
      });
      return sendJson(res, 200, {
        ok: true,
        match: recorded.match,
        matchStats: recorded.profile.matchStats,
      });
    }

    const nextProfile = sanitizeProfile(body?.profile || {}, auth.user.profile || DEFAULT_PROFILE);
    updateUserProfile({ userId, profile: nextProfile });
    return sendJson(res, 200, { ok: true, profile: nextProfile });
  } catch (err) {
    return sendJson(res, 500, {
      ok: false,
      code: "SERVER_ERROR",
      message: err?.message || "Internal server error",
    });
  }
});

initSqlite();

server.listen(PORT, HOST, () => {
  console.log(`Cloud save server running at http://${HOST}:${PORT}`);
  console.log(`A5M2 SQLite DB: ${SQLITE_PATH}`);
  console.log(`Legacy JSON migration: ${ENABLE_LEGACY_JSON_MIGRATION ? "enabled" : "disabled"}`);
});
