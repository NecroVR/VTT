import { BasePage } from './BasePage';
import { Page, Locator } from '@playwright/test';

export class CampaignSessionPage extends BasePage {
  readonly canvas: Locator;
  readonly chatInput: Locator;
  readonly chatMessages: Locator;
  readonly addTokenButton: Locator;
  readonly tokensList: Locator;
  readonly token: Locator;
  readonly diceRollerButton: Locator;
  readonly diceNotationInput: Locator;
  readonly rollDiceButton: Locator;
  readonly rollResult: Locator;
  readonly deleteTokenButton: Locator;
  readonly campaignTitle: Locator;

  constructor(page: Page) {
    super(page);
    this.canvas = page.locator('canvas, [data-testid="campaign-canvas"]');
    this.chatInput = page.locator('[data-testid="chat-input"], textarea[name="message"], input[name="message"]');
    this.chatMessages = page.locator('[data-testid="chat-messages"], .chat-message');
    this.addTokenButton = page.locator('button[data-testid="add-token"], button:has-text("Add Token")');
    this.tokensList = page.locator('[data-testid="tokens-list"], .tokens-list');
    this.token = page.locator('[data-testid="token"], .token');
    this.diceRollerButton = page.locator('button[data-testid="dice-roller"], button:has-text("Roll Dice")');
    this.diceNotationInput = page.locator('[data-testid="dice-notation"], input[name="dice"]');
    this.rollDiceButton = page.locator('button[data-testid="roll-button"], button:has-text("Roll")');
    this.rollResult = page.locator('[data-testid="roll-result"], .roll-result');
    this.deleteTokenButton = page.locator('button[data-testid="delete-token"], button:has-text("Delete")');
    this.campaignTitle = page.locator('h1, [data-testid="campaign-title"]');
  }

  async gotoCampaign(campaignId: string) {
    await super.goto(`/campaign/${campaignId}`);
    await this.waitForLoad();
  }

  async sendChatMessage(message: string) {
    await this.chatInput.fill(message);
    await this.chatInput.press('Enter');
  }

  async getChatMessageCount(): Promise<number> {
    return await this.chatMessages.count();
  }

  async getLatestChatMessage(): Promise<string> {
    const messages = await this.chatMessages.all();
    if (messages.length === 0) return '';
    const lastMessage = messages[messages.length - 1];
    return await lastMessage.textContent() || '';
  }

  async addToken(x: number = 100, y: number = 100) {
    await this.addTokenButton.click();
    // Click on canvas at position
    const box = await this.canvas.boundingBox();
    if (box) {
      await this.page.mouse.click(box.x + x, box.y + y);
    }
  }

  async getTokenCount(): Promise<number> {
    return await this.token.count();
  }

  async moveToken(fromX: number, fromY: number, toX: number, toY: number) {
    const box = await this.canvas.boundingBox();
    if (box) {
      await this.page.mouse.move(box.x + fromX, box.y + fromY);
      await this.page.mouse.down();
      await this.page.mouse.move(box.x + toX, box.y + toY);
      await this.page.mouse.up();
    }
  }

  async deleteTokenByIndex(index: number = 0) {
    const tokens = await this.token.all();
    if (tokens.length > index) {
      await tokens[index].click();
      await this.deleteTokenButton.click();
    }
  }

  async openDiceRoller() {
    await this.diceRollerButton.click();
  }

  async rollDice(notation: string) {
    await this.openDiceRoller();
    await this.diceNotationInput.fill(notation);
    await this.rollDiceButton.click();
  }

  async getRollResult(): Promise<string> {
    await this.rollResult.waitFor({ state: 'visible', timeout: 5000 });
    return await this.rollResult.textContent() || '';
  }

  async waitForTokensToLoad() {
    await this.page.waitForTimeout(1000); // Wait for tokens to render
  }

  async reloadPage() {
    await this.page.reload();
    await this.waitForLoad();
  }

  async getCampaignTitle(): Promise<string> {
    return await this.campaignTitle.textContent() || '';
  }
}
