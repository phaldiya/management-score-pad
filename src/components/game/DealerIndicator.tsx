import type { GameRound, Player } from '../../types/index.ts';
import PlayerAvatar from '../shared/PlayerAvatar.tsx';

interface DealerIndicatorProps {
  players: Player[];
  currentRound: GameRound | undefined;
  currentRoundIndex: number;
  nextGameIndex: number;
  completedCount: number;
  totalGames: number;
}

export default function DealerIndicator({
  players,
  currentRound,
  currentRoundIndex,
  nextGameIndex,
  completedCount,
  totalGames,
}: DealerIndicatorProps) {
  if (players.length === 0 || completedCount >= totalGames) return null;

  let dealer: Player | undefined;
  let label: string;
  if (currentRound?.phase === 'in_progress') {
    const dealerId = currentRound.playerData.find((d) => d.isDealer)?.playerId;
    dealer = players.find((p) => p.id === dealerId);
    label = 'is dealing';
  } else {
    dealer = players[nextGameIndex % players.length];
    label = currentRoundIndex < 0 ? 'deals first' : 'deals next';
  }
  if (!dealer) return null;

  return (
    <div className="mb-2 flex items-center justify-center gap-2 text-gray-600 text-sm">
      <img src={`${import.meta.env.BASE_URL}dealer.png`} alt="" aria-hidden="true" className="h-4 w-4" />
      <PlayerAvatar avatar={dealer.avatar} name={dealer.name} size="xs" />
      <span>
        <span className="font-semibold text-gray-900">{dealer.name}</span> {label}
      </span>
    </div>
  );
}
