import { Response } from 'express';

export function setSSEHeaders(res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
}

export function sendEvent(res: Response, type: string, data: unknown): void {
  res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
}
