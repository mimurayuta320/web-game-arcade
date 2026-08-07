"use client";

type Props = {
  visible: boolean;
  onResume: () => void;
};

export function PauseMenu({ visible, onResume }: Props) {
  if (!visible) return null;
  return (
    <div className="dlOverlay" data-ui-panel="true">
      <div className="dlOverlayCard">
        <h3>一時停止中</h3>
        <button className="dlBtn" onClick={onResume} type="button">
          再開
        </button>
      </div>
    </div>
  );
}
