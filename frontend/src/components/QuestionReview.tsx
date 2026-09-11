import type { QuizQuestion } from '@quiz/contracts';
import { CodeBlock } from './CodeBlock.js';

interface QuestionReviewProps {
  question: QuizQuestion;
  learnerAnswerId: string;
  index: number;
}

export function QuestionReview({ question, learnerAnswerId, index }: QuestionReviewProps) {
  const learnerAnswer = question.options.find((option) => option.id === learnerAnswerId);
  const correctAnswer = question.options.find((option) => option.id === question.correctOptionId);
  const isCorrect = learnerAnswerId === question.correctOptionId;

  return (
    <article className={`review-entry ${isCorrect ? 'is-correct' : 'is-incorrect'}`}>
      <div className="review-heading">
        <span>Question {index + 1}</span>
        <strong>{isCorrect ? 'Correct' : 'Incorrect'}</strong>
      </div>
      <h2>{question.prompt}</h2>
      {question.code ? <CodeBlock code={question.code} /> : null}
      <dl className="review-details">
        <div>
          <dt>Your answer</dt>
          <dd>{learnerAnswer?.text ?? 'No answer'}</dd>
        </div>
        <div>
          <dt>Correct answer</dt>
          <dd>{correctAnswer?.text ?? 'Unavailable'}</dd>
        </div>
        <div>
          <dt>Why</dt>
          <dd>{question.explanation}</dd>
        </div>
      </dl>
    </article>
  );
}
