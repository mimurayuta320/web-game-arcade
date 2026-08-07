"use client";

import { getAbilityDefinition } from "../data/abilities";
import { findMonsterDefinition, MONSTER_RARITY_COLOR, RARITY_LABEL, ROLE_LABEL } from "../data/monsters";

type BestiaryViewEntry = {
  id: string;
  discovered: boolean;
  discoveredCount: number;
  killCount: number;
  name: string;
  role: string;
  rarity: string;
  description: string;
};

type Props = {
  entries: BestiaryViewEntry[];
};

export function BestiaryPanel({ entries }: Props) {
  return (
    <section className="dlPanel" data-ui-panel="true">
      <h3 className="dlPanelTitle">魔物図鑑</h3>
      <div className="dlMonsterList">
        {entries.map((entry) => {
          const def = findMonsterDefinition(entry.id);
          const ability = def?.abilityId ? getAbilityDefinition(def.abilityId) : null;
          const rarityColor = MONSTER_RARITY_COLOR[(entry.rarity as keyof typeof MONSTER_RARITY_COLOR) ?? "common"];
          return (
            <div key={entry.id} className="dlMonsterCard">
              <div className="dlMonsterHead">
                <span
                  className="dlSwatch"
                  style={{ background: entry.discovered ? def?.visualConfig.bodyColor ?? "#6f7c96" : "#3a4055" }}
                />
                <strong>{entry.discovered ? entry.name : "???"}</strong>
                <span style={{ color: rarityColor, marginLeft: "auto", fontSize: 12 }}>
                  {RARITY_LABEL[(entry.rarity as keyof typeof RARITY_LABEL) ?? "common"]}
                </span>
              </div>
              <p className="dlMuted">{ROLE_LABEL[(entry.role as keyof typeof ROLE_LABEL) ?? "melee"]}</p>
              <p className="dlMuted">{entry.discovered ? entry.description : "未発見の魔物です"}</p>
              {def ? (
                <p className="dlCost">
                  HP:{def.maxHp} / 攻撃:{def.attack} / 防御:{def.defense} / 射程:{def.range}
                </p>
              ) : null}
              {def ? (
                <p className="dlMuted">
                  土:{def.spawnSoilTypes.join(", ")} / 深度:{def.spawnDepthLayers.join(", ")}
                </p>
              ) : null}
              <p className="dlMuted">発見:{entry.discoveredCount} / 討伐:{entry.killCount}</p>
              {ability && entry.discovered ? (
                <p className="dlWarnText">能力: {ability.name} ({ability.cooldown}s) - {ability.description}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
