import { expect, test, type Page } from '@playwright/test';

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

  // Verify round completed
  await expect(page.getByRole('button', { name: /Next Play/ })).toBeVisible();
}

test.describe('Game Management', () => {
  test('new game shows confirmation popup when game in progress', async ({ page }) => {
    await setupGameWithOneRound(page);

    await page.getByRole('button', { name: 'New game' }).click();
    await expect(page.getByText('Abandon Game?')).toBeVisible();
    await expect(page.getByText('You have a game in progress')).toBeVisible();
  });

  test('cancel keeps game intact', async ({ page }) => {
    await setupGameWithOneRound(page);

    await page.getByRole('button', { name: 'New game' }).click();
    await expect(page.getByText('Abandon Game?')).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();

    // Popup should close, game still visible
    await expect(page.getByText('Abandon Game?')).not.toBeVisible();
    await expect(page).toHaveURL(/#\/game/);
    await expect(page.getByRole('button', { name: /Next Play/ })).toBeVisible();
  });

  test('confirm resets to setup page', async ({ page }) => {
    await setupGameWithOneRound(page);

    await page.getByRole('button', { name: 'New game' }).click();
    await page.getByRole('button', { name: 'Yes, New Game' }).click();

    // Should navigate back to setup
    await expect(page).toHaveURL(/#?\/?$/);
    await expect(page.getByPlaceholder('Player 1')).toBeVisible();
  });

  test('new game button is accessible at all viewports', async ({ page }) => {
    await setupGameWithOneRound(page);

    const btn = page.getByRole('button', { name: 'New game' });
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAccessibleName('New game');

    // Desktop: shows "New Game" text
    await expect(btn.locator('span.hidden.sm\\:inline')).toHaveText('New Game');

    // Mobile: shows "+" icon-sized button
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAccessibleName('New game');
    await expect(btn.locator('span.sm\\:hidden')).toHaveText('+');
  });

  test('page reload shows restore popup', async ({ page }) => {
    await setupGameWithOneRound(page);

    // Reload the page — the app saves to localStorage, so restore popup should appear
    await page.goto('/');

    await expect(page.getByText('Unfinished Game Found')).toBeVisible();
    await expect(page.getByText('Alice, Bob, Charlie')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Restore Game' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start New Game' })).toBeVisible();
  });

  test('restore continues game state', async ({ page }) => {
    await setupGameWithOneRound(page);

    // Reload and restore
    await page.goto('/');
    await expect(page.getByText('Unfinished Game Found')).toBeVisible();
    await page.getByRole('button', { name: 'Restore Game' }).click();

    // Should be back on the game page with data intact
    await expect(page).toHaveURL(/#\/game/);
    await expect(page.getByRole('button', { name: /Next Play/ })).toBeVisible();
    // Scoreboard should have the completed round
    await expect(page.locator('tbody tr')).toHaveCount(1);
  });

  test('start new clears saved game', async ({ page }) => {
    await setupGameWithOneRound(page);

    // Reload and start new
    await page.goto('/');
    await expect(page.getByText('Unfinished Game Found')).toBeVisible();
    await page.getByRole('button', { name: 'Start New Game' }).click();

    // Should stay on setup without the popup
    await expect(page.getByText('Unfinished Game Found')).not.toBeVisible();
    await expect(page.getByPlaceholder('Player 1')).toBeVisible();

    // Reload again — no restore popup should appear
    await page.goto('/');
    await expect(page.getByText('Unfinished Game Found')).not.toBeVisible();
  });
});
