import { useState } from 'react';

import { useAppContext } from '../../context/AppContext.tsx';
import type { GameMode } from '../../types/index.ts';
import { GAME_MODES } from './GameModeToggle.tsx';
import { AppIcon, CloseIcon } from './Icons.tsx';

interface GameModeSwitchPopupProps {
  initialMode?: GameMode;
  onClose: () => void;
}

export function GameModeSwitchPopup({ initialMode, onClose }: GameModeSwitchPopupProps) {
  const { state, dispatch } = useAppContext();
  const [selected, setSelected] = useState<GameMode>(initialMode ?? state.gameMode);
  const hasCompletedRounds = state.rounds.some((r) => r.phase === 'completed');

  const confirmSwitch = () => {
    dispatch({ type: 'SET_GAME_MODE', mode: selected });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mode-switch-title"
    >
      <div className="w-full max-w-[min(24rem,calc(100vw-40px))] rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-gray-200 border-b px-4 py-3">
          <h2 id="mode-switch-title" className="font-bold text-gray-900">
            Switch Game Mode
          </h2>
          <button type="button" onClick={onClose} className="text-gray-600 hover:text-gray-900" aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <div className="p-4">
          <div className="mb-3 space-y-2">
            {GAME_MODES.map((mode) => {
              const isSelected = selected === mode.value;
              return (
                <button
                  key={mode.value}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelected(mode.value)}
                  className={`w-full rounded-lg border p-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 ${
                    isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <AppIcon className="h-6 w-6" mode={mode.value} badgeClassName="h-3 w-3" />
                    <span className={`rounded-full px-2 py-0.5 font-medium text-xs ${mode.activeClass}`}>
                      {mode.label}
                    </span>
                    {mode.value === state.gameMode && (
                      <span className="ml-auto rounded-full bg-gray-700 px-2 py-0.5 font-medium text-[10px] text-white">
                        Current
                      </span>
                    )}
                  </span>
                  <span className="mt-1.5 block space-y-0.5 pl-2 text-gray-500 text-xs">
                    {mode.rules.map((rule) => (
                      <span key={rule} className="flex items-baseline gap-1.5">
                        <span aria-hidden="true" className="text-gray-400">
                          &bull;
                        </span>
                        {rule}
                      </span>
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
          {hasCompletedRounds && (
            <p className="mb-4 text-gray-600 text-sm">
              Switching re-scores all completed plays under the new rules &mdash; standings may change.
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              disabled={selected === state.gameMode}
              className="flex-1 rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              onClick={confirmSwitch}
            >
              Switch Mode
            </button>
            <button
              type="button"
              className="flex-1 rounded bg-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-300"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
