import type { GameState } from '../types/game';

export function isWon(state: GameState): boolean {
  return state.foundations.every((pile) => pile.length === 13);
}
