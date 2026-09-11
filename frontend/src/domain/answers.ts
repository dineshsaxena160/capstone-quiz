import type { QuizQuestion } from '@quiz/contracts';

export function isValidOptionId(question: QuizQuestion, optionId: string | undefined): boolean {
  return optionId !== undefined && question.options.some((option) => option.id === optionId);
}

export function getAnsweredCount(
  questions: readonly QuizQuestion[],
  answers: Record<string, string | undefined>,
): number {
  return questions.reduce(
    (count, question) => count + (isValidOptionId(question, answers[question.id]) ? 1 : 0),
    0,
  );
}

export function getUnresolvedIndices(
  questions: readonly QuizQuestion[],
  answers: Record<string, string | undefined>,
): number[] {
  return questions.reduce<number[]>((indices, question, index) => {
    if (!isValidOptionId(question, answers[question.id])) indices.push(index);
    return indices;
  }, []);
}
