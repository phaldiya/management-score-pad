import { useEffect } from 'react';

import { CloseIcon } from './Icons.tsx';
import { Kbd } from './Kbd.tsx';

interface KeyboardShortcutsPopupProps {
  onClose: () => void;
}

const shortcuts = [
  { label: 'Next Action', keys: ['N'], description: 'Start Play / Enter Results / Next Play' },
  { label: 'Play Details', keys: ['P'], description: 'View current play details' },
  { label: 'Download PDF', keys: ['⌘', 'P'], description: 'Download scoreboard as PDF' },
  { label: 'Transfer Game', keys: ['Shift', 'S'], description: 'Share game to another device' },
  { label: 'New Game', keys: ['Shift', 'N'], description: 'Start a new game' },
  { label: 'Delete Last Play', keys: ['Shift', 'D'], description: 'Delete the last completed play' },
  { label: 'Close Popup', keys: ['Esc'], description: 'Dismiss any open dialog' },
  { label: 'Show This Help', keys: ['?'], description: 'Open keyboard shortcuts' },
] as const;

export function KeyboardShortcutsPopup({ onClose }: KeyboardShortcutsPopupProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-shortcuts-title"
    >
      <div className="w-full max-w-[min(24rem,calc(100vw-40px))] rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-gray-200 border-b px-4 py-3">
          <h2 id="keyboard-shortcuts-title" className="font-bold text-gray-900">
            Keyboard Shortcuts
          </h2>
          <button type="button" onClick={onClose} className="text-gray-600 hover:text-gray-900" aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <ul className="divide-y divide-gray-100">
          {shortcuts.map((shortcut) => (
            <li key={shortcut.label} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="font-medium text-gray-900 text-sm">{shortcut.label}</div>
                <div className="text-gray-700 text-xs">{shortcut.description}</div>
              </div>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
