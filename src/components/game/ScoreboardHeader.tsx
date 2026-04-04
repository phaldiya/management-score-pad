import { useCallback, useEffect, useRef } from 'react';

import { useAppContext } from '../../context/AppContext.tsx';
import { getCumulativeScore } from '../../lib/scoreCalculation.ts';
import { useDragReorder } from '../../lib/useDragReorder.ts';
import type { GameRound, Player } from '../../types/index.ts';
import AnimatedNumber from '../shared/AnimatedNumber.tsx';
import { GripIcon } from '../shared/Icons.tsx';
import PlayerAvatar from '../shared/PlayerAvatar.tsx';
import { Tooltip } from '../shared/Tooltip.tsx';

interface ScoreboardHeaderProps {
  players: Player[];
  rounds: GameRound[];
}

export default function ScoreboardHeader({ players, rounds }: ScoreboardHeaderProps) {
  const { dispatch } = useAppContext();
  const lastCompletedIndex = rounds.reduce((acc, r, i) => (r.phase === 'completed' ? i : acc), -1);
  const canReorder = rounds.length === 0;

  const handleReorder = (reordered: Player[]) => {
    const fromIndex = players.findIndex((p) => p.id !== reordered[players.indexOf(p)]?.id);
    const toIndex = reordered.findIndex((p) => p.id === players[fromIndex]?.id);
    if (fromIndex >= 0 && toIndex >= 0) {
      dispatch({ type: 'REORDER_PLAYERS', fromIndex, toIndex });
    }
  };

  const { dragIndex, overIndex, getDragProps, getHandleProps } = useDragReorder(players, handleReorder, 'horizontal');

  const thRefs = useRef<(HTMLTableCellElement | null)[]>([]);
  const pendingFocusRef = useRef<number | null>(null);

  useEffect(() => {
    if (pendingFocusRef.current !== null) {
      thRefs.current[pendingFocusRef.current]?.focus();
      pendingFocusRef.current = null;
    }
  });

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        pendingFocusRef.current = index - 1;
        dispatch({ type: 'REORDER_PLAYERS', fromIndex: index, toIndex: index - 1 });
      } else if (e.key === 'ArrowRight' && index < players.length - 1) {
        e.preventDefault();
        pendingFocusRef.current = index + 1;
        dispatch({ type: 'REORDER_PLAYERS', fromIndex: index, toIndex: index + 1 });
      }
    },
    [dispatch, players.length],
  );

  const scores =
    lastCompletedIndex >= 0 ? players.map((p) => getCumulativeScore(rounds, p.id, lastCompletedIndex)) : [];
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
  const hasScores = maxScore > 0;

  const prevScoresRef = useRef<number[]>([]);
  const prevLeadersRef = useRef<boolean[]>([]);
  const flashKeysRef = useRef<number[]>(players.map(() => 0));
  const crownKeysRef = useRef<number[]>(players.map(() => 0));

  useEffect(() => {
    const prevScores = prevScoresRef.current;
    const prevLeaders = prevLeadersRef.current;

    for (let i = 0; i < players.length; i++) {
      const newScore = scores[i] ?? 0;
      const wasLeader = prevLeaders[i] ?? false;
      const isLeader = hasScores && newScore === maxScore;

      if (prevScores.length > 0 && newScore !== (prevScores[i] ?? 0)) {
        flashKeysRef.current[i] = (flashKeysRef.current[i] ?? 0) + 1;
      }
      if (!wasLeader && isLeader) {
        crownKeysRef.current[i] = (crownKeysRef.current[i] ?? 0) + 1;
      }
    }

    prevScoresRef.current = scores.map((s) => s ?? 0);
    prevLeadersRef.current = players.map((_, i) => hasScores && (scores[i] ?? 0) === maxScore);
  });

  return (
    <thead>
      <tr className="sticky top-0 z-20 bg-gray-600">
        <th
          scope="col"
          className="w-[49px] border border-gray-500 bg-gray-600 px-1 py-2 text-center font-semibold text-gray-300 text-xs uppercase tracking-wider sm:sticky sm:left-0 sm:z-30"
        >
          Play
        </th>
        {players.map((player, index) => {
          const cumScore = scores[index] ?? 0;
          const isLeader = hasScores && cumScore === maxScore;
          return (
            <th
              key={player.id}
              scope="col"
              ref={(el) => {
                thRefs.current[index] = el;
              }}
              className={`min-w-[5rem] border border-gray-500 px-3 py-2 text-center ${canReorder ? 'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-inset' : ''} ${canReorder && dragIndex === index ? 'opacity-40' : ''} ${canReorder && overIndex === index && dragIndex !== index ? 'border-l-3 border-l-blue-400' : ''}`}
              {...(canReorder
                ? {
                    ...getDragProps(index),
                    tabIndex: 0,
                    onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(index, e),
                    'aria-label': `${player.name}, use left and right arrow keys to reorder`,
                  }
                : {})}
            >
              <div className="flex items-center justify-center gap-2.5">
                <span className="relative hidden sm:inline">
                  <PlayerAvatar avatar={player.avatar} name={player.name} size={isLeader ? 'xs' : 'sm'} />
                  {isLeader && (
                    <span
                      key={crownKeysRef.current[index]}
                      className={`absolute -top-2 left-1/2 -translate-x-1/2 text-xs leading-none ${crownKeysRef.current[index] > 0 ? 'animate-crown-pop' : ''}`}
                    >
                      &#x1F451;
                    </span>
                  )}
                </span>
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <span className="max-w-[6rem] truncate font-bold text-base text-white">
                      {player.name}
                      {isLeader && <sup className="pl-0.5 text-yellow-300">*</sup>}
                    </span>
                    {canReorder && (
                      <Tooltip text="Drag or use ← → keys to reorder">
                        <button
                          type="button"
                          className="cursor-grab touch-none text-gray-400 hover:text-white active:cursor-grabbing"
                          aria-label={`Drag to reorder ${player.name}`}
                          {...getHandleProps(index)}
                        >
                          <GripIcon className="h-3.5 w-3.5" />
                        </button>
                      </Tooltip>
                    )}
                  </div>
                  {!canReorder && (
                    <div
                      key={flashKeysRef.current[index]}
                      className={`font-medium text-blue-200 text-xs ${flashKeysRef.current[index] > 0 ? 'animate-score-flash' : ''}`}
                    >
                      <AnimatedNumber value={cumScore} />
                    </div>
                  )}
                </div>
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
