import { forwardRef, useEffect, useRef } from 'react';

import { getCumulativeScore } from '../../lib/scoreCalculation.ts';
import type { GameRound, Player } from '../../types/index.ts';
import AddPlayerInline from './AddPlayerInline.tsx';
import GameStatsPanel from './GameStatsPanel.tsx';
import ScoreboardHeader from './ScoreboardHeader.tsx';
import ScoreboardRow from './ScoreboardRow.tsx';
import SeatingChart from './SeatingChart.tsx';

interface ScoreboardProps {
  players: Player[];
  rounds: GameRound[];
  onInProgressPlayClick?: () => void;
  onCompletedPlayClick?: (roundIndex: number) => void;
  onUndoLastRound?: () => void;
}

function getLastCompletedIndex(rounds: GameRound[]): number {
  for (let i = rounds.length - 1; i >= 0; i--) {
    if (rounds[i].phase === 'completed') return i;
  }
  return -1;
}

function getLeaderIds(players: Player[], rounds: GameRound[], lastCompletedIndex: number): Set<string> {
  if (lastCompletedIndex < 0) return new Set();
  const scores = players.map((p) => getCumulativeScore(rounds, p.id, lastCompletedIndex));
  const max = Math.max(...scores);
  if (max <= 0) return new Set();
  return new Set(players.filter((_, i) => scores[i] === max).map((p) => p.id));
}

const Scoreboard = forwardRef<HTMLTableElement, ScoreboardProps>(function Scoreboard(
  { players, rounds, onInProgressPlayClick, onCompletedPlayClick, onUndoLastRound },
  ref,
) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLTableRowElement>(null);
  const lastCompletedIndex = getLastCompletedIndex(rounds);
  const leaderIds = getLeaderIds(players, rounds, lastCompletedIndex);
  const activeIndex = rounds.findIndex((r) => r.phase === 'in_progress');

  // Keep the live play in view as the active round changes (new bid / results entered).
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run when the active round changes
  useEffect(() => {
    if (activeRowRef.current) {
      activeRowRef.current.scrollIntoView({ block: 'nearest' });
    } else if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeIndex, rounds.length]);

  return (
    <div ref={scrollRef} className={`flex-1 overflow-auto ${rounds.length === 0 ? 'flex flex-col' : ''}`}>
      <table ref={ref} id="scoreboard" className="min-w-full border-collapse">
        <caption className="sr-only">Scoreboard showing player bids, results, and scores across rounds</caption>
        <ScoreboardHeader players={players} rounds={rounds} />
        <tbody>
          {rounds.map((round, index) => (
            <ScoreboardRow
              key={round.gameIndex}
              ref={index === activeIndex ? activeRowRef : undefined}
              round={round}
              players={players}
              leaderIds={leaderIds}
              onPlayCardClick={
                round.phase === 'in_progress'
                  ? onInProgressPlayClick
                  : round.phase === 'completed' && onCompletedPlayClick
                    ? () => onCompletedPlayClick(index)
                    : undefined
              }
              onUndo={index === lastCompletedIndex ? onUndoLastRound : undefined}
            />
          ))}
        </tbody>
      </table>
      {rounds.length > 0 && <GameStatsPanel players={players} rounds={rounds} />}
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
