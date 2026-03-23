import { useEffect } from 'react';

import { AVATAR_CATEGORIES, getAvatarDataUri } from '../../lib/avatars.ts';
import { CloseIcon } from './Icons.tsx';
import { Tooltip } from './Tooltip.tsx';

interface AvatarPickerProps {
  selected: string;
  onSelect: (avatar: string) => void;
  onClose: () => void;
  playerName: string;
}

export default function AvatarPicker({ selected, onSelect, onClose, playerName }: AvatarPickerProps) {
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
      aria-labelledby="avatar-picker-title"
    >
      <div className="w-full max-w-[min(28rem,calc(100vw-40px))] rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-gray-200 border-b px-4 py-3">
          <h2 id="avatar-picker-title" className="font-bold text-gray-900">
            Pick an avatar for {playerName}
          </h2>
          <Tooltip text="Close">
            <button type="button" onClick={onClose} className="text-gray-600 hover:text-gray-900" aria-label="Close">
              <CloseIcon />
            </button>
          </Tooltip>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-4">
          {AVATAR_CATEGORIES.map((cat) => (
            <div key={cat.label} className="mb-3 last:mb-0">
              <span className="mb-1 block font-semibold text-[10px] text-gray-600 uppercase tracking-wider">
                {cat.label}
              </span>
              <div className="grid grid-cols-10 gap-1.5">
                {cat.avatars.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    aria-label={`Select ${avatar} avatar`}
                    onClick={() => {
                      onSelect(avatar);
                      onClose();
                    }}
                    className={`aspect-square w-full overflow-hidden rounded-full border-2 transition-all ${
                      selected === avatar
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img src={getAvatarDataUri(avatar)} alt={avatar} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
