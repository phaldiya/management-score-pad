import { appReducer, initialState } from '../../src/context/AppContext.tsx';
import type { AppAction, AppState } from '../../src/types/index.ts';

export function createTestState(overrides: Partial<AppState> = {}): AppState {
  return {
    ...initialState,
    ...overrides,
  };
}

export function applyActions(state: AppState, actions: AppAction[]): AppState {
  return actions.reduce((s, action) => appReducer(s, action), state);
}
