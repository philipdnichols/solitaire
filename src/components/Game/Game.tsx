import type { GameState } from '../../types/game';
import type { GameAction } from '../../state/actions';
import { Header } from '../Header/Header';
import { Stock } from '../Stock/Stock';
import { Waste } from '../Waste/Waste';
import { Foundation } from '../Foundation/Foundation';
import { TableauColumn } from '../TableauColumn/TableauColumn';
import styles from './Game.module.css';

interface GameProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export function Game({ state, dispatch }: GameProps) {
  const {
    stock,
    waste,
    foundations,
    tableau,
    selection,
    status,
    moves,
    elapsedSeconds,
    drawCount,
  } = state;

  const isWasteSelected = selection?.from === 'waste';

  return (
    <div className={styles.game}>
      <Header
        moves={moves}
        elapsedSeconds={elapsedSeconds}
        status={status}
        drawCount={drawCount}
        dispatch={dispatch}
      />

      <div className={styles.topRow}>
        <Stock count={stock.length} dispatch={dispatch} />
        <Waste
          waste={waste}
          drawCount={drawCount}
          isSelected={isWasteSelected}
          dispatch={dispatch}
        />
        <div className={styles.spacer} />
        {foundations.map((pile, i) => (
          <Foundation
            key={i}
            pileIndex={i}
            cards={pile}
            isSelected={selection?.from === 'foundation' && selection.pileIndex === i}
            dispatch={dispatch}
          />
        ))}
      </div>

      <div className={styles.tableau}>
        {tableau.map((col, i) => (
          <TableauColumn key={i} column={i} cards={col} selection={selection} dispatch={dispatch} />
        ))}
      </div>
    </div>
  );
}
