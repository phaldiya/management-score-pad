import type { GameRound, Player } from '../../types/index.ts';
import { Tooltip } from '../shared/Tooltip.tsx';
import PlayCard from './PlayCard.tsx';
import PlayScore from './PlayScore.tsx';

interface ScoreboardRowProps {
  round: GameRound;
  players: Player[];
  onPlayCardClick?: () => void;
}

export default function ScoreboardRow({ round, players, onPlayCardClick }: ScoreboardRowProps) {
  return (
    <tr className={round.phase === 'in_progress' ? 'animate-pulse ring-2 ring-amber-400 ring-inset' : ''}>
      <td
        className={`w-[49px] border border-gray-200 bg-gray-100 sm:sticky sm:left-0 sm:z-10 ${onPlayCardClick ? 'cursor-pointer' : ''}`}
        onClick={onPlayCardClick}
        onKeyDown={
          onPlayCardClick
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') onPlayCardClick();
              }
            : undefined
        }
        role={onPlayCardClick ? 'button' : undefined}
        tabIndex={onPlayCardClick ? 0 : undefined}
        aria-label={onPlayCardClick ? `View play ${round.gameNumber} details` : undefined}
      >
        <div className="flex items-center justify-center p-1">
          {onPlayCardClick ? (
            <Tooltip text="View play details (P)">
              <PlayCard
                cardCount={round.cardCount}
                trump={round.trump}
                size="sm"
                highlight={round.phase === 'in_progress'}
              />
            </Tooltip>
          ) : (
            <PlayCard
              cardCount={round.cardCount}
              trump={round.trump}
              size="sm"
              highlight={round.phase === 'in_progress'}
            />
          )}
        </div>
      </td>
      {players.map((player) => {
        const pd = round.playerData.find((d) => d.playerId === player.id);
        if (!pd) return <td key={player.id} className="border border-gray-200" />;
        return <PlayScore key={player.id} playerData={pd} phase={round.phase} />;
      })}
    </tr>
  );
}
