import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env.js';
import { buildAnalyzePrompt } from '../prompts/analyze.prompt.js';
import { AnalysisResult, analysisResultSchema } from '../schemas/analyze.schema.js';

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export async function analyzeForBot(
  resumeText: string,
  jobPosting: string,
): Promise<AnalysisResult> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: buildAnalyzePrompt(resumeText, jobPosting, 'auto') }],
  });

  const block = message.content[0];
  if (block.type !== 'text') throw new Error('Unexpected Claude response type');

  return analysisResultSchema.parse(JSON.parse(block.text));
}
