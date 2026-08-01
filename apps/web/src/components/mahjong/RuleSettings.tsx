import styles from "./mahjong.module.css";
import type { MahjongRuleCategory, MahjongRulePreset } from "./types";

type RuleSettingsProps = {
  open: boolean;
  preset: MahjongRulePreset;
  onPresetChange: (preset: MahjongRulePreset) => void;
  categories: MahjongRuleCategory[];
};

const PRESET_LABEL: Record<MahjongRulePreset, string> = {
  beginner: "初心者向け",
  standard: "一般的なルール",
  competition: "競技ルール",
  casual: "カジュアル",
  custom: "カスタム",
};

export default function RuleSettings({ open, preset, onPresetChange, categories }: RuleSettingsProps) {
  if (!open) return null;

  return (
    <section className={styles.rulePanel}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">ルール設定</h3>
        <label className="flex items-center gap-2 text-xs">
          <span>プリセット</span>
          <select
            value={preset}
            onChange={(event) => onPresetChange((event.target.value as MahjongRulePreset) || "standard")}
            className="rounded-md border border-emerald-200/40 bg-emerald-950/70 px-2 py-1 text-xs"
          >
            {Object.entries(PRESET_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.ruleCategories}>
        {categories.map((category) => (
          <article key={category.id} className={styles.ruleCard}>
            <h4 className="text-xs font-semibold tracking-wide text-emerald-50">{category.title}</h4>
            <p className="mt-0.5 text-[11px] text-emerald-100/80">{category.description}</p>
            {category.fields.map((field) => (
              <div key={field.id} className={styles.ruleField}>
                <p className="text-xs font-semibold text-emerald-100">{field.label}: {field.value}</p>
                <p className="text-[11px] text-emerald-100/80">{field.help}</p>
              </div>
            ))}
          </article>
        ))}
      </div>
    </section>
  );
}
