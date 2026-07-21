const CLOUD_USER_ID_KEY = "neon-cloud-user-id";
const CLOUD_PASSWORD_KEY = "neon-cloud-password";

function normalizeUserId(raw) {
  return String(raw || "").trim();
}

export function readStoredAuth() {
  try {
    const userId = normalizeUserId(localStorage.getItem(CLOUD_USER_ID_KEY));
    const password = String(localStorage.getItem(CLOUD_PASSWORD_KEY) || "");
    if (!userId || !password) return null;
    return { userId, password };
  } catch {
    return null;
  }
}

export function scopedStorageKey(baseKey, rawUserId = "") {
  const userId = normalizeUserId(rawUserId);
  const scope = userId ? `user:${userId}` : "guest";
  return `${baseKey}:${scope}`;
}
