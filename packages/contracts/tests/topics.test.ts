import { describe, expect, it } from 'vitest';
import {
  QUIZ_DISTRIBUTION,
  QUIZ_LENGTH,
  SUPPORTED_TOPICS,
  isSupportedTopic,
} from '../src/topics.js';

describe('supported topics', () => {
  it('contains exactly the nine product topics in their public order', () => {
    expect(SUPPORTED_TOPICS).toEqual([
      'C#',
      '.NET Core',
      'SQL',
      'PostgreSQL',
      'Azure',
      'AWS',
      'JavaScript',
      'Generative AI',
      'OOPS',
    ]);
    expect(SUPPORTED_TOPICS).toHaveLength(9);
  });

  it('accepts only allowlisted topic values', () => {
    expect(isSupportedTopic('JavaScript')).toBe(true);
    expect(isSupportedTopic('javascript')).toBe(false);
    expect(isSupportedTopic(['JavaScript'])).toBe(false);
    expect(isSupportedTopic(undefined)).toBe(false);
  });

  it('defines the required ten-question internal distribution', () => {
    expect(QUIZ_LENGTH).toBe(10);
    expect(QUIZ_DISTRIBUTION).toEqual({ beginner: 4, intermediate: 4, advanced: 2 });
    expect(Object.values(QUIZ_DISTRIBUTION).reduce((sum, count) => sum + count, 0)).toBe(
      QUIZ_LENGTH,
    );
  });
});
