import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { CampaignsListPage } from '../pages/CampaignsListPage';
import { CreateCampaignPage } from '../pages/CreateCampaignPage';
import { CampaignSessionPage } from '../pages/CampaignSessionPage';

test.describe('Campaigns List', () => {
  let campaignsListPage: CampaignsListPage;
  let testUser: { email: string; password: string; username: string };

  test.beforeAll(async ({ browser }) => {
    // Create a test user with some campaigns
    const context = await browser.newContext();
    const page = await context.newPage();
    const registerPage = new RegisterPage(page);

    const timestamp = Date.now();
    testUser = {
      email: `campaignlistuser${timestamp}@example.com`,
      username: `CampaignListUser${timestamp}`,
      password: 'SecurePassword123!'
    };

    // Register user
    await registerPage.goto();
    await registerPage.register(testUser.email, testUser.username, testUser.password);
    await registerPage.waitForRedirect();

    // Create a few test campaigns
    const createCampaignPage = new CreateCampaignPage(page);
    const campaignsPage = new CampaignsListPage(page);

    for (let i = 1; i <= 3; i++) {
      await campaignsPage.goto();
      await campaignsPage.clickCreateCampaign();
      await createCampaignPage.createCampaign(`Test Campaign ${i} ${timestamp}`);
      await createCampaignPage.waitForRedirect();
    }

    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    // Login before each test
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
    await loginPage.waitForRedirect();

    campaignsListPage = new CampaignsListPage(page);
    await campaignsListPage.goto();
  });

  test('campaigns list displays user\'s campaigns', async ({ page }) => {
    // Check that campaigns are visible
    const campaignCount = await campaignsListPage.getCampaignCount();
    expect(campaignCount).toBeGreaterThan(0);

    // Verify at least one campaign card is visible
    await expect(campaignsListPage.campaignCard.first()).toBeVisible();
  });

  test('empty state when no campaigns exist', async ({ page }) => {
    // Create a new user with no campaigns
    const timestamp = Date.now();
    const newUser = {
      email: `emptyuser${timestamp}@example.com`,
      username: `EmptyUser${timestamp}`,
      password: 'SecurePassword123!'
    };

    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.register(newUser.email, newUser.username, newUser.password);
    await registerPage.waitForRedirect();

    await campaignsListPage.goto();

    // Should show empty state
    const isEmpty = await campaignsListPage.isEmptyStateVisible();
    expect(isEmpty).toBeTruthy();

    // Campaign count should be 0
    const campaignCount = await campaignsListPage.getCampaignCount();
    expect(campaignCount).toBe(0);
  });

  test('user can navigate to a campaign', async ({ page }) => {
    // Get the first campaign name
    const campaignNames = await campaignsListPage.getCampaignNames();
    expect(campaignNames.length).toBeGreaterThan(0);

    const firstCampaignName = campaignNames[0];

    // Click on the first campaign
    await campaignsListPage.clickCampaignByName(firstCampaignName);

    // Should navigate to campaign session
    await page.waitForURL(/\/campaign/);
    expect(page.url()).toMatch(/\/campaign/);

    // Verify campaign session page loaded
    const campaignSessionPage = new CampaignSessionPage(page);
    await expect(campaignSessionPage.canvas.or(campaignSessionPage.campaignTitle)).toBeVisible();
  });

  test('create campaign button is visible and functional', async ({ page }) => {
    // Verify create campaign button is visible
    await expect(campaignsListPage.createCampaignButton).toBeVisible();

    // Click create campaign button
    await campaignsListPage.clickCreateCampaign();

    // Should navigate to create campaign page
    await page.waitForURL(/\/(campaigns\/new|create-campaign)/);
    expect(page.url()).toMatch(/\/(campaigns\/new|create-campaign)/);
  });

  test('campaigns list shows multiple campaigns', async ({ page }) => {
    // Get campaign count
    const campaignCount = await campaignsListPage.getCampaignCount();
    expect(campaignCount).toBeGreaterThanOrEqual(3); // We created 3 campaigns in beforeAll

    // Get all campaign names
    const campaignNames = await campaignsListPage.getCampaignNames();
    expect(campaignNames.length).toBeGreaterThanOrEqual(3);

    // Verify each campaign name contains "Test Campaign"
    for (const name of campaignNames) {
      expect(name).toMatch(/Test Campaign \d+/);
    }
  });
});
