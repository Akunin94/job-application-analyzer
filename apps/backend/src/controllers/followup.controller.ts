import { NextFunction, Request, Response } from 'express';

import { FollowUpRequest } from '../schemas/analyze.schema.js';
import { streamFollowUpEmail } from '../services/claude.service.js';

export async function generateFollowUpEmail(
  req: Request<object, object, FollowUpRequest>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const {
      resumeText,
      jobPosting,
      analysis,
      interviewerName,
      interviewDate,
      keyPoints,
      language,
    } = req.body;
    await streamFollowUpEmail(
      res,
      resumeText,
      jobPosting,
      analysis,
      interviewerName,
      interviewDate,
      keyPoints,
      language,
    );
  } catch (err) {
    next(err);
  }
}
