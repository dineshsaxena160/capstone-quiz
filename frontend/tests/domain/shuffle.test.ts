import { describe, expect, it } from 'vitest';
import { createLearnerResponse, type QuizResponse } from '@quiz/contracts';
import { prepareSession, shuffleOptions } from '../../src/domain/shuffle.js';

describe('quiz option shuffle', () => {
  it('uses an immutable Fisher-Yates shuffle', () => {
    const options = ['a', 'b', 'c', 'd'];
    const shuffled = shuffleOptions(options, () => 0);

    expect(options).toEqual(['a', 'b', 'c', 'd']);
    expect(shuffled).toHaveLength(4);
    expect(new Set(shuffled)).toEqual(new Set(options));
  });

  it('prepares a stable shuffled session without changing the response answer key', () => {
    const response = createLearnerResponse() as QuizResponse;
    const firstQuestionOptions = response.questions[0]!.options;
    const session = prepareSession(response, () => 0.75);

    expect(response.questions[0]!.options).toEqual(firstQuestionOptions);
    expect(session.questions[0]!.options).not.toBe(firstQuestionOptions);
    expect(session.questions[0]!.correctOptionId).toBe(response.questions[0]!.correctOptionId);
    expect(session.answers).toEqual({});
  });
});