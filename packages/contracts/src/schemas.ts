import { z } from 'zod';
import { QUIZ_DISTRIBUTION, QUIZ_LENGTH, SUPPORTED_TOPICS } from './topics.js';

export const supportedTopicSchema = z.enum(SUPPORTED_TOPICS);
export const difficultySchema = z.enum(['beginner', 'intermediate', 'advanced']);
export const questionTypeSchema = z.enum(['multiple_choice', 'true_false', 'code_snippet']);

const optionSchema = z
  .object({
    id: z.string().trim().min(1).max(80),
    text: z.string().trim().min(1).max(240),
  })
  .strict();

const baseQuestionSchema = z
  .object({
    id: z.string().trim().min(1).max(100),
    type: questionTypeSchema,
    prompt: z.string().trim().min(1).max(500),
    code: z.string().max(4000).optional(),
    options: z.array(optionSchema),
    correctOptionId: z.string().trim().min(1).max(80),
    explanation: z.string().trim().min(1).max(800),
  })
  .strict();

export const generatedQuestionSchema = baseQuestionSchema
  .extend({ difficulty: difficultySchema })
  .strict();

export const providerQuizSchema = z
  .object({
    topic: supportedTopicSchema,
    questions: z.array(generatedQuestionSchema).length(QUIZ_LENGTH),
  })
  .strict();

export const learnerQuestionSchema = baseQuestionSchema.superRefine((question, context) => {
  const optionIds = question.options.map((option) => option.id);
  if (new Set(optionIds).size !== optionIds.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Option IDs must be unique.' });
  }

  const expectedOptionCount = question.type === 'true_false' ? 2 : 4;
  if (question.options.length !== expectedOptionCount) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Question type ${question.type} requires ${expectedOptionCount} options.`,
    });
  }

  if (!optionIds.includes(question.correctOptionId)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'The correct option must reference an option in the same question.',
    });
  }

  if (question.type === 'true_false') {
    const optionTexts = question.options.map((option) => option.text).sort();
    if (optionTexts[0] !== 'False' || optionTexts[1] !== 'True') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'True/false questions must use exactly True and False options.',
      });
    }
  }

  if (question.type === 'code_snippet' && !question.code?.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Code snippet questions require code.',
    });
  }

  if (question.type !== 'code_snippet' && question.code !== undefined) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Only code snippet questions may include code.',
    });
  }
});

export const learnerQuizResponseSchema = z
  .object({
    topic: supportedTopicSchema,
    questions: z.array(learnerQuestionSchema).length(QUIZ_LENGTH),
  })
  .strict()
  .superRefine((quiz, context) => {
    const normalizedPrompts = quiz.questions.map((question) =>
      question.prompt.trim().toLocaleLowerCase().replace(/\s+/g, ' '),
    );
    if (new Set(normalizedPrompts).size !== normalizedPrompts.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Question prompts must be unique.' });
    }

    const types = new Set(quiz.questions.map((question) => question.type));
    for (const requiredType of ['multiple_choice', 'true_false', 'code_snippet'] as const) {
      if (!types.has(requiredType)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Quiz must include a ${requiredType} question.`,
        });
      }
    }
  });

export const generateQuizRequestSchema = z
  .object({ topic: supportedTopicSchema })
  .strict();

export const errorCodeSchema = z.enum([
  'configuration',
  'invalid_request',
  'network',
  'timeout',
  'rate_limit',
  'unauthorized',
  'provider',
  'invalid_response',
  'unknown',
]);

export const safeErrorSchema = z
  .object({
    code: errorCodeSchema,
    message: z.string().trim().min(1).max(240),
    retryable: z.boolean(),
    requestId: z.string().trim().min(1).max(100).optional(),
  })
  .strict();

export const safeErrorEnvelopeSchema = z.object({ error: safeErrorSchema }).strict();

export const quizDistributionSchema = z.object({
  beginner: z.literal(QUIZ_DISTRIBUTION.beginner),
  intermediate: z.literal(QUIZ_DISTRIBUTION.intermediate),
  advanced: z.literal(QUIZ_DISTRIBUTION.advanced),
});

export type GenerateQuizRequestInput = z.infer<typeof generateQuizRequestSchema>;
export type LearnerQuizResponseInput = z.infer<typeof learnerQuizResponseSchema>;
