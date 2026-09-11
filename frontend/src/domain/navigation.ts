import type { QuizQuestion } from '@quiz/contracts';
import { getUnresolvedIndices } from './answers.js';

export function getNextIndex(currentIndex: number, questionCount: number): number {
  return Math.min(currentIndex + 1, Math.max(questionCount - 1, 0));
}

export function getPreviousIndex(currentIndex: number): number {
  return Math.max(currentIndex - 1, 0);
}

export function getNextUnresolvedIndex(
  questions: readonly QuizQuestion[],
  answers: Record<string, string | undefined>,
  currentIndex: number,
): number {
  const unresolved = getUnresolvedIndices(questions, answers);
  if (unresolved.length === 0) return getNextIndex(currentIndex, questions.length);

  const afterCurrent = unresolved.find((index) => index > currentIndex);
  return afterCurrent ?? unresolved[0]!;
}
