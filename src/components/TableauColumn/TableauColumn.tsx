import { memo, useCallback, useMemo } from 'react';
import type { Card, Selection } from '../../types/game';
import type { GameAction } from '../../state/actions';
import { CardView } from '../CardView/CardView';
import { RANK_LABELS } from '../../types/game';
import styles from './TableauColumn.module.css';

const FACE_DOWN_OFFSET = 18;
const FACE_UP_OFFSET = 28;
const CARD_HEIGHT = 112; // matches --card-height

interface TableauColumnProps {
  column: number;
  cards: ReadonlyArray<Card>;
  selection: Selection | null;
  dispatch: React.Dispatch<GameAction>;
}

function getCardTop(cards: ReadonlyArray<Card>, index: number): number {
  let top = 0;
  for (let i = 0; i < index; i++) {
    top += cards[i].faceUp ? FACE_UP_OFFSET : FACE_DOWN_OFFSET;
  }
  return top;
}

function TableauColumnComponent({ column, cards, selection, dispatch }: TableauColumnProps) {
  const isCardSelected = useCallback(
    (cardIndex: number): boolean =>
      selection !== null &&
      selection.from === 'tableau' &&
      selection.column === column &&
      cardIndex >= selection.cardIndex,
    [selection, column],
  );

  const handleCardClick = useCallback(
    (cardIndex: number, e: React.MouseEvent) => {
      if (e.detail === 2 && cards[cardIndex]?.faceUp) {
        dispatch({
          type: 'AUTO_MOVE_TO_FOUNDATION',
          source: { from: 'tableau', column, cardIndex },
        });
      } else {
        dispatch({ type: 'CLICK_TABLEAU', column, cardIndex });
      }
    },
    [column, cards, dispatch],
  );

  // Clicking directly on the column div (not on a child card) = click empty area
  const handleColumnClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        dispatch({ type: 'CLICK_TABLEAU', column, cardIndex: cards.length });
      }
    },
    [column, cards.length, dispatch],
  );

  const columnHeight = useMemo(() => {
    if (cards.length === 0) return CARD_HEIGHT;
    return getCardTop(cards, cards.length - 1) + CARD_HEIGHT;
  }, [cards]);

  return (
    <div
      className={styles.column}
      style={{ height: columnHeight }}
      onClick={handleColumnClick}
      aria-label={`Tableau column ${column + 1}`}
    >
      {cards.length === 0 ? (
        <div
          className={styles.emptySlot}
          onClick={handleColumnClick}
          role="button"
          aria-label={`Empty column ${column + 1}`}
        />
      ) : (
        cards.map((card, i) => (
          <CardView
            key={`${card.suit}-${card.rank}`}
            suit={card.suit}
            rank={card.rank}
            faceUp={card.faceUp}
            selected={isCardSelected(i)}
            onClick={(e) => handleCardClick(i, e)}
            style={{
              top: getCardTop(cards, i),
              zIndex: isCardSelected(i) ? cards.length + 10 : i + 1,
            }}
            ariaLabel={card.faceUp ? `${RANK_LABELS[card.rank]} of ${card.suit}` : 'Face-down card'}
          />
        ))
      )}
    </div>
  );
}

export const TableauColumn = memo(TableauColumnComponent);
