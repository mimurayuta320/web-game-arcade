"use client";

import type { HudSnapshot } from "../types/game";

type Props = {
  hud: HudSnapshot;
  depthLabel: string;
};

function digClassName(remaining: number): string {
  if (remaining <= 0) return "dlHudValue dlBlink dlDanger";
  if (remaining <= 5) return "dlHudValue dlDanger";
  if (remaining <= 10) return "dlHudValue dlAlert";
  if (remaining <= 30) return "dlHudValue dlWarn";
  return "dlHudValue dlSafe";
}

export function GameHUD({ hud, depthLabel }: Props) {
  const coreText = hud.corePlaced ? `${hud.coreHp} / ${hud.coreMaxHp}` : "未配置";

  return (
    <section className="dlHud" data-ui-panel="true" aria-live="polite">
      {hud.phase === "preparation" ? (
        <div className="dlHudItem">
          <span className="dlHudKey">⏱ 配置まで</span>
          <span className="dlHudValue">残り{hud.nextWaveInSec}秒</span>
        </div>
      ) : null}
      {hud.phase === "allyPlacement" ? (
        <div className="dlHudItem">
          <span className="dlHudKey">📍 配置選択</span>
          <span className="dlHudValue">配置場所を選んでください</span>
        </div>
      ) : null}
      {hud.phase === "placementConfirmation" ? (
        <div className="dlHudItem">
          <span className="dlHudKey">⚠ 配置確認</span>
          <span className="dlHudValue">OKで襲撃開始準備</span>
        </div>
      ) : null}
      {hud.phase === "countdown" && hud.waveCountdownSec > 0 ? (
        <div className="dlHudItem">
          <span className="dlHudKey">⏱ 襲撃開始まで</span>
          <span className="dlHudValue">{hud.waveCountdownSec}</span>
        </div>
      ) : null}
      <div className="dlHudItem dlHudItemStrong">
        <span className="dlHudKey">⛏ 掘削</span>
        <span className={digClassName(hud.remainingDigCount)}>{`${hud.remainingDigCount} / ${hud.maxDigCount}`}</span>
      </div>
      <div className="dlHudItem dlHudItemStrong">
        <span className="dlHudKey">👾 味方</span>
        <span className="dlHudValue">{hud.currentMonsterCount}体</span>
      </div>
      <div className="dlHudItem">
        <span className="dlHudKey">⚔ 敵</span>
        <span className="dlHudValue">{hud.enemyCount}</span>
      </div>
      <div className="dlHudItem">
        <span className="dlHudKey">🌊 Wave</span>
        <span className="dlHudValue">
          {hud.wave} / {hud.maxWave}
        </span>
      </div>
      <div className="dlHudItem">
        <span className="dlHudKey">💎 魔界核</span>
        <span className="dlHudValue">{coreText}</span>
      </div>
      <div className="dlHudItem">
        <span className="dlHudKey">🧭 深度</span>
        <span className="dlHudValue">{depthLabel}</span>
      </div>
      {hud.phase === "wave" ? (
        <div className="dlHudItem">
          <span className="dlHudKey">⏱ 次の襲撃</span>
          <span className="dlHudValue">{hud.nextWaveInSec}秒</span>
        </div>
      ) : null}
    </section>
  );
}
