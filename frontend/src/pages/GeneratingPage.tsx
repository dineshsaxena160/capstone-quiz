import type { SupportedTopic } from '@quiz/contracts';

interface GeneratingPageProps {
  topic: SupportedTopic;
}

export function GeneratingPage({ topic }: GeneratingPageProps) {
  return (
    <section className="screen centered-screen" aria-labelledby="generating-heading">
      <div className="loading-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <h1 id="generating-heading">Creating your quiz</h1>
      <p className="intro">Building a focused set for {topic}.</p>
      <p className="status-copy" role="status" aria-live="polite">
        Creating questions for {topic}. Your quiz will be ready in a moment.
      </p>
    </section>
  );
}
