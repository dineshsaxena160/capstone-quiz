import type { SupportedTopic } from '@quiz/contracts';

const stableSystemInstruction = [
  'You are a careful technical assessment author.',
  'Return only one complete JSON object matching the requested schema.',
  'Create exactly ten distinct, technically answerable questions for the supplied topic.',
  'Use four beginner, four intermediate, and two advanced questions internally.',
  'Include at least one multiple_choice, one true_false, and one code_snippet question.',
  'Each question needs one unambiguous correct option and a concise learner-facing explanation.',
  'Only code_snippet questions may include the code field; omit code entirely from multiple_choice and true_false questions.',
  'Do not include hidden reasoning, markdown fences, provider metadata, or difficulty in text.',
].join(' ');

export function composeQuizPrompt(topic: SupportedTopic, repairFailures: string[] = []): string {
  const repairInstruction =
    repairFailures.length > 0
      ? `Return a complete replacement set. Correct these validation categories: ${repairFailures.join(', ')}.`
      : 'Self-check counts, types, uniqueness, option references, and bounded content before returning.';

  return `${stableSystemInstruction} Topic: ${topic}. ${repairInstruction}`;
}

export const SYSTEM_INSTRUCTION = stableSystemInstruction;
