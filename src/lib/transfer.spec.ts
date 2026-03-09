import { describe, expect, it } from 'vitest';

import type { AppState } from '../types/index.ts';
import { compressState, decompressState } from './transfer.ts';

const mockState: AppState = {
  gameId: 'test-game-123',
  gamePhase: 'playing',
  players: [
    { id: 'p1', name: 'Alice', avatar: 'bottts:seed1' },
    { id: 'p2', name: 'Bob', avatar: 'croodles:seed2' },
    { id: 'p3', name: 'Charlie', avatar: 'pixelArt:seed3' },
  ],
  rounds: [
    {
      gameIndex: 0,
      gameNumber: 1,
      cardCount: 1,
      trump: 'spades',
      phase: 'completed',
      playerData: [
        { playerId: 'p1', bid: 1, result: 1, score: 10, isDealer: true },
        { playerId: 'p2', bid: 0, result: 0, score: 10, isDealer: false },
        { playerId: 'p3', bid: 0, result: 0, score: 10, isDealer: false },
      ],
    },
  ],
  currentRoundIndex: 0,
  cardSequence: [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
  ],
  maxCardsPerPlayer: 17,
  totalGames: 33,
};

describe('transfer', () => {
  describe('compressState / decompressState', () => {
    it('round-trips state correctly', async () => {
      const encoded = await compressState(mockState);
      const decoded = await decompressState(encoded);
      expect(decoded).toEqual(mockState);
    });

    it('produces a base64url-safe string', async () => {
      const encoded = await compressState(mockState);
      expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('rejects corrupted data', async () => {
      await expect(decompressState('not-valid-data!!!')).rejects.toThrow();
    });

    it('rejects malformed state (missing required fields)', async () => {
      const bad = { v: 1, state: { gameId: null } };
      const json = JSON.stringify(bad);
      const encoder = new TextEncoder();
      const bytes = encoder.encode(json);
      let binary = '';
      for (const byte of bytes) {
        binary += String.fromCharCode(byte);
      }
      const encoded = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      await expect(decompressState(encoded)).rejects.toThrow();
    });

    it('handles trailing whitespace and garbage text', async () => {
      const encoded = await compressState(mockState);
      const withGarbage = `${encoded} Join game: Alice, Bob, Charlie (Round 1/33)`;
      const decoded = await decompressState(withGarbage);
      expect(decoded).toEqual(mockState);
    });

    it('handles dot-terminated encoded string (transfer URL format)', async () => {
      const encoded = await compressState(mockState);
      const decoded = await decompressState(`${encoded}.`);
      expect(decoded).toEqual(mockState);
    });

    it('handles dot-terminated string with appended garbage', async () => {
      const encoded = await compressState(mockState);
      const withGarbage = `${encoded}.Join game: Alice, Bob, Charlie (Round 1/33)`;
      const decoded = await decompressState(withGarbage);
      expect(decoded).toEqual(mockState);
    });

    it('handles URL-encoded garbage after dot terminator', async () => {
      const encoded = await compressState(mockState);
      const withGarbage = `${encoded}.Join%20game:%2012,%2034,%2056%20(Round%202/33)`;
      const decoded = await decompressState(withGarbage);
      expect(decoded).toEqual(mockState);
    });

    it('handles trailing newline and text', async () => {
      const encoded = await compressState(mockState);
      const withGarbage = `${encoded}\nJoin game: Alice, Bob, Charlie`;
      const decoded = await decompressState(withGarbage);
      expect(decoded).toEqual(mockState);
    });

    it('rejects wrong version', async () => {
      const bad = { v: 99, state: mockState };
      const json = JSON.stringify(bad);
      const encoder = new TextEncoder();
      const bytes = encoder.encode(json);
      let binary = '';
      for (const byte of bytes) {
        binary += String.fromCharCode(byte);
      }
      const encoded = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      await expect(decompressState(encoded)).rejects.toThrow();
    });
  });
});
