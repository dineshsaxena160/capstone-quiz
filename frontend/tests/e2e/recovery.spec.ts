import { expect, test } from '@playwright/test';

test('shows safe recovery for a rate-limited generation', async ({ page }) => {
  await page.route('**/api/quiz/generate', async (route) => {
    await route.fulfill({
      status: 429,
      contentType: 'application/json',
      body: JSON.stringify({
        error: { code: 'rate_limit', message: 'The quiz service is busy.', retryable: true },
      }),
    });
  });

  await page.goto('/');
  await page.getByRole('radio', { name: 'SQL', exact: true }).check();
  await page.getByRole('button', { name: 'Start Quiz' }).click();
  await expect(page.getByRole('alert')).toContainText('busy');
  await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();
  await expect(page.getByText(/provider|429|stack|model/i)).not.toBeVisible();
});
