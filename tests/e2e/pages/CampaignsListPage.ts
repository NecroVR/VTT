import { BasePage } from './BasePage';
import { Page, Locator } from '@playwright/test';

export class CampaignsListPage extends BasePage {
  readonly createCampaignButton: Locator;
  readonly campaignsList: Locator;
  readonly campaignCard: Locator;
  readonly emptyState: Locator;
  readonly logoutButton: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.createCampaignButton = page.locator('button[data-testid="create-campaign"], button:has-text("Create Campaign"), a[href*="create"]');
    this.campaignsList = page.locator('[data-testid="campaigns-list"], .campaigns-list');
    this.campaignCard = page.locator('[data-testid="campaign-card"], .campaign-card');
    this.emptyState = page.locator('[data-testid="empty-state"], .empty-state, :text("No campaigns")');
    this.logoutButton = page.locator('[data-testid="logout-button"]');
    this.searchInput = page.locator('[name="search"], [placeholder*="Search"]');
  }

  async goto() {
    await super.goto('/campaigns');
    await this.waitForLoad();
  }

  async clickCreateCampaign() {
    await this.createCampaignButton.click();
  }

  async getCampaignCount(): Promise<number> {
    return await this.campaignCard.count();
  }

  async isEmptyStateVisible(): Promise<boolean> {
    return await this.emptyState.isVisible();
  }

  async clickCampaignByName(campaignName: string) {
    await this.page.locator(`[data-testid="campaign-card"]:has-text("${campaignName}"), .campaign-card:has-text("${campaignName}")`).first().click();
  }

  async getCampaignNames(): Promise<string[]> {
    const campaigns = await this.campaignCard.all();
    const names: string[] = [];
    for (const campaign of campaigns) {
      const name = await campaign.textContent();
      if (name) names.push(name.trim());
    }
    return names;
  }

  async searchCampaigns(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Debounce wait
  }

  async logout() {
    await this.logoutButton.click();
    await this.page.waitForURL('/login');
  }
}
