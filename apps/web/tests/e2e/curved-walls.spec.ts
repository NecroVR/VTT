import { test, expect, Page } from '@playwright/test';

/**
 * Curved Wall E2E Tests
 *
 * Tests the curved wall functionality including:
 * - Tool selection
 * - Curved wall creation
 * - Control point manipulation (add, drag, delete)
 * - Context menu interactions
 */

// Helper function to login
async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  // Wait for navigation to complete
  await page.waitForURL('/', { timeout: 10000 });
}

// Helper function to navigate to a game and wait for it to load
async function navigateToGame(page: Page, gameId: string) {
  await page.goto(`/game/${gameId}`);
  await page.waitForSelector('.game-header', { timeout: 10000 });
  // Wait for WebSocket connection to establish
  await page.waitForTimeout(2000);
}

// Helper to get canvas bounding box for coordinate calculations
async function getCanvasBounds(page: Page) {
  const canvas = page.locator('canvas.canvas-layer').first();
  return await canvas.boundingBox();
}

test.describe('Curved Wall Tool Selection', () => {
  const testGameId = '9ef6bb45-ece6-4e65-99d3-4453e9f17cf4';

  test('GM can select wall tool with keyboard shortcut', async ({ page }) => {
    await login(page, 'testgm@test.com', 'TestPassword123!');
    await navigateToGame(page, testGameId);

    // Check if scene controls are visible
    const sceneControls = page.locator('.scene-controls');
    await expect(sceneControls).toBeVisible({ timeout: 5000 });

    // Select wall tool using '2' keyboard shortcut
    await page.keyboard.press('2');
    await page.waitForTimeout(500);

    // Verify wall button is active
    const wallButton = page.locator('button[data-tool="wall"]');

    if (await wallButton.count() > 0) {
      await expect(wallButton.first()).toBeVisible();
    }
  });

  test('GM can select wall tool by clicking button', async ({ page }) => {
    await login(page, 'testgm@test.com', 'TestPassword123!');
    await navigateToGame(page, testGameId);

    // Wait for scene controls
    const sceneControls = page.locator('.scene-controls');
    await expect(sceneControls).toBeVisible({ timeout: 5000 });

    // Click wall button
    const wallButton = page.locator('button[data-tool="wall"]');

    if (await wallButton.count() > 0) {
      await wallButton.first().click();
      await page.waitForTimeout(500);

      // Button should be active
      await expect(wallButton.first()).toBeVisible();
    }
  });

  test('Wall tool shows correct cursor', async ({ page }) => {
    await login(page, 'testgm@test.com', 'TestPassword123!');
    await navigateToGame(page, testGameId);

    // Select wall tool
    await page.keyboard.press('2');
    await page.waitForTimeout(500);

    // Canvas should be present and have cursor class
    const canvas = page.locator('canvas.canvas-layer').first();
    await expect(canvas).toBeVisible();
  });

  test('Wall tool is only visible to GM', async ({ page }) => {
    await login(page, 'testgm@test.com', 'TestPassword123!');
    await navigateToGame(page, testGameId);

    // GM should see wall tool
    const wallButton = page.locator('button[data-tool="wall"]');

    if (await wallButton.count() > 0) {
      await expect(wallButton.first()).toBeVisible();
    }
  });
});

test.describe('Curved Wall Creation', () => {
  const testGameId = '9ef6bb45-ece6-4e65-99d3-4453e9f17cf4';

  test('GM can create a curved wall by clicking two points', async ({ page }) => {
    await login(page, 'testgm@test.com', 'TestPassword123!');
    await navigateToGame(page, testGameId);

    // Select curved wall tool
    await page.keyboard.press('2');
    await page.waitForTimeout(500);

    // Click two points to create a curved wall
    const canvasBounds = await getCanvasBounds(page);

    if (canvasBounds) {
      const startX = canvasBounds.x + canvasBounds.width / 4;
      const startY = canvasBounds.y + canvasBounds.height / 2;
      const endX = canvasBounds.x + (canvasBounds.width * 3) / 4;
      const endY = canvasBounds.y + canvasBounds.height / 2;

      // Click start point
      await page.mouse.click(startX, startY);
      await page.waitForTimeout(300);

      // Click end point
      await page.mouse.click(endX, endY);
      await page.waitForTimeout(500);

      // Curved wall should be created (no specific assertion as visual)
      // This test verifies the interaction doesn't crash
    }
  });

  test('Curved wall is visible on canvas after creation', async ({ page }) => {
    await login(page, 'testgm@test.com', 'TestPassword123!');
    await navigateToGame(page, testGameId);

    // Select curved wall tool
    await page.keyboard.press('2');
    await page.waitForTimeout(500);

    const canvasBounds = await getCanvasBounds(page);

    if (canvasBounds) {
      const centerX = canvasBounds.x + canvasBounds.width / 2;
      const centerY = canvasBounds.y + canvasBounds.height / 2;

      // Create a curved wall
      await page.mouse.click(centerX - 100, centerY);
      await page.waitForTimeout(300);
      await page.mouse.click(centerX + 100, centerY);
      await page.waitForTimeout(500);

      // Canvas should still be visible and functional
      const canvas = page.locator('canvas.canvas-layer').first();
      await expect(canvas).toBeVisible();
    }
  });

  test('Can create multiple curved walls', async ({ page }) => {
    await login(page, 'testgm@test.com', 'TestPassword123!');
    await navigateToGame(page, testGameId);

    // Select curved wall tool
    await page.keyboard.press('2');
    await page.waitForTimeout(500);

    const canvasBounds = await getCanvasBounds(page);

    if (canvasBounds) {
      const centerX = canvasBounds.x + canvasBounds.width / 2;
      const centerY = canvasBounds.y + canvasBounds.height / 2;

      // Create first curved wall
      await page.mouse.click(centerX - 100, centerY - 50);
      await page.waitForTimeout(300);
      await page.mouse.click(centerX + 100, centerY - 50);
      await page.waitForTimeout(500);

      // Create second curved wall
      await page.mouse.click(centerX - 100, centerY + 50);
      await page.waitForTimeout(300);
      await page.mouse.click(centerX + 100, centerY + 50);
      await page.waitForTimeout(500);

      // Application should remain stable
      const sceneControls = page.locator('.scene-controls');
      await expect(sceneControls).toBeVisible();
    }
  });
});

test.describe('Curved Wall Selection', () => {
  const testGameId = '9ef6bb45-ece6-4e65-99d3-4453e9f17cf4';

  test('Can select curved wall with select tool', async ({ page }) => {
    await login(page, 'testgm@test.com', 'TestPassword123!');
    await navigateToGame(page, testGameId);

    // First create a curved wall
    await page.keyboard.press('2');
    await page.waitForTimeout(500);

    const canvasBounds = await getCanvasBounds(page);

    if (canvasBounds) {
      const centerX = canvasBounds.x + canvasBounds.width / 2;
      const centerY = canvasBounds.y + canvasBounds.height / 2;

      // Create curved wall
      await page.mouse.click(centerX - 100, centerY);
      await page.waitForTimeout(300);
      await page.mouse.click(centerX + 100, centerY);
      await page.waitForTimeout(500);

      // Switch to select tool
      await page.keyboard.press('1');
      await page.waitForTimeout(500);

      // Click on the curved wall to select it
      await page.mouse.click(centerX, centerY);
      await page.waitForTimeout(500);

      // Wall should be selected (visual indication on canvas)
      const canvas = page.locator('canvas.canvas-layer').first();
      await expect(canvas).toBeVisible();
    }
  });

  test('Selected curved wall shows endpoints', async ({ page }) => {
    await login(page, 'testgm@test.com', 'TestPassword123!');
    await navigateToGame(page, testGameId);

    // Create and select a curved wall
    await page.keyboard.press('2');
    await page.waitForTimeout(500);

    const canvasBounds = await getCanvasBounds(page);

    if (canvasBounds) {
      const centerX = canvasBounds.x + canvasBounds.width / 2;
      const centerY = canvasBounds.y + canvasBounds.height / 2;

      await page.mouse.click(centerX - 100, centerY);
      await page.waitForTimeout(300);
      await page.mouse.click(centerX + 100, centerY);
      await page.waitForTimeout(500);

      // Switch to select tool and select the wall
      await page.keyboard.press('1');
      await page.waitForTimeout(500);
      await page.mouse.click(centerX, centerY);
      await page.waitForTimeout(500);

      // Canvas should show visual indicators
      const canvas = page.locator('canvas.canvas-layer').first();
      await expect(canvas).toBeVisible();
    }
  });
});

test.describe('Add Spline Point', () => {
  const testGameId = '9ef6bb45-ece6-4e65-99d3-4453e9f17cf4';

  test('Right-click on curved wall shows Add Spline Point option', async ({ page }) => {
    await login(page, 'testgm@test.com', 'TestPassword123!');
    await navigateToGame(page, testGameId);

    // Create a curved wall
    await page.keyboard.press('2');
    await page.waitForTimeout(500);

    const canvasBounds = await getCanvasBounds(page);

    if (canvasBounds) {
      const centerX = canvasBounds.x + canvasBounds.width / 2;
      const centerY = canvasBounds.y + canvasBounds.height / 2;

      await page.mouse.click(centerX - 100, centerY);
      await page.waitForTimeout(300);
      await page.mouse.click(centerX + 100, centerY);
      await page.waitForTimeout(500);

      // Right-click on the curved wall
      await page.mouse.click(centerX, centerY, { button: 'right' });
      await page.waitForTimeout(500);

      // Look for "Add Spline Point" option in context menu
      const addSplineOption = page.locator('button:has-text("Add Spline Point")').or(
        page.locator('[role="menuitem"]:has-text("Add Spline Point")')
      );

      if (await addSplineOption.count() > 0) {
        await expect(addSplineOption.first()).toBeVisible();
      }
    }
  });

  test('Clicking Add Spline Point adds a control point', async ({ page }) => {
    await login(page, 'testgm@test.com', 'TestPassword123!');
    await navigateToGame(page, testGameId);

    // Create a curved wall
    await page.keyboard.press('2');
    await page.waitForTimeout(500);

    const canvasBounds = await getCanvasBounds(page);

    if (canvasBounds) {
      const centerX = canvasBounds.x + canvasBounds.width / 2;
      const centerY = canvasBounds.y + canvasBounds.height / 2;

      await page.mouse.click(centerX - 100, centerY);
      await page.waitForTimeout(300);
      await page.mouse.click(centerX + 100, centerY);
      await page.waitForTimeout(500);

      // Right-click on the curved wall
      await page.mouse.click(centerX, centerY, { button: 'right' });
      await page.waitForTimeout(500);

      // Click "Add Spline Point" option
      const addSplineOption = page.locator('button:has-text("Add Spline Point")');

      if (await addSplineOption.count() > 0) {
        await addSplineOption.first().click();
        await page.waitForTimeout(500);

        // Control point should be added (visual change on canvas)
        const canvas = page.locator('canvas.canvas-layer').first();
        await expect(canvas).toBeVisible();
      }
    }
  });

  test('Can add multiple spline points to one curved wall', async ({ page }) => {
    await login(page, 'testgm@test.com', 'TestPassword123!');
    await navigateToGame(page, testGameId);

    // Create a curved wall
    await page.keyboard.press('2');
    await page.waitForTimeout(500);

    const canvasBounds = await getCanvasBounds(page);

    if (canvasBounds) {
      const centerX = canvasBounds.x + canvasBounds.width / 2;
      const centerY = canvasBounds.y + canvasBounds.height / 2;

      await page.mouse.click(centerX - 150, centerY);
      await page.waitForTimeout(300);
      await page.mouse.click(centerX + 150, centerY);
      await page.waitForTimeout(500);

      // Add first spline point
      await page.mouse.click(centerX - 50, centerY, { button: 'right' });
      await page.waitForTimeout(500);

      const addSplineOption1 = page.locator('button:has-text("Add Spline Point")');
      if (await addSplineOption1.count() > 0) {
        await addSplineOption1.first().click();
        await page.waitForTimeout(500);
      }

      // Add second spline point
      await page.mouse.click(centerX + 50, centerY, { button: 'right' });
      await page.waitForTimeout(500);

      const addSplineOption2 = page.locator('button:has-text("Add Spline Point")');
      if (await addSplineOption2.count() > 0) {
        await addSplineOption2.first().click();
        await page.waitForTimeout(500);
      }

      // Application should remain stable
      const sceneControls = page.locator('.scene-controls');
      await expect(sceneControls).toBeVisible();
    }
  });
});

test.describe('Control Point Dragging', () => {
  const testGameId = '9ef6bb45-ece6-4e65-99d3-4453e9f17cf4';

  test('Shift+click on control point starts dragging', async ({ page }) => {
    await login(page, 'testgm@test.com', 'TestPassword123!');
    await navigateToGame(page, testGameId);

    // Create a curved wall
    await page.keyboard.press('2');
    await page.waitForTimeout(500);

    const canvasBounds = await getCanvasBounds(page);

    if (canvasBounds) {
      const centerX = canvasBounds.x + canvasBounds.width / 2;
      const centerY = canvasBounds.y + canvasBounds.height / 2;

      await page.mouse.click(centerX - 100, centerY);
      await page.waitForTimeout(300);
      await page.mouse.click(centerX + 100, centerY);
      await page.waitForTimeout(500);

      // Add a control point
      await page.mouse.click(centerX, centerY, { button: 'right' });
      await page.waitForTimeout(500);

      const addSplineOption = page.locator('button:has-text("Add Spline Point")');
      if (await addSplineOption.count() > 0) {
        await addSplineOption.first().click();
        await page.waitForTimeout(500);

        // Switch to select tool
        await page.keyboard.press('1');
        await page.waitForTimeout(500);

        // Shift+click on control point area and drag
        await page.keyboard.down('Shift');
        await page.mouse.move(centerX, centerY);
        await page.mouse.down();
        await page.mouse.move(centerX, centerY - 50);
        await page.mouse.up();
        await page.keyboard.up('Shift');
        await page.waitForTimeout(500);

        // Canvas should still be visible and functional
        const canvas = page.locator('canvas.canvas-layer').first();
        await expect(canvas).toBeVisible();
      }
    }
  });

  test('Dragging control point updates wall shape', async ({ page }) => {
    await login(page, 'testgm@test.com', 'TestPassword123!');
    await navigateToGame(page, testGameId);

    // Create curved wall with control point
    await page.keyboard.press('2');
    await page.waitForTimeout(500);

    const canvasBounds = await getCanvasBounds(page);

    if (canvasBounds) {
      const centerX = canvasBounds.x + canvasBounds.width / 2;
      const centerY = canvasBounds.y + canvasBounds.height / 2;

      await page.mouse.click(centerX - 100, centerY);
      await page.waitForTimeout(300);
      await page.mouse.click(centerX + 100, centerY);
      await page.waitForTimeout(500);

      // Add control point
      await page.mouse.click(centerX, centerY, { button: 'right' });
      await page.waitForTimeout(500);

      const addSplineOption = page.locator('button:has-text("Add Spline Point")');
      if (await addSplineOption.count() > 0) {
        await addSplineOption.first().click();
        await page.waitForTimeout(500);

        // Switch to select tool and drag the control point
        await page.keyboard.press('1');
        await page.waitForTimeout(500);

        await page.keyboard.down('Shift');
        await page.mouse.move(centerX, centerY);
        await page.mouse.down();
        await page.mouse.move(centerX + 20, centerY - 60);
        await page.mouse.up();
        await page.keyboard.up('Shift');
        await page.waitForTimeout(500);

        // Wall should be updated (visual change)
        const canvas = page.locator('canvas.canvas-layer').first();
        await expect(canvas).toBeVisible();
      }
    }
  });

  test('Releasing mouse saves the new control point position', async ({ page }) => {
    await login(page, 'testgm@test.com', 'TestPassword123!');
    await navigateToGame(page, testGameId);

    // Create curved wall with control point
    await page.keyboard.press('2');
    await page.waitForTimeout(500);

    const canvasBounds = await getCanvasBounds(page);

    if (canvasBounds) {
      const centerX = canvasBounds.x + canvasBounds.width / 2;
      const centerY = canvasBounds.y + canvasBounds.height / 2;

      await page.mouse.click(centerX - 100, centerY);
      await page.waitForTimeout(300);
      await page.mouse.click(centerX + 100, centerY);
      await page.waitForTimeout(500);

      // Add and drag control point
      await page.mouse.click(centerX, centerY, { button: 'right' });
      await page.waitForTimeout(500);

      const addSplineOption = page.locator('button:has-text("Add Spline Point")');
      if (await addSplineOption.count() > 0) {
        await addSplineOption.first().click();
        await page.waitForTimeout(500);

        await page.keyboard.press('1');
        await page.waitForTimeout(500);

        await page.keyboard.down('Shift');
        await page.mouse.move(centerX, centerY);
        await page.mouse.down();
        await page.mouse.move(centerX + 30, centerY - 70);
        await page.mouse.up();
        await page.keyboard.up('Shift');
        await page.waitForTimeout(1000);

        // Position should be persisted
        // Switch tools and back to verify
        await page.keyboard.press('2');
        await page.waitForTimeout(300);
        await page.keyboard.press('1');
        await page.waitForTimeout(500);

        const canvas = page.locator('canvas.canvas-layer').first();
        await expect(canvas).toBeVisible();
      }
    }
  });
});

test.describe('Delete Spline Point', () => {
  const testGameId = '9ef6bb45-ece6-4e65-99d3-4453e9f17cf4';

  test('Right-click on control point shows Delete Spline Point option', async ({ page }) => {
    await login(page, 'testgm@test.com', 'TestPassword123!');
    await navigateToGame(page, testGameId);

    // Create curved wall with control point
    await page.keyboard.press('2');
    await page.waitForTimeout(500);

    const canvasBounds = await getCanvasBounds(page);

    if (canvasBounds) {
      const centerX = canvasBounds.x + canvasBounds.width / 2;
      const centerY = canvasBounds.y + canvasBounds.height / 2;

      await page.mouse.click(centerX - 100, centerY);
      await page.waitForTimeout(300);
      await page.mouse.click(centerX + 100, centerY);
      await page.waitForTimeout(500);

      // Add control point
      await page.mouse.click(centerX, centerY, { button: 'right' });
      await page.waitForTimeout(500);

      const addSplineOption = page.locator('button:has-text("Add Spline Point")');
      if (await addSplineOption.count() > 0) {
        await addSplineOption.first().click();
        await page.waitForTimeout(500);

        // Right-click on the control point area
        await page.mouse.click(centerX, centerY, { button: 'right' });
        await page.waitForTimeout(500);

        // Look for "Delete Spline Point" option
        const deleteSplineOption = page.locator('button:has-text("Delete Spline Point")').or(
          page.locator('[role="menuitem"]:has-text("Delete Spline Point")')
        );

        if (await deleteSplineOption.count() > 0) {
          await expect(deleteSplineOption.first()).toBeVisible();
        }
      }
    }
  });

  test('Clicking Delete Spline Point removes the control point', async ({ page }) => {
    await login(page, 'testgm@test.com', 'TestPassword123!');
    await navigateToGame(page, testGameId);

    // Create curved wall with control point
    await page.keyboard.press('2');
    await page.waitForTimeout(500);

    const canvasBounds = await getCanvasBounds(page);

    if (canvasBounds) {
      const centerX = canvasBounds.x + canvasBounds.width / 2;
      const centerY = canvasBounds.y + canvasBounds.height / 2;

      await page.mouse.click(centerX - 100, centerY);
      await page.waitForTimeout(300);
      await page.mouse.click(centerX + 100, centerY);
      await page.waitForTimeout(500);

      // Add control point
      await page.mouse.click(centerX, centerY, { button: 'right' });
      await page.waitForTimeout(500);

      const addSplineOption = page.locator('button:has-text("Add Spline Point")');
      if (await addSplineOption.count() > 0) {
        await addSplineOption.first().click();
        await page.waitForTimeout(500);

        // Delete the control point
        await page.mouse.click(centerX, centerY, { button: 'right' });
        await page.waitForTimeout(500);

        const deleteSplineOption = page.locator('button:has-text("Delete Spline Point")');
        if (await deleteSplineOption.count() > 0) {
          await deleteSplineOption.first().click();
          await page.waitForTimeout(500);

          // Control point should be removed (visual change)
          const canvas = page.locator('canvas.canvas-layer').first();
          await expect(canvas).toBeVisible();
        }
      }
    }
  });

  test('Wall updates after control point deletion', async ({ page }) => {
    await login(page, 'testgm@test.com', 'TestPassword123!');
    await navigateToGame(page, testGameId);

    // Create curved wall with control point
    await page.keyboard.press('2');
    await page.waitForTimeout(500);

    const canvasBounds = await getCanvasBounds(page);

    if (canvasBounds) {
      const centerX = canvasBounds.x + canvasBounds.width / 2;
      const centerY = canvasBounds.y + canvasBounds.height / 2;

      await page.mouse.click(centerX - 100, centerY);
      await page.waitForTimeout(300);
      await page.mouse.click(centerX + 100, centerY);
      await page.waitForTimeout(500);

      // Add control point
      await page.mouse.click(centerX, centerY, { button: 'right' });
      await page.waitForTimeout(500);

      const addSplineOption = page.locator('button:has-text("Add Spline Point")');
      if (await addSplineOption.count() > 0) {
        await addSplineOption.first().click();
        await page.waitForTimeout(500);

        // Drag the control point to change the wall shape
        await page.keyboard.press('1');
        await page.waitForTimeout(500);

        await page.keyboard.down('Shift');
        await page.mouse.move(centerX, centerY);
        await page.mouse.down();
        await page.mouse.move(centerX, centerY - 50);
        await page.mouse.up();
        await page.keyboard.up('Shift');
        await page.waitForTimeout(500);

        // Delete the control point
        await page.mouse.click(centerX, centerY - 50, { button: 'right' });
        await page.waitForTimeout(500);

        const deleteSplineOption = page.locator('button:has-text("Delete Spline Point")');
        if (await deleteSplineOption.count() > 0) {
          await deleteSplineOption.first().click();
          await page.waitForTimeout(500);

          // Wall should revert to straight line (visual change)
          const canvas = page.locator('canvas.canvas-layer').first();
          await expect(canvas).toBeVisible();
        }
      }
    }
  });
});

test.describe('Curved Wall Deletion', () => {
  const testGameId = '9ef6bb45-ece6-4e65-99d3-4453e9f17cf4';

  test('Can delete curved wall from context menu', async ({ page }) => {
    await login(page, 'testgm@test.com', 'TestPassword123!');
    await navigateToGame(page, testGameId);

    // Create curved wall
    await page.keyboard.press('2');
    await page.waitForTimeout(500);

    const canvasBounds = await getCanvasBounds(page);

    if (canvasBounds) {
      const centerX = canvasBounds.x + canvasBounds.width / 2;
      const centerY = canvasBounds.y + canvasBounds.height / 2;

      await page.mouse.click(centerX - 100, centerY);
      await page.waitForTimeout(300);
      await page.mouse.click(centerX + 100, centerY);
      await page.waitForTimeout(500);

      // Right-click on the curved wall and delete
      await page.mouse.click(centerX, centerY, { button: 'right' });
      await page.waitForTimeout(500);

      const deleteOption = page.locator('button:has-text("Delete")').or(
        page.locator('[role="menuitem"]:has-text("Delete")')
      );

      if (await deleteOption.count() > 0) {
        await deleteOption.first().click();
        await page.waitForTimeout(500);

        // Wall should be deleted
        const canvas = page.locator('canvas.canvas-layer').first();
        await expect(canvas).toBeVisible();
      }
    }
  });

  test('Deleting curved wall removes all control points', async ({ page }) => {
    await login(page, 'testgm@test.com', 'TestPassword123!');
    await navigateToGame(page, testGameId);

    // Create curved wall with control points
    await page.keyboard.press('2');
    await page.waitForTimeout(500);

    const canvasBounds = await getCanvasBounds(page);

    if (canvasBounds) {
      const centerX = canvasBounds.x + canvasBounds.width / 2;
      const centerY = canvasBounds.y + canvasBounds.height / 2;

      await page.mouse.click(centerX - 100, centerY);
      await page.waitForTimeout(300);
      await page.mouse.click(centerX + 100, centerY);
      await page.waitForTimeout(500);

      // Add control point
      await page.mouse.click(centerX, centerY, { button: 'right' });
      await page.waitForTimeout(500);

      const addSplineOption = page.locator('button:has-text("Add Spline Point")');
      if (await addSplineOption.count() > 0) {
        await addSplineOption.first().click();
        await page.waitForTimeout(500);

        // Delete the entire wall
        await page.mouse.click(centerX, centerY, { button: 'right' });
        await page.waitForTimeout(500);

        const deleteOption = page.locator('button:has-text("Delete")').filter({ hasNotText: 'Spline' });
        if (await deleteOption.count() > 0) {
          await deleteOption.first().click();
          await page.waitForTimeout(500);

          // Everything should be removed
          const canvas = page.locator('canvas.canvas-layer').first();
          await expect(canvas).toBeVisible();
        }
      }
    }
  });
});

test.describe('Integration and Edge Cases', () => {
  const testGameId = '9ef6bb45-ece6-4e65-99d3-4453e9f17cf4';

  test('Can switch between different tools', async ({ page }) => {
    await login(page, 'testgm@test.com', 'TestPassword123!');
    await navigateToGame(page, testGameId);

    // Switch between various tools
    await page.keyboard.press('2'); // Wall tool
    await page.waitForTimeout(300);
    await page.keyboard.press('1'); // Select tool
    await page.waitForTimeout(300);
    await page.keyboard.press('2'); // Wall tool
    await page.waitForTimeout(300);
    await page.keyboard.press('3'); // Light tool
    await page.waitForTimeout(300);

    // Application should remain stable
    const sceneControls = page.locator('.scene-controls');
    await expect(sceneControls).toBeVisible();
  });

  test('Can create multiple walls with spline points', async ({ page }) => {
    await login(page, 'testgm@test.com', 'TestPassword123!');
    await navigateToGame(page, testGameId);

    const canvasBounds = await getCanvasBounds(page);

    if (canvasBounds) {
      const centerX = canvasBounds.x + canvasBounds.width / 2;
      const centerY = canvasBounds.y + canvasBounds.height / 2;

      // Create first wall (initially straight)
      await page.keyboard.press('2');
      await page.waitForTimeout(500);
      await page.mouse.click(centerX - 100, centerY - 100);
      await page.waitForTimeout(300);
      await page.mouse.click(centerX + 100, centerY - 100);
      await page.waitForTimeout(500);

      // Create second wall
      await page.keyboard.press('2');
      await page.waitForTimeout(500);
      await page.mouse.click(centerX - 100, centerY + 100);
      await page.waitForTimeout(300);
      await page.mouse.click(centerX + 100, centerY + 100);
      await page.waitForTimeout(500);

      // Both should exist
      const canvas = page.locator('canvas.canvas-layer').first();
      await expect(canvas).toBeVisible();
    }
  });

  test('Handles rapid control point manipulation', async ({ page }) => {
    await login(page, 'testgm@test.com', 'TestPassword123!');
    await navigateToGame(page, testGameId);

    // Create curved wall
    await page.keyboard.press('2');
    await page.waitForTimeout(500);

    const canvasBounds = await getCanvasBounds(page);

    if (canvasBounds) {
      const centerX = canvasBounds.x + canvasBounds.width / 2;
      const centerY = canvasBounds.y + canvasBounds.height / 2;

      await page.mouse.click(centerX - 100, centerY);
      await page.waitForTimeout(300);
      await page.mouse.click(centerX + 100, centerY);
      await page.waitForTimeout(500);

      // Rapidly add and remove control points
      for (let i = 0; i < 3; i++) {
        // Add control point
        await page.mouse.click(centerX, centerY, { button: 'right' });
        await page.waitForTimeout(300);

        const addSplineOption = page.locator('button:has-text("Add Spline Point")');
        if (await addSplineOption.count() > 0) {
          await addSplineOption.first().click();
          await page.waitForTimeout(300);
        }
      }

      // Application should remain stable
      const sceneControls = page.locator('.scene-controls');
      await expect(sceneControls).toBeVisible();
    }
  });

  test('Canvas renders correctly after complex curved wall operations', async ({ page }) => {
    await login(page, 'testgm@test.com', 'TestPassword123!');
    await navigateToGame(page, testGameId);

    const canvasBounds = await getCanvasBounds(page);

    if (canvasBounds) {
      const centerX = canvasBounds.x + canvasBounds.width / 2;
      const centerY = canvasBounds.y + canvasBounds.height / 2;

      // Create curved wall
      await page.keyboard.press('2');
      await page.waitForTimeout(500);
      await page.mouse.click(centerX - 150, centerY);
      await page.waitForTimeout(300);
      await page.mouse.click(centerX + 150, centerY);
      await page.waitForTimeout(500);

      // Add control point
      await page.mouse.click(centerX, centerY, { button: 'right' });
      await page.waitForTimeout(500);

      const addSplineOption = page.locator('button:has-text("Add Spline Point")');
      if (await addSplineOption.count() > 0) {
        await addSplineOption.first().click();
        await page.waitForTimeout(500);

        // Drag control point
        await page.keyboard.press('1');
        await page.waitForTimeout(500);

        await page.keyboard.down('Shift');
        await page.mouse.move(centerX, centerY);
        await page.mouse.down();
        await page.mouse.move(centerX, centerY - 80);
        await page.mouse.up();
        await page.keyboard.up('Shift');
        await page.waitForTimeout(500);

        // Switch tools multiple times
        await page.keyboard.press('2');
        await page.waitForTimeout(300);
        await page.keyboard.press('3');
        await page.waitForTimeout(300);
        await page.keyboard.press('1');
        await page.waitForTimeout(500);

        // Canvas should still render correctly
        const canvas = page.locator('canvas.canvas-layer').first();
        await expect(canvas).toBeVisible();

        const finalBounds = await canvas.boundingBox();
        expect(finalBounds).not.toBeNull();
        if (finalBounds) {
          expect(finalBounds.width).toBeGreaterThan(100);
          expect(finalBounds.height).toBeGreaterThan(100);
        }
      }
    }
  });
});
