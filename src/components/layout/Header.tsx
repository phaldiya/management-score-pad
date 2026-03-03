import { useCallback, useEffect, useState } from 'react';

import { useAppContext } from '../../context/AppContext.tsx';
import { printScoreboard } from '../../lib/exportPdf.ts';
import { GameRulesPopup } from '../shared/GameRulesPopup.tsx';
import { AppIcon, BookIcon, CloseIcon, DownloadIcon, KeyboardIcon } from '../shared/Icons.tsx';
import { KeyboardShortcutsPopup } from '../shared/KeyboardShortcutsPopup.tsx';

export default function Header() {
  const { state, dispatch } = useAppContext();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const hasRoundsInProgress = state.rounds.length > 0 && state.rounds.some((r) => r.phase !== 'completed');
  const hasCompletedRounds = state.rounds.some((r) => r.phase === 'completed');
  const gameInProgress = hasRoundsInProgress || hasCompletedRounds;

  const handleNewGame = useCallback(() => {
    if (gameInProgress) {
      setShowConfirm(true);
    } else {
      dispatch({ type: 'RESET_GAME' });
    }
  }, [gameInProgress, dispatch]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showRules) {
          setShowRules(false);
          return;
        }
        if (showShortcuts) {
          setShowShortcuts(false);
          return;
        }
        if (showConfirm) {
          setShowConfirm(false);
          return;
        }
        return;
      }
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }
      // Shift+N for New Game (only on game page)
      if (e.key === 'N' && e.shiftKey && !e.metaKey && !e.ctrlKey && state.gamePhase === 'playing') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;
        e.preventDefault();
        handleNewGame();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showConfirm, showShortcuts, showRules, state.gamePhase, handleNewGame]);

  return (
    <>
      <header className="flex items-center justify-between border-gray-200 border-b bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <AppIcon className="h-8 w-8" />
          <h1 className="font-bold text-gray-900 text-lg">Management Score Pad</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded bg-gray-100 p-1.5 text-gray-600 hover:bg-gray-200"
            onClick={() => setShowRules(true)}
            title="Game rules"
            aria-label="Game rules"
          >
            <BookIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded bg-gray-100 p-1.5 text-gray-600 hover:bg-gray-200"
            onClick={() => setShowShortcuts(true)}
            title="Keyboard shortcuts (?)"
            aria-label="Keyboard shortcuts"
          >
            <KeyboardIcon className="h-4 w-4" />
          </button>
          {state.gamePhase === 'playing' && (
            <>
              {state.rounds.length > 0 && (
                <button
                  type="button"
                  className="rounded bg-gray-100 p-1.5 text-gray-600 hover:bg-gray-200"
                  onClick={() => printScoreboard(state.players, state.rounds)}
                  title="Download scoreboard as PDF"
                  aria-label="Download scoreboard as PDF"
                >
                  <DownloadIcon className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                className="rounded bg-red-500 px-3 py-1.5 font-medium text-sm text-white hover:bg-red-600"
                onClick={handleNewGame}
              >
                New Game
              </button>
            </>
          )}
        </div>
      </header>

      {showRules && <GameRulesPopup onClose={() => setShowRules(false)} />}
      {showShortcuts && <KeyboardShortcutsPopup onClose={() => setShowShortcuts(false)} />}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-gray-200 border-b px-4 py-3">
              <h2 className="font-bold text-gray-900">Abandon Game?</h2>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="p-4">
              <p className="mb-4 text-gray-600 text-sm">
                You have a game in progress. Starting a new game will discard all current progress.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 rounded bg-red-500 px-4 py-2 font-medium text-white hover:bg-red-600"
                  onClick={() => {
                    setShowConfirm(false);
                    dispatch({ type: 'RESET_GAME' });
                  }}
                >
                  Yes, New Game
                </button>
                <button
                  type="button"
                  className="flex-1 rounded bg-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-300"
                  onClick={() => setShowConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
