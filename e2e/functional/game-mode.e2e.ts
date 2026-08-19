import { expect, test, type Page } from '@playwright/test';

import { setStepperValue } from '../helpers.ts';

const PLAYERS = ['Alice', 'Bob', 'Charlie'];
// 3 players → 17 cards. Bids must NOT total 17 (dealer rule); results MUST total 17.
const BIDS = [5, 5, 5]; // total=15 ≠ 17 ✓
const RESULTS = [5, 5, 7]; // total=17 ✓ — Alice and Bob meet their bids, Charlie misses

async function gotoSetup(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

async function startGame(page: Page) {
  for (let i = 0; i < PLAYERS.length; i++) {
    await page.getByPlaceholder(`Player ${i + 1}`).fill(PLAYERS[i]);
  }
  await page.getByRole('button', { name: /Start Game/ }).click();
  await expect(page).toHaveURL(/#\/game/);
}

async function playRound(page: Page, bids: number[], results: number[]) {
  await page.locator('button', { hasText: /Start First Play|Next Play/ }).click();
  await expect(page.getByText('Place Bids')).toBeVisible();
  for (let i = 0; i < bids.length; i++) {
    const row = page.locator('div.flex.items-center.gap-2', { hasText: PLAYERS[i] });
    await setStepperValue(row.locator('input[type="number"]'), bids[i]);
  }
  await page.getByRole('button', { name: 'Play!' }).click();

  await page.getByRole('button', { name: 'Enter Results' }).click();
  await expect(page.getByRole('heading', { name: /Enter Results/ })).toBeVisible();
  for (let i = 0; i < results.length; i++) {
    const row = page.locator('div.flex.items-center.gap-2', { hasText: PLAYERS[i] });
    await setStepperValue(row.locator('input[type="number"]'), results[i]);
  }
  await page.getByRole('button', { name: 'Submit Results' }).click();
}

/** Compress a fresh 3-player classic game into a transfer URL path (QR code payload). */
async function buildClassicTransferUrl(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const down = Array.from({ length: 17 }, (_, i) => 17 - i);
    const state = {
      gameId: 'e2e-import-classic',
      gamePhase: 'playing',
      gameMode: 'classic',
      players: [
        { id: 'p1', name: 'Alice', avatar: 'bottts:Zoe' },
        { id: 'p2', name: 'Bob', avatar: 'bottts:Zoe' },
        { id: 'p3', name: 'Charlie', avatar: 'bottts:Zoe' },
      ],
      rounds: [],
      currentRoundIndex: -1,
      cardSequence: [...down, ...down.slice(0, -1).reverse()],
      maxCardsPerPlayer: 17,
      totalGames: 33,
    };
    const payload = JSON.stringify({ v: 1, state });
    const input = new TextEncoder().encode(payload);
    const cs = new CompressionStream('deflate');
    const writer = cs.writable.getWriter();
    writer.write(input);
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
    let binary = '';
    for (const byte of compressed) {
      binary += String.fromCharCode(byte);
    }
    const encoded = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `/#/import?d=${encoded}`;
  });
}

function readActiveGameMode(page: Page) {
  return page.evaluate(() => {
    const gameId = localStorage.getItem('management-score-pad-active');
    if (!gameId) return null;
    const raw = localStorage.getItem(`management-score-pad-${gameId}`);
    return raw ? (JSON.parse(raw).gameMode ?? null) : null;
  });
}

test.describe('Game Mode', () => {
  test.beforeEach(async ({ page }) => {
    await gotoSetup(page);
  });

  test('setup page defaults to Classic with scoring rules shown', async ({ page }) => {
    const classic = page.getByRole('button', { name: 'Classic' }).first();
    const advance = page.getByRole('button', { name: 'Advance' }).first();
    const pro = page.getByRole('button', { name: 'Pro' }).first();
    await expect(classic).toHaveAttribute('aria-pressed', 'true');
    await expect(advance).toHaveAttribute('aria-pressed', 'false');
    await expect(pro).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByText('Exact bid scores bid × 10').first()).toBeVisible();
  });

  test('switching to Advance updates rules and shows the + badge on the app icon', async ({ page }) => {
    await expect(page.getByTestId('advance-mode-badge')).toHaveCount(0);

    await page.getByRole('button', { name: 'Advance' }).first().click();

    await expect(page.getByRole('button', { name: 'Advance' }).first()).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('Exact bid scores 10 + bid').first()).toBeVisible();
    await expect(page.getByTestId('advance-mode-badge').first()).toBeVisible();
  });

  test('switching to Pro updates rules and shows the ± badge on the app icon', async ({ page }) => {
    await expect(page.getByTestId('pro-mode-badge')).toHaveCount(0);

    await page.getByRole('button', { name: 'Pro' }).first().click();

    await expect(page.getByRole('button', { name: 'Pro' }).first()).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('Missed bid scores −bid').first()).toBeVisible();
    await expect(page.getByText('Missed zero bid scores −1').first()).toBeVisible();
    await expect(page.getByTestId('pro-mode-badge').first()).toBeVisible();
    await expect(page.getByTestId('advance-mode-badge')).toHaveCount(0);
  });

  test('game mode is stored with the game state and restored on reload', async ({ page }) => {
    await page.getByRole('button', { name: 'Advance' }).first().click();
    await startGame(page);

    expect(await readActiveGameMode(page)).toBe('advance');

    await page.reload();
    await expect(page.getByTestId('advance-mode-badge').first()).toBeVisible();
  });

  test('mode can be switched on the game page before the first play', async ({ page }) => {
    await startGame(page);
    expect(await readActiveGameMode(page)).toBe('classic');

    await page.getByRole('button', { name: 'Advance' }).click();
    expect(await readActiveGameMode(page)).toBe('advance');
    await expect(page.getByTestId('advance-mode-badge').first()).toBeVisible();
  });

  test('mode toggle is not available after the first play starts', async ({ page }) => {
    await startGame(page);
    await playRound(page, BIDS, RESULTS);
    await expect(page.getByRole('button', { name: 'Classic' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Advance' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Pro' })).toHaveCount(0);
  });

  test('classic mode scores bid × 10', async ({ page }) => {
    await startGame(page);
    await playRound(page, BIDS, RESULTS);

    // Alice and Bob met bid 5 → 50 each; Charlie missed → 0.
    const row = page.locator('tbody tr').first();
    await expect(row).toContainText('50');
    const cells = row.locator('td');
    await expect(cells.nth(1)).toContainText('50');
    await expect(cells.nth(2)).toContainText('50');
    await expect(cells.nth(3)).toContainText('0');
  });

  test('advance mode scores 10 + bid', async ({ page }) => {
    await page.getByRole('button', { name: 'Advance' }).first().click();
    await startGame(page);
    await playRound(page, BIDS, RESULTS);

    // Alice and Bob met bid 5 → 15 each; Charlie missed → 0.
    const row = page.locator('tbody tr').first();
    const cells = row.locator('td');
    await expect(cells.nth(1)).toContainText('15');
    await expect(cells.nth(2)).toContainText('15');
    await expect(cells.nth(3)).toContainText('0');
  });

  test('pro mode scores 10 + bid and deducts missed bids', async ({ page }) => {
    await page.getByRole('button', { name: 'Pro' }).first().click();
    await startGame(page);
    // Bids total 10 ≠ 17 ✓; results total 17 ✓.
    await playRound(page, [0, 5, 5], [1, 5, 11]);

    // Alice missed nil → −1; Bob met bid 5 → 15; Charlie missed bid 5 → −5.
    const row = page.locator('tbody tr').first();
    const cells = row.locator('td');
    await expect(cells.nth(1)).toContainText('-1');
    await expect(cells.nth(2)).toContainText('15');
    await expect(cells.nth(3)).toContainText('-5');
  });

  test('restoring a stored game overrides the selected game mode', async ({ page }) => {
    // Save a classic game, then flip the mode preference to advance (as if changed in another session).
    await startGame(page);
    expect(await readActiveGameMode(page)).toBe('classic');
    await page.evaluate(() => localStorage.setItem('management-score-pad-mode', 'advance'));

    // A fresh visit offers to restore the stored game — its classic mode must win over the advance preference.
    await page.goto('/');
    await page.getByRole('button', { name: 'Restore Game' }).click();
    await expect(page).toHaveURL(/#\/game/);
    await expect(page.getByText('No plays yet')).toBeVisible();
    await expect(page.getByTestId('advance-mode-badge')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Classic' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('importing a game via QR code overrides the selected game mode', async ({ page }) => {
    // Select Advance, then import a classic game via a QR payload.
    await page.getByRole('button', { name: 'Advance' }).first().click();
    await expect(page.getByTestId('advance-mode-badge').first()).toBeVisible();

    // Import the classic game — its mode must win over the advance selection.
    const transferUrl = await buildClassicTransferUrl(page);
    await page.goto(transferUrl);
    await page.getByRole('button', { name: 'Import Game' }).click();
    await expect(page).toHaveURL(/#\/game/);
    await expect(page.getByText('No plays yet')).toBeVisible();
    await expect(page.getByTestId('advance-mode-badge')).toHaveCount(0);
    expect(await readActiveGameMode(page)).toBe('classic');
  });

  test('hidden: 5 taps on the logo open the mode switch dialog mid-game', async ({ page }) => {
    await startGame(page);
    await playRound(page, BIDS, RESULTS);

    const logo = page.getByRole('button', { name: 'Management Score Pad logo' });
    for (let i = 0; i < 5; i++) {
      await logo.click();
    }
    await expect(page.getByRole('heading', { name: 'Switch Game Mode' })).toBeVisible();

    // Switch Classic → Pro and confirm; completed round is re-scored (50/50/0 → 15/15/−5).
    await page.getByRole('button', { name: 'Pro' }).click();
    await page.getByRole('button', { name: 'Switch Mode' }).click();
    await expect(page.getByRole('heading', { name: 'Switch Game Mode' })).toHaveCount(0);

    const cells = page.locator('tbody tr').first().locator('td');
    await expect(cells.nth(1)).toContainText('15');
    await expect(cells.nth(2)).toContainText('15');
    await expect(cells.nth(3)).toContainText('-5');
    await expect(page.getByTestId('pro-mode-badge').first()).toBeVisible();
    expect(await readActiveGameMode(page)).toBe('pro');
  });

  test('hidden: logo taps do nothing on the setup page', async ({ page }) => {
    const logo = page.getByRole('button', { name: 'Management Score Pad logo' });
    for (let i = 0; i < 5; i++) {
      await logo.click();
    }
    await expect(page.getByRole('heading', { name: 'Switch Game Mode' })).toHaveCount(0);
  });

  test('hidden: Shift+M opens the mode switch dialog and Escape closes it', async ({ page }) => {
    await startGame(page);

    // Opening over another popup replaces it — popups never stack.
    await page.getByRole('button', { name: 'Game rules' }).click();
    await expect(page.getByRole('heading', { name: 'Game Rules' })).toBeVisible();
    await page.keyboard.press('Shift+M');
    await expect(page.getByRole('heading', { name: 'Switch Game Mode' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Game Rules' })).toHaveCount(0);

    // Confirm is disabled while the current mode is selected.
    await expect(page.getByRole('button', { name: 'Switch Mode' })).toBeDisabled();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Switch Game Mode' })).toHaveCount(0);
    expect(await readActiveGameMode(page)).toBe('classic');
  });

  test('hidden: triple-tapping a mode header in Game Rules pre-selects that mode', async ({ page }) => {
    await startGame(page);
    await playRound(page, BIDS, RESULTS);

    await page.getByRole('button', { name: 'Game rules' }).click();
    await page.getByRole('tab', { name: 'Scoring' }).click();
    await page.getByRole('button', { name: 'Pro' }).click({ clickCount: 3 });

    // Rules popup closes, switch dialog opens with Pro pre-selected — confirm directly.
    await expect(page.getByRole('heading', { name: 'Switch Game Mode' })).toBeVisible();
    await page.getByRole('button', { name: 'Switch Mode' }).click();

    const cells = page.locator('tbody tr').first().locator('td');
    await expect(cells.nth(1)).toContainText('15');
    await expect(cells.nth(3)).toContainText('-5');
    expect(await readActiveGameMode(page)).toBe('pro');
  });

  test('a new game defaults to the last game mode', async ({ page }) => {
    await page.getByRole('button', { name: 'Advance' }).first().click();
    await startGame(page);

    // Abandon and start over — setup page should come back in Advance mode.
    await page.getByRole('button', { name: 'New game' }).click();
    await expect(page.getByRole('button', { name: 'Advance' }).first()).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('advance-mode-badge').first()).toBeVisible();

    // Even in a fresh session (only the mode preference kept), Advance stays the default.
    await page.evaluate(() => {
      const mode = localStorage.getItem('management-score-pad-mode');
      localStorage.clear();
      if (mode) localStorage.setItem('management-score-pad-mode', mode);
    });
    await page.reload();
    await expect(page.getByRole('button', { name: 'Advance' }).first()).toHaveAttribute('aria-pressed', 'true');
  });
});
