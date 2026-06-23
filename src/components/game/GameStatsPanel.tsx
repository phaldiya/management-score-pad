import { computeGameStats } from '../../lib/gameStats.ts';
import type { GameRound, Player } from '../../types/index.ts';

interface GameStatsPanelProps {
  players: Player[];
  rounds: GameRound[];
}

function StatChip({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex min-w-[7rem] flex-1 flex-col rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
      <span className="font-semibold text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
      <span className="truncate font-bold text-base text-gray-900">{value}</span>
      {sub && <span className="text-gray-500 text-xs">{sub}</span>}
    </div>
  );
}

export default function GameStatsPanel({ players, rounds }: GameStatsPanelProps) {
  const stats = computeGameStats(rounds, players);
  if (stats.completedRounds === 0) return null;

  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? '';

  const leaderLabel = stats.leaderIds.map(nameOf).join(' & ');
  const mostAccurate = [...stats.perPlayer].sort((a, b) => b.accuracy - a.accuracy)[0];

  return (
    <section className="border-gray-200 border-t bg-white px-4 py-4" aria-label="Game insights">
      <h2 className="mb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Insights</h2>

      <div className="flex flex-wrap gap-2">
        <StatChip
          label="Leader"
          value={leaderLabel || '—'}
          sub={stats.leadMargin > 0 ? `+${stats.leadMargin} ahead` : 'Tied'}
        />
        {stats.bestPlay && (
          <StatChip
            label="Best play"
            value={nameOf(stats.bestPlay.playerId)}
            sub={`+${stats.bestPlay.score} · Play ${stats.bestPlay.gameNumber}`}
          />
        )}
        {mostAccurate && mostAccurate.roundsPlayed > 0 && (
          <StatChip
            label="Most accurate"
            value={nameOf(mostAccurate.playerId)}
            sub={`${Math.round(mostAccurate.accuracy * 100)}% bids made`}
          />
        )}
      </div>
    </section>
  );
}
