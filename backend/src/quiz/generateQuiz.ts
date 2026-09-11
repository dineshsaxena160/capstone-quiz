import {
  type QuizResponse,
  type SupportedTopic,
} from '@quiz/contracts';
import type { Environment } from '../config/env.js';
import { DEFAULT_LIMITS, type GenerationLimits } from '../config/limits.js';
import { OperationalError, providerError } from '../api/errors.js';
import type { QuizProvider } from '../provider/types.js';
import { composeQuizPrompt } from './prompt.js';
import { mapToLearnerResponse } from './normalization.js';
import { QuizValidationError, validateGeneratedQuiz } from './validateQuiz.js';
import type { QuizGenerator, QuizGeneratorOptions } from './types.js';
import { getRetryDelay, waitForRetry } from './retry.js';

interface CreateQuizGeneratorOptions {
  environment: Environment;
  provider: QuizProvider;
  limits?: GenerationLimits;
}

export function createQuizGenerator({
  environment,
  provider,
  limits = DEFAULT_LIMITS,
}: CreateQuizGeneratorOptions): QuizGenerator {
  return {
    async generate(topic: SupportedTopic, options: QuizGeneratorOptions = {}): Promise<QuizResponse> {
      const controller = new AbortController();
      const abortFromCaller = () => controller.abort();
      options.signal?.addEventListener('abort', abortFromCaller, { once: true });
      const deadline = setTimeout(() => controller.abort(), limits.routeDeadlineMs);
      let repairFailures: string[] = [];

      try {
        for (let attempt = 0; attempt < limits.maxProviderAttempts; attempt += 1) {
          try {
            const raw = await provider.generate({
              topic,
              model: environment.googleModel,
              prompt: composeQuizPrompt(topic, repairFailures),
              signal: controller.signal,
            });
            const validated = validateGeneratedQuiz(raw, topic);
            return mapToLearnerResponse(validated);
          } catch (error) {
            if (controller.signal.aborted) {
              throw new OperationalError('timeout', { status: 504, cause: error });
            }
            if (error instanceof QuizValidationError) {
              if (attempt + 1 >= limits.maxProviderAttempts) {
                throw new OperationalError('invalid_response', { cause: error });
              }
              repairFailures = error.failures;
            } else {
              const operationalError =
                error instanceof OperationalError ? error : providerError(error);
              if (attempt + 1 >= limits.maxProviderAttempts || !operationalError.retryable) {
                throw operationalError;
              }
            }
            await waitForRetry(
              getRetryDelay(
                attempt,
                limits.retryBaseDelayMs,
                limits.retryMaxDelayMs,
              ),
              controller.signal,
            );
          }
        }
        throw new OperationalError('invalid_response');
      } finally {
        clearTimeout(deadline);
        options.signal?.removeEventListener('abort', abortFromCaller);
      }
    },
  };
}

export type { CreateQuizGeneratorOptions };
