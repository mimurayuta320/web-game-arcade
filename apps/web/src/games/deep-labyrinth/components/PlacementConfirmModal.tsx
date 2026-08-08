"use client";

import { useEffect, useRef } from "react";
import type { GridPosition } from "../types/game";

type PlacementConfirmModalProps = {
  isOpen: boolean;
  position: GridPosition | null;
  isProcessing: boolean;
  mode: "initial" | "reposition";
  onConfirm: () => void;
  onCancel: () => void;
  onStartCurrent: () => void;
};

export function PlacementConfirmModal({
  isOpen,
  position,
  isProcessing,
  mode,
  onConfirm,
  onCancel,
  onStartCurrent,
}: PlacementConfirmModalProps) {
  const okRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    okRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        onConfirm();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onCancel, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="dlPlacementModalRoot" role="dialog" aria-modal="true" aria-label="配置確認モーダル">
      <section className="dlPlacementModalCard" data-ui-panel="true">
        <h3 className="dlPanelTitle">配置確認</h3>
        <p className="dlMuted">
          {mode === "reposition"
            ? "この場所へプレイヤーを移動して、次のウェーブを開始しますか？"
            : "この場所に守る味方を配置してゲームを開始しますか？"}
        </p>
        {position ? (
          <p className="dlWarnText">
            選択座標: {position.x}, {position.y}
          </p>
        ) : null}
        {mode === "initial" ? <p className="dlMuted">配置後は通常の方法では移動できません。</p> : null}
        <p className="dlMuted">OKを押すと3秒後に敵の襲撃が始まります。</p>

        <div className="dlPlacementModalActions">
          <button
            ref={okRef}
            type="button"
            className="dlBtn"
            disabled={isProcessing}
            onClick={onConfirm}
          >
            {isProcessing ? "処理中..." : "OK"}
          </button>
          <button type="button" className="dlBtnGhost" disabled={isProcessing} onClick={onCancel}>
            配置し直す
          </button>
          {mode === "reposition" ? (
            <button type="button" className="dlBtnGhost" disabled={isProcessing} onClick={onStartCurrent}>
              現在位置のまま開始
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
