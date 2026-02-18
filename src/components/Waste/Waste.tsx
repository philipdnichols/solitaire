import { memo, useCallback } from 'react';
import type { Card } from '../../types/game';
import type { GameAction } from '../../state/actions';
import { CardView } from '../CardView/CardView';
import { RANK_LABELS } from '../../types/game';
import styles from './Waste.module.css';

interface WasteProps {
  waste: ReadonlyArray<Card>;
  drawCount: 1 | 3;
  isSelected: boolean;
  dispatch: React.Dispatch<GameAction>;
}

function WasteComponent({ waste, drawCount, isSelected, dispatch }: WasteProps) {
  // In draw-3 mode show up to 3 fanned cards; draw-1 shows just the top
  const visibleCount = drawCount === 3 ? Math.min(3, waste.length) : Math.min(1, waste.length);
  const visibleCards = waste.slice(waste.length - visibleCount);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (waste.length === 0) return;
      if (e.detail === 2) {
        dispatch({
          type: 'AUTO_MOVE_TO_FOUNDATION',
          source: { from: 'waste', cardIndex: waste.length - 1 },
        });
      } else {
        dispatch({ type: 'CLICK_WASTE' });
      }
    },
    [waste.length, dispatch],
  );

  if (waste.length === 0) {
    return <div className={styles.empty} aria-label="Empty waste pile" />;
  }

  const fanOffset = drawCount === 3 ? 20 : 0;
  const containerWidth =
    drawCount === 3
      ? `calc(var(--card-width) + ${fanOffset * (visibleCount - 1)}px)`
      : 'var(--card-width)';

  return (
    <div className={styles.waste} style={{ width: containerWidth }}>
      {visibleCards.map((card, i) => {
        const isTop = i === visibleCards.length - 1;
        const left = i * fanOffset;
        return (
          <CardView
            key={`${card.suit}-${card.rank}`}
            suit={card.suit}
            rank={card.rank}
            faceUp
            selected={isTop && isSelected}
            onClick={isTop ? handleClick : undefined}
            style={{ left }}
            ariaLabel={`${RANK_LABELS[card.rank]} of ${card.suit}${isTop ? '' : ' (waste)'}`}
          />
        );
      })}
    </div>
  );
}

export const Waste = memo(WasteComponent);
