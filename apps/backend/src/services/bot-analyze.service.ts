import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env.js';
import { extractJson } from '../lib/extract-json.js';
import { buildAnalyzePrompt } from '../prompts/analyze.prompt.js';
import { AnalysisResult, analysisResultSchema } from '../schemas/analyze.schema.js';

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export async function analyzeForBot(
  resumeText: string,
  jobPosting: string,
): Promise<AnalysisResult> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    // Same prompt as the SSE analysis — needs ~5k output tokens, not 4096.
    max_tokens: 16000,
    thinking: { type: 'disabled' },
    messages: [{ role: 'user', content: buildAnalyzePrompt(resumeText, jobPosting, 'auto') }],
  });

  if (message.stop_reason === 'max_tokens') {
    throw new Error('The analysis was cut off before it finished.');
  }

  const block = message.content[0];
  if (block.type !== 'text') throw new Error('Unexpected Claude response type');

  return analysisResultSchema.parse(extractJson(block.text));
}
