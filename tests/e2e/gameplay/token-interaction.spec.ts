import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { CampaignsListPage } from '../pages/CampaignsListPage';
import { CreateCampaignPage } from '../pages/CreateCampaignPage';
import { CampaignSessionPage } from '../pages/CampaignSessionPage';

test.describe('Token Interaction', () => {
  let campaignSessionPage: CampaignSessionPage;
  let testUser: { email: string; password: string; username: string };
  let campaignId: string;

  test.beforeAll(async ({ browser }) => {
    // Create a test user and campaign for token tests
    const context = await browser.newContext();
    const page = await context.newPage();
    const registerPage = new RegisterPage(page);

    const timestamp = Date.now();
    testUser = {
      email: `tokenuser${timestamp}@example.com`,
      username: `TokenUser${timestamp}`,
      password: 'SecurePassword123!'
    };

    // Register user
    await registerPage.goto();
    await registerPage.register(testUser.email, testUser.username, testUser.password);
    await registerPage.waitForRedirect();

    // Create a test game
    const campaignsListPage = new CampaignsListPage(page);
    const createCampaignPage = new CreateCampaignPage(page);

    await campaignsListPage.goto();
    await campaignsListPage.clickCreateCampaign();
    await createCampaignPage.createCampaign(`Token Test Campaign ${timestamp}`);
    await createCampaignPage.waitForRedirect();

    // Extract game ID from URL
    const url = page.url();
    const match = url.match(/\/game[s]?\/([^\/]+)/);
    if (match) {
      campaignId = match[1];
    }

    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    // Login and navigate to campaign before each test
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
    await loginPage.waitForRedirect();

    campaignSessionPage = new CampaignSessionPage(page);
    if (campaignId) {
      await campaignSessionPage.gotoGame(campaignId);
    } else {
      // Fallback: go to campaigns list and click first campaign
      const campaignsListPage = new CampaignsListPage(page);
      await campaignsListPage.goto();
      const gameNames = await campaignsListPage.getCampaignNames();
      if (gameNames.length > 0) {
        await campaignsListPage.clickCampaignByName(gameNames[0]);
      }
    }

    await campaignSessionPage.waitForLoad();
  });

  test('user can see canvas on game page', async ({ page }) => {
    // Verify canvas is visible
    await expect(campaignSessionPage.canvas).toBeVisible();

    // Verify canvas has dimensions
    const box = await campaignSessionPage.canvas.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test('user can add a token', async ({ page }) => {
    // Get initial token count
    await campaignSessionPage.waitForTokensToLoad();
    const initialCount = await campaignSessionPage.getTokenCount();

    // Add a token
    await campaignSessionPage.addToken(150, 150);

    // Wait for token to be added
    await page.waitForTimeout(1000);

    // Verify token count increased
    const newCount = await campaignSessionPage.getTokenCount();
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('user can move a token', async ({ page }) => {
    // Add a token first
    await campaignSessionPage.addToken(100, 100);
    await page.waitForTimeout(1000);

    // Get initial token count
    const tokenCount = await campaignSessionPage.getTokenCount();
    expect(tokenCount).toBeGreaterThan(0);

    // Move the token
    await campaignSessionPage.moveToken(100, 100, 200, 200);
    await page.waitForTimeout(500);

    // Token should still exist (count shouldn't change)
    const newTokenCount = await campaignSessionPage.getTokenCount();
    expect(newTokenCount).toBe(tokenCount);
  });

  test('user can delete a token', async ({ page }) => {
    // Add a token first
    await campaignSessionPage.addToken(120, 120);
    await page.waitForTimeout(1000);

    // Get token count
    const initialCount = await campaignSessionPage.getTokenCount();
    expect(initialCount).toBeGreaterThan(0);

    // Delete the token
    await campaignSessionPage.deleteTokenByIndex(0);
    await page.waitForTimeout(1000);

    // Verify token was deleted
    const newCount = await campaignSessionPage.getTokenCount();
    expect(newCount).toBeLessThan(initialCount);
  });

  test('token changes persist after refresh', async ({ page }) => {
    // Add a token
    await campaignSessionPage.addToken(180, 180);
    await page.waitForTimeout(1000);

    // Get token count
    const tokenCountBefore = await campaignSessionPage.getTokenCount();
    expect(tokenCountBefore).toBeGreaterThan(0);

    // Reload the page
    await campaignSessionPage.reloadPage();
    await campaignSessionPage.waitForTokensToLoad();

    // Verify token still exists
    const tokenCountAfter = await campaignSessionPage.getTokenCount();
    expect(tokenCountAfter).toBe(tokenCountBefore);
  });

  test('multiple tokens can be added', async ({ page }) => {
    // Get initial count
    await campaignSessionPage.waitForTokensToLoad();
    const initialCount = await campaignSessionPage.getTokenCount();

    // Add multiple tokens
    await campaignSessionPage.addToken(50, 50);
    await page.waitForTimeout(500);
    await campaignSessionPage.addToken(150, 150);
    await page.waitForTimeout(500);
    await campaignSessionPage.addToken(250, 250);
    await page.waitForTimeout(500);

    // Verify all tokens were added
    const finalCount = await campaignSessionPage.getTokenCount();
    expect(finalCount).toBe(initialCount + 3);
  });

  test('tokens can be added at different canvas positions', async ({ page }) => {
    // Get initial count
    await campaignSessionPage.waitForTokensToLoad();
    const initialCount = await campaignSessionPage.getTokenCount();

    // Add tokens at various positions
    const positions = [
      { x: 50, y: 50 },
      { x: 300, y: 150 },
      { x: 150, y: 300 },
      { x: 400, y: 400 }
    ];

    for (const pos of positions) {
      await campaignSessionPage.addToken(pos.x, pos.y);
      await page.waitForTimeout(500);
    }

    // Verify all tokens were added
    const finalCount = await campaignSessionPage.getTokenCount();
    expect(finalCount).toBe(initialCount + positions.length);
  });

  test('deleting all tokens results in empty canvas', async ({ page }) => {
    // Add a few tokens
    await campaignSessionPage.addToken(100, 100);
    await page.waitForTimeout(500);
    await campaignSessionPage.addToken(200, 200);
    await page.waitForTimeout(500);

    // Get token count
    let tokenCount = await campaignSessionPage.getTokenCount();
    expect(tokenCount).toBeGreaterThanOrEqual(2);

    // Delete all tokens
    while (tokenCount > 0) {
      await campaignSessionPage.deleteTokenByIndex(0);
      await page.waitForTimeout(500);
      tokenCount = await campaignSessionPage.getTokenCount();
    }

    // Verify no tokens remain
    const finalCount = await campaignSessionPage.getTokenCount();
    expect(finalCount).toBe(0);
  });

  test('token operations work after multiple interactions', async ({ page }) => {
    // Add a token
    await campaignSessionPage.addToken(100, 100);
    await page.waitForTimeout(500);

    // Move it
    await campaignSessionPage.moveToken(100, 100, 200, 200);
    await page.waitForTimeout(500);

    // Add another token
    await campaignSessionPage.addToken(300, 300);
    await page.waitForTimeout(500);

    // Get count
    const tokenCount = await campaignSessionPage.getTokenCount();
    expect(tokenCount).toBeGreaterThanOrEqual(2);

    // Delete first token
    await campaignSessionPage.deleteTokenByIndex(0);
    await page.waitForTimeout(500);

    // Verify count decreased
    const newCount = await campaignSessionPage.getTokenCount();
    expect(newCount).toBe(tokenCount - 1);

    // Add another token - should still work
    await campaignSessionPage.addToken(150, 150);
    await page.waitForTimeout(500);

    const finalCount = await campaignSessionPage.getTokenCount();
    expect(finalCount).toBe(newCount + 1);
  });

  test('canvas remains interactive after token operations', async ({ page }) => {
    // Add a token
    await campaignSessionPage.addToken(100, 100);
    await page.waitForTimeout(500);

    // Verify canvas is still visible and has size
    await expect(campaignSessionPage.canvas).toBeVisible();
    const box = await campaignSessionPage.canvas.boundingBox();
    expect(box).toBeTruthy();

    // Add another token to verify canvas is still interactive
    await campaignSessionPage.addToken(250, 250);
    await page.waitForTimeout(500);

    const tokenCount = await campaignSessionPage.getTokenCount();
    expect(tokenCount).toBeGreaterThanOrEqual(2);
  });
});
