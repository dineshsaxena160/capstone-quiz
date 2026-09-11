import 'dotenv/config';
import { OperationalError } from '../api/errors.js';
import { loadEnvironment } from '../config/env.js';
import { DEFAULT_LIMITS } from '../config/limits.js';
import { createProvider } from './createProvider.js';
import { composeQuizPrompt } from '../quiz/prompt.js';

const environment = loadEnvironment(process.env);
const provider = createProvider(environment);

try {
  await provider.generate({
    topic: 'JavaScript',
    model: environment.googleModel,
    prompt: composeQuizPrompt('JavaScript'),
    signal: AbortSignal.timeout(DEFAULT_LIMITS.routeDeadlineMs),
  });
  console.log(`Provider smoke test succeeded for configured model ${environment.googleModel}.`);
} catch (error) {
  const message = error instanceof Error ? error.message : 'unknown provider failure';
  const code = error instanceof OperationalError ? error.code : 'unknown';
  console.error(`Provider smoke test failed [${code}]: ${message}`);
  process.exitCode = 1;
}