import { describe, expect, it } from 'vitest';
import { composeQuizPrompt, SYSTEM_INSTRUCTION } from '../../src/quiz/prompt.js';

describe('quiz prompt composition', () => {
  it('keeps the system instruction stable while adding only the allowlisted topic', () => {
    const prompt = composeQuizPrompt('JavaScript');

    expect(SYSTEM_INSTRUCTION).toContain('exactly ten distinct');
    expect(prompt).toContain(SYSTEM_INSTRUCTION);
    expect(prompt).toContain('Topic: JavaScript.');
    expect(prompt).toContain('four beginner, four intermediate, and two advanced');
    expect(prompt).not.toContain('chain-of-thought');
  });

  it('categorizes repair failures without including a provider payload', () => {
    const prompt = composeQuizPrompt('SQL', ['duplicate_prompt', 'option_count']);

    expect(prompt).toContain('duplicate_prompt, option_count');
    expect(prompt).not.toContain('{"');
  });
});
