import { useEffect, useState } from "react";
import ActionButtons from "./ActionButtons";
import GameLog from "./GameLog";
import GameResult from "./GameResult";
import MahjongTable from "./MahjongTable";
import RoundResult from "./RoundResult";
import RuleSettings from "./RuleSettings";
import styles from "./mahjong.module.css";
import { getMahjongSpriteMeta, MAHJONG_TILE_CODE_LIST } from "./tileSprite";
import type {
  MahjongActionButton,
  MahjongCenterInfoView,
  MahjongLogEvent,
  MahjongPlayerView,
  MahjongResultView,
  MahjongRuleCategory,
  MahjongRulePreset,
} from "./types";

type MahjongGameProps = {
  title: string;
  message: string;
  gameStarted: boolean;
  selfPlayer: MahjongPlayerView;
  topPlayer: MahjongPlayerView;
  leftPlayer: MahjongPlayerView;
  rightPlayer: MahjongPlayerView;
  selfHand: number[];
  selfSelectedIndex: number | null;
  selfTsumoIndex: number | null;
  riichiTileIndex: number | null;
  centerInfo: MahjongCenterInfoView;
  actionButtons: MahjongActionButton[];
  roundResult: MahjongResultView | null;
  gameResultSummary: string[];
  gameResultOpen: boolean;
  logEvents: MahjongLogEvent[];
  isLogOpen: boolean;
  onLogToggle: () => void;
  isRuleSettingsOpen: boolean;
  onRuleSettingsToggle: () => void;
  rulePreset: MahjongRulePreset;
  onRulePresetChange: (preset: MahjongRulePreset) => void;
  ruleCategories: MahjongRuleCategory[];
  topActions: Array<{ key: string; label: string; onClick: () => void; emphasis?: "primary" | "default" }>;
  onSelfTileClick: (index: number) => void;
  onCloseRoundResult: () => void;
  onCloseGameResult: () => void;
};

export default function MahjongGame({
  title,
  message,
  gameStarted,
  selfPlayer,
  topPlayer,
  leftPlayer,
  rightPlayer,
  selfHand,
  selfSelectedIndex,
  selfTsumoIndex,
  riichiTileIndex,
  centerInfo,
  actionButtons,
  roundResult,
  gameResultSummary,
  gameResultOpen,
  logEvents,
  isLogOpen,
  onLogToggle,
  isRuleSettingsOpen,
  onRuleSettingsToggle,
  rulePreset,
  onRulePresetChange,
  ruleCategories,
  topActions,
  onSelfTileClick,
  onCloseRoundResult,
  onCloseGameResult,
}: MahjongGameProps) {
  const [tileDebugEnabled, setTileDebugEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("mahjong-tile-debug") === "1";
  });
  const [tileDebugRows, setTileDebugRows] = useState<string[]>([]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.mahjongTileDebug = tileDebugEnabled ? "1" : "0";
  }, [tileDebugEnabled]);

  useEffect(() => {
    let disposed = false;
    if (!tileDebugEnabled) return () => {
      disposed = true;
    };

    void getMahjongSpriteMeta().then((meta) => {
      if (disposed) return;
      const rows = MAHJONG_TILE_CODE_LIST.map((code) => {
        const rect = meta.tileMap[code];
        return `${code}: x=${rect.x}, y=${rect.y}, w=${rect.width}, h=${rect.height}`;
      });
      setTileDebugRows(rows);
    });

    return () => {
      disposed = true;
    };
  }, [tileDebugEnabled]);

  const onToggleTileDebug = () => {
    if (typeof document === "undefined" || typeof window === "undefined") return;
    const next = !tileDebugEnabled;
    setTileDebugEnabled(next);
    if (!next) {
      setTileDebugRows([]);
    }
    document.documentElement.dataset.mahjongTileDebug = next ? "1" : "0";
    window.localStorage.setItem("mahjong-tile-debug", next ? "1" : "0");
    window.dispatchEvent(new CustomEvent("mahjong-tile-debug-toggle", { detail: { enabled: next } }));
  };

  return (
    <section className={styles.shell}>
      <div className={styles.headerRow}>
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className={styles.headerActions}>
          {topActions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={action.onClick}
              className={action.emphasis === "primary"
                ? "rounded-md bg-cyan-400 px-3 py-1 text-sm font-semibold text-slate-950"
                : "rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
              }
            >
              {action.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onRuleSettingsToggle}
            className="rounded-md border border-emerald-200/40 px-3 py-1 text-sm"
          >
            {isRuleSettingsOpen ? "ルール設定を閉じる" : "ルール設定"}
          </button>
          <button
            type="button"
            onClick={onLogToggle}
            className="rounded-md border border-sky-200/40 px-3 py-1 text-sm"
          >
            {isLogOpen ? "ログを閉じる" : "ログ"}
          </button>
          <button
            type="button"
            onClick={onToggleTileDebug}
            className="rounded-md border border-fuchsia-200/50 px-3 py-1 text-sm"
          >
            {tileDebugEnabled ? "座標デバッグ: ON" : "座標デバッグ: OFF"}
          </button>
        </div>
      </div>

      {!gameStarted ? <p className="text-xs text-amber-200">ゲーム開始ボタンを押して開始してください。</p> : null}
      <div className={styles.messageBar}>{message}</div>

      {tileDebugEnabled ? (
        <div className={styles.tileDebugPanel}>
          <p className="text-xs font-semibold text-fuchsia-100">牌スプライト座標デバッグ</p>
          <div className={styles.tileDebugGrid}>
            {tileDebugRows.map((row) => (
              <p key={row} className="text-[11px] leading-tight text-fuchsia-50/95">{row}</p>
            ))}
          </div>
        </div>
      ) : null}

      <RuleSettings
        open={isRuleSettingsOpen}
        preset={rulePreset}
        onPresetChange={onRulePresetChange}
        categories={ruleCategories}
      />

      <div className={styles.tableLayout}>
        <MahjongTable
          selfPlayer={selfPlayer}
          topPlayer={topPlayer}
          leftPlayer={leftPlayer}
          rightPlayer={rightPlayer}
          selfHand={selfHand}
          selfSelectedIndex={selfSelectedIndex}
          selfTsumoIndex={selfTsumoIndex}
          riichiTileIndex={riichiTileIndex}
          centerInfo={centerInfo}
          onSelfTileClick={onSelfTileClick}
        />
      </div>

      <ActionButtons actions={actionButtons} />

      <GameLog open={isLogOpen} onClose={onLogToggle} events={logEvents} />

      {roundResult ? (
        <RoundResult
          result={roundResult}
          onClose={onCloseRoundResult}
        />
      ) : null}

      <GameResult open={gameResultOpen} summaryLines={gameResultSummary} onClose={onCloseGameResult} />
    </section>
  );
}
