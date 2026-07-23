import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

type ApiResult = {
  ok: boolean;
  code: string;
  message: string;
  payload?: Record<string, unknown>;
};

type AuthInputResult =
  | { ok: false; code: string; message: string }
  | { ok: true; userId: string; password: string };

type AuthUserResult =
  | { ok: false; code: string; message: string }
  | { ok: true; user: UserRow };

type UserRow = {
  user_id: string;
  pass_hash_bcrypt: string;
  pass_salt_hex?: string;
  pass_hash_hex?: string;
  profile_json: string;
};

type MatchStats = {
  total: number;
  win: number;
  lose: number;
  draw: number;
  byGame: Record<string, { total: number; win: number; lose: number; draw: number }>;
};

type MatchRecord = {
  game: string;
  result: 'win' | 'lose' | 'draw';
  playedAt: number;
  roomCode: string;
  opponent: string;
};

type Profile = {
  bankCoins: number;
  pityCounter: number;
  unlockedSkins: string[];
  selectedSkin: string;
  playerName: string;
  playerAvatar: string;
  matchStats: MatchStats;
  recentMatches: MatchRecord[];
};

const MATCH_RECENT_LIMIT = 60;
const MATCH_RESULT_VALUES = new Set(['win', 'lose', 'draw']);
const DEFAULT_PROFILE: Profile = {
  bankCoins: 0,
  pityCounter: 0,
  unlockedSkins: ['classic'],
  selectedSkin: 'classic',
  playerName: 'Player',
  playerAvatar: '',
  matchStats: {
    total: 0,
    win: 0,
    lose: 0,
    draw: 0,
    byGame: {},
  },
  recentMatches: [],
};

@Injectable()
export class CloudService {
  private readonly dataDir = this.resolveDataDir();
  private readonly sqlitePath =
    process.env.A5M2_DB_PATH || resolve(this.dataDir, 'a5m2.sqlite');
  private readonly inquiryPath =
    process.env.INQUIRY_DB_PATH || resolve(this.dataDir, 'inquiries.json');
  private readonly bcryptRounds = Number(process.env.BCRYPT_ROUNDS || 12);
  private readonly db: DatabaseSync;

  constructor() {
    this.ensureDataDir();
    this.db = new DatabaseSync(this.sqlitePath);
    this.initTables();
  }

  register(body: Record<string, unknown>): ApiResult {
    const auth = this.authFromBody(body);
    if (!auth.ok) return auth;

    const existing = this.readUser(auth.userId);
    if (existing) {
      return { ok: false, code: 'USER_ALREADY_EXISTS', message: 'User already exists' };
    }

    const passwordHash = bcrypt.hashSync(auth.password, this.bcryptRounds);
    this.db
      .prepare(
        `
        INSERT INTO users (
          user_id,
          pass_salt_hex,
          pass_hash_hex,
          pass_hash_bcrypt,
          profile_json,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      )
      .run(
        auth.userId,
        '',
        '',
        passwordHash,
        JSON.stringify(DEFAULT_PROFILE),
        Date.now(),
        Date.now(),
      );

    return {
      ok: true,
      code: 'OK',
      message: 'registered',
      payload: {
        ok: true,
        created: true,
        profile: DEFAULT_PROFILE,
      },
    };
  }

  login(body: Record<string, unknown>): ApiResult {
    const auth = this.authenticate(body);
    if (!auth.ok) return auth;
    return {
      ok: true,
      code: 'OK',
      message: 'logged in',
      payload: {
        ok: true,
        profile: this.sanitizeProfile(this.parseProfile(auth.user.profile_json), DEFAULT_PROFILE),
      },
    };
  }

  loadProfile(body: Record<string, unknown>): ApiResult {
    const auth = this.authenticate(body);
    if (!auth.ok) return auth;
    return {
      ok: true,
      code: 'OK',
      message: 'profile loaded',
      payload: {
        ok: true,
        profile: this.sanitizeProfile(this.parseProfile(auth.user.profile_json), DEFAULT_PROFILE),
      },
    };
  }

  saveProfile(body: Record<string, unknown>): ApiResult {
    const auth = this.authenticate(body);
    if (!auth.ok) return auth;

    const current = this.sanitizeProfile(this.parseProfile(auth.user.profile_json), DEFAULT_PROFILE);
    const next = this.sanitizeProfile(body.profile, current);
    this.updateUserProfile(auth.user.user_id, next);

    return {
      ok: true,
      code: 'OK',
      message: 'profile saved',
      payload: {
        ok: true,
        profile: next,
      },
    };
  }

  recordMatch(body: Record<string, unknown>): ApiResult {
    const auth = this.authenticate(body);
    if (!auth.ok) return auth;

    const current = this.sanitizeProfile(this.parseProfile(auth.user.profile_json), DEFAULT_PROFILE);
    const recorded = this.applyMatchRecord(current, body.match);
    if (!recorded.ok) {
      return {
        ok: false,
        code: recorded.code,
        message: recorded.message,
      };
    }

    this.updateUserProfile(auth.user.user_id, recorded.profile);
    this.db
      .prepare(
        `
        INSERT INTO match_records (user_id, game, result, room_code, opponent, played_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      )
      .run(
        auth.user.user_id,
        recorded.match.game,
        recorded.match.result,
        recorded.match.roomCode,
        recorded.match.opponent,
        recorded.match.playedAt,
      );

    return {
      ok: true,
      code: 'OK',
      message: 'match recorded',
      payload: {
        ok: true,
        match: recorded.match,
        matchStats: recorded.profile.matchStats,
      },
    };
  }

  listFriends(body: Record<string, unknown>): ApiResult {
    const auth = this.authenticate(body);
    if (!auth.ok) return auth;
    return {
      ok: true,
      code: 'OK',
      message: 'friends loaded',
      payload: {
        ok: true,
        friends: this.listFriendsByUserId(auth.user.user_id),
      },
    };
  }

  removeFriend(body: Record<string, unknown>): ApiResult {
    const auth = this.authenticate(body);
    if (!auth.ok) return auth;
    const friendUserId = this.normalizeUserId(body.friendUserId);
    if (!friendUserId) {
      return { ok: false, code: 'FRIEND_ID_REQUIRED', message: 'friendUserId is required' };
    }

    this.db
      .prepare(
        `
        DELETE FROM friends
        WHERE (user_id = ? AND friend_user_id = ?)
          OR (user_id = ? AND friend_user_id = ?)
      `,
      )
      .run(auth.user.user_id, friendUserId, friendUserId, auth.user.user_id);

    return {
      ok: true,
      code: 'OK',
      message: 'friend removed',
      payload: {
        ok: true,
        friends: this.listFriendsByUserId(auth.user.user_id),
      },
    };
  }

  sendFriendRequest(body: Record<string, unknown>): ApiResult {
    const auth = this.authenticate(body);
    if (!auth.ok) return auth;

    const targetUserId = this.normalizeUserId(body.targetUserId ?? body.friendUserId);
    if (!targetUserId) {
      return { ok: false, code: 'FRIEND_ID_REQUIRED', message: 'targetUserId is required' };
    }
    if (targetUserId === auth.user.user_id) {
      return { ok: false, code: 'FRIEND_SELF_FORBIDDEN', message: 'Cannot add yourself' };
    }
    if (!this.readUser(targetUserId)) {
      return { ok: false, code: 'FRIEND_NOT_FOUND', message: 'Friend user not found' };
    }
    if (this.areAlreadyFriends(auth.user.user_id, targetUserId)) {
      return { ok: false, code: 'ALREADY_FRIENDS', message: 'Already friends' };
    }
    if (this.hasPendingRequest(auth.user.user_id, targetUserId)) {
      return { ok: false, code: 'REQUEST_ALREADY_SENT', message: 'Request already sent' };
    }
    if (this.hasPendingRequest(targetUserId, auth.user.user_id)) {
      return { ok: false, code: 'REQUEST_ALREADY_RECEIVED', message: 'Request already received' };
    }

    this.db
      .prepare(
        `
        INSERT INTO friend_requests (requester_user_id, target_user_id, created_at)
        VALUES (?, ?, ?)
      `,
      )
      .run(auth.user.user_id, targetUserId, Date.now());

    return {
      ok: true,
      code: 'OK',
      message: 'request sent',
      payload: {
        ok: true,
        outgoing: this.listOutgoingByUserId(auth.user.user_id),
      },
    };
  }

  listIncomingFriendRequests(body: Record<string, unknown>): ApiResult {
    const auth = this.authenticate(body);
    if (!auth.ok) return auth;
    return {
      ok: true,
      code: 'OK',
      message: 'incoming requests loaded',
      payload: {
        ok: true,
        incoming: this.listIncomingByUserId(auth.user.user_id),
      },
    };
  }

  listOutgoingFriendRequests(body: Record<string, unknown>): ApiResult {
    const auth = this.authenticate(body);
    if (!auth.ok) return auth;
    return {
      ok: true,
      code: 'OK',
      message: 'outgoing requests loaded',
      payload: {
        ok: true,
        outgoing: this.listOutgoingByUserId(auth.user.user_id),
      },
    };
  }

  approveFriendRequest(body: Record<string, unknown>): ApiResult {
    const auth = this.authenticate(body);
    if (!auth.ok) return auth;
    const requesterUserId = this.normalizeUserId(body.requesterUserId);
    if (!requesterUserId) {
      return {
        ok: false,
        code: 'REQUESTER_ID_REQUIRED',
        message: 'requesterUserId is required',
      };
    }
    if (!this.hasPendingRequest(requesterUserId, auth.user.user_id)) {
      return { ok: false, code: 'REQUEST_NOT_FOUND', message: 'Request not found' };
    }

    this.db.exec('BEGIN');
    try {
      this.db
        .prepare(
          `
          DELETE FROM friend_requests
          WHERE requester_user_id = ? AND target_user_id = ?
        `,
        )
        .run(requesterUserId, auth.user.user_id);
      const now = Date.now();
      const insert = this.db.prepare(
        `
        INSERT OR IGNORE INTO friends (user_id, friend_user_id, created_at)
        VALUES (?, ?, ?)
      `,
      );
      insert.run(auth.user.user_id, requesterUserId, now);
      insert.run(requesterUserId, auth.user.user_id, now);
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }

    return {
      ok: true,
      code: 'OK',
      message: 'request approved',
      payload: {
        ok: true,
        friends: this.listFriendsByUserId(auth.user.user_id),
        incoming: this.listIncomingByUserId(auth.user.user_id),
      },
    };
  }

  rejectFriendRequest(body: Record<string, unknown>): ApiResult {
    const auth = this.authenticate(body);
    if (!auth.ok) return auth;
    const requesterUserId = this.normalizeUserId(body.requesterUserId);
    if (!requesterUserId) {
      return {
        ok: false,
        code: 'REQUESTER_ID_REQUIRED',
        message: 'requesterUserId is required',
      };
    }

    const result = this.db
      .prepare(
        `
        DELETE FROM friend_requests
        WHERE requester_user_id = ? AND target_user_id = ?
      `,
      )
      .run(requesterUserId, auth.user.user_id);

    if (!Number(result.changes)) {
      return { ok: false, code: 'REQUEST_NOT_FOUND', message: 'Request not found' };
    }

    return {
      ok: true,
      code: 'OK',
      message: 'request rejected',
      payload: {
        ok: true,
        incoming: this.listIncomingByUserId(auth.user.user_id),
      },
    };
  }

  cancelFriendRequest(body: Record<string, unknown>): ApiResult {
    const auth = this.authenticate(body);
    if (!auth.ok) return auth;
    const targetUserId = this.normalizeUserId(body.targetUserId ?? body.friendUserId);
    if (!targetUserId) {
      return {
        ok: false,
        code: 'FRIEND_ID_REQUIRED',
        message: 'targetUserId is required',
      };
    }

    const result = this.db
      .prepare(
        `
        DELETE FROM friend_requests
        WHERE requester_user_id = ? AND target_user_id = ?
      `,
      )
      .run(auth.user.user_id, targetUserId);

    if (!Number(result.changes)) {
      return { ok: false, code: 'REQUEST_NOT_FOUND', message: 'Request not found' };
    }

    return {
      ok: true,
      code: 'OK',
      message: 'request canceled',
      payload: {
        ok: true,
        outgoing: this.listOutgoingByUserId(auth.user.user_id),
      },
    };
  }

  searchUsers(body: Record<string, unknown>): ApiResult {
    const auth = this.authenticate(body);
    if (!auth.ok) return auth;

    const query = this.normalizeUserId(body.query ?? body.keyword).toLowerCase();
    if (!query) {
      return { ok: true, code: 'OK', message: 'empty query', payload: { ok: true, users: [] } };
    }

    const rows = this.db
      .prepare(
        `
        SELECT user_id
        FROM users
        WHERE lower(user_id) LIKE ?
        ORDER BY user_id COLLATE NOCASE ASC
        LIMIT 20
      `,
      )
      .all(`${query}%`) as Array<{ user_id: string }>;

    const users = rows
      .map((row) => this.normalizeUserId(row.user_id))
      .filter((id) => Boolean(id) && id !== auth.user.user_id);

    return {
      ok: true,
      code: 'OK',
      message: 'users loaded',
      payload: {
        ok: true,
        users,
      },
    };
  }

  listInquiries(body: Record<string, unknown>): ApiResult {
    const auth = this.authenticate(body);
    if (!auth.ok) return auth;

    const limitRaw = Number(body.limit);
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(200, Math.floor(limitRaw)))
      : 50;

    const items = this.readInquiries()
      .sort((a, b) => String(b.submittedAt || '').localeCompare(String(a.submittedAt || '')))
      .slice(0, limit);

    return {
      ok: true,
      code: 'OK',
      message: 'inquiries loaded',
      payload: {
        ok: true,
        items,
      },
    };
  }

  deleteInquiry(body: Record<string, unknown>): ApiResult {
    const auth = this.authenticate(body);
    if (!auth.ok) return auth;

    const targetId = String(body.id || '').trim();
    if (!targetId) {
      return { ok: false, code: 'INQUIRY_ID_REQUIRED', message: 'id is required' };
    }

    const rows = this.readInquiries();
    const next = rows.filter((row) => String(row.id || '') !== targetId);
    if (next.length === rows.length) {
      return { ok: false, code: 'NOT_FOUND', message: 'Inquiry not found' };
    }

    this.writeInquiries(next);
    return {
      ok: true,
      code: 'OK',
      message: 'inquiry deleted',
      payload: { ok: true },
    };
  }

  listLatestScores(limit = 20) {
    const safeLimit = Number.isFinite(limit)
      ? Math.max(1, Math.min(100, Math.floor(limit)))
      : 20;
    return this.db
      .prepare(
        `
        SELECT id, player_name AS playerName, score, game, created_at AS createdAt
        FROM scores
        ORDER BY created_at DESC
        LIMIT ?
      `,
      )
      .all(safeLimit);
  }

  createScore(input: { playerName: string; score: number; game?: string }) {
    const playerName = this.normalizePlayerName(input.playerName);
    const score = Number.isFinite(input.score) ? Math.floor(input.score) : 0;
    const game = this.normalizeGameKey(input.game || '');
    const createdAt = Date.now();

    const result = this.db
      .prepare(
        `
        INSERT INTO scores (player_name, score, game, created_at)
        VALUES (?, ?, ?, ?)
      `,
      )
      .run(playerName, score, game || null, createdAt);

    return {
      id: result.lastInsertRowid,
      playerName,
      score,
      game,
      createdAt,
    };
  }

  private ensureDataDir() {
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private resolveDataDir() {
    const workspaceDataDir = resolve(process.cwd(), '../../server/data');
    if (existsSync(workspaceDataDir)) return workspaceDataDir;
    return resolve(process.cwd(), 'server/data');
  }

  private initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        pass_salt_hex TEXT NOT NULL DEFAULT '',
        pass_hash_hex TEXT NOT NULL DEFAULT '',
        pass_hash_bcrypt TEXT NOT NULL DEFAULT '',
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

      CREATE TABLE IF NOT EXISTS friend_requests (
        requester_user_id TEXT NOT NULL,
        target_user_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        PRIMARY KEY (requester_user_id, target_user_id)
      );

      CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_name TEXT NOT NULL,
        score INTEGER NOT NULL,
        game TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_scores_created
        ON scores(created_at DESC);
    `);

    this.ensureUserColumns();
  }

  private ensureUserColumns() {
    const columns = this.db
      .prepare(`PRAGMA table_info(users)`)
      .all() as Array<{ name: string }>;
    const names = new Set(columns.map((column) => String(column.name || '')));

    if (!names.has('pass_salt_hex')) {
      this.db.exec(`ALTER TABLE users ADD COLUMN pass_salt_hex TEXT NOT NULL DEFAULT ''`);
    }
    if (!names.has('pass_hash_hex')) {
      this.db.exec(`ALTER TABLE users ADD COLUMN pass_hash_hex TEXT NOT NULL DEFAULT ''`);
    }
    if (!names.has('pass_hash_bcrypt')) {
      this.db.exec(`ALTER TABLE users ADD COLUMN pass_hash_bcrypt TEXT NOT NULL DEFAULT ''`);
    }
  }

  private authFromBody(body: Record<string, unknown>): AuthInputResult {
    const userId = this.normalizeUserId(body.userId);
    const password = String(body.password || '');

    if (!userId || !password) {
      return { ok: false, code: 'AUTH_REQUIRED', message: 'userId and password are required' };
    }

    return { ok: true, userId, password };
  }

  private authenticate(body: Record<string, unknown>): AuthUserResult {
    const auth = this.authFromBody(body);
    if (!auth.ok) return auth;

    const user = this.readUser(auth.userId);
    if (!user) {
      return { ok: false, code: 'USER_NOT_FOUND', message: 'User not found' };
    }

    const hasBcrypt = Boolean(user.pass_hash_bcrypt && user.pass_hash_bcrypt.trim());
    if (hasBcrypt && bcrypt.compareSync(auth.password, user.pass_hash_bcrypt)) {
      return { ok: true, user };
    }

    const legacyOk = this.verifyLegacyPassword(
      auth.password,
      user.pass_salt_hex || '',
      user.pass_hash_hex || '',
    );
    if (legacyOk) {
      const upgradedHash = bcrypt.hashSync(auth.password, this.bcryptRounds);
      this.db
        .prepare(
          `
          UPDATE users
          SET pass_hash_bcrypt = ?, updated_at = ?
          WHERE user_id = ?
        `,
        )
        .run(upgradedHash, Date.now(), user.user_id);
      user.pass_hash_bcrypt = upgradedHash;
      return { ok: true, user };
    }

    if (!hasBcrypt && !legacyOk) {
      return { ok: false, code: 'INVALID_PASSWORD', message: 'Invalid password' };
    }

    return { ok: false, code: 'INVALID_PASSWORD', message: 'Invalid password' };
  }

  private readUser(userId: string): UserRow | null {
    const row = this.db
      .prepare(
        `
        SELECT user_id, pass_salt_hex, pass_hash_hex, pass_hash_bcrypt, profile_json
        FROM users
        WHERE user_id = ?
      `,
      )
      .get(userId) as UserRow | undefined;

    return row || null;
  }

  private updateUserProfile(userId: string, profile: Profile) {
    this.db
      .prepare(
        `
        UPDATE users
        SET profile_json = ?, updated_at = ?
        WHERE user_id = ?
      `,
      )
      .run(JSON.stringify(profile), Date.now(), userId);
  }

  private verifyLegacyPassword(password: string, saltHex: string, hashHex: string) {
    try {
      if (!saltHex || !hashHex) return false;
      const salt = Buffer.from(saltHex, 'hex');
      const expected = Buffer.from(hashHex, 'hex');
      if (!salt.length || !expected.length) return false;
      const derived = scryptSync(password, salt, expected.length);
      if (derived.length !== expected.length) return false;
      return timingSafeEqual(derived, expected);
    } catch {
      return false;
    }
  }

  private normalizePlayerName(raw: unknown) {
    const trimmed = String(raw || '')
      .trim()
      .replace(/\s+/g, ' ');
    if (!trimmed) return 'Player';
    return trimmed.slice(0, 18);
  }

  private normalizeAvatarDataUrl(raw: unknown) {
    const value = String(raw || '').trim();
    if (!value) return '';
    if (value.length > 180000) return '';
    if (!/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(value)) return '';
    return value;
  }

  private normalizeUserId(raw: unknown) {
    return String(raw || '').trim().slice(0, 24);
  }

  private normalizeGameKey(raw: unknown) {
    return String(raw || '').trim().slice(0, 24).toLowerCase();
  }

  private normalizeResult(raw: unknown): 'win' | 'lose' | 'draw' | '' {
    const value = String(raw || '').trim().toLowerCase();
    return MATCH_RESULT_VALUES.has(value) ? (value as 'win' | 'lose' | 'draw') : '';
  }

  private normalizeRoomCode(raw: unknown) {
    return String(raw || '')
      .replace(/\D/g, '')
      .slice(0, 6);
  }

  private parseProfile(raw: string): unknown {
    try {
      return JSON.parse(String(raw || '{}'));
    } catch {
      return {};
    }
  }

  private sanitizeProfile(profile: unknown, baseProfile: Profile): Profile {
    const source = profile && typeof profile === 'object' ? (profile as Record<string, unknown>) : {};

    const bankCoins = Number.isFinite(source.bankCoins)
      ? Math.max(0, Math.floor(Number(source.bankCoins)))
      : Math.max(0, Math.floor(baseProfile.bankCoins));

    const pityCounter = Number.isFinite(source.pityCounter)
      ? Math.max(0, Math.min(9, Math.floor(Number(source.pityCounter))))
      : Math.max(0, Math.min(9, Math.floor(baseProfile.pityCounter)));

    const unlockedSkinsRaw = Array.isArray(source.unlockedSkins)
      ? source.unlockedSkins.filter((id) => typeof id === 'string')
      : baseProfile.unlockedSkins;

    const unlockedSkins = [...new Set(unlockedSkinsRaw)];
    if (!unlockedSkins.includes('classic')) unlockedSkins.unshift('classic');

    const selectedSkin =
      typeof source.selectedSkin === 'string' ? source.selectedSkin : baseProfile.selectedSkin;

    const matchStats = this.sanitizeMatchStats(source.matchStats ?? baseProfile.matchStats);
    const recentMatches = this.sanitizeRecentMatches(source.recentMatches ?? baseProfile.recentMatches);

    return {
      bankCoins,
      pityCounter,
      unlockedSkins,
      selectedSkin: unlockedSkins.includes(selectedSkin) ? selectedSkin : 'classic',
      playerName: this.normalizePlayerName(source.playerName ?? baseProfile.playerName),
      playerAvatar: this.normalizeAvatarDataUrl(source.playerAvatar ?? baseProfile.playerAvatar),
      matchStats,
      recentMatches,
    };
  }

  private sanitizeMatchStats(raw: unknown): MatchStats {
    const stats = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    const byGame: MatchStats['byGame'] = {};

    if (stats.byGame && typeof stats.byGame === 'object') {
      Object.entries(stats.byGame as Record<string, unknown>).forEach(([game, value]) => {
        if (!game) return;
        const row = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
        byGame[game] = {
          total: Number.isFinite(row.total) ? Math.max(0, Math.floor(Number(row.total))) : 0,
          win: Number.isFinite(row.win) ? Math.max(0, Math.floor(Number(row.win))) : 0,
          lose: Number.isFinite(row.lose) ? Math.max(0, Math.floor(Number(row.lose))) : 0,
          draw: Number.isFinite(row.draw) ? Math.max(0, Math.floor(Number(row.draw))) : 0,
        };
      });
    }

    return {
      total: Number.isFinite(stats.total) ? Math.max(0, Math.floor(Number(stats.total))) : 0,
      win: Number.isFinite(stats.win) ? Math.max(0, Math.floor(Number(stats.win))) : 0,
      lose: Number.isFinite(stats.lose) ? Math.max(0, Math.floor(Number(stats.lose))) : 0,
      draw: Number.isFinite(stats.draw) ? Math.max(0, Math.floor(Number(stats.draw))) : 0,
      byGame,
    };
  }

  private sanitizeRecentMatches(raw: unknown): MatchRecord[] {
    if (!Array.isArray(raw)) return [];

    const rows: MatchRecord[] = [];
    raw.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const row = item as Record<string, unknown>;
      const game = this.normalizeGameKey(row.game);
      const result = this.normalizeResult(row.result);
      if (!game || !result) return;

      const playedAt = Number.isFinite(row.playedAt)
        ? Math.max(0, Math.floor(Number(row.playedAt)))
        : Date.now();

      rows.push({
        game,
        result,
        playedAt,
        roomCode: this.normalizeRoomCode(row.roomCode),
        opponent: this.normalizePlayerName(row.opponent),
      });
    });

    return rows.sort((a, b) => b.playedAt - a.playedAt).slice(0, MATCH_RECENT_LIMIT);
  }

  private applyMatchRecord(profile: Profile, rawRecord: unknown) {
    const record =
      rawRecord && typeof rawRecord === 'object'
        ? (rawRecord as Record<string, unknown>)
        : {};

    const game = this.normalizeGameKey(record.game);
    const result = this.normalizeResult(record.result);
    if (!game || !result) {
      return {
        ok: false as const,
        code: 'INVALID_MATCH',
        message: 'game and result are required',
      };
    }

    const next = this.sanitizeProfile(profile, profile);
    next.matchStats.total += 1;
    if (result === 'win') next.matchStats.win += 1;
    if (result === 'lose') next.matchStats.lose += 1;
    if (result === 'draw') next.matchStats.draw += 1;

    if (!next.matchStats.byGame[game]) {
      next.matchStats.byGame[game] = { total: 0, win: 0, lose: 0, draw: 0 };
    }

    const byGameRow = next.matchStats.byGame[game];
    byGameRow.total += 1;
    if (result === 'win') byGameRow.win += 1;
    if (result === 'lose') byGameRow.lose += 1;
    if (result === 'draw') byGameRow.draw += 1;

    const match: MatchRecord = {
      game,
      result,
      playedAt: Date.now(),
      roomCode: this.normalizeRoomCode(record.roomCode),
      opponent: this.normalizePlayerName(record.opponent),
    };

    next.recentMatches = [match, ...this.sanitizeRecentMatches(next.recentMatches)].slice(
      0,
      MATCH_RECENT_LIMIT,
    );

    return {
      ok: true as const,
      profile: next,
      match,
    };
  }

  private listFriendsByUserId(userId: string): string[] {
    const rows = this.db
      .prepare(
        `
        SELECT friend_user_id
        FROM friends
        WHERE user_id = ?
        ORDER BY friend_user_id COLLATE NOCASE ASC
      `,
      )
      .all(userId) as Array<{ friend_user_id: string }>;

    return rows
      .map((row) => this.normalizeUserId(row.friend_user_id))
      .filter(Boolean);
  }

  private listIncomingByUserId(userId: string): string[] {
    const rows = this.db
      .prepare(
        `
        SELECT requester_user_id
        FROM friend_requests
        WHERE target_user_id = ?
        ORDER BY created_at DESC
      `,
      )
      .all(userId) as Array<{ requester_user_id: string }>;

    return rows
      .map((row) => this.normalizeUserId(row.requester_user_id))
      .filter(Boolean);
  }

  private listOutgoingByUserId(userId: string): string[] {
    const rows = this.db
      .prepare(
        `
        SELECT target_user_id
        FROM friend_requests
        WHERE requester_user_id = ?
        ORDER BY created_at DESC
      `,
      )
      .all(userId) as Array<{ target_user_id: string }>;

    return rows
      .map((row) => this.normalizeUserId(row.target_user_id))
      .filter(Boolean);
  }

  private hasPendingRequest(requesterUserId: string, targetUserId: string): boolean {
    const row = this.db
      .prepare(
        `
        SELECT 1 AS ok
        FROM friend_requests
        WHERE requester_user_id = ? AND target_user_id = ?
        LIMIT 1
      `,
      )
      .get(requesterUserId, targetUserId) as { ok: number } | undefined;

    return Boolean(row);
  }

  private areAlreadyFriends(userId: string, friendUserId: string): boolean {
    const row = this.db
      .prepare(
        `
        SELECT 1 AS ok
        FROM friends
        WHERE user_id = ? AND friend_user_id = ?
        LIMIT 1
      `,
      )
      .get(userId, friendUserId) as { ok: number } | undefined;

    return Boolean(row);
  }

  private readInquiries() {
    if (!existsSync(this.inquiryPath)) {
      return [] as Array<Record<string, unknown>>;
    }

    try {
      const parsed = JSON.parse(readFileSync(this.inquiryPath, 'utf8'));
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((item) => item && typeof item === 'object');
    } catch {
      return [] as Array<Record<string, unknown>>;
    }
  }

  private writeInquiries(items: Array<Record<string, unknown>>) {
    writeFileSync(this.inquiryPath, JSON.stringify(items, null, 2), 'utf8');
  }
}
