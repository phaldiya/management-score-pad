import type { AppState } from '../types/index.ts';

const ACTIVE_KEY = 'management-score-pad-active';

function gameKey(gameId: string): string {
  return `management-score-pad-${gameId}`;
}

export function saveGameState(state: AppState): void {
  if (!state.gameId) return;
  try {
    localStorage.setItem(gameKey(state.gameId), JSON.stringify(state));
    localStorage.setItem(ACTIVE_KEY, state.gameId);
  } catch {
    // localStorage full or unavailable
  }
}

export function loadActiveGame(): AppState | null {
  try {
    const activeId = localStorage.getItem(ACTIVE_KEY);
    if (!activeId) return null;
    const raw = localStorage.getItem(gameKey(activeId));
    if (!raw) return null;
    return JSON.parse(raw) as AppState;
  } catch {
    return null;
  }
}

export function clearActiveGame(): void {
  try {
    const activeId = localStorage.getItem(ACTIVE_KEY);
    if (activeId) {
      localStorage.removeItem(gameKey(activeId));
    }
    localStorage.removeItem(ACTIVE_KEY);
  } catch {
    // ignore
  }
}
