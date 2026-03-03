import { expect, test } from "@playwright/test";

test.describe("Avatar Picker", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("each player row shows a default avatar on setup page", async ({
    page,
  }) => {
    const avatars = page.locator(
      'img[alt="Player 1"], img[alt="Player 2"], img[alt="Player 3"]',
    );
    await expect(avatars).toHaveCount(3);
  });

  test("clicking avatar opens picker popover", async ({ page }) => {
    // Click the first player's avatar button
    const avatarButtons = page.locator("button:has(img.rounded-full)");
    await avatarButtons.first().click();

    // Picker should appear with category labels
    await expect(page.getByText("Bots")).toBeVisible();
    await expect(page.getByText("Croodles")).toBeVisible();
    await expect(page.getByText("Pixel Art")).toBeVisible();
    await expect(page.getByText("Lorelei")).toBeVisible();
  });

  test("selecting an avatar closes picker and updates thumbnail", async ({
    page,
  }) => {
    const avatarButtons = page.locator("button:has(img.rounded-full)");
    await avatarButtons.first().click();

    // Pick a Croodles avatar (second category, first avatar)
    const pickerAvatars = page.locator(".grid button");
    const croodlesFirst = pickerAvatars.nth(20); // 20 Bots avatars, then first Croodles
    await croodlesFirst.click();

    // Picker should close
    await expect(page.getByText("Bots")).not.toBeVisible();

    // The avatar thumbnail should have changed (src should differ from default)
    const firstAvatar = avatarButtons.first().locator("img");
    const src = await firstAvatar.getAttribute("src");
    expect(src).toContain("data:image/svg+xml");
  });

  test("clicking outside picker closes it", async ({ page }) => {
    const avatarButtons = page.locator("button:has(img.rounded-full)");
    await avatarButtons.first().click();
    await expect(page.getByText("Bots")).toBeVisible();

    // Click outside the picker
    await page.locator("body").click({ position: { x: 0, y: 0 } });

    // Picker should close
    await expect(page.getByText("Bots")).not.toBeVisible();
  });

  test("selected avatar has highlighted border", async ({ page }) => {
    const avatarButtons = page.locator("button:has(img.rounded-full)");
    await avatarButtons.first().click();

    // The default avatar should have the blue border (selected state)
    const selected = page.locator(".grid button.border-blue-500");
    await expect(selected).toHaveCount(1);
  });

  test("each player can have a different avatar", async ({ page }) => {
    const avatarButtons = page.locator("button:has(img.rounded-full)");

    // Set player 1 to a Croodles avatar
    await avatarButtons.nth(0).click();
    await page.locator(".grid button").nth(20).click(); // first Croodles

    // Set player 2 to a Pixel Art avatar
    await avatarButtons.nth(1).click();
    await page.locator(".grid button").nth(40).click(); // first Pixel Art

    // Get avatar srcs
    const src1 = await avatarButtons.nth(0).locator("img").getAttribute("src");
    const src2 = await avatarButtons.nth(1).locator("img").getAttribute("src");
    const src3 = await avatarButtons.nth(2).locator("img").getAttribute("src");

    // All three should be different (player 3 still has default)
    expect(src1).not.toEqual(src2);
    expect(src2).not.toEqual(src3);
  });

  test("chosen avatars persist into game scoreboard header", async ({
    page,
  }) => {
    // Pick a non-default avatar for player 1
    const avatarButtons = page.locator("button:has(img.rounded-full)");
    await avatarButtons.first().click();
    await page.locator(".grid button").nth(20).click(); // Croodles avatar

    // Get the avatar src before starting game
    const setupSrc = await avatarButtons
      .first()
      .locator("img")
      .getAttribute("src");

    // Fill names and start game
    await page.getByPlaceholder("Player 1").fill("Alice");
    await page.getByPlaceholder("Player 2").fill("Bob");
    await page.getByPlaceholder("Player 3").fill("Charlie");
    await page.getByRole("button", { name: /Start Game/ }).click();
    await expect(page).toHaveURL(/#\/game/);

    // Alice's avatar in the scoreboard header should match
    const headerAvatar = page.locator('thead img[alt="Alice"]');
    await expect(headerAvatar).toBeVisible();
    const gameSrc = await headerAvatar.getAttribute("src");
    expect(gameSrc).toEqual(setupSrc);
  });

  test("avatar picker works in add-player-inline during game", async ({
    page,
  }) => {
    // Start a game first
    await page.getByPlaceholder("Player 1").fill("Alice");
    await page.getByPlaceholder("Player 2").fill("Bob");
    await page.getByPlaceholder("Player 3").fill("Charlie");
    await page.getByRole("button", { name: /Start Game/ }).click();
    await expect(page).toHaveURL(/#\/game/);

    // The add player section should have an avatar button
    const addPlayerAvatar = page.locator(".mt-4 button:has(img.rounded-full)");
    await expect(addPlayerAvatar).toBeVisible();

    // Click to open picker
    await addPlayerAvatar.click();
    await expect(page.getByText("Bots")).toBeVisible();

    // Select an avatar
    await page.locator(".grid button").nth(5).click();

    // Picker should close
    await expect(page.getByText("Bots")).not.toBeVisible();
  });
});
