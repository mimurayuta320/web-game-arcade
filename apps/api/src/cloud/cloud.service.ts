import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { config as loadEnv } from 'dotenv';
import { randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import SyncMysql from 'sync-mysql';

const workspaceEnvPath = resolve(process.cwd(), 'apps/api/.env');
const localEnvPath = resolve(process.cwd(), '.env');
const envPath = existsSync(workspaceEnvPath) ? workspaceEnvPath : localEnvPath;

loadEnv({ path: envPath });

type MysqlQueryPacket = {
  affectedRows?: number;
  insertId?: number;
};

type MysqlCompatClient = {
  query: (sql: string, values?: unknown[]) => unknown;
};

class MysqlPreparedStatement {
  constructor(
    private readonly db: MysqlCompatDb,
    private readonly sql: string,
  ) {}

  run(...params: unknown[]) {
    return this.db.run(this.sql, params);
  }

  get(...params: unknown[]) {
    return this.db.get(this.sql, params);
  }

  all(...params: unknown[]) {
    return this.db.all(this.sql, params);
  }
}

class MysqlCompatDb {
  constructor(private readonly client: MysqlCompatClient) {}

  prepare(sql: string) {
    return new MysqlPreparedStatement(this, sql);
  }

  exec(sql: string) {
    this.client.query(sql);
  }

  run(sql: string, params: unknown[]) {
    const result = this.client.query(sql, params) as MysqlQueryPacket | MysqlQueryPacket[];
    if (Array.isArray(result)) {
      return { changes: 0, lastInsertRowid: 0 };
    }

    return {
      changes: Number(result?.affectedRows || 0),
      lastInsertRowid: Number(result?.insertId || 0),
    };
  }

  get(sql: string, params: unknown[]) {
    const rows = this.client.query(sql, params);
    if (!Array.isArray(rows) || rows.length === 0) return undefined;
    return rows[0] as Record<string, unknown>;
  }

  all(sql: string, params: unknown[]) {
    const rows = this.client.query(sql, params);
    return Array.isArray(rows) ? rows : [];
  }
}

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
  | { ok: true; user: UserRow; sessionId: string };

type SessionIssueResult =
  | { ok: false; code: string; message: string }
  | { ok: true; sessionId: string };

type UserRow = {
  user_id: string;
  friend_id?: string;
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

type FitPuzzleDifficulty = 'easy' | 'normal' | 'hard';

type FitPuzzleStageProfile = {
  bias: 'balanced' | 'long' | 'blocks';
  mutationSteps: number;
  minComplex: number;
  minBranch: number;
};

type FitPuzzleCustomStage = {
  rows: number;
  cols: number;
  pieceCount: number;
  title: string;
  profile: FitPuzzleStageProfile;
  openingRotation: 'mixed' | 'mostly-rotated';
  assistLimit: number;
  seed: number;
};

type FitPuzzleProgress = {
  highestUnlockedStage: number;
  selectedStageIndex: number;
  difficulty: FitPuzzleDifficulty;
  noRotateMode: boolean;
  customStages: FitPuzzleCustomStage[];
  updatedAt: string | null;
};

type FriendChatMessage = {
  id: number;
  senderUserId: string;
  receiverUserId: string;
  message: string;
  createdAt: number;
};

type FriendChatPeerReadState = {
  lastReadMessageId: number;
  lastReadAt: number;
};

type FriendListEntry = {
  friendId: string;
  playerName: string;
};

type ScoreRank = 'S' | 'A' | 'B' | 'C';

type Profile = {
  bankCoins: number;
  pityCounter: number;
  unlockedSkins: string[];
  selectedSkin: string;
  playerName: string;
  profileBio: string;
  playerAvatar: string;
  matchStats: MatchStats;
  recentMatches: MatchRecord[];
  fitPuzzleProgress: FitPuzzleProgress;
};

const MATCH_RECENT_LIMIT = 60;
const MATCH_RESULT_VALUES = new Set(['win', 'lose', 'draw']);
const INQUIRY_MIN_MESSAGE_LENGTH = Number(process.env.INQUIRY_MIN_MESSAGE_LENGTH || 10);
const INQUIRY_MIN_INTERVAL_MS = Number(process.env.INQUIRY_MIN_INTERVAL_MS || 30 * 1000);
const INQUIRY_DUPLICATE_WINDOW_MS = Number(process.env.INQUIRY_DUPLICATE_WINDOW_MS || 10 * 60 * 1000);
const FRIEND_CHAT_MIN_INTERVAL_MS = Number(process.env.FRIEND_CHAT_MIN_INTERVAL_MS || 1200);
const AUTH_SESSION_TTL_MS = Number(process.env.AUTH_SESSION_TTL_MS || 30 * 60 * 1000);
const DEFAULT_PROFILE: Profile = {
  bankCoins: 0,
  pityCounter: 0,
  unlockedSkins: ['classic'],
  selectedSkin: 'classic',
  playerName: 'Player',
  profileBio: '',
  playerAvatar: '',
  matchStats: {
    total: 0,
    win: 0,
    lose: 0,
    draw: 0,
    byGame: {},
  },
  recentMatches: [],
  fitPuzzleProgress: {
    highestUnlockedStage: 0,
    selectedStageIndex: 0,
    difficulty: 'normal',
    noRotateMode: false,
    customStages: [],
    updatedAt: null,
  },
};

@Injectable()
export class CloudService {
  private readonly inquiryAdminUserIds = this.resolveInquiryAdminUserIds();
  private readonly bcryptRounds = Number(process.env.BCRYPT_ROUNDS || 12);
  private readonly db: MysqlCompatDb;

  constructor() {
    const databaseUrl = String(process.env.DATABASE_URL || '').trim();
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required for MySQL operation');
    }

    const parsed = new URL(databaseUrl);
    const mysql = new SyncMysql({
      host: parsed.hostname || '127.0.0.1',
      port: Number(parsed.port || 3306),
      user: decodeURIComponent(parsed.username || ''),
      password: decodeURIComponent(parsed.password || ''),
      database: decodeURIComponent(parsed.pathname.replace(/^\//, '') || ''),
      charset: 'utf8mb4',
    }) as MysqlCompatClient;

    this.db = new MysqlCompatDb(mysql);
    this.ensureMysqlCompatibilitySchema();
  }

  register(body: Record<string, unknown>): ApiResult {
    const auth = this.authFromBody(body);
    if (!auth.ok) return auth;

    const existing = this.readUser(auth.userId);
    if (existing) {
      if (existing.user_id !== auth.userId) {
        return {
          ok: false,
          code: 'USER_ID_CASE_CONFLICT',
          message: `User ID conflicts with existing account by case-insensitive match: ${existing.user_id}`,
        };
      }
      return { ok: false, code: 'USER_ALREADY_EXISTS', message: 'User already exists' };
    }

    const passwordHash = bcrypt.hashSync(auth.password, this.bcryptRounds);
    const friendId = this.generateUniqueFriendId();
    this.db
      .prepare(
        `
        INSERT INTO users (
          user_id,
          friend_id,
          pass_hash_bcrypt,
          profile_json,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      )
      .run(
        auth.userId,
        friendId,
        passwordHash,
        JSON.stringify(DEFAULT_PROFILE),
        Date.now(),
        Date.now(),
      );

    const issued = this.issueSession(auth.userId, body.sessionId);
    if (!issued.ok) return issued;

    return {
      ok: true,
      code: 'OK',
      message: 'registered',
      payload: {
        ok: true,
        created: true,
        sessionId: issued.sessionId,
        friendId,
        profile: DEFAULT_PROFILE,
      },
    };
  }

  login(body: Record<string, unknown>): ApiResult {
    const auth = this.authenticate(body, { requireSession: false });
    if (!auth.ok) return auth;
    const friendId = this.ensureUserFriendId(auth.user);

    const issued = this.issueSession(auth.user.user_id, body.sessionId);
    if (!issued.ok) return issued;

    return {
      ok: true,
      code: 'OK',
      message: 'logged in',
      payload: {
        ok: true,
        sessionId: issued.sessionId,
        friendId,
        profile: this.sanitizeProfile(this.parseProfile(auth.user.profile_json), DEFAULT_PROFILE),
      },
    };
  }

  logout(body: Record<string, unknown>): ApiResult {
    // Logout should succeed even when the saved sessionId is stale after refresh/reload.
    const auth = this.authenticate(body, { requireSession: false });
    if (!auth.ok) return auth;

    this.db
      .prepare(
        `
        DELETE FROM auth_sessions
        WHERE user_id = ?
      `,
      )
      .run(auth.user.user_id);

    return {
      ok: true,
      code: 'OK',
      message: 'logged out',
      payload: { ok: true },
    };
  }

  ping(body: Record<string, unknown>): ApiResult {
    const auth = this.authenticate(body);
    if (!auth.ok) return auth;
    const friendId = this.ensureUserFriendId(auth.user);
    return {
      ok: true,
      code: 'OK',
      message: 'session alive',
      payload: { ok: true, sessionId: auth.sessionId, friendId },
    };
  }

  loadProfile(body: Record<string, unknown>): ApiResult {
    const auth = this.authenticate(body);
    if (!auth.ok) return auth;
    const friendId = this.ensureUserFriendId(auth.user);
    return {
      ok: true,
      code: 'OK',
      message: 'profile loaded',
      payload: {
        ok: true,
        friendId,
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

  loadPublicProfile(body: Record<string, unknown>): ApiResult {
    const auth = this.authenticate(body);
    if (!auth.ok) return auth;

    const targetUserId = this.normalizeUserId(body.targetUserId ?? body.userId);
    const targetFriendId = this.normalizeFriendId(body.targetFriendId ?? body.friendId);
    const targetPlayerName = this.normalizePlayerName(body.targetPlayerName ?? body.playerName);
    if (!targetUserId && !targetFriendId && !targetPlayerName) {
      return {
        ok: false,
        code: 'TARGET_USER_ID_REQUIRED',
        message: 'targetUserId or targetFriendId or targetPlayerName is required',
      };
    }

    let target: UserRow | null = null;
    if (targetUserId) {
      target = this.readUser(targetUserId);
      if (!target) {
        target = this.readUserByFriendId(targetUserId);
      }
    }
    if (!target && targetFriendId) {
      target = this.readUserByFriendId(targetFriendId);
    }
    if (!target && targetPlayerName) {
      target = this.findUserByPlayerName(targetPlayerName);
    }
    if (!target) {
      return { ok: false, code: 'USER_NOT_FOUND', message: 'User not found' };
    }

    const profile = this.sanitizeProfile(this.parseProfile(target.profile_json), DEFAULT_PROFILE);
    return {
      ok: true,
      code: 'OK',
      message: 'public profile loaded',
      payload: {
        ok: true,
        profile: {
          userId: target.user_id,
          friendId: this.ensureUserFriendId(target),
          playerName: profile.playerName,
          profileBio: profile.profileBio,
          playerAvatar: profile.playerAvatar,
        },
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
    const friendTarget = this.normalizeFriendId(body.friendUserId ?? body.targetUserId);
    const friendUserId = this.resolveUserIdByFriendId(friendTarget);
    if (!friendTarget || !friendUserId) {
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

    const rawTarget = String(body.targetUserId ?? body.friendUserId ?? body.targetFriendId ?? body.targetPlayerName ?? '').trim();
    const targetFriendId = this.normalizeFriendId(rawTarget);
    let targetUserId = targetFriendId ? this.resolveUserIdByFriendId(targetFriendId) : '';
    if (!targetUserId && rawTarget) {
      const targetByName = this.findUserByPlayerName(rawTarget);
      if (targetByName) {
        targetUserId = targetByName.user_id;
      }
    }
    if (!rawTarget) {
      return { ok: false, code: 'FRIEND_ID_REQUIRED', message: 'targetUserId is required' };
    }
    if (!targetUserId) {
      return { ok: false, code: 'FRIEND_NOT_FOUND', message: 'Friend user not found' };
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
    const requesterFriendId = this.normalizeFriendId(body.requesterUserId ?? body.requesterFriendId);
    const requesterUserId = this.resolveUserIdByFriendId(requesterFriendId);
    if (!requesterFriendId || !requesterUserId) {
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
        INSERT IGNORE INTO friends (user_id, friend_user_id, created_at)
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
    const requesterFriendId = this.normalizeFriendId(body.requesterUserId ?? body.requesterFriendId);
    const requesterUserId = this.resolveUserIdByFriendId(requesterFriendId);
    if (!requesterFriendId || !requesterUserId) {
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
    const targetFriendId = this.normalizeFriendId(body.targetUserId ?? body.friendUserId ?? body.targetFriendId);
    const targetUserId = this.resolveUserIdByFriendId(targetFriendId);
    if (!targetFriendId || !targetUserId) {
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

  listFriendMessages(body: Record<string, unknown>): ApiResult {
    const auth = this.authenticate(body);
    if (!auth.ok) return auth;

    const friendTarget = this.normalizeFriendId(body.friendUserId ?? body.targetUserId ?? body.targetFriendId);
    const friendUserId = this.resolveUserIdByFriendId(friendTarget);
    if (!friendTarget || !friendUserId) {
      return { ok: false, code: 'FRIEND_ID_REQUIRED', message: 'friendUserId is required' };
    }
    if (!this.areAlreadyFriends(auth.user.user_id, friendUserId)) {
      return { ok: false, code: 'FRIEND_CHAT_FORBIDDEN', message: 'Friend relationship required' };
    }

    const friendPublicId = this.resolveFriendIdByUserId(friendUserId) || friendTarget;

    return {
      ok: true,
      code: 'OK',
      message: 'friend messages loaded',
      payload: {
        ok: true,
        friendUserId: friendPublicId,
        messages: this.listFriendMessagesByPair(auth.user.user_id, friendUserId),
        peerReadState: this.getFriendPeerReadState(auth.user.user_id, friendUserId),
      },
    };
  }

  sendFriendMessage(body: Record<string, unknown>): ApiResult {
    const auth = this.authenticate(body);
    if (!auth.ok) return auth;

    const friendTarget = this.normalizeFriendId(body.friendUserId ?? body.targetUserId ?? body.targetFriendId);
    const friendUserId = this.resolveUserIdByFriendId(friendTarget);
    if (!friendTarget || !friendUserId) {
      return { ok: false, code: 'FRIEND_ID_REQUIRED', message: 'friendUserId is required' };
    }
    if (!this.areAlreadyFriends(auth.user.user_id, friendUserId)) {
      return { ok: false, code: 'FRIEND_CHAT_FORBIDDEN', message: 'Friend relationship required' };
    }

    const friendPublicId = this.resolveFriendIdByUserId(friendUserId) || friendTarget;

    const message = this.normalizeFriendChatMessage(body.message ?? body.text);
    if (!message) {
      return { ok: false, code: 'FRIEND_CHAT_MESSAGE_REQUIRED', message: 'message is required' };
    }

    const latestRow = this.db
      .prepare(
        `
        SELECT created_at
        FROM friend_messages
        WHERE sender_user_id = ?
        ORDER BY id DESC
        LIMIT 1
      `,
      )
      .get(auth.user.user_id) as { created_at?: number } | undefined;
    const latestSentAt = Number(latestRow?.created_at || 0);
    if (latestSentAt > 0 && Date.now() - latestSentAt < FRIEND_CHAT_MIN_INTERVAL_MS) {
      return {
        ok: false,
        code: 'FRIEND_CHAT_RATE_LIMITED',
        message: 'Message sending is rate limited',
      };
    }

    this.db
      .prepare(
        `
        INSERT INTO friend_messages (sender_user_id, receiver_user_id, message, created_at)
        VALUES (?, ?, ?, ?)
      `,
      )
      .run(auth.user.user_id, friendUserId, message, Date.now());

    return {
      ok: true,
      code: 'OK',
      message: 'friend message sent',
      payload: {
        ok: true,
        friendUserId: friendPublicId,
        messages: this.listFriendMessagesByPair(auth.user.user_id, friendUserId),
        peerReadState: this.getFriendPeerReadState(auth.user.user_id, friendUserId),
      },
    };
  }

  listFriendUnreadCounts(body: Record<string, unknown>): ApiResult {
    const auth = this.authenticate(body);
    if (!auth.ok) return auth;

    const rows = this.db
      .prepare(
        `
        SELECT fm.sender_user_id AS friend_user_id, COUNT(*) AS unread
        FROM friend_messages fm
        LEFT JOIN friend_chat_reads fcr
          ON fcr.user_id = ? AND fcr.friend_user_id = fm.sender_user_id
        WHERE fm.receiver_user_id = ?
          AND fm.id > COALESCE(fcr.last_read_message_id, 0)
          AND EXISTS (
            SELECT 1
            FROM friends fr
            WHERE fr.user_id = ? AND fr.friend_user_id = fm.sender_user_id
          )
        GROUP BY fm.sender_user_id
      `,
      )
      .all(auth.user.user_id, auth.user.user_id, auth.user.user_id) as Array<{
      friend_user_id: string;
      unread: number;
    }>;

    const unreadByFriend: Record<string, number> = {};
    rows.forEach((row) => {
      const friendUserId = this.resolveFriendIdByUserId(this.normalizeUserId(row.friend_user_id));
      const unread = Number.isFinite(row.unread) ? Math.max(0, Math.floor(Number(row.unread))) : 0;
      if (friendUserId && unread > 0) {
        unreadByFriend[friendUserId] = unread;
      }
    });

    return {
      ok: true,
      code: 'OK',
      message: 'friend unread counts loaded',
      payload: {
        ok: true,
        unreadByFriend,
      },
    };
  }

  markFriendMessagesRead(body: Record<string, unknown>): ApiResult {
    const auth = this.authenticate(body);
    if (!auth.ok) return auth;

    const friendTarget = this.normalizeFriendId(body.friendUserId ?? body.targetUserId ?? body.targetFriendId);
    const friendUserId = this.resolveUserIdByFriendId(friendTarget);
    if (!friendTarget || !friendUserId) {
      return { ok: false, code: 'FRIEND_ID_REQUIRED', message: 'friendUserId is required' };
    }
    if (!this.areAlreadyFriends(auth.user.user_id, friendUserId)) {
      return { ok: false, code: 'FRIEND_CHAT_FORBIDDEN', message: 'Friend relationship required' };
    }

    const friendPublicId = this.resolveFriendIdByUserId(friendUserId) || friendTarget;

    const latestIncoming = this.db
      .prepare(
        `
        SELECT MAX(id) AS last_read_message_id
        FROM friend_messages
        WHERE sender_user_id = ? AND receiver_user_id = ?
      `,
      )
      .get(friendUserId, auth.user.user_id) as { last_read_message_id?: number } | undefined;

    const lastReadMessageId = Number.isFinite(latestIncoming?.last_read_message_id)
      ? Math.max(0, Math.floor(Number(latestIncoming?.last_read_message_id || 0)))
      : 0;

    this.db
      .prepare(
        `
        INSERT INTO friend_chat_reads (user_id, friend_user_id, last_read_message_id, updated_at)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          last_read_message_id = VALUES(last_read_message_id),
          updated_at = VALUES(updated_at)
      `,
      )
      .run(auth.user.user_id, friendUserId, lastReadMessageId, Date.now());

    return {
      ok: true,
      code: 'OK',
      message: 'friend messages marked as read',
      payload: {
        ok: true,
        friendUserId: friendPublicId,
        lastReadMessageId,
      },
    };
  }

  searchUsers(body: Record<string, unknown>): ApiResult {
    const auth = this.authenticate(body);
    if (!auth.ok) return auth;

    const rawQuery = String(body.query ?? body.keyword ?? '').trim();
    const friendIdQuery = this.normalizeFriendId(rawQuery).toLowerCase();
    const playerNameQuery = rawQuery.toLowerCase();
    if (!friendIdQuery && !playerNameQuery) {
      return { ok: true, code: 'OK', message: 'empty query', payload: { ok: true, users: [] } };
    }

    const rows = this.db
      .prepare(
        `
        SELECT user_id, friend_id, profile_json
        FROM users
        WHERE user_id <> ?
        ORDER BY updated_at DESC, created_at DESC
        LIMIT 500
      `,
      )
      .all(auth.user.user_id) as Array<{ user_id: string; friend_id: string; profile_json: string }>;

    const selfFriendId = this.ensureUserFriendId(auth.user);

    const users = rows
      .map((row) => {
        const loginUserId = this.normalizeUserId(row.user_id);
        if (!loginUserId || loginUserId === auth.user.user_id) return null;

        const friendId = this.normalizeFriendId(row.friend_id) || this.resolveFriendIdByUserId(loginUserId);
        if (!friendId || friendId === selfFriendId) return null;

        const profile = this.sanitizeProfile(this.parseProfile(row.profile_json), DEFAULT_PROFILE);
        const playerName = this.normalizePlayerName(profile.playerName || friendId);
        const matchesFriendId = friendIdQuery ? friendId.toLowerCase().includes(friendIdQuery) : false;
        const matchesLoginId = playerNameQuery ? loginUserId.toLowerCase().includes(playerNameQuery) : false;
        const matchesPlayerName = playerNameQuery ? playerName.toLowerCase().includes(playerNameQuery) : false;
        if (!matchesFriendId && !matchesPlayerName && !matchesLoginId) return null;

        return {
          friendId,
          playerName,
        };
      })
      .filter((row): row is { friendId: string; playerName: string } => Boolean(row))
      .slice(0, 20);

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

  submitInquiry(body: Record<string, unknown>): ApiResult {
    const message = this.normalizeInquiryMessage(body.message);
    if (!message) {
      return {
        ok: false,
        code: 'INQUIRY_MESSAGE_REQUIRED',
        message: 'message is required',
      };
    }
    if (message.length < INQUIRY_MIN_MESSAGE_LENGTH) {
      return {
        ok: false,
        code: 'INQUIRY_MESSAGE_TOO_SHORT',
        message: `message must be at least ${INQUIRY_MIN_MESSAGE_LENGTH} characters`,
      };
    }

    const userId = this.normalizeUserId(body.userId);
    const name = this.normalizeInquiryName(body.name);
    const url = this.normalizeInquiryUrl(body.url);
    const lang = this.normalizeInquiryLang(body.lang);
    const now = Date.now();
    const rows = this.db
      .prepare(
        `
        SELECT id,
               user_id AS userId,
               name,
               message,
               url,
               lang,
               submitted_at AS submittedAt
        FROM inquiries
        WHERE submitted_at >= ?
        ORDER BY submitted_at DESC
        LIMIT 1000
      `,
      )
      .all(now - Math.max(INQUIRY_MIN_INTERVAL_MS, INQUIRY_DUPLICATE_WINDOW_MS)) as Array<Record<string, unknown>>;
    const senderKey = userId || `anon:${url || 'unknown'}`;
    const normalizedMessage = this.normalizeInquiryForDuplicateCheck(message);

    const recentBySameSender = rows.some((row) => {
      if (!row || typeof row !== 'object') return false;
      const submittedAt = this.getInquiryTimestamp(row);
      if (submittedAt <= 0 || now - submittedAt > INQUIRY_MIN_INTERVAL_MS) return false;
      return this.getInquirySenderKey(row) === senderKey;
    });
    if (recentBySameSender) {
      return {
        ok: false,
        code: 'RATE_LIMITED',
        message: 'Please wait before sending another inquiry',
      };
    }

    const hasRecentDuplicateMessage = rows.some((row) => {
      if (!row || typeof row !== 'object') return false;
      const submittedAt = this.getInquiryTimestamp(row);
      if (submittedAt <= 0 || now - submittedAt > INQUIRY_DUPLICATE_WINDOW_MS) return false;
      const oldMessage = this.normalizeInquiryForDuplicateCheck((row as Record<string, unknown>).message);
      return Boolean(oldMessage) && oldMessage === normalizedMessage;
    });
    if (hasRecentDuplicateMessage) {
      return {
        ok: false,
        code: 'DUPLICATE_INQUIRY',
        message: 'Duplicate inquiry detected',
      };
    }

    const inserted = this.db
      .prepare(
        `
        INSERT INTO inquiries (user_id, name, message, url, lang, submitted_at)
        VALUES (?, ?, ?, COALESCE(?, ''), ?, ?)
      `,
      )
      .run(userId || null, name, message, url, lang, now);

    return {
      ok: true,
      code: 'OK',
      message: 'inquiry submitted',
      payload: {
        ok: true,
        id: String(inserted.lastInsertRowid || ''),
      },
    };
  }

  listInquiries(body: Record<string, unknown>): ApiResult {
    const auth = this.authenticate(body);
    if (!auth.ok) return auth;
    if (!this.isInquiryAdmin(auth.user.user_id)) {
      return { ok: false, code: 'FORBIDDEN', message: 'Admin role is required' };
    }

    const limitRaw = Number(body.limit);
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(200, Math.floor(limitRaw)))
      : 50;

    const rows = this.db
      .prepare(
        `
        SELECT id,
               user_id AS userId,
               name,
               message,
               url,
               lang,
               submitted_at AS submittedAt
        FROM inquiries
        ORDER BY submitted_at DESC
        LIMIT ?
      `,
      )
      .all(limit) as Array<Record<string, unknown>>;

    const items = rows.map((row) => ({
      id: String(row.id || ''),
      userId: this.normalizeUserId(row.userId),
      name: this.normalizeInquiryName(row.name),
      message: this.normalizeInquiryMessage(row.message),
      url: this.normalizeInquiryUrl(row.url),
      lang: this.normalizeInquiryLang(row.lang),
      submittedAt: new Date(Number(row.submittedAt || 0)).toISOString(),
    }));

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
    if (!this.isInquiryAdmin(auth.user.user_id)) {
      return { ok: false, code: 'FORBIDDEN', message: 'Admin role is required' };
    }

    const targetIdRaw = Number(body.id);
    const targetId = Number.isFinite(targetIdRaw) ? Math.floor(targetIdRaw) : 0;
    if (!targetId) {
      return { ok: false, code: 'INQUIRY_ID_REQUIRED', message: 'id is required' };
    }

    const result = this.db
      .prepare(
        `
        DELETE FROM inquiries
        WHERE id = ?
      `,
      )
      .run(targetId);
    if (!Number(result.changes)) {
      return { ok: false, code: 'NOT_FOUND', message: 'Inquiry not found' };
    }

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
        SELECT id, player_name AS playerName, score, game,
               max_score AS maxScore, score_ratio AS scoreRatio, rank,
               created_at AS createdAt
        FROM scores
        ORDER BY created_at DESC
        LIMIT ?
      `,
      )
      .all(safeLimit);
  }

  createScore(input: {
    playerName: string;
    score: number;
    game?: string;
    maxScore?: number;
    rank?: ScoreRank;
  }) {
    const playerName = this.normalizePlayerName(input.playerName);
    const score = Number.isFinite(input.score) ? Math.floor(input.score) : 0;
    const game = this.normalizeGameKey(input.game || '');
    const maxScore = Number.isFinite(input.maxScore)
      ? Math.max(0, Math.floor(Number(input.maxScore)))
      : null;
    const scoreRatio = maxScore && maxScore > 0
      ? Math.max(0, Math.min(1000, Math.floor((score / maxScore) * 1000)))
      : null;
    const rank = this.normalizeScoreRank(input.rank)
      || this.resolveScoreRankByRatio(scoreRatio);
    const createdAt = Date.now();

    const result = this.db
      .prepare(
        `
        INSERT INTO scores (player_name, score, game, max_score, score_ratio, rank, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      )
      .run(playerName, score, game || null, maxScore, scoreRatio, rank, createdAt);

    return {
      id: result.lastInsertRowid,
      playerName,
      score,
      game,
      maxScore,
      scoreRatio,
      rank,
      createdAt,
    };
  }

  private ensureMysqlCompatibilitySchema() {
    const hasColumn = (tableName: string, columnName: string) => {
      const row = this.db
        .prepare(
          `
          SELECT COUNT(*) AS count
          FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = ?
            AND COLUMN_NAME = ?
        `,
        )
        .get(tableName, columnName) as { count?: number } | undefined;
      return Number(row?.count || 0) > 0;
    };

    const hasIndex = (tableName: string, indexName: string) => {
      const row = this.db
        .prepare(
          `
          SELECT COUNT(*) AS count
          FROM information_schema.STATISTICS
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = ?
            AND INDEX_NAME = ?
        `,
        )
        .get(tableName, indexName) as { count?: number } | undefined;
      return Number(row?.count || 0) > 0;
    };

    if (!hasColumn('users', 'pass_salt_hex')) {
      this.db.exec(`ALTER TABLE users ADD COLUMN pass_salt_hex VARCHAR(255) NOT NULL DEFAULT ''`);
    }
    if (!hasColumn('users', 'pass_hash_hex')) {
      this.db.exec(`ALTER TABLE users ADD COLUMN pass_hash_hex VARCHAR(255) NOT NULL DEFAULT ''`);
    }
    if (!hasColumn('users', 'profile_json')) {
      // MySQL 8 only accepts TEXT defaults as an expression: DEFAULT ('...').
      this.db.exec(`ALTER TABLE users ADD COLUMN profile_json MEDIUMTEXT NOT NULL DEFAULT ('{}')`);
      this.db.exec(`UPDATE users SET profile_json = '{}' WHERE profile_json IS NULL OR profile_json = ''`);
    }
    if (!hasColumn('users', 'friend_id')) {
      this.db.exec(`ALTER TABLE users ADD COLUMN friend_id VARCHAR(24) NOT NULL DEFAULT ''`);
    }
    this.db.exec("UPDATE users SET friend_id = CONCAT('F', UPPER(SUBSTRING(REPLACE(UUID(), '-', ''), 1, 11))) WHERE friend_id IS NULL OR friend_id = ''");
    if (!hasIndex('users', 'uidx_users_friend_id')) {
      this.db.exec('CREATE UNIQUE INDEX uidx_users_friend_id ON users(friend_id)');
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

  private authenticate(
    body: Record<string, unknown>,
    options?: { requireSession?: boolean },
  ): AuthUserResult {
    const auth = this.authFromBody(body);
    if (!auth.ok) return auth;

    const user = this.readUser(auth.userId);
    if (!user) {
      return { ok: false, code: 'USER_NOT_FOUND', message: 'User not found' };
    }
    this.ensureUserFriendId(user);

    const hasBcrypt = Boolean(user.pass_hash_bcrypt && user.pass_hash_bcrypt.trim());
    if (hasBcrypt && bcrypt.compareSync(auth.password, user.pass_hash_bcrypt)) {
      if (options?.requireSession === false) {
        return { ok: true, user, sessionId: '' };
      }
      return this.validateAndTouchSession(user.user_id, body.sessionId, user);
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
      if (options?.requireSession === false) {
        return { ok: true, user, sessionId: '' };
      }
      return this.validateAndTouchSession(user.user_id, body.sessionId, user);
    }

    if (!hasBcrypt && !legacyOk) {
      return { ok: false, code: 'INVALID_PASSWORD', message: 'Invalid password' };
    }

    return { ok: false, code: 'INVALID_PASSWORD', message: 'Invalid password' };
  }

  private normalizeSessionId(value: unknown): string {
    return String(value || '').trim().slice(0, 96);
  }

  private cleanupExpiredSessions() {
    const threshold = Date.now() - AUTH_SESSION_TTL_MS;
    this.db
      .prepare(
        `
        DELETE FROM auth_sessions
        WHERE last_seen_at < ?
      `,
      )
      .run(threshold);
  }

  private issueSession(userId: string, requestedValue: unknown): SessionIssueResult {
    this.cleanupExpiredSessions();

    const requestedSessionId = this.normalizeSessionId(requestedValue);
    const existing = this.db
      .prepare(
        `
        SELECT session_id
        FROM auth_sessions
        WHERE user_id = ?
      `,
      )
      .get(userId) as { session_id: string } | undefined;

    if (existing) {
      if (requestedSessionId && existing.session_id === requestedSessionId) {
        this.db
          .prepare(
            `
            UPDATE auth_sessions
            SET last_seen_at = ?
            WHERE user_id = ?
          `,
          )
          .run(Date.now(), userId);
        return { ok: true, sessionId: existing.session_id };
      }
      return {
        ok: false,
        code: 'ALREADY_LOGGED_IN',
        message: 'This account is already logged in on another device',
      };
    }

    // Requested session IDs can collide with another account's active session.
    // In that case, ignore the requested value and issue a fresh UUID.
    let preferredSessionId = requestedSessionId;
    if (preferredSessionId) {
      const occupied = this.db
        .prepare(
          `
          SELECT user_id
          FROM auth_sessions
          WHERE session_id = ?
        `,
        )
        .get(preferredSessionId) as { user_id?: string } | undefined;
      if (occupied?.user_id && occupied.user_id !== userId) {
        preferredSessionId = '';
      }
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const sessionId = attempt === 0 && preferredSessionId
        ? preferredSessionId
        : randomUUID();
      const now = Date.now();
      try {
        this.db
          .prepare(
            `
            INSERT INTO auth_sessions (session_id, user_id, created_at, last_seen_at)
            VALUES (?, ?, ?, ?)
          `,
          )
          .run(sessionId, userId, now, now);
        return { ok: true, sessionId };
      } catch (error) {
        const code = (error as { code?: string } | null)?.code;
        if (code === 'ER_DUP_ENTRY') {
          continue;
        }
        throw error;
      }
    }

    return {
      ok: false,
      code: 'SESSION_ISSUE_FAILED',
      message: 'failed to issue session',
    };
  }

  private validateAndTouchSession(
    userId: string,
    providedSessionIdRaw: unknown,
    user: UserRow,
  ): AuthUserResult {
    this.cleanupExpiredSessions();

    const providedSessionId = this.normalizeSessionId(providedSessionIdRaw);
    if (!providedSessionId) {
      return {
        ok: false,
        code: 'SESSION_REQUIRED',
        message: 'sessionId is required',
      };
    }

    const row = this.db
      .prepare(
        `
        SELECT session_id
        FROM auth_sessions
        WHERE user_id = ?
      `,
      )
      .get(userId) as { session_id: string } | undefined;

    if (!row || row.session_id !== providedSessionId) {
      return {
        ok: false,
        code: 'INVALID_SESSION',
        message: 'session is invalid or expired',
      };
    }

    this.db
      .prepare(
        `
        UPDATE auth_sessions
        SET last_seen_at = ?
        WHERE user_id = ?
      `,
      )
      .run(Date.now(), userId);

    return { ok: true, user, sessionId: providedSessionId };
  }

  private readUser(userId: string): UserRow | null {
    const row = this.db
      .prepare(
        `
        SELECT user_id, friend_id, pass_salt_hex, pass_hash_hex, pass_hash_bcrypt, profile_json
        FROM users
        WHERE user_id = ?
      `,
      )
      .get(userId) as UserRow | undefined;

    return row || null;
  }

  private readUserByFriendId(friendId: string): UserRow | null {
    const normalized = this.normalizeFriendId(friendId);
    if (!normalized) return null;

    const row = this.db
      .prepare(
        `
        SELECT user_id, friend_id, pass_salt_hex, pass_hash_hex, pass_hash_bcrypt, profile_json
        FROM users
        WHERE friend_id = ?
      `,
      )
      .get(normalized) as UserRow | undefined;

    return row || null;
  }

  private findUserByPlayerName(playerName: string): UserRow | null {
    const normalized = this.normalizePlayerName(playerName);
    if (!normalized) return null;
    const rows = this.db
      .prepare(
        `
        SELECT user_id, friend_id, pass_salt_hex, pass_hash_hex, pass_hash_bcrypt, profile_json
        FROM users
      `,
      )
      .all() as UserRow[];

    for (const row of rows) {
      const profile = this.sanitizeProfile(this.parseProfile(row.profile_json), DEFAULT_PROFILE);
      if (profile.playerName === normalized) {
        return row;
      }
    }
    return null;
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

  private normalizeProfileBio(raw: unknown) {
    const text = String(raw || '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();
    return text.slice(0, 180);
  }

  private normalizeUserId(raw: unknown) {
    return String(raw || '').trim().slice(0, 24);
  }

  private normalizeFriendId(raw: unknown) {
    return String(raw || '')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 24);
  }

  private generateUniqueFriendId() {
    for (let i = 0; i < 6; i += 1) {
      const candidate = `F${randomUUID().replace(/-/g, '').slice(0, 11).toUpperCase()}`;
      if (!this.readUserByFriendId(candidate)) {
        return candidate;
      }
    }
    return `F${Date.now().toString(36).toUpperCase().slice(0, 11)}`;
  }

  private ensureUserFriendId(user: UserRow) {
    const current = this.normalizeFriendId(user.friend_id);
    if (current) {
      user.friend_id = current;
      return current;
    }

    const next = this.generateUniqueFriendId();
    this.db
      .prepare(
        `
        UPDATE users
        SET friend_id = ?, updated_at = ?
        WHERE user_id = ?
      `,
      )
      .run(next, Date.now(), user.user_id);
    user.friend_id = next;
    return next;
  }

  private resolveUserIdByFriendId(friendId: string) {
    const row = this.readUserByFriendId(friendId);
    return row?.user_id || '';
  }

  private resolveFriendIdByUserId(userId: string) {
    const row = this.readUser(userId);
    if (!row) return '';
    return this.ensureUserFriendId(row);
  }

  private resolveInquiryAdminUserIds() {
    const raw = String(process.env.INQUIRY_ADMIN_USER_IDS || process.env.ADMIN_USER_IDS || 'admin,NullToufu');
    const rows = raw
      .split(',')
      .map((id) => this.normalizeUserId(id))
      .filter(Boolean);
    return new Set(rows);
  }

  private isInquiryAdmin(userId: string) {
    const normalized = this.normalizeUserId(userId);
    if (!normalized) return false;
    return this.inquiryAdminUserIds.has(normalized);
  }

  private normalizeInquiryName(raw: unknown) {
    const trimmed = String(raw || '')
      .trim()
      .replace(/\s+/g, ' ');
    if (!trimmed) return 'anonymous';
    return trimmed.slice(0, 36);
  }

  private normalizeInquiryMessage(raw: unknown) {
    const text = String(raw || '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();
    if (!text) return '';
    return text.slice(0, 200);
  }

  private normalizeInquiryUrl(raw: unknown) {
    const value = String(raw || '').trim();
    if (!value) return '';
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
      return parsed.toString().slice(0, 240);
    } catch {
      return '';
    }
  }

  private normalizeInquiryLang(raw: unknown) {
    const value = String(raw || '').trim().toLowerCase();
    if (value === 'ja' || value === 'ko' || value === 'en') return value;
    return 'ja';
  }

  private normalizeInquiryForDuplicateCheck(raw: unknown) {
    return String(raw || '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  private getInquiryTimestamp(row: Record<string, unknown>) {
    const raw = String(row.submittedAt || '').trim();
    if (!raw) return 0;
    const parsed = Date.parse(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private getInquirySenderKey(row: Record<string, unknown>) {
    const userId = this.normalizeUserId(row.userId);
    if (userId) return userId;
    const url = this.normalizeInquiryUrl(row.url);
    return `anon:${url || 'unknown'}`;
  }

  private normalizeGameKey(raw: unknown) {
    return String(raw || '').trim().slice(0, 24).toLowerCase();
  }

  private normalizeScoreRank(raw: unknown): ScoreRank | null {
    const value = String(raw || '').trim().toUpperCase();
    if (value === 'S' || value === 'A' || value === 'B' || value === 'C') {
      return value;
    }
    return null;
  }

  private resolveScoreRankByRatio(scoreRatio: number | null): ScoreRank | null {
    if (!Number.isFinite(scoreRatio) || scoreRatio === null) return null;
    if (scoreRatio >= 850) return 'S';
    if (scoreRatio >= 700) return 'A';
    if (scoreRatio >= 500) return 'B';
    return 'C';
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

  private normalizeFriendChatMessage(raw: unknown) {
    const text = String(raw || '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();
    if (!text) return '';
    return text.slice(0, 400);
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
    const fitPuzzleProgress = this.sanitizeFitPuzzleProgress(
      source.fitPuzzleProgress ?? baseProfile.fitPuzzleProgress,
      baseProfile.fitPuzzleProgress,
    );

    return {
      bankCoins,
      pityCounter,
      unlockedSkins,
      selectedSkin: unlockedSkins.includes(selectedSkin) ? selectedSkin : 'classic',
      playerName: this.normalizePlayerName(source.playerName ?? baseProfile.playerName),
      profileBio: this.normalizeProfileBio(source.profileBio ?? baseProfile.profileBio),
      playerAvatar: this.normalizeAvatarDataUrl(source.playerAvatar ?? baseProfile.playerAvatar),
      matchStats,
      recentMatches,
      fitPuzzleProgress,
    };
  }

  private sanitizeFitPuzzleProgress(raw: unknown, base: FitPuzzleProgress): FitPuzzleProgress {
    const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    const baseSafe = base || DEFAULT_PROFILE.fitPuzzleProgress;

    const normalizeInt = (value: unknown, fallback: number) => {
      const n = Number(value);
      if (!Number.isFinite(n)) return fallback;
      return Math.floor(n);
    };

    const normalizeCustomStage = (stageRaw: unknown): FitPuzzleCustomStage | null => {
      if (!stageRaw || typeof stageRaw !== 'object') return null;
      const stage = stageRaw as Record<string, unknown>;
      const rows = Math.max(4, Math.min(12, normalizeInt(stage.rows, 10)));
      const cols = Math.max(4, Math.min(12, normalizeInt(stage.cols, 10)));
      const maxCells = rows * cols;
      const pieceCount = Math.max(
        2,
        Math.min(maxCells, normalizeInt(stage.pieceCount, Math.max(2, Math.floor(maxCells / 2)))),
      );
      const title = String(stage.title || '').trim().slice(0, 40) || 'Custom';
      const profileRaw = stage.profile && typeof stage.profile === 'object'
        ? (stage.profile as Record<string, unknown>)
        : {};
      const bias = profileRaw.bias === 'long' || profileRaw.bias === 'blocks'
        ? profileRaw.bias
        : 'balanced';
      const openingRotation = stage.openingRotation === 'mostly-rotated' ? 'mostly-rotated' : 'mixed';

      return {
        rows,
        cols,
        pieceCount,
        title,
        profile: {
          bias,
          mutationSteps: Math.max(0, Math.min(20000, normalizeInt(profileRaw.mutationSteps, rows * cols * 6))),
          minComplex: Math.max(0, Math.min(200, normalizeInt(profileRaw.minComplex, 0))),
          minBranch: Math.max(0, Math.min(200, normalizeInt(profileRaw.minBranch, 0))),
        },
        openingRotation,
        assistLimit: Math.max(0, Math.min(10, normalizeInt(stage.assistLimit, 0))),
        seed: Math.max(1, normalizeInt(stage.seed, 1)),
      };
    };

    const customStages = Array.isArray(src.customStages)
      ? src.customStages
          .map((stage) => normalizeCustomStage(stage))
          .filter((stage): stage is FitPuzzleCustomStage => Boolean(stage))
      : baseSafe.customStages;

    const updatedAt = typeof src.updatedAt === 'string' && src.updatedAt.trim()
      ? src.updatedAt.trim().slice(0, 64)
      : baseSafe.updatedAt;

    const difficulty = src.difficulty === 'easy' || src.difficulty === 'hard'
      ? src.difficulty
      : src.difficulty === 'normal'
        ? 'normal'
        : baseSafe.difficulty;

    return {
      highestUnlockedStage: Math.max(0, normalizeInt(src.highestUnlockedStage, baseSafe.highestUnlockedStage)),
      selectedStageIndex: Math.max(0, normalizeInt(src.selectedStageIndex, baseSafe.selectedStageIndex)),
      difficulty,
      noRotateMode: typeof src.noRotateMode === 'boolean' ? src.noRotateMode : baseSafe.noRotateMode,
      customStages,
      updatedAt: updatedAt || null,
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

  private listFriendsByUserId(userId: string): FriendListEntry[] {
    const rows = this.db
      .prepare(
        `
        SELECT u.friend_id AS friendId, u.profile_json AS profileJson
        FROM friends fr
        JOIN users u ON u.user_id = fr.friend_user_id
        WHERE fr.user_id = ?
        ORDER BY LOWER(u.friend_id) ASC
      `,
      )
      .all(userId) as Array<{ friendId: string; profileJson: string }>;

    return rows
      .map((row) => {
        const friendId = this.normalizeFriendId(row.friendId);
        if (!friendId) return null;
        const profile = this.sanitizeProfile(this.parseProfile(row.profileJson), DEFAULT_PROFILE);
        return {
          friendId,
          playerName: this.normalizePlayerName(profile.playerName || friendId),
        };
      })
      .filter((row): row is FriendListEntry => Boolean(row));
  }

  private listIncomingByUserId(userId: string): FriendListEntry[] {
    const rows = this.db
      .prepare(
        `
        SELECT u.friend_id AS friendId, u.profile_json AS profileJson
        FROM friend_requests fr
        JOIN users u ON u.user_id = fr.requester_user_id
        WHERE fr.target_user_id = ?
        ORDER BY fr.created_at DESC
      `,
      )
      .all(userId) as Array<{ friendId: string; profileJson: string }>;

    return rows
      .map((row) => {
        const friendId = this.normalizeFriendId(row.friendId);
        if (!friendId) return null;
        const profile = this.sanitizeProfile(this.parseProfile(row.profileJson), DEFAULT_PROFILE);
        return {
          friendId,
          playerName: this.normalizePlayerName(profile.playerName || friendId),
        };
      })
      .filter((row): row is FriendListEntry => Boolean(row));
  }

  private listOutgoingByUserId(userId: string): FriendListEntry[] {
    const rows = this.db
      .prepare(
        `
        SELECT u.friend_id AS friendId, u.profile_json AS profileJson
        FROM friend_requests fr
        JOIN users u ON u.user_id = fr.target_user_id
        WHERE fr.requester_user_id = ?
        ORDER BY fr.created_at DESC
      `,
      )
      .all(userId) as Array<{ friendId: string; profileJson: string }>;

    return rows
      .map((row) => {
        const friendId = this.normalizeFriendId(row.friendId);
        if (!friendId) return null;
        const profile = this.sanitizeProfile(this.parseProfile(row.profileJson), DEFAULT_PROFILE);
        return {
          friendId,
          playerName: this.normalizePlayerName(profile.playerName || friendId),
        };
      })
      .filter((row): row is FriendListEntry => Boolean(row));
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

  private listFriendMessagesByPair(userId: string, friendUserId: string): FriendChatMessage[] {
    const rows = this.db
      .prepare(
        `
        SELECT id, sender_user_id, receiver_user_id, message, created_at
        FROM friend_messages
        WHERE (sender_user_id = ? AND receiver_user_id = ?)
           OR (sender_user_id = ? AND receiver_user_id = ?)
        ORDER BY created_at DESC, id DESC
        LIMIT 120
      `,
      )
      .all(userId, friendUserId, friendUserId, userId) as Array<{
      id: number;
      sender_user_id: string;
      receiver_user_id: string;
      message: string;
      created_at: number;
    }>;

    const friendIdCache = new Map<string, string>();
    const resolvePublicId = (rawUserId: string) => {
      const normalizedUserId = this.normalizeUserId(rawUserId);
      if (!normalizedUserId) return '';
      const cached = friendIdCache.get(normalizedUserId);
      if (cached) return cached;
      const next = this.resolveFriendIdByUserId(normalizedUserId);
      if (next) {
        friendIdCache.set(normalizedUserId, next);
      }
      return next;
    };

    return rows
      .map((row) => ({
        id: Number(row.id),
        senderUserId: resolvePublicId(row.sender_user_id),
        receiverUserId: resolvePublicId(row.receiver_user_id),
        message: this.normalizeFriendChatMessage(row.message),
        createdAt: Number.isFinite(row.created_at) ? Math.floor(Number(row.created_at)) : 0,
      }))
      .filter((row) => Boolean(row.senderUserId) && Boolean(row.receiverUserId) && Boolean(row.message))
      .sort((a, b) => a.createdAt - b.createdAt || a.id - b.id);
  }

  private getFriendPeerReadState(userId: string, friendUserId: string): FriendChatPeerReadState {
    const row = this.db
      .prepare(
        `
        SELECT last_read_message_id, updated_at
        FROM friend_chat_reads
        WHERE user_id = ? AND friend_user_id = ?
        LIMIT 1
      `,
      )
      .get(friendUserId, userId) as
      | { last_read_message_id?: number; updated_at?: number }
      | undefined;

    const lastReadMessageId = Number.isFinite(row?.last_read_message_id)
      ? Math.max(0, Math.floor(Number(row?.last_read_message_id || 0)))
      : 0;
    const lastReadAt = Number.isFinite(row?.updated_at)
      ? Math.max(0, Math.floor(Number(row?.updated_at || 0)))
      : 0;

    return {
      lastReadMessageId,
      lastReadAt,
    };
  }

}
