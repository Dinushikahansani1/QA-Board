import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://pentatechnologysolutions.com/test/');
  await page.locator('#uid').click();
  await page.locator('#uid').fill('Dinu');
  await page.locator('#pwd').click();
  await page.locator('#pwd').fill('123');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('link', { name: 'Dinu' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();
});