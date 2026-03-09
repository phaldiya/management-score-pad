import { useCallback, useEffect, useState } from 'react';

import { useAppContext } from '../../context/AppContext.tsx';
import { printScoreboard } from '../../lib/exportPdf.ts';
import { GameRulesPopup } from '../shared/GameRulesPopup.tsx';
import { AppIcon, BookIcon, CloseIcon, KeyboardIcon, ShareIcon } from '../shared/Icons.tsx';
import { KeyboardShortcutsPopup } from '../shared/KeyboardShortcutsPopup.tsx';
import { TransferGamePopup } from '../shared/TransferGamePopup.tsx';

export default function Header() {
  const { state, dispatch } = useAppContext();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

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
        if (showTransfer) {
          setShowTransfer(false);
          return;
        }
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
      // Cmd/Ctrl+P for Download PDF (only on game page with rounds)
      if (e.key === 'p' && (e.metaKey || e.ctrlKey) && state.gamePhase === 'playing' && state.rounds.length > 0) {
        e.preventDefault();
        printScoreboard(state.players, state.rounds);
        return;
      }
      // Shift+S for Share/Transfer (only on game page)
      if (e.key === 'S' && e.shiftKey && !e.metaKey && !e.ctrlKey && state.gamePhase === 'playing') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;
        e.preventDefault();
        setShowTransfer(true);
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
  }, [
    showConfirm,
    showShortcuts,
    showRules,
    showTransfer,
    state.gamePhase,
    state.players,
    state.rounds,
    handleNewGame,
  ]);

  return (
    <>
      <header className="flex items-center justify-between border-gray-200 border-b bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center sm:block">
            <AppIcon className="h-8 w-8" />
            <span className="block font-semibold text-[8px] text-gray-600 leading-tight sm:hidden">Management</span>
          </div>
          <h1 className="font-bold text-gray-900 text-lg">
            <span className="hidden sm:inline">Management </span>Score Pad
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded bg-gray-100 p-1.5 text-gray-600 hover:bg-gray-200 focus:outline-2 focus:outline-blue-600 focus:outline-offset-2"
            onClick={() => setShowRules(true)}
            title="Game rules"
            aria-label="Game rules"
          >
            <BookIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded bg-gray-100 p-1.5 text-gray-600 hover:bg-gray-200 focus:outline-2 focus:outline-blue-600 focus:outline-offset-2"
            onClick={() => setShowShortcuts(true)}
            title="Keyboard shortcuts (?)"
            aria-label="Keyboard shortcuts"
          >
            <KeyboardIcon className="h-4 w-4" />
          </button>
          {state.gamePhase === 'playing' && (
            <button
              type="button"
              className="rounded bg-gray-100 p-1.5 text-gray-600 hover:bg-gray-200 focus:outline-2 focus:outline-blue-600 focus:outline-offset-2"
              onClick={() => setShowTransfer(true)}
              title="Transfer game (Shift+S)"
              aria-label="Transfer game"
            >
              <ShareIcon className="h-4 w-4" />
            </button>
          )}
          {state.gamePhase === 'playing' && (
            <button
              type="button"
              className="flex h-7 items-center rounded bg-red-500 p-1.5 font-medium text-sm text-white hover:bg-red-600 sm:px-3"
              onClick={handleNewGame}
              aria-label="New game"
            >
              <span className="hidden sm:inline">+ Game</span>
              <span className="flex h-4 w-4 items-center justify-center sm:hidden">+</span>
            </button>
          )}
        </div>
      </header>

      {showRules && <GameRulesPopup onClose={() => setShowRules(false)} />}
      {showShortcuts && <KeyboardShortcutsPopup onClose={() => setShowShortcuts(false)} />}
      {showTransfer && <TransferGamePopup onClose={() => setShowTransfer(false)} />}

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="abandon-game-title"
        >
          <div className="w-full max-w-[min(24rem,calc(100vw-40px))] rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-gray-200 border-b px-4 py-3">
              <h2 id="abandon-game-title" className="font-bold text-gray-900">
                Abandon Game?
              </h2>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="text-gray-600 hover:text-gray-900"
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
