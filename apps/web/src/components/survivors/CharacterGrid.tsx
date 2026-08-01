import CharacterCard from "./CharacterCard";
import type { SurvivorsCharacterConfig, SurvivorsCharacterId } from "./types";

type CharacterGridProps = {
  characters: SurvivorsCharacterConfig[];
  selectedId: SurvivorsCharacterId;
  disabled: boolean;
  onSelect: (id: SurvivorsCharacterId) => void;
  onHover: (id: SurvivorsCharacterId | null) => void;
};

export default function CharacterGrid({ characters, selectedId, disabled, onSelect, onHover }: CharacterGridProps) {
  return (
    <div className="mt-2 rounded-xl border border-cyan-200/25 bg-slate-950/68 p-2">
      <p className="mb-2 text-[11px] font-semibold tracking-wide text-cyan-100">キャラクター選択</p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(78px,92px))] gap-2 justify-start">
        {characters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            selected={selectedId === character.id}
            disabled={disabled}
            onSelect={onSelect}
            onHover={onHover}
          />
        ))}
      </div>
    </div>
  );
}
