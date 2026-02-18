import { describe, it, expect } from 'vitest';
import { isWon } from './win';
import { createInitialState } from './deal';
import type { Card, GameState } from '../types/game';

function card(suit: Card['suit'], rank: Card['rank']): Card {
  return { suit, rank, faceUp: true };
}

describe('isWon', () => {
  it('returns false for a fresh game', () => {
    expect(isWon(createInitialState())).toBe(false);
  });

  it('returns true when all 4 foundations have 13 cards', () => {
    const pile = Array.from({ length: 13 }, (_, i) => card('spades', (i + 1) as Card['rank']));
    const state: GameState = {
      ...createInitialState(),
      foundations: [pile, pile, pile, pile],
    };
    expect(isWon(state)).toBe(true);
  });

  it('returns false when only some foundations are complete', () => {
    const pile = Array.from({ length: 13 }, (_, i) => card('spades', (i + 1) as Card['rank']));
    const state: GameState = {
      ...createInitialState(),
      foundations: [pile, pile, pile, []],
    };
    expect(isWon(state)).toBe(false);
  });
});
