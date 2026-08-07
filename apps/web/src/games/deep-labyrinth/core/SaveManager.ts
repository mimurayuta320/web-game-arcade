import type { GameState } from "../types/game";
import { INITIAL_MAX_DIG_COUNT, MAP_COLUMNS, MAP_ROWS } from "../data/balance";

const SAVE_KEY = "deep-labyrinth-save-v1";
const SAVE_VERSION = 3;
const LEGACY_MAX_DIG_COUNT = 60;

export interface SavePayload {
  version: number;
  highScore: number;
  tutorialCompleted: boolean;
  volume: number;
  controlScheme: "auto" | "touch" | "mouse";
  mapMeta?: { columns: number; rows: number };
  checkpoint: Partial<GameState> | null;
}

export const DEFAULT_SAVE: SavePayload = {
  version: SAVE_VERSION,
  highScore: 0,
  tutorialCompleted: false,
  volume: 0.4,
  controlScheme: "auto",
  mapMeta: { columns: MAP_COLUMNS, rows: MAP_ROWS },
  checkpoint: null,
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function migrateCheckpoint(checkpoint: Partial<GameState> | null): Partial<GameState> | null {
  if (!checkpoint) return checkpoint;

  const next: Partial<GameState> = { ...checkpoint };
  next.maxMonsterCount = null;

  const oldMaxDigCount =
    typeof checkpoint.maxDigCount === "number" ? checkpoint.maxDigCount : LEGACY_MAX_DIG_COUNT;
  const oldRemainingDigCount =
    typeof checkpoint.remainingDigCount === "number"
      ? checkpoint.remainingDigCount
      : oldMaxDigCount;

  if (oldMaxDigCount <= LEGACY_MAX_DIG_COUNT) {
    const increased = oldRemainingDigCount + (INITIAL_MAX_DIG_COUNT - LEGACY_MAX_DIG_COUNT);
    next.maxDigCount = INITIAL_MAX_DIG_COUNT;
    next.remainingDigCount = clamp(increased, 0, INITIAL_MAX_DIG_COUNT);
  } else {
    next.maxDigCount = INITIAL_MAX_DIG_COUNT;
    next.remainingDigCount = clamp(oldRemainingDigCount, 0, INITIAL_MAX_DIG_COUNT);
  }

  return next;
}

function checkpointMapSize(checkpoint: Partial<GameState> | null): { columns: number; rows: number } | null {
  if (!checkpoint?.map || !Array.isArray(checkpoint.map) || checkpoint.map.length <= 0) return null;
  const rows = checkpoint.map.length;
  const columns = checkpoint.map[0]?.length ?? 0;
  if (rows <= 0 || columns <= 0) return null;
  return { columns, rows };
}

export class SaveManager {
  load(): SavePayload {
    if (typeof window === "undefined") return DEFAULT_SAVE;
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (!raw) return DEFAULT_SAVE;
      const parsed = JSON.parse(raw) as Partial<SavePayload>;
      const merged: SavePayload = {
        ...DEFAULT_SAVE,
        ...parsed,
        version: typeof parsed.version === "number" ? parsed.version : 1,
      };
      const mapMetaFromCheckpoint = checkpointMapSize(merged.checkpoint);
      merged.mapMeta = mapMetaFromCheckpoint ?? merged.mapMeta ?? { columns: MAP_COLUMNS, rows: MAP_ROWS };

      if (merged.version < SAVE_VERSION) {
        merged.version = SAVE_VERSION;
        merged.checkpoint = migrateCheckpoint(merged.checkpoint);
        merged.mapMeta = mapMetaFromCheckpoint ?? merged.mapMeta;
        this.save(merged);
      }

      return merged;
    } catch (error) {
      console.error("[DeepLabyrinth] save load failed", error);
      return DEFAULT_SAVE;
    }
  }

  save(payload: SavePayload): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify({ ...payload, version: SAVE_VERSION }));
    } catch (error) {
      console.error("[DeepLabyrinth] save write failed", error);
    }
  }
}
