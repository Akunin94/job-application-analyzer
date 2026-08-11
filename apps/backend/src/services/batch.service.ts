import { Response } from 'express';

import { sendEvent, setSSEHeaders } from '../lib/sse.js';
import { AnalysisResult, BatchJob } from '../schemas/analyze.schema.js';
import { runAnalysis } from './claude.service.js';

/**
 * Postings are analysed a few at a time rather than all at once: the Anthropic
 * account has its own concurrency ceiling, and a serial loop would make a
 * ten-job batch feel broken. Three is the compromise.
 */
const BATCH_CONCURRENCY = 3;

interface RankedEntry {
  id: string;
  company: string;
  matchScore: number;
}

/**
 * Runs every posting against one resume and streams each result as it lands, so
 * the table fills in progressively instead of after the slowest job. A failed
 * posting emits `job_error` and the rest of the batch carries on — one bad
 * paste shouldn't sink nine good ones.
 */
export async function streamBatchAnalysis(
  res: Response,
  resumeText: string,
  jobs: BatchJob[],
  language = 'auto',
): Promise<void> {
  setSSEHeaders(res);
  sendEvent(res, 'batch_start', { total: jobs.length });

  // A batch is the most expensive thing this API does, so stop spending Claude
  // calls the moment nobody is listening for the answers.
  let aborted = false;
  const onClose = (): void => {
    aborted = true;
  };
  res.on('close', onClose);

  const ranked: RankedEntry[] = [];
  let cursor = 0;

  const worker = async (): Promise<void> => {
    while (cursor < jobs.length && !aborted) {
      const job = jobs[cursor];
      cursor += 1;

      sendEvent(res, 'job_start', { id: job.id });

      try {
        const { result, cached } = await runAnalysis(resumeText, job.jobPosting, language);
        if (aborted) return;

        ranked.push({ id: job.id, company: job.company, matchScore: result.matchScore });
        sendEvent(res, 'job_result', { id: job.id, cached, result } satisfies {
          id: string;
          cached: boolean;
          result: AnalysisResult;
        });
      } catch (err) {
        if (aborted) return;
        sendEvent(res, 'job_error', {
          id: job.id,
          message: err instanceof Error ? err.message : 'Analysis failed',
        });
      }
    }
  };

  try {
    await Promise.all(
      Array.from({ length: Math.min(BATCH_CONCURRENCY, jobs.length) }, () => worker()),
    );

    if (aborted) return;

    // The client could sort by score itself, but the ranking is the point of the
    // feature — sending it explicitly keeps ties broken the same way everywhere.
    ranked.sort((a, b) => b.matchScore - a.matchScore);
    sendEvent(res, 'ranking', ranked);
    sendEvent(res, 'done', null);
  } catch (err) {
    if (!aborted) {
      sendEvent(res, 'error', {
        message: err instanceof Error ? err.message : 'Batch analysis failed',
      });
    }
  } finally {
    res.off('close', onClose);
    res.end();
  }
}
