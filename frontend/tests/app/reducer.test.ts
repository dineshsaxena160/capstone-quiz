import { describe, expect, it } from 'vitest';
import { createLearnerResponse } from '@quiz/contracts';
import { appReducer } from '../../src/app/reducer.js';
import { initialState } from '../../src/app/state.js';

function loadedQuizState() {
  const generating = appReducer(initialState, {
    type: 'start_generation',
    topic: 'JavaScript',
    requestId: 'request-1',
  });
  return appReducer(generating, {
    type: 'generation_succeeded',
    requestId: 'request-1',
    response: createLearnerResponse(),
  });
}

describe('application reducer', () => {
  it('ignores a stale generation response and initializes one shuffled session for the current request', () => {
    const generating = appReducer(initialState, {
      type: 'start_generation',
      topic: 'JavaScript',
      requestId: 'request-1',
    });
    const stale = appReducer(generating, {
      type: 'generation_succeeded',
      requestId: 'old-request',
      response: createLearnerResponse(),
    });

    expect(stale).toBe(generating);
    const loaded = appReducer(generating, {
      type: 'generation_succeeded',
      requestId: 'request-1',
      response: createLearnerResponse(),
    });
    expect(loaded.status).toBe('quiz');
    if (loaded.status === 'quiz') {
      expect(loaded.session.questions).toHaveLength(10);
      expect(loaded.session.currentIndex).toBe(0);
    }
  });

  it('preserves and replaces option-ID answers while navigating', () => {
    const loaded = loadedQuizState();
    if (loaded.status !== 'quiz') throw new Error('Expected quiz state');
    const question = loaded.session.questions[0]!;
    const optionId = question.options[0]!.id;
    const answered = appReducer(loaded, {
      type: 'select_answer',
      questionId: question.id,
      optionId,
    });
    const next = appReducer(answered, { type: 'next' });
    const back = appReducer(next, { type: 'back' });

    expect(back.status).toBe('quiz');
    if (back.status === 'quiz') {
      expect(back.session.currentIndex).toBe(0);
      expect(back.session.answers[question.id]).toBe(optionId);
    }
  });

  it('leaves skipped questions unresolved and wraps to the next unresolved item', () => {
    const loaded = loadedQuizState();
    if (loaded.status !== 'quiz') throw new Error('Expected quiz state');
    const skipped = appReducer(loaded, { type: 'skip' });

    expect(skipped.status).toBe('quiz');
    if (skipped.status === 'quiz') {
      expect(skipped.session.answers[skipped.session.questions[0]!.id]).toBeUndefined();
      expect(skipped.session.currentIndex).toBe(1);
    }
  });

  it('moves to the first unresolved question on blocked submit and creates one result when complete', () => {
    let state = loadedQuizState();
    if (state.status !== 'quiz') throw new Error('Expected quiz state');
    state = appReducer(state, { type: 'submit' });
    expect(state.status).toBe('quiz');
    if (state.status !== 'quiz') throw new Error('Expected blocked quiz state');
    expect(state.session.currentIndex).toBe(0);

    for (const question of state.session.questions) {
      state = appReducer(state, {
        type: 'select_answer',
        questionId: question.id,
        optionId: question.options[0]!.id,
      });
      if (state.status !== 'quiz') throw new Error('Expected quiz state');
      if (question.id !== state.session.questions[state.session.questions.length - 1]!.id) {
        state = appReducer(state, { type: 'next' });
        if (state.status !== 'quiz') throw new Error('Expected quiz state');
      }
    }
    const result = appReducer(state, { type: 'submit' });
    expect(result.status).toBe('results');
    if (result.status === 'results') {
      expect(result.result.questions).toHaveLength(10);
      expect(result.result.correctAnswers + result.result.incorrectAnswers).toBe(10);
    }
    expect(appReducer(result, { type: 'submit' })).toBe(result);
  });
});