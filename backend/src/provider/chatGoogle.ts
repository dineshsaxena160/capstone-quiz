import type { Environment } from '../config/env.js';
import { OperationalError, providerError } from '../api/errors.js';
import type { QuizProvider } from './types.js';

export function createChatGoogleProvider(environment: Environment): QuizProvider {
  return {
    async generate(request) {
      if (!environment.googleApiKey) {
        throw new OperationalError('configuration', { status: 503, retryable: false });
      }

      try {
        const { ChatGoogle } = await import('@langchain/google/node');
        const { providerQuizSchema } = await import('@quiz/contracts');
        const model = new ChatGoogle({
          apiKey: environment.googleApiKey,
          model: request.model,
          maxOutputTokens: 8192,
          thinkingBudget: 0,
        });
        const structuredModel = model.withStructuredOutput(providerQuizSchema, {
          method: 'jsonSchema',
        });
        return await structuredModel.invoke(
          [
            { role: 'system', content: 'Return one complete structured quiz object. Do not include commentary.' },
            { role: 'user', content: request.prompt },
          ],
          { signal: request.signal },
        );
      } catch (error) {
        if (error instanceof OperationalError) throw error;
        throw providerError(error);
      }
    },
  };
}
