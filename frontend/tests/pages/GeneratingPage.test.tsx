import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GeneratingPage } from '../../src/pages/GeneratingPage.js';

describe('GeneratingPage', () => {
  it('announces topic-aware loading without internal composition details', () => {
    render(<GeneratingPage topic="PostgreSQL" />);

    expect(screen.getByRole('status')).toHaveTextContent('PostgreSQL');
    expect(screen.getByRole('heading', { name: /creating your quiz/i })).toBeInTheDocument();
    expect(screen.queryByText(/beginner|intermediate|advanced|difficulty/i)).not.toBeInTheDocument();
  });
});