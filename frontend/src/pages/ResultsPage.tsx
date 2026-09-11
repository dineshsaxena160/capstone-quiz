import type { QuizResult } from '../app/state.js';
import { QuestionReview } from '../components/QuestionReview.js';
import { ScoreSummary } from '../components/ScoreSummary.js';

interface ResultsPageProps {
  result: QuizResult;
  onChooseNewTopic: () => void;
}

export function ResultsPage({ result, onChooseNewTopic }: ResultsPageProps) {
  return (
    <section className="screen results-screen" aria-labelledby="results-heading">
      <div id="results-heading">
        <ScoreSummary
          topic={result.topic}
          correctAnswers={result.correctAnswers}
          incorrectAnswers={result.incorrectAnswers}
          percentage={result.percentage}
        />
      </div>
      <div className="review-list">
        {result.questions.map((question, index) => (
          <QuestionReview
            key={question.id}
            question={question}
            learnerAnswerId={result.answers[question.id]!}
            index={index}
          />
        ))}
      </div>
      <button className="primary-button" type="button" onClick={onChooseNewTopic}>
        Choose New Topic
      </button>
    </section>
  );
}