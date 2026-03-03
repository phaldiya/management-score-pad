import { useAppContext } from '../../context/AppContext.tsx';
import { getCumulativeScore } from '../../lib/scoreCalculation.ts';
import type { GameRound, Player } from '../../types/index.ts';
import PlayerAvatar from '../shared/PlayerAvatar.tsx';

interface ScoreboardHeaderProps {
  players: Player[];
  rounds: GameRound[];
}

export default function ScoreboardHeader({ players, rounds }: ScoreboardHeaderProps) {
  const { dispatch } = useAppContext();
  const lastCompletedIndex = rounds.reduce((acc, r, i) => (r.phase === 'completed' ? i : acc), -1);
  const canReorder = rounds.length === 0;

  const scores =
    lastCompletedIndex >= 0 ? players.map((p) => getCumulativeScore(rounds, p.id, lastCompletedIndex)) : [];
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
  const hasScores = maxScore > 0;

  return (
    <thead>
      <tr className="sticky top-0 z-20 bg-gray-600">
        <th className="sticky left-0 z-30 w-0 border border-gray-500 bg-gray-600 px-1 py-2 text-left font-semibold text-gray-300 text-xs uppercase tracking-wider">
          Play
        </th>
        {players.map((player, index) => {
          const cumScore = scores[index] ?? 0;
          const isLeader = hasScores && cumScore === maxScore;
          return (
            <th key={player.id} className="border border-gray-500 px-3 py-2 text-center">
              {canReorder ? (
                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    className="text-gray-400 text-xl leading-none enabled:hover:text-white disabled:opacity-30"
                    aria-label={`Move ${player.name} left`}
                    title={`Move ${player.name} to left`}
                    onClick={() =>
                      dispatch({
                        type: 'REORDER_PLAYERS',
                        fromIndex: index,
                        toIndex: index - 1,
                      })
                    }
                  >
                    ←
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline">
                      <PlayerAvatar avatar={player.avatar} name={player.name} size="sm" />
                    </span>
                    <span className="font-bold text-base text-white">{player.name}</span>
                  </div>
                  <button
                    type="button"
                    disabled={index === players.length - 1}
                    className="text-gray-400 text-xl leading-none enabled:hover:text-white disabled:opacity-30"
                    aria-label={`Move ${player.name} right`}
                    title={`Move ${player.name} to right`}
                    onClick={() =>
                      dispatch({
                        type: 'REORDER_PLAYERS',
                        fromIndex: index,
                        toIndex: index + 1,
                      })
                    }
                  >
                    →
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2.5">
                  {isLeader ? (
                    <span className="text-4xl leading-none">&#x1F451;</span>
                  ) : (
                    <span className="hidden sm:inline">
                      <PlayerAvatar avatar={player.avatar} name={player.name} size="md" />
                    </span>
                  )}
                  <div>
                    <div className="font-bold text-base text-white">{player.name}</div>
                    <div className="font-medium text-blue-300 text-xs">{cumScore}</div>
                  </div>
                </div>
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
