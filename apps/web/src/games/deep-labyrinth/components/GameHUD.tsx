"use client";

import { memo, useEffect, useMemo, useState } from "react";
import type { GamePhase } from "../types/game";

type GameHUDProps = {
  allyCount: number;
  remainingDigCount: number;
  maxDigCount: number;
  currentWave: number;
  maxWave: number;
  enemyCount: number;
  playerHp: number | null;
  playerMaxHp: number | null;
  playerDepthLayer: string | null;
  gamePhase: GamePhase;
};

const HUD_COMPACT_STORAGE_KEY = "deep-labyrinth-hud-compact-v1";

const GAME_PHASE_LABELS: Record<GamePhase, string> = {
  initialPreparation: "初期準備",
  playerPlacement: "初期配置",
  placementConfirmation: "配置確認",
  countdown: "開始待機",
  wave: "戦闘中",
  waveComplete: "ウェーブクリア",
  betweenWavePreparation: "再配置準備",
  playerReposition: "再配置",
  repositionConfirmation: "再配置確認",
  paused: "一時停止",
  gameOver: "ゲームオーバー",
  victory: "ゲームクリア",
};

function digValueClassName(remaining: number): string {
  if (remaining <= 0) return "hudValue hudDanger hudBlink";
  if (remaining <= 20) return "hudValue hudDanger";
  if (remaining <= 50) return "hudValue hudAlert";
  if (remaining <= 100) return "hudValue hudWarn";
  return "hudValue hudSafe";
}

function statusCardClassName(phase: GamePhase): string {
  if (phase === "initialPreparation") return "hudStatusCard statusInitialPreparation";
  if (phase === "playerPlacement" || phase === "playerReposition") return "hudStatusCard statusPlacement";
  if (phase === "placementConfirmation" || phase === "repositionConfirmation") return "hudStatusCard statusConfirm";
  if (phase === "countdown") return "hudStatusCard statusCountdown";
  if (phase === "wave") return "hudStatusCard statusWave";
  if (phase === "waveComplete") return "hudStatusCard statusWaveComplete";
  if (phase === "betweenWavePreparation") return "hudStatusCard statusRepositionPrep";
  if (phase === "paused") return "hudStatusCard statusPaused";
  if (phase === "gameOver") return "hudStatusCard statusGameOver";
  return "hudStatusCard statusVictory";
}

export const GameHUD = memo(function GameHUD({
  allyCount,
  remainingDigCount,
  maxDigCount,
  currentWave,
  maxWave,
  enemyCount,
  playerHp,
  playerMaxHp,
  playerDepthLayer,
  gamePhase,
}: GameHUDProps) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(HUD_COMPACT_STORAGE_KEY);
    setCompact(raw === "1");
  }, []);

  const playerText = playerHp == null || playerMaxHp == null ? "未配置" : `${playerHp} / ${playerMaxHp}`;
  const locationText = playerDepthLayer ?? "未配置";
  const phaseText = GAME_PHASE_LABELS[gamePhase];

  const compactText = useMemo(
    () => `👾 ${allyCount}　⛏ ${remainingDigCount}/${maxDigCount}　🌊 ${currentWave}/${maxWave}　⚔ ${enemyCount}　💜 ${playerText}`,
    [allyCount, currentWave, enemyCount, maxDigCount, maxWave, playerText, remainingDigCount],
  );

  const toggleCompact = () => {
    const next = !compact;
    setCompact(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(HUD_COMPACT_STORAGE_KEY, next ? "1" : "0");
    }
  };

  return (
    <section className="gameHudRoot" data-ui-panel="true" aria-live="polite">
      <div className="gameHudTopRow">
        <button type="button" className="hudToggleBtn" onClick={toggleCompact}>
          {compact ? "HUDを展開" : "HUDを縮小"}
        </button>
      </div>

      {compact ? (
        <div className="gameHudCompact">{compactText}</div>
      ) : (
        <div className="gameHud">
          <div className="hudCard hudCardImportant">
            <span className="hudKey">👾 味方</span>
            <span className="hudValue">{allyCount}体</span>
          </div>
          <div className="hudCard hudCardImportant">
            <span className="hudKey">⛏ 掘削</span>
            <span className={digValueClassName(remainingDigCount)}>{`${remainingDigCount} / ${maxDigCount}`}</span>
          </div>
          <div className="hudCard">
            <span className="hudKey">🌊 Wave</span>
            <span className="hudValue">{currentWave} / {maxWave}</span>
          </div>
          <div className="hudCard">
            <span className="hudKey">⚔ 敵</span>
            <span className="hudValue">{enemyCount}体</span>
          </div>
          <div className="hudCard">
            <span className="hudKey">💜 プレイヤー</span>
            <span className="hudValue">{playerText}</span>
          </div>
          <div className="hudCard">
            <span className="hudKey">📍 現在地</span>
            <span className="hudValue hudWrap">{locationText}</span>
          </div>
          <div className={`hudCard ${statusCardClassName(gamePhase)}`}>
            <span className="hudKey">🧭 状態</span>
            <span className="hudValue hudWrap">{phaseText}</span>
          </div>
        </div>
      )}
    </section>
  );
});
