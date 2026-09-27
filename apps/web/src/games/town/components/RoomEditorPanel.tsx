"use client";

import { useState } from "react";
import styles from "@/app/games/town/town.module.css";
import {
  FLOOR_STYLES, FURNITURE, FURNITURE_BY_KIND, FURNITURE_CATEGORIES, FURNITURE_COLORS, WALL_STYLES, expandCost, maxItems,
  type FurnitureCategory, type FurnitureKind, type RoomData,
} from "../world/furniture";
import { FurnitureIcon } from "./FurnitureIcon";

export type RoomTool = "place" | "rotate" | "remove";

type Props = {
  room: RoomData;
  ame: number;
  ownedFurniture: Set<string>;
  tool: RoomTool;
  kind: FurnitureKind;
  color: string;
  /** Place new pieces turned 90°. */
  turned: boolean;
  onTool: (tool: RoomTool) => void;
  onKind: (kind: FurnitureKind) => void;
  onColor: (color: string) => void;
  onTurned: (turned: boolean) => void;
  onStyle: (style: { wall?: string; floor?: string; title?: string }) => void;
  onClear: () => void;
  onExpand: () => void;
  onOpenShop: () => void;
  onDone: () => void;
};

/** My-room decoration panel: pick furniture, then click the floor to place it. */
export function RoomEditorPanel({
  room, ame, ownedFurniture, tool, kind, color, turned,
  onTool, onKind, onColor, onTurned, onStyle, onClear, onExpand, onOpenShop, onDone,
}: Props) {
  const [title, setTitle] = useState(room.title);
  const [confirmClear, setConfirmClear] = useState(false);
  const [category, setCategory] = useState<FurnitureCategory>("living");
  const def = FURNITURE_BY_KIND.get(kind);
  const colorable = def?.colorable;
  const square = def ? def.w === def.h : true;
  const expand = expandCost(room.size);

  return (
    <section className={`${styles.panel} ${styles.roomEditor}`} aria-label="へやの編集">
      <div className={styles.roomEditorHeader}>
        <h2 className={styles.panelTitle}>
          へやを編集中（{room.items.length}/{maxItems(room.size)}・{room.size}×{room.size}）
        </h2>
        <button type="button" className={styles.primaryButton} onClick={onDone}>おわる</button>
      </div>

      <div className={styles.toolToggle} role="radiogroup" aria-label="どうぐ">
        {([["place", "おく"], ["rotate", "まわす"], ["remove", "かたづける"]] as Array<[RoomTool, string]>).map(([id, label]) => (
          <button key={id} type="button" role="radio" aria-checked={tool === id} className={styles.chip} data-active={tool === id} onClick={() => onTool(id)}>
            {label}
          </button>
        ))}
        {tool === "place" && !square ? (
          <button type="button" className={styles.chip} data-active={turned} onClick={() => onTurned(!turned)} title="置く向きを変える">
            向き {turned ? "↕" : "↔"}
          </button>
        ) : null}
      </div>

      <div className={styles.floorChips} role="tablist" aria-label="家具のしゅるい">
        {FURNITURE_CATEGORIES.map((c) => (
          <button key={c.id} type="button" role="tab" aria-selected={category === c.id} className={styles.categoryTab} onClick={() => setCategory(c.id)}>
            {c.label}
          </button>
        ))}
      </div>

      <div className={styles.furnitureGrid}>
        {FURNITURE.filter((f) => f.category === category).map((f) => {
          const locked = Boolean(f.price) && !ownedFurniture.has(f.kind);
          return (
            <button
              key={f.kind}
              type="button"
              className={styles.furnitureButton}
              aria-pressed={tool === "place" && kind === f.kind}
              data-locked={locked}
              title={locked ? `${f.label}（ショップで ${f.price} アメ）` : f.label}
              onClick={() => {
                if (locked) {
                  onOpenShop();
                  return;
                }
                onKind(f.kind);
                onTool("place");
              }}
            >
              <FurnitureIcon kind={f.kind} color={f.colorable ? color : undefined} size={48} />
              <span>{f.label}</span>
              {locked ? <span className={styles.lockTag}>🔒 {f.price}</span> : null}
            </button>
          );
        })}
      </div>

      {colorable && tool === "place" ? (
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

      <div className={styles.clearRow}>
        {confirmClear ? (
          <>
            <span>家具をぜんぶ片づけますか？</span>
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
