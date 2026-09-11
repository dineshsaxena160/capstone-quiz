import type { RefObject } from 'react';
import type { QuizQuestion } from '@quiz/contracts';
import { CodeBlock } from './CodeBlock.js';

interface QuestionCardProps {
  question: QuizQuestion;
  selectedOptionId: string | undefined;
  onSelect: (optionId: string) => void;
  disabled?: boolean;
  headingRef?: RefObject<HTMLHeadingElement | null>;
}

export function QuestionCard({
  question,
  selectedOptionId,
  onSelect,
  disabled = false,
  headingRef,
}: QuestionCardProps) {
  return (
    <article className="question-card" aria-labelledby={`question-${question.id}`}>
      <h2 id={`question-${question.id}`} ref={headingRef} tabIndex={-1}>{question.prompt}</h2>
      {question.code ? <CodeBlock code={question.code} /> : null}
      <fieldset className="answer-fieldset" disabled={disabled}>
        <legend>Choose one answer</legend>
        <div className="answer-list">
          {question.options.map((option) => (
            <label className={`answer-option${selectedOptionId === option.id ? ' is-selected' : ''}`} key={option.id}>
              <input
                type="radio"
                name={`answer-${question.id}`}
                value={option.id}
                checked={selectedOptionId === option.id}
                onChange={() => onSelect(option.id)}
              />
              <span>{option.text}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </article>
  );
}
