import type { Card, DrawCount, GameState } from '../types/game';
import { createDeck, shuffleDeck } from './deck';

export function createInitialState(drawCount: DrawCount = 1): GameState {
  const deck = shuffleDeck(createDeck());

  // Deal tableau: column i gets i+1 cards, top card face up
  const tableau: Card[][] = [];
  let idx = 0;
  for (let col = 0; col < 7; col++) {
    const column: Card[] = [];
    for (let i = 0; i <= col; i++) {
      column.push({ ...deck[idx++], faceUp: i === col });
    }
    tableau.push(column);
  }

  return {
    stock: deck.slice(idx),
    waste: [],
    foundations: [[], [], [], []],
    tableau,
    selection: null,
    status: 'idle',
    moves: 0,
    elapsedSeconds: 0,
    drawCount,
  };
}
