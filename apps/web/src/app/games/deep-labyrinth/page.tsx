"use client";

import { useEffect, useRef, useState } from "react";
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

const INITIAL_HUD: HudSnapshot = {
  phase: "preparation",
  remainingDigCount: 150,
  maxDigCount: 150,
  currentMonsterCount: 0,
  enemyCount: 0,
  wave: 1,
  maxWave: 10,
  coreHp: 0,
  coreMaxHp: 0,
  corePlaced: false,
  nextWaveInSec: 60,
  waveCountdownSec: 0,
  paused: false,
  depthLabel: "深度: 浅層（0～7マス）",
};

export default function DeepLabyrinthPage() {
  const [mounted, setMounted] = useState(false);
  const engineRef = useRef<GameEngine | null>(null);
  const loopRef = useRef<GameLoop | null>(null);

  if (mounted && !engineRef.current) {
    engineRef.current = new GameEngine();
  }
  if (mounted && !loopRef.current) {
    loopRef.current = new GameLoop();
  }

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

  useEffect(() => {
    setMounted(true);
  }, []);

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
    if (!engine || !loop) return;

    const unsub = engine.subscribeHud((nextHud) => {
      setHud(nextHud);
      setRevision((v) => v + 1);
    });

    loop.start((dt) => {
      engine.tick(dt);
    });

    return () => {
      unsub();
      loop.stop();
    };
  }, [engine, loop]);

  useEffect(() => {
    if (!engine) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.code === "Space") {
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

  return (
    <main className={`${styles.deepLabyrinthRoot} gamePage`}>
      <div className="gamePageInner">
        <GameHeader title={title} onTitleChange={setTitle} />
        <GameHUD hud={hud} depthLabel={hud.depthLabel} />

        <div className="dlTopActions" data-ui-panel="true">
          <button type="button" className="dlBtnSmall" onClick={() => setShowBlockInfo(true)}>
            ブロック情報
          </button>
          <button type="button" className="dlBtnSmall" onClick={() => setSidePanelOpen((v) => !v)}>
            {sidePanelOpen ? "パネルを閉じる" : "パネルを開く"}
          </button>
        </div>

        <section className={`gameLayout ${sidePanelOpen ? "withSidePanel" : "sidePanelCollapsed"}`}>
          <section className="mapSection">
            <div className="mapContainer">
              <GameCanvas
                engine={engine}
                onSelectCell={setSelectedCell}
                showExactSpawnRate={showExactSpawnRate}
                reduceGlowAnimation={reduceGlowAnimation}
              />
            </div>
          </section>

          <aside className={`sidePanel ${sidePanelOpen ? "isOpen" : "isClosed"}`} data-ui-panel="true">
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
              {state.phase === "allyPlacement" ? (
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
                <button type="button" className="dlBtnGhost" onClick={() => engine.restart()}>
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
            </section>
          </aside>
        </section>

        <PauseMenu visible={state.paused && state.phase === "paused"} onResume={() => engine.setPaused(false)} />
        <PlacementConfirmModal
          isOpen={state.isPlacementConfirmOpen}
          position={state.selectedPlacementPosition}
          isProcessing={engine.isPlacementProcessing()}
          onConfirm={() => {
            engine.confirmCorePlacement();
            setRevision((v) => v + 1);
          }}
          onCancel={() => {
            engine.cancelCorePlacementConfirmation();
            setRevision((v) => v + 1);
          }}
        />
        <ResultModal visible={state.phase === "gameOver" || state.phase === "victory"} state={state} onRestart={() => engine.restart()} />

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
