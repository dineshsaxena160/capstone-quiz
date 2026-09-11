import {
  generateQuizRequestSchema,
  learnerQuizResponseSchema,
  type QuizResponse,
  type SupportedTopic,
} from '@quiz/contracts';
import { ClientRequestError, appErrorFromEnvelope, mapTransportError } from './errors.js';

export interface QuizApiOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export async function generateQuiz(
  topic: SupportedTopic,
  options: QuizApiOptions,
): Promise<QuizResponse> {
  const request = generateQuizRequestSchema.parse({ topic });
  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 50_000);
  const abortParent = () => controller.abort();
  options.signal?.addEventListener('abort', abortParent, { once: true });

  try {
    const response = await fetchImpl(`${options.baseUrl.replace(/\/$/, '')}/api/quiz/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': crypto.randomUUID(),
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    const body: unknown = await response.json();
    if (!response.ok) {
      throw new ClientRequestError(appErrorFromEnvelope(body));
    }

    const parsed = learnerQuizResponseSchema.safeParse(body);
    if (!parsed.success) {
      throw new ClientRequestError({
        code: 'invalid_response',
        message: 'We received an unusable quiz response. Please try again.',
        retryable: true,
      });
    }
    return parsed.data;
  } catch (error) {
    if (error instanceof ClientRequestError) throw error;
    throw new ClientRequestError(mapTransportError(error));
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', abortParent);
  }
}