import { describe, expect, it, vi } from 'vitest';
import { createProviderQuiz } from '../../../packages/contracts/tests/fixtures/quizPayloads.js';
import { loadEnvironment } from '../../src/config/env.js';
import { OperationalError } from '../../src/api/errors.js';
import { createQuizGenerator } from '../../src/quiz/generateQuiz.js';
import { getRetryDelay, waitForRetry } from '../../src/quiz/retry.js';
import type { QuizProvider } from '../../src/provider/types.js';

const environment = loadEnvironment({
  GOOGLE_MODEL: 'gemma-4-26b-a4b',
  CLIENT_ORIGIN: 'http://localhost:5173',
  PORT: '3001',
  NODE_ENV: 'test',
});

const limits = {
  requestBodyBytes: 16_384,
  routeDeadlineMs: 500,
  maxProviderAttempts: 3,
  rateLimitWindowMs: 60_000,
  rateLimitMax: 20,
  retryBaseDelayMs: 1,
  retryMaxDelayMs: 5,
};

describe('generation failure policy', () => {
  it('keeps exponential retry delay bounded and jittered', () => {
    expect(getRetryDelay(0, 100, 1_000, () => 0)).toBe(50);
    expect(getRetryDelay(10, 100, 1_000, () => 1)).toBe(1_000);
  });

  it('cancels a pending backoff when the route signal aborts', async () => {
    const controller = new AbortController();
    const promise = waitForRetry(100, controller.signal);
    controller.abort();

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('retries transient provider failures and then returns a complete set', async () => {
    const provider: QuizProvider = {
      generate: vi
        .fn()
        .mockRejectedValueOnce(new Error('temporary'))
        .mockRejectedValueOnce(Object.assign(new Error('temporary'), { status: 503 }))
        .mockResolvedValueOnce(createProviderQuiz()),
    };
    const generator = createQuizGenerator({ environment, provider, limits });

    await expect(generator.generate('JavaScript')).resolves.toHaveProperty('questions');
    expect(provider.generate).toHaveBeenCalledTimes(3);
  });

  it('does not retry terminal configuration failures', async () => {
    const provider: QuizProvider = {
      generate: vi.fn().mockRejectedValue(new OperationalError('configuration')),
    };
    const generator = createQuizGenerator({ environment, provider, limits });

    await expect(generator.generate('JavaScript')).rejects.toMatchObject({ code: 'configuration' });
    expect(provider.generate).toHaveBeenCalledOnce();
  });
});