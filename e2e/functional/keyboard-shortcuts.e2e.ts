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

/** Place bids via button click (not keyboard). */
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

/** Enter results via button click (not keyboard), finding inputs by player name. */
async function enterResults(page: Page, results: number[], players = ['Alice', 'Bob', 'Charlie']) {
  await page.getByRole('button', { name: 'Enter Results' }).click();
  await expect(page.getByRole('heading', { name: /Enter Results/ })).toBeVisible();
  for (let i = 0; i < results.length && i < players.length; i++) {
    const row = page.locator('div.flex.items-center.gap-2', { hasText: players[i] });
    await row.locator('input[type="number"]').fill(String(results[i]));
  }
  await page.getByRole('button', { name: 'Submit Results' }).click();
}

/** Blur any focused input so keyboard shortcuts reach the document. */
async function blurActiveElement(page: Page) {
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
}

test.describe('Keyboard Shortcuts', () => {
  test.describe('N key — Next Action', () => {
    test('opens bid popup before first play', async ({ page }) => {
      await setupGame(page);
      await blurActiveElement(page);

      await page.keyboard.press('n');

      await expect(page.getByText('Place Bids')).toBeVisible();
    });

    test('opens results popup when round is in progress', async ({ page }) => {
      await setupGame(page);
      await placeBids(page, [5, 5, 5]);
      await blurActiveElement(page);

      await page.keyboard.press('n');

      await expect(page.getByRole('heading', { name: /Enter Results/ })).toBeVisible();
    });

    test('opens bid popup for next play after completing a round', async ({ page }) => {
      await setupGame(page);
      await placeBids(page, [5, 5, 5]);
      await enterResults(page, [10, 5, 2]);
      await blurActiveElement(page);

      await page.keyboard.press('n');

      await expect(page.getByText('Place Bids')).toBeVisible();
    });

    test('does nothing when a popup is already open', async ({ page }) => {
      await setupGame(page);
      await blurActiveElement(page);

      // Open bid popup via N
      await page.keyboard.press('n');
      await expect(page.getByText('Place Bids')).toBeVisible();

      // Press N again — should not open another popup or change state
      await page.keyboard.press('n');
      await expect(page.getByText('Place Bids')).toBeVisible();
    });

    test('does not trigger when focus is in an input', async ({ page }) => {
      await setupGame(page);
      // Open bid popup via button
      await page.getByRole('button', { name: 'Start First Play' }).click();
      await expect(page.getByText('Place Bids')).toBeVisible();

      // Close it
      await page.keyboard.press('Escape');
      await expect(page.getByText('Place Bids')).not.toBeVisible();

      // Now a round is not started — we're back to "Start First Play" state
      // Focus an input that doesn't exist on game page, so let's use a different approach:
      // Re-open popup, focus the number input, close popup, ensure we're clean
      // Actually: just verify N doesn't fire when inside the bid popup's input
      await page.getByRole('button', { name: 'Start First Play' }).click();
      await expect(page.getByText('Place Bids')).toBeVisible();

      // Focus is on an input inside the popup — type 'n' as text
      const input = page.locator('input[type="number"]').first();
      await input.focus();
      await input.press('n');

      // The popup should still be open (N key was consumed by the input, not the handler)
      await expect(page.getByText('Place Bids')).toBeVisible();
    });
  });

  test.describe('P key — Play Details', () => {
    test('opens details popup when round is in progress', async ({ page }) => {
      await setupGame(page);
      await placeBids(page, [5, 5, 5]);
      await blurActiveElement(page);

      await page.keyboard.press('p');

      await expect(page.getByRole('heading', { name: /Details/ })).toBeVisible();
    });

    test('does nothing when no round is in progress', async ({ page }) => {
      await setupGame(page);
      await blurActiveElement(page);

      await page.keyboard.press('p');

      // No popup should appear — verify the page still shows the start button
      await expect(page.getByRole('button', { name: 'Start First Play' })).toBeVisible();
      // And no Details heading visible
      await expect(page.getByRole('heading', { name: /Details/ })).not.toBeVisible();
    });

    test('does nothing after round is completed', async ({ page }) => {
      await setupGame(page);
      await placeBids(page, [5, 5, 5]);
      await enterResults(page, [10, 5, 2]);
      await blurActiveElement(page);

      await page.keyboard.press('p');

      // No details popup — should still show Next Play
      await expect(page.getByRole('heading', { name: /Details/ })).not.toBeVisible();
      await expect(page.getByRole('button', { name: /Next Play/ })).toBeVisible();
    });
  });

  test.describe('Escape key — Close Popup', () => {
    test('closes bid popup', async ({ page }) => {
      await setupGame(page);
      await page.getByRole('button', { name: 'Start First Play' }).click();
      await expect(page.getByText('Place Bids')).toBeVisible();

      await page.keyboard.press('Escape');

      await expect(page.getByText('Place Bids')).not.toBeVisible();
    });

    test('closes results popup', async ({ page }) => {
      await setupGame(page);
      await placeBids(page, [5, 5, 5]);
      await page.getByRole('button', { name: 'Enter Results' }).click();
      await expect(page.getByRole('heading', { name: /Enter Results/ })).toBeVisible();

      await page.keyboard.press('Escape');

      await expect(page.getByRole('heading', { name: /Enter Results/ })).not.toBeVisible();
    });

    test('closes details popup', async ({ page }) => {
      await setupGame(page);
      await placeBids(page, [5, 5, 5]);
      await blurActiveElement(page);
      await page.keyboard.press('p');
      await expect(page.getByRole('heading', { name: /Details/ })).toBeVisible();

      await page.keyboard.press('Escape');

      await expect(page.getByRole('heading', { name: /Details/ })).not.toBeVisible();
    });

    test('closes keyboard shortcuts popup', async ({ page }) => {
      await setupGame(page);
      await blurActiveElement(page);
      await page.keyboard.press('?');
      await expect(page.getByRole('heading', { name: 'Keyboard Shortcuts' })).toBeVisible();

      await page.keyboard.press('Escape');

      await expect(page.getByRole('heading', { name: 'Keyboard Shortcuts' })).not.toBeVisible();
    });

    test('closes new game confirmation popup', async ({ page }) => {
      await setupGame(page);
      await placeBids(page, [5, 5, 5]);
      await page.getByRole('button', { name: 'New game' }).click();
      await expect(page.getByText('Abandon Game?')).toBeVisible();

      await page.keyboard.press('Escape');

      await expect(page.getByText('Abandon Game?')).not.toBeVisible();
    });
  });

  test.describe('? key — Keyboard Shortcuts Help', () => {
    test('opens shortcuts popup', async ({ page }) => {
      await setupGame(page);
      await blurActiveElement(page);

      await page.keyboard.press('?');

      await expect(page.getByRole('heading', { name: 'Keyboard Shortcuts' })).toBeVisible();
      await expect(page.getByText('Next Action', { exact: true })).toBeVisible();
      await expect(page.getByText('Play Details', { exact: true })).toBeVisible();
    });

    test('does not open when focus is in an input', async ({ page }) => {
      await setupGame(page);
      // Open bid popup to get an input
      await page.getByRole('button', { name: 'Start First Play' }).click();
      const input = page.locator('input[type="number"]').first();
      await input.focus();

      await page.keyboard.press('?');

      // Shortcuts popup should NOT open
      await expect(page.getByText('Keyboard Shortcuts')).not.toBeVisible();
    });
  });

  test.describe('Shift+N — New Game', () => {
    test('opens new game confirmation when game in progress', async ({ page }) => {
      await setupGame(page);
      await placeBids(page, [5, 5, 5]);
      await blurActiveElement(page);

      await page.keyboard.down('Shift');
      await page.keyboard.press('N');
      await page.keyboard.up('Shift');

      await expect(page.getByText('Abandon Game?')).toBeVisible();
    });

    test('resets directly when no rounds played', async ({ page }) => {
      await setupGame(page);
      await blurActiveElement(page);

      await page.keyboard.down('Shift');
      await page.keyboard.press('N');
      await page.keyboard.up('Shift');

      // No rounds in progress, so should reset directly to setup
      await expect(page).toHaveURL(/#?\/?$/);
      await expect(page.getByPlaceholder('Player 1')).toBeVisible();
    });
  });

  test.describe('Combined flows', () => {
    test('N opens bid → Escape closes → N reopens', async ({ page }) => {
      await setupGame(page);
      await blurActiveElement(page);

      await page.keyboard.press('n');
      await expect(page.getByText('Place Bids')).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(page.getByText('Place Bids')).not.toBeVisible();

      await page.keyboard.press('n');
      await expect(page.getByText('Place Bids')).toBeVisible();
    });

    test('full round via keyboard: N to bid, submit, N to results, submit', async ({ page }) => {
      await setupGame(page);
      await blurActiveElement(page);

      // N to open bid popup
      await page.keyboard.press('n');
      await expect(page.getByText('Place Bids')).toBeVisible();

      // Fill bids and submit
      for (const name of ['Alice', 'Bob', 'Charlie']) {
        const row = page.locator('div.flex.items-center.gap-2', { hasText: name });
        await row.locator('input[type="number"]').fill('5');
      }
      await page.getByRole('button', { name: 'Play!' }).click();
      await expect(page.getByText('Place Bids')).not.toBeVisible();

      // N to open results popup
      await blurActiveElement(page);
      await page.keyboard.press('n');
      await expect(page.getByRole('heading', { name: /Enter Results/ })).toBeVisible();

      // Fill results by player name and submit
      for (const [name, result] of [['Alice', '10'], ['Bob', '5'], ['Charlie', '2']] as const) {
        const row = page.locator('div.flex.items-center.gap-2', { hasText: name });
        await row.locator('input[type="number"]').fill(result);
      }
      await page.getByRole('button', { name: 'Submit Results' }).click();

      // Round complete — Next Play button visible
      await expect(page.getByRole('button', { name: /Next Play/ })).toBeVisible();
    });

    test('P opens details during round, Escape closes, N opens results', async ({ page }) => {
      await setupGame(page);
      await placeBids(page, [5, 5, 5]);
      await blurActiveElement(page);

      // P opens details
      await page.keyboard.press('p');
      await expect(page.getByRole('heading', { name: /Details/ })).toBeVisible();

      // Escape closes
      await page.keyboard.press('Escape');
      await expect(page.getByRole('heading', { name: /Details/ })).not.toBeVisible();

      // N opens results
      await page.keyboard.press('n');
      await expect(page.getByRole('heading', { name: /Enter Results/ })).toBeVisible();
    });
  });
});
