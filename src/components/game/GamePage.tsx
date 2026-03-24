import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { useAppContext } from '../../context/AppContext.tsx';
import { getTrumpForGame } from '../../lib/gameLogic.ts';
import { CloseIcon, SuitIcon } from '../shared/Icons.tsx';
import GameCompletePopup from './GameCompletePopup.tsx';
import NextGameButton from './NextGameButton.tsx';
import PlayFormPopup from './PlayFormPopup.tsx';
import Scoreboard from './Scoreboard.tsx';

type Popup = 'none' | 'bid' | 'results' | 'complete' | 'details' | 'undo';

export default function GamePage() {
  const { state, dispatch } = useAppContext();
  const [popup, setPopup] = useState<Popup>('none');

  const completedRounds = state.rounds.filter((r) => r.phase === 'completed');
  const hasCompletedRounds = completedRounds.length > 0;
  const lastCompletedRound = completedRounds[completedRounds.length - 1];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Escape closes any open popup
      if (e.key === 'Escape' && popup !== 'none') {
        setPopup('none');
        return;
      }
      // Shift+D for Delete Last Play
      if (e.key === 'D' && e.shiftKey && !e.metaKey && !e.ctrlKey && popup === 'none') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;
        if (hasCompletedRounds) {
          e.preventDefault();
          setPopup('undo');
        }
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
    [popup, state.currentRoundIndex, state.rounds, state.totalGames, hasCompletedRounds],
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
  const completedCount = rounds.filter((r) => r.phase === 'completed').length;

  const nextGameIndex = currentRoundIndex + 1;
  const nextCardCount = cardSequence[nextGameIndex] ?? 0;
  const nextTrump = getTrumpForGame(nextGameIndex);
  const dealerId = players[nextGameIndex % players.length].id;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Scoreboard
        players={players}
        rounds={rounds}
        onInProgressPlayClick={() => setPopup('details')}
        onUndoLastRound={() => setPopup('undo')}
      />

      <div className="border-gray-200 border-t bg-white p-4">
        <NextGameButton
          currentRound={currentRound}
          totalGames={totalGames}
          roundsPlayed={completedCount}
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

      {popup === 'undo' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="undo-round-title"
        >
          <div className="w-full max-w-[min(24rem,calc(100vw-40px))] rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-gray-200 border-b px-4 py-3">
              <h2 id="undo-round-title" className="font-bold text-gray-900">
                Delete Last Play?
              </h2>
              <button
                type="button"
                onClick={() => setPopup('none')}
                className="text-gray-600 hover:text-gray-900"
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="p-4">
              <p className="mb-4 text-gray-600 text-sm">
                Delete Play {lastCompletedRound?.gameNumber} ({lastCompletedRound?.cardCount} cards,{' '}
                <SuitIcon suit={lastCompletedRound?.trump ?? 'spades'} className="mb-0.5 inline h-3.5 w-3.5" /> trump)
                and its scores. You can replay this round afterwards.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 rounded bg-red-500 px-4 py-2 font-medium text-white hover:bg-red-600"
                  onClick={() => {
                    dispatch({ type: 'UNDO_LAST_ROUND' });
                    setPopup('none');
                  }}
                >
                  Yes, Delete
                </button>
                <button
                  type="button"
                  className="flex-1 rounded bg-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-300"
                  onClick={() => setPopup('none')}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
