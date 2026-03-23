import { describe, expect, it, vi } from 'vitest';

vi.mock('qrcode', () => ({
  default: {
    toCanvas: vi.fn().mockResolvedValue(undefined),
  },
}));

import type { AppState } from '../types/index.ts';
import { buildTransferUrl, compressState, decompressState, generateQrDataUrl } from './transfer.ts';

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

  describe('buildTransferUrl', () => {
    it('produces a URL with #/import?d= fragment and dot terminator', async () => {
      // Mock window.location.href
      const original = globalThis.window;
      globalThis.window = { location: { href: 'https://example.com/app/#/game' } } as unknown as Window &
        typeof globalThis;

      const url = await buildTransferUrl(mockState);
      expect(url).toMatch(/^https:\/\/example\.com\/app\/#\/import\?d=.+\.$/);

      globalThis.window = original;
    });

    it('encoded data in URL can be decompressed back', async () => {
      globalThis.window = { location: { href: 'https://example.com/#/game' } } as unknown as Window & typeof globalThis;

      const url = await buildTransferUrl(mockState);
      const encoded = url.split('d=')[1];
      const decoded = await decompressState(encoded);
      expect(decoded).toEqual(mockState);

      delete (globalThis as Record<string, unknown>).window;
    });
  });

  describe('generateQrDataUrl', () => {
    it('returns null for URLs exceeding max length', async () => {
      const longUrl = `https://example.com/${'a'.repeat(1200)}`;
      const result = await generateQrDataUrl(longUrl);
      expect(result).toBeNull();
    });

    it('generates a data URL for a valid short URL', async () => {
      const mockCtx = {
        fillStyle: '',
        beginPath: vi.fn(),
        roundRect: vi.fn(),
        fill: vi.fn(),
        drawImage: vi.fn(),
      };
      const mockCanvas = {
        getContext: vi.fn(() => mockCtx),
        toDataURL: vi.fn(() => 'data:image/png;base64,mockqr'),
      };
      globalThis.document = {
        createElement: vi.fn(() => mockCanvas),
      } as unknown as Document;

      // Mock Image constructor — simulate logo load failure (catch branch)
      globalThis.Image = vi.fn().mockImplementation(() => {
        const img = { onload: null as (() => void) | null, onerror: null as (() => void) | null, src: '' };
        setTimeout(() => img.onerror?.(), 0);
        return img;
      }) as unknown as typeof Image;

      const result = await generateQrDataUrl('https://example.com/short');
      expect(result).toBe('data:image/png;base64,mockqr');
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.fill).toHaveBeenCalled();

      delete (globalThis as Record<string, unknown>).document;
      delete (globalThis as Record<string, unknown>).Image;
    });

    it('works when canvas context is null', async () => {
      const mockCanvas = {
        getContext: vi.fn(() => null),
        toDataURL: vi.fn(() => 'data:image/png;base64,nologo'),
      };
      globalThis.document = {
        createElement: vi.fn(() => mockCanvas),
      } as unknown as Document;

      const result = await generateQrDataUrl('https://example.com/test');
      expect(result).toBe('data:image/png;base64,nologo');

      delete (globalThis as Record<string, unknown>).document;
    });
  });
});
