import { toPng } from 'html-to-image';
import { useEffect, useRef, useState } from 'react';

import { getCumulativeScore } from '../../lib/scoreCalculation.ts';
import type { GameRound, Player } from '../../types/index.ts';
import { CloseIcon, DownloadIcon } from '../shared/Icons.tsx';
import PlayerAvatar from '../shared/PlayerAvatar.tsx';
import { Tooltip } from '../shared/Tooltip.tsx';

interface GameCompletePopupProps {
  players: Player[];
  rounds: GameRound[];
  onClose: () => void;
  onNewGame: () => void;
  onRematch: () => void;
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

function toFileName(names: string[]): string {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  // Single winner uses their name; a tie falls back to "winners".
  const who = names.length === 1 ? names[0].replace(/[^a-z0-9-]+/gi, '_').replace(/^_+|_+$/g, '') : 'winners';
  return `management-${date}-${who || 'winners'}.png`;
}

export default function GameCompletePopup({ players, rounds, onClose, onNewGame, onRematch }: GameCompletePopupProps) {
  const confettiRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);

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

  const handleDownload = async () => {
    if (!cardRef.current || downloading) return;
    setDownloadError(false);
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, backgroundColor: '#ffffff', cacheBust: true });
      const link = document.createElement('a');
      link.download = toFileName(winners.map((w) => w.player.name));
      link.href = dataUrl;
      link.click();
    } catch {
      setDownloadError(true);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <div ref={confettiRef} className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden="true" />

      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-complete-title"
      >
        <div className="relative w-full max-w-[min(28rem,calc(100vw-40px))] animate-fade-slide-up overflow-hidden rounded-lg bg-white shadow-xl">
          <Tooltip text="Close (Esc)">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 z-10 text-gray-500 hover:text-gray-900"
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </Tooltip>

          {/* Captured region for the downloadable PNG (excludes close + action buttons). */}
          <div ref={cardRef} className="bg-white px-6 pt-7 pb-5">
            <div className="mb-4 flex animate-winner-bounce flex-col items-center gap-1 py-2">
              <span className="animate-crown-float text-5xl">&#x1F451;</span>
              <span className="text-gray-500 text-sm">Congratulations</span>
              <h2 id="game-complete-title" className="text-center font-bold text-2xl text-gray-900">
                {winners.map((w) => w.player.name).join(' & ')}
              </h2>
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
                    className={`flex items-center justify-between rounded-lg border-2 px-4 py-3 ${
                      s.score === topScore ? 'border-amber-400 bg-amber-50' : 'border-transparent bg-gray-50'
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

            <p className="mt-5 text-center text-[11px] text-gray-400 uppercase tracking-wider">Management Score Pad</p>
          </div>

          <div className="border-gray-200 border-t px-4 py-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onRematch}
                className="flex-1 rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700"
              >
                Rematch
              </button>
              <button
                type="button"
                onClick={onNewGame}
                className="flex-1 rounded-lg border border-gray-300 py-2 font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600"
              >
                New Game
              </button>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 py-2 font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <DownloadIcon className="h-4 w-4" />
              {downloading ? 'Preparing…' : 'Download PNG'}
            </button>
          </div>
          {downloadError && (
            <p className="px-4 pb-3 text-center text-red-600 text-xs" role="alert">
              Could not generate image. Please try again.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
