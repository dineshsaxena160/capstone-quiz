import { describe, expect, it, vi } from 'vitest';
import { generateQuiz } from '../../src/services/quizApi.js';

describe('quiz API client recovery', () => {
  it('maps an abort deadline to a retryable timeout without exposing transport details', async () => {
    const fetchImpl = vi.fn().mockImplementation(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('request details', 'AbortError'));
          });
        }),
    );

    await expect(
      generateQuiz('JavaScript', { baseUrl: 'http://localhost:3001', fetchImpl, timeoutMs: 5 }),
    ).rejects.toMatchObject({
      appError: {
        code: 'timeout',
        retryable: true,
        message: 'Creating the quiz took too long. Please try again.',
      },
    });
  });

  it('maps a network rejection to a safe retryable error', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('socket details'));

    await expect(
      generateQuiz('JavaScript', { baseUrl: 'http://localhost:3001', fetchImpl, timeoutMs: 100 }),
    ).rejects.toMatchObject({ appError: { code: 'network', retryable: true } });
  });

  it('does not accept an unsafe API error payload as a product error', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'raw provider payload', stack: 'trace' } }), {
        status: 500,
      }),
    );

    await expect(
      generateQuiz('JavaScript', { baseUrl: 'http://localhost:3001', fetchImpl, timeoutMs: 100 }),
    ).rejects.toMatchObject({ appError: { code: 'unknown', retryable: true } });
  });
});
