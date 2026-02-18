import { memo, useCallback } from 'react';
import type { Card } from '../../types/game';
import type { GameAction } from '../../state/actions';
import { CardView } from '../CardView/CardView';
import { RANK_LABELS } from '../../types/game';
import styles from './Foundation.module.css';

interface FoundationProps {
  pileIndex: number;
  cards: ReadonlyArray<Card>;
  isSelected: boolean;
  dispatch: React.Dispatch<GameAction>;
}

function FoundationComponent({ pileIndex, cards, isSelected, dispatch }: FoundationProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.detail === 2 && cards.length > 0) {
        // Double-click on foundation top: try auto-move (usually not useful, but allowed)
        dispatch({
          type: 'AUTO_MOVE_TO_FOUNDATION',
          source: { from: 'foundation', pileIndex, cardIndex: cards.length - 1 },
        });
      } else {
        dispatch({ type: 'CLICK_FOUNDATION', pileIndex });
      }
    },
    [pileIndex, cards.length, dispatch],
  );

  const top = cards.length > 0 ? cards[cards.length - 1] : null;

  if (!top) {
    return (
      <div
        className={styles.empty}
        onClick={handleClick}
        role="button"
        aria-label={`Foundation pile ${pileIndex + 1}, empty`}
      >
        <span className={styles.placeholder}>A</span>
      </div>
    );
  }

  return (
    <div className={styles.foundation}>
      <CardView
        suit={top.suit}
        rank={top.rank}
        faceUp
        selected={isSelected}
        onClick={handleClick}
        ariaLabel={`Foundation: ${RANK_LABELS[top.rank]} of ${top.suit}`}
      />
      {cards.length > 1 && (
        <span className={styles.count} aria-hidden>
          {cards.length}
        </span>
      )}
    </div>
  );
}

export const Foundation = memo(FoundationComponent);
