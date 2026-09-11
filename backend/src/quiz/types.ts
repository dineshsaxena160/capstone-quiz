import type { QuizResponse, SupportedTopic } from '@quiz/contracts';

export interface QuizGeneratorOptions {
  signal?: AbortSignal;
  requestId?: string;
}

export interface QuizGenerator {
  generate(topic: SupportedTopic, options?: QuizGeneratorOptions): Promise<QuizResponse>;
}