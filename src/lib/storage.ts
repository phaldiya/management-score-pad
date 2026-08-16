import type { AppState, GameMode } from '../types/index.ts';
import { getCumulativeScore } from './scoreCalculation.ts';

const ACTIVE_KEY = 'management-score-pad-active';
const HISTORY_KEY = 'management-score-pad-history';
const GAME_MODE_KEY = 'management-score-pad-mode';
const MAX_HISTORY = 50;

// Remembered across sessions so a new game defaults to the last mode played.
export function saveGameMode(mode: GameMode): void {
  try {
    localStorage.setItem(GAME_MODE_KEY, mode);
  } catch {
    // localStorage full or unavailable
  }
}

export function loadGameMode(): GameMode {
  try {
    const raw = localStorage.getItem(GAME_MODE_KEY);
    return raw === 'advance' ? 'advance' : 'classic';
  } catch {
    return 'classic';
  }
}

// Single store key holding a { normalizedName: avatarId } map so a returning
// player keeps the avatar they were last assigned.
const AVATAR_MAP_KEY = 'management-score-pad-avatars';

function avatarMapKey(name: string): string {
  return name.trim().toLowerCase();
}

export function loadAvatarMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(AVATAR_MAP_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function getStoredAvatar(name: string): string | null {
  const key = avatarMapKey(name);
  if (!key) return null;
  return loadAvatarMap()[key] ?? null;
}

export function rememberAvatars(players: { name: string; avatar: string }[]): void {
  try {
    const map = loadAvatarMap();
    for (const p of players) {
      const key = avatarMapKey(p.name);
      if (key) map[key] = p.avatar;
    }
    localStorage.setItem(AVATAR_MAP_KEY, JSON.stringify(map));
  } catch {
    // localStorage full or unavailable
  }
}

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
    // Saves from before game modes existed lack gameMode — treat them as classic.
    const parsed = JSON.parse(raw) as AppState;
    return { ...parsed, gameMode: parsed.gameMode ?? 'classic' };
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

export interface GameHistoryPlayer {
  name: string;
  avatar: string;
  score: number;
}

export interface GameHistoryEntry {
  id: string;
  completedAt: string;
  totalGames: number;
  players: GameHistoryPlayer[];
  winnerNames: string[];
}

export function loadGameHistory(): GameHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as GameHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

// Records a finished game in history, newest first, replacing any prior entry
// with the same gameId so re-completing a round does not create duplicates.
export function saveCompletedGame(state: AppState): void {
  if (!state.gameId || state.players.length === 0) return;
  try {
    const lastIndex = state.rounds.length - 1;
    const players: GameHistoryPlayer[] = state.players.map((p) => ({
      name: p.name,
      avatar: p.avatar,
      score: getCumulativeScore(state.rounds, p.id, lastIndex),
    }));
    const topScore = Math.max(...players.map((p) => p.score));
    const entry: GameHistoryEntry = {
      id: state.gameId,
      completedAt: new Date().toISOString(),
      totalGames: state.totalGames,
      players,
      winnerNames: players.filter((p) => p.score === topScore).map((p) => p.name),
    };
    const existing = loadGameHistory().filter((e) => e.id !== entry.id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...existing].slice(0, MAX_HISTORY)));
  } catch {
    // localStorage full or unavailable
  }
}

export function deleteHistoryEntry(id: string): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(loadGameHistory().filter((e) => e.id !== id)));
  } catch {
    // ignore
  }
}

export function clearGameHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // ignore
  }
}
