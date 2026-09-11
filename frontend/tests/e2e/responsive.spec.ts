import { expect, test } from '@playwright/test';

test('keeps the topic screen contained at 320 pixels', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await expect(page.getByRole('heading', { name: 'Check your technical signal.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start Quiz' })).toBeVisible();
});
