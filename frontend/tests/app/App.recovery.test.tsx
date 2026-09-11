import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../src/App.js';

describe('App recovery flow', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows safe recovery actions for a rate-limited generation and retries from the retained topic', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: { code: 'rate_limit', message: 'The quiz service is busy.', retryable: true },
          }),
          { status: 429 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ topic: 'JavaScript', questions: [] }), { status: 200 }),
      );
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole('radio', { name: 'JavaScript' }));
    await user.click(screen.getByRole('button', { name: 'Start Quiz' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/busy/i);
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose New Topic' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(await screen.findByRole('alert')).toHaveTextContent(/unusable quiz response/i);
  });
});