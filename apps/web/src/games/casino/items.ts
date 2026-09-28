"use client";

import { createContext, useContext } from "react";
import type { CasinoItemId } from "../town/shared/shop";

/** Casino items bought at the town's prize counter; only available when a game is played inside the town. */
export type CasinoItemsApi = {
  count: (id: CasinoItemId) => number;
  /** Spends one; false when none are left or the server did not confirm. */
  use: (id: CasinoItemId) => Promise<boolean>;
};

export const CasinoItemsContext = createContext<CasinoItemsApi | null>(null);

export function useCasinoItems(): CasinoItemsApi | null {
  return useContext(CasinoItemsContext);
}
