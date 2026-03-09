import { expect, test, type Page } from '@playwright/test';

/** Compress current localStorage game state into a transfer URL path. */
async function getTransferUrl(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const gameId = localStorage.getItem('management-score-pad-active');
    if (!gameId) throw new Error('No active game ID in localStorage');
    const stateJson = localStorage.getItem(`management-score-pad-${gameId}`);
    if (!stateJson) throw new Error('No game state in localStorage');
    const state = JSON.parse(stateJson);
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

/** Set up a 3-player game, navigate to game page, and play one round. */
async function setupGameWithOneRound(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByPlaceholder('Player 1').fill('Alice');
  await page.getByPlaceholder('Player 2').fill('Bob');
  await page.getByPlaceholder('Player 3').fill('Charlie');
  await page.getByRole('button', { name: /Start Game/ }).click();

  // Play one round: bids 5+5+5=15 (valid for 17 cards), results 10+5+2=17
  await page.getByRole('button', { name: 'Start First Play' }).click();
  for (const name of ['Alice', 'Bob', 'Charlie']) {
    const row = page.locator('div.flex.items-center.gap-2', { hasText: name });
    await row.locator('input[type="number"]').fill('5');
  }
  await page.getByRole('button', { name: 'Play!' }).click();

  await page.getByRole('button', { name: 'Enter Results' }).click();
  const resultInputs = page.locator('input[type="number"]');
  await resultInputs.nth(0).fill('10');
  await resultInputs.nth(1).fill('5');
  await resultInputs.nth(2).fill('2');
  await page.getByRole('button', { name: 'Submit Results' }).click();

  await expect(page.getByRole('button', { name: /Next Play/ })).toBeVisible();
}

async function blurActiveElement(page: Page) {
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
}

test.describe('Transfer Game', () => {
  test.describe('Transfer Popup', () => {
    test('share button visible only during game', async ({ page }) => {
      await page.goto('/');
      await page.evaluate(() => localStorage.clear());
      await page.reload();

      // On setup page, share button should not exist
      await expect(page.getByRole('button', { name: 'Transfer game' })).not.toBeVisible();

      // Start a game
      await page.getByPlaceholder('Player 1').fill('Alice');
      await page.getByPlaceholder('Player 2').fill('Bob');
      await page.getByPlaceholder('Player 3').fill('Charlie');
      await page.getByRole('button', { name: /Start Game/ }).click();

      // On game page, share button should be visible
      await expect(page.getByRole('button', { name: 'Transfer game' })).toBeVisible();
    });

    test('opens transfer popup with QR code and game info', async ({ page }) => {
      await setupGameWithOneRound(page);

      await page.getByRole('button', { name: 'Transfer game' }).click();

      const dialog = page.getByRole('dialog');
      await expect(dialog.getByRole('heading', { name: 'Transfer Game' })).toBeVisible();
      // Player standings in sequence with scores and crown on leader
      await expect(dialog.getByText('Alice')).toBeVisible();
      await expect(dialog.getByText('Bob')).toBeVisible();
      await expect(dialog.getByText('Charlie')).toBeVisible();
      await expect(dialog.getByRole('img', { name: 'Leader' })).toBeVisible();
      await expect(dialog.getByText(/Round 1\//)).toBeVisible();
      await expect(dialog.getByText(/cards/)).toBeVisible();

      // QR code image should appear (async generation via useEffect)
      await expect(page.getByAltText('QR code for game transfer')).toBeVisible({ timeout: 5000 });

      // Helper text under QR code
      await expect(dialog.getByText(/Scan to open the scoreboard/)).toBeVisible();

      // Copy Link button should be present
      await expect(page.getByRole('button', { name: 'Copy Link' })).toBeVisible();
    });

    test('Escape closes transfer popup', async ({ page }) => {
      await setupGameWithOneRound(page);

      await page.getByRole('button', { name: 'Transfer game' }).click();
      await expect(page.getByRole('heading', { name: 'Transfer Game' })).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(page.getByRole('heading', { name: 'Transfer Game' })).not.toBeVisible();
    });

    test('close button closes transfer popup', async ({ page }) => {
      await setupGameWithOneRound(page);

      await page.getByRole('button', { name: 'Transfer game' }).click();
      await expect(page.getByRole('heading', { name: 'Transfer Game' })).toBeVisible();

      await page.getByRole('button', { name: 'Close' }).click();
      await expect(page.getByRole('heading', { name: 'Transfer Game' })).not.toBeVisible();
    });

    test('Shift+S opens transfer popup', async ({ page }) => {
      await setupGameWithOneRound(page);

      await blurActiveElement(page);
      await page.keyboard.down('Shift');
      await page.keyboard.press('S');
      await page.keyboard.up('Shift');

      await expect(page.getByRole('heading', { name: 'Transfer Game' })).toBeVisible();
    });

    test('Shift+S does not trigger when focus is in an input', async ({ page }) => {
      await setupGameWithOneRound(page);

      // Open bid popup to get an input field
      await page.getByRole('button', { name: /Next Play/ }).click();
      await expect(page.getByText('Place Bids')).toBeVisible();

      const firstInput = page.locator('input[type="number"]').first();
      await firstInput.focus();

      await page.keyboard.down('Shift');
      await page.keyboard.press('S');
      await page.keyboard.up('Shift');

      // Transfer popup should NOT appear
      await expect(page.getByRole('heading', { name: 'Transfer Game' })).not.toBeVisible();
    });
  });

  test.describe('Import Page', () => {
    test('shows error for missing data', async ({ page }) => {
      await page.goto('/#/import');

      await expect(page.getByText('Import Failed')).toBeVisible();
      await expect(page.getByText('No game data found')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Go to Home' })).toBeVisible();
    });

    test('shows error for corrupted data', async ({ page }) => {
      await page.goto('/#/import?d=invalid-corrupted-data');

      await expect(page.getByText('Import Failed')).toBeVisible();
      await expect(page.getByText(/Invalid or corrupted/)).toBeVisible();
    });

    test('Go to Home navigates to setup page', async ({ page }) => {
      await page.goto('/#/import');

      await expect(page.getByText('Import Failed')).toBeVisible();
      await page.getByRole('button', { name: 'Go to Home' }).click();

      await expect(page).toHaveURL(/#?\/?$/);
    });

    test('valid transfer link shows import page with game summary', async ({ page }) => {
      await setupGameWithOneRound(page);

      const transferUrl = await getTransferUrl(page);
      await page.goto(transferUrl);

      await expect(page.getByRole('heading', { name: 'Import Game' })).toBeVisible();
      await expect(page.getByText('3 Players')).toBeVisible();
      await expect(page.getByText('Alice, Bob, Charlie')).toBeVisible();
      await expect(page.getByText(/Round 1\//)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Import Game' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    });

    test('cancel with active game navigates to game page', async ({ page }) => {
      await setupGameWithOneRound(page);

      const transferUrl = await getTransferUrl(page);
      await page.goto(transferUrl);
      await expect(page.getByRole('heading', { name: 'Import Game' })).toBeVisible();

      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(page).toHaveURL(/#\/game/);
    });

    test('cancel without active game navigates to home', async ({ page }) => {
      await setupGameWithOneRound(page);

      const transferUrl = await getTransferUrl(page);
      // Clear localStorage to simulate no active game
      await page.evaluate(() => localStorage.clear());
      await page.goto(transferUrl);
      await expect(page.getByRole('heading', { name: 'Import Game' })).toBeVisible();

      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(page).toHaveURL(/#?\/?$/);
    });

    test('importing game loads state and navigates to game page', async ({ page }) => {
      await setupGameWithOneRound(page);

      const transferUrl = await getTransferUrl(page);

      // Clear localStorage to simulate a different device
      await page.evaluate(() => localStorage.clear());
      await page.goto(transferUrl);

      await expect(page.getByRole('heading', { name: 'Import Game' })).toBeVisible();
      await page.getByRole('button', { name: 'Import Game' }).click();

      // Should navigate to game page with the imported state
      await expect(page).toHaveURL(/#\/game/);
      await expect(page.getByRole('button', { name: /Next Play/ })).toBeVisible();
      await expect(page.locator('tbody tr')).toHaveCount(1);
    });

    test('shows warning when importing with active game', async ({ page }) => {
      await setupGameWithOneRound(page);

      const transferUrl = await getTransferUrl(page);

      // Navigate to import URL (localStorage still has the active game)
      await page.goto(transferUrl);

      await expect(page.getByRole('heading', { name: 'Import Game' })).toBeVisible();
      await expect(page.getByText('Warning: Active game in progress')).toBeVisible();
      await expect(page.getByText('Importing will replace your current game')).toBeVisible();
    });
  });
});
