import { memo } from 'react';
import type { Rank, Suit } from '../../types/game';
import { RANK_LABELS, SUIT_SYMBOLS } from '../../types/game';
import styles from './CardView.module.css';

interface CardViewProps {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
  selected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

function CardViewComponent({
  suit,
  rank,
  faceUp,
  selected,
  onClick,
  style,
  ariaLabel,
}: CardViewProps) {
  const isRed = suit === 'hearts' || suit === 'diamonds';
  const classNames = [styles.card];
  if (faceUp) {
    classNames.push(styles.faceUp);
    classNames.push(isRed ? styles.red : styles.black);
  } else {
    classNames.push(styles.faceDown);
  }
  if (selected) classNames.push(styles.selected);

  if (!faceUp) {
    return (
      <div
        className={classNames.join(' ')}
        style={style}
        onClick={onClick}
        aria-label={ariaLabel ?? 'Face-down card'}
      >
        <div className={styles.backPattern} />
      </div>
    );
  }

  const rankLabel = RANK_LABELS[rank];
  const suitSymbol = SUIT_SYMBOLS[suit];

  return (
    <div
      className={classNames.join(' ')}
      style={style}
      onClick={onClick}
      aria-label={ariaLabel ?? `${rankLabel} of ${suit}`}
    >
      <div className={styles.cornerTop}>
        <span className={styles.rankLabel}>{rankLabel}</span>
        <span className={styles.suitSmall}>{suitSymbol}</span>
      </div>
      <div className={styles.centerSuit}>{suitSymbol}</div>
      <div className={styles.cornerBottom}>
        <span className={styles.rankLabel}>{rankLabel}</span>
        <span className={styles.suitSmall}>{suitSymbol}</span>
      </div>
    </div>
  );
}

export const CardView = memo(CardViewComponent);
