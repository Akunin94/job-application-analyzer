import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useStore } from '@/app/store';
import { useStreamAnalysis } from '../useStreamAnalysis';

// MSW intercepts http://localhost:3001/api/analyze (see handlers.ts)

function resetStore() {
  useStore.setState({
    resumeText: '',
    resumeFileName: '',
    currentAnalysis: null,
    streamingStatus: 'idle',
    history: [],
  });
  localStorage.clear();
}

describe('useStreamAnalysis', () => {
  afterEach(resetStore);

  it('starts with idle status and empty partial', () => {
    const { result } = renderHook(() => useStreamAnalysis());
    expect(result.current.status).toBe('idle');
    expect(result.current.partial).toEqual({});
  });

  it('populates partial as SSE events arrive', async () => {
    const { result } = renderHook(() => useStreamAnalysis());

    await act(async () => {
      await result.current.start('resume text', 'job posting', 'Acme Corp');
    });

    expect(result.current.partial.matchScore).toBe(85);
    expect(result.current.partial.confidence).toBe('high');
    expect(result.current.partial.strengths).toEqual(['React', 'TypeScript', 'Node.js']);
  });

  it('saves complete result to store on done event', async () => {
    const { result } = renderHook(() => useStreamAnalysis());

    await act(async () => {
      await result.current.start('resume text', 'job posting', 'Acme Corp');
    });

    const analysis = useStore.getState().currentAnalysis;
    expect(analysis).not.toBeNull();
    expect(analysis?.matchScore).toBe(85);
    expect(analysis?.confidence).toBe('high');
    expect(analysis?.categoryScores.technicalSkills).toBe(80);
    expect(analysis?.redFlags[0]).toMatchObject({ flag: 'US-only remote', severity: 'critical' });
    expect(analysis?.salaryEstimate).toMatchObject({ min: 90000, max: 130000, currency: 'USD' });
    expect(analysis?.atsScore).toMatchObject({ score: 72, verdict: 'likely_pass' });
    expect(analysis?.skillsRoadmap?.[0]).toMatchObject({
      skill: 'Kubernetes',
      priority: 'important',
    });
  });

  it('adds entry to history on done', async () => {
    const { result } = renderHook(() => useStreamAnalysis());

    await act(async () => {
      await result.current.start('resume text', 'job posting', 'Acme Corp');
    });

    const history = useStore.getState().history;
    expect(history).toHaveLength(1);
    expect(history[0].company).toBe('Acme Corp');
    expect(history[0].result.matchScore).toBe(85);
  });
});
