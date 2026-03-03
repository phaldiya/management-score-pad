import type { Suit } from '../types/index.ts';

const TRUMP_ORDER: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];

export function getMaxCardsPerPlayer(numPlayers: number): number {
  return Math.floor(52 / numPlayers);
}

export function generateCardSequence(maxCards: number): number[] {
  // y, y-1, ..., 2, 1, 2, ..., y-1, y
  const descending: number[] = [];
  for (let i = maxCards; i >= 1; i--) {
    descending.push(i);
  }
  const ascending: number[] = [];
  for (let i = 2; i <= maxCards; i++) {
    ascending.push(i);
  }
  return [...descending, ...ascending];
}

export function getTotalGames(maxCards: number): number {
  return 2 * maxCards - 1;
}

export function getTrumpForGame(gameIndex: number): Suit {
  return TRUMP_ORDER[gameIndex % 4];
}

export const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '\u2660',
  hearts: '\u2665',
  clubs: '\u2663',
  diamonds: '\u2666',
};

export function isSuitRed(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}
