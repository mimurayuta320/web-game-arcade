import { WebSocketServer, WebSocket } from "ws";

const HOST = process.env.ROOM_HOST || "0.0.0.0";
const PORT = Number(process.env.ROOM_PORT || 8788);
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

const rooms = new Map();
const roomMeta = new Map();

function roomMetaOf(code) {
  if (!roomMeta.has(code)) {
    roomMeta.set(code, {
      hostPeerId: "",
      mutedPeers: new Map(),
      reports: new Map(),
      messageStates: new Map(),
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

function cleanupRoomMetaIfEmpty(code) {
  const members = rooms.get(code);
  if (members && members.size > 0) return;
  roomMeta.delete(code);
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
    if (member.peerId) return member.peerId;
  }
  return "";
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

function removeFromRoom(ws) {
  const code = ws.roomCode;
  if (!code) return;
  const members = rooms.get(code);
  if (!members) return;

  members.delete(ws);
  const meta = roomMeta.get(code);
  if (meta && ws.peerId && meta.hostPeerId === ws.peerId) {
    meta.hostPeerId = pickNextHostPeerId(code);
  }
  if (members.size === 0) {
    rooms.delete(code);
    roomMeta.delete(code);
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
    return false;
  }

  if (!ws.roomCode) {
    ws.roomCode = code;
    members.add(ws);
    const meta = roomMetaOf(code);
    if (!meta.hostPeerId && ws.peerId) {
      meta.hostPeerId = ws.peerId;
    }
  }

  return true;
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
    if (!tryJoinRoom(ws, payload)) return;

    const code = ws.roomCode;
    if (!code) return;

    const type = String(payload.type || "");
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

    let mutationResult = { ok: true };
    if (isChatMutatingType(type)) {
      mutationResult = validateAndTrackChatMutation(code, ws, payload);
      if (!mutationResult.ok) return;
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

    broadcastToRoom(code, envelope, ws);
  });

  ws.on("close", () => {
    const code = ws.roomCode;
    const from = ws.peerId;
    removeFromRoom(ws);
    if (code && from) {
      broadcastToRoom(code, { type: "leave", from, room: code });
    }
  });
});

console.log(`Room server running at ws://${HOST}:${PORT}`);
