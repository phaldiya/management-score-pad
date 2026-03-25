import { useEffect } from 'react';

import { getCumulativeScore } from '../../lib/scoreCalculation.ts';
import type { GameRound, Player } from '../../types/index.ts';
import { CloseIcon } from '../shared/Icons.tsx';
import PlayerAvatar from '../shared/PlayerAvatar.tsx';
import PlayCard from './PlayCard.tsx';

interface RoundDetailsPopupProps {
  round: GameRound;
  rounds: GameRound[];
  players: Player[];
  onClose: () => void;
}

export default function RoundDetailsPopup({ round, rounds, players, onClose }: RoundDetailsPopupProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="round-details-title"
    >
      <div className="w-full max-w-[min(28rem,calc(100vw-40px))] rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-gray-200 border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <PlayCard cardCount={round.cardCount} trump={round.trump} size="xs" />
            <h2 id="round-details-title" className="font-bold text-gray-900">
              Play {round.gameNumber} Details
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-gray-600 hover:text-gray-900" aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="p-4">
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-x-3 gap-y-0.5 text-xs">
              <span className="font-semibold text-gray-500 uppercase tracking-wider">Player</span>
              <span className="text-center font-semibold text-gray-500 uppercase tracking-wider">Bid</span>
              <span className="text-center font-semibold text-gray-500 uppercase tracking-wider">Won</span>
              <span className="text-center font-semibold text-gray-500 uppercase tracking-wider">Score</span>
              <span className="text-center font-semibold text-gray-500 uppercase tracking-wider">Total</span>
            </div>

            {players.map((player) => {
              const pd = round.playerData.find((d) => d.playerId === player.id);
              if (!pd) return null;
              const matched = pd.bid === pd.result;
              const cumulative = getCumulativeScore(rounds, player.id, round.gameIndex);

              return (
                <div
                  key={player.id}
                  className={`grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-x-3 rounded-lg px-2 py-2 ${matched ? 'bg-green-50' : 'bg-red-50'}`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <PlayerAvatar avatar={player.avatar} name={player.name} size="xs" />
                    <span className="truncate font-medium text-gray-900 text-sm">{player.name}</span>
                    {pd.isDealer && (
                      <img src={`${import.meta.env.BASE_URL}dealer.png`} alt="Dealer" className="h-4 w-4 shrink-0" />
                    )}
                  </div>
                  <span className="flex h-6 w-8 items-center justify-center rounded bg-blue-100 font-medium text-blue-700 text-xs">
                    {pd.bid}
                  </span>
                  <span className="flex h-6 w-8 items-center justify-center rounded bg-emerald-100 font-medium text-emerald-700 text-xs">
                    {pd.result}
                  </span>
                  <span
                    className={`flex h-6 w-10 items-center justify-center rounded font-bold text-sm ${matched ? 'text-green-700' : 'text-red-500'}`}
                  >
                    {pd.score}
                  </span>
                  <span className="flex h-6 w-10 items-center justify-center font-medium text-gray-600 text-xs">
                    {cumulative}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
