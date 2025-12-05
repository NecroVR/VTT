import { test, expect } from '@playwright/test';

/**
 * Scene Management E2E Tests
 *
 * Tests scene creation, switching, and management functionality
 */

// Helper function to login (to be used in tests that require authentication)
async function login(page: any, email: string, password: string) {
  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  // Wait for navigation to complete
  await page.waitForURL('/', { timeout: 10000 });
}

test.describe('Scene Management', () => {
  // Note: These tests require authentication as a GM user
  // They are skipped by default until test infrastructure is in place

  test('should open scene creation modal when Create Scene button is clicked', async ({ page }) => {
    // Login with GM test account
    await login(page, 'testgm@test.com', 'TestPassword123!');

    const gameId = '9ef6bb45-ece6-4e65-99d3-4453e9f17cf4';
    await page.goto(`/game/${gameId}`);

    // Wait for page to load
    await page.waitForSelector('.game-header', { timeout: 10000 });

    // Click Create Scene button
    await page.click('.create-scene-btn');

    // Modal should open
    // Note: The actual selector depends on SceneManagementModal implementation
    // This assumes the modal has a visible overlay or modal container
    const modal = page.locator('[role="dialog"]').or(page.locator('.modal'));
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test('should display scene creation form in modal', async ({ page }) => {
    // Login with GM test account
    await login(page, 'testgm@test.com', 'TestPassword123!');
    const gameId = '9ef6bb45-ece6-4e65-99d3-4453e9f17cf4';
    await page.goto(`/game/${gameId}`);

    // Wait for page to load and click Create Scene
    await page.waitForSelector('.game-header', { timeout: 10000 });
    await page.click('.create-scene-btn');

    // Wait for modal to appear
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 }).catch(() =>
      page.waitForSelector('.modal', { timeout: 5000 })
    );

    // Check that scene name input exists
    // Note: Actual selectors depend on modal implementation
    const sceneNameInput = page.locator('input[name="name"]').or(
      page.locator('input[placeholder*="name" i]')
    );
    await expect(sceneNameInput.first()).toBeVisible();
  });

  test('should create a new scene with valid data', async ({ page }) => {
    // Login with GM test account
    await login(page, 'testgm@test.com', 'TestPassword123!');
    const gameId = '9ef6bb45-ece6-4e65-99d3-4453e9f17cf4';
    await page.goto(`/game/${gameId}`);

    // Wait for page to load
    await page.waitForSelector('.game-header', { timeout: 10000 });

    // Get initial scene count
    const initialScenes = await page.locator('#scene-select option').count().catch(() => 0);

    // Click Create Scene button
    await page.click('.create-scene-btn');

    // Wait for modal
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 }).catch(() =>
      page.waitForSelector('.modal', { timeout: 5000 })
    );

    // Fill in scene name
    const sceneName = `Test Scene ${Date.now()}`;
    const sceneNameInput = page.locator('input[name="name"]').or(
      page.locator('input[placeholder*="name" i]')
    );
    await sceneNameInput.first().fill(sceneName);

    // Submit the form
    const submitBtn = page.locator('button[type="submit"]').or(
      page.locator('button:has-text("Create")')
    );
    await submitBtn.first().click();

    // Modal should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 }).catch(() =>
      expect(page.locator('.modal')).not.toBeVisible({ timeout: 5000 })
    );

    // New scene should appear in scene selector
    await page.waitForTimeout(1000); // Wait for WebSocket update

    const updatedScenes = await page.locator('#scene-select option').count().catch(() => 0);
    expect(updatedScenes).toBeGreaterThan(initialScenes);

    // Scene name should be visible in selector
    await expect(page.locator(`#scene-select option:has-text("${sceneName}")`)).toBeVisible();
  });

  test('should switch scenes when selecting from dropdown', async ({ page }) => {
    // Login with test account
    await login(page, 'testgm@test.com', 'TestPassword123!');
    const gameId = '9ef6bb45-ece6-4e65-99d3-4453e9f17cf4';
    await page.goto(`/game/${gameId}`);

    // Wait for page to load
    await page.waitForSelector('.game-header', { timeout: 10000 });

    // Check if multiple scenes exist
    const sceneOptions = await page.locator('#scene-select option').count().catch(() => 0);

    if (sceneOptions > 1) {
      // Get the current scene
      const currentScene = await page.locator('#scene-select').inputValue();

      // Select a different scene
      const allOptions = await page.locator('#scene-select option').allTextContents();
      const differentScene = allOptions.find(option => option !== currentScene);

      if (differentScene) {
        await page.selectOption('#scene-select', { label: differentScene });

        // Wait for scene to change
        await page.waitForTimeout(1000);

        // Verify scene changed
        const newScene = await page.locator('#scene-select').inputValue();
        expect(newScene).not.toBe(currentScene);
      }
    }
  });

  test.skip('should display placeholder when no scenes exist', async ({ page }) => {
    // TODO: Login with test account to a game with no scenes
    const gameId = 'empty-game-id';
    await page.goto(`/game/${gameId}`);

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Should show placeholder
    const placeholder = page.locator('.placeholder');
    await expect(placeholder).toBeVisible();
    await expect(placeholder).toContainText('No Scene Available');
  });

  test.skip('should show create scene prompt for GM when no scenes exist', async ({ page }) => {
    // TODO: Login with GM test account to a game with no scenes
    const gameId = 'empty-game-id';
    await page.goto(`/game/${gameId}`);

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Placeholder should have Create Scene button for GM
    const placeholderBtn = page.locator('.placeholder button:has-text("Create Scene")');
    await expect(placeholderBtn).toBeVisible();
  });

  test.skip('should show waiting message for players when no scenes exist', async ({ page }) => {
    // TODO: Login with player test account to a game with no scenes
    const gameId = 'empty-game-id';
    await page.goto(`/game/${gameId}`);

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Placeholder should show waiting message for players
    const waitingMessage = page.locator('.placeholder-text');
    await expect(waitingMessage).toBeVisible();
    await expect(waitingMessage).toContainText('Waiting for GM');
  });
});
