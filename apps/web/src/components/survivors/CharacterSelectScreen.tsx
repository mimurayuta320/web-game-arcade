import CharacterGrid from "./CharacterGrid";
import CharacterPreview from "./CharacterPreview";
import CharacterRecord from "./CharacterRecord";
import StageSettings from "./StageSettings";
import styles from "./CharacterSelectScreen.module.css";
import type {
  SurvivorsCharacterConfig,
  SurvivorsCharacterId,
  SurvivorsCharacterRecord,
  SurvivorsStageSettings,
} from "./types";

type CharacterSelectScreenProps = {
  characters: SurvivorsCharacterConfig[];
  selectedId: SurvivorsCharacterId;
  hoveredId: SurvivorsCharacterId | null;
  onHover: (id: SurvivorsCharacterId | null) => void;
  onSelect: (id: SurvivorsCharacterId) => void;
  recordByCharacter: Partial<Record<SurvivorsCharacterId, SurvivorsCharacterRecord>>;
  settings: SurvivorsStageSettings;
  onSettingsChange: (next: SurvivorsStageSettings) => void;
  onStart: () => void;
  startDisabled: boolean;
  startLabel: string;
  roleLabel: string;
};

export default function CharacterSelectScreen({
  characters,
  selectedId,
  hoveredId,
  onHover,
  onSelect,
  recordByCharacter,
  settings,
  onSettingsChange,
  onStart,
  startDisabled,
  startLabel,
  roleLabel,
}: CharacterSelectScreenProps) {
  const selected = characters.find((character) => character.id === selectedId) || characters[0];
  const hovered = characters.find((character) => character.id === hoveredId) || selected;

  return (
    <div className="mt-2 rounded-xl border border-cyan-200/30 bg-[radial-gradient(circle_at_22%_0%,rgba(56,189,248,0.16),rgba(2,6,23,0.9)_64%)] p-2.5">
      <div className={styles.mainGrid}>
        <div className={styles.leftColumn}>
          <CharacterPreview character={hovered} roleLabel={roleLabel} />
        </div>
        <div className={styles.middleColumn}>
          <CharacterRecord record={recordByCharacter[hovered.id]} />
        </div>
        <div className={styles.rightColumn}>
          <StageSettings
            settings={settings}
            onChange={onSettingsChange}
            onStart={onStart}
            startDisabled={startDisabled}
            startLabel={startLabel}
          />
        </div>
      </div>
      <CharacterGrid
        characters={characters}
        selectedId={selectedId}
        disabled={false}
        onSelect={onSelect}
        onHover={onHover}
      />
    </div>
  );
}
