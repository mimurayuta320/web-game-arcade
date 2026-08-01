export type SurvivorsCharacterId = "fairy" | "hammer" | "daikon";

export type SurvivorsDifficulty = "easy" | "normal" | "hard";

export type SurvivorsModifierKind = "buff" | "nerf" | "special" | "neutral";

export type SurvivorsStatModifier = {
  label: string;
  value: string;
  kind: SurvivorsModifierKind;
};

export type SurvivorsCharacterConfig = {
  id: SurvivorsCharacterId;
  name: string;
  description: string;
  image: string;
  startingWeapon: {
    name: string;
    icon: string;
  };
  abilities: string[];
  statModifiers: SurvivorsStatModifier[];
  unlocked: boolean;
  unlockCondition?: string;
  themeColor: string;
};

export type SurvivorsCharacterRecord = {
  bestWave: number | null;
  bestDifficulty: SurvivorsDifficulty | null;
  playCount: number;
  winCount: number;
};

export type SurvivorsStageSettings = {
  difficulty: SurvivorsDifficulty;
  endlessMode: boolean;
  chaosMode: boolean;
  coopMode: boolean;
};
