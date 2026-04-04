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
  // Click the action button (Start First Play / Next Play)
  const actionButton = page.locator('button', { hasText: /Start First Play|Next Play/ });
  await actionButton.click();

  // Wait for popup
  await expect(page.getByText('Place Bids')).toBeVisible();

  // Fill each player's bid by finding the input next to their name
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

test.describe('Game Play Flow', () => {
  test('shows empty scoreboard message after setup', async ({ page }) => {
    await setupGame(page);
    await expect(page.getByText('No plays yet. Start the first play!')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start First Play' })).toBeVisible();
  });

  test('can reorder players with arrow keys before first play', async ({ page }) => {
    await setupGame(page);

    // Focus Alice's column header and press ArrowRight to swap with Bob
    const aliceHeader = page.locator('th', { hasText: 'Alice' });
    await aliceHeader.focus();
    await page.keyboard.press('ArrowRight');

    // Now Bob should be first, Alice second
    const headers = page.locator('thead th');
    await expect(headers.nth(1)).toContainText('Bob');
    await expect(headers.nth(2)).toContainText('Alice');

    // Press ArrowRight again to move Alice to third position
    await page.keyboard.press('ArrowRight');
    await expect(headers.nth(3)).toContainText('Alice');

    // Press ArrowLeft to move Alice back to second
    await page.keyboard.press('ArrowLeft');
    await expect(headers.nth(2)).toContainText('Alice');
  });

  test('arrow key reorder disabled after first play starts', async ({ page }) => {
    await setupGame(page);
    await placeBids(page, [5, 5, 5]);

    // Grip handles should not be visible
    await expect(page.getByLabel(/Drag to reorder/)).toHaveCount(0);

    // Headers should not be focusable (no tabIndex)
    const aliceHeader = page.locator('thead th', { hasText: 'Alice' });
    await expect(aliceHeader).not.toHaveAttribute('tabindex');
  });

  test('opens bid popup and places valid bids', async ({ page }) => {
    await setupGame(page);

    await page.getByRole('button', { name: 'Start First Play' }).click();
    await expect(page.getByText('Place Bids')).toBeVisible();

    // Fill valid bids (total ≠ card count of 17): 5 + 5 + 5 = 15
    for (const name of ['Alice', 'Bob', 'Charlie']) {
      const row = page.locator('div.flex.items-center.gap-2', { hasText: name });
      await row.locator('input[type="number"]').fill('5');
    }

    await page.getByRole('button', { name: 'Play!' }).click();

    // Popup should close, Enter Results button should appear
    await expect(page.getByText('Place Bids')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Enter Results' })).toBeVisible();
  });

  test('bid validation: rejects total equal to card count', async ({ page }) => {
    await setupGame(page);

    await page.getByRole('button', { name: 'Start First Play' }).click();
    await expect(page.getByText('Place Bids')).toBeVisible();

    // 3 players, card count = 17. Set bids to total 17: 10 + 5 + 2 = 17
    const players = ['Alice', 'Bob', 'Charlie'];
    const invalidBids = [10, 5, 2];
    for (let i = 0; i < players.length; i++) {
      const row = page.locator('div.flex.items-center.gap-2', { hasText: players[i] });
      await row.locator('input[type="number"]').fill(String(invalidBids[i]));
    }

    // Should show the warning
    await expect(page.getByText('cannot equal card count')).toBeVisible();

    await page.getByRole('button', { name: 'Play!' }).click();

    // Popup should still be open with error
    await expect(page.getByText('Total bids cannot equal 17')).toBeVisible();
  });

  test('enters results and completes a round', async ({ page }) => {
    await setupGame(page);
    // Bids: 5+5+5=15 (valid for 17 cards)
    await placeBids(page, [5, 5, 5]);

    await page.getByRole('button', { name: 'Enter Results' }).click();
    await expect(page.getByText('Results (hands won)')).toBeVisible();

    // Results must total 17: 10 + 5 + 2 = 17
    const resultInputs = page.locator('input[type="number"]');
    await resultInputs.nth(0).fill('10');
    await resultInputs.nth(1).fill('5');
    await resultInputs.nth(2).fill('2');

    await page.getByRole('button', { name: 'Submit Results' }).click();

    // Popup should close, Next Play button should appear
    await expect(page.getByRole('heading', { name: /Enter Results/ })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Next Play/ })).toBeVisible();
  });

  test('result validation: rejects total not equal to card count', async ({ page }) => {
    await setupGame(page);
    await placeBids(page, [5, 5, 5]);

    await page.getByRole('button', { name: 'Enter Results' }).click();
    await expect(page.getByRole('heading', { name: /Enter Results/ })).toBeVisible();

    // Results total 10 ≠ 17
    const resultInputs = page.locator('input[type="number"]');
    await resultInputs.nth(0).fill('5');
    await resultInputs.nth(1).fill('3');
    await resultInputs.nth(2).fill('2');

    // Inline indicator should warn that total doesn't match
    await expect(page.getByText('must equal card count!')).toBeVisible();
    // Total display should show 10 / 17
    await expect(page.getByText('Total: 10 / 17')).toBeVisible();

    // Attempting to submit should be blocked by validation
    await page.getByRole('button', { name: 'Submit Results' }).click();
    await expect(page.getByRole('heading', { name: /Enter Results/ })).toBeVisible();
  });

  test('score correct: bid=2 result=2 → 20', async ({ page }) => {
    await setupGame(page);
    // Bids: 2+0+13 = 15 (valid for 17 cards)
    await placeBids(page, [2, 0, 13]);
    // Results: 2+0+15 = 17
    await enterResults(page, [2, 0, 15]);

    // Alice bid=2, result=2 → score=20
    // Check the scoreboard shows 20 for Alice
    const scoreboardRow = page.locator('tbody tr').first();
    await expect(scoreboardRow).toContainText('20');
  });

  test('score correct: bid=0 result=0 → 10', async ({ page }) => {
    await setupGame(page);
    // Bids: 2+0+13 = 15 (valid for 17 cards)
    await placeBids(page, [2, 0, 13]);
    // Results: 2+0+15 = 17 (Bob bid=0, result=0 → score=10)
    await enterResults(page, [2, 0, 15]);

    const scoreboardRow = page.locator('tbody tr').first();
    await expect(scoreboardRow).toContainText('10');
  });

  test('score correct: bid=2 result=1 → 0', async ({ page }) => {
    await setupGame(page);
    // Bids: 2+0+13 = 15 (valid for 17 cards)
    await placeBids(page, [2, 0, 13]);
    // Results: 1+1+15 = 17 (Alice bid=2, result=1 → score=0; Bob bid=0, result=1 → score=0)
    await enterResults(page, [1, 1, 15]);

    // The row should contain 0 scores
    const scoreboardRow = page.locator('tbody tr').first();
    // Alice: bid=2, result=1 → 0
    const cells = scoreboardRow.locator('td');
    // First cell is the play card, subsequent cells are player scores
    await expect(cells.nth(1)).toContainText('0');
  });

  test('crown shows next to leader after round', async ({ page }) => {
    await setupGame(page);
    // Bids: 2+0+13 = 15 (valid for 17 cards)
    await placeBids(page, [2, 0, 13]);
    // Results: 2+0+15 = 17 → Alice=20, Bob=10, Charlie=0
    await enterResults(page, [2, 0, 15]);

    // Crown (👑 U+1F451) should appear in the header next to Alice (leader with 20)
    const aliceHeader = page.locator('thead th').nth(1);
    await expect(aliceHeader).toContainText('Alice');
    await expect(aliceHeader).toContainText('20');
    // Check crown is present in the header area
    await expect(page.locator('thead').getByText('👑')).toBeVisible();
  });

  test('bid popup: focus stays on current input after typing (no jump to first)', async ({ page }) => {
    await setupGame(page);
    await page.getByRole('button', { name: 'Start First Play' }).click();
    await expect(page.getByText('Place Bids')).toBeVisible();

    const inputs = page.locator('input[type="number"]');

    // Type into the third player's input
    await inputs.nth(2).click();
    await inputs.nth(2).fill('3');

    // The third input should still be focused, not the first
    await expect(inputs.nth(2)).toBeFocused();
  });

  test('results popup: focus stays on current input after typing (no jump to first)', async ({ page }) => {
    await setupGame(page);
    await placeBids(page, [5, 5, 5]);

    await page.getByRole('button', { name: 'Enter Results' }).click();
    await expect(page.getByRole('heading', { name: /Enter Results/ })).toBeVisible();

    const inputs = page.locator('input[type="number"]');

    // Type into the third player's input
    await inputs.nth(2).click();
    await inputs.nth(2).fill('5');

    // The third input should still be focused, not the first
    await expect(inputs.nth(2)).toBeFocused();
  });

  test('edit bids from details popup', async ({ page }) => {
    await setupGame(page);
    // Place bids: 5+5+5=15 (valid for 17 cards)
    await placeBids(page, [5, 5, 5]);

    // Open details popup (current round is in_progress)
    await page.keyboard.press('p');
    await expect(page.getByRole('heading', { name: /Details/ })).toBeVisible();

    // Click pencil/edit icon
    await page.getByRole('button', { name: 'Edit bids' }).click();

    // Title should change to "Edit Bids"
    await expect(page.getByRole('heading', { name: /Edit Bids/ })).toBeVisible();

    // Should see bid inputs pre-filled with current bids
    const inputs = page.locator('input[type="number"]');
    await expect(inputs).toHaveCount(3);

    // Change bids: 3+4+8=15 (valid, ≠ 17)
    for (let i = 0; i < 3; i++) {
      await inputs.nth(i).fill(['3', '4', '8'][i]);
    }

    // Submit
    await page.getByRole('button', { name: 'Update Bids' }).click();

    // Popup should close
    await expect(page.getByRole('heading', { name: /Details/ })).not.toBeVisible();

    // Re-open details to verify bids were updated
    await page.keyboard.press('p');
    await expect(page.getByRole('heading', { name: /Details/ })).toBeVisible();

    // Bid labels should show the updated values
    const bidLabels = page.locator('span.bg-blue-50');
    await expect(bidLabels.nth(0)).toContainText('3');
    await expect(bidLabels.nth(1)).toContainText('4');
    await expect(bidLabels.nth(2)).toContainText('8');
  });

  test('edit bids validation rejects total equal to card count', async ({ page }) => {
    await setupGame(page);
    await placeBids(page, [5, 5, 5]);

    // Open details popup
    await page.keyboard.press('p');
    await expect(page.getByRole('heading', { name: /Details/ })).toBeVisible();

    // Click edit
    await page.getByRole('button', { name: 'Edit bids' }).click();

    // Set bids that total 17 (= card count): 10+5+2=17
    const inputs = page.locator('input[type="number"]');
    await inputs.nth(0).fill('10');
    await inputs.nth(1).fill('5');
    await inputs.nth(2).fill('2');

    // Should show warning
    await expect(page.getByText('cannot equal card count')).toBeVisible();

    // Attempt submit
    await page.getByRole('button', { name: 'Update Bids' }).click();

    // Should show validation error and popup stays open
    await expect(page.getByText('Total bids cannot equal 17')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Edit Bids/ })).toBeVisible();
  });

  test('plays through entire game to completion popup', async ({ page }) => {
    // Use 6 players to get a shorter game (floor(52/6)=8, total games=15)
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    const players = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];
    for (let i = 0; i < players.length; i++) {
      if (i >= 3) {
        await page.getByRole('button', { name: 'Add Player' }).click();
      }
      await page.getByPlaceholder(`Player ${i + 1}`).fill(players[i]);
    }
    await page.getByRole('button', { name: /Start Game/ }).click();

    // 6 players → maxCards=8, sequence = [8,7,6,5,4,3,2,1,2,3,4,5,6,7,8], 15 games total
    const cardSequence = [8, 7, 6, 5, 4, 3, 2, 1, 2, 3, 4, 5, 6, 7, 8];

    for (let round = 0; round < cardSequence.length; round++) {
      const cardCount = cardSequence[round];

      // Create valid bids: all zeros except first player gets 1 (total=1 ≠ cardCount, unless cardCount=1)
      const bids = new Array(6).fill(0);
      if (cardCount === 1) {
        // For card count 1, total bids can't equal 1, so all zeros works (total=0 ≠ 1)
        // Keep all zeros
      } else {
        bids[0] = 1; // total=1 ≠ cardCount (since cardCount > 1)
      }

      // Create valid results: all zeros except first player gets all cards
      const results = new Array(6).fill(0);
      results[0] = cardCount;

      await playRound(page, bids, results, players);
    }

    // After all 15 rounds, the button should say "Game Complete!"
    await page.getByRole('button', { name: 'Game Complete!' }).click();

    // Game complete popup should appear
    await expect(page.getByText('Final Standings')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start New Game' })).toBeVisible();
  });
});
