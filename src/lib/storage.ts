import type { AppState } from '../types/index.ts';

const ACTIVE_KEY = 'management-score-pad-active';

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
