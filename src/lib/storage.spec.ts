import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { completedRound } from '../../tests/helpers/fixtures.ts';
import { createTestState } from '../../tests/helpers/testReducer.ts';
import {
  clearActiveGame,
  getStoredAvatar,
  loadActiveGame,
  loadAvatarMap,
  rememberAvatars,
  saveGameState,
} from './storage.ts';

describe('storage spec', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('saveGameState with null gameId writes nothing to localStorage', () => {
    const state = createTestState({ gameId: null });
    saveGameState(state);
    expect(localStorage.length).toBe(0);
  });

  it('loadActiveGame returns null on invalid JSON', () => {
    localStorage.setItem('management-score-pad-active', 'game-1');
    localStorage.setItem('management-score-pad-game-1', '{broken json');
    expect(loadActiveGame()).toBeNull();
  });

  it('loadActiveGame returns null when active key exists but game data does not', () => {
    localStorage.setItem('management-score-pad-active', 'game-1');
    expect(loadActiveGame()).toBeNull();
  });

  it('clearActiveGame when nothing saved does not throw', () => {
    expect(() => clearActiveGame()).not.toThrow();
  });

  it('clearActiveGame called twice does not throw', () => {
    const state = createTestState({ gameId: 'game-1' });
    saveGameState(state);
    clearActiveGame();
    expect(() => clearActiveGame()).not.toThrow();
  });

  it('full round-trip fidelity with rounds', () => {
    const state = createTestState({
      gameId: 'game-rt',
      gamePhase: 'playing',
      rounds: [completedRound],
      currentRoundIndex: 0,
    });
    saveGameState(state);
    const loaded = loadActiveGame();
    expect(loaded).toEqual(state);
  });

  it('saving a second game does not corrupt the first', () => {
    const state1 = createTestState({ gameId: 'game-1', players: [{ id: 'p1', name: 'Alice', avatar: 'bottts:Zoe' }] });
    const state2 = createTestState({ gameId: 'game-2', players: [{ id: 'p2', name: 'Bob', avatar: 'bottts:Zoe' }] });
    saveGameState(state1);
    saveGameState(state2);

    // Active is now game-2, but game-1 data is still intact
    const raw1 = localStorage.getItem('management-score-pad-game-1');
    expect(raw1).not.toBeNull();
    expect(JSON.parse(raw1!)).toEqual(state1);
  });
});

describe('avatar store', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('remembers and recalls an avatar by name', () => {
    rememberAvatars([{ name: 'Alice', avatar: 'croodles:Kai' }]);
    expect(getStoredAvatar('Alice')).toBe('croodles:Kai');
  });

  it('recall is case-insensitive and trims whitespace', () => {
    rememberAvatars([{ name: 'Alice', avatar: 'lorelei:Luna' }]);
    expect(getStoredAvatar('  ALICE ')).toBe('lorelei:Luna');
  });

  it('returns null for an unknown or blank name', () => {
    expect(getStoredAvatar('Nobody')).toBeNull();
    expect(getStoredAvatar('   ')).toBeNull();
  });

  it('stores all avatars under a single localStorage key', () => {
    rememberAvatars([
      { name: 'Alice', avatar: 'bottts:Zoe' },
      { name: 'Bob', avatar: 'pixelArt:Max' },
    ]);
    const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i));
    expect(keys).toEqual(['management-score-pad-avatars']);
    expect(loadAvatarMap()).toEqual({ alice: 'bottts:Zoe', bob: 'pixelArt:Max' });
  });

  it('merges new entries and overwrites an existing name', () => {
    rememberAvatars([{ name: 'Alice', avatar: 'bottts:Zoe' }]);
    rememberAvatars([
      { name: 'Alice', avatar: 'bottts:Kai' },
      { name: 'Bob', avatar: 'lorelei:Sky' },
    ]);
    expect(loadAvatarMap()).toEqual({ alice: 'bottts:Kai', bob: 'lorelei:Sky' });
  });

  it('ignores blank names when remembering', () => {
    rememberAvatars([{ name: '   ', avatar: 'bottts:Zoe' }]);
    expect(loadAvatarMap()).toEqual({});
  });

  it('loadAvatarMap returns empty object on corrupt data', () => {
    localStorage.setItem('management-score-pad-avatars', '{broken');
    expect(loadAvatarMap()).toEqual({});
  });
});

describe('storage – smoke', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saveGameState writes to localStorage', () => {
    const state = createTestState({ gameId: 'test-game-1', gamePhase: 'playing' });
    saveGameState(state);
    expect(localStorage.getItem('management-score-pad-active')).toBe('test-game-1');
    expect(localStorage.getItem('management-score-pad-test-game-1')).toBeTruthy();
  });

  it('loadActiveGame returns null when nothing saved', () => {
    expect(loadActiveGame()).toBeNull();
  });

  it('loadActiveGame returns saved state', () => {
    const state = createTestState({ gameId: 'test-game-2', gamePhase: 'playing' });
    saveGameState(state);
    const loaded = loadActiveGame();
    expect(loaded).toEqual(state);
  });

  it('clearActiveGame removes keys', () => {
    const state = createTestState({ gameId: 'test-game-3', gamePhase: 'playing' });
    saveGameState(state);
    clearActiveGame();
    expect(loadActiveGame()).toBeNull();
    expect(localStorage.getItem('management-score-pad-active')).toBeNull();
    expect(localStorage.getItem('management-score-pad-test-game-3')).toBeNull();
  });
});
