"use client";

import { useEffect, useMemo, useState } from "react";
import MahjongTile from "../../../components/mahjong/MahjongTile";
import {
  getMahjongSpriteMeta,
  MAHJONG_SPRITE_CONFIG,
  MAHJONG_TILE_GRID_MAP,
  type MahjongSpriteRect,
} from "../../../components/mahjong/tileSprite";
import type { MahjongTileCode } from "../../../components/mahjong/types";

const BASE_TILE_CODES: MahjongTileCode[] = [
  "1m", "2m", "3m", "4m", "5m", "6m", "7m", "8m", "9m",
  "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p",
  "1s", "2s", "3s", "4s", "5s", "6s", "7s", "8s", "9s",
  "east", "south", "west", "north", "white", "green", "red",
];

type RowData = {
  tileId: MahjongTileCode;
  row: number;
  column: number;
  sourceX: number;
  sourceY: number;
  tileWidth: number;
  tileHeight: number;
};

export default function MahjongTilesDebugPage() {
  const [tileRectMap, setTileRectMap] = useState<Record<MahjongTileCode, MahjongSpriteRect> | null>(null);

  useEffect(() => {
    let disposed = false;
    void getMahjongSpriteMeta().then((meta) => {
      if (disposed) return;
      setTileRectMap(meta.tileMap);
    });
    return () => {
      disposed = true;
    };
  }, []);

  const rows = useMemo<RowData[]>(() => {
    if (!tileRectMap) return [];
    return BASE_TILE_CODES.map((tileId) => {
      const grid = MAHJONG_TILE_GRID_MAP[tileId];
      const rect = tileRectMap[tileId];
      return {
        tileId,
        row: grid.row,
        column: grid.column,
        sourceX: rect.x,
        sourceY: rect.y,
        tileWidth: rect.width,
        tileHeight: rect.height,
      };
    });
  }, [tileRectMap]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <h1 className="text-2xl font-semibold">麻雀牌スプライト座標デバッグ</h1>
        <p className="text-sm text-slate-300">
          startX={MAHJONG_SPRITE_CONFIG.startX}, startY={MAHJONG_SPRITE_CONFIG.startY}, tileWidth={MAHJONG_SPRITE_CONFIG.tileWidth}, tileHeight={MAHJONG_SPRITE_CONFIG.tileHeight}, stepX={MAHJONG_SPRITE_CONFIG.stepX}, stepY={MAHJONG_SPRITE_CONFIG.stepY}
        </p>

        <section className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/70 p-3">
          <table className="w-full min-w-[940px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-200">
                <th className="px-2 py-2">牌ID</th>
                <th className="px-2 py-2">row</th>
                <th className="px-2 py-2">column</th>
                <th className="px-2 py-2">sourceX</th>
                <th className="px-2 py-2">sourceY</th>
                <th className="px-2 py-2">tileWidth</th>
                <th className="px-2 py-2">tileHeight</th>
                <th className="px-2 py-2">preview</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.tileId} className="border-b border-slate-800/70">
                  <td className="px-2 py-2 font-mono">{item.tileId}</td>
                  <td className="px-2 py-2 font-mono">{item.row}</td>
                  <td className="px-2 py-2 font-mono">{item.column}</td>
                  <td className="px-2 py-2 font-mono">{item.sourceX}</td>
                  <td className="px-2 py-2 font-mono">{item.sourceY}</td>
                  <td className="px-2 py-2 font-mono">{item.tileWidth}</td>
                  <td className="px-2 py-2 font-mono">{item.tileHeight}</td>
                  <td className="px-2 py-2">
                    <div className="inline-flex h-[72px] w-[50px] items-center justify-center rounded border border-slate-700 bg-slate-950 p-0.5">
                      <MahjongTile tile={item.tileId} compact />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
