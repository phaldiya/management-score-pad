import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { AVATAR_CATEGORIES, getAvatarDataUri } from '../../lib/avatars.ts';

interface AvatarPickerProps {
  selected: string;
  onSelect: (avatar: string) => void;
  onClose: () => void;
}

export default function AvatarPicker({ selected, onSelect, onClose }: AvatarPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: 'hidden' });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const s: React.CSSProperties = { visibility: 'visible' };

    // Horizontal: keep within viewport
    if (rect.right > vw) {
      const overflow = rect.right - vw + 8;
      s.left = `-${overflow}px`;
    }
    // Vertical: if overflows bottom, flip above trigger
    if (rect.bottom > vh) {
      s.bottom = '100%';
      s.top = 'auto';
      s.marginBottom = '4px';
      s.marginTop = '0';
    }
    setStyle(s);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={style}
      className="absolute top-full left-0 z-40 mt-1 w-[21rem] max-w-[calc(100vw-1rem)] rounded-lg border border-gray-200 bg-white p-3 shadow-lg sm:w-[26rem]"
    >
      {AVATAR_CATEGORIES.map((cat) => (
        <div key={cat.label} className="mb-2 last:mb-0">
          <span className="mb-1 block font-semibold text-[10px] text-gray-600 uppercase tracking-wider">
            {cat.label}
          </span>
          <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
            {cat.avatars.map((avatar, i) => (
              <button
                key={avatar}
                type="button"
                aria-label={`Select ${avatar} avatar`}
                onClick={() => {
                  onSelect(avatar);
                  onClose();
                }}
                className={`h-9 w-9 overflow-hidden rounded-full border-2 transition-all ${i >= 8 ? 'hidden sm:block' : ''} ${
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
  );
}
