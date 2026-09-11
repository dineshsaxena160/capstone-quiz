import { describe, expect, it } from 'vitest';
import { createLearnerResponse } from '@quiz/contracts';
import { getAnsweredCount, getUnresolvedIndices, isValidOptionId } from '../../src/domain/answers.js';
import { prepareSession } from '../../src/domain/shuffle.js';

describe('quiz answers', () => {
  it('accepts only option IDs belonging to the question', () => {
    const session = prepareSession(createLearnerResponse());
    const question = session.questions[0]!;

    expect(isValidOptionId(question, question.options[0]!.id)).toBe(true);
    expect(isValidOptionId(question, 'unknown-option')).toBe(false);
  });

  it('counts valid answers and computes unresolved indices from the answer map', () => {
    const session = prepareSession(createLearnerResponse());
    const firstQuestion = session.questions[0]!;
    const thirdQuestion = session.questions[2]!;
    const answers = {
      [firstQuestion.id]: firstQuestion.options[0]!.id,
      [thirdQuestion.id]: thirdQuestion.options[0]!.id,
    };

    expect(getAnsweredCount(session.questions, answers)).toBe(2);
    expect(getUnresolvedIndices(session.questions, answers)).toEqual([1, 3, 4, 5, 6, 7, 8, 9]);
  });
});
