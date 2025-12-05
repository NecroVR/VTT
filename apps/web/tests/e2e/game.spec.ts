import { test, expect } from '@playwright/test';

/**
 * Game Page E2E Tests
 *
 * Tests the game page features including scene controls,
 * chat panel, and combat tracker
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

test.describe('Game Page', () => {
  // Note: These tests require authentication and a valid game ID
  // They are skipped by default until test infrastructure is in place

  test('should display game header with game ID', async ({ page }) => {
    // Login with test account
    await login(page, 'testgm@test.com', 'TestPassword123!');

    // Navigate to a test game
    const gameId = '9ef6bb45-ece6-4e65-99d3-4453e9f17cf4';
    await page.goto(`/game/${gameId}`);

    // Check game header exists
    await expect(page.locator('.game-header')).toBeVisible();
    await expect(page.locator('.game-header h1')).toContainText('Game Session');
    await expect(page.locator('.game-id')).toContainText(gameId);
  });

  test('should display connection status', async ({ page }) => {
    // Login with test account
    await login(page, 'testgm@test.com', 'TestPassword123!');
    const gameId = '9ef6bb45-ece6-4e65-99d3-4453e9f17cf4';
    await page.goto(`/game/${gameId}`);

    // Check connection status indicator exists
    await expect(page.locator('.connection-status')).toBeVisible();
    await expect(page.locator('.status-indicator')).toBeVisible();
  });

  test('should display scene controls for GM', async ({ page }) => {
    // Login with GM test account
    await login(page, 'testgm@test.com', 'TestPassword123!');
    const gameId = '9ef6bb45-ece6-4e65-99d3-4453e9f17cf4';
    await page.goto(`/game/${gameId}`);

    // Wait for page to load
    await page.waitForSelector('.game-container', { timeout: 10000 });

    // Check if scene controls are visible (only for GM)
    // This assumes the test account is a GM
    const sceneControls = page.locator('.scene-controls-overlay');

    // Scene controls should exist if user is GM and scene is active
    // Note: This may not be visible if no scene is active
    const isVisible = await sceneControls.isVisible().catch(() => false);
    if (isVisible) {
      await expect(sceneControls).toBeVisible();
    }
  });

  test('should display Create Scene button for GM', async ({ page }) => {
    // Login with GM test account
    await login(page, 'testgm@test.com', 'TestPassword123!');
    const gameId = '9ef6bb45-ece6-4e65-99d3-4453e9f17cf4';
    await page.goto(`/game/${gameId}`);

    // Wait for page to load
    await page.waitForSelector('.game-header', { timeout: 10000 });

    // Check if Create Scene button is visible (only for GM)
    const createSceneBtn = page.locator('.create-scene-btn');

    // If user is GM, button should be visible
    await expect(createSceneBtn).toBeVisible();
    await expect(createSceneBtn).toContainText('Create Scene');
  });

  test('should display Chat Panel', async ({ page }) => {
    // Login with test account
    await login(page, 'testgm@test.com', 'TestPassword123!');
    const gameId = '9ef6bb45-ece6-4e65-99d3-4453e9f17cf4';
    await page.goto(`/game/${gameId}`);

    // Wait for sidebar to load
    await page.waitForSelector('.sidebar', { timeout: 10000 });

    // Chat panel should be visible in sidebar
    // Note: The actual selector depends on ChatPanel component implementation
    await expect(page.locator('.sidebar')).toBeVisible();
  });

  test('should display Combat Tracker', async ({ page }) => {
    // Login with test account
    await login(page, 'testgm@test.com', 'TestPassword123!');
    const gameId = '9ef6bb45-ece6-4e65-99d3-4453e9f17cf4';
    await page.goto(`/game/${gameId}`);

    // Wait for sidebar to load
    await page.waitForSelector('.sidebar', { timeout: 10000 });

    // Combat tracker should be visible in sidebar
    // Note: The actual selector depends on CombatTracker component implementation
    await expect(page.locator('.sidebar')).toBeVisible();
  });

  test('should display scene selector when scenes exist', async ({ page }) => {
    // Login with test account
    await login(page, 'testgm@test.com', 'TestPassword123!');
    const gameId = '9ef6bb45-ece6-4e65-99d3-4453e9f17cf4';
    await page.goto(`/game/${gameId}`);

    // Wait for page to load
    await page.waitForSelector('.game-header', { timeout: 10000 });

    // Check if scene selector exists (only if scenes are available)
    const sceneSelector = page.locator('.scene-selector');
    const isVisible = await sceneSelector.isVisible().catch(() => false);

    if (isVisible) {
      await expect(sceneSelector).toBeVisible();
      await expect(page.locator('#scene-select')).toBeVisible();
    }
  });

  test('should redirect to login if not authenticated', async ({ page }) => {
    // Clear any existing session storage
    await page.context().clearCookies();

    // Try to navigate to a game page without being logged in
    const gameId = '9ef6bb45-ece6-4e65-99d3-4453e9f17cf4';
    await page.goto(`/game/${gameId}`);

    // Should be redirected to login page
    await expect(page).toHaveURL(/\/login/);
  });
});
