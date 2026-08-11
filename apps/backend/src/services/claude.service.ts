import Anthropic from '@anthropic-ai/sdk';
import { Response } from 'express';

import { env } from '../config/env.js';
import { extractJson } from '../lib/extract-json.js';
import { sendEvent, setSSEHeaders } from '../lib/sse.js';
import { buildAnalyzePrompt } from '../prompts/analyze.prompt.js';
import { buildFollowUpPrompt } from '../prompts/followup.prompt.js';
import { AnalysisResult, analysisResultSchema } from '../schemas/analyze.schema.js';
import { cacheKey, getCachedAnalysis, setCachedAnalysis } from './cache.service.js';

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const MODEL = 'claude-sonnet-5';

// The trimmed analysis (score, gaps, keywords, red flags, ATS) is a fraction of
// the old 16k-token payload. 4096 fits a full 12-entry gap list with headroom;
// raise it only if `stop_reason: max_tokens` starts showing up.
const ANALYSIS_MAX_TOKENS = 4096;

function flushResult(res: Response, parsed: AnalysisResult): void {
  sendEvent(res, 'match_score', { score: parsed.matchScore, confidence: parsed.confidence });
  sendEvent(res, 'summary', parsed.summary);
  sendEvent(res, 'category_scores', parsed.categoryScores);
  sendEvent(res, 'strengths', parsed.strengths);
  sendEvent(res, 'gaps', parsed.skillGaps);
  sendEvent(res, 'recommendations', parsed.recommendations);
  sendEvent(res, 'keywords', parsed.keywords);
  sendEvent(res, 'red_flags', parsed.redFlags);
  sendEvent(res, 'ats_score', parsed.atsScore);
  sendEvent(res, 'done', null);
}

export async function streamAnalysis(
  res: Response,
  resumeText: string,
  jobPosting: string,
  language = 'auto',
): Promise<void> {
  setSSEHeaders(res);

  try {
    const key = cacheKey(resumeText, jobPosting);
    const cached = await getCachedAnalysis(key);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      flushResult(res, cached);
      return;
    }

    let accumulated = '';

    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: ANALYSIS_MAX_TOKENS,
      thinking: { type: 'disabled' },
      messages: [{ role: 'user', content: buildAnalyzePrompt(resumeText, jobPosting, language) }],
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        accumulated += chunk.delta.text;
      }
    }

    const final = await stream.finalMessage();
    if (final.stop_reason === 'max_tokens') {
      throw new Error(
        'The analysis was cut off before it finished. Try a shorter job posting or resume.',
      );
    }

    const parsed = analysisResultSchema.parse(extractJson(accumulated));
    void setCachedAnalysis(key, parsed);
    flushResult(res, parsed);
  } catch (err) {
    sendEvent(res, 'error', {
      message: err instanceof Error ? err.message : 'Analysis failed',
    });
  } finally {
    res.end();
  }
}

export async function streamFollowUpEmail(
  res: Response,
  resumeText: string,
  jobPosting: string,
  analysis: AnalysisResult,
  interviewerName: string,
  interviewDate: string,
  keyPoints: string,
  language = 'auto',
): Promise<void> {
  setSSEHeaders(res);

  try {
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 1024,
      thinking: { type: 'disabled' },
      messages: [
        {
          role: 'user',
          content: buildFollowUpPrompt(
            resumeText,
            jobPosting,
            analysis,
            interviewerName,
            interviewDate,
            keyPoints,
            language,
          ),
        },
      ],
    });

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta' &&
        chunk.delta.text
      ) {
        sendEvent(res, 'follow_up', chunk.delta.text);
      }
    }

    sendEvent(res, 'done', null);
  } catch (err) {
    sendEvent(res, 'error', {
      message: err instanceof Error ? err.message : 'Follow-up email generation failed',
    });
  } finally {
    res.end();
  }
}
