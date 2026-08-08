"use client";

import { useEffect, useState } from "react";
import { deepLabPerfMonitor, isDeepLabPerfEnabled, type DeepLabPerformanceSnapshot } from "../core/performance";

function emptySnapshot(): DeepLabPerformanceSnapshot {
  return {
    fps: 0,
    minFps: 0,
    avgFrameMs: 0,
    maxFrameMs: 0,
    allies: 0,
    enemies: 0,
    projectiles: 0,
    effects: 0,
    pathfindingPerSec: 0,
    detectionPerSec: 0,
    pathfindingTotal: 0,
    detectionTotal: 0,
    engineInstances: 0,
    runningLoops: 0,
    runningLoopLabels: "",
    activeTimers: 0,
    canvasInternal: "0x0",
    canvasCss: "0x0",
    devicePixelRatio: 1,
    renderPixelRatio: 1,
    hudUpdatesPerSec: 0,
    hudUpdatesTotal: 0,
    longTaskCount: 0,
    longTaskTop: "",
    lowPowerMode: false,
  };
}

export function PerformanceOverlay() {
  const [snapshot, setSnapshot] = useState<DeepLabPerformanceSnapshot>(emptySnapshot);

  useEffect(() => {
    if (!isDeepLabPerfEnabled()) return;

    const monitor = deepLabPerfMonitor();
    monitor.attachLongTaskObserver();

    const id = window.setInterval(() => {
      setSnapshot(monitor.snapshot());
    }, 200);

    return () => {
      window.clearInterval(id);
    };
  }, []);

  if (!isDeepLabPerfEnabled()) return null;

  return (
    <aside className="dlPerfOverlay" data-ui-panel="true" aria-label="performance overlay">
      <p>FPS: {snapshot.fps} (min {snapshot.minFps})</p>
      <p>Frame: avg {snapshot.avgFrameMs}ms / max {snapshot.maxFrameMs}ms</p>
      <p>Alive: ally {snapshot.allies} / enemy {snapshot.enemies}</p>
      <p>Bullets: {snapshot.projectiles} / Effects: {snapshot.effects}</p>
      <p>A*: {snapshot.pathfindingPerSec}/s / Detect: {snapshot.detectionPerSec}/s</p>
      <p>A* total: {snapshot.pathfindingTotal} / Detect total: {snapshot.detectionTotal}</p>
      <p>Engine: {snapshot.engineInstances} / Loops: {snapshot.runningLoops}</p>
      <p>Loop labels: {snapshot.runningLoopLabels || "none"}</p>
      <p>Timers: {snapshot.activeTimers}</p>
      <p>Canvas: css {snapshot.canvasCss} / internal {snapshot.canvasInternal}</p>
      <p>DPR: {snapshot.devicePixelRatio.toFixed(2)} / render {snapshot.renderPixelRatio.toFixed(2)}</p>
      <p>HUD updates: {snapshot.hudUpdatesPerSec}/s (total {snapshot.hudUpdatesTotal})</p>
      <p>Long task (&gt;=50ms): {snapshot.longTaskCount}</p>
      {snapshot.longTaskTop ? <p>Top: {snapshot.longTaskTop}</p> : null}
      <p>Low power mode: {snapshot.lowPowerMode ? "ON" : "OFF"}</p>
    </aside>
  );
}
