import { getUnresolvedIndices, isValidOptionId } from '../domain/answers.js';
import { getNextIndex, getNextUnresolvedIndex, getPreviousIndex } from '../domain/navigation.js';
import { buildResult } from '../domain/scoring.js';
import { prepareSession } from '../domain/shuffle.js';
import { initialState, type AppAction, type AppState } from './state.js';

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'select_topic':
      return state.status === 'topic_selection'
        ? { status: 'topic_selection', selectedTopic: action.topic }
        : state;
    case 'start_generation':
      return { status: 'generating', topic: action.topic, requestId: action.requestId };
    case 'generation_succeeded':
      if (state.status !== 'generating' || state.requestId !== action.requestId) return state;
      return { status: 'quiz', session: prepareSession(action.response) };
    case 'generation_failed':
      if (state.status !== 'generating' || state.requestId !== action.requestId) return state;
      return { status: 'error', topic: state.topic, error: action.error };
    case 'choose_new_topic':
      return initialState;
    case 'retry_generation':
      return state.status === 'error' && state.topic !== null
        ? { status: 'generating', topic: state.topic, requestId: action.requestId }
        : state;
    case 'select_answer':
      if (state.status !== 'quiz') return state;
      {
        const question = state.session.questions[state.session.currentIndex];
        if (
          !question ||
          question.id !== action.questionId ||
          !isValidOptionId(question, action.optionId)
        ) {
          return state;
        }
        return {
          status: 'quiz',
          session: {
            ...state.session,
            answers: { ...state.session.answers, [question.id]: action.optionId },
          },
        };
      }
    case 'next':
      if (state.status !== 'quiz') return state;
      {
        const question = state.session.questions[state.session.currentIndex];
        if (!question || !isValidOptionId(question, state.session.answers[question.id])) return state;
        return {
          status: 'quiz',
          session: {
            ...state.session,
            currentIndex: getNextIndex(state.session.currentIndex, state.session.questions.length),
          },
        };
      }
    case 'back':
      return state.status === 'quiz'
        ? {
            status: 'quiz',
            session: {
              ...state.session,
              currentIndex: getPreviousIndex(state.session.currentIndex),
            },
          }
        : state;
    case 'skip':
      if (state.status !== 'quiz') return state;
      {
        const question = state.session.questions[state.session.currentIndex];
        if (!question) return state;
        const answers = { ...state.session.answers };
        delete answers[question.id];
        return {
          status: 'quiz',
          session: {
            ...state.session,
            answers,
            currentIndex: getNextUnresolvedIndex(
              state.session.questions,
              answers,
              state.session.currentIndex,
            ),
          },
        };
      }
    case 'submit':
      if (state.status !== 'quiz') return state;
      {
        const unresolved = getUnresolvedIndices(state.session.questions, state.session.answers);
        if (unresolved.length > 0) {
          return {
            status: 'quiz',
            session: { ...state.session, currentIndex: unresolved[0]! },
          };
        }
        const answers = Object.fromEntries(
          state.session.questions.map((question) => [question.id, state.session.answers[question.id]!]),
        );
        return { status: 'results', result: buildResult(state.session, answers) };
      }
    default:
      return state;
  }
}
