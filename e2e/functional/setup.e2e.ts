import { expect, test } from '@playwright/test';

test.describe('Setup Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('shows setup page with title and player inputs', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Management (Judgement)' })).toBeVisible();
    await expect(page.getByPlaceholder('Player 1')).toBeVisible();
    await expect(page.getByPlaceholder('Player 2')).toBeVisible();
    await expect(page.getByPlaceholder('Player 3')).toBeVisible();
  });

  test('starts with 3 empty player inputs', async ({ page }) => {
    const inputs = page.getByRole('textbox');
    await expect(inputs).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      await expect(inputs.nth(i)).toHaveValue('');
    }
  });

  test('cannot start with empty names (button disabled)', async ({ page }) => {
    const startButton = page.getByRole('button', { name: 'Start Game' });
    await expect(startButton).toBeDisabled();
  });

  test('can add player when all fields filled', async ({ page }) => {
    await page.getByPlaceholder('Player 1').fill('Alice');
    await page.getByPlaceholder('Player 2').fill('Bob');
    await page.getByPlaceholder('Player 3').fill('Charlie');

    const addButton = page.getByRole('button', { name: 'Add Player' });
    await expect(addButton).toBeEnabled();
    await addButton.click();

    await expect(page.getByPlaceholder('Player 4')).toBeVisible();
    await expect(page.getByRole('textbox')).toHaveCount(4);
  });

  test('cannot add player when a name is empty', async ({ page }) => {
    await page.getByPlaceholder('Player 1').fill('Alice');
    await page.getByPlaceholder('Player 2').fill('Bob');
    // Player 3 left empty

    const addButton = page.getByRole('button', { name: 'Add Player' });
    await expect(addButton).toBeDisabled();
  });

  test('can remove 4th+ player but not first 3', async ({ page }) => {
    // First 3 should not have remove buttons
    await expect(page.getByRole('button', { name: /Remove player/ })).toHaveCount(0);

    // Add a 4th player
    await page.getByPlaceholder('Player 1').fill('Alice');
    await page.getByPlaceholder('Player 2').fill('Bob');
    await page.getByPlaceholder('Player 3').fill('Charlie');
    await page.getByRole('button', { name: 'Add Player' }).click();

    // 4th player should have a remove button
    const removeButton = page.getByRole('button', { name: 'Remove player 4' });
    await expect(removeButton).toBeVisible();
    await removeButton.click();

    await expect(page.getByRole('textbox')).toHaveCount(3);
  });

  test('shows duplicate error (case-insensitive, trimmed)', async ({ page }) => {
    await page.getByPlaceholder('Player 1').fill('Alice');
    await page.getByPlaceholder('Player 2').fill('alice');
    await page.getByPlaceholder('Player 3').fill('Bob');

    await expect(page.getByText('Duplicate player name').first()).toBeVisible();
  });

  test('requires minimum 3 filled names to start', async ({ page }) => {
    const startButton = page.getByRole('button', { name: 'Start Game' });

    // Only 2 filled
    await page.getByPlaceholder('Player 1').fill('Alice');
    await page.getByPlaceholder('Player 2').fill('Bob');
    await expect(startButton).toBeDisabled();

    // Fill 3rd
    await page.getByPlaceholder('Player 3').fill('Charlie');
    await expect(startButton).toBeEnabled();
  });

  test('ignores empty fields when starting (only sends filled names)', async ({ page }) => {
    await page.getByPlaceholder('Player 1').fill('Alice');
    await page.getByPlaceholder('Player 2').fill('Bob');
    await page.getByPlaceholder('Player 3').fill('Charlie');

    // Add a 4th but leave it empty — add button will be disabled, so fill then clear
    await page.getByRole('button', { name: 'Add Player' }).click();
    // Player 4 is empty — start should still work with 3 filled

    const startButton = page.getByRole('button', { name: /Start Game/ });
    await expect(startButton).toBeEnabled();
    await startButton.click();

    await expect(page).toHaveURL(/#\/game/);
    // Verify only 3 player columns in scoreboard header (+ Play column)
    const headerCells = page.locator('thead th');
    await expect(headerCells).toHaveCount(4); // Play + Alice + Bob + Charlie
  });

  test('starts game and navigates to #/game', async ({ page }) => {
    await page.getByPlaceholder('Player 1').fill('Alice');
    await page.getByPlaceholder('Player 2').fill('Bob');
    await page.getByPlaceholder('Player 3').fill('Charlie');

    await page.getByRole('button', { name: /Start Game/ }).click();
    await expect(page).toHaveURL(/#\/game/);
    await expect(page.getByText('No plays yet')).toBeVisible();
  });
});
