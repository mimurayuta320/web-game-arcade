export type TickHandler = (deltaSec: number) => void;

export class GameLoop {
  private rafId = 0;
  private running = false;
  private lastTs = 0;

  start(onTick: TickHandler): void {
    if (this.running) return;
    this.running = true;
    this.lastTs = 0;

    const frame = (ts: number) => {
      if (!this.running) return;
      if (this.lastTs === 0) this.lastTs = ts;
      const deltaSec = Math.min(0.05, Math.max(0.001, (ts - this.lastTs) / 1000));
      this.lastTs = ts;
      onTick(deltaSec);
      this.rafId = window.requestAnimationFrame(frame);
    };

    this.rafId = window.requestAnimationFrame(frame);
  }

  stop(): void {
    this.running = false;
    if (this.rafId) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }
}
