import type { GameState, Selection } from '../types/game';
import type { GameAction } from './actions';
import { createInitialState } from '../logic/deal';
import {
  canPlaceOnFoundation,
  canPlaceOnTableau,
  findFoundationForCard,
  getSelectedCards,
  removeSelection,
} from '../logic/moves';
import { isWon } from '../logic/win';

export const initialState: GameState = createInitialState();

function startPlaying(state: GameState): GameState {
  return state.status === 'idle' ? { ...state, status: 'playing' } : state;
}

function withWinCheck(state: GameState): GameState {
  return isWon(state) ? { ...state, status: 'won' } : state;
}

function doMoveToFoundation(state: GameState, sel: Selection, pileIndex: number): GameState | null {
  const cards = getSelectedCards(state, sel);
  if (cards.length !== 1) return null;
  if (!canPlaceOnFoundation(cards[0], state.foundations[pileIndex])) return null;

  const afterRemove = removeSelection(state, sel);
  return withWinCheck({
    ...afterRemove,
    foundations: afterRemove.foundations.map((f, i) =>
      i === pileIndex ? [...f, { ...cards[0], faceUp: true }] : f,
    ),
    selection: null,
    moves: afterRemove.moves + 1,
  });
}

function doMoveToTableau(state: GameState, sel: Selection, column: number): GameState | null {
  const cards = getSelectedCards(state, sel);
  const col = state.tableau[column];
  if (!canPlaceOnTableau(cards, col)) return null;

  const afterRemove = removeSelection(state, sel);
  const faceUpCards = cards.map((c) => ({ ...c, faceUp: true }));
  return withWinCheck({
    ...afterRemove,
    tableau: afterRemove.tableau.map((c, i) => (i === column ? [...c, ...faceUpCards] : c)),
    selection: null,
    moves: afterRemove.moves + 1,
  });
}

function handleClickStock(state: GameState): GameState {
  const playing = startPlaying(state);

  if (playing.stock.length === 0) {
    if (playing.waste.length === 0) return playing;
    // Flip waste back to stock: waste bottom becomes stock top
    return {
      ...playing,
      stock: [...playing.waste].reverse().map((c) => ({ ...c, faceUp: false })),
      waste: [],
      selection: null,
      moves: playing.moves + 1,
    };
  }

  const drawN = Math.min(playing.drawCount, playing.stock.length);
  // stock[last] is top; drawn cards go to waste in same order (waste[last] = new top)
  const drawn = playing.stock.slice(-drawN).map((c) => ({ ...c, faceUp: true }));
  return {
    ...playing,
    stock: playing.stock.slice(0, -drawN),
    waste: [...playing.waste, ...drawn],
    selection: null,
    moves: playing.moves + 1,
  };
}

function handleClickWaste(state: GameState): GameState {
  if (state.waste.length === 0) return state;

  // Clicking waste top when already selected from waste: deselect
  if (state.selection?.from === 'waste') {
    return { ...state, selection: null };
  }

  const playing = startPlaying(state);
  return {
    ...playing,
    selection: { from: 'waste', cardIndex: playing.waste.length - 1 },
  };
}

function handleClickTableau(state: GameState, column: number, cardIndex: number): GameState {
  if (state.status === 'won') return state;

  const col = state.tableau[column];

  // Clicking empty area (below all cards or empty column)
  if (cardIndex >= col.length) {
    if (!state.selection) return state;
    const result = doMoveToTableau(startPlaying(state), state.selection, column);
    return result ?? { ...state, selection: null };
  }

  const card = col[cardIndex];

  // Face-down card: only the top card can be flipped
  if (!card.faceUp) {
    if (cardIndex !== col.length - 1) return state;
    const playing = startPlaying(state);
    return {
      ...playing,
      selection: null,
      tableau: playing.tableau.map((c, i) =>
        i === column ? [...c.slice(0, -1), { ...card, faceUp: true }] : c,
      ),
      moves: playing.moves + 1,
    };
  }

  // Face-up card with selection from a different source: try to move there
  if (
    state.selection &&
    (state.selection.from !== 'tableau' || state.selection.column !== column)
  ) {
    const result = doMoveToTableau(startPlaying(state), state.selection, column);
    if (result) return result;
    // Move invalid: change selection to clicked card
    return { ...startPlaying(state), selection: { from: 'tableau', column, cardIndex } };
  }

  // Face-up card, same column as selection or no selection: set/update selection
  return { ...startPlaying(state), selection: { from: 'tableau', column, cardIndex } };
}

function handleClickFoundation(state: GameState, pileIndex: number): GameState {
  if (state.status === 'won') return state;

  if (state.selection) {
    const result = doMoveToFoundation(startPlaying(state), state.selection, pileIndex);
    if (result) return result;
    // Move invalid: clear selection
    return { ...state, selection: null };
  }

  // No selection: select the top card of this foundation pile (to move back to tableau)
  const pile = state.foundations[pileIndex];
  if (pile.length === 0) return state;
  const playing = startPlaying(state);
  return {
    ...playing,
    selection: { from: 'foundation', pileIndex, cardIndex: pile.length - 1 },
  };
}

function handleAutoMove(state: GameState, source: Selection): GameState {
  if (state.status === 'won') return state;
  const cards = getSelectedCards(state, source);
  if (cards.length !== 1) return state;
  const playing = startPlaying(state);
  const pileIndex = findFoundationForCard(cards[0], playing.foundations);
  if (pileIndex === -1) return state;
  return doMoveToFoundation(playing, source, pileIndex) ?? state;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'NEW_GAME':
      return createInitialState(state.drawCount);

    case 'SET_DRAW_COUNT':
      return createInitialState(action.count);

    case 'TICK':
      if (state.status !== 'playing') return state;
      return { ...state, elapsedSeconds: state.elapsedSeconds + 1 };

    case 'CLICK_STOCK':
      return handleClickStock(state);

    case 'CLICK_WASTE':
      return handleClickWaste(state);

    case 'CLICK_TABLEAU':
      return handleClickTableau(state, action.column, action.cardIndex);

    case 'CLICK_FOUNDATION':
      return handleClickFoundation(state, action.pileIndex);

    case 'AUTO_MOVE_TO_FOUNDATION':
      return handleAutoMove(state, action.source);

    case '__TEST_LOAD_STATE':
      return action.state;

    default:
      return state;
  }
}
