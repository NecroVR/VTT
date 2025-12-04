import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { GamesListPage } from '../pages/GamesListPage';

test.describe('User Login', () => {
  let loginPage: LoginPage;
  let testUser: { email: string; password: string; username: string };

  test.beforeAll(async ({ browser }) => {
    // Create a test user for login tests
    const context = await browser.newContext();
    const page = await context.newPage();
    const registerPage = new RegisterPage(page);

    const timestamp = Date.now();
    testUser = {
      email: `logintest${timestamp}@example.com`,
      username: `LoginTest${timestamp}`,
      password: 'SecurePassword123!'
    };

    await registerPage.goto();
    await registerPage.register(testUser.email, testUser.username, testUser.password);
    await registerPage.waitForRedirect();

    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('user can log in with valid credentials', async ({ page }) => {
    await loginPage.login(testUser.email, testUser.password);
    await loginPage.waitForRedirect();

    // Should redirect to games list
    expect(page.url()).toMatch(/\/(games|dashboard)/);
  });

  test('login fails with wrong password', async ({ page }) => {
    await loginPage.login(testUser.email, 'WrongPassword123!');

    // Wait a moment for error to appear
    await page.waitForTimeout(1000);

    // Should show error message
    const isErrorVisible = await loginPage.isErrorVisible();
    expect(isErrorVisible).toBeTruthy();

    const errorText = await loginPage.getErrorMessage();
    expect(errorText.toLowerCase()).toMatch(/password|credentials|invalid/);

    // Should still be on login page
    expect(page.url()).toContain('/login');
  });

  test('login fails with non-existent email', async ({ page }) => {
    const nonExistentEmail = `nonexistent${Date.now()}@example.com`;
    await loginPage.login(nonExistentEmail, 'SomePassword123!');

    // Wait a moment for error to appear
    await page.waitForTimeout(1000);

    // Should show error message
    const isErrorVisible = await loginPage.isErrorVisible();
    expect(isErrorVisible).toBeTruthy();

    const errorText = await loginPage.getErrorMessage();
    expect(errorText.toLowerCase()).toMatch(/email|user|credentials|invalid|not found/);

    // Should still be on login page
    expect(page.url()).toContain('/login');
  });

  test('successful login redirects to games page', async ({ page }) => {
    await loginPage.login(testUser.email, testUser.password);
    await loginPage.waitForRedirect();

    // Verify redirect to games page
    await page.waitForURL(/\/games/);
    expect(page.url()).toContain('/games');

    // Verify games list page is loaded
    const gamesPage = new GamesListPage(page);
    await expect(gamesPage.createGameButton.or(gamesPage.emptyState)).toBeVisible();
  });

  test('user session persists after page refresh', async ({ page }) => {
    // Login
    await loginPage.login(testUser.email, testUser.password);
    await loginPage.waitForRedirect();
    await page.waitForURL(/\/games/);

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be on games page (not redirected to login)
    expect(page.url()).toMatch(/\/games/);

    // Verify games page content is visible
    const gamesPage = new GamesListPage(page);
    await expect(gamesPage.createGameButton.or(gamesPage.emptyState)).toBeVisible();
  });

  test('user can log out', async ({ page }) => {
    // Login first
    await loginPage.login(testUser.email, testUser.password);
    await loginPage.waitForRedirect();
    await page.waitForURL(/\/games/);

    // Logout
    const gamesPage = new GamesListPage(page);
    await gamesPage.logout();

    // Should redirect to login page
    expect(page.url()).toContain('/login');

    // Verify login form is visible
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
  });

  test('logged out user cannot access protected routes', async ({ page }) => {
    // Try to navigate to games page without logging in
    await page.goto('/games');

    // Should redirect to login page
    await page.waitForURL('/login', { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });

  test('login form validates empty fields', async ({ page }) => {
    // Try to submit with empty fields
    await loginPage.submitButton.click();

    // Check for HTML5 validation
    const emailValidation = await loginPage.emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(emailValidation).toBeTruthy();

    // Should still be on login page
    expect(page.url()).toContain('/login');
  });
});
