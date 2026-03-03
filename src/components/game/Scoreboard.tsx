import { forwardRef, useEffect, useRef } from 'react';

import type { GameRound, Player } from '../../types/index.ts';
import AddPlayerInline from './AddPlayerInline.tsx';
import ScoreboardHeader from './ScoreboardHeader.tsx';
import ScoreboardRow from './ScoreboardRow.tsx';
import SeatingChart from './SeatingChart.tsx';

interface ScoreboardProps {
  players: Player[];
  rounds: GameRound[];
  onInProgressPlayClick?: () => void;
}

const Scoreboard = forwardRef<HTMLTableElement, ScoreboardProps>(function Scoreboard(
  { players, rounds, onInProgressPlayClick },
  ref,
) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const _roundCount = rounds.length;
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  return (
    <div ref={scrollRef} className="flex-1 overflow-auto">
      <table ref={ref} id="scoreboard" className="w-full border-collapse">
        <ScoreboardHeader players={players} rounds={rounds} />
        <tbody>
          {rounds.length === 0 ? (
            <tr>
              <td colSpan={players.length + 1} className="py-8 text-center">
                <div className="text-gray-500">No plays yet. Start the first play!</div>
                <SeatingChart players={players} />
                <AddPlayerInline />
                <div className="mt-3 text-gray-500 text-sm">
                  Use the{' '}
                  <span className="inline-block rounded bg-gray-100 px-1.5 font-medium text-gray-500">&larr;</span>{' '}
                  <span className="inline-block rounded bg-gray-100 px-1.5 font-medium text-gray-500">&rarr;</span>{' '}
                  arrows to reorder players in clockwise seating order.
                </div>
              </td>
            </tr>
          ) : (
            rounds.map((round) => (
              <ScoreboardRow
                key={round.gameIndex}
                round={round}
                players={players}
                onPlayCardClick={round.phase === 'in_progress' ? onInProgressPlayClick : undefined}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
});

export default Scoreboard;
