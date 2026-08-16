"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./deep-labyrinth.module.css";
import { STAGE_TITLE_DEFAULT } from "@/games/deep-labyrinth/data/stages";
import { GameEngine } from "@/games/deep-labyrinth/core/GameEngine";
import { GameLoop } from "@/games/deep-labyrinth/core/GameLoop";
import type { HudSnapshot, MapCell } from "@/games/deep-labyrinth/types/game";
import { GameHeader } from "@/games/deep-labyrinth/components/GameHeader";
import { GameHUD } from "@/games/deep-labyrinth/components/GameHUD";
import { GameCanvas } from "@/games/deep-labyrinth/components/GameCanvas";
import { MaterialPanel } from "@/games/deep-labyrinth/components/MaterialPanel";
import { MonsterPanel } from "@/games/deep-labyrinth/components/MonsterPanel";
import { BestiaryPanel } from "@/games/deep-labyrinth/components/BestiaryPanel";
import { WavePanel } from "@/games/deep-labyrinth/components/WavePanel";
import { PauseMenu } from "@/games/deep-labyrinth/components/PauseMenu";
import { PlacementConfirmModal } from "@/games/deep-labyrinth/components/PlacementConfirmModal";
import { ResultModal } from "@/games/deep-labyrinth/components/ResultModal";
import { getDepthLayer, DEPTH_LAYER_COLORS } from "@/games/deep-labyrinth/data/balance";
import { deepLabPerfMonitor, isDeepLabPerfEnabled } from "@/games/deep-labyrinth/core/performance";

const INITIAL_HUD: HudSnapshot = {
  phase: "initialPreparation",
  phaseLabel: "初期準備",
  allyCount: 0,
  summonedCount: 0,
  remainingDigCount: 600,
  maxDigCount: 600,
  currentMonsterCount: 0,
  enemyCount: 0,
  wave: 1,
  maxWave: 10,
  playerHp: 0,
  playerMaxHp: 0,
  coreHp: 0,
  coreMaxHp: 0,
  corePlaced: false,
  nextWaveInSec: 60,
  waveCountdownSec: 0,
  paused: false,
  depthLabel: "深度: 浅層（1～8マス）",
};

export default function DeepLabyrinthPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const engineRef = useRef<GameEngine | null>(null);
  const loopRef = useRef<GameLoop | null>(null);
  const gameStartedRef = useRef(false);

  const lastHudRef = useRef<HudSnapshot>(INITIAL_HUD);

  const engine = engineRef.current;
  const loop = loopRef.current;

  const [title, setTitle] = useState(STAGE_TITLE_DEFAULT);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [selectedCell, setSelectedCell] = useState<MapCell | null>(null);
  const [revision, setRevision] = useState(0);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [showBlockInfo, setShowBlockInfo] = useState(false);
  const [showFirstTip, setShowFirstTip] = useState(false);
  const [showExactSpawnRate, setShowExactSpawnRate] = useState(false);
  const [reduceGlowAnimation, setReduceGlowAnimation] = useState(false);
  const [lowPowerMode, setLowPowerMode] = useState(false);

  useEffect(() => {
    gameStartedRef.current = gameStarted;
  }, [gameStarted]);

  const isSameHud = (a: HudSnapshot, b: HudSnapshot): boolean => {
    return (
      a.phase === b.phase &&
      a.allyCount === b.allyCount &&
      a.remainingDigCount === b.remainingDigCount &&
      a.maxDigCount === b.maxDigCount &&
      a.enemyCount === b.enemyCount &&
      a.wave === b.wave &&
      a.maxWave === b.maxWave &&
      a.playerHp === b.playerHp &&
      a.playerMaxHp === b.playerMaxHp &&
      a.corePlaced === b.corePlaced &&
      a.depthLabel === b.depthLabel &&
      a.nextWaveInSec === b.nextWaveInSec &&
      a.waveCountdownSec === b.waveCountdownSec
    );
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (engineRef.current || loopRef.current) return;

    engineRef.current = new GameEngine();
    loopRef.current = new GameLoop();
    setEngineReady(true);

    return () => {
      loopRef.current?.dispose();
      engineRef.current?.dispose();
      loopRef.current = null;
      engineRef.current = null;
      setEngineReady(false);
    };
  }, [mounted]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = "deep-labyrinth-block-info-seen-v1";
    const seen = window.localStorage.getItem(key);
    if (!seen) {
      setShowFirstTip(true);
      setShowBlockInfo(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = "deep-labyrinth-low-power-mode-v1";
    const raw = window.localStorage.getItem(key);
    setLowPowerMode(raw === "1");
  }, []);

  useEffect(() => {
    if (!engine || !loop) return;
    engine.setLowPowerMode(lowPowerMode);
    loop.setLowPowerMode(lowPowerMode);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("deep-labyrinth-low-power-mode-v1", lowPowerMode ? "1" : "0");
    }
  }, [engine, loop, lowPowerMode]);

  useEffect(() => {
    if (!engineReady || !engineRef.current || !loopRef.current) return;

    const activeEngine = engineRef.current;
    const activeLoop = loopRef.current;

    if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
      (window as unknown as { __deepLabEngine?: GameEngine }).__deepLabEngine = activeEngine;
    }

    const unsub = activeEngine.subscribeHud((nextHud) => {
      if (isSameHud(lastHudRef.current, nextHud)) return;
      lastHudRef.current = nextHud;
      setHud(nextHud);
      if (isDeepLabPerfEnabled()) deepLabPerfMonitor().markHudCommit();
    });

    activeLoop.start((dt) => {
      if (!gameStartedRef.current) return;
      activeEngine.tick(dt);
    });

    return () => {
      unsub();
      activeLoop.stop();
      if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
        (window as unknown as { __deepLabEngine?: GameEngine }).__deepLabEngine = undefined;
      }
    };
  }, [engineReady]);

  useEffect(() => {
    if (!engine) return;

    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable='true']")) return;

      if (event.code === "KeyP") {
        event.preventDefault();
        engine.togglePause();
      }
      if (event.key === "1") engine.setGameSpeed(1);
      if (event.key === "2") engine.setGameSpeed(2);
      if (event.key === "3") engine.setGameSpeed(3);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [engine]);

  if (!engine || !loop) {
    return (
      <main className={`${styles.deepLabyrinthRoot} gamePage`}>
        <div className="gamePageInner">
          <section className="dlPanel" data-ui-panel="true">
            <p className="dlMuted">loading...</p>
          </section>
        </div>
      </main>
    );
  }

  const state = engine.getRenderState();
  const bestiaryEntries = engine.getBestiaryEntries();
  const controlLocked = engine.isControlLocked();
  const playerDepthLayer = state.corePosition
    ? DEPTH_LAYER_COLORS[getDepthLayer(state.corePosition.y)].name
    : state.selectedPlacementPosition
      ? DEPTH_LAYER_COLORS[getDepthLayer(state.selectedPlacementPosition.y)].name
      : null;

  return (
    <main className={`${styles.deepLabyrinthRoot} gamePage`}>
      <div className="gamePageInner">
        <GameHeader title={title} onTitleChange={setTitle} />
        <section className="gameScreen">
          <GameHUD
            allyCount={hud.allyCount}
            remainingDigCount={hud.remainingDigCount}
            maxDigCount={hud.maxDigCount}
            currentWave={hud.wave}
            maxWave={hud.maxWave}
            enemyCount={hud.enemyCount}
            playerHp={hud.corePlaced ? hud.playerHp : null}
            playerMaxHp={hud.corePlaced ? hud.playerMaxHp : null}
            playerDepthLayer={playerDepthLayer}
            gamePhase={hud.phase}
          />

          <div className="gameMain">
            <section className="mapSection">
              <div className="mapContainer">
                <GameCanvas
                  engine={engine}
                  onSelectCell={setSelectedCell}
                  allyCount={hud.allyCount}
                  remainingDigCount={hud.remainingDigCount}
                  maxDigCount={hud.maxDigCount}
                  reduceGlowAnimation={reduceGlowAnimation}
                  lowPowerMode={lowPowerMode}
                />
              </div>
            </section>

            <aside className={`sidePanel ${sidePanelOpen ? "isOpen" : "isClosed"}`} data-ui-panel="true">
              <div className="dlTopActions" data-ui-panel="true">
                <button type="button" className="dlBtnSmall" onClick={() => setShowBlockInfo(true)}>
                  ブロック情報
                </button>
                <button type="button" className="dlBtnSmall" onClick={() => setSidePanelOpen((v) => !v)}>
                  {sidePanelOpen ? "パネルを閉じる" : "パネルを開く"}
                </button>
              </div>
            <MaterialPanel state={state} />
            <WavePanel
              gameSpeed={state.gameSpeed}
              paused={state.paused || controlLocked}
              disabled={controlLocked}
              onSetGameSpeed={(speed) => {
                if (controlLocked) return;
                engine.setGameSpeed(speed);
              }}
              onTogglePause={() => {
                if (controlLocked) return;
                engine.togglePause();
              }}
            />
            <MonsterPanel
              state={state}
              disabled={controlLocked}
              onPlaceNest={() => {
                if (controlLocked) return;
                engine.placeNestNearCore();
                setRevision((v) => v + 1);
              }}
              onSpawnMonster={(kind) => {
                if (controlLocked) return;
                engine.spawnMonsterFromFirstNest(kind);
                setRevision((v) => v + 1);
              }}
            />
            <BestiaryPanel entries={bestiaryEntries} />
            <section className="dlPanel" data-ui-panel="true">
              <h3 className="dlPanelTitle">選択情報</h3>
              {selectedCell ? (
                (() => {
                  const detail = engine.inspectCell(selectedCell.row, selectedCell.col);
                  return (
                    <ul className="dlList">
                      <li className="dlListItem"><span>座標</span><strong>{selectedCell.col}, {selectedCell.row}</strong></li>
                      <li className="dlListItem"><span>土の種類</span><strong>{detail?.soilLabel ?? selectedCell.type}</strong></li>
                      <li className="dlListItem"><span>深度</span><strong>{detail?.depthLabel ?? hud.depthLabel}</strong></li>
                      <li className="dlListItem"><span>魔物出現期待度</span><strong>{detail?.spawnTierLabel ?? "通常"}</strong></li>
                      <li className="dlListItem"><span>レア期待度</span><strong>{detail?.rarityExpectationLabel ?? "低い"}</strong></li>
                      <li className="dlListItem"><span>出現候補帯</span><strong>{detail?.candidateRarityBand ?? "common～uncommon"}</strong></li>
                      <li className="dlListItem"><span>出現候補</span><strong>{detail?.spawnCandidates ?? "なし"}</strong></li>
                      <li className="dlListItem"><span>取得素材</span><strong>{detail?.materialLabel ?? "なし"}</strong></li>
                      <li className="dlListItem"><span>掘削可能</span><strong>{detail?.diggable ? "はい" : "いいえ"}</strong></li>
                      {showExactSpawnRate ? (
                        <li className="dlListItem"><span>魔物出現確率</span><strong>{Math.round((detail?.spawnRate ?? 0) * 100)}%</strong></li>
                      ) : null}
                    </ul>
                  );
                })()
              ) : (
                <p className="dlMuted">右クリックまたはタップでマス情報を表示します。</p>
              )}
              {state.phase === "playerPlacement" ? (
                <div className="dlCoreConfirm">
                  <p className="dlWarnText">配置する場所を選択してください。</p>
                  {engine.shouldShowAutoCorePlaceButton() ? (
                    <>
                      <button
                        type="button"
                        className="dlBtnSmall"
                        onClick={() => {
                          engine.resumePreparationForCorePlacement();
                          setRevision((v) => v + 1);
                        }}
                      >
                        自分で配置場所を作る
                      </button>
                      <button
                        type="button"
                        className="dlBtnSmall"
                        onClick={() => {
                          if (engine.autoPlaceCoreAtSafestCell()) setRevision((v) => v + 1);
                        }}
                      >
                        最も安全な場所へ自動配置
                      </button>
                    </>
                  ) : null}
                </div>
              ) : null}
              {state.phase === "betweenWavePreparation" || state.phase === "playerReposition" ? (
                <div className="dlCoreConfirm">
                  {state.phase === "betweenWavePreparation" ? (
                    <p className="dlWarnText">ウェーブ間の再配置準備中です。</p>
                  ) : null}
                  <button
                    type="button"
                    className="dlBtnSmall"
                    onClick={() => {
                      engine.beginPlayerReposition();
                      setRevision((v) => v + 1);
                    }}
                  >
                    再配置場所を選ぶ
                  </button>
                </div>
              ) : null}
              {state.message ? <p className="dlWarnText">{state.message}</p> : null}
              <p className="dlMuted">seed: {state.mapSeed}</p>
              <p className="dlMuted">mapVersion: {state.mapVersion}</p>
              {engine.getToasts().slice(0, 3).map((toast) => (
                <p key={toast.id} className="dlToast">{toast.text}</p>
              ))}
              <p className="dlMuted">rev: {revision}</p>
            </section>

            <section className="dlPanel" data-ui-panel="true">
              <h3 className="dlPanelTitle">操作</h3>
              <div className="dlSpeedRow">
                <button type="button" className="dlBtn" disabled={controlLocked} onClick={() => engine.togglePause()}>
                  {state.paused ? "再開" : "一時停止"}
                </button>
                <button type="button" className="dlBtn" disabled={controlLocked} onClick={() => engine.placeNestNearCore()}>
                  巣を配置
                </button>
                <button
                  type="button"
                  className="dlBtn"
                  disabled={controlLocked}
                  onClick={() => engine.spawnMonsterFromFirstNest("slime")}
                >
                  スライム生成
                </button>
                <button
                  type="button"
                  className={`dlBtnSmall ${engine.isDebugEnabled() ? "dlBtnActive" : ""}`}
                  onClick={() => {
                    engine.toggleDebug();
                    setRevision((v) => v + 1);
                  }}
                >
                  Debug
                </button>
                <button
                  type="button"
                  className="dlBtnGhost"
                  onClick={() => {
                    engine.restart();
                    setGameStarted(false);
                  }}
                >
                  リスタート
                </button>
              </div>
            </section>

            <section className="dlPanel" data-ui-panel="true">
              <h3 className="dlPanelTitle">表示設定</h3>
              <label className="dlSettingRow">
                <input
                  type="checkbox"
                  checked={showExactSpawnRate}
                  onChange={(event) => setShowExactSpawnRate(event.currentTarget.checked)}
                />
                <span>魔物出現確率を数値で表示</span>
              </label>
              <label className="dlSettingRow">
                <input
                  type="checkbox"
                  checked={reduceGlowAnimation}
                  onChange={(event) => setReduceGlowAnimation(event.currentTarget.checked)}
                />
                <span>ブロック発光アニメーションを減らす</span>
              </label>
              <label className="dlSettingRow">
                <input
                  type="checkbox"
                  checked={lowPowerMode}
                  onChange={(event) => setLowPowerMode(event.currentTarget.checked)}
                />
                <span>低負荷モード（30FPS/描画簡略化）</span>
              </label>
            </section>
            </aside>
          </div>

          <div className="gameControls" data-ui-panel="true">
            <div className="dlSpeedRow">
              {!gameStarted ? (
                <button
                  type="button"
                  className="dlBtn"
                  onClick={() => {
                    setGameStarted(true);
                    setRevision((v) => v + 1);
                  }}
                >
                  ゲームスタート
                </button>
              ) : null}
              <button
                type="button"
                className="dlBtnGhost"
                onClick={() => {
                  router.push("/");
                }}
              >
                メニューに戻る
              </button>
              <span className="dlMuted">操作欄: 右パネル</span>
            </div>
          </div>
        </section>

        <PauseMenu visible={state.paused && state.phase === "paused"} onResume={() => engine.setPaused(false)} />
        <PlacementConfirmModal
          isOpen={state.isPlacementConfirmOpen}
          position={state.selectedPlacementPosition}
          isProcessing={engine.isPlacementProcessing()}
          mode={state.phase === "repositionConfirmation" ? "reposition" : "initial"}
          onConfirm={() => {
            engine.confirmCorePlacement();
            setRevision((v) => v + 1);
          }}
          onCancel={() => {
            engine.cancelCorePlacementConfirmation();
            setRevision((v) => v + 1);
          }}
          onStartCurrent={() => {
            engine.startNextWaveFromCurrentPosition();
            setRevision((v) => v + 1);
          }}
        />
        <ResultModal
          visible={state.phase === "gameOver" || state.phase === "victory"}
          state={state}
          onRestart={() => {
            engine.restart();
            setGameStarted(false);
          }}
        />

        {showBlockInfo ? (
          <div className="dlOverlay" data-ui-panel="true">
            <div className="dlOverlayCard">
              <h3>ブロック情報</h3>
              <ul className="dlList">
                <li className="dlListItem"><span>模様なし</span><strong>通常</strong></li>
                <li className="dlListItem"><span>卵型の印1つ</span><strong>魔物が出やすい</strong></li>
                <li className="dlListItem"><span>卵型の印2つ</span><strong>魔物がかなり出やすい</strong></li>
                <li className="dlListItem"><span>青紫の発光</span><strong>魔物発生候補</strong></li>
                <li className="dlListItem"><span>金紫の発光</span><strong>高確率の魔物発生候補</strong></li>
                <li className="dlListItem"><span>小さな星印</span><strong>深層でレア期待度が高い</strong></li>
              </ul>
              {showFirstTip ? (
                <p className="dlWarnText">光っている土からは味方魔物が出現しやすくなっています</p>
              ) : null}
              <button
                className="dlBtn"
                type="button"
                onClick={() => {
                  setShowBlockInfo(false);
                  if (showFirstTip && typeof window !== "undefined") {
                    window.localStorage.setItem("deep-labyrinth-block-info-seen-v1", "1");
                    setShowFirstTip(false);
                  }
                }}
              >
                確認
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
