import type { GameRound, Player } from '../types/index.ts';
import { getCumulativeScore } from './scoreCalculation.ts';

export interface PlayerStats {
  playerId: string;
  total: number;
  bidsMade: number;
  roundsPlayed: number;
  accuracy: number;
}

export interface BestPlay {
  playerId: string;
  score: number;
  gameNumber: number;
}

export interface GameStats {
  completedRounds: number;
  perPlayer: PlayerStats[];
  bestPlay: BestPlay | null;
  leaderIds: string[];
  leaderScore: number;
  /** Lead over the next-best distinct score (0 when tied for the lead). */
  leadMargin: number;
}

export function computeGameStats(rounds: GameRound[], players: Player[]): GameStats {
  const completedIndices = rounds.reduce<number[]>((acc, r, i) => {
    if (r.phase === 'completed') acc.push(i);
    return acc;
  }, []);

  const lastCompletedIdx = completedIndices.length > 0 ? completedIndices[completedIndices.length - 1] : -1;

  const perPlayer: PlayerStats[] = players.map((p) => {
    let bidsMade = 0;
    for (const idx of completedIndices) {
      const pd = rounds[idx].playerData.find((d) => d.playerId === p.id);
      if (pd && pd.result != null && pd.bid === pd.result) bidsMade += 1;
    }
    const roundsPlayed = completedIndices.length;
    return {
      playerId: p.id,
      total: lastCompletedIdx >= 0 ? getCumulativeScore(rounds, p.id, lastCompletedIdx) : 0,
      bidsMade,
      roundsPlayed,
      accuracy: roundsPlayed > 0 ? bidsMade / roundsPlayed : 0,
    };
  });

  let bestPlay: BestPlay | null = null;
  for (const idx of completedIndices) {
    for (const pd of rounds[idx].playerData) {
      if (pd.score != null && (bestPlay === null || pd.score > bestPlay.score)) {
        bestPlay = { playerId: pd.playerId, score: pd.score, gameNumber: rounds[idx].gameNumber };
      }
    }
  }

  const totals = perPlayer.map((s) => s.total);
  const sorted = [...totals].sort((a, b) => b - a);
  const leaderScore = totals.length > 0 ? sorted[0] : 0;
  const leaderIds = leaderScore > 0 ? perPlayer.filter((s) => s.total === leaderScore).map((s) => s.playerId) : [];
  // Tied for the lead -> no margin; otherwise the gap to second place.
  const leadMargin = leaderIds.length > 1 ? 0 : leaderScore - (sorted[1] ?? leaderScore);

  return {
    completedRounds: completedIndices.length,
    perPlayer,
    bestPlay,
    leaderIds,
    leaderScore,
    leadMargin,
  };
}
