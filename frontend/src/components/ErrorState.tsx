import type { AppError } from '../services/errors.js';

interface ErrorStateProps {
  error: AppError;
  onTryAgain: () => void;
  onChooseTopic: () => void;
}

export function ErrorState({ error, onTryAgain, onChooseTopic }: ErrorStateProps) {
  return (
    <section className="screen centered-screen error-screen" aria-labelledby="error-heading">
      <p className="eyebrow">Quiz unavailable</p>
      <h1 id="error-heading">We could not build that quiz.</h1>
      <p className="intro" role="alert" aria-live="assertive">
        {error.message}
      </p>
      <div className="action-row">
        {error.retryable ? (
          <button className="primary-button" type="button" onClick={onTryAgain}>
            Try Again
          </button>
        ) : null}
        <button className="secondary-button" type="button" onClick={onChooseTopic}>
          Choose New Topic
        </button>
      </div>
    </section>
  );
}