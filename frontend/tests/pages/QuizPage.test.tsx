import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createLearnerResponse } from '@quiz/contracts';
import { prepareSession } from '../../src/domain/shuffle.js';
import { QuizPage } from '../../src/pages/QuizPage.js';

describe('QuizPage', () => {
  it('renders a grouped radio answer control and disables Next until an answer exists', async () => {
    const session = prepareSession(createLearnerResponse(), () => 0);
    const onAnswer = vi.fn();
    const user = userEvent.setup();

    render(
      <QuizPage
        session={session}
        onAnswer={onAnswer}
        onBack={vi.fn()}
        onNext={vi.fn()}
        onSkip={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText('Question 1 of 10')).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    await user.click(screen.getAllByRole('radio')[0]!);
    expect(onAnswer).toHaveBeenCalledWith(session.questions[0]!.options[0]!.id);
  });

  it('shows unresolved progress and provides Back, Skip, and Submit controls', () => {
    const session = prepareSession(createLearnerResponse(), () => 0);
    render(
      <QuizPage
        session={{ ...session, currentIndex: 9 }}
        onAnswer={vi.fn()}
        onBack={vi.fn()}
        onNext={vi.fn()}
        onSkip={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText('10 unanswered')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Skip' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Submit Quiz' })).toBeDisabled();
  });
});