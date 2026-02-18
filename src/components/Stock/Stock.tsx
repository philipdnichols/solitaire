import { memo } from 'react';
import type { GameAction } from '../../state/actions';
import styles from './Stock.module.css';

interface StockProps {
  count: number;
  dispatch: React.Dispatch<GameAction>;
}

function StockComponent({ count, dispatch }: StockProps) {
  const handleClick = () => dispatch({ type: 'CLICK_STOCK' });

  return (
    <div
      className={`${styles.stock} ${count === 0 ? styles.empty : ''}`}
      onClick={handleClick}
      role="button"
      aria-label={count === 0 ? 'Reset stock' : `Stock pile, ${count} cards`}
    >
      {count === 0 ? (
        <span className={styles.resetIcon} aria-hidden>
          ↺
        </span>
      ) : (
        <>
          <div className={styles.cardBack} />
          {count > 1 && <div className={`${styles.cardBack} ${styles.shadow1}`} />}
          {count > 2 && <div className={`${styles.cardBack} ${styles.shadow2}`} />}
          <span className={styles.count}>{count}</span>
        </>
      )}
    </div>
  );
}

export const Stock = memo(StockComponent);
