import { NextFunction, Request, Response } from 'express';

import { streamAnalysis } from '../services/claude.service.js';
import { AnalyzeRequest } from '../schemas/analyze.schema.js';

export async function analyzeResume(
  req: Request<object, object, AnalyzeRequest>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { resumeText, jobPosting, language } = req.body;
    await streamAnalysis(res, resumeText, jobPosting, language);
  } catch (err) {
    next(err);
  }
}
