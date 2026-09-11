import { describe, expect, it, vi } from 'vitest';
import { createProviderQuiz } from '../../../packages/contracts/tests/fixtures/quizPayloads.js';
import { loadEnvironment } from '../../src/config/env.js';
import { createQuizGenerator } from '../../src/quiz/generateQuiz.js';
import { QuizValidationError } from '../../src/quiz/validateQuiz.js';
import type { QuizProvider } from '../../src/provider/types.js';

const environment = loadEnvironment({
  GOOGLE_MODEL: 'gemma-4-26b-a4b',
  CLIENT_ORIGIN: 'http://localhost:5173',
  PORT: '3001',
  NODE_ENV: 'test',
});

const limits = {
  requestBodyBytes: 16_384,
  routeDeadlineMs: 1_000,
  maxProviderAttempts: 3,
  rateLimitWindowMs: 60_000,
  rateLimitMax: 20,
};

describe('quiz generation orchestration', () => {
  it('returns a learner-safe complete response from a mocked provider', async () => {
    const provider: QuizProvider = { generate: vi.fn().mockResolvedValue(createProviderQuiz()) };
    const generator = createQuizGenerator({ environment, provider, limits });

    const response = await generator.generate('JavaScript');

    expect(response.topic).toBe('JavaScript');
    expect(response.questions).toHaveLength(10);
    expect(response.questions[0]).not.toHaveProperty('difficulty');
    expect(provider.generate).toHaveBeenCalledOnce();
  });

  it('replaces an invalid complete set through the bounded repair attempt', async () => {
    const invalid = createProviderQuiz();
    invalid.questions[1] = { ...invalid.questions[1]!, prompt: invalid.questions[0]!.prompt };
    const provider: QuizProvider = {
      generate: vi
        .fn()
        .mockResolvedValueOnce(invalid)
        .mockResolvedValueOnce(createProviderQuiz()),
    };
    const generator = createQuizGenerator({ environment, provider, limits });

    const response = await generator.generate('JavaScript');

    expect(response.questions).toHaveLength(10);
    expect(provider.generate).toHaveBeenCalledTimes(2);
    expect(provider.generate).toHaveBeenLastCalledWith(
      expect.objectContaining({ prompt: expect.stringContaining('duplicate_prompt') }),
    );
  });

  it('rejects a persistently invalid set without returning partial data', async () => {
    const provider: QuizProvider = {
      generate: vi.fn().mockResolvedValue(createProviderQuiz().questions.slice(0, 9)),
    };
    const generator = createQuizGenerator({ environment, provider, limits: { ...limits, maxProviderAttempts: 2 } });

    await expect(generator.generate('JavaScript')).rejects.toMatchObject({ code: 'invalid_response' });
    expect(provider.generate).toHaveBeenCalledTimes(2);
    expect(QuizValidationError).toBeDefined();
  });
});