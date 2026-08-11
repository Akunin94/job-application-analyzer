import { NextFunction, Request, Response } from 'express';
import { Sentry } from '../config/sentry.js';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorMiddleware(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  if ((err as { type?: string }).type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body too large.' });
  }

  Sentry.captureException(err);
  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
}
