import type { Card, GameState, Selection, Suit } from '../types/game';

export function isRed(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}

export function canPlaceOnFoundation(card: Card, foundation: ReadonlyArray<Card>): boolean {
  if (foundation.length === 0) return card.rank === 1; // Ace on empty pile
  const top = foundation[foundation.length - 1];
  return card.suit === top.suit && card.rank === top.rank + 1;
}

// cards[0] is the card that will land on top of the column
export function canPlaceOnTableau(
  cards: ReadonlyArray<Card>,
  column: ReadonlyArray<Card>,
): boolean {
  if (cards.length === 0) return false;
  const card = cards[0];
  if (column.length === 0) return card.rank === 13; // King on empty column
  const top = column[column.length - 1];
  if (!top.faceUp) return false;
  return isRed(card.suit) !== isRed(top.suit) && card.rank === top.rank - 1;
}

export function getSelectedCards(state: GameState, sel: Selection): ReadonlyArray<Card> {
  switch (sel.from) {
    case 'waste':
      return state.waste.slice(-1);
    case 'tableau':
      return state.tableau[sel.column!].slice(sel.cardIndex);
    case 'foundation':
      return state.foundations[sel.pileIndex!].slice(-1);
  }
}

export function removeSelection(state: GameState, sel: Selection): GameState {
  switch (sel.from) {
    case 'waste':
      return { ...state, waste: state.waste.slice(0, -1) };

    case 'tableau': {
      const col = sel.column!;
      const remaining = state.tableau[col].slice(0, sel.cardIndex);
      // Automatically flip the new top card if it's face down
      const newCol =
        remaining.length > 0 && !remaining[remaining.length - 1].faceUp
          ? [...remaining.slice(0, -1), { ...remaining[remaining.length - 1], faceUp: true }]
          : remaining;
      return {
        ...state,
        tableau: state.tableau.map((c, i) => (i === col ? newCol : c)),
      };
    }

    case 'foundation': {
      const pi = sel.pileIndex!;
      return {
        ...state,
        foundations: state.foundations.map((f, i) => (i === pi ? f.slice(0, -1) : f)),
      };
    }
  }
}

// Returns the index of the first foundation pile that accepts the card, or -1
export function findFoundationForCard(
  card: Card,
  foundations: ReadonlyArray<ReadonlyArray<Card>>,
): number {
  for (let i = 0; i < foundations.length; i++) {
    if (canPlaceOnFoundation(card, foundations[i])) return i;
  }
  return -1;
}
