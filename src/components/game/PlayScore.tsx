import { useEffect, useRef, useState } from 'react';

import type { PlayerRoundData, RoundPhase } from '../../types/index.ts';
import AnimatedNumber from '../shared/AnimatedNumber.tsx';

const CONFETTI_COLORS = ['#f59e0b', '#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#ec4899'];

function MiniConfetti() {
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 360;
    const rad = (angle * Math.PI) / 180;
    const distance = 15 + Math.random() * 10;
    const x = Math.cos(rad) * distance;
    const y = Math.sin(rad) * distance;
    const rotation = Math.random() * 720 - 360;
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const shape = Math.random() > 0.5 ? '50%' : '2px';
    return { x, y, rotation, color, shape, delay: Math.random() * 0.15 };
  });

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-visible" aria-hidden="true">
      {particles.map((p, i) => (
        <div
          key={i}
          className="mini-confetti-piece"
          style={
            {
              left: '50%',
              top: '50%',
              backgroundColor: p.color,
              borderRadius: p.shape,
              '--x': `${p.x}px`,
              '--y': `${p.y}px`,
              '--r': `${p.rotation}deg`,
              animationDelay: `${p.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

interface PlayScoreProps {
  playerData: PlayerRoundData;
  phase: RoundPhase;
}

export default function PlayScore({ playerData, phase }: PlayScoreProps) {
  const { bid, result, score, isDealer } = playerData;
  const prevPhaseRef = useRef(phase);

  const [showConfetti, setShowConfetti] = useState(false);
  const [showCellHighlight, setShowCellHighlight] = useState(false);
  const [animateScore, setAnimateScore] = useState(false);

  useEffect(() => {
    const justCompleted = prevPhaseRef.current !== 'completed' && phase === 'completed';
    prevPhaseRef.current = phase;

    if (justCompleted) {
      setShowCellHighlight(true);
      setAnimateScore(true);
      if (score != null && score > 0) {
        setShowConfetti(true);
      }
      const timer = setTimeout(() => {
        setShowConfetti(false);
        setShowCellHighlight(false);
        setAnimateScore(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [phase, score]);

  let bgColor = 'bg-yellow-50';
  if (phase === 'completed') {
    bgColor = score && score > 0 ? 'bg-green-50' : 'bg-red-50';
  }

  const resultDisplay = phase === 'completed' ? result : '-';
  return (
    <td
      className={`relative h-16 min-w-20 border border-gray-200 px-2 py-1 ${bgColor} ${showCellHighlight ? 'animate-cell-highlight' : ''}`}
    >
      {showConfetti && <MiniConfetti />}
      <div className="flex h-full flex-col items-center justify-center">
        <div
          className={`inline-flex items-start font-bold text-lg leading-tight ${phase === 'completed' ? (score && score > 0 ? 'text-green-700' : 'text-red-600') : 'text-gray-900'}`}
        >
          {phase === 'completed' ? animateScore ? <AnimatedNumber value={score ?? 0} /> : score : '-'}
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
