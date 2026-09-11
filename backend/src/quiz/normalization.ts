import type { ProviderQuiz, QuizResponse } from '@quiz/contracts';

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function normalizedPromptFingerprint(prompt: string): string {
  return normalizeText(prompt).toLocaleLowerCase();
}

export function mapToLearnerResponse(quiz: ProviderQuiz): QuizResponse {
  return {
    topic: quiz.topic,
    questions: quiz.questions.map((question, questionIndex) => {
      const optionIdMap = new Map(
        question.options.map((option, optionIndex) => [
          option.id,
          `question-${questionIndex + 1}-option-${optionIndex + 1}`,
        ]),
      );
      const correctOptionId = optionIdMap.get(question.correctOptionId);
      if (!correctOptionId) {
        throw new Error('Validated question answer reference was not found.');
      }

      const normalizedQuestion = {
        id: `question-${questionIndex + 1}`,
        type: question.type,
        prompt: normalizeText(question.prompt),
        options: question.options.map((option, optionIndex) => ({
          id: optionIdMap.get(option.id) ?? `question-${questionIndex + 1}-option-${optionIndex + 1}`,
          text: normalizeText(option.text),
        })),
        correctOptionId,
        explanation: normalizeText(question.explanation),
      };

      return question.code === undefined
        ? normalizedQuestion
        : { ...normalizedQuestion, code: question.code.trim() };
    }),
  };
}
