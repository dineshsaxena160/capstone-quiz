import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createProviderQuiz } from '../../../packages/contracts/tests/fixtures/quizPayloads.js';
import { createApp } from '../../src/app.js';
import { loadEnvironment } from '../../src/config/env.js';
import type { QuizProvider } from '../../src/provider/types.js';

const environment = loadEnvironment({
  GOOGLE_API_KEY: 'server-only-test-secret',
  GOOGLE_MODEL: 'gemma-4-26b-a4b',
  CLIENT_ORIGIN: 'http://localhost:5173',
  PORT: '3001',
  NODE_ENV: 'test',
});

const provider: QuizProvider = { generate: vi.fn().mockResolvedValue(createProviderQuiz()) };

describe('API security boundary', () => {
  it('allows only the configured origin and never exposes provider configuration on health', async () => {
    const app = createApp({ environment, provider, limits: { requestBodyBytes: 16_384, routeDeadlineMs: 500, maxProviderAttempts: 1, rateLimitWindowMs: 60_000, rateLimitMax: 20 } });
    const allowed = await request(app).get('/health').set('Origin', environment.clientOrigin);
    const denied = await request(app).get('/health').set('Origin', 'https://evil.example');

    expect(allowed.headers['access-control-allow-origin']).toBe(environment.clientOrigin);
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
    expect(allowed.body).toEqual({ status: 'ok' });
    expect(JSON.stringify(allowed.body)).not.toContain(environment.googleModel);
    expect(JSON.stringify(allowed.body)).not.toContain('server-only-test-secret');
  });

  it('rejects malformed JSON and unknown request fields safely', async () => {
    const app = createApp({ environment, provider, limits: { requestBodyBytes: 16_384, routeDeadlineMs: 500, maxProviderAttempts: 1, rateLimitWindowMs: 60_000, rateLimitMax: 20 } });
    const malformed = await request(app)
      .post('/api/quiz/generate')
      .set('Content-Type', 'application/json')
      .send('{"topic":');
    const unknown = await request(app).post('/api/quiz/generate').send({ topic: 'JavaScript', extra: 'x' });

    expect(malformed.status).toBe(400);
    expect(malformed.body.error.code).toBe('invalid_request');
    expect(unknown.status).toBe(400);
    expect(unknown.body.error.code).toBe('invalid_request');
  });

  it('applies the configured per-IP rate limit and security headers', async () => {
    const app = createApp({ environment, provider, limits: { requestBodyBytes: 16_384, routeDeadlineMs: 500, maxProviderAttempts: 1, rateLimitWindowMs: 60_000, rateLimitMax: 1 } });
    const first = await request(app).get('/health');
    const second = await request(app).get('/health');

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
    expect(first.headers['x-content-type-options']).toBe('nosniff');
  });
});