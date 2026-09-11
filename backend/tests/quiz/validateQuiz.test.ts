import { describe, expect, it } from 'vitest';
import { createProviderQuiz } from '../../../packages/contracts/tests/fixtures/quizPayloads.js';
import { mapToLearnerResponse } from '../../src/quiz/normalization.js';
import { validateGeneratedQuiz, QuizValidationError } from '../../src/quiz/validateQuiz.js';

describe('complete quiz validation', () => {
  it('accepts the complete 4/4/2 fixture and maps it to learner-safe data', () => {
    const validated = validateGeneratedQuiz(createProviderQuiz(), 'JavaScript');
    const learnerResponse = mapToLearnerResponse(validated);

    expect(validated.questions).toHaveLength(10);
    expect(learnerResponse.questions).toHaveLength(10);
    expect(learnerResponse.questions[0]).not.toHaveProperty('difficulty');
    expect(learnerResponse.questions[0]?.id).toBe('question-1');
  });

  it('rejects duplicate prompts and invalid answer references as one set', () => {
    const payload = createProviderQuiz();
    payload.questions[1] = { ...payload.questions[1]!, prompt: payload.questions[0]!.prompt };
    payload.questions[2] = { ...payload.questions[2]!, correctOptionId: 'missing' };

    expect(() => validateGeneratedQuiz(payload, 'JavaScript')).toThrow(QuizValidationError);
    try {
      validateGeneratedQuiz(payload, 'JavaScript');
    } catch (error) {
      expect(error).toBeInstanceOf(QuizValidationError);
      expect((error as QuizValidationError).failures).toEqual(
        expect.arrayContaining(['duplicate_prompt', 'correct_option_reference']),
      );
    }
  });

  it('rejects wrong distribution, type coverage, and option counts', () => {
    const payload = createProviderQuiz();
    payload.questions[9] = {
      ...payload.questions[9]!,
      difficulty: 'beginner',
      type: 'true_false',
      options: [
        { id: 'true', text: 'True' },
        { id: 'false', text: 'False' },
      ],
      correctOptionId: 'true',
    };
    const questionWithoutCode = { ...payload.questions[6]! };
    delete questionWithoutCode.code;
    payload.questions[6] = {
      ...questionWithoutCode,
      type: 'multiple_choice',
      options: [
        { id: 'a', text: 'A' },
        { id: 'b', text: 'B' },
        { id: 'c', text: 'C' },
        { id: 'd', text: 'D' },
      ],
      correctOptionId: 'a',
    };
    const secondQuestionWithoutCode = { ...payload.questions[2]! };
    delete secondQuestionWithoutCode.code;
    payload.questions[2] = {
      ...secondQuestionWithoutCode,
      type: 'multiple_choice',
      options: [
        { id: 'a', text: 'A' },
        { id: 'b', text: 'B' },
        { id: 'c', text: 'C' },
        { id: 'd', text: 'D' },
      ],
      correctOptionId: 'a',
    };

    expect(() => validateGeneratedQuiz(payload, 'JavaScript')).toThrow(QuizValidationError);
    try {
      validateGeneratedQuiz(payload, 'JavaScript');
    } catch (error) {
      expect((error as QuizValidationError).failures).toEqual(
        expect.arrayContaining(['advanced_count', 'code_snippet_missing']),
      );
    }
  });
});