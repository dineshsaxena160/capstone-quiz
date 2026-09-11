import type { Environment } from '../config/env.js';
import { OperationalError, providerError } from '../api/errors.js';
import type { QuestionType } from '@quiz/contracts';
import type { QuizProvider } from './types.js';

export function createChatGoogleProvider(environment: Environment): QuizProvider {
  return {
    async generate(request) {
      if (!environment.googleApiKey) {
        throw new OperationalError('configuration', { status: 503, retryable: false });
      }

      try {
        const { ChatGoogle } = await import('@langchain/google/node');
        const model = new ChatGoogle({
          apiKey: environment.googleApiKey,
          model: request.model,
          maxOutputTokens: 8192,
          thinkingBudget: 0,
        });
        const response = await model.invoke(
          [
            {
              role: 'system',
              content:
                'Return only one JSON object with exactly these top-level keys: topic and questions. Never wrap it in another object or use a quiz property. Do not include commentary or markdown.',
            },
            { role: 'user', content: request.prompt },
          ],
          { signal: request.signal },
        );
        return parseProviderJson(response.text);
      } catch (error) {
        if (error instanceof OperationalError) throw error;
        throw providerError(error);
      }
    },
  };
}

export function parseProviderJson(text: string): unknown {
  const parsed: unknown = JSON.parse(text);
  const unwrapped =
    isRecord(parsed) && Object.keys(parsed).length === 1 && 'quiz' in parsed ? parsed.quiz : parsed;
  return normalizeGemmaQuiz(unwrapped);
}

function normalizeGemmaQuiz(value: unknown): unknown {
  if (!isRecord(value) || !Array.isArray(value.questions) || !value.questions.every(isGemmaQuestion)) {
    return value;
  }

  return {
    ...value,
    questions: value.questions.map((question, questionIndex) => {
      const options = question.options.map((text, optionIndex) => ({
        id: `gemma-question-${questionIndex + 1}-option-${optionIndex + 1}`,
        text,
      }));
      const correctOption = options.find(
        (option) => option.text.trim() === question.answer.trim(),
      );
      const code = typeof question.code === 'string' && question.code.trim() ? question.code : undefined;
      const type = inferQuestionType(options.map((option) => option.text), code);

      return {
        id: `gemma-question-${questionIndex + 1}`,
        difficulty: difficultyForIndex(questionIndex),
        type,
        prompt: question.question,
        ...(code === undefined ? {} : { code }),
        options,
        correctOptionId: correctOption?.id ?? '',
        explanation: question.explanation,
      };
    }),
  };
}

function isGemmaQuestion(value: unknown): value is {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  code?: unknown;
} {
  return (
    isRecord(value) &&
    typeof value.question === 'string' &&
    Array.isArray(value.options) &&
    value.options.every((option) => typeof option === 'string') &&
    typeof value.answer === 'string' &&
    typeof value.explanation === 'string'
  );
}

function inferQuestionType(optionTexts: string[], code: string | undefined): QuestionType {
  if (code !== undefined) return 'code_snippet';
  const normalizedOptions = optionTexts.map((option) => option.trim()).sort();
  if (normalizedOptions.length === 2 && normalizedOptions[0] === 'False' && normalizedOptions[1] === 'True') {
    return 'true_false';
  }
  return 'multiple_choice';
}

function difficultyForIndex(index: number): 'beginner' | 'intermediate' | 'advanced' {
  if (index < 4) return 'beginner';
  if (index < 8) return 'intermediate';
  return 'advanced';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}