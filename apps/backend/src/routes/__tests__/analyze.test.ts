import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { app } from '../../app.js';

vi.mock('../../services/claude.service.js', () => ({
  streamAnalysis: vi.fn(async (_res: import('express').Response) => {
    _res.setHeader('Content-Type', 'text/event-stream');
    _res.write('event: match_score\ndata: {"score":80,"confidence":"high"}\n\n');
    _res.write('event: done\ndata: null\n\n');
    _res.end();
  }),
  streamCoverLetter: vi.fn(async (_res: import('express').Response) => {
    _res.setHeader('Content-Type', 'text/event-stream');
    _res.write('event: cover_letter\ndata: "Dear Hiring Manager"\n\n');
    _res.write('event: done\ndata: null\n\n');
    _res.end();
  }),
}));

describe('POST /api/analyze', () => {
  it('returns 400 when resumeText is missing', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({ jobPosting: 'We are looking for a developer' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when jobPosting is missing', async () => {
    const res = await request(app).post('/api/analyze').send({ resumeText: 'My resume content' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for empty body', async () => {
    const res = await request(app).post('/api/analyze').send({});
    expect(res.status).toBe(400);
  });

  it('streams SSE events for valid request', async () => {
    const res = await request(app).post('/api/analyze').send({
      resumeText: 'My resume content',
      jobPosting: 'We are looking for a developer',
    });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/event-stream');
    expect(res.text).toContain('event: match_score');
    expect(res.text).toContain('event: done');
  });
});

describe('POST /api/analyze/cover-letter', () => {
  it('returns 400 when fields are missing', async () => {
    const res = await request(app).post('/api/analyze/cover-letter').send({});
    expect(res.status).toBe(400);
  });

  it('streams cover letter for valid request', async () => {
    const res = await request(app)
      .post('/api/analyze/cover-letter')
      .send({
        resumeText: 'My resume',
        jobPosting: 'Senior developer role',
        analysis: {
          matchScore: 80,
          confidence: 'high',
          summary: '',
          categoryScores: {
            technicalSkills: 80,
            experience: 70,
            cultureFit: 90,
            keywords: 85,
            seniority: 75,
            tools: 80,
          },
          strengths: ['React'],
          skillGaps: [],
          redFlags: [{ flag: 'US-only remote', quote: 'Must be in the US', severity: 'critical' }],
          recommendations: [],
          keywords: { matched: [], missing: [] },
          coverLetterOutline: '',
        },
      });

    expect(res.status).toBe(200);
    expect(res.text).toContain('event: cover_letter');
  });
});
