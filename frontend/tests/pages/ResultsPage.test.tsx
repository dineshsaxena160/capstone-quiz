import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createLearnerResponse } from '@quiz/contracts';
import { buildResult } from '../../src/domain/scoring.js';
import { prepareSession } from '../../src/domain/shuffle.js';
import { ResultsPage } from '../../src/pages/ResultsPage.js';

describe('ResultsPage', () => {
  it('renders deterministic metrics, all ten reviews, textual outcomes, and one exit action', () => {
    const session = prepareSession(createLearnerResponse('SQL'), () => 0);
    const answers = Object.fromEntries(
      session.questions.map((question, index) => [
        question.id,
        index % 2 === 0
          ? question.correctOptionId
          : question.options.find((option) => option.id !== question.correctOptionId)!.id,
      ]),
    );
    const result = buildResult(session, answers);

    render(<ResultsPage result={result} onChooseNewTopic={vi.fn()} />);

    expect(screen.getByLabelText('Score 5 out of 10')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getAllByText(/^Question \d+$/)).toHaveLength(10);
    expect(screen.getAllByText('Correct')).toHaveLength(6);
    expect(screen.getAllByText('Incorrect')).toHaveLength(6);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Choose New Topic' })).toBeInTheDocument();
    expect(screen.queryByText(/beginner|intermediate|advanced|difficulty/i)).not.toBeInTheDocument();
  });
});