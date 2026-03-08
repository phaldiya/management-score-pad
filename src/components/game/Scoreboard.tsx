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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  return (
    <div ref={scrollRef} className={`flex-1 overflow-auto ${rounds.length === 0 ? 'flex flex-col' : ''}`}>
      <table ref={ref} id="scoreboard" className="min-w-full border-collapse">
        <caption className="sr-only">Scoreboard showing player bids, results, and scores across rounds</caption>
        <ScoreboardHeader players={players} rounds={rounds} />
        <tbody>
          {rounds.map((round) => (
            <ScoreboardRow
              key={round.gameIndex}
              round={round}
              players={players}
              onPlayCardClick={round.phase === 'in_progress' ? onInProgressPlayClick : undefined}
            />
          ))}
        </tbody>
      </table>
      {rounds.length === 0 && (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="text-gray-700">No plays yet. Start the first play!</div>
            <SeatingChart players={players} />
            <AddPlayerInline />
            <div className="mt-3 text-gray-700 text-sm">
              Use the <span className="inline-block rounded bg-gray-100 px-1.5 font-medium text-gray-700">&larr;</span>{' '}
              <span className="inline-block rounded bg-gray-100 px-1.5 font-medium text-gray-700">&rarr;</span> arrows
              to reorder players in clockwise seating order.
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default Scoreboard;
