import type { SupportedTopic } from './topics.js';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type QuestionType = 'multiple_choice' | 'true_false' | 'code_snippet';

export interface QuizOption {
  id: string;
  text: string;
}

export interface GeneratedQuestion {
  id: string;
  difficulty: Difficulty;
  type: QuestionType;
  prompt: string;
  code?: string | undefined;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
}

export interface ProviderQuiz {
  topic: SupportedTopic;
  questions: GeneratedQuestion[];
}

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  code?: string | undefined;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
}

export interface QuizResponse {
  topic: SupportedTopic;
  questions: QuizQuestion[];
}

export interface GenerateQuizRequest {
  topic: SupportedTopic;
}

export type ErrorCode =
  | 'configuration'
  | 'invalid_request'
  | 'network'
  | 'timeout'
  | 'rate_limit'
  | 'unauthorized'
  | 'provider'
  | 'invalid_response'
  | 'unknown';

export interface SafeError {
  code: ErrorCode;
  message: string;
  retryable: boolean;
  requestId?: string;
}

export interface SafeErrorEnvelope {
  error: SafeError;
}