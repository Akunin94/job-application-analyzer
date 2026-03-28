import { Router } from 'express';

import { analyzeResume } from '../controllers/analyze.controller.js';
import { generateCoverLetter } from '../controllers/coverletter.controller.js';
import { enhanceResume } from '../controllers/enhance-resume.controller.js';
import { generateFollowUpEmail } from '../controllers/followup.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  analyzeRequestSchema,
  coverLetterRequestSchema,
  enhanceResumeRequestSchema,
  followUpRequestSchema,
} from '../schemas/analyze.schema.js';

export const analyzeRouter: Router = Router();

analyzeRouter.post('/', validate(analyzeRequestSchema), analyzeResume);
analyzeRouter.post('/cover-letter', validate(coverLetterRequestSchema), generateCoverLetter);
analyzeRouter.post('/follow-up', validate(followUpRequestSchema), generateFollowUpEmail);
analyzeRouter.post('/enhance-resume', validate(enhanceResumeRequestSchema), enhanceResume);
