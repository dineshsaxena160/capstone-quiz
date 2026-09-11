import type { QuizOption, QuizResponse } from '@quiz/contracts';
import type { QuizSession } from '../app/state.js';

export type RandomSource = () => number;

export function shuffleOptions<T>(items: readonly T[], random: RandomSource = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex]!, result[index]!];
  }
  return result;
}

export function prepareSession(
  response: QuizResponse,
  random: RandomSource = Math.random,
): QuizSession {
  return {
    topic: response.topic,
    questions: response.questions.map((question) => ({
      ...question,
      options: shuffleOptions<QuizOption>(question.options, random),
    })),
    currentIndex: 0,
    answers: {},
  };
}