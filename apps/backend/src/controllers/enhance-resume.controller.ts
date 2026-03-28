import { NextFunction, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env.js';
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
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: buildEnhanceResumePrompt(resumeText, jobPosting, improvements),
        },
      ],
    });

    const block = message.content[0];
    if (block.type !== 'text') throw new Error('Unexpected response type');

    const result: EnhancedResume = JSON.parse(block.text);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
