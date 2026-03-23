import { useEffect, useRef } from 'react';

import { getCumulativeScore } from '../../lib/scoreCalculation.ts';
import type { GameRound, Player } from '../../types/index.ts';
import { CloseIcon } from '../shared/Icons.tsx';
import PlayerAvatar from '../shared/PlayerAvatar.tsx';
import { Tooltip } from '../shared/Tooltip.tsx';

interface GameCompletePopupProps {
  players: Player[];
  rounds: GameRound[];
  onClose: () => void;
  onNewGame: () => void;
}

const CONFETTI_COLORS = ['#f59e0b', '#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#14b8a6'];

function spawnConfetti(container: HTMLDivElement) {
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const left = Math.random() * 100;
    const size = 6 + Math.random() * 8;
    const duration = 2 + Math.random() * 3;
    const delay = Math.random() * 1.5;
    const shape = Math.random() > 0.5 ? '50%' : '0';

    piece.style.left = `${left}%`;
    piece.style.width = `${size}px`;
    piece.style.height = `${size}px`;
    piece.style.backgroundColor = color;
    piece.style.borderRadius = shape;
    piece.style.animationDuration = `${duration}s`;
    piece.style.animationDelay = `${delay}s`;

    container.appendChild(piece);
  }
}

export default function GameCompletePopup({ players, rounds, onClose, onNewGame }: GameCompletePopupProps) {
  const confettiRef = useRef<HTMLDivElement>(null);

  const lastIndex = rounds.length - 1;
  const standings = players
    .map((p) => ({
      player: p,
      score: getCumulativeScore(rounds, p.id, lastIndex),
    }))
    .sort((a, b) => b.score - a.score);

  const topScore = standings[0].score;
  const winners = standings.filter((s) => s.score === topScore);

  useEffect(() => {
    if (confettiRef.current) {
      spawnConfetti(confettiRef.current);
    }
  }, []);

  return (
    <>
      <div ref={confettiRef} className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden="true" />

      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-complete-title"
      >
        <div className="w-full max-w-[min(28rem,calc(100vw-40px))] animate-fade-slide-up rounded-lg bg-white shadow-xl">
          <div className="flex items-center justify-between border-gray-200 border-b px-4 py-3">
            <h2 id="game-complete-title" className="font-bold text-gray-900 text-lg">
              Game Complete!
            </h2>
            <Tooltip text="Close (Esc)">
              <button type="button" onClick={onClose} className="text-gray-600 hover:text-gray-900" aria-label="Close">
                <CloseIcon />
              </button>
            </Tooltip>
          </div>

          <div className="p-4">
            <div className="mb-4 flex animate-winner-bounce flex-col items-center gap-1 py-2">
              <span className="animate-crown-float text-5xl">&#x1F451;</span>
              <span className="text-gray-500 text-sm">Congratulations</span>
              <span className="font-bold text-2xl text-gray-900">{winners.map((w) => w.player.name).join(' & ')}</span>
              <span className="font-bold text-amber-500 text-lg">{topScore} pts</span>
            </div>

            <h3 className="mb-3 text-center font-semibold text-gray-700 text-sm uppercase tracking-wider">
              Final Standings
            </h3>
            <div className="space-y-2">
              {standings.map((s, index) => {
                const rank = standings.findIndex((x) => x.score === s.score) + 1;
                return (
                  <div
                    key={s.player.id}
                    className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                      s.score === topScore ? 'bg-amber-50 ring-2 ring-amber-400' : 'bg-gray-50'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-bold text-sm ${
                          s.score === topScore ? 'bg-amber-400 text-white' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {rank}
                      </span>
                      <PlayerAvatar avatar={s.player.avatar} name={s.player.name} size="sm" />
                      <span className="font-medium text-gray-900">{s.player.name}</span>
                    </div>
                    <span className="font-bold text-blue-600 text-lg">{s.score}</span>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onNewGame}
              className="mt-4 w-full rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700"
            >
              Start New Game
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
