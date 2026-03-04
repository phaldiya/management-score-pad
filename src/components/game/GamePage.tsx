import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { useAppContext } from '../../context/AppContext.tsx';
import { getTrumpForGame } from '../../lib/gameLogic.ts';
import GameCompletePopup from './GameCompletePopup.tsx';
import NextGameButton from './NextGameButton.tsx';
import PlayFormPopup from './PlayFormPopup.tsx';
import Scoreboard from './Scoreboard.tsx';

type Popup = 'none' | 'bid' | 'results' | 'complete' | 'details';

export default function GamePage() {
  const { state, dispatch } = useAppContext();
  const [popup, setPopup] = useState<Popup>('none');

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Escape closes any open popup
      if (e.key === 'Escape' && popup !== 'none') {
        setPopup('none');
        return;
      }
      // N key opens next play / enter results when no popup is open
      if (e.key === 'n' && popup === 'none' && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;
        e.preventDefault();
        // Determine what action the button would trigger
        const currentRd = state.currentRoundIndex >= 0 ? state.rounds[state.currentRoundIndex] : undefined;
        const completed = state.rounds.filter((r) => r.phase === 'completed').length;
        if (!currentRd) {
          setPopup('bid');
        } else if (currentRd.phase === 'in_progress') {
          setPopup('results');
        } else if (completed >= state.totalGames) {
          setPopup('complete');
        } else {
          setPopup('bid');
        }
      }
      // P key opens play details when no popup is open and current round is in progress
      if (e.key === 'p' && popup === 'none' && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;
        const currentRd = state.currentRoundIndex >= 0 ? state.rounds[state.currentRoundIndex] : undefined;
        if (currentRd?.phase === 'in_progress') {
          e.preventDefault();
          setPopup('details');
        }
      }
    },
    [popup, state.currentRoundIndex, state.rounds, state.totalGames],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (state.gamePhase !== 'playing' || state.players.length === 0) {
    return <Navigate to="/" replace />;
  }

  const { players, rounds, currentRoundIndex, cardSequence, totalGames } = state;
  const currentRound = currentRoundIndex >= 0 ? rounds[currentRoundIndex] : undefined;
  const completedRounds = rounds.filter((r) => r.phase === 'completed').length;

  const nextGameIndex = currentRoundIndex + 1;
  const nextCardCount = cardSequence[nextGameIndex] ?? 0;
  const nextTrump = getTrumpForGame(nextGameIndex);
  const dealerId = players[nextGameIndex % players.length].id;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Scoreboard players={players} rounds={rounds} onInProgressPlayClick={() => setPopup('details')} />

      <div className="border-gray-200 border-t bg-white p-4">
        <NextGameButton
          currentRound={currentRound}
          totalGames={totalGames}
          roundsPlayed={completedRounds}
          onStartFirstGame={() => setPopup('bid')}
          onEnterResults={() => setPopup('results')}
          onNextGame={() => setPopup('bid')}
          onGameComplete={() => setPopup('complete')}
        />
      </div>

      {popup === 'bid' && (
        <PlayFormPopup
          mode="bid"
          players={players}
          cardCount={nextCardCount}
          trump={nextTrump}
          gameNumber={nextGameIndex + 1}
          dealerId={dealerId}
          onSubmit={(data) => {
            dispatch({ type: 'START_ROUND', bids: data.bids, dealerId: data.dealerId });
            setPopup('none');
          }}
          onClose={() => setPopup('none')}
        />
      )}

      {popup === 'results' && currentRound && (
        <PlayFormPopup
          mode="result"
          players={players}
          round={currentRound}
          onSubmit={(results) => {
            dispatch({ type: 'COMPLETE_ROUND', results });
            setPopup('none');
          }}
          onClose={() => setPopup('none')}
        />
      )}

      {popup === 'details' && currentRound && (
        <PlayFormPopup
          mode="details"
          players={players}
          round={currentRound}
          onClose={() => setPopup('none')}
          onEditBids={(bids) => {
            dispatch({ type: 'UPDATE_BIDS', bids });
            setPopup('none');
          }}
        />
      )}

      {popup === 'complete' && (
        <GameCompletePopup
          players={players}
          rounds={rounds}
          onClose={() => setPopup('none')}
          onNewGame={() => dispatch({ type: 'RESET_GAME' })}
        />
      )}
    </div>
  );
}
