import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import GameLog from "./GameLog";
import GameResult from "./GameResult";
import MahjongTable from "./MahjongTable";
import MahjongActionPanel from "./MahjongActionPanel";
import RoundResult from "./RoundResult";
import styles from "./mahjong.module.css";
import type {
  MahjongActionButton,
  MahjongDiscardAnimationView,
  MahjongCenterInfoView,
  MahjongLogEvent,
  MahjongPlayerView,
  MahjongResultView,
  MahjongTileInstanceView,
} from "./types";

type MahjongGameProps = {
  title: string;
  message: string;
  gameStarted: boolean;
  playerCount: 3 | 4;
  selfPlayer: MahjongPlayerView;
  topPlayer: MahjongPlayerView;
  leftPlayer: MahjongPlayerView | null;
  rightPlayer: MahjongPlayerView | null;
  selfConcealedHand: MahjongTileInstanceView[];
  selfDrawnTile: MahjongTileInstanceView | null;
  selfSelectedTileId: string | null;
  riichiTileIndex: number | null;
  latestDiscardSeat: "top" | "right" | "bottom" | "left" | null;
  latestDiscardTargetable?: boolean;
  discardAnimation?: MahjongDiscardAnimationView | null;
  centerInfo: MahjongCenterInfoView;
  actionButtons: MahjongActionButton[];
  actionDeadlineAt?: number | null;
  selfSelectableTileIds?: string[] | null;
  enableActionSound?: boolean;
  roundResult: MahjongResultView | null;
  gameResultSummary: string[];
  gameResultOpen: boolean;
  logEvents: MahjongLogEvent[];
  isLogOpen: boolean;
  onLogToggle: () => void;
  ruleControls?: ReactNode;
  ruleSummaryLines?: string[];
  isDevelopmentMode?: boolean;
  topActions: Array<{ key: string; label: string; onClick: () => void; emphasis?: "primary" | "default" }>;
  onSelfTileClick: (payload: { tileId: string; source: "concealed" | "drawn" }) => void;
  onCloseRoundResult: () => void;
  onCloseGameResult: () => void;
};

export default function MahjongGame({
  title,
  message,
  gameStarted,
  playerCount,
  selfPlayer,
  topPlayer,
  leftPlayer,
  rightPlayer,
  selfConcealedHand,
  selfDrawnTile,
  selfSelectedTileId,
  riichiTileIndex,
  latestDiscardSeat,
  latestDiscardTargetable = false,
  discardAnimation = null,
  centerInfo,
  actionButtons,
  actionDeadlineAt = null,
  selfSelectableTileIds = null,
  enableActionSound = false,
  roundResult,
  gameResultSummary,
  gameResultOpen,
  logEvents,
  isLogOpen,
  onLogToggle,
  ruleControls,
  ruleSummaryLines = [],
  isDevelopmentMode = false,
  topActions,
  onSelfTileClick,
  onCloseRoundResult,
  onCloseGameResult,
}: MahjongGameProps) {
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [lastActionSoundKey, setLastActionSoundKey] = useState("");

  const gamePhase: "setup" | "playing" | "finished" = !gameStarted
    ? "setup"
    : (roundResult || gameResultOpen ? "finished" : "playing");

  const startAction = useMemo(() => topActions.find((action) => action.key === "start") || null, [topActions]);
  const resetAction = useMemo(() => topActions.find((action) => action.key === "reset") || null, [topActions]);
  const backAction = useMemo(() => topActions.find((action) => action.key === "menu") || null, [topActions]);
  const hintAction = useMemo(() => topActions.find((action) => action.key === "hint") || null, [topActions]);
  const actionByKey = (key: string) => actionButtons.find((action) => action.key === key) || null;

  useEffect(() => {
    if (gamePhase === "setup") {
      setIsQuickMenuOpen(false);
    }
  }, [gamePhase]);

  useEffect(() => {
    if (gamePhase === "setup") return;
    setToastVisible(true);
    const timerId = window.setTimeout(() => {
      setToastVisible(false);
    }, 2600);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [gamePhase, message]);

  const canShowDebugReset = isDevelopmentMode && Boolean(resetAction);
  const handActionKeys = new Set(["ron", "tsumo", "riichi", "kan", "pon", "chi", "kita", "kyuushu", "pass", "cancel"]);
  const handActionButtons = actionButtons.filter((action) => handActionKeys.has(action.key));

  useEffect(() => {
    if (!enableActionSound) return;
    if (gamePhase !== "playing") return;
    if (handActionButtons.length <= 0) return;

    const key = handActionButtons.map((action) => action.key).join("|");
    if (!key || key === lastActionSoundKey) return;

    setLastActionSoundKey(key);
    try {
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = "triangle";
      oscillator.frequency.value = 880;
      gain.gain.value = 0.0001;

      oscillator.connect(gain);
      gain.connect(context.destination);

      const now = context.currentTime;
      gain.gain.exponentialRampToValueAtTime(0.05, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
      oscillator.start(now);
      oscillator.stop(now + 0.14);

      const cleanupTimer = window.setTimeout(() => {
        void context.close();
        window.clearTimeout(cleanupTimer);
      }, 260);
    } catch {
      // Ignore sound errors on restricted browsers and continue rendering actions.
    }
  }, [enableActionSound, gamePhase, handActionButtons, lastActionSoundKey]);

  return (
    <section className={`${styles.shell} ${gamePhase !== "setup" ? styles.shellPlaying : ""}`.trim()}>
      {gamePhase === "setup" ? (
        <>
          <div className={styles.headerRow}>
            <h2 className="text-xl font-semibold">{title}</h2>
            <div className={styles.headerActions}>
              {startAction ? (
                <button
                  type="button"
                  onClick={startAction.onClick}
                  className="rounded-md bg-cyan-400 px-3 py-1 text-sm font-semibold text-slate-950"
                >
                  {startAction.label}
                </button>
              ) : null}
              {resetAction ? (
                <button
                  type="button"
                  onClick={resetAction.onClick}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {resetAction.label}
                </button>
              ) : null}
              {backAction ? (
                <button
                  type="button"
                  onClick={backAction.onClick}
                  className="rounded-md border border-cyan-200/40 px-3 py-1 text-sm"
                >
                  {backAction.label}
                </button>
              ) : null}
            </div>
          </div>

          <p className="text-xs text-amber-200">ゲーム開始ボタンを押して開始してください。</p>
          <div className={styles.messageBar}>{message}</div>
          {ruleControls ? <div className={styles.ruleStubPanel}>{ruleControls}</div> : null}
        </>
      ) : (
        <div className={styles.compactHeaderRow}>
          <p className={styles.compactHeaderTitle}>{title}</p>
          <div className={styles.compactHeaderActions}>
            <button
              type="button"
              onClick={() => setIsQuickMenuOpen((prev) => !prev)}
              className={styles.compactMenuButton}
            >
              ︙
            </button>
            {isQuickMenuOpen ? (
              <div className={styles.compactMenuPanel}>
                <p className={styles.compactMenuTitle}>設定メニュー</p>
                {ruleSummaryLines.length > 0 ? (
                  <div className={styles.ruleSummaryBlock}>
                    <p className={styles.ruleSummaryTitle}>ルール確認（読取専用）</p>
                    {ruleSummaryLines.map((line) => (
                      <p key={line} className={styles.ruleSummaryLine}>{line}</p>
                    ))}
                  </div>
                ) : null}

                {actionByKey("effects") ? (
                  <button type="button" className={styles.compactMenuItem} onClick={actionByKey("effects")?.onClick}>
                    演出設定
                  </button>
                ) : null}
                <button type="button" className={styles.compactMenuItem} onClick={onLogToggle}>
                  {isLogOpen ? "ログを閉じる" : "ログを開く"}
                </button>
                {hintAction ? (
                  <button type="button" className={styles.compactMenuItem} onClick={hintAction.onClick}>
                    ヒント
                  </button>
                ) : null}
                {gamePhase === "finished" && startAction ? (
                  <button type="button" className={styles.compactMenuItem} onClick={startAction.onClick}>
                    再戦
                  </button>
                ) : null}
                {canShowDebugReset ? (
                  <button type="button" className={styles.compactMenuItemWarn} onClick={resetAction?.onClick}>
                    配牌し直し（開発用）
                  </button>
                ) : null}
                {backAction ? (
                  <button type="button" className={styles.compactMenuItemWarn} onClick={backAction.onClick}>
                    対局を退出
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      )}

      <div className={`${styles.tableLayout} ${gamePhase !== "setup" ? styles.tableLayoutPlaying : ""}`.trim()}>
        {toastVisible ? <div className={styles.messageToast}>{message}</div> : null}
        <MahjongTable
          playerCount={playerCount}
          selfPlayer={selfPlayer}
          topPlayer={topPlayer}
          leftPlayer={leftPlayer}
          rightPlayer={rightPlayer}
          selfConcealedHand={selfConcealedHand}
          selfDrawnTile={selfDrawnTile}
          selfSelectedTileId={selfSelectedTileId}
          selfActionPanel={gamePhase === "playing" ? <MahjongActionPanel actions={handActionButtons} actionDeadlineAt={actionDeadlineAt} /> : null}
          selfSelectableTileIds={selfSelectableTileIds}
          riichiTileIndex={riichiTileIndex}
          latestDiscardSeat={latestDiscardSeat}
          latestDiscardTargetable={latestDiscardTargetable}
          discardAnimation={discardAnimation}
          centerInfo={centerInfo}
          onSelfTileClick={onSelfTileClick}
        />
      </div>

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
