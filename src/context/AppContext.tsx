import { createContext, type ReactNode, useContext, useEffect, useReducer } from 'react';

import { generateCardSequence, getMaxCardsPerPlayer, getTotalGames, getTrumpForGame } from '../lib/gameLogic.ts';
import { computeRoundScores } from '../lib/scoreCalculation.ts';
import { clearActiveGame, loadActiveGame, saveGameState } from '../lib/storage.ts';
import type { AppAction, AppState } from '../types/index.ts';

export const initialState: AppState = {
  gameId: null,
  gamePhase: 'setup',
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
      current.playerData = computeRoundScores(updatedPlayerData);
      current.phase = 'completed';
      rounds[state.currentRoundIndex] = current;
      return { ...state, rounds };
    }

    case 'REORDER_PLAYERS': {
      const players = [...state.players];
      const [moved] = players.splice(action.fromIndex, 1);
      players.splice(action.toIndex, 0, moved);
      return { ...state, players };
    }

    case 'RESET_GAME':
      clearActiveGame();
      return { ...initialState };

    case 'LOAD_STATE':
      return { ...action.state };

    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

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

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
