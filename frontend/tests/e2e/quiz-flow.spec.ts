import { expect, test } from '@playwright/test';
import { createLearnerResponse } from '@quiz/contracts';

test('completes the answer, skip, revisit, change, and results flow', async ({ page }) => {
  await page.route('**/api/quiz/generate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(createLearnerResponse('JavaScript')),
    });
  });

  await page.goto('/');
  await expect(page.getByRole('radio')).toHaveCount(9);
  await expect(page.getByRole('button', { name: 'Start Quiz' })).toBeDisabled();
  await page.getByRole('radio', { name: 'JavaScript' }).check();
  await page.getByRole('button', { name: 'Start Quiz' }).click();
  await expect(page.getByText('Question 1 of 10')).toBeVisible();

  await page.getByRole('button', { name: 'Skip' }).click();
  await expect(page.getByText('Question 2 of 10')).toBeVisible();
  await page.getByRole('radio').first().check();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByText('Question 1 of 10')).toBeVisible();
  await page.getByRole('radio').first().check();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('radio').first()).toBeChecked();

  for (let questionNumber = 3; questionNumber <= 10; questionNumber += 1) {
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText(`Question ${questionNumber} of 10`)).toBeVisible();
    if (questionNumber === 10) break;
    await page.getByRole('radio').first().check();
  }

  await expect(page.getByRole('button', { name: 'Submit Quiz' })).toBeDisabled();
  await page.getByRole('radio').first().check();
  await page.getByRole('button', { name: 'Submit Quiz' }).click();
  await expect(page.getByRole('heading', { name: 'Your result' })).toBeVisible();
  await expect(page.getByText('Question 10', { exact: true })).toBeVisible();
  await expect(page.getByRole('button')).toHaveCount(1);
  await page.getByRole('button', { name: 'Choose New Topic' }).click();
  await expect(page.getByRole('heading', { name: 'Check your technical signal.' })).toBeVisible();
});
