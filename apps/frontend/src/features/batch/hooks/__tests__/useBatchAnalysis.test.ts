import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useBatchAnalysis } from '../useBatchAnalysis';
import { BatchJobInput } from '../../types';

// MSW intercepts http://localhost:3001/api/analyze/batch (see handlers.ts)

function jobs(count: number): BatchJobInput[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `job-${i}`,
    company: `Company ${i}`,
    jobPosting: `Posting ${i}`,
  }));
}

describe('useBatchAnalysis', () => {
  it('starts idle with no rows', () => {
    const { result } = renderHook(() => useBatchAnalysis());
    expect(result.current.status).toBe('idle');
    expect(result.current.rows).toEqual([]);
    expect(result.current.isRanked).toBe(false);
  });

  it('fills every row with its result as events arrive', async () => {
    const { result } = renderHook(() => useBatchAnalysis());

    await act(async () => {
      await result.current.start('resume text', jobs(2));
    });

    expect(result.current.rows).toHaveLength(2);
    expect(result.current.rows.every(row => row.status === 'done')).toBe(true);
    expect(result.current.rows.map(row => row.result?.matchScore).sort()).toEqual([40, 90]);
  });

  it('reorders rows by score once the ranking arrives', async () => {
    const { result } = renderHook(() => useBatchAnalysis());

    await act(async () => {
      await result.current.start('resume text', jobs(2));
    });

    expect(result.current.isRanked).toBe(true);
    expect(result.current.rows.map(row => row.id)).toEqual(['job-1', 'job-0']);
    expect(result.current.rows[0].result?.matchScore).toBe(90);
  });

  it('keeps a failed posting visible, sunk below the ranked ones', async () => {
    const { result } = renderHook(() => useBatchAnalysis());

    await act(async () => {
      await result.current.start('resume text', jobs(3));
    });

    const failed = result.current.rows.at(-1);
    expect(failed?.id).toBe('job-2');
    expect(failed?.status).toBe('error');
    expect(failed?.error).toBe('Job posting was truncated');
  });

  it('flags rows the server served from cache', async () => {
    const { result } = renderHook(() => useBatchAnalysis());

    await act(async () => {
      await result.current.start('resume text', jobs(2));
    });

    expect(result.current.rows.find(row => row.id === 'job-1')?.cached).toBe(true);
    expect(result.current.rows.find(row => row.id === 'job-0')?.cached).toBe(false);
  });

  it('labels a posting with no company name', async () => {
    const { result } = renderHook(() => useBatchAnalysis());

    await act(async () => {
      await result.current.start('resume text', [
        { id: 'job-0', company: '  ', jobPosting: 'Posting' },
        { id: 'job-1', company: 'Globex', jobPosting: 'Posting' },
      ]);
    });

    expect(result.current.rows.find(row => row.id === 'job-0')?.company).toBe('Untitled posting');
  });
});
