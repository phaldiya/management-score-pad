import { useState } from 'react';

import { useAppContext } from '../../context/AppContext.tsx';
import { DEFAULT_AVATAR } from '../../lib/avatars.ts';
import AvatarPicker from '../shared/AvatarPicker.tsx';
import { PlusIcon } from '../shared/Icons.tsx';
import PlayerAvatar from '../shared/PlayerAvatar.tsx';
import { Tooltip } from '../shared/Tooltip.tsx';

export default function AddPlayerInline() {
  const { state, dispatch } = useAppContext();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [pickerOpen, setPickerOpen] = useState(false);

  const trimmed = name.trim();
  const isDuplicate = trimmed.length > 0 && state.players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase());
  const canAdd = trimmed.length > 0 && !isDuplicate;

  const handleAdd = () => {
    if (!canAdd) return;
    const newPlayer = { id: crypto.randomUUID(), name: trimmed, avatar };
    dispatch({ type: 'SET_PLAYERS', players: [...state.players, newPlayer] });
    dispatch({ type: 'START_GAME' });
    setName('');
    setAvatar(DEFAULT_AVATAR);
  };

  return (
    <div className="mt-4 flex flex-col items-center">
      <div className="flex items-center gap-2">
        <Tooltip text="Change avatar">
          <button
            type="button"
            onClick={() => setPickerOpen(!pickerOpen)}
            className="rounded-full border-2 border-transparent hover:border-blue-400"
            aria-label="Change avatar for new player"
          >
            <PlayerAvatar avatar={avatar} name="New player" size="sm" />
          </button>
        </Tooltip>
        {pickerOpen && (
          <AvatarPicker
            selected={avatar}
            onSelect={setAvatar}
            onClose={() => setPickerOpen(false)}
            playerName={name.trim() || `Player ${state.players.length + 1}`}
          />
        )}
        <input
          type="text"
          placeholder={`Player ${state.players.length + 1}`}
          aria-label={`Player ${state.players.length + 1} name`}
          aria-invalid={isDuplicate || undefined}
          aria-describedby={isDuplicate ? 'add-player-error' : undefined}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className={`w-40 rounded-lg border px-3 py-1.5 text-gray-900 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-1 ${
            isDuplicate
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
        />
        <button
          type="button"
          disabled={!canAdd}
          onClick={handleAdd}
          className="flex items-center gap-1 rounded-lg border border-gray-300 border-dashed px-3 py-1.5 text-gray-700 text-sm hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-300 disabled:hover:text-gray-700"
        >
          <PlusIcon className="h-4 w-4" />
          Add
        </button>
      </div>
      {isDuplicate && (
        <p id="add-player-error" className="mt-1 text-red-600 text-xs" role="alert">
          Duplicate player name
        </p>
      )}
    </div>
  );
}
