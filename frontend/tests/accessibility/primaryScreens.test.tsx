import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import axe from 'axe-core';
import { createLearnerResponse } from '@quiz/contracts';
import { prepareSession } from '../../src/domain/shuffle.js';
import { GeneratingPage } from '../../src/pages/GeneratingPage.js';
import { QuizPage } from '../../src/pages/QuizPage.js';
import { TopicSelectionPage } from '../../src/pages/TopicSelectionPage.js';

async function expectAccessible(container: HTMLElement) {
  const results = await axe.run(container);
  expect(results.violations).toEqual([]);
}

describe('primary screen accessibility', () => {
  it('keeps topic selection accessible and difficulty-free', async () => {
    const { container } = render(
      <TopicSelectionPage selectedTopic={null} onSelectTopic={() => undefined} onStart={() => undefined} />,
    );
    await expectAccessible(container);
    expect(screen.queryByText(/difficulty|beginner|intermediate|advanced/i)).not.toBeInTheDocument();
  });

  it('keeps loading status accessible and difficulty-free', async () => {
    const { container } = render(<GeneratingPage topic="AWS" />);
    await expectAccessible(container);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText(/difficulty|beginner|intermediate|advanced/i)).not.toBeInTheDocument();
  });

  it('keeps the answer group accessible and exposes state beyond color', async () => {
    const session = prepareSession(createLearnerResponse(), () => 0);
    const { container } = render(
      <QuizPage session={session} onAnswer={() => undefined} onBack={() => undefined} onNext={() => undefined} onSkip={() => undefined} onSubmit={() => undefined} />,
    );
    await expectAccessible(container);
    expect(screen.getByRole('group', { name: 'Choose one answer' })).toBeInTheDocument();
  });
});