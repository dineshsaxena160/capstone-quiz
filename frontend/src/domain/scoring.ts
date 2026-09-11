import type { QuizResult, QuizSession } from '../app/state.js';

export function buildResult(
  session: QuizSession,
  answers: Record<string, string>,
): QuizResult {
  const correctAnswers = session.questions.reduce(
    (count, question) => count + (answers[question.id] === question.correctOptionId ? 1 : 0),
    0,
  );
  const questions = [...session.questions];
  const stableAnswers = { ...answers };
  return {
    topic: session.topic,
    questions,
    answers: stableAnswers,
    correctAnswers,
    incorrectAnswers: session.questions.length - correctAnswers,
    percentage: Math.min(100, Math.max(0, (correctAnswers / session.questions.length) * 100)),
  };
}
