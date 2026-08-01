type GameResultProps = {
  open: boolean;
  summaryLines: string[];
  onClose: () => void;
};

export default function GameResult({ open, summaryLines, onClose }: GameResultProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-xl border border-emerald-300/35 bg-emerald-950/95 p-4 text-emerald-50">
        <h3 className="text-lg font-semibold">ゲーム結果</h3>
        <div className="mt-2 grid gap-1 text-sm">
          {summaryLines.map((line, index) => (
            <p key={`game-result-${index}`}>{line}</p>
          ))}
        </div>
        <div className="mt-3 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-md border border-emerald-200/50 px-3 py-1 text-sm">閉じる</button>
        </div>
      </div>
    </div>
  );
}
