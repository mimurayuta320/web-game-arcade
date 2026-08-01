import type { MahjongTileCode } from "./types";

export type MahjongSpriteRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const SPRITE_IMAGE_URL = "/motionPng/麻雀/麻雀牌.png";
export const MAHJONG_TILE_CODE_LIST: MahjongTileCode[] = [
  "1m", "2m", "3m", "4m", "5m", "6m", "7m", "8m", "9m",
  "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p",
  "1s", "2s", "3s", "4s", "5s", "6s", "7s", "8s", "9s",
  "east", "south", "west", "north", "white", "green", "red",
  "0m", "0p", "0s", "back",
];

export type MahjongTileGrid = {
  row: number;
  column: number;
};

export type MahjongSpriteConfig = {
  startX: number;
  startY: number;
  tileWidth: number;
  tileHeight: number;
  stepX: number;
  stepY: number;
};

// Measured from 麻雀牌.png tile frame positions (integer pixels).
export const MAHJONG_SPRITE_CONFIG: MahjongSpriteConfig = {
  startX: 10,
  startY: 23,
  tileWidth: 155,
  tileHeight: 227,
  stepX: 167,
  stepY: 258,
};

export const MAHJONG_TILE_GRID_MAP: Record<MahjongTileCode, MahjongTileGrid> = {
  "1m": { row: 0, column: 0 },
  "2m": { row: 0, column: 1 },
  "3m": { row: 0, column: 2 },
  "4m": { row: 0, column: 3 },
  "5m": { row: 0, column: 4 },
  "6m": { row: 0, column: 5 },
  "7m": { row: 0, column: 6 },
  "8m": { row: 0, column: 7 },
  "9m": { row: 0, column: 8 },
  "1p": { row: 1, column: 0 },
  "2p": { row: 1, column: 1 },
  "3p": { row: 1, column: 2 },
  "4p": { row: 1, column: 3 },
  "5p": { row: 1, column: 4 },
  "6p": { row: 1, column: 5 },
  "7p": { row: 1, column: 6 },
  "8p": { row: 1, column: 7 },
  "9p": { row: 1, column: 8 },
  "1s": { row: 2, column: 0 },
  "2s": { row: 2, column: 1 },
  "3s": { row: 2, column: 2 },
  "4s": { row: 2, column: 3 },
  "5s": { row: 2, column: 4 },
  "6s": { row: 2, column: 5 },
  "7s": { row: 2, column: 6 },
  "8s": { row: 2, column: 7 },
  "9s": { row: 2, column: 8 },
  east: { row: 3, column: 0 },
  south: { row: 3, column: 1 },
  west: { row: 3, column: 2 },
  north: { row: 3, column: 3 },
  white: { row: 3, column: 4 },
  green: { row: 3, column: 5 },
  red: { row: 3, column: 6 },
  "0m": { row: 0, column: 4 },
  "0p": { row: 1, column: 4 },
  "0s": { row: 2, column: 4 },
  back: { row: 3, column: 4 },
};

export type MahjongSpriteMeta = {
  image: HTMLImageElement;
  imageWidth: number;
  imageHeight: number;
  cropWidth: number;
  cropHeight: number;
  spriteConfig: MahjongSpriteConfig;
  tileMap: Record<MahjongTileCode, MahjongSpriteRect>;
};

let spriteMetaPromise: Promise<MahjongSpriteMeta> | null = null;

function clampRectToImage(rect: MahjongSpriteRect, imageWidth: number, imageHeight: number): MahjongSpriteRect {
  const x = Math.max(0, Math.min(rect.x, imageWidth - rect.width));
  const y = Math.max(0, Math.min(rect.y, imageHeight - rect.height));
  return {
    x,
    y,
    width: rect.width,
    height: rect.height,
  };
}

export function getSpriteRectByTileCode(
  tileCode: MahjongTileCode,
  imageWidth: number,
  imageHeight: number,
  config: MahjongSpriteConfig = MAHJONG_SPRITE_CONFIG,
): MahjongSpriteRect {
  const grid = MAHJONG_TILE_GRID_MAP[tileCode] ?? MAHJONG_TILE_GRID_MAP.back;
  const sourceX = config.startX + grid.column * config.stepX;
  const sourceY = config.startY + grid.row * config.stepY;

  return clampRectToImage(
    {
      x: sourceX,
      y: sourceY,
      width: config.tileWidth,
      height: config.tileHeight,
    },
    imageWidth,
    imageHeight,
  );
}

export function getMahjongSpriteMeta(): Promise<MahjongSpriteMeta> {
  if (spriteMetaPromise) return spriteMetaPromise;

  spriteMetaPromise = new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.src = SPRITE_IMAGE_URL;

    image.onload = () => {
      const tileMap = MAHJONG_TILE_CODE_LIST.reduce<Record<MahjongTileCode, MahjongSpriteRect>>((acc, code) => {
        acc[code] = getSpriteRectByTileCode(code, image.naturalWidth, image.naturalHeight);
        return acc;
      }, {} as Record<MahjongTileCode, MahjongSpriteRect>);

      resolve({
        image,
        imageWidth: image.naturalWidth,
        imageHeight: image.naturalHeight,
        cropWidth: MAHJONG_SPRITE_CONFIG.tileWidth,
        cropHeight: MAHJONG_SPRITE_CONFIG.tileHeight,
        spriteConfig: MAHJONG_SPRITE_CONFIG,
        tileMap,
      });
    };

    image.onerror = () => {
      reject(new Error("Failed to load Mahjong sprite image."));
    };
  });

  return spriteMetaPromise;
}

export function tileNumberToSpriteCode(tile: number): MahjongTileCode {
  if (!Number.isInteger(tile) || tile < 0 || tile > 33) return "back";
  if (tile <= 8) return `${tile + 1}m` as MahjongTileCode;
  if (tile <= 17) return `${tile - 8}p` as MahjongTileCode;
  if (tile <= 26) return `${tile - 17}s` as MahjongTileCode;

  const honors: MahjongTileCode[] = ["east", "south", "west", "north", "white", "green", "red"];
  return honors[tile - 27] ?? "back";
}
