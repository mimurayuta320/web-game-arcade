"use client";

type Props = {
  gameSpeed: 1 | 2 | 3;
  paused: boolean;
  disabled?: boolean;
  onSetGameSpeed: (speed: 1 | 2 | 3) => void;
  onTogglePause: () => void;
};

export function WavePanel({ gameSpeed, paused, disabled = false, onSetGameSpeed, onTogglePause }: Props) {
  return (
    <section className="dlPanel" data-ui-panel="true">
      <h3 className="dlPanelTitle">進行</h3>
      <div className="dlSpeedRow">
        {[1, 2, 3].map((speed) => (
          <button
            key={speed}
            type="button"
            className={`dlBtnSmall ${gameSpeed === speed ? "dlBtnActive" : ""}`}
            disabled={disabled}
            onClick={() => onSetGameSpeed(speed as 1 | 2 | 3)}
          >
            x{speed}
          </button>
        ))}
        <button type="button" className="dlBtnSmall" disabled={disabled} onClick={onTogglePause}>
          {paused ? "再開" : "一時停止"}
        </button>
      </div>
    </section>
  );
}
