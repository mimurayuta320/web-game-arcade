import { WebSocketServer, WebSocket } from "ws";

const HOST = process.env.ROOM_HOST || "0.0.0.0";
const PORT = Number(process.env.ROOM_PORT || 8788);
const MAX_ROOM_PLAYERS = Number(process.env.ROOM_MAX_PLAYERS || 8);

const rooms = new Map();

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

function broadcastToRoom(code, payload, exceptWs = null) {
  const members = rooms.get(code);
  if (!members) return;

  for (const member of members) {
    if (member === exceptWs) continue;
    sendJson(member, payload);
  }
}

function roomParticipants(code) {
  const members = rooms.get(code);
  if (!members) return [];

  const participants = [];
  for (const member of members) {
    if (!member.peerId) continue;
    participants.push({
      id: member.peerId,
      name: String(member.playerName || "Player").trim().slice(0, 18) || "Player",
    });
  }
  return participants;
}

function broadcastRoomState(code) {
  if (!code) return;
  broadcastToRoom(code, { type: "room-state", room: code, participants: roomParticipants(code) });
}

function tryJoinRoom(ws, payload) {
  const code = String(payload.room || "").trim();
  if (!code) {
    sendJson(ws, { type: "error", code: "ROOM_REQUIRED" });
    return { ok: false, joined: false };
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

const wss = new WebSocketServer({ host: HOST, port: PORT });

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
    const joinResult = tryJoinRoom(ws, payload);
    if (!joinResult.ok) return;

    ws.peerId = String(payload.from || ws.peerId || "").trim() || ws.peerId;
    if (typeof payload.name === "string") {
      ws.playerName = String(payload.name).trim().slice(0, 18) || "Player";
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

    broadcastToRoom(ws.roomCode, envelope, ws);
  });

  ws.on("close", () => {
    const code = ws.roomCode;
    const from = ws.peerId;
    removeFromRoom(ws);
    broadcastRoomState(code);
    if (code && from) {
      broadcastToRoom(code, { type: "leave", from, room: code });
    }
  });
});

console.log(`Room server running at ws://${HOST}:${PORT}`);
