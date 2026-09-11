import type { SupportedTopic } from '@quiz/contracts';

export interface ProviderRequest {
  topic: SupportedTopic;
  model: string;
  prompt: string;
  signal: AbortSignal;
}

export interface QuizProvider {
  generate(request: ProviderRequest): Promise<unknown>;
}