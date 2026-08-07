"use client";

import type { GameState } from "../types/game";

type Props = {
  visible: boolean;
  state: GameState;
  onRestart: () => void;
};

export function ResultModal({ visible, state, onRestart }: Props) {
  if (!visible) return null;

  const highestMonsterLevel = 1;
  const aliveMonsters = state.monsters.filter((monster) => monster.isActive && monster.state !== "dead").length;

  return (
    <div className="dlOverlay" data-ui-panel="true">
      <div className="dlOverlayCard">
        <h3>リザルト</h3>
        <ul className="dlList">
          <li className="dlListItem"><span>到達ウェーブ</span><strong>{state.wave.wave}</strong></li>
          <li className="dlListItem"><span>倒した侵入者数</span><strong>{state.stats.killedInvaders}</strong></li>
          <li className="dlListItem"><span>生成した魔物数</span><strong>{state.stats.spawnedMonsters}</strong></li>
          <li className="dlListItem"><span>掘ったマス数</span><strong>{state.totalDugCount}</strong></li>
          <li className="dlListItem"><span>獲得素材数</span><strong>{state.stats.collectedMaterials}</strong></li>
          <li className="dlListItem"><span>生存した魔物数</span><strong>{aliveMonsters}</strong></li>
          <li className="dlListItem"><span>最高レベルの魔物</span><strong>{highestMonsterLevel}</strong></li>
          <li className="dlListItem"><span>スコア</span><strong>{state.score}</strong></li>
        </ul>
        <button className="dlBtn" onClick={onRestart} type="button">
          もう一度遊ぶ
        </button>
      </div>
    </div>
  );
}
