import { useEffect, useState } from 'react';

import { useAppContext } from '../../context/AppContext.tsx';
import { getCumulativeScore } from '../../lib/scoreCalculation.ts';
import { buildTransferUrl, generateQrDataUrl } from '../../lib/transfer.ts';
import { CloseIcon, ShareIcon, SuitIcon } from './Icons.tsx';
import { Tooltip } from './Tooltip.tsx';

interface TransferGamePopupProps {
  onClose: () => void;
}

export function TransferGamePopup({ onClose }: TransferGamePopupProps) {
  const { state } = useAppContext();
  const [url, setUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const completedRounds = state.rounds.filter((r) => r.phase === 'completed').length;
  const playerNames = state.players.map((p) => p.name).join(', ');

  let lastCompletedIndex = -1;
  for (let i = state.rounds.length - 1; i >= 0; i--) {
    if (state.rounds[i].phase === 'completed') {
      lastCompletedIndex = i;
      break;
    }
  }
  const standings = state.players.map((p) => ({
    name: p.name,
    score: lastCompletedIndex >= 0 ? getCumulativeScore(state.rounds, p.id, lastCompletedIndex) : 0,
  }));
  const maxScore = Math.max(...standings.map((s) => s.score));
  const hasScores = lastCompletedIndex >= 0;

  const currentRound = state.rounds[state.currentRoundIndex];

  useEffect(() => {
    let cancelled = false;

    async function generate() {
      try {
        const transferUrl = await buildTransferUrl(state);
        if (cancelled) return;
        setUrl(transferUrl);

        const qr = await generateQrDataUrl(transferUrl);
        if (cancelled) return;
        setQrDataUrl(qr);
      } catch {
        if (!cancelled) {
          setError('Failed to generate transfer link.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    generate();
    return () => {
      cancelled = true;
    };
  }, [state]);

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

  async function handleCopy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text in a temporary input
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleShare() {
    if (!url) return;
    try {
      await navigator.share({
        title: `Management Score Pad - ${playerNames} (Round ${completedRounds}/${state.totalGames})`,
        url,
      });
    } catch {
      // User cancelled share or API error — no action needed
    }
  }

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-game-title"
    >
      <div className="w-full max-w-[min(28rem,calc(100vw-40px))] rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-gray-200 border-b px-4 py-3">
          <h2 id="transfer-game-title" className="flex items-center gap-2 font-bold text-gray-900">
            <ShareIcon className="h-5 w-5" />
            Transfer Game
          </h2>
          <Tooltip text="Close (Esc)">
            <button type="button" onClick={onClose} className="text-gray-600 hover:text-gray-900" aria-label="Close">
              <CloseIcon />
            </button>
          </Tooltip>
        </div>
        <div className="p-4">
          <div className="mb-3 space-y-2 text-sm">
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {standings.map((s) => (
                <span key={s.name} className="text-gray-700">
                  {hasScores && s.score === maxScore && (
                    <span className="mr-0.5" role="img" aria-label="Leader">
                      &#x1F451;
                    </span>
                  )}
                  <span className="font-medium">{s.name}</span> <span className="text-gray-500">{s.score}</span>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              Round {completedRounds}/{state.totalGames}
              {currentRound && (
                <>
                  {' · '}
                  {currentRound.cardCount} cards
                  {' · '}
                  <SuitIcon suit={currentRound.trump} className="inline h-3.5 w-3.5" />
                </>
              )}
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          )}

          {error && <p className="py-4 text-center text-red-600 text-sm">{error}</p>}

          {!loading && !error && (
            <>
              {qrDataUrl ? (
                <div className="mb-4">
                  <div className="flex justify-center">
                    <img src={qrDataUrl} alt="QR code for game transfer" className="h-64 w-64 rounded-lg" />
                  </div>
                  <p className="mt-1 text-center text-gray-400 text-xs">
                    Scan to open the scoreboard on another device
                  </p>
                </div>
              ) : (
                <p className="mb-4 text-center text-amber-600 text-sm">
                  Game state is too large for a QR code. Use the link below instead.
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                  onClick={handleCopy}
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                {canShare && (
                  <button
                    type="button"
                    className="flex-1 rounded bg-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-300"
                    onClick={handleShare}
                  >
                    Share
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
