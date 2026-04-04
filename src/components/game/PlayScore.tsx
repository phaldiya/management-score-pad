import { useRef } from 'react';

import type { PlayerRoundData, RoundPhase } from '../../types/index.ts';
import AnimatedNumber from '../shared/AnimatedNumber.tsx';

interface PlayScoreProps {
  playerData: PlayerRoundData;
  phase: RoundPhase;
}

export default function PlayScore({ playerData, phase }: PlayScoreProps) {
  const { bid, result, score, isDealer } = playerData;
  const prevPhaseRef = useRef(phase);
  const justCompleted = prevPhaseRef.current !== 'completed' && phase === 'completed';
  prevPhaseRef.current = phase;

  let bgColor = 'bg-yellow-50';
  if (phase === 'completed') {
    bgColor = score && score > 0 ? 'bg-green-50' : 'bg-red-50';
  }

  const resultDisplay = phase === 'completed' ? result : '-';

  return (
    <td
      className={`h-16 min-w-20 border border-gray-200 px-2 py-1 ${bgColor} ${justCompleted ? 'animate-cell-highlight' : ''}`}
    >
      <div className="flex h-full flex-col items-center justify-center">
        <div
          className={`inline-flex items-start font-bold text-lg leading-tight ${phase === 'completed' ? (score && score > 0 ? 'text-green-700' : 'text-red-600') : 'text-gray-900'}`}
        >
          {phase === 'completed' ? justCompleted ? <AnimatedNumber value={score ?? 0} /> : score : '-'}
          {isDealer && (
            <img src={`${import.meta.env.BASE_URL}dealer.png`} alt="Dealer" className="-mt-0.5 ml-0.5 h-3 w-3" />
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-1 text-xs leading-tight">
          <span className="rounded-full bg-blue-100 px-1.5 py-0.5 font-medium text-blue-700">{bid}</span>
          <span className="text-gray-300">/</span>
          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-700">
            {resultDisplay}
          </span>
        </div>
      </div>
    </td>
  );
}
