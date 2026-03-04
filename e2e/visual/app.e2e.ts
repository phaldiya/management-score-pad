import { expect, test, type Page } from '@playwright/test';

/** Set up a game with the given players and navigate to the game page. */
async function setupGame(page: Page, players: string[]) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  for (let i = 0; i < players.length; i++) {
    if (i >= 3) {
      await page.getByRole('button', { name: 'Add Player' }).click();
    }
    await page.getByPlaceholder(`Player ${i + 1}`).fill(players[i]);
  }
  await page.getByRole('button', { name: /Start Game/ }).click();
  await expect(page).toHaveURL(/#\/game/);
}

/** Play through all rounds to reach the "Game Complete!" state. */
async function playFullGame(page: Page, players: string[]) {
  await setupGame(page, players);

  const maxCards = Math.floor(52 / players.length);
  const cardSequence: number[] = [];
  for (let c = maxCards; c >= 1; c--) cardSequence.push(c);
  for (let c = 2; c <= maxCards; c++) cardSequence.push(c);

  for (let round = 0; round < cardSequence.length; round++) {
    const cardCount = cardSequence[round];

    // Bids: all zeros when cardCount=1, otherwise first player bids 1
    const bids = new Array(players.length).fill(0);
    if (cardCount > 1) bids[0] = 1;

    // Results: first player gets all cards, rest get 0
    const results = new Array(players.length).fill(0);
    results[0] = cardCount;

    // Open bid popup and submit
    const actionButton = page.locator('button', { hasText: /Start First Play|Next Play/ });
    await actionButton.click();
    await expect(page.getByText('Place Bids')).toBeVisible();
    for (let i = 0; i < bids.length; i++) {
      const row = page.locator('div.flex.items-center.gap-2', { hasText: players[i] });
      await row.locator('input[type="number"]').fill(String(bids[i]));
    }
    await page.getByRole('button', { name: 'Play!' }).click();

    // Open results popup and submit
    await page.getByRole('button', { name: 'Enter Results' }).click();
    await expect(page.getByRole('heading', { name: /Enter Results/ })).toBeVisible();
    const resultInputs = page.locator('input[type="number"]');
    for (let i = 0; i < results.length; i++) {
      await resultInputs.nth(i).fill(String(results[i]));
    }
    await page.getByRole('button', { name: 'Submit Results' }).click();
  }

  await expect(page.getByRole('button', { name: 'Game Complete!' })).toBeVisible();
}

test.describe('Avatar Picker', () => {
  test('avatar picker open on setup page', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByPlaceholder('Player 1').fill('Alice');
    await page.getByPlaceholder('Player 2').fill('Bob');
    await page.getByPlaceholder('Player 3').fill('Charlie');
    await page.getByRole('button', { name: 'Change avatar for Alice' }).click();
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('avatar-picker-open.png');
  });
});

test.describe('Visual Regression', () => {
  test('setup page default state', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('setup-default.png');
  });

  test('setup page with players filled', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByPlaceholder('Player 1').fill('Alice');
    await page.getByPlaceholder('Player 2').fill('Bob');
    await page.getByPlaceholder('Player 3').fill('Charlie');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('setup-players-filled.png');
  });

  test('setup page with duplicate error', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByPlaceholder('Player 1').fill('Alice');
    await page.getByPlaceholder('Player 2').fill('alice');
    await page.getByPlaceholder('Player 3').fill('Bob');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('setup-duplicate-error.png');
  });

  test('game page empty scoreboard', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByPlaceholder('Player 1').fill('Alice');
    await page.getByPlaceholder('Player 2').fill('Bob');
    await page.getByPlaceholder('Player 3').fill('Charlie');
    await page.getByRole('button', { name: /Start Game/ }).click();
    await expect(page).toHaveURL(/#\/game/);
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('game-empty-scoreboard.png');
  });

  test('game page after one completed round', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByPlaceholder('Player 1').fill('Alice');
    await page.getByPlaceholder('Player 2').fill('Bob');
    await page.getByPlaceholder('Player 3').fill('Charlie');
    await page.getByRole('button', { name: /Start Game/ }).click();

    // Place bids: 5+5+5=15 (valid for 17 cards)
    await page.getByRole('button', { name: 'Start First Play' }).click();
    for (const name of ['Alice', 'Bob', 'Charlie']) {
      const row = page.locator('div.flex.items-center.gap-2', { hasText: name });
      await row.locator('input[type="number"]').fill('5');
    }
    await page.getByRole('button', { name: 'Play!' }).click();

    // Enter results: 10+5+2=17
    await page.getByRole('button', { name: 'Enter Results' }).click();
    const resultInputs = page.locator('input[type="number"]');
    await resultInputs.nth(0).fill('10');
    await resultInputs.nth(1).fill('5');
    await resultInputs.nth(2).fill('2');
    await page.getByRole('button', { name: 'Submit Results' }).click();

    await expect(page.getByRole('button', { name: /Next Play/ })).toBeVisible();
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('game-one-round-completed.png');
  });
});

test.describe('Winner Screen', () => {
  test('scoreboard with Game Complete button (3 players)', async ({ page }) => {
    await playFullGame(page, ['Alice', 'Bob', 'Charlie']);
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('winner-scoreboard-complete.png');
  });

  test('winner popup with 3 players', async ({ page }) => {
    await playFullGame(page, ['Alice', 'Bob', 'Charlie']);
    await page.getByRole('button', { name: 'Game Complete!' }).click();
    await page.waitForTimeout(500);
    await page.evaluate(() =>
      document.querySelectorAll('.confetti-piece').forEach(el => el.remove()),
    );
    await expect(page).toHaveScreenshot('winner-popup-3-players.png');
  });

  test('winner popup with 7 players', async ({ page }) => {
    await playFullGame(page, ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7']);
    await page.getByRole('button', { name: 'Game Complete!' }).click();
    await page.waitForTimeout(500);
    await page.evaluate(() =>
      document.querySelectorAll('.confetti-piece').forEach(el => el.remove()),
    );
    await expect(page).toHaveScreenshot('winner-popup-7-players.png');
  });
});
