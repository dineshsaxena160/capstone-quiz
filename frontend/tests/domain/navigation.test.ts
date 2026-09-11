import { describe, expect, it } from 'vitest';
import { createLearnerResponse } from '@quiz/contracts';
import { getNextIndex, getPreviousIndex, getNextUnresolvedIndex } from '../../src/domain/navigation.js';
import { prepareSession } from '../../src/domain/shuffle.js';

describe('quiz navigation', () => {
  it('moves forward and back without leaving the question bounds', () => {
    expect(getNextIndex(0, 10)).toBe(1);
    expect(getNextIndex(9, 10)).toBe(9);
    expect(getPreviousIndex(4)).toBe(3);
    expect(getPreviousIndex(0)).toBe(0);
  });

  it('wraps skip navigation to the next unresolved question', () => {
    const session = prepareSession(createLearnerResponse());
    const answers = {
      [session.questions[0]!.id]: session.questions[0]!.options[0]!.id,
      [session.questions[1]!.id]: session.questions[1]!.options[0]!.id,
      [session.questions[3]!.id]: session.questions[3]!.options[0]!.id,
    };

    expect(getNextUnresolvedIndex(session.questions, answers, 2)).toBe(4);
    expect(getNextUnresolvedIndex(session.questions, answers, 9)).toBe(2);
  });
});
