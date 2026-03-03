import { useCallback, useEffect } from 'react';

import type { AppState } from '../../types/index.ts';

interface RestoreGamePopupProps {
  savedState: AppState;
  onRestore: () => void;
  onStartNew: () => void;
}

export default function RestoreGamePopup({ savedState, onRestore, onStartNew }: RestoreGamePopupProps) {
  const completedRounds = savedState.rounds.filter((r) => r.phase === 'completed').length;
  const playerNames = savedState.players.map((p) => p.name).join(', ');

  const restoreRef = useCallback((el: HTMLButtonElement | null) => el?.focus(), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onStartNew();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onStartNew]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 font-bold text-gray-900 text-xl">Unfinished Game Found</h2>
        <div className="mb-6 space-y-2 text-gray-600 text-sm">
          <p>
            <span className="font-medium text-gray-800">Players:</span> {playerNames}
          </p>
          <p>
            <span className="font-medium text-gray-800">Progress:</span> {completedRounds} / {savedState.totalGames}{' '}
            rounds completed
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            ref={restoreRef}
            className="flex-1 rounded bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
            onClick={onRestore}
          >
            Restore Game
          </button>
          <button
            type="button"
            className="flex-1 rounded bg-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-300"
            onClick={onStartNew}
          >
            Start New Game
          </button>
        </div>
      </div>
    </div>
  );
}
