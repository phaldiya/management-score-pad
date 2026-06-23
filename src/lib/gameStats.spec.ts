import { describe, expect, it } from 'vitest';

import { completedRound, inProgressRound, testPlayers } from '../../tests/helpers/fixtures.ts';
import type { GameRound } from '../types/index.ts';
import { computeGameStats } from './gameStats.ts';

const secondRound: GameRound = {
  gameIndex: 1,
  gameNumber: 2,
  cardCount: 16,
  trump: 'hearts',
  phase: 'completed',
  playerData: [
    { playerId: 'p1', bid: 2, result: 2, score: 20, isDealer: false },
    { playerId: 'p2', bid: 1, result: 1, score: 10, isDealer: true },
    { playerId: 'p3', bid: 4, result: 2, score: 0, isDealer: false },
  ],
};

describe('computeGameStats', () => {
  it('returns empty stats when no rounds are completed', () => {
    const stats = computeGameStats([inProgressRound], testPlayers);
    expect(stats.completedRounds).toBe(0);
    expect(stats.bestPlay).toBeNull();
    expect(stats.leaderIds).toEqual([]);
    expect(stats.leadMargin).toBe(0);
    expect(stats.perPlayer.every((p) => p.total === 0)).toBe(true);
  });

  it('ignores in-progress rounds and totals only completed rounds', () => {
    const stats = computeGameStats([completedRound, secondRound, inProgressRound], testPlayers);
    expect(stats.completedRounds).toBe(2);
    const p1 = stats.perPlayer.find((p) => p.playerId === 'p1');
    // p1: 30 (round 1) + 20 (round 2) = 50; the in-progress round is excluded.
    expect(p1?.total).toBe(50);
  });

  it('computes bid accuracy per player', () => {
    const stats = computeGameStats([completedRound, secondRound], testPlayers);
    const p1 = stats.perPlayer.find((p) => p.playerId === 'p1');
    const p3 = stats.perPlayer.find((p) => p.playerId === 'p3');
    // p1 made both bids, p3 made the first (0/0) but missed the second.
    expect(p1?.bidsMade).toBe(2);
    expect(p1?.accuracy).toBe(1);
    expect(p3?.bidsMade).toBe(1);
    expect(p3?.accuracy).toBe(0.5);
  });

  it('identifies the single highest-scoring play', () => {
    const stats = computeGameStats([completedRound, secondRound], testPlayers);
    expect(stats.bestPlay).toEqual({ playerId: 'p1', score: 30, gameNumber: 1 });
  });

  it('reports the leader and margin over the next-best distinct score', () => {
    const stats = computeGameStats([completedRound, secondRound], testPlayers);
    // Totals: p1=50, p2=10, p3=10 -> leader p1, margin 40.
    expect(stats.leaderIds).toEqual(['p1']);
    expect(stats.leaderScore).toBe(50);
    expect(stats.leadMargin).toBe(40);
  });

  it('reports a tie for the lead with zero margin', () => {
    const tie: GameRound = {
      ...secondRound,
      playerData: [
        { playerId: 'p1', bid: 0, result: 0, score: 10, isDealer: false },
        { playerId: 'p2', bid: 2, result: 2, score: 20, isDealer: true },
        { playerId: 'p3', bid: 4, result: 2, score: 0, isDealer: false },
      ],
    };
    // Totals after completedRound + tie: p1=40, p2=20, p3=10. Make p2 catch up:
    const stats = computeGameStats(
      [
        completedRound,
        tie,
        {
          ...secondRound,
          gameIndex: 2,
          gameNumber: 3,
          playerData: [
            { playerId: 'p1', bid: 1, result: 0, score: 0, isDealer: false },
            { playerId: 'p2', bid: 2, result: 2, score: 20, isDealer: true },
            { playerId: 'p3', bid: 0, result: 0, score: 10, isDealer: false },
          ],
        },
      ],
      testPlayers,
    );
    // p1=40, p2=40, p3=20 -> tie p1/p2, margin 0.
    expect(new Set(stats.leaderIds)).toEqual(new Set(['p1', 'p2']));
    expect(stats.leadMargin).toBe(0);
  });
});
