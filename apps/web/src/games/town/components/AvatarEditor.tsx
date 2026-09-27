"use client";

import { useState } from "react";
import styles from "@/app/games/town/town.module.css";
import {
  AVATAR_CATEGORIES, limitedKey, normalizeAvatar, randomAvatar, type AvatarConfig, type PartCategory,
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
};

export function AvatarEditor({
  initialName, initialAvatar, required = false, onSave, onCancel, ownedParts = new Set(), onOpenShop,
}: Props) {
  const [name, setName] = useState(initialName);
  const [avatar, setAvatar] = useState<AvatarConfig>(initialAvatar);
  const [group, setGroup] = useState<PartCategory["group"]>("face");
  const [categoryKey, setCategoryKey] = useState<keyof AvatarConfig>("hair");
  const [facing, setFacing] = useState<AvatarPose["facing"]>("front");
  const [walking, setWalking] = useState(false);
  const [previewAction, setPreviewAction] = useState<ActionId | null>(null);
  const [outfits, setOutfits] = useState<Array<AvatarConfig | null>>(() => loadOutfits());
  const [outfitMode, setOutfitMode] = useState<"load" | "save">("load");

  const categories = AVATAR_CATEGORIES.filter((c) => c.group === group);
  const category = categories.find((c) => c.key === categoryKey) ?? categories[0];
  const trimmedName = name.trim().slice(0, 12);
  // Limited parts can be tried on, but only owned ones can be saved.
  const lockedWorn = AVATAR_CATEGORIES.flatMap((c) =>
    c.options.filter((o) => o.price && avatar[c.key] === o.id && !ownedParts.has(limitedKey(c.key, o.id))),
  );
  const isSkin = category.key === "skin";
  const colorKey = isSkin ? "skin" : category.colorKey;
  const palette = isSkin ? category.options.map((o) => o.id) : category.palette;

  const selectGroup = (next: PartCategory["group"]) => {
    setGroup(next);
    setCategoryKey(next === "face" ? "hair" : "top");
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
                {c.label}
              </button>
            ))}
          </div>

          {!isSkin ? (
            <div className={styles.optionGrid}>
              {category.options.map((option) => {
                const next = { ...avatar, [category.key]: option.id };
                const selected = avatar[category.key] === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={styles.optionCard}
                    aria-pressed={selected}
                    onClick={() => setAvatar(next)}
                  >
                    <AvatarCanvas avatar={next} width={72} height={72} focus={category.focus} facing={category.thumbBack ? "back" : "front"} />
                    <span>{option.label}</span>
                    {option.price && !ownedParts.has(limitedKey(category.key, option.id)) ? (
                      <span className={styles.lockTag}>🔒 {option.price}</span>
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
                    onClick={() => setAvatar({ ...avatar, [colorKey]: color })}
                  />
                ))}
                <label className={styles.customColor} title="すきな色をえらぶ">
                  <input
                    type="color"
                    value={avatar[colorKey]}
                    onChange={(e) => setAvatar({ ...avatar, [colorKey]: e.target.value.toLowerCase() })}
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
                {onOpenShop ? (
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
