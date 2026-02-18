import { describe, it, expect } from 'vitest';
import { gameReducer, initialState } from './reducer';
import type { GameState, Card } from '../types/game';
import { createInitialState } from '../logic/deal';

function card(suit: Card['suit'], rank: Card['rank'], faceUp = true): Card {
  return { suit, rank, faceUp };
}

// Build a minimal state for easy testing
function makeState(overrides: Partial<GameState> = {}): GameState {
  return { ...createInitialState(), ...overrides };
}

describe('unknown action', () => {
  it('returns state unchanged for unknown action type', () => {
    // @ts-expect-error - testing unknown action
    expect(gameReducer(initialState, { type: 'UNKNOWN' })).toBe(initialState);
  });
});

describe('NEW_GAME', () => {
  it('resets to idle with same draw count', () => {
    const state = makeState({ status: 'playing', moves: 10, drawCount: 3 });
    const next = gameReducer(state, { type: 'NEW_GAME' });
    expect(next.status).toBe('idle');
    expect(next.moves).toBe(0);
    expect(next.drawCount).toBe(3);
  });
});

describe('SET_DRAW_COUNT', () => {
  it('resets game with new draw count', () => {
    const next = gameReducer(initialState, { type: 'SET_DRAW_COUNT', count: 3 });
    expect(next.drawCount).toBe(3);
    expect(next.status).toBe('idle');
  });
});

describe('TICK', () => {
  it('increments elapsedSeconds when playing', () => {
    const state = makeState({ status: 'playing', elapsedSeconds: 5 });
    expect(gameReducer(state, { type: 'TICK' }).elapsedSeconds).toBe(6);
  });

  it('does not tick when idle or won', () => {
    expect(gameReducer(makeState({ status: 'idle' }), { type: 'TICK' }).elapsedSeconds).toBe(0);
    expect(gameReducer(makeState({ status: 'won' }), { type: 'TICK' }).elapsedSeconds).toBe(0);
  });
});

describe('CLICK_STOCK', () => {
  it('draws cards from stock to waste', () => {
    const state = makeState({
      stock: [card('spades', 1, false), card('hearts', 2, false), card('diamonds', 3, false)],
      waste: [],
      status: 'idle',
    });
    const next = gameReducer(state, { type: 'CLICK_STOCK' });
    expect(next.status).toBe('playing');
    expect(next.waste).toHaveLength(1);
    expect(next.stock).toHaveLength(2);
    expect(next.waste[0].faceUp).toBe(true);
    expect(next.moves).toBe(1);
  });

  it('draws 3 in draw-3 mode', () => {
    const state = makeState({
      stock: [
        card('spades', 1, false),
        card('hearts', 2, false),
        card('diamonds', 3, false),
        card('clubs', 4, false),
      ],
      waste: [],
      drawCount: 3,
    });
    const next = gameReducer(state, { type: 'CLICK_STOCK' });
    expect(next.waste).toHaveLength(3);
    expect(next.stock).toHaveLength(1);
  });

  it('resets stock from waste when stock is empty', () => {
    const state = makeState({
      stock: [],
      waste: [card('spades', 1), card('hearts', 2)],
    });
    const next = gameReducer(state, { type: 'CLICK_STOCK' });
    expect(next.stock).toHaveLength(2);
    expect(next.waste).toHaveLength(0);
    expect(next.stock.every((c) => !c.faceUp)).toBe(true);
  });

  it('does nothing when both stock and waste are empty', () => {
    const state = makeState({ stock: [], waste: [], status: 'playing' });
    expect(gameReducer(state, { type: 'CLICK_STOCK' })).toMatchObject({ stock: [], waste: [] });
  });
});

describe('CLICK_WASTE', () => {
  it('selects waste top card', () => {
    const state = makeState({ waste: [card('spades', 1), card('hearts', 2)] });
    const next = gameReducer(state, { type: 'CLICK_WASTE' });
    expect(next.selection).toEqual({ from: 'waste', cardIndex: 1 });
  });

  it('deselects when waste is already selected', () => {
    const state = makeState({
      waste: [card('spades', 1)],
      selection: { from: 'waste', cardIndex: 0 },
    });
    expect(gameReducer(state, { type: 'CLICK_WASTE' }).selection).toBeNull();
  });

  it('does nothing when waste is empty', () => {
    const state = makeState({ waste: [] });
    expect(gameReducer(state, { type: 'CLICK_WASTE' }).selection).toBeNull();
  });
});

describe('CLICK_TABLEAU', () => {
  it('flips a face-down top card', () => {
    const state = makeState({
      tableau: [[card('spades', 5, false)], [], [], [], [], [], []],
      status: 'playing',
    });
    const next = gameReducer(state, { type: 'CLICK_TABLEAU', column: 0, cardIndex: 0 });
    expect(next.tableau[0][0].faceUp).toBe(true);
    expect(next.moves).toBe(1);
  });

  it('selects a face-up card', () => {
    const state = makeState({
      tableau: [[card('spades', 5)], [], [], [], [], [], []],
      status: 'playing',
    });
    const next = gameReducer(state, { type: 'CLICK_TABLEAU', column: 0, cardIndex: 0 });
    expect(next.selection).toEqual({ from: 'tableau', column: 0, cardIndex: 0 });
  });

  it('moves waste card to tableau', () => {
    // Black 8 on red 9
    const state = makeState({
      waste: [card('spades', 8)],
      tableau: [[card('hearts', 9)], [], [], [], [], [], []],
      selection: { from: 'waste', cardIndex: 0 },
      status: 'playing',
    });
    const next = gameReducer(state, { type: 'CLICK_TABLEAU', column: 0, cardIndex: 0 });
    expect(next.waste).toHaveLength(0);
    expect(next.tableau[0]).toHaveLength(2);
    expect(next.tableau[0][1]).toMatchObject({ suit: 'spades', rank: 8 });
    expect(next.selection).toBeNull();
    expect(next.moves).toBe(1);
  });

  it('auto-flips card below after moving tableau stack', () => {
    const state = makeState({
      tableau: [
        [card('hearts', 5, false), card('spades', 10)],
        [card('diamonds', 11)], // col 1: red J
        [],
        [],
        [],
        [],
        [],
      ],
      selection: { from: 'tableau', column: 0, cardIndex: 1 },
      status: 'playing',
    });
    // Move black 10 to red J on column 1
    const next = gameReducer(state, { type: 'CLICK_TABLEAU', column: 1, cardIndex: 0 });
    expect(next.tableau[0][0].faceUp).toBe(true); // was face-down, now flipped
    expect(next.tableau[1]).toHaveLength(2);
  });

  it('ignores face-down non-top card', () => {
    const state = makeState({
      tableau: [[card('spades', 5, false), card('hearts', 3, false)], [], [], [], [], [], []],
      status: 'playing',
    });
    const next = gameReducer(state, { type: 'CLICK_TABLEAU', column: 0, cardIndex: 0 });
    expect(next).toBe(state);
  });

  it('does nothing if won', () => {
    const state = makeState({ status: 'won' });
    expect(gameReducer(state, { type: 'CLICK_TABLEAU', column: 0, cardIndex: 0 })).toBe(state);
  });
});

describe('CLICK_TABLEAU - empty column leaves column empty', () => {
  it('removes the only card from a column and leaves it empty', () => {
    // King of spades is the only card in column 0
    const state = makeState({
      tableau: [
        [card('spades', 13)], // single face-up card
        [card('diamonds', 11)], // red J
        [],
        [],
        [],
        [],
        [],
      ],
      selection: { from: 'tableau', column: 0, cardIndex: 0 },
      status: 'playing',
    });
    // Move king to col 1 (which has red J — invalid: king can't go on J)
    // Try moving to empty col 2 instead
    const next = gameReducer(state, { type: 'CLICK_TABLEAU', column: 2, cardIndex: 1 });
    expect(next.tableau[0]).toHaveLength(0);
    expect(next.tableau[2]).toHaveLength(1);
    expect(next.tableau[2][0]).toMatchObject({ rank: 13 });
  });

  it('invalid move to empty column clears selection', () => {
    // Non-king can't go to empty column
    const state = makeState({
      tableau: [[card('hearts', 7)], [], [], [], [], [], []],
      selection: { from: 'waste', cardIndex: 0 },
      waste: [card('spades', 9)], // not a king, can't go to empty col
      status: 'playing',
    });
    const next = gameReducer(state, { type: 'CLICK_TABLEAU', column: 1, cardIndex: 1 });
    expect(next.selection).toBeNull();
    expect(next.tableau[1]).toHaveLength(0);
  });
});

describe('CLICK_FOUNDATION', () => {
  it('moves selected card to foundation', () => {
    const state = makeState({
      waste: [card('spades', 1)],
      foundations: [[], [], [], []],
      selection: { from: 'waste', cardIndex: 0 },
      status: 'playing',
    });
    const next = gameReducer(state, { type: 'CLICK_FOUNDATION', pileIndex: 0 });
    expect(next.foundations[0]).toHaveLength(1);
    expect(next.foundations[0][0]).toMatchObject({ suit: 'spades', rank: 1 });
    expect(next.waste).toHaveLength(0);
  });

  it('selects foundation top card when no selection', () => {
    const state = makeState({
      foundations: [[card('spades', 1)], [], [], []],
      status: 'playing',
    });
    const next = gameReducer(state, { type: 'CLICK_FOUNDATION', pileIndex: 0 });
    expect(next.selection).toEqual({ from: 'foundation', pileIndex: 0, cardIndex: 0 });
  });

  it('clears selection on invalid move', () => {
    const state = makeState({
      waste: [card('spades', 5)], // can't place 5 on empty foundation
      foundations: [[], [], [], []],
      selection: { from: 'waste', cardIndex: 0 },
      status: 'playing',
    });
    const next = gameReducer(state, { type: 'CLICK_FOUNDATION', pileIndex: 0 });
    expect(next.selection).toBeNull();
    expect(next.foundations[0]).toHaveLength(0);
  });

  it('detects win when all foundations complete', () => {
    // Fill 3 foundations with 13 cards each; add the final card to complete the 4th
    const fullPile = (suit: Card['suit']) =>
      Array.from({ length: 13 }, (_, i) => card(suit, (i + 1) as Card['rank']));

    const state = makeState({
      foundations: [
        fullPile('spades'),
        fullPile('hearts'),
        fullPile('diamonds'),
        fullPile('clubs').slice(0, 12),
      ],
      waste: [card('clubs', 13)],
      selection: { from: 'waste', cardIndex: 0 },
      status: 'playing',
    });
    const next = gameReducer(state, { type: 'CLICK_FOUNDATION', pileIndex: 3 });
    expect(next.status).toBe('won');
  });
});

describe('CLICK_TABLEAU - additional branches', () => {
  it('moves selection to empty column when clicking past end', () => {
    // King to empty column
    const state = makeState({
      waste: [card('spades', 13)],
      tableau: [[], [], [], [], [], [], []],
      selection: { from: 'waste', cardIndex: 0 },
      status: 'playing',
    });
    const next = gameReducer(state, { type: 'CLICK_TABLEAU', column: 0, cardIndex: 0 });
    expect(next.tableau[0]).toHaveLength(1);
    expect(next.tableau[0][0]).toMatchObject({ rank: 13 });
  });

  it('returns same state when clicking empty column with no selection', () => {
    const state = makeState({
      tableau: [[], [], [], [], [], [], []],
      status: 'playing',
    });
    const next = gameReducer(state, { type: 'CLICK_TABLEAU', column: 0, cardIndex: 0 });
    expect(next).toBe(state);
  });

  it('invalid move to tableau changes selection to clicked card', () => {
    // Try to place red 9 on black 5 (invalid) — should change selection
    const state = makeState({
      waste: [card('hearts', 9)],
      tableau: [[card('spades', 5)], [], [], [], [], [], []],
      selection: { from: 'waste', cardIndex: 0 },
      status: 'playing',
    });
    const next = gameReducer(state, { type: 'CLICK_TABLEAU', column: 0, cardIndex: 0 });
    expect(next.selection).toEqual({ from: 'tableau', column: 0, cardIndex: 0 });
    expect(next.waste).toHaveLength(1); // card not moved
  });

  it('moves foundation card back to tableau', () => {
    // King of spades from a full foundation to an empty column
    const state2 = makeState({
      foundations: [
        [
          card('spades', 1),
          card('spades', 2),
          card('spades', 3),
          card('spades', 4),
          card('spades', 5),
          card('spades', 6),
          card('spades', 7),
          card('spades', 8),
          card('spades', 9),
          card('spades', 10),
          card('spades', 11),
          card('spades', 12),
          card('spades', 13),
        ],
        [],
        [],
        [],
      ],
      tableau: [[], [], [], [], [], [], []],
      selection: { from: 'foundation', pileIndex: 0, cardIndex: 12 },
      status: 'playing',
    });
    // King of spades (black) to empty column
    const next = gameReducer(state2, { type: 'CLICK_TABLEAU', column: 0, cardIndex: 0 });
    expect(next.tableau[0]).toHaveLength(1);
    expect(next.foundations[0]).toHaveLength(12);
  });
});

describe('CLICK_FOUNDATION - edge cases', () => {
  it('does nothing when clicking empty foundation with no selection', () => {
    const state = makeState({ foundations: [[], [], [], []], status: 'playing' });
    const next = gameReducer(state, { type: 'CLICK_FOUNDATION', pileIndex: 0 });
    expect(next).toBe(state);
  });

  it('does nothing when game is won', () => {
    const state = makeState({ status: 'won' });
    expect(gameReducer(state, { type: 'CLICK_FOUNDATION', pileIndex: 0 })).toBe(state);
  });

  it('does nothing when trying to move multi-card selection to foundation', () => {
    // A tableau stack of 2 cards cannot go to foundation
    const state = makeState({
      tableau: [
        [card('spades', 5), card('hearts', 4)], // 2 face-up cards
        [],
        [],
        [],
        [],
        [],
        [],
      ],
      foundations: [
        [card('spades', 1), card('spades', 2), card('spades', 3), card('spades', 4)],
        [],
        [],
        [],
      ],
      selection: { from: 'tableau', column: 0, cardIndex: 0 }, // selects 2 cards
      status: 'playing',
    });
    const next = gameReducer(state, { type: 'CLICK_FOUNDATION', pileIndex: 0 });
    // Multi-card selection can't go to foundation; selection cleared
    expect(next.selection).toBeNull();
    expect(next.foundations[0]).toHaveLength(4);
  });
});

describe('AUTO_MOVE_TO_FOUNDATION', () => {
  it('auto-moves a card to the correct foundation', () => {
    const state = makeState({
      waste: [card('spades', 1)],
      foundations: [[], [], [], []],
      status: 'playing',
    });
    const next = gameReducer(state, {
      type: 'AUTO_MOVE_TO_FOUNDATION',
      source: { from: 'waste', cardIndex: 0 },
    });
    expect(next.foundations.some((f) => f.length === 1 && f[0].suit === 'spades')).toBe(true);
  });

  it('does nothing if no valid foundation', () => {
    const state = makeState({
      waste: [card('spades', 7)], // no foundation started for spades
      foundations: [[], [], [], []],
      status: 'playing',
    });
    const next = gameReducer(state, {
      type: 'AUTO_MOVE_TO_FOUNDATION',
      source: { from: 'waste', cardIndex: 0 },
    });
    expect(next).toBe(state);
  });

  it('does nothing when foundation top card has no valid target', () => {
    // 5 of spades is on top of foundation 0; no other pile has 4 of spades, so nowhere to go
    const pile0 = [1, 2, 3, 4, 5].map((r) => card('spades', r as Card['rank']));
    const state = makeState({
      foundations: [pile0, [], [], []],
      status: 'playing',
    });
    const next = gameReducer(state, {
      type: 'AUTO_MOVE_TO_FOUNDATION',
      source: { from: 'foundation', pileIndex: 0, cardIndex: 4 },
    });
    expect(next).toBe(state);
  });

  it('does nothing if game is won', () => {
    const state = makeState({ status: 'won', waste: [card('spades', 1)] });
    expect(
      gameReducer(state, {
        type: 'AUTO_MOVE_TO_FOUNDATION',
        source: { from: 'waste', cardIndex: 0 },
      }),
    ).toBe(state);
  });

  it('does nothing if source has multiple cards', () => {
    const state = makeState({
      tableau: [[card('hearts', 5), card('spades', 4)], [], [], [], [], [], []],
      foundations: [[], [], [], []],
      status: 'playing',
    });
    const next = gameReducer(state, {
      type: 'AUTO_MOVE_TO_FOUNDATION',
      source: { from: 'tableau', column: 0, cardIndex: 0 }, // selects 2 cards
    });
    expect(next).toBe(state);
  });
});
