import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TopicSelectionPage } from '../../src/pages/TopicSelectionPage.js';

describe('TopicSelectionPage', () => {
  it('shows exactly nine topics and keeps Start Quiz disabled before selection', () => {
    render(<TopicSelectionPage selectedTopic={null} onSelectTopic={vi.fn()} onStart={vi.fn()} />);

    expect(screen.getAllByRole('radio')).toHaveLength(9);
    expect(screen.getByRole('button', { name: 'Start Quiz' })).toBeDisabled();
  });

  it('uses one controlled topic selection and starts only after selection', async () => {
    const user = userEvent.setup();
    const onSelectTopic = vi.fn();
    const onStart = vi.fn();
    const { rerender } = render(
      <TopicSelectionPage selectedTopic={null} onSelectTopic={onSelectTopic} onStart={onStart} />,
    );

    await user.click(screen.getByRole('radio', { name: 'JavaScript' }));
    expect(onSelectTopic).toHaveBeenCalledWith('JavaScript');

    rerender(
      <TopicSelectionPage selectedTopic="JavaScript" onSelectTopic={onSelectTopic} onStart={onStart} />,
    );
    expect(screen.getByRole('button', { name: 'Start Quiz' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Start Quiz' }));
    expect(onStart).toHaveBeenCalledWith('JavaScript');
    expect(screen.queryByText(/difficulty/i)).not.toBeInTheDocument();
  });
});
