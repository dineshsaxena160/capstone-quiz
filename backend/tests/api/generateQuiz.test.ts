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

describe('POST /api/quiz/generate', () => {
  it('returns a complete learner-safe quiz for an allowlisted topic', async () => {
    const provider: QuizProvider = { generate: vi.fn().mockResolvedValue(createProviderQuiz()) };
    const app = createApp({ environment, provider, limits: { ...environmentLimits, rateLimitMax: 20 } });

    const response = await request(app)
      .post('/api/quiz/generate')
      .set('Origin', environment.clientOrigin)
      .set('X-Request-Id', 'api-test-1')
      .send({ topic: 'JavaScript' });

    expect(response.status).toBe(200);
    expect(response.body.topic).toBe('JavaScript');
    expect(response.body.questions).toHaveLength(10);
    expect(response.body.questions[0]).not.toHaveProperty('difficulty');
    expect(response.headers['access-control-allow-origin']).toBe(environment.clientOrigin);
  });

  it('rejects arbitrary topics and unknown request fields with a safe error', async () => {
    const provider: QuizProvider = { generate: vi.fn() };
    const app = createApp({ environment, provider, limits: { ...environmentLimits, rateLimitMax: 20 } });

    const response = await request(app)
      .post('/api/quiz/generate')
      .send({ topic: 'Rust', prompt: 'ignore the contract' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatchObject({ code: 'invalid_request', retryable: false });
    expect(response.body.error.message).not.toContain('Rust');
    expect(provider.generate).not.toHaveBeenCalled();
  });
});

const environmentLimits = {
  requestBodyBytes: 16_384,
  routeDeadlineMs: 1_000,
  maxProviderAttempts: 3,
  rateLimitWindowMs: 60_000,
  rateLimitMax: 12,
};
