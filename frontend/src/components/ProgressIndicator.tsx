interface ProgressIndicatorProps {
  currentIndex: number;
  total: number;
  answered: number;
}

export function ProgressIndicator({ currentIndex, total, answered }: ProgressIndicatorProps) {
  return (
    <div className="progress-row" aria-label={`Question ${currentIndex + 1} of ${total}`}>
      <strong>
        Question {currentIndex + 1} of {total}
      </strong>
      <span>{answered} answered</span>
    </div>
  );
}