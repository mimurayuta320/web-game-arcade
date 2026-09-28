// Client for the arcade's cloud friend API (/api/friends/*), used by the town's "ピグとも" panel.
// Credentials come from the same localStorage keys the main arcade page writes on login.

export type FriendEntry = { friendId: string; playerName: string };

export type CloudSession = { userId: string; password: string; sessionId: string; friendId: string };

const USER_ID_KEY = "neon-cloud-user-id";
const PASSWORD_KEY = "neon-cloud-password";
const SESSION_ID_KEY = "neon-cloud-session-id";
const FRIEND_ID_KEY = "neon-cloud-friend-id";

/** The logged-in cloud account, or null when playing as a guest. */
export function loadCloudSession(): CloudSession | null {
  try {
    const userId = (localStorage.getItem(USER_ID_KEY) || "").trim();
    const password = localStorage.getItem(PASSWORD_KEY) || "";
    const sessionId = (localStorage.getItem(SESSION_ID_KEY) || "").trim();
    const friendId = (localStorage.getItem(FRIEND_ID_KEY) || "").trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24);
    if (!userId || !password || !sessionId) return null;
    return { userId, password, sessionId, friendId };
  } catch {
    return null;
  }
}

const ERROR_TEXT: Record<string, string> = {
  ALREADY_FRIENDS: "すでにピグともです",
  REQUEST_ALREADY_SENT: "すでに申請ずみです",
  REQUEST_ALREADY_RECEIVED: "相手から申請が届いています。「承認」できます",
  FRIEND_SELF_FORBIDDEN: "自分にはおくれません",
  FRIEND_NOT_FOUND: "そのユーザーは見つかりませんでした",
  REQUEST_NOT_FOUND: "その申請はもうありません",
  INVALID_SESSION: "ログインの有効期限が切れました。アーケード画面でログインしなおしてください",
  REQUEST_TIMEOUT: "サーバーにつながりませんでした",
};

export function friendErrorText(error: unknown): string {
  const code = error instanceof Error ? error.message : "";
  return ERROR_TEXT[code] || "うまくいきませんでした。少し待ってからもう一度どうぞ";
}

async function call(path: string, session: CloudSession, extra: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: session.userId, password: session.password, sessionId: session.sessionId, ...extra }),
      signal: controller.signal,
    });
  } catch (error) {
    throw new Error((error as Error)?.name === "AbortError" ? "REQUEST_TIMEOUT" : "NETWORK");
  } finally {
    window.clearTimeout(timeout);
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || data.ok !== true) throw new Error(String(data.code || data.message || `HTTP ${res.status}`));
  return data;
}

function entries(raw: unknown): FriendEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: FriendEntry[] = [];
  for (const item of raw) {
    const row = item && typeof item === "object" ? (item as Record<string, unknown>) : null;
    const friendId = String(row?.friendId ?? row?.userId ?? "").trim();
    if (!friendId) continue;
    out.push({ friendId, playerName: String(row?.playerName || friendId) });
  }
  return out;
}

export type FriendsSnapshot = { friends: FriendEntry[]; incoming: FriendEntry[]; outgoing: FriendEntry[] };

export const friendsApi = {
  async load(session: CloudSession): Promise<FriendsSnapshot> {
    const [friends, incoming, outgoing] = await Promise.all([
      call("/api/friends/list", session),
      call("/api/friends/request/incoming", session),
      call("/api/friends/request/outgoing", session),
    ]);
    return { friends: entries(friends.friends), incoming: entries(incoming.incoming), outgoing: entries(outgoing.outgoing) };
  },
  async search(session: CloudSession, query: string): Promise<FriendEntry[]> {
    return entries((await call("/api/friends/search", session, { query })).users);
  },
  async sendRequest(session: CloudSession, targetFriendId: string): Promise<void> {
    await call("/api/friends/request/send", session, { targetFriendId });
  },
  async approve(session: CloudSession, requesterFriendId: string): Promise<void> {
    await call("/api/friends/request/approve", session, { requesterUserId: requesterFriendId });
  },
  async reject(session: CloudSession, requesterFriendId: string): Promise<void> {
    await call("/api/friends/request/reject", session, { requesterUserId: requesterFriendId });
  },
  async cancel(session: CloudSession, targetFriendId: string): Promise<void> {
    await call("/api/friends/request/cancel", session, { targetUserId: targetFriendId });
  },
  async remove(session: CloudSession, friendId: string): Promise<void> {
    await call("/api/friends/remove", session, { friendUserId: friendId });
  },
};
