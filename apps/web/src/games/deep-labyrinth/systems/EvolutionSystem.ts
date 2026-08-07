export type MutationCandidate = {
  id: string;
  label: string;
  description: string;
};

export function pickMutationCandidates(): MutationCandidate[] {
  return [
    { id: "hp-boost", label: "堅牢化", description: "最大HP+20%" },
    { id: "haste", label: "活性化", description: "攻撃速度+15%" },
    { id: "venom", label: "毒腺増殖", description: "毒ダメージを付与" },
  ];
}
