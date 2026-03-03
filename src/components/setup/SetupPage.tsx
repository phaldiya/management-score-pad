import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppContext } from '../../context/AppContext.tsx';
import { DEFAULT_AVATAR } from '../../lib/avatars.ts';
import { clearActiveGame, loadActiveGame } from '../../lib/storage.ts';
import type { AppState } from '../../types/index.ts';
import AvatarPicker from '../shared/AvatarPicker.tsx';
import { AppIcon, PlusIcon, TrashIcon } from '../shared/Icons.tsx';
import PlayerAvatar from '../shared/PlayerAvatar.tsx';
import RestoreGamePopup from './RestoreGamePopup.tsx';

export default function SetupPage() {
  const { dispatch } = useAppContext();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<{ name: string; avatar: string }[]>([
    { name: '', avatar: DEFAULT_AVATAR },
    { name: '', avatar: DEFAULT_AVATAR },
    { name: '', avatar: DEFAULT_AVATAR },
  ]);
  const [savedGame, setSavedGame] = useState<AppState | null>(null);
  const [pickerOpen, setPickerOpen] = useState<number | null>(null);

  useEffect(() => {
    const saved = loadActiveGame();
    if (saved && saved.gamePhase === 'playing') {
      const allCompleted =
        saved.rounds.length === saved.totalGames && saved.rounds.every((r) => r.phase === 'completed');
      if (!allCompleted) {
        setSavedGame(saved);
      }
    }
  }, []);

  const handleRestore = () => {
    if (savedGame) {
      dispatch({ type: 'LOAD_STATE', state: savedGame });
      navigate('/game');
    }
  };

  const handleStartNew = () => {
    clearActiveGame();
    setSavedGame(null);
  };

  const updateName = (index: number, value: string) => {
    const updated = [...players];
    updated[index] = { ...updated[index], name: value };
    setPlayers(updated);
  };

  const updateAvatar = (index: number, avatar: string) => {
    const updated = [...players];
    updated[index] = { ...updated[index], avatar };
    setPlayers(updated);
  };

  const addPlayer = () => {
    setPlayers([...players, { name: '', avatar: DEFAULT_AVATAR }]);
  };

  const removePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const trimmedNames = players.map((p) => p.name.trim());
  const filledPlayers = players.filter((p) => p.name.trim().length > 0);
  const allFilled = trimmedNames.every((n) => n.length > 0);

  // Duplicate detection (case-insensitive)
  const duplicateIndices = new Set<number>();
  for (let i = 0; i < trimmedNames.length; i++) {
    if (trimmedNames[i].length === 0) continue;
    for (let j = i + 1; j < trimmedNames.length; j++) {
      if (trimmedNames[j].length === 0) continue;
      if (trimmedNames[i].toLowerCase() === trimmedNames[j].toLowerCase()) {
        duplicateIndices.add(i);
        duplicateIndices.add(j);
      }
    }
  }

  const hasDuplicates = duplicateIndices.size > 0;
  const canStart = filledPlayers.length >= 3 && !hasDuplicates;

  const handleStart = () => {
    const gamePlayers = filledPlayers.map((p) => ({
      id: crypto.randomUUID(),
      name: p.name.trim(),
      avatar: p.avatar,
    }));
    dispatch({ type: 'SET_PLAYERS', players: gamePlayers });
    dispatch({ type: 'START_GAME' });
    navigate('/game');
  };

  return (
    <div className="flex min-h-[calc(100dvh-57px)] items-center justify-center bg-gray-50 p-4">
      {savedGame && <RestoreGamePopup savedState={savedGame} onRestore={handleRestore} onStartNew={handleStartNew} />}

      <div className="flex w-full max-w-3xl items-center gap-8">
        <div className="hidden shrink-0 items-center justify-center self-stretch md:flex">
          <AppIcon className="h-80 w-80" />
        </div>

        <div className="w-full max-w-md">
          <div className="mb-6 md:hidden">
            <div className="flex flex-col items-center gap-2 text-center">
              <AppIcon className="h-20 w-20" />
              <h2 className="font-bold text-2xl text-gray-900">Management (Judgement)</h2>
            </div>
          </div>

          <h2 className="mb-1 hidden text-center font-bold text-3xl text-gray-900 md:block">Management (Judgement)</h2>
          <p className="mb-4 text-center text-gray-500 text-sm">Enter player names to start a new game</p>

          <div className="space-y-3">
            {players.map((player, index) => (
              <div key={index}>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setPickerOpen(pickerOpen === index ? null : index)}
                      className="rounded-full border-2 border-transparent hover:border-blue-400"
                    >
                      <PlayerAvatar avatar={player.avatar} name={player.name || `Player ${index + 1}`} size="md" />
                    </button>
                    {pickerOpen === index && (
                      <AvatarPicker
                        selected={player.avatar}
                        onSelect={(avatar) => updateAvatar(index, avatar)}
                        onClose={() => setPickerOpen(null)}
                      />
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder={`Player ${index + 1}`}
                    value={player.name}
                    onChange={(e) => updateName(index, e.target.value)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 ${
                      duplicateIndices.has(index)
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                  />
                  {index >= 3 && (
                    <button
                      type="button"
                      onClick={() => removePlayer(index)}
                      className="rounded-lg border border-gray-300 p-2 text-gray-400 hover:border-red-300 hover:text-red-500"
                      aria-label={`Remove player ${index + 1}`}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
                {duplicateIndices.has(index) && <p className="mt-1 text-red-500 text-xs">Duplicate player name</p>}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addPlayer}
            disabled={!allFilled}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 border-dashed py-2 text-gray-500 text-sm hover:border-blue-400 hover:text-blue-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-300 disabled:hover:text-gray-500"
          >
            <PlusIcon className="h-4 w-4" />
            Add Player
          </button>

          <button
            type="button"
            disabled={!canStart}
            onClick={handleStart}
            className="mt-6 w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
          >
            Start Game {canStart && `(${filledPlayers.length} players)`}
          </button>
        </div>
      </div>
    </div>
  );
}
