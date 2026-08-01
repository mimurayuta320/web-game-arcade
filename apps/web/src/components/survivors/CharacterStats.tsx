import type { SurvivorsCharacterConfig, SurvivorsModifierKind } from "./types";

type CharacterStatsProps = {
  character: SurvivorsCharacterConfig;
};

const colorByKind: Record<SurvivorsModifierKind, string> = {
  buff: "text-emerald-300",
  nerf: "text-rose-300",
  special: "text-cyan-300",
  neutral: "text-slate-200",
};

export default function CharacterStats({ character }: CharacterStatsProps) {
  return (
    <section className="rounded-xl border border-slate-300/25 bg-slate-950/70 p-3">
      <p className="text-xs font-semibold tracking-wide text-cyan-100">ABILITIES</p>
      <ul className="mt-2 space-y-1">
        {character.abilities.map((ability) => (
          <li key={`${character.id}-${ability}`} className="text-xs text-slate-100">- {ability}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs font-semibold tracking-wide text-cyan-100">STAT MODIFIERS</p>
      <ul className="mt-2 space-y-1">
        {character.statModifiers.map((modifier) => (
          <li key={`${character.id}-${modifier.label}`} className={`text-xs ${colorByKind[modifier.kind]}`}>{modifier.label}: {modifier.value}</li>
        ))}
      </ul>
    </section>
  );
}
