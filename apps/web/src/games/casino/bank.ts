// Shared casino coin bank. Uses the same localStorage key as blackjack/poker in app/page.tsx
// (`neon-casino-shared-bank-v1:<scope>`), so coins carry over between all casino games.
// Coins are virtual: they are stored in this browser only and can never be bought or cashed out.

export const CASINO_BANK_STORAGE_KEY = "neon-casino-shared-bank-v1";
export const DEFAULT_BANKROLL = 1000;
export const MIN_BET = 10;
export const BET_STEP = 10;

const CLOUD_USER_ID_KEY = "neon-cloud-user-id";
const CLOUD_SESSION_ID_KEY = "neon-cloud-session-id";

/** Mirrors page.tsx: logged-in users get their own bank, everyone else shares "guest". */
export function casinoScope(): string {
  try {
    const userId = (localStorage.getItem(CLOUD_USER_ID_KEY) || "").trim().slice(0, 24);
    const sessionId = (localStorage.getItem(CLOUD_SESSION_ID_KEY) || "").trim();
    if (userId && sessionId) return `cloud:${userId}`;
  } catch {
    // storage unavailable
  }
  return "guest";
}

export function bankStorageKey(scope: string): string {
  return `${CASINO_BANK_STORAGE_KEY}:${scope}`;
}

export function readBank(scope: string): number {
  try {
    const raw = localStorage.getItem(bankStorageKey(scope));
    if (raw === null) return DEFAULT_BANKROLL;
    const value = Number(raw);
    if (Number.isFinite(value) && value >= 0) return Math.floor(value);
  } catch {
    // storage unavailable
  }
  return DEFAULT_BANKROLL;
}

/** Same-tab change notice (the `storage` event only reaches other tabs). */
export const BANK_CHANGED_EVENT = "neon-casino-bank-changed";

export function writeBank(scope: string, value: number): void {
  try {
    localStorage.setItem(bankStorageKey(scope), String(Math.max(0, Math.floor(value))));
  } catch {
    // storage unavailable – the balance lasts for this visit only
  }
  try {
    window.dispatchEvent(new CustomEvent(BANK_CHANGED_EVENT, { detail: { scope } }));
  } catch {
    // no window (never happens in the browser)
  }
}

/** Add coins to the current account's (or guest) bank from outside a casino game, e.g. the daily login bonus. */
export function addCoins(delta: number): number {
  const scope = casinoScope();
  const next = Math.max(0, readBank(scope) + Math.floor(delta));
  writeBank(scope, next);
  return next;
}

/** Largest allowed bet not above `bankroll`, snapped to BET_STEP. */
export function maxBet(bankroll: number): number {
  return Math.max(MIN_BET, Math.floor(Math.max(0, bankroll) / BET_STEP) * BET_STEP);
}

export function clampBet(value: number, bankroll: number): number {
  const snapped = Math.floor((Number.isFinite(value) ? value : MIN_BET) / BET_STEP) * BET_STEP;
  return Math.max(MIN_BET, Math.min(maxBet(bankroll), snapped));
}

/** Unbiased random integer in [0, n) from the browser's CSPRNG. */
export function randomInt(n: number): number {
  const limit = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % n;
}
