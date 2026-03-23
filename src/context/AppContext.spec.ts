import { describe, expect, it } from 'vitest';

import { appReducer, initialState } from './AppContext.tsx';

describe('AppContext', () => {
  describe('initialState', () => {
    it('has expected default values', () => {
      expect(initialState.gameId).toBeNull();
      expect(initialState.gamePhase).toBe('setup');
      expect(initialState.players).toEqual([]);
      expect(initialState.rounds).toEqual([]);
      expect(initialState.currentRoundIndex).toBe(-1);
      expect(initialState.cardSequence).toEqual([]);
      expect(initialState.maxCardsPerPlayer).toBe(0);
      expect(initialState.totalGames).toBe(0);
    });
  });

  describe('appReducer', () => {
    it('LOAD_STATE replaces entire state', () => {
      const newState = {
        ...initialState,
        gameId: 'loaded-game',
        gamePhase: 'playing' as const,
      };
      const result = appReducer(initialState, { type: 'LOAD_STATE', state: newState });
      expect(result.gameId).toBe('loaded-game');
      expect(result.gamePhase).toBe('playing');
    });

    it('RESET_GAME returns to initial state', () => {
      const playingState = {
        ...initialState,
        gameId: 'active-game',
        gamePhase: 'playing' as const,
      };
      const result = appReducer(playingState, { type: 'RESET_GAME' });
      expect(result.gameId).toBeNull();
      expect(result.gamePhase).toBe('setup');
    });
  });
});
