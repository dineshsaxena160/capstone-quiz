import { useReducer, useRef } from 'react';
import type { SupportedTopic } from '@quiz/contracts';
import { appReducer } from './app/reducer.js';
import { initialState } from './app/state.js';
import { ErrorPage } from './pages/ErrorPage.js';
import { GeneratingPage } from './pages/GeneratingPage.js';
import { QuizPage } from './pages/QuizPage.js';
import { ResultsPage } from './pages/ResultsPage.js';
import { TopicSelectionPage } from './pages/TopicSelectionPage.js';
import { loadFrontendEnvironment } from './config/env.js';
import { mapTransportError } from './services/errors.js';
import { generateQuiz } from './services/quizApi.js';

const environment = loadFrontendEnvironment();

export function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const activeRequest = useRef<{ requestId: string; controller: AbortController } | null>(null);

  const cancelActiveRequest = () => {
    activeRequest.current?.controller.abort();
    activeRequest.current = null;
  };

  const requestQuiz = (topic: SupportedTopic, requestId: string, controller: AbortController) => {
    void generateQuiz(topic, {
      baseUrl: environment.apiBaseUrl,
      signal: controller.signal,
    })
      .then((response) => {
        dispatch({ type: 'generation_succeeded', requestId, response });
      })
      .catch((error: unknown) => {
        dispatch({ type: 'generation_failed', requestId, error: mapTransportError(error) });
      })
      .finally(() => {
        if (activeRequest.current?.requestId === requestId) activeRequest.current = null;
      });
  };

  const startGeneration = (topic: SupportedTopic) => {
    cancelActiveRequest();
    const requestId = crypto.randomUUID();
    const controller = new AbortController();
    activeRequest.current = { requestId, controller };
    dispatch({ type: 'start_generation', topic, requestId });
    requestQuiz(topic, requestId, controller);
  };

  const retryGeneration = () => {
    if (state.status !== 'error' || state.topic === null) return;
    cancelActiveRequest();
    const requestId = crypto.randomUUID();
    const controller = new AbortController();
    activeRequest.current = { requestId, controller };
    dispatch({ type: 'retry_generation', requestId });
    requestQuiz(state.topic, requestId, controller);
  };

  const chooseNewTopic = () => {
    cancelActiveRequest();
    dispatch({ type: 'choose_new_topic' });
  };

  let content;
  switch (state.status) {
    case 'topic_selection':
      content = (
        <TopicSelectionPage
          selectedTopic={state.selectedTopic}
          onSelectTopic={(topic) => dispatch({ type: 'select_topic', topic })}
          onStart={startGeneration}
        />
      );
      break;
    case 'generating':
      content = <GeneratingPage topic={state.topic} />;
      break;
    case 'quiz':
      content = (
        <QuizPage
          session={state.session}
          onAnswer={(optionId) => dispatch({ type: 'select_answer', questionId: state.session.questions[state.session.currentIndex]!.id, optionId })}
          onBack={() => dispatch({ type: 'back' })}
          onNext={() => dispatch({ type: 'next' })}
          onSkip={() => dispatch({ type: 'skip' })}
          onSubmit={() => dispatch({ type: 'submit' })}
        />
      );
      break;
    case 'results':
      content = <ResultsPage result={state.result} onChooseNewTopic={chooseNewTopic} />;
      break;
    case 'error':
      content = (
        <ErrorPage
          topic={state.topic}
          error={state.error}
          onTryAgain={retryGeneration}
          onChooseTopic={chooseNewTopic}
        />
      );
      break;
  }

  return (
    <div className="app-shell min-h-screen">
      <div className="app-frame">
        <aside className="brand-rail" aria-label="Signal Quiz">
          <div>
            <p className="eyebrow">Technical practice</p>
            <h2>Signal<br />Quiz</h2>
            <p>Ten thoughtful questions. One clear read on what you know.</p>
          </div>
          <p className="rail-note">A temporary session for the tab you are in. No account, no history.</p>
        </aside>
        <main id="main-content">{content}</main>
      </div>
    </div>
  );
}