import type { SurvivorsCharacterRecord } from "./types";

type CharacterRecordProps = {
  record?: SurvivorsCharacterRecord;
};

export default function CharacterRecord({ record }: CharacterRecordProps) {
  const hasRecord = Boolean(record) && ((record?.playCount || 0) > 0 || (record?.bestWave || 0) > 0 || (record?.winCount || 0) > 0);

  return (
    <section className="flex h-full min-h-[246px] flex-col rounded-xl border border-slate-300/25 bg-slate-950/72 p-2.5">
      <p className="text-[11px] font-semibold tracking-wide text-cyan-100">プレイ記録</p>
      {!hasRecord ? <p className="m-auto text-xs text-slate-300">記録なし</p> : null}
      {hasRecord ? (
        <div className="my-auto space-y-2 text-center text-xs">
          <p className="rounded-md border border-slate-300/20 bg-slate-900/60 px-2 py-1 text-slate-100">🌊 最高到達ウェーブ: {record?.bestWave ?? "-"}</p>
          <p className="rounded-md border border-slate-300/20 bg-slate-900/60 px-2 py-1 text-slate-100">🏁 最高クリア難易度: {record?.bestDifficulty ?? "-"}</p>
          <p className="rounded-md border border-slate-300/20 bg-slate-900/60 px-2 py-1 text-slate-100">🎮 使用回数: {record?.playCount ?? 0}</p>
          <p className="rounded-md border border-slate-300/20 bg-slate-900/60 px-2 py-1 text-slate-100">🏆 勝利回数: {record?.winCount ?? 0}</p>
        </div>
      ) : null}
    </section>
  );
}
