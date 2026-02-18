import { memo } from 'react';
import type { DrawCount } from '../../types/game';
import type { GameAction } from '../../state/actions';
import styles from './Header.module.css';

interface HeaderProps {
  moves: number;
  elapsedSeconds: number;
  status: 'idle' | 'playing' | 'won';
  drawCount: DrawCount;
  dispatch: React.Dispatch<GameAction>;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function HeaderComponent({ moves, elapsedSeconds, status, drawCount, dispatch }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.title}>Solitaire</h1>
        <div className={styles.drawToggle}>
          <button
            className={`${styles.drawBtn} ${drawCount === 1 ? styles.active : ''}`}
            onClick={() => dispatch({ type: 'SET_DRAW_COUNT', count: 1 })}
            aria-pressed={drawCount === 1}
          >
            Draw 1
          </button>
          <button
            className={`${styles.drawBtn} ${drawCount === 3 ? styles.active : ''}`}
            onClick={() => dispatch({ type: 'SET_DRAW_COUNT', count: 3 })}
            aria-pressed={drawCount === 3}
          >
            Draw 3
          </button>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Moves</span>
          <span className={styles.statValue}>{moves}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Time</span>
          <span className={styles.statValue}>{formatTime(elapsedSeconds)}</span>
        </div>
      </div>

      <div className={styles.right}>
        {status === 'won' && <span className={styles.wonBadge}>You won!</span>}
        <button
          className={styles.newGameBtn}
          onClick={() => dispatch({ type: 'NEW_GAME' })}
          aria-label="New game"
        >
          New Game
        </button>
      </div>
    </header>
  );
}

export const Header = memo(HeaderComponent);
