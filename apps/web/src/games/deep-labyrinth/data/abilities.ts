export type AbilityDefinition = {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  range: number;
};

export const ABILITY_DEFINITIONS: AbilityDefinition[] = [
  { id: "intimidate", name: "威嚇", description: "周囲3マスへ挑発", cooldown: 8.5, range: 3 },
  { id: "manaScales", name: "魔力鱗粉", description: "対象周囲1マスへ範囲ダメージ", cooldown: 4.8, range: 4.5 },
  { id: "bubbleShot", name: "バブルショット", description: "鈍足と低確率ノックバック", cooldown: 3.8, range: 3.2 },
  { id: "crystalReflect", name: "結晶反射", description: "近距離攻撃者へ反射ダメージ", cooldown: 1.2, range: 1.8 },
  { id: "infectSpore", name: "感染胞子", description: "毒の拡散を誘発", cooldown: 3.5, range: 2.2 },
  { id: "runeWarcry", name: "戦意のルーン", description: "周囲4マスの味方を強化", cooldown: 9.5, range: 4 },
  { id: "lifeAttach", name: "生命吸着", description: "HPが減った味方を回復", cooldown: 5.5, range: 4 },
  { id: "heatSpray", name: "熱殻噴射", description: "前方扇状3マスへ火傷攻撃", cooldown: 6.8, range: 3 },
  { id: "shadowLeap", name: "影渡り", description: "到達可能床へ高速移動", cooldown: 6.2, range: 6 },
  { id: "broodSpawn", name: "眷属生成", description: "最大3体まで眷属召喚", cooldown: 10.5, range: 2.5 },
];

export function getAbilityDefinition(abilityId: string | null): AbilityDefinition | null {
  if (!abilityId) return null;
  return ABILITY_DEFINITIONS.find((item) => item.id === abilityId) ?? null;
}
