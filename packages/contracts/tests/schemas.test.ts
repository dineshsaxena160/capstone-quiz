import { describe, expect, it } from 'vitest';
import {
  generateQuizRequestSchema,
  learnerQuizResponseSchema,
  providerQuizSchema,
  safeErrorEnvelopeSchema,
} from '../src/schemas.js';
import { createGeneratedQuestion, createLearnerResponse, createProviderQuiz } from './fixtures/quizPayloads.js';

describe('quiz schemas', () => {
  it('accepts a complete provider payload fixture', () => {
    const result = providerQuizSchema.safeParse(createProviderQuiz());

    expect(result.success).toBe(true);
  });

  it('accepts the learner-safe response and excludes provider difficulty', () => {
    const response = createLearnerResponse();
    const result = learnerQuizResponseSchema.safeParse(response);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.questions[0]).not.toHaveProperty('difficulty');
    }
  });

  it('rejects arbitrary request fields and unsupported topics', () => {
    expect(
      generateQuizRequestSchema.safeParse({ topic: 'JavaScript', prompt: 'free text' }),
    ).toEqual({ success: false, error: expect.anything() });
    expect(generateQuizRequestSchema.safeParse({ topic: 'Rust' }).success).toBe(false);
    expect(generateQuizRequestSchema.safeParse({ topic: ['JavaScript'] }).success).toBe(false);
  });

  it('rejects malformed questions and invalid references', () => {
    const payload = createProviderQuiz();
    const malformed = {
      ...payload,
      questions: payload.questions.map((question, index) =>
        index === 0 ? { ...question, correctOptionId: 'missing-option' } : question,
      ),
    };

    expect(providerQuizSchema.safeParse(malformed).success).toBe(true);
    expect(learnerQuizResponseSchema.safeParse(malformed).success).toBe(false);
    expect(
      providerQuizSchema.safeParse({ ...payload, questions: [createGeneratedQuestion(0)] }).success,
    ).toBe(false);
  });

  it('accepts only the safe error envelope shape', () => {
    expect(
      safeErrorEnvelopeSchema.safeParse({
        error: {
          code: 'invalid_response',
          message: 'Please try again.',
          retryable: true,
          requestId: 'request-123',
        },
      }).success,
    ).toBe(true);
    expect(
      safeErrorEnvelopeSchema.safeParse({
        error: {
          code: 'provider',
          message: 'raw provider body',
          retryable: true,
          stack: 'secret details',
        },
      }).success,
    ).toBe(false);
  });
});