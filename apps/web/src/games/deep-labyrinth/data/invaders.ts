export interface InvaderBlueprint {
  id: string;
  name: string;
  hp: number;
  speed: number;
  attack: number;
  range: number;
  color: string;
}

export const INVADER_BLUEPRINTS: InvaderBlueprint[] = [
  { id: "scout", name: "斥候", hp: 36, speed: 2.0, attack: 8, range: 1.0, color: "#f1c27d" },
  { id: "swordsman", name: "剣士", hp: 64, speed: 1.45, attack: 12, range: 1.0, color: "#d4d7dd" },
  { id: "heavy", name: "重装兵", hp: 110, speed: 0.9, attack: 16, range: 1.0, color: "#98a2b3" },
  { id: "caster", name: "術師", hp: 54, speed: 1.25, attack: 11, range: 3.8, color: "#8fb8ff" },
  { id: "miner", name: "採掘師", hp: 70, speed: 1.0, attack: 9, range: 1.0, color: "#ffb454" },
  { id: "purifier", name: "浄化師", hp: 68, speed: 1.45, attack: 10, range: 1.0, color: "#b4f2de" },
];
