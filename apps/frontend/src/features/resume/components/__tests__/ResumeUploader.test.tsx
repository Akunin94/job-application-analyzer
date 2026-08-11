import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { useStore } from '@/app/store';
import { server } from '@/test/mocks/server';
import { ResumeUploader } from '../ResumeUploader';

// pdfjs-dist calls into browser APIs; silence errors in jsdom
vi.mock('@/features/resume/components/ResumePreview', () => ({
  ResumePreview: () => null,
}));

function resetStore() {
  useStore.setState({ resumes: [], activeResumeId: null });
  localStorage.clear();
}

async function uploadPdf(name = 'my-resume.pdf') {
  const file = new File(['%PDF-1.4 content'], name, { type: 'application/pdf' });
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  await userEvent.upload(input, file);
}

describe('ResumeUploader', () => {
  afterEach(resetStore);

  it('renders dropzone by default', () => {
    render(<ResumeUploader />);
    expect(screen.getByText(/Drop PDF or click to upload/i)).toBeInTheDocument();
  });

  it('offers to add another version in compact mode', () => {
    render(<ResumeUploader compact />);
    expect(screen.getByText(/Add another version/i)).toBeInTheDocument();
  });

  it('stores a new version on successful upload and makes it active', async () => {
    render(<ResumeUploader />);
    await uploadPdf();

    await waitFor(() => {
      expect(useStore.getState().resumes).toHaveLength(1);
    });

    const [version] = useStore.getState().resumes;
    expect(version.fileName).toBe('resume.pdf');
    expect(version.name).toBe('resume.pdf');
    expect(version.text).toBe('Sample resume text content');
    expect(useStore.getState().activeResumeId).toBe(version.id);
  });

  it('re-selects the matching version instead of storing a duplicate', async () => {
    const { unmount } = render(<ResumeUploader />);
    await uploadPdf();
    await waitFor(() => expect(useStore.getState().resumes).toHaveLength(1));
    const firstId = useStore.getState().resumes[0].id;
    unmount();

    // The handler always returns the same text, so this is the same resume.
    render(<ResumeUploader />);
    await uploadPdf('same-resume-again.pdf');

    await waitFor(() => expect(useStore.getState().activeResumeId).toBe(firstId));
    expect(useStore.getState().resumes).toHaveLength(1);
  });

  it('shows error message on upload failure', async () => {
    server.use(
      http.post('http://localhost:3001/api/upload/resume', () =>
        HttpResponse.json({ error: 'Bad request' }, { status: 400 }),
      ),
    );

    render(<ResumeUploader />);
    await uploadPdf('bad.pdf');

    await waitFor(() => {
      expect(screen.getByText(/Upload failed/i)).toBeInTheDocument();
    });
    expect(useStore.getState().resumes).toHaveLength(0);
  });
});
