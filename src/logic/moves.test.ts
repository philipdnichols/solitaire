import { describe, it, expect } from 'vitest';
import {
  canPlaceOnFoundation,
  canPlaceOnTableau,
  isRed,
  getSelectedCards,
  removeSelection,
  findFoundationForCard,
} from './moves';
import type { Card, GameState } from '../types/game';
import { createInitialState } from './deal';

function card(suit: Card['suit'], rank: Card['rank'], faceUp = true): Card {
  return { suit, rank, faceUp };
}

describe('isRed', () => {
  it('hearts and diamonds are red', () => {
    expect(isRed('hearts')).toBe(true);
    expect(isRed('diamonds')).toBe(true);
  });

  it('spades and clubs are black', () => {
    expect(isRed('spades')).toBe(false);
    expect(isRed('clubs')).toBe(false);
  });
});

describe('canPlaceOnFoundation', () => {
  it('accepts ace on empty foundation', () => {
    expect(canPlaceOnFoundation(card('hearts', 1), [])).toBe(true);
  });

  it('rejects non-ace on empty foundation', () => {
    expect(canPlaceOnFoundation(card('hearts', 2), [])).toBe(false);
    expect(canPlaceOnFoundation(card('hearts', 13), [])).toBe(false);
  });

  it('accepts same-suit next rank', () => {
    const foundation = [card('hearts', 1), card('hearts', 2)];
    expect(canPlaceOnFoundation(card('hearts', 3), foundation)).toBe(true);
  });

  it('rejects wrong suit', () => {
    const foundation = [card('hearts', 1)];
    expect(canPlaceOnFoundation(card('spades', 2), foundation)).toBe(false);
  });

  it('rejects wrong rank', () => {
    const foundation = [card('hearts', 1)];
    expect(canPlaceOnFoundation(card('hearts', 3), foundation)).toBe(false);
  });
});

describe('getSelectedCards', () => {
  function makeState(overrides: Partial<GameState> = {}): GameState {
    return { ...createInitialState(), ...overrides };
  }

  it('returns waste top card', () => {
    const state = makeState({ waste: [card('spades', 1), card('hearts', 2)] });
    const cards = getSelectedCards(state, { from: 'waste', cardIndex: 1 });
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({ suit: 'hearts', rank: 2 });
  });

  it('returns tableau slice from cardIndex', () => {
    const col = [card('spades', 10), card('hearts', 9), card('diamonds', 8)];
    const state = makeState({ tableau: [col, [], [], [], [], [], []] });
    const cards = getSelectedCards(state, { from: 'tableau', column: 0, cardIndex: 1 });
    expect(cards).toHaveLength(2);
    expect(cards[0]).toMatchObject({ rank: 9 });
  });

  it('returns foundation top card', () => {
    const pile = [card('spades', 1), card('spades', 2)];
    const state = makeState({ foundations: [pile, [], [], []] });
    const cards = getSelectedCards(state, { from: 'foundation', pileIndex: 0, cardIndex: 1 });
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({ suit: 'spades', rank: 2 });
  });
});

describe('removeSelection', () => {
  function makeState(overrides: Partial<GameState> = {}): GameState {
    return { ...createInitialState(), ...overrides };
  }

  it('removes waste top card', () => {
    const state = makeState({ waste: [card('spades', 1), card('hearts', 2)] });
    const next = removeSelection(state, { from: 'waste', cardIndex: 1 });
    expect(next.waste).toHaveLength(1);
  });

  it('removes foundation top card', () => {
    const pile = [card('spades', 1), card('spades', 2)];
    const state = makeState({ foundations: [pile, [], [], []] });
    const next = removeSelection(state, { from: 'foundation', pileIndex: 0, cardIndex: 1 });
    expect(next.foundations[0]).toHaveLength(1);
  });

  it('removes tableau cards from cardIndex onwards and flips new top', () => {
    const col = [card('spades', 5, false), card('hearts', 9)];
    const state = makeState({ tableau: [col, [], [], [], [], [], []] });
    const next = removeSelection(state, { from: 'tableau', column: 0, cardIndex: 1 });
    expect(next.tableau[0]).toHaveLength(1);
    expect(next.tableau[0][0].faceUp).toBe(true); // was face-down, flipped
  });
});

describe('findFoundationForCard', () => {
  it('finds empty pile for ace', () => {
    const idx = findFoundationForCard(card('hearts', 1), [[], [], [], []]);
    expect(idx).toBe(0);
  });

  it('finds correct pile for next rank', () => {
    const foundations = [[card('hearts', 1)], [], [], []];
    const idx = findFoundationForCard(card('hearts', 2), foundations);
    expect(idx).toBe(0);
  });

  it('returns -1 when no valid pile', () => {
    const idx = findFoundationForCard(card('hearts', 5), [[], [], [], []]);
    expect(idx).toBe(-1);
  });
});

describe('canPlaceOnTableau', () => {
  it('accepts king on empty column', () => {
    expect(canPlaceOnTableau([card('spades', 13)], [])).toBe(true);
  });

  it('rejects non-king on empty column', () => {
    expect(canPlaceOnTableau([card('spades', 12)], [])).toBe(false);
  });

  it('accepts alternating color and descending rank', () => {
    const col = [card('spades', 10)]; // black 10
    expect(canPlaceOnTableau([card('hearts', 9)], col)).toBe(true); // red 9
    expect(canPlaceOnTableau([card('diamonds', 9)], col)).toBe(true); // red 9
  });

  it('rejects same color', () => {
    const col = [card('spades', 10)]; // black 10
    expect(canPlaceOnTableau([card('clubs', 9)], col)).toBe(false); // black 9
  });

  it('rejects wrong rank', () => {
    const col = [card('spades', 10)];
    expect(canPlaceOnTableau([card('hearts', 8)], col)).toBe(false);
    expect(canPlaceOnTableau([card('hearts', 10)], col)).toBe(false);
  });

  it('rejects placing on face-down card', () => {
    const col = [card('spades', 10, false)];
    expect(canPlaceOnTableau([card('hearts', 9)], col)).toBe(false);
  });

  it('rejects empty cards array', () => {
    expect(canPlaceOnTableau([], [])).toBe(false);
    expect(canPlaceOnTableau([], [card('spades', 10)])).toBe(false);
  });
});
