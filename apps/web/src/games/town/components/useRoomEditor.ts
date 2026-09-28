"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import type { TownGame } from "../core/TownGame";
import type { PlacementGhost } from "../world/render";
import {
  FURNITURE_BY_KIND, FURNITURE_COLORS, autoLevel, canPlaceItem, footprintOf, hasAbove, isStairsKind, itemAt,
  type FurnitureKind, type RoomData, type RoomItem,
} from "../world/furniture";
import type { RoomTool } from "./RoomEditorPanel";

const HISTORY_LIMIT = 40;

// The room uses an isometric grid, so screen directions change both grid axes.
const ARROW_MOVE: Partial<Record<string, readonly [number, number]>> = {
  ArrowUp: [-1, -1],
  ArrowDown: [1, 1],
  ArrowLeft: [-1, 1],
  ArrowRight: [1, -1],
};

type Options = {
  game: MutableRefObject<TownGame | null>;
  room: RoomData | null;
  editing: boolean;
  /** Show a short message (toast) to the player. */
  notify: (text: string) => void;
};

type Carry = { x: number; y: number; item: RoomItem };
type Corner = { x: number; y: number };

const copyItems = (items: RoomItem[]): RoomItem[] => items.map((i) => ({ ...i, crop: i.crop ? { ...i.crop } : undefined }));

/**
 * Everything the room editor does with the mouse: the tools, the ghost preview, two-click tools (fill / erase /
 * move), undo and redo (as whole-room snapshots the server re-validates) and keyboard shortcuts.
 */
export function useRoomEditor({ game, room, editing, notify }: Options) {
  const [tool, setToolState] = useState<RoomTool>("place");
  const [kind, setKind] = useState<FurnitureKind>("block");
  const [color, setColor] = useState(FURNITURE_COLORS[5]);
  const [turned, setTurned] = useState(false);
  const [dir, setDir] = useState(0);
  const [anchor, setAnchor] = useState<Corner | null>(null);
  const [carry, setCarry] = useState<Carry | null>(null);
  const [historySize, setHistorySize] = useState({ undo: 0, redo: 0 });
  const undoStack = useRef<RoomItem[][]>([]);
  const redoStack = useRef<RoomItem[][]>([]);
  const roomId = room?.id ?? "";
  const hover = useRef<[number, number] | null>(null);

  const setTool = useCallback((next: RoomTool) => {
    setToolState(next);
    setAnchor(null);
    setCarry(null);
  }, []);

  // A different room (or leaving edit mode) starts with a clean slate.
  useEffect(() => {
    undoStack.current = [];
    redoStack.current = [];
    setAnchor(null);
    setCarry(null);
    setHistorySize({ undo: 0, redo: 0 });
  }, [roomId, editing]);

  /** Send an edit and remember how the room looked before it, so it can be undone. */
  const send = useCallback((payload: Record<string, unknown>) => {
    const g = game.current;
    if (!g || !room) return;
    undoStack.current = [...undoStack.current, copyItems(room.items)].slice(-HISTORY_LIMIT);
    redoStack.current = [];
    setHistorySize({ undo: undoStack.current.length, redo: 0 });
    g.roomEdit(payload);
  }, [game, room]);

  const undo = useCallback(() => {
    const g = game.current;
    const previous = undoStack.current[undoStack.current.length - 1];
    if (!g || !room || !previous) return;
    undoStack.current = undoStack.current.slice(0, -1);
    redoStack.current = [...redoStack.current, copyItems(room.items)];
    setHistorySize({ undo: undoStack.current.length, redo: redoStack.current.length });
    g.roomEdit({ op: "restore", items: previous });
  }, [game, room]);

  const redo = useCallback(() => {
    const g = game.current;
    const next = redoStack.current[redoStack.current.length - 1];
    if (!g || !room || !next) return;
    redoStack.current = redoStack.current.slice(0, -1);
    undoStack.current = [...undoStack.current, copyItems(room.items)];
    setHistorySize({ undo: undoStack.current.length, redo: redoStack.current.length });
    g.roomEdit({ op: "restore", items: next });
  }, [game, room]);

  const layout = useCallback((op: "layout-save" | "layout-load", slot: number) => {
    if (op === "layout-load") send({ op, slot });
    else game.current?.roomEdit({ op, slot });
  }, [game, send]);

  /** The piece being placed at a tile (or `source` moved there). */
  const itemFor = useCallback((tile: [number, number], source?: RoomItem): RoomItem => {
    if (source) return { ...source, x: tile[0], y: tile[1] };
    const def = FURNITURE_BY_KIND.get(kind);
    return {
      kind,
      x: tile[0],
      y: tile[1],
      color: def?.colorable ? color : undefined,
      rot: turned && def && def.w !== def.h && !isStairsKind(kind) ? 1 : undefined,
      dir: isStairsKind(kind) && dir ? dir : undefined,
    };
  }, [kind, color, turned, dir]);

  /** Drop the piece on top of whatever is built at its tile. */
  const withLevel = useCallback((r: RoomData, item: RoomItem): RoomItem => {
    const z = autoLevel(r, item);
    return z > 0 ? { ...item, z } : { ...item, z: undefined };
  }, []);

  const ghostFor = useCallback((tile: [number, number] | null): PlacementGhost | null => {
    if (!room || !tile) return null;
    const objectOf = (item: RoomItem) => {
      const { w, h } = footprintOf(item);
      return { ...item, w, h, flat: FURNITURE_BY_KIND.get(item.kind)?.flat };
    };
    if (tool === "fill" || tool === "erase") {
      const from = anchor ?? { x: tile[0], y: tile[1] };
      const rect = {
        x0: Math.min(from.x, tile[0]), x1: Math.max(from.x, tile[0]), y0: Math.min(from.y, tile[1]), y1: Math.max(from.y, tile[1]),
      };
      const base = itemFor([from.x, from.y]);
      const z = tool === "fill" ? autoLevel(room, base) : 0;
      return {
        object: objectOf({ ...base, z: z > 0 ? z : undefined }),
        valid: true,
        rect: { ...rect, z, color: tool === "fill" ? "rgba(90,170,255,0.35)" : "rgba(230,70,70,0.35)" },
      };
    }
    if (tool === "place" || (tool === "move" && carry)) {
      const source = tool === "move" && carry ? carry.item : undefined;
      const others = source ? { ...room, items: room.items.filter((o) => o !== source) } : room;
      const item = source ? itemFor(tile, source) : withLevel(others, itemFor(tile));
      return { object: objectOf(item), valid: canPlaceItem(others, item) };
    }
    const hit = itemAt(room, tile[0], tile[1]);
    if (!hit) return null;
    if (tool === "rotate") {
      // Preview the turned piece; red when it wouldn't fit.
      const turnedItem: RoomItem = isStairsKind(hit.kind)
        ? { ...hit, dir: ((hit.dir ?? 0) + 1) % 4 }
        : { ...hit, rot: hit.rot ? undefined : 1 };
      return { object: objectOf(turnedItem), valid: isStairsKind(hit.kind) || canPlaceItem(room, turnedItem, hit) };
    }
    if (tool === "recolor") return { object: objectOf({ ...hit, color }), valid: true };
    if (tool === "pick" || tool === "move") return { object: objectOf(hit), valid: true };
    return { object: objectOf(hit), valid: false };
  }, [room, tool, anchor, carry, color, itemFor, withLevel]);

  const pointerMove = useCallback((tile: [number, number] | null) => {
    hover.current = tile;
    game.current?.setGhost(ghostFor(tile));
  }, [game, ghostFor]);

  // Keep the preview in step when the tool, kind or the room itself changes without the mouse moving.
  useEffect(() => {
    if (editing) game.current?.setGhost(ghostFor(hover.current));
  }, [editing, ghostFor, game]);

  // Room edits come back as fresh objects from the server. Reattach the selection so
  // repeated arrow presses keep excluding the selected piece from collision checks.
  useEffect(() => {
    if (!room || !carry) return;
    const current = itemAt(room, carry.x, carry.y);
    if (current && current.kind === carry.item.kind && current !== carry.item) {
      setCarry({ x: current.x, y: current.y, item: current });
    }
  }, [room, carry]);

  const pointerDown = useCallback((tile: [number, number] | null) => {
    if (!room || !tile) return;
    const hit = itemAt(room, tile[0], tile[1]);
    switch (tool) {
      case "place": {
        const item = withLevel(room, itemFor(tile));
        if (canPlaceItem(room, item)) send({ op: "place", item: { ...item, z: undefined } });
        else notify("そこにはおけません");
        break;
      }
      case "remove":
        if (hit) send({ op: "remove", x: tile[0], y: tile[1] });
        break;
      case "rotate":
        if (hit) send({ op: "rotate", x: tile[0], y: tile[1] });
        break;
      case "recolor":
        if (hit && FURNITURE_BY_KIND.get(hit.kind)?.colorable) send({ op: "recolor", x: tile[0], y: tile[1], color });
        else if (hit) notify("この家具は色をかえられません");
        break;
      case "pick":
        if (hit) {
          setKind(hit.kind);
          if (hit.color) setColor(hit.color);
          setTurned(Boolean(hit.rot));
          setDir(hit.dir ?? 0);
          setTool("place");
        }
        break;
      case "move":
        if (!carry) {
          if (!hit) break;
          if (hasAbove(room, hit)) notify("上に何かがのっているので、先にそちらを動かしてね");
          else setCarry({ x: hit.x, y: hit.y, item: hit });
        } else {
          const others = { ...room, items: room.items.filter((o) => o !== carry.item) };
          const item = itemFor(tile, carry.item);
          if (canPlaceItem(others, item)) {
            send({ op: "move", x: carry.x, y: carry.y, toX: tile[0], toY: tile[1] });
            setCarry(null);
          } else {
            notify("そこにはおけません");
          }
        }
        break;
      case "fill":
      case "erase": {
        if (!anchor) {
          setAnchor({ x: tile[0], y: tile[1] });
          break;
        }
        const rect = { x0: anchor.x, y0: anchor.y, x1: tile[0], y1: tile[1] };
        if (tool === "fill") send({ op: "fill", kind, color: FURNITURE_BY_KIND.get(kind)?.colorable ? color : undefined, dir, ...rect });
        else send({ op: "erase", ...rect });
        setAnchor(null);
        break;
      }
      default:
        break;
    }
  }, [room, tool, carry, anchor, kind, color, dir, itemFor, withLevel, send, notify, setTool]);

  const moveCarryBy = useCallback((dx: number, dy: number) => {
    if (!room || tool !== "move" || !carry) return;

    // Wait for the server snapshot from the preceding key press before accepting another one.
    const current = itemAt(room, carry.x, carry.y);
    if (!current || current.kind !== carry.item.kind) return;
    if (hasAbove(room, current)) {
      notify("上に何かがのっているので、先にそちらを動かしてね");
      return;
    }

    const tile: [number, number] = [current.x + dx, current.y + dy];
    const others = { ...room, items: room.items.filter((item) => item !== current) };
    const moved = itemFor(tile, current);
    if (!canPlaceItem(others, moved)) {
      notify("そこにはおけません");
      return;
    }

    send({ op: "move", x: current.x, y: current.y, toX: tile[0], toY: tile[1] });
    // Keep the piece selected. The next key press is accepted after the updated room arrives.
    hover.current = tile;
    setCarry({ x: tile[0], y: tile[1], item: moved });
  }, [room, tool, carry, notify, itemFor, send]);

  // Keyboard: arrows move the selected piece, Ctrl+Z / Ctrl+Y undo, R turns, Escape cancels.
  useEffect(() => {
    if (!editing) return undefined;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")) return;
      const arrow = ARROW_MOVE[e.key];
      if (arrow && tool === "move" && carry) {
        e.preventDefault();
        moveCarryBy(arrow[0], arrow[1]);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      } else if (e.key === "r" || e.key === "R") {
        if (isStairsKind(kind)) setDir((d) => (d + 1) % 4);
        else setTurned((t) => !t);
      } else if (e.key === "Escape") {
        setAnchor(null);
        setCarry(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, undo, redo, kind, tool, carry, moveCarryBy]);

  const pending = useMemo(() => {
    if (tool === "move" && carry) return "十字キーで1マスずつ移動／おきたい場所をクリック（Escでやめる）";
    if ((tool === "fill" || tool === "erase") && anchor) return "反対がわの角をクリック（Escでやめる）";
    return "";
  }, [tool, carry, anchor]);

  return {
    tool, setTool, kind, setKind, color, setColor, turned, setTurned, dir, setDir, pending,
    canUndo: historySize.undo > 0, canRedo: historySize.redo > 0,
    undo, redo, layout, send, pointerMove, pointerDown,
  };
}
