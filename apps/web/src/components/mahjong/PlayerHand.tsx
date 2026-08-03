import styles from "./mahjong.module.css";
import MahjongTile from "./MahjongTile";
import type { MahjongTileInstanceView } from "./types";

type PlayerHandProps = {
  concealedHand: MahjongTileInstanceView[];
  drawnTile: MahjongTileInstanceView | null;
  selectedTileId: string | null;
  disabled?: boolean;
  selectableTileIds?: string[] | null;
  discardAnimatingTileId?: string | null;
  discardAnimatingTsumogiri?: boolean;
  onTileClick: (payload: { tileId: string; source: "concealed" | "drawn" }) => void;
};

export default function PlayerHand({
  concealedHand,
  drawnTile,
  selectedTileId,
  disabled,
  selectableTileIds,
  discardAnimatingTileId = null,
  discardAnimatingTsumogiri = false,
  onTileClick,
}: PlayerHandProps) {
  const selectableSet = selectableTileIds ? new Set(selectableTileIds) : null;

  return (
    <div className={styles.handSelf}>
      <div className={styles.normalTiles}>
        {concealedHand.map((tile, index) => (
          <MahjongTile
            key={tile.instanceId}
            tile={tile.tile}
            orientation="bottom"
            selected={selectedTileId === tile.instanceId}
            className={[
              selectableSet ? (selectableSet.has(tile.instanceId) ? styles.tileSelectable : styles.tileDimmed) : "",
              discardAnimatingTileId === tile.instanceId ? styles.tileDiscardLaunching : "",
            ].filter(Boolean).join(" ")}
            onClick={() => onTileClick({ tileId: tile.instanceId, source: "concealed" })}
            disabled={disabled || (selectableSet ? !selectableSet.has(tile.instanceId) : false)}
          />
        ))}
      </div>

      {drawnTile !== null ? (
        <div className={styles.drawnTile}>
          <MahjongTile
            key={drawnTile.instanceId}
            tile={drawnTile.tile}
            orientation="bottom"
            selected={selectedTileId === drawnTile.instanceId}
            tsumo
            className={[
              selectableSet ? (selectableSet.has(drawnTile.instanceId) ? styles.tileSelectable : styles.tileDimmed) : "",
              discardAnimatingTileId === drawnTile.instanceId
                ? (discardAnimatingTsumogiri ? styles.tileDiscardLaunchingTsumo : styles.tileDiscardLaunching)
                : "",
            ].filter(Boolean).join(" ")}
            onClick={() => onTileClick({ tileId: drawnTile.instanceId, source: "drawn" })}
            disabled={disabled || (selectableSet ? !selectableSet.has(drawnTile.instanceId) : false)}
          />
        </div>
      ) : null}
    </div>
  );
}
