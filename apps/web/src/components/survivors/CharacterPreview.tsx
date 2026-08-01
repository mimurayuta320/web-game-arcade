import type { SurvivorsCharacterConfig, SurvivorsModifierKind } from "./types";

type CharacterPreviewProps = {
  character: SurvivorsCharacterConfig;
  roleLabel: string;
};

const colorByKind: Record<SurvivorsModifierKind, string> = {
  buff: "text-emerald-300",
  nerf: "text-rose-300",
  special: "text-cyan-300",
  neutral: "text-slate-200",
};

export default function CharacterPreview({ character, roleLabel }: CharacterPreviewProps) {
  const isDaikon = character.id === "daikon";

  return (
    <section className="h-full rounded-xl border border-slate-300/25 bg-slate-950/72 p-2.5">
      <p className="text-[11px] font-semibold tracking-wide text-cyan-100">キャラクター詳細</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(130px,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-lg border border-cyan-200/25 bg-slate-900/70 p-2">
          <div className="mx-auto grid h-[118px] w-[118px] place-items-center rounded-lg border border-slate-300/20 bg-slate-950/70">
            {isDaikon ? (
              <div className="relative h-[104px] w-[104px] animate-pulse overflow-hidden">
                <div
                  className="absolute inset-0 bg-no-repeat"
                  style={{
                    backgroundImage: `url(${character.image})`,
                    backgroundSize: "300% 200%",
                    backgroundPosition: "0% 0%",
                  }}
                />
              </div>
            ) : (
              <img
                src={character.image}
                alt={`${character.name} preview`}
                className="h-[104px] w-[104px] animate-pulse object-contain"
                draggable={false}
              />
            )}
          </div>
          <div className="mt-2 rounded-md border border-slate-300/20 bg-slate-900/65 px-2 py-1.5">
            <p className="text-[10px] text-slate-300">初期武器</p>
            <div className="mt-1 flex items-center gap-1.5">
              {isDaikon ? (
                <div className="relative h-5 w-5 overflow-hidden">
                  <div
                    className="absolute inset-0 bg-no-repeat"
                    style={{
                      backgroundImage: `url(${character.startingWeapon.icon})`,
                      backgroundSize: "300% 200%",
                      backgroundPosition: "0% 0%",
                    }}
                  />
                </div>
              ) : (
                <img src={character.startingWeapon.icon} alt={`${character.startingWeapon.name} icon`} className="h-5 w-5 object-contain" draggable={false} />
              )}
              <p className="text-[11px] text-slate-100">{character.startingWeapon.name}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-300/20 bg-slate-900/45 p-2">
          <p className="text-sm font-semibold text-cyan-100">{character.name}</p>
          <p className="text-[11px] text-slate-300">{roleLabel}</p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-200">{character.description}</p>

          <p className="mt-2 text-[10px] font-semibold tracking-wide text-cyan-100">固有能力</p>
          <ul className="mt-1 space-y-0.5">
            {character.abilities.map((ability) => (
              <li key={`${character.id}-${ability}`} className="text-[11px] text-slate-100">- {ability}</li>
            ))}
          </ul>

          <p className="mt-2 text-[10px] font-semibold tracking-wide text-cyan-100">ステータス補正</p>
          <ul className="mt-1 space-y-0.5">
            {character.statModifiers.map((modifier) => (
              <li key={`${character.id}-${modifier.label}`} className={`text-[11px] ${colorByKind[modifier.kind]}`}>
                {modifier.label}: {modifier.value}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
