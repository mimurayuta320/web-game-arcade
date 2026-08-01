import type { SurvivorsCharacterConfig } from "./types";

type CharacterCardProps = {
  character: SurvivorsCharacterConfig;
  selected: boolean;
  disabled: boolean;
  onSelect: (id: SurvivorsCharacterConfig["id"]) => void;
  onHover: (id: SurvivorsCharacterConfig["id"] | null) => void;
};

const modifierColor = (value: string) => value;

export default function CharacterCard({ character, selected, disabled, onSelect, onHover }: CharacterCardProps) {
  const isDaikon = character.id === "daikon";

  return (
    <button
      type="button"
      onMouseEnter={() => onHover(character.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(character.id)}
      onBlur={() => onHover(null)}
      onClick={() => {
        if (!character.unlocked || disabled) return;
        onSelect(character.id);
      }}
      disabled={disabled || !character.unlocked}
      className={`group relative flex h-[90px] w-[90px] flex-col items-center justify-between rounded-xl border px-1.5 py-1.5 text-center transition ${selected ? "border-cyan-200 bg-cyan-500/10 shadow-[0_0_16px_rgba(34,211,238,0.48)]" : "border-slate-400/35"} ${character.unlocked ? "bg-slate-900/72 hover:-translate-y-[1px]" : "bg-slate-900/35 opacity-75"}`}
      aria-label={`select ${modifierColor(character.name)}`}
    >
      <div className="grid h-[58px] w-full place-items-center rounded-lg border border-slate-300/20 bg-slate-950/70">
        {isDaikon ? (
          <div className="relative h-12 w-12 overflow-hidden">
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
          <img src={character.image} alt={`${character.name} icon`} className="h-12 w-12 object-contain" draggable={false} />
        )}
      </div>
      <p className="text-[10px] font-semibold leading-none text-cyan-100">{character.name}</p>
      {selected ? <span className="absolute inset-0 rounded-xl ring-1 ring-cyan-200/70" aria-hidden="true" /> : null}
      {!character.unlocked ? (
        <div className="absolute inset-0 rounded-xl bg-slate-950/75 p-1">
          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-200">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-current">
              <path d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2m-7-2a2 2 0 1 1 4 0v2h-4zm2 9a2 2 0 1 1 0 4 2 2 0 0 1 0-4" />
            </svg>
            LOCKED
          </div>
          <p className="mt-1 text-[9px] text-slate-300">{character.unlockCondition || "解放条件: 準備中"}</p>
        </div>
      ) : null}
    </button>
  );
}
