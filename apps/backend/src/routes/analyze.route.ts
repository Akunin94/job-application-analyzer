import { Router } from 'express';

import { analyzeResume } from '../controllers/analyze.controller.js';
import { analyzeBatch } from '../controllers/batch.controller.js';
import { generateApplication } from '../controllers/generate.controller.js';
import { generateFollowUpEmail } from '../controllers/followup.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  analyzeRequestSchema,
  batchAnalyzeRequestSchema,
  followUpRequestSchema,
  generateRequestSchema,
} from '../schemas/analyze.schema.js';

export const analyzeRouter: Router = Router();

analyzeRouter.post('/', validate(analyzeRequestSchema), analyzeResume);
analyzeRouter.post('/batch', validate(batchAnalyzeRequestSchema), analyzeBatch);
analyzeRouter.post('/generate', validate(generateRequestSchema), generateApplication);
analyzeRouter.post('/follow-up', validate(followUpRequestSchema), generateFollowUpEmail);
