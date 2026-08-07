"use client";

import { MONSTER_BLUEPRINTS, MONSTER_RARITY_COLOR, ROLE_LABEL } from "../data/monsters";
import type { GameState } from "../types/game";

type Props = {
  state: GameState;
  disabled?: boolean;
  onPlaceNest: () => void;
  onSpawnMonster: (kind: string) => void;
};

export function MonsterPanel({ state, disabled = false, onPlaceNest, onSpawnMonster }: Props) {
  return (
    <section className="dlPanel" data-ui-panel="true">
      <h3 className="dlPanelTitle">巣と魔物</h3>
      <button className="dlBtn" onClick={onPlaceNest} type="button" disabled={disabled}>
        巣を配置
      </button>
      <div className="dlMonsterList">
        {MONSTER_BLUEPRINTS.map((monster) => {
          const lacks = Object.entries(monster.cost).filter(([mat, need]) => {
            const key = mat as keyof GameState["materials"];
            return state.materials[key] < (need ?? 0);
          });
          const spawnDisabled = disabled || lacks.length > 0;

          return (
            <div key={monster.id} className="dlMonsterCard">
              <div className="dlMonsterHead">
                <span className="dlSwatch" style={{ background: monster.visualConfig.bodyColor }} />
                <strong>{monster.name}</strong>
                <span style={{ color: MONSTER_RARITY_COLOR[monster.rarity], marginLeft: "auto", fontSize: 12 }}>
                  {monster.rarity}
                </span>
              </div>
              <p className="dlMuted">{ROLE_LABEL[monster.role]}</p>
              <p className="dlCost">
                {Object.entries(monster.cost)
                  .map(([k, v]) => `${k}:${v}`)
                  .join(" / ")}
              </p>
              {lacks.length > 0 ? <p className="dlWarnText">不足: {lacks.map(([k]) => k).join(", ")}</p> : null}
              <button className="dlBtnSmall" disabled={spawnDisabled} onClick={() => onSpawnMonster(monster.id)} type="button">
                生成
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
