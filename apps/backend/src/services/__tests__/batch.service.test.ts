import { EventEmitter } from 'events';
import type { Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AnalysisResult } from '../../schemas/analyze.schema.js';

const runAnalysis = vi.fn();

vi.mock('../claude.service.js', () => ({
  runAnalysis: (...args: unknown[]) => runAnalysis(...args) as unknown,
}));

const { streamBatchAnalysis } = await import('../batch.service.js');

function makeAnalysis(matchScore: number): AnalysisResult {
  return {
    matchScore,
    confidence: 'high',
    summary: '',
    categoryScores: {
      technicalSkills: 0,
      experience: 0,
      cultureFit: 0,
      keywords: 0,
      seniority: 0,
      tools: 0,
    },
    strengths: [],
    skillGaps: [],
    redFlags: [],
    recommendations: [],
    keywords: { matched: [], missing: [] },
    atsScore: null,
  };
}

type FakeRes = Response & { chunks: string[] };

/** Minimal stand-in for an SSE response: records writes, emits 'close' on demand. */
function makeRes(): FakeRes {
  const chunks: string[] = [];

  const res = Object.assign(new EventEmitter(), {
    chunks,
    setHeader: vi.fn(),
    end: vi.fn(),
    write: (chunk: string) => {
      chunks.push(chunk);
      return true;
    },
  });

  return res as unknown as FakeRes;
}

function eventsOf(res: FakeRes): Array<{ type: string; data: unknown }> {
  return res.chunks.map(chunk => ({
    type: /^event: (.+)$/m.exec(chunk)?.[1] ?? '',
    data: JSON.parse(/^data: (.+)$/m.exec(chunk)?.[1] ?? 'null') as unknown,
  }));
}

const jobs = [
  { id: 'a', company: 'Acme', jobPosting: 'React role' },
  { id: 'b', company: 'Globex', jobPosting: 'Node role' },
  { id: 'c', company: 'Initech', jobPosting: 'Go role' },
];

describe('streamBatchAnalysis', () => {
  beforeEach(() => {
    runAnalysis.mockReset();
  });

  it('ranks results by match score, highest first', async () => {
    const scores: Record<string, number> = { 'React role': 40, 'Node role': 90, 'Go role': 65 };
    runAnalysis.mockImplementation((_resume: string, posting: string) =>
      Promise.resolve({ result: makeAnalysis(scores[posting]), cached: false }),
    );

    const res = makeRes();
    await streamBatchAnalysis(res, 'my resume', jobs);

    const ranking = eventsOf(res).find(e => e.type === 'ranking')?.data as Array<{
      id: string;
      matchScore: number;
    }>;

    expect(ranking.map(r => r.id)).toEqual(['b', 'c', 'a']);
    expect(ranking.map(r => r.matchScore)).toEqual([90, 65, 40]);
  });

  it('announces the batch size up front and terminates with done', async () => {
    runAnalysis.mockResolvedValue({ result: makeAnalysis(50), cached: false });

    const res = makeRes();
    await streamBatchAnalysis(res, 'my resume', jobs);

    const events = eventsOf(res);
    expect(events[0]).toEqual({ type: 'batch_start', data: { total: 3 } });
    expect(events.at(-1)?.type).toBe('done');
    expect(res.end).toHaveBeenCalled();
  });

  it('reports a failed posting and still finishes the rest', async () => {
    runAnalysis.mockImplementation((_resume: string, posting: string) =>
      posting === 'Node role'
        ? Promise.reject(new Error('Job posting was truncated'))
        : Promise.resolve({ result: makeAnalysis(70), cached: false }),
    );

    const res = makeRes();
    await streamBatchAnalysis(res, 'my resume', jobs);

    const events = eventsOf(res);
    expect(events.find(e => e.type === 'job_error')?.data).toEqual({
      id: 'b',
      message: 'Job posting was truncated',
    });
    expect(events.filter(e => e.type === 'job_result')).toHaveLength(2);
    expect(events.at(-1)?.type).toBe('done');
  });

  it('marks cache hits so the UI can label them', async () => {
    runAnalysis.mockResolvedValue({ result: makeAnalysis(50), cached: true });

    const res = makeRes();
    await streamBatchAnalysis(res, 'my resume', [jobs[0]]);

    const result = eventsOf(res).find(e => e.type === 'job_result')?.data as { cached: boolean };
    expect(result.cached).toBe(true);
  });

  it('stops spending Claude calls once the client disconnects', async () => {
    const res = makeRes();
    runAnalysis.mockImplementation(() => {
      res.emit('close');
      return Promise.resolve({ result: makeAnalysis(50), cached: false });
    });

    await streamBatchAnalysis(res, 'my resume', jobs);

    // The disconnect lands during the first job, so the two remaining workers
    // never pick anything up — that is the whole point of the abort flag.
    expect(runAnalysis).toHaveBeenCalledTimes(1);

    const events = eventsOf(res);
    expect(events.some(e => e.type === 'job_result')).toBe(false);
    expect(events.some(e => e.type === 'ranking')).toBe(false);
    expect(events.some(e => e.type === 'done')).toBe(false);
  });
});
