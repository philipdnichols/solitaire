export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
export type DrawCount = 1 | 3;
export type GameStatus = 'idle' | 'playing' | 'won';

export interface Card {
  readonly suit: Suit;
  readonly rank: Rank;
  readonly faceUp: boolean;
}

// Identifies the source of a selection (which cards are being held)
export interface Selection {
  readonly from: 'waste' | 'tableau' | 'foundation';
  readonly column?: number; // tableau column index (0–6)
  readonly pileIndex?: number; // foundation pile index (0–3)
  readonly cardIndex: number; // index of the first selected card in its pile
}

export const SUITS: readonly Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];

export const RANK_LABELS: Record<Rank, string> = {
  1: 'A',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K',
};

export const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

export interface GameState {
  readonly stock: ReadonlyArray<Card>;
  readonly waste: ReadonlyArray<Card>;
  readonly foundations: ReadonlyArray<ReadonlyArray<Card>>; // 4 piles
  readonly tableau: ReadonlyArray<ReadonlyArray<Card>>; // 7 columns
  readonly selection: Selection | null;
  readonly status: GameStatus;
  readonly moves: number;
  readonly elapsedSeconds: number;
  readonly drawCount: DrawCount;
}
