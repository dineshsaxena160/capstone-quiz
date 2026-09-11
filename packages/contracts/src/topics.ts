export const SUPPORTED_TOPICS = [
  'C#',
  '.NET Core',
  'SQL',
  'PostgreSQL',
  'Azure',
  'AWS',
  'JavaScript',
  'Generative AI',
  'OOPS',
] as const;

export type SupportedTopic = (typeof SUPPORTED_TOPICS)[number];

export const QUIZ_LENGTH = 10 as const;

export const QUIZ_DISTRIBUTION = {
  beginner: 4,
  intermediate: 4,
  advanced: 2,
} as const;

export function isSupportedTopic(value: unknown): value is SupportedTopic {
  return (
    typeof value === 'string' &&
    (SUPPORTED_TOPICS as readonly string[]).includes(value)
  );
}
