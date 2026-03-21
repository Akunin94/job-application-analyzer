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
  useStore.setState({ resumeText: '', resumeFileName: '' });
  localStorage.clear();
}

describe('ResumeUploader', () => {
  afterEach(resetStore);

  it('renders dropzone by default', () => {
    render(<ResumeUploader />);
    expect(screen.getByText(/Drop PDF or click to upload/i)).toBeInTheDocument();
  });

  it('shows filename after successful upload', async () => {
    render(<ResumeUploader />);
    const file = new File(['%PDF-1.4 content'], 'my-resume.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('resume.pdf')).toBeInTheDocument();
    });
  });

  it('shows error message on upload failure', async () => {
    server.use(
      http.post('http://localhost:3001/api/upload/resume', () =>
        HttpResponse.json({ error: 'Bad request' }, { status: 400 }),
      ),
    );

    render(<ResumeUploader />);
    const file = new File(['%PDF-1.4 content'], 'bad.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/Upload failed/i)).toBeInTheDocument();
    });
  });

  it('clears resume when X button is clicked', async () => {
    // Pre-load store with a resume
    useStore.setState({ resumeText: 'some text', resumeFileName: 'old.pdf' });

    render(<ResumeUploader />);
    expect(screen.getByText('old.pdf')).toBeInTheDocument();

    const clearBtn = screen.getByRole('button');
    await userEvent.click(clearBtn);

    expect(useStore.getState().resumeText).toBe('');
    expect(useStore.getState().resumeFileName).toBe('');
  });
});
