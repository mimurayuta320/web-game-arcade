import type { MaterialKey } from "../types/game";

export const MATERIAL_LABELS: Record<MaterialKey, string> = {
  manaCrystal: "魔力結晶",
  lifeWater: "生命水",
  voidIron: "魔鉄",
  toxinSpore: "毒胞子",
};

export const INITIAL_MATERIALS: Record<MaterialKey, number> = {
  manaCrystal: 0,
  lifeWater: 0,
  voidIron: 0,
  toxinSpore: 0,
};
