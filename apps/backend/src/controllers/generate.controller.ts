import { Request, Response } from 'express';

import { GenerateRequest } from '../schemas/analyze.schema.js';
import { streamGeneration } from '../services/generate.service.js';

export async function generateApplication(
  req: Request<object, object, GenerateRequest>,
  res: Response,
): Promise<void> {
  await streamGeneration(res, req.body);
}
