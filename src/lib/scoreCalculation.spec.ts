import { describe, expect, it } from 'vitest';

import { completedRound, inProgressRound } from '../../tests/helpers/fixtures.ts';
import type { GameRound } from '../types/index.ts';
import { calculateScore, computeRoundScores, getCumulativeScore } from './scoreCalculation.ts';

describe('scoreCalculation spec', () => {
  it('calculateScore(10, 10) returns 100', () => {
    expect(calculateScore(10, 10)).toBe(100);
  });

  it('calculateScore(1, 0) returns 0', () => {
    expect(calculateScore(1, 0)).toBe(0);
  });

  it('calculateScore(0, 1) returns 0', () => {
    expect(calculateScore(0, 1)).toBe(0);
  });

  it('calculateScore(5, 6) returns 0', () => {
    expect(calculateScore(5, 6)).toBe(0);
  });

  it('getCumulativeScore with empty rounds returns 0', () => {
    expect(getCumulativeScore([], 'p1', 0)).toBe(0);
  });

  it('getCumulativeScore with index beyond bounds returns safe result', () => {
    expect(getCumulativeScore([completedRound], 'p1', 99)).toBe(30);
  });

  it('getCumulativeScore with negative index returns 0', () => {
    expect(getCumulativeScore([completedRound], 'p1', -1)).toBe(0);
  });

  it('getCumulativeScore skips rounds with phase bidding', () => {
    const biddingRound = { ...completedRound, phase: 'bidding' as const };
    expect(getCumulativeScore([biddingRound], 'p1', 0)).toBe(0);
  });

  it('computeRoundScores does not mutate input array', () => {
    const input = [{ playerId: 'p1', bid: 3, result: 3, score: null, isDealer: false }];
    const originalRef = input[0];
    computeRoundScores(input);
    expect(input[0]).toBe(originalRef);
    expect(input[0].score).toBeNull();
  });

  it('computeRoundScores returns new array references', () => {
    const input = [{ playerId: 'p1', bid: 3, result: 3, score: null, isDealer: false }];
    const result = computeRoundScores(input);
    expect(result).not.toBe(input);
    expect(result[0]).not.toBe(input[0]);
  });
});

describe('scoreCalculation – smoke', () => {
  describe('calculateScore', () => {
    it('bid=2, result=2 → 20', () => {
      expect(calculateScore(2, 2)).toBe(20);
    });

    it('bid=0, result=0 → 10', () => {
      expect(calculateScore(0, 0)).toBe(10);
    });

    it('bid=2, result=1 → 0 (miss)', () => {
      expect(calculateScore(2, 1)).toBe(0);
    });

    it('bid=0, result=3 → 0 (miss)', () => {
      expect(calculateScore(0, 3)).toBe(0);
    });
  });

  describe('computeRoundScores', () => {
    it('updates score fields for all players', () => {
      const playerData = [
        { playerId: 'p1', bid: 2, result: 2, score: null, isDealer: true },
        { playerId: 'p2', bid: 0, result: 0, score: null, isDealer: false },
        { playerId: 'p3', bid: 3, result: 1, score: null, isDealer: false },
      ];
      const scored = computeRoundScores(playerData);
      expect(scored[0].score).toBe(20);
      expect(scored[1].score).toBe(10);
      expect(scored[2].score).toBe(0);
    });
  });

  describe('getCumulativeScore', () => {
    it('single completed round returns correct sum', () => {
      const rounds = [completedRound];
      expect(getCumulativeScore(rounds, 'p1', 0)).toBe(30);
      expect(getCumulativeScore(rounds, 'p2', 0)).toBe(0);
      expect(getCumulativeScore(rounds, 'p3', 0)).toBe(10);
    });
  });
});

describe('scoreCalculation – deep', () => {
  describe('multi-round cumulative scores', () => {
    const round2: GameRound = {
      gameIndex: 1,
      gameNumber: 2,
      cardCount: 16,
      trump: 'hearts',
      phase: 'completed',
      playerData: [
        { playerId: 'p1', bid: 0, result: 0, score: 10, isDealer: false },
        { playerId: 'p2', bid: 4, result: 4, score: 40, isDealer: true },
        { playerId: 'p3', bid: 1, result: 2, score: 0, isDealer: false },
      ],
    };

    const round3: GameRound = {
      gameIndex: 2,
      gameNumber: 3,
      cardCount: 15,
      trump: 'clubs',
      phase: 'completed',
      playerData: [
        { playerId: 'p1', bid: 5, result: 5, score: 50, isDealer: false },
        { playerId: 'p2', bid: 0, result: 1, score: 0, isDealer: false },
        { playerId: 'p3', bid: 2, result: 2, score: 20, isDealer: true },
      ],
    };

    const rounds = [completedRound, round2, round3];

    it('cumulative at index 0', () => {
      expect(getCumulativeScore(rounds, 'p1', 0)).toBe(30);
      expect(getCumulativeScore(rounds, 'p2', 0)).toBe(0);
      expect(getCumulativeScore(rounds, 'p3', 0)).toBe(10);
    });

    it('cumulative at index 1', () => {
      expect(getCumulativeScore(rounds, 'p1', 1)).toBe(40);
      expect(getCumulativeScore(rounds, 'p2', 1)).toBe(40);
      expect(getCumulativeScore(rounds, 'p3', 1)).toBe(10);
    });

    it('cumulative at index 2', () => {
      expect(getCumulativeScore(rounds, 'p1', 2)).toBe(90);
      expect(getCumulativeScore(rounds, 'p2', 2)).toBe(40);
      expect(getCumulativeScore(rounds, 'p3', 2)).toBe(30);
    });
  });

  describe('skips non-completed rounds', () => {
    it('in_progress round does not contribute to cumulative', () => {
      const rounds = [completedRound, inProgressRound];
      expect(getCumulativeScore(rounds, 'p1', 1)).toBe(30);
    });
  });

  describe('edge: player not found returns 0', () => {
    it('unknown playerId returns 0', () => {
      expect(getCumulativeScore([completedRound], 'unknown', 0)).toBe(0);
    });
  });

  describe('computeRoundScores with null results', () => {
    it('null result → null score', () => {
      const playerData = [{ playerId: 'p1', bid: 2, result: null, score: null, isDealer: true }];
      const scored = computeRoundScores(playerData);
      expect(scored[0].score).toBeNull();
    });
  });

  describe('all scoring paths: bid=N result=N → N*10', () => {
    it.each([1, 2, 3, 4, 5])('bid=%i result=%i → %i*10', (n) => {
      expect(calculateScore(n, n)).toBe(n * 10);
    });
  });
});
