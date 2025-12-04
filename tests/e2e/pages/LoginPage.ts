import { BasePage } from './BasePage';
import { Page, Locator } from '@playwright/test';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('[name="email"], [type="email"]');
    this.passwordInput = page.locator('[name="password"], [type="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[data-testid="error"], .error, [role="alert"]');
    this.registerLink = page.locator('a[href*="register"]');
  }

  async goto() {
    await super.goto('/login');
    await this.waitForLoad();
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async waitForRedirect() {
    await this.page.waitForURL(/\/(games|dashboard)/);
  }

  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }

  async isErrorVisible(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }
}
