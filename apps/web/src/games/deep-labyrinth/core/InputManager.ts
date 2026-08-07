type Point = { x: number; y: number };

export class InputManager {
  private pinchDistance = 0;

  shouldIgnoreByUi(target: EventTarget | null): boolean {
    const node = target as HTMLElement | null;
    return Boolean(node?.closest("[data-ui-panel='true']"));
  }

  getTouchCenter(touches: TouchList): Point {
    if (touches.length === 0) return { x: 0, y: 0 };
    if (touches.length === 1) return { x: touches[0].clientX, y: touches[0].clientY };
    const a = touches[0];
    const b = touches[1];
    return { x: (a.clientX + b.clientX) * 0.5, y: (a.clientY + b.clientY) * 0.5 };
  }

  updatePinchScale(touches: TouchList): number | null {
    if (touches.length < 2) {
      this.pinchDistance = 0;
      return null;
    }
    const a = touches[0];
    const b = touches[1];
    const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    if (this.pinchDistance === 0) {
      this.pinchDistance = dist;
      return null;
    }
    const ratio = dist / this.pinchDistance;
    this.pinchDistance = dist;
    return ratio;
  }
}
