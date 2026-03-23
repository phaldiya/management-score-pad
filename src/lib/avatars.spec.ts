import { describe, expect, it } from 'vitest';

import { ALL_AVATARS, AVATAR_CATEGORIES, DEFAULT_AVATAR, getAvatarDataUri } from './avatars.ts';

describe('avatars', () => {
  describe('AVATAR_CATEGORIES', () => {
    it('has 4 categories', () => {
      expect(AVATAR_CATEGORIES).toHaveLength(4);
    });

    it('categories are Bots, Croodles, Pixel Art, Lorelei', () => {
      const labels = AVATAR_CATEGORIES.map((c) => c.label);
      expect(labels).toEqual(['Bots', 'Croodles', 'Pixel Art', 'Lorelei']);
    });

    it('each category has 20 avatars', () => {
      for (const cat of AVATAR_CATEGORIES) {
        expect(cat.avatars).toHaveLength(20);
      }
    });

    it('avatar IDs follow style:seed format', () => {
      for (const cat of AVATAR_CATEGORIES) {
        for (const avatar of cat.avatars) {
          expect(avatar).toMatch(/^(bottts|croodles|pixelArt|lorelei):\w+$/);
        }
      }
    });

    it('Bots avatars use bottts style', () => {
      const bots = AVATAR_CATEGORIES.find((c) => c.label === 'Bots');
      for (const avatar of bots!.avatars) {
        expect(avatar).toMatch(/^bottts:/);
      }
    });
  });

  describe('ALL_AVATARS', () => {
    it('contains 80 avatars (4 categories × 20 seeds)', () => {
      expect(ALL_AVATARS).toHaveLength(80);
    });

    it('has no duplicates', () => {
      const unique = new Set(ALL_AVATARS);
      expect(unique.size).toBe(ALL_AVATARS.length);
    });
  });

  describe('DEFAULT_AVATAR', () => {
    it('is bottts:Zoe', () => {
      expect(DEFAULT_AVATAR).toBe('bottts:Zoe');
    });

    it('is included in ALL_AVATARS', () => {
      expect(ALL_AVATARS).toContain(DEFAULT_AVATAR);
    });
  });

  describe('getAvatarDataUri', () => {
    it('returns a data URI string for a valid avatar ID', () => {
      const uri = getAvatarDataUri('bottts:Zoe');
      expect(uri).toMatch(/^data:image\/svg\+xml;/);
    });

    it('returns cached result on second call', () => {
      const first = getAvatarDataUri('bottts:Kai');
      const second = getAvatarDataUri('bottts:Kai');
      expect(first).toBe(second);
    });

    it('handles different styles', () => {
      const bottts = getAvatarDataUri('bottts:Luna');
      const croodles = getAvatarDataUri('croodles:Luna');
      const pixelArt = getAvatarDataUri('pixelArt:Luna');
      const lorelei = getAvatarDataUri('lorelei:Luna');

      // All should be valid data URIs but different
      expect(bottts).toMatch(/^data:image\/svg\+xml;/);
      expect(croodles).toMatch(/^data:image\/svg\+xml;/);
      expect(pixelArt).toMatch(/^data:image\/svg\+xml;/);
      expect(lorelei).toMatch(/^data:image\/svg\+xml;/);
      expect(bottts).not.toBe(croodles);
    });

    it('falls back to bottts for ID without colon', () => {
      const uri = getAvatarDataUri('JustASeed');
      expect(uri).toMatch(/^data:image\/svg\+xml;/);
    });

    it('falls back to bottts for unknown style', () => {
      const uri = getAvatarDataUri('unknownStyle:Zoe');
      expect(uri).toMatch(/^data:image\/svg\+xml;/);
    });

    it('produces different URIs for different seeds', () => {
      const a = getAvatarDataUri('bottts:Alpha');
      const b = getAvatarDataUri('bottts:Beta');
      expect(a).not.toBe(b);
    });
  });
});
