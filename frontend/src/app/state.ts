import type { QuizQuestion, QuizResponse, SupportedTopic } from '@quiz/contracts';
import type { AppError } from '../services/errors.js';

export interface QuizSession {
  topic: SupportedTopic;
  questions: QuizQuestion[];
  currentIndex: number;
  answers: Record<string, string | undefined>;
}

export interface QuizResult {
  topic: SupportedTopic;
  questions: QuizQuestion[];
  answers: Record<string, string>;
  correctAnswers: number;
  incorrectAnswers: number;
  percentage: number;
}

export type AppState =
  | { status: 'topic_selection'; selectedTopic: SupportedTopic | null }
  | { status: 'generating'; topic: SupportedTopic; requestId: string }
  | { status: 'quiz'; session: QuizSession }
  | { status: 'results'; result: QuizResult }
  | { status: 'error'; topic: SupportedTopic | null; error: AppError };

export type AppAction =
  | { type: 'select_topic'; topic: SupportedTopic }
  | { type: 'start_generation'; topic: SupportedTopic; requestId: string }
  | { type: 'generation_succeeded'; requestId: string; response: QuizResponse }
  | { type: 'generation_failed'; requestId: string; error: AppError }
  | { type: 'select_answer'; questionId: string; optionId: string }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'skip' }
  | { type: 'submit' }
  | { type: 'choose_new_topic' }
  | { type: 'retry_generation'; requestId: string };

export const initialState: AppState = {
  status: 'topic_selection',
  selectedTopic: null,
};
