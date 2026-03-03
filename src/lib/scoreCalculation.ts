import type { GameRound, PlayerRoundData } from '../types/index.ts';

export function calculateScore(bid: number, result: number): number {
  if (bid !== result) return 0;
  if (bid === 0) return 10;
  return bid * 10;
}

export function getCumulativeScore(rounds: GameRound[], playerId: string, upToIndex: number): number {
  let total = 0;
  for (let i = 0; i <= upToIndex; i++) {
    const round = rounds[i];
    if (!round || round.phase !== 'completed') continue;
    const pd = round.playerData.find((p) => p.playerId === playerId);
    if (pd?.score != null) {
      total += pd.score;
    }
  }
  return total;
}

export function computeRoundScores(playerData: PlayerRoundData[]): PlayerRoundData[] {
  return playerData.map((pd) => ({
    ...pd,
    score: pd.result != null ? calculateScore(pd.bid, pd.result) : null,
  }));
}
