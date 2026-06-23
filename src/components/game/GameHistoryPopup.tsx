import { useState } from 'react';

import { clearGameHistory, deleteHistoryEntry, type GameHistoryEntry, loadGameHistory } from '../../lib/storage.ts';
import { CloseIcon, HistoryIcon, TrashIcon } from '../shared/Icons.tsx';
import PlayerAvatar from '../shared/PlayerAvatar.tsx';
import { Tooltip } from '../shared/Tooltip.tsx';

interface GameHistoryPopupProps {
  gameInProgress: boolean;
  onRematch: (players: { name: string; avatar: string }[]) => void;
  onClose: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function GameHistoryPopup({ gameInProgress, onRematch, onClose }: GameHistoryPopupProps) {
  const [entries, setEntries] = useState<GameHistoryEntry[]>(() => loadGameHistory());
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    deleteHistoryEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleClear = () => {
    clearGameHistory();
    setEntries([]);
  };

  const handleRematch = (entry: GameHistoryEntry) => {
    if (gameInProgress && confirmId !== entry.id) {
      setConfirmId(entry.id);
      return;
    }
    onRematch(entry.players.map((p) => ({ name: p.name, avatar: p.avatar })));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-history-title"
    >
      <div className="flex max-h-[85vh] w-full max-w-[min(32rem,calc(100vw-40px))] flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-gray-200 border-b px-4 py-3">
          <h2 id="game-history-title" className="flex items-center gap-2 font-bold text-gray-900">
            <HistoryIcon className="h-5 w-5 text-gray-500" />
            Game History
          </h2>
          <Tooltip text="Close (Esc)">
            <button type="button" onClick={onClose} className="text-gray-600 hover:text-gray-900" aria-label="Close">
              <CloseIcon />
            </button>
          </Tooltip>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <HistoryIcon className="h-10 w-10 text-gray-300" />
              <p className="text-gray-600 text-sm">No finished games yet.</p>
              <p className="text-gray-400 text-xs">Completed games show up here so you can rematch the same players.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {entries.map((entry) => {
                const ranked = [...entry.players].sort((a, b) => b.score - a.score);
                return (
                  <li key={entry.id} className="rounded-lg border border-gray-200 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-gray-500 text-xs">{formatDate(entry.completedAt)}</span>
                      <Tooltip text="Delete from history">
                        <button
                          type="button"
                          onClick={() => handleDelete(entry.id)}
                          className="text-gray-400 hover:text-red-500"
                          aria-label="Delete game from history"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </Tooltip>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                      {ranked.map((p) => {
                        const isWinner = entry.winnerNames.includes(p.name);
                        return (
                          <span key={p.name} className="flex items-center gap-1.5 text-sm">
                            <PlayerAvatar avatar={p.avatar} name={p.name} size="xs" />
                            <span className={isWinner ? 'font-bold text-gray-900' : 'text-gray-700'}>
                              {isWinner && (
                                <span role="img" aria-label="Winner">
                                  &#x1F451;{' '}
                                </span>
                              )}
                              {p.name}
                            </span>
                            <span className="font-medium text-gray-400">{p.score}</span>
                          </span>
                        );
                      })}
                    </div>
                    {confirmId === entry.id ? (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="flex-1 text-amber-700 text-xs">End current game and rematch?</span>
                        <button
                          type="button"
                          onClick={() => handleRematch(entry)}
                          className="rounded bg-blue-600 px-3 py-1.5 font-medium text-sm text-white hover:bg-blue-700"
                        >
                          Yes, rematch
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          className="rounded bg-gray-200 px-3 py-1.5 font-medium text-gray-700 text-sm hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRematch(entry)}
                        className="mt-3 w-full rounded-lg border border-gray-300 py-1.5 font-medium text-gray-700 text-sm hover:border-blue-400 hover:text-blue-600"
                      >
                        Rematch these players
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {entries.length > 0 && (
          <div className="border-gray-200 border-t px-4 py-3">
            <button
              type="button"
              onClick={handleClear}
              className="w-full rounded-lg py-2 font-medium text-gray-500 text-sm hover:bg-gray-100 hover:text-red-600"
            >
              Clear all history
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
