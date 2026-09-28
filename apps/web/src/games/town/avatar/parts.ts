import economy from "../shared/economy.json";
import { SHOP_PARTS, type ShopId } from "../shared/shop";

// Avatar part catalog. Every part is drawn procedurally (no image assets),
// so any style can be combined with any color — Pigg-style "face first,
// then dress up" editing. Wear items use an ordered, duplicate-friendly list.

export const MAX_WEAR_ITEMS = 20;
export type WearKey = "top" | "bottom" | "onepiece" | "shoes" | "hat" | "glasses" | "neck" | "back" | "hand" | "ride";
export type WearItem = { key: WearKey; id: string; color?: string };

export type AvatarConfig = {
  // face
  skin: string;
  face: string;
  brows: string;
  browColor: string;
  eyes: string;
  eyeColor: string;
  nose: string;
  mouth: string;
  cheek: string;
  mark: string;
  hair: string;
  hairColor: string;
  // clothes & items
  top: string;
  topColor: string;
  bottom: string;
  bottomColor: string;
  onepiece: string;
  onepieceColor: string;
  shoes: string;
  shoesColor: string;
  hat: string;
  hatColor: string;
  glasses: string;
  glassesColor: string;
  neck: string;
  neckColor: string;
  back: string;
  backColor: string;
  hand: string;
  handColor: string;
  /** のりもの (skateboard, bike...); rides walk faster. */
  ride: string;
  /** Ordered equipped items. Duplicates are allowed; the last item in a category is drawn on top. */
  wearItems: WearItem[];
};

export type AvatarPartKey = Exclude<keyof AvatarConfig, "wearItems">;

export type PartOption = {
  id: string;
  label: string;
  /** Limited part: must be bought (shop / scratch) before it can be worn. */
  price?: number;
  /** Where it is sold when not with アメ: the fishing or casino point shop. */
  shop?: ShopId;
};

export type ThumbFocus = "head" | "upper" | "lower" | "feet" | "body";

export type PartCategory = {
  key: AvatarPartKey;
  label: string;
  group: "face" | "wear";
  options: PartOption[];
  colorKey?: AvatarPartKey;
  palette?: string[];
  /** Thumbnail framing in the editor. */
  focus: ThumbFocus;
  /** Show thumbnails from behind (back items). */
  thumbBack?: boolean;
};

export const SKIN_COLORS = ["#fff0e4", "#ffe3cf", "#fcd5b5", "#f1c09a", "#e0a878", "#c98b5e", "#a8704a", "#7a4e33"];

export const HAIR_COLORS = [
  "#2b2320", "#4a3228", "#6b4430", "#8b5a2b", "#b07a3c", "#d9a441", "#f2d27a", "#fff1b8",
  "#e8e4dc", "#9aa0aa", "#c94d4d", "#f08a5c", "#e889b5", "#f5b8d4", "#b48be8", "#7d6bd6",
  "#4f8fe0", "#8fd3f0", "#45b39d", "#7fc24a",
];

export const EYE_COLORS = [
  "#2b2320", "#5a3a26", "#8b5a2b", "#3a6fc4", "#58a8e8", "#3c9a6a", "#8fcf5a",
  "#9b4fd1", "#d14f6d", "#f08a3c", "#e8b820", "#7a7f8a",
];

export const CLOTH_COLORS = [
  "#ffffff", "#f7f1e3", "#c9c4ba", "#6b6b78", "#2e2e38", "#1f2a44",
  "#e0525c", "#b8323f", "#f28fb8", "#ffc4d9", "#f08a3c", "#f5cf47",
  "#fff0a0", "#8fcf5a", "#3f8f4a", "#46b3a0", "#8fd3f0", "#4f8fe0",
  "#3651a8", "#9a6bd8", "#c9b0f0", "#9b6a47", "#d9b48a", "#f2e2c4",
];

const opts = (list: Array<[string, string]>): PartOption[] => list.map(([id, label]) => ({ id, label }));

export const AVATAR_CATEGORIES: PartCategory[] = [
  // ---------------------------------------------------------------- face
  {
    key: "skin", label: "はだ", group: "face", focus: "head",
    options: SKIN_COLORS.map((c, i) => ({ id: c, label: `はだ${i + 1}` })),
  },
  {
    key: "face", label: "りんかく", group: "face", focus: "head",
    options: opts([["round", "まる"], ["egg", "たまご"], ["sharp", "シャープ"], ["square", "しかく"], ["wide", "ぷにぷに"]]),
  },
  {
    key: "brows", label: "まゆげ", group: "face", focus: "head", colorKey: "browColor", palette: HAIR_COLORS,
    options: opts([
      ["normal", "ふつう"], ["thin", "ほそ"], ["thick", "ふと"], ["angry", "キリッ"], ["worried", "こまり"],
      ["short", "まろ"], ["arch", "アーチ"], ["none", "なし"],
    ]),
  },
  {
    key: "eyes", label: "め", group: "face", focus: "head", colorKey: "eyeColor", palette: EYE_COLORS,
    options: opts([
      ["round", "まる"], ["sparkle", "キラキラ"], ["big", "ぱっちり"], ["tare", "たれ目"], ["tsuri", "つり目"],
      ["lashes", "まつげ"], ["smile", "にっこり"], ["sleepy", "ねむそう"], ["dot", "てん"], ["line", "ほそ目"],
      ["wink", "ウインク"], ["star", "ほし"], ["heart", "ハート"], ["cat", "ねこ目"],
    ]),
  },
  {
    key: "nose", label: "はな", group: "face", focus: "head",
    options: opts([["none", "なし"], ["dot", "てん"], ["ku", "く"], ["round", "まる"], ["line", "すじ"], ["pig", "ぶた"]]),
  },
  {
    key: "mouth", label: "くち", group: "face", focus: "head",
    options: opts([
      ["smile", "にこ"], ["open", "わーい"], ["grin", "にかっ"], ["three", "3"], ["cat", "ねこ"],
      ["tongue", "てへ"], ["neutral", "ふつう"], ["o", "おっ"], ["frown", "へ"], ["wavy", "もにょ"], ["fang", "きば"],
    ]),
  },
  {
    key: "cheek", label: "ほっぺ", group: "face", focus: "head",
    options: opts([["soft", "うっすら"], ["pink", "ピンク"], ["lines", "てれ"], ["star", "ほし"], ["heart", "ハート"], ["none", "なし"]]),
  },
  {
    key: "mark", label: "ほくろ・ひげ", group: "face", focus: "head",
    options: opts([
      ["none", "なし"], ["mole", "なきぼくろ"], ["freckles", "そばかす"], ["mustache", "くちひげ"],
      ["beard", "あごひげ"], ["bandaid", "ばんそうこう"], ["sticker", "ハートシール"], ["whiskers", "ねこひげ"],
    ]),
  },
  {
    key: "hair", label: "かみがた", group: "face", focus: "head", colorKey: "hairColor", palette: HAIR_COLORS,
    options: opts([
      ["short", "ショート"], ["spiky", "ツンツン"], ["sidepart", "七三"], ["messy", "ボサボサ"], ["mash", "マッシュ"],
      ["bob", "ボブ"], ["hime", "ひめカット"], ["long", "ロング"], ["wavy", "ゆるふわ"], ["ponytail", "ポニーテール"],
      ["sidetail", "サイドテール"], ["twintail", "ツインテール"], ["bun", "おだんご"], ["doublebun", "ダブルおだんご"],
      ["braid", "みつあみ"], ["afro", "アフロ"], ["mohawk", "モヒカン"],
      ["curly", "くるくる"], ["longstraight", "ぱっつんロング"], ["hipony", "ハイポニー"], ["sidebraid", "サイドみつあみ"],
      ["wolf", "ウルフ"], ["pompadour", "リーゼント"], ["none", "なし"],
    ]),
  },
  // ---------------------------------------------------------------- wear
  {
    key: "top", label: "トップス", group: "wear", focus: "upper", colorKey: "topColor", palette: CLOTH_COLORS,
    options: opts([
      ["none", "なし"],
      ["tshirt", "Tシャツ"], ["stripe", "ボーダー"], ["dots", "みずたま"], ["tank", "タンクトップ"], ["shirt", "シャツ"],
      ["blouse", "ブラウス"], ["sweater", "ニット"], ["hoodie", "パーカー"], ["cardigan", "カーディガン"],
      ["jacket", "ジャケット"], ["sailor", "セーラー"], ["gakuran", "学ラン"],
      ["polo", "ポロシャツ"], ["aloha", "アロハ"], ["turtleneck", "タートルネック"], ["baseball", "ベースボール"],
    ]),
  },
  {
    key: "bottom", label: "ボトムス", group: "wear", focus: "lower", colorKey: "bottomColor", palette: CLOTH_COLORS,
    options: opts([
      ["none", "なし"],
      ["pants", "パンツ"], ["jeans", "デニム"], ["shorts", "ショートパンツ"], ["skirt", "プリーツ"],
      ["mini", "ミニスカ"], ["long", "ロングスカート"], ["overalls", "サロペット"],
      ["cargo", "カーゴパンツ"], ["wide", "ワイドパンツ"], ["kilt", "チェックスカート"],
    ]),
  },
  {
    key: "onepiece", label: "ワンピース", group: "wear", focus: "body", colorKey: "onepieceColor", palette: CLOTH_COLORS,
    options: opts([
      ["none", "なし"], ["dress", "ワンピース"], ["princess", "ドレス"], ["maid", "メイド"], ["yukata", "ゆかた"],
      ["suit", "スーツ"], ["tsunagi", "つなぎ"], ["kigurumi", "きぐるみ"],
    ]),
  },
  {
    key: "shoes", label: "くつ", group: "wear", focus: "feet", colorKey: "shoesColor", palette: CLOTH_COLORS,
    options: opts([
      ["none", "なし"],
      ["sneakers", "スニーカー"], ["hightops", "ハイカット"], ["loafers", "ローファー"], ["pumps", "パンプス"],
      ["boots", "ブーツ"], ["longboots", "ロングブーツ"], ["sandals", "サンダル"], ["geta", "げた"],
    ]),
  },
  {
    key: "hat", label: "ぼうし", group: "wear", focus: "head", colorKey: "hatColor", palette: CLOTH_COLORS,
    options: opts([
      ["none", "なし"], ["cap", "キャップ"], ["beanie", "ニット帽"], ["beret", "ベレー帽"], ["straw", "むぎわら"],
      ["silk", "シルクハット"], ["witch", "まほう使い"], ["santa", "サンタ"], ["ribbon", "リボン"], ["flower", "おはな"],
      ["crown", "おうかん"], ["tiara", "ティアラ"], ["catears", "ねこみみ"], ["bunnyears", "うさみみ"],
      ["headphones", "ヘッドホン"], ["horns", "つの"], ["halo", "てんしの輪"],
    ]),
  },
  {
    key: "glasses", label: "メガネ", group: "wear", focus: "head", colorKey: "glassesColor", palette: CLOTH_COLORS,
    options: opts([
      ["none", "なし"], ["round", "まるメガネ"], ["square", "しかくメガネ"], ["sunglasses", "サングラス"],
      ["heart", "ハートグラス"], ["star", "スターグラス"], ["goggles", "ゴーグル"], ["mask", "マスク"],
    ]),
  },
  {
    key: "neck", label: "くびもと", group: "wear", focus: "upper", colorKey: "neckColor", palette: CLOTH_COLORS,
    options: opts([
      ["none", "なし"], ["necktie", "ネクタイ"], ["bowtie", "ちょうネクタイ"], ["ribbon", "リボン"],
      ["scarf", "マフラー"], ["necklace", "ネックレス"], ["bell", "すず"],
    ]),
  },
  {
    key: "back", label: "せなか", group: "wear", focus: "body", thumbBack: true, colorKey: "backColor", palette: CLOTH_COLORS,
    options: opts([
      ["none", "なし"], ["backpack", "リュック"], ["randoseru", "ランドセル"], ["angel", "てんしの羽"],
      ["devil", "あくまの羽"], ["fairy", "ようせいの羽"], ["cape", "マント"], ["tail", "しっぽ"],
    ]),
  },
  {
    key: "hand", label: "てもち", group: "wear", focus: "body", colorKey: "handColor", palette: CLOTH_COLORS,
    options: opts([
      ["none", "なし"], ["balloon", "ふうせん"], ["icecream", "アイス"], ["bouquet", "はなたば"], ["bag", "バッグ"],
      ["umbrella", "かさ"], ["bear", "くまのぬいぐるみ"], ["phone", "スマホ"], ["wand", "まほうのステッキ"],
      ["fan", "うちわ"], ["drink", "ドリンク"],
    ]),
  },
  {
    key: "ride", label: "のりもの", group: "wear", focus: "body",
    options: opts([["none", "なし"]]),
  },
];

// Limited parts live in shared/economy.json (prices are enforced by the server).
for (const part of economy.limitedParts) {
  const category = AVATAR_CATEGORIES.find((c) => c.key === part.key);
  if (category && !category.options.some((o) => o.id === part.id)) {
    category.options.push({ id: part.id, label: part.label, price: part.price });
  }
}
// Point-shop parts (rides, casino clothes) are limited too, but bought with fishing points / casino coins.
for (const entry of SHOP_PARTS) {
  const category = AVATAR_CATEGORIES.find((c) => c.key === entry.key);
  if (category && entry.part && !category.options.some((o) => o.id === entry.part)) {
    category.options.push({ id: entry.part, label: entry.label, price: entry.price, shop: entry.shop });
  }
}

export function limitedKey(key: AvatarPartKey, id: string): string {
  return `${key}:${id}`;
}

export function isLimitedPart(key: AvatarPartKey, id: string): boolean {
  return economy.limitedParts.some((p) => p.key === key && p.id === id) || SHOP_PARTS.some((e) => e.key === key && e.part === id);
}

export const DEFAULT_AVATAR: AvatarConfig = {
  skin: SKIN_COLORS[2],
  face: "round",
  brows: "normal",
  browColor: HAIR_COLORS[1],
  eyes: "round",
  eyeColor: EYE_COLORS[0],
  nose: "none",
  mouth: "smile",
  cheek: "soft",
  mark: "none",
  hair: "short",
  hairColor: HAIR_COLORS[2],
  top: "tshirt",
  topColor: "#46b3a0",
  bottom: "pants",
  bottomColor: "#3651a8",
  onepiece: "none",
  onepieceColor: "#f28fb8",
  shoes: "sneakers",
  shoesColor: "#e0525c",
  hat: "none",
  hatColor: "#f5cf47",
  glasses: "none",
  glassesColor: "#2e2e38",
  neck: "none",
  neckColor: "#e0525c",
  back: "none",
  backColor: "#4f8fe0",
  hand: "none",
  handColor: "#f28fb8",
  ride: "none",
  wearItems: [
    { key: "top", id: "tshirt", color: "#46b3a0" },
    { key: "bottom", id: "pants", color: "#3651a8" },
    { key: "shoes", id: "sneakers", color: "#e0525c" },
  ],
};

export const AVATAR_KEYS = Object.keys(DEFAULT_AVATAR).filter((key) => key !== "wearItems") as AvatarPartKey[];
export const WEAR_KEYS: WearKey[] = ["top", "bottom", "onepiece", "shoes", "hat", "glasses", "neck", "back", "hand", "ride"];
const WEAR_KEY_SET = new Set<AvatarPartKey>(WEAR_KEYS);

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const COLOR_KEYS = new Set<AvatarPartKey>([
  "skin", "browColor", "eyeColor", "hairColor", "topColor", "bottomColor", "onepieceColor",
  "shoesColor", "hatColor", "glassesColor", "neckColor", "backColor", "handColor",
]);

/** v1 avatars (single "acc" slot, dress/sailor-as-top) → v2 fields. */
function migrateV1(src: Record<string, unknown>): Record<string, unknown> {
  const out = { ...src };
  const acc = String(src.acc ?? "");
  if (acc && !("glasses" in src)) {
    if (acc === "glasses") out.glasses = "round";
    if (acc === "sunglasses") out.glasses = "sunglasses";
    if (acc === "bandaid") out.mark = "bandaid";
    if (acc === "blush") out.cheek = "pink";
  }
  if (src.top === "dress" && !("onepiece" in src)) {
    out.onepiece = "dress";
    out.onepieceColor = src.topColor;
  }
  return out;
}

/** Fill unknown or missing values (e.g. from other clients) with defaults. */
export function normalizeAvatar(raw: unknown): AvatarConfig {
  const src = migrateV1(raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {});
  const out: AvatarConfig = { ...DEFAULT_AVATAR, wearItems: [] };
  for (const key of AVATAR_KEYS) {
    const value = String(src[key] ?? "");
    if (COLOR_KEYS.has(key)) {
      if (HEX_COLOR.test(value)) out[key] = value.toLowerCase();
      continue;
    }
    const category = AVATAR_CATEGORIES.find((c) => c.key === key);
    if (category?.options.some((o) => o.id === value)) out[key] = value;
  }
  const hasWearItems = Array.isArray(src.wearItems);
  const wearItems: WearItem[] = [];
  if (hasWearItems) {
    for (const rawItem of src.wearItems as unknown[]) {
      if (wearItems.length >= MAX_WEAR_ITEMS || !rawItem || typeof rawItem !== "object") break;
      const candidate = rawItem as Record<string, unknown>;
      const key = String(candidate.key || "") as WearKey;
      const id = String(candidate.id || "");
      const category = AVATAR_CATEGORIES.find((c) => c.key === key && c.group === "wear");
      if (!category || id === "none" || !category.options.some((option) => option.id === id)) continue;
      const color = String(candidate.color || "");
      wearItems.push({ key, id, ...(category.colorKey && HEX_COLOR.test(color) ? { color: color.toLowerCase() } : {}) });
    }
  } else {
    // Legacy one-slot avatars become an ordered outfit once, without changing their appearance.
    for (const key of WEAR_KEYS) {
      const id = String(out[key] || "");
      if (!id || id === "none") continue;
      const category = AVATAR_CATEGORIES.find((c) => c.key === key);
      const color = category?.colorKey ? String(out[category.colorKey]) : "";
      wearItems.push({ key, id, ...(category?.colorKey && HEX_COLOR.test(color) ? { color } : {}) });
    }
  }
  // Compatibility fields always describe the top-most item of each category.
  for (const key of WEAR_KEYS) out[key] = "none";
  for (const item of wearItems) {
    out[item.key] = item.id;
    const category = AVATAR_CATEGORIES.find((c) => c.key === item.key);
    if (item.color && category?.colorKey) out[category.colorKey] = item.color;
  }
  out.wearItems = wearItems;
  return out;
}

export function withWearItems(avatar: AvatarConfig, wearItems: WearItem[]): AvatarConfig {
  return normalizeAvatar({ ...avatar, wearItems: wearItems.slice(0, MAX_WEAR_ITEMS) });
}

export function randomAvatar(): AvatarConfig {
  const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
  const out: AvatarConfig = { ...DEFAULT_AVATAR };
  for (const category of AVATAR_CATEGORIES) {
    out[category.key] = pick(category.options.filter((o) => !o.price)).id;
    if (category.colorKey && category.palette) out[category.colorKey] = pick(category.palette);
  }
  // Keep random looks wearable: mostly no one-piece, fewer props.
  if (Math.random() < 0.65) out.onepiece = "none";
  if (Math.random() < 0.5) out.hand = "none";
  if (Math.random() < 0.5) out.back = "none";
  if (Math.random() < 0.5) out.glasses = "none";
  if (Math.random() < 0.4) out.mark = "none";
  out.browColor = out.hairColor;
  return normalizeAvatar({ ...out, wearItems: undefined });
}
