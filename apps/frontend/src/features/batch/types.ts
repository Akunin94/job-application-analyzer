import { AnalysisResult } from '@/app/store';

/** Mirrors `BATCH_MAX_JOBS` in apps/backend/src/schemas/analyze.schema.ts. */
export const BATCH_MAX_JOBS = 10;

export interface BatchJobInput {
  id: string;
  company: string;
  jobPosting: string;
}

export type BatchRowStatus = 'pending' | 'running' | 'done' | 'error';

export interface BatchRow {
  id: string;
  company: string;
  status: BatchRowStatus;
  result: AnalysisResult | null;
  error: string | null;
  cached: boolean;
}

export function emptyJob(): BatchJobInput {
  return { id: crypto.randomUUID(), company: '', jobPosting: '' };
}
