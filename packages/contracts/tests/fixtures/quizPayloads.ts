import type { GeneratedQuestion, ProviderQuiz, QuizResponse } from '../../src/quiz.js';
import type { SupportedTopic } from '../../src/topics.js';

const difficulties = [
  'beginner',
  'beginner',
  'beginner',
  'beginner',
  'intermediate',
  'intermediate',
  'intermediate',
  'intermediate',
  'advanced',
  'advanced',
] as const;

const types = [
  'multiple_choice',
  'true_false',
  'code_snippet',
  'multiple_choice',
  'multiple_choice',
  'true_false',
  'code_snippet',
  'multiple_choice',
  'multiple_choice',
  'multiple_choice',
] as const;

export function createGeneratedQuestion(
  index: number,
  difficulty = difficulties[index % difficulties.length] ?? 'beginner',
  type = types[index % types.length] ?? 'multiple_choice',
): GeneratedQuestion {
  const options =
    type === 'true_false'
      ? [
          { id: `question-${index + 1}-true`, text: 'True' },
          { id: `question-${index + 1}-false`, text: 'False' },
        ]
      : [
          { id: `question-${index + 1}-a`, text: `Answer A for question ${index + 1}` },
          { id: `question-${index + 1}-b`, text: `Answer B for question ${index + 1}` },
          { id: `question-${index + 1}-c`, text: `Answer C for question ${index + 1}` },
          { id: `question-${index + 1}-d`, text: `Answer D for question ${index + 1}` },
        ];

  return {
    id: `provider-question-${index + 1}`,
    difficulty,
    type,
    prompt: `What is the best answer to technical question ${index + 1}?`,
    ...(type === 'code_snippet' ? { code: `const value${index + 1} = ${index + 1};` } : {}),
    options,
    correctOptionId: options[0]?.id ?? '',
    explanation: `The first option is the correct answer for question ${index + 1}.`,
  };
}

export function createProviderQuiz(topic: SupportedTopic = 'JavaScript'): ProviderQuiz {
  return {
    topic,
    questions: Array.from({ length: 10 }, (_, index) => createGeneratedQuestion(index)),
  };
}

export function createLearnerResponse(topic: SupportedTopic = 'JavaScript'): QuizResponse {
  const providerQuiz = createProviderQuiz(topic);
  return {
    topic,
    questions: providerQuiz.questions.map((question) => {
      const { difficulty, ...learnerQuestion } = question;
      void difficulty;
      return learnerQuestion;
    }),
  };
}