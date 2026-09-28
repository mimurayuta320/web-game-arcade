"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BANK_CHANGED_EVENT, DEFAULT_BANKROLL, MIN_BET, bankStorageKey, casinoScope, readBank, writeBank } from "./bank";

export function useCasinoBank() {
  const [ready, setReady] = useState(false);
  const [bank, setBank] = useState(DEFAULT_BANKROLL);
  const scopeRef = useRef("guest");

  useEffect(() => {
    const scope = casinoScope();
    scopeRef.current = scope;
    const initial = readBank(scope);
    setBank(initial);
    setReady(true);

    // Keep several tabs (e.g. slots + blackjack) on the same balance.
    const onStorage = (event: StorageEvent) => {
      if (event.key !== bankStorageKey(scopeRef.current)) return;
      const next = readBank(scopeRef.current);
      setBank(next);
    };
    // Coins added or spent elsewhere in this tab (login bonus, prize counter).
    const onLocal = () => setBank(readBank(scopeRef.current));
    window.addEventListener("storage", onStorage);
    window.addEventListener(BANK_CHANGED_EVENT, onLocal);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(BANK_CHANGED_EVENT, onLocal);
    };
  }, []);

  /** Add (or subtract) coins. Reads storage first so another tab's result is never overwritten. */
  const change = useCallback((delta: number) => {
    const current = readBank(scopeRef.current);
    const next = Math.max(0, current + Math.floor(delta));
    writeBank(scopeRef.current, next);
    setBank(next);
    return next;
  }, []);

  /** Bankrupt players (< minimum bet) get the starting stack back, like the other casino games. */
  const refillIfBroke = useCallback(() => {
    if (readBank(scopeRef.current) >= MIN_BET) return false;
    writeBank(scopeRef.current, DEFAULT_BANKROLL);
    setBank(DEFAULT_BANKROLL);
    return true;
  }, []);

  /** Latest balance straight from storage (state can lag behind during animations). */
  const current = useCallback(() => readBank(scopeRef.current), []);

  return { ready, bank, change, refillIfBroke, current };
}
