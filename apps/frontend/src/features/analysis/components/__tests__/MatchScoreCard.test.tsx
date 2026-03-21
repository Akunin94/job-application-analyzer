import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MatchScoreCard } from '../MatchScoreCard';

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get:
        (_target, tag: string) =>
        ({ children, ...props }: Record<string, unknown>) =>
          createElement(tag, props, children as React.ReactNode),
    },
  ),
  useMotionValue: vi.fn(() => ({ get: () => 0 })),
  useTransform: vi.fn((_mv: unknown, fn: (v: number) => number) => fn(0)),
  animate: vi.fn(() => ({ stop: vi.fn() })),
}));

describe('MatchScoreCard', () => {
  it('renders Match Score label and /100', () => {
    render(<MatchScoreCard score={85} confidence="high" />);
    expect(screen.getByText('Match Score')).toBeInTheDocument();
    expect(screen.getByText('/ 100')).toBeInTheDocument();
  });

  it('renders confidence badge', () => {
    render(<MatchScoreCard score={85} confidence="high" />);
    expect(screen.getByText('high confidence')).toBeInTheDocument();
  });

  it('applies green color for score ≥ 70', () => {
    render(<MatchScoreCard score={75} confidence="high" />);
    const scoreEl = screen.getByText('0'); // mocked animated value returns 0
    expect(scoreEl.className).toContain('text-green-500');
  });

  it('applies yellow color for score 50–69', () => {
    render(<MatchScoreCard score={60} confidence="medium" />);
    const scoreEl = screen.getByText('0');
    expect(scoreEl.className).toContain('text-yellow-500');
  });

  it('applies red color for score < 50', () => {
    render(<MatchScoreCard score={30} confidence="low" />);
    const scoreEl = screen.getByText('0');
    expect(scoreEl.className).toContain('text-red-500');
  });
});
