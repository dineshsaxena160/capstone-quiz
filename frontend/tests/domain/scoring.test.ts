import { describe, expect, it } from 'vitest';
import { createLearnerResponse } from '@quiz/contracts';
import { buildResult } from '../../src/domain/scoring.js';
import { prepareSession } from '../../src/domain/shuffle.js';

describe('quiz scoring', () => {
  it('calculates a bounded deterministic result from option IDs', () => {
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

    expect(result.topic).toBe('SQL');
    expect(result.correctAnswers).toBe(5);
    expect(result.incorrectAnswers).toBe(5);
    expect(result.percentage).toBe(50);
    expect(result.questions).toEqual(session.questions);
    expect(result.questions).not.toBe(session.questions);
  });
});
