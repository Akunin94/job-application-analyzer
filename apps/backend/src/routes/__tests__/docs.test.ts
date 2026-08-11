import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { app } from '../../app.js';
import { buildOpenApiDocument } from '../../docs/openapi.js';

interface OpenApiDoc {
  openapi: string;
  paths: Record<string, Record<string, { summary?: string; tags?: string[] }>>;
  components: { schemas: Record<string, { properties?: Record<string, unknown> }> };
}

const doc = buildOpenApiDocument() as unknown as OpenApiDoc;

const operations = Object.entries(doc.paths).flatMap(([path, methods]) =>
  Object.keys(methods).map(method => ({ path, method })),
);

/** helmet's default policy carries 'unsafe-inline' on style-src, so only the
 *  script-src directive tells the two routes apart. */
function scriptSrc(header: string | undefined): string | undefined {
  return header?.split(';').find(directive => directive.startsWith('script-src '));
}

describe('GET /api/docs.json', () => {
  it('serves the OpenAPI document', async () => {
    const res = await request(app).get('/api/docs.json');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
    expect((res.body as OpenApiDoc).openapi).toBe('3.0.3');
  });

  it('documents every endpoint the README-level API list promises', async () => {
    const res = await request(app).get('/api/docs.json');
    const paths = Object.keys((res.body as OpenApiDoc).paths);

    expect(paths).toEqual(
      expect.arrayContaining([
        '/api/health',
        '/api/upload/resume',
        '/api/analyze',
        '/api/analyze/batch',
        '/api/analyze/generate',
        '/api/analyze/follow-up',
        '/api/parse-url',
        '/api/webhook/notion',
        '/api/webhook/airtable',
      ]),
    );
  });
});

describe('GET /api/docs', () => {
  it('serves the Swagger UI page', async () => {
    const res = await request(app).get('/api/docs/');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('swagger-ui');
  });

  it('relaxes script-src so the UI can boot', async () => {
    const res = await request(app).get('/api/docs/');
    expect(scriptSrc(res.headers['content-security-policy'])).toBe(
      "script-src 'self' 'unsafe-inline'",
    );
  });

  it('leaves script-src on the rest of the API alone', async () => {
    const res = await request(app).get('/api/health');
    expect(scriptSrc(res.headers['content-security-policy'])).toBe("script-src 'self'");
  });
});

describe('the documented surface matches the mounted one', () => {
  // A documented route that doesn't exist answers 404. Anything else — 200, or
  // the 400 an empty body earns — means the route is really there.
  it.each(operations)('$method $path is mounted', async ({ path, method }) => {
    const res = await (method === 'get'
      ? request(app).get(path)
      : request(app).post(path).send({}));

    expect(res.status).not.toBe(404);
  });
});

describe('request schemas are generated from the Zod schemas', () => {
  it('carries the fields the validator actually requires', () => {
    const batch = doc.components.schemas.BatchAnalyzeRequest;
    expect(Object.keys(batch.properties ?? {})).toEqual(
      expect.arrayContaining(['resumeText', 'jobs', 'language']),
    );
  });

  it('states the batch cap that the validator enforces', () => {
    const jobs = (doc.components.schemas.BatchAnalyzeRequest.properties as { jobs: unknown }).jobs;
    expect(jobs).toMatchObject({ type: 'array', minItems: 1, maxItems: 10 });
  });
});
