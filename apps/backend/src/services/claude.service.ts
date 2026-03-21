import Anthropic from '@anthropic-ai/sdk';
import { Response } from 'express';

import { env } from '../config/env.js';
import { buildAnalyzePrompt } from '../prompts/analyze.prompt.js';
import { buildCoverLetterPrompt } from '../prompts/coverletter.prompt.js';
import { AnalysisResult, analysisResultSchema } from '../schemas/analyze.schema.js';

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const MODEL = 'claude-sonnet-4-20250514';

function setSSEHeaders(res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
}

function sendEvent(res: Response, type: string, data: unknown): void {
  res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function streamAnalysis(
  res: Response,
  resumeText: string,
  jobPosting: string,
): Promise<void> {
  setSSEHeaders(res);

  try {
    let accumulated = '';

    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content: buildAnalyzePrompt(resumeText, jobPosting) }],
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        accumulated += chunk.delta.text;
      }
    }

    const parsed = analysisResultSchema.parse(JSON.parse(accumulated));

    sendEvent(res, 'match_score', { score: parsed.matchScore, confidence: parsed.confidence });
    sendEvent(res, 'category_scores', parsed.categoryScores);
    sendEvent(res, 'strengths', parsed.strengths);
    sendEvent(res, 'gaps', parsed.skillGaps);
    sendEvent(res, 'recommendations', parsed.recommendations);
    sendEvent(res, 'red_flags', parsed.redFlags);
    sendEvent(res, 'done', null);
  } catch (err) {
    sendEvent(res, 'error', {
      message: err instanceof Error ? err.message : 'Analysis failed',
    });
  } finally {
    res.end();
  }
}

export async function streamCoverLetter(
  res: Response,
  resumeText: string,
  jobPosting: string,
  analysis: AnalysisResult,
): Promise<void> {
  setSSEHeaders(res);

  try {
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: buildCoverLetterPrompt(resumeText, jobPosting, analysis),
        },
      ],
    });

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta' &&
        chunk.delta.text
      ) {
        sendEvent(res, 'cover_letter', chunk.delta.text);
      }
    }

    sendEvent(res, 'done', null);
  } catch (err) {
    sendEvent(res, 'error', {
      message: err instanceof Error ? err.message : 'Cover letter generation failed',
    });
  } finally {
    res.end();
  }
}
