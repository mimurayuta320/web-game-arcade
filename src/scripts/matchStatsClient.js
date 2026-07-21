import { cloudApiRequestData } from "./cloudApiClient.js";

const MATCH_RESULT_VALUES = new Set(["win", "lose", "draw"]);

function normalizeGameKey(raw) {
  return String(raw || "").trim().toLowerCase().slice(0, 24);
}

function normalizeResult(raw) {
  const value = String(raw || "").trim().toLowerCase();
  return MATCH_RESULT_VALUES.has(value) ? value : "";
}

function normalizeRoomCode(raw) {
  return String(raw || "").replace(/\D/g, "").slice(0, 6);
}

function normalizeOpponent(raw) {
  return String(raw || "").trim().replace(/\s+/g, " ").slice(0, 18);
}

export function createMatchStatsClient({ userId, password }) {
  const auth = {
    userId: String(userId || "").trim(),
    password: String(password || ""),
  };

  function isEnabled() {
    return Boolean(auth.userId && auth.password);
  }

  async function loadProfile() {
    if (!isEnabled()) {
      return { ok: false, reason: "AUTH_REQUIRED" };
    }

    const data = await cloudApiRequestData("/api/profile/load", {
      userId: auth.userId,
      password: auth.password,
    });

    return {
      ok: true,
      profile: data?.profile || null,
      matchStats: data?.profile?.matchStats || null,
      recentMatches: data?.profile?.recentMatches || [],
    };
  }

  async function recordMatch(input) {
    if (!isEnabled()) {
      return { ok: false, reason: "AUTH_REQUIRED" };
    }

    const game = normalizeGameKey(input?.game);
    const result = normalizeResult(input?.result);
    if (!game || !result) {
      return { ok: false, reason: "INVALID_INPUT" };
    }

    const data = await cloudApiRequestData("/api/match/record", {
      userId: auth.userId,
      password: auth.password,
      match: {
        game,
        result,
        roomCode: normalizeRoomCode(input?.roomCode),
        opponent: normalizeOpponent(input?.opponent),
      },
    });

    return {
      ok: true,
      match: data?.match || null,
      matchStats: data?.matchStats || null,
    };
  }

  return {
    isEnabled,
    loadProfile,
    recordMatch,
  };
}
