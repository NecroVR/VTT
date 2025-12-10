import { test, expect } from '@playwright/test';

/**
 * Sidebar Overlay E2E Tests
 *
 * Tests the overlay panel functionality in the collapsed sidebar.
 * The overlay system allows users to access sidebar content when the
 * sidebar is in a collapsed (icon-only) state.
 */

// Helper function to login (to be used in tests that require authentication)
async function login(page: any, email: string, password: string) {
  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  // Wait for navigation to complete
  await page.waitForURL('/', { timeout: 10000 });
}

// Helper to navigate to campaign page
async function navigateToCampaign(page: any, campaignId: string) {
  await page.goto(`/campaign/${campaignId}`);
  // Wait for the page to fully load
  await page.waitForSelector('.overlay-sidebar', { timeout: 10000 });
}

// Helper to collapse the sidebar if it's not already collapsed
async function collapseSidebar(page: any) {
  const collapseButton = page.locator('.collapse-button').last();

  // Check if sidebar is already collapsed
  const isCollapsed = await page.locator('.collapsed-strip').isVisible();

  if (!isCollapsed) {
    await collapseButton.click();
    // Wait for collapse animation
    await page.waitForSelector('.collapsed-strip', { timeout: 2000 });
    await page.waitForTimeout(300); // Animation complete
  }
}

// Helper to expand the sidebar if it's collapsed
async function expandSidebar(page: any) {
  const toggleButton = page.locator('.toggle-button');

  // Check if sidebar is collapsed
  const isCollapsed = await page.locator('.collapsed-strip').isVisible();

  if (isCollapsed) {
    await toggleButton.click();
    // Wait for expand animation
    await page.waitForSelector('.tab-bar', { timeout: 2000 });
    await page.waitForTimeout(300); // Animation complete
  }
}

test.describe('Sidebar Overlay Panel', () => {
  const testCampaignId = '9ef6bb45-ece6-4e65-99d3-4453e9f17cf4';

  test.beforeEach(async ({ page }) => {
    // Login and navigate to campaign page
    await login(page, 'testgm@test.com', 'TestPassword123!');
    await navigateToCampaign(page, testCampaignId);
  });

  test('overlay opens when clicking tab icon in collapsed state', async ({ page }) => {
    // Ensure sidebar is collapsed
    await collapseSidebar(page);

    // Verify we're in collapsed state
    await expect(page.locator('.collapsed-strip')).toBeVisible();

    // Click the Chat tab icon
    const chatIcon = page.locator('.icon-tab-button').first();
    await chatIcon.click();

    // Wait for overlay to appear
    await page.waitForTimeout(300); // Animation

    // Verify overlay panel is visible
    await expect(page.locator('.overlay-panel')).toBeVisible();

    // Verify overlay header shows the correct tab label
    await expect(page.locator('.overlay-panel-title')).toBeVisible();
  });

  test('tab icon is highlighted when overlay is open', async ({ page }) => {
    // Ensure sidebar is collapsed
    await collapseSidebar(page);

    // Click the Chat tab icon
    const chatIcon = page.locator('.icon-tab-button').first();
    await chatIcon.click();

    // Wait for overlay to appear
    await page.waitForTimeout(300);

    // Verify the clicked icon has active class
    await expect(chatIcon).toHaveClass(/active/);

    // Verify active styling is applied (color change)
    const backgroundColor = await chatIcon.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );

    // The active state should have a different background color than default
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)'); // Not transparent
  });

  test('overlay toggles when clicking same tab icon', async ({ page }) => {
    // Ensure sidebar is collapsed
    await collapseSidebar(page);

    // Click the Chat tab icon to open
    const chatIcon = page.locator('.icon-tab-button').first();
    await chatIcon.click();
    await page.waitForTimeout(300);

    // Verify overlay is visible
    await expect(page.locator('.overlay-panel')).toBeVisible();

    // Click the same icon again to close
    await chatIcon.click();
    await page.waitForTimeout(300);

    // Verify overlay is closed
    await expect(page.locator('.overlay-panel')).not.toBeVisible();

    // Verify icon is no longer active
    await expect(chatIcon).not.toHaveClass(/active/);
  });

  test('clicking different tab icon switches overlay content', async ({ page }) => {
    // Ensure sidebar is collapsed
    await collapseSidebar(page);

    // Click the first tab icon (Chat)
    const firstIcon = page.locator('.icon-tab-button').first();
    await firstIcon.click();
    await page.waitForTimeout(300);

    // Verify overlay is visible
    await expect(page.locator('.overlay-panel')).toBeVisible();

    // Get the initial overlay title
    const firstTitle = await page.locator('.overlay-panel-title').textContent();

    // Click a different tab icon (second tab)
    const secondIcon = page.locator('.icon-tab-button').nth(1);
    await secondIcon.click();
    await page.waitForTimeout(300);

    // Verify overlay is still visible
    await expect(page.locator('.overlay-panel')).toBeVisible();

    // Get the new overlay title
    const secondTitle = await page.locator('.overlay-panel-title').textContent();

    // Verify the title has changed (different tab content)
    expect(firstTitle).not.toBe(secondTitle);

    // Verify the second icon is now active
    await expect(secondIcon).toHaveClass(/active/);

    // Verify the first icon is no longer active
    await expect(firstIcon).not.toHaveClass(/active/);
  });

  test('click outside closes overlay', async ({ page }) => {
    // Ensure sidebar is collapsed
    await collapseSidebar(page);

    // Click the Chat tab icon to open overlay
    const chatIcon = page.locator('.icon-tab-button').first();
    await chatIcon.click();
    await page.waitForTimeout(300);

    // Verify overlay is visible
    await expect(page.locator('.overlay-panel')).toBeVisible();

    // Click on the canvas area (outside the overlay and icon strip)
    // We'll click on the main content area which should be outside the sidebar
    await page.locator('body').click({ position: { x: 200, y: 200 } });
    await page.waitForTimeout(300);

    // Verify overlay is closed
    await expect(page.locator('.overlay-panel')).not.toBeVisible();
  });

  test('escape key closes overlay', async ({ page }) => {
    // Ensure sidebar is collapsed
    await collapseSidebar(page);

    // Click the Chat tab icon to open overlay
    const chatIcon = page.locator('.icon-tab-button').first();
    await chatIcon.click();
    await page.waitForTimeout(300);

    // Verify overlay is visible
    await expect(page.locator('.overlay-panel')).toBeVisible();

    // Press Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Verify overlay is closed
    await expect(page.locator('.overlay-panel')).not.toBeVisible();

    // Verify icon is no longer active
    await expect(chatIcon).not.toHaveClass(/active/);
  });

  test('expanding sidebar closes overlay', async ({ page }) => {
    // Ensure sidebar is collapsed
    await collapseSidebar(page);

    // Click the Chat tab icon to open overlay
    const chatIcon = page.locator('.icon-tab-button').first();
    await chatIcon.click();
    await page.waitForTimeout(300);

    // Verify overlay is visible
    await expect(page.locator('.overlay-panel')).toBeVisible();

    // Click the expand button
    const toggleButton = page.locator('.toggle-button');
    await toggleButton.click();
    await page.waitForTimeout(400); // Wait for expand animation

    // Verify overlay is closed
    await expect(page.locator('.overlay-panel')).not.toBeVisible();

    // Verify sidebar is now expanded (tab bar is visible)
    await expect(page.locator('.tab-bar')).toBeVisible();

    // Verify collapsed strip is no longer visible
    await expect(page.locator('.collapsed-strip')).not.toBeVisible();
  });

  test('overlay panel shows correct content for each tab', async ({ page }) => {
    // Ensure sidebar is collapsed
    await collapseSidebar(page);

    // Test each tab by clicking its icon and verifying content
    const tabButtons = page.locator('.icon-tab-button');
    const tabCount = await tabButtons.count();

    for (let i = 0; i < tabCount; i++) {
      const tabButton = tabButtons.nth(i);
      const tabTitle = await tabButton.getAttribute('title');

      // Click the tab icon
      await tabButton.click();
      await page.waitForTimeout(300);

      // Verify overlay is visible
      await expect(page.locator('.overlay-panel')).toBeVisible();

      // Verify the overlay title matches the tab title
      const overlayTitle = await page.locator('.overlay-panel-title').textContent();
      expect(overlayTitle).toBe(tabTitle);

      // Verify the overlay content area exists
      await expect(page.locator('.overlay-panel-content')).toBeVisible();

      // Close the overlay by clicking outside
      await page.locator('body').click({ position: { x: 200, y: 200 } });
      await page.waitForTimeout(300);
    }
  });

  test('overlay close button works correctly', async ({ page }) => {
    // Ensure sidebar is collapsed
    await collapseSidebar(page);

    // Click the Chat tab icon to open overlay
    const chatIcon = page.locator('.icon-tab-button').first();
    await chatIcon.click();
    await page.waitForTimeout(300);

    // Verify overlay is visible
    await expect(page.locator('.overlay-panel')).toBeVisible();

    // Click the close button in the overlay header
    const closeButton = page.locator('.overlay-panel-close');
    await expect(closeButton).toBeVisible();
    await closeButton.click();
    await page.waitForTimeout(300);

    // Verify overlay is closed
    await expect(page.locator('.overlay-panel')).not.toBeVisible();

    // Verify icon is no longer active
    await expect(chatIcon).not.toHaveClass(/active/);
  });

  test('overlay remains open when clicking inside panel', async ({ page }) => {
    // Ensure sidebar is collapsed
    await collapseSidebar(page);

    // Click the Chat tab icon to open overlay
    const chatIcon = page.locator('.icon-tab-button').first();
    await chatIcon.click();
    await page.waitForTimeout(300);

    // Verify overlay is visible
    await expect(page.locator('.overlay-panel')).toBeVisible();

    // Click inside the overlay content area
    await page.locator('.overlay-panel-content').click();
    await page.waitForTimeout(300);

    // Verify overlay is still visible
    await expect(page.locator('.overlay-panel')).toBeVisible();

    // Click on the overlay header
    await page.locator('.overlay-panel-header').click();
    await page.waitForTimeout(300);

    // Verify overlay is still visible
    await expect(page.locator('.overlay-panel')).toBeVisible();
  });

  test('overlay does not open in expanded sidebar state', async ({ page }) => {
    // Ensure sidebar is expanded
    await expandSidebar(page);

    // Verify we're in expanded state
    await expect(page.locator('.tab-bar')).toBeVisible();
    await expect(page.locator('.collapsed-strip')).not.toBeVisible();

    // Click on any tab in the expanded tab bar
    const tabButton = page.locator('.tab-button').first();
    await tabButton.click();
    await page.waitForTimeout(300);

    // Verify overlay is NOT visible (it's only for collapsed state)
    await expect(page.locator('.overlay-panel')).not.toBeVisible();

    // Verify the tab content is shown in the normal tab-content area
    await expect(page.locator('.tab-content')).toBeVisible();
  });

  test('overlay animation plays smoothly on open', async ({ page }) => {
    // Ensure sidebar is collapsed
    await collapseSidebar(page);

    // Click the Chat tab icon to open overlay
    const chatIcon = page.locator('.icon-tab-button').first();
    await chatIcon.click();

    // Wait a brief moment for animation to start
    await page.waitForTimeout(50);

    // Verify overlay becomes visible during animation
    const overlay = page.locator('.overlay-panel');
    await expect(overlay).toBeVisible();

    // Wait for animation to complete
    await page.waitForTimeout(300);

    // Verify overlay is fully visible and positioned correctly
    const boundingBox = await overlay.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.width).toBeGreaterThan(300); // Should be ~350px
  });

  test('clicking icon strip does not close overlay', async ({ page }) => {
    // Ensure sidebar is collapsed
    await collapseSidebar(page);

    // Click the Chat tab icon to open overlay
    const chatIcon = page.locator('.icon-tab-button').first();
    await chatIcon.click();
    await page.waitForTimeout(300);

    // Verify overlay is visible
    await expect(page.locator('.overlay-panel')).toBeVisible();

    // Click on the collapsed strip area (not on a specific icon)
    await page.locator('.collapsed-strip').click();
    await page.waitForTimeout(300);

    // Verify overlay is still visible (icon strip clicks should not close it)
    await expect(page.locator('.overlay-panel')).toBeVisible();
  });
});
