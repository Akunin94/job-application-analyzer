import { NextFunction, Request, Response } from 'express';

import { streamBatchAnalysis } from '../services/batch.service.js';
import { BatchAnalyzeRequest } from '../schemas/analyze.schema.js';

export async function analyzeBatch(
  req: Request<object, object, BatchAnalyzeRequest>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { resumeText, jobs, language } = req.body;
    await streamBatchAnalysis(res, resumeText, jobs, language);
  } catch (err) {
    next(err);
  }
}
