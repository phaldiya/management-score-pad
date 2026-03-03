import { bottts, croodles, lorelei, pixelArt } from '@dicebear/collection';
import { createAvatar } from '@dicebear/core';

const STYLES = { bottts, croodles, lorelei, pixelArt } as const;
type StyleName = keyof typeof STYLES;

// Avatar ID format: "style:seed" e.g. "bottts:Zoe"
function parse(id: string): { style: StyleName; seed: string } {
  const idx = id.indexOf(':');
  if (idx === -1) return { style: 'bottts', seed: id };
  return { style: id.slice(0, idx) as StyleName, seed: id.slice(idx + 1) };
}

const cache = new Map<string, string>();

export function getAvatarDataUri(id: string): string {
  let uri = cache.get(id);
  if (uri) return uri;
  const { style, seed } = parse(id);
  const styleDef = STYLES[style] ?? STYLES.bottts;
  uri = createAvatar(styleDef, { seed, size: 64 }).toDataUri();
  cache.set(id, uri);
  return uri;
}

const SEEDS = [
  'Zoe',
  'Kai',
  'Luna',
  'Max',
  'Ruby',
  'Finn',
  'Sunny',
  'Star',
  'Blaze',
  'Coral',
  'Mint',
  'Berry',
  'Nova',
  'Sage',
  'Ash',
  'Wren',
  'Reed',
  'Sky',
  'Jade',
  'Fox',
];

export const AVATAR_CATEGORIES = [
  { label: 'Bots', avatars: SEEDS.map((s) => `bottts:${s}`) },
  { label: 'Croodles', avatars: SEEDS.map((s) => `croodles:${s}`) },
  { label: 'Pixel Art', avatars: SEEDS.map((s) => `pixelArt:${s}`) },
  { label: 'Lorelei', avatars: SEEDS.map((s) => `lorelei:${s}`) },
];

export const ALL_AVATARS = AVATAR_CATEGORIES.flatMap((c) => c.avatars);
export const DEFAULT_AVATAR = 'bottts:Zoe';
