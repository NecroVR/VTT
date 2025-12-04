import { test, expect } from '@playwright/test';
import { RegisterPage } from '../pages/RegisterPage';
import { GamesListPage } from '../pages/GamesListPage';

test.describe('User Registration', () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goto();
  });

  test('user can register with valid credentials', async ({ page }) => {
    const timestamp = Date.now();
    const email = `testuser${timestamp}@example.com`;
    const username = `TestUser${timestamp}`;
    const password = 'SecurePassword123!';

    await registerPage.register(email, username, password);
    await registerPage.waitForRedirect();

    // Should redirect to games list or dashboard
    expect(page.url()).toMatch(/\/(games|dashboard)/);
  });

  test('registration fails with existing email', async ({ page }) => {
    // First registration
    const timestamp = Date.now();
    const email = `duplicate${timestamp}@example.com`;
    const username = `DuplicateUser${timestamp}`;
    const password = 'SecurePassword123!';

    await registerPage.register(email, username, password);
    await registerPage.waitForRedirect();

    // Navigate back to registration
    await registerPage.goto();

    // Try to register with same email
    const newUsername = `DifferentUser${timestamp}`;
    await registerPage.register(email, newUsername, password);

    // Should show error message
    await expect(registerPage.errorMessage).toBeVisible();
    const errorText = await registerPage.getErrorMessage();
    expect(errorText.toLowerCase()).toContain('email');
  });

  test('registration fails with invalid email format', async ({ page }) => {
    const timestamp = Date.now();
    const invalidEmail = 'notanemail';
    const username = `TestUser${timestamp}`;
    const password = 'SecurePassword123!';

    await registerPage.register(invalidEmail, username, password);

    // Check for HTML5 validation or error message
    const emailInput = registerPage.emailInput;
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);

    // Either HTML5 validation prevents submit or error message is shown
    const isErrorVisible = await registerPage.isErrorVisible();
    expect(validationMessage || isErrorVisible).toBeTruthy();
  });

  test('registration fails with short password', async ({ page }) => {
    const timestamp = Date.now();
    const email = `testuser${timestamp}@example.com`;
    const username = `TestUser${timestamp}`;
    const shortPassword = '123'; // Too short

    await registerPage.register(email, username, shortPassword);

    // Should show error about password length
    const isErrorVisible = await registerPage.isErrorVisible();
    if (isErrorVisible) {
      const errorText = await registerPage.getErrorMessage();
      expect(errorText.toLowerCase()).toMatch(/password|length|character/);
    } else {
      // Check for HTML5 validation
      const passwordInput = registerPage.passwordInput;
      const validationMessage = await passwordInput.evaluate((el: HTMLInputElement) => el.validationMessage);
      expect(validationMessage).toBeTruthy();
    }
  });

  test('successful registration redirects to games page', async ({ page }) => {
    const timestamp = Date.now();
    const email = `testuser${timestamp}@example.com`;
    const username = `TestUser${timestamp}`;
    const password = 'SecurePassword123!';

    await registerPage.register(email, username, password);
    await registerPage.waitForRedirect();

    // Verify redirect to games page
    await page.waitForURL(/\/games/);
    expect(page.url()).toContain('/games');

    // Verify games list page is loaded
    const gamesPage = new GamesListPage(page);
    await expect(gamesPage.createGameButton.or(gamesPage.emptyState)).toBeVisible();
  });

  test('registration form validates password confirmation mismatch', async ({ page }) => {
    const timestamp = Date.now();
    const email = `testuser${timestamp}@example.com`;
    const username = `TestUser${timestamp}`;
    const password = 'SecurePassword123!';
    const wrongConfirmPassword = 'DifferentPassword123!';

    await registerPage.register(email, username, password, wrongConfirmPassword);

    // Should show error about password mismatch
    const isErrorVisible = await registerPage.isErrorVisible();
    expect(isErrorVisible).toBeTruthy();

    const errorText = await registerPage.getErrorMessage();
    expect(errorText.toLowerCase()).toMatch(/password|match|confirm/);
  });

  test('registration form shows validation for empty username', async ({ page }) => {
    const timestamp = Date.now();
    const email = `testuser${timestamp}@example.com`;
    const username = ''; // Empty username
    const password = 'SecurePassword123!';

    await registerPage.emailInput.fill(email);
    await registerPage.usernameInput.fill(username);
    await registerPage.passwordInput.fill(password);
    await registerPage.confirmPasswordInput.fill(password);
    await registerPage.submitButton.click();

    // Check for HTML5 validation or error message
    const usernameInput = registerPage.usernameInput;
    const validationMessage = await usernameInput.evaluate((el: HTMLInputElement) => el.validationMessage);

    const isErrorVisible = await registerPage.isErrorVisible();
    expect(validationMessage || isErrorVisible).toBeTruthy();
  });
});
