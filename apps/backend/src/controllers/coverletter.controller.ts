import { NextFunction, Request, Response } from 'express';

import { streamCoverLetter } from '../services/claude.service.js';
import { CoverLetterRequest } from '../schemas/analyze.schema.js';

export async function generateCoverLetter(
  req: Request<object, object, CoverLetterRequest>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { resumeText, jobPosting, analysis } = req.body;
    await streamCoverLetter(res, resumeText, jobPosting, analysis);
  } catch (err) {
    next(err);
  }
}
