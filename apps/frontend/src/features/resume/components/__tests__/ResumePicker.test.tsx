import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { MAX_RESUME_VERSIONS, ResumeVersion, useStore } from '@/app/store';
import { ResumePicker } from '../ResumePicker';

vi.mock('@/features/resume/components/ResumePreview', () => ({
  ResumePreview: () => null,
}));

function version(id: string, name: string): ResumeVersion {
  return {
    id,
    name,
    fileName: `${id}.pdf`,
    text: `text of ${id}`,
    addedAt: '2026-08-10T10:00:00.000Z',
  };
}

function seed(versions: ResumeVersion[], activeResumeId: string | null) {
  useStore.setState({ resumes: versions, activeResumeId });
}

function resetStore() {
  useStore.setState({ resumes: [], activeResumeId: null });
  localStorage.clear();
}

describe('ResumePicker', () => {
  afterEach(resetStore);

  it('shows only the dropzone when nothing is stored', () => {
    render(<ResumePicker />);
    expect(screen.getByText(/Drop PDF or click to upload/i)).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('lists stored versions with the active one selected', () => {
    seed([version('a', 'Backend CV'), version('b', 'Frontend CV')], 'b');
    render(<ResumePicker />);

    expect(screen.getByText('Backend CV')).toBeInTheDocument();
    expect(screen.getByLabelText('Use Frontend CV')).toBeChecked();
    expect(screen.getByLabelText('Use Backend CV')).not.toBeChecked();
  });

  it('switches the active version on click', async () => {
    seed([version('a', 'Backend CV'), version('b', 'Frontend CV')], 'b');
    render(<ResumePicker />);

    await userEvent.click(screen.getByLabelText('Use Backend CV'));

    expect(useStore.getState().activeResumeId).toBe('a');
  });

  it('renames a version', async () => {
    seed([version('a', 'Backend CV')], 'a');
    render(<ResumePicker />);

    await userEvent.click(screen.getByLabelText('Rename Backend CV'));
    const input = screen.getByLabelText('Name for a.pdf');
    await userEvent.clear(input);
    await userEvent.type(input, 'Platform CV{Enter}');

    expect(useStore.getState().resumes[0].name).toBe('Platform CV');
  });

  it('falls back to the file name when the new name is blank', async () => {
    seed([version('a', 'Backend CV')], 'a');
    render(<ResumePicker />);

    await userEvent.click(screen.getByLabelText('Rename Backend CV'));
    const input = screen.getByLabelText('Name for a.pdf');
    await userEvent.clear(input);
    await userEvent.type(input, '   {Enter}');

    expect(useStore.getState().resumes[0].name).toBe('a.pdf');
  });

  it('promotes the next version when the active one is removed', async () => {
    seed([version('a', 'Backend CV'), version('b', 'Frontend CV')], 'b');
    render(<ResumePicker />);

    await userEvent.click(screen.getByLabelText('Remove Frontend CV'));

    expect(useStore.getState().resumes.map(r => r.id)).toEqual(['a']);
    expect(useStore.getState().activeResumeId).toBe('a');
  });

  it('warns once the version list is full', () => {
    seed(
      Array.from({ length: MAX_RESUME_VERSIONS }, (_, i) => version(`v${i}`, `CV ${i}`)),
      'v0',
    );
    render(<ResumePicker />);

    expect(screen.getByText(/adding another drops the oldest/i)).toBeInTheDocument();
  });
});
