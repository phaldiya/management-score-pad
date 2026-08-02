import { expect, type Locator } from '@playwright/test';

/** Set a read-only stepper input to `value` by clicking its sibling +/- buttons. */
export async function setStepperValue(input: Locator, value: number) {
  const stepper = input.locator('..');
  // Wait for the form to initialize the value before computing the click delta.
  await expect(input).toHaveValue(/\d/);
  const current = Number(await input.inputValue()) || 0;
  const delta = value - current;
  if (delta !== 0) {
    const button = delta > 0 ? stepper.locator('button').last() : stepper.locator('button').first();
    // Dispatch all clicks in one round-trip; per-click Playwright clicks are too slow for full-game tests.
    await button.evaluate((btn, clicks) => {
      for (let i = 0; i < clicks; i++) {
        (btn as HTMLButtonElement).click();
      }
    }, Math.abs(delta));
  }
  await expect(input).toHaveValue(String(value));
}
