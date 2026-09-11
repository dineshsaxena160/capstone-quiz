import 'dotenv/config';
import { loadEnvironment } from '../config/env.js';
import { createProvider } from './createProvider.js';
import { composeQuizPrompt } from '../quiz/prompt.js';

const environment = loadEnvironment(process.env);
const provider = createProvider(environment);

try {
  await provider.generate({
    topic: 'JavaScript',
    model: environment.googleModel,
    prompt: composeQuizPrompt('JavaScript'),
    signal: AbortSignal.timeout(20_000),
  });
  console.log(`Provider smoke test succeeded for configured model ${environment.googleModel}.`);
} catch (error) {
  const message = error instanceof Error ? error.message : 'unknown provider failure';
  console.error(`Provider smoke test failed: ${message}`);
  process.exitCode = 1;
}
