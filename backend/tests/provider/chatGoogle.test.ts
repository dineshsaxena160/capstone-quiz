import { describe, expect, it } from 'vitest';
import { createProviderQuiz } from '../../../packages/contracts/tests/fixtures/quizPayloads.js';
import { validateGeneratedQuiz } from '../../src/quiz/validateQuiz.js';
import { parseProviderJson } from '../../src/provider/chatGoogle.js';

describe('provider JSON parsing', () => {
  it('returns a contract-shaped JSON object unchanged', () => {
    const quiz = createProviderQuiz();

    expect(parseProviderJson(JSON.stringify(quiz))).toEqual(quiz);
  });

  it('unwraps the single quiz envelope returned by some model responses', () => {
    const quiz = createProviderQuiz();

    expect(parseProviderJson(JSON.stringify({ quiz }))).toEqual(quiz);
  });

  it('rejects non-JSON provider content', () => {
    expect(() => parseProviderJson('not JSON')).toThrow(SyntaxError);
  });

  it('normalizes Gemma question and answer output to the provider contract', () => {
    const gemmaQuiz = {
      topic: 'JavaScript',
      questions: [
        ...Array.from({ length: 8 }, (_, index) => ({
          question: `Multiple choice question ${index + 1}`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          answer: 'Option A',
          explanation: 'Option A is correct.',
        })),
        {
          question: 'Is JavaScript dynamically typed?',
          options: ['True', 'False'],
          answer: 'True',
          explanation: 'JavaScript determines types at runtime.',
        },
        {
          question: 'What does this code return?',
          options: ['1', '2', '3', '4'],
          answer: '1',
          explanation: 'The expression evaluates to 1.',
          code: 'const value = 1;',
        },
      ],
    };

    const parsed = parseProviderJson(JSON.stringify(gemmaQuiz));

    expect(() => validateGeneratedQuiz(parsed, 'JavaScript')).not.toThrow();
    expect(parsed).toMatchObject({
      questions: [
        {
          id: 'gemma-question-1',
          difficulty: 'beginner',
          type: 'multiple_choice',
          correctOptionId: 'gemma-question-1-option-1',
        },
        ...Array.from({ length: 7 }, () => expect.anything()),
        {
          id: 'gemma-question-9',
          difficulty: 'advanced',
          type: 'true_false',
        },
        {
          id: 'gemma-question-10',
          difficulty: 'advanced',
          type: 'code_snippet',
        },
      ],
    });
  });
});