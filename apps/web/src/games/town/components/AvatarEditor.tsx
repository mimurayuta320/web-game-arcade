"use client";

import type { ShopId } from "../shared/shop";
import { useState } from "react";
import styles from "@/app/games/town/town.module.css";
import {
  AVATAR_CATEGORIES, MAX_WEAR_ITEMS, limitedKey, normalizeAvatar, randomAvatar, randomizeCategory, withWearItems,
  type AvatarConfig, type AvatarPartKey, type PartCategory, type WearItem,
} from "../avatar/parts";
import type { AvatarPose } from "../avatar/drawAvatar";
import type { ActionId } from "../avatar/actions";
import { AvatarCanvas } from "./AvatarCanvas";

const OUTFIT_STORAGE_KEY = "neon-town-outfits-v1";
const OUTFIT_SLOTS = 6;

const GROUPS: Array<{ id: PartCategory["group"]; label: string }> = [
  { id: "face", label: "かお" },
  { id: "wear", label: "きせかえ" },
];

const PREVIEW_ACTIONS: Array<{ id: ActionId | null; label: string }> = [
  { id: null, label: "たつ" },
  { id: "laugh", label: "わらう" },
  { id: "wave", label: "手をふる" },
  { id: "dance", label: "ダンス" },
  { id: "shy", label: "てれる" },
];

function loadOutfits(): Array<AvatarConfig | null> {
  try {
    const raw = JSON.parse(localStorage.getItem(OUTFIT_STORAGE_KEY) || "[]");
    return Array.from({ length: OUTFIT_SLOTS }, (_, i) => (raw[i] ? normalizeAvatar(raw[i]) : null));
  } catch {
    return Array.from({ length: OUTFIT_SLOTS }, () => null);
  }
}

function saveOutfits(outfits: Array<AvatarConfig | null>) {
  try {
    localStorage.setItem(OUTFIT_STORAGE_KEY, JSON.stringify(outfits));
  } catch {
    // storage unavailable – outfits last for this visit only
  }
}

type Props = {
  initialName: string;
  initialAvatar: AvatarConfig;
  /** First visit: hide the cancel button so a look gets chosen. */
  required?: boolean;
  onSave: (name: string, avatar: AvatarConfig) => void;
  onCancel: () => void;
  /** Limited parts this player owns ("key:id"). */
  ownedParts?: Set<string>;
  onOpenShop?: () => void;
  onOpenPointShop?: (shop: ShopId) => void;
};

export function AvatarEditor({
  initialName, initialAvatar, required = false, onSave, onCancel, ownedParts = new Set(), onOpenShop, onOpenPointShop,
}: Props) {
  const [name, setName] = useState(initialName);
  const [avatar, setAvatar] = useState<AvatarConfig>(initialAvatar);
  const [group, setGroup] = useState<PartCategory["group"]>("face");
  const [categoryKey, setCategoryKey] = useState<AvatarPartKey>("hair");
  const [facing, setFacing] = useState<AvatarPose["facing"]>("front");
  const [walking, setWalking] = useState(false);
  const [previewAction, setPreviewAction] = useState<ActionId | null>(null);
  const [outfits, setOutfits] = useState<Array<AvatarConfig | null>>(() => loadOutfits());
  const [outfitMode, setOutfitMode] = useState<"load" | "save">("load");

  const categories = AVATAR_CATEGORIES.filter((c) => c.group === group);
  const category = categories.find((c) => c.key === categoryKey) ?? categories[0];
  const trimmedName = name.trim().slice(0, 12);
  // Limited parts can be tried on, but only owned ones can be saved.
  const lockedWorn = avatar.wearItems.flatMap((item) => {
    const category = AVATAR_CATEGORIES.find((c) => c.key === item.key);
    const option = category?.options.find((o) => o.id === item.id);
    return option?.price && !ownedParts.has(limitedKey(item.key, item.id)) ? [option] : [];
  });
  const isSkin = category.key === "skin";
  const colorKey = isSkin ? "skin" : category.colorKey;
  const palette = isSkin ? category.options.map((o) => o.id) : category.palette;

  const selectGroup = (next: PartCategory["group"]) => {
    setGroup(next);
    setCategoryKey(next === "face" ? "hair" : "top");
  };

  const itemLabel = (item: WearItem) => {
    const category = AVATAR_CATEGORIES.find((c) => c.key === item.key);
    return category?.options.find((option) => option.id === item.id)?.label ?? item.id;
  };

  const removeWearItem = (index: number) => {
    setAvatar(withWearItems(avatar, avatar.wearItems.filter((_, itemIndex) => itemIndex !== index)));
  };

  const changeColor = (nextColor: string) => {
    if (category.group === "wear" && category.colorKey) {
      const index = avatar.wearItems.findLastIndex((item) => item.key === category.key);
      if (index >= 0) {
        const items = avatar.wearItems.map((item, itemIndex) => itemIndex === index ? { ...item, color: nextColor } : item);
        setAvatar(withWearItems(avatar, items));
        return;
      }
    }
    if (colorKey) setAvatar({ ...avatar, [colorKey]: nextColor });
  };

  const handleOutfitSlot = (index: number) => {
    if (outfitMode === "save") {
      const next = [...outfits];
      next[index] = avatar;
      setOutfits(next);
      saveOutfits(next);
      setOutfitMode("load");
      return;
    }
    const outfit = outfits[index];
    if (outfit) setAvatar(outfit);
  };

  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="着せかえ">
      <div className={styles.editor}>
        <div className={styles.editorPreview}>
          <div className={styles.previewStage}>
            <AvatarCanvas avatar={avatar} width={200} height={250} facing={facing} walking={walking && !previewAction} action={previewAction} />
          </div>
          <div className={styles.previewButtons}>
            <button type="button" className={styles.chip} onClick={() => setFacing(facing === "front" ? "back" : "front")}>
              {facing === "front" ? "うしろ" : "まえ"}を見る
            </button>
            <button type="button" className={styles.chip} data-active={walking} onClick={() => setWalking(!walking)}>
              あるく
            </button>
            <button type="button" className={styles.chip} onClick={() => setAvatar(randomAvatar())}>
              ランダム
            </button>
            <button type="button" className={styles.chip} onClick={() => setAvatar(initialAvatar)}>
              もとにもどす
            </button>
          </div>
          <div className={styles.previewButtons} aria-label="アクションをためす">
            {PREVIEW_ACTIONS.map((a) => (
              <button
                key={a.label}
                type="button"
                className={styles.chip}
                data-active={previewAction === a.id}
                onClick={() => setPreviewAction(a.id)}
              >
                {a.label}
              </button>
            ))}
          </div>
          <label className={styles.nameField}>
            <span>なまえ</span>
            <input value={name} maxLength={12} onChange={(e) => setName(e.target.value)} placeholder="12文字まで" />
          </label>

          <div className={styles.outfits}>
            <div className={styles.outfitsHeader}>
              <span>コーデ</span>
              <button
                type="button"
                className={styles.chip}
                data-active={outfitMode === "save"}
                onClick={() => setOutfitMode(outfitMode === "save" ? "load" : "save")}
              >
                {outfitMode === "save" ? "保存先をえらんでね" : "いまの服を保存"}
              </button>
            </div>
            <div className={styles.outfitGrid}>
              {outfits.map((outfit, i) => (
                <button
                  key={i}
                  type="button"
                  className={styles.outfitSlot}
                  data-mode={outfitMode}
                  aria-label={outfit ? `コーデ${i + 1}` : `コーデ${i + 1}（から）`}
                  onClick={() => handleOutfitSlot(i)}
                >
                  {outfit ? <AvatarCanvas avatar={outfit} width={44} height={52} /> : <span>{i + 1}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.editorParts}>
          <div className={styles.groupTabs} role="tablist">
            {GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={group === g.id}
                className={styles.groupTab}
                onClick={() => selectGroup(g.id)}
              >
                {g.label}
              </button>
            ))}
          </div>
          <div className={styles.categoryTabs} role="tablist">
            {categories.map((c) => (
              <button
                key={c.key}
                type="button"
                role="tab"
                aria-selected={c.key === category.key}
                className={styles.categoryTab}
                onClick={() => setCategoryKey(c.key)}
              >
                <span aria-hidden="true">{c.icon}</span> {c.label}
              </button>
            ))}
          </div>

          <div className={styles.categoryRandomRow}>
            <button type="button" className={styles.linkButton} onClick={() => setAvatar(randomizeCategory(avatar, category.key))}>
              🎲 {category.label}だけおまかせ
            </button>
          </div>

          {group === "wear" ? (
            <div className={styles.previewButtons} aria-label="いま着ているアイテム">
              <strong>装着 {avatar.wearItems.length}/{MAX_WEAR_ITEMS}</strong>
              {avatar.wearItems.map((item, index) => (
                <button
                  key={`${item.key}-${item.id}-${index}`}
                  type="button"
                  className={styles.chip}
                  title="クリックして1個外す"
                  onClick={() => removeWearItem(index)}
                >
                  {itemLabel(item)} ×
                </button>
              ))}
              {avatar.wearItems.length ? (
                <button type="button" className={styles.secondaryButton} onClick={() => setAvatar(withWearItems(avatar, []))}>
                  全部脱ぐ
                </button>
              ) : <span>標準パンツのみ</span>}
            </div>
          ) : null}

          {!isSkin ? (
            <div className={styles.optionGrid}>
              {category.options.map((option) => {
                const isWear = category.group === "wear";
                const count = isWear ? avatar.wearItems.filter((item) => item.key === category.key && item.id === option.id).length : 0;
                const color = category.colorKey ? String(avatar[category.colorKey]) : undefined;
                const nextItems = option.id === "none"
                  ? avatar.wearItems.filter((item) => item.key !== category.key)
                  : [...avatar.wearItems, { key: category.key, id: option.id, ...(color ? { color } : {}) } as WearItem];
                const next = isWear ? withWearItems(avatar, nextItems) : { ...avatar, [category.key]: option.id };
                const selected = isWear
                  ? option.id === "none" ? !avatar.wearItems.some((item) => item.key === category.key) : count > 0
                  : avatar[category.key] === option.id;
                const full = isWear && option.id !== "none" && avatar.wearItems.length >= MAX_WEAR_ITEMS;
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={styles.optionCard}
                    aria-pressed={selected}
                    disabled={full}
                    onClick={() => setAvatar(next)}
                  >
                    <AvatarCanvas avatar={next} width={72} height={72} focus={category.focus} facing={category.thumbBack ? "back" : "front"} />
                    <span>{option.label}{count > 1 ? ` ×${count}` : ""}</span>
                    {option.price && !ownedParts.has(limitedKey(category.key, option.id)) ? (
                      <span className={styles.lockTag}>{option.shop === "casino" ? "🪙" : option.shop === "fishing" ? "🎣" : "🔒"} {option.price}</span>
                    ) : option.price ? (
                      <span className={styles.limitedTag}>★げんてい</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}

          {colorKey && palette ? (
            <div className={styles.paletteBlock}>
              <span className={styles.paletteLabel}>いろ</span>
              <div className={styles.palette}>
                {palette.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={styles.swatch}
                    style={{ background: color }}
                    aria-label={color}
                    aria-pressed={avatar[colorKey] === color}
                    onClick={() => changeColor(color)}
                  />
                ))}
                <label className={styles.customColor} title="すきな色をえらぶ">
                  <input
                    type="color"
                    value={avatar[colorKey]}
                    onChange={(e) => changeColor(e.target.value.toLowerCase())}
                  />
                  <span>じゆう</span>
                </label>
              </div>
              {isSkin ? <AvatarCanvas avatar={avatar} width={120} height={120} focus="head" /> : null}
            </div>
          ) : null}

          <div className={styles.editorActions}>
            {lockedWorn.length ? (
              <p className={styles.lockNote}>
                「{lockedWorn.map((o) => o.label).join("・")}」はまだ持っていません。
                {lockedWorn[0]?.shop && onOpenPointShop ? (
                  <button type="button" className={styles.linkButton} onClick={() => onOpenPointShop(lockedWorn[0].shop as ShopId)}>
                    {lockedWorn[0].shop === "casino" ? "景品交換所" : "釣り具屋"}で買う
                  </button>
                ) : onOpenShop ? (
                  <button type="button" className={styles.linkButton} onClick={onOpenShop}>ショップで買う</button>
                ) : null}
              </p>
            ) : null}
            {!required ? (
              <button type="button" className={styles.secondaryButton} onClick={onCancel}>
                キャンセル
              </button>
            ) : null}
            <button
              type="button"
              className={styles.primaryButton}
              disabled={!trimmedName || lockedWorn.length > 0}
              onClick={() => onSave(trimmedName, avatar)}
            >
              {required ? "この見た目でタウンへ" : "けってい"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
