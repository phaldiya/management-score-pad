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

/** Blur any focused input so keyboard shortcuts reach the document. */
async function blurActiveElement(page: Page) {
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
}

// 3 players → 17 cards per round. Bids must NOT total 17 (dealer rule).
// Results MUST total 17.
const BIDS = [5, 5, 5]; // total=15 ≠ 17 ✓
const RESULTS = [5, 5, 7]; // total=17 ✓

test.describe('Delete Last Play', () => {
  test.describe('Delete button visibility', () => {
    test('no delete button before any rounds are played', async ({ page }) => {
      await setupGame(page);
      await expect(page.getByRole('button', { name: /Delete play/ })).not.toBeVisible();
    });

    test('no delete button while round is in progress with no completed rounds', async ({ page }) => {
      await setupGame(page);
      await placeBids(page, BIDS);
      await expect(page.getByRole('button', { name: /Delete play/ })).not.toBeVisible();
    });

    test('delete button appears after a round is completed', async ({ page }) => {
      await setupGame(page);
      await playRound(page, BIDS, RESULTS);
      await expect(page.getByRole('button', { name: /Delete play 1/ })).toBeVisible();
    });

    test('delete button only on the last completed round', async ({ page }) => {
      await setupGame(page);
      await playRound(page, BIDS, RESULTS);
      await playRound(page, [4, 4, 6], [4, 4, 8]);
      // Only play 2 should have the delete button
      await expect(page.getByRole('button', { name: /Delete play 2/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /Delete play 1/ })).not.toBeVisible();
    });
  });

  test.describe('Confirmation dialog', () => {
    test('clicking delete button opens confirmation dialog', async ({ page }) => {
      await setupGame(page);
      await playRound(page, BIDS, RESULTS);
      await page.getByRole('button', { name: /Delete play 1/ }).click();

      await expect(page.getByRole('heading', { name: 'Delete Last Play?' })).toBeVisible();
      await expect(page.getByText(/Delete Play 1/)).toBeVisible();
      await expect(page.getByText(/17 cards/)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Yes, Delete' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    });

    test('cancel closes dialog without deleting', async ({ page }) => {
      await setupGame(page);
      await playRound(page, BIDS, RESULTS);
      await page.getByRole('button', { name: /Delete play 1/ }).click();
      await page.getByRole('button', { name: 'Cancel' }).click();

      // Dialog closed, round still exists
      await expect(page.getByRole('heading', { name: 'Delete Last Play?' })).not.toBeVisible();
      await expect(page.locator('tbody tr')).toHaveCount(1);
    });

    test('escape closes dialog without deleting', async ({ page }) => {
      await setupGame(page);
      await playRound(page, BIDS, RESULTS);
      await page.getByRole('button', { name: /Delete play 1/ }).click();
      await expect(page.getByRole('heading', { name: 'Delete Last Play?' })).toBeVisible();

      await page.keyboard.press('Escape');

      await expect(page.getByRole('heading', { name: 'Delete Last Play?' })).not.toBeVisible();
      await expect(page.locator('tbody tr')).toHaveCount(1);
    });

    test('close button dismisses dialog', async ({ page }) => {
      await setupGame(page);
      await playRound(page, BIDS, RESULTS);
      await page.getByRole('button', { name: /Delete play 1/ }).click();

      await page.getByRole('button', { name: 'Close' }).click();

      await expect(page.getByRole('heading', { name: 'Delete Last Play?' })).not.toBeVisible();
      await expect(page.locator('tbody tr')).toHaveCount(1);
    });
  });

  test.describe('Deletion behavior', () => {
    test('confirming delete removes the round from scoreboard', async ({ page }) => {
      await setupGame(page);
      await playRound(page, BIDS, RESULTS);
      await expect(page.locator('tbody tr')).toHaveCount(1);

      await page.getByRole('button', { name: /Delete play 1/ }).click();
      await page.getByRole('button', { name: 'Yes, Delete' }).click();

      // Round removed, back to empty state
      await expect(page.locator('tbody tr')).toHaveCount(0);
      await expect(page.getByText('No plays yet. Start the first play!')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Start First Play' })).toBeVisible();
    });

    test('deleting last of multiple rounds preserves earlier rounds', async ({ page }) => {
      await setupGame(page);
      await playRound(page, BIDS, RESULTS);
      await playRound(page, [4, 4, 6], [4, 4, 8]);
      await expect(page.locator('tbody tr')).toHaveCount(2);

      await page.getByRole('button', { name: /Delete play 2/ }).click();
      await page.getByRole('button', { name: 'Yes, Delete' }).click();

      // Only round 1 remains
      await expect(page.locator('tbody tr')).toHaveCount(1);
      await expect(page.getByRole('button', { name: /Next Play/ })).toBeVisible();
    });

    test('scores reset correctly after deletion', async ({ page }) => {
      await setupGame(page);
      // Play 2 rounds so after deleting the last, round 1 scores remain
      await playRound(page, BIDS, RESULTS); // Alice: 50 (bid 5, got 5)
      await playRound(page, [4, 4, 6], [4, 4, 8]); // Alice: 50+40=90

      const aliceHeader = page.locator('thead th', { hasText: 'Alice' });
      await expect(aliceHeader).toContainText('90');

      // Delete round 2 — scores should revert to round 1 values
      await page.getByRole('button', { name: /Delete play 2/ }).click();
      await page.getByRole('button', { name: 'Yes, Delete' }).click();

      await expect(aliceHeader).toContainText('50');
    });

    test('can replay a round after deleting it', async ({ page }) => {
      await setupGame(page);
      await playRound(page, BIDS, RESULTS);

      // Delete round 1
      await page.getByRole('button', { name: /Delete play 1/ }).click();
      await page.getByRole('button', { name: 'Yes, Delete' }).click();
      await expect(page.locator('tbody tr')).toHaveCount(0);

      // Replay round 1 with different results — Alice bids 5, gets 5 → 50
      await playRound(page, BIDS, [5, 2, 10]);
      await expect(page.locator('tbody tr')).toHaveCount(1);
      const aliceHeader = page.locator('thead th', { hasText: 'Alice' });
      await expect(aliceHeader).toContainText('50');
    });

    test('consecutive deletes remove rounds one by one', async ({ page }) => {
      await setupGame(page);
      await playRound(page, BIDS, RESULTS);
      await playRound(page, [4, 4, 6], [4, 4, 8]);
      await playRound(page, [3, 3, 7], [3, 3, 9]);
      await expect(page.locator('tbody tr')).toHaveCount(3);

      // Delete round 3
      await page.getByRole('button', { name: /Delete play 3/ }).click();
      await page.getByRole('button', { name: 'Yes, Delete' }).click();
      await expect(page.locator('tbody tr')).toHaveCount(2);

      // Delete round 2
      await page.getByRole('button', { name: /Delete play 2/ }).click();
      await page.getByRole('button', { name: 'Yes, Delete' }).click();
      await expect(page.locator('tbody tr')).toHaveCount(1);

      // Delete round 1
      await page.getByRole('button', { name: /Delete play 1/ }).click();
      await page.getByRole('button', { name: 'Yes, Delete' }).click();
      await expect(page.locator('tbody tr')).toHaveCount(0);
    });
  });

  test.describe('Keyboard shortcut (Shift+D)', () => {
    test('Shift+D opens delete dialog when completed rounds exist', async ({ page }) => {
      await setupGame(page);
      await playRound(page, BIDS, RESULTS);
      await blurActiveElement(page);

      await page.keyboard.press('Shift+D');

      await expect(page.getByRole('heading', { name: 'Delete Last Play?' })).toBeVisible();
    });

    test('Shift+D does nothing when no completed rounds', async ({ page }) => {
      await setupGame(page);
      await blurActiveElement(page);

      await page.keyboard.press('Shift+D');

      await expect(page.getByRole('heading', { name: 'Delete Last Play?' })).not.toBeVisible();
    });

    test('Shift+D does nothing when round is in progress with no completed rounds', async ({ page }) => {
      await setupGame(page);
      await placeBids(page, BIDS);
      await blurActiveElement(page);

      await page.keyboard.press('Shift+D');

      await expect(page.getByRole('heading', { name: 'Delete Last Play?' })).not.toBeVisible();
    });

    test('full delete flow via keyboard shortcut', async ({ page }) => {
      await setupGame(page);
      await playRound(page, BIDS, RESULTS);
      await expect(page.locator('tbody tr')).toHaveCount(1);
      await blurActiveElement(page);

      await page.keyboard.press('Shift+D');
      await expect(page.getByRole('heading', { name: 'Delete Last Play?' })).toBeVisible();
      await page.getByRole('button', { name: 'Yes, Delete' }).click();

      await expect(page.locator('tbody tr')).toHaveCount(0);
    });
  });
});
