import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { GamesListPage } from '../pages/GamesListPage';
import { CreateGamePage } from '../pages/CreateGamePage';
import { GameSessionPage } from '../pages/GameSessionPage';

test.describe('Create Game', () => {
  let gamesListPage: GamesListPage;
  let createGamePage: CreateGamePage;
  let testUser: { email: string; password: string; username: string };

  test.beforeAll(async ({ browser }) => {
    // Create a test user for game creation tests
    const context = await browser.newContext();
    const page = await context.newPage();
    const registerPage = new RegisterPage(page);

    const timestamp = Date.now();
    testUser = {
      email: `gamecreator${timestamp}@example.com`,
      username: `GameCreator${timestamp}`,
      password: 'SecurePassword123!'
    };

    await registerPage.goto();
    await registerPage.register(testUser.email, testUser.username, testUser.password);
    await registerPage.waitForRedirect();

    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    // Login before each test
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
    await loginPage.waitForRedirect();

    gamesListPage = new GamesListPage(page);
    createGamePage = new CreateGamePage(page);
  });

  test('user can create a new game', async ({ page }) => {
    await gamesListPage.clickCreateGame();
    await page.waitForURL(/\/(games\/create|create-game)/);

    const gameName = `Test Campaign ${Date.now()}`;
    const gameDescription = 'A thrilling adventure awaits';

    await createGamePage.createGame(gameName, gameDescription);
    await createGamePage.waitForRedirect();

    // Should redirect to either game session or games list
    expect(page.url()).toMatch(/\/(games|game)/);
  });

  test('game appears in games list after creation', async ({ page }) => {
    const gameName = `New Adventure ${Date.now()}`;

    // Create game
    await gamesListPage.clickCreateGame();
    await createGamePage.createGame(gameName);
    await createGamePage.waitForRedirect();

    // Navigate back to games list
    await gamesListPage.goto();

    // Verify game appears in list
    const gameNames = await gamesListPage.getGameNames();
    const gameExists = gameNames.some(name => name.includes(gameName));
    expect(gameExists).toBeTruthy();
  });

  test('game creation requires name', async ({ page }) => {
    await gamesListPage.clickCreateGame();
    await page.waitForURL(/\/(games\/create|create-game)/);

    // Try to create game without name
    await createGamePage.submitButton.click();

    // Should show validation error
    const validationMessage = await createGamePage.gameNameInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );

    const isErrorVisible = await createGamePage.isErrorVisible();
    expect(validationMessage || isErrorVisible).toBeTruthy();

    // Should still be on create page
    expect(page.url()).toMatch(/\/(games\/create|create-game)/);
  });

  test('user is redirected to game after creation', async ({ page }) => {
    const gameName = `Immediate Play ${Date.now()}`;

    await gamesListPage.clickCreateGame();
    await createGamePage.createGame(gameName);
    await createGamePage.waitForRedirect();

    // Should redirect to either game session or games list
    const url = page.url();
    expect(url).toMatch(/\/(games|game)/);

    // If redirected to game session, verify game title
    if (url.includes('/game')) {
      const gameSessionPage = new GameSessionPage(page);
      const title = await gameSessionPage.getGameTitle();
      expect(title).toContain(gameName);
    }
  });

  test('multiple games can be created', async ({ page }) => {
    const game1Name = `Campaign One ${Date.now()}`;
    const game2Name = `Campaign Two ${Date.now()}`;

    // Create first game
    await gamesListPage.clickCreateGame();
    await createGamePage.createGame(game1Name);
    await createGamePage.waitForRedirect();

    // Navigate back to games list
    await gamesListPage.goto();

    // Create second game
    await gamesListPage.clickCreateGame();
    await createGamePage.createGame(game2Name);
    await createGamePage.waitForRedirect();

    // Navigate back to games list
    await gamesListPage.goto();

    // Verify both games exist
    const gameNames = await gamesListPage.getGameNames();
    const game1Exists = gameNames.some(name => name.includes(game1Name));
    const game2Exists = gameNames.some(name => name.includes(game2Name));

    expect(game1Exists).toBeTruthy();
    expect(game2Exists).toBeTruthy();
  });

  test('game creation with only name works', async ({ page }) => {
    const gameName = `Minimal Game ${Date.now()}`;

    await gamesListPage.clickCreateGame();
    await createGamePage.createGame(gameName); // No description

    await createGamePage.waitForRedirect();

    // Should succeed
    expect(page.url()).toMatch(/\/(games|game)/);

    // Verify game exists
    await gamesListPage.goto();
    const gameNames = await gamesListPage.getGameNames();
    const gameExists = gameNames.some(name => name.includes(gameName));
    expect(gameExists).toBeTruthy();
  });

  test('cancel button returns to games list', async ({ page }) => {
    await gamesListPage.clickCreateGame();
    await page.waitForURL(/\/(games\/create|create-game)/);

    // Click cancel
    await createGamePage.cancel();

    // Should return to games list
    await page.waitForURL(/\/games/);
    expect(page.url()).toContain('/games');
  });
});
