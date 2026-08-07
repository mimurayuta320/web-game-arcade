"use client";

import { MATERIAL_LABELS } from "../data/materials";
import type { GameState } from "../types/game";

type Props = {
  state: GameState;
};

export function MaterialPanel({ state }: Props) {
  return (
    <section className="dlPanel" data-ui-panel="true">
      <h3 className="dlPanelTitle">素材</h3>
      <ul className="dlList">
        {Object.entries(state.materials).map(([key, value]) => (
          <li key={key} className="dlListItem">
            <span>{MATERIAL_LABELS[key as keyof typeof MATERIAL_LABELS]}</span>
            <strong>{value}</strong>
          </li>
        ))}
      </ul>
      <p className="dlMuted">掘削エネルギーは将来フェーズで回復式へ拡張可能です。</p>
    </section>
  );
}
