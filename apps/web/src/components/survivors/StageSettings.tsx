import type { SurvivorsDifficulty, SurvivorsStageSettings } from "./types";

type StageSettingsProps = {
  settings: SurvivorsStageSettings;
  onChange: (next: SurvivorsStageSettings) => void;
  onStart: () => void;
  startDisabled: boolean;
  startLabel: string;
};

type ModeRowProps = {
  label: string;
  enabled: boolean;
};

function ModeRow({ label, enabled }: ModeRowProps) {
  return (
    <div className="flex items-center justify-between rounded-md border border-slate-300/20 bg-slate-900/70 px-2 py-1.5">
      <div>
        <p className="text-[11px] text-slate-200">{label}</p>
        <p className="text-[10px] text-slate-400">準備中</p>
      </div>
      <button
        type="button"
        disabled
        aria-label={`${label} toggle`}
        className="relative h-5 w-9 cursor-not-allowed rounded-full border border-slate-500/45 bg-slate-800/85 opacity-70"
      >
        <span className={`absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-slate-300 transition ${enabled ? "right-0.5" : "left-0.5"}`} />
      </button>
    </div>
  );
}

export default function StageSettings({ settings, onChange, onStart, startDisabled, startLabel }: StageSettingsProps) {
  const updateDifficulty = (difficulty: SurvivorsDifficulty) => onChange({ ...settings, difficulty });

  return (
    <section className="flex h-full min-h-[246px] flex-col rounded-xl border border-slate-300/25 bg-slate-950/72 p-2.5">
      <p className="text-[11px] font-semibold tracking-wide text-cyan-100">ステージ設定</p>
      <div className="mt-2 space-y-2 text-xs">
        <label className="block rounded-md border border-slate-300/20 bg-slate-900/70 px-2 py-1.5">
          <span className="mb-1 block text-[11px] text-slate-200">難易度</span>
          <select
            value={settings.difficulty}
            onChange={(event) => updateDifficulty(event.target.value as SurvivorsDifficulty)}
            className="w-full rounded border border-cyan-200/45 bg-slate-950/80 px-2 py-1 text-[11px] text-slate-100"
          >
            <option value="easy">EASY</option>
            <option value="normal">NORMAL</option>
            <option value="hard">HARD</option>
          </select>
        </label>
        <ModeRow label="エンドレスモード" enabled={settings.endlessMode} />
        <ModeRow label="カオスモード" enabled={settings.chaosMode} />
        <ModeRow label="協力プレイ" enabled={settings.coopMode} />
      </div>

      <button
        type="button"
        onClick={onStart}
        disabled={startDisabled}
        className="mt-auto w-full rounded-md bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.35)] disabled:opacity-60"
      >
        {startLabel}
      </button>
    </section>
  );
}
