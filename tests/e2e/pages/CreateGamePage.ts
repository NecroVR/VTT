import { BasePage } from './BasePage';
import { Page, Locator } from '@playwright/test';

export class CreateGamePage extends BasePage {
  readonly gameNameInput: Locator;
  readonly gameDescriptionInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.gameNameInput = page.locator('[name="name"], [name="gameName"], [placeholder*="name" i]');
    this.gameDescriptionInput = page.locator('[name="description"], textarea');
    this.submitButton = page.locator('button[type="submit"], button:has-text("Create")');
    this.cancelButton = page.locator('button:has-text("Cancel")');
    this.errorMessage = page.locator('[data-testid="error"], .error, [role="alert"]');
  }

  async goto() {
    await super.goto('/games/create');
    await this.waitForLoad();
  }

  async createGame(name: string, description?: string) {
    await this.gameNameInput.fill(name);
    if (description) {
      await this.gameDescriptionInput.fill(description);
    }
    await this.submitButton.click();
  }

  async waitForRedirect() {
    await this.page.waitForURL(/\/(games|game)/);
  }

  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }

  async isErrorVisible(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  async cancel() {
    await this.cancelButton.click();
  }
}
