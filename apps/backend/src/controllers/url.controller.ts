import { NextFunction, Request, Response } from 'express';

import { AppError } from '../middleware/error.middleware.js';
import { ParseUrlRequest } from '../schemas/url.schema.js';
import { parseLinkedInJobUrl } from '../services/url.service.js';

export async function parseJobUrl(
  req: Request<object, object, ParseUrlRequest>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { url } = req.body;
    const result = await parseLinkedInJobUrl(url);
    res.json(result);
  } catch (err) {
    if (err instanceof AppError) return next(err);
    const message = err instanceof Error ? err.message : 'Failed to parse job URL';
    next(new AppError(422, message));
  }
}
