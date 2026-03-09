import QRCode from 'qrcode';
import { z } from 'zod';

import type { AppState } from '../types/index.ts';

const TRANSFER_VERSION = 1;

const PlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string(),
});

const PlayerRoundDataSchema = z.object({
  playerId: z.string(),
  bid: z.number(),
  result: z.number().nullable(),
  score: z.number().nullable(),
  isDealer: z.boolean(),
});

const GameRoundSchema = z.object({
  gameIndex: z.number(),
  gameNumber: z.number(),
  cardCount: z.number(),
  trump: z.enum(['spades', 'hearts', 'clubs', 'diamonds']),
  phase: z.enum(['bidding', 'in_progress', 'completed']),
  playerData: z.array(PlayerRoundDataSchema),
});

const AppStateSchema = z.object({
  gameId: z.string().nullable(),
  gamePhase: z.enum(['setup', 'playing']),
  players: z.array(PlayerSchema),
  rounds: z.array(GameRoundSchema),
  currentRoundIndex: z.number(),
  cardSequence: z.array(z.number()),
  maxCardsPerPlayer: z.number(),
  totalGames: z.number(),
});

const TransferPayloadSchema = z.object({
  v: z.literal(TRANSFER_VERSION),
  state: AppStateSchema,
});

function base64urlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function compressState(state: AppState): Promise<string> {
  const payload = { v: TRANSFER_VERSION, state };
  const json = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const input = encoder.encode(json);

  if (typeof CompressionStream === 'undefined') {
    return base64urlEncode(input);
  }

  const cs = new CompressionStream('deflate');
  const writer = cs.writable.getWriter();
  writer.write(input as unknown as BufferSource);
  writer.close();

  const reader = cs.readable.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    totalLength += value.length;
  }

  const compressed = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    compressed.set(chunk, offset);
    offset += chunk.length;
  }

  return base64urlEncode(compressed);
}

export async function decompressState(encoded: string): Promise<AppState> {
  const cleaned = encoded.replace(/[^A-Za-z0-9_-].*$/, '');
  const bytes = base64urlDecode(cleaned);

  let json: string;

  if (typeof DecompressionStream === 'undefined') {
    json = new TextDecoder().decode(bytes);
  } else {
    try {
      const ds = new DecompressionStream('deflate');
      const writer = ds.writable.getWriter();
      // Catch writer errors to prevent unhandled rejections
      const writePromise = writer.write(bytes as unknown as BufferSource).catch(() => {});
      const closePromise = writer.close().catch(() => {});

      const reader = ds.readable.getReader();
      const chunks: Uint8Array[] = [];
      let totalLength = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        totalLength += value.length;
      }

      await writePromise;
      await closePromise;

      const decompressed = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        decompressed.set(chunk, offset);
        offset += chunk.length;
      }

      json = new TextDecoder().decode(decompressed);
    } catch {
      // Fallback: try raw base64 (uncompressed)
      json = new TextDecoder().decode(bytes);
    }
  }

  const parsed = JSON.parse(json);
  const result = TransferPayloadSchema.parse(parsed);
  return result.state;
}

export async function buildTransferUrl(state: AppState): Promise<string> {
  const encoded = await compressState(state);
  const base = window.location.href.split('#')[0];
  return `${base}#/import?d=${encoded}.`;
}

// Max QR code capacity for alphanumeric is ~4296 chars, but URL-safe base64 uses byte mode (~2953 chars).
// With error correction level H (30%), capacity is lower (~1273 bytes), so reduce max length accordingly.
const QR_URL_MAX_LENGTH = 1200;

const QR_DISPLAY_SIZE = 300;
const QR_SCALE = 2;
const QR_SIZE = QR_DISPLAY_SIZE * QR_SCALE;
const LOGO_RATIO = 0.2;

function loadImage(src: string, width: number, height: number): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image(width, height);
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function generateQrDataUrl(url: string): Promise<string | null> {
  if (url.length > QR_URL_MAX_LENGTH) {
    return null;
  }

  const canvas = document.createElement('canvas');
  await QRCode.toCanvas(canvas, url, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: QR_SIZE,
    color: { dark: '#000000', light: '#ffffff' },
  });

  const ctx = canvas.getContext('2d');
  if (ctx) {
    const logoSize = Math.round(QR_SIZE * LOGO_RATIO);
    const logoOffset = Math.round((QR_SIZE - logoSize) / 2);
    const paddingX = 0;
    const paddingY = 3 * QR_SCALE;
    const radius = 8 * QR_SCALE;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(
      logoOffset - paddingX,
      logoOffset - paddingY,
      logoSize + paddingX * 2,
      logoSize + paddingY * 2,
      radius,
    );
    ctx.fill();

    try {
      const logoSrc = `${import.meta.env.BASE_URL}favicon.svg`;
      const logo = await loadImage(logoSrc, logoSize, logoSize);
      ctx.drawImage(logo, logoOffset, logoOffset, logoSize, logoSize);
    } catch {
      // Logo failed to load — QR code still works without it
    }
  }

  return canvas.toDataURL('image/png');
}
