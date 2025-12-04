import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { GamesListPage } from '../pages/GamesListPage';
import { CreateGamePage } from '../pages/CreateGamePage';
import { GameSessionPage } from '../pages/GameSessionPage';

test.describe('Token Interaction', () => {
  let gameSessionPage: GameSessionPage;
  let testUser: { email: string; password: string; username: string };
  let gameId: string;

  test.beforeAll(async ({ browser }) => {
    // Create a test user and game for token tests
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
    const gamesListPage = new GamesListPage(page);
    const createGamePage = new CreateGamePage(page);

    await gamesListPage.goto();
    await gamesListPage.clickCreateGame();
    await createGamePage.createGame(`Token Test Game ${timestamp}`);
    await createGamePage.waitForRedirect();

    // Extract game ID from URL
    const url = page.url();
    const match = url.match(/\/game[s]?\/([^\/]+)/);
    if (match) {
      gameId = match[1];
    }

    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    // Login and navigate to game before each test
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
    await loginPage.waitForRedirect();

    gameSessionPage = new GameSessionPage(page);
    if (gameId) {
      await gameSessionPage.gotoGame(gameId);
    } else {
      // Fallback: go to games list and click first game
      const gamesListPage = new GamesListPage(page);
      await gamesListPage.goto();
      const gameNames = await gamesListPage.getGameNames();
      if (gameNames.length > 0) {
        await gamesListPage.clickGameByName(gameNames[0]);
      }
    }

    await gameSessionPage.waitForLoad();
  });

  test('user can see canvas on game page', async ({ page }) => {
    // Verify canvas is visible
    await expect(gameSessionPage.canvas).toBeVisible();

    // Verify canvas has dimensions
    const box = await gameSessionPage.canvas.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test('user can add a token', async ({ page }) => {
    // Get initial token count
    await gameSessionPage.waitForTokensToLoad();
    const initialCount = await gameSessionPage.getTokenCount();

    // Add a token
    await gameSessionPage.addToken(150, 150);

    // Wait for token to be added
    await page.waitForTimeout(1000);

    // Verify token count increased
    const newCount = await gameSessionPage.getTokenCount();
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('user can move a token', async ({ page }) => {
    // Add a token first
    await gameSessionPage.addToken(100, 100);
    await page.waitForTimeout(1000);

    // Get initial token count
    const tokenCount = await gameSessionPage.getTokenCount();
    expect(tokenCount).toBeGreaterThan(0);

    // Move the token
    await gameSessionPage.moveToken(100, 100, 200, 200);
    await page.waitForTimeout(500);

    // Token should still exist (count shouldn't change)
    const newTokenCount = await gameSessionPage.getTokenCount();
    expect(newTokenCount).toBe(tokenCount);
  });

  test('user can delete a token', async ({ page }) => {
    // Add a token first
    await gameSessionPage.addToken(120, 120);
    await page.waitForTimeout(1000);

    // Get token count
    const initialCount = await gameSessionPage.getTokenCount();
    expect(initialCount).toBeGreaterThan(0);

    // Delete the token
    await gameSessionPage.deleteTokenByIndex(0);
    await page.waitForTimeout(1000);

    // Verify token was deleted
    const newCount = await gameSessionPage.getTokenCount();
    expect(newCount).toBeLessThan(initialCount);
  });

  test('token changes persist after refresh', async ({ page }) => {
    // Add a token
    await gameSessionPage.addToken(180, 180);
    await page.waitForTimeout(1000);

    // Get token count
    const tokenCountBefore = await gameSessionPage.getTokenCount();
    expect(tokenCountBefore).toBeGreaterThan(0);

    // Reload the page
    await gameSessionPage.reloadPage();
    await gameSessionPage.waitForTokensToLoad();

    // Verify token still exists
    const tokenCountAfter = await gameSessionPage.getTokenCount();
    expect(tokenCountAfter).toBe(tokenCountBefore);
  });

  test('multiple tokens can be added', async ({ page }) => {
    // Get initial count
    await gameSessionPage.waitForTokensToLoad();
    const initialCount = await gameSessionPage.getTokenCount();

    // Add multiple tokens
    await gameSessionPage.addToken(50, 50);
    await page.waitForTimeout(500);
    await gameSessionPage.addToken(150, 150);
    await page.waitForTimeout(500);
    await gameSessionPage.addToken(250, 250);
    await page.waitForTimeout(500);

    // Verify all tokens were added
    const finalCount = await gameSessionPage.getTokenCount();
    expect(finalCount).toBe(initialCount + 3);
  });

  test('tokens can be added at different canvas positions', async ({ page }) => {
    // Get initial count
    await gameSessionPage.waitForTokensToLoad();
    const initialCount = await gameSessionPage.getTokenCount();

    // Add tokens at various positions
    const positions = [
      { x: 50, y: 50 },
      { x: 300, y: 150 },
      { x: 150, y: 300 },
      { x: 400, y: 400 }
    ];

    for (const pos of positions) {
      await gameSessionPage.addToken(pos.x, pos.y);
      await page.waitForTimeout(500);
    }

    // Verify all tokens were added
    const finalCount = await gameSessionPage.getTokenCount();
    expect(finalCount).toBe(initialCount + positions.length);
  });

  test('deleting all tokens results in empty canvas', async ({ page }) => {
    // Add a few tokens
    await gameSessionPage.addToken(100, 100);
    await page.waitForTimeout(500);
    await gameSessionPage.addToken(200, 200);
    await page.waitForTimeout(500);

    // Get token count
    let tokenCount = await gameSessionPage.getTokenCount();
    expect(tokenCount).toBeGreaterThanOrEqual(2);

    // Delete all tokens
    while (tokenCount > 0) {
      await gameSessionPage.deleteTokenByIndex(0);
      await page.waitForTimeout(500);
      tokenCount = await gameSessionPage.getTokenCount();
    }

    // Verify no tokens remain
    const finalCount = await gameSessionPage.getTokenCount();
    expect(finalCount).toBe(0);
  });

  test('token operations work after multiple interactions', async ({ page }) => {
    // Add a token
    await gameSessionPage.addToken(100, 100);
    await page.waitForTimeout(500);

    // Move it
    await gameSessionPage.moveToken(100, 100, 200, 200);
    await page.waitForTimeout(500);

    // Add another token
    await gameSessionPage.addToken(300, 300);
    await page.waitForTimeout(500);

    // Get count
    const tokenCount = await gameSessionPage.getTokenCount();
    expect(tokenCount).toBeGreaterThanOrEqual(2);

    // Delete first token
    await gameSessionPage.deleteTokenByIndex(0);
    await page.waitForTimeout(500);

    // Verify count decreased
    const newCount = await gameSessionPage.getTokenCount();
    expect(newCount).toBe(tokenCount - 1);

    // Add another token - should still work
    await gameSessionPage.addToken(150, 150);
    await page.waitForTimeout(500);

    const finalCount = await gameSessionPage.getTokenCount();
    expect(finalCount).toBe(newCount + 1);
  });

  test('canvas remains interactive after token operations', async ({ page }) => {
    // Add a token
    await gameSessionPage.addToken(100, 100);
    await page.waitForTimeout(500);

    // Verify canvas is still visible and has size
    await expect(gameSessionPage.canvas).toBeVisible();
    const box = await gameSessionPage.canvas.boundingBox();
    expect(box).toBeTruthy();

    // Add another token to verify canvas is still interactive
    await gameSessionPage.addToken(250, 250);
    await page.waitForTimeout(500);

    const tokenCount = await gameSessionPage.getTokenCount();
    expect(tokenCount).toBeGreaterThanOrEqual(2);
  });
});
