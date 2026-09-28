// Fetch the look (name + avatar) saved for a cloud account, for a device that has no local profile yet.
import { normalizeAvatar, type AvatarConfig } from "../avatar/parts";
import { resolveRoomServerUrl } from "../core/TownGame";
import type { CloudSession } from "./cloudFriends";

const TIMEOUT_MS = 5000;

/** Resolves to null when the account has no saved look, the login check fails, or the server is unreachable. */
export function fetchCloudProfile(session: CloudSession): Promise<{ name: string; avatar: AvatarConfig } | null> {
  return new Promise((resolve) => {
    let ws: WebSocket;
    try {
      ws = new WebSocket(resolveRoomServerUrl());
    } catch {
      resolve(null);
      return;
    }
    const finish = (value: { name: string; avatar: AvatarConfig } | null) => {
      window.clearTimeout(timer);
      try {
        ws.close();
      } catch {
        // already closed
      }
      resolve(value);
    };
    const timer = window.setTimeout(() => finish(null), TIMEOUT_MS);
    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: "town-profile",
        auth: { userId: session.userId, password: session.password, sessionId: session.sessionId },
      }));
    };
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(String(event.data)) as { type?: string; profile?: { name?: unknown; avatar?: unknown } | null };
        if (msg.type !== "town-profile") return;
        const name = String(msg.profile?.name || "").trim().slice(0, 12);
        finish(msg.profile && name ? { name, avatar: normalizeAvatar(msg.profile.avatar) } : null);
      } catch {
        finish(null);
      }
    };
    ws.onerror = () => finish(null);
    ws.onclose = () => finish(null);
  });
}
