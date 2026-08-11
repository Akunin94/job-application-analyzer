import { useCallback, useMemo, useState } from 'react';
import { AnalysisResult } from '@/app/store';
import { SSEEvent, useSSE } from '@/shared/hooks/useSSE';
import { BATCH_URL } from '../api/batch';
import { BatchJobInput, BatchRow } from '../types';

interface RankEntry {
  id: string;
  company: string;
  matchScore: number;
}

function patchRow(rows: BatchRow[], id: string, patch: Partial<BatchRow>): BatchRow[] {
  return rows.map(row => (row.id === id ? { ...row, ...patch } : row));
}

export function useBatchAnalysis() {
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [ranking, setRanking] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleEvent = useCallback((event: SSEEvent) => {
    switch (event.type) {
      case 'job_start': {
        const { id } = event.data as { id: string };
        setRows(prev => patchRow(prev, id, { status: 'running' }));
        break;
      }
      case 'job_result': {
        const d = event.data as { id: string; cached: boolean; result: AnalysisResult };
        setRows(prev =>
          patchRow(prev, d.id, { status: 'done', result: d.result, cached: d.cached }),
        );
        break;
      }
      case 'job_error': {
        const d = event.data as { id: string; message: string };
        setRows(prev => patchRow(prev, d.id, { status: 'error', error: d.message }));
        break;
      }
      case 'ranking': {
        setRanking((event.data as RankEntry[]).map(entry => entry.id));
        break;
      }
      case 'error': {
        const d = event.data as { message?: string } | null;
        setError(d?.message ?? 'Batch analysis failed. Please try again.');
        break;
      }
    }
  }, []);

  const { status, connect, abort } = useSSE(handleEvent);

  const start = useCallback(
    async (resumeText: string, jobs: BatchJobInput[], language = 'auto') => {
      setRows(
        jobs.map(job => ({
          id: job.id,
          company: job.company.trim() || 'Untitled posting',
          status: 'pending',
          result: null,
          error: null,
          cached: false,
        })),
      );
      setRanking([]);
      setError(null);
      await connect(BATCH_URL, { resumeText, jobs, language });
    },
    [connect],
  );

  /**
   * Input order while the batch runs, score order once the server has ranked it.
   * Rows the server left out of the ranking (the failed ones) sink to the bottom
   * rather than disappearing.
   */
  const orderedRows = useMemo(() => {
    if (ranking.length === 0) return rows;

    const rank = new Map(ranking.map((id, index) => [id, index]));
    return [...rows].sort(
      (a, b) =>
        (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER),
    );
  }, [rows, ranking]);

  return { status, rows: orderedRows, isRanked: ranking.length > 0, error, start, abort };
}
