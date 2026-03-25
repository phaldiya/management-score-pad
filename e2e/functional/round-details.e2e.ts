import { expect, test, type Page } from '@playwright/test';

/** Set up a 3-player game and navigate to the game page. */
async function setupGame(page: Page, players = ['Alice', 'Bob', 'Charlie']) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  for (let i = 0; i < players.length; i++) {
    await page.getByPlaceholder(`Player ${i + 1}`).fill(players[i]);
  }
  await page.getByRole('button', { name: /Start Game/ }).click();
  await expect(page).toHaveURL(/#\/game/);
}

/** Open the bid popup, fill bids by player name, and submit. */
async function placeBids(page: Page, bids: number[], players = ['Alice', 'Bob', 'Charlie']) {
  const actionButton = page.locator('button', { hasText: /Start First Play|Next Play/ });
  await actionButton.click();
  await expect(page.getByText('Place Bids')).toBeVisible();
  for (let i = 0; i < bids.length && i < players.length; i++) {
    const row = page.locator('div.flex.items-center.gap-2', { hasText: players[i] });
    await row.locator('input[type="number"]').fill(String(bids[i]));
  }
  await page.getByRole('button', { name: 'Play!' }).click();
}

/** Open the results popup, fill results by player name, and submit. */
async function enterResults(page: Page, results: number[], players = ['Alice', 'Bob', 'Charlie']) {
  await page.getByRole('button', { name: 'Enter Results' }).click();
  await expect(page.getByRole('heading', { name: /Enter Results/ })).toBeVisible();
  for (let i = 0; i < results.length && i < players.length; i++) {
    const row = page.locator('div.flex.items-center.gap-2', { hasText: players[i] });
    await row.locator('input[type="number"]').fill(String(results[i]));
  }
  await page.getByRole('button', { name: 'Submit Results' }).click();
}

/** Complete one full round (bid + result). */
async function playRound(page: Page, bids: number[], results: number[], players = ['Alice', 'Bob', 'Charlie']) {
  await placeBids(page, bids, players);
  await enterResults(page, results, players);
}

// 3 players → 17 cards per round. Bids must NOT total 17 (dealer rule).
// Results MUST total 17.
const BIDS = [5, 5, 5]; // total=15 ≠ 17
const RESULTS = [5, 5, 7]; // total=17

test.describe('Round Details Popup', () => {
  test.describe('Clickability', () => {
    test('completed round play card is clickable', async ({ page }) => {
      await setupGame(page);
      await playRound(page, BIDS, RESULTS);

      // The play card cell should be a button
      await expect(page.getByRole('button', { name: /View play 1 details/ })).toBeVisible();
    });

    test('in-progress round play card is not affected', async ({ page }) => {
      await setupGame(page);
      await placeBids(page, BIDS);

      // In-progress round should still have the original details button
      await expect(page.getByRole('button', { name: /View play 1 details/ })).toBeVisible();
    });

    test('no clickable play card before any rounds', async ({ page }) => {
      await setupGame(page);
      await expect(page.getByRole('button', { name: /View play.*details/ })).not.toBeVisible();
    });
  });

  test.describe('Opening and closing', () => {
    test('clicking completed round opens details popup', async ({ page }) => {
      await setupGame(page);
      await playRound(page, BIDS, RESULTS);

      await page.getByRole('button', { name: /View play 1 details/ }).click();

      await expect(page.getByRole('heading', { name: 'Play 1 Details' })).toBeVisible();
    });

    test('close button closes details popup', async ({ page }) => {
      await setupGame(page);
      await playRound(page, BIDS, RESULTS);

      await page.getByRole('button', { name: /View play 1 details/ }).click();
      await expect(page.getByRole('heading', { name: 'Play 1 Details' })).toBeVisible();

      await page.getByRole('button', { name: 'Close' }).click();
      await expect(page.getByRole('heading', { name: 'Play 1 Details' })).not.toBeVisible();
    });

    test('Escape key closes details popup', async ({ page }) => {
      await setupGame(page);
      await playRound(page, BIDS, RESULTS);

      await page.getByRole('button', { name: /View play 1 details/ }).click();
      await expect(page.getByRole('heading', { name: 'Play 1 Details' })).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(page.getByRole('heading', { name: 'Play 1 Details' })).not.toBeVisible();
    });
  });

  test.describe('Content', () => {
    test('shows all player names', async ({ page }) => {
      await setupGame(page);
      await playRound(page, BIDS, RESULTS);

      await page.getByRole('button', { name: /View play 1 details/ }).click();
      const dialog = page.getByRole('dialog', { name: 'Play 1 Details' });

      await expect(dialog.getByText('Alice')).toBeVisible();
      await expect(dialog.getByText('Bob')).toBeVisible();
      await expect(dialog.getByText('Charlie')).toBeVisible();
    });

    test('shows column headers', async ({ page }) => {
      await setupGame(page);
      await playRound(page, BIDS, RESULTS);

      await page.getByRole('button', { name: /View play 1 details/ }).click();
      const dialog = page.getByRole('dialog', { name: 'Play 1 Details' });

      await expect(dialog.getByText('Player')).toBeVisible();
      await expect(dialog.getByText('Bid')).toBeVisible();
      await expect(dialog.getByText('Won')).toBeVisible();
      await expect(dialog.getByText('Score')).toBeVisible();
      await expect(dialog.getByText('Total')).toBeVisible();
    });

    test('shows correct scores for matched bids', async ({ page }) => {
      await setupGame(page);
      // Alice bids 5, gets 5 → 50; Bob bids 5, gets 5 → 50; Charlie bids 5, gets 7 → 0
      await playRound(page, BIDS, RESULTS);

      await page.getByRole('button', { name: /View play 1 details/ }).click();
      const dialog = page.getByRole('dialog', { name: 'Play 1 Details' });

      // Alice matched: green background
      const aliceRow = dialog.locator('div.grid.rounded-lg', { hasText: 'Alice' });
      await expect(aliceRow).toHaveClass(/bg-green-50/);

      // Charlie missed: red background
      const charlieRow = dialog.locator('div.grid.rounded-lg', { hasText: 'Charlie' });
      await expect(charlieRow).toHaveClass(/bg-red-50/);
    });

    test('can view different rounds independently', async ({ page }) => {
      await setupGame(page);
      await playRound(page, BIDS, RESULTS);
      await playRound(page, [4, 4, 6], [4, 4, 8]);

      // View round 1
      await page.getByRole('button', { name: /View play 1 details/ }).click();
      await expect(page.getByRole('heading', { name: 'Play 1 Details' })).toBeVisible();
      await page.keyboard.press('Escape');

      // View round 2
      await page.getByRole('button', { name: /View play 2 details/ }).click();
      await expect(page.getByRole('heading', { name: 'Play 2 Details' })).toBeVisible();
    });

    test('shows cumulative totals across rounds', async ({ page }) => {
      await setupGame(page);
      // Round 1: Alice bids 5, gets 5 → 50 (cumulative: 50)
      await playRound(page, BIDS, RESULTS);
      // Round 2: Alice bids 4, gets 4 → 40 (cumulative: 90)
      await playRound(page, [4, 4, 6], [4, 4, 8]);

      // Open round 2 details — Alice's total should be 90
      await page.getByRole('button', { name: /View play 2 details/ }).click();
      const dialog = page.getByRole('dialog', { name: 'Play 2 Details' });
      const aliceRow = dialog.locator('div.grid.rounded-lg', { hasText: 'Alice' });
      await expect(aliceRow).toContainText('90');
    });
  });
});
