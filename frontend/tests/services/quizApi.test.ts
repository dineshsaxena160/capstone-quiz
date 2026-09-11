import { describe, expect, it, vi } from 'vitest';
import { createLearnerResponse } from '@quiz/contracts';
import { ClientRequestError } from '../../src/services/errors.js';
import { generateQuiz } from '../../src/services/quizApi.js';

describe('quiz API client', () => {
  it('sends only the allowlisted topic and returns a revalidated learner-safe response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(createLearnerResponse()), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const response = await generateQuiz('JavaScript', {
      baseUrl: 'http://localhost:3001',
      fetchImpl,
      timeoutMs: 1_000,
    });

    expect(response.questions).toHaveLength(10);
    expect(response.questions[0]).not.toHaveProperty('difficulty');
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://localhost:3001/api/quiz/generate',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ topic: 'JavaScript' }),
      }),
    );
  });

  it('rejects a response that contains provider-only difficulty metadata', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ topic: 'JavaScript', questions: createLearnerResponse().questions.map((question) => ({ ...question, difficulty: 'beginner' })) }), {
        status: 200,
      }),
    );

    await expect(
      generateQuiz('JavaScript', { baseUrl: 'http://localhost:3001', fetchImpl, timeoutMs: 1_000 }),
    ).rejects.toMatchObject({ appError: { code: 'invalid_response', retryable: true } });
  });

  it('maps safe API error envelopes without exposing response details', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: 'rate_limit', message: 'The quiz service is busy.', retryable: true },
        }),
        { status: 429 },
      ),
    );

    await expect(
      generateQuiz('JavaScript', { baseUrl: 'http://localhost:3001', fetchImpl, timeoutMs: 1_000 }),
    ).rejects.toBeInstanceOf(ClientRequestError);
  });
});
