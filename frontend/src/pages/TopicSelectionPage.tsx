import { SUPPORTED_TOPICS, type SupportedTopic } from '@quiz/contracts';

interface TopicSelectionPageProps {
  selectedTopic: SupportedTopic | null;
  onSelectTopic: (topic: SupportedTopic) => void;
  onStart: (topic: SupportedTopic) => void;
}

export function TopicSelectionPage({
  selectedTopic,
  onSelectTopic,
  onStart,
}: TopicSelectionPageProps) {
  return (
    <section className="screen topic-screen" aria-labelledby="topic-heading">
      <p className="eyebrow">Signal Quiz</p>
      <h1 id="topic-heading">Check your technical signal.</h1>
      <p className="intro">
        Choose one topic for a focused ten-question assessment with immediate explanations.
      </p>
      <fieldset className="topic-fieldset">
        <legend>Choose a topic</legend>
        <div className="topic-grid">
          {SUPPORTED_TOPICS.map((topic) => (
            <label className={`topic-option${selectedTopic === topic ? ' is-selected' : ''}`} key={topic}>
              <input
                type="radio"
                name="topic"
                value={topic}
                checked={selectedTopic === topic}
                onChange={() => onSelectTopic(topic)}
              />
              <span>{topic}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <button
        className="primary-button"
        type="button"
        disabled={selectedTopic === null}
        onClick={() => {
          if (selectedTopic !== null) onStart(selectedTopic);
        }}
      >
        Start Quiz
      </button>
    </section>
  );
}