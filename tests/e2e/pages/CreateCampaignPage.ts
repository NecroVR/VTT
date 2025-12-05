import { BasePage } from './BasePage';
import { Page, Locator } from '@playwright/test';

export class CreateCampaignPage extends BasePage {
  readonly campaignNameInput: Locator;
  readonly campaignDescriptionInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.campaignNameInput = page.locator('[name="name"], [name="campaignName"], [placeholder*="name" i]');
    this.campaignDescriptionInput = page.locator('[name="description"], textarea');
    this.submitButton = page.locator('button[type="submit"], button:has-text("Create")');
    this.cancelButton = page.locator('button:has-text("Cancel")');
    this.errorMessage = page.locator('[data-testid="error"], .error, [role="alert"]');
  }

  async goto() {
    await super.goto('/campaigns/new');
    await this.waitForLoad();
  }

  async createCampaign(name: string, description?: string) {
    await this.campaignNameInput.fill(name);
    if (description) {
      await this.campaignDescriptionInput.fill(description);
    }
    await this.submitButton.click();
  }

  async waitForRedirect() {
    await this.page.waitForURL(/\/(campaigns|campaign)/);
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
