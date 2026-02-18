import { describe, it, expect } from 'vitest';
import { createDeck, shuffleDeck } from './deck';

describe('createDeck', () => {
  it('creates 52 cards', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
  });

  it('has 13 cards per suit', () => {
    const deck = createDeck();
    const suits = ['spades', 'hearts', 'diamonds', 'clubs'] as const;
    for (const suit of suits) {
      expect(deck.filter((c) => c.suit === suit)).toHaveLength(13);
    }
  });

  it('has ranks 1–13 for each suit', () => {
    const deck = createDeck();
    const spades = deck.filter((c) => c.suit === 'spades').map((c) => c.rank);
    for (let r = 1; r <= 13; r++) {
      expect(spades).toContain(r);
    }
  });

  it('creates all cards face down', () => {
    expect(createDeck().every((c) => !c.faceUp)).toBe(true);
  });
});

describe('shuffleDeck', () => {
  it('returns a 52-card array', () => {
    expect(shuffleDeck(createDeck())).toHaveLength(52);
  });

  it('preserves all cards', () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    const deckIds = deck.map((c) => `${c.suit}-${c.rank}`).sort();
    const shuffledIds = shuffled.map((c) => `${c.suit}-${c.rank}`).sort();
    expect(shuffledIds).toEqual(deckIds);
  });

  it('does not mutate the input', () => {
    const deck = createDeck();
    const first = deck[0];
    shuffleDeck(deck);
    expect(deck[0]).toBe(first);
  });
});
