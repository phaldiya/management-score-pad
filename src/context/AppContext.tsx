import { createContext, type ReactNode, useContext, useEffect, useReducer } from 'react';

import { generateCardSequence, getMaxCardsPerPlayer, getTotalGames, getTrumpForGame } from '../lib/gameLogic.ts';
import { computeRoundScores } from '../lib/scoreCalculation.ts';
import {
  clearActiveGame,
  loadActiveGame,
  loadGameMode,
  saveCompletedGame,
  saveGameMode,
  saveGameState,
} from '../lib/storage.ts';
import type { AppAction, AppState } from '../types/index.ts';

export const initialState: AppState = {
  gameId: null,
  gamePhase: 'setup',
  gameMode: 'classic',
  players: [],
  rounds: [],
  currentRoundIndex: -1,
  cardSequence: [],
  maxCardsPerPlayer: 0,
  totalGames: 0,
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PLAYERS':
      return { ...state, players: action.players };

    case 'START_GAME': {
      const numPlayers = state.players.length;
      const maxCards = getMaxCardsPerPlayer(numPlayers);
      const cardSequence = generateCardSequence(maxCards);
      const totalGames = getTotalGames(maxCards);
      return {
        ...state,
        gameId: crypto.randomUUID(),
        gamePhase: 'playing',
        rounds: [],
        currentRoundIndex: -1,
        cardSequence,
        maxCardsPerPlayer: maxCards,
        totalGames,
      };
    }

    case 'START_ROUND': {
      const nextIndex = state.currentRoundIndex + 1;
      const cardCount = state.cardSequence[nextIndex];
      const trump = getTrumpForGame(nextIndex);
      const playerData = state.players.map((p) => {
        const bidEntry = action.bids.find((b) => b.playerId === p.id);
        return {
          playerId: p.id,
          bid: bidEntry?.bid ?? 0,
          result: null,
          score: null,
          isDealer: p.id === action.dealerId,
        };
      });
      const newRound = {
        gameIndex: nextIndex,
        gameNumber: nextIndex + 1,
        cardCount,
        trump,
        phase: 'in_progress' as const,
        playerData,
      };
      return {
        ...state,
        rounds: [...state.rounds, newRound],
        currentRoundIndex: nextIndex,
      };
    }

    case 'COMPLETE_ROUND': {
      const rounds = [...state.rounds];
      const current = { ...rounds[state.currentRoundIndex] };
      const updatedPlayerData = current.playerData.map((pd) => {
        const resultEntry = action.results.find((r) => r.playerId === pd.playerId);
        return {
          ...pd,
          result: resultEntry?.result ?? 0,
        };
      });
      current.playerData = computeRoundScores(updatedPlayerData, state.gameMode);
      current.phase = 'completed';
      rounds[state.currentRoundIndex] = current;
      const newState = { ...state, rounds };
      const completedCount = rounds.filter((r) => r.phase === 'completed').length;
      if (completedCount === state.totalGames) {
        saveCompletedGame(newState);
      }
      return newState;
    }

    case 'SET_GAME_MODE': {
      if (action.mode === state.gameMode) return state;
      saveGameMode(action.mode);
      // Re-score completed rounds so the scoreboard stays consistent with the new mode.
      const rounds = state.rounds.map((round) =>
        round.phase === 'completed'
          ? { ...round, playerData: computeRoundScores(round.playerData, action.mode) }
          : round,
      );
      const newState = { ...state, gameMode: action.mode, rounds };
      // Switching after the last play would leave the stored history entry with stale scores.
      const completedCount = rounds.filter((r) => r.phase === 'completed').length;
      if (state.totalGames > 0 && completedCount === state.totalGames) {
        saveCompletedGame(newState);
      }
      return newState;
    }

    case 'UPDATE_BIDS': {
      const rounds = [...state.rounds];
      const current = { ...rounds[state.currentRoundIndex] };
      current.playerData = current.playerData.map((pd) => {
        const bidEntry = action.bids.find((b) => b.playerId === pd.playerId);
        return { ...pd, bid: bidEntry?.bid ?? pd.bid };
      });
      rounds[state.currentRoundIndex] = current;
      return { ...state, rounds };
    }

    case 'UNDO_LAST_ROUND': {
      const lastRound = state.rounds[state.rounds.length - 1];
      if (lastRound?.phase !== 'completed') return state;
      return {
        ...state,
        rounds: state.rounds.slice(0, -1),
        currentRoundIndex: state.currentRoundIndex - 1,
      };
    }

    case 'REORDER_PLAYERS': {
      const players = [...state.players];
      const [moved] = players.splice(action.fromIndex, 1);
      players.splice(action.toIndex, 0, moved);
      return { ...state, players };
    }

    case 'RESET_GAME':
      clearActiveGame();
      return { ...initialState, gameMode: state.gameMode };

    case 'LOAD_STATE':
      // Older saved games predate gameMode — treat them as classic.
      return { ...action.state, gameMode: action.state.gameMode ?? 'classic' };

    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  // A new session starts in the mode the user last played.
  const [state, dispatch] = useReducer(appReducer, initialState, (s) => ({ ...s, gameMode: loadGameMode() }));

  useEffect(() => {
    const saved = loadActiveGame();
    if (saved) {
      dispatch({ type: 'LOAD_STATE', state: saved });
    }
  }, []);

  useEffect(() => {
    if (state.gameId) {
      saveGameState(state);
    }
  }, [state]);

  useEffect(() => {
    if (state.gamePhase !== 'playing') return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [state.gamePhase]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
