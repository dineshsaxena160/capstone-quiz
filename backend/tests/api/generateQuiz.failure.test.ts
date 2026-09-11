import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createProviderQuiz } from '../../../packages/contracts/tests/fixtures/quizPayloads.js';
import { createApp } from '../../src/app.js';
import { loadEnvironment } from '../../src/config/env.js';
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
  maxProviderAttempts: 1,
  rateLimitWindowMs: 60_000,
  rateLimitMax: 20,
};

describe('generation API failures', () => {
  it('maps provider authorization failures to a safe envelope', async () => {
    const provider: QuizProvider = {
      generate: vi.fn().mockRejectedValue(Object.assign(new Error('secret provider payload'), { status: 401 })),
    };
    const response = await request(createApp({ environment, provider, limits }))
      .post('/api/quiz/generate')
      .set('X-Request-Id', 'failure-auth')
      .send({ topic: 'JavaScript' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: 'unauthorized',
        message: 'The quiz service authorization needs attention. Please try again later.',
        retryable: false,
        requestId: 'failure-auth',
      },
    });
    expect(JSON.stringify(response.body)).not.toContain('secret provider payload');
  });

  it('rejects a malformed provider result as a complete set', async () => {
    const provider: QuizProvider = { generate: vi.fn().mockResolvedValue({ topic: 'JavaScript', questions: [] }) };
    const response = await request(createApp({ environment, provider, limits }))
      .post('/api/quiz/generate')
      .send({ topic: 'JavaScript' });

    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe('invalid_response');
    expect(response.body.questions).toBeUndefined();
  });

  it('removes settled request IDs so a later request can start a fresh generation', async () => {
    const provider: QuizProvider = { generate: vi.fn().mockResolvedValue(createProviderQuiz()) };
    const app = createApp({ environment, provider, limits });
    const first = await request(app)
      .post('/api/quiz/generate')
      .set('X-Request-Id', 'duplicate-request')
      .send({ topic: 'JavaScript' });
    const second = await request(app)
      .post('/api/quiz/generate')
      .set('X-Request-Id', 'duplicate-request')
      .send({ topic: 'JavaScript' });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(provider.generate).toHaveBeenCalledTimes(2);
  });
});