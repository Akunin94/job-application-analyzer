import { NextFunction, Request, Response } from 'express';

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
    next(err);
  }
}
