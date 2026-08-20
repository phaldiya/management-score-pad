import { expect, test } from '@playwright/test';

test.describe('Share App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('share tab shows app QR code and link', async ({ page }) => {
    await page.getByRole('button', { name: 'Game rules' }).click();
    await page.getByRole('tab', { name: 'Share' }).click();

    await expect(page.getByRole('img', { name: 'QR code to open Management Score Pad' })).toBeVisible();
    await expect(page.getByText(/localhost:4173\/management-score-pad\//)).toBeVisible();
  });

  test('copy link button confirms copy', async ({ page }) => {
    await page.getByRole('button', { name: 'Game rules' }).click();
    await page.getByRole('tab', { name: 'Share' }).click();

    await page.getByRole('button', { name: 'Copy Link' }).click();
    await expect(page.getByRole('button', { name: 'Copied!' })).toBeVisible();
  });
});
