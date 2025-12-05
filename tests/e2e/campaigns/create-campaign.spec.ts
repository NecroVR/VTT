import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { CampaignsListPage } from '../pages/CampaignsListPage';
import { CreateCampaignPage } from '../pages/CreateCampaignPage';
import { CampaignSessionPage } from '../pages/CampaignSessionPage';

test.describe('Create Campaign', () => {
  let campaignsListPage: CampaignsListPage;
  let createCampaignPage: CreateCampaignPage;
  let testUser: { email: string; password: string; username: string };

  test.beforeAll(async ({ browser }) => {
    // Create a test user for campaign creation tests
    const context = await browser.newContext();
    const page = await context.newPage();
    const registerPage = new RegisterPage(page);

    const timestamp = Date.now();
    testUser = {
      email: `campaigncreator${timestamp}@example.com`,
      username: `CampaignCreator${timestamp}`,
      password: 'SecurePassword123!'
    };

    await registerPage.goto();
    await registerPage.register(testUser.email, testUser.username, testUser.password);
    await registerPage.waitForRedirect();

    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    // Login before each test
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
    await loginPage.waitForRedirect();

    campaignsListPage = new CampaignsListPage(page);
    createCampaignPage = new CreateCampaignPage(page);
  });

  test('user can create a new campaign', async ({ page }) => {
    await campaignsListPage.clickCreateCampaign();
    await page.waitForURL(/\/(campaigns\/new|create-campaign)/);

    const campaignName = `Test Campaign ${Date.now()}`;
    const campaignDescription = 'A thrilling adventure awaits';

    await createCampaignPage.createCampaign(campaignName, campaignDescription);
    await createCampaignPage.waitForRedirect();

    // Should redirect to either campaign session or campaigns list
    expect(page.url()).toMatch(/\/(campaigns|campaign)/);
  });

  test('campaign appears in campaigns list after creation', async ({ page }) => {
    const campaignName = `New Adventure ${Date.now()}`;

    // Create campaign
    await campaignsListPage.clickCreateCampaign();
    await createCampaignPage.createCampaign(campaignName);
    await createCampaignPage.waitForRedirect();

    // Navigate back to campaigns list
    await campaignsListPage.goto();

    // Verify campaign appears in list
    const campaignNames = await campaignsListPage.getCampaignNames();
    const campaignExists = campaignNames.some(name => name.includes(campaignName));
    expect(campaignExists).toBeTruthy();
  });

  test('campaign creation requires name', async ({ page }) => {
    await campaignsListPage.clickCreateCampaign();
    await page.waitForURL(/\/(campaigns\/new|create-campaign)/);

    // Try to create campaign without name
    await createCampaignPage.submitButton.click();

    // Should show validation error
    const validationMessage = await createCampaignPage.campaignNameInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );

    const isErrorVisible = await createCampaignPage.isErrorVisible();
    expect(validationMessage || isErrorVisible).toBeTruthy();

    // Should still be on create page
    expect(page.url()).toMatch(/\/(campaigns\/new|create-campaign)/);
  });

  test('user is redirected to campaign after creation', async ({ page }) => {
    const campaignName = `Immediate Play ${Date.now()}`;

    await campaignsListPage.clickCreateCampaign();
    await createCampaignPage.createCampaign(campaignName);
    await createCampaignPage.waitForRedirect();

    // Should redirect to either campaign session or campaigns list
    const url = page.url();
    expect(url).toMatch(/\/(campaigns|campaign)/);

    // If redirected to campaign session, verify campaign title
    if (url.includes('/campaign')) {
      const campaignSessionPage = new CampaignSessionPage(page);
      const title = await campaignSessionPage.getCampaignTitle();
      expect(title).toContain(campaignName);
    }
  });

  test('multiple campaigns can be created', async ({ page }) => {
    const campaign1Name = `Campaign One ${Date.now()}`;
    const campaign2Name = `Campaign Two ${Date.now()}`;

    // Create first campaign
    await campaignsListPage.clickCreateCampaign();
    await createCampaignPage.createCampaign(campaign1Name);
    await createCampaignPage.waitForRedirect();

    // Navigate back to campaigns list
    await campaignsListPage.goto();

    // Create second campaign
    await campaignsListPage.clickCreateCampaign();
    await createCampaignPage.createCampaign(campaign2Name);
    await createCampaignPage.waitForRedirect();

    // Navigate back to campaigns list
    await campaignsListPage.goto();

    // Verify both campaigns exist
    const campaignNames = await campaignsListPage.getCampaignNames();
    const campaign1Exists = campaignNames.some(name => name.includes(campaign1Name));
    const campaign2Exists = campaignNames.some(name => name.includes(campaign2Name));

    expect(campaign1Exists).toBeTruthy();
    expect(campaign2Exists).toBeTruthy();
  });

  test('campaign creation with only name works', async ({ page }) => {
    const campaignName = `Minimal Campaign ${Date.now()}`;

    await campaignsListPage.clickCreateCampaign();
    await createCampaignPage.createCampaign(campaignName); // No description

    await createCampaignPage.waitForRedirect();

    // Should succeed
    expect(page.url()).toMatch(/\/(campaigns|campaign)/);

    // Verify campaign exists
    await campaignsListPage.goto();
    const campaignNames = await campaignsListPage.getCampaignNames();
    const campaignExists = campaignNames.some(name => name.includes(campaignName));
    expect(campaignExists).toBeTruthy();
  });

  test('cancel button returns to campaigns list', async ({ page }) => {
    await campaignsListPage.clickCreateCampaign();
    await page.waitForURL(/\/(campaigns\/new|create-campaign)/);

    // Click cancel
    await createCampaignPage.cancel();

    // Should return to campaigns list
    await page.waitForURL(/\/campaigns/);
    expect(page.url()).toContain('/campaigns');
  });
});
