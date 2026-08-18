import type { GameMode, GameRound, PlayerRoundData } from '../types/index.ts';

export function calculateScore(bid: number, result: number, mode: GameMode = 'classic'): number {
  if (bid !== result) {
    // Pro adds negative marking on top of Advance: a missed bid costs the bid, a missed nil costs 1.
    if (mode === 'pro') return bid === 0 ? -1 : -bid;
    return 0;
  }
  if (mode === 'advance' || mode === 'pro') return 10 + bid;
  if (bid === 0) return 10;
  return bid * 10;
}

export function getCumulativeScore(rounds: GameRound[], playerId: string, upToIndex: number): number {
  let total = 0;
  for (let i = 0; i <= upToIndex; i++) {
    const round = rounds[i];
    if (round?.phase !== 'completed') continue;
    const pd = round.playerData.find((p) => p.playerId === playerId);
    if (pd?.score != null) {
      total += pd.score;
    }
  }
  return total;
}

export function computeRoundScores(playerData: PlayerRoundData[], mode: GameMode = 'classic'): PlayerRoundData[] {
  return playerData.map((pd) => ({
    ...pd,
    score: pd.result != null ? calculateScore(pd.bid, pd.result, mode) : null,
  }));
}
