"use client";

import styles from "../casino.module.css";
import { SUIT_SYMBOL, isRed, rankLabel, type Card } from "../cards";

type Props = {
  card?: Card;
  faceDown?: boolean;
  held?: boolean;
  onClick?: () => void;
  disabled?: boolean;
};

export function PlayingCard({ card, faceDown = false, held = false, onClick, disabled = false }: Props) {
  const classes = [styles.playingCard];
  if (faceDown || !card) classes.push(styles.playingCardBack);
  else if (isRed(card)) classes.push(styles.playingCardRed);
  if (held) classes.push(styles.cardHeld);
  const face = faceDown || !card ? "" : `${rankLabel(card.rank)}${SUIT_SYMBOL[card.suit]}`;
  const content = faceDown || !card ? (
    <span aria-hidden="true">?</span>
  ) : (
    <>
      <small>{rankLabel(card.rank)}</small>
      <span>{SUIT_SYMBOL[card.suit]}</span>
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        className={classes.join(" ")}
        onClick={onClick}
        disabled={disabled}
        aria-pressed={held}
        aria-label={held ? `${face}（キープ中）` : face}
      >
        {content}
        {held ? <span className={styles.holdTag}>HOLD</span> : null}
      </button>
    );
  }
  return (
    <div className={classes.join(" ")} role="img" aria-label={face || "裏向きのカード"}>
      {content}
    </div>
  );
}
