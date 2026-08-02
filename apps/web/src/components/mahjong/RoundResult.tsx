import styles from "./mahjong.module.css";
import MahjongTile from "./MahjongTile";
import type { MahjongResultView } from "./types";

type RoundResultProps = {
  result: MahjongResultView;
  onClose: () => void;
};

export default function RoundResult({ result, onClose }: RoundResultProps) {
  return (
    <div className={styles.resultOverlay} role="dialog" aria-modal="true">
      <div className={styles.resultCard}>
        <h3 className="text-lg font-semibold">和了 / 流局結果</h3>
        <p className="mt-1 text-sm text-emerald-100">和了者: {result.winner} {result.loser ? `/ 放銃: ${result.loser}` : ""}</p>

        <div className="mt-3">
          <p className="text-xs text-emerald-100/80">和了手牌</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {result.handTiles.map((tile, index) => (
              <MahjongTile key={`res-hand-${index}-${tile}`} tile={tile} compact orientation="bottom" />
            ))}
            {result.winTile !== null && result.winTile !== undefined ? (
              <MahjongTile tile={result.winTile} compact orientation="bottom" tsumo />
            ) : null}
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div>
            <p className="text-xs text-emerald-100/80">ドラ</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {result.dora.map((tile, index) => <MahjongTile key={`res-dora-${index}-${tile}`} tile={tile} compact orientation="bottom" className={styles.doraTile} />)}
            </div>
          </div>
          <div>
            <p className="text-xs text-emerald-100/80">裏ドラ</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {result.uraDora.map((tile, index) => <MahjongTile key={`res-ura-${index}-${tile}`} tile={tile} compact orientation="bottom" className={styles.doraTile} />)}
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-md border border-emerald-200/30 bg-emerald-950/45 p-2">
          <p className="text-sm font-semibold">{result.hanText} / {result.fuText}</p>
          <p className="text-sm text-emerald-100">{result.scoreLabel}</p>
          <p className="mt-1 text-xs text-emerald-100/90">{result.yaku.join(" / ")}</p>
          <div className="mt-2 grid gap-1">
            {result.scoreDeltaLines.map((line, index) => (
              <p key={`score-delta-${index}`} className="text-xs text-emerald-50/95">{line}</p>
            ))}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-md border border-emerald-200/50 px-3 py-1 text-sm">
            次の局へ
          </button>
        </div>
      </div>
    </div>
  );
}
