import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { CampaignsListPage } from '../pages/CampaignsListPage';
import { CreateCampaignPage } from '../pages/CreateCampaignPage';
import { CampaignSessionPage } from '../pages/CampaignSessionPage';

test.describe('Dice Rolling', () => {
  let campaignSessionPage: CampaignSessionPage;
  let testUser: { email: string; password: string; username: string };
  let campaignId: string;

  test.beforeAll(async ({ browser }) => {
    // Create a test user and campaign for dice rolling tests
    const context = await browser.newContext();
    const page = await context.newPage();
    const registerPage = new RegisterPage(page);

    const timestamp = Date.now();
    testUser = {
      email: `diceuser${timestamp}@example.com`,
      username: `DiceUser${timestamp}`,
      password: 'SecurePassword123!'
    };

    // Register user
    await registerPage.goto();
    await registerPage.register(testUser.email, testUser.username, testUser.password);
    await registerPage.waitForRedirect();

    // Create a test campaign
    const campaignsListPage = new CampaignsListPage(page);
    const createCampaignPage = new CreateCampaignPage(page);

    await campaignsListPage.goto();
    await campaignsListPage.clickCreateCampaign();
    await createCampaignPage.createCampaign(`Dice Test Campaign ${timestamp}`);
    await createCampaignPage.waitForRedirect();

    // Extract campaign ID from URL
    const url = page.url();
    const match = url.match(/\/campaign[s]?\/([^\/]+)/);
    if (match) {
      campaignId = match[1];
    }

    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    // Login and navigate to campaign before each test
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
    await loginPage.waitForRedirect();

    campaignSessionPage = new CampaignSessionPage(page);
    if (campaignId) {
      await campaignSessionPage.gotoCampaign(campaignId);
    } else {
      // Fallback: go to campaigns list and click first campaign
      const campaignsListPage = new CampaignsListPage(page);
      await campaignsListPage.goto();
      const campaignNames = await campaignsListPage.getCampaignNames();
      if (campaignNames.length > 0) {
        await campaignsListPage.clickCampaignByName(campaignNames[0]);
      }
    }

    await campaignSessionPage.waitForLoad();
  });

  test('user can roll dice', async ({ page }) => {
    // Roll a simple d20
    await campaignSessionPage.rollDice('d20');

    // Wait for result
    const result = await campaignSessionPage.getRollResult();

    // Verify result is a number between 1 and 20
    expect(result).toBeTruthy();
    const match = result.match(/\d+/);
    expect(match).toBeTruthy();

    if (match) {
      const value = parseInt(match[0]);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(20);
    }
  });

  test('roll results appear in chat or result area', async ({ page }) => {
    // Get initial chat message count
    const initialMessageCount = await campaignSessionPage.getChatMessageCount();

    // Roll dice
    await campaignSessionPage.rollDice('d6');

    // Wait a moment for message to appear
    await page.waitForTimeout(1000);

    // Check if result appears in chat or result area
    const hasRollResult = await campaignSessionPage.rollResult.isVisible().catch(() => false);
    const newMessageCount = await campaignSessionPage.getChatMessageCount();
    const chatUpdated = newMessageCount > initialMessageCount;

    // Either roll result is visible OR chat was updated
    expect(hasRollResult || chatUpdated).toBeTruthy();
  });

  test('d20 notation works', async ({ page }) => {
    await campaignSessionPage.rollDice('d20');

    const result = await campaignSessionPage.getRollResult();
    expect(result).toBeTruthy();

    // Result should contain a number
    const match = result.match(/\d+/);
    expect(match).toBeTruthy();

    if (match) {
      const value = parseInt(match[0]);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(20);
    }
  });

  test('2d6 notation works', async ({ page }) => {
    await campaignSessionPage.rollDice('2d6');

    const result = await campaignSessionPage.getRollResult();
    expect(result).toBeTruthy();

    // Result should contain a number
    const match = result.match(/\d+/);
    expect(match).toBeTruthy();

    if (match) {
      const value = parseInt(match[0]);
      // Two d6 dice: minimum 2, maximum 12
      expect(value).toBeGreaterThanOrEqual(2);
      expect(value).toBeLessThanOrEqual(12);
    }
  });

  test('2d6+5 notation with modifier works', async ({ page }) => {
    await campaignSessionPage.rollDice('2d6+5');

    const result = await campaignSessionPage.getRollResult();
    expect(result).toBeTruthy();

    // Result should contain a number
    const match = result.match(/\d+/);
    expect(match).toBeTruthy();

    if (match) {
      const value = parseInt(match[0]);
      // Two d6 dice + 5 modifier: minimum 7 (2+5), maximum 17 (12+5)
      expect(value).toBeGreaterThanOrEqual(7);
      expect(value).toBeLessThanOrEqual(17);
    }
  });

  test('d100 notation works', async ({ page }) => {
    await campaignSessionPage.rollDice('d100');

    const result = await campaignSessionPage.getRollResult();
    expect(result).toBeTruthy();

    // Result should contain a number
    const match = result.match(/\d+/);
    expect(match).toBeTruthy();

    if (match) {
      const value = parseInt(match[0]);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  test('multiple dice rolls produce different results', async ({ page }) => {
    const results: string[] = [];

    // Roll dice 5 times
    for (let i = 0; i < 5; i++) {
      await campaignSessionPage.rollDice('d20');
      const result = await campaignSessionPage.getRollResult();
      results.push(result);

      // Wait a moment between rolls
      await page.waitForTimeout(500);
    }

    // Verify we got 5 results
    expect(results.length).toBe(5);

    // At least one result should be different (statistically very unlikely all 5 are the same)
    const uniqueResults = new Set(results);
    expect(uniqueResults.size).toBeGreaterThan(1);
  });

  test('dice roller modal or interface can be closed and reopened', async ({ page }) => {
    // Open dice roller
    await campaignSessionPage.openDiceRoller();

    // Verify dice roller UI is visible
    await expect(campaignSessionPage.diceNotationInput.or(campaignSessionPage.rollDiceButton)).toBeVisible();

    // Try to close it (click outside or press Escape)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Reopen dice roller
    await campaignSessionPage.openDiceRoller();

    // Verify it's visible again
    await expect(campaignSessionPage.diceNotationInput.or(campaignSessionPage.rollDiceButton)).toBeVisible();
  });
});
