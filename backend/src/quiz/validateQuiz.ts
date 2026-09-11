import {
  providerQuizSchema,
  type Difficulty,
  type ProviderQuiz,
  type QuestionType,
  QUIZ_DISTRIBUTION,
} from '@quiz/contracts';
import { normalizedPromptFingerprint } from './normalization.js';

export class QuizValidationError extends Error {
  public readonly failures: string[];

  constructor(failures: string[]) {
    super('The generated quiz did not pass complete-set validation.');
    this.name = 'QuizValidationError';
    this.failures = failures;
  }
}

export function validateGeneratedQuiz(raw: unknown, expectedTopic: ProviderQuiz['topic']): ProviderQuiz {
  const parsed = providerQuizSchema.safeParse(raw);
  if (!parsed.success) {
    throw new QuizValidationError(['schema']);
  }

  const quiz = parsed.data;
  const failures: string[] = [];
  if (quiz.topic !== expectedTopic) failures.push('topic');

  const difficultyCounts: Record<Difficulty, number> = {
    beginner: 0,
    intermediate: 0,
    advanced: 0,
  };
  const questionIds = new Set<string>();
  const promptFingerprints = new Set<string>();
  const presentTypes = new Set<QuestionType>();

  for (const question of quiz.questions) {
    difficultyCounts[question.difficulty] += 1;
    presentTypes.add(question.type);
    if (questionIds.has(question.id)) failures.push('duplicate_question_id');
    questionIds.add(question.id);

    const fingerprint = normalizedPromptFingerprint(question.prompt);
    if (promptFingerprints.has(fingerprint)) failures.push('duplicate_prompt');
    promptFingerprints.add(fingerprint);

    const expectedOptions = question.type === 'true_false' ? 2 : 4;
    if (question.options.length !== expectedOptions) failures.push('option_count');
    if (new Set(question.options.map((option) => option.id)).size !== question.options.length) {
      failures.push('duplicate_option_id');
    }
    if (!question.options.some((option) => option.id === question.correctOptionId)) {
      failures.push('correct_option_reference');
    }
    if (question.type === 'true_false') {
      const optionTexts = question.options.map((option) => option.text).sort();
      if (optionTexts[0] !== 'False' || optionTexts[1] !== 'True') failures.push('true_false_options');
    }
    if (question.type === 'code_snippet' && !question.code?.trim()) failures.push('missing_code');
    if (question.type !== 'code_snippet' && question.code !== undefined) failures.push('unexpected_code');
  }

  for (const [difficulty, expectedCount] of Object.entries(QUIZ_DISTRIBUTION) as Array<[
    Difficulty,
    number,
  ]>) {
    if (difficultyCounts[difficulty] !== expectedCount) failures.push(`${difficulty}_count`);
  }
  for (const requiredType of ['multiple_choice', 'true_false', 'code_snippet'] as const) {
    if (!presentTypes.has(requiredType)) failures.push(`${requiredType}_missing`);
  }

  if (failures.length > 0) {
    throw new QuizValidationError([...new Set(failures)]);
  }
  return quiz;
}