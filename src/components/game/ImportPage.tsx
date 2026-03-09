import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAppContext } from '../../context/AppContext.tsx';
import { decompressState } from '../../lib/transfer.ts';
import type { AppState } from '../../types/index.ts';

export default function ImportPage() {
  const [searchParams] = useSearchParams();
  const { state: currentState, dispatch } = useAppContext();
  const navigate = useNavigate();

  const [importedState, setImportedState] = useState<AppState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const encoded = searchParams.get('d');
  const hasExistingGame = currentState.gamePhase === 'playing' && currentState.gameId !== null;

  useEffect(() => {
    let cancelled = false;

    async function decode() {
      if (!encoded) {
        setError('No game data found in the link.');
        setLoading(false);
        return;
      }

      try {
        const state = await decompressState(encoded);
        if (!cancelled) {
          setImportedState(state);
        }
      } catch {
        if (!cancelled) {
          setError('Invalid or corrupted game data. The link may be incomplete or tampered with.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    decode();
    return () => {
      cancelled = true;
    };
  }, [encoded]);

  function handleImport() {
    if (!importedState) return;
    dispatch({ type: 'LOAD_STATE', state: importedState });
    navigate('/game');
  }

  function handleCancel() {
    navigate(hasExistingGame ? '/game' : '/');
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-2 font-bold text-gray-900 text-lg">Import Failed</h2>
          <p className="mb-4 text-gray-600 text-sm">{error}</p>
          <button
            type="button"
            className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            onClick={handleCancel}
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (!importedState) return null;

  const completedRounds = importedState.rounds.filter((r) => r.phase === 'completed').length;
  const playerNames = importedState.players.map((p) => p.name).join(', ');

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 font-bold text-gray-900 text-lg">Import Game</h2>

        <div className="mb-4 rounded-lg bg-gray-50 p-3">
          <p className="font-medium text-gray-900 text-sm">{importedState.players.length} Players</p>
          <p className="text-gray-600 text-sm">{playerNames}</p>
          <p className="mt-1 text-gray-600 text-sm">
            Round {completedRounds}/{importedState.totalGames} completed
          </p>
        </div>

        {hasExistingGame && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="font-medium text-amber-800 text-sm">Warning: Active game in progress</p>
            <p className="text-amber-700 text-xs">Importing will replace your current game.</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            className="flex-1 rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            onClick={handleImport}
          >
            Import Game
          </button>
          <button
            type="button"
            className="flex-1 rounded bg-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-300"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
