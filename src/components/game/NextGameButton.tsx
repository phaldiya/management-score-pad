import type { GameRound } from '../../types/index.ts';
import { Tooltip } from '../shared/Tooltip.tsx';

interface NextGameButtonProps {
  currentRound: GameRound | undefined;
  totalGames: number;
  roundsPlayed: number;
  onStartFirstGame: () => void;
  onEnterResults: () => void;
  onNextGame: () => void;
  onGameComplete: () => void;
}

export default function NextGameButton({
  currentRound,
  totalGames,
  roundsPlayed,
  onStartFirstGame,
  onEnterResults,
  onNextGame,
  onGameComplete,
}: NextGameButtonProps) {
  // No rounds yet - start first game
  if (!currentRound) {
    return (
      <Tooltip text="Start first play (N)" block>
        <button
          type="button"
          onClick={onStartFirstGame}
          className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700"
        >
          Start First Play
        </button>
      </Tooltip>
    );
  }

  // Current round in progress - enter results
  if (currentRound.phase === 'in_progress') {
    return (
      <Tooltip text="Enter results (N)" block>
        <button
          type="button"
          onClick={onEnterResults}
          className="w-full rounded-lg bg-green-600 py-3 font-medium text-white hover:bg-green-700"
        >
          Enter Results
        </button>
      </Tooltip>
    );
  }

  // All rounds completed
  if (roundsPlayed >= totalGames) {
    return (
      <Tooltip text="View final results" block>
        <button
          type="button"
          onClick={onGameComplete}
          className="w-full rounded-lg bg-amber-500 py-3 font-medium text-white hover:bg-amber-600"
        >
          Game Complete!
        </button>
      </Tooltip>
    );
  }

  // Current round completed, more to go
  return (
    <Tooltip text="Next play (N)" block>
      <button
        type="button"
        onClick={onNextGame}
        className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700"
      >
        Next Play ({roundsPlayed}/{totalGames})
      </button>
    </Tooltip>
  );
}
