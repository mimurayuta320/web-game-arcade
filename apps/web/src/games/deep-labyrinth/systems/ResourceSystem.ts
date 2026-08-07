import type { CellType, MaterialKey } from "../types/game";

export function materialFromSoil(type: CellType): MaterialKey | null {
  if (type === "magicSoil") return "manaCrystal";
  if (type === "moistSoil") return "lifeWater";
  if (type === "mineralSoil") return "voidIron";
  if (type === "toxicSoil") return "toxinSpore";
  return null;
}
