import { Avatar, Style } from '@dicebear/core';
import botttsDefinition from '@dicebear/styles/bottts.json';
import croodlesDefinition from '@dicebear/styles/croodles.json';
import loreleiDefinition from '@dicebear/styles/lorelei.json';
import pixelArtDefinition from '@dicebear/styles/pixel-art.json';

const STYLES = {
  bottts: new Style(botttsDefinition),
  croodles: new Style(croodlesDefinition),
  lorelei: new Style(loreleiDefinition),
  pixelArt: new Style(pixelArtDefinition),
} as const;
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
  uri = new Avatar(STYLES[style] ?? STYLES.bottts, { seed, size: 64 }).toDataUri();
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

/**
 * Pick a random avatar from ALL_AVATARS, preferring one not in `exclude`.
 * Falls back to the full pool when every avatar is excluded.
 */
export function getRandomAvatar(exclude: readonly string[] = []): string {
  const pool = ALL_AVATARS.filter((a) => !exclude.includes(a));
  const choices = pool.length > 0 ? pool : ALL_AVATARS;
  return choices[Math.floor(Math.random() * choices.length)];
}
