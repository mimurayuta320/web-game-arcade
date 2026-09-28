"use client";

import type { ShopId } from "../shared/shop";
import { useState } from "react";
import styles from "@/app/games/town/town.module.css";
import {
  FLOOR_STYLES, FURNITURE, FURNITURE_BY_KIND, FURNITURE_CATEGORIES, FURNITURE_COLORS, LAYOUT_SLOTS, MAX_LEVEL, WALL_STYLES,
  expandCost, isStairsKind, maxItems,
  type FurnitureCategory, type FurnitureKind, type RoomData,
} from "../world/furniture";
import { FurnitureIcon } from "./FurnitureIcon";

export type RoomTool = "place" | "move" | "rotate" | "recolor" | "pick" | "remove" | "fill" | "erase";

const TOOLS: Array<{ id: RoomTool; label: string; hint: string }> = [
  { id: "place", label: "おく", hint: "床や、ブロックの上をクリックしておく。ブロックの上にもおけるよ" },
  { id: "move", label: "いどう", hint: "家具をクリック → 十字キー、または移動先をクリック。積んだブロックは高さを保って動かせるよ" },
  { id: "rotate", label: "まわす", hint: "家具をクリックで向きをかえる（かいだんは4方向）" },
  { id: "recolor", label: "いろ", hint: "色をえらんで、色をかえたい家具をクリック" },
  { id: "pick", label: "スポイト", hint: "家具をクリックすると、その家具をおく道具にもちかえるよ" },
  { id: "remove", label: "かたづける", hint: "家具をクリックで片づける（いちばん上のものから）" },
  { id: "fill", label: "はんいでおく", hint: "1つ目の角 → 反対の角をクリック。1マスの家具やブロックを一気にならべるよ" },
  { id: "erase", label: "はんいでけす", hint: "1つ目の角 → 反対の角をクリック。範囲の家具をぜんぶ片づける" },
];

const ARROWS = ["↘", "↙", "↖", "↗"];

function timeAgo(at: number): string {
  const mins = Math.max(0, Math.round((Date.now() - at) / 60000));
  if (mins < 1) return "たった今";
  if (mins < 60) return `${mins}分前`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  return `${Math.round(hours / 24)}日前`;
}

type Props = {
  room: RoomData;
  ame: number;
  ownedFurniture: Set<string>;
  tool: RoomTool;
  kind: FurnitureKind;
  color: string;
  /** Place new pieces turned 90°. */
  turned: boolean;
  /** Which way a new staircase climbs (0-3). */
  dir: number;
  /** A two-click tool is waiting for its second corner / a piece is being carried. */
  pending: string;
  canUndo: boolean;
  canRedo: boolean;
  onTool: (tool: RoomTool) => void;
  onKind: (kind: FurnitureKind) => void;
  onColor: (color: string) => void;
  onTurned: (turned: boolean) => void;
  onDir: (dir: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onLayout: (op: "layout-save" | "layout-load", slot: number) => void;
  onStyle: (style: { wall?: string; floor?: string; title?: string }) => void;
  onClear: () => void;
  onExpand: () => void;
  onOpenShop: () => void;
  onOpenPointShop?: (shop: ShopId) => void;
  onDone: () => void;
};

function savedLabel(at: number): string {
  const d = new Date(at);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** My-room decoration panel: build with blocks and stairs, place, move, recolor, undo, and keep layouts. */
export function RoomEditorPanel({
  room, ame, ownedFurniture, tool, kind, color, turned, dir, pending, canUndo, canRedo,
  onTool, onKind, onColor, onTurned, onDir, onUndo, onRedo, onLayout, onStyle, onClear, onExpand, onOpenShop, onOpenPointShop, onDone,
}: Props) {
  const [title, setTitle] = useState(room.title);
  const [confirmClear, setConfirmClear] = useState(false);
  const [category, setCategory] = useState<FurnitureCategory>("build");
  const [layoutOpen, setLayoutOpen] = useState(false);
  const def = FURNITURE_BY_KIND.get(kind);
  const colorable = def?.colorable;
  const square = def ? def.w === def.h : true;
  const expand = expandCost(room.size);
  const active = TOOLS.find((t) => t.id === tool);
  const showColors = tool === "recolor" || ((tool === "place" || tool === "fill") && colorable);
  const showTurn = tool === "place" && !isStairsKind(kind) && !square;
  const showDir = (tool === "place" || tool === "fill") && isStairsKind(kind);

  return (
    <section className={`${styles.panel} ${styles.roomEditor}`} aria-label="へやの編集">
      <div className={styles.roomEditorHeader}>
        <h2 className={styles.panelTitle}>
          へやを編集中（{room.items.length}/{maxItems(room.size)}・{room.size}×{room.size}・{MAX_LEVEL}だんまで）
        </h2>
        <button type="button" className={styles.primaryButton} onClick={onDone}>おわる</button>
      </div>

      <div className={styles.toolToggle} role="radiogroup" aria-label="どうぐ">
        {TOOLS.map((t) => (
          <button key={t.id} type="button" role="radio" aria-checked={tool === t.id} className={styles.chip} data-active={tool === t.id} onClick={() => onTool(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className={styles.toolToggle}>
        <button type="button" className={styles.chip} onClick={onUndo} disabled={!canUndo} title="ひとつ前にもどす（Ctrl+Z）">↶ もどす</button>
        <button type="button" className={styles.chip} onClick={onRedo} disabled={!canRedo} title="やりなおす（Ctrl+Y）">↷ やりなおす</button>
        <button type="button" className={styles.chip} data-active={layoutOpen} onClick={() => setLayoutOpen(!layoutOpen)}>💾 レイアウト</button>
        {showTurn ? (
          <button type="button" className={styles.chip} data-active={turned} onClick={() => onTurned(!turned)} title="置く向きを変える（Rキー）">
            向き {turned ? "↕" : "↔"}
          </button>
        ) : null}
        {showDir ? (
          <button type="button" className={styles.chip} onClick={() => onDir((dir + 1) % 4)} title="のぼる向き（Rキー）">
            のぼる向き {ARROWS[dir % 4]}
          </button>
        ) : null}
      </div>
      <p className={styles.editorHint}>{pending || active?.hint}</p>

      {layoutOpen ? (
        <div className={styles.layoutBox}>
          <p className={styles.editorHint}>いまの家具のならびと、かべ・ゆかを{LAYOUT_SLOTS}つまで保存して、いつでも模様替えできます。</p>
          {Array.from({ length: LAYOUT_SLOTS }, (_, slot) => {
            const saved = room.layouts?.[slot] ?? null;
            return (
              <div key={slot} className={styles.layoutRow}>
                <strong>スロット{slot + 1}</strong>
                <span className={styles.layoutInfo}>{saved ? `${saved.count}こ ・ ${savedLabel(saved.savedAt)}` : "（からっぽ）"}</span>
                <button type="button" className={styles.secondaryButton} onClick={() => onLayout("layout-save", slot)}>ほぞん</button>
                <button type="button" className={styles.secondaryButton} disabled={!saved} onClick={() => onLayout("layout-load", slot)}>よびだす</button>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className={styles.floorChips} role="tablist" aria-label="家具のしゅるい">
        {FURNITURE_CATEGORIES.map((c) => (
          <button key={c.id} type="button" role="tab" aria-selected={category === c.id} className={styles.categoryTab} onClick={() => setCategory(c.id)}>
            {c.label}
          </button>
        ))}
      </div>

      <div className={styles.furnitureGrid}>
        {FURNITURE.filter((f) => f.category === category && !f.legacy).map((f) => {
          const locked = Boolean(f.price) && !ownedFurniture.has(f.kind);
          return (
            <button
              key={f.kind}
              type="button"
              className={styles.furnitureButton}
              aria-pressed={(tool === "place" || tool === "fill") && kind === f.kind}
              data-locked={locked}
              title={locked ? `${f.label}（${f.shop === "casino" ? `景品交換所で ${f.price} コイン` : f.shop === "fishing" ? `釣り具屋で ${f.price} 釣りポイント` : `ショップで ${f.price} アメ`}）` : f.label}
              onClick={() => {
                if (locked) {
                  if (f.shop && onOpenPointShop) onOpenPointShop(f.shop);
                  else onOpenShop();
                  return;
                }
                onKind(f.kind);
                if (tool !== "fill") onTool("place");
              }}
            >
              <FurnitureIcon kind={f.kind} color={f.colorable ? color : undefined} size={48} />
              <span>{f.label}</span>
              {locked ? <span className={styles.lockTag}>{f.shop === "casino" ? "🪙" : f.shop === "fishing" ? "🎣" : "🔒"} {f.price}</span> : null}
            </button>
          );
        })}
      </div>

      {showColors ? (
        <div className={styles.palette} aria-label="家具の色">
          {FURNITURE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={styles.swatch}
              style={{ background: c }}
              aria-label={c}
              aria-pressed={color === c}
              onClick={() => onColor(c)}
            />
          ))}
        </div>
      ) : null}

      <div className={styles.styleRow}>
        <span className={styles.paletteLabel}>かべ</span>
        <div className={styles.palette}>
          {WALL_STYLES.map((w) => (
            <button
              key={w.id}
              type="button"
              className={styles.swatch}
              style={{ background: `linear-gradient(${w.base} 60%, ${w.accent} 60%)` }}
              title={w.label}
              aria-label={w.label}
              aria-pressed={room.wall === w.id}
              onClick={() => onStyle({ wall: w.id })}
            />
          ))}
        </div>
      </div>
      <div className={styles.styleRow}>
        <span className={styles.paletteLabel}>ゆか</span>
        <div className={styles.floorChips}>
          {FLOOR_STYLES.map((f) => (
            <button key={f.id} type="button" className={styles.chip} data-active={room.floor === f.id} onClick={() => onStyle({ floor: f.id })}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <form
        className={styles.titleRow}
        onSubmit={(e) => {
          e.preventDefault();
          onStyle({ title });
        }}
      >
        <input value={title} maxLength={20} placeholder="へやの名前（20文字まで）" onChange={(e) => setTitle(e.target.value)} />
        <button type="submit" className={styles.secondaryButton}>変更</button>
      </form>

      <div className={styles.roomShopRow}>
        <span>へやの広さ {room.size}×{room.size}</span>
        {expand ? (
          <button type="button" className={styles.buyButton} disabled={ame < expand.cost} onClick={onExpand}>
            {expand.next}×{expand.next}に広げる 🍬 {expand.cost}
          </button>
        ) : (
          <span className={styles.ownedTag}>さいだい</span>
        )}
      </div>

      {room.guests && room.guests.length > 0 ? (
        <div className={styles.guestbookRow}>
          <span className={styles.guestbookLabel}>🚪 さいきん遊びに来た人</span>
          <ul className={styles.guestbookList}>
            {room.guests.slice(0, 6).map((g, i) => (
              <li key={`${g.at}-${i}`}>
                <span>{g.name}さん</span>
                <small>{timeAgo(g.at)}</small>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={styles.clearRow}>
        {confirmClear ? (
          <>
            <span>家具をぜんぶ片づけますか？（「もどす」で元にもどせます）</span>
            <button type="button" className={styles.secondaryButton} onClick={() => setConfirmClear(false)}>やめる</button>
            <button
              type="button"
              className={styles.dangerButton}
              onClick={() => {
                onClear();
                setConfirmClear(false);
              }}
            >
              ぜんぶ片づける
            </button>
          </>
        ) : (
          <button type="button" className={styles.linkButton} onClick={() => setConfirmClear(true)}>家具をぜんぶ片づける</button>
        )}
      </div>
    </section>
  );
}
