import { Router } from 'express';

import { parseJobUrl } from '../controllers/url.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { parseUrlRequestSchema } from '../schemas/url.schema.js';

export const urlRouter: Router = Router();

urlRouter.post('/', validate(parseUrlRequestSchema), parseJobUrl);
