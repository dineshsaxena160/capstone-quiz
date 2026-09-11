import type { AppError } from '../services/errors.js';
import type { SupportedTopic } from '@quiz/contracts';
import { ErrorState } from '../components/ErrorState.js';

interface ErrorPageProps {
  topic: SupportedTopic | null;
  error: AppError;
  onTryAgain: () => void;
  onChooseTopic: () => void;
}

export function ErrorPage({ topic: _topic, error, onTryAgain, onChooseTopic }: ErrorPageProps) {
  return <ErrorState error={error} onTryAgain={onTryAgain} onChooseTopic={onChooseTopic} />;
}