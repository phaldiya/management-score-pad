import type { GameRound, Player } from '../../types/index.ts';
import { TrashIcon } from '../shared/Icons.tsx';
import { Tooltip } from '../shared/Tooltip.tsx';
import PlayCard from './PlayCard.tsx';
import PlayScore from './PlayScore.tsx';

interface ScoreboardRowProps {
  round: GameRound;
  players: Player[];
  onPlayCardClick?: () => void;
  onUndo?: () => void;
}

export default function ScoreboardRow({ round, players, onPlayCardClick, onUndo }: ScoreboardRowProps) {
  return (
    <tr className={round.phase === 'in_progress' ? 'animate-pulse ring-2 ring-amber-400 ring-inset' : ''}>
      <td
        className={`w-[49px] border border-gray-200 bg-gray-100 sm:sticky sm:left-0 sm:z-10 ${onUndo ? 'overflow-visible' : ''} ${onPlayCardClick ? 'cursor-pointer' : ''}`}
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
        <div className="relative flex items-center justify-center p-1">
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
          {onUndo && (
            <Tooltip text="Delete this play (Shift+D)">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUndo();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    onUndo();
                  }
                }}
                className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600"
                aria-label={`Delete play ${round.gameNumber}`}
              >
                <TrashIcon className="h-3 w-3" />
              </button>
            </Tooltip>
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
