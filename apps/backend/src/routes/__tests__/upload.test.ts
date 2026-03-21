import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { app } from '../../app.js';

vi.mock('../../services/pdf.service.js', () => ({
  extractTextFromPdf: vi.fn().mockResolvedValue('Extracted resume text from mock PDF'),
}));

describe('POST /api/upload/resume', () => {
  it('returns 400 when no file is provided', async () => {
    const res = await request(app).post('/api/upload/resume');
    expect(res.status).toBe(400);
  });

  it('returns text and fileName on successful upload', async () => {
    const fakeBuffer = Buffer.from('%PDF-1.4 fake content');
    const res = await request(app)
      .post('/api/upload/resume')
      .attach('resume', fakeBuffer, { filename: 'resume.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      text: 'Extracted resume text from mock PDF',
      fileName: 'resume.pdf',
    });
  });

  it('returns 400 when file is not a PDF', async () => {
    const res = await request(app)
      .post('/api/upload/resume')
      .attach('resume', Buffer.from('hello'), {
        filename: 'doc.txt',
        contentType: 'text/plain',
      });

    expect(res.status).toBe(400);
  });
});
