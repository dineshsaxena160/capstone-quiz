import { useEffect, useRef } from 'react';
import type { QuizSession } from '../app/state.js';
import { getAnsweredCount, getUnresolvedIndices, isValidOptionId } from '../domain/answers.js';
import { ProgressIndicator } from '../components/ProgressIndicator.js';
import { QuestionCard } from '../components/QuestionCard.js';

interface QuizPageProps {
  session: QuizSession;
  onAnswer: (optionId: string) => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onSubmit: () => void;
}

export function QuizPage({ session, onAnswer, onBack, onNext, onSkip, onSubmit }: QuizPageProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const question = session.questions[session.currentIndex];
  useEffect(() => {
    headingRef.current?.focus();
  }, [question?.id]);
  if (!question) return null;
  const answered = getAnsweredCount(session.questions, session.answers);
  const unresolved = getUnresolvedIndices(session.questions, session.answers);
  const selectedOptionId = session.answers[question.id];
  const hasAnswer = isValidOptionId(question, selectedOptionId);
  const isLastQuestion = session.currentIndex === session.questions.length - 1;

  return (
    <section className="screen quiz-screen" aria-labelledby={`question-${question.id}`}>
      <div className="quiz-topline">
        <span className="eyebrow">{session.topic}</span>
        <ProgressIndicator currentIndex={session.currentIndex} total={session.questions.length} answered={answered} />
      </div>
      <QuestionCard
        question={question}
        selectedOptionId={selectedOptionId}
        onSelect={onAnswer}
        headingRef={headingRef}
      />
      <p className="progress-announcement" role="status" aria-live="polite">
        {unresolved.length > 0 ? `${unresolved.length} unanswered` : 'All questions answered'}
      </p>
      <div className="quiz-actions">
        <button className="secondary-button" type="button" onClick={onBack} disabled={session.currentIndex === 0}>
          Back
        </button>
        <button className="secondary-button" type="button" onClick={onSkip}>
          Skip
        </button>
        {!isLastQuestion ? (
          <button className="primary-button" type="button" onClick={onNext} disabled={!hasAnswer}>
            Next
          </button>
        ) : (
          <button className="primary-button" type="button" onClick={onSubmit} disabled={unresolved.length > 0}>
            Submit Quiz
          </button>
        )}
      </div>
    </section>
  );
}
