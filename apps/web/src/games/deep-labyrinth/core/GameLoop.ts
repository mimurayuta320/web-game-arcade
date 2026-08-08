import { PERFORMANCE_CONFIG } from "../data/balance";
import { deepLabPerfMonitor, isDeepLabPerfEnabled } from "./performance";

export type TickHandler = (deltaSec: number) => void;

export class GameLoop {
  private intervalId: number | null = null;
  private running = false;
  private onTick: TickHandler | null = null;
  private visibilityHandlerAttached = false;
  private visibilityHandler: (() => void) | null = null;
  private fixedStepMs = 1000 / PERFORMANCE_CONFIG.logicUpdatesPerSecond;

  constructor() {
    this.attachVisibilityHandler();
  }

  setLowPowerMode(enabled: boolean): void {
    const hz = enabled
      ? PERFORMANCE_CONFIG.logicUpdatesPerSecondLowPower
      : PERFORMANCE_CONFIG.logicUpdatesPerSecond;
    this.fixedStepMs = 1000 / hz;
  }

  private attachVisibilityHandler(): void {
    if (this.visibilityHandlerAttached || typeof document === "undefined") return;
    this.visibilityHandler = () => {
      if (document.visibilityState === "hidden") {
        // Hidden tabs should not keep advancing simulation.
        return;
      }
    };
    document.addEventListener("visibilitychange", this.visibilityHandler);
    this.visibilityHandlerAttached = true;
  }

  dispose(): void {
    this.stop();
    if (this.visibilityHandlerAttached && this.visibilityHandler && typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
    }
    this.visibilityHandlerAttached = false;
    this.visibilityHandler = null;
  }

  start(onTick: TickHandler): void {
    if (this.running) return;
    this.onTick = onTick;
    this.running = true;

    if (isDeepLabPerfEnabled()) {
      deepLabPerfMonitor().registerTimerStart("logicTick");
    }

    this.intervalId = window.setInterval(() => {
      if (!this.running) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      this.onTick?.(this.fixedStepMs / 1000);
    }, this.fixedStepMs);
  }

  stop(): void {
    this.running = false;
    this.onTick = null;
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (isDeepLabPerfEnabled()) {
      deepLabPerfMonitor().registerTimerStop("logicTick");
    }
  }
}
