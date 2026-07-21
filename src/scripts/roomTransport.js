const ROOM_WS_CONNECT_TIMEOUT_MS = 10000;
const ROOM_WS_CONNECT_RETRIES = 2;
const ROOM_WS_RETRY_DELAY_MS = 600;

function defaultLegacyRoomUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const hostname = window.location.hostname || "localhost";
  return `${protocol}//${hostname}:8788`;
}

function defaultSameOriginRoomUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  if (!host) return "ws://localhost:8788";
  return `${protocol}//${host}/room`;
}

function normalizeServerUrl(raw, fallbackUrl) {
  const input = String(raw || "").trim();
  if (!input) return fallbackUrl;

  try {
    const withProtocol = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(input) ? input : `ws://${input}`;
    const parsed = new URL(withProtocol);
    if (parsed.protocol === "http:") parsed.protocol = "ws:";
    if (parsed.protocol === "https:") parsed.protocol = "wss:";
    if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") {
      return fallbackUrl;
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return fallbackUrl;
  }
}

function dedupeUrls(urls) {
  const seen = new Set();
  const result = [];
  urls.forEach((url) => {
    const key = String(url || "").trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push(key);
  });
  return result;
}

function resolveServerUrlCandidates(serverUrl) {
  const sameOrigin = defaultSameOriginRoomUrl();
  const legacy = defaultLegacyRoomUrl();
  const fallback = sameOrigin;
  const preferred = normalizeServerUrl(serverUrl, fallback);
  const normalizedSameOrigin = normalizeServerUrl(sameOrigin, fallback);
  const normalizedLegacy = normalizeServerUrl(legacy, fallback);
  return dedupeUrls([preferred, normalizedSameOrigin, normalizedLegacy]);
}

function isLocalHost(hostname) {
  const host = String(hostname || "").toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

function shouldIgnoreStoredUrl(storedUrl) {
  try {
    const parsed = new URL(storedUrl);
    const pageHost = window.location.hostname;
    // Ignore stale localhost config when page is opened from a non-local host.
    return isLocalHost(parsed.hostname) && !isLocalHost(pageHost);
  } catch {
    return false;
  }
}

export function resolveRoomServerUrl({ storageKey, queryParamKey, defaultUrl }) {
  const fallback = normalizeServerUrl(defaultUrl || defaultSameOriginRoomUrl(), defaultSameOriginRoomUrl());
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get(queryParamKey);
  if (fromQuery) {
    const normalized = normalizeServerUrl(fromQuery, fallback);
    localStorage.setItem(storageKey, normalized);
    return normalized;
  }

  const fromStorage = localStorage.getItem(storageKey);
  if (fromStorage && shouldIgnoreStoredUrl(fromStorage)) {
    const next = defaultSameOriginRoomUrl();
    localStorage.setItem(storageKey, next);
    return next;
  }
  return normalizeServerUrl(fromStorage, fallback);
}

function createBroadcastTransport({ roomCode, peerId, onMessage, onStatusChange }) {
  const channel = new BroadcastChannel(`neon-othello-room-${roomCode}`);
  channel.onmessage = (event) => {
    const payload = event.data;
    if (!payload || payload.from === peerId) return;
    onMessage(payload);
  };

  onStatusChange?.({ state: "connected", transport: "broadcast", endpoint: "broadcast" });

  return {
    kind: "broadcast",
    endpoint: "broadcast",
    send(message) {
      channel.postMessage({ ...message, from: peerId, room: roomCode });
    },
    close() {
      channel.close();
    },
  };
}

function createWebSocketTransportOnce({ roomCode, peerId, serverUrl, onMessage, onStatusChange }) {
  return new Promise((resolve) => {
    if (typeof WebSocket !== "function") {
      resolve(null);
      return;
    }

    let settled = false;
    let opened = false;
    let ws = null;
    const pending = [];

    function settle(value) {
      if (settled) return;
      settled = true;
      clearTimeout(timerId);
      resolve(value);
    }

    function failToFallback() {
      try {
        ws?.close();
      } catch {
        // no-op
      }
      settle(null);
    }

    try {
      ws = new WebSocket(serverUrl);
    } catch {
      settle(null);
      return;
    }

    const timerId = window.setTimeout(() => {
      if (!opened) failToFallback();
    }, ROOM_WS_CONNECT_TIMEOUT_MS);

    ws.onopen = () => {
      opened = true;
      onStatusChange?.({ state: "connected", transport: "websocket", endpoint: serverUrl });
      const transport = {
        kind: "websocket",
        endpoint: serverUrl,
        send(message) {
          const json = JSON.stringify({ ...message, from: peerId, room: roomCode });
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(json);
          } else {
            pending.push(json);
          }
        },
        close() {
          if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            ws.close();
          }
        },
      };

      while (pending.length) {
        ws.send(pending.shift());
      }

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(String(event.data || "{}"));
          if (!payload || payload.from === peerId) return;
          onMessage(payload);
        } catch {
          // ignore malformed payloads
        }
      };

      settle(transport);
    };

    ws.onerror = () => {
      if (!opened) {
        failToFallback();
      }
    };

    ws.onclose = () => {
      if (opened) {
        onStatusChange?.({ state: "disconnected", transport: "websocket", endpoint: serverUrl });
      }
      if (!opened) {
        failToFallback();
      }
    };
  });
}

async function createWebSocketTransport(params) {
  const candidates = resolveServerUrlCandidates(params.serverUrl);
  for (const candidate of candidates) {
    params.onStatusChange?.({ state: "connecting", transport: "websocket", endpoint: candidate });
    for (let i = 0; i <= ROOM_WS_CONNECT_RETRIES; i += 1) {
      const transport = await createWebSocketTransportOnce({ ...params, serverUrl: candidate });
      if (transport) return transport;
      if (i < ROOM_WS_CONNECT_RETRIES) {
        await new Promise((resolve) => window.setTimeout(resolve, ROOM_WS_RETRY_DELAY_MS));
      }
    }
  }
  return null;
}

export async function createRoomTransport({ roomCode, peerId, serverUrl, onMessage, onStatusChange }) {
  const wsTransport = await createWebSocketTransport({ roomCode, peerId, serverUrl, onMessage, onStatusChange });
  if (wsTransport) return wsTransport;
  onStatusChange?.({ state: "fallback", transport: "broadcast", endpoint: "broadcast" });
  return createBroadcastTransport({ roomCode, peerId, onMessage, onStatusChange });
}
