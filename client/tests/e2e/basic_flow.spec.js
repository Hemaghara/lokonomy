import { test, expect } from '@playwright/test';

test.describe('Lokonomy E2E Flow', () => {
  test('User can see the landing page and navigate to market', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    await expect(page.locator('h1')).toContainText('Empowering Your Local Community');

    await page.click('text=View Marketplace');

    await expect(page).toHaveURL(/.*market/);
    
    await expect(page.locator('h2')).toContainText(/Marketplace/i);
  });

  test('Login flow basic check', async ({ page }) => {
    await page.goto('http://localhost:5173/login');

    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();

    await page.click('text=Authorize');
    

  });
});
