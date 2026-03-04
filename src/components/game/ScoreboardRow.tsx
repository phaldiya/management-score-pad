import type { GameRound, Player } from '../../types/index.ts';
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
        className={`sticky left-0 z-10 w-0 border border-gray-200 bg-white p-1${onPlayCardClick ? 'cursor-pointer' : ''}`}
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
        <PlayCard cardCount={round.cardCount} trump={round.trump} size="sm" highlight={round.phase === 'in_progress'} />
      </td>
      {players.map((player) => {
        const pd = round.playerData.find((d) => d.playerId === player.id);
        if (!pd) return <td key={player.id} className="border border-gray-200" />;
        return <PlayScore key={player.id} playerData={pd} phase={round.phase} />;
      })}
    </tr>
  );
}
