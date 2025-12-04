import { BasePage } from './BasePage';
import { Page, Locator } from '@playwright/test';

export class GamesListPage extends BasePage {
  readonly createGameButton: Locator;
  readonly gamesList: Locator;
  readonly gameCard: Locator;
  readonly emptyState: Locator;
  readonly logoutButton: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.createGameButton = page.locator('button[data-testid="create-game"], button:has-text("Create Game"), a[href*="create"]');
    this.gamesList = page.locator('[data-testid="games-list"], .games-list');
    this.gameCard = page.locator('[data-testid="game-card"], .game-card');
    this.emptyState = page.locator('[data-testid="empty-state"], .empty-state, :text("No games")');
    this.logoutButton = page.locator('[data-testid="logout-button"]');
    this.searchInput = page.locator('[name="search"], [placeholder*="Search"]');
  }

  async goto() {
    await super.goto('/games');
    await this.waitForLoad();
  }

  async clickCreateGame() {
    await this.createGameButton.click();
  }

  async getGameCount(): Promise<number> {
    return await this.gameCard.count();
  }

  async isEmptyStateVisible(): Promise<boolean> {
    return await this.emptyState.isVisible();
  }

  async clickGameByName(gameName: string) {
    await this.page.locator(`[data-testid="game-card"]:has-text("${gameName}"), .game-card:has-text("${gameName}")`).first().click();
  }

  async getGameNames(): Promise<string[]> {
    const games = await this.gameCard.all();
    const names: string[] = [];
    for (const game of games) {
      const name = await game.textContent();
      if (name) names.push(name.trim());
    }
    return names;
  }

  async searchGames(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Debounce wait
  }

  async logout() {
    await this.logoutButton.click();
    await this.page.waitForURL('/login');
  }
}
