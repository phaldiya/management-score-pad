import { isSuitRed } from '../../lib/gameLogic.ts';
import type { Suit } from '../../types/index.ts';
import { SuitIcon } from '../shared/Icons.tsx';

interface PlayCardProps {
  cardCount: number;
  trump: Suit;
  size?: 'sm' | 'lg';
  highlight?: boolean;
}

export default function PlayCard({ cardCount, trump, size = 'lg', highlight }: PlayCardProps) {
  const isRed = isSuitRed(trump);
  const textColor = isRed ? 'text-red-600' : 'text-gray-900';

  if (size === 'sm') {
    return (
      <div className="relative flex h-14 w-10 flex-col items-center justify-center rounded border border-gray-300 bg-white shadow-sm">
        <span className={`absolute top-0 left-0.5 font-bold text-[10px] ${textColor}`}>{cardCount}</span>
        <span className={highlight ? 'animate-flip-y' : ''}>
          <SuitIcon suit={trump} className="h-4 w-4" />
        </span>
        <span className={`absolute right-0.5 bottom-0 rotate-180 font-bold text-[10px] ${textColor}`}>{cardCount}</span>
      </div>
    );
  }

  return (
    <div className="relative flex h-36 w-24 flex-col items-center justify-center rounded-lg border-2 border-gray-300 bg-white shadow-md">
      <span className={`absolute top-1.5 left-2 font-bold text-sm ${textColor}`}>{cardCount}</span>
      <SuitIcon suit={trump} className="h-10 w-10" />
      <span className={`absolute right-2 bottom-1.5 rotate-180 font-bold text-sm ${textColor}`}>{cardCount}</span>
    </div>
  );
}
