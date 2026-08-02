import styles from "./mahjong.module.css";

type OpponentTileBackProps = {
  position: "top" | "left" | "right";
  side?: "left" | "right" | null;
};

export default function OpponentTileBack({ position, side = null }: OpponentTileBackProps) {
  const className = [
    styles.opponentTileBackFlat,
    side === "left" ? styles.opponentTileBackFlatLeft : "",
    side === "right" ? styles.opponentTileBackFlatRight : "",
  ].filter(Boolean).join(" ");

  return <div className={className} aria-label="opponent tile back" data-seat={position} />;
}