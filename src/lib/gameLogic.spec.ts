import { describe, expect, it } from 'vitest';

import {
  generateCardSequence,
  getMaxCardsPerPlayer,
  getTotalGames,
  getTrumpForGame,
  isSuitRed,
  SUIT_SYMBOLS,
} from './gameLogic.ts';

describe('gameLogic spec', () => {
  it('generateCardSequence(1) returns [1]', () => {
    expect(generateCardSequence(1)).toEqual([1]);
  });

  it('generateCardSequence(2) returns [2, 1, 2]', () => {
    expect(generateCardSequence(2)).toEqual([2, 1, 2]);
  });

  it('getTotalGames(1) returns 1', () => {
    expect(getTotalGames(1)).toBe(1);
  });

  it.each([
    1, 2, 3, 5, 7, 13, 17, 26, 52,
  ])('cross-function invariant: getTotalGames(%i) === generateCardSequence(%i).length', (n) => {
    expect(getTotalGames(n)).toBe(generateCardSequence(n).length);
  });

  it('isSuitRed returns true for diamonds', () => {
    expect(isSuitRed('diamonds')).toBe(true);
  });

  it('isSuitRed returns false for clubs', () => {
    expect(isSuitRed('clubs')).toBe(false);
  });

  it('SUIT_SYMBOLS has exactly 4 entries with correct clubs and diamonds', () => {
    expect(Object.keys(SUIT_SYMBOLS)).toHaveLength(4);
    expect(SUIT_SYMBOLS.clubs).toBe('♣');
    expect(SUIT_SYMBOLS.diamonds).toBe('♦');
  });

  it('every value in generateCardSequence(10) is >= 1', () => {
    const seq = generateCardSequence(10);
    for (const v of seq) {
      expect(v).toBeGreaterThanOrEqual(1);
    }
  });

  it('value 1 appears exactly once in any sequence', () => {
    for (const max of [1, 5, 10, 26]) {
      const seq = generateCardSequence(max);
      const count = seq.filter((v) => v === 1).length;
      expect(count).toBe(1);
    }
  });
});

describe('gameLogic – smoke', () => {
  describe('getMaxCardsPerPlayer', () => {
    it('3 players → 17', () => {
      expect(getMaxCardsPerPlayer(3)).toBe(17);
    });

    it('4 players → 13', () => {
      expect(getMaxCardsPerPlayer(4)).toBe(13);
    });

    it('7 players → 7', () => {
      expect(getMaxCardsPerPlayer(7)).toBe(7);
    });

    it('52 players → 1', () => {
      expect(getMaxCardsPerPlayer(52)).toBe(1);
    });
  });

  describe('generateCardSequence', () => {
    it('maxCards=3 → [3,2,1,2,3]', () => {
      expect(generateCardSequence(3)).toEqual([3, 2, 1, 2, 3]);
    });

    it('length = 2*maxCards - 1', () => {
      expect(generateCardSequence(3)).toHaveLength(2 * 3 - 1);
    });
  });

  describe('getTotalGames', () => {
    it('maxCards=7 → 13', () => {
      expect(getTotalGames(7)).toBe(13);
    });

    it('maxCards=13 → 25', () => {
      expect(getTotalGames(13)).toBe(25);
    });
  });

  describe('getTrumpForGame', () => {
    it('index 0 → spades', () => {
      expect(getTrumpForGame(0)).toBe('spades');
    });

    it('index 1 → hearts', () => {
      expect(getTrumpForGame(1)).toBe('hearts');
    });

    it('index 2 → clubs', () => {
      expect(getTrumpForGame(2)).toBe('clubs');
    });

    it('index 3 → diamonds', () => {
      expect(getTrumpForGame(3)).toBe('diamonds');
    });

    it('index 4 → spades (cycles)', () => {
      expect(getTrumpForGame(4)).toBe('spades');
    });
  });

  describe('SUIT_SYMBOLS', () => {
    it('spades → ♠', () => {
      expect(SUIT_SYMBOLS.spades).toBe('♠');
    });

    it('hearts → ♥', () => {
      expect(SUIT_SYMBOLS.hearts).toBe('♥');
    });
  });

  describe('isSuitRed', () => {
    it('hearts → true', () => {
      expect(isSuitRed('hearts')).toBe(true);
    });

    it('spades → false', () => {
      expect(isSuitRed('spades')).toBe(false);
    });
  });
});

describe('gameLogic – deep', () => {
  describe('full sequence for 3 players (17 cards)', () => {
    const seq = generateCardSequence(17);

    it('length = 33', () => {
      expect(seq).toHaveLength(33);
    });

    it('starts at 17', () => {
      expect(seq[0]).toBe(17);
    });

    it('hits 1 in the middle', () => {
      expect(seq[16]).toBe(1);
    });

    it('ends at 17', () => {
      expect(seq[32]).toBe(17);
    });
  });

  describe('full sequence for 7 players (7 cards)', () => {
    const seq = generateCardSequence(7);

    it('length = 13', () => {
      expect(seq).toHaveLength(13);
    });
  });

  describe('sequence symmetry', () => {
    it('is symmetric around 1', () => {
      const seq = generateCardSequence(5);
      // [5,4,3,2,1,2,3,4,5]
      const mid = seq.indexOf(1);
      for (let i = 0; i < mid; i++) {
        expect(seq[mid - i]).toBe(seq[mid + i]);
      }
    });
  });

  describe('trump rotation covers all 4 suits repeatedly', () => {
    it('cycles through spades, hearts, clubs, diamonds', () => {
      const trumps = Array.from({ length: 8 }, (_, i) => getTrumpForGame(i));
      expect(trumps).toEqual(['spades', 'hearts', 'clubs', 'diamonds', 'spades', 'hearts', 'clubs', 'diamonds']);
    });
  });

  describe('edge cases for player counts', () => {
    it('1 player → maxCards = 52', () => {
      expect(getMaxCardsPerPlayer(1)).toBe(52);
    });

    it('2 players → maxCards = 26', () => {
      expect(getMaxCardsPerPlayer(2)).toBe(26);
    });
  });
});
