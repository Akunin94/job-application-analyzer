import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SkillGapList } from '../SkillGapList';

const gaps = [
  { skill: 'Kubernetes', priority: 'important' as const, context: 'Used in CI/CD pipeline' },
  { skill: 'GraphQL', priority: 'critical' as const, context: 'Core API layer' },
  { skill: 'Figma', priority: 'nice-to-have' as const, context: 'Design collaboration' },
];

describe('SkillGapList', () => {
  it('shows empty message when no gaps', () => {
    render(<SkillGapList gaps={[]} />);
    expect(screen.getByText('No significant skill gaps identified.')).toBeInTheDocument();
  });

  it('renders all skill names', () => {
    render(<SkillGapList gaps={gaps} />);
    expect(screen.getByText('Kubernetes')).toBeInTheDocument();
    expect(screen.getByText('GraphQL')).toBeInTheDocument();
    expect(screen.getByText('Figma')).toBeInTheDocument();
  });

  it('renders priority badges', () => {
    render(<SkillGapList gaps={gaps} />);
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText('Important')).toBeInTheDocument();
    expect(screen.getByText('Nice to have')).toBeInTheDocument();
  });

  it('renders context text', () => {
    render(<SkillGapList gaps={gaps} />);
    expect(screen.getByText('Core API layer')).toBeInTheDocument();
  });

  it('sorts by priority: critical first, nice-to-have last', () => {
    render(<SkillGapList gaps={gaps} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('GraphQL'); // critical
    expect(items[1]).toHaveTextContent('Kubernetes'); // important
    expect(items[2]).toHaveTextContent('Figma'); // nice-to-have
  });
});
