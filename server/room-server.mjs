import crypto from "node:crypto";
import { WebSocketServer, WebSocket } from "ws";

const HOST = process.env.ROOM_HOST || "0.0.0.0";
const PORT = Number(process.env.ROOM_PORT || 8788);
const MAX_ROOM_PLAYERS = Number(process.env.ROOM_MAX_PLAYERS || 16);
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
const ROOM_STALE_MEMBER_TTL_MS = Number(process.env.ROOM_STALE_MEMBER_TTL_MS || 5500);
const ROOM_STALE_SWEEP_INTERVAL_MS = Number(process.env.ROOM_STALE_SWEEP_INTERVAL_MS || 1000);
const ROOM_HOST_REASSIGN_GRACE_MS = Number(process.env.ROOM_HOST_REASSIGN_GRACE_MS || 5000);
const ROOM_DEBUG_STATE = String(process.env.ROOM_DEBUG_STATE || "1").trim() !== "0";

const rooms = new Map();
const roomMeta = new Map();
const roomStateDebugSignature = new Map();

function normalizeRoomCode(raw) {
  const code = String(raw || "").replace(/\D/g, "").slice(0, 6);
  return code;
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
  return asBoolean(value, false);
}

function normalizePlayerName(raw) {
  const trimmed = String(raw || "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "Player";
  return trimmed.slice(0, 18);
}

function normalizeRoomPassword(raw) {
  return String(raw || "").trim().slice(0, 32);
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

function roomMetaOf(code) {
  if (!roomMeta.has(code)) {
    roomMeta.set(code, {
      hostPeerId: "",
      hostNameSnapshot: "",
      hostReassignGraceUntil: 0,
      pendingTransitionCount: 0,
      pendingTransitionUntil: 0,
      parentRoomCode: "",
      childPanelKey: "",
      childRoomByPanel: new Map(),
      listContext: "menu",
      isPublic: true,
      accessPassword: "",
      inGame: false,
      allowedPeerIds: new Set(),
      mutedPeers: new Map(),
      reports: new Map(),
      messageStates: new Map(),
      rematchVotes: new Set(),
      drawVotes: new Set(),
      inviteTokens: new Map(),
      privateAccessPeerIds: new Set(),
    });
  }
  return roomMeta.get(code);
}

function nowTs() {
  return Date.now();
}

function markMemberSeen(ws) {
  ws.lastSeenAt = nowTs();
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

function cleanupRoomMetaIfEmpty(code) {
  const members = rooms.get(code);
  if (members && members.size > 0) return;
  roomMeta.delete(code);
  roomStateDebugSignature.delete(code);
}

function isChatMutatingType(type) {
  return type === "chat" || type === "chat-edit" || type === "chat-retract";
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
  state.lastAt = now;
  state.lastText = text;
  return { ok: true };
}

function normalizeMessageId(raw) {
  const id = String(raw || "").trim();
  if (!id) return "";
  return id.slice(0, 80);
}

function isHost(meta, peerId) {
  return Boolean(meta?.hostPeerId && peerId && meta.hostPeerId === peerId);
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

function sendError(ws, code, detail = "") {
  sendJson(ws, { type: "error", code, detail });
}

function roomOf(code) {
  if (!rooms.has(code)) {
    rooms.set(code, new Set());
  }
  return rooms.get(code);
}

function normalizeRemoteAddress(raw) {
  const text = String(raw || "").trim();
  if (!text) return "";
  return text.replace(/^::ffff:/, "");
}

function getRemoteNameFingerprint(member) {
  if (!member) return "";
  const remote = normalizeRemoteAddress(member.remoteAddr);
  const name = normalizePlayerName(member.playerName);
  if (!remote || !name) return "";
  return `${remote}|${name}`;
}

function getMemberGuestFingerprint(member) {
  if (!member) return "";
  if (member.userId || member.clientId) return "";
  return getRemoteNameFingerprint(member);
}

function getMemberIdentityKey(member) {
  if (!member) return "";
  if (member.peerId) return `peer:${member.peerId}`;
  if (member.clientId) return `client:${member.clientId}`;
  if (member.userId) return `user:${member.userId}`;
  const guestFingerprint = getMemberGuestFingerprint(member);
  if (guestFingerprint) return `guest:${guestFingerprint}`;
  return "";
}

function buildRoomDebugIdentityRows(code) {
  const members = rooms.get(code);
  if (!members) return [];
  const rows = [];
  for (const member of members) {
    rows.push({
      key: getMemberIdentityKey(member),
      peerId: String(member.peerId || ""),
      clientId: String(member.clientId || ""),
      userId: String(member.userId || ""),
      remoteAddr: String(member.remoteAddr || ""),
      name: normalizePlayerName(member.playerName),
      spectator: Boolean(member.spectator),
    });
  }
  return rows;
}

function debugRoomStateIfChanged(code) {
  if (!ROOM_DEBUG_STATE || !code) return;
  const rows = buildRoomDebugIdentityRows(code);
  const signature = JSON.stringify(rows.map((row) => [
    row.key,
    row.peerId,
    row.clientId,
    row.userId,
    row.remoteAddr,
    row.name,
    row.spectator,
  ]).sort((a, b) => String(a[0]).localeCompare(String(b[0]))));
  if (roomStateDebugSignature.get(code) === signature) return;
  roomStateDebugSignature.set(code, signature);

  const uniqueKeys = new Set(rows.map((row) => row.key || `peer:${row.peerId}`));
  console.log(
    `[room-state] code=${code} sockets=${rows.length} unique=${uniqueKeys.size} identities=${[...uniqueKeys].join(",") || "(none)"}`,
  );
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

function roomParticipants(code) {
  const members = rooms.get(code);
  if (!members) return [];

  const meta = roomMetaOf(code);
  // Keep one participant per live connection identity.
  const participantByIdentity = new Map();
  for (const member of members) {
    if (!member.peerId) continue;
    const dedupeKey = getMemberIdentityKey(member) || `peer:${member.peerId}`;
    const role = meta.inGame && !meta.allowedPeerIds.has(member.peerId)
      ? "spectator"
      : (member.spectator ? "spectator" : (meta.hostPeerId === member.peerId ? "host" : "guest"));
    participantByIdentity.set(dedupeKey, {
      id: member.peerId,
      name: normalizePlayerName(member.playerName),
      role,
      panel: normalizePlayablePanel(member.currentPanel),
    });
  }
  return [...participantByIdentity.values()];
}

function canJoinInCurrentMatch(meta, ws) {
  if (!meta?.inGame) return true;
  if (!ws?.peerId) return false;
  return meta.allowedPeerIds.has(ws.peerId);
}

function pickQuickJoinRoomCode() {
  const candidates = [];
  for (const [code, members] of rooms.entries()) {
    const size = members?.size || 0;
    if (size <= 0 || size >= MAX_ROOM_PLAYERS) continue;
    const meta = roomMetaOf(code);
    if (!meta.isPublic || meta.inGame) continue;
    const activePlayers = activePlayerCount(code);
    // Quick match should join rooms that already have at least one active player.
    // Skip spectator-only rooms so the first real entrant can become host in a new room.
    if (activePlayers < 1 || activePlayers >= MAX_ROOM_PLAYERS) continue;
    candidates.push(code);
  }
  return candidates[0] || "";
}

function listQuickJoinCandidateCodes(limit = 12) {
  const codes = [];
  for (const [code, members] of rooms.entries()) {
    if (codes.length >= limit) break;
    const size = members?.size || 0;
    if (size <= 0 || size >= MAX_ROOM_PLAYERS) continue;
    const meta = roomMetaOf(code);
    if (!meta.isPublic || meta.inGame) continue;
    const activePlayers = activePlayerCount(code);
    if (activePlayers < 1 || activePlayers >= MAX_ROOM_PLAYERS) continue;
    codes.push(code);
  }
  return codes;
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

function normalizeChildPanelKey(rawPanel) {
  const panel = normalizePlayablePanel(rawPanel);
  return panel || "__any";
}

function registerChildRoomOnSource(sourceCode, panelKey, childCode) {
  if (!sourceCode || !childCode) return;
  const sourceMeta = roomMetaOf(sourceCode);
  sourceMeta.childRoomByPanel.set(panelKey, childCode);
}

function unregisterChildRoomOnSource(sourceCode, childCode) {
  if (!sourceCode || !childCode) return;
  const sourceMeta = roomMeta.get(sourceCode);
  if (!sourceMeta?.childRoomByPanel) return;
  for (const [panelKey, mappedCode] of sourceMeta.childRoomByPanel.entries()) {
    if (mappedCode !== childCode) continue;
    sourceMeta.childRoomByPanel.delete(panelKey);
  }
}

function canReuseChildRoomCode(code, sourceCode, panelKey) {
  if (!code || !rooms.has(code)) return false;
  const members = rooms.get(code);
  if (!members || members.size <= 0 || members.size >= MAX_ROOM_PLAYERS) return false;
  const meta = roomMetaOf(code);
  if (!meta.isPublic || meta.inGame) return false;
  if (normalizeRoomCode(meta.parentRoomCode) !== sourceCode) return false;
  // Reuse only while child room is still in "waiting" state.
  // Once 2+ active players are already inside, allow creating another child room.
  if (activePlayerCount(code) >= 2) return false;
  const childPanelKey = String(meta.childPanelKey || "").trim();
  if (panelKey !== "__any" && childPanelKey && childPanelKey !== panelKey) return false;
  return true;
}

function findReusableChildRoomCode(sourceCode, panelKey) {
  if (!sourceCode) return "";
  const sourceMeta = roomMetaOf(sourceCode);
  const mapped = String(sourceMeta.childRoomByPanel.get(panelKey) || "").trim();
  if (mapped && canReuseChildRoomCode(mapped, sourceCode, panelKey)) {
    return mapped;
  }
  if (mapped) {
    sourceMeta.childRoomByPanel.delete(panelKey);
  }

  for (const [code] of rooms.entries()) {
    if (!canReuseChildRoomCode(code, sourceCode, panelKey)) continue;
    sourceMeta.childRoomByPanel.set(panelKey, code);
    return code;
  }
  return "";
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
      hasPassword: Boolean(meta.accessPassword),
      inGame: Boolean(meta.inGame),
      activePlayers: Math.max(0, Math.min(MAX_ROOM_PLAYERS, mergedActivePlayers)),
      spectatorCount: mergedSpectatorCount,
      totalParticipants: Math.max(0, Math.min(MAX_ROOM_PLAYERS, mergedTotalParticipants)),
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

function lockCurrentParticipantsForMatch(code) {
  const meta = roomMetaOf(code);
  const members = rooms.get(code);
  if (!members) return;
  meta.inGame = true;
  meta.allowedPeerIds = new Set();
  for (const member of members) {
    if (member.peerId && !member.spectator) {
      meta.allowedPeerIds.add(member.peerId);
    }
  }
}

function unlockMatchForLobby(code) {
  const meta = roomMetaOf(code);
  meta.inGame = false;
  meta.allowedPeerIds = new Set();
  meta.rematchVotes = new Set();
  meta.drawVotes = new Set();
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
  const activeIdentityKeys = new Set();
  for (const member of members) {
    if (member.peerId && !member.spectator) {
      const dedupeKey = getMemberIdentityKey(member) || `peer:${member.peerId}`;
      activeIdentityKeys.add(dedupeKey);
    }
  }
  return activeIdentityKeys.size;
}

function canVoteRematch(meta, ws) {
  if (!meta.inGame) return false;
  if (!ws?.peerId || ws.spectator) return false;
  if (meta.allowedPeerIds.size > 0) return meta.allowedPeerIds.has(ws.peerId);
  return true;
}

function canVoteDraw(meta, ws, code) {
  if (!ws?.peerId || ws.spectator) return false;
  if (activePlayerCount(code) < 2) return false;
  if (meta.allowedPeerIds.size > 0) return meta.allowedPeerIds.has(ws.peerId);
  return true;
}

function broadcastRematchVoteState(code) {
  const meta = roomMetaOf(code);
  broadcastToRoom(code, {
    type: "rematch-vote-state",
    room: code,
    votes: [...meta.rematchVotes],
    required: 2,
  });
}

function broadcastDrawVoteState(code) {
  const meta = roomMetaOf(code);
  broadcastToRoom(code, {
    type: "draw-vote-state",
    room: code,
    votes: [...meta.drawVotes],
    required: 2,
  });
}

function broadcastRoomState(code) {
  if (!code) return;
  const members = rooms.get(code);
  if (!members || members.size === 0) return;
  debugRoomStateIfChanged(code);
  const meta = roomMetaOf(code);
  broadcastToRoom(code, {
    type: "room-state",
    room: code,
    participants: roomParticipants(code),
    hostPeerId: meta.hostPeerId || "",
    isPublic: Boolean(meta.isPublic),
    inGame: Boolean(meta.inGame),
    rematchVotes: [...meta.rematchVotes],
    drawVotes: [...meta.drawVotes],
  });
  broadcastRoomsList();
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
    meta.drawVotes.delete(ws.peerId);
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
      meta.hostPeerId = pickNextHostPeerId(code);
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
    const parentCode = normalizeRoomCode(meta?.parentRoomCode);
    if (parentCode) {
      unregisterChildRoomOnSource(parentCode, code);
    }
    rooms.delete(code);
    roomMeta.delete(code);
    roomStateDebugSignature.delete(code);
  }
}

function pruneStaleRoomMembers() {
  const now = nowTs();
  const dirtyCodes = new Set();

  for (const [code, members] of rooms.entries()) {
    for (const member of [...members]) {
      const seenAt = Number(member.lastSeenAt || 0);
      const stale = !Number.isFinite(seenAt) || now - seenAt > ROOM_STALE_MEMBER_TTL_MS;
      const notOpen = member.readyState !== WebSocket.OPEN;
      if (!stale && !notOpen) continue;
      removeFromRoom(member);
      dirtyCodes.add(code);
    }
  }

  for (const code of dirtyCodes) {
    broadcastRoomState(code);
  }
  if (dirtyCodes.size > 0) {
    broadcastRoomsList();
  }
}

function sendJson(ws, payload) {
  if (ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(payload));
}

function broadcastToRoom(code, payload, exceptWs = null) {
  const members = rooms.get(code);
  if (!members) return;

  for (const member of members) {
    if (member === exceptWs) continue;
    sendJson(member, payload);
  }
}

function tryJoinRoom(ws, payload) {
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
  const childPanelKey = normalizeChildPanelKey(ws.currentPanel);
  const forceNewChildRoom = asBoolean(payload?.forceNewChild, false);

  if (!code && ws.roomCode) {
    code = ws.roomCode;
  }

  if (quickJoin && !code) {
    // Make quick match deterministic: if no joinable room exists, create one.
    code = allocateRoomCode();
  }

  if (!quickJoin && !code && explicitCreate && type === "hello") {
    if (requestedSourceCode && !forceNewChildRoom) {
      code = findReusableChildRoomCode(requestedSourceCode, childPanelKey);
    }
    if (!code) {
      code = allocateRoomCode();
    }
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
      const preserveSourceRoom = Boolean(
        explicitCreate
        && requestedSourceCode
        && currentCode
        && currentCode === requestedSourceCode
        && requestedSourceCode !== code,
      );
      if (preserveSourceRoom) {
        removeFromRoom(ws, { preserveEmptyRoom: true, preserveHostPeerId: true });
      } else {
        removeFromRoom(ws);
      }
      ws.roomCode = null;
    }
  }

  const evicted = evictDuplicatePeerConnections(ws);
  const members = roomOf(code);
  const requestedSpectate = asSpectateBoolean(payload?.spectate);
  if (!ws.roomCode && members.size >= MAX_ROOM_PLAYERS) {
    sendJson(ws, { type: "room-full", code });
    return { ok: false, joined: false };
  }

  const meta = roomMetaOf(code);
  const requestedRoomPassword = normalizeRoomPassword(payload?.roomPassword);
  ensureHostPeerId(code);
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
  if (!ws.roomCode && !requestedSpectate && !canJoinInCurrentMatch(meta, ws)) {
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
        // Recreate/keep parent lobby entry so child-room creation does not orphan return target.
        roomOf(sourceCode);
        const sourceMeta = roomMetaOf(sourceCode);
        if (sourceMeta.listContext !== "menu") {
          sourceMeta.listContext = "menu";
        }
        sourceMeta.pendingTransitionCount = 0;
        sourceMeta.pendingTransitionUntil = 0;
        meta.parentRoomCode = sourceCode;
        meta.childPanelKey = childPanelKey;
        grantPrivateAccessFromSourceRoom(meta, sourceCode);
        registerChildRoomOnSource(sourceCode, childPanelKey, code);
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
    if (asBoolean(payload?.create, false)) {
      meta.listContext = requestedListContext || (ws.currentPanel ? "game" : "menu");
      meta.accessPassword = requestedRoomPassword;
    }
  }

  return {
    ok: true,
    joined,
    evicted,
    code,
    quickJoin,
    assignedRole,
    isPublic: Boolean(meta.isPublic),
  };
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

  broadcastToRoom(code, {
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

  broadcastToRoom(code, {
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
    broadcastToRoom(code, {
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
    const createdAt = nowTs();
    meta.messageStates.set(messageId, {
      ownerId: ws.peerId || "",
      createdAt,
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

const wss = new WebSocketServer({ host: HOST, port: PORT });

wss.on("connection", (ws) => {
  ws.roomCode = null;
  ws.peerId = null;
  ws.clientId = null;
  ws.userId = null;
  ws.currentPanel = "";
  ws.remoteAddr = normalizeRemoteAddress(ws?._socket?.remoteAddress);
  ws.spectator = false;
  markMemberSeen(ws);
  ws.chatRateState = {
    timestamps: [],
    lastText: "",
    lastAt: 0,
  };

  ws.on("message", (raw) => {
    markMemberSeen(ws);
    let payload = null;
    try {
      payload = JSON.parse(String(raw || "{}"));
    } catch {
      return;
    }

    if (!payload || typeof payload !== "object") return;
    ws.peerId = String(payload.from || ws.peerId || "").trim() || ws.peerId;
    ws.clientId = String(payload.clientId || ws.clientId || "").trim() || ws.clientId;
    ws.userId = String(payload.userId || ws.userId || "").trim() || ws.userId;
    if (Object.prototype.hasOwnProperty.call(payload, "panel")) {
      ws.currentPanel = normalizePlayablePanel(payload.panel);
    }
    if (typeof payload.name === "string") {
      ws.playerName = normalizePlayerName(payload.name);
    }
    ws.spectator = asSpectateBoolean(payload?.spectate ?? ws.spectator);

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

    const joinResult = tryJoinRoom(ws, payload);
    if (!joinResult.ok) return;

    const code = ws.roomCode;
    if (!code) return;

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
        return;
      }
      broadcastRoomState(code);
      return;
    }

    if (type === "sync-room-state") {
      broadcastRoomState(code);
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

    if (type === "host-mute") {
      handleHostMute(code, ws, payload);
      return;
    }
    if (type === "host-unmute") {
      handleHostUnmute(code, ws, payload);
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

      const requiredVotes = 2;
      if (activePlayerCount(code) >= requiredVotes && meta.rematchVotes.size >= requiredVotes) {
        meta.rematchVotes = new Set();
        const nextGame = String(payload?.game || "").trim();
        if (nextGame) {
          broadcastToRoom(code, {
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

    if (type === "draw-vote") {
      const meta = roomMetaOf(code);
      if (!canVoteDraw(meta, ws, code)) {
        sendError(ws, "DRAW_VOTE_FORBIDDEN");
        return;
      }
      meta.drawVotes.add(ws.peerId);
      broadcastDrawVoteState(code);

      const requiredVotes = 2;
      if (activePlayerCount(code) >= requiredVotes && meta.drawVotes.size >= requiredVotes) {
        meta.drawVotes = new Set();
        broadcastToRoom(code, {
          type: "draw-confirmed",
          room: code,
          by: "agreement",
        });
        broadcastDrawVoteState(code);
      }
      return;
    }

    if (type === "draw-unvote") {
      const meta = roomMetaOf(code);
      if (!canVoteDraw(meta, ws, code)) {
        sendError(ws, "DRAW_VOTE_FORBIDDEN");
        return;
      }
      meta.drawVotes.delete(ws.peerId);
      broadcastDrawVoteState(code);
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
      meta.drawVotes = new Set();
      lockCurrentParticipantsForMatch(code);
    }

    if (joinResult.joined || joinResult.evicted || payload.type === "hello" || payload.type === "presence") {
      broadcastRoomState(code);
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

    if (type === "chat") {
      sendJson(ws, envelope);
    }

    broadcastToRoom(code, envelope, ws);
  });

  ws.on("close", () => {
    const code = ws.roomCode;
    const from = ws.peerId;
    removeFromRoom(ws);
    broadcastRoomState(code);
    broadcastRoomsList();
    if (code && from) {
      broadcastToRoom(code, { type: "leave", from, room: code });
    }
  });
});

setInterval(pruneStaleRoomMembers, ROOM_STALE_SWEEP_INTERVAL_MS);

console.log(`Room server running at ws://${HOST}:${PORT}`);
