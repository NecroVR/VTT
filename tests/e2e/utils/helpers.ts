import { Page } from '@playwright/test';

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(games|dashboard)/);
}

export async function logout(page: Page) {
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL('/login');
}
