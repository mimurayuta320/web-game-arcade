type SceneCounts = {
  allies: number;
  enemies: number;
  projectiles: number;
  effects: number;
};

type CanvasInfo = {
  cssWidth: number;
  cssHeight: number;
  internalWidth: number;
  internalHeight: number;
  devicePixelRatio: number;
  renderPixelRatio: number;
};

type LongTaskInfo = {
  durationMs: number;
  name: string;
};

export type DeepLabPerformanceSnapshot = {
  fps: number;
  minFps: number;
  avgFrameMs: number;
  maxFrameMs: number;
  allies: number;
  enemies: number;
  projectiles: number;
  effects: number;
  pathfindingPerSec: number;
  detectionPerSec: number;
  pathfindingTotal: number;
  detectionTotal: number;
  engineInstances: number;
  runningLoops: number;
  runningLoopLabels: string;
  activeTimers: number;
  canvasInternal: string;
  canvasCss: string;
  devicePixelRatio: number;
  renderPixelRatio: number;
  hudUpdatesPerSec: number;
  hudUpdatesTotal: number;
  longTaskCount: number;
  longTaskTop: string;
  lowPowerMode: boolean;
};

type RollingCounter = {
  currentSecondStartMs: number;
  currentCount: number;
  lastSecondCount: number;
};

function createRollingCounter(): RollingCounter {
  return {
    currentSecondStartMs: Date.now(),
    currentCount: 0,
    lastSecondCount: 0,
  };
}

function bumpRollingCounter(counter: RollingCounter): void {
  const now = Date.now();
  if (now - counter.currentSecondStartMs >= 1000) {
    counter.lastSecondCount = counter.currentCount;
    counter.currentCount = 0;
    counter.currentSecondStartMs = now;
  }
  counter.currentCount += 1;
}

function refreshRollingCounter(counter: RollingCounter): void {
  const now = Date.now();
  if (now - counter.currentSecondStartMs >= 1000) {
    counter.lastSecondCount = counter.currentCount;
    counter.currentCount = 0;
    counter.currentSecondStartMs = now;
  }
}

function resetRollingCounter(counter: RollingCounter): void {
  counter.currentSecondStartMs = Date.now();
  counter.currentCount = 0;
  counter.lastSecondCount = 0;
}

class DeepLabPerformanceMonitor {
  private frameTimesMs: number[] = [];
  private frameSecondStartMs = Date.now();
  private framesThisSecond = 0;
  private lastSecondFps = 0;
  private minFpsRolling = 60;

  private readonly pathfindingCounter = createRollingCounter();
  private readonly detectionCounter = createRollingCounter();
  private readonly hudCounter = createRollingCounter();
  private pathfindingTotal = 0;
  private detectionTotal = 0;

  private hudUpdatesTotal = 0;
  private longTaskCount = 0;
  private longTaskTop: LongTaskInfo[] = [];
  private longTaskObserverAttached = false;

  private readonly loopCounters = new Map<string, number>();
  private readonly timerCounters = new Map<string, number>();

  private engineInstances = 0;
  private sceneCounts: SceneCounts = { allies: 0, enemies: 0, projectiles: 0, effects: 0 };
  private canvasInfo: CanvasInfo = {
    cssWidth: 0,
    cssHeight: 0,
    internalWidth: 0,
    internalHeight: 0,
    devicePixelRatio: 1,
    renderPixelRatio: 1,
  };
  private lowPowerMode = false;

  registerEngineCreated(): void {
    this.engineInstances += 1;
  }

  registerEngineDisposed(): void {
    this.engineInstances = Math.max(0, this.engineInstances - 1);
  }

  registerLoopStart(label: string): void {
    this.loopCounters.set(label, (this.loopCounters.get(label) ?? 0) + 1);
  }

  registerLoopStop(label: string): void {
    const next = Math.max(0, (this.loopCounters.get(label) ?? 0) - 1);
    this.loopCounters.set(label, next);
  }

  registerTimerStart(label: string): void {
    this.timerCounters.set(label, (this.timerCounters.get(label) ?? 0) + 1);
  }

  registerTimerStop(label: string): void {
    const next = Math.max(0, (this.timerCounters.get(label) ?? 0) - 1);
    this.timerCounters.set(label, next);
  }

  markPathfindingCall(): void {
    bumpRollingCounter(this.pathfindingCounter);
    this.pathfindingTotal += 1;
  }

  markDetectionCall(): void {
    bumpRollingCounter(this.detectionCounter);
    this.detectionTotal += 1;
  }

  markHudCommit(): void {
    this.hudUpdatesTotal += 1;
    bumpRollingCounter(this.hudCounter);
  }

  recordFrame(frameMs: number): void {
    if (!Number.isFinite(frameMs) || frameMs <= 0) return;

    this.frameTimesMs.push(frameMs);
    if (this.frameTimesMs.length > 180) {
      this.frameTimesMs.shift();
    }

    this.framesThisSecond += 1;
    const now = Date.now();
    if (now - this.frameSecondStartMs >= 1000) {
      this.lastSecondFps = this.framesThisSecond;
      this.minFpsRolling = Math.min(this.minFpsRolling, this.lastSecondFps);
      this.framesThisSecond = 0;
      this.frameSecondStartMs = now;
    }
  }

  updateSceneCounts(counts: SceneCounts): void {
    this.sceneCounts = counts;
  }

  updateCanvasInfo(info: CanvasInfo): void {
    this.canvasInfo = info;
  }

  setLowPowerMode(enabled: boolean): void {
    this.lowPowerMode = enabled;
  }

  resetRuntimeStats(): void {
    this.frameTimesMs = [];
    this.frameSecondStartMs = Date.now();
    this.framesThisSecond = 0;
    this.lastSecondFps = 0;
    this.minFpsRolling = 60;

    resetRollingCounter(this.pathfindingCounter);
    resetRollingCounter(this.detectionCounter);
    resetRollingCounter(this.hudCounter);
    this.pathfindingTotal = 0;
    this.detectionTotal = 0;

    this.hudUpdatesTotal = 0;
    this.longTaskCount = 0;
    this.longTaskTop = [];
  }

  attachLongTaskObserver(): void {
    if (this.longTaskObserverAttached) return;
    if (typeof window === "undefined" || typeof PerformanceObserver === "undefined") return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration < 50) continue;
          this.longTaskCount += 1;
          const name = `${entry.name || "longtask"}`;
          this.longTaskTop.push({ durationMs: Math.round(entry.duration * 10) / 10, name });
          this.longTaskTop.sort((a, b) => b.durationMs - a.durationMs);
          if (this.longTaskTop.length > 5) this.longTaskTop.length = 5;
        }
      });
      observer.observe({ entryTypes: ["longtask"] });
      this.longTaskObserverAttached = true;
    } catch {
      this.longTaskObserverAttached = true;
    }
  }

  snapshot(): DeepLabPerformanceSnapshot {
    refreshRollingCounter(this.pathfindingCounter);
    refreshRollingCounter(this.detectionCounter);
    refreshRollingCounter(this.hudCounter);

    const frameCount = this.frameTimesMs.length;
    const avgFrameMs =
      frameCount > 0
        ? Math.round((this.frameTimesMs.reduce((sum, v) => sum + v, 0) / frameCount) * 100) / 100
        : 0;
    const maxFrameMs =
      frameCount > 0
        ? Math.round(Math.max(...this.frameTimesMs) * 100) / 100
        : 0;

    const runningLoopEntries = Array.from(this.loopCounters.entries()).filter(([, count]) => count > 0);
    const runningLoops = runningLoopEntries.reduce((sum, [, count]) => sum + count, 0);
    const activeTimers = Array.from(this.timerCounters.values()).reduce((sum, v) => sum + v, 0);

    const pathfindingPerSec = this.pathfindingCounter.lastSecondCount;
    const detectionPerSec = this.detectionCounter.lastSecondCount;
    const hudUpdatesPerSec = this.hudCounter.lastSecondCount;

    const longTaskTop = this.longTaskTop
      .slice(0, 3)
      .map((item) => `${item.name}:${item.durationMs}ms`)
      .join(", ");

    return {
      fps: this.lastSecondFps,
      minFps: this.minFpsRolling === 60 ? this.lastSecondFps : this.minFpsRolling,
      avgFrameMs,
      maxFrameMs,
      allies: this.sceneCounts.allies,
      enemies: this.sceneCounts.enemies,
      projectiles: this.sceneCounts.projectiles,
      effects: this.sceneCounts.effects,
      pathfindingPerSec,
      detectionPerSec,
      pathfindingTotal: this.pathfindingTotal,
      detectionTotal: this.detectionTotal,
      engineInstances: this.engineInstances,
      runningLoops,
      runningLoopLabels: runningLoopEntries.map(([name, count]) => `${name}:${count}`).join(" "),
      activeTimers,
      canvasInternal: `${this.canvasInfo.internalWidth}x${this.canvasInfo.internalHeight}`,
      canvasCss: `${this.canvasInfo.cssWidth}x${this.canvasInfo.cssHeight}`,
      devicePixelRatio: this.canvasInfo.devicePixelRatio,
      renderPixelRatio: this.canvasInfo.renderPixelRatio,
      hudUpdatesPerSec,
      hudUpdatesTotal: this.hudUpdatesTotal,
      longTaskCount: this.longTaskCount,
      longTaskTop,
      lowPowerMode: this.lowPowerMode,
    };
  }
}

declare global {
  interface Window {
    __deepLabPerformanceMonitor__?: DeepLabPerformanceMonitor;
  }
}

function getMonitor(): DeepLabPerformanceMonitor {
  if (typeof window === "undefined") {
    return new DeepLabPerformanceMonitor();
  }
  if (!window.__deepLabPerformanceMonitor__) {
    window.__deepLabPerformanceMonitor__ = new DeepLabPerformanceMonitor();
  }
  return window.__deepLabPerformanceMonitor__;
}

export function deepLabPerfMonitor(): DeepLabPerformanceMonitor {
  return getMonitor();
}

export function isDeepLabPerfEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}
