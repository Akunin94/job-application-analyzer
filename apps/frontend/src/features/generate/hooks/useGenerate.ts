import { useCallback, useRef, useState } from 'react';
import type { AnalysisResult } from '@/app/store';
import { SSEEvent, useSSE } from '@/shared/hooks/useSSE';
import { GENERATE_URL } from '../api/generate';
import type { GeneratedEmail, GeneratedResume, GenerateResults, GenerateTarget } from '../types';

export interface GenerateArgs {
  resumeText: string;
  jobPosting: string;
  analysis: AnalysisResult;
  targets: GenerateTarget[];
  instructions: string;
  company: string;
  hrName: string;
  language: string;
}

/**
 * Drives the single-call generator. The server flushes each artifact as soon as
 * it is complete, so letters stream in live and the resume lands when its JSON
 * closes — no waiting for the whole response.
 */
export function useGenerate() {
  const [results, setResults] = useState<GenerateResults>({});
  const [streaming, setStreaming] = useState<Partial<Record<GenerateTarget, string>>>({});
  const [active, setActive] = useState<GenerateTarget | null>(null);
  const [error, setError] = useState<string | null>(null);
  const errorsRef = useRef<Partial<Record<GenerateTarget, string>>>({});
  const [sectionErrors, setSectionErrors] = useState<Partial<Record<GenerateTarget, string>>>({});
  const deliveredRef = useRef(0);

  const handleEvent = useCallback((event: SSEEvent) => {
    switch (event.type) {
      case 'section_start': {
        const { target } = event.data as { target: GenerateTarget };
        deliveredRef.current += 1;
        setActive(target);
        setStreaming(s => ({ ...s, [target]: '' }));
        break;
      }
      case 'delta': {
        const { target, text } = event.data as { target: GenerateTarget; text: string };
        setStreaming(s => ({ ...s, [target]: (s[target] ?? '') + text }));
        break;
      }
      case 'section': {
        const { target, data } = event.data as { target: GenerateTarget; data: unknown };
        setResults(r => {
          switch (target) {
            case 'resume':
              return { ...r, resume: data as GeneratedResume };
            case 'companyEmail':
              return { ...r, companyEmail: data as GeneratedEmail };
            case 'coverLetter':
              return { ...r, coverLetter: data as string };
            case 'hrMessage':
              return { ...r, hrMessage: data as string };
            default:
              return r;
          }
        });
        setActive(null);
        break;
      }
      case 'section_error': {
        const { target, message } = event.data as { target: GenerateTarget; message: string };
        errorsRef.current = { ...errorsRef.current, [target]: message };
        setSectionErrors(errorsRef.current);
        setActive(null);
        break;
      }
      case 'error': {
        const d = event.data as { message?: string } | null;
        setError(d?.message ?? 'Generation failed. Please try again.');
        setActive(null);
        break;
      }
      case 'done': {
        setActive(null);
        // A clean finish that produced no sections means the model ignored the
        // marker format. Say so rather than leaving an empty panel behind.
        if (deliveredRef.current === 0) {
          setError('The model returned nothing usable this time. Try generating again.');
        }
        break;
      }
    }
  }, []);

  const { status, connect, abort } = useSSE(handleEvent);

  const start = useCallback(
    async (args: GenerateArgs) => {
      setResults({});
      setStreaming({});
      setError(null);
      errorsRef.current = {};
      setSectionErrors({});
      deliveredRef.current = 0;
      await connect(GENERATE_URL, args);
    },
    [connect],
  );

  const isLoading = status === 'connecting' || status === 'streaming';

  return { status, isLoading, results, streaming, active, error, sectionErrors, start, abort };
}
