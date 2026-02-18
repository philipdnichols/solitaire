import { describe, it, expect } from 'vitest';
import { createInitialState } from './deal';

describe('createInitialState', () => {
  it('deals 7 tableau columns', () => {
    const state = createInitialState();
    expect(state.tableau).toHaveLength(7);
  });

  it('column i has i+1 cards', () => {
    const { tableau } = createInitialState();
    for (let i = 0; i < 7; i++) {
      expect(tableau[i]).toHaveLength(i + 1);
    }
  });

  it('only the top card of each column is face up', () => {
    const { tableau } = createInitialState();
    for (const col of tableau) {
      for (let i = 0; i < col.length - 1; i++) {
        expect(col[i].faceUp).toBe(false);
      }
      expect(col[col.length - 1].faceUp).toBe(true);
    }
  });

  it('has 52 total cards', () => {
    const state = createInitialState();
    const total =
      state.stock.length +
      state.waste.length +
      state.foundations.reduce((s, f) => s + f.length, 0) +
      state.tableau.reduce((s, col) => s + col.length, 0);
    expect(total).toBe(52);
  });

  it('stock has 52 - 28 = 24 cards', () => {
    expect(createInitialState().stock).toHaveLength(24);
  });

  it('starts with idle status', () => {
    expect(createInitialState().status).toBe('idle');
  });

  it('respects drawCount option', () => {
    expect(createInitialState(3).drawCount).toBe(3);
    expect(createInitialState(1).drawCount).toBe(1);
  });

  it('starts with 4 empty foundations', () => {
    const state = createInitialState();
    expect(state.foundations).toHaveLength(4);
    expect(state.foundations.every((f) => f.length === 0)).toBe(true);
  });
});
