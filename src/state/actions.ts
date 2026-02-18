import type { DrawCount, GameState, Selection } from '../types/game';

export type GameAction =
  | { type: 'NEW_GAME' }
  | { type: 'SET_DRAW_COUNT'; count: DrawCount }
  | { type: 'CLICK_STOCK' }
  | { type: 'CLICK_WASTE' }
  | { type: 'CLICK_TABLEAU'; column: number; cardIndex: number }
  | { type: 'CLICK_FOUNDATION'; pileIndex: number }
  | { type: 'AUTO_MOVE_TO_FOUNDATION'; source: Selection }
  | { type: 'TICK' }
  // Dev/test only: directly replace the game state (used by Playwright e2e tests)
  | { type: '__TEST_LOAD_STATE'; state: GameState };
