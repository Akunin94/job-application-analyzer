import { Router, Request, Response } from 'express';

export const healthRouter: Router = Router();

healthRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});
