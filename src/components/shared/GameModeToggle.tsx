import { useAppContext } from '../../context/AppContext.tsx';
import type { GameMode } from '../../types/index.ts';
import { Tooltip } from './Tooltip.tsx';

export const GAME_MODES: { value: GameMode; label: string; activeClass: string; rules: string[] }[] = [
  {
    value: 'classic',
    label: 'Classic',
    activeClass: 'bg-blue-600 text-white shadow-sm',
    rules: ['Exact bid scores bid × 10', 'Zero bid scores 10', 'Missed bid scores 0'],
  },
  {
    value: 'advance',
    label: 'Advance',
    activeClass: 'bg-green-500 text-white shadow-sm',
    rules: ['Exact bid scores 10 + bid', 'Zero bid scores 10', 'Missed bid scores 0'],
  },
  {
    value: 'pro',
    label: 'Pro',
    activeClass: 'bg-purple-600 text-white shadow-sm',
    rules: ['Exact bid scores 10 + bid', 'Zero bid scores 10', 'Missed bid scores −bid', 'Missed zero bid scores −1'],
  },
];

export function GameModeToggle({ className = '', showHint = false }: { className?: string; showHint?: boolean }) {
  const { state, dispatch } = useAppContext();
  const activeMode = GAME_MODES.find((m) => m.value === state.gameMode) ?? GAME_MODES[0];

  const toggle = (
    <fieldset className={`inline-flex rounded-full border border-gray-300 bg-gray-100 p-0.5 ${className}`}>
      <legend className="sr-only">Game mode</legend>
      {GAME_MODES.map((mode) => {
        const active = state.gameMode === mode.value;
        return (
          <Tooltip key={mode.value} text={mode.rules.join(' · ')}>
            <button
              type="button"
              aria-pressed={active}
              onClick={() => dispatch({ type: 'SET_GAME_MODE', mode: mode.value })}
              className={`rounded-full px-2.5 py-0.5 font-medium text-xs transition-colors focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 ${
                active ? mode.activeClass : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {mode.label}
            </button>
          </Tooltip>
        );
      })}
    </fieldset>
  );

  if (!showHint) return toggle;

  return (
    <div className="inline-flex flex-col items-center gap-1.5">
      {toggle}
      {/* key remounts on mode change so the fade-in replays */}
      <ul
        key={activeMode.value}
        aria-live="polite"
        className="animate-fade-in list-disc pl-4 text-left text-gray-500 text-xs"
      >
        {activeMode.rules.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
    </div>
  );
}
