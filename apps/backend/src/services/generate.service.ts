import Anthropic from '@anthropic-ai/sdk';
import { Response } from 'express';

import { env } from '../config/env.js';
import { extractJson } from '../lib/extract-json.js';
import { SectionStream } from '../lib/section-stream.js';
import { sendEvent, setSSEHeaders } from '../lib/sse.js';
import { buildGeneratePrompt, END_MARKER, SECTION_MARKER } from '../prompts/generate.prompt.js';
import {
  GenerateRequest,
  GenerateTarget,
  generatedResumeSchema,
} from '../schemas/analyze.schema.js';

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const MODEL = 'claude-sonnet-5';

// Worst case is a rewritten resume (structured JSON, by far the largest part)
// plus all three letters. 8k covers a two-page resume with room to spare; if a
// long resume ever trips `stop_reason: max_tokens`, the client is told which
// sections did land, so raising this is the fix rather than retrying blind.
const GENERATE_MAX_TOKENS = 8000;

const MARKERS = (Object.entries(SECTION_MARKER) as Array<[GenerateTarget, string]>).map(
  ([target, marker]) => ({ target, marker }),
);

/** Letters stream as they are written; the resume is JSON, so it is only useful once complete. */
const STREAMS_AS_TEXT: ReadonlySet<GenerateTarget> = new Set<GenerateTarget>([
  'coverLetter',
  'companyEmail',
  'hrMessage',
]);

/** "Subject: …\n\n<body>" — the shape the company-email prompt asks for. */
function splitEmail(raw: string): { subject: string; body: string } {
  const text = raw.trim();
  const match = /^subject:\s*(.+)$/im.exec(text);
  if (!match) return { subject: '', body: text };

  const body = text.slice(match.index + match[0].length).trim();
  return { subject: match[1].trim(), body };
}

function parseSection(target: GenerateTarget, raw: string): unknown {
  if (target === 'resume') return generatedResumeSchema.parse(extractJson(raw));
  if (target === 'companyEmail') return splitEmail(raw);
  return raw.trim();
}

/**
 * Streams every requested artifact from a single Claude call. The model
 * separates them with sentinel markers, so each one can be flushed to the
 * client the moment it is finished instead of waiting for the whole response —
 * which also keeps the connection alive past proxy idle timeouts.
 */
export async function streamGeneration(res: Response, req: GenerateRequest): Promise<void> {
  setSSEHeaders(res);

  const parser = new SectionStream<GenerateTarget>(MARKERS, END_MARKER, event => {
    switch (event.type) {
      case 'start':
        sendEvent(res, 'section_start', { target: event.target });
        break;

      case 'delta':
        if (STREAMS_AS_TEXT.has(event.target)) {
          sendEvent(res, 'delta', { target: event.target, text: event.text });
        }
        break;

      case 'close':
        try {
          sendEvent(res, 'section', {
            target: event.target,
            data: parseSection(event.target, event.raw),
          });
        } catch (err) {
          sendEvent(res, 'section_error', {
            target: event.target,
            message: err instanceof Error ? err.message : 'Could not parse this section',
          });
        }
        break;
    }
  });

  try {
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: GENERATE_MAX_TOKENS,
      thinking: { type: 'disabled' },
      messages: [{ role: 'user', content: buildGeneratePrompt(req) }],
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        parser.push(chunk.delta.text);
      }
    }

    const final = await stream.finalMessage();
    if (final.stop_reason === 'max_tokens') {
      // Flush what did finish — an early section is still usable — then say so.
      parser.end();
      throw new Error(
        'Generation was cut off before it finished. Try selecting fewer items, or a shorter job posting.',
      );
    }

    parser.end();
    sendEvent(res, 'done', null);
  } catch (err) {
    parser.end();
    sendEvent(res, 'error', {
      message: err instanceof Error ? err.message : 'Generation failed',
    });
  } finally {
    res.end();
  }
}
