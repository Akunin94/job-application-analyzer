import { ZodSchema } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import {
  BATCH_MAX_JOBS,
  analysisResultSchema,
  analyzeRequestSchema,
  batchAnalyzeRequestSchema,
  followUpRequestSchema,
  generateRequestSchema,
} from '../schemas/analyze.schema.js';
import { uploadResponseSchema } from '../schemas/upload.schema.js';
import { parseUrlRequestSchema } from '../schemas/url.schema.js';
import { airtableWebhookSchema, notionWebhookSchema } from '../schemas/webhook.schema.js';

/**
 * Request bodies are converted from the very Zod schemas the validate()
 * middleware runs, so a field renamed in a schema is renamed in the docs — the
 * usual way API docs rot is by being written a second time, by hand.
 *
 * Responses have no such single source: the JSON ones are described here, and
 * the SSE ones can only be described in prose, since OpenAPI has no vocabulary
 * for a stream of typed events.
 */
const REQUEST_SCHEMAS: Record<string, ZodSchema> = {
  AnalyzeRequest: analyzeRequestSchema,
  BatchAnalyzeRequest: batchAnalyzeRequestSchema,
  GenerateRequest: generateRequestSchema,
  FollowUpRequest: followUpRequestSchema,
  ParseUrlRequest: parseUrlRequestSchema,
  NotionWebhookRequest: notionWebhookSchema,
  AirtableWebhookRequest: airtableWebhookSchema,
  AnalysisResult: analysisResultSchema,
  UploadResponse: uploadResponseSchema,
};

function jsonSchemas(): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(REQUEST_SCHEMAS).map(([name, schema]) => [
      name,
      // Inlined rather than $ref'd: the nested schemas are shared by only two or
      // three endpoints, and a self-contained body is easier to read in the UI.
      zodToJsonSchema(schema, { target: 'openApi3', $refStrategy: 'none' }),
    ]),
  );
}

function ref(name: string) {
  return { $ref: `#/components/schemas/${name}` };
}

function jsonBody(schemaName: string) {
  return {
    required: true,
    content: { 'application/json': { schema: ref(schemaName) } },
  };
}

/** OpenAPI can't type a stream of events, so the event names go in the prose. */
function sseResponse(description: string, events: string[]) {
  return {
    '200': {
      description: `${description}\n\nEvents: ${events.map(e => `\`${e}\``).join(', ')}.`,
      content: {
        'text/event-stream': {
          schema: {
            type: 'string',
            example: 'event: done\ndata: null\n\n',
          },
        },
      },
    },
  };
}

const ERROR_RESPONSE = {
  description: 'Error message, or the flattened Zod issues for a 400.',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: { error: { description: 'String message or Zod issue tree.' } },
        required: ['error'],
      },
    },
  },
};

const VALIDATION_ERROR = { '400': ERROR_RESPONSE };
const RATE_LIMITED = { '429': ERROR_RESPONSE };

export function buildOpenApiDocument(): Record<string, unknown> {
  return {
    openapi: '3.0.3',
    info: {
      title: 'AI Job Application Analyzer API',
      version: '1.0.0',
      description:
        'Analyzes a resume against job postings and generates the application material that follows from it.\n\n' +
        'The AI endpoints answer over Server-Sent Events rather than a single JSON body: results are flushed ' +
        'section by section as Claude produces them. Every stream ends with either a `done` or an `error` event — ' +
        'a stream that stops without one means the server went away mid-response.\n\n' +
        `Rate limits: 120 requests / 15 min across \`/api\`, and 10 / 15 min on \`/api/analyze\` and \`/api/webhook\`. ` +
        `A batch counts as one request no matter how many postings it carries, which is why it is capped at ${BATCH_MAX_JOBS}.`,
    },
    tags: [
      { name: 'Analysis', description: 'Scoring a resume against one or more postings.' },
      { name: 'Generation', description: 'Application material derived from an analysis.' },
      { name: 'Input', description: 'Getting a resume or a posting into the system.' },
      { name: 'Export', description: 'Pushing a finished analysis somewhere else.' },
      { name: 'Ops', description: 'Health and documentation.' },
    ],
    paths: {
      '/api/health': {
        get: {
          tags: ['Ops'],
          summary: 'Liveness check',
          responses: {
            '200': {
              description: 'The server is up.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { status: { type: 'string', example: 'ok' } },
                    required: ['status'],
                  },
                },
              },
            },
          },
        },
      },

      '/api/upload/resume': {
        post: {
          tags: ['Input'],
          summary: 'Extract text from a resume PDF',
          description:
            'Single PDF, 10 MB max. The extracted text is what every other endpoint takes.',
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: { resume: { type: 'string', format: 'binary' } },
                  required: ['resume'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Extracted text and the original file name.',
              content: { 'application/json': { schema: ref('UploadResponse') } },
            },
            ...VALIDATION_ERROR,
            '413': ERROR_RESPONSE,
            '422': ERROR_RESPONSE,
          },
        },
      },

      '/api/analyze': {
        post: {
          tags: ['Analysis'],
          summary: 'Score one resume against one posting',
          description:
            'Results are cached for 24h by `sha256(resume + posting)`; a cache hit is served immediately and ' +
            'carries an `X-Cache: HIT` header.',
          requestBody: jsonBody('AnalyzeRequest'),
          responses: {
            ...sseResponse('The analysis, flushed section by section.', [
              'match_score',
              'summary',
              'category_scores',
              'strengths',
              'gaps',
              'recommendations',
              'keywords',
              'red_flags',
              'ats_score',
              'done',
              'error',
            ]),
            ...VALIDATION_ERROR,
            ...RATE_LIMITED,
          },
        },
      },

      '/api/analyze/batch': {
        post: {
          tags: ['Analysis'],
          summary: 'Score one resume against several postings and rank them',
          description:
            `Up to ${BATCH_MAX_JOBS} postings, three analysed at a time, each result streamed as it lands. ` +
            'A posting that fails emits `job_error` and the batch carries on. The closing `ranking` event lists ' +
            'the postings that succeeded, highest score first. Disconnecting cancels the postings not yet started.',
          requestBody: jsonBody('BatchAnalyzeRequest'),
          responses: {
            ...sseResponse('One result per posting, then the ranking.', [
              'batch_start',
              'job_start',
              'job_result',
              'job_error',
              'ranking',
              'done',
              'error',
            ]),
            ...VALIDATION_ERROR,
            ...RATE_LIMITED,
          },
        },
      },

      '/api/analyze/generate': {
        post: {
          tags: ['Generation'],
          summary: 'Generate the requested application material',
          description:
            'One Claude call produces every target ticked in `targets`; each section is flushed as it closes. ' +
            "The resume comes back as JSON mirroring the candidate's own section order, the letters as plain text.",
          requestBody: jsonBody('GenerateRequest'),
          responses: {
            ...sseResponse('One `section` per requested target.', [
              'section_start',
              'delta',
              'section',
              'section_error',
              'done',
              'error',
            ]),
            ...VALIDATION_ERROR,
            ...RATE_LIMITED,
          },
        },
      },

      '/api/analyze/follow-up': {
        post: {
          tags: ['Generation'],
          summary: 'Generate a post-interview follow-up email',
          requestBody: jsonBody('FollowUpRequest'),
          responses: {
            ...sseResponse('The email, streamed as text deltas.', ['follow_up', 'done', 'error']),
            ...VALIDATION_ERROR,
            ...RATE_LIMITED,
          },
        },
      },

      '/api/parse-url': {
        post: {
          tags: ['Input'],
          summary: 'Scrape a LinkedIn job posting',
          description: 'LinkedIn URLs only. Postings behind a login wall fail with 422.',
          requestBody: jsonBody('ParseUrlRequest'),
          responses: {
            '200': {
              description: 'Title, company and posting text.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      company: { type: 'string' },
                      jobPosting: { type: 'string' },
                    },
                    required: ['title', 'company', 'jobPosting'],
                  },
                },
              },
            },
            ...VALIDATION_ERROR,
            '422': ERROR_RESPONSE,
          },
        },
      },

      '/api/webhook/notion': {
        post: {
          tags: ['Export'],
          summary: 'Append an analysis to a Notion database',
          description:
            'The caller supplies their own integration token; nothing is stored server-side.',
          requestBody: jsonBody('NotionWebhookRequest'),
          responses: {
            '200': {
              description: 'URL of the created Notion page.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { url: { type: 'string' } },
                    required: ['url'],
                  },
                },
              },
            },
            ...VALIDATION_ERROR,
            ...RATE_LIMITED,
          },
        },
      },

      '/api/webhook/airtable': {
        post: {
          tags: ['Export'],
          summary: 'Append an analysis to an Airtable table',
          description: 'The caller supplies their own API key; nothing is stored server-side.',
          requestBody: jsonBody('AirtableWebhookRequest'),
          responses: {
            '200': {
              description: 'ID of the created Airtable record.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { id: { type: 'string' } },
                    required: ['id'],
                  },
                },
              },
            },
            ...VALIDATION_ERROR,
            ...RATE_LIMITED,
          },
        },
      },
    },
    components: { schemas: jsonSchemas() },
  };
}
