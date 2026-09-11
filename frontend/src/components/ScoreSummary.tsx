import type { SupportedTopic } from '@quiz/contracts';

interface ScoreSummaryProps {
  topic: SupportedTopic;
  correctAnswers: number;
  incorrectAnswers: number;
  percentage: number;
}

export function ScoreSummary({ topic, correctAnswers, incorrectAnswers, percentage }: ScoreSummaryProps) {
  return (
    <div className="score-summary">
      <p className="eyebrow">{topic}</p>
      <h1>Your result</h1>
      <div className="score-number" aria-label={`Score ${correctAnswers} out of 10`}>
        {correctAnswers} <span>/ 10</span>
      </div>
      <dl className="metrics-grid">
        <div>
          <dt>Percentage</dt>
          <dd>{percentage}%</dd>
        </div>
        <div>
          <dt>Correct</dt>
          <dd>{correctAnswers}</dd>
        </div>
        <div>
          <dt>Incorrect</dt>
          <dd>{incorrectAnswers}</dd>
        </div>
      </dl>
    </div>
  );
}