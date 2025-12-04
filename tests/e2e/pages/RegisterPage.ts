import { BasePage } from './BasePage';
import { Page, Locator } from '@playwright/test';

export class RegisterPage extends BasePage {
  readonly emailInput: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('[name="email"], [type="email"]');
    this.usernameInput = page.locator('[name="username"]');
    this.passwordInput = page.locator('[name="password"], [type="password"]').first();
    this.confirmPasswordInput = page.locator('[name="confirmPassword"], [name="confirm_password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[data-testid="error"], .error, [role="alert"]');
    this.loginLink = page.locator('a[href*="login"]');
  }

  async goto() {
    await super.goto('/register');
    await this.waitForLoad();
  }

  async register(email: string, username: string, password: string, confirmPassword?: string) {
    await this.emailInput.fill(email);
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    if (confirmPassword !== undefined) {
      await this.confirmPasswordInput.fill(confirmPassword);
    } else {
      await this.confirmPasswordInput.fill(password);
    }
    await this.submitButton.click();
  }

  async waitForRedirect() {
    await this.page.waitForURL(/\/(games|dashboard|login)/);
  }

  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }

  async isErrorVisible(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }
}
