import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { GamesListPage } from '../pages/GamesListPage';
import { CreateGamePage } from '../pages/CreateGamePage';
import { GameSessionPage } from '../pages/GameSessionPage';

test.describe('Games List', () => {
  let gamesListPage: GamesListPage;
  let testUser: { email: string; password: string; username: string };

  test.beforeAll(async ({ browser }) => {
    // Create a test user with some games
    const context = await browser.newContext();
    const page = await context.newPage();
    const registerPage = new RegisterPage(page);

    const timestamp = Date.now();
    testUser = {
      email: `gamelistuser${timestamp}@example.com`,
      username: `GameListUser${timestamp}`,
      password: 'SecurePassword123!'
    };

    // Register user
    await registerPage.goto();
    await registerPage.register(testUser.email, testUser.username, testUser.password);
    await registerPage.waitForRedirect();

    // Create a few test games
    const createGamePage = new CreateGamePage(page);
    const gamesPage = new GamesListPage(page);

    for (let i = 1; i <= 3; i++) {
      await gamesPage.goto();
      await gamesPage.clickCreateGame();
      await createGamePage.createGame(`Test Game ${i} ${timestamp}`);
      await createGamePage.waitForRedirect();
    }

    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    // Login before each test
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
    await loginPage.waitForRedirect();

    gamesListPage = new GamesListPage(page);
    await gamesListPage.goto();
  });

  test('games list displays user\'s games', async ({ page }) => {
    // Check that games are visible
    const gameCount = await gamesListPage.getGameCount();
    expect(gameCount).toBeGreaterThan(0);

    // Verify at least one game card is visible
    await expect(gamesListPage.gameCard.first()).toBeVisible();
  });

  test('empty state when no games exist', async ({ page }) => {
    // Create a new user with no games
    const timestamp = Date.now();
    const newUser = {
      email: `emptyuser${timestamp}@example.com`,
      username: `EmptyUser${timestamp}`,
      password: 'SecurePassword123!'
    };

    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.register(newUser.email, newUser.username, newUser.password);
    await registerPage.waitForRedirect();

    await gamesListPage.goto();

    // Should show empty state
    const isEmpty = await gamesListPage.isEmptyStateVisible();
    expect(isEmpty).toBeTruthy();

    // Game count should be 0
    const gameCount = await gamesListPage.getGameCount();
    expect(gameCount).toBe(0);
  });

  test('user can navigate to a game', async ({ page }) => {
    // Get the first game name
    const gameNames = await gamesListPage.getGameNames();
    expect(gameNames.length).toBeGreaterThan(0);

    const firstGameName = gameNames[0];

    // Click on the first game
    await gamesListPage.clickGameByName(firstGameName);

    // Should navigate to game session
    await page.waitForURL(/\/game/);
    expect(page.url()).toMatch(/\/game/);

    // Verify game session page loaded
    const gameSessionPage = new GameSessionPage(page);
    await expect(gameSessionPage.canvas.or(gameSessionPage.gameTitle)).toBeVisible();
  });

  test('create game button is visible and functional', async ({ page }) => {
    // Verify create game button is visible
    await expect(gamesListPage.createGameButton).toBeVisible();

    // Click create game button
    await gamesListPage.clickCreateGame();

    // Should navigate to create game page
    await page.waitForURL(/\/(games\/create|create-game)/);
    expect(page.url()).toMatch(/\/(games\/create|create-game)/);
  });

  test('games list shows multiple games', async ({ page }) => {
    // Get game count
    const gameCount = await gamesListPage.getGameCount();
    expect(gameCount).toBeGreaterThanOrEqual(3); // We created 3 games in beforeAll

    // Get all game names
    const gameNames = await gamesListPage.getGameNames();
    expect(gameNames.length).toBeGreaterThanOrEqual(3);

    // Verify each game name contains "Test Game"
    for (const name of gameNames) {
      expect(name).toMatch(/Test Game \d+/);
    }
  });
});
