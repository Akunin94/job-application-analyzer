import { NextFunction, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env.js';
import { extractJson } from '../lib/extract-json.js';
import { AppError } from '../middleware/error.middleware.js';
import { buildEnhanceResumePrompt, type EnhancedResume } from '../prompts/enhance-resume.prompt.js';
import { type EnhanceResumeRequest } from '../schemas/analyze.schema.js';

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export async function enhanceResume(
  req: Request<object, object, EnhanceResumeRequest>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { resumeText, jobPosting, improvements } = req.body;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      // A rewritten resume plus its change log easily exceeds 4096 tokens.
      max_tokens: 16000,
      thinking: { type: 'disabled' },
      messages: [
        {
          role: 'user',
          content: buildEnhanceResumePrompt(resumeText, jobPosting, improvements),
        },
      ],
    });

    if (message.stop_reason === 'max_tokens') {
      throw new AppError(502, 'The rewritten resume was cut off before it finished.');
    }

    const block = message.content[0];
    if (block.type !== 'text') throw new Error('Unexpected response type');

    const result = extractJson(block.text) as EnhancedResume;
    res.json(result);
  } catch (err) {
    next(err);
  }
}
