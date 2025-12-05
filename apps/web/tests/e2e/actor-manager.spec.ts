import { test, expect } from '@playwright/test';

// Helper function to login
async function login(page: any, email: string, password: string) {
  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/', { timeout: 10000 });
}

test.describe('Actor Manager', () => {
  const gameId = '9ef6bb45-ece6-4e65-99d3-4453e9f17cf4';

  test.beforeEach(async ({ page }) => {
    // Login first
    await login(page, 'testgm@test.com', 'TestPassword123!');

    // Navigate to the test game
    await page.goto(`/game/${gameId}`);
    await page.waitForSelector('.game-container', { timeout: 10000 });
  });

  test('should create, edit, and delete an actor', async ({ page }) => {
    // Click on the Actors tab
    await page.click('button:has-text("Actors")');
    await page.waitForTimeout(1000);

    // Clean up any existing TestActor entries first
    let cleanupAttempts = 0;
    while (cleanupAttempts < 5) {
      const testActors = page.locator('div:has-text("TestActor"):has-text("character")');
      const count = await testActors.count();
      if (count === 0) break;

      // Delete the first one - click trash button
      const firstActor = testActors.first();
      await firstActor.locator('button:has-text("🗑")').first().click();
      await page.waitForTimeout(500);

      // Click the checkmark to confirm (inline confirmation)
      const checkmarkBtn = firstActor.locator('button:has-text("✓")').first();
      if (await checkmarkBtn.isVisible().catch(() => false)) {
        await checkmarkBtn.click();
        await page.waitForTimeout(1000);
      }

      cleanupAttempts++;
    }

    // Click Create New Actor button
    await page.click('button:has-text("Create New Actor")');
    await page.waitForTimeout(500);

    // Fill in actor details in modal
    await page.fill('input[placeholder="Enter actor name"]', 'TestActor');
    await page.selectOption('select', 'character');

    // Submit
    await page.click('button:has-text("Create Actor")');
    await page.waitForTimeout(2000);

    // Verify actor appears in list
    await expect(page.locator('text=TestActor').first()).toBeVisible({ timeout: 5000 });

    // Click edit button on the actor (pencil icon)
    const actorItem = page.locator('div:has-text("TestActor"):has-text("character")').first();
    await actorItem.locator('button:has-text("✎")').first().click();
    await page.waitForTimeout(2000);

    // Check if actor sheet loaded (no error message)
    const errorVisible = await page.locator('text=Failed to load actor').isVisible().catch(() => false);

    if (errorVisible) {
      console.error('ERROR: Failed to load actor - ActorSheet API call failed');
      await page.screenshot({ path: 'actor-load-error.png' });
      throw new Error('Failed to load actor');
    }

    // Actor sheet should be visible
    await expect(page.locator('text=Character Sheet')).toBeVisible({ timeout: 5000 });

    // Close the actor sheet
    await page.locator('.close-btn').click();
    await page.waitForTimeout(500);

    // Delete the actor - click delete button (trash icon)
    const actorItemForDelete = page.locator('div:has-text("TestActor"):has-text("character")').first();
    await actorItemForDelete.locator('button:has-text("🗑")').first().click();
    await page.waitForTimeout(500);

    // Confirm deletion (inline confirmation with checkmark)
    await actorItemForDelete.locator('button:has-text("✓")').first().click();
    await page.waitForTimeout(2000);

    // Verify actor is removed
    await expect(page.locator('div:has-text("TestActor"):has-text("character")')).not.toBeVisible({ timeout: 5000 });

    console.log('SUCCESS: Actor created, edited, and deleted successfully');
  });
});
