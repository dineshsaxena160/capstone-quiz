import type { Environment } from '../config/env.js';
import type { QuizProvider } from './types.js';
import { createChatGoogleProvider } from './chatGoogle.js';

export function createProvider(environment: Environment): QuizProvider {
  return createChatGoogleProvider(environment);
}